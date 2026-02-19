"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Segment {
  id: string;
  name: string;
  description: string | null;
  definition: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface PreviewData {
  count: number;
  customers: { id: string; email: string }[];
}

export default function SegmentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [segment, setSegment] = useState<Segment | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSegment() {
      try {
        const res = await fetch(`/api/segments/${id}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Segment not found");
          return;
        }

        setSegment(data.segment);
      } catch {
        setError("Failed to load segment");
      } finally {
        setLoading(false);
      }
    }
    loadSegment();
  }, [id]);

  const handlePreview = useCallback(async () => {
    setPreviewLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/segments/${id}/preview`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Preview failed");
        return;
      }

      setPreview(data);
    } catch {
      setError("Network error during preview");
    } finally {
      setPreviewLoading(false);
    }
  }, [id]);

  // Auto-preview on load
  useEffect(() => {
    if (!loading && segment) {
      handlePreview();
    }
  }, [loading, segment, handlePreview]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        <p className="text-slate-600 dark:text-slate-300">Loading segment...</p>
      </div>
    );
  }

  if (!segment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        <div className="text-center">
          <p className="mb-4 text-slate-600 dark:text-slate-300">
            {error || "Segment not found"}
          </p>
          <Link
            href="/segments"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            Back to Segments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-8">
          <Link
            href="/segments"
            className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            &larr; Back to Segments
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {segment.name}
          </h1>
          {segment.description && (
            <p className="text-slate-600 dark:text-slate-300">
              {segment.description}
            </p>
          )}
        </div>

        {/* Definition */}
        <div className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">
            Definition
          </h2>
          <div className="overflow-x-auto rounded-md bg-slate-50 p-4 dark:bg-slate-800">
            <pre className="text-xs text-slate-800 dark:text-slate-200">
              {JSON.stringify(segment.definition, null, 2)}
            </pre>
          </div>
        </div>

        {/* Preview Section */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Preview
            </h2>
            <button
              onClick={handlePreview}
              disabled={previewLoading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-slate-400 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {previewLoading ? "Loading..." : "Refresh Preview"}
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              <p className="font-medium">{error}</p>
            </div>
          )}

          {preview && (
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {preview.count}
                  </span>{" "}
                  matching customer{preview.count !== 1 ? "s" : ""}
                  {preview.count > 50 && " (showing first 50)"}
                </p>
              </div>

              {preview.customers.length === 0 ? (
                <div className="p-8 text-center text-slate-600 dark:text-slate-300">
                  No customers match this segment.
                </div>
              ) : (
                <table className="w-full">
                  <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                        Email
                      </th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {preview.customers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-300">
                          {customer.email}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/customers/${customer.id}`}
                            className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                          >
                            View Timeline &rarr;
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
