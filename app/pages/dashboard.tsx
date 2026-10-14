import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconCreditCard,
  IconReceipt,
  IconTransfer,
  IconUsers,
} from "@tabler/icons-react";

import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { BarChart } from "~/components/charts/bar-chart";
import { DonutChart } from "~/components/charts/donut-chart";

/* ─── KPI Data ─── */

const kpis = [
  {
    title: "Total Revenue",
    value: "$45,231.89",
    change: "+20.1%",
    trend: "up" as const,
    icon: IconCreditCard,
  },
  {
    title: "Transactions",
    value: "2,350",
    change: "+18.2%",
    trend: "up" as const,
    icon: IconTransfer,
  },
  {
    title: "Outstanding Invoices",
    value: "$12,234.00",
    change: "-4.5%",
    trend: "down" as const,
    icon: IconReceipt,
  },
  {
    title: "Active Customers",
    value: "573",
    change: "+12.3%",
    trend: "up" as const,
    icon: IconUsers,
  },
];

/* ─── Chart Data ─── */

const revenueData = {
  categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
  series: [
    {
      name: "Revenue",
      data: [4200, 3800, 5100, 4600, 5800, 6200, 5900, 7100],
    },
  ],
};

const expensesData = {
  items: [
    { name: "Payroll", value: 42 },
    { name: "Operations", value: 28 },
    { name: "Marketing", value: 16 },
    { name: "Software", value: 9 },
    { name: "Other", value: 5 },
  ],
};

/* ─── Recent Transactions ─── */

const recentTransactions = [
  { id: "TXN-001", customer: "Acme Corp", amount: "$1,250.00", status: "Completed", date: "Feb 15, 2026" },
  { id: "TXN-002", customer: "Globex Inc", amount: "$3,420.00", status: "Pending", date: "Feb 14, 2026" },
  { id: "TXN-003", customer: "Initech LLC", amount: "$890.50", status: "Completed", date: "Feb 14, 2026" },
  { id: "TXN-004", customer: "Umbrella Co", amount: "$2,100.00", status: "Failed", date: "Feb 13, 2026" },
  { id: "TXN-005", customer: "Stark Industries", amount: "$5,670.00", status: "Completed", date: "Feb 13, 2026" },
  { id: "TXN-006", customer: "Wayne Enterprises", amount: "$4,320.00", status: "Pending", date: "Feb 12, 2026" },
];

/* ─── Components ─── */

function KpiCard({ title, value, change, trend, icon: Icon }: (typeof kpis)[number]) {
  return (
    <Card>
      <CardContent className="copa:pt-6">
        <div className="copa:flex copa:items-center copa:justify-between">
          <div className="copa:flex copa:flex-col copa:gap-1">
            <span className="copa:text-xs copa:font-medium copa:text-muted-foreground copa:uppercase copa:tracking-wide">
              {title}
            </span>
            <span className="copa:text-2xl copa:font-bold">{value}</span>
            <div className="copa:flex copa:items-center copa:gap-1 copa:text-xs">
              {trend === "up" ? (
                <IconArrowUpRight className="copa:size-3.5 copa:text-green-600" />
              ) : (
                <IconArrowDownRight className="copa:size-3.5 copa:text-red-500" />
              )}
              <span className={trend === "up" ? "copa:text-green-600" : "copa:text-red-500"}>
                {change}
              </span>
              <span className="copa:text-muted-foreground">vs last month</span>
            </div>
          </div>
          <div className="copa:flex copa:size-10 copa:items-center copa:justify-center copa:rounded-lg copa:bg-primary/10">
            <Icon className="copa:size-5 copa:text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Completed: "copa:bg-green-100 copa:text-green-700",
    Pending: "copa:bg-amber-100 copa:text-amber-700",
    Failed: "copa:bg-red-100 copa:text-red-700",
  };

  return (
    <span className={`copa:inline-flex copa:items-center copa:rounded-full copa:px-2 copa:py-0.5 copa:text-xs copa:font-medium ${styles[status] ?? "copa:bg-muted copa:text-muted-foreground"}`}>
      {status}
    </span>
  );
}

function TransactionsTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Latest payment activity across your workspace.</CardDescription>
      </CardHeader>
      <CardContent className="copa:p-0">
        <div className="copa:overflow-auto">
          <table className="copa:w-full copa:text-sm">
            <thead>
              <tr className="copa:border-b copa:border-border">
                <th className="copa:px-6 copa:py-3 copa:text-left copa:text-xs copa:font-medium copa:text-muted-foreground copa:uppercase copa:tracking-wide">
                  ID
                </th>
                <th className="copa:px-6 copa:py-3 copa:text-left copa:text-xs copa:font-medium copa:text-muted-foreground copa:uppercase copa:tracking-wide">
                  Customer
                </th>
                <th className="copa:px-6 copa:py-3 copa:text-right copa:text-xs copa:font-medium copa:text-muted-foreground copa:uppercase copa:tracking-wide">
                  Amount
                </th>
                <th className="copa:px-6 copa:py-3 copa:text-left copa:text-xs copa:font-medium copa:text-muted-foreground copa:uppercase copa:tracking-wide">
                  Status
                </th>
                <th className="copa:px-6 copa:py-3 copa:text-left copa:text-xs copa:font-medium copa:text-muted-foreground copa:uppercase copa:tracking-wide">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((txn) => (
                <tr
                  key={txn.id}
                  className="copa:border-b copa:border-border/50 last:copa:border-0 copa:hover:bg-muted/50 copa:transition-colors"
                >
                  <td className="copa:px-6 copa:py-3 copa:font-medium">{txn.id}</td>
                  <td className="copa:px-6 copa:py-3">{txn.customer}</td>
                  <td className="copa:px-6 copa:py-3 copa:text-right copa:font-medium">{txn.amount}</td>
                  <td className="copa:px-6 copa:py-3">
                    <StatusBadge status={txn.status} />
                  </td>
                  <td className="copa:px-6 copa:py-3 copa:text-muted-foreground">{txn.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Page ─── */

export default function Dashboard() {
  return (
    <>
      <div className="copa:flex copa:items-center copa:justify-between">
        <h1 className="copa:text-2xl copa:font-semibold">Dashboard</h1>
        <Button
          onClick={() =>
            toast.success("Event has been created", {
              description: "Sunday, February 17, 2026 at 5:30 PM",
            })
          }
        >
          Show Toast
        </Button>
      </div>

      <div className="copa:grid copa:gap-4 copa:sm:grid-cols-2 copa:lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} {...kpi} />
        ))}
      </div>

      <div className="copa:grid copa:gap-4 copa:lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <CardDescription>Revenue trend over the last 8 months.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={revenueData}
              height={280}
              formatValue={(v) => `$${(v / 1000).toFixed(1)}K`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses Breakdown</CardTitle>
            <CardDescription>Spending distribution by category.</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={expensesData}
              height={280}
              centerText="100%"
              centerSubText="Total"
              showLabels={false}
            />
          </CardContent>
        </Card>
      </div>

      <TransactionsTable />
    </>
  );
}
