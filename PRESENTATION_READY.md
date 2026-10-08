# PRESENTATION_READY.md — Live Presentation Runbook & Demo Freeze

> **Presentation Date & Time:** Tomorrow at 12:25 PM  
> **Target Branch:** `bim/shared-development`  
> **Status:** Code & Feature Freeze Verified (V3.4A Tools + V3.4B Visual Integrated)

---

## START

Run the following commands in the project directory:

```bash
# Terminal 1: Start persistent mock backend (Port 3001)
npm run server

# Terminal 2: Start frontend Vite dev server (Port 5173)
npm run dev

# Or single command to launch both:
npm run dev:portal
```

Open the browser at:  
👉 **`http://localhost:5173/`**

---

## DEMO ROUTE (6–8 Minutes)

Recommended live demo sequence:

### 1. Landing Page (0:00 - 1:00)
- Showcase enterprise hero & positioning (corporate districts, infrastructure, free zones).
- Toggle Theme: switch **Dark ↔ Light** (demonstrating editorial light architectural palette).
- Toggle Language: switch **ES ↔ EN** (demonstrating full bilingual synchronization).
- Click **Acceso / Portal** or **Iniciar Sesión**.

### 2. Portal & Project Navigation (1:00 - 2:00)
- Select demo profile (e.g., Client `Elena Rostova` or Admin `Carlos Mendoza`) or login credentials.
- Point out project register, portfolio progress, milestones, and document status.
- Open project: **La Lima Free Zone** (click to launch 3D BIM workspace).

### 3. La Lima 3D Viewport & Visual Quality (2:00 - 3:15)
- Viewport initializes with La Lima masterplan/campus.
- Demonstrate camera controls: Orbit (Left Drag), Pan (Right Drag), Zoom (Scroll).
- Cycle Visual Presets in top bar:
  - **Day** (warm architectural daylight, crisp contrast)
  - **Overcast** (diffuse sky, soft ambient contact)
- Cycle Quality Profiles:
  - **Performance** (high frame rate, DPR 1.0, shadows off)
  - **Balanced** (standard presentation, DPR 1.25)
  - **Presentation** (selective architectural shadows, high-fidelity PBR)

### 4. Selection & Model Explorer (3:15 - 4:15)
- Click building/element in 3D viewport (highlights mesh, populates Inspector).
- Shift-Click for **Multi-select**.
- Open **Model Explorer** (left panel): verify 3D selection highlights in tree.
- Use toolbar actions:
  - **Hide (H)** selected building → Explorer shows hidden state.
  - **Isolate (I)** building group → remaining buildings hidden.
  - **Show All (A)** → restores all elements and original visibility.

### 5. Measurements (4:15 - 5:15)
- Activate **Measurement Tool** (bottom toolbar / shortcut):
  - **Distance**: click 2 points to measure building clearance or span.
  - **Polyline**: click multiple points along access roadway or perimeter.
  - **Area**: measure footprint area with live polygon fill and label.
- Note: interaction does not trigger accidental selection while measuring.

### 6. Section Plane (5:15 - 6:00)
- Activate **Section Plane** from toolbar.
- Choose axis (**X, Y, or Z**) and adjust slider offset into warehouse/facility interior.
- Click **Invert** to reverse cutting side.
- Deactivate section plane when finished.

### 7. Saved Views (6:00 - 6:45)
- Open **Saved Views** panel:
  - Select preset camera views: **Aerial Masterplan**, **Warehouse Logistics**, **Corporate District**, or **Close Facade**.
  - Capture current custom viewpoint as a new saved view.
  - Switch away and restore saved view (retains camera position, target, and view state).

### 8. Garnier Assistant (6:45 - 7:30)
- Open **Garnier Assistant** launcher (bottom right).
- Submit query (e.g., *"¿Cuál es el estado de las aprobaciones de La Lima?"* or *"Describe the masterplan footprint"*).
- Shows live response (or graceful offline fallback if n8n webhook is not running).
- Return smoothly to portal/landing via **← Portal / Volver**.

---

## FALLBACKS

| Scenario | Contingency / Immediate Presenter Action |
| :--- | :--- |
| **n8n / AI Assistant Unavailable** | Assistant automatically falls back to graceful localized offline message without crashing or hanging. Continue demo uninterrupted. |
| **Local Backend / API Down (Port 3001)** | Portal seamlessly falls back to embedded `localStorage` snapshot cache (Schema v4). Data remains fully readable and interactive. |
| **Accidental Browser Refresh** | Workspace will restore smoothly. You can navigate back via bookmarks or direct URL (`http://localhost:5173/workspace` or `/?view=workspace`). |
| **3D Engine Takes Long to Initialize** | Keep browser tab open before going on stage to ensure WebGL context is pre-warmed. If hard reload occurs, allow 2-3 seconds for Fragment geometry build. |
| **Projector / Screen DPI Lag** | Switch quality preset from **Presentation** to **Balanced** or **Performance** directly from the top bar. |

---

## VERIFIED CHECKPOINT

- **Baseline Commits Integrated:**
  - V3.4B Visual: `3f06681504d9e0ab8addb0b661996cf971c252aa`
  - V3.4A Tools: `e89ce940da8cff16b7ba1ef929d0e1daa7abef2b`
- **Frozen Commit:** `e89ce940da8cff16b7ba1ef929d0e1daa7abef2b` (+ presentation freeze commit)
- **Test Suite:** 37 test files, **431 / 431 passed** (0 failing)
- **TypeScript & Lint:** 0 errors (`npm run lint` clean)
- **Translations:** 100% synchronized (`es` / `en`, 970 keys)
- **Production Build:** `npm run build` verified clean
- **Hardware Profile:** Optimized for Intel UHD Graphics 630 / MacBook Pro 2019 baseline (DPR ≤ 1.25, controlled draw calls, selective shadows).
