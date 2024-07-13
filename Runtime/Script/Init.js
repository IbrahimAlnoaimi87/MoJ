/* Init.js - kicks off the initialization of runtime form */

//Central global variable to be used to check if smartforms runtime scripts are loaded
//If this variable is undefined, we can be quite certain that the current window object does not contain our scripts
var _runtimeScriptsLoaded = true;

var runtimeParametersDefinition = null;
var _runtimeParameters = null;
var viewControllerDefinition = null;
var formBindingXml = null;
var runtimeNavigatedEvents = null;
var currentForm = null;
var collectionTables = [];
var emptyXmlDoc = null;
var xslFormatter = null;
var persistedActions = null;
var currentCulture = null;
var viewTableDefinitions = [];
var runtimePendingCallsBeforeInit = [];
var runtimePendingCallsAfterInit = [];
var runtimePaddingCacheValue;
var initPaddingUpdated = false;
var runtimeFilterFields = [];
var _runtimePersistedHandlers = null;
var _runtimeInitSpinner = false;
var _runtimeSpinnersCount = 0;
var _runtimeLoadingFromDraft = false;

// Namespacing
var SourceCode = SourceCode ? SourceCode : {};
SourceCode.Forms = SourceCode.Forms ? SourceCode.Forms : {};
SourceCode.Forms.Runtime = SourceCode.Forms.Runtime ? SourceCode.Forms.Runtime : {};

function runtimeInitialize()
{
    var possibleRuntimeMode = getQueryStringParameterValue("_mode");
    if (checkExistsNotEmpty(possibleRuntimeMode))
    {
        _runtimeMode = possibleRuntimeMode;
    }

    if ((typeof _runtimeMode !== "undefined") && (_runtimeMode === "offline"))
    {
        _runtimeDraftInfo = {};

        var possibleDraftId = getQueryStringParameterValue("_draftId");

        if (checkExistsNotEmpty(possibleDraftId) && possibleDraftId.isValidGuid())
        {
            _runtimeDraftInfo.id = possibleDraftId;
        }
    }

    if ((typeof _runtimeDraftInfo !== "undefined") && (_runtimeDraftInfo !== null)
        && (typeof _runtimeDraftInfo.id !== "undefined") && (_runtimeDraftInfo.id !== null) && (_runtimeDraftInfo.id !== ""))
    {
        _runtimeLoadingFromDraft = true;
    }

    // Save runtimeStatus on the main context this insures that EventBehavior executeBehavior will function.
    var instanceName = SourceCode.Forms.Runtime.getRuntimeInstanceName();
    SourceCode.Forms.Runtime.setRuntimeDataProperty(instanceName, "windowContextValid", true);
    SourceCode.Forms.Runtime.setRuntimeDataProperty(instanceName, "windowContext", window.self);

    var hadError = false;
    var elem = document.getElementById("ErrorMessage");
    if (checkExists(elem))
    {
        if (checkExists(elem.value) && elem.value.length > 0)
        {
            hadError = true;
            $('#__initialModalizer').remove();
            var data = elem.value;
            if (SourceCode.Forms.ExceptionHandler.isAuthenticationException(data))
            {
                SourceCode.Forms.ExceptionHandler.handleAuthenticationException(data, null, function () { closeAuthLoginPopup(); });
            }
            else
            {
                SourceCode.Forms.ExceptionHandler.handleException(data);
            }
        }
        elem.value = "";
    }

    if (hadError)
    {
        return;
    }

    SFRuntimeBrowserDetection();

    var formIdField = jQuery("#FormId");

    // Check if runtime should be initialized
    if (formIdField.length > 0)
    {
        currentForm = formIdField[0].value.toLowerCase();

        // Performance : Log load end and init start for performance
        PFEnd('PF', 'Load', '');
        PFStart("K2 SmartForms - Runtime Web Client", "Runtime Client Initialize", currentForm);

        //#region

        // Populates the Panel Header with this form's title
        ajaxCall = new AjaxCall();

        //do other initialization kick-offs
        initializeParameters();
        SFLog({ type: 1, source: "Document ready", category: "Init", message: "Runtime Parameters Definition", data: runtimeParametersDefinition, humanateData: false });
        viewControllerDefinition = $xml(__runtimeControllersDefinition);
        SFLog({ type: 1, source: "Document ready", category: "Init", message: "View Controller Definition", data: viewControllerDefinition, humanateData: false });
        formBindingXml = $xml(__runtimeEventsDefinition);
        SFLog({ type: 1, source: "Document ready", category: "Init", message: "Events Definition", data: formBindingXml, humanateData: false });
        initializeNavigatedEvents();
        SFLog({ type: 1, source: "Document ready", category: "Init", message: "NavigatedEvents Definitions", data: runtimeNavigatedEvents, humanateData: false });

        var handlesSubmit = verifyEventHandling(currentForm, _runtimeCallerType, "Submit");

        if (handlesSubmit === true)
        {
            SourceCode.Forms.Runtime.MobileBridge.sendToMobileDevice({ methodName: "formHandlesSubmit" });
        }

        //Culture population
        currentCulture = $("#CurrentCulture").val();
        SCCultureHelper.createCurrent(_runtimeCulturesValue, currentCulture, _runtimeTimeZones);

        if (!__runtimeIsAnonymous)
        {
            loadPersistedViewParametersForUser();
        }

        if (typeof (Sys) !== "undefined")
        {
            //check for AJAX controls
            if (Sys.Application._initialized)
            {
                $(document).ready(initializeRuntimeForm);
            }
            else
            {
                Sys.Application.add_load(function ()
                {
                    $(document).ready(initializeRuntimeForm);
                });
            }
        }
        else
        {
            $(document).ready(initializeRuntimeForm);
        }
        if (!initPaddingUpdated)
        {
            refreshFormPadding({});
        }

        $("#form1").on("submit", function (e)
        {
            return false;
        });

        jQuery(document).on("keypress keyup keydown", function (ev)
        {
            if (!jQuery(ev.target).is("input, textarea, select, *[contentEditable=true]"))
            {
                if (ev.keyCode === 8)
                {
                    return false;
                }
            }
        });

        jQuery(document).on("keydown", ".popup, .popup input, .popup a, .popup div", function (ev)
        {
            if (ev.keyCode === 27 && popupManager.isAnyPopupShown())
            {
                ev.stopPropagation();
                popupManager.closeLast();
            }
        });

        // Handling of collapsible panel events
        jQuery(".panel").panel();
        $(document).on("panelcollapse", ".panel", function ()
        {
            expandCollapseEvent(this.getAttribute("ID"), "Collapse");
            // Handling of Workflow View
            if ($(this).closest("#WorkflowStrip").length > 0)
            {
                $(this).closest("#WorkflowStrip").height($(this).height());
                if ($(this).closest("#WorkflowStrip").next(".theme-entry").length > 0)
                {
                    $(this).closest("#WorkflowStrip").next(".theme-entry").css("top", ($(this).height() + parseInt($(this).closest("#WorkflowStrip").attr("formborder"), 10)) + "px");
                }
                else
                {
                    $(this).closest("#WorkflowStrip").prev(".theme-entry").css("bottom", ($(this).height() + parseInt($(this).closest("#WorkflowStrip").attr("formborder"), 10)) + "px");
                }
            }
        });

        $(document).on("panelexpand", ".panel", function ()
        {
            expandCollapseEvent(this.getAttribute("ID"), "Expand");
            // Handling of Workflow View
            if ($(this).closest("#WorkflowStrip").length > 0)
            {
                $(this).closest("#WorkflowStrip").height(parseInt($(this).closest("#WorkflowStrip").attr("panelheight"), 10));
                if ($(this).closest("#WorkflowStrip").next(".theme-entry").length > 0)
                {
                    $(this).closest("#WorkflowStrip").next(".theme-entry").css("top", ($(this).height() + parseInt($(this).closest("#WorkflowStrip").attr("formborder"), 10)) + "px");
                }
                else
                {
                    $(this).closest("#WorkflowStrip").prev(".theme-entry").css("bottom", ($(this).height() + parseInt($(this).closest("#WorkflowStrip").attr("formborder"), 10)) + "px");
                }
            }
        });

        //#endregion

        // Finding any workflow views and add class for seperate styling
        jQuery("*[id$=_9afc3bff-abee-4066-93d6-c217cdf765f5]").addClass("workflow-view");
    }

    try
    {
        if ($('#__designerStatus', window.parent.document).length > 0)
        {
            $('#__designerStatus', window.parent.document).text($('#__designerStatus', window.parent.document).text().replace('initializing', 'initialized'));
        }
    }
    catch (e)
    {

    }
}

