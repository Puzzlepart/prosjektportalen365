import strings from 'PortfolioWebPartsStrings'
import { ProjectListModel } from 'pp365-shared-library/lib/models'
import { IProjectListVertical, IProjectListState, IVerticalConfig } from './types'
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
 * Map of icon names (stored in vertical config `iconName`) to
 * FluentUI bundled icons. Extend this map when new icon names are introduced
 * in vertical configurations.
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
 * Shape of the parsed filter/visibility configuration for a vertical.
 *
 * - `fieldFilter` – AND conditions on raw SharePoint item field values
 *   (e.g. `{"GtIsParentProject": true}`, `{"GtIsProgram": true}`).
 *   Matched against `ProjectListModel.data` (the underlying SP item).
 *   Uses loose equality (`==`) to handle SP boolean variations.
 * - `clientFilter` – AND conditions on **computed** `ProjectListModel`
 *   boolean properties that require client-side enrichment
 *   (e.g. `hasUserAccess`, `isUserMember`).
 * - `visibilityRule` – conditions on `IProjectListState` boolean properties
 *   (e.g. `isUserInPortfolioManagerGroup`). The tab is hidden when any
 *   condition is not met.
 * - `requiresAccess` – special flag: project passes if the user is a
 *   portfolio manager **OR** has access to the project.
 */
export interface IDataSourceConfig {
  fieldFilter?: Record<string, any>
  clientFilter?: Record<string, boolean>
  visibilityRule?: Record<string, boolean>
  requiresAccess?: boolean
}

/**
 * Safely parses a JSON string into an object. Returns an empty object
 * on parse errors or when the input is falsy.
 */
function parseConfig(configJson: string): Record<string, any> {
  if (!configJson) return {}
  try {
    return JSON.parse(configJson)
  } catch {
    return {}
  }
}

/**
 * Builds a client-side filter function from an `IDataSourceConfig`.
 *
 * Evaluation order:
 * 1. `visibilityRule` – state-level gate (e.g. portfolio-manager-only tabs)
 * 2. `fieldFilter` – raw SP item field matching (e.g. `GtIsParentProject`)
 * 3. `clientFilter` – computed model property matching (e.g. `hasUserAccess`)
 * 4. `requiresAccess` – portfolio manager OR user has access
 *
 * Returns `() => true` when no config is provided.
 */
function buildFilterFunction(
  config: IDataSourceConfig
): (project: ProjectListModel, state: IProjectListState) => boolean {
  const hasFieldFilter =
    config.fieldFilter && Object.keys(config.fieldFilter).length > 0
  const hasClientFilter =
    config.clientFilter && Object.keys(config.clientFilter).length > 0
  const hasVisibilityRule =
    config.visibilityRule && Object.keys(config.visibilityRule).length > 0
  const hasRequiresAccess = config.requiresAccess === true

  if (!hasFieldFilter && !hasClientFilter && !hasVisibilityRule && !hasRequiresAccess) {
    return () => true
  }

  return (project: ProjectListModel, state: IProjectListState): boolean => {
    // 1. Check visibility-rule conditions against state (acts as a gate)
    if (hasVisibilityRule) {
      for (const [key, expected] of Object.entries(config.visibilityRule)) {
        if ((state as any)[key] !== expected) return false
      }
    }

    // 2. Check field-filter conditions against raw SP item data.
    //    Uses loose equality (==) to handle SP boolean variations (true/1/"1").
    if (hasFieldFilter && project.data) {
      for (const [key, expected] of Object.entries(config.fieldFilter)) {
        // eslint-disable-next-line eqeqeq
        if ((project.data as any)[key] != expected) return false
      }
    }

    // 3. Check client-filter conditions against computed model properties
    if (hasClientFilter) {
      for (const [key, expected] of Object.entries(config.clientFilter)) {
        if ((project as any)[key] !== expected) return false
      }
    }

    // 4. requiresAccess: portfolio manager OR user has access
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
 * @param iconName Icon name from vertical config
 */
function resolveIcon(iconName: string): FluentIcon {
  return iconMap[iconName] ?? defaultIcon
}

/**
 * Converts an array of `IVerticalConfig` objects (from webpart properties)
 * into `IProjectListVertical[]` for use by the `ProjectList` component tab bar.
 *
 * Each config's JSON filter strings are parsed to derive client-side filter
 * and visibility logic. Order is preserved as-is (sorting is handled by
 * the property pane's drag-to-reorder).
 *
 * @param configs Array of vertical config objects from webpart properties
 * @returns Array of `IProjectListVertical` in the order provided
 */
export function convertConfigsToVerticals(
  configs: IVerticalConfig[]
): IProjectListVertical[] {
  return configs.map((cfg, index) => {
      const config: IDataSourceConfig = {
        clientFilter: parseConfig(cfg.clientFilter) as Record<string, boolean>,
        fieldFilter: parseConfig(cfg.fieldFilter) as Record<string, any>,
        visibilityRule: parseConfig(cfg.visibilityRule) as Record<string, boolean>,
        requiresAccess: cfg.requiresAccess ?? false
      }
      const filter = buildFilterFunction(config)
      const isHidden = buildIsHiddenFunction(config)
      const key = `vertical-${index}`

      const vertical: IProjectListVertical = {
        key,
        value: key,
        text: cfg.title,
        icon: resolveIcon(cfg.iconName),
        searchBoxPlaceholder: cfg.searchBoxPlaceholder || strings.SearchBoxPlaceholderText,
        filter
      }

      if (isHidden) {
        vertical.isHidden = isHidden
      }

      return vertical
    })
}

/**
 * Finds the default vertical from the converted verticals.
 *
 * Priority order:
 * 1. Config with `isDefault === true` (matched by index)
 * 2. First vertical in the list
 *
 * @param configs Source vertical configs (used to check `isDefault`)
 * @param verticals Converted verticals (same order as configs)
 * @returns The default vertical, or `undefined` if no verticals exist
 */
export function findDefaultVertical(
  configs: IVerticalConfig[],
  verticals: IProjectListVertical[]
): IProjectListVertical | undefined {
  if (verticals.length === 0) return undefined

  const defaultIndex = configs.findIndex((cfg) => cfg.isDefault)
  if (defaultIndex >= 0 && defaultIndex < verticals.length) {
    return verticals[defaultIndex]
  }

  return verticals[0]
}
