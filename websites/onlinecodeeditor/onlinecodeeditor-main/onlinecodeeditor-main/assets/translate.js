// translate.js – Mini Scratch code translator
// Deobfuscated and rewritten from original

export function translate(fromLang, toLang, code) {
  if (fromLang === toLang) return { ok: true, output: code };

  if (fromLang === 'js' && toLang === 'html')
    return { ok: true, output: jsToHtml(code) };

  if (fromLang === 'html' && toLang === 'js')
    return htmlToJs(code);

  if (fromLang === 'blocks' && toLang === 'js')
    return {
      ok: false,
      error:
        'Blocks → JavaScript conversion requires a self-hosted Scratch VM ' +
        'with code-generation support, which is not yet integrated. ' +
        'You can delete the current code and start fresh, or cancel.',
    };

  if (fromLang === 'js' && toLang === 'blocks')
    return {
      ok: false,
      error:
        'JavaScript → Scratch blocks is not supported. ' +
        'Scratch blocks represent a visual, event-driven paradigm that cannot ' +
        'be automatically generated from JS. ' +
        'You can delete the current code and start fresh, or cancel the operation.',
    };

  if (fromLang === 'vbs' || toLang === 'vbs')
    return {
      ok: false,
      error:
        `${toLang === 'vbs' ? fromLang : toLang} translation is not supported. ` +
        'You can delete the current code or cancel the operation.',
    };

  const fromLabel = languageLabel(fromLang);
  const toLabel   = languageLabel(toLang);
  return {
    ok: false,
    error: `${fromLabel} → ${toLabel} translation is not supported. You can delete the current code and start fresh, or cancel the operation.`,
  };
}

const SCRIPT_INDENT = 2; // spaces to indent JS inside <script> tag

function jsToHtml(js) {
  return (
    '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8" />\n  <title>My Project</title>\n</head>\n<body>\n\n<script>\n' +
    indent(js, SCRIPT_INDENT) +
    '\n  </script>\n</body>\n</html>'
  );
}

function htmlToJs(html) {
  const match = html.match(/<script(?:\s[^>]*)?>([^]*?)<\/script[^>]*>/i);
  if (!match)
    return {
      ok: false,
      error: 'No <script> block was found in the HTML source. You can delete the current code and start fresh in JS, or cancel.',
    };
  return { ok: true, output: match[1].trim() };
}

function indent(code, spaces) {
  const pad = ' '.repeat(spaces);
  return code.split('\n').map(line => pad + line).join('\n');
}

function languageLabel(lang) {
  const labels = {
    js: 'JavaScript',
    html: 'HTML',
    blocks: 'Scratch Blocks',
    vbs: 'VBScript',
    text: 'Plain Text',
  };
  return labels[lang] || lang;
}
