import { useContext, useEffect, useState } from 'react'
import { FooterContext } from '../context'
import { IFavoriteProject } from './types'

/**
 * Hook to fetch and manage favorite (followed) projects using SharePoint Social API
 */
export function useFavoriteProjects() {
  const context = useContext(FooterContext)
  const [favoriteProjects, setFavoriteProjects] = useState<IFavoriteProject[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetches the list of sites that the current user is following
   * using SharePoint's Social Following REST API
   */
  const fetchFavoriteProjects = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(
        `${context.props.pageContext.web.absoluteUrl}/_api/social.following/my/followed(types=4)`,
        {
          headers: {
            Accept: 'application/json;odata=verbose'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      const followedSites = data.d?.Followed?.results || []

      // Transform the followed sites data to our interface
      // Note: SharePoint Social Following API returns sites with properties:
      // - Name: The title of the site
      // - Uri: The URL of the site
      // - Id: The site identifier
      const projects: IFavoriteProject[] = followedSites
        .map((site: any) => ({
          title: site.Name,
          url: site.Uri,
          siteId: site.Id
        }))
        .filter((project: IFavoriteProject) => project.url && project.title)
        .slice(0, 10) // Limit to 10 projects

      setFavoriteProjects(projects)
    } catch (err) {
      console.error('Error fetching favorite projects:', err)
      setError(err?.message || String(err))
    } finally {
      setIsLoading(false)
    }
  }

  return {
    favoriteProjects,
    isLoading,
    error,
    fetchFavoriteProjects
  }
}
