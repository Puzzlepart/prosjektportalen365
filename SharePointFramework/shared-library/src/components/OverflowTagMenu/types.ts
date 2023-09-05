import { FluentIcon } from '@fluentui/react-icons/lib/utils/createFluentIcon'
import { InteractionTagProps } from '@fluentui/react-tags-preview'

export type OverflowMenuItemProps = {
  tag: InteractionTagProps
}

export interface IOverflowTagMenuProps {
  /**
   * Text to display.
   */
  text?: string

  /**
   * Whether the tags are hidden or not.
   */
  hidden?: boolean

  /**
   * The tags to display
   */
  tags: string[]

  /**
   * The minimum number of tags to display before showing the overflow menu
   */
  minimumVisibleTags?: number

  /**
   * The icon to display
   */
  icon?: FluentIcon
}
