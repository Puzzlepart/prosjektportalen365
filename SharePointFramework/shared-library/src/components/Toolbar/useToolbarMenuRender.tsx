import {
  Menu,
  MenuDivider,
  MenuGroupHeader,
  MenuItem,
  MenuItemCheckbox,
  MenuList,
  MenuPopover,
  MenuProps,
  MenuTrigger,
  ToolbarButton,
  useRestoreFocusTarget
} from '@fluentui/react-components'
import React, { CSSProperties, useState } from 'react'
import { createIcon } from './createIcon'
import { createStyle } from './createStyle'
import { ListMenuItem } from './types'

export function useToolbarMenuRender() {
  // Where the focus goes back to when a panel or dialog a menu item opened closes: the panel opens
  // from state after the menu has closed, so Fluent has no trigger to return it to (WCAG 2.4.3).
  const restoreFocusTarget = useRestoreFocusTarget()

  /**
   * Renders a menu's toolbar button based on the provided list menu item. It is the menu
   * trigger's child itself, so the trigger's `aria-haspopup` and `aria-expanded` are the
   * button's (WCAG 4.1.2).
   *
   * @param item The list menu item to render the toolbar button for.
   * @param buttonStyle The style to apply to the toolbar button.
   * @param labelStyle The style to apply to the toolbar button label.
   *
   * @returns The rendered toolbar button component.
   */
  function renderMenuButton(
    item: ListMenuItem,
    buttonStyle: CSSProperties = {
      fontWeight: 'var(--fontWeightRegular)'
    },
    labelStyle: CSSProperties = {}
  ) {
    return (
      <ToolbarButton
        {...restoreFocusTarget}
        icon={createIcon(item)}
        title={item.description ?? item.text}
        aria-label={item.ariaLabel ?? (item.text ? undefined : item.description)}
        style={createStyle(item, buttonStyle)}
        onClick={item.onClick}
        // Focusable while disabled: the toolbar's arrow keys reach it, and a screen reader reads
        // the description that says why it cannot be used (WCAG 2.1.1).
        disabledFocusable={item.disabled}
      >
        {item.text && <span style={labelStyle}>{item.text}</span>}
      </ToolbarButton>
    )
  }

  /**
   * Renders a menu item based on the provided `IListMenuItem`.
   * If the `IListMenuItem` has a `value` property, it will render a `MenuItemCheckbox`.
   * If the `IListMenuItem` has an `items` property, it will recursively call `renderMenu`.
   * Otherwise, it will render a regular `MenuItem`.
   *
   * @param item - The `IListMenuItem` to render.
   * @param closeMenu - A function that closes the menu.
   *
   * @returns The rendered `MenuItem`, `MenuItemCheckbox`, or `Menu` (if `item` has `items`).
   */
  function renderMenuItem(item: ListMenuItem, closeMenu?: () => void) {
    if (item.type === 'divider') return <MenuDivider />
    if (item.type === 'header') return <MenuGroupHeader>{item.text}</MenuGroupHeader>

    if (item.value) {
      return (
        <div hidden={item.hidden}>
          <MenuItemCheckbox
            name={item.name}
            value={item.value}
            content={item.text}
            icon={createIcon(item)}
            style={createStyle(item)}
            disabled={item.disabled}
            onClick={(e) => {
              item.onClick(e)
              closeMenu && closeMenu()
            }}
          />
        </div>
      )
    }

    if (item.items) return renderMenu(item)

    return (
      <div hidden={item.hidden}>
        <MenuItem
          content={item.text}
          icon={createIcon(item)}
          style={createStyle(item)}
          disabled={item.disabled}
          onClick={(e) => {
            item.onClick(e)
            closeMenu && closeMenu()
          }}
        />
      </div>
    )
  }

  /**
   * Renders a menu for a list item.
   *
   * @param item - The list item to render the menu for.
   *
   * @returns The rendered menu.
   */
  function renderMenu(item: ListMenuItem) {
    return (
      <MenuComponent
        item={item}
        renderMenuButton={renderMenuButton}
        renderMenuItem={renderMenuItem}
      />
    )
  }

  return { renderMenuItem, renderMenu }
}

/**
 * Menu component that manages its own open state.
 */
function MenuComponent({
  item,
  renderMenuButton,
  renderMenuItem
}: {
  item: ListMenuItem
  renderMenuButton: (
    item: ListMenuItem,
    buttonStyle?: CSSProperties,
    labelStyle?: CSSProperties
  ) => JSX.Element
  renderMenuItem: (item: ListMenuItem, closeMenu?: () => void) => JSX.Element
}) {
  const hasCheckmarks = item.items.some((i) => i.value)
  const hasIcons = item.items.some((i) => i.icon)
  const [open, setOpen] = useState(false)
  const onOpenChange: MenuProps['onOpenChange'] = (_, data) => {
    setOpen(data.open)
  }

  // The box that hides the item is outside the trigger, whose child must be the button.
  return (
    <div hidden={item.hidden}>
      <Menu open={open} onOpenChange={onOpenChange} closeOnScroll positioning={{ autoSize: true }}>
        <MenuTrigger disableButtonEnhancement>
          {renderMenuButton(
            item,
            {
              justifyContent: 'left',
              fontWeight: 'var(--fontWeightRegular)',
              padding: '0 6px',
              minHeight: 32
            },
            { textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'inherit' }
          )}
        </MenuTrigger>
        <MenuPopover>
          <MenuList
            hasCheckmarks={hasCheckmarks}
            hasIcons={hasIcons}
            checkedValues={item.checkedValues}
          >
            {item.items.map((menuItem, index) => (
              // A ListMenuItem has no key of its own; the menu's order is stable, so the index is one.
              <React.Fragment key={index}>
                {renderMenuItem(menuItem, () => setOpen(false))}
              </React.Fragment>
            ))}
          </MenuList>
        </MenuPopover>
      </Menu>
    </div>
  )
}
