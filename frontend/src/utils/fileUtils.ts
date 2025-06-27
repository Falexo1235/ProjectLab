export function formatSize(size: number): string {
  if (size > 1024 * 1024) return (size / (1024 * 1024)).toFixed(1) + " MB"
  if (size > 1024) return (size / 1024).toFixed(1) + " KB"
  return size + " B"
}

export type FileType = "image" | "video" | "audio" | "docx" | "presentation" | "pdf" | "text" | "archive" | "other"
export function getFileType(mime: string): FileType {
  const [type, subtype] = mime.split("/")
  switch (type) {
    case "image": return "image"
    case "video": return "video"
    case "audio": return "audio"
    case "text": return "text"
    case "application": {
      if (subtype === "vnd.openxmlformats-officedocument.wordprocessingml.document") return "docx"
      if (["vnd.ms-powerpoint", "vnd.openxmlformats-officedocument.presentationml.presentation"].includes(subtype)) return "presentation"
      if (subtype === "pdf") return "pdf"
      if (["zip", "rar", "tar"].includes(subtype)) return "archive"
    }
    default: return "other"
  }
}

export function getFileTypeIcon(type: string): string {
  switch (type) {
    case "image": return "/src/assets/icons/image.png"
    case "document": return "/src/assets/icons/document.png"
    case "video": return "/src/assets/icons/video.png"
    case "audio": return "/src/assets/icons/audio.png"
    case "archive": return "/src/assets/icons/archive.png"
    default: return "/src/assets/icons/default.png"
  }
}

export function getStarIcon(isFavorite: boolean): string {
  return isFavorite ? "/src/assets/icons/star1.png" : "/src/assets/icons/star2.png"
}

export function formatDuration(seconds?: number): string {
  if (!seconds || isNaN(seconds)) return "—"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }
  return `${m}:${s.toString().padStart(2, "0")}`
} 