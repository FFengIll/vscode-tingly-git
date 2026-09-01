import * as vscode from 'vscode';
import { materializeGitContent } from './gitContent';

export const lfsDiffScheme = 'lfs-diff';

export interface LfsDiffDocument {
    repositoryRoot: string;
    revision: string;
    relativePath: string;
}

function isLfsDiffDocument(value: unknown): value is LfsDiffDocument {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const document = value as Record<string, unknown>;
    return typeof document.repositoryRoot === 'string'
        && document.repositoryRoot.length > 0
        && typeof document.revision === 'string'
        && document.revision.length > 0
        && typeof document.relativePath === 'string'
        && document.relativePath.length > 0;
}

export function encodeLfsDiffUri(document: LfsDiffDocument): vscode.Uri {
    const displayPath = `/${document.relativePath.split('/').map(encodeURIComponent).join('/')}`;
    return vscode.Uri.from({
        scheme: lfsDiffScheme,
        path: displayPath,
        query: encodeURIComponent(JSON.stringify(document))
    });
}

export function decodeLfsDiffUri(uri: vscode.Uri): LfsDiffDocument {
    if (uri.scheme !== lfsDiffScheme) {
        throw new Error(`Unsupported URI scheme: ${uri.scheme}`);
    }

    let value: unknown;
    try {
        value = JSON.parse(decodeURIComponent(uri.query));
    } catch {
        throw new Error('Invalid LFS diff URI');
    }

    if (!isLfsDiffDocument(value)) {
        throw new Error('Invalid LFS diff document');
    }

    return value;
}

export class LfsDiffContentProvider implements vscode.TextDocumentContentProvider {
    async provideTextDocumentContent(
        uri: vscode.Uri,
        token: vscode.CancellationToken
    ): Promise<string> {
        const document = decodeLfsDiffUri(uri);
        return materializeGitContent(
            document.repositoryRoot,
            document.revision,
            document.relativePath,
            token
        );
    }
}
