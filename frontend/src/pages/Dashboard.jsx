import { useState, useEffect } from 'react';
import { TrendingUp, Users, MessageSquare, Heart, Zap, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI, postsAPI } from '../services/api';
import '../styles/pages/Dashboard.css';

export default function Dashboard() {
  const { isAuthenticated, token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const statsResponse = await analyticsAPI.getDashboardStats(token);
      setStats(statsResponse.data);

      const postsResponse = await postsAPI.getAll({ status: 'published', limit: 3 }, token);
      setRecentPosts(postsResponse.data.posts || []);

      const scheduledResponse = await postsAPI.getAll({ status: 'scheduled', limit: 3 }, token);
      setScheduledPosts(scheduledResponse.data.posts || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p>Loading your social media overview...</p>
        </div>
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
          Loading data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
        </div>
        <div className="error-alert">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const defaultStats = [
    { icon: Users, label: 'Total Followers', value: stats?.totalFollowers || '0', change: '+5.2%' },
    { icon: MessageSquare, label: 'Engagement Rate', value: stats?.engagementRate || '0%', change: '+2.1%' },
    { icon: Heart, label: 'Total Likes', value: stats?.totalLikes || '0', change: '+12.3%' },
    { icon: TrendingUp, label: 'Posts', value: stats?.totalPosts || '0', change: '+0.8%' },
  ];

  if (!isAuthenticated) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Welcome to SMM Hub</h1>
          <p>Manage all your social media accounts in one place</p>
        </div>

        <div className="unauthenticated-container">
          <div className="unauthenticated-card">
            <div className="unauthenticated-icon">
              <Zap size={48} />
            </div>
            <h2>Ready to get started?</h2>
            <p>Sign up now to start managing your social media presence and schedule posts across all platforms.</p>
            <div className="unauthenticated-buttons">
              <button 
                className="unauthenticated-btn primary"
                onClick={() => navigate('/signup')}
              >
                Create Account
              </button>
              <button 
                className="unauthenticated-btn secondary"
                onClick={() => navigate('/login')}
              >
                Sign In
              </button>
            </div>
          </div>

          <div className="features-grid">
            <div className="feature-item">
              <MessageSquare size={24} />
              <h3>Compose Posts</h3>
              <p>Create and schedule posts across multiple platforms</p>
            </div>
            <div className="feature-item">
              <Users size={24} />
              <h3>Track Followers</h3>
              <p>Monitor your audience growth and engagement</p>
            </div>
            <div className="feature-item">
              <TrendingUp size={24} />
              <h3>Analytics</h3>
              <p>Get detailed insights into your social media performance</p>
            </div>
            <div className="feature-item">
              <Heart size={24} />
              <h3>Engagement Metrics</h3>
              <p>Understand what resonates with your audience</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's your social media overview.</p>
      </div>

      <div className="stats-grid">
        {defaultStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="stat-card">
              <div className="stat-icon">
                <Icon size={24} />
              </div>
              <div className="stat-content">
                <p className="stat-label">{stat.label}</p>
                <p className="stat-value">{stat.value}</p>
                <p className="stat-change">{stat.change} this month</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3>Recent Posts</h3>
          {recentPosts.length > 0 ? (
            <div className="post-list">
              {recentPosts.map((post) => (
                <div key={post._id} className="post-item">
                  <p>{post.content.substring(0, 50)}...</p>
                  <span className="post-meta">
                    {new Date(post.publishedAt).toLocaleDateString()} • {
                      Object.keys(post.platforms).filter(p => post.platforms[p]).join(', ')
                    }
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>No published posts yet</p>
          )}
        </div>

        <div className="card">
          <h3>Scheduled Posts</h3>
          {scheduledPosts.length > 0 ? (
            <div className="scheduled-list">
              {scheduledPosts.map((post) => (
                <div key={post._id} className="scheduled-item">
                  <p>{post.content.substring(0, 50)}...</p>
                  <span className="schedule-time">
                    {new Date(post.scheduledFor).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>No scheduled posts</p>
          )}
        </div>
      </div>
    </div>
  );
}
