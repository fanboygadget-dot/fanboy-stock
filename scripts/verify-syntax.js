// Ad-hoc syntax + symbol checker for the Fanboy Stock web app.
// No Apps Script runtime locally, so we:
//  1. Extract <script> blocks from Page.html and node --check them (syntax).
//  2. Flag duplicate top-level function names in Page.html (silent shadow bug).
//  3. Grep Code.gs for the symbols we expect to exist.
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const repo = process.argv[2] || '.';
const pageHtml = path.join(repo, 'Page.html');
const codeGs = path.join(repo, 'Code.gs');

let problems = 0;

function extractScripts(html) {
  const re = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    // skip external src scripts
    if (/src=/.test(m[0].slice(0, 40))) continue;
    out.push(m[1]);
  }
  return out;
}

if (fs.existsSync(pageHtml)) {
  const html = fs.readFileSync(pageHtml, 'utf8');
  const scripts = extractScripts(html);
  console.log(`Page.html: ${scripts.length} inline script block(s).`);
  scripts.forEach((src, i) => {
    const tmp = path.join('/tmp', `page_script_${i}.js`);
    fs.writeFileSync(tmp, src);
    try {
      execSync(`node --check ${tmp}`, { stdio: 'pipe' });
      console.log(`  script[${i}] syntax OK (${src.length} chars)`);
    } catch (e) {
      problems++;
      console.log(`  script[${i}] SYNTAX ERROR:\n${e.stderr.toString()}`);
    }
  });

  // duplicate top-level function names
  const fnameRe = /function\s+([A-Za-z_$][\w$]*)\s*\(/g;
  const counts = {};
  let fm;
  while ((fm = fnameRe.exec(html)) !== null) {
    counts[fm[1]] = (counts[fm[1]] || 0) + 1;
  }
  const dups = Object.keys(counts).filter(k => counts[k] > 1);
  if (dups.length) {
    problems++;
    console.log('DUPLICATE top-level functions in Page.html: ' + dups.join(', '));
  } else {
    console.log('No duplicate top-level functions in Page.html.');
  }
} else {
  console.log('Page.html not found.');
}

if (fs.existsSync(codeGs)) {
  const gs = fs.readFileSync(codeGs, 'utf8');
  ['function returnStok', 'function batchReturnStok', 'function getReturnStokLog',
   'LOG_RETURN_HEADER', 'function getDashboardStats'].forEach(sym => {
    if (gs.indexOf(sym) === -1) {
      problems++;
      console.log('MISSING in Code.gs: ' + sym);
    }
  });
  if (gs.indexOf('LOG_RETURN_HEADER') !== -1) console.log('Code.gs: LOG_RETURN_HEADER present.');
}

console.log(problems ? `\nDONE WITH ${problems} problem(s).` : '\nDONE — no problems found.');
process.exit(problems ? 1 : 0);
