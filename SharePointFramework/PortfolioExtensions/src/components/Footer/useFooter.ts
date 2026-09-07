import { useEffect, useRef, useState } from 'react'
import { IFooterProps } from './types'

function useLazyData<T>(loader: () => Promise<T>, initialData: T) {
  const [data, setData] = useState(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const requested = useRef(false)
  const mounted = useRef(true)

  useEffect(
    () => () => {
      mounted.current = false
    },
    []
  )

  function load(): void {
    if (requested.current) return

    requested.current = true
    setIsLoading(true)
    loader().then(
      (result) => {
        if (!mounted.current) return
        setData(result)
        setIsLoading(false)
        setIsLoaded(true)
      },
      () => {
        if (!mounted.current) return
        setIsLoading(false)
        setIsLoaded(true)
      }
    )
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
  const helpContent = useLazyData(props.loadHelpContent, [])
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
