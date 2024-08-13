var hiddenValueArray = [];
var viewWriteStatus = [];
var ViewHiddenHash = {};
var baseCollectionXPath = "collection/object";
var fieldObjectInfoCache = {}; //this is a new cache to store related data about fields to ensure that less xml manipulation is needed


/*************** SET ******************************************************/

/* setHiddenFieldValue 
- typically called from a control when the value changes
- also in a capture list (the correct counter field should be updated)
- Replaces:  setHiddenProperty + setHiddenPropertyItem (in instances where the property name is dependant on the field only)
*/
function setHiddenFieldValue(fieldID, Value, counter, instanceID, sourceID, sourceType, ignoreControls, loopContextID)
{
    //#region
    var FO = returnFieldAttributeObject(fieldID, instanceID);

    if (checkExists(FO))
    {
        var state = null;
        if (checkExists(counter))
        {
            state = "Changed";
        }
        setHiddenJSONValue(FO.parentID, FO.parentType, FO.viewID, counter, state, null, null, FO.contextID, FO.contextType, null, FO.PropertyName, FO.fieldType, Value, FO.instanceID);

        if (!ignoreControls)
        {
            var controlsXpath = "Controllers/Controller" + FO.instanceXP + "/Controls/Control[(@FieldID='" + fieldID + "') and (Properties/Property[Name/text()='SetValue']) and (not(@ControlTemplate) or (@ControlTemplate='edit'))]";
            //not control template, this shouldn't impact the lists - caused problems with DD on EL, unnecessary since field transformation happens correctly in any case
            if (checkExists(sourceID) && checkExists(sourceType) && sourceType.toLowerCase() === "control" && sourceID.length > 0)
            {
                //limiting out the same control that just was updated (limits recursive looping with system onchange events)
                controlsXpath += "[@ID!='" + sourceID + "']";
            }
            var controlCollection = $mn(viewControllerDefinition, controlsXpath);
            var z = controlCollection.length;
            if (z == 0)
            {
                updateCalculatedControls(null, FO.instanceID, "ViewField", fieldID, null, null, null, loopContextID);
            }
            while (z--)
            {
                var currentControl = controlCollection[z];
                var ControlName = currentControl.getAttribute("ID");
                var objInfo = new PopulateObject(null, Value, ControlName, null, null);
                executeControlFunction(currentControl, "SetValue", objInfo);
            }
        }
    }
    //#endregion
}

/* setHiddenJSONValue: set the hidden JSON field value
called from all the setting functions
*/
function setHiddenJSONValue(parentID, parentType, viewID, counter, state, controlID, method, contextID, contextType, pageNumber, fieldName, fieldType, fieldValue, instanceID)
{
    //#region
    var currentObj = {};


    if (checkExists(parentID))
    {
        currentObj.parentid = parentID;
    }
    if (checkExists(parentType))
    {
        currentObj.parenttype = parentType;
    }

    if (checkExists(counter))
    {
        currentObj.counter = counter;
        if (checkExists(state))
        {
            currentObj.state = state;
        }
    }
    if (checkExists(controlID))
    {
        currentObj.controlid = controlID;
    }
    if (checkExists(method))
    {
        currentObj.method = true;

        if (checkExists(fieldName) && fieldType === "MethodParameter")
        {
            currentObj.parameters = {};
            var currentParameter = {};
            if (!checkExists(fieldValue) || (fieldValue.length === 0))
            {
                currentParameter.cleared = true;
            }
            else
            {
                currentParameter.value = fieldValue;
                delete currentParameter.cleared;
            }
            currentObj.parameters[fieldName] = currentParameter;
        }
    }

    if (checkExists(contextID))
    {
        currentObj.contextid = contextID;
    }
    if (checkExists(contextType))
    {
        currentObj.contexttype = contextType;
    }

    if (checkExists(pageNumber))
    {
        currentObj.pagenumber = pageNumber;
    }
    if (checkExists(fieldName) && fieldType !== "MethodParameter")
    {
        currentObj.fields = {};
        var currentField = {};
        if (!checkExists(fieldValue) || (fieldValue.length === 0))
        {
            currentField.cleared = true;
        }
        else
        {
            currentField.value = fieldValue;
            delete currentField.cleared;
        }
        currentObj.fields[fieldName] = currentField;
    }

    pushHiddenValue(viewID, instanceID, currentObj);
    //#endregion
}

function _runtimeSetControlFields(brokerData, controlID, identifierField)
{
    var controlInfo = controlInformationObject(controlID);
    if (checkExists(controlInfo))
    {
        var viewID = controlInfo.ViewID;
        var instanceID = controlInfo.InstanceID;
        updateHiddenPropertyCollection({ viewID: viewID, instanceID: instanceID, controlID: controlID, brokerData: brokerData, identifierField: identifierField });
    }
}

function updateHiddenPropertyCollection(options)
{
    if (checkExists(options.brokerData) && options.brokerData.length > 0)
    {
        setHiddenPropertyCollection(options.viewID, options.brokerData, options.controlID, null, null, options.instanceID);
    }
    else
    {
        if (!checkExists(options.removeCounter))
        {
            options.removeCounter = true;
        }
        removeHiddenPropertyCollection(options.viewID, options.parentID, options.parentType, options.pageNumber, options.controlID, options.includeCounter, options.contextType, options.instanceID, options.contextID, options.removeCounter);
    }
}

