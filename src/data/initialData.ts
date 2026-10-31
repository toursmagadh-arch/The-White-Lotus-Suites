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
  AuditLogEntry
} from '../types/hotel';

export const initialHotelSettings: HotelSettings = {
  name: 'The Grand Royale Palace Hotel & Spa',
  tagline: 'A Sanctuary of Refined Elegance & Heritage Hospitality',
  email: 'concierge@grandroyalepalace.com',
  phone: '+91 22 2847 9000',
  address: '108 Marine Drive, Nariman Point',
  city: 'Mumbai',
  state: 'Maharashtra',
  country: 'India',
  pinCode: '400021',
  gstin: '27AAAAA0000A1Z5',
  currencySymbol: '₹',
  currencyCode: 'INR',
  taxRate: 18.0, // 18% GST
  serviceChargeRate: 5.0, // 5% Luxury Hospitality Service Fee
  checkInTime: '14:00',
  checkOutTime: '11:00'
};

export const initialUsers: User[] = [
  {
    id: 'u-1',
    name: 'Vikramaditya Oberoi',
    email: 'admin@grandroyale.com',
    phone: '+91 98200 12345',
    role: 'Administrator',
    shift: 'General (09:00 - 18:00)',
    status: 'Active'
  },
  {
    id: 'u-2',
    name: 'Pooja Sharma',
    email: 'reception@grandroyale.com',
    phone: '+91 98200 23456',
    role: 'Receptionist',
    shift: 'Morning (06:00 - 14:00)',
    status: 'Active'
  },
  {
    id: 'u-3',
    name: 'Ramesh Khurana',
    email: 'hk@grandroyale.com',
    phone: '+91 98200 34567',
    role: 'Housekeeping',
    shift: 'Morning (06:00 - 14:00)',
    status: 'Active'
  },
  {
    id: 'u-4',
    name: 'Chef Sanjeev Anand',
    email: 'chef@grandroyale.com',
    phone: '+91 98200 45678',
    role: 'Chef',
    shift: 'Evening (14:00 - 22:00)',
    status: 'Active'
  },
  {
    id: 'u-5',
    name: 'Sunita Menon',
    email: 'accounts@grandroyale.com',
    phone: '+91 98200 56789',
    role: 'Accountant',
    shift: 'General (09:00 - 18:00)',
    status: 'Active'
  },
  {
    id: 'u-6',
    name: 'Devraj Kapoor',
    email: 'manager@grandroyale.com',
    phone: '+91 98200 67890',
    role: 'Manager',
    shift: 'General (09:00 - 18:00)',
    status: 'Active'
  }
];

export const initialRoomTypes: RoomType[] = [
  {
    id: 'rt-1',
    name: 'Standard',
    baseRate: 4500,
    capacityAdults: 2,
    capacityChildren: 1,
    bedType: 'King',
    amenities: ['High-Speed Wi-Fi', '43" Smart TV', 'Rain Shower', 'Espresso Maker', 'Work Desk'],
    description: 'Refined contemporary comfort tailored for business travelers and short getaways.'
  },
  {
    id: 'rt-2',
    name: 'Deluxe Sea Facing',
    baseRate: 7500,
    capacityAdults: 2,
    capacityChildren: 1,
    bedType: 'King',
    amenities: ['Arabian Sea View', 'Private Balcony', 'Deep Soaking Tub', 'Pillow Menu', 'Minibar'],
    description: 'Unobstructed panoramic ocean horizons complemented by bespoke plush furnishings.'
  },
  {
    id: 'rt-3',
    name: 'Super Deluxe Palace Wing',
    baseRate: 11000,
    capacityAdults: 3,
    capacityChildren: 2,
    bedType: 'King',
    amenities: ['Heritage Artwork', 'Walk-in Dressing Room', 'Jacuzzi', 'Club Lounge Access', 'Chauffeur On-Demand'],
    description: 'Immaculately restored historic heritage suites embodying royal Indian architecture.'
  },
  {
    id: 'rt-4',
    name: 'Presidential Suite',
    baseRate: 25000,
    capacityAdults: 4,
    capacityChildren: 2,
    bedType: 'King',
    amenities: ['24/7 Dedicated Butler', 'Dual Master Suites', 'Private Dining Salon', 'Steam Room', 'Direct Heli Access'],
    description: 'The pinnacle of luxury living featuring personalized white-glove hospitality.'
  },
  {
    id: 'rt-5',
    name: 'Executive Family Suite',
    baseRate: 14000,
    capacityAdults: 4,
    capacityChildren: 3,
    bedType: 'Two Kings',
    amenities: ['Two Adjoining Rooms', '2 En-suite Bathrooms', 'Kitchenette', 'Child Play Corner', 'Smart Entertainment'],
    description: 'Expansive family residence providing supreme privacy, ease, and modern amenities.'
  }
];

