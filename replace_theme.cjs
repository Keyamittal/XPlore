const fs = require('fs');
const path = require('path');

const directories = ['src/pages', 'src/components'];

const replacements = [
  [/neon-/g, 'pastel-'],
  [/bg-gray-800/g, 'bg-white'],
  [/bg-gray-900/g, 'bg-slate-50'],
  [/text-white/g, 'text-slate-800'],
  [/text-gray-400/g, 'text-slate-500'],
  [/text-gray-300/g, 'text-slate-600'],
  [/text-gray-500/g, 'text-slate-400'],
  [/border-gray-700/g, 'border-slate-200'],
  [/border-gray-600/g, 'border-slate-300'],
  [/border-white\/20/g, 'border-slate-200'],
  [/shadow-\[0_0_15px_#00ffff_inset\]/g, 'shadow-sm'],
  [/shadow-\[0_0_10px_#ff00ff,inset_0_0_10px_#ff00ff\]/g, 'shadow-sm'],
  [/shadow-\[0_0_15px_rgba\(0,255,255,0.4\)\]/g, 'shadow-sm'],
  [/shadow-\[0_0_15px_rgba\(255,0,255,0.4\)\]/g, 'shadow-sm'],
  [/bg-black\/40/g, 'bg-slate-50'],
  [/text-black/g, 'text-white']
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      // Skip Sidebar as it was already modified
      if (file === 'Sidebar.tsx') continue;
      
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      
      for (const [pattern, replacement] of replacements) {
        content = content.replace(pattern, replacement);
      }
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

directories.forEach(processDirectory);
console.log('Theme replacement complete.');