//checks and populates global navigated events variables depending on values provided
function initializeNavigatedEvents()
{
    if (checkExistsNotEmpty(__runtimeNavigatedEvents))
    {
        try
        {
            runtimeNavigatedEvents = $xml("<Events>" + __runtimeNavigatedEvents.htmlDecode() + "</Events>");
        }
        catch (e)
        {
            //invalid xml found in navigated events
            SFLog({ type: 5, source: "initializeNavigatedEvents", category: "Init", message: "NavigatedEvents not in proper format", data: __runtimeNavigatedEvents, humanateData: false });
            runtimeNavigatedEvents = null;
        }
    }
}

//handles the expanding and collapsing of grids and panels as events
function expandCollapseEvent(mainTable, method)
{
    //#region
    if (checkExists(mainTable) && mainTable.length > 0 && checkExists(method) && method.length > 0)
    {
        var viewObj = new getMainTableViewInformation(mainTable);
        if (checkExists(viewObj))
        {
            var viewID = viewObj.viewID;
            var instanceID = viewObj.instanceID;
            handleEvent(viewID, "View", method, null, instanceID);
        }
    }
    //#endregion
}

function addRuntimePendingCalls(functionToCall, afterInit)
{
    // Argument checking
    if (typeof afterInit === "undefined")
    {
        afterInit = false;
    }

    // Should function be called before init or after init event
    if (afterInit && _runtimeIsInitializing)
    {
        if (!checkExists(runtimePendingCallsAfterInit))
        {
            runtimePendingCallsAfterInit = [];
        }
        runtimePendingCallsAfterInit.push(functionToCall);
    }
    else if (!afterInit && _runtimeIsRendering)
    {
        if (!checkExists(runtimePendingCallsBeforeInit))
        {
            runtimePendingCallsBeforeInit = [];
        }
        runtimePendingCallsBeforeInit.push(functionToCall);
    }
    else
    {
        functionToCall();
    }
}

