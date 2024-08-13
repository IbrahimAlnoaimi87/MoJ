SourceCode.Forms.DependencyHelper =
{
    ReferenceType:
    {
        Action: "Action",
        ActionProperty: "ActionProperty",
        Area: "Area",
        AreaItem: "AreaItem",
        Cell: "Cell",
        Column: "Column",
        Condition: "Condition",
        ConditionalStyle: "ConditionalStyle",
        ConditionProperty: "ConditionProperty",
        Control: "Control",
        ControlEvent: "ControlEvent",
        ControlExpression: "ControlExpression",
        ControlField: "ControlField",
        ControlMethod: "ControlMethod",
        ControlProperty: "ControlProperty",
        ControlType: "ControlType",
        ControlTypeEvent: "ControlTypeEvent",
        ControlTypeMethod: "ControlTypeMethod",
        ControlTypeMethodParameter: "ControlTypeMethodParameter",
        ControlTypeMethodResult: "ControlTypeMethodResult",
        ControlTypeProperty: "ControlTypeProperty",
        EnvironmentField: "EnvironmentField",
        Event: "Event",
        EventProperty: "EventProperty",
        ExecutionBlock: "ExecutionBlock",
        ExecutionGroup: "ExecutionGroup",
        Expression: "Expression",
        Filter: "Filter",
        Form: "Form",
        FormEvent: "FormEvent",
        FormParameter: "FormParameter",
        Function: "Function",
        Handler: "Handler",
        HandlerFunction: "HandlerFunction",
        HandlerProperty: "HandlerProperty",
        Layout: "Layout",
        LayoutItem: "LayoutItem",
        MappingProperty: "MappingProperty",
        Object: "Object",
        ObjectDefinitionAssociation: "ObjectDefinitionAssociation",
        ObjectDefinitionAssociationProperty: "ObjectDefinitionAssociationProperty",
        ObjectMethod: "ObjectMethod",
        ObjectMethodInput: "ObjectMethodInput",
        ObjectMethodParameter: "ObjectMethodParameter",
        ObjectMethodReturn: "ObjectMethodReturn",
        ObjectProperty: "ObjectProperty",
        Panel: "Panel",
        ParameterMapping: "ParameterMapping",
        ReportParameter: "ReportParameter",
        Result: "Result",
        ResultMapping: "ResultMapping",
        Row: "Row",
        ServiceInstance: "ServiceInstance",
        ServiceObject: "ServiceObject",
        ServiceObjectMethod: "ServiceObjectMethod",
        ServiceObjectMethodParameter: "ServiceObjectMethodParameter",
        ServiceObjectProperty: "ServiceObjectProperty",
        ServiceObjectPropertyMapping: "ServiceObjectPropertyMapping",
        SmartMethodDefinition: "SmartMethodDefinition",
        SmartMethodParameterDefinition: "SmartMethodParameterDefinition",
        SmartObjectDefinition: "SmartObjectDefinition",
        SmartPropertyDefinition: "SmartPropertyDefinition",
        Source: "Source",
        SourceField: "SourceField",
        SourceValue: "SourceValue",
        State: "State",
        StateProperty: "StateProperty",
        StyleProfile: "StyleProfile",
        SubForm: "SubForm",
        SubFormPopupAction: "SubFormPopupAction",
        SystemVariable: "SystemVariable",
        Table: "Table",
        Theme: "Theme",
        ValidationGroup: "ValidationGroup",
        ValidationGroupControl: "ValidationGroupControl",
        ValidationPattern: "ValidationPattern",
        Value: "Value",
        View: "View",
        ViewEvent: "ViewEvent",
        ViewField: "ViewField",
        ViewInstance: "ViewInstance",
        ViewMethod: "ViewMethod",
        ViewParameter: "ViewParameter",
        ViewSelection: "ViewSelection",
        WorkflowActivityDataField: "WorkflowActivityDataField",
        WorkflowActivityProperty: "WorkflowActivityProperty",
        WorkflowActivityXmlField: "WorkflowActivityXmlField",
        WorkflowEventProperty: "WorkflowEventProperty",
        WorkflowProcess: "WorkflowProcess",
        WorkflowProcessDataField: "WorkflowProcessDataField",
        WorkflowProcessProperty: "WorkflowProcessProperty",
        WorkflowProcessXmlField: "WorkflowProcessXmlField",
        Unknown: "Unknown"
    },

    ReferenceStatus:
    {
        // The reference was automatically fixed/remapped.
        Auto: "Auto",
        // The referenced item was found but was changed.
        Changed: "Changed",
        // The referenced item contains an error.
        Error: "Error",
        // The referenced item could not be found.
        Missing: "Missing",
        // The item was created because a new reference item was found that should be handled.
        New: "New",
        None: "None",
        // The referenced item was found.
        Resolved: "Resolved"
    },

    ReferenceAs:
    {
        ActionControl: "ActionControl",
        ActionControlViewInstance: "ActionControlViewInstance",
        ActionObject: "ActionObject",
        ActionMethod: "ActionMethod",
        ActionMethodViewInstance: "ActionMethodViewInstance",
        ActionRule: "ActionRule",
        ActionRuleSubForm: "ActionRuleSubForm",
        ActionValidationGroup: "ActionValidationGroup",
        ActionView: "ActionView",
        ActionViewViewInstance: "ActionViewViewInstance",
        ActionPropertyControl: "ActionPropertyControl",
        AreaItemView: "AreaItemView",
        AreaItemViewInstance: "AreaItemViewInstance",
        ControlControlType: "ControlControlType",
        ControlExpression: "ControlExpression",
        ControlField: "ControlField",
        ControlPropertyExpression: "ControlPropertyExpression",
        ControlPropertyField: "ControlPropertyField",
        EventSource: "EventSource",
        FieldProperty: "FieldProperty",
        FilterValueMapping: "FilterValueMapping",
        FlowItemControl: "FlowItemControl",
        FormTheme: "FormTheme",
        GridCellControl: "GridCellControl",
        GridColumnControl: "GridColumnControl",
        GridRowControl: "GridRowControl",
        MappingSource: "MappingSource",
        MappingSourceControl: "MappingSourceControl",
        MappingTarget: "MappingTarget",
        MappingTargetControl: "MappingTargetControl",
        ParameterMappingSource: "ParameterMappingSource",
        ParameterMappingSourceSubForm: "ParameterMappingSourceSubForm",
        ParameterMappingTarget: "ParameterMappingTarget",
        ParameterMappingTargetSubForm: "ParameterMappingTargetSubForm",
        PropertyAssociationObject: "PropertyAssociationObject",
        PropertyControl: "PropertyControl",
        PropertyControlTypeProperty: "PropertyControlTypeProperty",
        PropertyExpressionSource: "PropertyExpressionSource",
        PropertyExpressionSourceSubForm: "PropertyExpressionSourceSubForm",
        PropertyForm: "PropertyForm",
        PropertyParentControl: "PropertyParentControl",
        PropertyParentJoinProperty: "PropertyParentJoinProperty",
        PropertyValueProperty: "PropertyValueProperty",
        PropertyView: "PropertyView",
        ResultMappingSource: "ResultMappingSource",
        ResultMappingSourceSubForm: "ResultMappingSourceSubForm",
        ResultMappingTarget: "ResultMappingTarget",
        ResultMappingTargetSubForm: "ResultMappingTargetSubForm",
        SourceContext: "SourceContext",
        SourceMapping: "SourceMapping",
        SourceObject: "SourceObject",
        SorterSource: "SorterSource",
        ValidationGroupControlControl: "ValidationGroupControlControl",
        ValidationPattern: "ValidationPattern"
    },

    AnnotationAction:
    {
        Add: 0,
        Update: 1,
        Delete: 2
    },

    expressionParentExcludeList: ["Expression", "Condition", "Action", "ConditionalStyle", "Handler", "Parameter", "Filter", "Function", "SubFormPopupAction"],

    badgeClasses: {
        error: "error",
        warning: "warning"
    },

    IsDependencyAnalyzerEnabled: function ()
    {
        return true;
    },

    getAssociationSmoId: function (controlNodeXml)
    {
        if (!checkExistsNotEmpty(controlNodeXml))
        {
            return "";
        }

        var xmlDoc = parseXML(controlNodeXml);

        if (!checkExists(xmlDoc))
        {
            return "";
        }

        var propertyNode = xmlDoc.selectSingleNode('.//Control/Properties/Property[Name="AssociationSO"]');

        if (!checkExists(propertyNode))
        {
            return "";
        }

        var valueNode = propertyNode.selectSingleNode('Value');

        if (!checkExists(valueNode))
        {
            return "";
        }

        return valueNode.text;
    },

    getSourceFieldNodes: function (sourceNode, filter)
    {
        var xpath = "";
        var fieldNodes = [];

        if (!checkExists(sourceNode))
        {
            return [];
        }

        //By default only return all valid source fields
        xpath = "Fields/Field[not(contains(@ValidationStatus,'Error') or contains(@ValidationStatus,'Warning') or contains(@ValidationStatus,'Missing'))]";

        if (checkExists(filter) && filter.includeInvalid === true)
        {
            xpath = "Fields/Field";
        }

        fieldNodes = sourceNode.selectNodes(xpath);

        return fieldNodes;
    },

    getPrimarySourceFieldNodes: function (xmlDefinition, filter)
    {
        var node = null;
        var xpath = "";
        var fieldNodes = [];

        if (!checkExists(xmlDefinition))
        {
            return [];
        }

        xpath = ".//Sources/Source[@ContextType='Primary']";

        node = xmlDefinition.selectSingleNode(xpath);

        if (!checkExists(node))
        {
            return [];
        }

        fieldNodes = this.getSourceFieldNodes(node, filter);

        return fieldNodes;
    },

    getFieldNameForControl: function (xmlDefinition, controlId, fieldId, getDisplayName)
    {
        if (!checkExists(xmlDefinition))
        {
            return "";
        }

        var name = "";

        var xmlDoc = xmlDefinition;

        var xpath = ".//Source/Fields/Field[@ID='{0}']/Name".format(fieldId);

        if (getDisplayName === true)
        {
            xpath = ".//Source/Fields/Field[@ID='{0}']/FieldDisplayName".format(fieldId);
        }

        var fieldNameNode = xmlDoc.selectSingleNode(xpath);

        if (checkExists(fieldNameNode))
        {
            name = fieldNameNode.text;
        }
        else
        {
            //Get the field name from the validation messages
            xpath = ".//Controls/Control[@ID='{0}']".format(controlId);

            var controlNode = xmlDoc.selectSingleNode(xpath);

            if (checkExists(controlNode) && checkExistsNotEmpty(controlNode.getAttribute("ValidationMessages")))
            {
                var resourceSvc = SourceCode.Forms.Services.AnalyzerResourcesService();

                var messages = resourceSvc.parseValidationMessage(controlNode.getAttribute("ValidationMessages"));

                for (var i = 0; i < messages.length; i++)
                {
                    if (messages[i].guid === fieldId)
                    {
                        name = messages[i].name;

                        if (getDisplayName === true)
                        {
                            name = messages[i].displayName;
                        }

                        break;
                    }
                }
            }
        }

        return name;
    },

    // appends badge error message to a control element 
    // options:
    // controlElem : jQuery element of the control to append the error message
    // message - error message to append to the element
    appendBadgeMessage: function (options)
    {
        if (checkExists(options.controlElem) && checkExistsNotEmpty(options.message))
        {
            var title = options.controlElem.attr('title');

            if (checkExistsNotEmpty(title))
            {
                if (title.indexOf(options.message) >= 0)
                {
                    //duplicate message already exist, just return and not add the message
                    return;
                }

                title += '\n';
            }
            else
            {
                title = "";
            }

            title += options.message;

            options.controlElem.attr('title', title);
        }
    },

    // applies an error/warning badge to a control on the canvas
    // options:
    // id - the id of the control. This is usually a guid. Required.
    // badgeType - the type of badge. Look at the _badgeType object's properties at the top of the file for valid values. Required
    applyControlBadge: function (options)
    {
        SourceCode.Forms.Designers.Common.getControlALMBadgeManagerInstance().addBadgeToControl(options);
    },

    applyExpressionToolbarButtonBadges: function (options)
    {
        var badgeClass = this.badgeClasses[options.badgeType];

        if (!badgeClass)
        {
            throw "Badge class not found for specified badge type";
        }

        var controls = this._getExpressionToolbarButtonToBadge();

        controls.addClass(badgeClass);
    },

    // applies an error/warning badge to a rule
    // options:
    // id - the id of the rule. This is usually a guid. Required.
    // badgeType - the type of badge. Look at the _badgeType object's properties at the top of the file for valid values. Required
    applyRuleBadge: function (options)
    {
        var eventId = options.id;
        var badgeClass = this.badgeClasses[options.badgeType];

        if (!badgeClass)
        {
            throw "Badge class not found for '" + options.badgeType + "' badge type";
        }

        var eventItem = $("#" + eventId + ".radiobox-button");
        var eventIcon = eventItem.find(".radiobox-button-icon");
        var eventSection = eventItem.parents('div[class^="categorySectionsList"]');

        eventIcon.addClass(badgeClass);
        eventSection.addClass(badgeClass);

        options.controlElem = eventIcon;

        this.appendBadgeMessage(options);

    },

    // applies an error/warning badge to a state
    // options:
    // id - the id of the state. This is usually a guid. Required.
    // badgeType - the type of badge. Look at the _badgeType object's properties at the top of the file for valid values. Required
    applyStateBadge: function (options)
    {
        var stateId = options.id;
        var badgeClass = this.badgeClasses[options.badgeType];

        if (!badgeClass)
        {
            throw "Badge class not found for '" + options.badgeType + "' badge type";
        }
        var stateGrid = $("#pgStateGrid");
        var state = stateGrid.find("td:contains('" + stateId + "')~td>div");

        if (state.length > 0)
        {
            state.addClass(badgeClass);
            options.controlElem = state;

            this.appendBadgeMessage(options);
        }
    },

    removeExpressionToolbarButtonBadges: function (options)
    {
        var badgeClass = this.badgeClasses[options.badgeType];

        if (!badgeClass)
        {
            throw "Badge class not found for specified badge type";
        }

        var controls = this._getExpressionToolbarButtonToBadge();

        controls.removeClass(badgeClass);
    },

    // Removes an error/warning badge from a control on the canvas
    // options:
    // id - the id of the control. This is usually a guid. Required.
    // badgeType - the type of badge to be removed. Other types will be ignored. Look at the _badgeType object's properties at the top of the file for valid values.
    //             Optional. If it isn't specified, all badge types are removed
    removeControlBadge: function (options)
    {
        //SourceCode.Forms.Designers.Common.triggerEvent("RemoveBadgeToControl", options);
        SourceCode.Forms.Designers.Common.getControlALMBadgeManagerInstance().removeBadgeFromControl(options);
    },

    // aplies an error/warning badge to a property in the property grid
    // options:
    // id - the id of the property. This is a string value. Required.
    // badgeType - the type of badge. Look at the _badgeType object's properties at the top of the file for valid values. Required
    applyPropertyBadge: function (options)
    {
        var propertyId = options.id;
        var badgeClass = this.badgeClasses[options.badgeType];

        if (!badgeClass)
        {
            throw "Badge class not found for specified badge type";
        }

        var propertyElement = this._getPropertyToBadge(propertyId);

        propertyElement.addClass(badgeClass);
    },

    // Adds an error/warning badge to an array of properties in the property grid
    // options:
    // properties - An array containing property objects. Each object should contain the id of the control. This is a string values. Required.
    // badgeType - the type of badge. Look at the _badgeType object's properties at the top of the file for valid values. Required
    applyPropertiesBadges: function (options)
    {
        if (!options.properties || !Array.isArray(options.properties))
        {
            throw "Array of properties expected";
        }

        var properties = options.properties;

        for (var i = 0; i < properties.length; i++)
        {
            if (!checkExists(properties[i].id))
            {
                throw "Property object without id found.";
            }

            this.applyPropertyBadge({
                id: properties[i].id,
                badgeType: options.badgeType
            });
        }
    },

    // Removes an error/warning badge from a property in the property grid
    // options:
    // id - the id of the property. This is a string. Required.
    // badgeType - the type of badge. Look at the _badgeType object's properties at the top of the file for valid values. Optional.
    //				If it isn't specified, all badge types are removed
    removePropertyBadge: function (options)
    {
        var propertyId = options.id;
        var property = this._getPropertyToBadge(propertyId);

        var badgeClass = this.badgeClasses[options.badgeType];

        if (!badgeClass)
        {
            eachPropertyInObjects({
                obj: this.badgeClasses,
                callback: function (callbackBadgeType, callbackBadgeClass)
                {
                    property.removeClass(callbackBadgeClass);
                }
            });
        }
        else
        {
            property.removeClass(badgeClass);
        }
    },

    // Removes an error/warning badge from an array of properties in the property grid
    // options:
    // properties - An array containing property objects. Each object should contain the id of the property. This is a string value. Required.
    // badgeType - the type of badge. Look at the _badgeType object's properties at the top of the file for valid values. Optional.
    //				If it isn't specified, all badge types are removed
    removePropertiesBadges: function (options)
    {
        if (!options.properties || !Array.isArray(options.properties))
        {
            throw "Array of properties expected";
        }

        var properties = options.properties;

        for (var i = 0; i < properties.length; i++)
        {
            if (!checkExists(properties[i].id))
            {
                throw "Property object without id found.";
            }

            this.removePropertyBadge({
                id: properties[i].id,
                badgeType: options.badgeType
            });
        }
    },

    _getExpressionToolbarButtonToBadge: function ()
    {
        // View Level
        return $("#toolExpressions, #toolControlCalculation, #pgExpressions");
    },

    _getPropertyToBadge: function (propertyId)
    {
        // there should only be one class with that property id
        return $(".{0}-property".format(propertyId));
    },

    updateAnnotations: function (xmlDefinition, references, annotationAction)
    {
        if (!checkExists(references) || references.length === 0)
        {
            return;
        }

        var action = this.AnnotationAction.Update;

        if (checkExists(annotationAction))
        {
            action = annotationAction;
        }

        var j = 0;
        var i = 0;
        for (j = 0; j <= references.length; j++)
        {
            var referenceObj = $.extend({}, references[j]);

            if (!checkExists(referenceObj) || !checkExists(referenceObj.items) || referenceObj.items.length === 0)
            {
                continue;
            }

            var refItem = null;
            for (i = 0; i < referenceObj.items.length; i++)
            {
                refItem = referenceObj.items[i];

                var annotationContextObj =
                {
                    xmlDefinition: xmlDefinition,
                    referenceObj: referenceObj,
                    referenceAs: refItem.referenceAs,
                    referenceItem: refItem.item,
                    annotationAction: action
                };

                if (this.isExtendedViewRule(annotationContextObj) && action !== this.AnnotationAction.Delete)
                {
                    this._alterEventSourceToEventless(referenceObj, refItem, xmlDefinition);
                }
                else
                {
                    this.annotateItem(annotationContextObj);
                    this.level2AnnotationForExpression(annotationContextObj);
                }
            }
        }

        return;
    },

    /**
    * @typedef annotationContextObj
    * @property {xmlDocument} xmlDefinition - Form or view definition
    * @property {object} referenceItem - The object containing references to object being removed
    * @property {int} annotationAction - indicating whether to update or delete annotation
    */

    /**
    * Will get references for the expression object which was annotated previously, to also annotate on its dependencies
    * e.g. expression being used by other expressions, rule mappings, controls, conditional styles
    *
    * @function level2AnnotationForExpression
    *
    * @param {annotationContextObj} annotationContextObj - Object containing information needed to perform annotation
    */
    level2AnnotationForExpression: function (annotationContextObj)
    {
        if (!checkExists(annotationContextObj))
        {
            return;
        }

        var item = annotationContextObj.referenceItem;
        var annotationAction = annotationContextObj.annotationAction;
        var xmlDefinition = annotationContextObj.xmlDefinition;

        if (!checkExists(item))
        {
            return;
        }

        if (item.type !== this.ReferenceType.Expression &&
        item.type !== this.ReferenceType.ControlExpression)
        {
            return;
        }


        //If this is an expression item used by an expression 
        //Set the item to the parent expression
        var parentItem = item.parent;
        while (checkExists(parentItem))
        {
            if (parentItem.type === this.ReferenceType.Expression ||
            parentItem.type === this.ReferenceType.ControlExpression)
            {
                if (checkExistsNotEmpty(parentItem.id))
                {
                    item = parentItem;
                    break;
                }
            }

            parentItem = parentItem.parent;
        }

        // Build a reference object for this reference items
        var refObj = {
            id: item.id,
            type: item.type,
            name: item.name,
            displayName: item.displayName
        };

        // Now let populate all the reference items for this reference object
        refObj = this.findReferences(xmlDefinition, refObj);

        if (!checkExists(refObj) || !checkExists(refObj.items) || refObj.items.length === 0)
        {
            return;
        }

        var j = 0;
        for (j = 0; j < refObj.items.length; j++)
        {
            var refItem = refObj.items[j];

            if (refItem.item.type === this.ReferenceType.ParameterMapping)
            {
                refObj.status = "Error";
            }
            else
            {
                refObj.status = "Warning";
            }

            //Only specific referene type qualifies as 2nd level reference items
            if (refItem.item.type === this.ReferenceType.ControlProperty ||
            refItem.item.type === this.ReferenceType.Expression ||
            refItem.item.type === this.ReferenceType.ControlExpression ||
            refItem.item.type === this.ReferenceType.ParameterMapping)
            {
                var annotationContextObj =
                {
                    xmlDefinition: xmlDefinition,
                    referenceObj: refObj,
                    referenceAs: refItem.referenceAs,
                    referenceItem: refItem.item,
                    annotationAction: annotationAction
                };
                this.annotateItem(annotationContextObj);
            }
        }
    },

    /**
    * @typedef annotationContextObj
    * @property {xmlDocument} xmlDefinition - Form or view definition
    * @property {object} referenceItem - The object containing references to object being checked for dependencies
    * @property {object} referenceObj - The original reference object being checked for dependencies
    * @property {object} referenceAs - The type of which the dependency object was referencing
    * @property {int} annotationAction - indicating whether to update or delete annotation
    */

    /**
    * Will return true if object should be excluded from annotation
    *
    * @function isAnnotationExclusion
    *
    * @param {annotationContextObj} annotationContextObj - Object containing information needed to perform annotation
    */
    isAnnotationExclusion: function (annotationContextObj)
    {
        var exclude = false;
        var referenceObj = annotationContextObj.referenceObj;
        var referenceAs = annotationContextObj.referenceAs;
        var item = annotationContextObj.referenceItem;

        if (!checkExists(referenceObj))
        {
            return true;
        }

        if (checkExists(item.xmlNode) && !checkExists(item.xmlNode.parentNode))
        {
            return true;
        }

        if (checkExists(item.copiedXmlNode) && !checkExists(item.copiedXmlNode.parentNode))
        {
            return true;
        }

        if (referenceObj.type === this.ReferenceType.Source)
        {
            switch (referenceAs)
            {
                case this.ReferenceAs.ActionControl:
                case this.ReferenceAs.ResultMappingTarget:
                case this.ReferenceAs.ResultMappingSource:
                    //For mapping that are pointing to a deleted smart object Source, we need to ignore the annotation on these items.
                    //This is because even the user selected to keep dependencies, there will be nothing to fix.  The server-side will also not annotate on these items.
                    //To replicate the scenario, create a smo and bind to a control as associated data source.  Remove the binding to by pressing the back space 
                    //in the property grid, the dependency notifier will pick items are using the smo source to be removed. 
                    //Select to keep dependencies in the notifier, should not annotate on these items. 
                    exclude = true;
                    break;
            }
        }

        return exclude;
    },

    /**
    * @typedef annotationContextObj
    * @property {xmlDocument} xmlDefinition - Form or view definition
    * @property {object} referenceItem - The object containing references to object being checked for dependencies
    * @property {object} referenceObj - The original reference object being checked for dependencies
    * @property {object} referenceAs - The type of which the dependency object was referencing
    * @property {int} annotationAction - indicating whether to update or delete annotation
    */

    /**
    * Performs annotation on a specific referenceItem and will also annotate its parent/s if needed
    *
    * @function annotateItem
    *
    * @param {annotationContextObj} annotationContextObj - Object containing information needed to perform annotation
    */
    annotateItem: function (annotationContextObj)
    {
        if (this.isAnnotationExclusion(annotationContextObj))
        {
            return;
        }

        if (!checkExists(annotationContextObj.referenceItem))
        {
            return;
        }

        var item = annotationContextObj.referenceItem;
        var referenceAs = annotationContextObj.referenceAs;
        var referenceObj = annotationContextObj.referenceObj;
        var annotationAction = annotationContextObj.annotationAction;

        var annotationOptions = {};

        if (!checkExists(item) || !checkExists(referenceAs) || !checkExists(referenceObj))
        {
            return;
        }

        if (!checkExistsNotEmpty(referenceObj.status))
        {
            referenceObj.status = "Missing";
        }

        if (checkExists(this._getParentFromItem(item, this.ReferenceType.Filter)))
        {
            //Filter property is a special case where the xml is stored in a xml node as text
            //Thus we need to annotate it differently
            this.annotateFilterPropertyItem(annotationContextObj);
            return;
        }

        if (checkExists(this._getParentFromItem(item, this.ReferenceType.SubFormPopupAction)))
        {
            //Special case where the xml is stored in a xml node as text
            //Thus we need to parse text to xml and annotate
            this.annotateSubFormPopupActionItem(annotationContextObj);
            return;
        }

        if (this.isViewInstanceActionItem(referenceObj, referenceAs))
        {
            this.annotateViewInstanceActionItem(annotationContextObj);
            return;
        }

        if (checkExists(item.xmlNode) && checkExists(this._getParentFromItem(item, this.ReferenceType.ParameterMapping)) && item.xmlNode.nodeName === "Source")
        {
            this.annotateSourceValueMappingAndParents(annotationContextObj);
            return;
        }

        if ([this.ReferenceAs.ParameterMappingSource, this.ReferenceAs.ParameterMappingTarget].indexOf(referenceAs) > -1
        && item.type === this.ReferenceType.ParameterMapping)
        {
            this.annotateParameterMappingAndParents(annotationContextObj);
            return;
        }

        if (checkExists(item.xmlNode))
        {
            var resourceSvc = SourceCode.Forms.Services.AnalyzerResourcesService();

            var msg = resourceSvc.generateValidationMessage(referenceObj, referenceAs);

            var refObj = null;
            var refAs = referenceAs;

            if (item.xmlNode.nodeName === "Item")
            {
                var sourceId = item.xmlNode.getAttribute("SourceID");
                var sourceName = referenceObj.name;
                if (!checkExistsNotEmpty(sourceName))
                {
                    sourceName = item.xmlNode.getAttribute("SourceName");
                }
                var sourceType = item.xmlNode.getAttribute("SourceType");
                var sourceDisplayName = referenceObj.displayName;
                if (!checkExistsNotEmpty(sourceDisplayName))
                {
                    //Get correct display name from item node
                    sourceDisplayName = SourceCode.Forms.Designers.Common.getItemDisplayName(item.xmlNode);
                }

                refObj =
                {
                    id: referenceObj.id,
                    name: sourceName,
                    displayName: sourceDisplayName,
                    status: referenceObj.status,
                    type: referenceObj.type
                };

                if (sourceType === this.ReferenceType.ControlProperty)
                {
                    //If the Item node has ControlProperty as source type, it should use the Source info for the annotation
                    refObj.id = item.xmlNode.getAttribute("SourcePath");
                    refObj.name = sourceId;
                    refObj.type = this.ReferenceType.ControlProperty;
                }
                else if (sourceType === this.ReferenceType.ViewField)
                {
                    var strArray = [];
                    var smoId = "";
                    var smoPropertyName = sourceName;

                    if (checkExistsNotEmpty(sourceName))
                    {
                        strArray = sourceName.split('_');

                        if (strArray.length === 2)
                        {
                            smoId = strArray[0];
                            smoPropertyName = strArray[1];
                        }
                    }

                    refObj.id = sourceId;
                    refObj.name = smoPropertyName;
                    refObj.type = this.ReferenceType.SourceField;
                }

                if (referenceObj.status === "Required")
                {
                    msg = "ValidationError,SourceID,Required";
                    referenceObj.status = "Error";
                }
                else
                {
                    msg = resourceSvc.generateValidationMessage(refObj, refAs);
                }
            }
            else if (referenceAs === this.ReferenceAs.ControlField && referenceObj.type === this.ReferenceType.ViewField)
            {
                refObj =
                {
                    id: referenceObj.id,
                    name: referenceObj.name,
                    displayName: referenceObj.displayName,
                    status: referenceObj.status,
                    type: this.ReferenceType.SourceField
                };

                if (item.xmlNode.nodeName === "Property")
                {
                    refAs = this.ReferenceAs.ControlPropertyField;

                }
                else if (item.xmlNode.nodeName === "Control")
                {
                    refAs = this.ReferenceAs.ControlField;
                }

                msg = resourceSvc.generateValidationMessage(refObj, refAs);
            }
            else if (referenceObj.type === this.ReferenceType.ControlExpression && ["Expression", "Condition"].indexOf(item.xmlNode.nodeName) > -1)
            {
                refObj =
                {
                    status: referenceObj.status,
                    type: this.ReferenceType.Expression
                };

                msg = resourceSvc.generateValidationMessage(refObj, refAs);
            }

            annotationOptions =
            {
                nodeToAnnotate: item.xmlNode,
                annotationStatus: referenceObj.status,
                annotationMessage: msg,
                annotationAction: annotationAction
            };
            this.updateValidationMessageToXmlNode(annotationOptions);

            this.annotatePanel(annotationContextObj);
        }

        if (checkExists(this._getParentFromItem(item, this.ReferenceType.ConditionalStyle)))
        {
            this.annotateControlWithConditionalStyleError(annotationContextObj);
        }
        else if (checkExists(this._getParentFromItem(item, this.ReferenceType.Condition)))
        {
            if (checkExists(this._getParentFromItem(item, this.ReferenceType.ConditionProperty)))
            {
                this.annotateConditionPropertyWithMappingError(annotationContextObj);
            }
            else
            {
                this.annotateConditionWithMappingError(annotationContextObj);
            }
        }
        else if (checkExists(item.parent))
        {
            //Create a new copy of referenceObj for the parent node. This is because the status may change
            //when annotating on the parent node.
            var annotationContextObjForParent = $.extend(true, {}, annotationContextObj);
            annotationContextObjForParent.referenceItem = item.parent;

            //Annotate on the parent node if they exists
            if (["Missing", "Warning"].indexOf(annotationContextObjForParent.referenceObj.status) > -1 &&
            item.type !== this.ReferenceType.ControlProperty)
            {
                //If child is annotated as Missing or Warning, parents should be annotated as Error
                //Except for control properties where the parent control should have the same status as the control's property
                annotationContextObjForParent.referenceObj.status = "Error";
            }

            switch (item.parent.type)
            {
                case this.ReferenceType.Action:
                case this.ReferenceType.Condition:
                case this.ReferenceType.Event:
                case this.ReferenceType.Expression:
                case this.ReferenceType.ControlExpression:
                case this.ReferenceType.Handler:
                case this.ReferenceType.Parameter:
                case this.ReferenceType.ParameterMapping:
                case this.ReferenceType.State:
                    this.annotateItem(annotationContextObjForParent);
                    break;
                case this.ReferenceType.Control:

                    var newRefAs = referenceAs;

                    if (referenceAs === this.ReferenceAs.ControlPropertyExpression)
                    {
                        newRefAs = this.ReferenceType.ControlExpression;
                    }
                    annotationContextObjForParent.referenceAs = newRefAs;

                    this.annotateItem(annotationContextObjForParent);

                    break;
                case this.ReferenceType.ValidationGroup:
                    this.annotateRuleWithValidationGroupError(annotationContextObj);
                    break;
                case this.ReferenceType.HandlerFunction:
                    annotationOptions =
                    {
                        nodeToAnnotate: item.xmlNode,
                        annotationStatus: annotationContextObjForParent.referenceObj.status,
                        annotationMessage: msg,
                        annotationAction: annotationContextObjForParent.annotationAction
                    };
                    this.annotateFunctionAndParents(annotationOptions);
                    break;
                default:
                    break;
            }
        }
    },

    /**
    * @typedef annotationContextObj
    * @property {xmlDocument} xmlDefinition - Form or view definition
    * @property {object} referenceItem - The object containing references to object being checked for dependencies
    * @property {object} referenceObj - The original reference object being checked for dependencies
    * @property {object} referenceAs - The type of which the dependency object was referencing
    * @property {int} annotationAction - indicating whether to update or delete annotation
    */

    /**
    * Performs annotationon Conditional Style that is matching Server-Side annotation
    *
    * @function annotateControlWithConditionalStyleError
    *
    * @param {annotationContextObj} annotationContextObj - Object containing information needed to perform annotation
    */
    annotateControlWithConditionalStyleError: function (annotationContextObj)
    {
        var errorItem = annotationContextObj.referenceItem;
        var annotationAction = annotationContextObj.annotationAction;

        if (!checkExists(annotationContextObj) || !checkExists(errorItem))
        {
            return;
        }

        var conditionalStyleItem = this._getParentFromItem(errorItem, this.ReferenceType.ConditionalStyle);

        if (!checkExists(conditionalStyleItem) ||
        !checkExists(conditionalStyleItem.xmlNode) ||
        conditionalStyleItem.xmlNode.nodeName !== this.ReferenceType.ConditionalStyle)
        {
            return;
        }

        var styleNode = conditionalStyleItem.xmlNode;

        var annotationOptions =
        {
            nodeToAnnotate: styleNode,
            annotationStatus: "Error",
            annotationMessage: "Expression,Expression,Error,,,",
            annotationAction: annotationAction
        };
        this.updateValidationMessageToXmlNode(annotationOptions);

        var controlItem = this._getParentFromItem(errorItem, this.ReferenceType.Control);

        if (!checkExists(controlItem) ||
        !checkExists(controlItem.xmlNode) ||
        controlItem.xmlNode.nodeName !== this.ReferenceType.Control)
        {
            return;
        }

        var controlNode = controlItem.xmlNode;

        var styleId = styleNode.getAttribute("ID");

        var styleNameNode = styleNode.selectSingleNode("Name");
        var styleName = "";

        if (checkExists(styleNameNode))
        {
            styleName = styleNameNode.text;
        }

        var msg = "ConditionalStyle,ConditionalStyle,Error,{0},{1},,".format(styleId, styleName);
        annotationOptions =
        {
            nodeToAnnotate: controlNode,
            annotationStatus: "Error",
            annotationMessage: msg,
            annotationAction: annotationAction
        };
        this.updateValidationMessageToXmlNode(annotationOptions);

        var contextObj =
        {
            xmlDefinition: annotationContextObj.xmlDefinition,
            referenceItem: controlItem,
            annotationAction: this.AnnotationAction.Update
        };

        this.annotatePanel(contextObj);
    },

    /**
    * @typedef annotationContextObj
    * @property {xmlDocument} xmlDefinition - Form or view definition
    * @property {object} referenceItem - The object containing references to object being checked for dependencies
    * @property {object} referenceObj - The original reference object being checked for dependencies
    * @property {object} referenceAs - The type of which the dependency object was referencing
    * @property {int} annotationAction - indicating whether to update or delete annotation 
    */

    /**
    * Will annotate the condition parent node of the mapping in error, as well as its parent handler and event nodes.
    *
    * @function annotateConditionWithMappingError
    *
    * @param {annotationContextObj} annotationContextObj - Object containing information needed to perform annotation
    */
    annotateConditionWithMappingError: function (annotationContextObj)
    {
        var errorItem = annotationContextObj.referenceItem;
        var annotationAction = annotationContextObj.annotationAction;

        if (!checkExists(annotationContextObj) || !checkExists(errorItem))
        {
            return;
        }

        var conditionItem = this._getParentFromItem(errorItem, this.ReferenceType.Condition);

        if (!checkExists(conditionItem) ||
        !checkExists(conditionItem.xmlNode) ||
        conditionItem.xmlNode.nodeName !== this.ReferenceType.Condition)
        {
            return;
        }

        var conditionNode = conditionItem.xmlNode;
        var annotationOptions =
        {
            nodeToAnnotate: conditionNode,
            annotationStatus: "Error",
            annotationMessage: "Expression,Expression,Error,,,",
            annotationAction: annotationAction
        };
        this.updateValidationMessageToXmlNode(annotationOptions);
        this.annotateHandlerAndParents(annotationOptions);
    },


    /**
    * Will annotate the condition property parent node of the mapping in error, as well as its parent condition, ancestor handler and event nodes.
    *
    * @function annotateConditionPropertyWithMappingError
    *
    * @param {annotationContextObj} annotationContextObj - Object containing information needed to perform annotation
    *
    * @typedef annotationContextObj
    * @property {xmlDocument} xmlDefinition - Form or view definition
    * @property {object} referenceItem - The object containing references to object being checked for dependencies
    * @property {object} referenceObj - The original reference object being checked for dependencies
    * @property {object} referenceAs - The type of which the dependency object was referencing
    * @property {int} annotationAction - indicating whether to update or delete annotation
    */
    annotateConditionPropertyWithMappingError: function (annotationContextObj)
    {
        if (!checkExists(annotationContextObj))
        {
            return;
        }

        var item = annotationContextObj.referenceItem;
        var referenceObj = annotationContextObj.referenceObj;
        var referenceAs = annotationContextObj.referenceAs;
        var annotationAction = annotationContextObj.annotationAction;

        if (!checkExists(item) || !checkExists(referenceObj) || !checkExists(referenceAs))
        {
            return;
        }

        if (!checkExists(item.copiedXmlNode) ||
        item.copiedXmlNode.nodeName !== "Source")
        {
            return;
        }

        var propertyItem = this._getParentFromItem(item, this.ReferenceType.ConditionProperty);

        if (!checkExists(propertyItem) ||
        !checkExists(propertyItem.xmlNode) ||
        propertyItem.xmlNode.nodeName !== "Property")
        {
            return;
        }

        var propertyNode = propertyItem.xmlNode;

        var annotationOptions = {};

        var valueNode = propertyNode.selectSingleNode("Value");

        if (!checkExists(valueNode))
        {
            return;
        }

        var valueXml = parseXML("<SourceValue>{0}</SourceValue>".format(valueNode.text));

        //Get item node from the source value xml:
        var itemNode = null;

        var msg = "";
        var resourceSvc = SourceCode.Forms.Services.AnalyzerResourcesService();

        if (item.copiedXmlNode.getAttribute("SourceType") === this.ReferenceType.ControlProperty)
        {
            //If the Item node has ControlProperty as source type, it should use the Source info for the annotation
            var refObjForControlProperty =
            {
                id: item.copiedXmlNode.getAttribute("SourcePath"),
                name: item.copiedXmlNode.getAttribute("SourceID"),
                displayName: item.copiedXmlNode.getAttribute("SourceDisplayName"),
                status: referenceObj.status,
                type: this.ReferenceType.ControlProperty
            };

            msg = resourceSvc.generateValidationMessage(refObjForControlProperty, referenceAs);

            itemNode = valueXml.selectSingleNode(".//Source[@SourceType='ControlProperty' and @SourcePath='{0}']"
            .format(refObjForControlProperty.id));
        }
        else
        {
            msg = resourceSvc.generateValidationMessage(referenceObj, referenceAs);

            switch (item.copiedXmlNode.getAttribute("SourceType"))
            {
                case this.ReferenceType.ViewParameter:
                case this.ReferenceType.FormParameter:
                    itemNode = valueXml.selectSingleNode(".//Source[@SourceName='{0}']".format(item.copiedXmlNode.getAttribute("SourceName")));
                    break;
                default:
                    itemNode = valueXml.selectSingleNode(".//Source[@SourceID='{0}']".format(item.copiedXmlNode.getAttribute("SourceID")));
            }
        }

        annotationOptions =
        {
            nodeToAnnotate: itemNode,
            annotationStatus: referenceObj.status,
            annotationMessage: msg,
            annotationAction: annotationAction
        };
        this.updateValidationMessageToXmlNode(annotationOptions);

        valueNode.childNodes[0].nodeValue = valueXml.xml.replace(/<\/?SourceValue>/ig, "");

        var conditionItem = this._getParentFromItem(item, this.ReferenceType.Condition);

        if (!checkExists(conditionItem) ||
        !checkExists(conditionItem.xmlNode) ||
        conditionItem.xmlNode.nodeName !== this.ReferenceType.Condition)
        {
            return;
        }

        annotationOptions =
        {
            nodeToAnnotate: propertyNode,
            annotationStatus: "Error",
            annotationMessage: "SourceValue,SourceValue,Error,,Source,",
            annotationAction: annotationAction
        };
        this.updateValidationMessageToXmlNode(annotationOptions);
        this.annotateConditionAndParents(annotationOptions);
    },

    /**
    * @typedef annotationContextObj
    * @property {xmlDocument} xmlDefinition - Form or view definition
    * @property {object} referenceItem - The object containing references to object being checked for dependencies
    * @property {object} referenceObj - The original reference object being checked for dependencies
    * @property {object} referenceAs - The type of which the dependency object was referencing
    * @property {int} annotationAction - indicating whether to update or delete annotation (default false)
    */

    /**
    * Performs annotation on Filter mapping that is matching Server-Side annotation
    *
    * @function annotateFilterPropertyItem
    *
    * @param {annotationContextObj} annotationContextObj - Object containing information needed to perform annotation
    */
    annotateFilterPropertyItem: function (annotationContextObj)
    {
        if (!checkExists(annotationContextObj))
        {
            return;
        }

        var item = annotationContextObj.referenceItem;
        var referenceObj = annotationContextObj.referenceObj;
        var referenceAs = annotationContextObj.referenceAs;
        var annotationAction = annotationContextObj.annotationAction;

        if (!checkExists(item) || !checkExists(referenceObj) || !checkExists(referenceAs))
        {
            return;
        }

        if (!checkExists(item.copiedXmlNode) ||
        item.copiedXmlNode.nodeName !== "Item")
        {
            return;
        }

        var actionItem = this._getParentFromItem(item, this.ReferenceType.Action);

        if (!checkExists(actionItem) ||
        !checkExists(actionItem.xmlNode) ||
        actionItem.xmlNode.nodeName !== this.ReferenceType.Action)
        {
            return;
        }

        var actionNode = actionItem.xmlNode;

        var propertyNode = actionNode.selectSingleNode("Properties/Property[Name='Filter']");

        if (!checkExists(propertyNode))
        {
            return;
        }

        var annotationOptions =
        {
            nodeToAnnotate: propertyNode,
            annotationStatus: "Error",
            annotationMessage: "Filter,Filter,Error,,Filter,",
            annotationAction: annotationAction
        };
        this.updateValidationMessageToXmlNode(annotationOptions);

        var valueNode = propertyNode.selectSingleNode("Value");

        if (!checkExists(valueNode))
        {
            return;
        }

        var filterXml = parseXML(valueNode.text);
        var itemNode = null;
        var msg = "";

        var resourceSvc = SourceCode.Forms.Services.AnalyzerResourcesService();

        if (item.copiedXmlNode.getAttribute("SourceType") === this.ReferenceType.ControlProperty)
        {
            //If the Item node has ControlProperty as source type, it should use the Source info for the annotation
            var refObjForControlProperty =
            {
                id: item.copiedXmlNode.getAttribute("SourcePath"),
                name: item.copiedXmlNode.getAttribute("SourceID"),
                displayName: item.copiedXmlNode.getAttribute("SourceDisplayName"),
                status: referenceObj.status,
                type: this.ReferenceType.ControlProperty
            };

            msg = resourceSvc.generateValidationMessage(refObjForControlProperty, referenceAs);

            itemNode = filterXml.selectSingleNode(".//Item[@SourceType='ControlProperty' and @SourcePath='{0}']"
            .format(refObjForControlProperty.id));
        }
        else
        {
            msg = resourceSvc.generateValidationMessage(referenceObj, referenceAs);

            itemNode = filterXml.selectSingleNode(".//Item[@SourceID='{0}']".format(item.copiedXmlNode.getAttribute("SourceID")));
        }

        annotationOptions =
        {
            nodeToAnnotate: itemNode,
            annotationStatus: referenceObj.status,
            annotationMessage: msg,
            annotationAction: annotationAction
        };
        this.updateValidationMessageToXmlNode(annotationOptions);

        var filterNode = itemNode.selectSingleNode("./ancestor::Filter");

        if (checkExists(filterNode))
        {
            annotationOptions =
            {
                nodeToAnnotate: filterNode,
                annotationStatus: "Error",
                annotationMessage: "Expression,Expression,Error,,,",
                annotationAction: annotationAction
            };
            this.updateValidationMessageToXmlNode(annotationOptions);
        }

        valueNode.childNodes[0].nodeValue = filterXml.xml;

        annotationOptions =
        {
            nodeToAnnotate: propertyNode,
            annotationStatus: "Error",
            annotationMessage: null,
            annotationAction: annotationAction
        };
        this.annotateActionAndParents(annotationOptions);
    },

    /**
    * @typedef annotationContextObj
    * @property {xmlDocument} xmlDefinition - Form or view definition
    * @property {object} referenceItem - The object containing references to object being checked for dependencies
    * @property {object} referenceObj - The original reference object being checked for dependencies
    * @property {object} referenceAs - The type of which the dependency object was referencing
    * @property {int} annotationAction - indicating whether to update or delete annotation
    */

    /**
    * Performs annotation on subform popup action item that is matching Server-Side annotation
    *
    * @function annotateSubFormPopupActionItem
    *
    * @param {annotationContextObj} annotationContextObj - Object containing information needed to perform annotation
    */
    annotateSubFormPopupActionItem: function (annotationContextObj)
    {
        if (!checkExists(annotationContextObj))
        {
            return;
        }

        var referenceObj = annotationContextObj.referenceObj;
        var referenceAs = annotationContextObj.referenceAs;
        var item = annotationContextObj.referenceItem;
        var annotationAction = annotationContextObj.annotationAction;

        if (!checkExists(item) || !checkExists(item.copiedXmlNode) ||
        item.copiedXmlNode.nodeName !== "Source" ||
        !checkExists(referenceObj) || !checkExists(referenceAs))
        {
            return;
        }

        var actionPropertyItem = this._getParentFromItem(item, this.ReferenceType.ActionProperty);

        var propertyNode = actionPropertyItem.xmlNode;

        if (!checkExists(propertyNode))
        {
            return;
        }

        var annotationOptions =
        {
            nodeToAnnotate: propertyNode,
            annotationStatus: "Error",
            annotationMessage: "SourceValue,SourceValue,Error,,Source,",
            annotationAction: annotationAction
        };
        this.updateValidationMessageToXmlNode(annotationOptions);

        var valueNode = propertyNode.selectSingleNode("Value");

        if (!checkExists(valueNode))
        {
            return;
        }

        var sourceMappingXml = parseXML("<TmpRootNode>{0}</TmpRootNode>".format(valueNode.text));
        var itemNode = null;
        var msg = "";

        var resourceSvc = SourceCode.Forms.Services.AnalyzerResourcesService();

        if (item.copiedXmlNode.getAttribute("SourceType") === this.ReferenceType.ControlProperty)
        {
            //If the Item node has ControlProperty as source type, it should use the Source info for the annotation
            var refObjForControlProperty =
            {
                id: item.copiedXmlNode.getAttribute("SourcePath"),
                name: item.copiedXmlNode.getAttribute("SourceID"),
                displayName: item.copiedXmlNode.getAttribute("SourceDisplayName"),
                status: referenceObj.status,
                type: this.ReferenceType.ControlProperty
            };

            msg = resourceSvc.generateValidationMessage(refObjForControlProperty, referenceAs);

            itemNode = sourceMappingXml.selectSingleNode(".//Source[@SourceType='ControlProperty' and @SourcePath='{0}']"
            .format(refObjForControlProperty.id));
        }
        else
        {
            msg = resourceSvc.generateValidationMessage(referenceObj, referenceAs);

            itemNode = sourceMappingXml.selectSingleNode(".//Source[@SourceID='{0}']".format(item.copiedXmlNode.getAttribute("SourceID")));
        }

        var annotationOptions =
        {
            nodeToAnnotate: itemNode,
            annotationStatus: referenceObj.status,
            annotationMessage: msg,
            annotationAction: annotationAction
        };
        this.updateValidationMessageToXmlNode(annotationOptions);

        valueNode.childNodes[0].nodeValue = sourceMappingXml.xml.replace("<TmpRootNode>", "").replace("</TmpRootNode>", "");

        annotationOptions =
        {
            nodeToAnnotate: propertyNode,
            annotationStatus: "Error",
            annotationAction: annotationAction
        };
        this.annotateActionAndParents(annotationOptions);
    },

    /**
    * @typedef annotationContextObj
    * @property {xmlDocument} xmlDefinition - Form or view definition
    * @property {object} referenceItem - The object containing references to object being checked for dependencies
    * @property {object} referenceObj - The original reference object being checked for dependencies
    * @property {object} referenceAs - The type of which the dependency object was referencing
    * @property {boolean} annotationAction - indicating whether to update or delete annotation
    */

    /**
    * Performs annotation on view instance action item that is matching Server-Side annotation
    *
    * @function annotateViewInstanceActionItem
    *
    * @param {annotationContextObj} annotationContextObj - Object containing information needed to perform annotation
    */
    annotateViewInstanceActionItem: function (annotationContextObj)
    {
        if (!checkExists(annotationContextObj))
        {
            return;
        }

        var actionItem = annotationContextObj.referenceItem;
        var referenceObj = annotationContextObj.referenceObj;
        var annotationAction = annotationContextObj.annotationAction;
        var referenceAs = annotationContextObj.referenceAs;

        if (!checkExists(referenceObj) || !checkExists(referenceAs) ||
        !checkExists(actionItem) ||
        !checkExists(actionItem.xmlNode) ||
        actionItem.xmlNode.nodeName !== this.ReferenceType.Action)
        {
            return;
        }

        var resourceSvc = SourceCode.Forms.Services.AnalyzerResourcesService();

        var actionNode = actionItem.xmlNode;

        var refObj =
        {
            id: referenceObj.id,
            name: referenceObj.name,
            displayName: referenceObj.displayName,
            status: "Missing",
            type: this.ReferenceType.ViewInstance
        };

        var msg = resourceSvc.generateValidationMessage(refObj, this.ReferenceAs.ActionViewViewInstance);

        var annotationOptions =
        {
            nodeToAnnotate: actionNode,
            annotationStatus: refObj.status,
            annotationMessage: msg,
            annotationAction: annotationAction
        };
        this.updateValidationMessageToXmlNode(annotationOptions);
        annotationOptions =
        {
            nodeToAnnotate: actionNode,
            annotationStatus: "Error",
            annotationMessage: "ActionProperty,ActionProperty,Error,,ViewID,",
            annotationAction: annotationAction
        };
        this.updateValidationMessageToXmlNode(annotationOptions);

        var propertyNode = actionNode.selectSingleNode("Properties/Property[Name='ViewID']");
        annotationOptions =
        {
            nodeToAnnotate: propertyNode,
            annotationStatus: refObj.status,
            annotationMessage: msg,
            annotationAction: annotationAction
        };
        this.updateValidationMessageToXmlNode(annotationOptions);

        switch (referenceAs)
        {
            case this.ReferenceAs.ActionMethod:
            case this.ReferenceAs.ActionObject:
                propertyNode = actionNode.selectSingleNode("Properties/Property[Name='Method']");

                if (checkExists(propertyNode))
                {
                    msg = resourceSvc.generateValidationMessage(refObj, this.ReferenceAs.ActionMethodViewInstance);

                    annotationOptions =
                    {
                        nodeToAnnotate: propertyNode,
                        annotationStatus: refObj.status,
                        annotationMessage: msg,
                        annotationAction: annotationAction
                    };
                    this.updateValidationMessageToXmlNode(annotationOptions);

                    annotationOptions =
                    {
                        nodeToAnnotate: actionNode,
                        annotationStatus: "Error",
                        annotationMessage: "ActionProperty,ActionProperty,Error,,Method,",
                        annotationAction: annotationAction
                    };
                    this.updateValidationMessageToXmlNode(annotationOptions);
                }
                break;

            case this.ReferenceAs.ActionControl:
                propertyNode = actionNode.selectSingleNode("Properties/Property[Name='ControlID']");

                if (checkExists(propertyNode))
                {
                    msg = resourceSvc.generateValidationMessage(refObj, this.ReferenceAs.ActionControlViewInstance);

                    annotationOptions =
                    {
                        nodeToAnnotate: propertyNode,
                        annotationStatus: refObj.status,
                        annotationMessage: msg,
                        annotationAction: annotationAction
                    };
                    this.updateValidationMessageToXmlNode(annotationOptions);

                    annotationOptions =
                    {
                        nodeToAnnotate: actionNode,
                        annotationStatus: "Error",
                        annotationMessage: "ActionProperty,ActionProperty,Error,,ControlID,",
                        annotationAction: annotationAction
                    };
                    this.updateValidationMessageToXmlNode(annotationOptions);
                }
                break;
        }

        annotationOptions =
        {
            nodeToAnnotate: actionNode,
            annotationStatus: "Error",
            annotationAction: annotationAction
        };

        this.annotateHandlerAndParents(annotationOptions);
    },

    /**
    * @typedef annotationContextObj
    * @property {xmlDocument} xmlDefinition - Form or view definition
    * @property {object} referenceItem - The object containing references to object being checked for dependencies
    * @property {object} referenceObj - The original reference object being checked for dependencies
    * @property {object} referenceAs - The type of which the dependency object was referencing
    * @property {int} annotationAction - indicating whether to update or delete annotation
    */

    /**
    * Performs annotation on rule with validation group error that is matching Server-Side annotation
    *
    * @function annotateRuleWithValidationGroupError
    *
    * @param {annotationContextObj} annotationContextObj - Object containing information needed to perform annotation
    */
    annotateRuleWithValidationGroupError: function (annotationContextObj)
    {
        if (!checkExists(annotationContextObj))
        {
            return;
        }

        var item = annotationContextObj.referenceItem;
        var annotationAction = annotationContextObj.annotationAction;
        var xmlDef = annotationContextObj.xmlDefinition;

        var validationGroupItem = this._getParentFromItem(item, this.ReferenceType.ValidationGroup);
        var validationGroupId = validationGroupItem.id;

        if (!checkExists(validationGroupId) || validationGroupItem.type !== this.ReferenceType.ValidationGroup)
        {
            return;
        }

        var msg = "ActionValidationGroup,ValidationGroup,Warning,{0},{1},".format(validationGroupId, validationGroupItem.name);

        var validationGroupActionPropertyXPath = ".//Events/Event/Handlers/Handler/Actions/Action/Properties/Property[Name='GroupID'][Value='{0}']"
        .format(validationGroupItem.id);

        //Action Property Node:
        var actionPropertyNode = xmlDef.selectSingleNode(validationGroupActionPropertyXPath);
        if (!checkExists(actionPropertyNode))
        {
            return;
        }

        var annotationOptions =
        {
            nodeToAnnotate: actionPropertyNode,
            annotationStatus: "Warning",
            annotationMessage: msg,
            annotationAction: annotationAction
        };
        this.updateValidationMessageToXmlNode(annotationOptions);

        annotationOptions =
        {
            nodeToAnnotate: actionPropertyNode,
            annotationStatus: "Error",
            annotationMessage: null,
            annotationAction: annotationAction
        };
        this.annotateActionAndParents(annotationOptions);
    },

    /**
    * @typedef annotationContextObj
    * @property {xmlDocument} xmlDefinition - Form or view definition
    * @property {object} referenceItem - The object containing references to object being checked for dependencies
    * @property {object} referenceObj - The original reference object being checked for dependencies
    * @property {enum} referenceAs - The type of which the dependency object was referencing
    * @property {int} annotationAction - indicating whether to update or delete annotation
    */

    /**
    * Will annotate the Source node in error.
    * Will also annotate its Parameter, Action, Handler and Event parents
    *
    * @function annotateSourceValueMappingAndParents
    *
    * @param {annotationContextObj} annotationContextObj - Object containing information needed to perform annotation
    */
    annotateSourceValueMappingAndParents: function (annotationContextObj)
    {
        if (!checkExists(annotationContextObj))
        {
            return;
        }

        var item = annotationContextObj.referenceItem;
        var referenceObj = annotationContextObj.referenceObj;
        var referenceAs = annotationContextObj.referenceAs;
        var annotationAction = annotationContextObj.annotationAction;

        if (!checkExists(item) ||
        !checkExists(item.xmlNode) || !checkExists(referenceObj))
        {
            return;
        }

        var resourceSvc = SourceCode.Forms.Services.AnalyzerResourcesService();
        var msg = resourceSvc.generateValidationMessage(referenceObj, referenceAs);

        var annotationOptions =
        {
            nodeToAnnotate: item.xmlNode,
            annotationStatus: referenceObj.status,
            annotationMessage: msg,
            annotationAction: annotationAction
        };
        this.updateValidationMessageToXmlNode(annotationOptions);
        var parameterNode = item.xmlNode.selectSingleNode("./ancestor::Parameter");

        if (!checkExists(parameterNode))
        {
            return;
        }

        var msg = "SourceValue,SourceValue,Error,,Source,";

        annotationOptions =
        {
            nodeToAnnotate: parameterNode,
            annotationStatus: "Error",
            annotationMessage: msg,
            annotationAction: annotationAction
        };
        this.updateValidationMessageToXmlNode(annotationOptions);

        annotationOptions =
        {
            nodeToAnnotate: parameterNode,
            annotationStatus: "Error",
            annotationAction: annotationAction
        };
        this.annotateActionAndParents(annotationOptions);
    },

    /**
    * @typedef annotationContextObj
    * @property {xmlDocument} xmlDefinition - Form or view definition
    * @property {object} referenceItem - The object containing references to object being checked for dependencies
    * @property {object} referenceObj - The original reference object being checked for dependencies
    * @property {enum} referenceAs - The type of which the dependency object was referencing
    * @property {int} annotationAction - indicating whether to update or delete annotation
    */

    /**
    * Will annotate the Parameter Source Mapping node in error
    * Will also annotate its Action, Handler and Event parents
    *
    * @function annotateSourceValueMappingAndParents
    *
    * @param {annotationContextObj} annotationContextObj - Object containing information needed to perform annotation
    */
    annotateParameterMappingAndParents: function (annotationContextObj)
    {
        if (!checkExists(annotationContextObj))
        {
            return;
        }

        var item = annotationContextObj.referenceItem;
        var referenceObj = annotationContextObj.referenceObj;
        var referenceAs = annotationContextObj.referenceAs;
        var annotationAction = annotationContextObj.annotationAction;

        if (!checkExists(item.xmlNode) && !checkExists(referenceObj) || !checkExists(referenceAs))
        {
            return;
        }

        var resourceSvc = SourceCode.Forms.Services.AnalyzerResourcesService();
        var msg = resourceSvc.generateValidationMessage(referenceObj, referenceAs);

        var annotationOptions =
        {
            nodeToAnnotate: item.xmlNode,
            annotationStatus: referenceObj.status,
            annotationMessage: msg,
            annotationAction: annotationAction
        };
        this.updateValidationMessageToXmlNode(annotationOptions);

        annotationOptions =
        {
            nodeToAnnotate: item.xmlNode,
            annotationStatus: "Error",
            annotationAction: annotationAction
        };

        this.annotateActionAndParents(annotationOptions);
    },

    /**
    * @typedef annotationOptions
    * @property {xmlNode} nodeToAnnotate - XML node on which annotation should be added
    * @property {string} annotationStatus - The value for ValidationStatus attribute to annotate on node
    * @property {string} annotationMessage - TThe value for ValidationMessages attribute to annotate on node
    * @property {int} annotationAction - indicating whether to update or delete annotation
    */

    /**
    * This function will find the parent action node of annotated action child,
    * annotate it with the correct message and do the same for its parents - Handler and Event
    *
    * @function annotateActionAndParents
    *
    * @param {annotationOptions} annotationOptions - Object containing annotation details
    */
    annotateActionAndParents: function (annotationOptions)
    {
        if (!checkExists(annotationOptions))
        {
            return;
        }

        var xmlNode = annotationOptions.nodeToAnnotate;
        var status = annotationOptions.annotationStatus;
        var annotationAction = annotationOptions.annotationAction;

        if (!checkExists(xmlNode))
        {
            return;
        }

        //Action
        var actionNode = xmlNode.selectSingleNode("./ancestor::Action");
        if (!checkExists(actionNode))
        {
            return;
        }

        var resourceSvc = SourceCode.Forms.Services.AnalyzerResourcesService();

        var xmlNodeMsg = xmlNode.getAttribute("ValidationMessages");
        var xmlNodeMsgObj = {};

        if (checkExistsNotEmpty(xmlNodeMsg))
        {
            //we expect to only have one validation message for this node
            xmlNodeMsgObj = resourceSvc.parseValidationMessage(xmlNodeMsg)[0];
        }

        var referenceObj = {};
        var referenceAs = "";

        var messageToAdd = "";

        //Action
        if (xmlNode.nodeName === "Property")
        {
            referenceAs = this.ReferenceType.ActionProperty;
            referenceObj =
            {
                type: this.ReferenceType.ActionProperty,
                status: "Error",
                name: ""
            };

            if (checkExists(xmlNodeMsgObj) &&
            xmlNodeMsgObj.referenceAs === this.ReferenceType.Filter &&
            xmlNodeMsgObj.name === this.ReferenceType.Filter)
            {
                referenceObj.name = this.ReferenceType.Filter;
            }
        }
        else if (xmlNode.nodeName === "Parameter")
        {
            referenceAs = this.ReferenceType.ParameterMapping;
            referenceObj =
            {
                type: this.ReferenceType.ParameterMapping,
                status: "Error",
                name: ""
            };
        }

        messageToAdd = resourceSvc.generateValidationMessage(referenceObj, referenceAs);

        annotationOptions =
        {
            nodeToAnnotate: actionNode,
            annotationStatus: status,
            annotationMessage: messageToAdd,
            annotationAction: annotationAction
        };
        this.updateValidationMessageToXmlNode(annotationOptions);

        annotationOptions =
        {
            nodeToAnnotate: actionNode,
            annotationStatus: status,
            annotationMessage: null,
            annotationAction: annotationAction
        };
        this.annotateHandlerAndParents(annotationOptions);
    },

    /**
    * This function will find the parent condition node of annotated condition property child,
    * annotate it with the correct message and do the same for its parents - Handler and Event
    *
    * @function annotateConditionAndParents
    *
    * @param {annotationOptions} annotationOptions - Object containing annotation details
    */
    annotateConditionAndParents: function (annotationOptions)
    {
        if (!checkExists(annotationOptions))
        {
            return;
        }

        var xmlNode = annotationOptions.nodeToAnnotate;
        var status = annotationOptions.annotationStatus;
        var annotationAction = annotationOptions.annotationAction;

        if (!checkExists(xmlNode))
        {
            return;
        }

        //Condition
        var conditionNode = xmlNode.selectSingleNode("./ancestor::Condition");
        if (!checkExists(conditionNode))
        {
            return;
        }

        var resourceSvc = SourceCode.Forms.Services.AnalyzerResourcesService();

        var xmlNodeMsg = xmlNode.getAttribute("ValidationMessages");
        var xmlNodeMsgObj = {};

        if (checkExistsNotEmpty(xmlNodeMsg))
        {
            //we expect to only have one validation message for this node
            xmlNodeMsgObj = resourceSvc.parseValidationMessage(xmlNodeMsg)[0];
        }

        var referenceObj = {};
        var referenceAs = "";

        var messageToAdd = "";

        //Condition
        if (xmlNode.nodeName === "Property")
        {
            referenceAs = this.ReferenceType.ConditionProperty;
            referenceObj =
            {
                type: this.ReferenceType.ConditionProperty,
                status: "Error",
                name: xmlNode.selectSingleNode("Name").text
            };
        }

        messageToAdd = resourceSvc.generateValidationMessage(referenceObj, referenceAs);

        annotationOptions =
        {
            nodeToAnnotate: conditionNode,
            annotationStatus: status,
            annotationMessage: messageToAdd,
            annotationAction: annotationAction
        };
        this.updateValidationMessageToXmlNode(annotationOptions);
        this.annotateHandlerAndParents(annotationOptions);
    },

    /**
    * @typedef annotationOptions
    * @property {xmlNode} nodeToAnnotate - XML node on which annotation should be added
    * @property {string} annotationStatus - The value for ValidationStatus attribute to annotate on node
    * @property {string} annotationMessage - TThe value for ValidationMessages attribute to annotate on node
    * @property {int} annotationAction - indicating whether to update or delete annotation
    */

    /**
    * This function will find the parent function node of annotated function child,
    * annotate it with the correct message and do the same for its parents - Handler and Event
    *
    * @function annotateFunctionAndParents
    *
    * @param {annotationOptions} annotationOptions - Object containing annotation details
    */
    annotateFunctionAndParents: function (annotationOptions)
    {
        if (!checkExists(annotationOptions))
        {
            return;
        }

        var xmlNode = annotationOptions.nodeToAnnotate;
        var status = annotationOptions.annotationStatus;
        var annotationAction = annotationOptions.annotationAction;

        if (!checkExists(xmlNode))
        {
            return;
        }

        //First node to start annotate (function node):
        var functionNode = xmlNode.selectSingleNode("./ancestor::Function");
        if (!checkExists(functionNode))
        {
            return;
        }

        var resourceSvc = SourceCode.Forms.Services.AnalyzerResourcesService();

        var xmlNodeMsg = xmlNode.getAttribute("ValidationMessages");
        var xmlNodeMsgObj = {};

        if (checkExistsNotEmpty(xmlNodeMsg))
        {
            //we expect to only have one validation message for this node
            xmlNodeMsgObj = resourceSvc.parseValidationMessage(xmlNodeMsg)[0];
        }

        var referenceObj = {};
        var referenceAs = "";

        var messageToAdd = "";

        //Annotate Function
        referenceAs = this.ReferenceType.Expression;
        referenceObj =
        {
            type: this.ReferenceType.Expression,
            status: "Error",
            name: "Item"
        };

        var options = {};

        if (checkExistsNotEmpty(referenceAs) && checkExists(referenceObj.type))
        {
            messageToAdd = resourceSvc.generateValidationMessage(referenceObj, referenceAs);
            options =
            {
                nodeToAnnotate: functionNode,
                annotationStatus: status,
                annotationMessage: messageToAdd,
                annotationAction: annotationAction
            };
            this.updateValidationMessageToXmlNode(options);
        }

        //Handler
        var handlerNode = functionNode.selectSingleNode("./ancestor::Handler");
        if (checkExists(handlerNode))
        {
            referenceAs = this.ReferenceType.HandlerFunction;
            referenceObj =
            {
                type: this.ReferenceType.HandlerFunction,
                status: "Error",
                name: "ControlItemsCollection"
            };

            messageToAdd = resourceSvc.generateValidationMessage(referenceObj, referenceAs);
            options =
            {
                nodeToAnnotate: handlerNode,
                annotationStatus: status,
                annotationMessage: messageToAdd,
                annotationAction: annotationAction
            };
            this.updateValidationMessageToXmlNode(options);

            //Event
            var eventNode = handlerNode.selectSingleNode("./ancestor::Event");
            if (checkExists(eventNode))
            {
                var handlerId = handlerNode.getAttribute("ID");
                if (!checkExists(handlerId))
                {
                    handlerId = "";
                }

                referenceAs = this.ReferenceType.Handler;
                referenceObj =
                {
                    type: this.ReferenceType.Handler,
                    status: "Error",
                    id: handlerId
                };

                messageToAdd = resourceSvc.generateValidationMessage(referenceObj, referenceAs);
                options =
                {
                    nodeToAnnotate: eventNode,
                    annotationStatus: status,
                    annotationMessage: messageToAdd,
                    annotationAction: annotationAction
                };
                this.updateValidationMessageToXmlNode(options);
            }
        }
    },

    /**
    * @typedef annotationOptions
    * @property {xmlNode} nodeToAnnotate - XML node on which annotation should be added
    * @property {string} annotationStatus - The value for ValidationStatus attribute to annotate on node
    * @property {string} annotationMessage - TThe value for ValidationMessages attribute to annotate on node
    * @property {int} annotationAction - indicating whether to update or delete annotation
    */

    /**
    * This function will annotate the parent nodes (Hander and Event nodes) of an annotated item node
    *
    * @function annotateHandlerAndParents
    *
    * @param {annotationOptions} annotationOptions - Object containing annotation details
    */
    annotateHandlerAndParents: function (annotationOptions)
    {
        if (!checkExists(annotationOptions))
        {
            return;
        }
        var xmlNode = annotationOptions.nodeToAnnotate;
        var status = annotationOptions.annotationStatus;
        var annotationAction = annotationOptions.annotationAction;

        if (!checkExists(xmlNode) ||
        ["Action", "Condition"].indexOf(xmlNode.nodeName) === -1)
        {
            return;
        }

        var resourceSvc = SourceCode.Forms.Services.AnalyzerResourcesService();

        //Handler
        var handlerNode = xmlNode.selectSingleNode("./ancestor::Handler");
        var messageToAdd = "";
        var referenceAs = "";
        var referenceObj = null;

        if (checkExists(handlerNode))
        {
            if (xmlNode.nodeName === "Action")
            {
                var actionType = xmlNode.getAttribute("Type");
                if (!checkExists(actionType))
                {
                    actionType = "";
                }
                var actionId = xmlNode.getAttribute("ID");
                if (!checkExists(actionId))
                {
                    actionId = "";
                }

                referenceAs = this.ReferenceType.Action;
                referenceObj =
                {
                    type: this.ReferenceType.Action,
                    status: "Error",
                    id: actionId,
                    name: actionType
                };
            }
            else if (xmlNode.nodeName === "Condition")
            {
                referenceAs = this.ReferenceType.Condition;
                referenceObj =
                {
                    type: this.ReferenceType.Condition,
                    status: "Error",
                    id: xmlNode.getAttribute("ID")
                };
            }

            messageToAdd = resourceSvc.generateValidationMessage(referenceObj, referenceAs);
            var options =
            {
                nodeToAnnotate: handlerNode,
                annotationStatus: status,
                annotationMessage: messageToAdd,
                annotationAction: annotationAction
            };
            this.updateValidationMessageToXmlNode(options);

            //Event
            var eventNode = handlerNode.selectSingleNode("./ancestor::Event");
            if (!checkExists(eventNode))
            {
                return;
            }

            var handlerId = handlerNode.getAttribute("ID");
            if (!checkExists(handlerId))
            {
                handlerId = "";
            }

            referenceAs = this.ReferenceType.Handler;
            referenceObj =
            {
                type: this.ReferenceType.Handler,
                status: "Error",
                id: handlerId
            };

            messageToAdd = resourceSvc.generateValidationMessage(referenceObj, referenceAs);

            options =
            {
                nodeToAnnotate: eventNode,
                annotationStatus: status,
                annotationMessage: messageToAdd,
                annotationAction: annotationAction
            };
            this.updateValidationMessageToXmlNode(options);

            //State
            var stateNode = handlerNode.selectSingleNode("./ancestor::State");
            if (!checkExists(stateNode))
            {
                return;
            }

            var eventId = eventNode.getAttribute("ID");
            if (!checkExists(eventId))
            {
                eventId = "";
            }

            referenceAs = this.ReferenceType.Event;
            referenceObj =
            {
                type: this.ReferenceType.Event,
                status: "Error",
                id: eventId
            };

            messageToAdd = resourceSvc.generateValidationMessage(referenceObj, referenceAs);
            options =
            {
                nodeToAnnotate: stateNode,
                annotationStatus: status,
                annotationMessage: messageToAdd,
                annotationAction: annotationAction
            };
            this.updateValidationMessageToXmlNode(options);
        }
    },

    annotatePanel: function (annotationContextObj)
    {
        if (!checkExists(annotationContextObj))
        {
            return;
        }

        var xmlDefinition = annotationContextObj.xmlDefinition;
        var item = annotationContextObj.referenceItem;
        var annotationAction = annotationContextObj.annotationAction;

        if (!checkExists(item) || item.type !== this.ReferenceType.Control)
        {
            return false;
        }

        var nodes = xmlDefinition.selectNodes(".//Panels/Panel//Control[@ID='{0}']".format(item.id));

        if (nodes.length === 0)
        {
            return false;
        }

        var resourceSvc = SourceCode.Forms.Services.AnalyzerResourcesService();

        var msg = "";
        var refObj = null;
        var node = null;
        var i = 0;
        for (i = 0; i < nodes.length; i++)
        {
            node = nodes[i];

            refObj = {
                id: item.id,
                type: item.type,
                name: item.name,
                displayName: item.displayName,
                status: "Warning"
            };

            msg = resourceSvc.generateValidationMessage(refObj, this.ReferenceAs.FlowItemControl);
            var annotationOptions =
            {
                nodeToAnnotate: node,
                annotationStatus: refObj.status,
                annotationMessage: msg,
                annotationAction: annotationAction
            };
            this.updateValidationMessageToXmlNode(annotationOptions);

            //Item
            var itemNode = node.selectSingleNode("./ancestor::Item");
            var itemId = "";
            if (checkExists(itemNode))
            {
                itemId = itemNode.getAttribute("ID");
                annotationOptions =
                {
                    nodeToAnnotate: itemNode,
                    annotationStatus: "Error",
                    annotationMessage: "Layout,Layout,Error,,,",
                    annotationAction: annotationAction
                };
                this.updateValidationMessageToXmlNode(annotationOptions);
            }

            //Area
            var areaNode = node.selectSingleNode("./ancestor::Area");
            var areaId = "";
            if (checkExists(areaNode))
            {
                areaId = areaNode.getAttribute("ID");
                annotationOptions =
                {
                    nodeToAnnotate: areaNode,
                    annotationStatus: "Error",
                    annotationMessage: "AreaItem,AreaItem,Error,{0},,".format(itemId),
                    annotationAction: annotationAction
                };
                this.updateValidationMessageToXmlNode(annotationOptions);
            }

            //Panel
            var panelNode = node.selectSingleNode("./ancestor::Panel");
            if (checkExists(panelNode))
            {
                annotationOptions =
                {
                    nodeToAnnotate: panelNode,
                    annotationStatus: "Error",
                    annotationMessage: "Area,Area,Error,{0},,".format(areaId),
                    annotationAction: annotationAction
                };
                this.updateValidationMessageToXmlNode(annotationOptions);
            }
        }

        return true;
    },

    /**
    * @typedef annotationOptions
    * @property {xmlNode} nodeToAnnotate - XML node on which annotation should be added
    * @property {string} annotationStatus - The value for ValidationStatus attribute to annotate on node
    * @property {string} annotationMessage - TThe value for ValidationMessages attribute to annotate on node
    * @property {int} annotationAction - indicating whether to update or delete annotation
    */

    /**
    * Updates the xmlnode with the message - adds if does not exist, update if exists or remove if match found and remove annotation if annotationAction is Delete.
    * Will only remove annotation of node if node does not contain any annotated children.
    *
    * @function updateValidationMessageToXmlNode
    *
    * @param {annotationOptions} updateValidationMessageToXmlNode - Object containing annotation details
    */
    updateValidationMessageToXmlNode: function (annotationOptions)
    {
        if (!checkExists(annotationOptions))
        {
            return;
        }

        var xmlNode = annotationOptions.nodeToAnnotate;
        var status = annotationOptions.annotationStatus;
        var msg = annotationOptions.annotationMessage;
        var annotationAction = annotationOptions.annotationAction;

        if (!checkExists(xmlNode) ||
        !checkExistsNotEmpty(status) ||
        !checkExistsNotEmpty(msg))
        {
            return;
        }

        var resourceSvc = SourceCode.Forms.Services.AnalyzerResourcesService();

        var msgObj = resourceSvc.parseValidationMessage(msg)[0];


        if (annotationAction === this.AnnotationAction.Delete)
        {
            var childrenNodes = xmlNode.selectNodes(".//*");
            var childrenInError = xmlNode.selectNodes(".//*{0}".format(SourceCode.Forms.Designers.Common.getXPathValidationStatusCondition()));

            if (childrenNodes.length > 0 && childrenInError.length === 0)
            {
                this.removeAnnotation(xmlNode);
            }

            if (childrenNodes.length === 0)
            {
                //Assumption: if node to remove annotation from, does not have any children nodes (e.g. a parameter mapping),
                //the annotation to remove should be specific enough to remove using removeAnnotation function
                //This is to prevent entire validation to be removed if for example a parameter mapping had a source and a target in error
                //and only one of the errors was fixed
                this.removeAnnotation(xmlNode, msgObj);
            }
            return;
        }

        var existingStatus = xmlNode.getAttribute("ValidationStatus");
        var existingMessages = xmlNode.getAttribute("ValidationMessages");

        if (checkExistsNotEmpty(existingStatus) && checkExistsNotEmpty(existingMessages))
        {
            var existingMessagesObj = resourceSvc.parseValidationMessage(existingMessages);

            var i = 0;
            var existingMsgObj = {};

            var newMessages = [];

            var isNewMessage = true;

            for (i = 0; i < existingMessagesObj.length; i++)
            {
                existingMsgObj = existingMessagesObj[i];

                if ((existingMsgObj.referenceAs === msgObj.referenceAs && existingMsgObj.type === msgObj.type) &&
                    ((checkExists(existingMsgObj.guid) && checkExists(msgObj.guid) && existingMsgObj.guid === msgObj.guid) ||
                    (checkExists(existingMsgObj.name) && checkExists(msgObj.name) && existingMsgObj.name === msgObj.name)))
                {
                    //Check existing message and update it
                    newMessages.push(resourceSvc.generateValidationMessage(msgObj, msgObj.referenceAs));
                    isNewMessage = false;
                }
                else
                {
                    newMessages.push(resourceSvc.generateValidationMessage(existingMsgObj, existingMsgObj.referenceAs));
                }
            }

            if (isNewMessage)
            {
                newMessages.push(resourceSvc.generateValidationMessage(msgObj, msgObj.referenceAs));
            }

            //Separate the validation messages as semi-colon separated array
            xmlNode.setAttribute("ValidationMessages", newMessages.join(";"));

            if (newMessages.length > 1)
            {
                xmlNode.setAttribute("ValidationStatus", "Error");
            }
            else
            {
                xmlNode.setAttribute("ValidationStatus", status);
            }
        }
        else
        {
            xmlNode.setAttribute("ValidationStatus", status);
            xmlNode.setAttribute("ValidationMessages", msg);
        }
    },

    /**
    * Add a validation message to a xml node
    * @function
    * 
    * @param {xmlNode} The xmlNode to add annotation
    * 
    * @param {referenceObj} Reference object that has following properties:
    *		type: Type of the reference object
    *		status: Status of reference object e.g. "Missing", "Warning" or "Error"
    *		id: Guid of the reference object
    *		name: System name of the reference object
    *		displayName: Display Name of reference object
    *		subType: Subtype of reference object
    * 
    *  @param {referenceAs} The relationship between the reference and the item
    * 
    * 
    * @returns xmlNode that was changed
    */
    addAnnotation: function (xmlNode, referenceObj, referenceAs)
    {
        var resourceSvc = SourceCode.Forms.Services.AnalyzerResourcesService();

        var msg = resourceSvc.generateValidationMessage(referenceObj, referenceAs);

        var annotationOptions =
        {
            nodeToAnnotate: xmlNode,
            annotationStatus: referenceObj.status,
            annotationMessage: msg,
            annotationAction: this.AnnotationAction.Update
        };

        this.updateValidationMessageToXmlNode(annotationOptions);

        return xmlNode;
    },

    /**
    * Performs the "reverse" of annotate. Removes all annotation for specified references
    *
    * @function
    * 
    */
    removeAnnotationsForReferences: function (xmlDefinition, references)
    {
        this.updateAnnotations(xmlDefinition, references, this.AnnotationAction.Delete);
    },

    /**
    * Removes a specific validation status and validation message for an annotated xml node
    * @function
    * 
    * @param {xmlNode} The xmlNode that contains the annotation
    * 
    * @param {annotationToRemove} the details of the annotation that needs to be removed.  If not defined, it will remove all annotation of the xmlNode. 
    * annotationToRemove can have following properties:
    *		type: Type of the reference item e.g. "SourceField"
    *		all: (true/false) Flag to indicate to remove all item of the specified type 
    *		guid: Guid of the reference item
    *		name: System name of the reference item
    * 
    * @returns xmlNode that was changed
    */
    removeAnnotation: function (xmlNode, annotationToRemove)
    {
        if (!checkExists(xmlNode))
        {
            return xmlNode;
        }

        if (!checkExists(xmlNode.getAttribute("ValidationMessages")))
        {
            xmlNode.removeAttribute("ValidationStatus");
            return xmlNode;
        }

        if (!checkExists(annotationToRemove))
        {
            xmlNode.removeAttribute("ValidationStatus");
            xmlNode.removeAttribute("ValidationMessages");
            return xmlNode;
        }

        var resourceSvc = SourceCode.Forms.Services.AnalyzerResourcesService();

        var messages = resourceSvc.parseValidationMessage(xmlNode.getAttribute("ValidationMessages"));
        var statuses = xmlNode.getAttribute("ValidationStatus").split(",");

        if (!checkExists(messages) || messages.length === 0 ||
        !checkExists(statuses) || statuses.length === 0)
        {
            return xmlNode;
        }

        var i = 0;
        var objToRemoveArray = [];
        var newValdiationStatus = [];
        var newValidationMessage = [];
        for (i = 0; i < messages.length; i++)
        {
            var reference = messages[i];

            if (reference.type === annotationToRemove.type &&
            (checkExistsNotEmpty(reference.guid) && reference.guid === annotationToRemove.guid ||
            checkExistsNotEmpty(reference.name) && reference.name === annotationToRemove.name))
            {
                objToRemoveArray.push(reference);
            }
            else if (reference.type === annotationToRemove.type && annotationToRemove.all === true)
            {
                objToRemoveArray.push(reference);
            }
            else
            {
                newValdiationStatus.push(reference.status.trim());
                newValidationMessage.push(resourceSvc.generateValidationMessage(reference, reference.referenceAs));
            }
        }

        if (newValdiationStatus.length === 0)
        {
            xmlNode.removeAttribute("ValidationStatus");
            xmlNode.removeAttribute("ValidationMessages");
        }
        else
        {
            xmlNode.setAttribute("ValidationStatus", newValdiationStatus.join(","));
            xmlNode.setAttribute("ValidationMessages", newValidationMessage.join(";"));
        }

        // Remove items from the dependency reporter
        for (i = 0; i < objToRemoveArray.length; i++)
        {
            SourceCode.Forms.Designers.Common.removeItemFromDependencyReporterModel(objToRemoveArray[i]);
        }

        return xmlNode;
    },

    // Clone the annotations from a source node to the target node
    cloneAnnotation: function (sourceNode, targetNode)
    {
        if (!checkExists(sourceNode) || !checkExists(targetNode))
        {
            return;
        }

        var status = sourceNode.getAttribute("ValidationStatus");
        var messages = sourceNode.getAttribute("ValidationMessages");

        if (checkExists(status))
        {
            targetNode.setAttribute("ValidationStatus", status);
        }

        if (checkExists(messages))
        {
            targetNode.setAttribute("ValidationMessages", messages);
        }
    },

    /**
    * updateControlPropertyNode method find the control node in the given xmlDoc and 
    * update the specified property's value and display value with new values.
    * @function
    * @param {xmlDocument} xmlDoc
    * @param {string} controlId - Unique ID of the Control node to update
    * @param {string} propertyName - Name of the property name to update
    * @param {string} value - New property value
    * @param {string} displayValue - New property displayValue
    */
    updateControlPropertyNode: function (xmlDoc, controlId, propertyName, value, displayValue)
    {
        if (!checkExists(xmlDoc))
        {
            return false;
        }

        var controlNode = xmlDoc.selectSingleNode('Controls/Control[@ID="{0}"]'.format(controlId));

        if (!checkExists(controlNode))
        {
            return false;
        }

        var propertiesNode = controlNode.selectSingleNode('Properties');

        if (!checkExists(propertiesNode))
        {
            return false;
        }

        var propertyNode = propertiesNode.selectSingleNode('Property[Name="{0}"]'.format(propertyName));

        if (checkExists(propertyNode))
        {
            propertiesNode.removeChild(propertyNode);
        }

        propertyNode = xmlDoc.createElement('Property');

        var node = xmlDoc.createElement('Name');
        node.appendChild(xmlDoc.createTextNode(propertyName));
        propertyNode.appendChild(node);

        node = xmlDoc.createElement('Value');
        node.appendChild(xmlDoc.createTextNode(value));
        propertyNode.appendChild(node);

        node = xmlDoc.createElement('DisplayValue');
        node.appendChild(xmlDoc.createTextNode(displayValue));
        propertyNode.appendChild(node);

        propertiesNode.appendChild(propertyNode);

        return true;
    },

    removeSourceFieldAnnotationForDataLabelRelatedControls: function (xmlDef, controlNode)
    {
        if (!checkExists(controlNode))
        {
            return;
        }

        var fieldId = controlNode.getAttribute("FieldID");
        var type = controlNode.getAttribute("Type");

        if (type !== "DataLabel" || !checkExistsNotEmpty(fieldId))
        {
            return;
        }

        var annotationToRemove = {
            type: this.ReferenceType.SourceField,
            guid: fieldId
        };

        var xpath = ".//Controls/Control[@Type='Label' and @FieldID='{0}' and @ValidationStatus]".format(fieldId);
        var labelNodes = xmlDef.selectNodes(xpath);

        for (var i = 0; i < labelNodes.length; i++)
        {
            this.removeAnnotation(labelNodes[i], annotationToRemove);

            labelNodes[i].removeAttribute("FieldID");

            var propertyNode = labelNodes[i].selectSingleNode('Properties/Property[Name="Field" and Value="{0}"]'.format(fieldId));

            this.removeAnnotation(propertyNode, annotationToRemove);
        }
    },

    removeAnnotationForControlBoundsToAField: function (xmlDefinition, controlId)
    {
        if (!checkExists(xmlDefinition) ||
        !checkExistsNotEmpty(controlId))
        {
            return;
        }

        var controlNode = xmlDefinition.selectSingleNode('.//Controls/Control[@ID="{0}"]'.format(controlId));

        if (!checkExists(controlNode))
        {
            return;
        }

        this.removeSourceFieldAnnotationForControl(controlNode);
    },


    /**
    * This function will go through all expressions and remove annotation for their references
    * 
    * @function
    * 
    * @param {xmlDocument} xmlDefinition The form or view definition XML
    *
    * @returns {array} controlIds List of ids of controls that are referencing these expressions.
    * These ids can be used to refresh specific control's badging.
    * 
    */
    refreshExpressionsAnnotations: function (xmlDefinition)
    {
        if (!checkExists(xmlDefinition))
        {
            return [];
        }

        var exprNodes = xmlDefinition.selectNodes(".//Expressions/Expression");

        if (!checkExists(exprNodes) || exprNodes.length === 0)
        {
            return [];
        }

        var controlIds = [];
        var controlIdsForExpression = [];
        var i = 0;
        var expressionNode = null;
        var expressionId = "";
        for (i = 0; i < exprNodes.length; i++)
        {
            expressionNode = exprNodes[i];
            expressionId = expressionNode.getAttribute("ID");

            controlIdsForExpression = this.refreshExpressionAnnotations(xmlDefinition, expressionId);
            $.merge(controlIds, controlIdsForExpression);
        }

        return controlIds;
    },


    /**
    * This function will remove annotation for the expression if it is valid for all of the expression's references
    * 
    * @function
    * 
    * @param {xmlDocument} xmlDefinition The form or view definition XML
    *
    * @returns {array} controlIds List of ids of controls that are referencing this expression.
    * These ids can be used to refresh specific control's badging.
    * 
    */
    refreshExpressionAnnotations: function (xmlDefinition, expressionId)
    {
        if (!checkExists(xmlDefinition))
        {
            return [];
        }

        var expressionNode = xmlDefinition.selectSingleNode(".//Expressions/Expression[@ID='{0}']".format(expressionId));

        if (!checkExists(expressionNode))
        {
            return [];
        }

        var controlIds = [];

        var expressionInError = this.hasValidationStatusError(expressionNode);
        //Expression mapping that caused expression to be in error could also have been removed, making expression valid
        if (expressionInError)
        {
            var childrenInError = expressionNode.selectNodes(".//*{0}".format(
            SourceCode.Forms.Designers.Common.getXPathValidationStatusCondition()));
            if (childrenInError.length === 0)
            {
                expressionInError = false;
                expressionNode.removeAttribute("ValidationStatus");
                expressionNode.removeAttribute("ValidationMessages");
            }
        }

        if (!expressionInError)
        {
            //This means the expression has no more errors and 
            //we shall remove the annotations for any mappings to this expression
            var expObj =
            {
                id: expressionId,
                type: SourceCode.Forms.DependencyHelper.ReferenceType.ControlExpression
            };
            var expressionRefObj = this.findReferences(xmlDefinition, expObj);
            if (checkExists(expressionRefObj) && expressionRefObj.items.length > 0)
            {
                //Remove annotation for all expression references
                this.removeAnnotationsForReferences(xmlDefinition, [expressionRefObj]);

                //Add affected control ids to collection
                var i = 0;
                var control = null;
                for (i = 0; i < expressionRefObj.items.length; i++)
                {
                    if (!checkExists(expressionRefObj.items[i].item))
                    {
                        continue;
                    }
                    control = this._getParentFromItem(expressionRefObj.items[i].item, "Control");
                    if (checkExists(control) && checkExists(control.id))
                    {
                        controlIds.push(control.id);
                    }
                }
            }
        }

        return controlIds;
    },

    refreshMappingAnnotationForAction: function (actionNode)
    {
        if (!checkExists(actionNode) || !this.hasValidationStatusError(actionNode))
        {
            return;
        }

        var nodes = [];
        var annotationToRemove = {};

        //If there are no more result mapping issues then remove result mapping annotation
        nodes = actionNode.selectNodes(".//Results/Result" + SourceCode.Forms.Designers.Common.getXPathValidationStatusCondition());
        if (nodes.length === 0)
        {
            annotationToRemove = {
                type: this.ReferenceType.ResultMapping,
                all: true
            };

            this.removeAnnotation(actionNode, annotationToRemove);
        }

        //If there are no more parameter mapping issues then remove parameter mapping annotation
        nodes = actionNode.selectNodes(".//Parameters/Parameter" + SourceCode.Forms.Designers.Common.getXPathValidationStatusCondition());
        if (nodes.length === 0)
        {
            annotationToRemove = {
                type: this.ReferenceType.ParameterMapping,
                all: true
            };

            this.removeAnnotation(actionNode, annotationToRemove);
        }

        if (actionNode.getAttribute("ValidationStatus") === null)
        {
            var handlerNode = actionNode.selectSingleNode("./ancestor::Handler");

            if (checkExists(handlerNode))
            {
                annotationToRemove = {
                    type: this.ReferenceType.Action,
                    guid: actionNode.getAttribute("ID")
                };

                this.removeAnnotation(handlerNode, annotationToRemove);

                if (handlerNode.getAttribute("ValidationStatus") === null)
                {
                    var eventNode = handlerNode.selectSingleNode("./ancestor::Event");

                    if (checkExists(eventNode))
                    {
                        annotationToRemove = {
                            type: this.ReferenceType.Handler,
                            guid: handlerNode.getAttribute("ID")
                        };

                        this.removeAnnotation(eventNode, annotationToRemove);
                    }
                }
            }
        }
    },

    removeSourceFieldAnnotationForControl: function (controlNode)
    {
        if (!checkExists(controlNode))
        {
            return;
        }

        //Control is bound a one SourceField thus it is safe to just remove all SourceField type annotations
        var annotationToRemove = {
            type: this.ReferenceType.SourceField,
            all: true
        };

        this.removeAnnotation(controlNode, annotationToRemove);

        var valueNode = controlNode.selectSingleNode("Properties/Property[Name='Field']/Value");

        if (checkExists(valueNode))
        {
            var sourceFieldId = valueNode.text;

            var propertyNode = controlNode.selectSingleNode(
            'Properties/Property[Name="Field" and Value="{0}"]'.format(sourceFieldId));

            if (!checkExists(propertyNode))
            {
                return;
            }

            annotationToRemove = {
                type: this.ReferenceType.SourceField,
                guid: sourceFieldId
            };

            this.removeAnnotation(propertyNode, annotationToRemove);
        }
    },

    removeExpressionAnnotationForControl: function (controlNode)
    {
        if (!checkExists(controlNode))
        {
            return;
        }

        var valueNode = controlNode.selectSingleNode("Properties/Property[Name='ControlExpression']/Value");

        if (!checkExists(valueNode))
        {
            return;
        }

        var controlExpressionId = valueNode.text;

        var propertyNode = controlNode.selectSingleNode(
        'Properties/Property[Name="ControlExpression" and Value="{0}"]'.format(controlExpressionId));

        if (!checkExists(propertyNode))
        {
            return;
        }

        var annotationToRemove = {
            type: this.ReferenceType.ControlExpression,
            guid: controlExpressionId
        };

        this.removeAnnotation(controlNode, annotationToRemove);
        this.removeAnnotation(propertyNode, annotationToRemove);
    },

    removeValidationPatternAnnotationForControl: function (controlNode)
    {
        if (!checkExists(controlNode))
        {
            return;
        }

        var valueNode = controlNode.selectSingleNode("Properties/Property[Name='ValidationPattern']/Value");

        if (!checkExists(valueNode))
        {
            return;
        }

        var validationPatternId = valueNode.text;

        var propertyNode = controlNode.selectSingleNode(
            'Properties/Property[Name="ValidationPattern" and Value="{0}"]'.format(validationPatternId));

        if (!checkExists(propertyNode))
        {
            return;
        }

        this.removeAnnotation(propertyNode);
    },

    // The annotations that are referencing valid conditional styles should be removed
    // The annotations that are referencing non-exist styles should be removed
    removeInvalidConditionalStylesAnnotationForControl: function (controlNode)
    {
        if (!checkExists(controlNode))
        {
            return;
        }

        if (!checkExistsNotEmpty(controlNode.getAttribute("ValidationMessages")))
        {
            return;
        }

        var i = 0;
        var annotationToRemove = {};
        var itemNodes = null;
        var resourceSvc = SourceCode.Forms.Services.AnalyzerResourcesService();

        var messages = resourceSvc.parseValidationMessage(controlNode.getAttribute("ValidationMessages"));
        var msg;
        for (i = 0; i < messages.length; i++)
        {
            msg = messages[i];

            if (msg.type !== this.ReferenceType.ConditionalStyle)
            {
                //Skip if this is not conditional style annotation
                continue;
            }

            var styleNode = null;

            if (checkExistsNotEmpty(msg.guid))
            {
                styleNode = controlNode.selectSingleNode("ConditionalStyles/ConditionalStyle[@ID='{0}']".format(msg.guid));
            }
            else if (checkExistsNotEmpty(msg.name))
            {
                styleNode = controlNode.selectSingleNode("ConditionalStyles/ConditionalStyle[Name='{0}']".format(msg.name));
            }

            if (checkExistsNotEmpty(styleNode))
            {
                itemNodes = styleNode.selectNodes(".//Item" + SourceCode.Forms.Designers.Common.getXPathValidationStatusCondition());

                if (itemNodes.length === 0)
                {
                    //Conditional style has no more dependency errors thus we can remove the annotation for this style
                    styleNode.removeAttribute("ValidationStatus");
                    styleNode.removeAttribute("ValidationMessages");
                }
            }
            else
            {
                itemNodes = [];
            }

            if (itemNodes.length === 0)
            {
                // This style doesn't exist anymore or doesn't contain validation error anymore
                // Thus we can remove the style annotation for this control node

                annotationToRemove = {
                    type: this.ReferenceType.ConditionalStyle,
                    guid: msg.guid
                };

                this.removeAnnotation(controlNode, annotationToRemove);
            }
        }

        //If there are no more validation issues for conditional style, remove all Control annotation for conditional style
        itemNodes = controlNode.selectNodes("ConditionalStyles/ConditionalStyle//Item" + SourceCode.Forms.Designers.Common.getXPathValidationStatusCondition());

        if (itemNodes.length === 0)
        {
            annotationToRemove = {
                type: this.ReferenceType.ConditionalStyle,
                all: true
            };
            this.removeAnnotation(controlNode, annotationToRemove);

            var styleNodes = controlNode.selectNodes("ConditionalStyles/ConditionalStyle" + SourceCode.Forms.Designers.Common.getXPathValidationStatusCondition());

            for (i = 0; i < styleNodes.length; i++)
            {
                styleNodes[i].removeAttribute("ValidationStatus");
                styleNodes[i].removeAttribute("ValidationMessages");
            }
        }
    },

    /**
    * Checks whether conditions contains any mappings (item nodes) in error state
    * If all item mappings are valid, remove annotation for condition.
    * If annotation for condition removed, remove condition's annotation on handler.
    * If annotation for handler removed, remove handler's annotation on event.
    * @param {xmlNode} eventNode Event node from the form or view definition XML that will contain one or more handlers with advanced conditions
    */
    removeInvalidAdvancedConditionAnnotationForEvent: function (eventNode)
    {
        if (!checkExists(eventNode))
        {
            return;
        }

        var i = 0;
        var annotationToRemove = {};
        var conditionNode = null;
        var handlerNode = null;
        var conditionId = null;
        var handlerId = null;

        var conditionNodes = eventNode.selectNodes(".//Conditions/Condition");
        for (var i = 0; i < conditionNodes.length; i++)
        {
            conditionNode = conditionNodes[i];
            if (!checkExists(conditionNode))
            {
                continue;
            }
            conditionId = conditionNode.getAttribute("ID");

            itemNodes = conditionNode.selectNodes(".//Item" + SourceCode.Forms.Designers.Common.getXPathValidationStatusCondition());
            //No item nodes in error for this condition, ensure parents are not annotated:
            if (itemNodes.length === 0)
            {
                annotationToRemove = {
                    type: this.ReferenceType.Expression,
                    all: true
                };
                this.removeAnnotation(conditionNode, annotationToRemove);

                //Condition is valid, remove condition annotation on handler
                handlerNode = conditionNode.selectSingleNode("./ancestor::Handler");
                if (!checkExists(handlerNode))
                {
                    continue;
                }
                handlerId = handlerNode.getAttribute("ID");

                annotationToRemove = {
                    type: this.ReferenceType.Condition,
                    guid: conditionId
                };
                this.removeAnnotation(handlerNode, annotationToRemove);

                var handlerHasError = checkExistsNotEmpty(handlerNode.getAttribute("ValidationMessages"));

                if (!handlerHasError)
                {
                    //Remove handler annotation on event
                    annotationToRemove = {
                        type: this.ReferenceType.Handler,
                        guid: handlerId
                    };

                    this.removeAnnotation(eventNode, annotationToRemove);
                }
            }
        }
    },

    /**
    * Checks whether handlers contains any functions in error state
    * If all functions are valid, remove annotation for handler.
    * If annotation for handler removed, remove handler's annotation on event.
    * @param {xmlNode} eventNode Event node from the form or view definition XML that will contain one or more handlers with advanced conditions
    */
    applyHandlerFunctionUnconfiguredAnnotationForEvent: function (eventNode)
    {
        if (!checkExists(eventNode))
        {
            return;
        }

        var i = 0;
        var annotationToRemove = {};
        var functionNode = null;
        var handlerNode = null;
        var functionId = null;
        var handlerId = null;

        var functionNodes = eventNode.selectNodes(".//Function");

        for (var i = 0; i < functionNodes.length; i++)
        {
            functionNode = functionNodes[i];
            if (!checkExists(functionNode))
            {
                continue;
            }

            //Remove annotation for all handlers that don't have invalid functions
            if (!this.hasValidationStatusError(functionNode))
            {
                handlerNode = functionNode.selectSingleNode("./ancestor::Handler");
                if (!checkExists(handlerNode))
                {
                    continue;
                }
                handlerId = handlerNode.getAttribute("ID");

                annotationToRemove = {
                    type: this.ReferenceType.HandlerFunction,
                    name: "ControlItemsCollection"
                };
                this.removeAnnotation(handlerNode, annotationToRemove);

                if (!this.hasValidationStatusError(handlerNode))
                {
                    //Remove handler annotation on event
                    annotationToRemove = {
                        type: this.ReferenceType.Handler,
                        guid: handlerId
                    };

                    this.removeAnnotation(eventNode, annotationToRemove);
                }
            }
        }
    },

    removeInvalidAnnotationForPanel: function (panelNode)
    {
        if (!checkExists(panelNode))
        {
            return;
        }

        if (!checkExistsNotEmpty(panelNode.getAttribute("ValidationMessages")))
        {
            return;
        }

        var i = 0;
        var annotationToRemove = {};
        var resourceSvc = SourceCode.Forms.Services.AnalyzerResourcesService();

        var messages = resourceSvc.parseValidationMessage(panelNode.getAttribute("ValidationMessages"));
        var msg;
        for (i = 0; i < messages.length; i++)
        {
            msg = messages[i];

            if (msg.type !== this.ReferenceType.Area)
            {
                continue;
            }

            var areaNodes = [];

            if (checkExistsNotEmpty(msg.guid))
            {
                var xpath = "Areas/Area[@ID='{0}']/Items/Item[@ValidationStatus]".format(msg.guid);
                areaNodes = panelNode.selectNodes(xpath);

                if (areaNodes.length === 0)
                {
                    annotationToRemove = {
                        type: this.ReferenceType.Area,
                        guid: msg.guid
                    };

                    this.removeAnnotation(panelNode, annotationToRemove);
                }
            }
        }
    },

    removeAllConditionalStylesAnnotationForControl: function (controlNode)
    {
        if (!checkExists(controlNode))
        {
            return;
        }

        var annotationToRemove = {
            type: this.ReferenceType.ConditionalStyle,
            all: true
        };

        this.removeAnnotation(controlNode, annotationToRemove);
    },

    removeInvalidStylesForControl: function (controlNode)
    {
        if (!checkExists(controlNode))
        {
            return;
        }

        var styleNodes = controlNode.selectNodes("ConditionalStyles/ConditionalStyle");

        if (!checkExists(styleNodes))
        {
            return;
        }

        var i = 0;
        var conditionalStyleId = '';
        var status = '';
        for (i = 0; i < styleNodes.length; i++)
        {
            status = styleNodes[i].getAttribute("ValidationStatus");

            if ("Error,Missing,Warning".indexOf(status) < 0)
            {
                continue;
            }

            conditionalStyleId = styleNodes[i].getAttribute("ID");

            if (!checkExistsNotEmpty(conditionalStyleId))
            {
                continue;
            }

            var annotationToRemove = {
                type: this.ReferenceType.ConditionalStyle,
                guid: conditionalStyleId
            };

            this.removeAnnotation(controlNode, annotationToRemove);

            styleNodes[i].parentNode.removeChild(styleNodes[i]);
        }

    },

    // Given the expression ID of a valid expression, this function finds all the conditional styles that are using this expression and 
    // removes the annotation pointing to this expression in the definition xml.  
    //
    // Return: An array of control IDs that have the conditional style annotation removed
    //
    removeConditionalStylesAnnotationPointingToExpression: function (xmlDefinition, expressionId)
    {
        var controlIds = [];
        if (!checkExists(xmlDefinition) || !checkExistsNotEmpty(expressionId))
        {
            return controlIds;
        }

        var exprNode = xmlDefinition.selectSingleNode(".//Expressions/Expression[@ID='{0}']".format(expressionId));

        if (!checkExists(exprNode) ||
            //Expr still has error thus no need to remove Conditional Style annotation pointing to this expression 
        this.hasValidationStatusError(exprNode))
        {
            return controlIds;
        }

        var styleItemNodes = xmlDefinition.selectNodes(
        ".//ConditionalStyles/ConditionalStyle//Item[@SourceType='Expression' and @SourceID='{0}']".format(expressionId));

        if (!checkExists(styleItemNodes) || styleItemNodes.length === 0)
        {
            //There are no styles that are using this expression
            return controlIds;
        }

        var i = 0;
        var itemNode = null;
        var annotationToRemove = {};
        for (i = 0; i < styleItemNodes.length; i++)
        {
            itemNode = styleItemNodes[i];

            if (!this.hasValidationStatusError(itemNode))
            {
                //No annotation to remove for this item
                continue;
            }

            annotationToRemove = {
                type: this.ReferenceType.ControlExpression,
                guid: expressionId
            };

            this.removeAnnotation(itemNode, annotationToRemove);
        }

        var styleNodes = xmlDefinition.selectNodes(".//ConditionalStyles/ConditionalStyle");
        var controlNode = null;
        var controlId = "";
        for (i = 0; i < styleNodes.length; i++)
        {
            styleItemNodes = styleNodes[i].selectNodes(".//Item[@ValidationStatus]");

            if (styleItemNodes.length > 0)
            {
                //There is still dependency errors for the conditional style
                continue;
            }

            //Conditional style has no more dependency errors thus we can remove the annotation for this style
            styleNodes[i].removeAttribute("ValidationStatus");
            styleNodes[i].removeAttribute("ValidationMessages");

            if (checkExists(styleNodes[i].parentNode) && checkExists(styleNodes[i].parentNode.parentNode))
            {
                controlNode = styleNodes[i].parentNode.parentNode;
                this.removeInvalidConditionalStylesAnnotationForControl(controlNode);

                controlId = controlNode.getAttribute("ID");

                if (controlIds.indexOf(controlId) < 0)
                {
                    controlIds.push(controlId);
                }
            }
        }

        return controlIds;
    },

    // Given the expression ID of a valid expression, this function finds all the expressions that are using this expression and 
    // removes the annotation pointing to this expression in the definition xml.  
    //
    // Return: An array of expression IDs that have the expression annotation removed
    //
    removeExpressionsAnnotationPointingToExpression: function (xmlDefinition, expressionId)
    {
        var exprIds = [];
        if (!checkExists(xmlDefinition) || !checkExistsNotEmpty(expressionId))
        {
            return exprIds;
        }

        var expressionsXmlDefinition = null;

        if (xmlDefinition.nodeName === "Expressions")
        {
            expressionsXmlDefinition = xmlDefinition;
        }
        else
        {
            expressionsXmlDefinition = xmlDefinition.selectSingleNode(".//Expressions");
        }

        if (!checkExists(expressionsXmlDefinition))
        {
            return exprIds;
        }

        var exprNode = expressionsXmlDefinition.selectSingleNode(".//Expression[@ID='{0}']".format(expressionId));

        if (!checkExists(exprNode) ||
            //Expr still has error thus no need to remove the expression annotation pointing to this expression 
        this.hasValidationStatusError(exprNode))
        {
            return exprIds;
        }

        var expressionItems = expressionsXmlDefinition.selectNodes(
            ".//Expression//Item[@SourceType='Expression' and @SourceID='{0}']".format(expressionId));

        if (!checkExists(expressionItems) || expressionItems.length === 0)
        {
            //There are no expressions that are using this expression
            return exprIds;
        }

        var i = 0;
        var itemNode = null;
        var annotationToRemove = {};
        for (i = 0; i < expressionItems.length; i++)
        {
            itemNode = expressionItems[i];

            if (!this.hasValidationStatusError(itemNode))
            {
                //No annotation to remove for this item
                continue;
            }

            annotationToRemove = {
                type: this.ReferenceType.ControlExpression,
                guid: expressionId
            };

            this.removeAnnotation(itemNode, annotationToRemove);
        }

        var exprNodes = expressionsXmlDefinition.selectNodes(".//Expression");

        for (i = 0; i < exprNodes.length; i++)
        {

            expressionItems = exprNodes[i].selectNodes(".//Item[@ValidationStatus]");

            if (expressionItems.length > 0)
            {
                //There are still dependency errors for the expression
                continue;
            }

            if (checkExists(exprNodes[i].getAttribute("ValidationStatus")))
            {
                //Expression has no more dependency errors thus we can remove the annotation for this expression
                exprNodes[i].removeAttribute("ValidationStatus");
                exprNodes[i].removeAttribute("ValidationMessages");

                exprIds.push(exprNodes[i].getAttribute("ID"));
            }
        }

        return exprIds;
    },

    findReferences: function (xmlDefinition, referenceObj)
    {
        var objCollection = [];
        referenceObj.items = objCollection;

        if (xmlDefinition !== null && referenceObj !== null)
        {
            switch (referenceObj.type)
            {
                case "Source":
                    this._getSourceDependencies(xmlDefinition, objCollection, referenceObj);
                    break;
                case "ControlField":
                    this._getControlFieldDependencies(xmlDefinition, objCollection, referenceObj);
                    break;
                case "Control":
                    this._getControlDependencies(xmlDefinition, objCollection, referenceObj);
                    break;
                case "ViewParameter":
                case "FormParameter":
                    this._getParameterDependencies(xmlDefinition, objCollection, referenceObj);
                    break;
                case "Expression":
                case "ControlExpression":  //For 2nd lvl reference, it could be a ControlExpression type
                    this._getExpressionDependencies(xmlDefinition, objCollection, referenceObj);
                    break;
                case "Event":
                    this._getEventDependencies(xmlDefinition, objCollection, referenceObj);
                    break;
                case "Action":
                    this._getActionDependencies(xmlDefinition, objCollection, referenceObj);
                    break;
                case "View":
                    this._getViewDependencies(xmlDefinition, objCollection, referenceObj);
                    break;
                case "Panel":
                    this._getPanelDependencies(xmlDefinition, objCollection, referenceObj);
                    break;
                case "AreaItem":
                    this._getAreaItemDependencies(xmlDefinition, objCollection, referenceObj);
                    break;
                case "ViewField":
                case "ObjectProperty":
                    this._getViewFieldDependencies(xmlDefinition, objCollection, referenceObj);
                    break;
                case "Table":
                    this._getTableDependencies(xmlDefinition, objCollection, referenceObj);
                    break;
                case "ValidationPattern":
                    this._getPatternDependencies(xmlDefinition, objCollection, referenceObj);
                    break;
                case "SmartPropertyDefinition":
                    this._getSOPropertyDependencies(xmlDefinition, objCollection, referenceObj);
                    break;
            }
        }

        return referenceObj;
    },

    _getAreaItemDependencies: function (xmlDefinition, objCollection, referenceObj)
    {
        var xPath = '';
        var xmlElements = null;

        // Views on areas
        xPath = "//Areas/Area/Items/Item[@ID='{0}'][@ViewID]".format(referenceObj.id);
        xmlElements = xmlDefinition.selectNodes(xPath);

        for (var e = 0; e < xmlElements.length; e++)
        {
            var xmlElement = xmlElements[e];
            var viewRefObj =
            {
                id: xmlElement.getAttribute("ID"),
                type: "View"
            };

            this._getViewDependencies(xmlDefinition, objCollection, viewRefObj);
        }
    },

    _getPanelDependencies: function (xmlDefinition, objCollection, referenceObj)
    {
        var xPath = '';
        var xmlElements = null;

        // Views on panels
        xPath = "//Panels/Panel[@ID='{0}']/Areas/Area/Items/Item[@ViewID]".format(referenceObj.id);
        xmlElements = xmlDefinition.selectNodes(xPath);

        for (var e = 0; e < xmlElements.length; e++)
        {
            var xmlElement = xmlElements[e];
            var viewRefObj =
            {
                id: xmlElement.getAttribute("ID"),
                type: "View"
            };

            this._getViewDependencies(xmlDefinition, objCollection, viewRefObj);
        }

        // Panel Events
        xPath = "//Events/Event[@Type='User' and @SourceID='{0}' and @SourceType='Control']".format(referenceObj.id);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createEventObjectReferences(xmlElements, objCollection, this.ReferenceAs.EventSource);

        // Panel action (set a controls properties, hide control, show control, enable/disable control)
        xPath = ".//Events/Event[@Type='User']/Handlers/Handler/Actions/Action[Properties/Property/Name='PanelID'][Properties/Property/Value='{0}']".format(referenceObj.id);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createActionObjectReferences(xmlElements, objCollection, this.ReferenceAs.ActionControl);
    },

    _getViewDependencies: function (xmlDefinition, objCollection, referenceObj)
    {
        var xPath = '';
        var xmlElements = null;
        //View Event must be of type user and not a purely inherited rule - must be extendend
        //Inherited view rules will have isReference attribute of True:
        //Events, actions or conditions defined on the form itself:
        var formDefinedQry = "(not(@IsInherited) or @IsInherited='False')"; // dont check IsReference as it can be inherited and then disabled.
        var formInheritedQry = "(@IsReference or @IsReference='True')";

        //Events that are not extended, were defined on form itself:
        xPath = "//Events/Event[@Type='User' and {0} and @InstanceID='{1}']".format(formDefinedQry, referenceObj.id);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createEventObjectReferences(xmlElements, objCollection, this.ReferenceAs.EventSource);

        //Events that are extended:
        xPath = "//Events/Event[@Type='User'and {0} and @InstanceID='{1}'][.//Action[{2}]]".format(formInheritedQry, referenceObj.id, formDefinedQry);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createEventObjectReferences(xmlElements, objCollection, this.ReferenceAs.EventSource);

        //Actions that belong to an extended event or form defined event, but were defined on form itself
        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action[@InstanceID='{0}'][Properties/Property[Name='ObjectID']][{1}]";
        xPath = xPath.format(referenceObj.id, formDefinedQry);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createActionObjectReferences(xmlElements, objCollection, this.ReferenceAs.ActionObject);

        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action[@InstanceID='{0}'][not(Properties/Property[Name='Method'])]" +
        "[not(Properties/Property[Name='ControlID'])][Properties/Property[Name='ViewID']][{1}]";
        xPath = xPath.format(referenceObj.id, formDefinedQry);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createActionObjectReferences(xmlElements, objCollection, this.ReferenceAs.ActionObject);

        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action[@InstanceID='{0}']" +
        "[not(Properties/Property[Name='ObjectID'])][Properties/Property[Name='Method']][{1}]";
        xPath = xPath.format(referenceObj.id, formDefinedQry);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createActionObjectReferences(xmlElements, objCollection, this.ReferenceAs.ActionMethod);

        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action[(@InstanceID='{0}')][Properties/Property[Name='ControlID']][{1}]";
        xPath = xPath.format(referenceObj.id, formDefinedQry);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createActionObjectReferences(xmlElements, objCollection, this.ReferenceAs.ActionControl);

        //Parameter mappings to view objects that belongs to an extended event or form defined event, but were defined on form itself
        // Parameters mappings source
        var xPathViewPropertySource = "@SourceID='Sources' and (.//Source[@SourcePath='{0}' and @SourceType='ControlProperty'])".format(referenceObj.id);
        var xPathViewPropertyParam = "@SourcePath='{0}' and @SourceType='ControlProperty'".format(referenceObj.id);
        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action[{0}]/Parameters/Parameter[(@SourceInstanceID='{1}') or ({2}) or ({3})]"
        .format(formDefinedQry, referenceObj.id, xPathViewPropertySource, xPathViewPropertyParam);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createParameterObjectReferences(xmlElements, objCollection, this.ReferenceAs.ParameterMappingSource);

        // Parameters mappings target
        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action[{0}]/Parameters/Parameter[@TargetInstanceID='{1}' or @TargetPath='{1}']"
        .format(formDefinedQry, referenceObj.id);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createParameterObjectReferences(xmlElements, objCollection, this.ReferenceAs.ParameterMappingTarget);

        // Result mappings target
        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action[{0}]/Results/Result[(@TargetInstanceID='{1}')]"
        .format(formDefinedQry, referenceObj.id);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createResultObjectReferences(xmlElements, objCollection, this.ReferenceAs.ResultMappingTarget);

        // Result mappings source
        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action[{0}]/Results/Result[(@SourceInstanceID='{1}')]"
        .format(formDefinedQry, referenceObj.id);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createResultObjectReferences(xmlElements, objCollection, this.ReferenceAs.ResultMappingSource);

        // Parameters mappings sourcevalue
        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action[{0}]/Parameters/Parameter[@SourceType='Value' and @SourceID='Sources']/SourceValue/Source[@SourceInstanceID='{1}']"
        .format(formDefinedQry, referenceObj.id);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createParameterSourceValueObjectReferences(xmlElements, objCollection, this.ReferenceAs.SourceMapping);

        //View objects used by filters
        this._createFiltersObjectReference(xmlDefinition, objCollection, referenceObj);

        //View objects used by SubForm action (set up a rule like: When Button is Clicked and Open "SubView" as a subview)
        this._createSubFormPopupActionsObjectReference(xmlDefinition, objCollection, referenceObj);

        //For each handlers, Conditions
        xPath = ".//Events/Event[@Type='User']//Condition[{0}]//Item[@SourceInstanceID='{1}' or @SourcePath='{1}'] | " +
        ".//Events/Event[@Type='User']//Handler[{0}]//Function[@InstanceID='{1}']//Item[@SourceType='View']";
        xPath = xPath.format(formDefinedQry, referenceObj.id);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createSourceItemObjectReferences(xmlElements, objCollection, this.ReferenceAs.PropertyExpressionSource);

        //Expressions:
        xPath = ".//Expressions/Expression//Item[@SourceInstanceID='{0}']".format(referenceObj.id);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createSourceItemObjectReferences(xmlElements, objCollection, this.ReferenceAs.PropertyExpressionSource);

        //Conditional styles:
        xPath = ".//Control/ConditionalStyles/ConditionalStyle/Condition//Item[@SourceInstanceID='{0}']".format(referenceObj.id);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createSourceItemObjectReferences(xmlElements, objCollection, this.ReferenceAs.PropertyExpressionSource);
    },

    _getEventDependencies: function (xmlDefinition, objCollection, referenceObj)
    {
        var xPath = ".//Events/Event[@Type='User']/Handlers/Handler/Actions/Action[Properties/Property[Name='EventID' and Value='{0}']]".format(referenceObj.definitionId);

        if (checkExists(referenceObj.instanceId))
        {
            xPath = ".//Events/Event[@Type='User']/Handlers/Handler/Actions/Action[@InstanceID='{0}'][Properties/Property[Name='EventID' and Value='{1}']]".format(referenceObj.instanceId, referenceObj.definitionId);
        }

        var xmlElements = xmlDefinition.selectNodes(xPath);
        this._createActionObjectReferences(xmlElements, objCollection, this.ReferenceAs.ActionRule);

        //Does event being deleted have open subform/subview action?
        xPath = ".//Events/Event[@Type='User'][@DefinitionID='{0}']//Action[@Type='Popup' or @Type='Open'][@SubFormID]".format(referenceObj.definitionId);

        var openSubFormNode = xmlDefinition.selectSingleNode(xPath);

        if (checkExists(openSubFormNode))
        {
            var openSubFormActionId = openSubFormNode.getAttribute("ID");
            var subFormId = openSubFormNode.getAttribute("SubFormID");
            this._getSubFormReferences(xmlDefinition, objCollection, openSubFormActionId, subFormId);
        }
    },

    _getActionDependencies: function (xmlDefinition, objCollection, referenceObj)
    {
        var xPath = ".//Events/Event[@Type='User']//Action[@Type='Popup' or @Type='Open'][@SubFormID][@ID='{0}']".format(referenceObj.id);
        var openSubFormNode = xmlDefinition.selectSingleNode(xPath);

        //Does action being deleted open a subform/subview?
        if (checkExists(openSubFormNode))
        {
            var openSubFormActionId = openSubFormNode.getAttribute("ID");
            var subFormId = openSubFormNode.getAttribute("SubFormID");
            this._getSubFormReferences(xmlDefinition, objCollection, openSubFormActionId, subFormId);
        }
    },

    _getSubFormReferences: function (xmlDefinition, objCollection, openSubFormActionId, subFormId)
    {
        var extendedQry = "(not(@IsReference) or @IsReference='False')";

        //Are there events referencing subform that have extended actions?
        var xPathExtSubFormActions = ".//Events/Event[@Type='User'][@SubFormID='{0}']//Action[{1}] | " +
        ".//Events/Event[@Type='User'][not(@SubFormID)]//Action[{1}][@SubFormID='{0}'][not(@ID = '{2}')]";

        xPath = xPathExtSubFormActions.format(subFormId, extendedQry, openSubFormActionId);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createActionObjectReferences(xmlElements, objCollection, this.ReferenceAs.ActionRuleSubForm);

        //Are there actions referencing subform that have extended action with parameter target or source mappings pointing to subform objects?

        //Parameter mappings to subview/form objects that belongs to an extended event or form defined event, but were defined on form itself
        // Parameters mappings source
        var xPathSubFormParamSource = ".//Events/Event[@Type='User'][@SubFormID='{0}']//Action[{1}]/Parameters/Parameter[(@SourceSubFormID='{0}')] | " +
        ".//Events/Event[@Type='User'][not(@SubFormID)]//Action[{1}][@SubFormID='{0}']/Parameters/Parameter[(@SourceSubFormID='{0}')]";

        xPath = xPathSubFormParamSource.format(subFormId, extendedQry);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createParameterObjectReferences(xmlElements, objCollection, this.ReferenceAs.ParameterMappingSourceSubForm);

        // Parameters mappings target
        var xPathSubFormParamTarget = ".//Events/Event[@Type='User'][@SubFormID='{0}']//Action[{1}]/Parameters/Parameter[(@TargetSubFormID='{0}')] | " +
        ".//Events/Event[@Type='User'][not(@SubFormID)]//Action[{1}][@SubFormID='{0}']/Parameters/Parameter[(@TargetSubFormID='{0}')]";

        xPath = xPathSubFormParamTarget.format(subFormId, extendedQry);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createParameterObjectReferences(xmlElements, objCollection, this.ReferenceAs.ParameterMappingTargetSubForm);

        // Result mappings target
        var xPathResultTarget = ".//Events/Event[@Type='User'][@SubFormID='{0}']//Action[{1}]/Results/Result[(@TargetSubFormID='{0}')] | " +
        ".//Events/Event[@Type='User'][not(@SubFormID)]//Action[{1}][@SubFormID='{0}']/Results/Result[(@TargetSubFormID='{0}')]";
        xPath = xPathResultTarget.format(subFormId, extendedQry);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createResultObjectReferences(xmlElements, objCollection, this.ReferenceAs.ResultMappingTargetSubForm);

        // Result mappings source
        var xPathResultSource = ".//Events/Event[@Type='User'][@SubFormID='{0}']//Action[{1}]/Results/Result[(@SourceSubFormID='{0}')] | " +
        ".//Events/Event[@Type='User'][not(@SubFormID)]//Action[{1}][@SubFormID='{0}']/Results/Result[(@SourceSubFormID='{0}')]";
        xPath = xPathResultSource.format(subFormId, extendedQry);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createResultObjectReferences(xmlElements, objCollection, this.ReferenceAs.ResultMappingSourceSubForm);

        //Are there events referencing subform that have extended conditions?
        var xPathExtSubFormConditions = ".//Events/Event[@Type='User'][@SubFormID='{0}']//Condition[{1}][@SubFormID='{0}']//Item[@SourceSubFormID='{0}'] | " +
        ".//Events/Event[@Type='User'][not(@SubFormID)]//Condition[{1}][@SubFormID='{0}']//Item[@SourceSubFormID='{0}']";
        xPath = xPathExtSubFormConditions.format(subFormId, extendedQry);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createSourceItemObjectReferences(xmlElements, objCollection, this.ReferenceAs.PropertyExpressionSourceSubForm);

        //Are there events referencing subform that have extended functions (for-each)?
        var xPathExtSubFormFunctions = ".//Events/Event[@Type='User'][@SubFormID='{0}']//Handler[{1}]//Function[@SubFormID='{0}']//Item[@SourceType='View'] | " +
        ".//Events/Event[@Type='User'][not(@SubFormID)]//Handler[{1}]//Function[@SubFormID='{0}']//Item[@SourceType='View']";
        xPath = xPathExtSubFormFunctions.format(subFormId, extendedQry);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createSourceItemObjectReferences(xmlElements, objCollection, this.ReferenceAs.PropertyExpressionSourceSubForm);
    },

    _getExpressionDependencies: function (xmlDefinition, objCollection, referenceObj)
    {
        var xPath = '';
        var xmlElements = null;

        // Expression used by control
        xPath = "//Controls/Control/Properties/Property[Name='ControlExpression'][Value='{0}']".format(referenceObj.id);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createControlPropertyObjectReferences(xmlElements, objCollection, this.ReferenceAs.ControlPropertyExpression);

        // Parameters mappings source
        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action/Parameters/Parameter[(@SourceID='{0}')]".format(referenceObj.id);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createParameterObjectReferences(xmlElements, objCollection, this.ReferenceAs.ParameterMappingSource);

        // Parameters mappings target
        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action/Parameters/Parameter[(@TargetID='{0}')]".format(referenceObj.id);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createParameterObjectReferences(xmlElements, objCollection, this.ReferenceAs.ParameterMappingTarget);

        // Parameters mappings on Control Expression target (This can be created by "set up a control property" rule action and assign an expression.  Refer to bug 669283 for more details)
        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action/Parameters/Parameter[@SourceType='Value' and @SourceID='Sources' and @TargetID='ControlExpression' and SourceValue='{0}']".format(referenceObj.id);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createParameterObjectReferences(xmlElements, objCollection, this.ReferenceAs.ParameterMappingTarget);

        // Result mappings target
        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action/Results/Result[(@TargetID='{0}')]".format(referenceObj.id);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createResultObjectReferences(xmlElements, objCollection, this.ReferenceAs.ResultMappingTarget);

        // Result mappings source
        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action/Results/Result[(@SourceID='{0}')]".format(referenceObj.id);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createResultObjectReferences(xmlElements, objCollection, this.ReferenceAs.ResultMappingSource);

        // Parameters mappings sourcevalue
        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action/Parameters/Parameter[@SourceType='Value' and @SourceID='Sources']/SourceValue/Source[@SourceID='{0}']".format(referenceObj.id);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createParameterSourceValueObjectReferences(xmlElements, objCollection, this.ReferenceAs.PropertyExpressionSource);

        //Expressions, Conditions, Conditional styles, Actions
        xPath = "//Item[@SourceID='{0}'] | //Item[@SourceType='ControlProperty'][@SourcePath='{0}'] | //ControlItemsCollection/Item[text()='{0}']".format(referenceObj.id);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createSourceItemObjectReferences(xmlElements, objCollection, this.ReferenceAs.PropertyExpressionSource);

        //Expressions used by filters
        this._createFiltersObjectReference(xmlDefinition, objCollection, referenceObj);

        //Expressions used in Condition Properties
        this._createConditionPropertiesObjectReference(xmlDefinition, objCollection, referenceObj);

        //Expressions used by SubForm action (set up a rule like: When Button is Clicked and Open "SubView" as a subview)
        this._createSubFormPopupActionsObjectReference(xmlDefinition, objCollection, referenceObj);
    },

    _getParameterDependencies: function (xmlDefinition, objCollection, referenceObj)
    {
        var xPath = '';
        var parameterQuery = '';
        var xmlElements = null;

        // ViewParamter/FormParameter Event
        if (checkExists(referenceObj.subFormId))
        {
            parameterQuery = "@SourceType='{0}' and @SourceName='{1}' and @SubFormID='{2}'".format(referenceObj.type, referenceObj.name, referenceObj.subFormId);
        }
        else
        {
            parameterQuery = "@SourceType='{0}' and @SourceName='{1}' and not(@SubFormID)".format(referenceObj.type, referenceObj.name);
        }
        xPath = "//Events/Event[@Type='User'][{0}]".format(parameterQuery);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createEventObjectReferences(xmlElements, objCollection, this.ReferenceAs.EventSource);

        // Parameters mappings source
        if (checkExists(referenceObj.subFormId))
        {
            parameterQuery = "@SourceID='{0}' and @SourceType='{1}' and @SourceSubFormID='{2}'".format(referenceObj.name, referenceObj.type, referenceObj.subFormId);
        }
        else
        {
            parameterQuery = "@SourceID='{0}' and @SourceType='{1}' and not(@SourceSubFormID)".format(referenceObj.name, referenceObj.type);
        }
        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action/Parameters/Parameter[{0}]".format(parameterQuery);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createParameterObjectReferences(xmlElements, objCollection, this.ReferenceAs.ParameterMappingSource);

        // Parameters mappings target
        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action/Parameters/Parameter[@TargetID='{0}' and @TargetType='{1}']".format(referenceObj.name, referenceObj.type);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createParameterObjectReferences(xmlElements, objCollection, this.ReferenceAs.ParameterMappingTarget);

        // Result mappings target
        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action/Results/Result[@TargetID='{0}' and @TargetType='{1}']".format(referenceObj.name, referenceObj.type);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createResultObjectReferences(xmlElements, objCollection, this.ReferenceAs.ResultMappingTarget);

        // Result mappings source
        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action/Results/Result[(@SourceID='{0}' and @SourceType='{1}')]".format(referenceObj.name, referenceObj.type);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createResultObjectReferences(xmlElements, objCollection, this.ReferenceAs.ResultMappingSource);

        // Parameters mappings sourcevalue
        var sourceValXPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action/Parameters/Parameter[@SourceType='Value' and @SourceID='Sources']/SourceValue/Source[@SourceID='{0}' and @SourceType='{1}']";
        xPath = "{0} | {1}".format(sourceValXPath.format(referenceObj.id, referenceObj.type), sourceValXPath.format(referenceObj.name, referenceObj.type));
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createParameterSourceValueObjectReferences(xmlElements, objCollection, this.ReferenceAs.SourceMapping);

        //Expressions, Conditions, Conditional styles, Actions
        xPath = "//Item[@SourceType='{1}'][@SourceName='{0}'] | //ControlItemsCollection/Item[text()='{0}'] | //Item[@SourceType='{1}'][@SourceID='{0}']".format(referenceObj.name, referenceObj.type);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createSourceItemObjectReferences(xmlElements, objCollection, this.ReferenceAs.PropertyExpressionSource);

        //Parameters used by filters
        this._createFiltersObjectReference(xmlDefinition, objCollection, referenceObj);

        //Parameters used in ConditionProperties
        this._createConditionPropertiesObjectReference(xmlDefinition, objCollection, referenceObj);

        //Parameters used by SubForm action (set up a rule like: When Button is Clicked and Open "SubView" as a subview)
        this._createSubFormPopupActionsObjectReference(xmlDefinition, objCollection, referenceObj);
    },

    _getSourceDependencies: function (xmlDefinition, objCollection, referenceObj)
    {
        var xPath = '';
        var xmlElements = null;

        var refObj =
        {
            id: referenceObj.id,
            controlId: referenceObj.contextId, //If for primary source, controlId won't be definied
            type: this.ReferenceType.Source
        };

        //Event must be of type user and not an inherited rule
        var evtTypeQry = "@Type='User' and (not(@IsReference) or @IsReference='False')";

        if (checkExistsNotEmpty(refObj.controlId))
        {
            //These are dependencies for associated source

            // Look for dependencies in event actions
            xPath = "//Events/Event[{0}]/Handlers/Handler/Actions/Action" +
            "[Properties/Property[Name='ObjectID'][Value='{1}']]" +
            "[Properties/Property[Name='ControlID'][Value='{2}']]" +
            "[@Type='Transfer' or @Type='ExecuteControl' or @Type='Execute' or @Type='PopulateControl']";

            xmlElements = xmlDefinition.selectNodes(xPath.format(evtTypeQry, refObj.id, refObj.controlId));
            this._createActionObjectReferences(xmlElements, objCollection, this.ReferenceAs.ActionControl);

            // Result mappings target
            xPath = "//Events/Event[{0}]/Handlers/Handler/Actions/Action/Results/Result[@TargetID='{1}' and @SourceID='{2}']".format(evtTypeQry, refObj.id, refObj.controlId);
            xmlElements = xmlDefinition.selectNodes(xPath);
            this._createResultObjectReferences(xmlElements, objCollection, this.ReferenceAs.ResultMappingTarget);

            // Result mappings source
            xPath = "//Events/Event[{0}]/Handlers/Handler/Actions/Action/Results/Result[@SourceID='{1}' and @TargetID='{2}']".format(evtTypeQry, refObj.id, refObj.controlId);
            xmlElements = xmlDefinition.selectNodes(xPath);
            this._createResultObjectReferences(xmlElements, objCollection, this.ReferenceAs.ResultMappingSource);
        }
        else
        {
            //These are dependencies for primary source
            xPath = "//Events/Event[{0}]/Handlers/Handler/Actions/Action[@Type='Execute']".format(evtTypeQry) +
            "[not(Properties/Property[Name='ControlID']) and Properties/Property[Name='ViewID']]/Properties/Property[Name='Method']";

            //Action Method property
            xmlElements = xmlDefinition.selectNodes(xPath);
            this._createActionPropertyObjectReferences(xmlElements, objCollection, this.ReferenceAs.ActionMethod);
        }
    },

    _getControlFieldDependencies: function (xmlDefinition, objCollection, referenceObj)
    {
        var xPath = '';
        var xmlElements = null;

        //Parameters mappings - multiple sources
        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action/Parameters/Parameter[@SourceType='Value' and @SourceID='Sources']/SourceValue/Source[@SourceType='{0}' and @SourcePath='{1}']"
        .format(referenceObj.type, referenceObj.id);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createParameterSourceValueObjectReferences(xmlElements, objCollection, this.ReferenceAs.SourceMapping);

        //Parameters mappings - single source
        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action/Parameters/Parameter[@SourceType='{0}' and @SourcePath='{1}']"
        .format(referenceObj.type, referenceObj.id);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createParameterObjectReferences(xmlElements, objCollection, this.ReferenceAs.ParameterMappingSource);

        //Mappings in Expressions, Conditions, Conditional styles
        xPath = "//Item[@SourceType='{0}'][@SourcePath='{1}']".format(referenceObj.type, referenceObj.id);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createSourceItemObjectReferences(xmlElements, objCollection, this.ReferenceAs.PropertyExpressionSource);

        //Mappings used by filters
        this._createFiltersObjectReference(xmlDefinition, objCollection, referenceObj);

        //Mappings used by ConditionProperties
        this._createConditionPropertiesObjectReference(xmlDefinition, objCollection, referenceObj);

        //Mappings used by SubForm action (set up a rule like: When Button is Clicked and Open "SubView" as a subview)
        this._createSubFormPopupActionsObjectReference(xmlDefinition, objCollection, referenceObj);
    },

    _getControlDependencies: function (xmlDefinition, objCollection, referenceObj)
    {
        var xPath = '';
        var xmlElements = null;

        var controlRefObj =
        {
            id: referenceObj.id,
            type: "Control"
        };

        // Control being used as a event source
        xPath = "//Events/Event[@Type='User' and @SourceID='{0}' and @SourceType='{1}']".format(controlRefObj.id, controlRefObj.type);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createEventObjectReferences(xmlElements, objCollection, this.ReferenceAs.EventSource);

        // Control action (set a controls properties, hide control, show control, enable/disable control)
        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action[(Properties/Property[Name='ControlID'][Value='{0}']) and (@Type='Transfer')]".format(controlRefObj.id);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createActionObjectReferences(xmlElements, objCollection, this.ReferenceAs.ActionControl);

        // Control action (execute a controls method)
        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action[(Properties/Property[Name='ControlID'][Value='{0}']) and (@Type='ExecuteControl')]".format(controlRefObj.id);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createActionObjectReferences(xmlElements, objCollection, this.ReferenceAs.ActionControl);

        // Control action (ViewControlMethodExecuteItemsState, ListControlPopulation, ListControlPreLoadData)
        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action[(Properties/Property[Name='ControlID'][Value='{0}']) and (@Type='Execute')]".format(controlRefObj.id);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createActionObjectReferences(xmlElements, objCollection, this.ReferenceAs.ActionControl);

        // Control action (ListControlPopulateFromData)
        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action[(Properties/Property[Name='ControlID'][Value='{0}']) and (@Type='PopulateControl')]".format(controlRefObj.id);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createActionObjectReferences(xmlElements, objCollection, this.ReferenceAs.ActionControl);

        // Parameters mappings source
        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action/Parameters/Parameter[(@SourceID='{0}' and @SourceType='{1}') or (@SourceType='ControlProperty' and @SourcePath='{0}')]".format(controlRefObj.id, controlRefObj.type);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createParameterObjectReferences(xmlElements, objCollection, this.ReferenceAs.ParameterMappingSource);

        // Parameters mappings source value
        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action/Parameters/Parameter[@SourceType='Value' and @SourceID='Sources']/SourceValue/Source[@SourceID='{0}' and @SourceType='{1}']".format(controlRefObj.id, controlRefObj.type);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createParameterSourceValueObjectReferences(xmlElements, objCollection, this.ReferenceAs.SourceMapping);

        // Parameters mappings target
        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action/Parameters/Parameter[@TargetID='{0}' and @TargetType='{1}']".format(controlRefObj.id, controlRefObj.type);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createParameterObjectReferences(xmlElements, objCollection, this.ReferenceAs.ParameterMappingTarget);

        // Dependencies when the Control's properties are set (e.g. Rule Designer > Actions > Control Interaction > Set a control's properties)
        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action/Parameters/Parameter[@SourceID='Sources' and @TargetType='ControlProperty' and @TargetPath='{0}']".format(controlRefObj.id);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createParameterObjectReferences(xmlElements, objCollection, this.ReferenceAs.ParameterMappingTarget);

        // Result mappings target
        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action/Results/Result[@TargetID='{0}' and @TargetType='{1}']".format(controlRefObj.id, controlRefObj.type);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createResultObjectReferences(xmlElements, objCollection, this.ReferenceAs.ResultMappingTarget);

        // Result mappings source
        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action/Results/Result[@SourceID='{0}' and @SourceType='{1}']".format(controlRefObj.id, controlRefObj.type);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createResultObjectReferences(xmlElements, objCollection, this.ReferenceAs.ResultMappingSource);

        //Expressions, Conditions, Conditional styles, Actions
        xPath = "//Item[@SourceType='{1}'][@SourceID='{0}']{2} | //Item[@SourceType='ControlProperty'][@SourcePath='{0}']{2} | //ControlItemsCollection/Item[text()='{0}']{2} | //Parameters/Parameter/SourceValue/Source[@SourcePath='{0}' and @SourceType='ControlProperty']{2}".format(controlRefObj.id, controlRefObj.type, "[not(ancestor::Event[@Type='System'])]");
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createSourceItemObjectReferences(xmlElements, objCollection, this.ReferenceAs.PropertyExpressionSource);

        //Controls used by filters
        this._createFiltersObjectReference(xmlDefinition, objCollection, referenceObj);

        //Controls used by ConditionProperties
        this._createConditionPropertiesObjectReference(xmlDefinition, objCollection, referenceObj);

        //Controls used by SubForm action (set up a rule like: When Button is Clicked and Open "SubView" as a subview)
        this._createSubFormPopupActionsObjectReference(xmlDefinition, objCollection, referenceObj);

        //Controls used in validation group:
        xPath = "//ValidationGroups/ValidationGroup/ValidationGroupControls/ValidationGroupControl[@ControlID='{0}']".format(controlRefObj.id);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createValidationGroupReferences(xmlElements, objCollection, this.ReferenceAs.ValidationGroupControlControl);

        //Controls used as ParentControl property of another control it also has a ParentJoin Property:
        xPath = "//Controls/Control/Properties/Property[Name='ParentControl'][Value='{0}']".format(referenceObj.id);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createControlPropertyObjectReferences(xmlElements, objCollection, this.ReferenceAs.PropertyParentControl);

        xPath = "//Controls/Control/Properties[Property/Name='ParentControl'and Property/Value='{0}']/Property[Name='ParentJoinProperty']".format(referenceObj.id);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createControlPropertyObjectReferences(xmlElements, objCollection, this.ReferenceAs.PropertyParentJoinProperty);
    },

    _getViewFieldDependencies: function (xmlDefinition, objCollection, referenceObj)
    {
        var xPath = '';
        var xmlElements = null;

        // ViewFields used by control
        xPath = "//Controls/Control/Properties/Property[Name='Field' or  Name='DisplayField'][Value='{0}']".format(referenceObj.id);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createControlPropertyObjectReferences(xmlElements, objCollection, this.ReferenceAs.ControlField);

        if (checkExists(referenceObj.contextId))
        {
            // Bug 688522: View Field that is referenced in the Control's ValueProperty
            xPath = "//Controls/Control[@ID='{0}']/Properties/Property[Name='ValueProperty' and Value='{1}']".format(referenceObj.contextId, referenceObj.name);
            xmlElements = xmlDefinition.selectNodes(xPath);
            this._createControlPropertyObjectReferences(xmlElements, objCollection, this.ReferenceAs.PropertyValueProperty);
        }

        // Parameters mappings source
        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action/Parameters/Parameter[(@SourceID='{0}' and @SourceType='{1}') or (@SourceType='ControlProperty' and @SourcePath='{0}')]".format(referenceObj.id, referenceObj.type);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createParameterObjectReferences(xmlElements, objCollection, this.ReferenceAs.ParameterMappingSource);

        // Parameters mappings sourcevalue
        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action/Parameters/Parameter[@SourceType='Value' and @SourceID='Sources']/SourceValue/Source[@SourceID='{0}' and @SourceType='{1}']".format(referenceObj.id, referenceObj.type);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createParameterSourceValueObjectReferences(xmlElements, objCollection, this.ReferenceAs.SourceMapping);

        // Result mappings target
        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action/Results/Result[@TargetID='{0}' and @TargetType='{1}']".format(referenceObj.id, referenceObj.type);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createResultObjectReferences(xmlElements, objCollection, this.ReferenceAs.ResultMappingTarget);

        var xPathPrefix;

        if (!checkExists(referenceObj.contextId) || referenceObj.contextId === referenceObj.sourceId)
        {
            //For Primary Source, contextId won't be defined or is the same as the source Id
            xPathPrefix = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action[@Type='Execute'][Properties/Property[Name='Method'] and Properties/Property[Name='ViewID'] and not(Properties/Property[Name='ControlID'])]";
        }
        else
        {
            //For External Source, contextId is the control Id that the data source bound to
            xPathPrefix = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action[Properties/Property[Name='ObjectID' and Value='{0}'] and Properties/Property[Name='ControlID' and Value='{1}']]".format(referenceObj.sourceId, referenceObj.contextId);
        }

        // Parameters mappings target
        xPath = xPathPrefix + "/Parameters/Parameter[@TargetID='{0}' and @TargetType='ObjectProperty']".format(referenceObj.name);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createParameterObjectReferences(xmlElements, objCollection, this.ReferenceAs.ParameterMappingTarget);

        // Result mappings source
        xPath = xPathPrefix + "/Results/Result[@SourceID='{0}' and @SourceType='ObjectProperty']".format(referenceObj.name);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createResultObjectReferences(xmlElements, objCollection, this.ReferenceAs.ResultMappingSource);

        //Expressions, Conditions, Conditional styles, Actions
        xPath = "//Item[@SourceType='{1}'][@SourceID='{0}'] | //Item[@SourceType='ControlProperty'][@SourcePath='{0}'] | //ControlItemsCollection/Item[text()='{0}'] | //Parameters/Parameter/SourceValue/Source[@SourcePath='{0}' and @SourceType='ControlProperty']".format(referenceObj.id, referenceObj.type);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createSourceItemObjectReferences(xmlElements, objCollection, this.ReferenceAs.PropertyExpressionSource);

        //ViewFields used by filters
        this._createFiltersObjectReference(xmlDefinition, objCollection, referenceObj);

        //ViewFields used by ConditionProperties
        this._createConditionPropertiesObjectReference(xmlDefinition, objCollection, referenceObj);

        //ViewFields used by SubForm action (set up a rule like: When Button is Clicked and Open "SubView" as a subview)
        this._createSubFormPopupActionsObjectReference(xmlDefinition, objCollection, referenceObj);
    },

    _getTableDependencies: function (xmlDefinition, objCollection, referenceObj)
    {
        //Table's control properties are the only way a table control can be used as a dependency

        var xPath = '';
        var xmlElements = null;

        var controlRefObj =
        {
            id: referenceObj.id,
            type: "Control"
        };

        // Control action (set a controls properties, hide control, show control, enable/disable control)
        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action[(Properties/Property[Name='ControlID'][Value='{0}']) and (@Type='Transfer')]".format(controlRefObj.id);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createActionObjectReferences(xmlElements, objCollection, this.ReferenceAs.ActionControl);

        // Parameters mappings source
        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action/Parameters/Parameter[(@SourceID='{0}' and @SourceType='{1}') or (@SourceType='ControlProperty' and @SourcePath='{0}')]".format(controlRefObj.id, controlRefObj.type);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createParameterObjectReferences(xmlElements, objCollection, this.ReferenceAs.ParameterMappingSource);

        // Dependencies when the Table control's properties are set (e.g. Rule Designer > Actions > Control Interaction > Set a control's properties)
        xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action/Parameters/Parameter[@SourceID='Sources' and @TargetType='ControlProperty' and @TargetPath='{0}']".format(controlRefObj.id);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createParameterObjectReferences(xmlElements, objCollection, this.ReferenceAs.ParameterMappingTarget);

        //Expressions, Conditions, Conditional styles, Actions
        xPath = "//Item[@SourceType='{1}'][@SourceID='{0}'] | //Item[@SourceType='ControlProperty'][@SourcePath='{0}'] | //ControlItemsCollection/Item[text()='{0}'] | //Parameters/Parameter/SourceValue/Source[@SourcePath='{0}' and @SourceType='ControlProperty']".format(controlRefObj.id, controlRefObj.type);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createSourceItemObjectReferences(xmlElements, objCollection, this.ReferenceAs.PropertyExpressionSource);

    },

    _getPatternDependencies: function (xmlDefinition, objCollection, referenceObj)
    {
        var xPath = '';
        var xmlElements = null;

        // Patterns used by control
        xPath = "//Controls/Control/Properties/Property[Name='ValidationPattern'][Value='{0}']".format(referenceObj.id);
        xmlElements = xmlDefinition.selectNodes(xPath);
        this._createControlPropertyObjectReferences(xmlElements, objCollection, this.ReferenceAs.ValidationPattern);
    },

    _getSOPropertyDependencies: function (xmlDefinition, objCollection, referenceObj)
    {
        //Associations using property:
        var xPath = ".//Assocs/Assoc/Props/Prop[Map='{0}']".format(referenceObj.name);
        var xmlElements = xmlDefinition.selectNodes(xPath);
        this._createSOPropertyAssociationObjectReferences(xmlElements, objCollection, this.ReferenceAs.PropertyAssociationObject);
    },

    _createReferenceItem: function (objArray, refAs)
    {
        var refObj = {
            referenceAs: refAs
        };

        objArray.push(refObj);

        return refObj;
    },

    _createControlPropertyObjectReferences: function (xmlElements, obj, asRef)
    {
        for (var e = 0; e < xmlElements.length; e++)
        {
            this._createControlPropertyObjectReference(xmlElements[e], obj, asRef);
        }
    },

    _createControlPropertyObjectReference: function (xmlElement, obj, asRef)
    {
        if (asRef)
        {
            obj = this._createReferenceItem(obj, asRef);
        }

        var obj = this._createObjectFromXml({
            xmlElement: xmlElement,
            objItem: obj,
            idXpath: "Value",
            nameXpath: "Name",
            displayNameXpath: "DisplayValue",
            referenceType: this.ReferenceType.ControlProperty,
            asRef: asRef
        });

        var controlElement = xmlElement.selectSingleNode("./ancestor::Control");
        this._createControlObjectReference(controlElement, obj);
    },

    _createSOPropertyAssociationObjectReferences: function (xmlElements, obj, asRef)
    {
        for (var e = 0; e < xmlElements.length; e++)
        {
            this._createSOPropertyAssociationObjectReference(xmlElements[e], obj, asRef);
        }
    },

    _createSOPropertyAssociationObjectReference: function (xmlElement, obj, asRef)
    {
        if (asRef)
        {
            obj = this._createReferenceItem(obj, asRef);
        }

        var obj = this._createObjectFromXml({
            xmlElement: xmlElement,
            objItem: obj,
            nameXpath: "Name",
            displayNameXpath: "Dispname",
            referenceType: this.ReferenceType.ObjectDefinitionAssociationProperty,
            asRef: asRef
        });

        var smartObjectAssociationElement = xmlElement.selectSingleNode("./ancestor::Assoc");
        this._createSOAssociationReference(smartObjectAssociationElement, obj);
    },

    _createSOAssociationReference: function (xmlElement, obj, asRef)
    {
        if (asRef)
        {
            obj = this._createReferenceItem(obj, asRef);
        }

        var obj = this._createObjectFromXml({
            xmlElement: xmlElement,
            objItem: obj,
            nameXpath: "@name",
            displayNameXpath: "Dispname",
            referenceType: this.ReferenceType.ObjectDefinitionAssociation,
            asRef: asRef
        });

        var smartObjectElement = xmlElement.selectSingleNode("./ancestor::SmartObject");
        this._createSmartObjectReference(smartObjectElement, obj);
    },

    _createSmartObjectReference: function (xmlElement, objCollection)
    {
        var obj = this._createObjectFromXml({
            xmlElement: xmlElement,
            objItem: objCollection,
            nameXpath: "@name",
            displayNameXpath: "Dispname",
            referenceType: this.ReferenceType.SmartObjectDefinition,
            asRef: null
        });
    },

    _createParameterSourceValueObjectReferences: function (xmlElements, obj, asRef)
    {
        for (var e = 0; e < xmlElements.length; e++)
        {
            this._createParameterSourceValueObjectReference(xmlElements[e], obj, asRef);
        }
    },

    _createParameterSourceValueObjectReference: function (xmlElement, obj, asRef)
    {
        if (asRef)
        {
            obj = this._createReferenceItem(obj, asRef);
        }

        var obj = this._createObjectFromXml(
        {
            xmlElement: xmlElement,
            objItem: obj,
            idXpath: "@ID",
            nameXpath: "Name",
            displayNameXpath: "DisplayValue",
            referenceType: this.ReferenceType.ParameterMapping,
            asRef: asRef
        });

        var parameterElement = xmlElement.selectSingleNode("./ancestor::Parameter");
        this._createParameterObjectReference(parameterElement, obj);
    },

    _createSourceItemObjectReferences: function (xmlElements, objArray, asRef)
    {
        for (var e = 0; e < xmlElements.length; e++)
        {
            this._createSourceItemObject(xmlElements[e], objArray, null, asRef);
        }
    },

    _createSourceItemObject: function (xmlElement, objArray, objItem, asRef)
    {
        var parentNode = xmlElement.parentNode;
        var refObj = {};

        if (["Condition", "ControlItemsCollection"].indexOf(parentNode.nodeName) > -1 &&
        checkExists(parentNode.parentNode))
        {
            if (["ConditionalStyle", "Function"].indexOf(parentNode.parentNode.nodeName) > -1)
            {
                //Skip the condition node for conditional styles and go straight to the ConditionalStyle node
                //Skip the ControlItemsCollection node for ForEach Handlers and go straight to the Function node
                parentNode = parentNode.parentNode;
            }
        }

        var itemParentNodeName = parentNode.nodeName;

        if (this.expressionParentExcludeList.indexOf(itemParentNodeName) < 0)
        {
            var exprItemObj = null;
            var exprItemObjData =
            {
                xmlElement: xmlElement,
                idXpath: "@ID",
                nameXpath: "Name",
                displayNameXpath: "DisplayName",
                referenceType: this.ReferenceType.Expression,
            };
            if (asRef)
            {
                refObj = this._createReferenceItem(objArray, asRef);
                exprItemObjData.objItem = refObj;
                exprItemObjData.asRef = asRef;
            }
            else
            {
                exprItemObjData.objItem = objItem;
                exprItemObjData.asRef = null;
            }
            exprItemObj = this._createObjectFromXml(exprItemObjData);
            this._createSourceItemObject(parentNode, null, exprItemObj, null);
        }
        else
        {
            var firstChildOfSourceObj = {};
            var objData =
            {
                xmlElement: xmlElement,
                idXpath: "@ID",
                nameXpath: "Name",
                displayNameXpath: "DisplayName",
                referenceType: this.ReferenceType.Expression,
            };

            if (asRef)
            {
                refObj = this._createReferenceItem(objArray, asRef);
                objData.objItem = refObj;
                objData.asRef = asRef;
            }
            else
            {
                objData.objItem = objItem;
                objData.asRef = null;
            }

            firstChildOfSourceObj = this._createObjectFromXml(objData);

            switch (itemParentNodeName)
            {
                case "Expression":
                    this._createExpressionObjectReference(parentNode, firstChildOfSourceObj);
                    break;
                case "ConditionalStyle":
                    this._createConditonalStyleObjectReference(parentNode, firstChildOfSourceObj, asRef);
                    break;
                case "Condition":
                    this._createConditionObjectReference(parentNode, firstChildOfSourceObj, asRef);
                    break;
                case "Handler":
                    this._createHandlerObjectReference(parentNode, firstChildOfSourceObj, asRef);
                    break;
                case "Parameter":
                    this._createParameterObjectReference(parentNode, firstChildOfSourceObj, asRef);
                    break;
                case "Filter":
                    this._createFilterObjectReference(parentNode, firstChildOfSourceObj, asRef);
                    break;
                case "Function":
                    this._createFunctionObjectReference(parentNode, firstChildOfSourceObj);
                    break;
                case "SubFormPopupAction":
                    this._createSubFormPopupActionObjectReference(parentNode, firstChildOfSourceObj, asRef);
                    break;
            }
        }
    },

    _createConditionPropertyObjectReference: function (xmlElement, obj, asRef)
    {
        if (asRef)
        {
            obj = this._createReferenceItem(obj, asRef);
        }

        var obj = this._createObjectFromXml({
            xmlElement: xmlElement,
            objItem: obj,
            idXpath: "@ID",
            nameXpath: "Name",
            displayNameXpath: "DisplayName",
            referenceType: this.ReferenceType.ConditionProperty,
            asRef: asRef
        });

        var conditionElement = xmlElement.selectSingleNode("./ancestor::Condition");
        this._createConditionObjectReference(conditionElement, obj);
    },

    _createConditionObjectReference: function (xmlElement, obj, asRef)
    {
        if (asRef)
        {
            obj = this._createReferenceItem(obj, asRef);
        }

        var obj = this._createObjectFromXml({
            xmlElement: xmlElement,
            objItem: obj,
            idXpath: "@ID",
            nameXpath: "Name",
            displayNameXpath: "DisplayName",
            referenceType: this.ReferenceType.Condition,
            asRef: asRef
        });

        var handlerElement = xmlElement.selectSingleNode("./ancestor::Handler");
        if (handlerElement !== null)
        {
            this._createHandlerObjectReference(handlerElement, obj);
        }
        else
        {
            var conditionalStyleElement = xmlElement.selectSingleNode("./ancestor::ConditionalStyle");
            this._createConditonalStyleObjectReference(conditionalStyleElement, obj);
        }
    },

    _createConditonalStyleObjectReference: function (xmlElement, obj, asRef)
    {
        if (asRef)
        {
            obj = this._createReferenceItem(obj, asRef);
        }

        var obj = this._createObjectFromXml({
            xmlElement: xmlElement,
            objItem: obj,
            idXpath: "@ID",
            nameXpath: "Name",
            displayNameXpath: "DisplayName",
            referenceType: this.ReferenceType.ConditionalStyle,
            asRef: asRef
        });

        var controlElement = xmlElement.selectSingleNode("./ancestor::Control");
        this._createControlObjectReference(controlElement, obj);
    },

    _createControlObjectReferences: function (xmlElements, objCollection, asRef)
    {
        for (var e = 0; e < xmlElements.length; e++)
        {
            this._createControlObjectReference(xmlElements[e], objCollection, asRef);
        }
    },

    _createControlObjectReference: function (xmlElement, obj, asRef)
    {
        if (asRef)
        {
            obj = this._createReferenceItem(obj, asRef);
        }

        var obj = this._createObjectFromXml({
            xmlElement: xmlElement,
            objItem: obj,
            idXpath: "@ID",
            nameXpath: "Name",
            displayNameXpath: "DisplayName",
            referenceType: this.ReferenceType.Control,
            asRef: asRef
        });

        obj.Parent = [];
        var parentElement = xmlElement.selectSingleNode("./ancestor::Form | ./ancestor::View");
        this._createMainObjectReference(parentElement, obj);
    },

    _createExpressionObjectReference: function (xmlElement, obj)
    {
        var obj = this._createObjectFromXml({
            xmlElement: xmlElement,
            objItem: obj,
            idXpath: "@ID",
            nameXpath: "Name",
            displayNameXpath: "DisplayName",
            referenceType: this.ReferenceType.ControlExpression,
            asRef: null
        });

        var parentElement = xmlElement.selectSingleNode("./ancestor::Form | ./ancestor::View");
        this._createMainObjectReference(parentElement, obj);
    },

    _createParameterObjectReferences: function (xmlElements, objCollection, asRef)
    {
        for (var e = 0; e < xmlElements.length; e++)
        {
            this._createParameterObjectReference(xmlElements[e], objCollection, asRef);
        }
    },

    _createParameterObjectReference: function (xmlElement, obj, asRef)
    {
        if (asRef)
        {
            obj = this._createReferenceItem(obj, asRef);
        }

        var obj = this._createObjectFromXml({
            xmlElement: xmlElement,
            objItem: obj,
            idXpath: "@ID",
            nameXpath: "Name",
            displayNameXpath: "DisplayName",
            referenceType: this.ReferenceType.ParameterMapping,
            asRef: asRef
        });

        var actionElement = xmlElement.selectSingleNode("./ancestor::Action");
        this._createActionObjectReference(actionElement, obj);
    },

    _createResultObjectReferences: function (xmlElements, objCollection, asRef)
    {
        for (var e = 0; e < xmlElements.length; e++)
        {
            this._createResultObjectReference(xmlElements[e], objCollection, asRef);
        }
    },

    _createResultObjectReference: function (xmlElement, objCollection, asRef)
    {
        if (asRef)
        {
            objItem = this._createReferenceItem(objCollection, asRef);
        }

        var obj = this._createObjectFromXml({
            xmlElement: xmlElement,
            objItem: objItem,
            idXpath: "@ID",
            nameXpath: "Name",
            displayNameXpath: "DisplayName",
            referenceType: this.ReferenceType.ResultMapping,
            asRef: asRef
        });

        var actionElement = xmlElement.selectSingleNode("./ancestor::Action");
        this._createActionObjectReference(actionElement, obj);
    },

    _createActionPropertyObjectReferences: function (xmlElements, objCollection, asRef)
    {
        for (var e = 0; e < xmlElements.length; e++)
        {
            this._createActionPropertyObjectReference(xmlElements[e], objCollection, asRef);
        }
    },

    _createActionPropertyObjectReference: function (xmlElement, obj, asRef)
    {
        if (asRef)
        {
            obj = this._createReferenceItem(obj, asRef);
        }

        var obj = this._createObjectFromXml({
            xmlElement: xmlElement,
            objItem: obj,
            idXpath: "@ID",
            nameXpath: "Name",
            displayNameXpath: "DisplayName",
            referenceType: this.ReferenceType.ActionProperty,
            asRef: asRef
        });

        var actionElement = xmlElement.selectSingleNode("./ancestor::Action");
        this._createActionObjectReference(actionElement, obj);
    },

    _createActionObjectReferences: function (xmlElements, objCollection, asRef)
    {
        for (var e = 0; e < xmlElements.length; e++)
        {
            this._createActionObjectReference(xmlElements[e], objCollection, asRef);
        }
    },

    _createActionObjectReference: function (xmlElement, obj, asRef)
    {
        if (asRef)
        {
            obj = this._createReferenceItem(obj, asRef);
        }

        var obj = this._createObjectFromXml({
            xmlElement: xmlElement,
            objItem: obj,
            idXpath: "@ID",
            nameXpath: "Name",
            displayNameXpath: "DisplayName",
            referenceType: this.ReferenceType.Action,
            asRef: asRef
        });

        var handlerElement = xmlElement.selectSingleNode("./ancestor::Handler");
        this._createHandlerObjectReference(handlerElement, obj);
    },

    _createHandlerObjectReference: function (xmlElement, obj, asRef)
    {
        if (asRef)
        {
            obj = this._createReferenceItem(obj, asRef);
        }

        var obj = this._createObjectFromXml({
            xmlElement: xmlElement,
            objItem: obj,
            idXpath: "@ID",
            nameXpath: "Name",
            displayNameXpath: "DisplayName",
            referenceType: this.ReferenceType.Handler,
            asRef: asRef
        });

        var eventElement = xmlElement.selectSingleNode("./ancestor::Event");
        this._createEventObjectReference(eventElement, obj);
    },

    _createEventObjectReferences: function (xmlElements, objCollection, asRef)
    {
        for (var e = 0; e < xmlElements.length; e++)
        {
            this._createEventObjectReference(xmlElements[e], objCollection, asRef);
        }
    },

    _createEventObjectReference: function (xmlElement, obj, asRef)
    {
        if (asRef)
        {
            obj = this._createReferenceItem(obj, asRef);
        }

        var nameValue = "";
        var displayNameValue = "";
        if (checkExists(xmlElement))
        {
            var nameNode = xmlElement.selectSingleNode("Properties/Property[Name='RuleName']/Value");
            var displayNameNode = xmlElement.selectSingleNode("Properties/Property[Name='RuleFriendlyName']/Value");

            var hasNameNode = checkExists(nameNode);
            var hasDisplayNameNode = checkExists(displayNameNode);

            if (hasDisplayNameNode)
            {
                displayNameValue = displayNameNode.text;
            }

            if (hasNameNode)
            {
                nameValue = nameNode.text;
            }
            else
            {
                nameValue = displayNameValue;
            }
        }

        var obj = this._createObjectFromXml({
            xmlElement: xmlElement,
            objItem: obj,
            idXpath: "@ID",
            nameValue: nameValue,
            displayNameValue: displayNameValue,
            referenceType: this.ReferenceType.Event,
            asRef: asRef
        });

        var stateElement = xmlElement.selectSingleNode("./ancestor::State");

        if (stateElement !== null)
        {
            this._createStateObjectReference(stateElement, obj);
        }
        else
        {
            var viewElement = xmlElement.selectSingleNode("./ancestor::View");
            this._createMainObjectReference(viewElement, obj);
        }
    },

    _createStateObjectReference: function (xmlElement, obj, asRef)
    {
        if (asRef)
        {
            obj = this._createReferenceItem(obj, asRef);
        }

        var obj = this._createObjectFromXml({
            xmlElement: xmlElement,
            objItem: obj,
            idXpath: "@ID",
            nameXpath: "Name",
            displayNameXpath: "DisplayName",
            referenceType: this.ReferenceType.State,
            asRef: asRef
        });

        var parentElement = xmlElement.selectSingleNode("./ancestor::Form | ./ancestor::View");
        this._createMainObjectReference(parentElement, obj);
    },

    _createFilterObjectReference: function (xmlElement, obj, asRef)
    {
        if (asRef)
        {
            obj = this._createReferenceItem(obj, asRef);
        }

        var obj = this._createObjectFromXml({
            xmlElement: xmlElement,
            objItem: obj,
            idXpath: "@ID",
            nameXpath: "Name",
            displayNameXpath: "DisplayName",
            referenceType: this.ReferenceType.Filter,
            asRef: asRef
        });
    },

    _createSubFormPopupActionObjectReference: function (xmlElement, obj, asRef)
    {
        if (asRef)
        {
            obj = this._createReferenceItem(obj, asRef);
        }

        var obj = this._createObjectFromXml({
            xmlElement: xmlElement,
            objItem: obj,
            idXpath: "@ID",
            nameXpath: "Name",
            displayNameXpath: "DisplayName",
            referenceType: this.ReferenceType.SubFormPopupAction,
            asRef: asRef
        });
    },

    _createFunctionObjectReference: function (xmlElement, obj, asRef)
    {
        var obj = this._createObjectFromXml({
            xmlElement: xmlElement,
            objItem: obj,
            idXpath: "@ID",
            nameXpath: "Name",
            displayNameXpath: "DisplayName",
            referenceType: this.ReferenceType.HandlerFunction,
            asRef: null
        });

        var handlerElement = xmlElement.selectSingleNode("./ancestor::Handler");
        if (handlerElement !== null)
        {
            this._createHandlerObjectReference(handlerElement, obj);
        }
    },

    /**
    * Find all instances of the referenceObj being used by a filter
    * @param {xmlDocument} xmlDefinition The defintition xml containing all filters
    * @param {array} objCollection Collection of referenced objects that will be appended to
    * @param {object} referenceObj Object against which lookup is being done to get object dependencies
    */
    _createFiltersObjectReference: function (xmlDefinition, objCollection, referenceObj)
    {
        if (this._isSourceFieldReplaced(referenceObj))
        {
            //If the new source contains the same property name of the old source, this dependency will automatically be replaced by the new source.
            //Thus it is not necessary to pick this up as missing dependency.
            return;
        }

        //Only filters declared on form/view defined rules or extended from an inherited rule should be picked up
        //Filters declared on view level and not extended on form level, should not be picked up (when on form)
        var formDefinedQry = "(not(@IsInherited) or @IsInherited='False')"; // dont check IsReference as it can be inherited and then disabled.

        var xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action[{0}]/Properties/Property[Name='Filter']/Value"
        .format(formDefinedQry);

        var filterNodes = xmlDefinition.selectNodes(xPath);
        var fc = 0;

        for (fc = 0; fc < filterNodes.length; fc++)
        {
            var filterNode = filterNodes[fc];
            if (checkExists(filterNode))
            {
                var parentActionPropertyNode = filterNode.parentNode;
                var filterString = filterNode.text;
                if (filterString.indexOf(referenceObj.id) > -1 || filterString.indexOf(referenceObj.name) > -1)
                {
                    //Object is being used by filter:
                    var filterXml = parseXML(filterString).documentElement;

                    //Get all items used by filter:
                    var filterItemNodes = filterXml.selectNodes(".//Item");
                    var itemNodesWithDependencies = [];

                    for (var f = 0; f < filterItemNodes.length; f++)
                    {
                        var filterItemNode = filterItemNodes[f];
                        var sourceType = filterItemNode.getAttribute("SourceType");
                        var sourceId = filterItemNode.getAttribute("SourceID");
                        if (checkExists(sourceType) && checkExists(sourceId))
                        {
                            sourceType = sourceType.toLowerCase();

                            var hasFilterDependency = false;

                            switch (referenceObj.type)
                            {
                                case this.ReferenceType.ViewField:
                                    {
                                        hasFilterDependency = this._isFilterItemReferencingObjectProperty(referenceObj, filterItemNode, filterNode);
                                    }
                                    break;
                                case this.ReferenceType.Control:
                                    {
                                        var sourcePath = filterItemNode.getAttribute("SourcePath");
                                        hasFilterDependency =
                                        (sourceType === referenceObj.type.toLowerCase() && sourceId === referenceObj.id) ||
                                        (sourceType === this.ReferenceType.ControlProperty.toLowerCase() && sourcePath === referenceObj.id);
                                    }
                                    break;
                                case this.ReferenceType.ControlField:
                                    {
                                        var sourcePath = filterItemNode.getAttribute("SourcePath");
                                        hasFilterDependency = (sourceType === referenceObj.type.toLowerCase() && sourcePath === referenceObj.id);
                                    }
                                    break;
                                case this.ReferenceType.Expression:
                                case this.ReferenceType.ControlExpression:
                                    {
                                        hasFilterDependency =
                                        (sourceType === this.ReferenceType.Expression.toLowerCase() && sourceId === referenceObj.id) ||
                                        (sourceType === this.ReferenceType.ControlProperty.toLowerCase() && sourcePath === referenceObj.id);
                                    }
                                    break;
                                case this.ReferenceType.ViewParameter:
                                case this.ReferenceType.FormParameter:
                                    {
                                        hasFilterDependency =
                                        sourceType === referenceObj.type.toLowerCase() && sourceId === referenceObj.name;
                                    }
                                    break;
                                case this.ReferenceType.View:
                                    var instanceId = filterItemNode.getAttribute("InstanceID");
                                    var sourceInstanceId = filterItemNode.getAttribute("SourceInstanceID");
                                    if (checkExists(instanceId))
                                    {
                                        hasFilterDependency = instanceId === referenceObj.id;
                                    }
                                    else if (checkExists(sourceInstanceId))
                                    {
                                        hasFilterDependency = sourceInstanceId === referenceObj.id;
                                    }
                                    break;
                            }

                            if (hasFilterDependency)
                            {
                                itemNodesWithDependencies.push(filterItemNode);
                            }
                        }

                    }
                    if (itemNodesWithDependencies.length > 0)
                    {
                        var objectCountBeforeFiltersAdded = objCollection.length;
                        this._createSourceItemObjectReferences(itemNodesWithDependencies, objCollection, this.ReferenceAs.PropertyExpressionSource);

                        if (objectCountBeforeFiltersAdded >= objCollection.length)
                        {
                            //No items were added
                            return;
                        }

                        var o = 0;
                        for (o = objectCountBeforeFiltersAdded; o < objCollection.length; o++)
                        {
                            var item = objCollection[o].item;
                            var xmlNode = item.xmlNode;

                            if (!checkExists(item) || !checkExists(xmlNode))
                            {
                                continue;
                            }

                            //All the xmlNodes added to the reference objects up to the filter node, are parsed-out xml nodes and not linked to the definition xml document
                            //For clarity, they will be moved to a new property called xmlNodeCopy and the original xmlNode property will be set to null:
                            var nodeName = xmlNode.nodeName;
                            var filterNodeFound = false;
                            while (checkExists(item) && !filterNodeFound)
                            {
                                item.copiedXmlNode = item.xmlNode;
                                item.xmlNode = null;
                                item = item.parent;
                                if (checkExists(item) && checkExists(item.xmlNode))
                                {
                                    nodeName = item.xmlNode.nodeName;
                                }
                                if (nodeName.toLowerCase() === "filter")
                                {
                                    item.copiedXmlNode = item.xmlNode.cloneNode(true);
                                    item.xmlNode = null;

                                    if (checkExists(parentActionPropertyNode))
                                    {
                                        this._createActionPropertyObjectReference(parentActionPropertyNode, item);
                                    }
                                    filterNodeFound = true;
                                }
                            }
                        }
                    }
                }
            }
        }
    },

    /**
    * Find all instances of the referenceObj being used by a condition property
    * @param {xmlDocument} xmlDefinition The defintition xml containing all condition properties
    * @param {array} objCollection Collection of referenced objects that will be appended to
    * @param {object} referenceObj Object against which lookup is being done to get object dependencies
    */
    _createConditionPropertiesObjectReference: function (xmlDefinition, objCollection, referenceObj)
    {
        var xPath = "//Events/Event[@Type='User']/Handlers/Handler/Conditions/Condition/Properties/Property/Value[contains(text(),'Source')][contains(text(),'" + referenceObj.type + "')]";

        var valueNodes = xmlDefinition.selectNodes(xPath);

        for (var i = 0, l = valueNodes.length; i < l; i++)
        {
            var valueNode = valueNodes[i];
            var propertyNode = valueNode.parentNode;

            var sourceString = valueNode.text;
            if (sourceString.indexOf(referenceObj.id) > -1 || sourceString.indexOf(referenceObj.name) > -1)
            {
                //Object is being used by condition:
                var sourceMappingXml = parseXML("<SourceValue>{0}</SourceValue>".format(sourceString));

                switch (referenceObj.type)
                {
                    case this.ReferenceType.ViewField:
                        xPath = ".//Source[@SourceID='{0}' and @SourceType='ViewField']".format(referenceObj.id);
                        break;
                    case this.ReferenceType.Control:
                        xPath = ".//Source[(@SourcePath='{0}' and @SourceType='ControlProperty') or (@SourceID='{0}' and @SourceType='Control')]".format(referenceObj.id);
                        break;
                    case this.ReferenceType.ControlField:
                        xPath = ".//Source[@SourcePath='{0}' and @SourceType='ControlField']".format(referenceObj.id);
                        break;
                    case this.ReferenceType.Expression:
                    case this.ReferenceType.ControlExpression:
                        xPath = ".//Source[@SourceID='{0}' and @SourceType='Expression']".format(referenceObj.id);
                        break;
                    case this.ReferenceType.ViewParameter:
                        xPath = ".//Source[@SourceName='{0}' and @SourceType='ViewParameter']".format(referenceObj.name);
                        break;
                    case this.ReferenceType.FormParameter:
                        xPath = ".//Source[@SourceName='{0}' and @SourceType='FormParameter']".format(referenceObj.name);
                        break;
                }

                var nodesWithDependencies = sourceMappingXml.selectNodes(xPath);

                if (nodesWithDependencies.length > 0)
                {
                    for (var n = 0, k = nodesWithDependencies.length; n < k; n++)
                    {
                        var refObj = this._createReferenceItem(objCollection, this.ReferenceAs.PropertyExpressionSource);

                        var item = this._createObjectFromXml({
                            xmlElement: nodesWithDependencies[n],
                            objItem: refObj,
                            idXpath: "@ID",
                            nameXpath: "Name",
                            displayNameXpath: "DisplayName",
                            referenceType: this.ReferenceType.SourceValue,
                            asRef: this.ReferenceAs.PropertyExpressionSource
                        });

                        item.copiedXmlNode = item.xmlNode;
                        item.xmlNode = null;

                        this._createConditionPropertyObjectReference(propertyNode, item, null);
                    }
                }
            }
        }
    },

    _createSubFormPopupActionsObjectReference: function (xmlDefinition, objCollection, referenceObj)
    {
        if (this._isSourceFieldReplaced(referenceObj))
        {
            //If the new source contains the same property name of the old source, this dependency will automatically be replaced by the new source.
            //Thus it is not necessary to pick this up as missing dependency.
            return;
        }

        var formDefinedQry = "(not(@IsInherited) or @IsInherited='False')"; // dont check IsReference as it can be inherited and then disabled.

        var xPath = "//Events/Event[@Type='User']/Handlers/Handler/Actions/Action[{0}][(@Type='Popup' or @Type='Open') and @SubFormID]/Properties/Property/Value[contains(text(),'Source')]"
        .format(formDefinedQry);

        var valueNodes = xmlDefinition.selectNodes(xPath);
        var i = 0;

        for (i = 0; i < valueNodes.length; i++)
        {
            var valueNode = valueNodes[i];

            var propertyNode = valueNode.parentNode;
            var sourceMappingString = valueNode.text;
            if (sourceMappingString.indexOf(referenceObj.id) > -1 || sourceMappingString.indexOf(referenceObj.name) > -1)
            {
                var xpath = "";
                var sourceMappingXml = parseXML("<SubFormPopupAction><Sources>{0}</Sources></SubFormPopupAction>".format(sourceMappingString));

                switch (referenceObj.type)
                {
                    case this.ReferenceType.ViewField:
                        xPath = ".//Source[@SourceID='{0}' and @SourceType='ViewField']".format(referenceObj.id);
                        break;
                    case this.ReferenceType.Control:
                        xPath = ".//Source[(@SourcePath='{0}' and @SourceType='ControlProperty') or (@SourceID='{0}' and @SourceType='Control')]".format(referenceObj.id);
                        break;
                    case this.ReferenceType.ControlField:
                        xPath = ".//Source[@SourcePath='{0}' and @SourceType='ControlField']".format(referenceObj.id);
                        break;
                    case this.ReferenceType.Expression:
                    case this.ReferenceType.ControlExpression:
                        xPath = ".//Source[@SourceID='{0}' and @SourceType='Expression']".format(referenceObj.id);
                        break;
                    case this.ReferenceType.ViewParameter:
                        xPath = ".//Source[@SourceName='{0}' and @SourceType='ViewParameter']".format(referenceObj.name);
                        break;
                    case this.ReferenceType.FormParameter:
                        xPath = ".//Source[@SourceName='{0}' and @SourceType='FormParameter']".format(referenceObj.name);
                        break;
                    case this.ReferenceType.View:
                        xPath = ".//Source[@SourceInstanceID='{0}']".format(referenceObj.id);
                        break;
                }

                var nodesWithDependencies = sourceMappingXml.selectNodes(xPath);

                if (nodesWithDependencies.length > 0)
                {
                    var objectCountBeforeFiltersAdded = objCollection.length;
                    this._createSourceItemObjectReferences(nodesWithDependencies, objCollection, this.ReferenceAs.PropertyExpressionSource);

                    if (objectCountBeforeFiltersAdded >= objCollection.length)
                    {
                        //No items were added
                        return;
                    }

                    var o = 0;
                    for (o = objectCountBeforeFiltersAdded; o < objCollection.length; o++)
                    {
                        var item = objCollection[o].item;
                        var xmlNode = item.xmlNode;

                        if (!checkExists(item) || !checkExists(xmlNode))
                        {
                            continue;
                        }

                        //Parsed-out xml nodes and not linked to the definition xml document
                        //For clarity, they will be moved to a new property called xmlNodeCopy and the original xmlNode property will be set to null:
                        var nodeName = xmlNode.nodeName;
                        var filterNodeFound = false;
                        while (checkExists(item) && !filterNodeFound)
                        {
                            item.copiedXmlNode = item.xmlNode;
                            item.xmlNode = null;
                            item = item.parent;
                            if (checkExists(item) && checkExists(item.xmlNode))
                            {
                                nodeName = item.xmlNode.nodeName;
                            }
                            if (nodeName.toLowerCase() === "subformpopupaction")
                            {
                                item.copiedXmlNode = item.xmlNode.cloneNode(true);
                                item.xmlNode = null;

                                if (checkExists(propertyNode))
                                {
                                    this._createActionPropertyObjectReference(propertyNode, item);
                                }
                                filterNodeFound = true;
                            }
                        }
                    }
                }
            }
        }
    },

    _createValidationGroupReferences: function (xmlElements, objCollection, asRef)
    {
        for (var e = 0; e < xmlElements.length; e++)
        {
            this._createValidationGroupReference(xmlElements[e], objCollection, asRef);
        }
    },

    _createValidationGroupReference: function (xmlElement, obj, asRef)
    {
        if (asRef)
        {
            obj = this._createReferenceItem(obj, asRef);
        }

        var obj = this._createObjectFromXml({
            xmlElement: xmlElement,
            objItem: obj,
            idXpath: "@ID",
            nameXpath: "Name",
            displayNameXpath: "DisplayName",
            referenceType: this.ReferenceType.ValidationGroupControl,
            asRef: asRef
        });

        var validationGroupElement = xmlElement.selectSingleNode("./ancestor::ValidationGroup");
        obj = this._createObjectFromXml({
            xmlElement: validationGroupElement,
            objItem: obj,
            idXpath: "@ID",
            nameXpath: "Name",
            displayNameXpath: "DisplayName",
            referenceType: this.ReferenceType.ValidationGroup,
            asRef: null
        });

        var rootElement = xmlElement.selectSingleNode("./ancestor::Form | ./ancestor::View");
        var groupActionProperty = rootElement.selectSingleNode(".//Action[@Type='Validate']/Properties/Property[Name='GroupID'][Value='{0}']".format(obj.id));
        if (checkExists(groupActionProperty) && checkExists(obj.id))
        {
            this._createActionPropertyObjectReference(groupActionProperty, obj);
        }
        else
        {
            var parentElement = xmlElement.selectSingleNode("./ancestor::Form | ./ancestor::View");
            this._createMainObjectReference(parentElement, obj);
        }
    },

    _createMainObjectReference: function (xmlElement, objCollection)
    {
        var objType = xmlElement.getAttribute("Type");

        var obj = this._createObjectFromXml({
            xmlElement: xmlElement,
            objItem: objCollection,
            idXpath: "@ID",
            nameXpath: "Name",
            displayNameXpath: "DisplayName",
            referenceType: objType,
            asRef: null
        });
    },

    /**
    * @typedef objData
    * @property {xmlNode} xmlElement - Node to use as object's xmlNode property and to do xpath lookups for name/displayname on
    * @property {object} objItem - The reference object to which the newly created object should be added as its first item or parent
    * @property {text} idValue - Id for object from the xmlElement node (if not specified, will attempt to get from xpath)
    * @property {text} nameValue - Name for object from the xmlElement node (if not specified, will attempt to get from xpath)
    * @property {text} displayNameValue - Name for object from the xmlElement node (if not specified, will attempt to get from xpath)
    * @property {text} idXpath - xPath that will select the id for object from the xmlElement node
    * @property {text} nameXpath - xPath that will select the name for object from the xmlElement node
    * @property {text} displayNameXpath - xPath that will select the display name for object from the xmlElement node
    * @property {enum} referenceType - type of reference, to be used as created object's type property
    * @property {enum} asRef - type of what dependency object was referenced as, only set if this is the first item of dependency object
    */

    /**
    * Will create a reference object that will be appendend to current reference object
    *
    * @function _createObjectFromXml
    *
    * @param {objData} object - Object containing information needed to create new object
    * @returns {returnObj} object - newly created object (that will also be appended to objItem property passed in)
    */
    _createObjectFromXml: function (objData)
    {
        var obj = {};
        var objId = objData.idValue || "";
        var objName = objData.nameValue || "";
        var objDisplayName = objData.displayNameValue || "";

        var xmlElement = objData.xmlElement;

        if (objId === "" && checkExists(xmlElement) && checkExistsNotEmpty(objData.idXpath))
        {
            var idNode = xmlElement.selectSingleNode(objData.idXpath);
            objId = checkExistsNotEmpty(idNode) ? idNode.text : null;
        }

        if (objName === "" && checkExists(xmlElement) && checkExistsNotEmpty(objData.nameXpath))
        {
            var nameNode = xmlElement.selectSingleNode(objData.nameXpath);
            objName = checkExistsNotEmpty(nameNode) ? nameNode.text : null;
        }

        if (objDisplayName === "" && checkExists(xmlElement) && checkExistsNotEmpty(objData.displayNameXpath))
        {
            var dispNameNode = xmlElement.selectSingleNode(objData.displayNameXpath);
            objDisplayName = checkExistsNotEmpty(dispNameNode) ? dispNameNode.text : null;
        }

        obj.id = objId;
        obj.name = objName;
        obj.displayName = objDisplayName;

        var returnObj;

        obj.type = checkExistsNotEmpty(objData.referenceType) ? objData.referenceType : null;
        obj.xmlNode = xmlElement;

        if (objData.asRef)
        {
            objData.objItem.item = obj;
            returnObj = objData.objItem.item;
        }
        else
        {
            objData.objItem.parent = obj;
            returnObj = objData.objItem.parent;
        }

        if (objData.referenceType === this.ReferenceType.Control)
        {
            returnObj.subType = xmlElement.getAttribute("Type");
        }

        return returnObj;
    },

    /**
    * Check if the property name between the old and new data sources (smart object) are the same
    * 
    * @param {object} referenceObj: The main object that is getting removed
    * @returns {boolean}
    * 
    */
    _isSourceFieldReplaced: function (referenceObj)
    {
        var flag = false;

        if (checkExists(referenceObj) &&
        checkExists(referenceObj.sourceDetails) &&
        checkExists(referenceObj.newSourceDetails))
        {
            var oldSourceProperty = referenceObj.sourceDetails.selectSingleNode("properties/property[@name='{0}']".format(referenceObj.name));
            var newSourceProperty = referenceObj.newSourceDetails.selectSingleNode("properties/property[@name='{0}']".format(referenceObj.name));

            if (checkExists(oldSourceProperty) &&
            checkExists(newSourceProperty))
            {
                flag = true;
            }
        }

        return flag;
    },

    ///<summary>
    ///Accepts a list of referenced items and returns the relevant details of this list that can be used to display details to user.
    ///(e.g. with the dependency reporter and the notifier popup message)
    ///<param name="referencedItems">
    ///The collection of referenced items. 
    ///This can be obtained by getting the itemReferences object returned by findReferences function's items property.
    ///</param>
    ///<returns>
    ///A list of detail display objects for referenced items - object contains Title, Description, Component Type, Icon
    ///</returns>
    ///<summary>
    getReferencedItemsDisplayDetails: function (referencedItems, displayDetails)
    {
        if (!checkExists(displayDetails))
        {
            displayDetails = [];
        }
        for (var r = 0; r < referencedItems.length; r++)
        {
            var displayDetail = {};
            var rootCauseItem = $.extend(true, {}, referencedItems[r]);

            var resourceSvc = SourceCode.Forms.Services.AnalyzerResourcesService();

            displayDetail = resourceSvc.getReferenceItemDetails(rootCauseItem);

            displayDetails.push(displayDetail);
        }
        return SourceCode.Forms.DependencyHelper._sortAndGroupReferencedItemsDisplayDetails(displayDetails);
    },

    _sortAndGroupReferencedItemsDisplayDetails: function (displayDetails)
    {
        displayDetails = displayDetails.sort(function (a, b)
        {
            var t1 = a.description.toUpperCase();
            var t2 = b.description.toUpperCase();
            if (a.type === "Event")
            {
                t1 = a.title.toUpperCase();
            }
            if (b.type === "Event")
            {
                t2 = b.title.toUpperCase();
            }
            if (t1 < t2)
            {
                return -1;
            }
            if (t1 > t2)
            {
                return 1;
            }
            return 0;
        });

        //Group items by title
        var groups = [];
        var i = 0;
        var title = "";
        var group = null;
        for (i = 0; i < displayDetails.length; i++)
        {
            var item = displayDetails[i];
            var itemTitle = item.title;
            if (itemTitle !== title)
            {
                group = [];
                groups.push(group);

                title = itemTitle;
            }
            group.push(item);
        }

        //Order each group by description
        for (i = 0; i < groups.length; i++)
        {
            group = groups[i];
            group = group.sort(function (a, b)
            {
                var d1 = a.description.toUpperCase();
                var d2 = b.description.toUpperCase();
                if (d1 < d2)
                {
                    return -1;
                }
                if (d1 > d2)
                {
                    return 1;
                }
                return 0;
            });
        }

        //Merge groups back into displayDetails array
        return [].concat.apply([], groups);
    },

    _getParentFromItem: function (item, parentType)
    {
        if (item.type === parentType)
        {
            return item;
        }

        var parentItem = null;
        var parentFound = false;
        var parent = item.parent;
        while (checkExists(parent) && !parentFound)
        {
            if (parent.type === parentType)
            {
                parentItem = parent;
                parentFound = true;
            }
            parent = parent.parent;
        }

        return parentItem;
    },

    _getParentNameFromItem: function (item, parentType)
    {
        var parent = this._getParentFromItem(item, parentType);
        var name = "";
        if (checkExists(parent))
        {
            name = parent.displayName || parent.name;
        }
        return name;
    },

    // Formats a given name for a property into a lower camel case format
    // propertyName: property name read from XML attributes (attribute name)
    //
    // returns: Formatted name
    _formatPropertyName: function (propertyName)
    {
        var result = propertyName.replace(/\s/gi, "");
        return result.substr(0, 1).toLowerCase() + result.substr(1);
    },

    // Deserialize an XML node into a JSON object conforming to the Reference Collection object model
    // node: Any element node contained in an XML serialized object model
    //
    // returns: object matching its relevant counterpart in the Reference Collection object model (JSON)
    deserializeNode: function (node, isItemNode)
    {
        isItemNode = isItemNode || false;

        if (["Items", "References", "Properties"].indexOf(node.nodeName) !== -1)
        {
            // Handle as a collection node
            var collection = [];
            var children = node.childNodes;

            for (var m = 0, n = children.length; m < n; m++)
            {
                if (node.nodeName === "Items")
                {
                    collection.push(this._deserializeItemNode(children[m]));
                }
                else
                {
                    collection.push(this.deserializeNode(children[m]));
                }
            }

            return collection;
        }
        else if (node.nodeType === 1 && node.attributes.length === 0 && (node.childElementCount === 0 || node.childNodes[0].nodeType === 3))
        {
            // Handle element node returning its text node value
            return node.firstChild.nodeValue;
        }

        // Main return object
        var obj = {};

        // Deserialize attributes
        var attrs = node.attributes;
        for (var i = 0, l = attrs.length; i < l; i++)
        {
            var propertyName = this._formatPropertyName(attrs[i].name);

            switch (propertyName)
            {
                case "referenceStatus":
                    propertyName = "status";
                    break;
                case "referenceType":
                    propertyName = "type";
                    break;
            }

            if (!isItemNode || propertyName !== "referenceAs")
            {
                obj[propertyName] = attrs[i].value;
            }
        }

        // Deserialize child nodes
        var childNodes = node.childNodes;
        for (var j = 0, k = childNodes.length; j < k; j++)
        {
            var childNode = childNodes[j];

            if (childNode.nodeType === 1)
            {
                var propertyName = this._formatPropertyName(childNode.nodeName);
                obj[propertyName] = this.deserializeNode(childNode);
            }
        }

        // Build Parent Reference Nodes
        if (node.nodeName === "Reference" && node.parentNode.nodeName === "References"
        && node.parentNode.parentNode !== null && node.parentNode.parentNode.nodeName === "Reference")
        {
            obj.parent = this._buildParentReferenceNode(node.parentNode.parentNode);
        }

        return obj;
    },

    // Deserialize an XML node into a JSON object conforming to the Reference Item object model
    // node: Any element node contained in an XML serialized reference item object model
    //
    // returns: object matching its relevant counterpart in the Reference Item object model (JSON)
    _deserializeItemNode: function (node)
    {
        var obj = {
            referenceAs: node.getAttribute("ReferenceAs"),
            item: this.deserializeNode(node, true)
        };

        return obj;
    },

    // Deserialize an XML node into a JSON object providing some detail to describe the parent reference object
    // node: Any element node contained in an XML serialized reference object model
    //
    // returns: object with primary detail of the parent reference object (JSON)
    _buildParentReferenceNode: function (node)
    {
        var obj = {};

        // Deserialize attributes
        var attrs = node.attributes;
        for (var i = 0, l = attrs.length; i < l; i++)
        {
            var propertyName = this._formatPropertyName(attrs[i].name);

            switch (propertyName)
            {
                case "referenceStatus":
                    propertyName = "status";
                    break;
                case "referenceType":
                    propertyName = "type";
                    break;
            }

            obj[propertyName] = attrs[i].value;
        }

        // Build Parent Reference Nodes
        if (node.nodeName === "Reference" && node.parentNode.nodeName === "References"
        && node.parentNode.parentNode !== null && node.parentNode.parentNode.nodeName === "Reference")
        {
            obj.parent = this._buildParentReferenceNode(node.parentNode.parentNode);
        }
        return obj;
    },

    /**
    * If the view or form definition is out of date, the dependencies check could be inaccurate
    * This function tests whether the definition xml is Form or View definition and then call the rebuild function
    * @param {xmlDocument} xmlDef The form or view definition XML.
    */
    _ensureDefinitionIsUpToDate: function (xmlDef)
    {
        if (checkExists(xmlDef.selectSingleNode("SourceCode.Forms/Forms")))
        {
            SourceCode.Forms.Designers.Form.checkLayoutXML();
        }
        else if (checkExists(xmlDef.selectSingleNode("SourceCode.Forms/Views")))
        {
            SourceCode.Forms.Designers.View.ViewDesigner._BuildViewXML();
        }
        SourceCode.Forms.Designers.Common.Context.ensureDefinitionIsReadyForDependancyChecks();
    },

    /**
    * Searches for the error smartObject in the list of server smartObjects. If it finds it, it sets the validation properties of that smartobject
    * Otherwise it just adds the error smartobject, its properties or its methods to the relevant array
    * @param {SmartObject[]} Array of SourceCode.Forms.Types.SmartObject
    * @param {object} SourceCode.Forms.Types.SmartObject
    */
    findAndSetSmoValidationProperties: function (serverSmartObjects, errorSmartObject)
    {
        if (errorSmartObject)
        {
            var erroSmoId = errorSmartObject.id;
            var smoFound = false;

            for (var i = 0; i < serverSmartObjects.length; i++)
            {
                if (serverSmartObjects[i].id === erroSmoId)
                {
                    // Assign smo validation properties
                    serverSmartObjects[i].validationStatus = errorSmartObject.validationStatus;
                    serverSmartObjects[i].validationMessages = errorSmartObject.validationMessages;
                    smoFound = true;

                    // Now check properties
                    var errorProperties = errorSmartObject.objectProperties.toArray();

                    if (errorProperties.length > 0)
                    {
                        if (checkExists(serverSmartObjects[i].objectProperties))
                        {
                            // assuming only a single property
                            var propertyName = errorProperties[0].name;

                            if (checkExists(serverSmartObjects[i].objectProperties.findByKey(propertyName))) // if the property has been returned from the server
                            {
                                serverSmartObjects[i].objectProperties[propertyName].validationStatus = errorSmartObject.objectProperties[propertyName].validationStatus;
                                serverSmartObjects[i].objectProperties[propertyName].validationMessages = errorSmartObject.objectProperties[propertyName].validationMessages;
                            }
                            else
                            {
                                serverSmartObjects[i].objectProperties[propertyName] = errorSmartObject.objectProperties[propertyName];
                            }
                        }
                        else
                        {
                            serverSmartObjects[i].objectProperties = errorSmartObject.objectProperties;
                        }
                    }

                    // And now check methods
                    var errorMethods = errorSmartObject.methods.toArray();

                    if (errorMethods.length > 0)
                    {
                        if (checkExists(serverSmartObjects[i].methods))
                        {
                            // assuming only a single property
                            var methodName = errorMethods[0].name;

                            if (checkExists(serverSmartObjects[i].methods.findByKey(methodName))) // if the property has been returned from the server
                            {
                                serverSmartObjects[i].methods[methodName].validationStatus = errorSmartObject.methods[methodName].validationStatus;
                                serverSmartObjects[i].methods[methodName].validationMessages = errorSmartObject.methods[methodName].validationMessages;
                            }
                            else
                            {
                                serverSmartObjects[i].methods[methodName] = errorSmartObject.methods[methodName];
                            }
                        }
                        else
                        {
                            serverSmartObjects[i].methods = errorSmartObject.methods;
                        }
                    }
                }
            }

            if (!smoFound)
            {
                serverSmartObjects.push(errorSmartObject);
            }
        }
    },

    /**
    * Gets a list of dependent items (as returned by findReferences function) and removes these items
    * from the definition xml.
    * 
    * @param {object[]} references List of references being removed with its list of dependent items (as returned by findReferences function) to remove
    * @param {xmlDocument} xmlDef View or form definition
    * 
    */
    removeDependentItems: function (references, xmlDef)
    {
        var allItemsRemoved = [];
        var itemsRemoved = [];
        var refItem = null;
        var i = 0;
        var j = 0;
        for (i = 0; i < references.length; i++)
        {
            var ref = references[i];
            var dependentItems = ref.items;

            for (j = 0; j < dependentItems.length; j++)
            {
                itemsRemoved = [];
                refItem = dependentItems[j];
                switch (refItem.referenceAs)
                {
                    case this.ReferenceAs.PropertyExpressionSource:
                    case this.ReferenceAs.PropertyExpressionSourceSubForm:
                        itemsRemoved = this._removePropertyExpressionSource(ref, refItem, xmlDef);
                        break;
                    case this.ReferenceAs.SourceMapping:
                        itemsRemoved = this._removeSourceValueMapping(ref, refItem, xmlDef);
                        break;
                    case this.ReferenceAs.ParameterMappingSource:
                    case this.ReferenceAs.ParameterMappingSourceSubForm:
                    case this.ReferenceAs.ParameterMappingTarget:
                    case this.ReferenceAs.ParameterMappingTargetSubForm:
                    case this.ReferenceAs.ResultMappingSource:
                    case this.ReferenceAs.ResultMappingTarget:
                        itemsRemoved = this._removeMapping(ref, refItem, xmlDef);
                        break;
                    case this.ReferenceAs.ControlPropertyExpression:
                        itemsRemoved = this._removeControlPropertyExpression(ref, refItem, xmlDef);
                        break;
                    case this.ReferenceAs.ControlField:
                    case this.ReferenceAs.PropertyValueProperty:
                        itemsRemoved = this._removeControlField(ref, refItem, xmlDef);
                        break;
                    case this.ReferenceAs.EventSource:
                        itemsRemoved = this._alterEventSourceToEventless(ref, refItem, xmlDef);
                        break;
                    case this.ReferenceAs.ActionControl:
                    case this.ReferenceAs.ActionMethod:
                    case this.ReferenceAs.ActionRule:
                    case this.ReferenceAs.ActionRuleSubForm:
                    case this.ReferenceAs.ActionObject:
                        itemsRemoved = this._removeActionObject(ref, refItem, xmlDef);
                        break;
                    case this.ReferenceAs.PropertyParentControl:
                        itemsRemoved = this._removeParentControlReferences(ref, refItem, xmlDef);
                        break;
                    case this.ReferenceAs.ValidationGroupControlControl:
                        itemsRemoved = this._removeValidationGroupControlMapping(ref, refItem, xmlDef);
                        break;
                    case this.ReferenceAs.PropertyAssociationObject:
                        itemsRemoved = this._removePropertyAssociation(ref, refItem, xmlDef);
                        break;
                    case this.ReferenceAs.ValidationPattern:
                        itemsRemoved = this._removeValidationPattern(ref, refItem, xmlDef);
                        break;
                }

                if (checkExists(itemsRemoved) && itemsRemoved.length > 0)
                {
                    $.merge(allItemsRemoved, itemsRemoved);
                }
            }
        }

        return allItemsRemoved;
    },

    /**
    * Removes dependent items that were referenced as type PropertyExpressionSource
    * The item could be referenced in a Parameter Mapping, Condition mapping, Conditional Style mapping, Filter mapping, Foreach handler mapping.
    * 
    * @param {object} reference The main object that is getting removed, containing all references to it (from findReferences)
    * @param {object} refItem The specific dependent item referenced as type PropertyExprssionSource that needs to get removed from definition
    * @param {xmlDocument} xmlDef The view or form definition xml.
    */
    _removePropertyExpressionSource: function (reference, refItem, xmlDef)
    {
        if (!checkExists(refItem) || !checkExists(refItem.item))
        {
            return [];
        }

        var item = refItem.item;

        var itemsRemoved = [];
        var itemsUnconfigured = [];
        var referencesToAnnotate = [];

        if (!checkExists(this._getParentFromItem(item, this.ReferenceType.ControlExpression)))
        {
            //Property expression source could be of type condition, conditional style, expression parameter mapping for a rule or filter
            if (checkExists(this._getParentFromItem(item, this.ReferenceType.ParameterMapping)))
            {
                //Property expression source for a parameter mapping:
                itemsRemoved = this._removeMapping(reference, refItem, xmlDef);
            }
            else if (checkExists(this._getParentFromItem(item, this.ReferenceType.Condition)) &&
            checkExists(this._getParentFromItem(item, this.ReferenceType.Handler)))
            {
                if (checkExists(this._getParentFromItem(item, this.ReferenceType.ConditionProperty)))
                {
                    // Condition Property
                    itemsRemoved = this._removeConditionPropertyMapping(reference, refItem, xmlDef);
                }
                else
                {
                    //Expression mapping in condition
                    itemsRemoved = this._removeConditionExpressionMapping(reference, refItem, xmlDef);
                }
            }
            else if (checkExists(this._getParentFromItem(item, this.ReferenceType.ConditionalStyle)))
            {
                //Item mapping in conditional style
                itemsRemoved = this._removeConditionalStyleExpressionMapping(reference, refItem, xmlDef);
            }
            else if (checkExists(this._getParentFromItem(item, this.ReferenceType.Filter)))
            {
                //Item mapping filter
                itemsRemoved = this._removeFilterExpressionMapping(reference, refItem, xmlDef);
            }
            else if (checkExists(this._getParentFromItem(item, this.ReferenceType.SubFormPopupAction)))
            {
                itemsRemoved = this._removeSubFormPropertyActionMapping(reference, refItem, xmlDef);
            }
            else if (checkExists(this._getParentFromItem(item, this.ReferenceType.HandlerFunction)))
            {
                //Mapping in handler function (for-each handler function)
                itemsRemoved = this._clearHandlerFunctionMapping(reference, refItem, xmlDef);
            }
            return itemsRemoved;
        }

        //For nested expressions, get parent control expression (child expressions won't have an ID)
        var expressionItem = this._getParentFromItem(item, this.ReferenceType.ControlExpression);
        if (!checkExists(expressionItem.id))
        {
            return [];
        }

        //Get mappings of removedObj in expression:
        var expressionRootPath = "//Expressions/Expression[@ID='{0}']".format(expressionItem.id);
        var expressionRoot = xmlDef.selectSingleNode(expressionRootPath);

        if (!checkExists(expressionRoot))
        {
            return [];
        }

        var xmlElement = item.xmlNode;
        var xmlElemParent = xmlElement.parentNode;
        var parentFunctionNode = SourceCode.Forms.ExpressionXmlHelper.getParentFunctionForItemNode(xmlElement);
        var paramRequired = true;

        if (checkExists(parentFunctionNode))
        {
            var requiredParams = SourceCode.Forms.ExpressionXmlHelper.getRequiredFunctionParamsForExpressionFn(parentFunctionNode);
            var actualParams = parentFunctionNode.selectNodes("./*");  //Select all children of the node

            if (requiredParams.length < actualParams.length)
            {
                paramRequired = false;
            }
        }
        else
        {
            paramRequired = false;
        }

        if (!paramRequired)
        {
            itemsRemoved.push(
            {
                id: item.id,
                type: item.type,
                name: item.name
            });

            xmlElemParent.removeChild(xmlElement);

            this.refreshExpressionAnnotations(xmlDef, expressionItem.id);

            //Cleanup empty sourcevalue or item parents
            //Item could be contained in a SourceValue node, which also needs to be removed if empty
            if (xmlElemParent.nodeName.toLowerCase() === "sourcevalue" && xmlElemParent.selectNodes(".//Item").length === 0)
            {
                var sourceValueParent = xmlElemParent.parentNode;
                sourceValueParent.removeChild(xmlElemParent);
                //SourceValue node could be contained in an <Item Type='Value'> node, if this node is empty, remove:
                if (sourceValueParent.nodeName.toLowerCase() === "item" && sourceValueParent.selectNodes("./*").length === 0)
                {
                    var itemParentNode = sourceValueParent.parentNode;
                    itemParentNode.removeChild(sourceValueParent);
                }
            }
        }

        //Check if expression is empty, remove if empty:
        if (expressionRoot.selectNodes(".//Item").length === 0)
        {
            //Find references to expression
            var expRefObj =
            {
                id: expressionItem.id,
                type: expressionItem.type,
                name: expressionItem.name
            };

            //Remove expression
            var expressionParent = expressionRoot.parentNode;
            expressionParent.removeChild(expressionRoot);

            itemsRemoved.push(expRefObj);
        }
        else
        {
            if (paramRequired)
            {
                var newReference =
                {
                    id: reference.id,
                    type: reference.type,
                    name: reference.name,
                    displayName: reference.displayName,
                    items: []
                };

                newReference.items.push(refItem);

                this.updateAnnotations(xmlDef, [newReference]);
            }

            SourceCode.Forms.ExpressionPreviewHelper.generateDisplayPreviewForExpressions(expressionRoot);
        }

        return itemsRemoved;
    },

    _removeMapping: function (reference, refItem, xmlDef)
    {
        if (!checkExists(refItem) || !checkExists(refItem.item))
        {
            return [];
        }

        var item = refItem.item;
        var itemsRemoved = [];

        var xmlElement = item.xmlNode;
        var xmlElemParent = xmlElement.parentNode;
        var paramIsRequired = xmlElement.getAttribute("IsRequired");

        if (!checkExistsNotEmpty(paramIsRequired) || (paramIsRequired.toUpperCase() !== "TRUE"))
        {
            itemsRemoved.push(
            {
                id: item.id,
                name: item.name,
                type: item.type
            });

            if (checkExists(xmlElemParent))
            {
                var actionNode = xmlElement.selectSingleNode("./ancestor::Action");

                //If the xmlNode still existing in the definition xml, it should have a parentNode.
                //If not, it means the node had removed already.
                //The findreference() could potentially build up the tree object to have duplicate items
                //e.g. ResultMappingSource and TargetMappingSource items may both point to the same xmlNode <Result>
                xmlElemParent.removeChild(xmlElement);

                if (checkExists(actionNode))
                {
                    this.refreshMappingAnnotationForAction(actionNode);
                }
            }
        }
        else
        {
            var newReference =
            {
                id: reference.id,
                type: reference.type,
                items: []
            };

            newReference.items.push(refItem);

            this.updateAnnotations(xmlDef, [newReference]);
        }

        return itemsRemoved;
    },

    _removeSourceValueMapping: function (reference, refItem, xmlDef)
    {
        if (!checkExists(refItem) || !checkExists(refItem.item) || !checkExists(refItem.item.xmlNode))
        {
            return [];
        }

        var item = refItem.item;
        var itemsRemoved = [];

        var xmlElement = item.xmlNode;
        var xmlElemParent = xmlElement.parentNode;
        var paramElem = xmlElement;

        if (xmlElement.nodeName !== "Parameter")
        {
            //The refItem could be a Source node contained within Parameter node
            paramElem = xmlElement.selectSingleNode("./ancestor::Parameter");
            if (!checkExists(paramElem))
            {
                return [];
            }
        }

        var paramIsRequired = paramElem.getAttribute("IsRequired");

        if (!checkExistsNotEmpty(paramIsRequired) || (paramIsRequired.toUpperCase() !== "TRUE"))
        {
            var actionNode = xmlElement.selectSingleNode("./ancestor::Action");

            xmlElemParent.removeChild(xmlElement);

            //If the Parameter node will be empty after removal of mapping, entire Parameter node needs to be removed
            if (checkExists(paramElem) && paramElem.selectNodes(".//Source").length === 0)
            {
                paramElem.parentNode.removeChild(paramElem);
            }

            itemsRemoved.push(
            {
                id: item.id,
                name: item.name,
                type: item.type
            });

            if (checkExists(xmlElemParent) && checkExists(actionNode))
            {
                this.refreshMappingAnnotationForAction(actionNode);
            }
        }
        else
        {
            var newReference =
            {
                id: reference.id,
                type: reference.type,
                items: []
            };

            newReference.items.push(refItem);

            this.updateAnnotations(xmlDef, [newReference]);
        }

        return itemsRemoved;
    },

    _removeConditionExpressionMapping: function (reference, refItem, xmlDef)
    {
        if (!checkExists(refItem) || !checkExists(refItem.item))
        {
            return [];
        }

        var item = refItem.item;
        var xmlElement = item.xmlNode;
        var eventsRemoved = [];

        var expressionsNode = xmlElement.selectSingleNode("./ancestor::Expressions");
        if (!checkExists(expressionsNode))
        {
            return [];
        }
        var eventNode = expressionsNode.selectSingleNode("./ancestor::Event");
        if (!checkExists(eventNode))
        {
            return [];
        }

        xmlElement.removeAttribute("SourceName");
        xmlElement.removeAttribute("SourceDisplayName");
        xmlElement.removeAttribute("SourceID");

        var newReference =
        {
            id: reference.id,
            type: reference.type,
            items: [],
            status: "Required"
        };

        newReference.items.push(refItem);

        this.updateAnnotations(xmlDef, [newReference]);
    },

    _removeConditionalStyleExpressionMapping: function (reference, refItem, xmlDef)
    {
        if (!checkExists(refItem) || !checkExists(refItem.item))
        {
            return [];
        }

        var item = refItem.item;

        var itemsRemoved = [];

        var xmlElement = item.xmlNode;
        var paramRequired = this._isParamRequiredForFunction(xmlElement);

        var controlNode = xmlElement.selectSingleNode("./ancestor::Control");

        if (!paramRequired)
        {
            var xmlElemParent = xmlElement.parentNode;

            if (checkExists(xmlElemParent))
            {
                //Only remove the mapping
                xmlElemParent.removeChild(xmlElement);
            }
        }
        else
        {
            var styleEl = xmlElement.selectSingleNode("./ancestor::ConditionalStyle");
            if (!checkExists(styleEl))
            {
                return itemsRemoved;
            }

            this._removeEntireConditionFromConditions(xmlElement);

            //If conditional style is empty after removal, remove entire style
            var stylesEl = styleEl.selectSingleNode("./ancestor::ConditionalStyles");
            if (!checkExists(stylesEl))
            {
                return itemsRemoved;
            }
            var itemsInStyle = styleEl.selectNodes(".//Item");

            if (itemsInStyle.length === 0)
            {
                stylesEl.removeChild(styleEl);
                var conditionalStyle = this._getParentFromItem(item, this.ReferenceType.ConditionalStyle);

                itemsRemoved.push(
                {
                    id: conditionalStyle.id,
                    name: conditionalStyle.name,
                    type: conditionalStyle.type
                });
            }
        }

        this.removeInvalidConditionalStylesAnnotationForControl(controlNode);

        return itemsRemoved;
    },

    _removeConditionPropertyMapping: function (reference, refItem, xmlDef)
    {
        if (!checkExists(refItem) || !checkExists(refItem.item))
        {
            return [];
        }

        var item = refItem.item;

        var itemsRemoved = [];

        var propertyItem = this._getParentFromItem(item, this.ReferenceType.ConditionProperty);

        if (!checkExists(propertyItem) ||
        !checkExists(propertyItem.xmlNode) ||
        propertyItem.xmlNode.nodeName !== "Property")
        {
            return itemsRemoved;
        }

        var propertyNode = propertyItem.xmlNode;

        var valueNode = propertyNode.selectSingleNode("Value");

        if (!checkExists(valueNode))
        {
            return itemsRemoved;
        }

        var valueXml = parseXML("<SourceValue>{0}</SourceValue>".format(valueNode.text));

        var xmlElement = item.copiedXmlNode;

        //Get item node from the source value xml:
        var itemNode = null;
        if (xmlElement.getAttribute("SourceType") === this.ReferenceType.ControlProperty)
        {
            //If the Item node has ControlProperty as source type, it should use the Source info for the annotation
            itemNode = valueXml.selectSingleNode(".//Source[@SourceType='ControlProperty' and @SourcePath='{0}']"
            .format(xmlElement.getAttribute("SourcePath")));
        }
        else
        {
            itemNode = valueXml.selectSingleNode(".//Source[@SourceID='{0}']"
            .format(xmlElement.getAttribute("SourceID")));
        }

        var xmlElemParent = itemNode.parentNode;
        if (checkExists(xmlElemParent))
        {
            //Only remove the mapping
            xmlElemParent.removeChild(itemNode);
        }
        else
        {
            //If it was the only item, set the XML to be empty
            xmlElemParent = null;
        }

        valueNode.childNodes[0].nodeValue = checkExists(xmlElemParent) ? xmlElemParent.xml.replace(/<\/?SourceValue>/ig, "") : "";

        return itemsRemoved;
    },

    _removeFilterExpressionMapping: function (reference, refItem, xmlDef)
    {
        if (!checkExists(refItem) || !checkExists(refItem.item))
        {
            return [];
        }

        var item = refItem.item;

        var itemsRemoved = [];

        var actionItem = this._getParentFromItem(item, this.ReferenceType.Action);

        if (!checkExists(actionItem) ||
        !checkExists(actionItem.xmlNode) ||
        actionItem.xmlNode.nodeName !== this.ReferenceType.Action)
        {
            return itemsRemoved;
        }

        var actionNode = actionItem.xmlNode;

        var propertyNode = actionNode.selectSingleNode("Properties/Property[Name='Filter']");

        if (!checkExists(propertyNode))
        {
            return itemsRemoved;
        }

        var valueNode = propertyNode.selectSingleNode("Value");

        if (!checkExists(valueNode))
        {
            return itemsRemoved;
        }

        var filterXml = parseXML(valueNode.text);

        var xmlElement = item.copiedXmlNode;
        var paramRequired = this._isParamRequiredForFunction(xmlElement);

        //Get item node from the filterXml:
        var itemNode = null;
        if (xmlElement.getAttribute("SourceType") === this.ReferenceType.ControlProperty)
        {
            //If the Item node has ControlProperty as source type, it should use the Source info for the annotation
            itemNode = filterXml.selectSingleNode(".//Item[@SourceType='ControlProperty' and @SourcePath='{0}']"
            .format(xmlElement.getAttribute("SourcePath")));
        }
        else
        {
            itemNode = filterXml.selectSingleNode(".//Item[@SourceID='{0}']"
            .format(xmlElement.getAttribute("SourceID")));
        }

        if (!paramRequired)
        {
            var xmlElemParent = itemNode.parentNode;
            if (checkExists(xmlElemParent))
            {
                //Only remove the mapping
                xmlElemParent.removeChild(itemNode);
            }
        }
        else
        {
            this._removeEntireConditionFromConditions(itemNode);

            //If filter is empty after removal, remove filter action property
            var itemsInFilter = filterXml.selectNodes(".//Item");
            if (itemsInFilter.length === 0)
            {
                actionNode.selectSingleNode("Properties").removeChild(propertyNode);

                //Remove validation message on property node that is no longer valid
                //Only remove filter validation message

                var filterItem = this._getParentFromItem(item, this.ReferenceType.Filter);

                itemsRemoved.push(
                {
                    id: filterItem.id,
                    name: filterItem.name,
                    type: filterItem.type
                });
            }
        }

        valueNode.childNodes[0].nodeValue = filterXml.xml;

        return itemsRemoved;
    },

    _removeSubFormPropertyActionMapping: function (reference, refItem, xmlDef)
    {
        if (!checkExists(refItem) || !checkExists(refItem.item))
        {
            return [];
        }

        var item = refItem.item;

        var itemsRemoved = [];

        var actionItem = this._getParentFromItem(item, this.ReferenceType.Action);

        var actionPropertyItem = this._getParentFromItem(item, this.ReferenceType.ActionProperty);

        var actionNode = actionItem.xmlNode;

        var propertyNode = actionNode.selectSingleNode("Properties/Property[Name='{0}']".format(actionPropertyItem.name));

        if (!checkExists(propertyNode))
        {
            return itemsRemoved;
        }

        var valueNode = propertyNode.selectSingleNode("Value");

        if (!checkExists(valueNode))
        {
            return itemsRemoved;
        }

        var sourceMappingXml = parseXML("<TmpRootNode>{0}</TmpRootNode>".format(valueNode.text));

        var xmlElement = item.copiedXmlNode;

        //Get item node from the sourceMappingXml:
        var itemNode = null;
        if (xmlElement.getAttribute("SourceType") === this.ReferenceType.ControlProperty)
        {
            //If the Item node has ControlProperty as source type, it should use the Source info for the annotation
            itemNode = sourceMappingXml.selectSingleNode(".//Source[@SourceType='ControlProperty' and @SourcePath='{0}']"
            .format(xmlElement.getAttribute("SourcePath")));
        }
        else
        {
            itemNode = sourceMappingXml.selectSingleNode(".//Source[@SourceID='{0}']"
            .format(xmlElement.getAttribute("SourceID")));
        }

        var xmlElemParent = itemNode.parentNode;

        if (checkExists(xmlElemParent))
        {
            xmlElemParent.removeChild(itemNode);
        }

        valueNode.childNodes[0].nodeValue = sourceMappingXml.xml
        .replace("<TmpRootNode>", "")	//Remove start tag
        .replace("</TmpRootNode>", "")	//Remove end tag
        .replace("<TmpRootNode/>", ""); //Remove empty tag

        return itemsRemoved;
    },

    _clearHandlerFunctionMapping: function (reference, refItem, xmlDef)
    {
        if (!checkExists(refItem) || !checkExists(refItem.item))
        {
            return [];
        }

        var item = refItem.item;

        //For handler functions, when removing the function, the child actions must be removed
        var xmlElements;
        var parentNode = item.xmlNode.parentNode;
        var handlerNode = parentNode.selectSingleNode("./ancestor::Handler");
        var handlerItem = this._getParentFromItem(item, this.ReferenceType.Handler);
        if (!checkExists(handlerNode))
        {
            return [];
        }
        var eventNode = handlerNode.selectSingleNode("./ancestor::Event");
        if (!checkExists(eventNode))
        {
            return [];
        }

        // Unconfigure item
        // We do not remove the instanceid nowhere as the rule helper needs to know if its form or view level
        xmlElements = parentNode.selectNodes("Item[@SourceType='View' or @SourceType='Control' or @SourceType='Form']");
        var xmlElementsLength = xmlElements.length;
        for (var x = 0; x < xmlElementsLength; x++)
        {
            var xmlElement = xmlElements[x];
            xmlElement.removeAttribute("SourceID");
            xmlElement.removeAttribute("SourceName");
            xmlElement.removeAttribute("SourceDisplayName");
        }

        var newReference =
        {
            id: reference.id,
            type: reference.type,
            items: [],
            status: "Required"
        };

        newReference.items.push(refItem);

        this.updateAnnotations(xmlDef, [newReference]);
    },

    ///<summary>
    ///This function can be used for when an entire condition needs to be removed for:
    ///conditional styles, filters, conditions
    ///It will remove the entire parent function that contains the mapping
    ///as well as any functions that are empty after the removal
    ///It will also prevent orphan "And" or "Or" nodes from remaining
    ///</summary>
    _removeEntireConditionFromConditions: function (xmlNode)
    {
        if (!checkExists(xmlNode))
        {
            return;
        }

        var xmlElement = xmlNode;

        //Remove entire parentFunction
        var parentFunctionNode = SourceCode.Forms.ExpressionXmlHelper.getParentFunctionForItemNode(xmlElement);
        if (!checkExists(parentFunctionNode))
        {
            return;
        }

        var parentNode = parentFunctionNode.parentNode;
        var parentFunctionOfRemovedFunction = SourceCode.Forms.ExpressionXmlHelper.getParentFunctionForItemNode(parentFunctionNode);

        if (checkExists(parentNode))
        {
            parentNode.removeChild(parentFunctionNode);
        }

        //If removed function was contained in a parent function that is now empty, also remove the parent function
        //Also if parent function was "And" or "Or" and it now only has 1 child, move child to parent function
        //Do so until no more empty parent functions or incomplete And/Or functions are found
        var parentFunctionIsEmpty = false;
        var parentFunctionIsAndOr = false;
        if (checkExists(parentFunctionOfRemovedFunction))
        {
            parentFunctionIsEmpty = parentFunctionOfRemovedFunction.selectNodes(".//Item").length === 0;

            if (!parentFunctionIsEmpty)
            {
                parentFunctionIsAndOr = ["and", "or"].indexOf(parentFunctionOfRemovedFunction.nodeName.toLowerCase()) > -1;
            }
        }

        while (parentFunctionIsEmpty || parentFunctionIsAndOr)
        {
            if (parentFunctionIsEmpty)
            {
                parentNode = parentFunctionOfRemovedFunction.parentNode;
                if (checkExists(parentNode))
                {
                    parentNode.removeChild(parentFunctionOfRemovedFunction);
                }
            }
                //If parent function was "And" or "Or" and it now only has 1 child, move child to it's parent function and remove the And/Or function
            else if (parentFunctionIsAndOr)
            {
                var andOrFn = parentFunctionOfRemovedFunction;
                var andOrParent = andOrFn.parentNode;
                var andOrChildren = andOrFn.selectNodes("./*");
                //No need to check nr of required params for and/or, we know it is 2
                if (checkExists(andOrParent) && andOrChildren.length < 2)
                {
                    var c = 0;
                    for (c = 0; c < andOrChildren.length; c++)
                    {
                        var andOrChild = andOrChildren[c];
                        andOrParent.appendChild(andOrChild);
                    }
                    andOrParent.removeChild(andOrFn);
                }
            }

            parentFunctionOfRemovedFunction = SourceCode.Forms.ExpressionXmlHelper.getParentFunctionForItemNode(parentFunctionOfRemovedFunction);
            if (!checkExists(parentFunctionOfRemovedFunction))
            {
                break;
            }
            parentFunctionIsEmpty = parentFunctionOfRemovedFunction.selectNodes(".//Item").length === 0;
            parentFunctionIsAndOr = ["and", "or"].indexOf(parentFunctionOfRemovedFunction.nodeName.toLowerCase()) > -1;
        }
    },

    _removeControlPropertyExpression: function (reference, refItem, xmlDef)
    {
        if (!checkExists(refItem) || !checkExists(refItem.item))
        {
            return [];
        }

        var item = refItem.item;
        var itemsRemoved = [];

        //Set control expression property back to none:
        var controlExpressionPropertyNode = item.xmlNode;
        var controlItem = this._getParentFromItem(item, this.ReferenceType.Control);
        if (!checkExists(controlItem) && !checkExists(controlItem.id))
        {
            return itemsRemoved;
        }

        var controlNode = xmlDef.selectSingleNode("//Controls/Control[@ID='{0}']".format(controlItem.id));

        //Remove existing annotation for expression:
        SourceCode.Forms.DependencyHelper.removeExpressionAnnotationForControl(controlNode);

        if (!checkExists(controlExpressionPropertyNode) || !checkExists(controlNode))
        {
            return itemsRemoved;
        }

        //Remove control property node:
        controlExpressionPropertyNode.parentNode.removeChild(controlExpressionPropertyNode);
        //Remove control expression attribute:
        if (checkExists(controlNode.getAttribute("ExpressionID")))
        {
            controlNode.removeAttribute("ExpressionID");
        }

        //Since we only removed a property node which will never have dependent items, thus we will always return an empty array here
        return itemsRemoved;
    },

    _removeValidationPattern: function (reference, refItem, xmlDef)
    {
        if (!checkExists(refItem) || !checkExists(refItem.item))
        {
            return [];
        }

        var item = refItem.item;
        var itemsRemoved = [];

        //Set validation pattern back to none:
        var validationPatternNode = item.xmlNode;
        var controlItem = this._getParentFromItem(item, this.ReferenceType.Control);
        if (!checkExists(controlItem) && !checkExists(controlItem.id))
        {
            return itemsRemoved;
        }

        var controlNode = xmlDef.selectSingleNode("//Controls/Control[@ID='{0}']".format(controlItem.id));

        if (!checkExists(validationPatternNode) || !checkExists(controlNode))
        {
            return itemsRemoved;
        }

        //Remove existing annotation for validation pattern:
        SourceCode.Forms.DependencyHelper.removeValidationPatternAnnotationForControl(controlNode);

        //Remove control property node:
        validationPatternNode.parentNode.removeChild(validationPatternNode);
        
        //Since we only removed a property node which will never have dependent items, thus we will always return an empty array here
        return itemsRemoved;
    },

    _removeControlField: function (reference, refItem, xmlDef)
    {
        if (!checkExists(refItem) || !checkExists(refItem.item))
        {
            return [];
        }

        var item = refItem.item;
        var itemsRemoved = [];

        //Set control expression property back to none:
        var controlPropertyNode = item.xmlNode;
        var controlItem = this._getParentFromItem(item, this.ReferenceType.Control);
        if (!checkExists(controlItem) && !checkExists(controlItem.id))
        {
            return itemsRemoved;
        }

        var controlNode = controlItem.xmlNode;

        SourceCode.Forms.DependencyHelper.removeSourceFieldAnnotationForDataLabelRelatedControls(xmlDef, controlNode);

        //Remove existing annotation
        SourceCode.Forms.DependencyHelper.removeSourceFieldAnnotationForControl(controlNode);

        //Remove control property node
        controlPropertyNode.parentNode.removeChild(controlPropertyNode);

        //Remove control field attribute:
        if (checkExists(controlNode.getAttribute("FieldID")))
        {
            controlNode.removeAttribute("FieldID");
        }

        //Since we only removed a property node which will never have dependent items, thus we will always return an empty array here
        return itemsRemoved;
    },

    _removeActionObject: function (reference, refItem, xmlDef)
    {
        if (!checkExists(refItem) || !checkExists(refItem.item))
        {
            return [];
        }

        var actionItem = refItem.item;
        var itemsRemoved = this._deleteActionNodeAndEmptyParents(actionItem);

        return itemsRemoved;
    },

    /**
    * When dependencies to a parent control is removed, all the control properties referencing the
    * parent control needs to be removed. The control referenced should no longer be configured to
    * have a parent control.
    * Any existing annotation on the control for these properties should also get removed.
    * 
    * @param {object} reference The main object that is getting removed, containing all references to it (from findReferences)
    * @param {object} refItem The specific dependent item referenced as type ParentControlProperty that needs to get removed from definition
    * @param {xmlDocument} xmlDef The view or form definition xml.
    * @returns A collection of items that were removed that needs to be checked for dependencies. In this case items removed will
    * always return an empty collection.
    * 
    */
    _removeParentControlReferences: function (reference, refItem, xmlDef)
    {
        if (!checkExists(refItem) || !checkExists(refItem.item))
        {
            return [];
        }

        var itemsRemoved = [];

        //Get control using the referenced control as parent control property
        var referencedControl = this._getParentFromItem(refItem.item, this.ReferenceType.Control);

        if (!checkExists(referencedControl) || !checkExists(referencedControl.xmlNode))
        {
            return [];
        }

        var referencedControlNode = referencedControl.xmlNode;

        var controlPropertiesNode = referencedControlNode.selectSingleNode("./Properties");

        if (!checkExists(controlPropertiesNode))
        {
            return [];
        }

        //Have to remove the following control properties: ParentControl, ParentJoinPropety, ChildJoinProperty
        var propertiesToRemove = ["ParentControl", "ParentJoinProperty", "ChildJoinProperty"];
        var p = 0;
        var resourceSvc = SourceCode.Forms.Services.AnalyzerResourcesService();

        for (p = 0; p < propertiesToRemove.length; p++)
        {
            var propertyToRemove = propertiesToRemove[p];
            var prop = controlPropertiesNode.selectSingleNode("./Property[Name='{0}']".format(propertyToRemove));
            if (checkExists(prop))
            {
                //Remove any existing annotation for this property from referenced control node:
                var valMessage = prop.getAttribute("ValidationMessages");

                var xmlNodeMsgObj = {};

                if (checkExistsNotEmpty(valMessage))
                {
                    //we expect to only have one validation message for this node
                    xmlNodeMsgObj = resourceSvc.parseValidationMessage(valMessage)[0];

                    var annotationToRemove = {
                        type: xmlNodeMsgObj.type,
                        all: true
                    };

                    this.removeAnnotation(referencedControlNode, annotationToRemove);
                }

                //Remove the property node:
                controlPropertiesNode.removeChild(prop);
            }
        }

        //As only control properties are removed, itemsRemoved should be empty
        return itemsRemoved;
    },

    _removeValidationGroupControlMapping: function (reference, refItem, xmlDef)
    {
        if (!checkExists(refItem) || !checkExists(refItem.item) || !checkExists(refItem.item.xmlNode))
        {
            return [];
        }

        var itemsRemoved = [];

        var valGroupControlToRemoveNode = refItem.item.xmlNode;
        var valGroupControlsNode = valGroupControlToRemoveNode.parentNode;

        if (valGroupControlsNode.selectNodes(".//ValidationGroupControl").length > 1)
        {
            //Only remove the control mapping from validation group controls
            valGroupControlsNode.removeChild(valGroupControlToRemoveNode);
            itemsRemoved.push(
            {
                id: refItem.item.id,
                name: refItem.item.name,
                type: refItem.item.type
            });
        }
        else
        {
            //Required mapping, don't remove, annotate
            var newReference =
            {
                id: reference.id,
                type: reference.type,
                items: []
            };

            newReference.items.push(refItem);

            this.updateAnnotations(xmlDef, [newReference]);
        }

        return itemsRemoved;
    },

    _removePropertyAssociation: function (reference, refItem, xmlDef)
    {
        if (!checkExists(refItem) || !checkExists(refItem.item) || !checkExists(refItem.item.xmlNode))
        {
            return [];
        }

        var itemsRemoved = [];

        //Remove the property association
        var propAssociationNode = refItem.item.xmlNode;
        var assocPropertiesNode = propAssociationNode.selectSingleNode("./ancestor::Props");
        var associationNode = assocPropertiesNode.selectSingleNode("./ancestor::Assoc");
        if (!checkExists(assocPropertiesNode) || !checkExists(propAssociationNode))
        {
            return [];
        }
        assocPropertiesNode.removeChild(propAssociationNode);
        //By adding 'edited' as status, the SMODesigner class will update the association globally
        associationNode.setAttribute("status", "edited");
        itemsRemoved.push(refItem.item);

        //If association contains no more properties, remove entire association
        if (assocPropertiesNode.selectNodes("Prop").length === 0)
        {
            //Remove by adding 'deleted' attribute, the SMODesigner class will do global remove
            associationNode.setAttribute("status", "deleted");
            var associationItem = this._getParentFromItem(refItem.item, this.ReferenceType.ObjectDefinitionAssociation);
            if (checkExists(associationItem))
            {
                itemsRemoved.push(associationItem);
            }
        }

        return itemsRemoved;
    },

    _deleteActionNodeAndEmptyParents: function (actionItem)
    {
        var itemsRemoved = [];
        var actionNode = actionItem.xmlNode;
        var actionsNode = actionNode.parentNode;

        if (checkExists(actionsNode))
        {
            itemsRemoved.push(
            {
                id: actionItem.id,
                type: actionItem.type
            });

            actionsNode.removeChild(actionItem.xmlNode);
        }

        //Action node is removed, if handler is annotated for this action, also remove this specific annotation:
        var handlerItem = this._getParentFromItem(actionItem, this.ReferenceType.Handler);
        var handlerNode = handlerItem.xmlNode;

        var annotationToRemove = {
            type: this.ReferenceType.Action,
            guid: actionItem.id
        };
        this.removeAnnotation(handlerNode, annotationToRemove);

        var handlerActions = handlerItem.xmlNode.selectNodes(".//Action");

        //Handler has no actions left, so remove handler as well
        if (handlerActions.length === 0)
        {
            var handlersNode = handlerItem.xmlNode.parentNode;

            if (checkExists(handlersNode))
            {
                //It is possible that handlersNode was already removed by other Action item dependencies e.g. an action item dependencies that is using a SmartObject
                //Thus we need to check if the handlersNode still exists
                handlersNode.removeChild(handlerItem.xmlNode);
            }

            var eventItem = this._getParentFromItem(handlerItem, this.ReferenceType.Event);
            var eventNode = eventItem.xmlNode;

            if (checkExists(eventNode))
            {
                //Handler node is removed, if event is annotated for this handler, also remove this specific annotation:
                annotationToRemove = {
                    type: this.ReferenceType.Handler,
                    guid: handlerItem.id
                };

                this.removeAnnotation(eventNode, annotationToRemove);
                var eventHandlers = eventNode.selectNodes(".//Handler");

                //Event has no handlers left, so remove event as well
                if (eventHandlers.length === 0)
                {
                    var eventParent = eventNode.parentNode;

                    if (checkExists(eventParent))
                    {
                        itemsRemoved.push(
                        {
                            id: eventItem.id,
                            type: eventItem.type,
                            name: eventItem.name,
                            definitionId: eventNode.getAttribute("DefinitionID"),
                            instanceId: eventNode.getAttribute("InstanceID")
                        });

                        eventParent.removeChild(eventNode);
                    }
                }
            }
        }

        return itemsRemoved;
    },

    _isParamRequiredForFunction: function (itemNodeToRemove)
    {
        var isRequired = true;

        var parentFunctionNode = SourceCode.Forms.ExpressionXmlHelper.getParentFunctionForItemNode(itemNodeToRemove);

        if (checkExists(parentFunctionNode))
        {
            var requiredParams = SourceCode.Forms.ExpressionXmlHelper.getRequiredFunctionParamsForExpressionFn(parentFunctionNode);
            var actualParams = parentFunctionNode.selectNodes("./*");
            if (requiredParams.length < actualParams.length)
            {
                isRequired = false;
            }
            //If item to remove is part of a collection of items under a sourcevalue node,
            //and there will be items left in this collection after removing item, item is not required:
            var xmlElemParent = itemNodeToRemove.parentNode;
            if (xmlElemParent.nodeName === "SourceValue" && xmlElemParent.selectNodes("Item").length > 1)
            {
                isRequired = false;
            }
        }

        return isRequired;
    },

    _isFilterItemReferencingObjectProperty: function (referenceObj, filterItemNode, filterValueNode)
    {
        var xpath = "";
        var flag = false;

        if (!checkExists(referenceObj) ||
        !checkExists(filterItemNode) ||
        !checkExists(filterValueNode) ||
        referenceObj.type !== this.ReferenceType.ViewField)
        {
            return false;
        }

        var actionNode = filterValueNode.selectSingleNode("./ancestor::Action");

        if (!checkExists(actionNode))
        {
            return false;
        }

        var itemSourceType = filterItemNode.getAttribute("SourceType");
        var itemSourceId = filterItemNode.getAttribute("SourceID");

        if (!checkExistsNotEmpty(itemSourceType) || !checkExistsNotEmpty(itemSourceId))
        {
            return false;
        }

        itemSourceType = itemSourceType.toLowerCase();

        if (itemSourceType !== "objectproperty" && itemSourceType !== "viewfield")
        {
            return false;
        }

        if (checkExistsNotEmpty(referenceObj.sourceId) && checkExistsNotEmpty(referenceObj.contextId))
        {
            xpath = "Properties[Property[Name='ControlID' and Value='{0}'] and Property[Name='ObjectID' and Value='{1}']]".format(referenceObj.contextId, referenceObj.sourceId);

            flag = checkExists(actionNode.selectSingleNode(xpath)) && itemSourceId === referenceObj.name && itemSourceType === "objectproperty";
        }

        if (!flag)
        {
            //Field dependencies can use fieldname or fieldid
            flag = (itemSourceType === "objectproperty" && itemSourceId === referenceObj.name) || (itemSourceType === "viewfield" && itemSourceId === referenceObj.id);
        }

        return flag;
    },

    isTypeContainerControl: function (controlType)
    {
        var containerTypes = [this.ReferenceType.Cell, this.ReferenceType.Column, this.ReferenceType.Panel,
        this.ReferenceType.Row, this.ReferenceType.Table, this.ReferenceType.AreaItem];
        return containerTypes.indexOf(controlType) > -1;
    },

    isTypSubFormReference: function (referenceType)
    {
        var refAs = this.ReferenceAs;
        var subFormTypes = [refAs.ActionRuleSubForm, refAs.ParameterMappingSourceSubForm,
        refAs.ParameterMappingTargetSubForm, refAs.PropertyExpressionSourceSubForm,
        refAs.ResultMappingSourceSubForm, refAs.ResultMappingTargetSubForm];
        return subFormTypes.indexOf(referenceType) > -1;
    },

    hasValidationStatusError: function (xmlNode, errorStatuses)
    {
        if (!checkExists(xmlNode))
        {
            return false;
        }

        var hasValidationError = false;

        var validationStatus = xmlNode.getAttribute("ValidationStatus");
        if (!checkExistsNotEmpty(validationStatus))
        {
            return false;
        }

        if (!checkExists(errorStatuses))
        {
            errorStatuses = ["Error", "Warning", "Missing"];
        }

        var e = 0;
        for (e = 0; e < errorStatuses.length; e++)
        {
            if (validationStatus.indexOf(errorStatuses[e]) > -1)
            {
                hasValidationError = true;
                break;
            }
        }

        return hasValidationError;
    },

    /// <summary>
    /// Given an event, for which something it was dependent on was removed, change the rule to be an eventless rule
    /// Note that this also must change the Definition Guid
    ///</summary>
    _alterEventSourceToEventless: function (reference, refItem, xmlDef)
    {
        if (!checkExists(refItem) || !checkExists(refItem.item))
        {
            return [];
        }

        var item = refItem.item;
        var itemsRemoved = [];

        var eventItem = this._getParentFromItem(item, this.ReferenceType.Event);
        if (!checkExists(eventItem) && !checkExists(eventItem.id) && !checkExists(eventItem.xmlNode))
        {
            return itemsRemoved;
        }

        this._alterEventXml(eventItem.xmlNode, xmlDef);

        return itemsRemoved;
    },

    _alterEventXml: function (event, xmlDef) {
        // set IsCustomName to true
        SourceCode.Forms.Designers.Common.applyCustomNameToEvent(event);

        // update rule location
        this.updateRuleLocation(event, xmlDef);

        // mark the Event as Eventless
        var nameNode = event.selectSingleNode("Name");
        nameNode.removeChild(nameNode.childNodes[0]);
        var newName = event.ownerDocument.createTextNode(String.generateGuid());
        nameNode.appendChild(newName);

        event.setAttribute("SourceType", "Rule");
        event.setAttribute("SourceName", "Rule");
        event.setAttribute("DefinitionID", String.generateGuid());
        event.setAttribute("SourceID", SourceCode.Forms.Designers.Common.getDefinitionNode().getAttribute("ID"));
        event.removeAttribute("InstanceID");
        event.removeAttribute("IsReference");
        event.removeAttribute("IsInherited");
    },

    // Updates rule location
    updateRuleLocation: function (eventXml, defXml)
    {
        var isForm = checkExists(defXml.selectSingleNode(".//Form/Name"));
        var locationName = isForm ? defXml.selectSingleNode(".//Form/Name").text : defXml.selectSingleNode(".//View/Name").text;
        var locationNode = eventXml.selectSingleNode("Properties/Property[Name='Location']/Value");

        locationNode.removeChild(locationNode.childNodes[0]);

        var newLocation = eventXml.ownerDocument.createTextNode(locationName);
        locationNode.appendChild(newLocation);

        // if its a view rule on a form that is getting unbound, replace ViewID with FormID property
        var viewIdProp = eventXml.selectSingleNode("Properties/Property[Name='ViewID']");

        if (isForm && checkExists(viewIdProp))
        {
            //Remove old ViewID
            var viewIdNode = eventXml.selectSingleNode("Properties/Property[Name='ViewID']");
            viewIdNode.parentNode.removeChild(viewIdNode);

            // remove inherited actions if view is deleted
            this.removeInheritedViewActions(eventXml);
        }
    },

    removeInheritedViewActions: function (eventXml)
    {
        var instanceID = eventXml.getAttribute("InstanceID");
        var inheritedActions = eventXml.selectNodes(".//Action[@InstanceID='{0}'][(@IsReference or @IsReference='True')]".format(instanceID));
        var actionsElem;
        var actionElem;
        var x;

        for (x = 0; x < inheritedActions.length; x++)
        {
            actionElem = inheritedActions[x];
            actionsElem = actionElem.parentNode;
            if (checkExists(actionsElem))
            {
                actionsElem.removeChild(actionElem);
            }
        }
    },

    getEventsThatHasOnlyInheritedViewActions: function (instanceId, defXml)
    {
        var eventNodes = defXml.selectNodes(".//Events/Event[@Type='User' and @InstanceID='{0}' and @IsReference='True']".format(instanceId));

        var e = 0;
        var i = 0;
        var j = 0;
        var clonedEventNode = null;
        var handlerNode = null;

        var handlers = [];
        var nodes = [];

        var nonExtendedInheritedEvents = [];

        for (e = 0; e < eventNodes.length; e++)
        {
            clonedEventNode = eventNodes[e].cloneNode(true);

            handlers = clonedEventNode.selectNodes(".//Handler[@IsReference='True' and @IsInherited='True']");

            for (i = 0; i < handlers.length; i++)
            {
                handlerNode = handlers[i];
                nodes = handlerNode.selectNodes(".//Action[@IsReference='True' and @IsInherited='True']");

                for (j = 0; j < nodes.length; j++)
                {
                    nodes[j].parentNode.removeChild(nodes[j]);
                }

                nodes = handlerNode.selectNodes(".//Condition[@IsReference='True' and @IsInherited='True']");

                for (j = 0; j < nodes.length; j++)
                {
                    nodes[j].parentNode.removeChild(nodes[j]);
                }
            }

            nodes = clonedEventNode.selectNodes(".//Handler[count(Actions/Action)=0 and count(Conditions/Condition)=0]");

            for (j = 0; j < nodes.length; j++)
            {
                nodes[j].parentNode.removeChild(nodes[j]);
            }

            handlers = clonedEventNode.selectNodes(".//Handler");

            if (handlers.length === 0)
            {
                var eventObj =
                {
                    definitionId: eventNodes[e].getAttribute("DefinitionID"),
                    instanceId: instanceId,
                    itemType: SourceCode.Forms.DependencyHelper.ReferenceType.Event
                };

                nonExtendedInheritedEvents.push(eventObj);
            }
        }

        return nonExtendedInheritedEvents;
    },

    /**
    * Will return the correct resource text for an unresolved item,
    * according to item type.
    * This could be used for mapping items that have a SourceType attribute.
    * 
    * @example sourceType of "Control" will return resource text like "Unresolved Control"
    * 
    * @param {text} sourceType Type of mapping, taken from SourceType attribute in mapping xml element.
    * 
    */
    getUnresolvedResourceText: function (sourceType)
    {
        var text = "";
        switch (sourceType.toLowerCase())
        {
            case "control":
                text = Resources.ExpressionBuilder.UnresolvedObjectTextControlText;
                break;
            case "controlproperty":
                text = Resources.ExpressionBuilder.UnresolvedObjectTextControlPropertyText;
                break;
            case "expression":
                text = Resources.ExpressionBuilder.UnresolvedObjectTextExpressionText;
                break;
            case "environmentfield":
                text = Resources.ExpressionBuilder.UnresolvedObjectTextEnvironmentFieldText;
                break;
            case "viewfield":
                text = Resources.ExpressionBuilder.UnresolvedObjectTextViewFieldText;
                break;
            case "viewparameter":
                text = Resources.ExpressionBuilder.UnresolvedObjectTextViewParameterText;
                break;
            case "formparameter":
                text = Resources.ExpressionBuilder.UnresolvedObjectTextFormParameterText;
                break;
            case "systemvariable":
                text = Resources.ExpressionBuilder.UnresolvedObjectTextSystemVariableText;
                break;
            case "object":
                text = Resources.ExpressionBuilder.UnresolvedObjectTextObjectText;
                break;
            default:
                text = Resources.ExpressionBuilder.UnresolvedUnknownItemText;
                break;
        }

        return text;
    },

    /**
    * Will return the main validation status in order of precedence,
    * can be used for styling, e.g. of a token
    * 
    * @example validationstatus of "Auto,Warning,Error" will return "Error"
    * 
    * @param {string} validationStatus Validation status of node as annotated
    * 
    */
    getMainValidationStatus: function (validationStatus)
    {
        var status = "";

        if (!checkExistsNotEmpty(validationStatus))
        {
            return status;
        }
        if (validationStatus.indexOf(",") === -1)
        {
            return validationStatus;
        }

        if (validationStatus.indexOf("Missing") > -1)
        {
            status = "Missing";
        }
        else if (validationStatus.indexOf("Error") > -1)
        {
            status = "Error";
        }
        else if (validationStatus.indexOf("Warning") > -1)
        {
            status = "Warning";
        }
        else
        {
            statuses = validationStatus.split(",");
            if (statuses.length > 0)
            {
                status = statuses[0];
            }
        }

        return status;
    },

    isViewInstanceActionItem: function (referenceObj, referenceAs)
    {
        var flag = false;

        if (checkExists(referenceObj) &&
        referenceObj.type === this.ReferenceType.View)
        {
            switch (referenceAs)
            {
                case this.ReferenceAs.ActionMethod:
                case this.ReferenceAs.ActionObject:
                case this.ReferenceAs.ActionControl:
                    flag = true;
                    break;
            }
        }

        return flag;
    },

    isExtendedViewRule: function (annotationContextObj)
    {
        if (!checkExists(annotationContextObj))
        {
            return false;
        }

        var referenceObj = annotationContextObj.referenceObj;
        var referenceAs = annotationContextObj.referenceAs;
        var item = annotationContextObj.referenceItem;

        var flag = false;

        if (checkExists(referenceObj) && referenceObj.type === this.ReferenceType.View)
        {
            if (referenceAs === this.ReferenceAs.EventSource && item.type === this.ReferenceType.Event)
            {
                var hasInstanceID = item.xmlNode.getAttribute("InstanceID") === referenceObj.id;
                var isReferenceEv = checkExists(item.xmlNode.getAttribute("IsReference"));

                if (hasInstanceID && isReferenceEv)
                {
                    var hasExtendedActions = item.xmlNode.selectNodes(".//Action[(not(@IsReference) or @IsReference='False')]");

                    if (hasExtendedActions.length > 0)
                    {
                        flag = true;
                    }
                }
            }
        }

        return flag;
    },

    /**
    * Will replace references to a specified item, with the references to a new item globally in the supplied definition
    * 
    * @param {xmlDocument} xmlDefinition The view or form definition xml
    * @param {object} referenceObj The main object that is getting replaced, containing all references to it (from findReferences)
    * @param {object} replacementObj The replacement object that will replace the original
    * 
    */
    replaceReferences: function (xmlDefinition, referenceObj, replacementObj)
    {
        var references = this.findReferences(xmlDefinition, referenceObj);

        for (var i = 0, l = references.items.length; i < l; i++)
        {
            var item = references.items[i];
            var xmlNode = item.item.xmlNode;

            // Update the XML Node containing the reference to be replaced
            if (!!xmlNode)
            {
                this._setReferenceDetailsOnNode(item.referenceAs, replacementObj, xmlNode);
            }
            else if (!!item.item.copiedXmlNode)
            {
                if (checkExists(this._getParentFromItem(item.item, this.ReferenceType.ConditionProperty)))
                {
                    this.replaceReferencesInConditionProperty(item.item, item.referenceAs, replacementObj);
                }

                if (checkExists(this._getParentFromItem(item.item, this.ReferenceType.Filter)))
                {
                    this.replaceReferencesInFilter(item.item, item.referenceAs, replacementObj);
                }

                if (checkExists(this._getParentFromItem(item.item, this.ReferenceType.SubFormPopupAction)))
                {
                    this.replaceReferencesInSubFormPopupAction(item.item, item.referenceAs, replacementObj);
                }
            }

        }

        references = $.extend({}, references, replacementObj);

        return references;
    },

    _setReferenceDetailsOnNode: function (referenceAs, referenceObj, xmlNode)
    {
        switch (referenceAs)
        {
            case "EventSource":
            case "ParameterMappingSource":
            case "ParameterMappingTarget":
            case "PropertyExpressionSource":
            case "ResultMappingTarget":
            case "SourceMapping":

                var context = "Source";

                switch (referenceAs)
                {
                    case "ParameterMappingTarget":
                    case "ResultMappingTarget":
                        context = "Target";
                }

                if (!!referenceObj.id)
                {
                    xmlNode.setAttribute(context + "ID", referenceObj.id);
                }
                else
                {
                    xmlNode.removeAttribute(context + "ID");
                }

                if (!!referenceObj.name)
                {
                    xmlNode.setAttribute(context + "Name", referenceObj.name);
                }
                else
                {
                    xmlNode.removeAttribute(context + "Name");
                }

                if (!!referenceObj.displayName)
                {
                    xmlNode.setAttribute(context + "DisplayName", referenceObj.displayName);
                }
                else
                {
                    xmlNode.removeAttribute(context + "DisplayName");
                }

                if (!!referenceObj.type)
                {
                    xmlNode.setAttribute(context + "Type", referenceObj.type);
                }
                else
                {
                    xmlNode.removeAttribute(context + "Type");
                }

                switch (referenceAs)
                {
                    case "PropertyExpressionSource":

                        if (!!referenceObj.dataType)
                        {
                            xmlNode.setAttribute("DataType", referenceObj.dataType);
                        }
                        else
                        {
                            xmlNode.setAttribute("DataType", "Text");
                        }

                        // Note, this is a deliberate fall-through

                    case "ParameterMappingSource":
                    case "ParameterMappingTarget":
                    case "ResultMappingTarget":
                    case "SourceMapping":

                        switch (referenceObj.type)
                        {
                            case "FormParameter":
                            case "ViewParameter":
                                if (!!referenceObj.id)
                                {
                                    xmlNode.setAttribute(context + "ID", referenceObj.name);
                                }
                                break;
                        }

                        break;
                }

                break;
        }
    },

    replaceReferencesInConditionProperty: function (item, referenceAs, replacementObj)
    {
        if (!checkExists(item) || !checkExists(replacementObj) || !checkExists(referenceAs))
        {
            return;
        }

        if (!checkExists(item.copiedXmlNode) ||
        item.copiedXmlNode.nodeName !== "Source")
        {
            return;
        }

        var propertyItem = this._getParentFromItem(item, this.ReferenceType.ConditionProperty);

        if (!checkExists(propertyItem) ||
        !checkExists(propertyItem.xmlNode) ||
        propertyItem.xmlNode.nodeName !== "Property")
        {
            return;
        }

        var propertyNode = propertyItem.xmlNode;

        var valueNode = propertyNode.selectSingleNode("Value");

        if (!checkExists(valueNode))
        {
            return;
        }

        var valueXml = parseXML("<SourceValue>{0}</SourceValue>".format(valueNode.text));

        var itemNode = null;

        if (item.copiedXmlNode.getAttribute("SourceType") === this.ReferenceType.ControlProperty)
        {
            //If the Item node has ControlProperty as source type, it should use the Source info for the replacement
            itemNode = valueXml.selectSingleNode(".//Source[@SourceType='ControlProperty' and @SourcePath='{0}']"
            .format(item.copiedXmlNode.getAttribute("SourcePath")));
        }
        else
        {
            itemNode = valueXml.selectSingleNode(".//Source[@SourceID='{0}']".format(item.copiedXmlNode.getAttribute("SourceID")));
        }

        var newItemNode = itemNode.ownerDocument.createElement("Source");
        this._setReferenceDetailsOnNode(referenceAs, replacementObj, newItemNode);
        itemNode.parentNode.replaceChild(newItemNode, itemNode);

        valueNode.childNodes[0].nodeValue = valueXml.xml.replace(/<\/?SourceValue>/ig, "");
    },

    replaceReferencesInFilter: function (item, referenceAs, replacementObj)
    {
        if (!checkExists(item) || !checkExists(replacementObj) || !checkExists(referenceAs))
        {
            return;
        }

        if (!checkExists(item.copiedXmlNode) ||
        item.copiedXmlNode.nodeName !== "Item")
        {
            return;
        }

        var actionItem = this._getParentFromItem(item, this.ReferenceType.Action);

        if (!checkExists(actionItem) ||
        !checkExists(actionItem.xmlNode) ||
        actionItem.xmlNode.nodeName !== this.ReferenceType.Action)
        {
            return;
        }

        var actionNode = actionItem.xmlNode;

        var propertyNode = actionNode.selectSingleNode("Properties/Property[Name='Filter']");

        if (!checkExists(propertyNode))
        {
            return;
        }

        var valueNode = propertyNode.selectSingleNode("Value");

        if (!checkExists(valueNode))
        {
            return;
        }

        var filterXml = parseXML(valueNode.text);
        var itemNode = null;

        if (item.copiedXmlNode.getAttribute("SourceType") === this.ReferenceType.ControlProperty)
        {
            //If the Item node has ControlProperty as source type, it should use the Source info for the replacement
            itemNode = filterXml.selectSingleNode(".//Item[@SourceType='ControlProperty' and @SourcePath='{0}']"
            .format(item.copiedXmlNode.getAttribute("SourcePath")));
        }
        else
        {
            itemNode = filterXml.selectSingleNode(".//Item[@SourceID='{0}']".format(item.copiedXmlNode.getAttribute("SourceID")));
        }

        var newItemNode = itemNode.ownerDocument.createElement("Item");
        this._setReferenceDetailsOnNode(referenceAs, replacementObj, newItemNode);
        itemNode.parentNode.replaceChild(newItemNode, itemNode);

        valueNode.childNodes[0].nodeValue = filterXml.xml;
    },

    replaceReferencesInSubFormPopupAction: function (item, referenceAs, replacementObj)
    {
        if (!checkExists(item) || !checkExists(item.copiedXmlNode) ||
        item.copiedXmlNode.nodeName !== "Source" ||
        !checkExists(replacementObj) || !checkExists(referenceAs))
        {
            return;
        }

        var actionPropertyItem = this._getParentFromItem(item, this.ReferenceType.ActionProperty);

        var propertyNode = actionPropertyItem.xmlNode;

        if (!checkExists(propertyNode))
        {
            return;
        }

        var valueNode = propertyNode.selectSingleNode("Value");

        if (!checkExists(valueNode))
        {
            return;
        }

        var sourceMappingXml = parseXML("<TmpRootNode>{0}</TmpRootNode>".format(valueNode.text));
        var itemNode = null;

        if (item.copiedXmlNode.getAttribute("SourceType") === this.ReferenceType.ControlProperty)
        {
            //If the Item node has ControlProperty as source type, it should use the Source info for the replacement
            itemNode = sourceMappingXml.selectSingleNode(".//Source[@SourceType='ControlProperty' and @SourcePath='{0}']"
            .format(item.copiedXmlNode.getAttribute("SourcePath")));
        }
        else
        {
            itemNode = sourceMappingXml.selectSingleNode(".//Source[@SourceID='{0}']".format(item.copiedXmlNode.getAttribute("SourceID")));
        }

        var newItemNode = itemNode.ownerDocument.createElement("Source");
        this._setReferenceDetailsOnNode(referenceAs, replacementObj, newItemNode);
        itemNode.parentNode.replaceChild(newItemNode, itemNode);

        valueNode.childNodes[0].nodeValue = sourceMappingXml.xml.replace(/<\/?TmpRootNode>/ig, "");
    }
};
