//#region Global Variables
var viewXmlCache = {};
var _runtimeControlTabIndexes = [];
var _runtimeListViewTabIndexes = [];
var _runtimeViewHeaderTabIndexes = [];
var _runtimeFilterTabIndexes = [];
var _runtimeFilterControlGroups = [];
var _runtimePopupControls = [];
var _runtimeActionRows = [];
var _runtimeActionRowTabIndexes = [];
var _runtimePopupWindows = [];
var _runtimeEmptyGuid = "00000000-0000-0000-0000-000000000000"; //replaced everywhere to ensure that it does not need to be typed again
var _runtimeAppleMobileRegex = /(Android|webOS|iPhone|iPad|iPod|BlackBerry|Mobile|IEMobile|Windows Phone|WebView)/i;
var _runtimeSafariRegex = /^((?!chrome|android|crios|fxios).)*safari/i;
var _runtimeLoopContextData = {};
var _runtimeGridWidgets = [];
var _runtimeViewLoadingTimers = {};
var _runtimeFieldsXmlHash = {};//contains field info when transforming from JSON to xml (backwards compatibility for controls)
var _runtimeMainTableInfo = {};//contains table properties based on maintable
var _runtimeELJoinHash = {};//contains join information for editable lists (showing associated values in display row)
var _runtimeControlInfoCache = {};//contains controlinformationobjects based on control id
var _runtimeExportToExcelData = {};

// Namespacing
var SourceCode = SourceCode ? SourceCode : {};
SourceCode.Forms = SourceCode.Forms ? SourceCode.Forms : {};
SourceCode.Forms.Runtime = SourceCode.Forms.Runtime ? SourceCode.Forms.Runtime : {};
SourceCode.Forms.Runtime.Grid = SourceCode.Forms.Runtime.Grid ? SourceCode.Forms.Runtime.Grid : {};
SourceCode.Forms.Runtime.Navigation = SourceCode.Forms.Runtime.Navigation ? SourceCode.Forms.Runtime.Navigation : {};

var SFR = SourceCode.Forms.Runtime;
var SFRGrid = SourceCode.Forms.Runtime.Grid;
//#endregion Global Variables

/**
 * Gets the main Runtime window object
 * @function getMasterRuntimeWindow
 * @returns {window}
 */
SourceCode.Forms.Runtime.getMasterRuntimeWindow = function ()
{
    // We cant run this on initial load because the scripts might not all be loaded.
    if (checkExists(this._masterRuntimeWindow))
    {
        return this._masterRuntimeWindow;
    }

    var windowObject = window;
    var currentLevel = windowObject.__runtimeFormLevel;

    try
    {
        while (checkExists(currentLevel) && currentLevel > 0 && checkExists(windowObject.parent) && windowObject !== windowObject.parent && checkExists(windowObject.parent.__runtimeFormLevel))
        {
            windowObject = windowObject.parent;
            currentLevel = windowObject.__runtimeFormLevel;
        }
    }
    catch (ex)
    {
        // Safety check when __runtimeFormLevel is not correct and we attempt to access an parent iframe variable that might trigger a cross-domain access error
        SFLog(
            {
                type: 5,
                source: "SourceCode.Forms.Runtime.getMasterRuntimeWindow",
                category: "Helper",
                message: "Get master runtime window error at level {0} on {1}".format(currentLevel, windowObject.name),
                exception: ex
            });
    }

    this._masterRuntimeWindow = windowObject;
    return windowObject;
};

/**
 * Locates the popup manager on the specified runtime window object to set the masterPopupManager variable
 * @function determineMasterPopupManager
 */
SourceCode.Forms.Runtime.determineMasterPopupManager = function ()
{
    try
    {
        var masterWindow = SourceCode.Forms.Runtime.getMasterRuntimeWindow();
        masterPopupManager = masterWindow.$.popupManager;
    }
    catch (exc)
    {
        masterPopupManager = window.$.popupManager;
    }
}

//TFS 795456 - Function added as a check for URLs that are being navigated to ie. not Subforms or Subforms
//Or initially a subform/subview is loaded up and then a URL loaded in the frame.
//Remember to change the equivalent function _.getPopupIframeContentWindow in jquery.forms.widget.popupwindow.js
SourceCode.Forms.Runtime.getPopupIframeContentWindow = function (popupIframe)
{

    if (checkExists(popupIframe) && (popupIframe.length > 0) && (popupIframe.hasClass("navigated") === false))
    {
        var innerWindow = popupIframe[0].contentWindow;
        if (checkExists(innerWindow))
        {
            return innerWindow;
        }
    }
    return null;
}

SourceCode.Forms.Runtime.getRuntimeInstanceName = function (obj)
{
    if (checkExists(obj))
    {
        if (checkExists(obj.__runtimeContextID) && checkExists(obj.__runtimeSubformID))
        {
            return obj.__runtimeContextID + "_" + obj.__runtimeSubformID;
        }

        // Return the supplied popup's iframe window InstanceName.
        var popupBody = checkExists(obj.controls) ? obj.controls.body : null;
        if (checkExists(popupBody))
        {
            var popupIframe = popupBody.find("iframe.runtime-popup");
            var innerWindow = SourceCode.Forms.Runtime.getPopupIframeContentWindow(popupIframe);
            if (innerWindow !== null)
            {
                return innerWindow.__runtimeContextID + "_" + innerWindow.__runtimeSubformID;

            }
        }
    }
    else
    {
        // Return the current context's InstanceName.
        return __runtimeContextID + "_" + __runtimeSubformID;
    }
    // We should never reach this code but if it's reached, don't assume a context because SourceCode.Forms.Runtime.setRuntimeDataProperty might override the wrong context's data.
    return "";
};

SourceCode.Forms.Runtime.setRuntimeDataProperty = function (runtimeInstanceName, key, value)
{
    var masterRuntimeWindow = SourceCode.Forms.Runtime.getMasterRuntimeWindow();
    if (!checkExists(masterRuntimeWindow.SourceCode.Forms.Runtime.RuntimeData))
    {
        masterRuntimeWindow.SourceCode.Forms.Runtime.RuntimeData = {};
    }
    masterRuntimeWindow.SourceCode.Forms.Runtime.RuntimeData[runtimeInstanceName + "_" + key] = value;
}

SourceCode.Forms.Runtime.getRuntimeDataProperty = function (runtimeInstanceName, key)
{
    var masterRuntimeWindow = SourceCode.Forms.Runtime.getMasterRuntimeWindow();
    if (!checkExists(masterRuntimeWindow.SourceCode.Forms.Runtime.RuntimeData))
    {
        masterRuntimeWindow.SourceCode.Forms.Runtime.RuntimeData = {};
    }

    return masterRuntimeWindow.SourceCode.Forms.Runtime.RuntimeData[runtimeInstanceName + "_" + key];
}

SourceCode.Forms.Runtime.removeRuntimeDataProperty = function (runtimeInstanceName, key)
{
    var masterRuntimeWindow = SourceCode.Forms.Runtime.getMasterRuntimeWindow();
    if (checkExists(masterRuntimeWindow.SourceCode.Forms.Runtime.RuntimeData))
    {
        delete masterRuntimeWindow.SourceCode.Forms.Runtime.RuntimeData[runtimeInstanceName + "_" + key];
    }
}

SourceCode.Forms.Runtime.getRuntimeDataKeys = function (filterFn)
{
    var masterRuntimeWindow = SourceCode.Forms.Runtime.getMasterRuntimeWindow();
    if (!checkExists(masterRuntimeWindow.SourceCode.Forms.Runtime.RuntimeData))
    {
        masterRuntimeWindow.SourceCode.Forms.Runtime.RuntimeData = {};
    }

    var retArray = [];
    var runtimeData = masterRuntimeWindow.SourceCode.Forms.Runtime.RuntimeData;

    for (var prop in runtimeData)
    {
        if (runtimeData.hasOwnProperty(prop))
        {
            if (typeof filterFn === "function")
            {
                if (filterFn(prop) === true)
                {
                    retArray.push(prop);
                }
            }
            else
            {
                retArray.push(prop);
            }
        }
    }

    return retArray;
}

//returns an array of all popups containing runtime iframe instances; this is to better sync the __runtimeFormLevel variable with the indexes in the array; index in array will always be __runtimeFormLevel minus one since all non-runtime instance popups are filtered out
SourceCode.Forms.Runtime.getAllPopupsWithRuntimeInstances = function ()
{
    var runtimeInstancePopups = [];

    if (checkExists(masterPopupManager) && checkExists(masterPopupManager.popUps) && masterPopupManager.popUps.length > 0)
    {
        for (var i = 0; i < masterPopupManager.popUps.length; i++)
        {
            var currentPopup = masterPopupManager.popUps[i];

            if (checkExists(currentPopup.controls) && checkExists(currentPopup.controls.body))
            {
                var runtimeIframe = currentPopup.controls.body.find("iframe.runtime-popup");
                var innerWindow = SourceCode.Forms.Runtime.getPopupIframeContentWindow(runtimeIframe);
                if (innerWindow !== null)
                {
                    runtimeInstancePopups.push(currentPopup);
                }
            }
        }
    }

    return runtimeInstancePopups;
}

//return the top popup containing a runtime iframe instance which is not currently busy closing; can be limited by the "topAllowedLevel" variable to only return non-closing popups with a __runtimeFormLevel<=topAllowedLevel
SourceCode.Forms.Runtime.getTopNonClosingRuntimeInstancePopup = function (topAllowedLevel)
{
    var topNonClosingRuntimeInstancePopup = null;

    var runtimeInstancePopups = SourceCode.Forms.Runtime.getAllPopupsWithRuntimeInstances();
    var runtimeInstancePopupsLength = runtimeInstancePopups.length;

    if (runtimeInstancePopupsLength > 0)
    {
        var topPossibleIndex = runtimeInstancePopupsLength - 1;
        var topAllowedIndex = topPossibleIndex;

        if (checkExists(topAllowedLevel))
        {
            //popup at index 0 has a __runtimeFormLevel of 1, since __runtimeFormLevel of 0 is on the main form itself, thus index = level - 1
            topAllowedIndex = topAllowedLevel - 1;

            if (topAllowedIndex > topPossibleIndex)
            {
                topAllowedIndex = topPossibleIndex;
            }
        }

        var i = topAllowedIndex;

        while (!checkExists(topNonClosingRuntimeInstancePopup) && i > -1)
        {
            var currentPopup = runtimeInstancePopups[i];

            if (currentPopup.isClosing !== true)
            {
                topNonClosingRuntimeInstancePopup = currentPopup;
            }

            i--;
        }
    }

    return topNonClosingRuntimeInstancePopup;
}

SourceCode.Forms.Runtime.Navigation.convertSubformNode = function (itemNode, subformID, contextID, isOpeningSubView)
{
    if (checkExists(subformID))
    {
        itemNode.removeAttribute("SubformID");
        itemNode.setAttribute("TransferredID", subformID);

        // SFIID TODO - remove the check for Function when Handlers are completed
        // When opening a subview, remove the instance IDs for functions.
        if (itemNode.nodeName !== "Function" || isOpeningSubView)
        {
            // Keep record of the old InstanceID to allow filtering for navigated Events for self opening and extending Forms/Views.
            var origInstanceID = itemNode.getAttribute("InstanceID");
            if (checkExists(origInstanceID))
            {
                itemNode.setAttribute("OrigInstanceID", origInstanceID);
            }

            var subformInstanceID = itemNode.getAttribute("SubformInstanceID");
            if (checkExists(subformInstanceID))
            {
                itemNode.removeAttribute("SubformInstanceID");
                itemNode.setAttribute("InstanceID", subformInstanceID);
            }
            else
            {
                // If there is no SubformInstanceID then it means it's simply an extended rule. Remove the InstanceID.
                itemNode.removeAttribute("InstanceID");
            }
        }
    }

    if (checkExists(contextID))
    {
        itemNode.setAttribute("RuntimeContextID", contextID);
    }
};

SourceCode.Forms.Runtime.Navigation.convertSourceSubformNode = function (itemNode, subformID, contextID)
{
    if (checkExists(subformID))
    {
        itemNode.removeAttribute("SourceSubFormID");
        itemNode.setAttribute("SourceTransferredID", subformID);

        var origInstanceID = itemNode.getAttribute("SourceInstanceID");
        if (checkExists(origInstanceID))
        {
            itemNode.setAttribute("SourceOrigInstanceID", origInstanceID);
        }

        var subformInstanceID = itemNode.getAttribute("SourceSubFormInstanceID");
        if (checkExists(subformInstanceID))
        {
            itemNode.removeAttribute("SourceSubFormInstanceID");
            itemNode.setAttribute("SourceInstanceID", subformInstanceID);
        }
        else
        {
            itemNode.removeAttribute("SourceInstanceID");
        }
    }

    if (checkExists(contextID))
    {
        itemNode.setAttribute("SourceRuntimeContextID", contextID);
    }
};

SourceCode.Forms.Runtime.Navigation.convertTargetSubformNode = function (itemNode, subformID, contextID)
{
    if (checkExists(subformID))
    {
        itemNode.removeAttribute("TargetSubFormID");
        itemNode.setAttribute("TargetTransferredID", subformID);

        var origInstanceID = itemNode.getAttribute("TargetInstanceID");
        if (checkExists(origInstanceID))
        {
            itemNode.setAttribute("TargetOrigInstanceID", origInstanceID);
        }

        var subformInstanceID = itemNode.getAttribute("TargetSubFormInstanceID");
        if (checkExists(subformInstanceID))
        {
            itemNode.removeAttribute("TargetSubFormInstanceID");
            itemNode.setAttribute("TargetInstanceID", subformInstanceID);
        }
        else
        {
            itemNode.removeAttribute("TargetInstanceID");
        }
    }

    if (checkExists(contextID))
    {
        itemNode.setAttribute("TargetRuntimeContextID", contextID);
    }
};

SourceCode.Forms.Runtime.Navigation.isBehaviorContextAction = function (itemNode)
{
    var result = false;

    if (checkExists(itemNode))
    {
        if (itemNode.nodeName === "Action")
        {
            switch (itemNode.getAttribute("Type"))
            {
                case "Navigate":
                case "Focus":
                case "Open":
                case "Popup":
                case "Prompt":
                case "ShowMessage":
                case "SendMail":
                case "Exit":
                case "Continue":
                    result = true;
                    break;
                case "Close":
                    // Close a Subform and Execute a View Method Exception
                    if (!checkExists(itemNode.getAttribute("ViewID")) && !checkExists(itemNode.getAttribute("Method")))
                    {
                        result = true;
                    }
                    break;
                default:
                    break;
            }
        }
    }

    return result;
};


SourceCode.Forms.Runtime.Grid.execute = function (options)
{
    //If no options are defined -> invalid function call -> return
    if ((typeof options === "undefined") || (options === null))
    {
        return null;
    }

    var windowToUse = options.window || window;
    var fn = options.fn || null;
    var params = options.params || [];

    var jqGrid = null;

    //Determine jQuery grid element either from the sent through element or the sent through id
    if ((typeof options.element !== "undefined") && (options.element !== null))
    {
        jqGrid = options.element;
    }
    else if ((typeof options.id !== "undefined") && (options.id !== null))
    {
        var grid = windowToUse.document.getElementById(options.id);

        if (grid !== null)
        {
            jqGrid = windowToUse.jQuery(grid);
        }
    }

    //If no jQuery grid can be determined -> return since a grid is necessary for the function
    if (jqGrid === null)
    {
        return null;
    }

    //If a function is defined -> determine is the jQuery grid is actually a grid widget
    //-> if it is not a grid widget -> return since the function call will fail with a js error
    if (fn !== null)
    {
        var isGridWidget = (windowToUse._runtimeGridWidgets.indexOf(jqGrid[0].id) !== -1);

        if (!isGridWidget)
        {
            isGridWidget = jqGrid.isWidget("grid");

            if (isGridWidget)
            {
                windowToUse._runtimeGridWidgets.push(jqGrid[0].id);
            }
        }

        if (isGridWidget)
        {
            params.unshift(fn);
        }
        else
        {
            return null;
        }
    }

    return jqGrid.grid.apply(jqGrid, params);
};

SourceCode.Forms.Runtime.getSerializedContextDraft = function ()
{
    var initialFocussedElem = checkExists(document) ? document.activeElement : null;
    var jqInitialFocussedElem = checkExists(initialFocussedElem) ? jQuery(initialFocussedElem) : null;

    if (checkExists(jqInitialFocussedElem))
    {
        jqInitialFocussedElem.trigger("blur");
    }

    //Regardless of which level saving is triggered from, save should occur for whole runtime instance, thus mainly use masterRuntimeWindow
    var masterRuntimeWindow = SourceCode.Forms.Runtime.getMasterRuntimeWindow();

    var returnDraftString = "";
    var returnDraft = {};

    var existingDraftInfo = checkExists(masterRuntimeWindow._runtimeDraftInfo) ? masterRuntimeWindow._runtimeDraftInfo : {};

    var existingDraftId = existingDraftInfo.id;
    var existingDraftCreatedDate = existingDraftInfo.createdDate;

    var currentLongDateAndTime = getDateInCorrectFormat(new Date());

    returnDraft.id = checkExistsNotEmpty(existingDraftId) ? existingDraftId : String.generateGuid();
    returnDraft.createdDate = checkExistsNotEmpty(existingDraftCreatedDate) ? existingDraftCreatedDate : currentLongDateAndTime;
    returnDraft.modifiedDate = currentLongDateAndTime;
    returnDraft.contextType = masterRuntimeWindow._runtimeCallerType;
    returnDraft.contextId = masterRuntimeWindow.currentForm;
    //_runtimeArtifactName and _runtimeArtifactDisplayName html encoded when declared
    //have to html decode it before using it
    returnDraft.contextName = checkExistsNotEmpty(masterRuntimeWindow._runtimeArtifactName) ? masterRuntimeWindow._runtimeArtifactName.htmlDecode() : "";
    returnDraft.contextDisplayName = checkExistsNotEmpty(masterRuntimeWindow._runtimeArtifactDisplayName) ? masterRuntimeWindow._runtimeArtifactDisplayName.htmlDecode() : "";
    returnDraft.contextCheckSum = masterRuntimeWindow._runtimeArtifactVersion;
    returnDraft.contextModifiedDate = masterRuntimeWindow._runtimeArtifactModifiedDateTime;

    returnDraft.data = {
        views: []
    };

    returnDraft.errors = [];

    var globalsData = SFR._getSerializedGlobalVariablesData({ windowToUse: masterRuntimeWindow });

    if (globalsData !== null)
    {
        returnDraft.data.globals = globalsData;
    }

    if (checkExists(masterRuntimeWindow.viewControllerDefinition))
    {
        var controllers = masterRuntimeWindow.viewControllerDefinition.selectNodes("Controllers/Controller");

        for (var i = 0; i < controllers.length; i++)
        {
            var controller = controllers[i];

            var controllerTypeView = getNodeAttribute("TypeView", controller, "").toUpperCase();

            if ((controllerTypeView === "CAPTURE") || (controllerTypeView === "LIST"))
            {
                var viewData = SFR._getSerializedViewStateData({ view: controller, errors: returnDraft.errors });

                if (viewData !== null)
                {
                    returnDraft.data.views.push(viewData);
                }
            }
            else if (controllerTypeView === "") // Form
            {
                var controlsData = SFR._getSerializedControlsStateData({ controller: controller, errors: returnDraft.errors });

                if (controlsData !== null)
                {
                    returnDraft.data.controls = controlsData;
                }
            }
        }

        returnDraft.allControlsSupportDrafts = SFR._isAllControlsSupportDrafts({ definition: masterRuntimeWindow.viewControllerDefinition });
    }

    var workflowStripData = SFR._getSerializedWorkflowStripData({ windowToUse: masterRuntimeWindow });
    if (checkExists(workflowStripData))
    {
        returnDraft.data.workflowStripData = workflowStripData;
    }

    if (returnDraft.data.views.length === 0)
    {
        delete returnDraft.data.views;
    }

    if (Object.keys(returnDraft.data).length === 0)
    {
        delete returnDraft.data;
    }

    if (returnDraft.errors.length === 0)
    {
        delete returnDraft.errors;
    }

    returnDraftString = JSON.stringify(returnDraft);

    if (checkExists(jqInitialFocussedElem))
    {
        jqInitialFocussedElem.trigger("focus");
    }

    return returnDraftString;
};

