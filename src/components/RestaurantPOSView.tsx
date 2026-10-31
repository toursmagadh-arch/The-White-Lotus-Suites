import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Minus,
  Trash2,
  Send,
  Coffee,
  CheckCircle2,
  Clock,
  Printer,
  ShoppingBag,
  BellRing
} from 'lucide-react';
import { useHotel } from '../context/HotelContext';
import { MenuCategory, RestaurantOrder } from '../types/hotel';

export const RestaurantPOSView: React.FC = () => {
  const {
    menuItems,
    restaurantTables,
    restaurantOrders,
    rooms,
    bookings,
    guests,
    hotelSettings,
    createRestaurantOrder,
    updateOrderStatus
  } = useHotel();

  // Active Menu Category Filter
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Cart state
  const [cart, setCart] = useState<{ menuItemId: string; quantity: number }[]>([]);
  const [orderType, setOrderType] = useState<'Dine-in' | 'Room Service' | 'Takeaway'>('Room Service');
  const [selectedTableId, setSelectedTableId] = useState<string>(restaurantTables[0]?.id || '');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [billToFolio, setBillToFolio] = useState<boolean>(true);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);

  // Active in-house occupied rooms
  const occupiedRooms = rooms.filter(r => r.status === 'Occupied');

  // Set default room if available
  React.useEffect(() => {
    if (occupiedRooms.length > 0 && !selectedRoomId) {
      setSelectedRoomId(occupiedRooms[0].id);
    }
  }, [occupiedRooms, selectedRoomId]);

  const categories: (MenuCategory | 'all')[] = ['all', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages', 'Room Service'];

  const filteredMenuItems = menuItems.filter(m => {
    if (!m.isActive) return false;
    if (selectedCategory !== 'all' && m.category !== selectedCategory) return false;
    return true;
  });

  const handleAddToCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === itemId);
      if (existing) {
        return prev.map(c => c.menuItemId === itemId ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { menuItemId: itemId, quantity: 1 }];
    });
  };

  const handleUpdateQty = (itemId: string, delta: number) => {
    setCart(prev => {
      return prev.map(c => {
        if (c.menuItemId === itemId) {
          const newQ = c.quantity + delta;
          return newQ > 0 ? { ...c, quantity: newQ } : null;
        }
        return c;
      }).filter(Boolean) as { menuItemId: string; quantity: number }[];
    });
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart(prev => prev.filter(c => c.menuItemId !== itemId));
  };

  // Cart Totals
  const subtotal = cart.reduce((sum, itm) => {
    const item = menuItems.find(m => m.id === itm.menuItemId);
    return sum + (item ? item.price * itm.quantity : 0);
  }, 0);

  const gstTax = subtotal * 0.05; // 5% GST
  const grandTotal = subtotal + gstTax;

  const handleDispatchOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const res = createRestaurantOrder({
      orderType,
      tableId: orderType === 'Dine-in' ? selectedTableId : undefined,
      roomId: orderType === 'Room Service' ? selectedRoomId : undefined,
      items: cart,
      billedToRoom: orderType === 'Room Service' ? billToFolio : false
    });

    if (res.success) {
      setOrderSuccessMsg(`Ticket ${res.orderNumber} dispatched to kitchen queue.`);
      setCart([]);
      setTimeout(() => setOrderSuccessMsg(null), 4000);
    } else {
      alert(res.error);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Success banner */}
      {orderSuccessMsg && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{orderSuccessMsg}</span>
          </div>
        </div>
      )}

      {/* POS Two-Column Interface: Menu on Left, Cart on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Food Menu Grid (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors capitalize ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {cat === 'all' ? 'Full Menu' : cat}
              </button>
            ))}
          </div>

          {/* Menu Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[620px] overflow-y-auto pr-1">
            {filteredMenuItems.map(item => (
              <div
                key={item.id}
                onClick={() => handleAddToCart(item.id)}
                className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 p-3.5 rounded-xl flex flex-col justify-between cursor-pointer transition-all hover:-translate-y-0.5 shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-100">{item.name}</h4>
                    <span className="text-[10px] uppercase font-semibold text-amber-500/80 shrink-0">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span className="font-mono text-sm font-bold text-amber-300">
                    {hotelSettings.currencySymbol}{item.price.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    className="p-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-bold flex items-center gap-1 px-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Kitchen Order Ticket & Folio Billing Terminal (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 p-5 rounded-xl flex flex-col justify-between shadow-xs space-y-4">
          <form onSubmit={handleDispatchOrder} className="space-y-4 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-amber-400" />
                  <span>KOT / Dining Terminal</span>
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  {cart.reduce((s, c) => s + c.quantity, 0)} Items
                </span>
              </div>

              {/* Order Type Toggle */}
              <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                {(['Dine-in', 'Room Service', 'Takeaway'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setOrderType(type)}
                    className={`py-1.5 rounded-lg font-semibold transition-colors ${
                      orderType === type
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Order Context (Table or Room) */}
              <div className="mt-3">
                {orderType === 'Dine-in' && (
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Select Dining Table</label>
                    <select
                      value={selectedTableId}
                      onChange={(e) => setSelectedTableId(e.target.value)}
                      className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                    >
                      {restaurantTables.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.tableNumber} (Capacity: {t.capacity} guests)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {orderType === 'Room Service' && (
                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Select Occupied Resident Suite</label>
                      {occupiedRooms.length === 0 ? (
                        <p className="text-xs text-rose-400">No rooms are currently occupied by in-house guests.</p>
                      ) : (
                        <select
                          value={selectedRoomId}
                          onChange={(e) => setSelectedRoomId(e.target.value)}
                          className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                        >
                          {occupiedRooms.map(r => {
                            const booking = bookings.find(b => b.roomId === r.id && b.status === 'Checked-in');
                            const guest = booking ? guests.find(g => g.id === booking.guestId) : null;
                            return (
                              <option key={r.id} value={r.id}>
                                Room {r.roomNumber} — {guest ? `${guest.firstName} ${guest.lastName}` : 'Occupied'}
                              </option>
                            );
                          })}
                        </select>
                      )}
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer text-xs text-amber-300 font-medium pt-1">
                      <input
                        type="checkbox"
                        checked={billToFolio}
                        onChange={(e) => setBillToFolio(e.target.checked)}
                        className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0"
                      />
                      <span>Charge Directly to Guest Room Folio</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Cart Items List */}
              <div className="mt-4 border border-slate-800 rounded-lg overflow-hidden bg-slate-950/60 max-h-48 overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    <ShoppingBag className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
                    <span>Cart is empty. Select culinary delicacies from the menu.</span>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/80 text-xs">
                    {cart.map(c => {
                      const item = menuItems.find(m => m.id === c.menuItemId);
                      if (!item) return null;
                      return (
                        <div key={c.menuItemId} className="p-2.5 flex items-center justify-between">
                          <div className="flex-1 pr-2">
                            <p className="font-semibold text-slate-200">{item.name}</p>
                            <p className="text-[10px] text-slate-500">
                              {hotelSettings.currencySymbol}{item.price} each
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5">
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(c.menuItemId, -1)}
                                className="text-slate-400 hover:text-white p-0.5"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-mono text-xs font-bold px-1.5">{c.quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(c.menuItemId, 1)}
                                className="text-slate-400 hover:text-white p-0.5"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <span className="font-mono font-semibold text-slate-200 w-16 text-right">
                              {hotelSettings.currencySymbol}{(item.price * c.quantity).toLocaleString()}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleRemoveFromCart(c.menuItemId)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Cart Calculations & Submit */}
            <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>F&B Subtotal:</span>
                <span className="font-mono">{hotelSettings.currencySymbol}{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Restaurant GST (5%):</span>
                <span className="font-mono">{hotelSettings.currencySymbol}{gstTax.toFixed(2)}</span>
              </div>
              <div className="pt-1.5 border-t border-slate-800 flex justify-between font-bold text-base text-amber-300">
                <span>Grand Total:</span>
                <span className="font-mono">{hotelSettings.currencySymbol}{grandTotal.toFixed(2)}</span>
              </div>

              <button
                type="submit"
                disabled={cart.length === 0}
                className="w-full mt-2 py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 hover:from-amber-300 hover:to-amber-400 transition-all shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Dispatch KOT to Kitchen</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Live Kitchen Order Tickets (KOT) Monitor */}
      <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <BellRing className="w-4 h-4 text-amber-400" />
            <span>Active Kitchen Order Tickets (KOT) Display</span>
          </h3>
          <span className="text-xs text-slate-400">
            {restaurantOrders.length} Recent tickets logged
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {restaurantOrders.slice(0, 6).map((order) => {
            const table = restaurantTables.find(t => t.id === order.tableId);
            const room = rooms.find(r => r.id === order.roomId);

            return (
              <div key={order.id} className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 space-y-3 text-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-bold text-amber-300">{order.orderNumber}</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {order.orderType}: {order.orderType === 'Dine-in' ? table?.tableNumber : `Room ${room?.roomNumber}`}
                      </p>
                      {order.billedToRoom && (
                        <span className="text-[10px] text-emerald-400 font-semibold">[Billed to Folio]</span>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      order.status === 'Served'
                        ? 'bg-slate-800 text-slate-400'
                        : order.status === 'Ready'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : order.status === 'Preparing'
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 divide-y divide-slate-800/40">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="pt-1 flex justify-between text-slate-300">
                        <span>{it.quantity}x {it.name}</span>
                        <span className="font-mono text-slate-400">{hotelSettings.currencySymbol}{it.totalPrice}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                  <span className="font-bold text-amber-300 font-mono">
                    Total: {hotelSettings.currencySymbol}{order.totalAmount.toFixed(0)}
                  </span>
                  
                  <div className="flex gap-1.5">
                    {order.status === 'Pending' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'Preparing')}
                        className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px]"
                      >
                        Start Prep
                      </button>
                    )}
                    {order.status === 'Preparing' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'Ready')}
                        className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px]"
                      >
                        Mark Ready
                      </button>
                    )}
                    {order.status === 'Ready' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'Served')}
                        className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white font-bold text-[10px]"
                      >
                        Serve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
