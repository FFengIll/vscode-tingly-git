# Tingly Git

A powerful Git extension for VS Code that provides easy Git commands with context menu support and smart gitignore validation.

## Features

- **Git Commands**: All essential Git operations (init, add, commit, push, pull, status, branch, log)
- **Context Menu Support**: Right-click on files and folders for quick Git operations
- **Gitignore Validation**: Smart detection when trying to add ignored files with option to force add
- **User-Friendly Interface**: Native VS Code dialogs and quick picks for all operations
- **Error Handling**: Comprehensive error messages for all Git operations

### Available Commands

**Repository Management:**
- Git: Initialize Repository
- Git: Add Origin Remote
- Git: Add Remote

**File Operations:**
- Git: Add File/Directory (context menu)
- Git: Add All Modified

**Commit & Sync:**
- Git: Commit
- Git: Pull Current Branch from Origin
- Git: Push Current Branch to Origin
- Git: Push Current Branch (to any remote)

**Branching:**
- Git: Create New Branch
- Git: Change/Checkout Branch

**History:**
- Git: Log All
- Git: Log Current File

**Status:**
- Git: Status

## Context Menu Integration

Right-click on files or folders in the explorer to access:
- Git: Add File/Directory

Right-click in the editor to access:
- Git: Add File/Directory
- Git: Log Current File

Right-click on editor tabs to access:
- Git: Add File/Directory
- Git: Log Current File

## Gitignore Validation

When you try to add a file that's ignored by .gitignore, Tingly Git will:
- Show a warning message
- Give you the option to force add the file
- Explain why the file is being ignored

## Requirements

- VS Code 1.90.0 or higher
- Git installed on your system

## Installation

1. Download the `.vsix` file from the Releases page
2. In VS Code, go to Extensions (Ctrl+Shift+X)
3. Click the "..." menu and select "Install from VSIX..."
4. Select the downloaded `.vsix` file

## Usage

1. Open a folder in VS Code
2. Use the Command Palette (Ctrl+Shift+P) and search for "Tingly Git"
3. Or right-click on files/folders in the explorer for quick operations

## Release Notes

### 0.0.1
- Initial release
- All basic Git commands implemented
- Context menu support for files and folders
- Gitignore validation with force add option
- Branch creation and checkout functionality
- Git log commands for repository and individual files

## Support

If you encounter any issues or have feature requests, please report them on the [GitHub repository](https://github.com/FFengIll/vscode-tingly-git).