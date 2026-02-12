"use client";

import { useState } from "react";
import Link from "next/link";

export default function IngestPage() {
  const [email, setEmail] = useState("");
  const [eventType, setEventType] = useState("");
  const [properties, setProperties] = useState("{}");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    customerId?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      // Parse properties JSON
      let parsedProperties;
      try {
        parsedProperties = JSON.parse(properties);
      } catch {
        setResult({
          success: false,
          message: "Invalid JSON in properties field",
        });
        setIsSubmitting(false);
        return;
      }

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (idempotencyKey.trim()) {
        headers["Idempotency-Key"] = idempotencyKey.trim();
      }

      const response = await fetch("/api/events", {
        method: "POST",
        headers,
        body: JSON.stringify({
          email,
          type: eventType,
          properties: parsedProperties,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.created
            ? `Event created successfully! Event ID: ${data.eventId}`
            : `Event already exists (idempotency). Event ID: ${data.eventId}`,
          customerId: data.customerId,
        });
        // Reset form on success
        setEmail("");
        setEventType("");
        setProperties("{}");
        setIdempotencyKey("");
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to create event",
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: "Network error. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            ← Back to Home
          </Link>
        </div>

        <h1 className="mb-2 text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          Ingest Event
        </h1>
        <p className="mb-8 text-slate-600 dark:text-slate-300">
          Manually submit an event to track customer behavior
        </p>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="space-y-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-900 dark:text-white"
              >
                Customer Email *
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-md border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="user@example.com"
              />
            </div>

            {/* Event Type */}
            <div>
              <label
                htmlFor="eventType"
                className="mb-2 block text-sm font-medium text-slate-900 dark:text-white"
              >
                Event Type *
              </label>
              <input
                type="text"
                id="eventType"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                required
                className="w-full rounded-md border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="page_view, add_to_cart, purchase, etc."
              />
            </div>

            {/* Properties */}
            <div>
              <label
                htmlFor="properties"
                className="mb-2 block text-sm font-medium text-slate-900 dark:text-white"
              >
                Properties (JSON)
              </label>
              <textarea
                id="properties"
                value={properties}
                onChange={(e) => setProperties(e.target.value)}
                rows={6}
                className="w-full rounded-md border border-slate-300 px-4 py-2 font-mono text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder='{"page": "/home", "referrer": "google"}'
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Must be valid JSON object
              </p>
            </div>

            {/* Idempotency Key */}
            <div>
              <label
                htmlFor="idempotencyKey"
                className="mb-2 block text-sm font-medium text-slate-900 dark:text-white"
              >
                Idempotency Key (optional)
              </label>
              <input
                type="text"
                id="idempotencyKey"
                value={idempotencyKey}
                onChange={(e) => setIdempotencyKey(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="unique-key-123"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Prevents duplicate events with the same key for the same
                customer
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-slate-400 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {isSubmitting ? "Submitting..." : "Submit Event"}
            </button>
          </div>
        </form>

        {/* Result Message */}
        {result && (
          <div
            className={`mt-6 rounded-lg border p-4 ${
              result.success
                ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300"
                : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
            }`}
          >
            <p className="font-medium">{result.message}</p>
            {result.success && result.customerId && (
              <Link
                href={`/customers/${result.customerId}`}
                className="mt-2 inline-block text-sm underline hover:no-underline"
              >
                View customer timeline →
              </Link>
            )}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/customers"
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            View all customers →
          </Link>
        </div>
      </div>
    </div>
  );
}
