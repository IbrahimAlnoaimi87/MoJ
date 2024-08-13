/*AJAX.js - construct & execute AJAX calls */

/* Fields */
var ajaxCall = null;
var workflowInfo = null;

/* Methods */
//AjaxCall
function AjaxCall()
{
    // Get ajax url from hidden input field (if exists)
    var ajaxUrlField = jQuery("#AjaxURL");
    var ajaxUrlValue = "AjaxCall.ashx";
    if (ajaxUrlField.length > 0)
    {
        ajaxUrlValue = ajaxUrlField[0].value;
    }
    this.ajaxUrlValue = ajaxUrlValue;
    cachedEnvironmentFields = [];

    // Add the anonymous token to all ajax calls
    if (typeof (__runtimeAnonToken) !== 'undefined' && checkExistsNotEmpty(__runtimeAnonToken))
    {
        var settings = {}
        settings.headers = {}
        settings.headers[__runtimeAnonTokenName] = __runtimeAnonToken;
        SourceCode.Forms.XSRFHelper.setAntiXSRFTokenInHeaderCollection(settings.headers);
        jQuery.ajaxSetup(settings);
    }
}

//general AJAX error handler (when AJAX call could not complete for some reason)
function handleAJAXError(httpRequest, status, error, brokerPackages)
{
    //#region
    if (checkExists(brokerPackages))
    {
        _runtimeNotifyControlsAndViewsOfFailure({ brokerPackages: brokerPackages, returnData: error });
    }

    runtimeHideBusyOverlay({ forceHide: true });

    popupManager.showError(Resources.Runtime.AjaxError + "<br/><br/>[" + httpRequest.status + "] " + httpRequest.statusText + " (" + status + ')');
    //#endregion
}

function redirectUserForAuthentication()
{
    popupManager.closeLast();
    SourceCode.Forms.SessionManagement.renewclaimssession(); // This works for both claims and classic forms authentication
}

//handles ajax errors where redirect html was returned from the server
function handleRedirectError(brokerPackages)
{
    //#region
    if (checkExists(brokerPackages))
    {
        _runtimeNotifyControlsAndViewsOfFailure({ brokerPackages: brokerPackages, returnData: "" });
    }

    runtimeHideBusyOverlay({ forceHide: true });

    if (SourceCode.Forms.Settings.Session.DisableAjaxReAuthenticate)
    {
        var reloadMessage = "<a href='' onClick='javascript:window.location.reload();'>{0}</a>".format(Resources.RuntimeMessages.ReloadFormDisplay);
        reloadMessage = Resources.RuntimeMessages.ReloadFormLink.format(reloadMessage);

        var errorMessage = "{0}<br/><br/>{1}".format(Resources.RuntimeMessages.RedirectPageMessage, reloadMessage);

        popupManager.showError(errorMessage);
    }
    else
    {
        var reAuthenticateUserMessage = "<a href='#' onClick='javascript:redirectUserForAuthentication();'>{0}</a>".format(Resources.RuntimeMessages.ReAuthenticateUserLink);
        reAuthenticateUserMessage = Resources.RuntimeMessages.ReAuthenticateUserMessage.format(reAuthenticateUserMessage);

        var errorMessage = "{0}<br/><br/>{1}".format(Resources.RuntimeMessages.ReAuthenticatePageMessage, reAuthenticateUserMessage);

        popupManager.showError(errorMessage);
    }

    //#endregion
}

//persist runtime values - filters + parameters to user's settings
AjaxCall.prototype.persistRuntimeValues = function (method, viewID, persistedValues)
{
    //#region
    SFLog({ type: 1, source: "persistRuntimeValues", category: "AJAX", message: "Saving runtime values for {0} ({1})", parameters: [viewID, method], data: persistedValues });
    jQuery.ajax({
        url: this.ajaxUrlValue,
        dataType: "xml",
        type: "POST",
        global: false,
        data:
        {
            method: method,
            viewID: viewID,
            persistedValues: encodeURIComponent(persistedValues)
        }
    });
    //#endregion
};

//_runtimePauseAjax: Pauses processing of ajax results and put results in a queue for later processing
//_runtimeRetryAjaxQueue: Queue of ajax calls which should be retried once triggered
//_runtimeContinueAjaxQueue: Queue of succeeded ajax calls which should just continue with processing once triggered (no retry)
var _runtimePauseAjax = false;
var _runtimeRetryAjaxQueue = [];
var _runtimeContinueAjaxQueue = [];
var _runtimeNativeAjax = true;

//execute smartobject and workflow runtime ajax calls
AjaxCall.prototype.executeRuntimeBehaviour = function (executionOptions)
{
    //#region
    var brokerPackagesJsonString = JSON.stringify(executionOptions.brokerPackagesJson);
    SFLog({ type: 3, source: "executeRuntimeBehaviour", category: "AJAX", message: "AJAX method execution", data: brokerPackagesJsonString });
    if ((!checkExists(executionOptions.behaviour)) && (!checkExists(executionOptions.deferred)))
    {
        executionOptions.deferred = $.Deferred();
    }
    if (executionOptions.modalizeWorkflowView)
    {
        var wfView = jQuery("*[id$=_9afc3bff-abee-4066-93d6-c217cdf765f5]");
        if (wfView.length > 0 && wfView[0].style.display !== "none")
        {
            wfView.modalize(true, null, null, null, null, { addToElement: true });
        }
    }

    var headers = null;
    if (checkExists(executionOptions.credentials))
    {
        headers = {};
        headers["X-K2-2AUTH"] = JSON.stringify(executionOptions.credentials);
    }

    var masterRuntimeWindow = SourceCode.Forms.Runtime.getMasterRuntimeWindow();
    masterRuntimeWindow.updateExecutionTracker(1);

    var asynchronous = true;
    if (checkExists(executionOptions.runAsync))
    {
        //implemented for population of workflow system variable retrieval
        asynchronous = executionOptions.runAsync;
    }

    var ajaxPromise;
    if (_runtimeNativeAjax && asynchronous)
    {
        ajaxPromise = _runtimeAjaxCall("POST", this.ajaxUrlValue, headers, brokerPackagesJsonString);
    }
    else
    {
        ajaxPromise = jQuery.ajax({
            url: this.ajaxUrlValue,
            dataType: "json",
            type: "POST",
            global: false,
            headers: headers,
            async: asynchronous,
            data: brokerPackagesJsonString
        });
    }
    ajaxPromise.done(function (data, textStatus, xhrData)
    {
        //ALWAYS CHECK THE SCRIPT LOADED VARIABLE FIRST WHEN RETURNING FROM AN AJAX CALL
        //THIS IS TO AVOID SCRIPT ERRORS WHEN A SUBVIEW/SUBFORM IS CLOSED AND AN AJAX CALL RETURNS
        //DO NOT ADD CODE ABOVE THIS ON THE CALL RETURN
        if (typeof (_runtimeScriptsLoaded) === "undefined")
        {
            return;
        }

        var responseContentType = xhrData;

        if (checkExists(xhrData.getResponseHeader))
        {
            // jquery sends the jqXHR as third parameter, have to extract responseContentType from this
            responseContentType = xhrData.getResponseHeader("Content-Type");
        }

        if (data == null)
        {
            data = $.parseXML('<Exception Title="{0}"><Message Name="Message">{1}</Message></Exception>'
                .format(Resources.MessageBox.Error, Resources.Runtime.AjaxNetworkError));
            handleFailRuntimeBehaviourResult(executionOptions, data, "503", Resources.Runtime.AjaxNetworkError, responseContentType);
            return;
        }


        var doneOptions = {
            initialRetry: executionOptions.initialRetry,
            data: data,
            behaviour: executionOptions.behaviour,
            deferred: executionOptions.deferred,
            brokerPackages: executionOptions.brokerPackages,
            brokerPackagesJson: executionOptions.brokerPackagesJson,
            batchedActions: executionOptions.batchedActions,
            hasViewID: executionOptions.hasViewID,
            textStatus: textStatus,
            responseContentType: responseContentType,
            runAsync: asynchronous
        };

        handleDoneRuntimeBehaviourResult(doneOptions);
    }).fail(function (data, status, error, responseContentType)
    {
        //ALWAYS CHECK THE SCRIPT LOADED VARIABLE FIRST WHEN RETURNING FROM AN AJAX CALL
        //THIS IS TO AVOID SCRIPT ERRORS WHEN A SUBVIEW/SUBFORM IS CLOSED AND AN AJAX CALL RETURNS
        //DO NOT ADD CODE ABOVE THIS ON THE CALL RETURN
        if (typeof (_runtimeScriptsLoaded) === "undefined")
        {
            return;
        }

        if (checkExists(data.getResponseHeader))
        {
            // jquery sends the jqXHR as first parameter, have to extract responseXML and responseContentType from this
            responseContentType = data.getResponseHeader("Content-Type");
            try
            {
                data = $.parseXML(data.responseText);
            }
            catch (e)
            {
                data = null;
            }
        }
        if (data == null)
        {
            data = $.parseXML('<Exception Title="{0}"><Message Name="Message">{1}</Message></Exception>'
                .format(Resources.MessageBox.Error, Resources.Runtime.AjaxNetworkError));
            status = "503";
        }
        handleFailRuntimeBehaviourResult(executionOptions, data, status, error, responseContentType);
    }).always(function ()
    {
        // Always update the execution tracker last.
        this.updateExecutionTracker(-1);
    }.bind(masterRuntimeWindow));
    if (checkExists(executionOptions) && checkExists(executionOptions.deferred))
    {
        return executionOptions.deferred.promise();
    }
    //#endregion
};

