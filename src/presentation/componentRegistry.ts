export type PresentationComponent = {
  id: string;
  label: string;
  section: string;
  purpose: string;
  technicalSummary: string;
  dataFlow: string;
  sourceFiles: string[];
  technologies: string[];
  assistantContext: string;
};

export type PresentationChapter = {
  id: string;
  number: string;
  headline: string;
  supporting: string;
  section: string;
  componentIds: string[];
  narrationEs: string;
  narrationEn: string;
  route?: string;
  bimAction?: string;
};

export type PresentationAssistantContext = {
  chapter: string;
  section: string;
  projectContext: string;
  currentComponent: PresentationComponent | null;
  selectedBimContext?: string;
  route?: string;
};

export const presentationComponents: PresentationComponent[] = [
  {
    id: 'landing-hero',
    label: 'Landing Hero',
    section: 'Public Experience',
    purpose: 'Establishes ARCH_TECH as the premier platform for large-scale development and infrastructure.',
    technicalSummary: 'Editorial hero composition with bilingual routing, responsive spatial project carousel, and accessibility-first motion.',
    dataFlow: 'Locale provider → Hero component → featured project dossiers → interactive portal entry.',
    sourceFiles: ['src/components/landing/Hero.tsx', 'src/pages/public/LandingPage.tsx'],
    technologies: ['React 19', 'i18next', 'Tailwind CSS', 'Framer Motion primitives'],
    assistantContext: 'The landing hero introduces large-scale development and routes visitors into the public portfolio and presentation.',
  },
  {
    id: 'portal',
    label: 'Portal',
    section: 'Platform Workspaces',
    purpose: 'Coordinates development delivery across Client, Architect, and Admin roles in authenticated workspaces.',
    technicalSummary: 'Role-scoped shell with guarded routes, durable JSON Server / localStorage snapshot persistence (Schema v4).',
    dataFlow: 'Session auth → route guard → PortalShell → unified project & milestone services.',
    sourceFiles: ['src/components/portal/PortalShell.tsx', 'src/router/AppRouter.tsx', 'src/portal/data.ts'],
    technologies: ['React Router DOM', 'Zustand', 'localStorage', 'JSON Server'],
    assistantContext: 'The portal coordinates complex project deliverables across specialized roles in a single environment.',
  },
  {
    id: 'kpi-cards',
    label: 'KPI Cards',
    section: 'Project Intelligence',
    purpose: 'Renders objective operational signals, pending approvals, and development progress at a glance.',
    technicalSummary: 'Deterministic calculation classifying projects into PRIORITY, ATTENTION, or INFO signals without black-box estimation.',
    dataFlow: 'Project database → portfolioInsightsService → deterministic derivation → admin KPI dashboard.',
    sourceFiles: ['src/pages/admin/AdminOverviewPage.tsx', 'src/services/portfolioInsightsService.ts'],
    technologies: ['TypeScript', 'React 19'],
    assistantContext: 'KPI cards provide objective operational signals; they do not forecast speculative outcomes.',
  },
  {
    id: 'site-intelligence',
    label: 'Site Intelligence',
    section: 'Project Intelligence',
    purpose: 'Supplies live environmental observations (geocoding, weather, seismic activity) for site planning.',
    technicalSummary: 'Resilient multi-provider service aggregating OpenStreetMap Nominatim, Open-Meteo, and USGS Earthquake Catalog.',
    dataFlow: 'Site location query → external provider APIs → normalized context cache → UI panel.',
    sourceFiles: ['src/components/portal/PortalCommon.tsx', 'src/services/externalContextService.ts'],
    technologies: ['Open-Meteo', 'OpenStreetMap', 'USGS Earthquake API'],
    assistantContext: 'Site Intelligence integrates real-world geographical and environmental context for site coordination.',
  },
  {
    id: 'bim-viewer',
    label: 'BIM Viewer',
    section: 'OpenBIM / 3D Engine',
    purpose: 'Renders large-scale developments and authentic ISO STEP-21 IFC models in real-time WebGL.',
    technicalSummary: 'WebGL canvas lifecycle wrapping That Open Components, Fragments, and Three.js with hardware-safe defaults.',
    dataFlow: 'IFC or La Lima geometric definitions → BimEngine → Fragment Manager → Three.js scene graph.',
    sourceFiles: ['src/components/bim/BimViewport.tsx', 'src/bim/engine/BimEngine.ts'],
    technologies: ['Three.js', 'That Open Components', 'WebIFC WASM'],
    assistantContext: 'The BIM Viewer is a technical workspace for inspecting IFC models and the La Lima concept site.',
  },
  {
    id: 'model-explorer',
    label: 'Model Explorer',
    section: 'BIM Exploration',
    purpose: 'Navigates spatial hierarchies and scene elements through a searchable, structured register.',
    technicalSummary: 'Groups elements by zone, category, or IFC spatial container and bidirectionally syncs with 3D selection.',
    dataFlow: 'Scene metadata → ModelInteraction → spatial tree state → 3D mesh highlighting.',
    sourceFiles: ['src/components/bim/BimModelExplorer.tsx', 'src/bim/interaction/modelInteraction.ts'],
    technologies: ['React', 'Zustand', 'Three.js'],
    assistantContext: 'Model Explorer displays the real project hierarchy and keeps selections in sync with the 3D viewport.',
  },
  {
    id: 'search',
    label: 'Search',
    section: 'BIM Exploration',
    purpose: 'Filters elements instantly by name, classification, zone, structural type, or identifier.',
    technicalSummary: 'Debounced multi-attribute metadata filter executing client-side across active scene elements.',
    dataFlow: 'Search query → filter predicate → filtered tree list → targeted element focus.',
    sourceFiles: ['src/components/bim/BimModelExplorer.tsx', 'src/bim/interaction/modelInteraction.ts'],
    technologies: ['TypeScript', 'React'],
    assistantContext: 'Search filters real element metadata without modifying scene geometry.',
  },
  {
    id: 'inspector',
    label: 'Inspector',
    section: 'BIM Exploration',
    purpose: 'Displays engineering parameters, dimensions, materials, and lifecycle status for selected elements.',
    technicalSummary: 'Reads extracted IFC property sets or procedural scene metadata and formats units accurately.',
    dataFlow: 'Selected element ID → propertyExtractor → normalized property groups → PropertiesPanel.',
    sourceFiles: ['src/components/panels/PropertiesPanel.tsx', 'src/bim/properties/propertyExtractor.ts'],
    technologies: ['WebIFC', 'React', 'Zustand'],
    assistantContext: 'The Inspector surfaces verified engineering properties and dimensions directly from model data.',
  },
  {
    id: 'selection',
    label: 'Selection',
    section: 'BIM Exploration',
    purpose: 'Connects viewport click gestures to focused inspection, highlighting, and contextual tooling.',
    technicalSummary: 'Raycasting with bounding volume hierarchy (BVH) and non-destructive overlay highlight meshes.',
    dataFlow: 'Viewport pointer click → raycast intersection → useBimStore selectedElement → inspector update.',
    sourceFiles: ['src/bim/engine/BimEngine.ts', 'src/bim/interaction/modelInteraction.ts'],
    technologies: ['Three.js', 'three-mesh-bvh', 'That Open Components'],
    assistantContext: 'Selection links 3D geometry directly to the Inspector and Model Explorer.',
  },
  {
    id: 'multi-selection',
    label: 'Multi-selection',
    section: 'BIM Exploration',
    purpose: 'Enables batch selection of multiple elements for collective focus, hiding, or isolation.',
    technicalSummary: 'Modifier-assisted selection maintaining a deterministic Set of selected element IDs.',
    dataFlow: 'Shift + Click → toggle ID in selectedSceneElementIds → multi-highlight overlay.',
    sourceFiles: ['src/bim/interaction/modelInteraction.ts', 'src/components/bim/BimInteractionPanel.tsx'],
    technologies: ['Three.js', 'React', 'Zustand'],
    assistantContext: 'Multi-selection lets teams operate on multiple buildings or systems simultaneously.',
  },
  {
    id: 'distance',
    label: 'Distance',
    section: 'BIM Analysis Tools',
    purpose: 'Measures exact point-to-point real-world clearances and spans in meters.',
    technicalSummary: 'Snaps picked world-space vertices, computes Euclidean distance, and renders in-scene dimension lines.',
    dataFlow: 'Two vertex picks → LengthMeasurement component → world distance calculation → 3D line & label.',
    sourceFiles: ['src/bim/engine/BimEngine.ts', 'src/bim/interaction/measurementMath.ts'],
    technologies: ['That Open Components', 'Three.js'],
    assistantContext: 'Distance measurement provides non-destructive physical dimension verification in meters.',
  },
  {
    id: 'polyline',
    label: 'Polyline',
    section: 'BIM Analysis Tools',
    purpose: 'Measures connected multi-segment access routes, roads, and perimeters with live running totals.',
    technicalSummary: 'Continuous point sampling computing cumulative segment lengths with interactive line overlays.',
    dataFlow: 'Sequential picks → polyline state buffer → cumulative length summation → canvas overlay.',
    sourceFiles: ['src/bim/engine/BimEngine.ts', 'src/bim/interaction/measurementMath.ts'],
    technologies: ['Three.js', 'TypeScript'],
    assistantContext: 'Polyline measurement tracks linear paths, site access routes, and perimeters.',
  },
  {
    id: 'area',
    label: 'Area',
    section: 'BIM Analysis Tools',
    purpose: 'Computes polygonal surface areas and building footprints in square meters.',
    technicalSummary: 'Closed polygon vertex loop projected on best-fit plane, computing area via Green theorem / surveyor formula.',
    dataFlow: 'Polygon vertices → 2D projection → polygon area calculation → world-space badge.',
    sourceFiles: ['src/bim/engine/BimEngine.ts', 'src/bim/interaction/measurementMath.ts'],
    technologies: ['That Open Components', 'Three.js'],
    assistantContext: 'Area measurement calculates footprint and parcel surfaces accurately in square meters.',
  },
  {
    id: 'section-plane',
    label: 'Section Plane',
    section: 'BIM Analysis Tools',
    purpose: 'Cuts through facilities and warehouses along X, Y, or Z axes to inspect interior relationships.',
    technicalSummary: 'Stateful GPU clipping planes integrated with material shaders with offset and inversion controls.',
    dataFlow: 'Axis & offset selection → Clipper plane definition → WebGL renderer clippingPlanes state.',
    sourceFiles: ['src/bim/engine/BimEngine.ts', 'src/components/toolbar/BottomToolbar.tsx'],
    technologies: ['Three.js clipping planes', 'That Open Components'],
    assistantContext: 'The section plane provides real-time interior visibility without modifying model geometry.',
  },
  {
    id: 'saved-views',
    label: 'Saved Views',
    section: 'BIM Exploration',
    purpose: 'Captures and restores repeatable camera perspectives, targets, and element selection states.',
    technicalSummary: 'Stores camera position, target, projection mode, and active selection locally in Zustand state.',
    dataFlow: 'Capture trigger → camera serialization → saved viewpoint collection → smooth tween restore.',
    sourceFiles: ['src/components/panels/ViewpointsPanel.tsx', 'src/bim/engine/BimEngine.ts'],
    technologies: ['camera-controls', 'Zustand', 'Three.js'],
    assistantContext: 'Saved Views ensure stakeholders return to exact review checkpoints reliably.',
  },
  {
    id: 'day-overcast',
    label: 'Day / Overcast',
    section: 'Visual Engine',
    purpose: 'Toggles between architectural daylight conditions to evaluate facade clarity and solar contact.',
    technicalSummary: 'Adjusts hemispheric sky/ground tints, key directional sun intensity, and atmospheric depth fog.',
    dataFlow: 'Lighting preset toggle → sceneLighting manager → Three.js DirectionalLight and HemisphereLight.',
    sourceFiles: ['src/bim/engine/sceneLighting.ts', 'src/bim/engine/BimEngine.ts'],
    technologies: ['Three.js PBR lighting', 'Linear Fog'],
    assistantContext: 'Day and Overcast presets provide tuned lighting conditions without re-rendering the scene.',
  },
  {
    id: 'quality-profiles',
    label: 'Performance / Balanced / Presentation',
    section: 'Visual Engine',
    purpose: 'Calibrates DPR, shadow cascades, and rendering depth to the client hardware profile.',
    technicalSummary: 'Configures DPR (1.0 - 1.25), tone mapping, and selective bounded shadow cameras for presentations.',
    dataFlow: 'Profile selection → renderQuality manager → WebGLRenderer capability configuration.',
    sourceFiles: ['src/bim/engine/renderQuality.ts', 'src/bim/engine/BimEngine.ts'],
    technologies: ['WebGL 2.0', 'Three.js renderer config'],
    assistantContext: 'Quality profiles guarantee smooth 60fps interaction on standard laptops and high visual fidelity in presentations.',
  },
  {
    id: 'arch-assistant',
    label: 'ARCH Assistant',
    section: 'Platform Intelligence',
    purpose: 'Provides conversational navigation, project intelligence, and contextual BIM understanding.',
    technicalSummary: 'Resilient dual-layer service: communicates with remote n8n AI webhook and falls back to deterministic local knowledge.',
    dataFlow: 'User query + PresentationContext envelope → publicAssistantService → n8n webhook / local fallback.',
    sourceFiles: ['src/components/landing/LandingAssistantLauncher.tsx', 'src/components/ai/GarnierChatShell.tsx', 'src/services/publicAssistantService.ts'],
    technologies: ['React 19', 'n8n webhook integration', 'TypeScript'],
    assistantContext: 'ARCH Assistant answers technical, project, and code questions with live awareness of the active chapter and view.',
  },
];

