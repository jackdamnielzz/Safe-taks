import React from "react";
import TraWizard from "../../../components/forms/TraWizard";

export default function CreateTraPage() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Nieuwe TRA aanmaken</h1>
      <p className="text-sm text-slate-500 mb-6">
        Volg de stappen om een nieuwe Taak Risicoanalyse (TRA) aan te maken.
      </p>

      <TraWizard />
    </div>
  );
}
