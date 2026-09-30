# BIM Context & That Open 3.4 Compatibility Guide

## Core Packages
- `@thatopen/components`: `^3.4.8`
- `@thatopen/components-front`: `^3.4.4`
- `@thatopen/fragments`: `^3.4.7`
- `web-ifc`: `^0.0.78`
- `three`: `^0.182.0`

## Initialization & World Architecture
- `components = new OBC.Components()`
- `worlds = components.get(OBC.Worlds)`
- `world = worlds.create<OBC.SimpleScene, OBC.OrthoPerspectiveCamera, OBC.SimpleRenderer>()`
- Scene: `world.scene = new OBC.SimpleScene(components)`
- Camera: `world.camera = new OBC.OrthoPerspectiveCamera(components)`
- Renderer: `world.renderer = new OBC.SimpleRenderer(components, container)`
- `components.init()`

## Fragments & IfcLoader Setup
- `fragments = components.get(OBC.FragmentsManager)`
- `ifcLoader = components.get(OBC.IfcLoader)`
- Local wasm:
  ```ts
  await ifcLoader.setup({
    wasm: {
      path: "/",
      absolute: false,
    },
  });
  ```
- Fragments are models loaded into `fragments.list` (Map of model UUID -> `FragmentsGroup`).

## Selection & Highlighter
- `highlighter = components.get(OBF.Highlighter)`
- `highlighter.setup({ world })`
- `highlighter.highlightByID("select", { [modelId]: new Set([expressID]) })`
- `highlighter.clear("select")`

## Spatial Tree & Properties
- In That Open 3.4, properties and relations are extracted directly using `model.getProperties(expressID)` or through `model.data` / `model.getAllPropertiesOfType()`.
- Relations (`IfcRelContainedInSpatialStructure`, `IfcRelAggregates`, `IfcRelDefinesByProperties`) map Spatial hierarchy: Project -> Site -> Building -> Storey -> Elements.

## Visibility & Hider
- `hider = components.get(OBC.Hider)`
- `hider.set(false, modelIdMap)` hides elements.
- `hider.isolate(modelIdMap)` isolates elements.
- `hider.set(true)` restores all.

## Section Planes (Clipping)
- `clipper = components.get(OBC.Clipper)`
- `clipper.enabled = true`
- `clipper.create(world)` or `clipper.createFromNormalAndCoplanarPoint(world, normal, point)`
- `clipper.deleteAll()`

## Distance Measurement
- `lengthMeasure = components.get(OBF.LengthMeasurement)`
- `lengthMeasure.world = world`
- `lengthMeasure.enabled = true`
- `lengthMeasure.create()`
