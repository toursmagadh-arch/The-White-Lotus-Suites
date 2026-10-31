import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  RefreshCw,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingDown,
  PackageCheck
} from 'lucide-react';
import { useHotel } from '../context/HotelContext';
import { InventoryItem } from '../types/hotel';

export const InventoryView: React.FC = () => {
  const {
    inventory,
    stockMovements,
    hotelSettings,
    recordStockMovement,
    addInventoryItem
  } = useHotel();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);

  // Movement Form
  const [movementItemId, setMovementItemId] = useState<string>(inventory[0]?.id || '');
  const [movementType, setMovementType] = useState<'IN' | 'OUT' | 'WASTE' | 'ADJUSTMENT'>('IN');
  const [movementQty, setMovementQty] = useState<string>('10');
  const [movementReason, setMovementReason] = useState<string>('Fresh purchase procurement PO');
  const [movementError, setMovementError] = useState<string | null>(null);

  // Add Item Form
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<InventoryItem['category']>('Kitchen');
  const [newItemQty, setNewItemQty] = useState('50');
  const [newItemUnit, setNewItemUnit] = useState('kg');
  const [newItemReorder, setNewItemReorder] = useState('15');
  const [newItemCost, setNewItemCost] = useState('200');
  const [newItemSupplier, setNewItemSupplier] = useState('');

  const categories = ['all', 'Kitchen', 'Beverage', 'Housekeeping', 'Amenities'];

  const filteredItems = inventory.filter(i => {
    if (selectedCategory !== 'all' && i.category !== selectedCategory) return false;
    return true;
  });

  const lowStockItems = inventory.filter(i => i.quantity <= i.reorderLevel);

  const handleStockMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMovementError(null);
    const q = parseFloat(movementQty);
    if (isNaN(q) || q <= 0) return;

    const res = recordStockMovement(movementItemId, movementType, q, movementReason);
    if (!res.success) {
      setMovementError(res.error || 'Failed to update stock');
      return;
    }

    setShowMovementModal(false);
    setMovementQty('10');
  };

  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    addInventoryItem({
      name: newItemName.trim(),
      category: newItemCategory,
      quantity: parseFloat(newItemQty) || 0,
      unit: newItemUnit.trim() || 'units',
      reorderLevel: parseFloat(newItemReorder) || 5,
      unitCost: parseFloat(newItemCost) || 0,
      supplierInfo: newItemSupplier.trim() || 'Local Hospitality Vendor'
    });

    setShowAddItemModal(false);
    setNewItemName('');
  };

  return (
    <div className="space-y-6">
      
      {/* Low stock alert strip if any */}
      {lowStockItems.length > 0 && (
        <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>Low Inventory Alert:</strong> {lowStockItems.length} items have fallen below configured reorder threshold ({lowStockItems.map(i => i.name).join(', ')}).
            </span>
          </div>
          <button
            onClick={() => {
              setMovementType('IN');
              setMovementReason('Emergency stock replenishment');
              setShowMovementModal(true);
            }}
            className="px-2.5 py-1 bg-rose-500 text-slate-950 font-bold rounded text-[11px] shrink-0"
          >
            Replenish
          </button>
        </div>
      )}

      {/* Control Strip */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors capitalize ${
                selectedCategory === c
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {c === 'all' ? 'All Inventory' : c}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMovementModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Log Stock IN / Waste</span>
          </button>

          <button
            onClick={() => setShowAddItemModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold transition-all shadow-sm shadow-amber-500/20"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Raw Item</span>
          </button>
        </div>
      </div>

      {/* Inventory Items Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-right">In Stock Quantity</th>
                <th className="py-3 px-4 text-right">Reorder Level</th>
                <th className="py-3 px-4 text-right">Unit Cost</th>
                <th className="py-3 px-4">Vendor & Supplier</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredItems.map((item) => {
                const isLow = item.quantity <= item.reorderLevel;
                return (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-200">{item.name}</td>
                    <td className="py-3 px-4 text-slate-400">{item.category}</td>
                    <td className={`py-3 px-4 text-right font-mono font-bold ${isLow ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {item.quantity} {item.unit}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                      {item.reorderLevel} {item.unit}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300">
                      {hotelSettings.currencySymbol}{item.unitCost.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{item.supplierInfo}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        isLow
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {isLow ? 'Reorder Alert' : 'Optimal'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Stock Movements Ledger */}
      <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl space-y-3">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Boxes className="w-4 h-4 text-amber-400" />
          <span>Audit Log of Stock In / Out Movements</span>
        </h3>
        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Item</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3 text-right">Quantity</th>
                <th className="py-2.5 px-3">Operational Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {stockMovements.map(m => (
                <tr key={m.id}>
                  <td className="py-2 px-3 text-slate-400">{m.createdAt}</td>
                  <td className="py-2 px-3 text-slate-200 font-sans font-medium">{m.itemName}</td>
                  <td className="py-2 px-3">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      m.movementType === 'IN'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : m.movementType === 'WASTE'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {m.movementType}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right text-slate-100">{m.quantity} {m.unit}</td>
                  <td className="py-2 px-3 font-sans text-slate-400">{m.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* LOG STOCK MOVEMENT MODAL */}
      {showMovementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-xl shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300">
                Log Stock In / Out / Waste Movement
              </h3>
              <button onClick={() => setShowMovementModal(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            {movementError && (
              <div className="p-2.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                {movementError}
              </div>
            )}

            <form onSubmit={handleStockMovementSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Select Raw Item</label>
                <select
                  value={movementItemId}
                  onChange={(e) => setMovementItemId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                >
                  {inventory.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Current: {i.quantity} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Movement Type</label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                >
                  <option value="IN">Stock IN (Fresh Receipt / Purchase)</option>
                  <option value="OUT">Stock OUT (Kitchen / Department Issue)</option>
                  <option value="WASTE">Damaged / Expired / Spoilage Waste</option>
                  <option value="ADJUSTMENT">Physical Audit Stock Adjustment</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Quantity</label>
                <input
                  type="number"
                  step="0.1"
                  value={movementQty}
                  onChange={(e) => setMovementQty(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Reason / Purchase Order / Audit Note</label>
                <input
                  type="text"
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded"
                >
                  Confirm Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD INVENTORY ITEM MODAL */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-xl shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300">
                Add New Inventory Raw Material
              </h3>
              <button onClick={() => setShowAddItemModal(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleAddItemSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Item Name</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Kashmiri Saffron"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Category</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  >
                    <option value="Kitchen">Kitchen Supplies</option>
                    <option value="Beverage">Beverage Bar</option>
                    <option value="Housekeeping">Housekeeping Linens</option>
                    <option value="Amenities">Guest Room Amenities</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    placeholder="kg, liters, units, boxes"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Initial Qty</label>
                  <input
                    type="number"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Reorder Level</label>
                  <input
                    type="number"
                    value={newItemReorder}
                    onChange={(e) => setNewItemReorder(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Unit Cost ({hotelSettings.currencySymbol})</label>
                  <input
                    type="number"
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Supplier / Vendor Contact</label>
                <input
                  type="text"
                  value={newItemSupplier}
                  onChange={(e) => setNewItemSupplier(e.target.value)}
                  placeholder="e.g. Bombay Hospitality Supplies Ltd"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
