import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-dark-bg-secondary border-t border-silver-muted/10 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Logo & Description */}
          <div className="space-y-4 col-span-1 md:col-span-1">
            <div className="flex items-center space-x-3">
              <div className="relative w-10 h-10 overflow-hidden rounded-lg border border-primary-glow/20 glow-blue">
                <Image
                  src="/logo.png"
                  alt="AB Data Hub Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-lg font-bold tracking-wider bg-gradient-to-r from-primary-blue to-primary-glow bg-clip-text text-transparent">
                AB DATA HUB
              </span>
            </div>
            <p className="text-sm text-silver-muted leading-relaxed">
              Nigeria's premium fintech-grade VTU and bill payment hub. Fast, secure, and always reliable.
            </p>
            <div className="text-sm font-semibold text-primary-glow">
              Contact: <a href="tel:07045357195" className="hover:underline transition-all">07045357195</a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm tracking-wider uppercase">Services</h3>
            <ul className="space-y-2 text-sm text-silver-muted">
              <li><a href="/login" className="hover:text-primary-glow transition-all">Data Subscription</a></li>
              <li><a href="/login" className="hover:text-primary-glow transition-all">Airtime Top-Up</a></li>
              <li><a href="/login" className="hover:text-primary-glow transition-all">Cable TV Billing</a></li>
              <li><a href="/login" className="hover:text-primary-glow transition-all">Electricity Tokens</a></li>
              <li><a href="/login" className="hover:text-primary-glow transition-all">Educational Pins</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm tracking-wider uppercase">Company</h3>
            <ul className="space-y-2 text-sm text-silver-muted">
              <li><a href="#" className="hover:text-primary-glow transition-all">About Us</a></li>
              <li><a href="#" className="hover:text-primary-glow transition-all">Contact Us</a></li>
              <li><a href="#" className="hover:text-primary-glow transition-all">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary-glow transition-all">Terms of Service</a></li>
            </ul>
          </div>

          {/* Social Links & Trust */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold mb-4 text-sm tracking-wider uppercase">Connect With Us</h3>
            <div className="flex space-x-4">
              <a 
                href="https://wa.me/2347045357195" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 bg-white/5 hover:bg-emerald-500/20 rounded-lg text-silver-muted hover:text-[#25D366] transition-all"
                title="Chat on WhatsApp"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.734-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.116-2.905-6.994C16.557 1.866 14.077.835 11.44.835c-5.448 0-9.88 4.417-9.884 9.864-.002 2.01.52 3.975 1.517 5.688l-1.015 3.701 3.792-.995c1.602.875 3.327 1.336 4.797 1.336zM17.65 14.9c-.314-.155-1.85-.909-2.13-.102c-.28.093-.483.31-.594.436-.11.127-.225.26-.342.383-.342.36-.68.18-.994.025-1.258-.62-2.176-1.572-2.73-2.532-.303-.522.062-.806.326-1.126.11-.133.224-.265.31-.383.097-.13.14-.223.21-.375.07-.154.035-.29-.018-.396-.053-.105-.483-1.14-.662-1.57-.175-.42-.37-.362-.507-.37-.13-.006-.28-.007-.43-.007-.15 0-.395.056-.6.282-.206.225-.785.753-.785 1.838 0 1.083.8 2.13.91 2.285.11.156 1.572 2.298 3.8 3.256 1.802.776 2.5.852 3.393.72.455-.067 1.393-.568 1.59-1.117.197-.55.197-1.02.137-1.12-.06-.1-.22-.154-.53-.31z" />
                </svg>
              </a>
              <a 
                href="https://www.facebook.com/share/1JD9G8vaVH/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 bg-white/5 hover:bg-primary-blue/20 rounded-lg text-silver-muted hover:text-white transition-all"
                title="Follow us on Facebook"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1V12h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/></svg>
              </a>
              <a 
                href="https://x.com/asserdiq360" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 bg-white/5 hover:bg-primary-blue/20 rounded-lg text-silver-muted hover:text-white transition-all"
                title="Follow us on X"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </a>
            </div>
          </div>
        </div>

        {/* Divider Line */}
        <div className="border-t border-silver-muted/10 pt-8 mt-8" />

        {/* Full-width sub-footer section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-silver-muted">
          <p>© {new Date().getFullYear()} AB Data Hub. All rights reserved. Registered under CAC.</p>
          <p>
            Designed by{' '}
            <a
              href="https://wa.me/2347067382927?text=Hello%20BitBridge%20Technologies,%20I%20have%20an%20inquiry%20about%20your%20services."
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-glow hover:text-cyan-400 hover:underline font-semibold transition-all"
            >
              BitBridge Technologies (07067382927)
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
