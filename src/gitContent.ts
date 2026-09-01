import { spawn } from 'child_process';

export interface CancellationSignal {
    readonly isCancellationRequested: boolean;
    onCancellationRequested(listener: () => unknown): { dispose(): unknown };
}

export async function materializeGitContent(
    repositoryRoot: string,
    revision: string,
    relativePath: string,
    cancellation?: CancellationSignal
): Promise<string> {
    return new Promise((resolve, reject) => {
        const object = `${revision}:${relativePath}`;
        const child = spawn('git', ['cat-file', '--filters', object], {
            cwd: repositoryRoot,
            stdio: ['ignore', 'pipe', 'pipe']
        });

        const stdout: Buffer[] = [];
        const stderr: Buffer[] = [];
        let settled = false;

        const cancellationDisposable = cancellation?.onCancellationRequested(() => {
            child.kill();
        });

        const finish = (callback: () => void) => {
            if (settled) {
                return;
            }
            settled = true;
            cancellationDisposable?.dispose();
            callback();
        };

        child.stdout.on('data', chunk => stdout.push(Buffer.from(chunk)));
        child.stderr.on('data', chunk => stderr.push(Buffer.from(chunk)));

        child.on('error', error => finish(() => reject(error)));
        child.on('close', code => finish(() => {
            if (cancellation?.isCancellationRequested) {
                reject(new Error('Operation cancelled'));
                return;
            }

            if (code !== 0) {
                const message = Buffer.concat(stderr).toString('utf8').trim();
                reject(new Error(message || `git cat-file exited with code ${code}`));
                return;
            }

            resolve(Buffer.concat(stdout).toString('utf8'));
        }));
    });
}
