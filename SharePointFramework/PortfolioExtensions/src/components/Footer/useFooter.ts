import { useEffect, useRef, useState } from 'react'
import { IFooterProps } from './types'

/**
 * Loads data the first time `load` is called, and keeps it.
 *
 * @param loader Loads the data
 * @param initialData Data until it has loaded
 * @param resetKey What the data belongs to: when it changes, the data starts over, and loads at
 * once if it had been loaded
 */
function useLazyData<T>(loader: () => Promise<T>, initialData: T, resetKey?: string) {
  const [data, setData] = useState(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const requested = useRef(false)
  const mounted = useRef(true)
  // Bumped by every load and by a new `resetKey`, so only the latest load's result is used.
  const generation = useRef(0)
  const lastResetKey = useRef(resetKey)

  useEffect(
    () => () => {
      mounted.current = false
    },
    []
  )

  // The footer stays mounted across SharePoint's client-side navigations (it was mounted anew on
  // each one until 1.15), so data that belongs to the page has to start over when the page does.
  // No dependency list: it runs after every render and returns at once unless the key changed.
  useEffect(() => {
    if (lastResetKey.current === resetKey) return
    lastResetKey.current = resetKey
    generation.current++
    setData(initialData)
    setIsLoading(false)
    setIsLoaded(false)
    if (requested.current) fetchData()
  })

  function fetchData(): void {
    const current = ++generation.current
    setIsLoading(true)
    loader().then(
      (result) => {
        if (!mounted.current || current !== generation.current) return
        setData(result)
        setIsLoading(false)
        setIsLoaded(true)
      },
      () => {
        if (!mounted.current || current !== generation.current) return
        setIsLoading(false)
        setIsLoaded(true)
      }
    )
  }

  function load(): void {
    if (requested.current) return

    requested.current = true
    fetchData()
  }

  return { data, isLoading, isLoaded, load } as const
}

/**
 * Component logic hook for the `Footer` component. Returns the latest entry
 * from the `entries` prop (which is sorted by `InstallStartTime`) and
 * the installed version string.
 *
 * @param props Props for the `Footer` component
 */
export function useFooter(props: IFooterProps) {
  const latestEntry = props.installEntries[0]
  const favoriteProjects = useLazyData(props.loadFavoriteProjects, [])
  const gitHubReleases = useLazyData(props.loadGitHubReleases, [])
  const helpContent = useLazyData(props.loadHelpContent, [], props.pagePath)
  const links = useLazyData(props.loadLinks, [])
  let installedVersion = `v${latestEntry?.fullInstallVersion}`
  if (latestEntry?.installChannel) {
    installedVersion += ` (${latestEntry?.installChannel})`
  }

  return {
    latestEntry,
    installedVersion,
    gitHubReleases: gitHubReleases.data,
    isGitHubReleasesLoading: gitHubReleases.isLoading,
    areGitHubReleasesLoaded: gitHubReleases.isLoaded,
    loadGitHubReleases: gitHubReleases.load,
    helpContent: helpContent.data,
    isHelpContentLoading: helpContent.isLoading,
    isHelpContentLoaded: helpContent.isLoaded,
    loadHelpContent: helpContent.load,
    links: links.data,
    isLinksLoading: links.isLoading,
    areLinksLoaded: links.isLoaded,
    loadLinks: links.load,
    favoriteProjects: favoriteProjects.data,
    isFavoriteProjectsLoading: favoriteProjects.isLoading,
    areFavoriteProjectsLoaded: favoriteProjects.isLoaded,
    loadFavoriteProjects: favoriteProjects.load
  } as const
}
