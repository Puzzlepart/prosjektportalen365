import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import strings from 'PortfolioWebPartsStrings'
import * as React from 'react'
import { ProjectMenu } from './ProjectMenu'

/**
 * The project's quick launch menu on its card and in the list: a link for each page, which the
 * keyboard opens as the pointer does, and which Escape closes. The menu is Fluent's own, and
 * opening it under jsdom takes some 24 s on a loaded machine: CI took the test past the shared
 * 30 s (runs 42810507490 and 42810507326), so it has a limit of its own. The open menu is queried
 * by text, as the testing guide advises for a large Fluent tree.
 */
describe('ProjectMenu', () => {
  it('opens each page from a menu item that is the link, so the keyboard reaches it, and closes on Escape (WCAG 2.1.1)', async () => {
    render(
      <ProjectMenu
        project={{ url: '/sites/alfa' } as any}
        context={
          {
            quickLaunchMenu: [
              { order: 20, text: 'Dokumenter', relativeUrl: '/Delte dokumenter' },
              { order: 10, text: 'Prosjektstatus', relativeUrl: '/SitePages/Prosjektstatus.aspx' }
            ]
          } as any
        }
      />
    )
    const button = screen.getByRole('button', { name: strings.ProjectListQuickLaunch })
    fireEvent.click(button)
    // The link was inside the menu item, which took the focus and did nothing on Enter.
    const status = (await screen.findByText('Prosjektstatus')).closest('a')
    expect(status).toHaveAttribute('role', 'menuitem')
    expect(status).toHaveAttribute('href', '/sites/alfa/SitePages/Prosjektstatus.aspx')
    const documents = screen.getByText('Dokumenter').closest('a')
    expect(documents).toHaveAttribute('role', 'menuitem')
    expect(documents).toHaveAttribute('href', '/sites/alfa/Delte dokumenter')

    // The pointer back on the button showed its tooltip, not drawn beside the open menu, and the
    // tooltip took the first Escape: the menu stayed open.
    fireEvent.pointerEnter(button)
    await act(() => new Promise((resolve) => setTimeout(resolve, 400)))
    fireEvent.keyDown(status, { key: 'Escape' })
    await waitFor(() => expect(status).not.toBeInTheDocument())
  }, 120_000)
})
