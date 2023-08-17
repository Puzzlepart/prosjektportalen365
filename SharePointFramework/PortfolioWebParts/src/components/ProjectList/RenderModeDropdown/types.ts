import {
  GridFilled,
  TextBulletListSquareFilled,
  TextBulletListLtrRegular
} from '@fluentui/react-icons'
import strings from 'PortfolioWebPartsStrings'
import { ProjectListRenderMode } from '../types'

export const tileOption = {
  value: 'tiles',
  text: strings.RenderModeTilesText,
  icon: GridFilled
}

export const listOption = {
  value: 'list',
  text: strings.RenderModeListText,
  icon: TextBulletListSquareFilled
}

export const compactListOption = {
  value: 'compactList',
  text: strings.RenderModeCompactListText,
  icon: TextBulletListLtrRegular
}

export interface IRenderModeDropdownProps {
  renderAs: ProjectListRenderMode
  onChange: (renderMode: ProjectListRenderMode) => void
}
