import React, { useState } from 'react';
import { X, Printer, CreditCard, PlusCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { useHotel } from '../context/HotelContext';
import { Folio, FolioExtraCharge } from '../types/hotel';

interface FolioModalProps {
  folioId: string | null;
  onClose: () => void;
}

export const FolioModal: React.FC<FolioModalProps> = ({ folioId, onClose }) => {
  const {
    folios,
    bookings,
    guests,
    rooms,
    roomTypes,
    hotelSettings,
    recordPayment,
    addFolioExtraCharge,
    restaurantOrders
  } = useHotel();

  // Payment form state
  const [payAmount, setPayAmount] = useState<string>('');
  const [payMethod, setPayMethod] = useState<'Cash' | 'Card' | 'UPI' | 'Bank Transfer'>('Cash');
  const [payRef, setPayRef] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');
  const [paySuccessMsg, setPaySuccessMsg] = useState<string | null>(null);

  // Extra charge form state
  const [showAddCharge, setShowAddCharge] = useState(false);
  const [chargeDesc, setChargeDesc] = useState('');
  const [chargeCategory, setChargeCategory] = useState<FolioExtraCharge['category']>('Minibar');
  const [chargeAmount, setChargeAmount] = useState('');

  if (!folioId) return null;

  const folio = folios.find(f => f.id === folioId);
  if (!folio) return null;

  const booking = bookings.find(b => b.id === folio.bookingId);
  const guest = booking ? guests.find(g => g.id === booking.guestId) : null;
  const room = booking ? rooms.find(r => r.id === booking.roomId) : null;
  const roomType = room ? roomTypes.find(rt => rt.id === room.roomTypeId) : null;

  // Associated restaurant orders
  const relatedOrders = booking
    ? restaurantOrders.filter(o => o.bookingId === booking.id || (room && o.roomId === room.id && o.billedToRoom))
    : [];

  const handleSettlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(payAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const res = recordPayment(folio.id, amountNum, payMethod, payRef, payNotes);
    if (res.success) {
      setPaySuccessMsg(`Payment of ${hotelSettings.currencySymbol}${amountNum.toLocaleString()} successfully posted.`);
      setPayAmount('');
      setPayRef('');
      setPayNotes('');
      setTimeout(() => setPaySuccessMsg(null), 3500);
    }
  };

  const handleAddExtraCharge = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(chargeAmount);
    if (!chargeDesc || isNaN(amt) || amt <= 0) return;

    addFolioExtraCharge(folio.id, {
      description: chargeDesc,
      category: chargeCategory,
      amount: amt
    });

    setChargeDesc('');
    setChargeAmount('');
    setShowAddCharge(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const cgst = (folio.taxAmount / 2).toFixed(2);
  const sgst = (folio.taxAmount / 2).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-amber-500/30 rounded-xl shadow-2xl flex flex-col text-slate-100">
        
        {/* Modal Toolbar (hidden on print) */}
        <div className="no-print p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-semibold tracking-wider text-amber-400">
              Tax Invoice & Guest Folio
            </span>
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
              folio.paymentStatus === 'Settled'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : folio.paymentStatus === 'Partially Paid'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}>
              {folio.paymentStatus}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors border border-amber-500/30"
              title="Print Tax Invoice (A4 Standard)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE INVOICE CONTENT AREA */}
        <div id="printable-area" className="p-6 md:p-8 space-y-6 bg-slate-900 print:bg-white print:text-black">
          
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b border-amber-500/20 print:border-black gap-4">
            <div>
              <h1 className="font-serif-luxury text-xl sm:text-2xl font-bold text-amber-300 print:text-black uppercase tracking-wide">
                {hotelSettings.name}
              </h1>
              <p className="text-xs text-slate-400 print:text-slate-600 mt-0.5">
                {hotelSettings.tagline}
              </p>
              <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
                {hotelSettings.address}, {hotelSettings.city}, {hotelSettings.state} - {hotelSettings.pinCode}
              </p>
              <p className="text-xs text-slate-400 print:text-slate-600">
                GSTIN: <span className="font-mono font-medium text-slate-300 print:text-black">{hotelSettings.gstin}</span> · Tel: {hotelSettings.phone}
              </p>
            </div>
            
            <div className="sm:text-right">
              <div className="font-serif-luxury text-lg font-bold text-amber-400 print:text-black">
                FOLIO #{folio.id.toUpperCase()}
              </div>
              <p className="text-xs text-slate-400 print:text-slate-600 mt-0.5">
                Booking Ref: <span className="font-mono font-semibold text-amber-200 print:text-black">{booking?.bookingCode}</span>
              </p>
              <p className="text-xs text-slate-400 print:text-slate-600">
                Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-xs text-slate-400 print:text-slate-600">
                Invoice Type: Tax Invoice / GST Bill
              </p>
            </div>
          </div>

          {/* Guest & Stay Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-950/40 print:bg-slate-50 p-4 rounded-lg border border-slate-800 print:border-slate-300">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400/80 print:text-slate-500 block mb-1">
                Guest Particulars
              </span>
              <p className="font-semibold text-sm text-slate-100 print:text-black">
                {guest ? `${guest.firstName} ${guest.lastName}` : 'Guest'}
                {guest?.vipStatus && <span className="ml-2 text-[10px] text-amber-400 font-bold uppercase print:text-black">[VIP Guest]</span>}
              </p>
              <p className="text-slate-400 print:text-slate-700">{guest?.email}</p>
              <p className="text-slate-400 print:text-slate-700">{guest?.phone}</p>
              <p className="text-slate-400 print:text-slate-700">{guest?.city}, {guest?.country} · ID: {guest?.idType} ({guest?.idNumber})</p>
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] uppercase font-bold text-amber-400/80 print:text-slate-500 block mb-1">
                Stay Particulars
              </span>
              <p className="font-semibold text-sm text-slate-100 print:text-black">
                Room {room?.roomNumber} · {roomType?.name}
              </p>
              <p className="text-slate-400 print:text-slate-700">
                Check-in: <span className="font-mono">{booking?.checkInDate}</span> ({hotelSettings.checkInTime})
              </p>
              <p className="text-slate-400 print:text-slate-700">
                Check-out: <span className="font-mono">{booking?.checkOutDate}</span> ({hotelSettings.checkOutTime})
              </p>
              <p className="text-slate-400 print:text-slate-700">
                Duration: <span className="font-semibold text-amber-300 print:text-black">{booking?.totalNights} Nights</span> · {booking?.adults} Adults, {booking?.children} Children
              </p>
            </div>
          </div>

          {/* Itemized Charges Table */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xs uppercase font-bold text-amber-400/90 print:text-black tracking-wider">
                Itemized Billing Particulars
              </h2>
              <button
                type="button"
                onClick={() => setShowAddCharge(!showAddCharge)}
                className="no-print text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{showAddCharge ? 'Cancel Extra Charge' : 'Add Extra Charge / Service'}</span>
              </button>
            </div>

            {/* Extra Charge Inline Form (no-print) */}
            {showAddCharge && (
              <form onSubmit={handleAddExtraCharge} className="no-print p-3 mb-3 bg-slate-800 rounded-lg border border-slate-700 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Description (e.g. Minibar, Late checkout)"
                    value={chargeDesc}
                    onChange={(e) => setChargeDesc(e.target.value)}
                    className="text-xs bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    required
                  />
                  <select
                    value={chargeCategory}
                    onChange={(e) => setChargeCategory(e.target.value as any)}
                    className="text-xs bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  >
                    <option value="Minibar">Minibar</option>
                    <option value="Early Check-in">Early Check-in</option>
                    <option value="Late Check-out">Late Check-out</option>
                    <option value="Extra Bed">Extra Bed / Cot</option>
                    <option value="Airport Transfer">Airport Transfer</option>
                    <option value="Spa">Spa & Wellness</option>
                    <option value="F&B">Food & Beverage</option>
                    <option value="Laundry">Laundry Service</option>
                    <option value="Other">Other Services</option>
                  </select>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Amount"
                      value={chargeAmount}
                      onChange={(e) => setChargeAmount(e.target.value)}
                      className="text-xs bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white flex-1"
                      required
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs font-semibold bg-amber-500 text-slate-950 rounded hover:bg-amber-400"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="overflow-x-auto border border-slate-800 print:border-slate-300 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950/80 print:bg-slate-100 text-slate-400 print:text-slate-700 uppercase font-semibold border-b border-slate-800 print:border-slate-300">
                  <tr>
                    <th className="py-2.5 px-3">Service Particulars</th>
                    <th className="py-2.5 px-3 text-center">Category</th>
                    <th className="py-2.5 px-3 text-right">Amount ({hotelSettings.currencySymbol})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                  <tr>
                    <td className="py-2.5 px-3">
                      <p className="font-medium text-slate-200 print:text-black">
                        Room Accommodation Tariff ({booking?.totalNights} Nights @ {hotelSettings.currencySymbol}{booking?.nightlyRate.toLocaleString()}/night)
                      </p>
                      <p className="text-[11px] text-slate-400 print:text-slate-600">
                        {roomType?.name} · Room #{room?.roomNumber}
                      </p>
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-400 print:text-slate-600">Accommodation</td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-200 print:text-black">
                      {folio.roomCharge.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  {folio.foodCharge > 0 && (
                    <tr>
                      <td className="py-2.5 px-3">
                        <p className="font-medium text-slate-200 print:text-black">
                          In-Room Dining & Restaurant Orders
                        </p>
                        <p className="text-[11px] text-slate-400 print:text-slate-600">
                          {relatedOrders.length} Room Service / KOT orders attached
                        </p>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-400 print:text-slate-600">F&B</td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-200 print:text-black">
                        {folio.foodCharge.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}

                  {folio.laundryCharge > 0 && (
                    <tr>
                      <td className="py-2.5 px-3">
                        <p className="font-medium text-slate-200 print:text-black">
                          Laundry & Valet Services
                        </p>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-400 print:text-slate-600">Valet</td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-200 print:text-black">
                        {folio.laundryCharge.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}

                  {folio.extraCharges.map((ch) => (
                    <tr key={ch.id}>
                      <td className="py-2.5 px-3">
                        <p className="font-medium text-slate-200 print:text-black">{ch.description}</p>
                        <p className="text-[11px] text-slate-400 print:text-slate-600">{ch.createdAt}</p>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-400 print:text-slate-600">{ch.category}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-200 print:text-black">
                        {ch.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tax & Total Calculation Breakdown */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 pt-2">
            <div className="flex-1 text-xs text-slate-400 print:text-slate-600 space-y-1">
              <p className="font-semibold text-slate-300 print:text-black uppercase text-[11px]">Payment Terms & Notes:</p>
              <p>• GST 18% applied (CGST 9% + SGST 9%) as per hospitality regulations.</p>
              <p>• Luxury Hospitality Service Charge 5% added towards staff welfare fund.</p>
              <p>• All balances must be settled in full prior to departure.</p>
            </div>

            <div className="w-full sm:w-72 text-xs space-y-2 bg-slate-950/60 print:bg-slate-50 p-4 rounded-lg border border-slate-800 print:border-slate-300">
              <div className="flex justify-between text-slate-300 print:text-black">
                <span>Services Subtotal:</span>
                <span className="font-mono">
                  {hotelSettings.currencySymbol}
                  {(folio.roomCharge + folio.foodCharge + folio.laundryCharge + folio.extraCharges.reduce((s, c) => s + c.amount, 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-400 print:text-slate-700">
                <span>Service Charge ({hotelSettings.serviceChargeRate}%):</span>
                <span className="font-mono">{hotelSettings.currencySymbol}{folio.serviceCharge.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-400 print:text-slate-700">
                <span>CGST (9%):</span>
                <span className="font-mono">{hotelSettings.currencySymbol}{cgst}</span>
              </div>
              <div className="flex justify-between text-slate-400 print:text-slate-700">
                <span>SGST (9%):</span>
                <span className="font-mono">{hotelSettings.currencySymbol}{sgst}</span>
              </div>
              {folio.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 print:text-emerald-700">
                  <span>Special Discount:</span>
                  <span className="font-mono">-{hotelSettings.currencySymbol}{folio.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-800 print:border-slate-400 flex justify-between font-bold text-sm text-slate-100 print:text-black">
                <span>Grand Total:</span>
                <span className="font-mono text-amber-300 print:text-black">
                  {hotelSettings.currencySymbol}{folio.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-emerald-400 print:text-emerald-700 font-medium">
                <span>Total Amount Paid:</span>
                <span className="font-mono">{hotelSettings.currencySymbol}{folio.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="pt-1.5 border-t border-slate-800 print:border-slate-400 flex justify-between font-bold text-sm">
                <span className={folio.balanceAmount > 1 ? 'text-rose-400 print:text-rose-700' : 'text-emerald-400 print:text-emerald-700'}>
                  Balance Due:
                </span>
                <span className={`font-mono ${folio.balanceAmount > 1 ? 'text-rose-400 print:text-rose-700' : 'text-emerald-400 print:text-emerald-700'}`}>
                  {hotelSettings.currencySymbol}{folio.balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Payments Ledger Section */}
          <div className="pt-2">
            <h3 className="text-xs uppercase font-bold text-amber-400/90 print:text-black tracking-wider mb-2">
              Receipt & Settlement History ({folio.payments.length})
            </h3>
            {folio.payments.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No payments recorded yet.</p>
            ) : (
              <div className="overflow-x-auto border border-slate-800 print:border-slate-300 rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950/80 print:bg-slate-100 text-slate-400 print:text-slate-700 uppercase font-semibold">
                    <tr>
                      <th className="py-2 px-3">Date & Time</th>
                      <th className="py-2 px-3">Method</th>
                      <th className="py-2 px-3">Reference / Notes</th>
                      <th className="py-2 px-3">Recorded By</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                    {folio.payments.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2 px-3 font-mono">{p.createdAt}</td>
                        <td className="py-2 px-3 font-medium text-slate-200 print:text-black">{p.paymentMethod}</td>
                        <td className="py-2 px-3 text-slate-400 print:text-slate-600">
                          {p.transactionRef || '-'} {p.notes ? `(${p.notes})` : ''}
                        </td>
                        <td className="py-2 px-3 text-slate-400 print:text-slate-600">{p.recordedBy}</td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-400 print:text-emerald-700">
                          {hotelSettings.currencySymbol}{p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* PAYMENT SETTLEMENT FORM (no-print) */}
        {folio.balanceAmount > 1 && (
          <div className="no-print p-6 border-t border-slate-800 bg-slate-950/80">
            <h3 className="text-xs uppercase font-bold text-amber-400 tracking-wider mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span>Record Payment Settlement</span>
            </h3>

            {paySuccessMsg && (
              <div className="mb-3 p-2.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{paySuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSettlePayment} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Settlement Amount ({hotelSettings.currencySymbol})</label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    step="0.01"
                    placeholder={`Max: ${folio.balanceAmount.toFixed(2)}`}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setPayAmount(folio.balanceAmount.toFixed(2))}
                    className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded border border-slate-700 shrink-0"
                    title="Pay Full Outstanding Balance"
                  >
                    Full
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full text-xs bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400"
                >
                  <option value="Cash">Cash (INR)</option>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="UPI">UPI (GooglePay / PhonePe / Paytm)</option>
                  <option value="Bank Transfer">Direct Bank Wire</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Transaction Ref / Cheque #</label>
                <input
                  type="text"
                  placeholder="e.g. UPI-TXN-98401"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-1.5 px-4 text-xs font-semibold rounded bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 transition-all font-bold shadow-md shadow-emerald-500/20 active:scale-95"
                >
                  Post Payment
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
