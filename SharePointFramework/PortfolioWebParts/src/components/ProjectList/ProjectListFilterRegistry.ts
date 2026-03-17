import strings from 'PortfolioWebPartsStrings'
import { DataSource } from 'pp365-shared-library/lib/models'
import { ProjectListModel } from 'pp365-shared-library/lib/models'
import { IProjectListVertical, IProjectListState } from './types'
import {
  bundleIcon,
  CubeFilled,
  CubeRegular,
  BoxMultipleFilled,
  BoxMultipleRegular,
  LockOpenFilled,
  LockOpenRegular,
  PersonCircleFilled,
  PersonCircleRegular
} from '@fluentui/react-icons'
import { FluentIcon } from '@fluentui/react-icons/lib/utils/createFluentIcon'

/**
 * Map of icon names (stored in `DataSource.iconName` / `GtIconName`) to
 * FluentUI bundled icons. Extend this map when new icon names are introduced
 * in the DataSource list items.
 */
const iconMap: Record<string, FluentIcon> = {
  LockOpen: bundleIcon(LockOpenFilled, LockOpenRegular),
  PersonCircle: bundleIcon(PersonCircleFilled, PersonCircleRegular),
  Cube: bundleIcon(CubeFilled, CubeRegular),
  BoxMultiple: bundleIcon(BoxMultipleFilled, BoxMultipleRegular)
}

/** Default icon used when `iconName` is not found in the icon map. */
const defaultIcon = iconMap.Cube

/**
 * Shape of the JSON stored in `GtDataSourceConfig`.
 *
 * - `clientFilter` – AND conditions on `ProjectListModel` boolean properties
 *   (e.g. `hasUserAccess`, `isUserMember`, `isParent`, `isProgram`).
 * - `visibilityRule` – conditions on `IProjectListState` boolean properties
 *   (e.g. `isUserInPortfolioManagerGroup`). The tab is hidden when any
 *   condition is not met.
 * - `requiresAccess` – special flag: project passes if the user is a
 *   portfolio manager **OR** has access to the project.
 */
export interface IDataSourceConfig {
  clientFilter?: Record<string, boolean>
  visibilityRule?: Record<string, boolean>
  requiresAccess?: boolean
}

/**
 * Safely parses the `DataSource.config` JSON string into an
 * `IDataSourceConfig` object. Returns an empty object on parse errors
 * or when the input is falsy.
 */
function parseConfig(configJson: string): IDataSourceConfig {
  if (!configJson) return {}
  try {
    return JSON.parse(configJson) as IDataSourceConfig
  } catch {
    return {}
  }
}

/**
 * Builds a client-side filter function from an `IDataSourceConfig`.
 *
 * Logic:
 * - Each key in `clientFilter` is checked against `project[key]` as a boolean.
 *   All conditions are combined with AND logic.
 * - When `requiresAccess` is `true`, an additional check ensures the project
 *   is only shown if `state.isUserInPortfolioManagerGroup || project.hasUserAccess`.
 * - If `visibilityRule` contains keys that match state properties, the filter
 *   also verifies those state conditions (e.g. the "All" tab only shows
 *   projects when `isUserInPortfolioManagerGroup` is true, effectively
 *   acting as a pass-through for all projects).
 *
 * Returns `() => true` when no config is provided.
 */
function buildFilterFunction(
  config: IDataSourceConfig
): (project: ProjectListModel, state: IProjectListState) => boolean {
  const hasClientFilter =
    config.clientFilter && Object.keys(config.clientFilter).length > 0
  const hasVisibilityRule =
    config.visibilityRule && Object.keys(config.visibilityRule).length > 0
  const hasRequiresAccess = config.requiresAccess === true

  if (!hasClientFilter && !hasVisibilityRule && !hasRequiresAccess) {
    return () => true
  }

  return (project: ProjectListModel, state: IProjectListState): boolean => {
    // Check visibility-rule conditions against state (acts as a gate)
    if (hasVisibilityRule) {
      for (const [key, expected] of Object.entries(config.visibilityRule)) {
        if ((state as any)[key] !== expected) return false
      }
    }

    // Check client-filter conditions against project model
    if (hasClientFilter) {
      for (const [key, expected] of Object.entries(config.clientFilter)) {
        if ((project as any)[key] !== expected) return false
      }
    }

    // requiresAccess: portfolio manager OR user has access
    if (hasRequiresAccess) {
      if (!state.isUserInPortfolioManagerGroup && !project.hasUserAccess) {
        return false
      }
    }

    return true
  }
}

