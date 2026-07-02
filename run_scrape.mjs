import { runClientScrape } from './src/lib/scraper.js';

async function test() {
  console.log("Starting scrape test...");
  try {
    const results = await runClientScrape();
    console.log("Scraped markets count:", results?.length || 0);
    if (results && results.length > 0) {
      results.forEach((r, i) => {
        console.log(`\n--- Market ${i+1} ---`);
        console.log("Title:", r.title);
        console.log("Category:", r.category);
        console.log("Source:", r.source);
        console.log("Desc length:", r.description.length);
        console.log("Desc preview:", r.description.substring(0, 200).replace(/\n/g, ' '));
      });
    }
  } catch (e) {
    console.error(e);
  }
}
test();
