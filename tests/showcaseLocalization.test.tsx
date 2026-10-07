import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { setStoredLocale } from '../src/portal/locale';
import { getPublicProjects, PortalProject } from '../src/portal/data';
import { PublicProjectPage } from '../src/pages/public/PublicProjectPage';
import {
  getLocalizedApprovalTitle,
  getLocalizedDocument,
  getLocalizedMilestoneLabel,
  getLocalizedMilestoneStatus,
  getLocalizedNewsArticle,
  getLocalizedNotificationMessage,
  getLocalizedProject,
  getLocalizedProjectField,
  getLocalizedUpdate,
  isSeededNewsId,
  isSeededProjectId,
  SEEDED_PROJECT_IDS,
} from '../src/portal/showcaseLocalization';

describe('Showcase and Portal DB-Backed Content Localization Suite', () => {
  const originalProjects = getPublicProjects();
  const laLima = originalProjects.find((p) => p.id === 'zona-franca-la-lima')!;

  const runtimeProject: PortalProject = {
    id: 'runtime-alpha-campus',
    title: 'Alpha Compute Facility',
    code: 'ACF-01',
    category: 'Hyperscale · Data Center',
    scale: '120,000 m²',
    phase: 'Structural Schematics',
    progress: 35,
    nextMilestone: 'Substation Energization',
    summary: 'Custom unseeded datacenter development.',
    statement: 'Advanced cooling and power infrastructure study for mission-critical cloud compute.',
    longView: 'Long-term power distribution grid integration across provincial substations.',
    developmentType: 'Mission Critical Infrastructure',
    publicStage: 'Engineering Review',
    image: '/images/showcase/zfll-masterplan.webp',
    milestones: [
      { projectId: 'runtime-alpha-campus', label: 'Site Grading Complete', status: 'Complete' },
      { projectId: 'runtime-alpha-campus', label: 'Substation Energization', status: 'Current' },
    ],
    updates: [
      {
        projectId: 'runtime-alpha-campus',
        title: 'Transformer delivery scheduled',
        date: '2026-04-10',
        body: 'Heavy transformers cleared customs.',
      },
    ],
    documents: [
      {
        projectId: 'runtime-alpha-campus',
        name: 'Transformer Specification Sheet',
        meta: 'Vendor spec · 15 MVA',
      },
    ],
    approvals: [
      {
        projectId: 'runtime-alpha-campus',
        title: 'Grid interconnection agreement',
        status: 'Pending',
      },
    ],
  };

  beforeEach(() => {
    cleanup();
    window.localStorage.clear();
    setStoredLocale('en');
  });

  afterEach(() => {
    cleanup();
    setStoredLocale('en');
  });

  describe('1. Seeded Project Identification', () => {
    it('recognizes all 6 seeded showcase projects', () => {
      expect(SEEDED_PROJECT_IDS).toEqual([
        'zona-franca-la-lima',
        'el-cafetal',
        'santa-ana-country-club',
        'waldorf-astoria',
        'centro-corporativo-sabana',
        'universidad-latina',
      ]);
      SEEDED_PROJECT_IDS.forEach((id) => {
        expect(isSeededProjectId(id)).toBe(true);
      });
    });

    it('rejects unseeded or runtime project IDs', () => {
      expect(isSeededProjectId('runtime-alpha-campus')).toBe(false);
      expect(isSeededProjectId('random-new-project')).toBe(false);
      expect(isSeededProjectId('')).toBe(false);
    });
  });

  describe('2. La Lima Field Localization (EN vs ES)', () => {
    it('translates statement from English to Spanish and preserves English baseline', () => {
      setStoredLocale('en');
      const enStatement = getLocalizedProjectField('zona-franca-la-lima', 'statement', laLima.statement);
      expect(enStatement).toBe(laLima.statement);
      expect(enStatement).toContain('The official portfolio describes La Lima as a 79-hectare mixed-commercial development');

      setStoredLocale('es');
      const esStatement = getLocalizedProjectField('zona-franca-la-lima', 'statement', laLima.statement);
      expect(esStatement).not.toBe(enStatement);
      expect(esStatement).toContain('El portafolio oficial describe La Lima como un desarrollo comercial mixto de 79 hectáreas');
    });

    it('translates longView from English to Spanish and preserves English baseline', () => {
      setStoredLocale('en');
      const enLongView = getLocalizedProjectField('zona-franca-la-lima', 'longView', laLima.longView!);
      expect(enLongView).toBe(laLima.longView);
      expect(enLongView).toContain('A business and infrastructure platform for advanced manufacturing');

      setStoredLocale('es');
      const esLongView = getLocalizedProjectField('zona-franca-la-lima', 'longView', laLima.longView!);
      expect(esLongView).not.toBe(enLongView);
      expect(esLongView).toContain('Una plataforma de negocios e infraestructura para manufactura avanzada');
    });

    it('translates category, phase, nextMilestone, summary, developmentType, and publicStage', () => {
      setStoredLocale('es');
      const esCategory = getLocalizedProjectField('zona-franca-la-lima', 'category', laLima.category);
      const esPhase = getLocalizedProjectField('zona-franca-la-lima', 'phase', laLima.phase);
      const esNext = getLocalizedProjectField('zona-franca-la-lima', 'nextMilestone', laLima.nextMilestone);
      const esSummary = getLocalizedProjectField('zona-franca-la-lima', 'summary', laLima.summary);
      const esType = getLocalizedProjectField('zona-franca-la-lima', 'developmentType', laLima.developmentType!);
      const esStage = getLocalizedProjectField('zona-franca-la-lima', 'publicStage', laLima.publicStage!);

      expect(esCategory).toBe('Zona franca · Parque industrial');
      expect(esPhase).toBe('Revisión de muestra');
      expect(esNext).toBe('Revisión de portafolio · 18 de noviembre');
      expect(esSummary).toContain('Una zona franca y parque industrial en La Lima, Cartago');
      expect(esType).toBe('Zona franca / Parque industrial');
      expect(esStage).toBe('En operación desde 2014');
    });
  });

  describe('3. Milestone Label and Status Localization', () => {
    it('translates shared showcase milestone labels in ES and maintains English baseline', () => {
      setStoredLocale('en');
      expect(getLocalizedMilestoneLabel('Public source intake')).toBe('Public source intake');
      expect(getLocalizedMilestoneLabel('Media mapping')).toBe('Media mapping');
      expect(getLocalizedMilestoneLabel('Showcase review')).toBe('Showcase review');

      setStoredLocale('es');
      expect(getLocalizedMilestoneLabel('Public source intake')).toBe('Recepción de fuentes públicas');
      expect(getLocalizedMilestoneLabel('Media mapping')).toBe('Mapeo de medios');
      expect(getLocalizedMilestoneLabel('Showcase review')).toBe('Revisión de muestra');
    });

    it('translates shared milestone statuses in ES and maintains English baseline', () => {
      setStoredLocale('en');
      expect(getLocalizedMilestoneStatus('Complete')).toBe('Complete');
      expect(getLocalizedMilestoneStatus('Current')).toBe('Current');
      expect(getLocalizedMilestoneStatus('Upcoming')).toBe('Upcoming');

      setStoredLocale('es');
      expect(getLocalizedMilestoneStatus('Complete')).toBe('Completado');
      expect(getLocalizedMilestoneStatus('Current')).toBe('En curso');
      expect(getLocalizedMilestoneStatus('Upcoming')).toBe('Próximo');
    });

    it('retains untranslated original text for custom or unseeded milestones', () => {
      setStoredLocale('es');
      expect(getLocalizedMilestoneLabel('Custom Concrete Foundation Pour')).toBe('Custom Concrete Foundation Pour');
      expect(getLocalizedMilestoneStatus('Pending Verification')).toBe('Pending Verification');
    });
  });

  describe('4. Runtime and Unknown Projects Retain DB-Authored Content', () => {
    it('does not alter runtime/admin-created project fields in ES or EN', () => {
      setStoredLocale('es');
      const loc = getLocalizedProject(runtimeProject);

      expect(loc.statement).toBe(runtimeProject.statement);
      expect(loc.longView).toBe(runtimeProject.longView);
      expect(loc.category).toBe(runtimeProject.category);
      expect(loc.phase).toBe(runtimeProject.phase);
      expect(loc.nextMilestone).toBe(runtimeProject.nextMilestone);
      expect(loc.summary).toBe(runtimeProject.summary);
      expect(loc.developmentType).toBe(runtimeProject.developmentType);
      expect(loc.publicStage).toBe(runtimeProject.publicStage);
    });

    it('does not translate milestones of unseeded runtime projects', () => {
      setStoredLocale('es');
      const loc = getLocalizedProject(runtimeProject);
      expect(loc.milestones[0].label).toBe('Site Grading Complete');
      expect(loc.milestones[0].status).toBe('Complete');
      expect(loc.milestones[1].label).toBe('Substation Energization');
      expect(loc.milestones[1].status).toBe('Current');
    });
  });

  describe('5. Portal Seeded Entities Localization (Approvals, Documents, Updates, Notifications)', () => {
    it('localizes seeded approval titles in ES and keeps fallback for unknown', () => {
      setStoredLocale('es');
      expect(getLocalizedApprovalTitle('Showcase framing', 'zona-franca-la-lima')).toBe('Encuadre de muestra');
      expect(getLocalizedApprovalTitle('Public facts check', 'el-cafetal')).toBe('Verificación de datos públicos');
      expect(getLocalizedApprovalTitle('Grid interconnection agreement', 'runtime-alpha-campus')).toBe('Grid interconnection agreement');
    });

    it('localizes seeded documents in ES and retains unseeded documents', () => {
      setStoredLocale('es');
      const seededDoc = getLocalizedDocument({
        projectId: 'zona-franca-la-lima',
        name: 'Official project reference',
        meta: 'Concept Showcase · public source',
      });
      expect(seededDoc.name).toBe('Referencia oficial del proyecto');
      expect(seededDoc.meta).toBe('Muestra Conceptual · fuente pública');

      const mediaDoc = getLocalizedDocument({
        projectId: 'el-cafetal',
        name: 'Local media mapping',
        meta: 'Concept coordination · ARCH_TECH',
      });
      expect(mediaDoc.name).toBe('Mapeo de medios locales');
      expect(mediaDoc.meta).toBe('Coordinación conceptual · ARCH_TECH');

      const customDoc = getLocalizedDocument({
        projectId: 'runtime-alpha-campus',
        name: 'Transformer Specification Sheet',
        meta: 'Vendor spec · 15 MVA',
      });
      expect(customDoc.name).toBe('Transformer Specification Sheet');
      expect(customDoc.meta).toBe('Vendor spec · 15 MVA');
    });

    it('localizes seeded notifications in ES and retains unseeded notifications', () => {
      setStoredLocale('es');
      expect(getLocalizedNotificationMessage('Showcase framing is ready for review.', 'zona-franca-la-lima')).toBe(
        'El encuadre de muestra está listo para revisión.'
      );
      expect(getLocalizedNotificationMessage('Custom alert for substation trip', 'runtime-alpha-campus')).toBe(
        'Custom alert for substation trip'
      );
    });

    it('localizes seeded updates in ES and retains unseeded updates', () => {
      setStoredLocale('es');
      const seededUpdate = getLocalizedUpdate({
        projectId: 'zona-franca-la-lima',
        title: 'Showcase media review',
        body: 'Official portfolio imagery and public facts are ready for the ARCH_TECH Concept Showcase.',
      });
      expect(seededUpdate.title).toBe('Revisión de medios de muestra');
      expect(seededUpdate.body).toBe(
        'Las imágenes del portafolio oficial y los datos públicos están listos para la Muestra Conceptual de ARCH_TECH.'
      );

      const customUpdate = getLocalizedUpdate(runtimeProject.updates[0]);
      expect(customUpdate.title).toBe(runtimeProject.updates[0].title);
      expect(customUpdate.body).toBe(runtimeProject.updates[0].body);
    });
  });

  describe('6. News Content Localization', () => {
    it('recognizes seeded news articles and translates them in ES', () => {
      expect(isSeededNewsId('news-zfll-expansion')).toBe(true);
      expect(isSeededNewsId('news-custom-post')).toBe(false);

      setStoredLocale('es');
      const article = getLocalizedNewsArticle({
        id: 'news-zfll-expansion',
        title: 'Expansion Phase Announced for Zona Franca La Lima',
        excerpt: 'New industrial facilities planned to support growing medical device manufacturing demand.',
        body: 'A comprehensive expansion plan adds 50,000 square meters of specialized industrial space.',
        category: 'Expansion',
        sourceLabel: 'Official Release',
      });

      expect(article.title).toBe('Zona Franca La Lima anuncia expansión de manufactura avanzada en Fase 4');
      expect(article.excerpt).toBe('Inicia la construcción de una nueva instalación de 45.000 m² para logística de alta especificación y manufactura de cuartos limpios en Cartago.');
      expect(article.category).toBe('Desarrollo');
      expect(article.sourceLabel).toBe('Editorial Garnier Architecture');
    });

    it('leaves unseeded news articles untranslated', () => {
      setStoredLocale('es');
      const unseededArticle = {
        id: 'custom-article-99',
        title: 'New Solar Array Deployed',
        excerpt: 'Clean energy for corporate campus.',
        category: 'Sustainability',
        sourceLabel: 'Internal Memo',
      };
      const result = getLocalizedNewsArticle(unseededArticle);
      expect(result.title).toBe(unseededArticle.title);
      expect(result.excerpt).toBe(unseededArticle.excerpt);
    });
  });

  describe('7. React Component Integration: PublicProjectPage', () => {
    it('renders La Lima statement, longView, milestone label and status in English', () => {
      setStoredLocale('en');
      render(<PublicProjectPage project={laLima} onNavigate={() => {}} />);

      expect(screen.getByText(/The official portfolio describes La Lima as a 79-hectare mixed-commercial development/)).toBeDefined();
      expect(screen.getByText(/A business and infrastructure platform for advanced manufacturing/)).toBeDefined();
      expect(screen.getByText('Public source intake')).toBeDefined();
      expect(screen.getByText('Media mapping')).toBeDefined();
      expect(screen.getByText('Showcase review')).toBeDefined();
      expect(screen.getAllByText('Complete').length).toBeGreaterThan(0);
    });

    it('renders La Lima statement, longView, milestone label and status in Spanish when locale is es', () => {
      setStoredLocale('es');
      render(<PublicProjectPage project={laLima} onNavigate={() => {}} />);

      expect(screen.getByText(/El portafolio oficial describe La Lima como un desarrollo comercial mixto de 79 hectáreas/)).toBeDefined();
      expect(screen.getByText(/Una plataforma de negocios e infraestructura para manufactura avanzada/)).toBeDefined();
      expect(screen.getByText('Recepción de fuentes públicas')).toBeDefined();
      expect(screen.getByText('Mapeo de medios')).toBeDefined();
      expect(screen.getByText('Revisión de muestra')).toBeDefined();
      expect(screen.getAllByText('Completado').length).toBeGreaterThan(0);
    });

    it('renders unseeded runtime project DB-authored strings untouched in Spanish', () => {
      setStoredLocale('es');
      render(<PublicProjectPage project={runtimeProject} onNavigate={() => {}} />);

      expect(screen.getByText(runtimeProject.statement)).toBeDefined();
      expect(screen.getByText(runtimeProject.longView!)).toBeDefined();
      expect(screen.getByText('Site Grading Complete')).toBeDefined();
      expect(screen.getByText('Substation Energization')).toBeDefined();
    });
  });
});
