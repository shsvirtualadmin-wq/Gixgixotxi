export function BackgroundCanvas() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        overflow: 'hidden',
        background: 'linear-gradient(180deg, var(--bg) 0%, var(--bg-2) 100%)',
      }}
      className="bg-grid"
    >
      {/* Brand blue glow — top left */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          width: '50vw',
          height: '50vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(47,107,255,0.18) 0%, transparent 70%)',
          animation: 'drift 20s ease-in-out infinite',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
      {/* Violet glow — bottom right */}
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '-10%',
          width: '40vw',
          height: '40vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,92,255,0.15) 0%, transparent 70%)',
          animation: 'drift-reverse 25s ease-in-out infinite',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
