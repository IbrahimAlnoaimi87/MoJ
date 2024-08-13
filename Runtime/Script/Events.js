/*
Script: Events.js
This file will contain all functionality to handle runtime eventing */

//#region Global Variables
var eventsCancelled = false;
var _runtimePresetControls = [];
var _runtimePostInitEvents = [];
var _environmentFieldCache = {};
var _runtimeErrorObjects = [];
var _runtimeLastUnhandledErrorID = null;
var _runtimeInitializeIndicatorTimeout = null;
var _runtimeIsInitializing = true;
var _runtimeIsRendering = true;
var _runtimeConditionalStylingBeingApplied = false;
var _runtimeAJAXExecutionCount = 0;
var _runtimeBehaviourExecutionCount = 0;
var _runtimeExecBehaviorIds = [];
var _runtimeIdleState = false;
var _runtimeLatestSerialNumber = null;
var _runtimeLatestWorkflowActivityName = null;
var _runtimeLatestWorkflowActivityDisplayName = null;
var _runtimeLatestWorkflowActionName = null;
var _runtimeLatestSerialNumberWarnings = [];

// Namespacing
var SourceCode = SourceCode ? SourceCode : {};
SourceCode.Forms = SourceCode.Forms ? SourceCode.Forms : {};
SourceCode.Forms.Runtime = SourceCode.Forms.Runtime ? SourceCode.Forms.Runtime : {};
//#endregion Global Variables

function raiseEvent(sourceId, sourceType, eventName, instanceID)
{
    if (_runtimeLoadingFromDraft)
    {
        return;
    }

    //#region
    //function that should be executed when everything is loaded
    var raisedFunction = function ()
    {
        attemptSetItemsComplete(sourceType.toLowerCase(), sourceId, eventName.toLowerCase());
        testForPanelColumnSyncing(sourceType.toLowerCase(), sourceId, eventName.toLowerCase());
        //extended with instanceID to cater for view parameter onchanges on different instances
        handleEvent(sourceId, sourceType, eventName, null, instanceID);
    };

    //initialization has not completed, add to the stack
    if (_runtimeIsRendering === true)
    {
        addRuntimePendingCalls(raisedFunction, false);
    }
    else
    {
        //normal usage
        raisedFunction();
    }

    //#endregion
}

//check to see if a user event has actions that can be executed
function verifyEventHandling(sourceId, sourceType, eventName, instanceID, checkForConditions)
{
    //#region
    var result = false;
    if (checkExists(formBindingXml))
    {
        var instanceXP = returnInstanceXP(instanceID, false, false, true, false);
        var baseXP = "Events/Event[@SourceID='" + sourceId + "'][@SourceType='" + sourceType + "'][Name/text()=" + eventName.xpathValueEncode() + "][@Type='User']" + instanceXP + "[@IsEnabled='true']/Handlers/Handler";

        var handlers;
        if (checkExists(runtimeNavigatedEvents))
        {
            handlers = $mn(runtimeNavigatedEvents, baseXP);
            if (handlers.length === 0)
            {
                handlers = $mn(formBindingXml, baseXP);
            }
        }
        else
        {
            handlers = $mn(formBindingXml, baseXP);
        }

        result = examineHandlerContentForEventHandling(handlers, checkForConditions);
    }
    return result;
    //#endregion
}

//recursive function to examine handler content for eventhandling
function examineHandlerContentForEventHandling(handlers, checkForConditions)
{
    //#region
    var result = false;

    if (handlers.length > 0)
    {
        //fix for IE bringing back xmlNodeList but the code requiring an array
        //use case:TFS 647527 picture control indicates if it is clickable or not
        if (!checkExists(handlers.concat))
        {
            var arrayHandlers = [];
            for (var h = 0; h < handlers.length; h++)
            {
                arrayHandlers.push(handlers[h]);
            }
            handlers = arrayHandlers;
        }
        //loop through handlers
        var conditionResult = false;
        for (var h = 0; h < handlers.length; h++)
        {
            var currentHandler = handlers[h];

            var handlerType = currentHandler.getAttribute("Type");
            if (handlerType === "foreach")
            {
                var transformedHandlers = transformForEachHandlertoIfs(currentHandler);

                handlers = handlers.concat(transformedHandlers);
            }
            else
            {
                if (checkForConditions)
                {
                    var conditions = $mn(currentHandler, "Conditions/Condition");
                    if (checkExists(conditions))
                    {
                        var loopContextID = getLoopContextID(currentHandler);
                        var c = conditions.length;
                        if (c > 0)
                        {
                            // evaluate expressions which may be used in the conditions immediately
                            var handlerOriginalEventType = currentHandler.getAttribute("OriginalEventType");
                            if (checkExists(handlerOriginalEventType) && handlerOriginalEventType !== "System")
                            {
                                fireExpressions(true);
                            }
                            while (c--)
                            {
                                //evaluate all the conditions and decide on an outcome
                                conditionResult = validateConditions(conditions[c], null, loopContextID);
                                if (conditionResult === true)
                                {
                                    break;
                                }
                            }
                        }
                        else
                        {
                            conditionResult = true;
                        }
                        removeLoopContextData({ loopContextID: loopContextID });
                    }
                }
                if (conditionResult === true || !checkForConditions)
                {
                    var actions = $mn(currentHandler, "Actions/Action[@Type!='Handler']");
                    if (actions.length > 0)//simple actions exists inside this handler
                    {
                        result = true;
                        break;
                    }
                    else
                    {
                        //nested handler types exists - should at least get one with a valid action to ensure that it is valid
                        var innerHandlers = $mn(currentHandler, "Actions/Action[@Type='Handler']/Handlers/Handler");
                        if (innerHandlers.length > 0)
                        {
                            result = examineHandlerContentForEventHandling(innerHandlers, checkForConditions);
                            if (result === true)
                            {
                                break;
                            }
                        }
                    }
                }
            }
        }
    }
    return result;
    //#endregion
}

//transform a foreach type handler into an array of if type handlers with added loop context counter data (as determined by the foreach handler function results)
function transformForEachHandlertoIfs(foreachHandler)
{
    //#region
    var ifHandlers = [];

    if (checkExists(foreachHandler))
    {
        var handlerFunctionXML = $sn(foreachHandler, "Function");

        if (checkExists(handlerFunctionXML) && handlerFunctionXML.childNodes.length > 0)
        {
            var functionName = handlerFunctionXML.childNodes[0].tagName;

            var fn = evalFunction(functionName);

            if (checkExists(fn))
            {
                var functionResults = fn(handlerFunctionXML);

                if ((checkExists(functionResults)) && (functionResults.length > 0))
                {
                    var funcInstanceID = handlerFunctionXML.getAttribute("InstanceID");
                    var outerLoopID = getLoopContextID(foreachHandler);
                    var outerLoopIdExists = checkExistsNotEmpty(outerLoopID);

                    for (var i = 0; i < functionResults.length; i++)
                    {
                        var functionResult = functionResults[i];

                        var currentCounter = functionResult.counter;
                        var objViewID = functionResult.viewID;
                        var objControlID = functionResult.controlID;

                        var newHandler = foreachHandler.cloneNode(true);

                        if (outerLoopIdExists)
                        {
                            newHandler.removeAttribute("LoopID");

                            copyLoopContextData({ currentNode: newHandler, loopContextIdToCopyFrom: outerLoopID });
                        }

                        newHandler.setAttribute("Type", "if");

                        addLoopContextData({ currentNode: newHandler, counterToAdd: currentCounter, itemToAdd: functionResult.item, viewID: objViewID, instanceID: funcInstanceID, controlID: objControlID });

                        ifHandlers.push(newHandler);
                    }
                }
            }
        }
    }

    return ifHandlers;
    //#endregion
}

//inspects the form binder for bindings that should be executed
function handleEvent(sourceId, sourceType, methodExecuted, isAsync, instanceID, isInit, parentBehaviour, closeEvent, popup, closeOptions, definitionID, loopContextID)
{
    if (_runtimeLoadingFromDraft)
    {
        return;
    }

    //#region
    if (eventsCancelled === true)
    {
        return;
    }

    //inspects events
    SFLog({ type: 3, source: "handleEvent", category: "Events", message: "{2} event fired from {1} - {0}", parameters: [sourceId, sourceType, methodExecuted] });
    //Added check for subformID as we must never fire events with an subformID since they need to be transferred before they work - the subformID is removed when the event is transferred
    var eventXP = "Events/Event[@SourceID='" + sourceId + "'][@SourceType='" + sourceType + "'][Name/text()=" + methodExecuted.xpathValueEncode() + "]";

    if (!checkExists(closeEvent) || closeEvent !== true) //same check as above, but the closeEvent parameter is sent in as true anyway
    {
        eventXP += "[not(@SubformID)]";
    }

    if (checkExists(instanceID))
    {
        eventXP += "[@InstanceID='" + instanceID + "']";
    }
    if (checkExists(definitionID))
    {
        eventXP += "[@DefinitionID='" + definitionID + "']";
    }
    var handlersForBehaviour = [];
    //changing the order so that system events will always take place before user events
    var events = $mn(formBindingXml, eventXP);

    var systemEvents = [];
    var userEvents = [];

    var currEvent = null;
    var eventType = "";

    var i = 0;
    while (i < events.length)
    {
        currEvent = events[i];
        eventType = currEvent.getAttribute("Type");

        if ((typeof eventType !== "undefined") && (eventType !== null) && (eventType !== ""))
        {
            if (eventType === "System")
            {
                systemEvents.push(currEvent);
            }
            else if (eventType === "User")
            {
                userEvents.push(currEvent);
            }
        }

        i++;
    }

    //loop through system events - should only be one
    var s = systemEvents.length;
    while (s--)
    {
        handlersForBehaviour = constructHandlersForBehaviour(systemEvents[s], handlersForBehaviour, closeEvent, "System", loopContextID);
    }

    //check for navigated events
    var navigatedEvents = [];
    if (checkExists(runtimeNavigatedEvents))
    {
        navigatedEvents = $mn(runtimeNavigatedEvents, eventXP + "[@Type='User']");
    }

    //loop through navigated user events
    var n = navigatedEvents.length;
    while (n--)
    {
        handlersForBehaviour = constructHandlersForBehaviour(navigatedEvents[n], handlersForBehaviour, closeEvent, "Navigate", loopContextID);
    }

    //check for user events if no navigated events were found
    if (navigatedEvents.length === 0)
    {
        //loop through user events - should only be one
        var u = userEvents.length;
        while (u--)
        {
            handlersForBehaviour = constructHandlersForBehaviour(userEvents[u], handlersForBehaviour, closeEvent, "User", loopContextID);
        }
    }
    else
    {
        userEvents = [];
    }

    var thisEvent = (systemEvents.length > 0)
        ? systemEvents[0]
        : (navigatedEvents.length > 0)
            ? navigatedEvents[0]
            : (userEvents.length > 0)
                ? userEvents[0]
                : null;

    if (methodExecuted === "Init" && handlersForBehaviour.length > 0 && checkExists(thisEvent) && (sourceType === "View" || sourceType === "Form"))
    {
        var postInitEvent = function ()
        {
            handleEvent(sourceId, sourceType, "PostInit", null, thisEvent.getAttribute("InstanceID"), null, null, null, null, null, null, loopContextID);
        };
        _runtimePostInitEvents.push(postInitEvent);
    }

    var masterRuntimeWindow = SourceCode.Forms.Runtime.getMasterRuntimeWindow();

    var deferred = null;
    if (handlersForBehaviour.length > 0)
    {
        //TFS 490026 - Create the deferred object with jQuery of the base runtime window to avoid a reference to a window that have already been closed when resolving the deferred
        deferred = masterRuntimeWindow.jQuery.Deferred(); //caters for deferred logic if applicable - when this event is done, it's caller will continue
    }

    var singleSpinner = false;

    if (checkExists(thisEvent))
    {
        var singleSpinnerAttr = thisEvent.getAttribute("SingleSpinner");

        if ((checkExists(singleSpinnerAttr)) && (singleSpinnerAttr.toUpperCase() === "TRUE"))
        {
            singleSpinner = true;
        }
    }

    var options =
        {
            methodExecuted: methodExecuted,
            handlers: handlersForBehaviour,
            SourceID: sourceId,
            SourceType: sourceType,
            SubformID: (thisEvent) ? thisEvent.getAttribute("SubformID") : null,
            InstanceID: (thisEvent) ? thisEvent.getAttribute("InstanceID") : null,
            TransferredID: (thisEvent) ? thisEvent.getAttribute("TransferredID") : null,
            IsAsync: isAsync,
            isInit: isInit,
            parentBehaviour: parentBehaviour,
            popup: popup,
            closeOptions: closeOptions,
            closeEvent: closeEvent,
            deferred: deferred,
            singleSpinner: singleSpinner,
            windowToUse: window.self
        };

    // Instantiate the BehaviourEvent Object on the main Runtime context.

    var behaviour = new masterRuntimeWindow.SourceCode.Forms.Runtime.BehaviourEvent(options);
    behaviour.executeBehaviour();//correct usage
    if (deferred)
    {
        return deferred.promise();
    }
    //#endregion
}

//push the handlers into an array (to be used in behaviour execution)
function constructHandlersForBehaviour(parentNode, handlersForBehaviour, closeEvent, originalEventType, loopContextID)
{
    //#region
    if (eventsCancelled === true)
    {
        return;
    }
    //inspects event handlers
    var handlers = $mn(parentNode, "Handlers/Handler");
    //loop through handlers
    for (var h = 0; h < handlers.length; h++)
    {
        var currentHandler = handlers[h].cloneNode(true);
        var handlerType = currentHandler.getAttribute("Type");

        copyLoopContextData({ currentNode: currentHandler, loopContextIdToCopyFrom: loopContextID });

        if (handlerType === "foreach" && closeEvent)
        {
            var transformedHandlers = transformForEachHandlertoIfs(currentHandler);

            for (var i = 0; i < transformedHandlers.length; i++)
            {
                var currTransformedHandler = constructHandlerPartsForBehaviour(transformedHandlers[i], closeEvent, originalEventType);
                handlersForBehaviour.push(currTransformedHandler);
            }
        }
        else
        {
            currentHandler = constructHandlerPartsForBehaviour(currentHandler, closeEvent, originalEventType);
            handlersForBehaviour.push(currentHandler);
        }
    }

    return handlersForBehaviour;
    //#endregion
}

//called from constructHandlersForBehaviour; to populate handler action parameter values for navigation and set the original event type of the handler
function constructHandlerPartsForBehaviour(currentHandler, closeEvent, originalEventType)
{
    //#region
    if (closeEvent)
    {
        var loopContextID = getLoopContextID(currentHandler);
        //when closing a subform you lose context to the subform in subsequent actions.
        var actions = $mn(currentHandler, "Actions/Action[Parameters/Parameter]"); //only manipulate actions that have parameters that might be altered
        for (var a = 0; a < actions.length; a++)
        {
            populateParameterValuesForNavigation(actions[a], true, true, false, true, loopContextID);
        }
    }
    if (checkExists(originalEventType))
    {
        currentHandler.setAttribute("OriginalEventType", originalEventType);
    }
    return currentHandler;
    //#endregion
}

/*#region BehaviourEvent*/
(function ()
{
    // Always instantiate on the main window context only.
    SourceCode.Forms.Runtime.BehaviourEvent = function (options)
    {
        this.initialize(options);
    };

    var _behaviourEventPrototype = {
        /*Arguments:
        options - an object with options names as keys. See options below.

        Options:
        actions     - (array) actions for the event to be executed
        [0] - currentAction
        [1] - methodExecuted
        SourceID - the source of the event
        SourceType - the type of source that originated the event
        InstanceID - the instance of the event that will be handled
        TransferredID - extra transferred instance ID
        IsAsync - whether this should happen asynchronously

        Properties:
        executeBehaviour - starts executing the next action for the event
        isExecuting - true if the action is busy with an execution, false if the action has completed execution (maybe unnecessary)
        xmlPackage - the brokerpackage xml that should be sent through to the server (typically used in a single execution environment)
        hasSingleExecution - true if the event has actions which should be executed in a single call, false by default*/

        windowToUse: null,
        runtimeInstanceName: null,

        initialize: function (options)
        {
            this.id = String.generateGuid();
            this.options = jQuery.extend({}, options);
            this.actions = this.options.actions ? this.options.actions : [];
            this.SourceID = this.options.SourceID ? this.options.SourceID : '';
            this.SourceType = this.options.SourceType ? this.options.SourceType : '';
            this.InstanceID = this.options.InstanceID ? this.options.InstanceID : null;
            this.SubformID = this.options.SubformID ? this.options.SubformID : null;
            this.TransferredID = this.options.TransferredID ? this.options.TransferredID : null;
            this.IsAsync = (checkExists(this.options.IsAsync)) ? this.options.IsAsync : true;
            this.isExecuting = false;
            this.xmlPackage = [];
            this.hasSingleExecution = false;
            this.isInit = (checkExists(this.options.isInit)) ? this.options.isInit : false;
            this.parentBehaviour = (checkExists(this.options.parentBehaviour)) ? this.options.parentBehaviour : null;
            this.handlers = this.options.handlers ? this.options.handlers : [];
            this.previousHandlerResult = checkExists(this.options.previousHandlerResult) ? this.options.previousHandlerResult : true;
            this.methodExecuted = this.options.methodExecuted ? this.options.methodExecuted : '';
            this.popup = this.options.popup ? this.options.popup : null;
            this.closeOptions = this.options.closeOptions;
            this.closeEvent = this.options.closeEvent;
            this.errorHandler = null;
            this.deferred = this.options.deferred ? this.options.deferred : null;
            this.parentHandlers = [];
            this.previousActions = [];
            this.singleSpinner = (checkExists(this.options.singleSpinner)) ? this.options.singleSpinner : false;
            this.windowToUse = this.options.windowToUse ? this.options.windowToUse : window.self;
            // Save a copy of the runtimeInstanceName because this.windowToUse might not always be useable if it's being disposed when a subview/form is closing.
            this.runtimeInstanceName = this.windowToUse.SourceCode.Forms.Runtime.getRuntimeInstanceName();
            this.batchedActions = [];
        },

        showRuntimeInitSpinner: function ()
        {
            if (this.windowToUse._runtimeInitializeOverlay)
            {
                if (checkExists(this.windowToUse._runtimeInitializeIndicatorDelay) && this.windowToUse._runtimeInitializeIndicatorDelay > 0)
                {
                    this.windowToUse._runtimeInitializeIndicatorTimeout = setTimeout(function ()
                    {
                        if (!checkExists(this.windowToUse.popupManager) || !checkExists(this.windowToUse.popupManager.popUps) || (this.windowToUse.popupManager.popUps.length === 0))
                        {
                            this.windowToUse.runtimeShowBusyOverlay({ isInitSpinner: true, showSpinner: this.windowToUse._runtimeInitializeBusyIndicator });
                        }
                    }.bind(this), this.windowToUse._runtimeInitializeIndicatorDelay);
                }
                else
                {
                    this.windowToUse.runtimeShowBusyOverlay({ isInitSpinner: true, showSpinner: this.windowToUse._runtimeInitializeBusyIndicator });
                }
            }
            this.windowToUse._runtimeInitSpinner = true;
        },

        hideRuntimeInitSpinner: function ()
        {
            hideRuntimeInitSpinnerForWindow(this.windowToUse);
        },

        // Will always execute on the main context because the BehaviourEvent was instantiated on the main runtime context.
        executeBehaviour: function ()
        {
            if (_runtimeLoadingFromDraft)
            {
                return;
            }

            var windowContextValid = SourceCode.Forms.Runtime.getRuntimeDataProperty(this.runtimeInstanceName, "windowContextValid") === true;

            var currentAction = null;
            if (this.singleSpinner)
            {
                // Main Window because the BehaviourEvent was instantiated on the main runtime context.
                runtimeShowBusyOverlay({ showSpinner: true });
            }

            updateExecutionTracker(null, 1, this.id);

            // WHILE SECTION
            while (!this.isExecuting)
            {
                // Re-check the context status with every loop.
                windowContextValid = SourceCode.Forms.Runtime.getRuntimeDataProperty(this.runtimeInstanceName, "windowContextValid") === true;

                if (this.stopped || !windowContextValid)
                {
                    //clear all handlers and actions for current behaviour
                    this.actions = [];
                    this.handlers = [];
                    this.parentHandlers = [];
                    this.previousActions = [];

                    //set the parentbehaviour and openbehaviour to stopped (will continue finalizing logic automatically) - this ensures correct fall through to all levels of execution
                    if (this.stopped)
                    {
                        if (this.parentBehaviour != null)
                        {
                            this.parentBehaviour.stopped = true;
                        }
                        //similar logic to above
                        if (this.openBehaviour != null)
                        {
                            this.openBehaviour.stopped = true;
                        }
                    }

                    if (!windowContextValid)
                    {
                        SFLog({ type: 5, source: "executeBehaviour", category: "Events", message: "Context invalid on window {0}, {1} event stopped executing".format(this.runtimeInstanceName, this.SourceID) });
                    }

                    //continues into next if sections
                    //this ensures that all necessary logic for closure paths is followed (parentbehaviour/popups etc.)
                }

                // ACTIONS
                if (this.actions.length > 0)
                {
                    if (this.isInit && (typeof this.windowToUse._runtimeInitSpinner !== "undefined") && (this.windowToUse._runtimeInitSpinner === false))
                    {
                        // Status : Set status to initialized
                        this.windowToUse.jQuery('#__runtimeStatus').text('initializing');
                        this.showRuntimeInitSpinner();
                    }

                    this.isExecuting = true;

                    currentAction = this.actions.shift();

                    // Populate Subform Context if the Action hasn't been transferred.
                    var subformId = currentAction.getAttribute("SubformID");
                    if (checkExistsNotEmptyGuid(subformId))
                    {
                        currentAction = populateSubformContext(currentAction, subformId);
                    }

                    var actionWindowToUse = this.windowToUse.getWindowToUse(currentAction);
                    var executionType = currentAction.getAttribute("ExecutionType"); //Single, Synchronous, Asynchronous
                    this.singleExecution = false;
                    this.otherSingleActions = false;
                    this.nextParallelAction = false;
                    if (this.actions.length > 0)
                    {
                        switch (this.actions[0].getAttribute("ExecutionType"))
                        {
                            case "Single":
                                this.otherSingleActions = true;
                                break;
                            case "Parallel":
                                this.nextParallelAction = true;
                                break;
                        }
                    }

                    if (executionType === "Single")
                    {
                        //a collection of action packages will be constructed and sent through in one call to the server
                        this.singleExecution = true;

                        //TFS503674 This was implemented to cater for the M2M scenario where the primary ID view field didn't get cleared anymore and the server received the old value for secondary create
                        if (checkExists(this.xmlPackage) && this.xmlPackage.length > 0)
                        {
                            var l = this.xmlPackage.length;
                            for (var z = 0; z < l; z++)
                            {
                                if (this.xmlPackage[z].smartobject && this.xmlPackage[z].smartobject.results && this.xmlPackage[z].metadata.typeofview !== "List")
                                {
                                    var clearFields = this.xmlPackage[z].smartobject.results;
                                    for (var r = 0; r < clearFields.length; r++)
                                    {
                                        if (clearFields[r].targetType == 'ViewField')
                                        {
                                            var instanceID = currentAction.getAttribute("InstanceID");
                                            var fieldID = clearFields[r].targetID;
                                            setHiddenFieldValue(fieldID, "", null, instanceID);
                                        }
                                    }
                                }
                            }
                        }

                        var result = actionWindowToUse.executeAction(currentAction, this.methodExecuted, true, null, this.windowToUse);
                        if (checkExistsNotEmpty(result) && (!result.always))//check for deferred/promises
                        {
                            this.xmlPackage = this.xmlPackage.concat(result);
                            this.batchedActions = extendBatchedActions(this.batchedActions, result, currentAction);
                        }
                        if (this.otherSingleActions === true)
                        {
                            this.isExecuting = false;
                            //this.executeBehaviour();//while loop covers this
                        }
                        else if (this.singleExecution === true && this.otherSingleActions === false) //only execute once all the packages was built & all other actions was executed for this event
                        {
                            if (this.xmlPackage.length > 0)
                            {
                                //this is the combined packet of all the event executions
                                this.windowToUse.sendPacket(this.xmlPackage, this, this.batchedActions);
                                this.xmlPackage = []; //reset package if no more single actions
                                this.batchedActions = [];
                            }
                            else
                            {
                                //no values in single execution, but behaviour should continue with rest of execution
                                this.singleExecution = false;
                                this.isExecuting = false;
                                //this.executeBehaviour();//while loop covers this
                            }
                        }
                    }
                    else
                    {
                        if (!this.singleExecution)
                        {
                            if (executionType === "Asynchronous" || executionType === "Parallel")
                            {
                                if (executionType === "Asynchronous")
                                {
                                    var bh = this;
                                    $.when(actionWindowToUse.executeAction(currentAction, bh.methodExecuted, false, null, bh.windowToUse)).fail(function () { bh.handleError.apply(bh, arguments); });
                                    //this can happen asynchronously - do not have to wait for synchronous return results
                                    this.isExecuting = false;
                                    //this.executeBehaviour();//while loop covers this
                                }
                                else if (executionType === "Parallel")
                                {
                                    if (!checkExists(this.parallelActions))
                                    {
                                        this.parallelActions = [];
                                    }
                                    this.parallelActions.push(actionWindowToUse.executeAction(currentAction, this.methodExecuted, false));
                                    if (!this.nextParallelAction && this.parallelActions != null && this.parallelActions.length > 0)
                                    {
                                        var bh = this;
                                        //handle parallel actions via the deferred object returned from AJAX (normal functions will return done as soon as executed)
                                        $.when.apply($, this.parallelActions).done(function () { parallelActionsDone(bh); }).fail(function () { parallelActionsFailed.apply(bh, arguments); });
                                        break;//breaks out of the outer while loop, behaviour will continue from the above functions
                                    }
                                    else
                                    {
                                        //this can happen asynchronously - do not have to wait for synchronous return results
                                        this.isExecuting = false;
                                    }
                                }
                            }
                            else //synchronous
                            {
                                actionWindowToUse.executeAction(currentAction, this.methodExecuted, false, this, this.windowToUse);
                            }
                        }
                        else
                        {
                            this.actions.push(currentAction.cloneNode(true));
                        }
                    }
                }
                else if (this.actions.length === 0 && this.handlers.length > 0)
                {
                    var currentHandler = this.handlers.shift();
                    var handlerType = currentHandler.getAttribute("Type");
                    if (handlerType === "error")
                    {
                        while (this.handlers.length > 0 && handlerType === "error")
                        {
                            currentHandler = this.handlers.shift(); //get to next executing statement, remove the non-valid error handlers from the behaviour
                            handlerType = currentHandler.getAttribute("Type");
                        }
                    }

                    if (handlerType === "foreach")
                    {
                        var transformedHandlers = this.windowToUse.transformForEachHandlertoIfs(currentHandler);

                        this.handlers = transformedHandlers.concat(this.handlers);
                    }

                    if ((handlerType === "if") || (handlerType === "always") || (this.previousHandlerResult === false && handlerType === "else"))
                    {
                        var loopContextID = getLoopContextID(currentHandler);

                        var conditionResult = true;
                        var actionsForBehaviour = [];

                        //inspect condition && verify that conditions are met
                        var conditions = $mn(currentHandler, "Conditions/Condition");

                        if (checkExists(conditions))
                        {
                            var c = conditions.length;
                            if (c > 0)
                            {
                                // evaluate expressions which may be used in the conditions immediately
                                var handlerOriginalEventType = currentHandler.getAttribute("OriginalEventType");
                                if (checkExists(handlerOriginalEventType) && handlerOriginalEventType !== "System")
                                {
                                    this.windowToUse.fireExpressions(true);
                                }
                                while (c--)
                                {
                                    //evaluate all the conditions and decide on an outcome
                                    var condition = conditions[c].cloneNode(true);
                                    conditionResult = this.windowToUse.validateConditions(condition, null, loopContextID, this);

                                    if (conditionResult === false)
                                    {
                                        break;
                                    }
                                }
                            }
                        }

                        if (conditionResult === true)
                        {
                            var actions = $mn(currentHandler, "Actions/Action");
                            var aLength = actions.length;
                            if (aLength > 0)
                            {
                                //if condition is valid - add actions to list of executions
                                for (var a = 0; a < aLength; a++)
                                {
                                    var actionNode = actions[a].cloneNode(true);
                                    var handlerOriginalEventType = currentHandler.getAttribute("OriginalEventType");
                                    if (checkExists(handlerOriginalEventType))
                                    {
                                        actionNode.setAttribute("OriginalEventType", handlerOriginalEventType);
                                    }
                                    this.windowToUse.copyLoopContextData({ currentNode: actionNode, loopContextIdToCopyFrom: loopContextID });
                                    actionsForBehaviour.push(actionNode);
                                }
                            }
                        }
                        if (!this.wfConditionError)
                        {
                            this.actions = actionsForBehaviour;
                        }
                        else
                        {
                            this.wfConditionError = null;
                        }
                        this.previousHandlerResult = conditionResult;
                        this.windowToUse.removeLoopContextData({ loopContextID: loopContextID });
                    }
                    this.isExecuting = false;
                }
                else if (this.actions.length === 0 && this.handlers.length === 0 && this.parentHandlers != null && this.parentHandlers.length > 0)
                {
                    this.previousHandlerResult = true;//the parenthandler result will be set to true, it won't be affected by actions inside current handler's outcome - it had to be true initially to get in here anyway

                    if (!this.evaluateContinueParentHandlers) //if there was no continue action after an error was thrown, and this variable was set, execution won't continue
                    {
                        this.handlers = this.parentHandlers.pop();
                        this.actions = this.previousActions.pop();
                    }
                    else
                    {
                        this.parentHandlers = [];
                        this.previousActions = [];
                    }

                    this.isExecuting = false;
                }
                else if (windowContextValid && this.isInit && this.actions.length === 0 && this.handlers.length === 0 &&
                    ((this.windowToUse.persistedActions !== null && this.windowToUse.persistedActions.length > 0) ||
                        (this.windowToUse._runtimePersistedHandlers !== null && this.windowToUse._runtimePersistedHandlers.length > 0)))
                {
                    var persistedActionsForBehaviour = this.windowToUse.persistedActions;
                    if (persistedActionsForBehaviour !== null && persistedActionsForBehaviour.length > 0)
                    {
                        this.actions = persistedActionsForBehaviour;
                    }
                    var persistedHandlersForBehaviour = this.windowToUse._runtimePersistedHandlers;
                    if (persistedHandlersForBehaviour !== null && persistedHandlersForBehaviour.length > 0)
                    {
                        this.handlers = persistedHandlersForBehaviour;
                    }
                    //argument needs to be reset
                    this.windowToUse.persistedActions = null;
                    this.windowToUse._runtimePersistedHandlers = null;
                    //adapt behaviour settings
                    this.previousHandlerResult = true;
                    this.isExecuting = false;
                }
                else if (this.actions.length === 0 && this.parentBehaviour != null)
                {
                    var pb = this.parentBehaviour;

                    pb.isExecuting = false;
                    //argument needs to be reset
                    this.parentBehaviour = null;
                    pb.executeBehaviour();//correct usage
                }
                else if (this.actions.length === 0 && this.openBehaviour != null)
                {
                    var op = this.openBehaviour;
                    op.isExecuting = false;
                    this.openBehaviour = null;
                    op.executeBehaviour();//correct usage
                }
                else if (windowContextValid && this.isInit && this.windowToUse._runtimeIsInitializing)
                {
                    this.windowToUse._runtimeIsInitializing = false;
                    // Perform pending queue calls
                    if (this.windowToUse.runtimePendingCallsAfterInit != null)
                    {
                        for (var i = 0; i < this.windowToUse.runtimePendingCallsAfterInit.length; i++)
                        {
                            this.windowToUse.runtimePendingCallsAfterInit[i]();
                        }
                        this.windowToUse.runtimePendingCallsAfterInit = [];
                    }                    
                    this.hideRuntimeInitSpinner();
                    // Status : Set status to initialized
                    this.windowToUse.jQuery('#__runtimeStatus').text('initialized');

                    // Performance : Log init finish for performance
                    this.windowToUse.PFSuccess("K2 SmartForms - Runtime Web Client", "Runtime Client Initialize", this.windowToUse.currentForm.toLowerCase());

                    //argument needs to be reset
                    this.isExecuting = false;
                }
                else if (windowContextValid && this.windowToUse._runtimePresetControls.length === 0 && !this.windowToUse._runtimeIsInitializing && this.windowToUse._runtimePostInitEvents.length > 0)
                {
                    //verify there is no outstanding controls waiting to be initialized before continuing
                    this.windowToUse.executePostInits();
                    this.isExecuting = false;
                }
                else if (this.popup != null)
                {
                    windowContextValid = false;

                    var instanceName = SourceCode.Forms.Runtime.getRuntimeInstanceName(this.popup);
                    SourceCode.Forms.Runtime.removeRuntimeDataProperty(instanceName, "windowContextValid");
                    SourceCode.Forms.Runtime.removeRuntimeDataProperty(instanceName, "windowContext");
                    completePopupClosing(this.popup, this.closeOptions);
                    //argument needs to be reset
                    this.popup = null;
                }
                else if (this.deferred != null)
                {
                    this.deferred.resolve();
                    this.deferred = null;
                }

                // Behavior execute loop checks.  Not dependant on the event source's Window context.
                if ((this.actions.length > 0) ||
                    (this.actions.length === 0 && this.handlers.length > 0) ||
                    (this.actions.length === 0 && this.handlers.length === 0 && this.parentHandlers != null && this.parentHandlers.length > 0) ||
                    (this.actions.length === 0 && (this.parentBehaviour != null)) ||
                    (this.actions.length === 0 && (this.openBehaviour != null)) ||
                    (this.popup != null) ||
                    (this.deferred != null))
                {
                    continue;
                };

                // Event source Window context dependant checks.
                if (windowContextValid && (
                    (this.isInit && this.actions.length === 0 && this.handlers.length === 0 && (this.windowToUse.persistedActions != null) && this.windowToUse.persistedActions.length > 0) ||
                    (this.isInit && this.actions.length === 0 && this.handlers.length === 0 && (this.windowToUse._runtimePersistedHandlers != null) && this.windowToUse._runtimePersistedHandlers.length > 0) ||
                    (this.isInit && this.windowToUse._runtimeIsInitializing)))
                {
                    continue;
                };

                // We've reached this code, execution is done.
                break;
            }

            windowContextValid = SourceCode.Forms.Runtime.getRuntimeDataProperty(this.runtimeInstanceName, "windowContextValid") === true;

            // BehaviorEvent is always on the master window context.
            if (!this.isExecuting)
            {
                updateExecutionTracker(null, -1, this.id);
            }

            if (windowContextValid && this.singleSpinner && !this.isExecuting)
            {
                var hideSingleSpinner = true;

                if (checkExists(currentAction))
                {
                    var curActionOldType = currentAction.getAttribute("OldType");

                    if ((checkExists(curActionOldType)) && (curActionOldType === "Navigate"))
                    {
                        hideSingleSpinner = false;
                    }
                }

                if (hideSingleSpinner)
                {
                    this.windowToUse.runtimeHideBusyOverlay();
                }
            }
        },

        handleError: function ()
        {
            //#region
            this.errorType = arguments[0];
            this.errorArguments = arguments;

            if (checkExists(this.parallelActions) && this.parallelActions.length > 0)
            {
                this.parallelActions = null;
            }
            if (checkExists(this.errorType))
            {
                var actionsForBehaviour = [];
                var keepHandlers = false;

                //construct the error object
                var errorID = this.errorID;
                if (!checkExists(errorID)) //caters for parentbehaviour, so duplicate error objects won't be created
                {
                    errorID = String.generateGuid();
                    var errorObject = { category: this.errorType };
                    switch (this.errorType)
                    {
                        case "custom":
                            errorObject = arguments[1];
                            break;
                        case "ajax":
                            errorObject.message = Resources.Runtime.AjaxError;
                            errorObject.detail = "[" + arguments[1].status + "] " + arguments[1].statusText + " (" + arguments[2] + ')';
                            break;
                        case "exc":
                        case "auth":
                            //have to extend this one to expose everything similar to exceptionhandler
                            var exceptionElement = arguments[1].documentElement;
                            var messageNode = exceptionElement.selectSingleNode("DisplayMessage");
                            if (!checkExists(messageNode))
                            {
                                messageNode = exceptionElement.selectSingleNode("Message");
                            }
                            if (checkExists(messageNode))
                            {
                                errorObject.message = messageNode.text;
                            }
                            var exceptionType = exceptionElement.selectSingleNode("Type");
                            if (checkExists(exceptionType))
                            {
                                errorObject.type = exceptionType.text;
                            }
                            var hasExtendedDetail = exceptionElement.getAttribute("ExtendedDetail") === "T";
                            if (hasExtendedDetail)
                            {
                                var stackTraceNode = exceptionElement.selectSingleNode("StackTrace");
                                if (stackTraceNode)
                                {
                                    errorObject.detail = stackTraceNode.text;
                                }
                            }
                            break;
                        case "wf":
                            errorObject.message = Resources.Runtime.WorkflowNotExecuted;
                            break;
                        case "email":
                            errorObject.message = Resources.RuntimeMessages.ErrorEmailNotSent;
                            break;
                        case "noxml":
                            errorObject.message = arguments[2];
                            errorObject.detail = arguments[3];
                            break;
                        case "itemref":
                            errorObject.message = Resources.RuntimeMessages.WorkflowItemReferenceNotFound;
                            break;
                        case "openxmlnotfound":
                            errorObject.message = constructOpenXmlNotFoundErrorMessage();
                            break;
                    }
                    var masterRuntimeWindow = SourceCode.Forms.Runtime.getMasterRuntimeWindow();
                    masterRuntimeWindow._runtimeErrorObjects[errorID] = errorObject;
                }
                else
                {
                    this.errorID = null;
                }
                var wfVariableInError = this.wfVariableLoading || this.wfConditionError;

                if (checkExists(this.actions) && this.actions.length > 0)
                {
                    var nextAction = this.actions.shift();
                    var nextLoopContextID = getLoopContextID(nextAction);
                    var actionType = nextAction.getAttribute("Type");

                    if (actionType === "Handler")
                    {
                        if (checkExists(this.handlers))
                        {
                            this.parentHandlers.push(this.handlers);
                            this.previousActions.push(this.actions); //add the rest of the actions to a property to ensure that if required, it can be continued
                            this.actions = [];
                        }
                        this.handlers = constructHandlersForBehaviour(nextAction, [], this.closeEvent, nextAction.getAttribute("OriginalEventType"), nextLoopContextID);
                    }
                }

                if (checkExists(this.handlers) && this.handlers.length > 0)
                {
                    var currentHandler = this.handlers.shift();
                    var handlerType = currentHandler.getAttribute("Type");

                    while (handlerType !== "error" && this.handlers.length > 0)
                    {
                        currentHandler = this.handlers.shift();
                        handlerType = currentHandler.getAttribute("Type");
                    }

                    while (handlerType === "error" && !checkExists(this.errorHandler))
                    {
                        var result = true;

                        var errorNodes = $mn(currentHandler, "//*[@SourceType='SystemVariable']");
                        var e = errorNodes.length;
                        if (e > 0)
                        {
                            while (e--)
                            {
                                errorNodes[e].setAttribute("SourceErrorID", errorID);
                            }
                        }
                        //inspect condition && verify that conditions are met
                        var conditions = $mn(currentHandler, "Conditions/Condition");

                        if (checkExists(conditions))
                        {
                            var c = conditions.length;
                            if (c > 0)
                            {
                                // evaluate expressions which may be used in the conditions immediately
                                var handlerOriginalEventType = currentHandler.getAttribute("OriginalEventType");
                                if (checkExists(handlerOriginalEventType) && handlerOriginalEventType !== "System")
                                {
                                    this.windowToUse.fireExpressions(true);
                                }
                                while (c--)
                                {
                                    //evaluate all the conditions and decide on an outcome
                                    result = this.windowToUse.validateConditions(conditions[c], null, null, this);
                                    if (result === false)
                                    {
                                        break;
                                    }
                                }
                            }
                        }

                        if (result === true)
                        {
                            this.errorHandler = currentHandler;

                            var actions = $mn(currentHandler, "Actions/Action");
                            if (actions.length > 0)
                            {
                                //if condition is valid - add actions to list of executions
                                for (var a = 0; a < actions.length; a++)
                                {
                                    //test for a continue action to flag whether handlers should be cleared
                                    if (actions[a].getAttribute("Type") === "Continue")
                                    {
                                        keepHandlers = true;
                                    }
                                    if (actions[a].getAttribute("Type") === "Handler")
                                    {
                                        this.evaluateContinueParentHandlers = true;
                                    }
                                    var actionNode = actions[a].cloneNode(true);
                                    var handlerOriginalEventType = currentHandler.getAttribute("OriginalEventType");
                                    if (checkExists(handlerOriginalEventType))
                                    {
                                        actionNode.setAttribute("OriginalEventType", handlerOriginalEventType);
                                    }
                                    actionsForBehaviour.push(actionNode);
                                }
                            }
                        }
                        else
                        {
                            if (this.handlers.length > 0)
                            {
                                currentHandler = this.handlers.shift();
                                handlerType = currentHandler.getAttribute("Type");
                            }
                            else
                            {
                                break;
                            }
                        }
                    }
                }

                if (actionsForBehaviour.length > 0) //exception handler is applied
                {
                    this.errorSource =
                        {
                            sourceID: this.SourceID,
                            instanceID: this.InstanceID,
                            sourceType: this.SourceType
                        };
                    this.actions = actionsForBehaviour;
                    this.previousHandlerResult = true;
                    if (!keepHandlers && !this.evaluateContinueParentHandlers)//there was no continue action in the current actions of the behaviour, handlers can be cleared as execution will stop
                    {
                        this.handlers = [];
                    }

                    this.errorHandler = null; //reset the variable, can't continue into itself
                    if (wfVariableInError)
                    {
                        this.wfConditionError = true;
                        this.wfVariableLoading = null;
                    }
                    else
                    {
                        this.isExecuting = false;
                        this.executeBehaviour();
                    }
                }
                else if (checkExists(this.parentHandlers) && this.parentHandlers.length > 0)//parenthandler will go into above logic for parent, if not found it will continue
                {
                    this.handlers = this.parentHandlers.pop();
                    this.actions = this.previousActions.pop();
                    this.handleError.apply(this, arguments);
                }
                else
                {
                    if (this.popup != null && this.closeEvent)//this is just to finalize closing logic of underlying subform if error happened (TFS585576)
                    {
                        // Subform/view
                        windowContextValid = false;

                        var instanceName = SourceCode.Forms.Runtime.getRuntimeInstanceName(this.popup);
                        SourceCode.Forms.Runtime.removeRuntimeDataProperty(instanceName, "windowContextValid");
                        SourceCode.Forms.Runtime.removeRuntimeDataProperty(instanceName, "windowContext");
                        completePopupClosing(this.popup, this.closeOptions);
                        //argument needs to be reset
                        this.popup = null;
                    }
                    if (checkExists(this.parentBehaviour)) //parentBehaviour might have handler
                    {
                        this.parentBehaviour.wfConditionError = wfVariableInError;
                        this.parentBehaviour.errorSource =
                            {
                                sourceID: this.SourceID,
                                instanceID: this.InstanceID,
                                sourceType: this.SourceType
                            };
                        this.parentBehaviour.errorID = errorID;
                        this.parentBehaviour.handleError.apply(this.parentBehaviour, arguments);
                    }
                    else if (checkExists(this.openBehaviour))//openBehaviour might have handler - accommodating similar to parentBehaviour
                    {
                        this.openBehaviour.wfConditionError = wfVariableInError;
                        this.openBehaviour.errorSource =
                            {
                                sourceID: this.SourceID,
                                instanceID: this.InstanceID,
                                sourceType: this.SourceType
                            };
                        this.openBehaviour.errorID = errorID;
                        this.openBehaviour.handleError.apply(this.openBehaviour, arguments);
                    }
                    else
                    {
                        // Make sure we note that this behavior has been decremented.
                        updateExecutionTracker(null, -1, this.id);

                        if (this.isInit && this.windowToUse._runtimeIsInitializing && this.windowToUse._runtimeInitSpinner)
                        {
                            this.hideRuntimeInitSpinner();
                        }

                        var sourceID, instanceID, sourceType;
                        if (checkExists(this.errorSource))
                        {
                            sourceID = this.errorSource.sourceID;
                            instanceID = this.errorSource.instanceID;
                            sourceType = this.errorSource.sourceType;
                        }
                        else
                        {
                            sourceID = this.SourceID;
                            instanceID = this.InstanceID;
                            sourceType = this.SourceType;
                        }
                        //attempt to find onErrorEvent if no error handling exists
                        var errorEvent = this.windowToUse.findErrorEvent(sourceID, sourceType, instanceID);
                        if (checkExists(errorEvent))
                        {
                            var errorHandlingWindowToUse = this.windowToUse;
                            if (SourceCode.Forms.Settings.BubbleErrorsToBaseContext === true)
                            {
                                errorHandlingWindowToUse = errorEvent.windowToUse;
                                //transfer error context to the window so that if the window is not the current window that error context system variables are available
                                //this is for when errors are bubbled from subview or subform context
                                //errorHandlingWindowToUse._runtimeErrorObjects[errorID] = this.windowToUse._runtimeErrorObjects[errorID];//now all population of _runtimeErrorObjects is on master runtime window							
                            }
                            errorHandlingWindowToUse._runtimeLastUnhandledErrorID = errorID;//give context to last global error
                            errorHandlingWindowToUse.handleEvent(errorEvent.sourceID, errorEvent.sourceType, "OnError", null, errorEvent.instanceID, null, null, null, null, null, null, arguments[5]);
                        }
                        else
                        {
                            //default standard error behaviour as moved from AJAX.js
                            switch (this.errorType)
                            {
                                case "ajax":
                                    handleAJAXError(arguments[1], arguments[2], arguments[3], arguments[4]);
                                    break;
                                case "auth":
                                    SourceCode.Forms.ExceptionHandler.handleAuthenticationException(arguments[1]);
                                    break;
                                case "exc":
                                    SourceCode.Forms.ExceptionHandler.handleException(arguments[1]);
                                    break;
                                case "wf":
                                    masterPopupManager.showWarning(Resources.Runtime.WorkflowNotExecuted);
                                    break;
                                case "email":
                                    masterPopupManager.showError(Resources.RuntimeMessages.ErrorEmailNotSent);
                                    break;
                                case "custom":
                                    var err = arguments[1];
                                    var errType = checkExists(err.type) ? err.type : "";
                                    var errDetails = checkExists(err.detail) ? err.detail : "";
                                    var errMessage = checkExists(err.message) ? err.message : "";
                                    var options = {
                                        showHeaderButtons: true,
                                        headerText: errType,
                                        message: errDetails,
                                        title: errMessage,
                                        type: "error"
                                    };
                                    masterPopupManager.showMessage(options);
                                    break;
                                case "noxml":
                                    var masterRuntimeWindow = SourceCode.Forms.Runtime.getMasterRuntimeWindow();
                                    this.showErrorPopupOptionsForNoXml(masterRuntimeWindow._runtimeErrorObjects[errorID]);
                                    break;
                                case "redirect":
                                    handleRedirectError(arguments[4]);
                                    break;
                                case "itemref":
                                    masterPopupManager.showError(Resources.RuntimeMessages.WorkflowItemReferenceNotFound);
                                    break;
                                case "openxmlnotfound":
                                    masterPopupManager.showError(constructOpenXmlNotFoundErrorMessage());
                                    break;
                            }
                        }
                    }
                }
            }
            //#endregion
        },

        showErrorPopupOptionsForNoXml: function (errorObj)
        {
            var status = checkExists(errorObj.message) ? errorObj.message.toString() : "";
            var message = checkExists(errorObj.detail) ? errorObj.detail.toString().htmlEncode() : "";

            if (status.toLowerCase() === "parsererror")
            {
                //Parser error: There is no xml passed to ajax result, because the response XML is invalid
                options =
                    {
                        headerText: Resources.MessageBox.Error,
                        message: Resources.RuntimeMessages.ErrorInvalidCharsInXml.format(this.SourceType),
                        messageDetail: message,
                        showHeaderButtons: false,
                        type: "error",
                        draggable: true,
                        resizable: true,
                        width: 400,
                        height: 150
                    };

                masterPopupManager.showExtendedMessage(options);
            }
            else
            {
                //General ajax error message that will be displayed in the case of no xml passed to ajax result, but not status parsererror:
                var errorMessage = "{0}<br /><br >{1} ({2})".format(Resources.Runtime.AjaxError, message, status);
                masterPopupManager.showError(errorMessage);
            }
        }
        //#endregion
    };
    jQuery.extend(SourceCode.Forms.Runtime.BehaviourEvent.prototype, _behaviourEventPrototype);
})();
/*#endregion BehaviourEvent*/

function hideRuntimeInitSpinnerForWindow(winObj)
{
    if (!checkExists(winObj))
    {
        winObj = window.self;
    }
    if (winObj._runtimeInitSpinner)
    {
        if (winObj._runtimeInitializeOverlay)
        {
            if (checkExists(winObj._runtimeInitializeIndicatorTimeout))
            {
                clearTimeout(winObj._runtimeInitializeIndicatorTimeout);
                winObj._runtimeInitializeIndicatorTimeout = null;
            }
            winObj.runtimeHideBusyOverlay();
        }
        winObj._runtimeInitSpinner = false;
    }
}

//runs when a block of parallel async actions completed successfully, continuing with behaviour
var parallelActionsDone = function (behaviour)
{
    //#region
    if (checkExists(behaviour))
    {
        //clear the behaviour parallelActions array
        if (checkExists(behaviour.parallelActions) && behaviour.parallelActions.length > 0)
        {
            behaviour.parallelActions = null;
        }
        behaviour.isExecuting = false;
        behaviour.executeBehaviour();
    }
    //#endregion
};

//runs when a block of parallel asynchronous actions ended in failure, fires error handler
var parallelActionsFailed = function ()
{
    //#region
    if (checkExists(this.handleError))
    {
        this.handleError.apply(this, arguments);
    }
    //#endregion
};

//finds the applicable OnError event if available and no error handling exists, working from lowest level up, first one found will be applied
function findErrorEvent(sourceID, sourceType, instanceID, fromChildContext)
{
    //#region
    var windowToUse = window;
    var result = null;
    var hasErrorEvent = false;
    var checkForConditons = true;
    var errorEventName = "OnError";
    var viewType = "View";
    var formType = "Form";

    //if fromChildContext is set to true then we are looking for a OnError event on a parent window context in terms of sub view  sub form
    if (fromChildContext === true)
    {
        if (_runtimeCallerType === viewType)
        {
            //The highest level is a view
            sourceType = viewType;
            //find the only controller so we can get the correct source ID
            var controllerXpath = "Controllers/Controller";
            var currentControlView = $sn(viewControllerDefinition, controllerXpath);
            if (checkExists(currentControlView))
            {
                sourceID = currentControlView.getAttribute("ID");
                hasErrorEvent = verifyEventHandling(sourceID, sourceType, errorEventName, instanceID, checkForConditons);
            }
        }
        else
        {
            //The highest level is a form
            sourceType = formType;
            sourceID = currentForm;
            hasErrorEvent = verifyEventHandling(sourceID, sourceType, errorEventName, instanceID, checkForConditons);
        }
    }
    else if (!checkExists(sourceID) && !checkExists(sourceType))
    {
        //backup for async actions, will fall through to caller type (running instance)
        sourceType = _runtimeCallerType;
        sourceID = currentForm;
        instanceID = null;
        hasErrorEvent = verifyEventHandling(sourceID, sourceType, errorEventName, instanceID, checkForConditons);
    }
    else
    {
        hasErrorEvent = verifyEventHandling(sourceID, sourceType, errorEventName, instanceID, checkForConditons);

        //if nothing found and not already view level or form level bubble up to view level
        if (!hasErrorEvent && sourceType !== viewType && sourceType !== formType)
        {
            var controllerXpath = null;
            if (_runtimeCallerType === viewType)
            {
                //The highest level is a view
                //find the only controller so we can get the correct source ID
                controllerXpath = "Controllers/Controller";
            }
            else
            {
                //The highest level is a form

                if (checkExists(instanceID))
                {
                    //find the specific view
                    controllerXpath = "Controllers/Controller[@InstanceID='{0}']".format(instanceID);
                }
            }
            if (checkExists(controllerXpath))
            {
                var currentControlView = $sn(viewControllerDefinition, controllerXpath);
                if (currentControlView)
                {
                    sourceID = currentControlView.getAttribute("ID");
                    if (sourceID !== _runtimeEmptyGuid)
                    {
                        sourceType = viewType;
                        hasErrorEvent = verifyEventHandling(sourceID, sourceType, errorEventName, instanceID, checkForConditons);
                    }
                }
            }
        }

        //at this point we have either looked for a view or the highest level was a view so if the _runtimeCallerType is a Form and the source wasn't originally a form

        //if nothing found and not already form level bubble up to form level
        if (!hasErrorEvent && sourceType !== formType && _runtimeCallerType === formType)
        {

            sourceType = formType;
            sourceID = currentForm;
            instanceID = null;
            hasErrorEvent = verifyEventHandling(sourceID, sourceType, errorEventName, instanceID, checkForConditons);
        }

        //if nothing found on Form or View then try bubble up to subview / subform parent
        if (!hasErrorEvent && SourceCode.Forms.Settings.BubbleErrorsToBaseContext === true)
        {
            windowToUse = SourceCode.Forms.Runtime.getMasterRuntimeWindow();
            if (windowToUse != window)
            {
                //Now search the top parent for Error handling
                result = windowToUse.findErrorEvent(null, null, null, true);
            }
        }
    }

    if (hasErrorEvent)
    {
        result =
            {
                sourceID: sourceID,
                instanceID: instanceID,
                sourceType: sourceType,
                windowToUse: windowToUse
            };
    }
    return result;
    //#endregion
}


/* test for panel column syncing - added with extra events introduced in panel/tabs */
function testForPanelColumnSyncing(SourceType, SourceID, methodExecuted)
{
    //#region
    if (SourceType === "control" && methodExecuted === "onfocus")//check for tabs - if it is clicked, grids must be synced
    {
        var PanelID = SourceID.split('_')[1];
        var panel = $sn(viewControllerDefinition, "Controllers/Controller[@PanelID='" + PanelID + "']");
        if (checkExists(panel))
        {
            syncColumnWidthsOnPanel(PanelID);
        }
    }
    //#endregion
}

/* set items completed by controls */
function attemptSetItemsComplete(SourceType, SourceID, methodExecuted)
{
    //#region
    if (SourceType === "control" && methodExecuted === "onsetitemscompleted")
    {
        if (_runtimePresetControls.length > 0 && _runtimePresetControls.indexOf(SourceID) > -1)
        {
            _runtimePresetControls.splice(_runtimePresetControls.indexOf(SourceID), 1); //removes the preset control from the array
        }
    }
    //#endregion
}

//handles post init events
function executePostInits()
{
    //#region
    if (_runtimePostInitEvents.length > 0)
    {
        var innerPostInits = _runtimePostInitEvents;
        _runtimePostInitEvents = [];
        for (var i = 0; i < innerPostInits.length; i++)
        {
            innerPostInits[i]();
        }
    }
    //#endregion
}

/* do the data transfer of parameters from one source to another target */
function dataTransferAction(currentAction, methodExecuted, behaviour)
{
    var loopContextID = getLoopContextID(currentAction);

    var ViewID = currentAction.getAttribute("ViewID");
    var viewInstanceID = currentAction.getAttribute("InstanceID");
    var currentControlID = currentAction.getAttribute("ControlID");

    //inspects parameters
    var parameters = $mn(currentAction, "Parameters/Parameter");
    //loop through parameters and add properties
    var p = parameters.length;
    while (p--)
    {
        // Don't depend on the action to assume context.  Use the Parameter mappings to determine Source and Destination.
        // Source
        var sourceValue = returnSourceValue({ item: parameters[p], context: currentControlID, loopContextID: loopContextID, behaviour: behaviour });

        // Target
        // Set the target using the shared function.
        var sourceType = parameters[p].getAttribute("SourceType");
        var source = parameters[p].getAttribute("SourceID");
        updateTargetWithValue(currentAction, behaviour, parameters[p], window.self, source, sourceType, sourceValue, methodExecuted);
    }

    if (listRefreshCache.length > 0)
    {
        updateAllListDisplays(loopContextID);
    }

    endActionExecution({ loopContextID: loopContextID, behaviour: behaviour });
}

//new shared function that sets a target with the relevant value specified
//originated from data transfer action, will move to centralize this where possible
function updateTargetWithValue(currentAction, behaviour, currentNode, windowToUse, source, sourceType, sourceValue, methodExecuted)
{
    //#region
    var loopContextID = getLoopContextID(currentAction);

    var targetTransferredID = currentNode.getAttribute("TargetSubFormID");
    if (checkExistsNotEmptyGuid(targetTransferredID))
    {
        currentNode = populateSubformContext(currentNode, targetTransferredID);
    }
    else
    {
        targetTransferredID = currentNode.getAttribute("TargetTransferredID");
    }
    var targetInstanceID = currentNode.getAttribute("TargetInstanceID");
    var targetRuntimeContextID = currentNode.getAttribute("TargetRuntimeContextID");

    var ViewID = currentAction.getAttribute("ViewID");
    var currentControlID = currentAction.getAttribute("ControlID");
    var targetType = currentNode.getAttribute("TargetType");
    var target = currentNode.getAttribute("TargetID");
    var targetPath = currentNode.getAttribute("TargetPath");

    var instanceXP = (checkExists(targetInstanceID)) ? "[@InstanceID='" + targetInstanceID + "']" : "";
    switch (targetType)
    {
        case "Control":
            //#region
            var findOptions =
                {
                    controlID: target,
                    instanceID: targetInstanceID,
                    transferredID: targetTransferredID,
                    runtimeContextID: targetRuntimeContextID,
                    isDestination: true,
                }
            var instanceObj = findCorrectInstanceForDataTransfer(findOptions);
            if (checkExists(instanceObj))
            {
                var currentControl = instanceObj.result;

                if (checkExists(currentControl))
                {
                    ViewID = instanceObj.ViewID;
                    windowToUse = instanceObj.WindowToUse;
                    var xmlDoc = null;
                    var controlTemplate = currentControl.getAttribute("ControlTemplate");
                    if (checkExists(controlTemplate) && controlTemplate === "header") //list header text change (bug 194235)
                    {
                        var mainTable = currentControl.parentNode.parentNode.getAttribute("MainTable");
                        if (checkExists(mainTable))
                        {
                            var displayNodes = jQuery("#" + mainTable).find("." + target);
                            var n = displayNodes.length; //handle possible multiples
                            while (n--)
                            {
                                $(displayNodes[n]).text(sourceValue);
                                displayNodes[n].setAttribute("title", sourceValue);
                            }
                        }
                    }
                    else
                    {
                        var objInfo = new PopulateObject(xmlDoc, sourceValue, target);
                        windowToUse.executeControlFunction(currentControl, "SetValue", objInfo);
                    }
                }
            }
            break;
        //#endregion
        case "ViewField":
            //#region
            //if sourcevalue corresponds to a collection type, this should be transformed and then updated as a collection per control
            //changed specifically for treeview control, certain attribute should be valid, otherwise no transformation can take place
            //also specific changes for many to many control, certain association properties should be set, otherwise the property collection can not correctly be transformed and used
            var findOptions =
                {
                    fieldID: target,
                    instanceID: targetInstanceID,
                    transferredID: targetTransferredID,
                    runtimeContextID: targetRuntimeContextID,
                    isDestination: true,
                }
            var instanceObj = findCorrectInstanceForDataTransfer(findOptions);
            if (checkExists(instanceObj))
            {
                var currentField = instanceObj.result;

                if (!checkExists(currentField))
                {
                    return;
                }
                ViewID = instanceObj.ViewID;
                windowToUse = instanceObj.WindowToUse;

                var setSourceValue = true;
                if (sourceType === "Control")
                {
                    var controlID = source.split('_')[1];
                    var hasComposite, collectionData;
                    if (sourceValue)
                    {
                        if (typeof sourceValue === "string" && sourceValue.startsWith("<collection"))
                        {
                            var collectionData = true;
                            var xmlSource = $xml(sourceValue);
                            var CollectionType = $sn(xmlSource, "collection").getAttribute("Type");

                            if (checkExists(CollectionType))
                            {
                                if (CollectionType === "Complex")
                                {
                                    windowToUse.setHiddenPropertyCollection(ViewID, xmlSource, controlID, null, null, targetInstanceID);
                                    sourceValue = $sn(xmlSource, baseCollectionXPath + "/fields/field[@isValue='true']/value").text;
                                }
                                else if (CollectionType === "Composite")
                                {
                                    var fieldInfo = returnFieldAttributeObject(target, targetInstanceID);
                                    if (checkExists(fieldInfo) && fieldInfo.propertyType.toUpperCase() === "MULTIVALUE")
                                    {
                                        hasComposite = false;
                                    }
                                    else
                                    {
                                        //translate to JSON composite values
                                        hasComposite = true;
                                        sourceValue = _runtimeTransformXmlCollectionToJson(xmlSource.documentElement);
                                    }
                                }
                            }
                        }
                        if (!collectionData || hasComposite)
                        {
                            try
                            {
                                //check for associated fields
                                var association = new dataSourceLookup({ xmlDoc: windowToUse.viewControllerDefinition, controllerID: ViewID, instanceXP: instanceXP, controlID: controlID }).getDataSource();
                                if (checkExists(association))
                                {
                                    var isComposite = association.getAttribute("IsComposite");
                                    if (checkExists(isComposite))
                                    {
                                        isComposite = isComposite.toLowerCase();
                                    }
                                    if (checkExists(isComposite) && isComposite === "true")
                                    {
                                        //a composite action is required - the values are returned in a collection and should now set the hidden field collection
                                        var contextid = association.getAttribute("ContextID");
                                        var contexttype = association.getAttribute("ContextType");
                                        var s = sourceValue.length;
                                        if (s === 0)
                                        {
                                            windowToUse.removeHiddenPropertyCollection(ViewID, null, null, null, source, null, contexttype, targetInstanceID, contextid);
                                        }
                                        else
                                        {
                                            windowToUse.setHiddenPropertyCollection(ViewID, sourceValue, source, contextid, contexttype, targetInstanceID); //using the source/controlID?
                                        }
                                        setSourceValue = false;
                                    }
                                    else
                                    {
                                        var propertyName = association.getAttribute("ValueProperty");
                                        var parentID = association.getAttribute("AssociationSO");
                                        var parentType = "Object";
                                        var contextID = association.getAttribute("ContextID");
                                        var contextType = association.getAttribute("ContextType");

                                        var field = $sn(windowToUse.viewControllerDefinition, "Controllers/Controller[@ID='" + ViewID + "']" + instanceXP + "/Fields/Field[@ContextID='" + contextID + "'][@ContextType='" + contextType + "'][@ObjectID='" + parentID + "'][@ObjectType='" + parentType + "'][PropertyName/text()='" + propertyName + "']");
                                        if (checkExists(field))
                                        {
                                            windowToUse.setHiddenFieldValue(field.getAttribute("ID"), sourceValue, null, targetInstanceID, source, sourceType, null, loopContextID);
                                        }
                                    }
                                }
                            }
                            catch (exc)
                            {
                            }
                        }
                    }
                }
                if (setSourceValue)
                {
                    windowToUse.setHiddenFieldValue(target, sourceValue, null, targetInstanceID, source, sourceType, null, loopContextID);
                }
            }
            break;
        //#endregion
        case "ViewProperty":
            var options =
                {
                    viewID: ViewID,
                    currentAction: currentAction,
                    target: target,
                    sourceValue: sourceValue,
                    targetTransferredID: targetTransferredID,
                    targetRuntimeContextID: targetRuntimeContextID,
                    loopContextID: loopContextID
                }
            updateViewProperty(options);
            break;
        case "ControlProperty":
            //#region
            if (checkExistsNotEmpty(target))
            {
                target = target.toLowerCase();
            }
            if (checkExists(targetPath))
            {
                currentControlID = targetPath;
            }
            if (checkExists(currentControlID))
            {
                if (target === "controlexpression")
                {
                    //get the correct sourceid from the derived value (hack when SCP designer have not created separate expression - dragged instead of selected -> 391873)
                    sourceValue = deriveControlExpressionFromValue(currentControlID, currentNode, sourceValue, targetInstanceID, targetTransferredID);
                }
                SetControlProperty(currentControlID, target, sourceValue, targetTransferredID, targetRuntimeContextID, false, loopContextID);
            }
            break;
        //#endregion
        case "PanelProperty":
            //#region
            var PanelID = currentAction.getAttribute("PanelID");
            if (checkExists(PanelID))
            {
                if (target.toLowerCase() === "display")
                {
                    //#region
                    var formPanelID = _runtimeEmptyGuid + "_" + PanelID;
                    switch (sourceValue.toLowerCase())
                    {
                        case "show":
                            SetControlProperty(formPanelID, "isvisible", true, targetTransferredID, targetRuntimeContextID, true);
                            break;
                        case "hide":
                            SetControlProperty(formPanelID, "isvisible", false, targetTransferredID, targetRuntimeContextID, true);
                            break;
                    }
                    //#endregion
                }
            }
            break;
        //#endregion
        case "FormProperty":
            //#region
            switch (target.toLowerCase())
            {
                case "wfstripdisplay":
                    //#region
                    var workflowpanel = jQuery(".workflow_panel");
                    var formPanel = jQuery(".workflow-form-panel");
                    if (workflowpanel)
                    {
                        workflowpanel = workflowpanel[0];
                        switch (sourceValue.toLowerCase())
                        {
                            case "show":
                                workflowpanel.style.display = "block";
                                formPanel.addClass("with-workflow-strip");
                                break;
                            case "hide":
                                workflowpanel.style.display = "none";
                                formPanel.removeClass("with-workflow-strip");
                                break;
                        }
                    }
                    break;
                //#endregion
                case "wfstripbuttons":
                    //#region
                    var workflowbuttonpanel = document.getElementById("workflow_button_panel");
                    if (workflowbuttonpanel)
                    {
                        switch (sourceValue.toLowerCase())
                        {
                            case "show":
                                workflowbuttonpanel.style.display = "inline-block";
                                break;
                            case "hide":
                                workflowbuttonpanel.style.display = "none";
                                break;
                        }
                    }
                    break;
                //#endregion
                case "wfstripdropdown":
                    //#region
                    var workflowdropdownpanel = document.getElementById("workflow_dropdown_submit_panel");
                    if (workflowdropdownpanel)
                    {
                        switch (sourceValue.toLowerCase())
                        {
                            case "show":
                                workflowdropdownpanel.style.display = "inline";
                                break;
                            case "hide":
                                workflowdropdownpanel.style.display = "none";
                                break;
                        }
                    }
                    break;
                //#endregion
            }
            break;
        //#endregion
        case "FormParameter":
            //#region
            setFormParameterValue(target, sourceValue, loopContextID);
            break;
        //#endregion
        case "ViewParameter":
            //#region
            setViewParameterValue(target, sourceValue, targetInstanceID, loopContextID);
            break;
        //#endregion
    }
    //#endregion
}


// options should have the following properties:
//viewID
//currentAction
//target
//sourceValue
//targetTransferredID
//targetRuntimeContextID
//loopContextID
function updateViewProperty(options)
{
    var ViewID = options.viewID;
    var currentAction = options.currentAction;
    var target = options.target;
    var sourceValue = options.sourceValue;
    var targetTransferredID = options.targetTransferredID;
    var targetRuntimeContextID = options.targetRuntimeContextID;
    var loopContextID = options.loopContextID;

    if (!checkExists(ViewID) || !checkExists(currentAction))
    {
        return;
    }

    var instanceID = currentAction.getAttribute("InstanceID");

    if (checkExistsNotEmpty(target))
    {
        target = target.toLowerCase();
    }

    if (!checkExists(instanceID)) // then the view is not on a form
    {
        //if the view is not on a form then just update the control and skip SCP
        windowToUse = getWindowToUse(currentAction); //get correct window to do View property changes on
        var viewDef = windowToUse.getViewDefinition(ViewID, null);

        if (checkExists(viewDef))
        {
            var viewDivID = viewDef.getAttribute("MainTable");
            windowToUse.$("#" + viewDivID).SFCAreaItem("option", target, sourceValue);
        }
    }
    else
    {
        currentControlID = _runtimeEmptyGuid + "_" + instanceID;
        SetControlProperty(currentControlID, target, sourceValue, targetTransferredID, targetRuntimeContextID, false, loopContextID);
    }

}

//get the correct expressionid from the original sourcevalue (hack when SCP designer have not created separate expression - dragged instead of selected -> 391873)
function deriveControlExpressionFromValue(currentControlID, currentNode, sourceValue, targetInstanceID, TransferredID)
{
    //#region
    var actualExpression = $sn(currentNode, "SourceValue[count(Source)=1]/Source[@SourceType='Expression']");

    if (!checkExists(actualExpression) && currentNode.getAttribute("SourceType") === "Expression")
    {
        actualExpression = currentNode;
    }

    if (checkExists(actualExpression))
    {
        var expressionID = actualExpression.getAttribute("SourceID");
        var expressionInstanceID = actualExpression.getAttribute("SourceInstanceID");
        sourceValue = expressionID;

        //if expression instanceid === targetInstanceID, just set the value
        //check if expression does not already exist on this level, else create and link back to original
        if (checkExists(expressionInstanceID) && targetInstanceID !== expressionInstanceID)
        {
            var expressionItem = null;
            var expressionUsingItem = null;//make this specific to only that one child element and nothing else: [count(Item)=1]
            if (!checkExists(targetInstanceID)) //target is form control or view runtime
            {
                expressionItem = $sn(viewControllerDefinition, "Controllers/Expressions/Expression[@ID='" + expressionID + "'][not(@InstanceID)]");
                if (!checkExists(expressionItem))
                {
                    expressionUsingItem = $sn(viewControllerDefinition, "Controllers/Expressions/Expression[not(@InstanceID)][count(Item)=1]/Item[@SourceType='Expression'][@SourceID='" + expressionID + "']" + returnInstanceXP(expressionInstanceID, false, true, true, true));
                }
            }
            else if (checkExists(targetInstanceID)) //target is view control (on a form)
            {
                expressionItem = $sn(viewControllerDefinition, "Controllers/Expressions/Expression[@ID='" + expressionID + "']" + returnInstanceXP(targetInstanceID, false, false, true, true));
                if (!checkExists(expressionItem))
                {
                    expressionUsingItem = $sn(viewControllerDefinition, "Controllers/Expressions/Expression" + returnInstanceXP(targetInstanceID, false, false, true, true) + "[count(Item)=1]/Item[@SourceType='Expression'][@SourceID='" + expressionID + "']" + returnInstanceXP(expressionInstanceID, false, true, true, true));
                }
            }
            if (!checkExists(expressionItem))
            {
                if (checkExists(expressionUsingItem))
                {
                    //get the correct expresssion id that was already configured for reuse
                    sourceValue = expressionUsingItem.parentNode.getAttribute("ID");
                }
                else
                {
                    sourceValue = createPseudoExpressionForControlProperties(targetInstanceID, sourceValue, "Expression", expressionInstanceID);
                }
            }
        }
    }
    else
    {
        var nodeTargetSubformID = currentNode.getAttribute("TargetSubFormID");
        if (checkExists(nodeTargetSubformID) && TransferredID !== nodeTargetSubformID)
        {
            var valueNode = $sn(currentNode, "SourceValue/Source[@SourceType='Value']");
            if (checkExists(valueNode))
            {
                //create a psuedo seperate expression and link it to this one
                sourceValue = createPseudoExpressionForControlProperties(targetInstanceID, sourceValue, "Value");
            }
        }
    }

    return sourceValue;
    //#endregion
}

//create a psuedo expression to be used for control properties (depending on types) -> 391873
function createPseudoExpressionForControlProperties(targetInstanceID, sourceValue, sourceType, sourceInstanceID)
{
    //#region
    //create a psuedo seperate expression and link it to this one
    var currentNode = viewControllerDefinition.createElement("Expression");
    currentNode.setAttribute("pseudo", "true");
    if (checkExists(targetInstanceID))
    {
        currentNode.setAttribute("InstanceID", targetInstanceID);
    }
    var newExpressionID = String.generateGuid();

    currentNode.setAttribute("ID", newExpressionID);//new GUID
    //create the item that needs to be added and add this to the definition
    var itemNode = viewControllerDefinition.createElement("Item");
    itemNode.setAttribute("SourceType", sourceType);
    if (sourceType === "Expression")
    {
        itemNode.setAttribute("SourceID", sourceValue);
    }
    else if (sourceType === "Value")
    {
        var sourceValueNode = viewControllerDefinition.createElement("SourceValue");
        itemNode.appendChild(sourceValueNode);
        var textValue = viewControllerDefinition.createTextNode(sourceValue);
        sourceValueNode.appendChild(textValue);
    }
    if (checkExists(sourceInstanceID))
    {
        itemNode.setAttribute("SourceInstanceID", sourceInstanceID);
    }

    currentNode.appendChild(itemNode);
    //append the expression node to the list of expressions
    var expressionsNode = $sn(viewControllerDefinition, "Controllers/Expressions");
    expressionsNode.appendChild(currentNode);
    sourceValue = newExpressionID;

    return sourceValue;
    //#endregion
}

var listRefreshCache = [];

//update the runtime defintion of the control properties with the correct value
function updateControlPropertyDefinition(currentControl, propertyName, propertyValue, loopContextID)
{
    //#region
    if (!checkExists(currentControl))
    {
        return false;
    }
    var options = {};
    options.viewId = currentControl.parentNode.parentNode.getAttribute("ID");
    options.instanceId = currentControl.parentNode.parentNode.getAttribute("InstanceID");
    options.controlId = currentControl.getAttribute("ID");
    options.propertyName = propertyName.toLowerCase();
    options.value = propertyValue;

    var previousValue = SourceCode.Forms.Runtime.Information.getControlPropertyHistory(options);
    //fallback to rendered definition
    if (!checkExists(previousValue))
    {
        previousValue = $sn(currentControl, "Properties/Property[translate(Name/text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')='" + options.propertyName + "']/Value"); //lower case comparison
        if (checkExists(previousValue))
        {
            previousValue = previousValue.text;
        }
    }
    var update = true;
    var updatePreviousNode = (previousValue !== propertyValue);

    if (!updatePreviousNode)
    {
        var controlPropertyOptions =
            {
                controlID: options.controlId,
                propertyName: options.propertyName,
                currentControl: currentControl,
                ignoreXML: true
            }
        if (propertyValue != returnControlPropertyValue(controlPropertyOptions))
        {
            //do extra check to ensure that the control itself might not have changed its properties in the meantime (particularly value properties after transfers for instance #344346)
            updatePreviousNode = true;
        }
        else
        {
            update = false;
        }
    }

    if (updatePreviousNode)
    {
        SourceCode.Forms.Runtime.Information.setControlPropertyHistory(options);
        //clear the other cache so it can be rebuild to update propertyType / FieldID
        //this was missing / existing issue where the propertyType may be out of date if the datatype is updated
        _runtimeControlInfoCache[options.controlId] = null;
    }

    if (update && checkExists(propertyValue))
    {
        updateSpecialControlProperties(
            {
                currentControl: currentControl,
                propertyName: options.propertyName,
                propertyValue: propertyValue,
                loopContextID: loopContextID,
                instanceId: options.instanceId
            });
    }
    return update;
    //#endregion
}

function updateSpecialControlProperties(options)
{
    var propertyName = options.propertyName;
    var propertyValue = options.propertyValue;
    var loopContextID = options.loopContextID;
    var skipAction = options.skipAction;
    var instanceID = options.instanceId;
    var controlID = options.controlId;
    var currentControl = (checkExists(options.currentControl)) ? options.currentControl : _runtimeControllerFindObject({ controlID: controlID });

    function updateAttribute(currentControl, attributeName, propertyValue)
    {
        var added = false;
        if (propertyValue.length > 0)
        {
            currentControl.setAttribute(attributeName, propertyValue);
            added = true;
        }
        else
        {
            currentControl.removeAttribute(attributeName);
            added = false;
        }

        return added;
    }

    if (checkExists(propertyValue) && checkExists(currentControl))
    {
        switch (propertyName.toLowerCase())
        {
            case "field":
                updateAttribute(currentControl, "FieldID", propertyValue);
                break;
            case "controlexpression":
                if (updateAttribute(currentControl, "ExpressionID", propertyValue) && !skipAction)
                {
                    var instanceID = (checkExists(instanceID)) ? instanceID : currentControl.parentNode.parentNode.getAttribute("InstanceID");
                    var expressionXP = "Controllers/Expressions/Expression[@ID='" + propertyValue + "']" + returnInstanceXP(instanceID, false, false, true, false);
                    var expression = $sn(viewControllerDefinition, expressionXP);
                    if (checkExists(expression))
                    {
                        refreshAllRelatedExpressions(propertyValue, expression, instanceID, null, null, loopContextID);
                    }
                    fireExpressions();
                }
                break;
            case "datatype":
                updateAttribute(currentControl, "DataType", propertyValue);
                break;
            case "parentusingfield":
                updateAttribute(currentControl, "ParentUsingField", propertyValue);
                break;
        }
    }
}

//update the state of list controls (such as column etc)
function updateListControlStates(currentControl, currentControlID, propertyName, sourceValue)
{
    //#region
    var controlTemplate = currentControl.getAttribute("ControlTemplate");
    var mainTable = currentControl.parentNode.parentNode.getAttribute("MainTable");
    var displayNodes;
    if (checkExists(controlTemplate) && checkExists(mainTable)) //list type view with control template set
    {
        var jqMainTable = jQuery("#" + mainTable);

        switch (controlTemplate)
        {
            case "display":
                listRefreshCache.push(mainTable); //update the grid's rendering
                break;
            case "header":
                displayNodes = jqMainTable.find("." + currentControlID);
                var n = displayNodes.length;
                var displayValue = (sourceValue === "false") ? "none" : "";
                var boolValue = (sourceValue === "false") ? false : true;
                while (n--)
                {
                    if (propertyName === "isvisible")
                    {
                        displayNodes[n].style.display = displayValue;
                    }
                    else if (propertyName === "isenabled")
                    {
                        //use the grid js functionality to allow sorting
                        var columnID = displayNodes[n].className.replace(currentControlID, "").replace("grid-column-header-text", "").trim(); //get the column from the extra clasname on the header
                        SFRGrid.execute({ element: jqMainTable, fn: "update", params: ["column", columnID, { sortable: boolValue }] });
                    }
                }
                break;
            case "none": //the column itself
                if (propertyName === "isvisible")
                {
                    //use the grid js functionality to show/hide column - no need to do anything to the controls
                    var showValue = (sourceValue === "false") ? "hide" : "unhide";
                    SFRGrid.execute({ element: jqMainTable, fn: showValue, params: ["column", currentControlID] });
                    //verify that quick search is up to date with visible columns
                    var viewID = currentControl.parentNode.parentNode.getAttribute("ID");
                    var instanceID = currentControl.parentNode.parentNode.getAttribute("InstanceID");
                    var listSectionID = (checkExists(instanceID)) ? instanceID + "_" + viewID : _runtimeEmptyGuid + "_" + viewID;
                    runtimeFilterFields[listSectionID] = null;
                    populateQuickSearchDropdown(viewID, instanceID, listSectionID);
                }
                else if (propertyName === "isenabled")
                {
                    //update the definitions and refresh the grid
                    displayNodes = jqMainTable.find("." + currentControlID);
                    var dn = displayNodes.length;
                    while (dn--)
                    {
                        if (displayNodes.eq(dn).hasClass("grid-content-cell-wrapper") && displayNodes[dn].children.length > 0) //edit/display template
                        {
                            var columnControls = displayNodes.eq(dn).find("*[id]"); //nested controls
                            var controlArray = [];
                            var c = columnControls.length;
                            while (c--)
                            {
                                var childControlID = columnControls[c].id;
                                if (checkExists(childControlID) && childControlID.length > 0)
                                {
                                    var actualControlID = getActualControlID(childControlID);
                                    if (controlArray.indexOf(actualControlID) < 0)
                                    {
                                        controlArray.push(actualControlID);
                                    }
                                }
                            }
                            while (controlArray.length > 0)
                            {
                                var actualControlID = controlArray.pop();
                                var childControl = _runtimeControllerFindObject({ controlID: actualControlID, propertySearch: "SetProperty" });

                                if (checkExists(childControl))
                                {
                                    var objInfo = new PopulateObject(null, sourceValue, actualControlID, "isparentenabled");
                                    var updated = updateControlPropertyDefinition(currentControl, objInfo.property, objInfo.Value);
                                    if (updated)
                                    {
                                        executeControlFunction(childControl, "SetProperty", objInfo);
                                        updateListControlStates(childControl, actualControlID, "isparentenabled", sourceValue); //recursive logic - to ensure that grid properties are correctly updated before refresh
                                    }
                                }
                            }
                        }
                    }
                    var booleanValue = (sourceValue === "false") ? false : true;
                    SFRGrid.execute({ element: jqMainTable, fn: "update", params: ["column", currentControlID, { sortable: booleanValue }] });
                }
                break;
            //footer and edit implied, since it contains actual controls
            //footer not part of column implementation either
        }
    }
    else if (propertyName.toLowerCase() === "isvisible")
    {
        refreshFormPadding({ controlID: currentControlID });
    }
    //#endregion
}

//repopulates all the relevant views (if necessary) - ensures that it is only called once where possible
function updateAllListDisplays(loopContextID)
{
    //#region
    if (listRefreshCache.length > 0)
    {
        listRefreshCache = listRefreshCache.filter(function (item, index)
        {
            return listRefreshCache.indexOf(item) === index;
        });
        while (listRefreshCache.length > 0)
        {
            var tableID = listRefreshCache.pop();
            if (simpleListCache.length > 0 && simpleListCache.indexOf(tableID) > -1)
            {
                simpleListCache.splice(simpleListCache.indexOf(tableID), 1); //ensures that double refreshing doesn't happen below, unlikely, but needs to prevented if at all possible
            }
            updateListDisplay(tableID, null, loopContextID);
        }
    }
    if (simpleListCache.length > 0)
    {
        simpleListCache = simpleListCache.filter(function (item, index)
        {
            return simpleListCache.indexOf(item) === index;
        });
        while (simpleListCache.length > 0)
        {
            updateListDisplay(simpleListCache.pop(), true, loopContextID); //this will do the same as above, but doesn't update the grid definitions being used (better for performance, when we know the definitions hasn't changed)
        }
    }
    //#endregion
}

//repopulates the relevant view according to the property changes
function updateListDisplay(mainTable, reuseDefinitions, loopContextID)
{
    if (checkExists(mainTable) && mainTable.length > 0)
    {
        var viewInstanceInfo = new getMainTableViewInformation(mainTable);
        var viewID = viewInstanceInfo.viewID;
        var instanceID = viewInstanceInfo.instanceID;
        var jTable = jQuery("#" + mainTable);
        if (jTable.length > 0)
        {
            var tableObject = jTable[0];
            //refresh grid - have to do it like this to enable conditional formatting to be correctly displayed
            var pageNumber = tableObject.getAttribute("PageNumber");
            if (!checkExists(reuseDefinitions) || reuseDefinitions === false)//no need to repopulate table definitions, only applicable for refresh of expressions when editable list change is committed (List.js - updateGridAfterEditableChanges)
            {
                var quickSearchProperty = null;
                var quickSearchValue = null;
                if (checkExists(tableObject.getAttribute("QFName")) && tableObject.getAttribute("QFName").length > 0)
                {
                    quickSearchProperty = tableObject.getAttribute("QFName");
                    quickSearchValue = tableObject.getAttribute("QFValue");
                }
                viewTableDefinitions[mainTable] = constructTableDefinition(viewID, jTable, quickSearchValue, quickSearchProperty, instanceID); //have to reconstruct definitions, since the properties in the view definition has changed
            }
            //get the relevant properties and repopulate - no need to call populate view again, since that will attempt more complex logic as well (such as resetting field collections etc)
            var JustProperties = getCombinedHiddenPropertyCollection(viewID, null, null, pageNumber, null, true, null, null, null, instanceID);//cleaner implementation, no resetting of fields unnecessarily
            rebuildTable(mainTable, viewID, instanceID, false, false, true, JustProperties, true, pageNumber, loopContextID, false);
        }
    }
}

//helper function to get the correct window to use to evaluate for an item
function getWindowToUse(itemNode, executingBehaviour)
{
    var relevantWindow = window.self;
    if (checkExists(executingBehaviour) && executingBehaviour.runtimeInstanceName !== "_")//extra exclusion for single level
    {
        //currently only applicable from AJAX call to keep window determining logic contained
        //attempt executing on behaviour context
        var contextValid = SourceCode.Forms.Runtime.getRuntimeDataProperty(executingBehaviour.runtimeInstanceName, "windowContextValid");
        if (contextValid)
        {
            relevantWindow = SourceCode.Forms.Runtime.getRuntimeDataProperty(executingBehaviour.runtimeInstanceName, "windowContext");
        }
    }

    // Do not try and determine window contexts for Behavior Context Actions because they inherit their parent behavior's context.
    if (SourceCode.Forms.Runtime.Navigation.isBehaviorContextAction(itemNode))
    {
        return relevantWindow;
    }

    var transferredID = itemNode.getAttribute("TransferredID");
    var viewID = itemNode.getAttribute("ViewID");
    var formID = itemNode.getAttribute("FormID");
    var groupID = itemNode.getAttribute("GroupID"); //validation group ID
    var originalLevel = itemNode.getAttribute("OriginalLevel");
    var runtimeContextID = itemNode.getAttribute("RuntimeContextID");
    var viewInstanceID = itemNode.getAttribute("InstanceID");

    var findOptions =
        {
            viewID: viewID,
            instanceID: viewInstanceID,
            formID: formID,
            transferredID: transferredID,
            groupID: groupID,
            originalLevel: originalLevel,
            runtimeContextID: runtimeContextID,
            isDestination: true
        };

    var instanceObj = relevantWindow.findCorrectInstanceForDataTransfer(findOptions);
    return instanceObj.WindowToUse;
}

// Rename when original function can be removed.
function findCorrectInstanceForDataTransfer(o)
{
    // Mapping
    // In mapping terms, since Sources and Targets are handled seperately, you can never have a IID + SFID combination.
    // Valid combinations are:
    // InstanceID
    // SubFormID
    // SubFormID + InstnaceID

    var runtimeSearchObject =
        {
            formID: o.formID,
            viewID: o.viewID,
            instanceID: o.instanceID,
            controlID: o.controlID,
            fieldID: o.fieldID,
            expressionID: o.expressionID,
            groupID: o.groupID,
            formParameter: o.formParameter,
            viewParameter: o.viewParameter,
            dataSourceID: o.dataSourceID
        }

    // First we assume it's current context first.
    var contextSubformID = __runtimeSubformID;
    var contextID = __runtimeContextID;

    // Subform Context
    if (checkExists(o.transferredID) && checkExists(o.runtimeContextID))
    {
        contextSubformID = o.transferredID;
        contextID = o.runtimeContextID;
    }

    var instanceName = contextID + "_" + contextSubformID;
    var contextValid = SourceCode.Forms.Runtime.getRuntimeDataProperty(instanceName, "windowContextValid");
    var retObj = { WindowToUse: window.self, result: null };

    if (contextValid === true)
    {
        // Window Context
        retObj.WindowToUse = SourceCode.Forms.Runtime.getRuntimeDataProperty(instanceName, "windowContext");

        // Find instance
        if (checkExists(retObj.WindowToUse))
        {
            if (typeof retObj.WindowToUse._runtimeControllerFindObject === "function")
            {
                retObj.result = retObj.WindowToUse._runtimeControllerFindObject(runtimeSearchObject);

                if (o.isDestination === true && checkExists(retObj.result))
                {
                    if (checkExists(retObj.result.parentNode) && checkExists(retObj.result.parentNode.parentNode) && typeof (retObj.result.parentNode.parentNode.getAttribute) !== "undefined")
                    {
                        retObj.ViewID = retObj.result.parentNode.parentNode.getAttribute("ID");
                        retObj.InstanceID = retObj.result.parentNode.parentNode.getAttribute("InstanceID");
                    }
                }
            }
        }

        // Fallback to old behavior.
        if (!checkExists(retObj.WindowToUse) || !checkExists(retObj.result))
        {
            retObj = findCorrectInstanceForDataTransferFallback(o);
        }
    }
    return retObj;
}

//helper function to find the correct instances for data transfer (windowToUse, View, returnNode - field/control etc)
//options
// viewID optional
// instanceID optional
// formID optional
// controlID optional only one of these
// fieldID optional only one of these
// expressionID optional only one of these
// isDestination optional
// transferredID optional
// isParent optional

function findCorrectInstanceForDataTransferFallback(o)
{
    var isDestination = o.isDestination;
    var transferredID = o.transferredID;
    var isParent = o.isParent;
    var originalLevel = o.originalLevel;
    var runtimeSearchObject =
        {
            formID: o.formID,
            viewID: o.viewID,
            instanceID: o.instanceID,
            controlID: o.controlID,
            fieldID: o.fieldID,
            expressionID: o.expressionID,
            groupID: o.groupID,
            formParameter: o.formParameter,
            viewParameter: o.viewParameter,
            dataSourceID: o.dataSourceID
        }
    //xpathValue - the xpath that should be inspected on the specified viewControllerDefinition
    //isDestination - if more than just the relevant window should be returned in this object
    //transferredID - subformID (if relevant)
    //isParent - ??? seems to allow for lookups to happen on other windows
    //originalLevel - used for navigated events & actions when execution should happen on parent even after context was moved to new window

    //The WindowToUse can either be the current window or the parent window
    //get the correct window / popup according to levels
    var windowToUse = window.self;
    var locationResult = null;
    var windowForPopups = SourceCode.Forms.Runtime.getMasterRuntimeWindow();
    var level = parseInt(__runtimeFormLevel, 10);
    var runtimeIframePopups = SourceCode.Forms.Runtime.getAllPopupsWithRuntimeInstances();

    if (checkExistsNotEmpty(transferredID))
    {
        if (isDestination !== true && runtimeIframePopups.length > 0)
        {
            var popupLength = runtimeIframePopups.length;
            for (var i = level; i < popupLength; i++) // level starts searching at first subform/view after the current window.
            {
                var innerWindow = getPopupWindowOnLevel(windowToUse, i, runtimeIframePopups);
                if (innerWindow.__runtimeSubformID === transferredID && typeof innerWindow._runtimeControllerFindObject === "function")
                {
                    locationResult = innerWindow._runtimeControllerFindObject(runtimeSearchObject);
                    if (checkExists(locationResult))
                    {
                        windowToUse = innerWindow;
                        break;
                    }
                }
            }
        }
        // Fallback to current level if subformID is the same.
        if (!checkExists(locationResult) && __runtimeSubformID === transferredID)
        {
            locationResult = _runtimeControllerFindObject(runtimeSearchObject);
        }
    }

    //NOTE:
    //popupArray index vs levels are worked with - 2
    //sample: Level 1 = PopupArray[0]; Level 2 = PopupArray[1]; Level 3 = PopupArray[2].
    //To get direct parent, 2 must be subtracted from the popup array index if the level is bigger than 1, otherwise the main popup manager is the correct window
    if (!checkExists(locationResult) && level > 0 && checkExists(originalLevel) && parseInt(originalLevel, 10) < level)//here the original level is specified and can be used (implemented with navigated events)
    {
        windowToUse = windowForPopups;
        if (level > 1 && originalLevel >= 1)//find relevant execution window
        {
            windowToUse = getPopupWindowOnLevel(windowToUse, originalLevel - 1, runtimeIframePopups);
        }
        if (o.runSearch !== false)
        {
            if (typeof windowToUse._runtimeControllerFindObject === "function")
            {
                locationResult = windowToUse._runtimeControllerFindObject(runtimeSearchObject);
            }
        }
    }

    if (o.runSearch !== false && !checkExists(locationResult))
    {
        //revert if still not found
        windowToUse = window.self;
        if (typeof windowToUse._runtimeControllerFindObject === "function")
        {
            locationResult = windowToUse._runtimeControllerFindObject(runtimeSearchObject);
        }
    }

    if (o.runSearch !== false && !checkExists(locationResult))
    {
        //migrated a prior similar section that could improve lookup time in some cases
        if (level > 1 && ((checkExists(transferredID) && isDestination) || isParent))//find direct parent if this is a subform
        {
            windowToUse = getPopupWindowOnLevel(windowToUse, level - 2, runtimeIframePopups);
            if (typeof windowToUse._runtimeControllerFindObject === "function")
            {
                locationResult = windowToUse._runtimeControllerFindObject(runtimeSearchObject);
            }
        }

        if (!checkExists(locationResult))
        {
            //revert if still not found (TFS 457856)
            if (windowToUse != windowForPopups)
            {
                windowToUse = windowForPopups;
                if (typeof windowToUse._runtimeControllerFindObject === "function")
                {
                    locationResult = windowToUse._runtimeControllerFindObject(runtimeSearchObject);
                }
            }
        }

        if (!checkExists(locationResult) && runtimeIframePopups.length > 0)
        {
            //further  failsafe to try all possible open popup windows if nothing was found in rest of stack (TFS475910)
            var popupLength = runtimeIframePopups.length;
            var innerWindow = windowToUse;
            while (popupLength > 0 && !checkExists(locationResult))
            {
                var innerWindow = getPopupWindowOnLevel(windowToUse, popupLength - 1, runtimeIframePopups, true);
                if (typeof innerWindow._runtimeControllerFindObject === "function")
                {
                    locationResult = innerWindow._runtimeControllerFindObject(runtimeSearchObject);
                }
                popupLength--;
            }

            if (checkExists(locationResult))
            {
                windowToUse = innerWindow;
            }
        }
    }

    var retObj = {};
    retObj.WindowToUse = windowToUse;

    if (isDestination && checkExists(locationResult))
    {
        if (checkExists(locationResult.parentNode) && checkExists(locationResult.parentNode.parentNode) && typeof (locationResult.parentNode.parentNode.getAttribute) !== "undefined")
        {
            retObj.ViewID = locationResult.parentNode.parentNode.getAttribute("ID");
            retObj.InstanceID = locationResult.parentNode.parentNode.getAttribute("InstanceID");
        }
    }
    retObj.result = locationResult;
    return retObj;
}

//helper function to retrieve correct popupwindow from specified level
function getPopupWindowOnLevel(windowToUse, level, runtimeIframePopups, checkNotClosing)
{
    //#region
    var innerWindow = windowToUse;

    if (!checkExists(runtimeIframePopups))//failsafe to ensure it is retrieved if not specified
    {
        runtimeIframePopups = SourceCode.Forms.Runtime.getAllPopupsWithRuntimeInstances();
    }

    if (runtimeIframePopups.length > 0 && runtimeIframePopups.length > level)
    {
        var currentPopup = runtimeIframePopups[level];
        if (!checkNotClosing || !currentPopup.isClosing)
        {
            var popupBody = currentPopup.controls.body;
            if (checkExists(popupBody))
            {
                var popupIframe = popupBody.find("iframe.runtime-popup");
                innerWindow = SourceCode.Forms.Runtime.getPopupIframeContentWindow(popupIframe);
            }
        }
    }
    return innerWindow;
    //#endregion
}

//execute calculation(s) based on the control that changed
function calculateAction(currentAction, methodExecuted, behaviour)
{
    //#region
    var loopContextID = getLoopContextID(currentAction);

    if (checkExists(behaviour))
    {
        var instanceID = behaviour.InstanceID;
        switch (behaviour.SourceType)
        {
            case "Form":
                instanceID = _runtimeEmptyGuid;
                updateCalculatedControlsForSource(instanceID, true, loopContextID);
                break;
            case "View":
                updateCalculatedControlsForSource(instanceID, true, loopContextID);
                break;
            case "Control":
                var sourceID = behaviour.SourceID;
                if (sourceID)
                {
                    var control = _runtimeControllerFindObject({ controlID: sourceID });
                    calculateControlAction(control, sourceID, loopContextID);
                }
                break;
        }

        behaviour.isExecuting = false;
        //behaviour.executeBehaviour();//while loop covers this
    }

    removeLoopContextData({ loopContextID: loopContextID });

    //#endregion
}

//calculate action originated from a control (system event normally)
function calculateControlAction(control, currentControlID, loopContextID)
{
    //#region
    if (checkExists(control))
    {
        var instanceID = control.parentNode.parentNode.getAttribute("InstanceID");
        updateCalculatedControls(control, instanceID, null, null, null, null, null, loopContextID);

        //get controls linked to the external/associated datasource fields for this control
        var associations = new dataSourceLookup({ xmlDoc: viewControllerDefinition, selectMultiple: true, sourceControlID: currentControlID }).getDataSource();
        var a = associations.length;
        while (a--)
        {
            var currentAssoc = associations[a];
            var contextType = currentAssoc.getAttribute("ContextType");
            var contextID = currentAssoc.getAttribute("ContextID");

            var fieldsXP = "Controllers/Controller" + returnInstanceXP(instanceID, false, false, true, false) + "/Fields/Field[@ContextID='" + contextID + "'][@ContextType='" + contextType + "']";
            var influencedFields = $mn(viewControllerDefinition, fieldsXP);
            var f = influencedFields.length;
            while (f--)
            {
                var fieldID = influencedFields[f].getAttribute("ID");
                //handle expressions not related to the onchange context of controls
                updateCalculatedControls(null, instanceID, "ViewField", fieldID, null, null, null, loopContextID);
            }
        }
    }
    //#endregion
}

/* execute validations and either continue or stop further behaviour execution */
function validateAction(currentAction, methodExecuted, behaviour)
{
    //#region
    var loopContextID = getLoopContextID(currentAction);

    var validationGroupID = currentAction.getAttribute("GroupID");
    var controlID = currentAction.getAttribute("ControlID");
    var validationExpressionID = currentAction.getAttribute("ExpressionID");
    var validationMessage = currentAction.getAttribute("Message");
    var location = currentAction.getAttribute("MessageLocation");
    var ignoreInvisibleControls = currentAction.getAttribute("IgnoreInvisibleControls");
    var ignoreDisabledControls = currentAction.getAttribute("IgnoreDisabledControls");
    var ignoreReadOnlyControls = currentAction.getAttribute("IgnoreReadOnlyControls");
    var errorEncountered = false;
    var validationHTML = "";
    var validationObject;

    if (checkExists(validationGroupID) && validationGroupID.length > 0)
    {
        var instanceID = currentAction.getAttribute("InstanceID");
        var instanceXP = "";
        if (typeof instanceID !== "undefined" && instanceID !== null)
        {
            instanceXP = "[@InstanceID='" + instanceID + "']";
        }
        var validationGroupXP = _runtimeValidationGroupXpath.format("Controllers/", instanceXP, validationGroupID);
        var validationGroup = $sn(viewControllerDefinition, validationGroupXP);
        if (checkExists(validationGroup))
        {
            validationMessage = validationGroup.getAttribute("Message");
            var validationGroupCondition = $sn(validationGroup, "Condition");

            if (checkExists(validationGroupCondition))
            {
                var ExpressionNode = validationGroupCondition.firstChild;
                var returnValue = evaluateExpression(ExpressionNode, null, null, true, null, null, loopContextID);
                if (returnValue !== true)
                {
                    errorEncountered = true;
                    var errMessage = (validationMessage.length > 0) ? validationMessage : locValidationExpresssionsFailed;
                    masterPopupManager.showWarning(errMessage);
                }
            }

            if (!errorEncountered)
            {
                var validationSources = $mn(validationGroup, "ValidationGroupControls/ValidationGroupControl");
                var sources = validationSources.length;
                if (sources > 0)
                {
                    for (var v = 0; v < validationSources.length; v++)
                    {
                        var controlid = validationSources[v].getAttribute("ControlID");
                        var isRequired = validationSources[v].getAttribute("IsRequired");
                        var getControlValueObject =
                            {
                                controlID: controlid,
                                forValidation: true
                            }
                        var value = getControlValue(getControlValueObject);
                        var condition = $sn(validationSources[v], "Condition");

                        validationObject = validateControl(controlid, value, location, isRequired, condition, null, ignoreInvisibleControls, ignoreDisabledControls, ignoreReadOnlyControls, loopContextID);
                        if (checkExists(validationObject) && validationObject.Error)
                        {
                            if (location === "Popup")
                            {
                                validationHTML += (checkExists(validationObject.Pattern)) ? "- <b>" + validationObject.Name + "</b> " + validationObject.Pattern + "<br/>" : "";
                                validationHTML += (checkExists(validationObject.DataType)) ? "- <b>" + validationObject.Name + "</b> " + validationObject.DataType + "<br/>" : "";
                                validationHTML += (checkExists(validationObject.RequiredError)) ? "- <b>" + validationObject.Name + "</b> " + validationObject.RequiredError + "<br/>" : "";
                            }
                            errorEncountered = true;
                        }
                    }
                }
            }
        }
    }
    else if (checkExists(controlID) && controlID.length > 0)
    {
        //event was raised from the control itself - after value changed validation should fire
        if (!checkExists(location))
        {
            location = "Control";
        }
        var isRequired = "false";
        var getControlValueObject =
            {
                controlID: controlID,
                forValidation: true
            }
        var controlValue = getControlValue(getControlValueObject);
        var ExpressionItem = null;
        if (checkExists(validationExpressionID))
        {
            ExpressionItem = $sn(viewControllerDefinition, "Controllers/Expressions/Expression[@ID='" + validationExpressionID + "']");
        }
        validationObject = validateControl(controlID, controlValue, location, isRequired, ExpressionItem, validationMessage, null, null, null, loopContextID);
        if (checkExists(validationObject) && validationObject.Error)
        {
            if (location === "Popup")
            {
                validationHTML += (checkExists(validationObject.Pattern)) ? "- <b>" + validationObject.Name + "</b> " + validationObject.Pattern + "<br/>" : "";
                validationHTML += (checkExists(validationObject.DataType)) ? "- <b>" + validationObject.Name + "</b> " + validationObject.DataType + "<br/>" : "";
                validationHTML += (checkExists(validationObject.RequiredError)) ? "- <b>" + validationObject.Name + "</b> " + validationObject.RequiredError + "<br/>" : "";
            }
            errorEncountered = true;
        }
    }

    if (errorEncountered)
    {
        if (validationHTML.length > 0 && location === "Popup")
        {
            var height = 250;
            var width = 450;

            validationHTML = "<b>" + Resources.RuntimeMessages.ValidationWarningMessage + "</b><br/><br/>" + validationHTML;
            var options = { showHeaderButtons: true, headerText: Resources.RuntimeMessages.ValidationWarnings, message: validationHTML, height: height, width: width, type: "warning", cssClass: "validation-message" };
            masterPopupManager.showMessage(options);
        }
        if (checkExists(behaviour)) //extra logic to handle if handlerType when using validations, although this is technically an action
        {
            behaviour.actions = []; //stops further actions from executing
            behaviour.previousHandlerResult = false; //will allow fallback to else or always handler executions
        }
    }

    endActionExecution({ loopContextID: loopContextID, behaviour: behaviour });
    //#endregion
}

/* validates a specific control - used from validateAction and control's inner validation */
function validateControl(id, value, location, isRequired, ExpressionItem, validationMessage, ignoreInvisibleControls, ignoreDisabledControls, ignoreReadOnlyControls, loopContextID)
{
    //#region
    var currentControl = _runtimeControllerFindObject({ controlID: id });
    var validationObject = null;
    var errorEncountered = false;
    isRequired = checkExists(isRequired) && isRequired.length > 0 && isRequired.toLowerCase() === "true";

    if (checkExists(currentControl))
    {
        var continueChecks = true;

        var controlPanel = checkExists(currentControl.getAttribute("PanelID")) ? currentControl.getAttribute("PanelID") : currentControl.parentNode.parentNode.getAttribute("PanelID");
        var controlView = currentControl.parentNode.parentNode.getAttribute("ID");
        var mainTable = currentControl.parentNode.parentNode.getAttribute("MainTable");
        var objInfo = null; //populate objects sent to control functions
        var propertyValue = null; //retrieved value from controls/views/panels

        if (continueChecks && checkExists(ignoreReadOnlyControls) && ignoreReadOnlyControls.toLowerCase() === "true")
        {
            objInfo = new PopulateObject(null, null, id, "IsReadOnly");
            propertyValue = executeControlFunction(currentControl, "GetProperty", objInfo);
            if (checkExists(propertyValue) && propertyValue === true)
            {
                continueChecks = false;
            }
            else
            {
                objInfo = new PopulateObject(null, null, id, "IsParentReadOnly");
                propertyValue = executeControlFunction(currentControl, "GetProperty", objInfo);
                if (checkExists(propertyValue) && propertyValue === true)
                {
                    continueChecks = false;
                }
            }
        }

        if (continueChecks && checkExists(ignoreDisabledControls) && ignoreDisabledControls.toLowerCase() === "true")
        {
            objInfo = new PopulateObject(null, null, id, "IsEnabled");
            propertyValue = executeControlFunction(currentControl, "GetProperty", objInfo);
            if (checkExists(propertyValue) && propertyValue === false)
            {
                continueChecks = false;
            }
            else
            {
                objInfo = new PopulateObject(null, null, id, "IsParentEnabled");
                propertyValue = executeControlFunction(currentControl, "GetProperty", objInfo);
                if (checkExists(propertyValue) && propertyValue === false)
                {
                    continueChecks = false;
                }
            }
            if (continueChecks && checkExists(controlPanel) && controlPanel.length > 0)
            {
                propertyValue = testPanelProperty(controlPanel, "IsEnabled");
                if (checkExists(propertyValue) && propertyValue === false)
                {
                    continueChecks = false;
                }
            }
        }

        if (checkExists(ignoreInvisibleControls) && ignoreInvisibleControls.toLowerCase() === "true")
        {
            objInfo = new PopulateObject(null, null, id, "IsVisible");
            propertyValue = executeControlFunction(currentControl, "GetProperty", objInfo);

            if (checkExists(propertyValue) && propertyValue === false)
            {
                continueChecks = false;
            }

            if (continueChecks)
            {
                objInfo = new PopulateObject(null, null, id, "IsParentVisible");
                propertyValue = executeControlFunction(currentControl, "GetProperty", objInfo);

                if (checkExists(propertyValue) && propertyValue === false)
                {
                    continueChecks = false;
                }
            }

            if (continueChecks && checkExists(controlView) && controlView.length > 0)
            {
                propertyValue = testViewProperty(mainTable, "IsVisible");
                if (checkExists(propertyValue) && propertyValue === false)
                {
                    continueChecks = false;
                }
            }
            if (continueChecks && checkExists(controlPanel) && controlPanel.length > 0)
            {
                propertyValue = testPanelProperty(controlPanel, "IsVisible");
                if (checkExists(propertyValue) && propertyValue === false)
                {
                    continueChecks = false;
                }
            }

            var controlTemplate = currentControl.getAttribute("ControlTemplate");
            if (continueChecks && controlTemplate === "edit")
            {
                //see if the row is editable before including it in validation
                var isEditable = jQuery("#" + mainTable)[0].getAttribute("editable"); //we know it is an editable list if the controlTemplate is edit
                if (isEditable !== "true")
                {
                    continueChecks = false;
                }
                if (continueChecks)
                {
                    //test for visibility of column as well
                    var cell = jQuery(".grid *[id*=" + id + "]").first().closest("td");
                    if (cell.length > 0)
                    {
                        continueChecks = !cell.hasClass("hidden"); //test the visibility of the column
                    }
                }
            }
        }

        if (continueChecks === false)
        {
            return null;
        }
        var controlID = currentControl.getAttribute("ID");
        var controlName = currentControl.getAttribute("Name");
        var regExError = "";
        var requiredError = "";
        var datatypeError = "";
        var dataType = checkExists(currentControl.selectSingleNode("Properties/Property[Name='DataType']/Value")) ? currentControl.selectSingleNode("Properties/Property[Name='DataType']/Value").text : null;

        var patternObject = null;
        //crafty use of closure scope to cache the result
        var GetPatternObject = function ()
        {
            if (!checkExists(patternObject))
            {
                var controlPropertyOptions =
                    {
                        controlID: controlID,
                        propertyName: "ValidationPattern",
                        currentControl: currentControl
                    }
                var regExpPattern = returnControlPropertyValue(controlPropertyOptions);
                if (checkExists(regExpPattern) && regExpPattern.length > 0)
                {
                    var currentPattern = $sn(viewControllerDefinition, "Controllers/ValidationPatterns/ValidationPattern[@ID='" + regExpPattern + "']");
                    if (checkExists(currentPattern))
                    {
                        var validationMessage = currentPattern.getAttribute("Message");
                        patternObject =
                            {
                                regex: new RegExp(currentPattern.text),
                                message: (checkExists(controlValidationMessage) && controlValidationMessage.length > 0) ? controlValidationMessage : validationMessage
                            };
                    }
                }
            }
            return patternObject;
        };

        if (checkExists(value) && value.toString().length > 0)
        {
            if (checkExists(dataType) && dataType.toLowerCase() === 'multivalue')
            {
                var xmlValue = tryParseXML(value);
                if (!checkExists(xmlValue) || !checkExists(xmlValue.selectSingleNode('collection/object/fields/field/value')))
                {
                    value = "";
                }
            }

            if (checkExists(ExpressionItem))
            {
                var ExpressionNode = ExpressionItem.firstChild;
                var returnValue = evaluateExpression(ExpressionNode, null, null, true, null, null, loopContextID);
                if (returnValue !== true)
                {
                    errorEncountered = true;
                    regExError = locValidationExpresssionsFailed;
                }
            }
            var controlPropertyOptions =
                {
                    controlID: controlID,
                    propertyName: "ValidationMessage",
                    currentControl: currentControl
                }
            var controlValidationMessage = returnControlPropertyValue(controlPropertyOptions);

            GetPatternObject();
            if (checkExists(patternObject))
            {
                var result = patternObject.regex.test(value.toString());
                if (result !== true)
                {
                    errorEncountered = true;
                    regExError = patternObject.message;
                }
            }
            if (!errorEncountered)
            {
                var controlDef = controlInformationObject(controlID);
                dataType = controlDef.propertyType;
                if (typeof value === "string" && value.startsWith("<collection"))
                {
                    dataType = "xml";
                }
                else if (typeof value === "object") //json object
                {
                    dataType = "xml";
                }

                if (checkExists(dataType) && dataType.length > 0)
                {
                    //#region
                    var valid = false;
                    switch (dataType.toLowerCase())
                    {
                        case 'number':
                        case 'decimal':
                        case 'autonumber':
                            if (typeof value === "number" || (value.isNumeric()) || (value.isFloat()) || (!isNaN(value)))
                            {
                                valid = true;
                            }
                            break;
                        case 'yesno':
                            switch (value.toLowerCase())
                            {
                                case "true":
                                case "false":
                                case "yes":
                                case "no":
                                case "0":
                                case "1":
                                    valid = true;
                                    break;
                            }
                            break;
                        case 'datetime':
                            var dateResult = Date.parse(value);
                            if (dateResult.toString().toLowerCase() !== "nan" && dateResult.toString().toLowerCase() !== "invalid date")
                            {
                                valid = true;
                            }
                            break;
                        case 'guid':
                        case 'autoguid':
                            if (value.isValidGuid())
                            {
                                valid = true;
                            }
                            break;
                        default:
                            valid = true;
                            break;
                    }

                    if (!valid)
                    {
                        datatypeError = (checkExists(controlValidationMessage) && controlValidationMessage.length > 0) ? controlValidationMessage : Resources.Runtime.DataTypeValidationError.format(dataType === 'guid' ? dataType.toUpperCase() : dataType);
                        errorEncountered = true;
                    }
                    //#endregion
                }
            }
        }
        else if (isRequired)
        {
            //#region
            requiredError = Resources.Runtime.RequiredValidationError;
            errorEncountered = true;
            //#endregion
        }

        validationObject =
            {
                Name: controlName,
                IsRequired: (requiredError.length > 0) ? true : null,
                Pattern: (regExError.length > 0) ? regExError : null,
                DataType: (datatypeError.length > 0) ? datatypeError : null,
                CurrentControlId: controlID,
                Error: errorEncountered,
                IgnoreInvisible: ignoreInvisibleControls,
                IgnoreDisabled: ignoreDisabledControls,
                IgnoreReadOnly: ignoreReadOnlyControls,
                ValidationSettings:
                    {
                        isRequired: isRequired,
                        requiredMessage: Resources.Runtime.RequiredValidationError,
                        GetPatternObject: GetPatternObject
                    }
            };

        //#region
        switch (location)
        {
            case "Popup":
                validationObject.Name = currentControl.getAttribute("Name");
                validationObject.RequiredError = (requiredError.length > 0) ? requiredError : null;
                validationObject.IsPopup = true;
                break;
            case "Control":
                validationObject.IsPopup = false;
                break;
        }
        executeControlFunction(currentControl, "ValidationMethod", validationObject);
        //#endregion

    }
    return validationObject;
    //#endregion
}

//test panel property for validation
function testPanelProperty(panelID, propertyName)
{
    //#region
    var valid = true;
    var _currentForm = $find(currentForm);
    if (checkExists(_currentForm))
    {
        var formPanelID = _runtimeEmptyGuid + "_" + panelID;
        switch (propertyName)
        {
            case "IsVisible":
                valid = _currentForm.get_isVisible(formPanelID);
                break;
            case "IsEnabled":
                valid = _currentForm.get_isEnabled(formPanelID);
                break;
        }
    }
    return valid;
    //#endregion
}

//test view property for validation
function testViewProperty(mainTable, propertyName)
{
    //#region
    var valid = true;
    if (propertyName === "IsVisible")
    {
        valid = null;
        var view = jQuery("#" + mainTable);
        var widget = view.data("SFCWidgetName");
        if (checkExists(widget))
        {
            valid = view[widget]("option", "isVisible");
        }
        if (!checkExists(valid) && checkExists(view) && view.length === 1)
        {
            valid = (view[0].style.display !== "none" && !view.hasClass("hidden"));
        }
    }
    return valid;
    //#endregion
}

/* prompt the user for input and either continue or stop further behaviour execution */
function promptAction(currentAction, methodExecuted, behaviour)
{
    //#region
    var loopContextID = getLoopContextID(currentAction);

    var heading = currentAction.getAttribute("Heading").xmlDecode();
    var message = currentAction.getAttribute("Message").xmlDecode();
    var promptType = currentAction.getAttribute("PromptType");
    var options;
    switch (promptType)
    {
        case "Alert":
            options = {
                onClose: function ()
                {
                    removeLoopContextData({ loopContextID: loopContextID });

                    continuePromptingBehaviour(behaviour, false);
                },
                headerText: heading,
                message: message
            };
            masterPopupManager.showNotification(options);
            break;
        case "Confirmation":
            var messageIsLiteral = currentAction.getAttribute("MessageIsLiteral");
            if (checkExists(messageIsLiteral) && messageIsLiteral.toString().toLowerCase() !== "true")
            {
                message = message.htmlEncode();
            }
            options = {
                headerText: heading,
                height: 165,
                message: message,
                onAccept: function ()
                {
                    removeLoopContextData({ loopContextID: loopContextID });

                    continuePromptingBehaviour(behaviour, true);
                },
                onCancel: function ()
                {
                    cancelPromptingBehaviour(behaviour, methodExecuted, true, loopContextID);
                }
            };
            masterPopupManager.showConfirmation(options);
            break;
    }
    //#endregion
}

/* handler when prompting was done, to continue executing behaviour */
function continuePromptingBehaviour(behaviour, closePopup)
{
    //#region
    if (closePopup)
    {
        masterPopupManager.closeLast();
    }
    if (checkExists(behaviour))
    {
        behaviour.isExecuting = false;
        behaviour.executeBehaviour();//correct usage
    }
    //#endregion
}

/* handler when prompting was done, to verify if table changes need to be reverted */
function cancelPromptingBehaviour(behaviour, methodExecuted, closePopup, loopContextID)
{
    //#region
    //this is specific to editable list changes - when prompting, the changes in the table should be cancelled
    if (checkExists(behaviour) && methodExecuted.toLowerCase().startsWith("listitem") && behaviour.SourceType.toLowerCase() === "view")
    {
        var mainTable = getViewMainTable(behaviour.options.SourceID, behaviour.options.InstanceID);
        if (checkExistsNotEmpty(mainTable))
        {
            mainTable = jQuery("#" + mainTable);
            cancelItemChanges(mainTable, null, loopContextID);
        }
    }
    if (closePopup)
    {
        masterPopupManager.closeLast();
    }

    removeLoopContextData({ loopContextID: loopContextID });

    if (checkExists(behaviour)) //extra logic to handle if handlerType when using confirmation declined, although this is technically an action
    {
        behaviour.actions = []; //stops further actions from executing
        behaviour.previousHandlerResult = false; //will allow fallback to else or always or other if handler executions
        behaviour.isExecuting = false;
        behaviour.executeBehaviour();//correct usage
    }
    //#endregion
}

function addMetadata(parentNode, name, value)
{
    if (checkExists(value))
    {
        value = value.toString();

        if (checkExistsNotEmpty(value))
        {
            parentNode[name] = value;
        }
    }
    return parentNode;
}

//execute a workflow
function workflowAction(currentAction, behaviour, returnXMLPackage, runAsync)
{
    //#region
    //removed runtimeShowBusyOverlay call, since this is now applied by the sendPacket method (no overlay needed if sendPacket not called)

    var loopContextID = getLoopContextID(currentAction);

    var currentMethod = currentAction.getAttribute("Method");

    if (currentMethod.length > 0)
    {
        //wrap in brokerpackage node to be consistent with smartobject execution
        var processPacketXML = $xml("<brokerpackage></brokerpackage>");
        var brokerNode = {};
        var processNode = brokerNode.Process = {};

        //add execution variables to metadata instead of sending through as seperate variables to enable ajax calls to be more generalized
        var metadataNode = brokerNode.metadata = {};
        metadataNode = addMetadata(metadataNode, "method", currentMethod);
        metadataNode = addMetadata(metadataNode, "shareduser", getFormParameterValue("shareduser"));
        metadataNode = addMetadata(metadataNode, "manageduser", getFormParameterValue("manageduser"));

        var allocated = "true";
        if (currentMethod.toLowerCase() === "loadprocess")
        {
            if (runAsync === false) //system variable resolving
            {
                allocated = "false";
            }
            else
            {
                var workflowAllocate = currentAction.getAttribute("WorkflowAllocate");
                if (checkExists(workflowAllocate))
                {
                    allocated = workflowAllocate;
                }
            }
        }

        if (_runtimeMode === "offline") //backwards compatibility with offline forms
        {
            allocated = "false";
        }

        metadataNode = addMetadata(metadataNode, "allocated", allocated);

        var processName = currentAction.getAttribute("ProcessName");
        if (checkExists(processName))
        {
            processNode["Name"] = processName;
        }
        var serialNumber = "";

        //#region
        //create the different instances 
        var procInst = processNode.ProcessInstance = {};
        var actInst = processNode.ActivityInstanceDestination = {};
        var evInst = processNode.EventInstance = {};

        //verify parameters returned from the action
        var parameters = $mn(currentAction, "Parameters/Parameter");
        var results = $mn(currentAction, "Results/Result");
        var r = results.length;

        //loop through results and add properties
        if (r > 0)
        {
            var resultArray = [];
            while (r--)
            {
                //#region
                var currentResult = results[r];
                var resultTarget = currentResult.getAttribute("TargetID");
                var resultTargetInstanceID = currentResult.getAttribute("TargetInstanceID");
                var resultTargetType = currentResult.getAttribute("TargetType");
                var resultSourceType = currentResult.getAttribute("SourceType");
                var resultSourceID = currentResult.getAttribute("SourceID");
                var resultSourceInstanceID = currentResult.getAttribute("SourceInstanceID");
                var resultSourceValue = "";

                var resultValue = { targetID: resultTarget, targetType: resultTargetType, sourceType: resultSourceType, sourceID: resultSourceID, sourceInstanceID: resultSourceInstanceID, targetInstanceID: resultTargetInstanceID };
                if (checkExistsNotEmpty(resultSourceValue))
                {
                    resultValue.sourceValue = resultSourceValue;
                }
                resultArray.push(resultValue);
            }
            processNode.Results = resultArray;
        }

        //#region
        //loop through parameters and add properties
        var p = parameters.length;
        while (p--)
        {
            var paramNode = parameters[p];
            var targetType = paramNode.getAttribute("TargetType");
            var target = paramNode.getAttribute("TargetID");
            var targetPath = paramNode.getAttribute("TargetPath");
            if (targetType === "ProcessItemReference" && paramNode.getAttribute("SourceType") === "ViewSource" && (currentMethod.toLowerCase() === "startprocess" || currentMethod.toLowerCase() === "actionprocess"))
            {
                var sourceSubformID = paramNode.getAttribute("SourceSubFormID");
                if (checkExistsNotEmptyGuid(sourceSubformID))
                {
                    paramNode = populateSubformContext(paramNode, sourceSubformID);
                }
                else
                {
                    sourceSubformID = paramNode.getAttribute("SourceTransferredID");
                }
                var sourceRuntimeContextID = paramNode.getAttribute("SourceRuntimeContextID");
                var DataSourceID = paramNode.getAttribute("SourceID");
                var InstanceID = paramNode.getAttribute("SourceInstanceID");

                var findOptions =
                    {
                        instanceID: InstanceID,
                        dataSourceID: DataSourceID,
                        transferredID: sourceSubformID,
                        runtimeContextID: sourceRuntimeContextID
                    };
                var instanceObj = findCorrectInstanceForDataTransfer(findOptions);
                var windowToUse = instanceObj.WindowToUse;
                var viewDef = windowToUse.getViewDefinition(null, InstanceID, DataSourceID);
                if (checkExists(viewDef))
                {
                    //information needed for execution
                    //#region
                    var ViewID = viewDef.getAttribute("ID");
                    var viewType = viewDef.getAttribute("TypeView").toLowerCase();
                    var currentDataSource = $sn(viewDef, "Fields/Field[@DataSourceID='" + DataSourceID + "']"); //first field is fine
                    var ObjectID = currentDataSource.getAttribute("ObjectID");
                    var ContextID = currentDataSource.getAttribute("ContextID");
                    var ContextType = currentDataSource.getAttribute("ContextType");
                    var MainTable = viewDef.getAttribute("MainTable");

                    var counter = null;
                    var isEditable = getViewProperty(viewDef, "ListEditable");
                    if (viewType === "list")
                    {
                        if (!checkExistsNotEmpty(isEditable))
                        {
                            counter = windowToUse.getLoopContextData({ loopContextID: loopContextID, viewID: ViewID, instanceID: InstanceID }).counter;

                            if (!checkExists(counter))
                            {
                                counter = windowToUse.getViewSelectedCounter(MainTable);
                            }
                        }
                        //removed for compatibility purposes with SP for bug 757082 - this is due to incorrect rule usage
                        //it might cause rogue records, but this is the least impact fix for the release
                        //else
                        //{
                        //    counter = true;//for editable lists only return the counter values (not the empty row)
                        //}
                    }

                    //get all the information in the hidden fields for this view
                    var viewProperties = [];
                    var ControlID = null;
                    if (ContextType.toLowerCase() === "association")
                    {
                        var isAssoc = new windowToUse.dataSourceLookup({ xmlDoc: viewDef, includeControllers: false, includeController: false, contextID: ContextID, contextType: ContextType }).getDataSource();
                        if (checkExists(isAssoc))
                        {
                            ControlID = isAssoc.getAttribute("SourceControlID");
                            var getControlValueObject =
                                {
                                    controlID: ControlID
                                }
                            var controlValue = windowToUse.getControlValue(getControlValueObject);
                            if (checkExistsNotEmpty(controlValue))
                            {
                                var valuePropertyName = isAssoc.getAttribute("ValueProperty");
                                var controlValues = windowToUse.getCombinedHiddenPropertyCollection(ViewID, ObjectID, null, null, ControlID, counter, null, ContextID, ContextType, InstanceID);
                                var vp = controlValues.length;
                                for (var v = 0; v < vp; v++)
                                {
                                    if (controlValues[v].fields[valuePropertyName].value === controlValue)
                                    {
                                        viewProperties.push(controlValues[v]);
                                        counter = controlValues[v].counter;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    else
                    {
                        ControlID = false;
                        viewProperties = windowToUse.getCombinedHiddenPropertyCollection(ViewID, ObjectID, null, null, ControlID, counter, null, ContextID, ContextType, InstanceID);
                    }

                    var collections = [];
                    var v = viewProperties.length;
                    if (v > 0)
                    {
                        var clonedCollection = [];
                        while (v--)
                        {
                            var includeCounter = checkExistsNotEmpty(isEditable) ? null : false;
                            var clonedItem = jsonCopyAndExtendObject(viewProperties[v], includeCounter);
                            delete clonedItem.pagenumber;                            
                            clonedCollection.unshift(clonedItem);
                        }
                        collections.push({ collection: clonedCollection });
                    }

                    var viewParameters = windowToUse.getHiddenParameterCollection(ViewID);
                    v = viewParameters.length;
                    if (v > 0)
                    {
                        var clonedCollection = [];
                        while (v--)
                        {
                            var clonedItem = jsonCopyAndExtendObject(viewParameters[v], false);
                            delete clonedItem.method;//this returns a bool and not the string method expected
                            clonedItem.fields = clonedItem.parameters;//it would have been renamed in the previous xml version for execution
                            delete clonedItem.parameters;
                            clonedCollection.unshift(clonedItem);
                        }
                        collections.push({ collection: clonedCollection });
                    }
                    //#endregion

                    //construct item reference base
                    //#region
                    var itemReferences = procInst.itemReferences;
                    if (!checkExists(itemReferences))
                    {
                        itemReferences = procInst.itemReferences = [];
                    }
                    var itemReference = itemReferences[target];
                    if (!checkExists(itemReference))
                    {
                        itemReference = {};
                        itemReference["name"] = target;
                        itemReferences.push(itemReference);
                    }
                    itemReference["objectid"] = ObjectID; //add this to match serverside
                    //adding additional attributes to help with the replacement of item reference values on server side after batched smartobject execution
                    itemReference["viewid"] = ViewID;
                    if (checkExistsNotEmpty(ControlID))
                    {
                        itemReference["controlid"] = ControlID.toString();
                    }
                    itemReference["contextid"] = ContextID;
                    itemReference["contexttype"] = ContextType;
                    if (checkExistsNotEmpty(InstanceID))
                    {
                        itemReference["instanceid"] = InstanceID;
                    }
                    itemReference.collections = collections;
                    //#endregion
                }
                else
                {
                    //show message
                    if (checkExists(behaviour))
                    {
                        behaviour.handleError("itemref", null, null, null, null, loopContextID);
                    }
                    else
                    {
                        //default failsafe
                        masterPopupManager.showError(Resources.RuntimeMessages.WorkflowItemReferenceNotFound);
                    }
                    return;
                }
            }
            else
            {
                var sourceValue = "";
                var multipleValues;
                var clonedParameter = parameters[p].cloneNode(true);

                //keep multiple source values seperate inside brokerpackage to enable server side resolution of values influenced by prior executions
                if (checkExists(returnXMLPackage) && returnXMLPackage === true && (clonedParameter.getAttribute("SourceType") === "Value") && (checkExists($sn(clonedParameter, "SourceValue/*[@SourceType='ViewField']"))))
                {
                    multipleValues = determineMultiValueMapping(clonedParameter, loopContextID, behaviour, processNode);
                    if (multipleValues.length === 1 && typeof (multipleValues[0]) === "string")
                    {
                        sourceValue = multipleValues[0];
                        multipleValues = null;
                    }
                    else if (multipleValues.length === 0)
                    {
                        sourceValue = null;
                    }
                    else
                    {
                        sourceValue = multipleValues;
                    }
                }
                else
                {
                    sourceValue = returnSourceValue({ item: clonedParameter, customProcessData: processNode, loopContextID: loopContextID, behaviour: behaviour });
                    //empty but this can be a result later if batched
                    if (checkExists(returnXMLPackage) && returnXMLPackage === true && !checkExistsNotEmpty(sourceValue) && clonedParameter.getAttribute("SourceType") == "ViewField")
                    {
                        sourceValue = [];
                        var valueJson = {
                            sourceType: clonedParameter.getAttribute("SourceType"),
                            sourceId: clonedParameter.getAttribute("SourceID"),
                            sourcePath: clonedParameter.getAttribute("SourcePath"),
                            sourceInstanceID: clonedParameter.getAttribute("SourceInstanceID"),
                            sourceSubFormID: clonedParameter.getAttribute("SourceSubFormID")
                        };
                        sourceValue.push(valueJson);
                    }
                }

                if (checkExists(sourceValue))
                {
                    var setFieldOptions = {
                        target: target,
                        processNode: processNode,
                        targetPath: targetPath,
                        sourceValue: sourceValue
                    };

                    switch (targetType)
                    {
                        case "WorkflowProcessProperty":
                            //#region
                            procInst[target] = sourceValue;
                            if (target === "SerialNumber")
                            {
                                serialNumber = sourceValue;
                            }
                            break;
                        //#endregion
                        case "WorkflowActivityProperty":
                            //#region
                            actInst[target] = sourceValue;
                            break;
                        //#endregion
                        case "WorkflowEventProperty":
                            //#region
                            evInst[target] = sourceValue;
                            break;
                        //#endregion
                        case "WorkflowProcessDataField":
                            //#region
                            setFieldOptions.instanceXP = "ProcessInstance";
                            setFieldOptions.fieldsXP = "DataFields";
                            setFieldOptions.fieldXP = "DataField";
                            setFieldOptions.instance = procInst;
                            procInst = setWorkflowField(setFieldOptions);
                            break;
                        //#endregion
                        case "WorkflowActivityDataField":
                            //#region
                            setFieldOptions.instanceXP = "ActivityInstanceDestination";
                            setFieldOptions.fieldsXP = "DataFields";
                            setFieldOptions.fieldXP = "DataField";
                            setFieldOptions.instance = actInst;
                            actInst = setWorkflowField(setFieldOptions);
                            break;
                        //#endregion
                        case "WorkflowProcessXmlField":
                            //#region
                            setFieldOptions.instanceXP = "ProcessInstance";
                            setFieldOptions.fieldsXP = "XMLFields";
                            setFieldOptions.fieldXP = "XMLField";
                            setFieldOptions.instance = procInst;
                            procInst = setWorkflowField(setFieldOptions);
                            break;
                        //#endregion
                        case "WorkflowActivityXmlField":
                            //#region
                            setFieldOptions.instanceXP = "ActivityInstanceDestination";
                            setFieldOptions.fieldsXP = "XMLFields";
                            setFieldOptions.fieldXP = "XMLField";
                            setFieldOptions.instance = actInst;
                            actInst = setWorkflowField(setFieldOptions);
                            break;
                        //#endregion
                    }
                }
            }
        }
        //#endregion
        //#endregion


        if (currentMethod.toLowerCase() === "loadprocess")
        {
            var type = "processname";
            var value = "";
            if (checkExists(serialNumber) && serialNumber.length > 0)
            {
                type = "sn";
                value = serialNumber;
            }
            if (checkExists(processName) && processName.length > 0)
            {
                value = processName;
            }

            metadataNode = addMetadata(metadataNode, "type", type);
            metadataNode = addMetadata(metadataNode, "value", value);

            if (checkExists(returnXMLPackage) && (returnXMLPackage === true))
            {
                return brokerNode;
            }
            else
            {
                if (value.length > 0)
                {
                    var jsonObjectArray = [brokerNode];
                    return sendPacket(jsonObjectArray, behaviour, [currentAction], runAsync);
                }
                else
                {
                    masterPopupManager.showWarning(Resources.RuntimeMessages.WorkflowNotLoaded);
                }
            }
        }
        else if (currentMethod.toLowerCase() === "actionprocess" || currentMethod.toLowerCase() === "startprocess")
        {
            if (checkExists(returnXMLPackage) && (returnXMLPackage === true))
            {
                return brokerNode;
            }
            else
            {
                var jsonObjectArray = [brokerNode];
                return sendPacket(jsonObjectArray, behaviour, [currentAction]);
            }
        }
    }
    else
    {
        endActionExecution({ loopContextID: loopContextID, behaviour: behaviour });
    }
    //#endregion
}

//set the values of workflow type fields inside a brokerpackage
function setWorkflowField(options)
{
    options = checkExists(options) ? options : {};

    var processNode = options.processNode;

    var fields = options.instance[options.fieldsXP];
    if (!checkExists(fields))
    {
        fields = options.instance[options.fieldsXP] = {};
    }

    if (!checkExists(options.targetPath))
    {
        fields[options.target] = options.sourceValue; //implicit value population
    }
    else
    {
        /*******note Task 373416/feature 718218 *************
        currently XML fields are not fully implemented in the designers
        the use of targetpath to update a specific node in the xml field is an idea that can be investigated as that was the plan originally,
        but the changes to the structures and more complex usage of rules resulted in the previous code being invalid */

        fields[options.target] = options.sourceValue; //implicit value population
    }

    return options.instance;
}

//replace subformIDs with TransferredIDs and other relevant attribute resetting before opening subforms
function PrepareNavigationTransferredEvents(originalXml, subFormID, runtimeContextID, parentRuntimeContextID, parentRuntimeSubformID, isOpeningSubView)
{
    //#region
    var parentNode = null;
    var returnNode = false;
    if (checkExists(originalXml) && originalXml.nodeType === 1)
    {
        if (checkExists(parentNode))
        {
            // Remove the node from it's document to process in isolation without modifying it's document nodes in global searches.
            parentNode = originalXml.parentNode;
            parentNode.removeChild(originalXml);
        }

        originalXml = originalXml.xml;
        returnNode = true;
    }

    var adjustedXmlDoc = $xml("<r>" + originalXml + "</r>");

    // Current Level Events and Actions -- Record current context information
    var nodesToAdjust = $mn(adjustedXmlDoc,
        '//Event[not(@SubformID)][not(@RuntimeContextID)][not(@TransferredID)] | ' +
        '//Action[not(@SubformID)][not(@RuntimeContextID)][not(@TransferredID)]');
    for (var i = 0; i < nodesToAdjust.length; i++)
    {
        var currentNode = nodesToAdjust[i];

        // We skip hard-coding it to the parent's context because it's a Behavior Context Action.
        if (!SourceCode.Forms.Runtime.Navigation.isBehaviorContextAction(currentNode))
        {
            currentNode.setAttribute("RuntimeContextID", parentRuntimeContextID);
            currentNode.setAttribute("TransferredID", parentRuntimeSubformID);
        }
    }

    // General Adjustments -- Events and Actions
    nodesToAdjust = $mn(adjustedXmlDoc, "//*[@SubformID]");
    for (var i = 0; i < nodesToAdjust.length; i++)
    {
        var currentNode = nodesToAdjust[i];
        var subformID = currentNode.getAttribute("SubformID");

        // Local context on the subform
        if (subformID === subFormID)
        {
            // We skip hard-coding it to the Subform context because it's a Behavior Context Action.
            if (!SourceCode.Forms.Runtime.Navigation.isBehaviorContextAction(currentNode))
            {
                SourceCode.Forms.Runtime.Navigation.convertSubformNode(currentNode, subformID, runtimeContextID, isOpeningSubView);
            }
        }
    }

    // Current Level Parameters, Results, and Sources -- Record current context information
    nodesToAdjust = $mn(adjustedXmlDoc,
        '//Parameter[not(@SourceSubFormID)][not(@SourceRuntimeContextID)][not(@SourceTransferredID)][not(@SourceType = "Value")] | ' +
        '//Result[not(@SourceSubFormID)][not(@SourceRuntimeContextID)][not(@SourceTransferredID)][not(@SourceType = "Value")] | ' +
        '//Source[not(@SourceSubFormID)][not(@SourceRuntimeContextID)][not(@SourceTransferredID)][not(@SourceType = "Value")] | ' +
        '//Condition//Item[not(@SourceSubFormID)][not(@SourceRuntimeContextID)][not(@SourceTransferredID)][not(@SourceType = "Value")]');
    for (var i = 0; i < nodesToAdjust.length; i++)
    {
        var currentNode = nodesToAdjust[i];
        currentNode.setAttribute("SourceRuntimeContextID", parentRuntimeContextID);
        currentNode.setAttribute("SourceTransferredID", parentRuntimeSubformID);
    }

    nodesToAdjust = $mn(adjustedXmlDoc,
        "//Parameter[not(@TargetSubFormID)][not(@TargetRuntimeContextID)][not(@TargetTransferredID)] | " +
        "//Result[not(@TargetSubFormID)][not(@TargetRuntimeContextID)][not(@TargetTransferredID)]");
    for (var i = 0; i < nodesToAdjust.length; i++)
    {
        var currentNode = nodesToAdjust[i];
        currentNode.setAttribute("TargetRuntimeContextID", parentRuntimeContextID);
        currentNode.setAttribute("TargetTransferredID", parentRuntimeSubformID);
    }

    // General Adjustments -- Parameters, Results, and Sources
    nodesToAdjust = $mn(adjustedXmlDoc, "//Action//*[@SourceSubFormID]");
    for (var i = 0; i < nodesToAdjust.length; i++)
    {
        var currentNode = nodesToAdjust[i];
        var subformID = currentNode.getAttribute("SourceSubFormID");

        // Local context on the subform
        if (subformID === subFormID)
        {
            SourceCode.Forms.Runtime.Navigation.convertSourceSubformNode(currentNode, subformID, runtimeContextID);
        }
    }

    nodesToAdjust = $mn(adjustedXmlDoc, "//*[@TargetSubFormID]");
    for (var i = 0; i < nodesToAdjust.length; i++)
    {
        var currentNode = nodesToAdjust[i];
        var subformID = currentNode.getAttribute("TargetSubFormID");

        // Local context on the subform
        if (subformID === subFormID)
        {
            SourceCode.Forms.Runtime.Navigation.convertTargetSubformNode(currentNode, subformID, runtimeContextID);
        }
    }

    //real time resolving of parent level values, not just the static value upon opening
    nodesToAdjust = $mn(adjustedXmlDoc, "//Condition//Item[@SourceType!='Value'][not(@SourceSubFormID)][not(@SourceOriginalLevel)]");
    for (var ni = 0; ni < nodesToAdjust.length; ni++)
    {
        var node = nodesToAdjust[ni];
        node.setAttribute("SourceOriginalLevel", __runtimeFormLevel);
    }

    if (returnNode === false)
    {
        var adjustedXml = "";
        for (var ni = 0; ni < adjustedXmlDoc.documentElement.childNodes.length; ni++)
        {
            adjustedXml += adjustedXmlDoc.documentElement.childNodes[ni].xml;
        }

        return adjustedXml;
    }
    else
    {
        var clonedNode = adjustedXmlDoc.documentElement.childNodes[0].cloneNode(true);

        if (checkExists(parentNode))
        {
            // Only one node was passed through as a parameter. Insert back into original XML document.
            parentNode.appendChild(clonedNode);
        }

        return clonedNode;
    }
    //#endregion
}

function getWindowToNavigateTo()
{
    var windowToNavigateTo = null;
    var popupToUse = null;

    var currentRuntimeFormLevel = parseInt(window.__runtimeFormLevel, 10);

    if (currentRuntimeFormLevel > 0)
    {
        popupToUse = SourceCode.Forms.Runtime.getTopNonClosingRuntimeInstancePopup(currentRuntimeFormLevel);
    }

    if (checkExists(popupToUse))
    {
        var runtimePopupIframe = popupToUse.controls.body.find("iframe.runtime-popup");
        windowToNavigateTo = SourceCode.Forms.Runtime.getPopupIframeContentWindow(runtimePopupIframe);
    }

    if (!checkExists(windowToNavigateTo))
    {
        windowToNavigateTo = SourceCode.Forms.Runtime.getMasterRuntimeWindow();
    }

    return windowToNavigateTo;
}

function IsViewAction(currentAction)
{
    return getNodeAttribute("FormID", currentAction, null, checkExistsNotEmptyGuid) === null;
}

//navigate to a specific form or url - form parameters will be passed through as querystring values, actions will be passed too if required
function navigateAction(currentAction, includeAction, behaviour, postData, navigateOnly, closeBehaviour)
{
    //#region
    var windowToNavigateTo = getWindowToNavigateTo();

    var loopContextID = getLoopContextID(currentAction);

    var newURL = "";
    var currentActionID = currentAction.getAttribute("ID");
    var formID = currentAction.getAttribute("FormID");
    var viewID = currentAction.getAttribute("ViewID");
    var actionInstanceID = getNodeAttribute("OrigInstanceID", currentAction, currentAction.getAttribute("InstanceID"), checkExists);
    var URL = currentAction.getAttribute("Url");
    var SubformID = getNodeAttribute("SubformID", currentAction, currentAction.getAttribute("TransferredID"), checkExists);
    var navigationTarget = "_self";
    var removeInstanceID = false;
    if (!checkExists(postData))
    {
        postData = "";
    }
    var usePopups = false;
    if (currentAction.getAttribute("Type") === "Open" || currentAction.getAttribute("OldType") === "Open" || currentAction.getAttribute("Type") === "Popup" || currentAction.getAttribute("OldType") === "Popup")
    {
        usePopups = true;
    }
    var targetNode = $sn(currentAction, "Target");
    if (checkExists(targetNode))
    {
        navigationTarget = returnSourceValue({ item: targetNode, loopContextID: loopContextID, behaviour: behaviour });
        if (!checkExists(navigationTarget) || navigationTarget.length === 0)
        {
            navigationTarget = "_self";
        }
    }

    if (checkExists(formID))
    {
        if (currentAction.getAttribute("Type") === "Focus" || currentAction.getAttribute("OldType") === "Focus")
        {
            currentAction.removeAttribute("FormID");
        }
        if (currentAction.getAttribute("VanityURL"))
        {
            newURL = windowToNavigateTo.document.getElementById("CurrentURL").value.replace("View.aspx", "Form.aspx").replace("Form.aspx", currentAction.getAttribute("VanityURL")) + "?";
        }
        else
        {
            newURL = windowToNavigateTo.document.getElementById("CurrentURL").value.replace("View.aspx", "Form.aspx") + "?_ID=" + formID;
        }
        if (windowToNavigateTo._debug)
        {
            newURL += "&_debug=" + windowToNavigateTo._debug;
        }
    }
    else if (checkExists(URL))
    {
        newURL = URL;
        if (!checkExists(navigateOnly)) //only set from message action
        {
            //Add parameters for url
            var parameters = $mn(currentAction, "Parameters/Parameter");
            if (checkExists(parameters) && parameters.length > 0)
            {
                var baseURL = newURL;
                var params = "", dialogoptions = [];
                //#region
                //loop through parameters and add properties
                var p = parameters.length;
                while (p--)
                {
                    var currentParam = parameters[p];
                    var targetType = currentParam.getAttribute("TargetType");
                    var target = currentParam.getAttribute("TargetID");
                    var sourceValue = returnSourceValue({ item: currentParam, loopContextID: loopContextID, behaviour: behaviour });

                    if (target === "")
                    {
                        continue;
                    }
                    if (target === "baseurl")
                    {
                        baseURL = sourceValue;
                        continue;
                    }

                    if (sourceValue.length > 0)
                    {
                        if (targetType === "Value")
                        {
                            var number;
                            var unit;
                            switch (target.toLowerCase())
                            {
                                case "browsernavigatedialogwidth":
                                    number = parseInt(sourceValue, 10);
                                    if (!isNaN(number))
                                    {
                                        unit = sourceValue.match(/^(\d*)(px|%)?$/);

                                        if (unit[2] && unit[2] === "%")
                                        {
                                            dialogoptions.push("dialogWidth: " + ((windowToNavigateTo.screen.availWidth * number) / 100) + "px");
                                        }
                                        else
                                        {
                                            dialogoptions.push("dialogWidth: " + number + "px");
                                        }
                                    }
                                    break;
                                case "browsernavigatedialogheight":
                                    number = parseInt(sourceValue, 10);
                                    if (!isNaN(number))
                                    {
                                        unit = sourceValue.match(/^(\d*)(px|%)?$/);

                                        if (unit[2] && unit[2] === "%")
                                        {
                                            dialogoptions.push("dialogHeight: " + ((windowToNavigateTo.screen.availHeight * number) / 100) + "px");
                                        }
                                        else
                                        {
                                            dialogoptions.push("dialogHeight: " + number + "px");
                                        }
                                    }

                                    break;
                                case "browsernavigatedialogleft":
                                    number = parseInt(sourceValue, 10);
                                    if (!isNaN(number))
                                    {
                                        dialogoptions.push("dialogLeft: " + number + "px");
                                    }
                                    break;
                                case "browsernavigatedialogtop":
                                    number = parseInt(sourceValue, 10);
                                    if (!isNaN(number))
                                    {
                                        dialogoptions.push("dialogTop: " + number + "px");
                                    }
                                    break;
                                case "browsernavigatedialogresizable":
                                    dialogoptions.push("resizable: " + sourceValue);
                                    break;
                                case "browsernavigatedialogcenter":
                                    dialogoptions.push("center: " + sourceValue);
                                    break;
                                case "browsernavigatedialogstatus":
                                    dialogoptions.push("status: " + sourceValue);
                                    break;
                                default:
                                    if (params.length > 0)
                                    {
                                        params += "&";
                                    }
                                    params += target + "=" + sourceValue;
                                    break;
                            }
                        }
                    }
                }
                if (params.length > 0)
                {
                    params = "?" + params;
                }
                newURL = baseURL + params;

                if (dialogoptions.length > 0)
                {
                    postData = dialogoptions.join(";");
                }

                if (!newURL.test(stringRegularExpressions.isValidURL)) //test if the URL is invalid via the regex, and warn the user. Still have the option to continue, though
                {
                    var encodedURL = newURL.htmlEncode();
                    var options = {
                        headerText: Resources.RuntimeMessages.InvalidURLWarningHeader,
                        message: Resources.RuntimeMessages.InvalidURLWarningText.format(encodedURL),
                        onAccept: function ()
                        {
                            masterPopupManager.closeLast();
                            //try and catch added specifically for IE error
                            //https://stackoverflow.com/questions/1886547/access-is-denied-javascript-error-when-trying-to-access-the-document-object-of 
                            try
                            {
                                if (checkExists(windowToNavigateTo.frameElement))
                                {
                                    $(windowToNavigateTo.frameElement).addClass("navigated");
                                }
                            }
                            catch (ex)
                            {

                            }
                            windowToNavigateTo.framePosting(navigationTarget, newURL, postData, navigateOnly);
                        }
                    };
                    masterPopupManager.showConfirmation(options);
                    return;
                }

                //#endregion
            }
            navigateOnly = true;
        }
    }
    else if (checkExists(viewID))
    {
        newURL = windowToNavigateTo.document.getElementById("CurrentURL").value.replace("Form.aspx", "View.aspx") + "?_ID=" + viewID;
        removeInstanceID = true;
        if (windowToNavigateTo._debug)
        {
            newURL += "&_debug=" + windowToNavigateTo._debug;
        }

        //Checks if the parent form contains the runtime parameters for the shared and managed users
        var formRuntimeSharedUserParameter = getFormParameterValue("shareduser");
        if (checkExistsNotEmpty(formRuntimeSharedUserParameter)) {
            newURL += "&shareduser=" + formRuntimeSharedUserParameter;
        }
        var formRuntimeManagedUserParameter = getFormParameterValue("manageduser");
        if (checkExistsNotEmpty(formRuntimeManagedUserParameter)) {
            newURL += "&manageduser=" + formRuntimeManagedUserParameter;
        }
    }

    if (windowToNavigateTo._runtimeMode != null && windowToNavigateTo._runtimeMode.toUpperCase() === "OFFLINE")
    {
        if (newURL.indexOf("?") > 0)
        {
            newURL += "&";
        }
        else
        {
            newURL += "?";
        }
        newURL += "_mode=offline";
    }

    var extraActionXml = "";
    var runtimeContextID = String.generateGuid();
    var workflowStripPos = null;

    // Make it zero based and masterwindow counts 1 already.
    var level = SourceCode.Forms.Runtime.getRuntimeDataKeys(function (prop)
    {
        return prop.indexOf("_windowContext") + 14 === prop.length;
    }).length - 1;

    if (!navigateOnly)
    {
        if (includeAction)
        {
            var formParameterValues = populateParameterValuesForNavigation(currentAction, true, !usePopups, removeInstanceID, false, loopContextID, behaviour);
            if (checkExistsNotEmpty(formParameterValues))
            {
                newURL += formParameterValues;
            }

            populateFilterValuesForNavigation(currentAction, true, removeInstanceID, null, loopContextID, !usePopups, behaviour);
            extraActionXml = currentAction.xml;
        }

        if (checkExists(behaviour))
        {
            if (behaviour.actions.length > 0)
            {
                //add extra actions to be executed once popup is opened - if the behaviour has extra actions
                while (behaviour.actions.length > 0)
                {
                    var otherAction = behaviour.actions.shift();
                    var otherLoopContextID = getLoopContextID(otherAction);
                    populateParameterValuesForNavigation(otherAction, true, !usePopups, removeInstanceID, true, otherLoopContextID, behaviour);
                    populateFilterValuesForNavigation(otherAction, true, removeInstanceID, null, otherLoopContextID, !usePopups, behaviour);
                    extraActionXml += otherAction.xml;
                }
            }

            if (behaviour.handlers.length > 0)
            {
                extraActionXml += extractHandlerLogicForNavigation(behaviour.handlers, removeInstanceID, currentAction.getAttribute("OriginalEventType"), behaviour.closeEvent, !usePopups, behaviour);
            }
        }

        if (extraActionXml.length > 0)
        {
            extraActionXml = PrepareNavigationTransferredEvents(extraActionXml, SubformID, runtimeContextID, __runtimeContextID, __runtimeSubformID, IsViewAction(currentAction));
            postData += setFrameVariable("_Actions", extraActionXml);

            // WorkflowStrip Rendering
            if (checkExistsNotEmpty(extraActionXml))
            {
                var actionUpperCase = extraActionXml.toUpperCase();
                if (actionUpperCase.indexOf('WORKFLOWSTRIPLOCATION="TOP"') > -1)
                {
                    workflowStripPos = "top";
                }
                else if (actionUpperCase.indexOf('WORKFLOWSTRIPLOCATION="BOTTOM"') > -1)
                {
                    workflowStripPos = "bottom";
                }
            }
        }
    }

    if (usePopups)
    {
        //only send on theme when using subforms, not for navigation (bug 391881)
        //the current form/view will contain the theme if applicable, no need to inspect parent
        //had an issue in sharepoint when trying to access window.parent, but the logic was flawed anyway
        if (windowToNavigateTo.jQuery("#Theme").length > 0)
        {
            postData += setFrameVariable("_THEME", windowToNavigateTo.jQuery("#Theme").val());
        }

        if (windowToNavigateTo.jQuery("#StyleProfile").length > 0)
        {
            postData += setFrameVariable("_STYLEPROFILE", windowToNavigateTo.jQuery("#StyleProfile").val());
        }

        var heading = currentAction.getAttribute("Heading").xmlDecode();

        var percentageSize = 9;
        var popupCssClass = "id-runtime-dialog";

        if (checkExists(viewID))
        {
            percentageSize = 8;
        }

        if (checkExists(formID) || checkExists(viewID))
        {
            // Css Class for dialog
            popupCssClass += checkExists(formID) ? " sub-form" : " sub-view";

            var events = extractNavigatedEvents(SubformID, actionInstanceID, null);
            if (events.length > 0)
            {
                events = PrepareNavigationTransferredEvents(events, SubformID, runtimeContextID, __runtimeContextID, __runtimeSubformID, IsViewAction(currentAction));
                if (checkExistsNotEmpty(events))
                {
                    postData += setFrameVariable("_NavigateEvents", events);

                    // WorkflowStrip Rendering
                    var eventsUpperCase = events.toUpperCase();
                    if (eventsUpperCase.indexOf('WORKFLOWSTRIPLOCATION="TOP"') > -1)
                    {
                        workflowStripPos = "top";
                    }
                    else if (eventsUpperCase.indexOf('WORKFLOWSTRIPLOCATION="BOTTOM"') > -1)
                    {
                        workflowStripPos = "bottom";
                    }

                    //ServerPreRender event that was added, extended or overridden from parent
                    var indexOfServerLoad = eventsUpperCase.indexOf("<NAME>SERVERPRERENDER</NAME>");
                    if (indexOfServerLoad > -1)
                    {
                        postData += setFrameVariable("_NAVIGATEDSERVEREVENTS", "true");
                    }
                }
            }
        }
        // Reserve the dictionary keys so that we can accurately determine the level before the iframe has loaded and initialized especially when opening subForms in a batch.
        var newInstanceName = SourceCode.Forms.Runtime.getRuntimeInstanceName({ __runtimeContextID: runtimeContextID, __runtimeSubformID: SubformID });
        SourceCode.Forms.Runtime.setRuntimeDataProperty(newInstanceName, "windowContextValid", false);
        SourceCode.Forms.Runtime.setRuntimeDataProperty(newInstanceName, "windowContext", null);
        var popupID = level + 1;

        postData += setFrameVariable("_ActionID", currentActionID);
        postData += setFrameVariable("_Level", popupID);
        postData += setFrameVariable("_RuntimeContextID", runtimeContextID);
        postData += setFrameVariable("_ParentRuntimeContextID", __runtimeContextID);
        postData += setFrameVariable("_SubformID", SubformID);
        postData += setFrameVariable("_ParentSubformID", __runtimeSubformID);

        // WorkflowStip Rendering
        // WorkflowStip Actions can only be defined on SubForm/View levels so setting this variable in the popup code-path only should be sufficient.
        if (checkExistsNotEmpty(workflowStripPos))
        {
            postData += setFrameVariable("_RENDERWORKFLOWSTRIP", workflowStripPos);
        }

        //#region
        var iframeName = currentAction.getAttribute("ID") + "_" + popupID.toString();
        var windowToUse = SourceCode.Forms.Runtime.getMasterRuntimeWindow();
        var $document = jQuery(windowToUse);
        var controlHeight = 0;
        var controlWidth = 0;
        var popupSize = currentAction.getAttribute("PopupSize");
        var subformWidth = currentAction.getAttribute("SubformWidth");
        var subformHeight = currentAction.getAttribute("SubformHeight");
        var subformVerticalAlign = currentAction.getAttribute("SubformVerticalAlign");
        var documentHeight = $document.height();
        var documentWidth = $document.width();

        if (checkExists(popupSize))
        {
            var lowerCaseSize = popupSize.toLowerCase();
            if (lowerCaseSize === "small")
            {
                controlHeight = 200;
                controlWidth = 400;
            }
            else
            {
                if (lowerCaseSize === "medium")
                {
                    percentageSize = 5;
                }
                controlHeight = Math.floor(documentHeight / 10 * percentageSize);
                controlWidth = Math.floor(documentWidth / 10 * percentageSize);
            }
        }

        if (controlWidth === 0 && checkExists(subformWidth))
        {
            if (subformWidth.contains("<Source"))
            {
                subformWidth = windowToUse.returnSourceValue({ item: parseXML("<Item><SourceValue>{0}</SourceValue></Item>".format(subformWidth)).documentElement, loopContextID: loopContextID });
            }
            else
            {
                var widthNode = parseXML("<width>{0}</width>".format(subformWidth)).documentElement;
                subformWidth = (widthNode.text).trim();
            }

            if (!subformWidth.replace(stringRegularExpressions.unitDimention, "").isNumeric()) //garbage detector
            {
                controlWidth = Math.floor(documentWidth / 10 * percentageSize);
            }
            else if (subformWidth.contains("%")) //percentage detector
            {
                controlWidth = Math.floor(documentWidth * parseFloat(subformWidth) / 100);
            }
            else
            {
                controlWidth = parseFloat(subformWidth);
            }
        }

        if (checkExists(subformVerticalAlign))
        {
            if (subformVerticalAlign.contains("<Source"))
            {
                subformVerticalAlign = windowToUse.returnSourceValue({ item: parseXML("<Item><SourceValue>{0}</SourceValue></Item>".format(subformVerticalAlign)).documentElement, loopContextID: loopContextID });
            }
            else
            {
                var verticalAlignNode = parseXML("<verticalAlign>{0}</verticalAlign>".format(subformVerticalAlign)).documentElement;
                subformVerticalAlign = (verticalAlignNode.text).trim();
            }
            if (checkExistsNotEmpty(subformVerticalAlign))
            {
                switch (subformVerticalAlign.toLowerCase())
                {
                    case 'middle':
                    case 'auto':
                        subformVerticalAlign = subformVerticalAlign.toLowerCase();
                        break;
                    default:
                        subformVerticalAlign = null;
                }
            }
            else
            {
                subformVerticalAlign = null;
            }
       }

        if (controlHeight === 0 && checkExists(subformHeight))
        {
            if (subformHeight.contains("<Source")) {
                subformHeight = windowToUse.returnSourceValue({ item: parseXML("<Item><SourceValue>{0}</SourceValue></Item>".format(subformHeight)).documentElement, loopContextID: loopContextID });
            }
            else {
                var heightNode = parseXML("<height>{0}</height>".format(subformHeight)).documentElement;
                subformHeight = (heightNode.text).trim();
            }

            if (!subformHeight.replace(stringRegularExpressions.unitDimention, "").isNumeric()) //garbage detector
            {
                controlHeight = Math.floor(documentHeight / 10 * percentageSize);
            }
            else if (subformHeight.contains("%")) //percentage detector
            {
                controlHeight = Math.floor(documentHeight * parseFloat(subformHeight) / 100);
            }
            else
            {
                controlHeight = parseFloat(subformHeight);
            }
        }

        if (controlWidth === 0)
        {
            controlWidth = Math.floor(documentWidth / 10 * percentageSize);
        }

        if (controlHeight === 0)
        {
            controlHeight = Math.floor(documentHeight / 10 * percentageSize);
        }

        //minimum value
        if (controlWidth < 70)
        {
            controlWidth = 70;
        }

        if (controlHeight < 70)
        {
            controlHeight = 70;
        }

        //maximum value
        if (controlWidth > documentWidth)
        {
            controlWidth = documentWidth;
        }

        if (controlHeight > documentHeight)
        {
            controlHeight = documentHeight;
        }

        // heading
        heading = translateComplexSourceValue(heading, loopContextID, behaviour);

        //#endregion
        var currentDateTime = new Date().getTime().toString();
        iframeName += "_" + currentDateTime;//make this even more unique in terms of self-referencing subitems and levels, similar to popup logic
        var contentFrame = jQuery("<iframe class='runtime-popup' name='" + iframeName + "' frameborder='0' style='height:100%; width:100%; margin: 0px;'></iframe>");
        var options = {
            id: "PopupWin_" + currentDateTime,
            headerText: heading,
            content: contentFrame,
            height: controlHeight,
            width: controlWidth,
            subformVerticalAlign: subformVerticalAlign,
            showHeaderButtons: true,
            draggable: true,
            maximizable: true,
            cancelClose: true,
            onShow: function (popup)
            {
                popup.element.find(".popup-body-content > .scroll-wrapper").removeClass("scroll-wrapper").addClass("wrapper");
            },
            onClose: windowToUse.subformPopupOnClose,
            subformContext:
                {
                    loopContextID: loopContextID,
                    formID: formID,
                    viewID: viewID,
                    actionInstanceID: actionInstanceID,
                    openBehaviour: behaviour,//this is the opening behaviour which will continue if closing behaviour is completed
                    closeBehaviour: closeBehaviour//this will only be set when showing a message page
                },
            removeContent: true,
            cssClass: popupCssClass
        };
        windowToUse.popupManager.showPopup(options);
        windowToNavigateTo.framePosting(iframeName, newURL, postData, navigateOnly);
    }
    else
    {
        // Take the top non-closing Form/View level from windowToNavigateTo.
        var transferLevel = parseInt(windowToNavigateTo.__runtimeFormLevel, 10);
        if (transferLevel > 0)
        {
            //on navigate, use the same level
            postData += setFrameVariable("_Level", transferLevel);

            if (checkExistsNotEmpty(__runtimeSubformID))
            {
                postData += setFrameVariable("_SubformID", __runtimeSubformID);//pass through current subformid even though navigating, used in some scenarios when redirecting between forms and ending up at the same original subform
            }
        }
        windowToNavigateTo.framePosting(navigationTarget, newURL, postData, navigateOnly);
        if (checkExists(behaviour) && navigationTarget !== "_self")
        {
            behaviour.isExecuting = false;
        }
    }
    //#endregion
}

function extractNavigatedEvents(subformID, actionInstanceID, subFormArray)
{
    var eventSubformXP = "";

    if (checkExistsNotEmptyGuid(subformID))
    {
        eventSubformXP = "@SubformID='" + subformID + "'";
    }

    // Never select the InstanceID from the Action xml node because extraAction logic deletes the attribute.
    // Pass it through from the method.
    // prepareNavigatedEvents saves the original extended InstanceID to filter here.
    if (checkExistsNotEmpty(actionInstanceID))
    {
        eventSubformXP += " and @InstanceID='" + actionInstanceID + "'";
    }

    var events = "";
    if (eventSubformXP.length > 0)
    {
        var openedEventXP = "Events/Event[" + eventSubformXP + "]";
        var openedFormEvents = $mn(formBindingXml, openedEventXP);

        // Detect selfreferencing Forms and do not select from runtimeNavigatedEvents to prevent accumulation of duplicate transferred events.
        if (checkExists(runtimeNavigatedEvents) && __runtimeSubformID !== subformID)
        {
            var navigatedEvents = $mn(runtimeNavigatedEvents, openedEventXP);

            if (navigatedEvents.length > 0)
            {
                var tmpArray = [];
                for (var i = 0; i < navigatedEvents.length; i++)
                {
                    tmpArray.push(navigatedEvents[i]);
                }
                for (var i = 0; i < openedFormEvents.length; i++)
                {
                    tmpArray.push(openedFormEvents[i]);
                }
                openedFormEvents = tmpArray;
            }
        }

        var o = openedFormEvents.length;
        if (o > 0)
        {
            while (o--)
            {
                var openedFormEvent = openedFormEvents[o];
                events += openedFormEvent.xml;

                // Find SubformID's
                if (checkExistsNotEmptyGuid(subformID))
                {
                    var otherSubformActions = openedFormEvent.selectNodes(".//Action[(@Type='Open' or @Type='Popup') and @SubformID and not(@SubformID='" + subformID + "')]");
                    subFormArray = checkExists(subFormArray) ? subFormArray : [];

                    for (var i = 0; i < otherSubformActions.length; i++)
                    {
                        var actSubformID = otherSubformActions[i].getAttribute("SubformID");
                        var actInstanceID = otherSubformActions[i].getAttribute("InstanceID");

                        if (subFormArray.indexOf(actSubformID) === -1 && (!checkExistsNotEmptyGuid(actInstanceID) || actInstanceID === actionInstanceID))
                        {
                            subFormArray.push(actSubformID);
                            events += extractNavigatedEvents(actSubformID, actInstanceID, subFormArray);
                        }
                    }
                }
            }
        }
    }

    return events;
}

//helper function to better handle possible encoding issues between different SF versions and limit JS errors presented to the user
function translateComplexSourceValue(sourceValue, loopContextID, behaviour)
{
    if (!checkExists(sourceValue))
    {
        return "";
    }

    var initialValue = sourceValue.toString().trim();
    var returnValue = initialValue;

    if (returnValue.length > 0 && returnValue.contains("<Source"))
    {
        //attempt normal usage first, try to limit behavioural/performance impact
        try
        {
            var initialItemNode = parseXML("<Item><SourceValue>{0}</SourceValue></Item>".format(returnValue)).documentElement;
            returnValue = returnSourceValue({ item: initialItemNode, loopContextID: loopContextID, behaviour: behaviour });
        }
        catch (e)
        {
            try
            {
                returnValue = initialValue;//ensure we're using the initial value to attempt failsafe encoding checks

                // TFS 651641 - Sometimes the Values arent XMLEncoded causing a parse error attempt to encode them for safety to allow a parse to XML
                var index = returnValue.indexOf('<Source SourceType="Value">');
                while (index !== -1)
                {
                    var lastIndex = returnValue.indexOf("</Source>", index);

                    if (lastIndex > -1 && lastIndex > index)
                    {
                        index = index + 27;
                        var length = lastIndex - index;

                        var val = returnValue.substr(index, length);
                        returnValue = returnValue.replace(val, val.xmlEncode());

                        index = returnValue.indexOf('<Source SourceType="Value">', lastIndex);
                    }
                    else
                    {
                        break;
                    }
                }
                var itemNode = parseXML("<Item><SourceValue>{0}</SourceValue></Item>".format(returnValue)).documentElement;
                returnValue = returnSourceValue({ item: itemNode, loopContextID: loopContextID, behaviour: behaviour }).xmlDecode();
            }
            catch (ex)
            {
                returnValue = "";
                SFLog({ type: 1, source: "translateComplexSourceValue", category: "Events", message: ex.message });
            }
            SFLog({ type: 1, source: "translateComplexSourceValue", category: "Events", message: e.message });
        }
    }
    return returnValue;
}

function subformPopupOnClose(popup, closeOptions)
{
    var subformContext = popup.options.subformContext;

    popup.hide();
    try
    {
        var activeElement = this.content[0].contentWindow.document.activeElement;
        if (activeElement && activeElement.nodeName.toLowerCase() !== 'body')
        {
            activeElement.blur();
        }
    }
    catch (e)
    {
        SFLog({ type: 4, source: "navigateAction", category: "Events", message: Resources.RuntimeMessages.WarningActiveElementNotFound });
    }
    removeLoopContextData({ loopContextID: subformContext.loopContextID });

    if (checkExists(subformContext.closeBehaviour))
    {
        continuePromptingBehaviour(subformContext.closeBehaviour);
    }
    else
    {
        subformClosed(subformContext, popup, closeOptions);
    }
}

//extract all handlers and their content to xml format to be sent through with navigation/subform (includes nesting of handlers)
function extractHandlerLogicForNavigation(handlers, removeInstanceID, originalEventType, closeEvent, adaptValues, behaviour)
{
    //#region
    var result = "";
    if (handlers.length > 0)
    {
        result += "<Handlers>";
        //handlers being sent through to next popup
        while (handlers.length > 0)
        {
            var currentHandler = handlers.shift();

            var loopContextID = getLoopContextID(currentHandler);

            var handlerType = currentHandler.getAttribute("Type");
            result += "<Handler Type='" + handlerType + "' ";

            if (checkExists(originalEventType))
            {
                result += "OriginalEventType='" + originalEventType + "' ";
            }
            result += ">";

            //#region conditions
            var conditions = $mn(currentHandler, "Conditions/Condition");
            var cLength = conditions.length;
            if (cLength > 0)
            {
                result += "<Conditions>";
                for (var c = 0; c < cLength; c++)
                {
                    //replace all the condition inner values where applicable
                    var condition = conditions[c].cloneNode(true);
                    populateFilterValuesForNavigation(condition, true, false, ".//Item[@SourceType!='Value'] | .//Source[@SourceType!='Value']", loopContextID, adaptValues, behaviour);
                    result += condition.xml;
                }
                result += "</Conditions>";
            }
            //#endregion

            //#region actions
            var actions = $mn(currentHandler, "Actions/Action");
            var aLength = actions.length;
            if (aLength > 0)
            {
                result += "<Actions>";
                //if condition is valid - add actions to list of executions
                for (var a = 0; a < aLength; a++)
                {
                    var otherAction = actions[a].cloneNode(true);
                    var actionType = otherAction.getAttribute("Type");
                    if (actionType === "Handler")
                    {
                        //#region handlers
                        var otherHandlers = constructHandlersForBehaviour(otherAction, [], closeEvent, originalEventType, loopContextID);
                        if (otherHandlers.length > 0)
                        {
                            result += "<Action Type='Handler' ";
                            if (checkExists(originalEventType))
                            {
                                result += "OriginalEventType='" + originalEventType + "'";
                            }
                            result += ">";
                            result += extractHandlerLogicForNavigation(otherHandlers, removeInstanceID, originalEventType, closeEvent, adaptValues, behaviour);
                            result += "</Action>";
                        }
                        //#endregion
                    }
                    else
                    {
                        if (!checkExists(otherAction.getAttribute("OriginalEventType")))
                        {
                            otherAction.setAttribute("OriginalEventType", originalEventType);
                        }
                        populateParameterValuesForNavigation(otherAction, true, adaptValues, removeInstanceID, true, loopContextID, behaviour);
                        populateFilterValuesForNavigation(otherAction, true, removeInstanceID, null, loopContextID, adaptValues, behaviour);
                        result += otherAction.xml;
                    }
                }
                result += "</Actions>";
            }
            //#endregion

            //#region functions
            var fn = $sn(currentHandler, "Function");

            if (checkExists(fn))
            {
                var otherFunction = fn.cloneNode(true);
                result += otherFunction.xml;
            }
            //#endregion
            result += "</Handler>";
        }
        result += "</Handlers>";
    }
    return result;
    //#endregion
}

//shared function to populate a action's parameters before navigation
function populateParameterValuesForNavigation(currentAction, includeAction, adaptValues, removeInstanceID, updateParameterValues, loopContextID, behaviour)
{
    //#region
    var parameters = $mn(currentAction, "Parameters/Parameter");
    var xmldoc = $xml(currentAction.xml);
    var formParameters = "";
    var sourceValue;

    //loop through parameters and add properties
    var p = parameters.length;
    while (p--)
    {
        var targettype = parameters[p].getAttribute("TargetType");

        if ((targettype === "FormParameter" || targettype === "ViewParameter") && !updateParameterValues)
        {
            var target = parameters[p].getAttribute("TargetID"); //always property/parameter sourcetype
            sourceValue = returnSourceValue({ item: parameters[p], loopContextID: loopContextID, behaviour: behaviour }); //can't use other return function here, since this should be resolved from source
            if (checkExists(sourceValue))
            {
                formParameters += "&" + target + "=" + encodeURIComponent(sourceValue); //TFS372784 - escaping data in querystring via encodeURIComponent
            }
            if (includeAction)
            {
                var paramParent = parameters[p].parentNode;
                paramParent.removeChild(parameters[p]);
                if (paramParent.childNodes.length === 0)
                {
                    paramParent.parentNode.removeChild(paramParent);
                }
            }
        }
        else if (includeAction) //only update the parameters with the source value if the action is actually going to be used
        {
            var originalValue = $sn(parameters[p], "SourceValue");
            var sourceInstanceID = parameters[p].getAttribute("SourceInstanceID");
            if (checkExists(originalValue))
            {
                //if complex setup is used - return the different sources where possible as SourceValues - this will allow for replacement on target as well if necessary
                replaceSourceValueForNavigation(xmldoc, originalValue, sourceInstanceID, loopContextID, adaptValues, behaviour);
            }
            else
            {
                if (adaptValues)//resolve sourcevalues since scope can be lost while completing closing logic
                {
                    sourceValue = returnSourceValue({ item: parameters[p], loopContextID: loopContextID, behaviour: behaviour });
                    if (sourceValue.length > 0)
                    {
                        var value = xmldoc.createElement("SourceValue");
                        value.appendChild(xmldoc.createTextNode(sourceValue));
                        parameters[p].appendChild(value);
                    }
                }
                else if (!checkExists(parameters[p].getAttribute("SourceSubformID")) && !checkExists(parameters[p].getAttribute("SourceOriginalLevel")))
                {
                    //real time resolving of parent level values, not just the static value upon opening
                    parameters[p].setAttribute("SourceOriginalLevel", __runtimeFormLevel);
                }
            }
        }
    }
    if (includeAction && checkExists(removeInstanceID) && removeInstanceID === true)
    {
        if (!checkExists(currentAction.getAttribute("FormID")))
        {
            currentAction.removeAttribute("InstanceID");
        }
    }

    //no need to return object/array since node was manipulated anyway
    //only return possibly manipulated formParameters, will be used where necessary
    return formParameters;
    //#endregion
}

//function to replace sourcevalues for navigation when a complex mapping is set up
//this was changed to facilitate the combined mappings of values and sources on both the target and source view/form
function replaceSourceValueForNavigation(xmldoc, item, sourceInstanceID, loopContextID, adaptValues, behaviour)
{
    //#region
    var multipleValues = $mn(item, "Source");
    if (multipleValues.length === 0)
    {
        multipleValues = $mn(item, "Item");
    }
    if (multipleValues.length > 0)
    {
        for (var m = 0; m < multipleValues.length; m++)
        {
            var currentNode = multipleValues[m];
            if (currentNode.getAttribute("SourceType") !== "Value") //only replace nodes that aren't already value nodes
            {
                if (adaptValues)
                {
                    var newValue = returnSourceValue({ item: currentNode, loopContextID: loopContextID, behaviour: behaviour });
                    if (checkExistsNotEmpty(newValue))
                    {
                        //if the value could be resolved, the current source is replaced with a value node. This will ensure that it is correctly translated on the other side
                        var newNode = xmldoc.createElement("Source");
                        newNode.setAttribute("SourceType", "Value");
                        newNode.appendChild(xmldoc.createTextNode(newValue));
                        item.replaceChild(newNode, currentNode);
                    }
                }
                else if (!checkExists(currentNode.getAttribute("SourceSubformID")) && !checkExists(currentNode.getAttribute("SourceOriginalLevel")))
                {
                    //real time resolving of parent level values, not just the static value upon opening
                    currentNode.setAttribute("SourceOriginalLevel", __runtimeFormLevel);
                }
            }
        }
    }
    return item;
    //#endregion
}

//shared function to populate a action's parameters before navigation
function populateFilterValuesForNavigation(currentNode, includeDefinition, removeInstanceID, alternateXPath, loopContextID, adaptValues, behaviour)
{
    //#region
    if (includeDefinition)//only manipulate the parameters if the action is actually going to be used
    {
        var xp = ".//Item/SourceValue/Item";
        if (checkExists(alternateXPath) && alternateXPath.length > 0) //override to replace condition values when navigating, structures differ a bit
        {
            xp = alternateXPath;
        }
        var items = $mn(currentNode, xp);
        var i = items.length;
        if (i > 0)
        {
            var xmldoc = $xml(currentNode.xml);
            while (i--)
            {
                if (adaptValues)
                {
                    //attempt to resolve nodes
                    var sourceValue = returnSourceValue({ item: items[i], loopContextID: loopContextID, behaviour: behaviour });

                    if (sourceValue.length > 0)
                    {
                        var value = xmldoc.createElement("SourceValue");
                        value.appendChild(xmldoc.createTextNode(sourceValue));
                        items[i].appendChild(value);
                    }
                }

                //real time resolving of parent level values, not just the static value upon opening
                if (!checkExists(items[i].getAttribute("SourceSubformID")) && !checkExists(items[i].getAttribute("SourceOriginalLevel")))
                {
                    items[i].setAttribute("SourceOriginalLevel", __runtimeFormLevel);
                }
            }
        }
        if (checkExists(removeInstanceID) && removeInstanceID === true)
        {
            if (!checkExists(currentNode.getAttribute("FormID")))
            {
                currentNode.removeAttribute("InstanceID");
            }
        }
    }
    return currentNode;
    //#endregion
}

//event that is raised when a subform (view/form) is closed
function subformClosed(subformContext, popup, closeOptions)
{
    //#region
    var formID = subformContext.formID;
    var viewID = subformContext.viewID;
    var instanceID = subformContext.actionInstanceID;
    var openBehaviour = subformContext.openBehaviour;
    var behaviour = subformContext.behaviour;
    if (checkExists(openBehaviour) && checkExists(behaviour))
    {
        behaviour.openBehaviour = openBehaviour;
    }
    else if (checkExists(openBehaviour) && !checkExists(behaviour))
    {
        behaviour = openBehaviour;//will continue this as previously
    }

    var windowToUse = SourceCode.Forms.Runtime.getMasterRuntimeWindow();
    if (popup && popup.controls && popup.controls.body)
    {
        var iframes = popup.controls.body.find("iframe");
        windowToUse = SourceCode.Forms.Runtime.getPopupIframeContentWindow(iframes);
    }
    var completeClose = true;
    try
    {
        var sourceType = null;
        var sourceID = null;
        if (checkExists(formID))
        {
            sourceType = "Form";
            sourceID = formID;
        }
        else if (checkExists(viewID))
        {
            sourceType = "View";
            sourceID = viewID;
        }
        if (checkExists(sourceType))
        {
            var closingEvent = windowToUse.verifyEventHandling(sourceID, sourceType, "Closed", instanceID);
            if (closingEvent)
            {
                completeClose = false;
                //handle nesting - if eventing exists
                return windowToUse.handleEvent(sourceID, sourceType, "Closed", null, instanceID, null, behaviour, true, popup, closeOptions);
            }
            else
            {
                if (checkExists(popup) && checkExists(behaviour))
                {
                    if (!checkExists(behaviour.popup))
                    {
                        completeClose = false;
                        //this simulates the logic that would have been followed by running it via handleEvent, just with less overhead
                        behaviour.popup = popup;
                        behaviour.closeEvent = true;
                        if (checkExists(behaviour.openBehaviour) && checkExists(behaviour.openBehaviour.windowToUse)
                            && (!checkExists(behaviour.handlers) || behaviour.handlers.length === 0) && (!checkExists(behaviour.actions) || behaviour.actions.length === 0))
                        {
                            //only adapt the window if the current behaviour has no further handlers or actions
                            //some forms in Management site trigger this need
                            behaviour.windowToUse = behaviour.openBehaviour.windowToUse;
                        }
                        behaviour.isExecuting = false;
                        behaviour.executeBehaviour();
                    }
                    else  //can't override the popup - try to continue as before
                    {
                        completeClose = false;
                        //handle nesting as before 
                        return windowToUse.handleEvent(sourceID, sourceType, "Closed", null, instanceID, null, behaviour, true, popup, closeOptions);
                    }
                }
            }
        }
    }
    catch (e)
    {
        var logObject =
            {
                type: 5,
                source: "subformClosed",
                category: "Events",
                message: Resources.RuntimeMessages.ErrorSubformClosed,
                exception: e
            };
        //popupManager.showError(logObject.message.format(logObject.parameters));
        SFLog(logObject);
    }
    finally
    {
        //this part indicates that:
        //* no closing event was found 
        //* or behaviour popup chaining could not be done
        //* or that an error occurred
        if (completeClose && checkExists(popup)) //failsafe for enable further interaction
        {
            var instanceName = SourceCode.Forms.Runtime.getRuntimeInstanceName(popup);
            SourceCode.Forms.Runtime.removeRuntimeDataProperty(instanceName, "windowContextValid");
            SourceCode.Forms.Runtime.removeRuntimeDataProperty(instanceName, "windowContext");
            popup.closed(closeOptions);
        }
    }
    //#endregion
}

//move the focus to a specific view/panel or form
function focusAction(currentAction, methodExecuted, behaviour)
{
    //#region
    var loopContextID = getLoopContextID(currentAction);

    var ViewID = currentAction.getAttribute("ViewID");
    var PanelID = currentAction.getAttribute("PanelID");
    var FormID = currentAction.getAttribute("FormID");
    var InstanceID = currentAction.getAttribute("InstanceID");

    if (checkExists(FormID))
    {
        if (FormID.toLowerCase() === currentForm)
        {
            currentAction.setAttribute("OldType", "Focus");
        }
        //navigate to another form and will do this focus there
        navigateAction(currentAction, true);
    }
    else
    {
        //only get new panel id if the view ID attribute exist, and the panel ID attribute don't
        if (!checkExists(PanelID) && checkExists(ViewID))
        {
            var viewDef = getViewDefinition(ViewID, InstanceID);
            if (checkExists(viewDef))
            {
                PanelID = viewDef.getAttribute("PanelID");
            }
        }

        if (checkExists(PanelID))
        {
            showSpecificPanel(PanelID);
        }
    }

    endActionExecution({ loopContextID: loopContextID, behaviour: behaviour });
    //#endregion
}

//shows the specific tab on the form
function showSpecificPanel(PanelID)
{
    //#region
    var formControl = $find(currentForm);
    if (formControl)
    {
        formControl.set_active(_runtimeEmptyGuid + "_" + PanelID);
    }
    //#endregion
}

//set and update control property values and display
function SetControlProperty(currentControlID, propertyName, propertyValue, transferredID, runtimeContextID, isPanel, loopContextID)
{
    //#region
    var findOptions =
        {
            controlID: currentControlID,
            transferredID: transferredID,
            runtimeContextID: runtimeContextID,
            isDestination: true
        }
    var instanceObj = findCorrectInstanceForDataTransfer(findOptions);
    if (checkExists(instanceObj))
    {
        var currentControl = instanceObj.result;
        if (checkExists(currentControl))
        {
            var controlTemplate = currentControl.getAttribute("ControlTemplate");
            var windowToUse = instanceObj.WindowToUse;

            if (propertyName === "tabindex" && propertyValue !== -1)
            {
                propertyValue = calculateTabIndex(propertyValue, currentControlID);
            }

            var objInfo = new windowToUse.PopulateObject(null, propertyValue, currentControlID, propertyName);

            var updated = windowToUse.updateControlPropertyDefinition(currentControl, objInfo.property, objInfo.Value, loopContextID);
            if (updated)
            {
                if (checkExists($sn(currentControl, "Properties/Property[Name/text()='SetProperty']"))) //column properties don't have a setproperty at this stage - only attempt execution if it exists
                {
                    windowToUse.executeControlFunction(currentControl, "SetProperty", objInfo);
                }
                //update the inner style shortcuts on the internal store for styles to prevent a future loss of the property value
                if (propertyName === "timezone")
                {
                    var baseStyles = $sn(currentControl, "Properties/Styles");
                    var defaultStyleNode = StyleHelper.getDefaultStyleNode(baseStyles);
                    var formatNode = defaultStyleNode.selectSingleNode("Format");
                    if (formatNode === null)
                    {
                        var objInfo2 = new PopulateObject(null, null, currentControlID, "Format");
                        var formatString = windowToUse.executeControlFunction(currentControl, "GetProperty", objInfo2);
                        if (checkExistsNotEmpty(formatString))
                        {
                            formatNode = parseXML(formatString);
                            if (checkExists(formatNode))
                            {
                                formatNode = formatNode.documentElement.cloneNode(true);
                            }
                        }
                        if (checkExists(formatNode))
                        {
                            defaultStyleNode.appendChild(formatNode);
                        }
                        else
                        {
                            formatNode = baseStyles.ownerDocument.createElement("Format");
                        }
                    }
                    if (checkExists(formatNode))
                    {
                        formatNode.setAttribute("TimeZone", propertyValue);
                    }
                }
                if (!isPanel) //non panel (ATM list specific) properties
                {
                    if (propertyName.toLowerCase() === "isvisible" || propertyName.toLowerCase() === "isenabled")
                    {
                        windowToUse.updateListControlStates(currentControl, currentControlID, propertyName, propertyValue.toString());
                    }
                    else if (checkExists(controlTemplate) && controlTemplate === "header" && propertyName.toLowerCase() === "text") //list header text change (bug 194235)
                    {
                        var mainTable = currentControl.parentNode.parentNode.getAttribute("MainTable");
                        if (checkExists(mainTable))
                        {
                            var displayNodes = jQuery("#" + mainTable + " .grid-column-header-text." + currentControlID);
                            var n = displayNodes.length; //handle possible multiples
                            while (n--)
                            {
                                displayNodes[n].innerHTML = propertyValue;
                                displayNodes[n].setAttribute("title", propertyValue);
                            }
                            //verify that quick search is up to date with column text
                            var viewID = currentControl.parentNode.parentNode.getAttribute("ID");
                            var instanceID = currentControl.parentNode.parentNode.getAttribute("InstanceID");
                            var listSectionID = checkExists(instanceID) ? instanceID + "_" + viewID : _runtimeEmptyGuid + "_" + viewID;
                            runtimeFilterFields[listSectionID] = null;
                            populateQuickSearchDropdown(viewID, instanceID, listSectionID);
                        }
                    }
                    else if (controlTemplate === "display")
                    {
                        var viewNode = currentControl.parentNode.parentNode;
                        var mainTable = viewNode.getAttribute("MainTable");
                        listRefreshCache.push(mainTable); //update the grid's rendering
                        setTimeout(function () //delay execution
                        {
                            updateAllListDisplays();
                        })
                    }
                }
            }
        }
    }

    //#endregion
}

//sync column widths of all the grids that are visible on the current panel (needed for percentages to be applied correctly)
function syncColumnWidthsOnPanel(PanelID)
{
    //#region
    refreshFormPadding({ panelID: PanelID }); //have to do this first
    var ViewsOnCurrentPanel = $mn(viewControllerDefinition, "Controllers/Controller[@PanelID='" + PanelID + "'][@TypeView='List']");
    //only sync the widths of views that are of the correct type (list/capture list)
    var v = ViewsOnCurrentPanel.length;
    while (v--)
    {
        var currentView = jQuery("#" + ViewsOnCurrentPanel[v].getAttribute("MainTable"));
        if (currentView.is(":visible"))
        {
            SFRGrid.execute({ element: currentView, fn: "runtimeSyncColumns" });
        }
    }

    //#endregion
}

//sets the value of a specific Form property
//supported input "options" structure:
//  {
//      formId, (required)
//      propertyName, (required)
//      propertyValue
//  }
function setFormProperty(options)
{
    var options = checkExists(options) ? options : {};

    if (checkExistsNotEmpty(options.formId) && checkExistsNotEmpty(options.propertyName))
    {
        var formControlId = "{0}_{1}".format(_runtimeEmptyGuid, options.formId);
        var formControlSelector = "Controllers/Controller[@TypeView='']/Controls/Control[@ID='{0}']".format(formControlId);
        var formControl = viewControllerDefinition.selectSingleNode(formControlSelector);

        if (checkExists(formControl))
        {
            var objInfo = new PopulateObject(null, options.propertyValue, formControlId, options.propertyName);

            executeControlFunction(formControl, "SetProperty", objInfo);
        }
    }
}

//execute the action methods
function executeAction(currentAction, methodExecuted, returnXMLPackage, behaviour, originalWindow)
{
    //#region
    var loopContextID = getLoopContextID(currentAction);

    var actionType = currentAction.getAttribute("Type");
    var itemState = currentAction.getAttribute("ItemState");
    var innerXmlPackage = null;
    if (!checkExists(returnXMLPackage))
    {
        returnXMLPackage = false;
    }
    SFLog({ type: 1, source: "executeAction", category: "Events", message: "{0} action", parameters: [actionType], data: currentAction });
    var originalEventType = currentAction.getAttribute("OriginalEventType");
    if (checkExists(originalEventType) && originalEventType !== "System")
    {
        fireExpressions(true);
    }
    switch (actionType)
    {
        case "Transfer":
            //transfer of data between controls, properties, fields etc.
            dataTransferAction(currentAction, methodExecuted, behaviour);
            break;
        case "PopulateControl":
            executePopulateControlAction(currentAction);
            if (checkExists(behaviour))
            {
                behaviour.isExecuting = false;
            }
            break;
        case "List":
            //typically used in capture lists - show a row in list as capture/display values, transfer data and remove data without executing a method to the brokerpackage
            innerXmlPackage = listExecutionAction(currentAction, methodExecuted, returnXMLPackage, behaviour);
            break;
        case "Focus":
            //focus action - sets the focus to another view/tab/form without executing a method
            focusAction(currentAction, methodExecuted, behaviour);
            break;
        case "Calculate":
            calculateAction(currentAction, methodExecuted, behaviour);
            break;
        case "ExecuteWorkflow":
            if (checkExists(returnXMLPackage) && returnXMLPackage === true)
            {
                innerXmlPackage = workflowAction(currentAction, behaviour, returnXMLPackage);
            }
            else
            {
                return workflowAction(currentAction, behaviour, returnXMLPackage);
            }
        //break;
        case "Navigate":
            navigateSimpleAction(currentAction, behaviour);
            break;
        case "Prompt":
            // Always execute on main context for subform closing context issues.
            var masterRuntimeWindow = SourceCode.Forms.Runtime.getMasterRuntimeWindow();
            masterRuntimeWindow.promptAction(currentAction, methodExecuted, behaviour);
            break;
        case "Validate":
            validateAction(currentAction, methodExecuted, behaviour);
            break;
        case "Open":
            openAction(currentAction, behaviour);
            break;
        case "Popup":
            popupTypeExecution({ behaviour: behaviour, currentAction: currentAction });
            break;
        case "Close":
            if (!checkExists(currentAction.getAttribute("CloseTarget")) || currentAction.getAttribute("CloseTarget") === "Browser")
            {
                //try to close the form - workflow setup
                closeAction(currentAction);
            }
            else
            {
                executeEventAction(currentAction, methodExecuted, actionType, returnXMLPackage, null, behaviour, null, originalWindow);
            }
            break;
        case "Disable": //disabling the form
            setFormProperty({ formId: currentAction.getAttribute("FormID"), propertyName: "hasDisableOverlay", propertyValue: true });
            endActionExecution({ loopContextID: loopContextID, behaviour: behaviour });
            break;
        case "Enable": //enabling the form - allowing the events
            setFormProperty({ formId: currentAction.getAttribute("FormID"), propertyName: "hasDisableOverlay", propertyValue: false });
            eventsCancelled = false;
            endActionExecution({ loopContextID: loopContextID, behaviour: behaviour });
            break;
        case "SendMail":
            return mailAction(currentAction, behaviour);
        //break;
        case "ShowMessage":
            var executingWindow = window;
            var messageLocation = currentAction.getAttribute("MessageLocation");
            if (checkExists(messageLocation) && messageLocation === "Popup")
            {
                // POPUP only, browsing should happen in intended window (TFS#773415)
                // Always execute on main context for subform closing context issues.
                executingWindow = SourceCode.Forms.Runtime.getMasterRuntimeWindow();
            }
            executingWindow.messageAction(currentAction, behaviour, methodExecuted, window);
            break;
        case "ExecuteSharePoint":
            executeSharePointAction(currentAction, behaviour);
            break;
        case "ApplyStyle":
            applyStyleAction(currentAction, behaviour);
            break;
        case "ExecuteControl":
            ControlMethodExecuteAction(currentAction, behaviour);
            break;
        case "Continue":
            continueBehaviour(behaviour);
            break;
        case "Exit":
            exitBehaviour(behaviour);
            break;
        case "Handler":
            if (checkExists(behaviour))
            {
                var handlersForBehaviour = constructHandlersForBehaviour(currentAction, [], behaviour.closeEvent, currentAction.getAttribute("OriginalEventType"), loopContextID);
                if (handlersForBehaviour.length > 0)
                {
                    if (checkExists(behaviour.handlers))
                    {
                        behaviour.parentHandlers.push(behaviour.handlers);
                        behaviour.previousActions.push(behaviour.actions); //add the rest of the actions to a property to ensure that if required, it can be continued
                        behaviour.actions = [];
                    }
                    behaviour.handlers = handlersForBehaviour;
                }
                behaviour.isExecuting = false;
            }
            removeLoopContextData({ loopContextID: loopContextID });
            break;
        default:
            if (checkExists(itemState) && (itemState !== "All"))
            {
                innerXmlPackage = executeCollectiveListMethod(currentAction, methodExecuted, actionType, returnXMLPackage, itemState, behaviour);
            }
            else
            {
                //for all other instances - the normal event action execution
                if (checkExists(returnXMLPackage) && returnXMLPackage === true)
                {
                    innerXmlPackage = executeEventAction(currentAction, methodExecuted, actionType, returnXMLPackage, null, behaviour, null, originalWindow);
                }
                else
                {
                    return executeEventAction(currentAction, methodExecuted, actionType, returnXMLPackage, null, behaviour, null, originalWindow);
                }
            }
            break;
    }

    //this is the combined packet of all the event executions
    // IMPORTANT:  Be very careful for disposing context when Close is called Async.  
    // If fired async, return and don't call any global functions/variables because Async causes the context to be disposed immediately.
    if (returnXMLPackage === true)
    {
        if (typeof innerXmlPackage !== "undefined" && innerXmlPackage !== null)
        {
            return innerXmlPackage;
        }
        else
        {
            return null;
        }
    }
    //#endregion
}

function executePopulateControlAction(currentAction)
{
    // get basic variables
    var SmartObjID = currentAction.getAttribute("ObjectID");
    var currentControlID = currentAction.getAttribute("ControlID");
    var ViewID = currentAction.getAttribute("ViewID");
    var instanceID = currentAction.getAttribute("InstanceID");
    var loopContextID = getLoopContextID(currentAction);
    var currentViewXML = returnCurrentViewXML(ViewID, instanceID);

    // build broker package filters
    var resultname = "Primary_" + SmartObjID + "_" + SmartObjID;
    if (checkExists(currentControlID))
    {
        var association = new dataSourceLookup({ xmlDoc: currentViewXML, includeControllers: false, includeController: false, sourceControlID: currentControlID, isComposite: null }).getDataSource();
        if (checkExists(association))
        {
            resultname = association.getAttribute("ContextType") + "_" + association.getAttribute("ContextID") + "_" + SmartObjID;
        }
    }

    var filterXml = parseXML("<Filters/>");
    var actionFilter = currentAction.childNodes;
    var actionFilterNode;
    if (checkExists(actionFilter) && actionFilter.length > 0)
    {
        actionFilterNode = actionFilter[0];
    }

    if (checkExists(actionFilterNode) && checkExists(actionFilterNode.childNodes))
    {
        var windowToUseForSource = window.self;
        var filterValueXML = inspectAndReplaceFilterXml(actionFilterNode.childNodes[0], filterXml, resultname, windowToUseForSource, loopContextID);
        filterXml.documentElement.appendChild(filterValueXML);
    }

    // get hidden view xml
    var comparisonObj = { parenttype: "Object", controlid: currentControlID, counter: true };
    var hiddenFields = getHiddenPropertyCollection(ViewID, instanceID, comparisonObj);
    if (!checkExists(hiddenFields))
    {
        throw "unable to find hidden view fields for view with Id: " + ViewID + " and instance with Id: " + instanceID;
    }

    // set items
    var currentControl = _runtimeControllerFindObject({ controlID: currentControlID, propertySearch: "SetItems" });
    if (checkExists(currentControl))
    {
        var objInfoSettingItems = new PopulateObject(null, null, currentControlID);
        var brokerpackage =
            {
                smartobject: { guid: SmartObjID, resultName: resultname, method: { filter: filterXml.xml } }
            }
        objInfoSettingItems.brokerPackageXML = [brokerpackage];//picker

        var settingItemsBrokerPackages = executeControlFunction(currentControl, "SettingItems", objInfoSettingItems);
        //check if the modalizeView option was return and it was false before stopping the modal from showing
        modalizeView = (objInfoSettingItems.modalizeView !== false);
        skipExecution = (objInfoSettingItems.skipExecution === true);

        if (skipExecution === true)
        {
            setTimeout(function ()
            {
                if (typeof behaviour !== "undefined" && checkExists(behaviour)) // we have to check the type. CheckExists doesn't cover all types
                {
                    behaviour.isExecuting = false;
                    behaviour.executeBehaviour(); //correct usage
                }
            }, 0);
            return;
        }
        // always call the filter method, even when there is no proper filter xml. The filter method will filter by smartObjectId,
        // make sure that only items with counters are returned, and correct the ordering (because reverse:true)
        if (checkExists(settingItemsBrokerPackages))
        {
            //should do a SetItems for each item in the array
            for (var i = 0; i < settingItemsBrokerPackages.length; i++)
            {
                var results = filterListClientSide(settingItemsBrokerPackages[i], hiddenFields, {
                    reverse: false
                });

                var objInfo = new PopulateObject(null, null, currentControlID, null, null, results);
                executeControlFunction(currentControl, "SetItems", objInfo);
            }
        }
        else
        {
            var results = filterListClientSide(brokerpackage, hiddenFields, {
                reverse: false
            });

            var objInfo = new PopulateObject(null, null, currentControlID, null, null, results);
            executeControlFunction(currentControl, "SetItems", objInfo);
        }

        SourceCode.Forms.Runtime.Information.setControlBrokerHistory(
            {
                viewId: ViewID,
                instanceId: instanceID,
                controlId: currentControlID,
                value: brokerpackage
            });
    }
}

function executeEventAction(currentAction, methodExecuted, actionType, returnXMLPackage, rowCounter, behaviour, specifiedResultName, originalWindow)
{
    // instance related information
    var loopContextID = getLoopContextID(currentAction);

    var EventID = currentAction.getAttribute("EventID");
    var InstanceID = currentAction.getAttribute("InstanceID");

    // By default if not supplied, the current(Action's) window.
    if (!checkExists(originalWindow))
    {
        originalWindow = window.self;
    }

    if (checkExists(EventID))
    {
        //test for eventid - if present, the other event should be executed
        var InstancePath = (checkExists(InstanceID)) ? "[@InstanceID='" + InstanceID + "']" : ""; //"' or not(@InstanceID)]" : "";
        var otherEventXPath = "Events/Event[@DefinitionID='" + EventID + "']" + InstancePath;
        var otherEvent = null;
        var otherWindowEvent = null;
        var eventWindow = null;

        if (checkExists(runtimeNavigatedEvents))
        {
            // Check navigated events
            otherEvent = $sn(runtimeNavigatedEvents, otherEventXPath);
        }
        if (otherEvent === null && checkExists(formBindingXml))
        {
            // Check user events
            otherEvent = $sn(formBindingXml, otherEventXPath);
        }
        if (otherEvent === null)
        {
            var eventInfo = locateEventInfoOnWindow(otherEventXPath);
            if (eventInfo)
            {
                eventWindow = eventInfo.windowToUse;
                otherWindowEvent = eventInfo.event;
            }
        }

        if (otherEvent)
        {
            //previously other behaviour was stopped, now we continue by sending it on as the parent behaviour (which will be executed when current functionality completes)
            return handleEvent(otherEvent.getAttribute("SourceID"), otherEvent.getAttribute("SourceType"), $sn(otherEvent, "Name").text, null, InstanceID, null, behaviour, null, null, null, EventID, loopContextID);
        }
        else if (checkExists(otherWindowEvent))
        {
            return eventWindow.handleEvent(otherWindowEvent.getAttribute("SourceID"), otherWindowEvent.getAttribute("SourceType"), $sn(otherWindowEvent, "Name").text, null, InstanceID, null, behaviour, null, null, null, EventID, loopContextID);
        }
        else
        {
            removeLoopContextData({ loopContextID: loopContextID });

            if (checkExists(behaviour))
            {
                behaviour.isExecuting = false;
                behaviour.executeBehaviour();
            }
        }
    }
    else
    {
        var currentMethod = currentAction.getAttribute("Method");
        if (!checkExists(currentMethod))
        {
            if (actionType === "Close")
            {
                closeTypeExecution(behaviour);
            }
            else
            {
                endActionExecution({ loopContextID: loopContextID, behaviour: behaviour });
            }
        }
        else
        {
            return executeEventActionOnWindow(currentAction, methodExecuted, actionType, returnXMLPackage, rowCounter, behaviour, specifiedResultName, originalWindow, currentMethod);
        }
    }
}

//exeute the events without specific actiontypes
function executeEventActionOnWindow(currentAction, methodExecuted, actionType, returnXMLPackage, rowCounter, behaviour, specifiedResultName, originalWindow, currentMethod)
{
    //#region
    var loopContextID = getLoopContextID(currentAction);

    //get these values from the actual view xml itself
    var ViewID = currentAction.getAttribute("ViewID");
    var actionInstanceID = currentAction.getAttribute("InstanceID");
    var currentControlID = currentAction.getAttribute("ControlID");

    var currentViewXML = null;
    var viewMainTableName = null;
    var TypeOfView = "Capture";
    var instanceXP = "";
    var viewPrimarySmoID = null; //SmartObjectID that is bound to the View
    if (checkExists(ViewID))
    {
        currentViewXML = returnCurrentViewXML(ViewID, actionInstanceID);
        if (checkExists(currentViewXML))
        {
            viewMainTableName = currentViewXML.getAttribute("MainTable");
            TypeOfView = currentViewXML.getAttribute("TypeView");
            instanceXP = returnInstanceXP(currentViewXML.getAttribute("InstanceID"), false, false, true, false);
            viewPrimarySmoID = currentViewXML.getAttribute("ContextID");
        }
    }

    var SmartObjID = currentAction.getAttribute("ObjectID");
    if (!checkExists(SmartObjID))
    {
        //#region
        var currentView = checkExistsNotEmpty(viewMainTableName) ? $("#" + viewMainTableName) : null;
        switch (currentMethod)
        {
            case "OnError":
                if (actionType === "Close")
                {
                    closeTypeExecution(behaviour);
                }

                return executeErrorMethod(currentAction, behaviour);
            //break;
            case "Clear":
                //clear all the properties - now works for the many to many implementations as well
                clearViewControls(ViewID, currentViewXML, true, actionInstanceID, null, currentAction, true); //fix for default values after delete & clear
                if (TypeOfView === "List")
                {
                    clearTable(viewMainTableName, ViewID, actionInstanceID, true, null, null, loopContextID);
                }
                handleEvent(ViewID, 'View', currentMethod, null, actionInstanceID, null, null, null, null, null, null, loopContextID);
                if (actionType === "Close")
                {
                    closeTypeExecution(behaviour);
                }
                else
                {
                    endActionExecution({ loopContextID: loopContextID, behaviour: behaviour });
                }
                return null;
            case "ListRefresh":
                if (actionType === "Close")
                {
                    closeTypeExecution(behaviour);
                }
                refreshList(ViewID, null, actionInstanceID, behaviour);
                return null;
            case "Init":
            case "PostInit":
                var eventSource = null;
                var eventSourceType = null;
                if (checkExists(ViewID))
                {
                    eventSource = ViewID;
                    eventSourceType = "View";
                }
                else if (checkExists(currentAction.getAttribute("FormID")))
                {
                    var FormID = currentAction.getAttribute("FormID");
                    eventSource = FormID;
                    eventSourceType = "Form";
                }
                if (actionType === "Close")
                {
                    closeTypeExecution(behaviour);
                }
                if (checkExists(eventSource) && checkExists(eventSourceType))
                {
                    dataTransferAction(currentAction, currentMethod);//do the data transfer(currently only implemented for view init, but it might be added to the rest)
                    return handleEvent(eventSource, eventSourceType, currentMethod, null, actionInstanceID, null, behaviour, null, null, null, null, loopContextID);
                }
                return null;
            case "Collapse":
            case "Expand":
                var options =
                    {
                        viewID: ViewID,
                        currentAction: currentAction,
                        target: "isexpanded",
                        sourceValue: (currentMethod === "Expand"),
                        loopContextID: loopContextID
                    }
                updateViewProperty(options);

                if (actionType === "Close")
                {
                    closeTypeExecution(behaviour);
                }
                else
                {
                    endActionExecution({ loopContextID: loopContextID, behaviour: behaviour });
                }
                return null;
            case "ListExportExcel":
                if ((typeof (__runtimeOpenXmlAssemblyFound) === "undefined")
                    || (__runtimeOpenXmlAssemblyFound.toString().toUpperCase() !== "FALSE"))
                {
                    var executeListExportExcelOptions = {
                        viewXml: currentViewXML,
                        viewHtml: currentView,
                        currentAction: currentAction,
                        actionType: actionType,
                        rowCounter: rowCounter,
                        originalWindow: originalWindow,
                        specifiedResultName: specifiedResultName,
                        behaviour: behaviour
                    };

                    executeListExportExcel(executeListExportExcelOptions);
                }
                else
                {
                    if (checkExists(behaviour))
                    {
                        behaviour.handleError("openxmlnotfound", null, null, null, null, loopContextID);
                    }
                    else
                    {
                        masterPopupManager.showError(constructOpenXmlNotFoundErrorMessage());
                    }
                }

                return null;
            case "Submit":
                var eventSource = null;
                var eventSourceType = null;

                var actionFormID = currentAction.getAttribute("FormID");

                if (checkExistsNotEmpty(actionFormID))
                {
                    eventSource = actionFormID;
                    eventSourceType = "Form";
                }
                else
                {
                    eventSource = currentForm;
                    eventSourceType = _runtimeCallerType;
                }

                if (actionType === "Close")
                {
                    closeTypeExecution(behaviour);
                }

                if (checkExistsNotEmpty(eventSource) && checkExistsNotEmpty(eventSourceType))
                {
                    var currentWindow = window;

                    var handleSubmitEvent = function ()
                    {
                        handleEvent(eventSource, eventSourceType, currentMethod, null, actionInstanceID, null, behaviour, null, null, null, null, loopContextID);
                    };

                    var masterRuntimeWindow = SourceCode.Forms.Runtime.getMasterRuntimeWindow();
                    var mobileBridgeDeferredPromise = masterRuntimeWindow.SourceCode.Forms.Runtime.MobileBridge.startFormSubmit().done(function ()
                    {
                        // Raise the event to allow execution of the submit behavior(s).
                        handleSubmitEvent.apply(currentWindow, []);
                    });

                    return mobileBridgeDeferredPromise;
                }

                return null;
        }
        //#endregion
    }
    if (!checkExists(SmartObjID) && checkExists(currentViewXML))
    {
        //defers back to the smartobject on which the view was built if no ObjectID is specified
        SmartObjID = currentViewXML.getAttribute("ContextID");
    }
    var modalizeView = true; //used to stop the runtime view modal from showing
    var skipExecution = false;

    var errorValue = "";
    while (errorValue.length === 0)
    {

        if (!checkExists(SmartObjID))
        {
            //extra sanity check for objectIDs
            errorValue = "emptySO";
            break;
        }

        var resultname = "Primary_" + SmartObjID + "_" + SmartObjID;
        if (checkExistsNotEmptyGuid(viewPrimarySmoID) && checkExistsNotEmptyGuid(SmartObjID) &&
            viewPrimarySmoID !== SmartObjID)
        {
            resultname = "External_" + SmartObjID + "_" + SmartObjID;
        }

        if (checkExists(currentControlID))
        {
            var includeComposite = null;
            if (specifiedResultName)
            {
                includeComposite = "True";
            }
            var association = new dataSourceLookup({ xmlDoc: currentViewXML, includeControllers: false, includeController: false, sourceControlID: currentControlID, isComposite: includeComposite }).getDataSource();
            if (checkExists(association))
            {
                resultname = association.getAttribute("ContextType") + "_" + association.getAttribute("ContextID") + "_" + SmartObjID;
            }
        }

        var jsonObject = { guid: SmartObjID, resultName: resultname, method: { name: currentMethod } };

        var windowToUseForSource = originalWindow; //context already specified outside, plus sourcevalues also does a check to get values from correct window instance

        var actualvalue = null;
        var invalidFields = [];
        var outstandingParameters = [];
        var methodParameters = [];

        //inspects parameters
        var parameters = $mn(currentAction, "Parameters/Parameter");

        //loop through action parameters and add properties
        var p = parameters.length;
        while (p--)
        {
            var currentParam = parameters[p];
            //#region
            var source = currentParam.getAttribute("SourceID");  //always field/parameter sourcetype
            var target = currentParam.getAttribute("TargetID"); //always property/parameter sourcetype
            var isRequired = currentParam.getAttribute("IsRequired");
            var sourceCleared = false;
            var sourcetype = currentParam.getAttribute("SourceType");
            var targettype = currentParam.getAttribute("TargetType");
            var sourceInstanceID = currentParam.getAttribute("SourceInstanceID");
            var targetInstanceID = currentParam.getAttribute("TargetInstanceID");
            var actualValue = $sn(currentParam, "ActualValue");
            var sourceValue = $sn(currentParam, "SourceValue");

            //used with dependant dropdowns
            if (checkExists(actualValue))
            {
                actualvalue = actualValue.text;
            }
            if (((checkExists(sourceValue) && sourcetype !== "Value") || checkExists(actualValue)) && methodExecuted === "OnChange")
            {
                //reset persisted definition-- dependent dropdowns
                // similar to change in getActionsWithControlAsResult (where action is not cloned when actual/sourcevalues are set) in Depend.js
                // only non-cloned actual/source values will be removed here so further executions can take place properly
                //only use this check on sourceValue if the sourcetype was not value (in dependent dropdown concept it would always be control)

                //clear main definition
                var actualXP = "Events/Event[@SourceType='Control'][Name/text()='OnChange']/Handlers/Handler/Actions/Action/Parameters/Parameter[@SourceID='" + source + "'][@SourceType='" + sourcetype + "'][@TargetID='" + target + "'][@TargetType='" + targettype + "'][(ActualValue) or (SourceValue)]";
                var actualValueParam = $sn(formBindingXml, actualXP);
                var sv, av;
                if (checkExists(actualValueParam))
                {
                    sv = $sn(actualValueParam, "SourceValue");
                    av = $sn(actualValueParam, "ActualValue");
                    if (checkExists(sv))
                    {
                        actualValueParam.removeChild(sv);
                    }
                    if (checkExists(av))
                    {
                        actualValueParam.removeChild(av);
                    }
                }

                //clear current cloned version
                sv = $sn(currentParam, "SourceValue");
                av = $sn(currentParam, "ActualValue");
                if (checkExists(sv))
                {
                    currentParam.removeChild(sv);
                }
                if (checkExists(av))
                {
                    currentParam.removeChild(av);
                }
            }

            var context = null;
            if (sourcetype === "MethodParameter")
            {
                context = new parameterContext(ViewID, SmartObjID, currentMethod);
            }
            var sourceCounter = rowCounter;
            if (checkExists(sourceCounter) && sourcetype === "ViewField" && checkExists(targetInstanceID) && checkExists(sourceInstanceID) && targetInstanceID !== sourceInstanceID)
            {
                //fix for case where counter values are executed but the source & target instances don't match up (TFS 193650)
                //example: using a selected item on a one list view as part of a collective list execution on another view
                //will only influence on page level
                //also verified with single save scenario, many to many scenario should still work - (single instance of the view)
                sourceCounter = null;
            }
            sourceValue = windowToUseForSource.returnSourceValue({ item: currentParam, counter: sourceCounter, context: context, specifiedResultName: specifiedResultName, returnNulls: true, loopContextID: loopContextID, behaviour: behaviour });
            var sourceCouldNotBeFound = false;
            if (!checkExists(sourceValue) || sourceValue.length === 0)
            {
                if (!checkExists(sourceValue))
                {
                    sourceCouldNotBeFound = true;
                    sourceValue = "";
                }
                sourceCleared = true;
            }

            if (TypeOfView === "List" && !checkExists(targetcontrolid))
            {
                var previousValue = $sn(currentParam, "PreviousValue");
                if (sourceCouldNotBeFound && checkExists(previousValue))
                {
                    sourceValue = previousValue.text;
                    sourceCleared = false;
                }
                else
                {
                    if (checkExists(previousValue))
                    {
                        currentParam.removeChild(previousValue); //remove the previously set value
                    }
                    previousValue = currentParam.ownerDocument.createElement("PreviousValue");
                    previousValue.appendChild(currentParam.ownerDocument.createTextNode(sourceValue));
                    currentParam.appendChild(previousValue);
                }
            }

            if (sourcetype === "MethodParameter" && isRequired === "true")
            {
                var sourceArray = [source, sourceValue, isRequired];
                methodParameters.push(sourceArray);
            }

            //#region IsRequired
            if (isRequired === "true")
            {
                if (sourceValue.length === 0 || !checkExists(sourceValue) || sourceCleared === true)
                {

                    switch (sourcetype)
                    {
                        case "ViewField":
                            var field = returnFieldAttributeObject(source, sourceInstanceID);
                            if (checkExistsNotEmpty(field.name))
                            {
                                invalidFields.push(field.name);
                            }
                            else
                            {
                                if (targettype === "ObjectProperty" || targettype === "MethodParameter")
                                {
                                    invalidFields.push(target);
                                }
                                else
                                {
                                    invalidFields.push(source + " (missing)"); //last fallback for debugging purposes
                                }
                            }
                            break;
                        case "MethodParameter":
                            //have to get the friendly name of the parameter from the smartobject as well... maybe in the definition?
                            sourceValue = "";
                            outstandingParameters.push(source);
                            break;
                        case "Control":
                            var control = _runtimeControllerFindObject({ controlID: source });
                            if (control)
                            {
                                invalidFields.push(control.getAttribute("Name"));
                            }
                            else
                            {
                                if (targettype === "ObjectProperty" || targettype === "MethodParameter")
                                {
                                    invalidFields.push(target);
                                }
                                else
                                {
                                    invalidFields.push(source + " (missing)"); //last fallback for debugging purposes
                                }

                            }
                            break;
                    }
                }
            }
            //#endregion

            switch (targettype)
            {
                case "ObjectProperty":
                    var propertyValue = {};

                    var originalParameter = currentParam.cloneNode(true);
                    var emptyField = false;

                    if (sourcetype === "Value" && checkExists(returnXMLPackage) && returnXMLPackage === true) //single save where combined resultmappings is used to set a property's value
                    {
                        if ($sn(originalParameter, "SourceValue"))
                        {
                            var multipleValues = $mn(originalParameter, "SourceValue/*[@SourceType='ViewField']");
                            if (multipleValues.length > 0)
                            {
                                var evaluateFieldForReplacement = false;
                                for (var m = 0; m < multipleValues.length; m++)
                                {
                                    var fieldObject = returnFieldAttributeObject(multipleValues[m].getAttribute("SourceID"), multipleValues[m].getAttribute("SourceInstanceID"));
                                    if (checkExists(fieldObject))
                                    {
                                        //all exclusion criteria for single save and other cases where the current mapped value might not be in the same scope
                                        //if any replacement doesn't happen as expected especially around combined values, this should probably be adapted/extended
                                        //the areas excluded below are simply to limit unnecessary checks on the server
                                        //prior to the JSON changes this would have given errors in some cases anyway when the parameter contained combined Source value
                                        if (
                                            fieldObject.instanceID != originalParameter.getAttribute("TargetInstanceID")//single save
                                            && (!checkExists(ViewID) || fieldObject.viewID != ViewID)//single save
                                            && (!checkExists(SmartObjID) || fieldObject.parentID != SmartObjID)//single save/composite
                                        )
                                        {
                                            evaluateFieldForReplacement = true;
                                        }
                                    }

                                    if (evaluateFieldForReplacement)
                                    {
                                        var tempCounter = sourceCounter;
                                        if (checkExists(sourceCounter) && checkExists(targetInstanceID) && checkExists(multipleValues[m].getAttribute("SourceInstanceID")) && targetInstanceID !== multipleValues[m].getAttribute("SourceInstanceID"))
                                        {
                                            //similar to fix above
                                            tempCounter = null;
                                        }

                                        var fieldValue = windowToUseForSource.returnSourceValue({ item: multipleValues[m], counter: tempCounter, context: context, specifiedResultName: specifiedResultName, returnNulls: true, loopContextID: loopContextID, behaviour: behaviour });
                                        if (!checkExists(fieldValue) || fieldValue.length === 0)
                                        {
                                            emptyField = true;
                                            sourceCleared = true;
                                            break;
                                        }
                                    }
                                }
                                if (emptyField)
                                {
                                    propertyValue.multipleValues = determineMultiValueMapping(originalParameter, loopContextID, behaviour, null, sourceCounter, context, specifiedResultName, true);
                                }
                            }
                        }
                    }

                    if (sourceCleared)
                    {
                        if ((sourcetype === "ViewField" && checkExists(returnXMLPackage) && returnXMLPackage === true) || emptyField === true)  //emptyField implies that source is a value but one of the fields used was empty
                        {
                            invalidFields.pop();
                            // (this is to facilitate complex result mappings) - get the correct value to map to on the other end (this replaces the resultfield functionality)
                            propertyValue.parameter =
                                {
                                    sourceType: originalParameter.getAttribute("SourceType"),
                                    sourceId: originalParameter.getAttribute("SourceID"),
                                    sourcePath: originalParameter.getAttribute("SourcePath"),
                                    sourceInstanceID: originalParameter.getAttribute("SourceInstanceID"),
                                    sourceSubFormID: originalParameter.getAttribute("SourceSubFormID"),
                                    targetType: originalParameter.getAttribute("TargetType"),
                                    targetId: originalParameter.getAttribute("TargetID"),
                                    targetPath: originalParameter.getAttribute("TargetPath"),
                                    targetInstanceID: originalParameter.getAttribute("TargetInstanceID"),
                                    targetSubFormID: originalParameter.getAttribute("TargetSubFormID")
                                }
                        }
                        if (!emptyField)
                        {
                            propertyValue.cleared = sourceCleared.toString();
                        }
                    }
                    else
                    {
                        propertyValue.value = sourceValue;
                    }
                    if (!checkExists(jsonObject.properties))
                    {
                        jsonObject.properties = {};
                    }
                    jsonObject.properties[target] = propertyValue;
                    break;
                case "MethodParameter":
                    if (!checkExists(sourceValue) || sourceValue.length === 0)
                    {
                        var actionEvaluatedForParamsPreviously = currentAction.getAttribute("ParametersEvaluated");
                        if (actionEvaluatedForParamsPreviously !== "true")
                        {
                            var addParameter = true;
                            // check if parameter have been added already
                            var paramsLength = methodParameters.length;
                            if (paramsLength > 0)
                            {
                                for (var paramIndex = 0; paramIndex < paramsLength; paramIndex++)
                                {
                                    if (methodParameters[paramIndex][0] === target)
                                    {
                                        addParameter = false;
                                        break;
                                    }
                                }
                            }
                            if (addParameter && isRequired === "true")
                            {
                                sourceValue = getHiddenParameter(ViewID, SmartObjID, target, currentMethod);
                                var sourceArray = [target, sourceValue, isRequired];
                                methodParameters.push(sourceArray);
                            }
                        }
                    }
                    else
                    {
                        //update the parameter value so that it can be stored in the hiddens
                        setHiddenJSONValue(SmartObjID, "Object", ViewID, null, null, null, currentMethod, null, null, null, target, "MethodParameter", sourceValue);
                    }
                    if (checkExistsNotEmpty(sourceValue))
                    {
                        if (!checkExists(jsonObject.parameters))
                        {
                            jsonObject.parameters = {};
                        }
                        jsonObject.parameters[target] = { value: sourceValue };
                    }
                    break;
            }
            //#endregion
        }

        //#region IsRequired
        var bContinue = true;
        if (invalidFields.length > 0)
        {
            warnOfEmptyFields(invalidFields);
            bContinue = false;
        }
        else if (methodParameters.length > 0)
        {
            var actionEvaluatedForParamsPreviously = currentAction.getAttribute("ParametersEvaluated");
            if (((actionEvaluatedForParamsPreviously === "false") && (methodParameters.length > 0)) || (!checkExists(actionEvaluatedForParamsPreviously)))
            {
                promptForSOParameters(currentMethod, methodParameters, ViewID, SmartObjID, currentAction, rowCounter, actionType, returnXMLPackage, behaviour, actionInstanceID);
                bContinue = false;
            }
            else if ((actionEvaluatedForParamsPreviously === "true") && (methodParameters.length === 0))
            {
                currentAction.removeAttribute("ParametersEvaluated");
            }
        }
        else if (methodParameters.length === 0)
        {
            currentAction.removeAttribute("ParametersEvaluated");
        }
        if (bContinue === false)
        {
            errorValue = "emptyRequiredValues";
            break;
        }
        //#endregion

        //use the result where list inits are run on controls like dropdown to specify the target
        var targetcontrolid;
        //inspects results
        var results = $mn(currentAction, "Results/Result");
        var r = results.length;

        //loop through results and add properties
        if (r > 0)
        {
            var resultArray = [];
            while (r--)
            {
                //#region
                var currentResult = results[r];
                var resultTarget = currentResult.getAttribute("TargetID");
                var resultTargetInstanceID = currentResult.getAttribute("TargetInstanceID");
                var resultTargetType = currentResult.getAttribute("TargetType");
                var resultSourceType = currentResult.getAttribute("SourceType");
                var resultSourceID = currentResult.getAttribute("SourceID");
                var resultSourceInstanceID = currentResult.getAttribute("SourceInstanceID");
                var resultSourceValue = "";
                if (resultSourceType === "Value")
                {
                    var sourceValue = $sn(currentResult, "SourceValue");
                    if (checkExists(sourceValue) && checkExistsNotEmpty(sourceValue.xml))
                    {
                        resultSourceValue = sourceValue.xml;
                    }
                }
                if (checkExists(resultTarget) && resultTargetType === "Control" && resultSourceType !== "ObjectProperty" && resultSourceType !== "Value") //resultmappings
                {
                    targetcontrolid = resultTarget;
                }
                var resultValue = { targetID: resultTarget, targetType: resultTargetType, sourceType: resultSourceType, sourceID: resultSourceID, sourceInstanceID: resultSourceInstanceID, targetInstanceID: resultTargetInstanceID };
                if (checkExistsNotEmpty(resultSourceValue))
                {
                    resultValue.sourceValue = resultSourceValue;
                }
                resultArray.push(resultValue);
                //#endregion
            }

            if (resultArray.length > 0)
            {
                jsonObject.results = resultArray;
            }
        }

        var needAssociations = false;
        if (checkExists(ViewID))
        {
            var checkXP = null;

            if (!checkExists(rowCounter) && checkExists(currentControlID))//population of dropdown controls in editable lists, work on the same principle as the item view, so this applies to all types
            {
                //check for associations where a control has a different display smartobject, then we know we will need to add the possibility of the join below (added the IsComposite check, because there the DisplaySO is always set)
                checkXP = "[@SourceControlID='" + currentControlID + "' and (@DisplaySO)][not(@IsComposite)]";
            }
            else if (TypeOfView !== "Capture") //we include joins for list views except for above case
            {
                needAssociations = true;
            }
            else if (!checkExists(rowCounter) && !checkExists(currentControlID))
            {
                //check for associations where a parentcontrol or composite will be used, then we know we need to add the possibility of the join below, else it is just a simple execute
                checkXP = "[(@ParentControlID) or (@IsComposite)]";
            }

            if (checkExists(checkXP))
            {
                var associationNeededNode = $sn(viewControllerDefinition, "Controllers/Controller[@ID='" + ViewID + "']" + instanceXP + "/Associations/Association[not(@RootSO)]" + checkXP);
                if (checkExists(associationNeededNode))
                {
                    needAssociations = true;
                }
            }
        }

        if (needAssociations)
        {
            //build associations if relevant
            var originalContextID = null;
            if (!checkExists(currentControlID))
            {
                originalContextID = SmartObjID;
            }
            var controlDisplayTemplate = null;
            if (TypeOfView !== "Capture" && !checkExists(currentControlID))
            {
                controlDisplayTemplate = true;
            }
            var viewAssoc = new dataSourceLookup({ xmlDoc: viewControllerDefinition, selectMultiple: true, controllerID: ViewID, instanceXP: instanceXP, notRootSO: true, sourceControlID: currentControlID, originalContextID: originalContextID, controlDisplayTemplate: controlDisplayTemplate }).getDataSource();
            buildAssociationsForPackage(viewAssoc, jsonObject);
        }
        //var brokerPackageXML = null;
        var method = jsonObject.method.name;
        //filters - according to list type views (with ordering capabilities) and action setup
        //action filtering
        //#region
        var actionFilter = $sn(currentAction, "Filter");  //mapping filters
        if (actionFilter && actionFilter.hasChildNodes())
        {
            actionFilter = actionFilter.cloneNode(true);
            var brokerPackageXml = $xml("<Filters/>");
            var filterValueXML = inspectAndReplaceFilterXml(actionFilter.childNodes[0], brokerPackageXml, resultname, windowToUseForSource, loopContextID);
            if (filterValueXML.hasChildNodes()) //last check is for empty filter node that is added for no reason in the designtime
            {
                brokerPackageXml.documentElement.appendChild(filterValueXML);
                jsonObject.method.filter = brokerPackageXml.xml;
            }
        }
        //#endregion	

        //#region
        //action ordering
        var actionOrder = $sn(currentAction, "Order");  //mapping orders
        if (actionOrder && actionOrder.hasChildNodes())
        {
            inspectAndReplaceSortingXml(actionOrder.childNodes[0].cloneNode(true), jsonObject, resultname);
        }
        //#endregion

        var pageNumber = "";
        var orderBy = "";
        var orderByResultName = "";
        var orderDirection = "";
        var pageSize = null;

        if (TypeOfView === "List" && !checkExists(targetcontrolid) && !checkExists(currentControlID))
        {
            //normal filtering on list type views
            var filterResult = buildFilterForPackage(ViewID, viewMainTableName, jsonObject, actionInstanceID, resultname, windowToUseForSource, loopContextID);
            if (filterResult === false)
            {
                //stop execution right here - something was wrong with the  filter supplied, a message was already shown
                errorValue = "filterFailed";
                break;
            }

            var viewTable = document.getElementById(viewMainTableName);
            if (checkExists(viewTable))
            {
                orderBy = viewTable.getAttribute("OrderBy");
                orderByResultName = viewTable.getAttribute("OrderByResultName");
                orderDirection = viewTable.getAttribute("OrderDirection");

                var exportToExcelData = getExportToExcelData({ viewId: ViewID, instanceId: actionInstanceID });

                if (exportToExcelData.busyExporting !== true)
                {
                    pageSize = viewTable.getAttribute("PageSize");
                    if (checkExists(pageSize) && pageSize.length > 0)
                    {
                        //#region
                        var isPaging = viewTable.getAttribute("Paging");
                        if (!isPaging || isPaging === "false")
                        {
                            viewTable.removeAttribute("PageNumber");
                        }
                        viewTable.removeAttribute("Paging");
                        pageNumber = viewTable.getAttribute("PageNumber");
                        if (!checkExists(pageNumber) || pageNumber.length === 0)
                        {
                            pageNumber = "1";
                        }
                        //#endregion
                    }
                }
                else
                {
                    if (checkExistsNotEmpty(exportToExcelData.pageSize))
                    {
                        pageSize = exportToExcelData.pageSize.toString();
                    }

                    if (checkExistsNotEmpty(exportToExcelData.pageNumber))
                    {
                        pageNumber = exportToExcelData.pageNumber.toString();
                    }
                }

                var actionXml = currentAction.xml;
                if (actionType === "Close")
                {
                    actionXml = currentAction.cloneNode(true);
                    actionXml.setAttribute("Type", "Execute");
                    actionXml = actionXml.xml;
                }
                viewTable.setAttribute("previousactionxml", actionXml);
            }
        }
        else // just always do sorting
        {
            if (!checkExists(targetcontrolid)) targetcontrolid = currentAction.getAttribute("ControlID");
            if (checkExists(targetcontrolid))
            {
                var isSortingApplied = (checkExists(jsonObject.method.sorters) && jsonObject.method.sorters.length > 0);
                try
                {
                    if (!isSortingApplied)
                    {
                        var assoc = new dataSourceLookup({ xmlDoc: currentViewXML, includeControllers: false, includeController: false, sourceControlID: targetcontrolid }).getDataSource();
                        if (checkExists(assoc))
                        {
                            orderBy = assoc.getAttribute("DisplayTemplate");
                            if (checkExists(orderBy))
                            {
                                orderBy = returnDisplayPropertyFromTemplate(orderBy);
                                orderDirection = "ascending";
                                var ObjectID = assoc.getAttribute("DisplaySO") ? assoc.getAttribute("DisplaySO") : assoc.getAttribute("AssociationSO");
                                orderByResultName = (assoc.getAttribute("ContextType") + '_' + assoc.getAttribute("ContextID") + '_' + ObjectID);
                            }
                        }
                    }
                }
                catch (ex)
                {

                }
            }
        }

        var skipSettingItemsDueToItemState = false;

        if (checkExists(currentControlID) && !targetcontrolid)
        {
            //many to many scenario
            var itemState = currentAction.getAttribute("ItemState");
            skipSettingItemsDueToItemState = !checkExists(itemState) || itemState.toUpperCase() !== "ALL";
            targetcontrolid = currentControlID;
        }

        //sorting
        if (checkExists(orderBy) && orderBy.length > 0)//UI ordering on table or default ordering on listing controls
        {
            constructSortingStructure(jsonObject, orderBy, orderByResultName, orderDirection);
        }

        //add metadata
        var metadata = buildMetadataObject(ViewID, currentMethod, TypeOfView, targetcontrolid, actualvalue, rowCounter, pageNumber, pageSize, actionInstanceID, SmartObjID);

        if (checkExists(jsonObject))
        {
            jsonObject = { smartobject: jsonObject, metadata: metadata };
        }

        var jsonObjectArray = [jsonObject];

        if (checkExists(targetcontrolid) && !skipSettingItemsDueToItemState)
        {
            var currentControl = _runtimeControllerFindObject({ controlID: targetcontrolid, propertySearch: "SettingItems" });

            // if there are no results, we don't populate the control with the data from the server.
            // BUT, if the actionType is PopulateControl, then will filter and the preloaded clientside, and populate the control with that. So then we do need the modalizer
            if (checkExists(currentControl) && (results.length > 0 || actionType === "PopulateControl"))
            {
                _runtimePresetControls.push(targetcontrolid);
                var objInfo = new PopulateObject(null, null, targetcontrolid, null, null, jsonObject);
                objInfo.brokerPackageXML = jsonObjectArray;//picker controls
                var settingResult = executeControlFunction(currentControl, "SettingItems", objInfo);
                if (settingResult && Array.isArray(settingResult))//some controls manipulate the resulting broker package (picker etc)
                {
                    jsonObjectArray = settingResult;
                }
                //check if the modalizeView option was return and it was false before stopping the modal from showing
                modalizeView = (objInfo.modalizeView !== false);
                skipExecution = (objInfo.skipExecution === true);
            }
        }

        errorValue = "passed";
        break;
    }

    if (errorValue === "emptyRequiredValues" || errorValue === "filterFailed")
    {
        return null;//this is to keep backwards compatibility in terms of continuing and errors shown
    }

    //do all the extra "events" after the actual method was executed
    if (actionType === "Close")
    {
        closeTypeExecution(behaviour);
    }

    if (errorValue == "emptySO")
    {
        //no execution can take place, but behaviour continuation/result logic should fire as expected
        //piggy back on logic already provided below
        skipExecution = true;

    }

    if (checkExists(jsonObject) > 0 && skipExecution === false)
    {
        SFLog({ type: 1, source: "executeEventActionOnWindow", category: "Events", message: "Smartobject executing {0}", parameters: [currentMethod], data: jsonObject });
    }


    if (checkExists(returnXMLPackage) && (returnXMLPackage === true))
    {
        if (skipExecution === true)
        {
            return "";
        }
        if (checkExists(jsonObject) && checkExists(ViewID))
        {
            runtimeBusyView(ViewID, true, true, actionInstanceID);
        }
        return jsonObject;
    }
    else
    {
        if (skipExecution === true)
        {
            setTimeout(function ()
            {
                removeLoopContextData({ loopContextID: loopContextID });

                if (checkExists(behaviour))
                {
                    behaviour.isExecuting = false;
                    behaviour.executeBehaviour(); //correct usage
                }
            }, 0);
            return;
        }
        //send the packet
        if (checkExists(ViewID) && modalizeView)
        {
            runtimeBusyView(ViewID, true, true, actionInstanceID);
        }

        return sendPacket(jsonObjectArray, behaviour, [currentAction]);
    }
    //#endregion
}

//helper function to build associations for jsonObject
function buildAssociationsForPackage(viewAssoc, jsonObject)
{
    //#region
    if (checkExists(viewAssoc))
    {
        var v = viewAssoc.length;
        if (v == 0)
        {
            return;
        }
        jsonObject.associations = [];

        while (v--)
        {
            var association = {};
            var currentAssoc = viewAssoc[v];
            if (checkExistsNotEmpty(currentAssoc.getAttribute("AssociationMethod")))
            {
                association.AssociationMethod = currentAssoc.getAttribute("AssociationMethod");
            }
            if (checkExistsNotEmpty(currentAssoc.getAttribute("ValueProperty")))
            {
                association.ValueProperty = currentAssoc.getAttribute("ValueProperty");
            }
            if (checkExistsNotEmpty(currentAssoc.getAttribute("DisplayTemplate")))
            {
                association.DisplayTemplate = currentAssoc.getAttribute("DisplayTemplate");
            }
            if (checkExistsNotEmpty(currentAssoc.getAttribute("AssociationSO")))
            {
                association.AssociationSO = currentAssoc.getAttribute("AssociationSO");
            }
            if (checkExistsNotEmpty(currentAssoc.getAttribute("AssociatedJoinProperty")))
            {
                association.AssociatedJoinProperty = currentAssoc.getAttribute("AssociatedJoinProperty");
            }
            if (checkExistsNotEmpty(currentAssoc.getAttribute("DisplaySO")))
            {
                association.DisplaySO = currentAssoc.getAttribute("DisplaySO");
            }
            if (checkExistsNotEmpty(currentAssoc.getAttribute("DisplayMethod")))
            {
                association.DisplayMethod = currentAssoc.getAttribute("DisplayMethod");
            }
            if (checkExistsNotEmpty(currentAssoc.getAttribute("DisplayJoinProperty")))
            {
                association.DisplayJoinProperty = currentAssoc.getAttribute("DisplayJoinProperty");
            }
            if (checkExistsNotEmpty(currentAssoc.getAttribute("IsComposite")))
            {
                association.IsComposite = currentAssoc.getAttribute("IsComposite");
            }
            if (checkExistsNotEmpty(currentAssoc.getAttribute("ParentControlID")))
            {
                association.ParentControlID = currentAssoc.getAttribute("ParentControlID");
            }
            if (checkExistsNotEmpty(currentAssoc.getAttribute("ParentJoinProperty")))
            {
                association.ParentJoinProperty = currentAssoc.getAttribute("ParentJoinProperty");
            }
            if (checkExistsNotEmpty(currentAssoc.getAttribute("ChildJoinProperty")))
            {
                association.ChildJoinProperty = currentAssoc.getAttribute("ChildJoinProperty");
            }
            if (checkExistsNotEmpty(currentAssoc.getAttribute("ContextID")))
            {
                association.ContextID = currentAssoc.getAttribute("ContextID");
            }
            if (checkExistsNotEmpty(currentAssoc.getAttribute("ContextType")))
            {
                association.ContextType = currentAssoc.getAttribute("ContextType");
            }

            if (checkExistsNotEmpty(currentAssoc.getAttribute("OriginalProperty")))
            {
                association.OriginalProperty = currentAssoc.getAttribute("OriginalProperty");
            }
            if (checkExistsNotEmpty(currentAssoc.getAttribute("OriginalContextID")))
            {
                association.OriginalContextID = currentAssoc.getAttribute("OriginalContextID");
            }
            if (checkExistsNotEmpty(currentAssoc.getAttribute("OriginalContextType")))
            {
                association.OriginalContextType = currentAssoc.getAttribute("OriginalContextType");
            }
            if (checkExistsNotEmpty(currentAssoc.getAttribute("SourceControlID")))
            {
                association.SourceControlID = currentAssoc.getAttribute("SourceControlID");
            }
            if (checkExistsNotEmpty(currentAssoc.getAttribute("ControlID")))
            {
                association.ControlID = currentAssoc.getAttribute("ControlID");
            }

            if (checkExistsNotEmpty(currentAssoc.getAttribute("FilterProperty")))
            {
                association.FilterProperty = currentAssoc.getAttribute("FilterProperty");
            }
            jsonObject.associations.push(association);
        }
    }
    //#endregion
}

function determineMultiValueMapping(parameterNode, loopContextID, behaviour, customProcessData, counter, context, specifiedResultName, returnNulls, targetInstanceID)
{
    var results = [];
    var multipleValues = $mn(parameterNode, "SourceValue/Source");
    if (multipleValues.length === 0)
    {
        multipleValues = $mn(parameterNode, "SourceValue/Item");
    }

    if (multipleValues.length > 0)
    {
        for (var i = 0; i < multipleValues.length; i++)
        {
            var itemNode = multipleValues[i];
            var tempCounter = counter;
            if (checkExists(counter) && checkExists(targetInstanceID) && checkExists(itemNode.getAttribute("SourceInstanceID")) && targetInstanceID !== itemNode.getAttribute("SourceInstanceID"))
            {
                tempCounter = null;
            }

            var currentValue = returnSourceValue({ item: itemNode, customProcessData: customProcessData, counter: tempCounter, context: context, specifiedResultName: specifiedResultName, returnNulls: returnNulls, loopContextID: loopContextID, behaviour: behaviour });
            if (checkExistsNotEmpty(currentValue))
            {
                var previous = results[results.length - 1];
                if (typeof (previous) === "string")
                {
                    results[results.length - 1] = previous.concat(currentValue);
                }
                else
                {
                    results.push(currentValue);
                }
            }
            else
            {
                var valueJson = {
                    sourceType: itemNode.getAttribute("SourceType"),
                    sourceId: itemNode.getAttribute("SourceID"),
                    sourcePath: itemNode.getAttribute("SourcePath"),
                    sourceInstanceID: itemNode.getAttribute("SourceInstanceID"),
                    sourceSubFormID: itemNode.getAttribute("SourceSubFormID")
                };
                results.push(valueJson);
            }
        }
    }
    return results;
}

//execute a normal method on the collective lists - but it will only be sent through once
function executeCollectiveListMethod(currentAction, methodExecuted, actionType, returnXMLPackage, itemState, behaviour)
{
    //#region
    var loopContextID = getLoopContextID(currentAction);

    var innerXmlPackage = [];
    var viewID = currentAction.getAttribute("ViewID");
    var instanceID = currentAction.getAttribute("InstanceID");
    var viewContextID = null;
    var mainTable = null;
    var viewDef = getViewDefinition(viewID, instanceID);
    if (checkExists(viewDef))
    {
        mainTable = viewDef.getAttribute("MainTable");
        viewContextID = viewDef.getAttribute("ContextID");
        if (checkExists(mainTable) && mainTable.length > 0)
        {
            var table = jQuery("#" + mainTable);
            if (table[0].getAttribute("editable") === "true")
            {
                attemptItemChanges(table, viewID, instanceID, loopContextID, itemState);
            }
        }
    }

    var ObjectID = currentAction.getAttribute("ObjectID");
    var ControlID = currentAction.getAttribute("ControlID"); //many to many scenario with specific control that contains saving functionality
    if (!checkExists(ObjectID) || ObjectID.length === 0)
    {
        ObjectID = viewContextID;
        //extra null check if this was an unbound view
        if (!checkExists(ObjectID) || ObjectID.length === 0)
        {
            //if objectid can't be found - the default event action is attempted- all the necessary failsafes are already implemented there and this ensures that the correct execution will be done
            return executeEventAction(currentAction.cloneNode(true), methodExecuted, actionType);
        }
    }

    var results = null;
    var comparisonObj =
        {
            parentid: ObjectID,
            parenttype: "Object",
            counter: true,
            contexttype: "Primary",
            state: itemState
        };

    //added the true counter value for those who didn't specify - otherwise the currentNodes break (untested for the many to many scenario - can't use at the moment)

    var specifiedResultname = null;
    if (checkExists(ControlID))
    {
        comparisonObj = { parentid: ObjectID, parenttype: "Object", state: itemState, controlid: ControlID, counter: true };
        //many to many - get the control's values
        if (itemState.toLowerCase() === "unchanged")
        {
            comparisonObj = { parentid: ObjectID, parenttype: "Object", state: itemState, counter: true };
        }
        else
        {
            specifiedResultname = true;
        }
    }
    if (itemState.toLowerCase() === "selected")
    {
        var viewSelectedCounter = getLoopContextData({ loopContextID: loopContextID, viewID: viewID, instanceID: instanceID }).counter;

        if (!checkExists(viewSelectedCounter) && checkExists(mainTable) && mainTable.length > 0)
        {
            viewSelectedCounter = getViewSelectedCounter(mainTable);
        }

        if (checkExists(viewSelectedCounter))
        {
            comparisonObj = { parentid: ObjectID, parenttype: "Object", counter: viewSelectedCounter, contexttype: "Primary" };
        }
        else
        {
            comparisonObj = null;
        }
    }

    if (checkExists(comparisonObj))
    {
        var currentNodes = getHiddenPropertyCollection(viewID, instanceID, comparisonObj);
        var currentNodeLength = currentNodes.length;
        //check for implementation of separate object execution with itemstate values on an editable list
        //no currentNodes should exist, the viewContextID shouldn't match the original objectid and the control and selected cases as above is excluded from manipulating the xpath
        if ((!checkExists(currentNodes) || (currentNodeLength === 0)) && (checkExists(viewContextID) && viewContextID !== ObjectID) && (!checkExists(ControlID)) && (itemState.toLowerCase() !== "selected"))
        {
            comparisonObj = { parentid: viewContextID, parenttype: "Object", state: itemState, contexttype: "Primary", counter: true };
            currentNodes = getHiddenPropertyCollection(viewID, instanceID, comparisonObj);
            currentNodeLength = currentNodes.length;
        }

        if (checkExists(currentNodes) && currentNodeLength > 0)
        {
            var cn = currentNodeLength;
            for (var c = 0; c < cn; c++)
            {
                var rowCounter = currentNodes[c].counter;
                var executionResult = executeEventAction(currentAction.cloneNode(true), methodExecuted, actionType, true, rowCounter, null, specifiedResultname);
                if (checkExists(executionResult))
                {
                    innerXmlPackage.push(executionResult);
                }
            }

            if (checkExists(returnXMLPackage) && returnXMLPackage === true)
            {
                //return this to the parent event
                return innerXmlPackage;
            }
            else
            {
                var batchedActions = extendBatchedActions([], innerXmlPackage, currentAction);
                //this is the combined packet of all the list's execution events
                sendPacket(innerXmlPackage, behaviour, batchedActions);
            }
        }
        else if (checkExists(returnXMLPackage) && returnXMLPackage === true)
        {
            //return this to the parent event
            return "";
        }
        else
        {
            endActionExecution({ loopContextID: loopContextID, behaviour: behaviour });
        }
    }
    else if (checkExists(returnXMLPackage) && returnXMLPackage === true)
    {
        //return this to the parent event
        return "";
    }
    else
    {
        endActionExecution({ loopContextID: loopContextID, behaviour: behaviour });
    }

    //#endregion
}

//extends batched actions based on the number of brokerpackages in current resultset
function extendBatchedActions(batchedActions, brokerpackageXml, currentAction)
{
    if (!checkExists(batchedActions))
    {
        batchedActions = [];
    }

    if (checkExists(currentAction) && checkExists(brokerpackageXml))
    {
        var brokerCounter = 0;
        if (typeof (brokerpackageXml) === "string")
        {
            var brokerExpression = new RegExp("<brokerpackage>", "gi");//global throughout package, ignoring case to play it safe
            brokerCounter = brokerpackageXml.match(brokerExpression).length;
        }
        else if (checkExists(brokerpackageXml.xml))//check for xml to allow for extended usage only if object functionality matches
        {
            var brokerNodes = $mn(brokerpackageXml, "//brokerpackage");
            brokerCounter = brokerNodes.length;
        }
        else
        {
            brokerCounter = brokerpackageXml.length;//array of json objects
            if (!checkExists(brokerCounter))//single object (batched WF/SO execution)
            {
                brokerCounter = 1;
            }
        }
        if (brokerCounter > 0)
        {
            var clonedNode = currentAction.cloneNode(true);
            while (brokerCounter--)
            {
                batchedActions.push(clonedNode);
            }
        }
    }
    return batchedActions;
}

/* Builds the metadata section of the broker package */
function buildMetadataObject(id, methodexecuted, typeofview, idofcontrol, actualvalue, rowCounter, pageNumber, pageSize, instanceID, objectID)
{
    //#region
    var metadata = {};

    if (checkExistsNotEmpty(id))
    {
        metadata.id = id;
    }
    if (checkExistsNotEmpty(methodexecuted))
    {
        metadata.methodexecuted = methodexecuted;
    }
    if (checkExistsNotEmpty(typeofview))
    {
        metadata.typeofview = typeofview;
    }
    if (checkExistsNotEmpty(actualvalue))
    {
        metadata.actualvalue = actualvalue;
    }
    if (checkExistsNotEmpty(rowCounter))
    {
        metadata.rowcounter = rowCounter;
    }
    if (checkExistsNotEmpty(idofcontrol))
    {
        metadata.idofcontrol = idofcontrol; //optional -  this is when dependable object must be populated (the child);
    }
    if (checkExistsNotEmpty(pageNumber))
    {
        metadata.pagenumber = pageNumber;//pageNumber - used for paging in list views
    }
    if (checkExistsNotEmpty(pageSize))
    {
        metadata.pagesize = pageSize; //pageSize - used for paging in list views
    }
    if (checkExistsNotEmpty(instanceID))
    {
        metadata.instanceid = instanceID;
    }
    if (checkExists(objectID) && objectID.length > 0)
    {
        metadata.objectid = objectID;
    }
    return metadata;
    //#endregion
}

//test the formID values before navigating to the form with the relevant parameters
function navigateSimpleAction(currentAction, behaviour)
{
    //#region
    if (checkExists(currentAction.getAttribute("Url")) || checkExists(currentAction.getAttribute("FormID")))
    {
        //have to redirect to another form, pass through the persisted values as qs values or use the persistent framework once implemented
        currentAction.setAttribute("OldType", "Navigate");
        if (checkExists(currentAction.getAttribute("Method")) && currentAction.getAttribute("Method").length > 0)
        {
            currentAction.setAttribute("Type", "Execute");
        }
        else
        {
            currentAction.setAttribute("Type", "Transfer");
        }
        navigateAction(currentAction, true, behaviour);
        return;
    }
    //#endregion
}

//test the formID values before opening the form with the relevant parameters
function openAction(currentAction, behaviour)
{
    //#region
    //for TFS 297624 - form can't open itself in subform
    //	if (currentAction.getAttribute("FormID").toLowerCase() !== currentForm)
    //	{
    //have to redirect to another form, pass through the persisted values as qs values or use the persistent framework once implemented
    currentAction.setAttribute("OldType", "Open");
    if (checkExists(currentAction.getAttribute("Method")) && currentAction.getAttribute("Method").length > 0)
    {
        currentAction.setAttribute("Type", "Execute");
    }
    else
    {
        currentAction.setAttribute("Type", "Transfer");
    }
    navigateAction(currentAction, true, behaviour);
    return;
    //	}
    //#endregion
}

//close the opened window after all the transfers have taken place
function closeAction(currentAction)
{
    //#region
    var formID = currentAction.getAttribute("FormID");
    var level = parseInt(__runtimeFormLevel, 10);

    var windowToUse = SourceCode.Forms.Runtime.getMasterRuntimeWindow();
    if (checkExists(formID))
    {
        //transfer current values to parent form's values if applicable
        var parameters = $mn(currentAction, "Parameters/Parameter");
        var xmldoc = $xml(currentAction.xml);
        if (parameters.length > 0)
        {
            var loopContextID = getLoopContextID(currentAction);

            //loop through parameters and add properties
            for (var p = 0; p < parameters.length; p++)
            {
                var sourceValue = returnSourceValue({ item: parameters[p], loopContextID: loopContextID });
                if (checkExistsNotEmpty(sourceValue))
                {
                    var value = xmldoc.createElement("SourceValue");
                    value.appendChild(xmldoc.createTextNode(sourceValue));
                    parameters[p].appendChild(value);
                }
            }
        }

        var transferWindow = windowToUse;
        if (level > 1)
        {
            transferWindow = getPopupWindowOnLevel(windowToUse, (parseInt(level, 10) - 1));
        }
        transferWindow.dataTransferAction(currentAction);

        windowToUse.popupManager.closeLast();

    }
    else
    {
        if (level > 0)
        {
            windowToUse.popupManager.closeLast();
        }
        if (checkExists(windowToUse.dialogArguments) || checkExists(windowToUse.opener)) //either opened from showModalDialog or window.open in JS
        {
            windowToUse.close();
            if (windowToUse.closed === false && SourceCode.Forms.Runtime.MobileBridge.inMobileAppContext())
            {
                windowToUse.location = "about:blank";//if window can't be closed, use default redirecting behaviour
            }
        }
        else
        {
            windowToUse.location = "about:blank";//default redirecting behaviour if window can't be closed
        }
    }
    //#endregion
}

/* get the specific value from the field for the source
implemented so that data from other views can also be transferred to the source
*/
function getSourceFieldValue(FieldID, currentCounter, specifiedResultName, instanceID, returnNull, returnAccordingToType, loopContextID)
{
    //#region
    var sourceValue = "";
    var rowCounter = currentCounter; //used to reflect original counter when returning field according to type - no confusion between selected row and actual counter being sent in
    var field = returnFieldAttributeObject(FieldID, instanceID);

    if (field)
    {
        var viewType = field.viewType.toLowerCase();
        if (viewType === "list")
        {
            if (!checkExists(currentCounter))
            {
                var actualView = field.mainTable;
                if (checkExists(actualView) && document.getElementById(actualView).getAttribute("editable") !== "true")
                {
                    currentCounter = getLoopContextData({ loopContextID: loopContextID, viewID: field.viewID, instanceID: field.instanceID }).counter;
                    if (!checkExists(currentCounter))
                    {
                        currentCounter = getViewSelectedCounter(actualView);
                    }
                }
            }
        }
        else if (checkExists(currentCounter) && field.contextType !== "External") //TFS462577 - using item view field in editable list view expression - counter shouldn't apply & including fix for M2M checkboxlist
        {
            currentCounter = null;
        }
        sourceValue = getHiddenFieldValue(FieldID, currentCounter, null, specifiedResultName, field.instanceID, loopContextID);
    }
    if (!checkExists(sourceValue) && !returnNull)
    {
        sourceValue = "";
    }
    else if (checkExists(sourceValue) && sourceValue.length > 0 && returnAccordingToType)
    {
        var fieldPropertyType = field.propertyType;
        var text = sourceValue;
        var xdoc;
        switch (fieldPropertyType.toLowerCase())
        {
            case "file":
            case "image":
                var path = null;
                if (text.startsWith("<collection>"))
                {
                    var xpFileName = baseCollectionXPath + "/fields/field[@name='FileName']/value";
                    xdoc = $xml(text);
                    var filename = $sn(xdoc, xpFileName).text;
                    text = filename;
                    path = $sn(xdoc, baseCollectionXPath + "/fields/field[@name='FilePath']/value");
                }
                if (text.length > 0)
                {
                    valuetext = text;
                    var fileSrc;
                    if (path)
                    {
                        fileSrc = constructFileSrc(path.text, "path", fieldPropertyType.toLowerCase(), 100, 100, currentCounter);
                    }
                    else
                    {
                        fileSrc = constructFileSrc(FieldID, "field", fieldPropertyType.toLowerCase(), 100, 100, currentCounter);
                    }

                    if (fieldPropertyType.toLowerCase() === "image")
                    {
                        var counterText = "";
                        if (checkExists(rowCounter))
                        {
                            counterText = "' counter='" + rowCounter;
                        }
                        text = "<img class='fileImage' alt='" + text + "' title='" + text + "' src='" + fileSrc + counterText + "' />";
                    }
                    else
                    {
                        //only use the column id in the file + image types
                        //changes to allow the user to download the files from the list directly without going to the capture view
                        text = "<a path='" + fileSrc + "' class='fileImage'>" + text + "</a>";
                    }
                }
                break;
            case "hyperlink":
                text = reverseReplaceSpecialChars(text);
                if (text.startsWith("<a"))
                {
                    text = "<value>" + text + "</value>";
                }
                else
                {
                    text = textNode.xml;
                }
                if (text.length > 0)
                {
                    valuetext = text;
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
                        text = "<a target='_blank' href='" + link.htmlEncode() + "'>" + text.htmlEncode() + "</a>";
                    }
                }
                break;
            case "date":
            case "time":
            case "datetime":
                text = returnDateValue(sourceValue, fieldPropertyType.toLowerCase());
                break;
        }
        if (sourceValue !== text)
        {
            sourceValue = text;
        }
    }

    return sourceValue;
    //#endregion
}

// get the specific source value if the sourcetype is of type ControlField (used for value, display and isdefault properties of a list control bound to a static datasource)
function getControlFieldValue(SourceID, SourceInstanceID, ControlID, loopContextID)
{
    //#region
    var sourceValue = null;

    if (checkExistsNotEmpty(SourceID))
    {
        var viewDef = getViewDefinition(null, SourceInstanceID);

        if (checkExists(viewDef))
        {
            var viewID = viewDef.getAttribute("ID");

            var currentLoopContextData = getLoopContextData({ loopContextID: loopContextID, viewID: viewID, instanceID: SourceInstanceID, controlID: ControlID });

            if (checkExists(currentLoopContextData.item))
            {
                switch (SourceID.toUpperCase())
                {
                    case "ISDEFAULTSTATICFIELD":
                        sourceValue = checkExists(currentLoopContextData.item.isDefault) ? currentLoopContextData.item.isDefault : false;
                        break;
                    case "VALUESTATICFIELD":
                        sourceValue = currentLoopContextData.item.value;
                        break;
                    case "DISPLAYSTATICFIELD":
                        sourceValue = currentLoopContextData.item.display;
                        break;
                    default:
                        break;
                }
            }
        }
    }

    if (!checkExists(sourceValue))
    {
        sourceValue = "";
    }

    return sourceValue;
    //#endregion
}

//clear the values of the view's controls
function clearViewControls(ViewID, currentViewXML, doInits, InstanceID, linkedToFields, currentAction, resetControlValues, isEditable)
{
    //updated to handle specific field/control combinations and to do the reset of the control values if necessary
    //#region
    var loopContextID = getLoopContextID(currentAction);

    var controlsXpath = "Controls/Control[Properties/Property/Name/text()='SetValue']";
    if (isEditable)
    {
        controlsXpath += "[(@ControlTemplate='edit' or @ControlTemplate='display')]";
    }
    if (linkedToFields)
    {
        controlsXpath += "[(@FieldID)]";
    }
    if (checkExists(currentAction)) // from "Clear" method execution
    {
        var clearAllFields = true;
        //do the fields - technically this is not supposed to be surfaced, but since it is, we have to support it
        var results = $mn(currentAction, "Results/Result[@TargetType='ViewField']");
        var r = results.length;
        if (r > 0)
        {
            clearAllFields = false;
            while (r--)
            {
                setHiddenFieldValue(results[r].getAttribute("TargetID"), "", null, InstanceID, null, null, null, loopContextID);
            }
        }

        //do the controls
        results = $mn(currentAction, "Results/Result[@TargetType='Control']");
        r = results.length;
        if (r > 0)
        {
            clearAllFields = false;
            controlsXpath += "[";
            while (r--)
            {
                controlsXpath += "(@ID='" + results[r].getAttribute("TargetID") + "')";
                if (r > 0)
                {
                    controlsXpath += " or ";
                }
            }
            controlsXpath += "]";
        }

        if (clearAllFields) //clear all - standard behaviour - no result mappings specified
        {
            removeHiddenPropertyCollection(ViewID, null, null, null, false, false, null, InstanceID);//control data fields should not be cleared, just the values of the controls
        }
    }
    if (checkExists(currentViewXML))
    {
        var controlCollection = $mn(currentViewXML, controlsXpath);
        for (var z = 0; z < controlCollection.length; z++)
        {
            var currentControl = controlCollection[z];
            var ControlName = currentControl.getAttribute("ID");
            var objInfo = new PopulateObject(null, "", ControlName);
            //get the default value of the control - if applicable
            if (checkExists(resetControlValues) && resetControlValues === true && checkExists($sn(currentControl, "Properties/Property[Name/text()='GetDefaultValue']")))
            {
                //get the default value of the control - if applicable - minimizes loops and only apply to the relevant controls
                var defaultValue = executeControlFunction(currentControl, "GetDefaultValue", objInfo);
                if (checkExists(defaultValue) && defaultValue.length > 0)
                {
                    objInfo = new PopulateObject(null, defaultValue, ControlName);
                }
            }
            executeControlFunction(currentControl, "SetValue", objInfo);
            if (doInits === true)
            {
                //clear all dependants
                startClearingDependantParentValues(ControlName);
                handleEvent(ControlName, "Control", 'Init', null, InstanceID, null, null, null, null, null, null, loopContextID);
            }
        }
    }
    //#endregion
}

//displays warning of required fields
function warnOfEmptyFields(invalidFields)
{
    //#region
    //a simple popup warning of fields that are required before the method will be executed
    hideRuntimeInitSpinnerForWindow(window.self);
    var msgBody = Resources.Runtime.FieldsRequiredInfo;
    msgBody += "<br>";
    for (var x = 0; x < invalidFields.length; x++)
    {
        msgBody += "- " + invalidFields[x] + "<br>";
    }
    try
    {
        masterPopupManager.showError(msgBody);
    }
    catch (exc)
    {
        alert(msgBody);
    }
    finally
    {
        SFLog({ type: 5, source: "warnOfEmptyFields", category: "Events", message: Resources.RuntimeMessages.ErrorEmptyFields, parameters: [msgBody] });
    }
    //#endregion
}

/*  PARAMETER RELEVANT FUNCTIONALITY */
function promptForSOParameters(methodExecuted, outstandingParameters, ViewID, ObjectID, currentAction, rowCounter, actionType, returnXMLPackage, behaviour, instanceID)
{
    //#region
    //construct a simple popup where values can be entered for all the parameters for the current method
    //save the values
    var tempid = ObjectID + "_" + ViewID + "_" + methodExecuted;
    var containingDiv = jQuery("<div class=\"parameterPrompt\" id=\"parameterPrompt_" + tempid + "\"></div>");
    var controlid = "txt_param_" + tempid + "_";

    for (var x = 0; x < outstandingParameters.length; x++)
    {
        var isRequired = outstandingParameters[x].pop();
        var paramValue = outstandingParameters[x].pop();
        var paramName = outstandingParameters[x].pop();
        if (checkExists(paramName))
        {
            var ffstr = SCFormField.html({ label: paramName, required: (isRequired === "true"), forid: controlid + x.toString() });
            var formfield = jQuery(ffstr).appendTo(containingDiv);
            var textstr = SCTextbox.html({ id: controlid + x.toString() });
            var textbox = jQuery(textstr).appendTo(formfield.children(".form-field-element-wrapper")).textbox();
            var control = jQuery(".input-control", textbox);
            control.attr("parameter", paramName);
            control.attr("method", methodExecuted);
            control.attr("viewID", ViewID);
            control.attr("ObjectID", ObjectID);
            control.attr("IsRequired", isRequired);
            if (checkExists(paramValue) && paramValue.length > 0)
            {
                control[0].value = paramValue;
            }
        }
    }

    var arrayButtons = [{ type: "help", click: function () { HelpHelper.runHelp(7000); } }, { text: Resources.Runtime.OK, click: function () { closeParameterPromptAndExecuteEventAction(currentAction, methodExecuted, actionType, returnXMLPackage, rowCounter, behaviour, ViewID, tempid); } }, { id: "cancelParameterButton_" + tempid, text: Resources.Runtime.Cancel }];
    var options = {
        id: "requiredParameters_" + tempid,
        buttons: arrayButtons,
        headerText: Resources.Runtime.ValuesRequired,
        info: Resources.Runtime.ParametersRequiredInfo.format(methodExecuted),
        height: 300,
        width: 400,
        content: containingDiv,
        closeWith: "cancelParameterButton_" + tempid,
        onClose: function (popup, closeOptions)
        {
            //stop the relevant spinners so user can continue or reattempt execution
            popup.closed(closeOptions);
            if (!_runtimeInitSpinner)
            {
                runtimeBusyView(ViewID, false, false, instanceID);
            }
            else
            {
                hideRuntimeInitSpinnerForWindow(window.self);
            }
        },
        removeContent: true,
        cssClass: "id-required-parameters"
    };
    masterPopupManager.showPopup(options);

    var firstTextbox = document.getElementById(controlid + "0");
    if (firstTextbox)
    {
        jQuery(firstTextbox).trigger("focus");
        firstTextbox.focus();
    }
    //#endregion
}

//Parameter prompt OK button was clicked, persist the values + retry the execution of the action
function closeParameterPromptAndExecuteEventAction(currentAction, methodExecuted, actionType, returnXMLPackage, rowCounter, behaviour, viewID, tempID)
{
    //#region
    var result = constructParameterCache(methodExecuted, viewID, tempID);
    if (result === true) //stop the prompt from closing if the user did not complete values
    {
        masterPopupManager.closeLast();
        currentAction.setAttribute("ParametersEvaluated", "true");
        executeEventAction(currentAction, methodExecuted, actionType, returnXMLPackage, rowCounter, behaviour);
    }
    //#endregion
}

//inspects all relevant input for the parameters and cache these values - if Cancel was clicked, nothing would change
function constructParameterCache(methodExecuted, viewID, tempID)
{
    //#region
    var result = "";
    var parameters = jQuery("#parameterPrompt_" + tempID + " input");
    var bContinue = true;
    var plength = parameters.length;

    for (var l = 0; l < plength; l++)
    {
        var control = parameters[l];
        if (!checkExists(control.value) || control.value.length === 0)
        {
            if (control.getAttribute("IsRequired") === "true")
            {
                bContinue = false; //stop the prompt from closing
            }
        }
        else
        {
            setHiddenJSONValue(control.getAttribute("ObjectID"), "Object", control.getAttribute("viewID"), null, null, null, control.getAttribute("method"), null, null, null, control.getAttribute("parameter"), "MethodParameter", control.value);
        }
    }
    var paramresult = getHiddenParameterCollectionXml(viewID);
    if (checkExists(paramresult))
    {
        result = paramresult.xml;
    }
    persistViewParametersForUser(viewID, result);
    return bContinue;
    //#endregion
}
/*END PARAMETER RELEVANT FUNCTIONALITY */

//actiontype = popup
function popupTypeExecution(options)
{
    //#region
    var includeAction = false;
    options.currentAction.setAttribute("OldType", "Popup");
    includeAction = true;
    if (checkExists(options.currentAction.getAttribute("Method")) && options.currentAction.getAttribute("Method").length > 0)
    {
        options.currentAction.setAttribute("Type", "Execute");
    }
    else
    {
        options.currentAction.setAttribute("Type", "Transfer");
    }
    navigateAction(options.currentAction, includeAction, options.behaviour);
    //#endregion
}

//actiontype = close
function closeTypeExecution(behaviour)
{
    //#region
    var lastNonClosingRuntimeIframe = SourceCode.Forms.Runtime.getTopNonClosingRuntimeInstancePopup();
    if (checkExists(lastNonClosingRuntimeIframe))
    {
        var windowToUse = SourceCode.Forms.Runtime.getMasterRuntimeWindow();
        var popupManagerToUse = windowToUse.popupManager;

        if (checkExists(lastNonClosingRuntimeIframe.options) && checkExists(lastNonClosingRuntimeIframe.options.subformContext))
        {
            var context = lastNonClosingRuntimeIframe.options.subformContext;
            if (checkExists(behaviour))
            {
                context.behaviour = behaviour;
            }
        }
        popupManagerToUse.closeSpecific(lastNonClosingRuntimeIframe);
    }
    else
    {
        if (checkExists(behaviour))
        {
            behaviour.isExecuting = false;
        }
    }
    //#endregion
}

function endActionExecution(options)
{
    //#region
    removeLoopContextData({ loopContextID: options.loopContextID });

    if (checkExists(options.behaviour))
    {
        options.behaviour.isExecuting = false;
        //behaviour.executeBehaviour();//while loop covers this
    }
    //#endregion
}

/* evaluates the expression and returns the combined result - calls the evaluateExpressionInternal function (a recursive function) inside a try catch block to try and catch any possible exceptions */
function evaluateExpression(ExpressionNode, rowCounter, control, ignoreConditionalStyling, instanceID, expressionID, loopContextID, behaviour)
{
    //#region
    var result = null;
    try
    {
        result = evaluateExpressionInternal(ExpressionNode, rowCounter, control, ignoreConditionalStyling, instanceID, expressionID, loopContextID, behaviour);
    }
    catch (err)
    {
        SFLog({ type: 5, source: "evaluateExpression", category: "Events", message: "Expression evaluation error: {0}", parameters: [err.message], data: ExpressionNode, exception: err });
        result = null;
    }
    return result;
    //#endregion
}

/* evaluates the inner expression and returns the combined result - a recursive function - only gets called from evaluateExpression; evaluateExpression should be the only external interface to this function to ensure proper exception handling */
//this function was moved out of the evaluateExpression function into a seperate function; this was done to ensure that null values returned by recursive calls are not due to exceptions
function evaluateExpressionInternal(ExpressionNode, rowCounter, control, ignoreConditionalStyling, instanceID, expressionID, loopContextID, behaviour)
{
    //#region
    var result = null;
    if (ExpressionNode.tagName === "Item")
    {
        result = returnItemValue(ExpressionNode, rowCounter, control, instanceID, loopContextID, behaviour);
    }
    else
    {
        var nodes = ExpressionNode.childNodes;
        var resultArray = [];
        var length = nodes.length;
        var hasError = false;

        if (ExpressionNode.tagName === "If")
        {
            if (length >= 2)
            {
                var conditionResult = evaluateExpressionInternal(nodes[0], rowCounter, control, true, instanceID, expressionID, loopContextID, behaviour); //first node is the condition
                if (conditionResult === true)
                {
                    result = evaluateExpressionInternal(nodes[1], rowCounter, control, true, instanceID, expressionID, loopContextID, behaviour); //second node is the true expression
                }
                else if (length > 2) //only when the condition result is false and length > 2
                {
                    result = evaluateExpressionInternal(nodes[2], rowCounter, control, true, instanceID, expressionID, loopContextID, behaviour); //third node is the false expression
                }
            }
        }
        else
        {
            if (ExpressionNode.tagName.startsWith("List"))
            {
                var childLength = ExpressionNode.childNodes.length;
                var listResultArray = [];
                for (var p = 0; p < childLength; p++)
                {
                    //construct the node to be evaluated in a way that the summary fields function can recognize
                    var currentNode = viewControllerDefinition.createElement("Expression");
                    if (checkExists(instanceID))
                    {
                        currentNode.setAttribute("InstanceID", instanceID);
                    }
                    if (checkExists(expressionID))
                    {
                        currentNode.setAttribute("ID", expressionID);
                    }
                    currentNode.appendChild(ExpressionNode.childNodes[p].cloneNode(true));

                    if (ExpressionNode.tagName === "ListAverage" && childLength > 1)
                    {
                        result = evaluateSummaryFields(currentNode, "Sum", instanceID, loopContextID);
                    }
                    else
                    {
                        result = evaluateSummaryFields(currentNode, ExpressionNode.tagName.replace("List", ""), instanceID, loopContextID);
                    }
                    listResultArray.push(result);
                }
                if (childLength > 1)
                {
                    switch (ExpressionNode.tagName)
                    {
                        //#region List
                        case "ListCount":
                        case "ListSum":
                            result = getSum(listResultArray);
                            break;
                        case "ListAverage":
                            result = getAverage(listResultArray);
                            break;
                        case "ListMinimum":
                            result = getMinimum(listResultArray);
                            break;
                        case "ListMaximum":
                            result = getMaximum(listResultArray);
                            break;
                        //#endregion
                    }
                }
            }
            else
            {
                for (var n = 0; n < length; n++)
                {
                    var node = nodes[n];
                    if (node.tagName === "Bracket")
                    {
                        node = node.firstChild;
                    }
                    var childResult = null;
                    if (node.tagName !== "Item")
                    {
                        childResult = evaluateExpressionInternal(node, rowCounter, control, true, instanceID, expressionID, loopContextID, behaviour);
                    }
                    else
                    {
                        var isBlankOrNotBlankFunction = (ExpressionNode.tagName === "IsBlank") || (ExpressionNode.tagName === "IsNotBlank");
                        childResult = returnItemValue(node, rowCounter, null, instanceID, loopContextID, behaviour, isBlankOrNotBlankFunction);
                    }
                    //currently only "IsBlank", "IsNotBlank", "NotEquals" and "Equals" will allow null to be a legitimate return value;
                    //this is to fix(TFS 477482) proper null value handling for other expression types will be addressed as part of the
                    //following technical debt item:
                    //TODO: TD 0039
                    if ((ExpressionNode.tagName === "Equals") || (ExpressionNode.tagName === "NotEquals")
                        || (ExpressionNode.tagName === "IsBlank") || (ExpressionNode.tagName === "IsNotBlank")
                        || checkExists(childResult))
                    {
                        resultArray.push(childResult);
                    }
                    else
                    {
                        hasError = true;
                        result = null;
                        break;
                    }
                    var shortcut = false;
                    //logical shortcuts
                    switch (ExpressionNode.tagName)
                    {
                        case "And":
                            shortcut = returnBooleanValue(childResult) === false;
                            break;
                        case "Or":
                            shortcut = returnBooleanValue(childResult) === true;
                            break;
                    }
                    if (shortcut)
                    {
                        break;
                    }
                }

                if (!hasError)
                {
                    result = calculateExpressionValue(ExpressionNode.tagName, resultArray);
                }
            }
        }
    }

    if (_runtimeConditionalStylingBeingApplied === false && ignoreConditionalStyling === false && checkExists(ExpressionNode.parentNode) && ExpressionNode.parentNode.tagName === "Expression")
    {
        var parentExpressionID = ExpressionNode.parentNode.getAttribute("ID");
        if (checkExists(parentExpressionID))
        {
            updateControlStylesUsingConditionalExpression(parentExpressionID, control);
        }
    }
    return result;
    //#endregion
}

//calculates the expression value based on the type and input values
function calculateExpressionValue(expressionName, resultArray)
{
    //#region
    var result = null;
    var currentDate;
    switch (expressionName)
    {
        case "Bracket":
            result = resultArray[0];
            break;

        //#region Mathematical
        case "Plus":
            result = getSum(resultArray);
            break;
        case "Minus":
            result = returnNumericValue(resultArray[0]);
            for (var z = 1; z < resultArray.length; z++)
            {
                result = result.minus(returnNumericValue(resultArray[z]));
            }

            break;
        case "Multiply":
            result = returnNumericValue(resultArray[0]);
            for (var z = 1; z < resultArray.length; z++)
            {
                result = result.times(returnNumericValue(resultArray[z]));
            }
            break;
        case "Divide":
            result = returnNumericValue(resultArray[0]);
            for (var z = 1; z < resultArray.length; z++)
            {
                var newValue = returnNumericValue(resultArray[z]);
                if (newValue !== 0 && newValue.toString() !== "0")
                {
                    result = result.div(newValue);
                }
                else
                {
                    result = 0; //catering for NaN with divide by zero
                }
            }
            break;
        case "Modulus":
            result = returnNumericValue(resultArray[0]);
            for (var z = 1; z < resultArray.length; z++)
            {
                var newValue = returnNumericValue(resultArray[z]);
                if (newValue !== 0 && newValue.toString() !== "0")
                {
                    result = result.mod(newValue);
                }
                else
                {
                    result = 0; //catering for NaN with divide by zero
                }
            }
            break;
        case "Absolute":
            result = returnNumericValue(resultArray[0]).abs();
            break;
        case "Average":
            result = getAverage(resultArray);
            break;
        case "FormatNumber":
            result = SCCultureHelper.current.applyFormatToSmartObjectValue(currentCulture, "number", resultArray[1], resultArray[0], SourceCode.Forms.Settings.Formatting.DoNotHandleInvariantPointAsGroupSeparator);
            break;
        case "Maximum":
            //compare with Math.max
            result = getMaximum(resultArray);
            break;
        case "Minimum":
            //compare with Math.min
            result = getMinimum(resultArray);
            break;
        case "Power":
            var x = returnNumericValue(resultArray[0]), y = returnNumericValue(resultArray[1]);
            if (y.isWhole())
            {
                result = x.pow(y.toInt());
            }
            else
            {
                result = Math.pow(x.isWhole() ? x.toInt() : x.toFloat(), y.isWhole() ? y.toInt() : y.toFloat());
            }
            break;
        case "Random":
            result = randomFromTo(0, returnNumericValue(resultArray[0]));
            break;
        case "Root":
            result = nthRoot(returnNumericValue(resultArray[0]), returnNumericValue(resultArray[1]));
            break;
        case "RoundDown":
            result = roundValue("down", returnNumericValue(resultArray[0]), returnNumericValue(resultArray[1]));
            break;
        case "RoundUp":
            result = roundValue("up", returnNumericValue(resultArray[0]), returnNumericValue(resultArray[1]));
            break;
        case "Round":
            result = roundValue("round", returnNumericValue(resultArray[0]), returnNumericValue(resultArray[1]));
            break;
        case "SquareRoot":
            result = returnNumericValue(resultArray[0]).sqrt();
            break;
        case "Square":
            result = returnNumericValue(resultArray[0]).pow(2);
            break;
        case "Sum":
            result = getSum(resultArray);
            break;
        //#endregion
        //#region Logical
        case "Equals":
            //if either value is of boolean type, both is converted
            if (typeof resultArray[0] === "boolean" || typeof resultArray[1] === "boolean")
            {
                result = (returnBooleanValue(resultArray[0]) === returnBooleanValue(resultArray[1]));
            }
            else if (resultArray[0] === null || resultArray[1] === null)//if either value is null no conversion
            {
                result = (resultArray[0] === null && resultArray[1] === null);
            }
            else if (runtimeAreAnyDateTypes(resultArray))//if either value is of date type, both is converted
            {
                result = runtimeDatesComparison(resultArray) === 0;
            }
            else if (typeof resultArray[0] === "string" || typeof resultArray[1] === "string" || typeof resultArray[0] === "object" || typeof resultArray[1] === "object")
            //object also in this if since we normally do string comparisons of values (no complex objects - this was most likely a datetime)  - no other way to really directly compare object unless it is a copy of the other one
            {
                result = (resultArray[0].toString().toLowerCase() === resultArray[1].toString().toLowerCase());
            }
            else
            {
                result = (resultArray[0] == resultArray[1]);
            }
            break;
        case "NotEquals":
            //if either value is of boolean type, both is converted
            if (typeof resultArray[0] === "boolean" || typeof resultArray[1] === "boolean")
            {
                result = (returnBooleanValue(resultArray[0]) !== returnBooleanValue(resultArray[1]));
            }
            else if (resultArray[0] === null || resultArray[1] === null)//if either value is null no conversion
            {
                result = !(resultArray[0] === null && resultArray[1] === null);
            }
            else if ((resultArray[0] === "" && typeof resultArray[1] !== "string") ||
                (resultArray[1] === "" && typeof resultArray[0] !== "string"))
            {
                result = true;
            }
            else if (runtimeAreAnyDateTypes(resultArray))//if either value is of date type, both is converted
            {
                result = runtimeDatesComparison(resultArray) !== 0;
            }
            else if (typeof resultArray[0] === "string" || typeof resultArray[1] === "string" || typeof resultArray[0] === "object" || typeof resultArray[1] === "object")
            //object also in this if since we normally do string comparisons of values (no complex objects - this was most likely a datetime) - no other way to really directly compare object unless it is a copy of the other one
            {
                result = (resultArray[0].toString().toLowerCase() !== resultArray[1].toString().toLowerCase());
            }
            else
            {
                result = (resultArray[0] != resultArray[1]);
            }
            break;
        case "GreaterThan":
            if (runtimeAreAnyDateTypes(resultArray))//if either value is of date type, both is converted
            {
                result = runtimeDatesComparison(resultArray) > 0;
            }
            else
            {
                result = returnNumericValue(resultArray[0]).gt(returnNumericValue(resultArray[1]));
            }
            break;
        case "LessThan":
            if (runtimeAreAnyDateTypes(resultArray))//if either value is of date type, both is converted
            {
                result = runtimeDatesComparison(resultArray) < 0;
            }
            else
            {
                result = returnNumericValue(resultArray[0]).lt(returnNumericValue(resultArray[1]));
            }
            break;
        case "GreaterThanEquals":
            if (runtimeAreAnyDateTypes(resultArray))//if either value is of date type, both is converted
            {
                result = runtimeDatesComparison(resultArray) >= 0;
            }
            else
            {
                result = returnNumericValue(resultArray[0]).gte(returnNumericValue(resultArray[1]));
            }
            break;
        case "LessThanEquals":
            if (runtimeAreAnyDateTypes(resultArray))//if either value is of date type, both is converted
            {
                result = runtimeDatesComparison(resultArray) <= 0;
            }
            else
            {
                result = returnNumericValue(resultArray[0]).lte(returnNumericValue(resultArray[1]));
            }
            break;
        case "Not":
            result = !(returnBooleanValue(resultArray[0]));
            break;
        case "And":
            result = resultArray[0];
            for (var z = 1; z < resultArray.length; z++)
            {
                result = (returnBooleanValue(result) && returnBooleanValue(resultArray[z]));
            }
            break;
        case "Or":
            result = resultArray[0];
            for (var z = 1; z < resultArray.length; z++)
            {
                result = (returnBooleanValue(result) || returnBooleanValue(resultArray[z]));
            }
            break;
        case "Xor":
            //This link contains the most elegant solution - (http://www.howtocreate.co.uk/xor.html) - adapted below for always true boolean check with !!
            //Replaced since returnBooleanValue will always return a boolean
            //Can be OR but not AND
            result = resultArray[0];
            for (var z = 1; z < resultArray.length; z++)
            {
                var item = returnBooleanValue(resultArray[z]);
                result = ((returnBooleanValue(result) || returnBooleanValue(item)) && !(returnBooleanValue(result) && returnBooleanValue(item)));
            }
            break;
        case "False":
        case "No":
            result = false;
            break;
        case "True":
        case "Yes":
            result = true;
            break;
        //#endregion
        //#region Text
        case "Length":
            result = _runtimeToString(resultArray[0]).length;
            break;
        case "Contains":
            result = _runtimeToString(resultArray[0]).toLowerCase().contains(_runtimeToString(resultArray[1]).toLowerCase());
            break;
        case "StartsWith":
            result = (_runtimeToString(resultArray[0]).toLowerCase().indexOf(_runtimeToString(resultArray[1]).toLowerCase()) === 0);
            break;
        case "EndsWith":
            var inputValue = _runtimeToString(resultArray[0]).toLowerCase();
            var expectedEndsWithValue = _runtimeToString(resultArray[1]).toLowerCase();
            result = false;
            //Exact match
            if (inputValue === expectedEndsWithValue)
            {
                result = true;
            }//Partial or EndsWith match
            else if (inputValue.length > expectedEndsWithValue.length && ((inputValue.lastIndexOf(expectedEndsWithValue) + expectedEndsWithValue.length) === inputValue.length))
            {
                result = true;
            }
            break;
        case "IsBlank":
            result = !checkExistsNotEmpty(resultArray[0]);
            break;
        case "IsNotBlank":
            result = checkExistsNotEmpty(resultArray[0]);
            break;
        case "Find":
            result = _runtimeToString(resultArray[0]).toLowerCase().indexOf(_runtimeToString(resultArray[1]).toLowerCase()) + 1;
            break;
        case "Hyperlink":
            var link = _runtimeToString(resultArray[1]);
            var display = _runtimeToString(resultArray[0]);
            if (display === "" && link !== "")
            {
                display = link;
            }
            if (display !== "" && link !== "")
            {
                result = "<a href='" + link.htmlEncode() + "'>" + display.htmlEncode() + "</a>";
            }
            break;
        case "Insert":
            result = insertTextInPosition(_runtimeToString(resultArray[0]), _runtimeToString(resultArray[1]), resultArray[2]);
            break;
        case "Join":
            //join strings with separator
            result = joinString(resultArray, false);
            break;
        case "Concatenate":
            //just adding strings together
            result = joinString(resultArray, true);
            break;
        case "Left":
            result = _runtimeToString(resultArray[0]).substr(0, resultArray[1]);
            break;
        case "Mid":
            result = _runtimeToString(resultArray[0]).substr(resultArray[1], resultArray[2]);
            break;
        case "PadLeft":
            result = _runtimeToString(resultArray[0]).leftPad(_runtimeToString(resultArray[1]), _runtimeToString(resultArray[2]));
            break;
        case "PadRight":
            result = _runtimeToString(resultArray[0]).rightPad(_runtimeToString(resultArray[1]), _runtimeToString(resultArray[2]));
            break;
        case "Proper":
            result = _runtimeToString(resultArray[0]).capitalize();
            break;
        case "Replace":
            if (_runtimeToString(resultArray[1]).length > 0) //if nothing is specificied to be replaced, it is not supposed to do anything
            {
                result = _runtimeToString(resultArray[0]).replaceAll(_runtimeToString(resultArray[1]), _runtimeToString(resultArray[2]));
            }
            else
            {
                result = _runtimeToString(resultArray[0]);
            }
            break;
        case "Right":
            var startPos = _runtimeToString(resultArray[0]).length - parseInt(resultArray[1], 10);
            result = _runtimeToString(resultArray[0]).substr(startPos);
            break;
        case "Split":
            result = _runtimeToString(resultArray[0]).split(_runtimeToString(resultArray[1]));
            break;
        case "ToLower":
            result = _runtimeToString(resultArray[0]).toLowerCase();
            break;
        case "ToUpper":
            result = _runtimeToString(resultArray[0]).toUpperCase();
            break;
        case "Trim":
            result = _runtimeToString(resultArray[0]).trim();
            break;
        case "UrlDecode":
            result = decodeURIComponent(_runtimeToString(resultArray[0]));
            break;
        case "UrlEncode":
            result = encodeURIComponent(_runtimeToString(resultArray[0]));
            break;
        //#endregion
        //#region Regular Expressions
        case "HtmlEncode":
            result = _runtimeToString(resultArray[0]).htmlEncode();
            break;
        case "HtmlDecode":
            result = _runtimeToString(resultArray[0]).htmlDecode();
            break;
        case "XmlEncode":
            result = _runtimeToString(resultArray[0]).xmlEncode();
            break;
        case "XmlDecode":
            result = _runtimeToString(resultArray[0]).xmlDecode();
            break;
        case "Matches":
            //evaluating regular expression
            result = resultArray[0].test(resultArray[1]);
            break;
        case "NotMatches":
            //evaluating opposite of regular expression
            result = !(resultArray[0].test(resultArray[1]));
            break;
        //#endregion
        //#region Date and Time
        case "AddDays":
            result = addDateCalculator(returnDateValue(resultArray[0]), "day", returnNumericValue(resultArray[1]));
            break;
        case "AddHours":
            result = addDateCalculator(returnDateValue(resultArray[0]), "hour", returnNumericValue(resultArray[1]));
            break;
        case "AddMinutes":
            result = addDateCalculator(returnDateValue(resultArray[0]), "minute", returnNumericValue(resultArray[1]));
            break;
        case "AddSeconds":
            result = addDateCalculator(returnDateValue(resultArray[0]), "second", returnNumericValue(resultArray[1]));
            break;
        case "SubtractDays":
            result = addDateCalculator(returnDateValue(resultArray[0]), "day", returnNumericValue(resultArray[1]).negate());
            break;
        case "SubtractHours":
            result = addDateCalculator(returnDateValue(resultArray[0]), "hour", returnNumericValue(resultArray[1]).negate());
            break;
        case "SubtractMinutes":
            result = addDateCalculator(returnDateValue(resultArray[0]), "minute", returnNumericValue(resultArray[1]).negate());
            break;
        case "SubtractSeconds":
            result = addDateCalculator(returnDateValue(resultArray[0]), "second", returnNumericValue(resultArray[1]).negate());
            break;
        case "DayDifference":
            var firstDate = returnDateValue(resultArray[0]);
            var secondDate = returnDateValue(resultArray[1]);
            if (checkExists(firstDate) && checkExists(secondDate))
            {
                //clearing time - if times don't match i.e. calendar selection vs. current system date etc - the result is influenced (although time should not be factored in)
                result = firstDate.clearTime().difference(secondDate.clearTime(), "day");
            }
            break;
        case "DateTimeDifference":
            var interval = resultArray[0];
            var firstDateTime = returnDateValue(resultArray[1]);
            var secondDateTime = returnDateValue(resultArray[2]);
            result = firstDateTime.fractionalDifference(secondDateTime, interval);
            break;
        case "Day":
            currentDate = returnDateValue(resultArray[0]);
            result = (checkExists(currentDate)) ? currentDate.getDate() : null;
            break;
        case "FormatDateTime":
            result = SCCultureHelper.current.applyFormatToSmartObjectValue(currentCulture, "datetime", resultArray[1], resultArray[0]);
            break;
        case "Month":
            currentDate = returnDateValue(resultArray[0]);
            result = (checkExists(currentDate)) ? returnNumericValue(currentDate.getMonth()).plus(1) : null;
            break;
        case "Now":
            result = new Date();
            break;
        case "Today":
            currentDate = new Date();
            result = getStartOfDay(currentDate);
            break;
        case "Tomorrow":
            currentDate = new Date();
            result = getStartOfDay(addDateCalculatorInternal(currentDate, "day", returnNumericValue(1)));
            break;
        case "Yesterday":
            currentDate = new Date();
            result = getStartOfDay(addDateCalculatorInternal(currentDate, "day", returnNumericValue(-1)));
            break;
        case "WeekNumber":
            currentDate = returnDateValue(resultArray[0]);
            result = (checkExists(currentDate)) ? currentDate.getWeek() : null;
            break;
        case "Weekday":
            currentDate = returnDateValue(resultArray[0]);
            if (checkExists(currentDate))
            {
                var day = currentDate.getDay() + 1;
                result = Date.parseDay(day);
            }
            break;
        case "Year":
            currentDate = returnDateValue(resultArray[0]);
            result = (checkExists(currentDate)) ? currentDate.getFullYear() : null;
            break;
        case "Quarter":
            currentDate = returnDateValue(resultArray[0]);
            if (checkExists(currentDate))
            {
                var month = currentDate.getMonth();
                var quarter = (month / 3) + 1;
                result = Math.floor(quarter);
            }
            break;
        case "StartOfMonth":
            result = dateStartEndCalculator(returnDateValue(resultArray[0]), "month", true);
            break;
        case "StartOfQuarter":
            result = dateStartEndCalculator(returnDateValue(resultArray[0]), "quarter", true);
            break;
        case "StartOfWeek":
            result = dateStartEndCalculator(returnDateValue(resultArray[0]), "week", true);
            break;
        case "StartOfYear":
            result = dateStartEndCalculator(returnDateValue(resultArray[0]), "year", true);
            break;
        case "EndOfMonth":
            result = dateStartEndCalculator(returnDateValue(resultArray[0]), "month", false);
            break;
        case "EndOfQuarter":
            result = dateStartEndCalculator(returnDateValue(resultArray[0]), "quarter", false);
            break;
        case "EndOfWeek":
            result = dateStartEndCalculator(returnDateValue(resultArray[0]), "week", false);
            break;
        case "EndOfYear":
            result = dateStartEndCalculator(returnDateValue(resultArray[0]), "year", false);
            break;
        //#endregion
        //#region Conversion
        case "ToBool":
            result = returnBooleanValue(resultArray[0]);
            break;
        case "ToTime":
            result = returnDateValue(resultArray[0], "time");
            break;
        case "ToTimeFromNumber":
            result = new SourceCode.Forms.Duration(returnNumericValue(resultArray[0]).toInt()).toString();
            break;
        case "ToDateOnly":
            result = returnDateValue(resultArray[0], "date");
            break;
        case "ToDate": //actually datetime
            result = returnDateValue(resultArray[0], "datetime");
            break;
        case "ToDateTime":
            result = Date.fromSFDateAndSFTime(returnDateValue(resultArray[0], "date"), returnDateValue(resultArray[1], "time"));
            break;
        case "ToDecimal":
            if (checkExists(resultArray[1]) && resultArray[1] !== "")
            {
                result = roundValue("round", returnNumericValue(resultArray[0]), returnNumericValue(resultArray[1]));
            }
            else
            {
                result = returnNumericValue(resultArray[0]);
            }
            break;
        case "ToNumber":
            result = returnNumericValue(resultArray[0]).round(0);
            break;
        case "ToString":
            result = _runtimeToString(resultArray[0]);
            break;
        //#endregion
    }
    return result;
    //#endregion
}

function _runtimeToString(value)
{
    var result = value;
    if (runtimeIsDateType(value))
    {
        result = getDateInCorrectFormat(value);
    }
    else if (checkExists(value))
    {
        result = value.toString();
    }
    return result;
}

//update control styles for conditional expression
function updateControlStylesUsingConditionalExpression(ExpressionID, control)
{
    //#region
    //conditional styling possibly using this expression - update the relevant related controls (if any)
    var influencedStylesKeys = [ExpressionID, control];
    var influencedStyles = _runtimeRelatedExpressionsCache.get(influencedStylesKeys);
    if (!checkExists(influencedStyles))
    {
        var controlsWithConditonalStylesKeys = ["controlsWithConditonalStyles"];
        var controlsWithConditonalStyles = _runtimeRelatedExpressionsCache.get(controlsWithConditonalStylesKeys);
        if (!checkExists(controlsWithConditonalStyles))
        {
            controlsWithConditonalStyles = $mn(viewControllerDefinition, "Controllers/Controller/Controls/Control[Properties/Property/Name/text()='SetProperty'][Properties/ConditionalStyles/ConditionalStyle[Condition]]");
            _runtimeRelatedExpressionsCache.add(controlsWithConditonalStylesKeys, controlsWithConditonalStyles);
        }
        var f = controlsWithConditonalStyles.length;
        influencedStyles = [];
        while (f--)
        {
            var currentControlNode = controlsWithConditonalStyles[f];
            if (!checkExists(control) || currentControlNode.getAttribute("ID") !== control)
            {
                var referencesThisExpression = controlsWithConditonalStyles[f].selectSingleNode("Properties[ConditionalStyles/ConditionalStyle[Condition[((.//@SourceType='Expression') and .//@SourceID='" + ExpressionID + "')]]]")
                if (checkExists(referencesThisExpression))
                {
                    influencedStyles.push(currentControlNode);
                }
            }
        }
        _runtimeRelatedExpressionsCache.add(influencedStylesKeys, influencedStyles);
    }

    var f = influencedStyles.length;
    var conditionalStylingControlCache = [];
    while (f--)
    {
        var controlID = influencedStyles[f].getAttribute("ID");
        if (conditionalStylingControlCache.indexOf(controlID < 0)) //only one instance of a control, the cases where a singular expression can be used in multiple conditional styles on the same control
        {
            conditionalStylingControlCache.push(controlID);
            applyConstructedStyle(influencedStyles[f]);
        }
    }

    //#endregion
}

//helper function to round the values
function roundValue(direction, value, decimals)
{
    //#region
    var result = value;
    switch (direction)
    {
        case "up":
            result = returnNumericValue(value).ceiling(returnNumericValue(decimals).toInt());
            break;
        case "down":
            result = returnNumericValue(value).floor(returnNumericValue(decimals).toInt());
            break;
        case "round":
            result = returnNumericValue(value).round(returnNumericValue(decimals).toInt());
            break;
    }
    return result;
    //#endregion
}

/* return the item's value after evaluation */
function returnItemValue(item, rowCounter, control, instanceID, loopContextID, behaviour, ignoreNumericDataTypeParsing)
{
    //#region
    var SourceType = item.getAttribute("SourceType");
    var SourceID = item.getAttribute("SourceID");
    var DataType = item.getAttribute("DataType");
    var sourceInstanceID = item.getAttribute("SourceInstanceID");

    if (checkExists(instanceID) && !checkExists(sourceInstanceID))
    {
        sourceInstanceID = instanceID;
        item.setAttribute("SourceInstanceID", sourceInstanceID);
    }
    var returnValue = "";
    switch (SourceType)
    {
        case "Expression":
            var ExpressionItem = $sn(item, "Expression");
            //expression within expression - check if the child existed
            if (!checkExists(ExpressionItem))
            {
                ExpressionItem = $sn(viewControllerDefinition, "Controllers/Expressions/Expression[@ID='" + SourceID + "']" + returnInstanceXP(sourceInstanceID, false, false, true));
            }
            if (checkExists(ExpressionItem))
            {
                var ExpressionNode = ExpressionItem.firstChild;
                returnValue = evaluateExpression(ExpressionNode, rowCounter, control, null, sourceInstanceID, ExpressionItem.getAttribute("ID"), loopContextID, behaviour); //possibly a false here
            }
            break;
        case "ValidationPattern":
            var validationPattern = $sn(viewControllerDefinition, "Controllers/ValidationPatterns/ValidationPattern[@ID='" + SourceID + "']");
            if (validationPattern)
            {
                returnValue = validationPattern.text;
            }
            break;
        default:
            returnValue = returnSourceValue({ item: item, counter: rowCounter, context: control, returnAccordingToType: true, loopContextID: loopContextID, behaviour: behaviour }); //this used contextID previously - for viewcontrol/formcontrolproperties
            break;
    }

    //Find unknown View Field datatype value
    if (DataType === 'Unknown' && item.selectNodes('SourceValue/Item').length == 1)
    {
        DataType = item.selectSingleNode('SourceValue/Item').getAttribute('DataType');
    }
    if (checkExists(DataType))
    {
        switch (DataType.toLowerCase())
        {
            case "boolean":
                returnValue = returnBooleanValue(returnValue);
                break;
            case "datetime":
                returnValue = returnDateValue(returnValue);
                break;
            case "number":
                //When the number is an empty string and is the IsBlank or IsNotBlank function, dont convert it
                if (!ignoreNumericDataTypeParsing)
                {
                    returnValue = returnNumericValue(returnValue);
                }
                break;
        }
    }

    return returnValue;
    //#endregion
}

/* return a control's property value */
// parameter options
//	controlID - required
// 	propertyName - required
// 	ignoreXML - optional defaults to false
// 	currentControl - optional xml node for the control

function returnControlPropertyValue(options)
{
    //#region
    var controlID = options.controlID;
    var propertyName = options.propertyName;
    var ignoreXML = options.ignoreXML;
    var currentControl = options.currentControl;
    if (!checkExists(currentControl))
    {
        currentControl = _runtimeControllerFindObject({ controlID: controlID });
    }

    var result = null;
    var getFromXml = true;

    /* Legacy code to be updated/revisited in 103 */
    if (checkExists(currentControl))
    {
        var hasGetter = $sn(currentControl, "Properties/Property[Name/text()='GetProperty']");

        if (checkExists(hasGetter))
        {
            //for getters, use the currentControlID + propertyName
            var objInfo = new PopulateObject(null, null, controlID, propertyName);
            result = executeControlFunction(currentControl, "GetProperty", objInfo);
            if (typeof result !== "undefined")
            {
                getFromXml = false;
            }
        }

        if (getFromXml)
        {
            if (!ignoreXML)
            {
                var propValue = $sn(currentControl, "Properties/Property[translate(Name/text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')='" + propertyName.toLowerCase() + "']/Value");  //lower case comparison
                if (checkExists(propValue))
                {
                    result = propValue.text;
                }
            }
            if (!checkExists(result))
            {
                switch (propertyName.toLowerCase())
                {
                    case "field":
                        result = currentControl.getAttribute("FieldID");
                        break;
                    case "expression":
                        result = currentControl.getAttribute("ExpressionID");
                        break;
                    case "datatype":
                        result = currentControl.getAttribute("DataType");
                        break;
                    case "styles":
                        var styleProp = $sn(currentControl, "Properties/Styles");
                        if (checkExists(styleProp))
                        {
                            result = styleProp.xml;
                        }
                        break;
                    case "conditionalstyles":
                        var conditionalStyleProp = $sn(currentControl, "Properties/ConditionalStyles");
                        if (checkExists(conditionalStyleProp))
                        {
                            result = conditionalStyleProp.xml;
                        }
                        break;
                }
            }
        }

        if (checkExists(result))
        {
            if (propertyName.toLowerCase() === "tabindex")
            {
                result = getUserTabIndex(result, controlID);
            }
            result = result.toString();
        }
    }
    return result;
    //#endregion
}

/* validates conditions specific to a action - only returns the condition evaluation result */
function validateConditions(condition, counter, loopContextID, behaviour)
{
    //#region
    var conditionResult = true;
    var possibleSerialNumberNode = $sn(condition, "Properties/Property[@Name='SerialNumber']/Value");
    if (checkExists(possibleSerialNumberNode))
    {
        var sourceNode = $sn(possibleSerialNumberNode, "Source");
        var possibleSerialNumber = "";
        if (checkExists(sourceNode))
        {
            possibleSerialNumber = returnSourceValue({ item: sourceNode, counter: counter, loopContextID: loopContextID, behaviour: behaviour });
        }
        else
        {
            possibleSerialNumber = possibleSerialNumberNode.text;
        }

        var masterRuntimeWindow = SourceCode.Forms.Runtime.getMasterRuntimeWindow();
        masterRuntimeWindow._runtimeLatestSerialNumber = possibleSerialNumber;

        if (!checkExistsNotEmpty(masterRuntimeWindow._runtimeLatestSerialNumber)
            || masterRuntimeWindow._runtimeLatestSerialNumberWarnings.contains(masterRuntimeWindow._runtimeLatestSerialNumber)) //this was already evaluated and issue was picked up on this serial number, resetting
        {
            masterRuntimeWindow._runtimeLatestSerialNumber = null;
            return false;
        }
    }
    var lc = condition.childNodes;
    for (var c = 0; c < lc.length; c++)
    {
        var ExpressionNode = lc[c];
        if (checkExists(ExpressionNode) && ExpressionNode.nodeName !== "Properties")
        {
            conditionResult = evaluateExpression(ExpressionNode, counter, null, true, null, null, loopContextID, behaviour);
        }

        if (!conditionResult)
        {
            break;
        }
    }

    return conditionResult === true;
    //#endregion
}
/* END functionality to evaluate conditional event execution */

/* get the value of a specified system variable */
function getSystemVariableValue(variableName, returnAccordingToType)
{
    //#region
    var result = null;
    switch (variableName)
    {
        case "currentdate":
            result = new Date();
            if (!returnAccordingToType)
            {
                result = getDateInCorrectFormat(result);
            }
            break;
        case "currentdateonly": //still returns a date, but without the time portion set (thus 0 hours, 0 min, 0 sec) - comparable with calendar's selection and other related functions
            if (SourceCode.Forms.Settings.Compatibility.UseDateTimeForCurrentDateSystemVariable === true)
            {
                result = new Date();
                result = result.toISOString();
                result = result.substr(0, result.indexOf('T')) + ' 00:00:00Z'
            }
            else
            {
                result = new SourceCode.Forms.Date();
                if (!returnAccordingToType)
                {
                    result = getDateInCorrectFormat(result);
                }
            }
            break;
        case "currenttime":
            result = new SourceCode.Forms.Time();
            if (!returnAccordingToType)
            {
                result = getDateInCorrectFormat(result);
            }
            break;
        case "screenwidth":
            result = window.screen.width;
            break;
        case "screenheight":
            result = window.screen.height;
            break;
        case "browserplatform":
            result = navigator.platform;
            break;
        case "browseruseragent":
            result = navigator.userAgent;
            break;
        case "browserculture":
            result = currentCulture;
            break;
        case "currentuser":
            result = SourceCode.Forms.Settings.User.FQN;
            break;
        case "currentuserfqn":
            result = SourceCode.Forms.Settings.User.FQN;
            break;
        case "currentuseremail":
            result = SourceCode.Forms.Settings.User.Email;
            break;
        case "currentuserdisplayname":
            result = SourceCode.Forms.Settings.User.DisplayName;
            break;
        case "currentusermanagerid":
            result = SourceCode.Forms.Settings.User.Manager;
            break;
        case "currentuserdescription":
            result = SourceCode.Forms.Settings.User.Description;
            break;
        case "currentusername":
            result = SourceCode.Forms.Settings.User.Name;
            break;
        case "culture":
            result = SourceCode.Forms.Settings.Culture;
            break;
        case "currenttheme":
            result = "";
            var currentTheme = $('#CurrentTheme').val();
            if (currentTheme)
            {
                result = currentTheme;
            }
            break;
        case "rendermode":
            result = _runtimeMode;
            break;
        default:
            var xp = "Controllers/SystemVariables/" + variableName;
            result = $sn(viewControllerDefinition, xp);
            if (checkExists(result))
            {
                result = result.text;
            }
            break;

    }
    return result;
    //#endregion
}

/* returns the specified control's value */
//options
//  controlID: control's id
//  controlNode: control's xml node (optional)
//  returnNulls: empty value behaviour (optional)
//  returnAccordingToType: type casting (optional)
//  forValidation: passed onto the control to tell it to give the full value (optional)
function getControlValue(o)
{
    var source = o.controlID;
    var returnNulls = o.returnNulls;
    var returnAccordingToType = o.returnAccordingToType;
    var forValidation = o.forValidation;
    var currentControl = o.controlNode;
    if (!checkExists(currentControl))
    {
        currentControl = _runtimeControllerFindObject({ controlID: source, instanceID: o.instanceID });
    }
    //#region
    var sourceValue = "";
    if (checkExists(currentControl))
    {
        var objInfo = new PopulateObject(null, null, source);
        if (forValidation === true)
        {
            objInfo.ForValidation = true;
        }
        sourceValue = executeControlFunction(currentControl, "GetValue", objInfo);
        if (!returnNulls && objInfo.functionExists === false)
        {
            sourceValue = "";
        }
    }
    else if (returnNulls)
    {
        sourceValue = null;
    }
    if (checkExists(sourceValue) && sourceValue.length > 0 && returnAccordingToType)
    {
        var controlDataType = currentControl.getAttribute("DataType");
        if (checkExists(controlDataType))
        {
            var text = sourceValue;
            switch (controlDataType.toLowerCase())
            {
                case "file":
                case "image":
                    var path = null;
                    if (text.startsWith("<collection>"))
                    {
                        var xpFileName = baseCollectionXPath + "/fields/field[@name='FileName']/value";
                        var xdoc = $xml(text);
                        var filename = $sn(xdoc, xpFileName).text;
                        text = filename;
                        path = $sn(xdoc, baseCollectionXPath + "/fields/field[@name='FilePath']/value");
                    }
                    if (text.length > 0)
                    {
                        valuetext = text;
                        if (controlDataType.toLowerCase() === "image")
                        {
                            if (path)
                            {
                                text = "<img class='fileImage' alt='" + text + "' title='" + text + "' src='" + constructFileSrc(path.text, "path", "image", 100, 100) + "'/>";
                            }
                            else
                            {
                                text = "<img class='fileImage' alt='" + text + "' title='" + text + "' src='" + constructFileSrc(FieldID, "field", "image", 100, 100) + "' />";
                            }
                        }
                        else
                        {
                            var textvalue = text;
                            //only use the column id in the file + image types
                            //changes to allow the user to download the files from the list directly without going to the capture view
                            text = "<a ";
                            if (path)
                            {
                                text += " path='" + constructFileSrc(path.text, "path", "file", 100, 100);
                            }
                            else
                            {
                                text += " path='" + constructFileSrc(FieldID, "field", "file", 100, 100);
                            }
                            text += "' class='fileImage'>" + textvalue + "</a>";
                        }
                    }
                    break;
                case "date":
                case "time":
                case "datetime":
                    text = returnDateValue(sourceValue, controlDataType.toLowerCase());
                    break;
            }
            if (sourceValue !== text)
            {
                sourceValue = text;
            }
        }
    }

    return sourceValue;
    //#endregion
}

/* get an environment field's value */
function getEnvironmentFieldValue(fieldId)
{
    var field = _environmentFieldCache[fieldId];
    var result = null;

    if (field)
    {
        if (checkExists(SourceCode.Forms.Settings.Cache) && checkExists(SourceCode.Forms.Settings.Cache.EnvironmentFieldDuration))
        {
            var currentDateTime = new Date();
            var cacheDateTime = field.timestamp;
            var diffSeconds = (currentDateTime - cacheDateTime) / 1000;

            if (diffSeconds > SourceCode.Forms.Settings.Cache.EnvironmentFieldDuration)
            {
                _environmentFieldCache[fieldId] = null;
            }
            else
            {
                result = field.value;
            }
        }
    }

    if (!checkExists(result))
    {
        result = ajaxCall.getEnvironmentFieldValue(fieldId);
        _environmentFieldCache[fieldId] = { value: result, timestamp: new Date() };
    }

    return result;
}

/* initialize the runtime parameters */
function initializeParameters()
{
    _runtimeParameters =
        {
            formParameters: {},
            viewControllers: {}
        };

    runtimeParametersDefinition = $xml(__runtimeParametersDefinition);

    var parameterNodes = runtimeParametersDefinition.selectNodes('/Parameters/FormParameters/FormParameter');
    for (var index = 0; index < parameterNodes.length; index++)
    {
        var parameterNode = parameterNodes[index];
        var id = parameterNode.getAttribute("ID");
        var name = parameterNode.getAttribute("Name");
        var type = parameterNode.getAttribute("Type");
        var value = parameterNode.text.htmlDecode().toString();
        _runtimeParameters.formParameters[name] = { ID: id, Name: name, Type: type, Value: value };
    }

    var controllerNodes = runtimeParametersDefinition.selectNodes("/Parameters/Controller")
    for (var controllerIndex = 0; controllerIndex < controllerNodes.length; controllerIndex++)
    {
        var controllerNode = controllerNodes[controllerIndex];
        var instanceID = controllerNode.getAttribute("InstanceID");

        var viewParameters = {};
        _runtimeParameters.viewControllers[checkExistsNotEmpty(instanceID) ? instanceID : ""] = viewParameters;

        var parameterNodes = controllerNode.selectNodes("ViewParameters/ViewParameter");
        for (var index = 0; index < parameterNodes.length; index++)
        {
            var parameterNode = parameterNodes[index];
            var id = parameterNode.getAttribute("ID");
            var name = parameterNode.getAttribute("Name");
            var type = parameterNode.getAttribute("Type");
            var value = parameterNode.text.htmlDecode().toString();
            viewParameters[name] = { ID: id, Name: name, Type: type, Value: value };
        }
    }
}

/*PUBLIC USAGE WARNING - do not mess with signature*/
/* get the form parameter value */
function getFormParameterValue(name, returnAccordingToType)
{
    //#region
    var sourceValue = null;
    var formParameter = _runtimeParameters.formParameters[name.toLowerCase()];
    if (checkExists(formParameter))
    {
        var type = formParameter.Type;
        sourceValue = formParameter.Value;
        switch (type)
        {
            case "boolean":
                sourceValue = returnBooleanValue(sourceValue);
                break;
            case "datetime":
                if (sourceValue.length > 0)
                {
                    sourceValue = returnDateValue(sourceValue);
                    if (!returnAccordingToType)
                    {
                        sourceValue = getDateInCorrectFormat(sourceValue);
                    }
                }
                break;
        }
    }
    return sourceValue;
    //#endregion
}

/*PUBLIC USAGE WARNING - do not mess with signature*/
/* get the view parameter value */
function getViewParameterValue(name, instanceID, returnAccordingToType)
{
    var sourceValue = null;
    instanceID = checkExistsNotEmpty(instanceID) ? instanceID : "";

    var viewParameters = null;

    if (checkExists(_runtimeParameters) && checkExists(_runtimeParameters.viewControllers))
    {
        viewParameters = checkExists(_runtimeParameters.viewControllers[instanceID]) ? _runtimeParameters.viewControllers[instanceID] : _runtimeParameters.viewControllers[""];
    }

    if (checkExists(viewParameters))
    {
        var viewParameter = viewParameters[name.toLowerCase()];

        if (checkExists(viewParameter))
        {
            var type = viewParameter.Type;
            sourceValue = viewParameter.Value;

            if (checkExists(sourceValue) && checkExists(type))
            {
                switch (type)
                {
                    case "boolean":
                        sourceValue = returnBooleanValue(sourceValue);
                        break;
                    case "datetime":
                        if (sourceValue.length > 0)
                        {
                            sourceValue = returnDateValue(sourceValue);
                            if (!returnAccordingToType)
                            {
                                sourceValue = getDateInCorrectFormat(sourceValue);
                            }
                        }
                        break;
                }
            }
        }
    }

    return sourceValue;
}

/*PUBLIC USAGE WARNING - do not mess with signature*/
/* set the form parameter value */
function setFormParameterValue(name, sourceValue, loopContextID)
{
    //#region
    var formParameter = _runtimeParameters.formParameters[name.toLowerCase()];
    if (checkExists(formParameter))
    {
        //set the value
        var changed = verifyParameterChange(formParameter, sourceValue);
        formParameter.Value = sourceValue;

        if (changed)
        {
            updateCalculatedControls(null, null, "FormParameter", name, null, null, null, loopContextID);
            var sourceId = formParameter.ID;

            if (checkExists(sourceId))
            {
                var sourceType = "FormParameter";
                var eventName = "OnChange";

                // BB: This should be parameter name as source id/
                raiseEvent(sourceId, sourceType, eventName);
            }
        }
    }
    //#endregion
}

/*PUBLIC USAGE WARNING - do not mess with signature*/
/* set the view parameter value */
function setViewParameterValue(name, sourceValue, instanceID, loopContextID)
{
    //#region
    var viewParameters = null;
    if (checkExists(_runtimeParameters) && checkExists(_runtimeParameters.viewControllers))
    {
        if (checkExistsNotEmpty(instanceID) && checkExists(_runtimeParameters.viewControllers[instanceID]))
        {
            viewParameters = _runtimeParameters.viewControllers[instanceID];
        }
        else
        {
            //view instance ony - this ensures change events and setting runs as expected
            viewParameters = _runtimeParameters.viewControllers[""];
            instanceID = null;
        }
    }

    if (checkExists(viewParameters))
    {
        var viewParameter = viewParameters[name.toLowerCase()];

        if (checkExists(viewParameter))
        {
            var changed = verifyParameterChange(viewParameter, sourceValue);
            viewParameter.Value = sourceValue;

            if (changed)
            {
                updateCalculatedControls(null, instanceID, "ViewParameter", name, null, null, null, loopContextID);

                // BB: This should be the parameter name/
                var sourceId = viewParameter.ID;

                if (checkExists(sourceId))
                {
                    var sourceType = "ViewParameter";
                    var eventName = "OnChange";

                    raiseEvent(sourceId, sourceType, eventName, instanceID);
                }
            }
        }
    }
    //#endregion
}

/* helper function to check for view/form parameter changes - also including type checks to ensure they don't cause disruptions */
function verifyParameterChange(parameter, newValue)
{
    //#region

    var changed = false;
    var type = parameter.Type;
    var previousValue = parameter.Value; // expected to be a string
    newValue = newValue ? newValue.toString() : "";

    if (previousValue !== newValue)
    {
        switch (type) //cater for specific types where the text might differ but the actual value is the same
        {
            case "boolean":
                if (returnBooleanValue(previousValue) !== returnBooleanValue(newValue))
                {
                    changed = true;
                }
                break;
            case "datetime":
                try
                {
                    if (previousValue.length > 0)
                    {
                        previousValue = returnDateValue(previousValue);
                        previousValue = getDateInCorrectFormat(previousValue);
                    }
                    if (newValue.length > 0)
                    {
                        newValue = returnDateValue(newValue);
                        newValue = getDateInCorrectFormat(newValue);
                    }
                }
                catch (except)
                {
                    //handles scenarios where converting the dates might throw an error
                }
                if (previousValue !== newValue)
                {
                    changed = true;
                }
                break;
            default:
                changed = true;
                break;
        }
    }
    return changed;
    //#endregion
}

function populateSubformContext(item, subformID)
{
    // Don't try and populate behavior context Actions with SubFormIDs, they will execute on their behavior's context.
    if (SourceCode.Forms.Runtime.Navigation.isBehaviorContextAction(item))
    {
        return item;
    }

    var subformInstances = SourceCode.Forms.Runtime.getRuntimeDataKeys(function (prop)
    {
        return prop.indexOf(subformID) !== -1 && prop.indexOf("_windowContext") + 14 === prop.length;
    });

    // Check if we are already on the Subform.
    if (__runtimeSubformID === subformID && subformInstances.length === 1)
    {
        item = PrepareNavigationTransferredEvents(item, __runtimeSubformID, __runtimeContextID, __runtimeParentContextID, __runtimeParentSubformID);
    }
    // Take the only instance.
    else if (subformInstances.length === 1)
    {
        var instance = SourceCode.Forms.Runtime.getRuntimeDataProperty(subformInstances[0].replace("_windowContext", ""), "windowContext");
        if (checkExists(instance))
        {
            item = PrepareNavigationTransferredEvents(item, instance.__runtimeSubformID, instance.__runtimeContextID, instance.__runtimeParentContextID, instance.__runtimeParentSubformID);
        }
    }
    // Self opening Subform scenarios - take the last opened context with this context as it's parent.
    else if (subformInstances.length > 1)
    {
        var windowContext;
        for (var i = 0; i < subformInstances.length; i++)
        {
            var instance = SourceCode.Forms.Runtime.getRuntimeDataProperty(subformInstances[i].replace("_windowContext", ""), "windowContext");

            if (!checkExists(windowContext) || instance.__runtimeFormLevel > windowContext.__runtimeFormLevel)
            {
                windowContext = instance;
            }
        }

        if (checkExists(windowContext))
        {
            item = PrepareNavigationTransferredEvents(item, windowContext.__runtimeSubformID, windowContext.__runtimeContextID, windowContext.__runtimeParentContextID, windowContext.__runtimeParentSubformID);
        }
    }
    // We cannot find this subform, do some generic fixes that would improve the changes of the fallback logic finding the Subform if the ID is wrong, etc.
    else
    {
        SourceCode.Forms.Runtime.Navigation.convertSubformNode(item, item.getAttribute("SubformID"));
        SourceCode.Forms.Runtime.Navigation.convertSourceSubformNode(item, item.getAttribute("SourceSubFormID"));
        SourceCode.Forms.Runtime.Navigation.convertTargetSubformNode(item, item.getAttribute("TargetSubFormID"));
    }

    return item;
}



/* return the sourceValue according to the source type */
function returnSourceValue(options)
{
    //#region
    //replacement of option values as per previous implementation
    var item = options.item; //required
    var counter = options.counter;//optional
    var context = options.context;//optional
    var specifiedResultName = options.specifiedResultName;//optional
    var returnNulls = options.returnNulls;//optional
    var returnAccordingToType = options.returnAccordingToType;//optional
    var customProcessData = options.customProcessData;//optional
    var loopContextID = options.loopContextID;//optional
    var behaviour = options.behaviour; //optional, currently only used for workflow variable resolving (and error variables in extreme sublevelled cases)
    var encodeTokenValues = options.encodeTokenValues; //optional, if true, the resolved value will be encoded before being concatenated with the result

    // Detect and fix non-transferred mappings
    var sourceSubformID = item.getAttribute("SourceSubFormID");
    if (checkExistsNotEmptyGuid(sourceSubformID))
    {
        item = populateSubformContext(item, sourceSubformID);
    }
    sourceSubformID = item.getAttribute("SourceTransferredID");
    var sourceInstanceID = item.getAttribute("SourceInstanceID");
    var sourceOriginalLevel = item.getAttribute("SourceOriginalLevel");
    var sourceRuntimeContextID = item.getAttribute("SourceRuntimeContextID");

    //normal logic continues below
    var source = item.getAttribute("SourceID");
    var sourceType = item.getAttribute("SourceType");
    var sourcePath = item.getAttribute("SourcePath");
    var targetType = item.getAttribute("TargetType");
    // true and undefined/null have the same behaviour
    // default value is true
    var isLiteral = true;
    if (typeof options.isLiteral !== "undefined" && options.isLiteral != null)
    {
        isLiteral = options.isLiteral;
    }

    // IsLiteral | EncodeTokenValues | Expected EncodeTokenValues value | Expecte Result
    // ----------|-------------------|----------------------------------|----------------
    //    F      |          F        |                F                 | Everything gets encoded
    //    F      |          T        |                F                 | Everything gets encoded
    //    T      |          F        |                F                 | Everything is not encoded                   
    //    T      |          T        |                T                 | Value nodes are not encoded, Tokens are encoded

    // Every return statement within this function must check isLiteral and encode or not encode accordingly.
    // isLiteral applies to only the outer most source/item, it should never exist on recursive calls to this function.
    // Do not process/update encodeTokenValues for complex values (recursive calls) - options.isLiteral is undefined.
    if (!isLiteral || typeof options.isLiteral === "undefined")
    {
        encodeTokenValues = false;
    }

    var sourceValue = null;

    if (checkExists($sn(item, "SourceValue")))
    {
        var multipleValues = $mn(item, "SourceValue/*");
        if (multipleValues.length > 0)
        {
            sourceValue = "";
            for (var m = 0; m < multipleValues.length; m++)
            {
                // Pass through isLiteral: true preserves existing behaviour and prevents double encoding of nested values/tokens.
                var newValue = returnSourceValue({ item: multipleValues[m], counter: counter, context: context, specifiedResultName: specifiedResultName, returnNulls: returnNulls, returnAccordingToType: returnAccordingToType, customProcessData: customProcessData, loopContextID: loopContextID, behaviour: behaviour, encodeTokenValues: encodeTokenValues, isLiteral: true });
                if (checkExists(newValue))
                {
                    sourceValue += newValue;
                }
                else if (returnNulls)
                {
                    return null;
                }
            }
            if (sourceValue.length === 0 && returnNulls)
            {
                return null;
            }
        }
        else
        {
            sourceValue = $sn(item, "SourceValue").text;
            var hyperlinkNode = $sn(item, "SourceValue/a");
            if (hyperlinkNode)
            {
                var text = "";
                var link = hyperlinkNode.getAttribute("href");
                text = hyperlinkNode.text;
                if (text.length === 0)
                {
                    text = link;
                }
                text = "<a target='_blank' href='" + link.htmlEncode() + "'>" + text.htmlEncode() + "</a>";

                if (text.length > 0)
                {
                    sourceValue = text;
                }
            }
        }
    }
    else
    {
        var findObject =
            {
                instanceID: sourceInstanceID,
                transferredID: sourceSubformID,
                originalLevel: sourceOriginalLevel,
                runtimeContextID: sourceRuntimeContextID
            };

        var instanceObj = options.instanceObj;
        if (!checkExists(instanceObj)) // Would only exist if switching to the correct context then running it again wouldn't be required.
        {
            switch (sourceType) // Only sets instanceObj if we have sufficient information for the SourceType.
            {
                case "Control":
                    findObject.controlID = source;
                    instanceObj = findCorrectInstanceForDataTransfer(findObject);
                    break;
                case "ViewField":
                    findObject.fieldID = source;
                    instanceObj = findCorrectInstanceForDataTransfer(findObject);
                    break;
                case "ControlField":
                    findObject.controlID = sourcePath;
                    instanceObj = findCorrectInstanceForDataTransfer(findObject);
                    break;
                case "ControlProperty":
                    if (checkExists(sourcePath))
                    {
                        context = sourcePath;
                    }
                    if (checkExistsNotEmpty(context))
                    {
                        findObject.controlID = context;
                        instanceObj = findCorrectInstanceForDataTransfer(findObject);
                    }
                    break;
                case "MethodParameter":
                    if (checkExists(context) && checkExists(context.ViewID) && checkExists(context.ObjectID) && checkExists(context.Method))
                    {
                        findObject.viewID = context.ViewID;
                        instanceObj = findCorrectInstanceForDataTransfer(findObject);
                    }
                    break;
                case "FormParameter":
                    if (!checkExistsNotEmpty(source) || source.isValidGuid())
                    {
                        source = item.text;
                    }
                    if (checkExistsNotEmpty(source))
                    {
                        findObject.formParameter = source.toLowerCase();
                        instanceObj = findCorrectInstanceForDataTransfer(findObject);
                    }
                    break;
                case "ViewParameter":
                    if (!checkExistsNotEmpty(source) || source.isValidGuid())
                    {
                        source = item.text;
                    }
                    if (checkExistsNotEmpty(source))
                    {
                        findObject.viewParameter = source.toLowerCase();
                        instanceObj = findCorrectInstanceForDataTransfer(findObject);

                        if (!checkExists(instanceObj.result) && checkExists(findObject.instanceID))
                        {
                            findObject.instanceID = null;
                            instanceObj = findCorrectInstanceForDataTransfer(findObject);
                        }
                    }
                    break;
                case "Expression":
                    findObject.expressionID = source;
                    instanceObj = findCorrectInstanceForDataTransfer(findObject);
                    break;
                case "ViewSource":
                    break;
                default:
                    instanceObj = findCorrectInstanceForDataTransfer(findObject); // Only set this in the default case because we don't require additional information to determine the correct window context.
                    break;
            }
        }

        if (checkExists(instanceObj) && instanceObj.WindowToUse !== window.self) // Switch to the correct window context and send the instanceObj with.
        {
            sourceValue = instanceObj.WindowToUse.returnSourceValue({
                item: item,
                counter: counter,
                context: context,
                specifiedResultName: specifiedResultName,
                returnNulls: returnNulls,
                returnAccordingToType: returnAccordingToType,
                loopContextID: loopContextID,
                behaviour: behaviour, //workflow variable resolving needs behaviour context
                instanceObj: instanceObj, // Important to prevent determining duplicate determination.
                encodeTokenValues: encodeTokenValues,
                isLiteral: true // Preserves existing behaviour and prevents double encoding of nested values/tokens.
            });
        }
        else if (checkExists(instanceObj)) // Runs on the correct window context wouldn't be defined if switch logic above didn't have enough information to get the correct instanceObj.result.
        {
            switch (sourceType)
            {
                case "Value":
                    sourceValue = item.text;
                    break;
                case "Control":
                    var currentControlTemplate = "";
                    var viewEditable = "FALSE";
                    var controlField = null;

                    var controlNode = instanceObj.result;
                    if (checkExists(controlNode))
                    {
                        controlField = $sn(controlNode, "Properties/Property[Name='Field']/Value");
                        var controlTempAttr = controlNode.getAttribute("ControlTemplate");
                        if (checkExistsNotEmpty(controlTempAttr))
                        {
                            currentControlTemplate = controlTempAttr.toUpperCase();
                            var mainTable = controlNode.parentNode.parentNode.getAttribute("MainTable");
                            if (checkExistsNotEmpty(mainTable))
                            {
                                var view = document.getElementById(mainTable);
                                if (checkExists(view))
                                {
                                    var viewEditAttr = view.getAttribute("editable");
                                    if (checkExistsNotEmpty(viewEditAttr))
                                    {
                                        viewEditable = viewEditAttr.toUpperCase();
                                    }
                                }
                            }
                        }

                        //overriding the control value with the bound field value in the case where the View is not in edit mode (add/edit row not visible) and the referenced control is part of the add/edit row
                        //this is necessary since the control value will be blank at this stage, but the linked field value will not (the field value will contain the wanted value)
                        //this will be fixed correctly once actual controls have been implemented on List Views
                        if (checkExists(controlField) && (viewEditable === "FALSE") && (currentControlTemplate === "EDIT"))
                        {
                            sourceValue = getSourceFieldValue(controlField.text, counter, specifiedResultName, sourceInstanceID, true, returnAccordingToType, loopContextID);
                        }
                        if (!checkExists(sourceValue))
                        {
                            var getControlValueObject =
                                {
                                    controlID: source,
                                    instanceID: sourceInstanceID,
                                    returnNulls: true,
                                    returnAccordingToType: returnAccordingToType,
                                    controlNode: controlNode
                                };
                            sourceValue = getControlValue(getControlValueObject);
                        }

                        if (encodeTokenValues === true && checkExistsNotEmpty(sourceValue))
                        {
                            sourceValue = sourceValue.toString().htmlEncode();
                        }
                    }
                    break;
                case "ViewField":
                    var fieldNode = instanceObj.result;
                    if (checkExists(fieldNode))
                    {
                        sourceValue = getSourceFieldValue(source, counter, specifiedResultName, sourceInstanceID, true, returnAccordingToType, loopContextID);

                        if (encodeTokenValues === true && checkExistsNotEmpty(sourceValue))
                        {
                            sourceValue = sourceValue.toString().htmlEncode();
                        }
                    }
                    break;
                case "ControlField":
                    var controlNode = instanceObj.result;
                    if (checkExists(controlNode))
                    {
                        sourceValue = getControlFieldValue(source, sourceInstanceID, sourcePath, loopContextID);

                        if (encodeTokenValues === true && checkExistsNotEmpty(sourceValue))
                        {
                            sourceValue = sourceValue.toString().htmlEncode();
                        }
                    }
                    break;
                case "SystemVariable":
                    if (checkExists(source))
                    {
                        source = source.toLowerCase();
                        if (source.startsWith("error"))
                        {
                            sourceValue = getErrorObjectValues(item, behaviour);
                        }
                        else if (source.startsWith("currentworkflow"))
                        {
                            sourceValue = resolveCurrentWorkflowVariables(source, behaviour);
                        }
                        else
                        {
                            sourceValue = getSystemVariableValue(source, returnAccordingToType);
                        }

                        if (encodeTokenValues === true && checkExistsNotEmpty(sourceValue))
                        {
                            sourceValue = sourceValue.toString().htmlEncode();
                        }
                    }
                    break;
                case "ControlProperty":
                    var controlNode = instanceObj.result;
                    if (checkExists(controlNode))
                    {
                        var controlPropertyOptions =
                            {
                                controlID: context,
                                propertyName: source
                            }

                        sourceValue = returnControlPropertyValue(controlPropertyOptions);

                        if (encodeTokenValues === true && checkExistsNotEmpty(sourceValue))
                        {
                            sourceValue = sourceValue.toString().htmlEncode();
                        }
                    }
                    break;
                case "MethodParameter":
                    var viewNode = instanceObj.result;
                    if (checkExists(viewNode))
                    {
                        sourceValue = getHiddenParameter(context.ViewID, context.ObjectID, source, context.Method);

                        if (encodeTokenValues === true && checkExistsNotEmpty(sourceValue))
                        {
                            sourceValue = sourceValue.toString().htmlEncode();
                        }
                    }
                    break;
                case "FormParameter":
                    var fp = instanceObj.result;
                    if (checkExists(fp))
                    {
                        sourceValue = getFormParameterValue(source, returnAccordingToType);

                        if (encodeTokenValues === true && checkExistsNotEmpty(sourceValue))
                        {
                            sourceValue = sourceValue.toString().htmlEncode();
                        }
                    }
                    break;
                case "ViewParameter":
                    if (checkExists(instanceObj.result))
                    {
                        sourceValue = getViewParameterValue(source, sourceInstanceID, returnAccordingToType);

                        if (encodeTokenValues === true && checkExistsNotEmpty(sourceValue))
                        {
                            sourceValue = sourceValue.toString().htmlEncode();
                        }
                    }
                    break;
                case "Expression":
                    var expression = instanceObj.result;
                    if (checkExists(expression))
                    {
                        sourceValue = returnCalculatedValue(null, expression, counter, null, loopContextID);

                        if (encodeTokenValues === true && checkExistsNotEmpty(sourceValue))
                        {
                            sourceValue = sourceValue.toString().htmlEncode();
                        }
                    }
                    break;
                case "EnvironmentField":
                    sourceValue = getEnvironmentFieldValue(source);
                    if (encodeTokenValues === true && checkExistsNotEmpty(sourceValue))
                    {
                        sourceValue = sourceValue.toString().htmlEncode();
                    }
                    break;
                case "WorkflowActivity":
                    sourceValue = source; // is the SourceID here, no need to encode a guid
                    break;
                default:
                    if (checkExists(customProcessData) || checkExists(workflowInfo))
                    {
                        sourceValue = getCurrentWorkflowInformation(customProcessData, item, loopContextID, encodeTokenValues); //if customProcessData is empty, the global workflowInfo will be used (if available)

                        if (!checkExists(sourceValue))
                        {
                            sourceValue = "<Item SourceType='" + sourceType + "' SourceID='" + source + "' SourcePath='" + (checkExists(sourcePath) ? sourcePath : "") + "' />";
                        }
                    }
                    break;
            }
        }
    }

    if (checkExists(sourceValue) && !returnAccordingToType && !Array.isArray(sourceValue))//array check is for transfer of JSON data between different levels
    {
        sourceValue = sourceValue.toString();
    }
    else if (!checkExists(sourceValue) && !returnNulls)
    {
        sourceValue = "";
    }

    // if not literal and encodeTokenValues is true, preserve 4.7 behaviour where designer captured text is literal and tokens are encoded.
    if (!isLiteral && !encodeTokenValues)
    {
        sourceValue = sourceValue.htmlEncode();
    }

    return sourceValue;
    //#endregion
}

//helper function to return error handler object when used from within mappings etc
function getErrorObjectValues(item, behaviour)
{
    //#region
    var errorID = item.getAttribute("SourceErrorID");
    var result = null;
    if (!checkExists(errorID) && checkExists(_runtimeLastUnhandledErrorID))
    {
        errorID = _runtimeLastUnhandledErrorID; //failsafe where context might not persist, use last unhandled error
    }
    if (!checkExists(errorID) && checkExists(behaviour) && checkExists(behaviour.windowToUse) && behaviour.windowToUse != window)
    {
        errorID = behaviour.windowToUse._runtimeLastUnhandledErrorID; //extra failsafe, behaviour was on different window, and can have different context
    }
    if (checkExists(errorID))
    {
        var masterRuntimeWindow = SourceCode.Forms.Runtime.getMasterRuntimeWindow();
        var errorObject = masterRuntimeWindow._runtimeErrorObjects[errorID];
        if (checkExists(errorObject))
        {
            var errorPart = item.getAttribute("SourceID");
            switch (errorPart.toLowerCase())
            {
                case "error":
                    result = errorObject.message;
                    break;
                case "errorcategory":
                    result = errorObject.category;
                    break;
                case "errormessage":
                    result = errorObject.message;
                    break;
                case "errordetail":
                    result = errorObject.detail;
                    break;
                case "errortype":
                    result = errorObject.type;
                    break;
            }
        }
    }
    return result;
    //#endregion
}

//get the current workflow information based on sources structure
function getCurrentWorkflowInformation(workflowProcess, item, loopContextID, encodeTokenValues)
{
    //#region
    return getCurrentWorkflowInformationDetails(workflowProcess, item.getAttribute("SourceType"), item.getAttribute("SourceID"), item.getAttribute("SourcePath"), item, loopContextID, encodeTokenValues);
    //#endregion
}

//get the current workflow information based on criteria provided
function getCurrentWorkflowInformationDetails(workflowProcess, FieldType, PropertyName, valueXPath, item, loopContextID, encodeTokenValues)
{
    //#region
    var value = null;
    if (!checkExists(workflowProcess) && checkExists(workflowInfo))
    {
        workflowProcess = workflowInfo[0]; //using cached workflowinfo if nothing else can be found or the workflowProcess wasn't sent through
    }
    if (checkExists(workflowProcess))
    {
        if (!checkExists(valueXPath))
        {
            valueXPath = "";
        }

        var valueNode = null;
        switch (FieldType)
        {
            case "WorkflowProcessDataField":
                value = workflowProcess.ProcessInstance.DataFields[PropertyName];
                if (checkExists(value))
                {
                    if (encodeTokenValues === true)
                    {
                        value = value.htmlEncode();
                    }
                }
                break;
            case "WorkflowActivityDataField":
                value = workflowProcess.ActivityInstanceDestination.DataFields[PropertyName];
                if (checkExists(value))
                {
                    if (encodeTokenValues === true)
                    {
                        value = value.htmlEncode();
                    }
                }
                break;
            case "WorkflowProcessProperty":
                valueNode = workflowProcess["ProcessInstance"];
                if (checkExists(valueNode))
                {
                    if (PropertyName.startsWith("Originator"))
                    {
                        valueNode = valueNode["Originator"];
                        if (PropertyName === "Originator")
                        {
                            PropertyName = "FQN";
                        }
                        else
                        {
                            PropertyName = PropertyName.replace("Originator", "");
                        }
                    }
                    value = valueNode[PropertyName];

                    if (encodeTokenValues === true && checkExists(value))
                    {
                        value = value.toString().htmlEncode();
                    }
                }
                break;
            case "WorkflowActivityProperty":
                valueNode = workflowProcess["ActivityInstanceDestination"];
                if (checkExists(valueNode))
                {
                    value = valueNode[PropertyName];

                    if (encodeTokenValues === true && checkExists(value))
                    {
                        value = value.toString().htmlEncode();
                    }
                }
                break;
            case "WorkflowEventProperty":
                valueNode = workflowProcess["EventInstance"];
                if (checkExists(valueNode))
                {
                    value = valueNode[PropertyName];

                    if (encodeTokenValues === true && checkExists(value))
                    {
                        value = value.toString().htmlEncode();
                    }
                }
                break;
            case "WorkflowProcessXmlField":
                value = workflowProcess.ProcessInstance.XMLFields[PropertyName];
                break;
            case "WorkflowActivityXmlField":
                value = workflowProcess.ActivityInstanceDestination.XMLFields[PropertyName];
                break;
            case "Value": //multi/combined value support
                if (checkExists(item) && $sn(item, "SourceValue"))
                {
                    var multipleValues = $mn(item, "SourceValue/Source");
                    if (multipleValues.length > 0)
                    {
                        value = "";
                        for (var m = 0; m < multipleValues.length; m++)
                        {
                            var newValue = getCurrentWorkflowInformation(workflowProcess, multipleValues[m], loopContextID, encodeTokenValues);
                            if (checkExists(newValue))
                            {
                                value += newValue;
                            }
                        }
                    }
                    else
                    {
                        value = $sn(item, "SourceValue").text;

                        if (encodeTokenValues === true && checkExists(value))
                        {
                            value = value.toString().htmlEncode();
                        }
                    }
                }
                break;
            case "ProcessItemReference":
                //PropertyName will be the itemreferencename
                var itemReferenceNode = $xml(workflowProcess.ProcessInstance.XMLFields["ItemReferences"]);
                if (checkExists(itemReferenceNode))
                {
                    value = $sn(itemReferenceNode, "itemReferences/itemReference[@name='" + PropertyName + "']");
                }
                break;
            default: //handles support for non-workflow type values (also part of multi/combined value support)
                if (checkExists(item))
                {
                    value = returnSourceValue({ item: item, loopContextID: loopContextID, encodeTokenValues: encodeTokenValues });
                }
                break;
        }
    }
    return value;
    //#endregion
}

/* resolves current workflow, loads information and returns relevant variable name */
function resolveCurrentWorkflowVariables(variableName, wfBehaviour)
{
    //#region
    var result = null;
    var fieldType = null;
    var propertyName = null;

    switch (variableName)
    {
        case "currentworkflowactivityname":
            fieldType = "WorkflowActivityProperty";
            propertyName = "FullName";
            break;
        case "currentworkflowactivitydisplayname":
            fieldType = "WorkflowActivityProperty";
            propertyName = "DisplayName";
            break;
        case "currentworkflowactionname":
            result = getWorkflowViewActionName(false);
            break;
    }
    var masterRuntimeWindow = SourceCode.Forms.Runtime.getMasterRuntimeWindow();
    if (!checkExists(result) && checkExists(masterRuntimeWindow._runtimeLatestSerialNumber) && !masterRuntimeWindow._runtimeLatestSerialNumberWarnings.contains(masterRuntimeWindow._runtimeLatestSerialNumber))
    {
        var loadWFInfo = false;

        if (!checkExists(workflowInfo))
        {
            loadWFInfo = true;
        }
        else
        {
            loadWFInfo = true;
            var wf = workflowInfo.length;
            while (wf--)
            {
                if (workflowInfo[wf].ProcessInstance.SerialNumber === masterRuntimeWindow._runtimeLatestSerialNumber)
                {
                    //only populate if current serial number was not loaded previously
                    loadWFInfo = false;
                    break;
                }
            }
        }

        if (loadWFInfo)
        {
            //simulate loadprocess
            var currentAction = $xml('<Action Type="ExecuteWorkflow" ExecutionType="Synchronous" Method="LoadProcess" OriginalEventType="System"><Parameters><Parameter SourceType="Value" TargetID="SerialNumber" TargetType="WorkflowProcessProperty"><SourceValue>' + masterRuntimeWindow._runtimeLatestSerialNumber + '</SourceValue></Parameter></Parameters></Action>').documentElement;
            if (!checkExists(wfBehaviour))
            {
                wfBehaviour = new masterRuntimeWindow.SourceCode.Forms.Runtime.BehaviourEvent({ windowToUse: window.self });//this ensures that error handling will be done properly in the synchronous case if something does go wrong
            }
            wfBehaviour.wfVariableLoading = true;
            workflowAction(currentAction, wfBehaviour, null, false);//async execution will be false, to ensure that we wait to get the proper value back
        }

        if (checkExists(workflowInfo) && checkExists(fieldType) && checkExists(propertyName))
        {
            var currentProcess = null;
            var wfLength = workflowInfo.length;
            while (wfLength--)
            {
                if (workflowInfo[wfLength].ProcessInstance.SerialNumber === masterRuntimeWindow._runtimeLatestSerialNumber)
                {
                    currentProcess = workflowInfo[wfLength];
                    break;
                }
            }

            if (checkExists(currentProcess))
            {
                result = getCurrentWorkflowInformationDetails(currentProcess, fieldType, propertyName);
            }
        }

        if (!checkExists(result) && loadWFInfo)
        {
            //this was already executed and failed due to some kind of error - this is to limit the error from duplicating and similar conditions from executing
            //a user will have to reload the form anyway if something like permissions/accessibility has changed, this will automatically reset the variables
            masterRuntimeWindow._runtimeLatestSerialNumberWarnings.push(_runtimeLatestSerialNumber);
        }
    }

    if (checkExists(result))
    {
        var updated = false;
        switch (variableName)
        {
            case "currentworkflowactivityname":
                if (masterRuntimeWindow._runtimeLatestWorkflowActivityName != result)
                {
                    masterRuntimeWindow._runtimeLatestWorkflowActivityName = result;
                    updated = true;
                }
                break;
            case "currentworkflowactivitydisplayname":
                if (masterRuntimeWindow._runtimeLatestWorkflowActivityDisplayName != result)
                {
                    masterRuntimeWindow._runtimeLatestWorkflowActivityDisplayName = result;
                    updated = true;
                }
                break;
            case "currentworkflowactionname":
                if (masterRuntimeWindow._runtimeLatestWorkflowActionName != result)
                {
                    masterRuntimeWindow._runtimeLatestWorkflowActionName = result;
                    updated = true;
                }
                break;
        }
        if (updated)
        {
            updateCalculatedControls(null, null, "SystemVariable", variableName);
        }
    }
    return result;
    //#endregion
}

//send an email with the supplied parameters
function mailAction(currentAction, behaviour)
{
    //#region
    var loopContextID = getLoopContextID(currentAction);

    var xmlDoc = $xml("<mailmessage/>");
    var mailNode = $sn(xmlDoc, "mailmessage");
    //inspects parameters
    var parameters = $mn(currentAction, "Parameters/Parameter");
    //#region
    //loop through parameters and add properties
    var p = parameters.length;
    while (p--)
    {
        var currentParam = parameters[p];
        var targetType = currentParam.getAttribute("TargetType");
        var target = currentParam.getAttribute("TargetID");
        var sourceValue = null;
        if (target.toLowerCase() === "attachment")
        {
            setAttachmentValues(xmlDoc, mailNode, currentParam, loopContextID);
        }
        else
        {
            sourceValue = returnSourceValue({ item: currentParam, loopContextID: loopContextID, behaviour: behaviour });

            if (checkExists(sourceValue))
            {
                if (targetType === "MailProperty")
                {
                    constructPropertyNode(xmlDoc, mailNode, target.toLowerCase(), sourceValue);
                }
            }
        }
    }
    //#endregion
    return ajaxCall.sendEmailBehaviour(xmlDoc.xml, currentAction, behaviour);
    //#endregion
}

function exportListToExcel(options)
{
    options = checkExists(options) ? options : {};

    var generateDataForExcelOptions =
    {
        viewHtml: options.viewHtml,
        rowsGridObjs: options.rowsGridObjs
    }

    var listXlsxData = generateDataForExcel(generateDataForExcelOptions);
    var url = document.getElementById("FileURL").value;

    if (checkExists(listXlsxData) && checkExistsNotEmpty(url))
    {
        var fileName = constructExcelFileName(options.viewXml);
        url = FormatFileDownloadPathForAnonAccess(url, true);
        url = SourceCode.Forms.XSRFHelper.appendAntiXSRFQueryStringParameter(url);

        var isIOSMobileRegex = /(iPhone|iPad|iPod)/i;
        var isIOSMobile = isIOSMobileRegex.test(navigator.userAgent);
        var isMobileApp = (navigator.userAgent.indexOf("Mobilies") >= 0);

        //TFS 873416 - The export to excel function was tested before the fix and it didn't work.
        //If it is an IOS device or the mobile app then do what was done prior to fix so as to prevent any issues
        if (isIOSMobile || isMobileApp)
        {
            var postData = setFrameVariable("_listxlsxdata", JSON.stringify(listXlsxData));
            postData += setFrameVariable("_xlsxfilename", constructExcelFileName(options.viewXml));
            framePosting("HiddenFileFrame", url, postData, false);
        }
        else
        {
            var postData =
            {
                _listxlsxdata: JSON.stringify(listXlsxData),
                _xlsxfilename: fileName
            }

            _runtimeAjaxCall("POST", url, null, postData, "blob").done(function (data, textStatus, xhrData)
            {
                if (typeof navigator.msSaveBlob === "function")
                {
                    navigator.msSaveBlob(data, fileName);
                }
                else
                {
                    var dataURL = window.URL.createObjectURL(data);

                    var fileLink = document.createElement('a');
                    fileLink.href = dataURL;
                    fileLink.download = fileName;
                    fileLink.style.display = "none";
                    $("body").append(fileLink);
                    fileLink.click();
                    fileLink.remove();

                    window.URL.revokeObjectURL(dataURL);
                }
            });
        }
    }

    handleEvent(options.viewId, "View", "ListExportExcel", null, options.instanceId, null, null, null, null, null, null, options.loopContextId);
}

function executeListExportExcel(options)
{
    options = checkExists(options) ? options : {};

    var smoId = options.viewXml.getAttribute("ContextID");

    var viewId = options.currentAction.getAttribute("ViewID");
    var instanceId = options.currentAction.getAttribute("InstanceID");
    var loopContextId = getLoopContextID(options.currentAction);

    var hasPageSize = false;
    var pageSizeInt = 0;

    var pageSizeValue = options.viewHtml[0].getAttribute("pagesize");

    if (checkExistsNotEmpty(pageSizeValue))
    {
        var possiblePageSize = parseInt(pageSizeValue, 10);

        if (!isNaN(possiblePageSize))
        {
            pageSizeInt = possiblePageSize;
            hasPageSize = true;
        }
    }

    var exportExcelParamOptions = {
        viewId: viewId,
        smoId: smoId,
        rowCounter: options.rowCounter,
        windowToUse: options.originalWindow,
        specifiedResultName: options.specifiedResultName,
        loopContextId: loopContextId,
        behaviour: options.behaviour
    }

    var hasRowLimit = false;
    var rowLimitInt = 0;

    var rowLimitParam = options.currentAction.selectSingleNode("Parameters/Parameter[@TargetID='RowLimit']");

    if (checkExists(rowLimitParam))
    {
        exportExcelParamOptions.param = rowLimitParam;

        var rowLimitValue = getExportExcelParameterValue(exportExcelParamOptions);

        if (checkExistsNotEmpty(rowLimitValue))
        {
            var possibleRowLimit = parseInt(rowLimitValue, 10);

            if (!isNaN(possibleRowLimit))
            {
                rowLimitInt = possibleRowLimit;
                hasRowLimit = true;
            }
        }
    }

    var allPagesValue = "true";

    var allPagesParam = options.currentAction.selectSingleNode("Parameters/Parameter[@TargetID='AllPages']");

    if (checkExists(allPagesParam))
    {
        exportExcelParamOptions.param = allPagesParam;

        var possibleAllPagesValue = getExportExcelParameterValue(exportExcelParamOptions);

        if (checkExistsNotEmpty(possibleAllPagesValue))
        {
            allPagesValue = possibleAllPagesValue;
        }
    }

    var useWysiwyg = true;

    if (checkExistsNotEmpty(allPagesValue) && (allPagesValue.toUpperCase() === "TRUE")
        && hasPageSize && (!hasRowLimit || (rowLimitInt > pageSizeInt)))
    {
        useWysiwyg = false;
    }

    if (useWysiwyg)
    {
        var subsetRowsOptions = {
            returnType: "objects",
            startIndex: 0,
            endIndex: pageSizeInt
        };

        if (!hasRowLimit && !hasPageSize)
        {
            delete subsetRowsOptions.endIndex;
        }
        else if (hasRowLimit && (!hasPageSize || (rowLimitInt < pageSizeInt)))
        {
            subsetRowsOptions.endIndex = rowLimitInt;
        }

        var gridExecuteOptions = {
            element: options.viewHtml,
            fn: "fetch",
            params: [
                "subset-rows",
                subsetRowsOptions
            ]
        };

        var rowsGridObjs = SFRGrid.execute(gridExecuteOptions);

        var exportListToExcelOptions = {
            viewHtml: options.viewHtml,
            viewXml: options.viewXml,
            rowsGridObjs: rowsGridObjs,
            viewId: viewId,
            instanceId: instanceId,
            loopContextId: loopContextId
        }

        exportListToExcel(exportListToExcelOptions);

        if (options.actionType === "Close")
        {
            closeTypeExecution(options.behaviour);
        }
        else
        {
            endActionExecution({ loopContextID: loopContextId, behaviour: options.behaviour });
        }
    }
    else
    {
        if (options.actionType === "Close")
        {
            closeTypeExecution(options.behaviour);
        }

        var refreshListForExportToExcelOptions = {
            viewHtml: options.viewHtml,
            viewId: viewId,
            instanceId: instanceId,
            behaviour: options.behaviour
        };

        if (hasRowLimit)
        {
            refreshListForExportToExcelOptions.pageSize = rowLimitInt;
            refreshListForExportToExcelOptions.pageNumber = 1;
        }

        refreshListForExportToExcel(refreshListForExportToExcelOptions);
    }
}

function getExportExcelParameterValue(options)
{
    var returnValue = null;

    options = checkExists(options) ? options : {};

    var sourceType = options.param.getAttribute("SourceType");
    var sourceInstanceId = options.param.getAttribute("SourceInstanceID");
    var targetInstanceId = options.param.getAttribute("TargetInstanceID");

    var context = null;
    if (sourceType === "MethodParameter")
    {
        context = new parameterContext(options.viewId, options.smoId, "ListExportExcel");
    }

    var sourceCounter = options.rowCounter;
    if (checkExists(sourceCounter) && sourceType === "ViewField" && checkExists(targetInstanceId) && checkExists(sourceInstanceId) && targetInstanceId !== sourceInstanceId)
    {
        sourceCounter = null;
    }

    returnValue = options.windowToUse.returnSourceValue(
        {
            item: options.param,
            counter: sourceCounter,
            context: context,
            specifiedResultName: options.specifiedResultName,
            returnNulls: true,
            loopContextID: options.loopContextId,
            behaviour: options.behaviour
        });

    return returnValue;
}

//return properties of control from parent frame
function setAttachmentValues(xmlDoc, mailNode, parameter, loopContextID)
{
    //#region
    var sources = $mn(parameter, "SourceValue/Source");
    var s = sources.length;
    while (s--)
    {
        var currentParam = sources[s];

        var sourceType = currentParam.getAttribute("SourceType").toLowerCase();
        var source = currentParam.getAttribute("SourceID");
        var result = returnSourceValue({ item: currentParam, loopContextID: loopContextID });

        if (sourceType === "viewfield" && result.indexOf("<collection>") === -1) //if the field has a value, set this up for execution on server, otherwise ignore - no need to reiterate - we work with what is currently available on the form
        {
            var instanceID = currentParam.getAttribute("SourceInstanceID"); //for verification on form level - if implemented
            result = getFieldValueForEmail(source, instanceID, loopContextID);
        }

        if (result.length > 0 && (result.indexOf("<collection>") > -1 || result.indexOf("<FileLoad>") > -1)) //sanity check
        {
            constructPropertyNode(xmlDoc, mailNode, "attachment", result);
        }
    }
    //#endregion
}

//Converts the field value in such a way that it can be used as an attachment
function getFieldValueForEmail(fieldID, instanceID, loopContextID)
{
    //#region
    var result = "";
    if (checkExists(fieldID))
    {
        var currentField = returnFieldAttributeObject(fieldID, instanceID);

        if (checkExists(currentField))
        {
            var viewType = currentField.viewType.toLowerCase();
            var currentCounter = null;
            var viewID = currentField.viewID;
            if (viewType === "list")
            {
                var mainTable = currentField.mainTable;

                currentCounter = getLoopContextData({ loopContextID: loopContextID, viewID: viewID, instanceID: currentField.instanceID }).counter;

                if (!checkExists(currentCounter))
                {
                    currentCounter = getViewSelectedCounter(mainTable);
                }
            }
            var objectID = currentField.parentID;
            var fieldName = currentField.PropertyName;
            var propertyType = currentField.propertyType;
            if (propertyType.toLowerCase() === "file" || propertyType.toLowerCase() === "image")
            {
                var properties = getCombinedHiddenPropertyCollection(viewID, objectID, "Object", null, null, currentCounter, null, null, null, currentField.instanceID);
                var collectionXml = $xml("<collection/>");
                _runtimeTransformFieldsToXml(collectionXml, properties);
                var packageValue = "<FileLoad>";
                packageValue += "<ReturnProperty>" + fieldName + "</ReturnProperty>";
                packageValue += collectionXml.xml;
                packageValue += "</FileLoad>";

                result = packageValue;
            }
        }
    }
    return result;
    //#endregion
}
//constructs a property node with the correct name and value (used in email and metadata)
function constructPropertyNode(XMLDoc, parentNode, name, value)
{
    //#region
    if (checkExists(value))
    {
        value = value.toString();
    }
    if (checkExists(value) && value.length > 0)
    {
        var namedElement = XMLDoc.createElement(name);
        namedElement.appendChild(XMLDoc.createTextNode(value));
        parentNode.appendChild(namedElement);
    }
    return parentNode;
    //#endregion
}

//shows a message form with the supplied parameters
function messageAction(currentAction, behaviour, methodExecuted, lookupWindow)
{
    //#region
    var loopContextID = getLoopContextID(currentAction);

    //check if popup or open
    var messageLocation = currentAction.getAttribute("MessageLocation");
    //inspects parameters
    var parameters = $mn(currentAction, "Parameters/Parameter");
    var targetType, target, sourceValue;

    if (!checkExists(lookupWindow))
    {
        lookupWindow = window;
    }

    if (checkExists(messageLocation) && messageLocation === "Popup")
    {
        var title, heading, message, height, width;

        message = "";

        var messageType = "message";
        var size = "small";
        var messageCssClass = "runtime-message";

        //#region
        var isLiteral = true; // default
        //loop through parameters and add properties
        var p = parameters.length;
        while (p--)
        {
            var currentParam = parameters[p];
            targetType = currentParam.getAttribute("TargetType");
            target = currentParam.getAttribute("TargetID");

            if (targetType === "MessageProperty")
            {
                switch (target.toLowerCase())
                {
                    case "title":
                        sourceValue = lookupWindow.returnSourceValue({ item: currentParam, loopContextID: loopContextID, encodeTokenValues: false, behaviour: behaviour });
                        if (checkExistsNotEmpty(sourceValue))
                        {
                            title = sourceValue; // this is encoded in jquery.forms.widget.popupwindow.js:635 . Moving it here (or into returnSourceValue) might break other popups (Open Actions...).
                        }
                        break;
                    case "heading":
                        isLiteral = true;
                        var headingIsLiteral = currentAction.getAttribute("HeadingIsLiteral");
                        if (checkExistsNotEmpty(headingIsLiteral))
                        {
                            isLiteral = headingIsLiteral.toUpperCase() !== "FALSE";
                        }

                        sourceValue = lookupWindow.returnSourceValue({ item: currentParam, loopContextID: loopContextID, encodeTokenValues: SourceCode.Forms.Settings.EncodeMessageAction, behaviour: behaviour, isLiteral: isLiteral });
                        if (checkExistsNotEmpty(sourceValue))
                        {
                            heading = sourceValue;
                        }
                        break;
                    case "body":
                        isLiteral = true;
                        var bodyIsLiteral = currentAction.getAttribute("BodyIsLiteral");
                        if (checkExistsNotEmpty(bodyIsLiteral))
                        {
                            isLiteral = bodyIsLiteral.toUpperCase() !== "FALSE";
                        }

                        sourceValue = lookupWindow.returnSourceValue({ item: currentParam, loopContextID: loopContextID, encodeTokenValues: SourceCode.Forms.Settings.EncodeMessageAction, behaviour: behaviour, isLiteral: isLiteral, returnAccordingToType: true });
                        if (checkExistsNotEmpty(sourceValue))
                        {
                            message = sourceValue.replaceAll("\n", "<br/>");
                        }
                        break;
                    case "size":
                        sourceValue = lookupWindow.returnSourceValue({ item: currentParam, loopContextID: loopContextID, encodeTokenValues: false, behaviour: behaviour });
                        if (checkExistsNotEmpty(sourceValue))
                        {
                            size = sourceValue;
                        }
                        break;
                    case "type":
                        sourceValue = lookupWindow.returnSourceValue({ item: currentParam, loopContextID: loopContextID, encodeTokenValues: false, behaviour: behaviour });
                        if (checkExistsNotEmpty(sourceValue))
                        {
                            messageType = sourceValue;
                        }
                        break;
                }
            }
        }
        switch (size.toLowerCase())
        {
            case "small":
                height = 240;
                width = 320;
                messageCssClass += " size-small";
                break;
            case "medium":
                height = 360;
                width = 640;
                messageCssClass += " size-medium";
                break;
            case "large":
                height = 450;
                width = 800;
                messageCssClass += " size-large";
                break;
        }

        var bCancelClose = false; //default closing behaviour should be used
        var options = { showHeaderButtons: true, headerText: title, message: message, title: heading, height: height, width: width, type: messageType, cssClass: messageCssClass };
        var closeOptions;
        switch (messageType.toLowerCase())
        {
            case "confirmation":
                closeOptions = {
                    onAccept: function ()
                    {
                        removeLoopContextData({ loopContextID: loopContextID });

                        continuePromptingBehaviour(behaviour, true);
                    },
                    onCancel: function ()
                    {
                        cancelPromptingBehaviour(behaviour, methodExecuted, true, loopContextID);
                    },
                    cancelClose: bCancelClose
                };
                masterPopupManager.showConfirmation(jQuery.extend(options, closeOptions));
                break;
            case "none":
                options = $.extend(options, {
                    onClose: function ()
                    {
                        removeLoopContextData({ loopContextID: loopContextID });

                        continuePromptingBehaviour(behaviour, false);
                    },
                    showHeaderButtons: false,
                    type: null,
                    onShow: function (popup)
                    {
                        popup.element.find(".popup-body-content > .scroll-wrapper").addClass("no-left-panel");
                        var fileImage = popup.element.find("a.fileImage, img.fileImage");
                        if (fileImage.length > 0)
                        {
                            fileImage.on("click", openFileImageMessage);
                        }
                    }
                });

                closeOptions =
                    {
                        onClose: function ()
                        {
                            removeLoopContextData({ loopContextID: loopContextID });

                            continuePromptingBehaviour(behaviour, false);
                        },
                        cancelClose: bCancelClose
                    };

                masterPopupManager.showMessage(options);

                break;
            default:
                closeOptions =
                    {
                        onClose: function ()
                        {
                            removeLoopContextData({ loopContextID: loopContextID });

                            continuePromptingBehaviour(behaviour, false);
                        },
                        cancelClose: bCancelClose
                    };
                options = $.extend(options, {
                    onShow: function (popup)
                    {
                        var fileImage = popup.element.find("a.fileImage, img.fileImage");
                        if (fileImage.length > 0)
                        {
                            fileImage.on("click", openFileImageMessage);
                        }
                    }
                });
                masterPopupManager.showMessage(jQuery.extend(options, closeOptions));
                break;
        }
        //#endregion
    }
    else
    {
        var xmlDoc = $xml("<message/>");
        var mailNode = $sn(xmlDoc, "message");

        var messageURL = document.getElementById("CurrentURL").value.replace("View.aspx", "Message.aspx").replace("Form.aspx", "Message.aspx");
        currentAction.setAttribute("Url", messageURL);
        currentAction.setAttribute("Type", "Navigate");
        //#region
        //loop through parameters and add properties
        var params = parameters.length;
        while (params--)
        {
            var currentParameter = parameters[params];
            targetType = currentParameter.getAttribute("TargetType");
            target = currentParameter.getAttribute("TargetID");
            var isLiteral = true; // default

            if (targetType === "MessageProperty")
            {
                var valueOptions = { item: currentParameter, loopContextID: loopContextID, behaviour: behaviour };
                switch (target.toLowerCase())
                {
                    case "title":
                        valueOptions.encodeTokenValues = false
                        break;
                    case "heading":
                        var headingIsLiteral = currentAction.getAttribute("HeadingIsLiteral");
                        if (checkExistsNotEmpty(headingIsLiteral))
                        {
                            isLiteral = headingIsLiteral.toUpperCase() !== "FALSE";
                        }
                        valueOptions.encodeTokenValues = SourceCode.Forms.Settings.EncodeMessageAction;
                        valueOptions.isLiteral = isLiteral;
                        break;
                    case "body":
                        var bodyIsLiteral = currentAction.getAttribute("BodyIsLiteral");
                        if (checkExistsNotEmpty(bodyIsLiteral))
                        {
                            isLiteral = bodyIsLiteral.toUpperCase() !== "FALSE";
                        }
                        valueOptions.returnAccordingToType = true;
                        valueOptions.encodeTokenValues = SourceCode.Forms.Settings.EncodeMessageAction;
                        valueOptions.isLiteral = isLiteral;
                        break;
                    default:
                        valueOptions.returnAccordingToType = true;
                        break;
                }
                sourceValue = returnSourceValue(valueOptions);
                constructPropertyNode(xmlDoc, mailNode, target.toLowerCase(), sourceValue);
            }
        }
        //#endregion

        postData = setFrameVariable("message", xmlDoc.xml);
        navigateAction(currentAction, false, null, postData, false, behaviour);
    }
    //#endregion
}

function openFileImageMessage(evt)
{
    //#region
    var objClick = (evt.target) ? evt.target : evt.srcElement;
    var objTag = objClick.tagName;
    var sourcePath = "";
    switch (objTag.toUpperCase())
    {
        case "IMG":
            sourcePath = objClick.src.replace("&_controltype=image", "&_controltype=file");
            break;
        case "A":
            sourcePath = objClick.getAttribute("path");
            break;
    }
    var FileFrame = document.getElementById("HiddenFileFrame");
    FileFrame.style.display = "";
    FileFrame.style.display = "none";
    FileFrame.src = sourcePath;
    //#endregion
}

//executes a SharePoint action
function executeSharePointAction(currentAction, behaviour)
{
    //#region
    var loopContextID = getLoopContextID(currentAction);

    var method = currentAction.getAttribute("Method");
    switch (method)
    {
        case "SPCloseDialog":
            if (checkExists(document.parentWindow.parent))
            {
                document.parentWindow.parent.closeDialog();
            }
            break;
        case "SPCloseDialogAndRefresh":
            if (checkExists(document.parentWindow.parent))
            {
                document.parentWindow.parent.closeDialogAndRefreshList();
            }
            break;
    }

    endActionExecution({ loopContextID: loopContextID, behaviour: behaviour });
    //#endregion
}

var _runtimeRelatedExpressionsCache = new SFRuntimeHash();
var _runtimeRelatedControlsCache = new SFRuntimeHash();
//apply formatting & conditional formatting on the change of a control
function applyStyleAction(currentAction, behaviour)
{
    //#region
    var loopContextID = getLoopContextID(currentAction);

    if (checkExists(behaviour))
    {
        var sourceID = behaviour.SourceID;
        var sourceType = behaviour.SourceType;
        var sourceInstanceID = behaviour.SourceInstanceID;

        if (sourceType === "Control")
        {
            //conditional evaluation influenced by other controls will only happen when a value is actually changed
            var controlIds = _runtimeRelatedControlsCache.get(sourceID);
            if (!checkExists(controlIds))
            {
                controlIds = [];
                var control = _runtimeControllerFindObject({ controlID: sourceID });
                if (checkExists(control))
                {
                    var validControlForStylingNode = $sn(control, "Properties[Property/Name/text()='SetProperty'][(Styles/Style) or (ConditionalStyles)]");
                    if (!validControlForStylingNode)
                    {
                        control = null;
                    }
                }
                if (checkExists(control))
                {
                    var mainControlID = sourceID;

                    var controlsWithConditonalStylesKeys = ["controlsWithConditonalStyles"];
                    var controlsWithConditonalStyles = _runtimeRelatedExpressionsCache.get(controlsWithConditonalStylesKeys);
                    if (!checkExists(controlsWithConditonalStyles))
                    {
                        controlsWithConditonalStyles = $mn(viewControllerDefinition, "Controllers/Controller/Controls/Control[Properties/Property/Name/text()='SetProperty'][Properties/ConditionalStyles/ConditionalStyle[Condition]]");
                        _runtimeRelatedExpressionsCache.add(controlsWithConditonalStylesKeys, controlsWithConditonalStyles);
                    }
                    var controlIdHash = new SFRuntimeHash();
                    var mainControlFieldId = control.getAttribute("FieldID");

                    var styleXP = "Properties[ConditionalStyles/ConditionalStyle[Condition[.//@SourceType='Control' and .//@SourceID='" + mainControlID + "'";
                    if (checkExists(mainControlFieldId))
                    {
                        styleXP += " or .//@SourceType='ViewField' and .//@SourceID='" + mainControlFieldId + "'";
                    }
                    styleXP += "]]]";

                    controlIdHash.add(mainControlID);
                    controlIds.push(mainControlID);
                    var l = controlsWithConditonalStyles.length;
                    while (l--)
                    {
                        var currentControlNode = controlsWithConditonalStyles[l];
                        var conditionalStyleControlId = currentControlNode.getAttribute("ID");
                        if (!controlIdHash.get(conditionalStyleControlId))
                        {
                            var referencesThisControl = currentControlNode.selectSingleNode(styleXP);
                            if (checkExists(referencesThisControl))
                            {
                                controlIds.push(conditionalStyleControlId);
                                controlIdHash.add(conditionalStyleControlId);
                            }
                        }
                    }
                }
                _runtimeRelatedControlsCache.add(mainControlID, controlIds);
            }

            var l = controlIds.length;
            while (l--)
            {
                var currentControlNode = _runtimeControllerFindObject({ controlID: controlIds[l] });
                applyConstructedStyle(currentControlNode);
            }
        }
        else
        {
            var findControlXP;
            switch (sourceType)
            {
                case "View":
                    findControlXP = "Controllers/Controller[@ID='" + sourceID + "']" + returnInstanceXP(sourceInstanceID, false, false, true, false) + "/Controls/Control[Properties/Property/Name/text()='SetProperty'][(Properties/Styles/Style/*) or (Properties/ConditionalStyles)]";
                    break;
                case "Form":
                    findControlXP = "Controllers/Controller/Controls/Control[Properties/Property[Name/text()='SetProperty'][Value/text()!='updateFormProperty']][(Properties/Styles/Style/*) or (Properties/ConditionalStyles)]";
                    break;
            }
            if (checkExists(findControlXP))
            {
                var controls = $mn(viewControllerDefinition, findControlXP);

                var c = controls.length;
                while (c--)
                {
                    //get current control's combined style
                    applyConstructedStyle(controls[c]);
                }
            }
        }

        behaviour.isExecuting = false;
        //behaviour.executeBehaviour();//while loop covers this
    }

    removeLoopContextData({ loopContextID: loopContextID });
    //#endregion
}

var _runtimeControlBaseStyleCache = {};
var _runtimeControlConditionalStyleCache = {};

//apply the constructed style to each influenced control
function applyConstructedStyle(control, counter)
{
    //#region
    //get formatting base
    var baseStyles = null;
    var cacheKey = control.getAttribute("ID");
    var cacheEntry = _runtimeControlBaseStyleCache[cacheKey];
    if (checkExists(cacheEntry))
    {
        baseStyles = cacheEntry;
    }
    else
    {
        baseStyles = $sn(control, "Properties/Styles");
        _runtimeControlBaseStyleCache[cacheKey] = baseStyles;
    }

    //get conditional formattings - evaluate own
    var conditionalStyles = null;
    cacheEntry = _runtimeControlConditionalStyleCache[cacheKey];
    if (checkExists(cacheEntry))
    {
        conditionalStyles = cacheEntry;
    }
    else
    {
        conditionalStyles = $mn(control, "Properties/ConditionalStyles/ConditionalStyle");
        _runtimeControlConditionalStyleCache[cacheKey] = conditionalStyles;
    }


    var combinedStyle = (checkExists(baseStyles)) ? $xml(baseStyles.xml) : null; //create an xml document base
    var stylesArray = [];
    var c = conditionalStyles.length;

    if (c > 0)
    {
        _runtimeConditionalStylingBeingApplied = true;
        // evaluate expressions which may be used in the conditions immediately
        fireExpressions(true);
        while (c--)
        {
            var currentCS = conditionalStyles[c];
            var condition = $sn(currentCS, "Condition");
            var result = validateConditions(condition, counter);
            if (result === true)
            {
                if (checkExists(combinedStyle))
                {
                    stylesArray.push($sn(currentCS, "Styles").cloneNode(true));
                }
                else
                {
                    combinedStyle = $xml($sn(currentCS, "Styles").xml);
                }
            }
        }
        combinedStyle = combineStyles(combinedStyle, stylesArray);
        _runtimeConditionalStylingBeingApplied = false;
    }

    if (checkExists(combinedStyle))
    {
        if (!counter)
        {
            var objInfo = new PopulateObject(null, combinedStyle.xml, control.getAttribute("ID"), "Style");
            executeControlFunction(control, "SetProperty", objInfo);

            var formatValue = $sn(combinedStyle, "Styles/Style/Format");
            if (checkExists(formatValue))
            {
                var objInfo = new PopulateObject(null, formatValue.xml, control.getAttribute("ID"), "format");
                executeControlFunction(control, "SetProperty", objInfo);
            }
        }
        else
        {
            return combinedStyle;
        }
    }

    //#endregion
}

//function that runs through all the conditional styles and applies them to the base style (separated for reusability)
function combineStyles(baseStyleDoc, stylesArray)
{
    //#region
    var z = stylesArray.length;
    while (z--)
    {
        var currentStyleNode = stylesArray[z];
        if (checkExists(currentStyleNode))
        {
            var options =
                {
                    fromNode: currentStyleNode,
                    toNode: baseStyleDoc,
                    overideValue: true
                };
            MergeXmlNodes(options);
        }
    }
    return baseStyleDoc;
    //#endregion
}

//updates the margins of the workflow view
function updateWFMargins(paddingValue)
{
    //#region
    var workflowPane = jQuery("#WorkflowStrip");

    if (workflowPane.length > 0)
    {
        //only the relevant value will be set, and therefore needs updating
        var marginTop = workflowPane.css("margin-top");
        var marginBottom = workflowPane.css("margin-bottom");

        if ((!checkExists(marginTop) || parseInt(marginTop, 10) === 0 || marginTop.toString().toLowerCase() === "auto") && (checkExists(marginBottom) && parseInt(marginBottom, 10) > 0 && marginBottom.toString().toLowerCase() !== "auto"))
        {
            //top
            workflowPane[0].style.marginBottom = paddingValue;
            workflowPane[0].style.marginTop = "0px";
        }
        else if ((!checkExists(marginBottom) || parseInt(marginBottom, 10) === 0 || marginBottom.toString().toLowerCase() === "auto") && (checkExists(marginTop) && parseInt(marginTop, 10) > 0 && marginTop.toString().toLowerCase() !== "auto"))
        {
            //bottom
            var tabTop = jQuery(".theme-entry .tabs-top.tab-box .tab-box-body");
            if (tabTop.length > 0)
            {
                paddingValue = (parseInt(paddingValue, 10) + parseInt(tabTop.css("top"), 10)) + "px";
                jQuery(".runtime-form.theme-entry")[0].style.marginBottom = paddingValue;
            }
            workflowPane[0].style.marginTop = paddingValue;
            workflowPane[0].style.marginBottom = "0px";
        }
    }
    //#endregion
}

//updates the tab styles (when conditional formatting or refreshPadding is called)
function updateTabStyles(backgroundColor)
{
    //#region
    var tabBox = jQuery(".theme-entry>.tab-box");
    var bodies = tabBox.find(".tab-box-body");
    var b = bodies.length;
    while (b--)
    {
        bodies[b].style.backgroundColor = backgroundColor;
    }
    var tabs = tabBox.find("ul.tab-box-tabs a.tab span.tab-wrapper");
    var t = tabs.length;
    while (t--)
    {
        tabs[t].style.backgroundColor = backgroundColor;
        tabs[t].style.borderColor = backgroundColor;
    }
    //#endregion
}

//action that executes a method on a control - using objects, and handling result from method likewise
function ControlMethodExecuteAction(currentAction, behaviour)
{
    //#region
    var loopContextID = getLoopContextID(currentAction);

    var currentControlID = currentAction.getAttribute("ControlID");
    var methodName = currentAction.getAttribute("Method");
    var windowToUse = window.self;
    var sourceValue, sourceType, source;

    if (checkExists(currentControlID))
    {
        var currentControl = _runtimeControllerFindObject({ controlID: currentControlID, propertySearch: "ExecuteMethod" });

        if (checkExists(currentControl))
        {
            var methodParameters = {};
            var parameters = $mn(currentAction, "Parameters/Parameter");
            //#region
            var p = parameters.length;
            while (p--)
            {
                var targetType = parameters[p].getAttribute("TargetType");
                var target = parameters[p].getAttribute("TargetID");
                sourceType = parameters[p].getAttribute("SourceType");
                source = parameters[p].getAttribute("SourceID");
                sourceValue = returnSourceValue({ item: parameters[p], context: currentControlID, loopContextID: loopContextID, behaviour: behaviour });

                switch (targetType)
                {
                    case "ControlMethodParameter":
                        methodParameters[target] = sourceValue;
                        break;
                    case "ControlProperty":
                        updateTargetWithValue(currentAction, behaviour, parameters[p], windowToUse, source, sourceType, sourceValue);
                        break;
                }
            }
            //#endregion

            var objInfo =
                {
                    CurrentControlId: currentControlID,
                    methodName: methodName,
                    methodParameters: methodParameters
                };
            if (SourceCode.Forms.Browser.msie && SourceCode.Forms.Browser.version <= 8)
            {
                objInfo.CurrentControlID = currentControlID;
            }
            else
            {
                try
                {
                    Object.defineProperty(objInfo, "CurrentControlID",
                        {
                            get: function ()
                            {
                                var logObject =
                                    {
                                        type: 4,
                                        source: "executeControlFunction",
                                        category: "Helper",
                                        message: Resources.RuntimeMessages.WarningExecutingControlMethod,
                                        parameters: [objInfo.methodName],
                                        data: currentControl
                                    }
                                SFLog(logObject);
                                return this.CurrentControlId;
                            },
                            set: function (val)
                            {
                                this.CurrentControlId = val;
                            }
                        });
                }
                catch (ex)
                {
                    objInfo.CurrentControlID = currentControlID;
                }
            }

            var executionResult = null;

            if ((objInfo.methodName === "Focus") && (document.readyState !== "complete"))
            {
                $(window).on('load', function ()
                {
                    window.setTimeout(function ()
                    {
                        executeControlFunction(currentControl, "ExecuteMethod", objInfo, true);
                    }, 0);
                });
            }
            else
            {
                executionResult = executeControlFunction(currentControl, "ExecuteMethod", objInfo, true);
            }

            if (checkExists(executionResult))
            {
                var results = $mn(currentAction, "Results/Result");
                //#region
                var r = results.length;
                while (r--)
                {
                    sourceType = results[r].getAttribute("SourceType");
                    source = results[r].getAttribute("SourceID");
                    if (sourceType === "ControlMethodResult")
                    {
                        sourceValue = executionResult;
                    }
                    else
                    {
                        sourceValue = returnSourceValue({ item: results[r], context: currentControlID, loopContextID: loopContextID, behaviour: behaviour });
                    }

                    if (checkExists(sourceValue))
                    {
                        //set the target using the shared function
                        updateTargetWithValue(currentAction, behaviour, results[r], windowToUse, source, sourceType, sourceValue);
                    }
                }
                //#endregion
            }
        }
    }

    endActionExecution({ loopContextID: loopContextID, behaviour: behaviour });
    //#endregion
}

//continue execution of next handler
function continueBehaviour(behaviour)
{
    //#region
    //goes on with next handler
    if (checkExists(behaviour))
    {
        if (behaviour.evaluateContinueParentHandlers)//error handling with nested handlers
        {
            behaviour.evaluateContinueParentHandlers = false;
        }
        behaviour.actions = []; //stops further actions in this handler from executing, will continue to next handler
        behaviour.previousHandlerResult = true; //will allow fallback to else or always or other if handler executions
        behaviour.isExecuting = false;
    }
    //#endregion
}

//cancel any further execution in this rule
function exitBehaviour(behaviour)
{
    //#region
    if (checkExists(behaviour))
    {
        //behaviour = null;
        behaviour.stopped = true;
        behaviour.isExecuting = false;
    }
    //#endregion
}

//executes the error method, get information from the parameters and create the relevant error object
function executeErrorMethod(currentAction, behaviour)
{
    //#region
    var loopContextID = getLoopContextID(currentAction);

    var deferred = null;
    var errorObject = { category: "custom" };

    var parameters = $mn(currentAction, "Parameters/Parameter");
    //#region
    //loop through parameters and add properties
    var p = parameters.length;
    while (p--)
    {
        var target = parameters[p].getAttribute("TargetID");
        var sourceValue = returnSourceValue({ item: parameters[p], loopContextID: loopContextID, behaviour: behaviour });

        switch (target.toLowerCase())
        {
            case "error":
                errorObject.message = sourceValue;
                break;
            case "errorcategory":
                errorObject.category = sourceValue;
                break;
            case "errormessage":
                errorObject.message = sourceValue;
                break;
            case "errordetail":
                errorObject.detail = sourceValue;
                break;
            case "errortype":
                errorObject.type = sourceValue;
                break;
        }
    }

    if (!checkExists(behaviour))
    {
        deferred = $.Deferred();
    }
    if (checkExists(behaviour))
    {
        behaviour.handleError("custom", errorObject, null, null, null, loopContextID);
    }
    else if (deferred)
    {
        deferred.reject("custom", errorObject, null, null, null, loopContextID);
    }
    if (deferred)
    {
        return deferred.promise();
    }
    //#endregion
}

//keeps track of running behaviours and AJAX calls and notifies when idle state is first reached

function updateExecutionTracker(ajaxCounter, behaviourCounter, behaviorId)
{
    if (typeof ajaxCounter !== "undefined" && ajaxCounter !== null)
    {
        _runtimeAJAXExecutionCount = _runtimeAJAXExecutionCount + ajaxCounter;
    }
    else if (typeof behaviourCounter !== "undefined" && behaviourCounter !== null && typeof behaviorId === 'string')
    {
        if (behaviourCounter > 0 && _runtimeExecBehaviorIds.indexOf(behaviorId) === -1)
        {
            _runtimeExecBehaviorIds.push(behaviorId);
            _runtimeBehaviourExecutionCount = _runtimeBehaviourExecutionCount + behaviourCounter;
        }
        else if (behaviourCounter < 0 && _runtimeExecBehaviorIds.indexOf(behaviorId) > -1)
        {
            _runtimeExecBehaviorIds.splice(_runtimeExecBehaviorIds.indexOf(behaviorId), 1);
            _runtimeBehaviourExecutionCount = _runtimeBehaviourExecutionCount + behaviourCounter;
        }
    }

    if (_runtimeIdleState && !(_runtimeAJAXExecutionCount === 0 && _runtimeBehaviourExecutionCount === 0 && (!checkExists(_runtimePostInitEvents) || _runtimePostInitEvents.length === 0) && (!checkExists(_runtimePresetControls) || _runtimePresetControls.length === 0)))
    {
        _runtimeIdleState = false;
    }

    // Use setTimeout to allow all pending calls in the stack to execute to make sure it's done.
    setTimeout(function ()
    {
        if (_runtimeAJAXExecutionCount === 0 && _runtimeBehaviourExecutionCount === 0 && (!checkExists(_runtimePostInitEvents) || _runtimePostInitEvents.length === 0) && (!checkExists(_runtimePresetControls) || _runtimePresetControls.length === 0))
        {
            if (!_runtimeIdleState)
            {
                //hookin for mobile apps
                if (typeof _runtimeNotifyMobileAppNativeBridgeFunction === "function")
                {
                    _runtimeNotifyMobileAppNativeBridgeFunction();
                    _runtimeNotifyMobileAppNativeBridgeFunction = null;
                }

                _runtimeIdleState = true;
            }
        }
        else if (_runtimeIdleState)
        {
            _runtimeIdleState = false;
        }
    }.bind(this), 0);
}

//centralized helper function to close popups (managing timeout)
function completePopupClosing(popup, closeOptions)
{
    setTimeout(function ()
    {
        popup.closed(closeOptions);
    }, 0);
}
