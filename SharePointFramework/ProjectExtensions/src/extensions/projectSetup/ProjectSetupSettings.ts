export class ProjectSetupSettings {
    constructor(
        /**
         * Include standard folders
         */
        public includeStandardFolders?: boolean,
        /**
         * Copy planner tasks
         */
        public copyPlannerTasks?: boolean) {
    }

    public useDefault() {
        this.includeStandardFolders = false;
        this.copyPlannerTasks = true;
        return this;
    }

    public set(key: string, bool: boolean) {
        this[key] = bool;
        return this;
    }
}
