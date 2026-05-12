// Utilities to normalize Google Drive sharing links into embeddable URLs.

export function extractDriveId(url = "") {
  if (!url) return null;
  // patterns: /file/d/<id>/, ?id=<id>, /d/<id>/
  const m1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]{10,})/);
  if (m1) return m1[1];
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (m2) return m2[1];
  const m3 = url.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
  if (m3) return m3[1];
  return null;
}

export function toDriveImage(url = "") {
  const id = extractDriveId(url);
  if (!id) return url;
  return `https://drive.google.com/thumbnail?id=${id}&sz=w2000`;
}

export function toDriveVideoEmbed(url = "") {
  const id = extractDriveId(url);
  if (!id) return url;
  return `https://drive.google.com/file/d/${id}/preview`;
}

export function isBehanceUrl(url = "") {
  return /behance\.net/i.test(url);
}

export function toBehanceEmbed(url = "") {
  // Accepts behance.net/gallery/<id>/<slug> or /embed/project/<id>
  if (!url) return "";
  if (/\/embed\/project\//.test(url)) return url;
  const m = url.match(/behance\.net\/gallery\/(\d+)/i);
  if (m) return `https://www.behance.net/embed/project/${m[1]}?ilo0=1`;
  return url;
}

// Extract src from a full <iframe ...> embed snippet
export function extractIframeSrc(snippet = "") {
  if (!snippet) return "";
  const m = snippet.match(/src=["']([^"']+)["']/i);
  return m ? m[1] : "";
}
