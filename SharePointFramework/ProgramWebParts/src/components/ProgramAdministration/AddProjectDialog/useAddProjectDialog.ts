import { useContext, useEffect, useState } from 'react'
import { ProgramAdministrationContext } from '../context'
import { ADD_CHILD_PROJECTS, DATA_LOADED } from '../reducer'
import { useId } from '@fluentui/react-components'
import { useTelemetry } from 'pp365-shared-library/lib/telemetry'

/**
 * Loads addable projects and submits selected links, retaining failures in the open dialog. For
 * usage statistics an add that went through is counted once, however many projects it added, and
 * a failed add or a failed read of the hubs' projects by the error's own code, for the web part.
 */
export const useAddProjectDialog = () => {
  const context = useContext(ProgramAdministrationContext)
  const [error, setError] = useState<Error>(null)
  const telemetry = useTelemetry()

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
      .catch((e) => {
        telemetry.trackError(e)
        context.dispatch(
          DATA_LOADED({ data: { availableProjects: [] }, scope: 'AddProjectDialog' })
        )
      })
  }, [context.programHubs])

  const availableProjects = context.state.availableProjects.filter(
    ({ SiteId }) =>
      !context.state.childProjects.some((c) => c.SiteId === SiteId) &&
      SiteId !== context.props.context.pageContext.site.id.toString()
  )

  const onAddChildProjects = async () => {
    const projects = availableProjects.filter(({ SiteId }) =>
      context.state.addProjectDialog?.selectedProjects.includes(SiteId)
    )

    const currentHubSiteId = context.props.context.pageContext.legacyPageContext.hubSiteId
    const parentHub = context.programHubs?.find(
      (h) => h.hubSiteId?.toLowerCase() === currentHubSiteId?.toLowerCase()
    )
    const parentHubSiteUrl = parentHub?.url

    try {
      setError(null)
      await context.props.dataAdapter.addChildProjects(projects, parentHubSiteUrl)
      context.dispatch(ADD_CHILD_PROJECTS(projects))
      // Counted here and not in the reducer, once per add that went through.
      telemetry.track('childProjects.added')
    } catch (e) {
      telemetry.trackError(e)
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
