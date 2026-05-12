import { useEffect, useState } from "react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { Pencil, Trash2, Plus, X, Star } from "lucide-react";
import { toDriveImage } from "@/lib/driveUtils";

const MEDIA_TYPES = [
  { value: "image", label: "Image (URL or Google Drive)" },
  { value: "video", label: "Video (Google Drive)" },
  { value: "behance", label: "Behance project (URL)" },
  { value: "iframe", label: "Generic iframe URL" },
];

const emptyForm = {
  title: "",
  category_id: "",
  short_description: "",
  description: "",
  media_type: "image",
  media_url: "",
  behance_embed: "",
  thumbnail_url: "",
  tools: "",
  year: "",
  client: "",
  external_link: "",
  featured: false,
  show_in_book: true,
  order: 0,
};

export default function ProjectsTab() {
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = () =>
    Promise.all([api.get("/projects"), api.get("/categories")]).then(([p, c]) => {
      setProjects(p.data);
      setCategories(c.data);
      setLoading(false);
    });

  useEffect(() => {
    load();
  }, []);

  const startNew = () => {
    setEditing("new");
    setForm({ ...emptyForm, order: projects.length + 1, category_id: categories[0]?.id || "" });
  };

  const startEdit = (p) => {
    setEditing(p.id);
    setForm({
      ...emptyForm,
      ...p,
      tools: (p.tools || []).join(", "),
    });
  };

  const save = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.category_id) return toast.error("Pick a category");
    const payload = {
      ...form,
      tools: form.tools
        ? form.tools.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
    };
    try {
      if (editing === "new") {
        await api.post("/projects", payload);
        toast.success("Project added");
      } else {
        await api.put(`/projects/${editing}`, payload);
        toast.success("Project updated");
      }
      setEditing(null);
      load();
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Save failed");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this project?")) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success("Deleted");
      load();
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Delete failed");
    }
  };

  const set = (k, v) => setForm({ ...form, [k]: v });

  return (
    <div data-testid="projects-tab">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display text-2xl tracking-tight">Projects</h3>
          <p className="text-sm text-neutral-500 mt-1">
            Add work via image URL, Google Drive link, or Behance embed.
          </p>
        </div>
        <button
          onClick={startNew}
          data-testid="add-project-btn"
          disabled={categories.length === 0}
          className="inline-flex items-center gap-2 bg-[#0A0B10] text-white px-4 py-2.5 text-[11px] tracking-[0.2em] uppercase hover:bg-[#7BC4C4] transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> Add Project
        </button>
      </div>

      {categories.length === 0 && (
        <div className="border border-[#7BC4C4] bg-[#7BC4C4]/5 p-4 text-sm mb-6">
          Create a category first before adding projects.
        </div>
      )}

      {loading ? (
        <div className="text-sm text-neutral-500">Loading…</div>
      ) : projects.length === 0 ? (
        <div className="border border-dashed border-[#E1E3E8] p-10 text-center text-sm text-neutral-500">
          No projects yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => {
            const cat = categories.find((c) => c.id === p.category_id);
            const thumb = toDriveImage(p.thumbnail_url || p.media_url);
            return (
              <div
                key={p.id}
                data-testid={`project-row-${p.id}`}
                className="border border-[#E1E3E8] flex flex-col"
              >
                <div className="aspect-video bg-[#F4F5F8] relative overflow-hidden">
                  {thumb ? (
                    <img src={thumb} alt={p.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-xs text-neutral-400">
                      No thumbnail
                    </div>
                  )}
                  {p.featured && (
                    <span className="absolute top-2 left-2 bg-[#7BC4C4] text-white text-[9px] tracking-[0.2em] uppercase px-2 py-1 inline-flex items-center gap-1">
                      <Star className="w-3 h-3" /> Featured
                    </span>
                  )}
                  {p.show_in_book === false && (
                    <span className="absolute top-2 right-2 bg-neutral-700 text-white text-[9px] tracking-[0.2em] uppercase px-2 py-1">
                      Hidden from book
                    </span>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="text-[10px] tracking-[0.2em] uppercase text-neutral-500">
                    {cat?.name || "Uncategorized"} · {p.media_type}
                  </div>
                  <h4 className="font-display text-lg tracking-tight mt-1.5 leading-tight">{p.title}</h4>
                  {p.short_description && (
                    <p className="text-xs text-neutral-500 mt-2 line-clamp-2">{p.short_description}</p>
                  )}
                  <div className="mt-auto pt-4 flex gap-2">
                    <button
                      onClick={() => startEdit(p)}
                      data-testid={`edit-project-${p.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 p-2 border border-[#E1E3E8] text-xs hover:bg-[#0A0B10] hover:text-white transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => remove(p.id)}
                      data-testid={`delete-project-${p.id}`}
                      className="p-2 border border-[#E1E3E8] hover:bg-[#7BC4C4] hover:text-white hover:border-[#7BC4C4] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setEditing(null)}>
          <div className="bg-white w-full max-w-2xl border border-[#0A0B10] my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-[#E1E3E8] sticky top-0 bg-white">
              <h4 className="font-display text-xl tracking-tight">
                {editing === "new" ? "New Project" : "Edit Project"}
              </h4>
              <button onClick={() => setEditing(null)} className="p-2"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FInput label="Title *" value={form.title} onChange={(v) => set("title", v)} testid="proj-title" />
              <FSelect
                label="Category *"
                value={form.category_id}
                onChange={(v) => set("category_id", v)}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                testid="proj-category"
              />
              <FInput label="Year" value={form.year} onChange={(v) => set("year", v)} testid="proj-year" />
              <FInput label="Client" value={form.client} onChange={(v) => set("client", v)} testid="proj-client" />
              <FInput label="Tools (comma-separated)" value={form.tools} onChange={(v) => set("tools", v)} className="sm:col-span-2" testid="proj-tools" />
              <FTextarea label="Short description (modal subtitle)" rows={2} value={form.short_description} onChange={(v) => set("short_description", v)} className="sm:col-span-2" testid="proj-short" />
              <FTextarea label="Full description" rows={5} value={form.description} onChange={(v) => set("description", v)} className="sm:col-span-2" testid="proj-desc" />

              <div className="sm:col-span-2 h-px bg-[#E1E3E8] my-2" />

              <FSelect
                label="Media type"
                value={form.media_type}
                onChange={(v) => set("media_type", v)}
                options={MEDIA_TYPES}
                testid="proj-media-type"
              />
              <FInput
                label={form.media_type === "behance" ? "Behance project URL" : form.media_type === "video" ? "Google Drive video link" : form.media_type === "iframe" ? "Iframe src URL" : "Image URL or Drive link"}
                value={form.media_url}
                onChange={(v) => set("media_url", v)}
                testid="proj-media-url"
              />
              <FTextarea
                label="OR paste a full Behance <iframe> embed snippet"
                rows={3}
                value={form.behance_embed}
                onChange={(v) => set("behance_embed", v)}
                className="sm:col-span-2"
                testid="proj-behance-embed"
              />
              <FInput
                label="Thumbnail URL (optional — auto-fetched if blank)"
                value={form.thumbnail_url}
                onChange={(v) => set("thumbnail_url", v)}
                className="sm:col-span-2"
                testid="proj-thumbnail"
              />
              <FInput
                label="External link (View live project →)"
                value={form.external_link}
                onChange={(v) => set("external_link", v)}
                className="sm:col-span-2"
                testid="proj-external"
              />

              <div className="sm:col-span-2 flex items-center gap-6 flex-wrap">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => set("featured", e.target.checked)}
                    data-testid="proj-featured"
                    className="w-4 h-4 accent-[#7BC4C4]"
                  />
                  Featured
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.show_in_book !== false}
                    onChange={(e) => set("show_in_book", e.target.checked)}
                    data-testid="proj-show-in-book"
                    className="w-4 h-4 accent-[#7BC4C4]"
                  />
                  Include in Sketchbook
                </label>
                <label className="inline-flex items-center gap-3 text-sm">
                  <span className="text-[11px] tracking-[0.2em] uppercase text-neutral-500">Order</span>
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) => set("order", Number(e.target.value))}
                    data-testid="proj-order"
                    className="w-24 border border-[#E1E3E8] px-2 py-1.5 text-sm"
                  />
                </label>
              </div>
            </div>
            <div className="p-5 border-t border-[#E1E3E8] flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setEditing(null)} className="px-4 py-2.5 border border-neutral-300 text-[11px] tracking-[0.2em] uppercase">
                Cancel
              </button>
              <button
                onClick={save}
                data-testid="project-form-save"
                className="px-4 py-2.5 bg-[#0A0B10] text-white text-[11px] tracking-[0.2em] uppercase hover:bg-[#7BC4C4] transition-colors"
              >
                Save Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FInput({ label, value, onChange, testid, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[11px] tracking-[0.2em] uppercase text-neutral-500">{label}</span>
      <input
        data-testid={testid}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full border border-[#E1E3E8] px-3 py-2.5 focus:outline-none focus:border-[#0A0B10] text-sm"
      />
    </label>
  );
}

function FTextarea({ label, value, onChange, rows = 3, testid, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[11px] tracking-[0.2em] uppercase text-neutral-500">{label}</span>
      <textarea
        rows={rows}
        data-testid={testid}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full border border-[#E1E3E8] px-3 py-2.5 focus:outline-none focus:border-[#0A0B10] text-sm resize-none"
      />
    </label>
  );
}

function FSelect({ label, value, onChange, options, testid, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[11px] tracking-[0.2em] uppercase text-neutral-500">{label}</span>
      <select
        data-testid={testid}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full border border-[#E1E3E8] px-3 py-2.5 focus:outline-none focus:border-[#0A0B10] text-sm bg-white"
      >
        <option value="" disabled>Select…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
