/* Form List events -- for list executions and extensions (like capture lists) */
function listExecutionAction(currentAction, methodExecuted, returnXMLPackage, behaviour)
{
    //#region
    var loopContextID = getLoopContextID(currentAction);

    var mainTableID = "";
    var viewID = currentAction.getAttribute("ViewID");
    var instanceID = currentAction.getAttribute("InstanceID");
    if (checkExists(viewID))
    {
        mainTableID = getViewMainTable(viewID, instanceID);
    }

    if (mainTableID.length > 0)
    {
        var mainTable = jQuery("#" + mainTableID); //document.getElementById(mainTableID);
        if (!checkExists(mainTable[0].getAttribute("editable")))
        {
            mainTable[0].setAttribute("editable", "false");
        }
        var method = currentAction.getAttribute("Method");
        switch (method)
        {
            case "AddItem":
                //adds a new capture item to the row
                addListItemRow(mainTable, null, loopContextID);
                break;
            case "EditItem":
                //edits the selected item
                editListItemRow(mainTable, loopContextID);
                break;
            case "RemoveItem":
                //removes the item from the list
                removeListItemRow(mainTable, loopContextID);
                break;
            case "AcceptItem":
                //accepts the changes made in the capture item and persists the changes to the hidden fields
                acceptItemChanges(mainTable, loopContextID);
                break;
            case "CancelItem":
                //rejects the changes made in the capture item and cancels any changes to the hidden fields
                cancelItemChanges(mainTable, null, loopContextID);
                break;
        }
    }

    endActionExecution({ loopContextID: loopContextID, behaviour: behaviour });
    //#endregion
}

//sets whether the view is editable or not and setting the relevant counters etc.
function setListAttributes(mainTable, editable, actionType, loopContextID)
{
    //#region
    var counters = {};
    var htmlTable = mainTable[0];
    htmlTable.setAttribute("editable", editable);
    if (editable === "true")
    {
        var selectedIndex = "";
        var selectedCounter = "";

        if (actionType === "add")
        {
            selectedCounter = returnNewMaxCounter(htmlTable);
            var rows = SFRGrid.execute({ element: mainTable, fn: "fetch", params: ["rows"] });
            selectedIndex = checkExists(rows) ? (rows.length + 1) : 1;
        }
        else
        {
            selectedCounter = getLoopContextData({ loopContextID: loopContextID, mainTable: mainTable }).counter;
            var selectedRow = null;

            if (!checkExistsNotEmpty(selectedCounter))
            {
                var selectedRow = returnSelectedRow(mainTable);
                if (checkExists(selectedRow) && (selectedRow.length > 0))
                {
                    selectedIndex = selectedRow[0].rowIndex;
                    selectedCounter = selectedRow.children("td").metadata().counter;
                }
                else
                {
                    //must reset counter
                    selectedCounter = "";
                }
            }
            else
            {
                selectedRow = returnRowFromCounter(mainTable, selectedCounter);

                if (checkExists(selectedRow))
                {
                    selectedIndex = selectedRow[0].rowIndex;
                }
            }
        }
        counters.selectedCounter = selectedCounter;
        counters.selectedIndex = selectedIndex;

        htmlTable.setAttribute("selectedCounter", selectedCounter);
        htmlTable.setAttribute("selectedIndex", selectedIndex);
        htmlTable.setAttribute("actionType", actionType);
        htmlTable.setAttribute("changingrow", editable);
        SFRGrid.execute({ element: mainTable, fn: "option", params: ["sorting", false] });
    }
    else
    {
        htmlTable.removeAttribute("selectedCounter");
        htmlTable.removeAttribute("selectedIndex");
        htmlTable.removeAttribute("actionType");
        SFRGrid.execute({ element: mainTable, fn: "commit" });
        SFRGrid.execute({ element: mainTable, fn: "option", params: ["sorting", true] });
    }
    return counters;
    //#endregion
}

