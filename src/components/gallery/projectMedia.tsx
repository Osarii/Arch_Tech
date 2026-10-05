import React, { useState } from 'react';
import type { PortalProject } from '../../portal/data';

/**
 * Preferred real-world reference photographs for the public-facing portfolio.
 * The concept/render packs remain available to the private technical dossier.
 */
export const preferredProjectImages: Record<string, string> = {
  'pacific-nexus-free-zone': '/projects/pacific-nexus-free-zone/landing-real.jpg',
  'summit-point-corporate-district': '/projects/summit-point-corporate-district/landing-real.jpg',
  'mar-vista-hospitality-district': '/projects/mar-vista-hospitality-district/landing-real.jpg',
  'caribbean-ai-compute-campus': '/projects/caribbean-ai-compute-campus/landing-real.jpg',
  'guanacaste-renewable-compute-campus': '/projects/guanacaste-renewable-compute-campus/landing-real.jpg',
  'pacific-regional-medical-campus': '/projects/pacific-regional-medical-campus/landing-real.jpg',
};

export const getPreferredProjectImage = (project: PortalProject): string => (
  preferredProjectImages[project.id] || project.image || project.media?.aerial || ''
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
