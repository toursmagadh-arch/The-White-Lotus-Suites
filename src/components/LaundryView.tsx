import React, { useState } from 'react';
import {
  Shirt,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  Truck,
  Receipt
} from 'lucide-react';
import { useHotel } from '../context/HotelContext';
import { LaundryOrder } from '../types/hotel';

export const LaundryView: React.FC = () => {
  const {
    laundryOrders,
    rooms,
    bookings,
    guests,
    hotelSettings,
    addLaundryOrder,
    updateLaundryStatus
  } = useHotel();

  const [showAddModal, setShowAddModal] = useState(false);

  // Form
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [itemsCount, setItemsCount] = useState<number>(4);
  const [serviceType, setServiceType] = useState<LaundryOrder['serviceType']>('Washing');
  const [totalCharge, setTotalCharge] = useState<string>('600');

  const occupiedRooms = rooms.filter(r => r.status === 'Occupied');

  React.useEffect(() => {
    if (occupiedRooms.length > 0 && !selectedRoomId) {
      setSelectedRoomId(occupiedRooms[0].id);
    }
  }, [occupiedRooms, selectedRoomId]);

  // Pricing guide
  const ratePerItem: Record<LaundryOrder['serviceType'], number> = {
    'Ironing': 80,
    'Washing': 150,
    'Dry Cleaning': 300,
    'Complete Laundry Express': 450
  };

  const handleServiceTypeChange = (type: LaundryOrder['serviceType']) => {
    setServiceType(type);
    setTotalCharge((itemsCount * ratePerItem[type]).toString());
  };

  const handleItemsCountChange = (count: number) => {
    setItemsCount(count);
    setTotalCharge((count * ratePerItem[serviceType]).toString());
  };

  const handleCreateLaundry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) return;

    const room = rooms.find(r => r.id === selectedRoomId);
    const booking = bookings.find(b => b.roomId === selectedRoomId && b.status === 'Checked-in');
    const guest = booking ? guests.find(g => g.id === booking.guestId) : null;

    if (!room || !booking) {
      alert('Selected room does not have an active checked-in booking.');
      return;
    }

    addLaundryOrder({
      bookingId: booking.id,
      roomNumber: room.roomNumber,
      guestName: guest ? `${guest.firstName} ${guest.lastName}` : 'Guest',
      itemsCount,
      serviceType,
      status: 'Received',
      totalCharge: parseFloat(totalCharge) || 0
    });

    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Control Strip */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Shirt className="w-4 h-4 text-amber-400" />
            <span>Valet Laundry & Garment Care</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Express garment turnaround, dry cleaning & automatic master folio billing.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all font-bold shadow-sm shadow-amber-500/20"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Laundry Ticket</span>
        </button>
      </div>

      {/* Laundry Orders Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Room #</th>
                <th className="py-3 px-4">Resident Guest</th>
                <th className="py-3 px-4">Service Type</th>
                <th className="py-3 px-4 text-center">Items Count</th>
                <th className="py-3 px-4 text-right">Charge ({hotelSettings.currencySymbol})</th>
                <th className="py-3 px-4 text-center">Current Status</th>
                <th className="py-3 px-4 text-right">Workflow Transition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {laundryOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-serif-luxury text-base font-bold text-amber-300">
                      Room {order.roomNumber}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-semibold text-slate-200">
                    {order.guestName}
                  </td>

                  <td className="py-3 px-4 text-slate-300">
                    {order.serviceType}
                  </td>

                  <td className="py-3 px-4 text-center font-mono font-medium text-slate-200">
                    {order.itemsCount} Garments
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                    {hotelSettings.currencySymbol}{order.totalCharge.toLocaleString()}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded inline-block ${
                      order.status === 'Delivered'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : order.status === 'Ready'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : order.status === 'Processing'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {order.status}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {order.status === 'Received' && (
                        <button
                          onClick={() => updateLaundryStatus(order.id, 'Processing')}
                          className="px-2 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold"
                        >
                          Send to Wash
                        </button>
                      )}
                      {order.status === 'Processing' && (
                        <button
                          onClick={() => updateLaundryStatus(order.id, 'Ready')}
                          className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold"
                        >
                          Mark Ready
                        </button>
                      )}
                      {order.status === 'Ready' && (
                        <button
                          onClick={() => updateLaundryStatus(order.id, 'Delivered')}
                          className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] flex items-center gap-1"
                        >
                          <Truck className="w-3 h-3" />
                          <span>Deliver to Suite</span>
                        </button>
                      )}
                      {order.status === 'Delivered' && (
                        <span className="text-[11px] text-slate-400 italic">Delivered to Suite</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {laundryOrders.length === 0 && (
          <div className="p-10 text-center text-slate-400">
            <Shirt className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm">No active laundry orders currently in process.</p>
          </div>
        )}
      </div>

      {/* CREATE LAUNDRY ORDER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-xl shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <Shirt className="w-4 h-4 text-amber-400" />
                <span>Guest Laundry Order</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleCreateLaundry} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Select Resident Suite</label>
                {occupiedRooms.length === 0 ? (
                  <p className="text-xs text-rose-400">No rooms are currently occupied by in-house guests.</p>
                ) : (
                  <select
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400"
                    required
                  >
                    {occupiedRooms.map(r => {
                      const booking = bookings.find(b => b.roomId === r.id && b.status === 'Checked-in');
                      const guest = booking ? guests.find(g => g.id === booking.guestId) : null;
                      return (
                        <option key={r.id} value={r.id}>
                          Room {r.roomNumber} - {guest ? `${guest.firstName} ${guest.lastName}` : 'Resident'}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Service Type</label>
                <select
                  value={serviceType}
                  onChange={(e) => handleServiceTypeChange(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400"
                >
                  <option value="Washing">Washing & Fold ({hotelSettings.currencySymbol}150 / item)</option>
                  <option value="Ironing">Steam Press / Ironing ({hotelSettings.currencySymbol}80 / item)</option>
                  <option value="Dry Cleaning">Dry Cleaning Deluxe ({hotelSettings.currencySymbol}300 / item)</option>
                  <option value="Complete Laundry Express">Complete Express Care 2-Hour ({hotelSettings.currencySymbol}450 / item)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Garment Count</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={itemsCount}
                  onChange={(e) => handleItemsCountChange(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Total Service Tariff ({hotelSettings.currencySymbol})</label>
                <input
                  type="number"
                  value={totalCharge}
                  onChange={(e) => setTotalCharge(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono font-bold text-amber-300"
                  required
                />
              </div>

              <div className="p-2.5 bg-slate-950 rounded text-[11px] text-slate-400">
                Notice: This charge will be automatically added to the resident's master folio billing statement.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={occupiedRooms.length === 0}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded disabled:opacity-50"
                >
                  Confirm Laundry Pickup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