//add a row to the list
function addListItemRow()
{
    //#region
    var mainTable, viewID, instanceID;

    mainTable = arguments[0].closest(".grid");

    if (mainTable.length > 0) // only add the row if the table exists.
    {
        if (mainTable.attr("isdisabled") !== "true" && (mainTable[0].getAttribute("changingrow") !== "true"))
        {
            var callerType = arguments[1];
            var viewInstanceInfo = new getMainTableViewInformation(mainTable.attr("id"));
            viewID = viewInstanceInfo.viewID;
            instanceID = viewInstanceInfo.instanceID;
            var listEditable = viewInstanceInfo.ListEditable;
            if (callerType !== "override" && checkExists(listEditable) && listEditable === "single")
            {
                mainTable[0].setAttribute("singleEdit", "add");
            }
            attemptItemChanges(mainTable, viewID, instanceID, arguments[2]);
            if (!checkExists(mainTable[0].getAttribute("editable")))
            {
                mainTable[0].setAttribute("editable", "false");
            }
            if (mainTable[0].getAttribute("editable") === "false")
            {
                clearListItemRow(viewID, instanceID);
                setListAttributes(mainTable, "true", "add");
                var jqMainTable = jQuery(mainTable);
                SFRGrid.execute({ element: jqMainTable, fn: "edit", params: ["new"] });
                SFRGrid.execute({ element: jqMainTable, fn: "runtimeSyncColumns" });
                resetDefaultControlValues(viewID, instanceID, arguments[2]); //fix for default values when a new list item row is added
                mainTable[0].setAttribute("changingrow", "false");
            }
            handleEvent(viewID, "View", "ListRowAdded", null, instanceID, null, null, null, null, null, null, arguments[2]);
        }
    }
    //#endregion
}

//edit the current row that is selected in the list
function editListItemRow(mainTable, loopContextID, callerType)
{
    //#region
    if (mainTable.length > 0 && (mainTable[0].getAttribute("changingrow") !== "true"))
    {
        var viewInstanceInfo = new getMainTableViewInformation(mainTable.attr("id"));
        var viewID = viewInstanceInfo.viewID;
        var instanceID = viewInstanceInfo.instanceID;
        var listEditable = viewInstanceInfo.ListEditable;

        if (callerType !== "override" && checkExists(listEditable) && listEditable === "single")
        {
            mainTable[0].setAttribute("singleEdit", "edit");
        }

        attemptItemChanges(mainTable, viewID, instanceID, loopContextID);
        if (mainTable[0].getAttribute("editable") === "false")
        {
            var listResult = setListAttributes(mainTable, "true", "update", loopContextID);
            var selectedCounter = listResult.selectedCounter;
            var selectedIndex = listResult.selectedIndex;

            if (selectedCounter !== "") //if valid selection is made
            {
                SFRGrid.execute({ element: jQuery(mainTable), fn: "edit", params: [selectedIndex] });
                transferListItemData(selectedCounter, viewID, instanceID, loopContextID);
            }
            else
            {
                setListAttributes(mainTable, "false", null);
            }
            mainTable[0].setAttribute("changingrow", "false");
        }
    }
    //#endregion
}

//Only commits the row in editing without triggering rowclick event
//This is used when the row is comitted without clicking on another row, eg. with enter keypressed
function commitListItemRow(row)
{
    //#region
    var mainTable = row.closest(".grid");

    // only commit the row if the table exists and enabled
    if (mainTable.length > 0 && mainTable.attr("isdisabled") !== "true")
    {
        var viewInstanceInfo = new getMainTableViewInformation(mainTable.attr("id"));
        var viewID = viewInstanceInfo.viewID;
        var instanceID = viewInstanceInfo.instanceID;
        attemptItemChanges(mainTable, viewID, instanceID);
    }
    //#endregion
}

