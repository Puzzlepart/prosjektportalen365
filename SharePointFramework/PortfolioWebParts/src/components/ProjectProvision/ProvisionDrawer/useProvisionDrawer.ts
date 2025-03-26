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

  const getGlobalSetting = (setting: string) => {
    return context.state.settings.find((t) => t.title === setting)?.value
  }

  const enableSensitivityLabels = getGlobalSetting('EnableSensitivityLabels')
  const enableRetentionLabels = getGlobalSetting('EnableRetentionLabels')
  const enableExpirationDate = getGlobalSetting('EnableExpirationDate')
  const enableReadOnlyGroup = getGlobalSetting('EnableReadOnlyGroup')
  const enableInternalChannel = getGlobalSetting('EnableInternalChannel')

  const typeDefaults = context.state.types.find((t) => t.type === context.state.properties.type)
  const enableExternalSharing = typeDefaults?.externalSharing

  const namingConvention = getGlobalSetting('UseNamingConventions')
    ? context.state.settings.find((t) => t.title === 'NamingConvention')?.value
    : context.state.types.find((t) => t.type === context.column.get('type'))?.namingConvention

  const urlPrefix = `${context.props.webAbsoluteUrl.split('sites')[0]}sites/`
  const aliasSuffix = '@' + context.props.pageContext.user.loginName.split('@')[1]

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

    const requestItem: IProvisionRequestItem = {
      Title: context.column.get('name'),
      SpaceDisplayName: name,
      Description: context.column.get('description'),
      BusinessJustification: context.column.get('justification'),
      SpaceType: context.column.get('typeTitle'),
      SpaceTypeInternal: context.column.get('type'),
      Teamify: context.column.get('teamify'),
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
      RetentionLabelName: context.column.get('retentionLabel'),
      ExpirationDate: context.column.get('expirationDate'),
      ReadOnlyGroup: context.column.get('readOnlyGroup'),
      InternalChannel: context.column.get('internalChannel'),
      RequestedSource: context.column.get('requestedSource'),
      SpaceImage: context.column.get('image'),
      SiteURL: {
        Description: `${baseUrl}${alias}`,
        Url: `${baseUrl}${alias}`
      },
      SiteAlias: context.column.get('alias'),
      MailboxAlias: alias,
      TimeZoneId: 4,
      LCID: 1044,
      JoinHub: true,
      HubSiteTitle: context.props.pageContext.web.title,
      HubSite: context.props.pageContext.legacyPageContext.hubSiteId,
      Prefix: namingConvention?.prefixText,
      Suffix: namingConvention?.suffixText,
      Status: 'Submitted',
      Stage: 'Submitted',
      RequestKey: getGUID()
    }

    return await context.props.dataAdapter.addProvisionRequests(
      requestItem,
      context.props.provisionUrl
    )
  }

  const [siteExists, setSiteExists] = useState(false)

  const isSaveDisabled =
    context.column.get('name')?.length < 2 ||
    context.column.get('description')?.length < 2 ||
    context.column.get('justification')?.length < 2 ||
    context.column.get('owner')?.length < 1 ||
    siteExists

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
    enableRetentionLabels,
    enableExpirationDate,
    enableReadOnlyGroup,
    enableInternalChannel,
    enableExternalSharing,
    urlPrefix,
    aliasSuffix,
    fluentProviderId
  }
}