export const initialRooms: Room[] = [
  // Floor 1: Standard
  { id: 'r-101', roomNumber: '101', floor: 1, roomTypeId: 'rt-1', bedType: 'King', hasAC: true, status: 'Available', cleaningStatus: 'Ready', notes: 'Near east elevator' },
  { id: 'r-102', roomNumber: '102', floor: 1, roomTypeId: 'rt-1', bedType: 'Twin', hasAC: true, status: 'Available', cleaningStatus: 'Clean', notes: 'Courtyard garden view' },
  { id: 'r-103', roomNumber: '103', floor: 1, roomTypeId: 'rt-1', bedType: 'King', hasAC: true, status: 'Occupied', cleaningStatus: 'Clean' },
  { id: 'r-104', roomNumber: '104', floor: 1, roomTypeId: 'rt-1', bedType: 'King', hasAC: true, status: 'Dirty', cleaningStatus: 'Dirty', notes: 'Guest checked out 10:30 AM' },
  
  // Floor 2: Deluxe Sea Facing
  { id: 'r-201', roomNumber: '201', floor: 2, roomTypeId: 'rt-2', bedType: 'King', hasAC: true, status: 'Occupied', cleaningStatus: 'Clean' },
  { id: 'r-202', roomNumber: '202', floor: 2, roomTypeId: 'rt-2', bedType: 'King', hasAC: true, status: 'Dirty', cleaningStatus: 'Dirty', notes: 'Turnover requested' },
  { id: 'r-203', roomNumber: '203', floor: 2, roomTypeId: 'rt-2', bedType: 'King', hasAC: true, status: 'Reserved', cleaningStatus: 'Ready', notes: 'VIP arrival today 15:00' },
  { id: 'r-204', roomNumber: '204', floor: 2, roomTypeId: 'rt-2', bedType: 'Twin', hasAC: true, status: 'Available', cleaningStatus: 'Ready' },
  
  // Floor 3: Super Deluxe Palace Wing
  { id: 'r-301', roomNumber: '301', floor: 3, roomTypeId: 'rt-3', bedType: 'King', hasAC: true, status: 'Available', cleaningStatus: 'Ready' },
  { id: 'r-302', roomNumber: '302', floor: 3, roomTypeId: 'rt-3', bedType: 'King', hasAC: true, status: 'Cleaning', cleaningStatus: 'Cleaning in Progress' },
  { id: 'r-303', roomNumber: '303', floor: 3, roomTypeId: 'rt-3', bedType: 'King', hasAC: true, status: 'Occupied', cleaningStatus: 'Clean' },
  { id: 'r-304', roomNumber: '304', floor: 3, roomTypeId: 'rt-3', bedType: 'King', hasAC: true, status: 'Reserved', cleaningStatus: 'Ready' },
  
  // Floor 4: Presidential Suite & Family
  { id: 'r-401', roomNumber: '401', floor: 4, roomTypeId: 'rt-4', bedType: 'King', hasAC: true, status: 'Occupied', cleaningStatus: 'Clean', notes: 'VIP Eleanor Vanderbilt' },
  { id: 'r-402', roomNumber: '402', floor: 4, roomTypeId: 'rt-4', bedType: 'King', hasAC: true, status: 'Available', cleaningStatus: 'Ready' },
  { id: 'r-403', roomNumber: '403', floor: 4, roomTypeId: 'rt-5', bedType: 'Two Kings', hasAC: true, status: 'Available', cleaningStatus: 'Ready' },
  
  // Floor 5: Family & Maintenance
  { id: 'r-501', roomNumber: '501', floor: 5, roomTypeId: 'rt-5', bedType: 'Two Kings', hasAC: true, status: 'Maintenance', cleaningStatus: 'Dirty', notes: 'AC compressor recalibration' },
  { id: 'r-502', roomNumber: '502', floor: 5, roomTypeId: 'rt-5', bedType: 'Two Kings', hasAC: true, status: 'Available', cleaningStatus: 'Ready' }
];

