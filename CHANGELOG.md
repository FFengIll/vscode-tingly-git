# Change Log

All notable changes to the "tingly-git" extension will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/).

## [Unreleased]

### Added

- **Git LFS/Xet text diff**: Materialize a file's `HEAD` content through Git filters and compare it with the working tree in VS Code's native diff editor

### Changed

- Support fallback to local gitignore template file when network is unavailable

## [0.260401.0] - 2026-04-01

### Added
- **License Management**: New `Tingly Git: Manage LICENSE` command to browse and insert license templates from [licenses/license-templates](https://github.com/licenses/license-templates)
- **Git Add Force**: Support `git add -f` for force-adding files

## [0.260321.0] - 2026-03-21

### Changed
- **New gitignore source**: Switched from Toptal to GitHub's official gitignore collection
- **Curated templates**: 50+ popular technology templates directly from github/gitignore
- **Refactor**: Removed commands that duplicate VSCode native functionality
- **Focus**: Now focuses on unique convenience features only
- **Documentation**: Clarified positioning as a convenience layer on top of VSCode's built-in Git

### Removed
- Init, commit, push, pull, status, branch operations (use VSCode native)
- **Kept**: gitignore templates, file log, staged files autocomplete, context menu staging

## [0.260228.1800] - 2025-02-28

### Added
- **Commit Message Autocomplete**: Smart file path completion in SCM commit input
  - Press `Ctrl+Space` or `Cmd+I` to trigger suggestions listing staged files
  - Fuzzy filtering - type anywhere to filter paths
  - Quick file path insertion for better commit messages

## [0.25.121015] - 2025-10-15

### Added
- **Gitignore Management**: Comprehensive .gitignore template system
  - 180+ professional gitignore templates from Toptal's collection
  - Automatic .gitignore creation when missing
  - Smart template merging with timestamp and source tracking

## [0.0.1]

### Added
- Initial release