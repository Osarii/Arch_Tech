/**
 * ARCH_TECH Centralized Narration Manifest
 * Maps presentation chapters to pre-recorded AI voice-over audio assets,
 * visual captions, and fallback speech texts.
 */

export interface CinematicCue {
  timeSec: number;
  phase: number;
  caption: string;
}

export interface ChapterNarrationManifest {
  chapterId: string;
  chapterNumber: string;
  headline: string;
  section: string;
  audioSrc: string;
  scriptEs: string;
  scriptEn: string;
  fallbackSpeechText: string;
  durationEstimateMs: number;
  pauseAfterMs: number;
  cinematicCues?: CinematicCue[];
}

export const narrationManifest: ChapterNarrationManifest[] = [
  {
    chapterId: 'problem',
    chapterNumber: '01',
    headline: 'THE PROBLEM',
    section: 'The Problem',
    audioSrc: '/presentation/audio/01-problem.mp3',
    scriptEs: 'Un desarrollo de gran escala reúne diseño, infraestructura, planificación, operación, documentos y cientos de decisiones. El problema aparece cuando toda esa información vive en lugares diferentes.',
    scriptEn: 'A large-scale development brings together design, infrastructure, planning, operations, documents, and hundreds of decisions. The problem appears when that information lives in different places.',
    fallbackSpeechText: 'Un desarrollo de gran escala reúne diseño, infraestructura, planificación, operación, documentos y cientos de decisiones. El problema aparece cuando toda esa información vive en lugares diferentes.',
    durationEstimateMs: 30000,
    pauseAfterMs: 1500,
    cinematicCues: [
      { timeSec: 0, phase: 0, caption: 'COMPLEX DEVELOPMENT. FRAGMENTED INFORMATION.' },
      { timeSec: 8, phase: 1, caption: 'El modelo vive en un lugar. Las decisiones, en otro. Los avances, en otro.' }
    ],
  },
  {
    chapterId: 'consequence',
    chapterNumber: '02',
    headline: 'THE CONSEQUENCE',
    section: 'The Consequence',
    audioSrc: '/presentation/audio/02-consequence.mp3',
    scriptEs: 'Cuando equipos, información y decisiones están desconectados, aumenta el tiempo de coordinación, se pierde contexto y es más difícil entender el estado real de un proyecto.',
    scriptEn: 'When teams, information, and decisions are disconnected, coordination takes longer, context is lost, and the real state of a project becomes harder to understand.',
    fallbackSpeechText: 'Cuando equipos, información y decisiones están desconectados, aumenta el tiempo de coordinación, se pierde contexto y es más difícil entender el estado real de un proyecto.',
    durationEstimateMs: 30000,
    pauseAfterMs: 1500,
    cinematicCues: [
      { timeSec: 0, phase: 0, caption: 'CONTEXT LOST. COORDINATION SLOWS.' }
    ],
  },
  {
    chapterId: 'solution',
    chapterNumber: '03',
    headline: 'THE SOLUTION',
    section: 'The Solution',
    audioSrc: '/presentation/audio/03-solution.mp3',
    scriptEs: 'ARCH_TECH propone un entorno digital conectado para gestionar proyectos complejos desde una sola plataforma.',
    scriptEn: 'ARCH_TECH proposes a connected digital environment for managing complex projects from one platform.',
    fallbackSpeechText: 'ARCH_TECH propone un entorno digital conectado para gestionar proyectos complejos desde una sola plataforma.',
    durationEstimateMs: 30000,
    pauseAfterMs: 1500,
    cinematicCues: [
      { timeSec: 0, phase: 0, caption: 'ONE CONNECTED ENVIRONMENT.' }
    ],
  },
  {
    chapterId: 'multiple-perspectives',
    chapterNumber: '04',
    headline: 'MULTIPLE PERSPECTIVES',
    section: 'Platform',
    audioSrc: '/presentation/audio/04-multiple-perspectives.mp3',
    scriptEs: 'Administradores, arquitectos y clientes acceden al mismo proyecto desde perspectivas diseñadas para sus responsabilidades.',
    scriptEn: 'Administrators, architects, and clients access the same project from perspectives designed for their responsibilities.',
    fallbackSpeechText: 'Administradores, arquitectos y clientes acceden al mismo proyecto desde perspectivas diseñadas para sus responsabilidades.',
    durationEstimateMs: 30000,
    pauseAfterMs: 1500,
    cinematicCues: [
      { timeSec: 0, phase: 0, caption: 'ADMIN. ARCHITECT. CLIENT.' }
    ],
  },
  {
    chapterId: 'project-intelligence',
    chapterNumber: '05',
    headline: 'PROJECT INTELLIGENCE',
    section: 'Project Intelligence',
    audioSrc: '/presentation/audio/05-project-intelligence.mp3',
    scriptEs: 'Los datos dejan de ser registros aislados. Se convierten en información contextual sobre proyectos, avances, decisiones y condiciones del sitio.',
    scriptEn: 'Data stops being isolated records. It becomes contextual information about projects, progress, decisions, and site conditions.',
    fallbackSpeechText: 'Los datos dejan de ser registros aislados. Se convierten en información contextual sobre proyectos, avances, decisiones y condiciones del sitio.',
    durationEstimateMs: 30000,
    pauseAfterMs: 1500,
    cinematicCues: [
      { timeSec: 0, phase: 0, caption: 'DATA IN CONTEXT.' }
    ],
  },
  {
    chapterId: 'digital-project',
    chapterNumber: '06',
    headline: 'DIGITAL PROJECT',
    section: 'La Lima BIM',
    audioSrc: '/presentation/audio/06-digital-project.mp3',
    scriptEs: 'Y cuando esa información se conecta con el modelo tridimensional, el proyecto deja de ser solamente una lista de datos.',
    scriptEn: 'When that information connects to the three-dimensional model, the project stops being only a list of data.',
    fallbackSpeechText: 'Y cuando esa información se conecta con el modelo tridimensional, el proyecto deja de ser solamente una lista de datos.',
    durationEstimateMs: 30000,
    pauseAfterMs: 1500,
    cinematicCues: [
      { timeSec: 0, phase: 0, caption: 'DATA BECOMES SPACE.' }
    ],
  },
  {
    chapterId: 'bim-exploration',
    chapterNumber: '07',
    headline: 'BIM EXPLORATION',
    section: 'BIM Exploration',
    audioSrc: '/presentation/audio/07-bim-exploration.mp3',
    scriptEs: 'ARCH_TECH permite explorar el desarrollo directamente desde el modelo. Cada elemento puede relacionarse con información técnica y contexto del proyecto.',
    scriptEn: 'ARCH_TECH lets teams explore the development directly from the model. Each element can connect to technical information and project context.',
    fallbackSpeechText: 'ARCH_TECH permite explorar el desarrollo directamente desde el modelo. Cada elemento puede relacionarse con información técnica y contexto del proyecto.',
    durationEstimateMs: 30000,
    pauseAfterMs: 1500,
    cinematicCues: [
      { timeSec: 0, phase: 0, caption: 'EXPLORE. SELECT. UNDERSTAND.' }
    ],
  },
  {
    chapterId: 'analysis',
    chapterNumber: '08',
    headline: 'ANALYSIS',
    section: 'BIM Analysis',
    audioSrc: '/presentation/audio/08-analysis.mp3',
    scriptEs: 'El modelo también se convierte en una herramienta de análisis: medir, inspeccionar, aislar y comprender el proyecto sin abandonar el entorno digital.',
    scriptEn: 'The model also becomes an analysis tool: measure, inspect, isolate, and understand the project without leaving the digital environment.',
    fallbackSpeechText: 'El modelo también se convierte en una herramienta de análisis: medir, inspeccionar, aislar y comprender el proyecto sin abandonar el entorno digital.',
    durationEstimateMs: 30000,
    pauseAfterMs: 1500,
    cinematicCues: [
      { timeSec: 0, phase: 0, caption: 'MEASURE. INSPECT. UNDERSTAND.' }
    ],
  },
  {
    chapterId: 'visual-engine',
    chapterNumber: '09',
    headline: 'VISUAL ENGINE',
    section: 'Visual Engine',
    audioSrc: '/presentation/audio/09-visual-engine.mp3',
    scriptEs: 'La visualización puede adaptarse tanto al trabajo técnico como a la comunicación ejecutiva del proyecto.',
    scriptEn: 'Visualization can adapt to both technical work and executive communication about the project.',
    fallbackSpeechText: 'La visualización puede adaptarse tanto al trabajo técnico como a la comunicación ejecutiva del proyecto.',
    durationEstimateMs: 30000,
    pauseAfterMs: 1500,
    cinematicCues: [
      { timeSec: 0, phase: 0, caption: 'DAY TO OVERCAST. BALANCED TO PRESENTATION.' }
    ],
  },
  {
    chapterId: 'artificial-intelligence',
    chapterNumber: '10',
    headline: 'ARTIFICIAL INTELLIGENCE',
    section: 'Intelligence',
    audioSrc: '/presentation/audio/10-artificial-intelligence.mp3',
    scriptEs: 'Sobre este contexto aparece una nueva capa: inteligencia artificial capaz de conversar sobre el proyecto y asistir al usuario utilizando la información que está viendo.',
    scriptEn: 'On this context, a new layer appears: artificial intelligence able to discuss the project and assist the user using the information in view.',
    fallbackSpeechText: 'Sobre este contexto aparece una nueva capa: inteligencia artificial capaz de conversar sobre el proyecto y asistir al usuario utilizando la información que está viendo.',
    durationEstimateMs: 30000,
    pauseAfterMs: 1500,
    cinematicCues: [
      { timeSec: 0, phase: 0, caption: 'GARNIER ASSISTANT.' }
    ],
  },
  {
    chapterId: 'interactive-explanation',
    chapterNumber: '11',
    headline: 'INTERACTIVE EXPLANATION',
    section: 'Explore Mode',
    audioSrc: '/presentation/audio/11-interactive-explanation.mp3',
    scriptEs: 'Y ARCH_TECH no solamente puede presentar el proyecto. También puede explicar cómo funciona.',
    scriptEn: 'ARCH_TECH can do more than present the project. It can also explain how it works.',
    fallbackSpeechText: 'Y ARCH_TECH no solamente puede presentar el proyecto. También puede explicar cómo funciona.',
    durationEstimateMs: 30000,
    pauseAfterMs: 1500,
    cinematicCues: [
      { timeSec: 0, phase: 0, caption: 'EXPLORE. UNDERSTAND. ASK.' }
    ],
  },
  {
    chapterId: 'vision',
    chapterNumber: '12',
    headline: 'THE VISION',
    section: 'The Vision',
    audioSrc: '/presentation/audio/12-vision.mp3',
    scriptEs: 'La visión es sencilla: reducir la distancia entre información, personas y proyecto físico.',
    scriptEn: 'The vision is simple: reduce the distance between information, people, and the physical project.',
    fallbackSpeechText: 'La visión es sencilla: reducir la distancia entre información, personas y proyecto físico.',
    durationEstimateMs: 30000,
    pauseAfterMs: 1500,
    cinematicCues: [
      { timeSec: 0, phase: 0, caption: 'INFORMATION. PEOPLE. PROJECT.' }
    ],
  },
  {
    chapterId: 'closing',
    chapterNumber: '13',
    headline: 'CLOSING',
    section: 'Closing',
    audioSrc: '/presentation/audio/13-closing.mp3',
    scriptEs: 'ARCH_TECH. Un entorno conectado para comprender, coordinar y desarrollar proyectos complejos, desde la oportunidad hasta la operación.',
    scriptEn: 'ARCH_TECH. One connected environment to understand, coordinate, and develop complex projects, from opportunity to operation.',
    fallbackSpeechText: 'ARCH_TECH. Un entorno conectado para comprender, coordinar y desarrollar proyectos complejos, desde la oportunidad hasta la operación.',
    durationEstimateMs: 30000,
    pauseAfterMs: 4500,
    cinematicCues: [
      { timeSec: 0, phase: 0, caption: 'ARCH_TECH. ONE CONNECTED ENVIRONMENT FOR COMPLEX DEVELOPMENT.' },
      { timeSec: 10, phase: 1, caption: 'FROM OPPORTUNITY TO OPERATION.' }
    ],
  }
];

export const getChapterNarration = (chapterId: string): ChapterNarrationManifest => {
  return narrationManifest.find((entry) => entry.chapterId === chapterId) ?? narrationManifest[0];
};

export const getNextChapterNarration = (chapterId: string): ChapterNarrationManifest | null => {
  const index = narrationManifest.findIndex((entry) => entry.chapterId === chapterId);
  if (index >= 0 && index < narrationManifest.length - 1) {
    return narrationManifest[index + 1];
  }
  return null;
};
