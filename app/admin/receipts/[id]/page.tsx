'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Payment, Loan, Customer, Vehicle } from '@/lib/types';
import { formatKES, formatDate, formatDateLong } from '@/lib/format';
import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentData extends Payment {
  loan: (Pick<Loan, 'id' | 'vehicle_price' | 'deposit' | 'remaining_balance'> & {
    customer: Customer | null;
    vehicle: Vehicle | null;
  }) | null;
}

export default function ReceiptPage({ params }: { params: { id: string } }) {
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [format, setFormat] = useState<'a4' | 'thermal'>('a4');

  useEffect(() => {
    if (!params.id) return;
    supabase
      .from('payments')
      .select('*, loan:loans(id, vehicle_price, deposit, remaining_balance, customer:customers(*), vehicle:vehicles(*))')
      .eq('id', params.id)
      .maybeSingle()
      .then(({ data }) => {
        setPayment(data as PaymentData | null);
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

  if (!payment) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Payment not found.</p>
        <Link href="/admin/payments" className="text-brass text-sm mt-2 inline-block">Back to payments</Link>
      </div>
    );
  }

  const customer = payment.loan?.customer;
  const vehicle = payment.loan?.vehicle;
  const receiptNo = payment.id.slice(0, 8).toUpperCase();

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between no-print flex-wrap gap-3">
        <Link
          href="/admin/payments"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Back to Payments
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex rounded-md border border-border overflow-hidden">
            <button
              onClick={() => setFormat('a4')}
              className={cn('px-3 py-1.5 text-xs font-medium', format === 'a4' ? 'bg-brass text-white' : 'bg-card hover:bg-secondary')}
            >
              A4 Letterhead
            </button>
            <button
              onClick={() => setFormat('thermal')}
              className={cn('px-3 py-1.5 text-xs font-medium', format === 'thermal' ? 'bg-brass text-white' : 'bg-card hover:bg-secondary')}
            >
              80mm Thermal
            </button>
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-md bg-brass px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
          >
            <Printer size={16} />
            Print Receipt
          </button>
        </div>
      </div>

      {format === 'a4' ? (
        <A4Receipt payment={payment} customer={customer} vehicle={vehicle} receiptNo={receiptNo} />
      ) : (
        <ThermalReceipt payment={payment} customer={customer} vehicle={vehicle} receiptNo={receiptNo} />
      )}
    </div>
  );
}

function A4Receipt({
  payment,
  customer,
  vehicle,
  receiptNo,
}: {
  payment: PaymentData;
  customer: Customer | null | undefined;
  vehicle: Vehicle | null | undefined;
  receiptNo: string;
}) {
  return (
    <div className="print-page mx-auto max-w-[800px] bg-white text-black p-8 sm:p-12 rounded-lg border border-border shadow-sm">
      {/* Letterhead */}
      <div className="border-b-2 border-black pb-6 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight">MARQUE</h1>
            <p className="text-xs mt-1 text-gray-600">Luxury Automotive Marketplace</p>
          </div>
          <div className="text-right text-xs text-gray-600">
            <p>Nairobi, Kenya</p>
            <p>Tel: +254 700 000 000</p>
            <p>Email: info@marque.co.ke</p>
          </div>
        </div>
      </div>

      <div className="text-center mb-8">
        <h2 className="font-serif text-xl font-bold uppercase tracking-wider">Payment Receipt</h2>
        <p className="text-sm mt-1 text-gray-600 font-mono-num">Receipt No: {receiptNo}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider mb-3 border-b border-gray-300 pb-1">Received From</h3>
          <table className="w-full text-sm">
            <tbody>
              <ReceiptRow label="Name" value={customer?.name} />
              <ReceiptRow label="ID Number" value={customer?.id_number} />
              <ReceiptRow label="Phone" value={customer?.phone} />
              <ReceiptRow label="Address" value={customer?.address} />
            </tbody>
          </table>
        </div>
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider mb-3 border-b border-gray-300 pb-1">Payment Details</h3>
          <table className="w-full text-sm">
            <tbody>
              <ReceiptRow label="Date" value={formatDateLong(payment.payment_date)} />
              <ReceiptRow label="Amount" value={formatKES(payment.amount)} />
              <ReceiptRow label="Balance After" value={formatKES(payment.remaining_after)} />
              <ReceiptRow label="Note" value={payment.note} />
            </tbody>
          </table>
        </div>
      </div>

      {vehicle && (
        <div className="mb-6">
          <h3 className="font-bold text-sm uppercase tracking-wider mb-3 border-b border-gray-300 pb-1">Vehicle</h3>
          <table className="w-full text-sm">
            <tbody>
              <ReceiptRow label="Make / Model" value={`${vehicle.make} ${vehicle.model}`} />
              <ReceiptRow label="Year" value={vehicle.year?.toString()} />
              <ReceiptRow label="Registration" value={vehicle.reg_no} />
              <ReceiptRow label="Chassis No." value={vehicle.chassis_no} />
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div>
          <p className="text-sm font-medium mb-8">Received by:</p>
          <div className="border-b border-black h-12 mb-1"></div>
          <p className="text-xs text-gray-600">Marque — Authorized Representative</p>
        </div>
        <div>
          <p className="text-sm font-medium mb-8">Signature of Payer:</p>
          <div className="border-b border-black h-12 mb-1"></div>
          <p className="text-xs text-gray-600">{customer?.name || ''}</p>
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
        Thank you for your payment. This receipt was generated on {formatDateLong(new Date().toISOString())}.
      </div>
    </div>
  );
}

function ThermalReceipt({
  payment,
  customer,
  vehicle,
  receiptNo,
}: {
  payment: PaymentData;
  customer: Customer | null | undefined;
  vehicle: Vehicle | null | undefined;
  receiptNo: string;
}) {
  return (
    <div className="print-page mx-auto bg-white text-black p-4 rounded-lg border border-border shadow-sm" style={{ width: '320px' }}>
      <div className="font-mono text-[11px] leading-relaxed">
        {/* Header */}
        <div className="text-center">
          <p className="font-bold text-sm tracking-wider">MARQUE</p>
          <p>Luxury Automotive Marketplace</p>
          <p>Nairobi, Kenya</p>
          <p>Tel: +254 700 000 000</p>
        </div>

        <div className="border-t border-dashed border-black my-2"></div>

        {/* Receipt info */}
        <div className="text-center">
          <p className="font-bold">PAYMENT RECEIPT</p>
          <p>Receipt No: {receiptNo}</p>
          <p>Date: {formatDate(payment.payment_date)}</p>
        </div>

        <div className="border-t border-dashed border-black my-2"></div>

        {/* Customer */}
        <div>
          <p className="font-bold">RECEIVED FROM:</p>
          <p>{customer?.name || '—'}</p>
          {customer?.id_number && <p>ID: {customer.id_number}</p>}
          {customer?.phone && <p>Tel: {customer.phone}</p>}
        </div>

        <div className="border-t border-dashed border-black my-2"></div>

        {/* Vehicle */}
        {vehicle && (
          <>
            <div>
              <p className="font-bold">VEHICLE:</p>
              <p>{vehicle.make} {vehicle.model} {vehicle.year || ''}</p>
              {vehicle.reg_no && <p>Reg: {vehicle.reg_no}</p>}
            </div>
            <div className="border-t border-dashed border-black my-2"></div>
          </>
        )}

        {/* Payment */}
        <div>
          <div className="flex justify-between">
            <span>Amount:</span>
            <span className="font-bold">KES {payment.amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Balance After:</span>
            <span>KES {payment.remaining_after.toLocaleString()}</span>
          </div>
          {payment.note && (
            <div className="flex justify-between">
              <span>Note:</span>
              <span>{payment.note}</span>
            </div>
          )}
        </div>

        <div className="border-t border-dashed border-black my-2"></div>

        {/* Signature */}
        <div className="text-center">
          <p>__________________________</p>
          <p>Authorized Signature</p>
        </div>

        <div className="border-t border-dashed border-black my-2"></div>

        <div className="text-center">
          <p>Thank you for your payment!</p>
          <p className="mt-1 text-[9px]">{formatDate(new Date().toISOString())}</p>
        </div>
      </div>
    </div>
  );
}

function ReceiptRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <tr className="border-b border-gray-100">
      <td className="py-1.5 pr-4 text-gray-600 w-[40%]">{label}:</td>
      <td className="py-1.5 font-medium font-mono-num">{value || '—'}</td>
    </tr>
  );
}
