"use client";

import dynamic from "next/dynamic";

// Dynamically import the pricing content with no SSR to prevent pre-rendering errors
const PricingContent = dynamic(
  () => import("./PricingContent").then((mod) => ({ default: mod.PricingContent })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    ),
  }
);

export default function PricingPage() {
  return <PricingContent />;
}
