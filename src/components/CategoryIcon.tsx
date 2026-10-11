// Category icon — references the sprite at /placeholders/icons.svg
export function CategoryIcon({ icon, className }: { icon?: string | null; className?: string }) {
  const key = icon || 'default'
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <use href={`/placeholders/icons.svg#icon-${key}`} />
    </svg>
  )
}
