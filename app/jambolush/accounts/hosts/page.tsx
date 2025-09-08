"use client";
import React,  { useState, useEffect, useMemo } from 'react';

// --- (StatCard component remains the same) ---
const StatCard: React.FC<{ title: string; value: any; icon: string; iconBg: string; iconColor: string; }> = ({ title, value, icon, iconBg, iconColor }) => (
  <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700/50 p-6 rounded-xl shadow-xl">
    <div className="flex items-center justify-between">
      <div><p className="text-white/60 text-sm">{title}</p><p className="text-white text-2xl font-bold">{value}</p></div>
      <div className={`${iconBg} p-3 rounded-xl`}><i className={`bi ${icon} ${iconColor} text-xl`}></i></div>
    </div>
  </div>
);

// --- (Interfaces remain the same) ---
interface Host {
  id: string;
  name: string;
  email: string;
  role: 'Host';
  verification: 'verified' | 'unverified';
  activeListings: number;
  totalListings: number;
}

// FIX: Cleaned up the mock data to remove duplicates.
const mockHosts: Host[] = [
  {
    id: 'hst_001', name: 'Samuel Green', email: 'sam.g@hosting.co', role: 'Host', verification: 'verified', activeListings: 5, totalListings: 5,
  },
  {
    id: 'hst_002', name: 'Olivia Blue', email: 'olivia.b@hosting.co', role: 'Host', verification: 'unverified', activeListings: 2, totalListings: 3,
  },
  {
    id: 'hst_003', name: 'Peter Slate', email: 'p.slate@hosting.co', role: 'Host', verification: 'verified', activeListings: 10, totalListings: 12,
  },
  {
    id: 'hst_004', name: 'Hannah White', email: 'h.white@hosting.co', role: 'Host', verification: 'verified', activeListings: 1, totalListings: 1,
  }
];

// --- (ListingsModal is the same) ---
const ListingsModal: React.FC<{ host: Host | null; onClose: () => void; }> = ({ host, onClose }) => {
  if (!host) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#0b1c36] border border-slate-700 rounded-lg shadow-xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Listings for {host.name}</h2>
            <button onClick={onClose} className="text-white/70 hover:text-white"><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="bg-slate-800/50 p-4 rounded-md">
            <p className="text-white">Total Listings: <span className="font-bold">{host.totalListings}</span></p>
            <p className="text-white">Active Listings: <span className="font-bold">{host.activeListings}</span></p>
            <p className="text-white/60 mt-4 text-sm">This is where you would map over an array of actual listings and display them.</p>
        </div>
      </div>
    </div>
  );
};

// --- (Display components are the same, just with updated props) ---
const HostGrid: React.FC<{ hosts: Host[]; onViewListings: (host: Host) => void; onVerify: (hostId: string) => void; }> = ({ hosts, onViewListings, onVerify }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {hosts.map(host => (
        <div key={host.id} className="bg-[#0b1c36]/80 border border-slate-700/50 p-5 rounded-lg shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-white font-bold text-lg">{host.name}</h3>
                  <p className="text-white/60 text-sm">{host.email}</p>
                </div>
                <div className={`flex items-center gap-2 text-xs font-semibold px-2 py-1 rounded-full ${ host.verification === 'verified' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400' }`}>
                  <i className={`bi ${host.verification === 'verified' ? 'bi-patch-check-fill' : 'bi-patch-exclamation-fill'}`}></i>
                  {host.verification === 'verified' ? 'Verified' : 'Unverified'}
                </div>
              </div>
              <div className="flex justify-around text-center mt-4 border-y border-slate-700/50 py-3">
                <div><p className="text-white/60 text-xs">Active Listings</p><p className="text-white font-bold text-lg">{host.activeListings}</p></div>
                <div><p className="text-white/60 text-xs">Total Listings</p><p className="text-white font-bold text-lg">{host.totalListings}</p></div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
                <button onClick={() => onViewListings(host)} className="text-sm bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 px-3 py-1 rounded-md w-full">View Listings</button>
                {host.verification === 'unverified' && (
                <button onClick={() => onVerify(host.id)} className="text-sm bg-green-500/20 text-green-400 hover:bg-green-500/40 px-3 py-1 rounded-md">Verify</button>
                )}
            </div>
        </div>
      ))}
    </div>
  );
};

