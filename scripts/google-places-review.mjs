// Load optional .env.local in Node, then pass inherited secrets to the Python CLI.
// This administrator command is never bundled in the browser or invoked by a public route.
import { spawnSync } from 'node:child_process';
const result = spawnSync('python3', ['scripts/google_places_review.py', ...process.argv.slice(2)], {
  stdio: 'inherit',
});
if (result.error) {
  process.stderr.write('Python review process could not start. Install Python 3.\n');
}
process.exitCode = result.status ?? 1;
