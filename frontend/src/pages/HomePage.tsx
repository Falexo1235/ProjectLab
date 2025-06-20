import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { FileGrid, type FileItem } from "../components/FileGrid"
import "../App.css"

interface Tag {
  id: string
  name: string
}

// тестовые данные
const exampleFiles: FileItem[] = [
  {
    id: "1",
    name: "Презентация.pptx",
    type: "document",
    size: "2.4 MB",
    modifiedDate: "2024-01-15",
    isFavorite: true,
    tags: ["работа", "презентация", "проект"],
    accessLevel: "private",
  },
  {
    id: "2",
    name: "Фото.jpg",
    type: "image",
    size: "5.2 MB",
    modifiedDate: "2024-01-10",
    isFavorite: false,
    tags: ["отпуск", "фото", "личное"],
    thumbnail: "/src/assets/example/previews/photo.jpg",
    accessLevel: "public",
  },
  {
    id: "3",
    name: "Видео.mp4",
    type: "video",
    size: "45.8 MB",
    modifiedDate: "2024-01-08",
    isFavorite: true,
    tags: ["обучение", "видео"],
    thumbnail: "/src/assets/example/previews/video.jpg",
    accessLevel: "private",
  },
  {
    id: "4",
    name: "Архив.zip",
    type: "archive",
    size: "12.1 MB",
    modifiedDate: "2024-01-05",
    isFavorite: false,
    tags: ["архив", "документы"],
    accessLevel: "private",
  },
  {
    id: "5",
    name: "Музыка.mp3",
    type: "audio",
    size: "8.7 MB",
    modifiedDate: "2024-01-03",
    isFavorite: false,
    tags: ["музыка", "аудио"],
    thumbnail: "/src/assets/example/previews/music.jpg",
    accessLevel: "public",
  },
  {
    id: "6",
    name: "Документ.pdf",
    type: "document",
    size: "1.8 MB",
    modifiedDate: "2024-01-01",
    isFavorite: true,
    tags: ["работа", "отчёт"],
    thumbnail: "/src/assets/example/previews/report.jpg",
    accessLevel: "private",
  },
    {
    id: "7",
    name: "Гифка.gif",
    type: "image",
    size: "1.8 MB",
    modifiedDate: "2024-01-01",
    isFavorite: true,
    tags: ["фото", "видео"],
    thumbnail: "/src/assets/example/files/gif-file.gif",
    accessLevel: "public",
  },
  {
    id: "8",
    name: "Видео2.mp4",
    type: "video",
    size: "45.8 MB",
    modifiedDate: "2024-01-08",
    isFavorite: true,
    tags: ["обучение", "видео"],
    thumbnail: "/src/assets/example/previews/video2.jpg",
    accessLevel: "public",
  },
  {
    id: "9",
    name: "example.py",
    type: "document",
    size: "45.8 MB",
    modifiedDate: "2024-01-08",
    isFavorite: true,
    tags: ["документы"],
    thumbnail: "/src/assets/example/previews/text.jpg",
    accessLevel: "private",
    isEditable: false,
  },
  {
    id: "10",
    name: "Вектор.svg",
    type: "image",
    size: "5.2 MB",
    modifiedDate: "2024-01-10",
    isFavorite: false,
    tags: ["фото"],
    thumbnail: "/src/assets/example/previews/vector.jpg",
    accessLevel: "public",
  },
  {
    id: "11",
    name: "Пиксель-арт.webp",
    type: "image",
    size: "5.2 MB",
    modifiedDate: "2024-01-10",
    isFavorite: false,
    tags: ["фото"],
    thumbnail: "/src/assets/example/files/pixels.webp",
    accessLevel: "public",
  },
  {
    id: "12",
    name: "Документ.docx",
    type: "document",
    size: "15 KB",
    modifiedDate: "2024-01-25",
    isFavorite: false,
    tags: ["документ", "работа"],
    thumbnail: "/src/assets/example/previews/text.jpg",
    accessLevel: "private",
  }
]

const exampleTags: Tag[] = [
  { id: "1", name: "работа" },
  { id: "2", name: "личное" },
  { id: "3", name: "фото" },
  { id: "4", name: "видео" },
  { id: "5", name: "документы" },
  { id: "6", name: "проект" },
  { id: "7", name: "презентация" },
  { id: "8", name: "отпуск" },
  { id: "9", name: "обучение" },
  { id: "10", name: "архив" },
  { id: "11", name: "музыка" },
  { id: "12", name: "аудио" },
  { id: "13", name: "отчёт" },
]

