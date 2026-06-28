'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

const slides = [
  {
    type: 'brand',
    name: 'AB Data Hub',
    tagline: 'THE PRIDE OF DATA',
    desc: "Nigeria's premium fintech-grade VTU and bill payment hub. Fast, secure, and always active.",
    gradient: 'from-primary-blue/10 to-primary-glow/10',
    borderColor: 'border-primary-glow/20',
    logo: '/logo.png',
  },
  {
    type: 'provider',
    name: 'MTN Nigeria',
    tagline: 'SME & CG Cheap Data',
    desc: 'Get lightning-fast MTN data starting from just ₦250/GB. Automated API delivery with 30 days validity.',
    gradient: 'from-amber-400/10 to-yellow-500/10',
    borderColor: 'border-yellow-400/30',
    logoBg: 'bg-yellow-400',
    logoText: 'MTN',
    textColor: 'text-yellow-400',
  },
  {
    type: 'provider',
    name: 'Airtel Nigeria',
    tagline: 'Smartspeed Internet Bundle',
    desc: 'Enjoy uninterrupted Airtel CG packages starting from ₦240/GB. Instant delivery, keeps you online.',
    gradient: 'from-red-500/10 to-rose-600/10',
    borderColor: 'border-red-500/30',
    logoBg: 'bg-red-600',
    logoText: 'airtel',
    textColor: 'text-red-500',
  },
  {
    type: 'provider',
    name: 'Glo Mobile',
    tagline: 'Grandmasters of Data',
    desc: 'Cheapest high-volume Glo data packages. Experience instant automatic recharge with zero pending transactions.',
    gradient: 'from-emerald-500/10 to-green-600/10',
    borderColor: 'border-green-500/30',
    logoBg: 'bg-green-600',
    logoText: 'glo',
    textColor: 'text-green-500',
  },
  {
    type: 'provider',
    name: '9mobile',
    tagline: 'Super-Stable Connection',
    desc: 'Experience reliable daily, weekly, and monthly 9mobile data bundles at highly competitive prices.',
    gradient: 'from-teal-600/10 to-emerald-700/10',
    borderColor: 'border-emerald-600/30',
    logoBg: 'bg-emerald-800 border border-lime-400/20',
    logoText: '9mobile',
    textColor: 'text-emerald-400',
  },
]

export default function HeroSlider() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length)
  }

  return (
    <div className="relative flex flex-col justify-center items-center z-10 w-full">
      {/* Background neon ambient orb matching active slide */}
      <div className="absolute w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] bg-primary-glow/10 rounded-full blur-[100px] -z-10 transition-all duration-1000" />

      {/* Main Slider Window */}
      <div className={`relative w-72 h-80 sm:w-96 sm:h-[360px] border rounded-3xl p-6 glass shadow-glow-blue flex flex-col justify-between overflow-hidden transition-all duration-500 ${slides[current].borderColor}`}>
        
        {/* Sliding background color tint */}
        <div className={`absolute inset-0 bg-gradient-to-br ${slides[current].gradient} opacity-40 transition-all duration-700 -z-10`} />

        {/* Carousel Content */}
        <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4 animate-fade-in">
          {slides[current].type === 'brand' ? (
            /* Brand Slide Logo */
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex justify-center items-center animate-float">
              <Image
                src={slides[current].logo!}
                alt="AB Data Hub Logo"
                fill
                className="object-contain drop-shadow-[0_0_15px_rgba(0,168,255,0.3)]"
                priority
              />
            </div>
          ) : (
            /* Provider Slide Logo */
            <div className="flex justify-center items-center animate-float">
              <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl ${slides[current].logoBg} flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300`}>
                <span className={`text-2xl sm:text-3xl font-black tracking-tighter uppercase ${slides[current].logoText === 'MTN' ? 'text-black' : 'text-white'}`}>
                  {slides[current].logoText}
                </span>
              </div>
            </div>
          )}

          {/* Slider text information */}
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-extrabold text-white">
              {slides[current].name}
            </h3>
            <p className={`text-xs font-semibold uppercase tracking-wider ${slides[current].textColor || 'text-primary-glow'}`}>
              {slides[current].tagline}
            </p>
          </div>

          <p className="text-xs sm:text-sm text-silver-muted leading-relaxed max-w-[260px] sm:max-w-[300px]">
            {slides[current].desc}
          </p>
        </div>

        {/* Navigation Dot Indicators */}
        <div className="flex justify-center items-center space-x-2.5 pt-2 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                current === i 
                  ? `w-6 ${slides[i].logoBg || 'bg-primary-glow'}` 
                  : 'w-1.5 bg-silver-muted/20 hover:bg-silver-muted/50'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Left & Right Arrow buttons */}
        <button 
          onClick={prevSlide}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-silver-muted hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 sm:opacity-100"
          aria-label="Previous slide"
        >
          ←
        </button>
        <button 
          onClick={nextSlide}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-silver-muted hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 sm:opacity-100"
          aria-label="Next slide"
        >
          →
        </button>

      </div>
    </div>
  )
}
