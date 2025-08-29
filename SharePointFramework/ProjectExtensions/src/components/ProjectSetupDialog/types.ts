import { ContentConfig, ProjectExtension, ProjectTemplate } from 'pp365-shared-library'
import { IProjectSetupData, ProjectSetupValidation } from 'extensions/projectSetup/types'
import { FC, HTMLProps } from 'react'
import { IBaseDialogProps } from '../@BaseDialog/types'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ITemplateSelectDialogSectionProps extends HTMLProps<HTMLDivElement> {}

export type ProjectSetupDialogSectionComponent = FC<ITemplateSelectDialogSectionProps>

export interface IProjectSetupDialogProps extends IBaseDialogProps {
  /**
   * Data for the project setup
   */
  data: IProjectSetupData

  /**
   * On submit callback
   */
  onSubmit: (data: IProjectSetupDialogState) => void

  /**
   * Tasks to execute
   */
  tasks?: string[]

  /**
   * Validation for the project setup
   */
  validation?: ProjectSetupValidation
}

export interface IProjectSetupDialogState {
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
