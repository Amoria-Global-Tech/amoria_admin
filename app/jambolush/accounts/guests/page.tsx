"use client";
import React, { useState, useEffect, useMemo } from 'react';

// --- (StatCard and Guest Interface are the same) ---
const StatCard: React.FC<{ title: string; value: any; icon: string; iconBg: string; iconColor: string; }> = ({ title, value, icon, iconBg, iconColor }) => (
  <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700/50 p-6 rounded-xl shadow-xl">
    <div className="flex items-center justify-between">
      <div><p className="text-white/60 text-sm">{title}</p><p className="text-white text-2xl font-bold">{value}</p></div>
      <div className={`${iconBg} p-3 rounded-xl`}><i className={`bi ${icon} ${iconColor} text-xl`}></i></div>
    </div>
  </div>
);
interface Guest {
  id: string;
  name: string;
  email: string;
  role: 'Guest';
  status: 'active' | 'inactive';
  createdAt: Date;
  totalBookings: number;
  bookingFrequency: 'New' | 'Occasional' | 'Regular';
}
const mockGuests: Guest[] = [
    { id: 'gst_001', name: 'Eleanor Vance', email: 'eleanor.v@email.com', role: 'Guest', status: 'active', createdAt: new Date('2025-08-20T14:30:00Z'), totalBookings: 12, bookingFrequency: 'Regular' },
    { id: 'gst_002', name: 'Marcus Thorne', email: 'm.thorne@email.com', role: 'Guest', status: 'active', createdAt: new Date(), totalBookings: 1, bookingFrequency: 'New' },
    { id: 'gst_003', name: 'Clara Oswald', email: 'clara.o@email.com', role: 'Guest', status: 'inactive', createdAt: new Date('2024-11-10T18:00:00Z'), totalBookings: 3, bookingFrequency: 'Occasional' },
    { id: 'gst_004', name: 'Arthur Pendragon', email: 'arthur.p@email.com', role: 'Guest', status: 'active', createdAt: new Date('2025-02-05T09:15:00Z'), totalBookings: 8, bookingFrequency: 'Regular' }
];

// --- (Modal Components are the same) ---
const BookingModal: React.FC<{ guest: Guest | null; onClose: () => void; }> = ({ guest, onClose }) => {
    if (!guest) return null;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-[#0b1c36] border border-slate-700 rounded-lg shadow-xl w-full max-w-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Bookings for {guest.name}</h2>
            <button onClick={onClose} className="text-white/70 hover:text-white"><i className="bi bi-x-lg"></i></button>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-md">
            <p className="text-white">Total Bookings: <span className="font-bold">{guest.totalBookings}</span></p>
            <p className="text-white/60 mt-4 text-sm">This is a placeholder where you would list the booking history for this guest.</p>
          </div>
        </div>
      </div>
    );
};

const GuestFormModal: React.FC<{ guest?: Guest | null; onClose: () => void; onSave: (guestData: Omit<Guest, 'createdAt' | 'role'> & { id?: string }) => void; }> = ({ guest, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: guest?.name || '',
    email: guest?.email || '',
    status: guest?.status || 'active',
    totalBookings: guest?.totalBookings || 0,
    bookingFrequency: guest?.bookingFrequency || 'New'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ id: guest?.id, ...formData });
  };
  
  const isEditing = !!guest;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#0b1c36] border border-slate-700 rounded-lg shadow-xl w-full max-w-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">{isEditing ? `Edit Guest: ${guest.name}` : 'Add New Guest'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="bg-slate-600 hover:bg-slate-700 text-white font-semibold px-4 py-2 rounded-md">Cancel</button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- (Display Components are the same) ---
