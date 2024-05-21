import { makeStyles, tokens } from '@fluentui/react-components'

export const useStyles = makeStyles({
  level: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    ':first-child': {
      paddingTop: 0
    },

    ':last-child': {
      paddingBottom: 0
    }
  }
})

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
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    transitionProperty: 'opacity, transform',
    willChange: 'opacity, transform'
  },
  levelVisible: {
    opacity: 1,
    transform: 'translate3D(0, 0, 0)'
  },
  level1: {
    transform: 'translate3D(-100%, 0, 0)'
  },
  level2: {
    transform: 'translate3D(100%, 0, 0)'
  }
})
