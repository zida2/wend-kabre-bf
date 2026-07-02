const fs = require('fs');

const history = fs.readFileSync('scraper_full_history.txt', 'utf16le');
const lines = history.split('\n');

let foundSources = false;
let printedLines = 0;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const sources = [')) {
    console.log(`Found at line ${i}:`);
    for (let j = i; j < i + 15; j++) {
      if (lines[j]) console.log(lines[j].trim());
    }
    console.log('---');
    printedLines++;
  }
}