var _runtimeAjaxCall_initialized = false;
var _runtimeAjaxCall_additionalHeaders = null;
function _runtimeAjaxCallInitialize()
{
    if (checkExists(_runtimeNativeAjax) && _runtimeAjaxCall)
    {
        _runtimeAjaxCall_additionalHeaders = {};
        if (typeof (__runtimeAnonToken) !== 'undefined' && checkExistsNotEmpty(__runtimeAnonToken))
        {
            _runtimeAjaxCall_additionalHeaders[__runtimeAnonTokenName] = __runtimeAnonToken;
        }
    }
    _runtimeAjaxCall_initialized = true;
}

function _runtimeAjaxCall(method, url, headers, data, responseType)
{
    if (!_runtimeAjaxCall_initialized)
    {
        _runtimeAjaxCallInitialize();
    }

    var deferred = $.Deferred();
    var xhr = new XMLHttpRequest()
    xhr.open(method, url, true);

    if (_runtimeAjaxCall_additionalHeaders)
    {
        for (var name in _runtimeAjaxCall_additionalHeaders)
        {
            if (_runtimeAjaxCall_additionalHeaders.hasOwnProperty(name))
            {
                xhr.setRequestHeader(name, _runtimeAjaxCall_additionalHeaders[name]);
            }
        }
    }

    if (headers)
    {
        for (var name in headers)
        {
            if (headers.hasOwnProperty(name))
            {
                xhr.setRequestHeader(name, headers[name]);
            }
        }
    }
    SourceCode.Forms.XSRFHelper.setAntiXSRFHeader(xhr);

    xhr.onload = function ()
    {
        //ALWAYS CHECK THE SCRIPT LOADED VARIABLE FIRST WHEN RETURNING FROM AN AJAX CALL
        //THIS IS TO AVOID SCRIPT ERRORS WHEN A SUBVIEW/SUBFORM IS CLOSED AND AN AJAX CALL RETURNS
        //DO NOT ADD CODE ABOVE THIS ON THE CALL RETURN
        if (typeof (_runtimeScriptsLoaded) === "undefined")
        {
            return;
        }

        var responseContentType = xhr.getResponseHeader("Content-Type");
        var responseValue = null;

        if (checkExistsNotEmpty(responseContentType))
        {
            responseContentType = responseContentType.toUpperCase();
        }
        else
        {
            responseContentType = "";
        }

        if (checkExistsNotEmpty(responseType) && responseType.toLowerCase() === "blob")
        {
            responseValue = xhr.response;
        }
        else if (responseContentType.contains("APPLICATION/JSON"))
        {
            responseValue = JSON.parse(xhr.responseText);
        }
        else if (!responseContentType.contains("TEXT/HTML"))
        {
            if (supportsActiveX())
            {
                responseValue = tryParseXML(xhr.responseText);
                if (responseValue.selectNodes("*").length === 0)
                {
                    responseValue = null;
                }
            }
            else
            {
                responseValue = xhr.responseXML;
            }
        }

        if (xhr.status == 200)
        {
            deferred.resolve(responseValue, "", responseContentType);
        }
        else
        {
            deferred.reject(responseValue, xhr.statusText, null, responseContentType);
        }
    };

    // Handle network errors
    xhr.onerror = function ()
    {
        //ALWAYS CHECK THE SCRIPT LOADED VARIABLE FIRST WHEN RETURNING FROM AN AJAX CALL
        //THIS IS TO AVOID SCRIPT ERRORS WHEN A SUBVIEW/SUBFORM IS CLOSED AND AN AJAX CALL RETURNS
        //DO NOT ADD CODE ABOVE THIS ON THE CALL RETURN
        if (typeof (_runtimeScriptsLoaded) === "undefined")
        {
            return;
        }

        var execeptionXML = parseXML('<Exception Title="' + Resources.MessageBox.Error + '"><Message Name="Message">' + Resources.Runtime.AjaxNetworkError + '</Message></Exception>');
        deferred.reject(execeptionXML, "503", null, "");
    };
    if (method === "POST")
    {
        xhr.setRequestHeader("Accept", "application/xml, text/xml, */*, application/json; q=0.01");
        var postData = "";
        if (data)
        {
            if (typeof (data) === "string")
            {
                xhr.setRequestHeader("Content-Type", "application/json");
                postData = data;
            }
            else
            {
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
                for (var property in data)
                {
                    if (data.hasOwnProperty(property))
                    {
                        if (postData.length > 0) postData += "&";
                        postData += encodeURIComponent(property) + "=" + encodeURIComponent(data[property]);
                    }
                }
            }
        }
        if (checkExistsNotEmpty(responseType) && responseType.toLowerCase() === "blob")
        {
            xhr.responseType = responseType;
        }
        xhr.send(postData);
    }
    else
    {
        xhr.send();
    }

    return deferred;
}

//notifies all applicable Controls and Views of ajax call failure to ensure proper handling (removes ajax spinners as well)
function _runtimeNotifyControlsAndViewsOfFailure(options)
{
    //#region
    options = checkExists(options) ? options : {};
    options.brokerPackages = checkExists(options.brokerPackages) ? options.brokerPackages : [];

    var brokerLength = options.brokerPackages.length;
    var tempHash = new SFRuntimeHash();

    while (brokerLength--)
    {
        var brokerPackage = options.brokerPackages[brokerLength];

        _runtimeNotifySetItemControlsOfFailurePerPackage({ brokerPackage: brokerPackage, tempHash: tempHash, returnData: options.returnData });

        if (checkExistsNotEmpty(brokerPackage.viewID))
        {
            runtimeBusyView(brokerPackage.viewID, false, false, brokerPackage.instanceID);
        }
    }
    tempHash = null;
    //#endregion
}

//internal function used inside _runtimeNotifyControlsAndViewsOfFailure per brokerpackage
function _runtimeNotifySetItemControlsOfFailurePerPackage(options)
{
    //#region
    if (checkExists(options.brokerPackage.controlID))
    {
        var keys = [options.brokerPackage.controlID, options.brokerPackage.viewID, options.brokerPackage.instanceID];
        if (!options.tempHash.get(keys))
        {
            var currentControl = _runtimeControllerFindObject({ controlID: options.brokerPackage.controlID, instanceID: options.brokerPackage.instanceID, viewID: options.brokerPackage.viewID })
            if (currentControl)
            {
                var objInfo =
                    {
                        error: true,
                        message: "Server ajax execution failed",
                        CurrentControlId: options.brokerPackage.controlID
                    };
                try
                {
                    executeControlFunction(currentControl, "SetItems", objInfo);
                }
                catch (exc)
                {
                    SFLog({ type: 3, source: "_runtimeNotifySetItemControlsOfFailurePerPackage", category: "AJAX", message: "Error on setitems on control {0} with error result".format(options.brokerPackage.controlID), data: options.returnData });
                }
            }
            options.tempHash.add(keys, true);
        }
    }
    //#endregion
}

