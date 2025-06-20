import { useState, useRef, useEffect, type MouseEvent } from "react"
import "./FileCard.css"

export interface FileItem {
  id: string
  name: string
  type: "image" | "document" | "video" | "audio" | "archive" | "other"
  size: string
  modifiedDate: string
  isFavorite: boolean
  tags: string[]
  thumbnail?: string
  url?: string
  accessLevel?: "public" | "private"
  isEditable?: boolean
}

interface FileCardProps {
  file: FileItem
  onClick?: (file: FileItem) => void
  onToggleFavorite?: (fileId: string) => void
  onShare?: (fileId: string) => void
  onDownload?: (fileId: string) => void
  onCopyDownloadLink?: (fileId: string) => void
  onDelete?: (fileId: string) => void
  onAccessLevelChange?: (fileId: string, newLevel: "public" | "private") => void
}

export function FileCard({
  file,
  onClick,
  onToggleFavorite,
  onShare,
  onDownload,
  onCopyDownloadLink,
  onDelete,
  onAccessLevelChange,
}: FileCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const getFileTypeIcon = (type: string): string => {
    switch (type) {
      case "image":
        return "/src/assets/icons/image.png"
      case "document":
        return "/src/assets/icons/document.png"
      case "video":
        return "/src/assets/icons/video.png"
      case "audio":
        return "/src/assets/icons/audio.png"
      case "archive":
        return "/src/assets/icons/archive.png"
      default:
        return "/src/assets/icons/default.png"
    }
  }
  const getStarIcon = (isFavorite: boolean): string => {
    return isFavorite ? "/src/assets/icons/star1.png" : "/src/assets/icons/star2.png"
  }
  
  const getFileThumbnail = (file: FileItem): string => {
    if (file.thumbnail) {
      return file.thumbnail
    }
    return `/src/assets/placeholders/placeholder.svg`
  }

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleFavorite?.(file.id)
  }

  const handleCardClick = () => {
    onClick?.(file)
  }

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMenuOpen((prev) => !prev)
  }

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onShare?.(file.id)
    setIsMenuOpen(false)
  }

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDownload?.(file.id)
    setIsMenuOpen(false)
  }

  const handleCopyDownloadLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onCopyDownloadLink?.(file.id)
    setIsMenuOpen(false)
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(file.id)
    setIsMenuOpen(false)
  }

  const handleAccessChangeClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const newLevel = file.accessLevel === "public" ? "private" : "public"
    onAccessLevelChange?.(file.id, newLevel)
    setIsMenuOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [menuRef])

  return (
    <div className="file-card" onClick={handleCardClick}>
      <div className="file-thumbnail">
        <img
          src={getFileThumbnail(file) || "/placeholder.svg"}
          alt={file.name}
          className="file-thumbnail-image"
          onError={(e) => {
            e.currentTarget.src = "/placeholder.svg?height=120&width=120"
          }}
        />

        <div className="file-type-icon">
          <img
            src={getFileTypeIcon(file.type) || "/placeholder.svg"}
            alt={`${file.type} icon`}
            className="file-type-icon-img"
            onError={(e) => {
              e.currentTarget.src = "/placeholder.svg?height=24&width=24"
            }}
          />
        </div>
        <button
          className="file-favorite-button"
          onClick={handleFavoriteClick}
          aria-label={file.isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
        >
          <img
            src={getStarIcon(file.isFavorite) || "/placeholder.svg"}
            alt={file.isFavorite ? "Избранное" : "Не избранное"}
            className="star-icon"
            onError={(e) => {
              e.currentTarget.src = "/placeholder.svg?height=16&width=16"
            }}
          />
        </button>
      </div>

      <div className="file-info">
        <div className="file-header">
          <h3 className="file-name" title={file.name}>
            {file.name}
          </h3>
          <div className="file-actions-menu" ref={menuRef}>
            <button className="menu-toggle-button" onClick={handleMenuToggle}>
              •••
            </button>
            {isMenuOpen && (
              <div className="context-menu">
                <button onClick={handleDownloadClick}>Скачать</button>
                <button onClick={handleShareClick}>Поделиться</button>
                <button onClick={handleCopyDownloadLinkClick}>Ссылка для скачивания</button>
                <button onClick={handleAccessChangeClick}>
                  {file.accessLevel === "public" ? "Сделать приватным" : "Сделать публичным"}
                </button>
                <div className="menu-separator"></div>
                <button onClick={handleDeleteClick} className="delete-button">
                  Удалить
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="file-meta">
          <span>{file.size}</span>
          <span>{new Date(file.modifiedDate).toLocaleDateString("ru-RU")}</span>
        </div>

        {file.tags.length > 0 && (
          <div className="file-tags">
            {file.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="file-tag">
                {tag}
              </span>
            ))}
            {file.tags.length > 2 && <span className="file-tag file-tag-more">+{file.tags.length - 2}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
