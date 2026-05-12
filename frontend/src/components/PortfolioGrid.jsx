import { useMemo, useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { toDriveImage } from "@/lib/driveUtils";
import { ArrowUpRight } from "lucide-react";
import ProjectModal from "./ProjectModal";

function ProjectCard({ project, category, index, onOpen }) {
  const ref = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const thumb = toDriveImage(project.thumbnail_url || project.media_url);

  // Mouse-tracked subtle parallax on the image
  const onMouseMove = (e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMouse({ x, y });
  };

  return (
    <motion.button
      ref={ref}
      layout
      initial={{ opacity: 0, y: 32, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -16, filter: "blur(6px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: (index % 9) * 0.06, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setMouse({ x: 0, y: 0 });
      }}
      onMouseMove={onMouseMove}
      onClick={() => onOpen(project)}
      data-testid={`portfolio-card-${project.id}`}
      className="group relative text-left bg-white"
    >
      {/* Image frame */}
      <div className="relative aspect-[4/5] overflow-hidden bg-[#F4F5F8] border border-[#0A0B10]">
        {thumb ? (
          <motion.img
            src={thumb}
            alt={project.title}
            referrerPolicy="no-referrer"
            animate={{
              x: hovered ? mouse.x * -18 : 0,
              y: hovered ? mouse.y * -18 : 0,
              scale: hovered ? 1.08 : 1.01,
            }}
            transition={{ type: "spring", stiffness: 120, damping: 18, mass: 0.6 }}
            className="absolute inset-0 w-full h-full object-cover will-change-transform"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-400 text-sm font-display">
            {project.title}
          </div>
        )}

        {/* Number index */}
        <span className="absolute top-3 left-3 font-display font-black text-[11px] tracking-[0.3em] text-white mix-blend-difference">
          {String(index + 1).padStart(2, "0")}
        </span>

        {/* Featured pill */}
        {project.featured && (
          <span className="absolute top-3 right-3 bg-[#FF3333] text-white text-[9px] tracking-[0.25em] uppercase px-2 py-1">
            ★
          </span>
        )}

        {/* Hover overlay — diagonal cover */}
        <motion.div
          aria-hidden
          initial={{ scaleY: 0 }}
          animate={{ scaleY: hovered ? 1 : 0 }}
          transition={{ duration: 0.5, ease: [0.65, 0, 0.35, 1] }}
          style={{ transformOrigin: "bottom" }}
          className="absolute inset-0 bg-[#0A0B10]/55"
        />

        {/* Arrow icon — draws in on hover */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0, scale: 0.6, rotate: -25 }}
          animate={{
            opacity: hovered ? 1 : 0,
            scale: hovered ? 1 : 0.6,
            rotate: hovered ? 0 : -25,
          }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-[#FF3333] text-white flex items-center justify-center"
        >
          <ArrowUpRight className="w-5 h-5" />
        </motion.div>
      </div>

      {/* Bottom label — clean editorial caption */}
      <div className="pt-3 pb-1 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] tracking-[0.25em] uppercase text-neutral-500">
            {category?.name || "Work"}{project.year ? ` · ${project.year}` : ""}
          </div>
          <h3 className="font-display font-bold text-base sm:text-lg tracking-tight mt-1 leading-tight truncate">
            {project.title}
          </h3>
        </div>
        {/* Animated underline */}
        <motion.span
          aria-hidden
          initial={false}
          animate={{ width: hovered ? 24 : 8 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="mt-3 block h-px bg-[#0A0B10]"
        />
      </div>
    </motion.button>
  );
}

export default function PortfolioGrid({ categories, projects }) {
  const [active, setActive] = useState("all");
  const [openProject, setOpenProject] = useState(null);
  const sectionRef = useRef(null);

  // Subtle scroll-linked translate for the section heading
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const titleY = useTransform(scrollYProgress, [0, 1], [40, -40]);

  const filtered = useMemo(() => {
    if (active === "all") return projects;
    return projects.filter((p) => p.category_id === active);
  }, [active, projects]);

  return (
    <section
      id="work"
      ref={sectionRef}
      className="border-b border-[#E1E3E8] relative overflow-hidden"
      data-testid="portfolio-section"
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
        {/* Header row */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-10">
          <motion.div style={{ y: titleY }}>
            <span className="text-[11px] tracking-[0.3em] uppercase text-neutral-500">
              03 — Gallery · {projects.length}
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight mt-3 leading-[1.05]">
              The gallery.
            </h2>
          </motion.div>

          {/* Pill filters */}
          <div
            data-testid="category-filters"
            className="flex flex-wrap gap-1.5 p-1 border border-[#E1E3E8] bg-white relative"
          >
            <FilterPill
              testid="filter-all"
              active={active === "all"}
              count={projects.length}
              onClick={() => setActive("all")}
            >
              All
            </FilterPill>
            {categories.map((c) => {
              const count = projects.filter((p) => p.category_id === c.id).length;
              return (
                <FilterPill
                  key={c.id}
                  testid={`filter-${c.slug}`}
                  active={active === c.id}
                  count={count}
                  onClick={() => setActive(c.id)}
                >
                  {c.name}
                </FilterPill>
              );
            })}
          </div>
        </div>

        {/* Compact gallery — 2 / 3 column */}
        {filtered.length === 0 ? (
          <div
            className="border border-dashed border-[#E1E3E8] p-16 text-center"
            data-testid="portfolio-empty"
          >
            <p className="font-display text-xl tracking-tight">
              No projects in this category yet.
            </p>
            <p className="text-sm text-neutral-500 mt-2">
              Suzanne can add new work from the admin dashboard.
            </p>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-10 lg:gap-x-7 lg:gap-y-14"
            data-testid="portfolio-grid"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((p, idx) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  category={categories.find((c) => c.id === p.category_id)}
                  index={idx}
                  onOpen={setOpenProject}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Bottom kinetic strip */}
        {filtered.length > 0 && (
          <div className="mt-16 lg:mt-24 border-t border-[#E1E3E8] pt-6 flex items-center justify-between text-[11px] tracking-[0.3em] uppercase text-neutral-500">
            <span>
              <span className="text-[#FF3333]">{filtered.length}</span> /{" "}
              {projects.length} projects shown
            </span>
            <span className="hidden sm:inline">Click any tile to expand →</span>
          </div>
        )}
      </div>

      <ProjectModal
        project={openProject}
        category={
          openProject
            ? categories.find((c) => c.id === openProject.category_id)
            : null
        }
        onClose={() => setOpenProject(null)}
      />
    </section>
  );
}

function FilterPill({ active, count, onClick, children, testid }) {
  return (
    <button
      onClick={onClick}
      data-testid={testid}
      className="relative text-[11px] tracking-[0.2em] uppercase px-4 py-2 transition-colors"
    >
      {active && (
        <motion.span
          layoutId="filter-pill-bg"
          className="absolute inset-0 bg-[#0A0B10]"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}
      <span
        className={`relative z-10 transition-colors ${active ? "text-white" : "text-[#0A0B10] hover:text-[#FF3333]"}`}
      >
        {children} <span className="opacity-50">· {count}</span>
      </span>
    </button>
  );
}
