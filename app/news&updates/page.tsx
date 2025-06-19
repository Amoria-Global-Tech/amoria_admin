"use client";

import { useState, useEffect, useMemo } from "react";
import AddNewsModal from "../components/news/add";
import NewsCard from "../components/news/card";

type NewsItem = {
  id: number;
  title: string;
  description: string;
  date: string; // ISO string
  image?: string;
};

export default function NewsPage() {
  // Sample initial data (replace with real fetch from API)
  const initialNews: NewsItem[] = [
    {
      id: 1,
      title: "Platform Launch",
      description: "We launched the new Amoria Global Tech portal.",
      date: "2025-06-01",
      image: "user.svg",
    },
    {
      id: 2,
      title: "New Features",
      description: "Added live chat support and analytics dashboard.",
      date: "2025-06-10",
      image: "user.svg",
    },
    {
      id: 3,
      title: "Security Update",
      description: "Improved encryption and user data protection.",
      date: "2025-06-12",
      image: "user.svg",
    },
  ];

  const [news, setNews] = useState<NewsItem[]>(initialNews);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Filter and search news items
  const filteredNews = useMemo(() => {
    return news.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDate = filterDate ? item.date === filterDate : true;

      return matchesSearch && matchesDate;
    });
  }, [news, searchTerm, filterDate]);

  // Handle adding new news from modal
  // For demo: you can enhance AddNewsModal to pass new item back via callback prop,
  // but for now, we'll just close modal here.
  // TODO: integrate with backend API calls for persistence

  return (
    <div className="">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-white/40">News & Updates</h1>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-[#0b1c36] hover:bg-[#13294b] text-white font-semibold px-4 py-2 rounded-md shadow transition"
        >
          <i className="bi bi-plus-lg"></i> Add New
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <input
          type="text"
          placeholder="Search news..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 rounded-md border border-white/30 focus:outline-none focus:ring-2 focus:ring-[#0b1c36]"
        />

        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="px-4 py-2 rounded-md border border-white/30 focus:outline-none focus:ring-2 focus:ring-[#0b1c36]"
        />

        {filterDate && (
          <button
            onClick={() => setFilterDate("")}
            className="text-sm text-[#0b1c36] underline hover:text-[#13294b]"
            aria-label="Clear filter"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* News Cards */}
      {filteredNews.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredNews.map((item) => (
            <NewsCard key={item.id} {...item} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 mt-20">No news found.</p>
      )}

      {/* Add New Modal */}
      {showModal && <AddNewsModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
