import React from 'react';

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  user: {
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
  status: "open" | "pending" | "resolved";
  priority: "low" | "medium" | "high" | "critical";
  category: "login_issues" | "booking_errors" | "payment_failures" | "technical_issues" | "general_inquiry";
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  repliedAt?: string;
  adminReply?: string;
  replies: TicketReply[];
}

interface TicketReply {
  id: string;
  message: string;
  sender: "user" | "admin";
  senderName: string;
  timestamp: string;
}

interface SupportTicketCardProps {
  ticket: SupportTicket;
  onReply: (ticket: SupportTicket) => void;
  onStatusChange: (ticketId: string, newStatus: "open" | "pending" | "resolved") => void;
  onAssign: (ticketId: string, assignee: string) => void;
}

const SupportTicketCard: React.FC<SupportTicketCardProps> = ({ 
  ticket, 
  onReply, 
  onStatusChange, 
  onAssign 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-500/20 border-red-500/30 text-red-300';
      case 'pending': return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300';
      case 'resolved': return 'bg-green-500/20 border-green-500/30 text-green-300';
      default: return 'bg-gray-500/20 border-gray-500/30 text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'login_issues': return 'Login Issues';
      case 'booking_errors': return 'Booking Errors';
      case 'payment_failures': return 'Payment Failures';
      case 'technical_issues': return 'Technical Issues';
      case 'general_inquiry': return 'General Inquiry';
      default: return category;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const teamMembers = ['Admin Team', 'Tech Support', 'Customer Success', 'Billing Team'];

  return (
    <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-2xl p-6 hover:border-blue-800/30 transition-all duration-200">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-white/60 text-sm font-mono">{ticket.id}</span>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
              <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
              {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
              {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
            </span>
            <span className="bg-blue-500/20 border border-blue-500/30 text-blue-300 px-2 py-1 rounded-full text-xs">
              {getCategoryLabel(ticket.category)}
            </span>
          </div>
          <h3 className="text-white text-lg font-semibold mb-2">{ticket.title}</h3>
          <p className="text-white/70 text-sm mb-3 line-clamp-2">{ticket.description}</p>
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-3">
          {ticket.user.avatar ? (
            <img 
              className="w-12 h-12 rounded-full border-2 border-white/20" 
              src={ticket.user.avatar} 
              alt={ticket.user.name} 
            />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-pink-500 rounded-full flex items-center justify-center border-2 border-white/20">
              <span className="text-white text-sm font-bold">{getInitials(ticket.user.name)}</span>
            </div>
          )}
        </div>
      </div>

      {/* User Info */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-white/60">Customer:</span>
            <span className="text-white ml-2 font-medium">{ticket.user.name}</span>
          </div>
          <div>
            <span className="text-white/60">Email:</span>
            <span className="text-white ml-2">{ticket.user.email}</span>
          </div>
          {ticket.user.phone && (
            <div>
              <span className="text-white/60">Phone:</span>
              <span className="text-white ml-2">{ticket.user.phone}</span>
            </div>
          )}
          <div>
            <span className="text-white/60">Created:</span>
            <span className="text-white ml-2">{formatDate(ticket.createdAt)}</span>
          </div>
          <div>
            <span className="text-white/60">Updated:</span>
            <span className="text-white ml-2">{formatDate(ticket.updatedAt)}</span>
          </div>
          {ticket.assignedTo && (
            <div>
              <span className="text-white/60">Assigned to:</span>
              <span className="text-white ml-2">{ticket.assignedTo}</span>
            </div>
          )}
        </div>
      </div>

      {/* Replies Count */}
      {ticket.replies.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <i className="bi bi-chat-dots"></i>
            <span>{ticket.replies.length} {ticket.replies.length === 1 ? 'reply' : 'replies'}</span>
            {ticket.repliedAt && (
              <>
                <span>•</span>
                <span>Last reply: {formatDate(ticket.repliedAt)}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Reply Button */}
        <button
          onClick={() => onReply(ticket)}
          className="bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 cursor-pointer"
        >
          <i className="bi bi-reply"></i>
          Reply
        </button>

        {/* Status Dropdown */}
        <select
          value={ticket.status}
          onChange={(e) => onStatusChange(ticket.id, e.target.value as "open" | "pending" | "resolved")}
          className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pink-400 transition-colors cursor-pointer"
        >
          <option value="open" className="bg-[#0b1c36] text-white">Open</option>
          <option value="pending" className="bg-[#0b1c36] text-white">Pending</option>
          <option value="resolved" className="bg-[#0b1c36] text-white">Resolved</option>
        </select>

        {/* Assign Dropdown */}
        <select
          value={ticket.assignedTo || ''}
          onChange={(e) => onAssign(ticket.id, e.target.value)}
          className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pink-400 transition-colors cursor-pointer"
        >
          <option value="" className="bg-[#0b1c36] text-white">Unassigned</option>
          {teamMembers.map((member) => (
            <option key={member} value={member} className="bg-[#0b1c36] text-white">
              {member}
            </option>
          ))}
        </select>

        {/* View Details Button */}
        <button className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 cursor-pointer">
          <i className="bi bi-eye"></i>
          View Details
        </button>
      </div>
    </div>
  );
};

export default SupportTicketCard;