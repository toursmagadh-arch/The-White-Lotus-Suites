import React from 'react';
import {
  LayoutDashboard,
  KeyRound,
  CalendarCheck,
  UserCheck,
  Sparkles,
  UtensilsCrossed,
  Boxes,
  Shirt,
  Wrench,
  Receipt,
  BarChart3,
  Users,
  Settings,
  Hotel,
  LogOut,
  X,
  FileCode
} from 'lucide-react';
import { useHotel } from '../context/HotelContext';

export type ActiveTab =
  | 'dashboard'
  | 'rooms'
  | 'bookings'
  | 'frontdesk'
  | 'housekeeping'
  | 'pos'
  | 'inventory'
  | 'laundry'
  | 'maintenance'
  | 'folios'
  | 'reports'
  | 'staff'
  | 'settings'
  | 'php_export';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  setIsOpenMobile
}) => {
  const { hotelSettings, currentUser, users, setCurrentUser } = useHotel();

  const navCategories = [
    {
      category: 'Core Operations',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'rooms', label: 'Room Matrix', icon: KeyRound },
        { id: 'bookings', label: 'Reservations', icon: CalendarCheck },
        { id: 'frontdesk', label: 'Front Desk', icon: UserCheck }
      ]
    },
    {
      category: 'Services & Dining',
      items: [
        { id: 'housekeeping', label: 'Housekeeping', icon: Sparkles },
        { id: 'pos', label: 'Restaurant POS', icon: UtensilsCrossed },
        { id: 'inventory', label: 'Kitchen & Stock', icon: Boxes },
        { id: 'laundry', label: 'Laundry & Extras', icon: Shirt },
        { id: 'maintenance', label: 'Maintenance', icon: Wrench }
      ]
    },
    {
      category: 'Finance & Admin',
      items: [
        { id: 'folios', label: 'Billing & Folios', icon: Receipt },
        { id: 'reports', label: 'Reports & P&L', icon: BarChart3 },
        { id: 'staff', label: 'Staff & Roles', icon: Users },
        { id: 'settings', label: 'Hotel Settings', icon: Settings }
      ]
    },
    {
      category: 'PHP & MySQL (XAMPP)',
      items: [
        { id: 'php_export', label: 'PHP Code & Chrome Guide', icon: FileCode }
      ]
    }
  ];

  const handleSelectTab = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    setIsOpenMobile(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs md:hidden"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-72 bg-slate-900 border-r border-amber-500/20 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Banner */}
        <div className="p-5 border-b border-amber-500/15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
              <Hotel className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="font-serif-luxury text-base font-bold tracking-wider text-amber-200 uppercase leading-tight">
                Grand Royale
              </h1>
              <p className="text-[11px] text-amber-500/80 uppercase tracking-widest font-medium">
                Hotel & Spa PMS
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpenMobile(false)}
            className="md:hidden p-1.5 rounded text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navCategories.map((group) => (
            <div key={group.category}>
              <h2 className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-amber-500/70">
                {group.category}
              </h2>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id as ActiveTab)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-all text-left whitespace-nowrap ${
                        isActive
                          ? 'bg-amber-500/15 text-amber-300 border-l-2 border-amber-400 font-semibold'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Profile & Switcher */}
        <div className="p-3.5 border-t border-amber-500/15 bg-slate-950/50">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs font-semibold text-slate-200 truncate max-w-[170px]">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-amber-400/90 font-medium">
                {currentUser.role}
              </p>
            </div>
            <select
              aria-label="Switch User Profile"
              value={currentUser.id}
              onChange={(e) => {
                const found = users.find(u => u.id === e.target.value);
                if (found) setCurrentUser(found);
              }}
              className="text-[11px] bg-slate-800 text-slate-300 border border-slate-700 rounded px-1.5 py-1 focus:border-amber-400 focus:outline-hidden"
              title="Switch user role perspective"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.role.substring(0, 8)}: {u.name.split(' ')[0]}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[10px] text-slate-400 truncate">
            {hotelSettings.city}, {hotelSettings.country}
          </p>
        </div>
      </aside>
    </>
  );
};