//helper function to refresh form padding with regards to visible and invisible controls/views
function refreshFormPadding(o)
{
    //#region
    if (!initPaddingUpdated)
    {
        initPaddingUpdated = true;
    }

    if (!checkExists(o))
    {
        o = {};
    }
    var ignoreTabStyles = (checkExists(o.ignoreTabStyles)) ? o.ignoreTabStyles : false;
    var forms = null;

    if (checkExists(o.panelID))
    {
        forms = jQuery("#{0}_{1}_internal".format(currentForm, o.panelID));
        if (forms.length === 0)
        {
            forms = jQuery("#{0}_{1}_internal".format(_runtimeEmptyGuid, o.panelID));
        }
    }
    else if (checkExists(o.controlID))
    {
        var control = jQuery("#{0}".format(o.controlID));
        if (control.length === 0)
        {
            var controlObj = $find(o.controlID);
            if (checkExists(controlObj))
            {
                control = jQuery($find(o.controlID).get_element());
            }
        }
        forms = control.closest(".form");
    }

    if (!checkExists(forms) || forms.length === 0) //normal layout if control doesn't exist or if the form was not found
    {
        forms = jQuery("body>form>div.runtime-content>div.runtime-form.theme-entry>div.form");
    }

    if (forms.length === 0) //tab layout
    {
        forms = jQuery("body>form>div.runtime-content>div.runtime-form.theme-entry>div.tab-box>div.tab-box-body>div.tab-box-body-m>div.tab-box-body-m-c>div.tab-box-body-wrapper>div.scroll-wrapper>div.formpanel>div.form");
    }

    //padding value was added to assist in reformatting when conditional formatting was applied to page control - padding influences margins and this function contained most of the logic already
    var paddingValue = "";
    if (checkExists(o.newPadding))
    {
        paddingValue = o.newPadding;
    }
    else if (checkExists(runtimePaddingCacheValue))
    {
        paddingValue = runtimePaddingCacheValue;
    }
    else
    {
        paddingValue = $(forms[0]).css("padding-top");
    }
    runtimePaddingCacheValue = paddingValue;

    var newMargin = (checkExists(paddingValue) && paddingValue !== "") ? (parseInt(paddingValue, 10) / 2) + "px" : ""; //used in cases where half of the padding is required for margins
    var topBottomMargin = (checkExists(paddingValue) && paddingValue !== "") ? parseInt(paddingValue, 10) + "px" : "";
    var f = forms.length;

    var horizontal = (document.documentElement.getAttribute("dir") === "rtl") ? ["marginRight", "marginLeft"] : ["marginLeft", "marginRight"];
    var vertical = ["marginTop", "marginBottom"];

    function updatePadding(collection, normalAdjustment, firstLastAdjustment, updateItem, updateAreaItem)
    {
        var i = collection.length;
        var visibleCollectionItems = [];
        var lastVisible = true;
        while (i--)
        {
            var currentItem = $(collection[i]);
            //reset row display
            currentItem[0].style.display = "";

            var areaItems = currentItem.children();
            var a = areaItems.length;
            var visibleAreas = [];

            //loop through areaitems
            while (a--)
            {
                var currentAreaItem = $(areaItems[a]);
                var currentAreaItemDom = currentAreaItem[0];
                var innerPanel = $(currentAreaItem.children()[0]);
                var innerPanelDom = innerPanel[0];
                var itemContent = innerPanel.children();
                var ic = itemContent.length;

                var isAreaItemVisible = false;
                //check for visibility of area item content
                while (ic--)
                {
                    if (!$(itemContent[ic]).hasClass("hidden") && itemContent[ic].style.display !== "none" && itemContent[ic].style.visibility !== "collapse" && itemContent[ic].style.visibility !== "hidden")
                    {
                        isAreaItemVisible = true;
                        break;
                    }
                }

                if (isAreaItemVisible === true)
                {

                    visibleAreas.push({ currentAreaItem: currentAreaItemDom, innerPanel: innerPanelDom });
                    currentAreaItemDom.style.display = "";
                    if (lastVisible) //lastVisible
                    {
                        currentAreaItemDom.style[firstLastAdjustment[1]] = "0px";
                    }
                    else
                    {
                        currentAreaItemDom.style[firstLastAdjustment[1]] = newMargin;  //new margin
                    }
                    currentAreaItemDom.style[firstLastAdjustment[0]] = newMargin; //new margin
                    var innerMargin = newMargin;
                    if (normalAdjustment[0] === vertical[0] && currentAreaItem.is(".formcontrol"))
                    {
                        innerMargin = topBottomMargin;
                    }
                    innerPanelDom.style[normalAdjustment[0]] = innerMargin; //new margin
                    innerPanelDom.style[normalAdjustment[1]] = innerMargin; //new margin
                }
                else
                {
                    currentAreaItemDom.style.display = "none";
                    currentAreaItemDom.style.margin = "";
                    innerPanelDom.style.margin = "";
                }
            }

            if (visibleAreas.length > 0)
            {
                //loop through visible areas and set their width
                lastVisible = false;
                visibleCollectionItems.push(i);
                var v = visibleAreas.length;
                var vLength = v;
                if (checkExists(updateAreaItem) && updateAreaItem === true)
                {
                    // Check for static width views and ajust accordingly.
                    var staticAreaLengthPx = 0;
                    var staticAreaNo = 0;
                    var staticAreaLengthP = 100;
                    while (v--)
                    {
                        var areaItem = visibleAreas[v].currentAreaItem;
                        // Only Views can have static widths
                        if (areaItem.className.indexOf("view") !== -1)
                        {
                            var areaWidth = areaItem.getAttribute("data-width");
                            if (checkExists(areaWidth))
                            {
                                if (areaWidth.indexOf("px") !== -1)
                                {
                                    staticAreaLengthPx += parseInt(areaWidth.replace("px", ""));
                                    staticAreaNo++;
                                }
                                else if (areaWidth.indexOf("%") !== -1 && areaWidth !== "100%")
                                {
                                    staticAreaLengthP -= parseInt(areaWidth.replace("%", ""));
                                    staticAreaNo++;
                                }
                            }
                        }
                    }
                    if (staticAreaLengthPx > 0)
                    {
                        staticAreaLengthPx = staticAreaLengthPx / (vLength - staticAreaNo);
                    }
                    if (staticAreaLengthP < 1)
                    {
                        staticAreaLengthP = 100;
                    }
                    staticAreaLengthP = staticAreaLengthP / (vLength - staticAreaNo);
                    // End calc static width Views.
                    v = vLength;
                    while (v--)
                    {
                        var currentVisibleArea = visibleAreas[v];
                        var currentAreaItem = currentVisibleArea.currentAreaItem;
                        var areaWidth = currentAreaItem.getAttribute("data-width");
                        if (!checkExists(areaWidth) || areaWidth === "100%")
                        {
                            if (staticAreaLengthPx > 0)
                            {
                                currentAreaItem.style.width = "calc({0}% - {1}px)".format(staticAreaLengthP, staticAreaLengthPx);
                            }
                            else
                            {
                                currentAreaItem.style.width = "{0}%".format(staticAreaLengthP);
                            }
                        }
                    }
                }
                visibleAreas[vLength - 1].innerPanel.style[normalAdjustment[0]] = "0px";
                visibleAreas[0].innerPanel.style[normalAdjustment[1]] = "0px";
                visibleAreas = [];//garbage collection
            }
            else
            {
                collection[i].style.display = "none";
            }
        }
        var VLength = visibleCollectionItems.length;
        if (VLength > 0)
        {
            //lastVisible
            var firstChildren = $(collection[visibleCollectionItems[VLength - 1]]).children();
            var fc = firstChildren.length;
            while (fc--)
            {
                firstChildren[fc].style[firstLastAdjustment[0]] = "0px";
            }
            if (checkExists(updateItem) && updateItem === true)
            {
                var counter = VLength;
                while (counter--)
                {
                    var item = $(collection[visibleCollectionItems[counter]]);

                    if (collection.length !== VLength)
                    {
                        item[0].style.width = (100 / VLength) + "%";
                    }
                    else
                    {
                        if (item.hasClass("col") && checkExists(item.data("width")) && item.data("width") !== "100%")
                        {
                            item[0].style.width = item.data("width");
                        }
                        else
                        {
                            item[0].style.width = (100 / VLength) + "%";
                        }
                    }
                }
            }
        }

    }
    while (f--) //loop through each tab if applicable
    {
        var thisForm = $(forms[f]);
        var rows = thisForm.children(".row");
        var r = rows.length;
        var cols = thisForm.children(".col");
        var c = cols.length;

        if (r > 0) //row layout
        {
            updatePadding(rows, horizontal, vertical, false, true);
        }
        else if (c > 0) //column layout
        {
            updatePadding(cols, vertical, horizontal, true, false);
        }
    }

    //tab styles
    //only update when not called from the page conditional styling section
    if (!checkExists(ignoreTabStyles))
    {
        var tabBoxBody = jQuery("body>form>div.runtime-content>div.runtime-form.theme-entry>div.tab-box>div.tab-box-body");
        if (tabBoxBody.length > 0)
        {
            var backgroundColor = tabBoxBody[0].style.backgroundColor;
            if (backgroundColor.length > 0)
            {
                updateTabStyles(backgroundColor);
            }
        }
    }
    //#endregion
}

