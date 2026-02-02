import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';

/**
 * Social Media Publishing Service
 * Handles posting to various platforms using their APIs
 */

export const publishToTwitter = async (content, imageUrls = [], accessToken, accessTokenSecret) => {
  try {
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: accessToken,
      accessSecret: accessTokenSecret,
    });

    const rwClient = client.readWrite;

    // Handle image uploads if present
    let mediaIds = [];
    if (imageUrls && imageUrls.length > 0) {
      for (const imageUrl of imageUrls) {
        try {
          // Convert base64 to buffer if needed
          let imageBuffer;
          if (imageUrl.startsWith('data:')) {
            const base64Data = imageUrl.split(',')[1];
            imageBuffer = Buffer.from(base64Data, 'base64');
          } else {
            // Fetch image from URL
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            imageBuffer = response.data;
          }

          // Upload media
          const media = await rwClient.v1.uploadMedia(imageBuffer, {
            mimeType: 'image/jpeg'
          });
          mediaIds.push(media.media_id_string);
        } catch (err) {
          console.warn(`Failed to upload image for Twitter: ${err.message}`);
        }
      }
    }

    // Post tweet
    const tweetParams = {
      text: content
    };

    if (mediaIds.length > 0) {
      tweetParams.media = { media_ids: mediaIds };
    }

    const tweet = await rwClient.v2.tweet(tweetParams);
    return {
      success: true,
      platform: 'twitter',
      postId: tweet.data.id,
      url: `https://twitter.com/i/web/status/${tweet.data.id}`
    };
  } catch (error) {
    console.error('Twitter publishing error:', error);
    return {
      success: false,
      platform: 'twitter',
      error: error.message
    };
  }
};

export const publishToFacebook = async (content, imageUrls = [], pageAccessToken, pageId) => {
  try {
    const postData = {
      message: content
    };

    // Add image if present
    if (imageUrls && imageUrls.length > 0) {
      postData.picture = imageUrls[0]; // Facebook takes one image
    }

    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${pageId}/feed`,
      postData,
      {
        params: { access_token: pageAccessToken }
      }
    );

    return {
      success: true,
      platform: 'facebook',
      postId: response.data.id,
      url: `https://facebook.com/${response.data.id}`
    };
  } catch (error) {
    console.error('Facebook publishing error:', error);
    return {
      success: false,
      platform: 'facebook',
      error: error.response?.data?.error?.message || error.message
    };
  }
};

export const publishToInstagram = async (content, imageUrls = [], businessAccountId, accessToken) => {
  try {
    // Instagram Business API requires image first, then create post with caption
    if (!imageUrls || imageUrls.length === 0) {
      throw new Error('Instagram requires at least one image');
    }

    // Create container for image
    const containerResponse = await axios.post(
      `https://graph.instagram.com/v18.0/${businessAccountId}/media`,
      {
        image_url: imageUrls[0],
        caption: content
      },
      {
        params: { access_token: accessToken }
      }
    );

    // Publish container
    const publishResponse = await axios.post(
      `https://graph.instagram.com/v18.0/${businessAccountId}/media_publish`,
      {
        creation_id: containerResponse.data.id
      },
      {
        params: { access_token: accessToken }
      }
    );

    return {
      success: true,
      platform: 'instagram',
      postId: publishResponse.data.id,
      url: `https://instagram.com/p/${publishResponse.data.id}`
    };
  } catch (error) {
    console.error('Instagram publishing error:', error);
    return {
      success: false,
      platform: 'instagram',
      error: error.response?.data?.error?.message || error.message
    };
  }
};

export const publishToLinkedIn = async (content, imageUrls = [], accessToken, personUrn) => {
  try {
    const postContent = {
      commentary: content,
      visibility: 'PUBLIC'
    };

    // Add image media if present
    if (imageUrls && imageUrls.length > 0) {
      postContent.media = {
        title: 'Shared Image',
        media: imageUrls[0]
      };
    }

    const response = await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      {
        author: personUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.PublishContent': postContent
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    );

    return {
      success: true,
      platform: 'linkedin',
      postId: response.data.id,
      url: `https://www.linkedin.com/feed/update/${response.data.id}`
    };
  } catch (error) {
    console.error('LinkedIn publishing error:', error);
    return {
      success: false,
      platform: 'linkedin',
      error: error.response?.data?.serviceErrorCode || error.message
    };
  }
};

/**
 * Main publish function that handles all platforms
 */
export const publishPost = async (post, accounts) => {
  try {
    const results = {
      successful: [],
      failed: []
    };

    // Get image URLs from post
    const imageUrls = post.images ? post.images.map(img => img.url) : [];

    // Publish to each selected platform
    for (const [platform, isSelected] of Object.entries(post.platforms)) {
      if (!isSelected) continue;

      const account = accounts.find(acc => acc.platform === platform);
      if (!account) {
        results.failed.push({
          platform,
          error: 'No connected account'
        });
        continue;
      }

      let result;
      switch (platform) {
        case 'twitter':
          result = await publishToTwitter(
            post.content,
            imageUrls,
            account.accessToken,
            account.accessTokenSecret
          );
          break;
        case 'facebook':
          result = await publishToFacebook(
            post.content,
            imageUrls,
            account.accessToken,
            account.pageId
          );
          break;
        case 'instagram':
          result = await publishToInstagram(
            post.content,
            imageUrls,
            account.businessAccountId,
            account.accessToken
          );
          break;
        case 'linkedin':
          result = await publishToLinkedIn(
            post.content,
            imageUrls,
            account.accessToken,
            account.personUrn
          );
          break;
        default:
          result = {
            success: false,
            platform,
            error: 'Unknown platform'
          };
      }

      if (result.success) {
        results.successful.push(result);
      } else {
        results.failed.push(result);
      }
    }

    return results;
  } catch (error) {
    console.error('Error publishing post:', error);
    throw error;
  }
};
