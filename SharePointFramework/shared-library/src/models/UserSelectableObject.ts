import { IObjectWithKey } from '@fluentui/react'

export class UserSelectableObject implements IObjectWithKey {
  /**
   * The `key` is the same as the `id` and corresponds to the item ID
   * in the SharePoint list
   */
  public key: number

  constructor(
    /**
     * The ID of the element corresponds to the item ID
     * in the SharePoint list
     */
    public id: number,

    /**
     * Text or title of the object/element.
     */
    public text: string,

    /**
     * Sub text or description of the object/element.
     */
    public subText: string,

    /**
     * Element is set as default meaning it should be selected by default.
     */
    public isDefault: boolean,

    /**
     * Element is set as locked meaning it can't be selected or de-selected by
     * the end user.
     */
    public isLocked: boolean,

    /**
     * Element is hidden and won't be displayed to the end user.
     */
    public hidden: boolean
  ) {
    this.key = this.id
    this.hidden = this.isLocked && !this.isDefault ? true : this.hidden
  }
}
