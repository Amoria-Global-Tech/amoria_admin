"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AddNewsModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: null as File | null,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      setError("Title and description are required.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      if (formData.image) data.append("image", formData.image);

      await fetch("/api/news", {
        method: "POST",
        body: data,
      });

      setFormData({ title: "", description: "", image: null });
      setPreview(null);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Upload failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          key="modal-box"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, x: 300, y: -300 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] text-white p-6 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 relative"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Add News / Update</h2>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition"
            >
              <i className="bi bi-x-lg text-2xl"></i>
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-2 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <div className="space-y-4">
            <input
              type="text"
              name="title"
              placeholder="Title"
              value={formData.title}
              onChange={handleChange}
              maxLength={150}
              autoFocus
              className="w-full rounded-md bg-white/10 border border-white/20 text-white px-4 py-2 placeholder-white/50 focus:outline-none"
            />
            <div className="flex justify-end text-xs text-white/40">
              {formData.title.length}/150
            </div>

            <textarea
              name="description"
              placeholder="Description (max 1000 chars)"
              rows={5}
              value={formData.description}
              onChange={handleChange}
              maxLength={1000}
              className="w-full rounded-md bg-white/10 border border-white/20 text-white px-4 py-2 placeholder-white/50 resize-none focus:outline-none"
            />
            <div className="flex justify-end text-xs text-white/40">
              {formData.description.length}/1000
            </div>

            {/* File Upload */}
            <div className="flex items-center space-x-5">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 transition text-sm"
              >
                {formData.image ? "Change Image" : "Upload Image"}
              </button>

              {preview && (
                <div className="mt-3">
                  <p className="text-sm text-white/60 mb-1">Preview:</p>
                  <img
                    src={preview}
                    alt="Preview"
                    className="rounded-lg h-[15vh] object-contain border border-white/20"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md text-sm bg-white/10 hover:bg-white/20 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 rounded-md text-sm bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Add"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
