import React, { useState, useMemo } from 'react';
import { X, Calendar, User, CreditCard, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import { useHotel } from '../context/HotelContext';
import { BookingSource, Guest } from '../types/hotel';

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedRoomId?: string;
  onBookingCreated?: (bookingId: string) => void;
}

export const NewBookingModal: React.FC<NewBookingModalProps> = ({
  isOpen,
  onClose,
  preselectedRoomId,
  onBookingCreated
}) => {
  const {
    hotelSettings,
    roomTypes,
    rooms,
    guests,
    checkAvailability,
    createBooking
  } = useHotel();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => new Date(Date.now() + 86400000).toISOString().split('T')[0], []);

  // Form State
  const [checkInDate, setCheckInDate] = useState<string>(todayStr);
  const [checkOutDate, setCheckOutDate] = useState<string>(tomorrowStr);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>(preselectedRoomId || '');
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [bookingSource, setBookingSource] = useState<BookingSource>('Walk-in');
  const [specialRequests, setSpecialRequests] = useState<string>('');
  
  // Advance payment
  const [advancePayment, setAdvancePayment] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'UPI' | 'Bank Transfer'>('Cash');

  // Guest State
  const [isExistingGuest, setIsExistingGuest] = useState<boolean>(false);
  const [selectedGuestId, setSelectedGuestId] = useState<string>('');
  const [guestFirstName, setGuestFirstName] = useState<string>('');
  const [guestLastName, setGuestLastName] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [guestIdType, setGuestIdType] = useState<Guest['idType']>('Aadhaar');
  const [guestIdNumber, setGuestIdNumber] = useState<string>('');
  const [guestCity, setGuestCity] = useState<string>('Mumbai');
  const [guestCountry, setGuestCountry] = useState<string>('India');
  const [guestVip, setGuestVip] = useState<boolean>(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Synchronize available rooms dynamically
  const availableRooms = useMemo(() => {
    if (!checkInDate || !checkOutDate) return [];
    return checkAvailability(checkInDate, checkOutDate, selectedRoomTypeId || undefined);
  }, [checkInDate, checkOutDate, selectedRoomTypeId, checkAvailability]);

  // Update room selection if preselected or list changes
  React.useEffect(() => {
    if (preselectedRoomId && availableRooms.some(r => r.id === preselectedRoomId)) {
      setSelectedRoomId(preselectedRoomId);
    } else if (availableRooms.length > 0 && (!selectedRoomId || !availableRooms.some(r => r.id === selectedRoomId))) {
      setSelectedRoomId(availableRooms[0].id);
    } else if (availableRooms.length === 0) {
      setSelectedRoomId('');
    }
  }, [availableRooms, preselectedRoomId]);

  if (!isOpen) return null;

  // Calculation estimates
  const selectedRoom = rooms.find(r => r.id === selectedRoomId);
  const selectedType = roomTypes.find(rt => rt.id === selectedRoom?.roomTypeId);
  
  const d1 = new Date(checkInDate);
  const d2 = new Date(checkOutDate);
  const nights = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
  const rate = selectedType ? selectedType.baseRate : 0;
  const subtotal = rate * nights;
  const serviceCharge = (subtotal * hotelSettings.serviceChargeRate) / 100;
  const tax = ((subtotal + serviceCharge) * hotelSettings.taxRate) / 100;
  const grandTotal = subtotal + serviceCharge + tax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedRoomId) {
      setErrorMessage('Please select an available room.');
      return;
    }

    if (new Date(checkInDate) >= new Date(checkOutDate)) {
      setErrorMessage('Check-out date must be later than Check-in date.');
      return;
    }

    const advanceNum = parseFloat(advancePayment) || 0;

    const res = createBooking(
      {
        roomId: selectedRoomId,
        checkInDate,
        checkOutDate,
        adults,
        children,
        bookingSource,
        specialRequests
      },
      {
        isExisting: isExistingGuest,
        guestId: selectedGuestId,
        firstName: guestFirstName,
        lastName: guestLastName,
        email: guestEmail,
        phone: guestPhone,
        idType: guestIdType,
        idNumber: guestIdNumber,
        city: guestCity,
        country: guestCountry,
        vipStatus: guestVip
      },
      advanceNum,
      paymentMethod
    );

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to create reservation.');
      return;
    }

    if (res.bookingId && onBookingCreated) {
      onBookingCreated(res.bookingId);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-amber-500/30 rounded-xl shadow-2xl flex flex-col text-slate-100">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              New Guest Reservation Engine
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Stay Dates & Room Selection */}
          <div className="space-y-4 bg-slate-950/40 p-4 rounded-lg border border-slate-800">
            <h4 className="text-xs uppercase font-bold text-amber-400/90 tracking-wider">
              1. Dates & Suite Allocation
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Check-In Date</label>
                <input
                  type="date"
                  value={checkInDate}
                  min={todayStr}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Check-Out Date</label>
                <input
                  type="date"
                  value={checkOutDate}
                  min={checkInDate || todayStr}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Room Category</label>
                <select
                  value={selectedRoomTypeId}
                  onChange={(e) => setSelectedRoomTypeId(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400"
                >
                  <option value="">All Categories ({availableRooms.length} available)</option>
                  {roomTypes.map(rt => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name} ({hotelSettings.currencySymbol}{rt.baseRate}/nt)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Available Room ({availableRooms.length})
                </label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400"
                  required
                >
                  {availableRooms.length === 0 ? (
                    <option value="">No rooms available for dates</option>
                  ) : (
                    availableRooms.map(r => {
                      const type = roomTypes.find(rt => rt.id === r.roomTypeId);
                      return (
                        <option key={r.id} value={r.id}>
                          Room {r.roomNumber} - {type?.name} (Floor {r.floor})
                        </option>
                      );
                    })
                  )}
                </select>
              </div>
            </div>

            {availableRooms.length === 0 && (
              <p className="text-xs text-rose-400">
                Notice: All rooms are fully booked for the selected dates. Please adjust arrival or departure dates.
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Adults</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={adults}
                  onChange={(e) => setAdults(parseInt(e.target.value) || 1)}
                  className="w-full text-xs bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Children</label>
                <input
                  type="number"
                  min="0"
                  max="8"
                  value={children}
                  onChange={(e) => setChildren(parseInt(e.target.value) || 0)}
                  className="w-full text-xs bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Booking Source</label>
                <select
                  value={bookingSource}
                  onChange={(e) => setBookingSource(e.target.value as any)}
                  className="w-full text-xs bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400"
                >
                  <option value="Walk-in">Walk-in</option>
                  <option value="Website">Official Website</option>
                  <option value="Phone">Direct Phone</option>
                  <option value="Travel Agent">Travel Agent</option>
                  <option value="OTA (Booking.com/Expedia)">OTA (Booking.com / Expedia)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Stay Duration</label>
                <div className="text-xs font-semibold text-amber-300 py-1.5 font-mono">
                  {nights} Nights · {hotelSettings.currencySymbol}{rate.toLocaleString()}/nt
                </div>
              </div>
            </div>
          </div>

          {/* Guest Profile Section */}
          <div className="space-y-4 bg-slate-950/40 p-4 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs uppercase font-bold text-amber-400/90 tracking-wider">
                2. Guest Profile & Registration
              </h4>
              <div className="flex items-center gap-2 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={isExistingGuest}
                    onChange={(e) => setIsExistingGuest(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>Select from Registered Guests</span>
                </label>
              </div>
            </div>

            {isExistingGuest ? (
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Select Guest</label>
                <select
                  value={selectedGuestId}
                  onChange={(e) => {
                    setSelectedGuestId(e.target.value);
                    const found = guests.find(g => g.id === e.target.value);
                    if (found) {
                      setGuestFirstName(found.firstName);
                      setGuestLastName(found.lastName);
                      setGuestEmail(found.email);
                      setGuestPhone(found.phone);
                      setGuestIdType(found.idType);
                      setGuestIdNumber(found.idNumber);
                      setGuestCity(found.city);
                      setGuestVip(found.vipStatus);
                    }
                  }}
                  className="w-full text-xs bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400"
                  required
                >
                  <option value="">-- Choose Guest --</option>
                  {guests.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.firstName} {g.lastName} ({g.phone} · {g.city}) {g.vipStatus ? '★ VIP' : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">First Name</label>
                  <input
                    type="text"
                    value={guestFirstName}
                    onChange={(e) => setGuestFirstName(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400"
                    placeholder="e.g. Rahul"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Last Name</label>
                  <input
                    type="text"
                    value={guestLastName}
                    onChange={(e) => setGuestLastName(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400"
                    placeholder="e.g. Verma"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Mobile Phone</label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400"
                    placeholder="+91 98200..."
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400"
                    placeholder="guest@domain.com"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Government ID Type</label>
                  <select
                    value={guestIdType}
                    onChange={(e) => setGuestIdType(e.target.value as any)}
                    className="w-full text-xs bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400"
                  >
                    <option value="Aadhaar">Aadhaar Card (India)</option>
                    <option value="Passport">International Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="National ID">National ID</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">ID Number</label>
                  <input
                    type="text"
                    value={guestIdNumber}
                    onChange={(e) => setGuestIdNumber(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400"
                    placeholder="e.g. 5420 1829 4810"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">City</label>
                  <input
                    type="text"
                    value={guestCity}
                    onChange={(e) => setGuestCity(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Country</label>
                  <input
                    type="text"
                    value={guestCountry}
                    onChange={(e) => setGuestCountry(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-amber-300 font-medium">
                    <input
                      type="checkbox"
                      checked={guestVip}
                      onChange={(e) => setGuestVip(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                    />
                    <span>VIP Guest Status</span>
                  </label>
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Special Requests / Preferences</label>
              <textarea
                rows={2}
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="High floor, extra hypoallergenic pillows, late check-in notice, etc."
                className="w-full text-xs bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-amber-400"
              />
            </div>
          </div>

          {/* Pricing & Advance Settlement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-lg border border-slate-800">
            <div>
              <h4 className="text-xs uppercase font-bold text-amber-400/90 tracking-wider mb-2">
                Estimated Tariff & Taxes
              </h4>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Room Charge ({nights} nt @ {hotelSettings.currencySymbol}{rate.toLocaleString()}):</span>
                  <span className="font-mono">{hotelSettings.currencySymbol}{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Hospitality Service Fee ({hotelSettings.serviceChargeRate}%):</span>
                  <span className="font-mono">{hotelSettings.currencySymbol}{serviceCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>GST ({hotelSettings.taxRate}%):</span>
                  <span className="font-mono">{hotelSettings.currencySymbol}{tax.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-amber-300">
                  <span>Total Estimated Bill:</span>
                  <span className="font-mono">{hotelSettings.currencySymbol}{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs uppercase font-bold text-amber-400/90 tracking-wider mb-2">
                Advance Deposit (Optional)
              </h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Advance Amount ({hotelSettings.currencySymbol})</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max={grandTotal}
                      value={advancePayment}
                      onChange={(e) => setAdvancePayment(e.target.value)}
                      className="w-full text-xs bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full text-xs bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400"
                    >
                      <option value="Cash">Cash (INR)</option>
                      <option value="Card">Credit/Debit Card</option>
                      <option value="UPI">UPI Transfer</option>
                      <option value="Bank Transfer">Bank Wire</option>
                    </select>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Balance at Departure:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {hotelSettings.currencySymbol}
                    {Math.max(0, grandTotal - (parseFloat(advancePayment) || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={availableRooms.length === 0}
              className="px-6 py-2 text-xs font-bold rounded bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 hover:from-amber-300 hover:to-amber-400 transition-all shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Reservation & Generate Voucher
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
