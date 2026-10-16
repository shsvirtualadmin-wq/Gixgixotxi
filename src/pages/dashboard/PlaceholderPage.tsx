export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', padding: '4rem 1rem' }}>
      <h1
        className="font-display"
        style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 12, letterSpacing: '-0.03em' }}
      >
        {title}
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
        This section is coming in a future phase. Stay tuned!
      </p>
    </div>
  );
}
