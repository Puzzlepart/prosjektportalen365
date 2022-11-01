import { IPersonaSharedProps, PersonaSize } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import { useContext } from 'react'
import { ProjectCardContext } from '../context'

/**
 * Component logic hook for `ProjectCardFooter`
 */
export function useProjectCardFooter() {
  const context = useContext(ProjectCardContext)
  const defaultPersonaProps: IPersonaSharedProps = {
    text: strings.NotSet,
    size: PersonaSize.size40,
    imageShouldFadeIn: true,
    hidePersonaDetails: true
  }
  const ownerPersonaProps = context.project.owner && {
    ...defaultPersonaProps,
    ...context.project.owner,
    secondaryText: strings.ProjectOwner
  } as IPersonaSharedProps
  const managerPersonaProps = context.project.manager && {
    ...defaultPersonaProps,
    ...context.project.manager,
    secondaryText: strings.ProjectManager
  } as IPersonaSharedProps
  return {
    owner: ownerPersonaProps,
    manager: managerPersonaProps
  } as const
}
