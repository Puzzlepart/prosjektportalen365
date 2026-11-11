import { AvatarProps } from '@fluentui/react-components'
import {
  BoxFilled,
  BoxMultipleFilled,
  BoxMultipleRegular,
  BoxRegular,
  BoxToolboxFilled,
  BoxToolboxRegular,
  BuildingFactoryFilled,
  BuildingFactoryRegular,
  BuildingFilled,
  BuildingRegular,
  CubeFilled,
  CubeRegular,
  bundleIcon
} from '@fluentui/react-icons'
import * as strings from 'PortfolioWebPartsStrings'
import { format } from 'pp365-shared-library'
import { useContext } from 'react'
import resource from 'SharedResources'
import _ from 'underscore'
import { ProjectCardContext } from '../context'

/** A person on the card: the picture's props, and the role the person has in the project. */
export interface IProjectCardPerson {
  avatar: AvatarProps
  role: string
  name: string
}

/**
 * Component logic hook for `ProjectCardFooter`. A person's `role` from the data adapter is the
 * field's internal name; it was spread onto the `Avatar` as its ARIA role (`role="GtProjectManager"`,
 * axe's critical `aria-roles`), so it is kept apart, and the picture is named by the role and the
 * name instead.
 */
export function useProjectCardFooter() {
  const context = useContext(ProjectCardContext)

  const getPersonaProps = (user: AvatarProps | undefined): IProjectCardPerson => {
    const { role: field, ...avatar } = user ?? {}
    const name = avatar.name || strings.NotSet
    const role =
      _.find(context.projectColumns, (col) => col.internalName === field)?.name || strings.NotSet
    return {
      avatar: {
        color: 'brand',
        ...avatar,
        name,
        'aria-label': format(strings.NameValueLabel, role, name)
      },
      role,
      name
    }
  }
  const primaryUserPersonaProps = getPersonaProps(context.project?.primaryUser)
  const secondaryUserPersonaProps = getPersonaProps(context.project?.secondaryUser)

  let ProjectTypeIcon = bundleIcon(BoxFilled, BoxRegular)
  let projectTypeText = context.project?.template

  switch (context.project?.template) {
    case resource.Lists_TemplateOptions_BuildingProject_Title:
      ProjectTypeIcon = bundleIcon(BuildingFilled, BuildingRegular)
      projectTypeText = resource.ProjectType_Building_Title
      break
    case resource.Lists_TemplateOptions_ConstructionProject_Title:
      ProjectTypeIcon = bundleIcon(BuildingFactoryFilled, BuildingFactoryRegular)
      projectTypeText = resource.ProjectType_Construction_Title
      break
    case resource.Lists_TemplateOptions_ProgramTemplate_Title:
      ProjectTypeIcon = bundleIcon(BoxMultipleFilled, BoxMultipleRegular)
      projectTypeText = resource.ProjectType_Program_Title
      break
    case resource.Lists_TemplateOptions_StandardTemplate_Title:
      if (context.project?.isParent) {
        ProjectTypeIcon = bundleIcon(BoxMultipleFilled, BoxMultipleRegular)
        projectTypeText = resource.ProjectType_Parent_Title
      } else {
        ProjectTypeIcon = bundleIcon(CubeFilled, CubeRegular)
        projectTypeText = resource.ProjectType_Project_Title
      }
      break
    default:
      ProjectTypeIcon = bundleIcon(BoxToolboxFilled, BoxToolboxRegular)
      projectTypeText = resource.ProjectType_Custom_Title
      break
  }
  return {
    phase: context.project?.phase,
    primaryUser: primaryUserPersonaProps,
    secondaryUser: secondaryUserPersonaProps,
    ProjectTypeIcon,
    projectTypeText
  }
}
