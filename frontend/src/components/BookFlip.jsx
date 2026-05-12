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

const CoverPage = React.forwardRef(({ profile, coverImage, totalProjects, isMobile }, ref) => (
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
          <span className="text-[#7BC4C4]">works</span><br />
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
            {isMobile ? "↳ swipe to open" : "↳ scroll to open"}
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
          <span className="text-[10px] tracking-[0.3em] uppercase text-[#7BC4C4]">
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
  // Track the most recently requested page + whether an animation is in flight.
  const lastTargetRef = useRef(0);
  const isFlippingRef = useRef(false);
  // queue holds the page we want to land on if a flip is currently in progress
  const queuedTargetRef = useRef(null);

  // Responsive: detect viewport. Mobile uses portrait, swipe-driven book.
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== "undefined" ? window.innerWidth < 1024 : false
  );
  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Sort newest first, only those the admin has marked for the book
  const projectPages = [...projects]
    .filter((p) => p.show_in_book !== false)
    .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
    .slice(0, 12);

  // book pages = cover + 2*projects + back cover
  const numProjects = projectPages.length;
  const numSpreads = numProjects + 1; // cover + one spread per project
  // On mobile, the book is swipe-driven so the section is just one screen tall.
  // On desktop, scroll-driven: each spread gets ~80vh.
  const heightVh = isMobile ? 100 : (numSpreads + 0.5) * 80;

  // Backend cover image URL (absolute)
  const coverPath = profile?.sketchbook_cover_url || "";
  const coverImage = coverPath
    ? (coverPath.startsWith("http") ? coverPath : `${process.env.REACT_APP_BACKEND_URL}${coverPath}`)
    : "";

  // Progress bar
  const progressScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  // Convert a "spread index" (0..numSpreads-1) → page index inside the book.
  const spreadToPage = (spread) => (spread === 0 ? 0 : 2 * spread - 1);

  // Try to land on the given target page; coalesce while a flip is animating.
  const requestFlip = (targetPage) => {
    const flipper = bookRef.current?.pageFlip?.();
    if (!flipper) return;
    if (targetPage === lastTargetRef.current) return;
    lastTargetRef.current = targetPage;

    if (isFlippingRef.current) {
      // queue — handled when current flip ends
      queuedTargetRef.current = targetPage;
      return;
    }
    isFlippingRef.current = true;
    try { flipper.flip(targetPage); } catch (_e) { isFlippingRef.current = false; }
  };

  // Hysteresis: only flip when scroll progress has moved well into the next segment.
  // Mobile is swipe-driven, so we skip this entire mechanism on phone.
  useEffect(() => {
    if (numProjects === 0 || isMobile) return undefined;

    let lastSpread = 0;
    const unsubscribe = scrollYProgress.on("change", (v) => {
      // segment size = 1 / numSpreads. Apply a small dead-zone (10% of segment).
      const exact = v * numSpreads;
      let nextSpread = lastSpread;
      // Advance forward only after we are at least 50% into next segment
      if (exact >= lastSpread + 0.55) nextSpread = Math.min(numSpreads - 1, Math.floor(exact));
      // Retreat backward only when we are at least 50% into the previous segment
      else if (exact <= lastSpread - 0.45) nextSpread = Math.max(0, Math.floor(exact));

      if (nextSpread !== lastSpread) {
        lastSpread = nextSpread;
        requestFlip(spreadToPage(nextSpread));
      }
    });
    return unsubscribe;
  }, [scrollYProgress, numProjects, numSpreads, isMobile]);

  // Callback wired into HTMLFlipBook's onFlip — fires when a flip animation completes.
  const handleBookFlip = (e) => {
    isFlippingRef.current = false;
    const arrived = e?.data ?? 0;
    // If user queued another flip mid-animation, run it now.
    const queued = queuedTargetRef.current;
    queuedTargetRef.current = null;
    if (queued != null && queued !== arrived) {
      isFlippingRef.current = true;
      try {
        bookRef.current?.pageFlip?.().flip(queued);
      } catch (_e) {
        isFlippingRef.current = false;
      }
    }
  };

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
              Latest <span className="text-[#7BC4C4]">pages.</span>
            </div>
          </div>
          <div className="hidden sm:block text-[10px] tracking-[0.3em] uppercase text-neutral-500 text-right">
            {numProjects} {numProjects === 1 ? "page" : "pages"}<br />
            {isMobile ? "swipe ↔ to flip" : "scroll ↓ to flip"}
          </div>
        </div>

        {/* Scroll progress bar (desktop only — mobile is swipe-driven) */}
        {!isMobile && (
          <motion.div
            style={{ scaleX: progressScale, transformOrigin: "0% 50%" }}
            className="absolute top-0 left-0 right-0 h-[2px] bg-[#7BC4C4] z-30"
          />
        )}

        {/* Book stage — responsive */}
        <div className="flex flex-1 items-center justify-center px-4 sm:px-8 lg:px-12 pt-20 pb-6 lg:py-0">
          <HTMLFlipBook
            key={isMobile ? "portrait" : "landscape"}
            ref={bookRef}
            width={isMobile ? 320 : 500}
            height={isMobile ? 480 : 700}
            size="stretch"
            minWidth={280}
            maxWidth={isMobile ? 480 : 600}
            minHeight={420}
            maxHeight={isMobile ? 720 : 900}
            showCover={true}
            drawShadow={true}
            flippingTime={isMobile ? 550 : 650}
            maxShadowOpacity={0.5}
            useMouseEvents={true}
            mobileScrollSupport={true}
            swipeDistance={30}
            usePortrait={isMobile}
            startPage={0}
            onFlip={handleBookFlip}
            className="sketchbook-fb"
            style={{ background: "transparent" }}
          >
            {/* Page 0 — cover (alone on right because of showCover) */}
            <CoverPage profile={profile} coverImage={coverImage} totalProjects={numProjects} isMobile={isMobile} />

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
      </div>
    </section>
  );
}