//changes made in the capture list is accepted, and hidden fields will now be updated correspondingly
function acceptItemChanges(mainTable, loopContextID)
{
    //#region
    var isEmpty = true;
    if (mainTable.length > 0)
    {
        var tableID = mainTable.attr("id");
        var viewInstanceInfo = new getMainTableViewInformation(tableID);
        var viewID = viewInstanceInfo.viewID;
        var instanceID = viewInstanceInfo.instanceID;
        var editable = mainTable[0].getAttribute("editable");
        var actionType = mainTable[0].getAttribute("actionType");

        if (editable === "true")
        {
            var selectedCounter = returnSelectedCounter(mainTable);

            switch (actionType)
            {
                case "add":
                case "update":
                    //populate the controls with the selected item's field values
                    isEmpty = copyHiddenListValuesBetweenCounters(viewID, instanceID, selectedCounter, null);
                    if (!isEmpty)
                    {
                        //repopulates the data display with the correct data
                        var clearThumbnailCache = viewInstanceInfo.clearThumbnailCache;
                        populateListRowWithData(mainTable, viewID, instanceID, clearThumbnailCache);
                    }
                    break;
                case "remove":
                    var selectedRow = returnSelectedRow(mainTable);
                    if (checkExists(selectedRow))
                    {
                        removeSelectedRow(mainTable);
                        //clear the fields for the current fields (at counter);
                        removeHiddenPropertyCollectionItem(viewID, false, selectedCounter, instanceID);
                    }
                    break;
            }
        }
        clearListItemRow(viewID, instanceID);
        setListAttributes(mainTable, "false", null);
        updateGridAfterChanges(tableID, loopContextID);
        setTimeout(function () { buildAggregations(mainTable, viewID, null, instanceID, loopContextID); }, 0);
    }
    //#endregion
}

//updates grid displays after changes occurred in editable section
function updateGridAfterChanges(tableID, loopContextID)
{
    //#region
    if (editableListCache.indexOf(tableID) > -1)
    {
        editableListCache = editableListCache.filter(function (item, index)
        {
            return editableListCache.indexOf(item) === index;
        });
        editableListCache.splice(editableListCache.indexOf(tableID), 1);
        updateListDisplay(tableID, true, loopContextID);
    }
    //#endregion
}

//tests the keyup of the capture list row edit template, to see if the "escape" key was pressed - this will cancel the item's changes
function testCancelList(event)
{
    //#region
    if (event.keyCode === 27)
    {
        var mainTable = jQuery("#" + event.data);
        $('div.tooltip.validation').hide();
        if (event.target.tagName.toLowerCase() === "input")
        {
            event.target.blur();
        }

        var actionType = mainTable[0].getAttribute("actionType");
        var actionRow = SFRGrid.execute({ element: mainTable, fn: "getActionRow" });

        cancelItemChanges(mainTable);

        if (actionType === "add" && checkExists(actionRow) && actionRow.length > 0)
        {
            actionRow.trigger("focus");
        }
        else
        {
            var contentTable = SFRGrid.execute({ element: mainTable, fn: "getContentTable" });
            if (checkExists(contentTable))
            {
                contentTable.trigger("focus");
            }
        }
    }
    //#endregion
}

//changes made in the capture section is rejected and no field changes will be comitted, the entry in the hidden fields will be removed
function cancelItemChanges(mainTable, refreshGrid, loopContextID)
{
    //#region
    if (mainTable.length > 0)
    {
        var tableID = mainTable.attr("id");
        var viewInstanceInfo = new getMainTableViewInformation(tableID);
        viewID = viewInstanceInfo.viewID;
        instanceID = viewInstanceInfo.instanceID;
        clearListItemRow(viewID, instanceID);
        setListAttributes(mainTable, "false", null);

        if (!checkExists(refreshGrid) || refreshGrid !== false)
        {
            updateGridAfterChanges(tableID, loopContextID);
        }
    }
    //#endregion
}

//removes a row from the list
function removeListItemRow(mainTable, loopContextID)
{
    //#region
    if (mainTable.length > 0)
    {
        var normalTable = mainTable[0];
        if (normalTable.getAttribute("editable") === "false")
        {
            setListAttributes(mainTable, "true", "remove", loopContextID);
            var viewInstanceInfo = new getMainTableViewInformation(normalTable.getAttribute("ID"));
            viewID = viewInstanceInfo.viewID;
            instanceID = viewInstanceInfo.instanceID;
            attemptItemChanges(mainTable, viewID, instanceID, loopContextID);
            normalTable.setAttribute("changingrow", "false");
        }
    }
    //#endregion
}

