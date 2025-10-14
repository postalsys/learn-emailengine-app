---
title: "Working with Attachments"
sidebar_position: 6
description: "Complete guide to handling email attachments - downloading, uploading, inline images, and file management"
keywords:
  - email attachments
  - download attachments
  - inline images
  - file attachments
  - attachment handling
---

# Working with Attachments

<!--
Source attribution:
- EmailEngine API documentation
- Attachment handling patterns
-->

Email attachments are files sent with email messages. EmailEngine provides comprehensive APIs for downloading attachments, handling inline images, and working with attachment metadata.

## Understanding Attachments

### Attachment Types

**Regular Attachments**
- Files explicitly attached to the email
- Displayed in attachment list
- `disposition: "attachment"`
- Examples: PDFs, documents, spreadsheets

**Inline Attachments**
- Images embedded in HTML content
- Referenced with `cid:` URLs
- `disposition: "inline"`
- Examples: logos, signatures, embedded images

**Both Types**
- EmailEngine handles both transparently
- Each attachment has a unique ID
- Content-Type indicates file type

### Attachment Metadata

Each attachment includes:

```json
{
  "id": "AAAAAgAAAeEBAAAAAQAAAeE",
  "contentType": "application/pdf",
  "disposition": "attachment",
  "filename": "invoice.pdf",
  "encodedSize": 45000,
  "size": 43500,
  "embedded": false,
  "contentId": null
}
```

**id** - Unique attachment identifier (use for downloading)
**contentType** - MIME type of the file
**disposition** - "attachment" or "inline"
**filename** - Original filename (may be null)
**encodedSize** - Size in email (base64 encoded)
**size** - Actual file size after decoding
**embedded** - True if inline image
**contentId** - Content-ID for inline images (cid:xxx)

## Listing Attachments

### Get Message with Attachments

Fetch a message to see its attachments:

```javascript
async function getMessageAttachments(accountId, messageId) {
  const response = await fetch(
    `https://your-emailengine.com/v1/account/${accountId}/message/${messageId}`,
    {
      headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' }
    }
  );

  const message = await response.json();

  return {
    messageId: message.id,
    subject: message.subject,
    attachments: message.attachments || [],
    hasAttachments: message.attachments && message.attachments.length > 0
  };
}

const info = await getMessageAttachments('example', 'AAAAAQAAAeE');
console.log(`Message: ${info.subject}`);
console.log(`Attachments: ${info.attachments.length}`);

info.attachments.forEach(att => {
  console.log(`- ${att.filename} (${formatBytes(att.size)})`);
});
```

### Filter by Attachment Type

```javascript
function filterAttachments(attachments, options = {}) {
  return attachments.filter(att => {
    // Filter by type
    if (options.type) {
      if (!att.contentType.includes(options.type)) {
        return false;
      }
    }

    // Filter out inline images
    if (options.excludeInline && att.embedded) {
      return false;
    }

    // Filter by size
    if (options.minSize && att.size < options.minSize) {
      return false;
    }

    if (options.maxSize && att.size > options.maxSize) {
      return false;
    }

    return true;
  });
}

// Get only PDF attachments
const pdfs = filterAttachments(message.attachments, {
  type: 'pdf',
  excludeInline: true
});

// Get large attachments (>1MB)
const largeFiles = filterAttachments(message.attachments, {
  minSize: 1024 * 1024,
  excludeInline: true
});
```

## Downloading Attachments

### Download Single Attachment

Download an attachment by its ID:

```bash
curl "https://your-emailengine.com/v1/account/example/message/AAAAAQAAAeE/attachment/AAAAAgAAAeEBAAAAAQAAAeE" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  --output invoice.pdf
```

**JavaScript (Node.js):**

```javascript
const fs = require('fs');

async function downloadAttachment(accountId, messageId, attachmentId, outputPath) {
  const response = await fetch(
    `https://your-emailengine.com/v1/account/${accountId}/message/${messageId}/attachment/${attachmentId}`,
    {
      headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' }
    }
  );

  if (!response.ok) {
    throw new Error(`Download failed: ${response.statusText}`);
  }

  const buffer = await response.buffer();
  fs.writeFileSync(outputPath, buffer);

  return {
    path: outputPath,
    size: buffer.length
  };
}

