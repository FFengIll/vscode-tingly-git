import * as path from 'path';
import * as vscode from 'vscode';
import { resolveRepositoryForUri } from './gitApi';
import { decodeLfsDiffUri, encodeLfsDiffUri, lfsDiffScheme } from './lfsDiffContentProvider';

const revision = 'HEAD';

interface ResourceState {
    resourceUri: vscode.Uri;
}

export function getRepositoryRelativePath(repositoryRoot: string, filePath: string): string {
    const relativePath = path.relative(repositoryRoot, filePath);
    if (!relativePath || relativePath === '..' || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
        throw new Error('The selected file is outside the Git repository');
    }

    return relativePath.split(path.sep).join('/');
}

function getActiveDiffResource(): vscode.Uri | undefined {
    const input = vscode.window.tabGroups.activeTabGroup.activeTab?.input;
    if (input instanceof vscode.TabInputTextDiff) {
        return input.modified;
    }

    return undefined;
}

function getSelectedResource(resource?: vscode.Uri | ResourceState): vscode.Uri | undefined {
    if (resource instanceof vscode.Uri) {
        return resource;
    }

    if (resource?.resourceUri instanceof vscode.Uri) {
        return resource.resourceUri;
    }

    return getActiveDiffResource() ?? vscode.window.activeTextEditor?.document.uri;
}

export function getWorkingTreeUri(uri: vscode.Uri): vscode.Uri {
    if (uri.scheme === 'file') {
        return uri;
    }

    if (uri.scheme === lfsDiffScheme) {
        const document = decodeLfsDiffUri(uri);
        return vscode.Uri.file(path.join(document.repositoryRoot, ...document.relativePath.split('/')));
    }

    if (uri.scheme === 'git') {
        try {
            const query = JSON.parse(uri.query) as { path?: unknown };
            if (typeof query.path === 'string' && query.path.length > 0) {
                return vscode.Uri.file(query.path);
            }
        } catch {
            // Fall through to the local-files-only error.
        }
    }

    throw new Error('Open LFS Diff currently supports local Git files only');
}

export async function openLfsDiff(resource?: vscode.Uri | ResourceState): Promise<void> {
    const selectedUri = getSelectedResource(resource);
    if (!selectedUri) {
        vscode.window.showWarningMessage('No file selected. Select a Source Control resource or open a file in the editor.');
        return;
    }

    let fileUri: vscode.Uri;
    try {
        fileUri = getWorkingTreeUri(selectedUri);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(message);
        return;
    }

    try {
        const repository = await resolveRepositoryForUri(fileUri);
        if (!repository || repository.rootUri.scheme !== 'file') {
            throw new Error('No Git repository found for the selected file');
        }

        const relativePath = getRepositoryRelativePath(repository.rootUri.fsPath, fileUri.fsPath);
        const left = encodeLfsDiffUri({
            repositoryRoot: repository.rootUri.fsPath,
            revision,
            relativePath
        });
        const title = `${path.basename(fileUri.fsPath)} (${revision} ↔ Working Tree)`;

        await vscode.commands.executeCommand('vscode.diff', left, fileUri, title);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to materialize file: ${message}`);
    }
}
