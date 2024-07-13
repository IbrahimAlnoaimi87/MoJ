(function ($)
{
    // Namespacing the Designer
    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Designers === "undefined" || SourceCode.Forms.Designers === null) SourceCode.Forms.Designers = {};
    if (typeof SourceCode.Forms.Designers.Rule === "undefined" || SourceCode.Forms.Designers.Rule === null) SourceCode.Forms.Designers.Rule = {};
    if (typeof SourceCode.Forms.Designers.Rule.Properties === "undefined" || SourceCode.Forms.Designers.Rule.Properties === null) SourceCode.Forms.Designers.Rule.Properties = {};

    var _wizard = SourceCode.Forms.Designers.Rule.Wizard = {
        tabControl: undefined,
        rulesXml: null,
        element: null,
        searchControl: null,
        fileTab: null,
        SUPPORTED_PARENT_TYPES: "SupportedParentTypes",
        SUPPORTED_CHILD_TYPES: "SupportedChildTypes",
        ALL_SUPPORTED_TYPE: "All",

        _getHiddenRulesXml: function ()
        {
            return parseXML(document.getElementById("hiddenRulesXml").value);
        },
        _initializeWizard: function ()
        {
            _wizard.element = jQuery("#ruleWizardPopup");
            _wizard._setRulesWizardToDefault();
            _wizard.rulesXml = _wizard._getHiddenRulesXml();
            _wizard._initializeControls();
            _wizard._addRuleAreaSections();
            _wizard._checkCategoriesForChildren();
            _wizard._initRuleNameBox();
            _wizard.filters = 
            {
                All: "All",
                ServerPreRender: "ServerPreRender"
            }
            
            if (checkExists(SourceCode.Forms.WizardContainer.ruleID))
            {
                if (!SourceCode.Forms.Designers.Rule.isHiddenDesigner)
                {
                    jQuery("#ruleWizardPopup").modalize(true).showBusy(true);
                }
                SourceCode.Forms.WizardContainer.ruleID = SourceCode.Forms.WizardContainer.ruleID.toLowerCase();

                SourceCode.Forms.Designers.Rule._loadRuleDefinition(SourceCode.Forms.WizardContainer.ruleID, false, true); // False: Do not ignore conditions and actions, True: Do not do existing event check

                SourceCode.Forms.Designers.Rule.ruleName = SourceCode.Forms.Designers.Rule.tmpConfiguredRulesDefinitionXML.selectSingleNode("Rules/Rule[@ID='" + SourceCode.Forms.WizardContainer.ruleID + "']/Name").text;
                SourceCode.Forms.Designers.Rule.ruleFriendlyName = SourceCode.Forms.Designers.Rule.tmpConfiguredRulesDefinitionXML.selectSingleNode("Rules/Rule[@ID='" + SourceCode.Forms.WizardContainer.ruleID + "']/FriendlyName").text;
                SourceCode.Forms.Designers.Rule.ruleDescription = SourceCode.Forms.Designers.Rule.tmpConfiguredRulesDefinitionXML.selectSingleNode("Rules/Rule[@ID='" + SourceCode.Forms.WizardContainer.ruleID + "']/Description").text;
                var isCustomNameNode = SourceCode.Forms.Designers.Rule.tmpConfiguredRulesDefinitionXML.selectSingleNode("Rules/Rule[@ID='" + SourceCode.Forms.WizardContainer.ruleID + "']/IsCustomName");
                var isCustomName = checkExists(isCustomNameNode) ? isCustomNameNode.text.toLowerCase() === "true" : false;
                _wizard._setRuleTabText(SourceCode.Forms.Designers.Rule.ruleName, isCustomName);

                if (checkExists(SourceCode.Forms.WizardContainer.actionID))
                {
                    var action = jQuery("#ruleWizardPopup").find("li.action").filter(function ()
                    {
                        return $(this).data("ID") === SourceCode.Forms.WizardContainer.actionID;
                    });

                    action.find(".mappingConfiguration").data("onWidgetCompleted", function (finishWizard)
                    {
                        $(popupManager.getPopup("ruleWizardPopup").getButtonBar().find(".button.finish")).trigger("click");
                    }).trigger("click");
                }
                else
                {
                    jQuery("#ruleWizardPopup").modalize(false).showBusy(false);
                }
            }
            else
            {
                SourceCode.Forms.Designers.Rule.ruleName = "";
                SourceCode.Forms.Designers.Rule.ruleFriendlyName = "";
                SourceCode.Forms.Designers.Rule.ruleDescription = "";
                SourceCode.Forms.Designers.Rule.ruleNameIsCustom = false;
            }

            _wizard._attachLeftPaneEvents();
            _wizard._attachRuleAreaEvents();

            // Add checkbox to main toolbar //
            var checkBoxHtml = SourceCode.Forms.Controls.Checkbox.html({ id: "rwEnableDisableTb", label: Resources.RuleDesigner.lrEnabled, disabled: true, description: Resources.RuleDesigner.EnableDisable });
            jQuery("#rwBottomPaneToolbar").find(".toolbar-wrapper").prepend(checkBoxHtml);

            var jqCheckBox = jQuery("#rwEnableDisableTb").checkbox();
            jqCheckBox.closest("label").css("float", "left");
            // Add checkbox to main toolbar //

            _wizard._initRuleEditorTabs();

            if (checkExists(SourceCode.Forms.WizardContainer.ruleID))
            {
                $("#rwTabbedRuleItemActionsTab").trigger("click");
            }
            else
            {
                if (SourceCode.Forms.WizardContainer.currentRuleWizardContext === "Control")
                {
                    $("#ViewControlEvent").trigger("click");
                }
                else
                {
                    $("#Rule").trigger("click");
                }

            }

            //Fix for comments popup having too much space below the textarea
            $("#rwCommentsPanel .input-control-wrapper")[0].style.height = "";

            SourceCode.Forms.Designers.Rule.suspendValidation = false;
            SourceCode.Forms.Designers.Rule.doNotHandleEnterPressed = false;
        },

        //any cleanup needed between loads of the wizard.
        onClose: function ()
        {
            this.fileTab = null;
        },

        //public method
        //Called directly from the wizardcontainer and rule classes.
        setRuleTabText: function (name, isCustomName)
        {
            _wizard._setRuleTabText(name, isCustomName);
        },

        //private method
        _setRuleTabText: function (name, textIsCustom)
        {
            //if the rule name does not exist - or its an automatic name
            if (typeof(name)!=="string" || textIsCustom === false)
            {
                var eventName = SourceCode.Forms.Designers.Rule.getRuleNameByEvent();

                //if there isn't an event to generate a rulename from, the rule must be empty
                if (typeof (eventName) != "string")
                {
                    name = "";
                }
                else
                {
                    name = eventName;
                }

                SourceCode.Forms.Designers.Rule.ruleNameIsCustom = false;
            }
            else
            {
                SourceCode.Forms.Designers.Rule.ruleNameIsCustom = textIsCustom;
            }

           
            //update the mode        	
            SourceCode.Forms.Designers.Rule.ruleName = name;
            SourceCode.Forms.Designers.Rule.ruleFriendlyName = name;

            //Update the UI
            _wizard.fileTab.name(name);
            _wizard.fileTab.tooltip(_wizard._buildRuleTabTextTooltip());
        },

        _setRuleTabBadging: function (ruleIsInvalid)
        {
            if (!checkExists(ruleIsInvalid))
            {
                ruleIsInvalid = SourceCode.Forms.Designers.Rule.ruleContainsError;
            }

            _wizard.fileTab.errorState(ruleIsInvalid);
        },

        _buildRuleTabTextTooltip: function ()
        {
            var returnValue = "";
            var ruleName = SourceCode.Forms.Designers.Rule.ruleName;
            var ruleDescription = SourceCode.Forms.Designers.Rule.ruleDescription;
            var ruleFriendlyName = SourceCode.Forms.Designers.Rule.ruleFriendlyName;

            if (checkExistsNotEmpty(ruleFriendlyName) && ruleFriendlyName !== ruleName)
            {
                returnValue += Resources.RuleDesigner.TitleTooltip.format(ruleFriendlyName);
            }

            if (checkExistsNotEmpty(ruleName))
            {
                if (checkExistsNotEmpty(returnValue))
                {
                    returnValue += "\r"
                }

                returnValue += Resources.RuleDesigner.NameTooltip.format(ruleName);
            }

            if (checkExistsNotEmpty(ruleDescription))
            {
                if (checkExistsNotEmpty(returnValue))
                {
                    returnValue += "\r"
                }

                returnValue += Resources.RuleDesigner.DescriptionTooltip.format(ruleDescription);
            }

            if (!checkExistsNotEmpty(ruleName))
            {
                returnValue = Resources.RuleDesigner.NewRuleTabBoxHeading;
            }

            return returnValue;
        },


        _fileTab_nameChanged: function (ev, name, datatype)
        {
            if (!checkExistsNotEmpty(name))
            {
                _wizard._setRuleTabText("", false); // forces a name recreate if it can
                name = SourceCode.Forms.Designers.Rule.ruleName;
            }
            else
            {
                _wizard._setRuleTabText(name, true);
            }

            //LG: Previously onblur of the tab's textbox (editmode)
            // WI 504960 - Flag to prevent blur when the dialog is cancelled.
            // Don't validate if the name textbox blurred due to a cancel button being clicked.
            if (!SourceCode.Forms.Designers.Rule.suspendValidation)
            {
                if (name !== '')
                {
                    _wizard._validateRuleNameInternal(name, function (isValid)
                    {
                        if (isValid === false)
                        {
                            _wizard.fileTab.focus();
                        }
                    });
                }
            }
            else
            {
                SourceCode.Forms.Designers.Rule.suspendValidation = false;
            }
        },

        _initRuleNameBox: function ()
        {
            //Initialize the file tab
            if (!_wizard.fileTab)
            {
                var fileTab = _wizard.element.find("#RuleFileTab").filetab({
                    showClose: false,
                    nameChanged: _wizard._fileTab_nameChanged.bind(_wizard),
                    emptyText: Resources.RuleDesigner.NewRuleTabBoxHeading,
                    allowEmpty: true,
                    datatype: "rule"
                });

                _wizard.fileTab = fileTab.data("ui-filetab");
            }
        },

        _initRuleEditorTabs: function ()
        {
            var readOnlyName = SourceCode.Forms.Designers.Rule.Events._getExistingEventDetails() === false;
            _wizard.fileTab.readOnly(readOnlyName);
        },



        //newer method, validates the rule name without direct access to the UI.
        //calls the callback when validation is complete.
        _validateRuleNameInternal: function (name, callback)
        {

            if (name !== Resources.RuleDesigner.NewRuleTabBoxHeading)
            {
                SourceCode.Forms.Designers.Rule._checkForDuplicateRuleNameInCurrentContext(name, true, true, function (result)
                {
                    switch (result)
                    {
                        case "navigatedAway":
                            //do nothing, as the rules designer has already opened another rule.
                            break;
                        case "duplicate":
                            if (typeof callback === "function") callback(false);
                            break;
                        case "unique":
                            if (typeof callback === "function") callback(true);
                            break;
                    }
                });
            }

        },

        _setRulesWizardToDefault: function ()
        {
            SourceCode.Forms.Designers.Rule.tmpContextDefinition = parseXML(SourceCode.Forms.WizardContainer.contextDefinition);
            SourceCode.Forms.Designers.Rule.contextDefinition = parseXML(SourceCode.Forms.WizardContainer.contextDefinition);
            SourceCode.Forms.Designers.Rule.tmpConfiguredRulesDefinitionXML = parseXML(document.getElementById("configuredRulesDefinitionXml").value);
            SourceCode.Forms.Designers.Rule.configuredRulesDefinitionXML = parseXML(document.getElementById("configuredRulesDefinitionXml").value);
        },

        _validateRuleWizard: function ()
        {
            /*
                1. Rule Naming
                    1.1. rule name may not be empty IFF no EVENT was selected (Rule Name is optional IFF an EVENT has been selected and configured)
                    1.2. rule name may not be duplicated in context
                2. empty rule placeholder should not still be visible (if it is, nothing has been added)
                3. rule must contain at least 1 ACTION // implies: if EVENT specified, must contain at least 1 ACTION
                4. Handlers, 
                    4.1. ELSE may only follow an IF, or an ELSE IF. An ELSE may not follow an ALWAYS, ELSE, ERROR or FOREACH.
                    4.2. Each HANDLER must contain at least 1 ACTION //implies a condition may not be empty
                5. all hotspots that require configuration must be configured.
                    5.1 event parts
                    5.2 condition parts
                    5.3 action parts
                    5.4 handler parts

                1, 2 and 3 are global validations, should they fail, the rule will not validate further than the item it failed on.
                4 and 5 are item level validation and will complete in its entirety presenting a single error message dialog (though with multiple errors messages if necessary).
            */

            //#region - show common error messages
            /*
                errorTypes = 
                    "Parts" - event, handler, condition, action parts that are not configured
                    "Config" - action configuration that is not complete
                    "ElseHandlerOrder" - See #4.1 above
                    "EmptyCondition" - See #4.2 above
                    "EmptyHandler" - See #4.2 above
            */
            var showErrorMessage = function (errorTypes)
            {
                var completeErrorMessage = null;
                var errorMessage = "";
                var configWasFound = false;

                //Indicate that there is a "Config" case/message
                for (var i = 0; i < errorTypes.length && !configWasFound; i++)
                {
                    if (errorTypes[i] == "Config")
                    {
                        configWasFound = true;
                    }
                }

                for (var i = 0; i < errorTypes.length; i++)
                {
                    switch (errorTypes[i])
                    {
                        case "Parts":
                            if (configWasFound)
                            {
                                //Skip this case and Prefer the more detailed message, being the "Config" case/message
                                continue;
                            }
                            errorMessage = Resources.RuleDesigner.ErrorPartsNotConfigured;
                            break;
                        case "Config":
                            errorMessage = Resources.RuleDesigner.ErrorActionConfigurationNotConfigured;
                            break;
                        case "ElseHandlerOrder":
                            errorMessage = Resources.RuleDesigner.ErrorHandlersOrder;
                            break;
                        case "EmptyCondition":
                            errorMessage = Resources.RuleDesigner.ErrorMsgEmptyCondition;
                            break;
                        case "EmptyHandler":
                            errorMessage = Resources.RuleDesigner.ErrorEmptyHandlers;
                            break;
                        default:
                            errorMessage = "";
                            break;
                    }
                    completeErrorMessage = completeErrorMessage === null ? errorMessage : "{0}<br/><br/>{1}".format(completeErrorMessage, errorMessage);
                }
                if (completeErrorMessage !== null)
                {
                    popupManager.showWarning(completeErrorMessage);
                }
            }
            //#endregion - show common error messages

            var $rulePanelboxArea = $("#RulePanelbox_RuleArea");
            var returnValue = true;
            var errorTypes = [];

            var $conditions = $rulePanelboxArea.find("li.condition:not(.prefix)");
            var $actions = $rulePanelboxArea.find("li.action:not(.prefix)");
            var $handlers = $rulePanelboxArea.find("ul.rulesUl.handler");
            var $event = $rulePanelboxArea.find("li.event");

            $(".in-error:not(.mappingConfiguration)").removeClass("in-error");
            //#region Global Rule Designer validation rules
            //1.1
            if (!checkExistsNotEmpty(SourceCode.Forms.Designers.Rule.ruleName))
            {
                returnValue = false
                popupManager.showWarning({
                    message: Resources.RuleDesigner.ErrorMsgRuleName,
                    onClose: function ()
                    {
                        SourceCode.Forms.Designers.Rule.doNotHandleEnterPressed = true;
                        _wizard.fileTab.focus();
                    }
                });
            }
            //1.2.
            if (SourceCode.Forms.Designers.Rule._checkForDuplicateRuleNameInCurrentContext(
                SourceCode.Forms.Designers.Rule.ruleName,
                false))
            {
                returnValue = false;
                SourceCode.Forms.WizardContainer._showRuleSettingsDialog();
                popupManager.showWarning({
                    message: Resources.RuleDesigner.ErrorMsgDuplicateRuleName,
                    onClose: function () { $("#RuleName").trigger("focus").caret("end"); }
                });
            }
            //2.
            if (returnValue && $("#EmptyRuleDesign_Placeholder").is(":visible"))
            {
                returnValue = false;
                popupManager.showError(Resources.RuleDesigner.ErrorMsgEventConditionActionNeeded);
            }
            //3.
            if (returnValue && $rulePanelboxArea.find("li.action:not(.prefix .action-placeHolder)").length === 0)
            {
                popupManager.showWarning(Resources.RuleDesigner.ErrorMsgActions);
                returnValue = false;
            }
            //#endregion
            //#region - Item Level validation
            if (returnValue)
            {
                //4.
                var handlersLength = $handlers.length;
                for (var h = 0; h < handlersLength; h++)
                {
                    var thisHandler = $handlers.eq(h);
                    var thisHandlerType = SourceCode.Forms.Designers.Rule._getHandlerType(thisHandler);
                    //4.1.
                    if (thisHandlerType === "Else")
                    {
                        var previousHandler = SourceCode.Forms.Designers.Rule._getPreviousHandler(thisHandler)
                        var prevHandlerType = SourceCode.Forms.Designers.Rule._getHandlerType(previousHandler, true);
                        var previousHandlerContainsConditions = previousHandler.find(">li.condition").length > 0;

                        if (!(prevHandlerType === "If" || (prevHandlerType === "Else" && previousHandlerContainsConditions)))
                        {
                            thisHandler.addClass("in-error");
                            thisHandler.find(">.rule-item-wrapper").attr("title", Resources.RuleDesigner.ErrorHandlersOrder);
                            if (errorTypes.indexOf("ElseHandlerOrder") === -1)
                            {
                                errorTypes.push("ElseHandlerOrder");
                            }
                            returnValue = false;
                        }
                    }
                    //4.2.
                    var handlerActions = thisHandler.find(">li.action:not(.prefix)" +
                        ", >li.action.prefix>ul>li.action:not(.prefix)" +
                        ", >li.handler-action");
                    if (handlerActions.length === 0)
                    {
                        var firstCondition = thisHandler.find("li.condition").first();
                        if (firstCondition.length > 0)
                        {
                            firstCondition.addClass("in-error");
                            firstCondition.attr("title", Resources.RuleDesigner.ErrorEmptyHandlers);
                            if (errorTypes.indexOf("EmptyCondition") === -1)
                            {
                                errorTypes.push("EmptyCondition");
                            }
                        }
                        else
                        {
                            thisHandler.addClass("in-error");
                            thisHandler.find(">.rule-item-wrapper").attr("title", Resources.RuleDesigner.ErrorEmptyHandlers);
                            if (errorTypes.indexOf("EmptyHandler") === -1)
                            {
                                errorTypes.push("EmptyHandler");
                            }
                        }
                        returnValue = false;
                    }
                }
                //5.
                //5.1.
                var eventParts = $("#ruleDefinitionRulesArea").find("a");
                for (var r = 0; r < eventParts.length; r++)
                {
                    var $eventPart = $(eventParts[r]);
                    if ((($chk($eventPart.data("value")) === false) && ($eventPart.hasClass('toolbar-button') === false) && ($eventPart.hasClass('mappingConfiguration') === false)))
                    {
                        var partText = $eventPart.text();
                        var eventText = Resources.RuleDesigner.ErrorPartsNotConfigured;
                        var errorNode = $eventPart.data("xml").selectSingleNode("Parameters/Parameter[@Name='errorMessage']");
                        if (errorNode !== null && errorNode.text !== '')
                        {
                            eventText = errorNode.text;
                        }
                        $eventPart.addClass("in-error");
                        $eventPart.closest("li.event").addClass("in-error");
                        $eventPart.closest("li.event").attr("title", eventText);
                        if (errorTypes.indexOf("Parts") === -1)
                        {
                            errorTypes.push("Parts");
                        }
                        returnValue = false;
                    }
                }
                //5.2.
                if ($conditions.length > 0)
                {
                    for (var c = 0; c < $conditions.length; c++)
                    {
                        var $condition = $conditions.eq(c);
                        var $conditionParts = $condition.find("a:not(.toolbar-button)");
                        for (var a = 0; a < $conditionParts.length; a++)
                        {
                            var $conditionPart = $($conditionParts[a]);
                            if (($chk($conditionPart.data("value")) === false) && ($conditionPart.hasClass('toolbar-button') === false) && ($conditionPart.hasClass('rule-part-inactive') === false))
                            {
                                var conditionText = Resources.RuleDesigner.ErrorPartsNotConfigured;
                                var errorNode = $conditionPart.data("xml").selectSingleNode("Parameters/Parameter[@Name='errorMessage']");
                                if (errorNode !== null && errorNode.text !== '')
                                {
                                    conditionText = errorNode.text;
                                }
                                $conditionPart.addClass("in-error");

                                $conditionPart.closest("li.condition").addClass("in-error");
                                $conditionPart.closest("li.condition").attr("title", conditionText);
                                if (errorTypes.indexOf("Parts") === -1)
                                {
                                    errorTypes.push("Parts");
                                }
                                returnValue = false;
                                break;
                            }
                        }
                    }
                }
                //5.3.
                if ($actions.length > 0)
                {
                    for (var n = 0; n < $actions.length; n++)
                    {
                        var $action = $actions.eq(n);
                        var $actionParts = $action.find("a");
                        for (var a = 0; a < $actionParts.length; a++)
                        {
                            var $actionPart = $($actionParts[a]);
                            if (((($chk($actionPart.data("value")) === false) && ($actionPart.hasClass('toolbar-button') === false) && ($actionPart.hasClass('execTypeGroup') === false) && ($actionPart.hasClass('mappingConfiguration') === false))))
                            {
                                var actionText = Resources.RuleDesigner.ErrorPartsNotConfigured;
                                var errorNode = $actionPart.data("xml").selectSingleNode("Parameters/Parameter[@Name='errorMessage']");
                                if (errorNode !== null && errorNode.text !== '')
                                {
                                    actionText = errorNode.text;
                                }
                                $actionPart.closest("li.action:not(.prefix)").addClass("in-error");
                                $actionPart.closest("li.action:not(.prefix)").attr("title", actionText);
                                $actionPart.addClass("in-error");

                                if (errorTypes.indexOf("Parts") === -1)
                                {
                                    errorTypes.push("Parts");
                                }
                                returnValue = false;
                                break;
                            }

                            if (($chk($actionPart.data("value")) === false) && ($actionPart.hasClass('toolbar-button') === false) && ($actionPart.hasClass('execTypeGroup') === false) && ($actionPart.hasClass('mappingConfiguration') === true))
                            {
                                var requiresConfiguration = $actionPart.data("xml").getAttribute("RequiresConfiguration");
                                if (requiresConfiguration === "true")
                                {
                                    var actionText = $action.data("xml").selectSingleNode("Message").text;
                                    $actionPart.closest("li.action:not(.prefix)").addClass("in-error");
                                    $actionPart.closest("li.action:not(.prefix)").attr("title", actionText);
                                    if (errorTypes.indexOf("Config") === -1)
                                    {
                                        errorTypes.push("Config");
                                    }
                                    returnValue = false;
                                    break;
                                }
                            }
                        }
                    }
                }
                //5.4.
                if ($handlers.length > 0)
                {
                    for (var h = 0; h < $handlers.length; h++)
                    {
                        var $handler = $handlers.eq(h);
                        var $handlerParts = $handler.children("div.rule-item-wrapper").find(">div>a:not(.toolbar-button)");
                        for (var a = 0; a < $handlerParts.length; a++)
                        {
                            var $handlerPart = $($handlerParts[a]);
                            if ((($chk($handlerPart.data("value")) === false) && ($handlerPart.hasClass('toolbar-button') === false)))
                            {
                                var handlerText = Resources.RuleDesigner.ErrorPartsNotConfigured;
                                var errorNode = $handlerPart.data("xml").selectSingleNode("Parameters/Parameter[@Name='errorMessage']");
                                if (errorNode !== null && errorNode.text !== '')
                                {
                                    handlerText = errorNode.text;
                                }
                                $handler.addClass("in-error");
                                $handler.attr("title", handlerText);
                                if (errorTypes.indexOf("Parts") === -1)
                                {
                                    errorTypes.push("Parts");
                                }
                                returnValue = false;
                                break;
                            }
                        }
                    }
                }
            }
            //#endregion - Item level validation
            if (!returnValue)
            {
                showErrorMessage(errorTypes);
            }
            return returnValue;
        },

        _search_onCancel: function (e)
        {
            var $currentSelectedTab = $("#rwTabbedRuleItemEventsTab.selected, #rwTabbedRuleItemConditionsTab.selected, #rwTabbedRuleItemActionsTab.selected");
            var panelID = $currentSelectedTab.data("tabcontentid");
            _wizard._clearSearch(panelID);
            //_wizard.searchControl.val("");
            $currentSelectedTab.data("searchtext", "");
            //$("#rwSearchTxt").trigger("focus");
        },

        _search_onSearch: function (e)
        {
            var searchText = _wizard.searchControl.val();
            searchText = searchText.trim();
            var $currentSelectedTab = $("#rwTabbedRuleItemEventsTab.selected, #rwTabbedRuleItemConditionsTab.selected, #rwTabbedRuleItemActionsTab.selected");
            var panelID = $currentSelectedTab.data("tabcontentid");
            _wizard._searchRuleItems(panelID, searchText);
            this._search_onChange(e);
        },

        _search_onChange: function (e)
        {
            var $this = $(this);
            var $currentSelectedTab = $("#rwTabbedRuleItemEventsTab.selected, #rwTabbedRuleItemConditionsTab.selected, #rwTabbedRuleItemActionsTab.selected");
            var panelID = $currentSelectedTab.data("tabcontentid");
            var searchText = _wizard.searchControl.val();
            $currentSelectedTab.data("searchtext", searchText.trim());
        },

        _attachLeftPaneEvents: function ()
        {
            // Attach Event Events
            var events = _wizard.rulesXml.selectNodes("SourceCode.Forms/RuleDefinitions/Events/Event");
            var eventsType = SourceCode.Forms.Designers.Rule.Wizard.rulesXml.selectSingleNode("SourceCode.Forms/RuleDefinitions/Events").getAttribute("Type");
            var eventsLength = events.length;
            var disableTemplates = false;
            var rulePanelbox = jQuery('#RulePanelbox_RuleArea');

            _wizard.searchControl = _wizard.element.find(".input-control.search-box").searchbox({
                onCancel: this._search_onCancel.bind(this),
                onSearch: this._search_onSearch.bind(this)
            }).data("ui-searchbox");

            for (var e = 0; e < eventsLength; e++)
            {
                var event = events[e];
                var eventName = event.getAttribute("Name");

                SourceCode.Forms.Designers.Rule.Events._attachRuleEvents(eventName);
            }

            // Attach Templates Events
            var templates = _wizard.rulesXml.selectNodes("SourceCode.Forms/RuleDefinitions/Templates/Template");
            var templatesLength = templates.length;

            for (var t = 0; t < templatesLength; t++)
            {
                var template = templates[t];
                var templateName = template.getAttribute("Name");

                SourceCode.Forms.Designers.Rule.Templates._attachTemplateEvents(templateName);
            }

            // Attach Conditions Events
            var conditions = _wizard.rulesXml.selectNodes("SourceCode.Forms/RuleDefinitions/Conditions/Condition");
            var conditionsType = SourceCode.Forms.Designers.Rule.Wizard.rulesXml.selectSingleNode("SourceCode.Forms/RuleDefinitions/Conditions").getAttribute("Type");
            var conditionsLength = conditions.length;

            for (var c = 0; c < conditionsLength; c++)
            {
                var condition = conditions[c];
                var conditionName = condition.getAttribute("Name");

                SourceCode.Forms.Designers.Rule.Conditions._attachConditionEvents(conditionName);
            }

            // Attach Handlers Events
            var handlers = _wizard.rulesXml.selectNodes("SourceCode.Forms/RuleDefinitions/Handlers/Handler");
            var handlersType = SourceCode.Forms.Designers.Rule.Wizard.rulesXml.selectSingleNode("SourceCode.Forms/RuleDefinitions/Handlers").getAttribute("Type");
            var handlersLength = handlers.length;

            for (var c = 0; c < handlersLength; c++)
            {
                var handler = handlers[c];
                var handlerName = handler.getAttribute("Name");
                SourceCode.Forms.Designers.Rule.Handlers._attachHandlerEvents(handlerName);
            }

            // Attach Actions Events
            var actions = _wizard.rulesXml.selectNodes("SourceCode.Forms/RuleDefinitions/Actions/Action");
            var actionsType = SourceCode.Forms.Designers.Rule.Wizard.rulesXml.selectSingleNode("SourceCode.Forms/RuleDefinitions/Actions").getAttribute("Type");
            var actionsLength = actions.length;

            for (var a = 0; a < actionsLength; a++)
            {
                var action = actions[a];
                var actionName = action.getAttribute("Name");

                SourceCode.Forms.Designers.Rule.Actions._attachActionEvents(actionName);
            }

            jQuery("#ruleWizardPopup div.section-expander").on("click", function ()
            {
                var jq_this = jQuery(this);

                if (jq_this.hasClass("collapsed"))
                {
                    _wizard._expandCategorySection(jq_this);
                } else
                {
                    _wizard._collapseCategorySection(jq_this);
                }
            });

            // expand / collapse in the rule toolbox header
            var $panel = $("#rwTabbedRuleItemSelectorPanel");
            var $rwToolboxPane = $("#RulesWizardTopPane");
            var $rwContentPane = $("#RulesWizardBottomPane");
            var $rwDivider = $rwToolboxPane.next(".divider");

            $panel.find(".panel-header-controls a").on("click", function (ev)
            {
                var $this = $(this);

                //TFS 730767
                var toolboxPaneTransitionComplete = false;
                var contentPaneTransitionComplete = false;

                function animationComplete()
                {
                    if ((toolboxPaneTransitionComplete === true) && (contentPaneTransitionComplete === true))
                    {
                        SourceCode.Forms.Designers.resizeToolboxPaneTabs("RulesWizardTopPane");
                        SourceCode.Forms.Designers.Rule._resetConditionSpecifierHeight();
                    }
                }

                var toolboxPaneTransitionOptions = {
                    parentToHandleOn: $rwToolboxPane,
                    selectorToWaitFor: "#RulesWizardTopPane",
                    onEndCallback: function ()
                    {
                        toolboxPaneTransitionComplete = true;
                        animationComplete();
                    }
                };

                var toolboxPaneTransitionHelper = new SourceCode.Forms.TransitionHelper(toolboxPaneTransitionOptions);

                toolboxPaneTransitionHelper.handleTransition();

                var contentPaneTransitionOptions = {
                    parentToHandleOn: $rwContentPane,
                    selectorToWaitFor: "#RulesWizardBottomPane",
                    onEndCallback: function ()
                    {
                        contentPaneTransitionComplete = true;
                        animationComplete();
                    }
                };

                var contentPaneTransitionHelper = new SourceCode.Forms.TransitionHelper(contentPaneTransitionOptions);

                contentPaneTransitionHelper.handleTransition();

                if ($this.is(".collapse-horizontal"))
                {
                    $panel.addClass("collapsed");
                    $this.removeClass("collapse-horizontal").addClass("expand-horizontal").attr("title", $panel.metadata().expandtext);

                    $rwToolboxPane.data("restore", $rwToolboxPane.width());
                    $rwToolboxPane.width($panel.width());
                    $rwDivider.css("left", $panel.width());
                    $rwContentPane.css("left", ($panel.width() + $rwDivider.width()));
                }
                else
                {
                    $panel.removeClass("collapsed");
                    $this.removeClass("expand-horizontal").addClass("collapse-horizontal").attr("title", $panel.metadata().collapsetext);

                    $rwToolboxPane.width($rwToolboxPane.data("restore"));
                    $rwDivider.css("left", $rwToolboxPane.data("restore"));
                    $rwContentPane.css("left", ($rwToolboxPane.data("restore") + $rwDivider.width()));
                }

                return false;
            });

            //navigate between rule toolbox tabs
            var $toolboxHeader = jQuery('#rwTabbedRuleItemSelectorPanel .panel-header-text');
            var changeSelectedTab = function (event)
            {
                //set search text for relavant tab
                var $tabSelected = $(event.currentTarget);
                var $currentSelectedTab = $("#rwTabbedRuleItemEventsTab.selected, #rwTabbedRuleItemConditionsTab.selected, #rwTabbedRuleItemActionsTab.selected");
                $currentSelectedTab.data("searchtext", _wizard.searchControl.val())
                var newSearchVal = $tabSelected.data("searchtext");
                if (!checkExists(newSearchVal))
                {
                    _wizard.searchControl.val("");
                }
                else
                {
                    _wizard.searchControl.val(newSearchVal);
                }
                //switch tabs to new selected one
                var tabContentId = $tabSelected.data("tabcontentid");
                var $tabContent = $("#" + tabContentId);
                var currentSelectedTabContentId = $currentSelectedTab.data("tabcontentid");
                var $currentSelectedTabContent = $("#" + currentSelectedTabContentId);
                $currentSelectedTab.removeClass('selected');
                $tabSelected.addClass('selected');
                $currentSelectedTabContent.hide();
                $tabContent.closest(".absoluteFullWrapperOverflow").scrollTop(0);
                $toolboxHeader.text($tabSelected.find(".tab-text").text());
                $tabContent.show();
                _wizard.searchControl.focus();
            };

            $("#rwTabbedRuleItemSelectorPanel").on("click", "#rwTabbedRuleItemEventsTab, #rwTabbedRuleItemConditionsTab, #rwTabbedRuleItemActionsTab", null, changeSelectedTab);
            _wizard.searchControl.focus();
        },

        _attachRuleAreaEvents: function ()
        {
            var rulePanelbox = jQuery('#RulePanelbox_RuleArea');

            rulePanelbox.on("click", "#ruleDefinitionRulesArea", null, SourceCode.Forms.Designers.Rule._handlerClicked);

            // Create handler with expander and border div and append to document//
            rulePanelbox.on("mouseover", "ul.rulesUl.handler:not(.prefix), li.action:not(.prefix),li.condition:not(.prefix), li.event", null, function (event)
            {
                var jq_this = jQuery(event.target);
                var jq_li = jq_this.closest("li.action:not(.prefix),li.condition:not(.prefix), li.event");
                var jq_ul = jq_this.closest("ul.rulesUl.handler:not(.prefix)");
                var jq_prefixLi = jq_this.closest("li.action.prefix");

                if (jq_this.hasClass("comments"))
                {
                    jq_li.addClass("hover");

                    event.stopPropagation();
                }
                else if (jq_li.length > 0)
                {
                    var jq_ImageWrapper = jq_li.find(".rulesImageWrapper");
                    jq_ImageWrapper.css("display", "inline");
                    jq_li.addClass("hover");

                    SourceCode.Forms.Designers.Rule._setItemMobilitySettings(jq_li, jq_ImageWrapper);
                }
                else if (jq_prefixLi.length > 0)
                {
                    var jq_ImageWrapper = jq_prefixLi.find(">ul>div.rulesImageWrapper");
                    jq_ImageWrapper.css("display", "inline");
                    jq_prefixLi.addClass("hover");

                    SourceCode.Forms.Designers.Rule._setExecutionGroupMobilitySettings(jq_prefixLi, jq_ImageWrapper);
                }
                else if (jq_ul.length > 0)
                {
                    jq_ul.addClass("hover");
                    var jq_ImageWrapper = jq_ul.find("> .rule-item-wrapper > .rulesImageWrapper");
                    jq_ImageWrapper.css("display", "inline");
                    SourceCode.Forms.Designers.Rule._setHandlerMobilitySettings(jq_ul, jq_ImageWrapper);
                }
            });

            rulePanelbox.on("mouseout", "ul.rulesUl.handler:not(.prefix), li.action:not(.prefix),li.condition:not(.prefix), li.event", null, function (event)
            {
                var jq_this = jQuery(event.target);
                var jq_li = jq_this.closest("li.action:not(.prefix),li.condition:not(.prefix), li.event");
                var jq_ul = jq_this.closest("ul.rulesUl.handler:not(.prefix)");
                var jq_prefixLi = jq_this.closest("li.action.prefix");
                var jq_ImageWrapper;

                if (jq_li.length > 0)
                {
                    jq_ImageWrapper = jq_li.find(".rulesImageWrapper");
                    jq_ImageWrapper.css("display", "none");
                    jq_li.removeClass("hover");
                }
                else if (jq_prefixLi.length > 0)
                {
                    jq_ImageWrapper = jq_prefixLi.find(">ul>div.rulesImageWrapper");
                    jq_ImageWrapper.css("display", "none");
                    jq_prefixLi.removeClass("hover");
                }
                else
                {
                    jq_ul.removeClass("hover");
                    jq_ul.find("> .rule-item-wrapper > .rulesImageWrapper").css("display", "none");
                }
            });
        },

        _getExternalItemType: function ($li)
        {
            var input = $li.find("input");
            var name = input.attr("Name");

            switch (name)
            {
                case "Handlers":
                    return "Handler";
                case "Conditions":
                    return "Condition";
                case "Actions":
                    return "Action";
                case "Events":
                    return "Event";
            }
        },

        _getRulesWizardContext: function ()
        {
            var context = SourceCode.Forms.WizardContainer.currentRuleWizardContext.toLowerCase();
            if (context === "form")
            {
                if (SourceCode.Forms.WizardContainer.stateID)
                {
                    context = "state";
                }
            }
            return context;
        },

        _collapseCategorySection: function (expander)
        {
            var section = expander.closest("div.categorySections");
            var sectionRadiobox = section.find(".radiobox");

            expander.addClass("collapsed");
            sectionRadiobox.hide();
            section.find(".section-specifier").addClass("no-border");
        },

        _expandCategorySection: function (expander)
        {
            var section = expander.closest("div.categorySections");
            var sectionRadiobox = section.find(".radiobox");

            expander.removeClass("collapsed");
            sectionRadiobox.show();
            section.find(".section-specifier").removeClass("no-border");
        },

        //Instant Search for items within the current tab (No Web Request)
        _searchRuleItems: function (panelID, searchText)
        {
            if (searchText !== "")
            {
                var panel = jQuery("#" + panelID);
                var itemsFound = 0;

                //Hide all the items
                panel.find(".radiobox-button").addClass("rule-filteredOut");

                //hide all main categories, show them as something is found within them
                panel.find(".categorySections").hide();

                //Remove BG color span
                panel.find(".radiobox-button").removeHighlight();

                //Show all relevant items
                panel.find(".radiobox-button:not(.not-searchable, .support-filtered)").filter(function ()
                {
                    var jq_this = jQuery(this);
                    var showItem = jq_this.text().toLowerCase().contains(searchText.toLowerCase());

                    if (showItem)
                    {
                        jq_this.highlightText(searchText);
                        jq_this.removeClass("rule-filteredOut");
                        var $closestCategorySection = jq_this.closest("div.categorySections");
                        $closestCategorySection.show();

                        var sectionExpander = $closestCategorySection.find(">div.section-expander");

                        if (sectionExpander.hasClass("collapsed"))
                        {
                            _wizard._expandCategorySection(sectionExpander);
                        }

                        itemsFound++;
                    }
                });

                if (itemsFound === 0)
                {
                    _wizard._showNoItemsFoundMsg(panelID);
                }
                else
                {
                    panel.find("div.rw-nif").hide();
                }
            } else
            {
                _wizard._clearSearch(panelID);
            }
        },

        _showNoItemsFoundMsg: function (panelID)
        {
            var panel = jQuery("#" + panelID);
            var divMsg = panel.find("div.rw-nif");

            if (divMsg.length === 0)
            {
                divMsg = jQuery("<div class='rw-nif'>" + Resources.RuleDesigner.MsgNoItemsFound + "</div>");
                panel.append(divMsg);
            } else
            {
                divMsg.show();
            }
        },

        _clearSearch: function (panelID)
        {
            var panel = jQuery("#" + panelID);

            //Hide no items found msg
            panel.find("div.rw-nif").hide();

            //Remove BG color span
            panel.find(".radiobox-button").removeHighlight();
            panel.find(".radiobox-button.rule-filteredOut").removeClass("rule-filteredOut");

            //Show al main Sections
            panel.find(".categorySections").filter(function ()
            {
                var _this = jQuery(this);
                var childItemsLength = _this.find(".radiobox-button:not(.support-filtered)").length;
                return childItemsLength > 0;
            }).show();

            _wizard._checkCategoriesForChildren();
        },

        _initializeControls: function ()
        {
            jQuery("#rwTxtComments").textbox();
            jQuery("#readOnlyTxtComments").textbox();
            _wizard._initRuleNameBox();
        },

        _addRuleAreaSections: function ()
        {
            var jq_rulesArea = jQuery("#RulePanelbox_RuleArea");
            var sections = [];

            sections[0] = "Rules";

            for (var s = 0; s < sections.length; s++)
            {
                var jq_ulArea = jQuery("<ul id='ruleDefinition" + sections[s] + "Area' class='rulesUl'></ul>");

                jq_rulesArea.append(jq_ulArea);
            }
        },

        _checkCategoriesForChildren: function ()
        {
            var $eventsOther = $("#EventsRulePanelbox > .category-other");
            var $notHiddenEvents = $eventsOther.find('div:not(div.section-specifier, div.section-expander)').filter(function () { return $(this).find("li label")[0].style.display !== "none" });
            if ($notHiddenEvents.length === 0)
            {
                $eventsOther.hide();
            }
            var $conditionsOther = $("#ConditionsRulePanelbox > .category-other");
            var $notHiddenConditions = $conditionsOther.find('div:not(div.section-specifier, div.section-expander)').filter(function () { return $(this).find("li label")[0].style.display !== "none" });
            if ($notHiddenConditions.length === 0)
            {
                $conditionsOther.hide();
            }
            var $actionsOther = $("#ActionsRulePanelbox > .category-other");
            var $notHiddenActions = $actionsOther.find('div:not(div.section-specifier, div.section-expander)').filter(function () { return $(this).find("li label")[0].style.display !== "none" });
            if ($notHiddenActions.length === 0)
            {
                $actionsOther.hide();
            }
        },

        checkCategoriesVisibility: function ()
        {
            var $conditionsPanelCategories = $("#ConditionsRulePanelbox").find(".categorySections:not(.category-other)");
            var $actionsPanelCategories = $("#ActionsRulePanelbox").find(".categorySections:not(.category-other)");

            $conditionsPanelCategories.show();
            $actionsPanelCategories.show();

            
            $conditionsPanelCategories.filter(function (index, item)
            {
                var $item = jQuery(item);
                var childItemsLength = $item.find(".radiobox-button:not(.support-filtered, .rule-filteredOut)").length;
                return childItemsLength == 0;
            }).hide();

            
            $actionsPanelCategories.filter(function (index, item)
            {
                var $item = jQuery(item);
                var childItemsLength = $item.find(".radiobox-button:not(.support-filtered, .rule-filteredOut)").length;
                return childItemsLength == 0;
            }).hide();
        }
    }
})(jQuery);
