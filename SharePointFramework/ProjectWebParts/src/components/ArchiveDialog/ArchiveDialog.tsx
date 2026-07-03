import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  FluentProvider,
  IdPrefixProvider,
  Label,
  makeStyles,
  mergeClasses,
  Text,
  tokens,
  Tooltip
} from '@fluentui/react-components'
import {
  ArrowClockwise24Regular,
  CheckmarkCircle24Filled,
  Dismiss24Regular
} from '@fluentui/react-icons'
import { format } from '@fluentui/react'
import * as strings from 'ProjectWebPartsStrings'
import { customLightTheme, UserMessage } from 'pp365-shared-library'
import React, { FC } from 'react'
import { ArchiveProgress } from './ArchiveProgress'
import { ArchiveSelection } from './ArchiveSelection/ArchiveSelection'
import { SelectionSummary } from './ArchiveSelection/SelectionSummary'
import { useArchiveDialog } from './useArchiveDialog'
import { IArchiveDialogProps } from './types'

const useStyles = makeStyles({
  /** Constrains width; height is added separately so only the selection view is tall. */
  surface: {
    maxWidth: 'min(1210px, 95vw)'
  },
  /** ~80px breathing room top and bottom of the viewport (selection view only). */
  surfaceTall: {
    height: 'calc(100vh - 160px)',
    maxHeight: 'calc(100vh - 160px)'
  },
  body: {
    height: '100%',
    minHeight: 0
  },
  /** Lets the selection view fill the tall surface so the tables get the height. */
  contentFill: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    overflow: 'hidden'
  },
  archiveContent: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: '16px',
    flex: 1,
    minHeight: 0
  },
  titleActions: {
    display: 'inline-flex',
    columnGap: '4px'
  },
  confirmView: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: '12px'
  },
  confirmQuestion: {
    textAlign: 'right'
  },
  progressView: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: '16px'
  },
  completedBanner: {
    display: 'flex',
    alignItems: 'center',
    columnGap: '10px'
  },
  completedIcon: {
    color: tokens.colorStatusSuccessForeground1
  },
  retryRow: {
    marginTop: '8px'
  }
})

/**
 * Wizard dialog for the manual archive flow: select documents/lists, confirm,
 * then watch per-scope progress. Load and process failures surface as inline
 * error messages with a retry; all logic lives in {@link useArchiveDialog}.
 */