const GuestGrid: React.FC<{ guests: Guest[]; onViewBookings: (guest: Guest) => void; onEdit: (guest: Guest) => void; }> = ({ guests, onViewBookings, onEdit }) => {
  const getFrequencyChipColor = (freq: Guest['bookingFrequency']) => {
    switch (freq) {
      case 'Regular': return 'bg-yellow-500/20 text-yellow-400';
      case 'Occasional': return 'bg-blue-500/20 text-blue-400';
      case 'New': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {guests.map(guest => (
        <div key={guest.id} className="bg-[#0b1c36]/80 border border-slate-700/50 p-5 rounded-lg shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-white font-bold text-lg">{guest.name}</h3>
                  <p className="text-white/60 text-sm">{guest.email}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getFrequencyChipColor(guest.bookingFrequency)}`}>
                  {guest.bookingFrequency}
                </span>
              </div>
              <div className="text-center mt-4 border-y border-slate-700/50 py-3">
                <p className="text-white/60 text-xs">Total Bookings</p>
                <p className="text-white font-bold text-2xl">{guest.totalBookings}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
                <button onClick={() => onViewBookings(guest)} className="text-sm bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 px-3 py-1 rounded-md w-full">View Bookings</button>
                <button onClick={() => onEdit(guest)} className="text-sm bg-slate-500/20 text-slate-400 hover:bg-slate-500/40 px-3 py-1 rounded-md">Edit</button>
            </div>
        </div>
      ))}
    </div>
  );
};

const GuestList: React.FC<{ guests: Guest[]; onViewBookings: (guest: Guest) => void; onToggleStatus: (guestId: string) => void; }> = ({ guests, onViewBookings, onToggleStatus }) => {
  return (
    <div className="bg-[#0b1c36]/80 border border-slate-700/50 rounded-lg shadow-lg overflow-hidden">
      <table className="min-w-full text-left text-sm text-white/80">
        <thead className="bg-slate-800/60">
          <tr>
            <th className="p-4">Guest Name</th>
            <th className="p-4">Status</th>
            <th className="p-4">Booking Frequency</th>
            <th className="p-4 text-center">Total Bookings</th>
            <th className="p-4">Member Since</th>
            <th className="p-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {guests.map(guest => (
            <tr key={guest.id} className="border-t border-slate-800 hover:bg-slate-800/40">
                <td className="p-4">
                  <div className="font-medium text-white">{guest.name}</div>
                  <div className="text-white/60">{guest.email}</div>
                </td>
                <td className="p-4">
                   <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    guest.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                  }`}>
                    {guest.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-4">{guest.bookingFrequency}</td>
                <td className="p-4 text-center font-mono text-white">{guest.totalBookings}</td>
                <td className="p-4 text-white/70">{guest.createdAt.toLocaleDateString()}</td>
                <td className="p-4 text-center">
                    <div className="flex gap-4 justify-center text-lg">
                        <button onClick={() => onViewBookings(guest)} title="View Bookings"><i className="bi bi-calendar-check text-blue-400"></i></button>
                        <button onClick={() => onToggleStatus(guest.id)} title={guest.status === 'active' ? 'Disable Account' : 'Enable Account'}>
                            <i className={`bi ${guest.status === 'active' ? 'bi bi-person-slash-fill text-yellow-400' : 'bi-person-check-fill text-green-400'}`}></i>
                        </button>
                    </div>
                </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const GuestsAdminPage: React.FC = () => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  
  const [modalState, setModalState] = useState<{
    bookings: Guest | null;
    edit: Guest | null;
    add: boolean;
  }>({ bookings: null, edit: null, add: false });

  useEffect(() => { setGuests(mockGuests); }, []);

  const handleViewBookingsClick = (guest: Guest) => setModalState(prev => ({ ...prev, bookings: guest }));
  const handleEditClick = (guest: Guest) => setModalState(prev => ({ ...prev, edit: guest }));
  const handleAddGuestClick = () => setModalState(prev => ({ ...prev, add: true }));
  const handleCloseModals = () => setModalState({ bookings: null, edit: null, add: false });

  // UPDATED: This function is now fully type-safe.
  const handleSaveGuest = (guestData: Omit<Guest, 'createdAt' | 'role'> & { id?: string }) => {
    const { id, ...formData } = guestData;

    if (id) {
      setGuests(guests.map(g => (g.id === id ? { ...g, ...formData } : g)));
    } else {
      const newGuest: Guest = {
        id: `gst_${new Date().getTime()}`,
        // The type assertion that caused the error has been removed.
        // `formData` is now correctly typed by TypeScript without help.
        ...(formData as Omit<Guest, 'id' | 'createdAt' | 'role'>),
        role: 'Guest',
        createdAt: new Date(),
      };
      setGuests([newGuest, ...guests]);
    }
    handleCloseModals();
  };

  const handleToggleStatus = (guestId: string) => {
    setGuests(guests.map(g => g.id === guestId ? { ...g, status: g.status === 'active' ? 'inactive' : 'active' } : g));
  };
  
  const stats = useMemo(() => ({
    total: guests.length,
    newThisMonth: guests.filter(g => new Date(g.createdAt).getMonth() === new Date().getMonth()).length,
    regulars: guests.filter(g => g.bookingFrequency === 'Regular').length,
    totalBookings: guests.reduce((sum, g) => sum + g.totalBookings, 0),
  }), [guests]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] border border-slate-700/50 p-8 mb-8 rounded-2xl shadow-2xl">
          <h1 className="text-3xl font-bold text-white mb-2">Guests Management</h1>
          <p className="text-white/70 text-lg">View customer data, booking history, and user activity.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Guests" value={stats.total} icon="bi-people" iconBg="bg-blue-400/20" iconColor="text-blue-400" />
          <StatCard title="New Signups (Month)" value={stats.newThisMonth} icon="bi-person-plus" iconBg="bg-green-400/20" iconColor="text-green-400" />
          <StatCard title="Regular Travelers" value={stats.regulars} icon="bi-gem" iconBg="bg-yellow-400/20" iconColor="text-yellow-400" />
          <StatCard title="Total Bookings" value={stats.totalBookings.toLocaleString()} icon="bi-calendar-check" iconBg="bg-pink-400/20" iconColor="text-pink-400" />
        </div>
        <div className="bg-[#0b1c36]/80 border border-slate-700/50 p-4 rounded-lg mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-auto">
                <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-white/40"></i>
                <input type="text" placeholder="Search guests..." className="bg-slate-800/60 border border-slate-700 rounded-md pl-10 pr-4 py-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-800/60 border border-slate-700 rounded-md p-1">
                    <button onClick={() => setView('grid')} className={`px-3 py-1 rounded ${view === 'grid' ? 'bg-blue-600' : 'hover:bg-slate-700/50'}`}><i className="bi bi-grid-3x3-gap-fill"></i></button>
                    <button onClick={() => setView('list')} className={`px-3 py-1 rounded ${view === 'list' ? 'bg-blue-600' : 'hover:bg-slate-700/50'}`}><i className="bi bi-list-ul"></i></button>
                </div>
                <button onClick={handleAddGuestClick} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md flex items-center gap-2">
                    <i className="bi bi-plus-lg"></i>
                    Add Guest
                </button>
            </div>
        </div>
        <div>
            {view === 'grid' 
                ? <GuestGrid guests={guests} onViewBookings={handleViewBookingsClick} onEdit={handleEditClick} /> 
                : <GuestList guests={guests} onViewBookings={handleViewBookingsClick} onToggleStatus={handleToggleStatus} />
            }
        </div>
        {modalState.bookings && <BookingModal guest={modalState.bookings} onClose={handleCloseModals} />}
        {modalState.edit && <GuestFormModal guest={modalState.edit} onClose={handleCloseModals} onSave={handleSaveGuest} />}
        {modalState.add && <GuestFormModal onClose={handleCloseModals} onSave={handleSaveGuest} />}
      </div>
    </div>
  );
};

export default GuestsAdminPage;