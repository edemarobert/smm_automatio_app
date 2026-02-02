import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Eye, Share2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI } from '../services/api';
import '../styles/pages/Analytics.css';

export default function Analytics() {
  const { token } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [platformStats, setPlatformStats] = useState([]);
  const [topPosts, setTopPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [token, period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashboardResponse, platformResponse, postsResponse] = await Promise.all([
        analyticsAPI.getDashboardStats(token),
        analyticsAPI.getPlatformStats(token),
        analyticsAPI.getTopPosts({ limit: 5 }, token)
      ]);

      setMetrics(dashboardResponse.data);
      setPlatformStats(platformResponse.data);
      setTopPosts(postsResponse.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <h1>Analytics</h1>
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
          Loading analytics...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-page">
        <h1>Analytics</h1>
        <div className="alert error-alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const defaultMetrics = [
    { icon: Eye, label: 'Total Impressions', value: metrics?.totalFollowers || '0', change: '+15.2%' },
    { icon: Share2, label: 'Shares', value: platformStats.reduce((sum, s) => sum + (s.shares || 0), 0) || '0', change: '+8.5%' },
    { icon: TrendingUp, label: 'Engagement Rate', value: metrics?.engagementRate || '0%', change: '+1.3%' },
    { icon: BarChart3, label: 'Total Posts', value: metrics?.totalPosts || '0', change: '+0.9%' },
  ];

  return (
    <div className="analytics-page">
      <h1>Analytics</h1>

      <div className="analytics-period">
        <button 
          className={`period-btn ${period === '7d' ? 'active' : ''}`}
          onClick={() => setPeriod('7d')}
        >
          Last 7 Days
        </button>
        <button 
          className={`period-btn ${period === '30d' ? 'active' : ''}`}
          onClick={() => setPeriod('30d')}
        >
          Last 30 Days
        </button>
        <button 
          className={`period-btn ${period === '90d' ? 'active' : ''}`}
          onClick={() => setPeriod('90d')}
        >
          Last 90 Days
        </button>
      </div>

      <div className="metrics-grid">
        {defaultMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="metric-card">
              <div className="metric-icon">
                <Icon size={24} />
              </div>
              <div className="metric-content">
                <p className="metric-label">{metric.label}</p>
                <p className="metric-value">{metric.value}</p>
                <p className="metric-change">{metric.change} vs last period</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="analytics-container">
        <div className="card">
          <h3>Platform Performance</h3>
          {platformStats.length > 0 ? (
            <div className="platform-stats">
              {platformStats.map(stat => (
                <div key={stat.platform} className="platform-stat">
                  <span>{stat.platform.charAt(0).toUpperCase() + stat.platform.slice(1)} ({stat.followers})</span>
                  <div className="progress-bar">
                    <div className="progress" style={{ width: Math.min((stat.followers / 10000) * 100, 100) + '%' }}></div>
                  </div>
                  <small style={{ color: 'var(--text-tertiary)' }}>
                    {stat.posts} posts • {stat.likes || 0} likes
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-tertiary)' }}>No data available</p>
          )}
        </div>
      </div>

      {topPosts.length > 0 && (
        <div className="card">
          <h3>Top Performing Posts</h3>
          <div className="posts-table">
            <div className="table-header">
              <div className="col-title">Post Content</div>
              <div className="col-metric">Likes</div>
              <div className="col-metric">Comments</div>
              <div className="col-metric">Shares</div>
            </div>
            {topPosts.map((post) => (
              <div key={post._id} className="table-row">
                <div className="col-title">{post.content.substring(0, 40)}...</div>
                <div className="col-metric">{post.metrics?.likes || 0}</div>
                <div className="col-metric">{post.metrics?.comments || 0}</div>
                <div className="col-metric">{post.metrics?.shares || 0}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
