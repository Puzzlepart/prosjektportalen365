import { fireEvent, render, screen } from '@testing-library/react'
import strings from 'PortfolioWebPartsStrings'
import * as React from 'react'
import { ProjectMenu } from './ProjectMenu'

/**
 * The project's quick launch menu on its card and in the list: a link for each page, which the
 * keyboard opens as the pointer does.
 */
describe('ProjectMenu', () => {
  it('opens each page from a menu item that is the link, so the keyboard reaches it (WCAG 2.1.1)', async () => {
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
    fireEvent.click(screen.getByRole('button', { name: strings.ProjectListQuickLaunch }))
    // The link was inside the menu item, which took the focus and did nothing on Enter.
    expect(await screen.findByRole('menuitem', { name: 'Prosjektstatus' })).toHaveAttribute(
      'href',
      '/sites/alfa/SitePages/Prosjektstatus.aspx'
    )
    expect(screen.getByRole('menuitem', { name: 'Dokumenter' })).toHaveAttribute(
      'href',
      '/sites/alfa/Delte dokumenter'
    )
  })
})
