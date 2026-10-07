import i18n from '../i18n';
import type { PortalProject } from './data';

export const SEEDED_PROJECT_IDS = [
  'zona-franca-la-lima',
  'el-cafetal',
  'santa-ana-country-club',
  'waldorf-astoria',
  'centro-corporativo-sabana',
  'universidad-latina',
] as const;

export type SeededProjectId = (typeof SEEDED_PROJECT_IDS)[number];

export const isSeededProjectId = (id?: string | null): id is SeededProjectId =>
  Boolean(id && SEEDED_PROJECT_IDS.includes(id as SeededProjectId));

export const SEEDED_NEWS_IDS = [
  'news-zfll-expansion',
  'news-el-cafetal-sustainability',
  'news-waldorf-astoria-groundbreaking',
  'news-sacc-sports-facility',
  'news-n8n-daily-telemetry-ingest',
  'news-archived-concept-brief',
] as const;

export type SeededNewsId = (typeof SEEDED_NEWS_IDS)[number];

export const isSeededNewsId = (id?: string | null): id is SeededNewsId =>
  Boolean(id && SEEDED_NEWS_IDS.includes(id as SeededNewsId));

export type ProjectLocalizableField =
  | 'category'
  | 'phase'
  | 'nextMilestone'
  | 'summary'
  | 'statement'
  | 'developmentType'
  | 'publicStage'
  | 'longView';

export function getLocalizedProjectField(
  projectId: string,
  field: ProjectLocalizableField,
  fallbackValue?: string
): string {
  if (!isSeededProjectId(projectId)) {
    return fallbackValue ?? '';
  }
  return i18n.t(`projects.${projectId}.${field}`, {
    ns: 'public',
    defaultValue: fallbackValue ?? '',
  });
}

export function getLocalizedProject<T extends { id: string }>(project: T): T {
  if (!isSeededProjectId(project.id)) {
    return project;
  }
  const p = project as unknown as PortalProject;
  const localized = {
    ...project,
    category: getLocalizedProjectField(p.id, 'category', p.category),
    phase: getLocalizedProjectField(p.id, 'phase', p.phase),
    nextMilestone: getLocalizedProjectField(p.id, 'nextMilestone', p.nextMilestone),
    summary: getLocalizedProjectField(p.id, 'summary', p.summary),
    statement: getLocalizedProjectField(p.id, 'statement', p.statement),
    developmentType: getLocalizedProjectField(p.id, 'developmentType', p.developmentType ?? p.category),
    publicStage: getLocalizedProjectField(p.id, 'publicStage', p.publicStage ?? p.phase),
    longView: getLocalizedProjectField(p.id, 'longView', p.longView),
  };
  return localized as unknown as T;
}

const MILESTONE_LABEL_MAP: Record<string, string> = {
  'Public source intake': 'milestones.publicSourceIntake',
  'Media mapping': 'milestones.mediaMapping',
  'Showcase review': 'milestones.showcaseReview',
};

const MILESTONE_STATUS_MAP: Record<string, string> = {
  Complete: 'milestones.status.complete',
  Current: 'milestones.status.current',
  Upcoming: 'milestones.status.upcoming',
};

export function getLocalizedMilestoneLabel(label: string, projectId?: string): string {
  if (projectId && !isSeededProjectId(projectId)) {
    return label;
  }
  const key = MILESTONE_LABEL_MAP[label];
  if (!key) return label;
  return i18n.t(key, { ns: 'public', defaultValue: label });
}

export function getLocalizedMilestoneStatus(status: string): string {
  const key = MILESTONE_STATUS_MAP[status];
  if (!key) return status;
  return i18n.t(key, { ns: 'public', defaultValue: status });
}

export function getLocalizedMilestone<T extends { label: string; status: string; projectId?: string }>(milestone: T): T {
  return {
    ...milestone,
    label: getLocalizedMilestoneLabel(milestone.label, milestone.projectId),
    status: getLocalizedMilestoneStatus(milestone.status) as T['status'],
  };
}

export function getLocalizedMilestones<T extends { label: string; status: string; projectId?: string }>(milestones: T[]): T[] {
  return milestones.map(getLocalizedMilestone);
}

const SEEDED_UPDATE_BODY_KEYS: Record<string, string> = {
  'zona-franca-la-lima:04 OCT 2026': 'seeded.updates.showcaseMediaReviewZfllBody',
  'zona-franca-la-lima:01 OCT 2026': 'seeded.updates.portfolioFactsCheckedBody',
  'el-cafetal:29 SEP 2026': 'seeded.updates.showcaseMediaReviewEcBody',
  'santa-ana-country-club:26 SEP 2026': 'seeded.updates.projectReferencePreparedSaccBody',
  'waldorf-astoria:24 SEP 2026': 'seeded.updates.showcaseMediaReviewWaBody',
  'centro-corporativo-sabana:21 SEP 2026': 'seeded.updates.projectReferencePreparedCcsBody',
  'universidad-latina:18 SEP 2026': 'seeded.updates.showcaseMediaReviewUlBody',
};

const SEEDED_UPDATE_BODY_TEXT_KEYS: Record<string, string> = {
  'Location, scale and development description were aligned with the official public source.': 'seeded.updates.portfolioFactsCheckedBody',
  'Office-center information is organized for the showcase dossier.': 'seeded.updates.projectReferencePreparedCcsBody',
  'Public project information is organized for the showcase dossier.': 'seeded.updates.projectReferencePreparedSaccBody',
  'Corporate campus imagery is staged for the ARCH_TECH Concept Showcase.': 'seeded.updates.showcaseMediaReviewEcBody',
  'Educational campus imagery is staged for the ARCH_TECH Concept Showcase.': 'seeded.updates.showcaseMediaReviewUlBody',
  'Hospitality project imagery and public facts are ready for review.': 'seeded.updates.showcaseMediaReviewWaBody',
  'Official portfolio imagery and public facts are ready for the ARCH_TECH Concept Showcase.': 'seeded.updates.showcaseMediaReviewZfllBody',
};

