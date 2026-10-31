import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  HotelSettings,
  RoomType,
  Room,
  Guest,
  Booking,
  Folio,
  HousekeepingTask,
  MenuItem,
  RestaurantTable,
  RestaurantOrder,
  InventoryItem,
  StockMovement,
  LaundryOrder,
  MaintenanceTicket,
  ExpenseRecord,
  User,
  AuditLogEntry,
  FolioExtraCharge,
  CleaningStatus,
  RoomStatus
} from '../types/hotel';

import {
  initialHotelSettings,
  initialUsers,
  initialRoomTypes,
  initialRooms,
  initialGuests,
  initialBookings,
  initialFolios,
  initialHousekeepingTasks,
  initialMenuItems,
  initialTables,
  initialOrders,
  initialInventory,
  initialStockMovements,
  initialLaundryOrders,
  initialMaintenanceTickets,
  initialExpenses,
  initialAuditLogs
} from '../data/initialData';

const STORAGE_KEY = 'grand_royale_hotel_pms_data_v2';

interface HotelContextType {
  // Current user & authentication
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  addUser: (user: Omit<User, 'id'>) => void;

  // Settings
  hotelSettings: HotelSettings;
  updateHotelSettings: (settings: Partial<HotelSettings>) => void;

  // Rooms & Categories
  roomTypes: RoomType[];
  rooms: Room[];
  addRoom: (room: Omit<Room, 'id'>) => { success: boolean; error?: string };
  updateRoom: (id: string, updates: Partial<Room>) => void;
  deleteRoom: (id: string) => { success: boolean; error?: string };
  updateRoomStatus: (roomId: string, status: RoomStatus) => void;
  updateRoomCleaningStatus: (roomId: string, cleaningStatus: CleaningStatus) => void;

  // Guests & Bookings
  guests: Guest[];
  bookings: Booking[];
  folios: Folio[];
  checkAvailability: (checkIn: string, checkOut: string, roomTypeId?: string, excludeBookingId?: string) => Room[];
  createBooking: (
    bookingData: {
      roomId: string;
      checkInDate: string;
      checkOutDate: string;
      adults: number;
      children: number;
      bookingSource: Booking['bookingSource'];
      specialRequests?: string;
    },
    guestInfo: {
      isExisting: boolean;
      guestId?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      idType?: Guest['idType'];
      idNumber?: string;
      city?: string;
      country?: string;
      vipStatus?: boolean;
    },
    advancePayment?: number,
    paymentMethod?: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer'
  ) => { success: boolean; bookingId?: string; bookingCode?: string; error?: string };
  modifyBooking: (bookingId: string, updates: Partial<Booking>) => void;
  cancelBooking: (bookingId: string, reason?: string) => void;

  // Front Desk
  checkInGuest: (bookingId: string) => { success: boolean; error?: string };
  checkOutGuest: (bookingId: string, force?: boolean) => { success: boolean; balanceRemaining?: number; error?: string };
  transferRoom: (bookingId: string, targetRoomId: string, reason: string) => { success: boolean; error?: string };
  addFolioExtraCharge: (folioId: string, charge: Omit<FolioExtraCharge, 'id' | 'createdAt'>) => void;
  recordPayment: (
    folioId: string,
    amount: number,
    paymentMethod: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer',
    transactionRef?: string,
    notes?: string
  ) => { success: boolean; error?: string };

  // Housekeeping
  housekeepingTasks: HousekeepingTask[];
  addHousekeepingTask: (task: Omit<HousekeepingTask, 'id'>) => void;
  updateHousekeepingTask: (id: string, updates: Partial<HousekeepingTask>) => void;

  // Restaurant & POS
  menuItems: MenuItem[];
  restaurantTables: RestaurantTable[];
  restaurantOrders: RestaurantOrder[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  createRestaurantOrder: (
    orderData: {
      orderType: 'Dine-in' | 'Takeaway' | 'Room Service';
      tableId?: string;
      roomId?: string;
      items: { menuItemId: string; quantity: number }[];
      billedToRoom?: boolean;
    }
  ) => { success: boolean; orderId?: string; orderNumber?: string; error?: string };
  updateOrderStatus: (orderId: string, status: RestaurantOrder['status']) => void;

  // Inventory
  inventory: InventoryItem[];
  stockMovements: StockMovement[];
  recordStockMovement: (
    itemId: string,
    movementType: 'IN' | 'OUT' | 'WASTE' | 'ADJUSTMENT',
    quantity: number,
    reason: string
  ) => { success: boolean; error?: string };
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;

  // Laundry
  laundryOrders: LaundryOrder[];
  addLaundryOrder: (order: Omit<LaundryOrder, 'id' | 'createdAt'>) => void;
  updateLaundryStatus: (orderId: string, status: LaundryOrder['status']) => void;

  // Maintenance
  maintenanceTickets: MaintenanceTicket[];
  addMaintenanceTicket: (ticket: Omit<MaintenanceTicket, 'id' | 'reportedAt'>) => void;
  resolveMaintenanceTicket: (ticketId: string, finalExpense?: number) => void;

  // Expenses & Finance
  expenses: ExpenseRecord[];
  addExpense: (expense: Omit<ExpenseRecord, 'id'>) => void;

  // Audit Logs
  auditLogs: AuditLogEntry[];
  logAudit: (action: string, details: string) => void;

  // System & Backup
  resetToDefaultData: () => void;
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonString: string) => { success: boolean; error?: string };
}

