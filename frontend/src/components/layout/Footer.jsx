import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Twitter, Linkedin, Github, Mail, Shield, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import brandLogo from '../../assets/contractual-logo-exact.png';

export default function Footer() {
  const year = new Date().getFullYear();
  const { isAuthenticated, user } = useAuth();

  return (
    <footer style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
      color: '#e2e8f0',
      paddingTop: '80px',
      paddingBottom: '40px',
      borderTop: 'none',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(at 10% 20%, rgba(59,130,246,0.12) 0, transparent 50%), radial-gradient(at 90% 80%, rgba(99,102,241,0.1) 0, transparent 50%)'
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '30px 30px'
      }} />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 clamp(20px, 5vw, 60px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '60px', marginBottom: '60px', position: 'relative', zIndex: 2 }}>

        {/* Brand Column */}
        <div className="footer-brand-col" style={{ gridColumn: 'span 1' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
            <motion.div
              whileHover={{ rotate: 180, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                overflow: 'visible',
                boxShadow: '0 8px 20px rgba(59,130,246,0.4)',
                background: '#fff',
                padding: '6px',
              }}
            >
              <img
                src={brandLogo}
                alt="Contractual logo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                  background: '#fff',
                }}
              />
            </motion.div>
            <span style={{ fontSize: '1.8rem', fontWeight: 900, fontFamily: '"Outfit", sans-serif', letterSpacing: '-0.03em', color: '#ffffff' }}>Contractual</span>
          </Link>
          <p style={{ color: '#94a3b8', lineHeight: 1.7, marginBottom: '28px', fontSize: '0.97rem', maxWidth: '340px' }}>
            The premier platform connecting visionary enterprises with elite global talent. Where precision meets unparalleled execution.
          </p>
          <div style={{ display: 'flex', gap: '16px' }}>
            {[Twitter, Linkedin, Github, Mail].map((Icon, i) => (
              <motion.a
                key={i}
                href="#"
                whileHover={{ y: -4, color: '#60a5fa', backgroundColor: 'rgba(59,130,246,0.2)' }}
                style={{ color: '#64748b', transition: 'all 0.3s ease', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' }}
              >
                <Icon size={18} />
              </motion.a>
            ))}
          </div>
        </div>

        {/* Ecosystem Links */}
        <div>
          <h4 style={{ color: '#ffffff', fontWeight: 800, marginBottom: '24px', fontFamily: '"Outfit", sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.8rem' }}>Ecosystem</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '14px' }}>
            {['Protocol Overview', 'Tiered Pricing', 'Enterprise Node', 'Impact Reports', 'Core Updates'].map(link => (
              <li key={link}>
                <a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.92rem', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}
                  onMouseOver={e => { e.currentTarget.style.color = '#60a5fa'; }}
                  onMouseOut={e => { e.currentTarget.style.color = '#94a3b8'; }}
                >
                  <ChevronRight size={13} style={{ opacity: 0.5 }} /> {link}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Intelligence Links */}
        <div>
          <h4 style={{ color: '#ffffff', fontWeight: 800, marginBottom: '24px', fontFamily: '"Outfit", sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.8rem' }}>Resources</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '14px' }}>
            {['Knowledge Base', 'Expert Playbooks', 'Strategic Insights', 'Neural API', 'Developer Lobby'].map(link => (
              <li key={link}>
                <a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.92rem', transition: 'all 0.2s ease', fontWeight: 500 }}
                  onMouseOver={e => e.currentTarget.style.color = '#60a5fa'}
                  onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick Access */}
        <div>
          <h4 style={{ color: '#ffffff', fontWeight: 800, marginBottom: '24px', fontFamily: '"Outfit", sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.8rem' }}>Quick Access</h4>
          {!isAuthenticated ? (
            <div style={{ display: 'grid', gap: '14px' }}>
              <Link to="/register" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, textDecoration: 'none', fontSize: '1rem', color: '#60a5fa' }}>
                Get Started <ChevronRight size={18} />
              </Link>
              <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', textDecoration: 'none', fontWeight: 600 }}
                onMouseOver={e => e.currentTarget.style.color = '#ffffff'}
                onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}>
                Sign In
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '14px' }}>
              <Link to={user?.role === 'business' ? '/business/dashboard' : '/freelancer/dashboard'} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, textDecoration: 'none', fontSize: '1rem', color: '#60a5fa' }}>
                My Dashboard <ChevronRight size={18} />
              </Link>
            </div>
          )}

          <div style={{ marginTop: '28px', padding: '20px', background: 'rgba(59,130,246,0.1)', borderRadius: '16px', border: '1px solid rgba(59,130,246,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', color: '#34d399' }}>
              <Shield size={18} /> <span style={{ fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Secured</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
              All transactions secured via multi-layer encryption.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '28px clamp(20px, 5vw, 60px) 0', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', position: 'relative', zIndex: 2 }}>
        <p style={{ color: '#475569', fontSize: '0.88rem', margin: 0, fontWeight: 500 }}>&copy; {year} Contractual. All rights reserved.</p>
        <div style={{ display: 'flex', gap: '28px', fontSize: '0.88rem', fontWeight: 600 }}>
          {['Privacy Policy', 'Terms of Use', 'Cookie Settings'].map(item => (
            <a key={item} href="#" style={{ color: '#475569', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseOver={e => e.currentTarget.style.color = '#60a5fa'}
              onMouseOut={e => e.currentTarget.style.color = '#475569'}>
              {item}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