export const initialGuests: Guest[] = [
  {
    id: 'g-1',
    firstName: 'Aditya',
    lastName: 'Singhania',
    email: 'aditya.singhania@corp.in',
    phone: '+91 99301 12233',
    idType: 'Aadhaar',
    idNumber: '8839 2910 4918',
    address: '42 Prithviraj Road',
    city: 'New Delhi',
    country: 'India',
    vipStatus: true,
    createdAt: '2026-10-25'
  },
  {
    id: 'g-2',
    firstName: 'Eleanor',
    lastName: 'Vanderbilt',
    email: 'eleanor.v@globaltravel.com',
    phone: '+1 415 890 2311',
    idType: 'Passport',
    idNumber: 'USA-90281144',
    address: '880 Pacific Heights Blvd',
    city: 'San Francisco',
    country: 'United States',
    vipStatus: true,
    createdAt: '2026-10-26'
  },
  {
    id: 'g-3',
    firstName: 'Rajesh',
    lastName: 'Patel',
    email: 'rajesh.patel@surattextiles.com',
    phone: '+91 98250 99881',
    idType: 'Aadhaar',
    idNumber: '3391 8840 1029',
    address: '15 Ring Road',
    city: 'Surat',
    country: 'India',
    vipStatus: false,
    createdAt: '2026-10-27'
  },
  {
    id: 'g-4',
    firstName: 'Dr. Aisha',
    lastName: 'Al-Mansoor',
    email: 'aisha.almansoor@dubaimed.ae',
    phone: '+971 50 123 4567',
    idType: 'Passport',
    idNumber: 'UAE-6612903',
    address: 'Downtown Tower 4',
    city: 'Dubai',
    country: 'UAE',
    vipStatus: true,
    createdAt: '2026-10-27'
  },
  {
    id: 'g-5',
    firstName: 'Samantha',
    lastName: 'Reed',
    email: 'samantha.reed@londonfin.co.uk',
    phone: '+44 7700 900123',
    idType: 'Passport',
    idNumber: 'GBR-8830192',
    address: '22 Kensington Church St',
    city: 'London',
    country: 'United Kingdom',
    vipStatus: false,
    createdAt: '2026-10-28'
  }
];

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
const inThreeDays = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];
const inFourDays = new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0];

