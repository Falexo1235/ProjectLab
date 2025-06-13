import { useState, useCallback, useEffect } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import "./PDFViewer.css"

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString()

interface PDFViewerProps {
  src: string
  fileName: string
  onDownload?: () => void
}

export default function PDFViewer({ src }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState<string>(pageNumber.toString())

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoading(false)
    setError(null)
    setInputValue("1")
  }, [])

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error("PDF load error:", error)
    setError("Не удалось загрузить PDF файл")
    setLoading(false)
  }, [])

  const goToPrevPage = useCallback(() => {
    setPageNumber((prev) => Math.max(1, prev - 1))
  }, [])

  const goToNextPage = useCallback(() => {
    setPageNumber((prev) => Math.min(numPages, prev + 1))
  }, [numPages])

  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(3.0, prev + 0.2))
  }, [])

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(0.5, prev - 0.2))
  }, [])

  const resetZoom = useCallback(() => {
    setScale(1.0)
  }, [])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault()
          goToPrevPage()
          break
        case "ArrowRight":
          e.preventDefault()
          goToNextPage()
          break
        case "+":
        case "=":
          e.preventDefault()
          zoomIn()
          break
        case "-":
        case "_":
          e.preventDefault()
          zoomOut()
          break
        case "0":
          e.preventDefault()
          resetZoom()
          break
      }
    },
    [goToPrevPage, goToNextPage, zoomIn, zoomOut, resetZoom],
  )

  const handlePageInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }, [])

  const handlePageInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            const newPage = parseInt(inputValue)
            if (!isNaN(newPage) && newPage >=1 && newPage <= numPages) {
                setPageNumber(newPage)
            } else
            setInputValue(pageNumber.toString())
        }
    }, [inputValue, numPages, pageNumber])

  useEffect(() => {
    setInputValue(pageNumber.toString())
  }, [pageNumber])

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  if (error) {
    return (
      <div className="pdf-viewer-error">
        <div className="error-content">
          <h3>Ошибка загрузки PDF</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Попробовать снова
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="pdf-viewer-container">
      <div className="pdf-toolbar">
        <div className="pdf-toolbar-section">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="pdf-button"
            title="Предыдущая страница"
          >
            ←
          </button>

          <div className="page-info">
            <input
              min="1"
              max={numPages}
              value={inputValue}
              onChange={handlePageInputChange}
              onKeyDown={handlePageInputKeyDown}
              className="page-input"
            />
            <span className="page-total">из {numPages}</span>
          </div>

          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="pdf-button"
            title="Следующая страница"
          >
            →
          </button>
        </div>

        <div className="pdf-toolbar-section">
          <button onClick={zoomOut} disabled={scale <= 0.5} className="pdf-button" title="Уменьшить (-)">
            -
          </button>

          <span className="zoom-level" onClick={resetZoom} title="Сбросить масштаб (0)">
            {Math.round(scale * 100)}%
          </span>

          <button onClick={zoomIn} disabled={scale >= 3.0} className="pdf-button" title="Увеличить (+)">
            +
          </button>
        </div>
      </div>

      <div className="pdf-content">
        {loading && (
          <div className="pdf-loading">
            <div className="loading-spinner"></div>
            <p>Загрузка PDF...</p>
          </div>
        )}

        <Document
          file={src}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading=""
          className="pdf-document"
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            loading=""
            className="pdf-page"
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      </div>
    </div>
  )
}