/* setHiddenPropertyCollection: set a collection of property values 
typically called on return of a brokerpackage where values were retrieved
controlID (optional):  values were retrieved for a control on an init event
*/
function setHiddenPropertyCollection(viewID, SOs, controlID, contextID, contextType, instanceID)
{
    //#region
    if (!checkExists(SOs))
    {
        return;
    }

    if (checkExistsNotEmpty(controlID) && checkExists(_runtimeFieldsXmlHash))
    {
        //when fields are updated for a control, the fieldsXmlHash is cleared to ensure that it is reconstructed
        delete _runtimeFieldsXmlHash[controlID];
    }

    if (checkExistsNotEmpty(controlID) && checkExists(_runtimeELJoinHash))
    {
        //when fields are update for a control, the _runtimeELJoinHash is cleared to ensure that it is reconstructed with relevant control data
        var keys = returnHashName(viewID, instanceID);
        delete _runtimeELJoinHash[keys];
    }

    var s = SOs.length;
    if (s === 0)
    {
        return;
    }

    var currentParameters = {};
    if (checkExists(controlID))
    {
        currentParameters.controlid = controlID;
    }
    if (checkExists(contextID))
    {
        currentParameters.contextid = contextID;
    }
    if (checkExists(contextType))
    {
        currentParameters.contexttype = contextType;
    }

    while (s--)
    {
        var currentSO = SOs[s];
        setHiddenValueAttributes(currentSO, currentParameters);
    }
    pushHiddenValue(viewID, instanceID, SOs);
    //#endregion  
}

/* setHiddenParameterCollection: set the hidden parameter values according to the cache supplied 
Translates the xml version to JSON*/
function setHiddenParameterCollection(parameterCache)
{
    //#region
    var paramXML = $xml(parameterCache);
    var SOs = $mn(paramXML, baseCollectionXPath);
    var s = SOs.length;
    while (s--)
    {
        var currentSO = SOs[s];
        var viewID = currentSO.getAttribute("viewid");
        var parentID = currentSO.getAttribute("parentid");
        var parentType = currentSO.getAttribute("parenttype");
        var fields = $mn(currentSO, "fields/field");
        var f = fields.length;
        while (f--)
        {
            var parameterName = fields[f].getAttribute("name");
            var parameterValue = $sn(fields[f], "value");
            if (checkExists(parameterValue) && checkExistsNotEmpty(parameterValue.text))
            {
                setHiddenJSONValue(parentID, parentType, viewID, null, null, null, true, null, null, null, parameterName, "MethodParameter", parameterValue.text, null);
            }
        }
    }
    //#endregion  
}

/* setHiddenValueAttributes: populate value attributes from supplied parameters */
function setHiddenValueAttributes(valueNode, parameters)
{
    if (!checkExists(parameters))
    {
        parameters = {};
    }

    if (checkExists(parameters.controlid))
    {
        valueNode.controlid = parameters.controlid;
    }
    if (!valueNode.state)
    {
        valueNode.state = "Unchanged";
    }
    if (checkExists(parameters.contextID) && checkExists(parameters.contextType) && !valueNode.contextid && !valueNode.contexttype)
    {
        valueNode.contextid = parameters.contextID;
        valueNode.contexttype = parameters.contextType;
    }
}


/**
* @property {object} fieldID
* @property {string} name - field Name
* @property {object} instanceXP - using instanceID
* @property {object} instanceID
* @property {object} viewID - parentNode.parentNode ID attribute
* @property {object} viewType - parentNode.parentNode
* @property {object} mainTable - parentNode.parentNode
* @property {object} parentID
* @property {object} parentType
* @property {object} PropertyName
* @property {object} propertyType
* @property {object} contextID
* @property {object} contextType
* @property {object} fieldType
* @property {object} association
* @summary helper function to construct reusable Field attribute object (shared between get/set hidden field value functions)
*/
var returnFieldAttributeObject = function (FieldID, instanceID)
{
    var newInstance = instanceID;
    if (!checkExistsNotEmpty(newInstance))
    {
        newInstance = _runtimeEmptyGuid;
    }
    var key = newInstance + "_" + FieldID;
    var FO = fieldObjectInfoCache[key];//field object to be used for lookups to limit repeated definition checks
    if (!FO)
    {
        FO = {};
        if (!checkExists(viewControllerDefinition))
        {
            return null;
        }
        var instanceXP = (checkExists(instanceID)) ? "[@InstanceID='" + instanceID + "']" : "";
        //backup checks for cases where instanceIDs are present in eventing definitions but not in the view itself (view subform from form level)
        //INSTANCEID usage should be revisited in entirety in designtime AND runtime
        var field = $sn(viewControllerDefinition, "Controllers/Controller" + instanceXP + "/Fields/Field[@ID='" + FieldID + "']");
        if (!checkExists(field) && checkExists(instanceID))
        {
            field = $sn(viewControllerDefinition, "Controllers/Controller/Fields/Field[@ID='" + FieldID + "']");
            if (checkExists(field))
            {
                //log so that we know that the wrong instanceid was provided
                SFLog({ type: 1, source: "getHiddenFieldValue", category: "Fields", message: "Instance [{0}] for field [{1}] did not match", parameters: [instanceID, FieldID] });
                instanceID = null;
                instanceXP = "";
            }
        }
        if (!checkExists(field))
        {
            return null;
        }
        FO.fieldID = FieldID;
        FO.instanceXP = instanceXP;
        FO.instanceID = instanceID;
        FO.viewID = field.parentNode.parentNode.getAttribute("ID");
        FO.viewType = field.parentNode.parentNode.getAttribute("TypeView");
        FO.mainTable = field.parentNode.parentNode.getAttribute("MainTable");
        FO.parentID = field.getAttribute("ObjectID");
        FO.parentType = field.getAttribute("ObjectType");
        FO.PropertyName = checkExists($sn(field, "PropertyName")) ? $sn(field, "PropertyName").text : "";
        FO.propertyType = checkExists($sn(field, "PropertyType")) ? $sn(field, "PropertyType").text : "";
        FO.contextID = field.getAttribute("ContextID");
        FO.contextType = field.getAttribute("ContextType");
        FO.fieldType = checkExists($sn(field, "FieldType")) ? $sn(field, "FieldType").text : "";
        FO.name = checkExists($sn(field, "Name")) ? $sn(field, "Name").text : "";

        FO.association = new dataSourceLookup({ xmlDoc: viewControllerDefinition, associationSO: FO.parentID, contextID: FO.contextID, instanceID: FO.instanceID }).getDataSource();

        FO.parentIdIsAssocSO = false;
        FO.parentIdIsDisplaySO = false;

        if (checkExists(FO.association))
        {
            FO.parentIdIsAssocSO = true;
        }
        else
        {
            FO.association = new dataSourceLookup({ xmlDoc: viewControllerDefinition, displaySO: FO.parentID, contextID: FO.contextID, instanceID: FO.instanceID }).getDataSource();

            if (checkExists(FO.association))
            {
                FO.parentIdIsDisplaySO = true;
            }
        }

        FO.isComposite = "false";

        FO.sourceControlIDAttr = "";

        if (FO.parentIdIsAssocSO || FO.parentIdIsDisplaySO)
        {
            var isCompositeAttr = FO.association.getAttribute("IsComposite");

            if (checkExistsNotEmpty(isCompositeAttr))
            {
                FO.isComposite = isCompositeAttr.toLowerCase();
            }

            FO.sourceControlIDAttr = FO.association.getAttribute("SourceControlID");
        }
        fieldObjectInfoCache[key] = FO;
    }
    return FO;
}

/*************** GET ******************************************************/
/* getHiddenFieldValue 
- typically called when a value must be returned from the fields collection
- Replaces:  getHiddenProperty + getHiddenPropertyCleared
*/
function getHiddenFieldValue(FieldID, counter, returnClearedValue, specifiedResultName, instanceID, loopContextID, fromParentControl)
{
    //#region
    var comparisonObj = {};
    var Value = null;

    var FO = returnFieldAttributeObject(FieldID, instanceID);
    if (!checkExists(FO))
    {
        return "";
    }
    if (!checkExists(fromParentControl))
    {
        fromParentControl = false;
    }

    var oldCounter = counter;
    var isControlCounter = false;
    var controlID = false;
    var fieldsXmlToUse = null;

    if ((((FO.isComposite === "false") && (FO.parentIdIsAssocSO)) || (FO.parentIdIsDisplaySO)) && (checkExistsNotEmpty(FO.sourceControlIDAttr)))
    {
        var currentLoopContextData = getLoopContextData({ loopContextID: loopContextID, viewID: FO.viewID, instanceID: FO.instanceID, controlID: FO.sourceControlIDAttr });

        if (checkExists(currentLoopContextData) && checkExists(currentLoopContextData.item))
        {
            counter = currentLoopContextData.counter;
            fieldsXmlToUse = currentLoopContextData.item;

            if (!checkExistsNotEmpty(counter))
            {
                counter = oldCounter;
            }
            else
            {
                isControlCounter = true;
            }
        }
    }

    var XP = "";
    //for loop logic
    if (checkExists(fieldsXmlToUse) && checkExists(fieldsXmlToUse.fields))
    {
        var propertyValue = fieldsXmlToUse.fields[FO.PropertyName];

        if (checkExists(propertyValue))
        {
            Value = GetPropertyValue(propertyValue, returnClearedValue);
        }

    }
    else
    {
        fieldsXmlToUse = getViewHiddenHash(FO.viewID, FO.instanceID);
        var continueCheck = true;
        if (checkExists(fieldsXmlToUse))
        {
            if (!checkExists(counter))
            {
                counter = false;
            }

            if (isControlCounter === true && (FO.parentIdIsAssocSO || FO.parentIdIsDisplaySO) && (FO.isComposite === "false") && (typeof counter !== "boolean") && !fromParentControl && checkExistsNotEmpty(FO.sourceControlIDAttr))
            {
                controlID = FO.sourceControlIDAttr;
            }

            if ((FO.isComposite === "true") && ((FO.parentIdIsAssocSO && specifiedResultName === true) || FO.parentIdIsDisplaySO))
            {
                FO.contextType = FO.association.getAttribute("ContextType");
                controlID = true;
            }

            if (FO.isComposite !== "true" && checkExists(fieldsXmlToUse) && checkExists(FO.association)
                && (FO.contextType === "Association" || FO.contextType === "External"))
            {

                var originalProperty = FO.association.getAttribute("ValueProperty");
                controlID = FO.association.getAttribute("SourceControlID");

                var sourceValue;
                var getControlValueObject =
                    {
                        //contexttype: FO.contextType,
                        contextid: FO.contextID,
                        parentid: FO.parentID,
                        parenttype: FO.parentType,
                        counter: false
                    };
                var controlSelection = fieldsXmlToUse.filter(__runtimeJsonFilterMatchingItems, getControlValueObject);
                if (controlSelection.length == 1)
                {
                    sourceValue = controlSelection[0].fields[originalProperty].value;
                }
                else if (!checkExists(sourceValue) && checkExistsNotEmpty(controlID))
                {
                    getControlValueObject =
                        {
                            controlid: controlID
                        };
                    controlSelection = controlSelection.filter(__runtimeJsonFilterMatchingItems, getControlValueObject);
                    if (controlSelection.length == 1)
                    {
                        sourceValue = controlSelection[0].fields[originalProperty].value;
                    }
                }

                if (sourceValue && sourceValue.startsWith("<collection Type='Complex'>"))
                {
                    XP = baseCollectionXPath + "[@parentid='" + FO.parentID + "']/fields/field[@name='" + FO.PropertyName + "']/value";
                    var ValueNode = $sn($xml(sourceValue), XP);
                    if (checkExists(ValueNode))
                    {
                        Value = ValueNode.text;
                    }
                }

                if (!Value && checkExistsNotEmpty(sourceValue))
                {
                    continueCheck = false;
                    var currentSOInstances = [];
                    var originalPropertyXPath = "";

                    //allow xml based controls to get fields for single value selections
                    if (sourceValue.startsWith("<collection"))
                    {
                        var innerXP = baseCollectionXPath + "/fields/field/value";
                        var innerValues = $mn($xml(sourceValue), innerXP);
                        if (innerValues.length === 1)
                        {
                            sourceValue = innerValues[0].text;
                        }
                    }

                    var valueComparisonObj =
                        {
                            parentid: FO.parentID,
                            parenttype: FO.parentType,
                            controlid: controlID
                        };

                    currentSOInstances = fieldsXmlToUse.filter(__runtimeJsonFilterMatchingItems, valueComparisonObj);

                    var i = currentSOInstances.length;
                    if (i === 0 && FO.PropertyName === originalProperty)
                    {
                        Value = sourceValue;
                    }

                    while (i--)
                    {
                        var currentSOInstance = currentSOInstances[i];
                        if (checkExists(currentSOInstance) && checkExists(currentSOInstance.fields[originalProperty]) && currentSOInstance.fields[originalProperty].value == sourceValue)
                        {
                            var innerProperty = currentSOInstance.fields[FO.PropertyName];

                            if (checkExists(innerProperty))
                            {
                                if (returnClearedValue)
                                {
                                    Value = (innerProperty.cleared === true);
                                }
                                else
                                {
                                    Value = innerProperty.value;
                                }
                                break;
                            }
                        }
                    }
                }
            }
            if (continueCheck)
            {
                if (FO.contextType === "Association" || FO.contextType === "External")
                {
                    comparisonObj =
                        {
                            counter: counter
                        };

                    if (FO.isComposite === "true")
                    {
                        comparisonObj.parentid = FO.parentID;
                        comparisonObj.parenttype = FO.parentType;
                    }
                    else if (FO.contextType === "Association" && FO.viewType === "List")
                    {
                        comparisonObj.contexttype = "Primary";
                    }
                }
                else
                {
                    comparisonObj =
                        {
                            parentid: FO.parentID,
                            parenttype: FO.parentType,
                            counter: counter,
                            contextid: FO.contextID,
                            contexttype: FO.contextType
                        };
                }

                var Properties = fieldsXmlToUse.filter(__runtimeJsonFilterMatchingItems, comparisonObj);
                if (Properties.length === 1)
                {
                    var Property;

                    if (checkExists(Properties[0].joins) && (FO.contextType === "Association" || FO.contextType === "External"))
                    {
                        var joinComparisonObj =
                            {
                                parentid: FO.parentID,
                                parenttype: FO.parentType,
                                contextid: FO.contextID,
                                contexttype: FO.contextType
                            };
                        var joinResult = Properties[0].joins.filter(__runtimeJsonFilterMatchingItems, joinComparisonObj);
                        if (joinResult != null && joinResult.length > 0)
                        {
                            Property = joinResult[0].fields[FO.PropertyName];
                        }
                    }
                    else
                    {
                        Property = Properties[0].fields[FO.PropertyName];
                    }

                    if (!checkExists(Property))
                    {
                        Property = GetAssociationProperty(fieldsXmlToUse, FO, Properties);
                    }

                    if (checkExists(Property))
                    {
                        Property.cleared = !checkExistsNotEmpty(Property.value);
                        Value = GetPropertyValue(Property, returnClearedValue);
                    }
                }

            }
        }
    }
    if ((returnClearedValue) && (!checkExists(Value)))
    {
        Value = "";
    }
    return Value;
    //#endregion
}

/*
* GetAssociationProperty: Get a field value from an associated smartobject bound control after a SmartObject reload or refresh has taken place
*/
function GetAssociationProperty(fieldsXmlToUse, fieldObject, Properties)
{

    var returnProperty;
    if ((checkExistsNotEmpty(Properties) && Properties.length === 1)
        && checkExists(fieldObject.association)
        && (fieldObject.contextType === "Association" || fieldObject.contextType === "External"))
    {
        var originalProperty = fieldObject.association.getAttribute("OriginalProperty");
        var valueProperty = fieldObject.association.getAttribute("ValueProperty");
        if (checkExistsNotEmpty(originalProperty)
                && checkExistsNotEmpty(valueProperty)
                && checkExists(Properties[0].fields[originalProperty]))
        {
            var originalPropertyValue = Properties[0].fields[originalProperty].value;
            var comparisonObj =
            {
                parentid: fieldObject.parentID,
                parenttype: fieldObject.parentType,
                contextid: fieldObject.contextID,
                contexttype: fieldObject.contextType
            };

            var relatedInstances = fieldsXmlToUse.filter(__runtimeJsonFilterMatchingItems, comparisonObj);

            if (relatedInstances != null && relatedInstances.length > 0)
            {
                var i = relatedInstances.length;
                while (i--)
                {
                    var soInst = relatedInstances[i];
                    if (checkExists(soInst)
                            && checkExists(soInst.fields[valueProperty])
                            && checkExists(soInst.fields)
                            && checkExists(fieldObject.PropertyName)
                            && soInst.fields[valueProperty].value === originalPropertyValue)
                    {
                        returnProperty = soInst.fields[fieldObject.PropertyName];
                        break;
                    }
                }
            }
        }
    }
    return returnProperty;
}

/*
* GetPropertyValue: 
* Return the property value
*/
function GetPropertyValue(property, returnClearedValue)
{
    var returnValue = "";
    if (returnClearedValue)
    {
        returnValue = (property.cleared === true);
    }
    else
    {
        returnValue = property.value;
    }

    return returnValue;
}

