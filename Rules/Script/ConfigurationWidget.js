var focussedTokenbox;

//this is the genericwizard that will be called from the rules engine. It will load the mapping or conditions wizard and get the data using relevant plugins.
function ConfigurationWidget()
{
}

ConfigurationWidget.prototype = {
    //this function is called to initialize the configuration wizard
    _scalePercentage: 0.8,
    containerData: null,
    initialize: function ()
    {
        //#region
        this.pluginReturnedId = "".generateGuid() + ".pluginReturned";
        //modalizer.show(true);
        if (this.forcedClick !== true)
        {
            jQuery("#ruleWizardPopup").modalize(true).showBusy(true);
            //read plugin information
            this.pluginsCount = 0; //no of plugins
            var pluginsMethods = [];
            var plugins = [];
            this.pluginsReturned = 0; //how many has returned data
            if (!this.contextsXml)
                this.contextsXml = parseXML("<nodes/>");
            this.targetXml = parseXML("<Item/>");
            //call plugin methods 
            jQuery(document.body).on(this.pluginReturnedId, this.pluginReturn.bind(this));

            var settingsLength = this.Settings.length;

            if (!$chk(settingsLength))
            {
                var targetSetting = this.Settings.Target;
                var newSettingsArray = [];
                var newSettingsObject = {};
                newSettingsObject["Contexts"] = this.Settings.Contexts;

                newSettingsArray[0] = newSettingsObject;
                this.Settings = newSettingsArray;
                settingsLength = 1;

                if (checkExists(targetSetting))
                {
                    newSettingsObject["Target"] = targetSetting;
                }
            }

            for (var s = 0; s < settingsLength; s++)
            {
                var targetPluginName = this.Settings[s].Target ? this.Settings[s].Target.Parameters.pluginName : null;
                var targetPluginMethod = this.Settings[s].Target ? this.Settings[s].Target.Parameters.pluginMethod : null;
                var targetPlugin = null;
                //call target plugin (if available)
                if (targetPluginName && targetPluginMethod)
                {
                    var targetPluginType = getMethodByName(targetPluginName, getWindowObj());
                    targetPlugin = new targetPluginType();
                    targetPlugin.Settings = this.Settings[s].Target.Parameters;
                    targetPlugin.dataType = "target";
                    targetPlugin.resultName = this.Settings[s].ResultName;
                    targetPlugin.pluginReturnedId = this.pluginReturnedId;
                    with (targetPlugin) { var t = getMethodByName(targetPluginMethod, targetPlugin).bind(targetPlugin); }
                    pluginsMethods.push(t);
                    plugins.push(targetPlugin);
                    this.pluginsCount++;
                }

                var contextsLength = this.Settings[s].Contexts.length;
                for (var j = 0; j < contextsLength; j++)
                {
                    var pluginName = this.Settings[s].Contexts[j].PlugIn;
                    var pluginMethod = this.Settings[s].Contexts[j].Method;
                    var pluginType = getMethodByName(pluginName, getWindowObj());
                    var plugin = new pluginType();
                    plugin.Settings = this.Settings[s].Contexts[j].Parameters;
                    plugin.resultName = this.Settings[s].ResultName;
                    plugin.pluginReturnedId = this.pluginReturnedId;

                    //first check if this is the same as the target plugin, if it is do not get the ajaxcall for this as well just add context to the datatype
                    if (targetPlugin && plugin.equals && plugin.equals(targetPlugin, false, true) && targetPlugin.dataType !== "target|context")
                    {
                        targetPlugin.dataType = "target|context";
                        this.pluginsCount++;
                    }
                    else
                    {

                        var alreadyExists = false;
                        for (var k = 0; k < plugins.length; k++)
                        {
                            if (plugins[k].equals && plugins[k].equals(plugin, false, true))
                            {
                                alreadyExists = true;
                                break;
                            }
                        }
                        if (!alreadyExists)
                        {

                            with (plugin)
                            {
                                var t = getMethodByName(pluginMethod, plugin).bind(plugin);
                                pluginsMethods.push(t);
                            }

                            plugins.push(plugin);
                            this.pluginsCount++;
                        }

                    }

                }
            }
            //If there are no plugin methods to fire proceed with load
            //This should only fire when there are no context values
            if (pluginsMethods.length === 0)
            {
                this.load();
            }
            for (var j = 0; j < pluginsMethods.length; j++)
            {
                var method = pluginsMethods[j];
                method.call();
            }

            pluginsMethods.length = 0;
            plugins.length = 0;

            //#endregion

        }
    },

    load: function ()
    {
        var _this = this;
        //#region
        if ((typeof _this.pluginReturnedId !== "undefined") && (_this.pluginReturnedId !== null) && (_this.pluginReturnedId !== ""))
        {
            jQuery(document.body).off(_this.pluginReturnedId);
        }
        //when all data has been gathered load the popup
        jQuery("#ruleWizardPopup").modalize(false).showBusy(false);

        if (this.silentMap !== true)
        {
            //if there is no items to display as target
            var settingsLength = this.Settings.length;

            var _documentBody = document.body;
            if (settingsLength === 1)
            {
                var dropTextBoxLength = 0;
                if (this.targetXml)
                {
                    if (this.Settings[0].Target && this.Settings[0].Target.Parameters.filterTypes)
                    {
                        var xpathSelector = "";
                        var listTypeSplit = this.Settings[0].Target.Parameters.filterTypes.split("|");
                        for (var v = 0; v < listTypeSplit.length; v++)
                        {
                            if (xpathSelector.length > 0)
                            {
                                xpathSelector += " or ";
                            }
                            xpathSelector += "@ItemType = '" + listTypeSplit[v] + "'";
                        }
                        dropTextBoxLength = this.targetXml.selectNodes("//Item[" + xpathSelector + "]").length;
                    }
                    else
                    {
                        dropTextBoxLength = this.targetXml.selectNodes("//Item").length;
                    }

                    if ((dropTextBoxLength === 0 && (!checkExists(this.ignoreEmptyItemList) || this.ignoreEmptyItemList.toLowerCase() !== "true")) && !checkExists(_this.value))
                    {
                        popupManager.showWarning(Resources.CommonPhrases.NoItemsToDisplay);
                        return;
                    }
                }

                var configurationHeadingText = Resources.Filtering.RulesWizardPopupHeader;
                if (this.PopupHeading) configurationHeadingText = this.PopupHeading;

                var popupMaximizable = false;
                if (this.PopupMaximizable) popupMaximizable = (this.PopupMaximizable === true || this.PopupMaximizable.toLowerCase() === "true") ? true : false;
                var contextHeadingText = Resources.Filtering.FilterWidgetContextHeading;
                if (this.ContextHeading) contextHeadingText = this.ContextHeading;

                //figure out if it should display in a popup or div
                //create popup
                var containerElement = null;
                if (this.openPopup)
                {
                    if ((checkExists(this.Settings[0].Target)) && (checkExists(this.Settings[0].Target.Widget)))
                    {
                        switch (this.Settings[0].Target.Widget)
                        {
                            case "BrowserNavigateMappingWidget":
                                this.HelpID = 7057;
                                break;
                            case "FormNavigateMappingWidget":
                                this.HelpID = 7058;
                                break;
                            case "ControlPropertiesMappingWidget":
                                this.HelpID = 7063;
                                break;
                        }

                        if (!checkExists(this.TargetWidget))
                        {
                            this.TargetWidget = this.Settings[0].Target.Widget;
                        }
                    }

                    var helpID = this.HelpID ? this.HelpID : 7053;

                    var dialogCssClass = "";
                    if (this.TargetWidget === "ConditionWidget")
                    {
                        dialogCssClass = "id-condition-widget";
                    }

                    containerElement = jQuery("<div></div>");
                    popupManager.showPopup({
                        id: this.TargetWidget + "Dialog",
                        buttons: [
                            { type: "help", click: function () { HelpHelper.runHelp(helpID); } },
                            { text: Resources.WizardButtons.OKButtonText, click: this.popupOkClick.bind(this) },
                            { text: Resources.WizardButtons.CancelButtonText, click: this.popupCancelClick.bind(this) }
                        ],
                        headerText: configurationHeadingText,
                        content: containerElement,
                        modalize: true,
                        width: Math.floor(jQuery(window).width() * this._scalePercentage),
                        height: Math.floor(jQuery(window).height() * this._scalePercentage),
                        maximizable: popupMaximizable,
                        onMaximize: checkExists(this.PopupOnMaximize) ? this.PopupOnMaximize : $.noop,
                        onRestore: checkExists(this.PopupOnRestore) ? this.PopupOnRestore : $.noop,
                        onClose: this.popupOnClose.bind(this),
                        cssClass: dialogCssClass,
                        removeContent: true
                    });

                    containerElement.find(".pane-container").panecontainer();
                    this.container = containerElement;
                }
                else
                {
                    containerElement = this.container;
                }

                var showContext = true;

                if ($chk(this.Settings[0].Target) &&
                    $chk(this.Settings[0].Target.Parameters.showContext) &&
                    this.Settings[0].Target.Parameters.showContext.toLowerCase() === "false")
                {
                    showContext = false;
                }
                else if ($chk(this.TargetWidgetOptions) &&
                    $chk(this.TargetWidgetOptions.showContext) &&
                    this.TargetWidgetOptions.showContext.toLowerCase() === "false")
                {
                    showContext = false;
                }

                //call dropTreeCanvas (layout widget)
                containerElement.targetContextCanvas({ contextTreeTitle: contextHeadingText, isTreeRightAligned: true, showContext: showContext, Settings: this.Settings });

                //get dropTreeCanvas canvas area

                //read target information
                //call target load, pass configurationXml, targetXml and contextxml (to get display for mapping) in,
                var mappingWidgetType = this.Settings[0].Target ?
                    getMethodByName(this.Settings[0].Target.Widget, getWindowObj()) :
                    getMethodByName(this.TargetWidget, getWindowObj());
                this.mappingWidget = new mappingWidgetType();

                //set target xml to mappingWidget
                this.mappingWidget.targetXml = this.targetXml;
                this.mappingWidget.Settings = (this.Settings[0].Target) ? this.Settings[0].Target.Parameters : null;
                this.mappingWidget.filterTypes = (this.Settings[0].Target) ? this.Settings[0].Target.Parameters.filterTypes : null;
                this.mappingWidget.resultTypes = (this.Settings[0].Target) ? this.Settings[0].Target.Parameters.resultTypes : null;
                this.mappingWidget.TargetHeading = this.TargetHeading;
                this.mappingWidget.contextsXml = this.contextsXml;
                this.mappingWidget.Collections = this.Settings[0].Collections;
                this.mappingWidget.basicTargetContextCanvas = containerElement;
                this.mappingWidget.controlID = this.controlID;
                this.mappingWidget.containerData = this.containerData;

                if (typeof this.TargetWidgetOptions === "string")
                    this.mappingWidget.options = JSON.parse(this.TargetWidgetOptions);

                // expect element to return and add element to canvas area.
                var targetContainer = containerElement.targetContextCanvas("option", "targetCanvas");
                var initMethod = null;

                with (this.mappingWidget)
                {
                    initMethod = (this.Settings[0].Target) ?
                        getMethodByName(this.Settings[0].Target.Method, this.mappingWidget).bind(this.mappingWidget) :
                        getMethodByName(this.TargetWidgetMethod, this.mappingWidget).bind(this.mappingWidget);
                }
                //targetContainer.append(initMethod());
                if (this.mappingWidget.initCallBack)
                {
                    this.mappingWidget.initCallBack = function ()
                    {
                        _this.afterPluginInit(containerElement);
                    };
                }
                initMethod(targetContainer);

                if (!this.mappingWidget.initCallBack)
                {
                    _this.afterPluginInit(containerElement);
                }
                jQuery("#ruleWizardPopup").modalize(false).showBusy(false);
                //#endregion
            }
            else
            {
                var settingsXmlDoc = parseXML("<Settings />");

                for (var s = 0; s < settingsLength; s++)
                {
                    var settingEl = settingsXmlDoc.createElement("Setting");
                    settingEl.setAttribute("Name", this.Settings[s].Name);
                    settingEl.setAttribute("ResultName", this.Settings[s].ResultName);
                    settingsXmlDoc.documentElement.appendChild(settingEl);
                }

                var data = {
                    targetXml: encodeURIComponent(this.targetXml.xml),
                    contextsXml: encodeURIComponent(this.contextsXml.xml),
                    settingsXml: encodeURIComponent(settingsXmlDoc.xml)
                };

                var options = {
                    url: applicationRoot + "Rules/Mappings.aspx",
                    type: 'POST',
                    cache: false,
                    data: data,
                    async: false,
                    success: function (responseText, textStatus, XMLHttpRequest)
                    {
                        _this.loadAdvancedWizardPartialPageSuccess(responseText, textStatus);
                    },
                    error: function (responseText, textStatus, XMLHttpRequest)
                    {
                        _this.loadAdvancedWizardPartialPageError(responseText, textStatus);
                    }

                };

                jQuery.ajax(options);
            }
        }
    },

    updated: function ()
    {
        // TFS: 515034
        if (typeof (this.mappingWidget.updated) === 'function')
        {
            this.mappingWidget.updated();
        }
    },

    loadAdvancedWizardPartialPageError: function (responseText, textStatus, XMLHttpRequest)
    {
        //TODO: TD 0020
    },

    loadAdvancedWizardPartialPageSuccess: function (responseText, textStatus, XMLHttpRequest)
    {
        var _this = this;
        var _documentBody = document.body;
        var jq_rulesWizardContainerWrapper = jQuery('<div id="rulesWizardContainerWrapper" class="wrapper"></div>');
        jq_rulesWizardContainerWrapper.empty().html(responseText);

        var configurationHeadingText = Resources.Filtering.RulesWizardPopupHeader;
        if (this.PopupHeading) configurationHeadingText = this.PopupHeading;

        _this.mappingWidget = new AdvancedMappingWidget();

        var RulesMappingDialog = jQuery.popupManager.showPopup(
            {
                content: jq_rulesWizardContainerWrapper,
                modalize: true,
                draggable: true,
                id: "ruleWizardMappingPopup",
                headerText: configurationHeadingText,
                height: Math.floor(jQuery(window).height() * this._scalePercentage),
                maximizable: true,
                showHeaderButtons: true,
                width: Math.floor(jQuery(window).width() * this._scalePercentage),
                buttons: [
                    {
                        type: "help",
                        click: function ()
                        {
                            var activeWizardStep = jQuery("#RuleMappingWizard .wizard-step-content.active");
                            var stepID = activeWizardStep.attr("id").replaceAll("RuleMappingWizard_", "").replaceAll("_wizard_step", "");
                            var helpID = 7053;

                            switch (stepID)
                            {
                                case "Filter":
                                    helpID = 7054;
                                    break;

                                case "Order":
                                    helpID = 7055;
                                    break;

                                case "Settings":
                                    helpID = 7056;
                                    break;
                            }

                            HelpHelper.runHelp(helpID);
                        }
                    },
                    {
                        text: Resources.WizardButtons.PreviousButtonText,
                        type: "backward"
                    },
                    {
                        text: Resources.WizardButtons.ForwardButtonText,
                        type: "forward"
                    },
                    {
                        text: Resources.WizardButtons.FinishButtonText,
                        type: "finish"
                    },
                    {
                        text: Resources.WizardButtons.CancelButtonText,
                        type: "cancel",
                        id: "cancelRulesWizardButton"
                    }
                ],
                onClose: this.popupOnClose.bind(this.mappingWidget),
                removeContent: true
            });

        RulesMappingDialog.show();

        jQuery("#RuleMappingWizard").wizard({
            buttons: RulesMappingDialog.children(".popup-footer").find("a.button"),
            cancel: function () { with (_this) { _this.mappingWidget.popupCancelClick(); } },
            finish: function () { with (_this) { _this.mappingWidget.popupFinishClick(); } },
            validate: this.mappingWidget.popupValidateClick.bind(this.mappingWidget),
            show: function ()
            {
                window.setTimeout(
                    function ()
                    {
                        jQuery("#RuleMappingWizard").find(".wizard-step-content.active").find(".pane-container").panecontainer();
                        // TFS: 515034
                        _this.mappingWidget.updated();
                    }
                    , 20);
            }
        });

        _this._setupAdvancedMappingWidget();
    },

    _setupAdvancedMappingWidget: function ()
    {
        this.mappingWidget["ContextHeading"] = checkExistsNotEmpty(this.ContextHeading) ? this.ContextHeading : Resources.Filtering.FilterWidgetContextHeading;
        this.mappingWidget["Settings"] = this.Settings;
        this.mappingWidget["targetXml"] = this.targetXml;
        this.mappingWidget["contextsXml"] = this.contextsXml;
        this.mappingWidget["controlID"] = this.controlID;
        this.mappingWidget["value"] = this.value;
        this.mappingWidget["containerData"] = this.containerData;
        this.mappingWidget["TargetHeading"] = this.TargetHeading;
        this.mappingWidget["wizard"] = jQuery("#RuleMappingWizard");

        this.mappingWidget.initialize();
    },

    //this function is called as part of load after the plugin has initialised
    afterPluginInit: function (containerElement)
    {
        //call target getSettings() //expect {dropTolerance:'touch',dropElements:[],needExtraContext:'true',extraContextElement:,extraContextTree}
        if (this.mappingWidget.getSettings)
        {
            var targetSettings = this.mappingWidget.getSettings();
            if (targetSettings.dropTolerance)
            {
                containerElement.targetContextCanvas("option", "dropTolerance", targetSettings.dropTolerance);

            }
            if (targetSettings.dropElements && targetSettings.dropElements.length > 0)
            {
                containerElement.targetContextCanvas("removeDragDrop");
                containerElement.targetContextCanvas("add", "dropElements", targetSettings.dropElements);
                containerElement.targetContextCanvas("addDragDrop");
            }
        }

        //populate tree in dropTreeCanvas with nodes
        containerElement.targetContextCanvas("add", "contextXML", this.contextsXml);
        containerElement.targetContextCanvas("attemptToExpandContextTree");
        this.mappingWidget.setConfigurationXml(this.value, containerElement);

        //add drag and drop stuff to dropTreeCanvas

        containerElement.find(".pane-container").panecontainer();

        if (containerElement.find(".pane-container").children(".pane:first-child").find(".toolbar").length === 0)
        {
            containerElement.find(".pane-container").children(".pane:last-child").css("top", "0px");
        }
    },

    pluginReturn: function (e)
    {
        var _this = this;

        //each time a plugin returns it calls this function.
        //when all the plugins has returned it loads the popup (calls the load function).
        //#region
        //var _this = e.data;
        var returnedXml = e.detail.xml;
        var returnedType = e.detail.type;
        var resultName = e.detail.resultName;
        _this.pluginsReturned++;

        //plugins can be of type context with a tree context xml or of type target with a util item xml.
        if (returnedXml.documentElement)
        {
            var clonedReturnXML;

            if (returnedType === 'context')
            {
                //sort context items so that system values is first, then forms (alphabetically) then views (alphabetically)
                var type = returnedXml.documentElement.getAttribute("ItemType");
                var name = returnedXml.documentElement.getAttribute("text");
                var pos = _this._getContextTreePosition(_this.contextsXml.documentElement, type, name);

                clonedReturnXML = returnedXml.documentElement.cloneNode(true);

                if ($chk(resultName)) clonedReturnXML.setAttribute("ResultName", resultName);

                if (pos === _this.contextsXml.documentElement.childNodes.length)
                {
                    _this.contextsXml.documentElement.appendChild(clonedReturnXML);
                }
                else
                {
                    _this.contextsXml.documentElement.insertBefore(clonedReturnXML, _this.contextsXml.documentElement.childNodes[pos]);
                }

            }
            else if (returnedType === 'target')
            {
                clonedReturnXML = returnedXml.documentElement.cloneNode(true);
                if ($chk(resultName)) clonedReturnXML.setAttribute("ResultName", resultName);

                _this.targetXml.documentElement.appendChild(clonedReturnXML);
            }
        }

        if (_this.pluginsReturned === _this.pluginsCount)
        {
            jQuery("#ruleWizardPopup").modalize(false).showBusy(false);
            _this.load();
        }

        //#endregion
    },

    save: function ()
    {
        //when the save method is called return the xml
        //#region
        var result = this.mappingWidget.getConfigurationXML();
        if (typeof (result) === "boolean" && result === false) //validation failed - can not close
        {
            return false;
        }
        else
        {
            if ($chk(this.returnDisplay))
            {
                this.display = result.returnDisplay;
                this.value = result.value;
            }
            else if (result.display)
            {
                this.display = result.display;
                this.value = result.value;
            }
            else
            {
                this.value = result;
            }

            var widgetCompletedResult = this.onWidgetCompleted(this);
            if (typeof widgetCompletedResult === "undefined" || widgetCompletedResult === null || widgetCompletedResult === true)
            {
                if (this.container && this.container.isWidget("targetContextCanvas"))
                    this.container.targetContextCanvas("destroy");
                if (this.mappingWidget)
                    this.mappingWidget.dispose();
                return true;
            }
            else
                return false;
        }
        //#endregion
    },

    onWidgetCompleted: function (_this)
    {
        SourceCode.Forms.Designers.Rule.onWidgetCompleted(_this);
    },

    popupOkClick: function ()
    {
        //#region
        var canClose = this.save();
        if (canClose && this.openPopup)
        {
            this.successFullyConfigured = true;
            popupManager.closeLast();
        }
        return canClose;
        //#endregion
    },

    popupCancelClick: function ()
    {
        //#region
        if (this.openPopup)
        {
            popupManager.closeLast();
        }
        else
        {
            if (this.container && this.container.isWidget("targetContextCanvas"))
                this.container.targetContextCanvas("destroy");
            if (this.mappingWidget)
                this.mappingWidget.dispose();
        }
        //#endregion
    },

    popupOnClose: function ()
    {
        if (this.container && this.container.isWidget("targetContextCanvas"))
            this.container.targetContextCanvas("destroy");
        if (this.mappingWidget)
            this.mappingWidget.dispose();

        if (!this.successFullyConfigured && checkExists(SourceCode.Forms.Designers) && checkExists(SourceCode.Forms.Designers.Rule))
        {
            SourceCode.Forms.Designers.Rule.onWidgetCancelled(this);
        }
    },

    _getContextTreePosition: function (node, type, name)
    {
        //#region
        name = name.toLowerCase();
        var pos = 0;
        switch (type)
        {
            case "SystemValues":
                pos = 0;
                break;
            case "Form":
            case "View":
                var itemNodes = node.selectNodes("node[@ItemType='" + type + "']");
                if (itemNodes.length === 0)
                {
                    if (type === "View")
                    {
                        return node.childNodes.length;
                    } else
                    {
                        var viewNode = node.selectSingleNode("node[@ItemType='View']");
                        if (viewNode)
                        {
                            return ConfigurationWidget.prototype._getNodePosition(node.childNodes, viewNode);
                        } else return node.childNodes.length;
                    }
                }
                else
                {
                    var itemNodesLength = itemNodes.length;
                    for (var j = 0; j < itemNodesLength; j++)
                    {
                        var text = itemNodes[j].getAttribute("text").toLowerCase();
                        if (name < text)
                        {
                            return ConfigurationWidget.prototype._getNodePosition(node.childNodes, itemNodes[j]);
                        }
                    }
                    return ConfigurationWidget.prototype._getNodePosition(node.childNodes, itemNodes[itemNodesLength - 1]) + 1;
                }
                break;
            default:
                pos = node.childNodes.length;
                break;
        }
        return pos;
    },

    _getNodePosition: function (nodes, node)
    {
        //#region
        var length = nodes.length;
        for (var i = 0; i < length; i++)
        {
            if (nodes[i] === node)
            {
                return i;
            }
        }
        return -1;
        //#endregion
    },
};

