export default function Footer({ profile }) {
  const links = [
    { label: "Behance", url: profile.behance_url },
    { label: "Instagram", url: profile.instagram_url },
    { label: "LinkedIn", url: profile.linkedin_url },
  ].filter((l) => l.url);

  return (
    <footer className="bg-white border-t border-[#E1E3E8]" data-testid="site-footer">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-sm">
        <div className="font-display font-black text-2xl tracking-tighter">
          SUZANNE<span className="text-[#7BC4C4]">.</span>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#7BC4C4] transition-colors"
            >
              {l.label} →
            </a>
          ))}
        </div>
        <div className="text-neutral-500 text-xs tracking-wider uppercase">
          © {new Date().getFullYear()} — All rights reserved
        </div>
      </div>
    </footer>
  );
}
