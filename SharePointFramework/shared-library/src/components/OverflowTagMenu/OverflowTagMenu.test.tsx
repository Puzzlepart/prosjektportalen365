// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. jsdom has no layout, so nothing ever overflows; the test says
// which tags are out of room (`overflow.hidden`, by value). The overflow menu is the menu
// stand-in of the testing guide: the trigger toggles through `onOpenChange`, and the popover
// shows while open.
const overflow: { hidden: string[] } = { hidden: [] }
jest.mock('@fluentui/react-components', () => {
  const actual = jest.requireActual('@fluentui/react-components')
  const React = jest.requireActual('react')
  const MenuContext = React.createContext({ open: false, toggle: () => undefined })
  const Menu = ({ children }: any) => {
    const [open, setOpen] = React.useState(false)
    return React.createElement(
      MenuContext.Provider,
      { value: { open, toggle: () => setOpen(!open) } },
      children
    )
  }
  const MenuTrigger = ({ children }: any) =>
    React.createElement('span', { onClick: React.useContext(MenuContext).toggle }, children)
  const MenuPopover = ({ children }: any) =>
    React.useContext(MenuContext).open ? React.createElement('div', null, children) : null
  return {
    __esModule: true,
    ...actual,
    Menu,
    MenuTrigger,
    MenuPopover,
    useIsOverflowItemVisible: (id: string) => !overflow.hidden.includes(id),
    useOverflowMenu: () => ({
      ref: { current: null },
      isOverflowing: overflow.hidden.length > 0,
      overflowCount: overflow.hidden.length
    })
  }
})

import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { axeComponent } from 'pp365-jest-config/lib/axe'
import strings from 'SharedLibraryStrings'
import * as React from 'react'
import { OverflowTagMenu } from '.'
import { format } from '../../util'

afterEach(async () => {
  overflow.hidden = []
  cleanup()
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
})

describe('OverflowTagMenu', () => {
  it('shows a tag for every value', () => {
    render(<OverflowTagMenu tags={['Helse', 'Skole', 'Kultur']} />)
    expect(screen.getByTitle('Helse')).toBeInTheDocument()
    expect(screen.getByTitle('Skole')).toBeInTheDocument()
    expect(screen.getByTitle('Kultur')).toBeInTheDocument()
  })

  it('counts the tags out of room, and lists them in a menu', () => {
    overflow.hidden = ['Skole', 'Kultur']
    render(<OverflowTagMenu tags={['Helse', 'Skole', 'Kultur']} />)
    const more = screen.getByTitle(format(strings.Aria.MenuOverflowCount, 2))
    expect(more).toHaveTextContent('+2')
    fireEvent.click(screen.getByText('+2'))
    expect(screen.getAllByTitle('Kultur')).toHaveLength(2)
    expect(screen.getAllByTitle('Skole')).toHaveLength(2)
    expect(screen.getAllByTitle('Helse')).toHaveLength(1)
  })

  it('renders nothing for no tags, and can be hidden', () => {
    const { container, rerender } = render(<OverflowTagMenu tags={[]} />)
    expect(container.firstElementChild).toBeEmptyDOMElement()
    rerender(<OverflowTagMenu tags={['Helse']} hidden />)
    expect(container.firstElementChild).not.toBeVisible()
  })

  it('lists the tags as text, not as buttons that do nothing, and names the button for the rest (WCAG 4.1.2)', async () => {
    overflow.hidden = ['Kultur']
    const { container } = render(
      <OverflowTagMenu text='Tjenesteområde' tags={['Helse', 'Skole', 'Kultur']} />
    )
    const list = screen.getByRole('list', { name: 'Tjenesteområde' })
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent)
    ).toEqual(['Helse', 'Skole', 'Kultur', '+1'])
    expect(screen.getAllByRole('button')).toEqual([
      screen.getByRole('button', { name: format(strings.Aria.MenuOverflowCount, 1) })
    ])
    expect(await axeComponent(container)).toHaveNoViolations()
  })
})
