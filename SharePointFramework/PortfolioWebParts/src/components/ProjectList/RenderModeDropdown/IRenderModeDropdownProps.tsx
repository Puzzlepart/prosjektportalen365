import { DropdownProps } from '@fluentui/react-components'
import { ProjectListRenderMode } from '../types'

export interface IRenderModeDropdownProps
  extends Omit<DropdownProps, 'options' | 'onOptionSelect'> {
  renderAs?: ProjectListRenderMode
  onOptionSelect?: (renderMode: ProjectListRenderMode) => void
}
