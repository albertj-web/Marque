'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loan, Customer, Vehicle, BalanceItem } from '@/lib/types';
import { formatKES, formatDateLong, priceToWords } from '@/lib/format';
import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';

interface LoanData extends Loan {
  customer: Customer | null;
  vehicle: Vehicle | null;
  balance_items: BalanceItem[];
}

export default function ContractPage({ params }: { params: { id: string } }) {
  const [loan, setLoan] = useState<LoanData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    supabase
      .from('loans')
      .select('*, customer:customers(*), vehicle:vehicles(*), balance_items:balance_items(*)')
      .eq('id', params.id)
      .maybeSingle()
      .then(({ data }) => {
        setLoan(data as LoanData | null);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brass border-t-transparent" />
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Loan not found.</p>
        <Link href="/admin/loans" className="text-brass text-sm mt-2 inline-block">Back to loans</Link>
      </div>
    );
  }

  const customer = loan.customer;
  const vehicle = loan.vehicle;
  const contractDate = loan.contract_date || loan.created_at;

  const terms = [
    'The Seller agrees to sell and the Buyer agrees to purchase the above-described motor vehicle in the condition stated, free of all encumbrances and third-party claims.',
    'The Purchase Price shall be paid as follows: a deposit of the amount stated above shall be paid upon signing of this Agreement, and the Balance shall be paid in accordance with the itemized balance breakdown set out above.',
    'The Seller warrants that the Seller is the legal owner of the vehicle and has full authority to sell it, and that all information provided about the vehicle is true and accurate to the best of the Seller\'s knowledge.',
    'The vehicle is sold "as is, where is" and the Buyer acknowledges that they have inspected the vehicle and are satisfied with its condition, except for any express warranties stated herein.',
    'Risk in the vehicle shall pass to the Buyer upon delivery of the vehicle. Title shall pass to the Buyer upon receipt of the full Purchase Price.',
    'The Buyer shall be responsible for all costs of transfer of ownership, registration, insurance, and any applicable taxes or duties from the date of delivery.',
    'If the Buyer defaults in payment of any instalment when due, the Seller shall have the right to repossess the vehicle and retain all payments made as liquidated damages, without prejudice to any other remedies available to the Seller.',
    'This Agreement constitutes the entire agreement between the parties and may only be varied in writing signed by both parties. It shall be governed by the laws of the Republic of Kenya.',
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between no-print">
        <Link
          href="/admin/loans"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Back to Loans
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-md bg-brass px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
        >
          <Printer size={16} />
          Print Contract
        </button>
      </div>

      {/* Contract document */}
      <div className="print-page mx-auto max-w-[800px] bg-white text-black p-8 sm:p-12 print:p-6 rounded-lg border border-border shadow-sm print:border-0 print:shadow-none print:text-[11px] print:leading-snug">
        {/* Letterhead */}
        <div className="border-b-2 border-black pb-6 mb-8 print:pb-2 print:mb-3">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold tracking-tight print:text-xl">MARQUE</h1>
              <p className="text-xs mt-1 text-gray-600">Luxury Automotive Marketplace</p>
            </div>
            <div className="text-right text-xs text-gray-600">
              <p>Nairobi, Kenya</p>
              <p>Tel: +254 700 000 000</p>
              <p>Email: info@marque.co.ke</p>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8 print:mb-3">
          <h2 className="font-serif text-xl font-bold uppercase tracking-wider print:text-sm">
            Motor Vehicle Sale Agreement
          </h2>
          <p className="text-sm mt-1 text-gray-600">
            Made this {formatDateLong(contractDate)}
          </p>
        </div>

        {/* Parties */}
        <div className="mb-6 print:mb-3 text-sm leading-relaxed print:text-[11px] print:leading-snug">
          <p>
            This Agreement is made between <strong>Marque</strong> (hereinafter
            referred to as the &ldquo;Seller&rdquo;) of the one part, and{' '}
            <strong>{customer?.name || '_______'}</strong> (hereinafter referred
            to as the &ldquo;Buyer&rdquo;) of the other part.
          </p>
        </div>

        {/* Vehicle specs */}
        <div className="mb-6 print:mb-3 print:break-inside-avoid">
          <h3 className="font-bold text-sm uppercase tracking-wider mb-3 print:mb-1.5 print:text-[10px] border-b border-gray-300 pb-1 print:pb-0.5">
            Vehicle Description
          </h3>
          <div className="grid grid-cols-2 gap-x-8">
            <table className="w-full text-sm">
              <tbody>
                <SpecRow label="Make" value={vehicle?.make} />
                <SpecRow label="Model" value={vehicle?.model} />
                <SpecRow label="Year of Manufacture" value={vehicle?.year?.toString()} />
                <SpecRow label="Registration Number" value={vehicle?.reg_no} />
                <SpecRow label="VIN / Chassis Number" value={vehicle?.chassis_no || vehicle?.vin} />
              </tbody>
            </table>
            <table className="w-full text-sm">
              <tbody>
                <SpecRow label="Engine Number" value={vehicle?.engine_no} />
                <SpecRow label="Colour" value={vehicle?.colour} />
                <SpecRow label="Fuel Type" value={vehicle?.fuel_type} />
                <SpecRow label="Engine Capacity" value={vehicle?.engine_capacity} />
                {vehicle?.mileage != null && <SpecRow label="Mileage" value={`${vehicle.mileage.toLocaleString()} km`} />}
              </tbody>
            </table>
          </div>
        </div>

        {/* Buyer details */}
        <div className="mb-6 print:mb-3 print:break-inside-avoid">
          <h3 className="font-bold text-sm uppercase tracking-wider mb-3 print:mb-1.5 print:text-[10px] border-b border-gray-300 pb-1 print:pb-0.5">
            Buyer Details
          </h3>
          <table className="w-full text-sm">
            <tbody>
              <SpecRow label="Full Name" value={customer?.name} />
              <SpecRow label="ID Number" value={customer?.id_number} />
              <SpecRow label="Telephone" value={customer?.phone} />
              <SpecRow label="Residence" value={customer?.address} />
            </tbody>
          </table>
        </div>

        {/* Purchase price */}
        <div className="mb-6 print:mb-3 print:break-inside-avoid">
          <h3 className="font-bold text-sm uppercase tracking-wider mb-3 print:mb-1.5 print:text-[10px] border-b border-gray-300 pb-1 print:pb-0.5">
            Purchase Price
          </h3>
          <table className="w-full text-sm">
            <tbody>
              <SpecRow label="Total Purchase Price" value={formatKES(loan.vehicle_price)} />
              <tr>
                <td className="py-1 pr-4 text-gray-600 align-top">Price in Words:</td>
                <td className="py-1 font-medium italic">{priceToWords(loan.vehicle_price)}</td>
              </tr>
              <SpecRow label="Deposit Paid" value={formatKES(loan.deposit)} />
              <SpecRow label="Deposit Date" value={loan.deposit_date ? formatDateLong(loan.deposit_date) : '—'} />
              <SpecRow label="Outstanding Balance" value={formatKES(loan.balance)} />
            </tbody>
          </table>
        </div>

        {/* Balance breakdown */}
        {loan.balance_items && loan.balance_items.length > 0 && (
          <div className="mb-6 print:mb-3 print:break-inside-avoid">
            <h3 className="font-bold text-sm uppercase tracking-wider mb-3 print:mb-1.5 print:text-[10px] border-b border-gray-300 pb-1 print:pb-0.5">
              Balance Breakdown
            </h3>
            <table className="w-full text-sm border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-3 py-2 print:py-1 font-medium border-b border-gray-300">#</th>
                  <th className="text-left px-3 py-2 print:py-1 font-medium border-b border-gray-300">Description</th>
                  <th className="text-right px-3 py-2 print:py-1 font-medium border-b border-gray-300">Amount (KES)</th>
                  <th className="text-left px-3 py-2 print:py-1 font-medium border-b border-gray-300">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {loan.balance_items.map((item, idx) => (
                  <tr key={item.id} className="border-b border-gray-200">
                    <td className="px-3 py-2 print:py-1 font-mono-num">{idx + 1}</td>
                    <td className="px-3 py-2 print:py-1">{item.description}</td>
                    <td className="px-3 py-2 print:py-1 text-right font-mono-num">{item.amount.toLocaleString()}</td>
                    <td className="px-3 py-2 print:py-1 text-xs print:text-[9px] text-gray-600">{item.due_date ? formatDateLong(item.due_date) : '—'}</td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={2} className="px-3 py-2 print:py-1 text-right">Total Balance:</td>
                  <td className="px-3 py-2 print:py-1 text-right font-mono-num">{loan.balance.toLocaleString()}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Terms & conditions */}
        <div className="mb-8 print:mb-3">
          <h3 className="font-bold text-sm uppercase tracking-wider mb-3 print:mb-1.5 print:text-[10px] border-b border-gray-300 pb-1 print:pb-0.5">
            Terms &amp; Conditions
          </h3>
          <ol className="text-sm leading-relaxed space-y-2 print:text-[9px] print:leading-snug print:space-y-0.5 list-decimal pl-5 print:pl-4">
            {terms.map((term, idx) => (
              <li key={idx}>{term}</li>
            ))}
          </ol>
        </div>

        {/* Signatures */}
        <div className="mt-12 print:mt-4 grid grid-cols-1 sm:grid-cols-2 gap-8 print:gap-4 print:break-inside-avoid">
          <div>
            <p className="text-sm print:text-[10px] font-medium mb-8 print:mb-3">Signed by the Seller:</p>
            <div className="border-b border-black h-12 print:h-6 mb-1"></div>
            <p className="text-xs print:text-[9px] text-gray-600">Marque — Authorized Representative</p>
            <p className="text-xs text-gray-600 mt-1">Date: ____________________</p>
          </div>
          <div>
            <p className="text-sm print:text-[10px] font-medium mb-8 print:mb-3">Signed by the Buyer:</p>
            <div className="border-b border-black h-12 print:h-6 mb-1"></div>
            <p className="text-xs print:text-[9px] text-gray-600">{customer?.name || 'Buyer Name'}</p>
            <p className="text-xs text-gray-600 mt-1">Date: ____________________</p>
          </div>
        </div>

        {/* Witness */}
        <div className="mt-8 print:mt-3 print:break-inside-avoid">
          <p className="text-sm print:text-[10px] font-medium mb-8 print:mb-3">In the presence of (Witness):</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="border-b border-black h-12 print:h-6 mb-1"></div>
              <p className="text-xs print:text-[9px] text-gray-600">{loan.witness_name || 'Witness Name'}</p>
              {loan.witness_id_number && <p className="text-xs text-gray-600 font-mono-num">ID: {loan.witness_id_number}</p>}
              {loan.witness_phone && <p className="text-xs text-gray-600 font-mono-num">Tel: {loan.witness_phone}</p>}
            </div>
            <div>
              <p className="text-xs text-gray-600 mt-1">Date: ____________________</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 print:mt-4 pt-4 print:pt-2 border-t border-gray-300 text-center text-xs print:text-[8px] text-gray-500">
          This agreement is generated on {formatDateLong(new Date().toISOString())} and is a legally binding document.
        </div>
      </div>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <tr className="border-b border-gray-100">
      <td className="py-1.5 print:py-0.5 pr-4 text-gray-600 w-[40%]">{label}:</td>
      <td className="py-1.5 print:py-0.5 font-medium font-mono-num">{value || '—'}</td>
    </tr>
  );
}
