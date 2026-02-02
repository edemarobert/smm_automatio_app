import express from 'express';
import axios from 'axios';
import { TwitterApi } from 'twitter-api-v2';
import Account from '../models/Account.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * Twitter OAuth Routes
 */

// Step 1: Generate Twitter OAuth URL
router.get('/twitter/auth-url', (req, res) => {
  try {
    const client = new TwitterApi({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET
    });

    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
      process.env.TWITTER_CALLBACK_URL || 'http://localhost:5000/api/oauth/twitter/callback',
      { state: `smm_${Date.now()}` }
    );

    // Store verifier and state in session or return to client
    res.json({
      authUrl: url,
      state: state,
      codeVerifier: codeVerifier
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Step 2: Handle OAuth callback and exchange code for tokens
router.post('/twitter/callback', authenticateToken, async (req, res) => {
  try {
    const { code, codeVerifier, state } = req.body;

    if (!code || !codeVerifier) {
      return res.status(400).json({ message: 'Code and codeVerifier are required' });
    }

    const client = new TwitterApi({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET
    });

    // Exchange code for tokens
    const { client: authenticatedClient, accessToken, refreshToken, expiresIn } = await client.loginWithOAuth2({
      code,
      codeVerifier,
      redirectUri: process.env.TWITTER_CALLBACK_URL || 'http://localhost:5000/api/oauth/twitter/callback'
    });

    // Get user info
    const user = await authenticatedClient.v2.me({
      'user.fields': ['username', 'public_metrics']
    });

    // Check if account already exists
    const existingAccount = await Account.findOne({
      userId: req.user.userId,
      platform: 'twitter'
    });

    const accountData = {
      userId: req.user.userId,
      platform: 'twitter',
      accountName: user.data.username,
      accountHandle: `@${user.data.username}`,
      accessToken,
      accessTokenSecret: refreshToken, // Store refresh token as secret
      followerCount: user.data.public_metrics?.followers_count || 0,
      isConnected: true
    };

    let account;
    if (existingAccount) {
      // Update existing account
      Object.assign(existingAccount, accountData);
      account = await existingAccount.save();
    } else {
      // Create new account
      account = await Account.create(accountData);
    }

    res.json({
      message: 'Twitter account connected successfully',
      account: {
        _id: account._id,
        platform: account.platform,
        accountName: account.accountName,
        accountHandle: account.accountHandle,
        followerCount: account.followerCount,
        isConnected: true
      }
    });
  } catch (error) {
    console.error('Twitter OAuth error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Facebook OAuth Routes
 */

router.get('/facebook/auth-url', (req, res) => {
  try {
    const scope = 'pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publishing';
    const redirectUri = encodeURIComponent(process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:5000/api/oauth/facebook/callback');
    
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${redirectUri}&scope=${encodeURIComponent(scope)}&state=smm_${Date.now()}`;

    res.json({ authUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/facebook/callback', authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Authorization code is required' });
    }

    // Exchange code for access token
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:5000/api/oauth/facebook/callback',
        code
      }
    });

    const accessToken = tokenResponse.data.access_token;

    // Get user info
    const userResponse = await axios.get('https://graph.facebook.com/me', {
      params: {
        fields: 'id,name,picture',
        access_token: accessToken
      }
    });

    // Get user pages
    const pagesResponse = await axios.get('https://graph.facebook.com/me/accounts', {
      params: {
        access_token: accessToken
      }
    });

    const pages = pagesResponse.data.data || [];
    const primaryPage = pages[0];

    if (!primaryPage) {
      return res.status(400).json({ message: 'No Facebook pages found. Please manage at least one page.' });
    }

    // Check if account already exists for Facebook
    const existingFBAccount = await Account.findOne({
      userId: req.user.userId,
      platform: 'facebook'
    });

    const fbAccountData = {
      userId: req.user.userId,
      platform: 'facebook',
      accountName: primaryPage.name,
      accountHandle: primaryPage.id,
      accessToken: primaryPage.access_token,
      pageId: primaryPage.id,
      isConnected: true
    };

    let fbAccount;
    if (existingFBAccount) {
      Object.assign(existingFBAccount, fbAccountData);
      fbAccount = await existingFBAccount.save();
    } else {
      fbAccount = await Account.create(fbAccountData);
    }

    // Try to get Instagram Business Account linked to this page
    let igAccount = null;
    try {
      const igResponse = await axios.get(
        `https://graph.facebook.com/${primaryPage.id}`,
        {
          params: {
            fields: 'instagram_business_account',
            access_token: primaryPage.access_token
          }
        }
      );

      if (igResponse.data?.instagram_business_account?.id) {
        const businessAccountId = igResponse.data.instagram_business_account.id;

        // Get Instagram account details
        const igDetailsResponse = await axios.get(
          `https://graph.instagram.com/${businessAccountId}`,
          {
            params: {
              fields: 'id,name,username',
              access_token: primaryPage.access_token
            }
          }
        );

        // Check if Instagram account already exists
        const existingIGAccount = await Account.findOne({
          userId: req.user.userId,
          platform: 'instagram'
        });

        const igAccountData = {
          userId: req.user.userId,
          platform: 'instagram',
          accountName: igDetailsResponse.data.name || igDetailsResponse.data.username || 'Instagram',
          accountHandle: `@${igDetailsResponse.data.username || 'instagram'}`,
          accessToken: primaryPage.access_token,
          businessAccountId: businessAccountId,
          isConnected: true
        };

        if (existingIGAccount) {
          Object.assign(existingIGAccount, igAccountData);
          igAccount = await existingIGAccount.save();
        } else {
          igAccount = await Account.create(igAccountData);
        }
      }
    } catch (igError) {
      console.warn('Could not connect Instagram account:', igError.message);
      // Continue anyway - Instagram connection is optional
    }

    res.json({
      message: 'Facebook page connected successfully' + (igAccount ? ' and Instagram account linked' : ''),
      account: {
        _id: fbAccount._id,
        platform: fbAccount.platform,
        accountName: fbAccount.accountName,
        accountHandle: fbAccount.accountHandle,
        isConnected: true
      },
      instagramAccount: igAccount ? {
        _id: igAccount._id,
        platform: igAccount.platform,
        accountName: igAccount.accountName,
        accountHandle: igAccount.accountHandle,
        isConnected: true
      } : null
    });
  } catch (error) {
    console.error('Facebook OAuth error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * LinkedIn OAuth Routes
 */

router.get('/linkedin/auth-url', (req, res) => {
  try {
    const scope = 'w_member_social,r_basicprofile';
    const redirectUri = encodeURIComponent(process.env.LINKEDIN_CALLBACK_URL || 'http://localhost:5000/api/oauth/linkedin/callback');
    
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${encodeURIComponent(scope)}&state=smm_${Date.now()}`;

    res.json({ authUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/linkedin/callback', authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Authorization code is required' });
    }

    // Exchange code for access token
    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        redirect_uri: process.env.LINKEDIN_CALLBACK_URL || 'http://localhost:5000/api/oauth/linkedin/callback'
      }
    });

    const accessToken = tokenResponse.data.access_token;

    // Get user info
    const userResponse = await axios.get('https://api.linkedin.com/v2/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const personUrn = userResponse.data.id;
    const firstName = userResponse.data.localizedFirstName || '';
    const lastName = userResponse.data.localizedLastName || '';

    // Check if account already exists
    const existingAccount = await Account.findOne({
      userId: req.user.userId,
      platform: 'linkedin'
    });

    const accountData = {
      userId: req.user.userId,
      platform: 'linkedin',
      accountName: `${firstName} ${lastName}`.trim(),
      accountHandle: personUrn,
      accessToken,
      personUrn,
      isConnected: true
    };

    let account;
    if (existingAccount) {
      Object.assign(existingAccount, accountData);
      account = await existingAccount.save();
    } else {
      account = await Account.create(accountData);
    }

    res.json({
      message: 'LinkedIn account connected successfully',
      account: {
        _id: account._id,
        platform: account.platform,
        accountName: account.accountName,
        accountHandle: account.accountHandle,
        isConnected: true
      }
    });
  } catch (error) {
    console.error('LinkedIn OAuth error:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
