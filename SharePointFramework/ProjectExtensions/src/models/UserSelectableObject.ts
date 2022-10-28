import { IObjectWithKey } from '@fluentui/react'
import { ProjectTemplate } from './ProjectTemplate'

export class UserSelectableObject implements IObjectWithKey {
  public key: number

  constructor(
    public id: number,
    public text: string,
    public subText: string,
    public isDefault: boolean,
    public isLocked: boolean,
    public hidden: boolean
  ) {
    this.key = this.id
    this.hidden = this.isLocked && !this.isDefault ? true : this.hidden
  }

  /**
   * Checks if the user selectable object is mandatory for the specified template
   *
   * @param template Project template
   */
  public isMandatory(template: ProjectTemplate): boolean {
    return (
      (this.isLocked && this.isDefault) ||
      (template?.isDefaultExtensionsLocked && template?.extensionIds.includes(this.id))
    )
  }
}
