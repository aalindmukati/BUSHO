# BUSHO

BUSHO is a dependency-free prototype for bottom-up smart health operations. It demonstrates how an ordinary frontline field report can move through mock extraction, human verification, inventory attention and an administrator-approved replenishment draft.

The prototype is designed for healthcare workers and administrators who need a clear first-mile reporting workflow. It keeps the original field note visible beside the structured draft and distinguishes three different states:

- A reported health trend is a signal for review.
- A worker-verified operational record has been checked by a human.
- An administrative replenishment action remains a draft until an administrator approves it.

## Demo scope

This is an honest local demo. It uses synthetic data and a local mock extraction engine. It does not provide clinical diagnosis, outbreak confirmation, voice transcription, cloud synchronization, production authentication, a medical database or real purchase orders.

Demo state is retained in the browser with `localStorage` so the worker and administrator views remain consistent after refresh. This is not a secure backend or production data store. Use the **Reset demo data** control to return to the starting state.

## Run locally

Requirements:

- Node.js 18 or newer
- A modern browser

From the project directory:

```powershell
node server.mjs
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173).

The built-in server serves the static application without external dependencies or APIs.

## Suggested demo journey

1. In **Worker console**, select **Routine report** or enter a synthetic report.
2. Choose **Extract report** to create a provisional structured draft.
3. Review and edit the extracted fields. Missing or ambiguous quantities must be clarified.
4. Confirm the draft to create a worker-verified operational record.
5. Switch to **Admin overview** to see the derived report metrics and review context.
6. Open **View all** inventory, create a replenishment draft for a low-stock item, and approve it in demo state.
7. Use **Ambiguous report** to show how human clarification is required before confirmation.

## Project structure

| File | Purpose |
| --- | --- |
| `index.html` | BUSHO application shell and worker/admin views |
| `styles-v2.css` | Approved BUSHO visual system and responsive layout |
| `app-v2.js` | Mock extraction, verification, inventory workflow and browser-local state |
| `server.mjs` | Dependency-free Node HTTP server |
| `terms.html` | Prototype Terms draft for review |
| `privacy.html` | Prototype Privacy draft for review |

Legacy files are retained for reference, while the active page uses `styles-v2.css` and `app-v2.js`.

## Privacy and safety

Do not enter real patient information, names, phone numbers, government identifiers or clinical notes into this prototype. The included legal pages are drafts and require review before any pilot or production use.
