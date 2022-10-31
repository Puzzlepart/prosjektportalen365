import { IPersonaSharedProps, PersonaSize } from '@fluentui/react/lib/Persona'
import * as strings from 'PortfolioWebPartsStrings'
import { useContext } from 'react'
import { ProjectCardContext } from '../context'

/**
 * Component logic hook for `ProjectCardContent`
 */
export function useProjectCardContent() {
  const context = useContext(ProjectCardContext)
  const defaultPersonaProps: IPersonaSharedProps = {
    text: strings.NotSet,
    size: PersonaSize.size40,
    imageShouldFadeIn: true
  }
  const ownerPersonaProps: IPersonaSharedProps = {
    ...defaultPersonaProps,
    ...context.project.owner,
    secondaryText: strings.ProjectOwner
  }
  const managerPersonaProps: IPersonaSharedProps = {
    ...defaultPersonaProps,
    ...context.project.manager,
    secondaryText: strings.ProjectManager
  }
  return {
    phase: context.project.phase,
    owner: ownerPersonaProps,
    manager: managerPersonaProps
  } as const
}
