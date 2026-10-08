# PRESENTATION_READY.md — Live Presentation Runbook & Demo Freeze

> **Presentation Date & Time:** Tomorrow at 12:25 PM  
> **Target Branch:** `bim/shared-development`  
> **Status:** Code & Feature Freeze Verified (ARCH_TECH Platform Hierarchy + Presentation Mode + V3.4 Integrated)

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

### 1. Landing Page & Cinematic Presentation (0:00 - 1:30)
- Showcase enterprise hero & positioning (corporate districts, infrastructure, free zones).
- Toggle Theme: switch **Dark ↔ Light** (demonstrating editorial light architectural palette).
- Toggle Language: switch **ES ↔ EN** (demonstrating full bilingual synchronization).
- Click **PRESENTACIÓN** button (in Hero or Header) to start full Presentation Mode with fullscreen.
- Watch or narrate the **Cinematic Opening (45–60s)**:
  - *Problem:* "Un proyecto puede tener toda la información necesaria... y aun así nadie tener la imagen completa."
  - *Fragmentation:* Floating disconnected fragments (`BIM`, `PLANOS`, `DATOS`, `APROBACIONES`, `AVANCES`, `EQUIPOS`, `DECISIONES`).
  - *Question & Convergence:* "¿Y si el proyecto volviera a ser el punto donde todo se conecta?" → Fragments converge into `ARCH_TECH`.
  - *Solution:* "Información. Personas. BIM. Decisiones. Inteligencia. Un solo contexto."

### 2. Guided Chapters & Platform Hierarchy (1:30 - 3:00)
- Step through guided chapters using on-screen controls or keyboard (`ArrowRight` / `ArrowLeft`):
  - **02 Platform Architecture:** Software platform unifiying development lifecycles.
  - **03 Garnier Architecture Workspace:** Multi-role coordination (Client, Architect, Admin).
  - **04 Zona Franca La Lima:** Unified project dossier, 2.5M m² industrial park.
  - **05 Project Intelligence:** Deterministic KPI analytics and real-time Site Intelligence (weather + seismicity).
- Voice narration speaks automatically via browser `SpeechSynthesis` (with Latin American Spanish `es-419` preference), with live captions always visible. Voice can be toggled via **Voice ON / OFF**.

### 3. OpenBIM 3D Viewport & Visual Quality (3:00 - 4:15)
- **06 BIM / 3D Engine:** WebGL viewport initializes with La Lima masterplan.
- Orbit (Left Drag), Pan (Right Drag), Zoom (Scroll).
- **09 Visual Engine:**
  - Cycle Lighting Presets: **Day** (architectural daylight) ↔ **Overcast** (diffuse sky).
  - Cycle Quality Profiles: **Performance** (DPR 1.0) ↔ **Balanced** (DPR 1.25) ↔ **Presentation** (selective shadows).

### 4. Selection, Explorer & Analysis Tools (4:15 - 5:30)
- **07 Model Explorer + Inspector:** Tree hierarchy syncs bidirectionally with 3D selection; Hide, Isolate, Show All.
- **08 BIM Analysis Tools:**
  - **Distance**: 2-point span/clearance measurement in meters.
  - **Polyline**: multi-segment site access routes with live total.
  - **Area**: closed polygonal building footprint calculation in m².
  - **Section Plane**: dynamic cutting plane along X, Y, Z axes with offset and invert.

### 5. Explore Mode & Technical Explainer (5:30 - 6:30)
- Click **Explore** in the presentation controls bar to enter Explore Mode.
- Inspect registered explainable components (**17 registered systems** with verified source files and data flows).
- Click any component (e.g. `BIM Viewer`, `Model Explorer`, `Site Intelligence`, `Area`):
  - **WHAT IS IT?**
  - **HOW DOES IT WORK?**
  - **DATA FLOW**
  - **SOURCE FILES**
  - **TECHNOLOGIES**
  - Click **ASK ARCH ABOUT THIS** to query ARCH Assistant with active component context.

### 6. Closing (6:30 - 7:30)
- Chapter **12 Closing**:
  - *"ARCH_TECH — ONE CONNECTED ENVIRONMENT FOR COMPLEX DEVELOPMENT. FROM OPPORTUNITY TO OPERATION."*
  - Narration: *"ARCH_TECH. Un entorno conectado para comprender, coordinar y desarrollar proyectos complejos. Desde la oportunidad... hasta la operación."*
  - Action buttons: **ENTER PLATFORM**, **RESTART PRESENTATION**, **EXIT**.

---

## FALLBACKS

| Scenario | Contingency / Immediate Presenter Action |
| :--- | :--- |
| **SpeechSynthesis / Audio Unavailable or Muted** | Live synchronized captions are always prominently displayed on screen. Presentation continues without audio disruption. |
| **Fullscreen Denied / Blocked by Browser** | Non-blocking inline banner displays *"Fullscreen unavailable — continuing in page view."* Presentation continues seamlessly. |
| **n8n / AI Assistant Unavailable** | Assistant automatically falls back to deterministic local knowledge without crashing or hanging. Continue demo uninterrupted. |
| **Local Backend / API Down (Port 3001)** | Portal seamlessly falls back to embedded `localStorage` snapshot cache (Schema v4). Data remains fully readable and interactive. |
| **Accidental Browser Refresh** | Workspace and landing restore smoothly. Direct URLs (`/workspace`, `/dashboard`) remain fully available. |
| **3D Engine Warmup** | Keep browser tab open before going on stage. If reload occurs, allow 2 seconds for Fragment geometry build. |
| **Projector / Screen DPI Lag** | Switch quality preset from **Presentation** to **Balanced** or **Performance** directly from the top bar. |

---

## VERIFIED CHECKPOINT

- **Hierarchy Verified:**
  - `ARCH_TECH`: software product / platform (primary brand)
  - `GARNIER ARCHITECTURE`: demo organization / workspace
  - `ZONA FRANCA LA LIMA`: project inside workspace
  - `ARCH Assistant`: visible conversational intelligence
- **Presentation Mode:** 12 chapters, 45-60s cinematic intro, SpeechSynthesis narration (`es-419` preference), live captions, 17 registered components in Explore Mode, technical explainer.
- **Test Suite:** 38 test files, **437 / 437 passed** (0 failing)
- **TypeScript & Lint:** 0 errors (`npm run lint` clean)
- **Translations:** 100% synchronized (`es` / `en`, 970 keys)
- **Production Build:** `npm run build` verified clean
- **Hardware Profile:** Optimized for Intel UHD Graphics 630 / MacBook Pro 2019 baseline (DPR ≤ 1.25, controlled draw calls, selective shadows).
