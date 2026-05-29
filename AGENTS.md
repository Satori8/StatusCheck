# Agent Instructions

## Package Manager
Use **npm**: `npm install`, `npm test`

## Commit Attribution
AI commits MUST include:
```
Co-Authored-By: OpenCode AI <noreply@opencode.dev>
```

## File-Scoped Commands
| Task | Command |
|------|---------|
| Typecheck | `npx tsc --noEmit path/to/file.ts` |
| Lint | `npx eslint path/to/file.ts` |
| Test | `npx jest path/to/file.test.ts` |

## Key Conventions
- **Absolute Tool Bans** — Do not use raw `grep`, `rg`, `read`, or `glob` for general listing or searching.
- **Surgical Edits** — Never fully overwrite files. Use `edit` or symbol-scoped replacement tools.
- **Diagnostics** — Run `cortexast_run_diagnostics` immediately after any edit.
- **State Preservation** — Read and maintain `.opencode_state.json` at start and end of turns.
