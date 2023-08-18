import React, { HTMLProps, useContext } from 'react'
import useImageColor from 'use-image-color'
import { ProjectCardContext } from '../context'
import styles from './ProjectCardHeader.module.scss'

export function useProjectCardHeader() {
  const context = useContext(ProjectCardContext)
  const [showCustomImage, setShowCustomImage] = React.useState(true)

  const imageColorData = useImageColor(
    context.project.logo ?? `${context.project.url}/_api/siteiconmanager/getsitelogo?type='1'`,
    { cors: true, colors: 2, windowSize: 5 }
  )

  const colors =
    context.useDynamicColors && context.showProjectLogo
      ? imageColorData.colors
      : ['transparent', 'transparent']

  const headerProps: HTMLProps<HTMLDivElement> = {
    className: context.useDynamicColors ? styles.dynamicHeader : styles.header,
    style: {
      color: context.useDynamicColors && colors && colors[1],
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
