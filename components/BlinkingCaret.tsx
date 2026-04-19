export function BlinkingCaret({ className = "" }: { className?: string }) {
  return <span className={`caret ${className}`} aria-hidden />;
}
