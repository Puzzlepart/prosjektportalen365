import { makeStyles, shorthands, tokens } from '@fluentui/react-components'

export const useStyles = makeStyles({
  toolbar: {
    justifyContent: 'space-between'
  },

  body: {
    ...shorthands.flex(1),

    width: '100%',
    maxWidth: '100%',
    position: 'relative'
  },

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
  },

  footer: {
    justifyContent: 'space-between'
  },

  main: {
    ...shorthands.gap('12px'),
    display: 'flex',
    flexWrap: 'wrap'
  },

  card: {
    width: '168px',
    maxWidth: '100%',
    height: 'fit-content'
  },

  caption: {
    color: tokens.colorNeutralForeground3
  },

  smallRadius: {
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    maxHeight: '82px'
  },

  grayBackground: {
    backgroundColor: tokens.colorNeutralBackground3
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
  },
  level3: {
    transform: 'translate3D(100%, 0, 0)'
  }
})
