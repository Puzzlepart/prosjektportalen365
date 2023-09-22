import { Icon } from '@fluentui/react'
import {
  bundleIcon,
  AppsListFilled,
  AppsListRegular,
  GridFilled,
  GridRegular,
  TextBulletListLtrFilled,
  TextBulletListLtrRegular,
  TextSortAscendingFilled,
  TextSortAscendingRegular,
  TextSortDescendingFilled,
  TextSortDescendingRegular,
  TableSettingsRegular,
  TableSettingsFilled,
  GroupListRegular,
  GroupListFilled,
  TableCellEditRegular,
  TableCellEditFilled,
  ArrowLeftRegular,
  ArrowLeftFilled,
  ArrowRightRegular,
  ArrowRightFilled,
  EyeRegular,
  EyeFilled,
  AddRegular,
  AddFilled,
  ArrowSort24Regular,
  ArrowSort24Filled
} from '@fluentui/react-icons'
import React, { CSSProperties } from 'react'

/**
 * An object containing the available Fluent icons and their corresponding regular and filled versions.
 */
const iconCatalog = {
  ArrowSort: {
    regular: ArrowSort24Regular,
    filled: ArrowSort24Filled
  },
  Grid: {
    regular: GridRegular,
    filled: GridFilled
  },
  AppsList: {
    regular: AppsListRegular,
    filled: AppsListFilled
  },
  TextBulletList: {
    regular: TextBulletListLtrRegular,
    filled: TextBulletListLtrFilled
  },
  TextSortAscending: {
    regular: TextSortAscendingRegular,
    filled: TextSortAscendingFilled
  },
  TextSortDescending: {
    regular: TextSortDescendingRegular,
    filled: TextSortDescendingFilled
  },
  TableSettings: {
    regular: TableSettingsRegular,
    filled: TableSettingsFilled
  },
  GroupList: {
    regular: GroupListRegular,
    filled: GroupListFilled
  },
  TableCellEdit: {
    regular: TableCellEditRegular,
    filled: TableCellEditFilled
  },
  ArrowLeft: {
    regular: ArrowLeftRegular,
    filled: ArrowLeftFilled
  },
  ArrowRight: {
    regular: ArrowRightRegular,
    filled: ArrowRightFilled
  },
  Eye: {
    regular: EyeRegular,
    filled: EyeFilled
  },
  Add: {
    regular: AddRegular,
    filled: AddFilled
  }
}

/**
 * Represents the name of a Fluent UI icon.
 */
export type FluentIconName = keyof typeof iconCatalog

/**
 * Returns the Fluent icon with the specified name.
 *
 * @param name - The name of the icon to retrieve.
 * @param bundle - Whether to bundle the filled and regular versions of the icon. Defaults to true.
 * @param color - The color to apply to the icon.
 * @param size - The size of the icon.
 *
 * @returns The specified Fluent icon.
 */
export function getFluentIcon(
  name: FluentIconName,
  bundle = true,
  color?: string,
  size?: number
) {
  if (!iconCatalog[name]) return null
  const icon = iconCatalog[name]
  const Icon = bundle ? bundleIcon(icon.filled, icon.regular) : icon.regular
  const props: { style?: CSSProperties } = {}
  if (color) props.style = { color }
  if (size) {
    props.style = {
      ...props.style,
      width: size,
      height: size
    }
  }
  return <Icon {...props} />
}

/**
 * Returns an array of strings representing the names of all available Fluent icons.
 *
 * @returns An array of strings representing the names of all available Fluent icons.
 */
export function getFluentIcons() {
  return Object.keys(iconCatalog).map((key) => ({
    name: key,
    hasFilledIcon: !!iconCatalog[key].filled
  }))
}

/**
 * Returns a Fluent UI icon component with fallback to a an icon from `@fluentui/react`.
 *
 * @param name - The name of the icon to retrieve.
 * @param bundleWithFilled - Whether to bundle the icon with the filled version. Defaults to true.
 * @param color - The color of the icon.
 *
 * @returns A Fluent UI icon component or a default icon component if the requested icon is not found.
 */
export function getFluentIconWithFallback(
  name: string,
  bundleWithFilled = true,
  color?: string
) {
  if (iconCatalog[name]) {
    return getFluentIcon(name as FluentIconName, bundleWithFilled, color)
  }
  return <Icon iconName={name} style={{ color }} />
}
