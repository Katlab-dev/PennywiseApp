import React from 'react';

export default function AmbientBackground() {
  return (
    <div className="ambient-backdrop" aria-hidden="true">
      <span className="ambient-backdrop__grid" />
      <span className="ambient-orb ambient-orb--mint" />
      <span className="ambient-orb ambient-orb--blue" />
      <span className="ambient-orb ambient-orb--coral" />
      <span className="ambient-backdrop__beam" />
      <span className="ambient-backdrop__grain" />
    </div>
  );
}
