import { useEffect, useState } from 'react'
import { useTelemetry } from 'pp365-shared-library/lib/telemetry'
import { ICatalogPackage, IPackageContents } from 'models'
import { CatalogService } from 'services'

/** Optional title and raw URL identifying the file-preview dialog's current target. */
export interface IFilePreviewTarget {
  title?: string
  url?: string
}

/**
 * Loads package contents through the service cache and manages hierarchy expansion and file preview.
 * Failed requests can be retried separately from an empty content result.
 */
export function usePackageContentSummary(pkg: ICatalogPackage) {
  const [contents, setContents] = useState<IPackageContents | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)
  const [showDetails, setShowDetails] = useState(false)
  const [preview, setPreview] = useState<IFilePreviewTarget>({})
  // A failed load the admin is told about is counted for usage statistics, by its error code.
  const telemetry = useTelemetry()

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
      .catch((error) => {
        if (cancelled) return
        telemetry.trackError(error)
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
