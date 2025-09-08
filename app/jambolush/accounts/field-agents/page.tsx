"use client";
import React, { useState, useEffect, useMemo } from 'react';

// --- (StatCard and FieldAgent Interface are the same) ---
const StatCard: React.FC<{ title: string; value: any; icon: string; iconBg: string; iconColor: string; }> = ({ title, value, icon, iconBg, iconColor }) => (
  <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700/50 p-6 rounded-xl shadow-xl">
    <div className="flex items-center justify-between">
      <div><p className="text-white/60 text-sm">{title}</p><p className="text-white text-2xl font-bold">{value}</p></div>
      <div className={`${iconBg} p-3 rounded-xl`}><i className={`bi ${icon} ${iconColor} text-xl`}></i></div>
    </div>
  </div>
);
interface FieldAgent {
  id: string;
  name: string;
  email: string;
  role: 'Field Agent';
  status: 'active' | 'inactive';
  createdAt: Date;
  tasksCompleted: number;
  pendingTasks: number;
}
const mockAgents: FieldAgent[] = [
    { id: 'agt_001', name: 'John Carter', email: 'j.carter@fieldops.co', role: 'Field Agent', status: 'active', createdAt: new Date('2025-07-15T09:00:00Z'), tasksCompleted: 152, pendingTasks: 5, },
    { id: 'agt_002', name: 'Maria Hill', email: 'm.hill@fieldops.co', role: 'Field Agent', status: 'active', createdAt: new Date('2025-05-20T11:30:00Z'), tasksCompleted: 210, pendingTasks: 12, },
    { id: 'agt_003', name: 'Leo Fitz', email: 'l.fitz@fieldops.co', role: 'Field Agent', status: 'inactive', createdAt: new Date('2024-11-01T14:00:00Z'), tasksCompleted: 350, pendingTasks: 0, },
    { id: 'agt_004', name: 'Jemma Simmons', email: 'j.simmons@fieldops.co', role: 'Field Agent', status: 'active', createdAt: new Date('2025-08-02T10:00:00Z'), tasksCompleted: 98, pendingTasks: 2, }
];

// --- NEW MODAL COMPONENTS ---
const TaskModal: React.FC<{ agent: FieldAgent | null; onClose: () => void; }> = ({ agent, onClose }) => {
    if (!agent) return null;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-[#0b1c36] border border-slate-700 rounded-lg shadow-xl w-full max-w-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Tasks for {agent.name}</h2>
            <button onClick={onClose} className="text-white/70 hover:text-white"><i className="bi bi-x-lg"></i></button>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-md">
            <p className="text-white">Tasks Completed: <span className="font-bold">{agent.tasksCompleted}</span></p>
            <p className="text-white">Pending Tasks: <span className="font-bold">{agent.pendingTasks}</span></p>
            <p className="text-white/60 mt-4 text-sm">This is a placeholder where you would list the actual tasks assigned to this agent.</p>
          </div>
        </div>
      </div>
    );
};

