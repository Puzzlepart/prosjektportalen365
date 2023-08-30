import { FluentIcon } from '@fluentui/react-icons/lib/utils/createFluentIcon'
import { CSSProperties, MouseEventHandler } from 'react'

/**
 * Represents a menu item in the ListToolbar component. Supports
 * the Fluent API pattern using e.g. `new ListMenuItem().setIcon(...)`,
 * `new ListMenuItem().setOnClick(...)`, etc.
 */
export class ListMenuItem {
  /**
   * The text to display in the menu item.
   */
  text?: string

  /**
   * The name of the menu item.
   */
  name?: string

  /**
   * The value of the menu item if it is a MenuItemCheckbox
   */
  value?: string

  /**
   * The icon to display in the menu item. Could either be a
   * `FluentIcon` or a string representing the icon name. Then
   * the `<Icon />` component from `@fluentui/react`
   * will be used.
   */
  icon?: FluentIcon | string

  /**
   * On click event handler.
   */
  onClick?: MouseEventHandler<any>

  /**
   * Disabled state.
   */
  disabled?: boolean

  /**
   * Checked state.
   */
  checkedValues?: Record<string, string[]>

  /**
   * The type of the menu item.
   */
  type?: 'divider' | 'header' | 'default'

  /**
   * Custom width of the menu item.
   */
  width?: string | number

  /**
   * Custom style of the menu item.
   */
  style?: CSSProperties

  /**
   * Items to render in a sub menu.
   */
  items?: ListMenuItem[]

  /**
   * Creates a new instance of ListMenuItem.
   *
   * @param text The text to display in the menu item (optional).
   */
  constructor(text?: string) {
    this.text = text
  }

  /**
   * Sets the icon for the ListToolbar.
   *
   * @param icon The FluentIcon or string representing the icon to set.
   *
   * @returns The updated ListToolbar instance.
   */
  public setIcon(icon: ListMenuItem['icon']) {
    this.icon = icon
    return this
  }

  /**
   * Sets the on click event handler for the ListToolbar.
   *
   * @param onClick The on click event handler to set.
   *
   * @returns The updated ListToolbar instance.
   */
  public setOnClick(onClick: ListMenuItem['onClick']) {
    this.onClick = onClick
    return this
  }

  /**
   * Sets the disabled state for the ListToolbar.
   *
   * @param disabled The disabled state to set.
   *
   * @returns The updated ListToolbar instance.
   */
  public setDisabled(disabled: ListMenuItem['disabled']) {
    this.disabled = disabled
    return this
  }

  /**
   * Sets the type for the ListToolbar.
   *
   * @param type The type to set.
   *
   * @returns The updated ListToolbar instance.
   */
  public setType(type: ListMenuItem['type']) {
    this.type = type
    return this
  }

  /**
   * Makes the ListMenuItem checkable.
   *
   * @param name The name of the checkable item.
   * @param value The value of the checkable item.
   *
   * @returns The updated ListToolbar instance.
   */
  public makeCheckable({ name, value }: Pick<ListMenuItem, 'name' | 'value'>) {
    this.name = name
    this.value = value
    return this
  }

  /**
   * Sets the style of the list menu item.
   *
   * @param style The style to set for the list menu item.
   *
   * @returns The updated ListMenuItem instance.
   */
  public setStyle(style: ListMenuItem['style']) {
    this.style = style
    return this
  }

  /**
   * Sets the width for the ListToolbar.
   *
   * @param width The width to set.
   *
   * @returns The updated ListToolbar instance.
   */
  public setWidth(width: ListMenuItem['width']) {
    this.width = width
    return this
  }

  /**
   * Sets the items and checked values of the ListToolbar.
   *
   * @param items The new items to set.
   * @param checkedValues The new checked values to set.
   *
   * @returns The updated ListToolbar instance.
   */
  public setItems(items: ListMenuItem['items'], checkedValues?: ListMenuItem['checkedValues']) {
    this.items = items
    if (checkedValues) this.checkedValues = checkedValues
    return this
  }
}

export const ListMenuItemDivider = new ListMenuItem().setType('divider')

export const ListMenuItemHeader = (text: string) => new ListMenuItem(text).setType('header')
