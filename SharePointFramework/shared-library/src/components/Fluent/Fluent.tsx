import { FluentProvider, IdPrefixProvider, useId } from '@fluentui/react-components'
import React, { FC } from 'react'
import { IFluentProps } from './types'
import { customLightTheme } from '../../util'

/**
 * Wraps its children in a v9 `FluentProvider` with the portal's theme and an id prefix of its own.
 * It renders the children it is given on every render: it once memoized the tree with no
 * dependencies, which froze whatever the first render chose, so the status page could never show
 * its error message once the data had failed to load.
 */
export const Fluent: FC<IFluentProps> = ({ className, style, children, transparent }) => {
  const fluentId = useId('fp-fluent')

  return (
    <IdPrefixProvider value={fluentId}>
      <FluentProvider
        theme={customLightTheme}
        className={className}
        style={{ backgroundColor: transparent ? 'transparent' : undefined, ...style }}
      >
        {children}
      </FluentProvider>
    </IdPrefixProvider>
  )
}
