import React from "react";

export const Testimonials = () => {
  const testimonials = [
    {
      quote:
        "SafeWork Pro heeft onze veiligheidsprocessen compleet getransformeerd. Van papier naar digitaal in enkele weken.",
      author: "Jan de Vries",
      role: "Safety Manager",
      company: "BouwGroep NL",
    },
    {
      quote:
        "De mobiele LMRA functie is onmisbaar. Direct op locatie controles uitvoeren, zelfs zonder internet.",
      author: "Maria Jansen",
      role: "Hoofd Veiligheid",
      company: "TechConstruct BV",
    },
    {
      quote:
        "Eindelijk een systeem dat begrijpt wat we nodig hebben. VCA-compliant en gebruiksvriendelijk.",
      author: "Peter Bakker",
      role: "Operations Director",
      company: "Industriebouw Plus",
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-brand-dark-900 via-brand-dark-800 to-black text-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold tracking-[0.2em] text-brand-orange-400 uppercase mb-3">
            Voorbeeld-scenario's
          </p>
          <h2 className="text-4xl font-extrabold mb-4">
            Hoe SafeWork Pro teams kan helpen
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Onderstaande voorbeelden laten zien hoe bouw- en industriële teams hun veiligheidsproces
            digitaal kunnen inrichten met SafeWork Pro.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <article
              key={idx}
              className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:border-brand-orange-400/60 transition-colors shadow-lg"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-100 mb-6 italic leading-relaxed">"{t.quote}"</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#ff8b00] to-[#cc6f00] rounded-full flex items-center justify-center font-bold text-lg text-white">
                  {t.author.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-white">{t.author}</div>
                  <div className="text-sm text-gray-300">{t.role}</div>
                  <div className="text-sm text-gray-400">{t.company}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};