import subprocess
import sys

# Auto-accept the database migration
process = subprocess.Popen(['npm', 'run', 'db:push'], 
                          stdin=subprocess.PIPE, 
                          stdout=subprocess.PIPE, 
                          stderr=subprocess.PIPE, 
                          text=True)

# Send "1" followed by Enter to select first option
stdout, stderr = process.communicate(input='1\n')
print(stdout)
if stderr:
    print(stderr, file=sys.stderr)