export const ArchiveDialog: FC<IArchiveDialogProps> = (props) => {
  const cls = useStyles()
  const {
    fluentProviderId,
    documents,
    lists,
    history,
    isLoading,
    error,
    refresh,
    view,
    setView,
    config,
    setConfig,
    progress,
    showCloseConfirm,
    setShowCloseConfirm,
    selectedCount,
    resetAndClose,
    requestClose,
    handleConfirm,
    title
  } = useArchiveDialog(props)

  const isEmpty = !isLoading && !error && documents.length === 0 && lists.length === 0
  const hasProcessError = progress.status === 'error'

  return (
    <>
      <Dialog
        open={props.open}
        modalType='alert'
        onOpenChange={(_, data) => !data.open && requestClose()}
      >
        <IdPrefixProvider value={fluentProviderId}>
          <FluentProvider theme={customLightTheme}>
            <DialogSurface
              className={mergeClasses(cls.surface, view === 'selection' && cls.surfaceTall)}
            >
              <DialogBody className={cls.body}>
                <DialogTitle
                  action={
                    view !== 'archiving' && (
                      <span className={cls.titleActions}>
                        {view === 'selection' && (
                          <Tooltip
                            content={strings.ArchiveRefreshTooltip}
                            relationship='label'
                            withArrow
                          >
                            <Button
                              appearance='subtle'
                              aria-label={strings.ArchiveRefreshLabel}
                              icon={<ArrowClockwise24Regular />}
                              onClick={refresh}
                              disabled={isLoading}
                            />
                          </Tooltip>
                        )}
                        <DialogTrigger action='close' disableButtonEnhancement>
                          <Button
                            appearance='subtle'
                            aria-label={strings.CloseText}
                            icon={<Dismiss24Regular />}
                            onClick={requestClose}
                          />
                        </DialogTrigger>
                      </span>
                    )
                  }
                >
                  {title}
                </DialogTitle>
                <DialogContent className={view === 'selection' ? cls.contentFill : undefined}>
                  {view === 'selection' && (
                    <div className={cls.archiveContent}>
                      <Label weight='semibold'>{strings.ArchiveViewDescription}</Label>
                      {error ? (
                        <UserMessage intent='error' title={strings.ArchiveDataErrorText}>
                          <div className={cls.retryRow}>
                            <Button
                              size='small'
                              appearance='primary'
                              icon={<ArrowClockwise24Regular />}
                              onClick={refresh}
                            >
                              {strings.ArchiveRetryText}
                            </Button>
                          </div>
                        </UserMessage>
                      ) : isEmpty ? (
                        <UserMessage
                          intent='info'
                          title={strings.ArchiveSummaryEmpty}
                          text={strings.ArchiveSummaryEmptyHelp}
                        />
                      ) : (
                        <ArchiveSelection
                          documents={documents}
                          lists={lists}
                          history={history}
                          isLoading={isLoading}
                          onConfigurationChange={setConfig}
                        />
                      )}
                    </div>
                  )}
                  {view === 'confirm' && (
                    <div className={cls.confirmView}>
                      <SelectionSummary
                        total={selectedCount}
                        documentsSelected={config.documents?.length || 0}
                        listsSelected={config.lists?.length || 0}
                        selectedItems={[...(config.documents || []), ...(config.lists || [])]}
                      />
                      <Text weight='semibold' className={cls.confirmQuestion}>
                        {strings.ArchiveConfirmQuestion}
                      </Text>
                    </div>
                  )}
                  {(view === 'archiving' || view === 'completed') && (
                    <div className={cls.progressView}>
                      {view === 'completed' && !hasProcessError && (
                        <div className={cls.completedBanner} aria-live='polite'>
                          <CheckmarkCircle24Filled className={cls.completedIcon} />
                          <Text weight='semibold'>{strings.ArchiveCompletedSubText}</Text>
                        </div>
                      )}
                      {view === 'completed' && hasProcessError && (
                        <UserMessage
                          intent='error'
                          title={strings.ArchiveProcessErrorText}
                          text={strings.ArchivePartialNote}
                        />
                      )}
                      <ArchiveProgress documents={progress.documents} lists={progress.lists} />
                    </div>
                  )}
                </DialogContent>
                <DialogActions>
                  {(view === 'selection' || view === 'confirm') && (
                    <Button onClick={requestClose}>{strings.CancelText}</Button>
                  )}
                  {view === 'confirm' && (
                    <Button onClick={() => setView('selection')}>
                      {strings.ArchiveBackButton}
                    </Button>
                  )}
                  {view === 'selection' && (
                    <Button
                      appearance='primary'
                      disabled={selectedCount === 0 || isLoading || !!error}
                      onClick={() => setView('confirm')}
                    >
                      {strings.ArchiveContinueText}
                    </Button>
                  )}
                  {view === 'confirm' && (
                    <Button appearance='primary' onClick={handleConfirm}>
                      {strings.Yes}
                    </Button>
                  )}
                  {view === 'completed' && hasProcessError && (
                    <Button appearance='primary' onClick={handleConfirm}>
                      {strings.ArchiveRetryText}
                    </Button>
                  )}
                  {view === 'completed' && (
                    <Button
                      appearance={hasProcessError ? 'secondary' : 'primary'}
                      onClick={resetAndClose}
                    >
                      {strings.CloseText}
                    </Button>
                  )}
                </DialogActions>
              </DialogBody>
            </DialogSurface>
          </FluentProvider>
        </IdPrefixProvider>
      </Dialog>
      <Dialog open={showCloseConfirm} modalType='alert'>
        <IdPrefixProvider value={fluentProviderId}>
          <FluentProvider theme={customLightTheme}>
            <DialogSurface>
              <DialogBody>
                <DialogTitle>{strings.ArchiveCloseConfirmTitle}</DialogTitle>
                <DialogContent>
                  {format(strings.ArchiveCloseConfirmMessage, selectedCount)}
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setShowCloseConfirm(false)}>
                    {strings.ArchiveCloseConfirmKeep}
                  </Button>
                  <Button appearance='primary' onClick={resetAndClose}>
                    {strings.ArchiveCloseConfirmDiscard}
                  </Button>
                </DialogActions>
              </DialogBody>
            </DialogSurface>
          </FluentProvider>
        </IdPrefixProvider>
      </Dialog>
    </>
  )
}
