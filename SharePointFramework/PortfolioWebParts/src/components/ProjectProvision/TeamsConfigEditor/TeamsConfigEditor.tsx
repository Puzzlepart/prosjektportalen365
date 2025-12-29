import {
  Button,
  Field,
  FluentProvider,
  IdPrefixProvider,
  makeStyles,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  shorthands,
  Textarea,
  tokens
} from '@fluentui/react-components'
import { customLightTheme, getFluentIcon } from 'pp365-shared-library'
import * as React from 'react'
import { useContext, useState } from 'react'
import { ProjectProvisionContext } from '../context'
import strings from 'PortfolioWebPartsStrings'

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
    ...shorthands.padding('20px'),
    maxWidth: '900px',
    ...shorthands.margin('0', 'auto')
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke1),
    paddingBottom: '12px'
  },
  title: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1
  },
  description: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    lineHeight: '1.5'
  },
  actions: {
    display: 'flex',
    ...shorthands.gap('8px'),
    justifyContent: 'flex-end'
  },
  textarea: {
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
    fontSize: '12px'
  }
})

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
  const styles = useStyles()
  
  // Extract only serializable configuration properties
  const getSerializableConfig = () => {
    const props = context.props
    // Explicitly include only web part configuration properties
    return {
      // General
      buttonLabel: props.buttonLabel,
      autoOwner: props.autoOwner,
      renderMode: props.renderMode,
      
      // Visuals
      siteTypeRenderMode: props.siteTypeRenderMode,
      expirationDateMode: props.expirationDateMode,
      
      // Titles and descriptions
      level0Header: props.level0Header,
      level0Description: props.level0Description,
      level1Header: props.level1Header,
      level1Description: props.level1Description,
      level2Header: props.level2Header,
      level2Description: props.level2Description,
      footerDescription: props.footerDescription,
      
      // Hide/show
      hideStatusMenu: props.hideStatusMenu,
      hideSettingsMenu: props.hideSettingsMenu,
      
      // Field logic
      defaultExpirationDate: props.defaultExpirationDate,
      readOnlyGroupLogic: props.readOnlyGroupLogic,
      
      // Advanced
      provisionUrl: props.provisionUrl,
      requireProvisionAccess: props.requireProvisionAccess,
      fields: props.fields,
      typeFieldConfigurations: props.typeFieldConfigurations,
      debugMode: props.debugMode,
      
      // Other
      disabled: props.disabled,
      appearance: props.appearance,
      size: props.size
    }
  }
  
  const [jsonValue, setJsonValue] = useState(() => {
    return JSON.stringify(getSerializableConfig(), null, 2)
  })

  // Access denied for non-admins
  if (!isAdmin) {
    return (
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme} style={{ background: 'transparent' }}>
          <div className={styles.container}>
            <div className={styles.header}>
              <div className={styles.title}>
                {strings.Provision.ConfigEditorTitle || 'Configuration Editor'}
              </div>
              <Button
                appearance='subtle'
                icon={getFluentIcon('ChevronLeft')}
                onClick={onBack}
                aria-label={strings.Aria.Back}
              >
                {strings.Aria.Back}
              </Button>
            </div>
            <MessageBar intent='error'>
              <MessageBarBody>
                <MessageBarTitle>{strings.AccessTitle || 'Access Denied'}</MessageBarTitle>
                {strings.Provision.ConfigEditorAccessDenied || 'You must be a site administrator to edit configuration.'}
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

    // Validate JSON
    try {
      JSON.parse(jsonValue)
    } catch (e) {
      setError(strings.Provision.ConfigInvalidJson || 'Invalid JSON format')
      return
    }

    setIsSaving(true)
    try {
      // Save to TeamsAppConfig.json in /sites/bestillingsportalen/Shared Documents/
      const config = JSON.parse(jsonValue)
      await context.props.dataAdapter.saveTeamsConfig(context.props.provisionUrl, config)
      setSuccess(strings.Provision.ConfigSaveSuccess || 'Configuration saved successfully')
      
      // Reload page to apply new config
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
    setJsonValue(JSON.stringify(context.props, null, 2))
    setError(null)
    setSuccess(null)
  }

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme} style={{ background: 'transparent' }}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <div className={styles.title}>
                {strings.Provision.ConfigEditorTitle || 'Configuration Editor'}
              </div>
            </div>
            <Button
              appearance='subtle'
              icon={getFluentIcon('ChevronLeft')}
              onClick={onBack}
              aria-label={strings.Aria.Back}
            >
              {strings.Aria.Back}
            </Button>
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
                <MessageBarTitle>{strings.Provision.ConfigSaveSuccessTitle || 'Success'}</MessageBarTitle>
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
