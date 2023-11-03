import { useContext, useEffect } from 'react'
import { ProgramAdministrationContext } from '../context'
import { ADD_CHILD_PROJECTS, DATA_LOADED } from '../reducer'

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
    ({SiteId}) =>
      !context.state.childProjects.some((c) => c.SiteId === SiteId) &&
      SiteId !== context.props.context.pageContext.site.id.toString()
  )

  /**
   * Adds projects to the parent project. This function is called when the user clicks the "Add" button in the
   * `<AddProjectDialog />` component.
   */
  const onAddChildProjects = async () => {
    const projects = availableProjects.filter(({SiteId}) =>
      context.state.addProjectDialog?.selectedProjects.includes(SiteId)
    )
    await context.props.dataAdapter.addChildProjects(projects)
    context.dispatch(ADD_CHILD_PROJECTS(projects))
  }

  return {
    availableProjects,
    onAddChildProjects
  }
}
