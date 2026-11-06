import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase, CATEGORY_COLORS, type Expense } from '@/lib/supabase';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { DollarSign, CalendarDays, Receipt, TrendingUp, ArrowRight } from 'lucide-react';

type StatCard = {
  label: string;
  value: string;
  icon: typeof DollarSign;
  accent: 'purple' | 'teal';
};

export default function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setExpenses(data as Expense[]);
        setLoading(false);
      });
  }, []);

  const stats: StatCard[] = useMemo(() => {
    const totalSpent = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const now = new Date();
    const monthSpent = expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, e) => s + Number(e.amount), 0);
    return [
      { label: 'Total Spent', value: `$${totalSpent.toFixed(2)}`, icon: DollarSign, accent: 'purple' },
      { label: "This Month's Spend", value: `$${monthSpent.toFixed(2)}`, icon: CalendarDays, accent: 'teal' },
      { label: 'Total Entries', value: String(expenses.length), icon: Receipt, accent: 'purple' },
    ];
  }, [expenses]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => {
      map.set(e.category, (map.get(e.category) ?? 0) + Number(e.amount));
    });
    return Array.from(map, ([name, value]) => ({ name, value: Number(value.toFixed(2)) })).sort(
      (a, b) => b.value - a.value
    );
  }, [expenses]);

  const trendData = useMemo(() => {
    const now = new Date();
    const months: { label: string; key: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString('en-US', { month: 'short' }),
      });
    }
    return months.map((m) => {
      const total = expenses
        .filter((e) => {
          const d = new Date(e.date);
          return `${d.getFullYear()}-${d.getMonth()}` === m.key;
        })
        .reduce((s, e) => s + Number(e.amount), 0);
      return { month: m.label, spend: Number(total.toFixed(2)) };
    });
  }, [expenses]);

  const recent = expenses.slice(0, 8);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <Link
          to="/expenses/add"
          className="btn-primary text-sm flex items-center gap-2"
        >
          Add Expense
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">{label}</span>
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  accent === 'purple' ? 'bg-accent-purple/15 text-accent-purple' : 'bg-accent-teal/15 text-accent-teal'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Doughnut */}
        <div className="card p-5">
          <h2 className="text-sm font-medium text-gray-300 mb-4">Spend by Category</h2>
          {categoryData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {categoryData.map((entry) => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] ?? '#636e72'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#171a23',
                    border: '1px solid #262a36',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(v: number) => `$${v.toFixed(2)}`}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Line chart */}
        <div className="card p-5">
          <h2 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent-teal" />
            Spend Trend (Last 6 Months)
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262a36" vertical={false} />
              <XAxis dataKey="month" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: '#171a23',
                  border: '1px solid #262a36',
                  borderRadius: '8px',
                  color: '#fff',
                }}
                formatter={(v: number) => `$${v.toFixed(2)}`}
              />
              <Line
                type="monotone"
                dataKey="spend"
                stroke="#00d4a0"
                strokeWidth={2.5}
                dot={{ fill: '#00d4a0', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent expenses */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-300">Recent Expenses</h2>
          <Link
            to="/expenses"
            className="text-xs text-accent-teal hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">
            No expenses yet.{' '}
            <Link to="/expenses/add" className="text-accent-teal hover:underline">
              Add your first one
            </Link>
            .
          </p>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-border-subtle">
                  <th className="font-medium px-2 py-2">Title</th>
                  <th className="font-medium px-2 py-2">Category</th>
                  <th className="font-medium px-2 py-2">Date</th>
                  <th className="font-medium px-2 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((e) => (
                  <tr key={e.id} className="border-b border-border-subtle/50 last:border-0">
                    <td className="px-2 py-3 text-gray-200">{e.title}</td>
                    <td className="px-2 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 text-xs"
                        style={{ color: CATEGORY_COLORS[e.category] ?? '#636e72' }}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: CATEGORY_COLORS[e.category] ?? '#636e72' }}
                        />
                        {e.category}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-gray-400">
                      {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-2 py-3 text-right font-medium text-gray-200">
                      ${Number(e.amount).toFixed(2)}
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

function EmptyChart() {
  return (
    <div className="h-[260px] flex items-center justify-center text-sm text-gray-500">
      No data to display yet.
    </div>
  );
}
