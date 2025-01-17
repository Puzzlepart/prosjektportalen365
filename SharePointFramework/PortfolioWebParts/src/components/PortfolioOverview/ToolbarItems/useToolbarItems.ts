import strings from 'PortfolioWebPartsStrings'
import { ListMenuItem, ListMenuItemDivider, ListMenuItemHeader } from 'pp365-shared-library'
import { useMemo, useState } from 'react'
import _ from 'underscore'
import { IPortfolioOverviewContext } from '../context'
import { SET_VIEW_FORM_PANEL, TOGGLE_COMPACT, TOGGLE_FILTER_PANEL } from '../reducer'
import { Icons } from './icons'
import { useExcelExport } from './useExcelExport'
import { useProgramMenuItems } from './useProgramMenuItems'
import { useViewsMenuItems } from './useViewsMenuItems'


/**
 * Returns an array of menu items for the toolbar in the PortfolioOverview component.
 *
 * @param context - The `IPortfolioOverviewContext` object containing the necessary data for generating the toolbar items.
 *
 * @returns An array of `IListMenuItem` objects representing the toolbar items.
 */
export function useToolbarItems(context: IPortfolioOverviewContext) {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(context.props.selectedPortfolioId)
  const userCanManageViews = context.props.configuration.userCanAddViews
  const userCanEditGlobalViews = userCanManageViews && context.props.isSiteAdmin
  const userEmail = context.props.pageContext.user.email ?? context.props.pageContext.user.loginName
  const userCanEditView = userCanManageViews && context.state.currentView?.author === userEmail
  const exportToExcel = useExcelExport(context)
  const sharedViews = useViewsMenuItems(context, (view) => !view.isPersonal)
  const personalViews = useViewsMenuItems(context, (view) => view.isPersonal)
  const programViews = useProgramMenuItems(context)

  return useMemo<ListMenuItem[]>(
    () =>
      [
        context.props.showExcelExportButton &&
        new ListMenuItem(null, strings.ExcelExportButtonLabel)
          .setIcon('ExcelLogoInverse')
          .setOnClick(exportToExcel)
          .setStyle({
            color: '#10793F'
          }),
        new ListMenuItem(context.props.portfolios.find(({ uniqueId }) => selectedPortfolioId === uniqueId)?.title ?? strings.SelectedPortfolioLabel, strings.PortfolioSelectorDescription)
          .setIcon(Icons.Collections)
          .setWidth('fit-content')
          .setStyle({
            minWidth: '145px',
            display: (context.props.showPortfolioSelector && context.props.portfolios?.length > 1) ? 'flex' : 'none'
          })
          .setDisabled(context.state.isChangingView)
          .setItems(
            context.props.portfolios.map<ListMenuItem>((v) =>
              new ListMenuItem(v.title)
                .makeCheckable({
                  name: 'portfolios',
                  value: v.uniqueId.toString()
                })
                .setOnClick(() => {
                  setSelectedPortfolioId(v.uniqueId)
                  context.props.onSetPortfolio(v.uniqueId)
                })
            ),
            {
              portfolios: [selectedPortfolioId]
            }
          ),
        new ListMenuItem(context.state.currentView?.title, strings.PortfolioViewsListName)
          .setIcon(Icons.ContentView)
          .setWidth('fit-content')
          .setStyle({
            minWidth: '145px',
            display: context.props.showViewSelector ? 'flex' : 'none'
          })
          .setDisabled(context.state.isChangingView)
          .setItems(
            [
              new ListMenuItem(strings.ListViewText)
                .setIcon(Icons.AppsList)
                .makeCheckable({
                  name: 'renderMode',
                  value: 'list'
                })
                .setOnClick(() => {
                  context.dispatch(TOGGLE_COMPACT())
                }),
              new ListMenuItem(strings.CompactViewText)
                .setIcon(Icons.TextBulletList)
                .makeCheckable({
                  name: 'renderMode',
                  value: 'compactList'
                })
                .setOnClick(() => {
                  context.dispatch(TOGGLE_COMPACT())
                }),
              ListMenuItemDivider,
              ...sharedViews,
              !_.isEmpty(personalViews) && ListMenuItemDivider,
              ListMenuItemHeader(strings.PersonalViewsHeaderText).makeConditional(
                !_.isEmpty(personalViews)
              ),
              ...personalViews,
              context.props.showProgramViews && ListMenuItemDivider,
              context.props.showProgramViews &&
              ListMenuItemHeader(strings.ProgramsHeaderText).setStyle({
                display:
                  context.props.showProgramViews && !_.isEmpty(programViews) ? 'flex' : 'none'
              }),
              new ListMenuItem(strings.SelectProgramText)
                .setItems(programViews)
                .setIcon(Icons.ChevronLeft)
                .setStyle({
                  display:
                    context.props.showProgramViews && !_.isEmpty(programViews) ? 'flex' : 'none'
                }),
              ListMenuItemDivider.setStyle({
                display:
                  context.props.showProgramViews && !_.isEmpty(programViews) ? 'flex' : 'none'
              }),
              new ListMenuItem(strings.NewViewText)
                .setDisabled(!userCanManageViews)
                .setIcon(Icons.FormNew)
                .setOnClick(() => {
                  context.dispatch(SET_VIEW_FORM_PANEL({ isOpen: true }))
                }),
              new ListMenuItem(strings.EditViewText)
                .setDisabled(!userCanEditView && !userCanEditGlobalViews)
                .setIcon(Icons.Edit)
                .setOnClick(() => {
                  context.dispatch(
                    SET_VIEW_FORM_PANEL({ isOpen: true, view: context.state.currentView })
                  )
                })
            ],
            {
              views: [context.state.currentView?.id.toString()],
              renderMode: context.state.isCompact ? ['compactList'] : ['list']
            }
          ),
        context.props.showFilters &&
        new ListMenuItem(null, strings.FilterText).setIcon('Filter').setOnClick(() => {
          context.dispatch(TOGGLE_FILTER_PANEL())
        })
      ].filter(Boolean),
    [context.state, context.props]
  )
}
