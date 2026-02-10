import { useState, useEffect } from 'react'
import { useProjectInformationContext } from '../context'
import SPDataAdapter from '../../../data'
import resource from 'SharedResources'
import { IChildProject } from './types'

/**
 * Custom hook to fetch child projects from the project properties list
 * Reads the GtChildProjects field which contains a JSON string of child projects
 */
export const useChildrenProjects = (): IChildProject[] => {
  const context = useProjectInformationContext()
  const [childProjects, setChildProjects] = useState<IChildProject[]>([])

  useEffect(() => {
    const fetchChildProjects = async () => {
      try {
        // Get the project properties list
        const propertiesListName = resource.Lists_ProjectProperties_Title
        const propertiesList = SPDataAdapter.sp.web.lists.getByTitle(propertiesListName)

        // Fetch the first item (should be the project properties item)
        const propertyItem = await propertiesList.items.getById(1).select('GtChildProjects')()

        if (propertyItem?.GtChildProjects) {
          try {
            const parsedChildProjects = JSON.parse(propertyItem.GtChildProjects) as IChildProject[]

            // Remove duplicates and filter out empty entries
            const seen = new Set<string>()
            const uniqueProjects = parsedChildProjects.filter((project) => {
              if (!project?.SiteId || seen.has(project.SiteId)) return false
              seen.add(project.SiteId)
              return true
            })

            setChildProjects(uniqueProjects)
          } catch (parseError) {
            console.warn('Failed to parse child projects JSON:', parseError)
            setChildProjects([])
          }
        } else {
          setChildProjects([])
        }
      } catch (error) {
        console.warn('Failed to fetch child projects:', error)
        setChildProjects([])
      }
    }

    // Only fetch if the data adapter is configured
    if (SPDataAdapter.sp && context.props) {
      fetchChildProjects()
    }
  }, [context.props?.siteId]) // Re-fetch if site ID changes

  return childProjects
}
