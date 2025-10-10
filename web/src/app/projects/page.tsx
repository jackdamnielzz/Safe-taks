"use client";

import dynamic from "next/dynamic";

// Dynamically import the projects content with no SSR to prevent pre-rendering errors
const ProjectsContent = dynamic(() => import("./ProjectsContent").then((mod) => ({ default: mod.ProjectsContent })), {
  ssr: false,
  loading: () => (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    </div>
  ),
});

export default function ProjectsPage() {
  return <ProjectsContent />;
}
