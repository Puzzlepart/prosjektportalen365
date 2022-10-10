import { useContext, useRef, useEffect } from 'react'
import { AddProjectDialog } from '.'
import { ProgramAdministrationContext } from '../context'
import { getHubSiteProjects } from '../data'
import { DATA_LOADED } from '../reducer'

export const useAddProjectDialog = () => {
  const context = useContext(ProgramAdministrationContext)
  const selectedProjects = useRef<Array<Record<string, string>>>([])

  useEffect(() => {
    getHubSiteProjects().then((availableProjects) =>
      context.dispatch(DATA_LOADED({ data: { availableProjects }, scope: AddProjectDialog.name }))
    )
  }, [])

  const availableProjects = context.state.availableProjects
    .filter(
      (project) =>
        !context.state.childProjects.some((el) => el.SiteId === project['SiteId']) &&
        project['SiteId'] !== context.props.context.pageContext.site.id.toString()
    )
    .filter((project) => project['SPWebURL'])

  return { selectedProjects, availableProjects } as const
}