//add events to the list's filter section and initialize the controls
function populateListFilterEvents(mainTableID, disabledOverride)
{
    //#region
    var listviewsXPath = "Controllers/Controller[@TypeView='List']";
    if (checkExists(mainTableID))
    {
        listviewsXPath += "[@MainTable='" + mainTableID + "']";
    }
    var listViews = $mn(viewControllerDefinition, listviewsXPath);
    if (listViews.length > 0)
    {
        if (checkExists(mainTableID))
        {
            SFLog({ type: 1, source: "populateListFilterEvents", category: "Init", message: "List view events {0} with disabled set to {1}", parameters: [mainTableID, disabled] });
        }
        for (var x = 0; x < listViews.length; x++)
        {
            var currentView = listViews[x];
            var disabled = disabledOverride;
            if (!checkExists(disabled))
            {
                if (currentView.getAttribute("IsEnabled") === "false")
                {
                    disabled = true;
                }
                else
                {
                    disabled = false;
                }
            }
            var viewID = currentView.getAttribute("ID");
            var instanceID = currentView.getAttribute("InstanceID");
            var listSectionID = (checkExists(instanceID)) ? instanceID + "_" + viewID : _runtimeEmptyGuid + "_" + viewID;
            mainTableID = currentView.getAttribute("MainTable");

            //attach the click event to the quick search button
            var quickSearchButton = jQuery("#" + listSectionID + "_quickSearchBtn");
            if (quickSearchButton.length > 0)
            {
                if (!disabled)
                {
                    quickSearchButton.on("click", null, instanceID, quickSearchFilterClicked);
                }
                else if (disabled)
                {
                    quickSearchButton.off("click");
                }
            }

            var quickSearchTextBox = jQuery("#" + listSectionID + "_quickSearchTxt");
            if (quickSearchTextBox.length > 0)
            {
                if (!disabled)
                {
                    quickSearchTextBox.on("keydown", null, instanceID, testForQuickSearchEnter);
                }
                else
                {
                    quickSearchTextBox.off("keydown");
                }
            }

            populateQuickSearchDropdown(viewID, instanceID, listSectionID, disabled);
            //populate the filter cache of all available columns (to be used in filter widget)
            var fieldsForFiltering = runtimeFilterFields[viewID];
            if (!checkExists(fieldsForFiltering))
            {
                var returnFieldsForFilteringObject =
                    {
                        viewID: viewID,
                        instanceID: instanceID,
                        testVisible: false,
                        sorted: true
                    };
                fieldsForFiltering = returnFieldsForFiltering(returnFieldsForFilteringObject);
                runtimeFilterFields[viewID] = fieldsForFiltering;
            }

            var filterConfig = jQuery("#" + listSectionID + "_configFilter");
            if (filterConfig.length > 0)
            {
                if (!disabled && !__runtimeIsAnonymous)
                {
                    filterConfig.on("click", filterConfigClick);
                }
                else
                {
                    filterConfig.off("click");
                    filterConfig.addClass("disabled");
                }
            }

            var filterDropdown = jQuery("#" + listSectionID + "_selectedFilterDdl");
            if (filterDropdown.length > 0)
            {
                if (!disabled)
                {
                    if (!__runtimeIsAnonymous)
                    {
                        populateFilters(listSectionID);
                    }
                    filterDropdown.on("change", null, instanceID, quickSearchFilterClicked);
                    filterDropdown.dropdown("enable");
                }
                else
                {
                    filterDropdown.off("change");
                    filterDropdown.dropdown("disable");
                }
            }

            var pageSize = getViewProperty(currentView, "PageSize");
            var usePaging = false;
            if (checkExists(pageSize))
            {
                document.getElementById(mainTableID).setAttribute("PageSize", pageSize);
                usePaging = true;
            }
            var isEditable = getViewProperty(currentView, "ListEditable");
            if (checkExists(isEditable))
            {
                isEditable = true;
                if (!checkExists(disabledOverride))
                {
                    //only to be called once on initialize to fix incorrect field on definition
                    adaptDependencyFields(viewID, instanceID);
                }
            }
            else
            {
                isEditable = false;
            }
            var shadeRows = getViewProperty(currentView, "AlternateRows");
            if (checkExists(shadeRows) && shadeRows.toLowerCase() === "true")
            {
                shadeRows = true;
            }
            else
            {
                shadeRows = false;
            }
            var showAddRow = getViewProperty(currentView, "ShowAddRow");
            if (checkExists(showAddRow))
            {
                showAddRow = true;
            }
            else
            {
                showAddRow = false;
            }

            var multiSelect = getViewProperty(currentView, "MultiSelectAllowed");
            if (checkExists(multiSelect) && multiSelect.toUpperCase() === "TRUE")
            {
                multiSelect = true;
            }
            else
            {
                multiSelect = false;
            }

            var cellContentSelect = getViewProperty(currentView, "CellContentSelectAllowed");
            if (checkExists(cellContentSelect) && cellContentSelect.toUpperCase() === "TRUE")
            {
                cellContentSelect = true;
            }
            else
            {
                cellContentSelect = false;
            }

            var jqTable = jQuery("#" + mainTableID);
            jqTable.grid({ rowclick: listRowClick, rowdblclick: listRowDblClick, paging: usePaging, custompaging: doPaging, zebraStripes: shadeRows, disableInternalWidthSync: true, multiselect: multiSelect, cellcontentselect: cellContentSelect });

            jqTable.on("gridcollapse", function ()
            {
                expandCollapseEvent(this.getAttribute("ID"), "Collapse");
            });

            jqTable.on("gridexpand", function ()
            {
                expandCollapseEvent(this.getAttribute("ID"), "Expand");
            });

            if (isEditable)
            {
                if (showAddRow)
                {
                    SFRGrid.execute({ element: jqTable, fn: "option", params: ["actionrowclick", addListItemRow] });
                    SFRGrid.execute({ element: jqTable, fn: "option", params: ["actionrow", true] });
                }
                var editTemplateRow = SFRGrid.execute({ element: jqTable, fn: "fetch", params: ["edit-template-row"] });
                if (checkExists(editTemplateRow))
                {
                    editTemplateRow.on("keydown", null, mainTableID, testCancelList);
                }
                SFRGrid.execute({ element: jqTable, fn: "option", params: ["commitrowwithkey", commitListItemRow] });
            }
            jqTable.attr("isdisabled", disabled);
            SFRGrid.execute({ element: jqTable, fn: "option", params: ['canexpand', false] });
            SFRGrid.execute({ element: jqTable, fn: "runtimeSyncColumns" });

            //block off this code since drafts will load there own data and this will break things like quick search highlighting
            if (!_runtimeLoadingFromDraft)
            {
                if (checkExists(disabledOverride)) //know it is set via disable/enable
                {
                    //have to override the definition
                    viewTableDefinitions[mainTableID] = constructTableDefinition(currentView.getAttribute("ID"), jqTable, jqTable[0].getAttribute("QFValue"), jqTable[0].getAttribute("QFName"), instanceID);
                    //table data will be refreshed - update for 1.0.2
                    refreshTableData(mainTableID, jqTable[0].getAttribute("PageNumber"));
                }
                else
                {
                    //cache grid definition so that population happens more quickly
                    var Arr = viewTableDefinitions[mainTableID];
                    if (!checkExists(Arr) || Arr.length === 0)
                    {
                        setTimeout(function ()
                        {
                            viewTableDefinitions[mainTableID] = constructTableDefinition(currentView.getAttribute("ID"), jqTable, jqTable[0].getAttribute("QFValue"), jqTable[0].getAttribute("QFName"), instanceID);
                        }, 0);
                    }
                }
            }
            
        }

    }
    //#endregion
}

