import { useEffect, useState } from 'react'
import { CatalogService } from 'services'

export interface IFilePreviewContent {
  value: string
  isJson: boolean
}

/** Pretty-print JSON; fall back to the raw text for non-JSON (e.g. `.txt`). */
function formatJson(text: string): IFilePreviewContent {
  try {
    return { value: JSON.stringify(JSON.parse(text), null, 2), isJson: true }
  } catch {
    return { value: text, isJson: false }
  }
}

/**
 * Lazily fetches the raw text of a package file when `url` is set, pretty-prints
 * JSON, and exposes copy-to-clipboard state for {@link PackageFilePreview}.
 */
export function usePackageFilePreview(url?: string) {
  const [content, setContent] = useState<IFilePreviewContent | undefined>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!url) return undefined
    setLoading(true)
    setError(false)
    setContent(undefined)
    setCopied(false)
    CatalogService.getFileText(url)
      .then((text) => {
        if (cancelled) return
        setContent(formatJson(text))
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError(true)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [url])

  const copy = (): void => {
    if (!content || !navigator.clipboard) return
    void navigator.clipboard.writeText(content.value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return { content, loading, error, copied, copy }
}
