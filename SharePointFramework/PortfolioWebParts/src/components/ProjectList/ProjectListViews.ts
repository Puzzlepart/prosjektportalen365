import strings from 'PortfolioWebPartsStrings'
import { IProjectListView } from './types'

/**
 * View configurations for `ProjectList`
 */
export const ProjectListViews: IProjectListView[] = [
  {
    itemKey: 'my_projects',
    headerText: strings.MyProjectsHeaderText,
    itemIcon: 'FabricUserFolder',
    searchBoxPlaceholder: strings.MyProjectsSearchBoxPlaceholderText,
    filter: (project) => project.userIsMember
  },
  {
    itemKey: 'all_projects',
    headerText: strings.AllProjectsHeaderText,
    itemIcon: 'AllApps',
    searchBoxPlaceholder: strings.AllProjectsSearchBoxPlaceholderText,
    filter: () => true
  },
  {
    itemKey: 'parent_projects',
    headerText: strings.ParentProjectsHeaderText,
    itemIcon: 'ProductVariant',
    searchBoxPlaceholder: strings.ParentProjectsSearchBoxPlaceholderText,
    filter: (project) => project.isParent
  },
  {
    itemKey: 'program_projects',
    headerText: strings.ProgramProjectsHeaderText,
    itemIcon: 'ProductList',
    searchBoxPlaceholder: strings.ProgramSearchBoxPlaceholderText,
    filter: (project) => project.isProgram
  }
]
