import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: 'Local AI Stack - GUI Dashboard',
    description: 'Beautiful UI for embeddings, LLM chat, and RAG applications',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <head>
                <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
        `}</style>
            </head>
            <body className="font-sans antialiased bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen text-white">
                <div className="fixed inset-0 -z-10 overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
                    <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
                </div>

                <div className="relative z-10">
                    {children}
                </div>
            </body>
        </html>
    )
}
