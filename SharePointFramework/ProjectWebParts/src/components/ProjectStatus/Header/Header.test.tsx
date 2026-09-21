// jest.mock must come BEFORE the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mock calls are not hoisted. TypeScript keeps statement order, which is what makes this work.
jest.mock('./useHeader', () => ({
  useHeader: jest.fn(() => ({ title: 'Prosjektstatus – Delprosjekt A', description: 'Publisert' }))
}))

import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { Header } from './Header'

/**
 * First component test in a consumer solution. Besides the component it proves that the shared
 * library (`WebPartTitle`) and the string modules resolve from a solution's test run, and shows the
 * pattern for every component whose data comes from a hook or a data adapter: replace the hook.
 */
describe('ProjectStatus Header', () => {
  it('renders the title as the heading and exposes the description on the info label', () => {
    render(<Header />)
    // WebPartTitle renders an <h2> around a span[role=heading]; both carry the text, so target the span.
    expect(
      screen.getByText('Prosjektstatus – Delprosjekt A', { selector: 'span' })
    ).toBeInTheDocument()
    // WebPartTitle shows the description in a popover; its trigger carries the description in the title.
    expect(screen.getByTitle(/Publisert/)).toBeInTheDocument()
  })
})
