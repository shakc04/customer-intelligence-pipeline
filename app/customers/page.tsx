import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getCustomers() {
  const customers = await prisma.customer.findMany({
    include: {
      _count: {
        select: { events: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return customers;
}

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Customers
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              {customers.length} customer{customers.length !== 1 ? "s" : ""}{" "}
              tracked
            </p>
          </div>
          <Link
            href="/ingest"
            className="rounded-md bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Ingest Event
          </Link>
        </div>

        {customers.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="mb-4 text-slate-600 dark:text-slate-300">
              No customers found. Start by ingesting your first event!
            </p>
            <Link
              href="/ingest"
              className="inline-block text-blue-600 hover:underline dark:text-blue-400"
            >
              Ingest an event →
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                    Events
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                    Created
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900 dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-5 text-sm text-slate-900 dark:text-slate-300">
                      {customer.email}
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400">
                      {customer._count.events} event
                      {customer._count.events !== 1 ? "s" : ""}
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-300">
                      {new Date(customer.createdAt).toLocaleDateString(
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
                        href={`/customers/${customer.id}`}
                        className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        View Timeline →
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
