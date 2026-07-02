import { useEffect, useState } from 'react'
import { IChangelogEntry } from 'models'
import { CatalogService } from 'services'

/**
 * Fetches and parses a package changelog for {@link PackageHistory}, exposing
 * loading/error state and a retry. Re-fetches when `changelogUrl` changes or
 * `retry()` is called. Distinguishes "no changelog" (empty result) from a
 * transient fetch failure (`error`).
 */
export function usePackageHistory(changelogUrl?: string) {
  const [entries, setEntries] = useState<IChangelogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    if (!changelogUrl) {
      setEntries([])
      setError(false)
      return
    }
    setLoading(true)
    setError(false)
    CatalogService.getChangelog(changelogUrl)
      .then((result) => {
        if (cancelled) return
        setEntries(result)
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
  }, [changelogUrl, reloadToken])

  return { entries, loading, error, retry: () => setReloadToken((token) => token + 1) }
}
