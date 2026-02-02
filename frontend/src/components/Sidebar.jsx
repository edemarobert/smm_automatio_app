import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PenTool,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  LogIn,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/Sidebar.css';

export default function Sidebar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const publicNavItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  ];

  const authNavItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/compose', icon: PenTool, label: 'Compose' },
    { path: '/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const navItems = isAuthenticated ? authNavItems : publicNavItems;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>SMM Hub</h1>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {isAuthenticated ? (
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        ) : (
          <div className="auth-buttons">
            <button 
              className="login-btn"
              onClick={() => navigate('/login')}
            >
              <LogIn size={20} />
              <span>Sign In</span>
            </button>
            <button 
              className="signup-btn"
              onClick={() => navigate('/signup')}
            >
              <UserPlus size={20} />
              <span>Sign Up</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
