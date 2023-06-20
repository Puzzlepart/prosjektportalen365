import { useContext, useEffect } from 'react'
import { ProgramAdministrationContext } from '../context'
import { DATA_LOADED, SET_SELECTED_TO_ADD } from '../reducer'
import { useRowRenderer } from '../useRowRenderer'
import { useSelectionList } from '../useSelectionList'

export const useAddProjectDialog = () => {
  const context = useContext(ProgramAdministrationContext)
  const selectedKeys = context.state.selectedProjectsToAdd.map((p) => p.key)

  const selectionList = useSelectionList(selectedKeys, (selected) => {
    context.dispatch(SET_SELECTED_TO_ADD({ selected }))
  })

  useEffect(() => {
    context.props.dataAdapter
      .getHubSiteProjects()
      .then((availableProjects) =>
        context.dispatch(
          DATA_LOADED({
            data: { availableProjects },
            scope: 'AddProjectDialog'
          })
        )
      )
      .catch(() =>
        context.dispatch(
          DATA_LOADED({
            data: { availableProjects: [] },
            scope: 'AddProjectDialog'
          })
        )
      )
  }, [])

  const availableProjects = context.state.availableProjects.filter(
    (project) =>
      !context.state.childProjects.some((el) => el.SiteId === project.SiteId) &&
      project.SiteId !== context.props.context.pageContext.site.id.toString()
  )

  const onRenderRow = useRowRenderer({
    selectedKeys,
    searchTerm: selectionList.searchTerm
  })

  return {
    ...selectionList,
    availableProjects,
    onRenderRow
  } as const
}
