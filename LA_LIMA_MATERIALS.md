# La Lima Material System

The La Lima Concept Site uses a small shared Three.js material palette backed by local 512 px PBR textures. The source assets were acquired through the installed local mat-vis workflow and are served only from `/materials/la-lima/` at runtime.

## Material Sources

| Site use | Material key | Source | Material ID | Tier | Downloaded channels | Local path | Three.js material | Visual settings |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Main roads | `roadAsphalt` | ambientCG | `Asphalt007` | 512 | color, normal | `public/materials/la-lima/road-asphalt/` | `MeshStandardMaterial` | Repeat 48; roughness 0.94; normal scale 0.35 |
| Parking | `parkingAsphalt` | ambientCG | `Asphalt005` | 512 | color, normal | `public/materials/la-lima/parking-asphalt/` | `MeshStandardMaterial` | Repeat 20; roughness 0.91; normal scale 0.30 |
| Landscape | `grass` | ambientCG | `Grass001` | 512 | color | `public/materials/la-lima/grass/` | `MeshStandardMaterial` | Repeat 32; roughness 0.94 |
| Loading and logistics concrete | `industrialConcrete` | ambientCG | `Concrete003` | 512 | color, normal | `public/materials/la-lima/industrial-concrete/` | `MeshStandardMaterial` | Repeat 12; roughness 0.88; normal scale 0.25 |
| Corporate buildings | `corporateConcrete` | Poly Haven | `brushed_concrete` | 512 | color, normal | `public/materials/la-lima/corporate-concrete/` | `MeshStandardMaterial` | Repeat 10; roughness 0.80; normal scale 0.24 |
| Industrial panels | `industrialMetal` | ambientCG | `CorrugatedSteel005` | 512 | color, normal, metalness | `public/materials/la-lima/industrial-metal/` | `MeshStandardMaterial` | Repeat 18; roughness 0.55; metalness 0.68 |
| Corporate glazing | `corporateFacade` | ambientCG | `Facade001` | 512 | color, normal, metalness | `public/materials/la-lima/corporate-facade/` | Opaque `MeshStandardMaterial` | Repeat 6; dark blue-gray tint; roughness 0.28; no transmission |
| Profiled roofs | `roofProfile` | Poly Haven | `box_profile_metal_sheet` | 512 | normal, roughness, metalness | `public/materials/la-lima/roof-profile/` | `MeshStandardMaterial` | Repeat 24; neutral roof color; red source color map intentionally excluded |

Every listed source reports `CC0-1.0` in the mat-vis catalog metadata. ambientCG entries do not include named authors. Poly Haven attributes `brushed_concrete` to Dario Barresi and Dimitrios Savva, and `box_profile_metal_sheet` to Amal Kumar. Source records:

- [ambientCG Asphalt007](https://ambientcg.com/a/Asphalt007)
- [ambientCG Asphalt005](https://ambientcg.com/a/Asphalt005)
- [ambientCG Grass001](https://ambientcg.com/a/Grass001)
- [ambientCG Concrete003](https://ambientcg.com/a/Concrete003)
- [Poly Haven brushed_concrete](https://polyhaven.com/a/brushed_concrete)
- [ambientCG CorrugatedSteel005](https://ambientcg.com/a/CorrugatedSteel005)
- [ambientCG Facade001](https://ambientcg.com/a/Facade001)
- [Poly Haven box_profile_metal_sheet](https://polyhaven.com/a/box_profile_metal_sheet)

Color textures use `THREE.SRGBColorSpace`. Normal, roughness, and metalness textures use `THREE.NoColorSpace`. All textures use `THREE.RepeatWrapping`; omitted roughness channels use explicit scalar roughness values. No displacement, height, transmission, preview, or runtime upstream requests are used.

## Site Object Mapping

| Site object | Runtime material key | Notes |
| --- | --- | --- |
| `SiteBase` | `terrain` | Untextured neutral site substrate |
| `GreenBuffers` | `grass` | Shared with the corporate landscape pad |
| `RoadSurfaces` | `roadAsphalt` | Asphalt007 color and normal detail |
| `RoadMarkings` | `roadMarking` | Shared `MeshBasicMaterial` |
| `IndustrialWarehouses` | `industrialPanel` | Alias of the shared `industrialMetal` material |
| `IndustrialWarehouseRoofs` | `industrialRoof` | Neutral color plus roofProfile structural maps |
| `LoadingDocks` | `loadingDock` | Alias of `industrialConcrete` |
| `IndustrialDockDoors` | `darkMetal` | Shared opaque metal |
| `IndustrialSkylights` | `corporateFacade` | Opaque dark glass-like treatment |
| `MultitenantBuilding` | `industrialPanel` | Shared industrial panel material |
| `MultitenantRoof` | `industrialRoof` | Shared roof material |
| `LogisticsYards` | `industrialConcrete` | Concrete003 color and normal detail |
| `LogisticsDockDoors` | `darkMetal` | Shared opaque metal |
| `CorporateDistrictPad` | `grass` | Shared landscape material |
| `CorporateBuildings` | `corporateConcrete` | Poly Haven brushed concrete |
| `CorporateRoofs` | `industrialRoof` | Shared neutral profiled roof |
| `CorporateGlassBands` | `corporateFacade` | Opaque Facade001 treatment |
| `CorporateEntrances` | `corporateFacade` | Shared facade material |
| `ParkingPads` | `parkingAsphalt` | Asphalt005 color and normal detail |
| `ParkingLines` | `parkingMarking` | Shared `MeshBasicMaterial` |
| `ParkingMedians` | `industrialConcrete` | Shared concrete material |

The runtime palette exposes 14 semantic keys backed by 12 unique material instances. `industrialPanel`/`industrialMetal` and `loadingDock`/`industrialConcrete` deliberately share instances.

## Local Asset Structure

```text
public/materials/la-lima/
  road-asphalt/             color.png, normal.png
  parking-asphalt/          color.png, normal.png
  grass/                    color.png
  industrial-concrete/      color.png, normal.png
  corporate-concrete/       color.png, normal.png
  industrial-metal/         color.png, normal.png, metalness.png
  corporate-facade/         color.png, normal.png, metalness.png
  roof-profile/             normal.png, roughness.png, metalness.png
```

## Regenerating Materials

```bash
source /Users/osariii/Documents/arch_tech-tools/.venv-materials/bin/activate
cd /Users/osariii/Documents/arch_tech
python scripts/materials/fetch_la_lima_materials.py
```

The acquisition script derives the project root from its own location and contains no machine-specific Python path. It inspects channels before downloading, skips missing optional channels, and rewrites only the known PNG assets in each La Lima material directory.

## Performance

| Metric | Result |
| --- | ---: |
| Texture tier | 512 px |
| Local texture files / runtime texture objects | 18 / 18 |
| Total texture footprint | 6,272,691 bytes (5.98 MiB) |
| Semantic / unique shared materials | 14 / 12 |
| Full-site draw calls | 21 |
| Full-site triangles | 3,564 |
| Shared geometries | 1 |
| Isometric validation FPS | 23 FPS in Playwright headless Chromium |

The headless FPS figure uses a software-driven automated browser and is not directly comparable with the 105–120 FPS interactive hardware baseline. Draw calls, triangle count, geometry count, and texture footprint are the stable comparison metrics. The previous site used approximately 15 draw calls and 2,664 triangles; the added facade, skylight, dock, entrance, and median detail remains below the 25 draw call and 10,000 triangle budgets.