/**
 * Builds an `isHidden` function from `IDataSourceConfig.visibilityRule`.
 * The tab is hidden when **any** visibility-rule condition is not met
 * in the current component state.
 *
 * Returns `undefined` when no visibility rules are configured (meaning
 * the tab is always visible).
 */
function buildIsHiddenFunction(
  config: IDataSourceConfig
): ((state: IProjectListState) => boolean) | undefined {
  if (!config.visibilityRule || Object.keys(config.visibilityRule).length === 0) {
    return undefined
  }

  return (state: IProjectListState): boolean => {
    for (const [key, expected] of Object.entries(config.visibilityRule)) {
      if ((state as any)[key] !== expected) return true
    }
    return false
  }
}

/**
 * Resolves an icon name string to a FluentUI bundled icon component.
 * Falls back to the default `Cube` icon when the name is not recognized.
 *
 * @param iconName Icon name from `DataSource.iconName`
 */
function resolveIcon(iconName: string): FluentIcon {
  return iconMap[iconName] ?? defaultIcon
}

/**
 * Converts an array of `DataSource` objects into `IProjectListVertical[]`
 * for use by the `ProjectList` component tab bar.
 *
 * Each DataSource's `config` JSON is parsed to derive client-side filter
 * and visibility logic. DataSources are sorted by `sortOrder` (ascending).
 *
 * Mapping:
 * - `key` / `value` → `DataSource.dataSourceId` (stable GUID across environments)
 * - `text` → `DataSource.title`
 * - `icon` → resolved from `DataSource.iconName`
 * - `searchBoxPlaceholder` → generic search placeholder template
 * - `filter` → built from `GtDataSourceConfig` JSON
 * - `isHidden` → built from visibility rules in `GtDataSourceConfig` (if any)
 *
 * @param dataSources Array of DataSource objects (typically pre-filtered by category/level)
 * @returns Array of `IProjectListVertical` sorted by `sortOrder`
 */
export function convertDataSourcesToVerticals(
  dataSources: DataSource[]
): IProjectListVertical[] {
  return [...dataSources]
    .sort((a, b) => (a.sortOrder ?? 100) - (b.sortOrder ?? 100))
    .map((ds) => {
      const config = parseConfig(ds.config)
      const filter = buildFilterFunction(config)
      const isHidden = buildIsHiddenFunction(config)

      const vertical: IProjectListVertical = {
        key: ds.dataSourceId || `ds-${ds.id}`,
        value: ds.dataSourceId || `ds-${ds.id}`,
        text: ds.title,
        icon: resolveIcon(ds.iconName),
        searchBoxPlaceholder: strings.SearchBoxPlaceholderText,
        filter
      }

      if (isHidden) {
        vertical.isHidden = isHidden
      }

      return vertical
    })
}

/**
 * Finds the default vertical from converted verticals and their source
 * DataSource objects.
 *
 * Priority order:
 * 1. Match by `defaultVerticalId` prop (compared against `dataSourceId`)
 * 2. DataSource with `isDefault === true`
 * 3. First vertical in the sorted list
 *
 * @param dataSources Source DataSource array (used to check `isDefault`)
 * @param verticals Converted verticals (already sorted by `sortOrder`)
 * @param defaultVerticalId Optional default vertical identifier from WebPart props
 * @returns The default vertical, or `undefined` if no verticals exist
 */
export function findDefaultVertical(
  dataSources: DataSource[],
  verticals: IProjectListVertical[],
  defaultVerticalId?: string
): IProjectListVertical | undefined {
  if (verticals.length === 0) return undefined

  // 1. Match by prop (dataSourceId)
  if (defaultVerticalId) {
    const match = verticals.find((v) => v.key === defaultVerticalId)
    if (match) return match
  }

  // 2. Match by DataSource isDefault flag
  const defaultDs = dataSources.find((ds) => ds.isDefault)
  if (defaultDs) {
    const dsKey = defaultDs.dataSourceId || `ds-${defaultDs.id}`
    const match = verticals.find((v) => v.key === dsKey)
    if (match) return match
  }

  // 3. Fall back to first vertical
  return verticals[0]
}
