import { useState } from "react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";

export default function ContactSection({ profile }) {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in your name, email and message.");
      return;
    }
    setSending(true);
    try {
      await api.post("/contact", form);
      toast.success("Message sent! Suzanne will get back to you soon.");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Couldn't send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="border-b border-[#E1E3E8] bg-[#0A0B10] text-white" data-testid="contact-section">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-20 lg:py-28 grid grid-cols-12 gap-6 lg:gap-12">
        <div className="col-span-12 lg:col-span-5">
          <span className="text-[11px] tracking-[0.3em] uppercase text-neutral-400">
            04 — Contact
          </span>
          <h2 className="font-display font-black uppercase tracking-tighter text-5xl sm:text-6xl lg:text-7xl mt-4 leading-[0.92]">
            Let's make<br />
            <span className="text-[#7BC4C4]">something</span><br />
            together.
          </h2>
          <p className="text-neutral-400 mt-8 max-w-md leading-relaxed">
            Have a brand, book, brief, or wild idea? Drop a note — I read every message and reply within 2 working days.
          </p>
          <div className="mt-10 space-y-2 text-sm">
            {profile.email && (
              <a href={`mailto:${profile.email}`} className="block hover:text-[#7BC4C4] transition-colors">
                ↳ {profile.email}
              </a>
            )}
            <div className="text-neutral-500">{profile.location}</div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="col-span-12 lg:col-span-7 space-y-5" data-testid="contact-form">
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Your name *">
              <input
                data-testid="contact-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-transparent border-b border-neutral-700 focus:border-[#7BC4C4] outline-none py-3 text-lg"
                placeholder="Jane Doe"
              />
            </Field>
            <Field label="Email *">
              <input
                data-testid="contact-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-transparent border-b border-neutral-700 focus:border-[#7BC4C4] outline-none py-3 text-lg"
                placeholder="jane@studio.com"
              />
            </Field>
          </div>
          <Field label="Subject">
            <input
              data-testid="contact-subject"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full bg-transparent border-b border-neutral-700 focus:border-[#7BC4C4] outline-none py-3 text-lg"
              placeholder="Brand identity for…"
            />
          </Field>
          <Field label="Message *">
            <textarea
              data-testid="contact-message"
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full bg-transparent border-b border-neutral-700 focus:border-[#7BC4C4] outline-none py-3 text-lg resize-none"
              placeholder="Tell me a bit about the project…"
            />
          </Field>
          <button
            type="submit"
            disabled={sending}
            data-testid="contact-submit"
            className="inline-flex items-center gap-3 bg-[#7BC4C4] text-white px-8 py-4 text-[12px] tracking-[0.2em] uppercase hover:bg-white hover:text-[#0A0B10] transition-colors disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send Message →"}
          </button>
        </form>
      </div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-[11px] tracking-[0.2em] uppercase text-neutral-400">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
