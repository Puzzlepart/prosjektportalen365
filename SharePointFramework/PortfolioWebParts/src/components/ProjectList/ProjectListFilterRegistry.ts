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

/** Maps icon name strings to FluentUI bundled icon components. */
const iconMap: Record<string, FluentIcon> = {
  LockOpen: bundleIcon(LockOpenFilled, LockOpenRegular),
  PersonCircle: bundleIcon(PersonCircleFilled, PersonCircleRegular),
  Cube: bundleIcon(CubeFilled, CubeRegular),
  BoxMultiple: bundleIcon(BoxMultipleFilled, BoxMultipleRegular)
}

/** Default icon used when `iconName` is not found in the icon map. */
const defaultIcon = iconMap.Cube

/** Parsed filter/visibility configuration for a vertical tab. */
export interface IVerticalFilterConfig {
  fieldFilter?: Record<string, any>
  clientFilter?: Record<string, boolean>
  visibilityRule?: Record<string, boolean>
  requiresAccess?: boolean
}

/** Safely parses a JSON string. Returns `{}` on failure. */
function parseConfig(configJson: string): Record<string, any> {
  if (!configJson) return {}
  try {
    return JSON.parse(configJson)
  } catch {
    return {}
  }
}

/** Builds a client-side filter function from a vertical filter config. */
function buildFilterFunction(
  config: IVerticalFilterConfig
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

/** Builds an `isHidden` function from visibility rules. Returns `undefined` if none configured. */
function buildIsHiddenFunction(
  config: IVerticalFilterConfig
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

/** Resolves an icon name to a FluentUI bundled icon. Falls back to `Cube`. */
function resolveIcon(iconName: string): FluentIcon {
  return iconMap[iconName] ?? defaultIcon
}

/** Converts `IVerticalConfig[]` from webpart properties into `IProjectListVertical[]`. */
export function convertConfigsToVerticals(
  configs: IVerticalConfig[]
): IProjectListVertical[] {
  return configs.map((cfg, index) => {
      const config: IVerticalFilterConfig = {
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

/** Finds the default vertical (`isDefault === true`), falling back to the first one. */
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
