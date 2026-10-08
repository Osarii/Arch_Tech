# PRESENTATION_READY.md — Live Presentation Runbook & Demo Tour Guide

> **Presentation Date & Time:** 12:25 PM
> **Target Branch:** `bim/shared-development`  
> **Architecture:** Professional Guided Demo Tour (Intro Video → Real Landing → Real Portal → Real BIM / 3D Engine → NVIDIA Vision)

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

## DEMO TOUR FLOW (7 Minutes Live Target)

The platform is presenter-controlled. The guided Demo Tour mode maintains live application state while seamlessly steering between real routes and activating prepared BIM camera presets.

```text
[INICIAR RECORRIDO]
        │
        ▼
01. INTRO VIDEO (00:00–00:31) ──► Fullscreen cinematic intro (/demo/intro.mp4 / .mov)
        │
        ▼
02. REAL LANDING (00:31–01:10) ──► Public portfolio, enterprise positioning, theme & locale
        │
        ▼
03. REAL PORTAL (01:10–02:15) ──► Client & Admin workspaces, project intelligence & approvals
        │
        ▼
04. REAL BIM / 3D (02:15–05:45) ──► Masterplan, logistics hub, explorer, tools & measurements
        │
        ▼
05. NVIDIA / VISION (05:45–07:00) ──► Architectural camera preset for future digital twin vision
```

---

### Step-by-Step Live Walkthrough

#### 1. Intro Video (00:00 - 00:31)
- Click **INICIAR RECORRIDO** on the Landing Hero or Top Navbar.
- The clean fullscreen Intro Video Modal appears with `#07080a` backdrop.
- Controls available:
  - **Omitir Introducción** (Skip) / `Escape` key: jumps straight to the live Landing page.
  - **Sound Toggle**: un-mute / mute.
  - **Play / Pause**: click or `Spacebar`.
  - When the video ends, it transitions automatically to the live Landing page.

#### 2. Real Landing Page (00:31 - 01:10)
- Minimal floating **Demo Tour Bar** docks cleanly at the bottom without obscuring content.
- Presenter demonstrates:
  - Enterprise positioning (corporate districts, free zones, large infrastructure).
  - Bilingual switcher (**ES ↔ EN**) and Theme switcher (**Dark ↔ Light**).
  - Featured 6-project carousel with dossier previews.
  - **ARCH Assistant** brand launcher.
- Click **Ir al Portal** or **03 PORTAL** on the Demo Tour Bar.

#### 3. Real Interactive Portal (01:10 - 02:15)
- Automatically authenticates with demo session and opens `/dashboard`.
- Presenter demonstrates:
  - Role-scoped workspaces (Client, Architect, Admin).
  - **Project Intelligence**: Deterministic operational signals and real-time Site Intelligence (weather + seismicity).
  - **Zona Franca La Lima**: Project progress (68%), milestones, approvals, and document repository.
- Click **Abrir Visor 3D** or **04 BIM / 3D** on the Demo Tour Bar.

#### 4. Real OpenBIM / 3D Engine (02:15 - 05:45)
- Seamlessly transitions to `/workspace` with La Lima campus loaded.
- Presenter uses the dedicated **BIM Quick Presets** on the Demo Tour Bar:
  - **Masterplan**: General isometric overview of the 2.5M m² campus (`[180, 140, 180]`).
  - **Hub Logístico**: Focused perspective on industrial warehouses and logistics access (`[80, 45, 60]`).
  - **Medición**: Activates the distance measurement tool with snap markers.
- Presenter manually showcases interactive capabilities:
  - **Model Explorer & Spatial Tree**: Category hierarchy and element selection.
  - **Inspector**: Real-time property sets and geometric metadata.
  - **Render Profiles**: Day ↔ Overcast lighting presets, Balanced ↔ Presentation shadows.
  - **Section Plane**: Dynamic cutting planes across X, Y, Z axes.

#### 5. NVIDIA / Future Vision & Closing (05:45 - 07:00)
- Presenter clicks the **NVIDIA / Futuro** preset on the Demo Tour Bar (`[40, 22, -30]`).
- Clean architectural perspective framing the future development horizon for spoken remarks on AI twin workflows and Omniverse integration.
- The tour remains inside the 3D engine (does NOT automatically return to Portal).

---

## DEMO CONTROLS & UTILITIES

| Control | Action | Keyboard / Trigger |
| :--- | :--- | :--- |
| **INICIAR RECORRIDO** | Starts guided demo flow starting at Intro Video | Header CTA / Hero Button |
| **Omitir / Skip** | Skips intro video immediately to Landing | `demo-intro-skip` / `Escape` |
| **Stage Breadcrumbs** | Jump directly to `01 INTRO`, `02 LANDING`, `03 PORTAL`, `04 BIM` | `tour-stage-[id]` |
| **Vistas BIM** | Quick camera/tool presets (`Masterplan`, `Hub Logístico`, `Medición`, `NVIDIA / Futuro`) | `bim-preset-[id]` |
| **Reiniciar (Reset)** | Resets BIM camera/state and restarts from Intro | `tour-reset` |
| **Salir (Exit)** | Closes Demo Tour Bar and returns to manual navigation | `tour-exit` |
| **Pantalla Completa** | Toggles browser fullscreen | `tour-toggle-fullscreen` |

---

## FALLBACKS & CONTINGENCIES

| Scenario | Contingency / Immediate Presenter Action |
| :--- | :--- |
| **Video Autoplay Blocked** | Click the visible "HAGA CLIC PARA INICIAR EL VIDEO" overlay or hit `Escape` / "Omitir" to jump directly to Landing. |
| **Fullscreen Denied by Browser** | Continues cleanly in windowed mode without breaking flow. |
| **Local Backend / API Down (Port 3001)** | Portal seamlessly operates using embedded `localStorage` snapshot cache (Schema v4). |
| **Accidental Page Reload** | Direct routes (`/`, `/dashboard`, `/workspace`) restore instantly. Demo Tour Bar preserves stage synchronization with current URL. |
| **Low-End Display / Projector Lag** | Switch render profile to **Balanced** or **Performance** directly in the BIM header. |

---

## VERIFICATION STATUS

- **Tests:** 38 test suites, 444 tests passing (100% green)
- **TypeScript:** `tsc --noEmit` clean (0 errors)
- **i18n:** 100% parity across English and Spanish namespaces (930 keys)
- **Production Bundle:** `vite build` completed successfully
