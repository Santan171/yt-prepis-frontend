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
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState("")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const getToken = async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token
  }

  const transcribeYoutube = async () => {
    const token = await getToken()
    const res = await fetch(`${API}/api/youtube`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ url, lang, timestamps, deduplicate }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || "Chyba servera")
    return data
  }

  const transcribeUpload = async () => {
    if (!file) throw new Error("Vyber súbor")
    const token = await getToken()
    const form = new FormData()
    form.append("file", file)
    const res = await fetch(`${API}/api/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || "Chyba servera")
    return data
  }

  const run = async () => {
    setLoading(true)
    setStatus("Spracúvam…")
    setResult("")
    try {
      const data = mode === "youtube" ? await transcribeYoutube() : await transcribeUpload()
      setResult(data.content)
      setStatus(`Hotovo — ${data.segments} segmentov · jazyk: ${data.language}`)
    } catch (e: any) {
      setStatus("Chyba: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  const copy = () => {
    navigator.clipboard.writeText(result)
    setStatus("Skopírované!")
  }

  const download = () => {
    const blob = new Blob([result], { type: "text/plain" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = "prepis.txt"
    a.click()
  }

  return (
    <div className="space-y-4 pb-12">
      {/* Mode toggle */}
      <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit">
        {(["youtube", "upload"] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              mode === m ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {m === "youtube" ? "YouTube URL" : "Nahrať súbor"}
          </button>
        ))}
      </div>

      {/* Input card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        {mode === "youtube" ? (
          <div>
            <label className="text-xs text-gray-500 block mb-1">YouTube URL</label>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400 transition-colors"
            />
          </div>
        ) : (
          <div>
            <label className="text-xs text-gray-500 block mb-1">Zvukový alebo video súbor</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-gray-300 transition-colors"
            >
              {file ? (
                <p className="text-sm text-gray-700 font-medium">{file.name}</p>
              ) : (
                <>
                  <p className="text-sm text-gray-400">Klikni alebo presuň súbor sem</p>
                  <p className="text-xs text-gray-300 mt-1">mp3, mp4, wav, ogg, webm</p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="audio/*,video/mp4"
              className="hidden"
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
          </div>
        )}

        {/* Options */}
        <div className="flex flex-wrap gap-4 items-center">
          {mode === "youtube" && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Jazyk:</label>
              <select
                value={lang}
                onChange={e => setLang(e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-1 text-sm outline-none focus:border-gray-400"
              >
                {["sk", "cs", "en", "de", "pl", "hu", "auto"].map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          )}
          {mode === "youtube" && (
            <>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={timestamps} onChange={e => setTimestamps(e.target.checked)} className="accent-gray-800" />
                Časové značky
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={deduplicate} onChange={e => setDeduplicate(e.target.checked)} className="accent-gray-800" />
                Odstrániť opakovania
              </label>
            </>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={run}
            disabled={loading || (mode === "youtube" ? !url : !file)}
            className="bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-40"
          >
            {loading ? "Spracúvam…" : "Prepísať"}
          </button>
          {result && (
            <>
              <button onClick={copy} className="border border-gray-200 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">Kopírovať</button>
              <button onClick={download} className="border border-gray-200 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">Stiahnuť .txt</button>
            </>
          )}
        </div>

        {status && (
          <p className={`text-xs ${status.startsWith("Chyba") ? "text-red-500" : "text-green-600"}`}>{status}</p>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">Prepis</p>
          <pre className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
            {result}
          </pre>
        </div>
      )}
    </div>
  )
}
