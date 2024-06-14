import { ListMenuItem } from 'pp365-shared-library'
import strings from 'PortfolioWebPartsStrings'

/**
 * Component logic hook for `Commands`. This hook is responsible for
 * rendering the toolbar and handling its actions.
 */
export function useCommands() {
  const toolbarItems = [
    new ListMenuItem(null, strings.FilterText).setIcon('Filter').setOnClick(() => {
      // console.log('Filter')
    })
  ]

  return { toolbarItems }
}
