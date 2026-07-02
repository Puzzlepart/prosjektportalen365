import { useEffect, useState } from 'react'
import { ICatalogPackage, IPackageContents } from 'models'
import { CatalogService } from 'services'

export interface IFilePreviewTarget {
  title?: string
  url?: string
}

/**
 * Fetches a package's content summary/hierarchy for
 * {@link PackageContentSummary} and owns the show-details toggle and the
 * file-preview target. Re-fetches when the package changes or `retry()` is
 * called; distinguishes "no content" (empty) from a fetch failure (`error`).
 */
export function usePackageContentSummary(pkg: ICatalogPackage) {
  const [contents, setContents] = useState<IPackageContents | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)
  const [showDetails, setShowDetails] = useState(false)
  const [preview, setPreview] = useState<IFilePreviewTarget>({})

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    setContents(undefined)
    setShowDetails(false)
    CatalogService.getPackageContents(pkg)
      .then((result) => {
        if (cancelled) return
        setContents(result)
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
  }, [pkg.id, reloadToken])

  return {
    contents,
    loading,
    error,
    retry: () => setReloadToken((token) => token + 1),
    showDetails,
    toggleDetails: () => setShowDetails((value) => !value),
    preview,
    openPreview: (target: IFilePreviewTarget) => setPreview(target),
    closePreview: () => setPreview({})
  }
}
