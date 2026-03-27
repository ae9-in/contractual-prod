import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Rocket,
  Target,
  Calendar,
  IndianRupee,
  FileText,
  ChevronRight,
  Sparkles,
  Layout,
  Plus
} from 'lucide-react';
import { postProject } from '../services/projectService';
import { useToast } from '../hooks/useToast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SkillSelector from '../components/ui/SkillSelector';
import PremiumHero from '../components/ui/PremiumHero';
import { getApiErrorMessage, getApiFieldErrors } from '../utils/validation';

export default function PostProjectPage() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', budget: '', deadline: '', skillsRequired: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const nextErrors = {};
    const title = String(form.title || '').trim();
    const description = String(form.description || '').trim();
    const skills = String(form.skillsRequired || '').trim();
    const budget = Number(form.budget);
    const deadlineMs = Date.parse(String(form.deadline || ''));

    if (title.length < 3) nextErrors.title = 'Title must be at least 3 characters.';
    if (description.length < 5) nextErrors.description = 'Description must be at least 5 characters.';
    if (!Number.isFinite(budget) || budget <= 0) nextErrors.budget = 'Budget must be greater than 0.';
    if (skills.length < 1) nextErrors.skillsRequired = 'Please add at least one required skill.';
    if (Number.isNaN(deadlineMs)) nextErrors.deadline = 'Please choose a valid deadline.';

    return nextErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      setError('Please fix the highlighted fields before submitting.');
      return;
    }
    setIsSubmitting(true);
    try {
      await postProject({ ...form, budget: Number(form.budget) });
      addToast('Project launched successfully!', 'success');
      navigate('/business/projects');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to post project'));
      setFieldErrors(getApiFieldErrors(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}
    >
      <PremiumHero
        label="Business Account"
        title="Launch Your Vision"
        subtitle="Define your requirements and connect with elite freelancers."
        actions={<span className="badge-premium"><Sparkles size={16} /> Premium Project Creation</span>}
      />

      <Card style={{ padding: '40px', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

          <div className="form-group">
            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>
              <Layout size={18} color="#4f46e5" /> Project Title
            </label>
            <input
              className={`input ${fieldErrors.title ? 'input-error' : ''}`}
              placeholder="e.g., Premium Web Portal Development"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              style={{ padding: '14px 18px', borderRadius: '14px', fontSize: '1rem' }}
            />
            {fieldErrors.title && <p className="field-error">{fieldErrors.title}</p>}
          </div>

          <div className="form-group">
            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>
              <FileText size={18} color="#4f46e5" /> Description & Scope
            </label>
            <textarea
              className={`textarea ${fieldErrors.description ? 'input-error' : ''}`}
              placeholder="Describe the goals, deliverables, and technical requirements..."
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              style={{ padding: '14px 18px', borderRadius: '14px', fontSize: '1rem', resize: 'none' }}
            />
            {fieldErrors.description && <p className="field-error">{fieldErrors.description}</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
            <div className="form-group">
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>
                <IndianRupee size={18} color="#4f46e5" /> Budget (INR)
              </label>
              <input
                className={`input ${fieldErrors.budget ? 'input-error' : ''}`}
                type="number"
                placeholder="50000"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                required
                style={{ padding: '14px 18px', borderRadius: '14px', fontSize: '1rem' }}
              />
              {fieldErrors.budget && <p className="field-error">{fieldErrors.budget}</p>}
            </div>

            <div className="form-group">
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>
                <Calendar size={18} color="#4f46e5" /> Hard Deadline
              </label>
              <input
                className={`input ${fieldErrors.deadline ? 'input-error' : ''}`}
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                required
                style={{ padding: '14px 18px', borderRadius: '14px', fontSize: '1rem' }}
              />
              {fieldErrors.deadline && <p className="field-error">{fieldErrors.deadline}</p>}
            </div>
          </div>

          <div className="form-group">
            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>
              <Target size={18} color="#4f46e5" /> Expertise Required
            </label>
            <SkillSelector
              value={form.skillsRequired}
              onChange={(skills) => setForm({ ...form, skillsRequired: skills })}
            />
            {fieldErrors.skillsRequired && <p className="field-error">{fieldErrors.skillsRequired}</p>}
          </div>

          {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="alert alert-danger" style={{ borderRadius: '12px' }}>{error}</motion.p>}

          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting}
            loading={isSubmitting}
            style={{ padding: '16px', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 800, marginTop: '20px' }}
          >
            Launch Project <Rocket size={20} style={{ marginLeft: '10px' }} />
          </Button>
        </form>
      </Card>

      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <Button variant="secondary" onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: 700 }}>
          Cancel and Return
        </Button>
      </div>
    </motion.div>
  );
}
