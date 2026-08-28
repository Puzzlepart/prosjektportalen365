import { useContext, useState, useMemo, useRef } from 'react'
import { useMotion } from '@fluentui/react-motion-preview'
import { useMotionStyles } from './motionStyles'
import { ProjectProvisionContext } from '../context'
import { getGUID } from '@pnp/core'
import { IProvisionRequestItem } from 'interfaces/IProvisionRequestItem'
import { useId } from '@fluentui/react-components'
import strings from 'PortfolioWebPartsStrings'
import { getFieldsForType } from '../getFieldsForType'
import { normalizeHubSiteId } from 'utils/normalizeHubSiteId'
import {
  applyProjectPropertiesFromMetadata,
  applyTaxonomyUpdatesAfterAdd
} from '../applyProjectPropertiesFromMetadata'

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
  const managedPath = getGlobalSetting('SPOManagedPath')

  // The settings list stores numbers as strings; anything unset/invalid/≤0
  // falls back to 1 so tenants without the setting keep today's behavior.
  const minimumOwnersSetting = parseInt(String(getGlobalSetting('MinimumOwners') ?? ''), 10)
  const minimumOwners =
    Number.isFinite(minimumOwnersSetting) && minimumOwnersSetting > 0 ? minimumOwnersSetting : 1

  const typeDefaults = context.state.types?.find((t) => t.title === selectedType)
  const enableExternalSharing = typeDefaults?.externalSharing

  const namingConvention =
    getGlobalSetting('UseNamingConventions') === 'true'
      ? context.state.settings?.find((t) => t.title === 'NamingConvention')?.value
      : context.state.types?.find((t) => t.title === context.column.get('type'))?.namingConvention

  // `webAbsoluteUrl.split(managedPath)[0]` keeps its trailing slash, so it must
  // not be joined with another '/' — the resulting double slash makes the URL
  // differ from the one the provisioning engine creates.
  const urlPrefix = `${context.props.webAbsoluteUrl
    .split(managedPath)[0]
    .replace(/\/+$/, '')}/${managedPath}/`
  const aliasSuffix = '@' + context.props.pageContext.user.loginName.split('@')[1]

  // A type that points at a specific `DefaultHub` is always hub associated —
  // otherwise the configured hub would be silently dropped on save.
  const joinHub = !!currentTypeConfig?.joinHub || !!currentTypeConfig?.defaultHub

  const usesDifferentHub =
    joinHub &&
    !!context.column.get('hubSite') &&
    normalizeHubSiteId(context.column.get('hubSite')) !==
      normalizeHubSiteId(context.props.pageContext.legacyPageContext.hubSiteId)

  const hubResolveFailed = joinHub && !!context.column.get('hubSiteResolveFailed')

  const spaceTypeInternal = context.state.types?.find(
    (t) => t.title === context.column.get('type')
  )?.type

  const isTeam = spaceTypeInternal === 'Microsoft Teams Team'
  const isViva = spaceTypeInternal === 'Viva Engage Community'

  const [siteExists, setSiteExists] = useState(false)
  const [requestExists, setRequestExists] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const isSavingRef = useRef(false)

  const hasUnresolvedProvisionUsers = () =>
    ['owner', 'member', 'requestedBy'].some((field) => {
      const users = context.column.get(field)
      if (!Array.isArray(users)) return false
      return users.some((user) => !user?.secondaryText && !user?.id)
    })

  const submitProvisionRequest = async (): Promise<boolean | 'conflict' | 'userResolveError'> => {
    const name = `${namingConvention?.prefixText ?? ''}${context.column.get('name')}${
      namingConvention?.suffixText ?? ''
    }`
    const alias = `${namingConvention?.prefixText ?? ''}${context.column.get('alias')}${
      namingConvention?.suffixText ?? ''
    }`

    // Re-validate right before submitting — the debounced check while typing
    // can be stale or still in flight when the user clicks save.
    const [existingSite, pendingRequest] = await Promise.all([
      context.props.dataAdapter.siteExists(`${urlPrefix}${alias}`),
      context.props.dataAdapter.provisionRequestExists(alias, context.props.provisionUrl)
    ])
    if (existingSite || pendingRequest) {
      setSiteExists(existingSite)
      setRequestExists(pendingRequest)
      return 'conflict'
    }

    if (hasUnresolvedProvisionUsers()) {
      return 'userResolveError'
    }

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

    const parentSite = context.props.parentMode
      ? {
          SiteId: context.props.pageContext.site.id.toString(),
          Title: context.props.pageContext.web.title,
          SPWebURL: context.props.pageContext.web.absoluteUrl,
          HubSiteUrl: context.props.dataAdapter.portalDataService.url
        }
      : undefined

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
      OwnersId: context.column.get('owner'),
      MembersId: context.column.get('member'),
      RequestedById: context.column.get('requestedBy'),
      ConfidentialData: context.column.get('isConfidential'),
      Metadata: context.column.get('metadata'),
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
        Description: `${urlPrefix}${alias}`,
        Url: `${urlPrefix}${alias}`
      },
      SiteAlias: alias,
      MailboxAlias: alias,
      TimeZoneId: 4,
      LCID: 1044,
      JoinHub: joinHub,
      HubSiteTitle: joinHub ? context.column.get('hubSiteTitle') || '' : '',
      HubSite: joinHub ? context.column.get('hubSite') || '' : '',
      ParentSite: context.props.parentMode ? parentSite?.SPWebURL : '',
      Prefix: namingConvention?.prefixText,
      Suffix: namingConvention?.suffixText,
      Status: enableAutoApproval ? 'Approved' : 'Submitted',
      Stage: enableAutoApproval ? 'Approved' : 'Submitted',
      RequestKey: getGUID()
    }

    const isParentMode = !!context.props.parentMode
    const targetHubSiteUrl = usesDifferentHub ? context.column.get('hubSiteUrl') : ''
    const hubUrl =
      targetHubSiteUrl ||
      (isParentMode ? parentSite.HubSiteUrl : context.props.dataAdapter.portalDataService?.url)
    if (hubUrl) {
      const properties: Record<string, any> = {
        Title: context.column.get('name'),
        GtSiteUrl: `${urlPrefix}${alias}`
      }
      if (isParentMode) {
        properties.GtParentProjects = `[{"SiteId":"${parentSite.SiteId}","Title":"${parentSite.Title}","SPWebURL":"${parentSite.SPWebURL}","HubSiteUrl":"${parentSite.HubSiteUrl}"}]`
      }
      const baseKeyCount = Object.keys(properties).length

      const { taxonomyUpdates } = await applyProjectPropertiesFromMetadata(
        properties,
        context.column.get('metadata'),
        hubUrl,
        context.props.dataAdapter
      )
      const hasMetadata =
        Object.keys(properties).length > baseKeyCount || taxonomyUpdates.length > 0

      if (isParentMode || hasMetadata) {
        const added = (await context.props.dataAdapter.addProjectData(properties, hubUrl)) as
          | { Id?: number }
          | undefined
        if (added?.Id && taxonomyUpdates.length > 0) {
          await applyTaxonomyUpdatesAfterAdd(
            added.Id,
            hubUrl,
            taxonomyUpdates,
            context.props.dataAdapter
          )
        }
      }
    }

    return await context.props.dataAdapter.addProvisionRequests(
      requestItem,
      context.props.provisionUrl
    )
  }

  /**
   * Submits the provision request, guarding against double submits. Without
   * the guard a double click fires two concurrent submits, and the duplicate
   * check in `submitProvisionRequest` can't catch the second one — neither has
   * added its request to the list by the time both run their check, so two
   * requests for the same site end up in the list.
   *
   * The ref is what actually blocks the second click: `isSaving` may not have
   * been committed yet when the two click events arrive back to back.
   */
  const onSave = async (): Promise<boolean | 'conflict' | 'busy' | 'userResolveError'> => {
    if (isSavingRef.current) return 'busy'
    isSavingRef.current = true
    setIsSaving(true)
    try {
      return await submitProvisionRequest()
    } catch (error) {
      console.warn('(useProvisionDrawer) (onSave) Failed to submit provision request:', error)
      return false
    } finally {
      isSavingRef.current = false
      setIsSaving(false)
    }
  }

  const duplicateOwnerMembers = useMemo(() => {
    const owners: any[] = context.column.get('owner') || []
    const members: any[] = context.column.get('member') || []
    if (owners.length === 0 || members.length === 0) return []
    const ownerEmails = new Set(owners.map((u) => u?.secondaryText?.toLowerCase()).filter(Boolean))
    return members.filter((m) => ownerEmails.has(m?.secondaryText?.toLowerCase()))
  }, [context.column])

  const insufficientOwners = useMemo(() => {
    if (minimumOwners <= 1) return false
    const owners: any[] = context.column.get('owner') || []
    return owners.length < minimumOwners
  }, [context.column, minimumOwners])

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
        requestExists,
        isSaveDisabled: missingRequiredFields || siteExists || requestExists,
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

    return (
      missingRequiredFields ||
      siteExists ||
      requestExists ||
      duplicateOwnerMembers.length > 0 ||
      insufficientOwners
    )
  }, [
    fieldsToUse,
    context.column,
    siteExists,
    requestExists,
    duplicateOwnerMembers,
    insufficientOwners,
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
      hasErrors: missingFields.length > 0 || siteExists || requestExists,
      missingFields,
      siteExists,
      requestExists,
      totalRequired: requiredFields.length
    }
  }, [fieldsToUse, context.column, siteExists, requestExists, currentTemplate])

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
    isSaving,
    isSaveDisabled,
    missingFieldsInfo,
    siteExists,
    setSiteExists,
    requestExists,
    setRequestExists,
    duplicateOwnerMembers,
    insufficientOwners,
    minimumOwners,
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
    usesDifferentHub,
    hubResolveFailed,
    getField,
    fieldsToUse,
    fluentProviderId
  }
}
