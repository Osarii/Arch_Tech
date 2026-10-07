# Render Engine V2 benchmark

## Method

Measure each profile in an interactive browser on the target MacBook Pro 2019 / Intel UHD 630 after a five-second settle period. Record the one-second diagnostics sampler for 15 seconds; do not compare headless results with interactive results.

| Scene | Profile | FPS | Frame ms | Calls | Triangles | Geometries | Textures | DPR | Shadows | Visual check |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| Empty workspace | Performance | pending | pending | pending | pending | pending | pending | 0.90–1.25 | Off | Neutral baseline |
| La Lima site | Performance | pending | pending | pending | pending | pending | pending | 0.90–1.25 | Off | Current low-cost baseline |
| La Lima site | Balanced | pending | pending | pending | pending | pending | pending | 0.90–1.25 | 1024 soft, selective | Neutral PBR response and depth separation |
| La Lima site | Quality | pending | pending | pending | pending | pending | pending | 1.00–1.50 | 2048 soft, selective | Comparison mode only |
| Sample Fast | Performance | pending | pending | pending | pending | pending | pending | 0.90–1.25 | Off | IFC baseline |
| Sample Fast | Balanced | pending | pending | pending | pending | pending | pending | 0.90–1.25 | 1024 soft, selective | IFC keeps neutral tonal balance |
| Conceptual IFC (~295 elements) | Performance | 96 observed baseline | 10.4 observed baseline | 14 observed baseline | 5,136 observed baseline | 14 observed baseline | pending | 1.25 | Off | Pre-V2 baseline supplied with task |
| Conceptual IFC (~295 elements) | Balanced | pending | pending | pending | pending | pending | pending | 0.90–1.25 | 1024 soft, selective | Target >=55 FPS |
| Conceptual IFC (~295 elements) | Quality | pending | pending | pending | pending | pending | pending | 1.00–1.50 | 2048 soft, selective | Visual comparison only |

## Resource stability

Switch `Performance → Balanced → Quality → Performance` five times. The renderer retains one hemisphere light, one directional light, and one cached local PMREM target. The Performance profile clears the environment assignment; all resources are disposed with the engine.

## Limits

This repository execution environment has no interactive GPU browser surface. A headless Playwright smoke run reported zero rendered frames, so it is not a valid performance source. New profile measurements remain intentionally unfilled rather than fabricated. The supplied interactive IFC baseline above is preserved for the next target-hardware run.