export const initialBookings: Booking[] = [
  {
    id: 'b-101',
    bookingCode: 'GRP-2610-001',
    guestId: 'g-1',
    roomId: 'r-201',
    checkInDate: yesterday,
    checkOutDate: inThreeDays,
    adults: 2,
    children: 0,
    nightlyRate: 7500,
    totalNights: 4,
    roomSubtotal: 30000,
    bookingSource: 'Website',
    status: 'Checked-in',
    actualCheckIn: `${yesterday} 14:15:00`,
    specialRequests: 'High floor, late evening turn-down, sea-facing quiet corner.',
    createdAt: '2026-10-20'
  },
  {
    id: 'b-102',
    bookingCode: 'GRP-2610-002',
    guestId: 'g-2',
    roomId: 'r-401',
    checkInDate: today,
    checkOutDate: inFourDays,
    adults: 2,
    children: 1,
    nightlyRate: 25000,
    totalNights: 4,
    roomSubtotal: 100000,
    bookingSource: 'Travel Agent',
    status: 'Checked-in',
    actualCheckIn: `${today} 13:40:00`,
    specialRequests: 'VIP protocol, fresh white lilies, private butler service on standby.',
    createdAt: '2026-10-22'
  },
  {
    id: 'b-103',
    bookingCode: 'GRP-2610-003',
    guestId: 'g-3',
    roomId: 'r-103',
    checkInDate: yesterday,
    checkOutDate: tomorrow,
    adults: 1,
    children: 0,
    nightlyRate: 4500,
    totalNights: 2,
    roomSubtotal: 9000,
    bookingSource: 'Walk-in',
    status: 'Checked-in',
    actualCheckIn: `${yesterday} 18:20:00`,
    specialRequests: 'GST tax invoice under company name required.',
    createdAt: '2026-10-27'
  },
  {
    id: 'b-104',
    bookingCode: 'GRP-2610-004',
    guestId: 'g-4',
    roomId: 'r-203',
    checkInDate: today,
    checkOutDate: inThreeDays,
    adults: 2,
    children: 0,
    nightlyRate: 7500,
    totalNights: 3,
    roomSubtotal: 22500,
    bookingSource: 'OTA (Booking.com/Expedia)',
    status: 'Confirmed',
    specialRequests: 'Arriving via flight EK506 at 16:30. Non-smoking room.',
    createdAt: '2026-10-25'
  },
  {
    id: 'b-105',
    bookingCode: 'GRP-2610-005',
    guestId: 'g-5',
    roomId: 'r-304',
    checkInDate: tomorrow,
    checkOutDate: inFourDays,
    adults: 2,
    children: 1,
    nightlyRate: 11000,
    totalNights: 3,
    roomSubtotal: 33000,
    bookingSource: 'Website',
    status: 'Confirmed',
    specialRequests: 'Extra hypoallergenic pillows and baby cot.',
    createdAt: '2026-10-26'
  }
];