// Alias for backwards compatibility
export const presentationComponentsWithAlias: PresentationComponent[] = [
  ...presentationComponents,
  {
    ...presentationComponents.find((c) => c.id === 'arch-assistant')!,
    id: 'garnier-assistant',
    label: 'Garnier Assistant',
  },
];

export const presentationChapters: PresentationChapter[] = [
  {
    id: 'arch-tech',
    number: '01',
    headline: 'ARCH_TECH',
    supporting: 'Un entorno conectado para comprender, coordinar y desarrollar proyectos complejos.',
    section: 'Cinematic Introduction',
    componentIds: ['landing-hero'],
    narrationEs:
      'Un proyecto puede tener toda la información necesaria... y aun así nadie tener la imagen completa. Porque el problema no siempre es la falta de información. Es lo que ocurre cuando la información pierde su contexto. El modelo vive en un lugar. Las decisiones, en otro. Los avances, en otro. Y cada equipo termina observando una parte distinta del mismo proyecto. ¿Y si el proyecto volviera a ser el punto donde todo se conecta? Eso es ARCH_TECH. Información. Personas. BIM. Decisiones. Inteligencia. Un solo contexto.',
    narrationEn:
      'A project can have all the necessary information, yet no one has the complete picture. The problem is what happens when information loses its context. The model lives in one place. Decisions in another. Progress in another. ARCH_TECH brings information, people, BIM, decisions, and intelligence into one connected environment.',
  },
  {
    id: 'platform',
    number: '02',
    headline: 'Platform Architecture',
    supporting: 'Software de grado empresarial para estructurar desarrollos desde la oportunidad hasta la operación.',
    section: 'Platform',
    componentIds: ['landing-hero', 'portal'],
    narrationEs:
      'ARCH_TECH es la plataforma de software que unifica el ciclo completo de desarrollo a gran escala: desde parques industriales y distritos corporativos hasta infraestructura crítica.',
    narrationEn:
      'ARCH_TECH is the enterprise software platform unifying large-scale development lifecycles from industrial campuses to critical infrastructure.',
    route: '/',
  },
  {
    id: 'garnier-workspace',
    number: '03',
    headline: 'Garnier Architecture Workspace',
    supporting: 'Espacios de trabajo coordinados para clientes, arquitectos y administración.',
    section: 'Workspace',
    componentIds: ['portal', 'kpi-cards'],
    narrationEs:
      'Dentro de ARCH_TECH, organizaciones como Garnier Architecture coordinan clientes, arquitectos y administración en espacios de trabajo especializados pero conectados.',
    narrationEn:
      'Within ARCH_TECH, enterprise organizations like Garnier Architecture coordinate clients, architects, and administrators in specialized yet synchronized workspaces.',
    route: '/dashboard',
  },
  {
    id: 'la-lima-project',
    number: '04',
    headline: 'Zona Franca La Lima',
    supporting: 'Parque industrial y tecnológico de 2.5 millones de m² con seguimiento unificado de hitos.',
    section: 'Projects',
    componentIds: ['portal'],
    narrationEs:
      'Cada proyecto, como Zona Franca La Lima, consolida planos, especificaciones técnicas, hitos de entrega y aprobaciones en un único registro verificable.',
    narrationEn:
      'Every project, such as La Lima Free Zone, consolidates drawings, technical specifications, delivery milestones, and approvals into a single source of truth.',
    route: '/projects/la-lima',
  },
  {
    id: 'project-intelligence',
    number: '05',
    headline: 'Project Intelligence',
    supporting: 'Métricas deterministas de portafolio y contexto ambiental de sitio en tiempo real.',
    section: 'Intelligence',
    componentIds: ['kpi-cards', 'site-intelligence'],
    narrationEs:
      'Inteligencia determinista sobre el portafolio: KPIs operativos, control riguroso de aprobaciones y contexto ambiental en tiempo real con datos de clima y sismicidad.',
    narrationEn:
      'Deterministic portfolio intelligence: operational KPIs, approval governance, and real-time site environmental telemetry including weather and seismicity.',
    route: '/admin/overview',
  },
  {
    id: 'bim-3d',
    number: '06',
    headline: 'BIM / 3D Engine',
    supporting: 'Capacidad OpenBIM nativa en WebGL para visualización fluida de modelos IFC y masterplans.',
    section: 'BIM / 3D',
    componentIds: ['bim-viewer', 'saved-views'],
    narrationEs:
      'Capacidad OpenBIM nativa en WebGL. Visualización y navegación fluida del masterplan tridimensional sin dependencias propietarias ni plugins externos.',
    narrationEn:
      'Native OpenBIM capability in WebGL. High-performance 3D visualization and navigation of complex masterplans without proprietary plugins.',
    route: '/workspace',
  },
  {
    id: 'model-explorer-inspector',
    number: '07',
    headline: 'Model Explorer + Inspector',
    supporting: 'Estructura espacial ISO STEP-21, búsqueda por metadatos y aislamiento instantáneo.',
    section: 'BIM Exploration',
    componentIds: ['model-explorer', 'search', 'inspector', 'selection', 'multi-selection'],
    narrationEs:
      'El Explorador de Modelos y el Inspector extraen la estructura espacial ISO STEP-21. Búsqueda por metadatos, selección múltiple, ocultamiento y aislamiento instantáneo.',
    narrationEn:
      'The Model Explorer and Inspector extract ISO STEP-21 spatial structures, supporting metadata search, multi-selection, hiding, and instant element isolation.',
    route: '/workspace',
    bimAction: 'explorer',
  },
  {
    id: 'bim-analysis-tools',
    number: '08',
    headline: 'BIM Analysis Tools',
    supporting: 'Medición directa de distancias, polilíneas, áreas y planos de corte dinámicos.',
    section: 'BIM Analysis',
    componentIds: ['distance', 'polyline', 'area', 'section-plane'],
    narrationEs:
      'Herramientas de precisión para análisis en obra: medición directa de distancias, polilíneas de recorridos, cálculo de áreas y planos de sección dinámicos.',
    narrationEn:
      'Precision analysis tools: direct distance measurement, polyline access routes, area calculation, and dynamic section planes.',
    route: '/workspace',
    bimAction: 'measure',
  },
  {
    id: 'visual-engine',
    number: '09',
    headline: 'Visual Engine',
    supporting: 'Iluminación arquitectónica Día / Nublado y perfiles de calidad calibrados.',
    section: 'Visual Engine',
    componentIds: ['day-overcast', 'quality-profiles'],
    narrationEs:
      'Motor de renderizado PBR calibrado con iluminación arquitectónica Día y Nublado, y perfiles de calidad optimizados desde laptops estándar hasta presentaciones de alta fidelidad.',
    narrationEn:
      'Calibrated PBR render engine with architectural Day and Overcast daylight presets, and quality profiles optimized from standard laptops to presentation fidelity.',
    route: '/workspace',
    bimAction: 'lighting',
  },
  {
    id: 'arch-assistant',
    number: '10',
    headline: 'ARCH Assistant',
    supporting: 'Asistencia contextual conectada al proyecto y al visor BIM con respaldo local.',
    section: 'Intelligence',
    componentIds: ['arch-assistant'],
    narrationEs:
      'ARCH Assistant aporta asistencia contextual conectada a los metadatos del proyecto y al estado del visor BIM, con respuestas deterministas locales si la red no está disponible.',
    narrationEn:
      'ARCH Assistant delivers contextual AI assistance synchronized with project metadata and 3D BIM state, with guaranteed offline fallbacks.',
  },
  {
    id: 'explore-mode',
    number: '11',
    headline: 'Explore Mode',
    supporting: 'Inspección interactiva bajo demanda de la arquitectura, flujos de datos y código fuente.',
    section: 'Explore Mode',
    componentIds: [
      'landing-hero',
      'portal',
      'kpi-cards',
      'site-intelligence',
      'bim-viewer',
      'model-explorer',
      'search',
      'inspector',
      'selection',
      'distance',
      'section-plane',
      'day-overcast',
      'arch-assistant',
    ],
    narrationEs:
      'El Modo Exploración permite inspeccionar la arquitectura de software, flujos de datos y archivos fuente reales detrás de cada componente de la plataforma.',
    narrationEn:
      'Explore Mode allows stakeholders to inspect the software architecture, data flows, and authentic source files behind every platform component.',
  },
  {
    id: 'closing',
    number: '12',
    headline: 'Closing',
    supporting: 'ONE CONNECTED ENVIRONMENT FOR COMPLEX DEVELOPMENT. FROM OPPORTUNITY TO OPERATION.',
    section: 'Closing',
    componentIds: ['landing-hero', 'portal', 'bim-viewer', 'arch-assistant'],
    narrationEs:
      'ARCH_TECH. Un entorno conectado para comprender, coordinar y desarrollar proyectos complejos. Desde la oportunidad... hasta la operación.',
    narrationEn:
      'ARCH_TECH. One connected environment to understand, coordinate, and deliver complex developments. From opportunity to operation.',
  },
];

export const getPresentationComponent = (id: string | null): PresentationComponent | null => {
  if (!id) return null;
  return presentationComponentsWithAlias.find((component) => component.id === id) ?? null;
};
