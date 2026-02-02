import express from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import Post from '../models/Post.js';
import Account from '../models/Account.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { publishPost } from '../services/socialMediaPublisher.js';

const router = express.Router();

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image format'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Create post
router.post('/', authenticateToken, upload.array('images', 4), [
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('platforms').notEmpty().withMessage('Select at least one platform')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, scheduledFor } = req.body;
    let platforms = req.body.platforms;

    // Parse platforms if it's a JSON string from FormData
    if (typeof platforms === 'string') {
      try {
        platforms = JSON.parse(platforms);
      } catch (e) {
        return res.status(400).json({ message: 'Invalid platforms format' });
      }
    }

    // Convert uploaded files to image objects with base64
    const images = req.files ? req.files.map(file => ({
      url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
      alt: file.originalname.split('.')[0]
    })) : [];

    const post = new Post({
      userId: req.user.userId,
      content,
      platforms,
      images,
      scheduledFor: scheduledFor || null,
      status: scheduledFor ? 'scheduled' : 'draft'
    });

    await post.save();

    // If posting immediately (no scheduled time), publish now
    if (!scheduledFor) {
      const accounts = await Account.find({ userId: req.user.userId });
      if (accounts.length > 0) {
        try {
          const result = await publishPost(post, accounts);

          if (result.successful.length > 0) {
            post.status = 'published';
            post.publishedAt = new Date();
            post.platformResults = result.successful.map(r => ({
              platform: r.platform,
              postId: r.postId,
              url: r.url
            }));
            await post.save();

            // Create success notification
            const platforms = result.successful.map(r => r.platform).join(', ');
            await Notification.create({
              userId: req.user.userId,
              type: 'post_published',
              title: 'Post published successfully',
              message: `Your post was published to: ${platforms}`,
              metadata: { postId: post._id, platforms: result.successful }
            });
          } else if (result.failed.length > 0) {
            // Some platforms failed
            const errors = result.failed.map(r => `${r.platform}: ${r.error}`).join(', ');
            await Notification.create({
              userId: req.user.userId,
              type: 'post_partially_failed',
              title: 'Post partially published',
              message: `Failed on: ${errors}`,
              metadata: { postId: post._id, errors: result.failed }
            });
          }
        } catch (err) {
          console.error('Error publishing post immediately:', err);
          await Notification.create({
            userId: req.user.userId,
            type: 'post_failed',
            title: 'Post failed to publish',
            message: err.message,
            metadata: { postId: post._id }
          });
        }
      }
    } else if (scheduledFor) {
      const user = await User.findById(req.user.userId).select('postReminders');
      if (user?.postReminders) {
        await Notification.create({
          userId: req.user.userId,
          type: 'post_scheduled',
          title: 'Post scheduled',
          message: `Your post is scheduled for ${new Date(scheduledFor).toLocaleString()}`,
          metadata: { postId: post._id }
        });
      }
    }

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all posts for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = { userId: req.user.userId };
    if (status) query.status = status;

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single post
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post || post.userId.toString() !== req.user.userId) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update post
router.put('/:id', authenticateToken, upload.array('images', 4), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post || post.userId.toString() !== req.user.userId) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.status === 'published') {
      return res.status(400).json({ message: 'Cannot edit published posts' });
    }

    const { content, platforms, scheduledFor } = req.body;

    if (content) post.content = content;
    if (platforms) {
      let parsedPlatforms = platforms;
      if (typeof platforms === 'string') {
        try {
          parsedPlatforms = JSON.parse(platforms);
        } catch (e) {
          return res.status(400).json({ message: 'Invalid platforms format' });
        }
      }
      post.platforms = parsedPlatforms;
    }
    
    // Add new images to existing ones
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
        alt: file.originalname.split('.')[0]
      }));
      post.images = [...post.images, ...newImages];
    }
    
    if (scheduledFor) {
      post.scheduledFor = scheduledFor;
      post.status = 'scheduled';
    }

    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete post
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post || post.userId.toString() !== req.user.userId) {
      return res.status(404).json({ message: 'Post not found' });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Publish post immediately
router.post('/:id/publish', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post || post.userId.toString() !== req.user.userId) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.status = 'published';
    post.publishedAt = new Date();
    await post.save();

    await Notification.create({
      userId: req.user.userId,
      type: 'post_published',
      title: 'Post published',
      message: 'Your post has been published successfully.',
      metadata: { postId: post._id }
    });

    res.json({ message: 'Post published', post });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
