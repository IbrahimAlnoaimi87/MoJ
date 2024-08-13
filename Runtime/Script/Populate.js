var newLineRegEx = /(\r\n|\r|\n)/g;

//handles the response from the AJAX call to manipulate the view according to the data received
function PopulateView(jsonObj, viewID, instanceID, loopContextID, brokerPackage, brokerPackageJson)
{
    //#region
    //metadata inspection
    var metadata = jsonObj.metadata;
    var rowCounter = metadata.rowcounter;
    var MethodExecute = metadata.methodexecuted;
    var resultControl = metadata.idofcontrol;
    var pageSize = metadata.pagesize;
    var pageNumber = metadata.pagenumber;
    var compositeResult = metadata.compositeresult;
    var fieldBehaviorIgnoreResults = metadata.fieldbehaviorignoreresults;

    var pageNumberExists = checkExistsNotEmpty(pageNumber);

    if (!checkExists(viewID))
    {
        viewID = metadata.id;
    }
    if (!checkExists(instanceID))
    {
        instanceID = metadata.instanceid;
        if (instanceID === "")
        {
            instanceID = null;
        }
    }

    var table = null;
    var ViewType = null;
    if (checkExists(viewID) && viewID.length > 0)
    {
        var viewDef = getViewDefinition(viewID, instanceID);
        if (checkExists(viewDef))
        {
            instanceID = viewDef.getAttribute("InstanceID"); //verify instanceID from table definition

            table = viewDef.getAttribute("MainTable");

            var tableElem = document.getElementById(table);
            var jqTableElem = jQuery(tableElem);

            var exportToExcelData = getExportToExcelData({ viewId: viewID, instanceId: instanceID });

            if (exportToExcelData.busyExporting === true)
            {
                var getTableRowsForExportToExcelOptions = {
                    jsonObj: jsonObj,
                    viewId: viewID,
                    instanceId: instanceID,
                    viewDef: viewDef,
                    tableElem: tableElem,
                    pageNumber: metadata.pagenumber
                };

                var rowsGridObjs = getTableRowsForExportToExcel(getTableRowsForExportToExcelOptions);

                var exportListToExcelOptions = {
                    viewHtml: jqTableElem,
                    viewXml: viewDef,
                    rowsGridObjs: rowsGridObjs,
                    viewId: viewID,
                    instanceId: instanceID,
                    loopContextId: loopContextID
                };

                exportListToExcel(exportListToExcelOptions);
            }
            else
            {
                ViewType = viewDef.getAttribute("TypeView");
                var viewSOID = viewDef.getAttribute("ContextID");
                var selectedCounter = null;

                var IsListingView = false;
                if (ViewType === "List" && !checkExists(resultControl))
                {
                    selectedCounter = getLoopContextData({ loopContextID: loopContextID, viewID: viewID, instanceID: instanceID }).counter;

                    if (!checkExists(selectedCounter))
                    {
                        selectedCounter = getViewSelectedCounter(table);
                    }

                    if (checkExists(rowCounter))
                    {
                        selectedCounter = rowCounter;
                    }
                    IsListingView = true;
                    if (tableElem.getAttribute("editable") === "true")
                    {
                        cancelItemChanges(jqTableElem, null, loopContextID);
                    }
                }

                var parentID = null;
                var parentType = null;
                var contextID = null;
                var contextType = null;
                var results = jsonObj.collection.slice(0);

                if (checkExists(results) && results.length > 0)
                {
                    var currentObject = results[0];
                    if (checkExists(currentObject))
                    {
                        parentID = currentObject.parentid;
                        parentType = currentObject.parenttype;
                        contextID = currentObject.contextid;
                        contextType = currentObject.contexttype;
                    }
                }

                var methodTypeExecution = jsonObj.MethodTypeExecuted;
                var clearSelection = true;

                //clear the hiddens for this view + reset the values according to the package received from the broker
                if (checkExists(methodTypeExecution))
                {
                    switch (methodTypeExecution)
                    {
                        case "ToXmlList()":
                            if (IsListingView && !checkExists(resultControl))
                            {
                                var previousActionXml = tableElem.getAttribute("previousactionxml");
                                if (jsonObj.PreviousActionID != null && !checkExistsNotEmpty(previousActionXml))
                                {
                                    previousActionXml = GetPreviousActionXml(jsonObj);
                                }
                                if (checkExistsNotEmpty(previousActionXml))
                                {
                                    tableElem.setAttribute("actionxml", previousActionXml);
                                }
                                var recordsAffected = jsonObj.RecordsAffected;
                                var hasMorePages = jsonObj.HasMorePages;
                                var hasRowCount = jsonObj.HasRowCount;
                                var usePageNumberToRemove = pageNumberExists ? true : null;
                                removeHiddenPropertyCollection(viewID, parentID, parentType, usePageNumberToRemove, false, null, null, instanceID);
                                if (checkExists(recordsAffected))
                                {
                                    recordsAffected = parseInt(recordsAffected, 10);
                                    //populate Paging controls
                                    if (recordsAffected === 0)
                                    {
                                        //#region
                                        var aggrRow = document.getElementById(table + "_footer_aggrRow");
                                        if (aggrRow)
                                        {
                                            aggrRow.style.display = "none";
                                        }
                                        //#endregion
                                        runtimeBusyView(viewID, false, false, instanceID);

                                        if (checkExists(pageSize) && pageNumberExists && parseInt(pageNumber, 10) > 1)
                                        {
                                            doPaging("previous", pageNumber, jqTableElem, false, loopContextID); //revert to previous page and set hasMorePages to false, disabling the next button (TFS417397)
                                        }
                                        else
                                        {
                                            clearTable(table, viewID, instanceID, true, null, null, loopContextID);
                                            if (checkExists(pageSize))
                                            {
                                                populatePagingControls(tableElem, pageSize, 1, 1, false, hasRowCount);
                                            }
                                        }

                                        handleEvent(viewID, "View", MethodExecute, null, instanceID, null, null, null, null, null, null, loopContextID);

                                        if (tableElem.getAttribute("listrefreshed"))
                                        {
                                            tableElem.removeAttribute("listrefreshed");
                                            handleEvent(viewID, "View", "ListRefresh", null, instanceID, null, null, null, null, null, null, loopContextID);
                                        }
                                        return;
                                    }
                                    else if (checkExists(pageSize) && pageNumberExists)
                                    {
                                        var numberOfPages = jsonObj.NumberOfPages;
                                        if (checkExists(numberOfPages))
                                        {
                                            numberOfPages = parseInt(numberOfPages, 10);
                                        }
                                        else if (hasMorePages === "false")
                                        {
                                            numberOfPages = pageNumber;
                                        }
                                        var resetPageNumber = jsonObj.ResetPageNumber;
                                        populatePagingControls(tableElem, pageSize, pageNumber, numberOfPages, hasMorePages, hasRowCount, resetPageNumber);
                                    }
                                }
                            }
                            break;
                        case "read":
                            removeHiddenPropertyCollection(viewID, parentID, parentType, null, false, false, contextType, instanceID);
                            break;
                        case "create":
                        case "update":
                            if (ViewType === "Capture" && checkExists(rowCounter) && checkExists(compositeResult) && compositeResult.length > 0)
                            {
                                removeHiddenPropertyCollection(viewID, parentID, parentType, null, compositeResult, true, null, instanceID);
                            }
                            else if (ViewType === "List")
                            {
                                if (checkExists(parentID) && checkExists(viewSOID) && parentID.toLowerCase() !== viewSOID.toLowerCase())
                                {
                                    //execution SO does not match based SO - execute on another smartobject, list should not be refreshed
                                    //just hide spinner if applicable, only other fallback behaviour required
                                    if (checkExists(viewID) && viewID.length > 0)
                                    {
                                        runtimeBusyView(viewID, false, false, instanceID);
                                    }
                                    return;
                                }
                            }
                            break;
                        case "delete":
                            clearSelection = false;
                            if (ViewType === "List")
                            {
                                if (checkExists(parentID) && checkExists(viewSOID) && parentID.toLowerCase() !== viewSOID.toLowerCase())
                                {
                                    //execution SO does not match based SO - execute on another smartobject, list should not be refreshed
                                    //just hide spinner if applicable, only other fallback behaviour required
                                    if (checkExists(viewID) && viewID.length > 0)
                                    {
                                        runtimeBusyView(viewID, false, false, instanceID);
                                    }
                                    return;
                                }
                                if (checkExists(pageSize) && pageNumberExists)
                                {
                                    removeHiddenPropertyCollection(viewID, null, null, null, false, null, null, instanceID);
                                    doPaging(pageNumber, pageNumber, jqTableElem, null, loopContextID);
                                }
                                else
                                {
                                    removeHiddenPropertyCollection(viewID, parentID, parentType, null, false, selectedCounter, null, instanceID);
                                    jsonObj = null;
                                    //the following call was commented out in Changeset 236833 for Bug 454349 (related comments on line 266)
                                    //was necessary to re-include to allow list data not to go missing when Delete method is called on uneditable list
                                    //re-including only for non-editable list, ensure that data does not get removed from the display of a List View 
                                    //after executing a SmartObject method on items that have been changed
                                    if (!checkExists(rowCounter))
                                    {
                                        jsonObj = getCombinedHiddenPropertyCollection(viewID, null, null, null, null, null, null, null, null, instanceID);
                                    }

                                }
                            }
                            else if (ViewType === "Capture")
                            {
                                if (!checkExists(rowCounter)) //fix for many to many
                                {
                                    removeHiddenPropertyCollection(viewID, parentID, parentType, null, false, rowCounter, null, instanceID);
                                    clearViewControls(viewID, viewDef, false, instanceID, null, null, true); //fix for default values after delete & clear

                                    jsonObj = getCombinedHiddenPropertyCollection(viewID, null, null, null, null, null, null, null, null, instanceID);
                                }
                                else if (checkExists(compositeResult) && compositeResult.length > 0)
                                {
                                    removeHiddenPropertyCollection(viewID, parentID, parentType, null, compositeResult, true, null, instanceID);
                                }
                            }
                            break;
                    }

                    if (checkExists(resultControl))
                    {
                        if (!checkExists(fieldBehaviorIgnoreResults) || fieldBehaviorIgnoreResults !== "true")
                        {
                            removeHiddenPropertyCollection(viewID, parentID, parentType, null, resultControl, null, contextType, instanceID, contextID);
                            setHiddenPropertyCollection(viewID, results, resultControl, null, null, instanceID);
                        }
                    }
                    else if (IsListingView && (methodTypeExecution === "ToXmlList()"))
                    {
                        setHiddenPropertyCollection(viewID, results, null, null, null, instanceID);
                    }
                    // added the check for the delete method. In the delete method it will get the current hiddenViewXml, just to add it again here, effectively duplicating it.
                    // This broke client side filtering by duplicating entries.
                    // Either the check for delete needs to be done, or incomingXML = getCombinedHiddenPropertyCollection(viewID, null, null, null, null, null, null, null, null, instanceID); 
                    // on line 224 (at time of writing this code) needs to be removed. 
                    else if (!IsListingView && methodTypeExecution !== "ToXmlList()" && (methodTypeExecution !== "delete" || checkExists(rowCounter)))
                    {
                        setHiddenPropertyCollection(viewID, results, null, null, null, instanceID);
                    }
                }
                if (checkExists(jsonObj) && checkExists(jsonObj.collection))
                {
                    results = jsonObj.collection.slice(0);

                    if (IsListingView && !checkExists(resultControl))
                    {
                        if (checkExists(rowCounter))
                        {
                            if (checkExists(jsonObj))
                            {
                                setHiddenPropertyCollection(viewID, results, null, null, null, instanceID);
                            }
                            collectionTables.push(table);
                        }
                        else
                        {
                            rebuildTable(table, viewID, instanceID, false, false, null, results, true, pageNumber, loopContextID, clearSelection);
                        }
                    }
                    // If there isn't a brokerPackage, it is old unknown behaviour and we just continue with how the code was before Clientside filtering.
                    // Controls should not be populated if they don't have result mappings. (That is why we check for brokerpackage.resultMappings.)
                    // This doesn't apply when working with views (which is why we check for controlID)
                    // There is also a problem with populating the ID field when working with composite smartOjbects. 
                    // Look at this KB article: http://help.k2.com/KB001304 and bug 503673. That is why we check for ToXmlList().
                    else if (!checkExists(brokerPackage) || checkExists(brokerPackage.resultMappings) || methodTypeExecution !== "ToXmlList()" || !checkExists(brokerPackage.controlID))
                    {
                        if ((checkExists(results) && results.length > 0) || checkExists(resultControl))
                        {
                        PopulateBoundControls(jsonObj, jsonObj, instanceID, viewID, loopContextID, brokerPackageJson);
                        }

                        var controlIsBeingPopulated = checkExists(brokerPackage) && checkExistsNotEmpty(brokerPackage.controlID);

                        if (!controlIsBeingPopulated)
                        {
                            updateCalculatedControlsForSource(instanceID, false, loopContextID);
                        }
                    }
                }

                if (checkExists(viewID) && viewID.length > 0)
                {
                    runtimeBusyView(viewID, false, false, instanceID);
                }

                //repopulates the view parameters, since it was deleted with the removeHiddenPropertyCollection
                loadPersistedViewParametersForUser();

                handleEvent(viewID, "View", MethodExecute, null, instanceID, null, null, null, null, null, null, loopContextID);

                if (tableElem.getAttribute("listrefreshed"))
                {
                    tableElem.removeAttribute("listrefreshed");
                    handleEvent(viewID, "View", "ListRefresh", null, instanceID, null, null, null, null, null, null, loopContextID);
                }
            }
        }
    }
    else
    {
        mapExecutionResultsToControls(jsonObj, loopContextID);
    }
    //#endregion
}

