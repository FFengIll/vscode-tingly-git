import * as vscode from 'vscode';
import { SimpleGit } from 'simple-git';

/**
 * Completion provider for Git SCM input box.
 * Provides autocomplete for staged files in the commit message input.
 */
export class StagedFilesCompletionProvider implements vscode.CompletionItemProvider {

    constructor(private git: SimpleGit) {}

    async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): Promise<vscode.CompletionItem[]> {

        // Get the text before cursor
        const lineText = document.lineAt(position).text;
        const textBeforeCursor = lineText.substring(0, position.character);

        // Get the current "word" being typed (for filtering)
        const wordMatch = textBeforeCursor.match(/(\S+)$/);
        const currentWord = wordMatch ? wordMatch[1] : '';

        try {
            const status = await this.git.status();

            // Only get staged files
            const stagedFiles: string[] = status.staged || [];

            if (stagedFiles.length === 0) {
                return [];
            }

            // Filter by current word if exists (fuzzy match anywhere in path)
            const filteredFiles = currentWord
                ? stagedFiles.filter(f => f.toLowerCase().includes(currentWord.toLowerCase()))
                : stagedFiles;

            return filteredFiles.map(file => {
                const item = new vscode.CompletionItem(file, vscode.CompletionItemKind.File);
                item.detail = 'Staged';
                // Replace the current word with the file path
                if (currentWord && wordMatch) {
                    const start = position.character - currentWord.length;
                    item.range = new vscode.Range(
                        new vscode.Position(position.line, start),
                        position
                    );
                }
                return item;
            });
        } catch (error) {
            console.error('[Tingly Git] Error:', error);
            return [];
        }
    }
}
