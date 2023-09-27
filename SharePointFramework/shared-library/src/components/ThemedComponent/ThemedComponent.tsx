import { FluentProvider, useId, webLightTheme } from "@fluentui/react-components"
import { PortalCompatProvider } from '@fluentui/react-portal-compat'
import React, { FC } from "react"
import { IThemedComponentProps } from "./types"
import { WebPartTitle } from "../WebPartTitle"

export const ThemedComponent: FC<IThemedComponentProps> = (props) => {
    const fluentProviderId = useId('fluent-provider')
    return (
        <FluentProvider id={fluentProviderId} className={props.className} theme={props.theme}>
            <PortalCompatProvider>
                {props.title && <WebPartTitle title={props.title} />}
                {props.children}
            </PortalCompatProvider>
        </FluentProvider>
    )
}

ThemedComponent.displayName = 'Themed'
ThemedComponent.defaultProps = {
    theme: webLightTheme
}