"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface CustomerRef {
  id: string;
  email: string;
}

interface Draft {
  id: string;
  customerId: string;
  customer: CustomerRef;
  subject: string;
  body: string;
  recommendedSku: string | null;
  status: "generated" | "approved" | "rejected";
}

interface Send {
  id: string;
  customerId: string;
  customer: CustomerRef;
  status: "queued" | "sent" | "failed";
  sentAt: string | null;
  error: string | null;
}

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: "draft" | "drafted" | "sending" | "sent" | "failed";
  segment: { id: string; name: string };
  drafts: Draft[];
  sends: Send[];
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  drafted: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  sending:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  sent: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const DRAFT_STATUS_COLORS: Record<string, string> = {
  generated:
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  approved:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const loadCampaign = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns/${id}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to load campaign");
        return;
      }
      const data: Campaign = await res.json();
      setCampaign(data);
    } catch {
      setError("Network error. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCampaign();
  }, [loadCampaign]);

  async function handleGenerateDrafts() {
    setIsGenerating(true);
    setActionError(null);
    setActionMsg(null);

    try {
      const res = await fetch(`/api/campaigns/${id}/generate-drafts`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setActionError(data.error || "Failed to generate drafts");
        return;
      }

      setActionMsg(`Generated ${data.draftedCount} draft(s)`);
      await loadCampaign();
    } catch {
      setActionError("Network error. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleApproveDraft(draftId: string) {
    setActionError(null);
    setActionMsg(null);

    try {
      const res = await fetch(`/api/campaigns/${id}/drafts/${draftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      const data = await res.json();

      if (!res.ok) {
        setActionError(data.error || "Failed to approve draft");
        return;
      }

      setCampaign((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          drafts: prev.drafts.map((d) =>
            d.id === draftId ? { ...d, status: data.status } : d
          ),
        };
      });
    } catch {
      setActionError("Network error. Please try again.");
    }
  }

  async function handleRejectDraft(draftId: string) {
    setActionError(null);
    setActionMsg(null);

    try {
      const res = await fetch(`/api/campaigns/${id}/drafts/${draftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });
      const data = await res.json();

      if (!res.ok) {
        setActionError(data.error || "Failed to reject draft");
        return;
      }

      setCampaign((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          drafts: prev.drafts.map((d) =>
            d.id === draftId ? { ...d, status: data.status } : d
          ),
        };
      });
    } catch {
      setActionError("Network error. Please try again.");
    }
  }

  async function handleSend() {
    setIsSending(true);
    setActionError(null);
    setActionMsg(null);

    try {
      const res = await fetch(`/api/campaigns/${id}/send`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setActionError(data.error || "Failed to send campaign");
        return;
      }

      setActionMsg(`Sent to ${data.sentCount} customer(s)`);
      await loadCampaign();
    } catch {
      setActionError("Network error. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        <p className="text-slate-500 dark:text-slate-400">Loading…</p>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        <div className="text-center">
          <p className="mb-4 text-red-600 dark:text-red-400">
            {error || "Campaign not found"}
          </p>
          <Link
            href="/campaigns"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            &larr; Back to Campaigns
          </Link>
        </div>
      </div>
    );
  }

  const approvedCount = campaign.drafts.filter(
    (d) => d.status === "approved"
  ).length;
  const canSend =
    approvedCount > 0 &&
    campaign.status !== "sent" &&
    campaign.status !== "sending";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-16">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/campaigns"
            className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            &larr; Back to Campaigns
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                {campaign.name}
              </h1>
              <span
                data-testid="campaign-status"
                className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[campaign.status] ?? ""}`}
              >
                {campaign.status}
              </span>
            </div>
            {campaign.description && (
              <p className="mb-1 text-slate-600 dark:text-slate-300">
                {campaign.description}
              </p>
            )}
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Segment:{" "}
              <Link
                href={`/segments/${campaign.segment.id}`}
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                {campaign.segment.name}
              </Link>
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleGenerateDrafts}
              disabled={isGenerating}
              data-testid="generate-drafts"
              className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:bg-slate-400 dark:bg-purple-500 dark:hover:bg-purple-600"
            >
              {isGenerating ? "Generating…" : "Generate Drafts"}
            </button>

            {canSend && (
              <button
                onClick={handleSend}
                disabled={isSending}
                data-testid="send-approved"
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:bg-slate-400 dark:bg-green-500 dark:hover:bg-green-600"
              >
                {isSending ? "Sending…" : `Send Approved (${approvedCount})`}
              </button>
            )}
          </div>
        </div>

        {/* Action feedback */}
        {actionMsg && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
            <p className="font-medium">{actionMsg}</p>
          </div>
        )}
        {actionError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            <p className="font-medium">{actionError}</p>
          </div>
        )}

        {/* Drafts */}
        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-white">
            Email Drafts ({campaign.drafts.length})
          </h2>

          {campaign.drafts.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-slate-500 dark:text-slate-400">
                No drafts yet. Click &ldquo;Generate Drafts&rdquo; to create
                personalised emails for each customer in the segment.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {campaign.drafts.map((draft) => (
                <div
                  key={draft.id}
                  data-testid="draft-row"
                  className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        To: {draft.customer.email}
                        {draft.recommendedSku && (
                          <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            SKU: {draft.recommendedSku}
                          </span>
                        )}
                      </p>
                      <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                        {draft.subject}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${DRAFT_STATUS_COLORS[draft.status] ?? ""}`}
                      >
                        {draft.status}
                      </span>

                      {draft.status === "generated" && (
                        <>
                          <button
                            onClick={() => handleApproveDraft(draft.id)}
                            data-testid="approve-draft"
                            className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectDraft(draft.id)}
                            className="rounded-md bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <pre className="whitespace-pre-wrap rounded-md bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {draft.body}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Sends */}
        {campaign.sends.length > 0 && (
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-white">
              Send Results ({campaign.sends.length})
            </h2>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full">
                <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                      Sent At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {campaign.sends.map((send) => (
                    <tr key={send.id}>
                      <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                        {send.customer.email}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            send.status === "sent"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                              : send.status === "failed"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {send.status}
                        </span>
                        {send.error && (
                          <span className="ml-2 text-xs text-red-600 dark:text-red-400">
                            {send.error}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {send.sentAt
                          ? new Date(send.sentAt).toLocaleString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
