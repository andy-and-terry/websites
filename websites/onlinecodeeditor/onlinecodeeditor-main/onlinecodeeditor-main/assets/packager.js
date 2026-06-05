// packager.js – Mini Scratch ZIP packager
// Deobfuscated and rewritten from original

import { ZipWriter } from './jszip-mini.js';

const SB3_NOTE = `SB3 Packaging – Placeholder
===========================

The file(s) listed below are Scratch / TurboWarp project files (.sb3).
They have been included in this ZIP as raw binary data.

To produce a fully self-contained, runnable HTML from a .sb3 file you need
one of the following (future integration steps):

  Option A – TurboWarp Packager web app
    Visit https://packager.turbowarp.org/, upload your .sb3, and
    download the packaged HTML or ZIP.

  Option B – Self-hosted TurboWarp Packager API
    Integrate @turbowarp/packager (npm) into a Node.js build step
    and call it programmatically.

  Option C – postMessage integration (editor roadmap)
    When the block editor is wired up via postMessage, the editor
    will be able to request an export from TurboWarp and forward the
    result to this packager automatically.

`;

/**
 * Package all open files into a downloadable ZIP.
 * @param {Map<string, {content: string|Uint8Array, isBinary: boolean}>} files
 * @param {string} [zipName] - output filename
 */
export async function packageProject(files, zipName = 'project.zip') {
  const zip = new ZipWriter();
  let hasSb3 = false;
  let hasIndexHtml = false;
  const sb3Files = [];

  for (const [name, file] of files) {
    const content = file.content;
    const nameLower = name.toLowerCase();

    if (nameLower === 'index.html') hasIndexHtml = true;

    if (nameLower.endsWith('.sb3')) {
      hasSb3 = true;
      sb3Files.push(name);
      const bytes = content instanceof Uint8Array
        ? content
        : new TextEncoder().encode(content);
      zip.addFile(name, bytes);
    } else {
      if (content instanceof Uint8Array) {
        zip.addFile(name, content);
      } else {
        zip.addFile(name, String(content));
      }
    }
  }

  // If there's no index.html, generate a launcher page listing all files
  if (!hasIndexHtml) {
    zip.addFile('index.html', generateLauncher([...files.keys()]));
  }

  // If .sb3 files were included, add a README explaining next steps
  if (hasSb3) {
    const readmeContent =
      SB3_NOTE +
      'Included .sb3 file(s):\n' +
      sb3Files.map(f => '  - ' + f).join('\n') + '\n';
    zip.addFile('README_SB3.txt', readmeContent);
  }

  zip.download(zipName);
}

function generateLauncher(fileNames) {
  const items = fileNames
    .map(name => `<li><a href="${escHtml(name)}">${escHtml(name)}</a></li>`)
    .join('\n    ');
  return (
    `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8" />\n` +
    `  <title>Packaged Project</title>\n  <style>\n` +
    `    body { font-family: system-ui, sans-serif; max-width: 600px; margin: 40px auto; padding: 0 16px; }\n` +
    `  </style>\n</head>\n<body>\n  <h1>Packaged Project</h1>\n` +
    `  <p>This ZIP was exported from the Mini Scratch editor. Open one of the files below:</p>\n` +
    `  <ul>\n    ${items}\n  </ul>\n</body>\n</html>`
  );
}

function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
