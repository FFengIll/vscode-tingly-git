# Tingly Git

A VS Code extension that lets you **diff Git LFS/Xet text files normally**, **git add files/folders via right-click**, view **file history logs**, and manage **.gitignore and LICENSE** — all without leaving the editor.

> **Philosophy**: We extend VSCode's native Git with unique convenience features. No duplication, just smart enhancements to your daily Git workflow.

![](resource/preview.scm.png)

## Why Tingly Git?

VSCode's Source Control panel is excellent for Git basics. Tingly Git adds the **missing convenience features** that streamline your workflow:

| Feature                         | Why It Matters                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **LFS/Xet Native Diff**           | Materialize the `HEAD` version through Git filters, then compare it in VS Code's standard text diff editor       |
| **Smart Gitignore Templates**   | Browse & insert 50+ curated templates from GitHub's official collection - faster than manual copy-paste |
| **License Management**          | Browse & insert license templates from the official collection - set up your project license in seconds |
| **File History Log**            | Quick access to git log for any file - no terminal needed                                               |
| **Commit Message Autocomplete** | See staged files while typing commit messages - write better messages                                   |
| **Context Menu Staging**        | Right-click to add files - faster than opening Source Control panel                                     |

These are features **VSCode doesn't provide natively** - designed to save you time every day.

### Commands

Access via Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

| Command                         | What It Does                                                  |
| ------------------------------- | ------------------------------------------------------------- |
| `Tingly Git: Open LFS Diff`       | Compare materialized `HEAD` content with the working-tree text file |
| `Tingly Git: Manage .gitignore` | Browse and insert templates from GitHub's official collection |
| `Tingly Git: Manage LICENSE`   | Browse and insert license templates from the official collection |
| `Tingly Git: Log Current File`  | Show commit history for the active file                       |
| `Tingly Git: Add Remote`        | Add a named remote to your repository                         |

**Also available via context menu** — Right-click files/folders or a Git Source Control change for the relevant Tingly Git command.

### LFS/Xet Diff

For a modified text file tracked by Git LFS, right-click the file in Source Control and select **Open LFS Diff**. Tingly Git asks Git for the filtered `HEAD` content with `git cat-file --filters`, then opens that virtual document against the working-tree file in VS Code's native diff editor.

Xet-backed Hugging Face repositories use the same flow when Git LFS and the Git-Xet custom transfer agent are installed and configured. Authentication, downloading, and object materialization remain Git's responsibility. The MVP compares `HEAD` with the working tree and supports text files only.

### Context Menu

Right-click on:
- Git Source Control changes → "Open LFS Diff"
- Files/Folders in explorer → "Add File/Directory", "Open LFS Diff"
- Editor/tabs → "Add File/Directory", "Log Current File", "Open LFS Diff"

### Gitignore Templates

We fetch templates directly from **[github/gitignore](https://github.com/github/gitignore)** - the official, community-maintained collection.

Covering 50+ popular technologies:
- **Languages**: Node, Python, Go, Rust, Java, TypeScript, C++, C
- **Frameworks**: React, Vue, Angular, Next.js, Django, Laravel, Rails, NestJS
- **Mobile**: Android, iOS/macOS, Flutter, React Native
- **Tools**: VS Code, IntelliJ, Docker, Terraform, Kubernetes
- **Build Tools**: Maven, Gradle, Cargo, Composer, SBT

Just select what you need - we fetch and merge it into your `.gitignore` automatically.

### Commit Message Autocomplete

When writing commit messages in VSCode's Source Control input:
1. Press `Ctrl+Space` or `Cmd+I` to trigger suggestions
2. See all staged files with their paths
3. Type to fuzzy-filter (matches anywhere in the path)
4. Select to insert the file path into your message

Perfect for writing clear, descriptive commit messages that reference specific files.

## Usage

1. Install the extension from VSIX file
2. Open Command Palette (Ctrl+Shift+P)
3. Search for Tingly Git commands or use context menus
4. For gitignore: Search "Tingly Git: Manage .gitignore" to browse and add templates

### Requirements

- VS Code 1.90.0 or higher
- Git installed on your system
- Git LFS installed for LFS-backed files
- Git-Xet installed/configured when the remote selects Xet transfers

## Release Notes

See [CHANGELOG.md](CHANGELOG.md) for a full history of changes.

## Support

Report issues on [GitHub](https://github.com/FFengIll/vscode-tingly-git)
