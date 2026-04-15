/**
 * Clears Expo and Metro caches to resolve stale bundle or module resolution issues.
 * Run with: npm run reset-project
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const cacheDirs = [
  path.join(root, '.expo', 'web'),
  path.join(root, 'node_modules', '.cache'),
];

console.log('🧹 Clearing project caches...\n');

for (const dir of cacheDirs) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`  Removed: ${path.relative(root, dir)}`);
  }
}

console.log('\n📦 Reinstalling dependencies...\n');
try {
  execSync('npm install', { cwd: root, stdio: 'inherit' });
} catch {
  console.error('npm install failed — run it manually.');
  process.exit(1);
}

console.log('\n✅ Done. Start the dev server with: npm start\n');
