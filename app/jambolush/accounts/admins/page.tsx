"use client";
import React, { useState, useEffect, useMemo } from 'react';

// --- (StatCard and Admin Interface are the same) ---
const StatCard: React.FC<{ title: string; value: any; icon: string; iconBg: string; iconColor: string; }> = ({ title, value, icon, iconBg, iconColor }) => (
  <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700/50 p-6 rounded-xl shadow-xl">
    <div className="flex items-center justify-between">
      <div><p className="text-white/60 text-sm">{title}</p><p className="text-white text-2xl font-bold">{value}</p></div>
      <div className={`${iconBg} p-3 rounded-xl`}><i className={`bi ${icon} ${iconColor} text-xl`}></i></div>
    </div>
  </div>
);
interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'Admin';
  permissionLevel: 'Super-Admin' | 'Content-Manager' | 'Support';
  lastLogin: Date;
}
const mockAdmins: Admin[] = [
    { id: 'adm_001', name: 'Alice Johnson', email: 'alice.j@system.co', role: 'Admin', permissionLevel: 'Super-Admin', lastLogin: new Date('2025-09-07T10:00:00Z'), },
    { id: 'adm_002', name: 'Bob Williams', email: 'bob.w@system.co', role: 'Admin', permissionLevel: 'Content-Manager', lastLogin: new Date('2025-09-06T15:30:00Z'), },
    { id: 'adm_003', name: 'Charlie Brown', email: 'charlie.b@system.co', role: 'Admin', permissionLevel: 'Support', lastLogin: new Date(), },
    { id: 'adm_004', name: 'Diana Prince', email: 'diana.p@system.co', role: 'Admin', permissionLevel: 'Content-Manager', lastLogin: new Date('2025-08-25T11:45:00Z'), }
];

// --- NEW MODAL COMPONENTS ---

