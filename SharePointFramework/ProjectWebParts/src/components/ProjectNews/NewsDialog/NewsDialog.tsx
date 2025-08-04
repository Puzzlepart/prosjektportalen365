import * as React from 'react'
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
  useRestoreFocusTarget,
  useRestoreFocusSource
} from '@fluentui/react-components'

import * as strings from 'ProjectWebPartsStrings'
import { NewsDialogProps, TemplateFile } from '../types'
import styles from './NewsDialog.module.scss'
import { getFluentIcon, FieldContainer } from 'pp365-shared-library'

const NewsDialog: React.FC<NewsDialogProps> = ({
  open,
  onOpenChange,
  spinnerMode,
  title,
  errorMessage,
  onTitleChange,
  onSubmit,
  templates,
  selectedTemplate,
  onTemplateChange
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)
  const isTitleValid = !!title && !errorMessage
  const isTemplateValid = !!selectedTemplate
  const canCreate = isTitleValid && isTemplateValid && spinnerMode === 'idle'
  const selected = templates.find((t: TemplateFile) => t.ServerRelativeUrl === selectedTemplate)
  const origin = window.location.origin
  const previewUrl = selected ? `${origin}${selected.ServerRelativeUrl}?Mode=Read` : null
  const SuccessIcon = getFluentIcon('CheckmarkCircle', { size: 64, color: '#107c10', filled: true })
  const DismissIcon = getFluentIcon('Dismiss', { size: 24, color: '#888' })
  const restoreFocusTargetAttributes = useRestoreFocusTarget()
  const restoreFocusSourceAttributes = useRestoreFocusSource()
  const inputRef = React.useRef<HTMLInputElement>(null)

  return (
    <>
      <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
        <DialogSurface>
          <DialogTitle style={{ textAlign: 'center' }}>{strings.DialogueTitle}</DialogTitle>
          <DialogBody className={styles.dialogBody}>
            {spinnerMode === 'creating' ? (
              <div className={styles.centeredSpinner}>
                <Spinner label={strings.CreatingNewArticleStatus} />
              </div>
            ) : spinnerMode === 'success' ? (
              <div className={styles.centeredSuccess}>
                {SuccessIcon}
                <div>{strings.NewsCreatedSuccessfully}</div>
              </div>
            ) : (
              <div>
                <FieldContainer
                  label={strings.NewsTitleLabel}
                  required
                  validationMessage={errorMessage}
                  validationState={errorMessage ? 'error' : undefined}
                  iconName='TextBulletList'
                  className={styles.fieldContainer}
                >
                  <Input
                    ref={inputRef}
                    type='text'
                    placeholder={strings.NewsTitlePlaceholder}
                    id='news-title-input'
                    value={title}
                    onChange={onTitleChange}
                    required
                  />
                </FieldContainer>
                <FieldContainer
                  label={strings.TemplateLabel}
                  required
                  validationState={!isTemplateValid ? 'error' : undefined}
                  validationMessage={!isTemplateValid ? strings.TemplateRequired : undefined}
                  iconName='ChevronDown'
                  className={styles.fieldContainer}
                >
                  <Dropdown
                    id='template-dropdown'
                    value={
                      templates.find((t) => t.ServerRelativeUrl === selectedTemplate)?.Name ?? ''
                    }
                    onOptionSelect={(_, data) => {
                      const selected = templates.find((t) => t.Name === data.optionValue)
                      if (selected) {
                        onTemplateChange(_, { optionValue: selected.ServerRelativeUrl })
                      }
                    }}
                    placeholder={strings.TemplatePlaceholder}
                  >
                    {templates.map((t) => (
                      <Option key={t.ServerRelativeUrl} value={t.Name}>
                        {t.Name}
                      </Option>
                    ))}
                  </Dropdown>
                  <ToggleButton
                    className={styles.toggleButton}
                    checked={isDrawerOpen}
                    onClick={() => setIsDrawerOpen((open) => !open)}
                    disabled={!selected}
                    appearance='secondary'
                    {...restoreFocusTargetAttributes}
                  >
                    {strings.PreviewLabel}
                  </ToggleButton>
                </FieldContainer>
              </div>
            )}
          </DialogBody>
          {spinnerMode === 'idle' && (
            <DialogActions>
              <Button appearance='primary' onClick={onSubmit} disabled={!canCreate}>
                {strings.CreateButtonLabel}
              </Button>
              <Button onClick={() => onOpenChange(false)} type='button'>
                {strings.CancelText}
              </Button>
            </DialogActions>
          )}
        </DialogSurface>
      </Dialog>
      <Drawer
        open={isDrawerOpen}
        position='end'
        size='large'
        onOpenChange={(_, data) => {
          setIsDrawerOpen(data.open)
          if (!data.open) {
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
                icon={DismissIcon}
                onClick={() => setIsDrawerOpen(false)}
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
export default NewsDialog
