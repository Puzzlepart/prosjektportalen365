import { Theme } from "@fluentui/react-components"
import { HTMLProps } from "react"

export interface IThemedComponentProps extends HTMLProps<HTMLDivElement> {
    theme?: Partial<Theme>
}
