"use client"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import Auth from "@/components/Auth"
import Transcriber from "@/components/Transcriber"
import History from "@/components/History"

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"new" | "history">("new")

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-400 text-sm">Načítavam…</div>
    </div>
  )

  if (!user) return <Auth />

  return (
    <div className="min-h-screen" style={{ background: "#f5f5f3" }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">YT Prepis</h1>
          <p className="text-xs text-gray-400">Prepis YouTube videí a zvukových súborov</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user.email}</span>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            Odhlásiť
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-6 w-fit">
          {(["new", "history"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {t === "new" ? "Nový prepis" : "História"}
            </button>
          ))}
        </div>

        {tab === "new" ? <Transcriber user={user} /> : <History user={user} />}
      </div>
    </div>
  )
}
