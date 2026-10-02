import { render, screen } from '@testing-library/react'
import strings from 'ProjectWebPartsStrings'
import * as React from 'react'
import { SectionContext } from '../Sections/context'
import { StatusElement } from './StatusElement'

/**
 * A section's status element: the label, the value and the comment, the comment truncated when
 * asked, and the icon-only variant that carries the label for screen readers.
 */
const headerProps = {
  label: 'Fremdrift',
  value: 'Grønn',
  comment: 'Alle milepæler er nådd.\nNeste fase starter i mars.',
  iconName: 'CheckmarkCircle',
  iconSize: 30,
  iconColor: '#107c10'
}

function renderElement(props: Record<string, any> = {}, header = headerProps) {
  render(
    <SectionContext.Provider value={{ headerProps: header, section: {} } as any}>
      <StatusElement {...props} />
    </SectionContext.Provider>
  )
}

describe('StatusElement', () => {
  it('shows the label, the value and the comment with its line breaks', () => {
    renderElement()
    expect(screen.getByText('Fremdrift')).toBeInTheDocument()
    expect(screen.getByText('Grønn')).toHaveAttribute(
      'title',
      `${strings.StatusElementText} Fremdrift: Grønn`
    )
    const comment = screen.getByText(/Alle milepæler er nådd/)
    expect(comment.innerHTML).toContain('<br>')
    expect(comment).toHaveTextContent('Neste fase starter i mars.')
  })

  it('truncates the comment to the given length', () => {
    renderElement({ truncateComment: 10 })
    expect(screen.getByText('Alle milep...')).toBeInTheDocument()
  })

  it('shows only the icon, labelled for screen readers, when asked', () => {
    renderElement({ iconsOnly: true, iconSize: 18 })
    const host = screen.getByRole('img', { name: 'Fremdrift' })
    expect(host.querySelector('.element')).toBeNull()
    expect(host.querySelector('.icon')).not.toBeNull()
  })

  it('shows a summation beside the value when the section has one', () => {
    renderElement({
      summation: { description: 'Sum budsjett', result: '1200', renderAs: 'currency' }
    })
    expect(screen.getByText('Sum budsjett')).toBeInTheDocument()
    expect(screen.getByText((content) => /1\D{0,2}200/.test(content))).toBeInTheDocument()
  })
})