// Download attachment
const result = await downloadAttachment(
  'example',
  'AAAAAQAAAeE',
  'AAAAAgAAAeEBAAAAAQAAAeE',
  './downloads/invoice.pdf'
);

console.log(`Downloaded to ${result.path} (${result.size} bytes)`);
```

**Python:**

```python
import requests

def download_attachment(account_id, message_id, attachment_id, output_path):
    url = f"https://your-emailengine.com/v1/account/{account_id}/message/{message_id}/attachment/{attachment_id}"
    headers = {"Authorization": "Bearer YOUR_ACCESS_TOKEN"}

    response = requests.get(url, headers=headers)
    response.raise_for_status()

    with open(output_path, 'wb') as f:
        f.write(response.content)

    return {
        'path': output_path,
        'size': len(response.content)
    }

# Download attachment
result = download_attachment(
    'example',
    'AAAAAQAAAeE',
    'AAAAAgAAAeEBAAAAAQAAAeE',
    './downloads/invoice.pdf'
)

print(f"Downloaded to {result['path']} ({result['size']} bytes)")
```

### Download All Attachments

Download all attachments from a message:

```javascript
async function downloadAllAttachments(accountId, messageId, outputDir) {
  // Get message to find attachments
  const message = await getMessage(accountId, messageId);

  if (!message.attachments || message.attachments.length === 0) {
    return [];
  }

  // Create output directory if needed
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const downloads = [];

  for (const attachment of message.attachments) {
    // Skip inline images
    if (attachment.embedded) {
      continue;
    }

    // Generate safe filename
    const filename = attachment.filename || `attachment-${attachment.id}`;
    const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const outputPath = `${outputDir}/${safeName}`;

    try {
      const result = await downloadAttachment(
        accountId,
        messageId,
        attachment.id,
        outputPath
      );

      downloads.push({
        ...result,
        originalName: attachment.filename,
        contentType: attachment.contentType
      });

      console.log(`Downloaded: ${filename}`);
    } catch (err) {
      console.error(`Failed to download ${filename}:`, err.message);
    }
  }

  return downloads;
}

// Download all attachments from a message
const downloads = await downloadAllAttachments(
  'example',
  'AAAAAQAAAeE',
  './downloads/message-AAAAAQAAAeE'
);

console.log(`Downloaded ${downloads.length} attachments`);
```

### Download to Memory

For processing without saving to disk:

```javascript
async function downloadToMemory(accountId, messageId, attachmentId) {
  const response = await fetch(
    `https://your-emailengine.com/v1/account/${accountId}/message/${messageId}/attachment/${attachmentId}`,
    {
      headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' }
    }
  );

  if (!response.ok) {
    throw new Error(`Download failed: ${response.statusText}`);
  }

  const buffer = await response.buffer();
  const contentType = response.headers.get('content-type');

  return {
    buffer,
    contentType,
    size: buffer.length
  };
}

// Process attachment in memory
const data = await downloadToMemory('example', 'AAAAAQAAAeE', 'AAAAAgAAAeEBAAAAAQAAAeE');

// Parse PDF, analyze image, etc.
console.log(`Loaded ${data.size} bytes of ${data.contentType}`);
```

## Working with Inline Images

### Identify Inline Images

```javascript
function getInlineImages(message) {
  if (!message.attachments) return [];

  return message.attachments.filter(att => att.embedded);
}

