import { render } from '@testing-library/react'
import * as React from 'react'
import { StatusMark } from './StatusMark'

/**
 * The small shape beside a status icon (WCAG 1.4.1). It is hidden from screen readers: the icon
 * it sits beside is named by its status already.
 */
describe('StatusMark', () => {
  it('draws the shape for the colour, hidden from screen readers', () => {
    const { container } = render(<StatusMark color='#2da748' />)
    const mark = container.querySelector('[data-status-mark]')
    expect(mark).toHaveAttribute('data-status-mark', 'CheckmarkCircle')
    expect(mark).toHaveAttribute('aria-hidden', 'true')
    expect(mark.querySelector('svg')).not.toBeNull()
  })

  it("draws the status value's own icon where it has one", () => {
    const { container } = render(<StatusMark color='#2da748' iconName='Warning' />)
    expect(container.querySelector('[data-status-mark]')).toHaveAttribute(
      'data-status-mark',
      'Warning'
    )
  })

  it('draws nothing where the colour says nothing of the status', () => {
    const { container } = render(<StatusMark color='#444' />)
    expect(container).toBeEmptyDOMElement()
  })

  it('is 40 % of the icon beside it, and no smaller than 12 px', () => {
    const { container, rerender } = render(<StatusMark color='#ea5c73' iconSize={40} />)
    expect(container.querySelector('svg')).toHaveStyle({ width: '16px' })
    rerender(<StatusMark color='#ea5c73' iconSize={20} />)
    expect(container.querySelector('svg')).toHaveStyle({ width: '12px' })
    rerender(<StatusMark color='#ea5c73' />)
    expect(container.querySelector('svg')).toHaveStyle({ width: '12px' })
  })
})