// NEW: Modal for Editing an Admin
const EditModal: React.FC<{ admin: Admin | null; onClose: () => void; onSave: (updatedAdmin: Admin) => void; }> = ({ admin, onClose, onSave }) => {
  const [formData, setFormData] = useState<Admin | null>(null);

  useEffect(() => {
    setFormData(admin);
  }, [admin]);

  if (!admin || !formData) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#0b1c36] border border-slate-700 rounded-lg shadow-xl w-full max-w-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Edit Admin: {admin.name}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Permission Level</label>
            <select name="permissionLevel" value={formData.permissionLevel} onChange={handleInputChange} className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Super-Admin</option>
              <option>Content-Manager</option>
              <option>Support</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="bg-slate-600 hover:bg-slate-700 text-white font-semibold px-4 py-2 rounded-md">Cancel</button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// NEW: Modal for viewing Logs (placeholder)
const LogModal: React.FC<{ admin: Admin | null; onClose: () => void; }> = ({ admin, onClose }) => {
    if (!admin) return null;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-[#0b1c36] border border-slate-700 rounded-lg shadow-xl w-full max-w-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Activity Log: {admin.name}</h2>
            <button onClick={onClose} className="text-white/70 hover:text-white"><i className="bi bi-x-lg"></i></button>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-md h-64 overflow-y-auto">
            <p className="text-white/70 text-sm font-mono">[2025-09-08 08:15] User logged in.</p>
            <p className="text-white/70 text-sm font-mono">[2025-09-07 14:20] Updated user profile 'Bob W'.</p>
            <p className="text-white/60 mt-4">This is a placeholder for a real activity log feed.</p>
          </div>
        </div>
      </div>
    );
};

// NEW: Modal for confirming deletion
const ConfirmDeleteModal: React.FC<{ admin: Admin | null; onClose: () => void; onConfirm: () => void; }> = ({ admin, onClose, onConfirm }) => {
    if (!admin) return null;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-[#0b1c36] border border-slate-700 rounded-lg shadow-xl w-full max-w-md p-6">
          <h2 className="text-xl font-bold text-white">Confirm Deletion</h2>
          <p className="text-white/70 my-4">Are you sure you want to delete the admin account for <span className="font-bold text-white">{admin.name}</span>? This action cannot be undone.</p>
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={onClose} className="bg-slate-600 hover:bg-slate-700 text-white font-semibold px-4 py-2 rounded-md">Cancel</button>
            <button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-md">Delete Admin</button>
          </div>
        </div>
      </div>
    );
};

// --- UPDATED DISPLAY COMPONENTS ---

// UPDATED: Added onEdit, onLog, and onDelete props
const AdminGrid: React.FC<{ admins: Admin[]; onEdit: (admin: Admin) => void; onLog: (admin: Admin) => void; onDelete: (admin: Admin) => void; }> = ({ admins, onEdit, onLog, onDelete }) => {
  const getPermissionChipColor = (level: Admin['permissionLevel']) => { /* ... (same function) ... */ 
    switch (level) {
        case 'Super-Admin': return 'bg-red-500/20 text-red-400';
        case 'Content-Manager': return 'bg-yellow-500/20 text-yellow-400';
        case 'Support': return 'bg-green-500/20 text-green-400';
        default: return 'bg-gray-500/20 text-gray-400';
      }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {admins.map(admin => (
        <div key={admin.id} className="bg-[#0b1c36]/80 border border-slate-700/50 p-5 rounded-lg shadow-lg flex flex-col justify-between">
            {/* ... (card content is the same) ... */}
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-white font-bold text-lg">{admin.name}</h3>
                  <p className="text-white/60 text-sm">{admin.email}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getPermissionChipColor(admin.permissionLevel)}`}>
                  {admin.permissionLevel.replace('-', ' ')}
                </span>
              </div>
              <p className="text-white/50 text-xs">Last Login: {admin.lastLogin.toLocaleDateString()}</p>
            </div>
            {/* UPDATED: Added onClick handlers */}
            <div className="flex gap-2 mt-4 border-t border-slate-700 pt-4">
                <button onClick={() => onEdit(admin)} className="text-sm bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 px-3 py-1 rounded-md w-full">Edit</button>
                <button onClick={() => onLog(admin)} className="text-sm bg-slate-500/20 text-slate-400 hover:bg-slate-500/40 px-3 py-1 rounded-md">Log</button>
                <button onClick={() => onDelete(admin)} className="text-sm bg-red-500/20 text-red-400 hover:bg-red-500/40 px-3 py-1 rounded-md">Delete</button>
            </div>
        </div>
      ))}
    </div>
  );
};

// UPDATED: Added onEdit, onLog, and onDelete props
const AdminList: React.FC<{ admins: Admin[]; onEdit: (admin: Admin) => void; onLog: (admin: Admin) => void; onDelete: (admin: Admin) => void; }> = ({ admins, onEdit, onLog, onDelete }) => {
  return (
    <div className="bg-[#0b1c36]/80 border border-slate-700/50 rounded-lg shadow-lg overflow-hidden">
      <table className="min-w-full text-left text-sm text-white/80">
        {/* ... (thead is the same) ... */}
        <thead className="bg-slate-800/60">
          <tr>
            <th className="p-4">Name</th>
            <th className="p-4">Permission Level</th>
            <th className="p-4">Last Login</th>
            <th className="p-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {admins.map(admin => (
            <tr key={admin.id} className="border-t border-slate-800 hover:bg-slate-800/40">
                {/* ... (other tds are the same) ... */}
                <td className="p-4">
                  <div className="font-medium text-white">{admin.name}</div>
                  <div className="text-white/60">{admin.email}</div>
                </td>
                <td className="p-4">{admin.permissionLevel}</td>
                <td className="p-4 text-white/70">{admin.lastLogin.toLocaleString()}</td>
                {/* UPDATED: Added onClick handlers */}
                <td className="p-4 text-center">
                    <div className="flex gap-4 justify-center text-lg">
                        <button onClick={() => onEdit(admin)} title="Edit User"><i className="bi bi-pencil-square text-blue-400"></i></button>
                        <button onClick={() => onLog(admin)} title="View Log"><i className="bi bi-clock-history text-green-400"></i></button>
                        <button onClick={() => onDelete(admin)} title="Delete User"><i className="bi bi-trash-fill text-red-400"></i></button>
                    </div>
                </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AdminsAdminPage: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid'); 
  
  // NEW: State for managing all modals
  const [modalState, setModalState] = useState<{
    edit: Admin | null;
    log: Admin | null;
    delete: Admin | null;
  }>({ edit: null, log: null, delete: null });

  useEffect(() => { setAdmins(mockAdmins); }, []);

  // NEW: Handler functions for all actions
  const handleEditClick = (admin: Admin) => setModalState({ ...modalState, edit: admin });
  const handleLogClick = (admin: Admin) => setModalState({ ...modalState, log: admin });
  const handleDeleteClick = (admin: Admin) => setModalState({ ...modalState, delete: admin });

  const handleCloseModals = () => setModalState({ edit: null, log: null, delete: null });

  const handleUpdateAdmin = (updatedAdmin: Admin) => {
    setAdmins(admins.map(admin => admin.id === updatedAdmin.id ? updatedAdmin : admin));
    handleCloseModals();
  };

  const handleConfirmDelete = () => {
    if (modalState.delete) {
      setAdmins(admins.filter(admin => admin.id !== modalState.delete!.id));
      handleCloseModals();
    }
  };

  const stats = useMemo(() => ({
    total: admins.length,
    superAdmins: admins.filter(a => a.permissionLevel === 'Super-Admin').length,
    activeToday: admins.filter(a => a.lastLogin.toDateString() === new Date().toDateString()).length,
  }), [admins]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* ... (Header, Stats, and Toolbar are the same) ... */}
        <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] border border-slate-700/50 p-8 mb-8 rounded-2xl shadow-2xl">
          <h1 className="text-3xl font-bold text-white mb-2">Administrators Management</h1>
          <p className="text-white/70 text-lg">Manage admin accounts and system permissions.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Admins" value={stats.total} icon="bi-person-badge" iconBg="bg-blue-400/20" iconColor="text-blue-400" />
          <StatCard title="Super Admins" value={stats.superAdmins} icon="bi-key-fill" iconBg="bg-red-400/20" iconColor="text-red-400" />
          <StatCard title="Active Today" value={stats.activeToday} icon="bi-clock-history" iconBg="bg-green-400/20" iconColor="text-green-400" />
          <StatCard title="Pending Invites" value="0" icon="bi-envelope-paper" iconBg="bg-yellow-400/20" iconColor="text-yellow-400" />
        </div>
        <div className="bg-[#0b1c36]/80 border border-slate-700/50 p-4 rounded-lg mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-auto">
                <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-white/40"></i>
                <input type="text" placeholder="Search admins..." className="bg-slate-800/60 border border-slate-700 rounded-md pl-10 pr-4 py-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-800/60 border border-slate-700 rounded-md p-1">
                    <button onClick={() => setView('grid')} className={`px-3 py-1 rounded ${view === 'grid' ? 'bg-blue-600' : 'hover:bg-slate-700/50'}`}><i className="bi bi-grid-3x3-gap-fill"></i></button>
                    <button onClick={() => setView('list')} className={`px-3 py-1 rounded ${view === 'list' ? 'bg-blue-600' : 'hover:bg-slate-700/50'}`}><i className="bi bi-list-ul"></i></button>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md flex items-center gap-2">
                    <i className="bi bi-plus-lg"></i>
                    Add Admin
                </button>
            </div>
        </div>
        
        <div>
            {/* UPDATED: Pass new handlers to components */}
            {view === 'grid' 
                ? <AdminGrid admins={admins} onEdit={handleEditClick} onLog={handleLogClick} onDelete={handleDeleteClick} /> 
                : <AdminList admins={admins} onEdit={handleEditClick} onLog={handleLogClick} onDelete={handleDeleteClick} />
            }
        </div>
        
        {/* NEW: Render modals conditionally */}
        {modalState.edit && <EditModal admin={modalState.edit} onClose={handleCloseModals} onSave={handleUpdateAdmin} />}
        {modalState.log && <LogModal admin={modalState.log} onClose={handleCloseModals} />}
        {modalState.delete && <ConfirmDeleteModal admin={modalState.delete} onClose={handleCloseModals} onConfirm={handleConfirmDelete} />}
      </div>
    </div>
  );
};

export default AdminsAdminPage;