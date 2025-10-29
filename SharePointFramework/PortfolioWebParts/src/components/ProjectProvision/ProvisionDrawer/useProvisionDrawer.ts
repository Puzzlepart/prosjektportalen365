/* eslint-disable prefer-spread */
/* eslint-disable no-console */
import { useContext, useState, useMemo } from 'react'
import { useMotion } from '@fluentui/react-motion-preview'
import { useMotionStyles } from './motionStyles'
import { ProjectProvisionContext } from '../context'
import { getGUID } from '@pnp/core'
import { IProvisionRequestItem } from 'interfaces/IProvisionRequestItem'
import { useId } from '@fluentui/react-components'
import strings from 'PortfolioWebPartsStrings'
import { getFieldsForType } from '../getFieldsForType'

/**
 * Component logic hook for `ProvisionDrawer`. This hook is responsible for
 * fetching data, sorting, filtering and other logic.
 */
export const useProvisionDrawer = () => {
  const context = useContext(ProjectProvisionContext)
  const levels = [
    {
      key: 'initial',
      title: context.props.level0Header,
      description: context.props.level0Description
    },
    {
      key: 'classification',
      title: context.props.level1Header,
      description: context.props.level1Description
    },
    {
      key: 'metadata',
      title: context.props.level2Header,
      description: context.props.level2Description
    }
  ]
  const [currentLevel, setCurrentLevel] = useState(0)
  const motionStyles = useMotionStyles()

  const toolbarBackIconMotion = useMotion<HTMLButtonElement>(currentLevel > 0)
  // const toolbarCalendarIconMotion = useMotion<HTMLButtonElement>(currentLevel === 1)
  const levelMotions = Array.from({ length: levels.length }, (_, i) =>
    useMotion<HTMLDivElement>(i === currentLevel)
  )

  const selectedType = context.column.get('type')
  const fieldsToUse =
    selectedType && context.props.typeFieldConfigurations
      ? getFieldsForType(context.props.fields, context.props.typeFieldConfigurations, selectedType)
      : context.props.fields

  const currentTypeConfig = context.state.types?.find((t) => t.title === selectedType)
  const currentTemplate = currentTypeConfig?.templateId
    ? context.state.siteTemplates?.find(
        (template) => template.id.toString() === currentTypeConfig.templateId
      )
    : null

  const getField = (fieldName: string) => {
    return fieldsToUse.find((field) => field.fieldName === fieldName)
  }

  const getGlobalSetting = (setting: string) => {
    return context.state.settings?.find((t) => t.title === setting)?.value
  }

  const enableSensitivityLabels = getGlobalSetting('EnableSensitivityLabels')
  const enableSensitivityLabelsLibrary = getGlobalSetting('EnableSensitivityLabelsLibrary')
  const enableRetentionLabels = getGlobalSetting('EnableRetentionLabels')
  const enableExpirationDate = getGlobalSetting('EnableExpirationDate')
  const enableReadOnlyGroup = getGlobalSetting('EnableReadOnlyGroup')
  const enableInternalChannel = getGlobalSetting('EnableInternalChannel')
  const enableAutoApproval = getGlobalSetting('EnableAutoApproval')

  const typeDefaults = context.state.types?.find((t) => t.title === selectedType)
  const enableExternalSharing = typeDefaults?.externalSharing

  const namingConvention = getGlobalSetting('UseNamingConventions')
    ? context.state.settings?.find((t) => t.title === 'NamingConvention')?.value
    : context.state.types?.find((t) => t.title === context.column.get('type'))?.namingConvention

  const urlPrefix = `${context.props.webAbsoluteUrl.split('sites')[0]}sites/`
  const aliasSuffix = '@' + context.props.pageContext.user.loginName.split('@')[1]

  const joinHub = !!context.state.types?.find((t) => t.title === context.column.get('type'))
    ?.joinHub

  const spaceTypeInternal = context.state.types?.find(
    (t) => t.title === context.column.get('type')
  )?.type

  const isTeam = spaceTypeInternal === 'Microsoft Teams Team'
  const isViva = spaceTypeInternal === 'Viva Engage Community'

  const onSave = async (): Promise<boolean> => {
    const baseUrl = `${context.props.webAbsoluteUrl.split('sites')[0]}sites/`

    const name = `${namingConvention?.prefixText}${context.column.get('name')}${
      namingConvention?.suffixText
    }`
    const alias = `${namingConvention?.prefixText}${context.column.get('alias')}${
      namingConvention?.suffixText
    }`

    const sensitivityLabelId = context.state.sensitivityLabels?.find(
      (t) => t.labelName === context.column.get('sensitivityLabel')
    )?.labelId

    const sensitivityLabelLibraryId = context.state.sensitivityLabelsLibrary?.find(
      (t) => t.labelName === context.column.get('sensitivityLabelLibrary')
    )?.labelId

    const expirationDate =
      context.props.expirationDateMode === 'date'
        ? context.column.get('expirationDate')
        : context.state.properties.expirationDate

    // Determine PnP template URL based on selected type
    const pnpTemplateUrl = currentTemplate?.pnpTemplateUrl || null
    const shouldApplyTemplate = !!currentTemplate && !!pnpTemplateUrl

    const requestItem: IProvisionRequestItem = {
      Title: context.column.get('name'),
      SpaceDisplayName: name,
      Description: context.column.get('description'),
      BusinessJustification: context.column.get('justification'),
      AdditionalInfo: context.column.get('additionalInfo'),
      SpaceType: context.column.get('type'),
      SpaceTypeInternal: spaceTypeInternal,
      Teamify: isTeam ? true : isViva ? false : context.column.get('teamify') || false,
      TeamsTemplate:
        context.column.get('teamify') || isTeam
          ? context.state.properties.teamTemplate || 'standard'
          : '',
      OwnersId: context.state.properties.owner,
      MembersId: context.state.properties.member,
      RequestedById: context.state.properties.requestedBy,
      ConfidentialData: context.column.get('isConfidential'),
      Visibility: context.state.properties.privacy || 'Private',
      ExternalSharingRequired: context.column.get('externalSharing'),
      Guests: context.column.get('guest')?.join(';'),
      SensitivityLabelName: context.column.get('sensitivityLabel'),
      SensitivityLabelId: sensitivityLabelId,
      SensitivityLabelLibraryName: context.column.get('sensitivityLabelLibrary'),
      SensitivityLabelLibraryId: sensitivityLabelLibraryId,
      RetentionLabelName: context.column.get('retentionLabel'),
      ApplyPnPTemplate: shouldApplyTemplate,
      PnPTemplateURL: {
        Description: pnpTemplateUrl,
        Url: pnpTemplateUrl
      },
      ExpirationDate: expirationDate,
      ReadOnlyGroup: context.column.get('readOnlyGroup'),
      InternalChannel:
        context.props.readOnlyGroupLogic && context.column.get('readOnlyGroup')
          ? context.column.get('internalChannel')
          : false,
      RequestedSource: strings.Provision.RequestedSource,
      SpaceImage: context.column.get('image')?.split(',')[1],
      SiteURL: {
        Description: `${baseUrl}${alias}`,
        Url: `${baseUrl}${alias}`
      },
      SiteAlias: context.column.get('alias'),
      MailboxAlias: alias,
      TimeZoneId: 4,
      LCID: 1044,
      JoinHub: joinHub,
      HubSiteTitle: joinHub ? context.props.pageContext.web.title : '',
      HubSite: joinHub ? context.props.pageContext.legacyPageContext.hubSiteId : '',
      Prefix: namingConvention?.prefixText,
      Suffix: namingConvention?.suffixText,
      Status: enableAutoApproval ? 'Approved' : 'Submitted',
      Stage: enableAutoApproval ? 'Approved' : 'Submitted',
      RequestKey: getGUID()
    }

    return await context.props.dataAdapter.addProvisionRequests(
      requestItem,
      context.props.provisionUrl
    )
  }

  const [siteExists, setSiteExists] = useState(false)

  const isSaveDisabled = useMemo(() => {
    const requiredFields = fieldsToUse.filter((field) => field.required && !field.hidden)

    const missingRequiredFields = requiredFields.some((field) => {
      const value = context.column.get(field.fieldName)

      if (value === null || value === undefined) {
        return true
      }

      if (Array.isArray(value)) {
        return value.length === 0
      }

      if (typeof value === 'string') {
        return value.trim().length === 0
      }

      if (typeof value === 'boolean') {
        return false
      }

      return false
    })

    if (context.props.debugMode || (typeof DEBUG !== 'undefined' && DEBUG)) {
      console.log('sitetype debug menu:', {
        selectedType: selectedType,
        requiredFields: requiredFields.map((f) => ({
          name: f.fieldName,
          required: f.required,
          hidden: f.hidden
        })),
        missingRequiredFields,
        siteExists,
        isSaveDisabled: missingRequiredFields || siteExists,
        currentTypeConfig,
        currentTemplate: currentTemplate
          ? {
              id: currentTemplate.id,
              title: currentTemplate.title,
              pnpTemplateUrl: currentTemplate.pnpTemplateUrl
            }
          : null
      })
    }

    return missingRequiredFields || siteExists
  }, [
    fieldsToUse,
    context.column,
    siteExists,
    selectedType,
    context.props.debugMode,
    currentTemplate,
    currentTypeConfig
  ])

  const missingFieldsInfo = useMemo(() => {
    const requiredFields = fieldsToUse.filter((field) => field.required && !field.hidden)

    const missingFields = requiredFields
      .filter((field) => {
        const value = context.column.get(field.fieldName)

        if (value === null || value === undefined) return true
        if (Array.isArray(value)) return value.length === 0
        if (typeof value === 'string') return value.trim().length === 0
        if (typeof value === 'boolean') return false
        return false
      })
      .map((field) => ({
        fieldName: field.fieldName,
        displayName: field.displayName,
        required: field.required
      }))

    return {
      hasErrors: missingFields.length > 0 || siteExists,
      missingFields,
      siteExists,
      totalRequired: requiredFields.length
    }
  }, [fieldsToUse, context.column, siteExists, currentTemplate])

  const fluentProviderId = useId('fp-provision-drawer')

  return {
    levels,
    currentLevel,
    setCurrentLevel,
    toolbarBackIconMotion,
    levelMotions,
    motionStyles,
    context,
    onSave,
    isSaveDisabled,
    missingFieldsInfo,
    siteExists,
    setSiteExists,
    namingConvention,
    enableSensitivityLabels,
    enableSensitivityLabelsLibrary,
    enableRetentionLabels,
    enableExpirationDate,
    enableReadOnlyGroup,
    enableInternalChannel,
    enableExternalSharing,
    urlPrefix,
    aliasSuffix,
    isTeam,
    joinHub,
    getField,
    fluentProviderId,
    currentTemplate,
    currentTypeConfig
  }
}
