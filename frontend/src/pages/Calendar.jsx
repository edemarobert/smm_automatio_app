import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { postsAPI } from '../services/api';
import '../styles/pages/Calendar.css';

export default function Calendar() {
  const { token } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 1));
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, [token]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await postsAPI.getAll({ limit: 100 }, token);
      setPosts(response.data.posts || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getPostsForDay = (day) => {
    return posts.filter(post => {
      const postDate = new Date(post.scheduledFor || post.publishedAt);
      return postDate.getDate() === day && 
             postDate.getMonth() === currentDate.getMonth() &&
             postDate.getFullYear() === currentDate.getFullYear();
    });
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const upcomingPosts = posts
    .filter(p => new Date(p.scheduledFor || p.publishedAt) >= new Date())
    .sort((a, b) => new Date(a.scheduledFor || a.publishedAt) - new Date(b.scheduledFor || b.publishedAt))
    .slice(0, 5);

  if (error) {
    return (
      <div className="calendar-page">
        <h1>Content Calendar</h1>
        <div className="alert error-alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-page">
      <h1>Content Calendar</h1>

      <div className="calendar-container">
        <div className="calendar">
          <div className="calendar-header">
            <button onClick={handlePrevMonth}>
              <ChevronLeft size={20} />
            </button>
            <h2>{monthName}</h2>
            <button onClick={handleNextMonth}>
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="calendar-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="weekday">
                {day}
              </div>
            ))}
          </div>

          <div className="calendar-days">
            {calendarDays.map((day, index) => {
              const dayPosts = day ? getPostsForDay(day) : [];
              return (
                <div
                  key={index}
                  className={`calendar-day ${day ? '' : 'empty'} ${
                    dayPosts.length > 0 ? 'has-posts' : ''
                  }`}
                >
                  {day && (
                    <>
                      <div className="day-number">{day}</div>
                      {dayPosts.length > 0 && (
                        <div className="posts-indicator">
                          {dayPosts.length} post{dayPosts.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="calendar-sidebar">
          <h3>Upcoming Posts</h3>
          {loading ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>Loading...</p>
          ) : upcomingPosts.length > 0 ? (
            <div className="upcoming-posts">
              {upcomingPosts.map((post) => (
                <div key={post._id} className="upcoming-day">
                  <h4>{new Date(post.scheduledFor || post.publishedAt).toLocaleDateString()}</h4>
                  <p className="post-title">{post.content.substring(0, 40)}...</p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>No upcoming posts</p>
          )}
        </div>
      </div>
    </div>
  );
}
