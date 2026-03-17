import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import EmptyState from '../components/ui/EmptyState';
import PremiumHero from '../components/ui/PremiumHero';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../services/notificationService';
import { connectRealtime, onRealtime } from '../services/realtimeService';
import { useAuth } from '../hooks/useAuth';

function getNotificationMeta(type) {
  const map = {
    new_message: { label: 'Message', icon: 'MSG' },
    project_application: { label: 'Application', icon: 'APP' },
    application_accepted: { label: 'Accepted', icon: 'OK' },
    application_rejected: { label: 'Not Selected', icon: 'NO' },
    work_submitted: { label: 'Submission', icon: 'SUB' },
    project_completed: { label: 'Completed', icon: 'DONE' },
    payment_funded: { label: 'Escrow Funded', icon: 'INR' },
    payment_released: { label: 'Payment Released', icon: 'PAY' },
    payment_tipped: { label: 'Tip Received', icon: 'TIP' },
    project_accepted: { label: 'Assigned', icon: 'ASG' },
  };
  return map[type] || { label: 'Update', icon: 'UPD' };
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const { data } = await getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    connectRealtime();
    const offCount = onRealtime('notifications:count', (payload) => {
      setUnreadCount(Number(payload?.unreadCount || 0));
    });
    const offNew = onRealtime('notifications:new', (payload) => {
      setUnreadCount(Number(payload?.unreadCount || 0));
      if (payload?.notification) {
        setNotifications((prev) => {
          if (prev.some((item) => item.id === payload.notification.id)) return prev;
          return [payload.notification, ...prev];
        });
      }
    });

    loadNotifications();
    return () => {
      offCount();
      offNew();
    };
  }, []);

  const onMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      loadNotifications();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark notification as read');
    }
  };

  const onMarkAllRead = async () => {
    try {
      setIsMarkingAll(true);
      await markAllNotificationsRead();
      loadNotifications();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark all as read');
    } finally {
      setIsMarkingAll(false);
    }
  };

  const visibleNotifications = useMemo(() => (
    filter === 'unread'
      ? notifications.filter((item) => !item.isRead)
      : notifications
  ), [filter, notifications]);

  const openProject = async (item) => {
    try {
      if (!item.isRead) {
        await markNotificationRead(item.id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // No-op: navigation should still continue.
    } finally {
      navigate(`/projects/${item.projectId}`);
    }
  };

  return (
    <section className="grid">
      <Card className="stack page-header-card">
        <PremiumHero
          label={user?.role === 'business' ? 'Business Account' : 'Freelancer Account'}
          title="Notifications"
          subtitle={`${user?.role === 'business' ? 'Business alerts and project updates.' : 'Freelancer alerts and project updates.'} Unread: ${unreadCount}`}
          actions={(
            <>
              <Button variant={filter === 'all' ? 'primary' : 'secondary'} onClick={() => setFilter('all')}>All</Button>
              <Button variant={filter === 'unread' ? 'primary' : 'secondary'} onClick={() => setFilter('unread')}>Unread</Button>
              <Button variant="secondary" onClick={onMarkAllRead} disabled={!unreadCount || isMarkingAll} loading={isMarkingAll} loadingText="Updating...">
                Mark All Read
              </Button>
              <Button variant="secondary" onClick={loadNotifications} disabled={isLoading} loading={isLoading} loadingText="Refreshing...">
                Refresh
              </Button>
            </>
          )}
        />
      </Card>

      {error && <p className="alert">{error}</p>}

      {isLoading ? (
        <Loader label="Loading notifications..." />
      ) : (
        <div className="grid">
          {visibleNotifications.map((item) => {
            const meta = getNotificationMeta(item.type);
            return (
              <Card key={item.id} className={`notification-item${item.isRead ? '' : ' notification-unread'}`}>
                <div className="project-head">
                  <h3 className="notification-title">
                    <span className="notification-icon" aria-hidden="true">{meta.icon}</span>
                    {item.title}
                  </h3>
                  <div className="row">
                    <span className="notification-type">{meta.label}</span>
                    {item.projectId && <Button variant="secondary" onClick={() => openProject(item)}>Open Project</Button>}
                    {!item.isRead && (
                      <Button variant="secondary" onClick={() => onMarkRead(item.id)}>Mark Read</Button>
                    )}
                  </div>
                </div>
                <p className="muted">{item.messageText}</p>
                <p className="muted">Time: {new Date(item.createdAt).toLocaleString()}</p>
              </Card>
            );
          })}
          {!visibleNotifications.length && (
            <EmptyState message={filter === 'unread' ? 'No unread notifications.' : 'No notifications yet.'} />
          )}
        </div>
      )}
    </section>
  );
}
