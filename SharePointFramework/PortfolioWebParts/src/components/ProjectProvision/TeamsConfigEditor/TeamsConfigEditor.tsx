import {
  Button,
  Field,
  FluentProvider,
  IdPrefixProvider,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Textarea
} from '@fluentui/react-components'
import { customLightTheme, getFluentIcon } from 'pp365-shared-library'
import * as React from 'react'
import { useContext, useState } from 'react'
import { ProjectProvisionContext } from '../context'
import strings from 'PortfolioWebPartsStrings'
import styles from './TeamsConfigEditor.module.scss'

export interface ITeamsConfigEditorProps {
  fluentProviderId: string
  onBack: () => void
  isAdmin: boolean
}

export const TeamsConfigEditor: React.FC<ITeamsConfigEditorProps> = ({
  fluentProviderId,
  onBack,
  isAdmin
}) => {
  const context = useContext(ProjectProvisionContext)

  const NON_SERIALIZABLE_KEYS = new Set([
    'dataAdapter',
    'pageContext',
    'spfxContext',
    'webAbsoluteUrl',
    'icon',
    'isTeamsContext',
    'hasProjectProvisionAccess'
  ])

  const getSerializableConfig = () => {
    const config: Record<string, any> = {}
    Object.keys(context.props).forEach((key) => {
      const value = (context.props as any)[key]
      if (!NON_SERIALIZABLE_KEYS.has(key) && typeof value !== 'function') {
        config[key] = value
      }
    })
    return config
  }

  const [jsonValue, setJsonValue] = useState(() => {
    return JSON.stringify(getSerializableConfig(), null, 2)
  })

  if (!isAdmin) {
    return (
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme}>
          <div className={styles.inlineContainer}>
            <div className={styles.header}>
              <Button
                appearance='subtle'
                icon={getFluentIcon('ArrowLeft')}
                onClick={onBack}
                className={styles.backButton}
              >
                {strings.Provision.PreviousButtonLabel}
              </Button>
              <h2 className={styles.title}>
                {strings.Provision.ConfigEditorTitle || 'Web Part Configuration'}
              </h2>
            </div>
            <MessageBar intent='error'>
              <MessageBarBody>
                <MessageBarTitle>{strings.AccessTitle || 'Access Denied'}</MessageBarTitle>
                {strings.Provision.ConfigEditorAccessDenied ||
                  'You must be a site administrator to edit configuration.'}
              </MessageBarBody>
            </MessageBar>
          </div>
        </FluentProvider>
      </IdPrefixProvider>
    )
  }
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setError(null)
    setSuccess(null)

    try {
      JSON.parse(jsonValue)
    } catch (e) {
      setError(strings.Provision.ConfigInvalidJson || 'Invalid JSON format')
      return
    }

    setIsSaving(true)
    try {
      const config = JSON.parse(jsonValue)
      await context.props.dataAdapter.saveTeamsConfig(context.props.provisionUrl, config)
      setSuccess(strings.Provision.ConfigSaveSuccess || 'Configuration saved successfully')

      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (e) {
      setError(
        strings.Provision.ConfigSaveError ||
          `Failed to save configuration: ${e.message || e.toString()}`
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setJsonValue(JSON.stringify(getSerializableConfig(), null, 2))
    setError(null)
    setSuccess(null)
  }

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme}>
        <div className={styles.inlineContainer}>
          <div className={styles.header}>
            <Button
              appearance='subtle'
              icon={getFluentIcon('ArrowLeft')}
              onClick={onBack}
              className={styles.backButton}
            >
              {strings.Provision.PreviousButtonLabel}
            </Button>
            <h2 className={styles.title}>
              {strings.Provision.ConfigEditorTitle || 'Web Part Configuration'}
            </h2>
          </div>

          <div className={styles.description}>
            {strings.Provision.ConfigEditorDescription ||
              'Edit the web part configuration in JSON format. Changes will be saved to TeamsAppConfig.json and applied when you reload the app.'}
          </div>

          {error && (
            <MessageBar intent='error'>
              <MessageBarBody>
                <MessageBarTitle>{strings.ErrorTitle || 'Error'}</MessageBarTitle>
                {error}
              </MessageBarBody>
            </MessageBar>
          )}

          {success && (
            <MessageBar intent='success'>
              <MessageBarBody>
                <MessageBarTitle>
                  {strings.Provision.ConfigSaveSuccessTitle || 'Success'}
                </MessageBarTitle>
                {success}
              </MessageBarBody>
            </MessageBar>
          )}

          <Field
            label={strings.Provision.ConfigJsonLabel || 'Configuration (JSON)'}
            hint={
              strings.Provision.ConfigJsonHint ||
              'Edit the JSON configuration. Make sure the JSON is valid before saving.'
            }
          >
            <Textarea
              className={styles.textarea}
              value={jsonValue}
              onChange={(_, data) => {
                setJsonValue(data.value)
                setError(null)
                setSuccess(null)
              }}
              rows={20}
              resize='vertical'
            />
          </Field>

          <div className={styles.actions}>
            <Button appearance='secondary' onClick={handleReset} disabled={isSaving}>
              {strings.Provision.ConfigResetButton || 'Reset'}
            </Button>
            <Button appearance='primary' onClick={handleSave} disabled={isSaving}>
              {isSaving
                ? strings.Provision.ConfigSavingButton || 'Saving...'
                : strings.Provision.ConfigSaveButton || 'Save Configuration'}
            </Button>
          </div>
        </div>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
