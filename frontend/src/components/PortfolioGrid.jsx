import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toDriveImage } from "@/lib/driveUtils";
import ProjectModal from "./ProjectModal";

export default function PortfolioGrid({ categories, projects }) {
  const [active, setActive] = useState("all");
  const [openProject, setOpenProject] = useState(null);

  const filtered = useMemo(() => {
    if (active === "all") return projects;
    return projects.filter((p) => p.category_id === active);
  }, [active, projects]);

  const tetrisClass = (idx) => {
    // Asymmetric tetris-ish pattern
    const cycle = idx % 6;
    if (cycle === 0) return "lg:col-span-7 lg:row-span-2 aspect-[4/5] lg:aspect-auto lg:min-h-[640px]";
    if (cycle === 1) return "lg:col-span-5 aspect-[4/3]";
    if (cycle === 2) return "lg:col-span-5 aspect-[4/5]";
    if (cycle === 3) return "lg:col-span-7 aspect-[16/10]";
    if (cycle === 4) return "lg:col-span-6 aspect-[4/3]";
    return "lg:col-span-6 aspect-[4/3]";
  };

  return (
    <section id="work" className="border-b border-[#E1E3E8]" data-testid="portfolio-section">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
          <div>
            <span className="text-[11px] tracking-[0.3em] uppercase text-neutral-500">
              02 — Selected Work
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight mt-3 leading-[1.05]">
              The portfolio.
            </h2>
          </div>

          <div className="flex flex-wrap gap-2" data-testid="category-filters">
            <button
              data-testid="filter-all"
              onClick={() => setActive("all")}
              className={`text-[11px] tracking-[0.2em] uppercase px-4 py-2 border transition-colors ${
                active === "all"
                  ? "bg-[#0A0B10] text-white border-[#0A0B10]"
                  : "border-neutral-300 hover:border-[#0A0B10]"
              }`}
            >
              All · {projects.length}
            </button>
            {categories.map((c) => {
              const count = projects.filter((p) => p.category_id === c.id).length;
              return (
                <button
                  key={c.id}
                  data-testid={`filter-${c.slug}`}
                  onClick={() => setActive(c.id)}
                  className={`text-[11px] tracking-[0.2em] uppercase px-4 py-2 border transition-colors ${
                    active === c.id
                      ? "bg-[#0A0B10] text-white border-[#0A0B10]"
                      : "border-neutral-300 hover:border-[#0A0B10]"
                  }`}
                >
                  {c.name} · {count}
                </button>
              );
            })}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="border border-dashed border-[#E1E3E8] p-16 text-center" data-testid="portfolio-empty">
            <p className="font-display text-xl tracking-tight">No projects in this category yet.</p>
            <p className="text-sm text-neutral-500 mt-2">
              Suzanne can add new work from the admin dashboard.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8" data-testid="portfolio-grid">
            <AnimatePresence mode="popLayout">
              {filtered.map((p, idx) => {
                const cat = categories.find((c) => c.id === p.category_id);
                const thumb = toDriveImage(p.thumbnail_url || p.media_url);
                return (
                  <motion.button
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, delay: (idx % 6) * 0.05 }}
                    onClick={() => setOpenProject(p)}
                    data-testid={`portfolio-card-${p.id}`}
                    className={`group relative overflow-hidden border border-[#0A0B10] bg-[#F4F5F8] text-left ${tetrisClass(idx)} col-span-1`}
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={p.title}
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-neutral-400 text-sm font-display">
                        {p.title}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 lg:p-7 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                      <div className="flex items-end justify-between gap-4">
                        <div>
                          {cat && (
                            <span className="text-[10px] tracking-[0.3em] uppercase text-white/70 group-hover:text-white">
                              {cat.name}
                            </span>
                          )}
                          <h3 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight mt-1">
                            {p.title}
                          </h3>
                        </div>
                        <span className="hidden sm:flex w-10 h-10 items-center justify-center bg-[#FF3333] text-white text-xl translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                          →
                        </span>
                      </div>
                    </div>
                    {p.featured && (
                      <span className="absolute top-4 left-4 bg-white text-[10px] tracking-[0.3em] uppercase px-2 py-1 border border-[#0A0B10]">
                        Featured
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <ProjectModal
        project={openProject}
        category={openProject ? categories.find((c) => c.id === openProject.category_id) : null}
        onClose={() => setOpenProject(null)}
      />
    </section>
  );
}