export const initialFolios: Folio[] = [
  {
    id: 'fol-101',
    bookingId: 'b-101',
    roomCharge: 30000,
    foodCharge: 3250,
    laundryCharge: 850,
    extraCharges: [
      { id: 'ch-1', description: 'Chauffeur Airport Pickup', category: 'Airport Transfer', amount: 2500, createdAt: `${yesterday} 13:00:00` },
      { id: 'ch-2', description: 'Royal Ayurvedic Spa Treatment (2 Guests)', category: 'Spa', amount: 6000, createdAt: `${today} 11:30:00` }
    ],
    serviceCharge: 2130, // 5% of (room + food + laundry + extras = 42600)
    taxAmount: 8051.4, // 18% GST of (42600 + 2130 = 44730)
    discountAmount: 1000,
    totalAmount: 51781.4,
    paidAmount: 25000,
    balanceAmount: 26781.4,
    paymentStatus: 'Partially Paid',
    payments: [
      {
        id: 'pay-1',
        folioId: 'fol-101',
        amount: 25000,
        paymentMethod: 'Card',
        transactionRef: 'TXN-CARD-901824',
        notes: 'Pre-authorization deposit at check-in',
        recordedBy: 'Pooja Sharma',
        createdAt: `${yesterday} 14:20:00`
      }
    ]
  },
  {
    id: 'fol-102',
    bookingId: 'b-102',
    roomCharge: 100000,
    foodCharge: 9800,
    laundryCharge: 0,
    extraCharges: [
      { id: 'ch-3', description: 'Dom Pérignon Champagne & Truffle Platter', category: 'F&B', amount: 18500, createdAt: `${today} 15:00:00` }
    ],
    serviceCharge: 6415,
    taxAmount: 24248.7,
    discountAmount: 0,
    totalAmount: 158963.7,
    paidAmount: 100000,
    balanceAmount: 58963.7,
    paymentStatus: 'Partially Paid',
    payments: [
      {
        id: 'pay-2',
        folioId: 'fol-102',
        amount: 100000,
        paymentMethod: 'Bank Transfer',
        transactionRef: 'WIRE-CHASE-002910',
        notes: 'Full accommodation advance wire',
        recordedBy: 'Vikramaditya Oberoi',
        createdAt: '2026-10-23'
      }
    ]
  },
  {
    id: 'fol-103',
    bookingId: 'b-103',
    roomCharge: 9000,
    foodCharge: 1200,
    laundryCharge: 400,
    extraCharges: [],
    serviceCharge: 530,
    taxAmount: 2003.4,
    discountAmount: 0,
    totalAmount: 13133.4,
    paidAmount: 13133.4,
    balanceAmount: 0,
    paymentStatus: 'Settled',
    payments: [
      {
        id: 'pay-3',
        folioId: 'fol-103',
        amount: 13133.4,
        paymentMethod: 'UPI',
        transactionRef: 'UPI/6291048201/rajesh@icici',
        notes: 'Full instant clearance via UPI',
        recordedBy: 'Pooja Sharma',
        createdAt: `${today} 09:15:00`
      }
    ]
  },
  {
    id: 'fol-104',
    bookingId: 'b-104',
    roomCharge: 22500,
    foodCharge: 0,
    laundryCharge: 0,
    extraCharges: [],
    serviceCharge: 1125,
    taxAmount: 4252.5,
    discountAmount: 0,
    totalAmount: 27877.5,
    paidAmount: 10000,
    balanceAmount: 17877.5,
    paymentStatus: 'Partially Paid',
    payments: [
      {
        id: 'pay-4',
        folioId: 'fol-104',
        amount: 10000,
        paymentMethod: 'Card',
        transactionRef: 'OTA-VIRTUAL-CARD',
        notes: 'Advance booking deposit',
        recordedBy: 'System Online',
        createdAt: '2026-10-25'
      }
    ]
  },
  {
    id: 'fol-105',
    bookingId: 'b-105',
    roomCharge: 33000,
    foodCharge: 0,
    laundryCharge: 0,
    extraCharges: [],
    serviceCharge: 1650,
    taxAmount: 6237,
    discountAmount: 0,
    totalAmount: 40887,
    paidAmount: 0,
    balanceAmount: 40887,
    paymentStatus: 'Unpaid',
    payments: []
  }
];

export const initialHousekeepingTasks: HousekeepingTask[] = [
  {
    id: 'hk-1',
    roomId: 'r-104',
    assignedTo: 'Ramesh Khurana',
    taskType: 'Turnaround Cleaning',
    status: 'In Progress',
    startedAt: `${today} 11:00:00`,
    linenChanged: true,
    toiletriesRestocked: false,
    minibarChecked: true,
    remarks: 'Replace bathrobes and restock herbal bath amenities.'
  },
  {
    id: 'hk-2',
    roomId: 'r-202',
    assignedTo: 'Ramesh Khurana',
    taskType: 'Turnaround Cleaning',
    status: 'Pending',
    linenChanged: false,
    toiletriesRestocked: false,
    minibarChecked: false,
    remarks: 'Check ocean balcony sliding doors and polish brass handles.'
  },
  {
    id: 'hk-3',
    roomId: 'r-302',
    assignedTo: 'Ramesh Khurana',
    taskType: 'Deep Sanitization',
    status: 'In Progress',
    startedAt: `${today} 10:30:00`,
    linenChanged: true,
    toiletriesRestocked: true,
    minibarChecked: true,
    remarks: 'Jacuzzi steam descaling and silk drapery refresh.'
  },
  {
    id: 'hk-4',
    roomId: 'r-203',
    assignedTo: 'Ramesh Khurana',
    taskType: 'VIP Arrival Preparation',
    status: 'Approved',
    startedAt: `${today} 08:30:00`,
    completedAt: `${today} 09:45:00`,
    linenChanged: true,
    toiletriesRestocked: true,
    minibarChecked: true,
    remarks: 'Supervisor inspected. Fresh orchids placed. Ready for Dr. Aisha check-in.'
  }
];

