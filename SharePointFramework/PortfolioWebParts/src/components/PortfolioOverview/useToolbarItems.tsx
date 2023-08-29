import {
  AppsListRegular,
  ArrowExportUp24Regular,
  ContentView24Regular,
  Filter24Regular,
  TextBulletListLtrRegular
} from '@fluentui/react-icons'
import { IListMenuItem } from 'components/List'
import { IPortfolioOverviewContext } from './context'
import { TOGGLE_FILTER_PANEL, TOGGLE_VIEW_FORM_PANEL } from './reducer'
import { useExcelExport } from './useExcelExport'
import strings from 'PortfolioWebPartsStrings'

/**
 * Returns an array of menu items for the toolbar in the PortfolioOverview component.
 *
 * @param context - The IPortfolioOverviewContext object containing the necessary data for generating the toolbar items.
 *
 * @returns An array of IListMenuItem objects representing the toolbar items.
 */
export function useToolbarItems(context: IPortfolioOverviewContext) {
  // const userCanManageViews =
  //   !context.props.isParentProject && context.props.configuration.userCanAddViews

  // if (context.props.showProgramViews && !_.isEmpty(context.props.configuration.programs)) {
  //   viewOptionsItem.subMenuProps.items.push({
  //     key: 'PROGRAMS_HEADER',
  //     itemType: ContextualMenuItemType.Header,
  //     text: strings.ProgramsHeaderText
  //   })
  //   const selectProgramItem: IContextualMenuItem = {
  //     key: 'SELECT_PROGRAM',
  //     name: strings.SelectProgramText,
  //     subMenuProps: {
  //       items: context.props.configuration.programs.map(
  //         (p) =>
  //         ({
  //           key: p.id,
  //           text: p.name,
  //           canCheck: true,
  //           checked: context.state.currentView?.id === p.id,
  //           onClick: () => {
  //             const defaultView = context.props.configuration.views.find((v) => v.isDefaultView)
  //             if (!defaultView) return
  //             const view = new PortfolioOverviewView().configureFrom(defaultView).set({
  //               id: p.id,
  //               title: p.name
  //             })
  //             view.searchQueries = p.buildQueries(defaultView.searchQuery)
  //             context.dispatch(CHANGE_VIEW(view))
  //           }
  //         } as IContextualMenuItem)
  //       )
  //     }
  //   }
  //   viewOptionsItem.subMenuProps.items.push(selectProgramItem)
  // }

  const { exportToExcel } = useExcelExport(context)

  const menuItems: IListMenuItem[] = [
    {
      icon: ArrowExportUp24Regular,
      onClick: exportToExcel
    },
    {
      icon: ContentView24Regular,
      text: 'Alle prosjekter',
      width: 220,
      items: [
        {
          text: 'Liste',
          icon: AppsListRegular
        },
        {
          text: 'Kompakt liste',
          icon: TextBulletListLtrRegular
        },
        {
          type: 'divider'
        },
        ...context.props.configuration.views
          .filter((view) => !view.isPersonal)
          .map((view) => ({
            text: view.title
          })),
        {
          type: 'divider'
        },
        {
          text: 'Personlige visninger',
          type: 'header'
        },
        ...context.props.configuration.views
          .filter((view) => view.isPersonal)
          .map((view) => ({
            text: view.title
          })),
        {
          type: 'divider'
        },
        {
          text: strings.NewViewText,
          onClick: () => {
            context.dispatch(TOGGLE_VIEW_FORM_PANEL({ isOpen: true }))
          }
        },
        {
          text: strings.EditViewText,
          disabled: context.state.currentView?.isProgramView,
          onClick: () => {
            context.dispatch(
              TOGGLE_VIEW_FORM_PANEL({ isOpen: true, view: context.state.currentView })
            )
          }
        }
      ]
    },
    {
      icon: Filter24Regular,
      onClick: () => {
        context.dispatch(TOGGLE_FILTER_PANEL())
      }
    }
  ]

  return menuItems
}