SourceCode.Forms.Runtime._getSerializedGlobalVariablesData = function (options)
{
    var options = checkExists(options) ? options : {};

    var windowToUse = checkExists(options.windowToUse) ? options.windowToUse : window;

    var returnData = {};

    //#region ViewHiddenHash
    var serializedViewHiddenHash = SFR._getSerializedViewHiddenHash({ windowToUse: windowToUse });

    if (serializedViewHiddenHash !== null)
    {
        returnData["ViewHiddenHash"] = serializedViewHiddenHash;
    }
    //#endregion

    //#region Information
    var serializedInformation = SFR.Information.saveState();

    if (serializedInformation !== null)
    {
        returnData["Information"] = serializedInformation;
    }
    //#endregion

    //#region viewWriteStatus
    var serializedViewWriteStatus = SFR._getSerializedViewWriteStatus({ windowToUse: windowToUse });

    if (serializedViewWriteStatus !== null)
    {
        returnData["viewWriteStatus"] = serializedViewWriteStatus;
    }
    //#endregion

    //#region _runtimeParameters
    if (_runtimeParameters !== null)
    {
        returnData.Parameters = _runtimeParameters;
    }
    //#endregion

    var basicGlobals = [
        "_runtimeIsInitializing",
        "_runtimeIdleState"
    ];

    for (var i = 0; i < basicGlobals.length; i++)
    {
        var globalKey = basicGlobals[i];

        var globalValue = windowToUse[globalKey];

        if (checkExists(globalValue))
        {
            returnData[globalKey] = globalValue;
        }
    }

    if (Object.keys(returnData).length === 0)
    {
        returnData = null;
    }

    return returnData;
};

SourceCode.Forms.Runtime._getSerializedViewHiddenHash = function (options)
{
    var options = checkExists(options) ? options : {};

    var windowToUse = checkExists(options.windowToUse) ? options.windowToUse : window;

    var keys = windowToUse.getAllViewHiddenHashNames();

    if (!checkExists(keys) || (keys.length === 0))
    {
        return null;
    }

    var returnData = {};

    for (var i = 0; i < keys.length; i++)
    {
        var key = keys[i];

        var currentViewHiddenHash = windowToUse.ViewHiddenHash[key];
        returnData[key] = currentViewHiddenHash;

    }

    if (Object.keys(returnData).length === 0)
    {
        returnData = null;
    }

    return returnData;
};

SourceCode.Forms.Runtime._getSerializedViewWriteStatus = function (options)
{
    var options = checkExists(options) ? options : {};

    var windowToUse = checkExists(options.windowToUse) ? options.windowToUse : window;

    var keys = windowToUse.getAllViewWriteStatusNames();

    if (!checkExists(keys) || (keys.length === 0))
    {
        return null;
    }

    var returnData = {};

    for (var i = 0; i < keys.length; i++)
    {
        var key = keys[i];

        var currentViewWriteStatus = windowToUse.viewWriteStatus[key];

        if (checkExists(currentViewWriteStatus))
        {
            returnData[key] = currentViewWriteStatus;
        }
    }

    if (Object.keys(returnData).length === 0)
    {
        returnData = null;
    }

    return returnData;
};

SourceCode.Forms.Runtime._getSerializedXmlDocData = function (options)
{
    if (!checkExists(options) || !checkExists(options.xmlDoc))
    {
        return null;
    }

    var xmlDoc = options.xmlDoc;

    return xmlDoc.xml;
};

SourceCode.Forms.Runtime._getSerializedWorkflowStripData = function (options)
{
    var result = null;

    if (!checkExists(options))
    {
        return result;
    }

    var windowToUse = checkExists(options.windowToUse) ? options.windowToUse : window;

    // First check if the wf strip is rendered.
    var wfStripElem = windowToUse.jQuery("#WorkflowStrip").not(".drop-menu");
    if (wfStripElem.length > 0)
    {
        result = {};

        var data = wfStripElem.data("WFInformation");
        if (checkExists(data))
        {
            result.data = data;
        }
    }

    if (checkExists(windowToUse.workflowInfo))
    {
        result.workflowInfo = windowToUse.workflowInfo;
    }

    return result;
}

SourceCode.Forms.Runtime._getSerializedViewStateData = function (options)
{
    if (!checkExists(options) || !checkExists(options.view))
    {
        return null;
    }

    var returnData = {};

    var view = options.view;

    returnData.id = getNodeAttribute("ID", view, "");
    returnData.instanceId = getNodeAttribute("InstanceID", view, "");

    var mainTable = getNodeAttribute("MainTable", view, "");
    var jqView = $("#" + mainTable);
    returnData.stateData = jqView.SFCAreaItem("saveState");
    if (returnData.stateData === jqView)
    {
        returnData.stateData = null;
    }

    var controlsData = SFR._getSerializedControlsStateData({ controller: view, errors: options.errors });

    if (controlsData !== null)
    {
        returnData.controls = controlsData;
    }

    if (Object.keys(returnData).length === 0)
    {
        returnData = null;
    }

    return returnData;
};

SourceCode.Forms.Runtime._getSerializedGridAttributes = function (options)
{
    if (!checkExists(options) || !checkExists(options.gridElement))
    {
        return null;
    }

    var returnData = {};

    var gridElement = options.gridElement;

    var supportedGridAttributes = [
        "previousactionxml",
        "actionxml",
        "hasrowcount",
        "pagenumber",
        "hasmorepages",
        "numberofpages",
        "resetpagenumber",
        "pagesize",
        "orderbyresultname",
        "orderby",
        "orderdirection",
        "paging",
        "listrefreshed",
        "maxcounter",
        "isdisabled",
        "qfname",
        "qfvalue"
    ];

    for (var i = 0; i < supportedGridAttributes.length; i++)
    {
        var attribute = supportedGridAttributes[i];

        var attributeValue = gridElement[0].getAttribute(attribute);

        if (checkExists(attributeValue))
        {
            returnData[attribute] = attributeValue;
        }
    }

    if (Object.keys(returnData).length === 0)
    {
        returnData = null;
    }

    return returnData;
};

SourceCode.Forms.Runtime._getSerializedControlsStateData = function (options)
{
    if (!checkExists(options) || !checkExists(options.controller))
    {
        return null;
    }

    var returnData = [];

    var controller = options.controller;

    var controls = controller.selectNodes("Controls/Control[Properties/Property[(Name='SaveStateMethod') and (Value) and (Value!='')]]");

    for (var i = 0; i < controls.length; i++)
    {
        var controlData = SFR._getSerializedControlStateData({ control: controls[i], errors: options.errors });

        if (checkExists(controlData))
        {
            returnData.push(controlData);
        }
    }

    if (returnData.length === 0)
    {
        returnData = null;
    }

    return returnData;
};

SourceCode.Forms.Runtime._getSerializedControlStateData = function (options)
{
    if (!checkExists(options) || !checkExists(options.control))
    {
        return null;
    }

    var returnData = {};

    var control = options.control;

    var id = getNodeAttribute("ID", control, "");

    if (id !== "")
    {
        returnData.id = id;
    }

    var name = getNodeAttribute("Name", control, "");

    if (name !== "")
    {
        returnData.name = name;
    }

    var objInfo = new PopulateObject(null, null, id);
    var stateData = executeControlFunction(control, "SaveStateMethod", objInfo);

    if (checkExistsNotEmpty(stateData))
    {
        if (stateData instanceof SourceCode.Forms.Runtime.Drafts.DraftSaveException && Array.isArray(options.errors))
        {
            options.errors.push(stateData);
        }
        else if (typeof stateData === "string")
        {
            returnData.stateData = JSON.parse(stateData);
        }
        else if (checkExists(stateData))
        {
            returnData.stateData = stateData;
        }
    }

    if (Object.keys(returnData).length === 0 || stateData instanceof SourceCode.Forms.Runtime.Drafts.DraftSaveException)
    {
        returnData = null;
    }

    return returnData;
};

SourceCode.Forms.Runtime._isAllControlsSupportDrafts = function (options)
{
    if (!checkExists(options) && !checkExists(options.definition))
    {
        return null;
    }

    //A blacklist of control types that doesn't support drafts
    var types = SourceCode.Forms.Runtime._getDraftsIgnoredControlTypes();

    var i = 0;
    var xpathAttributes = "not(@Type='" + types[0] + "')";
    for (i = 1; i < types.length; i++)
    {
        xpathAttributes += " and not(@Type='" + types[i] + "')";
    }

    var controls = options.definition.selectNodes("//Controls/Control[" + xpathAttributes + "]");

    if (!checkExists(controls) || controls.length === 0)
    {
        return true;
    }

    var propertyNode = null;
    var allControlsSupportDrafts = true;
    for (i = 0; i < controls.length; i++)
    {
        propertyNode = controls[i].selectNodes("Properties/Property[(Name='SaveStateMethod') and (Value) and (Value!='')]");

        if (!checkExists(propertyNode) || propertyNode.length === 0)
        {
            allControlsSupportDrafts = false;
        }
    }

    return allControlsSupportDrafts;
};

SourceCode.Forms.Runtime._getDraftsIgnoredControlTypes = function ()
{
    //A blacklist of control types that doesn't support drafts
    var types = [
        "Table",
        "ListTable",
        "ToolbarTable",
        "View",
        "Panel",
        "Area",
        "AreaItem",
        "Section",
        "Column",
        "Row",
        "Cell",
        "SourceCode-QA-SmartFormsTester-SmartFormsTester"];

    return types;
};


SourceCode.Forms.Runtime.loadFromDraft = function ()
{
    if (checkExists(SourceCode.Forms.Runtime.MobileBridge) && checkExists(SourceCode.Forms.Runtime.MobileBridge.sendToMobileDevice))
    {
        var loadDraftPromise = SourceCode.Forms.Runtime.MobileBridge.sendToMobileDevice({ methodName: "loadDraft", draftId: _runtimeDraftInfo.id });

        loadDraftPromise.done(SFR.applyDraft);
    }
    else
    {
        _runtimeLoadingFromDraft = false;
    }
};

SourceCode.Forms.Runtime.applyDraft = function (options)
{
    var rawDraft = options.data;

    if (checkExistsNotEmpty(rawDraft))
    {
        var draft = null;

        if (typeof rawDraft === "string")
        {
            draft = JSON.parse(rawDraft);
        }
        else
        {
            draft = rawDraft;
        }

        if (checkExists(draft))
        {
            //Regardless of which level loading is triggered from, load should occur for whole runtime instance, thus mainly use masterRuntimeWindow
            var masterRuntimeWindow = SourceCode.Forms.Runtime.getMasterRuntimeWindow();

            masterRuntimeWindow._runtimeDraftInfo.createdDate = draft.createdDate;

            var data = draft.data;

            if (checkExists(data))
            {
                SFR._applyGlobalsFromDraft({ windowToUse: masterRuntimeWindow, globals: data.globals });

                SFR._applyViewsFromDraft({ windowToUse: masterRuntimeWindow, views: data.views });

                SFR._applyControlsFromDraft({ windowToUse: masterRuntimeWindow, controls: data.controls });

                SFR._applyWorkflowStripFromDraft({ windowToUse: masterRuntimeWindow, workflowStripData: data.workflowStripData });
            }
        }
    }

    _runtimeLoadingFromDraft = false;
};

SourceCode.Forms.Runtime._applyWorkflowStripFromDraft = function (options)
{
    if (!checkExists(options) || !checkExists(options.workflowStripData))
    {
        return;
    }

    var windowToUse = checkExists(options.windowToUse) ? options.windowToUse : window;
    var workflowStripData = options.workflowStripData;

    // Restore data.
    var wfStripElem = windowToUse.jQuery("#WorkflowStrip").not(".drop-menu");
    if (wfStripElem.length > 0 && checkExists(workflowStripData.data))
    {
        // Render the workflow strip.
        windowToUse.positionAndShowWorkflowStrip(workflowStripData.data.workflowStrip);

        // Set data.
        wfStripElem.data("WFInformation", workflowStripData.data);

        // Worlfow Actions.
        windowToUse.populateWorkflowStrip(workflowStripData.data);
    }

    if (checkExists(workflowStripData.workflowInfo) && !checkExists(windowToUse.workflowInfo))
    {
        windowToUse.workflowInfo = workflowStripData.workflowInfo;
    }

    // Bind Click.
    var workflowSubmitButton = windowToUse.jQuery("*[id$=_6f1d43bf-a7fe-21ed-36ac-0d3bcb633bfb]");
    workflowSubmitButton.off("click").on("click", windowToUse.doWorkflowSubmit);
};

SourceCode.Forms.Runtime._applyGlobalsFromDraft = function (options)
{
    if (!checkExists(options) || !checkExists(options.globals))
    {
        return;
    }

    var windowToUse = checkExists(options.windowToUse) ? options.windowToUse : window;

    var globals = options.globals;

    SFR._applyViewHiddenHashFromDraft({ windowToUse: windowToUse, globals: globals });

    SFR.Information.loadState(globals.Information);

    SFR._applyViewWriteStatusFromDraft({ windowToUse: windowToUse, globals: globals });

    SFR._applyParametersFromDraft({ windowToUse: windowToUse, globals: globals });

    SFR._applyGlobalFromDraft({ windowToUse: windowToUse, globals: globals, globalName: "_runtimeIsInitializing" });

    SFR._applyGlobalFromDraft({ windowToUse: windowToUse, globals: globals, globalName: "_runtimeIdleState" });
};

SourceCode.Forms.Runtime._applyGlobalFromDraft = function (options)
{
    if (!checkExists(options) || !checkExists(options.globals) || !checkExists(options.globalName))
    {
        return;
    }

    var windowToUse = checkExists(options.windowToUse) ? options.windowToUse : window;

    var globals = options.globals;
    var globalName = options.globalName;

    var globalValue = globals[globalName];

    if (checkExists(globalValue))
    {
        windowToUse[globalName] = globalValue;
    }
};

SourceCode.Forms.Runtime._applyViewHiddenHashFromDraft = function (options)
{
    if (!checkExists(options) || !checkExists(options.globals))
    {
        return;
    }

    var windowToUse = checkExists(options.windowToUse) ? options.windowToUse : window;

    var globals = options.globals;

    var serializedViewHiddenHash = globals["ViewHiddenHash"];

    if (checkExists(serializedViewHiddenHash))
    {
        var keys = Object.keys(serializedViewHiddenHash);

        for (var i = 0; i < keys.length; i++)
        {
            var key = keys[i];
            var currentSerializedViewHiddenHash = serializedViewHiddenHash[key];
            windowToUse.ViewHiddenHash[key] = currentSerializedViewHiddenHash;
        }
    }
};

SourceCode.Forms.Runtime._applyViewWriteStatusFromDraft = function (options)
{
    if (!checkExists(options) || !checkExists(options.globals))
    {
        return;
    }

    var windowToUse = checkExists(options.windowToUse) ? options.windowToUse : window;

    var globals = options.globals;

    var serializedViewWriteStatus = globals["viewWriteStatus"];

    if (checkExists(serializedViewWriteStatus))
    {
        var keys = Object.keys(serializedViewWriteStatus);

        for (var i = 0; i < keys.length; i++)
        {
            var key = keys[i];

            var currentViewWriteStatus = serializedViewWriteStatus[key];

            if (checkExists(currentViewWriteStatus))
            {
                windowToUse.viewWriteStatus[key] = currentViewWriteStatus;
            }
        }
    }
};

SourceCode.Forms.Runtime._applyParametersFromDraft = function (options)
{
    if (!checkExists(options) || !checkExists(options.globals))
    {
        return;
    }

    var windowToUse = checkExists(options.windowToUse) ? options.windowToUse : window;

    var globals = options.globals;

    if (checkExists(globals.Parameters))
    {
        windowToUse._runtimeParameters = globals.Parameters;
    }
};

SourceCode.Forms.Runtime._applyXmlDocFromDraft = function (options)
{
    if (!checkExists(options) || !checkExistsNotEmpty(options.xmlDoc))
    {
        return null;
    }

    var xmlDoc = options.xmlDoc;

    return jQuery.parseXML(xmlDoc);
};

