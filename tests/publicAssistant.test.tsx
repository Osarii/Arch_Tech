import { describe, expect, it, vi, beforeEach } from 'vitest';
import { publicAssistant } from '../src/services/publicAssistantService';
import { aiService } from '../src/services/aiService';
import { bimAgent } from '../src/bim/ai/AIAgent';

describe('Public Assistant Service', () => {
  beforeEach(() => {
    publicAssistant.clearHistory();
    bimAgent.clearHistory();
    vi.restoreAllMocks();
  });

  it('dispatches public requests with role="public", route="/" and tools=[]', async () => {
    vi.spyOn(aiService, 'isConfigured').mockReturnValue(true);
    const generateSpy = vi.spyOn(aiService, 'generateResponse').mockResolvedValue({
      message: 'GARNIER develops corporate campuses, industrial parks and hospitality.',
    });

    const response = await publicAssistant.sendMessage('What types of projects do you develop?', 'en');

    expect(generateSpy).toHaveBeenCalledTimes(1);
    const payload = generateSpy.mock.calls[0][0];
    expect(payload.role).toBe('public');
    expect(payload.route).toBe('/');
    expect(payload.tools).toEqual([]);
    expect(payload.userPrompt).toBe('What types of projects do you develop?');
    expect(payload.locale).toBe('en');

    expect(response.content).toBe('GARNIER develops corporate campuses, industrial parks and hospitality.');
    expect(response.role).toBe('assistant');
  });

  it('isolates public history and does not share BIM history from bimAgent', async () => {
    vi.spyOn(aiService, 'isConfigured').mockReturnValue(true);
    vi.spyOn(aiService, 'generateResponse').mockResolvedValue({
      message: 'Public answer',
    });

    const bimCountBefore = bimAgent.getMessages().length;

    await publicAssistant.sendMessage('Hello from visitor', 'en');

    const publicHistory = publicAssistant.getHistory();
    expect(publicHistory).toHaveLength(2); // user + assistant
    expect(publicHistory[0].content).toBe('Hello from visitor');
    expect(publicHistory[1].content).toBe('Public answer');

    // bimAgent must have zero messages from public assistant
    expect(bimAgent.getMessages()).toHaveLength(bimCountBefore);
    expect(bimAgent.getMessages().some((m) => m.content === 'Hello from visitor')).toBe(false);
  });

  it('provides a clean fallback message when remote AI is unconfigured or unavailable', async () => {
    vi.spyOn(aiService, 'isConfigured').mockReturnValue(false);
    const generateSpy = vi.spyOn(aiService, 'generateResponse');

    const resEn = await publicAssistant.sendMessage('Tell me about your services', 'en');
    expect(generateSpy).not.toHaveBeenCalled();
    expect(resEn.content).toContain('The assistant service is currently unavailable');

    const resEs = await publicAssistant.sendMessage('Cuéntame sobre sus servicios', 'es');
    expect(resEs.content).toContain('El servicio del asistente no está disponible en este momento');
  });

  it('handles remote network failures gracefully with offline message', async () => {
    vi.spyOn(aiService, 'isConfigured').mockReturnValue(true);
    vi.spyOn(aiService, 'generateResponse').mockRejectedValue(new Error('Network failure'));

    const res = await publicAssistant.sendMessage('Show me industrial projects', 'en');
    expect(res.content).toContain('The assistant service is currently unavailable');
    expect(publicAssistant.getHistory()).toHaveLength(2);
  });
});