//handles errors which occurred in ajax results
function handleResultError(options)
{
    options = checkExists(options) ? options : {};

    var loopContextID = null;
    if (checkExists(options.batchedActions) && options.batchedActions.length === 1)
    {
        loopContextID = getLoopContextID(options.batchedActions[0]);
    }

    if (checkExists(options.behaviour))
    {
        options.behaviour.handleError(options.errorType, options.data, options.status, options.error, options.brokerPackages, loopContextID);
    }
    else if (checkExists(options.deferred))
    {
        options.deferred.reject(options.errorType, options.data, options.status, options.error, options.brokerPackages, loopContextID);
    }
}

//function to check whether the ajax result for a certain workflow broker package contains an error
function isWorkflowResultError(options)
{
    //#region
    if ((options === null || typeof options === "undefined")
        || (options.packageValues === null || typeof options.packageValues === "undefined")
        || (options.packageValues.c === null || typeof options.packageValues.c === "undefined"))
    {
        return { isError: false };
    }

    var y = options.packageValues.c.length;
    if (y > 0)
    {
        while (y--)
        {
            var brokerPackage, packageAction, packageValue = null;
            var brokerMethod = "";

            if (checkExists(options.brokerPackages) && y < options.brokerPackages.length)
            {
                brokerPackage = options.brokerPackages[y];
            }

            if (checkExists(options.batchedActions) && y < options.batchedActions.length)
            {
                packageAction = options.batchedActions[y];
            }

            if (checkExists(brokerPackage) && checkExistsNotEmpty(brokerPackage.method))
            {
                brokerMethod = brokerPackage.method.toUpperCase();
            }

            if ((brokerMethod === "STARTPROCESS") || (brokerMethod === "ACTIONPROCESS"))
            {
                packageValue = options.packageValues.c[y];
                var data = packageValue.WorkflowMethodResult;

                if (data === "false")
                {
                    //return isError=true as well as the action associated with the error result and the internal error data (for ease of interpretation on function calling side)
                    return { isError: true, action: packageAction, data: data };
                }
            }
        }
    }
    return { isError: false };
    //#endregion
}

//handles succeeded AJAX results for runtime behaviour functionality and implement other functions to facilitate data
function handleDoneRuntimeBehaviourResult(options)
{
    if (checkExistsNotEmpty(options.responseContentType))
    {
        options.responseContentType = options.responseContentType.toUpperCase();
    }
    else
    {
        options.responseContentType = "";
    }
    if (options.responseContentType.contains("TEXT/HTML"))
    {
        var handleErrorOptions = {
            batchedActions: options.batchedActions,
            behaviour: options.behaviour,
            deferred: options.deferred,
            errorType: "redirect",
            brokerPackages: options.brokerPackages
        };
        handleResultError(handleErrorOptions);
    }
    else if (_runtimePauseAjax && (options.initialRetry === true))
    {
        //Initial retried ajax call succeeded without any exceptions; processing of ajax results can now be unpaused
        _runtimePauseAjax = false;

        //Remove initial retried ajax call from queue; it's the current call which succeeded, so no need to retry again
        _runtimeRetryAjaxQueue.shift();

        //Copy global queues to local queues for looping through retry triggers
        var localRetryAjaxQueue = _runtimeRetryAjaxQueue;
        var localContinueAjaxQueue = _runtimeContinueAjaxQueue;

        //Clear global queues before triggering retries to avoid duplicate entries if added to global queue again due to new pausing of ajax results
        _runtimeRetryAjaxQueue = [];
        _runtimeContinueAjaxQueue = [];

        while (localRetryAjaxQueue.length > 0)
        {
            ajaxCall.executeRuntimeBehaviour(localRetryAjaxQueue.shift());
        }

        //Continue processing result of succeeded initial retry ajax call before looping through queued continues
        continueHandleRuntimeBehaviourResult(
        {
            data: options.data,
            behaviour: options.behaviour,
            deferred: options.deferred,
            brokerPackages: options.brokerPackages,
            brokerPackagesJson: options.brokerPackagesJson,
            batchedActions: options.batchedActions,
            hasViewID: options.hasViewID,
            runAsync: options.runAsync
        });

        while (localContinueAjaxQueue.length > 0)
        {
            continueHandleRuntimeBehaviourResult(localContinueAjaxQueue.shift());
        }
    }
    else
    {
        continueHandleRuntimeBehaviourResult(
        {
            data: options.data,
            behaviour: options.behaviour,
            deferred: options.deferred,
            brokerPackages: options.brokerPackages,
            brokerPackagesJson: options.brokerPackagesJson,
            batchedActions: options.batchedActions,
            hasViewID: options.hasViewID,
            runAsync: options.runAsync
        });
    }
}

//handles failed AJAX results for runtime behaviour functionality and implement other functions to facilitate data
function handleFailRuntimeBehaviourResult(executionOptions, data, textStatus, errorThrown, responseContentType)
{

    var handleErrorOptions = {
        batchedActions: executionOptions.batchedActions,
        behaviour: executionOptions.behaviour,
        deferred: executionOptions.deferred,
        errorType: "exc",
        data: data,
        status: textStatus,
        error: errorThrown,
        brokerPackages: executionOptions.brokerPackages,
        brokerPackagesJson: executionOptions.brokerPackagesJson
    };

    if (!_runtimePauseAjax)
    {
        if (checkExistsNotEmpty(responseContentType))
        {
            responseContentType = responseContentType.toUpperCase();
        }
        else
        {
            responseContentType = "";
        }

        if (responseContentType.contains("TEXT/HTML"))
        {
            handleErrorOptions.errorType = "redirect";
        }
        else if (!checkExists(data))
        {
            handleErrorOptions.errorType = "noxml";
        }
        else if (SourceCode.Forms.ExceptionHandler.isAuthenticationException(data))
        {
            //Pauses processing of ajax results
            _runtimePauseAjax = true;

            _runtimeRetryAjaxQueue.push(executionOptions);

            runtimeHideBusyOverlay({ forceHide: true });
            hideAllBusyForResult(executionOptions.brokerPackages);
            _runtimeNotifyControlsAndViewsOfFailure({ brokerPackages: executionOptions.brokerPackages, returnData: data });

            SourceCode.Forms.ExceptionHandler.handleAuthenticationException(data, executionOptions, function () { closeAuthLoginPopup(handleErrorOptions); });

            return;
        }
        else if (SourceCode.Forms.ExceptionHandler.isException(data))
        {
            runtimeHideBusyOverlay({ forceHide: true });
            hideAllBusyForResult(executionOptions.brokerPackages);
            SFLog({ type: 5, source: "handleFailRuntimeBehaviourResult", category: "AJAX", message: "Error on AJAX execution", data: data });
            _runtimeNotifyControlsAndViewsOfFailure({ brokerPackages: executionOptions.brokerPackages, returnData: data });
        }
        else
        {
            var workflowErrorResult = isWorkflowResultError({ packageValues: data, brokerPackages: executionOptions.brokerPackages, batchedActions: executionOptions.batchedActions });

            if (workflowErrorResult.isError)
            {
                runtimeHideBusyOverlay({ forceHide: true });

                handleErrorOptions.batchedActions = [workflowErrorResult.action];
                handleErrorOptions.errorType = "wf";
            }
            else
            {
                handleErrorOptions.errorType = "ajax";
            }
        }
        handleResultError(handleErrorOptions);
    }
    else
    {
        if ((SourceCode.Forms.ExceptionHandler.isAuthenticationException(data)) && (executionOptions.initialRetry === true))
        {
            SourceCode.Forms.ExceptionHandler.handleAuthenticationException(data, executionOptions, function () { closeAuthLoginPopup(handleErrorOptions); });

            return;
        }

        _runtimeRetryAjaxQueue.push(executionOptions);
    }
}

//Clears all ajax retry variables and do normal error handling if the user opts out of retrying failed ajax calls
function closeAuthLoginPopup(options)
{
    _runtimePauseAjax = false;

    _runtimeRetryAjaxQueue = [];
    _runtimeContinueAjaxQueue = [];

    handleResultError(options);
}

