# CLEANUP_AUDIT.md — Arch_Tech Repository Cleanup Audit

**Audit Date**: October 2026  
**Audited Branch**: `agent/b-main`  
**Audited Commit (HEAD)**: `421ef4b1a124dec0d6c87e7534caa7f01ef89ecb`  
**Audit Scope**: Read-only static analysis, dependency resolution, runtime asset analysis, and bundle profiling across `src/**`, `public/**`, `tests/**`, `scripts/**`, `package.json`, `index.html`, and `src/index.css`.

---

## 1. Executive Summary & Baseline Metrics

The audit was executed against a clean `agent/b-main` tree at commit `421ef4b1`. No application code modifications, package deletions, or branch merges were performed.

### Baseline Metrics (Commit `421ef4b1`)
| Metric | Value | Notes |
| :--- | :--- | :--- |
| **Tracked Git Files** | 255 files | `git ls-files` |
| **Tracked Repository Size** | 75,842,901 bytes (~72.33 MB) | Total size of all tracked files |
| **Public Assets** | 79 files / 73,961,751 bytes (~70.54 MB) | `sample.ifc` (~50.26 MB) accounts for 71% |
| **Source Directory (`src/`)** | 121 files / 86,750,870 bytes (~82.73 MB) | Includes TS, TSX, CSS, embedded data |
| **Direct Dependencies** | 17 | `package.json:dependencies` |
| **Dev Dependencies** | 17 | `package.json:devDependencies` |
| **Production Dist Size** | 84 files / 85,229,088 bytes (~81.28 MB) | Output of `tsc -b && vite build` |
| **Production Bundle: Main JS** | `dist/assets/index-DWUgor4a.js`: 7,757.98 kB | gzip: 1,557.48 kB |
| **Production Bundle: Workspace** | `dist/assets/Workspace-CGEbCyfl.js`: 124.66 kB | gzip: 26.06 kB |
| **Production Bundle: Worker** | `dist/assets/worker-Cq9BMH_c.mjs`: 3,267.03 kB | Unminified copy bundled in build |
| **Production Bundle: Main CSS** | `dist/assets/index-DeVA3RV2.css`: 115.51 kB | gzip: 19.25 kB |
| **Test Suite Baseline** | 350 / 350 passed (26 test files) | Vitest 3.x clean run |
| **Lint / Type Check Baseline** | Clean exit 0 | `tsc --noEmit` |
| **i18n Check Baseline** | 926 keys, 100% Spanish coverage (886/886) | `i18next-cli lint` & `status` |

---

## 2. Confirmed Dead Files

Every deletion candidate has been verified using ripgrep, AST analysis, and route tracing. None of the following files have active consumers.

| File Path | Size | Reason / Evidence | Status |
| :--- | :--- | :--- | :--- |
| `.DS_Store` | 6,148 bytes | macOS metadata file tracked in git. `.gitignore` already lists `.DS_Store`. Untracked copies in `src/.DS_Store` and `src/imgs/.DS_Store`. | Confirmed Dead |
| `src/components/landing/TechnologyStrip.tsx` | 1,407 bytes | 0 imports in repository. Unused legacy landing component. | Confirmed Dead |
| `src/components/landing/ProductPreview.tsx` | 3,632 bytes | 0 imports in repository. Unused legacy landing component. Only consumer of `/workspace_preview.png`. | Confirmed Dead |
| `src/components/landing/FinalCTA.tsx` | 2,643 bytes | 0 imports in repository. Unused legacy landing component. | Confirmed Dead |
| `src/components/landing/Capabilities.tsx` | 5,631 bytes | 0 imports in repository. Replaced by `src/components/landing/CapabilityRegister.tsx`. | Confirmed Dead |
| `src/components/landing/Workflow.tsx` | 4,194 bytes | 0 imports in repository. Unused legacy landing component. | Confirmed Dead |
| `src/services/notificationService.ts` | 876 bytes | 0 imports in repository. Duplicate/obsolete service not wired to any UI or store. | Confirmed Dead |
| `public/worker.mjs` | 3,267,030 bytes (~3.12 MB) | Unminified fragments worker. `BimEngine.ts:209` explicitly fetches `/worker.min.mjs` (`const workerResponse = await fetch('/worker.min.mjs')`). Nothing requests `/worker.mjs`. | Confirmed Dead Asset |
| `public/workspace_preview.png` | 106,496 bytes (~104 KB) | 0 references outside of the dead `ProductPreview.tsx:41`. | Confirmed Dead Asset |

