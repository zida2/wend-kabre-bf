import ClientDetails from './ClientDetails';

// Next.js 13+ generateMetadata to fetch SEO meta tags server-side
export async function generateMetadata({ searchParams }) {
  const id = searchParams?.id;
  if (!id) {
    return { title: 'Détails du Marché | Wend-Kabré' };
  }

  try {
    // We fetch directly from Firestore REST API to avoid needing firebase-admin and credentials in this env
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/wend-kabre-bf/databases/(default)/documents/marches/${id}`, {
      cache: 'no-store' // Ensure we get fresh data
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data && data.fields) {
        const title = data.fields.title?.stringValue || 'Marché Public';
        const desc = data.fields.description?.stringValue || 'Consultez les détails de ce marché public au Burkina Faso.';
        const region = data.fields.region?.stringValue || '';
        return {
          title: `${title} | Wend-Kabré`,
          description: desc.substring(0, 160) + '...',
          openGraph: {
            title: title,
            description: `Appel d'offres dans la région : ${region}. Connectez-vous sur Wend-Kabré pour plus de détails.`
          }
        };
      }
    }
  } catch (error) {
    console.error("Erreur SEO:", error);
  }

  return { title: 'Détails du Marché | Wend-Kabré' };
}

export default function MarchesDetailsPage() {
  return <ClientDetails />;
}