function App() {
  const [files, setFiles] = useState<FileItem[]>(exampleFiles)
  const [searchQuery, setSearchQuery] = useState("")
  const [showFavorites, setShowFavorites] = useState(false)
  const [fileType, setFileType] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [tagSearch, setTagSearch] = useState("")
  const [includedTags, setIncludedTags] = useState<string[]>([])
  const [excludedTags, setExcludedTags] = useState<string[]>([])
  const navigate = useNavigate()

  const filteredTags = exampleTags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(tagSearch.toLowerCase()) &&
      !includedTags.includes(tag.name) &&
      !excludedTags.includes(tag.name),
  )

  const addIncludedTag = (tagName: string) => {
    setIncludedTags([...includedTags, tagName])
  }

  const addExcludedTag = (tagName: string) => {
    setExcludedTags([...excludedTags, tagName])
  }

  const removeIncludedTag = (tagName: string) => {
    setIncludedTags(includedTags.filter((tag) => tag !== tagName))
  }

  const removeExcludedTag = (tagName: string) => {
    setExcludedTags(excludedTags.filter((tag) => tag !== tagName))
  }

  const handleToggleFavorite = (fileId: string) => {
    setFiles((prevFiles) =>
      prevFiles.map((file) => (file.id === fileId ? { ...file, isFavorite: !file.isFavorite } : file)),
    )
  }

const handleFileClick = (file: FileItem) => {
    //заменить на нормальную ссылку при добавлении апи
    navigate(`/example/${file.id}`)
  }

  const handleUploadClick = () => {
    console.log("Загрузка файла")
  }

  return (
    <div className="app-container">
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
          <div className="search-row">
            <div className="search-input-container">
              <input
                type="text"
                placeholder="Поиск файлов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="favorites-container">
              <label className="favorites-label">
                <input type="checkbox" checked={showFavorites} onChange={(e) => setShowFavorites(e.target.checked)} />
                <img
                  src="/src/assets/icons/star1.png"
                  alt="Избранные"
                  className="favorites-star-icon"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg?height=16&width=16"
                  }}
                />
                Избранные
              </label>
            </div>
          </div>

          <div className="separator"></div>

          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">Тип файла</label>
              <select value={fileType} onChange={(e) => setFileType(e.target.value)} className="filter-select">
                <option value="all">Все типы</option>
                <option value="image">Изображения</option>
                <option value="document">Документы</option>
                <option value="video">Видео</option>
                <option value="audio">Аудио</option>
                <option value="archive">Архивы</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Дата изменения</label>
              <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="filter-select">
                <option value="all">Любая дата</option>
                <option value="today">Сегодня</option>
                <option value="week">На этой неделе</option>
                <option value="month">В этом месяце</option>
                <option value="year">В этом году</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Сортировка</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
                <option value="name">По имени</option>
                <option value="date">По дате</option>
                <option value="size">По размеру</option>
                <option value="type">По типу</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Поиск по тегам</label>
              <input
                type="text"
                placeholder="Введите тег..."
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                className="filter-input"
              />
            </div>
          </div>

          {tagSearch && filteredTags.length > 0 && (
            <div className="tags-found">
              <div className="tags-found-title">Найденные теги:</div>
              <div className="tags-found-list">
                {filteredTags.map((tag) => (
                  <div key={tag.id} className="tag-item">
                    <span className="tag-name" onClick={() => addIncludedTag(tag.name)}>
                      {tag.name}
                    </span>
                    <button className="tag-button tag-button-add" onClick={() => addIncludedTag(tag.name)}>
                      +
                    </button>
                    <button className="tag-button tag-button-exclude" onClick={() => addExcludedTag(tag.name)}>
                      -
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(includedTags.length > 0 || excludedTags.length > 0) && (
            <div className="active-tags">
              {includedTags.length > 0 && (
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
              )}
              {excludedTags.length > 0 && (
                <div className="active-tags-section">
                  <div className="active-tags-title active-tags-title-excluded">Исключенные теги:</div>
                  <div className="active-tags-list">
                    {excludedTags.map((tag) => (
                      <span key={tag} className="active-tag active-tag-excluded">
                        {tag}
                        <button className="active-tag-remove" onClick={() => removeExcludedTag(tag)}>
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <FileGrid
          files={files}
          onFileClick={handleFileClick}
          onToggleFavorite={handleToggleFavorite}
          emptyMessage="Файлы не найдены"
        />
    </div>
  )
}

export default App
