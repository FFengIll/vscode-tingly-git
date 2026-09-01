import * as path from 'path';
import * as vscode from 'vscode';
import { resolveRepositoryForUri } from './gitApi';
import { encodeLfsDiffUri } from './lfsDiffContentProvider';

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

function getSelectedResource(resource?: vscode.Uri | ResourceState): vscode.Uri | undefined {
    if (resource instanceof vscode.Uri) {
        return resource;
    }

    if (resource?.resourceUri instanceof vscode.Uri) {
        return resource.resourceUri;
    }

    return vscode.window.activeTextEditor?.document.uri;
}

export async function openLfsDiff(resource?: vscode.Uri | ResourceState): Promise<void> {
    const fileUri = getSelectedResource(resource);
    if (!fileUri) {
        vscode.window.showWarningMessage('No file selected. Select a Source Control resource or open a file in the editor.');
        return;
    }

    if (fileUri.scheme !== 'file') {
        vscode.window.showErrorMessage('Open LFS Diff currently supports local files only.');
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
