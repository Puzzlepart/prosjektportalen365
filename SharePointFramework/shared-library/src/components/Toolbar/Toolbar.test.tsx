// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. A Fluent v9 menu costs seconds to open and to tear down under
// jsdom (see the testing guide), so the toolbar's menus are a stand-in that keeps Fluent's
// contract: the trigger toggles through `onOpenChange`, and the popover shows while open. The menu
// list and its items are Fluent's own.
jest.mock('@fluentui/react-components', () => {
  const actual = jest.requireActual('@fluentui/react-components')
  const React = jest.requireActual('react')
  const MenuContext = React.createContext({ open: false, toggle: (_event: any) => undefined })
  const Menu = ({ open, onOpenChange, children }: any) =>
    React.createElement(
      MenuContext.Provider,
      { value: { open, toggle: (event: any) => onOpenChange?.(event, { open: !open }) } },
      children
    )
  const MenuTrigger = ({ children }: any) =>
    React.createElement('span', { onClick: React.useContext(MenuContext).toggle }, children)
  const MenuPopover = ({ children }: any) =>
    React.useContext(MenuContext).open ? React.createElement('div', null, children) : null
  return { __esModule: true, ...actual, Menu, MenuTrigger, MenuPopover }
})

import { AddRegular } from '@fluentui/react-icons'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import strings from 'SharedLibraryStrings'
import * as React from 'react'
import { ListMenuItem, ListMenuItemDivider, ListMenuItemHeader, Toolbar } from '.'
import { createStyle } from './createStyle'

afterEach(async () => {
  cleanup()
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
})

describe('ListMenuItem', () => {
  it('is built through its setters', () => {
    const onClick = jest.fn()
    const item = new ListMenuItem('Ny', 'Lag et nytt element')
      .setIcon('Add')
      .setOnClick(onClick)
      .setDisabled(true)
      .setHidden(true)
      .setStyle({ color: 'red' })
      .setWidth(120)
      .makeCheckable({ name: 'view', value: 'alle' })
    expect(item).toMatchObject({
      text: 'Ny',
      description: 'Lag et nytt element',
      icon: 'Add',
      onClick,
      disabled: true,
      hidden: true,
      style: { color: 'red' },
      width: 120,
      name: 'view',
      value: 'alle'
    })
  })

  it('leaves the empty entries out of its items and keeps the checked values', () => {
    const alle = new ListMenuItem('Alle')
    const item = new ListMenuItem('Visning').setItems([alle, null, undefined], { view: ['alle'] })
    expect(item.items).toEqual([alle])
    expect(item.checkedValues).toEqual({ view: ['alle'] })
  })

  it('is left out when its condition does not hold', () => {
    const item = new ListMenuItem('Eksporter')
    expect(item.makeConditional(true)).toBe(item)
    expect(new ListMenuItem('Eksporter').makeConditional(false)).toBeNull()
  })

  it('makes dividers and headers', () => {
    expect(ListMenuItemDivider.type).toBe('divider')
    expect(ListMenuItemHeader('Visninger')).toMatchObject({ text: 'Visninger', type: 'header' })
  })

  it('gives its width as the width and the least width of its style', () => {
    expect(
      createStyle(new ListMenuItem().setWidth(140).setStyle({ color: 'red' }), { margin: 0 })
    ).toEqual({
      color: 'red',
      margin: 0,
      width: 140,
      minWidth: 140
    })
  })
})

describe('Toolbar', () => {
  it('renders its items as buttons that run their action', () => {
    const onAdd = jest.fn()
    const onExport = jest.fn()
    render(
      <Toolbar
        items={[
          new ListMenuItem('Ny', 'Lag et nytt element').setIcon(AddRegular).setOnClick(onAdd),
          new ListMenuItem(null, 'Eksporter til Excel').setIcon('ExcelLogo').setOnClick(onExport)
        ]}
        farItems={[new ListMenuItem('Skjult').setHidden(true)]}
      />
    )
    fireEvent.click(screen.getByTitle('Lag et nytt element'))
    expect(onAdd).toHaveBeenCalled()
    // A button without text is named by its description.
    fireEvent.click(screen.getByRole('button', { name: 'Eksporter til Excel' }))
    expect(onExport).toHaveBeenCalled()
    expect(screen.getByText('Skjult')).not.toBeVisible()
  })

  it('keeps a disabled item from running', () => {
    const onClick = jest.fn()
    render(<Toolbar items={[new ListMenuItem('Slett').setDisabled(true).setOnClick(onClick)]} />)
    expect(screen.getByRole('button', { name: 'Slett' })).toBeDisabled()
  })

  it('renders a search item as a search box that reports what is typed', () => {
    const onChange = jest.fn()
    render(
      <Toolbar
        items={[
          new ListMenuItem().setSearchBox({
            placeholder: 'Søk i listen',
            'aria-label': 'Søk',
            onChange
          })
        ]}
      />
    )
    fireEvent.change(screen.getByPlaceholderText('Søk i listen'), { target: { value: 'Frisbee' } })
    expect(onChange).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ value: 'Frisbee' })
    )
  })

  it('opens the menu of an item with items, runs the chosen one and closes', () => {
    const onAll = jest.fn()
    const onMine = jest.fn()
    render(
      <Toolbar
        items={[
          new ListMenuItem('Visning', 'Velg visning').setItems(
            [
              ListMenuItemHeader('Visninger'),
              new ListMenuItem('Alle')
                .makeCheckable({ name: 'view', value: 'alle' })
                .setOnClick(onAll),
              ListMenuItemDivider,
              new ListMenuItem('Mine').setOnClick(onMine)
            ],
            { view: ['alle'] }
          )
        ]}
      />
    )
    expect(screen.queryByText('Visninger')).toBeNull()
    fireEvent.click(screen.getByText('Visning'))
    expect(screen.getByText('Visninger')).toBeInTheDocument()
    expect(screen.getByRole('menuitemcheckbox', { name: 'Alle' })).toHaveAttribute(
      'aria-checked',
      'true'
    )
    fireEvent.click(screen.getByText('Mine'))
    expect(onMine).toHaveBeenCalled()
    expect(screen.queryByText('Mine')).toBeNull()

    fireEvent.click(screen.getByText('Visning'))
    fireEvent.click(screen.getByText('Alle'))
    expect(onAll).toHaveBeenCalled()
  })

  it('opens the filter panel it is given', () => {
    render(
      <Toolbar
        items={[]}
        filterPanel={{ open: true, filters: [], onFilterChange: jest.fn(), onClose: jest.fn() }}
      />
    )
    expect(screen.getByText(strings.FiltersString)).toBeInTheDocument()
    expect(screen.getByText(strings.FilterPanelEmptyTitle)).toBeInTheDocument()
  })
})
