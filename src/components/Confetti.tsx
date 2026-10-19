const COLORS = ['var(--g-yellow)', 'var(--g-magenta)', 'var(--g-blue)', 'var(--g-green)', 'var(--g-orange)']

/** Korte, niet-interactieve confettibui na een opgeslagen persoonlijk record. */
export default function Confetti() {
  return (
    <div className="record-confetti" aria-hidden="true">
      {Array.from({ length: 72 }, (_, i) => (
        <i key={i} style={{
          left: `${(i * 37) % 100}%`,
          background: COLORS[i % COLORS.length],
          width: `${5 + (i % 4)}px`,
          height: `${8 + (i % 6)}px`,
          borderRadius: i % 3 === 0 ? '50%' : '1px',
          animationDelay: `${(i % 12) * 35}ms`,
          ['--confetti-drift' as string]: `${((i * 29) % 180) - 90}px`,
          ['--confetti-spin' as string]: `${(i % 2 ? 1 : -1) * (360 + (i % 5) * 180)}deg`,
        }} />
      ))}
    </div>
  )
}
