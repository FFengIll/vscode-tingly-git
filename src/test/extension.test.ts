import * as assert from 'assert';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';
import { getRepositoryRelativePath, getWorkingTreeUri } from '../lfsDiffCommand';
import { decodeLfsDiffUri, encodeLfsDiffUri } from '../lfsDiffContentProvider';
import { materializeGitContent } from '../gitContent';

const execFileAsync = promisify(execFile);

suite('Extension Test Suite', () => {
    test('LFS diff URI round trips paths with spaces and Unicode', () => {
        const document = {
            repositoryRoot: '/tmp/repo with spaces',
            revision: 'HEAD',
            relativePath: '数据/file name.jsonl'
        };

        const uri = encodeLfsDiffUri(document);

        assert.strictEqual(uri.scheme, 'lfs-diff');
        assert.deepStrictEqual(decodeLfsDiffUri(uri), document);
    });

    test('LFS diff URI rejects malformed payloads', () => {
        const uri = vscode.Uri.from({ scheme: 'lfs-diff', path: '/file.txt', query: '%7Bbad' });
        assert.throws(() => decodeLfsDiffUri(uri), /Invalid LFS diff URI/);
    });

    test('recovers the working-tree file from an open Git diff', () => {
        const filePath = path.join(os.tmpdir(), 'repository', 'file name.jsonl');
        const gitUri = vscode.Uri.file(filePath).with({
            scheme: 'git',
            query: JSON.stringify({ path: filePath, ref: 'HEAD' })
        });

        assert.strictEqual(getWorkingTreeUri(gitUri).fsPath, filePath);
    });

    test('recovers the working-tree file from an existing LFS diff', () => {
        const repositoryRoot = path.join(os.tmpdir(), 'repository');
        const uri = encodeLfsDiffUri({
            repositoryRoot,
            revision: 'HEAD',
            relativePath: 'dir/file.jsonl'
        });

        assert.strictEqual(
            getWorkingTreeUri(uri).fsPath,
            path.join(repositoryRoot, 'dir', 'file.jsonl')
        );
    });

    test('repository-relative paths use Git separators and reject escapes', () => {
        const repositoryRoot = path.resolve(os.tmpdir(), 'repository');
        const nestedFile = path.join(repositoryRoot, 'dir', 'file.txt');

        assert.strictEqual(getRepositoryRelativePath(repositoryRoot, nestedFile), 'dir/file.txt');
        assert.throws(
            () => getRepositoryRelativePath(repositoryRoot, path.resolve(repositoryRoot, '..', 'file.txt')),
            /outside the Git repository/
        );
    });

    test('materializes historical content through Git filters', async () => {
        const repositoryRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'tingly-git-filter-'));
        const filterScript = path.join(repositoryRoot, 'smudge.js');

        try {
            await execFileAsync('git', ['init', '--quiet'], { cwd: repositoryRoot });
            await execFileAsync('git', ['config', 'user.email', 'test@example.com'], { cwd: repositoryRoot });
            await execFileAsync('git', ['config', 'user.name', 'Tingly Git Test'], { cwd: repositoryRoot });
            await fs.writeFile(
                filterScript,
                "process.stdin.setEncoding('utf8'); let input = ''; process.stdin.on('data', chunk => input += chunk); process.stdin.on('end', () => process.stdout.write(input.replace('pointer', 'materialized')));\n"
            );
            await execFileAsync('git', ['config', 'filter.test.smudge', `node ${JSON.stringify(filterScript)}`], { cwd: repositoryRoot });
            await execFileAsync('git', ['config', 'filter.test.clean', 'cat'], { cwd: repositoryRoot });
            await fs.writeFile(path.join(repositoryRoot, '.gitattributes'), '*.data filter=test\n');
            await fs.writeFile(path.join(repositoryRoot, 'sample.data'), 'pointer\n');
            await execFileAsync('git', ['add', '.gitattributes', 'sample.data'], { cwd: repositoryRoot });
            await execFileAsync('git', ['commit', '--quiet', '-m', 'fixture'], { cwd: repositoryRoot });

            const content = await materializeGitContent(repositoryRoot, 'HEAD', 'sample.data');

            assert.strictEqual(content, 'materialized\n');
        } finally {
            await fs.rm(repositoryRoot, { recursive: true, force: true });
        }
    });

    test('reports Git errors when historical content is unavailable', async () => {
        const repositoryRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'tingly-git-missing-'));

        try {
            await execFileAsync('git', ['init', '--quiet'], { cwd: repositoryRoot });
            await assert.rejects(
                materializeGitContent(repositoryRoot, 'HEAD', 'missing.txt'),
                /Not a valid object name|invalid object name|does not exist/
            );
        } finally {
            await fs.rm(repositoryRoot, { recursive: true, force: true });
        }
    });
});
