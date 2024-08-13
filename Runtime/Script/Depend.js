/* Depend.js - implementation of dependant functionality */

var actionExecutionArray = [];

//start loading the dependant values for the specific control based on the actual value
function startLoadingDependantValues(controlId, actualValue, counter, instanceID, executionStack, loopContextID)
{
    //#region
    //get these values from the dependency
    var control = new dataSourceLookup({ xmlDoc: viewControllerDefinition, sourceControlID: controlId, parentControlExists: true }).getDataSource();
    if (checkExists(control))
    {
        var parentPropertyName = control.getAttribute("ParentJoinProperty");
        var ParentControlID = control.getAttribute("ParentControlID");
        var childPropertyValue = actualValue;
        var childPropertyName = control.getAttribute("ChildJoinProperty");
        var currentControl = _runtimeControllerFindObject({ controlID: ParentControlID });
        var parentPropertyValue = getHiddenFieldValue(currentControl.getAttribute("FieldID"), null, null, null, instanceID, loopContextID, true);
        if (parentPropertyValue)
        {
            getActionsWithControlAsResult(controlId, parentPropertyName, parentPropertyValue, childPropertyValue, childPropertyName, instanceID);
            setParentControlValue(ParentControlID, parentPropertyValue, instanceID, null, executionStack, loopContextID);
        }
    }
    //#endregion
}

//populate the parent control with the value and kick of the loading of dependant values
function setParentControlValue(parentControlID, actualValue, instanceID, counter, executionStack, loopContextID)
{
    //#region
    var currentControl = _runtimeControllerFindObject({ controlID: parentControlID, propertySearch: "SetValue" });

    if (checkExists(currentControl))
    {
        var objInfo = new PopulateObject(null, actualValue, parentControlID, null, true);
        executionStack.push({ objInfo: objInfo, currentControl: currentControl });
        startLoadingDependantValues(parentControlID, actualValue, counter, instanceID, executionStack, loopContextID);
    }
    //#endregion
}

//return actions with control as result - needed to allow correct SO execution from rule definitions
function getActionsWithControlAsResult(controlId, parentPropertyName, parentPropertyValue, childPropertyValue, childPropertyName, instanceID)
{
    //#region
    var instanceXP = checkExists(instanceID) ? "[@TargetInstanceID='" + instanceID + "']" : "";
    var controlAsTargetXPath = "Events/Event[@SourceType='Control'][Name/text()='OnChange']/Handlers/Handler/Actions/Action[Results/Result[@TargetID='" + controlId + "'][@TargetType='Control']" + instanceXP + "]";
    var resultingActions = $mn(formBindingXml, controlAsTargetXPath);
    if (resultingActions.length > 0)
    {
        for (var rl = 0; rl < resultingActions.length; rl++)
        {
            var miniArray = [];
            miniArray.push(resultingActions[rl]); //cloning removed so that actual/sourcevalues can be set - will be removed on execution of the action - which is fired by the control itself now
            miniArray.push(parentPropertyName);
            miniArray.push(parentPropertyValue);
            miniArray.push(childPropertyName);
            miniArray.push(childPropertyValue);
            actionExecutionArray.push(miniArray);
        }
        inspectResultActions();
    }
    //#endregion
}

//inspect and execute resulting actions
function inspectResultActions()
{
    //#region
    while (actionExecutionArray.length > 0)
    {
        var actionInstance = actionExecutionArray.shift(); //mini array

        var currentAction = actionInstance.shift();
        var clPopulatedPropertyName = actionInstance.shift(); //parent
        var clPopulatedPropertyValue = actionInstance.shift(); //parent
        var clResultPropertyName = actionInstance.shift(); //child
        var clResultPropertyValue = actionInstance.shift(); //child
        var parameters = $mn(currentAction, "Parameters/Parameter");

        if (parameters.length > 0)
        {
            //loop through parameters and add properties 
            for (var p = 0; p < parameters.length; p++)
            {
                var target = parameters[p].getAttribute("TargetID");
                var targetType = parameters[p].getAttribute("TargetType");

                if (targetType.toLowerCase() === "objectproperty" && target.toLowerCase() === clResultPropertyName.toLowerCase())
                {
                    var sourceValue = $sn(parameters[p], "SourceValue");
                    var actualValue = $sn(parameters[p], "ActualValue");
                    //remove previous instances if they exist
                    if (checkExists(sourceValue))
                    {
                        parameters[p].removeChild(sourceValue);
                    }
                    if (checkExists(actualValue))
                    {
                        parameters[p].removeChild(actualValue);
                    }

                    var value = viewControllerDefinition.createElement("SourceValue");
                    value.appendChild(viewControllerDefinition.createTextNode(clPopulatedPropertyValue));
                    parameters[p].appendChild(value);
                    if (clResultPropertyValue.length > 0)
                    {
                        var avalue = viewControllerDefinition.createElement("ActualValue");
                        avalue.appendChild(viewControllerDefinition.createTextNode(clResultPropertyValue));
                        parameters[p].appendChild(avalue);
                    }
                }
            }
        }
    }
    //#endregion
}

//clear the dependant value of the specific control
function startClearingDependantValues(controlID, jsonData)
{
    //#region
    var control = new dataSourceLookup({ xmlDoc: viewControllerDefinition, parentControlID: controlID }).getDataSource();

    if (!checkExists(control))
    {
        control = new dataSourceLookup({ xmlDoc: viewControllerDefinition, sourceControlID: controlID }).getDataSource();
    }

    if (checkExists(control))
    {
        var ChildControlID = control.getAttribute("SourceControlID");
        var currentControl = _runtimeControllerFindObject({ controlID: controlID, propertySearch: "SetItems" });

        if (checkExists(currentControl))
        {
            var objInfo = new PopulateObject(null, "0", controlID, null, null, jsonData);
            executeControlFunction(currentControl, "SetItems", objInfo);
            if (ChildControlID !== controlID)
            {
                startClearingDependantValues(ChildControlID, jsonData);
            }
        }
    }
    //#endregion
}

//clear the dependant control's parent values
function startClearingDependantParentValues(controlID, jsonData)
{
    //#region

    if (!checkExists(jsonData))
    {
        jsonData = [];
    }
    var control = new dataSourceLookup({ xmlDoc: viewControllerDefinition, sourceControlID: controlID, parentControlExists: true }).getDataSource();

    if (checkExists(control))
    {
        var ParentControlID = control.getAttribute("ParentControlID");

        currentControl = _runtimeControllerFindObject({ controlID: controlID, propertySearch: "SetItems" });

        if (checkExists(currentControl))
        {
            //clear the items in the child control
            var objInfo = new PopulateObject(null, "0", controlID, null, null, jsonData);
            executeControlFunction(currentControl, "SetItems", objInfo);

            //clear the parent control value
            currentControl = _runtimeControllerFindObject({ controlID: ParentControlID, propertySearch: "SetValue" });

            if (checkExists(currentControl))
            {
                objInfo = new PopulateObject(null, "0", ParentControlID, null, true, jsonData);
                executeControlFunction(currentControl, "SetValue", objInfo);

                startClearingDependantParentValues(ParentControlID, jsonData);
            }
        }
    }
    //#endregion
}
