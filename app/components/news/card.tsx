"use client";

import React from "react";

interface NewsCardProps {
  title: string;
  description: string;
  date: string;
  image?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onRepost?: () => void;
}

function formatDate(dateString: any) {
    const date = new Date(dateString);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const year = date.getFullYear();
    const month = months[date.getMonth()];
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const prefix = Number(hours) < 12 ? 'AM' : 'PM'
    return `${month}, ${day} ${year} ${hours}:${minutes} ${prefix}`;
  }
  
export default function NewsCard({
  title,
  description,
  date,
  image,
  onEdit,
  onDelete,
  onRepost,
}: NewsCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl shadow-lg bg-gradient-to-br from-[#0b1c36] to-[#13294b] backdrop-blur-sm text-white transition hover:shadow-2xl">
      {/* Action Buttons */}
      <div className="absolute top-3 right-3 flex space-x-2 z-10">
       
          <button
            onClick={onEdit}
            title="Edit"
            className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 transition"
          >
            <i className="bi bi-pencil text-white text-sm"></i>
          </button>
          <button
            onClick={onDelete}
            title="Delete"
            className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 transition"
          >
            <i className="bi bi-trash text-red-400 text-sm"></i>
          </button>
          
          <button
            onClick={onRepost}
            title="Repost"
            className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 transition"
          >
            <i className="bi bi-arrow-repeat text-blue-300 text-sm"></i>
          </button>
      </div>

      {/* Image */}
      {image && (
        <img
          src={image}
          alt={title}
          className="w-full h-44 p-4 object-contain border-b border-white/10"
        />
      )}

      {/* Content */}
      <div className="p-5 space-y-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-white/70 line-clamp-3">{description}</p>
        <div className="text-xs text-white/40 text-right">{formatDate(date)}</div>
      </div>
    </div>
  );
}
