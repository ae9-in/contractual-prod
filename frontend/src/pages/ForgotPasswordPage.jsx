import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { forgotPassword, resetPassword, verifyResetOtp } from '../services/authService';
import { getApiErrorMessage, getApiFieldErrors } from '../utils/validation';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: '', otp: '', newPassword: '' });
  const [stage, setStage] = useState(1);
  const [token, setToken] = useState(String(searchParams.get('token') || '').trim());
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setSuccess('');
    setIsSubmitting(true);
    try {
      if (stage === 1) {
        const { data } = await forgotPassword({ email: form.email });
        setToken(String(data?.token || ''));
        setStage(2);
        setSuccess('If an account exists, an OTP has been sent to your email.');
      } else if (stage === 2) {
        await verifyResetOtp({ token, otp: form.otp });
        setStage(3);
        setSuccess('Code verified. Set your new password.');
      } else {
        await resetPassword({ token, newPassword: form.newPassword });
        setSuccess('Password reset successful. You can now sign in.');
        setTimeout(() => navigate('/login'), 1200);
      }
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
                <input id="fp-email" className="input" style={{ paddingLeft: '42px', height: '50px' }} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={isSubmitting || stage > 1} />
              </div>
              {fieldErrors.email && <p style={{ margin: 0, color: '#dc2626', fontSize: '0.82rem', fontWeight: 700 }}>{fieldErrors.email}</p>}
            </div>

            {stage >= 2 && (
              <div style={{ display: 'grid', gap: '6px' }}>
                <label htmlFor="fp-otp" style={{ fontWeight: 700, color: '#1e293b' }}>OTP Code</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#818cf8' }} />
                  <input
                    id="fp-otp"
                    className="input"
                    style={{ paddingLeft: '42px', height: '50px' }}
                    value={form.otp}
                    maxLength={6}
                    inputMode="numeric"
                    onChange={(e) => setForm({ ...form, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    disabled={isSubmitting || stage > 2}
                  />
                </div>
                {fieldErrors.otp && <p style={{ margin: 0, color: '#dc2626', fontSize: '0.82rem', fontWeight: 700 }}>{fieldErrors.otp}</p>}
              </div>
            )}

            {stage >= 3 && (
              <div style={{ display: 'grid', gap: '6px' }}>
              <label htmlFor="fp-password" style={{ fontWeight: 700, color: '#1e293b' }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#818cf8' }} />
                <input id="fp-password" className="input" type={showNewPassword ? 'text' : 'password'} style={{ paddingLeft: '42px', paddingRight: '42px', height: '50px' }} value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} disabled={isSubmitting} />
                <button
                  type="button"
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'transparent',
                    color: '#818cf8',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  disabled={isSubmitting}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.newPassword && <p style={{ margin: 0, color: '#dc2626', fontSize: '0.82rem', fontWeight: 700 }}>{fieldErrors.newPassword}</p>}
              </div>
            )}

            {error && <p style={{ margin: 0, padding: '12px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', fontWeight: 700 }}>{error}</p>}
            {success && <p style={{ margin: 0, padding: '12px', borderRadius: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontWeight: 700 }}>{success}</p>}

            <Button type="submit" loading={isSubmitting} variant="primary" fullWidth style={{ height: '52px', fontWeight: 800 }}>
              {stage === 1 ? 'Send OTP' : stage === 2 ? 'Verify OTP' : 'Reset Password'}
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

