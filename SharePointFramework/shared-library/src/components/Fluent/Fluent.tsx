import { FluentProvider, useId, webLightTheme } from '@fluentui/react-components'
import { PortalCompatProvider } from '@fluentui/react-portal-compat'
import React, { FC, useMemo } from 'react'
import { IFluentProps } from './types'

export const Fluent: FC<IFluentProps> = ({ children, transparent }) => {
  const fluentProviderId = useId('fluent-provider')
  return useMemo(
    () => (
      <FluentProvider
        id={fluentProviderId}
        theme={webLightTheme}
        style={transparent && { background: 'transparent' }}
      >
        <PortalCompatProvider>{children}</PortalCompatProvider>
      </FluentProvider>
    ),
    []
  )
}
