import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Clock3,
  Send,
  Bell,
  Search,
  UserCircle2,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Star,
} from 'lucide-react';
import { getProjects, submitProject } from '../services/projectService';
import { getNotifications, getUnreadProjectNotifications } from '../services/notificationService';
import { connectRealtime, onRealtime } from '../services/realtimeService';
import { getUserRatingSummary } from '../services/ratingService';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import PremiumHero from '../components/ui/PremiumHero';
import Modal from '../components/ui/Modal';
import { formatINR } from '../utils/currency';

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

export default function FreelancerDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [projects, setProjects] = useState([]);
  const [unreadByProject, setUnreadByProject] = useState({});
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [ratingSummary, setRatingSummary] = useState({ averageRating: 0, totalRatings: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
  const [submissionText, setSubmissionText] = useState({});
  const [submissionLink, setSubmissionLink] = useState({});
  const [submissionFiles, setSubmissionFiles] = useState({});
  const [submittingProjectId, setSubmittingProjectId] = useState(null);
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
      const { data } = await getProjects({ assignedToMe: true });
      setProjects(Array.isArray(data?.projects) ? data.projects : []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load assignments');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMeta = async () => {
    try {
      const requests = [getUnreadProjectNotifications(), getNotifications()];
      if (user?.id) requests.push(getUserRatingSummary(user.id));
      const [unreadRes, notifRes, ratingRes] = await Promise.all(requests);

      setUnreadByProject(unreadRes.data?.unreadByProject || {});
      setRecentNotifications((notifRes.data?.notifications || []).slice(0, 6));
      if (ratingRes?.data?.summary) setRatingSummary(ratingRes.data.summary);
    } catch {
      setUnreadByProject({});
      setRecentNotifications([]);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    loadMeta();
    connectRealtime();
    const offNew = onRealtime('notifications:new', loadMeta);
    const offCount = onRealtime('notifications:count', loadMeta);
    return () => {
      offNew();
      offCount();
    };
  }, [user?.id]);

  const counts = useMemo(() => {
    const accepted = projects.length;
    const assigned = projects.filter((p) => p.status === 'Assigned').length;
    const submitted = projects.filter((p) => p.status === 'Submitted').length;
    const completed = projects.filter((p) => p.status === 'Completed').length;
    return { accepted, assigned, submitted, completed };
  }, [projects]);

  const sortedProjects = [...projects].sort((a, b) => {
    const aScore = a.status === 'Assigned' ? 0 : a.status === 'Submitted' ? 1 : 2;
    const bScore = b.status === 'Assigned' ? 0 : b.status === 'Submitted' ? 1 : 2;
    if (aScore !== bScore) return aScore - bScore;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  const goWork = (status) => {
    const suffix = status ? `?status=${encodeURIComponent(status)}` : '';
    navigate(`/freelancer/work${suffix}`);
  };

  const handleSubmit = async (projectId) => {
    const notes = String(submissionText[projectId] || '').trim();
    if (notes.length < 3) {
      addToast('Add at least 3 characters in submission notes', 'danger');
      return;
    }

    try {
      setSubmittingProjectId(projectId);
      await submitProject(projectId, {
        submissionText: notes,
        submissionLink: submissionLink[projectId] || '',
        files: submissionFiles[projectId] || [],
      });
      addToast('Submission sent successfully', 'success');
      setSubmissionText((prev) => ({ ...prev, [projectId]: '' }));
      setSubmissionLink((prev) => ({ ...prev, [projectId]: '' }));
      setSubmissionFiles((prev) => ({ ...prev, [projectId]: [] }));
      await Promise.all([loadProjects(), loadMeta()]);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to submit work', 'danger');
    } finally {
      setSubmittingProjectId(null);
    }
  };

  return (
    <section className="premium-page-wrap" style={{ display: 'grid', gap: 'clamp(12px, 2vw, 20px)', background: 'transparent', padding: '0 0 40px' }}>

      <PremiumHero
        label="Freelancer Account"
        title={user?.name || 'Freelancer'}
        subtitle={
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span>{user?.email}</span>
            {user?.contactPhone && <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>{user.contactPhone}</span>}
          </div>
        }
        right={(
          <div style={{ minWidth: '220px', border: '1px solid rgba(148,163,184,0.22)', background: 'rgba(15,23,42,0.2)', borderRadius: '16px', padding: '12px 14px' }}>
            <p style={{ margin: 0, color: 'rgba(226,232,240,0.72)', fontSize: '0.76rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Rating
            </p>
            <p style={{ margin: '6px 0 0', fontSize: '2rem', color: '#f8fafc', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Star size={24} color="#facc15" fill="#facc15" />
              {Number(ratingSummary.averageRating || 0).toFixed(2)}
            </p>
            <p style={{ margin: '4px 0 0', color: 'rgba(226,232,240,0.72)', fontWeight: 700, fontSize: '0.82rem' }}>
              {Number(ratingSummary.totalRatings || 0)} review{Number(ratingSummary.totalRatings || 0) === 1 ? '' : 's'}
            </p>
          </div>
        )}
        actions={(
          <>
            <Button to="/freelancer/projects" variant="primary"><Search size={16} /> Browse Projects</Button>
            <Button to="/freelancer/work" variant="secondary"><Briefcase size={16} /> Track My Work</Button>
          </>
        )}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <MetricCard label="Accepted" value={counts.accepted} onClick={() => goWork('')} delay={0.05} />
        <MetricCard label="Assigned" value={counts.assigned} onClick={() => goWork('Assigned')} delay={0.1} />
        <MetricCard label="Submitted" value={counts.submitted} onClick={() => goWork('Submitted')} delay={0.15} />
        <MetricCard label="Completed" value={counts.completed} onClick={() => goWork('Completed')} delay={0.2} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', position: 'relative', zIndex: 2 }}
      >
        <Button variant="secondary" onClick={() => navigate('/freelancer/projects')}><Search size={16} /> Project Marketplace</Button>
        <Button variant="secondary" onClick={() => navigate('/freelancer/work?status=Assigned')}><Clock3 size={16} /> Active Deliverables</Button>
        <Button variant="secondary" onClick={() => navigate('/freelancer/profile')}><UserCircle2 size={16} /> Profile / Settings</Button>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'start', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'grid', gap: '16px' }}>
          <SectionCard
            title="Active Assignments"
            right={<Link to="/freelancer/work" className="text-gradient-premium" style={{ textDecoration: 'none', fontWeight: 800 }}>Open Tracker</Link>}
            delay={0.3}
          >
            {isLoading ? (
              <p style={{ margin: '14px 0 0', color: '#64748b' }}>Loading assignments...</p>
            ) : sortedProjects.length === 0 ? (
              <div style={{ marginTop: '16px' }}>
                <EmptyState
                  message="No assignments yet. Browse projects and start building momentum."
                  action={<Button to="/freelancer/projects" variant="primary">Browse Projects</Button>}
                />
              </div>
            ) : (
              <div style={{ marginTop: '8px', display: 'grid', gap: '10px' }}>
                {sortedProjects.slice(0, 8).map((project, idx) => {
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
                          </p>
                          {unread > 0 && (
                            <span style={{ display: 'inline-block', marginTop: '8px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '999px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700 }}>
                              {unread} new response{unread > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <StatusBadge status={project.status} />
                      </div>

                      {project.status === 'Assigned' && (
                        <div style={{ marginTop: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '10px', display: 'grid', gap: '8px' }}>
                          <textarea
                            className="textarea"
                            placeholder="Submission notes"
                            value={submissionText[project.id] || ''}
                            onChange={(e) => setSubmissionText((prev) => ({ ...prev, [project.id]: e.target.value }))}
                            style={{ minHeight: '90px' }}
                          />
                          <input
                            className="input"
                            placeholder="Submission link"
                            value={submissionLink[project.id] || ''}
                            onChange={(e) => setSubmissionLink((prev) => ({ ...prev, [project.id]: e.target.value }))}
                          />
                          <input
                            className="input"
                            type="file"
                            multiple
                            onChange={(e) => setSubmissionFiles((prev) => ({ ...prev, [project.id]: Array.from(e.target.files || []) }))}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                            <Button
                              variant="primary"
                              onClick={() => handleSubmit(project.id)}
                              loading={submittingProjectId === project.id}
                              disabled={submittingProjectId === project.id}
                            >
                              <Send size={16} /> Submit
                            </Button>
                            <Button variant="secondary" onClick={() => navigate(`/projects/${project.id}`)}>
                              Details <ChevronRight size={16} />
                            </Button>
                          </div>
                        </div>
                      )}

                      {project.status !== 'Assigned' && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                          <Button variant="secondary" onClick={() => navigate(`/projects/${project.id}`)}>
                            Details <ChevronRight size={16} />
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>

        <div style={{ display: 'grid', gap: '16px' }}>
          <SectionCard
            title="Recent Activity"
            right={<Link to="/freelancer/notifications" className="text-gradient-premium" style={{ textDecoration: 'none', fontWeight: 800 }}>View All</Link>}
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
                </motion.div>
              ))}
            </div>
            <div style={{ marginTop: '12px' }}>
              <Button variant="secondary" fullWidth onClick={() => navigate('/freelancer/notifications')}>
                Open Notifications <ArrowRight size={14} />
              </Button>
            </div>
          </SectionCard>
        </div>
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
            <Sparkles size={32} />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', marginBottom: '12px', fontFamily: '"Outfit", sans-serif' }}>
            Registration Successful
          </h2>
          <p style={{ color: '#475569', marginBottom: '32px', fontSize: '1.1rem', lineHeight: 1.6 }}>
            Welcome aboard, <strong>{user?.name}</strong>!<br /> 
            Your account has been created successfully. Start exploring gigs and building your portfolio today.
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
