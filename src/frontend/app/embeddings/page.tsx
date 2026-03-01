'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'

type ExecutionStage = {
    status?: string
    duration?: number
}

type ExecutionFlow = {
    totalDuration?: number
    stages?: Record<string, ExecutionStage>
}

function ExecutionFlowDiagram({ execution }: { execution?: ExecutionFlow }) {
    if (!execution) return null

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-300">Execution Flow</h3>
            <div className="flex flex-col gap-3">
                {Array.from(Object.entries(execution.stages || {})).map(([stageName, stageData]) => (
                    <div key={stageName} className="flex items-center gap-3">
                        <div className="flex items-center gap-2 flex-1">
                            <div className={`w-3 h-3 rounded-full ${stageData.status === 'done' ? 'bg-green-400' :
                                stageData.status === 'in_progress' ? 'bg-blue-400 animate-pulse' :
                                    stageData.status === 'error' ? 'bg-red-400' : 'bg-yellow-400'
                                }`} />
                            <span className="text-xs font-medium text-slate-400 w-24 capitalize">{stageName}</span>
                        </div>
                        {stageData.duration && (
                            <span className="text-xs text-slate-500">{stageData.duration}ms</span>
                        )}
                    </div>
                ))}
            </div>
            {execution.totalDuration && (
                <div className="pt-2 border-t border-slate-700 text-xs text-slate-400">
                    Total: {execution.totalDuration}ms
                </div>
            )}
        </div>
    )
}

interface SimilarityResult {
    embeddings: number[][]
    model: string
    dim: number
}

interface ExecutionData {
    totalDuration: number
    stages: Record<string, ExecutionStage>
}

export default function EmbeddingsPage() {
    const [textA, setTextA] = useState('')
    const [textB, setTextB] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [similarity, setSimilarity] = useState<number | null>(null)
    const [result, setResult] = useState<SimilarityResult | null>(null)
    const [execution, setExecution] = useState<ExecutionData | null>(null)

    const handleCalculate = async () => {
        if (!textA.trim() || !textB.trim()) {
            setError('Please enter both texts')
            return
        }

        setLoading(true)
        setError(null)
        setSimilarity(null)
        setResult(null)

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8010'

            const response = await fetch(`${apiUrl}/embed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ texts: [textA.trim(), textB.trim()] }),
            })

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`)
            }

            const data = await response.json()

            // Calculate cosine similarity
            const embeddings = data.embeddings
            if (embeddings && embeddings.length === 2) {
                const emb1 = embeddings[0]
                const emb2 = embeddings[1]

                // Cosine similarity: (A·B) / (||A|| * ||B||)
                let dotProduct = 0
                let normA = 0
                let normB = 0

                for (let i = 0; i < emb1.length; i++) {
                    dotProduct += emb1[i] * emb2[i]
                    normA += emb1[i] * emb1[i]
                    normB += emb2[i] * emb2[i]
                }

                normA = Math.sqrt(normA)
                normB = Math.sqrt(normB)
                const similarity = dotProduct / (normA * normB)

                setSimilarity(similarity)
                setResult({
                    embeddings,
                    model: data.model,
                    dim: data.embeddings[0].length,
                })
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to calculate similarity')
            console.error('Embedding error:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleClear = () => {
        setTextA('')
        setTextB('')
        setSimilarity(null)
        setResult(null)
        setExecution(null)
        setError(null)
    }

    const getSimilarityLabel = (score: number): string => {
        if (score >= 0.8) return 'Very similar'
        if (score >= 0.6) return 'Similar'
        if (score >= 0.4) return 'Moderately similar'
        if (score >= 0.2) return 'Somewhat different'
        return 'Very different'
    }

    return (
        <main className="min-h-screen">
            {/* Header */}
            <header className="border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm">Back to Dashboard</span>
                    </Link>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        Embeddings Explorer
                    </h1>
                    <div className="w-20" /> {/* Spacer for centering */}
                </div>
            </header>

            {/* Content */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Input Panel */}
                    <div className="lg:col-span-2">
                        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8">
                            <h2 className="text-lg font-semibold mb-6">Text Pair Similarity</h2>

                            {error && (
                                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-300">{error}</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Text A</label>
                                    <textarea
                                        value={textA}
                                        onChange={(e) => setTextA(e.target.value)}
                                        placeholder="Enter first text..."
                                        disabled={loading}
                                        className="w-full h-24 bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Text B</label>
                                    <textarea
                                        value={textB}
                                        onChange={(e) => setTextB(e.target.value)}
                                        placeholder="Enter second text..."
                                        disabled={loading}
                                        className="w-full h-24 bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleCalculate}
                                        disabled={loading}
                                        className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-slate-600 disabled:to-slate-600 text-white font-medium py-3 rounded-lg transition duration-300 flex items-center justify-center gap-2"
                                    >
                                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {loading ? 'Calculating...' : 'Calculate Similarity'}
                                    </button>
                                    <button
                                        onClick={handleClear}
                                        disabled={loading}
                                        className="flex-1 border border-slate-600 text-slate-300 hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium py-3 rounded-lg transition duration-300"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Execution Flow */}
                        {execution && (
                            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 mt-6">
                                <ExecutionFlowDiagram execution={execution} />
                            </div>
                        )}
                    </div>

                    {/* Results Panel */}
                    <div className="space-y-6">
                        {similarity !== null && (
                            <>
                                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                                    <h3 className="text-sm font-semibold text-slate-300 mb-4">Similarity Score</h3>
                                    <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                                        {(similarity * 100).toFixed(1)}%
                                    </div>
                                    <div className="text-xs text-slate-400 mb-4">
                                        {getSimilarityLabel(similarity)} (cosine similarity)
                                    </div>
                                    <div className="w-full bg-slate-700 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-blue-400 to-cyan-400 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${similarity * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {result && (
                                    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                                        <h3 className="text-sm font-semibold text-slate-300 mb-4">Embedding Info</h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Dimension:</span>
                                                <span className="text-blue-400 font-medium">{result.dim}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Model:</span>
                                                <span className="text-cyan-400 font-medium">{result.model}</span>
                                            </div>
                                            {execution && (
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">Latency:</span>
                                                    <span className="text-purple-400 font-medium">{execution.totalDuration}ms</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {!similarity && !loading && (
                            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6 text-center">
                                <div className="text-slate-400 text-sm">
                                    Enter two texts and click &quot;Calculate Similarity&quot; to see results
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </main>
    )
}
