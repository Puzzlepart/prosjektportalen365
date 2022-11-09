import { useContext, useEffect, useState } from 'react'
import { ProgramAdministrationContext } from '../context'
import { getHubSiteProjects } from '../data'
import { DATA_LOADED } from '../reducer'
import { useSelectionList } from '../useSelectionList'

export const useAddProjectDialog = () => {
  const context = useContext(ProgramAdministrationContext)
  const [selectedProjects, setSelectedProjects] = useState<any[]>([])

  const { selection, onSearch, searchTerm } = useSelectionList([], (selected) => {
    setSelectedProjects(selected)
  })

  useEffect(() => {
    getHubSiteProjects()
      .then((availableProjects) =>
        context.dispatch(DATA_LOADED({ data: { availableProjects }, scope: 'AddProjectDialog' }))
      )
      .catch(() =>
        context.dispatch(
          DATA_LOADED({ data: { availableProjects: [] }, scope: 'AddProjectDialog' })
        )
      )
  }, [])

  const availableProjects = context.state.availableProjects
    .filter(
      (project) =>
        !context.state.childProjects.some((el) => el.SiteId === project['SiteId']) &&
        project['SiteId'] !== context.props.context.pageContext.site.id.toString()
    )
    .filter((project) => project['SPWebURL'])

  return {
    selectedProjects,
    setSelectedProjects,
    availableProjects,
    selection,
    onSearch,
    searchTerm
  } as const
}