// transfers the data from the selected list item to the controls in the capture row
function transferListItemData(selectedCounter, viewID, instanceID, loopContextID)
{
    //#region
    //populate the controls with the selected item's field values
    copyHiddenListValuesBetweenCounters(viewID, instanceID, false, selectedCounter);
    var currentViewXML = returnCurrentViewXML(viewID, instanceID);
    var controlsXpath = "Controls/Control[Properties/Property/Name/text()='SetValue'][(@ControlTemplate='edit')]";
    //only to return input type controls (not the headers of the list)
    var controlCollection = $mn(currentViewXML, controlsXpath);
    var z = controlCollection.length;
    var controlAlreadySetHash = {};
    while (z--)
    {
        var currentControl = controlCollection[z];
        var controlID = currentControl.getAttribute("ID");
        if (!checkExists(controlAlreadySetHash[controlID]))
        {
            var sourceValue = returnListItemValue(currentControl, controlID, selectedCounter, currentViewXML, instanceID, loopContextID);
            if (checkExists(sourceValue))
            {
                //populate the information object
                var isAssociation = $sn(currentViewXML, "Associations/Association[@SourceControlID='" + controlID + "'][not (@IsComposite)]");
                var objInfo = new PopulateObject(null, sourceValue, controlID, null, true);
                if (checkExists(isAssociation))
                {
                    var executionStack = [];
                    executionStack.push({ objInfo: objInfo, currentControl: currentControl });
                    startLoadingListDependantValues(controlID, viewID, sourceValue, selectedCounter, instanceID, executionStack, loopContextID);
                    var l = executionStack.length;
                    while (l--)
                    {
                        execution = executionStack[l];
                        executeControlFunction(execution.currentControl, "SetValue", execution.objInfo);
                        controlAlreadySetHash[execution.objInfo.CurrentControlId] = true;
                    }
                }
                else
                {
                    executeControlFunction(currentControl, "SetValue", objInfo);
                    controlAlreadySetHash[controlID] = true;
                }
            }
        }
    }
    //#endregion
}

//removes the data from the list for the currently editable row
function clearListItemRow(viewID, instanceID)
{
    //#region
    var currentViewXML = returnCurrentViewXML(viewID, instanceID);
    clearViewControls(viewID, currentViewXML, false, instanceID, true, null, true, true);
    removeHiddenPropertyCollectionItem(viewID, false, false, instanceID);
    //#endregion
}

//intermediate function to attempt item changes - added eventing level between what was previously action & acceptance of changes
function attemptItemChanges(mainTable, viewID, instanceID, loopContextID, itemState)
{
    //#region
    if (mainTable[0].getAttribute("editable") === "true")
    {
        var actionType = mainTable[0].getAttribute("actionType");
        //TFS#729134 - when executing collective list method state other than the handled cases, it does not fire the continuation event and apply the changes        
        if (checkExists(itemState) && itemState !== "Added" && itemState !== "Removed" && itemState !== "Changed")
        {
            itemState = null;
        }
        switch (actionType)
        {
            case "add":
                if (!checkExists(itemState) || itemState === "Added")
                {
                    handleEvent(viewID, "View", "ListItemAdded", null, instanceID, null, null, null, null, null, null, loopContextID);
                }
                break;
            //TFS #836209 - If you are adding item on an ELV, and you back to update an item, the itemState is "Added" but the actionType is updated
            case "update":
                if (!checkExists(itemState) || (itemState === "Changed") || (itemState === "Added"))
                {
                    handleEvent(viewID, "View", "ListItemChanged", null, instanceID, null, null, null, null, null, null, loopContextID);
                }
                break;
            case "remove":
                if (!checkExists(itemState) || itemState === "Removed")
                {
                    handleEvent(viewID, "View", "ListItemRemoved", null, instanceID, null, null, null, null, null, null, loopContextID);
                }
                break;
        }
    }
    //#endregion
}