//this widget handles the layout of the page - ie the split left and right
TargetContextCanvas = {
    //options
    //contextTreeTitle
    //contextXML
    //dropElements
    //dropTolerance

    _viewContextSettings: null,

    _create: function ()
    {
        //#region
        this.draggingTree = null;
        this.draggingNode = null;

        //TODO: TD 0001
        var metaArray1 = {};
        metaArray1["autosize"] = true;

        if (!this.options.dragTolerance) this.options.dragTolerance = "pointer";
        this.treeBorder = jQuery("<div class=\"mapping-tree-section\"></div>");
        this.treeBorder.closest('.popup-body-content').append(this.ghostItem);
        this.contentBorder = jQuery("<div class=\"mapping-content-section\"></div>");
        this.paneContainer = jQuery("<div class=\"pane-container vertical\"><div class=\"pane\" data-options=\"" + jQuery.toJSON(metaArray1).htmlEncode() + "\"></div><div class=\"pane\"></div></div>");

        if (this.options.isTreeRightAligned)
        {
            this.treeBorder.addClass("rightAlign");
            this.contentBorder.addClass("rightAlign");
        }

        this.element.addClass("wrapper").addClass("target-context-canvas");
        this.element.append(this.paneContainer);
        this.element.children(".pane-container").children(".pane:last-child").append(this.treeBorder);
        this.element.children(".pane-container").children(".pane:last-child").append(this.contentBorder);

        var tabContentClass = "mapping-notab-content-section";
        var contextTreeContainer = jQuery("<div class=\"mapping-tab-context-tree-section\"></div>");
        var contextPanel = jQuery("<div></div>");
        this.treeBorder.append(contextPanel);
        contextPanel.panel({ "fullsize": true, "header": this.options.contextTreeTitle, "scrolling": true });
        this.treeBorder.addClass("notab");
        contextTreeContainer.addClass("notab");

        contextPanel.panel("fetch", "body").append(contextTreeContainer);
        var _this = this;

        var thtml = "<ul class=\"tree collapsed-root\"><li class=\"root children open\"><a href=\"javascript:;\">Root</a></li></ul>";

        // Context Tree
        this.contextTree = jQuery(thtml).appendTo(contextTreeContainer).tree(
            {
                autoExpand: true,
                draggable: "a:not(.not-draggable)",
                buildTooltip: true,
                refreshDraggingPositions: false,
                renderObjectModel: true,
                treedragoptions:
                {
                    scroll: false,
                    draggableWidgetName: "SFCdraggable"
                }
            });

        if (this.options.contextXML && this.options.contextXML.xml)
        {
            this.contextTree.tree("loadXML", this.options.contextXML);

            this.contextTree.on("treeexpand", function (ev, data)
            {
                _this.partialLoadContextTree(data);
            });
        }

        if (this.options.showContext !== undefined && !this.options.showContext)
        {
            this.treeBorder.hide();
            this.contentBorder.css("left", "0px");
            this.contentBorder.removeClass("rightAlign");
        }

        // pull through plugin settings for the view context
        this._viewContextSettings = null;

        if (checkExists(this.options.Settings) && Array.isArray(this.options.Settings))
        {
            // this should only be 1 long for expressions and conditional styles, but loop just in case...
            for (var k = 0; k < this.options.Settings.length; k++)
            {
                var settings = this.options.Settings[0];

                if (checkExists(settings.Contexts) && Array.isArray(settings.Contexts))
                {
                    // viewContext should be the last one, so start at the back
                    for (var i = settings.Contexts.length; i--; i >= 0)
                    {
                        if (settings.Contexts[i].PlugIn === "ViewContextPlugIn")
                        {
                            this._viewContextSettings = settings.Contexts[i].Parameters;
                            break;
                        }
                    }

                    // just take the first viewContextSettings. 
                    if (checkExists(this._viewContextSettings))
                    {
                        break;
                    }
                }
            }
        }

        //#endregion
    },

    setContextNode: function (node)
    {
        if (!getNodeAttribute("ItemType", node, false, checkExists))
        {
            return false;
        }

        var draggingNode = {};

        draggingNode.text = draggingNode.display = getNodeAttribute("text", node, null, checkExistsNotEmpty);
        draggingNode.hasChildren = node.childNodes.length > 0;
        draggingNode.icon = getNodeAttribute("icon", node, null, checkExists);
        draggingNode.id = getNodeAttribute("id", node, null, checkExists);
        draggingNode.name = getNodeAttribute("Name", node, null, checkExists);
        draggingNode.data = {};

        for (var i = 0, l = node.attributes.length; i < l; i++)
            draggingNode.data[node.attributes[i].name] = node.attributes[i].value;

        draggingNode.value = getNodeAttribute("id", node, getNodeAttribute("Name", node, null, checkExists), checkExists);

        var displayText = draggingNode.display;

        while (checkExists(node.parentNode) && getNodeAttribute("text", node.parentNode, false, checkExists))
        {
            node = node.parentNode;
            displayText = getNodeAttribute("text", node, getNodeAttribute("ItemType", node, "", checkExistsNotEmpty), checkExistsNotEmpty) + " - " + displayText;
        }

        draggingNode.tooltip = displayText;

        return draggingNode;
    },

    setDraggingNode: function (metadata)
    {
        if (!metadata.ItemType)
        {
            return false;
        }

        var draggingNode = $.extend({}, metadata);

        draggingNode.hasChildren = checkExists(metadata.children) && metadata.children.length > 0;
        draggingNode.display = metadata.text
        draggingNode.value = (metadata.id) ? (metadata.id) : metadata.name;

        draggingNode.data = $.extend({}, metadata); // because levels

        return draggingNode;
    },

    getContextNode: function (context)
    {
        var contextItem = context.item, contextXml = context.document, xpath = "//node";

        for (var i = 0, l = contextItem.attributes.length; i < l; i++)
        {
            if ((contextItem.attributes[i].name !== "ContextType" && contextItem.attributes[i].value !== "context") && contextItem.attributes[i].value !== "00000000-0000-0000-0000-000000000000" && checkExistsNotEmpty(contextItem.attributes[i].value))
            {
                xpath += "[@" + contextItem.attributes[i].name + "='" + contextItem.attributes[i].value + "']";
            }
        }

        var node = contextXml.selectSingleNode(xpath);

        if ($chk(node))
        {
            return this.setContextNode(node);
        }
        else
        {
            return null;
        }
    },

    getDraggingNode: function (searchObject)
    {
        //#region
        var metadata = this.contextTree.tree("findModelObject", searchObject);

        if (metadata !== null)
        {
            return this.setDraggingNode(metadata);
        }
        else
        {
            return null;
        }
        //#endregion
    },

    //needs to be synced with expressionbuilder.js
    //This function checks if a parent is only partially loaded then searches for the child or just returns the dragging node
    //parentMetadata is what is used to search for the parent and child for the child once the parent has been fully loaded
    getPartialDraggingNode: function (parentMetadata, childMetadata)
    {
        var metadata = this.contextTree.tree("findModelObject", parentMetadata);

        //if the parent is only partially loaded then load its children first
        if (metadata)
        {
            this.partialPopulateTreeModel({ metadata: metadata });
        }

        return this.getDraggingNode(childMetadata);
    },

    findModelObject: function (parentMetadata)
    {
        return this.contextTree.tree("findModelObject", parentMetadata);
    },

    //gets the dragelement from the page
    // is this function ever used?
    getDragElement: function (e)
    {
        //#region
        this.ghostItem = jQuery("<div style=\"\" class=\"tree\"><li class=\"mapping-tab-drag-item\"><a class=\"mapping-tab-drag-item-a\"></a></li></div>"); this.ghostItem.hide();
        this.ghostItem.hide();
        var listItem = this.ghostItem.find("li").eq(0);
        var anchor = listItem.find("a").eq(0);
        this.draggingTree = this.contextTree;
        this.draggingNode = this.setDraggingNode(jQuery(e.target).parent().metadata());
        listItem.addClass(this.draggingNode.data.icon);
        anchor.text(this.draggingNode.text);
        this.ghostItem.show();
        return this.ghostItem;
        //#endregion
    },

    attemptToExpandContextTree: function ()
    {
        var _this = this;
        var currentNodes = this.contextTree.tree("find", "root");

        currentNodes.find("> ul >li.children").each(function ()
        {
            var jqThis = jQuery(this);

            if (jqThis.metadata() && (jqThis.metadata().id !== "environmentFieldsRoot" && jqThis.metadata().id !== "systemValuesRoot"))
            {
                _this.contextTree.tree("expand", jqThis);
            }
        });
    },

    // We are able to find dragging nodes more reliable using the first attempt
    // This is used in the advanced filter screen specifically when we change from a simple to advance filter for the left operands
    getElementInContextTree: function ()
    {
        //#region
        var value = arguments[0];
        var isName = arguments[1];
        var metadata = null;
        if (checkExists(value))
        {

            if (isName)
            {
                metadata = this.contextTree.tree("findModelObject", { "Name": value });
            }
            else
            {
                metadata = this.contextTree.tree("findModelObject", { "id": value });
            }
            if (metadata !== null)
            {
                return this.setDraggingNode(metadata);
            }
            else
            {
                return null;
            }
        }
        else
        {
            return null;
        }
        //#endregion
    },

    option: function ()
    {
        //#region
        if (arguments[0] === 'targetCanvas')
        {
            return this.contentBorder;
        }
        //#endregion
    },

    add: function ()
    {
        var _this = this;

        //#region
        if (arguments[0] === "dropElement")
        {
            if (!this.options.dropElements)
            {
                this.options.dropElements = [];
            }
            this.options.dropElements.push(arguments[1]);


        } else if (arguments[0] === "dropElements")
        {
            this.options.dropElements = arguments[1];
        }
        else if (arguments[0] === "contextXML")
        {
            this.options.contextXML = arguments[1];
            this.contextTree.tree("loadXML", this.options.contextXML);

            this.contextTree.on("treeexpand", function (ev, data)
            {
                _this.partialLoadContextTree(data);
            });
        }
        //#endregion
    },

    partialPopulateTreeModel: function (options)
    {
        var metadata = options.metadata;

        if (checkExists(metadata) && checkExists(metadata.dynamic) && !metadata.dynamicloaded && metadata.ItemType === "Control")
        {
            var instanceID = metadata.InstanceID;
            var subformID = metadata.SubFormID;
            var subformInstanceID = metadata.SubFormInstanceID;

            if (instanceID === "" || !checkExists(subformID))
            {
                instanceID = "00000000-0000-0000-0000-000000000000";
            }

            if (subformID === "" || !checkExists(subformID))
            {
                subformID = "00000000-0000-0000-0000-000000000000";
            }

            if (subformInstanceID === "" || !checkExists(subformInstanceID))
            {
                subformInstanceID = "00000000-0000-0000-0000-000000000000";
            }

            var propertyXml = SourceCode.Forms.Designers.Common._getTransformedControlTypePropertyXml({
                id: metadata.id,
                subType: metadata.SubType,
                node: null,
                subformId: subformID,
                instanceId: instanceID,
                subformInstanceID: subformInstanceID,
                metadata: metadata
            });

            var nodes = $("nodes > node", propertyXml);
            this.contextTree.tree("partialLoadXmlIntoModel", { nodes: nodes, modelObj: metadata });
        }
    },

    partialLoadContextTree: function (data)
    {
        var node = data.node;
        var tree = data.tree;
        var metadata = node.metadata();

        var existingContent = null;

        if (checkExists(metadata.dynamic) && node.hasClass("children") && !node.hasClass("dynamicloaded"))
        {
            existingContent = node.children("ul").children();

            var thisItemType = metadata.ItemType;

            if (thisItemType === "Control")
            {
                var thisItemID = metadata.Guid;
                var thisItemSubType = metadata.SubType;
                var instanceID = metadata.InstanceID;
                var subformID = metadata.SubFormID;
                var subformInstanceID = metadata.SubFormInstanceID;

                if (instanceID === "" || !checkExists(instanceID))
                {
                    instanceID = "00000000-0000-0000-0000-000000000000";
                }

                if (subformID === "" || !checkExists(subformID))
                {
                    subformID = "00000000-0000-0000-0000-000000000000";
                }

                if (subformInstanceID === "" || !checkExists(subformInstanceID))
                {
                    subformInstanceID = "00000000-0000-0000-0000-000000000000";
                }

                var xmlResponse = SourceCode.Forms.Designers.Common._getTransformedControlTypePropertyXml({
                    id: thisItemID,
                    subType: thisItemSubType,
                    node: data.node,
                    subformId: subformID,
                    instanceId: instanceID,
                    subformInstanceID: subformInstanceID,
                    metadata: metadata,
                    viewContextSettings: this._viewContextSettings
                });
                //var childItems = metadata.childItems;
                metadata.open = true;
                tree.tree("loadXML", xmlResponse, node, false, metadata);

                if (existingContent.length > 0)
                {
                    //move the existing children to the end

                    var listItems = node.children("ul").children();
                    var lastItem = $(listItems[listItems.length - 1]);

                    existingContent.insertAfter(lastItem);
                    //metadata.childItems = metadata.childItems.concat(childItems);
                }
                tree.tree("applyDragHandlers", node);
                node.addClass("dynamicloaded");
            }
        }
    },

    addDragDrop: function ()
    {
        //#region
        var _this = this;
        with (_this)
        {
            this.dropElements = [];
            var length = this.options.dropElements.length;
            for (var j = 0; j < length; j++)
            {
                if (typeof (this.options.dropElements[j]) === 'object') //if this is an object the element should be the dropelement
                {
                    this.dropElements.push(this.options.dropElements[j].element);
                } else
                {
                    this.dropElements.push(this.options.dropElements[j]);
                }
            }
            jQuery(this.dropElements).droppable({
                accept: '.ui-draggable',
                tolerance: this.options.dragTolerance,
                drop: function (ev, ui)
                {
                    var creatLineObject = false;

                    if ($(ev.target).closest("li").length > 0 && $(ev.target).closest("li").metadata() && $(ev.target).closest("li").metadata() && $(ev.target).closest("li").metadata().ItemType === "ProcessItemReference")
                    {
                        if (checkExists(ui.draggable.parent().metadata().ItemType) && ui.draggable.parent().metadata().ItemType === "ViewSource")
                        {
                            creatLineObject = true;
                        }
                        else
                        {
                            creatLineObject = false;
                        }
                    }
                    else
                    {
                        if (checkExists(ui.draggable.parent().metadata().ItemType) && ui.draggable.parent().metadata().ItemType === "ViewSource")
                        {
                            creatLineObject = false;
                        }
                        else
                        {
                            creatLineObject = true;
                        }
                    }

                    if (creatLineObject === false)
                    {
                        return false;
                    }
                    else
                    {
                        var _draggingNode = _this.setDraggingNode(ui.draggable.parent().metadata());
                        $(ev.target).trigger("dropDragElement", [_draggingNode, { left: ev.clientX, top: ev.clientY }]);
                    }
                },
                addClasses: false
            });
        }
        //#endregion
    },

    removeDragDrop: function ()
    {
        //#region
        if (this.dropElements)
        {
            jQuery(this.dropElements).droppable("destroy");
            jQuery(this.dropElements).empty();
        }
        //#endregion
    }
};

