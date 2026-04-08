import {
  Button,
  Field,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Textarea
} from '@fluentui/react-components'
import { getFluentIcon } from 'pp365-shared-library'
import * as React from 'react'
import { useContext, useState } from 'react'
import { ProjectProvisionContext } from '../context'
import strings from 'PortfolioWebPartsStrings'
import styles from './TeamsConfigEditor.module.scss'

export interface ITeamsConfigEditorProps {
  isAdmin: boolean
  onBack?: () => void
}

const NON_SERIALIZABLE_KEYS = new Set([
  'dataAdapter',
  'pageContext',
  'spfxContext',
  'webAbsoluteUrl',
  'icon',
  'isTeamsContext',
  'hasProjectProvisionAccess',
  'manifestId',
  'provisionUrl',
  'displayMode',
  'sp',
  'webServerRelativeUrl',
  'webTitle',
  'siteId',
  'isSiteAdmin',
  'buttonLabel',
  'appearance',
  'size',
  'renderMode',
  'drawerSize'
])

export const TeamsConfigEditor: React.FC<ITeamsConfigEditorProps> = ({ isAdmin, onBack }) => {
  const context = useContext(ProjectProvisionContext)

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

  const [jsonValue, setJsonValue] = useState(() => JSON.stringify(getSerializableConfig(), null, 2))
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  if (!isAdmin) {
    return (
      <div className={styles.container}>
        <MessageBar intent='error'>
          <MessageBarBody>
            <MessageBarTitle>{strings.AccessTitle || 'Access Denied'}</MessageBarTitle>
            {strings.Provision.ConfigEditorAccessDenied}
          </MessageBarBody>
        </MessageBar>
      </div>
    )
  }

  const handleSave = async () => {
    setError(null)
    setSuccess(null)
    try {
      JSON.parse(jsonValue)
    } catch {
      setError(strings.Provision.ConfigInvalidJson)
      return
    }
    setIsSaving(true)
    try {
      const config = JSON.parse(jsonValue)
      await context.props.dataAdapter.saveTeamsConfig(context.props.provisionUrl, config)
      setSuccess(strings.Provision.ConfigSaveSuccess)
      setTimeout(() => window.location.reload(), 1500)
    } catch (e) {
      setError(strings.Provision.ConfigSaveError || `Failed to save: ${e}`)
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
    <div className={styles.container}>
      <p className={styles.description}>{strings.Provision.ConfigEditorDescription}</p>

      {error && (
        <MessageBar intent='error'>
          <MessageBarBody>
            <MessageBarTitle>{strings.ErrorTitle}</MessageBarTitle>
            {error}
          </MessageBarBody>
        </MessageBar>
      )}

      {success && (
        <MessageBar intent='success'>
          <MessageBarBody>
            <MessageBarTitle>{strings.Provision.ConfigSaveSuccessTitle}</MessageBarTitle>
            {success}
          </MessageBarBody>
        </MessageBar>
      )}

      <Field label={strings.Provision.ConfigJsonLabel} hint={strings.Provision.ConfigJsonHint}>
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

      <div className={styles.footer}>
        {onBack && (
          <Button appearance='subtle' icon={getFluentIcon('ArrowLeft')} onClick={onBack}>
            {strings.Provision.PreviousButtonLabel}
          </Button>
        )}
        <div className={styles.footerActions}>
          <Button appearance='secondary' onClick={handleReset} disabled={isSaving}>
            {strings.Provision.ConfigResetButton}
          </Button>
          <Button appearance='primary' onClick={handleSave} disabled={isSaving}>
            {isSaving ? strings.Provision.ConfigSavingButton : strings.Provision.ConfigSaveButton}
          </Button>
        </div>
      </div>
    </div>
  )
}