SourceCode.Forms.Runtime._applyViewsFromDraft = function (options)
{
    if (!checkExists(options) || !checkExists(options.views) || (options.views.length === 0))
    {
        return;
    }

    var windowToUse = checkExists(options.windowToUse) ? options.windowToUse : window;

    var views = options.views;

    for (var i = 0; i < views.length; i++)
    {
        SFR._applyViewFromDraft({ windowToUse: windowToUse, view: views[i] });
    }
};

SourceCode.Forms.Runtime._applyViewFromDraft = function (options)
{
    if (!checkExists(options) || !checkExists(options.view) || !checkExists(options.view.id) || !checkExists(options.view.instanceId))
    {
        return;
    }

    var windowToUse = checkExists(options.windowToUse) ? options.windowToUse : window;
    var viewId = options.view.id;
    var instanceId = options.view.instanceId;

    var view = windowToUse.returnCurrentViewXML(viewId, instanceId);

    var viewControlId = getNodeAttribute("MainTable", view, "");
    if (viewControlId !== "")
    {
        var gridElement = windowToUse.jQuery("#" + viewControlId);
        gridElement.SFCAreaItem("loadState", options.view.stateData);
    }
    SFR._applyControlsFromDraft({ windowToUse: windowToUse, viewId: options.view.id, instanceId: options.view.instanceId, controls: options.view.controls });
};

SourceCode.Forms.Runtime._applyGridAttributesFromDraft = function (options)
{
    if (!checkExists(options) || !checkExists(options.gridElement) || !checkExists(options.attributes))
    {
        return;
    }

    var windowToUse = checkExists(options.windowToUse) ? options.windowToUse : window;
    var gridElement = options.gridElement;
    var attributes = options.attributes;

    var simpleGridAttributes = [
        "previousactionxml",
        "actionxml",
        "orderbyresultname",
        "orderby",
        "orderdirection",
        "paging",
        "listrefreshed",
        "maxcounter",
        "isdisabled",
        "qfname",
        "qfvalue"
    ];

    for (var i = 0; i < simpleGridAttributes.length; i++)
    {
        var attribute = simpleGridAttributes[i];
        var attributeValue = attributes[attribute];

        if (checkExists(attributeValue))
        {
            gridElement[0].setAttribute(attribute, attributeValue);
        }
    }
    // pagesize will always be saved if there was paging
    if (checkExistsNotEmpty(attributes.pagesize))
    {
        //in the case that a view never has been populated the page size will save but the rest of the attributes will be null
        //code changed in populatePagingControls handles null values better.
        //we still end up with the incorrect state where the next page button is enabled
        //pagenumber is checked to avoid this
        if (checkExistsNotEmpty(attributes.pagenumber))
        {
            windowToUse.populatePagingControls(
                gridElement[0],
                attributes.pagesize,
                attributes.pagenumber,
                attributes.numberofpages,
                attributes.hasmorepages,
                attributes.hasrowcount,
                attributes.resetpagenumber
            );
        }
        else
        {
            //since we saved this we must restore it even though the full populate function is not being called
            gridElement[0].setAttribute(pagesize, attributes.pagesize);
        }

    }
};
SourceCode.Forms.Runtime._applyGridRowsFromDraft = function (options)
{
    if (!checkExists(options) || !checkExists(options.gridId) || !checkExists(options.viewId) || !checkExists(options.instanceId))
    {
        return;
    }

    var windowToUse = checkExists(options.windowToUse) ? options.windowToUse : window;
    var gridId = options.gridId;
    var viewId = options.viewId;
    var instanceId = options.instanceId;

    var currentViewHiddenHash = windowToUse.getViewHiddenHash(viewId, instanceId);

    if (checkExists(currentViewHiddenHash))
    {
        var gridRows = [];

        for (var i = 0; i < currentViewHiddenHash.length; i++)
        {
            var currentRow = currentViewHiddenHash[i];

            if (checkExistsNotEmpty(currentRow.counter))
            {
                gridRows.push(currentRow);
            }
        }

        windowToUse.rebuildTable(gridId, viewId, instanceId, false, false, true, gridRows, true);
    }
};

SourceCode.Forms.Runtime._applyControlsFromDraft = function (options)
{
    if (!checkExists(options) || !checkExists(options.controls) || (options.controls.length === 0))
    {
        return;
    }

    var windowToUse = checkExists(options.windowToUse) ? options.windowToUse : window;
    var viewId = checkExistsNotEmpty(options.viewId) ? options.viewId : null;
    var instanceId = checkExistsNotEmpty(options.instanceId) ? options.instanceId : null;

    var controls = options.controls;

    for (var i = 0; i < controls.length; i++)
    {
        SFR._applyControlFromDraft({ windowToUse: windowToUse, viewId: viewId, instanceId: instanceId, control: controls[i] });
    }
};

SourceCode.Forms.Runtime._applyControlFromDraft = function (options)
{
    if (!checkExists(options) || !checkExists(options.control))
    {
        return;
    }

    var windowToUse = checkExists(options.windowToUse) ? options.windowToUse : window;
    var viewId = checkExistsNotEmpty(options.viewId) ? options.viewId : null;
    var instanceId = checkExistsNotEmpty(options.instanceId) ? options.instanceId : null;

    var control = options.control;

    var id = control.id;

    if (checkExistsNotEmpty(id) && checkExists(control.stateData))
    {
        var controllerFindObjectOptions = {
            xmlDoc: windowToUse.viewControllerDefinition,
            viewID: viewId,
            instanceID: instanceId,
            controlID: id,
            propertySearch: "LoadStateMethod"
        };

        var controlXml = _runtimeControllerFindObject(controllerFindObjectOptions);

        var listingControlItemsInfo = SourceCode.Forms.Runtime._loadListingControlData(
            {
                controlId: id,
                viewId: options.viewId,
                instanceId: options.instanceId
            });

        if (listingControlItemsInfo)
        {
            control.stateData.listingControlItemsInfo = listingControlItemsInfo;
        }

        if (checkExists(controlXml))
        {
            var objInfo = new PopulateObject(null, control.stateData, id);
            executeControlFunction(controlXml, "LoadStateMethod", objInfo);
        }
    }
};

SourceCode.Forms.Runtime._loadListingControlData = function (options)
{
    var listingControlItemsInfo = SourceCode.Forms.Runtime._loadListingControlDataFromFields(options);
    if (!listingControlItemsInfo)
    {
        listingControlItemsInfo = SourceCode.Forms.Runtime._loadListingControlDataFromWorkflowActions(options);
    }
    return listingControlItemsInfo;
}

SourceCode.Forms.Runtime._loadListingControlDataFromFields = function (options)
{
    var comparisonObj = { parenttype: "Object", controlid: options.controlId, counter: true };
    var hiddenFields = getHiddenPropertyCollection(options.viewId, options.instanceId, comparisonObj);
    if (checkExists(hiddenFields) && hiddenFields.length > 0)
    {
        var brokerpackage = SourceCode.Forms.Runtime.Information.getControlBrokerHistory({ viewId: options.viewId, instanceId: options.instanceId, controlId: options.controlId });
        if (checkExists(brokerpackage))
        {
            // always call the filter method, even when there is no proper filter xml. The filter method will filter by smartObjectId,
            // make sure that only items with counters are returned, and correct the ordering (because reverse:true)
            var results = filterListClientSide(brokerpackage, hiddenFields, {
                reverse: false
            });
        }
        return new PopulateObject(null, null, options.controlId, null, null, results);
    }
    return null;
}

SourceCode.Forms.Runtime._loadListingControlDataFromWorkflowActions = function (options)
{
    var results = SourceCode.Forms.Runtime.Information.getControlWorkflowHistory({ viewId: options.viewId, instanceId: options.instanceId, controlId: options.controlId });

    if (checkExists(results))
    {
        return new PopulateObject(null, null, options.controlId, null, null, results);
    }
    return null;
}

//#region tab index
function manageEnabledStateTabIndex(control)
{
    popuplateTabIndexCache(control);
    // We don't check if the control functions exist. If they don't then this helper function shouldn't be called from that control.
    if (control.get_isEnabled() && control.get_isParentEnabled())
    {
        control.set_tabIndex(control.specifiedTabIndex);
    }
    else
    {
        control.set_tabIndex(-1);
    }
}

function popuplateTabIndexCache(control)
{
    var currentTabIndex = control.get_tabIndex();
    control.specifiedTabIndex = currentTabIndex !== -1 ? currentTabIndex : control.specifiedTabIndex;
}

function setTabIndexesToNone()
{
    var controlTabIndexes = {};

    var numberOfPopups = checkExists(masterPopupManager) && checkExists(masterPopupManager.popUps) ? masterPopupManager.popUps.length : 0;

    var currentViewControllerDefinition = viewControllerDefinition;
    var currentWindow = window;
    var loopThroughControllerDefinition = true;

    if (numberOfPopups > 0)
    {
        var lastPopup = masterPopupManager.popUps[numberOfPopups - 1]; // compensate for the one being rendered

        lastPopup.element.find(".popup-header a").attr("tabindex", "-1");
        _runtimePopupWindows.push(lastPopup.element);

        var jqIframe = lastPopup.element.find("iframe");
        if (jqIframe.length > 0)
        {
            currentWindow = jqIframe[0].contentWindow;
            currentViewControllerDefinition = jqIframe[0].contentWindow.viewControllerDefinition;
        }
        else // if its not an iframe, it means that we also won't find the controls in the controller definition xml.
        {
            // just get all the tabable controls. There should only be a few since it will be a small popup.
            var popupControls = lastPopup.element.find("a, input, [tabindex][tabindex!=-1]");
            popupControls.attr("tabindex", "-1");
            _runtimePopupControls.push(popupControls);
            loopThroughControllerDefinition = false;
        }
    }

    if (checkExists(currentViewControllerDefinition) && loopThroughControllerDefinition)
    {
        var controls = $mn(currentViewControllerDefinition, "Controllers/Controller/Controls/Control");

        var i = controls.length;
        var objInfo;
        var currentControl;
        var id;

        // first build an array of current values. We do it separately from the setting of values, as something multiple controls affect the same actual tab index
        while (i--)
        {
            currentControl = controls[i];
            id = currentControl.getAttribute("ID");
            objInfo = new PopulateObject(null, null, id, "TabIndex");
            var tabIndex = currentWindow.executeControlFunction(currentControl, "GetProperty", objInfo);
            controlTabIndexes[id] = tabIndex;
        }

        i = controls.length;
        while (i--)
        {
            currentControl = controls[i];
            id = currentControl.getAttribute("ID");
            objInfo = new PopulateObject(null, "-1", id, "TabIndex");
            currentWindow.executeControlFunction(currentControl, "SetProperty", objInfo);
        }

        // now take care of listviews, which will not be present in the xml
        var listViewTabIndexes = {};
        var listViews = currentWindow.$(".grid .grid-body-content .grid-content-table");
        var listViewHeaders = currentWindow.$(".grid .grid-body .grid-column-headers .grid-column-header-table");

        for (var l = 0; l < listViews.length; l++)
        {
            listViewTabIndexes[l] = listViews[l].getAttribute("tabindex");
            listViews[l].setAttribute("tabindex", "-1");
        }

        listViewHeaders.attr("tabindex", "-1");

        // and now the view headers
        var viewHeaderTabIndexes = {};
        var viewHeaderCollapseControls = currentWindow.$(".collapse-vertical, .expand-vertical");

        for (var v = 0; v < viewHeaderCollapseControls.length; v++)
        {
            viewHeaderTabIndexes[v] = viewHeaderCollapseControls[v].getAttribute("tabindex");
            viewHeaderCollapseControls[v].setAttribute("tabindex", "-1");
        }

        // and then the filter controls... how long will this list special cases get?
        var filterTabIndexes = {};
        var filterControls = currentWindow.$(".filterContainer").find("a, input, textarea, [tabindex][tabindex != -1]");

        for (var k = 0; k < filterControls.length; k++)
        {
            filterTabIndexes[k] = filterControls[k].getAttribute("tabindex");
            filterControls[k].setAttribute("tabindex", -1);
        }

        var actionRowTabIndexes = {};
        var actionRows = currentWindow.$("a.action-row");

        for (var m = 0; m < actionRows.length; m++)
        {
            actionRowTabIndexes[m] = actionRows[m].getAttribute("tabindex");
            actionRows[m].setAttribute("tabindex", "-1");
        }

        _runtimeActionRows.push(actionRows);
        _runtimeActionRowTabIndexes.push(actionRowTabIndexes);
        _runtimeListViewTabIndexes.push(listViewTabIndexes);
        _runtimeControlTabIndexes.push(controlTabIndexes);
        _runtimeViewHeaderTabIndexes.push(viewHeaderTabIndexes);
        _runtimeFilterTabIndexes.push(filterTabIndexes);
        _runtimeFilterControlGroups.push(filterControls);
    }
}

function restoreTabIndexes()
{
    var lastPopup = _runtimePopupWindows.pop();

    var currentWindow = window;
    var loopThroughControllerDefinition = true;

    if (checkExists(lastPopup))
    {
        var jqIframe = lastPopup.find("iframe");

        if (jqIframe.length > 0)
        {
            lastPopup.find(".popup-header a").removeAttr("tabindex");
            currentWindow = jqIframe[0].contentWindow;
        }
        else
        {
            var popupControls = _runtimePopupControls.pop();

            if (checkExists(popupControls))
            {
                popupControls.attr("tabindex", 0);
            }

            loopThroughControllerDefinition = false;
        }
    }

    if (checkExists(currentWindow) && checkExists(currentWindow.viewControllerDefinition) && loopThroughControllerDefinition)
    {
        var controls = $mn(currentWindow.viewControllerDefinition, "Controllers/Controller/Controls/Control");
        var i = controls.length;

        var objInfo;
        var currentControl;
        var id;

        var controlTabIndexes = _runtimeControlTabIndexes.pop();
        var listViewTabIndexes = _runtimeListViewTabIndexes.pop();
        var viewHeaderTabIndexes = _runtimeViewHeaderTabIndexes.pop();
        var filterTabIndexes = _runtimeFilterTabIndexes.pop();
        var actionRowTabIndexes = _runtimeActionRowTabIndexes.pop();

        var listViews = currentWindow.$(".grid .grid-body-content .grid-content-table");
        var listViewHeaders = currentWindow.$(".grid .grid-body .grid-column-headers .grid-column-header-table");
        var viewHeaderCollapseControls = currentWindow.$(".collapse-vertical, .expand-vertical");
        var filterControls = _runtimeFilterControlGroups.pop();
        var actionRows = _runtimeActionRows.pop();

        if (checkExists(listViews) && checkExists(listViewHeaders) && checkExists(listViewTabIndexes))
        {
            for (var l = 0; l < listViews.length; l++)
            {
                if (checkExists(listViews[l]) && checkExists(listViewHeaders[l]) && checkExists(listViewTabIndexes[l]))
                {
                    listViews[l].setAttribute("tabindex", listViewTabIndexes[l]);
                    listViewHeaders[l].setAttribute("tabindex", listViewTabIndexes[l]);
                }
            }
        }

        if (checkExists(viewHeaderCollapseControls) && checkExists(viewHeaderTabIndexes))
        {
            for (var c = 0; c < viewHeaderCollapseControls.length; c++)
            {
                viewHeaderCollapseControls[c].setAttribute("tabindex", viewHeaderTabIndexes[c]);
            }
        }

        if (checkExists(actionRows) && checkExists(actionRowTabIndexes))
        {
            for (var m = 0; m < actionRows.length; m++)
            {
                actionRows[m].setAttribute("tabindex", actionRowTabIndexes[m]);
            }
        }

        if (checkExists(filterControls) && checkExists(filterTabIndexes))
        {
            for (var k = 0; k < filterControls.length; k++)
            {
                if (checkExists(filterTabIndexes[k]))
                {
                    filterControls[k].setAttribute("tabindex", filterTabIndexes[k]);
                }
                else
                {
                    filterControls[k].removeAttribute("tabindex");
                }
            }
        }

        if (checkExists(controlTabIndexes) && controls.length > 0)
        {
            while (i--)
            {
                currentControl = controls[i];
                id = currentControl.getAttribute("ID");

                tabIndex = controlTabIndexes[id];
                if (checkExists(tabIndex))
                {
                    objInfo = new PopulateObject(null, tabIndex, id, "TabIndex");
                    currentWindow.executeControlFunction(currentControl, "SetProperty", objInfo);
                }
            }
        }
    }
}

function calculateFormTabIndex(setIndex)
{
    setIndex = parseInt(setIndex, 10);

    if (setIndex === FORM_LEVEL_CONTROL)
    {
        return FORM_LEVEL_CONTROL;
    }

    if (!isNaN(setIndex) && setIndex > 0)
    {
        setIndex = (FORM_LEVEL_INDEX_INCREMENT * (setIndex - 1)) + FORM_LEVEL_INDEX_BASE;
    }
    else
    {
        setIndex = FORM_LOGICAL_MAX_TAB_INDEX;
    }

    return setIndex;
}

function calculateViewLevelTabIndex(userSpecifiedTabIndex, viewTabIndex)
{

    if (viewTabIndex === -1)
    {
        return viewTabIndex;
    }

    userSpecifiedTabIndex = parseInt(userSpecifiedTabIndex, 10);
    viewTabIndex = parseInt(viewTabIndex, 10);

    if (!isNaN(userSpecifiedTabIndex) && userSpecifiedTabIndex !== 0)
    {
        if (userSpecifiedTabIndex === -1)
        {
            return userSpecifiedTabIndex;
        }
    }
    else
    {
        userSpecifiedTabIndex = CONTROL_LOGICAL_MAX_TAB_INDEX;
    }

    if (!isNaN(viewTabIndex) && userSpecifiedTabIndex > 0 && viewTabIndex === FORM_LEVEL_CONTROL)
    {
        userSpecifiedTabIndex = FORM_LEVEL_INDEX_BASE + (FORM_LEVEL_INDEX_INCREMENT * (userSpecifiedTabIndex - 1)) + CONTROL_LOGICAL_MAX_TAB_INDEX;
    }
    else
    {
        userSpecifiedTabIndex = viewTabIndex + userSpecifiedTabIndex;
    }

    return userSpecifiedTabIndex;
}

