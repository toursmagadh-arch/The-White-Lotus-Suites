import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  DollarSign
} from 'lucide-react';
import { useHotel } from '../context/HotelContext';
import { MaintenanceTicket } from '../types/hotel';

export const MaintenanceView: React.FC = () => {
  const {
    maintenanceTickets,
    rooms,
    hotelSettings,
    addMaintenanceTicket,
    resolveMaintenanceTicket,
    currentUser
  } = useHotel();

  const [showAddModal, setShowAddModal] = useState(false);
  const [resolveTicketId, setResolveTicketId] = useState<string | null>(null);
  const [resolveExpense, setResolveExpense] = useState<string>('0');

  // Form state
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id || '');
  const [issueDesc, setIssueDesc] = useState<string>('');
  const [priority, setPriority] = useState<MaintenanceTicket['priority']>('Medium');
  const [estExpense, setEstExpense] = useState<string>('1500');

  const handleOpenAddModal = () => {
    setSelectedRoomId(rooms[0]?.id || '');
    setIssueDesc('');
    setPriority('Medium');
    setEstExpense('1500');
    setShowAddModal(true);
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId || !issueDesc.trim()) return;

    addMaintenanceTicket({
      roomId: selectedRoomId,
      issueDescription: issueDesc.trim(),
      priority,
      status: 'In Progress',
      expense: parseFloat(estExpense) || 0,
      reportedBy: currentUser.name
    });

    setShowAddModal(false);
  };

  const handleExecuteResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveTicketId) return;

    resolveMaintenanceTicket(resolveTicketId, parseFloat(resolveExpense) || 0);
    setResolveTicketId(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>Property Engineering & Maintenance Logs</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Report facility issues, automatically lock suites from inventory, and log engineering expenses.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all font-bold shadow-sm shadow-amber-500/20"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Block Suite & Log Work Order</span>
        </button>
      </div>

      {/* Tickets Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Room #</th>
                <th className="py-3 px-4">Issue Description</th>
                <th className="py-3 px-4 text-center">Priority</th>
                <th className="py-3 px-4 text-right">Expense ({hotelSettings.currencySymbol})</th>
                <th className="py-3 px-4">Reported By / Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {maintenanceTickets.map((ticket) => {
                const room = rooms.find(r => r.id === ticket.roomId);
                return (
                  <tr key={ticket.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-serif-luxury text-base font-bold text-amber-300">
                        Room {room?.roomNumber}
                      </span>
                      <span className="text-[10px] text-slate-500 block">Floor {room?.floor}</span>
                    </td>

                    <td className="py-3 px-4 max-w-sm">
                      <p className="font-medium text-slate-200">{ticket.issueDescription}</p>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        ticket.priority === 'Critical'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : ticket.priority === 'High'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {ticket.priority}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-200">
                      {hotelSettings.currencySymbol}{ticket.expense.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-slate-400">
                      <p className="text-slate-200">{ticket.reportedBy}</p>
                      <p className="text-[10px] text-slate-500">{ticket.reportedAt}</p>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        ticket.status === 'Resolved'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {ticket.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {ticket.status !== 'Resolved' ? (
                        <button
                          onClick={() => {
                            setResolveTicketId(ticket.id);
                            setResolveExpense(ticket.expense.toString());
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1 ml-auto"
                        >
                          <Unlock className="w-3 h-3" />
                          <span>Clear & Reopen</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">Resolved</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {maintenanceTickets.length === 0 && (
          <div className="p-10 text-center text-slate-400">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
            <p className="text-sm">All property facilities and suites are currently operational.</p>
          </div>
        )}
      </div>

      {/* CREATE WORK ORDER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-xl shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-400" />
                <span>Block Suite & Open Engineering Work Order</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Select Suite to Block</label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                >
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>
                      Room {r.roomNumber} (Status: {r.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Issue Description & Defect</label>
                <textarea
                  rows={3}
                  value={issueDesc}
                  onChange={(e) => setIssueDesc(e.target.value)}
                  placeholder="e.g. AC compressor vibration, plumbing valve replacement..."
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Urgency Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High Urgency</option>
                    <option value="Critical">Critical Facility Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Estimated Cost ({hotelSettings.currencySymbol})</label>
                  <input
                    type="number"
                    value={estExpense}
                    onChange={(e) => setEstExpense(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-slate-950 rounded text-[11px] text-amber-300/80">
                Notice: Submitting will place the room in <strong>Maintenance</strong> status, immediately blocking it from being reserved or assigned.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold rounded"
                >
                  Lock Suite & Log Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESOLVE WORK ORDER MODAL */}
      {resolveTicketId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-xl shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <Unlock className="w-4 h-4 text-emerald-400" />
                <span>Resolve Work Order & Release Suite</span>
              </h3>
              <button onClick={() => setResolveTicketId(null)} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleExecuteResolve} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Final Actual Expenditure ({hotelSettings.currencySymbol})</label>
                <input
                  type="number"
                  value={resolveExpense}
                  onChange={(e) => setResolveExpense(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                  required
                />
              </div>

              <div className="p-2.5 bg-slate-950 rounded text-[11px] text-slate-300">
                Upon clearance, this room will be transferred to <strong>Dirty</strong> for thorough Housekeeping sanitization and supervisor inspection before guest release.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setResolveTicketId(null)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded"
                >
                  Confirm Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
