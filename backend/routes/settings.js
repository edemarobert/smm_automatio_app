import express from 'express';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get user settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      fullName: user.fullName,
      email: user.email,
      company: user.company,
      emailNotifications: user.emailNotifications,
      postReminders: user.postReminders,
      weeklyAnalytics: user.weeklyAnalytics
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user settings
router.put('/', authenticateToken, async (req, res) => {
  try {
    const { fullName, company, emailNotifications, postReminders, weeklyAnalytics } = req.body;
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (fullName) user.fullName = fullName;
    if (company !== undefined) user.company = company;
    if (emailNotifications !== undefined) user.emailNotifications = emailNotifications;
    if (postReminders !== undefined) user.postReminders = postReminders;
    if (weeklyAnalytics !== undefined) user.weeklyAnalytics = weeklyAnalytics;

    user.updatedAt = new Date();
    await user.save();

    res.json({
      message: 'Settings updated successfully',
      user: {
        fullName: user.fullName,
        email: user.email,
        company: user.company,
        emailNotifications: user.emailNotifications,
        postReminders: user.postReminders,
        weeklyAnalytics: user.weeklyAnalytics
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }

    const user = await User.findById(req.user.userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
