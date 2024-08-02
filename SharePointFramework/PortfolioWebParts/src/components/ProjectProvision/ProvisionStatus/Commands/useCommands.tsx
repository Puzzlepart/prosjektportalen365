import { ListMenuItem } from 'pp365-shared-library'
import strings from 'PortfolioWebPartsStrings'
import { useContext } from 'react'
import { ProjectProvisionContext } from 'components/ProjectProvision/context'

/**
 * Component logic hook for `Commands`. This hook is responsible for
 * rendering the toolbar and handling its actions.
 */
export function useCommands() {
  const context = useContext(ProjectProvisionContext)

  const toolbarItems = [
    new ListMenuItem(null, strings.FilterText)
      .setIcon('Filter')
      .setDisabled(true)
      .setOnClick(() => {
        // TODO: Add filter options for statuses
      }),
    new ListMenuItem(null, strings.Provision.UpdateLabel).setIcon('ArrowSync').setOnClick(() => {
      context.setState({
        isRefetching: true,
        refetch: new Date().getTime()
      })
    })
  ]

  return { toolbarItems }
}
