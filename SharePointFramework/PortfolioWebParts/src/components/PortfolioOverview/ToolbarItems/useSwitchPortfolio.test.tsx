import { FluentProvider, Toaster } from '@fluentui/react-components'
import { act, cleanup, render, screen } from '@testing-library/react'
import strings from 'PortfolioWebPartsStrings'
import { ListMenuItem, customLightTheme, format } from 'pp365-shared-library'
import * as React from 'react'
import { IPortfolioOverviewContext } from '../context'
import createReducer, { getInitialState } from '../reducer'
import { IPortfolioOverviewState } from '../types'
import { usePortfolioSelector } from './usePortfolioSelector'
import { useViewSelector } from './useViewSelector'

/**
 * A switch of portfolio, from the portfolio selector or to the merged view from the view selector:
 * the selectors show the pick at once, and the web part answers whether it could read the
 * portfolio's configuration. When it could not, it keeps the portfolio it showed, so the overview
 * goes back to it, a toast tells the user which switch failed, and the selectors can be used
 * again. The web part counts the switch and the failure (`portfolioOverview.test.ts`); the
 * overview counts neither.
 */
const TOASTER_ID = 'portfolio-switch-toaster'
const PORTFOLIOS = [
  { uniqueId: 'a', title: 'Helse' },
  { uniqueId: 'b', title: 'Bygg' }
] as any[]

/** Lets what a switch started, and what follows the web part's answer, run to its end. */
const settle = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)))

/** A web part whose answer to each switch the test gives when it wants to. */
function webPart() {
  const answers: Array<(isShown: boolean) => void> = []
  const onSetPortfolio = jest.fn(
    (_portfolioId: string | null) => new Promise<boolean>((resolve) => answers.push(resolve))
  )
  /** Answers the oldest switch not yet answered. */
  const answer = (isShown: boolean) => {
    answers.shift()(isShown)
    return settle()
  }
  return { onSetPortfolio, answer }
}

/**
 * The overview's two selectors on its own reducer, beside the toaster the overview renders.
 *
 * @param onSetPortfolio The web part's switch
 * @param isMergedView Whether the overview shows the merged view as the test starts
 */
function renderSelectors(onSetPortfolio: unknown, isMergedView = false) {
  const overview: {
    portfolioSelector?: ListMenuItem
    viewSelector?: ListMenuItem
    state?: IPortfolioOverviewState
  } = {}
  const props = {
    portfolios: PORTFOLIOS,
    selectedPortfolioId: isMergedView ? null : 'a',
    showPortfolioSelector: true,
    showViewSelector: true,
    showMergedViewInViewSelector: true,
    onSetPortfolio,
    configuration: { views: [], userCanAddViews: false },
    pageContext: { user: { email: 'kari@contoso.no' } }
  } as any
  const params = { props, placeholderColumns: [] }
  const reducer = createReducer(params)
  /** Builds the selectors as the overview does, on the state its reducer keeps. */
  const Probe: React.FC = () => {
    const [state, dispatch] = React.useReducer(reducer, {
      ...getInitialState(params),
      isMergedView
    })
    const context = { props, state, dispatch, toasterId: TOASTER_ID } as IPortfolioOverviewContext
    overview.portfolioSelector = usePortfolioSelector(context)
    overview.viewSelector = useViewSelector(context)
    overview.state = state
    return null
  }
  render(
    <FluentProvider theme={customLightTheme}>
      <Toaster toasterId={TOASTER_ID} />
      <Probe />
    </FluentProvider>
  )
  return overview
}

/** Picks the choice with the text from a selector's menu. */
function pick(selector: ListMenuItem, text: string) {
  act(() => selector.items.find((item) => item && item.text === text).onClick(undefined))
}

/** What a toast is headed when a switch to the portfolio, or to the merged view, failed. */
const failureTitle = (name: string) => format(strings.PortfolioSwitchErrorTitle, name)

/** The toasts that tell a switch to the portfolio, or to the merged view, failed. */
const failureToasts = (name: string) => screen.queryAllByText(failureTitle(name))

afterEach(async () => {
  cleanup()
  // The toaster keeps a timer for the toast; let it settle before the next test.
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
})

