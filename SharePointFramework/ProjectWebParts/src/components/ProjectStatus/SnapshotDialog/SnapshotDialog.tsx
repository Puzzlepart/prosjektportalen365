import {
  Button,
  Dialog,
  DialogBody,
  DialogSurface,
  makeStyles,
  Text,
  tokens,
  Tooltip
} from '@fluentui/react-components'
import {
  Dismiss24Regular,
  FullScreenMaximize24Regular,
  FullScreenMinimize24Regular,
  Open24Regular
} from '@fluentui/react-icons'
import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { useSnapshotDialog } from './useSnapshotDialog'

// makeStyles rather than a CSS module: the surface has to override DialogSurface's own
// Griffel size limits, which are injected after module CSS and would otherwise win.
const useStyles = makeStyles({
  surface: {
    width: '100vw',
    maxWidth: '100vw',
    height: ['100vh', '100dvh'],
    maxHeight: ['100vh', '100dvh'],
    borderRadius: 0,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
    height: '100%',
    maxHeight: '100%'
  },
  bar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: tokens.spacingHorizontalS,
    flexShrink: 0
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalXS
  },
  frame: {
    flexGrow: 1,
    minHeight: 0,
    overflow: 'auto',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium
  },
  // Natural size, shrunk only to the window width — never to its height, which is what
  // makes a tall report unreadable in the browser's own image viewer.
  image: {
    display: 'block',
    maxWidth: '100%',
    height: 'auto',
    margin: '0 auto'
  }
})

/**
 * Shows the snapshot of the selected status report in a dialog that fills the
 * browser window, at full width with vertical scrolling, and can take the whole
 * screen where the browser allows it.
 */
export const SnapshotDialog: FC = () => {
  const styles = useStyles()
  const {
    isOpen,
    snapshotUrl,
    title,
    surfaceRef,
    canFullscreen,
    isFullscreen,
    toggleFullscreen,
    openInNewTab,
    onDismiss
  } = useSnapshotDialog()

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onDismiss()}>
      <DialogSurface ref={surfaceRef} className={styles.surface} aria-label={title}>
        <DialogBody className={styles.body}>
          <div className={styles.bar}>
            <Text size={400} weight='semibold'>
              {title}
            </Text>
            <div className={styles.actions}>
              {canFullscreen && (
                <Button
                  appearance='subtle'
                  icon={
                    isFullscreen ? <FullScreenMinimize24Regular /> : <FullScreenMaximize24Regular />
                  }
                  onClick={toggleFullscreen}
                >
                  {isFullscreen
                    ? strings.SnapshotExitFullscreenLabel
                    : strings.SnapshotEnterFullscreenLabel}
                </Button>
              )}
              <Button appearance='subtle' icon={<Open24Regular />} onClick={openInNewTab}>
                {strings.SnapshotOpenInNewTabLabel}
              </Button>
              <Tooltip content={strings.CloseText} relationship='label'>
                <Button appearance='subtle' icon={<Dismiss24Regular />} onClick={onDismiss} />
              </Tooltip>
            </div>
          </div>
          <div className={styles.frame}>
            <img className={styles.image} src={snapshotUrl} alt={title} />
          </div>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}

SnapshotDialog.displayName = 'SnapshotDialog'
