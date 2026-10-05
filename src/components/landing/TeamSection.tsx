import React from 'react';

export const teamMembers = [
  { name: 'Philippe Garnier', role: 'Executive Director', portrait: '/team/philippe-garnier.png' },
  { name: 'Alberto Bonilla', role: 'Garnier & Garnier General Manager', portrait: '/team/alberto-bonilla.png' },
  { name: 'Fernando Carazo', role: 'General Manager, La Lima Free Trade Zone', portrait: '/team/fernando-carazo.png' },
  { name: 'Andrea Hidalgo', role: 'Corporate Finance Manager', portrait: '/team/andrea-hidalgo.png' },
  { name: 'Alvaro Ramírez', role: 'Engineering Manager', portrait: '/team/alvaro-ramirez.png' },
  { name: 'Andrés Gómez', role: 'New Business Manager', portrait: '/team/andres-gomez.png' },
  { name: 'Marvin Mora', role: 'Human Resource Manager', portrait: '/team/marvin-mora.png' },
  { name: 'Kembly Brenes', role: 'Head of Sustainability and Corporate Relations', portrait: '/team/kembly-brenes.png' },
] as const;

export const TeamSection: React.FC = () => (
  <section id="team" aria-labelledby="team-title" className="landing-team border-b border-white/[0.08] bg-[#0b0c10] px-6 py-20 text-[#f4efe8] sm:px-8 lg:px-12 lg:py-28">
    <div className="mx-auto max-w-7xl">
      <div className="grid gap-8 border-b border-white/[0.08] pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-stone-500">Team / leadership</p>
          <h2 id="team-title" className="mt-5 max-w-4xl font-serif text-5xl font-light tracking-tight sm:text-7xl">The people behind the development.</h2>
        </div>
        <p className="max-w-sm text-sm leading-6 text-stone-400">A multidisciplinary leadership group connecting strategy, engineering, finance, new business, people and sustainability.</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {teamMembers.map((member, index) => (
          <article key={member.name} className="landing-team-card group">
            <div className="landing-team-portrait overflow-hidden border border-white/[0.14] bg-[#111216]">
              <img
                src={member.portrait}
                alt={`${member.name}, ${member.role}`}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </div>
            <div className="border-b border-white/[0.14] py-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-stone-500">{String(index + 1).padStart(2, '0')}</p>
              <h3 className="mt-3 font-serif text-2xl font-light text-[#f4efe8]">{member.name}</h3>
              <p className="mt-2 min-h-[2.5rem] text-xs leading-5 text-stone-400">{member.role}</p>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-8 font-mono text-[9px] uppercase tracking-[0.14em] text-stone-600">Current public team and roles / garnier.cr</p>
    </div>
  </section>
);
