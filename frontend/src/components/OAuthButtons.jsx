import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { oauthAPI } from '../services/api';
import Spinner from './Spinner';
import '../styles/components/OAuthButtons.css';

export default function OAuthButtons({ platform, onError, disabled }) {
  const [loading, setLoading] = useState(false);

  const handleOAuthLogin = async () => {
    setLoading(true);
    try {
      let authUrl;

      switch (platform) {
        case 'twitter':{ 
            const twitterResponse = await oauthAPI.getTwitterAuthUrl();
          authUrl = twitterResponse.data.authUrl;
          // Store verifier for callback
          sessionStorage.setItem('twitter_code_verifier', twitterResponse.data.codeVerifier);
          sessionStorage.setItem('twitter_state', twitterResponse.data.state);
          break; 
        }
        case 'facebook': { const fbResponse = await oauthAPI.getFacebookAuthUrl();
          authUrl = fbResponse.data.authUrl;
          break; 
        }
        case 'linkedin': { const liResponse = await oauthAPI.getLinkedInAuthUrl();
          authUrl = liResponse.data.authUrl;
          break; 
        }
        default: {
            throw new Error('Unknown platform');
        }
        }


      // Redirect to OAuth provider
      window.location.href = authUrl;
    } catch (error) {
      setLoading(false);
      onError?.(error.message || 'Failed to start OAuth flow');
    }
  };

  const platformConfig = {
    twitter: {
      label: 'Connect with X (Twitter)',
      color: '#000000',
      hoverColor: '#1a1a1a'
    },
    facebook: {
      label: 'Connect with Facebook',
      color: '#1877F2',
      hoverColor: '#165FDB'
    },
    linkedin: {
      label: 'Connect with LinkedIn',
      color: '#0A66C2',
      hoverColor: '#094899'
    }
  };

  const config = platformConfig[platform];

  return (
    <button
      className="oauth-button"
      onClick={handleOAuthLogin}
      disabled={loading || disabled}
      style={{
        '--oauth-color': config.color,
        '--oauth-hover-color': config.hoverColor
      }}
    >
      {loading ? (
        <>
          <Spinner size="small" variant="pulse" />
          Connecting...
        </>
      ) : (
        <>
          <ExternalLink size={16} />
          {config.label}
        </>
      )}
    </button>
  );
}
