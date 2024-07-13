(function ($)
{
    // Namespacing the Designer
    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};

    var _wizardContainer = SourceCode.Forms.WizardContainer = {

        ruleWizardPopupId: "ruleWizardPopup",
        _rulesDialog: null,

        scripts: [
            "Rules/Script/sourcecode.Forms.designers.rule.js", //1
            "Rules/Script/sourcecode.Forms.designers.rule.wizard.js", //2
            "Rules/Script/sourcecode.Forms.designers.rule.actions.js", //3
            "Rules/Script/sourcecode.Forms.designers.rule.ajaxcall.js", //4
            "Rules/Script/sourcecode.Forms.designers.rule.conditions.js", //5
            "Rules/Script/sourcecode.Forms.designers.rule.handlers.js",
            "Rules/Script/sourcecode.Forms.designers.rule.events.js", //6
            "Rules/Script/sourcecode.Forms.designers.rule.templates.js", //7
            "Rules/Script/ContextMenuWidget.js", //8
            "Rules/Script/CustomValueWidget.js", //9
            "Rules/Script/Plugins.js", //10
            "Rules/Script/PopupSelectorWidget.js", //11
            "Rules/Script/TreeSelectorWidget.js", //12
            "Rules/Script/ValidationWidget.js", //13
            "Rules/Script/CategorySelectorWidget.js", //14
            "Rules/Script/ConditionWidget.js", //15
            "Rules/Script/ConfigurationWidget.js", //16
            "Rules/Script/BasicMappingWidget.js", //17
            "Rules/Script/TwoSectionsMappingWidget.js", //18
            "Rules/Script/OpenWorkItemMappingWidget.js", //19,
            "Rules/Script/ActivityMappingWidget.js", //19,
            "Rules/Script/MailMappingWidget.js", //20
            "Rules/Script/MessageMappingWidget.js", //21
            "Rules/Script/FilterWidget.js", //22
            "Rules/Script/OrderWidget.js", //23
            "Rules/Script/SettingsMappingWidget.js", //24
            "Rules/Script/BrowserNavigateMappingWidget.js", //25
            "Rules/Script/ReadOnlyWidget.js", //26
            "Rules/Script/FormNavigateMappingWidget.js", //27
            "Rules/Script/ControlPropertiesMappingWidget.js" //28
        ],

        styles: [
            "Rules/Styles/{0}/CSS/ConditionWidget.css",
            "Rules/Styles/{0}/CSS/RulesTargetTree.css",
            "Rules/Styles/{0}/CSS/RulesWidgets.css",
            "Rules/Styles/{0}/CSS/Wizard.css",
            "Rules/Styles/{0}/CSS/WizardContainer.css"
        ],

        initialize: function ()
        {
            _wizardContainer._loadScripts();
            _wizardContainer._loadStyles();
        },

        _loadStyles: function ()
        {
            var _styleCount = _wizardContainer.styles.length;

            while (!!_styleCount--)
            {
                var style = _wizardContainer.styles.shift().replace("{0}", k2.stylePath);
                $.addStylesheet(style);
            }
        },

        _loadScripts: function ()
        {
            if (!!_wizardContainer.scripts.length)
                $.addScript(applicationRoot.concat(this.scripts.shift()), function (script)
                {
                    _wizardContainer._loadScripts();
                });
        },

        hide: function ()
        {
            cachedPlugins = [];
            SourceCode.Forms.Designers.Rule.tmpContextDefinition = null;
            popupManager.closeAll(this.ruleWizardPopupId, { cancelOnClose: true, cancelClose: false });

            SourceCode.Forms.Designers.Rule.Wizard.onClose();
            this._rulesDialog = null;
            this.wizard = null;
        },

        show: function (context, definitionXmlFqn, options)
        {
            _wizardContainer.currentRuleWizardContext = context;
            _wizardContainer.contextVariableName = definitionXmlFqn;

            var ruleID = "";
            var stateID = "";

            delete _wizardContainer.stateID;
            delete _wizardContainer.ruleID;
            delete _wizardContainer.actionID;
            delete _wizardContainer.definitionID;
            SourceCode.Forms.Designers.Rule.isHiddenDesigner = false;

            if (!!options)
            {
                if (checkExists(options.ruleGrid))
                {
                    if (options.ruleGrid.is("#pgRuleGrid") || options.ruleGrid.is("#pgRulesTabContent") || options.ruleGrid.is("#vdFormEventsTabGrid"))
                    {
                        ruleID = SourceCode.Forms.RuleGrid.getSelectedID(options.ruleGrid);
                    }
                    else
                    {
                        ruleID = SourceCode.Forms.RuleList.getSelectedID(options.ruleGrid);
                    }

                    _wizardContainer.ruleID = ruleID;
                }
                else if (checkExists(options.ruleTree))
                {
                    ruleID = options.ruleTree.find(".selected").attr("id");
                    _wizardContainer.ruleID = ruleID;
                }

                if (checkExists(options.stateID))
                {
                    stateID = options.stateID;
                    _wizardContainer.stateID = stateID;
                }

                if (checkExists(options.ruleID))
                {
                    ruleID = options.ruleID;
                    _wizardContainer.ruleID = ruleID;
                }

                if (checkExists(options.actionID))
                {
                    _wizardContainer.actionID = options.actionID;
                }

                if (checkExists(options.stateID))
                {
                    _wizardContainer.stateID = options.stateID;
                }
            }

            var _definitionXmlFqn = definitionXmlFqn.split('.');
            var _definitionXml = window;

            while (!!_definitionXmlFqn.length)
                _definitionXml = _definitionXml[_definitionXmlFqn.shift()];

            _wizardContainer.contextDefinition = _definitionXml.xml;

            var data = {
                Context: context,
                DefinitionXML: encodeURIComponent(_definitionXml.xml),
                ID: ruleID,
                StateID: stateID,
                ContextVariableName: definitionXmlFqn
            }

            _wizardContainer._doLoad(data);
        },


        //show/hide toolbox in the rules wizard
        _toggleRulesToolbox: function (e)
        {
            var panecontainer = $("#RulesWizardPaneContainer");
            var panecontainerctl = panecontainer.data("ui-panecontainer");
            var hidePaneId = "RulesWizardTopPane";

            if ($(e.target).k2button("isToggledOn") === false)
            {
                panecontainerctl.hidePane(hidePaneId, "slide-left");
            }
            else
            {
                panecontainerctl.showPane(hidePaneId, "slide-left");
            }
        },

        _doLoad: function (data)
        {
            var _documentBody = document.body;
            var _scalePercentageHeight = 0.8;
            var _scalePercentageWidth = 0.95;
            var url = applicationRoot + "Rules/PartialPage.aspx";

            //show a loading spinner not managed by the Rule Designer for the case of a hidden designer (data source -> method configuration)
            if (checkExists(this.actionID))
            {
                SourceCode.Forms.Designers.Rule.isHiddenDesigner = true;
                $("body").overlay({ modal: true, icon: "loading" });
            }

            this._rulesDialog = jQuery.popupManager.createPopup({
                contentUrl: url,
                onContentLoaded: this._postLoadCallback.bind(this),
                onContentLoadException: this._contentExceptionCallback.bind(this),
                contentData: data,
                modalize: true,
                draggable: true,
                id: this.ruleWizardPopupId,
                headerText: Resources.Filtering.RulesWizardPopupHeader,
                height: Math.floor(_documentBody.offsetHeight * _scalePercentageHeight),
                maximizable: true,
                showHeaderButtons: true,
                cancelClose: true,
                removeContent: true,
                width: Math.floor(_documentBody.offsetWidth * _scalePercentageWidth),
                onRestore: function ()
                {
                    jQuery("#RulesWizardPaneContainer").panecontainer("refresh");
                    SourceCode.Forms.Designers.Rule._resetConditionSpecifierHeight();
                },
                onMaximize: function ()
                {
                    SourceCode.Forms.Designers.Rule._resetConditionSpecifierHeight();
                },
                toolbuttons: [
                    {
                        type: "help",
                        click: function () { HelpHelper.runHelp(7071); }
                    },
                    {
                        type: "leftpaneltoggle",
                        behavior: "toggle",
                        toggled: true,
                        buttonstyle: "icon",
                        change: function (e)
                        {
                            //post a message down to the rules class to hide/show the toolbox.
                            _wizardContainer._toggleRulesToolbox(e);
                        }
                    }
                ],
                buttons: [
                    {
                        id: "RuleSettings",
                        text: Resources.WizardButtons.SettingsButtonText,
                        click: function () { _wizardContainer._showRuleSettingsDialog(); }
                    },
                    {
                        text: Resources.WizardButtons.OKButtonText,
                        type: "finish",
                        click: function ()
                        {
                            if (SourceCode.Forms.Designers.Rule.isHiddenDesigner || SourceCode.Forms.Designers.Rule.Wizard._validateRuleWizard())
                            {
                                jQuery("body").overlay({ modal: true, icon: "loading" });
                                SourceCode.Forms.Designers.Rule.saveRuleDefinition();
                            }
                        }
                    },
                    {
                        text: Resources.WizardButtons.CancelButtonText,
                        type: "cancel",
                        id: "cancelRulesWizardButton"
                    }
                ],
                onClose: function ()
                {
                    SourceCode.Forms.Designers.Rule.suspendValidation = true;
                    _wizardContainer._onRuleDialogClose(_wizardContainer._rulesDialog);
                }
            });

            // only show the Rule Designer if its supposed to be shown, dont show and then hide it.
            if (!SourceCode.Forms.Designers.Rule.isHiddenDesigner)
            {
                this._rulesDialog.popupwindow("show");
            }
        },

        //initialize the rules designer UI controls (now that the UI has loaded)
        _postLoadCallback: function ()
        {
            $("#cancelRulesWizardButton").on("mousedown", function ()
            {
                // TFS 504960 - Flag to prevent blur when the dialog is cancelled.
                SourceCode.Forms.Designers.Rule.suspendValidation = true;
            });

            $("#cancelRulesWizardButton").on("mouseup", function ()
            {
                // Use mousedown with mouseup because blur and click event ordering is not reliable.
                _wizardContainer._onRuleDialogClose(_wizardContainer._rulesDialog);
            });

            $("#cancelRulesWizardButton").on("dragstart", function ()
            {
                // If the user click on the button but changes his/her mind and moves off the button, perform validation.
                var txtInput = $('#ruleWizardPopup #RuleEditorTabBox a.tab.selected input');
                if (txtInput.is(':visible'))
                {
                    txtInput.trigger("blur");
                }
            });

            $("#RulesWizardPaneContainer").panecontainer();
            $("#rwToolboxPC").panecontainer();

            $("#RulesWizardPaneContainer").on("panecontainerresize", function (event)
            {
                SourceCode.Forms.Designers.resizeToolboxPaneTabs("RulesWizardTopPane");
                _wizardContainer._savePaneSizePreference(event);
                SourceCode.Forms.Designers.Rule._resetConditionSpecifierHeight();
            });

            SourceCode.Forms.Designers.Rule.Wizard._initializeWizard();
            SourceCode.Forms.Designers.resizeToolboxPaneTabs("RulesWizardTopPane");
            SourceCode.Forms.Designers.Rule._resetConditionSpecifierHeight();

            //Dismiss loading spinner
            if (SourceCode.Forms.Designers.Rule.isHiddenDesigner)
            {
                $("body").removeOverlay();
            }
        },

        // shows an exception popup and closes the Rules Designer cleanly
        _contentExceptionCallback: function(xhr, status, data)
        {
            // Load method automatically populates the DOM with response. Clear it out
            this._rulesDialog.find(".scroll-wrapper").empty();
            // Show an exception popup and close the Rule Designer when the exception popup is dismissed
            SourceCode.Forms.ExceptionHandler.handleException(xhr.responseText, this.hide.bind(this)); 
        },
        
        _onRuleDialogClose: function (RulesDialog)
        {
            if (RulesDialog.popupwindow("option", "cancelClose"))
            {
                var options = ({
                    message: Resources.RuleDesigner.lrConfirmCancelWizard,
                    onAccept: function ()
                    {
                        popupManager.closeLast(); // closes the confirmation
                        var _definitionXmlFqn = _wizardContainer.contextVariableName.split('.');
                        var _definitionXml = window;

                        while (_definitionXmlFqn.length !== 1)
                            _definitionXml = _definitionXml[_definitionXmlFqn.shift()];

                        _definitionXml._closeRuleWizard(false); // calls _wizardContainer.hide()
                    },
                    onDecline: function ()
                    {
                        popupManager.closeLast();
                        $('#ruleWizardPopup #RuleEditorTabBox a.tab.selected input').trigger("blur");
                    }
                });
                popupManager.showConfirmation(options);
            }
        },

        _savePaneSizePreference: function (event)
        {
            event.stopPropagation();

            var pc = $("#RulesWizardPaneContainer");
            var width = pc.panecontainer("getPaneWidth", "#RulesWizardTopPane") + "px";

            $.ajax({
                cache: false,
                data: $.param({ action: "setting", name: "RuleDesignerToolboxPaneWidth", value: width }),
                dataType: "xml",
                url: "AppStudio/AJAXCall.ashx",
                type: "POST"
            });
        },


        _setKeyPressResponse: function ()
        {
            $("#RuleSettingsDialogTemplate").off("keydown.rulesettingsdialog", "#RuleName, #RuleDesc").on("keydown.rulesettingsdialog", "#RuleName, #RuleDesc", null, function (e)
            {
                switch (e.keyCode)
                {
                    case 13:
                        var element = $(".popup").last().find(".popup-footer .button").eq(1);
                        $(".popup").last().find(".popup-footer .button").eq(1).trigger("click");
                        e.stopPropagation();
                        e.preventDefault();
                        break;
                    case 27:
                        $(".popup").last().find(".popup-footer .button:nth-child(2)").trigger("click");
                        e.stopPropagation();
                        e.preventDefault();
                        break;
                }

            });
        },

        _showRuleSettingsDialog: function ()
        {
            $("#RuleName, #RuleDesc").textbox();
            $("#RuleSettingsDialogTemplate").show();
            var h = $("#RuleSettingsDialogTemplate").height();
            var ownerDocument = SourceCode.Forms.Designers.Rule.tmpConfiguredRulesDefinitionXML;
            _wizardContainer._setKeyPressResponse();
            //Determine context for help
            //GS::TODO HELP ID
            var helpID = 7077;

            //create the dialog
            var RuleSettingsDialog = jQuery.popupManager.showPopup({
                headerText: Resources.RuleDesigner.RuleSettingsDialogHeading,
                modalize: true,
                content: $("#RuleSettingsDialogTemplate"),
                width: 400,
                height: h + 100,
                buttons: [
                    {
                        type: "help",
                        click: function () { HelpHelper.runHelp(helpID); }
                    },
                    {
                        text: Resources.MessageBox.OKButtonText,
                        click: function ()
                        {
                            $("#RuleSettingsDialogTemplate").off("keydown.rulesettingsdialog", "#RuleName, #RuleDesc");
                            var $ruleName = $input = $("#RuleName");
                            var ruleNameVal = $ruleName.val().trim();

                            //check for duplicates and act accordingly.
                            SourceCode.Forms.Designers.Rule._checkForDuplicateRuleNameInCurrentContext(ruleNameVal, true, true, function (result)
                            {
                                switch (result)
                                {
                                    case "navigatedAway":
                                        //do nothing, as the rules designer has already opened another rule.
                                        break;
                                    case "duplicate":
                                        var ruleNameExists = (checkExists(SourceCode.Forms.Designers.Rule.ruleName) && checkExists(SourceCode.Forms.WizardContainer.ruleID))
                                        $input.val(ruleNameExists? SourceCode.Forms.Designers.Rule.ruleName : '');
                                        $input.trigger("focus").caret("end");
                                        break;
                                    case "unique":
                                        SourceCode.Forms.Designers.Rule.ruleDescription = $("#RuleDesc").val();
                                        SourceCode.Forms.Designers.Rule.Wizard.setRuleTabText(ruleNameVal, true);
                                        popupManager.closeLast();
                                        break;

                                }
                            });

                            _wizardContainer._setKeyPressResponse();
                        }
                    },
                    {
                        text: Resources.MessageBox.CancelButtonText,
                        click: function ()
                        {
                            $("#RuleSettingsDialogTemplate").off("keydown.rulesettingsdialog", "#RuleName, #RuleDesc");
                            popupManager.closeLast();
                            $("#RuleName").val("");
                            $("#RuleDesc").val("");
                        }
                    }
                ]
            });

            var ruleNameValue = SourceCode.Forms.Designers.Rule.ruleNameIsCustom ? SourceCode.Forms.Designers.Rule.ruleName : SourceCode.Forms.Designers.Rule.ruleFriendlyName;
            $("#RuleName").val(ruleNameValue);
            $("#RuleDesc").val(SourceCode.Forms.Designers.Rule.ruleDescription);

            $("#RuleDesc").trigger("focus");
            $("#RuleName").trigger("focus").caret("end");
        },

        _getSettingsButton: function ()
        {
            return popupManager.getPopup("ruleWizardPopup").getButtonById("RuleSettings");
        },

        enableRuleSetting: function ()
        {
            var $settingsButton = _wizardContainer._getSettingsButton();
            if ($settingsButton.hasClass("disabled"))
            {
                $settingsButton.removeClass("disabled");
                $settingsButton.on("click", _wizardContainer._showRuleSettingsDialog);
            }
        },

        disableRuleSetting: function ()
        {
            var $settingsButton = _wizardContainer._getSettingsButton();
            $settingsButton.addClass("disabled");
            $settingsButton.off("click");
        },

        setRuleSettingsState: function ()
        {
            var eventIsCurrentHandler = SourceCode.Forms.Designers.Rule.Events._getExistingEventDetails();
            if (eventIsCurrentHandler === false)
            {
                _wizardContainer.disableRuleSetting();
            }
            else
            {
                _wizardContainer.enableRuleSetting();
            }
        }
    }
})(jQuery);
