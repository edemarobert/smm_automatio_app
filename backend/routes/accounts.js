import express from 'express';
import { body, validationResult } from 'express-validator';
import Account from '../models/Account.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Connect social media account
router.post('/', authenticateToken, [
  body('platform').isIn(['instagram', 'twitter', 'facebook', 'linkedin']).withMessage('Invalid platform'),
  body('accountName').trim().notEmpty().withMessage('Account name is required'),
  body('accountHandle').trim().notEmpty().withMessage('Account handle is required'),
  body('accessToken').notEmpty().withMessage('Access token is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { platform, accountName, accountHandle, accessToken, refreshToken, profileImage } = req.body;

    // Check if account already exists
    const existingAccount = await Account.findOne({
      userId: req.user.userId,
      platform
    });

    if (existingAccount) {
      return res.status(400).json({ message: `${platform} account already connected` });
    }

    const account = new Account({
      userId: req.user.userId,
      platform,
      accountName,
      accountHandle,
      accessToken,
      refreshToken: refreshToken || null,
      profileImage: profileImage || null
    });

    await account.save();
    res.status(201).json(account);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all connected accounts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.user.userId }).select('-accessToken -refreshToken');
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single account
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const account = await Account.findById(req.params.id).select('-accessToken -refreshToken');
    
    if (!account || account.userId.toString() !== req.user.userId) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.json(account);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update account
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    
    if (!account || account.userId.toString() !== req.user.userId) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const { accountName, followers, isConnected } = req.body;

    if (accountName) account.accountName = accountName;
    if (followers !== undefined) account.followers = followers;
    if (isConnected !== undefined) account.isConnected = isConnected;

    await account.save();
    res.json(account);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Disconnect account
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    
    if (!account || account.userId.toString() !== req.user.userId) {
      return res.status(404).json({ message: 'Account not found' });
    }

    await Account.findByIdAndDelete(req.params.id);
    res.json({ message: 'Account disconnected successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
