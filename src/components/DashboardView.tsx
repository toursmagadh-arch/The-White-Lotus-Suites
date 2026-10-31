import React from 'react';
import {
  Bed,
  CheckCircle,
  Users,
  Clock,
  Sparkles,
  Wrench,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Receipt,
  FileText
} from 'lucide-react';
import { useHotel } from '../context/HotelContext';
import { ActiveTab } from './Sidebar';

interface DashboardViewProps {
  onNavigate: (tab: ActiveTab) => void;
  onViewFolio: (folioId: string) => void;
  onViewVoucher: (bookingId: string) => void;
  onOpenNewBooking: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onViewFolio,
  onViewVoucher,
  onOpenNewBooking
}) => {
  const {
    rooms,
    bookings,
    folios,
    guests,
    roomTypes,
    restaurantOrders,
    maintenanceTickets,
    housekeepingTasks,
    expenses,
    hotelSettings,
    checkInGuest,
    checkOutGuest
  } = useHotel();

  const todayStr = new Date().toISOString().split('T')[0];

  // Room Counts
  const totalRooms = rooms.length;
  const availableRooms = rooms.filter(r => r.status === 'Available').length;
  const occupiedRooms = rooms.filter(r => r.status === 'Occupied').length;
  const reservedRooms = rooms.filter(r => r.status === 'Reserved').length;
  const dirtyRooms = rooms.filter(r => r.status === 'Dirty' || r.cleaningStatus === 'Dirty').length;
  const cleaningRooms = rooms.filter(r => r.status === 'Cleaning' || r.cleaningStatus === 'Cleaning in Progress').length;
  const readyRooms = rooms.filter(r => r.cleaningStatus === 'Ready').length;
  const maintenanceRooms = rooms.filter(r => r.status === 'Maintenance').length;

  const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : '0';

  // Operations today
  const todayArrivals = bookings.filter(b => b.checkInDate === todayStr && b.status === 'Confirmed');
  const todayDepartures = bookings.filter(b => b.checkOutDate === todayStr && b.status === 'Checked-in');
  const activeInHouseGuests = bookings
    .filter(b => b.status === 'Checked-in')
    .reduce((sum, b) => sum + b.adults + b.children, 0);

  // Financials today & summary
  const todayRevenue = folios.reduce((sum, f) => {
    const todayPayments = f.payments
      .filter(p => p.createdAt.startsWith(todayStr))
      .reduce((pSum, p) => pSum + p.amount, 0);
    return sum + todayPayments;
  }, 0);

  const todayRestaurantSales = restaurantOrders
    .filter(o => o.createdAt.startsWith(todayStr))
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const totalExpensesLogged = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalCumulativePayments = folios.reduce((sum, f) => sum + f.paidAmount, 0);
  const estimatedNetProfit = totalCumulativePayments - totalExpensesLogged;

  // Recent 6 bookings
  const recentBookings = [...bookings].reverse().slice(0, 6);

  return (
    <div className="space-y-6">
      
      {/* 8 Primary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Total Rooms */}
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Rooms</span>
            <Bed className="w-3.5 h-3.5 text-amber-400/80" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-100">{totalRooms}</div>
          <div className="text-[11px] text-amber-400/90 font-medium mt-1">Occupancy: {occupancyRate}%</div>
        </div>

        {/* Available Ready */}
        <div className="bg-slate-900/90 border border-emerald-500/20 p-3.5 rounded-xl flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Available</span>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">{availableRooms}</div>
          <div className="text-[11px] text-emerald-300/80 font-medium mt-1">{readyRooms} Ready for check-in</div>
        </div>

        {/* Occupied */}
        <div className="bg-slate-900/90 border border-blue-500/20 p-3.5 rounded-xl flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Occupied</span>
            <Users className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-blue-400">{occupiedRooms}</div>
          <div className="text-[11px] text-blue-300/80 font-medium mt-1">{activeInHouseGuests} Guests In-House</div>
        </div>

        {/* Reserved */}
        <div className="bg-slate-900/90 border border-amber-500/20 p-3.5 rounded-xl flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Reserved</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-400">{reservedRooms}</div>
          <div className="text-[11px] text-amber-300/80 font-medium mt-1">Today's Inbound</div>
        </div>

        {/* Dirty */}
        <div className="bg-slate-900/90 border border-rose-500/20 p-3.5 rounded-xl flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Dirty</span>
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-400">{dirtyRooms}</div>
          <div className="text-[11px] text-rose-300/80 font-medium mt-1">Needs Turnover</div>
        </div>

        {/* Under Cleaning */}
        <div className="bg-slate-900/90 border border-purple-500/20 p-3.5 rounded-xl flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Cleaning</span>
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-purple-400">{cleaningRooms}</div>
          <div className="text-[11px] text-purple-300/80 font-medium mt-1">Staff In-Progress</div>
        </div>

        {/* Maintenance */}
        <div className="bg-slate-900/90 border border-slate-700 p-3.5 rounded-xl flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Out of Order</span>
            <Wrench className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-300">{maintenanceRooms}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Locked from Sale</div>
        </div>

        {/* Today's Rev */}
        <div className="bg-slate-900/90 border border-amber-500/30 p-3.5 rounded-xl flex flex-col justify-between shadow-xs bg-gradient-to-br from-amber-500/5 to-transparent">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Today's Cash</span>
            <DollarSign className="w-3.5 h-3.5 text-amber-300" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-amber-300">
            {hotelSettings.currencySymbol}{todayRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-400/90 font-medium mt-1">
            F&B: {hotelSettings.currencySymbol}{todayRestaurantSales.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Visual Room Status Distribution Bar */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
        <div className="flex justify-between items-center mb-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Room Inventory Status Distribution
          </h3>
          <button
            onClick={() => onNavigate('rooms')}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
          >
            <span>View Full Grid</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Stacked Percentage Bar */}
        <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-950">
          <div style={{ width: `${(availableRooms / totalRooms) * 100}%` }} className="bg-emerald-500 transition-all" title={`Available: ${availableRooms}`} />
          <div style={{ width: `${(occupiedRooms / totalRooms) * 100}%` }} className="bg-blue-500 transition-all" title={`Occupied: ${occupiedRooms}`} />
          <div style={{ width: `${(reservedRooms / totalRooms) * 100}%` }} className="bg-amber-500 transition-all" title={`Reserved: ${reservedRooms}`} />
          <div style={{ width: `${(dirtyRooms / totalRooms) * 100}%` }} className="bg-rose-500 transition-all" title={`Dirty: ${dirtyRooms}`} />
          <div style={{ width: `${(cleaningRooms / totalRooms) * 100}%` }} className="bg-purple-500 transition-all" title={`Cleaning: ${cleaningRooms}`} />
          <div style={{ width: `${(maintenanceRooms / totalRooms) * 100}%` }} className="bg-slate-600 transition-all" title={`Maintenance: ${maintenanceRooms}`} />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" /> Available ({availableRooms})</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-blue-500 inline-block" /> Occupied ({occupiedRooms})</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" /> Reserved ({reservedRooms})</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" /> Dirty ({dirtyRooms})</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-purple-500 inline-block" /> Cleaning ({cleaningRooms})</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-slate-600 inline-block" /> Maintenance ({maintenanceRooms})</span>
        </div>
      </div>

      {/* Two Column Grid: Today's Operations Hub & Financial Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Today's Expected Check-ins & Check-outs */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Today's Front Desk Activity</span>
                <span className="text-[11px] font-semibold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10">
                  {todayArrivals.length} Arrivals · {todayDepartures.length} Departures
                </span>
              </h3>
            </div>
            <button
              onClick={() => onNavigate('frontdesk')}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium"
            >
              Open Front Desk
            </button>
          </div>

          {/* Arrivals List */}
          <div className="space-y-2">
            <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              Expected Arrivals Today ({todayArrivals.length})
            </p>
            {todayArrivals.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-1">No pending arrivals scheduled for today.</p>
            ) : (
              todayArrivals.map(b => {
                const guest = guests.find(g => g.id === b.guestId);
                const room = rooms.find(r => r.id === b.roomId);
                const roomType = room ? roomTypes.find(rt => rt.id === room.roomTypeId) : null;
                return (
                  <div key={b.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 text-xs">
                    <div>
                      <p className="font-semibold text-slate-200">
                        {guest ? `${guest.firstName} ${guest.lastName}` : 'Guest'}
                        {guest?.vipStatus && <span className="ml-1.5 text-[10px] text-amber-400 font-bold">★ VIP</span>}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Room {room?.roomNumber} ({roomType?.name}) · {b.totalNights} Nights
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const res = checkInGuest(b.id);
                          if (!res.success) alert(res.error);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold"
                      >
                        Check In
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Departures List */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              Departures Scheduled Today ({todayDepartures.length})
            </p>
            {todayDepartures.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-1">No guest departures due today.</p>
            ) : (
              todayDepartures.map(b => {
                const guest = guests.find(g => g.id === b.guestId);
                const room = rooms.find(r => r.id === b.roomId);
                const folio = folios.find(f => f.bookingId === b.id);
                return (
                  <div key={b.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 text-xs">
                    <div>
                      <p className="font-semibold text-slate-200">
                        {guest ? `${guest.firstName} ${guest.lastName}` : 'Guest'} · Room {room?.roomNumber}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Balance: <span className={folio && folio.balanceAmount > 1 ? 'text-rose-400 font-semibold' : 'text-emerald-400'}>
                          {hotelSettings.currencySymbol}{folio?.balanceAmount.toLocaleString()}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {folio && (
                        <button
                          onClick={() => onViewFolio(folio.id)}
                          className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700"
                        >
                          Folio
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const res = checkOutGuest(b.id);
                          if (!res.success) {
                            if (confirm(`${res.error}\nDo you want to proceed with check-out anyway?`)) {
                              checkOutGuest(b.id, true);
                            }
                          }
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-700 text-slate-200 hover:bg-slate-600"
                      >
                        Check Out
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Financial & Revenue Performance */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Financial Health & RevPAR</span>
              </h3>
              <button
                onClick={() => onNavigate('reports')}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium"
              >
                Detailed P&L
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 my-4">
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Total Revenue Collected</p>
                <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
                  {hotelSettings.currencySymbol}{totalCumulativePayments.toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">All settled guest folios</p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Operational Expenses</p>
                <p className="text-xl font-bold font-mono text-rose-400 mt-1">
                  {hotelSettings.currencySymbol}{totalExpensesLogged.toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">Utilities, stock & repairs</p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs space-y-1">
              <div className="flex justify-between font-bold text-sm text-amber-300">
                <span>Net Estimated Operating Profit:</span>
                <span className="font-mono">{hotelSettings.currencySymbol}{estimatedNetProfit.toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Calculated dynamically from live guest collections minus logged operational costs.
              </p>
            </div>
          </div>

          {/* Quick Housekeeping & Maintenance Alert */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{housekeepingTasks.filter(t => t.status !== 'Approved').length} Housekeeping tasks in queue</span>
            </span>
            <button
              onClick={() => onNavigate('housekeeping')}
              className="text-amber-400 hover:underline"
            >
              Assign Cleaners →
            </button>
          </div>
        </div>
      </div>

      {/* Recent Reservations Live Feed */}
      <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-100">
            Recent Live Reservations & Bookings
          </h3>
          <button
            onClick={() => onNavigate('bookings')}
            className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
          >
            <span>All Reservations ({bookings.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Booking Code</th>
                <th className="py-2.5 px-3">Guest</th>
                <th className="py-2.5 px-3">Room Assigned</th>
                <th className="py-2.5 px-3">Stay Dates</th>
                <th className="py-2.5 px-3 text-right">Tariff</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentBookings.map(b => {
                const guest = guests.find(g => g.id === b.guestId);
                const room = rooms.find(r => r.id === b.roomId);
                const roomType = room ? roomTypes.find(rt => rt.id === room.roomTypeId) : null;
                const folio = folios.find(f => f.bookingId === b.id);
                return (
                  <tr key={b.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-mono font-semibold text-amber-300">{b.bookingCode}</td>
                    <td className="py-2.5 px-3">
                      <p className="font-semibold text-slate-200">{guest ? `${guest.firstName} ${guest.lastName}` : 'Guest'}</p>
                      <p className="text-[11px] text-slate-400">{guest?.phone}</p>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-slate-200">Room {room?.roomNumber}</span>
                      <span className="text-[11px] text-slate-400 block">{roomType?.name}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {b.checkInDate} → {b.checkOutDate} ({b.totalNights}n)
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-200">
                      {hotelSettings.currencySymbol}{b.roomSubtotal.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        b.status === 'Checked-in'
                          ? 'bg-blue-500/20 text-blue-300'
                          : b.status === 'Confirmed'
                          ? 'bg-amber-500/20 text-amber-300'
                          : b.status === 'Checked-out'
                          ? 'bg-slate-700 text-slate-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => onViewVoucher(b.id)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] flex items-center gap-1"
                          title="Print Reservation Voucher"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Voucher</span>
                        </button>
                        {folio && (
                          <button
                            onClick={() => onViewFolio(folio.id)}
                            className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] flex items-center gap-1"
                            title="View Folio & Bill"
                          >
                            <Receipt className="w-3 h-3" />
                            <span>Folio</span>
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
      </div>
    </div>
  );
};