export const initialMenuItems: MenuItem[] = [
  {
    id: 'm-1',
    category: 'Breakfast',
    name: 'Royal Indian Maharaja Thali',
    description: 'Poori bhaji, saffron paratha, steamed idlis, fresh seasonal juice, and hand-ground masala chai.',
    price: 650,
    isActive: true
  },
  {
    id: 'm-2',
    category: 'Breakfast',
    name: 'Grand Continental Eggs Benedict',
    description: 'Artisan brioche, smoked salmon, poached organic eggs, citrus hollandaise, roasted vine tomatoes.',
    price: 750,
    isActive: true
  },
  {
    id: 'm-3',
    category: 'Lunch',
    name: 'Dum Pukht Awadhi Biryani',
    description: 'Slow-cooked aged Basmati rice with whole spices, tender cuts, saffron milk, and chilled burrani raita.',
    price: 1150,
    isActive: true
  },
  {
    id: 'm-4',
    category: 'Lunch',
    name: 'Paneer Tikka Velvet Makhani',
    description: 'Charcoal tandoor cottage cheese simmered in roasted cashew and vine-ripened tomato emulsion.',
    price: 850,
    isActive: true
  },
  {
    id: 'm-5',
    category: 'Dinner',
    name: 'Tandoori Ocean Jumbo Prawns',
    description: 'Fresh coastal prawns marinated in yellow mustard oil, dried fenugreek, and hung Greek yogurt.',
    price: 1650,
    isActive: true
  },
  {
    id: 'm-6',
    category: 'Dinner',
    name: 'Dal Makhani Bukhara Heritage',
    description: 'Black lentils slow cooked overnight on charcoal braziers with churned white butter.',
    price: 650,
    isActive: true
  },
  {
    id: 'm-7',
    category: 'Snacks',
    name: 'Truffle & Aged Cheddar Sliders',
    description: 'Handmade brioche buns, truffle aioli, heirloom caramelized shallots, crisp gold fries.',
    price: 600,
    isActive: true
  },
  {
    id: 'm-8',
    category: 'Beverages',
    name: 'Darjeeling First Flush Rare Tea',
    description: 'Single-estate organic spring harvest infusion served in bone china with lavender shortbread.',
    price: 350,
    isActive: true
  },
  {
    id: 'm-9',
    category: 'Beverages',
    name: 'Coastal Tender Coconut Water',
    description: 'Hand-picked organic green coconut served chilled with mint and lime sprig.',
    price: 250,
    isActive: true
  },
  {
    id: 'm-10',
    category: 'Room Service',
    name: 'Late Night Palace Club Sandwich',
    description: 'Triple-decker grilled chicken breast, fried egg, crisp bacon or avocado, accompanied by house fries.',
    price: 700,
    isActive: true
  }
];

export const initialTables: RestaurantTable[] = [
  { id: 't-1', tableNumber: 'Table 01 (Sea View Bay)', capacity: 4, status: 'Occupied' },
  { id: 't-2', tableNumber: 'Table 02 (Sea View Bay)', capacity: 2, status: 'Available' },
  { id: 't-3', tableNumber: 'Table 03 (Royal Garden Gazebo)', capacity: 6, status: 'Available' },
  { id: 't-4', tableNumber: 'Table 04 (Maharaja Private Salon)', capacity: 8, status: 'Reserved' },
  { id: 't-5', tableNumber: 'Table 05 (Indoor Piano Bar)', capacity: 4, status: 'Available' }
];