//dynamically loads respective JS file for the filter configuration widget if applicable
function setFilterConfigIncludeFiles(id)
{
    if (runtimeFilterScripts.length > 0)
    {
        var useBundledFiles = SourceCode.Forms.Settings.Bundling.UseBundledFiles;

        $.addScript(runtimeFilterScripts.shift(), function (script)
        {
            setFilterConfigIncludeFiles(id);
        }, useBundledFiles);
    }
    else
    {
        setFilterConfigValue(id);
    }
}

//filter configuration button was clicked
function filterConfigClick(evt)
{
    //#region
    var e = (window.event) ? window.event : evt;
    var obj = null;
    if (e.currentTarget)
    {
        obj = e.currentTarget;
    }
    else
    {
        obj = e.srcElement;
    }
    setFilterConfigIncludeFiles(obj.id);
    //#endregion
}

//populates quick search dropdown with available options (can change when a column's display is changed)
function populateQuickSearchDropdown(viewID, instanceID, listSectionID, disabled)
{
    //#region
    //populate the quick search dropdown
    var quickSearchDropdown = jQuery("#" + listSectionID + "_quickSearchDdl");
    if (quickSearchDropdown.length > 0)
    {
        var previousValue = quickSearchDropdown[0].value;
        quickSearchDropdown.empty();
        quickSearchDropdown[0].options.add(new Option(Resources.Runtime.AllFields, "[All]"));
        var fieldsForFiltering = runtimeFilterFields[listSectionID];
        if (!checkExists(fieldsForFiltering))
        {
            //still construct a cache to be reused if possible, only possible alteration is when columns are shown/hidden dynamically
            var returnFieldsForFilteringObject =
                {
                    viewID: viewID,
                    instanceID: instanceID,
                    testVisible: true,
                    sorted: true
                }
            fieldsForFiltering = returnFieldsForFiltering(returnFieldsForFilteringObject);
            runtimeFilterFields[listSectionID] = fieldsForFiltering;
        }

        var f = fieldsForFiltering.length;

        while (f--)
        {
            var field = fieldsForFiltering[f];
            if (checkExistsNotEmpty(field.getAttribute("PropertyType")) && field.getAttribute("PropertyType").toLowerCase() != "datetime" && field.getAttribute("DisplayName") !== "")
            {
                quickSearchDropdown[0].options.add(new Option(field.getAttribute("DisplayName"), field.getAttribute("ID")));
            }
        }

        quickSearchDropdown.dropdown("refresh");
        if (checkExists(previousValue) && previousValue.length > 0)
        {
            quickSearchDropdown.dropdown("select", previousValue);
        }

        if (disabled === false)
        {
            quickSearchDropdown.dropdown("enable");
        }
        else if (disabled === true)
        {
            quickSearchDropdown.dropdown("disable");
        }
    }
    //#endregion
}

