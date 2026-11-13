import { useEffect, useState } from 'react'
import { useTelemetry } from 'pp365-shared-library/lib/telemetry'
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
  // A failed load the admin is told about is counted for usage statistics, by its error code.
  const telemetry = useTelemetry()

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
      .catch((error) => {
        if (cancelled) return
        telemetry.trackError(error)
        setError(true)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [changelogUrl, reloadToken])

  return { entries, loading, error, retry: () => setReloadToken((token) => token + 1) }
}