export const initialOrders: RestaurantOrder[] = [
  {
    id: 'ord-1',
    orderNumber: 'KOT-88201',
    orderType: 'Room Service',
    roomId: 'r-201',
    bookingId: 'b-101',
    guestName: 'Aditya Singhania',
    status: 'Served',
    items: [
      { menuItemId: 'm-3', name: 'Dum Pukht Awadhi Biryani', quantity: 2, unitPrice: 1150, totalPrice: 2300 },
      { menuItemId: 'm-8', name: 'Darjeeling First Flush Rare Tea', quantity: 2, unitPrice: 350, totalPrice: 700 }
    ],
    subtotal: 3000,
    tax: 150, // 5% GST for F&B
    totalAmount: 3150,
    billedToRoom: true,
    createdAt: `${yesterday} 20:30:00`
  },
  {
    id: 'ord-2',
    orderNumber: 'KOT-88202',
    orderType: 'Dine-in',
    tableId: 't-1',
    status: 'Preparing',
    items: [
      { menuItemId: 'm-5', name: 'Tandoori Ocean Jumbo Prawns', quantity: 2, unitPrice: 1650, totalPrice: 3300 },
      { menuItemId: 'm-6', name: 'Dal Makhani Bukhara Heritage', quantity: 1, unitPrice: 650, totalPrice: 650 },
      { menuItemId: 'm-9', name: 'Coastal Tender Coconut Water', quantity: 2, unitPrice: 250, totalPrice: 500 }
    ],
    subtotal: 4450,
    tax: 222.5,
    totalAmount: 4672.5,
    billedToRoom: false,
    createdAt: `${today} 19:40:00`
  }
];

export const initialInventory: InventoryItem[] = [
  { id: 'inv-1', name: 'Aged Himalayan Basmati Rice', category: 'Kitchen', quantity: 140, unit: 'kg', reorderLevel: 40, unitCost: 150, supplierInfo: 'Himalaya Heritage Grains Ltd' },
  { id: 'inv-2', name: 'Amul Churned Cultured Butter', category: 'Kitchen', quantity: 48, unit: 'kg', reorderLevel: 15, unitCost: 520, supplierInfo: 'Gujarat Dairy Co-operative' },
  { id: 'inv-3', name: 'Saffron Threads (Kashmiri Mongra)', category: 'Kitchen', quantity: 0.8, unit: 'kg', reorderLevel: 0.2, unitCost: 180000, supplierInfo: 'Pampore Spice Guild' },
  { id: 'inv-4', name: 'Egyptian Cotton King Linens (400 TC)', category: 'Housekeeping', quantity: 85, unit: 'units', reorderLevel: 25, unitCost: 1400, supplierInfo: 'Bombay Dyeing Hotel Linens' },
  { id: 'inv-5', name: 'Kama Ayurveda Luxury Guest Kits', category: 'Housekeeping', quantity: 18, unit: 'kits', reorderLevel: 30, unitCost: 220, supplierInfo: 'Kama Ayurveda Hospitality' },
  { id: 'inv-6', name: 'Darjeeling Estate Green & Black Tea', category: 'Beverage', quantity: 320, unit: 'boxes', reorderLevel: 50, unitCost: 180, supplierInfo: 'Glenburn Estates' },
  { id: 'inv-7', name: 'Single-Malt & Reserve Wine Miniatures', category: 'Amenities', quantity: 94, unit: 'bottles', reorderLevel: 30, unitCost: 450, supplierInfo: 'Sula & Amrut Distilleries' }
];

export const initialStockMovements: StockMovement[] = [
  {
    id: 'sm-1',
    itemId: 'inv-1',
    itemName: 'Aged Himalayan Basmati Rice',
    movementType: 'IN',
    quantity: 100,
    unit: 'kg',
    reason: 'Weekly fresh kitchen replenishment PO #9910',
    createdAt: `${yesterday} 08:30:00`
  },
  {
    id: 'sm-2',
    itemId: 'inv-5',
    itemName: 'Kama Ayurveda Luxury Guest Kits',
    movementType: 'OUT',
    quantity: 12,
    unit: 'kits',
    reason: 'VIP Arrival suite turnovers Floor 2 & 4',
    createdAt: `${today} 10:15:00`
  }
];