//get the max counter of items in the table - specifically used when adding new items to the fields + table
function returnNewMaxCounter(mainTable)
{
    //#region
    var maxCounter = 0;
    if (checkExists(mainTable.getAttribute("maxcounter")))
    {
        maxCounter = parseInt(mainTable.getAttribute("maxcounter"), 10) + 1;
    }
    mainTable.setAttribute("maxcounter", maxCounter);
    return maxCounter;
    //#endregion
}

//populate the selected/new row with data from the fields (typically when the row must be displayed)
function populateListRowWithData(mainTable, viewID, instanceID, clearThumbnailCache)
{
    //#region
    if (mainTable.length > 0)
    {
        var currentCounter = returnSelectedCounter(mainTable);

        var displayArray = viewTableDefinitions[mainTable[0].id];
        if (!checkExists(displayArray) || displayArray.length === 0)
        {
            var quickSearchProperty = null;
            var quickSearchValue = null;
            if (checkExists(mainTable[0].getAttribute("QFName")) && (mainTable[0].getAttribute("QFName").length > 0))
            {
                quickSearchProperty = mainTable[0].getAttribute("QFName");
                quickSearchValue = mainTable[0].getAttribute("QFValue");
            }

            displayArray = constructTableDefinition(viewID, mainTable, quickSearchValue, quickSearchProperty, instanceID);
            viewTableDefinitions[mainTable[0].id] = displayArray;
        }

        var rowIndex = returnSelectedIndex(mainTable);

        if (clearThumbnailCache)
        {
            for (var d = 0; d < displayArray.length; d++)
            {
                //if a column is unbound, the displayArray element will be null; added checkExists for this, to avoid js error; this is fine, since the original issue (494282) is for bound columns anyway
                if (checkExists(displayArray[d]) && (displayArray[d].fieldPropertyName === "Image"))
                {
                    displayArray[d].clearThumbnailCache = true;
                }
            }
        }
        var hiddenHash = getViewHiddenHash(viewID, instanceID);
        var comparisonObj = { controlid: false, contexttype: "Primary", ignoreState: true, counter: currentCounter };
        var rowItems = hiddenHash.filter(__runtimeJsonFilterMatchingItems, comparisonObj);
        var columns = populateTableRowFromDefinition(displayArray, currentCounter, instanceID, rowItems[0]);
        var actionType = mainTable[0].getAttribute("actionType");
        SFRGrid.execute({ element: mainTable, fn: actionType, params: ["row", columns, mainTable.is(":visible"), rowIndex] });
        var fileImage = mainTable.find("a.fileImage, img.fileImage");
        if (fileImage.length > 0)
        {
            fileImage.on("click", openFileImage);
            fileImage.on("focus", function ()
            {
                $(this).addClass("hide-browser-highlight active");
            });
            fileImage.on("blur", function ()
            {
                $(this).removeClass("hide-browser-highlight active");
            });
        }
    }
    //#endregion
}

//added to return the normal field value, expression value or associated dependency value of a control
function returnListItemValue(currentControl, controlID, selectedCounter, currentViewXML, instanceID, loopContextID)
{
    //#region
    var sourceValue = null;
    if (checkExists(currentControl.getAttribute("FieldID")))
    {
        sourceValue = getHiddenFieldValue(currentControl.getAttribute("FieldID"), selectedCounter, null, null, instanceID, loopContextID, null);
    }
    else if (checkExists(currentControl.getAttribute("ExpressionID")))
    {
        sourceValue = returnCalculationResultForControl(currentControl, selectedCounter, instanceID, loopContextID);
    }
    return sourceValue;
    //#endregion
}

