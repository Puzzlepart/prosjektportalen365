import { FluentProvider, IdPrefixProvider, useId, webLightTheme } from '@fluentui/react-components'
import { PortalCompatProvider } from '@fluentui/react-portal-compat'
import React, { FC, useMemo } from 'react'
import { IFluentProps } from './types'

export const Fluent: FC<IFluentProps> = ({
  className,
  style,
  children,
  transparent,
  applyStylesToPortals
}) => {
  const fluentId = useId('fluent')
  return useMemo(
    () => (
      <IdPrefixProvider value={fluentId}>
        <FluentProvider
          theme={webLightTheme}
          className={className}
          style={{ backgroundColor: transparent && 'transparent', ...style }}
          applyStylesToPortals={applyStylesToPortals}
        >
          <PortalCompatProvider>{children}</PortalCompatProvider>
        </FluentProvider>
      </IdPrefixProvider>
    ),
    []
  )
}
