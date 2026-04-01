import * as vscode from 'vscode';
import simpleGit, { SimpleGit } from 'simple-git';
import { githubTemplates, GITHUB_GITIGNORE_BASE_URL, GitignoreTemplate } from './githubTemplates';
import { licenseTemplates, LICENSE_TEMPLATES_BASE_URL, LicenseTemplate } from './licenseTemplates';
import { StagedFilesCompletionProvider } from './completionProvider';
let git: SimpleGit;
let extensionUri: vscode.Uri;

export function activate(context: vscode.ExtensionContext) {
    console.log('Tingly Git extension is now active!');
    extensionUri = context.extensionUri;

    // Initialize git for the workspace folder
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        git = simpleGit(workspaceFolders[0].uri.fsPath);
    } else {
        vscode.window.showErrorMessage('No workspace folder found');
        return;
    }

    // Register staged files completion provider for SCM input
    const completionProvider = new StagedFilesCompletionProvider(git);
    const completionDisposable = vscode.languages.registerCompletionItemProvider(
        { language: 'scminput' },
        completionProvider
        // No trigger characters - allow manual trigger anytime
    );
    context.subscriptions.push(completionDisposable);

    // Register all Git commands
    const commands = [
        vscode.commands.registerCommand('tingly-git.addFile', (resource) => gitAddFile(resource)),
        vscode.commands.registerCommand('tingly-git.addRemote', gitAddRemote),
        vscode.commands.registerCommand('tingly-git.logCurrentFile', () => gitLogCurrentFile()),
        vscode.commands.registerCommand('tingly-git.gitignore', gitignore),
        vscode.commands.registerCommand('tingly-git.license', license)
    ];

    commands.forEach(command => context.subscriptions.push(command));
}

async function gitAddRemote() {
    const name = await vscode.window.showInputBox({
        prompt: 'Enter the remote name (leave empty for "origin")',
        placeHolder: 'origin'
    });

    if (!name) {
        // User cancelled or wants origin
        return;
    }

    const remoteName = name.trim() || 'origin';

    const url = await vscode.window.showInputBox({
        prompt: `Enter the URL for remote "${remoteName}"`,
        placeHolder: 'https://github.com/username/repository.git'
    });

    if (url) {
        try {
            await git.addRemote(remoteName, url);
            vscode.window.showInformationMessage(`Remote '${remoteName}' added: ${url}`);
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to add remote '${remoteName}': ${error.message}`);
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
    } else {
        // Try to get selected resource from explorer using clipboard trick
        // Save current clipboard content
        const originalClipboard = await vscode.env.clipboard.readText();

        // Copy the path of selected explorer item
        await vscode.commands.executeCommand('copyFilePath');
        const copiedPath = await vscode.env.clipboard.readText();

        // Restore original clipboard content
        if (originalClipboard) {
            await vscode.env.clipboard.writeText(originalClipboard);
        }

        if (copiedPath && copiedPath !== originalClipboard) {
            // Got path from explorer selection
            filePath = copiedPath;
            source = 'explorer selection';
            console.log(`Adding from ${source}: ${filePath}`);
        } else if (vscode.window.activeTextEditor) {
            // Fallback to active editor
            filePath = vscode.window.activeTextEditor.document.uri.fsPath;
            source = 'active editor';
            console.log(`Adding active file from ${source}: ${filePath}`);
        } else {
            vscode.window.showWarningMessage('No file selected. Use right-click context menu or open a file in the editor.');
            return;
        }
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
        // Check if file is ignored by .gitignore (returns true if force added)
        const wasForceAdded = await checkGitIgnore(filePath);

        // Only add if not already force-added
        if (!wasForceAdded) {
            await git.add(filePath);
        }
        const fileName = filePath.split('/').pop() || filePath;
        const fileType = (await vscode.workspace.fs.stat(vscode.Uri.file(filePath))).type === vscode.FileType.Directory ? 'directory' : 'file';
        vscode.window.showInformationMessage(`Added ${fileType}: ${fileName}`);
        console.log(`Successfully added ${fileType} from ${source}: ${fileName}`);
    } catch (error: any) {
        console.error(`Failed to add ${filePath}:`, error);
        vscode.window.showErrorMessage(`Failed to add file: ${error.message}`);
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

async function checkGitIgnore(filePath: string): Promise<boolean> {
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
                return true; // File was force added
            }

            throw new Error('File is ignored by .gitignore');
        }
    } catch (error: any) {
        if (!error.message.includes('ignored by .gitignore')) {
            // check-ignore returns exit code 1 when file is not ignored
            // This is expected behavior, so we ignore this error
            return false;
        }
        throw error;
    }
    return false;
}

async function gitignore() {
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder found');
            return;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const gitignorePath = `${workspaceRoot}/.gitignore`;

        // Check if .gitignore exists, create if not
        try {
            await vscode.workspace.fs.stat(vscode.Uri.file(gitignorePath));
        } catch {
            // File doesn't exist
            const createAction = await vscode.window.showInformationMessage(
                '.gitignore file not found. Create one?',
                'Create',
                'Cancel'
            );

            if (createAction !== 'Create') {
                return;
            }

            try {
                await vscode.workspace.fs.writeFile(
                    vscode.Uri.file(gitignorePath),
                    new TextEncoder().encode('# Git ignore file\n')
                );
                vscode.window.showInformationMessage('.gitignore file created successfully!');
            } catch (error: any) {
                vscode.window.showErrorMessage(`Failed to create .gitignore: ${error.message}`);
                return;
            }
        }

        // Show action menu
        const action = await vscode.window.showQuickPick([
            'Add template from collection',
            'View current .gitignore',
            'Edit .gitignore'
        ], {
            placeHolder: 'Select an action for .gitignore'
        });

        if (!action) return;

        switch (action) {
            case 'Add template from collection':
                await addGitignoreTemplate(gitignorePath);
                break;
            case 'View current .gitignore':
                await viewGitignore(gitignorePath);
                break;
            case 'Edit .gitignore':
                await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(gitignorePath));
                break;
        }
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to manage .gitignore: ${error.message}`);
    }
}