function copyHiddenListValuesBetweenCounters(viewID, instanceID, newCounter, oldCounter)
{
    var isEmpty = true;
    var findCounter = false;
    if (oldCounter != null)
    {
        findCounter = oldCounter;
    }

    var comparisonObj =
    {
        counter: findCounter,
        controlid: false,
        contexttype: "Primary",
        ignoreFields: true,
        ignoreState: true
    };

    var hiddenHash = getViewHiddenHash(viewID, instanceID);
    if (hiddenHash.length > 0)
    {
        var existingItem = hiddenHash.filter(__runtimeJsonFilterMatchingItems, comparisonObj);
        if (existingItem.length > 0)
        {
            var currentObj = jsonCopyAndExtendObject(existingItem[0], newCounter);

            var objFields = currentObj.fields;
            if (checkExists(objFields))
            {
                for (var field in objFields)
                {
                    if (checkExistsNotEmpty(objFields[field].value))
                    {
                        if (isEmpty)
                        {
                            isEmpty = false;
                        }
                        objFields[field].cleared = false;
                    }
                }
            }
            if (findCounter === false && !isEmpty)
            {
                var ELJoins = determineJoinsForEditableList(viewID, instanceID, hiddenHash);
                currentObj.state = "Changed";

                var j = ELJoins.length;

                if (j > 0)
                {
                    currentObj.joins = [];

                    while (j--)
                    {
                        var joinInfo = ELJoins[j];
                        var linkedObjectField = objFields[joinInfo.fieldPropertyName];
                        var controlData = [];
                        if (checkExists(linkedObjectField) && !linkedObjectField.cleared)
                        {
                            controlData = joinInfo.controlData;//already pre-populated
                            var c = controlData.length;
                            var controlSelectedValue = null;
                            var controlIdentifier = null;

                            while (c--)
                            {
                                var controlSelection = controlData[c];
                                if (checkExists(controlSelection.controlid))
                                {
                                    if (controlSelection.controlid !== controlIdentifier)
                                    {
                                        //this is a performance adaption to ensure that a control is only requested once during this loop
                                        controlSelectedValue = getControlValue({ controlID: controlSelection.controlid });
                                        controlIdentifier = controlSelection.controlid;
                                    }
                                    var controlValue = controlSelectedValue;
                                    var valuePropertyField = controlSelection.fields[joinInfo.valueProperty];
                                    if (checkExists(valuePropertyField) && valuePropertyField.value === controlValue)
                                    {
                                        var controlSelectionValues = jsonCopyAndExtendObject(controlSelection);
                                        delete controlSelectionValues.state;
                                        delete controlSelectionValues.controlid;
                                        delete controlSelectionValues.counter;
                                        controlSelectionValues.contextid = joinInfo.contextID;//contextid match display row control
                                        currentObj.joins.push(controlSelectionValues);
                                        break;
                                    }
                                }
                            }
                        }
                        else if (checkExists(linkedObjectField) && linkedObjectField.cleared)
                        {
                            var clearedJoin =
                                {
                                    parentid: joinInfo.parentID,
                                    contextid: joinInfo.contextID,
                                    contexttype: joinInfo.contextType,
                                    fields: {}//this ensures that merging can take place to clear displayed data                                
                                };
                            currentObj.joins.push(clearedJoin);
                        }
                    }
                }
            }

            if ((findCounter === false && !isEmpty) || (findCounter !== false)) 
            {
                pushHiddenValue(viewID, instanceID, currentObj);
            }
        }
    }
    return isEmpty;
}