function calculateTabIndex(propertyValue, currentControlID)
{
    var viewTabIndex = null;
    if (CALCULATED_TAB_INDEXES === false)
    {
        // calculate all the things!
        var controls = $mn(viewControllerDefinition, "Controllers/Controller/Controls/Control");
        var currentControl = null;
        var id = null;
        var objInfo = null;
        var tabIndex = null;
        var i = controls.length;

        while (i--)
        {
            currentControl = controls[i];
            id = currentControl.getAttribute("ID");

            // we can assume that all tab indexes will be 0 when this is calculated.
            viewTabIndex = calculateFormTabIndex(0);
            tabIndex = calculateViewLevelTabIndex(0, viewTabIndex);

            objInfo = new PopulateObject(null, tabIndex, id, "TabIndex");
            executeControlFunction(currentControl, "SetProperty", objInfo);

            SourceCode.Forms.Controls.Web.controlTabIndexHierarchy[id] = 0;
        }

        CALCULATED_TAB_INDEXES = true;
    }

    if (propertyValue.toLowerCase() === "none")
    {
        propertyValue = -1;
    }
    else
    {
        var specifiedViewTabIndex = SourceCode.Forms.Controls.Web.controlTabIndexHierarchy[currentControlID];
        var specifiedControlTabIndex = propertyValue;

        viewTabIndex = calculateFormTabIndex(specifiedViewTabIndex);
        propertyValue = calculateViewLevelTabIndex(specifiedControlTabIndex, viewTabIndex);
    }
    return propertyValue;
}

function getUserTabIndex(controlTabIndex, controlID)
{
    controlTabIndex = parseInt(controlTabIndex, 10);

    if (controlTabIndex !== -1)
    {
        var viewTabIndex = SourceCode.Forms.Controls.Web.controlTabIndexHierarchy[controlID];

        if (controlTabIndex === CONTROL_LOGICAL_MAX_TAB_INDEX)
        {
            return 0;
        }
        else if (viewTabIndex === FORM_LEVEL_CONTROL && controlTabIndex > CONTROL_LOGICAL_MAX_TAB_INDEX) // Form level
        {
            return reverseCalculateFormTabIndex(controlTabIndex);
        }
        else if (controlTabIndex > CONTROL_LOGICAL_MAX_TAB_INDEX) //View on form
        {
            return reverseCalculateViewLevelTabIndex(viewTabIndex, controlTabIndex);
        }
        else
        {
            return controlTabIndex;
        }
    }
    else
    {
        return -1;
    }
}

function reverseCalculateFormTabIndex(controlTabIndex)
{
    var calculatedTabIndex = ((controlTabIndex - CONTROL_LOGICAL_MAX_TAB_INDEX) / FORM_LEVEL_INDEX_INCREMENT);

    if (calculatedTabIndex === CONTROL_LOGICAL_MAX_TAB_INDEX)
    {
        calculatedTabIndex = 0;
    }

    return calculatedTabIndex;
}

function reverseCalculateViewLevelTabIndex(specifiedViewTabIndex, controlTabIndex)
{
    var calculatedTabIndex = 0;

    if (specifiedViewTabIndex === 0)
    {
        calculatedTabIndex = controlTabIndex - FORM_LOGICAL_MAX_TAB_INDEX;
    }
    else
    {
        calculatedTabIndex = controlTabIndex - (FORM_LEVEL_INDEX_INCREMENT * specifiedViewTabIndex);
    }

    if (calculatedTabIndex === CONTROL_LOGICAL_MAX_TAB_INDEX)
    {
        calculatedTabIndex = 0;
    }

    return calculatedTabIndex;
}
//#endregion tab index

//returns the controller xml for the current view
function returnCurrentViewXML(viewID, instanceID)
{
    //#region
    var key = viewID + "_";
    var hasInstanceID = (checkExistsNotEmpty(instanceID) && (instanceID !== _runtimeEmptyGuid));

    if (hasInstanceID)//ensure only one version is created when running by itself
    {
        key += instanceID;
    }
    var currentViewXML = viewXmlCache[key];
    if (!checkExists(currentViewXML))
    {
        var xp = "Controllers/Controller[@ID='" + viewID + "']";
        if (hasInstanceID)
        {
            xp += "[@InstanceID='" + instanceID + "']";
        }
        var childView = $sn(viewControllerDefinition, xp);
        if (!checkExists(childView) && hasInstanceID)
        {
            childView = $sn(viewControllerDefinition, "Controllers/Controller[@ID='" + viewID + "']");
        }
        if (checkExists(childView))
        {
            currentViewXML = childView;
            viewXmlCache[key] = currentViewXML;
        }
    }
    return currentViewXML;
    //#endregion
}

//get the view definition on node level (can access attributes from here)
function getViewDefinition(viewID, instanceID, dataSourceID)
{
    //#region
    var currentView = null;
    if (checkExists(dataSourceID) || !checkExists(viewID))
    {
        var xp = "Controllers/Controller";
        if (checkExists(viewID))
        {
            xp += "[@ID='" + viewID + "']";
        }
        if (checkExists(instanceID) && (instanceID !== _runtimeEmptyGuid))
        {
            xp += "[@InstanceID='" + instanceID + "']";
        }
        if (checkExists(dataSourceID))
        {
            xp += "[Fields/Field[@DataSourceID='" + dataSourceID + "']]";
        }
        currentView = $sn(viewControllerDefinition, xp);
    }
    else
    {
        //use or populate the cache
        currentView = returnCurrentViewXML(viewID, instanceID);
    }
    return currentView;
    //#endregion
}

//persist the view filter from the filter config
function persistViewFilterForUser(viewID, filterXML)
{
    //#region
    ajaxCall.persistRuntimeValues("persistViewFilter", viewID, filterXML);
    //#endregion
}

//saves the view parameters in the user profile
function persistViewParametersForUser(viewID, parameterXML)
{
    //#region
    if (!__runtimeIsAnonymous)
    {
        __persistedParametersDefinition = parameterXML; //persist the values in the control, once the view is being populated, all existing values are deleted
        ajaxCall.persistRuntimeValues("persistViewParameters", viewID, parameterXML);
    }
    //#endregion
}

//show/hide the modalizer and spinner using the control to find the view / instance
function _runtimeBusyControlView(controlID, busy, modalize)
{
    var controllerNode = $sn(viewControllerDefinition, "Controllers/Controller[Controls/Control[@ID='{0}']]".format(controlID));
    var viewID = controllerNode.getAttribute("ID");
    var instanceID = controllerNode.getAttribute("InstanceID");
    runtimeBusyView(viewID, busy, modalize, instanceID);
}

//show/hide the modalizer and spinner
function runtimeBusyView(viewID, busy, modalize, instanceID)
{
    //#region
    //hides / shows busy div and modalizer
    //not all necessarily the same value, can have the one without the other

    var currentView = getViewMainTable(viewID, instanceID);

    //rather use checkExistNotEmpty than length check, since currentView can be null
    if (checkExistsNotEmpty(currentView))
    {
        currentView = jQuery("#" + currentView);
        if (currentView.length > 0)
        {
            if (modalize && busy)
            {
                if (currentView[0].style.display === "none")
                {
                    return;
                }
                else
                {
                    //tab logic
                    var form = currentView.closest(".form");
                    if (form.length > 0)
                    {
                        var formParent = form.parent();
                        if (formParent.length > 0)
                        {
                            if (formParent[0].style.display === "none")
                            {
                                return;
                            }
                        }
                    }
                }
            }
            showSpinner(currentView, viewID, modalize, busy, instanceID);
        }
    }
    //#endregion
}

//Shows or hides the view spinner
function showSpinner(currentView, viewID, modalize, busy, instanceID)
{
    if (!busy)
    {
        var viewIdInstanceId = getViewInstanceIdentifier(viewID, instanceID);
        if (checkExists(_runtimeViewLoadingTimers) && checkExists(_runtimeViewLoadingTimers[viewIdInstanceId]))
        {
            clearTimeout(_runtimeViewLoadingTimers[viewIdInstanceId]);
            _runtimeViewLoadingTimers[viewIdInstanceId] = null;
        }
        modalizeShowBusy(currentView, modalize, busy);
    }
    else
    {
        var viewDef = getViewDefinition(viewID, instanceID);
        var delay = getViewSpinnerDelay(viewDef);
        var showSpinner = doesViewHaveInitSpinner(viewDef);
        if (delay > 0)
        {
            _runtimeViewLoadingTimers[getViewInstanceIdentifier(viewID, instanceID)] = setTimeout(function ()
            {
                modalizeShowBusy(currentView, modalize, showSpinner);
            }, delay);
        }
        else
        {
            modalizeShowBusy(currentView, modalize, showSpinner);
        }
    }
}

//this function generates a consistant index for the view loading timer lookup.
function getViewInstanceIdentifier(viewID, instanceID)
{
    if (!checkExistsNotEmpty(viewID))
    {
        viewID = _runtimeEmptyGuid;
    }
    if (!checkExistsNotEmpty(instanceID))
    {
        instanceID = _runtimeEmptyGuid;
    }
    return viewID + instanceID;
}

//Abstracts the call to the modalizer
function modalizeShowBusy(currentView, modalize, busy)
{
    currentView.modalize(modalize).showBusy(busy);
}

//Check the view definition to see if the view has a spinner
function doesViewHaveInitSpinner(viewDef)
{
    //We are initializing and the form is allowing view spinners
    //Check the view properties to see if the spinner should be displayed
    if (_runtimeInitSpinner && checkExists(viewDef))
    {
        var indicatorModeXPath = "Properties/Property[@Name='InitializeIndicatorMode']";
        var indicatorMode = viewDef.selectSingleNode(indicatorModeXPath);
        if (checkExists(indicatorMode) && checkExists(indicatorMode.text))
        {
            return indicatorMode.text.toUpperCase().indexOf("BUSY") !== -1;
        }
    }
    //Default value for a View Spinner is true
    return true;
}

//gets the spinner delay for the view.
function getViewSpinnerDelay(viewDef)
{
    if (_runtimeInitSpinner && checkExists(viewDef))
    {
        var indicatorDelayXPath = "Properties/Property[@Name='InitializeIndicatorDelay']";
        var indicatorDelay = viewDef.selectSingleNode(indicatorDelayXPath);
        if (checkExists(indicatorDelay) && checkExists(indicatorDelay.text))
        {
            var delay = parseInt(indicatorDelay.text);
            if (delay)
            {
                return delay;
            }
        }
    }
    return 0;
}

//show the busy overlay and spinner
function runtimeShowBusyOverlay(options)
{
    //#region
    if (!checkExists(options))
    {
        options = {};
    }

    if (!checkExists(options.extendedOptions))
    {
        options.extendedOptions = {};
    }

    if (!checkExists(options.windowToUse))
    {
        options.windowToUse = window;
    }

    if (!checkExists(options.isInitSpinner))
    {
        options.isInitSpinner = false;
    }

    if (!checkExists(options.fixedPosition))
    {
        options.fixedPosition = true;
    }

    if (!checkExists(options.autoResize))
    {
        options.autoResize = true;
    }

    options.windowToUse._runtimeSpinnersCount++;

    if (options.windowToUse._runtimeOverlayOpacity > -1 && options.windowToUse._runtimeOverlayOpacity <= 1)
    {
        options.extendedOptions.opacity = options.windowToUse._runtimeOverlayOpacity;
    }

    if (options.id)
    {
        if ((!options.windowToUse._runtimeInitSpinner) || (options.isInitSpinner))
        {
            options.windowToUse.runtimeModalizer.show(options.showSpinner, options.targetFrame, options.id, options.fixedPosition, options.autoResize, options.extendedOptions);
        }
    }
    else
    {
        if (((!options.windowToUse._runtimeInitSpinner) || (options.isInitSpinner)) && options.windowToUse._runtimeSpinnersCount === 1)
        {
            options.windowToUse.runtimeModalizer.show(options.showSpinner, options.targetFrame, options.id, options.fixedPosition, options.autoResize, options.extendedOptions);
        }
    }

    //#endregion
}

//hide the busy overlay and spinner
function runtimeHideBusyOverlay(options)
{
    //#region
    if (!checkExists(options))
    {
        options = {};
    }

    if (!checkExists(options.windowToUse))
    {
        options.windowToUse = window;
    }

    if (options.windowToUse._runtimeSpinnersCount === 1)
        setTimeout(function () { runtimeHideBusyOverlayInner(options); }, 50);
    else
        runtimeHideBusyOverlayInner(options);
}

function runtimeHideBusyOverlayInner(options)
{
    options.windowToUse._runtimeSpinnersCount--;

    if ((options.windowToUse._runtimeSpinnersCount < 0) || (options.forceHide === true))
    {
        options.windowToUse._runtimeSpinnersCount = 0;
    }

    if (options.windowToUse._runtimeSpinnersCount === 0)
    {
        options.windowToUse.runtimeModalizer.hide(options.id);
    }
    //#endregion
}

//get the main table ID from the View (list view)
function getViewMainTable(ViewID, InstanceID)
{
    //#region
    var tableID = "";
    var currentView = getViewDefinition(ViewID, InstanceID);
    if (checkExists(currentView))
    {
        tableID = currentView.getAttribute("MainTable");
    }

    return tableID;
    //#endregion
}

//get the view + instance id from the main table ID (list view)
function getMainTableViewInformation(MainTable)
{
    //#region
    var key = MainTable;
    var resultObject = _runtimeMainTableInfo[key];
    if (!resultObject)
    {
        resultObject = {};
        var currentViewTable = $sn(viewControllerDefinition, "Controllers/Controller[@MainTable='" + MainTable + "']");
        var viewID = "";
        var instanceID = null;
        if (checkExists(currentViewTable))
        {
            viewID = currentViewTable.getAttribute("ID");
            instanceID = currentViewTable.getAttribute("InstanceID");
            //include all table properties - ensure it is available with the cached version
            var properties = $mn(currentViewTable, "Properties/Property");
            var p = properties.length;
            {
                while (p--)
                {
                    var property = properties[p];
                    var propertyName = property.getAttribute("Name");
                    var propertyValue = property.text;
                    resultObject[propertyName] = propertyValue;
                }
            }

            //thumbnailcache from editable list
            var hasThumbnails = false;
            var controlsXpath = "Controls/Control[(@FieldID) and (Properties/Property[Name/text()='SetValue'])][@ControlTemplate='edit'][@DataType='Image']";
            var editableImageControls = $mn(currentViewTable, controlsXpath);
            if (editableImageControls.length > 0)
            {
                hasThumbnails = true;
            }
            resultObject.clearThumbnailCache = hasThumbnails;
        }
        resultObject.viewID = viewID;
        resultObject.instanceID = instanceID;
        _runtimeMainTableInfo[key] = resultObject;
    }
    return resultObject;
    //#endregion
}

function _runtimeIsMobile()
{
    return _runtimeAppleMobileRegex.test(navigator.userAgent);
}

//opens a file from the file controls - either uploaded or smartobject related (image and file types)
function openFile(stringvalue, type, controltype, height, width, currentCounter, fileRequestData)
{
    //#region
    if (!checkExists(controltype) || (controltype === "file"))
    {
        var usePOST = !_runtimeIsMobile();

        var postData = constructFileSrc(stringvalue, type, controltype, height, width, currentCounter, usePOST, null, fileRequestData);

        var url = postData;
        if (usePOST)
        {
            url = document.getElementById("FileURL").value;
        }
        url = FormatFileDownloadPathForAnonAccess(url, true);
        url = SourceCode.Forms.XSRFHelper.appendAntiXSRFQueryStringParameter(url);

        if (usePOST)
        {
            framePosting("HiddenFileFrame", url, postData, false);
        }
        else
        {
            _runtimeRedirect(url);
        }
    }
    else
    {
        return constructFileSrc(stringvalue, type, controltype, height, width, currentCounter, null, null, fileRequestData);
    }
    //#endregion
}

function constructExcelFileName(viewXml)
{
    var returnName = "Book1.xlsx";

    if (checkExists(viewXml))
    {
        var viewNameNode = viewXml.selectSingleNode("ViewName");

        if (checkExists(viewNameNode))
        {
            var viewName = viewNameNode.text;

            if (checkExistsNotEmpty(viewName))
            {
                var currentDate = new Date();

                var currentYear = currentDate.getFullYear().toString();

                var currentMonthInt = currentDate.getMonth() + 1;
                var currentMonth = currentMonthInt.toString();
                if (currentMonthInt < 10)
                {
                    currentMonth = "0" + currentMonth;
                }

                var currentDayInt = currentDate.getDate();
                var currentDay = currentDayInt.toString();
                if (currentDayInt < 10)
                {
                    currentDay = "0" + currentDay;
                }

                returnName = "{0}-{1}{2}{3}.xlsx".format(viewName, currentYear, currentMonth, currentDay);
            }
        }
    }

    return returnName;
}

function generateDataForExcel(options)
{
    options = checkExists(options) ? options : {};

    var returnObj = {};

    var columns = SFRGrid.execute({ element: options.viewHtml, fn: "fetch", params: ["columns"] });

    if (columns.length > 0)
    {
        returnObj.rows = [];

        var rowObj = {};

        rowObj.cells = [];

        for (var i = 0; i < columns.length; i++)
        {
            if (columns[i].hidden !== true)
            {
                var cellDisplay = columns[i].display;

                var cellObj = {
                    display: cellDisplay,
                    datatype: "text"
                }

                rowObj.cells.push(cellObj);
            }
        }

        returnObj.rows.push(rowObj);
    }

    if (options.rowsGridObjs.length > 0)
    {
        if (!checkExists(returnObj.rows))
        {
            returnObj.rows = [];
        }

        for (var i = 0; i < options.rowsGridObjs.length; i++)
        {
            var rowGridObj = options.rowsGridObjs[i];

            if (rowGridObj.length === columns.length)
            {
                var rowObj = {};

                rowObj.cells = [];

                for (var y = 0; y < rowGridObj.length; y++)
                {
                    if (columns[y].hidden !== true)
                    {
                        var cellDisplay = rowGridObj[y].display;
                        var cellValue = rowGridObj[y].value;
                        var cellDatatype = rowGridObj[y].fieldPropertyType;

                        var cellDisplayAndDatatype = adjustCellDataForExcel(cellDisplay, cellValue, cellDatatype);

                        var cellObj = {
                            display: cellDisplayAndDatatype.display,
                            datatype: cellDisplayAndDatatype.datatype
                        }

                        rowObj.cells.push(cellObj);
                    }
                }

                returnObj.rows.push(rowObj);
            }
        }
    }

    return returnObj;
}

