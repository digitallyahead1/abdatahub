'use client'

export function ServiceCard({
  title,
  description,
  icon,
  onClick,
}: {
  title: string
  description: string
  icon: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="card-gradient p-6 rounded-lg border border-silver-muted/10 hover:border-primary-glow/50 transition-all hover:shadow-glow-blue text-left"
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-silver-light mb-2">{title}</h3>
      <p className="text-sm text-silver-muted">{description}</p>
      <div className="mt-4 text-primary-blue text-sm font-medium">Get Started →</div>
    </button>
  )
}