const HostList: React.FC<{ hosts: Host[]; onViewListings: (host: Host) => void; onVerify: (hostId: string) => void; }> = ({ hosts, onViewListings, onVerify }) => {
  return (
    <div className="bg-[#0b1c36]/80 border border-slate-700/50 rounded-lg shadow-lg overflow-hidden">
      <table className="min-w-full text-left text-sm text-white/80">
        <thead className="bg-slate-800/60">
          <tr>
            <th className="p-4">Host Name</th>
            <th className="p-4">Verification Status</th>
            <th className="p-4 text-center">Active Listings</th>
            <th className="p-4 text-center">Total Listings</th>
            <th className="p-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {hosts.map(host => (
            <tr key={host.id} className="border-t border-slate-800 hover:bg-slate-800/40">
              <td className="p-4">
                <div className="font-medium text-white">{host.name}</div>
                <div className="text-white/60">{host.email}</div>
              </td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${ host.verification === 'verified' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400' }`}>
                  {host.verification === 'verified' ? 'Verified' : 'Unverified'}
                </span>
              </td>
              <td className="p-4 text-center font-mono text-white">{host.activeListings}</td>
              <td className="p-4 text-center font-mono text-white/70">{host.totalListings}</td>
              <td className="p-4 text-center">
                 <div className="flex gap-4 justify-center text-lg">
                    <button onClick={() => onViewListings(host)} title="View Listings"><i className="bi bi-list-check text-blue-400"></i></button>
                    {host.verification === 'unverified' && (
                      <button onClick={() => onVerify(host.id)} title="Verify Host"><i className="bi bi-check-circle-fill text-green-400"></i></button>
                    )}
                    <button title="Disable Host"><i className="bi bi-person-slash-fill text-red-400"></i></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


const HostsAdminPage: React.FC = () => {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHost, setSelectedHost] = useState<Host | null>(null);

  // FIX: Simplified useEffect to directly set the clean mock data.
  useEffect(() => {
    setHosts(mockHosts);
  }, []);

  const handleViewListings = (host: Host) => {
    setSelectedHost(host);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedHost(null);
  };
  
  const handleVerifyHost = (hostId: string) => {
    const updatedHosts = hosts.map(host => {
      if (host.id === hostId) {
        return { ...host, verification: 'verified' };
      }
      return host;
    });
    setHosts(updatedHosts);
  };

  const stats = useMemo(() => ({
    total: hosts.length,
    verified: hosts.filter(h => h.verification === 'verified').length,
    unverified: hosts.filter(h => h.verification === 'unverified').length,
    activeListings: hosts.reduce((sum, h) => sum + h.activeListings, 0),
  }), [hosts]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* ... (Header, StatCards, and Toolbar are the same) ... */}
        <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] border border-slate-700/50 p-8 mb-8 rounded-2xl shadow-2xl">
          <h1 className="text-3xl font-bold text-white mb-2">Hosts Management</h1>
          <p className="text-white/70 text-lg">Administer host accounts and property listings.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Hosts" value={stats.total} icon="bi-house-door" iconBg="bg-blue-400/20" iconColor="text-blue-400" />
          <StatCard title="Verified Hosts" value={stats.verified} icon="bi-patch-check" iconBg="bg-green-400/20" iconColor="text-green-400" />
          <StatCard title="Unverified Hosts" value={stats.unverified} icon="bi-patch-exclamation" iconBg="bg-yellow-400/20" iconColor="text-yellow-400" />
          <StatCard title="Active Listings" value={stats.activeListings} icon="bi-eye" iconBg="bg-pink-400/20" iconColor="text-pink-400" />
        </div>
        <div className="bg-[#0b1c36]/80 border border-slate-700/50 p-4 rounded-lg mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-auto">
                <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-white/40"></i>
                <input type="text" placeholder="Search hosts..." className="bg-slate-800/60 border border-slate-700 rounded-md pl-10 pr-4 py-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-800/60 border border-slate-700 rounded-md p-1">
                    <button onClick={() => setView('grid')} className={`px-3 py-1 rounded ${view === 'grid' ? 'bg-blue-600' : 'hover:bg-slate-700/50'}`}><i className="bi bi-grid-3x3-gap-fill"></i></button>
                    <button onClick={() => setView('list')} className={`px-3 py-1 rounded ${view === 'list' ? 'bg-blue-600' : 'hover:bg-slate-700/50'}`}><i className="bi bi-list-ul"></i></button>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md flex items-center gap-2">
                    <i className="bi bi-plus-lg"></i>
                    Add Host
                </button>
            </div>
        </div>
        <div>
          {view === 'grid' 
            ? <HostGrid hosts={hosts} onViewListings={handleViewListings} onVerify={handleVerifyHost} /> 
            : <HostList hosts={hosts} onViewListings={handleViewListings} onVerify={handleVerifyHost} />
          }
        </div>
        {isModalOpen && <ListingsModal host={selectedHost} onClose={handleCloseModal} />}
      </div>
    </div>
  );
};

export default HostsAdminPage;