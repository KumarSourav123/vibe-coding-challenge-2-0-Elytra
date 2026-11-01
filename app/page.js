export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <div className="max-w-2xl bg-white p-8 rounded-xl shadow-md border border-slate-200">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">
          Sports Academy Management System
        </h1>
        <p className="text-slate-600 mb-6">
          Phase 1 backend foundation initialized. Health-check endpoint is active at{' '}
          <a href="/api/health" className="text-blue-600 font-mono underline hover:text-blue-800">
            /api/health
          </a>
          .
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
          Ready for Frontend Integration
        </div>
      </div>
    </main>
  );
}

