import { FluentProvider, useId, webLightTheme } from '@fluentui/react-components'
import { PortalCompatProvider } from '@fluentui/react-portal-compat'
import React, { FC } from 'react'
import { IThemedComponentProps } from './types'
import { WebPartTitle } from '../WebPartTitle'

/**
 * A component that provides a Fluent UI theme and renders its children within a portal.
 */
export const ThemedComponent: FC<IThemedComponentProps> = (props) => {
  const fluentProviderId = useId('fluent-provider')
  return (
    <div ref={props.ref}>
      <FluentProvider
        id={fluentProviderId}
        className={props.className}
        theme={props.theme}
        style={{ background: 'transparent' }}
      >
        <PortalCompatProvider>
          {props.title && <WebPartTitle title={props.title} />}
          {props.children}
        </PortalCompatProvider>
      </FluentProvider>
    </div>
  )
}

ThemedComponent.displayName = 'ThemedComponent'
ThemedComponent.defaultProps = {
  theme: webLightTheme
}
