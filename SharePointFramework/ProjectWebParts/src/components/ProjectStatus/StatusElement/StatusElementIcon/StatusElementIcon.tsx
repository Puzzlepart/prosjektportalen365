import { getFluentIconWithFallback } from 'pp365-shared-library'
import React, { FC, useContext } from 'react'
import { SectionContext } from '../../../ProjectStatus/Sections/context'
import styles from './StatusElementIcon.module.scss'
import { IStatusElementIconProps } from './types'

/**
 * Renders the icon for a status section. The icon name comes from the
 * `SectionContext` (`GtSecIcon` in the `Statusseksjoner` list) and is
 * resolved to a bundled Fluent UI icon (regular by default, filled on
 * hover via the parent's SCSS) with fallback to a UI Fabric font icon
 * for names that are not in the catalog or alias map.
 *
 * @param props Props for the component
 */
export const StatusElementIcon: FC<IStatusElementIconProps> = (props) => {
  const { headerProps } = useContext(SectionContext)
  return (
    <span className={styles.icon}>
      {getFluentIconWithFallback(headerProps.iconName, {
        size: props.iconSize,
        color: headerProps.iconColor
      })}
    </span>
  )
}
