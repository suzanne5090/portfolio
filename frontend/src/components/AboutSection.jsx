import { motion } from "framer-motion";

export default function AboutSection({ profile }) {
  return (
    <section id="about" className="border-b border-[#E1E3E8]" data-testid="about-section">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-20 lg:py-28 grid grid-cols-12 gap-6 lg:gap-12">
        <div className="col-span-12 lg:col-span-3">
          <span className="text-[11px] tracking-[0.3em] uppercase text-neutral-500">
            01 — About
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="col-span-12 lg:col-span-9"
        >
          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-[1.05] max-w-3xl">
            I design with <span className="text-[#FF3333]">intent</span> — bold systems, expressive marks, and editorial precision.
          </h2>
          <div className="grid sm:grid-cols-2 gap-8 mt-10 max-w-3xl">
            <p className="text-base leading-relaxed text-neutral-700">{profile.bio}</p>
            <div>
              <div className="grid grid-cols-2 gap-y-4 text-sm">
                <span className="text-neutral-500 tracking-wider uppercase text-[11px]">Based in</span>
                <span className="font-medium">{profile.location}</span>
                <span className="text-neutral-500 tracking-wider uppercase text-[11px]">Focus</span>
                <span className="font-medium">Brand · Illustration · Web</span>
                <span className="text-neutral-500 tracking-wider uppercase text-[11px]">Status</span>
                <span className="font-medium text-[#FF3333]">
                  {profile.available ? "Open for projects" : "Currently booked"}
                </span>
                {profile.behance_url && (
                  <>
                    <span className="text-neutral-500 tracking-wider uppercase text-[11px]">Behance</span>
                    <a
                      href={profile.behance_url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium underline decoration-[#FF3333] underline-offset-4 hover:text-[#FF3333]"
                      data-testid="about-behance-link"
                    >
                      View profile →
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
