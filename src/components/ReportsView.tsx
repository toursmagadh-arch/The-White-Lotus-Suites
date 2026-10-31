import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Printer,
  PieChart,
  DollarSign,
  Calendar,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { useHotel } from '../context/HotelContext';

export const ReportsView: React.FC = () => {
  const {
    hotelSettings,
    rooms,
    bookings,
    folios,
    roomTypes,
    restaurantOrders,
    expenses
  } = useHotel();

  // Metrics computation
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.status === 'Occupied').length;
  const occupancyPercent = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : '0';

  // Total Room Revenue from completed & active bookings
  const totalRoomRevenue = bookings.reduce((sum, b) => {
    if (['Checked-in', 'Checked-out'].includes(b.status)) {
      return sum + b.roomSubtotal;
    }
    return sum;
  }, 0);

  const totalNightsSold = bookings.reduce((sum, b) => {
    if (['Checked-in', 'Checked-out'].includes(b.status)) {
      return sum + b.totalNights;
    }
    return sum;
  }, 0);

  // ADR & RevPAR
  const adr = totalNightsSold > 0 ? (totalRoomRevenue / totalNightsSold).toFixed(0) : '0';
  const revpar = totalRooms > 0 ? (totalRoomRevenue / totalRooms).toFixed(0) : '0';

  // F&B Revenue
  const totalFnbRevenue = restaurantOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Laundry & Other Services
  const totalExtraRevenue = folios.reduce((sum, f) => {
    const extras = f.extraCharges.reduce((s, c) => s + c.amount, 0);
    return sum + f.laundryCharge + extras;
  }, 0);

  // Total Gross Revenue
  const grossHospitalityRevenue = totalRoomRevenue + totalFnbRevenue + totalExtraRevenue;
  const totalOperatingExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netOperatingProfit = grossHospitalityRevenue - totalOperatingExpenses;

  // Revenue by Room Type
  const revenueByCategory = roomTypes.map(rt => {
    const roomsOfType = rooms.filter(r => r.roomTypeId === rt.id).map(r => r.id);
    const rev = bookings
      .filter(b => roomsOfType.includes(b.roomId) && ['Checked-in', 'Checked-out'].includes(b.status))
      .reduce((sum, b) => sum + b.roomSubtotal, 0);
    const percent = totalRoomRevenue > 0 ? ((rev / totalRoomRevenue) * 100).toFixed(1) : '0';
    return {
      name: rt.name,
      baseRate: rt.baseRate,
      roomCount: roomsOfType.length,
      revenue: rev,
      percentage: percent
    };
  });

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Metric', 'Value', 'Unit/Currency'];
    const rows = [
      ['Hotel Legal Name', hotelSettings.name, ''],
      ['Total Room Inventory', totalRooms.toString(), 'Rooms'],
      ['Occupied Rooms', occupiedRooms.toString(), 'Rooms'],
      ['Live Occupancy Rate', `${occupancyPercent}%`, 'Percentage'],
      ['Average Daily Rate (ADR)', adr, hotelSettings.currencyCode],
      ['Revenue Per Available Room (RevPAR)', revpar, hotelSettings.currencyCode],
      ['Total Room Accommodation Revenue', totalRoomRevenue.toString(), hotelSettings.currencyCode],
      ['Total F&B Restaurant Revenue', totalFnbRevenue.toString(), hotelSettings.currencyCode],
      ['Total Laundry & Extra Services', totalExtraRevenue.toString(), hotelSettings.currencyCode],
      ['Gross Operating Revenue', grossHospitalityRevenue.toString(), hotelSettings.currencyCode],
      ['Total Operating Expenses', totalOperatingExpenses.toString(), hotelSettings.currencyCode],
      ['Net Operating Income / Profit', netOperatingProfit.toString(), hotelSettings.currencyCode]
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => `"${e.join('","')}"`)].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Grand_Royale_Financial_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Action Header */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <span>Executive Financial & Hospitality Intelligence</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Key hotel metrics, RevPAR, department P&L distribution, and audit data export.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Executive Audit</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (ADR, RevPAR, Occupancy, Net Profit) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span className="uppercase font-semibold">ADR (Average Daily Rate)</span>
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-100 mt-2">
            {hotelSettings.currencySymbol}{parseInt(adr).toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Total revenue / Room nights sold</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span className="uppercase font-semibold">RevPAR (Per Avail. Room)</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-400 mt-2">
            {hotelSettings.currencySymbol}{parseInt(revpar).toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Across all {totalRooms} property suites</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span className="uppercase font-semibold">Live Occupancy Rate</span>
            <PieChart className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-blue-400 mt-2">
            {occupancyPercent}%
          </p>
          <p className="text-[11px] text-slate-500 mt-1">{occupiedRooms} of {totalRooms} suites occupied</p>
        </div>

        <div className="bg-slate-900/90 border border-amber-500/30 p-4 rounded-xl bg-gradient-to-br from-amber-500/5 to-transparent">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span className="uppercase font-semibold">Net Operating Income</span>
            <DollarSign className="w-3.5 h-3.5 text-amber-300" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-300 mt-2">
            {hotelSettings.currencySymbol}{netOperatingProfit.toLocaleString()}
          </p>
          <p className="text-[11px] text-amber-400/80 mt-1">Revenue minus operating expenses</p>
        </div>
      </div>

      {/* Two Column Grid: Revenue by Room Category & Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue by Room Category */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Accommodation Revenue by Suite Category</span>
          </h3>

          <div className="space-y-3">
            {revenueByCategory.map(cat => (
              <div key={cat.name} className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-200">{cat.name} ({cat.roomCount} Rooms)</span>
                  <span className="font-mono text-slate-300 font-bold">
                    {hotelSettings.currencySymbol}{cat.revenue.toLocaleString()} <span className="text-slate-500">({cat.percentage}%)</span>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    style={{ width: `${cat.percentage}%` }}
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Departmental Revenue Distribution */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              <span>Departmental Revenue Contribution</span>
            </h3>

            <div className="mt-4 space-y-2 text-xs divide-y divide-slate-800/80">
              <div className="pt-2 flex justify-between items-center">
                <span className="text-slate-300 font-medium">Room Accommodation (PMS)</span>
                <span className="font-mono font-bold text-slate-100">
                  {hotelSettings.currencySymbol}{totalRoomRevenue.toLocaleString()}
                </span>
              </div>
              <div className="pt-2 flex justify-between items-center">
                <span className="text-slate-300 font-medium">Restaurant Dining & Room Service (POS)</span>
                <span className="font-mono font-bold text-slate-100">
                  {hotelSettings.currencySymbol}{totalFnbRevenue.toLocaleString()}
                </span>
              </div>
              <div className="pt-2 flex justify-between items-center">
                <span className="text-slate-300 font-medium">Laundry, Spa, Airport Transfer & Extras</span>
                <span className="font-mono font-bold text-slate-100">
                  {hotelSettings.currencySymbol}{totalExtraRevenue.toLocaleString()}
                </span>
              </div>
              <div className="pt-3 flex justify-between items-center font-bold text-sm text-amber-300">
                <span>Gross Revenue:</span>
                <span className="font-mono">
                  {hotelSettings.currencySymbol}{grossHospitalityRevenue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg text-xs text-slate-400">
            Real-time multi-department financial synchronization across Front Desk, F&B Point of Sale, and Housekeeping.
          </div>
        </div>
      </div>

      {/* Operating Expenses Breakdown Table */}
      <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl space-y-3">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-rose-400" />
          <span>Operational Expenditure Register ({expenses.length} Records)</span>
        </h3>
        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Expense Particulars</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Amount ({hotelSettings.currencySymbol})</th>
                <th className="py-2.5 px-3">Audit Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {expenses.map(exp => (
                <tr key={exp.id}>
                  <td className="py-2 px-3 font-mono text-slate-400">{exp.date}</td>
                  <td className="py-2 px-3 font-semibold text-slate-200">{exp.title}</td>
                  <td className="py-2 px-3 text-slate-400">{exp.category}</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-rose-400">
                    {hotelSettings.currencySymbol}{exp.amount.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-slate-500 italic">{exp.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
