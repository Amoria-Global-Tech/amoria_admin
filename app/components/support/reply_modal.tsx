import React, { useState, useEffect } from 'react';

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

interface TicketReplyModalProps {
  ticket: SupportTicket;
  onClose: () => void;
  onSend: (replyData: { subject: string; message: string }) => void;
}

const TicketReplyModal: React.FC<TicketReplyModalProps> = ({ ticket, onClose, onSend }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Pre-fill subject when modal opens
  useEffect(() => {
    setSubject(`Re: ${ticket.title} [Ticket #${ticket.id}]`);
  }, [ticket]);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      alert('Please fill in both subject and message fields.');
      return;
    }

    setSending(true);
    try {
      await onSend({ subject: subject.trim(), message: message.trim() });
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setSending(false);
    }
  };

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

  // Quick reply templates
  const quickReplies = [
    {
      label: "Thank you for contacting us",
      text: "Thank you for reaching out to our support team. I've received your request and I'm looking into this issue. I'll get back to you with a solution as soon as possible."
    },
    {
      label: "Request more information",
      text: "To better assist you with this issue, could you please provide some additional information:\n\n1. What browser are you using?\n2. What device are you on?\n3. Can you describe the steps you took before this issue occurred?\n\nThis will help me resolve your issue more quickly."
    },
    {
      label: "Issue resolved",
      text: "I'm pleased to inform you that the issue you reported has been resolved. Please try again and let us know if you continue to experience any problems. Thank you for your patience."
    },
    {
      label: "Escalating to technical team",
      text: "I've escalated your ticket to our technical team for further investigation. They will review this issue and provide a resolution. You can expect an update within 24-48 hours. Thank you for your patience."
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-blue-900/20 shadow-2xl rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-white/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-white/60 text-sm font-mono">{ticket.id}</span>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                  {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Reply to Support Ticket</h2>
              <p className="text-white/70 text-sm">{ticket.title}</p>
            </div>
            <button
              onClick={onClose}
              className="self-start sm:self-auto bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white p-2 rounded-xl transition-all"
            >
              <i className="bi bi-x-lg text-lg"></i>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Reply Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Info */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-white font-medium mb-3">Customer Information</h3>
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
                  <div>
                    <p className="text-white font-medium">{ticket.user.name}</p>
                    <p className="text-white/70 text-sm">{ticket.user.email}</p>
                    {ticket.user.phone && (
                      <p className="text-white/70 text-sm">{ticket.user.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Original Ticket */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-white font-medium mb-3">Original Request</h3>
                <div className="text-sm text-white/60 mb-2">
                  Created on {formatDate(ticket.createdAt)}
                </div>
                <p className="text-white/80">{ticket.description}</p>
              </div>

              {/* Reply Form */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-white font-medium mb-4">Send Reply</h3>
                
                {/* Subject Field */}
                <div className="mb-4">
                  <label className="text-white/80 text-sm font-medium mb-2 block">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:border-pink-400 transition-colors"
                    placeholder="Email subject..."
                  />
                </div>

                {/* Message Field */}
                <div className="mb-4">
                  <label className="text-white/80 text-sm font-medium mb-2 block">Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={8}
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:border-pink-400 transition-colors resize-none"
                    placeholder="Type your reply here..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleSend}
                    disabled={sending || !subject.trim() || !message.trim()}
                    className="bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {sending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send"></i>
                        Send Reply
                      </>
                    )}
                  </button>
                  <button
                    onClick={onClose}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white px-6 py-3 rounded-xl font-medium transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Replies Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-white font-medium mb-4">Quick Replies</h3>
                <div className="space-y-3">
                  {quickReplies.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => setMessage(template.text)}
                      className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg p-3 text-sm text-white/80 hover:text-white transition-all"
                    >
                      <div className="font-medium text-white mb-1">{template.label}</div>
                      <div className="text-xs text-white/60 line-clamp-2">
                        {template.text.substring(0, 80)}...
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ticket Actions */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-white font-medium mb-4">Ticket Actions</h3>
                <div className="space-y-3">
                  <button className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 hover:border-yellow-500/50 text-yellow-300 px-4 py-2 rounded-xl font-medium transition-all text-sm cursor-pointer">
                    Mark as Pending
                  </button>
                  <button className="w-full bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 hover:border-green-500/50 text-green-300 px-4 py-2 rounded-xl font-medium transition-all text-sm cursor-pointer">
                    Mark as Resolved
                  </button>
                  <button className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/50 text-red-300 px-4 py-2 rounded-xl font-medium transition-all text-sm cursor-pointer">
                    Escalate Ticket
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              {ticket.replies.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h3 className="text-white font-medium mb-4">Recent Activity</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {ticket.replies.slice(-3).map((reply) => (
                      <div key={reply.id} className="text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2 h-2 rounded-full ${reply.sender === 'admin' ? 'bg-blue-400' : 'bg-pink-400'}`}></span>
                          <span className="text-white/80 font-medium">{reply.senderName}</span>
                          <span className="text-white/60 text-xs">{formatDate(reply.timestamp)}</span>
                        </div>
                        <p className="text-white/70 text-xs line-clamp-2 ml-4">
                          {reply.message.substring(0, 100)}...
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketReplyModal;