import { Phase, IPhaseChecklistItem } from 'models';

export type ChecklistData = { [termGuid: string]: { stats: { [status: string]: number }, items: IPhaseChecklistItem[] } };

export interface IProjectPhasesData {
    /**
     * @todo describe property
     */
    phases?: Phase[];

    /**
     * @todo describe property
     */
    currentPhase?: Phase;

    /**
     * @todo describe property
     */
    checklistData?: ChecklistData;

    /**
     * @todo describe property
     */
    phaseTextField?: string;
}
