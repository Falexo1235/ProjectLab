import { useState, useRef, useEffect, useCallback } from "react"
import "./ImageViewer.css"

interface ImageViewerProps {
  src: string
  alt: string
  onClose?: () => void
}

interface Transform {
  scale: number
  translateX: number
  translateY: number
}

export default function ImageViewer({ src, alt, onClose }: ImageViewerProps) {
  const [transform, setTransform] = useState<Transform>({
    scale: 1,
    translateX: 0,
    translateY: 0,
  })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, translateX: 0, translateY: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 })
  const [initialScale, setInitialScale] = useState(1)

  const containerRef = useRef<HTMLDivElement>(null)
  const moveContainerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const MIN_SCALE = 0.01
  const MAX_SCALE = 10
  const ZOOM_STEP = 0.2

  const calculateInitialScale = useCallback(() => {
    if (!containerRef.current || !imageDimensions.width || !imageDimensions.height) return 1

    const container = containerRef.current.getBoundingClientRect()
    const containerWidth = container.width - 40
    const containerHeight = container.height - 40

    const scaleX = containerWidth / imageDimensions.width
    const scaleY = containerHeight / imageDimensions.height

    return Math.min(scaleX, scaleY, 1)
  }, [imageDimensions])

  const updateContainerDimensions = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setContainerDimensions({ width: rect.width, height: rect.height })
    }
  }, [])

  const resetTransform = useCallback(() => {
    setTransform({
      scale: initialScale,
      translateX: 0,
      translateY: 0,
    })
  }, [initialScale])

  const constrainTranslation = useCallback(
    (scale: number, translateX: number, translateY: number) => {
      if (
        !containerDimensions.width ||
        !containerDimensions.height ||
        !imageDimensions.width ||
        !imageDimensions.height
      ) {
        return { translateX: 0, translateY: 0 }
      }

      const scaledWidth = imageDimensions.width * scale
      const scaledHeight = imageDimensions.height * scale

      if (scaledWidth <= containerDimensions.width && scaledHeight <= containerDimensions.height) {
        return { translateX: 0, translateY: 0 }
      }

      const maxTranslateX = Math.max(0, (scaledWidth - containerDimensions.width) / 2)
      const maxTranslateY = Math.max(0, (scaledHeight - containerDimensions.height) / 2)

      return {
        translateX: Math.max(-maxTranslateX, Math.min(maxTranslateX, translateX)),
        translateY: Math.max(-maxTranslateY, Math.min(maxTranslateY, translateY)),
      }
    },
    [containerDimensions, imageDimensions],
  )

  const zoomToPoint = useCallback(
    (clientX: number, clientY: number, deltaScale: number) => {
      if (!containerRef.current) return

      const container = containerRef.current.getBoundingClientRect()
      const pointX = clientX - container.left - container.width / 2
      const pointY = clientY - container.top - container.height / 2

      setTransform((prev) => {
        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale + deltaScale))
        if (newScale === prev.scale) return prev

        const scaleRatio = newScale / prev.scale

        const newTranslateX = prev.translateX * scaleRatio + pointX * (1 - scaleRatio)
        const newTranslateY = prev.translateY * scaleRatio + pointY * (1 - scaleRatio)

        const constrained = constrainTranslation(newScale, newTranslateX, newTranslateY)

        return {
          scale: newScale,
          translateX: constrained.translateX,
          translateY: constrained.translateY,
        }
      })
    },
    [constrainTranslation],
  )

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault()
      const deltaScale = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
      zoomToPoint(e.clientX, e.clientY, deltaScale)
    },
    [zoomToPoint],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (transform.scale <= initialScale * 1.01) return

      setIsDragging(true)
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        translateX: transform.translateX,
        translateY: transform.translateY,
      })
      e.preventDefault()
    },
    [transform, initialScale],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return

      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y

      const newTranslateX = dragStart.translateX + deltaX
      const newTranslateY = dragStart.translateY + deltaY

      const constrained = constrainTranslation(transform.scale, newTranslateX, newTranslateY)

      setTransform((prev) => ({
        ...prev,
        translateX: constrained.translateX,
        translateY: constrained.translateY,
      }))
    },
    [isDragging, dragStart, transform.scale, constrainTranslation],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1 && transform.scale > initialScale * 1.01) {
        const touch = e.touches[0]
        setIsDragging(true)
        setDragStart({
          x: touch.clientX,
          y: touch.clientY,
          translateX: transform.translateX,
          translateY: transform.translateY,
        })
      }
    },
    [transform, initialScale],
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return

      e.preventDefault()
      const touch = e.touches[0]
      const deltaX = touch.clientX - dragStart.x
      const deltaY = touch.clientY - dragStart.y

      const newTranslateX = dragStart.translateX + deltaX
      const newTranslateY = dragStart.translateY + deltaY

      const constrained = constrainTranslation(transform.scale, newTranslateX, newTranslateY)

      setTransform((prev) => ({
        ...prev,
        translateX: constrained.translateX,
        translateY: constrained.translateY,
      }))
    },
    [isDragging, dragStart, transform.scale, constrainTranslation],
  )

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (Math.abs(transform.scale - initialScale) < 0.01) {
        zoomToPoint(e.clientX, e.clientY, initialScale)
      } else {
        resetTransform()
      }
    },
    [transform.scale, initialScale, zoomToPoint, resetTransform],
  )

  const stopPropogation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
    })
    setImageLoaded(true)
  }, [])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose?.()
          break
        case "0":
          resetTransform()
          break
        case "+":
        case "=":
          e.preventDefault()
          zoomToPoint(window.innerWidth / 2, window.innerHeight / 2, ZOOM_STEP)
          break
        case "-":
        case "_":
          e.preventDefault()
          zoomToPoint(window.innerWidth / 2, window.innerHeight / 2, -ZOOM_STEP)
          break
      }
    },
    [onClose, resetTransform, zoomToPoint],
  )

  useEffect(() => {
    if (imageLoaded && imageDimensions.width && imageDimensions.height) {
      updateContainerDimensions()
      setTimeout(() => {
        const newInitialScale = calculateInitialScale()
        setInitialScale(newInitialScale)
        setTransform({
          scale: newInitialScale,
          translateX: 0,
          translateY: 0,
        })
      }, 50)
    }
  }, [imageLoaded, imageDimensions, calculateInitialScale, updateContainerDimensions])

  useEffect(() => {
    const handleResize = () => {
      updateContainerDimensions()
      if (imageLoaded) {
        const newInitialScale = calculateInitialScale()
        setInitialScale(newInitialScale)
        if (Math.abs(transform.scale - initialScale) < 0.01) {
          setTransform((prev) => ({
            ...prev,
            scale: newInitialScale,
          }))
        }
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [imageLoaded, calculateInitialScale, updateContainerDimensions, transform.scale, initialScale])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener("wheel", handleWheel, { passive: false })
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("touchmove", handleTouchMove, { passive: false })
    document.addEventListener("touchend", handleTouchEnd)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      container.removeEventListener("wheel", handleWheel)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleWheel, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd, handleKeyDown])

  const canDrag = transform.scale > initialScale * 1.01

  return (
    <div ref={containerRef} className="image-viewer-container" tabIndex={0} onClick={onClose}>
      {!imageLoaded && (
        <div className="image-viewer-loading">
          <div className="loading-spinner"></div>
          <p>Загрузка изображения...</p>
        </div>
      )}

      <div
        ref={moveContainerRef}
        className="image-viewer-move-container"
        style={{
          transform: `translate(${transform.translateX}px, ${transform.translateY}px)`,
        }}
      >
        <div
          className="image-viewer-scale-container"
          style={{
            transform: `scale(${transform.scale})`,
            width: `${imageDimensions.width}px`,
            height: `${imageDimensions.height}px`,
          }}
        >
          <img
            ref={imageRef}
            src={src || "/placeholder.svg"}
            alt={alt}
            className={`image-viewer-image ${isDragging ? "dragging" : ""} ${canDrag ? "can-drag" : ""}`}
            style={{
              opacity: imageLoaded ? 1 : 0,
            }}
            onLoad={handleImageLoad}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
            onTouchStart={handleTouchStart}
            draggable={false}
            onClick={stopPropogation}
          />
        </div>
      </div>

      {imageLoaded && (
        <div className="image-viewer-info" onClick={stopPropogation}>
          <span className="zoom-level">{Math.round((transform.scale / initialScale) * 100)}%</span>
            <button className="reset-button" onClick={resetTransform} title="Сбросить зум (клавиша 0)">
              Сбросить
            </button>
        </div>
      )}
    </div>
  )
}
