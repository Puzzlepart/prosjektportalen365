import React, { FC } from 'react'
import {
  Button,
  Field,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  ProgressBar,
  Textarea
} from '@fluentui/react-components'
import { FieldContainer, getFluentIcon, UserMessage } from 'pp365-shared-library'
import strings from 'PortfolioWebPartsStrings'
import { ITeamsConfigEditorProps } from './types'
import { useTeamsConfigEditor } from './useTeamsConfigEditor'
import styles from './TeamsConfigEditor.module.scss'

export const TeamsConfigEditor: FC<ITeamsConfigEditorProps> = ({ isAdmin, onBack }) => {
  const {
    jsonValue,
    error,
    isWorking,
    hasExistingConfig,
    handleSave,
    handleReset,
    handleJsonChange
  } = useTeamsConfigEditor()

  if (!isAdmin) {
    return (
      <div className={styles.container}>
        <UserMessage
          intent='error'
          title={strings.AccessTitle}
          text={strings.Provision.ConfigEditorAccessDenied}
        />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <p className={styles.description}>{strings.Provision.ConfigEditorDescription}</p>

      <FieldContainer
        iconName='ContentSettings'
        label={strings.Provision.ConfigJsonLabel}
        description={strings.Provision.ConfigJsonHint}
      >
        <Textarea
          className={styles.textarea}
          value={jsonValue}
          rows={20}
          onChange={(_, data) => handleJsonChange(data.value)}
          resize='vertical'
          disabled={isWorking}
        />
      </FieldContainer>

      {error && (
        <UserMessage
          intent='error'
          title={strings.ErrorTitle}
          text={error === 'ConfigInvalidJson' ? strings.Provision.ConfigInvalidJson : error}
        />
      )}

      <div className={styles.footer}>
        {isWorking ? (
          <Field
            validationMessage={strings.Provision.ConfigSaveSuccess}
            validationState='none'
            style={{ width: '100%' }}
          >
            <ProgressBar />
          </Field>
        ) : (
          <>
            {onBack && (
              <Button appearance='subtle' icon={getFluentIcon('ArrowLeft')} onClick={onBack}>
                {strings.Provision.PreviousButtonLabel}
              </Button>
            )}
            <div className={styles.footerActions}>
              <Popover withArrow>
                <PopoverTrigger disableButtonEnhancement>
                  <Button appearance='secondary' disabled={!hasExistingConfig}>
                    {strings.Provision.ConfigResetButton}
                  </Button>
                </PopoverTrigger>
                <PopoverSurface>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '200px' }}>
                    <p style={{ margin: 0 }}>{strings.Provision.ConfigResetConfirmationLabel}</p>
                    <Button appearance='primary' onClick={handleReset}>
                      {strings.BooleanYes}
                    </Button>
                  </div>
                </PopoverSurface>
              </Popover>
              <Button appearance='primary' onClick={handleSave}>
                {strings.Provision.ConfigSaveButton}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
