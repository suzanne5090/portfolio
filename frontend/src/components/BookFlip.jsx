import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { toDriveImage } from "@/lib/driveUtils";

function BookPage({ project, category, index, total, scrollYProgress, isCover, coverImage, profile }) {
  // Each page owns a slice of the scroll progress: [i/N, (i+1)/N]
  const start = index / total;
  const end = (index + 1) / total;
  // tiny lead-in so the flip feels eased
  const rotateY = useTransform(scrollYProgress, [start, end], [0, -180]);
  const shadowOpacity = useTransform(scrollYProgress, [start, (start + end) / 2, end], [0.25, 0.55, 0.15]);

  const thumb = !isCover ? toDriveImage(project?.thumbnail_url || project?.media_url) : "";

  return (
    <motion.div
      style={{
        rotateY,
        transformOrigin: "left center",
        transformStyle: "preserve-3d",
        zIndex: total - index,
        boxShadow: "none",
      }}
      className="absolute inset-0"
    >
      {/* FRONT face */}
      <div
        style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
        className="absolute inset-0 bg-white border border-[#0A0B10] overflow-hidden"
      >
        {isCover ? (
          // ===== COVER PAGE =====
          <div className="relative w-full h-full">
            {coverImage ? (
              <img
                src={coverImage}
                alt="Sketchbook cover"
                className="absolute inset-0 w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="absolute inset-0 bg-[#0A0B10]" />
            )}
            {/* Dark gradient for legibility */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/70 via-black/20 to-transparent" />
            {/* Inner spine shadow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bottom-0 w-20 pointer-events-none bg-gradient-to-r from-black/30 via-black/10 to-black/30" />

            {/* Title overlay */}
            <div className="absolute inset-0 flex flex-col justify-between p-10 lg:p-16 text-white">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] tracking-[0.3em] uppercase text-white/80">
                    The Sketchbook
                  </span>
                  <span className="w-8 h-px bg-white/60" />
                  <span className="text-[10px] tracking-[0.3em] uppercase text-white/80">
                    Vol. {new Date().getFullYear()}
                  </span>
                </div>
                <h2 className="font-display font-black uppercase text-5xl lg:text-7xl tracking-tighter leading-[0.9] mt-6 max-w-2xl drop-shadow-lg">
                  Selected<br />
                  <span className="text-[#FF3333]">works</span><br />
                  by hand.
                </h2>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <div className="text-[10px] tracking-[0.3em] uppercase text-white/70">By</div>
                  <div className="font-display font-bold text-2xl tracking-tight mt-1">
                    {profile?.name || "Suzanne Cherian"}
                  </div>
                  <div className="text-xs text-white/60 mt-1">{profile?.location}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] tracking-[0.3em] uppercase text-white/70">
                    {total - 1} pages
                  </div>
                  <div className="text-[10px] tracking-[0.3em] uppercase text-white/70 mt-1">
                    ↳ scroll to open
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // ===== PROJECT PAGE =====
          <div className="absolute inset-0 flex">
            {/* Left: image */}
            <div className="w-1/2 h-full bg-[#F4F5F8] relative overflow-hidden">
              {thumb ? (
                <img
                  src={thumb}
                  alt={project.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-neutral-300 font-display text-2xl">
                  {project.title}
                </div>
              )}
              <div className="absolute top-0 right-0 bottom-0 w-12 pointer-events-none bg-gradient-to-l from-black/15 to-transparent" />
            </div>

            {/* Right: text */}
            <div className="w-1/2 h-full p-8 lg:p-12 flex flex-col justify-between bg-white relative">
              <div className="absolute top-0 left-0 bottom-0 w-12 pointer-events-none bg-gradient-to-r from-black/10 to-transparent" />

              <div className="relative">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] tracking-[0.3em] uppercase text-[#FF3333]">
                    {category?.name || "Work"}
                  </span>
                  {project.year && (
                    <>
                      <span className="w-6 h-px bg-neutral-300" />
                      <span className="text-[10px] tracking-[0.3em] uppercase text-neutral-500">
                        {project.year}
                      </span>
                    </>
                  )}
                </div>
                <h3 className="font-display font-black uppercase text-3xl lg:text-5xl tracking-tighter leading-[0.95] mt-5">
                  {project.title}
                </h3>
                {project.short_description && (
                  <p className="text-sm lg:text-base text-neutral-700 leading-relaxed mt-6 max-w-md">
                    {project.short_description}
                  </p>
                )}
                {project.client && (
                  <div className="mt-6 text-[10px] tracking-[0.3em] uppercase text-neutral-500">
                    Client · <span className="text-neutral-800 normal-case tracking-normal text-sm">{project.client}</span>
                  </div>
                )}
              </div>

              <div className="relative flex items-end justify-between">
                <div className="font-display font-black text-7xl lg:text-8xl tracking-tighter text-[#F4F5F8] leading-none select-none">
                  {String(index).padStart(2, "0")}
                </div>
                <div className="text-right">
                  <div className="text-[10px] tracking-[0.3em] uppercase text-neutral-400">
                    Page {String(index).padStart(2, "0")} / {String(total - 1).padStart(2, "0")}
                  </div>
                  <div className="mt-1 text-[10px] tracking-[0.3em] uppercase text-neutral-400">
                    ↳ scroll to turn
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Drop shadow during flip */}
        <motion.div
          style={{ opacity: shadowOpacity }}
          className="absolute inset-y-0 right-0 w-1/2 pointer-events-none bg-gradient-to-l from-black/30 via-transparent to-transparent"
          aria-hidden
        />
      </div>

      {/* BACK face — visible during the flip */}
      <div
        style={{
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
        }}
        className="absolute inset-0 border border-[#0A0B10] overflow-hidden"
      >
        <div className="absolute inset-0 bg-[#F4F5F8]" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, #0A0B10 0, #0A0B10 1px, transparent 1px, transparent 28px)",
          }}
        />
        <div className="absolute inset-0 grain" />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display font-black uppercase text-2xl tracking-tighter text-neutral-400">
            {profile?.name || "Suzanne Cherian"}
          </span>
          <span className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 mt-2">
            Sketchbook · {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function BookFlip({ projects, categories, profile }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Sort newest first; cap at 8 to keep scroll length sane
  const projectPages = [...projects]
    .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
    .slice(0, 8);

  // Compose cover + project pages. Cover is index 0, projects start at 1.
  const totalPages = projectPages.length + 1;
  // section height: one screen per page + an extra to land the last page
  const heightVh = (totalPages + 1) * 100;

  // Global progress bar
  const progressScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  // Backend-served cover image URL (made absolute via REACT_APP_BACKEND_URL)
  const coverPath = profile?.sketchbook_cover_url || "";
  const coverImage = coverPath
    ? (coverPath.startsWith("http") ? coverPath : `${process.env.REACT_APP_BACKEND_URL}${coverPath}`)
    : "";

  if (projectPages.length === 0) return null;

  return (
    <section
      id="sketchbook"
      ref={ref}
      className="relative bg-[#F4F5F8] border-b border-[#E1E3E8]"
      style={{ height: `${heightVh}vh` }}
      data-testid="sketchbook-section"
    >
      {/* Sticky stage */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 lg:px-10 py-5 pointer-events-none">
          <div>
            <div className="text-[11px] tracking-[0.3em] uppercase text-neutral-500">
              02 — Sketchbook
            </div>
            <div className="font-display font-black uppercase text-2xl sm:text-3xl tracking-tighter mt-1">
              Latest <span className="text-[#FF3333]">pages.</span>
            </div>
          </div>
          <div className="hidden sm:block text-[10px] tracking-[0.3em] uppercase text-neutral-500 text-right">
            {projectPages.length} {projectPages.length === 1 ? "page" : "pages"}<br />
            scroll ↓ to flip
          </div>
        </div>

        {/* Scroll progress bar */}
        <motion.div
          style={{ scaleX: progressScale, transformOrigin: "0% 50%" }}
          className="absolute top-0 left-0 right-0 h-[2px] bg-[#FF3333] z-30"
        />

        {/* Book stage — desktop */}
        <div className="hidden lg:flex flex-1 items-center justify-center px-12">
          <div
            className="relative w-full max-w-[1100px] aspect-[16/10]"
            style={{ perspective: "2400px" }}
          >
            {/* Base "left page" backdrop — what the user sees when no pages are flipped */}
            <div className="absolute inset-0 border border-[#0A0B10] bg-white">
              <div className="absolute inset-0 grain opacity-50" />
              <div className="absolute inset-y-0 left-1/2 w-px bg-[#E1E3E8]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-[10px] tracking-[0.3em] uppercase text-neutral-400">End of book</div>
                  <div className="font-display font-black uppercase text-3xl tracking-tighter text-neutral-300 mt-2">
                    — fin —
                  </div>
                </div>
              </div>
            </div>

            {/* Cover page (index 0) */}
            <BookPage
              isCover
              coverImage={coverImage}
              profile={profile}
              index={0}
              total={totalPages}
              scrollYProgress={scrollYProgress}
            />

            {/* Project pages */}
            {projectPages.map((p, i) => (
              <BookPage
                key={p.id}
                project={p}
                category={categories.find((c) => c.id === p.category_id)}
                index={i + 1}
                total={totalPages}
                scrollYProgress={scrollYProgress}
                profile={profile}
              />
            ))}

            {/* Spine */}
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[3px] bg-[#0A0B10] z-10 pointer-events-none" />
          </div>
        </div>

        {/* Mobile fallback — simple stacked cards (the book metaphor breaks below lg) */}
        <div className="lg:hidden flex-1 overflow-y-auto px-6 py-20">
          <div className="space-y-6 max-w-md mx-auto">
            {/* Cover card */}
            {coverImage && (
              <div className="border border-[#0A0B10] overflow-hidden relative aspect-[4/3]">
                <img src={coverImage} alt="Sketchbook cover" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
                  <span className="text-[10px] tracking-[0.3em] uppercase opacity-80">The Sketchbook</span>
                  <h3 className="font-display font-black uppercase text-3xl tracking-tighter mt-2">
                    Selected <span className="text-[#FF3333]">works</span>.
                  </h3>
                </div>
              </div>
            )}
            {projectPages.map((p, i) => {
              const cat = categories.find((c) => c.id === p.category_id);
              const thumb = toDriveImage(p.thumbnail_url || p.media_url);
              return (
                <div
                  key={p.id}
                  data-testid={`book-mobile-card-${p.id}`}
                  className="border border-[#0A0B10] bg-white overflow-hidden"
                >
                  <div className="aspect-[4/3] bg-[#F4F5F8] overflow-hidden">
                    {thumb && (
                      <img
                        src={thumb}
                        alt={p.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-5">
                    <div className="text-[10px] tracking-[0.3em] uppercase text-[#FF3333]">
                      {cat?.name || "Work"}
                    </div>
                    <h3 className="font-display font-black uppercase text-2xl tracking-tighter mt-2">
                      {p.title}
                    </h3>
                    {p.short_description && (
                      <p className="text-sm text-neutral-700 mt-3">{p.short_description}</p>
                    )}
                    <div className="mt-4 text-[10px] tracking-[0.3em] uppercase text-neutral-400">
                      Page {String(i + 1).padStart(2, "0")} / {String(projectPages.length).padStart(2, "0")}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
