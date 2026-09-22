const { execSync } = require('child_process');

try {
  console.log("=== TS ERRORS ===");
  execSync('npx tsc --noEmit', { stdio: 'pipe', encoding: 'utf-8' });
  console.log("No TS errors");
} catch (e) {
  console.log(e.stdout || e.message);
}

try {
  console.log("\n=== LINT ERRORS ===");
  execSync('npx eslint . --ext .ts,.tsx --format json', { stdio: 'pipe', encoding: 'utf-8' });
  console.log("No Lint errors");
} catch (e) {
  try {
    const data = JSON.parse(e.stdout);
    data.filter(x => x.errorCount > 0).forEach(x => {
      console.log(`\nFile: ${x.filePath}`);
      x.messages.filter(m => m.severity === 2).forEach(m => {
        console.log(`Line ${m.line}: ${m.message} (${m.ruleId})`);
      });
    });
  } catch (err) {
    console.log(e.stdout || e.message);
  }
}
