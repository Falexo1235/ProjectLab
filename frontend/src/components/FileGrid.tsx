import { FileCard, type FileItem } from "./FileCard"
import "./FileGrid.css"

interface FileGridProps {
  files: FileItem[]
  onFileClick?: (file: FileItem) => void
  onToggleFavorite?: (fileId: string) => void
  emptyMessage?: string
}

export function FileGrid({ files, onFileClick, onToggleFavorite, emptyMessage = "Файлы не найдены" }: FileGridProps) {
  if (files.length === 0) {
    return (
      <div className="file-grid-empty">
          <img
              src= "/src/assets/icons/empty.png"
              className="file-grid-empty-icon"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg?height=16&width=16"
              }}
            />
        <h3 className="file-grid-empty-title">{emptyMessage}</h3>
        <p className="file-grid-empty-description">Попробуйте изменить параметры поиска или загрузите новые файлы</p>
      </div>
    )
  }

  return (
    <div className="file-grid">
      {files.map((file) => (
        <FileCard key={file.id} file={file} onClick={onFileClick} onToggleFavorite={onToggleFavorite} />
      ))}
    </div>
  )
}

export type { FileItem }
