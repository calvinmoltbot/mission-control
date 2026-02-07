'use client';

import { useEffect, useState } from 'react';
import { Coins, RefreshCw, AlertTriangle } from 'lucide-react';

interface Balance {
  available_balance: number;
  cash_balance: number;
  voucher_balance: number;
}

export function MoonshotWidget() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/moonshot');
      const data = await res.json();
      if (data.error && !data.available_balance) {
        setError('Failed to fetch balance');
      } else {
        setBalance({
          available_balance: data.available_balance,
          cash_balance: data.cash_balance,
          voucher_balance: data.voucher_balance,
        });
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch balance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 300000);
    return () => clearInterval(interval);
  }, []);

  const isLow = balance && balance.available_balance < 1.0;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Coins className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Moonshot Balance</h3>
            <p className="text-xs text-zinc-500">API Credits</p>
          </div>
        </div>
        <button
          onClick={fetchBalance}
          disabled={loading}
          className="p-2 hover:bg-white/[0.06] rounded-lg transition-all duration-200 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-zinc-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && !balance && (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin"></div>
        </div>
      )}

      {error && !balance && (
        <div className="flex items-center gap-2 text-red-400 text-sm py-4">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {balance && (
        <div className="space-y-4">
          <div className="text-center">
            <p className={`text-4xl font-bold tracking-tight ${isLow ? 'text-red-400' : 'text-white'}`}>
              ${balance.available_balance.toFixed(2)}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Available Balance</p>
          </div>

          {isLow && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              Low balance — please recharge
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/[0.06]">
            <div className="text-center">
              <p className="text-lg font-semibold text-zinc-200">${balance.cash_balance.toFixed(2)}</p>
              <p className="text-[11px] text-zinc-600">Cash</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-zinc-200">${balance.voucher_balance.toFixed(2)}</p>
              <p className="text-[11px] text-zinc-600">Voucher</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