function getTableRowsForExportToExcel(options)
{
    var returnArray = [];

    options = checkExists(options) ? options : {};

    if (checkExistsNotEmpty(options.viewId) && checkExists(options.viewDef))
    {        
        var results = options.jsonObj.collection.slice(0);

        if (checkExistsNotEmpty(options.jsonObj.MethodTypeExecuted))
        {
            options.tableElem.setAttribute("actionxml", options.tableElem.getAttribute("previousactionxml"));

            removeHiddenPropertyCollection(options.viewId, null, null, null, null, null, null, options.instanceID);

            setHiddenPropertyCollection(options.viewId, results, null, null, null, options.instanceId);
        }

        if (checkExists(options.jsonObj) && checkExists(options.jsonObj.collection))
        {
            results = options.jsonObj.collection.slice(0);

            var mainTableName = options.viewDef.getAttribute("MainTable");

            clearDisplayValueCache(mainTableName);

            var jqTableElem = jQuery("#" + mainTableName);
            if (checkExists(jqTableElem) && jqTableElem.length > 0)
            {
                var comparisonObj = { controlid: false, method: false, contexttype: "Primary", pagenumber: options.pageNumber, ignoreState: true };
                var rowItems = results.filter(__runtimeJsonFilterMatchingItems, comparisonObj);

                if (rowItems.length > 0)
                {
                    var viewTableDef = viewTableDefinitions[jqTableElem[0].id];

                    for (var i = 0; i < rowItems.length; i++)
                    {
                        var rowItem = rowItems[i];
                        var count = rowItem.counter;

                        var state = rowItem.state;
                        if (!checkExistsNotEmpty(state) || state.toLowerCase() !== "removed")
                        {
                            var columns = populateTableRowFromDefinition(viewTableDef, count, options.instanceId, rowItem);
                            returnArray.push(columns);
                        }
                    }
                }
            }
        }

        removeHiddenPropertyCollection(options.viewId, null, null, null, null, null, null, options.instanceID);

        removeExportToExcelData({ viewId: options.viewId, instanceId: options.instanceId });
        
        if (checkExistsNotEmpty(options.viewId))
        {
            runtimeBusyView(options.viewId, false, false, options.instanceId);
        }
    }

    return returnArray;
}

//do the buildTable functionality on views only once per view - after collections were set etc. 
//(single execution with single resultset but different counters were set individually - clearing & rebuilding table unnecessarily)
function buildCollectionTables(loopContextID)
{
    //#region
    collectionTables = collectionTables.filter(function (item, index)
    {
        return collectionTables.indexOf(item) === index;
    });
    while (collectionTables.length > 0)
    {
        var table = collectionTables.pop();
        var ViewInstance = new getMainTableViewInformation(table);
        var viewID = ViewInstance.viewID;
        var instanceID = ViewInstance.instanceID;
        var JustProperties = getCombinedHiddenPropertyCollection(viewID, null, null, null, false, true, null, null, null, instanceID); //return the correct value from the package after a single execution on a capture list
        removeSortingIndicators(table);
        rebuildTable(table, viewID, instanceID, false, false, null, JustProperties, true, null, loopContextID, false);

        //this is typically the logic that will fire for editable list saves, so to ensure that everything only happens here instead of in rebuildTable
        var mainTable = $("#" + table);
        var singleEditAttribute = mainTable[0].getAttribute("singleEdit");
        if (checkExists(singleEditAttribute))
        {
            switch (singleEditAttribute)
            {
                case "add":
                    //single edit set, add new row was fired but grid is not editable, refire add logic
                    addListItemRow(mainTable, "override", loopContextID);
                    break;
                case "edit":
                    //single edit set, edit was fired but grid is not editable, refire edit logic
                    editListItemRow(mainTable, loopContextID, "override");
                    break;
            }
            mainTable[0].removeAttribute("singleEdit");
        }
    }
    //#endregion
}

