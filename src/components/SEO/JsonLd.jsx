/**
 * Composant pour injecter des données structurées JSON-LD
 * Améliore le référencement avec Schema.org
 */

export default function JsonLd({ data }) {
  if (!data) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Exemple d'utilisation :
 * 
 * import JsonLd from '@/components/SEO/JsonLd';
 * import { faqJsonLd } from '@/lib/seo-metadata';
 * 
 * export default function Page() {
 *   return (
 *     <>
 *       <JsonLd data={faqJsonLd} />
 *       <main>...</main>
 *     </>
 *   );
 * }
 */
