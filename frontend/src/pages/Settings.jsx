import { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, Plus, Trash2, Link2, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { settingsAPI, accountsAPI } from '../services/api';
import Spinner from '../components/Spinner';
import '../styles/pages/Settings.css';

export default function Settings() {
  const { user, token } = useAuth();
  const [settings, setSettings] = useState({
    fullName: '',
    email: '',
    company: '',
    emailNotifications: false,
    postReminders: false,
    weeklyAnalytics: false
  });
  const [accounts, setAccounts] = useState([]);
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(true);
  const [accountLoading, setAccountLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccountForm, setNewAccountForm] = useState({
    platform: 'instagram',
    accountName: '',
    accountHandle: '',
    accessToken: ''
  });

  useEffect(() => {
    if (token) {
      fetchSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch settings
      try {
        const settingsRes = await settingsAPI.getSettings(token);
        setSettings(prev => ({
          ...prev,
          ...settingsRes.data
        }));
      } catch (err) {
        console.warn('Settings fetch warning:', err.message);
        // Initialize with user data from auth context if settings fail
        if (user) {
          setSettings(prev => ({
            ...prev,
            fullName: user.fullName || '',
            email: user.email || ''
          }));
        }
      }

      // Fetch accounts
      try {
        const accountsRes = await accountsAPI.getAll(token);
        setAccounts(Array.isArray(accountsRes.data) ? accountsRes.data : []);
      } catch (err) {
        console.warn('Accounts fetch warning:', err.message);
        setAccounts([]);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setError(null);
      setSuccess(false);

      if (!settings.fullName.trim()) {
        setError('Full name is required');
        return;
      }

      await settingsAPI.updateSettings({
        fullName: settings.fullName,
        company: settings.company || '',
        emailNotifications: settings.emailNotifications,
        postReminders: settings.postReminders,
        weeklyAnalytics: settings.weeklyAnalytics
      }, token);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Save error:', err);
      setError(err.response?.data?.message || 'Failed to save settings');
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setAccountLoading(true);

      if (!newAccountForm.accountName.trim() || !newAccountForm.accountHandle.trim()) {
        setError('Please fill in all account details');
        return;
      }

      const response = await accountsAPI.create({
        platform: newAccountForm.platform,
        accountName: newAccountForm.accountName,
        accountHandle: newAccountForm.accountHandle,
        accessToken: newAccountForm.accessToken || 'demo_token'
      }, token);

      setAccounts(prev => [...prev, response.data]);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      // Reset form
      setNewAccountForm({
        platform: 'instagram',
        accountName: '',
        accountHandle: '',
        accessToken: ''
      });
      setShowAddAccount(false);
    } catch (err) {
      console.error('Add account error:', err);
      setError(err.response?.data?.message || 'Failed to add account');
    } finally {
      setAccountLoading(false);
    }
  };

  const handleDisconnectAccount = async (accountId) => {
    if (window.confirm('Are you sure you want to disconnect this account?')) {
      try {
        setError(null);
        await accountsAPI.delete(accountId, token);
        setAccounts(prev => prev.filter(acc => acc._id !== accountId));
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        console.error('Disconnect error:', err);
        setError('Failed to disconnect account');
      }
    }
  };

  if (loading) {
    return (
      <div className="settings-page">
        <h1>Settings</h1>
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <h1>Settings</h1>

      {error && (
        <div className="alert error-alert" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert success-alert" style={{ marginBottom: '20px' }}>
          <CheckCircle size={18} />
          <span>Changes saved successfully!</span>
        </div>
      )}

      <div className="settings-container">
        <div className="settings-sidebar">
          <button 
            className={`settings-menu-item ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            Account
          </button>
          <button 
            className={`settings-menu-item ${activeTab === 'accounts' ? 'active' : ''}`}
            onClick={() => setActiveTab('accounts')}
          >
            Connected Accounts
          </button>
          <button 
            className={`settings-menu-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            Notifications
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'account' && (
            <>
              <div className="section">
                <h2>Account Settings</h2>
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    value={settings.fullName || ''} 
                    onChange={(e) => handleSettingsChange('fullName', e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    value={settings.email || user?.email || ''} 
                    disabled
                    placeholder="Email cannot be changed"
                  />
                </div>
                <div className="form-group">
                  <label>Company Name</label>
                  <input 
                    type="text" 
                    value={settings.company || ''} 
                    onChange={(e) => handleSettingsChange('company', e.target.value)}
                    placeholder="Enter your company name"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button className="btn-primary" onClick={handleSaveSettings} disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner size="small" variant="pulse" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {activeTab === 'accounts' && (
            <div className="section">
              <h2>Connected Accounts</h2>
              <p style={{ color: 'var(--text-tertiary)', marginBottom: '20px', fontSize: '14px' }}>
                Connect your social media accounts to schedule posts across multiple platforms
              </p>

              {accounts.length > 0 && (
                <div className="accounts-list">
                  {accounts.map((account) => (
                    <div key={account._id} className="connected-account">
                      <div className="account-info">
                        <div className="account-header">
                          <h4>{account.platform.charAt(0).toUpperCase() + account.platform.slice(1)}</h4>
                          {account.isConnected && <span className="badge-connected">Connected</span>}
                        </div>
                        <p className="account-name">{account.accountName}</p>
                        <p className="account-handle">@{account.accountHandle}</p>
                        <small style={{ color: 'var(--text-tertiary)' }}>
                          Followers: {account.followers || 0}
                        </small>
                      </div>
                      <button 
                        className="btn-danger"
                        onClick={() => handleDisconnectAccount(account._id)}
                      >
                        <Trash2 size={16} />
                        Disconnect
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {accounts.length === 0 && !showAddAccount && (
                <div className="empty-state">
                  <Link2 size={48} />
                  <p>No connected accounts yet</p>
                </div>
              )}

              {!showAddAccount ? (
                <button 
                  className="btn-primary" 
                  onClick={() => setShowAddAccount(true)}
                  style={{ marginTop: accounts.length > 0 ? '20px' : '0' }}
                >
                  <Plus size={20} />
                  Add Account
                </button>
              ) : (
                <form onSubmit={handleAddAccount} className="add-account-form">
                  <h3>Add New Account</h3>
                  <div className="form-group">
                    <label>Platform</label>
                    <select 
                      value={newAccountForm.platform}
                      onChange={(e) => setNewAccountForm(prev => ({ ...prev, platform: e.target.value }))}
                      disabled={accountLoading}
                    >
                      <option value="instagram">Instagram</option>
                      <option value="twitter">Twitter</option>
                      <option value="facebook">Facebook</option>
                      <option value="linkedin">LinkedIn</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Account Name</label>
                    <input 
                      type="text"
                      placeholder="e.g., My Business"
                      value={newAccountForm.accountName}
                      onChange={(e) => setNewAccountForm(prev => ({ ...prev, accountName: e.target.value }))}
                      disabled={accountLoading}
                    />
                  </div>

                  <div className="form-group">
                    <label>Account Handle</label>
                    <input 
                      type="text"
                      placeholder="e.g., mybusiness (without @)"
                      value={newAccountForm.accountHandle}
                      onChange={(e) => setNewAccountForm(prev => ({ ...prev, accountHandle: e.target.value }))}
                      disabled={accountLoading}
                    />
                  </div>

                  <div className="form-group">
                    <label>Access Token (Optional)</label>
                    <input 
                      type="password"
                      placeholder="Platform API token"
                      value={newAccountForm.accessToken}
                      onChange={(e) => setNewAccountForm(prev => ({ ...prev, accessToken: e.target.value }))}
                      disabled={accountLoading}
                    />
                    <small style={{ color: 'var(--text-tertiary)' }}>
                      Leave blank to use demo mode
                    </small>
                  </div>

                  <div className="form-actions">
                    <button 
                      type="submit" 
                      className="btn-primary"
                      disabled={accountLoading}
                    >
                      {accountLoading ? 'Adding...' : 'Add Account'}
                    </button>
                    <button 
                      type="button" 
                      className="btn-secondary"
                      onClick={() => setShowAddAccount(false)}
                      disabled={accountLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="section">
              <h2>Notification Preferences</h2>
              <div className="checkbox-group">
                <label className="checkbox-item">
                  <input 
                    type="checkbox" 
                    checked={settings.emailNotifications || false}
                    onChange={(e) => handleSettingsChange('emailNotifications', e.target.checked)}
                  />
                  <div>
                    <span className="checkbox-label">Email Notifications</span>
                    <p className="checkbox-desc">Get notified about new engagement on your posts</p>
                  </div>
                </label>
                <label className="checkbox-item">
                  <input 
                    type="checkbox" 
                    checked={settings.postReminders || false}
                    onChange={(e) => handleSettingsChange('postReminders', e.target.checked)}
                  />
                  <div>
                    <span className="checkbox-label">Post Reminders</span>
                    <p className="checkbox-desc">Get reminded when scheduled posts are about to go live</p>
                  </div>
                </label>
                <label className="checkbox-item">
                  <input 
                    type="checkbox" 
                    checked={settings.weeklyAnalytics || false}
                    onChange={(e) => handleSettingsChange('weeklyAnalytics', e.target.checked)}
                  />
                  <div>
                    <span className="checkbox-label">Weekly Analytics</span>
                    <p className="checkbox-desc">Receive weekly summary of your social media performance</p>
                  </div>
                </label>
              </div>

              <div className="form-actions">
                <button className="btn-primary" onClick={handleSaveSettings} disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner size="small" variant="pulse" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
