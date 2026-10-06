import { useEffect, useState } from 'react';

export type SiteLocale = 'en' | 'es';

export const STORAGE_KEY_LOCALE = 'arch-tech-locale';
export const SUPPORTED_LOCALES: SiteLocale[] = ['en', 'es'];

export function getStoredLocale(): SiteLocale {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY_LOCALE);
    if (saved === 'es' || saved === 'en') return saved;
  } catch {
    // LocalStorage quota or access error
  }
  return 'en';
}

const listeners = new Set<(locale: SiteLocale) => void>();

export function setStoredLocale(locale: SiteLocale): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY_LOCALE, locale);
    document.documentElement.lang = locale;
    window.dispatchEvent(new CustomEvent('arch-tech-locale-change', { detail: locale }));
  } catch {
    // LocalStorage error fallback
  }
  listeners.forEach((listener) => listener(locale));
}

export function subscribeLocale(listener: (locale: SiteLocale) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const landingTranslations = {
  en: {
    navbar: {
      projects: 'Projects',
      capabilities: 'Capabilities',
      about: 'About',
      team: 'Team',
      updates: 'Updates',
      projectPortal: 'Project Portal',
      a11yControls: 'Accessibility controls',
      toggleMenu: 'Toggle menu',
    },
    hero: {
      eyebrow: 'GARNIER ARCHITECTURE / Portfolio Showcase / Concept Prototype',
      headingLine1: 'Development',
      headingLine2: 'at a larger scale.',
      body: 'GARNIER ARCHITECTURE positions and advances free zones, campuses, districts and infrastructure — from first opportunity through delivery and operation.',
      explorePortfolio: 'Explore the portfolio',
      showcaseContext: 'Official project showcase',
      opportunityToOperation: 'Opportunity to operation',
      sectors: [
        'Free zones',
        'Industrial / logistics',
        'Compute + energy infrastructure',
        'Corporate districts',
        'Healthcare campuses',
        'Masterplans',
      ],
    },
    projects: {
      eyebrow: 'GARNIER ARCHITECTURE / Portfolio Showcase / Concept Prototype',
      heading: 'A portfolio built for consequence.',
      description:
        'Six official Garnier developments presented through a GARNIER ARCHITECTURE showcase interface. Public facts and project photography remain attributed to their source.',
      principalBadge: '01 · Principal development · ',
      market: 'Market',
      stage: 'Stage',
      scale: 'Scale',
    },
    news: {
      eyebrow: 'Journal / Project updates',
      heading: 'Latest updates.',
      viewAll: 'View all updates',
    },
    about: {
      eyebrow: 'About / development context',
      heading: 'Development is more than the building.',
      body1:
        'Garnier & Garnier brings 30 years of real-estate development experience in Costa Rica to projects shaped by their market, setting and long-term use.',
      body2:
        'Its public work spans industrial parks and free trade zones, corporate and commercial environments, hospitality and other complex development typologies. The group participates across design, construction, sales and promotion through an integrated development process.',
      sourceCaption: 'Public source image / Garnier & Garnier',
      factualContext: 'Factual context adapted from the official public source / garnier.cr',
      facts: [
        { value: '30 YEARS', label: 'Real-estate development experience' },
        { value: 'COSTA RICA', label: 'Primary market' },
        { value: 'INTEGRATED', label: 'Development approach' },
        { value: 'DESIGN → DELIVERY', label: 'End-to-end project perspective' },
      ],
    },
    capabilities: {
      eyebrow: 'Development capability',
      heading: 'Structure for complex development.',
      description:
        'GARNIER ARCHITECTURE connects site, program, infrastructure, coordination and digital project information into one development framework.',
      items: [
        { number: '01', label: 'SITE + LAND STRATEGY', description: 'Context, access, constraints and development potential.' },
        { number: '02', label: 'MASTERPLANNING', description: 'Program, plots, circulation, phasing and long-term structure.' },
        { number: '03', label: 'INFRASTRUCTURE FRAMEWORK', description: 'Mobility, utilities, servicing and operational systems.' },
        { number: '04', label: 'DEVELOPMENT COORDINATION', description: 'Design, technical information, milestones and decision control.' },
        { number: '05', label: 'DIGITAL PROJECT DELIVERY', description: 'Structured project information and OpenBIM coordination where useful.' },
        { number: '06', label: 'OPERATIONAL CONTINUITY', description: 'Carry development intent from planning into operation and future change.' },
      ],
    },
    team: {
      eyebrow: 'Team / leadership',
      heading: 'The people behind the development.',
      description:
        'A multidisciplinary leadership group connecting strategy, engineering, finance, new business, people and sustainability.',
      leadershipCaption: 'Leadership / Garnier & Garnier',
    },
    development: {
      eyebrow: 'The development lifecycle',
      heading: 'From opportunity to operation.',
      description:
        'The work is a sequence of decisions that connects land, program, delivery and the life of a place over time.',
      stages: [
        { number: '01', label: 'Opportunity', title: 'Read the ground.', body: 'Land, context, market and the operating idea establish the direction before a plan is drawn.' },
        { number: '02', label: 'Structure', title: 'Build the framework.', body: 'Program, movement, landscape and phasing give each development a structure that can grow with its purpose.' },
        { number: '03', label: 'Delivery', title: 'Carry decisions forward.', body: 'A clear development path keeps intent visible as the project advances through design, coordination and delivery.' },
        { number: '04', label: 'Operation', title: 'Make the place last.', body: 'Long-term value is shaped by how a place works, adapts and remains useful after the first opening.' },
      ],
      privatePortalEyebrow: 'Private project portal',
      privatePortalHeading: 'The public portfolio is the beginning of the conversation.',
      privatePortalDescription:
        'Clients follow the working life of their development through a private view of progress, decisions, documents and the next milestone.',
      enterPortal: 'Enter project portal',
    },
    footer: {
      closingEyebrow: 'GARNIER ARCHITECTURE / closing statement',
      closingHeading: 'Built for complex development.',
      closingBody:
        'Development, infrastructure and digital project delivery from first opportunity through long-term operation.',
      directoryEyebrow: 'Directory',
      directoryHeading: 'A clear route through the public experience.',
      exploreGroup: 'Explore',
      platformGroup: 'Platform',
      contextGroup: 'Context',
      projectPortal: 'Project Portal',
      openBim: 'OpenBIM',
      developmentWorkflow: 'Development Workflow',
      contextCountry: 'Costa Rica',
      contextShowcase: 'Garnier & Garnier Showcase',
      contextPrototype: 'Concept Prototype',
      wordmark: 'GARNIER ARCHITECTURE / public development platform',
      copyright: '© 2026 GARNIER ARCHITECTURE',
      deliverySubtitle: 'Development / Infrastructure / Digital Delivery',
      conceptShowcase: 'Concept showcase',
      backToTop: 'Back to top ↑',
    },
  },
  es: {
    navbar: {
      projects: 'Proyectos',
      capabilities: 'Capacidades',
      about: 'Nosotros',
      team: 'Equipo',
      updates: 'Actualizaciones',
      projectPortal: 'Portal de Proyectos',
      a11yControls: 'Controles de accesibilidad',
      toggleMenu: 'Alternar menú',
    },
    hero: {
      eyebrow: 'GARNIER ARCHITECTURE / Muestra de Portafolio / Prototipo Conceptual',
      headingLine1: 'Desarrollo',
      headingLine2: 'a mayor escala.',
      body: 'GARNIER ARCHITECTURE posiciona y desarrolla zonas francas, campus, distritos e infraestructura — desde la primera oportunidad hasta la entrega y operación.',
      explorePortfolio: 'Explorar el portafolio',
      showcaseContext: 'Muestra oficial de proyectos',
      opportunityToOperation: 'De la oportunidad a la operación',
      sectors: [
        'Zonas francas',
        'Industrial / logística',
        'Infraestructura de cómputo + energía',
        'Distritos corporativos',
        'Campus de salud',
        'Planes maestros',
      ],
    },
    projects: {
      eyebrow: 'GARNIER ARCHITECTURE / Muestra de Portafolio / Prototipo Conceptual',
      heading: 'Un portafolio diseñado con propósito.',
      description:
        'Seis desarrollos oficiales de Garnier presentados a través de la interfaz de exhibición GARNIER ARCHITECTURE. Los datos públicos y fotografías de proyectos permanecen atribuidos a su fuente.',
      principalBadge: '01 · Desarrollo principal · ',
      market: 'Mercado',
      stage: 'Etapa',
      scale: 'Escala',
    },
    news: {
      eyebrow: 'Boletín / Actualizaciones de proyecto',
      heading: 'Últimas actualizaciones.',
      viewAll: 'Ver todas las actualizaciones',
    },
    about: {
      eyebrow: 'Nosotros / contexto de desarrollo',
      heading: 'El desarrollo es más que la edificación.',
      body1:
        'Garnier & Garnier aporta 30 años de experiencia en desarrollo inmobiliario en Costa Rica a proyectos moldeados por su mercado, entorno y uso a largo plazo.',
      body2:
        'Su trabajo público abarca parques industriales y zonas francas, entornos corporativos y comerciales, hotelería y otras tipologías de desarrollo complejas. El grupo participa en diseño, construcción, ventas y promoción a través de un proceso integral de desarrollo.',
      sourceCaption: 'Imagen de fuente pública / Garnier & Garnier',
      factualContext: 'Contexto fáctico adaptado de la fuente pública oficial / garnier.cr',
      facts: [
        { value: '30 AÑOS', label: 'Experiencia en desarrollo inmobiliario' },
        { value: 'COSTA RICA', label: 'Mercado principal' },
        { value: 'INTEGRAL', label: 'Enfoque de desarrollo' },
        { value: 'DISEÑO → ENTREGA', label: 'Perspectiva integral de proyecto' },
      ],
    },
    capabilities: {
      eyebrow: 'Capacidades de desarrollo',
      heading: 'Estructura para el desarrollo complejo.',
      description:
        'GARNIER ARCHITECTURE conecta sitio, programa, infraestructura, coordinación e información digital del proyecto en un marco único de desarrollo.',
      items: [
        { number: '01', label: 'ESTRATEGIA DE SITIO + TERRENO', description: 'Contexto, accesos, restricciones y potencial de desarrollo.' },
        { number: '02', label: 'PLANIFICACIÓN MAESTRA', description: 'Programa, lotes, circulación, fases y estructura a largo plazo.' },
        { number: '03', label: 'MARCO DE INFRAESTRUCTURA', description: 'Movilidad, servicios, infraestructura y sistemas operativos.' },
        { number: '04', label: 'COORDINACIÓN DE DESARROLLO', description: 'Diseño, información técnica, hitos y control de decisiones.' },
        { number: '05', label: 'ENTREGA DIGITAL DE PROYECTOS', description: 'Información estructurada de proyecto y coordinación OpenBIM cuando sea conveniente.' },
        { number: '06', label: 'CONTINUIDAD OPERATIVA', description: 'Mantener la intención de desarrollo desde la planificación hasta la operación y adaptaciones futuras.' },
      ],
    },
    team: {
      eyebrow: 'Equipo / liderazgo',
      heading: 'Las personas detrás del desarrollo.',
      description:
        'Un grupo de liderazgo multidisciplinario que conecta estrategia, ingeniería, finanzas, nuevos negocios, talento humano y sostenibilidad.',
      leadershipCaption: 'Liderazgo / Garnier & Garnier',
    },
    development: {
      eyebrow: 'El ciclo de vida del desarrollo',
      heading: 'De la oportunidad a la operación.',
      description:
        'El trabajo es una secuencia de decisiones que conecta tierra, programa, entrega y la vida de un lugar a lo largo del tiempo.',
      stages: [
        { number: '01', label: 'Oportunidad', title: 'Interpretar el territorio.', body: 'El terreno, contexto, mercado y modelo operativo marcan la dirección antes del primer plano.' },
        { number: '02', label: 'Estructura', title: 'Construir el marco.', body: 'Programa, flujos, paisaje y fases dan a cada desarrollo una estructura que evoluciona con su propósito.' },
        { number: '03', label: 'Entrega', title: 'Hacer efectivas las decisiones.', body: 'Una ruta clara mantiene visible la intención conforme el proyecto avanza en diseño, coordinación y entrega.' },
        { number: '04', label: 'Operación', title: 'Hacer perdurar el lugar.', body: 'El valor a largo plazo se define por cómo funciona, se adapta y permanece útil un lugar tras su apertura.' },
      ],
      privatePortalEyebrow: 'Portal privado de proyecto',
      privatePortalHeading: 'El portafolio público es el inicio de la conversación.',
      privatePortalDescription:
        'Los clientes siguen el ciclo activo de su desarrollo mediante una vista privada de avances, decisiones, documentos y próximos hitos.',
      enterPortal: 'Ingresar al portal de proyectos',
    },
    footer: {
      closingEyebrow: 'GARNIER ARCHITECTURE / declaración final',
      closingHeading: 'Construido para el desarrollo complejo.',
      closingBody:
        'Desarrollo, infraestructura y entrega digital de proyectos desde la primera oportunidad hasta la operación a largo plazo.',
      directoryEyebrow: 'Directorio',
      directoryHeading: 'Una ruta clara por la experiencia pública.',
      exploreGroup: 'Explorar',
      platformGroup: 'Plataforma',
      contextGroup: 'Contexto',
      projectPortal: 'Portal de Proyectos',
      openBim: 'OpenBIM',
      developmentWorkflow: 'Flujo de Desarrollo',
      contextCountry: 'Costa Rica',
      contextShowcase: 'Muestra Garnier & Garnier',
      contextPrototype: 'Prototipo Conceptual',
      wordmark: 'GARNIER ARCHITECTURE / public development platform',
      copyright: '© 2026 GARNIER ARCHITECTURE',
      deliverySubtitle: 'Desarrollo / Infraestructura / Entrega Digital',
      conceptShowcase: 'Muestra conceptual',
      backToTop: 'Volver arriba ↑',
    },
  },
} as const;

export const portalAiTranslations = {
  en: {
    heading: 'BIM AI Assistant',
    subtitle: 'Natural language BIM intelligence and coordination engine.',
    helperCopy: 'Natural language BIM intelligence and coordination engine.',
    remoteStatus: 'Remote n8n / offline fallback',
    engineRemote: 'Remote n8n / offline fallback',
    offlineStatus: 'Offline Deterministic Engine',
    engineOffline: 'Offline Deterministic Engine',
    clearHistory: 'Clear History',
    clearHistoryTitle: 'Clear Conversation History',
    quickPromptsLabel: 'Quick prompts:',
    emptyTitle: 'How can the assistant help today?',
    emptyHeading: 'How can the assistant help today?',
    emptyDescription: 'Ask about building quantities, model elements, structural search or massing preview generation.',
    emptySubtitle: 'Ask about building quantities, model elements, structural search or massing preview generation.',
    inputPlaceholder: 'Ask about model quantities, elements or building generation…',
    send: 'Send',
    writeConfirmation: 'WRITE ACTION CONFIRMATION',
    confirm: 'Confirm',
    reject: 'Reject',
    workspaceHeading: '3D Engineering Workspace',
    workspaceSubtitle: 'Open the live WebGL workspace to inspect fragments, property sets, and visual model modifications.',
    openWorkspace: 'Open 3D Model →',
    quickPrompts: {
      client: ['Calculate model quantities', 'Show all elements', 'Isolate walls'],
      architect: [
        'Preview 10x8m 2-storey building, 3m height per storey',
        'Calculate model quantities',
        'Find all walls',
        'Show all elements',
      ],
      admin: [
        'Calculate model quantities',
        'Find all walls',
        'Preview 10x8m 2-storey building, 3m height per storey',
        'Show all elements',
      ],
    },
  },
  es: {
    heading: 'Asistente IA BIM',
    subtitle: 'Motor de inteligencia y coordinación BIM en lenguaje natural.',
    helperCopy: 'Motor de inteligencia y coordinación BIM en lenguaje natural.',
    remoteStatus: 'Remoto n8n / respaldo local',
    engineRemote: 'Remoto n8n / respaldo local',
    offlineStatus: 'Motor determinista local',
    engineOffline: 'Motor determinista local',
    clearHistory: 'Limpiar Historial',
    clearHistoryTitle: 'Limpiar historial de conversación',
    quickPromptsLabel: 'Consultas rápidas:',
    emptyTitle: '¿Cómo puede ayudar el asistente hoy?',
    emptyHeading: '¿Cómo puede ayudar el asistente hoy?',
    emptyDescription: 'Consulte sobre cuantificaciones, elementos del modelo, búsqueda estructural o generación volumétrica preliminar.',
    emptySubtitle: 'Consulte sobre cuantificaciones, elementos del modelo, búsqueda estructural o generación volumétrica preliminar.',
    inputPlaceholder: 'Pregunte sobre cuantificación, elementos o generación volumétrica…',
    send: 'Enviar',
    writeConfirmation: 'CONFIRMACIÓN DE ACCIÓN DE ESCRITURA',
    confirm: 'Confirmar',
    reject: 'Rechazar',
    workspaceHeading: 'Espacio de Trabajo 3D',
    workspaceSubtitle: 'Abra el espacio de trabajo WebGL interactivo para inspeccionar fragmentos, propiedades y modificaciones visuales del modelo.',
    openWorkspace: 'Abrir Modelo 3D →',
    quickPrompts: {
      client: ['Calcular cantidades del modelo', 'Mostrar todos los elementos', 'Aislar muros'],
      architect: [
        'Previsualizar edificio de 10x8m de 2 niveles, 3m de altura por nivel',
        'Calcular cantidades del modelo',
        'Buscar todos los muros',
        'Mostrar todos los elementos',
      ],
      admin: [
        'Calcular cantidades del modelo',
        'Buscar todos los muros',
        'Previsualizar edificio de 10x8m de 2 niveles, 3m de altura por nivel',
        'Mostrar todos los elementos',
      ],
    },
  },
} as const;

export const a11yPanelTranslations = {
  en: {
    title: 'GARNIER ARCHITECTURE // ACCESSIBILITY',
    readingTitle: '// 01 READING & SPEECH',
    visionTitle: '// 02 VISION & DISPLAY',
    motionTitle: '// 03 MOTION',
    fullPageNarrator: 'Full-Page Narrator',
    unsupported: 'Unsupported',
    narrating: 'Narrating',
    paused: 'Paused',
    ready: 'Ready',
    unsupportedDesc: 'SpeechSynthesis is unavailable in this environment.',
    readPage: 'Read Page',
    pause: 'Pause',
    resume: 'Resume',
    stop: 'Stop',
    voiceLabel: 'Voice',
    defaultVoice: 'Default System Voice',
    speedLabel: 'Speed',
    hoverReader: 'Hover Reader',
    hoverReaderDesc: 'Speak and highlight individual words under pointer rest (~150ms)',
    browserUnsupported: 'Browser unsupported',
    spokenWordHighlight: 'Spoken-word Highlight',
    spokenWordHighlightDesc: 'Highlight current word in real time during narration',
    readingGuide: 'Reading Guide',
    readingGuideDesc: 'Horizontal pointer-following ruler to track lines',
    readingMask: 'Reading Mask',
    readingMaskDesc: 'Dim page content outside the active reading band',
    textSize: 'Text Size',
    textSpacing: 'Text Spacing',
    textSpacingDesc: 'Expand letter, word, and line spacing for readability',
    colorSafe: 'Color Safe',
    colorSafeDesc: 'High-distinction status patterns, symbols, and borders',
    highContrast: 'High Contrast',
    highContrastDesc: 'Maximum contrast palette with defined structural borders',
    highlightLinks: 'Highlight Links',
    highlightLinksDesc: 'Prominent underline and indicator styling for interactive links',
    reduceMotion: 'Reduce Motion',
    reduceMotionDesc: 'Disable non-essential animations, transitions, and autoplay',
    resetButton: 'Reset Preferences',
    resetDesc: 'Resets all reading, vision, and motion adjustments to default.',
  },
  es: {
    title: 'GARNIER ARCHITECTURE // ACCESIBILIDAD',
    readingTitle: '// 01 LECTURA Y VOZ',
    visionTitle: '// 02 VISIÓN Y PANTALLA',
    motionTitle: '// 03 MOVIMIENTO',
    fullPageNarrator: 'Narrador de Página Completa',
    unsupported: 'No disponible',
    narrating: 'Narrando',
    paused: 'En pausa',
    ready: 'Listo',
    unsupportedDesc: 'La síntesis de voz no está disponible en este entorno.',
    readPage: 'Leer Página',
    pause: 'Pausar',
    resume: 'Reanudar',
    stop: 'Detener',
    voiceLabel: 'Voz',
    defaultVoice: 'Voz Predeterminada del Sistema',
    speedLabel: 'Velocidad',
    hoverReader: 'Lector al Posar el Cursor',
    hoverReaderDesc: 'Pronuncia y resalta palabras individuales bajo el cursor (~150ms)',
    browserUnsupported: 'No compatible con el navegador',
    spokenWordHighlight: 'Resaltado de Palabra Hablada',
    spokenWordHighlightDesc: 'Resalta la palabra actual en tiempo real durante la narración',
    readingGuide: 'Guía de Lectura',
    readingGuideDesc: 'Regla horizontal que sigue el cursor para guiar las líneas',
    readingMask: 'Máscara de Lectura',
    readingMaskDesc: 'Atenúa el contenido fuera de la franja activa de lectura',
    textSize: 'Tamaño del Texto',
    textSpacing: 'Espaciado del Texto',
    textSpacingDesc: 'Amplía el espaciado entre letras, palabras y líneas para facilitar la lectura',
    colorSafe: 'Seguro para Color',
    colorSafeDesc: 'Patrones, símbolos y bordes de alta diferenciación de estado',
    highContrast: 'Alto Contraste',
    highContrastDesc: 'Paleta de contraste máximo con bordes estructurales definidos',
    highlightLinks: 'Resaltar Enlaces',
    highlightLinksDesc: 'Subrayado e indicadores destacados para enlaces interactivos',
    reduceMotion: 'Reducir Movimiento',
    reduceMotionDesc: 'Desactiva animaciones no esenciales, transiciones y reproducción automática',
    resetButton: 'Restablecer Preferencias',
    resetDesc: 'Restablece todos los ajustes de lectura, visión y movimiento a los valores predeterminados.',
  },
} as const;

export function useLocale() {
  const [locale, setLocaleState] = useState<SiteLocale>(getStoredLocale);

  useEffect(() => {
    const handleLocaleChange = (e: Event) => {
      const customEvent = e as CustomEvent<SiteLocale>;
      if (customEvent.detail && (customEvent.detail === 'en' || customEvent.detail === 'es')) {
        setLocaleState(customEvent.detail);
      } else {
        setLocaleState(getStoredLocale());
      }
    };

    const unsubscribe = subscribeLocale((newLocale) => {
      setLocaleState(newLocale);
    });

    window.addEventListener('arch-tech-locale-change', handleLocaleChange);
    return () => {
      unsubscribe();
      window.removeEventListener('arch-tech-locale-change', handleLocaleChange);
    };
  }, []);

  const changeLocale = (newLocale: SiteLocale) => {
    setStoredLocale(newLocale);
    setLocaleState(newLocale);
  };

  const t = {
    landing: landingTranslations[locale],
    portalAi: portalAiTranslations[locale],
    a11yPanel: a11yPanelTranslations[locale],
  };

  return {
    locale,
    setLocale: changeLocale,
    landing: t.landing,
    portalAi: t.portalAi,
    a11yPanel: t.a11yPanel,
    t,
  };
}
