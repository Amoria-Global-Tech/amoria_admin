"use client";

import { useState, useEffect } from "react";

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

interface ReplyModalProps {
  message: ContactMessage;
  onClose: () => void;
  onSend: (replyData: { subject: string; message: string }) => void;
}

export default function ReplyModal({ message, onClose, onSend }: ReplyModalProps) {
  const [subject, setSubject] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<"compose" | "preview">("compose");

  useEffect(() => {
    // Auto-generate subject
    setSubject(`Re: Contact Message - ${message.name}`);
    
    // Auto-generate initial reply template
    setReplyMessage(`Hi ${message.name},

Thank you for reaching out to us. 

[Your response here]

Best regards,
Amoria Team`);
  }, [message]);

  const handleSend = async () => {
    if (!subject.trim() || !replyMessage.trim()) return;

    setSending(true);
    try {
      await onSend({ subject: subject.trim(), message: replyMessage.trim() });
    } catch (error) {
      console.error("Error sending reply:", error);
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Email templates
  const templates = [
    {
      name: "General",
      subject: `Re: Your Inquiry - ${message.name}`,
      content: `Hi ${message.name},

Thank you for your inquiry. I appreciate you taking the time to reach out.

I'll be happy to help you with your request. Let me provide you with the information you need:

[Your detailed response here]

If you have any additional questions, please don't hesitate to ask.

Best regards,
Amoria Team`
    },
    {
      name: "Service Info",
      subject: `Re: Service Information - ${message.name}`,
      content: `Hi ${message.name},

Thank you for your interest in our services.

Based on your inquiry, here's the information you requested:

• Service details: [Details]
• Pricing: [Pricing information] 
• Timeline: [Timeline]
• Next steps: [Next steps]

I'd be happy to schedule a call to discuss your specific needs.

Best regards,
Amoria Team`
    },
    {
      name: "Follow Up",
      subject: `Following up - ${message.name}`,
      content: `Hi ${message.name},

I wanted to follow up on your recent inquiry to see if you have any additional questions.

If you'd like to move forward or need any clarification, please let me know.

Best regards,
Amoria Team`
    }
  ];

  const applyTemplate = (template: typeof templates[0]) => {
    setSubject(template.subject);
    setReplyMessage(template.content);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-blue-900/30 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-blue-800/30">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold">
              {message.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Reply to {message.name}</h2>
              <p className="text-white/70 text-sm">{message.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors"
          >
            <i className="bi bi-x-lg text-lg"></i>
          </button>
        </div>

        {/* Mobile Tabs */}
        <div className="lg:hidden border-b border-blue-800/30">
          <div className="flex">
            <button
              onClick={() => setActiveTab("compose")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "compose"
                  ? "text-white bg-white/10 border-b-2 border-pink-400"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              <i className="bi bi-pencil mr-2"></i>
              Compose
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "preview"
                  ? "text-white bg-white/10 border-b-2 border-pink-400"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              <i className="bi bi-eye mr-2"></i>
              Original
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row max-h-[calc(95vh-140px)]">
          {/* Original Message - Hidden on mobile when compose tab is active */}
          <div className={`w-full lg:w-2/5 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-blue-800/30 overflow-y-auto ${
            activeTab === "compose" ? "hidden lg:block" : "block"
          }`}>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <i className="bi bi-envelope-open text-pink-400"></i>
              Original Message
            </h3>
            
            <div className="space-y-4">
              {/* Message Details */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {message.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium">{message.name}</p>
                    <p className="text-white/60 text-sm">{formatDate(message.createdAt)}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <i className="bi bi-envelope text-pink-400"></i>
                    <span className="text-white/80">{message.email}</span>
                  </div>
                  {message.phone && (
                    <div className="flex items-center gap-2">
                      <i className="bi bi-telephone text-pink-400"></i>
                      <span className="text-white/80">{message.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <i className="bi bi-tag text-pink-400"></i>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      message.status === "new" ? "text-yellow-400 bg-yellow-400/20" :
                      message.status === "replied" ? "text-green-400 bg-green-400/20" :
                      "text-red-400 bg-red-400/20"
                    }`}>
                      {message.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Original Message Content */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                  <i className="bi bi-chat-text text-blue-400"></i>
                  Message Content
                </h4>
                <div className="bg-white/5 rounded-lg p-3 border-l-4 border-blue-400">
                  <p className="text-white/90 leading-relaxed whitespace-pre-wrap">{message.message}</p>
                </div>
              </div>

              {/* Previous Admin Reply */}
              {message.adminReply && (
                <div className="bg-green-400/10 rounded-xl p-4 border border-green-400/20">
                  <h4 className="text-green-400 font-medium mb-3 flex items-center gap-2">
                    <i className="bi bi-reply"></i>
                    Previous Reply
                  </h4>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-white/90 text-sm leading-relaxed">{message.adminReply}</p>
                    {message.repliedAt && (
                      <p className="text-green-400/70 text-xs mt-2">
                        Sent on {formatDate(message.repliedAt)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reply Form - Hidden on mobile when preview tab is active */}
          <div className={`w-full lg:w-3/5 p-4 sm:p-6 flex flex-col overflow-y-auto ${
            activeTab === "preview" ? "hidden lg:flex" : "flex"
          }`}>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <i className="bi bi-pencil text-pink-400"></i>
              Compose Reply
            </h3>
            
            {/* Email Templates */}
            <div className="mb-4">
              <label className="block text-white/80 text-sm font-medium mb-2">Quick Templates:</label>
              <div className="flex flex-wrap gap-2">
                {templates.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => applyTemplate(template)}
                    className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-sm transition-colors border border-white/20 hover:border-pink-400/50"
                  >
                    <i className="bi bi-file-text mr-1"></i>
                    {template.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject Field */}
            <div className="mb-4">
              <label className="block text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
                <i className="bi bi-tag text-pink-400"></i>
                Subject:
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all"
                placeholder="Enter email subject..."
              />
            </div>

            {/* Message Field */}
            <div className="flex-1 mb-4 flex flex-col">
              <label className="block text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
                <i className="bi bi-chat-text text-pink-400"></i>
                Message:
              </label>
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                className="flex-1 min-h-[250px] sm:min-h-[300px] bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all resize-none"
                placeholder="Type your reply here..."
              />
              <p className="text-white/50 text-xs mt-2">
                {replyMessage.length} characters
              </p>
            </div>

            {/* Preview Box */}
            {replyMessage && (
              <div className="mb-4">
                <h4 className="text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
                  <i className="bi bi-eye text-blue-400"></i>
                  Preview:
                </h4>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 max-h-32 overflow-y-auto">
                  <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                    {replyMessage}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-4 border-t border-white/10">
              <button
                onClick={onClose}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <i className="bi bi-x-circle"></i>
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !subject.trim() || !replyMessage.trim()}
                className="bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                {sending ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send"></i>
                    Send Reply
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}