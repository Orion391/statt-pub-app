import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();

function findAllTSFiles(dir: string, files: string[] = []) {
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    if (fs.statSync(fullPath).isDirectory()) {
      findAllTSFiles(fullPath, files);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

function refactorFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const updated = content.replace(/\bany\b/g, 'unknown');
  if (updated !== content) {
    fs.writeFileSync(filePath, updated, 'utf-8');
    console.log(`✔ Refactored: ${filePath}`);
  }
}

const allTSFiles = findAllTSFiles(projectRoot);
for (const file of allTSFiles) {
  refactorFile(file);
}

console.log('\n✅ Refactor completato.');