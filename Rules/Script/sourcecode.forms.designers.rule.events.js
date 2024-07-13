(function ($)
{
    // Namespacing the Designer
    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Designers === "undefined" || SourceCode.Forms.Designers === null) SourceCode.Forms.Designers = {};
    if (typeof SourceCode.Forms.Designers.Rule === "undefined" || SourceCode.Forms.Designers.Rule === null) SourceCode.Forms.Designers.Rule = {};

    var _events = SourceCode.Forms.Designers.Rule.Events = {
        _attachRuleEvents: function (ruleID)
        {
            var eventItem = jQuery("#" + ruleID);
            eventItem.on("click", function ()
            {
                var eventIsCurrentHandler = _events._getExistingEventDetails();

                if ($chk(SourceCode.Forms.WizardContainer.ruleID) && !eventIsCurrentHandler)
                {
                    var options = ({
                        message: Resources.RuleDesigner.wrnChangeReferenceEvent,
                        onAccept: function ()
                        {
                            popupManager.closeLast();
                            SourceCode.Forms.Designers.Rule.Wizard._setRulesWizardToDefault();

                            // remove all actions and conditions
                            SourceCode.Forms.Designers.Rule._removeAllActionsCondition();

                            delete SourceCode.Forms.WizardContainer.ruleID;
                            delete SourceCode.Forms.WizardContainer.definitionID;

                            SourceCode.Forms.Designers.Rule.Wizard.setRuleTabText("", false);

                            _events._eventClicked(ruleID, "true", true);

                            SourceCode.Forms.WizardContainer.enableRuleSetting();
                        },
                        onCancel: function ()
                        {
                            popupManager.closeLast();
                        },
                        draggable: true,
                        type: 'warning'
                    });

                    popupManager.showConfirmation(options);

                }
                else
                {
                    _events._eventClicked(ruleID, "true", true);
                }
            });
        },

        _eventClicked: function (ruleID, eventIsCurrentHandler, enabled, defaultValues, ignoreEventDuplicateCheck, ignoreSettingTabText)
        {
            var ruleXml = SourceCode.Forms.Designers.Rule.Wizard.rulesXml.selectSingleNode("//RuleDefinitions/Events/Event[@Name='" + ruleID + "']"); // Getting Rule Definition XML
            var childFilter = ruleXml.getAttribute(SourceCode.Forms.Designers.Rule.Wizard.SUPPORTED_CHILD_TYPES);

            var eventChangeSupport = SourceCode.Forms.Designers.Rule._checkEventSupportedChildTypes(childFilter);

            if (!eventChangeSupport.success)
            {
                popupManager.showError(eventChangeSupport.message);
                return false;
            }

            var li = SourceCode.Forms.Designers.Rule._addRuleDefinitionItem(ruleID, "ruleDefinitionRulesArea", ruleXml, eventIsCurrentHandler, enabled, null, defaultValues, "event", ignoreEventDuplicateCheck);

            if (checkExistsNotEmpty(childFilter))
            {
                SourceCode.Forms.Designers.Rule.filterUI(SourceCode.Forms.Designers.Rule.Wizard.SUPPORTED_PARENT_TYPES, childFilter);
            }
            else
            {
                SourceCode.Forms.Designers.Rule.filterUI(SourceCode.Forms.Designers.Rule.Wizard.SUPPORTED_PARENT_TYPES, "");
            }

            var eventIsCurrentHandler = SourceCode.Forms.Designers.Rule.Events._getExistingEventDetails();

            if (checkExistsNotEmpty(eventIsCurrentHandler) && eventIsCurrentHandler !== false && (ignoreSettingTabText !== true))
            {
                if (!checkExistsNotEmpty(SourceCode.Forms.Designers.Rule.ruleName) ||
                    SourceCode.Forms.Designers.Rule.ruleNameIsCustom == false)
                {
                    SourceCode.Forms.Designers.Rule.Wizard.setRuleTabText("", false);
                }
            }

            return li;
        },

        _getExistingEventDetails: function ()
        {
            var returnValue = true;

            if (SourceCode.Forms.WizardContainer.ruleID)
            {
                var event = SourceCode.Forms.Designers.Rule.tmpConfiguredRulesDefinitionXML.selectSingleNode("Rules/Rule[@ID='" + SourceCode.Forms.WizardContainer.ruleID + "']/Events/Event");

                if (event !== null)
                {
                    returnValue = event.getAttribute("IsCurrentHandler") === "True" ? true : false;
                }
            }

            return returnValue;
        }
    }
})(jQuery);
