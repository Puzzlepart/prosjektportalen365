export interface IProjectSetupProperties {
  /**
   * Templates library
   */
  templatesLibrary: string

  /**
   * Exensions library
   */
  extensionsLibrary: string

  /**
   * Projects list
   */
  projectsList: string

  /**
   * List content config list
   */
  contentConfigList: string

  /**
   * Term set IDs
   */
  termSetIds: { [key: string]: string }

  /**
   * Tasks
   */
  tasks: string[]
}