const EditAgentModal: React.FC<{ agent: FieldAgent | null; onClose: () => void; onSave: (updatedAgent: FieldAgent) => void; }> = ({ agent, onClose, onSave }) => {
  const [formData, setFormData] = useState<FieldAgent | null>(null);
  useEffect(() => { setFormData(agent); }, [agent]);

  if (!agent || !formData) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#0b1c36] border border-slate-700 rounded-lg shadow-xl w-full max-w-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Edit Agent: {agent.name}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
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

const ConfirmDeleteModal: React.FC<{ agent: FieldAgent | null; onClose: () => void; onConfirm: () => void; }> = ({ agent, onClose, onConfirm }) => {
    if (!agent) return null;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-[#0b1c36] border border-slate-700 rounded-lg shadow-xl w-full max-w-md p-6">
          <h2 className="text-xl font-bold text-white">Confirm Deletion</h2>
          <p className="text-white/70 my-4">Are you sure you want to delete the agent <span className="font-bold text-white">{agent.name}</span>? This action is permanent.</p>
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={onClose} className="bg-slate-600 hover:bg-slate-700 text-white font-semibold px-4 py-2 rounded-md">Cancel</button>
            <button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-md">Delete</button>
          </div>
        </div>
      </div>
    );
};

// --- UPDATED DISPLAY COMPONENTS ---
const AgentGrid: React.FC<{ agents: FieldAgent[]; onViewTasks: (agent: FieldAgent) => void; onEdit: (agent: FieldAgent) => void; }> = ({ agents, onViewTasks, onEdit }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {agents.map(agent => (
        <div key={agent.id} className="bg-[#0b1c36]/80 border border-slate-700/50 p-5 rounded-lg shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-white font-bold text-lg">{agent.name}</h3>
                  <p className="text-white/60 text-sm">{agent.email}</p>
                </div>
                <div className={`flex items-center gap-2 text-xs font-semibold px-2 py-1 rounded-full ${ agent.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400' }`}>
                  <div className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-green-400' : 'bg-slate-400'}`}></div>
                  {agent.status === 'active' ? 'Active' : 'Inactive'}
                </div>
              </div>
              <div className="flex justify-around text-center mt-4 border-y border-slate-700/50 py-3">
                <div><p className="text-white/60 text-xs">Completed</p><p className="text-white font-bold text-lg">{agent.tasksCompleted}</p></div>
                <div><p className="text-white/60 text-xs">Pending</p><p className="text-white font-bold text-lg">{agent.pendingTasks}</p></div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
                <button onClick={() => onViewTasks(agent)} className="text-sm bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 px-3 py-1 rounded-md w-full">View Tasks</button>
                <button onClick={() => onEdit(agent)} className="text-sm bg-slate-500/20 text-slate-400 hover:bg-slate-500/40 px-3 py-1 rounded-md">Edit</button>
            </div>
        </div>
      ))}
    </div>
  );
};

