import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Menu, X, LogOut, ChevronRight, Briefcase, LayoutDashboard, Search, ListTodo } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getNotifications } from '../../services/notificationService';
import { getProfile } from '../../services/profileService';
import { connectRealtime, onRealtime } from '../../services/realtimeService';
import { getStoredToken } from '../../utils/authStorage';
import brandLogo from '../../assets/contractual-logo-exact.png';

function cls({ isActive }) {
  return `top-nav-link${isActive ? ' top-nav-link-active' : ''}`;
}

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const roleLinks = user?.role === 'business'
    ? [
      { to: '/business/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/business/post-project', label: 'Post Project', icon: Briefcase },
      { to: '/business/projects', label: 'My Projects', icon: ListTodo },
    ]
    : [
      { to: '/freelancer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/freelancer/projects', label: 'Browse', icon: Search },
      { to: '/freelancer/work', label: 'My Work', icon: Briefcase },
      { to: '/freelancer/profile', label: 'Profile', icon: ListTodo },
    ];

  // Fix the icon for business/projects to be something different (ListTodo used above)
  useEffect(() => {
    // No-op, just cleaned up the roleLinks array directly
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    let active = true;
    const loadUnread = async () => {
      try {
        const { data } = await getNotifications();
        if (active) setUnreadCount(Number(data.unreadCount || 0));
      } catch {
        if (active) setUnreadCount(0);
      }
    };

    connectRealtime();
    const offCount = onRealtime('notifications:count', (payload) => {
      if (active) setUnreadCount(Number(payload?.unreadCount || 0));
    });
    const offNew = onRealtime('notifications:new', (payload) => {
      if (active) setUnreadCount(Number(payload?.unreadCount || 0));
    });

    loadUnread();
    const intervalId = setInterval(loadUnread, 60000);

    return () => {
      active = false;
      clearInterval(intervalId);
      offCount();
      offNew();
    };
  }, [isAuthenticated, location.pathname]);

  useEffect(() => {
    if (!isAuthenticated) {
      setProfilePhotoUrl('');
      return;
    }

    let active = true;
    const loadProfilePhoto = async () => {
      try {
        const { data } = await getProfile();
        if (active) setProfilePhotoUrl(String(data?.profile?.profilePhotoUrl || ''));
      } catch {
        // Keep the existing value on transient errors.
      }
    };

    const onProfileUpdated = (event) => {
      const nextUrl = String(event?.detail?.profilePhotoUrl || '').trim();
      if (nextUrl) {
        if (active) setProfilePhotoUrl(nextUrl);
        return;
      }
      loadProfilePhoto();
    };

    loadProfilePhoto();
    window.addEventListener('profile:updated', onProfileUpdated);

    return () => {
      active = false;
      window.removeEventListener('profile:updated', onProfileUpdated);
    };
  }, [isAuthenticated, user?.id, location.pathname]);

  const apiOrigin = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const buildProtectedAssetUrl = (relativePath) => {
    const safePath = String(relativePath || '').trim();
    if (!safePath) return '';
    if (/^https?:\/\//i.test(safePath)) return safePath;
    const token = getStoredToken();
    if (!token) return `${apiOrigin}${safePath}`;
    const separator = safePath.includes('?') ? '&' : '?';
    return `${apiOrigin}${safePath}${separator}token=${encodeURIComponent(token)}`;
  };

  const onLogout = () => {
    logout();
    setOpen(false);
    setUnreadCount(0);
    navigate('/login');
  };

  return (
    <motion.header
      className={`top-header ${scrolled ? 'header-scrolled' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        padding: '16px 24px',
        borderRadius: scrolled ? '0 0 24px 24px' : '0',
        transition: 'all 0.3s ease'
      }}
    >
      <Link to="/" className="brand-block">
        <motion.div
          className="brand-logo"
          whileHover={{ scale: 1.05, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          style={{
            width: '44px',
            height: '44px',
            background: '#fff',
            padding: '4px',
            borderRadius: '12px',
            boxShadow: '0 8px 16px rgba(59,130,246,0.18)',
            overflow: 'visible',
          }}
        >
          <img
            src={brandLogo}
            alt="Contractual logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              background: '#fff',
            }}
          />
        </motion.div>
        <div>
          <p className="brand-name">Contractual</p>
        </div>
      </Link>

      <button className="menu-toggle" onClick={() => setOpen((v) => !v)}>
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      <nav className={`top-nav${open ? ' top-nav-open' : ''}`}>
        {!isAuthenticated && (
          <NavLink className={cls} to="/" onClick={() => setOpen(false)}>Home</NavLink>
        )}

        {isAuthenticated && roleLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} className={cls} to={item.to} onClick={() => setOpen(false)}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon size={16} />
                {item.label}
              </span>
            </NavLink>
          );
        })}

        {isAuthenticated && (
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              to={user?.role === 'business' ? '/business/profile' : '/freelancer/profile'}
              onClick={() => setOpen(false)}
              aria-label="Profile"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                border: '1px solid rgba(99,102,241,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                background: '#f8fafc',
                textDecoration: 'none',
                color: '#1e293b',
                fontWeight: 800,
              }}
            >
              {profilePhotoUrl ? (
                <img
                  src={buildProtectedAssetUrl(profilePhotoUrl)}
                  alt={`${user?.name || 'User'} avatar`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
              )}
            </Link>
          </motion.div>
        )}

        {isAuthenticated && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to={user?.role === 'business' ? '/business/notifications' : '/freelancer/notifications'}
              className="notif-bell"
              onClick={() => setOpen(false)}
              aria-label="Notifications"
            >
              <Bell size={18} className="notif-bell-icon" />
              {unreadCount > 0 && <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
            </Link>
          </motion.div>
        )}

        {!isAuthenticated && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link className="top-nav-link" to="/login" onClick={() => setOpen(false)} style={{ fontWeight: 600 }}>Login</Link>
            <Link to="/register" onClick={() => setOpen(false)}>
              <motion.button
                className="btn btn-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started <ChevronRight size={16} />
              </motion.button>
            </Link>
          </div>
        )}

        {isAuthenticated && (
          <motion.button
            className="btn btn-secondary top-logout"
            onClick={onLogout}
            whileHover={{ scale: 1.05, backgroundColor: '#fee2e2', color: '#dc2626', borderColor: '#fecaca' }}
            whileTap={{ scale: 0.95 }}
            style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
          >
            <LogOut size={16} />
            Logout
          </motion.button>
        )}
      </nav>
    </motion.header>
  );
}