function adjustCellDataForExcel(cellDisplay, cellValue, cellDatatype)
{
    var returnObj = {
        display: cellDisplay,
        datatype: cellDatatype
    };

    switch (cellDatatype)
    {
        case "autonumber":
        case "number":
        case "decimal":
        case "yesno":
            returnObj.display = cellValue;
            break;
        case "date":
        case "datetime":
        case "time":
            if (SCCultureHelper.Current()._checkDateIsZuluDate(cellValue))
            {
                returnObj.display = cellValue.replace(" ", "T");
            }
            else
            {
                returnObj.display = cellValue;
            }
            break;
            //Codefix 942074 reverted this comment is required for installbuild to detect the change
    }

    return returnObj;
}

function constructOpenXmlNotFoundErrorMessage()
{
    var kbLink = "<a href='' onClick='openXmlNotFoundKbLinkClick()'>{0}</a>".format(Resources.RuntimeMessages.OpenXmlNotFoundKb);

    return Resources.RuntimeMessages.OpenXmlNotFound.format(kbLink);
}

function openXmlNotFoundKbLinkClick()
{
    HelpHelper.runHelp(7501);
}

var _runtimeRedirect = function (url)
{
    window.location = url;
}

//function to construct the entire path of the file to be opened from openFile
var constructFileSrc = function (stringvalue, type, controltype, height, width, currentCounter, returnPostData, clearThumbnailCache, fileRequestData)
{
    //#region
    if (!checkExists(currentCounter))
    {
        currentCounter = false;
    }
    var path = document.getElementById("FileURL").value;
    var postData = "";
    var instanceID = null;
    var fieldNode = null;
    // Start here
    if (type.toLowerCase() === "path")
    {
        // FileRequestData
        if (checkExistsNotEmpty(fileRequestData))
        {
            if (returnPostData)
            {
                // Used by the attachment controls to request the file.  This is the main use case for the cached file being expired.
                postData += setFrameVariable("_filerequestdata", fileRequestData);
            }
            else
            {
                // this is primarily used for the IMG tag's SRC attribute.  Using the cache data here isn't always really an use case since the SMO would be executed, data cached and the IMG
                //  will be immediately displayed on the form.  Even if the cache then expires, the browser won't be requesting another thumbnail since the image is already displayed.
                // if the user then clicks refresh, pages or loads a item view, the SMO will be executed again, thus caching the images again and creating a new cache directory.
                fileRequestData = encodeURIComponent(fileRequestData);
                // TODO: Including the data anywyas in the query string but we possibly drop this data altogether for IMG SRC attributes.
                if (path.length + stringvalue.length + fileRequestData.length <= 2048)
                {
                    fileRequestData = "&_filerequestdata=" + fileRequestData;
                }
                else
                {
                    fileRequestData = "";
                }
            }
        }
        else
        {
            fileRequestData = "";
        }
        // Assemble the Path
        if (stringvalue.indexOf(path) === -1)
        {
            path = "{0}?_path={1}{2}".format(path, encodeURIComponent(stringvalue), fileRequestData);
        }
        else
        {
            //File already saved to SMO and filename encoded
            path = stringvalue + fileRequestData;
        }
        postData += setFrameVariable("_path", stringvalue);
    }
    else if (type.toLowerCase() === "control")
    {

        var controlNode = _runtimeControllerFindObject({ controlID: stringvalue });
        if (checkExists(controlNode))
        {
            instanceID = controlNode.parentNode.parentNode.getAttribute("InstanceID");
            fieldNode = returnFieldAttributeObject(controlNode.getAttribute("FieldID"), instanceID);
        }
    }
    else if (type.toLowerCase() === "field")
    {
        fieldNode = returnFieldAttributeObject(stringvalue, instanceID);
    }
    if (checkExists(fieldNode))
    {

        var fieldSOID = fieldNode.parentID;
        var fieldPropertyName = fieldNode.PropertyName;
        var ViewID = fieldNode.viewID;

        var comparisonObj = { parentid: fieldSOID, counter: currentCounter, controlid: false, join: false };

        var inputs = "";

        var xmlDoc = getViewHiddenHash(ViewID, instanceID);
        if (checkExists(xmlDoc))
        {
            var currentObject = xmlDoc.filter(__runtimeJsonFilterMatchingItems, comparisonObj);
            if (currentObject.length === 1)
            {
                var fields = currentObject[0].fields;
                for (var field in fields)
                {
                    var value = fields[field].value;
                    if (checkExistsNotEmpty(value) && fields !== fieldPropertyName)
                    {
                        var compareValue = reverseReplaceSpecialChars(value);
                        if (!compareValue.startsWith("<collection") && !compareValue.startsWith("<a href="))
                        {
                            inputs += "&" + field + "=" + encodeURIComponent(value);
                            postData += setFrameVariable(field, value);
                        }
                    }
                }
            }

            comparisonObj = { parentid: fieldSOID, controlid: false, join: false, parenttype: "Object", method: true };
            var parameters = xmlDoc.filter(__runtimeJsonFilterMatchingItems, comparisonObj);
            if (parameters.length === 1)
            {
                var params = parameters[0].parameters;
                for (var param in params)
                {
                    var value = params[param].value;
                    var name = "PARAMETER_" + param;

                    if (checkExistsNotEmpty(value))
                    {
                        var compareValue = reverseReplaceSpecialChars(value);
                        if (!compareValue.startsWith("<collection") && !compareValue.startsWith("<a href="))
                        {
                            inputs += "&" + name + "=" + encodeURIComponent(value);
                            postData += setFrameVariable(name, value);
                        }
                    }
                }
            }
        }

        if (inputs.length > 0)
        {
            path += "?_soid=" + fieldSOID + "&_returnproperty=" + fieldPropertyName + inputs;
            if (controltype === "image" && checkExists(clearThumbnailCache) && clearThumbnailCache)
            {
                path += "&t=" + (new Date()).getTime();
            }
            postData += setFrameVariable("_soid", fieldSOID);
            postData += setFrameVariable("_returnproperty", fieldPropertyName);
        }
    }

    if (path.indexOf('?') > -1)
    {
        if (checkExists(height))
        {
            path += "&_height=" + height;
            postData += setFrameVariable("_height", height);
        }
        if (checkExists(width))
        {
            path += "&_width=" + width;
            postData += setFrameVariable("_width", width);
        }
        if (!checkExists(controltype))
        {
            path += "&_controltype=file";
            postData += setFrameVariable("_controltype", "file");
        }
        else
        {
            if (path.indexOf("controltype=") === -1)
            {
                path += "&_controltype=" + controltype;
            }
            postData += setFrameVariable("_controltype", controltype);
        }
    }
    if (returnPostData)
    {
        return postData;
    }
    else
    {
        return path;
    }
    //#endregion
};

var FormatFileDownloadPathForAnonAccess = function (filePath, useForThumbnail)
{
    //Add token for anonymous access to querystring if allowed:
    if (checkExistsNotEmpty(__runtimeAnonToken) && checkExists(__runtimeAnonTokenName))
    {
        var filePathQueryStr = "{0}&{1}={2}";
        if (filePath.indexOf("?") === -1)
        {
            filePathQueryStr = "{0}?{1}={2}";
        }
        var tokenStr = __runtimeAnonToken;
        if (useForThumbnail)
        {
            tokenStr = encodeURIComponent(tokenStr);
        }
        filePath = filePathQueryStr.format(filePath, __runtimeAnonTokenName, tokenStr);
    }
    return filePath;
};

//object containing relevant information that is used in populating controls
var PopulateObject = function (XmlDocument, Value, CurrentControlId, propertyName, returnExecuteResult, jsonData)
{
    //#region
    var objInfo = {
        Value: Value,    //single value
        CurrentControlId: CurrentControlId, //control name
        property: propertyName, //property name of control (used with setters + getters)
        returnResult: returnExecuteResult,
        FormId: currentForm,
        JsonData: jsonData,
        presetXmlDocument: XmlDocument, //xml doc coming from the server
        get XmlDocument()
        {
            var result = null;
            if (checkExists(this.presetXmlDocument))
            {
                result = this.presetXmlDocument;
            }
            else if (checkExists(this.CurrentControlId))
            {
                result = _runtimeFieldsDataToXml({ controlID: CurrentControlId })
            }
            return result;
        }

    }
    return objInfo;
    //#endregion
};

var _runtimeExtendObjectInfo = function (objInfo)
{
    var replacedObj = {

        Value: objInfo.Value,    //single value
        CurrentControlId: objInfo.CurrentControlId, //control name
        property: objInfo.property, //property name of control (used with setters + getters)
        returnResult: objInfo.returnResult,
        FormId: objInfo.FormId,
        JsonData: objInfo.JsonData
    };
    return replacedObj;
};

//used when getting the sourcevalue from a parameter field
var parameterContext = function (ViewID, ObjectID, Method)
{
    //#region
    this.ViewID = ViewID;
    this.ObjectID = ObjectID;
    this.Method = Method;
    //#endregion
};

//helper function to return view properties
var getViewProperty = function (xmlDocument, propertyName)
{
    //#region
    var xpath_property = "Properties/Property[@Name='" + propertyName + "']";
    var xmlProperty = $sn(xmlDocument, xpath_property);
    if (checkExists(xmlProperty))
    {
        return xmlProperty.text;
    }
    else
    {
        return null;
    }
    //#endregion
};

//get the workflow actions ready to be used in the list controls - returned now as an array for JSON data
var getWorkflowActionCollection = function (processData)
{
    //#region
    return processData.Actions;
    //#endregion
};

/* return display property if a display template is applicable */
var returnDisplayPropertyFromTemplate = function (displayProperty)
{
    //#region
    if (checkExists(displayProperty) && displayProperty.indexOf("<Template>") === 0)
    {
        var template = $sn($xml(displayProperty), "Template/Item[@SourceType='ObjectProperty']");
        if (checkExists(template))
        {
            displayProperty = template.getAttribute("SourceID");
        }
    }
    return displayProperty;
    //#endregion
};

/* return display property if a display template is applicable */
var returnAllDisplayPropertiesFromTemplate = function (displayProperty)
{
    //#region
    var displayProperties = [];
    if (displayProperty.indexOf("<Template>") === 0)
    {
        var template = $mn($xml(displayProperty), "Template/Item[@SourceType='ObjectProperty']");
        if (checkExists(template))
        {
            for (var t = 0; t < template.length; ++t)
            {
                displayProperties.push(template[t].getAttribute("SourceID"));
            }
        }
    }
    else
    {
        displayProperties.push(displayProperty);
    }
    return displayProperties;
    //#endregion
};

var controlInformationObject = function (controlID)
{
    //#region
    var cio = _runtimeControlInfoCache[controlID];
    if (!cio)
    {
        cio = {};
        cio.ID = controlID;
        var controlNode = _runtimeControllerFindObject({ controlID: controlID });
        if (!checkExists(controlNode))
        {
            return null;
        }
        if (checkExists(controlNode.parentNode) && checkExists(controlNode.parentNode.parentNode))
        {
            cio.ViewID = controlNode.parentNode.parentNode.getAttribute("ID");
            cio.InstanceID = controlNode.parentNode.parentNode.getAttribute("InstanceID");
        }
        var fieldID = controlNode.getAttribute("FieldID");
        if (checkExists(controlNode.getAttribute("ParentUsingField")))
        {
            cio.ParentUsingField = controlNode.getAttribute("ParentUsingField");
        }
        if (checkExists(fieldID))
        {
            cio.fieldID = fieldID;
            var instanceID = controlID.split('_')[0];//first part of controlID is instanceID
            var field = returnFieldAttributeObject(fieldID, instanceID);
            var propertyName = field.PropertyName;

            if (checkExists(propertyName))
            {
                cio.contextID = field.contextID;
                cio.contextType = field.contextType;
                cio.ObjectID = field.parentID;
                if (cio.contextType === "Primary")
                {
                    if (checkExistsNotEmpty(field.propertyType))
                    {
                        cio.propertyType = field.propertyType.toLowerCase();
                    }
                }
                else
                {
                    var dataTypeNode = controlNode.getAttribute("DataType");
                    if (checkExists(dataTypeNode))
                    {
                        cio.propertyType = dataTypeNode.toLowerCase();
                    }
                }

                var isAssoc = new dataSourceLookup({ xmlDoc: viewControllerDefinition, sourceControlID: cio.ID }).getDataSource();
                if (checkExists(isAssoc))
                {
                    cio.contextID = isAssoc.getAttribute("ContextID");
                    cio.contextType = isAssoc.getAttribute("ContextType");
                    var isDisplay = isAssoc.getAttribute("DisplaySO");
                    if (isDisplay)
                    {
                        cio.ObjectID = isDisplay;
                    }
                    else
                    {
                        cio.ObjectID = isAssoc.getAttribute("AssociationSO");
                    }
                    propertyName = returnDisplayPropertyFromTemplate(isAssoc.getAttribute("DisplayTemplate"));

                    xpField = "Controllers/Controller/Fields/Field[@ContextID='" + cio.contextID + "'][@ContextType='" + cio.contextType + "'][@ObjectID='" + cio.ObjectID + "'][PropertyName/text()='" + propertyName + "']";
                    var newFieldNode = $sn(viewControllerDefinition, xpField);
                    if (checkExists(newFieldNode))
                    {
                        field = returnFieldAttributeObject(newFieldNode.getAttribute("ID"), instanceID);
                    }
                    cio.isAssociation = true;
                }
                else
                {
                    cio.isAssociation = false;
                }

                cio.qualifiedName = (cio.ObjectID + '.' + propertyName);
                if (checkExists(field))
                {
                    //only thing that will be affected with the above change of field in association (used when ordering paged lists)
                    cio.resultName = getQualifiedResultName(field);
                }
            }

        }
        _runtimeControlInfoCache[controlID] = cio;
    }
    return cio;
    //#endregion
};

/* shared function that returns the qualified result name according to the specifications (ContextType_ContextID_ObjectID) */
var getQualifiedResultName = function (field, isXml)
{
    //#region
    var result = null;
    var contextID, contextType, objectID = null;

    if (isXml)//this can be removed if the filtering part is adapted
    {
        contextID = field.getAttribute("ContextID");
        contextType = field.getAttribute("ContextType");
        objectID = field.getAttribute("ObjectID");
    }
    else
    {
        contextID = field.contextID;
        contextType = field.contextType;
        objectID = field.parentID;
    }
    if (checkExists(contextType) && checkExists(contextID) && checkExists(objectID))
    {
        result = (contextType + '_' + contextID + '_' + objectID);
    }
    return result;
    //#endregion
};

var executeControlFunctionHash = {};
//simplified the execution of the control functions - to do checkup and execution in one function minimizes the duplication of code
function executeControlFunction(currentControl, propertyName, objInfo)
{
    //#region
    var result = null;
    try
    {
        var keys = objInfo.CurrentControlId + "_" + propertyName;
        var fn = executeControlFunctionHash[keys];
        if (typeof fn === "undefined")
        {
            var functionName = $sn(currentControl, "Properties/Property[Name='" + propertyName + "']/Value");
            if (functionName != null)
            {
                functionName = functionName.text;
                var fn = evalFunction(functionName);
                executeControlFunctionHash[keys] = fn;
            }
            else
            {
                executeControlFunctionHash[keys] = -1
            }
        }
        if (typeof fn === "function")
        {
            result = fn(objInfo);
        }
        else if (fn === -1)
        {
            objInfo.functionExists = false;
        }
    }
    catch (e)
    {
        if (checkExistsNotEmpty(e.message))
        {
            var logObject =
            {
                type: 5,
                source: "executeControlFunction",
                category: "Helper",
                message: Resources.RuntimeMessages.ErrorSettingControlProperty,
                parameters: [propertyName, e.message],
                data: currentControl,
                exception: e
            };
            SFLog(logObject);
        }
    }
    return result;
    //#endregion
}

//Transform the property xml into a format that the controls can use - Item|Field
//Supposedly now only to be used to return lookup control's value in specified format
//(also used when transforming data from hidden fields to capture list)
function transformOriginalXMLForControl(ViewID, currentCounter, controlID, instanceID, loopContextID)
{
    //#region
    if (!checkExists(currentCounter))
    {
        var viewDef = getViewDefinition(ViewID, instanceID);
        if (checkExists(viewDef))
        {
            var tableID = viewDef.getAttribute("MainTable");
            var viewType = viewDef.getAttribute("TypeView").toLowerCase();
            if (checkExists(tableID) && tableID.length > 0 && viewType === "list")
            {
                currentCounter = getLoopContextData({ loopContextID: loopContextID, viewID: ViewID, instanceID: instanceID }).counter;

                if (!checkExists(currentCounter))
                {
                    currentCounter = getViewSelectedCounter(tableID);
                }
            }
        }
    }
    var contextID = null;
    var contextType = null;

    if (checkExists(controlID))
    {
        var controlObj = controlInformationObject(controlID);
        if (controlObj.isAssociation)
        {
            contextID = controlObj.contextID;
            contextType = controlObj.contextType;
        }
    }
    var returnDoc = getCombinedHiddenPropertyCollection(ViewID, null, null, null, false, currentCounter, "viewid", contextID, contextType, instanceID);
    return returnDoc;
    //#endregion
}

//replace special characters - especially those that will influence the display of the div in the lists
var replaceSpecialChars = function (text)
{
    //#region
    if (text.length > 0)
    {
        text = text.replaceAll('<', '&lt;');
        text = text.replaceAll('>', '&gt;');
        text = text.replace(newLineRegEx, '<br/>'); //newline characters in the lists
    }
    return text;
    //#endregion
};

//do reverse replace of special characters (hyperlink/multivalue list display values)
var reverseReplaceSpecialChars = function (text)
{
    //#region
    if (text.length > 0)
    {
        text = text.replaceAll("&amp;lt;", "<");
        text = text.replaceAll("&amp;gt;", ">");
        text = text.htmlDecode().toString();
    }
    return text;
    //#endregion
};

//removes the first selected row of the table; only the first selected row is picked, since this is used in non-multiselect cases
function removeSelectedRow(mainTable)
{
    //#region
    SFRGrid.execute({ element: mainTable, fn: "remove", params: ["first-selected-row"] });
    //#endregion
}

//returns the first selected row of the table; only the first selected row is picked, since this is used in non-multiselect cases
function returnSelectedRow(mainTable)
{
    //#region
    return SFRGrid.execute({ element: mainTable, fn: "fetch", params: ["first-selected-row"] });
    //#endregion
}

