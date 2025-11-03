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

      // Replace server URL with example domain
      // EmailEngine is self-hosted, so we use an example domain instead of localhost
      if (json.servers && Array.isArray(json.servers)) {
        json.servers = json.servers.map(server => ({
          ...server,
          url: 'https://emailengine.example.com',
          description: 'Your EmailEngine server (replace with your actual server URL)'
        }));
      }

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

      // Regenerate API docs and sidebar
      console.log('\n🔄 Regenerating API documentation...');
      const { execSync } = require('child_process');

      try {
        // Regenerate API docs from OpenAPI spec
        execSync('npm run docusaurus gen-api-docs all', { stdio: 'inherit' });
        console.log('✅ API docs regenerated');

        // Regenerate API sidebar structure
        console.log('\n🔄 Regenerating API sidebar...');
        execSync('npm run generate-api-sidebar', { stdio: 'inherit' });
        console.log('✅ API sidebar regenerated');
        console.log('\n⚠️  NOTE: Review and commit the updated sidebars.ts file');
      } catch (error) {
        console.error('⚠️  Warning: Failed to regenerate API docs/sidebar:', error.message);
        console.error('   You may need to run these commands manually:');
        console.error('   - npm run docusaurus gen-api-docs all');
        console.error('   - npm run generate-api-sidebar');
      }
    } catch (error) {
      console.error('❌ Failed to parse or write swagger.json:', error.message);
      process.exit(1);
    }
  });
}).on('error', (error) => {
  console.error('❌ Network error downloading swagger.json:', error.message);
  process.exit(1);
});
