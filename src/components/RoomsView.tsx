import React, { useState, useMemo } from 'react';
import {
  KeyRound,
  Plus,
  Filter,
  Search,
  CheckCircle,
  Users,
  Clock,
  Sparkles,
  Wrench,
  Edit2,
  Trash2,
  AlertCircle,
  Wind,
  BedDouble
} from 'lucide-react';
import { useHotel } from '../context/HotelContext';
import { Room, RoomStatus, CleaningStatus } from '../types/hotel';

interface RoomsViewProps {
  onOpenNewBookingWithRoom: (roomId: string) => void;
  onViewFolio: (folioId: string) => void;
}

export const RoomsView: React.FC<RoomsViewProps> = ({
  onOpenNewBookingWithRoom,
  onViewFolio
}) => {
  const {
    rooms,
    roomTypes,
    bookings,
    guests,
    folios,
    hotelSettings,
    addRoom,
    updateRoom,
    deleteRoom,
    updateRoomStatus,
    updateRoomCleaningStatus,
    currentUser
  } = useHotel();

  // Filters
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Form State for Add / Edit
  const [formRoomNum, setFormRoomNum] = useState<string>('');
  const [formFloor, setFormFloor] = useState<number>(1);
  const [formTypeId, setFormTypeId] = useState<string>(roomTypes[0]?.id || '');
  const [formBedType, setFormBedType] = useState<string>('King');
  const [formHasAC, setFormHasAC] = useState<boolean>(true);
  const [formNotes, setFormNotes] = useState<string>('');

  // Distinct floors list
  const floors = useMemo(() => {
    const list = Array.from(new Set(rooms.map(r => r.floor))).sort((a, b) => a - b);
    return list;
  }, [rooms]);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter(r => {
      if (selectedFloor !== 'all' && r.floor.toString() !== selectedFloor) return false;
      if (selectedCategory !== 'all' && r.roomTypeId !== selectedCategory) return false;
      if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const type = roomTypes.find(rt => rt.id === r.roomTypeId);
        const matchesNum = r.roomNumber.toLowerCase().includes(q);
        const matchesType = type?.name.toLowerCase().includes(q);
        if (!matchesNum && !matchesType) return false;
      }
      return true;
    });
  }, [rooms, roomTypes, selectedFloor, selectedCategory, selectedStatus, searchQuery]);

  const handleOpenAddModal = () => {
    setActionError(null);
    setFormRoomNum('');
    setFormFloor(1);
    setFormTypeId(roomTypes[0]?.id || '');
    setFormBedType('King');
    setFormHasAC(true);
    setFormNotes('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (room: Room) => {
    setActionError(null);
    setEditingRoom(room);
    setFormRoomNum(room.roomNumber);
    setFormFloor(room.floor);
    setFormTypeId(room.roomTypeId);
    setFormBedType(room.bedType);
    setFormHasAC(room.hasAC);
    setFormNotes(room.notes || '');
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    if (!formRoomNum.trim()) {
      setActionError('Room number is required.');
      return;
    }

    if (editingRoom) {
      updateRoom(editingRoom.id, {
        roomNumber: formRoomNum.trim(),
        floor: formFloor,
        roomTypeId: formTypeId,
        bedType: formBedType,
        hasAC: formHasAC,
        notes: formNotes
      });
      setEditingRoom(null);
    } else {
      const res = addRoom({
        roomNumber: formRoomNum.trim(),
        floor: formFloor,
        roomTypeId: formTypeId,
        bedType: formBedType,
        hasAC: formHasAC,
        status: 'Available',
        cleaningStatus: 'Ready',
        notes: formNotes
      });
      if (!res.success) {
        setActionError(res.error || 'Failed to add room.');
        return;
      }
      setShowAddModal(false);
    }
  };

  const handleDelete = (roomId: string) => {
    if (confirm('Are you sure you want to remove this room from property records?')) {
      const res = deleteRoom(roomId);
      if (!res.success) {
        alert(res.error);
      }
    }
  };

  // Status visual mapping
  const getStatusBorder = (status: RoomStatus) => {
    switch (status) {
      case 'Available': return 'border-emerald-500/40 hover:border-emerald-400';
      case 'Occupied': return 'border-blue-500/40 hover:border-blue-400';
      case 'Reserved': return 'border-amber-500/40 hover:border-amber-400';
      case 'Dirty': return 'border-rose-500/40 hover:border-rose-400';
      case 'Cleaning': return 'border-purple-500/40 hover:border-purple-400';
      case 'Maintenance': return 'border-slate-600 hover:border-slate-500';
      default: return 'border-slate-800';
    }
  };

  const getStatusBadge = (status: RoomStatus, cleaning: CleaningStatus) => {
    switch (status) {
      case 'Available':
        return <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Available ({cleaning})</span>;
      case 'Occupied':
        return <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">Occupied</span>;
      case 'Reserved':
        return <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">Reserved</span>;
      case 'Dirty':
        return <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">Dirty</span>;
      case 'Cleaning':
        return <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">In Cleaning</span>;
      case 'Maintenance':
        return <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600">Maintenance</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Filters & Control Strip */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-3">
        <div className="flex flex-col md:flex-row justify-between gap-3 items-stretch md:items-center">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by room number, suite type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:border-amber-400 focus:outline-hidden"
            />
          </div>

          {/* Action Button */}
          {['Administrator', 'Manager'].includes(currentUser.role) && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all font-bold shadow-sm shadow-amber-500/20"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add New Room</span>
            </button>
          )}
        </div>

        {/* Category & Status Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
          
          {/* Floor tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
            <span className="text-[11px] text-slate-500 uppercase font-bold mr-1">Floor:</span>
            <button
              onClick={() => setSelectedFloor('all')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                selectedFloor === 'all' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            {floors.map(fl => (
              <button
                key={fl}
                onClick={() => setSelectedFloor(fl.toString())}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedFloor === fl.toString() ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Floor {fl}
              </button>
            ))}
          </div>

          {/* Status Quick Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {['all', 'Available', 'Occupied', 'Reserved', 'Dirty', 'Cleaning', 'Maintenance'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors capitalize ${
                  selectedStatus === st
                    ? 'bg-slate-700 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Room Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredRooms.map(room => {
          const type = roomTypes.find(rt => rt.id === room.roomTypeId);
          const activeBooking = bookings.find(b => b.roomId === room.id && b.status === 'Checked-in');
          const activeGuest = activeBooking ? guests.find(g => g.id === activeBooking.guestId) : null;
          const activeFolio = activeBooking ? folios.find(f => f.bookingId === activeBooking.id) : null;

          return (
            <div
              key={room.id}
              className={`bg-slate-900/90 border rounded-xl p-4 flex flex-col justify-between transition-all hover:shadow-lg hover:-translate-y-0.5 ${getStatusBorder(room.status)}`}
            >
              <div>
                {/* Card Top: Room Number & Status */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-serif-luxury text-2xl font-bold text-slate-100">
                        {room.roomNumber}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Floor {room.floor}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-amber-300/90 mt-0.5 truncate max-w-[170px]" title={type?.name}>
                      {type?.name}
                    </p>
                  </div>
                  <div>
                    {getStatusBadge(room.status, room.cleaningStatus)}
                  </div>
                </div>

                {/* Specs */}
                <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1" title="Bed Type">
                    <BedDouble className="w-3.5 h-3.5 text-slate-500" />
                    <span>{room.bedType}</span>
                  </span>
                  {room.hasAC && (
                    <span className="flex items-center gap-1 text-sky-400/90" title="Air Conditioned">
                      <Wind className="w-3.5 h-3.5" />
                      <span>AC</span>
                    </span>
                  )}
                  <span className="ml-auto font-mono text-slate-300 font-medium">
                    {hotelSettings.currencySymbol}{type?.baseRate.toLocaleString()}<span className="text-[10px] text-slate-500">/nt</span>
                  </span>
                </div>

                {/* Occupant Banner if Occupied */}
                {room.status === 'Occupied' && activeGuest && (
                  <div className="mt-3 p-2 rounded bg-slate-950/60 border border-slate-800 text-[11px]">
                    <p className="text-slate-300 font-medium truncate">
                      Guest: <span className="text-white font-semibold">{activeGuest.firstName} {activeGuest.lastName}</span>
                    </p>
                    <p className="text-slate-500 text-[10px]">
                      Until: {activeBooking?.checkOutDate}
                    </p>
                    {activeFolio && (
                      <button
                        onClick={() => onViewFolio(activeFolio.id)}
                        className="mt-1 text-[10px] text-amber-400 hover:underline block"
                      >
                        View Guest Folio →
                      </button>
                    )}
                  </div>
                )}

                {/* Notes if any */}
                {room.notes && (
                  <p className="mt-2 text-[10px] text-slate-500 italic line-clamp-1" title={room.notes}>
                    {room.notes}
                  </p>
                )}
              </div>

              {/* Card Footer: Quick Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                {room.status === 'Available' && (
                  <button
                    onClick={() => onOpenNewBookingWithRoom(room.id)}
                    className="w-full py-1 text-center font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 rounded hover:from-amber-300 hover:to-amber-400 transition-all text-xs shadow-xs"
                  >
                    Reserve Room
                  </button>
                )}

                {room.status === 'Dirty' && (
                  <button
                    onClick={() => updateRoomCleaningStatus(room.id, 'Cleaning in Progress')}
                    className="w-full py-1 text-center font-semibold text-purple-200 bg-purple-900/60 border border-purple-500/30 rounded hover:bg-purple-800/80 text-xs"
                  >
                    Start Cleaning
                  </button>
                )}

                {room.status === 'Cleaning' && (
                  <button
                    onClick={() => updateRoomCleaningStatus(room.id, 'Ready')}
                    className="w-full py-1 text-center font-semibold text-emerald-200 bg-emerald-900/60 border border-emerald-500/30 rounded hover:bg-emerald-800/80 text-xs"
                  >
                    Mark Clean & Ready
                  </button>
                )}

                {['Occupied', 'Reserved', 'Maintenance'].includes(room.status) && (
                  <div className="w-full flex items-center justify-between text-slate-400">
                    <span className="text-[11px] italic">In service</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleOpenEditModal(room)}
                        className="p-1 hover:text-amber-300 text-slate-500"
                        title="Edit Room"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredRooms.length === 0 && (
        <div className="p-12 text-center bg-slate-900/40 rounded-xl border border-slate-800 text-slate-400">
          <KeyRound className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          <p className="text-sm">No rooms match the selected filters or search keyword.</p>
        </div>
      )}

      {/* Add / Edit Room Modal */}
      {(showAddModal || editingRoom) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-xl shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300">
                {editingRoom ? `Edit Room ${editingRoom.roomNumber}` : 'Add New Property Room'}
              </h3>
              <button
                onClick={() => { setShowAddModal(false); setEditingRoom(null); }}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            {actionError && (
              <div className="p-2.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleSaveRoom} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Room Number</label>
                  <input
                    type="text"
                    value={formRoomNum}
                    onChange={(e) => setFormRoomNum(e.target.value)}
                    placeholder="e.g. 105"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Floor Level</label>
                  <input
                    type="number"
                    min="1"
                    max="25"
                    value={formFloor}
                    onChange={(e) => setFormFloor(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Room Category</label>
                <select
                  value={formTypeId}
                  onChange={(e) => setFormTypeId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400"
                >
                  {roomTypes.map(rt => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name} ({hotelSettings.currencySymbol}{rt.baseRate}/nt)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Bed Configuration</label>
                  <select
                    value={formBedType}
                    onChange={(e) => setFormBedType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400"
                  >
                    <option value="King">King Size</option>
                    <option value="Twin">Twin Beds</option>
                    <option value="Queen">Queen Size</option>
                    <option value="Two Kings">Two Master Kings</option>
                  </select>
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={formHasAC}
                      onChange={(e) => setFormHasAC(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-700 text-amber-500"
                    />
                    <span>Air Conditioning</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Notes / Balcony / View</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Sea View, Near Elevator"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-400"
                />
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                {editingRoom && (
                  <button
                    type="button"
                    onClick={() => {
                      handleDelete(editingRoom.id);
                      setEditingRoom(null);
                    }}
                    className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
                <div className="flex gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => { setShowAddModal(false); setEditingRoom(null); }}
                    className="px-3 py-1.5 text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded"
                  >
                    {editingRoom ? 'Update Room' : 'Add Room'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
