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

export const getPreferredProjectImage = (project: PortalProject): string => (
  preferredProjectImages[project.id] || project.image || project.media?.gallery?.[0] || project.media?.aerial || ''
);

interface ProjectImageProps {
  project: PortalProject;
  alt: string;
  className?: string;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
}

export const ProjectImage: React.FC<ProjectImageProps> = ({ project, alt, className = '', loading = 'lazy', fetchPriority = 'low' }) => {
  const [failed, setFailed] = useState(false);
  const src = getPreferredProjectImage(project);

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
