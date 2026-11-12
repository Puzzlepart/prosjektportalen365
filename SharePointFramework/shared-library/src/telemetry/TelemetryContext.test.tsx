import { renderHook } from '@testing-library/react'
import React, { FC, PropsWithChildren } from 'react'
import { attachTelemetryPortal } from './flush'
import { TelemetryProvider, useTelemetry } from './TelemetryContext'
import {
  countedTelemetry,
  hubPage,
  hubPortal,
  ITelemetryTestBed,
  settingsMap,
  telemetryStore,
  telemetryTestBed
} from './__fixtures__/testFixtures'
import { startTelemetry } from './track'

/** A provider for the alias, as a base web part wraps what it renders. */
function hostedBy(alias: string): FC<PropsWithChildren> {
  return ({ children }) => <TelemetryProvider component={alias}>{children}</TelemetryProvider>
}

/**
 * Components in the shared library are used by several web parts. The hook gives them the
 * tracking calls for the web part they are in, and is safe where there is none.
 */
describe('useTelemetry', () => {
  let bed: ITelemetryTestBed

  beforeEach(() => {
    bed = telemetryTestBed()
    startTelemetry(hubPage())
    attachTelemetryPortal(hubPortal(), settingsMap('3'))
  })

  afterEach(() => bed.restore())

  it('counts for the host component the provider names: its events, errors and durations', () => {
    const { result } = renderHook(() => useTelemetry(), {
      wrapper: hostedBy('PortfolioOverviewWebPart')
    })
    result.current.track('excel.exported')
    result.current.track('excel.exported')
    result.current.trackError({ status: 404 })
    result.current.trackError('render_failed')
    result.current.trackTiming('init', 300)

    const { usage, errors, timings } = telemetryStore()
    expect(Object.keys(usage).map((key) => usage[key])).toEqual([
      expect.objectContaining({ c: 'PortfolioOverviewWebPart', e: 'excel.exported', n: 2 })
    ])
    expect(Object.keys(errors).map((key) => errors[key])).toEqual([
      { c: 'PortfolioOverviewWebPart', code: 'not_found', http: 404, n: 1 },
      { c: 'PortfolioOverviewWebPart', code: 'render_failed', http: undefined, n: 1 }
    ])
    expect(Object.keys(timings).map((key) => timings[key])).toEqual([
      { c: 'PortfolioOverviewWebPart', m: 'init', h: [0, 1, 0, 0, 0, 0, 0] }
    ])
    // The same by name, as the tests of the solutions read what a component counted.
    expect(countedTelemetry()).toEqual({
      usage: { 'PortfolioOverviewWebPart excel.exported': 2 },
      errors: {
        'PortfolioOverviewWebPart not_found 404': 1,
        'PortfolioOverviewWebPart render_failed': 1
      },
      timings: { 'PortfolioOverviewWebPart init': 1 }
    })
  })

  it("drops an event that is not the host component's", () => {
    const { result } = renderHook(() => useTelemetry(), { wrapper: hostedBy('ProjectListWebPart') })
    result.current.track('excel.exported')
    result.current.track('tab.switched')
    const { usage } = telemetryStore()
    expect(Object.keys(usage).map((key) => usage[key].e)).toEqual(['tab.switched'])
  })

  it('does nothing without a provider, or with an alias the contract does not know', () => {
    const bare = renderHook(() => useTelemetry())
    const unknown = renderHook(() => useTelemetry(), { wrapper: hostedBy('KundensEgenWebPart') })
    ;[bare.result.current, unknown.result.current].forEach((telemetry) => {
      expect(() => {
        telemetry.track('excel.exported')
        telemetry.trackError(new Error('Noe gikk galt'))
        telemetry.trackTiming('init', 10)
      }).not.toThrow()
    })
    const { usage, errors, timings } = telemetryStore()
    expect([usage, errors, timings]).toEqual([{}, {}, {}])
  })

  it('gives the same calls on every render, so they are safe in dependency lists', () => {
    const { result, rerender } = renderHook(() => useTelemetry(), {
      wrapper: hostedBy('ProjectStatusWebPart')
    })
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
    expect(result.current.track).toBe(first.track)
  })
})
