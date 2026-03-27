import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  acceptProjectApplication,
  applyForProject,
  completeProject,
  createProjectPaymentOrder,
  getMyProjects,
  getProjectApplications,
  getProjectById,
  getProjectPayment,
  releaseProjectEscrow,
  verifyProjectPaymentOrder,
  submitProject,
} from '../services/projectService';
import { getProjectMessages, sendProjectMessage } from '../services/messageService';
import { getProjectRatings, submitProjectRating } from '../services/ratingService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import StatusBadge from '../components/ui/StatusBadge';
import Loader from '../components/ui/Loader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusTimeline from '../components/ui/StatusTimeline';
import RatingSummary from '../components/ui/RatingSummary';
import { formatINR } from '../utils/currency';
import { formatDateOnly } from '../utils/date';
import { getPaymentGatewayConfig } from '../services/paymentService';
import { loadRazorpayCheckoutScript } from '../utils/paymentGateway';
import { getApiErrorMessage, getApiFieldErrors } from '../utils/validation';
import api from '../services/api';
import {
  connectRealtime,
  joinProjectRoom,
  leaveProjectRoom,
  onRealtime,
  setProjectTyping,
} from '../services/realtimeService';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [project, setProject] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionLink, setSubmissionLink] = useState('');
  const [submissionFiles, setSubmissionFiles] = useState([]);
  const [chatText, setChatText] = useState('');
  const [messages, setMessages] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [ratingValue, setRatingValue] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [applicationCoverLetter, setApplicationCoverLetter] = useState('');
  const [applications, setApplications] = useState([]);
  const [payment, setPayment] = useState(null);
  const [paymentTransactions, setPaymentTransactions] = useState([]);
  const [tipAmount, setTipAmount] = useState('');
  const [tipNote, setTipNote] = useState('');
  const [error, setError] = useState('');
  const [chatError, setChatError] = useState('');
  const [ratingError, setRatingError] = useState('');
  const [submissionFieldErrors, setSubmissionFieldErrors] = useState({});
  const [ratingFieldErrors, setRatingFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isRatingsLoading, setIsRatingsLoading] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isApplicationsLoading, setIsApplicationsLoading] = useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [isFundingEscrow, setIsFundingEscrow] = useState(false);
  const [isReleasingEscrow, setIsReleasingEscrow] = useState(false);
  const [isAddingTip, setIsAddingTip] = useState(false);
  const [gatewayConfig, setGatewayConfig] = useState({ provider: 'razorpay', enabled: false, keyId: '' });
  const [acceptingApplicationId, setAcceptingApplicationId] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimeoutRef = useRef(null);
  const chatEndRef = useRef(null);
  const canUseMessaging = Boolean(
    project?.freelancerId && (project?.businessId === user?.id || project?.freelancerId === user?.id),
  );
  const canRate = Boolean(
    project?.status === 'Completed' &&
    project?.freelancerId &&
    (project?.businessId === user?.id || project?.freelancerId === user?.id),
  );
  const canSubmitRating = Boolean(
    project?.status === 'Completed' &&
    project?.businessId === user?.id &&
    project?.freelancerId,
  );
  const alreadyRated = ratings.some((item) => item.raterId === user?.id);
  const parseSkills = (value) => String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const canViewPayment = Boolean(
    project && (project.businessId === user?.id || (project.freelancerId && project.freelancerId === user?.id)),
  );
  const canCompleteProject = Boolean(
    user?.role === 'business' && project?.status === 'Submitted' && payment?.status === 'Released',
  );
  const canAddTip = Boolean(user?.role === 'business' && payment && payment.status !== 'Unfunded');
  const apiOrigin = import.meta.env.VITE_API_URL || '';
  const ratingSummary = useMemo(() => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let total = 0;
    let sum = 0;

    for (const item of ratings) {
      const value = Number(item?.rating || 0);
      if (!distribution[value]) continue;
      distribution[value] += 1;
      total += 1;
      sum += value;
    }

    return {
      userId: project?.freelancerId || null,
      totalRatings: total,
      averageRating: total ? Number((sum / total).toFixed(2)) : 0,
      distribution,
    };
  }, [ratings, project?.freelancerId]);

  const buildProtectedFileUrl = (relativePath) => {
    return `${apiOrigin}${relativePath}`;
  };

  const openProtectedFile = async (relativePath, filename) => {
    const safePath = String(relativePath || '').trim();
    if (!safePath) return;
    if (/^https?:\/\//i.test(safePath)) {
      window.open(safePath, '_blank', 'noopener,noreferrer');
      return;
    }
    const { data } = await api.get(safePath.replace(/^\/api/, ''), { responseType: 'blob' });
    const blobUrl = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || 'attachment';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  };

  const loadProject = async () => {
    try {
      setIsLoading(true);
      const { data } = await getProjectById(id);
      let normalizedProject = data.project || null;

      // Defensive fallback: if detail payload misses budget for business users,
      // hydrate it from /projects/mine so Manage view still shows correct amount.
      if (
        user?.role === 'business' &&
        normalizedProject &&
        (normalizedProject.budget == null || normalizedProject.budget === '')
      ) {
        try {
          const mine = await getMyProjects();
          const ownProject = (mine?.data?.projects || []).find(
            (item) => Number(item?.id) === Number(id),
          );
          if (ownProject) {
            normalizedProject = {
              ...normalizedProject,
              budget: ownProject.budget,
            };
          }
        } catch {
          // Keep original detail payload when fallback fetch fails.
        }
      }

      setProject(normalizedProject);
      setSubmissionText(normalizedProject?.submissionText || '');
      setSubmissionLink(normalizedProject?.submissionLink || '');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load project details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadProject(); }, [id, user?.role]);

  const loadApplications = async () => {
    if (!project?.id || user?.role !== 'business') return;
    try {
      setIsApplicationsLoading(true);
      const { data } = await getProjectApplications(project.id);
      setApplications(data.applications || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load applications');
    } finally {
      setIsApplicationsLoading(false);
    }
  };

  useEffect(() => {
    if (
      user?.role === 'business' &&
      project?.status === 'Open' &&
      Number(project?.businessId) === Number(user?.id)
    ) {
      loadApplications();
    }
  }, [project?.id, project?.status, project?.businessId, user?.id, user?.role]);

  const loadPayment = async () => {
    if (!project?.id || !canViewPayment) return;
    try {
      setIsPaymentLoading(true);
      const { data } = await getProjectPayment(project.id);
      setPayment(data.payment || null);
      setPaymentTransactions(data.transactions || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load payment details');
    } finally {
      setIsPaymentLoading(false);
    }
  };

  useEffect(() => {
    loadPayment();
  }, [project?.id, project?.status, project?.freelancerId, canViewPayment]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getPaymentGatewayConfig();
        setGatewayConfig({ provider: data.provider || 'razorpay', enabled: Boolean(data.enabled), keyId: data.keyId || '' });
      } catch {
        setGatewayConfig({ provider: 'razorpay', enabled: false, keyId: '' });
      }
    })();
  }, []);

  const loadMessages = async () => {
    if (!project?.id || !project?.freelancerId) return;

    try {
      setIsMessagesLoading(true);
      setChatError('');
      const { data } = await getProjectMessages(project.id);
      setMessages(data.messages || []);
    } catch (err) {
      setChatError(err.response?.data?.error || 'Failed to load messages');
    } finally {
      setIsMessagesLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [project?.id, project?.freelancerId]);

  useEffect(() => {
    if (!canUseMessaging || !project?.id) return undefined;

    connectRealtime();
    joinProjectRoom(project.id);

    const offNewMessage = onRealtime('messages:new', (payload) => {
      if (Number(payload?.projectId) !== Number(project.id) || !payload?.message) return;
      setMessages((prev) => {
        if (prev.some((item) => item.id === payload.message.id)) return prev;
        return [...prev, payload.message];
      });
    });
    const offTyping = onRealtime('project:typing', (payload) => {
      if (Number(payload?.projectId) !== Number(project.id) || payload?.userId === user?.id) return;
      setTypingUsers((prev) => {
        if (!payload?.isTyping) {
          const clone = { ...prev };
          delete clone[payload.userId];
          return clone;
        }
        return { ...prev, [payload.userId]: payload.userName || 'Participant' };
      });
    });

    return () => {
      setProjectTyping(project.id, false);
      leaveProjectRoom(project.id);
      offNewMessage();
      offTyping();
    };
  }, [canUseMessaging, project?.id]);

  useEffect(() => {
    if (!chatEndRef.current) return;
    chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, typingUsers]);

  useEffect(() => () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }, []);

  const loadRatings = async () => {
    if (!project?.id || !project?.freelancerId) return;

    try {
      setIsRatingsLoading(true);
      setRatingError('');
      const { data } = await getProjectRatings(project.id);
      setRatings(data.ratings || []);
    } catch (err) {
      setRatingError(err.response?.data?.error || 'Failed to load ratings');
    } finally {
      setIsRatingsLoading(false);
    }
  };

  useEffect(() => {
    if (project?.status === 'Completed') {
      loadRatings();
    }
  }, [project?.id, project?.status, project?.freelancerId]);

  const onApply = async () => {
    try {
      setIsApplying(true);
      await applyForProject(id, { coverLetter: applicationCoverLetter });
      addToast('Application submitted', 'success');
      setApplicationCoverLetter('');
      loadProject();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to apply for project');
    } finally {
      setIsApplying(false);
    }
  };

  const onAcceptApplication = async (applicationId) => {
    try {
      setAcceptingApplicationId(applicationId);
      await acceptProjectApplication(project.id, applicationId);
      addToast('Freelancer assigned', 'success');
      loadProject();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to accept application');
    } finally {
      setAcceptingApplicationId(null);
    }
  };

  const onSubmit = async () => {
    try {
      setSubmissionFieldErrors({});
      setIsActing(true);
      await submitProject(id, { submissionText, submissionLink, files: submissionFiles });
      addToast('Submission successful', 'success');
      setSubmissionFiles([]);
      loadProject();
    } catch (err) {
      setSubmissionFieldErrors(getApiFieldErrors(err));
      setError(getApiErrorMessage(err, 'Failed to submit project'));
    } finally {
      setIsActing(false);
    }
  };

  const onComplete = async () => {
    try {
      setIsActing(true);
      await completeProject(id);
      addToast('Project completed', 'success');
      loadProject();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete project');
    } finally {
      setIsActing(false);
    }
  };

  const onFundEscrow = async () => {
    try {
      setIsFundingEscrow(true);
      if (!gatewayConfig.enabled) throw new Error('Razorpay is not configured');

      const scriptLoaded = await loadRazorpayCheckoutScript();
      if (!scriptLoaded) throw new Error('Unable to load payment gateway');

      const { data } = await createProjectPaymentOrder(project.id, { purpose: 'escrow' });
      const order = data.order;

      await new Promise((resolve, reject) => {
        const checkout = new window.Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: 'Contractual',
          description: `Escrow funding for ${order.projectTitle}`,
          order_id: order.id,
          handler: async (response) => {
            try {
              await verifyProjectPaymentOrder(project.id, response);
              addToast('Escrow funded successfully', 'success');
              loadPayment();
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => reject(new Error('Payment cancelled')),
          },
          theme: {
            color: '#4F46E5',
          },
        });
        checkout.open();
      });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to fund escrow');
    } finally {
      setIsFundingEscrow(false);
    }
  };

  const onReleaseEscrow = async () => {
    try {
      setIsReleasingEscrow(true);
      await releaseProjectEscrow(project.id);
      addToast('Payment released', 'success');
      loadPayment();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to release payment');
    } finally {
      setIsReleasingEscrow(false);
    }
  };

  const onAddTip = async () => {
    try {
      setIsAddingTip(true);
      if (!Number(tipAmount)) throw new Error('Enter a valid tip amount');
      if (!gatewayConfig.enabled) throw new Error('Razorpay is not configured');

      const scriptLoaded = await loadRazorpayCheckoutScript();
      if (!scriptLoaded) throw new Error('Unable to load payment gateway');

      const { data } = await createProjectPaymentOrder(project.id, {
        purpose: 'tip',
        tipAmount: Number(tipAmount),
        note: tipNote,
      });
      const order = data.order;
      await new Promise((resolve, reject) => {
        const checkout = new window.Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: 'Contractual',
          description: `Tip for ${order.projectTitle}`,
          order_id: order.id,
          handler: async (response) => {
            try {
              await verifyProjectPaymentOrder(project.id, response);
              addToast('Tip added successfully', 'success');
              loadPayment();
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => reject(new Error('Tip payment cancelled')),
          },
          theme: {
            color: '#16A34A',
          },
        });
        checkout.open();
      });
      setTipAmount('');
      setTipNote('');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to add tip');
    } finally {
      setIsAddingTip(false);
    }
  };

  const onSendMessage = async () => {
    if (!chatText.trim() || !project?.id) return;

    try {
      setIsSendingMessage(true);
      setProjectTyping(project.id, false);
      await sendProjectMessage(project.id, { messageText: chatText.trim() });
      setChatText('');
      addToast('Message sent', 'success');
    } catch (err) {
      setChatError(err.response?.data?.error || 'Failed to send message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const onChatChange = (value) => {
    setChatText(value);
    if (!project?.id) return;

    setProjectTyping(project.id, value.trim().length > 0);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setProjectTyping(project.id, false);
    }, 1200);
  };

  const onSubmitRating = async () => {
    try {
      setRatingFieldErrors({});
      setIsSubmittingRating(true);
      await submitProjectRating(project.id, { rating: Number(ratingValue), reviewText });
      addToast('Rating submitted', 'success');
      setReviewText('');
      setRatingValue(5);
      loadRatings();
    } catch (err) {
      setRatingFieldErrors(getApiFieldErrors(err));
      setRatingError(getApiErrorMessage(err, 'Failed to submit rating'));
    } finally {
      setIsSubmittingRating(false);
    }
  };

  if (isLoading) return <Loader label="Loading project details..." />;

  return (
    <section
      className="premium-page-wrap"
      style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '32px clamp(20px, 5vw, 60px)', minHeight: '100vh', position: 'relative', background: 'radial-gradient(1200px 600px at 0% 0%, #f5f3ff 0%, transparent 50%), radial-gradient(1000px 600px at 100% 100%, #eef2ff 0%, transparent 50%)' }}
    >
      <div className="bg-noise" />

      <div className="breadcrumb" style={{ position: 'relative', zIndex: 10, display: 'flex', gap: '12px', alignItems: 'center', fontSize: '1rem', fontWeight: 600 }}>
        <Link to={user?.role === 'business' ? '/business/projects' : '/freelancer/work'} style={{ color: '#4f46e5', textDecoration: 'none' }}>
          {user?.role === 'business' ? 'My Projects' : 'My Work'}
        </Link>
        <span style={{ color: '#94a3b8' }}>/</span>
        <span style={{ color: '#64748b' }}>Project Detail</span>
      </div>

      {error && <p className="badge-premium" style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.15)', padding: '16px', textAlign: 'center' }}>{error}</p>}

      {project && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative', zIndex: 10 }}>
          <div className="card-ui" style={{ padding: '40px', border: '1px solid #e2e8f0', background: 'rgba(255, 255, 255, 0.8)' }}>
            <div className="project-head" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h2 className="section-title-refined" style={{ margin: 0, fontSize: '2.2rem', color: '#0f172a' }}>{project.title}</h2>
              <StatusBadge status={project.status} />
            </div>
            <StatusTimeline status={project.status} />
            <div className="detail-meta-grid" style={{ marginTop: '32px' }}>
              <div className="detail-meta-item" style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                <p className="detail-meta-label" style={{ margin: '0 0 4px', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Budget</p>
                <p className="detail-meta-value" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#10b981' }}>{formatINR(project.budget)}</p>
              </div>
              <div className="detail-meta-item" style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                <p className="detail-meta-label" style={{ margin: '0 0 4px', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Deadline</p>
                <p className="detail-meta-value" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#1e293b' }}>{formatDateOnly(project.deadline)}</p>
              </div>
              <div className="detail-meta-item" style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                <p className="detail-meta-label" style={{ margin: '0 0 4px', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Business Identity</p>
                <p className="detail-meta-value" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#1e293b' }}>{project.businessName || 'Corporate Entity'}</p>
              </div>
              <div className="detail-meta-item" style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                <p className="detail-meta-label" style={{ margin: '0 0 4px', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Asset Contributor</p>
                <p className="detail-meta-value" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#4f46e5' }}>{project.freelancerName || 'Pending Allocation'}</p>
              </div>
            </div>

            <div style={{ marginTop: '32px' }}>
              <p style={{ fontSize: '1rem', color: '#1e293b' }}><strong>Core Skills:</strong> {project.skillsRequired}</p>
              <div style={{ marginTop: '20px', padding: '24px', background: '#f8fafc', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>Strategic Brief</h3>
                <p style={{ margin: 0, color: '#64748b', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{project.description}</p>
              </div>
            </div>

            {user?.role === 'business' && project.freelancerId && (project.freelancerContactEmail || project.freelancerContactPhone) && (
              <div style={{ marginTop: '24px', padding: '18px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>Freelancer Contact Details</h4>
                <p style={{ margin: '0 0 6px', color: '#334155', fontWeight: 700 }}>
                  Full Name: <span style={{ color: '#0f172a' }}>{project.freelancerName || 'Unavailable'}</span>
                </p>
                {project.freelancerContactEmail && (
                  <p style={{ margin: '0 0 6px', color: '#334155', fontWeight: 700 }}>
                    Email Address: <a href={`mailto:${project.freelancerContactEmail}`} style={{ color: '#4f46e5', textDecoration: 'none' }}>{project.freelancerContactEmail}</a>
                  </p>
                )}
                {project.freelancerContactPhone && (
                  <p style={{ margin: 0, color: '#334155', fontWeight: 700 }}>
                    Contact Phone: <a href={`tel:${project.freelancerContactPhone}`} style={{ color: '#4f46e5', textDecoration: 'none' }}>{project.freelancerContactPhone}</a>
                  </p>
                )}
              </div>
            )}

            {(project.referenceLink || (project.referenceFiles || []).length > 0) && (
              <div className="stack" style={{ marginTop: '32px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>Project References</h3>
                {project.referenceLink && (
                  <p style={{ color: '#64748b' }}>
                    Asset URL:{' '}
                    <a href={project.referenceLink} target="_blank" rel="noreferrer" style={{ color: '#4f46e5', fontWeight: 700 }}>
                      {project.referenceLink}
                    </a>
                  </p>
                )}
                {(project.referenceFiles || []).length > 0 && (
                  <div className="stack" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {(project.referenceFiles || []).map((file) => (
                      <button
                        key={file.url}
                        type="button"
                        onClick={() => openProtectedFile(file.url, file.originalName || file.name || 'Attachment')}
                        style={{ padding: '8px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#4f46e5', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem', cursor: 'pointer' }}
                      >
                        {file.originalName || file.name || 'Attachment'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(project.submissionText || project.submissionLink || (project.submissionFiles || []).length > 0) && (
              <div className="stack" style={{ marginTop: '32px', padding: '32px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '24px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '1.25rem', fontWeight: 900, color: '#065f46' }}>Evidence of Work Deliverables</h3>
                {project.submissionText && <p style={{ color: '#065f46', whiteSpace: 'pre-wrap' }}><strong>Analytical Notes:</strong> {project.submissionText}</p>}
                {project.submissionLink && (
                  <p style={{ color: '#065f46', marginTop: '12px' }}>
                    <strong>Direct Access:</strong>{' '}
                    <a href={project.submissionLink} target="_blank" rel="noreferrer" style={{ color: '#047857', fontWeight: 800 }}>
                      {project.submissionLink}
                    </a>
                  </p>
                )}
                {(project.submissionFiles || []).length > 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {(project.submissionFiles || []).map((file) => (
                      <button
                        key={file.url}
                        type="button"
                        onClick={() => openProtectedFile(file.url, file.originalName || file.name || 'Attachment')}
                        style={{
                          padding: '8px 14px',
                          background: '#fff',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          borderRadius: '10px',
                          color: '#047857',
                          fontWeight: 700,
                          fontSize: '0.86rem',
                          cursor: 'pointer',
                        }}
                      >
                        {file.originalName || file.name || 'Attachment'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {user?.role === 'freelancer' && project.status === 'Open' && !project.hasApplied && (
              <div className="stack" style={{ marginTop: '32px', padding: '32px', background: 'rgba(79, 70, 229, 0.05)', borderRadius: '24px', border: '1px solid rgba(79, 70, 229, 0.15)' }}>
                <h3 style={{ margin: '0 0 20px', fontSize: '1.2rem', fontWeight: 900, color: '#1e293b' }}>Apply for this Manifesto</h3>
                <label className="label" htmlFor="application-cover" style={{ marginBottom: '8px', display: 'block', fontWeight: 700, color: '#475569' }}>Collaborator Intent Statement (Optional)</label>
                <textarea
                  id="application-cover"
                  className="input"
                  style={{ minHeight: '120px', resize: 'none', background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b' }}
                  value={applicationCoverLetter}
                  onChange={(e) => setApplicationCoverLetter(e.target.value)}
                  disabled={isApplying}
                />
                <Button onClick={onApply} disabled={isApplying} loading={isApplying} style={{ marginTop: '20px', height: '56px', borderRadius: '14px', fontWeight: 900 }}>Initiate Partnership</Button>
              </div>
            )}

            {user?.role === 'freelancer' && project.status === 'Assigned' && project.freelancerId === user.id && (
              <div className="stack" style={{ marginTop: '32px', padding: '40px', background: '#f8fafc', borderRadius: '32px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 24px', fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>Submit Mission Deliverables</h3>
                <label className="label" htmlFor="detail-submission" style={{ marginBottom: '8px', display: 'block', fontWeight: 700, color: '#475569' }}>Technical Notes</label>
                <textarea id="detail-submission" className="input" style={{ minHeight: '120px', resize: 'none', background: '#fff' }} value={submissionText} onChange={(e) => setSubmissionText(e.target.value)} disabled={isActing} />
                <label className="label" htmlFor="detail-submission-link" style={{ marginTop: '20px', marginBottom: '8px', display: 'block', fontWeight: 700, color: '#475569' }}>Asset Link (Figma/GitHub/Drive)</label>
                <input id="detail-submission-link" className="input" style={{ background: '#fff' }} placeholder="https://external-resource.com" value={submissionLink} onChange={(e) => setSubmissionLink(e.target.value)} disabled={isActing} />
                <label className="label" htmlFor="detail-submission-files" style={{ marginTop: '20px', marginBottom: '8px', display: 'block', fontWeight: 700, color: '#475569' }}>
                  Attach Files (optional)
                </label>
                <input
                  id="detail-submission-files"
                  className="input"
                  type="file"
                  multiple
                  onChange={(e) => setSubmissionFiles(Array.from(e.target.files || []))}
                  disabled={isActing}
                  style={{ background: '#fff' }}
                />
                {submissionFiles.length > 0 && (
                  <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
                    {submissionFiles.length} file{submissionFiles.length > 1 ? 's' : ''} selected
                  </p>
                )}
                {!!Object.keys(submissionFieldErrors).length && (
                  <p style={{ margin: '8px 0 0', color: '#b91c1c', fontSize: '0.85rem', fontWeight: 700 }}>
                    {Object.values(submissionFieldErrors)[0]}
                  </p>
                )}
                <Button variant="primary" onClick={onSubmit} disabled={isActing} loading={isActing} style={{ marginTop: '30px', height: '60px', borderRadius: '16px', fontWeight: 900 }}>Finalize Submission</Button>
              </div>
            )}

            {user?.role === 'business' && project.status === 'Submitted' && (
              <div className="stack" style={{ marginTop: '32px' }}>
                <Button variant="primary" onClick={onComplete} disabled={isActing || !canCompleteProject} loading={isActing} style={{ height: '60px', borderRadius: '16px', fontWeight: 900 }}>Confirm Quality & Finalize</Button>
                {!canCompleteProject && <p className="badge-premium" style={{ background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.1)', padding: '12px', marginTop: '16px', textAlign: 'center' }}>Release payment to freelancer before completing this mission.</p>}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
            {canViewPayment && (
              <div className="card-ui" style={{ padding: '32px', border: '1px solid #e2e8f0', background: 'rgba(255, 255, 255, 0.8)' }}>
                <div className="project-head" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>Escrow Ledger</h3>
                  <Button variant="secondary" onClick={loadPayment} disabled={isPaymentLoading} loading={isPaymentLoading} style={{ padding: '8px 20px', borderRadius: '12px' }}>Refresh</Button>
                </div>

                {payment ? (
                  <>
                    <div className="payment-summary" style={{ background: '#f8fafc', padding: '24px', borderRadius: '24px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <div>
                        <p style={{ margin: '0 0 4px', fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Current Escrow</p>
                        <p style={{ margin: 0, fontSize: '2rem', fontWeight: 900, color: '#0f172a' }}>{formatINR(payment.amount)}</p>
                      </div>
                      <span className={`payment-pill payment-pill-${String(payment.status || '').toLowerCase()}`} style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {payment.status}
                      </span>
                    </div>

                    {user?.role === 'business' && (
                      <div className="row" style={{ marginTop: '24px' }}>
                        {payment.status === 'Unfunded' && (
                          <Button onClick={onFundEscrow} disabled={isFundingEscrow} loading={isFundingEscrow} fullWidth style={{ height: '56px', borderRadius: '14px', fontWeight: 900 }}>
                            Fund Security Escrow
                          </Button>
                        )}
                        {payment.status === 'Funded' && (
                          <Button variant="primary" onClick={onReleaseEscrow} disabled={isReleasingEscrow} loading={isReleasingEscrow} fullWidth style={{ height: '56px', borderRadius: '14px', fontWeight: 900 }}>
                            Release Global Assets Payout
                          </Button>
                        )}
                      </div>
                    )}

                    {user?.role === 'business' && (
                      <div style={{ marginTop: '24px', padding: '18px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#f8fafc', display: 'grid', gap: '10px' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, color: '#0f172a' }}>Add Tip</h4>
                        <input
                          className="input"
                          type="number"
                          min="1"
                          step="1"
                          placeholder="Tip amount"
                          value={tipAmount}
                          onChange={(e) => setTipAmount(e.target.value)}
                          disabled={!canAddTip || isAddingTip}
                          style={{ background: '#fff' }}
                        />
                        <input
                          className="input"
                          placeholder="Tip note (optional)"
                          value={tipNote}
                          onChange={(e) => setTipNote(e.target.value)}
                          disabled={!canAddTip || isAddingTip}
                          style={{ background: '#fff' }}
                        />
                        <Button
                          variant="secondary"
                          onClick={onAddTip}
                          disabled={!canAddTip || isAddingTip || !String(tipAmount).trim()}
                          loading={isAddingTip}
                          style={{ borderRadius: '12px', fontWeight: 800 }}
                        >
                          Add Tip
                        </Button>
                        {!canAddTip && (
                          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                            Fund escrow first to enable tips.
                          </p>
                        )}
                      </div>
                    )}

                    <div style={{ marginTop: '32px' }}>
                      <h4 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>Audit Trail</h4>
                      <div style={{ display: 'grid', gap: '12px' }}>
                        {paymentTransactions.map((tx) => (
                          <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#fff', borderRadius: '14px', border: '1px solid #f1f5f9' }}>
                            <div>
                              <p style={{ margin: '0 0 2px', fontSize: '0.85rem', fontWeight: 800, color: '#1e293b' }}>{tx.type}</p>
                              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(tx.createdAt).toLocaleDateString()}</p>
                            </div>
                            <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{formatINR(tx.amount)}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>Escrow details pending activation.</p>
                )}
              </div>
            )}

            {canUseMessaging && (
              <div className="card-ui" style={{ padding: '32px', border: '1px solid #e2e8f0', background: 'rgba(255, 255, 255, 0.8)', display: 'flex', flexDirection: 'column' }}>
                <div className="project-head" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>Secure Comms</h3>
                  <Button variant="secondary" onClick={loadMessages} disabled={isMessagesLoading} loading={isMessagesLoading} style={{ padding: '8px 20px', borderRadius: '12px' }}>Sync</Button>
                </div>

                <div className="chat-list" style={{ flex: 1, minHeight: '300px', maxHeight: '500px', overflowY: 'auto', padding: '20px', background: '#f8fafc', borderRadius: '24px', marginBottom: '24px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {messages.map((message) => {
                    const mine = message.senderId === user?.id;
                    return (
                      <div key={message.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                        <div style={{ padding: '14px 20px', background: mine ? '#4f46e5' : '#fff', borderRadius: mine ? '20px 20px 4px 20px' : '20px 20px 20px 4px', color: mine ? '#fff' : '#1e293b', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: mine ? 'none' : '1px solid #e2e8f0' }}>
                          <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>{message.messageText}</p>
                        </div>
                        <p style={{ margin: '6px 0 0', fontSize: '0.7rem', color: '#94a3b8', textAlign: mine ? 'right' : 'left', fontWeight: 700 }}>
                          {mine ? 'Sent' : message.senderName} • {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                {!!Object.keys(typingUsers).length && (
                  <p style={{ margin: '0 0 10px', color: '#64748b', fontSize: '0.82rem', fontWeight: 700 }}>
                    {Object.values(typingUsers).join(', ')} typing...
                  </p>
                )}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    className="input"
                    placeholder="Type mission updates..."
                    style={{ background: '#fff', border: '1px solid #e2e8f0' }}
                    value={chatText}
                    onChange={(e) => onChatChange(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
                  />
                  <Button onClick={onSendMessage} disabled={isSendingMessage || !chatText.trim()} loading={isSendingMessage} style={{ borderRadius: '14px', width: '60px', height: '52px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                  </Button>
                </div>
                {chatError && <p style={{ margin: '10px 0 0', color: '#b91c1c', fontSize: '0.85rem', fontWeight: 700 }}>{chatError}</p>}
              </div>
            )}
          </div>

          {canRate && (
            <div className="card-ui" style={{ padding: '32px', border: '1px solid #e2e8f0', background: 'rgba(255, 255, 255, 0.8)' }}>
              <div className="project-head" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>Ratings & Reviews</h3>
                <Button variant="secondary" onClick={loadRatings} disabled={isRatingsLoading} loading={isRatingsLoading} style={{ padding: '8px 20px', borderRadius: '12px' }}>Refresh</Button>
              </div>

              <RatingSummary summary={ratingSummary} />

              {ratingError && (
                <p style={{ margin: '14px 0 0', color: '#b91c1c', fontSize: '0.9rem', fontWeight: 700 }}>
                  {ratingError}
                </p>
              )}

              {!!ratings.length && (
                <div style={{ marginTop: '20px', display: 'grid', gap: '10px' }}>
                  {ratings.map((item) => (
                    <div key={item.id} style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff' }}>
                      <p style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
                        {item.raterName} rated {item.rating}/5
                      </p>
                      <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                        {item.reviewText || 'No review text provided.'}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {canSubmitRating && !alreadyRated && (
                <div style={{ marginTop: '20px', padding: '18px', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', display: 'grid', gap: '10px' }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>Submit Freelancer Rating</h4>
                  <select
                    className="input"
                    value={ratingValue}
                    onChange={(e) => setRatingValue(Number(e.target.value))}
                    disabled={isSubmittingRating}
                    style={{ background: '#fff' }}
                  >
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option key={value} value={value}>{value} Star{value > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                  <textarea
                    className="input"
                    placeholder="Write a short review (optional)"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    disabled={isSubmittingRating}
                    style={{ minHeight: '95px', resize: 'none', background: '#fff' }}
                  />
                  {!!Object.keys(ratingFieldErrors).length && (
                    <p style={{ margin: 0, color: '#b91c1c', fontSize: '0.85rem', fontWeight: 700 }}>
                      {Object.values(ratingFieldErrors)[0]}
                    </p>
                  )}
                  <Button
                    onClick={onSubmitRating}
                    disabled={isSubmittingRating}
                    loading={isSubmittingRating}
                    style={{ borderRadius: '12px', fontWeight: 800 }}
                  >
                    Submit Rating
                  </Button>
                </div>
              )}
            </div>
          )}

          {user?.role === 'business' && project.status === 'Open' && (
            <div className="card-ui" style={{ padding: '40px', border: '1px solid #e2e8f0', background: 'rgba(255, 255, 255, 0.8)' }}>
              <div className="project-head" style={{ marginBottom: '32px' }}>
                <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#0f172a' }}>Talent Assessment Hub</h3>
              </div>
              {isApplicationsLoading && (
                <p style={{ margin: '0 0 16px', color: '#64748b', fontWeight: 700 }}>Loading applications...</p>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
                {applications.map((app) => (
                  <div key={app.id} style={{ padding: '24px', background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ width: '56px', height: '56px', background: 'rgba(79, 70, 229, 0.08)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', fontWeight: 900, fontSize: '1.4rem' }}>
                        {String(app.freelancerName || 'C').charAt(0)}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>{app.freelancerName}</h4>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>{app.experienceYears} Years Depth</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {parseSkills(app.skills).slice(0, 4).map(skill => (
                        <span key={skill} style={{ padding: '4px 12px', background: '#f1f5f9', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, color: '#475569' }}>{skill}</span>
                      ))}
                    </div>
                    {(app.contactEmail || app.contactPhone || app.freelancerEmail) && (
                      <div style={{ padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', display: 'grid', gap: '4px' }}>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Contact</p>
                        <p style={{ margin: 0, fontSize: '0.86rem', color: '#334155', fontWeight: 700 }}>
                          Full Name: {app.freelancerName}
                        </p>
                        {(app.contactEmail || app.freelancerEmail) && (
                          <p style={{ margin: 0, fontSize: '0.86rem', color: '#334155', fontWeight: 700 }}>
                            Email Address: {app.contactEmail || app.freelancerEmail}
                          </p>
                        )}
                        {app.contactPhone && (
                          <p style={{ margin: 0, fontSize: '0.86rem', color: '#334155', fontWeight: 700 }}>
                            Contact Phone: {app.contactPhone}
                          </p>
                        )}
                      </div>
                    )}
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>{app.coverLetter || app.bio || "Candidate has not provided a strategic summary."}</p>
                    <Button
                      onClick={() => onAcceptApplication(app.id)}
                      disabled={app.status !== 'Pending' || acceptingApplicationId != null}
                      loading={acceptingApplicationId === app.id}
                      fullWidth
                      style={{ marginTop: 'auto', borderRadius: '12px', height: '48px', fontWeight: 800 }}
                    >
                      Assign Infrastructure
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
