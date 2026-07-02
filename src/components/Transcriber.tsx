"use client"
import { useState, useRef } from "react"
import { supabase } from "@/lib/supabase"

const API = process.env.NEXT_PUBLIC_API_URL

type Mode = "youtube" | "upload"

export default function Transcriber({ user }: { user: any }) {
  const [mode, setMode] = useState<Mode>("youtube")
  const [url, setUrl] = useState("")
  const [lang, setLang] = useState("sk")
  const [timestamps, setTimestamps] = useState(false)
  const [deduplicate, setDeduplicate] = useState(true)
  const [result, setResult] = useState("")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)

  const getToken = async () => {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) throw new Error("Nie si prihlásený, obnov stránku")
    return token
  }

  const transcribeYoutube = async () => {
    const token = await getToken()
    const res = await fetch(`${API}/api/youtube`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ url, lang, timestamps, deduplicate }),
    })
    const text = await res.text()
    let data: any
    try { data = JSON.parse(text) } catch { throw new Error("Neplatná odpoveď servera: " + text.substring(0, 100)) }
    if (!res.ok) throw new Error(data.detail || "Chyba servera")
    return data
  }

  const run = async () => {
    setLoading(true)
    setStatus("Spracúvam…")
    setResult("")
    try {
      const data = await transcribeYoutube()
      setResult(data.content)
      setStatus(`Hotovo — ${data.segments} segmentov · jazyk: ${data.language}`)
    } catch (e: any) {
      setStatus("Chyba: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  const copy = () => { navigator.clipboard.writeText(result); setStatus("Skopírované!") }
  const download = () => {
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([result], { type: "text/plain" }))
    a.download = "prepis.txt"
    a.click()
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL</label>
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div className="flex gap-4 flex-wrap">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Jazyk</label>
            <select value={lang} onChange={e => setLang(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm">
              <option value="sk">Slovenčina</option>
              <option value="cs">Čeština</option>
              <option value="en">Angličtina</option>
              <option value="auto">Automaticky</option>
            </select>
          </div>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={timestamps} onChange={e => setTimestamps(e.target.checked)} className="rounded" />
              Časové značky
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={deduplicate} onChange={e => setDeduplicate(e.target.checked)} className="rounded" />
              Deduplikácia
            </label>
          </div>
        </div>
        <button
          onClick={run}
          disabled={loading || !url.trim()}
          className="w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-700 disabled:opacity-40 transition-colors"
        >
          {loading ? "Spracúvam…" : "Prepísať"}
        </button>
        {status && (
          <p className={`text-sm ${status.startsWith("Chyba") ? "text-red-500" : "text-gray-500"}`}>{status}</p>
        )}
      </div>
      {result && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
          <div className="flex gap-2">
            <button onClick={copy} className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">Kopírovať</button>
            <button onClick={download} className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">Stiahnuť</button>
          </div>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto">{result}</pre>
        </div>
      )}
    </div>
  )
}
