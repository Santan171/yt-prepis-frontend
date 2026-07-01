"use client"
import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Auth() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [mode, setMode] = useState<"login" | "register">("login")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    setLoading(true)
    setStatus("")
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) setStatus(error.message)
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) setStatus(error.message)
        else setStatus("Skontroluj email a potvrď registráciu.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#f5f5f3" }}>
      <div className="bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-1">YT Prepis</h1>
        <p className="text-sm text-gray-400 mb-6">
          {mode === "login" ? "Prihlás sa do svojho účtu" : "Vytvor nový účet"}
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 transition-colors"
              placeholder="meno@email.com"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Heslo</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handle()}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 transition-colors"
              placeholder="••••••••"
            />
          </div>
        </div>

        {status && (
          <p className={`text-xs mt-3 ${status.includes("email") ? "text-green-600" : "text-red-500"}`}>
            {status}
          </p>
        )}

        <button
          onClick={handle}
          disabled={loading || !email || !password}
          className="w-full mt-5 bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-40"
        >
          {loading ? "Načítavam…" : mode === "login" ? "Prihlásiť sa" : "Registrovať sa"}
        </button>

        <button
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          {mode === "login" ? "Nemáš účet? Registruj sa" : "Máš účet? Prihlás sa"}
        </button>
      </div>
    </div>
  )
}
