import {
  CloudContentConfig,
  CloudProjectExtension,
  CloudTemplatePackage,
  ContentConfig,
  ProjectExtension,
  ProjectTemplate
} from 'pp365-shared-library'
import { IProjectSetupData, ProjectSetupValidation } from 'extensions/projectSetup/types'
import { FC, HTMLProps } from 'react'
import { IBaseDialogProps } from '../@BaseDialog/types'

/** Downloaded cloud package and its selectable extensions and list-content configurations. */
export interface IResolvedCloudTemplate {
  templateId: number
  package: CloudTemplatePackage
  extensions: CloudProjectExtension[]
  contentConfig: CloudContentConfig[]
}

interface ITemplateSelectDialogSectionProps extends HTMLProps<HTMLDivElement> {}

/** Setup section accepting standard container attributes. */
export type ProjectSetupDialogSectionComponent = FC<ITemplateSelectDialogSectionProps>

/** A group gets a search box only when it lists more items than this. */
export const SEARCH_MIN_ITEMS = 8

/** Available setup data, validation and submission handling for the wizard. */
export interface IProjectSetupDialogProps extends IBaseDialogProps {
  data: IProjectSetupData

  onSubmit: (data: IProjectSetupDialogState) => void

  tasks?: string[]

  validation?: ProjectSetupValidation

  /**
   * Asks again whether the user is a member of the site's group; Microsoft 365 takes some minutes
   * to register it on a new site. Resolves to whether the user is a member now.
   */
  onCheckGroupMembership?: () => Promise<boolean>
}

/** Setup selections and asynchronous cloud-template resolution state. */
export interface IProjectSetupDialogState {
  selectedTemplate?: ProjectTemplate

  selectedExtensions?: ProjectExtension[]

  selectedContentConfig?: ContentConfig[]

  /**
   * Resolved cloud template artifacts, set once the selected template's
   * `.pppkg` has been downloaded. `undefined` for local/imported templates.
   */
  resolvedCloudTemplate?: IResolvedCloudTemplate

  isResolvingCloudTemplate?: boolean

  cloudTemplateError?: string
}
