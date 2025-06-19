"use client";

import { useState } from "react";

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

interface ContactMessageCardProps {
  message: ContactMessage;
  onReply: (message: ContactMessage) => void;
  onStatusChange: (messageId: string, status: "new" | "replied" | "closed") => void;
}

export default function ContactMessageCard({ message, onReply, onStatusChange }: ContactMessageCardProps) {
  const [showFullMessage, setShowFullMessage] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "text-yellow-400 bg-yellow-400/20 border-yellow-400/30";
      case "replied": return "text-green-400 bg-green-400/20 border-green-400/30";
      case "closed": return "text-red-400 bg-red-400/20 border-red-400/30";
      default: return "text-gray-400 bg-gray-400/20 border-gray-400/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new": return "bi-exclamation-circle";
      case "replied": return "bi-check-circle";
      case "closed": return "bi-x-circle";
      default: return "bi-circle";
    }
  };

  const truncateMessage = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-4 sm:p-6 hover:shadow-2xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Avatar */}
          <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
            {message.name.charAt(0).toUpperCase()}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-white truncate">{message.name}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 self-start ${getStatusColor(message.status)}`}>
                <i className={`bi ${getStatusIcon(message.status)}`}></i>
                {message.status.toUpperCase()}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-white/70">
                <i className="bi bi-envelope text-xs"></i>
                <a href={`mailto:${message.email}`} className="hover:text-pink-400 transition-colors truncate">
                  {message.email}
                </a>
              </div>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/60">
                {message.phone && (
                  <div className="flex items-center gap-1">
                    <i className="bi bi-telephone"></i>
                    <a href={`tel:${message.phone}`} className="hover:text-pink-400 transition-colors">
                      {message.phone}
                    </a>
                  </div>
                )}
                
                <div className="flex items-center gap-1">
                  <i className="bi bi-clock"></i>
                  <span>{formatDate(message.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Dropdown */}
        <div className="relative ml-2">
          <button
            onClick={() => setShowActions(!showActions)}
            className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors"
          >
            <i className="bi bi-three-dots text-lg"></i>
          </button>

          {showActions && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowActions(false)}
              ></div>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-[#0b1c36] border border-blue-800/30 rounded-xl shadow-2xl z-50">
                <div className="p-2">
                  <button
                    onClick={() => {
                      onReply(message);
                      setShowActions(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors flex items-center gap-2"
                  >
                    <i className="bi bi-reply"></i>
                    Reply via Email
                  </button>
                  
                  <div className="border-t border-white/10 my-2"></div>
                  
                  <p className="text-white/50 text-xs px-3 py-1">Change Status</p>
                  {["new", "replied", "closed"].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        onStatusChange(message.id, status as any);
                        setShowActions(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm capitalize flex items-center gap-2 ${
                        message.status === status
                          ? "bg-pink-400/20 text-pink-400"
                          : "text-white/70 hover:bg-white/10"
                      }`}
                    >
                      <i className={`bi ${getStatusIcon(status)}`}></i>
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Message Content */}
      <div className="mb-4">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-white/90 leading-relaxed">
            {showFullMessage ? message.message : truncateMessage(message.message)}
          </p>
          
          {message.message.length > 120 && (
            <button
              onClick={() => setShowFullMessage(!showFullMessage)}
              className="text-pink-400 hover:text-pink-300 text-sm mt-2 transition-colors font-medium"
            >
              {showFullMessage ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      </div>

      {/* Admin Reply (if exists) */}
      {message.adminReply && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <i className="bi bi-reply text-green-400 text-sm"></i>
            <span className="text-green-400 text-sm font-medium">Admin Reply</span>
            {message.repliedAt && (
              <span className="text-white/50 text-xs">• {formatDate(message.repliedAt)}</span>
            )}
          </div>
          <div className="bg-green-400/10 border border-green-400/20 rounded-xl p-4">
            <p className="text-white/90 text-sm leading-relaxed">{message.adminReply}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onReply(message)}
            className="bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 text-sm"
          >
            <i className="bi bi-reply"></i>
            Reply
          </button>
          
          <a
            href={`mailto:${message.email}?subject=Re: Contact Message&body=Hi ${message.name},%0D%0A%0D%0A`}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
          >
            <i className="bi bi-envelope"></i>
            <span className="hidden sm:inline">Direct Email</span>
            <span className="sm:hidden">Email</span>
          </a>
        </div>

        <div className="flex items-center gap-2">
          {message.status === "new" && (
            <button
              onClick={() => onStatusChange(message.id, "replied")}
              className="bg-green-400/20 hover:bg-green-400/30 text-green-400 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
            >
              Mark Replied
            </button>
          )}
          
          <button
            onClick={() => onStatusChange(message.id, "closed")}
            className="bg-red-400/20 hover:bg-red-400/30 text-red-400 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}