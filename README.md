# ARCH_TECH — Architecture & OpenBIM Engineering Platform

**ARCH_TECH** is a dual-capability architecture & engineering platform combining a large-scale Costa Rica-oriented real-estate development portfolio and multi-role client portal with an authoritative, browser-based OpenBIM engineering workspace.

Its primary identity is large-scale developments and infrastructure: free zones, corporate districts, hospitality, healthcare, compute campuses, institutional projects and complex sites. ARCH_TECH must not read as a residential architecture studio. OpenBIM/IFC remains a core capability inside the portal/workspace, especially for Architect/Admin workflows, while the public experience leads with development scale and lifecycle. Garnier & Garnier is only a conceptual reference for enterprise perception; ARCH_TECH does not copy its branding, website or assets and does not imply affiliation.

---

## Main Feature Areas

1. **Public Development Portfolio**: Six fictional Costa Rica-oriented development concepts (Free Zone, Corporate, Hospitality, Compute, Renewable and Medical campuses) with a featured six-project carousel, local real-world reference photography, and dark architectural editorial design. Canonical project identities remain unchanged.
2. **Multi-Role Client Portal**: Secure role-based portal (`Client`, `Architect`, `Admin`) backed by local snapshot state for tracking project milestones, document vaults, design approvals, and project updates.
3. **OpenBIM Engineering Workspace**: Desktop-first web CAD environment for real `.ifc` files:
   - **Visualization & Inspection**: Spatial BIM tree, property sets (Psets, Qto), 2D floor plans, 3D section planes (X/Y/Z clipping), length measurement.
   - **Analysis & Filtering**: Quantity/area/volume metrics, type/storey/category filtering.
   - **Non-Destructive Editing**: Element moves, rotations, temp delete/restore, undo/redo, ChangeSet tracking.
   - **Real IFC Persistence**: Detached STEP-21 exports with coordinate remapping (UI X->IFC X, UI Y->IFC Z, UI Z->IFC Y) and relative rotation composition.
   - **Parametric Building Generation**: Authentic IFC4 STEP-21 model authoring directly from parametric massing plans.
   - **AI Assistant**: Deterministic offline AI agent with explicit human confirmation gates for WRITE operations.
4. **Landing + SpatialRail Media**: The public landing uses a keyboard-accessible, reduced-motion-aware featured-project carousel. Project dossiers retain the custom scroll-snap gallery rail and fullscreen lightbox inspection viewer for technical project media.

---

## Technology Stack

- **BIM Core**: That Open Components (`3.4.8`), Fragments (`3.4.7`), `web-ifc` (`0.0.78`), Three.js (`0.182.0`)
- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS, Lucide React
- **State Management**: Zustand
- **Testing**: Vitest, Playwright
- **Hardware Target Baseline**: MacBook Pro 2019 / Intel UHD Graphics 630 (DPR <= 1.25, Shadows OFF, Postprocessing OFF)

### Landing reference photography

The six canonical projects keep their fictional names, categories, statements and dossier media. Their preferred public-facing primary images now use local copies of reusable real-world aerial/reference photographs, mapped in `src/components/gallery/projectMedia.tsx`; the existing concept/render packs remain available for technical and private dossier context. These photographs are visual references only and do not depict the fictional ARCH_TECH projects.

Sources and licenses:

- Pacific Nexus / industrial campus: [Fenton Industrial complex](https://commons.wikimedia.org/wiki/File:Aerial_view_of_Fenton_Industrial_complex_as_September_2024.jpg), Gkbediako, CC BY-SA 4.0.
- Summit Point / corporate district: [Foster City office park](https://commons.wikimedia.org/wiki/File:Aerial_view_of_office_park_in_Foster_City,_September_2019.JPG), Pi.1415926535, CC BY-SA 3.0.
- Mar Vista / hospitality district: [Gran Hotel Bahía del Duque Resort](https://commons.wikimedia.org/wiki/File:A0411_Tenerife,_Gran_Hotel_Bahia_del_Duque_Resort_in_Adeje_aerial_view.jpg), Wouter Hagens, CC BY-SA 4.0.
- Caribbean AI / compute campus: [Data centers in Ashburn](https://commons.wikimedia.org/wiki/File:Data_centers_in_Ashburn.jpg), Theodore Christopher, CC0.
- Guanacaste Renewable / infrastructure campus: [CCAFS Industrial Area](https://commons.wikimedia.org/wiki/File:Aerial_view_of_CCAFS_Industrial_Area_(KSC-2009-5007).jpg), NASA/Troy Cryder, public domain.
- Pacific Regional Medical / healthcare campus: [Yale-New Haven Hospital campus](https://commons.wikimedia.org/wiki/File:Aerial_closeup_YNHH_2010.jpg), YNHHEditor, CC BY-SA 3.0.

Garnier & Garnier remains only a conceptual reference for scale and enterprise perception; it is not a source of branding, imagery, affiliation or claims.

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
│   ├── portal/               # Portal data snapshot, schema migration & demo auth
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

- **Current Status**: All Phase 6A (Viewport), Phase 6B.1 (IFC4 Generation), Phase 6B.2 (Detached IFC Persistence), Landing/Portal Redesign, real-image landing carousel, and SpatialRail Media Integration phases are **COMPLETE**.
- **Detailed Handoff**: For complete handoff details, architecture invariants, known issues, and current priorities, refer to [PROJECT_STATE.md](PROJECT_STATE.md).
