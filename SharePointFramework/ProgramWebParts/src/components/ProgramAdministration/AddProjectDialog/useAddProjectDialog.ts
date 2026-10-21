import { useContext, useEffect, useState } from 'react'
import { ProgramAdministrationContext } from '../context'
import { ADD_CHILD_PROJECTS, DATA_LOADED } from '../reducer'
import { useId } from '@fluentui/react-components'

export const useAddProjectDialog = () => {
  const context = useContext(ProgramAdministrationContext)
  const [error, setError] = useState<Error>(null)

  // A failed add is told while the dialog is open. The dialog stays mounted while closed, so the
  // error is let go of then, and the next opening starts clean.
  const isOpen = !!context.state.addProjectDialog?.open
  useEffect(() => {
    if (!isOpen) setError(null)
  }, [isOpen])

  useEffect(() => {
    if (!context.programHubs || context.programHubs.length === 0) return
    if (!context.programHubs.some((h) => h.hubSiteId)) return

    context.props.dataAdapter
      .getHubSiteProjects(context.programHubs)
      .then((availableProjects) =>
        context.dispatch(DATA_LOADED({ data: { availableProjects }, scope: 'AddProjectDialog' }))
      )
      .catch(() =>
        context.dispatch(
          DATA_LOADED({ data: { availableProjects: [] }, scope: 'AddProjectDialog' })
        )
      )
  }, [context.programHubs])

  const availableProjects = context.state.availableProjects.filter(
    ({ SiteId }) =>
      !context.state.childProjects.some((c) => c.SiteId === SiteId) &&
      SiteId !== context.props.context.pageContext.site.id.toString()
  )

  /**
   * Adds projects to the parent project. This function is called when the user clicks the "Add" button in the
   * `<AddProjectDialog />` component.
   */
  const onAddChildProjects = async () => {
    const projects = availableProjects.filter(({ SiteId }) =>
      context.state.addProjectDialog?.selectedProjects.includes(SiteId)
    )

    const currentHubSiteId = context.props.context.pageContext.legacyPageContext.hubSiteId
    const parentHub = context.programHubs?.find(
      (h) => h.hubSiteId?.toLowerCase() === currentHubSiteId?.toLowerCase()
    )
    const parentHubSiteUrl = parentHub?.url

    // A failure was not caught: nothing was added, and nothing said so. The dialog stays open
    // with the error (WCAG 3.3.1, 4.1.3).
    try {
      setError(null)
      await context.props.dataAdapter.addChildProjects(projects, parentHubSiteUrl)
      context.dispatch(ADD_CHILD_PROJECTS(projects))
    } catch (e) {
      setError(e)
    }
  }

  const fluentProviderId = useId('fp-add-project-dialog')

  return {
    availableProjects,
    onAddChildProjects,
    error,
    fluentProviderId
  }
}
