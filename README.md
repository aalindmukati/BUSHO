# BUSHO: Bottom-Up Smart Health Operations

**BUSHO** is a dependency-free prototype for first-mile, bottom-up smart health operations. It demonstrates a seamless workflow where raw frontline field notes are parsed via mock extraction, verified by human operators, cross-referenced with inventory attention triggers, and converted into administrator-approved replenishment drafts.

Built specifically for healthcare workers and logistics administrators, BUSHO ensures data integrity by keeping the original field note visible alongside the structured data throughout the entire lifecycle.

---

## 🚦 System Architecture & States

The core methodology of BUSHO separates data into three distinct operational states to ensure clear ownership and data confidence:

*   **Reported Health Trend:** A raw field signal flagged for human review.
*   **Worker-Verified Operational Record:** A structured dataset checked and confirmed by a human operator.
*   **Administrative Replenishment Action:** A logistics draft that remains pending until explicit administrator approval.

---

## 🛠️ Project Structure

The codebase is lightweight, modular, and intentionally free of external runtime dependencies.

| File | Purpose |
| :--- | :--- |
| `index.html` | Core application shell containing both Worker and Administrator console views. |
| `styles-v2.css` | Production-ready BUSHO visual design system and responsive mobile/desktop layouts. |
| `app-v2.js` | Main application engine handling mock extraction, validation, inventory logic, and `localStorage` persistence. |
| `server.mjs` | Ultra-lightweight, dependency-free Node.js HTTP server. |
| `terms.html` | Pre-pilot legal framework and Terms of Service draft. |
| `privacy.html` | Pre-pilot Data Privacy policies and compliance draft. |

> 📌 **Note:** Legacy v1 files are retained in the repository strictly for archival reference. The active application exclusively uses the `v2` assets.

---
### Prerequisites
*   **Node.js** v18.0.0 or newer
*   A modern web browser (Chrome, Firefox, Edge, Safari)

### Installation & Execution
1. Clone or download this repository to your local machine.
2. Open your terminal or PowerShell in the project directory.
3. Start the built-in HTTP server:
   ```powershell
   node server.mjs
   ```
4. Open your browser and navigate to the local address provided in your terminal output (typically `http://localhost:3000`).

---

## 🧭 Guided Demo Journey

Follow this recommended walk-through to experience the end-to-end capabilities of the prototype:

