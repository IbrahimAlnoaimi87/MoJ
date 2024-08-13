/* global Resources: false */
/* global SourceCode: true */
/* global checkExists: false */
/* global checkExistsNotEmpty: false */

(function ()
{
    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Services === "undefined" || SourceCode.Forms.Services === null) SourceCode.Forms.Services = {};

    SourceCode.Forms.Services.AnalyzerResourcesService = function ()
    {
        //#region Private Properties
        var _controlTypesCache = {}; // See getControlTypeFriendlyName for usage
        //#endregion

        //#region Constants
        var NULLVALUESTRING = "___(N\A)___";
        //#endregion

        // Extracts only the core values from the passed reference object (for identification purposes)
        // reference: reference item for which base details should be returned
        //
        // returns: a JSON object with the following base details: guid, name, display name, type & sub type
        var getReferenceBaseDetails = function (reference)
        {
            var result = {};

            if (reference.displayName)
            {
                result.displayName = reference.displayName;
            }
            if (reference.name)
            {
                result.name = reference.name;
            }
            if (reference.guid)
            {
                result.guid = reference.guid;
            }
            if (reference.type)
            {
                result.type = reference.type;
            }
            if (reference.subType)
            {
                result.subType = reference.subType;
            }

            return result;
        };

        // Returns a JSON object describing the reference item passed along with its targeted property
        // referenceItem: reference item for which details should be generated
        //
        // returns: a JSON object with the following details, title (display name), description, icon, 
        // affected /targeted property, and designer area
        var getReferenceItemDetails = function (referenceItem)
        {
            var details = {}, targetItem, contextItem;

            // Calculate target & context references
            switch (referenceItem.referenceAs)
            {
                case "ControlField":
                case "ControlPropertyExpression":
                case "ControlPropertyField":
                case "PropertyParentControl":
                case "PropertyParentJoinProperty":
                    contextItem = referenceItem.item;
                    targetItem = getParentItemByType(contextItem, "Control");
                    break;

                case "ActionControl":
                case "ActionMethod":
                case "ActionObject":
                case "ActionProperty":
                case "ActionRule":
                case "ActionRuleSubForm":
                case "ActionView":
                case "ParameterMappingSource":
                case "ParameterMappingSourceSubForm":
                case "ParameterMappingTarget":
                case "ParameterMappingTargetSubForm":
                case "ResultMappingSource":
                case "ResultMappingSourceSubForm":
                case "ResultMappingTarget":
                case "ResultMappingTargetSubForm":
                case "SourceMapping":

                    switch (referenceItem.referenceAs)
                    {
                        case "ActionProperty":
                        case "ParameterMappingSource":
                        case "ParameterMappingSourceSubForm":
                        case "ParameterMappingTarget":
                        case "ParameterMappingTargetSubForm":
                        case "ResultMappingSource":
                        case "ResultMappingSourceSubForm":
                        case "ResultMappingTarget":
                        case "ResultMappingTargetSubForm":
                            contextItem = referenceItem.item;
                            break;
                        default:
                            contextItem = getParentItemByType(referenceItem.item, "Action");
                    }

                    targetItem = getParentItemByType(contextItem, "Event");
                    break;

                case "PropertyExpressionSource":
                    contextItem = getParentItemByType(referenceItem.item, "ConditionalStyle");
                    if (!!contextItem)
                    {
                        // Expression of a conditional style bound to a control
                        targetItem = getParentItemByType(contextItem, "Control");
                    }
                    else
                    {
                        // Standard Expressions
                        targetItem = getParentItemByType(referenceItem.item, "ControlExpression");

                        if (!targetItem)
                        {
                            // Expression that is used in a control property as a template
                            targetItem = getParentItemByType(referenceItem.item, "ControlProperty");

                            // Expression part of an event
                            if (!targetItem)
                            {
                                // Expression that is used in a condition of an event
                                contextItem = getParentItemByType(referenceItem.item, "Condition");

                                // Expression that is used in a filter of an action property
                                if (!contextItem)
                                {
                                    contextItem = getParentItemByType(referenceItem.item, "Filter");
                                }

                                // Expression that is used in an action of an event
                                if (!contextItem)
                                {
                                    contextItem = getParentItemByType(referenceItem.item, "Action");
                                }

                                //Handler function expression
                                if (!contextItem)
                                {
                                    contextItem = getParentItemByType(referenceItem.item, "HandlerFunction");
                                }

                                if (!!contextItem)
                                {
                                    // Expression is definitely part of an event
                                    targetItem = getParentItemByType(contextItem, "Event");
                                }
                                else
                                {
                                    // Fallback for scenarios not covered
                                    targetItem = referenceItem.item;
                                }
                            }
                            else
                            {
                                // Expression used in a control property
                                contextItem = targetItem;
                                targetItem = getParentItemByType(contextItem, "Control");
                            }


                        }
                    }
                    break;
                case "PropertyExpressionSourceSubForm":
                    {
                        // Expression that is used in a condition of an event
                        contextItem = getParentItemByType(referenceItem.item, "Condition");

                        // Expression that is used in a filter of an action property
                        if (!contextItem)
                        {
                            contextItem = getParentItemByType(referenceItem.item, "Filter");
                        }

                        // Expression that is used in an action of an event
                        if (!contextItem)
                        {
                            contextItem = getParentItemByType(referenceItem.item, "Action");
                        }

                        //Handler function expression
                        if (!contextItem)
                        {
                            contextItem = getParentItemByType(referenceItem.item, "HandlerFunction");
                        }

                        if (!!contextItem)
                        {
                            // Expression is definitely part of an event
                            targetItem = getParentItemByType(contextItem, "Event");
                        }
                        else
                        {
                            // Fallback for scenarios not covered
                            targetItem = referenceItem.item;
                        }
                    }
                    break;
                case "ValidationGroupControlControl":
                    {
                        targetItem = referenceItem.item;
                        var parentEvent = getParentItemByType(referenceItem.item, "Event");
                        if (checkExists(parentEvent))
                        {
                            targetItem = parentEvent;
                            contextItem = referenceItem.item;
                        }
                    }
                    break;
                case "ValidationPattern":
                    {
                        targetItem = referenceItem.item;
                        contextItem = targetItem;
                        targetItem = getParentItemByType(contextItem, "Control");
                    } break;

                default:
                    targetItem = referenceItem.item;
            }

            // Get display details (and identification details)
            $.extend(
                details,
                getReferenceBaseDetails(targetItem),
                getReferenceDisplayDetails(referenceItem, targetItem, contextItem)
            );

            return details;
        };

        // Returns a JSON object describing the reference item passed along with its context
        // referenceItem: original reference item
        // targetItem: targeted reference item for which details should be generated
        // contextItem: reference item's context reference describing its affected area or usage
        //
        // returns: a JSON object with the following details, title (display name), description, icon, 
        // and affected /targeted property
        var getReferenceDisplayDetails = function (originalItem, targetItem, contextItem)
        {
            var details =
                {
                    contextDisplayType: "",
                    description: "",
                    displayType: "",
                    icon: "",
                    subTitle: "",
                    title: ""
                };

            if (!targetItem)
            {
                targetItem = originalItem.item;
            }

            switch (targetItem.type)
            {
                case "Control":
                    details.icon = getControlTypeIconClass(targetItem.subType);
                    details.title = getReferenceItemName(targetItem);
                    details.subTitle = Resources.DependencyHelper.ErrorItemSubTitleText.format(getControlTypeFriendlyName(targetItem.subType));
                    details.displayType = getReferenceType(targetItem.type);
                    break;
                default:
                    details.title = getReferenceItemName(targetItem);

                    switch (originalItem.referenceAs)
                    {
                        case "AreaItemView":
                            details.icon = getReferenceTypeIconClass(originalItem.referenceAs);
                            details.displayType = getReferenceType(originalItem.referenceAs);
                            break;
                        case "ActionRuleSubForm":
                        case "ParameterMappingSourceSubForm":
                        case "ParameterMappingTargetSubForm":
                        case "PropertyExpressionSourceSubForm":
                        case "ResultMappingSourceSubForm":
                        case "ResultMappingTargetSubForm":
                            details.icon = getReferenceTypeIconClass(originalItem.referenceAs);
                            details.displayType = getReferenceType(targetItem.type);
                            break;
                        default:
                            details.icon = getReferenceTypeIconClass(targetItem.type);
                            details.displayType = getReferenceType(targetItem.type);
                    }
            }

            if (!!contextItem)
            {
                switch (contextItem.type)
                {
                    case "Action":
                        details.description = getReferenceType(contextItem.type);
                        break;
                    case "ConditionalStyle":
                        details.description = Resources.DependencyHelper.ErrorNamedItemDescriptionText.format(contextItem.name, getReferenceType(contextItem.type));
                        break;
                    case "ControlProperty":
                        switch (contextItem.name)
                        {
                            case "ControlExpression":
                                details.description = getReferenceType("ControlPropertyExpression");
                                break;
                            case "DisplayTemplate":
                            case "ValidationPattern":
                                details.description = getReferenceType(contextItem.type);
                                break;
                            case "Field":
                                details.description = getReferenceType("ControlPropertyField");
                                break;
                            case "ParentControl":
                                details.description = getReferenceType("ParentControl");
                                break;
                            case "ParentJoinProperty":
                                details.description = getReferenceType("PropertyParentJoinProperty");
                                break;
                            default:
                                details.description = contextItem.name;
                        }
                        break;
                    case "ValidationGroupControl":
                        if (targetItem.type === "Event")
                        {
                            details.description = getReferenceType("ValidateCondition");
                        }
                        else
                        {
                            details.description = getReferenceType(contextItem.type);
                        }
                        break;
                    default:
                        if (!!contextItem.name)
                        {
                            details.description = contextItem.name;
                        }
                        else
                        {
                            details.description = getReferenceType(contextItem.type);
                        }
                }

                if (!!contextItem.name)
                {
                    details.contextName = contextItem.name;
                }
                details.contextDisplayType = getReferenceType(contextItem.type);
                details.contextType = contextItem.type;
            }
            else
            {
                switch (originalItem.referenceAs)
                {
                    case "AreaItemView":
                        details.description = getReferenceType(originalItem.referenceAs);
                        break;
                    default:
                        details.description = getReferenceType(targetItem.type);
                }
            }

            //Ensure all object names are html encoded:
            details.contextDisplayType = details.contextDisplayType.htmlEncode();
            details.description = details.description.htmlEncode();
            details.displayType = details.displayType.htmlEncode();
            details.icon = details.icon.htmlEncode();
            details.subTitle = details.subTitle.htmlEncode();
            details.title = details.title.htmlEncode();

            return details;
        };

        // Returns a name of a reference item passed for display
        // item: reference item whose name should retrieved
        //
        // returns: a string that is a name for the item, fallback on the reference item type if name is not available
        var getReferenceItemName = function (item)
        {
            if (!!item.displayName)
            {
                return item.displayName;
            }
            else if (!!item.name)
            {
                return item.name;
            }

            return getReferenceType(item.type);
        };

        // Returns the localized resource title / description string for the specified reference status
        // which should be formatted with named values
        // referenceType: The reference status for which a resource string lookup should be done
        //
        // returns: a matching resource string that still requires formatting
        var getReferenceStatusTitle = function (referenceStatus)
        {
            switch (referenceStatus)
            {
                case "Resolved": // The referenced item was found.
                    return Resources.DependencyFramework.ObjResolved;
                case "Missing": // The referenced item could not be found.
                    return Resources.DependencyFramework.ObjMissing;
                case "Changed": // The referenced item was found but was changed.
                    return Resources.DependencyFramework.ObjChanged;
                case "Auto": // The reference was automatically fixed/remapped.
                    return Resources.DependencyFramework.ObjAuto;
                case "New": // The item was created because a new reference item was found that should be handled.
                    return Resources.DependencyFramework.ObjNew;
                case "Error": // The referenced item contains an error.
                    return Resources.DependencyFramework.ObjError;
                case "Warning": // The referenced item might contain an error due to its dependency on an item in error state.
                    return Resources.DependencyFramework.ObjWarning;
                case "AutoRenamed": // The reference was automatically renamed
                    return Resources.DependencyFramework.ObjAutoRenamed;
                case "AutoChanged": // The reference's type or value was automatically changed
                    return Resources.DependencyFramework.ObjAutoChanged;
                default:
                    return "'{0}' {1}";
            }
        };

        // Returns the localized resource string for the specified reference type
        // referenceType: The reference type for which a resource string lookup should be done
        //
        // returns: a matching resource string
        var getReferenceType = function (referenceType)
        {
            // Remove once designers can handle namespaces.
            var resourceString = Resources.DependencyObjects[referenceType];

            // Enable once designers can handle namespaces.
            //var resourceString = "";

            //if (!checkExistsNotEmpty(resourceString))
            //{
            //	resourceString = evalString("Resources." + referenceType);
            //}

            if (!checkExistsNotEmpty(resourceString))
            {
                resourceString = evalString("ControlResources." + referenceType);
            }

            if (!checkExistsNotEmpty(resourceString))
            {
                resourceString = referenceType;
            }

            return resourceString;
        };

        // Returns the CSS Icon Class for the specified reference type
        // referenceType: The reference type for which a css class lookup should be done
        //
        // returns: a string css class name
        var getReferenceTypeIconClass = function (referenceType)
        {
            switch (referenceType)
            {
                case "Unknown":
                    return "";
                case "Form":
                    return "icon-form";
                case "FormEvent":
                    return "icon-form-event";
                case "FormParameter":
                    return "icon-form-parameter";
                case "Panel":
                    return "icon-form-tab";
                case "Area":
                    return "";
                case "AreaItem":
                    return "";
                case "AreaItemView":
                    return "icon-view";
                case "ViewInstance":
                    return "";
                case "View":
                    return "icon-view";
                case "ViewEvent":
                    return "icon-view-event";
                case "ViewParameter":
                    return "icon-view-parameter";
                case "ViewSelection":
                    return "";
                case "ViewMethod":
                    return "icon-view-method";
                case "State":
                    return "icon-state";
                case "StateProperty":
                    return "";
                case "Event":
                    return "icon-event";
                case "EventProperty":
                    return "";
                case "Handler":
                    return "";
                case "HandlerProperty":
                    return "";
                case "Condition":
                    return "icon-condition";
                case "ConditionProperty":
                    return "";
                case "Action":
                    return "icon-action";
                case "ActionProperty":
                    return "";
                case "ParameterMapping":
                    return "";
                case "ResultMapping":
                    return "";
                case "MappingProperty":
                    return "";
                case "Control":
                    return "icon-control";
                case "ControlEvent":
                    return "icon-control-event";
                case "ControlMethod":
                    return "icon-control-method";
                case "ControlProperty":
                    return "icon-control-property";
                case "ControlType":
                    return "";
                case "ControlTypeEvent":
                    return "";
                case "ControlTypeMethod":
                    return "";
                case "ControlTypeMethodParameter":
                    return "";
                case "ControlTypeMethodResult":
                    return "";
                case "ControlTypeProperty":
                    return "";
                case "Layout":
                    return "";
                case "LayoutItem":
                    return "";
                case "Theme":
                    return "icon-theme";
                case "Source":
                    return "icon-smartobject";
                case "SourceField":
                    return "icon-view-field";
                case "Filter":
                    return "icon-filter";
                case "ControlExpression":
                case "Expression":
                    return "icon-expression";
                case "Function":
                    return "icon-function";
                case "ValidationGroup":
                    return "";
                case "ValidationGroupControl":
                    return "icon-control";
                case "ValidationPattern":
                    return "";
                case "SubForm":
                case "ActionRuleSubForm":
                case "ParameterMappingSourceSubForm":
                case "ParameterMappingTargetSubForm":
                case "PropertyExpressionSourceSubForm":
                case "ResultMappingSourceSubForm":
                case "ResultMappingTargetSubForm":
                    return "icon-sub-form";
                case "SystemVariable":
                    return "icon-system-variable";
                case "EnvironmentField":
                    return "icon-environment-field";
                case "Object":
                    return "icon-smartobject";
                case "ObjectProperty":
                    return "icon-smartobject-property";
                case "ObjectMethod":
                    return "icon-smartobject-method";
                case "ObjectMethodParameter":
                    return "icon-smartobject-method-parameter";
                case "ObjectMethodInput":
                    return "";
                case "ObjectMethodReturn":
                    return "";
                case "Value":
                    return "";
                case "Result":
                    return "";
                case "ReportParameter":
                    return "";
                case "WorkflowProcess":
                    return "icon-process";
                case "WorkflowProcessProperty":
                    return "";
                case "WorkflowProcessDataField":
                    return "icon-process-data-field";
                case "WorkflowProcessXmlField":
                    return "icon-process-xml-field";
                case "WorkflowActivityProperty":
                    return "";
                case "WorkflowActivityDataField":
                    return "icon-activity-data-field";
                case "WorkflowActivityXmlField":
                    return "icon-activity-xml-field";
                case "WorkflowEventProperty":
                    return "";
                case "ServiceInstance":
                    return "icon-service-instance";
                case "ServiceObject":
                    return "icon-service-object";
                case "SmartObjectDefinition":
                    return "";
                case "SmartPropertyDefinition":
                    return "";
                case "ServiceObjectProperty":
                    return "";
                case "ServiceObjectPropertyMapping":
                    return "";
                case "ServiceObjectMethod":
                    return "icon-service-object-method";
                case "ServiceObjectMethodParameter":
                    return "icon-service-object-method-parameter";
                case "SmartMethodDefinition":
                    return "";
                case "SmartMethodParameterDefinition":
                    return "";
                case "ExecutionBlock":
                    return "";
                case "ObjectDefinitionAssociation":
                    return "";
                default:
                    return "";
            }
        };

        // Returns the Friendly Name of the specified control type
        // controlType: The control type for which a friendly name should be looked up
        //
        // returns: a string that is the control type's friendly name
        var getControlTypeFriendlyName = function (controlType)
        {
            if (typeof _controlTypesCache[controlType] === "undefined")
            {
                // Because XPath lookups can become expensive, the results of previous lookups are cached to improve performance
                if (typeof SourceCode.Forms.Designers.Common.controlDefinitionsXml !== "undefined")
                {
                    var controlTypeDef = SourceCode.Forms.Designers.Common.controlDefinitionsXml.selectSingleNode("Controls/Control[Name='"
                        + controlType + "']");

                    if (controlTypeDef !== null)
                    {
                        _controlTypesCache[controlType] = {
                            friendlyName: controlTypeDef.selectSingleNode("FriendlyName").text
                        };
                    }
                    else
                    {
                        return controlType;
                    }
                }
                else
                {
                    return controlType;
                }
            }

            return _controlTypesCache[controlType].friendlyName;
        };

        // Returns the CSS Icon Class for the specified control type
        // referenceType: The control type for which a css class lookup should be done
        //
        // returns: a string css class name
        var getControlTypeIconClass = function (controlType)
        {
            if (checkExistsNotEmpty(controlType))
            {
                return "icon-" + controlType.toLowerCase() + "-control";
            }
            else
            {
                return "icon-control";
            }
        };

        // Looks up the the applicable ancestor item of the passed reference item
        // item: The reference item whose ancestors should be evaluated
        // referenceType: The reference type of the ancestor being looked up
        //
        // returns: a JSON representation of the ancestor matching the lookup criteria
        var getParentItemByType = function (item, referenceType)
        {
            var current = item;

            while (current.type !== referenceType && checkExists(current.parent))
            {
                current = current.parent;
            }

            if (current.type === referenceType)
            {
                return current;
            }
            else
            {
                return null;
            }
        };

        // Generates a list of messages based on the ValidationMessage annotation
        // message: The value of the ValidationMessage annotation property
        //
        // returns: an array of human readable error messages
        var getValidationMessages = function (message)
        {
            var result = [], messages = parseValidationMessage(message);

            for (var i = 0, l = messages.length; i < l; i++)
            {
                var msg = getReferenceStatusTitle(messages[i].status).format(
                    getReferenceItemName(messages[i]),
                    getReferenceType(messages[i].type)
                );

                // Messages should be unique
                if (result.indexOf(msg) === -1)
                {
                    result.push(msg);
                }
            }

            return result;
        };

        // Parses the ValidationMessage annotation property's value
        // message: The value of the ValidationMessage annotation property
        //
        // returns: a JSON representation of the property's value
        var parseValidationMessage = function (message)
        {
            var result = [], messages = message.split(";");

            for (var i = 0, l = messages.length; i < l; i++)
            {
                var parts = messages[i].split(",");

                var obj = {
                    referenceAs: parts[0],
                    type: parts[1],
                    status: parts[2]
                };

                // Test if identifier is a valid GUID
                if (!!parts[3] && parts[3] !== "00000000-0000-0000-0000-000000000000"
                    && parts[3].match(/^[a-fA-F0-9]{8}\-[a-fA-F0-9]{4}\-[a-fA-F0-9]{4}\-[a-fA-F0-9]{4}\-[a-fA-F0-9]{12}$/g) !== null)
                {
                    obj.guid = parts[3];
                }

                if (!!parts[4] && parts[4] !== NULLVALUESTRING)
                {
                    obj.name = parts[4];
                }
                if (!!parts[5] && parts[5] !== NULLVALUESTRING)
                {
                    obj.displayName = parts[5];
                }
                /**
                 * TD 0072
                 * TODO this is what we should do if an empty display value is detected and returns the empty token. But cant do this as callee of this function determine if empty and then get teh resource for themselves.
                 */
                //if (!checkExistsNotEmpty(obj.name) && !checkExistsNotEmpty(obj.displayName))
                //{
                //	obj.displayName = getEmptyDisplayToken(obj.type);
                //}
                if (!!parts[6] && parts[6] !== NULLVALUESTRING)
                {
                    obj.subType = parts[6];
                }

                result.push(obj);
            }

            return result;
        };

        // Generates a ValidationMessage for annotation based on the details of a reference
        // reference: Reference object whose status affects an item
        // referenceAs: The relationship between the reference and the item
        // status: The status of the referenced object, typically "Missing". 
        //         (Optional if status is a property of the reference object)
        //
        // returns: a string formatted for annotation as the value of a ValidationMessage attribute
        var generateValidationMessage = function (reference, referenceAs, status)
        {
            var result = [
                referenceAs,						// Relationship between reference object & item
                reference.type,						// Type of reference object
                reference.status || status || "",	// Status of reference object
                reference.guid || reference.id || "",	// GUID of reference object
                reference.name || "",				// Name of reference object
                reference.displayName || "", // Display Name of reference object
                reference.subType || ""				// Subtype of reference object
            ];

            return result.join(",");
        };

        /**
         * getEmptyDisplayToken is a function to get a token display for the UI when referencetypes dont have obtainable display values
         * @function
         * @param {String} this is a SourceCode.Forms.DependencyHelper.ReferenceType constant string.
         * @returns {String} returns out a string token or an empty string
         */
        var getEmptyDisplayToken = function (tokenType)
        {
            var tokenTemplate = Resources.DependencyObjects.EmptyDisplayToken;
            var token = Resources.DependencyObjects[tokenType];

            if (checkExists(token))
            {
                tokenTemplate = tokenTemplate.format(token);
            }
            else
            {
                tokenTemplate = "";
            }



            return tokenTemplate;
        };

        // Public API
        return {
            getParentItemByType: getParentItemByType,
            getReferenceBaseDetails: getReferenceBaseDetails,
            getReferenceDisplayDetails: getReferenceDisplayDetails,
            getReferenceItemDetails: getReferenceItemDetails,
            getReferenceItemName: getReferenceItemName,
            getReferenceStatusTitle: getReferenceStatusTitle,
            getReferenceType: getReferenceType,
            getReferenceTypeIconClass: getReferenceTypeIconClass,
            getControlTypeFriendlyName: getControlTypeFriendlyName,
            getControlTypeIconClass: getControlTypeIconClass,
            getValidationMessages: getValidationMessages,
            parseValidationMessage: parseValidationMessage,
            generateValidationMessage: generateValidationMessage,
            getEmptyDisplayToken: getEmptyDisplayToken
        };

    };

})();