export const initialLaundryOrders: LaundryOrder[] = [
  {
    id: 'lnd-1',
    bookingId: 'b-101',
    roomNumber: '201',
    guestName: 'Aditya Singhania',
    itemsCount: 5,
    serviceType: 'Complete Laundry Express',
    status: 'Ready',
    totalCharge: 850,
    createdAt: `${yesterday} 17:00:00`
  },
  {
    id: 'lnd-2',
    bookingId: 'b-103',
    roomNumber: '103',
    guestName: 'Rajesh Patel',
    itemsCount: 3,
    serviceType: 'Ironing',
    status: 'Delivered',
    totalCharge: 400,
    createdAt: `${yesterday} 19:30:00`
  }
];

export const initialMaintenanceTickets: MaintenanceTicket[] = [
  {
    id: 'mt-1',
    roomId: 'r-501',
    issueDescription: 'AC compressor recalibration and thermostat vibration dampening.',
    priority: 'High',
    status: 'In Progress',
    expense: 3500,
    reportedBy: 'Ramesh Khurana',
    reportedAt: `${yesterday} 09:30:00`
  },
  {
    id: 'mt-2',
    roomId: 'r-201',
    issueDescription: 'Balcony door weather-strip seal adjustment.',
    priority: 'Low',
    status: 'Resolved',
    expense: 800,
    reportedBy: 'Pooja Sharma',
    reportedAt: `${yesterday} 15:00:00`,
    resolvedAt: `${today} 10:00:00`
  }
];

export const initialExpenses: ExpenseRecord[] = [
  { id: 'exp-1', title: 'Commercial Municipal Water & Power Grid', category: 'Utilities & Power', amount: 145000, date: `${yesterday}`, notes: 'Monthly utility billing' },
  { id: 'exp-2', title: 'Heritage Linens & Egyptian Cotton Batch', category: 'Housekeeping Goods', amount: 48000, date: `${yesterday}`, notes: 'Restock of 400TC sheets' },
  { id: 'exp-3', title: 'HVAC Chiller Preventive Maintenance AMC', category: 'Maintenance & Repair', amount: 35000, date: `${today}`, notes: 'Daikin commercial maintenance team' },
  { id: 'exp-4', title: 'Organic Farm Dairy & Vegetable Procurements', category: 'Kitchen Supplies', amount: 28500, date: `${today}`, notes: 'Fresh local farm supply' }
];

export const initialAuditLogs: AuditLogEntry[] = [
  {
    id: 'log-1',
    userName: 'Vikramaditya Oberoi',
    action: 'SYSTEM_BOOT',
    details: 'Hotel PMS initialized with 20 rooms, 5 categories, and live folios.',
    timestamp: `${yesterday} 08:00:00`
  },
  {
    id: 'log-2',
    userName: 'Pooja Sharma',
    action: 'CHECK_IN',
    details: 'Guest Aditya Singhania checked into Deluxe Sea Facing Room 201 (Booking GRP-2610-001).',
    timestamp: `${yesterday} 14:15:00`
  },
  {
    id: 'log-3',
    userName: 'Chef Sanjeev Anand',
    action: 'ROOM_SERVICE_BILLED',
    details: 'Order KOT-88201 billed directly to Room 201 Folio #fol-101 (₹3,150).',
    timestamp: `${yesterday} 20:30:00`
  },
  {
    id: 'log-4',
    userName: 'Pooja Sharma',
    action: 'CHECK_IN',
    details: 'VIP Eleanor Vanderbilt checked into Presidential Suite Room 401 (Booking GRP-2610-002).',
    timestamp: `${today} 13:40:00`
  }
];
