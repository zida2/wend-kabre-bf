/**
 * Script pour pré-remplir automatiquement la classification humaine (DEMO uniquement)
 * En réalité, cette étape doit être faite manuellement par un expert
 */

const fs = require('fs').promises;
const path = require('path');

async function autoClassifyForDemo() {
  console.log('🎭 Pré-remplissage automatique de la classification humaine (DÉMO)');
  console.log('⚠️ En production, cette étape doit être faite MANUELLEMENT par un expert !');
  
  try {
    // Lire le fichier CSV
    const csvPath = path.join(process.cwd(), 'data', 'real-data-samples.csv');
    const content = await fs.readFile(csvPath, 'utf8');
    const lines = content.split('\n');
    
    // Traiter chaque ligne
    const processedLines = lines.map(line => {
      if (line.startsWith('id,title,source')) {
        return line; // Header
      }
      
      if (!line.trim()) return line; // Ligne vide
      
      // Parser la ligne CSV
      const matches = line.match(/^"([^"]*?)","([^"]*?)","([^"]*?)","([^"]*?)","([^"]*?)"$/);
      if (!matches) return line; // Ligne mal formatée
      
      const [, id, title, source, , ] = matches;
      
      // Classification automatique basée sur des mots-clés
      let classification = '';
      let notes = 'Classification automatique pour démo';
      
      const titleLower = title.toLowerCase();
      
      if (titleLower.includes('soutenance') || titleLower.includes('thèse') || 
          titleLower.includes('master') || titleLower.includes('doctorat')) {
        classification = 'REJECTED';
        notes = 'Événement académique - à rejeter';
        
      } else if (titleLower.includes('nomination') || titleLower.includes('nommé') ||
                titleLower.includes('décret') || titleLower.includes('communiqué de presse')) {
        classification = 'REJECTED';
        notes = 'Communication administrative - à rejeter';
        
      } else if (titleLower.includes('décès') || titleLower.includes('condoléances') ||
                titleLower.includes('cérémonie') || titleLower.includes('inauguration')) {
        classification = 'REJECTED';
        notes = 'Événement personnel/officiel - à rejeter';
        
      } else if (titleLower.includes('appel d\'offres') || titleLower.includes('demande de cotation') ||
                titleLower.includes('acquisition') || titleLower.includes('fourniture') ||
                titleLower.includes('travaux de')) {
        classification = 'VALID';
        notes = 'Marché public standard - à valider';
        
      } else if (titleLower.includes('formation') || titleLower.includes('étude de faisabilité') ||
                titleLower.includes('session de') || titleLower.includes('évaluation des besoins')) {
        classification = 'REVIEW';
        notes = 'Cas ambigu - nécessite révision manuelle';
        
      } else {
        classification = 'REVIEW';
        notes = 'Classification incertaine - révision recommandée';
      }
      
      return `"${id}","${title}","${source}","${classification}","${notes}"`;
    });
    
    // Sauvegarder le fichier mis à jour
    const updatedContent = processedLines.join('\n');
    await fs.writeFile(csvPath, updatedContent, 'utf8');
    
    // Compter les classifications
    const counts = { VALID: 0, REVIEW: 0, REJECTED: 0 };
    processedLines.forEach(line => {
      if (line.includes(',"VALID",')) counts.VALID++;
      if (line.includes(',"REVIEW",')) counts.REVIEW++;
      if (line.includes(',"REJECTED",')) counts.REJECTED++;
    });
    
    console.log('✅ Classification automatique terminée');
    console.log(`📊 Résultats:`);
    console.log(`   VALID: ${counts.VALID}`);
    console.log(`   REVIEW: ${counts.REVIEW}`);
    console.log(`   REJECTED: ${counts.REJECTED}`);
    console.log(`   Total: ${counts.VALID + counts.REVIEW + counts.REJECTED}`);
    
    console.log(`\n💾 Fichier mis à jour: ${csvPath}`);
    console.log('\n🚀 Prêt pour le benchmark! Exécutez:');
    console.log('   node scripts/run-real-benchmark.js');
    
  } catch (error) {
    console.error('❌ Erreur lors de la classification automatique:', error);
  }
}

// Exécution
if (require.main === module) {
  autoClassifyForDemo();
}

module.exports = { autoClassifyForDemo };