import enCommon from '../../public/locales/en/common.json';
import enLanding from '../../public/locales/en/landing.json';
import enPublic from '../../public/locales/en/public.json';
import enNews from '../../public/locales/en/news.json';
import enPortal from '../../public/locales/en/portal.json';
import enClient from '../../public/locales/en/client.json';
import enArchitect from '../../public/locales/en/architect.json';
import enAdmin from '../../public/locales/en/admin.json';
import enWorkspace from '../../public/locales/en/workspace.json';
import enAccessibility from '../../public/locales/en/accessibility.json';
import enAi from '../../public/locales/en/ai.json';

import esCommon from '../../public/locales/es/common.json';
import esLanding from '../../public/locales/es/landing.json';
import esPublic from '../../public/locales/es/public.json';
import esNews from '../../public/locales/es/news.json';
import esPortal from '../../public/locales/es/portal.json';
import esClient from '../../public/locales/es/client.json';
import esArchitect from '../../public/locales/es/architect.json';
import esAdmin from '../../public/locales/es/admin.json';
import esWorkspace from '../../public/locales/es/workspace.json';
import esAccessibility from '../../public/locales/es/accessibility.json';
import esAi from '../../public/locales/es/ai.json';

export const resources = {
  en: {
    common: enCommon,
    landing: enLanding,
    public: enPublic,
    news: enNews,
    portal: enPortal,
    client: enClient,
    architect: enArchitect,
    admin: enAdmin,
    workspace: enWorkspace,
    accessibility: enAccessibility,
    ai: enAi,
  },
  es: {
    common: esCommon,
    landing: esLanding,
    public: esPublic,
    news: esNews,
    portal: esPortal,
    client: esClient,
    architect: esArchitect,
    admin: esAdmin,
    workspace: esWorkspace,
    accessibility: esAccessibility,
    ai: esAi,
  },
} as const;
