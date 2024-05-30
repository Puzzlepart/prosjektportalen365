import strings from 'PortfolioWebPartsStrings'
import { IRenderMode } from '../types'
import { Icons } from './icons'

export const renderModes: IRenderMode[] = [
  {
    value: 'tiles',
    text: strings.RenderModeTilesText,
    icon: Icons.Grid
  },
  {
    value: 'list',
    text: strings.RenderModeListText,
    icon: Icons.AppsList
  },
  {
    value: 'compactList',
    text: strings.RenderModeCompactListText,
    icon: Icons.TextBulletList
  }
]
