import React from 'react';
import { PackageSearch } from 'lucide-react';

export function ComingSoon() {
  return (
    <div className="empty-state neo-surface" style={{ marginTop: '4rem' }}>
      <PackageSearch size={64} />
      <h3>Módulo en desarrollo</h3>
      <p>Este módulo se habilitará próximamente.</p>
    </div>
  );
}
