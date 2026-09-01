# Git LFS and Hugging Face Xet Preview Understanding Report

**Date**: 2026-09-01
**Task**: Add reliable previews for placeholder-backed large files
**Branch**: main
**Hash**: 2ae74ea61ee45edbdea7f85d0647b1a088f274e0

## Findings

Tingly Git has no current preview abstraction. It registers five commands and one SCM completion provider from `src/extension.ts`; existing files are delegated to VS Code's standard open command. The best integration point is a new explicit command that resolves one placeholder into a read-only local preview and then delegates rendering back to VS Code.

The current `src/gitApi.ts` already solves the important multi-repository problem by mapping a resource URI to VS Code's discovered repository. New code should use that mapping rather than the legacy first-workspace-root `SimpleGit` singleton.

Because large-file payloads can be non-text, a text content provider alone is insufficient. Likewise, a global custom editor would compete with built-in and third-party editors. A materialized temporary URI provides the broadest format compatibility and least invasive UX.

## Integration Points

1. `src/extension.ts`: register and dispatch a preview command.
2. `src/gitApi.ts`: select the repository owning the requested resource.
3. New backend-neutral modules: bounded pointer parsing, safe resolver execution, and preview cache lifecycle.
4. `package.json`: command activation/menu and user configuration.
5. `src/test`: parsing, safety policy, and extension-host behavior.

## Architectural Direction

Use a provider model:

```text
working-tree resource
  -> bounded pointer detector
  -> known backend resolver (LFS / Xet-compatible path)
  -> size + consent policy
  -> extension-managed local preview file
  -> VS Code built-in/installed editor
```

The working tree must not be mutated. Unknown repository filter commands must never be executed. Unsupported schemes and absent tools should produce actionable errors.

## Open Research Questions

- Which Xet checkout modes leave a pointer, and whether current Hugging Face Xet repositories expose Git LFS-compatible pointer text to Git clients.
- The safest single-object materialization command for each supported backend.
- Whether a backend-neutral Hub download API is more reliable than invoking Git filter tooling for Hugging Face repositories.

These questions must be resolved before the feature specification and coding phases.
