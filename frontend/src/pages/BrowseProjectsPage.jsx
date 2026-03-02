import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  IndianRupee,
  Calendar,
  Layers,
  ChevronRight,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { applyForProject, getProjects } from '../services/projectService';
import { getProfile } from '../services/profileService';
import { useToast } from '../hooks/useToast';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import Loader from '../components/ui/Loader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import PremiumHero from '../components/ui/PremiumHero';
import { SKILLS_TAXONOMY } from '../data/skillsTaxonomy';
import { formatINR } from '../utils/currency';
import { formatDateOnly } from '../utils/date';

function parseSkills(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function matchesAnySkill(projectSkillsRaw, preferredSkills) {
  const projectSkills = parseSkills(projectSkillsRaw);
  if (!preferredSkills.length) return true;
  return projectSkills.some((skill) => preferredSkills.includes(skill));
}

export default function BrowseProjectsPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ minBudget: '', maxBudget: '', category: '' });
  const [preferredSkills, setPreferredSkills] = useState([]);
  const [usePreferences, setUsePreferences] = useState(searchParams.get('pref') === '1');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [applyingProjectId, setApplyingProjectId] = useState(null);

  const loadProjects = async () => {
    const params = { status: 'Open' };
    if (filters.minBudget) params.minBudget = Number(filters.minBudget);
    if (filters.maxBudget) params.maxBudget = Number(filters.maxBudget);

    try {
      setIsLoading(true);
      const { data } = await getProjects(params);
      const allProjects = Array.isArray(data?.projects) ? data.projects : [];
      let filtered = allProjects;

      if (filters.category) {
        const group = SKILLS_TAXONOMY.find((item) => item.category === filters.category);
        const allowedSkills = new Set((group?.subcategories || []).flatMap((sub) => sub.skills));
        filtered = allProjects.filter((project) => String(project.skillsRequired || '')
          .split(',')
          .map((skill) => skill.trim())
          .some((skill) => allowedSkills.has(skill)));
      }

      setProjects(filtered);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadProjects(); }, []);
  useEffect(() => {
    (async () => {
      try {
        const { data } = await getProfile();
        setPreferredSkills(parseSkills(data.profile?.skills));
      } catch {
        setPreferredSkills([]);
      }
    })();
  }, []);

  const filteredProjects = useMemo(() => {
    let filtered = projects;
    if (usePreferences && preferredSkills.length) {
      filtered = filtered.filter((project) => matchesAnySkill(project.skillsRequired, preferredSkills));
    }
    const query = String(searchTerm || '').trim().toLowerCase();
    if (query) {
      filtered = filtered.filter((project) => {
        const haystack = [
          project.title,
          project.description,
          project.skillsRequired,
          project.businessName,
        ]
          .map((value) => String(value || '').toLowerCase())
          .join(' ');
        return haystack.includes(query);
      });
    }
    return filtered;
  }, [projects, usePreferences, preferredSkills, searchTerm]);

  const togglePreferences = () => {
    setUsePreferences((prev) => {
      const next = !prev;
      if (next) {
        setFilters((current) => ({ ...current, category: '' }));
      }
      return next;
    });
  };

  const handleApply = async (projectId) => {
    try {
      setApplyingProjectId(projectId);
      await applyForProject(projectId, {});
      addToast('Application submitted', 'success');
      loadProjects();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to apply for project');
    } finally {
      setApplyingProjectId(null);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="premium-page-wrap"
      style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '32px clamp(20px, 5vw, 60px)', minHeight: '100vh', position: 'relative', background: 'radial-gradient(1200px 600px at 0% 0%, #f5f3ff 0%, transparent 50%), radial-gradient(1000px 600px at 100% 100%, #eef2ff 0%, transparent 50%)' }}
    >
      <div className="bg-noise" />

      <motion.div variants={itemVariants} style={{ position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'grid', gap: '16px' }}>
          <PremiumHero
            label="Freelancer Account"
            title="Browse Projects"
            subtitle="Sift through high-fidelity contract opportunities curated for excellence."
            right={(
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid rgba(148,163,184,0.22)', background: 'rgba(15,23,42,0.2)', borderRadius: '14px', padding: '12px 14px' }}>
                <Zap size={20} color="#93c5fd" />
                <div>
                  <p style={{ margin: 0, color: 'rgba(226,232,240,0.78)', fontWeight: 800, fontSize: '0.84rem' }}>My Preferences</p>
                </div>
                <button
                  onClick={togglePreferences}
                  disabled={!preferredSkills.length}
                  style={{
                    border: '1px solid rgba(147,197,253,0.4)',
                    background: usePreferences ? 'rgba(59,130,246,0.25)' : 'rgba(15,23,42,0.35)',
                    color: '#dbeafe',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: preferredSkills.length ? 'pointer' : 'not-allowed',
                    opacity: preferredSkills.length ? 1 : 0.55,
                  }}
                >
                  {usePreferences ? 'On' : 'Off'}
                </button>
                <div>
                  <p style={{ margin: 0, color: 'rgba(191,219,254,0.92)', fontWeight: 700, fontSize: '0.8rem' }}>
                    {usePreferences ? 'Using skill filters' : 'Show all projects'}
                  </p>
                </div>
              </div>
            )}
          />

          <Card className="glass" style={{ padding: '24px', border: '1px solid rgba(79,70,229,0.14)', background: 'rgba(255,255,255,0.88)' }}>
            <div style={{ marginBottom: '16px', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#4f46e5' }} />
              <input
                className="input"
                placeholder="Search by title, skill, company, or keywords..."
                style={{ paddingLeft: '50px', background: '#fff' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              <div style={{ position: 'relative' }}>
                <IndianRupee size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#4f46e5' }} />
                <input
                  className="input"
                  placeholder="Floor Budget"
                  type="number"
                  style={{ paddingLeft: '50px', background: '#fff' }}
                  value={filters.minBudget} onChange={(e) => setFilters({ ...filters, minBudget: e.target.value })}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <IndianRupee size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#4f46e5' }} />
                <input
                  className="input"
                  placeholder="Ceiling Budget"
                  type="number"
                  style={{ paddingLeft: '50px', background: '#fff' }}
                  value={filters.maxBudget} onChange={(e) => setFilters({ ...filters, maxBudget: e.target.value })}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <Layers size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#4f46e5' }} />
                <select
                  className="select"
                  style={{ paddingLeft: '50px', background: '#fff', width: '100%' }}
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  disabled={isLoading || usePreferences}
                >
                  <option value="">{usePreferences ? 'Parameters Controlled' : 'All Disciplines'}</option>
                  {SKILLS_TAXONOMY.map((item) => (
                    <option key={item.category} value={item.category}>{item.category}</option>
                  ))}
                </select>
              </div>
              <Button variant="primary" onClick={loadProjects} disabled={isLoading} loading={isLoading} style={{ height: '56px', borderRadius: '16px', fontWeight: 900, fontSize: '1rem' }}>
                <Search size={20} style={{ marginRight: '10px' }} /> Analyze Opportunities
              </Button>
            </div>
          </Card>
        </div>
      </motion.div>

      {error && <motion.p variants={itemVariants} className="badge-premium" style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.15)', padding: '16px', textAlign: 'center' }}>{error}</motion.p>}

      {isLoading ? (
        <div className="grid grid-auto" style={{ gap: '24px' }}>
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="card-ui skeleton-card" style={{ height: '280px', borderRadius: '24px', opacity: 0.5, background: '#fff', border: '1px solid #e2e8f0' }} />)}
        </div>
      ) : filteredProjects.length > 0 ? (
        <motion.div
          variants={containerVariants}
          className="grid grid-auto stagger-grid"
          style={{ gap: '24px', position: 'relative', zIndex: 5 }}
        >
          {filteredProjects.map((project) => (
            <motion.div
              key={project.id}
              variants={itemVariants}
              whileHover={{ y: -8, backgroundColor: '#fff', border: '1px solid rgba(79, 70, 229, 0.3)', boxShadow: '0 20px 40px rgba(79, 70, 229, 0.08)' }}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="card-ui"
              style={{ padding: '32px', border: '1px solid #e2e8f0', background: 'rgba(255, 255, 255, 0.8)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', height: '100%' }}
            >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 8px', fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.25 }}>
                        {project.title}
                      </h3>
                      <div style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '24px', height: '24px', background: 'rgba(79, 70, 229, 0.05)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Clock size={12} color="#4f46e5" />
                        </div>
                        Protocol by <span style={{ color: '#1e293b' }}>{project.businessName}</span>
                      </div>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', padding: '20px', background: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Valuation</p>
                      <p style={{ margin: 0, fontWeight: 900, color: '#10b981', fontSize: '1.2rem' }}>{formatINR(project.budget)}</p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Expiry</p>
                      <p style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>{formatDateOnly(project.deadline)}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {parseSkills(project.skillsRequired).slice(0, 3).map(skill => (
                      <span key={skill} className="badge-premium" style={{ fontSize: '0.7rem', padding: '6px 14px', background: 'rgba(79, 70, 229, 0.05)', border: '1px solid rgba(79, 70, 229, 0.1)', color: '#4f46e5', borderRadius: '10px' }}>
                        {skill}
                      </span>
                    ))}
                    {parseSkills(project.skillsRequired).length > 3 && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '6px 4px', color: '#94a3b8' }}>
                        +{parseSkills(project.skillsRequired).length - 3} more
                      </span>
                    )}
                  </div>

                  {project.hasApplied && (
                    <div style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '14px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CheckCircle2 size={18} color="#10b981" />
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#10b981' }}>Applied: {project.applicationStatus || 'In Review'}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                    <Link to={`/projects/${project.id}`} className="text-gradient-premium" style={{ fontSize: '1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Manifesto <ArrowRight size={18} />
                    </Link>
                    <Button
                      variant="primary"
                      onClick={(e) => { e.stopPropagation(); handleApply(project.id); }}
                      disabled={project.hasApplied || applyingProjectId === project.id}
                      loading={applyingProjectId === project.id}
                      style={{ borderRadius: '12px', padding: '10px 24px', fontWeight: 900 }}
                    >
                      {project.hasApplied ? 'Submission Verfied' : 'Instant Apply'}
                    </Button>
                  </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div className="card-ui" style={{ border: '1px dashed #e2e8f0', padding: '120px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', background: 'rgba(255, 255, 255, 0.5)' }}>
          <EmptyState
            icon={<Search size={64} color="#e2e8f0" />}
            message={usePreferences ? 'No projects currently match your expert profile.' : 'No projects found in this sector matching your parameters.'}
          />
          {usePreferences && (
            <Button variant="secondary" onClick={togglePreferences} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}>
              Reset Strategy Filter
            </Button>
          )}
        </motion.div>
      )}
    </motion.section>
  );
}
