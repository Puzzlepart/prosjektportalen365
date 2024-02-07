import { FluentProvider, IdPrefixProvider, useId } from '@fluentui/react-components'
import React, { FC, useMemo } from 'react'
import { IFluentProps } from './types'
import { customLightTheme } from '../../util'

export const Fluent: FC<IFluentProps> = ({ className, style, children, transparent }) => {
  const fluentId = useId('fp-fluent')

  return useMemo(
    () => (
      <IdPrefixProvider value={fluentId}>
        <FluentProvider
          theme={customLightTheme}
          className={className}
          style={{ backgroundColor: transparent && 'transparent', ...style }}
        >
          {children}
        </FluentProvider>
      </IdPrefixProvider>
    ),
    []
  )
}
