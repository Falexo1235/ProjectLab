import { useState } from 'react'
import './App.css'

function App() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showFavorites, setShowFavorites] = useState(false)
  const [fileType, setFileType] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [tagSearch, setTagSearch] = useState("")

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
                <input type="checkbox" checked={showFavorites} onChange={(e) => setShowFavorites(e.target.checked)} />⭐
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
        </div>
      </div>
    </div>
  )
}

export default App
