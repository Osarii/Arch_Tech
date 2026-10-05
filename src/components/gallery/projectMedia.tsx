import React, { useState } from 'react';
import type { PortalProject } from '../../portal/data';

/**
 * Explicit landing mapping to locally stored Garnier portfolio photography.
 * The fictional ARCH_TECH project identities remain unchanged; these images
 * are presentation references for scale and context only.
 */
export const preferredProjectImages: Record<string, string> = {
  'pacific-nexus-free-zone': '/projects/pacific-nexus-free-zone/garnier-portfolio.webp',
  'summit-point-corporate-district': '/projects/summit-point-corporate-district/garnier-portfolio.jpg',
  'mar-vista-hospitality-district': '/projects/mar-vista-hospitality-district/garnier-portfolio.jpg',
  'caribbean-ai-compute-campus': '/projects/caribbean-ai-compute-campus/garnier-portfolio.webp',
  'guanacaste-renewable-compute-campus': '/projects/guanacaste-renewable-compute-campus/garnier-portfolio.webp',
  'pacific-regional-medical-campus': '/projects/pacific-regional-medical-campus/garnier-portfolio.webp',
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