describe('useSwitchPortfolio', () => {
  it('shows the pick at once, and tells of a switch the web part could not make, back on the portfolio shown (WCAG 3.3.1, 4.1.3)', async () => {
    // The selector named the portfolio picked over the list of the one shown, and stayed
    // disabled: nothing ended the change of view.
    const { onSetPortfolio, answer } = webPart()
    const overview = renderSelectors(onSetPortfolio)
    expect(overview.portfolioSelector.text).toBe('Helse')
    pick(overview.portfolioSelector, 'Bygg')
    expect(onSetPortfolio).toHaveBeenCalledWith('b')
    expect(overview.portfolioSelector.text).toBe('Bygg')
    expect(overview.portfolioSelector.disabled).toBe(true)
    expect(failureToasts('Bygg')).toHaveLength(0)

    await answer(false)
    expect(await screen.findByText(failureTitle('Bygg'))).toBeInTheDocument()
    expect(screen.getByText(strings.PortfolioSwitchErrorText)).toBeInTheDocument()
    expect(overview.portfolioSelector.text).toBe('Helse')
    expect(overview.portfolioSelector.checkedValues).toEqual({ portfolios: ['a'] })
    expect(overview.state.isMergedView).toBe(false)
    // The user can pick again, from either selector.
    expect(overview.portfolioSelector.disabled).toBe(false)
    expect(overview.viewSelector.disabled).toBe(false)
  })

  it('shows a portfolio the web part switched to, with no word of a failure', async () => {
    const { onSetPortfolio, answer } = webPart()
    const overview = renderSelectors(onSetPortfolio)
    pick(overview.portfolioSelector, 'Bygg')
    await answer(false)
    expect(await screen.findByText(failureTitle('Bygg'))).toBeInTheDocument()
    expect(overview.portfolioSelector.text).toBe('Helse')

    // The same pick again, which the web part now makes.
    pick(overview.portfolioSelector, 'Bygg')
    await answer(true)
    expect(onSetPortfolio).toHaveBeenCalledTimes(2)
    expect(overview.portfolioSelector.text).toBe('Bygg')
    expect(overview.portfolioSelector.checkedValues).toEqual({ portfolios: ['b'] })
    expect(failureToasts('Bygg')).toHaveLength(1)
  })

  it('goes back to the merged view when a switch from it to a portfolio fails', async () => {
    const { onSetPortfolio, answer } = webPart()
    const overview = renderSelectors(onSetPortfolio, true)
    expect(overview.portfolioSelector.text).toBe(strings.MergedViewLabel)
    pick(overview.portfolioSelector, 'Bygg')
    expect(overview.state.isMergedView).toBe(false)
    expect(overview.portfolioSelector.text).toBe('Bygg')

    await answer(false)
    expect(await screen.findByText(failureTitle('Bygg'))).toBeInTheDocument()
    expect(overview.state.isMergedView).toBe(true)
    expect(overview.portfolioSelector.text).toBe(strings.MergedViewLabel)
    expect(overview.portfolioSelector.checkedValues).toEqual({ portfolios: ['merged'] })
  })

  it("leaves the merged view again when the view selector's switch to it fails, and names it in the toast", async () => {
    const { onSetPortfolio, answer } = webPart()
    const overview = renderSelectors(onSetPortfolio)
    pick(overview.viewSelector, strings.MergedViewLabel)
    expect(onSetPortfolio).toHaveBeenCalledWith(null)
    expect(overview.state.isMergedView).toBe(true)
    expect(overview.viewSelector.checkedValues.views).toEqual(['merged'])

    await answer(false)
    expect(await screen.findByText(failureTitle(strings.MergedViewLabel))).toBeInTheDocument()
    expect(overview.state.isMergedView).toBe(false)
    expect(overview.state.isChangingView).toBe(false)
    expect(overview.portfolioSelector.text).toBe('Helse')
  })

  it('takes a web part that answers nothing, or does not follow the portfolio, as one that switched', async () => {
    const silent = renderSelectors(jest.fn(() => Promise.resolve(undefined)))
    pick(silent.portfolioSelector, 'Bygg')
    await settle()
    expect(silent.portfolioSelector.text).toBe('Bygg')
    expect(failureToasts('Bygg')).toHaveLength(0)
    cleanup()

    const alone = renderSelectors(undefined)
    pick(alone.viewSelector, strings.MergedViewLabel)
    await settle()
    expect(alone.state.isMergedView).toBe(true)
    expect(failureToasts(strings.MergedViewLabel)).toHaveLength(0)
  })
})
