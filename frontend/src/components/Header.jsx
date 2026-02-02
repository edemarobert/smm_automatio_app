import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../services/api';
import '../styles/Header.css';

export default function Header() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;
    try {
      const response = await notificationsAPI.getUnreadCount(token);
      setUnreadCount(response.data?.count || 0);
    } catch (error) {
      setUnreadCount(0);
    }
  }, [token]);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    setLoadingNotifications(true);
    setNotificationError(null);
    try {
      const response = await notificationsAPI.getAll({ limit: 10 }, token);
      const list = response.data?.notifications || [];
      setNotifications(list);
      const unread = list.filter((item) => !item.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      setNotificationError('Failed to load notifications');
    } finally {
      setLoadingNotifications(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  const handleToggleNotifications = () => {
    const nextOpen = !showNotifications;
    setShowNotifications(nextOpen);
    if (nextOpen) {
      fetchNotifications();
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    if (!token) return;
    try {
      await notificationsAPI.markRead(notificationId, token);
      setNotifications((prev) =>
        prev.map((item) =>
          item._id === notificationId ? { ...item, isRead: true } : item
        )
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (error) {
      setNotificationError('Failed to update notification');
    }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      await notificationsAPI.markAllRead(token);
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      setNotificationError('Failed to mark all as read');
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <h2>Social Media Management</h2>
        <div className="header-actions">
          <div className="notification-menu">
            <button
              className="icon-btn notification-btn"
              onClick={handleToggleNotifications}
              aria-label="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <span>Notifications</span>
                  <button
                    className="notification-action"
                    onClick={handleMarkAllRead}
                    disabled={unreadCount === 0}
                  >
                    Mark all read
                  </button>
                </div>
                <div className="notification-list">
                  {loadingNotifications && (
                    <div className="notification-empty">Loading notifications...</div>
                  )}
                  {!loadingNotifications && notificationError && (
                    <div className="notification-empty error">{notificationError}</div>
                  )}
                  {!loadingNotifications && !notificationError && notifications.length === 0 && (
                    <div className="notification-empty">No notifications yet.</div>
                  )}
                  {!loadingNotifications && !notificationError && notifications.map((item) => (
                    <button
                      key={item._id}
                      className={`notification-item ${item.isRead ? '' : 'unread'}`}
                      onClick={() => handleMarkAsRead(item._id)}
                    >
                      <div className="notification-title">{item.title}</div>
                      <div className="notification-message">{item.message}</div>
                      <div className="notification-time">
                        {new Date(item.createdAt).toLocaleString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="profile-menu">
            <button 
              className="icon-btn profile-btn"
              onClick={() => setShowProfile(!showProfile)}
            >
              <User size={20} />
            </button>
            {showProfile && (
              <div className="profile-dropdown">
                <div className="profile-header">
                  <p className="profile-name">{user?.fullName}</p>
                  <p className="profile-email">{user?.email}</p>
                </div>
                <button 
                  className="profile-logout"
                  onClick={handleLogout}
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
