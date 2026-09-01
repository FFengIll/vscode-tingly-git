# Large-File Preview Architecture

**Last Updated**: 2026-09-01
**Cache Level**: Component
**Expires**: 2026-09-04 (~3 days)
**Branch**: main
**Hash**: 2ae74ea61ee45edbdea7f85d0647b1a088f274e0

## Overview

Tingly Git is a small TypeScript VS Code extension whose composition root is `src/extension.ts`. It currently contributes command handlers and an SCM completion provider, but no custom editor, webview, virtual filesystem, or document content provider. Large-file preview support is therefore a new subsystem rather than an extension of an existing preview layer.

## Relevant Components

| Component | Location | Purpose / relevance |
|---|---|---|
| Extension activation | `src/extension.ts` | `activate()` registers providers and commands; appropriate place to register a preview command/service. |
| VS Code Git API facade | `src/gitApi.ts` | Resolves the repository for a URI across multi-root and nested repositories. This should be reused for selecting the correct repository root. |
| SCM completions | `src/completionProvider.ts` | Existing provider pattern and consumer of `gitApi.ts`; unrelated to file rendering. |
| Extension manifest | `package.json` | Declares activation events, commands, menus, and runtime dependencies. It currently has no configuration or custom editor contributions. |
| Test harness | `src/test/extension.test.ts`, `.vscode-test.mjs` | VS Code integration-test setup exists, but only the generated sample test is present. Pure parsing/resolution logic should be separated for direct tests. |

## Current Data Flow

```text
Command/menu action
  -> activate() command registration
  -> command function in extension.ts
  -> VS Code workspace/window APIs and simple-git
```

Files are opened with `vscode.open`, while generated log output is opened as an untitled text document. There is no mechanism that intercepts the normal file-open flow.

## Git and Workspace Integration

- The extension depends on VS Code's built-in `vscode.git` extension.
- `resolveRepositoryForUri()` in `src/gitApi.ts` can map a resource to the correct repository, including nested/multiple repositories.
- A legacy module-level `SimpleGit` instance in `src/extension.ts` is still rooted at the first workspace folder; new preview code should not copy this limitation.
- Existing code assumes local `file:` resources in several places. External Git filters and local object caches also require local filesystem/process access, so preview support should initially reject unsupported URI schemes explicitly.

## Recommended Integration Pattern

1. Add an explicit read-only **Preview Resolved Large File** command rather than attempting to replace every normal VS Code open operation.
2. Resolve the owning repository through `gitApi.ts` and instantiate Git/process access for that root.
3. Keep pointer parsing and resolver selection in a standalone module with no VS Code dependency.
4. Materialize only the selected object into extension-managed temporary/cache storage, without modifying the working-tree pointer.
5. Open the materialized local URI with `vscode.openWith`/`vscode.open` so VS Code's existing text, image, notebook, PDF, and installed custom editors remain available.
6. Model storage backends behind a common resolver interface so Git LFS and Hugging Face Xet behavior does not leak into the preview command.

## Constraints and Risks

- Automatic transparent interception would require broad `customEditors` selectors and could override specialized editors; it is too invasive for an initial implementation.
- A `TextDocumentContentProvider` only solves text, whereas target files may be images, PDFs, notebooks, tensors, archives, or other binaries.
- Retrieval can require external tools, network, credentials, and substantial disk use. The UI must reveal object size and obtain confirmation before remote materialization.
- Preview retrieval must not run arbitrary repository-defined filter commands. Only known, fixed Git LFS/Xet mechanisms are eligible.
- The checkout may already contain the real content; pointer detection must be content-based and bounded, not extension-based.

## Testing Seams

- Unit-test bounded Git LFS/Xet pointer parsing and invalid-pointer rejection.
- Unit-test resolver selection and size-limit/confirmation policy through injected process/filesystem interfaces.
- Extension-host tests should cover command registration, URI/repository selection, unsupported schemes, cancellation, and opening a resolved local URI.

## Related Areas

- `src/gitApi.ts`: multi-repository mapping.
- `package.json`: command, activation, menu, and optional configuration declarations.
- `README.md` and `CHANGELOG.md`: user-visible support and limitations.
