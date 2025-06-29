import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { FileGrid, type FileItem } from "../components/FileGrid"
import "../App.css"
import "./HomePage.css"
import FileUploadModal from "../components/FileUploadModal"
import { searchFiles, deleteFile as apiDeleteFile, addToFavorites, removeFromFavorites, searchTags, updateFileMetadata } from "../api/filesApi"
import ConfirmDeleteModal from "../components/ConfirmDeleteModal"
import ShareModal from "../components/ShareModal"
import { EditFileModal } from "../components/EditFileModal"
import { formatSize, getFileType } from "../utils/fileUtils"
import { getApiUrl } from "../config/api"

function App() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [tagSearch, setTagSearch] = useState("")
  const [includedTags, setIncludedTags] = useState<string[]>([])
  const [showNotification, setShowNotification] = useState(false)
  const [notificationText, setNotificationText] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null)
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([])
  const [isLoadingTags, setIsLoadingTags] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [selectedFileForShare, setSelectedFileForShare] = useState<FileItem | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedFileForEdit, setSelectedFileForEdit] = useState<FileItem | null>(null)

  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [showNotification])

  const fetchFiles = async () => {
    setError("")
    try {
      const data = await searchFiles({ searchTerm: "", tags: [], fileType: "all" });
      const files: FileItem[] = data.map((f: any) => ({
        id: f.id,
        name: f.name,
        type: getFileType(f.contentType),
        size: formatSize(f.size),
        modifiedDate: f.updatedAt || f.createdAt,
        isFavorite: f.isFavorite || false,
        tags: f.tags || [],
        url: `http://localhost:5107/api/v1/Files/${f.id}/download`,
        thumbnail: `http://localhost:5107/api/v1/Thumbnail/${f.id}`,
      }))
      setFiles(files)
    } catch (e) {
      setError("Ошибка сети при загрузке файлов.")
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  const handleTagSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setTagSearch(value)
    
    if (value.trim().length > 0) {
      setIsLoadingTags(true)
      try {
        const tags = await searchTags(value, 10)
        const filtered = tags.filter((tag: string) => !includedTags.includes(tag))
        setTagSuggestions(filtered)
      } catch (e) {
        setTagSuggestions([])
      } finally {
        setIsLoadingTags(false)
      }
    } else {
      setTagSuggestions([])
    }
  }

  const addIncludedTag = (tagName: string) => {
    if (!includedTags.includes(tagName)) {
      setIncludedTags([...includedTags, tagName])
    }
    setTagSearch("")
    setTagSuggestions([])
  }

  const removeIncludedTag = (tagName: string) => {
    setIncludedTags(includedTags.filter((tag) => tag !== tagName))
  }

  const handleToggleFavorite = async (fileId: string) => {
    const file = files.find(f => f.id === fileId)
    if (!file) return
    
    try {
      if (file.isFavorite) {
        await removeFromFavorites(fileId)
      } else {
        await addToFavorites(fileId)
      }
      
      setFiles((prevFiles) =>
        prevFiles.map((f) => (f.id === fileId ? { ...f, isFavorite: !f.isFavorite } : f)),
      )
    } catch (e) {
      setError("Ошибка при изменении избранного")
    }
  }

  const handleShare = (fileId: string) => {
    const file = files.find(f => f.id === fileId)
    if (file) {
      setSelectedFileForShare(file)
      setIsShareModalOpen(true)
    }
  }

  const handleEdit = (fileId: string) => {
    const file = files.find(f => f.id === fileId)
    if (file) {
      setSelectedFileForEdit(file)
      setIsEditModalOpen(true)
    }
  }

  const handleEditModalClose = () => {
    setIsEditModalOpen(false)
    setSelectedFileForEdit(null)
  }

  const handleFileUpdated = (updatedFile: any) => {
    if (!selectedFileForEdit) return;
    
    setFiles(files.map(f => 
      f.id === selectedFileForEdit.id 
        ? { 
            ...f, 
            name: updatedFile.name,
            modifiedDate: updatedFile.updatedAt || updatedFile.createdAt
          }
        : f
    ))
    
    setShowNotification(true)
    setNotificationText("Файл успешно обновлен")
    setIsEditModalOpen(false)
    setSelectedFileForEdit(null)
  }

  const handleCopyDirectLink = (fileId: string) => {
    const directUrl = `${window.location.origin}/file/${fileId}`
    navigator.clipboard.writeText(directUrl)
    setShowNotification(true)
    setNotificationText("Прямая ссылка скопирована!")
  }

  const handleCreateShareLink = async (password?: string, expiresAt?: Date) => {
    if (!selectedFileForShare) return { url: "" };
    
    try {
      const mockUrl = `/pub/mock-token-${Date.now()}`
      setShowNotification(true)
      setNotificationText("Публичная ссылка скопирована!")
      return { url: mockUrl };
    } catch (e) {
      setError("Ошибка при создании ссылки");
      throw e;
    }
  }

  const handleDeleteShareLink = async () => {
    if (!selectedFileForShare) return;
    
    try {
      setShowNotification(true)
      setNotificationText("Публичная ссылка удалена");
    } catch (e) {
      setError("Ошибка при удалении ссылки");
    }
  }

  const handleDownload = (fileId: string) => {
    const file = files.find((f) => f.id === fileId)
    if (file && file.url) {
      const link = document.createElement("a")
      link.href = file.url
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleDelete = async (fileId: string) => {
    setDeleteFileId(fileId)
  }

  const confirmDelete = async () => {
    if (!deleteFileId) return
    try {
      await apiDeleteFile(deleteFileId)
      await handleSearch()
    } catch {
      setError("Не удалось удалить файл. Попробуйте позже.")
    } finally {
      setDeleteFileId(null)
    }
  }

  const handleFileClick = (file: FileItem) => {
    navigate(`/file/${file.id}`)
  }

  const handleUploadSuccess = () => {
    window.location.reload()
  }

  const handleUploadClick = () => {
    setIsUploadOpen(true)
  }

  const handleSearch = async () => {
    setError("")
    setIsSearching(true)
    try {
      const data = await searchFiles({ 
        searchTerm: searchQuery.trim(), 
        tags: includedTags,
        fileType: showFavoritesOnly ? "favorites" : "all"
      });
      const files: FileItem[] = data.map((f: any) => ({
        id: f.id,
        name: f.name,
        type: getFileType(f.contentType),
        size: formatSize(f.size),
        modifiedDate: f.updatedAt || f.createdAt,
        isFavorite: f.isFavorite || false,
        tags: f.tags || [],
        url: getApiUrl(`/api/v1/Files/${f.id}/download`),
        thumbnail: getApiUrl(`/api/v1/Thumbnail/${f.id}`),
      }))
      setFiles(files)
    } catch (e) {
      setError("Ошибка сети при поиске файлов.")
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="app-container">
      <FileUploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} onUploadSuccess={handleUploadSuccess} />
      {error && (
        <div className="copy-notification">
          <div className="notification-content">
            <span className="notification-icon">!</span>
            <span className="notification-text">{error}</span>
          </div>
        </div>
      )}
      {showNotification && (
        <div className="copy-notification">
          <div className="notification-content">
            <span className="notification-icon">✓</span>
            <span className="notification-text">{notificationText}</span>
          </div>
        </div>
      )}
      <div className="app-content">
        <div className="page-header">
          <div className="page-header-content">
            <div className="page-title-container">
              <h1 className="page-title">Booble Drive</h1>
              <p className="page-subtitle">Личный файловый обменник</p>
            </div>
            <button className="upload-button" onClick={handleUploadClick}>
              <img
                src="/src/assets/icons/upload.png"
                alt="Upload"
                className="upload-icon"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg?height=18&width=18"
                }}
              />
              <span className="upload-text">Загрузить</span>
            </button>
          </div>
        </div>

        <div className="search-panel">
          <div className="search-row" style={{ display: 'flex', alignItems: 'center' }}>
            <div className="search-input-container" style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                placeholder="Поиск файлов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") handleSearch()
                }}
                className="search-input"
              />
              <button
                type="button"
                className="search-input-button"
                onClick={handleSearch}
                tabIndex={-1}
                aria-label="Поиск"
              >
                <img
                  src="/src/assets/icons/search.png"
                  alt="Поиск"
                  className="search-input-icon"
                />
              </button>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', marginLeft: 16, cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={showFavoritesOnly}
                onChange={e => setShowFavoritesOnly(e.target.checked)}
                style={{ marginRight: 6 }}
              />
              <img
                src="/src/assets/icons/star1.png"
                alt="Избранные"
                style={{ width: 20, height: 20, verticalAlign: 'middle' }}
                onError={e => { e.currentTarget.src = "/placeholder.svg?height=20&width=20" }}
              />
              <span style={{ marginLeft: 4 }}>Избранные</span>
            </label>
          </div>

          <div className="separator"></div>

          <div className="filters-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="filter-group" style={{ width: '100%' }}>
              <label className="filter-label">Поиск по тегам</label>
              <input
                type="text"
                placeholder="Введите тег..."
                value={tagSearch}
                onChange={handleTagSearchChange}
                className="filter-input"
              />
            </div>
          </div>

          {tagSearch && tagSuggestions.length > 0 && (
            <div className="tags-found">
              <div className="tags-found-title">Найденные теги:</div>
              <div className="tags-found-list">
                {tagSuggestions.map((tag) => (
                  <div key={tag} className="tag-item">
                    <span className="tag-name" onClick={() => addIncludedTag(tag)}>
                      {tag}
                    </span>
                    <button className="tag-button tag-button-add" onClick={() => addIncludedTag(tag)}>
                      +
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(includedTags.length > 0) && (
            <div className="active-tags">
              <div className="active-tags-section">
                <div className="active-tags-title active-tags-title-included">Включенные теги:</div>
                <div className="active-tags-list">
                  {includedTags.map((tag) => (
                    <span key={tag} className="active-tag active-tag-included">
                      {tag}
                      <button className="active-tag-remove" onClick={() => removeIncludedTag(tag)}>
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <FileGrid
        files={files}
        onFileClick={handleFileClick}
        onToggleFavorite={handleToggleFavorite}
        onShare={handleShare}
        onEdit={handleEdit}
        onDownload={handleDownload}
        onCopyDownloadLink={handleCopyDirectLink}
        onDelete={handleDelete}
        emptyMessage="Файлы не найдены"
      />
      <ConfirmDeleteModal
        open={deleteFileId !== null}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteFileId(null)}
        fileName={files.find(f => f.id === deleteFileId)?.name || ""}
      />
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false)
          setSelectedFileForShare(null)
        }}
        fileId={selectedFileForShare?.id || ""}
        fileName={selectedFileForShare?.name || ""}
        onCreateLink={handleCreateShareLink}
        onDeleteLink={handleDeleteShareLink}
      />
      {selectedFileForEdit && (
        <EditFileModal
          isOpen={isEditModalOpen}
          onClose={handleEditModalClose}
          file={{
            id: selectedFileForEdit.id,
            name: selectedFileForEdit.name,
            description: ""
          }}
          onFileUpdated={handleFileUpdated}
        />
      )}
    </div>
  )
}

export default App
