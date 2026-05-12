import { useEffect, useState } from "react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { toDriveImage } from "@/lib/driveUtils";

export default function ProfileTab() {
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/profile").then((r) => setProfile(r.data));
  }, []);

  if (!profile) return <div className="text-sm text-neutral-500">Loading…</div>;

  const set = (k, v) => setProfile({ ...profile, [k]: v });

  const onSave = async () => {
    setSaving(true);
    try {
      await api.put("/profile", profile);
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Couldn't save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" data-testid="profile-tab">
      <div className="lg:col-span-1">
        <span className="text-[11px] tracking-[0.2em] uppercase text-neutral-500">Profile picture</span>
        <div className="mt-3 aspect-[4/5] border border-[#E1E3E8] bg-[#F4F5F8] overflow-hidden">
          {profile.profile_pic_url ? (
            <img
              src={toDriveImage(profile.profile_pic_url)}
              alt="profile"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-neutral-400">
              Paste an image / Google Drive link
            </div>
          )}
        </div>
        <Input
          label="Profile pic URL (image or Google Drive link)"
          value={profile.profile_pic_url}
          onChange={(v) => set("profile_pic_url", v)}
          placeholder="https://drive.google.com/file/d/..."
          testid="profile-pic-url"
        />
        <p className="text-xs text-neutral-500 mt-2">
          Tip: Google Drive sharing links work — make sure the file is shared "Anyone with the link".
        </p>
      </div>

      <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Input label="Name" value={profile.name} onChange={(v) => set("name", v)} testid="profile-name" />
        <Input label="Title" value={profile.title} onChange={(v) => set("title", v)} testid="profile-title" />
        <Input label="Location" value={profile.location} onChange={(v) => set("location", v)} testid="profile-location" />
        <Input label="Email" value={profile.email} onChange={(v) => set("email", v)} testid="profile-email" />
        <div className="sm:col-span-2 flex items-center gap-3">
          <input
            id="avail"
            type="checkbox"
            checked={profile.available}
            onChange={(e) => set("available", e.target.checked)}
            data-testid="profile-available"
            className="w-4 h-4 accent-[#7BC4C4]"
          />
          <label htmlFor="avail" className="text-sm">Available for freelance</label>
        </div>
        <Input label="Tagline" value={profile.tagline} onChange={(v) => set("tagline", v)} testid="profile-tagline" className="sm:col-span-2" />
        <Textarea label="Bio" value={profile.bio} onChange={(v) => set("bio", v)} testid="profile-bio" className="sm:col-span-2" />
        <Input label="Behance URL" value={profile.behance_url} onChange={(v) => set("behance_url", v)} testid="profile-behance" />
        <Input label="Instagram URL" value={profile.instagram_url} onChange={(v) => set("instagram_url", v)} testid="profile-instagram" />
        <Input label="LinkedIn URL" value={profile.linkedin_url} onChange={(v) => set("linkedin_url", v)} testid="profile-linkedin" />
        <Input label="CV URL" value={profile.cv_url} onChange={(v) => set("cv_url", v)} testid="profile-cv" />

        <div className="sm:col-span-2">
          <button
            onClick={onSave}
            disabled={saving}
            data-testid="profile-save"
            className="bg-[#0A0B10] text-white px-6 py-3 text-[12px] tracking-[0.2em] uppercase hover:bg-[#7BC4C4] transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save profile →"}
          </button>
        </div>

        {/* Sketchbook AI cover regenerator */}
        <SketchbookCoverPanel profile={profile} onUpdate={(p) => setProfile({ ...profile, ...p })} />
      </div>
    </div>
  );
}

function SketchbookCoverPanel({ profile, onUpdate }) {
  const [prompt, setPrompt] = useState(
    profile.sketchbook_cover_prompt ||
      "A photorealistic, high-resolution close-up of an open thick portfolio book on a wooden desk. A realistic hand is turning a page with a smooth page-curl. Matte white pages show graphic design layouts. Soft cinematic lighting, shallow depth of field."
  );
  const [busy, setBusy] = useState(false);

  const coverFull = profile.sketchbook_cover_url
    ? (profile.sketchbook_cover_url.startsWith("http")
        ? profile.sketchbook_cover_url
        : `${process.env.REACT_APP_BACKEND_URL}${profile.sketchbook_cover_url}`)
    : "";

  const regenerate = async () => {
    if (!prompt.trim()) return toast.error("Please enter a prompt.");
    setBusy(true);
    try {
      const { data } = await api.post("/admin/generate-image", { prompt, target: "sketchbook_cover" });
      onUpdate({ sketchbook_cover_url: data.url, sketchbook_cover_prompt: prompt });
      toast.success("New cover generated!");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Generation failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sm:col-span-2 border-t border-[#E1E3E8] pt-8 mt-4">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h4 className="font-display text-xl tracking-tight">Sketchbook AI cover</h4>
          <p className="text-xs text-neutral-500 mt-1">
            The cinematic photo that appears as the cover of the scroll-flip Sketchbook section.
            Generated with Gemini Nano Banana.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-start">
        <div className="sm:col-span-1">
          <div className="aspect-[4/3] border border-[#E1E3E8] bg-[#F4F5F8] overflow-hidden">
            {coverFull ? (
              <img src={coverFull} alt="Sketchbook cover" className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-neutral-400">
                No cover yet
              </div>
            )}
          </div>
        </div>
        <div className="sm:col-span-2 space-y-3">
          <label className="block">
            <span className="text-[11px] tracking-[0.2em] uppercase text-neutral-500">Prompt</span>
            <textarea
              data-testid="cover-prompt"
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="mt-2 w-full border border-[#E1E3E8] px-3 py-2.5 focus:outline-none focus:border-[#0A0B10] text-sm resize-none"
            />
          </label>
          <button
            onClick={regenerate}
            disabled={busy}
            data-testid="generate-cover-btn"
            className="inline-flex items-center gap-2 bg-[#7BC4C4] text-white px-5 py-3 text-[11px] tracking-[0.2em] uppercase hover:bg-[#0A0B10] transition-colors disabled:opacity-50"
          >
            {busy ? "Generating… (~30–60s)" : "✦ Generate new cover"}
          </button>
          <p className="text-[11px] text-neutral-400">
            Tip: describe lighting, materials, mood, and what's on the pages.
          </p>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, testid, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[11px] tracking-[0.2em] uppercase text-neutral-500">{label}</span>
      <input
        data-testid={testid}
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full border border-[#E1E3E8] bg-white px-3 py-2.5 focus:outline-none focus:border-[#0A0B10] text-sm"
      />
    </label>
  );
}

function Textarea({ label, value, onChange, testid, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[11px] tracking-[0.2em] uppercase text-neutral-500">{label}</span>
      <textarea
        data-testid={testid}
        rows={5}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full border border-[#E1E3E8] bg-white px-3 py-2.5 focus:outline-none focus:border-[#0A0B10] text-sm resize-none"
      />
    </label>
  );
}
