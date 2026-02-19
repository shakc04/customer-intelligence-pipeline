"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const RULE_KINDS = [
  {
    value: "event_type_in_last_days",
    label: "Event type in last N days",
  },
  {
    value: "event_property_equals",
    label: "Event property equals value",
  },
  {
    value: "event_count_gte_in_last_days",
    label: "Event count >= N in last days",
  },
] as const;

type RuleKind = (typeof RULE_KINDS)[number]["value"];

export default function NewSegmentPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ruleKind, setRuleKind] = useState<RuleKind>("event_type_in_last_days");
  const [eventType, setEventType] = useState("");
  const [days, setDays] = useState("30");
  const [propertyPath, setPropertyPath] = useState("");
  const [propertyValue, setPropertyValue] = useState("");
  const [minCount, setMinCount] = useState("3");

  const [smartPrompt, setSmartPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const [editJson, setEditJson] = useState(false);
  const [jsonText, setJsonText] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function buildDefinition() {
    const d = parseInt(days, 10) || 30;
    switch (ruleKind) {
      case "event_type_in_last_days":
        return { kind: ruleKind, eventType, days: d };
      case "event_property_equals":
        return {
          kind: ruleKind,
          eventType,
          path: propertyPath,
          value: propertyValue,
          days: d,
        };
      case "event_count_gte_in_last_days":
        return {
          kind: ruleKind,
          eventType,
          days: d,
          minCount: parseInt(minCount, 10) || 3,
        };
    }
  }

  function getDefinitionJson() {
    if (editJson) return jsonText;
    return JSON.stringify(buildDefinition(), null, 2);
  }

  function applyDefinitionToForm(def: Record<string, unknown>) {
    if (typeof def.kind === "string") {
      const k = def.kind as RuleKind;
      if (RULE_KINDS.some((r) => r.value === k)) {
        setRuleKind(k);
      }
    }
    if (typeof def.eventType === "string") setEventType(def.eventType);
    if (typeof def.days === "number") setDays(String(def.days));
    if (typeof def.path === "string") setPropertyPath(def.path);
    if (typeof def.value === "string") setPropertyValue(def.value);
    if (typeof def.minCount === "number") setMinCount(String(def.minCount));
  }

  async function handleSmartGenerate() {
    if (!smartPrompt.trim()) return;
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/smart-generate/segment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: smartPrompt }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Smart Generate failed");
        return;
      }

      applyDefinitionToForm(data.definition);
      setEditJson(false);
    } catch {
      setError("Network error during Smart Generate");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let definition;
      if (editJson) {
        try {
          definition = JSON.parse(jsonText);
        } catch {
          setError("Invalid JSON in definition");
          setIsSubmitting(false);
          return;
        }
      } else {
        definition = buildDefinition();
      }

      const res = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, definition }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create segment");
        return;
      }

      router.push(`/segments/${data.segmentId}`);
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
            href="/segments"
            className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            &larr; Back to Segments
          </Link>
        </div>

        <h1 className="mb-2 text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          New Segment
        </h1>
        <p className="mb-8 text-slate-600 dark:text-slate-300">
          Define a customer segment based on event rules
        </p>

        {/* Smart Generate */}
        <div className="mb-6 rounded-lg border border-purple-200 bg-purple-50 p-6 dark:border-purple-800 dark:bg-purple-900/20">
          <label className="mb-2 block text-sm font-medium text-purple-900 dark:text-purple-200">
            Smart Generate (optional)
          </label>
          <p className="mb-3 text-xs text-purple-700 dark:text-purple-300">
            Describe your segment in plain English and we&apos;ll fill the form
            for you.
          </p>
          <textarea
            value={smartPrompt}
            onChange={(e) => setSmartPrompt(e.target.value)}
            rows={2}
            className="mb-3 w-full rounded-md border border-purple-300 px-4 py-2 text-sm text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-purple-700 dark:bg-slate-800 dark:text-white"
            placeholder='e.g. "Users who added to cart in the last 7 days"'
          />
          <button
            type="button"
            onClick={handleSmartGenerate}
            disabled={isGenerating || !smartPrompt.trim()}
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:bg-slate-400 dark:bg-purple-500 dark:hover:bg-purple-600"
          >
            {isGenerating ? "Generating..." : "Smart Generate"}
          </button>
        </div>

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
                Segment Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-md border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="e.g. Active Cart Users"
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

            {/* Rule Type */}
            <div>
              <label
                htmlFor="ruleKind"
                className="mb-2 block text-sm font-medium text-slate-900 dark:text-white"
              >
                Rule Type *
              </label>
              <select
                id="ruleKind"
                value={ruleKind}
                onChange={(e) => setRuleKind(e.target.value as RuleKind)}
                className="w-full rounded-md border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {RULE_KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
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
                placeholder="e.g. added_to_cart, page_view, purchase"
              />
            </div>

            {/* Days */}
            <div>
              <label
                htmlFor="days"
                className="mb-2 block text-sm font-medium text-slate-900 dark:text-white"
              >
                Days (lookback window) *
              </label>
              <input
                type="number"
                id="days"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                min="1"
                required
                className="w-full rounded-md border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Property Path (conditional) */}
            {ruleKind === "event_property_equals" && (
              <>
                <div>
                  <label
                    htmlFor="propertyPath"
                    className="mb-2 block text-sm font-medium text-slate-900 dark:text-white"
                  >
                    Property Path *
                  </label>
                  <input
                    type="text"
                    id="propertyPath"
                    value={propertyPath}
                    onChange={(e) => setPropertyPath(e.target.value)}
                    required
                    className="w-full rounded-md border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    placeholder="e.g. path, plan, category"
                  />
                </div>
                <div>
                  <label
                    htmlFor="propertyValue"
                    className="mb-2 block text-sm font-medium text-slate-900 dark:text-white"
                  >
                    Property Value *
                  </label>
                  <input
                    type="text"
                    id="propertyValue"
                    value={propertyValue}
                    onChange={(e) => setPropertyValue(e.target.value)}
                    required
                    className="w-full rounded-md border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    placeholder="e.g. /pricing, enterprise"
                  />
                </div>
              </>
            )}

            {/* Min Count (conditional) */}
            {ruleKind === "event_count_gte_in_last_days" && (
              <div>
                <label
                  htmlFor="minCount"
                  className="mb-2 block text-sm font-medium text-slate-900 dark:text-white"
                >
                  Minimum Count *
                </label>
                <input
                  type="number"
                  id="minCount"
                  value={minCount}
                  onChange={(e) => setMinCount(e.target.value)}
                  min="1"
                  required
                  className="w-full rounded-md border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            )}

            {/* JSON Preview / Edit */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-slate-900 dark:text-white">
                  Definition JSON
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (!editJson) {
                      setJsonText(JSON.stringify(buildDefinition(), null, 2));
                    }
                    setEditJson(!editJson);
                  }}
                  className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                >
                  {editJson ? "Use Form" : "Edit JSON"}
                </button>
              </div>
              {editJson ? (
                <textarea
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  rows={8}
                  className="w-full rounded-md border border-slate-300 px-4 py-2 font-mono text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              ) : (
                <pre className="overflow-x-auto rounded-md bg-slate-50 p-4 text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                  {getDefinitionJson()}
                </pre>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-slate-400 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {isSubmitting ? "Creating..." : "Create Segment"}
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
