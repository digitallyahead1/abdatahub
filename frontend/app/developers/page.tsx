'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import api from '@/lib/api'

export default function DeveloperDocumentationPage() {
  const [activeSection, setActiveSection] = useState('intro')
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null)

  // Interactive Tester State
  const [testApiKey, setTestApiKey] = useState('')
  const [testEndpoint, setTestEndpoint] = useState('/networks')
  const [testMethod, setTestMethod] = useState<'GET' | 'POST'>('GET')
  const [testPayload, setTestPayload] = useState('{\n  "network": "mtn",\n  "plan_id": "1",\n  "phone": "08012345678"\n}')
  const [testLoading, setTestLoading] = useState(false)
  const [testResponse, setTestResponse] = useState<any>(null)

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedIndex(id)
    toast.success('Snippet copied to clipboard!')
    setTimeout(() => setCopiedIndex(null), 2500)
  }

  const runTestRequest = async () => {
    if (!testApiKey.trim()) {
      toast.error('Please enter your API Key to execute test requests.')
      return
    }

    try {
      setTestLoading(true)
      setTestResponse(null)

      const url = `/v1${testEndpoint}`
      let res: any

      if (testMethod === 'GET') {
        res = await api.get(url, {
          headers: {
            Authorization: `Bearer ${testApiKey.trim()}`,
          },
        })
      } else {
        let parsedBody = {}
        try {
          parsedBody = JSON.parse(testPayload)
        } catch {
          toast.error('Invalid JSON payload.')
          setTestLoading(false)
          return
        }

        res = await api.post(url, parsedBody, {
          headers: {
            Authorization: `Bearer ${testApiKey.trim()}`,
            'Idempotency-Key': 'test-' + Date.now(),
          },
        })
      }

      setTestResponse({
        status: res.status,
        statusText: res.statusText,
        data: res.data,
      })
    } catch (err: any) {
      setTestResponse({
        status: err.response?.status || 500,
        statusText: err.response?.statusText || 'Error',
        data: err.response?.data || { message: err.message },
      })
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg text-silver-light font-sans selection:bg-primary-blue selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-silver-muted/10 bg-dark-bg/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-primary-glow/30">
                <Image src="/logo.png" alt="AB Data Hub" fill className="object-cover" />
              </div>
              <span className="font-bold text-white tracking-wider text-base bg-gradient-to-r from-primary-blue to-primary-glow bg-clip-text text-transparent">
                AB DATA HUB
              </span>
            </Link>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-primary-blue/10 text-primary-glow border border-primary-blue/20">
              API v1.0
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/api-keys"
              className="px-4 py-2 rounded-xl bg-gradient-blue text-white text-xs font-semibold hover:shadow-glow-blue transition-all"
            >
              Get API Key &rarr;
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-silver-light border border-silver-muted/15 text-xs font-medium transition-all"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        {/* Sidebar Nav */}
        <aside className="lg:w-64 shrink-0">
          <div className="sticky top-24 space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-silver-muted mb-3">Getting Started</h3>
              <nav className="space-y-1">
                {[
                  { id: 'intro', label: 'Introduction' },
                  { id: 'auth', label: 'Authentication' },
                  { id: 'base-url', label: 'Base URL & Versioning' },
                  { id: 'response-format', label: 'Standard Responses' },
                  { id: 'idempotency', label: 'Idempotency Keys' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      activeSection === item.id
                        ? 'bg-primary-blue/15 text-primary-glow border-l-2 border-primary-glow'
                        : 'text-silver-muted hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-silver-muted mb-3">Data Endpoints</h3>
              <nav className="space-y-1">
                {[
                  { id: 'ep-networks', label: 'GET /networks' },
                  { id: 'ep-plans', label: 'GET /data/plans' },
                  { id: 'ep-purchase', label: 'POST /data/purchase' },
                  { id: 'ep-transactions', label: 'GET /transactions' },
                  { id: 'ep-tx-status', label: 'GET /transactions/:ref' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all font-mono ${
                      activeSection === item.id
                        ? 'bg-primary-blue/15 text-primary-glow border-l-2 border-primary-glow'
                        : 'text-silver-muted hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-silver-muted mb-3">Developer Tools</h3>
              <nav className="space-y-1">
                {[
                  { id: 'tester', label: '⚡ Interactive API Console' },
                  { id: 'errors', label: 'Error Codes Reference' },
                  { id: 'ratelimits', label: 'Rate Limits' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      activeSection === item.id
                        ? 'bg-primary-blue/15 text-primary-glow border-l-2 border-primary-glow'
                        : 'text-silver-muted hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </aside>

        {/* Documentation Content Area */}
        <main className="flex-1 space-y-12 max-w-4xl">
          {/* SECTION: INTRODUCTION */}
          <section id="intro" className="space-y-4">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              AB Data Hub API Documentation
            </h1>
            <p className="text-silver-muted text-sm leading-relaxed">
              Welcome to the AB Data Hub developer documentation. Our modern REST API allows software applications, mobile apps, e-commerce stores, and fintech platforms to automate Nigerian mobile data subscriptions programmatically across all major telecommunications networks (MTN, Airtel, Glo, 9mobile).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-dark-bg-secondary border border-silver-muted/10">
                <div className="text-primary-glow font-bold text-base mb-1">⚡ Fast Execution</div>
                <div className="text-xs text-silver-muted">Direct telecommunication provider dispatch with sub-second acknowledgment.</div>
              </div>
              <div className="p-4 rounded-2xl bg-dark-bg-secondary border border-silver-muted/10">
                <div className="text-emerald-400 font-bold text-base mb-1">🔒 Idempotent</div>
                <div className="text-xs text-silver-muted">Built-in double charge protection with custom Idempotency-Key headers.</div>
              </div>
              <div className="p-4 rounded-2xl bg-dark-bg-secondary border border-silver-muted/10">
                <div className="text-purple-400 font-bold text-base mb-1">💰 Wallet Backed</div>
                <div className="text-xs text-silver-muted">Fund your account once and seamlessly consume data with automatic refunds on failure.</div>
              </div>
            </div>
          </section>

          {/* SECTION: AUTHENTICATION */}
          <section id="auth" className="space-y-4 pt-6 border-t border-silver-muted/10">
            <h2 className="text-2xl font-bold text-white">Authentication</h2>
            <p className="text-silver-muted text-sm leading-relaxed">
              All API requests must be authenticated using your secret API key passed via the standard HTTP <code className="text-primary-glow font-mono">Authorization</code> header with the <code className="text-primary-glow font-mono">Bearer</code> scheme.
            </p>

            <div className="bg-dark-bg-secondary border border-silver-muted/10 rounded-2xl p-4 relative font-mono text-xs">
              <div className="text-silver-muted mb-1">// Standard Authentication Header</div>
              <div className="text-primary-glow font-bold">Authorization: Bearer abdhk_your_secret_api_key_here</div>
              <button
                onClick={() => copyCode('Authorization: Bearer abdhk_your_secret_api_key_here', 'auth-header')}
                className="absolute top-4 right-4 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[11px] font-sans"
              >
                {copiedIndex === 'auth-header' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </section>

          {/* SECTION: BASE URL */}
          <section id="base-url" className="space-y-4 pt-6 border-t border-silver-muted/10">
            <h2 className="text-2xl font-bold text-white">Base URL & Versioning</h2>
            <p className="text-silver-muted text-sm leading-relaxed">
              All endpoints are versioned with the <code className="text-primary-glow font-mono">/v1/</code> prefix to guarantee backward compatibility for production integrations.
            </p>

            <div className="bg-dark-bg-secondary border border-silver-muted/10 rounded-2xl p-4 font-mono text-xs">
              <div className="text-silver-muted mb-1">// Production Base URL</div>
              <div className="text-emerald-400 font-bold">https://abdatahub.com/api/v1</div>
            </div>
          </section>

          {/* SECTION: RESPONSE FORMAT */}
          <section id="response-format" className="space-y-4 pt-6 border-t border-silver-muted/10">
            <h2 className="text-2xl font-bold text-white">Standard Response Format</h2>
            <p className="text-silver-muted text-sm leading-relaxed">
              Every API response returns standard JSON enveloped in a consistent structure:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-dark-bg-secondary border border-emerald-500/20 rounded-2xl p-4 font-mono text-xs">
                <div className="text-emerald-400 font-bold mb-2 font-sans text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  200 / 201 Success Response
                </div>
                <pre className="text-silver-light overflow-x-auto">
{`{
  "success": true,
  "message": "Request successful",
  "data": { ... }
}`}
                </pre>
              </div>

              <div className="bg-dark-bg-secondary border border-rose-500/20 rounded-2xl p-4 font-mono text-xs">
                <div className="text-rose-400 font-bold mb-2 font-sans text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  4xx / 5xx Error Response
                </div>
                <pre className="text-silver-light overflow-x-auto">
{`{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Insufficient wallet balance."
  }
}`}
                </pre>
              </div>
            </div>
          </section>

          {/* SECTION: IDEMPOTENCY */}
          <section id="idempotency" className="space-y-4 pt-6 border-t border-silver-muted/10">
            <h2 className="text-2xl font-bold text-white">Idempotency & Duplicate Protection</h2>
            <p className="text-silver-muted text-sm leading-relaxed">
              To prevent duplicate data purchases caused by network retries, connection drops, or accidental re-submits, send a unique <code className="text-primary-glow font-mono">Idempotency-Key</code> header on <code className="font-mono text-emerald-400">POST /data/purchase</code>.
            </p>
            <p className="text-silver-muted text-xs">
              If an identical key is sent within 24 hours, the server will safely return the original transaction without charging the wallet a second time.
            </p>
          </section>

          {/* SECTION: ENDPOINT 1 - NETWORKS */}
          <section id="ep-networks" className="space-y-4 pt-8 border-t border-silver-muted/10">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-primary-glow font-mono text-xs font-bold">GET</span>
              <h2 className="text-xl font-bold text-white font-mono">/networks</h2>
            </div>
            <p className="text-silver-muted text-sm">
              Retrieves the list of all currently active telecommunication networks.
            </p>

            <div className="bg-dark-bg-secondary border border-silver-muted/10 rounded-2xl p-4 font-mono text-xs overflow-x-auto">
              <div className="text-silver-muted mb-2 font-sans font-semibold">Response Example:</div>
              <pre className="text-emerald-400">
{`{
  "success": true,
  "data": [
    { "id": 1, "name": "MTN", "code": "mtn", "status": "active" },
    { "id": 2, "name": "Airtel", "code": "airtel", "status": "active" },
    { "id": 3, "name": "Glo", "code": "glo", "status": "active" },
    { "id": 4, "name": "9mobile", "code": "9mobile", "status": "active" }
  ],
  "message": "Networks retrieved successfully"
}`}
              </pre>
            </div>
          </section>

          {/* SECTION: ENDPOINT 2 - DATA PLANS */}
          <section id="ep-plans" className="space-y-4 pt-8 border-t border-silver-muted/10">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-primary-glow font-mono text-xs font-bold">GET</span>
              <h2 className="text-xl font-bold text-white font-mono">/data/plans</h2>
            </div>
            <p className="text-silver-muted text-sm">
              Returns all available data subscription plans. Supports query parameters <code className="text-primary-glow font-mono">?network=mtn</code> and <code className="text-primary-glow font-mono">?status=active</code>.
            </p>

            <div className="bg-dark-bg-secondary border border-silver-muted/10 rounded-2xl p-4 font-mono text-xs overflow-x-auto">
              <div className="text-silver-muted mb-2 font-sans font-semibold">Response Example:</div>
              <pre className="text-emerald-400">
{`{
  "success": true,
  "data": [
    {
      "id": "e839f99e-3151-419b-a0eb-cb0e07ef4f21",
      "provider_plan_id": 1,
      "network": "mtn",
      "name": "MTN SME - 1.0GB - 30 Days",
      "price": 285.00,
      "status": "active"
    }
  ]
}`}
              </pre>
            </div>
          </section>

          {/* SECTION: ENDPOINT 3 - PURCHASE */}
          <section id="ep-purchase" className="space-y-4 pt-8 border-t border-silver-muted/10">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">POST</span>
              <h2 className="text-xl font-bold text-white font-mono">/data/purchase</h2>
            </div>
            <p className="text-silver-muted text-sm">
              Executes an automated data subscription purchase. Debits your API wallet balance and delivers the bundle to the recipient phone number.
            </p>

            <div className="bg-dark-bg-secondary border border-silver-muted/10 rounded-2xl p-4 font-mono text-xs overflow-x-auto space-y-4">
              <div>
                <div className="text-silver-muted mb-2 font-sans font-semibold">Request Body (JSON):</div>
                <pre className="text-silver-light">
{`{
  "network": "mtn",
  "plan_id": "e839f99e-3151-419b-a0eb-cb0e07ef4f21",
  "phone": "08012345678"
}`}
                </pre>
              </div>

              <div className="pt-3 border-t border-silver-muted/10">
                <div className="text-silver-muted mb-2 font-sans font-semibold">Response (HTTP 201 Created):</div>
                <pre className="text-emerald-400">
{`{
  "success": true,
  "data": {
    "transaction_reference": "DATA-20260822-7X8F90",
    "network": "mtn",
    "plan": "MTN SME - 1.0GB - 30 Days",
    "phone": "08012345678",
    "amount": 285.00,
    "status": "success",
    "completed_at": "2026-08-22T17:42:00.000Z",
    "message": "Data subscription sent to 08012345678"
  },
  "message": "Data subscription sent to 08012345678"
}`}
                </pre>
              </div>
            </div>
          </section>

          {/* SECTION: ENDPOINT 4 - TRANSACTIONS */}
          <section id="ep-transactions" className="space-y-4 pt-8 border-t border-silver-muted/10">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-primary-glow font-mono text-xs font-bold">GET</span>
              <h2 className="text-xl font-bold text-white font-mono">/transactions</h2>
            </div>
            <p className="text-silver-muted text-sm">
              Retrieves paginated history of data subscription transactions created via your account/API keys.
            </p>
          </section>

          {/* SECTION: INTERACTIVE TESTER */}
          <section id="tester" className="space-y-4 pt-8 border-t border-silver-muted/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span>⚡</span> Interactive API Console
                </h2>
                <p className="text-silver-muted text-xs md:text-sm mt-1">
                  Test your real API requests directly from this browser console.
                </p>
              </div>
            </div>

            <div className="bg-dark-bg-secondary border border-silver-muted/15 rounded-3xl p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider mb-2">
                  Your API Key
                </label>
                <input
                  type="password"
                  placeholder="abdhk_your_api_key"
                  value={testApiKey}
                  onChange={(e) => setTestApiKey(e.target.value)}
                  className="w-full bg-dark-bg border border-silver-muted/20 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-primary-glow"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider mb-2">
                    HTTP Method
                  </label>
                  <select
                    value={testMethod}
                    onChange={(e) => setTestMethod(e.target.value as 'GET' | 'POST')}
                    className="w-full bg-dark-bg border border-silver-muted/20 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-primary-glow"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider mb-2">
                    Endpoint
                  </label>
                  <select
                    value={testEndpoint}
                    onChange={(e) => setTestEndpoint(e.target.value)}
                    className="w-full bg-dark-bg border border-silver-muted/20 rounded-xl px-3 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-primary-glow"
                  >
                    <option value="/networks">/networks</option>
                    <option value="/data/plans">/data/plans</option>
                    <option value="/data/purchase">/data/purchase</option>
                    <option value="/transactions">/transactions</option>
                  </select>
                </div>
              </div>

              {testMethod === 'POST' && (
                <div>
                  <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider mb-2">
                    Request Body (JSON)
                  </label>
                  <textarea
                    rows={4}
                    value={testPayload}
                    onChange={(e) => setTestPayload(e.target.value)}
                    className="w-full bg-dark-bg border border-silver-muted/20 rounded-xl p-3 text-white font-mono text-xs focus:outline-none focus:border-primary-glow"
                  />
                </div>
              )}

              <button
                onClick={runTestRequest}
                disabled={testLoading}
                className="w-full py-3 rounded-xl bg-gradient-blue hover:shadow-glow-blue text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                {testLoading ? 'Executing Request...' : 'Send API Request'}
              </button>

              {testResponse && (
                <div className="mt-4 pt-4 border-t border-silver-muted/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-silver-muted">Response:</span>
                    <span className={`px-2 py-0.5 rounded font-bold font-mono ${
                      testResponse.status < 300 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      HTTP {testResponse.status} {testResponse.statusText}
                    </span>
                  </div>
                  <pre className="p-4 rounded-2xl bg-dark-bg border border-silver-muted/10 font-mono text-xs text-silver-light overflow-x-auto max-h-72">
                    {JSON.stringify(testResponse.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </section>

          {/* SECTION: ERROR CODES */}
          <section id="errors" className="space-y-4 pt-8 border-t border-silver-muted/10">
            <h2 className="text-2xl font-bold text-white">Error Code Reference</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-silver-muted/10 text-silver-muted uppercase font-semibold">
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">HTTP Status</th>
                    <th className="py-3 px-4">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-silver-muted/10 font-mono">
                  <tr>
                    <td className="py-3 px-4 text-primary-glow font-bold">MISSING_API_KEY</td>
                    <td className="py-3 px-4 text-silver-muted">401 Unauthorized</td>
                    <td className="py-3 px-4 text-silver-light font-sans">Authorization header was not provided.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-primary-glow font-bold">INVALID_API_KEY</td>
                    <td className="py-3 px-4 text-silver-muted">401 Unauthorized</td>
                    <td className="py-3 px-4 text-silver-light font-sans">API key is invalid, revoked, or formatted incorrectly.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-primary-glow font-bold">INSUFFICIENT_SCOPE</td>
                    <td className="py-3 px-4 text-silver-muted">403 Forbidden</td>
                    <td className="py-3 px-4 text-silver-light font-sans">Attempted a purchase using a Read-Only API key.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-primary-glow font-bold">INSUFFICIENT_BALANCE</td>
                    <td className="py-3 px-4 text-silver-muted">400 Bad Request</td>
                    <td className="py-3 px-4 text-silver-light font-sans">Account wallet balance is lower than plan price.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-primary-glow font-bold">RATE_LIMIT_EXCEEDED</td>
                    <td className="py-3 px-4 text-silver-muted">429 Too Many Requests</td>
                    <td className="py-3 px-4 text-silver-light font-sans">Exceeded maximum allowed requests per minute.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
