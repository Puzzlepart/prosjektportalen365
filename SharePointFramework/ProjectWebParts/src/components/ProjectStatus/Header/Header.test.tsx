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
  it('renders the title as the heading, with an info button for the description', () => {
    render(<Header />)
    // WebPartTitle renders one <h2> (#1788: it was an <h2> around a second heading), and an info
    // button named after the title, whose popover shows the description. The name is Norwegian,
    // as the strings resolve in tests; the library's strings have no typings here.
    expect(
      screen.getByRole('heading', { level: 2, name: 'Prosjektstatus – Delprosjekt A' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Informasjon om Prosjektstatus – Delprosjekt A' })
    ).toBeInTheDocument()
  })
})