//populate bound controls (capture view)
function PopulateBoundControls(jsonData, jsonObj, instanceID, viewID, loopContextID, brokerPackageJson)
{
    //#region
    if (checkExists(jsonData))
    {
        var metadata = jsonObj.metadata;
        var resultControl = metadata.idofcontrol;
        var actualValue = metadata.actualvalue;

        if (checkExists(resultControl))
        {
            jsonData = jsonObj;
            var currentControl = _runtimeControllerFindObject({ controlID: resultControl });
            if (currentControl)
            {
                var executeResult = false;
                var objInfo = new PopulateObject(null, null, resultControl, null, null, jsonData);
                executeResult = executeControlFunction(currentControl, "SetItems", objInfo);

                // evaluateSSREResults will send through null here and since the control will already be populated as part of initial state drafts need not record this
                if (checkExists(brokerPackageJson)) 
                {
                    var options =
                    {
                        viewId: viewID,
                        instanceId: instanceID,
                        controlId: resultControl,
                        value: brokerPackageJson
                    };

                    SourceCode.Forms.Runtime.Information.setControlBrokerHistory(options);
                }

                if (checkExists(executeResult) && (executeResult === false))
                {
                    startClearingDependantValues(resultControl, jsonData);
                }

                if (checkExists(actualValue))
                {
                    //if the actual value was sent with the call (dependencies) select the relevant value in the dropdown
                    objInfo = new PopulateObject(null, actualValue, resultControl, null, true, jsonData);
                    executeResult = executeControlFunction(currentControl, "SetValue", objInfo);
                }
            }
        }
        else
        {
            //try mapping results first before trying old way of setting properties - this will be removed once all is functional(if fields will be set this way too)
            var resultsMapped = mapExecutionResultsToControls(jsonObj, loopContextID);
            if (checkExists(viewID) && viewID.length > 0)
            {
                var XmlControllerDoc = returnCurrentViewXML(viewID, instanceID);
                if (!resultsMapped)
                {
                    //only loop through actual controls on the view (hiddens are already set)
                    var viewControls = $mn(XmlControllerDoc, "Controls/Control[(@FieldID)][not(Properties/Property[Name/text()='IsComposite'])]");
                    var vc = viewControls.length;
                    while (vc--)
                    {
                        var ControlName = viewControls[vc].getAttribute("ID");
                        populateControl(ControlName, viewID, XmlControllerDoc, null, jsonData, null, instanceID, false, loopContextID);
                    }
                }

                //get composite controls
                var compositeControls = new dataSourceLookup({ xmlDoc: XmlControllerDoc, includeControllers: false, includeController: false, selectMultiple: true, sourceControlID: true, isComposite: "True" }).getDataSource();
                var cc = compositeControls.length;
                while (cc--)
                {
                    var ccControlName = compositeControls[cc].getAttribute("SourceControlID");
                    populateControl(ccControlName, viewID, XmlControllerDoc, null, jsonData, null, instanceID, true, loopContextID);
                }
            }

        }
    }
    //#endregion
}

//map execution results
function mapExecutionResultsToControls(jsonObj, loopContextID)
{
    //#region
    var results = jsonObj.results;
    if (!checkExists(results))
    {
        return false;
    }
    var resultCounter = results.length;

    if (resultCounter > 0)
    {
        for (var r = 0; r < resultCounter; r++)
        {
            var currentResultNode = results[r];
            var targetType = currentResultNode.TargetType;
            var target = currentResultNode.TargetID;
            var targetInstanceID = currentResultNode.TargetInstanceID;
            var sourceType = currentResultNode.SourceType;
            var currentValue = checkExistsNotEmpty(currentResultNode.Value) ? currentResultNode.Value : "";

            //combined result mappings that can be resolved client-side after method execution (not single save)
            if (sourceType === "Value" && checkExistsNotEmpty(currentValue) && currentValue.startsWith("<SourceValue"))
            {
                //translate to xml for this instance (typed values in output mappings)
                var xmlDoc = $xml("<Item>" + currentValue + "</Item>");
                var xmlNode = xmlDoc.documentElement;
                for (var att in currentResultNode)
                {
                    if (att !== "Value")
                    {
                        xmlNode.setAttribute(att, currentResultNode[att]);
                    }
                }
                currentValue = returnSourceValue({ item: xmlNode, loopContextID: loopContextID });
            }

            switch (targetType)
            {
                case "Control":
                    populateControl(target, null, null, currentValue, jsonObj, null, null, loopContextID);
                    break;
                case "ViewField":
                    setHiddenFieldValue(target, currentValue, null, targetInstanceID, null, null, null, loopContextID);
                    break;
                case "FormParameter":
                    //#region
                    setFormParameterValue(target, currentValue, loopContextID);
                    break;
                //#endregion 
                case "ViewParameter":
                    //#region
                    setViewParameterValue(target, currentValue, targetInstanceID, loopContextID);
                    break;
                //#endregion 
            }
        }
        return true;
    }
    else
    {
        return false;
    }
    //#endregion
}

//shared function to populate the control from the value that was set from output mappings (new) as well as from fields (old)
function populateControl(ControlName, viewID, XmlControllerDoc, currentValue, jsonData, controlXMLDoc, instanceID, checkIsComposite, loopContextID)
{
    //#region
    var currentControl = _runtimeControllerFindObject({ controlID: ControlName, xmlDoc: XmlControllerDoc, includeControllers: false });
    if (checkExists(currentControl) && (!checkExistsNotEmpty(XmlControllerDoc)))
    {
        var currentControlView = currentControl.parentNode.parentNode;
        if (currentControlView)
        {
            viewID = currentControlView.getAttribute("ID");
            instanceID = currentControlView.getAttribute("InstanceID");
            XmlControllerDoc = currentControlView;
        }
    }
    if (!checkExists(currentValue) && checkExists(currentControl))
    {
        var field = currentControl.getAttribute("FieldID");
        if (!checkExists(checkIsComposite))
        {
            checkIsComposite = $sn(currentControl, "Properties/Property[Name/text()='IsComposite']/Value");
            checkIsComposite = (checkIsComposite) ? checkIsComposite.text.toLowerCase() === "true" : false;
        }
        if (checkIsComposite && checkExistsNotEmpty(field))
        {
            var fieldInfo = returnFieldAttributeObject(field, instanceID);
            if (fieldInfo.propertyType.toUpperCase() === "MULTIVALUE")
            {
                checkIsComposite = false;
            }
        }
        if (!checkIsComposite)
        {
            currentValue = getHiddenFieldValue(field, null, null, null, instanceID, loopContextID, null);
        }
    }

    var objInfo;
    if (checkExists(currentValue))
    {
        var isAssociation = new dataSourceLookup({ xmlDoc: XmlControllerDoc, sourceControlID: ControlName, isComposite: false, includeControllers: false, includeController: false }).getDataSource();
        objInfo = new PopulateObject(null, currentValue, ControlName, null, true, jsonData);
        if (isAssociation)
        {
            var executionStack = [];
            executionStack.push({ objInfo: objInfo, currentControl: currentControl });
            startLoadingDependantValues(ControlName, currentValue, null, instanceID, executionStack, loopContextID);
            var l = executionStack.length;
            while (l--)
            {
                execution = executionStack.pop();
                executeControlFunction(execution.currentControl, "SetValue", execution.objInfo);
            }
        }
        else
        {
            executeControlFunction(currentControl, "SetValue", objInfo);
        }
    }
    else if (checkIsComposite === true)
    {
        var jsonJoins = jsonData.collection[0].joins;
        if (!checkExists(jsonJoins))
        {
            currentValue = "";
        }
        objInfo = new PopulateObject(null, currentValue, ControlName, null, true, jsonJoins);
        executeControlFunction(currentControl, "SetValue", objInfo);
    }
    //#endregion
}

//removes all row from the list view's table
//clearTable enhanced to ensure grid values/attributes and aggregations are reset - this requires the viewID and instanceID
function clearTable(tableName, viewID, instanceID, doAggregations, syncColumns, retainSort, loopContextID)
{
    //#region
    if (!checkExists(syncColumns))
    {
        syncColumns = true;
    }
    if (checkExists(tableName.id))
    {
        tableName = tableName.id;
    }

    var table = jQuery("#" + tableName);
    SFRGrid.execute({ element: table, fn: "clear", params: [retainSort] });
    SFRGrid.execute({ element: table, fn: "option", params: ['canexpand', false] });
    SFRGrid.execute({ element: table, fn: "option", params: ["customsort", null] });
    table[0].setAttribute("maxcounter", 0);
    if (doAggregations)
    {
        setTimeout(function () { buildAggregations(table, viewID, null, instanceID, loopContextID); }, 0);
    }

    if (syncColumns === true)
    {
        SFRGrid.execute({ element: table, fn: "runtimeSyncColumns" });
    }

    //#endregion
}

//constructs the list view's table
function BuildTable(tableName, executionResults, stopBusyDiv, retainSort, loopContextID, clearSelection)
{
    if (!checkExists(executionResults))
    {
        return;
    }
    if (!checkExists(tableName))
    {
        return;
    }
    //#region
    if (checkExists(tableName.id))
    {
        tableName = tableName.id;
    }

    var table = jQuery("#" + tableName);
    if (checkExists(table) && table.length > 0)
    {
        var mainTable = getMainTableViewInformation(tableName);
        var viewID = mainTable.viewID;
        var instanceID = mainTable.instanceID;
        var pageNumber = table[0].getAttribute("PageNumber");
        var comparisonObj = { controlid: false, method: false, contexttype: "Primary", pagenumber: pageNumber, ignoreState: true };
        var rowItems = executionResults.filter(__runtimeJsonFilterMatchingItems, comparisonObj);
        var TotalLength = rowItems.length;

        if (TotalLength > 0)
        {
            SFRGrid.execute({ element: table, fn: "option", params: ['canexpand', true] });

            var pageCount = table[0].getAttribute("NumberOfPages");
            var hasMorePages = table[0].getAttribute("HasMorePages");

            if ((checkExists(pageCount) && pageCount.length > 0 && parseInt(pageCount, 10) > 1) || (checkExists(hasMorePages) && hasMorePages === "true"))
            {
                SFRGrid.execute({ element: table, fn: "option", params: ["customsort", gridCustomSorting] });
            }
            else
            {
                //remove the custom sorting
                SFRGrid.execute({ element: table, fn: "option", params: ["customsort", null] });
            }
            var Arr = viewTableDefinitions[table[0].id];
            if (!checkExists(Arr) || Arr.length === 0)
            {
                var quickSearchProperty;
                var quickSearchValue;
                if (checkExists(table[0].getAttribute("QFName")) && (table[0].getAttribute("QFName").length > 0))
                {
                    quickSearchProperty = table[0].getAttribute("QFName");
                    quickSearchValue = table[0].getAttribute("QFValue");
                }

                Arr = constructTableDefinition(viewID, table, quickSearchValue, quickSearchProperty, instanceID);
                viewTableDefinitions[table[0].id] = Arr;
            }
            buildTableRows(table, TotalLength, Arr, instanceID, retainSort, rowItems, clearSelection);
        }
        else if (stopBusyDiv)
        {
            //hide the busy div
            runtimeBusyView(viewID, false, false, instanceID);
        }
        setTimeout(function () { buildAggregations(table, viewID, stopBusyDiv, instanceID, loopContextID); }, 0);
    }
    //#endregion
}

