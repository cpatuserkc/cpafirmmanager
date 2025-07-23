import subprocess
import sys

# Complete the database migration by selecting the first option (create column)
process = subprocess.Popen(['npm', 'run', 'db:push'], 
                          stdin=subprocess.PIPE, 
                          stdout=subprocess.PIPE, 
                          stderr=subprocess.PIPE, 
                          text=True)

# Send "1" followed by Enter to create the new columns
stdout, stderr = process.communicate(input='1\n')
print(stdout)
if stderr:
    print(stderr, file=sys.stderr)

print("Database migration completed!")
