import { render } from '@testing-library/react'
import * as React from 'react'
import { PercentageColumn } from '.'

/**
 * The percentage cell (`Prosent`): search gives a share of one as text, which the cell shows as a
 * percentage with at most two decimals. An empty cell showed «0» without the sign, as if the value
 * were nought, and nought showed the same; some shares showed the noise of multiplying by 100.
 */
const cell = (columnValue: string) =>
  render(<PercentageColumn columnValue={columnValue} />).container.textContent

describe('PercentageColumn', () => {
  it('shows a share of one as a percentage', () => {
    expect(cell('0.5')).toBe('50%')
    expect(cell('1')).toBe('100%')
  })

  it('shows nothing for an empty cell', () => {
    expect(cell('')).toBe('')
    expect(cell(null)).toBe('')
    expect(cell(undefined)).toBe('')
  })

  it('shows nought with the sign', () => {
    expect(cell('0')).toBe('0%')
  })

  it('rounds to at most two decimals, with no trailing zeros and the dot kept', () => {
    // A share times 100 is not always exact: «0.07» showed «7.000000000000001%».
    const shares: [string, string][] = [
      ['0.07', '7%'],
      ['0.14', '14%'],
      ['0.28', '28%'],
      ['0.29', '29%'],
      ['0.55', '55%'],
      ['0.56', '56%'],
      ['0.57', '57%'],
      ['0.58', '58%'],
      ['0.125', '12.5%'],
      ['0.12345', '12.35%']
    ]
    for (const [share, shown] of shares) expect(cell(share)).toBe(shown)
  })
})
