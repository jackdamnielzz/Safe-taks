"use client";

import { useState } from "react";

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        <svg
          className="w-6 h-6 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed top-16 right-0 left-0 bg-white border-b border-gray-200 shadow-lg z-50">
            <nav className="max-w-7xl mx-auto px-4 py-4 space-y-1">
              <a
                href="/tras"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
              >
                TRAs
              </a>
              <a
                href="/mobile"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
              >
                Mobile
              </a>
              <a
                href="/reports"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
              >
                Reports
              </a>
              <a
                href="/team"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
              >
                Team
              </a>
              <a
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
              >
                Settings
              </a>

              <div className="pt-4 mt-4 border-t border-gray-200">
                <a
                  href="/account"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold shadow-md">
                    J
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">John</div>
                    <div className="text-sm text-gray-500">View Account</div>
                  </div>
                </a>
              </div>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
