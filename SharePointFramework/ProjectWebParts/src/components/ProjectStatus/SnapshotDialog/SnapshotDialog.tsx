import {
  Button,
  Dialog,
  DialogBody,
  DialogSurface,
  makeStyles,
  Text,
  tokens,
  Tooltip,
  useRestoreFocusTarget
} from '@fluentui/react-components'
import strings from 'ProjectWebPartsStrings'
import { getFluentIcon } from 'pp365-shared-library'
import React, { FC } from 'react'
import { CopyLinkDialog } from './CopyLinkDialog'
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
    borderRadius: tokens.borderRadiusMedium,
    ':focus-visible': {
      outline: `${tokens.strokeWidthThick} solid ${tokens.colorStrokeFocus2}`,
      outlineOffset: '-2px'
    }
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
    canFullscreen,
    isFullscreen,
    toggleFullscreen,
    openInNewTab,
    pageLink,
    imageLink,
    isCopyLinkOpen,
    copyLinkStatus,
    copyPageLink,
    copyImageLink,
    dismissCopyLink,
    onDismiss
  } = useSnapshotDialog()
  // The copy dialog opens from state: its button is where the focus goes back as it closes. Else
  // Fluent gives it to the latest restore target, the status toolbar's snapshot button, behind
  // this dialog (WCAG 2.4.3).
  const restoreFocusTarget = useRestoreFocusTarget()

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onDismiss()}>
      <DialogSurface className={styles.surface} aria-label={title}>
        <DialogBody className={styles.body}>
          <div className={styles.bar}>
            <Text size={400} weight='semibold'>
              {title}
            </Text>
            <div className={styles.actions}>
              {canFullscreen && (
                <Button
                  appearance='subtle'
                  icon={getFluentIcon(isFullscreen ? 'FullScreenMinimize' : 'FullScreenMaximize')}
                  onClick={toggleFullscreen}
                >
                  {isFullscreen
                    ? strings.SnapshotExitFullscreenLabel
                    : strings.SnapshotEnterFullscreenLabel}
                </Button>
              )}
              <Button
                {...restoreFocusTarget}
                appearance='subtle'
                icon={getFluentIcon('Link')}
                onClick={copyPageLink}
              >
                {strings.SnapshotCopyLinkLabel}
              </Button>
              <Button appearance='subtle' icon={getFluentIcon('Open')} onClick={openInNewTab}>
                {strings.SnapshotOpenInNewTabLabel}
              </Button>
              <Tooltip content={strings.CloseText} relationship='label'>
                <Button appearance='subtle' icon={getFluentIcon('Dismiss')} onClick={onDismiss} />
              </Tooltip>
            </div>
          </div>
          {/* It scrolls a tall report, and holds nothing that takes the focus: a stop for the
              keyboard, named as a region (WCAG 2.1.1). */}
          <div className={styles.frame} tabIndex={0} role='region' aria-label={title}>
            <img className={styles.image} src={snapshotUrl} alt={title} />
          </div>
          <CopyLinkDialog
            open={isCopyLinkOpen}
            pageLink={pageLink}
            imageLink={imageLink}
            status={copyLinkStatus}
            onCopyPageLink={copyPageLink}
            onCopyImageLink={copyImageLink}
            onDismiss={dismissCopyLink}
          />
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}

SnapshotDialog.displayName = 'SnapshotDialog'
