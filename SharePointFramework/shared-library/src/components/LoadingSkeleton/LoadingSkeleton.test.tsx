import * as React from 'react'
import { render } from '@testing-library/react'
import { LoadingSkeleton } from './LoadingSkeleton'

/**
 * First component test in the repository. Besides covering the component it proves the harness:
 * Fluent UI v9 renders under jsdom, and `.module.scss` imports resolve to their class names.
 */
describe('LoadingSkeleton', () => {
  it('renders three skeleton items sized xlarge, large and medium', () => {
    const { container } = render(<LoadingSkeleton />)
    const items = container.querySelectorAll('.xlarge, .large, .medium')
    expect(items).toHaveLength(3)
    expect(container.firstElementChild).toHaveClass('loadingSkeleton')
  })

  it('forwards Fluent Skeleton props', () => {
    const { container } = render(<LoadingSkeleton aria-label='Laster' />)
    expect(container.firstElementChild).toHaveAttribute('aria-label', 'Laster')
  })
})
