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
import Button from '../ui/Button';

function cls({ isActive }) {
  return `top-nav-link${isActive ? ' top-nav-link-active' : ''}`;
}

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
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

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="top-nav-mobile"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: '#fff',
              display: 'flex',
              flexDirection: 'column',
              padding: '20px 24px 32px',
              gap: '8px',
              boxShadow: '0 20px 40px rgba(15,23,42,0.1)',
              borderBottom: '1px solid #f1f5f9',
              zIndex: 1000,
              overflow: 'hidden'
            }}
          >
            {(!isAuthenticated || isLandingPage) && (
              <NavLink className={cls} to="/" onClick={() => setOpen(false)}>Home</NavLink>
            )}

            {isAuthenticated && !isLandingPage && roleLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.to} className={cls} to={item.to} onClick={() => setOpen(false)}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={18} />
                    {item.label}
                  </span>
                </NavLink>
              );
            })}

            <div style={{ height: '1px', background: '#f1f5f9', margin: '8px 0' }} />

            {isAuthenticated && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                <Link
                  to={user?.role === 'business' ? '/business/profile' : '/freelancer/profile'}
                  onClick={() => setOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: '#0f172a' }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#f8fafc' }}>
                    {profilePhotoUrl ? (
                      <img src={buildProtectedAssetUrl(profilePhotoUrl)} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontWeight: 800 }}>{user?.name?.charAt(0)?.toUpperCase()}</span>
                    )}
                  </div>
                  <span style={{ fontWeight: 700 }}>Profile Settings</span>
                </Link>
                <Link
                  to={user?.role === 'business' ? '/business/notifications' : '/freelancer/notifications'}
                  onClick={() => setOpen(false)}
                  className="notif-bell"
                  style={{ position: 'relative' }}
                >
                  <Bell size={24} color="#64748b" />
                  {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                </Link>
              </div>
            )}

            {!isAuthenticated ? (
              <div style={{ display: 'grid', gap: '12px', marginTop: '8px' }}>
                <Link to="/login" onClick={() => setOpen(false)} style={{ textDecoration: 'none' }}>
                  <Button variant="secondary" fullWidth style={{ height: '52px' }}>Login</Button>
                </Link>
                <Link to="/register" onClick={() => setOpen(false)} style={{ textDecoration: 'none' }}>
                  <Button variant="primary" fullWidth style={{ height: '52px' }}>Get Started</Button>
                </Link>
              </div>
            ) : (
              <Button
                variant="secondary"
                onClick={onLogout}
                fullWidth
                style={{ marginTop: '12px', height: '52px', color: '#dc2626', borderColor: '#fecaca', background: '#fff' }}
              >
                Logout Account
              </Button>
            )}
          </motion.nav>
        )}
      </AnimatePresence>

      <nav className="top-nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {(!isAuthenticated || isLandingPage) && (
          <NavLink className={cls} to="/" onClick={() => setOpen(false)}>Home</NavLink>
        )}

        {isAuthenticated && !isLandingPage && roleLinks.map((item) => {
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

        {isAuthenticated && !isLandingPage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link
              to={user?.role === 'business' ? '/business/notifications' : '/freelancer/notifications'}
              className="notif-bell"
              aria-label="Notifications"
            >
              <Bell size={18} className="notif-bell-icon" />
              {unreadCount > 0 && <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
            </Link>
            <Link
              to={user?.role === 'business' ? '/business/profile' : '/freelancer/profile'}
              style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#f8fafc', color: '#1e293b' }}
            >
              {profilePhotoUrl ? (
                <img src={buildProtectedAssetUrl(profilePhotoUrl)} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontWeight: 800 }}>{user?.name?.charAt(0)?.toUpperCase()}</span>
              )}
            </Link>
          </div>
        )}

        {!isAuthenticated && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link className="top-nav-link" to="/login" style={{ fontWeight: 600 }}>Login</Link>
            <Link to="/register">
              <Button variant="primary" style={{ padding: '0 20px', height: '44px' }}>Get Started</Button>
            </Link>
          </div>
        )}

        {isAuthenticated && (
          <Button
            variant="secondary"
            onClick={onLogout}
            style={{ display: 'flex', gap: '6px', alignItems: 'center', height: '44px' }}
          >
            <LogOut size={16} /> Logout
          </Button>
        )}
      </nav>
    </motion.header>
  );
}
