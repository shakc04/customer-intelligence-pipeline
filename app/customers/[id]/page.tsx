import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getCustomerWithEvents(id: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        events: {
          orderBy: {
            occurredAt: "desc",
          },
        },
      },
    });

    return customer;
  } catch {
    return null;
  }
}

export default async function CustomerTimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomerWithEvents(id);

  if (!customer) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-8">
          <Link
            href="/customers"
            className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            ← Back to Customers
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {customer.email}
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            {customer.events.length} event{customer.events.length !== 1 ? "s" : ""} tracked
          </p>
        </div>

        {customer.events.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="mb-4 text-slate-600 dark:text-slate-300">
              No events found for this customer.
            </p>
            <Link
              href="/ingest"
              className="inline-block text-blue-600 hover:underline dark:text-blue-400"
            >
              Ingest an event →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Event Timeline
            </h2>
            <div className="space-y-4">
              {customer.events.map((event) => (
                <div
                  key={event.id}
                  className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {event.type}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {new Date(event.occurredAt).toLocaleString()}
                      </p>
                    </div>
                    {event.idempotencyKey && (
                      <span
                        data-testid="idempotency-badge"
                        className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      >
                        Idempotent
                      </span>
                    )}
                  </div>

                  {/* Properties */}
                  {event.properties &&
                    typeof event.properties === "object" &&
                    Object.keys(event.properties).length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                          Properties:
                        </p>
                        <div className="overflow-x-auto rounded-md bg-slate-50 p-4 dark:bg-slate-800">
                          <pre className="text-xs text-slate-800 dark:text-slate-200">
                            {JSON.stringify(event.properties, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                  {/* Metadata */}
                  <div className="mt-4 flex gap-4 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <div>
                      <span className="font-medium">Event ID:</span>{" "}
                      <span className="font-mono">{event.id}</span>
                    </div>
                    {event.idempotencyKey && (
                      <div>
                        <span className="font-medium">Idempotency Key:</span>{" "}
                        <span className="font-mono">{event.idempotencyKey}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/ingest"
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            Ingest another event →
          </Link>
        </div>
      </div>
    </div>
  );
}
