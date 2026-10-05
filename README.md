# ARCH_TECH — Architecture & OpenBIM Engineering Platform

**ARCH_TECH** is a dual-capability architecture & engineering platform combining a large-scale Costa Rica-oriented real-estate development portfolio and multi-role client portal with an authoritative, browser-based OpenBIM engineering workspace.

Its primary identity is large-scale developments and infrastructure: free zones, corporate districts, hospitality, healthcare, compute campuses, institutional projects and complex sites. ARCH_TECH must not read as a residential architecture studio. OpenBIM/IFC remains a core capability inside the portal/workspace, especially for Architect/Admin workflows, while the public experience leads with development scale and lifecycle. Garnier & Garnier remains a reference for enterprise perception; ARCH_TECH does not copy its UI, layouts, branding system, logos or visual identity and does not imply affiliation.

---

## Main Feature Areas

1. **Public Development Portfolio**: Six official Garnier project references spanning free zones, corporate campuses, hospitality, social infrastructure and education, presented locally as an ARCH_TECH presentation/showcase prototype with a featured six-project carousel.
2. **Multi-Role Client Portal**: Secure role-based portal (`Client`, `Architect`, `Admin`) backed by local snapshot state for tracking project milestones, document vaults, design approvals, and project updates.
3. **OpenBIM Engineering Workspace**: Desktop-first web CAD environment for real `.ifc` files:
   - **Visualization & Inspection**: Spatial BIM tree, property sets (Psets, Qto), 2D floor plans, 3D section planes (X/Y/Z clipping), length measurement.
   - **Analysis & Filtering**: Quantity/area/volume metrics, type/storey/category filtering.
   - **Non-Destructive Editing**: Element moves, rotations, temp delete/restore, undo/redo, ChangeSet tracking.
   - **Real IFC Persistence**: Detached STEP-21 exports with coordinate remapping (UI X->IFC X, UI Y->IFC Z, UI Z->IFC Y) and relative rotation composition.
   - **Parametric Building Generation**: Authentic IFC4 STEP-21 model authoring directly from parametric massing plans.
   - **AI Assistant**: Deterministic offline AI agent with explicit human confirmation gates for WRITE operations.
4. **Landing + SpatialRail Media**: The public landing uses a keyboard-accessible, reduced-motion-aware featured-project carousel, an editorial About section, a stable leadership grid and the D1 Solid → Wireframe ARCH_TECH mark. Project dossiers retain the custom scroll-snap gallery rail and fullscreen lightbox inspection viewer for technical project media.

---

## Technology Stack

- **BIM Core**: That Open Components (`3.4.8`), Fragments (`3.4.7`), `web-ifc` (`0.0.78`), Three.js (`0.182.0`)
- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS, Lucide React
- **State Management**: Zustand
- **Testing**: Vitest, Playwright
- **Hardware Target Baseline**: MacBook Pro 2019 / Intel UHD Graphics 630 (DPR <= 1.25, Shadows OFF, Postprocessing OFF)

### Landing reference photography

The showcase uses six current projects from Garnier & Garnier's public portfolio. Project facts and names are kept factual and source-oriented; workflow updates, milestones and approvals remain ARCH_TECH prototype data. Each project's official media is stored in an isolated local directory, mapped explicitly in `src/components/gallery/projectMedia.tsx`, and the featured media viewport uses a fixed 16:9 shell so slide changes cannot resize the outer card. The carousel advances on a calm 4.2-second cadence; the La Lima portfolio feature deliberately uses a second local La Lima frame instead of repeating the opening cover.

Official portfolio source mapping:

- Zona Franca La Lima (`zona-franca-la-lima`) — free zone / industrial park.
- El Cafetal (`el-cafetal`) — corporate center / office campus.
- Santa Ana Country Club (`santa-ana-country-club`) — social and sports club.
- Waldorf Astoria (`waldorf-astoria`) — hotel and residences.
- Centro Corporativo La Sabana (`centro-corporativo-sabana`) — corporate office center.
- Universidad Latina (`universidad-latina`) — educational campus.

The source portfolio is [Garnier & Garnier's official portfolio](https://www.garnier.cr/#/portfolio#top), with media retrieved from its official project API and stored locally under `public/projects/<project-slug>/garnier-cover.*` and `garnier-01.*` / `garnier-02.*`. This authorized prototype uses project photography only; it does not claim official ARCH_TECH/Garnier status, affiliation or endorsement.

The ARCH_TECH identity follows the approved D1 Solid → Wireframe direction: a vector architectural mark transitions from physical structural faces into restrained BIM-style construction lines, communicating physical structure → digital model without generic technology effects.

### About and leadership sections

The landing About section presents concise public company context sourced from [garnier.cr](https://www.garnier.cr/) and uses a locally stored official workplace image at `public/about/garnier-values.webp`. The Team section represents the eight current public leadership profiles with their official titles and one-to-one local portraits under `public/team/`. The compositions are ARCH_TECH editorial work; the 21st.dev About and Team references were used only as structural inspiration, not copied as UI or branding.

---

## Project Structure Overview

```text
arch_tech/
├── src/
│   ├── bim/                  # OpenBIM Engine (loaders, edit, persistence, generation, analysis, AI)
│   ├── components/
│   │   ├── bim/              # BimViewport WebGL component
│   │   ├── gallery/          # SpatialRail image carousel & lightbox viewer
│   │   ├── landing/          # Public editorial landing page sections
│   │   ├── layout/           # App HeaderBar & Workspace container
│   │   ├── panels/           # BIM Inspector panels (Tree, Properties, ChangeSet, Storeys, AI, etc.)
│   │   └── portal/           # Client, Architect, and Admin portal pages
│   ├── portal/               # Portal data snapshot, schema migration & presentation auth
│   └── stores/               # Zustand state stores (bimStore.ts)
├── public/                   # Static assets, WebIFC WASM, IFC samples, project image packs
├── tests/                    # Vitest unit/domain tests and Playwright E2E suites
├── db.json                   # Portal database seed
├── PROJECT_STATE.md          # Canonical handoff document & detailed development state
├── AGENTS.md                 # Agent operating rules & context routing guidelines
└── docs/context/CONTEXT.md   # Central technical context router
```

---

## Local Setup & Run Commands

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run unit / domain tests (Vitest)
npm test

# Run E2E tests (Playwright)
npx playwright test

# Production build
npm run build
```

---

## Current Development Status & Handoff Context

- **Current Status**: All Phase 6A (Viewport), Phase 6B.1 (IFC4 Generation), Phase 6B.2 (Detached IFC Persistence), Landing/Portal Redesign, official Garnier showcase carousel, and SpatialRail Media Integration phases are **COMPLETE**.
- **Detailed Handoff**: For complete handoff details, architecture invariants, known issues, and current priorities, refer to [PROJECT_STATE.md](PROJECT_STATE.md).