//handles continuation of processing of the AJAX result for runtime behaviour functionality after any exceptions have been handled
function continueHandleRuntimeBehaviourResult(options)
{
    //#region
    if (!_runtimePauseAjax)
    {
        SFLog({ type: 3, source: "continueHandleRuntimeBehaviourResult", category: "AJAX", message: "AJAX execution complete", data: options.data });
        var packagevalues = options.data.c;
        var y = packagevalues.length;

        if (options.hasViewID === false)
        {
            runtimeHideBusyOverlay();
        }

        //flag to be set during processing of workflow executions; if set to false, behaviour.execute() will not be called at the end of batch processing, since the specific workflow execution renders it unnecessary
        var shouldExecuteBehaviour = true;

        var postBatchExecutions = [];

        if (y > 0)
        {
            var workflowResult = {};

            while (y--)
            {
                var brokerPackage, brokerPackageJson;
                var loopContextID = null;
                var packageAction = null;
                var brokerMethod = "";

                // wonder how reliably this will work? Every resultset should have a broker package, right? Can we count on them being in the same sequence?
                if (checkExists(options.brokerPackages) && y < options.brokerPackages.length)
                {
                    brokerPackage = options.brokerPackages[y];
                    brokerPackageJson = options.brokerPackagesJson[y];
                }

                if (checkExists(options.batchedActions) && y < options.batchedActions.length)
                {
                    packageAction = options.batchedActions[y];
                    loopContextID = getLoopContextID(packageAction);
                }

                if (checkExists(brokerPackage) && checkExistsNotEmpty(brokerPackage.method))
                {
                    brokerMethod = brokerPackage.method.toUpperCase();
                }

                //handle ajax result per brokerpackage
                if ((brokerMethod === "STARTPROCESS") || (brokerMethod === "ACTIONPROCESS"))
                {
                    workflowResult = continueHandleWorkflowResult(packagevalues[y], options.behaviour, packageAction, options.deferred);

                    // CHECK THE SCRIPT LOADED VARIABLE 
                    //THIS IS TO AVOID SCRIPT ERRORS WHEN A SUBVIEW/SUBFORM IS CLOSED	
                    //IE11 seems to have timing issues
                    if (typeof (_runtimeScriptsLoaded) === "undefined")
                    {
                        return;
                    }

                    if (shouldExecuteBehaviour && !workflowResult.shouldExecuteBehaviour)
                    {
                        shouldExecuteBehaviour = false;
                    }

                    //update options behaviour, since the input behaviour could have been updated during processing of workflow results
                    options.behaviour = workflowResult.behaviour;

                    //push functions specified during processing of workflow results to be called after the processing of the current batch (after the current while loop) into an array
                    if (checkExists(workflowResult.postBatchFunction))
                    {
                        postBatchExecutions.push([workflowResult.postBatchFunction, workflowResult.functionThis, workflowResult.functionParameters]);
                    }

                    if (brokerMethod === "ACTIONPROCESS" &&
                        checkExists(options.brokerPackagesJson) &&
                        checkExists(options.brokerPackagesJson[y]) && 
                        checkExists(options.brokerPackagesJson[y].Process) &&
                        checkExists(options.brokerPackagesJson[y].Process.ProcessInstance))
                    {
                        //[TFS 832320] Let the mobile app know that a task has been actioned
                        SourceCode.Forms.Runtime.MobileBridge.sendToMobileDevice(
                            {
                                methodName: "taskActioned",
                                serialNumber: options.brokerPackagesJson[y].Process.ProcessInstance.SerialNumber,
                                actionName: options.brokerPackagesJson[y].Process.ProcessInstance.ActionName
                            });
                    }
                }
                else if (brokerMethod === "LOADPROCESS")
                {
                    //update options behaviour, since the input behaviour could have been updated during processing of workflow results
                    options.behaviour = continueHandleProcessInformationResult(packagevalues[y], packageAction, options.behaviour, options.deferred);
                }
                else
                {
                    var windowToUse = window.self;
                    if (checkExists(options.behaviour))
                    {
                      windowToUse = getWindowToUse(packageAction, options.behaviour);
                    }
                    windowToUse.PopulateView(packagevalues[y], null, null, loopContextID, brokerPackage, brokerPackageJson);
                }
            }

            if (collectionTables.length > 0)
            {
                if (checkExists(options.behaviour))
                {
                    options.behaviour.hasSingleExecution = false;
                }

                var loopContextID = null;
                if (checkExists(options.batchedActions) && options.batchedActions.length === 1)
                {
                    loopContextID = getLoopContextID(options.batchedActions[0]);
                }
                buildCollectionTables(loopContextID);
            }
        }
        else
        {
            hideAllBusyForResult(options.brokerPackages);
        }

        //execute functions specified during processing of workflow results to be called after the batch processing while loop
        if (postBatchExecutions.length > 0)
        {
            var postBatchFunctionInstance = [];

            while (postBatchExecutions.length > 0)
            {
                postBatchFunctionInstance = postBatchExecutions.shift();
                postBatchFunctionInstance[0].apply(postBatchFunctionInstance[1], postBatchFunctionInstance[2]);
            }
        }

        if (checkExists(options.batchedActions))
        {
            for (var i = 0; i < options.batchedActions.length; i++)
            {
                removeLoopContextData({ loopContextID: getLoopContextID(options.batchedActions[i]) });
            }
        }

        if (checkExists(options.behaviour) && (options.runAsync !== false))//if synchronous (WF variables), behaviour will complete according to definition
        {
            options.behaviour.isExecuting = false;
            if (shouldExecuteBehaviour)
            {
                options.behaviour.executeBehaviour(); //correct usage
            }
        }
        else if (checkExists(options.deferred))
        {
            options.deferred.resolve(options.data);
        }
    }
    else
    {
        _runtimeContinueAjaxQueue.push(options);
    }
    //#endregion
}

//hide all the busy divs for views that returned results
function hideAllBusyForResult(brokerPackages)
{
    //#region
    var brokerLength = brokerPackages.length;
    var tempHash = new SFRuntimeHash();

    while (brokerLength--)
    {
        var brokerPackage = brokerPackages[brokerLength];
        var keys = [brokerPackage.viewID, brokerPackage.instanceID];
        if (!tempHash.get(keys))
        {
            runtimeBusyView(brokerPackage.viewID, false, false, brokerPackage.instanceID);
            tempHash.add(keys, true);
        }
    }
    tempHash = null;
    //#endregion
}

//constructs the xml packet, together with viewID array and calls the AJAXCall handler
function sendPacket(jsonObjects, behaviour, batchedActions, runAsync)
{
    //#region
    var brokerPackages = [];

    var hasViewID = false;
    var modalizeWorkflowView = false;
    var i = jsonObjects.length;
    while (i--)
    {
        var item = jsonObjects[i];
        var jsonObject = item.smartobject;
        var metadata = item.metadata;
        var brokerPackage =
            {
                controlID: metadata.idofcontrol,
                instanceID: metadata.instanceid,
            };
        if (checkExists(jsonObject))
        {
            brokerPackage.resultMappings = jsonObject.results;
        }

        var method = checkExists(jsonObject) ? jsonObject.method.name : metadata.method;
        if (checkExists(method))
        {
            brokerPackage.method = method;
            if (!modalizeWorkflowView && ((method.toUpperCase() === "ACTIONPROCESS")))
            {
                modalizeWorkflowView = true;
            }
        }
        var viewID = metadata.id;
        if (checkExists(viewID))
        {
            brokerPackage.viewID = viewID;
            hasViewID = true;
        }

        brokerPackages.unshift(brokerPackage);
    }

    if (!hasViewID)
    {
        runtimeShowBusyOverlay({ showSpinner: true });
    }
    var executionOptions =
        {
            brokerPackages: brokerPackages,
            behaviour: behaviour,
            hasViewID: hasViewID,
            modalizeWorkflowView: modalizeWorkflowView,
            brokerPackagesJson: jsonObjects,
            batchedActions: batchedActions,
            runAsync: runAsync
        };
    return ajaxCall.executeRuntimeBehaviour(executionOptions);
    //#endregion
}

