/* Filter.js - handles all the filtering functionality on list views for the form
Also includes some paging functionality as well as custom sorting functionality (used when paging is applied) */

//the event that gets executed when the quick search button is clicked
function quickSearchFilterClicked(evt)
{
    //#region
    if (!_runtimeLoadingFromDraft)
    {
        var instanceID = evt.data;
        BuildFilterEventAction(evt.target.id, null, instanceID);
    }
    //#endregion
}

//construct the action that will be executed when the quick filter button is clicked
function BuildFilterEventAction(FilterButtonID, isPaging, instanceID)
{
    //#region
    //get the viewID from the filter button ID
    var ViewID = FilterButtonID.split("_")[1];
    refreshList(ViewID, isPaging, instanceID);
    //#endregion
}

function refreshList(ViewID, isPaging, instanceID, behaviour)
{
    //#region
    var actionXml = null;
    var viewTable = null;
    var viewDef = getViewDefinition(ViewID, instanceID);
    if (checkExistsNotEmpty(viewDef))
    {
        var tableId = viewDef.getAttribute("MainTable");

        if (checkExistsNotEmpty(tableId))
        {
            viewTable = document.getElementById(tableId);
            if (checkExists(viewTable))
            {
                if (!isPaging) //button was actually clicked
                {
                    var viewSOID = viewDef.getAttribute("ContextID");
                    var viewContextType = viewDef.getAttribute("ContextType");

                    removeHiddenPropertyCollection(ViewID, viewSOID, "Primary", null, false, true, viewContextType, instanceID, viewSOID, false);
                    viewTable.removeAttribute("PageNumber");
                    viewTable.removeAttribute("HasMorePages");
                    viewTable.removeAttribute("NumberOfPages");
                    viewTable.removeAttribute("OrderByResultName");
                    viewTable.removeAttribute("OrderBy");

                    removeSortingIndicators(viewTable.id);
                    viewTable.setAttribute("Paging", "false");
                }
                else
                {
                    viewTable.setAttribute("Paging", "true");
                }
                actionXml = viewTable.getAttribute("actionxml");
            }
        }
    }

    if (checkExists(actionXml))
    {
        // set listrefreshed attribute so that ListRefresh event can be handled
        viewTable.setAttribute("listrefreshed", "true")

        var currentAction = $sn($xml(actionXml), "Action");

        //instanceid fixes for repeated refreshing (if a list was populated by another instance)
        if (checkExists(currentAction.getAttribute("InstanceID")) && !checkExists(instanceID))
        {
            currentAction.removeAttribute("InstanceID");
        }
        else if (!checkExists(currentAction.getAttribute("InstanceID")) && checkExists(instanceID))
        {
            currentAction.setAttribute("InstanceID", instanceID);
        }
        if (!checkExists(behaviour))
        {
            var masterRuntimeWindow = SourceCode.Forms.Runtime.getMasterRuntimeWindow();
            var newBehaviour = new masterRuntimeWindow.SourceCode.Forms.Runtime.BehaviourEvent({ actions: [currentAction], methodExecuted: "ListRefresh", SourceID: ViewID, SourceType: "View", InstanceID: instanceID, windowToUse: window.self });
            newBehaviour.executeBehaviour();
        }
        else
        {
            executeAction(currentAction, "ListRefresh", null, behaviour);
        }
    }
    else if (checkExists(behaviour))
    {
        behaviour.isExecuting = false;
    }
    //#endregion
}

function refreshListForExportToExcel(options)
{
    options = checkExists(options) ? options : {};

    var actionXml = null;
    var viewTable = options.viewHtml[0];

    if (checkExists(viewTable))
    {
        actionXml = viewTable.getAttribute("actionxml");
    }

    if (checkExists(actionXml))
    {
        var exportToExcelDataToSet = {
            viewId: options.viewId,
            instanceId: options.instanceId,
            data: {
                busyExporting: true,
                pageSize: options.pageSize,
                pageNumber: options.pageNumber
            }
        }

        setExportToExcelData(exportToExcelDataToSet);

        var currentAction = $sn($xml(actionXml), "Action");

        if (checkExists(currentAction.getAttribute("InstanceID")) && !checkExists(options.instanceId))
        {
            currentAction.removeAttribute("InstanceID");
        }
        else if (!checkExists(currentAction.getAttribute("InstanceID")) && checkExists(options.instanceId))
        {
            currentAction.setAttribute("InstanceID", options.instanceId);
        }

        if (!checkExists(options.behaviour))
        {
            var masterRuntimeWindow = SourceCode.Forms.Runtime.getMasterRuntimeWindow();

            var newBehaviour = new masterRuntimeWindow.SourceCode.Forms.Runtime.BehaviourEvent(
                {
                    actions: [currentAction],
                    methodExecuted: "ListRefresh",
                    SourceID: options.viewId,
                    SourceType: "View",
                    InstanceID: options.instanceId,
                    windowToUse: window
                });

            newBehaviour.executeBehaviour();
        }
        else
        {
            executeAction(currentAction, "ListRefresh", null, options.behaviour);
        }
    }
    else if (checkExists(options.behaviour))
    {
        options.behaviour.isExecuting = false;
    }
}

