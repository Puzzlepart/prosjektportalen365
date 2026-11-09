jest.mock('../context', () => ({
  useProjectStatusContext: () => ({
    state: {
      selectedReport: {
        getStatusValue: (fieldName: string) =>
          fieldName === 'GtStatusTime'
            ? { value: 'I rute', comment: 'Alt går etter planen.' }
            : { value: 'Ukjent', comment: '' }
      },
      data: {
        columnConfig: [
          {
            columnFieldName: 'GtStatusTime',
            value: 'I rute',
            color: '#2da748',
            iconName: 'CheckmarkCircle'
          },
          { columnFieldName: 'GtStatusTime', value: 'Forsinket', color: '#ea5c73' }
        ]
      }
    }
  })
}))

import { renderHook } from '@testing-library/react'
import { useCreateContextValue } from './useCreateContextValue'

/**
 * A section's header: its status value with the colour and the icon the column configuration
 * gives that value, which the status icon and its mark are drawn with.
 */
describe('useCreateContextValue', () => {
  it("gives the section its status value's colour and own icon from the column configuration", () => {
    const { result } = renderHook(() => useCreateContextValue({}))
    const { headerProps } = result.current({
      name: 'Fremdrift',
      fieldName: 'GtStatusTime',
      iconName: 'Clock'
    } as any)
    expect(headerProps).toMatchObject({
      label: 'Fremdrift',
      value: 'I rute',
      comment: 'Alt går etter planen.',
      iconName: 'Clock',
      iconSize: 40,
      iconColor: '#2da748',
      statusIconName: 'CheckmarkCircle'
    })
  })

  it('draws a value the configuration does not know in grey, with no icon of its own', () => {
    const { result } = renderHook(() => useCreateContextValue({}))
    const { headerProps } = result.current({ name: 'Økonomi', fieldName: 'GtStatusBudget' } as any)
    expect(headerProps.iconColor).toBe('#444')
    expect(headerProps.statusIconName).toBeUndefined()
  })
})