//return value after the workflow has executed and all possible exceptions have been handled
function continueHandleWorkflowResult(data, behaviour, currentAction, deferred)
{
    //#region
    //result to be returned; default is the behaviour, since it can be updated as part of this function and whether behaviour.execute() should be called after this function (not always necessary)
    var result = {
        behaviour: behaviour,
        shouldExecuteBehaviour: true
    };

    var loopContextID = getLoopContextID(currentAction);

    SFLog({ type: 3, source: "continueHandleWorkflowResult", category: "AJAX", message: "AJAX execution complete", data: data });
    //workflow executed successfully
    //workflow error results are now handled in a seperate function before this function to help with batch executions
    // Avoid last-focus feature of the popup, returning focus to submit button
    if (jQuery("*[id$=_6f1d43bf-a7fe-21ed-36ac-0d3bcb633bfb]").is(":focus"))
    {
        jQuery("*[id$=_6f1d43bf-a7fe-21ed-36ac-0d3bcb633bfb]")[0].blur();
    }

    var currentMethod = currentAction.getAttribute("Method");
    var actionViewID = currentAction.getAttribute("ViewID");
    var actionInstanceID = currentAction.getAttribute("InstanceID");
    if (currentMethod.toLowerCase() === "actionprocess")
    {
        //map the results of the loaded worklist item
        result.behaviour = mapWorkflowResults(currentAction, workflowInfo, result.behaviour);

        //check for action properties
        var WFAfterSubmitEventID = currentAction.getAttribute("WFAfterSubmitEventID");
        var WFAfterSubmitInstanceID = currentAction.getAttribute("WFAfterSubmitInstanceID");
        var WFMessage = currentAction.getAttribute("WFMessage");
        var WFNavigateURL = currentAction.getAttribute("WFNavigateURL");

        //behaviour does not continue after the system WorkflowSubmit event
        if (checkExists(WFAfterSubmitEventID))
        {
            var InstancePath = (checkExists(WFAfterSubmitInstanceID)) ? "[@InstanceID='" + WFAfterSubmitInstanceID + "']" : "";
            var submitEventXP = "Events/Event[@DefinitionID='" + WFAfterSubmitEventID + "']" + InstancePath;
            var eventInfo = locateEventInfoOnWindow(submitEventXP);

            var workflowSubmitEvent = null;
            var windowToUse = null;

            if (checkExists(eventInfo))
            {
                workflowSubmitEvent = eventInfo.event;
                windowToUse = eventInfo.windowToUse;
            }

            if (checkExists(workflowSubmitEvent))
            {
                windowToUse.handleEvent(workflowSubmitEvent.getAttribute("SourceID"), workflowSubmitEvent.getAttribute("SourceType"), $sn(workflowSubmitEvent, "Name").text, null, WFAfterSubmitInstanceID, null, null, WFAfterSubmitEventID, null, null, null, loopContextID);
                result.shouldExecuteBehaviour = false;
                return result;
            }
        }
        else if (checkExists(WFNavigateURL))
        {
            //add framePosting function call to functions to be executed after processing of all batched executions, since all batched executions should be handled before navigating away from the current page
            result.shouldExecuteBehaviour = false;
            result.postBatchFunction = framePosting;
            result.functionThis = this;
            result.functionParameters = ["_self", WFNavigateURL, ''];

            return result;
        }
        else if (checkExists(WFMessage))
        {
            var options = { message: WFMessage };
            popupManager.showNotification(options);
        }
        executeWorkflowActionedEvent(loopContextID, actionViewID, actionInstanceID);
    }
    else
    {
        var processXml;
        if (checkExists(data) && checkExists(data.collection) && (data.collection.length > 0))
        {
            processXml = data.collection[0];
        }
        if (checkExists(processXml))
        {
            setWorkflowInformation(processXml);//set the workflow fields so they can be used
            result.behaviour = mapWorkflowResults(currentAction, processXml, result.behaviour);
        }

        //startprocess etc
        if (checkExists(result.behaviour))
        {
            if (checkExists(SourceCode.Forms.Settings.Compatibility)
                && checkExists(SourceCode.Forms.Settings.Compatibility.WorflowActionedGlobalEvent)
                && SourceCode.Forms.Settings.Compatibility.WorflowActionedGlobalEvent)
            {
                executeWorkflowActionedEvent(loopContextID, actionViewID, actionInstanceID);
            }
        }
    }

    return result;
    //#endregion
}

//helper function to locate event information on the correct window via xpath
function locateEventInfoOnWindow(xpathValue)
{
    var windowToUse = window.self;
    var foundEvent = $sn(formBindingXml, xpathValue);

    if (!checkExists(foundEvent))
    {
        if (checkExists(runtimeNavigatedEvents))
        {
            foundEvent = $sn(runtimeNavigatedEvents, xpathValue);
        }

        if (!checkExists(foundEvent))
        {
            var level = parseInt(__runtimeFormLevel, 10);
            if (level > 0)
            {
                var windowForPopups = SourceCode.Forms.Runtime.getMasterRuntimeWindow();
                foundEvent = $sn(windowForPopups.formBindingXml, xpathValue);

                if (checkExists(foundEvent))
                {
                    windowToUse = windowForPopups;
                }
                else
                {
                    var runtimeIframePopups = SourceCode.Forms.Runtime.getAllPopupsWithRuntimeInstances();
                    if (runtimeIframePopups.length > 0)
                    {
                        //further  failsafe to try all possible open popup windows if nothing was found in rest of stack (TFS475910)
                        var popupLength = runtimeIframePopups.length;
                        var innerWindow = windowToUse;
                        while (popupLength > 0 && !checkExists(foundEvent))
                        {
                            innerWindow = getPopupWindowOnLevel(windowToUse, popupLength - 1, runtimeIframePopups, true);
                            if (checkExists(innerWindow))
                            {
                                if (checkExists(innerWindow.formBindingXml))
                                {
                                    foundEvent = $sn(innerWindow.formBindingXml, xpathValue);
                                }
                                if (checkExists(innerWindow.runtimeNavigatedEvents) && !checkExists(foundEvent))
                                {
                                    foundEvent = $sn(innerWindow.runtimeNavigatedEvents, xpathValue);
                                }
                            }

                            popupLength--;
                        }
                        if (checkExists(foundEvent))
                        {
                            windowToUse = innerWindow;
                        }

                    }
                }
            }
        }
    }
    var result = { windowToUse: windowToUse, event: foundEvent };
    return result;
}

//locates and executes correct workflow actioned event
//if no corresponding event can be found on the view, but it is run from a form where such a rule is set up, that rule will fire
function executeWorkflowActionedEvent(loopContextID, actionViewID, actionInstanceID)
{
    var executeOnView = false;
    if (_runtimeCallerType === "Form")
    {
        //action doesn't indicate the view but only the relevant instance
        if (checkExists(actionInstanceID) && !checkExists(actionViewID))
        {
            var viewDef = getViewDefinition(null, actionInstanceID);
            if (checkExists(viewDef))
            {
                actionViewID = viewDef.getAttribute("ID");
            }
        }
        if (checkExists(actionViewID))
        {
            executeOnView = verifyEventHandling(actionViewID, "View", "WorkflowActioned", actionInstanceID, false);
        }
    }
    //for the non-system actionprocess the behaviour will continue as the workflow is actioned
    //removed parentBehaviour from handleEvent call, since parentBehaviour will be handled by behaviour.execute() after processing of all batched executions
    if (executeOnView)
    {
        handleEvent(actionViewID, "View", 'WorkflowActioned', false, actionInstanceID, null, null, null, null, null, null, loopContextID);
    }
    else
    {
        handleEvent(currentForm, _runtimeCallerType, 'WorkflowActioned', false, null, null, null, null, null, null, null, loopContextID);
    }
}

//set the global workflowInfo variable
function setWorkflowInformation(processXml)
{
    //#region
    if (!checkExists(workflowInfo))
    {
        workflowInfo = [];
    }
    //prevents duplication of process information when loaded
    if (checkExists(processXml))
    {
        var processInstanceNode = processXml["ProcessInstance"];
        var sn = processInstanceNode["SerialNumber"];

        var wfLength = workflowInfo.length;
        while (wfLength--)
        {
            if (workflowInfo[wfLength].ProcessInstance.SerialNumber === sn)
            {
                workflowInfo.splice(wfLength, 1);
                break;
            }
        }

        workflowInfo.push(processXml);
    }
    //#endregion
}

