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

/**
 * Artifacts resolved from a **skymal** (cloud template) `.pppkg` at setup time.
 * Populated asynchronously when an `isCloudTemplate` template is selected;
 * `undefined` for local/imported templates. Read by the provisioning tasks
 * (`PreTask`, `CopyListData`) and the Extensions/List-content sections.
 */
export interface IResolvedCloudTemplate {
  /** Id of the skymal `ProjectTemplate` these artifacts belong to. */
  templateId: number
  /** The downloaded + unzipped package (source of template/extension/row data). */
  package: CloudTemplatePackage
  /** Bundled extensions — the available + selectable set for this skymal. */
  extensions: CloudProjectExtension[]
  /** Bundled list-content configs — the available + selectable set. */
  contentConfig: CloudContentConfig[]
}

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

  /**
   * Resolved skymal (cloud template) artifacts, set once the selected template's
   * `.pppkg` has been downloaded. `undefined` for local/imported templates.
   */
  resolvedCloudTemplate?: IResolvedCloudTemplate

  /**
   * `true` while the selected skymal's `.pppkg` is being downloaded/unzipped.
   */
  isResolvingCloudTemplate?: boolean

  /**
   * Error message when skymal resolution failed (download/parse).
   */
  cloudTemplateError?: string
}
