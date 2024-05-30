import strings from 'PortfolioWebPartsStrings'
import { getFluentIcon } from 'pp365-shared-library'
import { IRenderMode } from '../types'
import { FluentIcon } from '@fluentui/react-icons'

export const renderModes: IRenderMode[] = [
  {
    value: 'tiles',
    text: strings.RenderModeTilesText,
    icon: getFluentIcon<FluentIcon>('Grid', { jsx: false })
  },
  {
    value: 'list',
    text: strings.RenderModeListText,
    icon: getFluentIcon<FluentIcon>('AppsList', { jsx: false })
  },
  {
    value: 'compactList',
    text: strings.RenderModeCompactListText,
    icon: getFluentIcon<FluentIcon>('TextBulletList', { jsx: false })
  }
]
