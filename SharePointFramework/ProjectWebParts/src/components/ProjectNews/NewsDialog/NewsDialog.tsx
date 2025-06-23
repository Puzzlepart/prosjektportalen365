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
  Option
} from '@fluentui/react-components'

import * as strings from 'ProjectWebPartsStrings'
import { NewsDialogProps } from '../types'
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
  const isTitleValid = !!title && !errorMessage
  const isTemplateValid = !!selectedTemplate
  const canCreate = isTitleValid && isTemplateValid && spinnerMode === 'idle'
  const SuccessIcon = getFluentIcon('CheckmarkCircle', { size: 64, color: '#107c10', filled: true })
  return (
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
            <>
              <FieldContainer
                label={strings.NewsTitleLabel}
                required
                validationMessage={errorMessage}
                validationState={errorMessage ? 'error' : undefined}
                iconName='TextBulletList'>
                <Input
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
                iconName='ChevronDown'>
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
                  placeholder={strings.TemplatePlaceholder}>
                  {templates.map((t) => (
                    <Option key={t.ServerRelativeUrl} value={t.Name}>
                      {t.Name}
                    </Option>
                  ))}
                </Dropdown>
              </FieldContainer>
            </>
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
  )
}
export default NewsDialog