//constructs and returns the filter for the brokerpackage depending on the values specified by the filter and quicksearch
function buildFilterForPackage(ViewID, tableName, jsonObject, instanceID, resultName, windowToUse, loopContextID)
{
    //#region
    var brokerPackageXml;
    var updated = false;
    if (checkExistsNotEmpty(jsonObject.method.filter))
    {
        brokerPackageXml = $xml(jsonObject.method.filter);
    }
    else
    {
        brokerPackageXml = $xml("<Filters/>");
    }

    var tempInstanceID = (checkExists(instanceID)) ? instanceID + "_" : _runtimeEmptyGuid + "_";
    var currentDropdown = document.getElementById(tempInstanceID + ViewID + "_quickSearchDdl");
    var currentTextBox = document.getElementById(tempInstanceID + ViewID + "_quickSearchTxt");
    var filterDropdown = document.getElementById(tempInstanceID + ViewID + "_selectedFilterDdl");

    //get the actual values from the controls
    var fieldID = "";
    var filterValue = "";
    var selectedFilter = "";
    var filterNode = $sn(brokerPackageXml, "Filters");

    var table = document.getElementById(tableName);

    if (checkExists(currentTextBox))
    {
        filterValue = currentTextBox.value;
    }
    if (checkExists(currentDropdown))
    {
        fieldID = $(currentDropdown).dropdown("SelectedValue");
    }
    if (checkExists(filterDropdown))
    {
        selectedFilter = $(filterDropdown).dropdown("SelectedValue");
    }

    if (filterValue.length > 0)
    {
        if (fieldID !== "[All]" && fieldID !== "[AllDisplay]") //search on all property types
        {
            var field = returnFieldAttributeObject(fieldID, instanceID);
            if (checkExists(field))
            {
                var propertyType = field.propertyType;
                var propertyName = field.PropertyName;
                var fieldName = field.name;
                propertyName = getQualifiedResultName(field) + "." + propertyName;

                var bInclude = false;

                switch (propertyType.toLowerCase())
                {
                    case 'number':
                    case 'autonumber':
                        if (filterValue.isNumeric())
                        {
                            bInclude = true;
                        }
                        break;
                    case "decimal":
                        if (filterValue.isFloat())
                        {
                            bInclude = true;
                        }
                        break;
                    case 'yesno':
                        switch (filterValue.toLowerCase())
                        {
                            case "true":
                            case "false":
                            case "yes":
                            case "no":
                            case "0":
                            case "1":
                                bInclude = true;
                                break;
                        }
                        break;
                    default:
                        bInclude = true;
                        break;
                }

                if (bInclude)
                {
                    //construct the quickfilter's filter xml	
                    var filterValueXML = buildQuickFilterXML(propertyType, propertyName, filterValue, brokerPackageXml);
                    filterNode.appendChild(filterValueXML);

                    if (checkExists(table))
                    {
                        table.setAttribute("QFName", propertyName);
                        table.setAttribute("QFValue", filterValue);
                        viewTableDefinitions[table.id] = constructTableDefinition(ViewID, jQuery(table), filterValue, propertyName, instanceID, true);
                    }
                }
                else
                {
                    var errorMsg = Resources.RuntimeMessages.QuickSearchTypeMismatch.replace("{0}", fieldName).replace("{1}", propertyType);
                    showRuntimeException(errorMsg);
                    return false;
                }
            }
        }
        else if (fieldID === "[All]" || fieldID === "[AllDisplay]")//search on all fields or all visible fields
        {
            constructInclusiveFilter(ViewID, brokerPackageXml, filterNode, filterValue, instanceID, fieldID);
        }
    }
    else
    {
        if (checkExists(table))
        {
            var QFName = table.getAttribute("QFName");
            var QFValue = table.getAttribute("QFValue");
            if (checkExists(QFName) && QFName.length > 0 && checkExists(QFValue) && QFValue.length > 0)//check to see if it actually needs to reverify the table definitions
            {
                table.setAttribute("QFName", "");
                table.setAttribute("QFValue", "");

                viewTableDefinitions[tableName] = constructTableDefinition(ViewID, jQuery(table), null, null, instanceID, true);

            }
        }
    }

    //return the selected filter's filter xml
    if (checkExists(selectedFilter) && selectedFilter.length > 0)
    {
        var selfilterValueXML = returnConstructedFilterXML(selectedFilter, ViewID, resultName, windowToUse, loopContextID);
        if (selfilterValueXML && selfilterValueXML.hasChildNodes())
        {
            filterNode.appendChild(selfilterValueXML.cloneNode(true));
        }
        returnConstructedSortingXML(selectedFilter, ViewID, resultName, jsonObject);
    }
    if (filterNode.childNodes.length > 0)
    {
        jsonObject.method.filter = filterNode.xml;
    }

    //#endregion
}

// Filters the hidden view xml based on the brokerpackageXml that would have been sent to the server with an ajax call.
// Paging is only supported if we get the brokerpackage with metadata
// filterXml is the brokerPackageXML, and is in the following format: <brokerpackage><smartobject><method><filter><Filter><And><Equals><Item  .....
// if the filter XML is a sub-part of the brokerPackageXml, specify the filterXmlXPath option
// dataXml is just as it comes from the ViewHiddenHash
// options:
//		reverse - whether or not the reverse the results. The results are stored the wrong way around in the hidden view xml, so it is needed here
//		filterXmlXPath - the XPath used to select the filter from the dataXml. Optional.
function filterListClientSide(brokerPackage, dataFields, options)
{
    var filterXmlXPath = checkExists(options) && checkExists(options.filterXmlXPath) ? options.filterXmlXPath : "Filter";

    var currentPageElement, pageSizeElement;
    if (brokerPackage.metadata)
    {
        currentPageElement = brokerPackage.metadata.pagenumber;
        pageSizeElement = brokerPackage.metadata.pagesize;
    }

    var currentPage = checkExists(currentPageElement) ? parseInt(currentPageElement, 10) : null;
    var pageSize = checkExists(pageSizeElement) ? pageSizeElement : null;

    var filterOperators;
    var filterDoc = brokerPackage.smartobject.method.filter;
    var results = dataFields;
    if (checkExists(filterDoc))
    {
        if (typeof filterDoc === "string")
        {
            filterDoc = $xml(filterDoc);
        }
        var filterNodes = $mn(filterDoc.documentElement, filterXmlXPath);

        if (checkExists(filterNodes) && filterNodes.length > 0)
        {
            filterOperators = filterNodes[0].childNodes;

            results = filterBasedOnAllOperators(dataFields,
                {
                    currentBrokerOperatorNodes: filterOperators
                });
        }
    }

    // items in the hidden Views are in the wrong order. We will reverse it as part of this
    var resultCollection = { collection: [] };

    var startpoint = 0;
    var endpoint = results.length;
    if (checkExists(pageSize) && !isNaN(pageSize) && checkExists(currentPage) && !isNaN(currentPage))
    {
        endpoint = currentPage * pageSize;
        startpoint = endpoint - pageSize;

        endpoint = endpoint < results.length ? endpoint : results.length;
        startpoint = startpoint >= 0 ? startpoint : 0;

        if (endpoint >= results.length)
        {
            endpoint = results.length;
            resultCollection.HasMorePages = false; // the picker, the only control to use client side filtering and paging, assumes it "true" by default.
        }
    }

    if (checkExists(results) && results.length > 0)
    {
        if (checkExists(options) && options.reverse === true)
        {
            for (k = endpoint - 1; k >= startpoint; k--) // use endpoint - 1 because of 0 based index
            {
                resultCollection.collection.push(results[k]);
            }
        }
        else
        {
            for (k = startpoint; k < endpoint; k++) // use endpoint - 1 because of 0 based index
            {
                resultCollection.collection.push(results[k]);
            }
        }
    }

    return resultCollection;
}

