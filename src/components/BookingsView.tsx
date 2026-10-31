import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  Search,
  Plus,
  FileText,
  Receipt,
  UserCheck,
  Ban,
  Clock,
  Phone,
  Mail,
  AlertCircle
} from 'lucide-react';
import { useHotel } from '../context/HotelContext';
import { BookingStatus } from '../types/hotel';

interface BookingsViewProps {
  onOpenNewBookingModal: () => void;
  onViewFolio: (folioId: string) => void;
  onViewVoucher: (bookingId: string) => void;
}

export const BookingsView: React.FC<BookingsViewProps> = ({
  onOpenNewBookingModal,
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
    cancelBooking
  } = useHotel();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (selectedStatus !== 'all' && b.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const guest = guests.find(g => g.id === b.guestId);
        const room = rooms.find(r => r.id === b.roomId);
        const matchesCode = b.bookingCode.toLowerCase().includes(q);
        const matchesGuest = guest ? `${guest.firstName} ${guest.lastName}`.toLowerCase().includes(q) : false;
        const matchesPhone = guest ? guest.phone.includes(q) : false;
        const matchesRoom = room ? room.roomNumber.toLowerCase().includes(q) : false;
        const matchesDate = b.checkInDate.includes(q) || b.checkOutDate.includes(q);

        if (!matchesCode && !matchesGuest && !matchesPhone && !matchesRoom && !matchesDate) {
          return false;
        }
      }
      return true;
    });
  }, [bookings, guests, rooms, selectedStatus, searchQuery]);

  const handleCancel = (bookingId: string, bookingCode: string) => {
    const reason = prompt(`Enter cancellation reason for Booking ${bookingCode}:`);
    if (reason !== null) {
      cancelBooking(bookingId, reason);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Control Strip */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by guest name, phone, booking code or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:border-amber-400 focus:outline-hidden"
          />
        </div>

        {/* Status Filters & Create Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800 text-xs">
            {['all', 'Confirmed', 'Checked-in', 'Checked-out', 'Cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  selectedStatus === st
                    ? 'bg-amber-500/20 text-amber-300 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st === 'all' ? 'All' : st}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenNewBookingModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 hover:from-amber-300 hover:to-amber-400 transition-all font-bold shadow-sm shadow-amber-500/20"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Reservation</span>
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Booking Ref</th>
                <th className="py-3 px-4">Guest Details</th>
                <th className="py-3 px-4">Room & Category</th>
                <th className="py-3 px-4">Stay Schedule</th>
                <th className="py-3 px-4 text-right">Tariff Total</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredBookings.map((b) => {
                const guest = guests.find(g => g.id === b.guestId);
                const room = rooms.find(r => r.id === b.roomId);
                const roomType = room ? roomTypes.find(rt => rt.id === room.roomTypeId) : null;
                const folio = folios.find(f => f.bookingId === b.id);

                return (
                  <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-amber-300 block">{b.bookingCode}</span>
                      <span className="text-[10px] text-slate-500 uppercase">{b.bookingSource}</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">
                        {guest ? `${guest.firstName} ${guest.lastName}` : 'Guest'}
                        {guest?.vipStatus && <span className="ml-1 text-[10px] text-amber-400 font-bold">★ VIP</span>}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{guest?.phone}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-200">Room {room?.roomNumber}</span>
                      <span className="text-[11px] text-slate-400 block truncate max-w-[150px]">{roomType?.name}</span>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <div className="text-slate-200">{b.checkInDate} → {b.checkOutDate}</div>
                      <div className="text-[10px] text-amber-400/80 font-sans">{b.totalNights} Nights · {b.adults} Adults, {b.children} Children</div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-200">
                      {hotelSettings.currencySymbol}{folio ? folio.totalAmount.toLocaleString() : b.roomSubtotal.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-semibold">
                      {folio ? (
                        <span className={folio.balanceAmount > 1 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                          {hotelSettings.currencySymbol}{folio.balanceAmount.toLocaleString()}
                        </span>
                      ) : '-'}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded inline-block ${
                        b.status === 'Checked-in'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : b.status === 'Confirmed'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : b.status === 'Checked-out'
                          ? 'bg-slate-700 text-slate-300 border border-slate-600'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {b.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewVoucher(b.id)}
                          className="px-2.5 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1"
                          title="Print Guest Confirmation Voucher"
                        >
                          <FileText className="w-3 h-3 text-amber-400" />
                          <span className="hidden sm:inline">Voucher</span>
                        </button>

                        {folio && (
                          <button
                            onClick={() => onViewFolio(folio.id)}
                            className="px-2.5 py-1 text-[11px] rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 flex items-center gap-1"
                            title="Open Master Invoice & Folio"
                          >
                            <Receipt className="w-3 h-3" />
                            <span className="hidden sm:inline">Folio</span>
                          </button>
                        )}

                        {b.status === 'Confirmed' && (
                          <button
                            onClick={() => {
                              const res = checkInGuest(b.id);
                              if (!res.success) alert(res.error);
                            }}
                            className="px-2.5 py-1 text-[11px] rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
                            title="Check in this guest now"
                          >
                            Check In
                          </button>
                        )}

                        {b.status === 'Checked-in' && (
                          <button
                            onClick={() => {
                              const res = checkOutGuest(b.id);
                              if (!res.success) {
                                if (confirm(`${res.error}\nProceed anyway?`)) {
                                  checkOutGuest(b.id, true);
                                }
                              }
                            }}
                            className="px-2.5 py-1 text-[11px] rounded bg-slate-700 hover:bg-slate-600 text-white"
                            title="Process guest check-out"
                          >
                            Check Out
                          </button>
                        )}

                        {b.status === 'Confirmed' && (
                          <button
                            onClick={() => handleCancel(b.id, b.bookingCode)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded"
                            title="Cancel Reservation"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredBookings.length === 0 && (
          <div className="p-10 text-center text-slate-400">
            <CalendarCheck className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm">No reservations found matching the current criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};