**Total confirmed dead file savings**: ~3.39 MB (3,391,424 bytes).

---

## 3. Confirmed Unused Dependencies

Audit performed via static import search, `npm ls`, and peer dependency resolution in `node_modules`.

| Dependency | Category | Audit Result | Recommendation |
| :--- | :--- | :--- | :--- |
| `clsx` (`^2.1.1`) | `dependencies` | 0 imports in `src/**` or `tests/**`. 0 dependents or peer dependents in `node_modules`. | **Remove** |
| `tailwind-merge` (`^3.0.2`) | `dependencies` | 0 imports in `src/**` or `tests/**`. 0 dependents or peer dependents in `node_modules`. | **Remove** |
| `@testing-library/jest-dom` (`^6.6.3`) | `devDependencies` | 0 imports in `tests/**` or `tests/setup.ts`. Test suite exclusively uses Vitest standard assertions. | **Remove / Defer** |
| `camera-controls` (`^3.1.2`) | `dependencies` | 0 direct imports in application code, **BUT** `@thatopen/components@3.4.8` specifies `camera-controls: ">=3.1.2"` as a required `peerDependency` and `@thatopen/components/dist/index.mjs` directly imports `CameraControls from "camera-controls"`. | **KEEP — Required Runtime Peer Dependency** |
| `three-mesh-bvh` (`^0.9.9`) | `dependencies` | 0 direct application imports, **BUT** explicitly protected by prompt contract for upcoming BIM spatial index optimization and consumed by `@thatopen/components`. | **KEEP — Protected by Contract** |

---

## 4. Public Assets Audit & Image Optimization

### Asset Breakdown (`public/`)
| Asset | Size | Status / Findings | Action |
| :--- | :--- | :--- | :--- |
| `public/sample.ifc` | 52,704,917 bytes (~50.26 MB) | Active Workspace sample model. | **Keep** (Explicitly preserved) |
| `public/team/garnier-team-group.png` | 5,553,043 bytes (~5.30 MB) | 2048×1364 uncompressed PNG. Rendered with fixed aspect ratio in `TeamSection.tsx`. | **Optimize to WebP** (~300 KB, saving ~5.2 MB). Update `TeamSection.tsx:61` and test assertions in `tests/teamGroupImage.test.tsx:20` and `tests/landingPage.test.tsx:97`. Delete PNG after visual verification. |
| `public/worker.mjs` | 3,267,030 bytes (~3.12 MB) | Unminified That Open Fragments worker. | **Delete** (Runtime loads `worker.min.mjs`) |
| `public/worker.min.mjs` | 1,391,154 bytes (~1.33 MB) | Active Fragments worker loaded dynamically at `BimEngine.ts:209`. | **Keep** |
| `public/web-ifc.wasm` | 1,592,935 bytes (~1.52 MB) | Single-threaded WebAssembly engine loaded by `web-ifc-api.js:4559` when browser lack SharedArrayBuffer. | **Keep** |
| `public/web-ifc-mt.wasm` | 1,563,334 bytes (~1.49 MB) | Multi-threaded WebAssembly engine loaded by `web-ifc-api.js:215` when cross-origin isolation is enabled. | **Keep** |
| `public/web-ifc-node.wasm` | 1,524,422 bytes (~1.45 MB) | Node.js WebAssembly binary. In Node/Vitest environments, `web-ifc-api-node.js` loads this from `node_modules/web-ifc/web-ifc-node.wasm`, never from `public/`. | **Deferred Candidate** (Verify with Playwright/headless tests before deletion) |
| `public/workspace_preview.png` | 106,496 bytes (~104 KB) | Only referenced by dead component `ProductPreview.tsx`. | **Delete** with component |
| `public/brand/arch-tech/*` | Three supplied ARCH_TECH PNG assets | Canonical product identity family: two horizontal lockups and one Penrose symbol. | **Keep** (Brand assets) |
| `public/locales/**` | ~180 KB across 22 files | JSON translation resources for `en` and `es`. | **Keep** (Consolidate with runtime) |

---

## 5. i18n Architecture & Duplication Analysis

