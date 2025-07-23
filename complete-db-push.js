const { spawn } = require('child_process');

const child = spawn('npm', ['run', 'db:push'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Send "1" to select the first option (create column)
child.stdin.write('1\n');
child.stdin.end();

child.stdout.on('data', (data) => {
  console.log(data.toString());
});

child.stderr.on('data', (data) => {
  console.error(data.toString());
});

child.on('close', (code) => {
  console.log(`Database push completed with code ${code}`);
  process.exit(code);
});