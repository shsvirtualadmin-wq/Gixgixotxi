export function BackgroundCanvas() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        backgroundColor: 'var(--bg)',
      }}
    />
  );
}
