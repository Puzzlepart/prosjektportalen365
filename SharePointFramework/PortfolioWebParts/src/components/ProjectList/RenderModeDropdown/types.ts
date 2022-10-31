import { IDropdownOption, IDropdownProps, IIconProps } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import { ProjectListRenderMode } from '../types'

export const TILE_OPTION = {
  key: 'tiles',
  text: strings.RenderAsTilesText,
  data: { iconProps: { iconName: 'Tiles' } }
} as RenderModeDropdownOption

export const LIST_OPTION = {
  key: 'list',
  text: strings.RenderAsListText,
  data: { iconProps: { iconName: 'PageList' } }
} as RenderModeDropdownOption

export type RenderModeDropdownOption = IDropdownOption<{ iconProps: IIconProps }>

export interface IRenderModeDropdownProps extends Omit<IDropdownProps, 'options' | 'onChange'> {
  onChange: (renderMode: ProjectListRenderMode) => void
}
