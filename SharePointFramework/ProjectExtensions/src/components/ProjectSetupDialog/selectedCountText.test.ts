import { getSelectedCountText } from './selectedCountText'

describe('getSelectedCountText', () => {
  it('names one item in the singular', () => {
    expect(getSelectedCountText(1)).toBe('1 valgt element')
  })

  it('names none and several in the plural', () => {
    expect(getSelectedCountText(0)).toBe('0 valgte elementer')
    expect(getSelectedCountText(2)).toBe('2 valgte elementer')
  })
})
