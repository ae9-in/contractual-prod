import { useEffect } from 'react';

/**
 * Custom hook to dynamically inject SEO tags and structured JSON-LD data into the document head.
 * @param {Object} seoOptions
 * @param {string} seoOptions.title - The title of the page
 * @param {string} seoOptions.description - The meta description
 * @param {string} [seoOptions.canonicalUrl] - Optional canonical URL
 * @param {Array|Object} [seoOptions.schemas] - JSON-LD schema object(s) to inject
 */
export function useSEO({ title, description, canonicalUrl, schemas }) {
  useEffect(() => {
    // 1. Update document title
    if (title) {
      document.title = `${title} | Contractual Pro`;
    }

    // 2. Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    if (description) {
      metaDescription.setAttribute('content', description);
    }

    // 3. Update canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    const currentCanonical = canonicalUrl || window.location.href;
    canonicalLink.setAttribute('href', currentCanonical);

    // 4. Inject JSON-LD Schema
    const existingScripts = document.querySelectorAll('script[data-schema="jsonld"]');
    existingScripts.forEach((script) => script.remove());

    if (schemas) {
      const schemaList = Array.isArray(schemas) ? schemas : [schemas];
      schemaList.forEach((schemaObj) => {
        if (!schemaObj) return;
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-schema', 'jsonld');
        script.text = JSON.stringify(schemaObj);
        document.head.appendChild(script);
      });
    }

    // Cleanup on unmount or update
    return () => {
      // We don't necessarily want to strip the description immediately if transitioning to another page that will overwrite it,
      // but let's clear schema scripts to avoid stale tags.
      const scriptsToClean = document.querySelectorAll('script[data-schema="jsonld"]');
      scriptsToClean.forEach((script) => script.remove());
    };
  }, [title, description, canonicalUrl, schemas]);
}
