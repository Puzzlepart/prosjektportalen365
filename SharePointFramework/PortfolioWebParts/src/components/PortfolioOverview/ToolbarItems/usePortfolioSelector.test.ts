import { act, renderHook } from '@testing-library/react'
import strings from 'PortfolioWebPartsStrings'
import { TOGGLE_MERGED_VIEW } from '../reducer'
import { usePortfolioSelector } from './usePortfolioSelector'

/**
 * The portfolio overview's portfolio selector: one choice per configured portfolio and, with
 * more than one, the merged view; the selector is named after the choice and checks it.
 */
const PORTFOLIOS = [
  { uniqueId: 'a', title: 'Portefølje A', iconName: 'Briefcase' },
  { uniqueId: 'b', title: 'Portefølje B' }
] as any[]

function contextWith(props: Record<string, any> = {}, state: Record<string, any> = {}) {
  return {
    props: {
      portfolios: PORTFOLIOS,
      showPortfolioSelector: true,
      onSetPortfolio: jest.fn(),
      ...props
    },
    state: { isMergedView: false, isChangingView: false, ...state },
    dispatch: jest.fn()
  } as any
}

const selectorFor = (context: any) => renderHook(() => usePortfolioSelector(context))

describe('usePortfolioSelector', () => {
  it('names the selected portfolio, checks it, and offers every portfolio and the merged view', () => {
    const { result } = selectorFor(contextWith({ selectedPortfolioId: 'b' }))
    const selector = result.current
    expect(selector.text).toBe('Portefølje B')
    expect(selector.checkedValues).toEqual({ portfolios: ['b'] })
    expect(selector.hidden).toBe(false)
    expect(selector.disabled).toBe(false)
    expect(selector.items.map((item) => item.text ?? item.type)).toEqual([
      'Portefølje A',
      'Portefølje B',
      'divider',
      strings.MergedViewLabel
    ])
    // A portfolio without an icon gets the folder.
    expect(selector.items.map((item) => item.icon)).toEqual([
      'Briefcase',
      'Folder',
      undefined,
      'TextBulletListTree'
    ])
  })

  it('falls back to the first portfolio without a selection, or with one no longer configured', () => {
    for (const selectedPortfolioId of [undefined, 'removed']) {
      const { result } = selectorFor(contextWith({ selectedPortfolioId }))
      expect(result.current.text).toBe('Portefølje A')
      expect(result.current.checkedValues).toEqual({ portfolios: ['a'] })
    }
  })

  it('names and checks the merged view while it is shown', () => {
    const { result } = selectorFor(
      contextWith({ selectedPortfolioId: 'b' }, { isMergedView: true })
    )
    expect(result.current.text).toBe(strings.MergedViewLabel)
    expect(result.current.checkedValues).toEqual({ portfolios: ['merged'] })
  })

  it('offers no merged view with one portfolio, or when it is turned off', () => {
    const single = selectorFor(contextWith({ portfolios: [PORTFOLIOS[0]] })).result.current
    expect(single.items.map((item) => item.text)).toEqual(['Portefølje A'])
    const off = selectorFor(contextWith({ showMergedView: false })).result.current
    expect(off.items.map((item) => item.text)).toEqual(['Portefølje A', 'Portefølje B'])
  })

  it('is hidden without portfolios or when turned off, and disabled while a view changes', () => {
    const none = selectorFor(contextWith({ portfolios: undefined })).result.current
    expect(none.text).toBe(strings.PortfolioSelectorLabel)
    expect(none.items).toEqual([])
    expect(none.checkedValues).toEqual({ portfolios: [] })
    expect(none.hidden).toBe(true)
    expect(selectorFor(contextWith({ showPortfolioSelector: false })).result.current.hidden).toBe(
      true
    )
    expect(selectorFor(contextWith({}, { isChangingView: true })).result.current.disabled).toBe(
      true
    )
  })

  it('leaves the merged view when a portfolio is chosen, and tells the web part', () => {
    const context = contextWith({ selectedPortfolioId: 'a' })
    const { result } = selectorFor(context)
    act(() => result.current.items[1].onClick(undefined))
    expect(context.dispatch).toHaveBeenCalledWith(TOGGLE_MERGED_VIEW(false))
    expect(context.props.onSetPortfolio).toHaveBeenCalledWith('b')
    expect(result.current.text).toBe('Portefølje B')
    expect(result.current.checkedValues).toEqual({ portfolios: ['b'] })
  })

  it('shows the merged view when it is chosen, and tells the web part there is no portfolio', () => {
    const context = contextWith({ selectedPortfolioId: 'a' })
    const { result } = selectorFor(context)
    act(() => result.current.items[3].onClick(undefined))
    expect(context.dispatch).toHaveBeenCalledWith(TOGGLE_MERGED_VIEW(true))
    expect(context.props.onSetPortfolio).toHaveBeenCalledWith(null)
  })
})