async function addGitignoreTemplate(gitignorePath: string) {
    try {
        type QuickPickItem = vscode.QuickPickItem & { template?: GitignoreTemplate };

        // Show quick-pick with common gitignore templates from GitHub
        const quickPickItems: QuickPickItem[] = githubTemplates.map(t => ({
            label: t.name,
            description: `https://github.com/github/gitignore/blob/main/${t.filename}`,
            template: t
        }));

        // Add option to browse all templates on GitHub
        quickPickItems.push({
            label: 'Browse all templates on GitHub...',
            description: 'Open github/gitignore repository in browser'
        });

        const selected = await vscode.window.showQuickPick(quickPickItems, {
            placeHolder: 'Select a gitignore template from GitHub\'s collection',
            canPickMany: true
        });

        if (!selected || selected.length === 0) {
            return;
        }

        // Check if user selected the browse option
        const browseItem = selected.find(s => !s.template);
        if (browseItem) {
            vscode.env.openExternal(vscode.Uri.parse('https://github.com/github/gitignore'));
            // If only browse was selected, return
            if (selected.length === 1) {
                return;
            }
        }

        // Filter out the browse item and get selected templates
        const selectedTemplates = selected
            .filter(s => s.template)
            .map(s => s.template!);

        if (selectedTemplates.length === 0) {
            return;
        }

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Fetching ${selectedTemplates.length} gitignore template(s) from GitHub...`,
            cancellable: false
        }, async () => {
            let combinedContent = '';

            for (const tmpl of selectedTemplates) {
                const templateUrl = `${GITHUB_GITIGNORE_BASE_URL}/${tmpl.filename}`;
                const response = await fetch(templateUrl);
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${tmpl.name}: HTTP ${response.status}`);
                }
                const content = await response.text();
                combinedContent += `\n# From GitHub/gitignore: ${tmpl.filename}\n`;
                combinedContent += content + '\n';
            }

            // Read existing gitignore content
            let existingContent = '';
            try {
                const existingData = await vscode.workspace.fs.readFile(vscode.Uri.file(gitignorePath));
                existingContent = new TextDecoder().decode(existingData);
            } catch {
                // File doesn't exist or can't be read
            }

            // Combine existing content with new templates
            let newContent = existingContent.trim();
            if (newContent && !newContent.endsWith('\n')) {
                newContent += '\n';
            }
            newContent += '\n# Added by Tingly Git extension - ' + new Date().toISOString().split('T')[0] + '\n';
            newContent += `# Source: https://github.com/github/gitignore\n`;
            newContent += combinedContent;

            // Write the updated content
            await vscode.workspace.fs.writeFile(
                vscode.Uri.file(gitignorePath),
                new TextEncoder().encode(newContent)
            );

            vscode.window.showInformationMessage(
                `Successfully added ${selectedTemplates.length} gitignore template(s) from GitHub`
            );
        });

    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to add gitignore template: ${error.message}`);
    }
}

async function viewGitignore(gitignorePath: string) {
    try {
        const gitignoreUri = vscode.Uri.file(gitignorePath);
        await vscode.commands.executeCommand('vscode.open', gitignoreUri);
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to open .gitignore: ${error.message}`);
    }
}

