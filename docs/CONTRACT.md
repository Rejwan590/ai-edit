# Contract: how UI and core agree

The single source of truth is `packages/contract/src/types.ts` (TypeScript types). The core also keeps zod schemas that mirror it exactly; a test fails if they drift.

## Pieces
- **ApiClient:** the only thing the UI calls. Implementations: `ipcClient` (desktop) and `httpClient` (optional dev). There is no demo or mock client (decision D20).
- **CoreEvent:** everything the core pushes: `chat:*`, `doc:update`, `draft:update`, `job:update`, `upload:progress`, `agent:status`, `provider:status`, `provider:test`, `doctor`, `fs:change`, `mcp:call`.
- **Op:** the only way to change the timeline document. The UI sends ops, then waits for `doc:update`. A drag may show a local ghost while pending; it reverts on error.
- **ApiError:** `{ code, message, detail? }`. Codes in use: `not_built`, `bridge_missing`, `agent_not_found`, `not_signed_in`, `timeout`, `tool_failed`, `invalid_op`. Add new codes here when you introduce them.

## Status truth rules
- Agent chip "Ready" only when the active connection is found AND signed in AND its last test had no failure. Otherwise show the exact reason.
- Tools chip is green only if every required tool in the doctor result is found.
- Job progress comes from `Job.progress` (0..1); missing or -1 means indeterminate.
- Playhead equals the `<video>` element's `currentTime`.
- Unknown capabilities are `null` and shown as Unknown, never as supported.

## Transport
Desktop: Electron IPC. Channel names come from one constant list in `packages/contract`. The preload script exposes `window.motionforge` (methods mirror `ApiClient`, plus `onEvent(cb)`). Validate every IPC payload with zod on the core side.

## Changing the contract (procedure)
1. Edit `types.ts` and note why in `docs/DECISIONS.md`.
2. Update zod schemas in core, then the UI, then tests.
3. Run the contract test (schemas vs types) and the UI type-check.
4. Never change one side alone. Never add a field the UI or core does not use.

## Versioning
The document has `version` (integer, +1 per committed change). Events carry it. If the UI receives a `doc:update` with a lower version than it holds, it ignores it.
