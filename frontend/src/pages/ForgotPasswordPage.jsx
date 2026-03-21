import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Mail, Phone, Lock } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { forgotPassword } from '../services/authService';
import { getApiErrorMessage, getApiFieldErrors } from '../utils/validation';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', contactPhone: '', newPassword: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setSuccess('');
    setIsSubmitting(true);
    try {
      await forgotPassword(form);
      setSuccess('Password reset successful. You can now sign in.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setFieldErrors(getApiFieldErrors(err));
      setError(getApiErrorMessage(err, 'Failed to reset password'));
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
      background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f0fe 50%, #f5f3ff 100%)',
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <Card style={{ padding: '36px', borderRadius: '28px', background: 'rgba(255,255,255,0.95)' }}>
          <div style={{ textAlign: 'center', marginBottom: '26px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '18px', margin: '0 auto 14px', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <KeyRound size={30} />
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: '2rem', fontWeight: 900, color: '#0f172a' }}>Forgot Password</h2>
            <p style={{ margin: 0, color: '#64748b', fontWeight: 500 }}>Verify email + phone and set a new password.</p>
          </div>

          <form onSubmit={onSubmit} style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'grid', gap: '6px' }}>
              <label htmlFor="fp-email" style={{ fontWeight: 700, color: '#1e293b' }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#818cf8' }} />
                <input id="fp-email" className="input" style={{ paddingLeft: '42px', height: '50px' }} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={isSubmitting} />
              </div>
              {fieldErrors.email && <p style={{ margin: 0, color: '#dc2626', fontSize: '0.82rem', fontWeight: 700 }}>{fieldErrors.email}</p>}
            </div>

            <div style={{ display: 'grid', gap: '6px' }}>
              <label htmlFor="fp-phone" style={{ fontWeight: 700, color: '#1e293b' }}>Contact Phone</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#818cf8' }} />
                <input
                  id="fp-phone"
                  className="input"
                  style={{ paddingLeft: '42px', height: '50px' }}
                  value={form.contactPhone}
                  maxLength={10}
                  inputMode="numeric"
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  disabled={isSubmitting}
                />
              </div>
              {fieldErrors.contactPhone && <p style={{ margin: 0, color: '#dc2626', fontSize: '0.82rem', fontWeight: 700 }}>{fieldErrors.contactPhone}</p>}
            </div>

            <div style={{ display: 'grid', gap: '6px' }}>
              <label htmlFor="fp-password" style={{ fontWeight: 700, color: '#1e293b' }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#818cf8' }} />
                <input id="fp-password" className="input" type="password" style={{ paddingLeft: '42px', height: '50px' }} value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} disabled={isSubmitting} />
              </div>
              {fieldErrors.newPassword && <p style={{ margin: 0, color: '#dc2626', fontSize: '0.82rem', fontWeight: 700 }}>{fieldErrors.newPassword}</p>}
            </div>

            {error && <p style={{ margin: 0, padding: '12px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', fontWeight: 700 }}>{error}</p>}
            {success && <p style={{ margin: 0, padding: '12px', borderRadius: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontWeight: 700 }}>{success}</p>}

            <Button type="submit" loading={isSubmitting} variant="primary" fullWidth style={{ height: '52px', fontWeight: 800 }}>
              Reset Password
            </Button>
          </form>

          <p style={{ margin: '20px 0 0', textAlign: 'center', color: '#64748b', fontWeight: 500 }}>
            Back to <Link to="/login" style={{ color: '#3b82f6', fontWeight: 800, textDecoration: 'none' }}>Login</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}