jQuery.widget("ui.targetContextCanvas", TargetContextCanvas);
jQuery["ui"]["targetContextCanvas"].getter = 'getDraggingNode getElementInContextTree';

//Advanced Mappings Widget for wizard type mappings
function AdvancedMappingWidget()
{
}

AdvancedMappingWidget.prototype = {
    initialize: function ()
    {
        var _this = this;
        _this.mappingWidgets = [];

        for (var s = 0; s < _this.Settings.length; s++)
        {
            var step = _this.wizard.wizard("find", "step", s);
            var stepContent = jQuery("<div class='wrapper'></div>");
            var currentSettings = _this.Settings[s];

            var tbGroup = jQuery(SourceCode.Forms.Controls.ToolbarGroup.html()).toolbargroup().toolbargroup("addtoolbar");
            //var tb = jQuery(SourceCode.Forms.Controls.Toolbar.html());

            step.find(".pane-container > .pane:first-child").append(tbGroup);
            stepContent.appendTo(step);

            var showContext = true;
            if (currentSettings.Target.Parameters.showContext !== undefined
                && currentSettings.Target.Parameters.showContext.toLowerCase() === "false")
            {
                showContext = false;
            }

            //call dropTreeCanvas (layout widget)
            stepContent.targetContextCanvas({ contextTreeTitle: _this.ContextHeading, isTreeRightAligned: true, showContext: showContext });
            //get dropTreeCanvas canvas area

            //handle subset of context
            var currentContext = parseXML(this.contextsXml.xml);
            var removalNodes = currentContext.selectNodes("nodes/node[@ResultName!='" + currentSettings.ResultName + "']");
            for (var r = removalNodes.length - 1; r >= 0; r--)
            {
                removalNodes[r].parentNode.removeChild(removalNodes[r]);
            }

            //call target load, pass configurationXml, targetXml and contextxml (to get display for mapping) in,
            var mappingWidgetType = (currentSettings.Target) ?
                getMethodByName(currentSettings.Target.Widget, getWindowObj()) :
                getMethodByName(_this.TargetWidget, getWindowObj());
            var mappingWidget = new mappingWidgetType();
            if (mappingWidget.initCallBack)
            {
                mappingWidget.initCallBack = function ()
                {
                    _this.afterPluginInit(stepContent, currentSettings, mappingWidget, s);
                }
            }
            this._setupMappingWidget(mappingWidget, currentSettings, currentContext, s, stepContent.targetContextCanvas("option", "targetCanvas"));
            if (!mappingWidget.initCallBack)
            {
                _this.afterPluginInit(stepContent, currentSettings, mappingWidget, s);
            }
        }

        jQuery("#ruleWizardPopup").modalize(false).showBusy(false);
    },

    _setupMappingWidget: function (mappingWidget, currentSettings, currentContext, wizardStep, targetContainer)
    {
        mappingWidget.targetXml = this.targetXml;
        mappingWidget.Settings = (currentSettings.Target) ? currentSettings.Target.Parameters : null;
        mappingWidget.filterTypes = (currentSettings.Target) ? currentSettings.Target.Parameters.filterTypes : null;
        mappingWidget.resultTypes = (currentSettings.Target) ? currentSettings.Target.Parameters.resultTypes : null;
        mappingWidget.TargetHeading = this.TargetHeading;
        mappingWidget.ResultName = currentSettings.ResultName;
        mappingWidget.Collections = currentSettings.Collections;
        mappingWidget.contextsXml = currentContext;
        mappingWidget.wizard = this.wizard;
        mappingWidget.wizardStep = wizardStep;
        mappingWidget.containerData = this.containerData;

        // expect element to return and add element to canvas area.
        var initMethod = null;
        with (mappingWidget)
        {
            initMethod = (currentSettings.Target) ?
                getMethodByName(currentSettings.Target.Method, mappingWidget).bind(mappingWidget) :
                getMethodByName(this.TargetWidgetMethod, mappingWidget).bind(mappingWidget)
        }

        initMethod(targetContainer);
    },

    afterPluginInit: function (stepContent, currentSettings, mappingWidget, stepNumber)
    {
        var _this = this;
        if (mappingWidget.getSettings)
        {
            var targetSettings = mappingWidget.getSettings();
            if (targetSettings.dropTolerance)
            {
                stepContent.targetContextCanvas("option", "dropTolerance", targetSettings.dropTolerance);

            }
            if (targetSettings.dropElements && targetSettings.dropElements.length > 0)
            {
                stepContent.targetContextCanvas("removeDragDrop");
                stepContent.targetContextCanvas("add", "dropElements", targetSettings.dropElements);
                stepContent.targetContextCanvas("addDragDrop");
            }
        }

        //populate tree in dropTreeCanvas with nodes

        stepContent.targetContextCanvas("add", "contextXML", mappingWidget.contextsXml);
        stepContent.targetContextCanvas("attemptToExpandContextTree");
        var existingMappings;
        if ($chk(_this.value))
        {
            // load existing data
            existingMappings = parseXML(_this.value).selectNodes("Mappings/Mapping[@Type='" + currentSettings.ResultName + "']");
        }

        var mappingWidgetDoc = parseXML("<Mappings></Mappings>");
        if ($chk(existingMappings))
        {
            for (var e = 0; e < existingMappings.length; e++)
            {
                mappingWidgetDoc.documentElement.appendChild(existingMappings[e].cloneNode(true));
            }
        }

        var configurationIsValid = mappingWidget.setConfigurationXml(mappingWidgetDoc.xml, stepContent);
        // If the widget support self validation, do not attempt to check the mappings XML for cases where hotpots were reconfigured and Invalid attibutes are no longer correct.
        if (configurationIsValid !== true)
        {
            var anyInvalidNode = mappingWidgetDoc.selectSingleNode("//Item[@Invalid='true']");
            if (anyInvalidNode !== null || configurationIsValid === false)
            {
                _this.wizard.wizard("updateStepState", stepNumber, "error", "small");
            }
        }

        _this.mappingWidgets.push(mappingWidget);
    },

    updated: function ()
    {
        // TFS: 515034
        for (var m = 0; m < this.mappingWidgets.length; m++)
        {
            if (typeof (this.mappingWidgets[m].updated) === 'function')
            {
                this.mappingWidgets[m].updated();
            }
        }
    },

    save: function ()
    {
        var mappingsDoc = parseXML("<Mappings/>");
        var invalidMappings = false;

        for (var i = 0; i < this.mappingWidgets.length; i++)
        {
            var mappingWidget = this.mappingWidgets[i];

            var result = mappingWidget.getConfigurationXML();
            if (result === false)
            {
                return result;
            }
            else
            {
                var resultDoc = parseXML(result);
                invalidMappings = resultDoc.selectNodes('//Item[@Invalid = "true"]').length > 0 ? true : invalidMappings;

                var mappingNodes = resultDoc.selectNodes("Mappings/Mapping");
                for (var m = 0; m < mappingNodes.length; m++)
                {
                    var mappingNode = mappingNodes[m];

                    mappingNode.setAttribute("Type", mappingWidget.ResultName);

                    mappingsDoc.documentElement.appendChild(mappingNode);
                }
            }

            mappingWidget.dispose();
        }

        if (invalidMappings)
        {
            mappingsDoc.documentElement.setAttribute("Invalid", "true");
        }

        this.value = mappingsDoc.xml;

        SourceCode.Forms.Designers.Rule.onWidgetCompleted(this);
        return true;
    },

    popupFinishClick: function ()
    {
        //#region
        var canClose = this.save();
        if (canClose)
        {
            this.successFullyConfigured = true;
            popupManager.closeLast({ removeContent: true });
        }
        else
        {
            jQuery("#RuleMappingWizard").wizard('removeOverlay');
        }
        //#endregion
    },

    popupCancelClick: function ()
    {
        //#region
        // close this widget
        popupManager.closeLast({ removeContent: true, cancelOnClose: true, cancelClose: false });
        // close the hidden rules designer
        if (SourceCode.Forms.Designers.Rule.isHiddenDesigner)
        {
            SourceCode.Forms.Designers.View._closeRuleWizard(true);
        }
        //#endregion
    },

    popupOnClose: function ()
    {
        for (var m = 0; m < this.mappingWidgets.length; m++)
        {
            var mappingWidget = this.mappingWidgets[m];
            mappingWidget.dispose();
        }
        jQuery("#RuleMappingWizard").wizard('destroy');
        if (!this.successFullyConfigured)
        {
            SourceCode.Forms.Designers.Rule.onWidgetCancelled(this);
        }
    },

    popupValidateClick: function (index, callback)
    {
        var mappingWidget = this.mappingWidgets.filter(function (widget)
        {
            return widget.wizardStep === index;
        });

        mappingWidget = mappingWidget.length > 0 ? mappingWidget[0] : null;

        if (mappingWidget === null) mappingWidget = this.mappingWidgets[index];

        var result = mappingWidget.getConfigurationXML();
        if (typeof (result) === "boolean" && result === false) //validation failed - can not close
        {
            if (checkExists(callback) && typeof callback === "function") {
                callback(false);
            }
            return false;
        }

        if (checkExists(callback) && typeof callback === "function") {
            callback(true);
        }
        return true;
    },
}