//refresh table data after enabled state of view is updated
function refreshTableData(table, pageNumber)
{
    //#region
    var ViewInstance = new getMainTableViewInformation(table);
    var viewID = ViewInstance.viewID;
    var instanceID = ViewInstance.instanceID;
    var JustProperties = getCombinedHiddenPropertyCollection(viewID, null, null, pageNumber, false, true, null, null, null, instanceID); //return the correct value from the package after a single execution on a capture list
    removeSortingIndicators(table);
    rebuildTable(table, viewID, instanceID, false, false, null, JustProperties, true, pageNumber, false);
    //#endregion
}

//do a check on the key up of the quicksearch textbox - if enter is pressed, the quick search is executed
function testForQuickSearchEnter(e)
{
    //#region
    if (e.keyCode === 13) //enter
    {
        quickSearchFilterClicked(e);
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
    //#endregion
}

/* handles the initialize events - either executes the persisted actions that was passed to this form (which must include when the initialize must fire), or do the initialize events according to the caller type (view/form) */
function handleInitializeEvents()
{
    SFLog({ type: 2, source: "handleInitializeEvents", category: "Init", message: "Initialize actions" });
    //#region
    //inspect persisted actions
    if (checkExistsNotEmpty(__runtimeNavigatedActions))
    {
        //TFS 544810 - Create the XMLDocument object on the main runtime window, to avoid js errors with actions executing after a subform/subview close
        var windowToUseForXmlDoc = SourceCode.Forms.Runtime.getMasterRuntimeWindow();
        var actiondoc = null;
        try
        {
            actiondoc = windowToUseForXmlDoc.$xml("<Actions>" + __runtimeNavigatedActions.htmlDecode() + "</Actions>");  //populate persisted actions here
        }
        catch (e)
        {
            SFLog({ type: 5, source: "handleInitializeEvents", category: "Init", message: "NavigatedAction not in proper format", data: __runtimeNavigatedActions, humanateData: false });
        }

        if (checkExists(actiondoc))
        {
            //check if init was specified in the persisted actions
            var initAction = $sn(actiondoc, "Actions/Action[@Type='Execute'][@Method='Init']");
            //inspects actions
            var actions = $mn(actiondoc, "Actions/Action");

            //loop through actions
            if (actions.length > 0)
            {
                persistedActions = [];
                for (var a = 0; a < actions.length; a++)
                {
                    SFLog({ type: 1, source: "handleInitializeEvents", category: "Init", message: "Added initialize Action {0}", parameters: [a], data: actions[a].cloneNode(true) });
                    persistedActions.push(actions[a].cloneNode(true));
                }
            }
            var handlers = $mn(actiondoc, "Actions/Handlers");
            if (handlers.length > 0)
            {
                _runtimePersistedHandlers = [];
                _runtimePersistedHandlers = constructHandlersForBehaviour(actiondoc.firstChild, _runtimePersistedHandlers, null, "Navigate");
            }

            if (!checkExists(initAction))
            {
                //do the _runtimeCallerType init before executing the persisted actions
                SFLog({ type: 1, source: "handleInitializeEvents", category: "Init", message: "Handle {0} initialize (Persisted) ", parameters: [_runtimeCallerType], data: currentForm, humanateData: false });
                handleEvent(currentForm, _runtimeCallerType, "Init", null, null, true);
                //if it was not specified, it will happen in the sequence defined by the user
            }
            else if ((checkExists(persistedActions) && persistedActions.length > 0) || (checkExists(_runtimePersistedHandlers) && _runtimePersistedHandlers.length > 0))
            {
                var actionsForBehaviour = persistedActions;
                persistedActions = null;
                var handlersForBehaviour = _runtimePersistedHandlers;
                _runtimePersistedHandlers = null;
                var masterRuntimeWindow = SourceCode.Forms.Runtime.getMasterRuntimeWindow();
                var behaviour = new masterRuntimeWindow.SourceCode.Forms.Runtime.BehaviourEvent({ actions: actionsForBehaviour, isInit: true, methodExecuted: "Init", handlers: handlersForBehaviour, windowToUse: window.self });
                behaviour.executeBehaviour();//correct usage
            }
        }
    }
    else  //have to check if this is a form or just a view in runtime
    {
        SFLog({ type: 1, source: "handleInitializeEvents", category: "Init", message: "Handle {0} initialize (Normal) ", parameters: [_runtimeCallerType], data: currentForm });
        handleEvent(currentForm, _runtimeCallerType, "Init", null, null, true);
    }
    //#endregion
}

//start execution of relevant initialization functions
function initializeRuntimeForm()
{
    $('#__initialModalizer').remove();

    SourceCode.Forms.Runtime.determineMasterPopupManager();
    populateListFilterEvents();

    _runtimeIsRendering = false;
    //handle pending runtime raiseEvents - when raiseEvent is called from certain controls (with static data) before everything was completely initialized
    if (checkExists(runtimePendingCallsBeforeInit))
    {
        for (var i = 0; i < runtimePendingCallsBeforeInit.length; i++)
        {
            runtimePendingCallsBeforeInit[i]();
        }
        runtimePendingCallsBeforeInit = [];
    }
    _runtimeSetPopupFirstFocus();
    evaluateSSREResults();
    handleInitializeEvents();
    if (_runtimeLoadingFromDraft)
    {
        SourceCode.Forms.Runtime.loadFromDraft();
    }
}

function evaluateSSREResults()
{
    //view method executions, list control population
    if (typeof __runtimeSSREFC !== "undefined" && checkExistsNotEmpty(__runtimeSSREFC))
    {
        var fieldsCollection = JSON.parse(__runtimeSSREFC.htmlDecode()).FC;
        __runtimeSSREFC = null;
        var fc = fieldsCollection.length;
        for (var f = 0; f < fc; f++)
        {
            PopulateView(fieldsCollection[f]);
        }
    }

    //apply SSRE field values
    if (typeof __runtimeSSREF !== "undefined" && checkExistsNotEmpty(__runtimeSSREF))
    {
        var fieldInstances = JSON.parse(__runtimeSSREF.htmlDecode()).V;
        __runtimeSSREF = null;
        if (fieldInstances != null)
        {
            var instances = Object.keys(fieldInstances);
            for (var i = 0; i < instances.length; i++)
            {
                var instanceID = instances[i];
                var fields = fieldInstances[instanceID].F;
                var fieldIds = Object.keys(fields);
                for (var f = 0; f < fieldIds.length; f++)
                {
                    var fieldID = fieldIds[f];
                    var fieldValue = fields[fieldID];
                    setHiddenFieldValue(fieldID, fieldValue, null, instanceID, null, null, false);
                }
            }
        }
    }

    //apply SSRE control values
    if (typeof __runtimeSSREC !== "undefined" && checkExistsNotEmpty(__runtimeSSREC))
    {
        var controlValues = JSON.parse(__runtimeSSREC.htmlDecode()).C;
        __runtimeSSREC = null;
        if (controlValues != null)
        {
            var controls = Object.keys(controlValues);
            for (var c = 0; c < controls.length; c++)
            {
                var currentControlID = controls[c];
                var controlValue = controlValues[currentControlID];

                var currentControl = _runtimeControllerFindObject({ controlID: currentControlID });
                if (checkExists(currentControl))
                {
                    var objInfo = new PopulateObject(null, controlValue, currentControlID);
                    executeControlFunction(currentControl, "SetValue", objInfo);
                }
            }
        }
    }

    if (typeof __runtimeSSREP !== "undefined" && checkExistsNotEmpty(__runtimeSSREP))
    {
        var processInfo = JSON.parse(__runtimeSSREP.htmlDecode());
        __runtimeSSREP = null;
        applySSREProcessData(processInfo);
    }
}

function applySSREProcessData(processInfo)
{
    if (processInfo != null)
    {
        previousActionXml = GetPreviousActionXml(processInfo);
        if (checkExistsNotEmpty(previousActionXml))
        {
            var previousAction = $xml(previousActionXml).documentElement;
            setWorkflowInformation(processInfo);
            applyWorkflowViewInformation(previousAction, processInfo);
            if (processInfo.ActionsControlID != null)
            {
                var sourceValue = getWorkflowActionCollection(processInfo);
                populateListControlWithWorkflowProcessActions(processInfo.ActionsControlID, sourceValue);
            }
        }
    }
}

//loads the persisted view parameters from the user profile
function loadPersistedViewParametersForUser()
{
    //#region
    if (!__runtimeIsAnonymous)
    {
        var parameterCache = '';
        if (typeof (__persistedParametersDefinition) !== "undefined") // undefined if anonymous
        {
            parameterCache = __persistedParametersDefinition
        }
        if (parameterCache.length > 0)
        {
            setHiddenParameterCollection(parameterCache);
        }
    }
    //#endregion
}

//get selected action from workflow view (reusable)
function getWorkflowViewActionName(doValidation)
{
    //#region
    //doValidation is false when used to retrieve as System value
    var actionDropdown = jQuery("*[id$=_936c1d65-be60-8c5c-0de9-1db2018d94c0_DropDown]");
    var actionName = "";
    if (actionDropdown.length > 0)
    {
        actionName = actionDropdown.dropdown("SelectedValue");
        if (doValidation)
        {
            var validationObject = {};
            var selectDiv = actionDropdown.next('.input-control');
            if (actionName.length === 0)
            {
                validationObject.IsRequired = true;
                validationObject.Pattern = null;
                validationObject.DataType = null;
                validationObject.CurrentControlId = actionDropdown.attr("id").replace("_DropDown", "");
                validationObject.Error = Resources.Runtime.RequiredValidationError;

                UtilitiesHelper.showValidationMessage(selectDiv, validationObject);

                var tooltip = 'Select an action to submit';
                selectDiv.attr('title', tooltip);
                return;
            }
            else
            {
                //do reverse of validatation, in case it was prompted earlier
                validationObject.IsRequired = null;
                validationObject.Pattern = null;
                validationObject.DataType = null;
                validationObject.CurrentControlId = actionDropdown.attr("id").replace("_DropDown", "");
                validationObject.Error = "";

                UtilitiesHelper.showValidationMessage(selectDiv, validationObject);
                selectDiv.attr('title', '');
            }
        }
    }
    return actionName;
    //#endregion
}

//handles the workflow submit button eventing
function doWorkflowSubmit(evt)
{
    //#region
    var information = jQuery(evt.target).closest("#WorkflowStrip").not(".drop-menu").data("WFInformation");
    var actionName = getWorkflowViewActionName(true);
    if (checkExists(information) && checkExists(actionName) && actionName.length > 0)
    {
        var xmlDoc = formBindingXml;
        var workflowSubmitEvent = null;
        var executeOnView = false;
        var actionViewID = null;
        if (_runtimeCallerType === "Form")
        {
            //action doesn't indicate the view but only the relevant instance
            if (checkExists(information.actionInstanceID))
            {
                var viewDef = getViewDefinition(null, information.actionInstanceID);
                if (checkExists(viewDef))
                {
                    actionViewID = viewDef.getAttribute("ID");
                }
            }
            if (checkExists(actionViewID))
            {
                executeOnView = verifyEventHandling(actionViewID, "View", "WorkflowSubmit", information.actionInstanceID, false);
            }
        }

        var xpath = null;
        if (executeOnView)
        {
            //this was set up from a view, which is now used on a form - there might still be some logic set up there
            xpath = "Events/Event[@SourceID='" + actionViewID + "'][@InstanceID='" + information.actionInstanceID + "'][@SourceType='View'][Name/text()='WorkflowSubmit']";
        }
        else
        {
            xpath = "Events/Event[@SourceID='" + currentForm + "'][@SourceType='" + _runtimeCallerType + "'][Name/text()='WorkflowSubmit']";
        }

        workflowSubmitEvent = $sn(xmlDoc, xpath);
        if (!checkExists(workflowSubmitEvent) && checkExists(runtimeNavigatedEvents))
        {
            workflowSubmitEvent = $sn(runtimeNavigatedEvents, xpath);
        }

        var workflowExecutionAction;
        if (workflowSubmitEvent)
        {
            workflowSubmitEvent = workflowSubmitEvent.cloneNode(true);
            var handlers = $mn(workflowSubmitEvent, "Handlers/Handler");

            for (var h = 0; h < handlers.length; h++)
            {
                var currentHandler = handlers[h];
                var conditionResult = true;
                //find correct workflow execution action and add the relevant parameters
                var conditions = $mn(currentHandler, "Conditions/Condition");
                if (checkExists(conditions))
                {
                    var c = conditions.length;
                    while (c--)
                    {
                        //evaluate all the conditions and decide on an outcome
                        conditionResult = validateConditions(conditions[c]);
                        if (conditionResult === false)
                        {
                            break;
                        }
                    }
                }
                if (conditionResult === true)
                {
                    workflowExecutionAction = $sn(currentHandler, "Actions/Action[@Type='ExecuteWorkflow'][@Method='ActionProcess']");
                    if (checkExists(workflowExecutionAction))
                    {
                        //only exit when a result was found - otherwise any handler without conditions will have resulted in a false positive - TFS628608
                        break;
                    }
                }
            }
        }
        else
        {
            xmlDoc = $xml("<Handlers><Handler><Actions><Action/></Actions></Handler></Handlers>");
            workflowExecutionAction = $sn(xmlDoc, "Handlers/Handler/Actions/Action");
            //set the required attributes
            workflowExecutionAction.setAttribute("Type", "ExecuteWorkflow");
            workflowExecutionAction.setAttribute("Method", "ActionProcess");
            workflowExecutionAction.setAttribute("ExecutionType", "Synchronous");
            workflowExecutionAction.setAttribute("ItemState", "All");
        }
        if (checkExists(workflowExecutionAction))
        {
            if (checkExists(information.WFAfterSubmitEventID))
            {
                workflowExecutionAction.setAttribute("WFAfterSubmitEventID", information.WFAfterSubmitEventID);
            }
            if (checkExists(information.WFMessage))
            {
                workflowExecutionAction.setAttribute("WFMessage", information.WFMessage);
            }
            if (checkExists(information.WFNavigateURL))
            {
                workflowExecutionAction.setAttribute("WFNavigateURL", information.WFNavigateURL);
            }

            var parameters = $sn(workflowExecutionAction, "Parameters");
            //if the actioning is set up in the workflowsubmit event, no need to manipulate - it will resolve automatically with the normal workflow logic
            //this is just for the automatic usage of the workflowsubmit button without any manipulation in terms of actioning
            if (!checkExists(parameters))
            {
                parameters = xmlDoc.createElement("Parameters");
                workflowExecutionAction.appendChild(parameters);
            }

            //create parameters for the action and serial number
            var actionParameter = $sn(parameters, "Parameter[@TargetID='ActionName'][@TargetType='WorkflowProcessProperty']");
            if (!checkExists(actionParameter))
            {
                actionParameter = xmlDoc.createElement("Parameter");
                actionParameter.setAttribute("TargetID", "ActionName");
                actionParameter.setAttribute("TargetType", "WorkflowProcessProperty");
                parameters.appendChild(actionParameter);


                var actionValue = xmlDoc.createElement("SourceValue");
                actionValue.appendChild(xmlDoc.createTextNode(actionName));
                actionParameter.appendChild(actionValue);
                actionParameter.setAttribute("SourceType", "Value");
            }

            var snParameter = $sn(parameters, "Parameter[@TargetID='SerialNumber'][@TargetType='WorkflowProcessProperty']");
            if (!checkExists(snParameter))
            {
                snParameter = xmlDoc.createElement("Parameter");
                snParameter.setAttribute("TargetID", "SerialNumber");
                snParameter.setAttribute("TargetType", "WorkflowProcessProperty");
                parameters.appendChild(snParameter);

                var snValue = xmlDoc.createElement("SourceValue");
                snValue.appendChild(xmlDoc.createTextNode(information.serialNumber));
                snParameter.appendChild(snValue);
                snParameter.setAttribute("SourceType", "Value");
            }
        }


        if (workflowSubmitEvent)
        {
            var handlersForBehaviour = constructHandlersForBehaviour(workflowSubmitEvent, [], null, "User");
            var masterRuntimeWindow = SourceCode.Forms.Runtime.getMasterRuntimeWindow();
            var behaviour = new masterRuntimeWindow.SourceCode.Forms.Runtime.BehaviourEvent({ handlers: handlersForBehaviour, SourceID: currentForm, methodExecuted: 'WorkflowSubmit', SourceType: _runtimeCallerType, SubformID: workflowSubmitEvent.getAttribute("SubformID"), InstanceID: workflowSubmitEvent.getAttribute("InstanceID"), TransferredID: workflowSubmitEvent.getAttribute("TransferredID"), windowToUse: window.self });
            behaviour.executeBehaviour();//correct usage
        }
        else if (checkExists(workflowExecutionAction))
        {
            workflowAction(workflowExecutionAction);
        }
    }
    //#endregion
}
