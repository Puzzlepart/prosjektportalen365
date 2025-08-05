import { HTMLProps, useContext, useState } from 'react'
import useImageColor from 'use-image-color'
import { ProjectCardContext } from '../context'
import styles from './ProjectCardHeader.module.scss'

export function useProjectCardHeader() {
  const context = useContext(ProjectCardContext)
  const [showCustomImage, setShowCustomImage] = useState(false)

  const imageUrl = `${context.project?.url || ''}/_api/siteiconmanager/getsitelogo?type='1'`
  const imageColorData =
    context.useDynamicColors && context.project
      ? context.project.logo || useImageColor(imageUrl, { cors: true, colors: 2, windowSize: 5 })
      : null

  const colors =
    context.useDynamicColors && context.showProjectLogo
      ? imageColorData?.colors ?? ['transparent', 'transparent']
      : ['transparent', 'transparent']

  const headerProps: HTMLProps<HTMLDivElement> = {
    className: context.useDynamicColors ? styles.dynamicHeader : styles.header,
    style: {
      color:
        context.useDynamicColors && context.showProjectLogo
          ? colors && colors[1]
          : 'var(--colorNeutralForeground1)',
      position: context.showProjectLogo ? 'absolute' : 'relative',
      padding: context.showProjectLogo ? '0 12px' : '12px',
      paddingBottom: context.showProjectLogo ? '12px' : '16px',
      width: context.showProjectLogo
        ? '216px'
        : context.shouldDisplay('ProjectPhase')
        ? '178px'
        : '216px'
    }
  }

  return { showCustomImage, setShowCustomImage, colors, headerProps }
}
