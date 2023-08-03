import strings from 'PortfolioWebPartsStrings'
import { IProjectListVertical } from './types'
import {
  BoxFilled,
  BoxRegular,
  BoxToolboxFilled,
  BoxToolboxRegular,
  LockOpenFilled,
  LockOpenRegular,
  PersonCircleFilled,
  PersonCircleRegular,
  bundleIcon
} from '@fluentui/react-icons'

/**
 * Vertical configurations for `ProjectList`.
 *
 * The following verticals are available:
 * - `projects_access`: Projects the current user has access to
 * - `my_projects`: Projects the current user is a member of
 * - `all_projects`: All projects (not available for users with guest access)
 * - `parent_projects`: Parent projects (only available for Portfolio Managers and users with access to the project)
 * - `program_projects`: Program projects (only available for Portfolio Managers and users with access to the project)
 */
export const ProjectListVerticals: IProjectListVertical[] = [
  {
    key: 'projects_access',
    value: 'projects_access',
    text: strings.ProjectsAccessHeaderText,
    icon: bundleIcon(LockOpenFilled, LockOpenRegular),
    searchBoxPlaceholder: strings.ProjectsAccessSearchBoxPlaceholderText,
    filter: (project) => project.hasUserAccess
  },
  {
    key: 'my_projects',
    value: 'my_projects',
    text: strings.MyProjectsHeaderText,
    icon: bundleIcon(PersonCircleFilled, PersonCircleRegular),
    searchBoxPlaceholder: strings.MyProjectsSearchBoxPlaceholderText,
    filter: (project) => project.isUserMember
  },
  {
    key: 'all_projects',
    value: 'all_projects',
    text: strings.AllProjectsHeaderText,
    icon: bundleIcon(BoxFilled, BoxRegular),
    searchBoxPlaceholder: strings.AllProjectsSearchBoxPlaceholderText,
    filter: (_, state) => state.isUserInPortfolioManagerGroup,
    isHidden: (state) => !state.isUserInPortfolioManagerGroup
  },
  {
    key: 'parent_projects',
    value: 'parent_projects',
    text: strings.ParentProjectsHeaderText,
    icon: bundleIcon(BoxToolboxFilled, BoxToolboxRegular),
    searchBoxPlaceholder: strings.ParentProjectsSearchBoxPlaceholderText,
    filter: (project, state) =>
      project.isParent && (state.isUserInPortfolioManagerGroup || project.hasUserAccess)
  },
  {
    key: 'program_projects',
    value: 'program_projects',
    text: strings.ProgramProjectsHeaderText,
    icon: bundleIcon(BoxToolboxFilled, BoxToolboxRegular),
    searchBoxPlaceholder: strings.ProgramSearchBoxPlaceholderText,
    filter: (project, state) =>
      project.isProgram && (state.isUserInPortfolioManagerGroup || project.hasUserAccess)
  }
]
