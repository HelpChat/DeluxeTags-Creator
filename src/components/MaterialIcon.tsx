import { useEffect, useRef, useState, type SyntheticEvent } from 'react'

export function materialAbbrev(material: string): string {
  return material
    .split('_')
    .map((part) => part[0])
    .join('')
    .slice(0, 3)
}

function isPlayerHead(material: string): boolean {
  return material.toUpperCase() === 'PLAYER_HEAD'
}

/** Crop the 8,8 face region of a player head skin to a 16x16 data URL, matching the original. */
function convertPlayerHeadTexture(img: HTMLImageElement): string | null {
  const width = img.naturalWidth || img.width
  const height = img.naturalHeight || img.height
  if (!width || !height || width < 16 || height < 16) return null
  const canvas = document.createElement('canvas')
  canvas.width = 16
  canvas.height = 16
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, 16, 16)
  ctx.drawImage(img, 8, 8, Math.min(8, width - 8), Math.min(8, height - 8), 0, 0, 16, 16)
  try {
    // Cross-origin skin textures taint the canvas; fall back to the original image then.
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

interface MaterialIconProps {
  material: string
  candidates: string[]
  imgClass: string
  fallbackClass: string
  alt?: string
}

/**
 * An item icon that walks the candidate texture URLs on error and, for player heads, crops
 * the skin face on load. The fallback abbreviation span must be the immediate next sibling of
 * the img so the CSS `img:not(.failed) + fallback` hide rule works, so they render adjacent
 * with no whitespace between them.
 */
export function MaterialIcon({ material, candidates, imgClass, fallbackClass, alt }: MaterialIconProps) {
  const [src, setSrc] = useState(candidates[0] ?? '')
  const [failed, setFailed] = useState(false)
  const indexRef = useRef(0)
  const croppedRef = useRef(false)
  const key = candidates.join('|')

  useEffect(() => {
    indexRef.current = 0
    croppedRef.current = false
    setFailed(false)
    setSrc(candidates[0] ?? '')
  }, [key])

  function handleError() {
    const next = indexRef.current + 1
    if (candidates[next]) {
      indexRef.current = next
      setFailed(false)
      setSrc(candidates[next])
    } else {
      setFailed(true)
    }
  }

  function handleLoad(event: SyntheticEvent<HTMLImageElement>) {
    if (isPlayerHead(material) && !croppedRef.current) {
      const dataUrl = convertPlayerHeadTexture(event.currentTarget)
      if (dataUrl) {
        croppedRef.current = true
        setSrc(dataUrl)
        return
      }
    }
    setFailed(false)
  }

  return (
    <>
      <img
        className={failed ? `${imgClass} failed` : imgClass}
        alt={alt ?? material}
        src={src}
        // Not draggable, so the slot (not the image) is the drag source.
        draggable={false}
        // The asset host sends CORS headers, so this lets the player-head crop read the canvas.
        crossOrigin="anonymous"
        onError={handleError}
        onLoad={handleLoad}
      />
      <span className={fallbackClass}>{materialAbbrev(material)}</span>
    </>
  )
}