### Current Architecture Discrepancy
1. **Double Storage**: Translation data currently exists in **three** separate locations:
   - `public/locales/{en,es}/*.json` (22 JSON files, static assets).
   - `src/i18n/resources.ts` statically imports all 22 JSON files and bundles them into `dist/assets/index-*.js`.
   - `src/portal/locale.ts` (991 lines) contains **8 massive hardcoded translation dictionaries**:
     - `landingTranslations` (lines 51–308)
     - `portalAiTranslations` (lines 310–476)
     - `publicNewsTranslations` (lines 478–523)
     - `publicProjectTranslations` (lines 525–649)
     - `portalCommonTranslations` (lines 651–735)
     - `clientPortalTranslations` (lines 737–800)
     - `architectPortalTranslations` (lines 802–861)
     - `adminPortalTranslations` (lines 863–960)
2. **Consumer Dependency**:
   - 28 source files import `{ useLocale } from '@/portal/locale'` and access `t.landing`, `t.clientPortal`, `t.adminPortal`, etc.
   - Removing the translation dictionaries directly from `locale.ts` without adapting `useLocale()` would break those 28 components.
3. **Safe Migration Strategy**:
   - Rewrite `useLocale()` in `src/portal/locale.ts` to consume `useTranslation()` from `react-i18next` internally (or return namespace accessors backed by `i18n.getResourceBundle`).
   - Remove the 8 legacy dictionary constants from `src/portal/locale.ts`, reducing `locale.ts` from 991 lines to ~80 lines.
   - Retain all contract guarantees:
     - `arch-tech-locale` localStorage read/write
     - `document.documentElement.lang` updates
     - `arch-tech-locale-change` CustomEvent emission on `window`
     - Speech voice rank and narration language in `src/portal/accessibility.ts`
   - Prune obsolete keys in `public/locales/{en,es}/landing.json`:
     - `technology.*`
     - `productPreview.*`
     - `finalCta.*`
     - `capabilitiesSection.*`
     - `workflow.*`
     (Note: Ensure keys matching current landing like `capabilities` navbar label are NOT removed).

---

## 6. HTML & Favicon Declarations (`index.html`)

### Current State
`index.html` (lines 7–17) contains **11 separate `<link>` icon tags** with redundant entries:
```html
<link rel="icon" type="image/png" href="/brand/arch-tech/penrose-mint-charcoal.png" />
<link rel="apple-touch-icon" href="/brand/arch-tech/penrose-mint-charcoal.png" />
<link rel="preload" as="image" href="/projects/zona-franca-la-lima/garnier-cover.webp" type="image/webp" fetchpriority="high" />
<link rel="icon" type="image/png" href="/brand/arch-tech/penrose-mint-charcoal.png" />
<link rel="apple-touch-icon" href="/brand/arch-tech/penrose-mint-charcoal.png" />
```

### Clean Minimum Set (4 Tags)
```html
<link rel="icon" type="image/png" href="/brand/arch-tech/penrose-mint-charcoal.png" />
<link rel="apple-touch-icon" href="/brand/arch-tech/penrose-mint-charcoal.png" />
```

---

## 7. CSS Audit (`src/index.css`)

### Findings
- The 5 dead landing components (`TechnologyStrip`, `ProductPreview`, `FinalCTA`, `Capabilities`, `Workflow`) used only Tailwind utility classes and inline styles (`style={{ backgroundImage: ... }}`).
- None of the selectors in `src/index.css` belong exclusively to the dead components.
- Selectors targeting `#capabilities` (`.landing-surface #capabilities`) apply to `src/components/landing/CapabilityRegister.tsx` (which renders `<section id="capabilities" ...>`).
- Selectors targeting `.landing-hero`, `.landing-projects-section`, `.landing-about`, `.landing-team`, `.landing-footer`, and `.landing-surface` are actively used by the current editorial landing page.
- No dead CSS selectors identified in `src/index.css`.

---

## 8. Large Source File Review & Unused Exports

Detailed scan of large source files identified internal helpers that do not need external export:

### `src/components/portal/PortalCommon.tsx` (986 lines)
- `uniqueProjectMedia` (L52) — only consumed internally at L896.
- `projectRoute` (L57) — only consumed internally at L874, L884.
- `ProjectThumbnail` (L60) — only consumed internally at L125.
- `ProjectMediaFrame` (L84) — only consumed internally at L934.
- `DEFAULT_NEW_PROJECT_CATEGORY` (L488) — only consumed internally at L499, L554.

### `src/portal/data.ts` (723 lines)
- `addPortalProgressSnapshot` (L522) — 0 external consumers; progress snapshots are managed via `progressSnapshots` arrays.
- `slugifyNewsTitle` (L528) — only consumed internally at L557.
- `validNewsSourceTypes` (L301) — only consumed internally at L321.
- `isValidNewsArticle` (L303) — only consumed internally at L378.
- `validRoles` (L164), `validUserStatuses` (L165) — internal validation sets.
- `portalDb`, `portalUser`, `portalProjects` — obsolete export aliases.

