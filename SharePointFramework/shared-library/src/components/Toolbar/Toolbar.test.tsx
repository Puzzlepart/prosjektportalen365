// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. A Fluent v9 menu costs seconds to open and to tear down under
// jsdom (see the testing guide), so the toolbar's menus are a stand-in that keeps Fluent's
// contract: the trigger puts the toggle and the menu button's state on its child, as Fluent's
// does, and the popover shows while open. The menu list and its items are Fluent's own.
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
  const MenuTrigger = ({ children }: any) => {
    const { open, toggle } = React.useContext(MenuContext)
    return React.cloneElement(React.Children.only(children), {
      onClick: toggle,
      'aria-haspopup': 'menu',
      'aria-expanded': open
    })
  }
  const MenuPopover = ({ children }: any) =>
    React.useContext(MenuContext).open ? React.createElement('div', null, children) : null
  return { __esModule: true, ...actual, Menu, MenuTrigger, MenuPopover }
})

import { useRestoreFocusTarget } from '@fluentui/react-components'
import { AddRegular } from '@fluentui/react-icons'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { axeComponent } from 'pp365-jest-config/lib/axe'
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

  it('marks its buttons as where the focus goes back to when what they opened from state closes (WCAG 2.4.3)', () => {
    // Fluent gives the focus back only to an element marked so; a panel opened from state, such
    // as the filter panel, has no trigger of Fluent's to mark it.
    let target: ReturnType<typeof useRestoreFocusTarget>
    const Probe: React.FC = () => {
      target = useRestoreFocusTarget()
      return null
    }
    render(
      <>
        <Probe />
        <Toolbar items={[new ListMenuItem(null, 'Filtrer').setIcon('Filter')]} />
      </>
    )
    const [attribute, value] = Object.entries(target)[0]
    expect(screen.getByRole('button', { name: 'Filtrer' })).toHaveAttribute(attribute, value)
  })

  it("marks a menu's button as where the focus goes back to when what its menu opened closes (WCAG 2.4.3)", () => {
    // A panel opened from a menu item, such as the overview's view form, opens from state after
    // the menu has closed; without the mark the focus was left on the page's start.
    let target: ReturnType<typeof useRestoreFocusTarget>
    const Probe: React.FC = () => {
      target = useRestoreFocusTarget()
      return null
    }
    render(
      <>
        <Probe />
        <Toolbar items={[new ListMenuItem('Visning').setItems([new ListMenuItem('Rediger')])]} />
      </>
    )
    const [attribute, value] = Object.entries(target)[0]
    expect(screen.getByRole('button', { name: 'Visning' })).toHaveAttribute(attribute, value)
  })

  it("says on a menu's button that it opens a menu, and whether it is open (WCAG 4.1.2)", () => {
    // The trigger puts these on its child, which was the box around the button.
    render(<Toolbar items={[new ListMenuItem('Visning').setItems([new ListMenuItem('Alle')])]} />)
    const button = screen.getByRole('button', { name: 'Visning' })
    expect(button).toHaveAttribute('aria-haspopup', 'menu')
    expect(button).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
  })

  it('keeps a disabled item from running, and lets the keyboard reach why (WCAG 2.1.1)', () => {
    const onClick = jest.fn()
    render(
      <Toolbar
        items={[
          new ListMenuItem('Slett', 'En publisert rapport kan ikke slettes')
            .setDisabled(true)
            .setOnClick(onClick)
        ]}
      />
    )
    // Focusable while disabled, so the toolbar's arrow keys reach it and a screen reader reads its
    // description, which says why it cannot be used.
    const button = screen.getByRole('button', { name: 'Slett' })
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).not.toHaveAttribute('disabled')
    expect(button).toHaveAttribute('title', 'En publisert rapport kan ikke slettes')
    fireEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
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

  it("names its search box's clear button in the page's language, where Fluent says «clear» (WCAG 3.1.2, 4.1.2)", () => {
    render(<Toolbar items={[new ListMenuItem().setSearchBox({ 'aria-label': 'Søk' })]} />)
    expect(
      screen.getByRole('button', { name: strings.Aria.SearchBoxClearLabel })
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'clear' })).toBeNull()
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

  it('opens a submenu from a menu item, for a menu holds only menu items (WCAG 1.3.1, 4.1.2)', () => {
    // The overview's view menu has the programs in a submenu; its trigger was a toolbar button
    // inside the menu, which axe found as a menu without the children it must have.
    const onProgram = jest.fn()
    render(
      <Toolbar
        items={[
          new ListMenuItem('Visning').setItems([
            new ListMenuItem('Alle'),
            new ListMenuItem('Velg et programområde').setItems([
              new ListMenuItem('Program A').setOnClick(onProgram)
            ])
          ])
        ]}
      />
    )
    fireEvent.click(screen.getByText('Visning'))
    expect(screen.queryByRole('button', { name: 'Velg et programområde' })).toBeNull()
    const trigger = screen.getByRole('menuitem', { name: 'Velg et programområde' })
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    fireEvent.click(trigger)
    fireEvent.click(screen.getByText('Program A'))
    expect(onProgram).toHaveBeenCalled()
    expect(screen.queryByText('Program A')).toBeNull()
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

  it('names every item, by its text, its description or its search box label, and breaks no rule axe can check', async () => {
    const { container } = render(
      <Toolbar
        items={[
          new ListMenuItem('Ny', 'Lag et nytt element').setIcon(AddRegular).setOnClick(jest.fn()),
          new ListMenuItem(null, 'Eksporter til Excel').setIcon('ExcelLogo').setOnClick(jest.fn()),
          new ListMenuItem('Visning', 'Velg visning').setItems([new ListMenuItem('Alle')]),
          new ListMenuItem().setSearchBox({ placeholder: 'Søk i listen', 'aria-label': 'Søk' })
        ]}
        farItems={[
          new ListMenuItem(null, 'Vis som kort').setIcon('GridView').setOnClick(jest.fn())
        ]}
      />
    )
    for (const name of ['Ny', 'Eksporter til Excel', 'Visning', 'Vis som kort']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
    expect(screen.getByRole('searchbox', { name: 'Søk' })).toBeInTheDocument()
    expect(await axeComponent(container)).toHaveNoViolations()
  })

  it('names an item whose text is only a count by the name it is given, which holds the count (WCAG 2.4.6, 2.5.3)', () => {
    const name = 'Eksporter 3 valgte elementer til Excel'
    render(
      <Toolbar
        items={[]}
        farItems={[
          new ListMenuItem('3', name).setAriaLabel(name).setIcon('ExcelLogo').setOnClick(jest.fn()),
          new ListMenuItem('2', 'Velg visning')
            .setAriaLabel('2 visninger')
            .setItems([new ListMenuItem('Alle')])
        ]}
      />
    )
    expect(screen.getByRole('button', { name })).toHaveTextContent('3')
    expect(screen.getByRole('button', { name: '2 visninger' })).toHaveTextContent('2')
  })
})
