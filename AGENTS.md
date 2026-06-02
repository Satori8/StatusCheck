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

## Repository Map

A full codemap and extensive product-architectural atlas is available at `README.md` in the project root.

Before working on any task, read `README.md` to understand:
- Product value propositions and user role-based restrictions.
- High-craft Design system metrics and color variables.
- Technical architecture, cookie-based Supabase middleware route protection, and REST API/Server Actions logic.
- Database models, schema references, triggers, and PostgreSQL enums.