const inlineImages = getInlineImages(message);
console.log(`Message has ${inlineImages.length} inline images`);
```

### Download Inline Images

```javascript
async function downloadInlineImages(accountId, messageId, outputDir) {
  const message = await getMessage(accountId, messageId);
  const inlineImages = getInlineImages(message);

  if (inlineImages.length === 0) {
    return [];
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const downloads = [];

  for (const image of inlineImages) {
    // Use Content-ID as filename if no filename provided
    let filename = image.filename;

    if (!filename) {
      const ext = image.contentType.split('/')[1] || 'bin';
      filename = `inline-${image.contentId || image.id}.${ext}`;
    }

    const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const outputPath = `${outputDir}/${safeName}`;

    try {
      await downloadAttachment(accountId, messageId, image.id, outputPath);

      downloads.push({
        path: outputPath,
        contentId: image.contentId,
        contentType: image.contentType
      });
    } catch (err) {
      console.error(`Failed to download inline image:`, err);
    }
  }

  return downloads;
}
```

### Replace CID References in HTML

Convert HTML with inline images to use local files:

```javascript
async function convertHtmlWithInlineImages(message, imageDir) {
  let html = message.html ? message.html.join('\n') : '';

  if (!html) return html;

  const inlineImages = getInlineImages(message);

  for (const image of inlineImages) {
    if (image.contentId) {
      // Find cid: references
      const cidPattern = new RegExp(`cid:${image.contentId}`, 'gi');

      // Generate filename
      const ext = image.contentType.split('/')[1] || 'bin';
      const filename = `inline-${image.contentId}.${ext}`;

      // Replace with local path
      html = html.replace(cidPattern, `${imageDir}/${filename}`);
    }
  }

  return html;
}

// Usage
const message = await getMessage('example', 'AAAAAQAAAeE');
await downloadInlineImages('example', message.id, './images');
const convertedHtml = await convertHtmlWithInlineImages(message, './images');

// Save HTML file
fs.writeFileSync('./message.html', convertedHtml);
```

## Common Patterns

### Save Attachments by Type

```javascript
async function saveAttachmentsByType(accountId, messageId, baseDir) {
  const message = await getMessage(accountId, messageId);

  const typeMap = {
    'application/pdf': 'pdfs',
    'image/': 'images',
    'application/vnd.openxmlformats-officedocument': 'documents',
    'application/vnd.ms-': 'documents',
    'text/': 'text',
    'application/zip': 'archives'
  };

  for (const attachment of message.attachments || []) {
    if (attachment.embedded) continue;

    // Determine type directory
    let typeDir = 'other';
    for (const [pattern, dir] of Object.entries(typeMap)) {
      if (attachment.contentType.includes(pattern)) {
        typeDir = dir;
        break;
      }
    }

    const outputDir = `${baseDir}/${typeDir}`;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = attachment.filename || `attachment-${attachment.id}`;
    const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const outputPath = `${outputDir}/${safeName}`;

    await downloadAttachment(accountId, messageId, attachment.id, outputPath);
    console.log(`Saved to ${outputPath}`);
  }
}

// Organize attachments by type
await saveAttachmentsByType('example', 'AAAAAQAAAeE', './organized');
```

### Process Large Attachments

Handle large attachments with streaming:

```javascript
async function downloadLargeAttachment(accountId, messageId, attachmentId, outputPath) {
  const response = await fetch(
    `https://your-emailengine.com/v1/account/${accountId}/message/${messageId}/attachment/${attachmentId}`,
    {
      headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' }
    }
  );

  if (!response.ok) {
    throw new Error(`Download failed: ${response.statusText}`);
  }

  // Stream to file
  const fileStream = fs.createWriteStream(outputPath);

  return new Promise((resolve, reject) => {
    response.body.pipe(fileStream);

    response.body.on('error', reject);
    fileStream.on('finish', () => {
      resolve({
        path: outputPath,
        size: fs.statSync(outputPath).size
      });
    });
    fileStream.on('error', reject);
  });
}
```

### Extract Attachment Metadata

```javascript
async function extractAttachmentMetadata(accountId, folderPath) {
  const messages = await listAllMessages(accountId, folderPath);

  const metadata = [];

  for (const message of messages) {
    if (!message.hasAttachments) continue;

    const fullMessage = await getMessage(accountId, message.id);

    for (const attachment of fullMessage.attachments || []) {
      if (attachment.embedded) continue;

      metadata.push({
        messageId: message.id,
        messageSubject: message.subject,
        messageDate: message.date,
        messageFrom: message.from.address,
        attachmentId: attachment.id,
        filename: attachment.filename,
        contentType: attachment.contentType,
        size: attachment.size,
        encodedSize: attachment.encodedSize
      });
    }
  }

  return metadata;
}

// Extract metadata for all attachments in INBOX
const metadata = await extractAttachmentMetadata('example', 'INBOX');

// Export to CSV
const csv = [
  ['Message Subject', 'From', 'Date', 'Filename', 'Type', 'Size'],
  ...metadata.map(m => [
    m.messageSubject,
    m.messageFrom,
    m.messageDate,
    m.filename,
    m.contentType,
    m.size
  ])
].map(row => row.join(',')).join('\n');

fs.writeFileSync('./attachments.csv', csv);
```

### Virus Scanning

Scan attachments before downloading:

```javascript
const ClamScan = require('clamscan');

async function downloadWithVirusScan(accountId, messageId, attachmentId, outputPath) {
  // Download to temporary location
  const tempPath = `${outputPath}.tmp`;

  await downloadAttachment(accountId, messageId, attachmentId, tempPath);

  // Scan with ClamAV
  const clamscan = await new ClamScan().init();
  const { isInfected, viruses } = await clamscan.isInfected(tempPath);

  if (isInfected) {
    // Delete infected file
    fs.unlinkSync(tempPath);
    throw new Error(`Virus detected: ${viruses.join(', ')}`);
  }

  // Move to final location
  fs.renameSync(tempPath, outputPath);

  return { path: outputPath, safe: true };
}

try {
  await downloadWithVirusScan('example', 'AAAAAQAAAeE', 'AAAAAgAAAeEBAAAAAQAAAeE', './file.pdf');
  console.log('File is safe');
} catch (err) {
  console.error('Security issue:', err.message);
}
```

## Handling Attachment Size Limits

### Check Size Before Downloading

```javascript
async function downloadIfSmallEnough(accountId, messageId, attachment, maxSize, outputPath) {
  if (attachment.size > maxSize) {
    console.log(`Skipping ${attachment.filename}: too large (${attachment.size} > ${maxSize})`);
    return null;
  }

  return await downloadAttachment(accountId, messageId, attachment.id, outputPath);
}

// Download only attachments under 10MB
const MAX_SIZE = 10 * 1024 * 1024;

const message = await getMessage('example', 'AAAAAQAAAeE');

for (const attachment of message.attachments || []) {
  await downloadIfSmallEnough(
    'example',
    message.id,
    attachment,
    MAX_SIZE,
    `./downloads/${attachment.filename}`
  );
}
```

### Download with Progress

Track download progress for large files:

```javascript
async function downloadWithProgress(accountId, messageId, attachmentId, outputPath, onProgress) {
  const response = await fetch(
    `https://your-emailengine.com/v1/account/${accountId}/message/${messageId}/attachment/${attachmentId}`,
    {
      headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' }
    }
  );

  if (!response.ok) {
    throw new Error(`Download failed: ${response.statusText}`);
  }

  const totalSize = parseInt(response.headers.get('content-length'), 10);
  let downloadedSize = 0;

  const fileStream = fs.createWriteStream(outputPath);

  response.body.on('data', (chunk) => {
    downloadedSize += chunk.length;
    const progress = (downloadedSize / totalSize) * 100;

    if (onProgress) {
      onProgress(downloadedSize, totalSize, progress);
    }
  });

  return new Promise((resolve, reject) => {
    response.body.pipe(fileStream);
    response.body.on('error', reject);
    fileStream.on('finish', () => resolve({ path: outputPath, size: downloadedSize }));
    fileStream.on('error', reject);
  });
}

// Usage
await downloadWithProgress(
  'example',
  'AAAAAQAAAeE',
  'AAAAAgAAAeEBAAAAAQAAAeE',
  './large-file.zip',
  (downloaded, total, progress) => {
    console.log(`Progress: ${progress.toFixed(1)}% (${downloaded}/${total})`);
  }
);
```

## Troubleshooting

### Problem: Attachment Not Found

**Solutions:**
1. Verify message ID is correct
2. Check attachment ID is valid
3. Message might have been deleted
4. Attachment might have been removed

```javascript
async function safeDownload(accountId, messageId, attachmentId, outputPath) {
  try {
    return await downloadAttachment(accountId, messageId, attachmentId, outputPath);
  } catch (err) {
    if (err.message.includes('not found')) {
      console.log('Attachment no longer exists');
      return null;
    }
    throw err;
  }
}
```

### Problem: Download Fails Midway

**Solutions:**
1. Implement retry logic
2. Check network connectivity
3. Verify sufficient disk space
4. Check file permissions

```javascript
async function downloadWithRetry(accountId, messageId, attachmentId, outputPath, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await downloadAttachment(accountId, messageId, attachmentId, outputPath);
    } catch (err) {
      if (attempt === maxRetries) throw err;

      console.log(`Retry ${attempt}/${maxRetries} after error:`, err.message);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}
```

### Problem: Filename Encoding Issues

**Solutions:**
1. Sanitize filenames before saving
2. Use attachment ID as fallback filename
3. Convert to safe characters

```javascript
function sanitizeFilename(filename) {
  if (!filename) return `attachment-${Date.now()}`;

  return filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_') // Remove invalid chars
    .replace(/^\.+/, '_') // Remove leading dots
    .replace(/\.+$/, '_') // Remove trailing dots
    .substring(0, 255); // Limit length
}
```

### Problem: Memory Issues with Large Files

**Solutions:**
1. Use streaming instead of loading to memory
2. Process attachments one at a time
3. Implement download size limits
4. Monitor memory usage

## Best Practices

### 1. Validate Before Downloading

```javascript
function shouldDownload(attachment, options = {}) {
  // Check if already downloaded
  if (options.skipExisting && fs.existsSync(`./downloads/${attachment.filename}`)) {
    return false;
  }

  // Check size limits
  if (options.maxSize && attachment.size > options.maxSize) {
    return false;
  }

  // Check allowed types
  if (options.allowedTypes && !options.allowedTypes.some(t => attachment.contentType.includes(t))) {
    return false;
  }

  // Skip inline images
  if (options.skipInline && attachment.embedded) {
    return false;
  }

  return true;
}
```

### 2. Handle Errors Gracefully

```javascript
async function downloadSafely(accountId, messageId, attachment, outputPath) {
  try {
    const result = await downloadAttachment(
      accountId,
      messageId,
      attachment.id,
      outputPath
    );

    return { success: true, ...result };
  } catch (err) {
    console.error(`Download failed for ${attachment.filename}:`, err.message);
    return { success: false, error: err.message, filename: attachment.filename };
  }
}
```

### 3. Clean Up Temporary Files

```javascript
async function downloadAndProcess(accountId, messageId, attachmentId, processor) {
  const tempPath = `/tmp/attachment-${Date.now()}`;

  try {
    await downloadAttachment(accountId, messageId, attachmentId, tempPath);
    return await processor(tempPath);
  } finally {
    // Always clean up
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
}
```

### 4. Log Download Activity

```javascript
async function downloadWithLogging(accountId, messageId, attachment, outputPath) {
  const startTime = Date.now();

  console.log('Download started:', {
    messageId,
    filename: attachment.filename,
    size: attachment.size,
    type: attachment.contentType
  });

  try {
    const result = await downloadAttachment(accountId, messageId, attachment.id, outputPath);
    const duration = Date.now() - startTime;

    console.log('Download completed:', {
      filename: attachment.filename,
      duration,
      path: result.path
    });

    return result;
  } catch (err) {
    console.error('Download failed:', {
      filename: attachment.filename,
      error: err.message
    });
    throw err;
  }
}
```

## Utility Functions

### Format Bytes

```javascript
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

console.log(formatBytes(1234567)); // "1.18 MB"
```

### Get File Extension

```javascript
function getFileExtension(contentType) {
  const mimeMap = {
    'application/pdf': 'pdf',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'application/zip': 'zip',
    'text/plain': 'txt',
    'text/html': 'html',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx'
  };

  return mimeMap[contentType] || 'bin';
}
```

## See Also

- [Message Operations](./message-operations) - Working with messages
- [Webhooks](./webhooks) - Attachment notifications in webhooks
- [Searching](./searching) - Finding messages with attachments
- [Advanced: Pre-processing](/docs/advanced/pre-processing) - Processing attachments automatically
