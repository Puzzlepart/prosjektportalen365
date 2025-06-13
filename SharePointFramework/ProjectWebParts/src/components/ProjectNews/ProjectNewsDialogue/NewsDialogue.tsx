import * as React from 'react'
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  Button,
  Input,
  Label,
  Spinner,
  MessageBar,
  Dropdown,
  Option
} from '@fluentui/react-components'
import { CheckmarkCircle24Filled } from '@fluentui/react-icons'

import * as strings from 'ProjectWebPartsStrings'
import { NewsDialogProps } from '../types'
import styles from './NewsDialogue.module.scss'

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
}) => (
  <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
    <DialogSurface>
      <form onSubmit={onSubmit}>
        <DialogTitle style={{ textAlign: 'center' }}>{strings.DialogueTitle}</DialogTitle>
        <DialogBody className={styles.dialogBody}>
          {spinnerMode === 'creating' ? (
            <div className={styles.centeredSpinner}>
              <Spinner label={strings.CreatingNewArticleStatus} />
            </div>
          ) : spinnerMode === 'success' ? (
            <div className={styles.centeredSuccess}>
              <CheckmarkCircle24Filled className={styles.successIcon} />
              <div>{strings.NewsCreatedSuccessfully}</div>
            </div>
          ) : (
            <>
              <Label htmlFor='news-title-input' required>
                {strings.NewsTitleLabel}
              </Label>
              {errorMessage && <MessageBar intent='error'>{errorMessage}</MessageBar>}
              <Input
                type='text'
                placeholder={strings.NewsTitlePlaceholder}
                id='news-title-input'
                value={title}
                onChange={onTitleChange}
                required
              />
              <Label htmlFor='template-dropdown' required>
                {strings.TemplateLabel}
              </Label>
              <Dropdown
                id='template-dropdown'
                value={templates.find((t) => t.ServerRelativeUrl === selectedTemplate)?.Name ?? ''}
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
            </>
          )}
        </DialogBody>
        {spinnerMode === 'idle' && (
          <DialogActions>
            <Button appearance='primary' type='submit' disabled={!!errorMessage}>
              {strings.CreateButtonLabel}
            </Button>
            <Button onClick={() => onOpenChange(false)} type='button'>
              {strings.CancelButtonLabel}
            </Button>
          </DialogActions>
        )}
      </form>
    </DialogSurface>
  </Dialog>
)

export default NewsDialog