//handles the results that were returned when requesting process information and all possible exceptions have been handled
function continueHandleProcessInformationResult(data, currentAction, behaviour, deferred)
{
    //#region
    var loopContextID = getLoopContextID(currentAction);

    SFLog({ type: 3, source: "continueHandleProcessInformationResult", category: "AJAX", message: "AJAX execution complete", data: data });
    //do something with the data after execution (similar to a data transfer)
    var processXml = data.collection[0];
    setWorkflowInformation(processXml);
    applyWorkflowViewInformation(currentAction, processXml, loopContextID);
    behaviour = mapWorkflowResults(currentAction, processXml, behaviour);

    //return behaviour, since behaviour might have been changed as part of this function and should be updated on calling function side
    return behaviour;
}

function applyWorkflowViewInformation(currentAction, processXml, loopContextID)
{
    var workflowPaneData = {};
    var workflowStrip = currentAction.getAttribute("WorkflowStripLocation");
    workflowPaneData.workflowStrip = workflowStrip;

    var workflowView = jQuery("*[id$=_9afc3bff-abee-4066-93d6-c217cdf765f5]");
    var actionInstanceID = currentAction.getAttribute("InstanceID");
    if (workflowView.length > 0)
    {
        positionAndShowWorkflowStrip(workflowStrip);
        workflowView.modalize(false);

        // Populate the Workflow View as required
        var processSN = getCurrentWorkflowInformationDetails(processXml, "WorkflowProcessProperty", "SerialNumber", null, null, loopContextID);
        var workflowSubmitButton = jQuery("*[id$=_6f1d43bf-a7fe-21ed-36ac-0d3bcb633bfb]");
        if (workflowSubmitButton.length > 0)
        {
            var WFAfterSubmitEventID = currentAction.getAttribute("WFAfterSubmitEventID");
            var WFMessage = currentAction.getAttribute("WFMessage");
            var WFNavigateURL = currentAction.getAttribute("WFNavigateURL");

            // Store workflow stip data.
            workflowPaneData.serialNumber = processSN;
            workflowPaneData.actionInstanceID = actionInstanceID;
            workflowPaneData.WFAfterSubmitEventID = WFAfterSubmitEventID;
            workflowPaneData.WFMessage = WFMessage;
            workflowPaneData.WFNavigateURL = WFNavigateURL;

            workflowSubmitButton.off("click").on("click", doWorkflowSubmit);
        }

        // Populate Actions.
        var items = [];
        var option =
            {
                index: 0,
                text: "",
                value: "",
                className: "",
                selected: true,
                disabled: ""
            };
        items.push(option);
        var processActions = processXml.Actions;
        if (checkExists(processActions))
        {
            for (var pa = 0; pa < processActions.length; pa++)
            {
                var processActionName = processActions[pa].Name;
                option =
                    {
                        index: pa + 1,
                        text: processActionName,
                        value: processActionName,
                        className: "",
                        selected: false,
                        disabled: ""
                    };
                items.push(option);
            }
        }

        workflowPaneData.actionItems = items;
        workflowPaneData.folio = getCurrentWorkflowInformationDetails(processXml, "WorkflowProcessProperty", "Folio", null, null, loopContextID);
        workflowPaneData.activity = getCurrentWorkflowInformationDetails(processXml, "WorkflowActivityProperty", "DisplayName", null, null, loopContextID);
        if (!checkExistsNotEmpty(workflowPaneData.activity)) {
            // Name fallback
            workflowPaneData.activity = getCurrentWorkflowInformationDetails(processXml, "WorkflowActivityProperty", "Name", null, null, loopContextID);
        }
        workflowPaneData.instruction = getCurrentWorkflowInformationDetails(processXml, "WorkflowEventProperty", "Instruction", null, null, loopContextID);
        if (!checkExistsNotEmpty(workflowPaneData.instruction)) {
            // Instruction fallback
            workflowPaneData.instruction = getCurrentWorkflowInformationDetails(processXml, "WorkflowActivityProperty", "Description", null, null, loopContextID);
        }

        populateWorkflowStrip(workflowPaneData);     

        // Store the workflow strip data data.
        jQuery("#WorkflowStrip").not(".drop-menu").data("WFInformation", workflowPaneData);
    }
}

function populateWorkflowStrip(workflowPaneData)
{
    if (Array.isArray(workflowPaneData.actionItems))
    {
        var actionDropdown = jQuery("*[id$=_936c1d65-be60-8c5c-0de9-1db2018d94c0_DropDown]");
        if (actionDropdown.length > 0)
        {
            actionDropdown.dropdown().dropdown("prepareForRefresh");
            actionDropdown.off("change").on("change", null, function ()
            {
                updateCalculatedControls(null, null, "SystemVariable", "currentworkflowactionname");
            });

            actionDropdown.dropdown("option", "items", workflowPaneData.actionItems);
            actionDropdown.dropdown("refresh");
        }
    }

    var control = jQuery("*[id$=3100a332-25fc-7771-94fb-40f52ad4c3eb]").attr("id");
    var objInfo = new PopulateObject(null, true, control, "isreadonly");
    //UtilitiesBehaviour.setControlPropertyOrStyle(objInfo);
    SourceCode.Forms.Controls.Web.TextBox.setProperty(objInfo);
    if (workflowPaneData.folio) {
        objInfo = new PopulateObject(null, workflowPaneData.folio, control);
        //UtilitiesBehaviour.setSimpleValue(objInfo);
        SourceCode.Forms.Controls.Web.TextBox.setValue(objInfo);
    }

    control = jQuery("*[id$=_67c81e3b-3c56-738c-e998-43ed91aaa2ec]").attr("id");
    objInfo = new PopulateObject(null, true, control, "isreadonly");
    //UtilitiesBehaviour.setControlPropertyOrStyle(objInfo);
    SourceCode.Forms.Controls.Web.TextBox.setProperty(objInfo);
    if (workflowPaneData.activity) {
        objInfo = new PopulateObject(null, workflowPaneData.activity, control);
        //UtilitiesBehaviour.setSimpleValue(objInfo);
        SourceCode.Forms.Controls.Web.TextBox.setValue(objInfo);
    }

    control = jQuery("*[id*=_6cf482ae-fc16-5b47-1992-48906344bf8b]").attr("id").replace("_TextArea", "");
    objInfo = new PopulateObject(null, true, control, "isreadonly");
    UtilitiesBehaviour.setControlPropertyOrStyle(objInfo);
    //SourceCode.Forms.Controls.Web.TextBox.setProperty(objInfo);
    if (checkExists(workflowPaneData.instruction)) {
        objInfo = new PopulateObject(null, workflowPaneData.instruction, control);
        UtilitiesBehaviour.setSimpleValue(objInfo);
        //SourceCode.Forms.Controls.Web.TextBox.setValue(objInfo);
    }
}

function positionAndShowWorkflowStrip(workflowStrip)
{
    // Position the Workflow Strip if it exists
    if (checkExists(workflowStrip))
    {
        var workflowPane = jQuery("#WorkflowStrip").not(".drop-menu");
        var normalPane = jQuery(".runtime-form.theme-entry");
        var currentMargin = jQuery(".runtime-content").css("margin-top");

        workflowPane.find(".dropdown-box").addClass("workflow-entry");
        if (normalPane.length > 0)
        {
            if (workflowStrip.toLowerCase() === "bottom")
            {
                workflowPane.insertAfter(normalPane).css("display", "");
                var tabTop = jQuery(".theme-entry .tabs-top.tab-box .tab-box-body");
                if (tabTop.length > 0)
                {
                    currentMargin = (parseInt(currentMargin, 10) + parseInt(tabTop.css("top"), 10)) + "px";
                    normalPane[0].style.marginBottom = currentMargin;
                }
                workflowPane[0].style.marginTop = currentMargin;
                workflowPane[0].style.marginBottom = "0px";
            }
            else if (workflowStrip.toLowerCase() === "top")
            {
                workflowPane.insertBefore(normalPane).css("display", "");
                workflowPane[0].style.marginBottom = currentMargin;
                workflowPane[0].style.marginTop = "0px";
            }
        }
        else
        {
            //opening the workflow item in from view
            if (workflowStrip.toLowerCase() === "bottom")
            {
                if (workflowPane.next())
                {
                    workflowPane.insertAfter(workflowPane.next());
                }
                workflowPane.css({ "display": "", "margin-top": "5px", "margin-bottom": "0px" });
            }
            else if (workflowStrip.toLowerCase() === "top")
            {
                if (workflowPane.prev())
                {
                    workflowPane.insertBefore(workflowPane.prev());
                }
                workflowPane.css({ "display": "", "margin-bottom": "5px", "margin-top": "0px" });
            }
        }
    }
}

