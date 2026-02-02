import schedule from 'node-schedule';
import Post from '../models/Post.js';
import Account from '../models/Account.js';
import { publishPost } from './socialMediaPublisher.js';
import Notification from '../models/Notification.js';

/**
 * Scheduled Post Handler
 * Checks for scheduled posts and publishes them at the right time
 */

let scheduledJobs = new Map();

export const startScheduler = () => {
  console.log('Starting post scheduler...');

  // Run every minute to check for posts
  schedule.scheduleJob('* * * * *', async () => {
    try {
      const now = new Date();

      // Find posts scheduled for right now
      const scheduledPosts = await Post.find({
        status: 'scheduled',
        scheduledFor: { $lte: now }
      }).populate('userId');

      for (const post of scheduledPosts) {
        try {
          // Get user's connected accounts
          const accounts = await Account.find({ userId: post.userId });

          if (accounts.length === 0) {
            post.status = 'failed';
            post.updatedAt = new Date();
            await post.save();

            // Create notification
            await Notification.create({
              userId: post.userId,
              type: 'post_failed',
              title: 'Post failed to publish',
              message: 'No connected social media accounts found.',
              metadata: { postId: post._id }
            });
            continue;
          }

          // Publish post
          const result = await publishPost(post, accounts);

          // Update post status
          if (result.successful.length > 0) {
            post.status = 'published';
            post.publishedAt = new Date();

            // Store platform results
            post.platformResults = result.successful.map(r => ({
              platform: r.platform,
              postId: r.postId,
              url: r.url
            }));

            await post.save();

            // Create success notification
            const platforms = result.successful.map(r => r.platform).join(', ');
            await Notification.create({
              userId: post.userId,
              type: 'post_published',
              title: 'Post published successfully',
              message: `Your post was published to: ${platforms}`,
              metadata: { postId: post._id, platforms: result.successful }
            });
          } else {
            post.status = 'failed';
            post.updatedAt = new Date();
            await post.save();

            // Create failure notification
            const errors = result.failed.map(r => `${r.platform}: ${r.error}`).join(', ');
            await Notification.create({
              userId: post.userId,
              type: 'post_failed',
              title: 'Post failed to publish',
              message: errors,
              metadata: { postId: post._id, errors: result.failed }
            });
          }
        } catch (err) {
          console.error(`Error publishing post ${post._id}:`, err);

          post.status = 'failed';
          post.updatedAt = new Date();
          await post.save();

          // Create error notification
          await Notification.create({
            userId: post.userId,
            type: 'post_failed',
            title: 'Post failed to publish',
            message: err.message,
            metadata: { postId: post._id }
          });
        }
      }
    } catch (error) {
      console.error('Error in post scheduler:', error);
    }
  });
};

export const stopScheduler = () => {
  console.log('Stopping post scheduler...');
  schedule.gracefulShutdown();
};

/**
 * Reschedule a specific post
 */
export const reschedulePost = async (postId) => {
  try {
    const post = await Post.findById(postId);
    if (!post || post.status !== 'scheduled') {
      return false;
    }
    // The main scheduler will pick it up
    return true;
  } catch (error) {
    console.error('Error rescheduling post:', error);
    return false;
  }
};