const AgentList: React.FC<{ agents: FieldAgent[]; onViewTasks: (agent: FieldAgent) => void; onEdit: (agent: FieldAgent) => void; onToggleStatus: (agentId: string) => void; onDelete: (agent: FieldAgent) => void; }> = ({ agents, onViewTasks, onEdit, onToggleStatus, onDelete }) => {
  return (
    <div className="bg-[#0b1c36]/80 border border-slate-700/50 rounded-lg shadow-lg overflow-hidden">
      <table className="min-w-full text-left text-sm text-white/80">
        <thead className="bg-slate-800/60">
          <tr>
            <th className="p-4">Agent Name</th>
            <th className="p-4">Status</th>
            <th className="p-4 text-center">Tasks Completed</th>
            <th className="p-4 text-center">Tasks Pending</th>
            <th className="p-4">Member Since</th>
            <th className="p-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {agents.map(agent => (
            <tr key={agent.id} className="border-t border-slate-800 hover:bg-slate-800/40">
                <td className="p-4">
                  <div className="font-medium text-white">{agent.name}</div>
                  <div className="text-white/60">{agent.email}</div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${ agent.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400' }`}>
                    {agent.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-4 text-center font-mono text-white">{agent.tasksCompleted}</td>
                <td className="p-4 text-center font-mono text-white">{agent.pendingTasks}</td>
                <td className="p-4 text-white/70">{agent.createdAt.toLocaleDateString()}</td>
                <td className="p-4 text-center">
                    <div className="flex gap-4 justify-center text-lg">
                        <button onClick={() => onViewTasks(agent)} title="View Tasks"><i className="bi bi-list-check text-blue-400"></i></button>
                        <button onClick={() => onEdit(agent)} title="Edit Agent"><i className="bi bi-pencil-square text-slate-400"></i></button>
                        <button onClick={() => onToggleStatus(agent.id)} title={agent.status === 'active' ? 'Deactivate Agent' : 'Activate Agent'}>
                            {agent.status === 'active' ? <i className="bi bi-pause-circle text-yellow-400"></i> : <i className="bi bi-play-circle text-green-400"></i>}
                        </button>
                        <button onClick={() => onDelete(agent)} title="Delete Agent"><i className="bi bi-trash-fill text-red-400"></i></button>
                    </div>
                </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


const FieldAgentsAdminPage: React.FC = () => {
  const [agents, setAgents] = useState<FieldAgent[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  
  // NEW: State for managing all modals
  const [modalState, setModalState] = useState<{
    tasks: FieldAgent | null;
    edit: FieldAgent | null;
    delete: FieldAgent | null;
  }>({ tasks: null, edit: null, delete: null });

  useEffect(() => { setAgents(mockAgents); }, []);

  // NEW: Handler functions for all actions
  const handleViewTasksClick = (agent: FieldAgent) => setModalState(prev => ({...prev, tasks: agent }));
  const handleEditClick = (agent: FieldAgent) => setModalState(prev => ({...prev, edit: agent }));
  const handleDeleteClick = (agent: FieldAgent) => setModalState(prev => ({...prev, delete: agent }));
  const handleCloseModals = () => setModalState({ tasks: null, edit: null, delete: null });

  const handleUpdateAgent = (updatedAgent: FieldAgent) => {
    setAgents(agents.map(agent => agent.id === updatedAgent.id ? updatedAgent : agent));
    handleCloseModals();
  };

  const handleToggleStatus = (agentId: string) => {
    setAgents(agents.map(agent => 
      agent.id === agentId 
        ? { ...agent, status: agent.status === 'active' ? 'inactive' : 'active' } 
        : agent
    ));
  };

  const handleConfirmDelete = () => {
    if (modalState.delete) {
      setAgents(agents.filter(agent => agent.id !== modalState.delete!.id));
      handleCloseModals();
    }
  };
  
  const stats = useMemo(() => ({
    total: agents.length,
    active: agents.filter(a => a.status === 'active').length,
    tasksCompleted: agents.reduce((sum, a) => sum + a.tasksCompleted, 0),
    pendingTasks: agents.reduce((sum, a) => sum + a.pendingTasks, 0),
  }), [agents]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* ... (Header, Stats, and Toolbar are the same) ... */}
        <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] border border-slate-700/50 p-8 mb-8 rounded-2xl shadow-2xl">
          <h1 className="text-3xl font-bold text-white mb-2">Field Agents Management</h1>
          <p className="text-white/70 text-lg">Manage on-ground agents and track verification tasks.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Agents" value={stats.total} icon="bi-geo-alt" iconBg="bg-blue-400/20" iconColor="text-blue-400" />
          <StatCard title="Active Agents" value={stats.active} icon="bi-person-workspace" iconBg="bg-green-400/20" iconColor="text-green-400" />
          <StatCard title="Tasks Completed" value={stats.tasksCompleted.toLocaleString()} icon="bi-check2-all" iconBg="bg-yellow-400/20" iconColor="text-yellow-400" />
          <StatCard title="Pending Tasks" value={stats.pendingTasks} icon="bi-list-task" iconBg="bg-pink-400/20" iconColor="text-pink-400" />
        </div>
        <div className="bg-[#0b1c36]/80 border border-slate-700/50 p-4 rounded-lg mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-auto">
                <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-white/40"></i>
                <input type="text" placeholder="Search agents..." className="bg-slate-800/60 border border-slate-700 rounded-md pl-10 pr-4 py-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-800/60 border border-slate-700 rounded-md p-1">
                    <button onClick={() => setView('grid')} className={`px-3 py-1 rounded ${view === 'grid' ? 'bg-blue-600' : 'hover:bg-slate-700/50'}`}><i className="bi bi-grid-3x3-gap-fill"></i></button>
                    <button onClick={() => setView('list')} className={`px-3 py-1 rounded ${view === 'list' ? 'bg-blue-600' : 'hover:bg-slate-700/50'}`}><i className="bi bi-list-ul"></i></button>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md flex items-center gap-2">
                    <i className="bi bi-plus-lg"></i>
                    Add Agent
                </button>
            </div>
        </div>

        <div>
            {view === 'grid' 
                ? <AgentGrid agents={agents} onViewTasks={handleViewTasksClick} onEdit={handleEditClick} /> 
                : <AgentList agents={agents} onViewTasks={handleViewTasksClick} onEdit={handleEditClick} onToggleStatus={handleToggleStatus} onDelete={handleDeleteClick}/>
            }
        </div>
        
        {/* NEW: Render modals conditionally */}
        {modalState.tasks && <TaskModal agent={modalState.tasks} onClose={handleCloseModals} />}
        {modalState.edit && <EditAgentModal agent={modalState.edit} onClose={handleCloseModals} onSave={handleUpdateAgent} />}
        {modalState.delete && <ConfirmDeleteModal agent={modalState.delete} onClose={handleCloseModals} onConfirm={handleConfirmDelete} />}
      </div>
    </div>
  );
};

export default FieldAgentsAdminPage;