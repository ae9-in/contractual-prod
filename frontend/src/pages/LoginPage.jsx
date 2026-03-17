import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getApiErrorMessage, getApiFieldErrors } from '../utils/validation';
import { getStoredUserRaw } from '../utils/authStorage';

export default function LoginPage() {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await login(form);
      const rawUser = getStoredUserRaw();
      const user = rawUser ? JSON.parse(rawUser) : {};
      addToast('Welcome back to Contractual', 'success');
      navigate(user.role === 'business' ? '/business/dashboard' : '/freelancer/dashboard');
    } catch (err) {
      setFieldErrors(getApiFieldErrors(err));
      setError(getApiErrorMessage(err, 'Login failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f0fe 50%, #f5f3ff 100%)'
    }}>
      {/* Background orbs */}
      <motion.div
        style={{ position: 'absolute', width: '500px', height: '500px', background: 'rgba(59,130,246,0.1)', top: '-150px', right: '-10%', borderRadius: '999px', filter: 'blur(80px)', pointerEvents: 'none' }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        style={{ position: 'absolute', width: '400px', height: '400px', background: 'rgba(99,102,241,0.08)', bottom: '-100px', left: '-5%', borderRadius: '999px', filter: 'blur(80px)', pointerEvents: 'none' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: '460px', position: 'relative', zIndex: 10 }}
      >
        <Card style={{ padding: '52px', border: '1px solid rgba(59,130,246,0.15)', background: 'rgba(255,255,255,0.95)', boxShadow: '0 32px 80px rgba(59,130,246,0.1)', borderRadius: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              style={{ width: '72px', height: '72px', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#fff', boxShadow: '0 12px 28px rgba(59,130,246,0.3)' }}
            >
              <LogIn size={34} />
            </motion.div>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 900, margin: '0 0 10px', letterSpacing: '-0.04em', fontFamily: '"Outfit", sans-serif', color: '#0f172a' }}>Welcome Back</h2>
            <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 500, margin: 0 }}>Access your Contractual workspace.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label htmlFor="email" style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={17} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#818cf8', pointerEvents: 'none' }} />
                <input
                  id="email"
                  className="input"
                  placeholder="name@company.com"
                  style={{ paddingLeft: '48px', height: '52px', borderRadius: '14px' }}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              {fieldErrors.email && <p style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600, margin: 0 }}>{fieldErrors.email}</p>}
            </div>

            <div style={{ display: 'grid', gap: '8px' }}>
              <label htmlFor="password" style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={17} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#818cf8', pointerEvents: 'none' }} />
                <input
                  id="password"
                  className="input"
                  placeholder="Enter password"
                  type="password"
                  style={{ paddingLeft: '48px', height: '52px', borderRadius: '14px' }}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              {fieldErrors.password && <p style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600, margin: 0 }}>{fieldErrors.password}</p>}
            </div>

            {error && <p style={{ margin: 0, padding: '14px 16px', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', fontWeight: 600, fontSize: '0.9rem' }}>{error}</p>}

            <Button type="submit" loading={isSubmitting} variant="primary" style={{ height: '56px', borderRadius: '16px', fontWeight: 800, fontSize: '1.1rem', marginTop: '4px' }} fullWidth>
              Sign In <ArrowRight size={18} style={{ marginLeft: '8px' }} />
            </Button>
          </form>

          <div style={{ marginTop: '32px', textAlign: 'center', paddingTop: '28px', borderTop: '1px solid #f1f5f9' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.97rem', fontWeight: 500 }}>
              New to Contractual? <Link to="/register" style={{ color: '#3b82f6', fontWeight: 800, textDecoration: 'none' }}>Create Account</Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
