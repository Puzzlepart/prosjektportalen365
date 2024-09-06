import * as React from 'react'
import {
  OverlayDrawer,
  DrawerHeader,
  DrawerHeaderNavigation,
  ToolbarGroup,
  ToolbarButton,
  mergeClasses,
  DrawerBody,
  DrawerHeaderTitle,
  Input,
  Textarea,
  Divider,
  Switch,
  DrawerFooter,
  Toolbar,
  Dropdown,
  Option,
  Button,
  Tag,
  Tooltip,
  Toast,
  ToastBody,
  ToastTitle,
  IdPrefixProvider,
  FluentProvider
} from '@fluentui/react-components'
import {
  ArrowLeft24Regular,
  DataUsage24Regular,
  Settings24Regular,
  Dismiss24Regular
} from '@fluentui/react-icons'
import strings from 'PortfolioWebPartsStrings'
import { FieldContainer, customLightTheme } from 'pp365-shared-library'
import { SiteType } from './SiteType'
import { useProvisionDrawer } from './useProvisionDrawer'
import styles from './ProvisionDrawer.module.scss'
import { User } from './User'
import { Guest } from './Guest'

export const ProvisionDrawer = (props: { toast: any }) => {
  const {
    motionStyles,
    level2,
    setLevel2,
    toolbarBackIconMotion,
    toolbarCalendarIconMotion,
    level1Motion,
    level2Motion,
    context,
    onSave,
    isSaveDisabled,
    siteExists,
    setSiteExists,
    namingConvention,
    urlPrefix,
    aliasSuffix,
    fluentProviderId
  } = useProvisionDrawer()

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme}>
        <OverlayDrawer
          role='panel'
          position='end'
          open={context.state.showProvisionDrawer}
          size='medium'
          onOpenChange={(_, { open }) => context.setState({ showProvisionDrawer: open })}
        >
          <DrawerHeader>
            <DrawerHeaderNavigation>
              <Toolbar className={styles.toolbar}>
                <ToolbarGroup>
                  {toolbarBackIconMotion.canRender && (
                    <ToolbarButton
                      ref={toolbarBackIconMotion.ref}
                      className={mergeClasses(
                        motionStyles.toolbarButton,
                        toolbarBackIconMotion.active && motionStyles.toolbarButtonVisible
                      )}
                      title={strings.Aria.Back}
                      appearance='subtle'
                      icon={<ArrowLeft24Regular />}
                      onClick={() => setLevel2(false)}
                    />
                  )}
                </ToolbarGroup>
                <ToolbarGroup>
                  {toolbarCalendarIconMotion.canRender && (
                    <ToolbarButton
                      ref={toolbarCalendarIconMotion.ref}
                      className={mergeClasses(
                        motionStyles.toolbarButton,
                        toolbarCalendarIconMotion.active && motionStyles.toolbarButtonVisible
                      )}
                      appearance='subtle'
                      icon={<DataUsage24Regular />}
                      onClick={() => setLevel2(true)}
                    />
                  )}

                  <ToolbarButton
                    appearance='subtle'
                    title={strings.Aria.Settings}
                    icon={<Settings24Regular />}
                  />
                  <ToolbarButton
                    title={strings.Aria.Close}
                    appearance='subtle'
                    icon={<Dismiss24Regular />}
                    onClick={() => context.setState({ showProvisionDrawer: false })}
                  />
                </ToolbarGroup>
              </Toolbar>
            </DrawerHeaderNavigation>
          </DrawerHeader>
          <div className={styles.body}>
            {level1Motion.canRender && (
              <DrawerBody
                ref={level1Motion.ref}
                className={mergeClasses(
                  styles.level,
                  motionStyles.level,
                  motionStyles.level1,
                  level1Motion.active && motionStyles.levelVisible
                )}
              >
                <DrawerHeaderTitle>{strings.Provision.DrawerLevel1HeaderText}</DrawerHeaderTitle>
                <p>{strings.Provision.DrawerLevel1DescriptionText}</p>
                <div className={styles.content}>
                  <FieldContainer iconName='AppsList' label={strings.Provision.SiteTypeFieldLabel}>
                    <div className={styles.sitetypes}>
                      {context.state.types.map((type) => {
                        if (
                          !type.visibleTo ||
                          type.visibleTo?.some((user) =>
                            user?.EMail?.includes(context.props?.pageContext?.user?.loginName)
                          )
                        ) {
                          return (
                            <SiteType
                              key={type.title}
                              title={type.title}
                              description={type.description}
                              image={type.image?.Url}
                              type={type.type}
                            />
                          )
                        }
                      })}
                    </div>
                  </FieldContainer>
                  <FieldContainer
                    iconName='TextNumberFormat'
                    label={strings.Provision.SiteNameFieldLabel}
                    required={true}
                    validationState={
                      context.column.get('name').length
                        ? siteExists
                          ? 'error'
                          : 'success'
                        : 'none'
                    }
                    validationMessage={
                      context.column.get('name').length
                        ? siteExists
                          ? strings.Provision.SiteNameValidationErrorMessage
                          : strings.Provision.SiteNameValidationSuccessMessage
                        : strings.Provision.SiteNameFieldDescription
                    }
                  >
                    <Input
                      value={context.column.get('name')}
                      onChange={async (_, data) => {
                        context.setColumn('name', data.value)

                        if (data.value) {
                          setTimeout(async () => {
                            const value = data.value
                              .replace(/ /g, '')
                              .replace(/[^a-z-A-Z0-9-]/g, '')

                            const alias = `${namingConvention?.prefixText}${value}${namingConvention?.suffixText}`

                            setSiteExists(
                              await context.props.dataAdapter.siteExists(`${urlPrefix}${alias}`)
                            )
                          }, 500)
                        }
                      }}
                      contentBefore={
                        namingConvention?.prefixText && (
                          <Tooltip
                            withArrow
                            content={strings.Provision.SiteNamePrefixTooltipText}
                            relationship='label'
                          >
                            <Tag size='small'>{namingConvention?.prefixText}</Tag>
                          </Tooltip>
                        )
                      }
                      contentAfter={
                        namingConvention?.suffixText && (
                          <Tooltip
                            withArrow
                            content={strings.Provision.SiteNameSuffixTooltipText}
                            relationship='label'
                          >
                            <Tag size='small'>{namingConvention?.suffixText}</Tag>
                          </Tooltip>
                        )
                      }
                      placeholder={strings.Placeholder.SiteName}
                    />
                  </FieldContainer>
                  <FieldContainer
                    iconName='TextAlignLeft'
                    label={strings.Provision.SiteDescriptionFieldLabel}
                    required={true}
                    description={strings.Provision.SiteDescriptionFieldDescription}
                  >
                    <Textarea
                      value={context.column.get('description')}
                      onChange={(_, data) => context.setColumn('description', data.value)}
                      rows={2}
                      placeholder={strings.Placeholder.SiteDescription}
                    />
                  </FieldContainer>
                  <FieldContainer
                    iconName='TextAlignLeft'
                    label={strings.Provision.BusinessJustificationFieldLabel}
                    description={strings.Provision.BusinessJustificationFieldDescription}
                    required={true}
                  >
                    <Textarea
                      value={context.column.get('justification')}
                      onChange={(_, data) => context.setColumn('justification', data.value)}
                      rows={2}
                      placeholder={strings.Placeholder.BusinessJustificationField}
                    />
                  </FieldContainer>
                  <Divider />
                  <FieldContainer
                    iconName='Person'
                    label={strings.Provision.OwnerFieldLabel}
                    description={strings.Provision.OwnerFieldDescription}
                    required={true}
                  >
                    <User type='owner' />
                  </FieldContainer>
                  <FieldContainer
                    iconName='People'
                    label={strings.Provision.MemberFieldLabel}
                    description={strings.Provision.MemberFieldDescription}
                  >
                    {/* Members can not be the same as the owner */}
                    <User type='member' />
                  </FieldContainer>
                  <Divider />
                  <FieldContainer
                    iconName='TextNumberFormat'
                    label={strings.Provision.AliasFieldLabel}
                  >
                    <Input
                      disabled
                      value={`${namingConvention?.prefixText}${context.column.get('alias')}${
                        namingConvention?.suffixText
                      }`}
                      contentAfter={<Tag size='small'>{aliasSuffix}</Tag>}
                    />
                  </FieldContainer>
                  <FieldContainer iconName='Link' label={strings.Provision.UrlFieldLabel}>
                    <Input
                      disabled
                      value={`${namingConvention?.prefixText}${context.column.get('alias')}${
                        namingConvention?.suffixText
                      }`}
                      contentBefore={<Tag size='small'>{urlPrefix}</Tag>}
                    />
                  </FieldContainer>
                </div>
              </DrawerBody>
            )}

            {level2Motion.canRender && (
              <DrawerBody
                ref={level2Motion.ref}
                className={mergeClasses(
                  styles.level,
                  motionStyles.level,
                  motionStyles.level2,
                  level2Motion.active && motionStyles.levelVisible
                )}
              >
                <DrawerHeaderTitle>{strings.Provision.DrawerLevel2HeaderText}</DrawerHeaderTitle>
                <p>{strings.Provision.DrawerLevel2DescriptionText}</p>
                <div className={styles.content}>
                  {/* {DEBUG && <DebugModel />} */}
                  <FieldContainer
                    iconName='PeopleTeam'
                    label={strings.Provision.TeamifyFieldLabel}
                    description={strings.Provision.TeamifyFieldDescription}
                  >
                    <Switch
                      checked={context.column.get('teamify')}
                      value={context.column.get('teamify')}
                      onChange={(_, data) => {
                        context.setColumn('teamify', data.checked)
                      }}
                    />
                  </FieldContainer>
                  <FieldContainer
                    iconName='PeopleAudience'
                    label={strings.Provision.TeamTemplateFieldLabel}
                    description={strings.Provision.TeamTemplateFieldDescription}
                    hidden={!context.column.get('teamify')}
                  >
                    <Dropdown
                      defaultValue={'Standard'}
                      selectedOptions={[context.column.get('teamTemplate')]}
                      value={context.column.get('teamTemplate')}
                      defaultSelectedOptions={['Standard']}
                      onOptionSelect={(_, data) => {
                        context.setColumn('teamTemplate', data.optionValue)
                      }}
                    >
                      {context.state.teamTemplates.map((template) => (
                        <Option key={template.title} value={template.title}>
                          {template.title}
                        </Option>
                      ))}
                    </Dropdown>
                  </FieldContainer>
                  <FieldContainer
                    iconName='BoxToolbox'
                    label={strings.Provision.ConfidentialFieldLabel}
                    description={strings.Provision.ConfidentialFieldDescription}
                  >
                    <Switch
                      checked={context.column.get('isConfidential')}
                      value={context.column.get('isConfidential')}
                      onChange={(_, data) => {
                        context.setColumn('isConfidential', data.checked)

                        if (data.checked) {
                          context.setColumn('privacy', strings.Provision.PrivacyFieldOptionPrivate)
                        }
                      }}
                    />
                  </FieldContainer>
                  <FieldContainer
                    iconName='Eye'
                    label={strings.Provision.PrivacyFieldLabel}
                    description={strings.Provision.PrivacyFieldDescription}
                  >
                    <Dropdown
                      defaultValue={context.column.get('privacy')}
                      selectedOptions={[context.column.get('privacy')]}
                      value={context.column.get('privacy')}
                      defaultSelectedOptions={[context.column.get('privacy')]}
                      onOptionSelect={(_, data) => {
                        context.setColumn('privacy', data.optionValue)
                      }}
                      disabled={context.column.get('isConfidential')}
                    >
                      <Option value={strings.Provision.PrivacyFieldOptionPrivate}>
                        {strings.Provision.PrivacyFieldOptionPrivate}
                      </Option>
                      <Option value={strings.Provision.PrivacyFieldOptionPublic}>
                        {strings.Provision.PrivacyFieldOptionPublic}
                      </Option>
                    </Dropdown>
                  </FieldContainer>
                  <FieldContainer
                    iconName='Guest'
                    label={strings.Provision.ExternalSharingFieldLabel}
                    description={strings.Provision.ExternalSharingFieldDescription}
                  >
                    <Switch
                      checked={context.column.get('externalSharing')}
                      value={context.column.get('externalSharing')}
                      onChange={(_, data) => {
                        context.setColumn('externalSharing', data.checked)

                        if (!data.checked) {
                          context.setColumn('guest', [])
                        }
                      }}
                    />
                  </FieldContainer>
                  <FieldContainer
                    iconName='People'
                    label={strings.Provision.GuestFieldLabel}
                    description={strings.Provision.GuestFieldDescription}
                    hidden={!context.column.get('externalSharing')}
                  >
                    <Guest />
                  </FieldContainer>
                  <FieldContainer
                    iconName='LocalLanguage'
                    label={strings.Provision.LanguageFieldLabel}
                  >
                    <Dropdown
                      defaultValue={context.column.get('language')}
                      defaultSelectedOptions={[context.column.get('language')]}
                      disabled
                    />
                  </FieldContainer>
                  <FieldContainer iconName='Clock' label={strings.Provision.TimeZoneFieldLabel}>
                    <Dropdown
                      defaultValue={context.column.get('timeZone')}
                      defaultSelectedOptions={[context.column.get('timeZone')]}
                      disabled
                    />
                  </FieldContainer>
                  <FieldContainer iconName='Database' label={strings.Provision.HubSiteFieldLabel}>
                    <Dropdown
                      defaultValue={context.column.get('hubSiteTitle')}
                      defaultSelectedOptions={[context.column.get('hubSiteTitle')]}
                      disabled
                    />
                  </FieldContainer>
                  <p className={styles.ignoreGap}>
                    {strings.Provision.DrawerFooterDescriptionText}
                  </p>
                </div>
              </DrawerBody>
            )}
          </div>
          <DrawerFooter className={styles.footer}>
            <Button appearance='subtle' disabled={!level2} onClick={() => setLevel2(false)}>
              {strings.Provision.PreviousButtonLabel}
            </Button>
            <Button
              appearance='primary'
              disabled={level2 && isSaveDisabled}
              onClick={() => {
                level2
                  ? onSave().then((response) => {
                      if (response) {
                        context.reset()
                        props.toast(
                          <Toast appearance='inverted'>
                            <ToastTitle>{strings.Provision.ToastCreatedTitle}</ToastTitle>
                            <ToastBody>{strings.Provision.ToastCreatedBody}</ToastBody>
                          </Toast>,
                          { intent: 'success' }
                        )
                        context.setState({ showProvisionDrawer: false, properties: {} })
                        setLevel2(false)
                      } else {
                        props.toast(
                          <Toast appearance='inverted'>
                            <ToastTitle>{strings.Provision.ToastCreatedErrorTitle}</ToastTitle>
                            <ToastBody>{strings.Provision.ToastCreatedErrorBody}</ToastBody>
                          </Toast>,
                          { intent: 'error' }
                        )
                      }
                    })
                  : setLevel2(true)
              }}
            >
              {level2 ? strings.Provision.ProvisionButtonLabel : strings.Provision.NextButtonLabel}
            </Button>
          </DrawerFooter>
        </OverlayDrawer>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
