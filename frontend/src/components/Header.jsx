import { Link } from "react-router-dom";

export default function Header({ profile }) {
  return (
    <header
      data-testid="site-header"
      className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b border-[#E1E3E8]"
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-3 group" data-testid="logo-link">
          <span className="font-display font-black text-lg tracking-tighter">
            SUZANNE<span className="text-[#FF3333]">.</span>
          </span>
          <span className="hidden sm:inline-block text-[10px] tracking-[0.3em] uppercase text-neutral-500">
            studio · {profile.location?.split(",")[0]}
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#about" className="hover:text-[#FF3333] transition-colors" data-testid="nav-about">About</a>
          <a href="#work" className="hover:text-[#FF3333] transition-colors" data-testid="nav-work">Work</a>
          <a href="#contact" className="hover:text-[#FF3333] transition-colors" data-testid="nav-contact">Contact</a>
        </nav>

        <div className="flex items-center gap-3">
          {profile.available && (
            <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 border border-[#FF3333] text-[#FF3333] text-[11px] tracking-[0.2em] uppercase">
              <span className="w-1.5 h-1.5 bg-[#FF3333] pulse-dot rounded-full" />
              Available
            </span>
          )}
          <Link
            to="/admin"
            data-testid="admin-link"
            className="text-[11px] tracking-[0.2em] uppercase border border-neutral-300 px-3 py-1.5 hover:bg-[#0A0B10] hover:text-white transition-colors"
          >
            Admin
          </Link>
        </div>
      </div>
    </header>
  );
}
