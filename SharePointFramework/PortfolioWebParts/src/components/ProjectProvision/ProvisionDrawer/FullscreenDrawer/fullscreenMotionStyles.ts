import { makeStyles, tokens } from '@fluentui/react-components'

export const useFullscreenMotionStyles = makeStyles({
  level: {
    opacity: 0,
    transitionDuration: tokens.durationSlow,
    transitionTimingFunction: tokens.curveEasyEase,
    transitionProperty: 'opacity, transform',
    willChange: 'opacity, transform'
  },
  levelVisible: {
    opacity: 1,
    transform: 'translate3D(0, 0, 0) scale(1)'
  },
  // SiteType level: starts slightly zoomed in, fades out when leaving
  siteTypeLevel: {
    transform: 'translate3D(0, 0, 0) scale(0.95)'
  },
  // Fields level: starts zoomed out and slightly behind, zooms in on enter
  fieldsLevel: {
    transform: 'translate3D(0, 0, 50px) scale(1.03)',
    opacity: 0
  }
})
