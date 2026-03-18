import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  FolderKanban,
  Bell,
  ArrowRight,
  BriefcaseBusiness,
} from 'lucide-react';
import { getMyProjects } from '../services/projectService';
import { getNotifications, getUnreadProjectNotifications } from '../services/notificationService';
import { connectRealtime, onRealtime } from '../services/realtimeService';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import PremiumHero from '../components/ui/PremiumHero';
import Modal from '../components/ui/Modal';
import { formatINR } from '../utils/currency';
import { formatDateOnly } from '../utils/date';
import { useAuth } from '../hooks/useAuth';

function MetricCard({ label, value, onClick, delay = 0 }) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      whileHover={{ y: -4, boxShadow: '0 14px 26px rgba(79,70,229,0.12)' }}
      onClick={onClick}
      className="card-ui"
      style={{
        width: '100%',
        textAlign: 'left',
        border: '1px solid rgba(79, 70, 229, 0.12)',
        background: 'rgba(255,255,255,0.92)',
        borderRadius: '18px',
        padding: '18px',
        cursor: 'pointer',
      }}
    >
      <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.02em' }}>{label}</p>
      <p style={{ margin: '8px 0 0', fontSize: '1.95rem', color: '#0f172a', fontWeight: 900 }}>{value}</p>
    </motion.button>
  );
}

