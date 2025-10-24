#!/usr/bin/env node

/**
 * Update swagger.json from EmailEngine production API
 *
 * This script downloads the latest OpenAPI specification from
 * https://emailengine.dev/swagger.json and saves it to sources/swagger.json
 *
 * It runs automatically before builds via the 'prebuild' npm script.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SWAGGER_URL = 'https://emailengine.dev/swagger.json';
const OUTPUT_PATH = path.join(__dirname, '..', 'sources', 'swagger.json');

console.log('📥 Downloading swagger.json from EmailEngine...');
console.log(`   Source: ${SWAGGER_URL}`);
console.log(`   Target: ${OUTPUT_PATH}`);

https.get(SWAGGER_URL, (response) => {
  if (response.statusCode !== 200) {
    console.error(`❌ Failed to download swagger.json: HTTP ${response.statusCode}`);
    process.exit(1);
  }

  let data = '';

  response.on('data', (chunk) => {
    data += chunk;
  });

  response.on('end', () => {
    try {
      // Validate JSON
      const json = JSON.parse(data);

      // Pretty print with 2-space indentation
      const formatted = JSON.stringify(json, null, 2);

      // Ensure sources directory exists
      const sourcesDir = path.dirname(OUTPUT_PATH);
      if (!fs.existsSync(sourcesDir)) {
        fs.mkdirSync(sourcesDir, { recursive: true });
      }

      // Write to file
      fs.writeFileSync(OUTPUT_PATH, formatted, 'utf8');

      console.log('✅ swagger.json updated successfully');
      console.log(`   Version: ${json.info?.version || 'unknown'}`);
      console.log(`   Endpoints: ${Object.keys(json.paths || {}).length}`);
    } catch (error) {
      console.error('❌ Failed to parse or write swagger.json:', error.message);
      process.exit(1);
    }
  });
}).on('error', (error) => {
  console.error('❌ Network error downloading swagger.json:', error.message);
  process.exit(1);
});
