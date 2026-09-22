// jest.mock before imports: Heft runs Jest without Babel, so mocks are not hoisted.
const useContextMock = jest.fn()
jest.mock('../context', () => ({ usePortfolioOverviewContext: () => useContextMock() }))

import * as React from 'react'
import { render, screen } from '@testing-library/react'
import strings from 'PortfolioWebPartsStrings'
import { ResultsCount } from './ResultsCount'

describe('PortfolioOverview ResultsCount', () => {
  it('shows how many of the total projects are displayed, using the localized label', () => {
    useContextMock.mockReturnValue({ state: { items: new Array(42) } })
    render(<ResultsCount displayCount={10} />)
    const expected = strings.ResultsCountLabel.replace('{0}', '10').replace('{1}', '42')
    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  it('renders nothing outside the portfolio overview context', () => {
    useContextMock.mockReturnValue(null)
    const { container } = render(<ResultsCount displayCount={10} />)
    expect(container).toBeEmptyDOMElement()
  })
})
