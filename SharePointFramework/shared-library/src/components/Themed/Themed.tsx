import { FluentProvider, useId, webLightTheme } from "@fluentui/react-components";
import React, { FC } from "react";
import { IThemedProps } from "./types";

/**
 * Renders a component wrapped in a Fluent UI theme provider.
 * 
 * @param props - The props object containing the theme and children to render.
 * 
 * @returns - The rendered component.
 */
export const Themed: FC<IThemedProps> = ({ theme, className, children }) => {
    const fluentProviderId = useId('fluent-provider')
    return <FluentProvider id={fluentProviderId} className={className} theme={theme}>{children}</FluentProvider>
}

Themed.displayName = 'Themed'
Themed.defaultProps = {
    theme: webLightTheme
}