//constructs each table row according to the data provided
function buildTableRows(table, TotalLength, Arr, instanceID, retainSort, rowItems, clearSelection)
{
    //#region
    var maxCounter = 0;
    var oc = 0;
    var rowValues = [];
    while (oc < TotalLength)
    {
        var rowItem = rowItems[oc];
        var count = rowItem.counter;
        var currentCounter = parseInt(count, 10);
        if (currentCounter > maxCounter)
        {
            maxCounter = currentCounter;
        }

        var state = rowItem.state;
        if (!checkExists(state) || state.toLowerCase() !== "removed") //check for state attribute, ensure that removed rows are not repopulated by any chance. It should influence maxcounter.
        {
            var columns = populateTableRowFromDefinition(Arr, count, instanceID, rowItem);
            rowValues.push(columns);
        }

        ++oc;
    } //for rows
    viewTableDefinitions[table[0].id] = Arr; //recache the definition, it may contain extra cached info
    SFRGrid.execute({ element: table, fn: "add", params: ["rows", rowValues] });

    var fileImage = table.find("a.fileImage, img.fileImage");
    fileImage.on("click", openFileImage);
    fileImage.on("focus", function ()
    {
        $(this).addClass("focus");
    });
    fileImage.on("blur", function ()
    {
        $(this).removeClass("focus");
    });

    table[0].setAttribute("maxcounter", maxCounter);

    SFRGrid.execute({ element: table, fn: "zebra" });
    var pageNumber = table[0].getAttribute("PageNumber");
    var numberOfPages = table[0].getAttribute("numberofpages");
    if (checkExists(retainSort) && retainSort === true && (!checkExists(pageNumber) || (parseInt(pageNumber, 10) === 1 && parseInt(numberOfPages, 10) === 1))) //adapted to ensure that sorting when paging is applied will not restart the sort and do unnecessary executes
    {
        SFRGrid.execute({ element: table, fn: "sort" });
    }

    if (checkExists(clearSelection) && clearSelection == true)
    {
        table.grid("deselect");
        var highlightedRows = table.find("tr.highlighted");
        highlightedRows.each(function ()
        {
            $(this).removeClass("highlighted");
        });

    }

    SourceCode.Forms.Layout.checkAndFixView(table);
    window.setTimeout(function () { SFRGrid.execute({ element: table, fn: "runtimeSyncColumns" }); }, 5);
    //#endregion
}

//populate the summary footer with aggregated values
function buildAggregations(table, viewID, stopBusyDiv, instanceID, loopContextID)
{
    //#region
    updateControlsUsingSummaries(instanceID, loopContextID);
    SFRGrid.execute({ element: table, fn: "option", params: ['canexpand', true] });

    if (stopBusyDiv)
    {
        //hide the busy div
        runtimeBusyView(viewID, false, false, instanceID);
    }
    //#endregion
}

//custom function to open files or images from a list (added to now work on the class attribute of the A tag after changing everything to grids)
function openFileImage(evt)
{
    //#region
    var objClick = (evt.target) ? evt.target : evt.srcElement;
    var objTag = objClick.tagName;
    switch (objTag.toUpperCase())
    {
        case "A":
        case "IMG":
            //either a file or image, must "download" the file
            var controlid = objClick.getAttribute("controlID");
            var controlpath = objClick.getAttribute("relativePath");
            var currentCounter = objClick.getAttribute("counter");
            var fileRequestData = objClick.getAttribute("fileRequestData");

            if (checkExists(controlid))
            {
                if (checkExists(controlpath))
                {
                    openFile(controlpath, 'path', null, null, null, currentCounter, fileRequestData);
                }
                else
                {
                    openFile(controlid, 'control', null, null, null, currentCounter);
                }
            }
            break;
    }
    //#endregion
}

/// <summary>
///	Event that fires when user clicks a row in the table
///	</summary>
/// <param name="ui">A jQuery wrapped instance of the source element</param>
/// <param name="e">The event arguments</param>
function listRowClick(ui, e)
{
    // Create a new click manager if one does not exist.
    this.clickManager = this.clickManager || new ClickManager();

    // Invoke the click handler on the manager
    this.clickManager.click(ui, e, function (ui, e)
    {
        //#region
        var table = ui.parents(".grid");
        if (table.attr("isdisabled") !== "true")
        {
            var viewInstanceInfo = new getMainTableViewInformation(table[0].id);
            var viewID = viewInstanceInfo.viewID;
            var instanceID = viewInstanceInfo.instanceID;
            if (table[0].getAttribute("editable") === "true")
            {
                table[0].removeAttribute("singleEdit");
                attemptItemChanges(table, viewID, instanceID);
            }
            handleEvent(viewID, "View", "ListClick", null, instanceID);
        }
        //#endregion
    });
}

/// <summary>
///	Event that fires when user double clicks a row in the table
///	</summary>
/// <param name="ui">A jQuery wrapped instance of the source element</param>
/// <param name="e">The event arguments</param>
function listRowDblClick(ui, e)
{
   // Create a new click manager if one does not exist.
    this.clickManager = this.clickManager || new ClickManager();

    // Invoke the click handler on the manager
    this.clickManager.dblClick(ui, e, function (ui, e)
    {
        //#region
        var table = ui.parents(".grid");
        if (table.attr("isdisabled") !== "true")
        {
            var viewInstanceInfo = new getMainTableViewInformation(table[0].id);
            var viewID = viewInstanceInfo.viewID;
            var instanceID = viewInstanceInfo.instanceID;
            if (table[0].getAttribute("editable") === "true")
            {
                table[0].removeAttribute("singleEdit");
                attemptItemChanges(table, viewID, instanceID);
            }
            handleEvent(viewID, "View", "ListDoubleClick", null, instanceID);
        }
        //#endregion
    });
}

