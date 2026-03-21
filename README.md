# Tingly Git

A VS Code extension that provides essential Git utilities with context menu support, smart .gitignore management, and commit message autocompletion.

> **Focus**: This extension provides unique Git features that complement VSCode's built-in Source Control functionality, rather than duplicating it.

![](resource/preview.scm.png)
![](resource/preview.png)

## Features

- **Smart Gitignore Management**: Complete .gitignore management with 180+ professional templates from Toptal
- **Commit Message Autocomplete**: Smart file path completion in SCM commit input box
- **File History Log**: Quick access to git log for specific files
- **Context Menu Support**: Right-click files and folders for quick Git operations
- **Smart Validation**: Detects ignored files with option to force add
- **Remote Management**: Add named remotes easily

### Commands

Access via Command Palette (Ctrl+Shift+P) → "Git:":

| Command | Description | Unique Feature |
|---------|-------------|----------------|
| Git: Add File/Directory | Stage files from context menu | Quick access |
| Git: Add Remote | Add named remotes to your repository | Convenience |
| Git: Log Current File | View commit history for current file | **Unique** |
| Git: Manage .gitignore | Browse and add professional templates | **Unique** |

> **Note**: Basic Git operations (init, commit, push, pull, branch, status) are handled natively by VSCode's Source Control panel.

### Context Menu

Right-click on:
- Files/Folders in explorer → "Git: Add File/Directory"
- Editor/tabs → "Git: Add File/Directory", "Git: Log Current File"

### Gitignore Templates

Access 180+ professional gitignore templates covering:
- Programming languages (Python, JavaScript, Java, etc.)
- Frameworks (React, Vue, Django, etc.)
- Tools & IDEs (VS Code, IntelliJ, Docker, etc.)
- Build systems (npm, Maven, Gradle, etc.)
- Operating systems (Windows, macOS, Linux)

### Commit Message Autocomplete

When writing commit messages in the SCM input box:
- Press `Ctrl+Space` or `Cmd+I` to trigger suggestions
- Shows all staged files for quick reference
- Type to fuzzy-filter file paths (matches anywhere in the path)
- Select a file to insert its path into the message

## Why This Extension?

VSCode already provides excellent Git support through the Source Control panel. This extension focuses on **unique features** that enhance your workflow:

1. **Gitignore Templates** - No native equivalent, saves time setting up projects
2. **File-Specific History** - Quick access to file log from context menu
3. **Staged Files Autocomplete** - Write better commit messages faster
4. **Context Menu Staging** - Faster than opening Source Control panel

## Usage

1. Install the extension from VSIX file
2. Open Command Palette (Ctrl+Shift+P)
3. Search for Tingly Git commands or use context menus
4. For gitignore: Search "Git: Manage .gitignore" to browse and add templates

### Requirements

- VS Code 1.90.0 or higher
- Git installed on your system

## Release Notes

### 0.260228.1900
- **Refactor**: Removed commands that duplicate VSCode native functionality
- **Focus**: Now focuses on unique features only
- **Kept**: gitignore templates, file log, staged files autocomplete, context menu staging
- **Removed**: init, commit, push, pull, status, branch operations (use VSCode native)

### 0.260228.1800
- **Commit Message Autocomplete**: Smart file path completion in SCM commit input
  - Press `Ctrl+Space` or `Cmd+I` to call `Trigger Suggestion` to list staged files
  - Fuzzy filtering - type anywhere to filter paths
  - Quick file path insertion for better commit messages

### 0.25.121015
- **Major Feature**: Comprehensive .gitignore management system
  - Added 180+ professional gitignore templates from Toptal's collection
  - Automatic .gitignore creation when missing
  - Smart template merging with timestamp and source tracking
  - Enhanced user experience for template browsing and selection

### 0.0.1
- Initial release

## Support

Report issues on [GitHub](https://github.com/FFengIll/vscode-tingly-git)