//returns the rows of the table according to the specified state
function returnViewRows(mainTable, rowState)
{
    //#region
    var viewRows = null;

    if (checkExistsNotEmpty(rowState))
    {
        rowState = rowState.toUpperCase();
    }
    else
    {
        rowState = "";
    }

    switch (rowState)
    {
        case "SELECTED":
            viewRows = SFRGrid.execute({ element: mainTable, fn: "fetch", params: ["selected-rows"] });
            break;
        case "UNSELECTED":
            viewRows = SFRGrid.execute({ element: mainTable, fn: "fetch", params: ["unselected-rows"] });
            break;
        default:
            viewRows = SFRGrid.execute({ element: mainTable, fn: "fetch", params: ["rows"] });
            break;
    }

    return viewRows;
    //#endregion
}

//returns the counter attribute from the currently selected row of the table
function returnSelectedCounter(mainTable)
{
    //#region
    return mainTable[0].getAttribute("selectedCounter");
    //#endregion
}

//returns the index of the selected row from the table
function returnSelectedIndex(mainTable)
{
    //#region
    return mainTable[0].getAttribute("selectedIndex");
    //#endregion
}

//returns the specific row of the table according to the specified counter attribute
function returnRowFromCounter(mainTable, counter)
{
    //#region
    var returnRow = null;

    if (checkExistsNotEmpty(counter))
    {
        var searchCounter = counter.toString();

        var tableRows = SFRGrid.execute({ element: mainTable, fn: "fetch", params: ["rows"] });

        if (checkExists(tableRows))
        {
            for (var i = 0; i < tableRows.length; i++)
            {
                var currentRow = jQuery(tableRows[i]);

                if (currentRow.children("td").metadata().counter.toString() === searchCounter)
                {
                    returnRow = currentRow;
                    break;
                }
            }
        }
    }

    return returnRow;
    //#endregion
}

var getViewSelectedCounter = function (mainTable)
{
    //#region
    var counter = null;

    var selectedRow = returnSelectedRow(jQuery("#" + mainTable));
    if ((checkExists(selectedRow)) && (selectedRow.length > 0))
    {
        counter = selectedRow.children("td").metadata().counter;
    }

    return counter;
    //#endregion
};

var getViewRowCounters = function (mainTable, rowState)
{
    //#region
    var counters = [];

    var viewRows = returnViewRows(jQuery("#" + mainTable), rowState);

    if (checkExists(viewRows))
    {
        for (var i = 0; i < viewRows.length; i++)
        {
            var viewRow = jQuery(viewRows[i]);
            var counter = viewRow.children("td").metadata().counter;

            counters.push(counter);
        }
    }

    return counters;
    //#endregion
};

//returns the loopcontextdata (item and counter) for a specific View instance or Control instance according to the loopcontextid for the current foreach loop
function getLoopContextData(options)
{
    //#region
    var currentLoopContextData = {};

    if (!checkExistsNotEmpty(options.viewID) && checkExists(options.mainTable))
    {
        var viewInstanceInfo = new getMainTableViewInformation(options.mainTable.attr("id"));
        options.viewID = viewInstanceInfo.viewID;
        options.instanceID = viewInstanceInfo.instanceID;
    }

    if ((checkExistsNotEmpty(options.viewID)) && (checkExists(options.loopContextID)) && (checkExists(_runtimeLoopContextData[options.loopContextID])))
    {
        var instanceKey = options.viewID;

        if (!checkExistsNotEmpty(options.instanceID))
        {
            options.instanceID = _runtimeEmptyGuid;
        }

        instanceKey += "_" + options.instanceID;

        if (checkExistsNotEmpty(options.controlID))
        {
            instanceKey += "_" + getNonInstanceSpecificControlID(options.controlID);
        }

        if (checkExists(_runtimeLoopContextData[options.loopContextID][instanceKey]))
        {
            currentLoopContextData = _runtimeLoopContextData[options.loopContextID][instanceKey];
        }
    }

    return currentLoopContextData;
    //#endregion
};

/* CUSTOM FRAME POSTING / NAVIGATION */
//posting to an iframe - for opening files and opening forms in subforms
function framePosting(target, action, data, navigateOnly)
{
    //#region
    if (checkExists(navigateOnly) && navigateOnly === true)
    {
        //Appification passes navigateOnly = true and when it comes through this code path
        //window.frameElement returns an "Access is Denied" error.       
        //this is to ensure that we only added the class to a popup
        if (typeof __runtimeFormLevel !== "undefined" && __runtimeFormLevel != null && __runtimeFormLevel != "0")
        {
            //try and catch added specifically for IE error
            //https://stackoverflow.com/questions/1886547/access-is-denied-javascript-error-when-trying-to-access-the-document-object-of 
            try
            {
                if (checkExists(window.frameElement) && target === "_self")
                {
                    $(window.frameElement).addClass("navigated");
                }
            }
            catch (ex)
            {

            }
        }

        if (action.indexOf("http") !== 0)
        {
            action = "http://" + action;
        }

        //document.location = action;
        if (target === "modal")
        {
            if (window.showModalDialog)
            {
                window.showModalDialog(action, "", data);
            }
            else
            {
                var options = "";
                var dataOptions = data.split(';');
                var convertions = [{ OrigProp: "dialogwidth", RepProp: "width", ParseNumber: true }, { OrigProp: "dialogheight", RepProp: "height", ParseNumber: true }];

                for (var i = 0; i < dataOptions.length; i++)
                {
                    var dataVal = dataOptions[i].split(':');
                    if (dataVal.length > 1)
                    {
                        var converted = false;
                        for (var y = 0; y < convertions.length; y++)
                        {
                            var convertion = convertions[y];
                            if (dataVal[0].toUpperCase().indexOf(convertion.OrigProp.toUpperCase()) !== -1)
                            {
                                converted = true;
                                var parsedVal = parseInt(dataVal[1]);
                                if (convertion.ParseNumber && !isNaN(parsedVal))
                                {
                                    options += ",{0}={1}".format(convertion.RepProp, parsedVal);
                                }
                                else if (!convertion.ParseNumber)
                                {
                                    options += ",{0}={1}".format(convertion.RepProp, dataVal[1]);
                                }
                            }
                        }
                        if (!converted)
                        {
                            options += ",{0}={1}".format(dataVal[0], dataVal[1]);
                        }
                    }
                }
                options = options + ",menubar=0,toolbar=0";
                window.open(prepareUrlToNavigate(action), target, options.substring(1));
            }
        }
        else
        {
            window.open(prepareUrlToNavigate(action), target); //implemented targets
        }
    }
    else
    {
        var newTarget = target;
        if (!$(document.documentElement).hasClass("msie") && newTarget == "_blank")
        {
            // create a unique target so chrome won't post to the same window twice
            newTarget += new Date().getTime();
            window.open(prepareUrlToNavigate(action), newTarget);
        }
        var form = jQuery("<form></form>");
        form.attr("method", "POST");
        form.attr("action", action);
        form.attr("target", newTarget);
        form.append(data);
        jQuery("body").append(form);
        form.trigger("submit");
        form.remove();
    }
    //#endregion
}

// fix urlencoding for IE 
function prepareUrlToNavigate(url)
{
    if (url != null)
    {
        if (SourceCode.Forms.Browser.msie)
        {
            url = url.replace(/&/g, "&amp;");
        }
    }
    return url;
}

//set frame variables (not in querystring, but in hidden input format)
function setFrameVariable(name, value)
{
    //#region
    var wrapper = jQuery("<wrapper></wrapper>");
    var input = jQuery("<input/>");
    input.attr("ID", name);
    input.attr("name", name);
    input.attr("type", "hidden");
    input.attr("value", value);
    wrapper.append(input);
    return wrapper.html();
    //#endregion
}
/* END CUSTOM FRAME POSTING / NAVIGATION */

//verify whether this specific property must be wrapped with the wraparound
function checkQuickSearch(text, quickSearchValue, includeSpace, literalValue)
{
    //#region
    if (text.length === 0 && includeSpace)
    {
        text = "&nbsp;";
    }
    else if (checkExists(quickSearchValue) && quickSearchValue.length > 0)
    {
        quickSearchValue = replaceSpecialChars(quickSearchValue).toLowerCase();

        var replaceText = replaceSpecialChars(text);
        if (replaceText.length > 0 && replaceText.toLowerCase().indexOf(quickSearchValue) > -1)
        {
            //replace all occurrences of text with coloured version of quicksearch
            if (!literalValue)
            {
                text = wrapAround(replaceText, quickSearchValue);
            }
            else
            {
                text = quickSearchHighlightTextNodes(replaceText, quickSearchValue, literalValue);
            }
        }
        else if (!literalValue) // even if not found, the escaped text should be returned, as literal is false
        {
            text = replaceText;
        }
    }
    return text;
    //#endregion
}

//function that caters for literals only
function quickSearchHighlightTextNodes(text, quickSearchValue, literalValue)
{
    //#region
    var replaced = false;
    var removalNodes = [];
    text = reverseReplaceSpecialChars(text); //literals can contain special characters which can mess up the node types if not translated
    var nodes = jQuery("<div>" + text + "</div>");

    var node = nodes[0].firstChild;
    while (node)
    {
        if (node.nodeType === 3)
        {
            //only textnodes, where	quicksearch value exists
            var nodeText = node.nodeValue;
            if (nodeText.length > 0 && nodeText.toLowerCase().indexOf(quickSearchValue) > -1)
            {
                //we know the quicksearch will wrap in a span (therefore contains html tags), otherwise we could just have set the nodeValue
                $(node).before(wrapAround(nodeText, quickSearchValue));
                removalNodes.push(node);
                replaced = true;
            }
        }
        else if (node.nodeType === 1 && node.innerHTML.length > 0 && node.innerHTML.toLowerCase().indexOf(quickSearchValue) > -1)
        {
            //failsafe for element nodes
            node.innerHTML = quickSearchHighlightTextNodes(node.innerHTML, quickSearchValue, literalValue);
            replaced = true;
        }
        node = node.nextSibling;
    }
    if (replaced)
    {
        while (removalNodes.length > 0)
        {
            $(removalNodes.pop()).remove();
        }
        text = nodes[0].innerHTML;
    }

    return text;
    //#endregion
}

//function to colour a specific section of a value which was returned in the quick search result set
function wrapAround(stringValue, wordValue)
{
    //#region
    var beforeText = "<span class='wrapAround'>";
    var afterText = "</span>";

    var lowerString = stringValue.toLowerCase();
    var lowerWord = wordValue;
    var replacedString = "";

    if (lowerString.indexOf(lowerWord) > -1)
    {
        var stringLength = lowerString.length;
        var wordLength = lowerWord.length;
        var startingPoint = lowerString.indexOf(lowerWord);

        for (var s = 0; s < stringLength; s++)
        {
            if (s < startingPoint)
            {
                replacedString += stringValue.substring(s, startingPoint);
                s = startingPoint - 1;
            }
            else
            {
                //build concatenated string
                var concatstring = "";
                while ((startingPoint + wordLength) > s)
                {
                    concatstring += stringValue.charAt(s);
                    s++;
                }
                replacedString += beforeText + concatstring + afterText;
                startingPoint = lowerString.indexOf(lowerWord, s);
                s--;

                if (startingPoint === -1)
                {
                    replacedString += stringValue.substring(s + 1);
                    break;
                }
            }
        }
        return replacedString;
    }
    else
    {
        return stringValue;
    }
    //#endregion
}

//show an error that was raised from the actual runtime functionality - control method not found etc.
function showRuntimeException(error)
{
    //#region
    try
    {
        popupManager.showError(error);
    }
    catch (exc)
    {
        alert(error);
    }
    return false;
    //#endregion
}

//fix for default values, used:
//When a list item row is added to a capture list (List.js)
var resetDefaultControlValues = function (viewID, instanceID, loopContextID)
{
    //#region
    var viewXml = returnCurrentViewXML(viewID, instanceID);//use cached version of definition
    var controlsXpath = "Controls/Control[Properties[Property/Name/text()='SetValue'][Property/Name/text()='GetDefaultValue']][(@ControlTemplate='edit')]";
    var controlCollection = $mn(viewXml, controlsXpath);
    for (var z = 0; z < controlCollection.length; z++)
    {
        var currentControl = controlCollection[z];

        var controlExpressionID = currentControl.getAttribute("ExpressionID");
        if (checkExists(controlExpressionID))
        {
            updateCalculatedControls(null, instanceID, null, null, null, controlExpressionID, true, loopContextID); //edit row only is true in this case - to not update already set rows
        }
        else
        {
            var ControlName = currentControl.getAttribute("ID");
            var objInfo = new PopulateObject(null, null, ControlName);
            var defaultValue = executeControlFunction(currentControl, "GetDefaultValue", objInfo);
            if (checkExists(defaultValue) && defaultValue.length > 0)
            {
                objInfo = new PopulateObject(null, defaultValue, ControlName);
                executeControlFunction(currentControl, "SetValue", objInfo);
                //ensure that fields are updated properly, previous null/reset didn't seem to work for all types of controls
                var fieldID = currentControl.getAttribute("FieldID");
                if (checkExists(fieldID))
                {
                    var newValue = executeControlFunction(currentControl, "GetValue", objInfo);
                    setHiddenFieldValue(fieldID, newValue, null, instanceID, null, null, true, loopContextID);
                }
            }
        }
    }
    //#endregion
};

/* HELPER FUNCTIONS */

//random number with from and to
var randomFromTo = function (from, to)
{
    //#region
    return Math.floor(Math.random() * (to - from + 1) + from);
    //#endregion
};

//calculates the nthRoot
var nthRoot = function (x, n)
{
    //#region
    x = x.isWhole() ? x.toInt() : x.toFloat();
    n = n.isWhole() ? n.toInt() : n.toFloat();
    var negate = n % 2 === 1 && x < 0;
    if (negate)
    {
        x = -x;
    }
    var possible = Math.pow(x, 1 / n);
    n = Math.pow(possible, n);
    if (Math.abs(x - n) < 1 && (x > 0 === n > 0))
    {
        return negate ? -possible : possible;
    }
    //#endregion
};

//pads left
String.prototype.leftPad = function (padString, length)
{
    //#region
    var str = this;
    while (str.length < length)
    {
        str = padString + str;
    }
    return str;
    //#endregion
};

//pads right
String.prototype.rightPad = function (padString, length)
{
    //#region
    var str = this;
    while (str.length < length)
    {
        str = str + padString;
    }
    return str;
    //#endregion
};

var getAverage = function (ArrayItems)
{
    //#region
    var result = Big(0);
    var arrLen = ArrayItems.length;
    if (arrLen > 0)
    {
        for (var z = 0; z < arrLen; z++)
        {
            result = result.plus(returnNumericValue(ArrayItems[z]));
        }
        result = result.div(arrLen);
    }
    return result;
    //#endregion
};

var getMaximum = function (ArrayItems)
{
    //#region
    var dateValues = runtimeAreAnyDateTypes(ArrayItems);

    var result = dateValues ? returnDateValue(ArrayItems[0]) : returnNumericValue(ArrayItems[0]);
    for (var z = 0; z < ArrayItems.length; z++)
    {
        var item = ArrayItems[z];
        item = dateValues ? returnDateValue(item) : returnNumericValue(item);
        if (dateValues ? runtimeDatesComparison([item, result]) > 0 : item.gt(result))
        {
            result = item;
        }
    }
    return result;
    //#endregion
};

var getMinimum = function (ArrayItems)
{
    //#region
    var dateValues = runtimeAreAnyDateTypes(ArrayItems);

    var result = dateValues ? returnDateValue(ArrayItems[0]) : returnNumericValue(ArrayItems[0]);
    for (var z = 0; z < ArrayItems.length; z++)
    {
        var item = ArrayItems[z];
        item = dateValues ? returnDateValue(item) : returnNumericValue(item);

        if (dateValues ? runtimeDatesComparison([item, result]) < 0 : item.lt(result))
        {
            result = item;
        }
    }
    return result;
    //#endregion
};

var getSum = function (ArrayItems)
{
    //#region
    var result = returnNumericValue(0);
    for (var z = 0; z < ArrayItems.length; z++)
    {
        result = result.plus(returnNumericValue(ArrayItems[z]));
    }
    return result;
    //#endregion
};

var joinString = function (ArrayItems, ignoreSeparator)
{
    //#region
    var separatorItem = "";
    var position = 0;
    var result = _runtimeToString(ArrayItems[position]);
    if (!ignoreSeparator)
    {
        separatorItem = result;
        position = 1;
        result = _runtimeToString(ArrayItems[position]);
    }
    jQuery.each(ArrayItems, function (index, item)
    {
        if (index > position)
        {
            result += separatorItem + _runtimeToString(item);
        }
    });
    return result;
    //#endregion
};

var insertTextInPosition = function (originalString, insertText, position)
{
    //#region
    var leftString = originalString.substr(0, position);
    var rightString = originalString.substr(position);
    return leftString.concat(insertText, rightString);
    //#endregion
};

var runtimeDatesComparison = function (dates)
{
    dates[0] = returnDateValue(dates[0]);
    dates[1] = returnDateValue(dates[1]);
    if (dates[0]._type === dates[1]._type)
    {
        //if dates are the same type they can be compared directly
        return dates[0].compareTo(dates[1]);
    }
    else
    {
        //if dates are not the same type
        var value1 = null, value2 = null;

        //This will not work yet since the DateTimeTZ type gets lost as soon as the value leaves the control

        //if (checkExists(dates[0].getTimeZoneOffset) && checkExists(dates[1].getTimeZoneOffset))
        //{
        //	//if both dates have offsets
        //	// and neither of them are zero
        //	// and they are not equal
        //	var offset0 = dates[0].getTimeZoneOffset();
        //	var offset1 = dates[1].getTimeZoneOffset();
        //	if (offset0 !== offset1 && offset0 !== 0 && offset1 !== 0)
        //	{
        //		//use the UTC time for comparison
        //		value1 = dates[0].getTime();
        //		value2 = dates[1].getTime();
        //	}
        //}
        //if the above fails rather use the local time for comparison
        if (value1 === null || value2 === null)
        {

            value1 = dates[0].getLocalTime();
            value2 = dates[1].getLocalTime();
        }
        return runtimeDatesCompareTo(value1, value2);
    }
}

