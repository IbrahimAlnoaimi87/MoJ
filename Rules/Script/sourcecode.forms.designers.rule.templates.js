(function ($)
{
	// Namespacing the Designer
	if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
	if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
	if (typeof SourceCode.Forms.Designers === "undefined" || SourceCode.Forms.Designers === null) SourceCode.Forms.Designers = {};
	if (typeof SourceCode.Forms.Designers.Rule === "undefined" || SourceCode.Forms.Designers.Rule === null) SourceCode.Forms.Designers.Rule = {};

	var _templates = SourceCode.Forms.Designers.Rule.Templates = {
		_attachTemplateEvents: function (templateID)
		{
			var templateItem = jQuery("#" + templateID);
			templateItem.on("click", function ()
			{
				// > 1 because there will always be the "Rule" event if there is no event selected, or if any other event selected.
				if (jQuery("#RulePanelbox_RuleArea").find('li').length > 1 || jQuery("#RulePanelbox_RuleArea").find('li.event').data('name') !== "Rule")
				{
					var options;
					var eventIsCurrentHandler = SourceCode.Forms.Designers.Rule.Events._getExistingEventDetails();
					if (eventIsCurrentHandler === false)
					{
						options = ({
							message: Resources.RuleDesigner.wrnChangeReferenceTemplate,
							onAccept: function ()
							{
								_templates._changeTemplate(templateID, true);
								popupManager.closeLast();
							},
							onCancel: function ()
							{
								popupManager.closeLast();
							},
							draggable: true,
							type: 'warning'
						});
					}
					else
					{
						options = ({
							message: Resources.RuleDesigner.TemplateChangedMsg,
							onAccept: function ()
							{
								_templates._changeTemplate(templateID, true);
								popupManager.closeLast();
							},
							onDecline: function ()
							{
								_templates._changeTemplate(templateID, false);
								popupManager.closeLast();
							},
							onCancel: function ()
							{
								popupManager.closeLast();
							},
							draggable: true,
							type: 'warning'
						});
					}

					popupManager.showConfirmation(options);
				}
				else
				{
					_templates._changeTemplate(templateID);
				}
			});
		},

		_changeTemplate: function (templateID, removeActions)
		{
			var templateXml = SourceCode.Forms.Designers.Rule.Wizard.rulesXml.selectSingleNode("//RuleDefinitions/Templates/Template[@Name='" + templateID + "']"); // Getting Rule Definition XML
			var eventsXml = templateXml.selectNodes(".//Events/Event");
			var actionsXml = templateXml.selectNodes(".//Actions/Action");

			SourceCode.Forms.Designers.Rule.busyLoading = true;
			SourceCode.Forms.Designers.Rule.doAutoLoadWhileLoading = true;
			delete SourceCode.Forms.WizardContainer.ruleID;
			delete SourceCode.Forms.WizardContainer.definitionID;

			jQuery("#ruleDefinitionRulesArea").children().remove();

			if (removeActions)
			{
				jQuery("#RulePanelbox_RuleArea").children("ul.rulesUl.handler").remove();
			}

			for (var e = 0; e < eventsXml.length; e++)
			{
				var eventID = eventsXml[e].getAttribute("Name");
				var defaultValues = eventsXml[e].selectNodes("Part");

				SourceCode.Forms.Designers.Rule.Events._eventClicked(eventID, "true", true, defaultValues);
			}

			for (var a = 0; a < actionsXml.length; a++)
			{
				var actionID = actionsXml[a].getAttribute("Name");
				var defaultValues = actionsXml[a].selectNodes("Part");

				var context = SourceCode.Forms.WizardContainer.currentRuleWizardContext.toLowerCase();

				if (context === "form")
				{
					if (SourceCode.Forms.WizardContainer.stateID)
					{
						context = "state";
					}
				}

				SourceCode.Forms.Designers.Rule.Actions._actionClicked(actionID, "true", true, context, defaultValues);
			}
			SourceCode.Forms.Designers.Rule.busyLoading = false;
			SourceCode.Forms.Designers.Rule.doAutoLoadWhileLoading = false
			SourceCode.Forms.Designers.Rule._dirtyHandlerCleanup();
			SourceCode.Forms.WizardContainer.enableRuleSetting();
		}
	}
})(jQuery);
