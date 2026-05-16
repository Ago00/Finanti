'use client'

import { useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'

export function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const params = use(searchParams)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(
    params.error === 'unauthorized' ? 'Email no autorizado.' : null
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      setError('Error al enviar el enlace. Inténtalo de nuevo.')
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="text-center space-y-3 p-6 rounded-xl bg-[#131826] border border-[#1F2937]">
        <div className="text-2xl">📬</div>
        <p className="text-white font-medium">Revisa tu email</p>
        <p className="text-[#94A3B8] text-sm">
          Te hemos enviado un enlace a <strong className="text-white">{email}</strong>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm text-[#94A3B8]">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          required
          className="w-full px-4 py-3 rounded-lg bg-[#131826] border border-[#1F2937] text-white placeholder-[#64748B] focus:outline-none focus:border-[#6366F1] transition-colors"
        />
      </div>

      {error && (
        <p className="text-sm text-[#EF4444]">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-lg bg-[#6366F1] text-white font-medium hover:bg-[#4F46E5] disabled:opacity-50 transition-colors"
      >
        {loading ? 'Enviando...' : 'Entrar con magic link'}
      </button>
    </form>
  )
}
