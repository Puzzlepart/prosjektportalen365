import React, { FC, useContext } from 'react'
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  Button,
  Input,
  Spinner,
  Dropdown,
  Option,
  Drawer,
  DrawerHeader,
  DrawerBody,
  ToggleButton,
  DrawerHeaderTitle,
  useRestoreFocusSource,
  useRestoreFocusTarget,
  DialogContent
} from '@fluentui/react-components'
import * as strings from 'ProjectWebPartsStrings'
import styles from './NewsDialog.module.scss'
import {
  getDropdownClearButtonProps,
  getFluentIcon,
  FieldContainer,
  UserMessage
} from 'pp365-shared-library'
import { INewsDialogProps } from './types'
import { ProjectNewsContext } from '../context'
import { useNewsDialog } from './useNewsDialog'

/** Collects a title and template, then creates a project news page. */
export const NewsDialog: FC<INewsDialogProps> = () => {
  const context = useContext(ProjectNewsContext)
  const {
    spinnerMode,
    title,
    errorMessage,
    showTemplateError,
    templates,
    selected,
    selectedTemplate,
    previewUrl,
    canCreate,
    createDisabledReason,
    inputRef,
    handleTitleChange,
    handleTemplateChange,
    handleTemplateBlur,
    handleCreate
  } = useNewsDialog()

  const restoreFocusTargetAttributes = useRestoreFocusTarget()
  const restoreFocusSourceAttributes = useRestoreFocusSource()

  return (
    <>
      <Dialog
        open={context.state.isDialogOpen}
        onOpenChange={(_, { open }) => context.setState({ isDialogOpen: open })}
      >
        <DialogSurface>
          <DialogBody className={styles.dialogBody}>
            <DialogTitle style={{ textAlign: 'center' }}>{strings.DialogTitle}</DialogTitle>
            <DialogContent>
              {spinnerMode === 'creating' ? (
                <div className={styles.centeredSpinner}>
                  <Spinner label={strings.CreatingNewArticleStatus} size='small' />
                </div>
              ) : spinnerMode === 'success' ? (
                <div className={styles.centeredSuccess}>
                  {getFluentIcon('CheckmarkCircle', { size: 64, color: '#107c10', filled: true })}
                  <div>{strings.NewsCreatedSuccessfully}</div>
                </div>
              ) : (
                <div className={styles.content}>
                  <UserMessage
                    title={strings.DialogTitle}
                    text={strings.DialogDescription}
                    intent='info'
                  />
                  <UserMessage
                    title={strings.NewsHubLevelWarningTitle}
                    text={strings.NewsHubLevelWarningText}
                    intent='warning'
                  />
                  <FieldContainer
                    label={strings.NewsTitleLabel}
                    required
                    validationMessage={errorMessage}
                    validationState={errorMessage ? 'error' : undefined}
                    iconName='TextBulletList'
                  >
                    <Input
                      ref={inputRef}
                      type='text'
                      placeholder={strings.NewsTitlePlaceholder}
                      value={title}
                      onChange={handleTitleChange}
                      required
                    />
                  </FieldContainer>
                  <FieldContainer
                    label={strings.TemplateLabel}
                    required
                    validationState={showTemplateError ? 'error' : undefined}
                    validationMessage={showTemplateError ? strings.TemplateRequired : undefined}
                    iconName='ChevronDown'
                  >
                    <Dropdown
                      clearButton={getDropdownClearButtonProps()}
                      value={
                        templates.find((t) => t.ServerRelativeUrl === selectedTemplate)?.Title ?? ''
                      }
                      onBlur={handleTemplateBlur}
                      onOptionSelect={(_, data) => {
                        const selected = templates.find((t) => t.Title === data.optionValue)
                        if (selected) {
                          handleTemplateChange(_, { optionValue: selected.ServerRelativeUrl })
                        }
                      }}
                      placeholder={strings.TemplatePlaceholder}
                    >
                      {templates.map((t) => (
                        <Option key={t.ServerRelativeUrl} value={t.Title}>
                          {t.Title}
                        </Option>
                      ))}
                    </Dropdown>
                  </FieldContainer>
                  <ToggleButton
                    className={styles.toggleButton}
                    checked={context.state.isDrawerOpen}
                    onClick={() => context.setState({ isDrawerOpen: !context.state.isDrawerOpen })}
                    disabled={!selected}
                    appearance='secondary'
                    {...restoreFocusTargetAttributes}
                  >
                    {strings.PreviewLabel}
                  </ToggleButton>
                </div>
              )}
            </DialogContent>
            {spinnerMode === 'idle' && (
              <DialogActions className={styles.actions}>
                <Button onClick={() => context.setState({ isDialogOpen: false })} type='button'>
                  {strings.CancelText}
                </Button>
                <Button
                  appearance='primary'
                  onClick={handleCreate}
                  // Focusable while it cannot create, with what it waits for: a disabled button
                  // is skipped by the keyboard (WCAG 2.1.1, 3.3.2).
                  disabledFocusable={!canCreate}
                  title={canCreate ? undefined : createDisabledReason}
                >
                  {strings.CreateButtonLabel}
                </Button>
              </DialogActions>
            )}
          </DialogBody>
        </DialogSurface>
      </Dialog>
      <Drawer
        open={context.state.isDrawerOpen}
        position='end'
        size='large'
        onOpenChange={(_, { open }) => {
          context.setState({ isDrawerOpen: open })
          if (!open) {
            // The drawer can close on a backdrop click without restoring focus to its trigger.
            inputRef.current?.focus()
          }
        }}
        {...restoreFocusSourceAttributes}
      >
        <DrawerHeader>
          <DrawerHeaderTitle
            action={
              <Button
                appearance='subtle'
                aria-label={strings.CloseText}
                icon={getFluentIcon('Dismiss')}
                onClick={() => context.setState({ isDrawerOpen: false })}
              />
            }
          >
            {strings.PreviewLabel}
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody className={styles.drawerBody}>
          {previewUrl ? (
            <iframe
              src={previewUrl}
              title={strings.PreviewLabel}
              className={styles.previewIframe}
            />
          ) : (
            <div className={styles.noPreview}>{strings.NoPreviewAvailable}</div>
          )}
        </DrawerBody>
      </Drawer>
    </>
  )
}