async function license() {
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder found');
            return;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const licensePath = `${workspaceRoot}/LICENSE`;

        // Check if LICENSE already exists
        try {
            await vscode.workspace.fs.stat(vscode.Uri.file(licensePath));
            // File exists - ask what to do
            const action = await vscode.window.showWarningMessage(
                'LICENSE file already exists. What would you like to do?',
                'Overwrite',
                'View',
                'Cancel'
            );

            if (action === 'View') {
                await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(licensePath));
                return;
            }

            if (action !== 'Overwrite') {
                return;
            }
        } catch {
            // File doesn't exist - proceed to template selection
        }

        type QuickPickItem = vscode.QuickPickItem & { template?: LicenseTemplate };

        const quickPickItems: QuickPickItem[] = licenseTemplates.map(t => ({
            label: t.name,
            description: t.filename,
            template: t
        }));

        // Add option to browse all templates on GitHub
        quickPickItems.push({
            label: 'Browse all templates on GitHub...',
            description: 'Open license-templates repository in browser'
        });

        const selected = await vscode.window.showQuickPick(quickPickItems, {
            placeHolder: 'Select a license template'
        });

        if (!selected) {
            return;
        }

        // Check if user selected the browse option
        if (!selected.template) {
            vscode.env.openExternal(vscode.Uri.parse('https://github.com/licenses/license-templates/tree/master/templates'));
            return;
        }

        const tmpl = selected.template;
        const templateUrl = `${LICENSE_TEMPLATES_BASE_URL}/${tmpl.filename}`;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Fetching ${tmpl.name} license template...`,
            cancellable: false
        }, async () => {
            let content = '';

            // Try remote fetch first
            try {
                const response = await fetch(templateUrl);
                if (response.ok) {
                    content = await response.text();
                }
            } catch {
                // Network unavailable
            }

            // Fallback to bundled template if remote failed
            if (!content) {
                const localPath = vscode.Uri.joinPath(extensionUri, 'resource', 'license-templates', 'templates', tmpl.filename);
                try {
                    const data = await vscode.workspace.fs.readFile(localPath);
                    content = new TextDecoder().decode(data);
                    vscode.window.showInformationMessage(`Using bundled ${tmpl.name} template (network unavailable)`);
                } catch {
                    throw new Error(`Failed to fetch ${tmpl.name} template from both remote and local bundle`);
                }
            }

            // Check if template has placeholders that need user input
            const hasYear = content.includes('{{ year }}');
            const hasOrganization = content.includes('{{ organization }}');
            const hasProject = content.includes('{{ project }}');

            if (hasYear || hasOrganization || hasProject) {
                const currentYear = new Date().getFullYear().toString();
                let year = currentYear;
                let organization = '';
                let project = workspaceFolders[0].name;

                if (hasYear) {
                    const yearInput = await vscode.window.showInputBox({
                        prompt: 'Enter copyright year',
                        value: currentYear,
                        placeHolder: currentYear
                    });
                    if (yearInput === undefined) {
                        return; // User cancelled
                    }
                    year = yearInput || currentYear;
                }

                if (hasOrganization) {
                    const orgInput = await vscode.window.showInputBox({
                        prompt: 'Enter copyright holder (name or organization)',
                        placeHolder: 'Your Name or Organization'
                    });
                    if (orgInput === undefined) {
                        return; // User cancelled
                    }
                    organization = orgInput;
                }

                if (hasProject) {
                    const projectInput = await vscode.window.showInputBox({
                        prompt: 'Enter project name',
                        value: project,
                        placeHolder: project
                    });
                    if (projectInput === undefined) {
                        return; // User cancelled
                    }
                    project = projectInput;
                }

                content = content
                    .replace(/\{\{ year \}\}/g, year)
                    .replace(/\{\{ organization \}\}/g, organization)
                    .replace(/\{\{ project \}\}/g, project);
            }

            // Write the LICENSE file
            await vscode.workspace.fs.writeFile(
                vscode.Uri.file(licensePath),
                new TextEncoder().encode(content)
            );

            vscode.window.showInformationMessage(`LICENSE file created with ${tmpl.name} license`, 'Add to Git').then(action => {
                if (action === 'Add to Git') {
                    git.add(licensePath).then(
                        () => vscode.window.showInformationMessage('LICENSE added to Git'),
                        () => { /* silently skip on failure */ }
                    );
                }
            });
        });

    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to create LICENSE: ${error.message}`);
    }
}

export function deactivate() { }