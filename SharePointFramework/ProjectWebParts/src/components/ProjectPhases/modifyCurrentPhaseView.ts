import * as strings from 'ProjectWebPartsStrings'
import { IProjectPhasesProps } from './types'

/**
 * Modify frontpage current phase view.
 *
 * @param phaseTermName Phase term name
 * @param props Component props for `ProjectPhases`
 */
export const modifyCurrentPhaseView = async (phaseTermName: string, props: IProjectPhasesProps) => {
  const documentsViews = props.sp.web.lists.getByTitle(strings.DocumentsListName).views
  const [documentsFrontpageView] = await documentsViews
    .select('Id', 'ViewQuery')
    .filter(`Title eq '${props.currentPhaseViewName}'`)<{ Id: string; ViewQuery: string }[]>()
  if (!documentsFrontpageView) return
  const viewQueryDom = new DOMParser().parseFromString(
    `<Query> ${documentsFrontpageView.ViewQuery}</Query> `,
    'text/xml'
  )
  const orderByDomElement = viewQueryDom.getElementsByTagName('OrderBy')[0]
  const orderBy = orderByDomElement ? orderByDomElement.outerHTML : ''
  const newViewQuery = [
    orderBy,
    `<Where><Eq><FieldRef Name='GtProjectPhase' /><Value Type='Text'>${phaseTermName}</Value></Eq></Where>`
  ].join('')
  try {
    await documentsViews.getById(documentsFrontpageView.Id).update({ ViewQuery: newViewQuery })
  } catch (err) {}
}
