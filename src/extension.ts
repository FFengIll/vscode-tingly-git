import * as vscode from 'vscode';
import simpleGit, { SimpleGit } from 'simple-git';

let git: SimpleGit;

export function activate(context: vscode.ExtensionContext) {
    console.log('Tingly Git extension is now active!');

    // Initialize git for the workspace folder
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        git = simpleGit(workspaceFolders[0].uri.fsPath);
    } else {
        vscode.window.showErrorMessage('No workspace folder found');
        return;
    }

    // Register all Git commands
    const commands = [
        vscode.commands.registerCommand('tingly-git.init', gitInit),
        vscode.commands.registerCommand('tingly-git.addOrigin', gitAddOrigin),
        vscode.commands.registerCommand('tingly-git.addRemote', gitAddRemote),
        vscode.commands.registerCommand('tingly-git.addFile', (resource) => gitAddFile(resource)),
        vscode.commands.registerCommand('tingly-git.addAll', gitAddAll),
        vscode.commands.registerCommand('tingly-git.commit', gitCommit),
        vscode.commands.registerCommand('tingly-git.pull', gitPull),
        vscode.commands.registerCommand('tingly-git.push', gitPush),
        vscode.commands.registerCommand('tingly-git.pushToRemote', gitPushToRemote),
        vscode.commands.registerCommand('tingly-git.status', gitStatus),
        vscode.commands.registerCommand('tingly-git.createBranch', gitCreateBranch),
        vscode.commands.registerCommand('tingly-git.checkoutBranch', gitCheckoutBranch),
        vscode.commands.registerCommand('tingly-git.logAll', gitLogAll),
        vscode.commands.registerCommand('tingly-git.logCurrentFile', () => gitLogCurrentFile())
    ];

    commands.forEach(command => context.subscriptions.push(command));
}

async function gitInit() {
    try {
        await git.init();
        vscode.window.showInformationMessage('Git repository initialized successfully!');
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to initialize git repository: ${error.message}`);
    }
}

async function gitAddOrigin() {
    const url = await vscode.window.showInputBox({
        prompt: 'Enter the origin repository URL',
        placeHolder: 'https://github.com/username/repository.git'
    });

    if (url) {
        try {
            await git.addRemote('origin', url);
            vscode.window.showInformationMessage(`Origin added: ${url}`);
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to add origin: ${error.message}`);
        }
    }
}

async function gitAddRemote() {
    const name = await vscode.window.showInputBox({
        prompt: 'Enter the remote name',
        placeHolder: 'upstream'
    });

    if (!name) { return; }

    const url = await vscode.window.showInputBox({
        prompt: 'Enter the remote repository URL',
        placeHolder: 'https://github.com/username/repository.git'
    });

    if (url) {
        try {
            await git.addRemote(name, url);
            vscode.window.showInformationMessage(`Remote '${name}' added: ${url}`);
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to add remote '${name}': ${error.message}`);
        }
    }
}

async function gitAddFile(resource?: vscode.Uri) {
    let filePath: string | undefined;
    let source = '';

    if (resource) {
        // Called from context menu (explorer, editor, or tab)
        filePath = resource.fsPath;
        source = 'context menu';
        console.log(`Adding file from ${source}: ${filePath}`);
    } else if (vscode.window.activeTextEditor) {
        // Called from command palette with active file
        filePath = vscode.window.activeTextEditor.document.uri.fsPath;
        source = 'command palette';
        console.log(`Adding active file from ${source}: ${filePath}`);
    } else {
        vscode.window.showWarningMessage('No file selected');
        return;
    }

    if (!filePath) {
        console.log('No file path found');
        return;
    }

    // Check if it's a directory
    try {
        const stats = await vscode.workspace.fs.stat(resource || vscode.Uri.file(filePath));
        if (stats.type === vscode.FileType.Directory) {
            source = source ? `${source} (directory)` : 'directory';
            console.log(`Adding directory from ${source}: ${filePath}`);
        }
    } catch (error) {
        // File might not exist, continue with add operation
    }

    try {
        // Check if file is ignored by .gitignore
        await checkGitIgnore(filePath);

        await git.add(filePath);
        const fileName = filePath.split('/').pop() || filePath;
        const fileType = (await vscode.workspace.fs.stat(vscode.Uri.file(filePath))).type === vscode.FileType.Directory ? 'directory' : 'file';
        vscode.window.showInformationMessage(`Added ${fileType}: ${fileName}`);
        console.log(`Successfully added ${fileType} from ${source}: ${fileName}`);
    } catch (error: any) {
        console.error(`Failed to add ${filePath}:`, error);
        vscode.window.showErrorMessage(`Failed to add file: ${error.message}`);
    }
}

async function gitAddAll() {
    try {
        const status = await git.status();
        if (status.modified.length === 0 && status.not_added.length === 0) {
            vscode.window.showInformationMessage('No changes to add');
            return;
        }

        await git.add(['.']);
        vscode.window.showInformationMessage('All modified files added to staging area');
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to add all files: ${error.message}`);
    }
}

