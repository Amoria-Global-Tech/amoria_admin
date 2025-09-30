"use client";

import { useState, useEffect } from "react";
import ContactMessageCard from "../components/messages/card";
import ReplyModal from "../components/messages/reply_modal";
import api from "../api/conn";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: "new" | "replied" | "closed";
  createdAt: string;
  repliedAt?: string;
  adminReply?: string;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "new" | "replied" | "closed">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [error, setError] = useState<string | null>(null);

  // Fetch messages from API
  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (searchTerm) params.append('search', searchTerm);
      params.append('sort', sortBy);

      const response = await api.get(`/admin/content/contacts?${params}`);
      const result = await response.data;

      if (result.success) {
        setMessages(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages. Please try again later.');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [filterStatus, sortBy]); // Refetch when filters change

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm || searchTerm === '') {
        fetchMessages();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleReply = (message: ContactMessage) => {
    setSelectedMessage(message);
    setShowReplyModal(true);
  };

  const handleSendReply = async (replyData: { subject: string; message: string }) => {
    if (!selectedMessage) return;

    try {
      // Send email reply via API
      const response = await api.post('/admin/content/contacts', {
        messageId: selectedMessage.id,
        to: selectedMessage.email,
        subject: replyData.subject,
        message: replyData.message
      }
      );

      const result: any = await response;

      if (result.success) {
        // Update message status locally
        setMessages(prev => prev.map(msg =>
          msg.id === selectedMessage.id
            ? {
              ...msg,
              status: "replied",
              repliedAt: new Date().toISOString(),
              adminReply: replyData.message
            }
            : msg
        ));
        setShowReplyModal(false);
        setSelectedMessage(null);

        // Show success message (you can add a toast notification here)
        alert('Reply sent successfully!');
      } else {
        throw new Error(result.message || 'Failed to send reply');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply. Please try again.');
    }
  };

  const handleStatusChange = async (messageId: string, newStatus: "new" | "replied" | "closed") => {
    try {
      // Update status via API
      const response = await api.post('/admin/content/contacts', { messageId, status: newStatus });

      const result: any = await response;

      if (result.success) {
        setMessages(prev => prev.map(msg =>
          msg.id === messageId ? { ...msg, status: newStatus } : msg
        ));
      } else {
        throw new Error(result.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update message status. Please try again.');
    }
  };

  const getStatusStats = () => {
    return {
      total: messages.length,
      new: messages.filter(m => m.status === "new").length,
      replied: messages.filter(m => m.status === "replied").length,
      closed: messages.filter(m => m.status === "closed").length
    };
  };

  const stats = getStatusStats();

  if (loading) {
    return (
      <div className="">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/20 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-white/10 rounded-xl"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-white/10 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Contact Messages</h1>
        <p className="text-white/70">Manage and respond to customer inquiries</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Total Messages</p>
              <p className="text-white text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-blue-400/20 p-3 rounded-xl">
              <i className="bi bi-envelope text-blue-400 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">New Messages</p>
              <p className="text-white text-2xl font-bold">{stats.new}</p>
            </div>
            <div className="bg-yellow-400/20 p-3 rounded-xl">
              <i className="bi bi-exclamation-circle text-yellow-400 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Replied</p>
              <p className="text-white text-2xl font-bold">{stats.replied}</p>
            </div>
            <div className="bg-green-400/20 p-3 rounded-xl">
              <i className="bi bi-check-circle text-green-400 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Closed</p>
              <p className="text-white text-2xl font-bold">{stats.closed}</p>
            </div>
            <div className="bg-red-400/20 p-3 rounded-xl">
              <i className="bi bi-x-circle text-red-400 text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <i className="bi bi-exclamation-triangle text-red-400"></i>
            <p className="text-red-300">{error}</p>
            <button
              onClick={fetchMessages}
              className="ml-auto px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded text-sm text-red-300 hover:text-red-200 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-2xl p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <i className="bi bi-search absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60"></i>
            <input
              type="text"
              placeholder="Search messages by name, email, or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/60 focus:outline-none focus:border-pink-400 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-400 transition-colors"
          >
            <option value="all" className="bg-[#0b1c36] text-white">All Status</option>
            <option value="new" className="bg-[#0b1c36] text-white">New</option>
            <option value="replied" className="bg-[#0b1c36] text-white">Replied</option>
            <option value="closed" className="bg-[#0b1c36] text-white">Closed</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-400 transition-colors"
          >
            <option value="newest" className="bg-[#0b1c36] text-white">Newest First</option>
            <option value="oldest" className="bg-[#0b1c36] text-white">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {!error && messages.length === 0 ? (
          <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-2xl p-12 text-center">
            <i className="bi bi-inbox text-white/40 text-6xl mb-4"></i>
            <h3 className="text-white text-xl font-semibold mb-2">No messages found</h3>
            <p className="text-white/60">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'No contact messages yet'}
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <ContactMessageCard
              key={message.id}
              message={message}
              onReply={handleReply}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </div>

      {/* Reply Modal */}
      {showReplyModal && selectedMessage && (
        <ReplyModal
          message={selectedMessage}
          onClose={() => {
            setShowReplyModal(false);
            setSelectedMessage(null);
          }}
          onSend={handleSendReply}
        />
      )}
    </>
  );
}