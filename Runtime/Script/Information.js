(function ($)
{
    if (typeof SourceCode === "undefined" || SourceCode === null) { SourceCode = {}; }
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) { SourceCode.Forms = {}; }
    if (typeof SourceCode.Forms.Runtime === "undefined" || SourceCode.Forms.Runtime === null) { SourceCode.Forms.Runtime = {}; }
    if (typeof SourceCode.Forms.Runtime.Information === "undefined" || SourceCode.Forms.Runtime.Information === null)
    {
        var informationObject = function ()
        {
            this._contextHashes = {};
        };
        informationObject.prototype =
        {
            getContextHash: function (options)
            {
                var hashName = returnHashName(options.viewId, options.instanceId);
                return this._contextHashes[hashName];
            },

            ensureContextHash: function (options)
            {
                var result = this.getContextHash(options);
                if (!checkExists(result))
                {
                    result = {};
                    options.value = result;
                    this.setContextHash(options);
                }
                return result;
            },

            setContextHash: function (options)
            {
                var hashName = returnHashName(options.viewId, options.instanceId);
                this._contextHashes[hashName] = options.value;
            },

            ensureControlBrokerHistory: function (options)
            {
                var contextHash = this.ensureContextHash({ viewId: options.viewId, instanceId: options.instanceId });
                if (!checkExists(contextHash.ControlBrokerHistory))
                {
                    contextHash.ControlBrokerHistory = {};
                }
                return contextHash.ControlBrokerHistory;
            },

            getControlBrokerHistory: function (options)
            {
                var result = null;
                var contextHash = this.getContextHash({ viewId: options.viewId, instanceId: options.instanceId });
                if (checkExists(contextHash) && checkExists(contextHash.ControlBrokerHistory))
                {
                    result = contextHash.ControlBrokerHistory[options.controlId];
                }
                return result;
            },

            setControlBrokerHistory: function (options)
            {
                var controlBrokerHistory = this.ensureControlBrokerHistory({ viewId: options.viewId, instanceId: options.instanceId });
                controlBrokerHistory[options.controlId] = options.value;
            },

            ensureControlWorkflowHistory: function (options)
            {
                var contextHash = this.ensureContextHash({ viewId: options.viewId, instanceId: options.instanceId });
                if (!checkExists(contextHash.ControlWorkflowHistory))
                {
                    contextHash.ControlWorkflowHistory = {};
                }
                return contextHash.ControlWorkflowHistory;
            },

            getControlWorkflowHistory: function (options)
            {
                var result = null;
                var contextHash = this.getContextHash({ viewId: options.viewId, instanceId: options.instanceId });
                if (checkExists(contextHash) && checkExists(contextHash.ControlWorkflowHistory))
                {
                    result = contextHash.ControlWorkflowHistory[options.controlId];
                }
                return result;
            },

            setControlWorkflowHistory: function (options)
            {
                var controlWorkflowHistory = this.ensureControlWorkflowHistory({ viewId: options.viewId, instanceId: options.instanceId });
                controlWorkflowHistory[options.controlId] = options.value;
            },

            ensureControlPropertyHistory: function (options)
            {
                var contextHash = this.ensureContextHash({ viewId: options.viewId, instanceId: options.instanceId });
                if (!checkExists(contextHash.ControlPropertyHistory))
                {
                    contextHash.ControlPropertyHistory = {};
                }
                if (!checkExists(contextHash.ControlPropertyHistory[options.controlId]))
                {
                    contextHash.ControlPropertyHistory[options.controlId] = {};
                }
                return contextHash.ControlPropertyHistory[options.controlId];
            },

            getControlPropertyHistory: function (options)
            {
                var result = null;
                var contextHash = this.getContextHash({ viewId: options.viewId, instanceId: options.instanceId });
                if (checkExists(contextHash) && checkExists(contextHash.ControlPropertyHistory) && checkExists(contextHash.ControlPropertyHistory[options.controlId]) )
                {
                    result = contextHash.ControlPropertyHistory[options.controlId][options.propertyName];
                }
                return result;
            },

            setControlPropertyHistory: function (options)
            {
                var controlPropertyHistory = this.ensureControlPropertyHistory({ viewId: options.viewId, instanceId: options.instanceId, controlId: options.controlId });
                controlPropertyHistory[options.propertyName] = options.value;
            },

            saveState: function ()
            {
                var state = $.extend({}, this._contextHashes, true);
                return state;
            },

            loadState: function (state)
            {
                if (typeof state === "string")
                {
                    state = JSON.parse(state);
                }

                for (var hashName in state)
                {
                    var hash = state[hashName];
                    if (checkExists(hash.ControlPropertyHistory))
                    {
                         for (var controlId in hash.ControlPropertyHistory)
                         {
                             var control = hash.ControlPropertyHistory[controlId];
                             ["field", "controlexpression", "datatype", "parentusingfield"].forEach(function (propertyName)
                             {
                                 var propertyValue = control[propertyName];
                                 if (checkExists(propertyValue))
                                 {
                                     updateSpecialControlProperties(
                                         {
                                             controlId: controlId,
                                             propertyName: propertyName,
                                             propertyValue: propertyValue,
                                             skipAction: true
                                         });
                                 }
                             });
                         }
                    }
                }
                this._contextHashes = state;
            },

            reset: function ()
            {
                this._contextHashes = {};
            }
        };
        SourceCode.Forms.Runtime.Information = new informationObject();
    }
})(jQuery);
