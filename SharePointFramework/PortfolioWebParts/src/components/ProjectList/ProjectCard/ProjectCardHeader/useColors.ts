import { useContext } from 'react'
import useImageColor from 'use-image-color'
import { ProjectCardContext } from '../context'

export function useColors() {
  const context = useContext(ProjectCardContext)

  const imageUrl = `${context.project.url}/_api/siteiconmanager/getsitelogo?type='1'`
  const imageColorData = context.useDynamicColors
    ? context.project.logo ?? useImageColor(imageUrl, { cors: true, colors: 2, windowSize: 5 })
    : null

  const colors =
    context.useDynamicColors && context.showProjectLogo
      ? imageColorData?.colors ?? ['transparent', 'transparent']
      : ['transparent', 'transparent']

  return { colors }
}
