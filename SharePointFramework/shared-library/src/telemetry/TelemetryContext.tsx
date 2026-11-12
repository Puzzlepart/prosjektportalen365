import React, { createContext, FC, PropsWithChildren, useContext, useMemo } from 'react'
import {
  TelemetryEvent,
  TelemetryEventComponent,
  TelemetryTimingMetric,
  TelemetryVariant
} from './contract'
import { trackError, trackTiming, trackUsage } from './track'
import { isTelemetryComponent } from './validate'

/** What `useTelemetry` gives a component: the tracking calls, bound to its host's alias. */
export interface ITelemetryTracker {
  /** Counts a usage event for the host component. */
  track<E extends TelemetryEvent>(event: E, variant?: TelemetryVariant<E>): void
  /** Counts an error for the host component: the caught error, or an error code of the contract. */
  trackError(errorOrCode: unknown): void
  /** Counts a duration for the host component. */
  trackTiming(metric: TelemetryTimingMetric, milliseconds: number): void
}

/**
 * The alias (`manifest.alias`) of the web part or extension that hosts the components below it.
 * Shared-library components are used by several web parts, and count for the one they are in.
 */
export const TelemetryContext = createContext<string | undefined>(undefined)

/**
 * Gives the components below it their host's alias for telemetry. The base web parts wrap what
 * they render in it.
 */
export const TelemetryProvider: FC<PropsWithChildren<{ component: string }>> = ({
  component,
  children
}) => <TelemetryContext.Provider value={component}>{children}</TelemetryContext.Provider>

/**
 * The tracking calls for the component's host. Safe anywhere: without a provider, or with an alias
 * the contract does not know, the calls do nothing.
 */
export function useTelemetry(): ITelemetryTracker {
  const component = useContext(TelemetryContext)
  return useMemo<ITelemetryTracker>(() => {
    const host = isTelemetryComponent(component) ? component : undefined
    return {
      // The provider names any web part: whether the event is that web part's is checked where it
      // is counted, and an event of another component is dropped there.
      track: <E extends TelemetryEvent>(event: E, variant?: TelemetryVariant<E>) => {
        if (host) trackUsage(host as TelemetryEventComponent<E>, event, variant)
      },
      trackError: (errorOrCode) => {
        if (host) trackError(host, errorOrCode)
      },
      trackTiming: (metric, milliseconds) => {
        if (host) trackTiming(host, metric, milliseconds)
      }
    }
  }, [component])
}