/* getCombinedHiddenPropertyCollection: get a collection of property values in an xml document format */
/* if no ObjectID is passed it is getting all the SO's for the current view */
function getCombinedHiddenPropertyCollection(viewID, parentID, parentType, PageNumber, controlID, counter, removeAttribute, contextID, contextType, instanceID)
{
    //#region
    //only instance where removeAttribute was used was for viewid in helper.js in transformOriginalXMLForControl, this parameter can be removed
    var comparisonObj = { parentid: parentID, parenttype: parentType, controlid: controlID, pagenumber: PageNumber, counter: counter, contextid: contextID, contexttype: contextType };
    return getHiddenPropertyCollection(viewID, instanceID, comparisonObj);
    //#endregion
}

//returns collection of objects satisfying criteria
function getHiddenPropertyCollection(viewID, instanceID, comparisonObj)
{
    //#region
    var results = [];
    var hiddenHash = getViewHiddenHash(viewID, instanceID);
    if (hiddenHash.length > 0)
    {
        results = hiddenHash.filter(__runtimeJsonFilterMatchingItems, comparisonObj);
    }
    return results;
    //#endregion
}

/* getHiddenParameter: get hidden parameter value */
function getHiddenParameter(viewID, parentID, ParameterName, methodName)
{
    //#region
    var comparisonObj = { parentid: parentID, parenttype: "Object", method: true };
    var Value = null;
    var hiddenHash = getViewHiddenHash(viewID, null);
    if (hiddenHash.length > 0)
    {
        var Parameters = hiddenHash.filter(__runtimeJsonFilterMatchingItems, comparisonObj);
        var p = Parameters.length;
        while (p--)
        {
            if (Parameters[p].parameters)
            {
                //loop through here and set via this logic
                var parameter = Parameters[p].parameters[ParameterName];
                if (checkExists(parameter))
                {
                    Value = parameter.value;
                    break;
                }
            }
        }
    }
    return Value;
    //#endregion
}

/* getHiddenParameterCollection: get the hidden parameter values for a view - all methods */
function getHiddenParameterCollection(viewID)
{
    var comparisonObj = { parenttype: "Object", method: true };
    return getHiddenPropertyCollection(viewID, null, comparisonObj);
}

/* getHiddenParameterCollectionXml: returns the parameter collection for the current view as xml to keep backwards compatibility */
function getHiddenParameterCollectionXml(viewID)
{
    var comparisonObj = { parenttype: "Object", method: true };
    var Parameters = getHiddenPropertyCollection(viewID, null, comparisonObj);
    var p = Parameters.length;

    if (p > 0)
    {
        var xmlDoc = $xml("<collection/>");
        while (p--)
        {
            //loop through here and set via this logic
            var items = Parameters[p].parameters;

            if (checkExists(items))
            {
                var object = xmlDoc.createElement("object");
                object.setAttribute("parentid", Parameters[p].parentid);
                object.setAttribute("parenttype", "Object");
                object.setAttribute("viewid", viewID);

                var fields = xmlDoc.createElement("fields");

                for (var item in items)
                {
                    var field = xmlDoc.createElement("field");
                    field.setAttribute("name", item)
                    field.setAttribute("type", "MethodParameter");

                    var value = xmlDoc.createElement("value");
                    value.appendChild(xmlDoc.createTextNode(Parameters[p].parameters[item].value));
                    field.appendChild(value);
                    fields.appendChild(field);
                }
                object.appendChild(fields);
                xmlDoc.documentElement.appendChild(object);
            }
        }
        return xmlDoc;
    }
}

/*************** REMOVE ******************************************************/
/* removeHiddenPropertyCollection 
- remove all values in the hiddens for a specific view that is collection related (contains a counter)
- if the SOGuid is included, remove only values relating to that SO for the view
*/
function removeHiddenPropertyCollection(viewID, parentID, parentType, pageNumber, controlID, includeCounter, contextType, instanceID, contextID, removeCounter)
{
    //#region
    var counter = true;
    if (includeCounter === false)
    {
        counter = null;
    }
    else
    {
        counter = includeCounter;
    }
    if (removeCounter === true)
    {
        counter = false;
    }

    var hashName = returnHashName(viewID, instanceID);
    var currentHash = ViewHiddenHash[hashName];

    if (currentHash && currentHash.length > 0)
    {
        var originalLength = currentHash.length;
        viewWriteStatus[hashName] = true;
        var comparisonObj = { parentid: parentID, parenttype: parentType, counter: counter, controlid: controlID, pagenumber: pageNumber, contexttype: contextType, method: false, contextid: contextID };
        var SOs = currentHash.filter(__runtimeJsonFilterMatchingItems, comparisonObj);

        var s = SOs.length;
        if (s === 0)
        {
            viewWriteStatus[hashName] = false;
            return;
        }
        else if (s === originalLength) //all records affected
        {
            ViewHiddenHash[hashName] = [];
        }
        else
        {
            while (s--)
            {
                var currentSO = SOs[s];
                currentHash.splice(currentHash.indexOf(currentSO), 1);
            }
            ViewHiddenHash[hashName] = currentHash;
        }
        viewWriteStatus[hashName] = false;
    }
    //#endregion
}

//have to change this so the removed attribute is valid (for single save circumstances) 
//combination of previous removeHiddenProperty function
function removeHiddenPropertyCollectionItem(viewID, controlID, counter, instanceID)
{
    //#region
    var contextType = null;
    var single = true;
    if (!checkExists(counter))
    {
        counter = false;
        single = false;
    }
    else
    {
        contextType = "Primary";
    }

    var hashName = returnHashName(viewID, instanceID);
    var currentHash = ViewHiddenHash[hashName];

    if (currentHash && currentHash.length > 0)
    {
        var originalLength = currentHash.length;
        viewWriteStatus[hashName] = true;
        var comparisonObj = { counter: counter, controlid: controlID, contexttype: contextType };
        var SOs = currentHash.filter(__runtimeJsonFilterMatchingItems, comparisonObj);

        var s = SOs.length;
        if (s > 0)
        {
            while (s--)
            {
                var currentSO = SOs[s];
                var innerState = currentSO.state;

                switch (innerState)
                {
                    case "Added":
                        //can remove from array
                        currentHash.splice(currentHash.indexOf(currentSO), 1);
                        break;
                    default:
                        currentSO.state = "Removed";
                        break;
                }
            }
            ViewHiddenHash[hashName] = currentHash;
        }
        viewWriteStatus[hashName] = false;
    }
    //#endregion
}

