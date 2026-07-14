import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen bg-dark-bg text-silver-light relative">
      <Navbar />
      <div className="flex-grow pt-20">
        {children}
      </div>

      {/* Floating WhatsApp Widget */}
      <a
        href="https://wa.me/2348133887526?text=Hello%20AB%20Data%20Hub%20Support,%20I%20have%20an%20inquiry."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex flex-col items-center group cursor-pointer"
        id="floating-whatsapp-widget"
      >
        {/* Glow backdrop shadow */}
        <span className="absolute w-14 h-14 bg-[#25D366]/20 rounded-full blur-md group-hover:scale-125 transition-all duration-300" />
        
        {/* Green Circle Icon */}
        <div className="relative w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-[0_4px_15px_rgba(37,211,102,0.4)] group-hover:scale-105 transition-all duration-300">
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.734-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.116-2.905-6.994C16.557 1.866 14.077.835 11.44.835c-5.448 0-9.88 4.417-9.884 9.864-.002 2.01.52 3.975 1.517 5.688l-1.015 3.701 3.792-.995c1.602.875 3.327 1.336 4.797 1.336zM17.65 14.9c-.314-.155-1.85-.909-2.13-.102c-.28.093-.483.31-.594.436-.11.127-.225.26-.342.383-.342.36-.68.18-.994.025-1.258-.62-2.176-1.572-2.73-2.532-.303-.522.062-.806.326-1.126.11-.133.224-.265.31-.383.097-.13.14-.223.21-.375.07-.154.035-.29-.018-.396-.053-.105-.483-1.14-.662-1.57-.175-.42-.37-.362-.507-.37-.13-.006-.28-.007-.43-.007-.15 0-.395.056-.6.282-.206.225-.785.753-.785 1.838 0 1.083.8 2.13.91 2.285.11.156 1.572 2.298 3.8 3.256 1.802.776 2.5.852 3.393.72.455-.067 1.393-.568 1.59-1.117.197-.55.197-1.02.137-1.12-.06-.1-.22-.154-.53-.31z" />
          </svg>
          
          {/* Red Notification badge "1" */}
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-extrabold text-white animate-bounce shadow-sm">
            1
          </span>
        </div>

        {/* Text Pill */}
        <div className="bg-white text-slate-800 text-[10px] font-extrabold px-3 py-1.5 rounded-full shadow-lg border border-slate-200/50 uppercase tracking-wide group-hover:bg-[#F5F7FA] transition-colors mt-2">
          Chat with us
        </div>
      </a>

      <Footer />
    </div>
  )
}
