'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, AlertCircle, Copy, Check } from 'lucide-react'

const MODELS = [
    { id: 'deepseek-coder:6.7b', label: 'deepseek-coder:6.7b (Recommended)', benchmark: 5.2 },
    { id: 'qwen2.5-coder:7b', label: 'qwen2.5-coder:7b', benchmark: 6.8 },
    { id: 'llama3:latest', label: 'llama3:latest', benchmark: 4.1 },
]

interface Metrics {
    latency: number
    tokensPerSec: number
    outputTokens: number
}

type ExecutionStage = {
    status?: string
    duration?: number
}

interface ExecutionData {
    totalDuration: number
    stages: Record<string, ExecutionStage>
}

function ExecutionFlowDiagram({ execution }: { execution?: ExecutionData }) {
    if (!execution) return null

    const stages = [
        { name: 'validation', label: 'Validation' },
        { name: 'tokenization', label: 'Tokenization' },
        { name: 'inference', label: 'Inference' },
    ]

    return (
        <div className="space-y-3">
            {stages.map((stage) => {
                const stageData = execution.stages[stage.name]
                return (
                    <div key={stage.name} className="flex items-center gap-3">
                        <div className="flex items-center gap-2 flex-1">
                            <div className={`w-3 h-3 rounded-full ${stageData?.status === 'done' ? 'bg-green-400' :
                                stageData?.status === 'in_progress' ? 'bg-blue-400 animate-pulse' :
                                    stageData?.status === 'error' ? 'bg-red-400' : 'bg-yellow-400'
                                }`} />
                            <span className="text-xs font-medium text-slate-400 w-24">{stage.label}</span>
                        </div>
                        {stageData?.duration && (
                            <span className="text-xs text-slate-500">{stageData.duration}ms</span>
                        )}
                    </div>
                )
            })}
            {execution.totalDuration && (
                <div className="pt-2 border-t border-slate-700 text-xs text-slate-400">
                    Total: {execution.totalDuration}ms
                </div>
            )}
        </div>
    )
}

