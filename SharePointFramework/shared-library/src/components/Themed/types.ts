import { Theme } from "@fluentui/react-components"
import React, { HTMLProps } from "react"


export interface IThemedProps extends HTMLProps<HTMLDivElement> {
    theme?: Partial<Theme>
}
