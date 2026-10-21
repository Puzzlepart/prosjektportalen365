import { render, screen } from '@testing-library/react'
import { axeComponent } from 'pp365-jest-config/lib/axe'
import * as React from 'react'
import { UrlColumn } from '.'

/**
 * The link cell. SharePoint gives a URL field's value as "address, description". The link's text
 * is the column's description when the column has one, else the link's own description, else the
 * address, as the column's settings say (`ColumnRenderOptionUrlDescriptionDescription`).
 */
const HOMEPAGE = 'https://contoso.sharepoint.com/sites/frisbee'

describe('UrlColumn', () => {
  it("shows the link's own description, and opens it in the same tab unless told otherwise", async () => {
    const { container, rerender } = render(
      <UrlColumn columnValue={`${HOMEPAGE}, Frisbeegolfbane`} />
    )
    const link = screen.getByRole('link', { name: 'Frisbeegolfbane' })
    expect(link).toHaveAttribute('href', HOMEPAGE)
    expect(link).toHaveAttribute('target', '_self')
    expect(await axeComponent(container)).toHaveNoViolations()
    rerender(<UrlColumn columnValue={`${HOMEPAGE}, Frisbeegolfbane`} openInNewTab />)
    expect(screen.getByRole('link', { name: 'Frisbeegolfbane' })).toHaveAttribute(
      'target',
      '_blank'
    )
  })

  it("shows the column's description before the link's own", () => {
    render(<UrlColumn columnValue={`${HOMEPAGE}, Frisbeegolfbane`} description='Prosjektområde' />)
    expect(screen.getByRole('link', { name: 'Prosjektområde' })).toHaveAttribute('href', HOMEPAGE)
  })

  it('shows the address when there is no description (WCAG 2.4.4)', () => {
    render(<UrlColumn columnValue={HOMEPAGE} />)
    expect(screen.getByRole('link', { name: HOMEPAGE })).toHaveAttribute('href', HOMEPAGE)
  })

  it('renders nothing for an empty cell', () => {
    const { container } = render(<UrlColumn columnValue='' />)
    expect(container).toBeEmptyDOMElement()
  })
})
