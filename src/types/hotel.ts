/**
 * Hotel Management System (PMS) TypeScript Data Types & Interfaces
 */

export type UserRole = 
  | 'Administrator'
  | 'Manager'
  | 'Receptionist'
  | 'Housekeeping'
  | 'Restaurant Staff'
  | 'Chef'
  | 'Accountant';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  shift: 'Morning (06:00 - 14:00)' | 'Evening (14:00 - 22:00)' | 'Night (22:00 - 06:00)' | 'General (09:00 - 18:00)';
  status: 'Active' | 'On Leave' | 'Inactive';
}

export interface HotelSettings {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pinCode: string;
  gstin: string;
  currencySymbol: string;
  currencyCode: string;
  taxRate: number; // e.g. 18.0 for 18% GST
  serviceChargeRate: number; // e.g. 5.0 for 5%
  checkInTime: string;
  checkOutTime: string;
}

export type RoomCategory = 
  | 'Standard'
  | 'Deluxe Sea Facing'
  | 'Super Deluxe Palace Wing'
  | 'Presidential Suite'
  | 'Executive Family Suite';

export interface RoomType {
  id: string;
  name: RoomCategory;
  baseRate: number;
  capacityAdults: number;
  capacityChildren: number;
  bedType: 'King' | 'Twin' | 'Queen' | 'Two Kings';
  amenities: string[];
  description: string;
}

export type RoomStatus = 
  | 'Available'
  | 'Occupied'
  | 'Reserved'
  | 'Dirty'
  | 'Cleaning'
  | 'Clean'
  | 'Maintenance';

export type CleaningStatus = 
  | 'Clean'
  | 'Dirty'
  | 'Cleaning in Progress'
  | 'Inspected'
  | 'Ready';

export interface Room {
  id: string;
  roomNumber: string;
  floor: number;
  roomTypeId: string;
  bedType: string;
  hasAC: boolean;
  status: RoomStatus;
  cleaningStatus: CleaningStatus;
  notes?: string;
}

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idType: 'Aadhaar' | 'Passport' | 'Driving License' | 'National ID';
  idNumber: string;
  address: string;
  city: string;
  country: string;
  vipStatus: boolean;
  createdAt: string;
}

export type BookingStatus = 
  | 'Pending'
  | 'Confirmed'
  | 'Checked-in'
  | 'Checked-out'
  | 'Cancelled'
  | 'No-show';

export type BookingSource = 
  | 'Walk-in'
  | 'Website'
  | 'Phone'
  | 'Travel Agent'
  | 'OTA (Booking.com/Expedia)';

export interface Booking {
  id: string;
  bookingCode: string;
  guestId: string;
  roomId: string;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  adults: number;
  children: number;
  nightlyRate: number;
  totalNights: number;
  roomSubtotal: number;
  bookingSource: BookingSource;
  status: BookingStatus;
  actualCheckIn?: string;
  actualCheckOut?: string;
  specialRequests?: string;
  createdAt: string;
}

export interface FolioPayment {
  id: string;
  folioId: string;
  amount: number;
  paymentMethod: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer';
  transactionRef?: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

export interface FolioExtraCharge {
  id: string;
  description: string;
  category: 'F&B' | 'Laundry' | 'Early Check-in' | 'Late Check-out' | 'Extra Bed' | 'Airport Transfer' | 'Spa' | 'Minibar' | 'Other';
  amount: number;
  createdAt: string;
}

export interface Folio {
  id: string;
  bookingId: string;
  roomCharge: number;
  extraCharges: FolioExtraCharge[];
  foodCharge: number;
  laundryCharge: number;
  serviceCharge: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: 'Unpaid' | 'Partially Paid' | 'Settled';
  payments: FolioPayment[];
}

export interface HousekeepingTask {
  id: string;
  roomId: string;
  assignedTo?: string; // staff user id or name
  taskType: 'Turnaround Cleaning' | 'Daily Linen Change' | 'Deep Sanitization' | 'VIP Arrival Preparation';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Approved';
  startedAt?: string;
  completedAt?: string;
  linenChanged: boolean;
  toiletriesRestocked: boolean;
  minibarChecked: boolean;
  remarks?: string;
}

export type MenuCategory = 
  | 'Breakfast'
  | 'Lunch'
  | 'Dinner'
  | 'Snacks'
  | 'Beverages'
  | 'Room Service';

export interface MenuItem {
  id: string;
  category: MenuCategory;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
}

export interface RestaurantTable {
  id: string;
  tableNumber: string;
  capacity: number;
  status: 'Available' | 'Occupied' | 'Reserved';
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface RestaurantOrder {
  id: string;
  orderNumber: string;
  orderType: 'Dine-in' | 'Takeaway' | 'Room Service';
  tableId?: string;
  roomId?: string;
  bookingId?: string;
  guestName?: string;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Served';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  billedToRoom: boolean;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Kitchen' | 'Beverage' | 'Housekeeping' | 'Amenities';
  quantity: number;
  unit: string;
  reorderLevel: number;
  unitCost: number;
  supplierInfo: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  movementType: 'IN' | 'OUT' | 'WASTE' | 'ADJUSTMENT';
  quantity: number;
  unit: string;
  reason: string;
  createdAt: string;
}

export interface LaundryOrder {
  id: string;
  bookingId: string;
  roomNumber: string;
  guestName: string;
  itemsCount: number;
  serviceType: 'Washing' | 'Ironing' | 'Dry Cleaning' | 'Complete Laundry Express';
  status: 'Received' | 'Processing' | 'Ready' | 'Delivered';
  totalCharge: number;
  createdAt: string;
}

export interface MaintenanceTicket {
  id: string;
  roomId: string;
  issueDescription: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Pending' | 'In Progress' | 'Resolved';
  expense: number;
  reportedBy: string;
  reportedAt: string;
  resolvedAt?: string;
}

export interface ExpenseRecord {
  id: string;
  title: string;
  category: 'Kitchen Supplies' | 'Housekeeping Goods' | 'Utilities & Power' | 'Maintenance & Repair' | 'Staff Payroll' | 'Vendor Services';
  amount: number;
  date: string;
  notes?: string;
}

export interface AuditLogEntry {
  id: string;
  userId?: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}
