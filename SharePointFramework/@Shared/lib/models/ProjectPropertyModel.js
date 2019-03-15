var ProjectPropertyModel = (function () {
    function ProjectPropertyModel(field, value) {
        this.internalName = field.InternalName;
        this.displayName = field.Title;
        this.description = field.Description;
        this.value = value;
        this.type = field.TypeAsString;
        this.required = field.Required;
        this.empty = value === "";
        this.showInDisplayForm = field.SchemaXml.indexOf('ShowInDisplayForm="FALSE"') === -1;
    }
    return ProjectPropertyModel;
}());
export { ProjectPropertyModel };
//# sourceMappingURL=ProjectPropertyModel.js.map