var runtimeDatesCompareTo = function (value1, value2)
{
    //remove Big type from values
    if (checkExists(value1.toFloat))
    {
        value1 = value1.toFloat();
    }

    if (checkExists(value2.toFloat))
    {
        value2 = value2.toFloat();
    }

    var comparison = value1 > value2;
    if (comparison === true)
    {
        comparison = 1;
    }
    else
    {
        var equal = value1 === value2;
        if (equal)
        {
            comparison = 0;
        }
        else
        {
            comparison = -1;
        }
    }
    return comparison;
}

//date helper function for date additions and subtractions
//returns formatted Zulu date
var addDateCalculator = function (parsedDate, unit, count)
{
    if (!checkExists(parsedDate))
    {
        return null;
    }

    return addDateCalculatorInternal(parsedDate, unit, count);
};

//returns formatted javascript date object
var addDateCalculatorInternal = function (parsedDate, unit, count)
{
    if (parsedDate._type === "date" || parsedDate._type === "time")
    {
        return parsedDate.add(unit, count);
    }
    //#region
    Date.$units =
        {
            ms: 1,
            second: 1000,
            minute: 60000,
            hour: 3600000,
            day: 86400000,
            week: 608400000,
            month: 2678400000,
            year: 31536000000
        };
    var value = Date.$units[unit || 'day'];
    var thisUTC = parsedDate.getTimezoneOffset(); //caters for daylight savings time (to be tested - can be removed if not relevant)
    parsedDate.setTime(returnNumericValue(parsedDate.getTime()).plus(count.times(value)).toString());
    if (thisUTC !== parsedDate.getTimezoneOffset()) { parsedDate.setTime(parsedDate.getTime() + (parsedDate.getTimezoneOffset() - thisUTC) * 60000); } //caters for daylight savings time (to be tested - can be removed if not relevant)

    return parsedDate;
    //#endregion
};

//single function to calculate the start and end date of different units when a certain date is passed
//returns formatted Zulu date
var dateStartEndCalculator = function (returnDate, unit, isStart)
{
    if (!checkExists(returnDate))
    {
        return null;
    }
    return dateStartEndCalculatorInternal(returnDate, unit, isStart);
};

//returns formatted javascript date object
var dateStartEndCalculatorInternal = function (returnDate, unit, isStart)
{
    //#region
    if (isStart) //return start
    {
        switch (unit)
        {
            case "month":
                returnDate.setDate(1);
                break;
            case "quarter":
                var month = returnDate.getMonth();
                var quarter = Math.floor((month / 3) + 1);
                var newMonth = (quarter - 1) * 3;
                returnDate.setFullYear(returnDate.getFullYear(), newMonth, 1);
                break;
            case "week":
                //according to ISO standards, Monday is the start of a week
                var day = returnDate.getDay();
                var diff = returnDate.getDate() - day + (day === 0 ? -6 : 1);
                returnDate.setDate(1);
                returnDate.increment(diff - 1);
                break;
            case "year":
                returnDate.setFullYear(returnDate.getFullYear(), 0, 1);
                break;
        }
    }
    else
    {
        switch (unit)
        {
            case "month":
                returnDate.setDate(Date.daysInMonth(returnDate.getMonth(), returnDate.getFullYear()));
                break;
            case "quarter":
                var month2 = returnDate.getMonth();
                var quarter2 = Math.floor((month2 / 3) + 1);
                var newMonth2 = (quarter2 * 3) - 1;
                returnDate.setFullYear(returnDate.getFullYear(), newMonth2, 1);
                returnDate.setDate(Date.daysInMonth(returnDate.getMonth(), returnDate.getFullYear()));
                break;
            case "week":
                //according to ISO standards, Sunday is the end of a week
                var day2 = returnDate.getDay();
                var diff2 = returnDate.getDate() - day2 + 7;
                returnDate.setDate(1);
                returnDate.increment(diff2 - 1);
                break;
            case "year":
                returnDate.setFullYear(returnDate.getFullYear(), 11, 31);
                break;
        }
    }
    return returnDate;
    //#endregion
};

//helper function to ensure that values are numeric
function returnNumericValue(originalValue)
{
    //#region
    if (originalValue instanceof Big)
    {
        return originalValue;
    }
    var result;

    var valueType = typeof originalValue;
    switch (valueType)
    {
        case "number":
            return Big(originalValue);
        case "boolean":
            return Big((originalValue) ? 1 : 0);
        case "string":
            if (originalValue.length === 0)
            {
                originalValue = 0;
            }
            try
            {
                result = Big(originalValue);
            }
            catch (ex)
            {
            }
            if (isNaN(result) || !checkExists(result))
            {
                //try date
                var date = returnDateValue(originalValue);
                if (runtimeIsDateType(date))
                {
                    try
                    {
                        result = Big(date.getTime());
                    }
                    catch (ex)
                    {
                    }
                }
                if (isNaN(result) || !checkExists(result))
                {
                    //try boolean
                    var lowerValue = originalValue.toLowerCase();
                    if (lowerValue === "1" || lowerValue === "true" || lowerValue === "yes")
                    {
                        result = Big(1);
                    }
                    else if (lowerValue === "0" || lowerValue === "false" || lowerValue === "no")
                    {
                        result = Big(0);
                    }
                }
            }
            break;
        case "object":
            //try date
            var dateObj = returnDateValue(originalValue);
            if (runtimeIsDateType(dateObj))
            {
                try
                {
                    result = Big(dateObj.getTime());
                }
                catch (ex)
                {
                }
            }
            break;
    }

    if (isNaN(result) || !checkExists(result))
    {
        throw ("\"" + originalValue.toString() + "\" is not numeric.");
    }
    else
    {
        return result;
    }
    //#endregion
}

//helper function to ensure that values are boolean - will attempt recognized sequences, otherwise return orginal value
function returnBooleanValue(originalValue)
{
    //#region
    if (checkExists(originalValue)) // check for null/undefined
    {
        var comparisonValue = originalValue.toString().toLowerCase();
        if (comparisonValue === "true" || comparisonValue === "1" || comparisonValue === "yes")
        {
            return true;
        }
        return false;
    }

    //#endregion
}

//helper function to ensure that value is a valid date
function returnDateValue(originalValue, dataType)
{
    //#region

    if (!checkExistsNotEmpty(originalValue))
    {
        return null;
    }

    if (!checkExists(dataType))
    {
        if (runtimeIsDateType(originalValue))
        {
            return originalValue;
        }
        dataType = "datetime";
    }

    return SCCultureHelper.Current()._convertDateStringToObj({ dataType: dataType, value: originalValue })
    //#endregion
}

function runtimeIsDateType(value)
{
    return (checkExists(value) && (value instanceof Date || value._type === "date" || value._type === "time"))
}

function runtimeAreAnyDateTypes(values)
{
    var l = values.length;
    var isDateType = false;
    while (l-- && !isDateType)
    {
        isDateType = runtimeIsDateType(values[l]);
    }
    return isDateType;
}


//try to fix format of system variable date
function getDateInCorrectFormat(date)
{
    //#region
    if (!checkExists(date))
    {
        return null;
    }

    return SourceCode.Forms.CultureHelper.prototype._convertDateObjToString(date);
    //#endregion
}

//get start of day of the date (UTC compliant)
function getStartOfDay(date)
{
    //#region
    if (!checkExists(date))
    {
        return null;
    }

    var result = getDateInCorrectFormat(date.clearTime());

    return result;
    //#endregion
}

//cached regular expressions
var tabRegEx = /\t/g;
var spaceRegex = / /g;
var ltRegEx = /</g;
var gtRegex = />/g;
var singleQuoteRegex = /'/g;
var doubleQuoteRegex = /\"/g;
/*END HELPER FUNCTIONS */

function getActualControlID(controlID)
{
    var parts = controlID.split("_");
    if (parts.length > 2)
    {
        controlID = "{0}_{1}".format(parts);
    }
    return controlID;
}

//returns a controlID with instance information stripped away
function getNonInstanceSpecificControlID(controlID)
{
    //#region
    if (checkExistsNotEmpty(controlID))
    {
        var parts = controlID.split("_");
        if (parts.length > 1)
        {
            controlID = parts[1];
        }
    }

    return controlID;
    //#endregion
}

//returns the correct instance specific controlID in the format [instanceID]_[controlID without instance]
function getInstanceSpecificControlID(instanceID, controlID)
{
    //#region
    var returnControlID = null;

    if (checkExistsNotEmpty(controlID))
    {
        var instanceIdToUse = instanceID;
        var controlIdToUse = controlID;

        if (!checkExistsNotEmpty(instanceID))
        {
            instanceIdToUse = _runtimeEmptyGuid;
        }

        var parts = controlID.split("_");

        if (parts.length > 1)
        {
            controlIdToUse = parts[1];
        }

        returnControlID = instanceIdToUse + "_" + controlIdToUse;
    }

    return returnControlID;
    //#endregion
}

//returns the loopContextID for the current foreach loop from a specified xml node
function getLoopContextID(currentNode)
{
    //#region
    var loopContextID = null;

    if (checkExists(currentNode))
    {
        loopContextID = currentNode.getAttribute("LoopID");
    }

    return loopContextID;
    //#endregion
}

//adds loopcontextdata (item and counter for a specific View instance or Control instance) for the loopcontextid of the current node and adds it to the global _runtimeLoopContextData collection
//if no loopcontextid exists on the current node, a new loopcontextid is generated and added to the node
function addLoopContextData(options)
{
    //#region
    if (!checkExists(options))
    {
        options = {};
    }

    if ((checkExists(options.currentNode)) && (checkExistsNotEmpty(options.viewID)) && ((checkExistsNotEmpty(options.counterToAdd)) || (checkExistsNotEmpty(options.itemToAdd))))
    {
        var loopContextID = getLoopContextID(options.currentNode);

        if (!checkExistsNotEmpty(loopContextID))
        {
            loopContextID = String.generateGuid();
            options.currentNode.setAttribute("LoopID", loopContextID);
        }

        if (!checkExists(_runtimeLoopContextData[loopContextID]))
        {
            _runtimeLoopContextData[loopContextID] = {};
        }

        var instanceKey = options.viewID;

        if (!checkExistsNotEmpty(options.instanceID))
        {
            options.instanceID = _runtimeEmptyGuid;
        }

        instanceKey += "_" + options.instanceID;

        if (checkExistsNotEmpty(options.controlID))
        {
            instanceKey += "_" + getNonInstanceSpecificControlID(options.controlID);
        }

        if (!checkExists(_runtimeLoopContextData[loopContextID][instanceKey]))
        {
            _runtimeLoopContextData[loopContextID][instanceKey] = {};
        }

        if (checkExistsNotEmpty(options.counterToAdd))
        {
            _runtimeLoopContextData[loopContextID][instanceKey]["counter"] = options.counterToAdd;
        }

        if (checkExistsNotEmpty(options.itemToAdd))
        {
            _runtimeLoopContextData[loopContextID][instanceKey]["item"] = options.itemToAdd;
        }
    }
    //#endregion
}

//copies loopcontextdata from one loopcontextid to another
function copyLoopContextData(options)
{
    //#region
    if (!checkExists(options))
    {
        options = {};
    }

    if ((checkExists(options.currentNode)) && (checkExistsNotEmpty(options.loopContextIdToCopyFrom)))
    {
        var loopContextID = getLoopContextID(options.currentNode);

        if (!checkExistsNotEmpty(loopContextID))
        {
            loopContextID = String.generateGuid();
            options.currentNode.setAttribute("LoopID", loopContextID);
        }

        if (!checkExists(_runtimeLoopContextData[loopContextID]))
        {
            _runtimeLoopContextData[loopContextID] = {};
        }

        var loopContextDataToCopy = _runtimeLoopContextData[options.loopContextIdToCopyFrom];

        for (var instanceKey in loopContextDataToCopy)
        {
            if (!checkExists(_runtimeLoopContextData[loopContextID][instanceKey]))
            {
                _runtimeLoopContextData[loopContextID][instanceKey] = {};
            }

            _runtimeLoopContextData[loopContextID][instanceKey] = jQuery.extend(true, {}, _runtimeLoopContextData[loopContextID][instanceKey], loopContextDataToCopy[instanceKey]);
        }
    }
}

//removes loopcontextdata from the global _runtimeLoopContextData collection
function removeLoopContextData(options)
{
    //#region
    if (!checkExists(options))
    {
        options = {};
    }

    if (checkExists(options.loopContextID))
    {
        if (checkExists(_runtimeLoopContextData[options.loopContextID]))
        {
            delete _runtimeLoopContextData[options.loopContextID];
        }
    }
    //#endregion
}

function getExportToExcelData(options)
{
    var currentExportToExcelData = {};

    options = checkExists(options) ? options : {};

    if (checkExistsNotEmpty(options.viewId))
    {
        options.instanceId = checkExistsNotEmpty(options.instanceId) ? options.instanceId : _runtimeEmptyGuid;

        var key = options.viewId + "_" + options.instanceId;

        currentExportToExcelData = checkExists(_runtimeExportToExcelData[key]) ? _runtimeExportToExcelData[key] : {};
    }

    return currentExportToExcelData;
}

function setExportToExcelData(options)
{
    options = checkExists(options) ? options : {};

    if (checkExistsNotEmpty(options.viewId) && checkExists(options.data))
    {
        options.instanceId = checkExistsNotEmpty(options.instanceId) ? options.instanceId : _runtimeEmptyGuid;

        var key = options.viewId + "_" + options.instanceId;

        _runtimeExportToExcelData[key] = options.data;
    }
}

function removeExportToExcelData(options)
{
    options = checkExists(options) ? options : {};

    if (checkExistsNotEmpty(options.viewId))
    {
        options.instanceId = checkExistsNotEmpty(options.instanceId) ? options.instanceId : _runtimeEmptyGuid;

        var key = options.viewId + "_" + options.instanceId;

        if (checkExists(_runtimeExportToExcelData[key]))
        {
            delete _runtimeExportToExcelData[key];
        }
    }
}

//helper function to construct InstanceID related xpaths
function returnInstanceXP(instanceID, includeAnd, isSource, includeBrackets, ignoreNots)
{
    //#region
    var xp = "";
    if (checkExists(instanceID))
    {
        if (includeBrackets)
        {
            xp += "[";
        }
        else if (includeAnd)
        {
            xp = " and ";
        }
        if (isSource) //SourceInstanceID
        {
            if (!ignoreNots)
            {
                xp += "(not (@SourceInstanceID) or ";
            }
            xp += "@SourceInstanceID='" + instanceID + "'";
            if (!ignoreNots)
            {
                xp += ")";
            }
        }
        else //normal InstanceID
        {
            if (!ignoreNots)
            {
                xp += "(not (@InstanceID) or ";
            }
            xp += "@InstanceID='" + instanceID + "'";
            if (!ignoreNots)
            {
                xp += ")";
            }
        }
        if (includeBrackets)
        {
            xp += "]";
        }
    }
    return xp;
    //#region
}

function SFRuntimeBrowserDetection()
{
    var ua = navigator.userAgent.toLowerCase();

    // Applying client browser CSS class identifiers
    var htmlElement = $(document.documentElement);
    // Internet Explorer Detection
    var msie = parseInt((/msie (\d+)/.exec(ua) || [])[1]);
    if (isNaN(msie))
    {
        msie = parseInt((/trident\/.*; rv:(\d+)/.exec(ua) || [])[1]);
    }

    if (msie > 0)
    {
        htmlElement.addClass("msie"); // Indicates IE
        htmlElement.addClass("ie" + msie.toString()); // Indicates IE version
        if (!!document.documentMode)
        {
            var docMode = parseInt(document.documentMode, 10);
            htmlElement.addClass("ie-document-mode-" + docMode.toString()); // Indicates document mode

            //Use evalCommon instead of nested checkExists; the current function gets called from request for Forms that do not exist, where SourceCode.Forms.Settings does not exist, so safer to check for all levels from SourceCode down
            if ((evalCommon("SourceCode.Forms.Settings.Compatibility.LegacyBrowserSupport") !== null)
                && SourceCode.Forms.Settings.Compatibility.LegacyBrowserSupport && docMode < 9)
            {
                SFLog({
                    type: 4,
                    category: "Helper",
                    source: "SFRuntimeBrowserDetection",
                    message: "The attached page targets IE document mode 8 (or earlier), or is running in IE8 (or earlier). "
                        + "Some APIs and features may not be available. Errors are to be expected. See the K2 smartforms "
                        + "Compatibility Matrix (http://k2.com/help/K2forSP/WebPart/MoreInfo) for more."
                });
            }
        }
    }

    // Opera
    if (!!window.opera || ua.indexOf(' opr/') !== -1)
    {
        htmlElement.addClass("opera"); // Indicates Opera
        if (ua.indexOf('webkit'))
        {
            htmlElement.addClass("webkit"); // Indicates Opera 20+ using WebKit
        }
    }

    // Chrome
    if (!!window.chrome && ua.indexOf('chrome') !== -1 && ua.indexOf(' opr/') === -1)
    {
        htmlElement.addClass("webkit chrome");
    }

    // FireFox
    if (typeof InstallTrigger !== 'undefined' || ua.indexOf('firefox') !== -1)
    {
        htmlElement.addClass("mozilla firefox");
    }

    // Safari
    if (_runtimeSafariRegex.test(ua))
    {
        htmlElement.addClass("webkit safari");
    }

    // Applying mobile client browser CSS class identifiers
    if (_runtimeAppleMobileRegex.test(navigator.userAgent))
    {
        htmlElement.addClass("mobile");
    }

    // Applying box-sizing support CSS class identifiers
    if (!SourceCode.Forms.BorderBox.featureDetectionRun)
    {
        SourceCode.Forms.BorderBox.runFeatureDetection();
    }
    if (!SourceCode.Forms.BorderBox.nativeBorderBoxSupport)
    {
        htmlElement.addClass("no-border-box-support");
    }
}

