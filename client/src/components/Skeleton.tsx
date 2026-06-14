export function SkeletonCard({ height = 80 }: { height?: number }) {
  return (
    <div style={{
      background: 'white', borderRadius: 16, height,
      border: '1px solid var(--border)',
      overflow: 'hidden', position: 'relative',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(90deg, #f0f4f5 25%, #e8eef0 50%, #f0f4f5 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }} />
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} height={72} />
      ))}
    </div>
  );
}
