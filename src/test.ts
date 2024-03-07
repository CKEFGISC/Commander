import { spawn } from 'child_process';

function runCommand(command: string, args: string[]) {
    const child = spawn(command, args, { shell: true });

    child.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    child.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    child.on('error', (err) => {
        console.error(err);
    });

    child.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });
}

// Example usage:
runCommand('dir', []);
