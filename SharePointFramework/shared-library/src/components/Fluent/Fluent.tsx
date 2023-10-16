import { FluentProvider, useId, webLightTheme } from '@fluentui/react-components'
import { PortalCompatProvider } from '@fluentui/react-portal-compat'
import React, { FC, useMemo } from 'react'

export const Fluent: FC = ({ children }) => {
  const fluentProviderId = useId('fluent-provider')
  return useMemo(
    () => (
      <FluentProvider id={fluentProviderId} theme={webLightTheme}>
        <PortalCompatProvider>{children}</PortalCompatProvider>
      </FluentProvider>
    ),
    []
  )
}
