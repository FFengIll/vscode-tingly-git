# LFS/Xet Native Diff MVP Specification

**Date**: 2026-09-01
**Status**: Approved input, implementation-ready
**Scope**: VS Code native text diff for HEAD versus working tree

## Goal

Allow users to invoke **Open LFS Diff** for a Git-managed text file and see the real historical content from `HEAD`, rather than its Git LFS pointer, compared with the working-tree file in VS Code's native diff editor.

```text
HEAD:path -> git cat-file --filters -> virtual text document
working tree -> file URI
both URIs -> vscode.diff
```

Git-Xet is covered when it is installed/configured as the Git LFS custom transfer agent selected by the repository's remote. The extension does not implement the Xet protocol itself.

## User-visible Contract

Command ID:

```text
tingly-git.openLfsDiff
```

Title:

```text
Open LFS Diff
```

Entry points:

- Source Control resource context menu
- Explorer context menu
- Editor context/title menu
- Command Palette (falls back to active editor)

Given a modified text file, the command opens:

```text
<filename> (HEAD ↔ Working Tree)
```

using VS Code's standard diff editor.

## Functional Design

### Resource selection

1. Prefer the URI passed by VS Code from a context menu.
2. Otherwise use the active text editor URI.
3. Only local `file:` resources are supported in the MVP.
4. Resolve the owning repository through the built-in `vscode.git` API facade in `src/gitApi.ts`; this preserves multi-root and nested-repository support.
5. Reject resources outside a discovered Git repository.
6. Convert the absolute file path to a repository-relative Git path and reject paths that escape the repository.

### Historical materialization

Run Git in the owning repository:

```bash
git cat-file --filters HEAD:<relative-git-path>
```

The command must be invoked with arguments (not shell interpolation), so spaces and metacharacters in paths do not alter command semantics. `--filters` asks Git to apply the conversion configured by `.gitattributes`; for LFS this invokes the smudge/filter process, which may obtain the payload through ordinary LFS transfer or its configured Xet custom transfer agent.

The MVP intentionally has no fallback to `git show`. Failures are surfaced with Git's stderr.

### Virtual document

Register a `TextDocumentContentProvider` for scheme:

```text
lfs-diff
```

The virtual URI encodes structured JSON containing:

- repository root filesystem path
- revision (`HEAD` in the MVP)
- repository-relative path

The provider validates the decoded payload before executing Git and returns the materialized UTF-8 text. It does not cache results in the MVP.

### Native diff

The command constructs:

- left: `lfs-diff:` virtual document URI
- right: original working-tree `file:` URI

and invokes:

```ts
vscode.commands.executeCommand('vscode.diff', left, right, title)
```

No custom diff computation, webview, custom editor, or binary semantic rendering is introduced.

## Project Layout

To fit the current repository without unnecessary refactoring:

```text
src/
├── extension.ts             # composition and registration
├── lfsDiffCommand.ts        # resource/repository/path resolution and vscode.diff
├── lfsDiffContentProvider.ts# virtual URI codec and content provider
├── gitContent.ts            # git cat-file --filters boundary
└── gitApi.ts                # existing vscode.git repository resolution
```

`commands.ts` and `git.ts` from the reference design are given feature-specific names to avoid becoming generic dumping grounds.

## Error Handling

User-facing failures begin with:

```text
Failed to materialize file:
```

and include a sanitized useful message from Git/process execution. Expected causes include:

- path absent from `HEAD`
- Git LFS missing or not initialized
- Git-Xet missing or not configured
- object unavailable
- authentication/network failure
- malformed virtual URI

Cancellation/absence of a selected resource is reported without opening a diff.

## Security and Correctness Constraints

- Never modify the working tree or index.
- Never construct a shell command string.
- Only execute the fixed Git subcommand `cat-file --filters` with validated revision/path data.
- Require an owning repository and a path contained within its root.
- Encode virtual-document metadata structurally; do not parse authority/path segments as raw command fragments.
- Treat content as text and decode UTF-8, matching the MVP scope.

## Manifest Changes

- Add activation event for `onCommand:tingly-git.openLfsDiff`.
- Contribute the command.
- Add SCM resource context menu entry.
- Add explorer/editor/editor-title entries where a resource is available.
- Do not add settings in MVP.

## Tests

Pure/unit-oriented tests:

- virtual URI encode/decode round trip, including Unicode and spaces
- malformed payload rejection
- relative path derivation and repository containment
- exact Git arguments for `HEAD:path`
- Git stderr propagation

Extension-host tests where practical:

- command is contributed/registered
- provider registration and native diff invocation boundaries

Verification:

- `npm run compile`
- `npm run lint`
- `npm test`
- manual or fixture repository test with an LFS pointer and locally available payload if environment permits

## Out of Scope

- normal file-open interception
- HEAD/index and arbitrary commit comparisons
- caching
- file-size limits
- binary diff or file-format-aware semantics
- custom UI/webviews
- implementing LFS/Xet protocols

## Success Criterion

For a modified Git LFS/Xet-managed text file, **Open LFS Diff** opens VS Code's native diff where the left side is the materialized `HEAD` content and the right side is the current working-tree content.
