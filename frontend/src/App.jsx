import { useState } from 'react'
import { checkCommissionStatus } from './lib/api'

function App() {
  const [trackingId, setTrackingId] = useState('')
  const [statusData, setStatusData] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleStatusLookup(event) {
    event.preventDefault()
    setError('')
    setStatusData(null)

    if (!trackingId.trim()) {
      setError('Enter a tracking ID first.')
      return
    }

    setIsLoading(true)

    try {
      const data = await checkCommissionStatus(trackingId.trim())
      setStatusData(data)
    } catch (lookupError) {
      setError(lookupError.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-800 selection:bg-stone-300">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 md:px-10">
        <header className="rounded-2xl border border-stone-800 bg-stone-200/90 p-6 shadow-[8px_8px_0_0_#292524] md:p-8">
          <p className="font-mono text-xs tracking-[0.3em] text-stone-600">ISSEISMX COMMISSIONS</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">Digital Art Commission Platform</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600 md:text-base">
            Built for a clean, process-driven flow: request intake, admin review, payment window, progress tracking,
            and final delivery.
          </p>
          <p className="mt-4 font-mono text-xs text-stone-500">Frontend hosted on Vercel, API on Railway/Render.</p>
        </header>

        <main className="mt-8 grid gap-6 md:grid-cols-5">
          <section className="rounded-2xl border border-stone-300 bg-white p-6 md:col-span-3">
            <h2 className="text-xl font-semibold">Commission Flow Snapshot</h2>
            <ol className="mt-4 grid gap-3 text-sm text-stone-700">
              <li className="rounded-lg border border-stone-200 bg-stone-50 p-3">1. User browses gallery and submits a commission request.</li>
              <li className="rounded-lg border border-stone-200 bg-stone-50 p-3">2. API returns a tracking ID and stores upload metadata in Supabase.</li>
              <li className="rounded-lg border border-stone-200 bg-stone-50 p-3">3. Admin approves or rejects request and sends updates via Resend.</li>
              <li className="rounded-lg border border-stone-200 bg-stone-50 p-3">4. Approved requests enter payment and production lifecycle.</li>
              <li className="rounded-lg border border-stone-200 bg-stone-50 p-3">5. User checks status with tracking ID until delivery completes.</li>
            </ol>
          </section>

          <section className="rounded-2xl border border-stone-800 bg-stone-900 p-6 text-stone-100 md:col-span-2">
            <h2 className="text-xl font-semibold">Track Commission</h2>
            <p className="mt-2 text-sm text-stone-300">Check progress using the tracking ID from your confirmation email.</p>

            <form onSubmit={handleStatusLookup} className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs uppercase tracking-wide text-stone-400">Tracking ID</span>
                <input
                  value={trackingId}
                  onChange={(event) => setTrackingId(event.target.value)}
                  placeholder="e.g. COM-8J29KD2"
                  className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm outline-none ring-0 placeholder:text-stone-500 focus:border-stone-400"
                />
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg border border-stone-300 bg-stone-100 px-4 py-2 text-sm font-medium text-stone-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? 'Checking...' : 'Check Status'}
              </button>
            </form>

            {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}

            {statusData ? (
              <div className="mt-4 rounded-lg border border-stone-700 bg-stone-950 p-3 text-sm">
                <p>
                  <span className="text-stone-400">Tracking:</span> {statusData.trackingId}
                </p>
                <p>
                  <span className="text-stone-400">Status:</span> {statusData.status}
                </p>
                {statusData.updatedAt ? (
                  <p>
                    <span className="text-stone-400">Updated:</span> {new Date(statusData.updatedAt).toLocaleString()}
                  </p>
                ) : null}
                {statusData.rejectionReason ? (
                  <p>
                    <span className="text-stone-400">Reason:</span> {statusData.rejectionReason}
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>
        </main>

        <footer className="mt-auto pt-10 text-xs text-stone-500">
          API base URL: <span className="font-mono">{import.meta.env.VITE_API_URL || 'http://localhost:4000'}</span>
        </footer>
      </div>
    </div>
  )
}

export default App
