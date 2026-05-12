import { motion } from "framer-motion";
import { toDriveImage } from "@/lib/driveUtils";
import { ArrowDownRight } from "lucide-react";

export default function Hero({ profile }) {
  const pic = toDriveImage(profile.profile_pic_url);

  return (
    <section id="top" className="relative overflow-hidden border-b border-[#E1E3E8]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-16 pb-24 lg:pt-24 lg:pb-32">
        <div className="grid grid-cols-12 gap-6 lg:gap-10 items-center">
          {/* Left: type column */}
          <div className="col-span-12 lg:col-span-7 order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-3 mb-6"
              data-testid="hero-eyebrow"
            >
              <span className="text-[11px] tracking-[0.3em] uppercase text-neutral-500">
                Portfolio · {new Date().getFullYear()}
              </span>
              <span className="w-8 h-px bg-neutral-300" />
              <span className="text-[11px] tracking-[0.3em] uppercase text-[#7BC4C4]">
                {profile.location}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="font-display font-black uppercase leading-[0.86] tracking-tighter text-[16vw] sm:text-[12vw] lg:text-[8.5vw]"
              data-testid="hero-title"
            >
              <span className="text-[#7BC4C4]">{profile.name?.split(" ")[0] || "Suzanne"}</span>
              <br />
              <span className="text-[#0A0B10]">{profile.name?.split(" ").slice(1).join(" ") || "Cherian"}</span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3"
            >
              <span className="font-display text-lg sm:text-xl font-medium">
                {profile.title}
              </span>
              {profile.available && (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#7BC4C4] text-[#7BC4C4] text-[11px] tracking-[0.2em] uppercase">
                  <span className="w-1.5 h-1.5 bg-[#7BC4C4] pulse-dot rounded-full" />
                  Open for Freelance
                </span>
              )}
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="mt-10 max-w-xl text-base sm:text-lg text-neutral-700 leading-relaxed"
              data-testid="hero-tagline"
            >
              {profile.tagline}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="mt-10 flex flex-wrap gap-3"
            >
              <a
                href="#work"
                data-testid="hero-cta-work"
                className="group inline-flex items-center gap-3 bg-[#0A0B10] text-white px-6 py-4 text-[12px] tracking-[0.2em] uppercase hover:bg-[#7BC4C4] transition-colors"
              >
                See the work
                <ArrowDownRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
              </a>
              <a
                href="#contact"
                data-testid="hero-cta-contact"
                className="inline-flex items-center gap-3 border border-[#0A0B10] px-6 py-4 text-[12px] tracking-[0.2em] uppercase hover:bg-[#0A0B10] hover:text-white transition-colors"
              >
                Get in touch
              </a>
            </motion.div>
          </div>

          {/* Right: portrait */}
          <div className="col-span-12 lg:col-span-5 order-1 lg:order-2 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              className="relative aspect-[4/5] w-full max-w-md mx-auto"
              data-testid="hero-portrait"
            >
              {/* Decorative back square */}
              <div className="absolute -inset-3 border border-[#0A0B10]" aria-hidden />
              {/* Spinning text ring */}
              <div className="absolute -top-10 -right-10 w-32 h-32 hidden lg:block">
                <svg viewBox="0 0 100 100" className="w-full h-full slow-spin">
                  <defs>
                    <path id="circle" d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" />
                  </defs>
                  <text fill="#0A0B10" fontSize="9" fontWeight="700" letterSpacing="4">
                    <textPath href="#circle">
                      AVAILABLE · FREELANCE · 2026 · BANGALORE ·
                    </textPath>
                  </text>
                </svg>
              </div>
              <div className="relative w-full h-full overflow-hidden float-y grain bg-[#F4F5F8]">
                {pic ? (
                  <img
                    src={pic}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-neutral-400 text-sm">
                    Add a profile picture in admin
                  </div>
                )}
              </div>
              {/* corner badge */}
              <div className="absolute -bottom-4 -left-4 bg-[#7BC4C4] text-white px-4 py-2 text-[10px] tracking-[0.3em] uppercase">
                Designer · Illustrator
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Marquee */}
      <div className="border-t border-[#E1E3E8] py-4 overflow-hidden bg-[#F4F5F8]">
        <div className="marquee-track font-display font-black uppercase text-3xl sm:text-4xl tracking-tighter">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="px-8 inline-flex items-center gap-8">
              <span>Brand Systems</span>
              <span className="text-[#7BC4C4]">★</span>
              <span>Illustration</span>
              <span className="text-[#7BC4C4]">★</span>
              <span>Editorial Design</span>
              <span className="text-[#7BC4C4]">★</span>
              <span>Visual Identity</span>
              <span className="text-[#7BC4C4]">★</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
