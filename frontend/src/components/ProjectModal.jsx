import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { X, ExternalLink } from "lucide-react";
import {
  toDriveImage,
  toDriveVideoEmbed,
  toBehanceEmbed,
  extractIframeSrc,
} from "@/lib/driveUtils";

function ProjectMedia({ project }) {
  if (!project) return null;
  const { media_type, media_url, behance_embed } = project;

  // explicit iframe snippet takes priority
  if (behance_embed) {
    const src = extractIframeSrc(behance_embed) || media_url;
    if (src) {
      return (
        <div className="iframe-wrap">
          <iframe
            src={src}
            allow="clipboard-write"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            title={project.title}
          />
        </div>
      );
    }
  }

  if (media_type === "behance") {
    return (
      <div className="iframe-wrap">
        <iframe
          src={toBehanceEmbed(media_url)}
          allow="clipboard-write"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          title={project.title}
        />
      </div>
    );
  }

  if (media_type === "iframe") {
    return (
      <div className="iframe-wrap">
        <iframe src={media_url} title={project.title} allowFullScreen />
      </div>
    );
  }

  if (media_type === "video") {
    return (
      <div className="iframe-wrap">
        <iframe
          src={toDriveVideoEmbed(media_url)}
          allow="autoplay"
          allowFullScreen
          title={project.title}
        />
      </div>
    );
  }

  // default image
  const src = toDriveImage(media_url || project.thumbnail_url);
  return (
    <div className="w-full h-full overflow-auto no-scrollbar bg-[#F4F5F8]">
      {src ? (
        <img
          src={src}
          alt={project.title}
          referrerPolicy="no-referrer"
          className="w-full h-auto object-contain mx-auto"
        />
      ) : (
        <div className="flex items-center justify-center h-full text-neutral-400">
          No media set
        </div>
      )}
    </div>
  );
}

export default function ProjectModal({ project, category, onClose }) {
  const open = !!project;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        data-testid="project-modal"
        className="p-0 border border-[#0A0B10] bg-white max-w-[95vw] w-[95vw] sm:w-[92vw] h-[90vh] sm:rounded-none rounded-none overflow-hidden flex flex-col lg:flex-row"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">{project?.title || "Project"}</DialogTitle>
        <DialogDescription className="sr-only">
          {project?.short_description || "Project details"}
        </DialogDescription>

        {/* Close */}
        <button
          onClick={onClose}
          data-testid="modal-close"
          aria-label="Close"
          className="absolute top-3 right-3 z-30 w-10 h-10 inline-flex items-center justify-center bg-[#0A0B10] text-white hover:bg-[#FF3333] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT: media — 60% on desktop */}
        <div className="relative bg-[#F4F5F8] w-full lg:w-[60%] h-[45vh] lg:h-full overflow-hidden border-b lg:border-b-0 lg:border-r border-[#0A0B10]">
          {project && <ProjectMedia project={project} />}
        </div>

        {/* RIGHT: description — 40% */}
        <div className="relative w-full lg:w-[40%] h-[45vh] lg:h-full overflow-y-auto p-8 lg:p-12">
          {project && (
            <div>
              {category && (
                <span className="text-[11px] tracking-[0.3em] uppercase text-[#FF3333]">
                  {category.name}
                </span>
              )}
              <h3
                data-testid="modal-title"
                className="font-display font-black text-3xl sm:text-4xl lg:text-5xl tracking-tighter leading-[1.02] mt-3"
              >
                {project.title}
              </h3>
              {project.short_description && (
                <p className="text-lg text-neutral-700 leading-relaxed mt-5">
                  {project.short_description}
                </p>
              )}
              <div className="h-px bg-[#E1E3E8] my-8" />
              <div className="grid grid-cols-2 gap-y-4 text-sm">
                {project.client && (
                  <>
                    <span className="text-[11px] tracking-[0.2em] uppercase text-neutral-500">Client</span>
                    <span className="font-medium">{project.client}</span>
                  </>
                )}
                {project.year && (
                  <>
                    <span className="text-[11px] tracking-[0.2em] uppercase text-neutral-500">Year</span>
                    <span className="font-medium">{project.year}</span>
                  </>
                )}
                {project.tools && project.tools.length > 0 && (
                  <>
                    <span className="text-[11px] tracking-[0.2em] uppercase text-neutral-500">Tools</span>
                    <span className="font-medium">{project.tools.join(", ")}</span>
                  </>
                )}
              </div>
              {project.description && (
                <>
                  <div className="h-px bg-[#E1E3E8] my-8" />
                  <p className="text-base text-neutral-700 leading-relaxed whitespace-pre-wrap">
                    {project.description}
                  </p>
                </>
              )}
              {project.external_link && (
                <a
                  href={project.external_link}
                  target="_blank"
                  rel="noreferrer"
                  data-testid="modal-external-link"
                  className="inline-flex items-center gap-2 mt-10 bg-[#0A0B10] text-white px-5 py-3 text-[11px] tracking-[0.2em] uppercase hover:bg-[#FF3333] transition-colors"
                >
                  View live project <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
