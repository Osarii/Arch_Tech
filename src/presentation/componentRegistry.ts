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
  screenCopy: string;
  visualAction?: string;
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
    id: 'problem', number: '01', headline: 'THE PROBLEM', section: 'The Problem',
    supporting: 'A large-scale development can hold every answer and still leave nobody with the complete picture.',
    screenCopy: 'COMPLEX DEVELOPMENT.\nFRAGMENTED INFORMATION.', visualAction: 'Landing focus',
    componentIds: ['landing-hero'],
    narrationEs: 'Un desarrollo de gran escala reúne diseño, infraestructura, planificación, operación, documentos y cientos de decisiones. El problema aparece cuando toda esa información vive en lugares diferentes.',
    narrationEn: 'A large-scale development brings together design, infrastructure, planning, operations, documents, and hundreds of decisions. The problem appears when that information lives in different places.',
  },
  {
    id: 'consequence', number: '02', headline: 'THE CONSEQUENCE', section: 'The Consequence',
    supporting: 'Disconnected information makes the real state of a project harder to understand.',
    screenCopy: 'CONTEXT LOST.\nCOORDINATION SLOWS.', visualAction: 'Project focus',
    componentIds: ['landing-hero', 'portal'],
    narrationEs: 'Cuando equipos, información y decisiones están desconectados, aumenta el tiempo de coordinación, se pierde contexto y es más difícil entender el estado real de un proyecto.',
    narrationEn: 'When teams, information, and decisions are disconnected, coordination takes longer, context is lost, and the real state of a project becomes harder to understand.',
  },
  {
    id: 'solution', number: '03', headline: 'THE SOLUTION', section: 'The Solution',
    supporting: 'ARCH_TECH creates one connected environment for complex development.',
    screenCopy: 'ONE CONNECTED ENVIRONMENT.', visualAction: 'ARCH_TECH reveal',
    componentIds: ['landing-hero', 'portal'],
    narrationEs: 'ARCH_TECH propone un entorno digital conectado para gestionar proyectos complejos desde una sola plataforma.',
    narrationEn: 'ARCH_TECH proposes a connected digital environment for managing complex projects from one platform.',
  },
  {
    id: 'multiple-perspectives', number: '04', headline: 'MULTIPLE PERSPECTIVES', section: 'Platform',
    supporting: 'One project, with workspaces shaped around each responsibility.',
    screenCopy: 'ADMIN.\nARCHITECT.\nCLIENT.', visualAction: 'Portal roles',
    componentIds: ['portal', 'kpi-cards'],
    narrationEs: 'Administradores, arquitectos y clientes acceden al mismo proyecto desde perspectivas diseñadas para sus responsabilidades.',
    narrationEn: 'Administrators, architects, and clients access the same project from perspectives designed for their responsibilities.',
    route: '/dashboard',
  },
  {
    id: 'project-intelligence', number: '05', headline: 'PROJECT INTELLIGENCE', section: 'Project Intelligence',
    supporting: 'Current project signals gain useful site and delivery context.',
    screenCopy: 'DATA IN CONTEXT.', visualAction: 'La Lima context',
    componentIds: ['kpi-cards', 'site-intelligence'],
    narrationEs: 'Los datos dejan de ser registros aislados. Se convierten en información contextual sobre proyectos, avances, decisiones y condiciones del sitio.',
    narrationEn: 'Data stops being isolated records. It becomes contextual information about projects, progress, decisions, and site conditions.',
    route: '/admin/overview',
  },
  {
    id: 'digital-project', number: '06', headline: 'DIGITAL PROJECT', section: 'La Lima BIM',
    supporting: 'A masterplan becomes a space for inspection, discussion, and alignment.',
    screenCopy: 'DATA BECOMES SPACE.', visualAction: 'La Lima masterplan',
    componentIds: ['bim-viewer', 'saved-views'],
    narrationEs: 'Y cuando esa información se conecta con el modelo tridimensional, el proyecto deja de ser solamente una lista de datos.',
    narrationEn: 'When that information connects to the three-dimensional model, the project stops being only a list of data.',
    route: '/workspace',
  },
  {
    id: 'bim-exploration', number: '07', headline: 'BIM EXPLORATION', section: 'BIM Exploration',
    supporting: 'Every relevant element can be explored with technical context close at hand.',
    screenCopy: 'EXPLORE.\nSELECT.\nUNDERSTAND.', visualAction: 'Explorer and inspector',
    componentIds: ['model-explorer', 'search', 'inspector', 'selection', 'multi-selection'],
    narrationEs: 'ARCH_TECH permite explorar el desarrollo directamente desde el modelo. Cada elemento puede relacionarse con información técnica y contexto del proyecto.',
    narrationEn: 'ARCH_TECH lets teams explore the development directly from the model. Each element can connect to technical information and project context.',
    route: '/workspace', bimAction: 'explorer',
  },
  {
    id: 'analysis', number: '08', headline: 'ANALYSIS', section: 'BIM Analysis',
    supporting: 'Measure, inspect, isolate, and understand the project without leaving its digital environment.',
    screenCopy: 'MEASURE.\nINSPECT.\nUNDERSTAND.', visualAction: 'Measurement and section tools',
    componentIds: ['distance', 'polyline', 'area', 'section-plane'],
    narrationEs: 'El modelo también se convierte en una herramienta de análisis: medir, inspeccionar, aislar y comprender el proyecto sin abandonar el entorno digital.',
    narrationEn: 'The model also becomes an analysis tool: measure, inspect, isolate, and understand the project without leaving the digital environment.',
    route: '/workspace', bimAction: 'measure',
  },
  {
    id: 'visual-engine', number: '09', headline: 'VISUAL ENGINE', section: 'Visual Engine',
    supporting: 'One model can serve technical work and executive communication.',
    screenCopy: 'DAY → OVERCAST.\nBALANCED → PRESENTATION.', visualAction: 'Lighting and quality profiles',
    componentIds: ['day-overcast', 'quality-profiles'],
    narrationEs: 'La visualización puede adaptarse tanto al trabajo técnico como a la comunicación ejecutiva del proyecto.',
    narrationEn: 'Visualization can adapt to both technical work and executive communication about the project.',
    route: '/workspace', bimAction: 'lighting',
  },
  {
    id: 'artificial-intelligence', number: '10', headline: 'ARTIFICIAL INTELLIGENCE', section: 'Intelligence',
    supporting: 'Contextual guidance is ready to discuss the project in front of the user.',
    screenCopy: 'GARNIER ASSISTANT', visualAction: 'Assistant focus',
    componentIds: ['arch-assistant'],
    narrationEs: 'Sobre este contexto aparece una nueva capa: inteligencia artificial capaz de conversar sobre el proyecto y asistir al usuario utilizando la información que está viendo.',
    narrationEn: 'On this context, a new layer appears: artificial intelligence able to discuss the project and assist the user using the information in view.',
  },
  {
    id: 'interactive-explanation', number: '11', headline: 'INTERACTIVE EXPLANATION', section: 'Explore Mode',
    supporting: 'The platform can explain its systems as clearly as it presents the project.',
    screenCopy: 'EXPLORE.\nUNDERSTAND.\nASK.', visualAction: 'Explore registered components',
    componentIds: ['landing-hero', 'portal', 'kpi-cards', 'site-intelligence', 'bim-viewer', 'model-explorer', 'search', 'inspector', 'selection', 'distance', 'section-plane', 'day-overcast', 'arch-assistant'],
    narrationEs: 'Y ARCH_TECH no solamente puede presentar el proyecto. También puede explicar cómo funciona.',
    narrationEn: 'ARCH_TECH can do more than present the project. It can also explain how it works.',
  },
  {
    id: 'vision', number: '12', headline: 'THE VISION', section: 'The Vision',
    supporting: 'Bring information, people, and the physical project closer together.',
    screenCopy: 'INFORMATION.\nPEOPLE.\nPROJECT.', visualAction: 'Masterplan return',
    componentIds: ['bim-viewer', 'portal'],
    narrationEs: 'La visión es sencilla: reducir la distancia entre información, personas y proyecto físico.',
    narrationEn: 'The vision is simple: reduce the distance between information, people, and the physical project.',
    route: '/workspace',
  },
  {
    id: 'closing', number: '13', headline: 'CLOSING', section: 'Closing',
    supporting: 'One connected environment for complex development, from opportunity to operation.',
    screenCopy: 'ARCH_TECH\nONE CONNECTED ENVIRONMENT\nFOR COMPLEX DEVELOPMENT.\nFROM OPPORTUNITY TO OPERATION.', visualAction: 'Brand closing',
    componentIds: ['landing-hero', 'portal', 'bim-viewer', 'arch-assistant'],
    narrationEs: 'ARCH_TECH. Un entorno conectado para comprender, coordinar y desarrollar proyectos complejos, desde la oportunidad hasta la operación.',
    narrationEn: 'ARCH_TECH. One connected environment to understand, coordinate, and develop complex projects, from opportunity to operation.',
  },
];

export const getPresentationComponent = (id: string | null): PresentationComponent | null => {
  if (!id) return null;
  return presentationComponentsWithAlias.find((component) => component.id === id) ?? null;
};
