import React, { useState } from 'react';
import {
  UserCheck,
  ArrowRightLeft,
  Receipt,
  PlusCircle,
  Clock,
  Phone,
  ShieldCheck,
  AlertCircle,
  LogOut,
  BedDouble,
  Search
} from 'lucide-react';
import { useHotel } from '../context/HotelContext';
import { FolioExtraCharge } from '../types/hotel';

interface FrontDeskViewProps {
  onViewFolio: (folioId: string) => void;
  onViewVoucher: (bookingId: string) => void;
}

export const FrontDeskView: React.FC<FrontDeskViewProps> = ({
  onViewFolio,
  onViewVoucher
}) => {
  const {
    bookings,
    guests,
    rooms,
    roomTypes,
    folios,
    hotelSettings,
    checkInGuest,
    checkOutGuest,
    transferRoom,
    addFolioExtraCharge
  } = useHotel();

  const [searchQuery, setSearchQuery] = useState('');
  
  // Room Transfer Modal
  const [transferBookingId, setTransferBookingId] = useState<string | null>(null);
  const [targetRoomId, setTargetRoomId] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>('Guest Requested Upgrade');
  const [transferError, setTransferError] = useState<string | null>(null);

  // Extra Charge Modal
  const [chargeFolioId, setChargeFolioId] = useState<string | null>(null);
  const [chargeDescription, setChargeDescription] = useState<string>('Late Check-out Charge');
  const [chargeCategory, setChargeCategory] = useState<FolioExtraCharge['category']>('Late Check-out');
  const [chargeAmount, setChargeAmount] = useState<string>('1500');

  const todayStr = new Date().toISOString().split('T')[0];

  // In-house guests list
  const inHouseBookings = bookings.filter(b => b.status === 'Checked-in').filter(b => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const guest = guests.find(g => g.id === b.guestId);
    const room = rooms.find(r => r.id === b.roomId);
    return (
      (guest && `${guest.firstName} ${guest.lastName}`.toLowerCase().includes(q)) ||
      (guest && guest.phone.includes(q)) ||
      (room && room.roomNumber.toLowerCase().includes(q)) ||
      b.bookingCode.toLowerCase().includes(q)
    );
  });

  // Available rooms for transfer
  const availableRoomsForTransfer = rooms.filter(r => r.status === 'Available');

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError(null);
    if (!transferBookingId || !targetRoomId) return;

    const res = transferRoom(transferBookingId, targetRoomId, transferReason);
    if (!res.success) {
      setTransferError(res.error || 'Failed to transfer room.');
      return;
    }

    setTransferBookingId(null);
    setTargetRoomId('');
  };

  const handlePostExtraCharge = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(chargeAmount);
    if (!chargeFolioId || isNaN(amt) || amt <= 0) return;

    addFolioExtraCharge(chargeFolioId, {
      description: chargeDescription,
      category: chargeCategory,
      amount: amt
    });

    setChargeFolioId(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Search & In-House Register Header */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <span>In-House Resident Guests</span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
              {inHouseBookings.length} Suites Occupied
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Active resident registrations, room key assignments & on-demand guest charges.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search resident guest or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:border-amber-400 focus:outline-hidden"
          />
        </div>
      </div>

      {/* In-House Resident Grid / Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Room #</th>
                <th className="py-3 px-4">Guest Profile</th>
                <th className="py-3 px-4">Arrival & Departure</th>
                <th className="py-3 px-4">Room Category</th>
                <th className="py-3 px-4 text-right">Folio Total</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-right">Front Desk Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {inHouseBookings.map((b) => {
                const guest = guests.find(g => g.id === b.guestId);
                const room = rooms.find(r => r.id === b.roomId);
                const roomType = room ? roomTypes.find(rt => rt.id === room.roomTypeId) : null;
                const folio = folios.find(f => f.bookingId === b.id);
                const isDueToday = b.checkOutDate === todayStr;

                return (
                  <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-serif-luxury text-base font-bold text-amber-300">
                          {room?.roomNumber}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Fl.{room?.floor}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                        <span>{guest ? `${guest.firstName} ${guest.lastName}` : 'Guest'}</span>
                        {guest?.vipStatus && (
                          <span className="text-[10px] text-amber-400 font-bold uppercase">★ VIP</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{guest?.phone}</span>
                        <span>· {guest?.city}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-300">
                        {b.checkInDate} → <span className={isDueToday ? 'text-amber-400 font-bold' : ''}>{b.checkOutDate}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {b.totalNights} Nights total · In-house: {b.adults} Adults
                        {isDueToday && <span className="ml-1 text-amber-400 font-bold">(Checkout Due Today)</span>}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-200">{roomType?.name}</span>
                      <span className="text-[10px] text-slate-500 block">{room?.bedType} bed</span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-300">
                      {hotelSettings.currencySymbol}{folio ? folio.totalAmount.toLocaleString() : '-'}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {folio ? (
                        <span className={folio.balanceAmount > 1 ? 'text-rose-400' : 'text-emerald-400'}>
                          {hotelSettings.currencySymbol}{folio.balanceAmount.toLocaleString()}
                        </span>
                      ) : '-'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {folio && (
                          <button
                            onClick={() => {
                              setChargeFolioId(folio.id);
                              setChargeDescription('Extra Rollaway Bed');
                              setChargeAmount('1200');
                            }}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] flex items-center gap-1"
                            title="Add extra charge (Early checkin, Late checkout, Bed, Minibar)"
                          >
                            <PlusCircle className="w-3 h-3 text-amber-400" />
                            <span className="hidden sm:inline">Add Charge</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setTransferBookingId(b.id);
                            setTargetRoomId(availableRoomsForTransfer[0]?.id || '');
                          }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] flex items-center gap-1"
                          title="Transfer guest to another room"
                        >
                          <ArrowRightLeft className="w-3 h-3 text-blue-400" />
                          <span className="hidden sm:inline">Transfer</span>
                        </button>

                        {folio && (
                          <button
                            onClick={() => onViewFolio(folio.id)}
                            className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] flex items-center gap-1"
                            title="View Folio & Settle Bill"
                          >
                            <Receipt className="w-3 h-3" />
                            <span className="hidden sm:inline">Bill / Settle</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            const res = checkOutGuest(b.id);
                            if (!res.success) {
                              if (confirm(`${res.error}\nDo you wish to force checkout?`)) {
                                checkOutGuest(b.id, true);
                              }
                            }
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded bg-slate-700 hover:bg-slate-600 text-white"
                          title="Check out guest"
                        >
                          Check Out
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {inHouseBookings.length === 0 && (
          <div className="p-10 text-center text-slate-400">
            <UserCheck className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm">No resident in-house guests currently found.</p>
          </div>
        )}
      </div>

      {/* ROOM TRANSFER MODAL */}
      {transferBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-xl shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-blue-400" />
                <span>Guest Suite Relocation / Transfer</span>
              </h3>
              <button onClick={() => setTransferBookingId(null)} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            {transferError && (
              <div className="p-2.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{transferError}</span>
              </div>
            )}

            <form onSubmit={handleExecuteTransfer} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Target Available Suite</label>
                {availableRoomsForTransfer.length === 0 ? (
                  <p className="text-xs text-rose-400">No rooms are currently vacant and available for transfer.</p>
                ) : (
                  <select
                    value={targetRoomId}
                    onChange={(e) => setTargetRoomId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400"
                    required
                  >
                    {availableRoomsForTransfer.map(r => {
                      const type = roomTypes.find(rt => rt.id === r.roomTypeId);
                      return (
                        <option key={r.id} value={r.id}>
                          Room {r.roomNumber} - {type?.name} (Floor {r.floor}, {r.cleaningStatus})
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Reason for Room Transfer</label>
                <select
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400"
                >
                  <option value="Guest Requested Upgrade">Guest Requested Category Upgrade</option>
                  <option value="Maintenance Issue in Prior Room">Maintenance Issue (AC/Plumbing) in Prior Room</option>
                  <option value="Noise Complaint / High Floor Request">Noise Complaint / High Floor Relocation</option>
                  <option value="VIP Courtesy Relocation">VIP Courtesy Relocation</option>
                </select>
              </div>

              <div className="p-2.5 bg-slate-950 rounded text-[11px] text-slate-400">
                Notice: The former room will be automatically marked as <strong className="text-rose-400">Dirty</strong> and queued for Housekeeping turnover sanitization.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setTransferBookingId(null)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={availableRoomsForTransfer.length === 0}
                  className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white font-bold rounded disabled:opacity-50"
                >
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POST EXTRA CHARGE MODAL */}
      {chargeFolioId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-xl shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-amber-400" />
                <span>Post Service Charge to Guest Folio</span>
              </h3>
              <button onClick={() => setChargeFolioId(null)} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handlePostExtraCharge} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Service Category</label>
                <select
                  value={chargeCategory}
                  onChange={(e) => {
                    const cat = e.target.value as any;
                    setChargeCategory(cat);
                    if (cat === 'Early Check-in') { setChargeDescription('Early Check-in Surcharge'); setChargeAmount('1500'); }
                    else if (cat === 'Late Check-out') { setChargeDescription('Late Check-out Surcharge (Until 16:00)'); setChargeAmount('2000'); }
                    else if (cat === 'Extra Bed') { setChargeDescription('Additional Rollaway Bed & Linens'); setChargeAmount('1200'); }
                    else if (cat === 'Airport Transfer') { setChargeDescription('Luxury Airport Chauffeur Pickup'); setChargeAmount('2500'); }
                    else if (cat === 'Spa') { setChargeDescription('Ayurvedic Spa & Wellness Package'); setChargeAmount('4500'); }
                    else if (cat === 'Minibar') { setChargeDescription('In-Room Minibar Consumption'); setChargeAmount('850'); }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400"
                >
                  <option value="Early Check-in">Early Check-in Fee</option>
                  <option value="Late Check-out">Late Check-out Fee</option>
                  <option value="Extra Bed">Extra Bed / Rollaway Cot</option>
                  <option value="Airport Transfer">Airport Chauffeur Transfer</option>
                  <option value="Spa">Royal Spa & Wellness</option>
                  <option value="Minibar">Minibar Replenishment</option>
                  <option value="Other">Other Custom Service</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Description</label>
                <input
                  type="text"
                  value={chargeDescription}
                  onChange={(e) => setChargeDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Amount ({hotelSettings.currencySymbol})</label>
                <input
                  type="number"
                  step="0.01"
                  value={chargeAmount}
                  onChange={(e) => setChargeAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400 font-mono"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setChargeFolioId(null)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded"
                >
                  Post to Folio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