/*************** WRITE + PERSIST ******************************************************/
//actually attempt to update the xml available to the view
function writeHiddens(hashName)
{
    //#region
    if (hiddenValueArray[hashName].length > 0)
    {
        var hiddenHash = ViewHiddenHash[hashName];
        if (!checkExists(hiddenHash))
        {
            hiddenHash = [];
        }

        while (hiddenValueArray[hashName].length > 0)
        {
            viewWriteStatus[hashName] = true;
            var queueValue = hiddenValueArray[hashName].shift();

            if (isOfType("Array", queueValue)) //array 
            {
                if (hiddenHash.length > 0)
                {
                    while (queueValue.length > 0)
                    {
                        var currentQueueValue = queueValue.shift();
                        hiddenHash = manipulateHiddenValues(hiddenHash, currentQueueValue);
                    }
                }
                else
                {
                    hiddenHash = queueValue;
                }
            }
            else if (isOfType("Object", queueValue) && (checkExists(queueValue.fields) || checkExists(queueValue.parameters)))
            {
                //merge with existing viewhiddenhash
                hiddenHash = manipulateHiddenValues(hiddenHash, queueValue);
            }
            viewWriteStatus[hashName] = false;
        }
        ViewHiddenHash[hashName] = hiddenHash;
    }
    //#endregion
}


//actually manipulate the xml available to the view
function manipulateHiddenValues(hiddenHashArray, currentNode)
{
    //#region
    var existingItems = [];
    if (hiddenHashArray.length > 0)
    {
        currentNode.ignoreFields = true;
        currentNode.ignoreState = true;
        if (!checkExists(currentNode.counter))
        {
            currentNode.counter = false;
        }
        existingItems = hiddenHashArray.filter(__runtimeJsonFilterMatchingItems, currentNode);
    }

    if (currentNode.counter === false)
    {
        delete currentNode.counter;
    }
    delete currentNode.ignoreFields;
    delete currentNode.ignoreState;

    if (existingItems.length === 1)
    {
        //update fields
        var removeItem = jsonExtendObject(existingItems[0], currentNode);
        if (removeItem === true)
        {
            hiddenHashArray.splice(hiddenHashArray.indexOf(existingItems[0]), 1);
        }
    }
    else
    {
        var state = currentNode.state;
        if (checkExists(state))
        {
            if (state === "Changed")
            {
                currentNode.state = "Added";
            }
        }
        else
        {
            currentNode.state = "Added";
        }
        hiddenHashArray.push(currentNode);
    }
    return hiddenHashArray;
    //#endregion
}

//helper function to push the hidden values, check the write status of the current view's hiddens and continue the persisting of the values
function pushHiddenValue(viewID, instanceID, value)
{
    //#region
    var hashName = returnHashName(viewID, instanceID);
    if (!checkExists(hiddenValueArray[hashName]))
    {
        hiddenValueArray[hashName] = [];
    }
    hiddenValueArray[hashName].push(value);
    if (!viewWriteStatus[hashName])
    {
        writeHiddens(hashName);
    }
    //#endregion
}

//helper function to return the correct built up hash name according to view and instanceid
function returnHashName(viewID, instanceID)
{
    //#region
    var fixedInstanceID = "_";
    if (checkExistsNotEmpty(instanceID))
    {
        fixedInstanceID += instanceID;
    }
    else
    {
        fixedInstanceID += _runtimeEmptyGuid;
    }

    var exportToExcelData = getExportToExcelData({ viewId: viewID, instanceId: instanceID });

    if (exportToExcelData.busyExporting === true)
    {
        fixedInstanceID += "_xlsx";
    }

    return viewID + fixedInstanceID;
    //#endregion
}

//helper function to get correct view fields - accommodating instanceID for better performance - more smaller collections
function getViewHiddenHash(viewID, instanceID)
{
    //#region
    var hashName = returnHashName(viewID, instanceID);
    if (!checkExists(ViewHiddenHash[hashName]))
    {
        ViewHiddenHash[hashName] = [];
    }
    return ViewHiddenHash[hashName];
    //#endregion
}

function getAllViewHiddenHashNames()
{
    return Object.keys(ViewHiddenHash);
}

function getAllViewWriteStatusNames()
{
    return Object.keys(viewWriteStatus);
}

/********************* VALIDATE PAGING RECORDS ***********************************/
//#region
function verifyRecordsForPage(viewID, pageNumber, instanceID)
{
    var currentNode = { pagenumber: pageNumber };
    var hiddenHash = getViewHiddenHash(viewID, instanceID);
    if (hiddenHash.length > 0)
    {
        var resultNodes = hiddenHash.filter(__runtimeJsonFilterMatchingItems, currentNode);
        return resultNodes.length;
    }
    else
    {
        return 0;
    }
}
//#endregion

/********************** FOREACH HANDLER FIELD ITEM FUNCTIONS **********************/
//#region

function getViewItemsCollectionViewDef(findObject) {
    var windowToUse = window;
    var viewDef = _runtimeControllerFindObject(findObject);
    if (!checkExists(viewDef)) {
        findObject.transferredID = __runtimeParentSubformID;
        findObject.runtimeContextID = __runtimeParentContextID;
        windowToUse = findCorrectInstanceForDataTransfer(findObject).WindowToUse;

        if (windowToUse !== window.self) {
            return windowToUse.getViewItemsCollectionViewDef(findObject);
        }
    }

    return { viewDef: viewDef, windowToUse: windowToUse };
}

