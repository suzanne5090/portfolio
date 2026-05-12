import { useEffect, useState } from "react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { Trash2, Mail } from "lucide-react";

export default function MessagesTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null);

  const load = () =>
    api.get("/messages").then((r) => {
      setItems(r.data);
      setLoading(false);
    });

  useEffect(() => {
    load();
  }, []);

  const remove = async (id) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await api.delete(`/messages/${id}`);
      toast.success("Deleted");
      if (open?.id === id) setOpen(null);
      load();
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Delete failed");
    }
  };

  return (
    <div data-testid="messages-tab">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display text-2xl tracking-tight">Messages</h3>
          <p className="text-sm text-neutral-500 mt-1">
            Inquiries from the contact form ({items.length}).
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-neutral-500">Loading…</div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-[#E1E3E8] p-10 text-center text-sm text-neutral-500">
          No messages yet. Once someone submits the contact form, it will appear here.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 border border-[#E1E3E8] divide-y divide-[#E1E3E8] max-h-[70vh] overflow-y-auto">
            {items.map((m) => (
              <button
                key={m.id}
                onClick={() => setOpen(m)}
                data-testid={`message-row-${m.id}`}
                className={`w-full text-left p-4 hover:bg-[#FAFAFA] transition-colors ${
                  open?.id === m.id ? "bg-[#F4F5F8]" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm truncate">{m.name}</span>
                  <span className="text-[10px] text-neutral-500">
                    {new Date(m.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-xs text-neutral-500 mt-1 truncate">{m.subject}</div>
                <div className="text-xs text-neutral-400 mt-1 line-clamp-2">{m.message}</div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2 border border-[#E1E3E8] p-6 lg:p-8 min-h-[400px]">
            {open ? (
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-display text-2xl tracking-tight">{open.subject}</h4>
                    <div className="text-sm text-neutral-500 mt-1">
                      {open.name} · <a href={`mailto:${open.email}`} className="underline hover:text-[#7BC4C4]">{open.email}</a>
                    </div>
                  </div>
                  <button
                    onClick={() => remove(open.id)}
                    data-testid={`delete-message-${open.id}`}
                    className="p-2 border border-[#E1E3E8] hover:bg-[#7BC4C4] hover:text-white hover:border-[#7BC4C4] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="h-px bg-[#E1E3E8] my-5" />
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">{open.message}</p>
                <div className="mt-6 text-[11px] text-neutral-400 tracking-wider uppercase">
                  Received {new Date(open.created_at).toLocaleString()}
                </div>
                <a
                  href={`mailto:${open.email}?subject=Re: ${encodeURIComponent(open.subject)}`}
                  className="mt-6 inline-flex items-center gap-2 bg-[#0A0B10] text-white px-4 py-2.5 text-[11px] tracking-[0.2em] uppercase hover:bg-[#7BC4C4] transition-colors"
                  data-testid="reply-message-btn"
                >
                  <Mail className="w-3.5 h-3.5" /> Reply via email
                </a>
              </div>
            ) : (
              <div className="text-sm text-neutral-500">Select a message to read.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
