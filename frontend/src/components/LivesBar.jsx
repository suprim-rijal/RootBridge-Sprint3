import { Heart } from "lucide-react";

// The hearts. Used in the top bar (every page) and inside a lesson.
// Only Normal learners have hearts; for anyone else this draws nothing.
export default function LivesBar({ lives, compact = false }) {
  if (!lives?.enabled) return null;
  const max = lives.max ?? 7;
  const size = compact ? 15 : 17;

  return (
    <span className={`ln-hearts ${compact ? "compact" : ""} ${lives.lives === 0 ? "empty" : ""}`} aria-label={`${lives.lives} of ${max} hearts left`}>
      {Array.from({ length: max }, (_, i) => (
        <Heart key={i} size={size} className={i < lives.lives ? "full" : "empty"} aria-hidden="true" />
      ))}
    </span>
  );
}
