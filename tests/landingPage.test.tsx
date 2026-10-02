import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LandingPage } from '../src/components/landing/LandingPage';
import { LandingNavbar } from '../src/components/landing/LandingNavbar';
import { Hero } from '../src/components/landing/Hero';
import { ProductPreview } from '../src/components/landing/ProductPreview';
import { Capabilities } from '../src/components/landing/Capabilities';
import { Workflow } from '../src/components/landing/Workflow';
import { TechnologyStrip } from '../src/components/landing/TechnologyStrip';
import { FinalCTA } from '../src/components/landing/FinalCTA';
import { App } from '../src/App';

describe('Phase LANDING-1: Architectural Studio Editorial Landing Page', () => {
  it('renders LandingNavbar with architectural brand, links, and primary CTA', () => {
    const handleOpenWorkspace = vi.fn();
    render(<LandingNavbar onOpenWorkspace={handleOpenWorkspace} />);

    expect(screen.getByText('ARCH_TECH')).toBeDefined();
    expect(screen.getByText(/STUDIO \/\/ OPENBIM/i)).toBeDefined();
    expect(screen.getByText('Capabilities')).toBeDefined();
    expect(screen.getByText('Workflow')).toBeDefined();
    expect(screen.getByText('Selected Models')).toBeDefined();

    const ctaBtn = screen.getByTestId('landing-btn-open-workspace');
    expect(ctaBtn).toBeDefined();
    expect(ctaBtn.textContent).toContain('ENTER WORKSPACE');
    fireEvent.click(ctaBtn);
    expect(handleOpenWorkspace).toHaveBeenCalledTimes(1);
  });

  it('renders Hero section with architectural typography, subtitle, and primary CTA', () => {
    const handleOpenWorkspace = vi.fn();
    render(<Hero onOpenWorkspace={handleOpenWorkspace} />);

    expect(screen.getByText('ARCH_TECH')).toBeDefined();
    expect(screen.getByText('Design, inspect and modify IFC models in the browser.')).toBeDefined();
    expect(screen.getByText('OpenBIM tools for architectural workflows.')).toBeDefined();

    const heroCta = screen.getByTestId('hero-btn-open-workspace');
    expect(heroCta).toBeDefined();
    expect(heroCta.textContent).toContain('ENTER WORKSPACE');
    fireEvent.click(heroCta);
    expect(handleOpenWorkspace).toHaveBeenCalledTimes(1);

    expect(screen.getByText('01 / ARCHITECTURAL STUDY')).toBeDefined();
    expect(screen.getByText('02 / OPENBIM MODEL')).toBeDefined();
    expect(screen.getByText('03 / ARCH_TECH WORKSPACE')).toBeDefined();
    expect(screen.getAllByTestId(/hero-sequence-panel-/i)).toHaveLength(3);

    fireEvent.mouseEnter(screen.getByTestId('hero-sequence-panel-1'));
    expect(screen.getByTestId('hero-sequence-counter').textContent).toContain('02 / 03');
  });

  it('renders Product section with workspace screenshot and minimal caption', () => {
    const handleOpenWorkspace = vi.fn();
    render(<ProductPreview onOpenWorkspace={handleOpenWorkspace} />);

    expect(screen.getByText(/One workspace./i)).toBeDefined();
    expect(screen.getByText(/IFC from inspection to export./i)).toBeDefined();
    expect(screen.getByAltText(/Arch_Tech BIM Workspace Screenshot/i)).toBeDefined();
  });

  it('renders Capabilities section with exactly 3 large editorial rows', () => {
    render(<Capabilities />);

    expect(screen.getByText('Inspect IFC')).toBeDefined();
    expect(screen.getByText('Modify models')).toBeDefined();
    expect(screen.getByText('Generate & export')).toBeDefined();
  });

  it('renders Workflow section with horizontal architectural diagram language', () => {
    render(<Workflow />);

    expect(screen.getByText('IMPORT')).toBeDefined();
    expect(screen.getByText('INSPECT')).toBeDefined();
    expect(screen.getByText('EDIT')).toBeDefined();
    expect(screen.getByText('EXPORT')).toBeDefined();
  });

  it('renders TechnologyStrip with understated technical stack', () => {
    render(<TechnologyStrip />);

    expect(screen.getByText('IFC4')).toBeDefined();
    expect(screen.getByText('web-ifc')).toBeDefined();
    expect(screen.getByText('That Open')).toBeDefined();
    expect(screen.getByText('Three.js')).toBeDefined();
  });

  it('renders FinalCTA with editorial title and primary CTA', () => {
    const handleOpenWorkspace = vi.fn();
    render(<FinalCTA onOpenWorkspace={handleOpenWorkspace} />);

    expect(screen.getByText('Open your model.')).toBeDefined();
    const ctaBtn = screen.getByTestId('final-cta-btn-open-workspace');
    expect(ctaBtn).toBeDefined();
    expect(ctaBtn.textContent).toContain('ENTER WORKSPACE');
    fireEvent.click(ctaBtn);
    expect(handleOpenWorkspace).toHaveBeenCalledTimes(1);
  });

  it('renders full LandingPage assembling all sections in architectural flow', () => {
    const handleOpenWorkspace = vi.fn();
    render(<LandingPage onOpenWorkspace={handleOpenWorkspace} />);

    expect(screen.getAllByText('ARCH_TECH').length).toBeGreaterThan(0);
    expect(screen.getByText('Design, inspect and modify IFC models in the browser.')).toBeDefined();
    expect(screen.getByText(/IFC from inspection to export./i)).toBeDefined();
    expect(screen.getByText('Inspect IFC')).toBeDefined();
    expect(screen.getByText('The engineering pipeline.')).toBeDefined();
    expect(screen.getByText('Curated model library.')).toBeDefined();
    expect(screen.getByText('Open your model.')).toBeDefined();
  });

  it('App defaults to LandingPage and switches to Workspace when CTA clicked', () => {
    window.location.hash = '';
    render(<App />);

    // Initially landing page is rendered
    expect(screen.getByText('Design, inspect and modify IFC models in the browser.')).toBeDefined();
    expect(screen.getByTestId('hero-btn-open-workspace')).toBeDefined();

    // Click CTA to enter Workspace
    fireEvent.click(screen.getByTestId('hero-btn-open-workspace'));

    // Hash is updated and Workspace is mounted with return button
    expect(window.location.hash).toBe('#workspace');
    expect(screen.getByTestId('btn-back-to-landing')).toBeDefined();

    // Click return to landing
    fireEvent.click(screen.getByTestId('btn-back-to-landing'));
    expect(window.location.hash).toBe('#landing');
    expect(screen.getByText('Design, inspect and modify IFC models in the browser.')).toBeDefined();
  });
});
