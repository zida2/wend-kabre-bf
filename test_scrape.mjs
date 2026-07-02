import * as cheerio from 'cheerio';
import fetch from 'node-fetch';

async function testScrape() {
  try {
    const rss = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fburkina24.com%2Ffeed%2F');
    const feed = await rss.json();
    const url = feed.items[0].link;
    console.log("Scraping:", url);
    
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);
    
    $('script, style, nav, header, footer, aside, .sidebar, .widget, .comments, .menu').remove();
    
    // Find the main container
    const container = $('article, .entry-content, .post-content, .content, main, body').first();
    
    const paragraphs = [];
    container.find('p, li').each((i, el) => {
      const txt = $(el).text().trim();
      if (txt.length > 40 && !txt.includes('Archives') && !txt.includes('Copyright')) {
        paragraphs.push(txt);
      }
    });
    
    let mainContent = paragraphs.join('\n\n');
    
    const cleanText = mainContent.replace(/\s+/g, ' ').trim();
    console.log("--- FINAL TEXT ---");
    console.log(cleanText.substring(0, 1500));
  } catch (e) {
    console.error(e);
  }
}

testScrape();
