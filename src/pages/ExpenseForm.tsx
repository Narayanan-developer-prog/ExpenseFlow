
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase, CATEGORIES, type Expense } from '@/lib/supabase';
import { ArrowLeft, AlertCircle } from 'lucide-react';

type Mode = 'add' | 'edit';

export default function ExpenseForm() {
  const { id } = useParams<{ id: string }>();
  const mode: Mode = id ? 'edit' : 'add';
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>('Food');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(mode === 'edit');

  useEffect(() => {
    if (mode !== 'edit' || !id) return;

    supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          setError('Expense not found.');
          setLoading(false);
          return;
        }

        const expense = data as Expense;

        setTitle(expense.title);
        setAmount(String(expense.amount));
        setCategory(expense.category);
        setDate(expense.date);
        setNote(expense.note ?? '');
        setLoading(false);
      });
  }, [mode, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amountNum = Number(amount);

    if (amount.trim() === '' || !Number.isFinite(amountNum) || amountNum < 0) {
      setError('Please enter a valid amount.');
      return;
    }

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    if (!date) {
      setError('Date is required.');
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError('Please log in again before saving an expense.');
        return;
      }

      const payload = {
        title: title.trim(),
        amount: amountNum,
        category,
        date,
        note: note.trim() || null,
      };

      if (mode === 'add') {
        const { error: insertError } = await supabase
          .from('expenses')
          .insert({
            ...payload,
            user_id: user.id,
          });

        if (insertError) {
          setError(insertError.message);
          return;
        }

        // Send a confirmation email only after the expense is saved.
        try {
          const { error: emailError } =
            await supabase.functions.invoke(
              'send-expenseflow-email',
              {
                body: {
                  type: 'expense',
                  expense: payload,
                },
              }
            );

          if (emailError) {
            console.error('Expense email failed:', emailError);
          }
        } catch (emailError) {
          console.error('Could not request expense email:', emailError);
        }
      } else {
        const { data: updatedExpenses, error: updateError } =
          await supabase
            .from('expenses')
            .update(payload)
            .eq('id', id!)
            .eq('user_id', user.id)
            .select('id');

        if (updateError) {
          setError(updateError.message);
          return;
        }

        if (!updatedExpenses || updatedExpenses.length === 0) {
          setError('Expense could not be updated. Please check your access.');
          return;
        }
      }

      navigate('/expenses', { replace: true });
    } catch (err) {
      console.error('Expense save failed:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-bg-hover transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1 className="text-2xl font-bold text-white">
          {mode === 'add' ? 'Add Expense' : 'Edit Expense'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">
            Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Lunch at café"
            className="input-field"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">
              Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">
              Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-field cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">
            Note <span className="text-gray-600">(optional)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note…"
            rows={3}
            className="input-field resize-none"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex-1"
          >
            {saving
              ? 'Saving…'
              : mode === 'add'
                ? 'Add Expense'
                : 'Save Changes'}
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-ghost border border-border-subtle"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
