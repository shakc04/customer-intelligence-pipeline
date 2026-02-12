export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <main className="mx-auto max-w-6xl px-6 py-16">
        {/* Hero Section */}
        <div className="mb-20 text-center">
          <h1 className="mb-4 text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
            Customer Intelligence Pipeline
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-slate-600 dark:text-slate-300">
            Transform first-party events into actionable customer insights and
            targeted campaigns
          </p>
        </div>

        {/* Feature Sections */}
        <div className="grid gap-12 md:grid-cols-2">
          {/* Ingestion */}
          <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 inline-block rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
              <svg
                className="h-6 w-6 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                />
              </svg>
            </div>
            <h2 className="mb-3 text-2xl font-semibold text-slate-900 dark:text-white">
              Data Ingestion
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              Capture and process first-party events from web, mobile, and
              server-side sources in real-time.
            </p>
          </div>

          {/* Profiles */}
          <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 inline-block rounded-lg bg-green-100 p-3 dark:bg-green-900/30">
              <svg
                className="h-6 w-6 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h2 className="mb-3 text-2xl font-semibold text-slate-900 dark:text-white">
              Customer Profiles
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              Build unified customer profiles with enriched attributes,
              behavioral data, and engagement history.
            </p>
          </div>

          {/* Segmentation */}
          <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 inline-block rounded-lg bg-purple-100 p-3 dark:bg-purple-900/30">
              <svg
                className="h-6 w-6 text-purple-600 dark:text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h2 className="mb-3 text-2xl font-semibold text-slate-900 dark:text-white">
              Audience Segmentation
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              Create dynamic segments based on behavior, demographics, and
              custom attributes for precise targeting.
            </p>
          </div>

          {/* Campaigns */}
          <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 inline-block rounded-lg bg-orange-100 p-3 dark:bg-orange-900/30">
              <svg
                className="h-6 w-6 text-orange-600 dark:text-orange-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="mb-3 text-2xl font-semibold text-slate-900 dark:text-white">
              Campaign Management
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              Schedule and simulate multi-channel campaigns with advanced
              targeting and performance analytics.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
