"use client";
import React, { useState, useEffect, useMemo } from 'react';

// --- (StatCard component is the same) ---
const StatCard: React.FC<{ title: string; value: any; icon: string; iconBg: string; iconColor: string; }> = ({ title, value, icon, iconBg, iconColor }) => (
  <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700/50 p-6 rounded-xl shadow-xl">
    <div className="flex items-center justify-between">
      <div><p className="text-white/60 text-sm">{title}</p><p className="text-white text-2xl font-bold">{value}</p></div>
      <div className={`${iconBg} p-3 rounded-xl`}><i className={`bi ${icon} ${iconColor} text-xl`}></i></div>
    </div>
  </div>
);

// --- (Interfaces and Mock Data are the same) ---
interface TourGuide {
  id: string;
  name:string;
  email: string;
  role: 'Tour Guide';
  status: 'active' | 'pending' | 'suspended';
  createdAt: Date;
  rating: number;
  toursCompleted: number;
  experience: number; // years
}

const mockGuides: TourGuide[] = [
  {
    id: 'tg_001', name: 'Ken Adams', email: 'ken.a@guides.co', role: 'Tour Guide', status: 'active', createdAt: new Date('2024-03-10T09:00:00Z'), rating: 4.9, toursCompleted: 85, experience: 5,
  },
  {
    id: 'tg_002', name: 'Isabella Rossi', email: 'isabella.r@guides.co', role: 'Tour Guide', status: 'pending', createdAt: new Date('2025-08-15T11:00:00Z'), rating: 0, toursCompleted: 0, experience: 2,
  },
  {
    id: 'tg_003', name: 'David Chen', email: 'david.c@guides.co', role: 'Tour Guide', status: 'active', createdAt: new Date('2023-11-20T14:30:00Z'), rating: 4.7, toursCompleted: 120, experience: 7,
  },
  {
    id: 'tg_004', name: 'Sophia Dubois', email: 'sophia.d@guides.co', role: 'Tour Guide', status: 'suspended', createdAt: new Date('2024-01-05T18:00:00Z'), rating: 3.2, toursCompleted: 42, experience: 3,
  }
];

// --- NEW MODAL COMPONENT ---
const ProfileModal: React.FC<{ guide: TourGuide | null; onClose: () => void; }> = ({ guide, onClose }) => {
    if (!guide) return null;
  
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-[#0b1c36] border border-slate-700 rounded-lg shadow-xl w-full max-w-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Profile: {guide.name}</h2>
            <button onClick={onClose} className="text-white/70 hover:text-white"><i className="bi bi-x-lg"></i></button>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-md space-y-2">
            <p className="text-white">Email: <span className="font-mono text-white/80">{guide.email}</span></p>
            <p className="text-white">Status: <span className="font-semibold text-white/80">{guide.status.charAt(0).toUpperCase() + guide.status.slice(1)}</span></p>
            <p className="text-white">Rating: <span className="font-semibold text-yellow-400">{guide.rating.toFixed(1)} ★</span></p>
            <p className="text-white">Tours Completed: <span className="font-semibold text-white/80">{guide.toursCompleted}</span></p>
            <p className="text-white">Experience: <span className="font-semibold text-white/80">{guide.experience} years</span></p>
            <p className="text-white">Member Since: <span className="font-semibold text-white/80">{guide.createdAt.toLocaleDateString()}</span></p>
          </div>
        </div>
      </div>
    );
  };
  

// --- UPDATED DISPLAY COMPONENTS ---

