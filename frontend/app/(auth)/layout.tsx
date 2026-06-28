import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-dark-bg text-silver-light flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background neon glows */}
      <div className="absolute w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] bg-primary-glow/10 rounded-full blur-[120px] top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 -z-10 animate-pulse" />
      <div className="absolute w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] bg-primary-blue/5 rounded-full blur-[120px] bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 -z-10" />

      {/* Brand logo & title */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <a href="/" className="inline-flex flex-col items-center space-y-3 group">
          <div className="relative w-16 h-16 overflow-hidden rounded-2xl border border-primary-glow/20 glow-blue group-hover:scale-105 transition-transform duration-300">
            <Image
              src="/logo.png"
              alt="AB Data Hub Logo"
              fill
              className="object-cover"
            />
          </div>
          <h2 className="text-2xl font-bold tracking-wider bg-gradient-to-r from-primary-blue to-primary-glow bg-clip-text text-transparent">
            AB DATA HUB
          </h2>
        </a>
      </div>

      {/* Main card */}
      <div className="w-full max-w-md p-8 bg-dark-bg-secondary/40 border border-silver-muted/10 rounded-3xl glass-dark glow-blue relative z-10">
        {children}
      </div>
    </div>
  )
}
