import { Phase, IPhaseChecklistItem } from 'models';

export type ChecklistData = { [termGuid: string]: { stats: { [status: string]: number }, items: IPhaseChecklistItem[] } };

export interface IProjectPhasesData {
    /**
     * Phases
     */
    phases?: Phase[];

    /**
     * Current phase
     */
    currentPhase?: Phase;

    /**
     * Check list data
     */
    checklistData?: ChecklistData;

    /**
     * Phase text field name
     */
    phaseTextField?: string;
}
