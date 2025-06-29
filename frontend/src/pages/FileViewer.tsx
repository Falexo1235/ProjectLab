import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import ReactPlayer from "react-player"
import ImageViewer from "../components/ImageViewer"
import "./FileViewer.css"
import TextEditor from "../components/TextEditor"
import PDFViewer from "../components/PDFViewer"
import DocxViewer from "../components/DocxViewer"
import { getFile, downloadFile, deleteFile as apiDeleteFile, updateFileTags as apiUpdateFileTags, addToFavorites, removeFromFavorites, searchTags, createShareLink, deleteShareLink } from "../api/filesApi"
import React from "react"
import ConfirmDeleteModal from "../components/ConfirmDeleteModal"
import ShareModal from "../components/ShareModal"
import { EditFileModal } from "../components/EditFileModal"
import { formatSize, formatDuration, getFileType, getStarIcon } from "../utils/fileUtils"
import { getApiUrl } from "../config/api"

interface FileData {
  id: string
  name: string
  mime: string
  size: string
  modifiedDate: string
  isFavorite: boolean
  tags: string[]
  url: string
  preview?: string
  metadata?: {
    duration?: string
    resolution?: string
    dimensions?: { width: number; height: number }
    bitrate?: string
    format?: string
  }
  description?: string
}

interface FileViewerProps {
  isPublic?: boolean;
}

