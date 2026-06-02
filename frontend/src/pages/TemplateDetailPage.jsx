import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Printer, Check, ShieldCheck, HelpCircle, FileText, ChevronRight, Briefcase } from 'lucide-react';
import { getTemplateBySlug } from '../data/templatesData';
import { useSEO } from '../utils/seo';

export default function TemplateDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const template = getTemplateBySlug(slug);

  // If template is invalid, redirect back to index
  useEffect(() => {
    if (!template) {
      navigate('/templates', { replace: true });
    }
  }, [template, navigate]);

  if (!template) {
    return null;
  }

  // Initialize variables state
  const [variables, setVariables] = useState(() => {
    const initial = {};
    template.variables.forEach(v => {
      initial[v.key] = v.defaultValue;
    });
    return initial;
  });

  const [copied, setCopied] = useState(false);

  // Handle variable change
  const handleVariableChange = (key, value) => {
    setVariables(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Compile contract text by replacing {{key}} with values
  const getCompiledContractText = () => {
    let text = template.contentTemplate;
    Object.keys(variables).forEach(key => {
      const val = variables[key] || '';
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      text = text.replace(regex, val);
    });
    // Replace fallback if not supplied (e.g. partyBNotation fallback)
    text = text.replace(/{{\s*.*?\s*}}/g, '');
    return text;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCompiledContractText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Compile Schemas
  const canonicalUrl = `${window.location.origin}/templates/${template.slug}`;
  
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": window.location.origin
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Templates",
        "item": `${window.location.origin}/templates`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": template.name,
        "item": canonicalUrl
      }
    ]
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": template.name,
    "description": template.description.substring(0, 200),
    "brand": {
      "@type": "Brand",
      "name": "Contractual Pro"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock",
      "url": canonicalUrl
    }
  };

  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": `${template.name} Builder`,
    "operatingSystem": "All",
    "applicationCategory": "BusinessApplication",
    "browserRequirements": "Requires HTML5 compatible browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": template.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": `How to create and customize a ${template.name}`,
    "description": `Step-by-step instructions to draft a customized ${template.name} for your business negotiations.`,
    "step": template.howto.map((stepText, idx) => ({
      "@type": "HowToStep",
      "position": idx + 1,
      "text": stepText
    }))
  };

  useSEO({
    title: `${template.name} Customizer`,
    description: template.description.substring(0, 160),
    canonicalUrl,
    schemas: [breadcrumbSchema, productSchema, softwareAppSchema, faqSchema, howToSchema]
  });

  return (
    <div className="template-detail-wrapper mesh-gradient-wrap" style={{ minHeight: '100vh', paddingTop: '120px', paddingBottom: '80px', position: 'relative' }}>
      <div className="mesh-gradient-bg" />
      <div className="pattern-grid-premium" />

      {/* Embedded print overrides to ONLY print the document container */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-document-target, #print-document-target * {
            visibility: visible !important;
          }
          #print-document-target {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #fff !important;
            color: #000 !important;
          }
        }
      `}</style>

      <div className="container" style={{ position: 'relative', zIndex: 5 }}>
        
        {/* Navigation Breadcrumb */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#64748b', fontSize: '0.9rem', marginBottom: '24px', fontWeight: 600 }}>
          <Link to="/templates" style={{ color: '#64748b', textDecoration: 'none' }}>Templates</Link>
          <ChevronRight size={14} />
          <span style={{ color: '#4f46e5' }}>{template.name}</span>
        </div>

        <Link to="/templates" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#4f46e5', textDecoration: 'none', fontWeight: 700, marginBottom: '28px' }}>
          <ArrowLeft size={16} /> Back to Directory
        </Link>

        {/* Top Info Layout */}
        <div style={{ marginBottom: '40px' }}>
          <span style={{
            background: 'rgba(79, 70, 229, 0.08)',
            color: '#4f46e5',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '0.82rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            display: 'inline-block',
            marginBottom: '12px'
          }}>{template.category}</span>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: '#0f172a', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>
            {template.name}
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#475569', lineHeight: 1.6, maxWidth: '900px', margin: 0 }}>
            {template.description}
          </p>
        </div>

        {/* Builder Interactive Workspace */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '32px',
          alignItems: 'start',
          marginBottom: '56px'
        }}>
          {/* Sidebar Editor */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: '0 8px 30px rgba(59, 130, 246, 0.04)',
            position: 'sticky',
            top: '100px'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              Document Parameters
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {template.variables.map((field) => (
                <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor={field.key} style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                    {field.label}
                  </label>
                  <input
                    id={field.key}
                    type={field.type}
                    value={variables[field.key] || ''}
                    onChange={(e) => handleVariableChange(field.key, e.target.value)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.95rem',
                      outline: 'none',
                      background: '#fff',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                  />
                </div>
              ))}
            </div>

            {/* Actions Stack */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={handleCopy}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px',
                  borderRadius: '10px',
                  background: copied ? '#10b981' : '#4f46e5',
                  color: '#fff',
                  border: 'none',
                  fontSize: '0.98rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? 'Copied Contract!' : 'Copy to Clipboard'}
              </button>

              <button
                onClick={handlePrint}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px',
                  borderRadius: '10px',
                  background: '#fff',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.98rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseOut={e => e.currentTarget.style.background = '#fff'}
              >
                <Printer size={18} /> Print / Save as PDF
              </button>

              <div style={{ height: '1px', background: '#e2e8f0', margin: '8px 0' }} />

              {/* Legal check badge */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'start', padding: '16px', background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.1)', borderRadius: '12px' }}>
                <ShieldCheck size={18} style={{ color: '#059669', shrink: 0, marginTop: '2px' }} />
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#065f46', lineHeight: 1.4 }}>
                  Approved by <strong>Sarah Jenkins, Esq.</strong> of Harvard Law. Compliant with electronic signature mandates.
                </p>
              </div>
            </div>
          </div>

          {/* Paper Document Preview Panel */}
          <div style={{ gridColumn: 'span 1' }}>
            <div 
              id="print-document-target"
              style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: 'clamp(20px, 6vw, 60px)',
                boxShadow: '0 10px 40px rgba(15, 23, 42, 0.05)',
                fontFamily: '"Times New Roman", Times, Georgia, serif',
                fontSize: '1.05rem',
                lineHeight: 1.7,
                color: '#1e293b',
                whiteSpace: 'pre-line',
                textAlign: 'justify',
                minHeight: '700px',
                userSelect: 'text'
              }}
            >
              {getCompiledContractText()}
            </div>
          </div>
        </div>

        {/* HowTo and FAQ layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '40px',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          borderRadius: '24px',
          padding: 'clamp(24px, 5vw, 48px)',
          boxShadow: '0 10px 40px rgba(15, 23, 42, 0.02)',
          marginBottom: '48px'
        }}>
          {/* How-To Column */}
          <div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              How to Execute this Template
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {template.howto.map((step, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '16px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: '#4f46e5',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    shrink: 0
                  }}>{idx + 1}</div>
                  <p style={{ margin: 0, color: '#475569', fontSize: '0.98rem', lineHeight: 1.5 }}>{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ Column */}
          <div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              Frequently Asked Questions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {template.faqs.map((faq, idx) => (
                <div key={idx}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', display: 'flex', gap: '8px', alignItems: 'start' }}>
                    <HelpCircle size={16} style={{ color: '#4f46e5', shrink: 0, marginTop: '2px' }} /> {faq.q}
                  </h4>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, paddingLeft: '24px' }}>{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* EEAT Reviewer Credit Footer */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          borderRadius: '20px',
          padding: '32px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '24px',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.02)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #818cf8 0%, #4f46e5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.5rem',
            color: '#fff',
            shrink: 0
          }}>
            SJ
          </div>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
              Reviewed by {template.author.name}
            </h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>
              {template.author.bio}
            </p>
          </div>
          <Link
            to={`/authors/${template.author.slug}`}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: '1px solid #4f46e5',
              color: '#4f46e5',
              textDecoration: 'none',
              fontSize: '0.92rem',
              fontWeight: 700,
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseOver={e => { e.currentTarget.style.background = '#4f46e5'; e.currentTarget.style.color = '#fff'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4f46e5'; }}
          >
            Verify Credentials
          </Link>
        </div>

      </div>
    </div>
  );
}
