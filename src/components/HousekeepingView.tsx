import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  UserCheck,
  Plus,
  CheckSquare,
  Square,
  AlertTriangle,
  ShieldCheck,
  BedDouble
} from 'lucide-react';
import { useHotel } from '../context/HotelContext';
import { HousekeepingTask } from '../types/hotel';

export const HousekeepingView: React.FC = () => {
  const {
    housekeepingTasks,
    rooms,
    users,
    addHousekeepingTask,
    updateHousekeepingTask,
    updateRoomCleaningStatus,
    currentUser
  } = useHotel();

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Add Task form
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id || '');
  const [assignedStaff, setAssignedStaff] = useState<string>('Ramesh Khurana');
  const [taskType, setTaskType] = useState<HousekeepingTask['taskType']>('Turnaround Cleaning');
  const [taskRemarks, setTaskRemarks] = useState<string>('');

  const housekeepingStaff = users.filter(u => u.role === 'Housekeeping' || u.role === 'Manager' || u.role === 'Administrator');

  const filteredTasks = housekeepingTasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) return;

    addHousekeepingTask({
      roomId: selectedRoomId,
      assignedTo: assignedStaff,
      taskType,
      status: 'Pending',
      linenChanged: false,
      toiletriesRestocked: false,
      minibarChecked: false,
      remarks: taskRemarks
    });

    // Also mark room Dirty if it wasn't already
    updateRoomCleaningStatus(selectedRoomId, 'Dirty');

    setShowAddModal(false);
    setTaskRemarks('');
  };

  const handleStartCleaning = (taskId: string) => {
    updateHousekeepingTask(taskId, {
      status: 'In Progress',
      startedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });
  };

  const handleCompleteCleaning = (taskId: string) => {
    updateHousekeepingTask(taskId, {
      status: 'Completed',
      completedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });
  };

  const handleSupervisorApproval = (taskId: string) => {
    updateHousekeepingTask(taskId, {
      status: 'Approved'
    });
  };

  const toggleChecklist = (task: HousekeepingTask, key: 'linenChanged' | 'toiletriesRestocked' | 'minibarChecked') => {
    updateHousekeepingTask(task.id, {
      [key]: !task[key]
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-900/90 border border-rose-500/20 rounded-xl">
          <p className="text-[11px] uppercase font-bold text-slate-400">Dirty / Awaiting Staff</p>
          <p className="text-2xl font-bold font-mono text-rose-400 mt-1">
            {rooms.filter(r => r.cleaningStatus === 'Dirty').length}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Post departure / routine</p>
        </div>

        <div className="p-3.5 bg-slate-900/90 border border-purple-500/20 rounded-xl">
          <p className="text-[11px] uppercase font-bold text-slate-400">In Progress</p>
          <p className="text-2xl font-bold font-mono text-purple-400 mt-1">
            {housekeepingTasks.filter(t => t.status === 'In Progress').length}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Staff actively on floor</p>
        </div>

        <div className="p-3.5 bg-slate-900/90 border border-blue-500/20 rounded-xl">
          <p className="text-[11px] uppercase font-bold text-slate-400">Inspected / Needs Sign-off</p>
          <p className="text-2xl font-bold font-mono text-blue-400 mt-1">
            {housekeepingTasks.filter(t => t.status === 'Completed').length}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Awaiting supervisor check</p>
        </div>

        <div className="p-3.5 bg-slate-900/90 border border-emerald-500/20 rounded-xl">
          <p className="text-[11px] uppercase font-bold text-slate-400">Clean & Ready</p>
          <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {rooms.filter(r => r.cleaningStatus === 'Ready').length}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Approved for Front Desk check-in</p>
        </div>
      </div>

      {/* Control Strip */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800 text-xs">
          {['all', 'Pending', 'In Progress', 'Completed', 'Approved'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                filterStatus === st ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {st === 'all' ? 'All Tasks' : st}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all font-bold shadow-sm shadow-amber-500/20"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Assign Cleaning Duty</span>
        </button>
      </div>

      {/* Housekeeping Tasks Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Room #</th>
                <th className="py-3 px-4">Task Type & Remarks</th>
                <th className="py-3 px-4">Assigned Attendant</th>
                <th className="py-3 px-4">Sanitization Checklist</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Workflow Transition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTasks.map(task => {
                const room = rooms.find(r => r.id === task.roomId);
                return (
                  <tr key={task.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-serif-luxury text-base font-bold text-amber-300">
                        Room {room?.roomNumber}
                      </span>
                      <span className="text-[10px] text-slate-500 block">Floor {room?.floor}</span>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-200">{task.taskType}</p>
                      <p className="text-[11px] text-slate-400 max-w-xs">{task.remarks || 'Standard room turnover procedure.'}</p>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-200">{task.assignedTo || 'Unassigned'}</p>
                      {task.startedAt && <p className="text-[10px] text-slate-500">Started: {task.startedAt.split(' ')[1]}</p>}
                    </td>

                    {/* Interactive Checklist */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 text-[11px]">
                        <button
                          type="button"
                          onClick={() => toggleChecklist(task, 'linenChanged')}
                          className="flex items-center gap-1.5 text-slate-300 hover:text-white text-left"
                        >
                          {task.linenChanged ? (
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-500" />
                          )}
                          <span>Egyptian Cotton Linens Changed</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleChecklist(task, 'toiletriesRestocked')}
                          className="flex items-center gap-1.5 text-slate-300 hover:text-white text-left"
                        >
                          {task.toiletriesRestocked ? (
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-500" />
                          )}
                          <span>Luxury Toiletries Restocked</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleChecklist(task, 'minibarChecked')}
                          className="flex items-center gap-1.5 text-slate-300 hover:text-white text-left"
                        >
                          {task.minibarChecked ? (
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-500" />
                          )}
                          <span>Minibar & Refreshments Audited</span>
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded inline-block ${
                        task.status === 'Approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : task.status === 'Completed'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : task.status === 'In Progress'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {task.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {task.status === 'Pending' && (
                          <button
                            onClick={() => handleStartCleaning(task.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded bg-purple-600 hover:bg-purple-500 text-white"
                          >
                            Start Cleaning
                          </button>
                        )}

                        {task.status === 'In Progress' && (
                          <button
                            onClick={() => handleCompleteCleaning(task.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded bg-blue-600 hover:bg-blue-500 text-white"
                          >
                            Mark Complete
                          </button>
                        )}

                        {task.status === 'Completed' && (
                          <button
                            onClick={() => handleSupervisorApproval(task.id)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Supervisor Pass</span>
                          </button>
                        )}

                        {task.status === 'Approved' && (
                          <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Ready for Guest</span>
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTasks.length === 0 && (
          <div className="p-10 text-center text-slate-400">
            <Sparkles className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm">No housekeeping cleaning duties in this queue.</p>
          </div>
        )}
      </div>

      {/* ASSIGN TASK MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-xl shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Assign Cleaning Duty</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Target Suite</label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400"
                >
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>
                      Room {r.roomNumber} (Status: {r.status}, Cleaning: {r.cleaningStatus})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Assigned Housekeeping Attendant</label>
                <select
                  value={assignedStaff}
                  onChange={(e) => setAssignedStaff(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400"
                >
                  {housekeepingStaff.map(u => (
                    <option key={u.id} value={u.name}>
                      {u.name} ({u.role} · {u.shift})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Duty Category</label>
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400"
                >
                  <option value="Turnaround Cleaning">Turnaround Cleaning (Full Suite turnover)</option>
                  <option value="Daily Linen Change">Daily Linen Change & Turndown</option>
                  <option value="Deep Sanitization">Deep Sanitization & Ozone Treatment</option>
                  <option value="VIP Arrival Preparation">VIP Arrival Preparation & Floral Styling</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Special Housekeeping Instructions</label>
                <textarea
                  rows={2}
                  value={taskRemarks}
                  onChange={(e) => setTaskRemarks(e.target.value)}
                  placeholder="e.g. Balcony window polishing, steam descaling for bathroom jacuzzi..."
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-amber-400"
                />
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
                  Dispatch Attendant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