//helper logic to determine lookup info for associated columns on the view
function determineJoinsForEditableList(viewID, instanceID, hiddenHash)
{
    var keys = returnHashName(viewID, instanceID);
    var joins = _runtimeELJoinHash[keys];
    if (!joins)
    {
        joins = [];
        var currentViewXml = returnCurrentViewXML(viewID, instanceID);
        //get all the current view associations for the display template
        var associatedControls = [];
        var associations = new dataSourceLookup({ xmlDoc: currentViewXml, includeControllers: false, includeController: false, selectMultiple: true, controlDisplayTemplate: false }).getDataSource();

        var a = associations.length;
        if (a > 0)
        {
            while (a--)
            {
                var controlInfo = controlInformationObject(associations[a].getAttribute("SourceControlID"));
                associatedControls.push(controlInfo);
            }

            var table = getViewMainTable(viewID, instanceID)
            if (checkExists(table))
            {
                var Arr = viewTableDefinitions[table];
                if (!checkExists(Arr) || Arr.length === 0)
                {
                    var jQTable = jQuery("#" + table);
                    var quickSearchProperty;
                    var quickSearchValue;
                    if (checkExists(jQTable[0].getAttribute("QFName")) && (jQTable[0].getAttribute("QFName").length > 0))
                    {
                        quickSearchProperty = jQTable[0].getAttribute("QFName");
                        quickSearchValue = jQTable[0].getAttribute("QFValue");
                    }

                    Arr = constructTableDefinition(viewID, jQTable, quickSearchValue, quickSearchProperty, instanceID);
                    viewTableDefinitions[table] = Arr;
                }
                var ic = Arr.length;

                while (ic--)
                {
                    var fieldProperties = Arr[ic];
                    if (checkExists(fieldProperties) && fieldProperties.isAssociation === true)
                    {
                        var usePropertyName = fieldProperties.fieldPropertyName;
                        var useParentID = fieldProperties.originalSOID;

                        if (fieldProperties.displaySOID)
                        {
                            useParentID = fieldProperties.displaySOID;
                        }
                        var useControlID = true;

                        if (fieldProperties.fieldID)
                        {
                            //match with controlInfo for multiple associations to the same datasource (775778)
                            for (var ass = 0; ass < associatedControls.length; ass++)
                            {
                                if ((associatedControls[ass].fieldID == fieldProperties.fieldID)
                                    //below: dependent dropdowns in editable lists (unbound field for parent control scenario - 776279)
                                    || (fieldProperties.originalSOID != fieldProperties.displaySOID && associatedControls[ass].ParentUsingField == fieldProperties.fieldID))
                                {
                                    useControlID = associatedControls[ass].ID;
                                    associatedControls.splice(ass, 1);
                                    break;
                                }
                            }
                        }

                        var controlComparisonObj = {
                            counter: true,
                            contexttype: fieldProperties.contextType,
                            parentid: useParentID,
                            controlid: useControlID
                        };
                        var controlData = hiddenHash.filter(__runtimeJsonFilterMatchingItems, controlComparisonObj);
                        if (controlData.length === 0)
                        {
                            //backup logic for picker usage in Editable lists (757513)
                            controlComparisonObj.counter = false;
                            controlData = hiddenHash.filter(__runtimeJsonFilterMatchingItems, controlComparisonObj);
                        }
                        var join =
                            {
                                fieldPropertyName: fieldProperties.fieldPropertyName,
                                valueProperty: fieldProperties.valueProperty,
                                contextID: fieldProperties.contextID,
                                contextType: fieldProperties.contextType,
                                parentID: useParentID,
                                controlData: controlData 
                            };

                        joins.push(join);
                    }
                }
            }
        }
        _runtimeELJoinHash[keys] = joins;
    }

    if (joins)
    {
        return joins;
    }
}

