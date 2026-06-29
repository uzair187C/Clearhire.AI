const fs = require('fs');
const pdfParse = require('pdf-parse');

/**
 * Extract plain text from an uploaded file (PDF or TXT).
 */
async function extractTextFromFile(filePath, mimeType) {
  if (mimeType === 'application/pdf' || filePath.endsWith('.pdf')) {
    const buf = fs.readFileSync(filePath);
    const data = await pdfParse(buf);
    return data.text;
  }

  if (mimeType?.startsWith('text/') || filePath.endsWith('.txt')) {
    return fs.readFileSync(filePath, 'utf-8');
  }

  throw new Error(`Unsupported file type: ${mimeType || 'unknown'}`);
}

module.exports = { extractTextFromFile };
