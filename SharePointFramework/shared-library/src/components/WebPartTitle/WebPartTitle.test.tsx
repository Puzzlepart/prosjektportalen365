import { act, cleanup, render, screen } from '@testing-library/react'
import strings from 'SharedLibraryStrings'
import * as React from 'react'
import { WebPartTitle } from '.'
import { format } from '../../util'

afterEach(async () => {
  cleanup()
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
})

describe('WebPartTitle', () => {
  it('shows the title as a heading, with its description behind an info label', () => {
    render(<WebPartTitle title='Prosjektstatus' description='Status for prosjektet' />)
    // The heading is a span inside the h2, so the text is looked up on the span.
    expect(screen.getByText('Prosjektstatus', { selector: 'span' })).toHaveAttribute(
      'role',
      'heading'
    )
    expect(
      screen.getByTitle(format(strings.Aria.InfoLabelTitle, 'Status for prosjektet'))
    ).toBeInTheDocument()
  })

  it('hides the heading without a title, and the info label without a description', () => {
    const { container } = render(<WebPartTitle />)
    expect(container.querySelector('h2')).not.toBeVisible()
    expect(screen.queryByTitle(/./)).toBeNull()
  })
})