//handle output mappings of workflow results
function mapWorkflowResults(currentAction, processXml, behaviour)
{
    //#region
    var loopContextID = getLoopContextID(currentAction);

    var results = $mn(currentAction, "Results/Result");
    //#region
    //loop through parameters and add properties
    for (var r = 0; r < results.length; r++)
    {
        var resultNode = results[r];

        var targetTransferredID = resultNode.getAttribute("TargetSubFormID");
        if (checkExistsNotEmptyGuid(targetTransferredID))
        {
            resultNode = populateSubformContext(resultNode, targetTransferredID);
        }
        else
        {
            targetTransferredID = resultNode.getAttribute("TargetTransferredID");
        }
        var targetInstanceID = resultNode.getAttribute("TargetInstanceID");
        var targetRuntimeContextID = resultNode.getAttribute("TargetRuntimeContextID");
        var targetType = resultNode.getAttribute("TargetType");
        var target = resultNode.getAttribute("TargetID");

        var sourceType = resultNode.getAttribute("SourceType");
        var source = resultNode.getAttribute("SourceID");
        var sourceValue = null;

        if (sourceType === "Result")
        {
            if (source.toLowerCase() === "getworkflowactions")
            {
                sourceValue = getWorkflowActionCollection(processXml);
            }
        }
        else
        {
            sourceValue = getCurrentWorkflowInformation(processXml, resultNode, loopContextID);
        }

        if (checkExists(sourceValue))
        {
            switch (targetType)
            {
                case "Control":

                    if (sourceType === "Result")
                    {
                        if (source.toLowerCase() === "getworkflowactions")
                        {
                            populateListControlWithWorkflowProcessActions(target, sourceValue)
                        }
                    }
                    else
                    {
                        var findOptions =
                            {
                                controlID: target,
                                instanceID: targetInstanceID,
                                transferredID: targetTransferredID,
                                runtimeContextID: targetRuntimeContextID,
                                isDestination: true
                            };

                        var instanceObj = findCorrectInstanceForDataTransfer(findOptions);
                        if (checkExists(instanceObj))
                        {
                            var currentControl = instanceObj.result;
                            if (checkExists(currentControl))
                            {
                                windowToUse = instanceObj.WindowToUse;
                                var objInfoResult = new PopulateObject(null, sourceValue, target);
                                windowToUse.executeControlFunction(currentControl, "SetValue", objInfoResult);
                            }
                        }
                    }
                    break;
                case "ViewField":
                    setHiddenFieldValue(target, sourceValue, null, targetInstanceID, null, null, null, loopContextID);
                    break;
                case "ViewSource":
                    if (sourceType === "ProcessItemReference")
                    {
                        behaviour = transformItemReferenceForExecution(target, targetInstanceID, sourceValue, behaviour);
                    }
                    break;
                default: //handle all other targettypes (such as viewparameters etc)
                    updateTargetWithValue(currentAction, behaviour, resultNode, window.self, source, sourceType, sourceValue, behaviour.methodExecuted);
                    break;
            }
        }
    }
    return behaviour;
    //#endregion
}

function populateListControlWithWorkflowProcessActions(target, sourceValue)
{
    var currentControl;
    var currentControl = _runtimeControllerFindObject({ controlID: target, propertySearch: "SetItems" });
    if (checkExists(currentControl))
    {
        var objInfoResult = new PopulateObject(null, null, target, null, null, sourceValue);
        executeControlFunction(currentControl, "SetItems", objInfoResult);

        var options =
            {
                viewId: null,
                instanceId: null,
                controlId: target,
                value: sourceValue
            };

        if (checkExists(currentControl.parentNode) && checkExists(currentControl.parentNode.parentNode))
        {
            options.viewId = currentControl.parentNode.parentNode.getAttribute("ID");
            options.instanceId = currentControl.parentNode.parentNode.getAttribute("InstanceID");
        }
        SourceCode.Forms.Runtime.Information.setControlWorkflowHistory(options);
    }
}

//transfers the information stored in process item reference to field values and appends the action to execute the smartobject if relevant to the list of executable actions on the behaviour
function transformItemReferenceForExecution(DataSourceID, InstanceID, ProcessItemReference, behaviour)
{
    //#region
    var viewDef = getViewDefinition(null, InstanceID, DataSourceID);
    if (checkExists(viewDef))
    {
        var ViewID = viewDef.getAttribute("ID");
        var currentDataSource = $sn(viewDef, "Fields/Field[@DataSourceID='" + DataSourceID + "']"); //first field is fine - just need to get the datasource info
        var ObjectID = currentDataSource.getAttribute("ObjectID");
        var ContextID = currentDataSource.getAttribute("ContextID");
        var ContextType = currentDataSource.getAttribute("ContextType");

        if (checkExists(ProcessItemReference))
        {
            //get the method from the item reference
            var methodName = $sn(ProcessItemReference, "settings/method/methodName");
            if (checkExists(methodName))
            {
                methodName = methodName.text;

                //construct action to execute the method with the relevant parameters
                var currentXml = $xml("<Action><Parameters/></Action>");
                var currentAction = $sn(currentXml, "Action");
                currentAction.setAttribute("ViewID", ViewID);
                if (checkExists(InstanceID))
                {
                    currentAction.setAttribute("InstanceID", InstanceID);
                }
                currentAction.setAttribute("Method", methodName);
                currentAction.setAttribute("ObjectID", ObjectID);
                currentAction.setAttribute("Type", "Execute");
                currentAction.setAttribute("ExecutionType", "Synchronous");
                var currentParameters = $sn(currentAction, "Parameters");

                var processItems = $mn(ProcessItemReference, "items/item");
                var pi = processItems.length;
                var shouldFilter = false;
                var filter, filterContainer;
                if (pi > 1)//this is a list - a filter should be specified
                {
                    shouldFilter = true;
                    filter = currentXml.createElement("Filter");
                    currentAction.appendChild(filter);

                    filterContainer = currentXml.createElement("Filter");
                    filter.appendChild(filterContainer);
                }
                var lastNode = filterContainer;
                var lastParentNode = lastNode;
                for (var it = 0; it < pi; it++)
                {
                    //get the properties from the item reference
                    var props = $mn(processItems[it], "properties/property");
                    var p = props.length;
                    if (shouldFilter)
                    {
                        if (it < (pi - 1))
                        {
                            var orFilter = currentXml.createElement("Or");
                            lastParentNode.appendChild(orFilter);
                            lastParentNode = orFilter;
                        }
                        if (p > 1)
                        {
                            var andFilter = currentXml.createElement("And");
                            lastParentNode.appendChild(andFilter);
                            lastNode = andFilter;
                        }
                        else
                        {
                            lastNode = lastParentNode;
                        }
                    }
                    while (p--)
                    {
                        var prop = props[p];
                        var propertyName = prop.getAttribute("name");
                        var propertyValue = prop.text;
                        if (!shouldFilter)
                        {
                            setHiddenJSONValue(ObjectID, "Object", ViewID, null, null, null, null, null, ContextID, ContextType, null, propertyName, "ObjectProperty", propertyValue, false, InstanceID);
                            var currentParameter = currentXml.createElement("Parameter");
                            currentParameter.setAttribute("SourceID", "Value");
                            currentParameter.setAttribute("SourceType", "Value");
                            currentParameter.setAttribute("TargetID", propertyName);
                            currentParameter.setAttribute("TargetType", "ObjectProperty");
                            var sourceValue = currentXml.createElement("SourceValue");
                            var valueNode = currentXml.createCDATASection(propertyValue);
                            sourceValue.appendChild(valueNode);
                            currentParameter.appendChild(sourceValue);
                            currentParameters.appendChild(currentParameter);
                        }
                        else
                        {
                            var filterOperator = currentXml.createElement("Equals");
                            lastNode.appendChild(filterOperator);

                            var leftItem = currentXml.createElement("Item");
                            leftItem.setAttribute("SourceType", "ObjectProperty");
                            leftItem.setAttribute("SourceID", propertyName);
                            filterOperator.appendChild(leftItem);

                            var rightItem = currentXml.createElement("Item");
                            rightItem.setAttribute("SourceType", "Value");
                            var sourceValueNode = currentXml.createElement("SourceValue");
                            rightItem.appendChild(sourceValueNode);
                            sourceValueNode.appendChild(currentXml.createTextNode(propertyValue));
                            filterOperator.appendChild(rightItem);
                        }
                    }

                    //get the parameters from the item reference
                    var params = $mn(processItems[it], "parameters/parameter");
                    p = params.length;
                    while (p--)
                    {
                        var param = params[p];
                        var paramName = param.getAttribute("name");
                        var paramValue = param.text;
                        setHiddenJSONValue(ObjectID, "Object", ViewID, null, null, null, methodName, ContextID, ContextType, null, paramName, "MethodParameter", paramValue);
                        var currentParameter2 = currentXml.createElement("Parameter");
                        currentParameter2.setAttribute("SourceID", "Value");
                        currentParameter2.setAttribute("SourceType", "Value");
                        currentParameter2.setAttribute("TargetID", paramName);
                        currentParameter2.setAttribute("TargetType", "MethodParameter");
                        var sourceValue2 = currentXml.createElement("SourceValue");
                        var valueNode2 = currentXml.createCDATASection(paramValue);
                        sourceValue2.appendChild(valueNode2);
                        currentParameter2.appendChild(sourceValue2);
                        currentParameters.appendChild(currentParameter2);
                    }
                }
                if (!checkExists(behaviour))
                {
                    //failsafe to prevent JS errors when behaviour is not available (async execution), this is to ensure that it will still be executed
                    var masterRuntimeWindow = SourceCode.Forms.Runtime.getMasterRuntimeWindow();
                    behaviour = new masterRuntimeWindow.SourceCode.Forms.Runtime.BehaviourEvent({ handlers: [], SourceID: currentForm, methodExecuted: 'ItemRef', SourceType: _runtimeCallerType, InstanceID: InstanceID });
                }
                behaviour.actions.unshift(currentAction);
            }
        }
    }
    return behaviour;
    //#endregion
}

