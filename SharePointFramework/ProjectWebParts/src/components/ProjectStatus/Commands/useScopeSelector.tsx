import strings from 'ProjectWebPartsStrings'
import { ListMenuItem, ListMenuItemDivider, getScopeSeriesKey } from 'pp365-shared-library'
import { useMemo } from 'react'
import { useProjectStatusContext } from '../context'
import { ISubProject, getScopeLabel, parseSubProjects } from '../parseSubProjects'
import { SELECT_SCOPE } from '../reducer'

const DEFAULT_SCOPE_VALUE = '$default'

/**
 * Hook for the report scope ("delprosjekt") selector menu item. The options
 * are the union of the sub-projects configured on the web part and the scope
 * keys found among the project's existing reports — so report series whose
 * key was removed or renamed in the configuration stay reachable. The item
 * is hidden unless multi-reporting is enabled or scoped reports exist.
 */
export function useScopeSelector(): ListMenuItem {
  const { state, dispatch, props } = useProjectStatusContext()
  const scopeKeysWithReports = state.data.scopeKeysWithReports ?? []

  const subProjects = useMemo<ISubProject[]>(() => {
    const configuredSubProjects = parseSubProjects(props.subProjects)
    const orphanedSubProjects = scopeKeysWithReports
      .filter(
        (scopeKey) =>
          !configuredSubProjects.some(
            ({ key }) => getScopeSeriesKey(key) === getScopeSeriesKey(scopeKey)
          )
      )
      .map<ISubProject>((scopeKey) => ({ key: scopeKey, label: scopeKey }))
    return [...configuredSubProjects, ...orphanedSubProjects]
  }, [props.subProjects, state.data.scopeKeysWithReports])

  const selectedScopeKey = getScopeSeriesKey(state.selectedScope)
  const displayText = selectedScopeKey
    ? getScopeLabel(subProjects, state.selectedScope)
    : strings.DefaultScopeLabel

  const scopeMenuItems = useMemo<ListMenuItem[]>(
    () =>
      [
        new ListMenuItem(strings.DefaultScopeLabel, null)
          .makeCheckable({
            name: 'scope',
            value: DEFAULT_SCOPE_VALUE
          })
          .setOnClick(() => {
            if (!selectedScopeKey) return
            dispatch(SELECT_SCOPE({ scopeKey: '' }))
          }),
        subProjects.length > 0 && ListMenuItemDivider,
        ...subProjects.map((subProject) =>
          new ListMenuItem(subProject.label, null)
            .makeCheckable({
              name: 'scope',
              value: getScopeSeriesKey(subProject.key)
            })
            .setOnClick(() => {
              if (getScopeSeriesKey(subProject.key) === selectedScopeKey) return
              dispatch(SELECT_SCOPE({ scopeKey: subProject.key }))
            })
        )
      ].filter(Boolean),
    [subProjects, selectedScopeKey]
  )

  return useMemo<ListMenuItem>(
    () =>
      new ListMenuItem(displayText, strings.ScopeSelectorDescription)
        .setIcon('BoxMultiple')
        .setWidth('fit-content')
        .setStyle({ minWidth: '145px' })
        .setHidden(!props.multiReporting && scopeKeysWithReports.length === 0)
        .setDisabled(state.isPublishing)
        .setItems(scopeMenuItems, {
          scope: [selectedScopeKey || DEFAULT_SCOPE_VALUE]
        }),
    [displayText, scopeMenuItems, selectedScopeKey, state.isPublishing, props.multiReporting]
  )
}
