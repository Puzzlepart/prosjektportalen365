import strings from 'PortfolioWebPartsStrings'
import { IProjectListView } from './types'

/**
 * View configurations for `ProjectList`
 */
export const ProjectListViews: IProjectListView[] = [
  {
    itemKey: 'projects_access',
    headerText: strings.ProjectsAccessHeaderText,
    itemIcon: 'ViewList',
    searchBoxPlaceholder: strings.ProjectsAccessSearchBoxPlaceholderText,
    filter: (project) => project.hasUserAccess
  },
  {
    itemKey: 'my_projects',
    headerText: strings.MyProjectsHeaderText,
    itemIcon: 'FabricUserFolder',
    searchBoxPlaceholder: strings.MyProjectsSearchBoxPlaceholderText,
    filter: (project) => project.isUserMember
  },
  {
    itemKey: 'all_projects',
    headerText: strings.AllProjectsHeaderText,
    itemIcon: 'AllApps',
    searchBoxPlaceholder: strings.AllProjectsSearchBoxPlaceholderText,
    filter: () => true,
    isHidden: (state) => !state.isUserInPortfolioManagerGroup
  },
  {
    itemKey: 'parent_projects',
    headerText: strings.ParentProjectsHeaderText,
    itemIcon: 'ProductVariant',
    searchBoxPlaceholder: strings.ParentProjectsSearchBoxPlaceholderText,
    filter: (project, state) =>
      project.isParent && (state.isUserInPortfolioManagerGroup || project.isUserMember)
  },
  {
    itemKey: 'program_projects',
    headerText: strings.ProgramProjectsHeaderText,
    itemIcon: 'ProductList',
    searchBoxPlaceholder: strings.ProgramSearchBoxPlaceholderText,
    filter: (project, state) =>
      project.isProgram && (state.isUserInPortfolioManagerGroup || project.isUserMember)
  }
]