function SFRuntimeHash()
{
    this._hash = {};
}
$.extend(SFRuntimeHash.prototype,
    {
        _getObject: function (keys, create)
        {
            var keyObject = this._hash;
            if (typeof keys === "object" && checkExists(keys) && keys.constructor === Array)
            {
                keyObject = this._hash;
                var l = keys.length;
                var createAllChildren = false;
                for (var i = 0; i < l; i++)
                {
                    var key = keys[i];
                    if (createAllChildren === true)
                    {
                        keyObject[key] = {};
                        keyObject = keyObject[key];
                    }
                    else
                    {
                        var childKeyObject = keyObject[key];
                        if (typeof childKeyObject === "undefined")
                        {
                            if (create === true)
                            {
                                keyObject[key] = {};
                                keyObject = keyObject[key];
                                createAllChildren = true;
                            }
                            else
                            {
                                keyObject = childKeyObject;
                                break;
                            }
                        }
                        else
                        {
                            keyObject = childKeyObject;
                        }
                    }
                }
            }
            else
            {
                var childKeyObject2 = keyObject[keys];
                if (typeof childKeyObject2 === "undefined")
                {
                    keyObject[keys] = {};
                    childKeyObject2 = keyObject[keys];
                }
                keyObject = childKeyObject2;
            }
            return keyObject;
        },

        get: function (keys)
        {
            var returnObject = this._getObject(keys);
            if (typeof returnObject !== "undefined" && typeof returnObject.value !== "undefined")
            {
                return returnObject.value;
            }
        },

        tryGet: function (keys, outObject)
        {
            var result = this._getObject(keys);
            if (typeof result !== "undefined" && typeof result.value !== "undefined")
            {
                outObject.value = result.value;
                return true;
            }
            return false;
        },

        add: function (keys, value)
        {
            this._getObject(keys, true).value = value;
        },

        remove: function (keys)
        {
            var result = this._getObject(keys);
            if (typeof result !== "undefined" && typeof result.value !== "undefined")
            {
                delete result.value;
            }
        },

        clear: function ()
        {
            this._hash = {};
        }
    });

function _runtimeSetPopupFirstFocus()
{
    if (checkExists(__runtimeFormLevel))
    {
        var level = parseInt(__runtimeFormLevel, 10);
        if (level > 0)
        {
            $("a, input[type!='hidden'], textarea, [tabindex][tabindex!='-1']").first().trigger("focus");
            // IE focusses the iframe after we set focus to the control. Therefore we need to bind an event to set focus back to the control.
            $("body").on("focus.runtime", function ()
            {
                $("body").off("focus.runtime");
                $("a, input[type!='hidden'], textarea, [tabindex][tabindex!='-1']").first().trigger("focus");
            });
        }
    }
}

var dataSourceLookup = function (options)
{
    this.initialize(options);
};

var _dataSourceLookupPrototype = {
    //#region
    options: {
        //#region
        xmlDoc: null,
        selectMultiple: false,
        includeControllers: true,
        includeController: true,
        controllerID: null,
        instanceXP: null,
        instanceID: null,
        sourceControlID: null,
        controlID: null,
        contextID: null,
        contextType: null,
        originalContextID: null,
        associationSO: null,
        displaySO: null,
        originalProperty: null,
        controlDisplayTemplate: null,
        notRootSO: null,
        isComposite: null,
        parentControlID: null,
        parentControlExists: null,
        parentControlNotEquals: null,
        extendedXpath: null
        //#endregion
    },

    initialize: function (options)
    {
        //#region
        this.options = jQuery.extend({}, this.options, options);
        //#endregion
    },

    constructAssociationXPath: function ()
    {
        //#region
        var xp = "";
        if (this.options.includeControllers)
        {
            xp += "Controllers/";
        }
        if (this.options.includeController)
        {
            xp += "Controller";
            if (this.options.controllerID)
            {
                xp += "[@ID='" + this.options.controllerID + "']";
            }
            if (this.options.instanceXP)
            {
                xp += this.options.instanceXP;
            }
            if (this.options.instanceID)
            {
                xp += "[@InstanceID='" + this.options.instanceID + "']";
            }
            xp += "/";
        }
        xp += "Associations/Association";
        //data sources
        if (this.options.sourceControlID)
        {
            if (this.options.sourceControlID === true)
            {
                xp += "[(@SourceControlID)]";
            }
            else
            {
                xp += "[@SourceControlID='" + this.options.sourceControlID + "']";
            }
        }
        if (this.options.controlID)
        {
            xp += "[@ControlID='" + this.options.controlID + "']";
        }
        if (this.options.contextID)
        {
            xp += "[@ContextID='" + this.options.contextID + "']";
        }
        if (this.options.contextType)
        {
            xp += "[@ContextType='" + this.options.contextType + "']";
        }
        if (this.options.originalContextID)
        {
            xp += "[@OriginalContextID='" + this.options.originalContextID + "']";
        }
        if (this.options.associationSO)
        {
            xp += "[@AssociationSO='" + this.options.associationSO + "']";
        }
        if (this.options.displaySO)
        {
            xp += "[@DisplaySO='" + this.options.displaySO + "']";
        }
        if (this.options.originalProperty)
        {
            xp += "[@OriginalProperty='" + this.options.originalProperty + "']";
        }
        if (checkExists(this.options.controlDisplayTemplate))
        {
            if (this.options.controlDisplayTemplate === true)
            {
                xp += "[(@ControlDisplayTemplate)]";
            }
            else if (this.options.controlDisplayTemplate === false)
            {
                xp += "[not(@ControlDisplayTemplate)]";
            }
            else
            {
                xp += "[@ControlDisplayTemplate='" + this.options.controlDisplayTemplate + "']";
            }
        }
        //control specific
        if (this.options.notRootSO)
        {
            xp += "[not(@RootSO)]";
        }
        if (checkExists(this.options.isComposite))
        {
            if (this.options.isComposite === true)
            {
                xp += "[(@IsComposite)]";
            }
            else if (this.options.isComposite === false)
            {
                xp += "[not(@IsComposite)]";
            }
            else
            {
                xp += "[@IsComposite='" + this.options.isComposite + "']";
            }
        }
        //dependencies
        if (this.options.parentControlID)
        {
            xp += "[@ParentControlID='" + this.options.parentControlID + "']";
        }
        if (this.options.parentControlExists)
        {
            xp += "[(@ParentControl)]";
        }
        if (this.options.parentControlNotEquals)
        {
            xp += "[@ParentControl != '" + this.options.parentControlNotEquals + "']";
        }
        if (this.options.extendedXpath)
        {
            xp += this.options.extendedXpath;
        }

        return xp;
        //#endregion
    },

    getDataSource: function ()
    {
        var result = null;
        if (checkExists(this.options.xmlDoc))
        {
            var xp = this.constructAssociationXPath();

            if (this.options.selectMultiple === true)
            {
                result = $mn(this.options.xmlDoc, xp);
            }
            else
            {
                result = $sn(this.options.xmlDoc, xp);
            }
        }
        return result;
    }
};

jQuery.extend(dataSourceLookup.prototype, _dataSourceLookupPrototype);

var _runtimeNodeCache = new SFRuntimeHash();
var _runtimeControllersXpath = "Controllers{0}/";
var _runtimeControllerXpath = "{0}Controller{1}{2}";
var _runtimeControlXpath = "Controls/Control[@ID='{3}']";
var _runtimeFieldsXpath = "Fields/Field[@ID='{3}']";
var _runtimeExpressionXpath = "{0}Expressions/Expression{1}[@ID='{2}']";
var _runtimeValidationGroupXpath = "{0}ValidationGroups/ValidationGroup{1}[@ID='{2}']";
var _runtimeFormParameterXpath = "Parameters/FormParameters/FormParameter[@Name='{0}']";
var _runtimeViewParameterXpath = "Parameters/Controller{0}/ViewParameters/ViewParameter[@Name='{1}']";

//options
// controlID required
// xmlDoc optional
// propertySearch optional
function _runtimeControllerFindObject(o)
{
    var xmlDoc = o.xmlDoc;
    var propertySearch = o.propertySearch;
    var instanceID = o.instanceID;
    if (instanceID === _runtimeEmptyGuid)
    {
        instanceID = null;
    }
    var viewID = o.viewID;

    var controlID = o.controlID;
    var fieldID = o.fieldID;
    var expressionID = o.expressionID;
    var formID = o.formID;
    var groupID = o.groupID;
    var viewParameter = o.viewParameter;
    var formParameter = o.formParameter;
    var dataSourceID = o.dataSourceID;

    var includeControllers = o.includeControllers;

    new SFRuntimeHash();

    var searchKind = "controller";
    var keys = [];
    if (typeof controlID !== "undefined" && controlID !== null)
    {
        searchKind = "control";
        keys = [searchKind, controlID];
    }
    else if (typeof fieldID !== "undefined" && fieldID !== null)
    {
        searchKind = "field";
        keys = [searchKind, formID, viewID, instanceID, fieldID];
    }
    else if (typeof expressionID !== "undefined" && expressionID !== null)
    {
        searchKind = "expression";
        keys = [searchKind, formID, instanceID, expressionID];
    }
    else if (typeof groupID !== "undefined" && groupID !== null)
    {
        searchKind = "validationgroup";
        keys = [searchKind, groupID];
    }
    else if (typeof formParameter !== "undefined" && formParameter !== null)
    {
        searchKind = "formparameter";
        keys = [searchKind, formParameter];
    }
    else if (typeof viewParameter !== "undefined" && viewParameter !== null)
    {
        searchKind = "viewparameter";
        keys = [searchKind, viewParameter, instanceID];
    }
    else
    {
        keys = [searchKind, viewID, instanceID];
    }

    var currentNode = _runtimeNodeCache.get(keys)
    if (typeof currentNode === "undefined" || currentNode === null)
    {
        var searchXpath = "",
            instanceXP = "",
            viewXP = "",
            formXP = "",
            controllerXP = "";
        if (typeof xmlDoc === "undefined" || xmlDoc === null)
        {
            if (searchKind === "formparameter" || searchKind === "viewparameter")
            {
                xmlDoc = runtimeParametersDefinition;
            }
            else
            {
                xmlDoc = viewControllerDefinition;
                includeControllers = true;
            }
        }
        else if (!checkExists(includeControllers))
        {
            //test for localcontroller context
            includeControllers = (xmlDoc.childNodes[0].tagName === "Controllers");
        }

        if (typeof instanceID !== "undefined" && instanceID !== null)
        {
            instanceXP = "[@InstanceID='" + instanceID + "']";
        }
        else
        {
            if (searchKind === "control")
            {
                var splitID = controlID.split("_");
                if (splitID.length === 2)
                {
                    var possibleInstanceID = splitID[0];
                    if (typeof possibleInstanceID !== "undefined" && possibleInstanceID !== null && possibleInstanceID !== "" && possibleInstanceID !== _runtimeEmptyGuid)
                    {
                        instanceXP = "[@InstanceID='" + possibleInstanceID + "']";
                    }
                }
            }
        }
        if (typeof viewID !== "undefined" && viewID !== null)
        {
            viewXP = "[@ID='" + viewID + "']";
        }
        if (typeof formID !== "undefined" && formID !== null)
        {
            formXP = "[@FormID='" + formID + "']";
        }

        var prefix = _runtimeControllerXpath + "/"
        if (includeControllers === true || searchKind === "Expression")
        {
            controllerXP = _runtimeControllersXpath.format(formXP);
        }
        else
        {
            var startsWithController = (xmlDoc.childNodes[0].tagName === "Controller");
            if (!startsWithController && (searchKind === "control" || searchKind === "field"))
            {
                prefix = "";
            }
        }

        switch (searchKind)
        {
            case "control":
                searchXpath = (prefix + _runtimeControlXpath).format(controllerXP, viewXP, instanceXP, controlID);
                break;
            case "field":
                searchXpath = (prefix + _runtimeFieldsXpath).format(controllerXP, viewXP, instanceXP, fieldID);
                break;
            case "expression":
                searchXpath = _runtimeExpressionXpath.format(controllerXP, instanceXP, expressionID);
                break;
            case "validationgroup":
                searchXpath = _runtimeValidationGroupXpath.format(controllerXP, instanceXP, groupID);
                break;
            case "formparameter":
                searchXpath = _runtimeFormParameterXpath.format(formParameter);
                break;
            case "viewparameter":
                searchXpath = _runtimeViewParameterXpath.format(instanceXP, viewParameter);
                break;
            default:
                searchXpath = _runtimeControllerXpath.format(controllerXP, viewXP, instanceXP);
                if (typeof dataSourceID !== "undefined" && dataSourceID !== null)
                {
                    searchXpath += "[Fields/Field[@DataSourceID='" + dataSourceID + "']]";
                }
                break;
        }
        currentNode = xmlDoc.selectSingleNode(searchXpath);
        _runtimeNodeCache.add(keys, currentNode);
    }


    if (searchKind === "control" && typeof propertySearch !== "undefined" && propertySearch !== null && propertySearch !== "")
    {
        if (typeof currentNode !== "undefined" && currentNode !== null)
        {
            var hasPropertyMethod = $sn(currentNode, "Properties[Property/Name='{0}']".format(propertySearch));
            if (!hasPropertyMethod)
            {
                currentNode = null;
            }
        }
    }

    return currentNode;
}

//transform fields from JSON to xml (backwards compatibility for controls)
var _runtimeFieldsDataToXml = function (options)
{
    var result = null;
    if (checkExistsNotEmpty(options.controlID))
    {
        var controlNode = _runtimeControllerFindObject({ controlID: options.controlID });
        if (checkExists(controlNode))
        {
            var viewID = controlNode.parentNode.parentNode.getAttribute("ID");
            var instanceID = controlNode.parentNode.parentNode.getAttribute("InstanceID");
            var key = options.controlID;
            var hashResult = _runtimeFieldsXmlHash[key];
            if (hashResult)
            {
                result = hashResult;
            }
            else
            {
                var collectionXml = $xml("<collection/>");
                var fieldsData = getViewHiddenHash(viewID, instanceID);
                if (checkExists(fieldsData))
                {
                    var comparisonObj =
                    {
                        controlid: options.controlID
                    };
                    var controlData = fieldsData.filter(__runtimeJsonFilterMatchingItems, comparisonObj);
                    if (checkExists(controlData) && controlData.length > 0)
                    {
                        _runtimeTransformFieldsToXml(collectionXml, controlData);
                        _runtimeFieldsXmlHash[key] = collectionXml;
                    }
                }
                result = collectionXml;
            }
        }
    }
    return result;
}

//simple helper function to translate json fields to previous xml format
var _runtimeTransformFieldsToXml = function (collectionXml, items)
{
    for (var r = 0; r < items.length; r++)
    {
        var record = items[r];
        var objectNode = collectionXml.createElement("object");
        collectionXml.documentElement.appendChild(objectNode);
        for (var att in record)
        {
            if (att !== "fields" && att !== "joins" && att !== "ignoreFields" && att !== "ignoreState" && att !== "controlid")
            {
                objectNode.setAttribute(att, record[att]);
            }
        }

        var fieldsNode = collectionXml.createElement("fields");
        objectNode.appendChild(fieldsNode);
        for (var field in record.fields)
        {
            var fieldNode = collectionXml.createElement("field");
            fieldNode.setAttribute("name", field);
            fieldsNode.appendChild(fieldNode);

            var valueNode = collectionXml.createElement("value");
            valueNode.appendChild(collectionXml.createTextNode(record.fields[field].value));
            fieldNode.appendChild(valueNode);
        }
        if (checkExists(record.joins))
        {
            for (var j = 0; j < record.joins.length; j++)
            {
                var join = record.joins[j];
                var objectNode = collectionXml.createElement("object");
                collectionXml.documentElement.appendChild(objectNode);
                for (var att in join)
                {
                    if (att !== "fields" && att !== "joins" && att !== "ignoreFields" && att !== "ignoreState" && att !== "controlid")
                    {
                        objectNode.setAttribute(att, join[att]);
                    }
                }
                objectNode.setAttribute("join", "true");
                var fieldsNode = collectionXml.createElement("fields");
                objectNode.appendChild(fieldsNode);
                for (var field in join.fields)
                {
                    var fieldNode = collectionXml.createElement("field");
                    fieldNode.setAttribute("name", field);
                    fieldsNode.appendChild(fieldNode);

                    var valueNode = collectionXml.createElement("value");
                    valueNode.appendChild(collectionXml.createTextNode(join.fields[field].value));
                    fieldNode.appendChild(valueNode);
                }
            }
        }
    }
}

//helper function to translate previous xml format to json fields
//used with backwards compatibility to accomplish for loop through controls: ControlItemsCollection
var _runtimeTransformXmlFieldsToObject = function (xmlNode)
{
    var record = {};
    if (checkExists(xmlNode))
    {
        for (var i = 0; i < xmlNode.attributes.length; i++)
        {
            var attribute = xmlNode.attributes[i];
            if (attribute.specified)
            {
                record[attribute.name] = attribute.value;
            }
        }

        var fieldNodes = $mn(xmlNode, "fields/field");
        var f = fieldNodes.length;
        if (f > 0)
        {
            record.fields = {};
        }
        while (f--)
        {
            var name = fieldNodes[f].getAttribute("name");
            var valueNode = $sn(fieldNodes[f], "value");
            if (checkExists(valueNode))
            {
                record.fields[name] = { value: valueNode.text };
            }
        }
    }
    return record;
}

//helper function for porting purposes (mainly used for translating old unit test data)
var _runtimeTransformXmlCollectionToJson = function (collection)
{
    //sample:
    //console.log(JSON.stringify(_runtimeTransformXmlCollectionToJson(testViewHiddenHash.documentElement)));
    var results = [];

    var objects = $mn(collection, "object");
    for (var o = 0; o < objects.length; o++)
    {
        results.push(_runtimeTransformXmlFieldsToObject(objects[o]));
    }
    return results;
}

function GetPreviousActionXml(jsonObj)
{
    var result = "";
    if (checkExists(jsonObj))
    {
        var previousActionID = jsonObj.PreviousActionID;
        if (checkExistsNotEmpty(previousActionID))
        {
            var viewID = jsonObj.ViewID;
            var instanceID = jsonObj.InstanceID;
            var instanceXP = "";

            if (checkExistsNotEmpty(viewID))
            {
                instanceXP = returnInstanceXP(instanceID, false, false, true, false);
            }
            var baseXP = "//Action[@ID='" + previousActionID + "']" + instanceXP + "";

            var actions = null;
            if (checkExists(runtimeNavigatedEvents))
            {
                actions = $mn(runtimeNavigatedEvents, baseXP);
            }
            if (checkExists(formBindingXml) && (actions == null || actions.length === 0))
            {
                actions = $mn(formBindingXml, baseXP);
            }
            if (actions != null && actions.length > 0)
            {
                result = actions[0].xml;
            }
        }
    }
    return result;
}