/* returns an array containing the proper definition of the view table */
var constructTableDefinition = function (viewID, table, quickSearchValue, quickSearchProperty, instanceID, searchOnly)
{
    //#region
    var instanceXP = (checkExists(instanceID)) ? "[@InstanceID='" + instanceID + "']" : "";
    if (instanceXP.length > 0)
    {
        //check to see if the instanceID is valid before trying to repopulate the view - sub view from a view opened in a form might have wrong instanceid set, other places have failsafes implemented
        var verifyViewExistence = $sn(viewControllerDefinition, "Controllers/Controller[@ID='" + viewID + "']" + instanceXP);
        if (!checkExists(verifyViewExistence))
        {
            SFLog({ type: 1, source: "constructTableDefinition", category: "Populate", message: "Instance [{0}] for view [{1}] did not match", parameters: [instanceID, viewID] });
            instanceID = null;
            instanceXP = "";
        }
    }

    var Arr = [];
    var currentViewXml = returnCurrentViewXML(viewID, instanceID);
    var displayTemplateRows = SFRGrid.execute({ element: table, fn: "fetch", params: ["display-template-row"] });
    var b = checkExists(displayTemplateRows) ? displayTemplateRows.find("td .grid-content-cell-wrapper") : [];
    var columnControls = SFRGrid.execute({ element: table, fn: "fetch", params: ["columns"] });
    var s = b.length;
    while (s--)
    {
        var currentColumn = b[s].children[0];
        var resultingObj = null;
        if (checkExists(currentColumn))
        {
            var controlID = currentColumn.getAttribute("ID");
            if (checkExists(controlID) && controlID.length > 0)
            {
                controlID = getActualControlID(controlID);
                var controlNode = $sn(currentViewXml, "Controls/Control[@ID='" + controlID + "']");
                if (checkExists(controlNode))
                {
                    if (checkExists(controlNode.getAttribute("ExpressionID")))
                    {
                        //if its an expression set isExpression = true the controlID and the style
                        resultingObj = {};
                        resultingObj.isExpression = true;
                        resultingObj.controlNode = controlNode;
                        resultingObj.controlID = controlID;
                        resultingObj.fieldID = controlNode.getAttribute("FieldID");
                        resultingObj.instanceID = instanceID;
                        //get control's datatype							
                        var dataType = controlNode.getAttribute("DataType");
                        resultingObj.fieldPropertyType = (checkExists(dataType)) ? dataType.toLowerCase() : "text";
                    }
                    else if (checkExists(controlNode.getAttribute("FieldID")))
                    {
                        var fieldNode = returnFieldAttributeObject(controlNode.getAttribute("FieldID"), instanceID);
                        if (checkExists(fieldNode))
                        {
                            resultingObj = {};
                            //#region
                            resultingObj.fieldID = fieldNode.fieldID;
                            resultingObj.currentColumn = controlID;
                            resultingObj.fieldSOID = fieldNode.parentID;
                            resultingObj.fieldPropertyName = fieldNode.PropertyName;
                            resultingObj.valueProperty = null;
                            resultingObj.fieldPropertyType = fieldNode.propertyType.toLowerCase();
                            resultingObj.fieldType = fieldNode.fieldType;
                            resultingObj.completeName = getQualifiedResultName(fieldNode) + "." + fieldNode.PropertyName.toLowerCase();

                            var fieldAssociations = new dataSourceLookup({ xmlDoc: currentViewXml, includeControllers: false, includeController: false, controllerID: viewID, sourceControlID: controlID, originalProperty: resultingObj.fieldPropertyName }).getDataSource();
                            if (checkExists(fieldAssociations))  //associations
                            {
                                resultingObj.isAssociation = true;
                                resultingObj.originalSOID = fieldAssociations.getAttribute("AssociationSO");
                                resultingObj.displayTemplate = fieldAssociations.getAttribute("DisplayTemplate");
                                if (checkExists(resultingObj.displayTemplate))
                                {
                                    resultingObj.displayValueCache = {};
                                }
                                if (resultingObj.displayTemplate.startsWith("<Template>"))
                                {
                                    resultingObj.isXmlDisplayTemplate = true;
                                }
                                resultingObj.originalPropertyName = fieldAssociations.getAttribute("OriginalProperty");
                                resultingObj.valueProperty = fieldAssociations.getAttribute("ValueProperty");
                                var contextID = fieldAssociations.getAttribute("ContextID");
                                var contextType = fieldAssociations.getAttribute("ContextType");
                                resultingObj.contextID = contextID;
                                resultingObj.contextType = contextType;
                                resultingObj.actualDisplayProperty = returnDisplayPropertyFromTemplate(resultingObj.displayTemplate); //changed to allow for displaytemplate values
                                var newFieldNode = null;
                                if (fieldAssociations.getAttribute("DisplaySO"))
                                {
                                    resultingObj.displaySOID = fieldAssociations.getAttribute("DisplaySO");
                                    resultingObj.displayMethod = fieldAssociations.getAttribute("DisplayMethod");
                                    resultingObj.displayJoinProperty = fieldAssociations.getAttribute("DisplayJoinProperty");
                                    resultingObj.associatedJoinProperty = fieldAssociations.getAttribute("AssociatedJoinProperty");
                                    newFieldNode = $sn(currentViewXml, "Fields/Field[@ContextID='" + resultingObj.contextID + "'][@ContextType='" + resultingObj.contextType + "'][@ObjectID='" + resultingObj.displaySOID + "'][PropertyName/text()='" + resultingObj.actualDisplayProperty + "']");
                                }
                                else
                                {
                                    newFieldNode = $sn(currentViewXml, "Fields/Field[@ContextID='" + resultingObj.contextID + "'][@ContextType='" + resultingObj.contextType + "'][@ObjectID='" + resultingObj.originalSOID + "'][PropertyName/text()='" + resultingObj.actualDisplayProperty + "'][@ContextType='" + contextType + "'][@ContextID='" + contextID + "']");
                                }
                                if (newFieldNode)
                                {
                                    fieldNode = returnFieldAttributeObject(newFieldNode.getAttribute("ID"), instanceID);
                                    if (checkExists(fieldNode))
                                    {
                                        resultingObj.fieldPropertyType = fieldNode.propertyType.toLowerCase();
                                        resultingObj.fieldType = fieldNode.fieldType;
                                        resultingObj.completeName = getQualifiedResultName(fieldNode) + "." + fieldNode.PropertyName.toLowerCase();
                                    }
                                }
                            }

                            if ((quickSearchValue) && ((resultingObj.completeName.toLowerCase() === quickSearchProperty.toLowerCase()) || ((quickSearchProperty.startsWith("[All]") || (quickSearchProperty.startsWith("[AllDisplay]"))) && (quickSearchProperty.indexOf(resultingObj.completeName.toLowerCase()) > 0))))
                            {
                                resultingObj.quickSearchValue = quickSearchValue;
                            }

                            //#endregion
                        }
                    }
                    else if (checkExists($sn(controlNode, "Properties/Property[Name/text()='GetDefaultValue']"))) //default values for columns without fields or expressions
                    {
                        resultingObj = {};
                        //get default value
                        var objInfo = new PopulateObject(null, null, controlID);
                        var defaultValue = executeControlFunction(controlNode, "GetDefaultValue", objInfo);
                        resultingObj.text = defaultValue;
                        //get control's datatype							
                        var defaultDataType = controlNode.getAttribute("DataType");
                        resultingObj.fieldPropertyType = (checkExists(defaultDataType)) ? defaultDataType.toLowerCase() : "text";
                        resultingObj.currentColumn = controlID;
                        resultingObj.textNode = null; //set this up to work correctly for complex types (hyperlink/multivalue)
                        resultingObj.isDefault = true;
                    }

                    if (checkExists(resultingObj))
                    {
                        /* shared functionality for styling, visibility and icon */
                        //#region
                        var controlPropertyOptions =
                            {
                                controlID: controlID,
                                currentControl: controlNode
                            }
                        controlPropertyOptions.propertyName = "IsVisible";
                        resultingObj.isVisible = returnControlPropertyValue(controlPropertyOptions);
                        controlPropertyOptions.propertyName = "IsEnabled";
                        var isEnabled = returnControlPropertyValue(controlPropertyOptions);
                        controlPropertyOptions.propertyName = "IsParentEnabled";
                        var isParentEnabled = returnControlPropertyValue(controlPropertyOptions);
                        controlPropertyOptions.propertyName = "WrapText";
                        var wrapText = returnControlPropertyValue(controlPropertyOptions);
                        controlPropertyOptions.propertyName = "LiteralVal";
                        var literalVal = returnControlPropertyValue(controlPropertyOptions);
                        controlPropertyOptions.propertyName = "ToolTip";
                        var toolTip = returnControlPropertyValue(controlPropertyOptions);
                        if (checkExists(toolTip) && toolTip !== "")
                        {
                            resultingObj.toolTip = toolTip;
                        }
                        controlPropertyOptions.propertyName = "SanitizeHtml";
                        var sanitizeHtml = returnControlPropertyValue(controlPropertyOptions);

                        resultingObj.wrapText = (checkExists(wrapText) && wrapText.toString().toLowerCase() === "true");
                        resultingObj.literalVal = (checkExists(literalVal) && literalVal.toString().toLowerCase() === "true");
                        resultingObj.sanitizeHtml = (checkExists(sanitizeHtml) && sanitizeHtml.toString().toLowerCase() === "true");

                        controlPropertyOptions.propertyName = "TextStyle";
                        resultingObj.textStyle = returnControlPropertyValue(controlPropertyOptions);

                        controlPropertyOptions.propertyName = "Width";
                        var wrapWidth = returnControlPropertyValue(controlPropertyOptions);

                        if (checkExists(wrapWidth))
                        {
                            wrapWidth = wrapWidth.toString().toLowerCase().trim();
                            if (wrapWidth.length > 0)
                            {
                                if (wrapWidth.indexOf("px") < 0 && wrapWidth.indexOf("%") < 0)
                                {
                                    wrapWidth += "px";
                                }
                                wrapWidth += ";";
                                resultingObj.wrapWidth = wrapWidth;
                            }
                        }

                        controlPropertyOptions.propertyName = "Target";
                        resultingObj.target = returnControlPropertyValue(controlPropertyOptions);
                        var ctrlHeight = 32; //runtime defaults
                        var ctrlWidth = 32; //runtime defaults

                        if (resultingObj.fieldPropertyType === "image")
                        {
                            controlPropertyOptions.propertyName = "ThumbnailSize";
                            var thumbnailSize = returnControlPropertyValue(controlPropertyOptions);

                            switch (thumbnailSize)
                            {
                                case 'verysmall':
                                    ctrlHeight = 16;
                                    ctrlWidth = 16;
                                    break;
                                case 'small':
                                    ctrlHeight = 32;
                                    ctrlWidth = 32;
                                    break;
                                case 'medium':
                                    ctrlHeight = 48;
                                    ctrlWidth = 48;
                                    break;
                                case 'large':
                                    ctrlHeight = 64;
                                    ctrlWidth = 64;
                                    break;
                                case 'verylarge':
                                    ctrlHeight = 128;
                                    ctrlWidth = 128;
                                    break;
                                case 'custom':
                                    controlPropertyOptions.propertyName = "CustomThumbnailHeight";
                                    ctrlHeight = parseInt(returnControlPropertyValue(controlPropertyOptions), 10);
                                    controlPropertyOptions.propertyName = "CustomThumbnailWidth";
                                    ctrlWidth = parseInt(returnControlPropertyValue(controlPropertyOptions), 10);
                                    if (!checkExists(ctrlWidth) || !checkExists(ctrlHeight))
                                    {
                                        ctrlHeight = 70;
                                        ctrlWidth = 70;
                                    }
                                    break;
                            }
                            resultingObj.height = ctrlHeight;
                            resultingObj.width = ctrlWidth;
                        }


                        var clonedControl = controlNode.cloneNode(true);

                        var style = $sn(clonedControl, "Properties/Styles"); //[Style[node()]]");//removed for appending purposes etc (TFS252074) - reset below to similar after column style was evaluated
                        var conditionalStyle = $sn(clonedControl, "Properties/ConditionalStyles");
                        var columnControl = checkExists(columnControls) ? columnControls[s] : null;
                        if (checkExists(columnControl) && columnControl.name.length > 0)
                        {
                            var columnControlID = columnControl.name;
                            var columnControlNode = _runtimeControllerFindObject({ xmlDoc: currentViewXml, includeControllers: false, controlID: columnControlID, viewID: viewID, instanceID: instanceID })
                            var columnControlStyle = $sn(columnControlNode, "Properties/Styles[Style[node()]]");
                            if (checkExists(columnControlNode))
                            {
                                if (checkExists(columnControlStyle))
                                {
                                    if (checkExists(style))
                                    {
                                        var styleArray = [];
                                        styleArray.push(style.cloneNode(true));
                                        var combinedStyle = combineStyles($xml(columnControlStyle.xml), styleArray);

                                        $sn(clonedControl, "Properties").replaceChild($sn(combinedStyle, "Styles"), style);
                                    }
                                    else
                                    {
                                        $sn(clonedControl, "Properties").appendChild(columnControlStyle.cloneNode(true));
                                    }
                                }
                            }
                            var columnControlPropertyOptions =
                                {
                                    controlID: columnControlID,
                                    currentControl: columnControlNode
                                }
                            columnControlPropertyOptions.propertyName = "ImageClass";
                            resultingObj.icon = returnControlPropertyValue(columnControlPropertyOptions);
                            if (!checkExists(isParentEnabled)) //fallback for original isParentEnabled as supplied from definition (when column property is set)
                            {
                                columnControlPropertyOptions.propertyName = "IsEnabled";
                                isParentEnabled = returnControlPropertyValue(columnControlPropertyOptions);
                            }
                            if (checkExists(resultingObj.icon) && resultingObj.icon.toLowerCase() === "none")
                            {
                                resultingObj.icon = null;
                            }
                        }
                        style = $sn(clonedControl, "Properties/Styles[Style[node()]]"); //resetting variable to ensure that only valid styles are used (above is used to append correctly if column style is also used and to return complete styling (TFS252074)
                        if ((checkExists(isEnabled) && isEnabled.toLowerCase() === "false") || (checkExists(isParentEnabled) && isParentEnabled.toLowerCase() === "false"))
                        {
                            resultingObj.isDisabled = true;
                        }
                        if (checkExists(style) || checkExists(conditionalStyle))
                        {
                            resultingObj.style = clonedControl;
                        }
                        //#endregion
                        /*end of shared code */
                    }
                }
            }
        }
        Arr.push(resultingObj);
    }
    return Arr;
    //#endregion
};

