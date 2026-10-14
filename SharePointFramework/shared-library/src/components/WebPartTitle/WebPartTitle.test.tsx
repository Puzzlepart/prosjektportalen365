import { act, cleanup, render, screen } from '@testing-library/react'
import { axeComponent } from 'pp365-jest-config/lib/axe'
import strings from 'SharedLibraryStrings'
import * as React from 'react'
import { WebPartTitle } from '.'
import { format } from '../../util'

afterEach(async () => {
  cleanup()
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
})

describe('WebPartTitle', () => {
  it('shows the title as one heading, with its description behind an info label', async () => {
    const { container } = render(
      <WebPartTitle title='Prosjektstatus' description='Status for <b>prosjektet</b>' />
    )
    // One heading: the h2 held a span with role="heading" as well, read as a second heading.
    expect(screen.getAllByRole('heading')).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 2, name: 'Prosjektstatus' })).toBeInTheDocument()
    // The info button is named in the site's language after the web part, where Fluent's own
    // name for it is "information", and the tooltip names the web part, not the description's HTML.
    const infoName = format(strings.Aria.InfoLabelTitle, 'Prosjektstatus')
    expect(screen.getByRole('button', { name: infoName })).toBeInTheDocument()
    expect(screen.getByTitle(infoName)).toBeInTheDocument()
    expect(await axeComponent(container)).toHaveNoViolations()
  })

  it('hides the heading without a title, and the info label without a description', () => {
    const { container } = render(<WebPartTitle />)
    expect(container.querySelector('h2')).not.toBeVisible()
    expect(screen.queryByTitle(/./)).toBeNull()
  })
})
