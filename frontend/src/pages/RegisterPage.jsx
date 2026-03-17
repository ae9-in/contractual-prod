import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, UserCircle, Phone } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getApiErrorMessage, getApiFieldErrors } from '../utils/validation';

function getContactPhoneError(value) {
  if (!value) return 'Contact phone is required.';
  if (!/^\d{10}$/.test(value)) return 'Contact phone must be a valid 10-digit number.';
  return '';
}

export default function RegisterPage() {
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', contactPhone: '', role: 'freelancer' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    const contactPhoneError = getContactPhoneError(form.contactPhone);
    if (contactPhoneError) {
      setFieldErrors({ contactPhone: contactPhoneError });
      return;
    }
    setIsSubmitting(true);
    try {
      await register(form);
      addToast({
        type: 'success',
        title: 'Registration Successful',
        message: 'Welcome aboard! Your account has been created successfully. Login now to explore your gigs.',
        duration: 5200,
      });
      setTimeout(() => navigate('/login'), 2200);
    } catch (err) {
      setFieldErrors(getApiFieldErrors(err));
      setError(getApiErrorMessage(err, 'Registration failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="premium-page-wrap" style={{
      minHeight: 'calc(100vh - 80px)',
      display: 'grid',
      placeItems: 'center',
      padding: '24px 20px 40px',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f0fe 50%, #f5f3ff 100%)'
    }}>
      <motion.div
        style={{ position: 'absolute', width: '600px', height: '600px', borderRadius: '999px', filter: 'blur(80px)', background: 'rgba(59, 130, 246, 0.1)', top: '-200px', left: '-15%', pointerEvents: 'none' }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 9, repeat: Infinity }}
      />
      <motion.div
        style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '999px', filter: 'blur(80px)', background: 'rgba(99, 102, 241, 0.08)', bottom: '-150px', right: '-10%', pointerEvents: 'none' }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 11, repeat: Infinity }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: '600px', position: 'relative', zIndex: 10 }}
      >
        <Card className="glass" style={{ width: '100%', maxWidth: '600px', padding: 'clamp(26px, 4vw, 52px)', border: '1px solid rgba(79, 70, 229, 0.15)', background: 'rgba(255, 255, 255, 0.84)', boxShadow: '0 40px 100px rgba(79, 70, 229, 0.1)', borderRadius: '28px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <motion.div
              whileHover={{ rotate: -10, scale: 1.1 }}
              style={{ width: '72px', height: '72px', background: 'var(--primary-gradient)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#fff', boxShadow: '0 12px 24px rgba(124, 58, 237, 0.2)' }}
            >
              <UserPlus size={36} />
            </motion.div>
            <h2 className="text-gradient-premium" style={{ fontSize: '2.8rem', fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.04em' }}>Join Contractual</h2>
            <p style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: 500 }}>Start your professional journey today.</p>
          </div>

          <form className="form" onSubmit={handleSubmit} style={{ display: 'grid', gap: '24px' }}>
            <div style={{ display: 'grid', gap: '10px' }}>
              <label className="label" htmlFor="name" style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#818cf8' }} />
                <input
                  id="name"
                  className="input"
                  placeholder="Jeevan K."
                  style={{ paddingLeft: '52px' }}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              {fieldErrors.name && <p className="field-error" style={{ fontSize: '0.9rem', color: '#ef4444', fontWeight: 600 }}>{fieldErrors.name}</p>}
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              <label className="label" htmlFor="reg-email" style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#818cf8' }} />
                <input
                  id="reg-email"
                  className="input"
                  placeholder="you@example.com"
                  style={{ paddingLeft: '52px' }}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              {fieldErrors.email && <p className="field-error" style={{ fontSize: '0.9rem', color: '#ef4444', fontWeight: 600 }}>{fieldErrors.email}</p>}
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              <label className="label" htmlFor="reg-password" style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#818cf8' }} />
                <input
                  id="reg-password"
                  className="input"
                  placeholder="At least 8 characters"
                  type="password"
                  style={{ paddingLeft: '52px' }}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              {fieldErrors.password && <p className="field-error" style={{ fontSize: '0.9rem', color: '#ef4444', fontWeight: 600 }}>{fieldErrors.password}</p>}
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              <label className="label" htmlFor="contactPhone" style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b' }}>Contact Phone</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#818cf8' }} />
                <input
                  id="contactPhone"
                  className="input"
                  placeholder="9876543210"
                  inputMode="numeric"
                  maxLength={10}
                  style={{ paddingLeft: '52px' }}
                  value={form.contactPhone}
                  onChange={(e) => {
                    const nextValue = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setForm({ ...form, contactPhone: nextValue });
                    setFieldErrors((prev) => ({ ...prev, contactPhone: getContactPhoneError(nextValue) }));
                  }}
                  disabled={isSubmitting}
                />
              </div>
              {fieldErrors.contactPhone && <p className="field-error" style={{ fontSize: '0.9rem', color: '#ef4444', fontWeight: 600 }}>{fieldErrors.contactPhone}</p>}
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              <label className="label" htmlFor="role" style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b' }}>I want to join as a...</label>
              <div style={{ position: 'relative' }}>
                <UserCircle size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#818cf8' }} />
                <select
                  id="role"
                  className="select"
                  style={{ paddingLeft: '52px' }}
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  disabled={isSubmitting}
                >
                  <option value="freelancer">Freelancer (I want to work)</option>
                  <option value="business">Business (I want to hire)</option>
                </select>
              </div>
              {fieldErrors.role && <p className="field-error" style={{ fontSize: '0.9rem', color: '#ef4444', fontWeight: 600 }}>{fieldErrors.role}</p>}
            </div>

            {error && <p className="alert alert-danger" style={{ margin: 0, padding: '16px', borderRadius: '14px', background: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', fontWeight: 600 }}>{error}</p>}

            <Button type="submit" loading={isSubmitting} variant="primary" style={{ height: '60px', borderRadius: '18px', fontWeight: 900, fontSize: '1.2rem', marginTop: '8px' }} fullWidth>Create My Account</Button>
          </form>

          <div style={{ marginTop: '40px', textAlign: 'center', paddingTop: '32px', borderTop: '1px solid #f1f5f9' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: '1.05rem', fontWeight: 500 }}>
              Already have an account? <Link to="/login" style={{ color: '#4f46e5', fontWeight: 800, textDecoration: 'none' }}>Sign In</Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