/*builds a table row from the definition values */
var populateTableRowFromDefinition = function (Arr, currentCounter, instanceID, rowItem)
{
    //#region
    var textArray = [];
    //loop through all the fields that are currently displayed
    var ic = checkExists(Arr) ? Arr.length : 0;
    while (ic--)
    {
        var fieldProperties = Arr[ic];
        var textArrayItem = {};

        var literalVal = false;
        if (checkExists(fieldProperties))
        {
            var textInfo = {};

            var columnStyleObj = {
                currentCounter: currentCounter,
                fieldProperties: fieldProperties
            };

            if (fieldProperties.isExpression) //calculation - returns control
            {
                var controlNode = _runtimeControllerFindObject({ controlID: fieldProperties.controlID });
                textInfo.text = returnCalculationResultForControl(controlNode, currentCounter, instanceID);
                if (checkExists(textInfo.text))
                {
                    textInfo.valueText = textInfo.text.toString();
                    if (checkExists(fieldProperties.fieldID))
                    {
                        setHiddenFieldValue(fieldProperties.fieldID, textInfo.valueText, currentCounter, instanceID, null, null, true);
                    }
                }

                columnStyleObj.textInfo = textInfo;
                columnStyleObj.onlyUseValueText = true;
                columnStyleObj.textNode = null;

            }
            else if (fieldProperties.isDefault) //default text of control
            {
                textInfo.text = fieldProperties.text;

                columnStyleObj.textInfo = textInfo;
                columnStyleObj.onlyUseText = true;
                columnStyleObj.textNode = fieldProperties.textNode;
            }
            else
            {
                var fieldPropertyName = fieldProperties.fieldPropertyName;
                var isAssociation = fieldProperties.isAssociation;
                var textNode = null;

                if (checkExists(rowItem))
                {
                    textNode = rowItem.fields[fieldPropertyName];
                }

                if (checkExists(textNode))
                {
                    var displayTemplate = fieldProperties.displayTemplate;
                    var isXmlDisplayTemplate = fieldProperties.isXmlDisplayTemplate;

                    if (!checkExists(displayTemplate))
                    {
                        textInfo.text = textNode.value;
                    }
                    else
                    {
                        var cacheKey = textNode.value;
                        var cacheEntry = fieldProperties.displayValueCache[cacheKey];
                        if (checkExists(cacheEntry))
                        {
                            textNode = cacheEntry.textNode;
                            textInfo.text = cacheEntry.text;
                        }
                        else
                        {
                            if (isAssociation && rowItem.joins != null && rowItem.joins.length > 0)
                            {
                                var parentID = fieldProperties.originalSOID;
                                var displaySOID = fieldProperties.displaySOID;
                                if (displaySOID)
                                {
                                    parentID = displaySOID;
                                }

                                var comparisonObj = { parentid: parentID, contextid: fieldProperties.contextID, contexttype: fieldProperties.contextType };
                                var displayObject = rowItem.joins.filter(__runtimeJsonFilterMatchingItems, comparisonObj);
                                if (displayObject.length > 0)
                                {
                                    var actualDisplayProperty = fieldProperties.actualDisplayProperty;
                                    textNode = displayObject[0].fields[actualDisplayProperty];

                                    if (!checkExists(textNode))
                                    {
                                        //Use valueProperty as a fallback
                                        var valueProperty = fieldProperties.valueProperty;
                                        textNode = displayObject[0].fields[valueProperty];
                                    }

                                    if (checkExists(textNode))
                                    {
                                        if (checkExists(displayTemplate) && isXmlDisplayTemplate)
                                        {
                                            textInfo.text = UtilitiesHelper.setDisplayTemplateValueFromJson(displayTemplate, displayObject[0].fields);
                                        }
                                        else
                                        {
                                            if (checkExists(displayTemplate) && checkExists(displayObject[0].fields[displayTemplate]))
                                            {
                                                //cases where displaytemplate is not xml (backwards compatibility for deployed collateral)
                                                textNode = displayObject[0].fields[displayTemplate];
                                            }
                                            textInfo.text = textNode.value;
                                        }
                                        fieldProperties.displayValueCache[cacheKey] = { textNode: textNode, text: textInfo.text };
                                    }
                                }
                            }
                        }
                    }
                    columnStyleObj.textInfo = textInfo;
                    columnStyleObj.textNode = textNode;
                }
            }

            if (checkExists(columnStyleObj.textInfo))//values were found
            {
                //does conversion on values according to styling etc.
                textInfo = new returnStyledColumTextAccordingToType(columnStyleObj);
            }

            if (checkExists(fieldProperties.literalVal))
            {
                literalVal = fieldProperties.literalVal;
            }

            if (!checkExistsNotEmpty(textInfo.text))
            {
                textInfo.text = "";//"&nbsp;";
                textInfo.valueText = "";
                textInfo.displayText = "";//"&nbsp;"
            }

            if (checkExists(fieldProperties.icon) && checkExistsNotEmpty(textInfo.valueText))
            {
                textInfo.icon = fieldProperties.icon;
            }

            if (checkExistsNotEmpty(fieldProperties.fieldPropertyType))
            {
                textInfo.fieldPropertyType = fieldProperties.fieldPropertyType;
            }

            //constructs array item based on results
            textArrayItem = {
                html: textInfo.text,
                value: textInfo.valueText,
                display: textInfo.displayText,
                counter: currentCounter,
                isLiteral: literalVal
            };

            if (checkExists(textInfo.icon))
            {
                textArrayItem.icon = textInfo.icon;

            }
            if (checkExists(textInfo.alignment))
            {
                textArrayItem.align = textInfo.alignment.text.toLowerCase();
            }

            if (checkExistsNotEmpty(textInfo.fieldPropertyType))
            {
                textArrayItem.fieldPropertyType = textInfo.fieldPropertyType;
            }
        }
        else
        {
            textArrayItem = {
                html: "",
                value: "",
                display: "",
                counter: currentCounter
            }
        }
        textArray.push(textArrayItem);
    }
    return textArray;
    //#endregion
};

