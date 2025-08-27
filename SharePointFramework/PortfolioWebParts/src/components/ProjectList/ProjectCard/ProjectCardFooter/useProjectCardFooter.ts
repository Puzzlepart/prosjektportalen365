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
import { useContext } from 'react'
import { ProjectCardContext } from '../context'
import resource from 'SharedResources'

/**
 * Component logic hook for `ProjectCardFooter`
 */
export function useProjectCardFooter() {
  const context = useContext(ProjectCardContext)
  const defaultPersonaProps: AvatarProps = {
    name: strings.NotSet,
    color: 'brand'
  }
  const primaryUserPersonaProps: AvatarProps = {
    ...defaultPersonaProps,
    ...(context.project?.owner || {}),
    role: context.project?.data?.[context.primaryUserField]
  }
  const secondaryUserPersonaProps: AvatarProps = {
    ...defaultPersonaProps,
    ...(context.project?.manager || {}),
    role: context.project?.data?.[context.secondaryUserField]
  }
  let ProjectTypeIcon = bundleIcon(BoxFilled, BoxRegular)
  let projectTypeText = context.project.template

  switch (context.project.template) {
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
      if (context.project.isParent) {
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