// takes an array of xml nodes and filters them based on the operation in the current broker operation node.
// It will recursively handle additional optional combination operator like AND and OR
// sample usage:
//	results = filterBasedOnAllOperators(xmlNodes, {				// e.g. [<object><fields>...</fields></object>, <object><fields>...</fields></object>]
//		currentBrokerOperatorNodes: filterOperators,			// e.g. <And><Equals><Item> .... </item></Equals></And> or <Equals><Item .... </item></Equals>
//		combinationOperation: "equals"							// optional if available. Used mainly for recursion. THIS IS EXPECTED TO BE LOWERCASE
//	});
function filterBasedOnAllOperators(dataFields, options)
{
    if (!checkExists(dataFields)) throw "dataFields array is null";
    if (!checkExists(options.currentBrokerOperatorNodes)) throw "currentBrokerOperatorNodes not specified";

    var combinationOperation = options.combinationOperation;
    // if we don't have a combination operation, we use AND.
    if (!checkExistsNotEmpty(combinationOperation))
    {
        combinationOperation = "and";
    }

    var results = [];
    var internalResults = [];
    var hasAtLeastOneSet = false;

    // loop through all the operators and filter the dataFields for each operation.
    // If its an AND or OR, call this method recursively to get to the meaty inner proper operators
    for (var x = 0; x < options.currentBrokerOperatorNodes.length; x++)
    {
        var operation = options.currentBrokerOperatorNodes[x].nodeName;
        var operationLowerCase = operation.toLowerCase();

        if (operationLowerCase === "and" || operationLowerCase === "or")
        {
            combinationOperation = operationLowerCase;

            internalResults = filterBasedOnAllOperators(dataFields, {
                currentBrokerOperatorNodes: options.currentBrokerOperatorNodes[x].childNodes,
                combinationOperation: operationLowerCase
            });
        }
        else
        {
            var objectProperty;
            var objPropElement = $sn(options.currentBrokerOperatorNodes[x], "Item[@SourceType ='ObjectProperty']");
            var item = $sn(options.currentBrokerOperatorNodes[x], "Item[@SourceType ='Value']");

            var itemValue = "";
            if (checkExists(item))
            {
                itemValue = returnItemValue(item);
            }

            if (!checkExistsNotEmpty(objPropElement) || !checkExistsNotEmpty(objPropElement.text)) // this sometimes go missing. Bug in the rule designer. It should be fixed by the time 4.6.9 is released
            {
                var sourceID = objPropElement.getAttribute("SourceID");
                if (checkExistsNotEmpty(sourceID) && sourceID.contains("."))	// BUT! After the view has been cloned, the filter xml format changes.
                {																// The Object property is no longer in the text node. Get it from the sourceID
                    objectProperty = sourceID.substr(sourceID.indexOf(".") + 1);
                }

                if (!checkExistsNotEmpty(objectProperty))
                {
                    throw "No object property specified. Please recreate the rule.";
                }
            }
            else
            {
                objectProperty = objPropElement.text;
            }

            internalResults = filterForSingleOperator(dataFields, {
                objectProperty: objectProperty,
                value: itemValue,
                operation: operation
            });


        }

        if (hasAtLeastOneSet) // we can't merge with an empty array, otherwise we will never have anything if we AND
        {
            results = mergeFilterResultSets(results, internalResults, options.combinationOperation);
        }
        else
        {
            results = internalResults;
            hasAtLeastOneSet = true;
        }
    }

    return results;
}

// Take two xml node arrays and AND or OR them.
// We use the counter attribute as the unique key. It will BREAK without it.
// It will also break for duplicate counters. Be sure to filter by smoId before calling this function.

// sample usage:
// var results = mergeFilterResultSets([<object><fields>...</fields></object>, <object><fields>...</fields></object>], 
//     [<object><fields>...</fields></object>, <object><fields>...</fields></object>], 
//     "And");
function mergeFilterResultSets(set1, set2, combinationOperator)
{
    if (checkExists(combinationOperator))
    {
        combinationOperator = combinationOperator.toLowerCase();
    }

    var results = [];
    // the AND filter should order results correctly by itself. 
    if (combinationOperator === "and")
    {
        for (var k = 0; k < set1.length; k++)
        {
            var set1Counter = set1[k].counter;

            for (var n = 0; n < set2.length; n++)
            {
                var set2Counter = set2[n].counter;

                // if the entry is in both sets, add to results.
                if (set1Counter === set2Counter)
                {
                    results.push(set2.splice(n, 1)[0]); // add item to results, and remove from the source list
                    break;
                }
            }
        }
    }
    // to make sure the sorting is correct for the OR, we assume that the two sets are in the correct order.
    // get the first element of each, and add the one with the largest counter. Rinse and repeat.
    else if (combinationOperator === "or")
    {
        var itemFromSet1 = null;
        var itemFromSet2 = null;

        while (set1.length > 0 || set2.length > 0 || checkExists(itemFromSet1) || checkExists(itemFromSet2))
        {
            if (!checkExists(itemFromSet1))
            {
                itemFromSet1 = set1.shift();
            }

            if (!checkExists(itemFromSet2))
            {
                itemFromSet2 = set2.shift();
            }

            var counter1 = -1;
            var counter2 = -1;

            // the shift will be undefined if the array was empty, so check again
            if (checkExists(itemFromSet1))
            {
                counter1 = itemFromSet1.counter;
            }

            if (checkExists(itemFromSet2))
            {
                counter2 = itemFromSet2.counter;
            }

            if (counter1 !== -1 && counter2 !== -1) // At this stage we know that both still have items. We can do the comparison
            {
                // If we got a counter thats not numerical, then we deserve errors
                counter1 = parseInt(counter1);
                counter2 = parseInt(counter2);

                if (counter1 === NaN || counter2 === NaN) throw "Counter is NaN. Result from server is corrupt.";

                if (counter1 < counter2)
                {
                    results.push(itemFromSet1);
                    itemFromSet1 = null; // set it to null so that we will get a new from Set1
                }
                else if (counter2 < counter1)
                {
                    results.push(itemFromSet2)
                    itemFromSet2 = null;
                }
                else if (counter1 === counter2) // samme item, so push one and reset both
                {
                    results.push(itemFromSet1);
                    itemFromSet1 = null;
                    itemFromSet2 = null;
                }
            }
            else // this means that one of the lists is empty. Find out which one, and push the item from the other
            {
                if (counter1 === -1)
                {
                    results.push(itemFromSet2);
                    itemFromSet2 = null;
                }
                else
                {
                    results.push(itemFromSet1);
                    itemFromSet1 = null;
                }
            }
        }
    }

    return results;
}

