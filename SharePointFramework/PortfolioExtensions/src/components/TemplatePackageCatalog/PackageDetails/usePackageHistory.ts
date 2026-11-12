import { useEffect, useState } from 'react'
import { IChangelogEntry } from 'models'
import { CatalogService } from 'services'

/**
 * Loads cached or fetched changelog entries and exposes loading, error and retry state.
 * Missing URLs and non-success HTTP responses produce an empty history.
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
