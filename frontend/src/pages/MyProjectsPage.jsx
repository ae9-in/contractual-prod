import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Filter, ListTodo, PlusCircle, LayoutDashboard, ChevronRight, Bell } from 'lucide-react';
import { getMyProjects } from '../services/projectService';
import { getUnreadProjectNotifications } from '../services/notificationService';
import { connectRealtime, onRealtime } from '../services/realtimeService';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import Loader from '../components/ui/Loader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import PremiumHero from '../components/ui/PremiumHero';
import { formatINR } from '../utils/currency';
import { formatDateOnly } from '../utils/date';

export default function MyProjectsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadByProject, setUnreadByProject] = useState({});

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const { data } = await getMyProjects();
      setProjects(Array.isArray(data?.projects) ? data.projects : []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load projects');
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadProjects(); }, []);

  useEffect(() => {
    let active = true;
    const loadUnread = async () => {
      try {
        const { data } = await getUnreadProjectNotifications();
        if (active) setUnreadByProject(data.unreadByProject || {});
      } catch {
        if (active) setUnreadByProject({});
      }
    };

    connectRealtime();
    const offNew = onRealtime('notifications:new', loadUnread);
    const offCount = onRealtime('notifications:count', loadUnread);
    loadUnread();

    return () => {
      active = false;
      offNew();
      offCount();
    };
  }, []);

  const selectedStatus = searchParams.get('status');
  const filteredProjects = useMemo(
    () => (selectedStatus ? projects.filter((p) => p.status === selectedStatus) : projects),
    [projects, selectedStatus],
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const setStatus = (status) => {
    if (!status) {
      searchParams.delete('status');
    } else {
      searchParams.set('status', status);
    }
    setSearchParams(searchParams);
  };

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="grid"
      style={{ gap: '32px' }}
    >
      <motion.div variants={itemVariants}>
        <PremiumHero
          label="Business Workspace"
          title="My Projects"
          subtitle="Manage your postings and track freelancer progress in real-time."
          actions={(
            <Link to="/business/post-project">
              <Button variant="primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
                <PlusCircle size={18} /> Post New Project
              </Button>
            </Link>
          )}
        />
      </motion.div>

      <motion.div variants={itemVariants} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '8px', color: '#64748b', fontWeight: 600, fontSize: '0.9rem' }}>
          <Filter size={16} /> Filter by Status:
        </div>
        {[
          { id: null, label: 'All' },
          { id: 'Open', label: 'Open' },
          { id: 'Assigned', label: 'Assigned' },
          { id: 'Submitted', label: 'Submitted' },
          { id: 'Completed', label: 'Completed' },
        ].map((btn) => (
          <button
            key={btn.label}
            onClick={() => setStatus(btn.id)}
            style={{
              padding: '8px 20px',
              borderRadius: '999px',
              border: 'none',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: selectedStatus === btn.id ? '#4f46e5' : '#f1f5f9',
              color: selectedStatus === btn.id ? 'white' : '#64748b',
              transition: 'all 0.2s',
              boxShadow: selectedStatus === btn.id ? '0 4px 12px rgba(79, 70, 229, 0.2)' : 'none'
            }}
          >
            {btn.label}
          </button>
        ))}
      </motion.div>

      {error && <motion.p variants={itemVariants} className="alert alert-danger">{error}</motion.p>}

      {isLoading ? (
        <div className="grid grid-auto">
          {[1, 2, 3].map(i => <Card key={i} className="skeleton-card" style={{ height: '220px', borderRadius: '24px' }} />)}
        </div>
      ) : (
        <>
          {filteredProjects.length > 0 ? (
            <div className="grid grid-auto stagger-grid">
              {filteredProjects.map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(15,23,42,0.08)' }}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  style={{ background: 'white', borderRadius: '24px', padding: '28px', border: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden', height: '100%' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, lineHeight: 1.4, color: '#0f172a', fontFamily: '"Outfit", sans-serif' }}>
                      {project.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {Number(unreadByProject[project.id] || 0) > 0 && (
                        <span style={{ background: '#ef4444', color: 'white', fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '999px' }}>
                          {unreadByProject[project.id]} New
                        </span>
                      )}
                      <StatusBadge status={project.status} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', padding: '16px', background: '#f8fafc', borderRadius: '16px' }}>
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Budget</p>
                      <p style={{ margin: 0, fontWeight: 800, color: '#0f172a', fontSize: '1.1rem' }}>{formatINR(project.budget)}</p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deadline</p>
                      <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>{formatDateOnly(project.deadline)}</p>
                    </div>
                  </div>

                  {project.status === 'Submitted' && (
                    <div style={{ padding: '12px 16px', background: '#ecfdf5', borderRadius: '12px', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Bell size={16} color="#059669" />
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#065f46' }}>Deliverables ready to review</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '8px' }}>
                    <div style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                      {project.freelancerId ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                          Assigned
                        </span>
                      ) : 'Awaiting Applications'}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Link
                        to={`/projects/${project.id}#applications`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="secondary" className="btn-sm" style={{ height: '38px', borderRadius: '10px', fontSize: '0.85rem' }}>
                          Applications
                        </Button>
                      </Link>
                      <Link to={`/projects/${project.id}`} onClick={(e) => e.stopPropagation()}>
                        <Button variant="secondary" className="btn-sm" style={{ height: '38px', borderRadius: '10px', fontSize: '0.9rem' }}>
                          Manage <ChevronRight size={14} style={{ marginLeft: '4px' }} />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div>
              <Card style={{ padding: '80px 20px', textAlign: 'center', background: 'white', borderRadius: '24px', border: '1px dashed #cbd5e1' }}>
                <EmptyState
                  message={selectedStatus ? `No ${selectedStatus.toLowerCase()} projects found.` : "You haven't posted any projects yet."}
                />
                {!selectedStatus && (
                  <Link to="/business/post-project" style={{ marginTop: '24px', display: 'inline-block' }}>
                    <Button>Create Your First Project</Button>
                  </Link>
                )}
              </Card>
            </div>
          )}
        </>
      )}
    </motion.section>
  );
}