// sample usage
//resultset = filterForSingleOperator(xmlNodes, { // in the format [<object><fields>...</fields></object>, <object><fields>...</fields></object>]
//	objectProperty: 'Continent',
//	value: '4',
//	operation: 'Equals' - Should be capitalized because calculateExpressionValue expects capitalised values.
//});

// assume dataFields contains only the items with the correct smo ID
function filterForSingleOperator(dataFields, options)
{
    if (!checkExists(dataFields)) throw "dataFields array is null";
    if (!checkExists(options.value)) throw "No value specified";
    if (!checkExists(options.objectProperty)) throw "No objectProperty specified";
    if (!checkExists(options.operation)) throw "No operation specified";

    var resultNodes = [];

    for (var k = 0; k < dataFields.length; k++)
    {
        var valueNode = dataFields[k].fields[options.objectProperty];
        var value = checkExists(valueNode) ? valueNode.value : "";

        var add = calculateExpressionValue(options.operation, [value, options.value]);

        if (add)
        {
            resultNodes.push(dataFields[k]);
        }
    }

    return resultNodes;
}

//constructs an inclusive filter -when the "ALL"/"ALL DISPLAY" option is selected
function constructInclusiveFilter(ViewID, brokerPackageXML, filterNode, filterValue, instanceID, QFName)
{
    //#region
    var fieldArray = null;
    switch (QFName)
    {
        case "[AllDisplay]":
            var returnFieldsForFilteringObject =
            {
                viewID: ViewID,
                instanceID: instanceID,
                testVisible: true,
                sorted: true
            }
            fieldArray = returnFieldsForFiltering(returnFieldsForFilteringObject);
            break;
        case "[All]":
            var listSectionID = (checkExists(instanceID)) ? instanceID + "_" + ViewID : _runtimeEmptyGuid + "_" + ViewID;
            fieldArray = runtimeFilterFields[listSectionID];
            break;
    }
    if (checkExists(fieldArray))
    {
        var f = fieldArray.length;
        while (f--)
        {
            var field = fieldArray[f];
            var propertyType = $sn(field, "PropertyType").text;
            var propertyName = $sn(field, "PropertyName").text;
            var bInclude = false;

            //#region
            switch (propertyType.toLowerCase())
            {
                case 'number':
                case 'autonumber':
                    if (filterValue.isNumeric())
                    {
                        bInclude = true;
                    }
                    break;
                case 'decimal':
                    if ((filterValue.isNumeric()) || (filterValue.isFloat()))
                    {
                        bInclude = true;
                    }
                    break;
                case 'yesno':
                    switch (filterValue.toLowerCase())
                    {
                        case "true":
                        case "false":
                        case "yes":
                        case "no":
                        case "0":
                        case "1":
                            bInclude = true;
                            break;
                    }
                    break;
                case 'datetime':
                    break;
                case 'file':
                case 'image':
                    bInclude = true;
                    break;
                default:
                    bInclude = true;
                    break;
            }
            //#endregion
            if (checkExists(filterNode))
            {
                if (bInclude)
                {
                    propertyName = getQualifiedResultName(field, true) + "." + propertyName;
                    QFName += propertyName.toLowerCase() + "|";
                    var filterValueXML = buildQuickFilterXML(propertyType, propertyName, filterValue, brokerPackageXML);
                    var quickFilterNode = $sn(filterNode, "Filter[@Type='QuickFilter']");
                    if (checkExists(quickFilterNode))
                    {
                        var or = brokerPackageXML.createElement("or");
                        or.appendChild(quickFilterNode.childNodes[0]);
                        or.appendChild(filterValueXML.childNodes[0]);
                        quickFilterNode.appendChild(or);
                    }
                    else
                    {
                        filterNode.appendChild(filterValueXML);
                    }
                }
            }
        }
    }

    var mainTable = getViewMainTable(ViewID, instanceID);
    if (checkExistsNotEmpty(mainTable))
    {
        var table = document.getElementById(mainTable);
        if (checkExists(table))
        {
            var previousQF = table.getAttribute("QFName");
            var previousQFValue = table.getAttribute("QFValue");
            table.setAttribute("QFName", QFName);
            table.setAttribute("QFValue", filterValue);

            if (QFName !== previousQF || filterValue !== previousQFValue)
            {
                viewTableDefinitions[mainTable] = constructTableDefinition(ViewID, jQuery(table), filterValue, QFName, instanceID, true);
            }
        }
    }
    //#endregion
}

