import React, { useState } from 'react';
import {
  Users,
  Plus,
  Shield,
  Clock,
  Phone,
  Mail,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { useHotel } from '../context/HotelContext';
import { User, UserRole } from '../types/hotel';

export const StaffView: React.FC = () => {
  const { users, addUser, currentUser } = useHotel();

  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('Receptionist');
  const [shift, setShift] = useState<User['shift']>('Morning (06:00 - 14:00)');

  const rolesList: { role: UserRole; desc: string; access: string }[] = [
    { role: 'Administrator', desc: 'Full property ownership & administrative control', access: 'All Modules + Staff + Settings & Data Backup' },
    { role: 'Manager', desc: 'Hotel operations supervisor & shift director', access: 'Dashboard, Rooms, Reservations, Housekeeping, POS, Reports' },
    { role: 'Receptionist', desc: 'Front desk guest service & concierge team', access: 'Reservations, Front Desk, Check-In/Out, Room Transfers, Invoices' },
    { role: 'Housekeeping', desc: 'Suite sanitization & turn-down attendants', access: 'Housekeeping Tasks, Room Cleaning Status, Inventory' },
    { role: 'Chef', desc: 'Culinary executive & banquet dining lead', access: 'Restaurant POS, Kitchen Display Tickets (KOT), Food Stock' },
    { role: 'Restaurant Staff', desc: 'In-Room dining servers & table captains', access: 'Restaurant POS, Room Service Folio Billing' },
    { role: 'Accountant', desc: 'Financial audit, tax accounting & cash closing', access: 'Billing & Folios, Operational Expenses, P&L Reports' }
  ];

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    addUser({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || '+91 98200 00000',
      role,
      shift,
      status: 'Active'
    });

    setShowAddModal(false);
    setName('');
    setEmail('');
    setPhone('');
  };

  return (
    <div className="space-y-6">
      
      {/* Control Strip */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span>Staff Directory & Role-Based Access Control (RBAC)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage authorized hotel personnel, duty shift assignments, and operational permissions.
          </p>
        </div>

        {currentUser.role === 'Administrator' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all font-bold shadow-sm shadow-amber-500/20"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Hire / Add Employee</span>
          </button>
        )}
      </div>

      {/* Staff Directory Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Employee Name</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">System Role</th>
                <th className="py-3 px-4">Assigned Shift</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-100">{user.name}</p>
                    {user.id === currentUser.id && (
                      <span className="text-[10px] text-amber-400 font-bold uppercase">(Current Logged-in Profile)</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-slate-300">
                    <p>{user.email}</p>
                    <p className="text-[11px] text-slate-500">{user.phone}</p>
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-[11px]">
                      {user.role}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{user.shift}</span>
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {user.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Permissions Matrix */}
      <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400" />
          <span>Role Permissions Architecture (RBAC)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {rolesList.map(item => (
            <div key={item.role} className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="font-bold text-amber-300 block">{item.role}</span>
              <p className="text-slate-400 text-[11px]">{item.desc}</p>
              <p className="text-[10px] text-slate-500 pt-1">
                <strong>Access:</strong> {item.access}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ADD STAFF MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-xl shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300">
                Register New Hotel Employee
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ananya Deshmukh"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Corporate Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. ananya@grandroyale.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Mobile Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98200..."
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Assigned Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                >
                  <option value="Administrator">Administrator</option>
                  <option value="Manager">Manager</option>
                  <option value="Receptionist">Receptionist</option>
                  <option value="Housekeeping">Housekeeping Attendant</option>
                  <option value="Chef">Chef</option>
                  <option value="Restaurant Staff">Restaurant Staff</option>
                  <option value="Accountant">Accountant</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Daily Work Shift</label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                >
                  <option value="Morning (06:00 - 14:00)">Morning (06:00 - 14:00)</option>
                  <option value="Evening (14:00 - 22:00)">Evening (14:00 - 22:00)</option>
                  <option value="Night (22:00 - 06:00)">Night (22:00 - 06:00)</option>
                  <option value="General (09:00 - 18:00)">General (09:00 - 18:00)</option>
                </select>
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
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded"
                >
                  Save Employee Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
