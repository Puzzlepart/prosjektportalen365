import { Logger, LogLevel } from '@pnp/logging'
import { sp } from '@pnp/sp'
import  * as strings from 'ProjectWebPartsStrings'

/**
 * Modify frontpage current phase view
 *
 * @param {string} phaseTermName Phase term name
 * @param {string} currentPhaseViewName Current phase view name
 */
export const modifyCurrentPhaseView = async (phaseTermName: string, currentPhaseViewName: string) => {
    const documentsViews = sp.web.lists.getByTitle(strings.DocumentsListName).views
    const [documentsFrontpageView] = await documentsViews
        .select('Id', 'ViewQuery')
        .filter(`Title eq '${currentPhaseViewName}'`)
        .get<{ Id: string; ViewQuery: string }[]>()
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
        Logger.write(
            `(ProjectPhases) modifyDocumentViews: Successfully updated ViewQuery for view '${currentPhaseViewName}' for list '${strings.DocumentsListName}'`,
            LogLevel.Info
        )
    } catch (err) {
        Logger.write(
            `(ProjectPhases) modifyDocumentViews: Failed to update ViewQuery for view '${currentPhaseViewName}' for list '${strings.DocumentsListName}'`,
            LogLevel.Error
        )
    }
}