var _runtimeFieldCellsHash = new SFRuntimeHash();
//helper function to return fields for filtering
function returnFieldsForFiltering(o)
{
    //#region
    var fieldArray = [];
    var viewID = o.viewID;
    var instanceID = o.instanceID;
    var viewDefinition = o.viewDefinition;
    if (!checkExists(viewDefinition))
    {
        viewDefinition = returnCurrentViewXML(viewID, instanceID)
        if (!checkExists(viewDefinition))
        {
            return fieldArray;
        }
    }
    var testVisible = o.testVisible;
    var sorted = o.sorted;

    var controlFieldXPath = "Controls/Control[(@FieldID)][@ControlTemplate='display']";
    var controlFields = $mn(viewDefinition, controlFieldXPath);

    var f = controlFields.length;
    var filteredGrid = null;

    if (f > 0)
    {
        var controllerNode = controlFields[0].parentNode.parentNode;
        var controllerNodeMainTable = controllerNode.getAttribute("MainTable");
        if (!checkExists(instanceID))
        {
            instanceID = controllerNode.getAttribute("InstanceID");
        }
        if (!checkExists(viewID))
        {
            viewID = controllerNode.getAttribute("ID");
        }
        if (checkExists(controllerNodeMainTable))
        {
            filteredGrid = jQuery(document.getElementById(controllerNodeMainTable));
        }
    }

    while (f--)
    {
        var controlID = controlFields[f].getAttribute("ID");
        var fieldID = controlFields[f].getAttribute("FieldID");
        var fieldColumnIndex = controlFields[f].getAttribute("ColumnIndex");
        var include = true;
        var columnIndex = -1;
        if (testVisible === true)
        {
            var keys = [viewID, instanceID, fieldID];
            var cell = _runtimeFieldCellsHash.get(keys);
            if (!checkExists(cell))
            {
                var control = jQuery(document.getElementById(controlID));
                if (control.length === 0)
                {
                    if (filteredGrid !== null && filteredGrid.length > 0)
                    {
                        control = filteredGrid.find(".grid-display-templates-table .grid-content-cell-wrapper").find("*[id*=" + controlID + "]").first();
                    }
                }
                if (control.length !== 0)
                {
                    cell = control.closest("td");
                }
                _runtimeFieldCellsHash.add(keys, cell);
            }
            if (checkExists(cell) && cell.length > 0)
            {
                include = !cell.hasClass("hidden"); //test the visibility of the column
                columnIndex = cell.index();	//get the index of the column (used for sorting purposes in quick search dropdown)
            }
        }
        if (include)
        {
            var fieldXPath = "Fields/Field[@ID='" + fieldID + "']";
            var field = $sn(viewDefinition, fieldXPath);
            if (checkExists(field))
            {
                var propertyName = $sn(field, "PropertyName").text;
                var propertyType = $sn(field, "PropertyType").text;
                var displayName = "";

                var headerControlXPath = "Controls/Control[(@ColumnIndex='" + fieldColumnIndex + "')][@ControlTemplate='header']/Properties/Property[Name/text()='Text']/Value";
                var headerControlText = $sn(viewDefinition, headerControlXPath);
                if (checkExists(headerControlText) && headerControlText.text.length > 0)
                {
                    displayName = headerControlText.text;
                } 

                var fieldAssociations = new dataSourceLookup({ xmlDoc: viewDefinition, includeControllers: false, includeController: false, selectMultiple: true, sourceControlID: controlID, originalProperty: propertyName, controlDisplayTemplate: "true" }).getDataSource();
                var z = fieldAssociations.length;
                if (z > 0)  //associations
                {
                    while (z--)
                    {
                        var fieldAssociation = fieldAssociations[z];
                        var originalSOID = fieldAssociation.getAttribute("AssociationSO");
                        var displayTemplate = fieldAssociation.getAttribute("DisplayTemplate");
                        var contextID = fieldAssociation.getAttribute("ContextID");
                        var contextType = fieldAssociation.getAttribute("ContextType");
                        var actualDisplayProperties = returnAllDisplayPropertiesFromTemplate(displayTemplate); //changed to allow for displaytemplate values
                        var a = actualDisplayProperties.length;
                        while (a--)
                        {
                            var actualDisplayProperty = actualDisplayProperties[a];
                            var displaySOID = fieldAssociation.getAttribute("DisplaySO");
                            var associatedField = null;
                            if (displaySOID)
                            {
                                associatedField = $sn(viewDefinition, "Fields/Field[@ObjectID='" + displaySOID + "'][PropertyName/text()='" + actualDisplayProperty + "']");
                            }
                            else
                            {
                                associatedField = $sn(viewDefinition, "Fields/Field[@ObjectID='" + originalSOID + "'][PropertyName/text()='" + actualDisplayProperty + "'][@ContextType='" + contextType + "'][@ContextID='" + contextID + "']");
                            }
                            if (checkExists(associatedField))
                            {
                                //single display property - attempt to use the column control's text for the display name, else the friendlier displaynames of all display properties will be used
                                if (actualDisplayProperties.length === 1)
                                {
                                    associatedField.setAttribute("DisplayName", displayName);
                                }
                                else
                                {
                                    var replacedName = $sn(associatedField, "Name").text.replace(".", " ");//replacing . in field name for multi association fields
                                    associatedField.setAttribute("DisplayName", replacedName);
                                }
                                associatedField.setAttribute("ColumnIndex", columnIndex);
                                associatedField.setAttribute("PropertyType", propertyType);
                                fieldArray.push(associatedField);
                            }
                        }
                    }
                }
                else
                {
                    field.setAttribute("DisplayName", displayName);
                    field.setAttribute("ColumnIndex", columnIndex);
                    field.setAttribute("PropertyType", propertyType);
                    fieldArray.push(field);
                }
            }
        }
    }

    //TFS 850369 - Sort Quick Search fields by columnindex as integer not character
    if (sorted)//sort the field array according to the index of the column controls
    {
        fieldArray.sort(function (a, b)
        {
            var numberA = parseInt(a.getAttribute("ColumnIndex"), 10);
            var numberB = parseInt(b.getAttribute("ColumnIndex"), 10);
            return numberA === numberB ? 0 : numberA > numberB ? -1 : 1;
        });
    }
    return fieldArray;
    //#endregion
}

//inspect the "ViewFilters" control for the selected View's filters and return the correctly replaced filtervalue
function returnConstructedFilterXML(selectedFilter, ViewID, resultName, windowToUse, loopContextID)
{
    //#region
    var xmlDoc = $xml(__persistedFiltersDefinition);
    var xPath = "Views/View[@ID=" + ViewID.xpathValueEncode() + "]/ViewFilterCriteria/FilterCriteria[@name=" + selectedFilter.xpathValueEncode() + "]/Filter";
    var FilterValue = $sn(xmlDoc, xPath);
    FilterValue = inspectAndReplaceFilterXml(FilterValue, xmlDoc, resultName, windowToUse, loopContextID);
    return FilterValue;
    //#endregion
}

//inspect the "ViewFilters" and return the correctly formatted sorting values
function returnConstructedSortingXML(selectedFilter, ViewID, resultName, jsonObject)
{
    var xmlDoc = $xml(__persistedFiltersDefinition);
    var xPath = "Views/View[@ID=" + ViewID.xpathValueEncode() + "]/ViewFilterCriteria/FilterCriteria[@name=" + selectedFilter.xpathValueEncode() + "]/Sorters";
    var FilterValue = $sn(xmlDoc, xPath);
    if (checkExists(FilterValue))
    {
        inspectAndReplaceSortingXml(FilterValue, jsonObject, resultName);
    }
}

