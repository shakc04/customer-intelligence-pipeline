import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getCampaigns() {
  return prisma.campaign.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      updatedAt: true,
      segment: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  drafted: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  sending:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  sent: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

export default async function CampaignsPage() {
  const campaigns = await getCampaigns();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            &larr; Back to Home
          </Link>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Campaigns
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href="/campaigns/new"
            className="rounded-md bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            New Campaign
          </Link>
        </div>

        {campaigns.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="mb-4 text-slate-600 dark:text-slate-300">
              No campaigns yet. Create your first campaign to start sending
              emails.
            </p>
            <Link
              href="/campaigns/new"
              className="inline-block text-blue-600 hover:underline dark:text-blue-400"
            >
              Create a campaign &rarr;
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                    Segment
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                    Updated
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900 dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {campaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-5 text-sm font-medium text-slate-900 dark:text-white">
                      {campaign.name}
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400">
                      {campaign.segment.name}
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[campaign.status] ?? ""}`}
                      >
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-300">
                      {new Date(campaign.updatedAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Link
                        href={`/campaigns/${campaign.id}`}
                        className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        View &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
