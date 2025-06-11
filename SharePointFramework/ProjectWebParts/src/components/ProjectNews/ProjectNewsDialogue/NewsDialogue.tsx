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

interface NewsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  spinnerMode: 'idle' | 'creating' | 'success'
  title: string
  errorMessage: string
  onTitleChange: (e: React.FormEvent, data: { value: string }) => void
  onSubmit: (e: React.FormEvent) => void
  templates: any[]
  selectedTemplate?: string
  onTemplateChange: (e: React.FormEvent, data: { optionValue: string }) => void
}

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
        <DialogBody
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            minWidth: 420,
            maxWidth: 600,
            padding: 8
          }}>
          {spinnerMode === 'creating' ? (
            <div
              style={{
                width: '100%',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minHeight: 200,
                justifyContent: 'center'
              }}>
              <Spinner label={strings.CreatingNewArticleStatus} />
            </div>
          ) : spinnerMode === 'success' ? (
            <div
              style={{
                textAlign: 'center',
                minHeight: 200,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
              <CheckmarkCircle24Filled style={{ width: 64, height: 64, color: 'green' }} />
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
                {strings.TemplateLabel || 'Velg mal'}
              </Label>
              <Dropdown
                id='template-dropdown'
                value={selectedTemplate}
                onOptionSelect={onTemplateChange}
                placeholder={strings.TemplatePlaceholder || 'Velg en mal'}
                >
                {templates.map((t) => (
                  <Option key={t.ServerRelativeUrl} value={t.ServerRelativeUrl}>
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