//returns all the field items for a specified View instance according to the function XML specified (filtered by itemstate)
function ViewItemsCollection(functionXML)
{
    //#region
    var functionResults = [];
    var functionParameters = null;

    if (checkExists(functionXML))
    {
        functionParameters = $mn(functionXML, "*/Item[(@SourceType) and (@SourceID)]");
    }

    if (checkExists(functionParameters) && functionParameters.length > 0)
    {
        var instanceID = functionXML.getAttribute("InstanceID");
        var parameterValues = evaluateFunctionParameters(functionParameters);
        var viewID = parameterValues["VIEW"];
        var itemState = parameterValues["ITEMSTATE"];

        if (checkExistsNotEmpty(viewID))
        {
            var findObject = { instanceID: instanceID, viewID: viewID };
            var viewDefObj = getViewItemsCollectionViewDef(findObject);

            if (!checkExists(viewDefObj.viewDef))
            {
                findObject = { instanceID: null, viewID: viewID };
                viewDefObj = getViewItemsCollectionViewDef(findObject);
                if (checkExists(viewDefObj.viewDef))
                {
                    instanceID = null;
                }
            }

            if (checkExists(viewDefObj.viewDef))
            {
                functionResults = viewDefObj.windowToUse.getViewItemsCollectionFunctionResults(viewDefObj.viewDef, viewID, instanceID, itemState);
            }
        }
    }

    return functionResults;
    //#endregion
}

function getViewItemsCollectionFunctionResults(viewDef, viewID, instanceID, itemState)
{
    var functionResults = [];

    var mainTable = viewDef.getAttribute("MainTable");
    var viewContextID = viewDef.getAttribute("ContextID");

    if (checkExists(mainTable) && mainTable.length > 0)
    {
        var table = jQuery("#" + mainTable);
        if (table[0].getAttribute("editable") === "true")
        {
            attemptItemChanges(table, viewID, instanceID);
        }
    }

    var hiddenCollection = getViewHiddenHash(viewID, instanceID);

    if (checkExists(hiddenCollection) && hiddenCollection.length > 0)
    {
        var comparisonObj = {
            parentid: viewContextID,
            parenttype: "Object",
            state: itemState,
            contexttype: "Primary",
            counter: true
        };

        if (checkExistsNotEmpty(itemState))
        {
            var itemStateUpper = itemState.toUpperCase();
            switch (itemStateUpper)
            {
                case "SELECTED":
                case "UNSELECTED":
                    var viewRowCounters = getViewRowCounters(mainTable, itemStateUpper);
                    if (checkExists(viewRowCounters) && (viewRowCounters.length > 0))
                    {
                        comparisonObj.counters = viewRowCounters;
                        delete comparisonObj.counter;
                        delete comparisonObj.state;
                    }
                    else
                    {
                        comparisonObj = null;
                    }
                    break;
                case "UNCHANGED":
                    delete comparisonObj.contexttype;
                    break;
            }
        }

        if (checkExists(comparisonObj))
        {
            var currentNodes = hiddenCollection.filter(__runtimeJsonFilterMatchingItems, comparisonObj);

            if (checkExists(currentNodes) && currentNodes.length > 0)
            {
                var l = currentNodes.length;
                for (var cn = 0; cn < l; cn++)
                {
                    functionResults.push({ viewID: viewID, item: currentNodes[cn], counter: currentNodes[cn].counter });
                }
            }
        }
    }

    return functionResults;
    //#endregion
}

