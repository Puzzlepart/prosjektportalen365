/**
 * Shape of a context menu entry.
 *
 * Replaces `IContextualMenuItem` from Fluent UI v8. The menus themselves were
 * already rendered with the v9 `Menu`; only the data model was still v8, so
 * this declares exactly the fields the column context menus use rather than
 * pulling in the full v8 surface.
 */
export interface IMenuItem<TData = any> {
  /**
   * Unique key for the item.
   */
  key: string

  /**
   * Text shown for the item.
   */
  text?: string

  /**
   * Tooltip for the item.
   */
  title?: string

  /**
   * A `divider` renders a separator instead of an entry. Omitted means a normal
   * entry. Replaces `ContextualMenuItemType`, of which only `Divider` was used.
   */
  itemType?: 'divider'

  /**
   * Icon for the item, by name. Resolved through `getFluentIcon`.
   */
  iconProps?: { iconName?: string }

  /**
   * Invoked when the item is selected.
   */
  onClick?: (event?: any, item?: IMenuItem<TData>) => void

  /**
   * Whether the item is selectable.
   */
  disabled?: boolean

  /**
   * Renders the item as a checkbox entry rather than a plain one.
   */
  canCheck?: boolean

  /**
   * Checked state for a checkbox entry.
   */
  checked?: boolean

  /**
   * Arbitrary payload. Checkbox entries read `name` and `value` off it.
   */
  data?: TData

  /**
   * Link target, for items that navigate.
   */
  target?: string

  /**
   * Nested entries, rendered as a submenu.
   */
  subMenuProps?: { items: IMenuItem<TData>[] }
}
