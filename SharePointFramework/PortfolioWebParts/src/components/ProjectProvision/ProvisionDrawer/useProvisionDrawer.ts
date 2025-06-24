/* eslint-disable prefer-spread */
import { useContext, useState } from 'react'
import { useMotion } from '@fluentui/react-motion-preview'
import { useMotionStyles } from './motionStyles'
import { ProjectProvisionContext } from '../context'
import { getGUID } from '@pnp/core'
import { IProvisionRequestItem } from 'interfaces/IProvisionRequestItem'
import { useId } from '@fluentui/react-components'
import strings from 'PortfolioWebPartsStrings'

/**
 * Component logic hook for `ProvisionDrawer`. This hook is responsible for
 * fetching data, sorting, filtering and other logic.
 */
export const useProvisionDrawer = () => {
  const context = useContext(ProjectProvisionContext)
  const levels = [
    {
      key: 'initial',
      title: strings.Provision.DrawerLevel0HeaderText,
      description: strings.Provision.DrawerLevel0DescriptionText
    },
    {
      key: 'classification',
      title: strings.Provision.DrawerLevel1HeaderText,
      description: strings.Provision.DrawerLevel1DescriptionText
    },
    {
      key: 'metadata',
      title: strings.Provision.DrawerLevel2HeaderText,
      description: strings.Provision.DrawerLevel2DescriptionText
    }
  ]
  const [currentLevel, setCurrentLevel] = useState(0)
  const motionStyles = useMotionStyles()

  const toolbarBackIconMotion = useMotion<HTMLButtonElement>(currentLevel > 0)
  // const toolbarCalendarIconMotion = useMotion<HTMLButtonElement>(currentLevel === 1)
  const levelMotions = Array.from({ length: levels.length }, (_, i) =>
    useMotion<HTMLDivElement>(i === currentLevel)
  )

  const getField = (fieldName: string) => {
    return context.props.fields.find((field) => field.fieldName === fieldName)
  }

  const getGlobalSetting = (setting: string) => {
    return context.state.settings.find((t) => t.title === setting)?.value
  }

  const enableSensitivityLabels = getGlobalSetting('EnableSensitivityLabels')
  const enableSensitivityLabelsLibrary = getGlobalSetting('EnableSensitivityLabelsLibrary')
  const enableRetentionLabels = getGlobalSetting('EnableRetentionLabels')
  const enableExpirationDate = getGlobalSetting('EnableExpirationDate')
  const enableReadOnlyGroup = getGlobalSetting('EnableReadOnlyGroup')
  const enableInternalChannel = getGlobalSetting('EnableInternalChannel')
  const enableAutoApproval = getGlobalSetting('EnableAutoApproval')

  const typeDefaults = context.state.types.find((t) => t.title === context.state.properties.type)
  const enableExternalSharing = typeDefaults?.externalSharing

  const namingConvention = getGlobalSetting('UseNamingConventions')
    ? context.state.settings.find((t) => t.title === 'NamingConvention')?.value
    : context.state.types.find((t) => t.title === context.column.get('type'))?.namingConvention

  const urlPrefix = `${context.props.webAbsoluteUrl.split('sites')[0]}sites/`
  const aliasSuffix = '@' + context.props.pageContext.user.loginName.split('@')[1]

  const joinHub = !!context.state.types.find((t) => t.title === context.column.get('type'))?.joinHub

  const spaceTypeInternal = context.state.types.find(
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

    const sensitivityLabelId = context.state.sensitivityLabels.find(
      (t) => t.labelName === context.column.get('sensitivityLabel')
    )?.labelId

    const sensitivityLabelLibraryId = context.state.sensitivityLabelsLibrary.find(
      (t) => t.labelName === context.column.get('sensitivityLabelLibrary')
    )?.labelId

    const requestItem: IProvisionRequestItem = {
      Title: context.column.get('name'),
      SpaceDisplayName: name,
      Description: context.column.get('description'),
      BusinessJustification: context.column.get('justification'),
      SpaceType: context.column.get('type'),
      SpaceTypeInternal: spaceTypeInternal,
      Teamify: isTeam ? true : isViva ? false : context.column.get('teamify'),
      TeamsTemplate: context.column.get('teamify')
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
      ExpirationDate: context.column.get('expirationDate'),
      ReadOnlyGroup: context.column.get('readOnlyGroup'),
      InternalChannel: context.column.get('internalChannel'),
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

  const isSaveDisabled =
    context.props.fields
      .filter((field) => field.required)
      .some((field) => {
        const value = context.column.get(field.fieldName)
        return !value || (Array.isArray(value) ? value.length === 0 : value.length < 1)
      }) || siteExists

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
    isViva,
    joinHub,
    getField,
    fluentProviderId
  }
}
