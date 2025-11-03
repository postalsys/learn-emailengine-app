const fs = require('fs');
const path = require('path');

const swagger = JSON.parse(fs.readFileSync('sources/swagger.json', 'utf8'));
const apiDocsDir = 'docs/api';

// Create tag directories and organize files
const tagFolders = new Set();

// Extract tag from each endpoint
Object.entries(swagger.paths).forEach(([pathName, methods]) => {
  Object.entries(methods).forEach(([method, endpoint]) => {
    if (endpoint.tags && endpoint.tags[0]) {
      const tag = endpoint.tags[0];
      // Convert tag to folder name (lowercase, replace spaces with dashes)
      const folderName = tag.toLowerCase().replace(/\s+/g, '-');
      tagFolders.add({ tag, folderName });
    }
  });
});

// Get all API doc files
const apiFiles = fs.readdirSync(apiDocsDir).filter(f => f.endsWith('.api.mdx'));

// For each file, determine its tag from swagger spec
apiFiles.forEach(file => {
  const filePath = path.join(apiDocsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');

  // Extract the operation ID from frontmatter
  const match = content.match(/^---\nid:\s*(.+?)\n/);
  if (!match) return;

  const operationId = match[1];

  // Find the endpoint's tag in swagger
  let endpointTag = null;
  outer: for (const [pathName, methods] of Object.entries(swagger.paths)) {
    for (const [method, endpoint] of Object.entries(methods)) {
      if (endpoint.operationId === operationId) {
        endpointTag = endpoint.tags?.[0];
        break outer;
      }
    }
  }

  if (endpointTag) {
    const folderName = endpointTag.toLowerCase().replace(/\s+/g, '-');
    const tagDir = path.join(apiDocsDir, folderName);

    // Create directory if it doesn't exist
    if (!fs.existsSync(tagDir)) {
      fs.mkdirSync(tagDir, { recursive: true });
    }

    // Move file to tag directory
    const newPath = path.join(tagDir, file);
    fs.renameSync(filePath, newPath);
    console.log(`Moved ${file} to ${folderName}/`);
  }
});

// Create _category_.json files for each tag folder
[...tagFolders].forEach(({ tag, folderName }) => {
  const tagDir = path.join(apiDocsDir, folderName);
  if (fs.existsSync(tagDir)) {
    const categoryFile = path.join(tagDir, '_category_.json');
    fs.writeFileSync(categoryFile, JSON.stringify({
      label: tag,
      position: 1,
      collapsible: true,
      collapsed: true
    }, null, 2));
    console.log(`Created category file for ${tag}`);
  }
});

console.log('\nAPI docs organized by tag!');
