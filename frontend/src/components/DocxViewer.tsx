import { useEffect, useRef } from "react"
import { renderAsync } from "docx-preview"
import "./DocxViewer.css"

interface DocxViewerProps {
  fileUrl: string
}

export default function DocxViewer({ fileUrl }: DocxViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (viewerRef.current && fileUrl) {
      fetch(fileUrl)
        .then(response => response.blob())
        .then(blob => {
          if (viewerRef.current) {
            renderAsync(blob, viewerRef.current, undefined, {
              className: "docx",
              inWrapper: true,
              ignoreWidth: false,
              ignoreHeight: false,
              ignoreFonts: false,
              breakPages: true,
              experimental: true,
            })
          }
        })
        .catch(error => {
          console.error("Error rendering docx:", error)
        })
    }
  }, [fileUrl])

  return <div ref={viewerRef} className="docx-viewer-container"></div>
} 