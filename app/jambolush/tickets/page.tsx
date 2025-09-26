"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../api/jambolush/api-conn'; 

// Types
interface Reply {
  user: string;
  message: string;
  timestamp: Date;
}

interface Ticket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  description: string;
  department: 'Support' | 'Billing' | 'Technical';
  status: 'open' | 'pending' | 'closed' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  updatedAt: Date;
  lastReplyBy: string;
  replies: Reply[];
}

type ViewMode = 'grid' | 'list';
type SortField = 'subject' | 'userName' | 'status' | 'priority' | 'createdAt';
type SortOrder = 'asc' | 'desc';

const AdminTicketsPage: React.FC = () => {
  // Date formatting helper function
  const format = (date: Date, formatStr: string) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = new Date(date);
    if (isNaN(d.getTime())) {
        return 'Invalid Date';
    }
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();
    
    switch(formatStr) {
      case 'MMM dd, yyyy':
        return `${months[month]} ${day.toString().padStart(2, '0')}, ${year}`;
      case 'MMM dd':
        return `${months[month]} ${day.toString().padStart(2, '0')}`;
      default:
        return `${months[month]} ${day}, ${year}`;
    }
  };

  // States
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [goToPageInput, setGoToPageInput] = useState('');
  const [newReply, setNewReply] = useState('');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  
  // Sort states
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await api.get<Ticket[]>('/admin/tickets');
      
      if (response.success && Array.isArray(response.data)) {
        const formattedData = response.data.map(ticket => ({
          ...ticket,
          createdAt: new Date(ticket.createdAt),
          updatedAt: new Date(ticket.updatedAt),
          replies: Array.isArray(ticket.replies) ? ticket.replies.map(r => ({ ...r, timestamp: new Date(r.timestamp) })) : [],
        }));
        setTickets(formattedData);
      } else {
        console.error('Failed to fetch tickets:', response.error || 'Response data is not an array');
        setTickets([]); 
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    setGoToPageInput(currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    let filtered = [...tickets];

    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }
    
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.department === departmentFilter);
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      const priorityOrder: Record<Ticket['priority'], number> = { low: 1, medium: 2, high: 3, critical: 4 };
      
      switch (sortField) {
        case 'subject':
          comparison = a.subject.localeCompare(b.subject);
          break;
        case 'userName':
          comparison = a.userName.localeCompare(b.userName);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'priority':
            comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
            break;
        case 'createdAt':
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredTickets(filtered);
    if(currentPage !== 1) setCurrentPage(1);
  }, [tickets, searchTerm, statusFilter, priorityFilter, departmentFilter, sortField, sortOrder]);

  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTickets.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTickets, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);

  const uniqueDepartments = useMemo(() => {
    return [...new Set(tickets.map(t => t.department))];
  }, [tickets]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleViewDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowModal(true);
  };

  const handleStatusUpdate = async (ticketId: string, newStatus: Ticket['status']) => {
    try {
      const response = await api.patch(`/admin/tickets/${ticketId}/status`, { status: newStatus });
      if (response.success && response.data) {
        const updatedTicket = {
            ...response.data,
            createdAt: new Date(response.data.createdAt),
            updatedAt: new Date(response.data.updatedAt),
        };
        setTickets(prev => prev.map(t => t.id === ticketId ? updatedTicket : t));
      } else {
        console.error('Failed to update ticket status:', response.error);
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const handleDelete = async (ticketId: string) => {
    // In a real app, use a custom modal for confirmation instead of window.confirm
    try {
      const response = await api.delete(`/admin/tickets/${ticketId}`);
      if (response.success) {
        setTickets(prev => prev.filter(t => t.id !== ticketId));
        setShowModal(false);
      } else {
          console.error('Failed to delete ticket:', response.error);
      }
    } catch (error) {
      console.error('Error deleting ticket:', error);
    }
  };

  const handleReplySubmit = async (ticketId: string) => {
    if (!newReply.trim()) return;

    try {
        const response = await api.post(`/admin/tickets/${ticketId}/reply`, { message: newReply });
        if(response.success && response.data) {
            const updatedTicket = {
                ...response.data,
                createdAt: new Date(response.data.createdAt),
                updatedAt: new Date(response.data.updatedAt),
                replies: response.data.replies.map((r: Reply) => ({ ...r, timestamp: new Date(r.timestamp) })),
            };
            setTickets(prev => prev.map(t => t.id === ticketId ? updatedTicket : t));
            setSelectedTicket(updatedTicket); // Update the modal view
            setNewReply('');
        } else {
            console.error('Failed to submit reply:', response.error);
        }
    } catch (error) {
        console.error('Error submitting reply:', error);
    }
  };

  const handleGoToPage = (value: string) => {
    const page = parseInt(value, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-400/20 text-green-400';
      case 'pending': return 'bg-yellow-400/20 text-yellow-400';
      case 'closed': return 'bg-gray-400/20 text-gray-400';
      case 'resolved': return 'bg-blue-400/20 text-blue-400';
      default: return 'bg-gray-400/20 text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-gray-400';
      case 'medium': return 'text-blue-400';
      case 'high': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getPriorityBGColor = (priority: string) => {
    switch (priority) {
        case 'low': return 'bg-gray-400/20';
        case 'medium': return 'bg-blue-400/20';
        case 'high': return 'bg-yellow-400/20';
        case 'critical': return 'bg-red-400/20';
        default: return 'bg-gray-400/20';
    }
  }

  const stats = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      pending: tickets.filter(t => t.status === 'pending').length,
      highPriority: tickets.filter(t => t.priority === 'high' || t.priority === 'critical').length
    };
  }, [tickets]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-2xl rounded-2xl p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Admin Tickets Management
              </h1>
              <p className="text-white/70 text-lg">
                Oversee and respond to all user support tickets
              </p>
            </div>
            
            <button
              onClick={fetchTickets}
              className="bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 self-start lg:self-center"
            >
              <i className="bi bi-arrow-clockwise text-lg"></i>
              Refresh Tickets
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total Tickets</p>
                <p className="text-white text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="bg-blue-400/20 p-3 rounded-xl">
                <i className="bi bi-ticket-detailed text-blue-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Open Tickets</p>
                <p className="text-white text-2xl font-bold">{stats.open}</p>
              </div>
              <div className="bg-green-400/20 p-3 rounded-xl">
                <i className="bi bi-envelope-open text-green-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Pending Tickets</p>
                <p className="text-white text-2xl font-bold">{stats.pending}</p>
              </div>
              <div className="bg-yellow-400/20 p-3 rounded-xl">
                <i className="bi bi-clock-history text-yellow-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">High Priority</p>
                <p className="text-white text-2xl font-bold">{stats.highPriority}</p>
              </div>
              <div className="bg-red-400/20 p-3 rounded-xl">
                <i className="bi bi-exclamation-octagon text-red-400 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {/* Search */}
            <div className="xl:col-span-2">
              <label className="block text-sm font-medium text-white/80 mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Subject, user, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/60 focus:outline-none focus:border-pink-400 transition-colors"
                />
                <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-white/60"></i>
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-400 transition-colors"
              >
                <option value="all" className="bg-[#0b1c36] text-white">All Status</option>
                <option value="open" className="bg-[#0b1c36] text-white">Open</option>
                <option value="pending" className="bg-[#0b1c36] text-white">Pending</option>
                <option value="resolved" className="bg-[#0b1c36] text-white">Resolved</option>
                <option value="closed" className="bg-[#0b1c36] text-white">Closed</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-400 transition-colors"
              >
                <option value="all" className="bg-[#0b1c36] text-white">All Priorities</option>
                <option value="low" className="bg-[#0b1c36] text-white">Low</option>
                <option value="medium" className="bg-[#0b1c36] text-white">Medium</option>
                <option value="high" className="bg-[#0b1c36] text-white">High</option>
                <option value="critical" className="bg-[#0b1c36] text-white">Critical</option>
              </select>
            </div>

          </div>

          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <p className="text-white/60 text-sm">
                Showing {paginatedTickets.length} of {filteredTickets.length} tickets
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-pink-500 text-white' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <i className="bi bi-grid-3x3-gap mr-2"></i>Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-pink-500 text-white' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <i className="bi bi-list-ul mr-2"></i>List
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full"></div>
            <p className="text-white/60 mt-4">Loading tickets...</p>
          </div>
        )}

        {!loading && filteredTickets.length === 0 && (
          <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-2xl p-12 text-center">
            <i className="bi bi-ticket-detailed text-white/40 text-6xl mb-4"></i>
            <h3 className="text-white text-xl font-semibold mb-2">No tickets found</h3>
            <p className="text-white/60">Try adjusting your search or filter criteria, or check back later.</p>
          </div>
        )}

        {!loading && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedTickets.map((ticket) => (
              <div key={ticket.id} className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col">
                <div className="p-4 flex-grow">
                  <div className="flex justify-between items-start mb-2">
                     <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBGColor(ticket.priority)} ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                    </span>
                  </div>
                  
                  <h3 className="text-white font-semibold text-lg mb-2 truncate" title={ticket.subject}>{ticket.subject}</h3>
                  <p className="text-white/60 text-sm mb-1">User: {ticket.userName}</p>
                  <p className="text-white/50 text-xs mb-3">Ticket ID: {ticket.id}</p>
                  
                  <p className="text-white/70 text-sm line-clamp-3 flex-grow">{ticket.description}</p>
                </div>
                
                <div className="p-4 border-t border-white/10 mt-auto">
                    <div className="text-white/60 text-xs mb-3">
                        <p>Last Update: {format(ticket.updatedAt, 'MMM dd, yyyy')}</p>
                        <p>Department: {ticket.department}</p>
                    </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(ticket)}
                      className="flex-1 bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300"
                    >
                      <i className="bi bi-eye mr-1"></i>View
                    </button>
                    <div className="relative group">
                      <button className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
                        <i className="bi bi-three-dots-vertical"></i>
                      </button>
                      <div className="absolute right-0 bottom-full mb-1 bg-[#0b1c36] border border-blue-900/20 rounded-lg shadow-xl py-1 min-w-[120px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                        <button
                          onClick={() => handleStatusUpdate(ticket.id, 'resolved')}
                          className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                        >
                          Mark Resolved
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(ticket.id, 'closed')}
                          className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                        >
                          Close Ticket
                        </button>
                        <button
                          onClick={() => handleDelete(ticket.id)}
                          className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && viewMode === 'list' && (
          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <button onClick={() => handleSort('subject')} className="text-sm font-medium text-white/80 uppercase tracking-wider flex items-center gap-1 hover:text-white transition-colors">
                        Subject
                        {sortField === 'subject' && <i className={`bi bi-chevron-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button onClick={() => handleSort('userName')} className="text-sm font-medium text-white/80 uppercase tracking-wider flex items-center gap-1 hover:text-white transition-colors">
                        User
                         {sortField === 'userName' && <i className={`bi bi-chevron-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button onClick={() => handleSort('priority')} className="text-sm font-medium text-white/80 uppercase tracking-wider flex items-center gap-1 hover:text-white transition-colors">
                        Priority
                        {sortField === 'priority' && <i className={`bi bi-chevron-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button onClick={() => handleSort('status')} className="text-sm font-medium text-white/80 uppercase tracking-wider flex items-center gap-1 hover:text-white transition-colors">
                        Status
                        {sortField === 'status' && <i className={`bi bi-chevron-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button onClick={() => handleSort('createdAt')} className="text-sm font-medium text-white/80 uppercase tracking-wider flex items-center gap-1 hover:text-white transition-colors">
                        Last Update
                        {sortField === 'createdAt' && <i className={`bi bi-chevron-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-white/80 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {paginatedTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-white font-medium max-w-xs truncate">{ticket.subject}</div>
                        <div className="text-white/60 text-sm">{ticket.department}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{ticket.userName}</div>
                        <div className="text-white/60 text-sm">{ticket.userEmail}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                            {ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white/80 text-sm">
                        {format(ticket.updatedAt, 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => handleViewDetails(ticket)} className="text-blue-400 hover:text-blue-300 transition-colors" title="View Details">
                            <i className="bi bi-eye text-lg"></i>
                          </button>
                          <button onClick={() => handleStatusUpdate(ticket.id, 'resolved')} className="text-green-400 hover:text-green-300 transition-colors" title="Mark Resolved">
                            <i className="bi bi-check2-circle text-lg"></i>
                          </button>
                          <button onClick={() => handleDelete(ticket.id)} className="text-red-400 hover:text-red-300 transition-colors" title="Delete Ticket">
                            <i className="bi bi-trash text-lg"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white font-medium hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <i className="bi bi-chevron-left"></i>
              </button>
              
              <div className="hidden sm:flex gap-1">
                {Array.from({ length: totalPages > 5 ? 5 : totalPages }).map((_, i) => {
                    let page;
                    const pageCount = totalPages;
                    const currentPageNumber = currentPage;
                    
                    if (pageCount <= 5) {
                        page = i + 1;
                    } else {
                        if (currentPageNumber <= 3) {
                            page = i + 1;
                        } else if (currentPageNumber > pageCount - 3) {
                            page = pageCount - 4 + i;
                        } else {
                            page = currentPageNumber - 2 + i;
                        }
                    }
                  
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-pink-500 text-white'
                          : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              
              <div className="sm:hidden text-sm text-white/70">
                Page {currentPage} of {totalPages}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white font-medium hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
            
            <div className="hidden md:flex items-center gap-2">
              <span className="text-white/70 text-sm">Go to page:</span>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={goToPageInput}
                onChange={(e) => setGoToPageInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGoToPage(goToPageInput)}
                onBlur={() => handleGoToPage(goToPageInput)}
                className="w-16 px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none focus:border-pink-400 transition-colors"
              />
              <span className="text-white/70 text-sm">of {totalPages}</span>
            </div>
          </div>
        )}
      </div>

      {showModal && selectedTicket && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-blue-900/20 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              
              <div className="sticky top-0 bg-gradient-to-r from-[#0b1c36] to-[#13294b] border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-2xl font-semibold text-white truncate">{selectedTicket.subject}</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex items-center justify-center w-8 h-8 bg-white/10 hover:bg-red-500 text-white rounded-full transition-colors"
                >
                  <i className="bi bi-x text-xl"></i>
                </button>
              </div>

              <div className="px-6 py-6 overflow-y-auto flex-1">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-lg">
                    <div>
                        <p className='text-sm text-white/60'>User</p>
                        <p className='text-white font-medium'>{selectedTicket.userName}</p>
                        <p className='text-white/80'>{selectedTicket.userEmail}</p>
                    </div>
                     <div>
                        <p className='text-sm text-white/60'>Department</p>
                        <p className='text-white font-medium'>{selectedTicket.department}</p>
                    </div>
                     <div>
                        <p className='text-sm text-white/60'>Status</p>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTicket.status)}`}>
                            {selectedTicket.status}
                        </span>
                    </div>
                     <div>
                        <p className='text-sm text-white/60'>Priority</p>
                        <span className={`font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                          {selectedTicket.priority.charAt(0).toUpperCase() + selectedTicket.priority.slice(1)}
                        </span>
                    </div>
                     <div>
                        <p className='text-sm text-white/60'>Created</p>
                        <p className='text-white font-medium'>{format(selectedTicket.createdAt, 'MMM dd, yyyy')}</p>
                    </div>
                     <div>
                        <p className='text-sm text-white/60'>Last Update</p>
                        <p className='text-white font-medium'>{format(selectedTicket.updatedAt, 'MMM dd, yyyy')}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Conversation History</h3>
                     <div className="space-y-4">
                        <div className="bg-white/5 rounded-lg p-4">
                            <div className="flex justify-between text-sm mb-1">
                                <p className="font-semibold text-white">{selectedTicket.userName}</p>
                                <p className="text-white/60">{format(selectedTicket.createdAt, 'MMM dd, yyyy')}</p>
                            </div>
                            <p className="text-white/80 whitespace-pre-wrap">{selectedTicket.description}</p>
                        </div>
                        {selectedTicket.replies?.map((reply, index) => (
                             <div key={index} className="bg-white/5 rounded-lg p-4">
                                <div className="flex justify-between text-sm mb-1">
                                    <p className="font-semibold text-white">{reply.user}</p>
                                    <p className="text-white/60">{format(reply.timestamp, 'MMM dd, yyyy')}</p>
                                </div>
                                <p className="text-white/80 whitespace-pre-wrap">{reply.message}</p>
                            </div>
                        ))}
                    </div>
                  </div>

                   <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Add Reply</h3>
                        <textarea 
                            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 text-white placeholder-white/60 focus:outline-none focus:border-pink-400 transition-colors"
                            rows={4}
                            placeholder="Type your response here..."
                            value={newReply}
                            onChange={(e) => setNewReply(e.target.value)}
                        ></textarea>
                   </div>
                </div>
              </div>
              
              <div className="sticky bottom-0 bg-gradient-to-r from-[#0b1c36] to-[#13294b] border-t border-white/10 px-6 py-4 flex justify-end gap-3 z-10">
                 <button 
                    onClick={() => handleReplySubmit(selectedTicket.id)}
                    className="px-4 py-2 bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                    disabled={!newReply.trim()}
                 >
                    Submit Reply
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-white/10 text-white/80 rounded-lg hover:bg-white/20 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTicketsPage;

