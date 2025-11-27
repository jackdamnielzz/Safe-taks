import React from "react";
import Link from "next/link";

export const Navigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#ff8b00] to-[#cc6f00] rounded-lg flex items-center justify-center shadow-lg">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-brand-dark-900 tracking-tight">
              SafeWork Pro
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-gray-700 hover:text-brand-orange-600 transition-colors font-semibold"
            >
              Functies
            </a>
            <a
              href="#pricing"
              className="text-gray-700 hover:text-brand-orange-600 transition-colors font-semibold"
            >
              Prijzen
            </a>
            <Link
              href="/auth/login"
              className="text-gray-700 hover:text-brand-orange-600 transition-colors font-semibold"
            >
              Inloggen
            </Link>
            <Link
              href="/auth/register"
              className="px-6 py-2.5 bg-gradient-to-r from-[#ff8b00] to-[#cc6f00] text-white font-semibold rounded-lg hover:from-[#cc6f00] hover:to-[#995300] transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Gratis Proberen
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};