function constructSortingStructure(jsonObject, orderBy, orderByResultName, orderDirection)
{
    var sorters;
    var sorter;
    if (checkExists(jsonObject) && checkExists(jsonObject.method))
    {
        sorters = jsonObject.method.sorters;
    }

    if (!checkExists(sorters))
    {
        sorters = [];
    }
    else
    {
        var comparisonObj =
        {
            OrderBy: orderBy,
            OrderByResultName: orderByResultName,
        }
        sorter = sorters.filter(__runtimeJsonFilterMatchingItems, comparisonObj);
    }
    if (!checkExists(sorter) || sorter.length === 0)
    {
        sorter = {};

        sorter.OrderBy = orderBy;
        sorter.OrderByResultName = orderByResultName;
        sorter.Direction = orderDirection;
        sorters.unshift(sorter);
    }
    else
    {
        var sorterObj = sorter[0];
        if (sorters.length > 1)
        {
            //this sorter already exists, but the orderdirection might differ, 
            //and it should now move up in the stack to get preference
            var si = sorters.indexOf(sorterObj);
            sorters.splice(si, 1);
            sorters.unshift(sorterObj);
        }
        sorterObj.Direction = orderDirection;
    }
    if (checkExists(jsonObject) && checkExists(jsonObject.method))
    {
        jsonObject.method.sorters = sorters;
    }
}

//transform to correct syntax if it differs from the expected (TreeNodeId is a guid, not the complete propertyname), also replace system variables
function inspectAndReplaceFilterXml(filterNode, xmlDoc, resultName, windowToUse, loopContextID)
{
    //#region
    var xPath = null;
    var relevantNodes = null;
    var r = 0;
    if (checkExists(filterNode))
    {
        xPath = ".//Item[@SourceType='ObjectProperty'][not(@FullSourceID)]";
        //on listrefresh/paging, when field id was previously mapped and translated to object property, the full source id was already implemented, no need to adapt
        //surfaced with associations but this is a more general fix (bug 475406/570928)
        relevantNodes = $mn(filterNode, xPath);
        r = relevantNodes.length;
        while (r--)
        {
            var propertyName = relevantNodes[r].getAttribute("SourceID");
            if (propertyName.indexOf(resultName + ".") === -1) //stop the duplicate population of the object property structure
            {
                var fullName = resultName + "." + propertyName;
                relevantNodes[r].setAttribute("SourceID", fullName);
                relevantNodes[r].setAttribute("SourceType", "ObjectProperty");
                relevantNodes[r].setAttribute("FullSourceID", "true");//indicates that full sourceID is available for lookup so that it does not try to resolve again
            }
        }

        xPath = ".//Item[@SourceType='Value'][(SourceValue/Item) or (OriginalValue/SourceValue)]";
        relevantNodes = $mn(filterNode, xPath);
        r = relevantNodes.length;
        while (r--)
        {
            var sourceValue = null;
            var hasOriginalValue = true;
            var selectionNode = $sn(relevantNodes[r], "OriginalValue");
            if (!checkExists(selectionNode))
            {
                selectionNode = relevantNodes[r];
                hasOriginalValue = false;
            }
            sourceValue = windowToUse.returnSourceValue({ item: selectionNode, returnNulls: true, loopContextID: loopContextID });

            var sourceCouldNotBeFound = false;

            if (!checkExists(sourceValue))
            {
                sourceCouldNotBeFound = true;
                sourceValue = "";
            }

            if (!hasOriginalValue)
            {
                var originalValueNode = xmlDoc.createElement("OriginalValue");
                relevantNodes[r].appendChild(originalValueNode);
                originalValueNode.appendChild($sn(selectionNode, "SourceValue"));
            }
            else
            {
                relevantNodes[r].removeChild($sn(relevantNodes[r], "SourceValue"));
            }

            var sourceValueNode = xmlDoc.createElement("SourceValue");
            relevantNodes[r].appendChild(sourceValueNode);
            var textValue = xmlDoc.createTextNode(sourceValue);
            sourceValueNode.appendChild(textValue);
        }

        xPath = ".//Item[@SourceType='ViewField']";
        relevantNodes = $mn(filterNode, xPath);
        r = relevantNodes.length;
        while (r--)
        {
            var fieldID = relevantNodes[r].getAttribute("SourceID");
            var field = $sn(viewControllerDefinition, "Controllers/Controller/Fields/Field[@ID='" + fieldID + "']");
            if (checkExists(field))
            {
                var propertyNameField = $sn(field, "PropertyName").text;
                var fieldResultName = getQualifiedResultName(field, true);
                var parentnode = relevantNodes[r].parentNode;
                var itemNode;

                // HACK: Added for beta 2 to handle incorrect context types
                var resolved = false;
                if (fieldResultName !== resultName)
                {
                    //the scenario where other views' values are used to manipulate the filter - they need to be resolved, can not be used in property comparison otherwise
                    var returnValue = windowToUse.returnSourceValue({ item: relevantNodes[r], loopContextID: loopContextID });
                    if (checkExists(returnValue) && returnValue !== "")
                    {
                        resolved = true;

                        itemNode = xmlDoc.createElement("Item");
                        itemNode.setAttribute("SourceType", "Value");
                        itemNode.setAttribute("DataType", checkExists(relevantNodes[r].getAttribute("DataType")) ? relevantNodes[r].getAttribute("DataType") : "Text");
                        var sourceValueNodeField = xmlDoc.createElement("SourceValue");
                        itemNode.appendChild(sourceValueNodeField);
                        var textValueField = xmlDoc.createTextNode(returnValue);
                        sourceValueNodeField.appendChild(textValueField);

                        parentnode.replaceChild(itemNode, relevantNodes[r]);
                    }
                }
                //else
                if (!resolved)
                {
                    var fullNameUnresolved = fieldResultName + "." + propertyNameField;

                    relevantNodes[r].setAttribute("SourceID", fullNameUnresolved);
                    relevantNodes[r].setAttribute("SourceType", "ObjectProperty");
                    relevantNodes[r].setAttribute("FullSourceID", "true");//indicates that full sourceID is available for lookup so that it does not try to resolve again
                    itemNode = relevantNodes[r].cloneNode(true);
                    parentnode.replaceChild(itemNode, relevantNodes[r]);
                }
                if (parentnode.tagName === "SourceValue" && parentnode.childNodes.length === 1)
                {
                    while (parentnode.tagName !== "Item")
                    {
                        parentnode = parentnode.parentNode;
                    }
                    if (parentnode.tagName === "Item" && parentnode.getAttribute("SourceType") === "Value")
                    {
                        parentnode.parentNode.replaceChild(itemNode, parentnode);
                    }
                }
            }
        }
        xPath = ".//Item[(@SourceType='SystemVariable') or (@SourceType='Control') or (@SourceType='ViewParameter') or (@SourceType='FormParameter') or (@SourceType='Expression') or (@SourceType='ControlProperty') or (@SourceType='EnvironmentField')]";
        relevantNodes = $mn(filterNode, xPath);
        r = relevantNodes.length;
        while (r--)
        {
            var returnValueOther = returnSourceValue({ item: relevantNodes[r], loopContextID: loopContextID });
            var parentnodeOther = relevantNodes[r].parentNode;
            var itemNodeOther = xmlDoc.createElement("Item");
            itemNodeOther.setAttribute("SourceType", "Value");
            itemNodeOther.setAttribute("DataType", checkExists(relevantNodes[r].getAttribute("DataType")) ? relevantNodes[r].getAttribute("DataType") : "Text");
            var sourceValueNodeOther = xmlDoc.createElement("SourceValue");
            itemNodeOther.appendChild(sourceValueNodeOther);
            var textValueOther = xmlDoc.createTextNode(returnValueOther);
            sourceValueNodeOther.appendChild(textValueOther);
            parentnodeOther.replaceChild(itemNodeOther, relevantNodes[r]);

            if (parentnodeOther.tagName === "SourceValue" && parentnodeOther.childNodes.length === 1)
            {
                while (parentnodeOther.tagName !== "Item")
                {
                    parentnodeOther = parentnodeOther.parentNode;
                }
                if (parentnodeOther.tagName === "Item" && parentnodeOther.getAttribute("SourceType") === "Value")
                {
                    parentnodeOther.parentNode.replaceChild(itemNodeOther, parentnodeOther);
                }
            }
        }
    }
    return filterNode;
    //#endregion
}

