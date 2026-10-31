import React from 'react';
import { Menu, Plus, Calendar, Bell, ShieldCheck, RefreshCw } from 'lucide-react';
import { useHotel } from '../context/HotelContext';
import { ActiveTab } from './Sidebar';

interface HeaderProps {
  activeTab: ActiveTab;
  onOpenNewBookingModal: () => void;
  onToggleMobileMenu: () => void;
}

const tabTitles: Record<ActiveTab, { title: string; subtitle: string }> = {
  dashboard: { title: 'Executive Overview', subtitle: 'Live property analytics, guest arrivals & financial metrics' },
  rooms: { title: 'Room Matrix & Grid', subtitle: 'Real-time room occupancy, status rack & floor layout' },
  bookings: { title: 'Reservation Engine', subtitle: 'Manage reservations, guest bookings & advance payments' },
  frontdesk: { title: 'Front Desk Operations', subtitle: 'Guest check-ins, departures, room transfers & extra folios' },
  housekeeping: { title: 'Housekeeping & Sanitization', subtitle: 'Turnover cleaning queues, amenities & supervisor approvals' },
  pos: { title: 'Restaurant POS & In-Room Dining', subtitle: 'Table ordering, Kitchen Order Tickets (KOT) & room billing' },
  inventory: { title: 'Kitchen & Operational Stock', subtitle: 'Raw material inventory, stock-in logs & consumption tracking' },
  laundry: { title: 'Laundry & Valet Services', subtitle: 'Guest laundry tracking, valet orders & service charges' },
  maintenance: { title: 'Property Maintenance', subtitle: 'Facility work orders, room blocking & emergency repair logs' },
  folios: { title: 'Billing, Invoices & Folios', subtitle: 'Guest master invoices, GST calculations & payment settlements' },
  reports: { title: 'Financial & Operational Reports', subtitle: 'RevPAR, ADR, occupancy rates, P&L statements & CSV exports' },
  staff: { title: 'Staff Directory & Roles', subtitle: 'Employee accounts, role-based access control & shift duties' },
  settings: { title: 'Hotel Configuration & Backup', subtitle: 'Property profile, GST rates, currency, backup export & restore' },
  php_export: { title: 'PHP & MySQL (XAMPP)', subtitle: 'Complete converted PHP application & Google Chrome execution guide' }
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenNewBookingModal,
  onToggleMobileMenu
}) => {
  const { hotelSettings, rooms, bookings, currentUser } = useHotel();
  const currentInfo = tabTitles[activeTab] || { title: 'Hotel PMS', subtitle: 'Management System' };

  // Calculate live occupancy
  const occupiedCount = rooms.filter(r => r.status === 'Occupied').length;
  const totalCount = rooms.length;
  const occupancyRate = totalCount > 0 ? ((occupiedCount / totalCount) * 100).toFixed(0) : '0';

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900/90 backdrop-blur-md border-b border-amber-500/15 px-4 md:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 text-slate-400 hover:text-amber-300 rounded-lg hover:bg-slate-800"
          aria-label="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-sm md:text-base font-bold text-slate-100 flex items-center gap-2">
            <span>{currentInfo.title}</span>
            <span className="hidden sm:inline-block text-[10px] text-amber-400/80 uppercase px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 font-medium">
              {hotelSettings.currencySymbol} {hotelSettings.currencyCode}
            </span>
          </h2>
          <p className="hidden md:block text-xs text-slate-400 truncate max-w-md">
            {currentInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Date, Live Occupancy & Quick Action */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 border-r border-slate-800 pr-3">
          <Calendar className="w-3.5 h-3.5 text-amber-400/70" />
          <span>{todayStr}</span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/60">
          <span className="text-slate-400">Occupancy:</span>
          <span className="font-semibold text-amber-300 tabular-nums">{occupancyRate}%</span>
          <span className="text-[11px] text-slate-500">({occupiedCount}/{totalCount})</span>
        </div>

        <button
          onClick={onOpenNewBookingModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 hover:from-amber-300 hover:to-amber-400 transition-all shadow-sm shadow-amber-500/20 whitespace-nowrap active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Reservation</span>
        </button>
      </div>
    </header>
  );
};
