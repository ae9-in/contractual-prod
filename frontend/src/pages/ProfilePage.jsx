import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Mail, Briefcase, Star, Link2, Clock,
  CheckCircle, Activity, Save, Edit3, Building2, Award, Camera, Upload, Phone
} from 'lucide-react';
import { getProfile, updateProfile, updateProfilePhoto } from '../services/profileService';
import { getUserRatingSummary } from '../services/ratingService';
import { getProjects, getMyProjects } from '../services/projectService';
import Button from '../components/ui/Button';
import SkillSelector from '../components/ui/SkillSelector';
import { getApiErrorMessage, getApiFieldErrors } from '../utils/validation';
import { useAuth } from '../hooks/useAuth';
import { getStoredToken } from '../utils/authStorage';

export default function ProfilePage() {
  const { user } = useAuth();
  const isFreelancer = user?.role === 'freelancer';
  const isBusiness = user?.role === 'business';

  const defaultSummary = { averageRating: 0, totalRatings: 0 };
  const [form, setForm] = useState({
    skills: '',
    bio: '',
    portfolioLink: '',
    experienceYears: 0,
    profilePhotoUrl: '',
    organizationName: '',
    organizationWebsite: '',
    organizationIndustry: '',
    contactEmail: '',
    contactPhone: '',
  });
  const [ratingSummary, setRatingSummary] = useState(defaultSummary);
  const [stats, setStats] = useState({ completed: 0, active: 0, total: 0 });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

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

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const { data } = await getProfile();
        const incomingProfile = data?.profile || {};
        setForm((prev) => ({
          ...prev,
          ...incomingProfile,
          contactEmail: String(incomingProfile.contactEmail || '').trim() || (isFreelancer ? (user?.email || '') : String(incomingProfile.contactEmail || '')),
        }));
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [isFreelancer, user?.email]);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const { data } = await getUserRatingSummary(user.id);
        setRatingSummary(data.summary || defaultSummary);
      } catch {
        setRatingSummary(defaultSummary);
      }
    })();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        let projects = [];
        if (isFreelancer) {
          const { data } = await getProjects({ assignedToMe: true });
          projects = data.projects || [];
          const completed = projects.filter(p => p.status === 'Completed').length;
          const active = projects.filter(p => ['Assigned', 'Submitted'].includes(p.status)).length;
          setStats({ completed, active, total: projects.length });
        } else if (isBusiness) {
          const { data } = await getMyProjects();
          projects = data.projects || [];
          const open = projects.filter(p => p.status === 'Open').length;
          const inProgress = projects.filter(p => !['Open', 'Completed', 'Cancelled'].includes(p.status)).length;
          const completed = projects.filter(p => p.status === 'Completed').length;
          setStats({ completed, active: open + inProgress, total: projects.length });
        }
      } catch {
        setStats({ completed: 0, active: 0, total: 0 });
      }
    })();
  }, [user?.id, isFreelancer, isBusiness]);

  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const onSelectPhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoFile(file);
    setPhotoPreview(objectUrl);
  };

  const onUploadPhoto = async () => {
    if (!photoFile) return;
    setError('');
    setMessage('');
    setFieldErrors({});
    setIsUploadingPhoto(true);
    try {
      const { data } = await updateProfilePhoto(photoFile);
      setForm((prev) => ({ ...prev, ...data.profile }));
      window.dispatchEvent(new CustomEvent('profile:updated', {
        detail: { profilePhotoUrl: data?.profile?.profilePhotoUrl || '' },
      }));
      setPhotoFile(null);
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
      setPhotoPreview('');
      setMessage('Profile photo updated successfully!');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to upload profile photo'));
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setFieldErrors({});
    setIsSaving(true);
    try {
      await updateProfile({
        ...form,
        experienceYears: Number(form.experienceYears || 0),
      });
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setFieldErrors(getApiFieldErrors(err));
      setError(getApiErrorMessage(err, 'Failed to update profile'));
    } finally {
      setIsSaving(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
  };

  const statItems = isFreelancer
    ? [
      { label: 'Completed Projects', value: stats.completed, icon: CheckCircle, color: '#10b981' },
      { label: 'Active Projects', value: stats.active, icon: Activity, color: '#3b82f6' },
      { label: 'Total Assigned', value: stats.total, icon: Briefcase, color: '#6366f1' },
    ]
    : [
      { label: 'Active Projects', value: stats.active, icon: Activity, color: '#3b82f6' },
      { label: 'Completed', value: stats.completed, icon: CheckCircle, color: '#10b981' },
      { label: 'Total Posted', value: stats.total, icon: Building2, color: '#6366f1' },
    ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: 'clamp(16px, 4vw, 32px) clamp(12px, 3vw, 24px)', maxWidth: '900px', margin: '0 auto', width: '100%' }}
    >
      {/* Header */}
      <motion.div variants={itemVariants} style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: '28px',
        padding: 'clamp(24px, 4vw, 40px)',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '28px',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '220px', height: '220px', borderRadius: '999px', background: 'rgba(59,130,246,0.15)', filter: 'blur(60px)', pointerEvents: 'none' }} />

        {form.profilePhotoUrl ? (
          <img
            src={photoPreview || buildProtectedAssetUrl(form.profilePhotoUrl)}
            alt={`${user?.name || 'User'} profile`}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '24px',
              objectFit: 'cover',
              boxShadow: '0 12px 32px rgba(59,130,246,0.4)',
              flexShrink: 0,
              position: 'relative',
              zIndex: 1,
              border: '2px solid rgba(255,255,255,0.25)',
            }}
          />
        ) : (
          <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 900, color: '#fff', boxShadow: '0 12px 32px rgba(59,130,246,0.4)', flexShrink: 0, position: 'relative', zIndex: 1 }}>
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        )}
        <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
          <p style={{ margin: '0 0 4px', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {isBusiness ? 'Business Account' : 'Freelancer Account'}
          </p>
          <h1 className="profile-hero-name" style={{ margin: '0 0 6px', fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 900, fontFamily: '"Outfit", sans-serif', letterSpacing: '-0.03em', color: '#fff', WebkitTextFillColor: '#fff', textShadow: '0 1px 10px rgba(0,0,0,0.25)' }}>
            {user?.name || 'User'}
          </h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem' }}>
              <Mail size={15} />
              <span>{user?.email}</span>
            </div>
            {user?.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem' }}>
                <Phone size={15} />
                <span>{user.phone}</span>
              </div>
            )}
          </div>
        </div>
        {ratingSummary.totalRatings > 0 && (
          <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', marginBottom: '4px' }}>
              <Star size={20} fill="#fbbf24" color="#fbbf24" />
              <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>{Number(ratingSummary.averageRating || 0).toFixed(1)}</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{ratingSummary.totalRatings} reviews</p>
          </div>
        )}
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px' }}>
        {statItems.map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{ background: '#fff', borderRadius: '20px', padding: '24px 20px', border: '1px solid rgba(99,102,241,0.1)', boxShadow: '0 4px 16px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{value}</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>{label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Edit Profile Form */}
      <motion.div variants={itemVariants} style={{ background: '#fff', borderRadius: '28px', padding: 'clamp(20px, 5vw, 36px)', border: '1px solid rgba(99,102,241,0.1)', boxShadow: '0 4px 24px rgba(15,23,42,0.04)', width: '100%', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'rgba(59,130,246,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Edit3 size={20} color="#3b82f6" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', fontFamily: '"Outfit", sans-serif' }}>
              Edit Profile
            </h2>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>
              {isBusiness ? 'Update your company information' : 'Showcase your skills and expertise'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '999px', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ margin: 0, fontWeight: 600 }}>Loading profile...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {(photoPreview || form.profilePhotoUrl) ? (
                  <img
                    src={photoPreview || buildProtectedAssetUrl(form.profilePhotoUrl)}
                    alt="Profile preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Camera size={24} color="#3b82f6" />
                )}
              </div>
              <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="profilePhoto" style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
                  Profile Photo
                </label>
                <input
                  id="profilePhoto"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={onSelectPhoto}
                  style={{ fontSize: '0.9rem', color: '#475569' }}
                />
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>PNG, JPG, or WEBP up to 5MB.</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={onUploadPhoto}
                disabled={!photoFile || isUploadingPhoto}
                loading={isUploadingPhoto}
                loadingText="Uploading..."
                style={{ height: '46px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}
              >
                <Upload size={16} /> Upload Photo
              </Button>
            </div>

            {/* Bio */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="bio" style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={16} color="#3b82f6" />
                {isBusiness ? 'Company Description' : 'Professional Bio'}
              </label>
              <textarea
                id="bio"
                className="textarea"
                placeholder={isBusiness ? 'Describe your company, industry, and what you look for in freelancers...' : 'Describe your expertise, experience, and what makes you stand out...'}
                value={form.bio || ''}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                style={{ minHeight: '120px', resize: 'vertical', borderRadius: '14px', padding: '14px 16px', fontSize: '0.95rem' }}
              />
              {fieldErrors.bio && <p style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600, margin: 0 }}>{fieldErrors.bio}</p>}
            </div>

            {/* Skills (freelancer only) */}
            {isFreelancer && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={16} color="#3b82f6" />
                  Skills & Expertise
                </label>
                <SkillSelector value={form.skills || ''} onChange={(skills) => setForm({ ...form, skills })} />
                {fieldErrors.skills && <p style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600, margin: 0 }}>{fieldErrors.skills}</p>}
              </div>
            )}

            {/* 2-col grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              {isFreelancer && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="portfolioLink" style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Link2 size={16} color="#3b82f6" />
                    Portfolio Link
                  </label>
                  <input
                    id="portfolioLink"
                    className="input"
                    placeholder="https://yourportfolio.com"
                    value={form.portfolioLink || ''}
                    onChange={(e) => setForm({ ...form, portfolioLink: e.target.value })}
                    style={{ height: '50px', borderRadius: '14px' }}
                  />
                  {fieldErrors.portfolioLink && <p style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600, margin: 0 }}>{fieldErrors.portfolioLink}</p>}
                </div>
              )}

              {isFreelancer && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="contactEmail" style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={16} color="#3b82f6" />
                    Contact Email
                  </label>
                  <input
                    id="contactEmail"
                    className="input"
                    type="email"
                    placeholder="you@yourmail.com"
                    value={form.contactEmail || ''}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    style={{ height: '50px', borderRadius: '14px' }}
                  />
                  {fieldErrors.contactEmail && <p style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600, margin: 0 }}>{fieldErrors.contactEmail}</p>}
                </div>
              )}

              {isBusiness && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="organizationName" style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building2 size={16} color="#3b82f6" />
                    Organization Name
                  </label>
                  <input
                    id="organizationName"
                    className="input"
                    placeholder="Your organization name"
                    value={form.organizationName || ''}
                    onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                    style={{ height: '50px', borderRadius: '14px' }}
                  />
                  {fieldErrors.organizationName && <p style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600, margin: 0 }}>{fieldErrors.organizationName}</p>}
                </div>
              )}

              {isFreelancer && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="experienceYears" style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} color="#3b82f6" />
                    Years of Experience
                  </label>
                  <input
                    id="experienceYears"
                    className="input"
                    type="number"
                    min="0"
                    max="50"
                    placeholder="e.g. 5"
                    value={form.experienceYears || 0}
                    onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
                    style={{ height: '50px', borderRadius: '14px' }}
                  />
                  {fieldErrors.experienceYears && <p style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600, margin: 0 }}>{fieldErrors.experienceYears}</p>}
                </div>
              )}
            </div>

            {isFreelancer && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="contactPhone" style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={16} color="#3b82f6" />
                    Contact Phone
                  </label>
                  <input
                    id="contactPhone"
                    className="input"
                    placeholder="9876543210"
                    value={form.contactPhone || ''}
                    onChange={(e) => {
                      const digitsOnly = String(e.target.value || '').replace(/\D/g, '').slice(0, 10);
                      setForm({ ...form, contactPhone: digitsOnly });
                    }}
                    inputMode="numeric"
                    maxLength={10}
                    style={{ height: '50px', borderRadius: '14px' }}
                  />
                  {fieldErrors.contactPhone && <p style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600, margin: 0 }}>{fieldErrors.contactPhone}</p>}
                </div>
              </div>
            )}

            {isBusiness && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="organizationWebsite" style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Link2 size={16} color="#3b82f6" />
                    Organization Website
                  </label>
                  <input
                    id="organizationWebsite"
                    className="input"
                    placeholder="https://yourcompany.com"
                    value={form.organizationWebsite || ''}
                    onChange={(e) => setForm({ ...form, organizationWebsite: e.target.value })}
                    style={{ height: '50px', borderRadius: '14px' }}
                  />
                  {fieldErrors.organizationWebsite && <p style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600, margin: 0 }}>{fieldErrors.organizationWebsite}</p>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="organizationIndustry" style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Briefcase size={16} color="#3b82f6" />
                    Industry
                  </label>
                  <input
                    id="organizationIndustry"
                    className="input"
                    placeholder="e.g. Fintech, Marketing, SaaS"
                    value={form.organizationIndustry || ''}
                    onChange={(e) => setForm({ ...form, organizationIndustry: e.target.value })}
                    style={{ height: '50px', borderRadius: '14px' }}
                  />
                  {fieldErrors.organizationIndustry && <p style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600, margin: 0 }}>{fieldErrors.organizationIndustry}</p>}
                </div>
              </div>
            )}

            {/* Alerts */}
            {error && (
              <div style={{ padding: '14px 18px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '14px', color: '#b91c1c', fontWeight: 600, fontSize: '0.9rem' }}>
                {error}
              </div>
            )}
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ padding: '14px 18px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', color: '#15803d', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <CheckCircle size={18} color="#16a34a" /> {message}
              </motion.div>
            )}

            <div style={{ paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
              <Button
                type="submit"
                variant="primary"
                loading={isSaving}
                loadingText="Saving..."
                style={{ height: '52px', borderRadius: '16px', fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Save size={18} /> Save Profile
              </Button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}
