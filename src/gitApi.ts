import * as vscode from 'vscode';

/**
 * Minimal shape of the built-in `vscode.git` extension API that we rely on.
 * See https://github.com/microsoft/vscode/blob/main/extensions/git/src/api/git.d.ts
 */
export interface GitExtensionChange {
    uri: vscode.Uri;
}

export interface GitExtensionRepositoryState {
    indexChanges: GitExtensionChange[];
}

export interface GitExtensionRepository {
    rootUri: vscode.Uri;
    state: GitExtensionRepositoryState;
}

export interface GitExtensionApi {
    repositories: GitExtensionRepository[];
    getRepository(uri: vscode.Uri): GitExtensionRepository | null;
}

interface GitExtensionExports {
    getAPI(version: 1): GitExtensionApi;
}

let cachedApi: GitExtensionApi | undefined;

/**
 * Resolve the API exposed by VS Code's built-in `vscode.git` extension.
 * This API tracks every repository VS Code has discovered — across all
 * workspace folders, including nested/sub-directory repositories — so we
 * don't need to (re)implement repository discovery ourselves.
 */
export async function getGitExtensionApi(): Promise<GitExtensionApi | undefined> {
    if (cachedApi) {
        return cachedApi;
    }

    const extension = vscode.extensions.getExtension<GitExtensionExports>('vscode.git');
    if (!extension) {
        return undefined;
    }

    const exports = extension.isActive ? extension.exports : await extension.activate();
    cachedApi = exports.getAPI(1);
    return cachedApi;
}

/**
 * Given an SCM input box document (or any URI belonging to a repository),
 * resolve the specific repository it belongs to. Falls back to the sole
 * repository when there is exactly one, and to `undefined` when the
 * repository can't be determined (e.g. ambiguous multi-repo workspace).
 */
export async function resolveRepositoryForUri(uri: vscode.Uri): Promise<GitExtensionRepository | undefined> {
    const api = await getGitExtensionApi();
    if (!api) {
        return undefined;
    }

    const repo = api.getRepository(uri);
    if (repo) {
        return repo;
    }

    // Some VS Code versions encode the repository root in the SCM input
    // document's query/path rather than something `getRepository` can map
    // directly. Fall back to matching by root path, then to "only repo".
    if (api.repositories.length === 1) {
        return api.repositories[0];
    }

    const rootPath = api.repositories.find(r => uri.path.includes(r.rootUri.path));
    return rootPath;
}
