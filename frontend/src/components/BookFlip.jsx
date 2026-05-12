import React, { useRef, useEffect } from "react";
import HTMLFlipBook from "react-pageflip";
import { motion, useScroll, useTransform } from "framer-motion";
import { toDriveImage } from "@/lib/driveUtils";

/* ------------------------------------------------------------------
 *  Page components — each MUST be a forwardRef component for
 *  react-pageflip to attach its internal refs.
 *  ------------------------------------------------------------------ */

const PageWrapper = React.forwardRef(({ children, className = "", testId }, ref) => (
  <div
    ref={ref}
    data-testid={testId}
    className={`relative w-full h-full bg-white border border-[#0A0B10] overflow-hidden ${className}`}
    style={{ backgroundColor: "#fff" }}
  >
    {children}
  </div>
));
PageWrapper.displayName = "PageWrapper";

const CoverPage = React.forwardRef(({ profile, coverImage, totalProjects }, ref) => (
  <PageWrapper ref={ref} testId="book-cover">
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
    {/* Legibility gradient */}
    <div className="absolute inset-0 bg-gradient-to-tr from-black/75 via-black/25 to-transparent" />
    {/* Paper texture on top of image for slight realism */}
    <div className="absolute inset-0 mix-blend-overlay opacity-10 pointer-events-none"
         style={{
           backgroundImage:
             "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
         }}
    />

    {/* Title overlay */}
    <div className="absolute inset-0 flex flex-col justify-between p-8 lg:p-12 text-white">
      <div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] tracking-[0.3em] uppercase text-white/80">The Sketchbook</span>
          <span className="w-8 h-px bg-white/60" />
          <span className="text-[10px] tracking-[0.3em] uppercase text-white/80">
            Vol. {new Date().getFullYear()}
          </span>
        </div>
        <h2 className="font-display font-black uppercase text-4xl lg:text-6xl tracking-tighter leading-[0.9] mt-6 drop-shadow-lg">
          Selected<br />
          <span className="text-[#FF3333]">works</span><br />
          by hand.
        </h2>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[10px] tracking-[0.3em] uppercase text-white/70">By</div>
          <div className="font-display font-bold text-xl tracking-tight mt-1">
            {profile?.name || "Suzanne Cherian"}
          </div>
          <div className="text-xs text-white/60 mt-1">{profile?.location}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] tracking-[0.3em] uppercase text-white/70">
            {totalProjects} {totalProjects === 1 ? "page" : "pages"}
          </div>
          <div className="text-[10px] tracking-[0.3em] uppercase text-white/70 mt-1">
            ↳ scroll to open
          </div>
        </div>
      </div>
    </div>
  </PageWrapper>
));
CoverPage.displayName = "CoverPage";

