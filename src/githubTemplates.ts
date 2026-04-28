// Gitignore templates bundled from GitHub's collection
// Source: https://github.com/github/gitignore
import * as vscode from 'vscode';

export interface GitignoreTemplate {
    name: string;
    filename: string;
}

// Load all bundled gitignore templates by scanning the resource directory.
// The list is derived from the bundled files, so it always reflects what is
// actually shippable.
export async function loadGitignoreTemplates(extensionUri: vscode.Uri): Promise<GitignoreTemplate[]> {
    const dir = vscode.Uri.joinPath(extensionUri, 'resource', 'gitignore-templates');
    const entries = await vscode.workspace.fs.readDirectory(dir);
    const templates: GitignoreTemplate[] = [];
    for (const [filename, fileType] of entries) {
        if (fileType !== vscode.FileType.File) {
            continue;
        }
        if (!filename.endsWith('.gitignore')) {
            continue;
        }
        const name = filename.replace(/\.gitignore$/, '');
        templates.push({ name, filename });
    }
    templates.sort((a, b) => a.name.localeCompare(b.name));
    return templates;
}
