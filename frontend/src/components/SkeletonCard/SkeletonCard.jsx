import React from 'react';
import './SkeletonCard.css';

const SkeletonCard = () => {
  return (
    <div className="skeleton-card">
      <div className="skeleton-image-wrapper">
        <div className="skeleton-image"></div>
      </div>
      <div className="skeleton-content">
        <div className="skeleton-line skeleton-line-lg"></div>
        <div className="skeleton-line skeleton-line-md"></div>
        <div className="skeleton-line skeleton-line-sm"></div>
        <div className="skeleton-line skeleton-line-xs"></div>
        <div className="skeleton-line skeleton-line-md"></div>
        <div className="skeleton-actions">
          <div className="skeleton-button"></div>
          <div className="skeleton-button"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