const ImagePage = React.forwardRef(({ project }, ref) => {
  const thumb = toDriveImage(project.thumbnail_url || project.media_url);
  return (
    <PageWrapper ref={ref} testId={`book-image-${project.id}`}>
      <div className="absolute inset-0 bg-[#F4F5F8]">
        {thumb ? (
          <img
            src={thumb}
            alt={project.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-neutral-300 font-display text-2xl px-6 text-center">
            {project.title}
          </div>
        )}
      </div>
      {/* Inner spine shadow on the right edge */}
      <div className="absolute top-0 right-0 bottom-0 w-10 pointer-events-none bg-gradient-to-l from-black/20 to-transparent" />
    </PageWrapper>
  );
});
ImagePage.displayName = "ImagePage";

const TextPage = React.forwardRef(({ project, category, index, totalProjects, profile }, ref) => (
  <PageWrapper ref={ref} testId={`book-text-${project.id}`}>
    <div className="absolute inset-0 p-8 lg:p-10 flex flex-col justify-between bg-white">
      {/* Inner spine shadow on left edge */}
      <div className="absolute top-0 left-0 bottom-0 w-10 pointer-events-none bg-gradient-to-r from-black/15 to-transparent" />

      <div className="relative">
        <div className="flex items-center gap-3 flex-wrap">
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
        <h3 className="font-display font-black uppercase text-3xl lg:text-4xl tracking-tighter leading-[0.95] mt-5">
          {project.title}
        </h3>
        {project.short_description && (
          <p className="text-sm text-neutral-700 leading-relaxed mt-5">
            {project.short_description}
          </p>
        )}
        {project.client && (
          <div className="mt-5 text-[10px] tracking-[0.3em] uppercase text-neutral-500">
            Client · <span className="text-neutral-800 normal-case tracking-normal text-sm">{project.client}</span>
          </div>
        )}
        {project.tools?.length > 0 && (
          <div className="mt-2 text-[10px] tracking-[0.3em] uppercase text-neutral-500">
            Tools · <span className="text-neutral-800 normal-case tracking-normal text-sm">{project.tools.join(", ")}</span>
          </div>
        )}
      </div>

      <div className="relative flex items-end justify-between mt-6">
        <div className="font-display font-black text-6xl lg:text-7xl tracking-tighter text-[#F4F5F8] leading-none select-none">
          {String(index).padStart(2, "0")}
        </div>
        <div className="text-right">
          <div className="text-[10px] tracking-[0.3em] uppercase text-neutral-400">
            Page {String(index).padStart(2, "0")} / {String(totalProjects).padStart(2, "0")}
          </div>
          <div className="mt-1 text-[10px] tracking-[0.3em] uppercase text-neutral-400">
            {profile?.name?.split(" ")[0] || "Suzanne"}
          </div>
        </div>
      </div>
    </div>
  </PageWrapper>
));
TextPage.displayName = "TextPage";

const BackCover = React.forwardRef(({ profile }, ref) => (
  <PageWrapper ref={ref} testId="book-back-cover" className="bg-[#0A0B10]">
    <div className="absolute inset-0 bg-[#0A0B10]" />
    <div className="absolute inset-0 grain opacity-30" />
    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-10">
      <span className="text-[10px] tracking-[0.3em] uppercase text-white/60">— end —</span>
      <h3 className="font-display font-black uppercase text-3xl lg:text-4xl tracking-tighter mt-4 text-center">
        Thank you<br />for reading.
      </h3>
      <div className="mt-8 text-center">
        <div className="text-xs tracking-wider uppercase text-white/60">More work at</div>
        <div className="font-display font-bold text-xl tracking-tight mt-1">
          {profile?.name || "Suzanne Cherian"}
        </div>
        <a href="#contact" className="inline-block mt-4 text-[10px] tracking-[0.3em] uppercase border border-white/40 px-4 py-2 hover:bg-white hover:text-[#0A0B10] transition-colors">
          Get in touch →
        </a>
      </div>
    </div>
  </PageWrapper>
));
BackCover.displayName = "BackCover";

/* ------------------------------------------------------------------ */

export default function BookFlip({ projects, categories, profile }) {
  const sectionRef = useRef(null);
  const bookRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Sort newest first, cap at 8
  const projectPages = [...projects]
    .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
    .slice(0, 8);

  // book pages = cover + 2*projects + back cover
  const numProjects = projectPages.length;
  const numSpreads = numProjects + 1; // cover + one spread per project
  const heightVh = (numSpreads + 1.2) * 100;

  // Backend cover image URL (absolute)
  const coverPath = profile?.sketchbook_cover_url || "";
  const coverImage = coverPath
    ? (coverPath.startsWith("http") ? coverPath : `${process.env.REACT_APP_BACKEND_URL}${coverPath}`)
    : "";

  // Progress bar
  const progressScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  // Drive book.flip() from scroll position
  useEffect(() => {
    if (numProjects === 0) return undefined;
    const unsubscribe = scrollYProgress.on("change", (v) => {
      const flipper = bookRef.current?.pageFlip?.();
      if (!flipper) return;
      // Map progress to spread index. Each spread = one slice of scroll.
      // cover is spread 0, project 1 is spread 1, etc.
      const targetSpread = Math.min(numSpreads - 1, Math.max(0, Math.floor(v * numSpreads)));
      // Convert spread index → left page index of that spread.
      // Cover: page 0. Project N spread: left page = 1 + 2*(N-1) = 2N-1
      const targetPage = targetSpread === 0 ? 0 : 2 * targetSpread - 1;
      const current = flipper.getCurrentPageIndex();
      if (current !== targetPage) {
        try { flipper.flip(targetPage); } catch (_e) { /* ignore mid-anim */ }
      }
    });
    return unsubscribe;
  }, [scrollYProgress, numProjects, numSpreads]);

  if (numProjects === 0) return null;

  return (
    <section
      id="sketchbook"
      ref={sectionRef}
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
            {numProjects} {numProjects === 1 ? "page" : "pages"}<br />
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
          <HTMLFlipBook
            ref={bookRef}
            width={500}
            height={700}
            size="fixed"
            minWidth={400}
            maxWidth={600}
            minHeight={500}
            maxHeight={900}
            showCover={true}
            drawShadow={true}
            flippingTime={900}
            maxShadowOpacity={0.6}
            useMouseEvents={true}
            mobileScrollSupport={false}
            usePortrait={false}
            startPage={0}
            className="sketchbook-fb"
            style={{ background: "transparent" }}
          >
            {/* Page 0 — cover (alone on right because of showCover) */}
            <CoverPage profile={profile} coverImage={coverImage} totalProjects={numProjects} />

            {/* For each project: left page = image, right page = text */}
            {projectPages.flatMap((p, i) => [
              <ImagePage key={`${p.id}-img`} project={p} />,
              <TextPage
                key={`${p.id}-txt`}
                project={p}
                category={categories.find((c) => c.id === p.category_id)}
                index={i + 1}
                totalProjects={numProjects}
                profile={profile}
              />,
            ])}

            {/* Back cover */}
            <BackCover profile={profile} />
          </HTMLFlipBook>
        </div>

        {/* Mobile fallback */}
        <div className="lg:hidden flex-1 overflow-y-auto px-6 py-20">
          <div className="space-y-6 max-w-md mx-auto">
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
                      Page {String(i + 1).padStart(2, "0")} / {String(numProjects).padStart(2, "0")}
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
