import { FluentIcon } from '@fluentui/react-icons/lib/utils/createFluentIcon'
import { CSSProperties, MouseEventHandler } from 'react'
import { IFilterPanelProps } from '../FilterPanel'
import { SearchBoxProps } from '@fluentui/react-components'

/**
 * Props for the Toolbar component.
 */
export interface IToolbarProps {
  /**
   * An array of ListMenuItem objects to be displayed in the toolbar.
   */
  items?: ListMenuItem[]

  /**
   * An array of ListMenuItem objects to be displayed in the toolbar (far right side).
   */
  farItems?: ListMenuItem[]

  /**
   * Optional filter drawer rendered alongside the command bars.
   */
  filterPanel?: IFilterPanelProps
}

/**
 * Builds chainable toolbar commands, menus, checkable choices and search fields.
 */
export class ListMenuItem {
  text?: string

  name?: string

  /**
   * The value of the menu item if it is a MenuItemCheckbox
   */
  value?: string

  /**
   * Tooltip text; also names icon-only commands when ariaLabel is absent.
   */
  description?: string

  /**
   * The accessible name of an item whose text alone does not say what it does, such as a count
   * (WCAG 2.4.6). It must hold the text, so voice control finds the item by what it shows
   * (WCAG 2.5.3). Without it, an item is named by its text, or by its description when it has
   * none.
   */
  ariaLabel?: string

  /**
   * An icon component or a name resolved through the catalog, legacy aliases and Fabric fallback.
   */
  icon?: FluentIcon | string

  onClick?: MouseEventHandler<any>

  disabled?: boolean

  hidden?: boolean

  /**
   * Checked state.
   */
  checkedValues?: Record<string, string[]>

  type?: 'divider' | 'header' | 'default'

  width?: string | number

  /**
   * Whether a menu's button gives way when the toolbar runs short of room (`makeShrinkable`).
   */
  shrinkable?: boolean

  style?: CSSProperties

  items?: ListMenuItem[]

  searchBox: SearchBoxProps

  /**
   * Creates a new instance of `ListMenuItem`. Use the Fluent API pattern
   * to set properties on the instance.
   *
   * @param text The text to display in the menu item (optional)
   * @param description The text to display in the tooltip for the menu item (optional)
   */
  constructor(text?: string, description?: string) {
    this.text = text
    this.description = description
  }

  /**
   * Sets the accessible name of the `ListMenuItem`, for an item whose text alone does not say
   * what it does. The name must hold the text.
   */
  public setAriaLabel(ariaLabel: ListMenuItem['ariaLabel']) {
    this.ariaLabel = ariaLabel
    return this
  }

  /**
   * Sets a catalog or legacy icon name, or an icon component.
   */
  public setIcon(icon: ListMenuItem['icon']) {
    this.icon = icon
    return this
  }

  /**
   * Sets the command's click handler.
   */
  public setOnClick(onClick: ListMenuItem['onClick']) {
    this.onClick = onClick
    return this
  }

  /**
   * Controls whether the command is disabled.
   */
  public setDisabled(disabled: ListMenuItem['disabled']) {
    this.disabled = disabled
    return this
  }

  /**
   * Controls whether the command is hidden.
   */
  public setHidden(hidden: ListMenuItem['hidden']) {
    this.hidden = hidden
    return this
  }

  /**
   * Selects normal, divider or header presentation.
   */
  public setType(type: ListMenuItem['type']) {
    this.type = type
    return this
  }

  /**
   * Assigns the checked-value group and value used by a menu checkbox.
   */
  public makeCheckable({ name, value }: Pick<ListMenuItem, 'name' | 'value'>) {
    this.name = name
    this.value = value
    return this
  }

  /**
   * Overrides the command's inline presentation.
   */
  public setStyle(style: ListMenuItem['style']) {
    this.style = style
    return this
  }

  /**
   * Sets a fixed command width; use makeShrinkable for responsive selectors.
   */
  public setWidth(width: ListMenuItem['width']) {
    this.width = width
    return this
  }

  /**
   * Lets a menu's button give way first when the toolbar runs short of room: its label shortens
   * with an ellipsis until only the icon is left, before the search box or the title beside the
   * toolbar shrink (`Toolbar.module.scss`, and the host's own stylesheet, as `List/ListHeader`).
   * For a selector whose label shows the current choice, such as a view selector. It replaces
   * `setWidth`, which would hold the button at its full width; the whole label stays in the
   * button's name.
   */
  public makeShrinkable() {
    this.shrinkable = true
    return this
  }

  /**
   * Sets child commands, dropping falsy entries, and optionally their checked values.
   */
  public setItems(items: ListMenuItem['items'], checkedValues?: ListMenuItem['checkedValues']) {
    this.items = items.filter(Boolean)
    if (checkedValues) this.checkedValues = checkedValues
    return this
  }

  /**
   * Configures a toolbar search field instead of a command button.
   */
  public setSearchBox(searchBox: ListMenuItem['searchBox']) {
    this.searchBox = searchBox
    return this
  }

  /**
   * Sets the condition for the `ListMenuItem`.
   * - If the condition is false, the `ListMenuItem` will not be rendered.
   * - If the condition is true, the `ListMenuItem` will be rendered.
   *
   * @remarks Ensure this method is called last in the chain, as it will return
   * `null` if the condition is false.
   */
  public makeConditional(condition: boolean) {
    if (condition) return this
    return null
  }
}

/**
 * A divider menu item for the list toolbar.
 */
export const ListMenuItemDivider = new ListMenuItem().setType('divider')

/**
 * Creates a non-interactive header entry for a toolbar menu.
 */
export const ListMenuItemHeader = (text: string) => new ListMenuItem(text).setType('header')
