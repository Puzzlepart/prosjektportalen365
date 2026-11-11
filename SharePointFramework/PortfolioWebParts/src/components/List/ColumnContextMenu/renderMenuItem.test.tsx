import { Menu, MenuList, MenuPopover, MenuProps, MenuTrigger } from '@fluentui/react-components'
import { fireEvent, render, screen } from '@testing-library/react'
import { IMenuItem } from 'pp365-shared-library'
import * as React from 'react'
import { renderMenuItem } from './renderMenuItem'

/**
 * The column header menu's items, as the overview builds them: plain items, dividers, checkable
 * sort items and the column settings submenu. An item click runs the item's own handler and closes
 * the menu. One rendered menu for all of it: every open v9 menu costs tens of seconds to tear down
 * under jsdom, and the cost grows with each one.
 */

/** The menu as the overview hosts it: open state in React state, closed by the items' clicks. */
const HostedMenu: React.FC<{ items: IMenuItem[]; onOpenChange: jest.Mock }> = ({
  items,
  onOpenChange
}) => {
  const [open, setOpen] = React.useState(true)
  const handleOpenChange: MenuProps['onOpenChange'] = (event, data) => {
    setOpen(data.open)
    onOpenChange(event, data)
  }
  return (
    <Menu open={open} onOpenChange={handleOpenChange}>
      <MenuTrigger disableButtonEnhancement>
        <button>Kolonne</button>
      </MenuTrigger>
      <MenuPopover>
        <MenuList>{items.map((item) => renderMenuItem(item, handleOpenChange))}</MenuList>
      </MenuPopover>
    </Menu>
  )
}

describe('renderMenuItem', () => {
  it('renders every kind of item, and an item click runs its handler and closes the menu', () => {
    const onClick = jest.fn()
    const onOpenChange = jest.fn()
    render(
      <HostedMenu
        onOpenChange={onOpenChange}
        items={[
          {
            key: 'SORT_DESC',
            text: 'A til Å',
            canCheck: true,
            data: { name: 'sort', value: 'desc' }
          },
          { key: 'DIVIDER', itemType: 'divider' },
          { key: 'GROUP_BY', text: 'Grupper etter Fase', disabled: true },
          {
            key: 'COLUMN_SETTINGS',
            text: 'Kolonneinnstillinger',
            subMenuProps: { items: [{ key: 'EDIT_COLUMN', text: 'Rediger' }] }
          },
          { key: 'EDIT', text: 'Rediger kolonne', onClick }
        ]}
      />
    )
    expect(screen.getByRole('menuitemcheckbox', { name: 'A til Å' })).toBeInTheDocument()
    // The divider is a decorative node between the items, not an item.
    expect(screen.getByRole('menu').querySelectorAll('[role="presentation"]')).toHaveLength(1)
    expect(screen.getByRole('menuitem', { name: 'Grupper etter Fase' })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
    // A nested v9 menu cannot be opened under jsdom; its trigger is what is asserted.
    expect(screen.getByRole('menuitem', { name: 'Kolonneinnstillinger' })).toHaveAttribute(
      'aria-haspopup',
      'menu'
    )
    // Menu items are clicked with a plain click event: user-event's pointer sequence on a v9 menu
    // item never settles under jsdom.
    fireEvent.click(screen.getByRole('menuitem', { name: 'Rediger kolonne' }))
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick.mock.calls[0][1].key).toBe('EDIT')
    expect(onOpenChange).toHaveBeenCalledWith(null, { open: false })
    expect(screen.queryByRole('menuitem', { name: 'Rediger kolonne' })).toBeNull()
  })
})
