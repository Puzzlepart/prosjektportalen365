import { InteractionTagProps } from '@fluentui/react-components'
import { FluentIcon } from '@fluentui/react-icons/lib/utils/createFluentIcon'

export type OverflowMenuItemProps = {
  tag: InteractionTagProps
}

export interface IOverflowTagMenuProps {
  /**
   * The name of the tags' list, read by screen readers: what the tags are, such as the field's
   * display name.
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

  /**
   * If true, apply CSS constraints to limit tag width and enable text truncation
   */
  isTagPreview?: boolean
}
