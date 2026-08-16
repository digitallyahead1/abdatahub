import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | AB Data Hub',
  description: 'Privacy Policy and Data Protection guidelines for AB Data Hub VTU platform and mobile application.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header Banner */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="px-3.5 py-1.5 bg-primary-blue/10 border border-primary-glow/20 rounded-full text-xs font-semibold text-primary-glow uppercase tracking-wider">
          Legal & Transparency
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-sm sm:text-base text-silver-muted leading-relaxed">
          At <strong className="text-white">AB Data Hub</strong>, we respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, store, and safeguard your information when you use our mobile application and web platform.
        </p>
        <p className="text-xs text-silver-muted/70 font-mono">
          Last Updated: July 29, 2026
        </p>
      </div>

      {/* Main Content Sections */}
      <div className="bg-dark-bg-secondary/40 border border-silver-muted/10 rounded-2xl glass-dark p-6 sm:p-10 space-y-10 text-sm text-silver-muted leading-relaxed">
        
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-primary-blue/20 text-primary-glow flex items-center justify-center text-xs">1</span>
            Information We Collect
          </h2>
          <p>
            When you register, fund your wallet, or perform VTU transactions on AB Data Hub, we collect specific information to provide seamless services:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-silver-light">
            <li><strong className="text-white">Account Details:</strong> Full Name, Email Address, Phone Number, and Referral Code.</li>
            <li><strong className="text-white">Financial & Transaction Information:</strong> Wallet funding history, transaction reference IDs, top-up phone numbers, meter numbers, decoder IC numbers, and payment status logs.</li>
            <li><strong className="text-white">Security Credentials:</strong> Encrypted passwords and 4-digit transaction PINs (used exclusively to authorize wallet debits).</li>
            <li><strong className="text-white">Device & Technical Log Data:</strong> Device model, operating system version, IP address, and application usage analytics for security monitoring.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3 pt-6 border-t border-white/5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-primary-blue/20 text-primary-glow flex items-center justify-center text-xs">2</span>
            How We Use Your Information
          </h2>
          <p>
            We use the information we collect strictly for legitimate business and operational purposes, including:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-silver-light">
            <li>Processing mobile data subscriptions, airtime top-ups, cable TV subscriptions, electricity tokens, and exam PIN purchases.</li>
            <li>Managing user accounts, agent reseller statuses, and wallet balance adjustments.</li>
            <li>Sending automated transaction receipts, OTP verification codes, and system notifications.</li>
            <li>Detecting, preventing, and mitigating fraudulent activities or unauthorized account access.</li>
            <li>Providing prompt customer service via WhatsApp, email, or telephone.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 pt-6 border-t border-white/5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-primary-blue/20 text-primary-glow flex items-center justify-center text-xs">3</span>
            Data Sharing & Third-Party Service Providers
          </h2>
          <p>
            AB Data Hub does <strong className="text-white">NOT</strong> sell, rent, or trade your personal data to third parties for marketing purposes. We only share necessary data with trusted third-party partners to execute services requested by you:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-silver-light">
            <li><strong className="text-white">Payment Processors:</strong> Paystack and Flutterwave for secure online card payments and bank transfers.</li>
            <li><strong className="text-white">Telecommunications & Utility Providers:</strong> SMEPlug, AMZAET, MTN, Airtel, Glo, 9mobile, and electricity DISCOs to fulfill data, airtime, and utility orders.</li>
            <li><strong className="text-white">Legal Compliance:</strong> When required by Nigerian laws, court orders, or law enforcement investigations.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 pt-6 border-t border-white/5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-primary-blue/20 text-primary-glow flex items-center justify-center text-xs">4</span>
            Data Protection & Security Measures
          </h2>
          <p>
            We deploy robust administrative, technical, and physical security safeguards to protect your personal data against unauthorized access, alteration, disclosure, or destruction:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-silver-light">
            <li>256-bit SSL/TLS encryption for all data transmitted between your device and our servers.</li>
            <li>Cryptographic hashing for account passwords and transaction PINs.</li>
            <li>Strict role-based access control (RBAC) and mandatory OTP verification for administrative changes.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3 pt-6 border-t border-white/5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-primary-blue/20 text-primary-glow flex items-center justify-center text-xs">5</span>
            Your Privacy Rights & Account Control
          </h2>
          <p>
            You have full control over your personal data on AB Data Hub:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-silver-light">
            <li><strong className="text-white">Access & Update:</strong> You can view and update your profile information in your Dashboard settings at any time.</li>
            <li><strong className="text-white">Account Deletion:</strong> You can request permanent account deletion and removal of your personal data by contacting our support team.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="space-y-3 pt-6 border-t border-white/5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-primary-blue/20 text-primary-glow flex items-center justify-center text-xs">6</span>
            Contact & Customer Support
          </h2>
          <p>
            If you have any questions, concerns, or requests regarding this Privacy Policy or how your data is handled, please reach out to us through our official support channels:
          </p>
          <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-2 text-silver-light">
            <p><strong className="text-white">Company Name:</strong> AB Data Hub (BitBridge Technologies)</p>
            <p><strong className="text-white">Customer Support Phone / WhatsApp:</strong> <a href="tel:08133887526" className="text-primary-glow hover:underline">08133887526</a> / <a href="https://wa.me/2347045357195" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Chat on WhatsApp (07045357195)</a></p>
            <p><strong className="text-white">Technical Support:</strong> BitBridge Technologies (07067382927)</p>
          </div>
        </section>
      </div>

      {/* Bottom Back Button */}
      <div className="flex justify-center pt-4">
        <Link
          href="/"
          className="px-6 py-3 bg-gradient-blue hover:opacity-95 text-white font-bold rounded-xl shadow-glow-blue transition-all text-sm flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Return to Homepage</span>
        </Link>
      </div>
    </div>
  )
}
