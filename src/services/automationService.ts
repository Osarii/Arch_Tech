import { apiClient, getApiBaseUrl } from './apiClient';
import { getStoredLocale } from '../portal/locale';

export type AutomationEventName = 'project.created' | 'project.updated' | 'approval.requested';
export type AutomationEvent = {
  event: AutomationEventName;
  projectId: string;
  message?: string;
  locale?: 'en' | 'es';
  metadata?: Record<string, unknown>;
};
export type AutomationResult = { success: boolean; notification?: { message: string; date?: string }; error?: string };

const getWebhookUrl = () => (import.meta.env.VITE_N8N_AUTOMATION_WEBHOOK_URL ?? '').trim();

export const automationService = {
  isConfigured: () => Boolean(getWebhookUrl()),
  async emit(event: AutomationEvent): Promise<AutomationResult> {
    const webhookUrl = getWebhookUrl();
    if (!webhookUrl) return { success: false, error: 'Automation webhook is not configured.' };
    try {
      const payload = {
        locale: event.locale ?? getStoredLocale(),
        ...event,
      };
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) return { success: false, error: `Automation failed with status ${response.status}.` };
      const body = await response.json() as Partial<AutomationResult>;
      return { success: true, notification: body.notification };
    } catch {
      return { success: false, error: 'Automation webhook is unreachable.' };
    }
  },
  async listRemoteProjects(): Promise<unknown> {
    if (!getApiBaseUrl()) return null;
    return apiClient.get('/projects');
  },
};
