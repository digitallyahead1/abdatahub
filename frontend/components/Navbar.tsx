'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-bg/80 backdrop-blur-md border-b border-silver-muted/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div className="flex-shrink-0 flex items-center space-x-3">
            <a href="/" className="flex items-center space-x-3">
              <div className="relative w-12 h-12 overflow-hidden rounded-lg border border-primary-glow/20 glow-blue">
                <Image
                  src="/logo.png"
                  alt="AB Data Hub Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-primary-blue to-primary-glow bg-clip-text text-transparent">
                AB DATA HUB
              </span>
            </a>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="/" className="text-silver-muted hover:text-white font-medium transition-all">
              Home
            </a>
            <a href="#services" className="text-silver-muted hover:text-white font-medium transition-all">
              Services
            </a>
            <a href="#features" className="text-silver-muted hover:text-white font-medium transition-all">
              Why Choose Us
            </a>
            <a href="#testimonials" className="text-silver-muted hover:text-white font-medium transition-all">
              Reviews
            </a>
          </div>

          {/* CTAs */}
          <div className="hidden md:flex items-center space-x-4">
            <a
              href="tel:07045357195"
              className="flex items-center space-x-2 text-silver-muted hover:text-white font-semibold px-4 py-2 hover:bg-white/5 rounded-lg transition-all"
            >
              <svg className="w-4 h-4 text-primary-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="text-xs">07045357195</span>
            </a>
            <a
              href="/login"
              className="text-silver-light hover:text-white font-medium px-4 py-2 hover:bg-white/5 rounded-lg transition-all"
            >
              Sign In
            </a>
            <a
              href="/register"
              className="px-5 py-2.5 bg-gradient-blue hover:opacity-90 text-white font-semibold rounded-lg shadow-glow-blue transition-all"
            >
              Get Started
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="text-silver-muted hover:text-white focus:outline-none"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-dark-bg-secondary/95 border-b border-silver-muted/10 backdrop-blur-lg px-4 pt-2 pb-4 space-y-2">
          <a
            href="/"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-silver-muted hover:text-white hover:bg-white/5 transition-all"
          >
            Home
          </a>
          <a
            href="#services"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-silver-muted hover:text-white hover:bg-white/5 transition-all"
          >
            Services
          </a>
          <a
            href="#features"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-silver-muted hover:text-white hover:bg-white/5 transition-all"
          >
            Why Choose Us
          </a>
          <a
            href="#testimonials"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-silver-muted hover:text-white hover:bg-white/5 transition-all"
          >
            Reviews
          </a>
          <div className="pt-4 border-t border-silver-muted/10 flex flex-col space-y-2">
            <a
              href="tel:07045357195"
              className="w-full text-center px-4 py-2 border border-silver-muted/20 hover:border-primary-glow/40 hover:bg-primary-glow/5 rounded-md text-base font-semibold text-primary-glow flex items-center justify-center space-x-2 transition-all"
            >
              <svg className="w-4.5 h-4.5 text-primary-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>Call Helpline: 07045357195</span>
            </a>
            <a
              href="/login"
              onClick={() => setIsOpen(false)}
              className="w-full text-center px-4 py-2 border border-silver-muted/20 rounded-md text-base font-medium text-silver-light hover:bg-white/5 transition-all"
            >
              Sign In
            </a>
            <a
              href="/register"
              onClick={() => setIsOpen(false)}
              className="w-full text-center px-4 py-2 bg-gradient-blue text-white rounded-md text-base font-medium shadow-glow-blue transition-all"
            >
              Get Started
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
