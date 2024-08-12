/* eslint-disable prefer-spread */
import { useContext, useState } from 'react'
import { useMotion } from '@fluentui/react-motion-preview'
import { useMotionStyles } from './motionStyles'
import { ProjectProvisionContext } from '../context'
import { getGUID } from '@pnp/core'
import { IProvisionRequestItem } from 'interfaces/IProvisionRequestItem'
import { useId } from '@fluentui/react-components'

/**
 * Component logic hook for `ProvisionDrawer`. This hook is responsible for
 * fetching data, sorting, filtering and other logic.
 */
export const useProvisionDrawer = () => {
  const context = useContext(ProjectProvisionContext)
  const [level2, setLevel2] = useState(false)
  const motionStyles = useMotionStyles()
  const toolbarBackIconMotion = useMotion<HTMLButtonElement>(level2)
  const toolbarCalendarIconMotion = useMotion<HTMLButtonElement>(!level2)
  const level1Motion = useMotion<HTMLDivElement>(!level2)
  const level2Motion = useMotion<HTMLDivElement>(level2)

  const useNamingConventions = context.state.settings.find(
    (t) => t.title === 'UseNamingConventions'
  )?.value

  const namingConvention = useNamingConventions
    ? context.state.settings.find((t) => t.title === 'NamingConvention')?.value
    : context.state.types.find((t) => t.type === context.column.get('type'))?.namingConvention

  const urlPrefix = `${context.props.webAbsoluteUrl.split('sites')[0]}sites/`
  const aliasSuffix = '@' + context.props.pageContext.user.loginName.split('@')[1]

  const onSave = async (): Promise<boolean> => {
    const baseUrl = `${context.props.webAbsoluteUrl.split('sites')[0]}sites/`

    const requestItem: IProvisionRequestItem = {
      Title: context.column.get('name'),
      SpaceDisplayName: context.column.get('name'),
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
      ConfidentialData: context.column.get('isConfidential'),
      Visibility: context.state.properties.privacy,
      ExternalSharingRequired: context.column.get('externalSharing'),
      Guests: context.column.get('guest')?.join(';'),
      SiteURL: {
        Description: `${baseUrl}${context.column.get('alias')}`,
        Url: `${baseUrl}${context.column.get('alias')}`
      },
      SiteAlias: context.column.get('alias'),
      MailboxAlias: context.column.get('alias'),
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
    context.column.get('justification')?.length < 2 ||
    context.column.get('owner')?.length < 1 ||
    siteExists

  const fluentProviderId = useId('fp-provision-drawer')

  return {
    level2,
    setLevel2,
    motionStyles,
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
  }
}
