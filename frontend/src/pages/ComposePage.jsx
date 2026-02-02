import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Clock, Image as ImageIcon, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { postsAPI } from '../services/api';
import Spinner from '../components/Spinner';
import '../styles/pages/ComposePage.css';

export default function ComposePage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const fileInputRef = useRef(null);
  const [post, setPost] = useState('');
  const [platforms, setPlatforms] = useState({
    instagram: true,
    twitter: false,
    facebook: true,
    linkedin: false,
  });

  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [images, setImages] = useState([]);
  const [imageError, setImageError] = useState(null);

  const handlePlatformChange = (platform) => {
    setPlatforms(prev => ({ ...prev, [platform]: !prev[platform] }));
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setImageError(null);

    if (images.length + files.length > 4) {
      setImageError('Maximum 4 images allowed per post');
      return;
    }

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        setImageError('Only image files are allowed');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setImageError('Image size must be less than 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setImages(prev => [...prev, {
          id: Date.now() + Math.random(),
          data: event.target.result,
          name: file.name,
          file: file
        }]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
    setImageError(null);
  };

  const handlePost = async () => {
    setError(null);
    setSuccess(false);

    if (!post.trim()) {
      setError('Please write something to post');
      return;
    }

    const selectedPlatforms = Object.keys(platforms).filter(p => platforms[p]);
    if (selectedPlatforms.length === 0) {
      setError('Please select at least one platform');
      return;
    }

    try {
      setLoading(true);

      const platformsObj = {
        instagram: platforms.instagram,
        twitter: platforms.twitter,
        facebook: platforms.facebook,
        linkedin: platforms.linkedin,
      };

      const scheduledFor = scheduleDate && scheduleTime 
        ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
        : null;

      const formData = new FormData();
      formData.append('content', post);
      formData.append('platforms', JSON.stringify(platformsObj));
      if (scheduledFor) formData.append('scheduledFor', scheduledFor);
      images.forEach(img => {
        formData.append('images', img.file);
      });

      await postsAPI.create(formData, token);

      setSuccess(true);
      setPost('');
      setImages([]);
      setPlatforms({
        instagram: true,
        twitter: false,
        facebook: true,
        linkedin: false,
      });
      setScheduleDate('');
      setScheduleTime('');
      setImageError(null);

      setTimeout(() => {
        navigate('/calendar');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="compose-page">
      <h1>Create New Post</h1>

      {error && (
        <div className="alert error-alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert success-alert">
          <CheckCircle size={18} />
          <span>Post created successfully! Redirecting...</span>
        </div>
      )}

      <div className="compose-container">
        <div className="compose-editor">
          <textarea
            placeholder="What's on your mind? Share your thoughts with your audience..."
            value={post}
            onChange={(e) => setPost(e.target.value)}
            maxLength={2800}
            disabled={loading}
          />
          <div className="char-count">
            {post.length} / 2800
          </div>

          <div className="editor-tools">
            <button 
              className="tool-btn" 
              disabled={loading}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon size={20} />
              <span>Add Image ({images.length}/4)</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
              disabled={loading}
            />
          </div>

          {imageError && (
            <div className="alert error-alert">
              <AlertCircle size={18} />
              <span>{imageError}</span>
            </div>
          )}

          {images.length > 0 && (
            <div className="image-gallery">
              <h4>Attached Images ({images.length}/4)</h4>
              <div className="image-grid">
                {images.map((img) => (
                  <div key={img.id} className="image-item">
                    <img src={img.data} alt={img.name} />
                    <button
                      className="remove-image"
                      onClick={() => handleRemoveImage(img.id)}
                      type="button"
                      disabled={loading}
                    >
                      <X size={16} />
                    </button>
                    <span className="image-name">{img.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="compose-sidebar">
          <div className="section">
            <h3>Select Platforms</h3>
            <div className="platform-list">
              {Object.entries(platforms).map(([platform, selected]) => (
                <label key={platform} className="platform-item">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => handlePlatformChange(platform)}
                    disabled={loading}
                  />
                  <span className="capitalize">{platform}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="section">
            <h3>Schedule Post</h3>
            <div className="schedule-inputs">
              <div className="input-group">
                <label>Date</label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="input-group">
                <label>Time</label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            {scheduleDate && scheduleTime && (
              <p className="schedule-preview">
                <Clock size={16} />
                Scheduled for {scheduleDate} at {scheduleTime}
              </p>
            )}
          </div>

          <button 
            className="post-btn" 
            onClick={handlePost}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner size="small" variant="default" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Send size={20} />
                <span>{scheduleDate ? 'Schedule Post' : 'Post Now'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