function inspectAndReplaceSortingXml(sortValue, jsonObject, resultName)
{
    //#region
    if (checkExists(sortValue))
    {
        var xPath = ".//Sorter[@SourceType='ViewField']";
        var relevantNodes = $mn(sortValue, xPath);
        var r = relevantNodes.length;
        while (r--)
        {
            var fieldID = relevantNodes[r].getAttribute("SourceID");
            var FO = returnFieldAttributeObject(fieldID);
            var propertyNameField = FO.PropertyName;
            var orderByResultName = getQualifiedResultName(FO);
            relevantNodes[r].setAttribute("OrderByResultName", orderByResultName);
            relevantNodes[r].setAttribute("OrderBy", propertyNameField);
        }

        xPath = ".//Sorter[@SourceType='ObjectProperty']";
        relevantNodes = $mn(sortValue, xPath);
        r = relevantNodes.length;
        while (r--)
        {
            var propertyName = relevantNodes[r].getAttribute("SourceID");
            relevantNodes[r].setAttribute("OrderByResultName", resultName);
            relevantNodes[r].setAttribute("OrderBy", propertyName);
        }

        var currentSorters = $mn(sortValue, "Sorter");
        var c = currentSorters.length;
        while (c--)
        {
            var currentSorter = currentSorters[c];
            var orderBy = currentSorter.getAttribute("OrderBy");
            var orderByResultName = currentSorter.getAttribute("OrderByResultName");
            var orderDirection = currentSorter.getAttribute("Direction");
            constructSortingStructure(jsonObject, orderBy, orderByResultName, orderDirection);
        }
    }
    //#endregion
}

//builds the quick filter xml according to the selections made in the quick search section
function buildQuickFilterXML(propertyType, propertyName, quickFilterValue, brokerPackageXML)
{
    //#region
    var xmlFilter = null;
    if (quickFilterValue !== "")
    {
        var operator = "";

        switch (propertyType.toLowerCase())
        {
            case 'number':
            case 'decimal':
            case 'autonumber':
            case 'yesno':
                operator = "equals";
                break;
            default:
                operator = "contains";
                break;

        }
        xmlFilter = FilterBuildLeftRight(propertyName, quickFilterValue, operator, brokerPackageXML);
    }
    return xmlFilter;
    //#endregion
}

//used to construct the left and right sections of the logical filter of the quick search
function FilterBuildLeftRight(propertyName, propertyValue, operator, brokerPackageXML)
{
    //#region
    var filter = brokerPackageXML.createElement("Filter");
    filter.setAttribute("Type", "QuickFilter");
    var equal = brokerPackageXML.createElement(operator);
    filter.appendChild(equal);

    var leftItem = brokerPackageXML.createElement("Item");
    leftItem.setAttribute("SourceType", "ObjectProperty");
    leftItem.setAttribute("SourceID", propertyName);
    equal.appendChild(leftItem);

    var rightItem = brokerPackageXML.createElement("Item");
    rightItem.setAttribute("SourceType", "Value");
    //data	type not needed to be set, it will be evaluated from the property (logic was previously adapted for other filter implementation types - from definition/rules/advanced filter)
    var sourceValueNode = brokerPackageXML.createElement("SourceValue");
    rightItem.appendChild(sourceValueNode);
    sourceValueNode.appendChild(brokerPackageXML.createTextNode(propertyValue));
    equal.appendChild(rightItem);

    return filter;
    //#endregion
}

