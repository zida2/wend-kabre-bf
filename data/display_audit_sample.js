const fs = require('fs');

const data = JSON.parse(fs.readFileSync('GOLD_V2_CANDIDATE.json', 'utf8'));

console.log('=== AUDIT PHASE 2 - ÉCHANTILLONS REPRÉSENTATIFS ===\n');

console.log('MÉTADONNÉES:');
console.log(JSON.stringify(data.metadata, null, 2));

console.log('\nÉCHANTILLONS REPRÉSENTATIFS (11 sur 100):');

[0, 9, 19, 29, 39, 49, 59, 69, 79, 89, 99].forEach(i => {
  if (data.samples[i]) {
    console.log(`\n${i+1}. ID: ${data.samples[i].id}`);
    console.log(`   Titre: ${data.samples[i].title}`);
    console.log(`   Source: ${data.samples[i].original_source}`);
    console.log(`   Référence: ${data.samples[i].reference}`);
    console.log(`   raw_category: ${data.samples[i].raw_category}`);
    console.log(`   human_verified: ${data.samples[i].human_verified}`);
    if (data.samples[i].gold_label || data.samples[i].predicted_label) {
      console.log(`   ⚠️ LABELS TROUVÉS: gold_label=${data.samples[i].gold_label}, predicted_label=${data.samples[i].predicted_label}`);
    }
  }
});

// Vérifications additionnelles
let labelsFound = 0;
let templatesFound = 0;

data.samples.forEach(sample => {
  if (sample.gold_label || sample.predicted_label || sample.v2f_prediction || sample.v2g_prediction) {
    labelsFound++;
  }
  
  if (sample.description && sample.description.includes('dans le cadre du renforcement') && 
      sample.description.includes('pour accompagner')) {
    templatesFound++;
  }
});

console.log(`\nVÉRIFICATIONS:`)
console.log(`Total échantillons: ${data.samples.length}`);
console.log(`Échantillons avec labels: ${labelsFound}`);
console.log(`Templates suspects détectés: ${templatesFound}`);