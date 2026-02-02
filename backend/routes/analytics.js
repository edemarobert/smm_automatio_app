import express from 'express';
import Post from '../models/Post.js';
import Analytics from '../models/Analytics.js';
import Account from '../models/Account.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard stats
router.get('/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get followers count
    const accounts = await Account.find({ userId, isConnected: true });
    const totalFollowers = accounts.reduce((sum, acc) => sum + acc.followers, 0);

    // Get posts data
    const posts = await Post.find({ userId });
    const publishedPosts = posts.filter(p => p.status === 'published');
    
    const totalLikes = publishedPosts.reduce((sum, p) => sum + (p.metrics.likes || 0), 0);
    const totalEngagement = publishedPosts.reduce((sum, p) => sum + (p.metrics.engagement || 0), 0);
    const avgEngagementRate = publishedPosts.length > 0 
      ? (totalEngagement / publishedPosts.length).toFixed(2)
      : 0;

    res.json({
      totalFollowers,
      totalPosts: publishedPosts.length,
      engagementRate: avgEngagementRate,
      totalLikes,
      platformsConnected: accounts.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get analytics for a period
router.get('/period', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, platform } = req.query;
    const userId = req.user.userId;

    let query = { userId };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (platform) query.platform = platform;

    const analytics = await Analytics.find(query).sort({ date: -1 });
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get top performing posts
router.get('/top-posts', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const userId = req.user.userId;

    const posts = await Post.find({ 
      userId, 
      status: 'published' 
    })
    .sort({ 'metrics.engagement': -1 })
    .limit(parseInt(limit));

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get platform statistics
router.get('/platform-stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const accounts = await Account.find({ userId, isConnected: true });

    const stats = await Promise.all(
      accounts.map(async (account) => {
        const posts = await Post.find({
          userId,
          'platforms': { [account.platform]: true },
          status: 'published'
        });

        const totalMetrics = posts.reduce((sum, post) => ({
          likes: sum.likes + (post.metrics.likes || 0),
          comments: sum.comments + (post.metrics.comments || 0),
          shares: sum.shares + (post.metrics.shares || 0),
          engagement: sum.engagement + (post.metrics.engagement || 0)
        }), { likes: 0, comments: 0, shares: 0, engagement: 0 });

        return {
          platform: account.platform,
          followers: account.followers,
          posts: posts.length,
          ...totalMetrics
        };
      })
    );

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
