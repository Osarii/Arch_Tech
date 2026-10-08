import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { LandingNavbar } from '../src/components/landing/LandingNavbar';
import { LandingAssistantLauncher } from '../src/components/landing/LandingAssistantLauncher';
import { publicAssistant } from '../src/services/publicAssistantService';
import { aiService } from '../src/services/aiService';

describe('Public Landing Header & Garnier Assistant Polish', () => {
  beforeEach(() => {
    publicAssistant.clearHistory();
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    publicAssistant.clearHistory();
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('LandingNavbar Component', () => {
    it('renders the architectural brand lockup with symbol and wordmark', () => {
      render(<LandingNavbar onLogin={vi.fn()} />);

      const homeLink = screen.getByRole('link', { name: /ARCH_TECH home/i });
      expect(homeLink).toBeDefined();

      const symbol = homeLink.querySelector('.arch-tech-logo-full img');
      expect(symbol).not.toBeNull();
      expect(symbol?.getAttribute('src')).toContain('geometric-mint.png');
    });

    it('renders the light-theme brand lockup when lightTheme=true', () => {
      render(<LandingNavbar onLogin={vi.fn()} lightTheme={true} />);

      const homeLink = screen.getByRole('link', { name: /ARCH_TECH home/i });
      const symbol = homeLink.querySelector('.arch-tech-logo-full img');
      expect(symbol?.getAttribute('src')).toContain('architectural-full.png');
    });

    it('renders navigation links and handles section navigation', () => {
      const scrollIntoViewMock = vi.fn();
      window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

      const onNavigate = vi.fn();
      render(<LandingNavbar onLogin={vi.fn()} onNavigate={onNavigate} />);

      fireEvent.click(screen.getByRole('button', { name: /Projects|Proyectos/i }));
      fireEvent.click(screen.getByTestId('capabilities-link'));
      fireEvent.click(screen.getByTestId('about-link'));
      fireEvent.click(screen.getByTestId('team-link'));
      fireEvent.click(screen.getByRole('button', { name: /Updates|Actualizaciones/i }));
      expect(onNavigate).toHaveBeenCalledWith('/news');
    });

    it('renders the secondary utility cluster with locale, theme, and accessibility controls', () => {
      const onToggleTheme = vi.fn();
      const onOpenA11y = vi.fn();
      const onLogin = vi.fn();

      render(
        <LandingNavbar
          onLogin={onLogin}
          onToggleTheme={onToggleTheme}
          onOpenA11y={onOpenA11y}
          isA11yPanelOpen={false}
        />
      );

      // Locale toggle
      const langSelector = screen.getByTestId('lang-selector');
      expect(langSelector).toBeDefined();
      const enBtn = screen.getByTestId('lang-btn-en');
      const esBtn = screen.getByTestId('lang-btn-es');
      expect(enBtn).toBeDefined();
      expect(esBtn).toBeDefined();

      fireEvent.click(esBtn);
      expect(esBtn.getAttribute('aria-pressed')).toBe('true');

      // Theme toggle
      const themeToggle = screen.getByTestId('public-theme-toggle');
      fireEvent.click(themeToggle);
      expect(onToggleTheme).toHaveBeenCalledTimes(1);

      // Accessibility trigger
      const a11yTrigger = screen.getByTestId('accessibility-panel-trigger');
      fireEvent.click(a11yTrigger);
      expect(onOpenA11y).toHaveBeenCalledTimes(1);

      // Project Portal CTA
      const portalCta = screen.getByTestId('client-login-link');
      fireEvent.click(portalCta);
      expect(onLogin).toHaveBeenCalledTimes(1);
    });

    it('starts the demo tour from the public header', () => {
      const onStartDemoTour = vi.fn();
      render(<LandingNavbar onLogin={vi.fn()} onStartDemoTour={onStartDemoTour} />);

      const btn = screen.getByTestId('demo-tour-start');
      fireEvent.click(btn);
      expect(onStartDemoTour).toHaveBeenCalledTimes(1);
    });

    it('toggles mobile drawer with accessible controls', () => {
      const onToggleTheme = vi.fn();
      const onOpenA11y = vi.fn();
      const onLogin = vi.fn();

      render(
        <LandingNavbar
          onLogin={onLogin}
          onToggleTheme={onToggleTheme}
          onOpenA11y={onOpenA11y}
        />
      );

      const menuBtn = screen.getByLabelText(/Toggle menu|Alternar menú/i);
      fireEvent.click(menuBtn);

      expect(screen.getByTestId('mobile-lang-btn-en')).toBeDefined();
      expect(screen.getByTestId('mobile-lang-btn-es')).toBeDefined();

      const mobileA11y = screen.getByTestId('mobile-accessibility-trigger');
      fireEvent.click(mobileA11y);
      expect(onOpenA11y).toHaveBeenCalledTimes(1);

      // Reopen to click theme toggle
      fireEvent.click(screen.getByLabelText(/Toggle menu|Alternar menú/i));
      const mobileThemeToggle = screen.getByTestId('mobile-theme-toggle');
      fireEvent.click(mobileThemeToggle);
      expect(onToggleTheme).toHaveBeenCalledTimes(1);
    });
  });

  describe('LandingAssistantLauncher Component', () => {
    it('renders a compact brand launcher in the bottom right', () => {
      render(<LandingAssistantLauncher />);

      const launcher = screen.getByTestId('landing-assistant-launcher');
      expect(launcher).toBeDefined();
      expect(launcher.textContent).toMatch(/Ask GARNIER|Consultar a GARNIER/i);

      const symbol = launcher.querySelector('.arch-tech-logo-mark img');
      expect(symbol).not.toBeNull();
      expect(symbol?.getAttribute('src')).toContain('penrose-mint-charcoal.png');
    });

    it('opens and closes the assistant panel with button and escape key', () => {
      render(<LandingAssistantLauncher />);

      const launcher = screen.getByTestId('landing-assistant-launcher');
      fireEvent.click(launcher);

      const panel = screen.getByTestId('landing-assistant-panel');
      expect(panel).toBeDefined();
      expect(panel.getAttribute('role')).toBe('dialog');

      // Escape key closes panel
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.queryByTestId('landing-assistant-panel')).toBeNull();

      // Click opens again, close button closes panel
      fireEvent.click(screen.getByTestId('landing-assistant-launcher'));
      expect(screen.getByTestId('landing-assistant-panel')).toBeDefined();

      const closeBtn = within(screen.getByTestId('landing-assistant-panel')).getByRole('button', { name: /Close assistant|Cerrar asistente/i });
      fireEvent.click(closeBtn);
      expect(screen.queryByTestId('landing-assistant-panel')).toBeNull();
    });

    it('renders concise capability guidance in welcome state instead of empty void', () => {
      render(<LandingAssistantLauncher />);

      fireEvent.click(screen.getByTestId('landing-assistant-launcher'));
      const panel = screen.getByTestId('landing-assistant-panel');

      expect(within(panel).getByText(/AVAILABLE INTELLIGENCE|CONSULTAS DISPONIBLES/i)).toBeDefined();
      expect(within(panel).getAllByText(/GARNIER ASSISTANT|ASISTENTE GARNIER/i).length).toBeGreaterThan(0);
    });

    it('sends message on quick prompt click', async () => {
      vi.spyOn(aiService, 'isConfigured').mockReturnValue(true);
      const generateSpy = vi.spyOn(aiService, 'generateResponse').mockResolvedValue({
        message: 'Zona Franca La Lima is a leading park.',
      });

      render(<LandingAssistantLauncher />);
      fireEvent.click(screen.getByTestId('landing-assistant-launcher'));

      const panel = screen.getByTestId('landing-assistant-panel');
      const promptBtn = within(panel).getByRole('button', { name: /Show me industrial projects|Muéstrame proyectos industriales/i });

      fireEvent.click(promptBtn);

      await waitFor(() => {
        expect(generateSpy).toHaveBeenCalled();
        expect(within(panel).getByText('Zona Franca La Lima is a leading park.')).toBeDefined();
      });
    });

    it('sends message when typed into the input', async () => {
      vi.spyOn(aiService, 'isConfigured').mockReturnValue(true);
      const generateSpy = vi.spyOn(aiService, 'generateResponse').mockResolvedValue({
        message: 'Here is information about the development.',
      });

      render(<LandingAssistantLauncher />);
      fireEvent.click(screen.getByTestId('landing-assistant-launcher'));

      const panel = screen.getByTestId('landing-assistant-panel');
      const input = within(panel).getByRole('textbox');

      fireEvent.change(input, { target: { value: 'What is the project progress?' } });
      fireEvent.submit(input.closest('form')!);

      await waitFor(() => {
        expect(generateSpy).toHaveBeenCalled();
        expect(within(panel).getByText('Here is information about the development.')).toBeDefined();
      });
    });

    it('shows translated error state when remote AI is unavailable', async () => {
      vi.spyOn(aiService, 'isConfigured').mockReturnValue(false);

      render(<LandingAssistantLauncher />);
      fireEvent.click(screen.getByTestId('landing-assistant-launcher'));

      const panel = screen.getByTestId('landing-assistant-panel');
      const input = within(panel).getByRole('textbox');

      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.submit(input.closest('form')!);

      await waitFor(() => {
        expect(within(panel).getByText(/assistant service is currently unavailable|servicio del asistente no está disponible/i)).toBeDefined();
      });
    });

    it('respects lightTheme prop in launcher and docked shell', () => {
      const { rerender } = render(<LandingAssistantLauncher lightTheme={false} />);
      const darkLauncher = screen.getByTestId('landing-assistant-launcher');
      expect(darkLauncher.querySelector('.arch-tech-logo-mark img')?.getAttribute('src')).toContain('penrose-mint-charcoal.png');

      rerender(<LandingAssistantLauncher lightTheme={true} />);
      const lightLauncher = screen.getByTestId('landing-assistant-launcher');
      expect(lightLauncher.querySelector('.arch-tech-logo-mark img')?.getAttribute('src')).toContain('penrose-mint-charcoal.png');
    });
  });
});
