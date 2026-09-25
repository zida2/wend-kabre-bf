/**
 * Script d'extraction des données réelles depuis Firebase
 * Pour alimenter le benchmark avec de vraies données burkinabé
 */

const admin = require('firebase-admin');
const fs = require('fs').promises;
const path = require('path');

// Configuration Firebase (à adapter selon votre config)
if (!admin.apps.length) {
  admin.initializeApp({
    // Ajoutez ici vos credentials Firebase
    // ou utilisez les variables d'environnement
  });
}

/**
 * Extrait des échantillons de données depuis Firebase
 */
async function extractSamplesFromFirebase(sampleSize = 200) {
  try {
    console.log(`🔍 Extraction de ${sampleSize} échantillons depuis Firebase...`);
    
    const db = admin.firestore();
    
    // Adapter selon votre structure de données
    const collections = ['markets', 'tenders', 'announcements', 'scraped_content'];
    const allSamples = [];
    
    for (const collectionName of collections) {
      try {
        console.log(`📂 Vérification de la collection: ${collectionName}`);
        
        const snapshot = await db.collection(collectionName)
          .limit(Math.ceil(sampleSize / collections.length))
          .get();
        
        if (snapshot.empty) {
          console.log(`   ⚠️  Collection ${collectionName} vide ou inexistante`);
          continue;
        }
        
        console.log(`   ✅ ${snapshot.size} documents trouvés dans ${collectionName}`);
        
        snapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          allSamples.push({
            id: `${collectionName}-${doc.id}`,
            firestoreId: doc.id,
            collection: collectionName,
            title: data.title || data.titre || data.subject || '',
            description: data.description || data.content || data.body || data.text || '',
            source: data.source || data.website || data.domain || '',
            url: data.url || data.link || data.originalUrl || '',
            date: data.date || data.publishedAt || data.createdAt || null,
            category: data.category || data.type || '',
            rawData: data,
            extractedAt: new Date().toISOString()
          });
        });
        
      } catch (collectionError) {
        console.warn(`⚠️ Erreur sur la collection ${collectionName}:`, collectionError.message);
      }
    }
    
    console.log(`✅ Total extrait: ${allSamples.length} échantillons`);
    return allSamples;
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'extraction Firebase:', error);
    return [];
  }
}

/**
 * Génère des échantillons factices si Firebase n'est pas accessible
 */
function generateMockSamples(count = 50) {
  console.log(`🎭 Génération de ${count} échantillons factices...`);
  
  const mockTitles = [
    "Appel d'offres pour fourniture de matériel informatique au profit du Ministère de la Santé",
    "Demande de cotation pour travaux de construction d'un centre de santé à Koudougou",
    "Avis de recrutement - Prestation de gardiennage pour bâtiments administratifs",
    "Acquisition de véhicules tout-terrain pour la Direction Régionale de l'Agriculture",
    "Travaux de réfection de la route nationale RN1 - Tronçon Ouagadougou-Kaya",
    
    // Cas à rejeter
    "Soutenance de thèse de Master en Informatique - Université Joseph Ki-Zerbo",
    "Communiqué de presse - Nomination du nouveau Directeur Général des Impôts", 
    "Avis de décès - Rappel à Dieu de l'ancien Ministre de l'Agriculture",
    "Cérémonie d'inauguration du nouveau complexe sportif de Bobo-Dioulasso",
    "Décret N°2024-001 portant nomination au sein du Ministère des Finances",
    
    // Cas ambigus
    "Prestation de formation en gestion de projet pour les cadres du Ministère",
    "Étude de faisabilité pour la construction du pont de Kongoussi",
    "Session de formation sur les marchés publics pour les agents comptables",
    "Évaluation des besoins en infrastructures sanitaires dans la région du Sahel",
    "Rapport d'étude sur l'amélioration du système d'approvisionnement en eau"
  ];
  
  const mockSources = [
    'dgcmef.gov.bf', 'arcop.bf', 'sante.gov.bf', 'infrastructures.gov.bf',
    'agriculture.gov.bf', 'univ-ouaga.bf', 'finances.gov.bf', 'info.bf',
    'gouvernement.gov.bf', 'equipement.gov.bf'
  ];
  
  const samples = [];
  
  for (let i = 0; i < count; i++) {
    const titleIndex = i % mockTitles.length;
    samples.push({
      id: `mock-${i + 1}`,
      title: mockTitles[titleIndex],
      description: `Description détaillée pour "${mockTitles[titleIndex].substring(0, 30)}...". Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
      source: mockSources[i % mockSources.length],
      url: `https://${mockSources[i % mockSources.length]}/document-${i + 1}`,
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Derniers 30 jours
      category: titleIndex < 5 ? 'marche' : titleIndex < 10 ? 'communication' : 'formation',
      extractedAt: new Date().toISOString()
    });
  }
  
  return samples;
}

