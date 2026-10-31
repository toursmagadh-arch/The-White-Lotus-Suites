/**
 * The Grand Royale Palace Hotel & Spa — Hotel Management System (PMS)
 */

import React, { useState } from 'react';
import { HotelProvider } from './context/HotelContext';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { RoomsView } from './components/RoomsView';
import { BookingsView } from './components/BookingsView';
import { FrontDeskView } from './components/FrontDeskView';
import { HousekeepingView } from './components/HousekeepingView';
import { RestaurantPOSView } from './components/RestaurantPOSView';
import { InventoryView } from './components/InventoryView';
import { LaundryView } from './components/LaundryView';
import { MaintenanceView } from './components/MaintenanceView';
import { FoliosView } from './components/FoliosView';
import { ReportsView } from './components/ReportsView';
import { StaffView } from './components/StaffView';
import { SettingsView } from './components/SettingsView';
import { PhpCodeView } from './components/PhpCodeView';
import { FolioModal } from './components/FolioModal';
import { VoucherModal } from './components/VoucherModal';
import { NewBookingModal } from './components/NewBookingModal';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);

  // Global Modal States
  const [activeFolioId, setActiveFolioId] = useState<string | null>(null);
  const [activeVoucherBookingId, setActiveVoucherBookingId] = useState<string | null>(null);
  const [isNewBookingOpen, setIsNewBookingOpen] = useState<boolean>(false);
  const [preselectedRoomId, setPreselectedRoomId] = useState<string | undefined>(undefined);

  const handleOpenNewBooking = (roomId?: string) => {
    setPreselectedRoomId(roomId);
    setIsNewBookingOpen(true);
  };

  const handleBookingCreated = (bookingId: string) => {
    // Optionally open voucher upon booking confirmation
    setActiveVoucherBookingId(bookingId);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased selection:bg-amber-500/20 selection:text-amber-300">
      
      {/* Responsive Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpenMobile={isMobileNavOpen}
        setIsOpenMobile={setIsMobileNavOpen}
      />

      {/* Main Viewport Container */}
      <div className="flex-1 md:pl-72 flex flex-col min-h-screen min-w-0">
        
        {/* Sticky Top Header */}
        <Header
          activeTab={activeTab}
          onOpenNewBookingModal={() => handleOpenNewBooking()}
          onToggleMobileMenu={() => setIsMobileNavOpen(prev => !prev)}
        />

        {/* Dynamic Viewport Section */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigate={(tab) => setActiveTab(tab)}
              onViewFolio={(id) => setActiveFolioId(id)}
              onViewVoucher={(id) => setActiveVoucherBookingId(id)}
              onOpenNewBooking={() => handleOpenNewBooking()}
            />
          )}

          {activeTab === 'rooms' && (
            <RoomsView
              onOpenNewBookingWithRoom={(roomId) => handleOpenNewBooking(roomId)}
              onViewFolio={(id) => setActiveFolioId(id)}
            />
          )}

          {activeTab === 'bookings' && (
            <BookingsView
              onOpenNewBookingModal={() => handleOpenNewBooking()}
              onViewFolio={(id) => setActiveFolioId(id)}
              onViewVoucher={(id) => setActiveVoucherBookingId(id)}
            />
          )}

          {activeTab === 'frontdesk' && (
            <FrontDeskView
              onViewFolio={(id) => setActiveFolioId(id)}
              onViewVoucher={(id) => setActiveVoucherBookingId(id)}
            />
          )}

          {activeTab === 'housekeeping' && <HousekeepingView />}

          {activeTab === 'pos' && <RestaurantPOSView />}

          {activeTab === 'inventory' && <InventoryView />}

          {activeTab === 'laundry' && <LaundryView />}

          {activeTab === 'maintenance' && <MaintenanceView />}

          {activeTab === 'folios' && (
            <FoliosView
              onViewFolio={(id) => setActiveFolioId(id)}
            />
          )}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'staff' && <StaffView />}

          {activeTab === 'settings' && <SettingsView />}

          {activeTab === 'php_export' && <PhpCodeView />}
        </main>
      </div>

      {/* Global Modals */}
      <FolioModal
        folioId={activeFolioId}
        onClose={() => setActiveFolioId(null)}
      />

      <VoucherModal
        bookingId={activeVoucherBookingId}
        onClose={() => setActiveVoucherBookingId(null)}
      />

      <NewBookingModal
        isOpen={isNewBookingOpen}
        onClose={() => {
          setIsNewBookingOpen(false);
          setPreselectedRoomId(undefined);
        }}
        preselectedRoomId={preselectedRoomId}
        onBookingCreated={handleBookingCreated}
      />
    </div>
  );
};

export default function App() {
  return (
    <HotelProvider>
      <AppContent />
    </HotelProvider>
  );
}
