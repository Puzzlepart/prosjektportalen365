import { InteractionTagProps } from '@fluentui/react-components'
import { FluentIcon } from '@fluentui/react-icons/lib/utils/createFluentIcon'

/**
 * Supplies the tag represented by an overflow menu item.
 */
export type OverflowMenuItemProps = {
  tag: InteractionTagProps
}

/**
 * Configures visible tags and their overflow menu.
 */
export interface IOverflowTagMenuProps {
  /**
   * The name of the tags' list, read by screen readers: what the tags are, such as the field's
   * display name.
   */
  text?: string

  hidden?: boolean

  tags: string[]

  /**
   * The minimum number of tags to display before showing the overflow menu
   */
  minimumVisibleTags?: number

  icon?: FluentIcon

  /**
   * If true, apply CSS constraints to limit tag width and enable text truncation
   */
  isTagPreview?: boolean
}