/**
 * Sauvegarde les échantillons pour le benchmark
 */
async function saveSamples(samples, filename = 'real-data-samples.json') {
  try {
    const outputPath = path.join(process.cwd(), 'data', filename);
    
    // Créer le dossier data s'il n'existe pas
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    
    await fs.writeFile(outputPath, JSON.stringify(samples, null, 2), 'utf8');
    console.log(`💾 Échantillons sauvegardés dans: ${outputPath}`);
    
    // Génerer aussi un fichier CSV pour faciliter la classification humaine
    const csvPath = outputPath.replace('.json', '.csv');
    const csvContent = [
      'id,title,source,classification_humaine,notes',
      ...samples.map(s => 
        `"${s.id}","${s.title.replace(/"/g, '""')}","${s.source}","",""`
      )
    ].join('\n');
    
    await fs.writeFile(csvPath, csvContent, 'utf8');
    console.log(`📊 Template CSV créé dans: ${csvPath}`);
    
    return outputPath;
    
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde:', error);
    throw error;
  }
}

/**
 * Génère un template pour la classification humaine
 */
function generateHumanClassificationTemplate(samples) {
  console.log('\n📋 TEMPLATE POUR CLASSIFICATION HUMAINE');
  console.log('=' .repeat(80));
  console.log('Pour chaque contenu ci-dessous, indiquez:');
  console.log('- VALID   : Vrai marché public à afficher');
  console.log('- REVIEW  : Cas ambigu nécessitant révision');
  console.log('- REJECTED: À rejeter (pas un marché)');
  console.log('=' .repeat(80));
  
  samples.slice(0, 10).forEach((sample, index) => {
    console.log(`\n${index + 1}. ID: ${sample.id}`);
    console.log(`   Titre: ${sample.title}`);
    console.log(`   Source: ${sample.source}`);
    console.log(`   Classification: _______________`);
    console.log(`   Notes: ________________________`);
  });
  
  console.log(`\n... et ${Math.max(0, samples.length - 10)} autres dans le fichier CSV`);
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 EXTRACTION DES DONNÉES RÉELLES POUR BENCHMARK');
  console.log('=' .repeat(60));
  
  const sampleSize = process.argv[2] ? parseInt(process.argv[2]) : 200;
  
  let samples = [];
  
  // Tenter l'extraction depuis Firebase
  try {
    samples = await extractSamplesFromFirebase(sampleSize);
  } catch (error) {
    console.warn('⚠️ Firebase non accessible, utilisation d\'échantillons factices');
  }
  
  // Si pas de données Firebase, utiliser des échantillons factices
  if (samples.length === 0) {
    samples = generateMockSamples(Math.min(sampleSize, 50));
  }
  
  if (samples.length === 0) {
    console.error('❌ Aucune donnée disponible');
    process.exit(1);
  }
  
  // Statistiques des échantillons
  console.log('\n📊 STATISTIQUES DES ÉCHANTILLONS');
  console.log('-'.repeat(40));
  console.log(`Total: ${samples.length}`);
  console.log(`Avec titre: ${samples.filter(s => s.title).length}`);
  console.log(`Avec description: ${samples.filter(s => s.description).length}`);
  console.log(`Avec source: ${samples.filter(s => s.source).length}`);
  
  const sourceCounts = {};
  samples.forEach(s => {
    const source = s.source || 'unknown';
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  });
  
  console.log('\nSources les plus fréquentes:');
  Object.entries(sourceCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .forEach(([source, count]) => {
      console.log(`  ${source}: ${count}`);
    });
  
  // Sauvegarder
  await saveSamples(samples);
  
  // Générer le template de classification
  generateHumanClassificationTemplate(samples);
  
  console.log('\n✅ Extraction terminée!');
  console.log('\n🎯 PROCHAINES ÉTAPES:');
  console.log('1. Ouvrir le fichier CSV généré');
  console.log('2. Classifier manuellement chaque contenu (VALID/REVIEW/REJECTED)');
  console.log('3. Lancer le benchmark: node scripts/run-real-benchmark.js');
}

// Exécution si appelé directement
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  extractSamplesFromFirebase,
  generateMockSamples,
  saveSamples
};