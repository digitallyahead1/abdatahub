import HeroSlider from '@/components/HeroSlider'

export default function HomePage() {
  const stats = [
    { label: 'Registered Users', value: '150,000+', icon: '👥' },
    { label: 'Successful Txns', value: '2.5M+', icon: '✅' },
    { label: 'Data Sold', value: '850 TB+', icon: '📊' },
    { label: 'Satisfaction', value: '99.8%', icon: '⭐' },
  ]

  const services = [
    {
      title: 'Data Subscription',
      desc: 'Buy cheap mobile data bundles instantly for MTN, Airtel, Glo, and 9mobile.',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      gradient: 'from-blue-500/20 to-cyan-500/20',
    },
    {
      title: 'Airtime Top-Up',
      desc: 'Get instant airtime recharge across all major networks in Nigeria.',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      gradient: 'from-emerald-500/20 to-teal-500/20',
    },
    {
      title: 'Cable TV Bills',
      desc: 'Renew your DSTV, GOTV, and Startimes subscriptions in seconds.',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
      ),
      gradient: 'from-purple-500/20 to-pink-500/20',
    },
    {
      title: 'Electricity Tokens',
      desc: 'Generate electricity prepaid tokens instantly for IKEDC, EKEDC, AEDC, and more.',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      gradient: 'from-amber-500/20 to-orange-500/20',
    },
    {
      title: 'Exam Result Pins',
      desc: 'Purchase WAEC, NECO, JAMB, and NABTEB scratch cards and pins directly.',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      gradient: 'from-rose-500/20 to-red-500/20',
    },
  ]

  const features = [
    {
      title: 'Instant Delivery',
      desc: 'All VTU queries, electricity tokens and subscriptions are disbursed instantly.',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      title: 'Fintech-Grade Security',
      desc: 'Two-factor auth and absolute wallet isolation protocols keep transactions secure.',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      title: 'Automated Operations',
      desc: '100% automated system ensuring consistent up-times all day.',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      title: 'Affordable Rates',
      desc: 'Get highly discounted service structures for profit maximization.',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ]

  const testimonials = [
    {
      name: 'Adewale Bakare',
      role: 'VTU Reseller, Lagos',
      comment: 'AB Data Hub has completely changed my VTU business. Data delivery takes less than 5 seconds, and the pricing yields massive profit margins for my operations.',
      rating: 5,
    },
    {
      name: 'Chinedu Okafor',
      role: 'Fintech Agent, Enugu',
      comment: 'I use their API to run bill payments for electricity and cable. The automated support systems are highly responsive. Excellent experience overall.',
      rating: 5,
    },
    {
      name: 'Fatima Bello',
      role: 'Student, Abuja',
      comment: 'Recharging airtime and data is so easy! The portal works perfectly on my mobile web browser, and my transactions have never failed.',
      rating: 5,
    },
  ]

  return (
    <div className="space-y-24 sm:space-y-32 pb-24 overflow-x-hidden">
      {/* ===== HERO SECTION ===== */}
      <section className="relative pt-12 lg:pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Background ambient orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-blue/5 rounded-full blur-[150px] -z-10" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-primary-glow/5 rounded-full blur-[120px] -z-10" />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 xl:gap-16 items-center">
          <div className="space-y-8 text-center xl:text-left z-10 xl:col-span-5">
            {/* Pill badge */}
            <div className="inline-flex items-center space-x-2 bg-primary-blue/10 border border-primary-glow/20 px-4 py-1.5 rounded-full text-xs font-semibold text-primary-glow backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span>Premium Fintech VTU Hub</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              {"Nigeria's Fastest"} <br />
              <span className="bg-gradient-to-r from-primary-blue via-primary-glow to-cyan-300 bg-clip-text text-transparent">
                VTU Platform
              </span>
            </h1>

            <p className="text-base sm:text-lg text-silver-muted max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Buy Data, Airtime, Electricity Tokens, Cable TV Subscriptions and Exam Pins Instantly.
              <span className="text-white font-medium"> The Pride of Data.</span>
            </p>

            {/* WhatsApp Contact Capsule */}
            <div className="flex justify-center lg:justify-start pt-1">
              <a
                href="https://wa.me/2348133887526"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-3 bg-emerald-950/30 border border-emerald-500/20 hover:border-emerald-500/50 px-5 py-2.5 rounded-full hover:bg-emerald-500/10 transition-all duration-300 group backdrop-blur-sm shadow-md"
              >
                <div className="w-8 h-8 bg-[#25D366] rounded-full flex items-center justify-center shadow-md shadow-emerald-500/25 group-hover:scale-110 transition-transform">
                  <svg className="w-4.5 h-4.5 text-white fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.734-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.116-2.905-6.994C16.557 1.866 14.077.835 11.44.835c-5.448 0-9.88 4.417-9.884 9.864-.002 2.01.52 3.975 1.517 5.688l-1.015 3.701 3.792-.995c1.602.875 3.327 1.336 4.797 1.336zM17.65 14.9c-.314-.155-1.85-.909-2.13-.102c-.28.093-.483.31-.594.436-.11.127-.225.26-.342.383-.342.36-.68.18-.994.025-1.258-.62-2.176-1.572-2.73-2.532-.303-.522.062-.806.326-1.126.11-.133.224-.265.31-.383.097-.13.14-.223.21-.375.07-.154.035-.29-.018-.396-.053-.105-.483-1.14-.662-1.57-.175-.42-.37-.362-.507-.37-.13-.006-.28-.007-.43-.007-.15 0-.395.056-.6.282-.206.225-.785.753-.785 1.838 0 1.083.8 2.13.91 2.285.11.156 1.572 2.298 3.8 3.256 1.802.776 2.5.852 3.393.72.455-.067 1.393-.568 1.59-1.117.197-.55.197-1.02.137-1.12-.06-.1-.22-.154-.53-.31z" />
                  </svg>
                </div>
                <div className="text-left leading-none">
                  <span className="text-[9px] uppercase font-black text-emerald-400 tracking-wider block">WhatsApp Support</span>
                  <span className="text-xs font-bold text-white block mt-0.5">08133887526</span>
                </div>
              </a>
            </div>


            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
              <a
                href="/register"
                className="group px-8 py-4 bg-gradient-blue text-white font-bold rounded-xl shadow-glow-blue-md hover:shadow-glow-blue-lg transition-all duration-300 text-center relative overflow-hidden"
              >
                <span className="relative z-10">Get Started Free</span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-glow to-primary-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </a>
              <a
                href="/login"
                className="px-8 py-4 border border-silver-muted/20 hover:border-primary-glow/40 hover:bg-white/5 text-white font-bold rounded-xl transition-all duration-300 text-center backdrop-blur-sm"
              >
                Sign In →
              </a>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center justify-center xl:justify-start gap-6 pt-2">
              <div className="flex items-center space-x-1.5 text-xs text-silver-muted">
                <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>CAC Registered</span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-silver-muted">
                <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>99.9% Uptime</span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-silver-muted">
                <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Instant Delivery</span>
              </div>
            </div>
          </div>

          {/* Right side Showcase cards */}
          <div className="xl:col-span-7 flex flex-col sm:flex-row gap-6 justify-center items-center w-full z-10">
            <HeroSlider />
            
            {/* Airtime to Cash Swap Card */}
            <div className="relative w-72 h-80 sm:w-80 sm:h-[360px] border border-orange-500/20 rounded-3xl p-6 glass flex flex-col justify-between overflow-hidden group transition-all duration-300 hover:border-orange-500/40">
              {/* Custom glowing background color tint */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-600/10 opacity-30 -z-10" />
              
              {/* Content */}
              <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4">
                {/* Swap Icon */}
                <div className="flex justify-center items-center animate-float">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg sm:text-xl font-extrabold text-white">
                    Airtime to Cash
                  </h3>
                  <p className="text-xs font-semibold uppercase tracking-wider text-orange-400">
                    Instant Wallet Swap
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-silver-muted leading-relaxed max-w-[260px] sm:max-w-[300px]">
                  Convert your excess airtime pins or card balances into real cash sent directly to your bank account instantly.
                </p>
              </div>

              {/* WhatsApp Action button */}
              <div className="z-10 pt-2">
                <a
                  href="https://wa.me/2348133887526?text=Hello%20AB%20Data%20Hub%20Admin,%20I%20want%20to%20swap%20airtime%20to%20cash."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl shadow-lg shadow-orange-500/10 transition-all text-xs sm:text-sm flex items-center justify-center space-x-2"
                >
                  <span>Swap Airtime Now</span>
                  <span>→</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURE BANNERS (GLOWING CARDS) ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 bg-black/40 border border-primary-glow/20 p-8 rounded-3xl relative overflow-hidden backdrop-blur-md shadow-glow-blue-sm">
          {/* Subtle light effect inside the container */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-blue/5 via-transparent to-primary-glow/5 pointer-events-none" />
          
          {/* Card 1: Cheapest Prices */}
          <div className="flex flex-col items-center text-center space-y-4 py-4 relative group lg:border-r lg:border-primary-glow/20">
            <div className="w-16 h-16 rounded-full border-2 border-primary-glow flex items-center justify-center relative overflow-hidden transition-all duration-300 group-hover:scale-105 shadow-[0_0_15px_rgba(0,180,255,0.4)]">
              <div className="absolute inset-0 bg-primary-glow/10 animate-pulse" />
              <svg className="w-8 h-8 text-primary-glow relative z-10" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <div className="text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase">Cheapest</div>
              <div className="text-primary-glow font-black text-xs sm:text-sm tracking-wider uppercase mt-0.5">Prices</div>
            </div>
          </div>

          {/* Card 2: Instant Delivery */}
          <div className="flex flex-col items-center text-center space-y-4 py-4 relative group lg:border-r lg:border-primary-glow/20">
            <div className="w-16 h-16 rounded-full border-2 border-primary-glow flex items-center justify-center relative overflow-hidden transition-all duration-300 group-hover:scale-105 shadow-[0_0_15px_rgba(0,180,255,0.4)]">
              <div className="absolute inset-0 bg-primary-glow/10 animate-pulse" />
              <svg className="w-8 h-8 text-primary-glow relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4.5 16.5c-1.5 1.25-2.5 3.5-2.5 3.5s2.25-1 3.5-2.5M19.5 7.5c1.5-1.25 2.5-3.5 2.5-3.5s-2.25 1-3.5 2.5" />
                <path d="M14 4.5L19.5 10c1-1 2.5-4.5 2.5-4.5s-3.5 1.5-4.5 2.5z" />
                <path d="M14 4.5C9.5 9 8 14.5 8 14.5s5.5-1.5 10-6L14 4.5z" />
                <path d="M9 15c-1.5 1.5-3.5 2-4.5 1s-.5-3 1-4.5" />
              </svg>
            </div>
            <div>
              <div className="text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase">Instant</div>
              <div className="text-primary-glow font-black text-xs sm:text-sm tracking-wider uppercase mt-0.5">Delivery</div>
            </div>
          </div>

          {/* Card 3: Secure Payments */}
          <div className="flex flex-col items-center text-center space-y-4 py-4 relative group lg:border-r lg:border-primary-glow/20">
            <div className="w-16 h-16 rounded-full border-2 border-primary-glow flex items-center justify-center relative overflow-hidden transition-all duration-300 group-hover:scale-105 shadow-[0_0_15px_rgba(0,180,255,0.4)]">
              <div className="absolute inset-0 bg-primary-glow/10 animate-pulse" />
              <svg className="w-8 h-8 text-primary-glow relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <div className="text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase">Secure</div>
              <div className="text-primary-glow font-black text-xs sm:text-sm tracking-wider uppercase mt-0.5">Payments</div>
            </div>
          </div>

          {/* Card 4: 24/7 Support */}
          <a href="tel:07045357195" className="flex flex-col items-center text-center space-y-4 py-4 relative group cursor-pointer">
            <div className="w-16 h-16 rounded-full border-2 border-primary-glow flex items-center justify-center relative overflow-hidden transition-all duration-300 group-hover:scale-105 shadow-[0_0_15px_rgba(0,180,255,0.4)]">
              <div className="absolute inset-0 bg-primary-glow/10 animate-pulse" />
              <svg className="w-8 h-8 text-primary-glow relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <div className="text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase">24/7</div>
              <div className="text-primary-glow font-black text-xs sm:text-sm tracking-wider uppercase mt-0.5">Support</div>
            </div>
          </a>
        </div>
      </section>

      {/* ===== STATISTICS ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 bg-gradient-to-r from-primary-dark-blue to-primary-glow p-8 sm:p-12 rounded-3xl shadow-glow-blue-md relative overflow-hidden">
          {/* Subtle light effect inside the card */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          
          {stats.map((stat, i) => (
            <div key={i} className="text-center space-y-3 relative z-10">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-2xl sm:text-4xl font-black text-white">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-white/80 font-bold uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== SERVICES ===== */}
      <section id="services" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-primary-glow bg-primary-blue/10 border border-primary-glow/20">
            Our Services
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">VTU & Bill Payment Suite</h2>
          <p className="text-silver-muted max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Explore our automated suite of instantaneous financial top-up interfaces.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((svc, i) => (
            <div
              key={i}
              className="group relative p-7 bg-gradient-to-br from-dark-bg-secondary/80 to-dark-bg border border-silver-muted/10 rounded-2xl transition-all duration-300 hover:border-primary-glow/30 hover:shadow-glow-blue hover:-translate-y-1"
            >
              {/* Hover gradient overlay */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${svc.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-5 text-primary-glow group-hover:bg-primary-blue/20 group-hover:text-white transition-all duration-300">
                  {svc.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{svc.title}</h3>
                <p className="text-sm text-silver-muted leading-relaxed mb-5">{svc.desc}</p>
                <a
                  href="/login"
                  className="inline-flex items-center space-x-2 text-sm text-primary-glow hover:text-white font-semibold group-hover:translate-x-1 transition-all duration-300"
                >
                  <span>Purchase Now</span>
                  <span>→</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== WHY CHOOSE US ===== */}
      <section id="features" className="bg-silver-light py-20 border-y border-silver-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-primary-dark-blue bg-primary-blue/10 border border-primary-blue/20">
              Why Choose Us
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-dark-bg leading-tight">
              Designed For Instant, <br />
              <span className="bg-gradient-to-r from-primary-dark-blue to-primary-blue bg-clip-text text-transparent">
                Secure Fintech Operations
              </span>
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              We leverage API infrastructure to execute all subscriptions, tokens, and recharges autonomously. No delays, no pending balances.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              {features.map((feat, i) => (
                <div key={i} className="flex space-x-3 group">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary-blue/15 rounded-xl flex items-center justify-center text-primary-dark-blue group-hover:bg-primary-blue group-hover:text-white transition-all duration-300 shadow-sm">
                    {feat.icon}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-dark-bg text-sm">{feat.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live status card (Dark theme contrast floating card) */}
          <div className="relative flex justify-center">
            <div className="absolute w-[250px] h-[250px] bg-primary-blue/10 rounded-full blur-[80px]" />
            <div className="w-full max-w-md p-6 bg-dark-bg-secondary border border-white/5 rounded-2xl shadow-2xl space-y-5 relative z-10">
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <span className="text-sm font-semibold text-white">VTU Server Status</span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5 animate-pulse" />
                  Active (99.9%)
                </span>
              </div>
              {[
                { name: 'MTN Data API', speed: '2.1s', status: 'online' },
                { name: 'Airtel Data API', speed: '1.8s', status: 'online' },
                { name: 'DisCo Token Dispatch', speed: '3.4s', status: 'online' },
                { name: 'Cable TV Validation', speed: '2.5s', status: 'online' },
              ].map((serv, i) => (
                <div key={i} className="flex justify-between items-center text-sm group hover:bg-white/5 -mx-2 px-2 py-1.5 rounded-lg transition-colors">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                    <span className="text-silver-muted group-hover:text-white transition-colors">{serv.name}</span>
                  </div>
                  <span className="text-primary-glow font-mono font-medium text-xs">{serv.speed}</span>
                </div>
              ))}

              <div className="pt-3 border-t border-white/5">
                <div className="flex justify-between text-xs text-silver-muted">
                  <span>Average Response</span>
                  <span className="text-primary-glow font-semibold">2.45s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section id="testimonials" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-primary-glow bg-primary-blue/10 border border-primary-glow/20">
            Testimonials
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">What Users Say</h2>
          <p className="text-silver-muted max-w-xl mx-auto text-sm sm:text-base">
            Read comments from our nationwide retail partners and billing clients.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((test, i) => (
            <div
              key={i}
              className="p-7 bg-dark-bg-secondary/50 border border-silver-muted/10 rounded-2xl flex flex-col justify-between hover:border-primary-glow/20 transition-all duration-300"
            >
              <div className="space-y-4">
                <div className="flex space-x-1">
                  {[...Array(test.rating)].map((_, index) => (
                    <svg key={index} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-silver-muted italic leading-relaxed">
                  &ldquo;{test.comment}&rdquo;
                </p>
              </div>
              <div className="pt-5 border-t border-white/5 mt-5 flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-gradient-blue flex items-center justify-center text-white text-sm font-bold">
                  {test.name.charAt(0)}
                </div>
                <div>
                  <span className="font-bold text-white text-sm block">{test.name}</span>
                  <span className="text-xs text-silver-muted">{test.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-gradient-blue p-10 sm:p-16 rounded-3xl overflow-hidden shadow-glow-blue-md text-center space-y-6">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight relative z-10">
            Ready to Experience Instant Top-Ups?
          </h2>
          <p className="text-white/80 max-w-xl mx-auto text-sm sm:text-base leading-relaxed relative z-10">
            Create an account with AB Data Hub today and enjoy highly discounted prices on data and airtime.
          </p>

          {/* Call Support Badge in CTA section */}
          <div className="flex justify-center relative z-10 pt-2 pb-2">
            <a
              href="tel:07045357195"
              className="inline-flex items-center space-x-3 bg-blue-950/40 border border-primary-glow/30 hover:border-primary-glow/60 px-5 py-2.5 rounded-full hover:bg-primary-glow/10 transition-all duration-300 group backdrop-blur-sm shadow-md"
            >
              <div className="w-8 h-8 bg-primary-glow rounded-full flex items-center justify-center shadow-md shadow-primary-blue/20 group-hover:scale-110 transition-transform">
                <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div className="text-left leading-none">
                <span className="text-[9px] uppercase font-black text-primary-glow tracking-wider block">Customer Helpline</span>
                <span className="text-xs font-bold text-white block mt-0.5">07045357195</span>
              </div>
            </a>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-4 relative z-10">
            <a
              href="/register"
              className="px-8 py-3.5 bg-white text-primary-blue font-bold rounded-xl shadow-lg hover:bg-white/95 hover:shadow-xl transition-all duration-300 text-sm"
            >
              Sign Up For Free
            </a>
            <a
              href="#services"
              className="px-8 py-3.5 border-2 border-white/30 text-white font-bold rounded-xl hover:bg-white/10 transition-all duration-300 text-sm"
            >
              Explore Services
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
