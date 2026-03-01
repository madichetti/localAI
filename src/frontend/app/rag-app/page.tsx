'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Upload, Trash2 } from 'lucide-react'

type DocumentItem = {
    id: number
    text: string
}

type AskResponse = {
    answer: string
    context: string[]
    model: string
}

export default function RAGAppPage() {
    const [documents, setDocuments] = useState<DocumentItem[]>([])
    const [question, setQuestion] = useState('Which vector database should I use for similarity search?')
    const [answer, setAnswer] = useState('')
    const [context, setContext] = useState<string[]>([])
    const [loadingDocs, setLoadingDocs] = useState(false)
    const [asking, setAsking] = useState(false)
    const [ingesting, setIngesting] = useState(false)
    const [resetting, setResetting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8010'

    const loadDocuments = useCallback(async () => {
        setLoadingDocs(true)
        try {
            const response = await fetch(`${apiUrl}/rag/documents`)
            if (!response.ok) throw new Error('Failed to load documents')
            const payload = await response.json()
            setDocuments(payload.documents || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load documents')
        } finally {
            setLoadingDocs(false)
        }
    }, [apiUrl])

    useEffect(() => {
        loadDocuments()
    }, [loadDocuments])

    const handleAsk = async () => {
        if (!question.trim()) {
            setError('Please enter a question')
            return
        }

        setError(null)
        setAsking(true)
        setAnswer('')
        setContext([])

        try {
            const response = await fetch(`${apiUrl}/rag/ask`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: question.trim(), top_k: 3 }),
            })

            if (!response.ok) {
                throw new Error(`RAG request failed: ${response.status}`)
            }

            const payload = await response.json() as AskResponse
            setAnswer(payload.answer || '')
            setContext(payload.context || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to get answer')
        } finally {
            setAsking(false)
        }
    }

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return

        setError(null)
        setIngesting(true)

        try {
            const docs = await Promise.all(Array.from(event.target.files).map((file) => file.text()))
            const response = await fetch(`${apiUrl}/rag/ingest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documents: docs }),
            })
            if (!response.ok) {
                const payload = await response.json().catch(() => null)
                throw new Error(payload?.detail || `Failed to ingest documents (${response.status})`)
            }
            await loadDocuments()
            event.target.value = ''
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to ingest documents')
        } finally {
            setIngesting(false)
        }
    }

    const handleReset = async () => {
        setError(null)
        setResetting(true)
        try {
            const response = await fetch(`${apiUrl}/rag/reset`, { method: 'POST' })
            if (!response.ok) throw new Error('Failed to reset collection')
            setAnswer('')
            setContext([])
            await loadDocuments()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reset collection')
        } finally {
            setResetting(false)
        }
    }

    return (
        <main className="min-h-screen">
            <header className="border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm">Back to Dashboard</span>
                    </Link>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        RAG Application
                    </h1>
                    <div className="w-20" />
                </div>
            </header>

            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <aside className="space-y-4">
                    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-5 space-y-3">
                        <h2 className="text-sm font-semibold text-slate-300">Document Management</h2>
                        <label className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium py-2 px-3 rounded-lg transition duration-300 text-sm cursor-pointer">
                            <Upload className="w-4 h-4" />
                            {ingesting ? 'Uploading...' : 'Add Documents'}
                            <input type="file" className="hidden" accept=".txt,.md,.json,.csv,.log" multiple onChange={handleUpload} disabled={ingesting} />
                        </label>
                        <button
                            onClick={handleReset}
                            disabled={resetting}
                            className="w-full inline-flex items-center justify-center gap-2 border border-red-500/50 hover:bg-red-500/10 text-red-400 font-medium py-2 px-3 rounded-lg transition duration-300 text-sm disabled:opacity-60"
                        >
                            <Trash2 className="w-4 h-4" />
                            {resetting ? 'Clearing...' : 'Clear Collection'}
                        </button>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-5">
                        <h2 className="text-sm font-semibold text-slate-300 mb-3">Collection</h2>
                        <div className="text-sm text-slate-400">Documents: <span className="text-purple-400 font-medium">{documents.length}</span></div>
                        {loadingDocs && <div className="text-xs text-slate-500 mt-2">Refreshing document list...</div>}
                    </div>
                </aside>

                <div className="lg:col-span-2 space-y-6">
                    {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/40 rounded-lg px-4 py-3">{error}</div>}

                    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                        <label className="block text-sm font-medium text-slate-300 mb-3">Ask a Question</label>
                        <textarea
                            value={question}
                            onChange={(event) => setQuestion(event.target.value)}
                            className="w-full h-24 bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none transition mb-4"
                            placeholder="Type your question here..."
                            disabled={asking}
                        />
                        <button
                            onClick={handleAsk}
                            disabled={asking}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium py-2.5 px-4 rounded-lg transition duration-300 disabled:opacity-60"
                        >
                            {asking && <Loader2 className="w-4 h-4 animate-spin" />}
                            {asking ? 'Thinking...' : 'Ask'}
                        </button>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                        <h2 className="text-sm font-semibold text-slate-300 mb-3">Answer</h2>
                        <p className="text-slate-200 whitespace-pre-wrap text-sm leading-relaxed">{answer || 'No answer yet.'}</p>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                        <h2 className="text-sm font-semibold text-slate-300 mb-3">Retrieved Context</h2>
                        {context.length === 0 ? (
                            <p className="text-slate-400 text-sm">No context yet.</p>
                        ) : (
                            <ul className="space-y-3">
                                {context.map((item, index) => (
                                    <li key={`${index}-${item.slice(0, 12)}`} className="text-sm text-slate-300 border border-slate-700 rounded-lg p-3 bg-slate-900/40">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </section>
        </main>
    )
}
