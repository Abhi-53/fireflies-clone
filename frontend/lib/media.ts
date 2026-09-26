const API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN || "http://localhost:8000";

export function resolveMediaUrl(url?: string | null): string | null {
  if (!url) {
    return "/sample-media/sample-meeting-audio.wav";
  }
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) {
    return url;
  }
  if (url.includes("sample-media")) {
    return "/sample-media/sample-meeting-audio.wav";
  }
  return `${API_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
}
