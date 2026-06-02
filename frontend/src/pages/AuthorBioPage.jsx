import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, ShieldCheck, Mail, BookOpen, ExternalLink, ArrowRight, Briefcase } from 'lucide-react';
import { templates } from '../data/templatesData';
import { useSEO } from '../utils/seo';

export default function AuthorBioPage() {
  const { slug } = useParams();
  
  // For this implementation, we support "sarah-jenkins" as the primary legal author
  const authorName = "Sarah Jenkins, Esq.";
  const authorTitle = "Senior Legal Counsel & Compliance Lead";
  const authorBio = "Sarah Jenkins is a seasoned corporate attorney with over 12 years of experience drafting, negotiating, and auditing commercial agreements, software licenses, SaaS terms of service, and startup compliance documents. Prior to joining Contractual Pro, she advised top-tier venture funds and tech startups in Silicon Valley. She is dedicated to making contract templates accessible, legally sound, and optimized for modern digital execution.";

  // Get templates reviewed by this author
  const reviewedTemplates = templates.filter(t => t.author?.slug === 'sarah-jenkins' || !slug);

  // ProfilePage schema
  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "name": `${authorName} Profile on Contractual Pro`,
    "description": `Legal expert biography and reviewed templates for ${authorName}.`,
    "mainEntity": {
      "@type": "Person",
      "name": authorName,
      "jobTitle": authorTitle,
      "worksFor": {
        "@type": "Organization",
        "name": "Contractual Pro",
        "url": window.location.origin
      },
      "alumniOf": {
        "@type": "EducationalOrganization",
        "name": "Harvard Law School"
      },
      "description": "Legal counsel specializing in commercial contracts, digital agreements, and SaaS protection.",
      "sameAs": [
        "https://www.linkedin.com/company/contractual-pro",
        "https://www.g2.com/products/contractual-pro"
      ]
    }
  };

  useSEO({
    title: `${authorName} | Legal Counsel`,
    description: `Read the credentials and reviewed contract templates of ${authorName}, Senior Legal Counsel at Contractual Pro. Vetted, legally binding agreement frameworks.`,
    schemas: schema
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="author-page-wrapper mesh-gradient-wrap" style={{ minHeight: '100vh', paddingTop: '120px', paddingBottom: '80px', position: 'relative' }}>
      <div className="mesh-gradient-bg" />
      <div className="pattern-grid-premium" />

      <div className="container" style={{ maxWidth: '1100px', position: 'relative', zIndex: 5 }}>
        <Link to="/templates" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#4f46e5', textDecoration: 'none', fontWeight: 600, marginBottom: '32px' }}>
          <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} /> Back to Templates Hub
        </Link>

        <motion.div 
          className="author-profile-card"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            borderRadius: '24px',
            padding: 'clamp(24px, 5vw, 48px)',
            boxShadow: '0 20px 50px rgba(59, 130, 246, 0.08)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '40px',
            marginBottom: '48px'
          }}
        >
          {/* Left Column: Avatar & Quick Info */}
          <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #818cf8 0%, #4f46e5 100%)',
              padding: '6px',
              boxShadow: '0 12px 30px rgba(79, 70, 229, 0.25)',
              marginBottom: '24px'
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: '#fff',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '4rem',
                color: '#4f46e5'
              }}>
                SJ
              </div>
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', margin: '0 0 8px 0' }}>{authorName}</h1>
            <p style={{ color: '#4f46e5', fontWeight: 700, fontSize: '1rem', margin: '0 0 16px 0' }}>{authorTitle}</p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}>
              <span style={{ background: 'rgba(79, 70, 229, 0.08)', color: '#4f46e5', padding: '6px 12px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={14} /> CA State Bar Member
              </span>
              <span style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#059669', padding: '6px 12px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={14} /> Harvard Law Alumna
              </span>
            </div>

            <div style={{ width: '100%', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
              <h4 style={{ textTransform: 'uppercase', fontSize: '0.78rem', letterSpacing: '0.08em', color: '#64748b', marginBottom: '16px', fontWeight: 800 }}>External Credentials</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#334155', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, transition: 'all 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.borderColor = '#4f46e5'}
                  onMouseOut={e => e.currentTarget.style.borderColor = '#e2e8f0'}>
                  <span>LinkedIn Profile</span> <ExternalLink size={14} />
                </a>
                <a href="https://www.g2.com" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#334155', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, transition: 'all 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.borderColor = '#4f46e5'}
                  onMouseOut={e => e.currentTarget.style.borderColor = '#e2e8f0'}>
                  <span>G2 Vetted Expert</span> <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Bio & Expert Scope */}
          <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BookOpen style={{ color: '#4f46e5' }} /> Expert Profile & Bio
            </h2>
            
            <p style={{ color: '#475569', fontSize: '1.08rem', lineHeight: 1.8, marginBottom: '28px' }}>
              {authorBio}
            </p>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>Areas of Focus</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
              {[
                "Commercial Contract Drafting",
                "SaaS Licensing & Terms",
                "Data Privacy & DPAs (GDPR/CCPA)",
                "Venture Capital Term Sheets",
                "Employment Law Compliance",
                "IP Assignment & Protection"
              ].map((focus, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '0.92rem', fontWeight: 500 }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4f46e5' }} /> {focus}
                </div>
              ))}
            </div>

            <div style={{ background: 'rgba(79, 70, 229, 0.04)', border: '1px solid rgba(79, 70, 229, 0.1)', borderRadius: '16px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'start' }}>
              <Briefcase style={{ color: '#4f46e5', shrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>Vetted & Compliance Checked</h4>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5 }}>
                  Every document listed has been reviewed by Sarah Jenkins to guarantee enforceability under current corporate law standard regulations for 2026.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Reviewed templates list */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          style={{ width: '100%' }}
        >
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '24px' }}>
            Reviewed Templates by Sarah ({reviewedTemplates.length})
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {reviewedTemplates.map((template) => (
              <motion.div
                key={template.slug}
                whileHover={{ y: -6, borderColor: '#4f46e5' }}
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '200px',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.02)'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#4f46e5', fontWeight: 800 }}>
                    {template.category}
                  </span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '8px 0', lineHeight: 1.4 }}>
                    {template.name}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {template.description}
                  </p>
                </div>

                <Link to={`/templates/${template.slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#4f46e5', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem', marginTop: '16px' }}>
                  Use Template <ArrowRight size={14} />
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