const SEEDED_UPDATE_TITLE_KEYS: Record<string, string> = {
  'Showcase media review': 'seeded.updates.showcaseMediaReviewTitle',
  'Portfolio facts checked': 'seeded.updates.portfolioFactsCheckedTitle',
  'Project reference prepared': 'seeded.updates.projectReferencePreparedTitle',
};

export function getLocalizedUpdate<T extends { projectId?: string; date?: string; title: string; body?: string }>(
  update: T
): T {
  if (update.projectId && !isSeededProjectId(update.projectId)) {
    return update;
  }
  const titleKey = SEEDED_UPDATE_TITLE_KEYS[update.title];
  const title = titleKey
    ? i18n.t(titleKey, { ns: 'portal', defaultValue: update.title })
    : update.title;

  let body = update.body;
  if (update.body) {
    const directKey = SEEDED_UPDATE_BODY_TEXT_KEYS[update.body];
    if (directKey) {
      body = i18n.t(directKey, { ns: 'portal', defaultValue: update.body });
    } else if (update.projectId && update.date) {
      const lookupKey = `${update.projectId}:${update.date}`;
      const bodyKey = SEEDED_UPDATE_BODY_KEYS[lookupKey];
      if (bodyKey) {
        body = i18n.t(bodyKey, { ns: 'portal', defaultValue: update.body });
      }
    }
  }

  return {
    ...update,
    title,
    body,
  };
}

export function getLocalizedDocument<T extends { projectId?: string; name: string; meta?: string }>(doc: T, projectId?: string): T {
  const pId = projectId || doc.projectId;
  if (pId && !isSeededProjectId(pId)) {
    return doc;
  }
  let name = doc.name;
  let meta = doc.meta;

  if (doc.name === 'Official project reference') {
    name = i18n.t('seeded.documents.officialReferenceName', { ns: 'portal', defaultValue: doc.name });
    if (doc.meta === 'Concept Showcase · public source') {
      meta = i18n.t('seeded.documents.officialReferenceMeta', { ns: 'portal', defaultValue: doc.meta });
    }
  } else if (doc.name === 'Local media mapping') {
    name = i18n.t('seeded.documents.localMediaMappingName', { ns: 'portal', defaultValue: doc.name });
    if (doc.meta === 'Concept coordination · ARCH_TECH') {
      meta = i18n.t('seeded.documents.localMediaMappingMeta', { ns: 'portal', defaultValue: doc.meta });
    }
  }

  return {
    ...doc,
    name,
    meta,
  };
}

export function getLocalizedApprovalTitle(title: string, projectId?: string): string {
  if (projectId && !isSeededProjectId(projectId)) {
    return title;
  }
  if (title === 'Showcase framing') {
    return i18n.t('seeded.approvals.showcaseFraming', { ns: 'portal', defaultValue: title });
  }
  if (title === 'Public facts check') {
    return i18n.t('seeded.approvals.publicFactsCheck', { ns: 'portal', defaultValue: title });
  }
  return title;
}

export function getLocalizedApproval<T extends { projectId?: string; title: string }>(approval: T): T {
  return {
    ...approval,
    title: getLocalizedApprovalTitle(approval.title, approval.projectId),
  };
}

const SEEDED_NOTIFICATION_KEYS: Record<string, string> = {
  'Showcase framing is ready for review.': 'seeded.notifications.clientZfll',
  'Hospitality reference is ready for review.': 'seeded.notifications.clientWa',
  'Public source mapping is ready for coordination.': 'seeded.notifications.architectZfll',
  'Corporate campus reference is ready for coordination.': 'seeded.notifications.architectEc',
};

export function getLocalizedNotificationMessage(message: string, projectId?: string): string {
  if (projectId && !isSeededProjectId(projectId)) {
    return message;
  }
  const key = SEEDED_NOTIFICATION_KEYS[message];
  if (!key) return message;
  return i18n.t(key, { ns: 'portal', defaultValue: message });
}

export function getLocalizedNotification<T extends { projectId?: string; message: string }>(notification: T): T {
  return {
    ...notification,
    message: getLocalizedNotificationMessage(notification.message, notification.projectId),
  };
}

export function getLocalizedNewsArticle<T extends { id: string; title: string; excerpt?: string; body?: string; category?: string; sourceLabel?: string }>(
  article: T
): T {
  if (!isSeededNewsId(article.id)) {
    return article;
  }
  return {
    ...article,
    title: i18n.t(`articles.${article.id}.title`, { ns: 'news', defaultValue: article.title }),
    excerpt: article.excerpt
      ? i18n.t(`articles.${article.id}.excerpt`, { ns: 'news', defaultValue: article.excerpt })
      : article.excerpt,
    body: article.body
      ? i18n.t(`articles.${article.id}.body`, { ns: 'news', defaultValue: article.body })
      : article.body,
    category: article.category
      ? (i18n.t(`articles.${article.id}.category`, { ns: 'news', defaultValue: article.category }) as any)
      : article.category,
    sourceLabel: article.sourceLabel
      ? i18n.t(`articles.${article.id}.sourceLabel`, { ns: 'news', defaultValue: article.sourceLabel })
      : article.sourceLabel,
  };
}
