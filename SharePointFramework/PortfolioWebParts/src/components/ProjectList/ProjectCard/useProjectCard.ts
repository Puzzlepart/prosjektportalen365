import { useContext, useState } from 'react'
import { ProjectCardContext } from './context'

/**
 * Component logic hook for `ProjectCard`
 */
export function useProjectCard() {
  const context = useContext(ProjectCardContext)
  const [isImageLoaded, setIsImageLoaded] = useState(!context.project.logo)
  let onClick = () => {
    window.open(context.project.url, '_blank')
  }
  if (context.project.isUserMember === false) {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onClick = () => {}
  }
  return {
    isDataLoaded: context.isDataLoaded && isImageLoaded,
    setIsImageLoaded,
    onClick
  } as const
}
