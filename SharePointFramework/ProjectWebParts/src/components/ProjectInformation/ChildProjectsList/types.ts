export interface IChildProjectsListState {
  /**
   * An array of project objects.
   */
  projects: any[]

  /**
   * A boolean indicating whether the component should shows the collapse/expand button.
   */
  shouldShowToggle: boolean

  /**
   * A boolean indicating whether to display all projects or just a subset (`props.rowLimit`)
   */
  viewAll: boolean
}