//returns all the field items for a specified datasource bound list Control on a View instance according to the function XML specified (filtered by itemstate)
function ControlItemsCollection(functionXML)
{
    //#region
    var functionResults = [];

    var functionParameters = null;

    if (checkExists(functionXML))
    {
        functionParameters = $mn(functionXML, "*/Item[(@SourceType) and (@SourceID)]");
    }

    if (checkExists(functionParameters) && functionParameters.length > 0)
    {
        var instanceID = functionXML.getAttribute("InstanceID");
        var parameterValues = evaluateFunctionParameters(functionParameters);
        var viewID = parameterValues["VIEW"];
        var controlID = parameterValues["CONTROL"];
        var itemState = parameterValues["ITEMSTATE"];

        if (checkExistsNotEmpty(viewID))
        {
            var instanceSpecificControlID = getInstanceSpecificControlID(instanceID, controlID);

            if (checkExistsNotEmpty(instanceSpecificControlID))
            {
                var findObject = { instanceID: instanceID, viewID: viewID };
                var viewDef = _runtimeControllerFindObject(findObject);
                if (!checkExists(viewDef))
                {
                    findObject.transferredID = __runtimeParentSubformID;
                    findObject.runtimeContextID = __runtimeParentContextID;
                    var windowToUse = findCorrectInstanceForDataTransfer(findObject).WindowToUse;

                    if (windowToUse !== window.self)
                    {
                        return windowToUse.ControlItemsCollection(functionXML);
                    }
                }
                else
                {

                    var controlXML = $sn(viewDef, "Controls/Control[@ID='" + instanceSpecificControlID + "'][Properties/Property/Name/text()='GetItems']");

                    if (checkExists(controlXML))
                    {
                        var controlHiddenPropCollection = getCombinedHiddenPropertyCollection(viewID, null, "Object", null, instanceSpecificControlID, true, null, null, null, instanceID);

                        var objInfo = new PopulateObject(null, itemState, instanceSpecificControlID, null, null, controlHiddenPropCollection);

                        var controlItems = executeControlFunction(controlXML, "GetItems", objInfo);

                        if (checkExists(controlItems))
                        {
                            var l = controlItems.length;
                            if (l > 0)
                            {
                                var useXml = (controlItems[0].xml !== null && typeof controlItems[0].xml !== "undefined");
                                for (var i = 0; i < l; i++)
                                {
                                    var currItem = controlItems[i];
                                    if (useXml)
                                    {
                                        //this is only for backwards compatibility where controlpack and custom controls are still returning XML
                                        currItem = _runtimeTransformXmlFieldsToObject(currItem);
                                    }
                                    functionResults.push({ viewID: viewID, controlID: controlID, item: currItem, counter: currItem.counter });
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    return functionResults;
    //#endregion
}

//translates function parameter item values into object containing similar properties
function evaluateFunctionParameters(itemNodes)
{
    var resultObj = {};
    var l = itemNodes.length;
    while (l--)
    {
        var relevantNode = itemNodes[l];
        var sourceType = relevantNode.getAttribute("SourceType").toUpperCase();
        var value = relevantNode.getAttribute("SourceID");
        resultObj[sourceType] = value;
    }
    return resultObj;
}

//#endregion

//#region JSON logic
var jsonCompareItemToObject = function (itemNode, objNode)
{
    var result = true;

    var ignoreFields = objNode.ignoreFields;//this counts for fields and parameters
    var ignoreState = objNode.ignoreState;

    for (var key in objNode)
    {
        switch (key)
        {
            case "ignoreFields":
            case "ignoreState":
            case "join":
            case "name":
            case "joins":
            case "instanceid":
                result = true;
                break;
            case "fields":
                if (ignoreFields)
                {
                    result = true;
                }
                else if (Object.keys(itemNode.fields).length > 0 && Object.keys(objNode.fields).length > 0)
                {
                    result = jsonCompareItemToObject(itemNode.fields, objNode.fields);
                }
                break;
            case "parameters":
                if (ignoreFields)
                {
                    result = true;
                }
                else if (Object.keys(itemNode.parameters).length > 0 && Object.keys(objNode.parameters).length > 0)
                {
                    result = jsonCompareItemToObject(itemNode.parameters, objNode.parameters);
                }
                break;
            case "state":
                if (ignoreState)
                {
                    result = true;
                }
                else if (objNode[key] === "All")
                {
                    result = (itemNode[key] !== "Removed");
                }
                else if (objNode[key] !== itemNode[key])
                {
                    result = false;
                }
                break;
            case "counters":
                var counters = objNode[key];
                if (counters.indexOf(itemNode.counter) > -1)
                {
                    result = true;
                }
                else
                {
                    result = false;
                }
                break;
            default:
                if (key === "joins" && ignoreFields)
                {
                    result = true;
                }
                else if (objNode[key] !== null && typeof objNode[key] !== "undefined")
                {
                    //test for true/false to see if key exists
                    if (objNode[key] === true)
                    {
                        result = (itemNode[key] != null && typeof itemNode[key] != "undefined");
                    }
                    else if (objNode[key] === false)
                    {
                        result = (itemNode[key] === null || typeof itemNode[key] === "undefined");
                    }
                    else if (objNode[key] !== itemNode[key])
                    {
                        result = false;
                    }
                }
                break;
        }

        if (result === false)
        {
            break;
        }
    }
    return result;
};

var jsonExtendObject = function (itemNode, objNode)
{
    var removeItem = false;
    for (var key in objNode)
    {
        if (key === "fields")
        {
            if (!checkExists(itemNode.fields))
            {
                itemNode.fields = {};
            }
            result = jsonExtendObject(itemNode.fields, objNode.fields);
        }
        else if (key === "parameters")
        {
            if (!checkExists(itemNode.parameters))
            {
                itemNode.parameters = {};
            }
            result = jsonExtendObject(itemNode.parameters, objNode.parameters);
        }
        else if (key === "joins")
        {
            if (!checkExists(itemNode.joins))
            {
                itemNode.joins = [];
            }
            result = jsonExtendObject(itemNode.joins, objNode.joins);
        }
        else if (key === "state" && checkExistsNotEmpty(itemNode.counter) && checkExistsNotEmpty(objNode.counter))
        {
            var state = objNode.state;
            var innerState = itemNode.state;

            if (checkExists(state))
            {
                if (checkExists(innerState))
                {
                    if ((innerState === "Added") && (state === "Removed"))
                    {
                        removeItem = true;
                        break;
                    }
                    else if ((innerState === "Removed") && (state === "Unchanged"))
                    {
                        removeItem = true;
                        break;
                    }
                    else if ((innerState === "Added") && (state === "Changed"))
                    {
                        itemNode.state = "Added";
                    }
                    else
                    {
                        itemNode.state = state;
                    }
                }
                else
                {
                    itemNode.state = state;
                }
            }
        }
        else
        {
            itemNode[key] = objNode[key];
        }
    }
    return removeItem;

}

var jsonCopyAndExtendObject = function (objNode, counter) //useful for cloning an object, just changing the counter attribute (editable lists)
{
    var itemNode = {};
    for (var key in objNode)
    {
        switch (key)
        {
            case "fields":
                itemNode.fields = {};
                jsonExtendObject(itemNode.fields, objNode.fields);
                break;
            case "parameters":
                itemNode.parameters = {};
                jsonExtendObject(itemNode.parameters, objNode.parameters);
                break;
            case "joins":
                itemNode.joins = [];
                jsonExtendObject(itemNode.joins, objNode.joins);
                break;
            default:
                itemNode[key] = objNode[key];
                break;
        }
    }
    if (counter !== null && typeof counter !== "undefined")
    {
        if (counter === false)
        {
            delete itemNode.counter;
        }
        else
        {
            itemNode.counter = counter;
        }
    }
    return itemNode;
}


var __runtimeJsonFilterMatchingItems = function (item)
{
    return jsonCompareItemToObject(item, this);
};

var isOfType = function (type, obj)
{
    var clas = Object.prototype.toString.call(obj).slice(8, -1);
    return obj !== undefined && obj !== null && clas === type;
}
//#endregion
