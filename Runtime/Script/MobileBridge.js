(function ($)
{
    if (typeof SourceCode === "undefined" || SourceCode === null) { SourceCode = {}; }
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) { SourceCode.Forms = {}; }
    if (typeof SourceCode.Forms.Runtime === "undefined" || SourceCode.Forms.Runtime === null) { SourceCode.Forms.Runtime = {}; }
    if (typeof SourceCode.Forms.Runtime.MobileBridge === "undefined" || SourceCode.Forms.Runtime.MobileBridge === null)
    {
        var Methods =
            {
                ControlSupportedMethods: "supportedMethods",
                Barcode: "barcode",
                AnnotateImage: "annotateImage",
                LoadDraft: "loadDraft",
                SaveDraft: "saveDraft",
                RenewSession: "renewSession",
                TaskActioned: "taskActioned",
                FormSubmit: "formSubmit",
                FormSubmitted: "formSubmitted",
                FormHandlesSubmit: "formHandlesSubmit",
                PerformSubmit: "performSubmit",
                DownloadFile: "downloadFile",
                GetAvailableMemory: "getAvailableMemory"
            };

        var iFrameId = "mobileBridgeFrame";

        var MobileBridgeObject = function ()
        {
            this._hasCheckedSupport = false;
            this._hasRequestedSupportedMethods = false;
            this._supportedMethods = {};
            this._supportedMethodsDeferred = {};
            this._mobileAppRequests = [];
            this._inMobileAppContext = (navigator.userAgent.indexOf("Mobilies") >= 0 || location.href.indexOf("__Mobilies1d64e3af") > 0); // first part is for the actual app the second allows simulation
            this._apiV1 = (navigator.userAgent.indexOf("Mobilies") >= 0 || location.href.indexOf("__Mobilies1d64e3af") > 0);
            this._apiV2 = (navigator.userAgent.indexOf("Mobilies/2") >= 0 || location.href.indexOf("__Mobilies1d64e3af") > 0);
        };
        MobileBridgeObject.prototype =
            {
                inMobileAppContext: function ()
                {
                    return this._inMobileAppContext;
                },

                _isSupported: function (data)
                {
                    var deferred = this._supportedMethodsDeferred[data.methodName.toLowerCase()];
                    if (!checkExists(deferred))
                    {
                        deferred = this._supportedMethodsDeferred[data.methodName.toLowerCase()] = $.Deferred();
                    }
                    if (this._hasCheckedSupport)
                    {
                        deferred.resolve(this._supportedMethodsInclude(data.methodName));
                    }
                    else
                    {
                        this.sendToMobileDevice({ methodName: Methods.ControlSupportedMethods })
                            .done(this._smartFormsSupportedControlMethods.bind(this));
                    }
                    return deferred.promise();
                },

                isSupported: function (data)
                {
                    var masterWindow = SourceCode.Forms.Runtime.getMasterRuntimeWindow();
                    var masterWindowBridge = masterWindow.SourceCode.Forms.Runtime.MobileBridge;

                    return masterWindowBridge._isSupported(data);
                },

                _notifySupportedMethods: function (supportedMethods)
                {
                    this._hasCheckedSupport = true;

                    var thisContext = this;
                    if (checkExists(supportedMethods) && supportedMethods.length > 0)
                    {
                        supportedMethods.forEach(function (currentValue, index, arr)
                        {
                            thisContext._supportedMethods[currentValue.toLowerCase()] = true;
                        });
                    }

                    Object.keys(this._supportedMethodsDeferred).forEach(function (currentValue, index, arr)
                    {
                        thisContext._supportedMethodsDeferred[currentValue].resolve(thisContext._supportedMethodsInclude(currentValue));
                    });
                },

                _supportedMethodsInclude: function (methodName)
                {
                    return (this._supportedMethods[methodName.toLowerCase()] === true);
                },

                _generateCorrelationId: function ()
                {
                    return "".generateGuid();
                },

                _addRequest: function (url, message)
                {
                    message.correlationId = this._generateCorrelationId();

                    var prefix = (url.indexOf("?") > 0) ? "&" : "?";
                    url = url + prefix + "correlationId=" + message.correlationId;
                    this._mobileAppRequests.push(message);
                    return url;
                },

                _createMobileRequestIframe: function (id, url)
                {
                    var iframe = $("<iframe id='" + id + "' src='" + url + "' style='display:none;width:0;height:0'></iframe>");
                    iframe.appendTo($("body"));
                    return iframe;
                },

                _attemptMobileRequest: function (url, message)
                {
                    if (this._inMobileAppContext === true)
                    {
                        this._createMobileRequestIframe(iFrameId + message.correlationId, url);
                    }
                    else
                    {
                        this.sendToSmartFormsRuntime({ correlationId: message.correlationId, data: {}, error: { notInMobileAppContext: true } });
                    }
                },

                _submitMobileRequest: function (url, message)
                {
                    url = this._addRequest(url, message);

                    this._attemptMobileRequest(url, message);
                },

                _getRequestData: function (message)
                {
                    if (checkExists(message.correlationId))
                    {
                        var z = this._mobileAppRequests.length;
                        while (z--)
                        {
                            var item = this._mobileAppRequests[z];
                            if (item.correlationId === message.correlationId)
                            {
                                message.request = item;
                                this._mobileAppRequests.splice(z, 1);
                                break;
                            }
                        }
                        if (!checkExists(message.request))
                        {
                            SFLog({ type: 5, source: "MobileBridge", category: "Events", message: Resources.RuntimeMessages.MobileRequestNotFound, parameters: [message.correlationId] });
                        }
                    }
                },

                sendToMobileDevice: function (message)
                {
                    var masterWindow = SourceCode.Forms.Runtime.getMasterRuntimeWindow();
                    return masterWindow.SourceCode.Forms.Runtime.MobileBridge._sendToMobileDevice(message);
                },

                _sendToMobileDevice: function (message)
                {
                    message.deferred = $.Deferred();
                    switch (message.methodName)
                    {
                        case Methods.LoadDraft:
                            this._mobileLoadDraft(message);
                            break;
                        case Methods.ControlSupportedMethods:
                            this._mobileSupportedMethods(message);
                            break;
                        case Methods.RenewSession:
                            this._mobileRenewRequest(message);
                            break;
                        case Methods.TaskActioned:
                            this._mobileTaskActioned(message);
                            break;
                        case Methods.Barcode:
                        case Methods.AnnotateImage:
                        case Methods.FormSubmit:
                        case Methods.FormSubmitted:
                        case Methods.FormHandlesSubmit:
                        case Methods.DownloadFile:
                        case Methods.GetAvailableMemory:
                        default:
                            this._mobileSimpleRequest(message);
                            break;
                    }
                    return message.deferred.promise();
                },

                startFormSubmit: function ()
                {
                    var masterRuntimeWindow = SourceCode.Forms.Runtime.getMasterRuntimeWindow();
                    var msgPromise = this.sendToMobileDevice({ methodName: Methods.FormSubmit }).done(function ()
                    {
                        // Set the callback for when runtime has completed.
                        masterRuntimeWindow._runtimeNotifyMobileAppNativeBridgeFunction = function ()
                        {
                            this.SourceCode.Forms.Runtime.MobileBridge.sendToMobileDevice({ methodName: Methods.FormSubmitted });
                        }.bind(masterRuntimeWindow);
                        masterRuntimeWindow._runtimeIdleState = false;
                    });

                    return msgPromise;
                },

                // Method to return the available memory in the mobile app.
                // API Version 2.
                getAvailableMemory: function ()
                {
                    var promise = jQuery.Deferred();

                    // App API v2 support required.
                    if (this.inMobileAppContext() && this._apiV2)
                    {
                        var msgPromise = this.sendToMobileDevice({ methodName: "getAvailableMemory" });
                        msgPromise.done(function (message)
                        {
                            promise.resolve(message);
                        }.bind(this));

                        msgPromise.fail(function (message)
                        {
                            promise.reject(message);
                        }.bind(this));
                    }
                    else
                    {
                        promise.reject("Not Supported");
                    }

                    return promise;
                },

                // begin Bridge Mobile Methods:
                _mobileLoadDraft: function (message)
                {
                    var url = "https://device.{0}?draftId={1}".format(message.methodName, message.draftId);
                    this._submitMobileRequest(url, message);
                },

                _mobileSupportedMethods: function (message)
                {
                    if (!this._hasRequestedSupportedMethods)
                    {
                        //only make one request but store all callbacks
                        this._hasRequestedSupportedMethods = true;
                        var url = "https://device.{0}".format(message.methodName);
                        this._submitMobileRequest(url, message);
                    }
                },

                _mobileTaskActioned: function (message)
                {
                    var url = "https://device.{0}?serialNumber={1}&actionName={2}".format(message.methodName, message.serialNumber, message.actionName);
                    this._submitMobileRequest(url, message);
                },

                _mobileSimpleRequest: function (message)
                {
                    var url = "https://device.{0}".format(message.methodName);
                    this._submitMobileRequest(url, message);
                },

                _mobileRenewRequest: function (message)
                {
                    var url = "https://device.{0}?url={1}".format(message.methodName, encodeURIComponent(message.url));
                    this._submitMobileRequest(url, message);
                },
                //end Bridge Mobile Methods

                sendToSmartFormsRuntime: function (message)
                {
                    if (!checkExists(message))
                    {
                        return;
                    }

                    var result = this.sendToSmartFormsRuntimeInternal(message);

                    //no result on this window try other child windows
                    if (!checkExists(result))
                    {
                        var frames = window.frames;
                        var i;
                        var childWindow;

                        for (i = 0; i < frames.length && !checkExists(result); i++)
                        {
                            try
                            {
                                childWindow = frames[i].window;
                                if (checkExists(childWindow) && checkExists(childWindow.SourceCode) && checkExists(childWindow.SourceCode.Forms))
                                {
                                    result = childWindow.SourceCode.Forms.Runtime.MobileBridge.sendToSmartFormsRuntime(message);
                                }
                            }
                            catch (ex)
                            {
                            }

                        }
                    }
                    return result;
                },

                sendToSmartFormsRuntimeInternal: function (message)
                {
                    if (!checkExists(message))
                    {
                        return;
                    }

                    this._getRequestData(message);

                    var methodName;
                    if (checkExists(message.request))
                    {
                        // App response to client originated request.
                        methodName = checkExists(message.request.methodName) ? message.request.methodName : null;
                        $("#" + iFrameId + message.correlationId).remove();
                        message.request.deferred.resolve(message);
                    }
                    else if (checkExists(message.methodName))
                    {
                        // App originated request.
                        methodName = message.methodName;
                    }
                    else
                    {
                        // No method specified.
                        return;
                    }

                    // Methods that need to return data to the App.
                    var clientResponse;
                    switch (methodName)
                    {
                        case Methods.SaveDraft:
                            clientResponse = this._smartFormsSaveDraft(message);
                            break;
                        case Methods.DownloadFile:
                            clientResponse = this._getDownloadFileData(message);
                            break;
                        case Methods.PerformSubmit:
                            clientResponse = this._performSubmit(message);
                            break;
                    }
                    return clientResponse;
                },

                // begin  Bridge SmartForms Methods

                //Note control method responses will go directly to the control's done function
                //data structure
                // string correlationId
                // object methodParameters
                //e.g. imageAnnotation
                //SourceCode.Forms.Runtime.MobileBridge.sendToSmartFormsRuntime({{'correlationId':'{0}','data': {{FileName:'{1}', Size:{2}, Path:'{3}', FileData:'{4}' }} }})", correlationId, fileName, size, path, fileData);
                //e.g. barcode
                //string.Format("SourceCode.Forms.Runtime.MobileBridge.sendToSmartFormsRuntime({{'correlationId':'{0}','data':'{1}'}})", correlationId, barcode);


                //data structure
                // string correlationId
                // object methodParameters
                //		object supportedMethods
                //				array of strings
                //string.Format("SourceCode.Forms.Runtime.MobileBridge.sendToSmartFormsRuntime({correlationId:'{0}', data:['{1}','{2}']})", correlationId, methodName1, methodName2);
                _smartFormsSupportedControlMethods: function (message)
                {
                    this._notifySupportedMethods(message.data);
                },

                //data structure
                // string methodName
                // function callback
                // object callbackInstance
                // string.Format("SourceCode.Forms.Runtime.MobileBridge.sendToSmartFormsRuntime({methodName:'{0}', callbackInstance: {0}, callback: {1} });", "K2Mobile", "K2Mobile.executionCallback");
                // returns string draftData (JSON string)
                _smartFormsSaveDraft: function (message)
                {
                    var draftData = SourceCode.Forms.Runtime.getSerializedContextDraft();
                    if (checkExists(message.callback)) // android
                    {
                        message.callback.call(message.callbackInstance, draftData);
                    }
                    else // iOS
                    {
                        return draftData;
                    }
                },

                _performSubmit: function (message)
                {
                    var result = false;
                    if (checkExistsNotEmpty(currentForm) && checkExistsNotEmpty(_runtimeCallerType))
                    {
                        result = verifyEventHandling(currentForm, _runtimeCallerType, "Submit");
                        if (result)
                        {
                            this.startFormSubmit().done(function ()
                            {
                                // Raise the event to allow execution of the submit behavior(s).
                                handleEvent(currentForm, _runtimeCallerType, "Submit", null, null, null, null, null, null, null, null, null);
                            });
                        }
                    }

                    if (checkExists(message.callback)) // android
                    {
                        message.callback.call(message.callbackInstance, result);
                    }
                    else // iOS
                    {
                        return result;
                    }
                },

                _getDownloadFileData: function (message)
                {
                    if (checkExists(message.request) && typeof message.request.callback === "function")
                    {
                        var dataURL = message.request.callback();

                        if (checkExists(message.callback)) // android
                        {
                            message.callback.call(message.callbackInstance, dataURL);
                        }
                        else // iOS
                        {
                            return dataURL;
                        }
                    }
                },

                // end Bridge SmartForms Methods

                reset: function ()
                {
                    SourceCode.Forms.Runtime.MobileBridge = new MobileBridgeObject();
                }
            };

        SourceCode.Forms.Runtime.MobileBridge = new MobileBridgeObject();
    }
})(jQuery);
