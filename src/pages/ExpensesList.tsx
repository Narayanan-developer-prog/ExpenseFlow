import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, CATEGORIES, CATEGORY_COLORS, type Expense } from '@/lib/supabase';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

export default function ExpensesList() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setExpenses(data as Expense[]);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense? This cannot be undone.')) return;
    setDeletingId(id);
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    setDeletingId(null);
    if (!error) {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const filtered = expenses.filter((e) => {
    const matchesCategory = filter === 'all' || e.category === filter;
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Expenses</h1>
        <Link to="/expenses/add" className="btn-primary text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input-field sm:w-48 cursor-pointer"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-500 mb-2">
              {expenses.length === 0 ? 'No expenses yet.' : 'No matching expenses.'}
            </p>
            {expenses.length === 0 && (
              <Link to="/expenses/add" className="text-accent-teal hover:underline text-sm">
                Add your first expense
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-border-subtle bg-bg-card">
                  <th className="font-medium px-4 py-3">Title</th>
                  <th className="font-medium px-4 py-3">Category</th>
                  <th className="font-medium px-4 py-3 hidden sm:table-cell">Date</th>
                  <th className="font-medium px-4 py-3 hidden md:table-cell">Note</th>
                  <th className="font-medium px-4 py-3 text-right">Amount</th>
                  <th className="font-medium px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-border-subtle/50 last:border-0 hover:bg-bg-hover/40 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-200 font-medium">{e.title}</td>
                    <td className="px-4 py-3">
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
                    <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">
                      {new Date(e.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell max-w-[200px] truncate">
                      {e.note || '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-200">
                      ${Number(e.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/expenses/${e.id}/edit`}
                          className="p-2 rounded-lg text-gray-400 hover:text-accent-teal hover:bg-bg-hover transition-colors"
                          aria-label="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(e.id)}
                          disabled={deletingId === e.id}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-bg-hover transition-colors disabled:opacity-50"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
