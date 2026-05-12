import { useEffect, useState } from "react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { Pencil, Trash2, Plus, X } from "lucide-react";

export default function CategoriesTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", order: 0 });

  const load = () =>
    api.get("/categories").then((r) => {
      setItems(r.data);
      setLoading(false);
    });

  useEffect(() => {
    load();
  }, []);

  const startNew = () => {
    setEditing("new");
    setForm({ name: "", description: "", order: items.length + 1 });
  };

  const startEdit = (c) => {
    setEditing(c.id);
    setForm({ name: c.name, description: c.description || "", order: c.order || 0 });
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Category name is required");
    try {
      if (editing === "new") {
        await api.post("/categories", form);
        toast.success("Category created");
      } else {
        await api.put(`/categories/${editing}`, form);
        toast.success("Category updated");
      }
      setEditing(null);
      load();
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Save failed");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this category? Projects under it will be unassigned.")) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success("Deleted");
      load();
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Delete failed");
    }
  };

  return (
    <div data-testid="categories-tab">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display text-2xl tracking-tight">Categories</h3>
          <p className="text-sm text-neutral-500 mt-1">Organize your work into sections.</p>
        </div>
        <button
          onClick={startNew}
          data-testid="add-category-btn"
          className="inline-flex items-center gap-2 bg-[#0A0B10] text-white px-4 py-2.5 text-[11px] tracking-[0.2em] uppercase hover:bg-[#7BC4C4] transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-neutral-500">Loading…</div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-[#E1E3E8] p-10 text-center text-sm text-neutral-500">
          No categories yet. Create your first one.
        </div>
      ) : (
        <div className="border border-[#E1E3E8]">
          <div className="grid grid-cols-12 gap-3 px-4 py-2.5 bg-[#F4F5F8] text-[10px] tracking-[0.2em] uppercase text-neutral-500">
            <div className="col-span-1">#</div>
            <div className="col-span-3">Name</div>
            <div className="col-span-2">Slug</div>
            <div className="col-span-4">Description</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          {items.map((c, i) => (
            <div
              key={c.id}
              data-testid={`category-row-${c.id}`}
              className="grid grid-cols-12 gap-3 px-4 py-3.5 border-t border-[#E1E3E8] items-center text-sm hover:bg-[#FAFAFA]"
            >
              <div className="col-span-1 text-neutral-500">{i + 1}</div>
              <div className="col-span-3 font-medium">{c.name}</div>
              <div className="col-span-2 text-neutral-500 text-xs">{c.slug}</div>
              <div className="col-span-4 text-neutral-600 truncate">{c.description || "—"}</div>
              <div className="col-span-2 flex justify-end gap-2">
                <button
                  onClick={() => startEdit(c)}
                  data-testid={`edit-category-${c.id}`}
                  className="p-2 border border-[#E1E3E8] hover:bg-[#0A0B10] hover:text-white transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => remove(c.id)}
                  data-testid={`delete-category-${c.id}`}
                  className="p-2 border border-[#E1E3E8] hover:bg-[#7BC4C4] hover:text-white hover:border-[#7BC4C4] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white w-full max-w-lg border border-[#0A0B10]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-[#E1E3E8]">
              <h4 className="font-display text-xl tracking-tight">
                {editing === "new" ? "New Category" : "Edit Category"}
              </h4>
              <button onClick={() => setEditing(null)} className="p-2"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <span className="text-[11px] tracking-[0.2em] uppercase text-neutral-500">Name</span>
                <input
                  data-testid="category-form-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-2 w-full border border-[#E1E3E8] px-3 py-2.5 focus:outline-none focus:border-[#0A0B10] text-sm"
                />
              </div>
              <div>
                <span className="text-[11px] tracking-[0.2em] uppercase text-neutral-500">Description</span>
                <textarea
                  data-testid="category-form-description"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-2 w-full border border-[#E1E3E8] px-3 py-2.5 focus:outline-none focus:border-[#0A0B10] text-sm resize-none"
                />
              </div>
              <div>
                <span className="text-[11px] tracking-[0.2em] uppercase text-neutral-500">Order</span>
                <input
                  type="number"
                  data-testid="category-form-order"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                  className="mt-2 w-full border border-[#E1E3E8] px-3 py-2.5 focus:outline-none focus:border-[#0A0B10] text-sm"
                />
              </div>
            </div>
            <div className="p-5 border-t border-[#E1E3E8] flex justify-end gap-3">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2.5 border border-neutral-300 text-[11px] tracking-[0.2em] uppercase"
              >
                Cancel
              </button>
              <button
                onClick={save}
                data-testid="category-form-save"
                className="px-4 py-2.5 bg-[#0A0B10] text-white text-[11px] tracking-[0.2em] uppercase hover:bg-[#7BC4C4] transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
