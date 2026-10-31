import React, { useState } from 'react';
import {
  Receipt,
  Search,
  Plus,
  CreditCard,
  DollarSign,
  TrendingDown,
  FileText,
  Printer,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { useHotel } from '../context/HotelContext';
import { ExpenseRecord } from '../types/hotel';

interface FoliosViewProps {
  onViewFolio: (folioId: string) => void;
}

export const FoliosView: React.FC<FoliosViewProps> = ({ onViewFolio }) => {
  const {
    folios,
    bookings,
    guests,
    rooms,
    hotelSettings,
    expenses,
    addExpense
  } = useHotel();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Unpaid' | 'Partially Paid' | 'Settled'>('all');
  
  // Expense modal
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseRecord['category']>('Utilities & Power');
  const [expenseAmount, setExpenseAmount] = useState('5000');
  const [expenseNotes, setExpenseNotes] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Daily totals
  const todayCollections = folios.reduce((sum, f) => {
    const todayPays = f.payments
      .filter(p => p.createdAt.startsWith(todayStr))
      .reduce((s, p) => s + p.amount, 0);
    return sum + todayPays;
  }, 0);

  const totalOutstandingBalance = folios.reduce((sum, f) => sum + f.balanceAmount, 0);
  const totalBilled = folios.reduce((sum, f) => sum + f.totalAmount, 0);
  const totalCollected = folios.reduce((sum, f) => sum + f.paidAmount, 0);

  const filteredFolios = folios.filter(f => {
    if (statusFilter !== 'all' && f.paymentStatus !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const booking = bookings.find(b => b.id === f.bookingId);
      const guest = booking ? guests.find(g => g.id === booking.guestId) : null;
      const room = booking ? rooms.find(r => r.id === booking.roomId) : null;

      const matchesFolio = f.id.toLowerCase().includes(q);
      const matchesCode = booking?.bookingCode.toLowerCase().includes(q) || false;
      const matchesGuest = guest ? `${guest.firstName} ${guest.lastName}`.toLowerCase().includes(q) : false;
      const matchesPhone = guest ? guest.phone.includes(q) : false;
      const matchesRoom = room ? room.roomNumber.toLowerCase().includes(q) : false;

      if (!matchesFolio && !matchesCode && !matchesGuest && !matchesPhone && !matchesRoom) {
        return false;
      }
    }
    return true;
  });

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim()) return;

    addExpense({
      title: expenseTitle.trim(),
      category: expenseCategory,
      amount: parseFloat(expenseAmount) || 0,
      date: todayStr,
      notes: expenseNotes
    });

    setShowExpenseModal(false);
    setExpenseTitle('');
  };

  return (
    <div className="space-y-6">
      
      {/* 4 Financial KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-amber-500/30 p-4 rounded-xl">
          <p className="text-[11px] text-slate-400 uppercase font-semibold">Today's Cash Closing</p>
          <p className="text-2xl font-bold font-mono text-amber-300 mt-1">
            {hotelSettings.currencySymbol}{todayCollections.toLocaleString()}
          </p>
          <p className="text-[10px] text-amber-400/80 mt-0.5">Collections received today</p>
        </div>

        <div className="bg-slate-900/90 border border-emerald-500/20 p-4 rounded-xl">
          <p className="text-[11px] text-slate-400 uppercase font-semibold">Total Revenue Collected</p>
          <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {hotelSettings.currencySymbol}{totalCollected.toLocaleString()}
          </p>
          <p className="text-[10px] text-emerald-300/80 mt-0.5">Across all resident folios</p>
        </div>

        <div className="bg-slate-900/90 border border-rose-500/20 p-4 rounded-xl">
          <p className="text-[11px] text-slate-400 uppercase font-semibold">Outstanding Balances</p>
          <p className="text-2xl font-bold font-mono text-rose-400 mt-1">
            {hotelSettings.currencySymbol}{totalOutstandingBalance.toLocaleString()}
          </p>
          <p className="text-[10px] text-rose-300/80 mt-0.5">Due upon guest check-out</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-semibold">Operational Costs</p>
            <p className="text-2xl font-bold font-mono text-slate-200 mt-1">
              {hotelSettings.currencySymbol}{expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">{expenses.length} logged expense entries</p>
          </div>
          <button
            onClick={() => setShowExpenseModal(true)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Expense</span>
          </button>
        </div>
      </div>

      {/* Control Strip */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by guest name, folio ID, booking ref or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:border-amber-400 focus:outline-hidden"
          />
        </div>

        <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800 text-xs">
          {(['all', 'Unpaid', 'Partially Paid', 'Settled'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === st ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {st === 'all' ? 'All Invoices' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Folios Ledger Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Folio #</th>
                <th className="py-3 px-4">Booking Ref</th>
                <th className="py-3 px-4">Billed Resident</th>
                <th className="py-3 px-4">Room Assigned</th>
                <th className="py-3 px-4 text-right">Invoice Total</th>
                <th className="py-3 px-4 text-right">Paid Amount</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredFolios.map((folio) => {
                const booking = bookings.find(b => b.id === folio.bookingId);
                const guest = booking ? guests.find(g => g.id === booking.guestId) : null;
                const room = booking ? rooms.find(r => r.id === booking.roomId) : null;

                return (
                  <tr key={folio.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-300">
                      #{folio.id.toUpperCase()}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300">
                      {booking?.bookingCode}
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-100">
                        {guest ? `${guest.firstName} ${guest.lastName}` : 'Guest'}
                      </p>
                      <p className="text-[11px] text-slate-500">{guest?.phone}</p>
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-200">
                      Room {room?.roomNumber}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                      {hotelSettings.currencySymbol}{folio.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-400">
                      {hotelSettings.currencySymbol}{folio.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span className={folio.balanceAmount > 1 ? 'text-rose-400' : 'text-emerald-400'}>
                        {hotelSettings.currencySymbol}{folio.balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded inline-block ${
                        folio.paymentStatus === 'Settled'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : folio.paymentStatus === 'Partially Paid'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {folio.paymentStatus}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onViewFolio(folio.id)}
                        className="px-3 py-1 text-xs font-semibold rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 ml-auto"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Folio & Invoice</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredFolios.length === 0 && (
          <div className="p-10 text-center text-slate-400">
            <Receipt className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm">No billing folios found matching your search.</p>
          </div>
        )}
      </div>

      {/* LOG EXPENSE MODAL */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-xl shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300">
                Record Property Operational Expense
              </h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Expense Title / Vendor Bill</label>
                <input
                  type="text"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="e.g. Electric Grid Commercial Utility Bill"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Category</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                >
                  <option value="Utilities & Power">Utilities & Power</option>
                  <option value="Kitchen Supplies">Kitchen Supplies</option>
                  <option value="Housekeeping Goods">Housekeeping Goods</option>
                  <option value="Maintenance & Repair">Maintenance & Repair</option>
                  <option value="Staff Payroll">Staff Payroll & Benefits</option>
                  <option value="Vendor Services">Vendor & Contractor Services</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Amount ({hotelSettings.currencySymbol})</label>
                <input
                  type="number"
                  step="0.01"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Audit Notes / Receipt Reference</label>
                <input
                  type="text"
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  placeholder="e.g. Paid via corporate account"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded"
                >
                  Log Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