function applyTableLabelStyleAndFormatting(fieldProperties, textInfo, currentCounter)
{
    //Styling & Formatting
    if (checkExists(fieldProperties.style) || checkExists(fieldProperties.isDisabled))
    {
        var element = fieldProperties.applyStylesElement;
        if (!checkExists(element))
        {
            element = document.createElement("div");
            if (fieldProperties.styleElementString)//simple types only, explicit types need the values set each time (file/image etc)
            {
                fieldProperties.applyStylesElement = element;
            }
        }
        element.innerHTML = textInfo.text;
        var styleTextNode = element.children[0];
        if (checkExists(styleTextNode))
        {
            if (checkExists(fieldProperties.style))
            {
                if (!checkExists(fieldProperties.hasConditionalStyles))
                {
                    fieldProperties.hasConditionalStyles = checkExists($sn(fieldProperties.style, "Properties/ConditionalStyles/ConditionalStyle"));

                    if (!checkExists(fieldProperties.hasConditionalFormat))
                    {
                        fieldProperties.hasConditionalFormat = (fieldProperties.hasConditionalStyles) ? checkExists($sn(fieldProperties.style, "Properties/ConditionalStyles/ConditionalStyle/Styles/Style/Format")) : false;
                    }

                    if (!checkExists(fieldProperties.hasConditionalAlign))
                    {
                        fieldProperties.hasConditionalAlign = (fieldProperties.hasConditionalStyles) ? checkExists($sn(fieldProperties.style, "Properties/ConditionalStyles/ConditionalStyle/Styles/Style/Text/Align")) : false;
                    }
                }

                fieldProperties.columnStyles = applyConstructedStyle(fieldProperties.style, currentCounter);

                if (checkExists(fieldProperties.columnStyles))
                {
                    if (!fieldProperties.hasConditionalFormat && !fieldProperties.columnFormatVerified)
                    {
                        fieldProperties.columnFormat = $sn(fieldProperties.columnStyles, "Styles/Style/Format");
                        fieldProperties.columnFormatVerified = true;
                    }
                    if (!fieldProperties.hasConditionalAlign && !fieldProperties.columnAlignVerified)
                    {
                        fieldProperties.columnAlign = $sn(fieldProperties.columnStyles, "Styles/Style/Text/Align");
                        fieldProperties.columnAlignVerified = true;
                    }
                }

                var currentStyle = null;
                if (!fieldProperties.hasConditionalStyles)
                {
                    currentStyle = fieldProperties.columnStyles;
                }
                else
                {
                    currentStyle = applyConstructedStyle(fieldProperties.style, currentCounter);
                }

                if ($chk(currentStyle))
                {
                    var formatValue = null;
                    if (!fieldProperties.hasConditionalStyles)
                    {
                        formatValue = fieldProperties.columnFormat;
                    }
                    else
                    {
                        formatValue = currentStyle.selectSingleNode("Styles/Style/Format");
                    }

                    var jqTextNode = jQuery(styleTextNode);

                    var options = {
                        "border": jqTextNode,
                        "background": jqTextNode,
                        "margin": jqTextNode,
                        "padding": jqTextNode,
                        "font": jqTextNode
                    };

                    StyleHelper.setStyles(options, currentStyle.xml);

                    if (checkExists(formatValue))
                    {
                        var textValue = "";
                        if (checkExists(textInfo.valueText))
                        {
                            textValue = textInfo.valueText; // innerText and textContent handles newlines etc differently
                        }
                        var editableOptions =
                            {
                                formatXmlString: formatValue.xml,
                                value: textValue,
                                ignoreDates: true,
                                doSimpleReplace: true,
                                dataType: fieldProperties.fieldPropertyType
                            };
                        var editableText = SCCultureHelper.current.getEditableValue(editableOptions);
                        var styleOptions =
                            {
                                formatXmlString: formatValue.xml,
                                elementToStyle: styleTextNode,
                                value: editableText,
                                valueIsEditableValue: true,
                                dataType: fieldProperties.fieldPropertyType
                            };

                        var formattedText = SCCultureHelper.current.applyFormatToControlValue(styleOptions);
                        if (!checkExistsNotEmpty(fieldProperties.toolTip))
                        {
                            textInfo.displayText = formattedText;
                        }

                        styleTextNode.innerHTML = formattedText;

                        if (checkExists(fieldProperties.quickSearchValue) && checkExists(fieldProperties.fieldPropertyType) && fieldProperties.fieldPropertyType !== "file" && fieldProperties.fieldPropertyType !== "image" && fieldProperties.fieldPropertyType !== "hyperlink" && fieldProperties.fieldPropertyType !== "multivalue")
                        {
                            var replaceText = replaceSpecialChars(formattedText);
                            var quickSearchValue = replaceSpecialChars(fieldProperties.quickSearchValue).toLowerCase();
                            if (replaceText.length > 0 && replaceText.toLowerCase().indexOf(quickSearchValue) > -1) //had issues with quick search and formatted controls - have to do explicit check before overriding innerHTML
                            {
                                styleTextNode.innerHTML = checkQuickSearch(formattedText, fieldProperties.quickSearchValue, true, fieldProperties.literalVal);
                            }
                        }
                    }

                    textInfo.alignment = null;
                    if (!fieldProperties.hasConditionalAlign)
                    {
                        textInfo.alignment = fieldProperties.columnAlign;
                    }
                    else
                    {
                        textInfo.alignment = $sn(currentStyle, "Styles/Style/Text/Align");
                    }

                    textInfo.text = element.innerHTML;
                }
            }
            if (checkExists(fieldProperties.isDisabled))
            {
                //do this last as it would override the styles supplied by styling/formatting and conditional formatting
                //can't just apply class as styles will override them
                element = jQuery("<div>" + textInfo.text + "</div>");
                element[0].children[0].style.color = "#cccccc";
                textInfo.text = element[0].innerHTML;
            }
        }
    }
    return textInfo; //not really neccessary, but done for the sake of readability
}

