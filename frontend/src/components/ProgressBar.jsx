// Horizontal progress bar using Elearn's .progress-track / .progress-fill.
// The fill colour follows the track colour (--track) of the parent element.
export default function ProgressBar({ value = 0, label }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className="progress-track ln-progress"
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
