import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import strings from 'PortfolioWebPartsStrings'
import * as React from 'react'
import { ProjectMenu } from './ProjectMenu'

/**
 * The project's quick launch menu on its card and in the list: a link for each page, which the
 * keyboard opens as the pointer does, and which Escape closes. One test renders the menu: each
 * open v9 menu costs seconds to tear down under jsdom (the testing guide).
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
    const status = await screen.findByRole('menuitem', { name: 'Prosjektstatus' })
    expect(status).toHaveAttribute('href', '/sites/alfa/SitePages/Prosjektstatus.aspx')
    expect(screen.getByRole('menuitem', { name: 'Dokumenter' })).toHaveAttribute(
      'href',
      '/sites/alfa/Delte dokumenter'
    )

    // The pointer back on the button showed its tooltip, not drawn beside the open menu, and the
    // tooltip took the first Escape: the menu stayed open.
    fireEvent.pointerEnter(button)
    await act(() => new Promise((resolve) => setTimeout(resolve, 400)))
    fireEvent.keyDown(status, { key: 'Escape' })
    await waitFor(() =>
      expect(screen.queryByRole('menuitem', { name: 'Prosjektstatus' })).toBeNull()
    )
  })
})