async function gitCommit() {
    const message = await vscode.window.showInputBox({
        prompt: 'Enter commit message',
        placeHolder: 'Your commit message'
    });

    if (!message) {
        vscode.window.showWarningMessage('Commit message is required');
        return;
    }

    try {
        await git.commit(message);
        vscode.window.showInformationMessage(`Committed: ${message}`);
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to commit: ${error.message}`);
    }
}

async function gitPull() {
    try {
        await git.pull('origin', 'HEAD');
        vscode.window.showInformationMessage('Pulled from origin successfully');
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to pull from origin: ${error.message}`);
    }
}

async function gitPush() {
    try {
        const status = await git.status();
        const currentBranch = status.current || 'main';
        await git.push('origin', currentBranch);
        vscode.window.showInformationMessage(`Pushed to origin/${currentBranch}`);
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to push to origin: ${error.message}`);
    }
}

async function gitPushToRemote() {
    try {
        const remotes = await git.getRemotes(true);
        if (remotes.length === 0) {
            vscode.window.showWarningMessage('No remotes found');
            return;
        }

        const remoteNames = remotes.map(r => r.name);
        const selectedRemote = await vscode.window.showQuickPick(remoteNames, {
            placeHolder: 'Select remote to push to'
        });

        if (!selectedRemote) return;

        const status = await git.status();
        const currentBranch = status.current || 'main';
        await git.push(selectedRemote, currentBranch);
        vscode.window.showInformationMessage(`Pushed to ${selectedRemote}/${currentBranch}`);
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to push: ${error.message}`);
    }
}

async function gitStatus() {
    try {
        const status = await git.status();
        const output = [
            `Current branch: ${status.current}`,
            `Modified: ${status.modified.length} files`,
            `Added: ${status.created.length} files`,
            `Deleted: ${status.deleted.length} files`,
            `Untracked: ${status.not_added.length} files`,
            '',
            'Modified files:',
            ...status.modified.map((f: string) => `  - ${f}`),
            '',
            'Untracked files:',
            ...status.not_added.map((f: string) => `  - ${f}`)
        ].filter(line => line).join('\n');

        const doc = await vscode.workspace.openTextDocument({ content: output, language: 'plaintext' });
        await vscode.window.showTextDocument(doc);
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to get status: ${error.message}`);
    }
}

async function gitCreateBranch() {
    const branchName = await vscode.window.showInputBox({
        prompt: 'Enter new branch name',
        placeHolder: 'feature/new-feature'
    });

    if (!branchName) return;

    try {
        await git.checkoutLocalBranch(branchName);
        vscode.window.showInformationMessage(`Created and switched to branch: ${branchName}`);
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to create branch: ${error.message}`);
    }
}

async function gitCheckoutBranch() {
    try {
        const branches = await git.branchLocal();
        const allBranches = [...branches.all];

        const selectedBranch = await vscode.window.showQuickPick(allBranches, {
            placeHolder: 'Select branch to checkout'
        });

        if (!selectedBranch) return;

        await git.checkout(selectedBranch);
        vscode.window.showInformationMessage(`Switched to branch: ${selectedBranch}`);
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to checkout branch: ${error.message}`);
    }
}

async function gitLogAll() {
    try {
        const log = await git.log({ maxCount: 20 });
        const output = log.all.map(commit =>
            `Commit: ${commit.hash}\nAuthor: ${commit.author_name}\nDate: ${commit.date}\n\n${commit.message}\n${'='.repeat(50)}`
        ).join('\n\n');

        const doc = await vscode.workspace.openTextDocument({ content: output, language: 'plaintext' });
        await vscode.window.showTextDocument(doc);
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to get git log: ${error.message}`);
    }
}

async function gitLogCurrentFile() {
    let filePath: string | undefined;

    if (vscode.window.activeTextEditor) {
        filePath = vscode.window.activeTextEditor.document.uri.fsPath;
    } else {
        vscode.window.showWarningMessage('No active file');
        return;
    }

    try {
        const relativePath = git.raw(['ls-files', '--full-name', filePath!]);
        const log = await git.log({ file: await relativePath, maxCount: 10 });

        if (log.total === 0) {
            vscode.window.showInformationMessage('No commits found for this file');
            return;
        }

        const output = log.all.map(commit =>
            `Commit: ${commit.hash}\nAuthor: ${commit.author_name}\nDate: ${commit.date}\n\n${commit.message}\n${'='.repeat(50)}`
        ).join('\n\n');

        const doc = await vscode.workspace.openTextDocument({ content: output, language: 'plaintext' });
        await vscode.window.showTextDocument(doc);
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to get file git log: ${error.message}`);
    }
}

async function checkGitIgnore(filePath: string): Promise<void> {
    try {
        // Check if file is ignored
        const isIgnored = await git.raw(['check-ignore', filePath]);

        if (isIgnored) {
            const fileName = filePath.split('/').pop() || filePath;
            const action = await vscode.window.showWarningMessage(
                `File "${fileName}" is ignored by .gitignore. Do you want to force add it?`,
                'Force Add',
                'Cancel'
            );

            if (action === 'Force Add') {
                await git.raw(['add', '-f', filePath]);
                vscode.window.showInformationMessage(`Force added: ${fileName}`);
            }

            throw new Error('File is ignored by .gitignore');
        }
    } catch (error: any) {
        if (!error.message.includes('ignored by .gitignore')) {
            // check-ignore returns exit code 1 when file is not ignored
            // This is expected behavior, so we ignore this error
            return;
        }
        throw error;
    }
}

export function deactivate() { }