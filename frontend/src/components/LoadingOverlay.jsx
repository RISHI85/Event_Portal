import React from 'react';
import useUiStore from '../store/uiStore';

const LoadingOverlay = () => {
  const loadingCount = useUiStore((s) => s.loadingCount);
  const isLoading = loadingCount > 0;
  if (!isLoading) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(1px)'
    }}>
      <div style={{
        background: 'white', padding: '14px 18px', borderRadius: 10,
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)', display: 'flex',
        alignItems: 'center', gap: 12
      }}>
        <span className="spinner" style={{
          width: 18, height: 18, border: '3px solid #e5e7eb', borderTopColor: '#7c3aed',
          borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite'
        }} />
        <span>Loading...</span>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default LoadingOverlay;
