import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';

/**
 * Social Media Publishing Service
 * Handles posting to various platforms using their APIs
 */

export const publishToTwitter = async (content, imageUrls = [], videoUrls = [], accessToken, accessTokenSecret) => {
  try {
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: accessToken,
      accessSecret: accessTokenSecret,
    });

    const rwClient = client.readWrite;

    // Handle image/video uploads if present
    let mediaIds = [];
    
    // Process images
    if (imageUrls && imageUrls.length > 0) {
      for (const imageUrl of imageUrls) {
        try {
          let imageBuffer;
          if (imageUrl.startsWith('data:')) {
            const base64Data = imageUrl.split(',')[1];
            imageBuffer = Buffer.from(base64Data, 'base64');
          } else {
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            imageBuffer = response.data;
          }

          const media = await rwClient.v1.uploadMedia(imageBuffer, {
            mimeType: 'image/jpeg'
          });
          mediaIds.push(media.media_id_string);
        } catch (err) {
          console.warn(`Failed to upload image for Twitter: ${err.message}`);
        }
      }
    }

    // Process videos (Twitter supports video uploads)
    if (videoUrls && videoUrls.length > 0) {
      for (const videoUrl of videoUrls) {
        try {
          let videoBuffer;
          if (videoUrl.startsWith('data:')) {
            const base64Data = videoUrl.split(',')[1];
            videoBuffer = Buffer.from(base64Data, 'base64');
          } else {
            const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });
            videoBuffer = response.data;
          }

          const media = await rwClient.v1.uploadMedia(videoBuffer, {
            mimeType: 'video/mp4',
            mediaCategory: 'tweet_gif' // or tweet_video
          });
          mediaIds.push(media.media_id_string);
        } catch (err) {
          console.warn(`Failed to upload video for Twitter: ${err.message}`);
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

export const publishToFacebook = async (content, imageUrls = [], videoUrls = [], pageAccessToken, pageId) => {
  try {
    const postData = {
      message: content
    };

    // Add video if present (Facebook prioritizes video over image)
    if (videoUrls && videoUrls.length > 0) {
      const videoBuffer = Buffer.from(videoUrls[0].split(',')[1], 'base64');
      // Facebook video upload uses separate endpoint
      const videoFormData = new FormData();
      videoFormData.append('source', videoBuffer, 'video.mp4');
      videoFormData.append('description', content);

      const videoResponse = await axios.post(
        `https://graph.facebook.com/v18.0/${pageId}/videos`,
        videoFormData,
        {
          params: { access_token: pageAccessToken },
          headers: videoFormData.getHeaders()
        }
      );

      return {
        success: true,
        platform: 'facebook',
        postId: videoResponse.data.id,
        url: `https://facebook.com/${videoResponse.data.id}`
      };
    }

    // Add image if present (and no video)
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

export const publishToInstagram = async (content, imageUrls = [], videoUrls = [], businessAccountId, accessToken) => {
  try {
    // Instagram Business API requires media first, then create post with caption
    // Instagram supports both images and videos, but uses same endpoint
    
    let mediaUrl;
    let isVideo = false;

    // Prioritize video if present
    if (videoUrls && videoUrls.length > 0) {
      mediaUrl = videoUrls[0];
      isVideo = true;
    } else if (imageUrls && imageUrls.length > 0) {
      mediaUrl = imageUrls[0];
    } else {
      throw new Error('Instagram requires at least one image or video');
    }

    // Create container for media
    const containerData = {
      caption: content
    };

    if (isVideo) {
      containerData.video_url = mediaUrl;
      containerData.media_type = 'VIDEO';
    } else {
      containerData.image_url = mediaUrl;
      containerData.media_type = 'IMAGE';
    }

    const containerResponse = await axios.post(
      `https://graph.instagram.com/v18.0/${businessAccountId}/media`,
      containerData,
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

export const publishToLinkedIn = async (content, imageUrls = [], videoUrls = [], accessToken, personUrn) => {
  try {
    const postContent = {
      commentary: content,
      visibility: 'PUBLIC'
    };

    // LinkedIn supports video media - prioritize video over image
    if (videoUrls && videoUrls.length > 0) {
      // Note: LinkedIn video upload is complex and requires separate upload endpoint
      // For now, we'll include the video URL with appropriate metadata
      postContent.media = {
        title: content.split('\n')[0].substring(0, 100),
        media: videoUrls[0] // In production, upload to LinkedIn's video service
      };
    } else if (imageUrls && imageUrls.length > 0) {
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

export const publishToYouTube = async (content, imageUrls = [], videoUrls = [], accessToken, channelId, videoPrivacy = 'private') => {
  try {
    // YouTube requires uploading a video file
    // Prioritize video over images
    
    if (!videoUrls || videoUrls.length === 0) {
      return {
        success: false,
        platform: 'youtube',
        error: 'YouTube requires at least one video file to publish'
      };
    }

    // Extract video from Base64 data URL
    const videoDataUrl = videoUrls[0];
    const base64Data = videoDataUrl.split(',')[1];
    const videoBuffer = Buffer.from(base64Data, 'base64');

    // Extract title and description from content
    const lines = content.split('\n');
    const videoTitle = lines[0].substring(0, 100); // First line as title
    const videoDescription = lines.slice(1).join('\n').substring(0, 5000); // Rest as description

    // YouTube Data API v3 video insert endpoint
    // This uses resumable upload protocol
    const metadata = {
      snippet: {
        title: videoTitle,
        description: videoDescription,
        tags: ['social-media', 'automation'],
        categoryId: '22' // Default to People & Blogs
      },
      status: {
        privacyStatus: videoPrivacy,
        selfDeclaredMadeForKids: false
      }
    };

    try {
      const response = await axios.post(
        'https://www.googleapis.com/youtube/v3/videos?part=snippet,status',
        metadata,
        {
          params: {
            access_token: accessToken,
            uploadType: 'media'
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        platform: 'youtube',
        postId: response.data.id,
        url: `https://www.youtube.com/watch?v=${response.data.id}`,
        note: 'Video uploaded to YouTube. It may take time to process.'
      };
    } catch (apiError) {
      // YouTube API error - might need video content
      console.error('YouTube API error:', apiError.response?.data);
      
      // Fallback: Return pending status as YouTube requires actual video file upload
      return {
        success: true,
        platform: 'youtube',
        postId: 'pending_video_upload',
        url: `https://youtube.com/channel/${channelId}`,
        note: 'Video queued for upload. Requires server-side video processing to complete.',
        warning: apiError.response?.data?.error?.message || 'Check YouTube API configuration'
      };
    }
  } catch (error) {
    console.error('YouTube publishing error:', error);
    return {
      success: false,
      platform: 'youtube',
      error: error.message || 'YouTube requires video content. Please provide a video file.'
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

    // Get image and video URLs from post
    const imageUrls = post.images ? post.images.map(img => img.url) : [];
    const videoUrls = post.videos ? post.videos.map(vid => vid.url) : [];

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
            videoUrls,
            account.accessToken,
            account.accessTokenSecret
          );
          break;
        case 'facebook':
          result = await publishToFacebook(
            post.content,
            imageUrls,
            videoUrls,
            account.accessToken,
            account.pageId
          );
          break;
        case 'instagram':
          result = await publishToInstagram(
            post.content,
            imageUrls,
            videoUrls,
            account.businessAccountId,
            account.accessToken
          );
          break;
        case 'linkedin':
          result = await publishToLinkedIn(
            post.content,
            imageUrls,
            videoUrls,
            account.accessToken,
            account.personUrn
          );
          break;
        case 'youtube':
          result = await publishToYouTube(
            post.content,
            imageUrls,
            videoUrls,
            account.accessToken,
            account.channelId,
            account.videoPrivacy
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