export default function FileViewer({ isPublic = false }: FileViewerProps) {
  const { id, token } = useParams<{ id?: string; token?: string }>()
  const navigate = useNavigate()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [file, setFile] = useState<FileData | undefined>(undefined)
  const [error, setError] = useState("")
  const [fileUrl, setFileUrl] = useState<string | undefined>(undefined)
  const [mediaInfo, setMediaInfo] = useState<{ width?: number; height?: number; duration?: number }>({})
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [editTags, setEditTags] = useState<string[]>(file?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [notificationText, setNotificationText] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (isPublic && !token) return;
    if (!isPublic && !id) return;
    const fetchFile = async () => {
      setError("")
      try {
        let f;
        if (isPublic) {
          const resp = await fetch(getApiUrl(`/p/${token}`));
          if (!resp.ok) throw new Error("Файл не найден или ссылка неактивна");
          f = await resp.json();
        } else {
          f = await getFile(id!);
        }
        const fileData: FileData = {
          id: f.id,
          name: f.name,
          mime: f.contentType,
          size: f.size > 1024 * 1024 ? (f.size / (1024 * 1024)).toFixed(2) + " MB" : f.size > 1024 ? (f.size / 1024).toFixed(2) + " KB" : f.size + " B",
          modifiedDate: f.updatedAt || f.createdAt,
          isFavorite: f.isFavorite || false,
          tags: f.tags || [],
          url: isPublic ? getApiUrl(`/p/${token}/download`) : getApiUrl(`/api/v1/Files/${f.id}/download`),
          description: f.description,
        }
        setFile(fileData)
      } catch {
        setFile(undefined)
        setError("Ошибка сети при загрузке файла.")
      }
    }
    fetchFile()
  }, [id, token, isPublic])

  useEffect(() => {
    if (!file) return
    let revoked = false
    setFileUrl(undefined)
    const fetchBlob = async () => {
      try {
        let blob;
        if (isPublic) {
          const resp = await fetch(file.url)
          if (!resp.ok) throw new Error()
          blob = await resp.blob()
        } else {
          blob = await downloadFile(file.url)
        }
        if (!revoked) setFileUrl(URL.createObjectURL(blob))
      } catch {
        if (!revoked) setFileUrl(undefined)
      }
    }
    fetchBlob()
    return () => {
      revoked = true
      if (fileUrl) URL.revokeObjectURL(fileUrl)
    }
  }, [file?.url])

  useEffect(() => {
    setEditTags(file?.tags || []);
  }, [file]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const getStarIcon = (isFavorite: boolean): string => {
    return isFavorite ? "/src/assets/icons/star1.png" : "/src/assets/icons/star2.png"
  }

  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [showNotification])

  const handleToggleFavorite = async () => {
    if (!file) return
    
    try {
      if (file.isFavorite) {
        await removeFromFavorites(file.id)
      } else {
        await addToFavorites(file.id)
      }
      
      setFile({ ...file, isFavorite: !file.isFavorite })
    } catch (e) {
      setError("Ошибка при изменении избранного")
    }
  }

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen((prev) => !prev);
  };

  const handleDelete = async () => {
    if (!file) return;
    setIsMenuOpen(false);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!file) return;
    setShowDeleteModal(false);
    try {
      await apiDeleteFile(file.id);
      navigate("/");
    } catch {
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleEditTags = () => {
    setIsTagModalOpen(true);
    setIsMenuOpen(false);
  };

  const handleEditFile = () => {
    setIsEditModalOpen(true);
    setIsMenuOpen(false);
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
  };

  const handleFileUpdated = (updatedFile: any) => {
    if (!file) return;
    
    setFile({
      ...file,
      name: updatedFile.name,
      description: updatedFile.description,
      modifiedDate: updatedFile.updatedAt || updatedFile.createdAt
    });
    
    setShowNotification(true);
    setNotificationText("Файл успешно обновлен");
  };

  const handleTagModalClose = () => {
    setIsTagModalOpen(false);
    setTagInput("");
  };

  const handleTagInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setTagInput(value);
    
    if (value.trim().length > 0) {
      setIsLoadingTags(true)
      try {
        const tags = await searchTags(value, 10)
        const filtered = tags.filter((tag: string) => !editTags.includes(tag))
        setTagSuggestions(filtered)
      } catch (e) {
        setTagSuggestions([])
      } finally {
        setIsLoadingTags(false)
      }
    } else {
      setTagSuggestions([])
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      if (!editTags.includes(tagInput.trim())) {
        setEditTags([...editTags, tagInput.trim()]);
      }
      setTagInput("");
      setTagSuggestions([]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setEditTags(editTags.filter(t => t !== tag));
  };

  const handleTagSuggestionClick = (tag: string) => {
    if (!editTags.includes(tag)) {
      setEditTags([...editTags, tag]);
    }
    setTagInput("");
    setTagSuggestions([]);
  };

  const handleSaveTags = async () => {
    if (!file) return;
    try {
      await apiUpdateFileTags(file.id, editTags);
      setFile({ ...file, tags: editTags });
      setIsTagModalOpen(false);
    } catch (e) {
      alert("Ошибка при сохранении тегов");
    }
  };

  const handleShare = async () => {
    setIsMenuOpen(false);
    setIsShareModalOpen(true);
  };

  const handleCreateShareLink = async (password?: string, expiresAt?: Date) => {
    if (!file) return { url: "" };
    
    try {
      const result = await createShareLink(file.id, password, expiresAt);
      setShowNotification(true);
      setNotificationText("Публичная ссылка скопирована!");
      return result;
    } catch (e) {
      setError("Ошибка при создании ссылки");
      throw e;
    }
  };

  const handleDeleteShareLink = async () => {
    if (!file) return;
    
    try {
      await deleteShareLink(file.id);
      setShowNotification(true);
      setNotificationText("Публичная ссылка удалена");
      setIsShareModalOpen(false);
    } catch (e) {
      setError("Ошибка при удалении ссылки");
    }
  };

  const handleShareClick = () => {
    if (isPublic) {
      navigator.clipboard.writeText(window.location.href.replace('/p/', '/pub/'))
        .then(() => {
          setNotificationText("Ссылка скопирована!");
          setShowNotification(true);
        })
        .catch(() => {
          setNotificationText("Не удалось скопировать ссылку");
          setShowNotification(true);
        });
    } else {
      handleShare();
    }
  };

  if (!file) {
    return (
      <div className="file-viewer-container">
        <div className="file-viewer-content">
          <div className="file-not-found">
            <img
              src="/src/assets/icons/empty.png"
              alt="Empty"
              className="file-empty-icon"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg?height=120&width=120"
              }}
            />
            <h1>Файл не найден</h1>
            <p>Файл с ID "{id}" не существует или был удален.</p>
            {!isPublic && (
            <button onClick={() => navigate("/")} className="back-button">
              Вернуться к списку файлов
            </button>
            )}
          </div>
        </div>
      </div>
    )
  }
  const type = getFileType(file.mime)
  const handleFullscreenClose = () => {
    setIsFullscreen(false)
  }

  const handleDownload = () => {
    if (!fileUrl || !file) return
    const link = document.createElement("a")
    link.href = fileUrl
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderFileContent = () => {
    if (!fileUrl) return <div className="unsupported-viewer"><p>Файл не загружен для предпросмотра.</p></div>
    switch (type) {
      case "image":
        return (
          <div className="image-viewer">
            <img
              src={fileUrl}
              alt={file.name}
              className="main-image"
              onClick={() => setIsFullscreen(true)}
              onLoad={e => {
                setMediaInfo({
                  width: e.currentTarget.naturalWidth,
                  height: e.currentTarget.naturalHeight
                })
              }}
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg?height=400&width=600"
              }}
            />
          </div>
        )

      case "video":
        return (
          <div className="video-viewer">
            <video
              src={fileUrl}
              controls
              width="100%"
              height="100%"
              style={{ background: "black" }}
              onLoadedMetadata={e => {
                setMediaInfo({
                  width: e.currentTarget.videoWidth,
                  height: e.currentTarget.videoHeight,
                  duration: e.currentTarget.duration
                })
              }}
            />
          </div>
        )

      case "audio":
        return (
          <div className="audio-viewer">
            <div className="audio-placeholder">
              <img
                src="/src/assets/icons/audio.png"
                alt="Audio"
                className="audio-icon"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg?height=120&width=120"
                }}
              />
              <h3>{file.name}</h3>
            </div>
            <audio
              src={fileUrl}
              controls
              onLoadedMetadata={e => {
                setMediaInfo({
                  duration: e.currentTarget.duration
                })
              }}
            />
          </div>
        )
      case "docx":
        return (
          <div className="document-viewer">
            <DocxViewer fileUrl={fileUrl} />
          </div>
        );
      case "pdf": 
        return (
          <div className="pdf-viewer">
            <PDFViewer src={fileUrl} fileName={file.name} onDownload={handleDownload} />
          </div>
        )
      case "text":
        return(
          <div className="text-viewer">
            <TextEditor 
              fileUrl={fileUrl}
              fileName={file.name}
            />
          </div>
        )
      default:
        return (
          <div className="unsupported-viewer">
            <img
              src="/src/assets/icons/warning.png"
              alt="Warning"
              className="file-icon"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg?height=120&width=120"
              }}
            />
            <h3>Предварительный просмотр недоступен</h3>
            <p>Этот тип файла не поддерживается для просмотра в браузере.</p>
          </div>
        )
    }
  }

  return (
    <div className="file-viewer-container">
      {showNotification && (
        <div className="copy-notification">
          <div className="notification-content">
            <span className="notification-icon">✓</span>
            <span className="notification-text">{notificationText}</span>
          </div>
        </div>
      )}
      <div className="file-viewer-content">
        <div className="file-viewer-header">
          {!isPublic && (
          <button onClick={() => navigate("/")} className="back-button">
            ← Назад к файлам
          </button>
          )}
          <div className="file-actions">
            <button onClick={handleShareClick} className="action-button share-button">
              <img
                src="/src/assets/icons/share.png"
                alt="Share"
                className="action-icon"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg?height=20&width=20"
                }}
              />
              Поделиться
            </button>
            {isPublic && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(file.url)
                    .then(() => {
                      setNotificationText("Прямая ссылка скопирована!");
                      setShowNotification(true);
                    })
                    .catch(() => {
                      setNotificationText("Не удалось скопировать ссылку");
                      setShowNotification(true);
                    });
                }}
                className="action-button share-button"
              >
                <img
                  src="/src/assets/icons/link.png"
                  alt="Direct link"
                  className="action-icon"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg?height=20&width=20"
                  }}
                />
                Прямая ссылка
              </button>
            )}
            <button onClick={handleDownload} className="action-button download-button">
              <img
                src="/src/assets/icons/download.png"
                alt="Download"
                className="action-icon"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg?height=16&width=16"
                }}
              />
              Скачать
            </button>
          </div>
        </div>
        <div className="file-content">{renderFileContent()}</div>
        <div className="file-info-panel">
          <div className="file-details">
            <div className="file-title-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <h2 className="file-title">{file.name}</h2>
                {!isPublic && (
                  <button className="viewer-favorite-button" onClick={handleToggleFavorite}>
                    <img
                      src={getStarIcon(file.isFavorite)}
                      alt="Favorite"
                      className="viewer-star-icon"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg?height=24&width=24"
                      }}
                    />
                  </button>
                )}
              </div>
              <div className="file-actions-menu" ref={menuRef} style={{ position: "relative" }}>
                {!isPublic && (
                  <>
                <button className="menu-toggle-button" onClick={handleMenuToggle}>
                  •••
                </button>
                {isMenuOpen && (
                  <div className="context-menu" style={{ right: 0, left: "auto", minWidth: 160 }}>
                    <button onClick={handleEditFile}>Редактировать</button>
                    <button onClick={handleEditTags}>Изменить теги</button>
                    <div className="menu-separator"></div>
                    <button onClick={handleDelete} className="delete-button">Удалить</button>
                  </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="file-meta">
              <span className="file-size">{file.size}</span>
              <span className="file-date">Изменен: {new Date(file.modifiedDate).toLocaleDateString("ru-RU")}</span>
            </div>
            {file.description && (
              <div className="file-description">
                <span>{file.description}</span>
              </div>
            )}
            {file.tags.length > 0 && (
              <div className="file-tags">
                <h3>Теги:</h3>
                <div className="tags-list">
                  {file.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {(type === "video" || type === "image" || type === "audio") && (
              <div className="file-metadata">
                <h3>Информация о файле:</h3>
                <div className="metadata-list">
                  {type === "video" && (
                    <>
                      <div className="metadata-item">
                        <span className="metadata-label">Длительность:</span>
                        <span className="metadata-value">{formatDuration(mediaInfo.duration)}</span>
                      </div>
                      <div className="metadata-item">
                        <span className="metadata-label">Размеры:</span>
                        <span className="metadata-value">{mediaInfo.width && mediaInfo.height ? `${mediaInfo.width} × ${mediaInfo.height}` : "—"}</span>
                      </div>
                    </>
                  )}
                  {type === "image" && (
                    <div className="metadata-item">
                      <span className="metadata-label">Размеры:</span>
                      <span className="metadata-value">{mediaInfo.width && mediaInfo.height ? `${mediaInfo.width} × ${mediaInfo.height}` : "—"}</span>
                    </div>
                  )}
                  {type === "audio" && (
                    <div className="metadata-item">
                      <span className="metadata-label">Длительность:</span>
                      <span className="metadata-value">{formatDuration(mediaInfo.duration)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {isFullscreen && type === "image" && (
        <div className="fullscreen-overlay" onClick={handleFullscreenClose}>
          <button className="fullscreen-close" onClick={handleFullscreenClose}>
            X
          </button>
          <div className="fullscreen-content">
            <ImageViewer
              src={fileUrl || "/placeholder.svg"}
              alt={file.name}
              onClose={handleFullscreenClose}
            />
          </div>
        </div>
      )}
      {isTagModalOpen && (
        <div className="modal-overlay" onClick={handleTagModalClose}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ minWidth: 320, maxWidth: 400 }}>
            <h2>Редактировать теги</h2>
            <div className="tags-list" style={{ marginBottom: 12 }}>
              {editTags.map(tag => (
                <span key={tag} className="tag" style={{ display: "inline-flex", alignItems: "center", marginRight: 6 }}>
                  {tag}
                  <button style={{ marginLeft: 4, background: "none", border: "none", cursor: "pointer", color: "#e74c3c" }} onClick={() => handleRemoveTag(tag)} title="Удалить тег">×</button>
                </span>
              ))}
            </div>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Введите тег и нажмите Enter"
                className="upload-input"
                style={{ marginBottom: 8, width: "100%" }}
              />
              {tagSuggestions.length > 0 && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "var(--bg-primary, #fff)",
                  border: "1px solid var(--border-secondary, #d0d0d0)",
                  borderRadius: 6,
                  zIndex: 10,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  marginTop: 2
                }}>
                  {tagSuggestions.map(sug => (
                    <div
                      key={sug}
                      style={{ padding: "8px 12px", cursor: "pointer" }}
                      onClick={() => handleTagSuggestionClick(sug)}
                    >
                      {sug}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button className="upload-cancel" onClick={handleTagModalClose}>Отмена</button>
              <button className="upload-submit" onClick={handleSaveTags}>Сохранить</button>
            </div>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <ConfirmDeleteModal
          open={showDeleteModal}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          fileName={file?.name || ""}
        />
      )}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        fileId={file.id}
        fileName={file.name}
        onCreateLink={handleCreateShareLink}
        onDeleteLink={handleDeleteShareLink}
      />
      {file && (
        <EditFileModal
          isOpen={isEditModalOpen}
          onClose={handleEditModalClose}
          file={{
            id: file.id,
            name: file.name,
            description: file.description
          }}
          onFileUpdated={handleFileUpdated}
        />
      )}
    </div>
  )
}