//execute runtime behaviour functionality
AjaxCall.prototype.sendEmailBehaviour = function (message, currentAction, behaviour)
{
    //#region
    SFLog({ type: 1, source: "sendEmailBehaviour", category: "AJAX", message: "Sending email", data: message });
    var deferred = null;
    if (!checkExists(behaviour))
    {
        deferred = $.Deferred();
    }

    var masterRuntimeWindow = SourceCode.Forms.Runtime.getMasterRuntimeWindow();
    masterRuntimeWindow.updateExecutionTracker(1);

    var ajaxPromise;
    if (_runtimeNativeAjax)
    {
        ajaxPromise = _runtimeAjaxCall("POST", this.ajaxUrlValue, {}, { method: "sendmail", mailmessage: encodeURIComponent(message) });
    }
    else
    {
        ajaxPromise = jQuery.ajax({
            url: this.ajaxUrlValue,
            dataType: "xml",
            type: "POST",
            global: false,
            data: { method: "sendmail", mailmessage: encodeURIComponent(message) }
        });
    }

    ajaxPromise.done(function (data)
    {
        //ALWAYS CHECK THE SCRIPT LOADED VARIABLE FIRST WHEN RETURNING FROM AN AJAX CALL
        //THIS IS TO AVOID SCRIPT ERRORS WHEN A SUBVIEW/SUBFORM IS CLOSED AND AN AJAX CALL RETURNS
        //DO NOT ADD CODE ABOVE THIS ON THE CALL RETURN
        if (typeof (_runtimeScriptsLoaded) === "undefined")
        {
            return;
        }

        handleMailingResult(data, currentAction, behaviour, deferred);
    }).fail(function (data, status, error)
    {
        //ALWAYS CHECK THE SCRIPT LOADED VARIABLE FIRST WHEN RETURNING FROM AN AJAX CALL
        //THIS IS TO AVOID SCRIPT ERRORS WHEN A SUBVIEW/SUBFORM IS CLOSED AND AN AJAX CALL RETURNS
        //DO NOT ADD CODE ABOVE THIS ON THE CALL RETURN
        if (typeof (_runtimeScriptsLoaded) === "undefined")
        {
            return;
        }

        if (!_runtimeNativeAjax)
        {
            // jquery sends the jqXHR as first parameter
            data = data.responseXML;
        }
        var executionOptions = {
            message: message,
            currentAction: currentAction,
            behaviour: behaviour,
            deferred: deferred
        };
        if (data == null)
        {
            data = parseXML('<Exception Title="' + Resources.MessageBox.Error + '"><Message Name="Message">' + Resources.Runtime.AjaxNetworkError + '</Message></Exception>');
            status = "503";
        }
        handleFailMailingResult(executionOptions, data, status, error)
    }).always(function ()
    {
        // Always update the execution tracker last.
        this.updateExecutionTracker(-1);
    }.bind(masterRuntimeWindow));
    if (deferred)
    {
        return deferred.promise();
    }
    //#endregion
};

//handles the rest of the behaviour after a mail was succesfully sent
function handleMailingResult(data, currentAction, behaviour, deferred)
{
    //#region
    SFLog({ type: 1, source: "handleMailingResult", category: "AJAX", message: "AJAX execution complete", data: data });

    removeLoopContextData({ loopContextID: getLoopContextID(currentAction) });

    setTimeout(function ()
    {
        if (checkExists(behaviour))
        {
            behaviour.isExecuting = false;
            behaviour.executeBehaviour(); //correct usage
        }
    }, 0);
    if (deferred)
    {
        deferred.resolve(data);
    }
    //#endregion
}

//handles the rest of the behaviour after a mail was failed to be sent
function handleFailMailingResult(executionOptions, data, textStatus, errorThrown)
{
    var handleErrorOptions = {
        batchedActions: [executionOptions.currentAction],
        behaviour: executionOptions.behaviour,
        deferred: executionOptions.deferred,
        errorType: "ajax",
        data: data,
        status: textStatus,
        error: errorThrown
    };

    if (SourceCode.Forms.ExceptionHandler.isAuthenticationException(data))
    {
        handleErrorOptions.errorType = "auth";
    }
    else if (SourceCode.Forms.ExceptionHandler.isException(data))
    {
        SFLog({ type: 5, source: "handleMailingResult", category: "AJAX", message: "Error on AJAX execution", data: data });
        handleErrorOptions.errorType = "exc";
    }
    else if (data.xml.toLowerCase().trim() !== "<true>value</true>")
    {
        //email was not sent
        SFLog({ type: 5, source: "handleMailingResult", category: "AJAX", message: Resources.RuntimeMessages.ErrorEmailNotSent, data: executionOptions.currentAction });
        handleErrorOptions.errorType = "email";
    }

    handleResultError(handleErrorOptions);
}

// retrieve environment field's value
AjaxCall.prototype.getEnvironmentFieldValue = function (fieldId)
{
    //#region
    var result = null;
    SFLog({ type: 1, source: "getEnvironmentFieldValue", category: "AJAX", message: "Getting environment field's value from server", data: "Field Id: {0}".format(fieldId) });

    var masterRuntimeWindow = SourceCode.Forms.Runtime.getMasterRuntimeWindow();
    masterRuntimeWindow.updateExecutionTracker(1);

    jQuery.ajax({
        data: { method: "getEnvironmentFieldValue", FieldId: fieldId },
        global: false,
        async: false,
        dataType: "text",
        url: this.ajaxUrlValue,
        type: "POST"
    }).done(function (data)
    {
        //ALWAYS CHECK THE SCRIPT LOADED VARIABLE FIRST WHEN RETURNING FROM AN AJAX CALL
        //THIS IS TO AVOID SCRIPT ERRORS WHEN A SUBVIEW/SUBFORM IS CLOSED AND AN AJAX CALL RETURNS
        //DO NOT ADD CODE ABOVE THIS ON THE CALL RETURN
        if (typeof (_runtimeScriptsLoaded) === "undefined")
        {
            return;
        }

        result = data;
    }).always(function ()
    {
        // Always update the execution tracker last.
        this.updateExecutionTracker(-1);
    }.bind(masterRuntimeWindow));

    return result;
    //#endregion
};