export default function LLMPlaygroundPage() {
    const [model, setModel] = useState('deepseek-coder:6.7b')
    const [prompt, setPrompt] = useState('Write a Python function that returns Fibonacci numbers up to n.')
    const [response, setResponse] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [metrics, setMetrics] = useState<Metrics | null>(null)
    const [execution, setExecution] = useState<ExecutionData | null>(null)
    const [copied, setCopied] = useState(false)
    const responseRef = useRef<HTMLDivElement>(null)
    const startTimeRef = useRef<number>(0)
    const tokenCountRef = useRef<number>(0)

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt')
            return
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8010'

        setLoading(true)
        setError(null)
        setResponse('')
        setMetrics(null)
        setExecution(null)
        tokenCountRef.current = 0
        startTimeRef.current = Date.now()

        try {
            const response = await fetch(`${apiUrl}/llm/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, model, stream: false }),
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Backend returned ${response.status}: ${errorText || response.statusText}`)
            }

            const data = await response.json()
            const fullResponse = data.response || ''
            setResponse(fullResponse)

            const latency = Date.now() - startTimeRef.current
            const tokenCount = fullResponse ? fullResponse.split(/\s+/).length : 0
            tokenCountRef.current = tokenCount

            setMetrics({
                latency,
                tokensPerSec: latency > 0 ? (tokenCount / latency) * 1000 : 0,
                outputTokens: tokenCount,
            })
        } catch (err) {
            if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
                setError(`Cannot reach backend at ${apiUrl}. Set NEXT_PUBLIC_API_URL in src/frontend/.env.local to your backend URL (for example http://localhost:8010), then restart frontend.`)
            } else {
                setError(err instanceof Error ? err.message : 'Failed to generate response')
            }
            console.error('LLM error:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(response)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleClear = () => {
        setResponse('')
        setMetrics(null)
        setExecution(null)
        setError(null)
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
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        LLM Playground
                    </h1>
                    <div className="w-20" /> {/* Spacer for centering */}
                </div>
            </header>

            {/* Content */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Input Panel */}
                    <div className="lg:col-span-2">
                        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 space-y-6">
                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-300">{error}</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Select Model</label>
                                <select
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    disabled={loading}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 focus:border-cyan-500 focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {MODELS.map(m => (
                                        <option key={m.id} value={m.id}>{m.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Prompt</label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Ask your question..."
                                    disabled={loading}
                                    className="w-full h-32 bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-600 text-white font-medium py-3 rounded-lg transition duration-300 flex items-center justify-center gap-2"
                                >
                                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {loading ? 'Generating...' : 'Generate Response'}
                                </button>
                                {response && (
                                    <button
                                        onClick={handleClear}
                                        disabled={loading}
                                        className="flex-1 border border-slate-600 text-slate-300 hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium py-3 rounded-lg transition duration-300"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Token Stream / Response Output */}
                        {(response || loading) && (
                            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 mt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-slate-300">Response</h3>
                                    {response && (
                                        <button
                                            onClick={handleCopy}
                                            className="flex items-center gap-2 px-3 py-1 text-xs text-slate-400 hover:text-slate-200 transition"
                                        >
                                            {copied ? (
                                                <>
                                                    <Check className="w-4 h-4" />
                                                    Copied
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-4 h-4" />
                                                    Copy
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                                <div
                                    ref={responseRef}
                                    className="h-64 bg-slate-900 rounded-lg p-4 border border-slate-600 overflow-auto"
                                >
                                    {response ? (
                                        <div className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
                                            {response}
                                            {loading && <span className="animate-pulse">▌</span>}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-slate-500">
                                            {loading ? (
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span className="text-xs">Streaming response...</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs">Response will appear here</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Execution Flow */}
                        {execution && (
                            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 mt-6">
                                <h3 className="text-sm font-semibold text-slate-300 mb-4">Execution Flow</h3>
                                <ExecutionFlowDiagram execution={execution} />
                            </div>
                        )}
                    </div>

                    {/* Metrics Panel */}
                    <div className="space-y-6">
                        {metrics && (
                            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                                <h3 className="text-sm font-semibold text-slate-300 mb-4">Live Metrics</h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-slate-400 text-xs">Latency</span>
                                            <span className="text-purple-400 font-semibold text-sm">{(metrics.latency / 1000).toFixed(2)}s</span>
                                        </div>
                                        <div className="w-full bg-slate-700 rounded-full h-1.5">
                                            <div
                                                className="bg-gradient-to-r from-purple-400 to-pink-400 h-1.5 rounded-full"
                                                style={{ width: `${Math.min((metrics.latency / 10000) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-slate-400 text-xs">Throughput</span>
                                            <span className="text-green-400 font-semibold text-sm">{metrics.tokensPerSec.toFixed(1)} tok/s</span>
                                        </div>
                                        <div className="w-full bg-slate-700 rounded-full h-1.5">
                                            <div
                                                className="bg-gradient-to-r from-green-400 to-emerald-400 h-1.5 rounded-full"
                                                style={{ width: `${Math.min((metrics.tokensPerSec / 100) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-slate-600">
                                        <span className="text-slate-400 text-sm">Output Tokens</span>
                                        <span className="text-cyan-400 font-semibold">{metrics.outputTokens}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                            <h3 className="text-sm font-semibold text-slate-300 mb-4">Model Info</h3>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <div className="text-slate-400 text-xs">Current Model</div>
                                    <div className="text-cyan-400 font-medium">{model}</div>
                                </div>
                                <div className="border-t border-slate-600 pt-3 mt-3">
                                    <div className="text-slate-400 text-xs mb-2">Benchmarks (avg latency)</div>
                                    <div className="space-y-1.5">
                                        {MODELS.map(m => (
                                            <div
                                                key={m.id}
                                                className={`flex justify-between px-2 py-1 rounded transition ${m.id === model ? 'bg-cyan-500/20 border border-cyan-500/50' : ''}`}
                                            >
                                                <span className={m.id === model ? 'text-cyan-300 text-xs font-medium' : 'text-slate-400 text-xs'}>{m.label.split(' ')[0]}</span>
                                                <span className={m.id === model ? 'text-cyan-300 font-medium text-xs' : 'text-slate-400 text-xs'}>{m.benchmark}s</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {!response && !loading && (
                            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6 text-center">
                                <div className="text-slate-400 text-sm">
                                    Enter a prompt and click &quot;Generate&quot; to start
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </main>
    )
}
