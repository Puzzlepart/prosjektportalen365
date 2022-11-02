export interface IStatusElement {
  label?: string
  value?: string
  comment?: string
  iconName?: string
  height?: string | number
  iconSize?: number
  iconColor?: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IStatusElementProps extends Pick<IStatusElement, 'iconSize'> {
  truncateComment?: number
}
