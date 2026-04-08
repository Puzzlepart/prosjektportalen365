import { makeStyles, tokens } from '@fluentui/react-components'

/**
 * Motion styles for the medium-size ProvisionDrawer.
 * Used with `useMotion` from `@fluentui/react-motion-preview` for
 * level navigation transitions.
 */
export const useMotionStyles = makeStyles({
  toolbarButton: {
    opacity: 0,
    transform: 'translate3D(0, 0, 0) scale(0)',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    transitionProperty: 'opacity, transform',
    willChange: 'opacity, transform'
  },
  toolbarButtonVisible: {
    opacity: 1,
    transform: 'translate3D(0, 0, 0) scale(1)'
  },
  level: {
    opacity: 0,
    transitionDuration: tokens.durationSlow,
    transitionTimingFunction: tokens.curveEasyEase,
    transitionProperty: 'opacity, transform',
    willChange: 'opacity, transform'
  },
  levelVisible: {
    opacity: 1,
    transform: 'translate3D(0, 0, 0)'
  },
  // Slides in from the left
  level0: {
    transform: 'translate3D(-100%, 0, 0)'
  },
  // Slides in from the right (forward navigation)
  level1: {
    transform: 'translate3D(100%, 0, 0)'
  },
  // Slides in from the left (reverse navigation from level 2 back to level 1)
  level1a: {
    transform: 'translate3D(-100%, 0, 0)'
  },
  // Slides in from the right
  level2: {
    transform: 'translate3D(100%, 0, 0)'
  }
})
