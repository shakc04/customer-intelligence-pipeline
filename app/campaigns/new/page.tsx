"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SegmentOption {
  id: string;
  name: string;
  description: string | null;
}

export default function NewCampaignPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [segmentId, setSegmentId] = useState("");
  const [segments, setSegments] = useState<SegmentOption[]>([]);
  const [loadingSegments, setLoadingSegments] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/segments")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data.segments) ? data.segments : [];
        setSegments(list);
        if (list.length > 0) setSegmentId(list[0].id);
      })
      .catch(() => setError("Failed to load segments"))
      .finally(() => setLoadingSegments(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!segmentId) {
      setError("Please select a segment");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, segmentId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create campaign");
        return;
      }

      router.push(`/campaigns/${data.campaignId}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-8">
          <Link
            href="/campaigns"
            className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            &larr; Back to Campaigns
          </Link>
        </div>

        <h1 className="mb-2 text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          New Campaign
        </h1>
        <p className="mb-8 text-slate-600 dark:text-slate-300">
          Target a customer segment with a personalised email campaign
        </p>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-slate-900 dark:text-white"
              >
                Campaign Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-md border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="e.g. Summer Re-engagement"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-slate-900 dark:text-white"
              >
                Description
              </label>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="Optional description"
              />
            </div>

            {/* Segment */}
            <div>
              <label
                htmlFor="segmentId"
                className="mb-2 block text-sm font-medium text-slate-900 dark:text-white"
              >
                Target Segment *
              </label>
              {loadingSegments ? (
                <p className="text-sm text-slate-500">Loading segments…</p>
              ) : segments.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No segments found.{" "}
                  <Link
                    href="/segments/new"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Create one first
                  </Link>
                  .
                </p>
              ) : (
                <select
                  id="segmentId"
                  value={segmentId}
                  onChange={(e) => setSegmentId(e.target.value)}
                  required
                  data-testid="segment-select"
                  className="w-full rounded-md border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {segments.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {s.description ? ` — ${s.description}` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={
                isSubmitting || loadingSegments || segments.length === 0
              }
              data-testid="create-campaign"
              className="w-full rounded-md bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-slate-400 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {isSubmitting ? "Creating…" : "Create Campaign"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            <p className="font-medium">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
