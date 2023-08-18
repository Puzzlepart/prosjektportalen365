import { IProjectSetupData } from 'projectSetup/types'
import { ContentConfig, ProjectExtension, ProjectTemplate } from 'pp365-shared-library'
import { IBaseDialogProps } from '../@BaseDialog/types'
import React from 'react'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ITemplateSelectDialogSectionProps extends React.HTMLProps<HTMLDivElement> {}

export type TemplateSelectDialogSectionComponent = React.FC<ITemplateSelectDialogSectionProps>

export interface ITemplateSelectDialogProps extends IBaseDialogProps {
  /**
   * Data
   */
  data: IProjectSetupData

  /**
   * On submit callback
   */
  onSubmit: (data: ITemplateSelectDialogState) => void

  /**
   * Tasks
   */
  tasks?: string[]
}

export interface ITemplateSelectDialogState {
  /**
   * Currently selected project templates
   */
  selectedTemplate?: ProjectTemplate

  /**
   * Currently selected extensions
   */
  selectedExtensions?: ProjectExtension[]

  /**
   * Currently selected content configuration
   */
  selectedContentConfig?: ContentConfig[]
}
