import { ListMenuItem } from 'pp365-shared-library'
import { useContext } from 'react'
import { ProjectProvisionContext } from 'components/ProjectProvision/context'

/**
 * Component logic hook for `Commands`. This hook is responsible for
 * rendering the toolbar and handling its actions.
 */
export function useCommands() {
  const context = useContext(ProjectProvisionContext)

  const toolbarItems = [
    new ListMenuItem(null, 'Oppdater').setIcon('ArrowSync').setOnClick(() => {
      context.setState({
        isRefetching: true,
        refetch: new Date().getTime()
      })
    })
  ]

  return { toolbarItems }
}