//calculates and populates paging controls for the list view
function populatePagingControls(mainTable, pageSize, pageNumber, numberOfPages, hasMorePages, hasRowCount, resetPageNumber)
{
    //#region

    var tableID = mainTable.id;
    if (checkExists(pageNumber))
    {
        mainTable.setAttribute("PageNumber", pageNumber);
    }
    if (checkExists(pageSize))
    {
        mainTable.setAttribute("PageSize", pageSize);
    }

    var jqMainTable = jQuery("#" + tableID);
    if (checkExists(pageNumber))
    {
        SFRGrid.execute({ element: jqMainTable, fn: "option", params: ["page", pageNumber] });
    }

    var bRowCount = (hasRowCount === "true");
    SFRGrid.execute({ element: jqMainTable, fn: "option", params: ["hasrowcount", bRowCount] });

    mainTable.setAttribute("HasRowCount", bRowCount.toString());
    if (checkExists(hasMorePages))
    {
        mainTable.setAttribute("HasMorePages", hasMorePages);
        SFRGrid.execute({ element: jqMainTable, fn: "option", params: ["hasmorepages", (hasMorePages === "true")] });
    }
    else
    {
        SFRGrid.execute({ element: jqMainTable, fn: "option", params: ["hasmorepages", true] });
    }

    if (checkExists(numberOfPages))
    {
        mainTable.setAttribute("NumberOfPages", numberOfPages);
        SFRGrid.execute({ element: jqMainTable, fn: "option", params: ["totalpages", numberOfPages] });
    }
    if (resetPageNumber === "true")
    {
        //the page originally specified was not found, so the last page was loaded
        jQuery("#" + tableID + "_pagingtxtbox").val(pageNumber);
    }

    //#endregion
}

//do actual paging
function doPaging(direction, originalPageNumber, mainTable, maxPages, loopContextID)
{
    //#region
    var pageNumber = originalPageNumber;
    var normalTable = mainTable[0];
    var tableID = normalTable.getAttribute("ID");
    var numberOfPages = normalTable.getAttribute("NumberOfPages");

    switch (direction)
    {
        case "start":
        case "first":
            pageNumber = 1;
            break;
        case "previous":
            pageNumber--;
            break;
        case "next":
            pageNumber++;
            break;
        case "end":
        case "last":
            pageNumber = numberOfPages;
            break;
        default:
            pageNumber = direction;
            break;
    }

    var previouslySet = normalTable.getAttribute("PageNumber");
    if (previouslySet === pageNumber.toString())
    {
        //this is to limit duplicate paging logic with the exact same parameters
        //under certain circumstances the grid fired the eventing logic in succession (keypress/lost focus)
        return;
    }
    var viewInstanceInfo = new getMainTableViewInformation(tableID);
    var viewID = viewInstanceInfo.viewID;
    var instanceID = viewInstanceInfo.instanceID;
    var controlInstanceID = (checkExists(instanceID)) ? instanceID : _runtimeEmptyGuid;
    var FilterButtonID = controlInstanceID + "_" + viewID + "_quickSearchBtn";

    //Do clear seletion of grid row to prevent filter issue for Bug 863796
    mainTable.grid("deselect");
    if (checkExists(pageNumber) && pageNumber.toString().length > 0)
    {
        //do actual paging execution
        normalTable.setAttribute("PageNumber", pageNumber);
        var result = verifyRecordsForPage(viewID, pageNumber.toString(), instanceID);
        if (result === 0)
        {
            //no data available - have to get it from the server
            BuildFilterEventAction(FilterButtonID, true, instanceID);
        }
        else
        {
            if (parseInt(pageNumber, 10) !== parseInt(originalPageNumber, 10)) //only refresh UI if necessary
            {
                var pageSize = normalTable.getAttribute("PageSize");
                var hasMorePages = (maxPages !== false) ? "true" : "false";
                var hasRowCount = normalTable.getAttribute("HasRowCount");
                //already have the data - just get it from the hiddens
                var Incxml = getCombinedHiddenPropertyCollection(viewID, null, null, pageNumber.toString(), null, null, null, null, null, instanceID);
                populatePagingControls(normalTable, pageSize, pageNumber, numberOfPages, hasMorePages, hasRowCount);
                rebuildTable(tableID, viewID, instanceID, false, false, null, Incxml, true, pageNumber, loopContextID, false);
            }
        }
    }
    else
    {
        SFRGrid.execute({ element: mainTable, fn: "option", params: ["page", 1] });
        normalTable.setAttribute("PageNumber", 1);
        BuildFilterEventAction(FilterButtonID, true, instanceID);
    }
    //#endregion
}

/* simple function to remove all sorting indicators for the current table (used in list view) */
function removeSortingIndicators(tableID)
{
    //#region
    jQuery("#" + tableID).find(".grid-column-header-table").children("tbody").children("tr").children("td").children(".grid-column-header-cell").removeClass("asc").removeClass("desc");
    //#endregion
}

/* custom sorting functionality for the grid */
function gridCustomSorting(col, reverse, objTable)
{
    //#region
    if (checkExists(objTable))
    {
        var displayTemplateRow = SFRGrid.execute({ element: objTable, fn: "fetch", params: ["display-template-row"] });
        var controlID = checkExists(displayTemplateRow) ? displayTemplateRow.find("td .grid-content-cell-wrapper")[col].children[0].getAttribute("ID") : "";
        controlID = getActualControlID(controlID);

        var normalTable = objTable[0];
        var viewInstanceInfo = new getMainTableViewInformation(normalTable.id);
        var viewID = viewInstanceInfo.viewID;
        var instanceID = viewInstanceInfo.instanceID;

        var controlDef = checkExistsNotEmpty(controlID) ? controlInformationObject(controlID) : null;
        if (checkExists(controlDef))
        {
            var fieldname = controlDef.qualifiedName;
            runtimeBusyView(viewID, true, true, instanceID);
            var sort = (reverse) ? "descending" : "ascending";

            var pageSize = normalTable.getAttribute("PageSize");
            if (checkExists(pageSize) && pageSize.length > 0)
            {
                normalTable.setAttribute("OrderByResultName", controlDef.resultName);
                normalTable.setAttribute("OrderBy", fieldname.split('.')[1]);
                normalTable.setAttribute("OrderDirection", sort);
            }
            var numberOfPages = normalTable.getAttribute("NumberOfPages");
            var hasMorePages = normalTable.getAttribute("HasMorePages");
            if (checkExists(numberOfPages) && numberOfPages.toString().length > 0)
            {
                numberOfPages = parseInt(numberOfPages, 10);
            }
            else
            {
                numberOfPages = 1;
            }
            if (checkExists(pageSize) && pageSize.length > 0 && (numberOfPages > 1 || (checkExists(hasMorePages) && hasMorePages === "true")))
            {
                normalTable.removeAttribute("PageNumber");
                normalTable.removeAttribute("HasMorePages");
                normalTable.removeAttribute("NumberOfPages");
                removeHiddenPropertyCollection(viewID, null, null, null, false, null, null, instanceID);
                /* do the quick search simulation of the default list method */
                doPaging("start", 1, objTable);
            }
        }
    }
    //#endregion
}
