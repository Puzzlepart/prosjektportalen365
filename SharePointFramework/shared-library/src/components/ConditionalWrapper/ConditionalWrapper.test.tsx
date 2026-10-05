import { render, screen } from '@testing-library/react'
import * as React from 'react'
import { ConditionalWrapper } from '.'

const wrapper = (children: React.ReactNode) => <section aria-label='innpakning'>{children}</section>

describe('ConditionalWrapper', () => {
  it('wraps its children when the condition holds, and leaves them as they are otherwise', () => {
    const { rerender } = render(
      <ConditionalWrapper condition wrapper={wrapper}>
        <span>Innhold</span>
      </ConditionalWrapper>
    )
    expect(screen.getByLabelText('innpakning')).toContainElement(screen.getByText('Innhold'))
    rerender(
      <ConditionalWrapper condition={false} wrapper={wrapper}>
        <span>Innhold</span>
      </ConditionalWrapper>
    )
    expect(screen.queryByLabelText('innpakning')).toBeNull()
    expect(screen.getByText('Innhold')).toBeInTheDocument()
  })
})
