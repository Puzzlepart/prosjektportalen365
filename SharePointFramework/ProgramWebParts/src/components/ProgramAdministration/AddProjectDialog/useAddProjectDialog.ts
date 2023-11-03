import { useContext, useEffect } from 'react'
import { ProgramAdministrationContext } from '../context'
import { DATA_LOADED } from '../reducer'

export const useAddProjectDialog = () => {
  const context = useContext(ProgramAdministrationContext)

  useEffect(() => {
    context.props.dataAdapter
      .getHubSiteProjects()
      .then((availableProjects) =>
        context.dispatch(DATA_LOADED({ data: { availableProjects }, scope: 'AddProjectDialog' }))
      )
      .catch(() =>
        context.dispatch(
          DATA_LOADED({ data: { availableProjects: [] }, scope: 'AddProjectDialog' })
        )
      )
  }, [])

  const availableProjects = context.state.availableProjects.filter(
    (project) =>
      !context.state.childProjects.some((el) => el.SiteId === project.SiteId) &&
      project.SiteId !== context.props.context.pageContext.site.id.toString()
  )

  return {
    availableProjects
  }
}