// take the column value and return it according to the type with quick search highlighting applied (extracted logic from populate TableRowFromDefinition)
// this function is a constructor function
// options properties:
// textInfo - object containing at least the text and valueText properties
// fieldProperties - object containing the field properties like literalVal, wrapText, wrapWidth, isDisabled, etc
// currentCounter - a counter
// onlyUseText (optional) - use the text property for text and valueText
// onlyUseValueText (optional) - use the valueText property for text and valueText
// textNode (optional) - use this existing text node instead of creating a new one
function returnStyledColumTextAccordingToType(options)
{
    if (!(options && options.textInfo && options.fieldProperties))
    {
        throw "returnStyledColumTextAccordingToType invoked with incorrect or missing parameters";
    }

    //#region
    var text = options.textInfo.text;
    var valueText = options.textInfo.valueText;

    if (options.onlyUseText === true)
    {
        valueText = text;
    }
    else if (options.onlyUseValueText === true)
    {
        text = valueText;
    }

    this.displayText = text;
    var textNode = options.textNode;
    var fieldProperties = options.fieldProperties;
    var quickSearchValue = fieldProperties.quickSearchValue
    var currentCounter = options.currentCounter;
    var textInfo = options.textInfo;

    if (checkExists(text) && text.trim().length > 0)
    {
        var wrapText = options.fieldProperties.wrapText ? "-wrap" : "";
        var literalVal = options.fieldProperties.literalVal;
        var sanitizeHtml = options.fieldProperties.sanitizeHtml;
        var textStyle = options.fieldProperties.textStyle;
        var widthText = options.fieldProperties.wrapWidth ? " width: " + options.fieldProperties.wrapWidth : "";
        var fieldPropertyType = options.fieldProperties.fieldPropertyType;
        var xdoc = null;

        var textStyleMetaData = SourceCode.Forms.Controls.Web.Utilities.TextStyleHelper.getTextStyleMetaData(textStyle);
        if (checkExistsNotEmpty(textStyleMetaData.className))
        {
            textStyleMetaData.className += " ";
        }

        var textContentTemplate = "<" + textStyleMetaData.tagName + " style='display: inline-block;" + widthText + "' class='" + textStyleMetaData.className + "runtime-list-item{0}'>{1}</" + textStyleMetaData.tagName + ">";

        switch (fieldPropertyType)
        {
            case "file":
            case "image":
                var path = null;
                var fileRequestData = null;
                var fileDataUrl = null;
                var isImage = fieldPropertyType.toLowerCase() === "image";
                if (text.startsWith("<collection>"))
                {
                    var xpFileName = baseCollectionXPath + "/fields/field[@name='FileName']/value";
                    xdoc = $xml(text);
                    var filename = $sn(xdoc, xpFileName).text;
                    text = filename;
                    this.displayText = filename;
                    path = $sn(xdoc, baseCollectionXPath + "/fields/field[@name='FilePath']/value");
                    var isMobile = SourceCode.Forms.Runtime.MobileBridge.inMobileAppContext();
                    if (isMobile && checkExists(path) && !checkExistsNotEmpty(path.text))
                    {
                        fileDataUrl = $sn(xdoc, baseCollectionXPath + "/fields/field[@name='FileDataURL']/value");
                    }
                    fileRequestData = $sn(xdoc, baseCollectionXPath + "/fields/field[@name='FileRequestData']/value");
                    if (checkExists(fileRequestData))
                    {
                        fileRequestData = fileRequestData.text;
                    }
                }

                if (text.length > 0)
                {
                    valueText = text;
                    var controlID = "'  controlID='" + fieldProperties.currentColumn;
                    if (checkExists(fieldProperties.isDisabled))
                    {
                        controlID = "";
                    }
                    var styletext = "";
                    if (fieldProperties.height)
                    {
                        styletext += "height:" + fieldProperties.height + "px;";
                    }
                    if (fieldProperties.width)
                    {
                        styletext += "width:" + fieldProperties.width + "px;";
                    }
                    if (styletext.length > 0)
                    {
                        styletext = " style='" + styletext + "' ";
                    }

                    if (isImage)
                    {
                        var clearThumbnailCache = false;
                        if (checkExists(fieldProperties.clearThumbnailCache))
                        {
                            clearThumbnailCache = fieldProperties.clearThumbnailCache;
                        }
                        text = "<img tabindex='0' class='fileImage static' alt='" + text.htmlEncode() + "' title='" + text.htmlEncode() + "' counter='" + currentCounter + controlID + "' " + styletext;
                        if (path && path.text)
                        {
                            var pathString = constructFileSrc(path.text, "path", "image", fieldProperties.height, fieldProperties.width, currentCounter, null, clearThumbnailCache, fileRequestData);
                            pathString = FormatFileDownloadPathForAnonAccess(pathString, true);
                            pathString = SourceCode.Forms.XSRFHelper.appendAntiXSRFQueryStringParameter(pathString);
                            if (checkExists(fileRequestData))
                            {
                                fileRequestData = "fileRequestData='" + fileRequestData + "'";
                            }
                            else
                            {
                                fileRequestData = "";
                            }
                            text += " relativePath='" + path.text.htmlEncode() + "' " + fileRequestData + " src=\"" + pathString.htmlEncode() + "\"/>";
                        }
                        else
                        {
                            var fileSrc = '';
                            if (checkExists(fileDataUrl) && checkExistsNotEmpty(fileDataUrl.text))
                            {
                                fileSrc = fileDataUrl.text;
                                text += " src=\"" + fileSrc.htmlEncode() + "\" />";
                            } 
                            else
                            {
                                fileSrc = constructFileSrc(fieldProperties.currentColumn, "control", "image", fieldProperties.height, fieldProperties.width, currentCounter, null, clearThumbnailCache);
                                path = FormatFileDownloadPathForAnonAccess(fileSrc, true);
                                path = SourceCode.Forms.XSRFHelper.appendAntiXSRFQueryStringParameter(path);
                                text += " src=\"" + path.htmlEncode() + "\" />";
                            }
                        }
                    }
                    else
                    {
                        var encodedQuickSearchValue = quickSearchValue;
                        if (checkExists(encodedQuickSearchValue))
                        {
                            encodedQuickSearchValue = encodedQuickSearchValue.htmlEncode();
                        }
                        var textvalue = checkQuickSearch(text.htmlEncode(), encodedQuickSearchValue, null, false);
                        if (checkExists(fieldProperties.isDisabled))
                        {
                            text = "<span style='display: inline-block;color:#cccccc;" + widthText + "'  class='runtime-list-item" + wrapText + "' >" + textvalue + "</span>";
                        }
                        else
                        {
                            //only use the column fieldProperties in the file + image types
                            //changes to allow the user to download the files from the list directly without going to the capture view
                            if (checkExists(fileRequestData))
                            {
                                fileRequestData = "' fileRequestData='" + fileRequestData;
                            }
                            else
                            {
                                fileRequestData = "";
                            }
                            text = "<a href='javascript:void(0);' tabindex='0' counter='" + currentCounter + controlID + fileRequestData;
                            if (path)
                            {
                                //uploaded files in CL which has not yet been saved to the SO
                                text += "' relativePath='" + path.text.htmlEncode();
                            }
                            text += "' class='fileImage static'>" + textvalue + "</a>";
                        }
                    }
                }
                break;
            case "hyperlink":
                //text = reverseReplaceSpecialChars(text);
                var trimtext = text.trim();
                if (trimtext.startsWith("<a"))
                {
                    text = "<value>" + text + "</value>";
                }
                if (checkExistsNotEmpty(text))
                {
                    trimtext = text.trim();
                    if (!trimtext.startsWith("<value"))
                    {
                        if (!trimtext.startsWith("<a"))
                        {
                            text = "<a tabindex='0' class='hyperlink static' href='{0}'>{0}</a>".format(text.htmlEncode());
                        }
                        text = "<value>" + text + "</value>";
                    }
                    valueText = text;
                    xdoc = $xml(text);
                    text = "";
                    var xpDisplay = "value/a";
                    var hyperlinkNode = $sn(xdoc, xpDisplay);
                    if (checkExists(hyperlinkNode))
                    {
                        var link = hyperlinkNode.getAttribute("href");
                        text = hyperlinkNode.text;
                        if (text.length === 0)
                        {
                            text = link;
                        }
                        if (text === Resources.RuntimeMessages.SpecifyHyperlinkText)
                        {
                            text = "";
                        }
                        this.displayText = text;
                        var encodedQuickSearchValue = quickSearchValue;
                        if (checkExists(encodedQuickSearchValue))
                        {
                            encodedQuickSearchValue = encodedQuickSearchValue.htmlEncode();
                        }
                        text = checkQuickSearch(text.htmlEncode(), encodedQuickSearchValue);
                        var target = checkExists(fieldProperties.target) ? fieldProperties.target : "_blank";
                        // text is encoded by checkQuickSearch
                        if (checkExists(fieldProperties.isDisabled))
                        {
                            text = "<span style='display: inline-block;color:#cccccc;" + widthText + "' class='runtime-list-item" + wrapText + "' >" + text + "</span>";
                        }
                        else
                        {
                            text = "<span class='runtime-list-item" + wrapText + "' style='display: inline-block;" + widthText + "' ><a tabindex='0' class='hyperlink static' target='" + target + "' href='" + link.htmlEncode() + "'>" + text + "</a></span>";
                        }
                    }
                    else //fix for the non-standard SP2013 implementation where they only use it to display values in certain cases (TFS461578)
                    {
                        text = trimtext;
                    }
                }
                break;
            case "multivalue":
                while (text.startsWith("&lt;"))
                {
                    text = text.xmlDecode();
                }
                if (text.startsWith("<collection>") || text === "<collection/>")
                {
                    text = "<value>" + text + "</value>";
                }
                else if (checkExists(textNode) && textNode.xml)
                {
                    text = textNode.xml;
                }
                if (text.length > 0)
                {
                    valueText = text;
                    if (text.startsWith("<value>"))
                    {
                        xdoc = $xml(text);
                        this.displayText = ""; //reset the tooltip value
                        var xpItems = "value/" + baseCollectionXPath + "/fields/field";
                        var items = $mn(xdoc, xpItems);
                        if (checkExists(items) && items.length > 0)
                        {

                            for (var p = 0; p < items.length; p++)
                            {
                                var itemValue = $sn(items[p], "value").text;
                                itemValue = checkQuickSearch(itemValue, quickSearchValue);
                                this.displayText += itemValue; //append tooltip value
                                if (p + 1 < items.length)
                                {
                                    this.displayText += ", "; //append the tooltip value
                                }
                            }
                        }
                        else
                        {
                            //Handle Picker non XML format
                            items = $sn(xdoc, "value").text.split(';');
                            for (var p = 0; p < items.length; p++)
                            {
                                this.displayText += items[p]; //append tooltip value
                                if (p + 1 < items.length)
                                {
                                    this.displayText += ", "; //append the tooltip value
                                }
                            }
                        }
                    }
                    else
                    {
                        this.displayText = text; //cater for scenarios where the data might have been stored differently
                    }
                    text = textContentTemplate.format(wrapText, this.displayText);
                }
                break;
            default:

                if (literalVal === true && sanitizeHtml === true && fieldPropertyType == "text") {
                    text = html_sanitize(text, function (url) { return url }, function (id) { return id });
                    this.displayText = html_sanitize(this.displayText, function (url) { return url }, function (id) { return id });
                }
                valueText = text;

                if (checkExists(quickSearchValue) && text.length > 0)//only apply quicksearch if nothing else will override the value later on - otherwise it will be done after formatting/styling took place
                {
                    text = checkQuickSearch(text, quickSearchValue, true, literalVal);
                }
                else if (literalVal === false)
                {
                    text = text.htmlEncode();
                }

                fieldProperties.styleElementString = textContentTemplate;
                break;
        }
    }

    if (!checkExistsNotEmpty(text) || (checkExists(fieldProperties.isVisible) && fieldProperties.isVisible === "false"))
    {
        textInfo.text = "";
    }
    else
    {
        // style element was set, so that is where we want to apply the style
        // If we apply the style to the style element and the text, we will lose html escaping
        textInfo.text = checkExists(fieldProperties.styleElementString) ? fieldProperties.styleElementString : text;
        textInfo.valueText = valueText;
        textInfo.displayText = this.displayText;
        textInfo = applyTableLabelStyleAndFormatting(fieldProperties, textInfo, currentCounter);
        textInfo.text = textInfo.text.format(wrapText, text);
    }

    this.text = textInfo.text;
    this.valueText = (checkExists(textInfo.valueText)) ? textInfo.valueText.htmlEncode().xpathEncodeBackslash() : null;
    this.alignment = textInfo.alignment;
    this.displayText = checkExists(textInfo.displayText) ? textInfo.displayText : "";

    if (checkExists(fieldProperties.toolTip))
    {
        this.displayText = fieldProperties.toolTip;
    }

    return this;
    //#endregion
}

//helper function clears and populates the grid according to specifications, replaces all the duplicate combinations of the executions, and prevents unnecessary usage of populateView
function rebuildTable(tableName, viewID, instanceID, doAggregations, syncColumns, retainSort, xmlDoc, stopBusyDiv, pageNumber, loopContextID, clearSelection)
{
    //#region

    //since we are rebuilding this table remove any pending requests to build it
    var simpleListCacheIndex = simpleListCache.indexOf(tableName);
    while (simpleListCacheIndex > -1)
    {
        simpleListCache.splice(simpleListCacheIndex, 1);
        simpleListCacheIndex = simpleListCache.indexOf(tableName);
    }

    var listRefreshCacheIndex = listRefreshCache.indexOf(tableName);
    while (listRefreshCacheIndex > -1)
    {
        listRefreshCache.splice(listRefreshCacheIndex, 1);
        listRefreshCacheIndex = listRefreshCache.indexOf(tableName);
    }

    clearDisplayValueCache(tableName);
    clearTable(tableName, viewID, instanceID, doAggregations, syncColumns, retainSort, loopContextID);
    BuildTable(tableName, xmlDoc, stopBusyDiv, retainSort, loopContextID, clearSelection);
    //#endregion
}

//function to clear the displayValueCache when rebuilding table (set in populateTableRowFromDefinition)
function clearDisplayValueCache(tableID)
{
    //#region
    var Arr = viewTableDefinitions[tableID];
    if (checkExists(Arr))
    {
        var ic = Arr.length;
        while (ic--)
        {
            var id = Arr[ic];
            if (checkExists(id) && checkExists(id.displayValueCache))
            {
                id.displayValueCache = {};
            }
        }
        viewTableDefinitions[tableID] = Arr;
    }
    //#endregion
}