function SectionCard({ title, right, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
    >
      <Card className="glass" style={{ padding: '22px', border: '1px solid rgba(79,70,229,0.14)', background: 'rgba(255,255,255,0.88)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <h3 className="section-title-refined" style={{ margin: 0, fontSize: '1.25rem' }}>{title}</h3>
          {right}
        </div>
        {children}
      </Card>
    </motion.div>
  );
}

export default function BusinessDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [unreadByProject, setUnreadByProject] = useState({});
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('show_welcome_modal') === 'true') {
      setShowWelcome(true);
      localStorage.removeItem('show_welcome_modal');
    }
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const { data } = await getMyProjects();
      setProjects(Array.isArray(data?.projects) ? data.projects : []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMeta = async () => {
    try {
      const [unreadRes, notifRes] = await Promise.all([
        getUnreadProjectNotifications(),
        getNotifications(),
      ]);
      setUnreadByProject(unreadRes.data?.unreadByProject || {});
      setRecentNotifications((notifRes.data?.notifications || []).slice(0, 6));
    } catch {
      setUnreadByProject({});
      setRecentNotifications([]);
    }
  };

  useEffect(() => {
    loadProjects();
    loadMeta();

    connectRealtime();
    const offNew = onRealtime('notifications:new', loadMeta);
    const offCount = onRealtime('notifications:count', loadMeta);
    return () => {
      offNew();
      offCount();
    };
  }, []);

  const counts = useMemo(() => {
    const total = projects.length;
    const open = projects.filter((p) => p.status === 'Open').length;
    const review = projects.filter((p) => p.status === 'Submitted').length;
    const completed = projects.filter((p) => p.status === 'Completed').length;
    const inProgress = projects.filter((p) => p.status === 'Assigned').length;
    return { total, open, review, completed, inProgress };
  }, [projects]);

  const goMyProjects = (status) => {
    const suffix = status ? `?status=${encodeURIComponent(status)}` : '';
    navigate(`/business/projects${suffix}`);
  };

  const sortedProjects = [...projects].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  return (
    <section className="premium-page-wrap" style={{ display: 'grid', gap: 'clamp(12px, 2vw, 20px)', background: 'transparent', padding: '0 0 40px' }}>

      <PremiumHero
        label="Business Account"
        title={user?.name || 'Business'}
        subtitle={
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span>{user?.email}</span>
            {user?.contactPhone && <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>{user.contactPhone}</span>}
          </div>
        }
        right={(
          <div style={{ minWidth: '220px', border: '1px solid rgba(148,163,184,0.22)', background: 'rgba(15,23,42,0.2)', borderRadius: '16px', padding: '12px 14px' }}>
            <p style={{ margin: 0, color: 'rgba(226,232,240,0.72)', fontSize: '0.76rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Active Projects
            </p>
            <p style={{ margin: '6px 0 0', fontSize: '2rem', color: '#f8fafc', fontWeight: 900 }}>{counts.inProgress}</p>
            <p style={{ margin: '4px 0 0', color: 'rgba(226,232,240,0.72)', fontWeight: 700, fontSize: '0.82rem' }}>
              {counts.total} total projects
            </p>
          </div>
        )}
        actions={(
          <>
            <Button to="/business/post-project" variant="primary"><Plus size={16} /> Post Project</Button>
            <Button to="/business/projects" variant="secondary"><FolderKanban size={16} /> My Projects</Button>
          </>
        )}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <MetricCard label="Total Projects" value={counts.total} onClick={() => goMyProjects('')} delay={0.05} />
        <MetricCard label="Open" value={counts.open} onClick={() => goMyProjects('Open')} delay={0.1} />
        <MetricCard label="In Review (Submitted)" value={counts.review} onClick={() => goMyProjects('Submitted')} delay={0.15} />
        <MetricCard label="Completed" value={counts.completed} onClick={() => goMyProjects('Completed')} delay={0.2} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'start', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'grid', gap: '16px' }}>
          <SectionCard
            title="Active & Recent Projects"
            right={<Link to="/business/projects" className="text-gradient-premium" style={{ textDecoration: 'none', fontWeight: 800 }}>View All</Link>}
            delay={0.25}
          >
            {isLoading ? (
              <p style={{ margin: '14px 0 0', color: '#64748b' }}>Loading projects...</p>
            ) : sortedProjects.length === 0 ? (
              <div style={{ marginTop: '16px' }}>
                <EmptyState message="No projects yet. Post your first project to start your pipeline." />
              </div>
            ) : (
              <div style={{ marginTop: '8px', display: 'grid', gap: '10px' }}>
                {sortedProjects.slice(0, 6).map((project, idx) => {
                  const unread = Number(unreadByProject[project.id] || 0);
                  return (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 + idx * 0.04 }}
                      whileHover={{ y: -2 }}
                      style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px', background: '#fff' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'start' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{project.title}</p>
                          <p style={{ margin: '6px 0 0', fontSize: '0.86rem', color: '#64748b' }}>
                            Budget: <strong style={{ color: '#0f172a' }}>{formatINR(project.budget)}</strong>
                            {' | '}Deadline: <strong style={{ color: '#0f172a' }}>{formatDateOnly(project.deadline)}</strong>
                          </p>
                          {unread > 0 && (
                            <span style={{ display: 'inline-block', marginTop: '8px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '999px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700 }}>
                              {unread} new message{unread > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <StatusBadge status={project.status} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                        <Button variant="secondary" onClick={() => navigate(`/projects/${project.id}`)}>Manage</Button>
                        <Link to={`/projects/${project.id}`} style={{ fontWeight: 700, color: '#4f46e5', alignSelf: 'center', textDecoration: 'none' }}>
                          Details
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard
          title="Recent Activity"
          right={<Link to="/business/notifications" className="text-gradient-premium" style={{ textDecoration: 'none', fontWeight: 800 }}>View All</Link>}
          delay={0.35}
        >
          <div style={{ display: 'grid', gap: '10px' }}>
            {recentNotifications.length === 0 ? (
              <p style={{ margin: 0, color: '#64748b' }}>No recent notifications.</p>
            ) : recentNotifications.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.04 }}
                style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}
              >
                <p style={{ margin: 0, color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Bell size={14} color="#4f46e5" /> {item.title || 'Update'}
                </p>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                  {item.messageText || item.message || ''}
                </p>
                <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>
                  {formatDateOnly(item.createdAt)}
                </p>
              </motion.div>
            ))}
          </div>
          <div style={{ marginTop: '12px' }}>
            <Button variant="secondary" fullWidth onClick={() => navigate('/business/notifications')}>
              Open Notifications <ArrowRight size={14} />
            </Button>
          </div>
        </SectionCard>
      </div>

      {error && <p className="alert alert-danger">{error}</p>}

      <Modal
        isOpen={showWelcome}
        onClose={() => setShowWelcome(false)}
        title="Welcome Aboard!"
      >
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dbfce1 100%)', 
            borderRadius: '20px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 20px',
            color: '#16a34a',
            boxShadow: '0 10px 20px rgba(22, 163, 74, 0.1)'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M3 5h4"/><path d="M21 17v4"/><path d="M19 19h4"/></svg>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', marginBottom: '12px', fontFamily: '"Outfit", sans-serif' }}>
            Registration Successful
          </h2>
          <p style={{ color: '#475569', marginBottom: '32px', fontSize: '1.1rem', lineHeight: 1.6 }}>
            Welcome aboard, <strong>{user?.name}</strong>!<br /> 
            Your business account is ready. Start posting projects and finding top talent today.
          </p>
          <Button 
            variant="primary" 
            fullWidth 
            onClick={() => setShowWelcome(false)}
            style={{ height: '56px', fontSize: '1.1rem', fontWeight: 800, borderRadius: '16px' }}
          >
            Get Started
          </Button>
        </div>
      </Modal>
    </section>
  );
}
