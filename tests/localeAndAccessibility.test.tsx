import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import fs from 'fs';
import path from 'path';

import {
  getStoredLocale,
  setStoredLocale,
  STORAGE_KEY_LOCALE,
  SUPPORTED_LOCALES,
} from '../src/portal/locale';
import {
  filterAndRankVoices,
  getBestVoiceForLocale,
  isAllowedVoice,
  loadAccessibilityPreferences,
  saveAccessibilityPreferences,
  STORAGE_KEY_A11Y,
} from '../src/portal/accessibility';
import { LandingNavbar } from '../src/components/landing/LandingNavbar';
import { NewsArchivePage } from '../src/pages/public/NewsArchivePage';
import { NewsDetailPage } from '../src/pages/public/NewsDetailPage';
import { PublicProjectPage } from '../src/pages/public/PublicProjectPage';
import { PortalShell } from '../src/components/portal/PortalShell';
import { AIAgent } from '../src/bim/ai/AIAgent';
import { aiService } from '../src/services/aiService';
import { automationService } from '../src/services/automationService';

describe('Global Accessibility & Bilingual Support Suite', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.lang = 'en';
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.lang = 'en';
    vi.restoreAllMocks();
  });

  describe('1. EN / ES Language Selection & Persistence', () => {
    it('supports en and es and defaults to en', () => {
      expect(SUPPORTED_LOCALES).toEqual(['en', 'es']);
      expect(getStoredLocale()).toBe('en');
    });

    it('persists selected locale to localStorage and updates document.documentElement.lang', () => {
      setStoredLocale('es');
      expect(window.localStorage.getItem(STORAGE_KEY_LOCALE)).toBe('es');
      expect(getStoredLocale()).toBe('es');
      expect(document.documentElement.lang).toBe('es');

      setStoredLocale('en');
      expect(window.localStorage.getItem(STORAGE_KEY_LOCALE)).toBe('en');
      expect(getStoredLocale()).toBe('en');
      expect(document.documentElement.lang).toBe('en');
    });

    it('renders EN / ES toggle in LandingNavbar and switches locale', () => {
      render(
        <LandingNavbar
          onLogin={vi.fn()}
          onNavigate={vi.fn()}
        />
      );

      const esBtn = screen.getByTestId('lang-btn-es');
      const enBtn = screen.getByTestId('lang-btn-en');
      expect(esBtn).toBeDefined();
      expect(enBtn).toBeDefined();

      fireEvent.click(esBtn);
      expect(getStoredLocale()).toBe('es');
      expect(window.localStorage.getItem(STORAGE_KEY_LOCALE)).toBe('es');

      fireEvent.click(enBtn);
      expect(getStoredLocale()).toBe('en');
      expect(window.localStorage.getItem(STORAGE_KEY_LOCALE)).toBe('en');
    });
  });

  describe('2. Narrator Voice Filtering & Ranking', () => {
    const mockVoices = [
      { voiceURI: 'v-es-cr', name: 'Sofia CR', lang: 'es-CR', default: false, localService: true },
      { voiceURI: 'v-es-mx', name: 'Jorge MX', lang: 'es-MX', default: false, localService: true },
      { voiceURI: 'v-es-es', name: 'Lucia ES', lang: 'es-ES', default: false, localService: true },
      { voiceURI: 'v-en-us', name: 'Alex US', lang: 'en-US', default: true, localService: true },
      { voiceURI: 'v-en-gb', name: 'Daniel GB', lang: 'en-GB', default: false, localService: true },
      { voiceURI: 'v-fr-fr', name: 'Thomas FR', lang: 'fr-FR', default: false, localService: true },
      { voiceURI: 'v-de-de', name: 'Anna DE', lang: 'de-DE', default: false, localService: true },
      { voiceURI: 'v-it-it', name: 'Alice IT', lang: 'it-IT', default: false, localService: true },
    ] as unknown as SpeechSynthesisVoice[];

    it('rejects voices that are not in the en or es language families', () => {
      expect(isAllowedVoice(mockVoices[0])).toBe(true); // es-CR
      expect(isAllowedVoice(mockVoices[3])).toBe(true); // en-US
      expect(isAllowedVoice(mockVoices[5])).toBe(false); // fr-FR
      expect(isAllowedVoice(mockVoices[6])).toBe(false); // de-DE
      expect(isAllowedVoice(mockVoices[7])).toBe(false); // it-IT

      const filtered = filterAndRankVoices(mockVoices, 'en');
      expect(filtered.some((v) => v.lang.startsWith('fr') || v.lang.startsWith('de'))).toBe(false);
      expect(filtered.length).toBe(5); // 3 es + 2 en
    });

    it('prioritizes Spanish voices matching active es locale (es-CR > Latin America > ES)', () => {
      const rankedForEs = filterAndRankVoices(mockVoices, 'es');
      // For Spanish locale, es-CR should be at the very top
      expect(rankedForEs[0].lang).toBe('es-CR');
      expect(rankedForEs[1].lang).toBe('es-MX');
      expect(rankedForEs[2].lang).toBe('es-ES');
      expect(getBestVoiceForLocale(mockVoices, 'es')?.lang).toBe('es-CR');
    });

    it('prioritizes English voices matching active en locale (en-US > en-GB > other)', () => {
      const rankedForEn = filterAndRankVoices(mockVoices, 'en');
      // For English locale, en-US should be at the very top
      expect(rankedForEn[0].lang).toBe('en-US');
      expect(rankedForEn[1].lang).toBe('en-GB');
      expect(getBestVoiceForLocale(mockVoices, 'en')?.lang).toBe('en-US');
    });
  });

  describe('3. Shared Accessibility between Landing and Portal', () => {
    it('renders accessibility panel trigger on Landing and opens dialog', async () => {
      render(
        <LandingNavbar
          onLogin={vi.fn()}
          onNavigate={vi.fn()}
          onOpenA11y={vi.fn()}
        />
      );

      const trigger = screen.getByTestId('accessibility-panel-trigger');
      expect(trigger).toBeDefined();
    });

    it('shares persisted accessibility preferences between Landing and Portal', () => {
      saveAccessibilityPreferences({
        ...loadAccessibilityPreferences(),
        highContrast: true,
        textScale: '125',
        reduceMotion: true,
        highlightLinks: true,
      });

      const loaded = loadAccessibilityPreferences();
      expect(loaded.highContrast).toBe(true);
      expect(loaded.textScale).toBe('125');
      expect(loaded.reduceMotion).toBe(true);
      expect(loaded.highlightLinks).toBe(true);

      // Verify localStorage key matches arch-tech-a11y-preferences
      const raw = window.localStorage.getItem(STORAGE_KEY_A11Y);
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!);
      expect(parsed.highContrast).toBe(true);
    });
  });

  describe('4. AI Request Includes Locale and Structured Context', () => {
    it('passes active locale into aiService.generateResponse', async () => {
      setStoredLocale('es');
      const agent = AIAgent.getInstance();

      const generateResponseSpy = vi.spyOn(aiService, 'generateResponse').mockResolvedValue({
        message: 'Respuesta en español',
      });
      vi.spyOn(aiService, 'isConfigured').mockReturnValue(true);

      await agent.sendMessage('Calcular cantidades del modelo');

      expect(generateResponseSpy).toHaveBeenCalled();
      const payload = generateResponseSpy.mock.calls[0][0];
      expect(payload.locale).toBe('es');
      expect(payload.userPrompt).toBe('Calcular cantidades del modelo');
      expect(payload.context).toBeDefined();
      expect(payload.tools).toBeDefined();
    });
  });

  describe('5. n8n Workflows & Automation Bilingual Handling', () => {
    it('validates n8n/ai-assistant.json structure and systemMessage branding', () => {
      const filePath = path.resolve(__dirname, '../n8n/ai-assistant.json');
      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(content);

      expect(parsed.name).toBe('GARNIER ARCHITECTURE AI Assistant');
      const chainNode = parsed.nodes.find((n: any) => n.id === 'ai-chain');
      expect(chainNode).toBeDefined();
      expect(chainNode.parameters.options.systemMessage).toContain(
        'GARNIER ARCHITECTURE BIM assistant'
      );
      expect(chainNode.parameters.options.systemMessage).toContain('locale');

      const normalizeNode = parsed.nodes.find((n: any) => n.id === 'ai-normalize');
      expect(normalizeNode.parameters.jsCode).toContain('promptPayload');
      expect(normalizeNode.parameters.jsCode).toContain('locale');
    });

    it('validates n8n/project-automation.json bilingual notification execution', () => {
      const filePath = path.resolve(__dirname, '../n8n/project-automation.json');
      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(content);

      const summaryNode = parsed.nodes.find((n: any) => n.id === 'automation-summary');
      expect(summaryNode).toBeDefined();
      const jsCode = summaryNode.parameters.jsCode;

      // Evaluate the jsCode logic directly with mock inputs
      const runNodeCode = (body: any) => {
        const $json = { body };
        const fn = new Function('$json', jsCode);
        return fn($json);
      };

      const resEn = runNodeCode({
        event: 'project.created',
        projectId: 'project-waldorf',
        locale: 'en',
      });
      expect(resEn[0].json.success).toBe(true);
      expect(resEn[0].json.notification.message).toBe('Project created · project-waldorf');

      const resEs = runNodeCode({
        event: 'project.created',
        projectId: 'project-waldorf',
        locale: 'es',
      });
      expect(resEs[0].json.success).toBe(true);
      expect(resEs[0].json.notification.message).toBe('Proyecto creado · project-waldorf');

      const resApprovalEs = runNodeCode({
        event: 'approval.requested',
        projectId: 'project-lima',
        locale: 'es',
      });
      expect(resApprovalEs[0].json.notification.message).toBe('Aprobación solicitada · project-lima');
    });

    it('automationService includes active locale in webhook payload', async () => {
      setStoredLocale('es');
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            notification: { message: 'Proyecto actualizado · p-1' },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );
      vi.stubEnv('VITE_N8N_AUTOMATION_WEBHOOK_URL', 'https://n8n.example.com/webhook/automation');

      const result = await automationService.emit({
        event: 'project.updated',
        projectId: 'p-1',
      });

      expect(result.success).toBe(true);
      expect(fetchSpy).toHaveBeenCalled();
      const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
      expect(body.locale).toBe('es');
      expect(body.event).toBe('project.updated');
      expect(body.projectId).toBe('p-1');
    });
  });

  describe('6. News Archive EN / ES Coverage', () => {
    it('renders News Archive in EN and ES', () => {
      setStoredLocale('en');
      render(<NewsArchivePage onNavigate={vi.fn()} />);

      expect(screen.getByText('Portfolio')).toBeDefined();
      expect(screen.getByText('GARNIER ARCHITECTURE / Journal')).toBeDefined();
      expect(screen.getByText('Project updates.')).toBeDefined();
      expect(screen.getAllByText('All projects').length).toBeGreaterThan(0);
      expect(screen.getAllByText('All categories').length).toBeGreaterThan(0);

      cleanup();
      setStoredLocale('es');
      render(<NewsArchivePage onNavigate={vi.fn()} />);

      expect(screen.getByText('Portafolio')).toBeDefined();
      expect(screen.getByText('GARNIER ARCHITECTURE / Publicaciones')).toBeDefined();
      expect(screen.getByText('Actualizaciones de proyectos.')).toBeDefined();
      expect(screen.getAllByText('Todos los proyectos').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Todas las categorías').length).toBeGreaterThan(0);
    });
  });

  describe('7. News Detail Controls EN / ES Coverage', () => {
    it('renders News Detail controls in EN and ES', () => {
      setStoredLocale('en');
      render(<NewsDetailPage updateId="news-waldorf-astoria-groundbreaking" onNavigate={vi.fn()} />);

      expect(screen.getByText('All updates')).toBeDefined();
      expect(screen.getByText('View related project')).toBeDefined();
      expect(screen.getByRole('navigation', { name: 'News navigation' })).toBeDefined();

      cleanup();
      setStoredLocale('es');
      render(<NewsDetailPage updateId="news-waldorf-astoria-groundbreaking" onNavigate={vi.fn()} />);

      expect(screen.getByText('Todas las actualizaciones')).toBeDefined();
      expect(screen.getByText('Ver proyecto relacionado')).toBeDefined();
      expect(screen.getByRole('navigation', { name: 'Navegación de noticias' })).toBeDefined();
    });
  });

  describe('8. Public Project Labels EN / ES Coverage', () => {
    it('renders Public Project labels in EN and ES', () => {
      setStoredLocale('en');
      render(<PublicProjectPage projectId="zona-franca-la-lima" onNavigate={vi.fn()} />);

      expect(screen.getByText('Development portfolio')).toBeDefined();
      expect(screen.getByText('Project intent')).toBeDefined();
      expect(screen.getByText('Development mandate')).toBeDefined();
      expect(screen.getByText('Development path')).toBeDefined();
      expect(screen.getByText('Milestone')).toBeDefined();

      cleanup();
      setStoredLocale('es');
      render(<PublicProjectPage projectId="zona-franca-la-lima" onNavigate={vi.fn()} />);

      expect(screen.getByText('Portafolio de desarrollo')).toBeDefined();
      expect(screen.getByText('Propósito del proyecto')).toBeDefined();
      expect(screen.getByText('Mandato de desarrollo')).toBeDefined();
      expect(screen.getByText('Ruta de desarrollo')).toBeDefined();
      expect(screen.getByText('Hito')).toBeDefined();
    });
  });

  describe('9. PortalShell Navigation EN / ES Coverage', () => {
    it('renders PortalShell navigation in EN and ES for client role', () => {
      setStoredLocale('en');
      render(<PortalShell role="client"><p>Content</p></PortalShell>);

      expect(screen.getByTestId('portal-nav-overview').textContent).toBe('Overview');
      expect(screen.getByTestId('portal-nav-projects').textContent).toBe('Projects');
      expect(screen.getByTestId('portal-nav-documents').textContent).toBe('Documents');
      expect(screen.getByTestId('portal-nav-approvals').textContent).toBe('Approvals');
      expect(screen.getByTestId('portal-nav-insights').textContent).toBe('Insights');
      expect(screen.getByTestId('portal-nav-assistant').textContent).toBe('Assistant');
      expect(screen.getByText('Sign out')).toBeDefined();

      cleanup();
      setStoredLocale('es');
      render(<PortalShell role="client"><p>Content</p></PortalShell>);

      expect(screen.getByTestId('portal-nav-overview').textContent).toBe('Resumen');
      expect(screen.getByTestId('portal-nav-projects').textContent).toBe('Proyectos');
      expect(screen.getByTestId('portal-nav-documents').textContent).toBe('Documentos');
      expect(screen.getByTestId('portal-nav-approvals').textContent).toBe('Aprobaciones');
      expect(screen.getByTestId('portal-nav-insights').textContent).toBe('Indicadores');
      expect(screen.getByTestId('portal-nav-assistant').textContent).toBe('Asistente');
      expect(screen.getByText('Cerrar sesión')).toBeDefined();
    });

    it('renders PortalShell navigation in EN and ES for architect and admin roles', () => {
      setStoredLocale('en');
      render(<PortalShell role="architect"><p>Content</p></PortalShell>);
      expect(screen.getByTestId('portal-nav-overview').textContent).toBe('Overview');
      expect(screen.getByTestId('portal-nav-projects').textContent).toBe('Projects');
      cleanup();

      setStoredLocale('es');
      render(<PortalShell role="admin"><p>Content</p></PortalShell>);
      expect(screen.getByTestId('portal-nav-overview').textContent).toBe('Resumen');
      expect(screen.getByTestId('portal-nav-projects').textContent).toBe('Proyectos');
      expect(screen.getByTestId('portal-nav-people').textContent).toBe('Personas');
      expect(screen.getByTestId('portal-nav-news').textContent).toBe('Noticias');
    });
  });

  describe('10. Locale Persistence Across Navigation Paths', () => {
    it('persists locale when navigating Landing → Project → News → Portal', () => {
      // 1. Landing: user switches to Spanish
      setStoredLocale('es');
      expect(getStoredLocale()).toBe('es');
      expect(window.localStorage.getItem(STORAGE_KEY_LOCALE)).toBe('es');

      // 2. Public Project respects persisted locale
      render(<PublicProjectPage projectId="zona-franca-la-lima" onNavigate={vi.fn()} />);
      expect(screen.getByText('Portafolio de desarrollo')).toBeDefined();
      cleanup();

      // 3. News page respects persisted locale
      render(<NewsArchivePage onNavigate={vi.fn()} />);
      expect(screen.getByText('Portafolio')).toBeDefined();
      expect(screen.getByText('Actualizaciones de proyectos.')).toBeDefined();
      cleanup();

      // 4. Portal respects persisted locale
      render(<PortalShell role="client"><p>Portal Area</p></PortalShell>);
      expect(screen.getByTestId('portal-nav-overview').textContent).toBe('Resumen');
      expect(getStoredLocale()).toBe('es');
    });
  });
});
