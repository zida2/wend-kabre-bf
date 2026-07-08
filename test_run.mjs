import * as cheerio from 'cheerio';
import fetch from 'node-fetch';

async function testARCOP() {
  console.log('--- Testing ARCOP ---');
  try {
    const res = await fetch('https://www.arcop.bf/appels-doffres/', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    const $ = cheerio.load(html);
    const table = $('table').first();
    let found = 0;
    if (table.length > 0) {
      table.find('tr').each((i, tr) => {
        if (i === 0) return; // Skip header
        const td = $(tr).find('td').first();
        if (td.length > 0) {
          const text = td.text().trim().replace(/\s+/g, ' ');
          if (text.includes('Télécharger')) {
            found++;
            const titlePart = text.split('Télécharger')[0].trim();
            console.log('Found:', titlePart);
          }
        }
      });
    }
    console.log('Total ARCOP found:', found);
  } catch (e) {
    console.error("Erreur de scraping sur ARCOP:", e.message);
  }
}

async function testDGCMEF() {
  console.log('--- Testing DGCMEF ---');
  try {
    const res = await fetch('https://www.dgcmef.gov.bf/fr/appels-d-offre', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    const $ = cheerio.load(html);
    let found = 0;
    $('a').each((i, el) => {
      const text = $(el).text().trim();
      let href = $(el).attr('href');
      if (text && text.includes('Quotidien n°') && href) {
        found++;
        console.log('Found:', text, href);
      }
    });
    console.log('Total DGCMEF found:', found);
  } catch (e) {
    console.error("Erreur de scraping sur DGCMEF:", e.message);
  }
}

async function run() {
  await testARCOP();
  await testDGCMEF();
}
run();
