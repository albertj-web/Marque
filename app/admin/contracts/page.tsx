'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Loan, Customer, Vehicle } from '@/lib/types';
import { formatKES, formatDate } from '@/lib/format';
import Link from 'next/link';
import { FileText, ArrowRight } from 'lucide-react';

interface LoanRow extends Loan {
  customer: Pick<Customer, 'name'> | null;
  vehicle: Pick<Vehicle, 'make' | 'model' | 'year'> | null;
}

export default function ContractsListPage() {
  const [loans, setLoans] = useState<LoanRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLoans = useCallback(async () => {
    const { data } = await supabase
      .from('loans')
      .select('*, customer:customers(name), vehicle:vehicles(make, model, year)')
      .order('created_at', { ascending: false });
    setLoans((data as LoanRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brass border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Contracts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate and print vehicle sale agreements for each loan
        </p>
      </div>

      {loans.length > 0 ? (
        <div className="space-y-3">
          {loans.map((loan) => (
            <Link
              key={loan.id}
              href={`/admin/contracts/${loan.id}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 hover:border-brass/40 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="text-muted-foreground shrink-0" size={20} />
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {loan.customer?.name || 'Unknown'} —{' '}
                    {loan.vehicle ? `${loan.vehicle.make} ${loan.vehicle.model} ${loan.vehicle.year || ''}` : 'No vehicle'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Contract date: {formatDate(loan.contract_date || loan.created_at)} · {formatKES(loan.vehicle_price)}
                  </p>
                </div>
              </div>
              <ArrowRight className="text-brass shrink-0" size={18} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 py-20 text-center">
          <FileText className="mx-auto text-muted-foreground" size={32} />
          <p className="mt-4 text-muted-foreground">
            No contracts yet. Create a loan first to generate a contract.
          </p>
          <Link href="/admin/loans" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brass hover:underline">
            Go to Loans <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
