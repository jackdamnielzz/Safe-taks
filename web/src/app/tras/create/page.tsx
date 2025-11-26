"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";

// Lazy load TraWizard component for better performance
const TraWizard = dynamic(() => import("../../../components/forms/TraWizard"), {
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-slate-600">TRA wizard laden...</span>
    </div>
  ),
  ssr: false,
});

export default function CreateTraPage() {
   return (
     <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">
          Nieuwe TRA aanmaken
        </h1>
        <p className="text-sm text-slate-500 mb-6">
         Volg de stappen om een nieuwe Taak Risicoanalyse (TRA) aan te maken.
       </p>

      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-slate-600">Laden...</span>
          </div>
        }
      >
        <TraWizard />
      </Suspense>
    </div>
  );
}
