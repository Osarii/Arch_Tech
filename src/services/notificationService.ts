import { getPortalSnapshot, updatePortalDatabase, type PortalDatabase } from '../portal/data';
import { apiClient, getApiBaseUrl } from './apiClient';

export type PortalNotification = PortalDatabase['notifications'][number];

export const notificationService = {
  async list(): Promise<PortalNotification[]> {
    if (!getApiBaseUrl()) return getPortalSnapshot().db.notifications;
    return apiClient.get<PortalNotification[]>('/notifications');
  },
  async create(notification: PortalNotification): Promise<PortalNotification> {
    if (!getApiBaseUrl()) {
      updatePortalDatabase((current) => ({ ...current, notifications: [...current.notifications, notification] }));
      return notification;
    }
    return apiClient.post<PortalNotification>('/notifications', notification);
  },
};
