import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function recover() {
  console.log("Starting recovery from Burkina24 category page...");
  try {
    const res = await fetch('https://burkina24.com/category/marches-publics/');
    const html = await res.text();
    const $ = cheerio.load(html);
    
    const articles = [];
    $('article h3 a').each((i, el) => {
      articles.push({
        title: $(el).text().trim(),
        link: $(el).attr('href')
      });
    });
    
    console.log(`Found ${articles.length} articles on page 1.`);
    
    let added = 0;
    for (const item of articles) {
       console.log("Checking:", item.title);
       if (item.title.toLowerCase().includes('appel d’offre') || item.title.toLowerCase().includes("appel d'offre") || item.title.toLowerCase().includes("marché")) {
         const artRes = await fetch(item.link);
         const artHtml = await artRes.text();
         const _$ = cheerio.load(artHtml);
         
         _$('script, style, nav, header, footer, aside, .sidebar, .widget, .comments, .menu').remove();
         const container = _$('article, .entry-content, .post-content, .content, main, body').first();
         const paragraphs = [];
         
         container.find('p, li').each((i, el) => {
           const txt = _$(el).text().trim();
           if (txt.length > 40 && !txt.includes('Archives') && !txt.includes('Copyright') && !txt.includes('Article similaire')) {
             paragraphs.push(txt);
           }
         });
         
         let mainContent = paragraphs.join('\n\n');
         const description = mainContent.substring(0, 10000);
         
         if (description.length > 100) {
           await addDoc(collection(db, 'marches'), {
              title: item.title,
              description: description,
              source: 'Burkina24 (Récupération manuelle)',
              link: item.link,
              publishedAt: new Date().toISOString(),
              category: 'Prestation',
              status: 'Ouvert',
              scrapedAt: new Date().toISOString(),
           });
           console.log("-> Saved!");
           added++;
         }
       }
    }
    console.log("Successfully recovered", added, "markets.");
  } catch(e) {
    console.error(e);
  }
}
recover();