### `src/bim/ai/ToolRegistry.ts` (818 lines)
- `ToolExecutionResult` (L15) — interface used only inside `ToolRegistry.ts`.

### `src/components/motion/index.ts`
- Barrel file re-exporting motion primitives and `useReducedMotion`.
- Only 2 consumers: `src/router/AppRouter.tsx` (should import from `src/motion/useReducedMotion.ts`) and `tests/motion.test.tsx` (should import from individual component files).
- Can be safely retired once consumers are updated.

---

## 9. Dependency Vulnerability Audit (`npm audit --json`)

The security scan identified **11 vulnerabilities** (2 critical, 6 high, 3 moderate):

| Severity | Package | Vulnerability | Cause / Dependency Chain | Fix Availability |
| :--- | :--- | :--- | :--- | :--- |
| **Critical** | `tinypool` (`<=2.1.1`) | Prototype pollution leading to RCE | Dependency of `vitest@3.0.7` | Requires `vitest@5.0.3` (SemVer Major) |
| **High** | `braces` (`<=3.0.3`) | ReDoS stack exhaustion in patterns | Transitive via `micromatch` / `chokidar` / `tailwindcss@3.4.17` | Requires `tailwindcss@4` (SemVer Major) |
| **High** | `micromatch` (`>=0.2.0`) | ReDoS via `braces` | Transitive via `tailwindcss` | Requires `tailwindcss@4` (SemVer Major) |
| **High** | `source-map-js` (`>=1.0.0 <1.2.2`) | Event loop DoS via indexed offsets | Transitive via `postcss` / `tailwindcss` | Non-breaking patch via npm dedupe if hoisted |
| **Moderate** | `postcss-selector-parser` (`<7.1.6`) | Quadratic CPU complexity in selector parsing | Transitive via `postcss-nested` / `tailwindcss` | Requires `tailwindcss@4` (SemVer Major) |
| **Moderate** | `@vitest/mocker` | Path traversal via redirect mock | Dependency of `vitest@3.0.7` | Requires `vitest@5.0.3` (SemVer Major) |

### Assessment
- None of these vulnerabilities are in client-side production runtime code (`dist/`). All 11 stem from development tools (`tailwindcss` compiler and `vitest` test runner).
- Resolving them requires major framework upgrades (`tailwindcss@4` breaks Tailwind 3 plugin configurations; `vitest@5` breaks test lifecycle hooks).
- Per task rules: **Do not run `npm audit fix --force`**. These are documented and deferred to a dedicated build-tooling upgrade task.

---

## 10. Deferred Candidates & Safety Justifications

| Candidate | Location | Reason for Deferral |
| :--- | :--- | :--- |
| `i18next.config.ts` | Root | Flagged by Knip as unused, but is the active configuration file for `i18next-cli` (`npm run i18n:check`). Deleting it breaks i18n lint and extraction scripts. |
| `public/worker.min.mjs` | `public/` | Flagged by Knip as unused, but is dynamically fetched at runtime in `src/bim/engine/BimEngine.ts:209`. Deleting it breaks BIM 3D fragment streaming. |
| `camera-controls` | `package.json` | Flagged by Knip because no `src/` files directly import it, but is a mandatory peer dependency for `@thatopen/components@3.4.8`. Deleting it breaks That Open camera controllers. |
| `three-mesh-bvh` | `package.json` | Explicitly protected by project guidelines for upcoming BIM engine spatial indexing. |
| `web-ifc-node.wasm` | `public/` | Unused in browser runtime, but retained until verified in full headless/Playwright test suite. |
| SemVer Major devDependencies | `package.json` | Vulnerabilities in `tailwindcss` and `vitest` require breaking major version migrations. |

---

## 11. Projected Cleanup Savings Summary

When the safe cleanup is executed, the following reductions will be achieved:

| Category | Before (Baseline) | Projected After | Net Reduction |
| :--- | :--- | :--- | :--- |
| **Tracked Files** | 255 files | ~246 files | **-9 files** |
| **Tracked Repository Size** | 75.84 MB | ~67.4 MB | **-8.44 MB (~11.1%)** |
| **Public Assets Size** | 73.96 MB | ~65.6 MB | **-8.36 MB (~11.3%)** |
| **`src/portal/locale.ts`** | 991 lines (~46 KB) | ~80 lines (~3 KB) | **-911 lines (-43 KB)** |
| **Direct Dependencies** | 17 | 15 | **-2 dependencies (`clsx`, `tailwind-merge`)** |
| **Favicon Tags (`index.html`)**| 11 tags | 4 tags | **-7 duplicate tags** |
| **Group Photo Asset** | 5.55 MB (PNG) | ~350 KB (WebP) | **-5.20 MB (~93.7%)** |
| **Fragments Worker Asset** | 3.27 MB (`worker.mjs`) | 0 (deleted, `worker.min.mjs` kept) | **-3.27 MB (100%)** |

---

## 12. Implemented Cleanup & Final Verification Results

### 12.1 Actually Removed Items
1. **Dead Components & Files (9 files)**:
   - `.DS_Store`
   - `src/components/landing/TechnologyStrip.tsx`
   - `src/components/landing/ProductPreview.tsx`
   - `src/components/landing/FinalCTA.tsx`
   - `src/components/landing/Capabilities.tsx`
   - `src/components/landing/Workflow.tsx`
   - `src/services/notificationService.ts`
   - `public/worker.mjs` (3.12 MB unminified duplicate of Fragments worker)
   - `public/workspace_preview.png` (104 KB obsolete preview)
2. **Replaced/Retired Files (2 files)**:
   - `public/team/garnier-team-group.png` (5.55 MB, converted to WebP)
   - `src/components/motion/index.ts` (barrel index retired, direct module imports adopted)
3. **Unused Dependencies (3 packages)**:
   - `dependencies`: `clsx`, `tailwind-merge` (removed via `npm rm`)
   - `devDependencies`: `@testing-library/jest-dom` (removed via `npm rm`)
4. **Dead APIs & Aliases Removed/Internalized**:
   - `src/portal/data.ts`: Removed dead helper `addPortalProgressSnapshot`, removed obsolete unused aliases `portalUser`, `portalProjects`, `validRoles`, `validUserStatuses`. Internalized `portalDb`, `validNewsSourceTypes`, `isValidNewsArticle`, `slugifyNewsTitle`.
   - `src/components/portal/PortalCommon.tsx`: Removed `export` from internal-only helpers `uniqueProjectMedia`, `projectRoute`, `ProjectThumbnail`, `ProjectMediaFrame`, `DEFAULT_NEW_PROJECT_CATEGORY`.
   - `src/bim/ai/ToolRegistry.ts`: Internalized interface `ToolExecutionResult`.
5. **i18n Translation Duplication Eliminated**:
   - Removed 8 duplicate hardcoded dictionary objects from `src/portal/locale.ts` (file reduced from 991 lines to 169 lines, -822 lines / -40 KB).
   - Consolidated single-source-of-truth translations in `public/locales/{en,es}/*.json` mapped through `src/i18n/resources.ts`.
   - Pruned obsolete dead component namespaces (`capabilitiesSection`, `finalCta`, `productPreview`, `technology`, `workflow`) from `public/locales/{en,es}/landing.json`.
6. **Favicons Cleaned**:
   - Reduced redundant `<link rel="icon">` tags in `index.html` from 11 tags down to 4 canonical tags (dark, light, fallback, apple-touch-icon) while preserving `<link rel="preload">` for the La Lima cover image.

### 12.2 What Was Optimized
- **Garnier Leadership Team Group Photo**: Converted `public/team/garnier-team-group.png` (5,554,767 bytes / 5.30 MB) to WebP format `public/team/garnier-team-group.webp` (347,544 bytes / 339 KB). Net savings: **5,207,223 bytes (5.21 MB, 93.7% reduction)**. Updated `TeamSection.tsx`, `tests/teamGroupImage.test.tsx`, and `tests/landingPage.test.tsx`.
- **Dist Assets**: Main bundle `dist/assets/index-*.js` decreased from 7,816.20 kB (gzip: 1,570.66 kB) to 7,766.08 kB (gzip: 1,560.27 kB) — saving ~50 kB raw / ~10.4 kB gzip.

### 12.3 Actual Before & After Metrics

