import React, { useState } from 'react';
import type { PortalProject } from '../../portal/data';

/**
 * Explicit landing mapping to locally stored official Garnier project media.
 * Each entry stays inside its own project directory to prevent cross-project
 * image substitution during the showcase migration.
 */
export const preferredProjectImages: Record<string, string> = {
  'zona-franca-la-lima': '/projects/zona-franca-la-lima/garnier-cover.webp',
  'el-cafetal': '/projects/el-cafetal/garnier-cover.webp',
  'santa-ana-country-club': '/projects/santa-ana-country-club/garnier-cover.webp',
  'waldorf-astoria': '/projects/waldorf-astoria/garnier-cover.jpg',
  'centro-corporativo-sabana': '/projects/centro-corporativo-sabana/garnier-cover.jpg',
  'universidad-latina': '/projects/universidad-latina/garnier-cover.webp',
};

/**
 * The portfolio section uses a second frame for the first project so the
 * landing page does not repeat the carousel's opening photograph immediately.
 * Every fallback remains project-scoped and never borrows another project's media.
 */
export const showcaseProjectImages: Record<string, string> = {
  'zona-franca-la-lima': '/projects/zona-franca-la-lima/garnier-01.webp',
  'el-cafetal': '/projects/el-cafetal/garnier-01.webp',
  'santa-ana-country-club': '/projects/santa-ana-country-club/garnier-01.webp',
  'waldorf-astoria': '/projects/waldorf-astoria/garnier-01.jpeg',
  'centro-corporativo-sabana': '/projects/centro-corporativo-sabana/garnier-01.jpg',
  'universidad-latina': '/projects/universidad-latina/garnier-01.webp',
};

export type ProjectImageUsage = 'carousel' | 'showcase';

export const getProjectImage = (project: PortalProject, usage: ProjectImageUsage = 'carousel'): string => {
  const mappedImage = usage === 'showcase' ? showcaseProjectImages[project.id] : preferredProjectImages[project.id];
  return mappedImage || project.image || project.media?.gallery?.[0] || project.media?.aerial || '';
};

export const getPreferredProjectImage = (project: PortalProject): string => getProjectImage(project, 'carousel');
export const getShowcaseProjectImage = (project: PortalProject): string => getProjectImage(project, 'showcase');

interface ProjectImageProps {
  project: PortalProject;
  alt: string;
  className?: string;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
  usage?: ProjectImageUsage;
}

export const ProjectImage: React.FC<ProjectImageProps> = ({ project, alt, className = '', loading = 'lazy', fetchPriority = 'low', usage = 'carousel' }) => {
  const [failed, setFailed] = useState(false);
  const src = getProjectImage(project, usage);

  if (!src || failed) {
    return (
      <span
        data-testid={`project-image-fallback-${project.id}`}
        role="img"
        aria-label={`${project.title} image unavailable`}
        className={`landing-image-fallback ${className}`}
      >
        <span>ARCH_TECH / DEVELOPMENT</span>
      </span>
    );
  }

  return <img data-project-image={project.id} src={src} alt={alt} loading={loading} fetchPriority={fetchPriority} decoding="async" onError={() => setFailed(true)} className={className} />;
};
