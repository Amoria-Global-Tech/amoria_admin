"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    /*{ href: "/news&updates", label: "News & Updates", icon: "bi bi-newspaper" },     // More intuitive for news*/
    { href: "/", label: "Overview", icon: "bi bi-bar-chart-line" },  // Fits dashboard/overview theme
    { href: "/products", label: "Products", icon: "bi bi-box-seam" },        // Represents packaged goods
    { href: "/services", label: "Services", icon: "bi bi-gear-wide-connected" }, // Implies service/integration
    { href: "/messages", label: "Messages", icon: "bi bi-chat-dots" },       // Friendlier message icon
  ];
  

  return (
    <>
      {/* Toggle Button - Mobile Only */}
      <button
        className="lg:hidden fixed top-4 right-4 z-50 text-2xl text-white bg-[#0b1c36] bg-opacity-70 backdrop-blur-sm p-2 rounded-md shadow-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        <i className="bi bi-list"></i>
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-72 
          bg-gradient-to-b from-[#0b1c36] to-[#13294b] 
          bg-opacity-80 backdrop-blur-xl border-r border-blue-900/20 shadow-2xl 
          text-white p-6 flex flex-col z-40
          transition-transform duration-300 ease-in-out
          ${
            isOpen
              ? "translate-x-0"
              : "translate-x-[-100%] lg:translate-x-0" // hide only on mobile
          }`}
      >
        {/* Profile Section */}
        <div className="flex items-center space-x-4 mb-10">
          <img
            src="/user.svg"
            alt="User Avatar"
            className="w-12 h-12 rounded-full border-2 border-white/40 shadow"
          />
          <div>
            <p className="text-sm text-white/60">Welcome </p>
            <h3 className="text-lg font-semibold text-white">Admin</h3>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1">
          <h2 className="text-sm font-semibold text-white/50 mb-4 uppercase tracking-wide">
            Company Blog
          </h2>
          <ul className="space-y-1">
            {navItems.map(({ href, label, icon }) => (
              <li key={href}>
                <Link href={href}>
                  <div
                    onClick={() => setIsOpen(false)} // auto-close on mobile
                    className={`flex items-center justify-between gap-3 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all
                      ${
                        pathname === href
                          ? "bg-white/10 text-white font-semibold shadow-inner"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                        <i className={`${icon} text-lg`}></i>
                        {label}
                    </div>
                    {label === 'Messages' && (<span className="text-white bg-pink-400 -mt-2 px-2 py-[2px] text-sm rounded-full">6</span>)}
              
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="mt-10 text-xs text-white/40">
          &copy; {new Date().getFullYear()} <span className="text-white">Amoria</span>. All rights reserved.
        </div>
      </aside>
    </>
  );
}