//capture list specific checks for dependent dropdowns - a duplication and adaption of the startLoadingDependantValues function
function startLoadingListDependantValues(controlID, viewID, actualValue, counter, instanceID, executionStack, loopContextID)
{
    //#region
    var control = new dataSourceLookup({ xmlDoc: viewControllerDefinition, sourceControlID: controlID, parentControlExists: true }).getDataSource();
    if (checkExists(control))
    {
        var parentPropertyName = control.getAttribute("ParentJoinProperty");
        var ParentControlID = control.getAttribute("ParentControlID");

        var childPropertyValue = actualValue;
        var childPropertyName = control.getAttribute("ChildJoinProperty");

        //var currentControl = _runtimeControllerFindObject({ controlID: ParentControlID });
        var childSOID = control.getAttribute("AssociationSO");
        var valuePropertyName = control.getAttribute("ValueProperty");

        if (checkExists(actualValue))
        {
            var comparisonObj = { counter: counter, controlid: false };
            var possibleValues = getHiddenPropertyCollection(viewID, instanceID, comparisonObj)
            if (possibleValues.length > 0)
            {
                var parentPropertyValue;
                var joinsFiltered = possibleValues[0].joins;
                if (joinsFiltered == null)
                {
                    parentPropertyValue = getListParentControlValue(ParentControlID, viewID, instanceID, counter, executionStack, loopContextID);
                }
                else
                {
                    for (var j = 0; j < joinsFiltered.length; j++)
                    {
                        if (joinsFiltered[j].parentid !== childSOID)
                        {
                            if (joinsFiltered[j].fields[parentPropertyName])
                            {
                                parentPropertyValue = joinsFiltered[j].fields[parentPropertyName].value;
                                break;
                            }
                        }
                    }
                }
                if (parentPropertyValue)
                {
                    getActionsWithControlAsResult(controlID, parentPropertyName, parentPropertyValue, childPropertyValue, childPropertyName, instanceID);
                    setParentControlValue(ParentControlID, parentPropertyValue, instanceID, counter, executionStack, loopContextID);
                }
            }
        }
    }
    //#endregion
}


//retrieves the value of the parent control with its field list value (no proper associations)
function getListParentControlValue(ParentControlID, viewID, instanceID, counter, executionStack, loopContextID)
{
    //#region
    var parentValue = null;
    var currentViewXML = returnCurrentViewXML(viewID, instanceID);
    if (currentViewXML != null)
    {
        var parentControl = $sn(currentViewXML, "Controls/Control[Properties/Property/Name/text()='SetValue'][(@ControlTemplate='edit')][(@FieldID)][@ID='" + ParentControlID + "']");
        if (parentControl != null)
        {
            parentValue = returnListItemValue(parentControl, ParentControlID, counter, currentViewXML, instanceID, loopContextID)
        }
    }
    return parentValue;
    //#endregion
}

//this removes the unnecessary field linked to the parent dependent dropdown
function adaptDependencyFields(viewID, instanceID)
{
    var xp = "Controllers/Controller[@ID='" + viewID + "']";
    var key = viewID + "_";
    var hasInstanceID = (checkExistsNotEmpty(instanceID) && (instanceID !== _runtimeEmptyGuid));

    if (hasInstanceID)
    {
        key += instanceID;
        xp += "[@InstanceID='" + instanceID + "']";
    }
    viewXmlCache[key] = null;
    if (checkExists(viewControllerDefinition))
    {
        //get all controls with parentcontrols - then compare their fields - they shouldn't be the same - remove the FieldID
        var childAssocs = $mn(viewControllerDefinition, xp + "/Associations/Association[(@ParentControlID and @SourceControlID)][not (@IsComposite)]");
        for (var c = 0; c < childAssocs.length; c++)
        {
            var parentControl = childAssocs[c].getAttribute("ParentControlID");
            var childControl = childAssocs[c].getAttribute("SourceControlID");

            var parentControlNode = $sn(viewControllerDefinition, xp + "/Controls/Control[@ID='" + parentControl + "'][@FieldID]");
            var childControlNode = $sn(viewControllerDefinition, xp + "/Controls/Control[@ID='" + childControl + "'][@FieldID]");
            
            if (checkExists(parentControlNode) && checkExists(childControlNode)
                && (parentControlNode.getAttribute("FieldID") === childControlNode.getAttribute("FieldID")))
            {
                var options = {};
                options.viewId = viewID;
                options.instanceId = instanceID;
                options.controlId = parentControl;
                var parentFieldId = parentControlNode.getAttribute("FieldID");

                parentControlNode.setAttribute("ParentUsingField", parentFieldId);
                options.propertyName = "parentusingfield";
                options.value = parentFieldId;
                SourceCode.Forms.Runtime.Information.setControlPropertyHistory(options);

                parentControlNode.removeAttribute("FieldID");
                options.propertyName = "field";
                options.value = "";
                SourceCode.Forms.Runtime.Information.setControlPropertyHistory(options);
            }
        }
    }
}