// UPDATED: Added onViewProfile and onApprove props
const GuideGrid: React.FC<{ guides: TourGuide[]; onViewProfile: (guide: TourGuide) => void; onApprove: (guideId: string) => void; }> = ({ guides, onViewProfile, onApprove }) => {
  const getStatusChipColor = (status: TourGuide['status']) => { /* ... (same function) ... */ 
    switch (status) {
        case 'active': return 'bg-green-500/20 text-green-400';
        case 'pending': return 'bg-yellow-500/20 text-yellow-400';
        case 'suspended': return 'bg-red-500/20 text-red-400';
        default: return 'bg-gray-500/20 text-gray-400';
      }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {guides.map(guide => (
        <div key={guide.id} className="bg-[#0b1c36]/80 border border-slate-700/50 p-5 rounded-lg shadow-lg flex flex-col justify-between">
          <div>
            {/* ... (card content is the same) ... */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-white font-bold text-lg">{guide.name}</h3>
                <p className="text-white/60 text-sm">{guide.email}</p>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusChipColor(guide.status)}`}>
                {guide.status.charAt(0).toUpperCase() + guide.status.slice(1)}
              </span>
            </div>
            <div className="flex justify-around text-center mt-4 border-y border-slate-700/50 py-3">
              <div><p className="text-white/60 text-xs">Rating</p><p className="text-white font-bold text-lg">{guide.rating.toFixed(1)} ★</p></div>
              <div><p className="text-white/60 text-xs">Tours Done</p><p className="text-white font-bold text-lg">{guide.toursCompleted}</p></div>
              <div><p className="text-white/60 text-xs">Experience</p><p className="text-white font-bold text-lg">{guide.experience} yrs</p></div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            {/* UPDATED: Added onClick handlers */}
            <button onClick={() => onViewProfile(guide)} className="text-sm bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 px-3 py-1 rounded-md w-full">View Profile</button>
            {guide.status === 'pending' && (
              <button onClick={() => onApprove(guide.id)} className="text-sm bg-green-500/20 text-green-400 hover:bg-green-500/40 px-3 py-1 rounded-md">Approve</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// UPDATED: Added onViewProfile and onApprove props
const GuideList: React.FC<{ guides: TourGuide[]; onViewProfile: (guide: TourGuide) => void; onApprove: (guideId: string) => void; }> = ({ guides, onViewProfile, onApprove }) => {
  return (
    <div className="bg-[#0b1c36]/80 border border-slate-700/50 rounded-lg shadow-lg overflow-hidden">
      <table className="min-w-full text-left text-sm text-white/80">
        {/* ... (thead is the same) ... */}
        <thead className="bg-slate-800/60">
          <tr>
            <th className="p-4">Guide Name</th>
            <th className="p-4">Status</th>
            <th className="p-4 text-center">Rating</th>
            <th className="p-4 text-center">Tours Completed</th>
            <th className="p-4">Member Since</th>
            <th className="p-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {guides.map(guide => (
            <tr key={guide.id} className="border-t border-slate-800 hover:bg-slate-800/40">
              {/* ... (other tds are the same) ... */}
              <td className="p-4">
                <div className="font-medium text-white">{guide.name}</div>
                <div className="text-white/60">{guide.email}</div>
              </td>
              <td className="p-4">
                 <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  guide.status === 'active' ? 'bg-green-500/20 text-green-400' : 
                  guide.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {guide.status.charAt(0).toUpperCase() + guide.status.slice(1)}
                </span>
              </td>
              <td className="p-4 text-center font-mono text-white">{guide.rating.toFixed(1)} ★</td>
              <td className="p-4 text-center font-mono text-white/70">{guide.toursCompleted}</td>
              <td className="p-4 text-white/70">{guide.createdAt.toLocaleDateString()}</td>
              <td className="p-4 text-center">
                 <div className="flex gap-4 justify-center text-lg">
                    {/* UPDATED: Added onClick handlers */}
                    <button onClick={() => onViewProfile(guide)} title="View Profile"><i className="bi bi-person-lines-fill text-blue-400"></i></button>
                    {guide.status === 'pending' && (
                      <button onClick={() => onApprove(guide.id)} title="Approve Guide"><i className="bi bi-check-circle-fill text-green-400"></i></button>
                    )}
                    {guide.status === 'active' && (
                      <button title="Suspend Guide"><i className="bi bi-slash-circle text-red-400"></i></button>
                    )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


const TourGuidesAdminPage: React.FC = () => {
  const [guides, setGuides] = useState<TourGuide[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  // NEW: State for the modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<TourGuide | null>(null);

  useEffect(() => {
    setGuides(mockGuides);
  }, []);

  // NEW: Handler to open the profile modal
  const handleViewProfile = (guide: TourGuide) => {
    setSelectedGuide(guide);
    setIsModalOpen(true);
  };

  // NEW: Handler to close the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGuide(null);
  };

  // NEW: Handler to approve a pending guide
  const handleApproveGuide = (guideId: string) => {
    const updatedGuides = guides.map(guide => {
      if (guide.id === guideId) {
        return { ...guide, status: 'active' as const };
      }
      return guide;
    });
    setGuides(updatedGuides);
  };

  const stats = useMemo(() => ({
    total: guides.length,
    active: guides.filter(g => g.status === 'active').length,
    pending: guides.filter(g => g.status === 'pending').length,
    avgRating: guides.length > 0 ? (guides.reduce((sum, g) => sum + g.rating, 0) / guides.filter(g => g.rating > 0).length).toFixed(1) : 0,
  }), [guides]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* ... (Header, StatCards, and Toolbar are the same) ... */}
        <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] border border-slate-700/50 p-8 mb-8 rounded-2xl shadow-2xl">
          <h1 className="text-3xl font-bold text-white mb-2">Tour Guides Management</h1>
          <p className="text-white/70 text-lg">Oversee guide profiles, verification, and performance.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Guides" value={stats.total} icon="bi-person-check" iconBg="bg-blue-400/20" iconColor="text-blue-400" />
          <StatCard title="Active Guides" value={stats.active} icon="bi-shield-check" iconBg="bg-green-400/20" iconColor="text-green-400" />
          <StatCard title="Pending Approval" value={stats.pending} icon="bi-clock-history" iconBg="bg-yellow-400/20" iconColor="text-yellow-400" />
          <StatCard title="Average Rating" value={`${stats.avgRating} ★`} icon="bi-star-fill" iconBg="bg-pink-400/20" iconColor="text-pink-400" />
        </div>
        <div className="bg-[#0b1c36]/80 border border-slate-700/50 p-4 rounded-lg mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-auto">
                <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-white/40"></i>
                <input type="text" placeholder="Search guides..." className="bg-slate-800/60 border border-slate-700 rounded-md pl-10 pr-4 py-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-800/60 border border-slate-700 rounded-md p-1">
                    <button onClick={() => setView('grid')} className={`px-3 py-1 rounded ${view === 'grid' ? 'bg-blue-600' : 'hover:bg-slate-700/50'}`}><i className="bi bi-grid-3x3-gap-fill"></i></button>
                    <button onClick={() => setView('list')} className={`px-3 py-1 rounded ${view === 'list' ? 'bg-blue-600' : 'hover:bg-slate-700/50'}`}><i className="bi bi-list-ul"></i></button>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md flex items-center gap-2">
                    <i className="bi bi-plus-lg"></i>
                    Add Guide
                </button>
            </div>
        </div>
        <div>
          {/* UPDATED: Pass the new handler functions down as props */}
          {view === 'grid' 
            ? <GuideGrid guides={guides} onViewProfile={handleViewProfile} onApprove={handleApproveGuide} /> 
            : <GuideList guides={guides} onViewProfile={handleViewProfile} onApprove={handleApproveGuide} />
          }
        </div>
        
        {/* NEW: Render the modal conditionally */}
        {isModalOpen && <ProfileModal guide={selectedGuide} onClose={handleCloseModal} />}
      </div>
    </div>
  );
};
export default TourGuidesAdminPage;