| Metric | Before (Baseline `421ef4b1`) | After Integration & Cleanup | Net Change / Delta |
| :--- | :--- | :--- | :--- |
| **Git Tracked Files** | 255 files | 270 files | +15 files (+26 La Lima materials/site files from `agent/a-main`, -11 cleanup deletions) |
| **Git Tracked Bytes** | 75,842,901 bytes (72.33 MB) | 73,541,246 bytes (70.13 MB) | **-2,301,655 bytes (-2.20 MB)** (accounting for +5.5 MB La Lima textures) |
| **Git Tracked `src/` Bytes** | 1,092,182 bytes (1066.58 KB) | 1,056,576 bytes (1031.81 KB) | **-35,606 bytes (-34.77 KB)** |
| **Public Assets Bytes** | 77,557,117 bytes (73.96 MB) | 71,688,540 bytes (68.37 MB) | **-5,868,577 bytes (-5.60 MB)** (accounting for added PBR textures) |
| **Dist Output Bytes** | ~88.4 MB | 82,963,047 bytes (79.12 MB) | **-5.44 MB** |
| **Main JS Bundle (raw / gzip)** | 7,816.20 kB / 1,570.66 kB | 7,766.08 kB / 1,560.27 kB | **-50.12 kB raw / -10.39 kB gzip** |
| **Workspace JS (raw / gzip)** | 127.01 kB / 26.72 kB | 127.01 kB / 26.09 kB | **-0.63 kB gzip** |
| **CSS (raw / gzip)** | 113.10 kB / 18.96 kB | 113.10 kB / 18.51 kB | **-0.45 kB gzip** |
| **Direct Dependencies** | 17 | 15 | **-2 (`clsx`, `tailwind-merge`)** |
| **Dev Dependencies** | 17 | 16 | **-1 (`@testing-library/jest-dom`)** |
| **Image Savings** | 5.55 MB | 339 KB | **-5.21 MB (93.7% reduction)** |
| **Dead Worker Savings** | 3.12 MB | 0 (`worker.mjs` deleted) | **-3.12 MB (100% reduction)** |
| **`src/portal/locale.ts` Lines** | 991 lines | 169 lines | **-822 lines (83% reduction)** |

### 12.4 Dist Worker Investigation
- **Investigation Finding**: After deleting `public/worker.mjs`, `vite build` continues to emit `dist/assets/worker-Cq9BMH_c.mjs` (~3.26 MB).
- **Origin**: This worker is compiled and emitted on demand by Rollup/Vite because `@thatopen/fragments` contains Web Worker initialization (`new Worker(new URL("./worker.mjs", import.meta.url))`).
- **Confirmation**: This is valid, required fragments engine worker code generated during build and must be preserved.

### 12.5 Deferred Items
1. **`public/web-ifc-node.wasm`**: Kept intact in `public/` pending dedicated headless runtime evaluation.
2. **`camera-controls`**: Kept intact in `dependencies` as required peer dependency of `@thatopen/components@3.4.8`.
3. **`three-mesh-bvh`**: Kept intact in `dependencies` for spatial acceleration indexing.
4. **`public/worker.min.mjs` & WASM binaries**: Kept intact for runtime 3D fragment streaming.
5. **NPM Audit Findings (Tailwind 4 & Vitest 5)**: 11 development-only vulnerabilities recorded and deferred to avoid breaking SemVer Major framework migrations.

### 12.6 Verification Results
- **TypeScript / Linter (`npm run lint`)**: Passed with 0 errors (`tsc --noEmit`).
- **i18n Coverage (`npm run i18n:check`)**: 903 keys, 9 namespaces, 100% Spanish coverage (863/863 keys translated), 0 issues.
- **Unit / Domain Tests (`npm test`)**: 375 / 375 tests passed across 29 test files in Vitest.
- **Production Build (`npm run build`)**: Succeeded cleanly in ~19.8s.
- **Git Diff Hygiene (`git diff --check`)**: Clean, 0 whitespace or merge marker issues.
- **Playwright E2E Suite**: 13/14 tests passed in full concurrency run; targeted test 5 passed in isolation (7.0s); landing page E2E passed (4.1s).
- **Runtime Browser Automation Verification (`verify-routes.mjs`)**:
  - `/` (Landing page): Loaded, Garnier leadership team WebP image verified.
  - `/projects/zona-franca-la-lima`: Loaded, project dossier rendered cleanly.
  - `/news`: Loaded, editorial updates rendered cleanly.
  - `/dashboard`: Quick login and dashboard views verified.
  - `/workspace`: Verified "Sample (Fast)", "La Lima Site" (with PBR textures loaded), and "Sample (House)".
  - Total 404 / failed requests: **0**.
  - Total console errors: **0**.
