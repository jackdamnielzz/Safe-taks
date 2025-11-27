import React from "react";
import Link from "next/link";

export const CTA = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background with Gradient and Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#ff8b00] to-[#cc6f00]"></div>
      <div className="absolute inset-0 opacity-10 bg-[url('/grid-pattern.svg')]"></div>
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-brand-dark-900/10 rounded-full blur-3xl"></div>

      <div className="max-w-4xl mx-auto relative z-10 text-center">
        <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
          Klaar om de veiligheid naar een hoger niveau te tillen?
        </h2>
        <p className="text-xl text-brand-orange-50 mb-10 max-w-2xl mx-auto leading-relaxed">
          Start vandaag nog met SafeWork Pro. Ervaar zelf hoe eenvoudig digitaal veiligheidsbeheer
          kan zijn. 14 dagen gratis, geen verplichtingen.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/register"
            className="px-8 py-4 bg-white text-[#cc6f00] font-bold rounded-xl hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-center min-w-[200px]"
          >
            Start Gratis Trial →
          </Link>
          <button className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-all text-center min-w-[200px]">
            Plan een Demo
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-white/20 flex flex-wrap justify-center gap-8 text-brand-orange-100 text-sm font-medium">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Geen creditcard nodig
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Direct toegang
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Vrijblijvend opzegbaar
          </div>
        </div>
      </div>
    </section>
  );
};