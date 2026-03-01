import Link from 'next/link'
import { ArrowRight, Sparkles, MessageSquare, Zap } from 'lucide-react'

export default function Home() {
    return (
        <main className="min-h-screen">
            {/* Navigation */}
            <nav className="border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-slate-900" />
                        </div>
                        <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                            Local AI Stack
                        </span>
                    </div>
                    <div className="text-sm text-slate-400">
                        Powered by Ollama + Milvus + FastAPI
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center mb-16">
                    <h1 className="text-5xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                        Local AI, Beautiful UI
                    </h1>
                    <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
                        Explore embeddings, chat with local LLMs, and build RAG applications—all with real-time execution flow visualization.
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-sm text-slate-400">All services connected and ready</span>
                    </div>
                </div>

                {/* Apps Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {/* Embeddings Card */}
                    <Link href="/embeddings">
                        <div className="group relative cursor-pointer">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl opacity-0 group-hover:opacity-20 blur-xl transition duration-500" />
                            <div className="relative bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 hover:border-blue-500 transition duration-300 h-full flex flex-col">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                        <Sparkles className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold">Embeddings</h3>
                                </div>
                                <p className="text-slate-400 mb-6 flex-grow">
                                    Text → embeddings → similarity scores & 2D projections
                                </p>
                                <div className="flex items-center gap-2 text-blue-400 group-hover:gap-3 transition duration-300">
                                    <span className="text-sm font-medium">Explore</span>
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* LLM Playground Card */}
                    <Link href="/llm-playground">
                        <div className="group relative cursor-pointer">
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-xl opacity-0 group-hover:opacity-20 blur-xl transition duration-500" />
                            <div className="relative bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 hover:border-cyan-500 transition duration-300 h-full flex flex-col">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                                        <MessageSquare className="w-6 h-6 text-cyan-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold">LLM Playground</h3>
                                </div>
                                <p className="text-slate-400 mb-6 flex-grow">
                                    Chat interface with model selection & real-time token streaming
                                </p>
                                <div className="flex items-center gap-2 text-cyan-400 group-hover:gap-3 transition duration-300">
                                    <span className="text-sm font-medium">Try It</span>
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* RAG App Card */}
                    <Link href="/rag-app">
                        <div className="group relative cursor-pointer">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl opacity-0 group-hover:opacity-20 blur-xl transition duration-500" />
                            <div className="relative bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 hover:border-purple-500 transition duration-300 h-full flex flex-col">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                        <Zap className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold">RAG Application</h3>
                                </div>
                                <p className="text-slate-400 mb-6 flex-grow">
                                    Question → retrieval → context highlighting → AI-powered answers
                                </p>
                                <div className="flex items-center gap-2 text-purple-400 group-hover:gap-3 transition duration-300">
                                    <span className="text-sm font-medium">Build</span>
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Flow Diagram Info */}
                <div className="bg-slate-800/30 backdrop-blur border border-slate-700 rounded-xl p-8 mb-8">
                    <h2 className="text-xl font-semibold mb-4">Real-Time Execution Flow Visualization</h2>
                    <p className="text-slate-300 mb-4">
                        Each app displays a live execution pipeline showing how your input flows through the system:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                                <span className="text-xs font-bold text-blue-400">1</span>
                            </div>
                            <div>
                                <div className="font-medium text-blue-400">Input Processing</div>
                                <div className="text-sm text-slate-400">Validation & preprocessing timing</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-cyan-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                                <span className="text-xs font-bold text-cyan-400">2</span>
                            </div>
                            <div>
                                <div className="font-medium text-cyan-400">Backend Processing</div>
                                <div className="text-sm text-slate-400">API calls, inference, retrieval timing</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                                <span className="text-xs font-bold text-purple-400">3</span>
                            </div>
                            <div>
                                <div className="font-medium text-purple-400">Response Handling</div>
                                <div className="text-sm text-slate-400">Result formatting & final duration</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Architecture Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-800/30 backdrop-blur border border-slate-700 rounded-xl p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <span className="text-cyan-400">⚙️</span> Technology Stack
                        </h3>
                        <ul className="space-y-2 text-sm text-slate-300">
                            <li>• <span className="text-blue-400">Next.js</span> - Modern React framework with TypeScript</li>
                            <li>• <span className="text-cyan-400">Express.js BFF</span> - Backend-for-Frontend server</li>
                            <li>• <span className="text-purple-400">Tailwind CSS</span> - Beautiful, responsive design</li>
                            <li>• <span className="text-green-400">FastAPI</span> - Python backend services</li>
                            <li>• <span className="text-orange-400">Ollama</span> - Local LLM inference</li>
                            <li>• <span className="text-red-400">Milvus</span> - Vector database</li>
                        </ul>
                    </div>
                    <div className="bg-slate-800/30 backdrop-blur border border-slate-700 rounded-xl p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <span className="text-purple-400">🎯</span> Features
                        </h3>
                        <ul className="space-y-2 text-sm text-slate-300">
                            <li>✓ Real-time execution flow tracking</li>
                            <li>✓ Live token generation streaming</li>
                            <li>✓ Vector space visualization (2D/3D)</li>
                            <li>✓ Context relevance highlighting</li>
                            <li>✓ Model benchmarking dashboard</li>
                            <li>✓ Beautiful AI-themed backgrounds</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-700/50 mt-20 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-400">
                    <p>🚀 Local AI Stack with GPU Acceleration • Built with Next.js + TypeScript + Tailwind CSS</p>
                </div>
            </footer>
        </main>
    )
}