const HotelContext = createContext<HotelContextType | undefined>(undefined);

export const HotelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load saved state or default
  const [isLoaded, setIsLoaded] = useState(false);

  const [hotelSettings, setHotelSettings] = useState<HotelSettings>(initialHotelSettings);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [currentUser, setCurrentUser] = useState<User>(initialUsers[0]);
  const [roomTypes] = useState<RoomType[]>(initialRoomTypes);
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [folios, setFolios] = useState<Folio[]>(initialFolios);
  const [housekeepingTasks, setHousekeepingTasks] = useState<HousekeepingTask[]>(initialHousekeepingTasks);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [restaurantTables, setRestaurantTables] = useState<RestaurantTable[]>(initialTables);
  const [restaurantOrders, setRestaurantOrders] = useState<RestaurantOrder[]>(initialOrders);
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(initialStockMovements);
  const [laundryOrders, setLaundryOrders] = useState<LaundryOrder[]>(initialLaundryOrders);
  const [maintenanceTickets, setMaintenanceTickets] = useState<MaintenanceTicket[]>(initialMaintenanceTickets);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(initialExpenses);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(initialAuditLogs);

  // Initialize from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.hotelSettings) setHotelSettings(parsed.hotelSettings);
        if (parsed.users) setUsers(parsed.users);
        if (parsed.currentUser) setCurrentUser(parsed.currentUser);
        if (parsed.rooms) setRooms(parsed.rooms);
        if (parsed.guests) setGuests(parsed.guests);
        if (parsed.bookings) setBookings(parsed.bookings);
        if (parsed.folios) setFolios(parsed.folios);
        if (parsed.housekeepingTasks) setHousekeepingTasks(parsed.housekeepingTasks);
        if (parsed.menuItems) setMenuItems(parsed.menuItems);
        if (parsed.restaurantTables) setRestaurantTables(parsed.restaurantTables);
        if (parsed.restaurantOrders) setRestaurantOrders(parsed.restaurantOrders);
        if (parsed.inventory) setInventory(parsed.inventory);
        if (parsed.stockMovements) setStockMovements(parsed.stockMovements);
        if (parsed.laundryOrders) setLaundryOrders(parsed.laundryOrders);
        if (parsed.maintenanceTickets) setMaintenanceTickets(parsed.maintenanceTickets);
        if (parsed.expenses) setExpenses(parsed.expenses);
        if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
      }
    } catch (e) {
      console.error('Failed to load PMS state from storage:', e);
    }
    setIsLoaded(true);
  }, []);

  // Sync to LocalStorage on updates
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const payload = {
        hotelSettings,
        users,
        currentUser,
        rooms,
        guests,
        bookings,
        folios,
        housekeepingTasks,
        menuItems,
        restaurantTables,
        restaurantOrders,
        inventory,
        stockMovements,
        laundryOrders,
        maintenanceTickets,
        expenses,
        auditLogs
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to persist PMS state to storage:', e);
    }
  }, [
    isLoaded,
    hotelSettings,
    users,
    currentUser,
    rooms,
    guests,
    bookings,
    folios,
    housekeepingTasks,
    menuItems,
    restaurantTables,
    restaurantOrders,
    inventory,
    stockMovements,
    laundryOrders,
    maintenanceTickets,
    expenses,
    auditLogs
  ]);

  const logAudit = (action: string, details: string) => {
    const newEntry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      details,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setAuditLogs(prev => [newEntry, ...prev]);
  };

  const updateHotelSettings = (updates: Partial<HotelSettings>) => {
    setHotelSettings(prev => ({ ...prev, ...updates }));
    logAudit('SETTINGS_UPDATE', 'Updated hotel general & tax parameters');
  };

  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: `u-${Date.now()}`
    };
    setUsers(prev => [...prev, newUser]);
    logAudit('STAFF_HIRED', `Added staff member ${newUser.name} with role ${newUser.role}`);
  };

  // Rooms Management
  const addRoom = (roomData: Omit<Room, 'id'>) => {
    const exists = rooms.some(r => r.roomNumber.toLowerCase() === roomData.roomNumber.trim().toLowerCase());
    if (exists) {
      return { success: false, error: `Room ${roomData.roomNumber} already exists in property.` };
    }
    const newRoom: Room = {
      ...roomData,
      id: `r-${Date.now()}`,
      roomNumber: roomData.roomNumber.trim()
    };
    setRooms(prev => [...prev, newRoom]);
    logAudit('ROOM_CREATED', `Room ${newRoom.roomNumber} created on Floor ${newRoom.floor}`);
    return { success: true };
  };

  const updateRoom = (id: string, updates: Partial<Room>) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    logAudit('ROOM_UPDATED', `Room ID ${id} attributes updated`);
  };

  const deleteRoom = (id: string) => {
    const isOccupiedOrBooked = bookings.some(b => b.roomId === id && ['Confirmed', 'Checked-in'].includes(b.status));
    if (isOccupiedOrBooked) {
      return { success: false, error: 'Cannot delete a room that has active or confirmed reservations.' };
    }
    const targetRoom = rooms.find(r => r.id === id);
    setRooms(prev => prev.filter(r => r.id !== id));
    logAudit('ROOM_DELETED', `Room ${targetRoom?.roomNumber || id} removed from property`);
    return { success: true };
  };

  const updateRoomStatus = (roomId: string, status: RoomStatus) => {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status } : r));
    logAudit('ROOM_STATUS_CHANGE', `Room ID ${roomId} status changed to ${status}`);
  };

  const updateRoomCleaningStatus = (roomId: string, cleaningStatus: CleaningStatus) => {
    setRooms(prev => prev.map(r => {
      if (r.id !== roomId) return r;
      let newStatus = r.status;
      if (cleaningStatus === 'Ready' && r.status !== 'Occupied' && r.status !== 'Reserved' && r.status !== 'Maintenance') {
        newStatus = 'Available';
      } else if (cleaningStatus === 'Dirty' && r.status === 'Available') {
        newStatus = 'Dirty';
      } else if (cleaningStatus === 'Cleaning in Progress') {
        newStatus = 'Cleaning';
      }
      return { ...r, cleaningStatus, status: newStatus };
    }));
    logAudit('ROOM_CLEANING_UPDATE', `Room ID ${roomId} marked as ${cleaningStatus}`);
  };

  // Double-booking Protection Engine
  const checkAvailability = (checkIn: string, checkOut: string, roomTypeId?: string, excludeBookingId?: string): Room[] => {
    if (!checkIn || !checkOut) return [];
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    if (inDate >= outDate) return [];

    return rooms.filter(room => {
      // Exclude rooms permanently out of service
      if (room.status === 'Maintenance') return false;
      // Filter by type if specified
      if (roomTypeId && room.roomTypeId !== roomTypeId) return false;

      // Check overlapping bookings
      const hasConflict = bookings.some(b => {
        if (b.roomId !== room.id) return false;
        if (excludeBookingId && b.id === excludeBookingId) return false;
        if (b.status !== 'Confirmed' && b.status !== 'Checked-in') return false;

        // Interval overlap: (b.checkIn < checkOut) && (b.checkOut > checkIn)
        return b.checkInDate < checkOut && b.checkOutDate > checkIn;
      });

      return !hasConflict;
    });
  };

  // Create Reservation
  const createBooking = (
    bookingData: {
      roomId: string;
      checkInDate: string;
      checkOutDate: string;
      adults: number;
      children: number;
      bookingSource: Booking['bookingSource'];
      specialRequests?: string;
    },
    guestInfo: {
      isExisting: boolean;
      guestId?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      idType?: Guest['idType'];
      idNumber?: string;
      city?: string;
      country?: string;
      vipStatus?: boolean;
    },
    advancePayment: number = 0,
    paymentMethod: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' = 'Cash'
  ) => {
    const { roomId, checkInDate, checkOutDate, adults, children, bookingSource, specialRequests } = bookingData;

    // Strict Double Booking Prevention
    const availableRooms = checkAvailability(checkInDate, checkOutDate);
    const isRoomAvailable = availableRooms.some(r => r.id === roomId);
    if (!isRoomAvailable) {
      return {
        success: false,
        error: 'Double-booking prevention: Selected room is already reserved or occupied for the selected dates.'
      };
    }

    const room = rooms.find(r => r.id === roomId);
    const roomType = roomTypes.find(rt => rt.id === room?.roomTypeId);
    if (!room || !roomType) {
      return { success: false, error: 'Invalid room selected.' };
    }

    // Determine Guest ID
    let finalGuestId = guestInfo.guestId;
    if (!guestInfo.isExisting || !finalGuestId) {
      const newGuest: Guest = {
        id: `g-${Date.now()}`,
        firstName: guestInfo.firstName || 'Guest',
        lastName: guestInfo.lastName || '',
        email: guestInfo.email || 'guest@example.com',
        phone: guestInfo.phone || '+91 00000 00000',
        idType: guestInfo.idType || 'Aadhaar',
        idNumber: guestInfo.idNumber || 'PENDING',
        address: '',
        city: guestInfo.city || 'Mumbai',
        country: guestInfo.country || 'India',
        vipStatus: !!guestInfo.vipStatus,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setGuests(prev => [newGuest, ...prev]);
      finalGuestId = newGuest.id;
    }

    // Calculations
    const d1 = new Date(checkInDate);
    const d2 = new Date(checkOutDate);
    const nights = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
    const nightlyRate = roomType.baseRate;
    const roomSubtotal = nightlyRate * nights;

    const serviceCharge = (roomSubtotal * hotelSettings.serviceChargeRate) / 100;
    const taxAmount = ((roomSubtotal + serviceCharge) * hotelSettings.taxRate) / 100;
    const totalAmount = roomSubtotal + serviceCharge + taxAmount;
    const initialPaid = Math.max(0, advancePayment);
    const balance = totalAmount - initialPaid;

    const bookingId = `b-${Date.now()}`;
    const bookingCode = `GRP-${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;

    const newBooking: Booking = {
      id: bookingId,
      bookingCode,
      guestId: finalGuestId,
      roomId,
      checkInDate,
      checkOutDate,
      adults: adults || 1,
      children: children || 0,
      nightlyRate,
      totalNights: nights,
      roomSubtotal,
      bookingSource,
      status: 'Confirmed',
      specialRequests,
      createdAt: new Date().toISOString().split('T')[0]
    };

    const folioId = `fol-${Date.now()}`;
    const initialPayments = initialPaid > 0 ? [
      {
        id: `pay-${Date.now()}`,
        folioId,
        amount: initialPaid,
        paymentMethod,
        transactionRef: `ADV-${Date.now().toString().slice(-6)}`,
        notes: 'Advance booking payment',
        recordedBy: currentUser.name,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
      }
    ] : [];

    const newFolio: Folio = {
      id: folioId,
      bookingId,
      roomCharge: roomSubtotal,
      extraCharges: [],
      foodCharge: 0,
      laundryCharge: 0,
      serviceCharge,
      taxAmount,
      discountAmount: 0,
      totalAmount,
      paidAmount: initialPaid,
      balanceAmount: balance,
      paymentStatus: balance <= 0 ? 'Settled' : initialPaid > 0 ? 'Partially Paid' : 'Unpaid',
      payments: initialPayments
    };

    setBookings(prev => [newBooking, ...prev]);
    setFolios(prev => [newFolio, ...prev]);

    // If checkInDate is today, set room status to Reserved
    const todayStr = new Date().toISOString().split('T')[0];
    if (checkInDate === todayStr && room.status === 'Available') {
      updateRoomStatus(roomId, 'Reserved');
    }

    logAudit('BOOKING_CREATED', `Reservation ${bookingCode} created for Room ${room.roomNumber} (${nights} nights, ₹${totalAmount.toFixed(0)})`);
    return { success: true, bookingId, bookingCode };
  };

  const modifyBooking = (bookingId: string, updates: Partial<Booking>) => {
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, ...updates } : b));
    logAudit('BOOKING_MODIFIED', `Booking ID ${bookingId} updated`);
  };

  const cancelBooking = (bookingId: string, reason?: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'Cancelled' } : b));
    
    // Release room if it was Reserved for this booking
    const room = rooms.find(r => r.id === booking.roomId);
    if (room && room.status === 'Reserved') {
      updateRoomStatus(room.id, 'Available');
    }

    logAudit('BOOKING_CANCELLED', `Booking ${booking.bookingCode} cancelled. Reason: ${reason || 'Guest request'}`);
  };

  // Front Desk: Check-in
  const checkInGuest = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return { success: false, error: 'Booking not found.' };

    const room = rooms.find(r => r.id === booking.roomId);
    if (!room) return { success: false, error: 'Room not found.' };

    // Validate room readiness
    if (room.cleaningStatus !== 'Ready' && room.cleaningStatus !== 'Clean') {
      return {
        success: false,
        error: `Room ${room.roomNumber} is currently "${room.cleaningStatus}". Please complete housekeeping inspection before check-in.`
      };
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'Checked-in', actualCheckIn: now } : b));
    setRooms(prev => prev.map(r => r.id === booking.roomId ? { ...r, status: 'Occupied' } : r));

    logAudit('CHECK_IN', `Guest checked into Room ${room.roomNumber} (Booking ${booking.bookingCode})`);
    return { success: true };
  };

  // Front Desk: Check-out
  const checkOutGuest = (bookingId: string, force: boolean = false) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return { success: false, error: 'Booking not found.' };

    const folio = folios.find(f => f.bookingId === bookingId);
    if (folio && folio.balanceAmount > 1 && !force) {
      return {
        success: false,
        balanceRemaining: folio.balanceAmount,
        error: `Guest has an outstanding balance of ${hotelSettings.currencySymbol}${folio.balanceAmount.toLocaleString()}. Please settle the bill or force check-out.`
      };
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Update Booking
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'Checked-out', actualCheckOut: now } : b));

    // Room becomes Dirty
    setRooms(prev => prev.map(r => r.id === booking.roomId ? { ...r, status: 'Dirty', cleaningStatus: 'Dirty' } : r));

    // Auto-create Housekeeping task
    const room = rooms.find(r => r.id === booking.roomId);
    const newTask: HousekeepingTask = {
      id: `hk-${Date.now()}`,
      roomId: booking.roomId,
      taskType: 'Turnaround Cleaning',
      status: 'Pending',
      linenChanged: false,
      toiletriesRestocked: false,
      minibarChecked: false,
      remarks: `Turnover after guest departure. Deep sanitize and prepare for next arrival.`
    };
    setHousekeepingTasks(prev => [newTask, ...prev]);

    logAudit('CHECK_OUT', `Guest checked out from Room ${room?.roomNumber}. Room queued for Housekeeping.`);
    return { success: true };
  };

  // Room Transfer
  const transferRoom = (bookingId: string, targetRoomId: string, reason: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return { success: false, error: 'Booking not found.' };

    const targetRoom = rooms.find(r => r.id === targetRoomId);
    if (!targetRoom || targetRoom.status !== 'Available') {
      return { success: false, error: 'Target room is not available for transfer.' };
    }

    const oldRoom = rooms.find(r => r.id === booking.roomId);

    // Old room becomes Dirty
    setRooms(prev => prev.map(r => {
      if (r.id === oldRoom?.id) return { ...r, status: 'Dirty', cleaningStatus: 'Dirty' };
      if (r.id === targetRoomId) return { ...r, status: 'Occupied' };
      return r;
    }));

    // Update booking
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, roomId: targetRoomId } : b));

    logAudit('ROOM_TRANSFER', `Transferred Booking ${booking.bookingCode} from Room ${oldRoom?.roomNumber} to Room ${targetRoom.roomNumber}. Reason: ${reason}`);
    return { success: true };
  };

  // Folio Extra Charges
  const addFolioExtraCharge = (folioId: string, charge: Omit<FolioExtraCharge, 'id' | 'createdAt'>) => {
    const newCharge: FolioExtraCharge = {
      ...charge,
      id: `ch-${Date.now()}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    setFolios(prev => prev.map(f => {
      if (f.id !== folioId) return f;
      const updatedExtras = [...f.extraCharges, newCharge];
      const extrasSum = updatedExtras.reduce((sum, c) => sum + c.amount, 0);
      const subtotalBeforeTax = f.roomCharge + f.foodCharge + f.laundryCharge + extrasSum;
      const serviceCharge = (subtotalBeforeTax * hotelSettings.serviceChargeRate) / 100;
      const taxAmount = ((subtotalBeforeTax + serviceCharge) * hotelSettings.taxRate) / 100;
      const totalAmount = subtotalBeforeTax + serviceCharge + taxAmount - f.discountAmount;
      const balanceAmount = totalAmount - f.paidAmount;

      return {
        ...f,
        extraCharges: updatedExtras,
        serviceCharge,
        taxAmount,
        totalAmount,
        balanceAmount,
        paymentStatus: balanceAmount <= 1 ? 'Settled' : f.paidAmount > 0 ? 'Partially Paid' : 'Unpaid'
      };
    }));

    logAudit('FOLIO_CHARGE_ADDED', `Added extra charge "${charge.description}" (${hotelSettings.currencySymbol}${charge.amount}) to Folio #${folioId}`);
  };

  // Payments
  const recordPayment = (
    folioId: string,
    amount: number,
    paymentMethod: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer',
    transactionRef?: string,
    notes?: string
  ) => {
    if (amount <= 0) return { success: false, error: 'Payment amount must be greater than zero.' };

    const newPayment = {
      id: `pay-${Date.now()}`,
      folioId,
      amount,
      paymentMethod,
      transactionRef: transactionRef || `REF-${Date.now().toString().slice(-6)}`,
      notes,
      recordedBy: currentUser.name,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    setFolios(prev => prev.map(f => {
      if (f.id !== folioId) return f;
      const updatedPaid = f.paidAmount + amount;
      const updatedBalance = f.totalAmount - updatedPaid;
      const updatedStatus = updatedBalance <= 1 ? 'Settled' : 'Partially Paid';

      return {
        ...f,
        paidAmount: updatedPaid,
        balanceAmount: Math.max(0, updatedBalance),
        paymentStatus: updatedStatus,
        payments: [newPayment, ...f.payments]
      };
    }));

    logAudit('PAYMENT_RECEIVED', `Recorded payment of ${hotelSettings.currencySymbol}${amount} via ${paymentMethod} for Folio #${folioId}`);
    return { success: true };
  };

  // Housekeeping
  const addHousekeepingTask = (task: Omit<HousekeepingTask, 'id'>) => {
    const newTask: HousekeepingTask = {
      ...task,
      id: `hk-${Date.now()}`
    };
    setHousekeepingTasks(prev => [newTask, ...prev]);
    logAudit('HOUSEKEEPING_ASSIGNED', `Assigned task "${task.taskType}" for Room ID ${task.roomId}`);
  };

  const updateHousekeepingTask = (id: string, updates: Partial<HousekeepingTask>) => {
    setHousekeepingTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const updated = { ...t, ...updates };

      // Room status synchronization
      if (updates.status === 'Approved') {
        const room = rooms.find(r => r.id === t.roomId);
        if (room && room.status !== 'Occupied' && room.status !== 'Reserved' && room.status !== 'Maintenance') {
          updateRoomCleaningStatus(t.roomId, 'Ready');
        } else {
          setRooms(rPrev => rPrev.map(r => r.id === t.roomId ? { ...r, cleaningStatus: 'Ready' } : r));
        }
      } else if (updates.status === 'In Progress') {
        setRooms(rPrev => rPrev.map(r => r.id === t.roomId ? { ...r, cleaningStatus: 'Cleaning in Progress' } : r));
      } else if (updates.status === 'Completed') {
        setRooms(rPrev => rPrev.map(r => r.id === t.roomId ? { ...r, cleaningStatus: 'Inspected' } : r));
      }

      return updated;
    }));
    logAudit('HOUSEKEEPING_UPDATED', `Housekeeping task #${id} updated`);
  };

  // Restaurant & POS
  const addMenuItem = (item: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = { ...item, id: `m-${Date.now()}` };
    setMenuItems(prev => [...prev, newItem]);
    logAudit('MENU_ITEM_ADDED', `Added menu item: ${newItem.name}`);
  };

  const updateMenuItem = (id: string, updates: Partial<MenuItem>) => {
    setMenuItems(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const createRestaurantOrder = (orderData: {
    orderType: 'Dine-in' | 'Takeaway' | 'Room Service';
    tableId?: string;
    roomId?: string;
    items: { menuItemId: string; quantity: number }[];
    billedToRoom?: boolean;
  }) => {
    const { orderType, tableId, roomId, items, billedToRoom } = orderData;
    if (!items || items.length === 0) return { success: false, error: 'Order must contain at least one item.' };

    let subtotal = 0;
    const validatedItems = items.map(itm => {
      const menu = menuItems.find(m => m.id === itm.menuItemId);
      if (!menu) throw new Error('Menu item not found');
      const itemTotal = menu.price * itm.quantity;
      subtotal += itemTotal;
      return {
        menuItemId: menu.id,
        name: menu.name,
        quantity: itm.quantity,
        unitPrice: menu.price,
        totalPrice: itemTotal
      };
    });

    const tax = subtotal * 0.05; // 5% GST on Restaurant F&B
    const grandTotal = subtotal + tax;
    const orderNumber = `KOT-${Math.floor(10000 + Math.random() * 90000)}`;

    let bookingId: string | undefined = undefined;
    let guestName: string | undefined = undefined;

    if (roomId) {
      const activeBooking = bookings.find(b => b.roomId === roomId && b.status === 'Checked-in');
      if (activeBooking) {
        bookingId = activeBooking.id;
        const guest = guests.find(g => g.id === activeBooking.guestId);
        guestName = guest ? `${guest.firstName} ${guest.lastName}` : undefined;
      }
    }

    const newOrder: RestaurantOrder = {
      id: `ord-${Date.now()}`,
      orderNumber,
      orderType,
      tableId,
      roomId,
      bookingId,
      guestName,
      status: 'Pending',
      items: validatedItems,
      subtotal,
      tax,
      totalAmount: grandTotal,
      billedToRoom: !!(billedToRoom && bookingId),
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    setRestaurantOrders(prev => [newOrder, ...prev]);

    // If billed to room, update the active guest folio!
    if (billedToRoom && bookingId) {
      setFolios(prev => prev.map(f => {
        if (f.bookingId !== bookingId) return f;
        const newFoodCharge = f.foodCharge + grandTotal;
        const extrasSum = f.extraCharges.reduce((s, c) => s + c.amount, 0);
        const subtotalBeforeTax = f.roomCharge + newFoodCharge + f.laundryCharge + extrasSum;
        const serviceCharge = (subtotalBeforeTax * hotelSettings.serviceChargeRate) / 100;
        const taxAmount = ((subtotalBeforeTax + serviceCharge) * hotelSettings.taxRate) / 100;
        const totalAmount = subtotalBeforeTax + serviceCharge + taxAmount - f.discountAmount;
        const balanceAmount = totalAmount - f.paidAmount;

        return {
          ...f,
          foodCharge: newFoodCharge,
          serviceCharge,
          taxAmount,
          totalAmount,
          balanceAmount,
          paymentStatus: balanceAmount <= 1 ? 'Settled' : 'Partially Paid'
        };
      }));
    }

    logAudit('RESTAURANT_ORDER', `KOT ${orderNumber} created (${orderType}, ${hotelSettings.currencySymbol}${grandTotal.toFixed(0)}${billedToRoom ? ' - Billed to Room Folio' : ''})`);
    return { success: true, orderId: newOrder.id, orderNumber };
  };

  const updateOrderStatus = (orderId: string, status: RestaurantOrder['status']) => {
    setRestaurantOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    logAudit('KOT_STATUS_UPDATED', `Order ID ${orderId} changed to ${status}`);
  };

  // Inventory
  const recordStockMovement = (
    itemId: string,
    movementType: 'IN' | 'OUT' | 'WASTE' | 'ADJUSTMENT',
    quantity: number,
    reason: string
  ) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return { success: false, error: 'Inventory item not found.' };

    if ((movementType === 'OUT' || movementType === 'WASTE') && item.quantity < quantity) {
      return { success: false, error: `Insufficient stock. Current stock is ${item.quantity} ${item.unit}.` };
    }

    let newQty = item.quantity;
    if (movementType === 'IN') newQty += quantity;
    else if (movementType === 'OUT' || movementType === 'WASTE') newQty -= quantity;
    else if (movementType === 'ADJUSTMENT') newQty = quantity;

    setInventory(prev => prev.map(i => i.id === itemId ? { ...i, quantity: Math.max(0, newQty) } : i));

    const newMovement: StockMovement = {
      id: `sm-${Date.now()}`,
      itemId,
      itemName: item.name,
      movementType,
      quantity,
      unit: item.unit,
      reason,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setStockMovements(prev => [newMovement, ...prev]);

    logAudit('STOCK_MOVEMENT', `${movementType} ${quantity} ${item.unit} for "${item.name}". Reason: ${reason}`);
    return { success: true };
  };

  const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = { ...item, id: `inv-${Date.now()}` };
    setInventory(prev => [...prev, newItem]);
    logAudit('INVENTORY_ITEM_ADDED', `Added inventory stock: ${newItem.name}`);
  };

  // Laundry
  const addLaundryOrder = (order: Omit<LaundryOrder, 'id' | 'createdAt'>) => {
    const newOrder: LaundryOrder = {
      ...order,
      id: `lnd-${Date.now()}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setLaundryOrders(prev => [newOrder, ...prev]);

    // Attach to guest folio if bookingId provided
    if (order.bookingId) {
      setFolios(prev => prev.map(f => {
        if (f.bookingId !== order.bookingId) return f;
        const newLaundryCharge = f.laundryCharge + order.totalCharge;
        const extrasSum = f.extraCharges.reduce((s, c) => s + c.amount, 0);
        const subtotalBeforeTax = f.roomCharge + f.foodCharge + newLaundryCharge + extrasSum;
        const serviceCharge = (subtotalBeforeTax * hotelSettings.serviceChargeRate) / 100;
        const taxAmount = ((subtotalBeforeTax + serviceCharge) * hotelSettings.taxRate) / 100;
        const totalAmount = subtotalBeforeTax + serviceCharge + taxAmount - f.discountAmount;
        const balanceAmount = totalAmount - f.paidAmount;

        return {
          ...f,
          laundryCharge: newLaundryCharge,
          serviceCharge,
          taxAmount,
          totalAmount,
          balanceAmount
        };
      }));
    }

    logAudit('LAUNDRY_ORDER', `Laundry ticket created for Room ${order.roomNumber} (${order.serviceType}, ${hotelSettings.currencySymbol}${order.totalCharge})`);
  };

  const updateLaundryStatus = (orderId: string, status: LaundryOrder['status']) => {
    setLaundryOrders(prev => prev.map(l => l.id === orderId ? { ...l, status } : l));
  };

  // Maintenance
  const addMaintenanceTicket = (ticket: Omit<MaintenanceTicket, 'id' | 'reportedAt'>) => {
    const newTicket: MaintenanceTicket = {
      ...ticket,
      id: `mt-${Date.now()}`,
      reportedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setMaintenanceTickets(prev => [newTicket, ...prev]);

    // Block room automatically from inventory
    updateRoomStatus(ticket.roomId, 'Maintenance');
    logAudit('MAINTENANCE_TICKET', `Maintenance ticket created for Room ID ${ticket.roomId}: ${ticket.issueDescription}. Room locked.`);
  };

  const resolveMaintenanceTicket = (ticketId: string, finalExpense?: number) => {
    const ticket = maintenanceTickets.find(t => t.id === ticketId);
    if (!ticket) return;

    setMaintenanceTickets(prev => prev.map(t => t.id === ticketId ? {
      ...t,
      status: 'Resolved',
      expense: finalExpense !== undefined ? finalExpense : t.expense,
      resolvedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    } : t));

    // Release room to Dirty for Housekeeping inspection before release to Available
    updateRoomCleaningStatus(ticket.roomId, 'Dirty');
    updateRoomStatus(ticket.roomId, 'Dirty');

    logAudit('MAINTENANCE_RESOLVED', `Ticket #${ticketId} resolved. Room transferred to Housekeeping for turnover inspection.`);
  };

  // Expenses
  const addExpense = (expense: Omit<ExpenseRecord, 'id'>) => {
    const newExpense: ExpenseRecord = { ...expense, id: `exp-${Date.now()}` };
    setExpenses(prev => [newExpense, ...prev]);
    logAudit('EXPENSE_RECORDED', `Logged expense: ${expense.title} (${hotelSettings.currencySymbol}${expense.amount})`);
  };

  // Reset to seed data
  const resetToDefaultData = () => {
    setHotelSettings(initialHotelSettings);
    setUsers(initialUsers);
    setCurrentUser(initialUsers[0]);
    setRooms(initialRooms);
    setGuests(initialGuests);
    setBookings(initialBookings);
    setFolios(initialFolios);
    setHousekeepingTasks(initialHousekeepingTasks);
    setMenuItems(initialMenuItems);
    setRestaurantTables(initialTables);
    setRestaurantOrders(initialOrders);
    setInventory(initialInventory);
    setStockMovements(initialStockMovements);
    setLaundryOrders(initialLaundryOrders);
    setMaintenanceTickets(initialMaintenanceTickets);
    setExpenses(initialExpenses);
    setAuditLogs(initialAuditLogs);
    localStorage.removeItem(STORAGE_KEY);
    logAudit('DATABASE_RESET', 'PMS restored to factory default luxury seed records');
  };

  const exportDatabaseJSON = (): string => {
    return JSON.stringify({
      hotelSettings,
      users,
      rooms,
      guests,
      bookings,
      folios,
      housekeepingTasks,
      menuItems,
      restaurantTables,
      restaurantOrders,
      inventory,
      stockMovements,
      laundryOrders,
      maintenanceTickets,
      expenses,
      auditLogs,
      exportedAt: new Date().toISOString()
    }, null, 2);
  };

  const importDatabaseJSON = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (!data.rooms || !data.bookings || !data.folios) {
        return { success: false, error: 'Invalid backup file format.' };
      }
      if (data.hotelSettings) setHotelSettings(data.hotelSettings);
      if (data.users) setUsers(data.users);
      if (data.rooms) setRooms(data.rooms);
      if (data.guests) setGuests(data.guests);
      if (data.bookings) setBookings(data.bookings);
      if (data.folios) setFolios(data.folios);
      if (data.housekeepingTasks) setHousekeepingTasks(data.housekeepingTasks);
      if (data.menuItems) setMenuItems(data.menuItems);
      if (data.restaurantTables) setRestaurantTables(data.restaurantTables);
      if (data.restaurantOrders) setRestaurantOrders(data.restaurantOrders);
      if (data.inventory) setInventory(data.inventory);
      if (data.stockMovements) setStockMovements(data.stockMovements);
      if (data.laundryOrders) setLaundryOrders(data.laundryOrders);
      if (data.maintenanceTickets) setMaintenanceTickets(data.maintenanceTickets);
      if (data.expenses) setExpenses(data.expenses);
      if (data.auditLogs) setAuditLogs(data.auditLogs);
      logAudit('DATABASE_RESTORED', 'Imported data from external backup successfully');
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'JSON parsing error' };
    }
  };

  return (
    <HotelContext.Provider value={{
      currentUser,
      setCurrentUser,
      users,
      addUser,
      hotelSettings,
      updateHotelSettings,
      roomTypes,
      rooms,
      addRoom,
      updateRoom,
      deleteRoom,
      updateRoomStatus,
      updateRoomCleaningStatus,
      guests,
      bookings,
      folios,
      checkAvailability,
      createBooking,
      modifyBooking,
      cancelBooking,
      checkInGuest,
      checkOutGuest,
      transferRoom,
      addFolioExtraCharge,
      recordPayment,
      housekeepingTasks,
      addHousekeepingTask,
      updateHousekeepingTask,
      menuItems,
      restaurantTables,
      restaurantOrders,
      addMenuItem,
      updateMenuItem,
      createRestaurantOrder,
      updateOrderStatus,
      inventory,
      stockMovements,
      recordStockMovement,
      addInventoryItem,
      laundryOrders,
      addLaundryOrder,
      updateLaundryStatus,
      maintenanceTickets,
      addMaintenanceTicket,
      resolveMaintenanceTicket,
      expenses,
      addExpense,
      auditLogs,
      logAudit,
      resetToDefaultData,
      exportDatabaseJSON,
      importDatabaseJSON
    }}>
      {children}
    </HotelContext.Provider>
  );
};

export const useHotel = () => {
  const context = useContext(HotelContext);
  if (!context) {
    throw new Error('useHotel must be used within a HotelProvider');
  }
  return context;
};
