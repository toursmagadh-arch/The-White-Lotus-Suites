import React from 'react';
import { X, Printer, CheckCircle2, QrCode, Hotel, Calendar, User, Phone, Mail, ShieldAlert } from 'lucide-react';
import { useHotel } from '../context/HotelContext';

interface VoucherModalProps {
  bookingId: string | null;
  onClose: () => void;
}

export const VoucherModal: React.FC<VoucherModalProps> = ({ bookingId, onClose }) => {
  const { bookings, guests, rooms, roomTypes, hotelSettings, folios } = useHotel();

  if (!bookingId) return null;

  const booking = bookings.find(b => b.id === bookingId);
  if (!booking) return null;

  const guest = guests.find(g => g.id === booking.guestId);
  const room = rooms.find(r => r.id === booking.roomId);
  const roomType = room ? roomTypes.find(rt => rt.id === room.roomTypeId) : null;
  const folio = folios.find(f => f.bookingId === booking.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-xl shadow-2xl flex flex-col text-slate-100 max-h-[92vh] overflow-y-auto">
        
        {/* Modal Toolbar (hidden in print) */}
        <div className="no-print p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-semibold tracking-wider text-amber-400">
              Reservation Confirmation Voucher
            </span>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {booking.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Voucher</span>
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Voucher Body */}
        <div id="printable-area" className="p-6 md:p-8 space-y-6 bg-slate-900 print:bg-white print:text-black">
          {/* Header */}
          <div className="flex justify-between items-start pb-5 border-b border-amber-500/20 print:border-black">
            <div>
              <h1 className="font-serif-luxury text-xl font-bold text-amber-300 print:text-black uppercase">
                {hotelSettings.name}
              </h1>
              <p className="text-xs text-slate-400 print:text-slate-600">
                {hotelSettings.address}, {hotelSettings.city}
              </p>
              <p className="text-xs text-slate-400 print:text-slate-600">
                Contact: {hotelSettings.phone} · {hotelSettings.email}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded font-mono text-sm font-bold text-amber-300 print:text-black">
                {booking.bookingCode}
              </span>
              <p className="text-[11px] text-slate-400 print:text-slate-600 mt-1">Confirmed Guest Voucher</p>
            </div>
          </div>

          {/* Stay Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-lg bg-slate-950/50 print:bg-slate-100 border border-slate-800 print:border-slate-300 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Check-in</span>
              <p className="font-semibold text-sm text-slate-200 print:text-black">{booking.checkInDate}</p>
              <p className="text-[11px] text-slate-400">From {hotelSettings.checkInTime}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Check-out</span>
              <p className="font-semibold text-sm text-slate-200 print:text-black">{booking.checkOutDate}</p>
              <p className="text-[11px] text-slate-400">Until {hotelSettings.checkOutTime}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Duration</span>
              <p className="font-semibold text-sm text-amber-300 print:text-black">{booking.totalNights} Nights</p>
              <p className="text-[11px] text-slate-400">{booking.adults} Adults, {booking.children} Kids</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Room Assigned</span>
              <p className="font-semibold text-sm text-amber-300 print:text-black">Room {room?.roomNumber}</p>
              <p className="text-[11px] text-slate-400 truncate">{roomType?.name}</p>
            </div>
          </div>

          {/* Guest Details */}
          <div className="border border-slate-800 print:border-slate-300 rounded-lg p-4 text-xs space-y-2">
            <h3 className="font-bold text-amber-400/90 print:text-black uppercase text-[11px]">Primary Guest Particulars</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 print:text-black">
              <div>
                <span className="text-slate-400 mr-2">Full Name:</span>
                <span className="font-semibold">{guest?.firstName} {guest?.lastName}</span>
              </div>
              <div>
                <span className="text-slate-400 mr-2">Phone:</span>
                <span>{guest?.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 mr-2">Email:</span>
                <span>{guest?.email}</span>
              </div>
              <div>
                <span className="text-slate-400 mr-2">Identity Proof:</span>
                <span>{guest?.idType} ({guest?.idNumber})</span>
              </div>
            </div>
            {booking.specialRequests && (
              <div className="pt-2 border-t border-slate-800/80 print:border-slate-200 text-slate-400 print:text-slate-700">
                <span className="font-medium text-slate-300 print:text-black">Special Instructions: </span>
                {booking.specialRequests}
              </div>
            )}
          </div>

          {/* Rate & Payment Overview */}
          <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-slate-950/40 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-lg text-xs gap-4">
            <div className="space-y-1">
              <p className="text-slate-300 print:text-black">
                Nightly Room Tariff: <span className="font-mono">{hotelSettings.currencySymbol}{booking.nightlyRate.toLocaleString()}</span>
              </p>
              <p className="text-slate-300 print:text-black">
                Total Estimated Stay (Incl. GST): <span className="font-mono font-bold text-amber-300 print:text-black">{hotelSettings.currencySymbol}{folio?.totalAmount.toLocaleString()}</span>
              </p>
              <p className="text-emerald-400 print:text-emerald-700 font-medium">
                Advance Paid: <span className="font-mono">{hotelSettings.currencySymbol}{folio?.paidAmount.toLocaleString()}</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Balance Payable at Check-in</span>
              <span className="font-mono text-lg font-bold text-amber-400 print:text-black">
                {hotelSettings.currencySymbol}{folio?.balanceAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Hotel Policies & Verification */}
          <div className="text-[11px] text-slate-400 print:text-slate-600 space-y-1.5 border-t border-slate-800 print:border-slate-300 pt-4">
            <p className="font-bold text-slate-300 print:text-black uppercase text-[10px]">Arrival Policies & Notice:</p>
            <p>1. Government-issued photo identification (Aadhaar/Passport/Driving License) is mandatory for all occupants at check-in.</p>
            <p>2. Standard check-in is {hotelSettings.checkInTime} and check-out is {hotelSettings.checkOutTime}. Early arrival subject to availability.</p>
            <p>3. Cancellations must be communicated at least 24 hours prior to check-in date to avoid retention charges.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
