import * as React from 'react'
import { render } from '@testing-library/react'
import { PackageListSkeleton } from './PackageListSkeleton'

describe('PackageListSkeleton', () => {
  it('renders one viewport of placeholder cards, hidden from assistive technology', () => {
    const { container } = render(<PackageListSkeleton />)
    const cards = container.querySelectorAll('.skeletonCard')
    expect(cards).toHaveLength(8)
    cards.forEach((card) => expect(card).toHaveAttribute('aria-hidden'))
    expect(container.firstElementChild).toHaveAttribute('role', 'presentation')
  })
})
