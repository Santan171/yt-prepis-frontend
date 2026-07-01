"use client"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

const API = process.env.NEXT_PUBLIC_API_URL

export default function History({ user }: { user: any }) {
  const [items, setItems] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const getToken = async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token
  }

  const load = async () => {
    const token = await getToken()
    const res = await fetch(`${API}/api/history`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  const open = async (id: string) => {
    const token = await getToken()
    const res = await fetch(`${API}/api/history/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    setSelected(await res.json())
  }

  const remove = async (id: string) => {
    const token = await getToken()
    await fetch(`${API}/api/history/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
    setItems(prev => prev.filter(i => i.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  useEffect(() => { load() }, [])

  if (loading) return <p className="text-sm text-gray-400">Načítavam…</p>

  return (
    <div className="space-y-4 pb-12">
      {items.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <p className="text-sm text-gray-400">Zatiaľ žiadne prepisy.</p>
        </div>
      )}

      {items.map(item => (
        <div key={item.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {item.language} · {new Date(item.created_at).toLocaleDateString("sk-SK")}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => open(item.id)}
              className="border border-gray-200 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Zobraziť
            </button>
            <button
              onClick={() => remove(item.id)}
              className="border border-red-100 text-red-400 text-sm px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              Zmazať
            </button>
          </div>
        </div>
      ))}

      {selected && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm font-medium text-gray-800">{selected.title}</p>
            <button onClick={() => setSelected(null)} className="text-gray-300 hover:text-gray-600 text-lg leading-none">×</button>
          </div>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
            {selected.content}
          </pre>
          <button
            onClick={() => navigator.clipboard.writeText(selected.content)}
            className="mt-4 border border-gray-200 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Kopírovať
          </button>
        </div>
      )}
    </div>
  )
}
