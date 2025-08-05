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
  useRestoreFocusTarget
} from '@fluentui/react-components'
import * as strings from 'ProjectWebPartsStrings'
import styles from './NewsDialog.module.scss'
import { getFluentIcon, FieldContainer } from 'pp365-shared-library'
import { INewsDialogProps } from './types'
import { ProjectNewsContext } from '../context'
import { useNewsDialog } from './useNewsDialog'

export const NewsDialog: FC<INewsDialogProps> = () => {
  const context = useContext(ProjectNewsContext)
  const {
    spinnerMode,
    title,
    errorMessage,
    isTemplateValid,
    templates,
    selected,
    selectedTemplate,
    previewUrl,
    canCreate,
    inputRef,
    handleTitleChange,
    handleTemplateChange,
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
          <DialogTitle style={{ textAlign: 'center' }}>{strings.DialogTitle}</DialogTitle>
          <DialogBody className={styles.dialogBody}>
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
                    id='news-title-input'
                    value={title}
                    onChange={handleTitleChange}
                    required
                  />
                </FieldContainer>
                <FieldContainer
                  label={strings.TemplateLabel}
                  required
                  validationState={!isTemplateValid ? 'error' : undefined}
                  validationMessage={!isTemplateValid ? strings.TemplateRequired : undefined}
                  iconName='ChevronDown'
                >
                  <Dropdown
                    id='template-dropdown'
                    value={
                      templates.find((t) => t.ServerRelativeUrl === selectedTemplate)?.Title ?? ''
                    }
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
          </DialogBody>
          {spinnerMode === 'idle' && (
            <DialogActions>
              <Button appearance='primary' onClick={handleCreate} disabled={!canCreate}>
                {strings.CreateButtonLabel}
              </Button>
              <Button onClick={() => context.setState({ isDialogOpen: false })} type='button'>
                {strings.CancelText}
              </Button>
            </DialogActions>
          )}
        </DialogSurface>
      </Dialog>
      <Drawer
        open={context.state.isDrawerOpen}
        position='end'
        size='large'
        onOpenChange={(_, { open }) => {
          context.setState({ isDrawerOpen: open })
          if (!open) {
            //Drawer does not restore focus to the trigger on backdrop click by default
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
                aria-label='Close'
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
            <iframe src={previewUrl} title='Template Preview' className={styles.previewIframe} />
          ) : (
            <div style={{ color: '#888', fontStyle: 'italic', padding: 16 }}>
              {strings.NoPreviewAvailable}
            </div>
          )}
        </DrawerBody>
      </Drawer>
    </>
  )
}
