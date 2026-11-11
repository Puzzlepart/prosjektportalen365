import strings from 'PortfolioWebPartsStrings'
import { format } from 'pp365-shared-library'
import { lockedWhenEditing } from './lockedWhenEditing'

/**
 * A column form field's description says when the field cannot change: for a column that exists.
 */
describe('lockedWhenEditing', () => {
  it('leaves the description of a new column as it is', () => {
    expect(lockedWhenEditing('Feltets interne navn.', false)).toBe('Feltets interne navn.')
  })

  it("adds to an existing column's description that the field cannot change (WCAG 3.3.2)", () => {
    expect(lockedWhenEditing('Feltets interne navn.', true)).toBe(
      format(
        strings.ColumnFieldLockedDescription,
        'Feltets interne navn.',
        strings.ColumnFieldLockedText
      )
    )
    expect(lockedWhenEditing('Feltets interne navn.', true)).toContain(
      strings.ColumnFieldLockedText
    )
  })
})
