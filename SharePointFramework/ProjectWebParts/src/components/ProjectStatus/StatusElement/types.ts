export interface IStatusElement {
  label?: string
  value?: string
  comment?: string
  iconName?: string
  height?: string | number
  iconSize?: number
  iconColor?: string
}

export interface IStatusElementProps extends Pick<IStatusElement, 'iconSize'> {
  truncateComment?: number
}
