(function ($)
{
	// Namespacing the Designer
	if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
	if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
	if (typeof SourceCode.Forms.Designers === "undefined" || SourceCode.Forms.Designers === null) SourceCode.Forms.Designers = {};
	if (typeof SourceCode.Forms.Designers.Rule === "undefined" || SourceCode.Forms.Designers.Rule === null) SourceCode.Forms.Designers.Rule = {};

	var _actions = SourceCode.Forms.Designers.Rule.Actions = {
		_attachActionEvents: function (actionID)
		{
			var actionItem = jQuery("#" + actionID);
			var context = SourceCode.Forms.WizardContainer.currentRuleWizardContext.toLowerCase();

			if (context === "form")
			{
				if (SourceCode.Forms.WizardContainer.stateID)
				{
					context = "state";
				}
			}

			actionItem.on("click", function ()
			{
				var listItem = jQuery("#" + _actions._actionClicked(actionID, "true", true, context));
			});
		},

		_actionClicked: function (actionID, actionIsCurrentHandler, enabled, context, defaultValues, handlerToAddTo, appendAfter, appendBefore)
		{
			var actionXml = SourceCode.Forms.Designers.Rule.Wizard.rulesXml.selectSingleNode("//RuleDefinitions/Actions/Action[@Name='" + actionID + "']");  // Getting Rule Definition XML
			
			var listItemID = SourceCode.Forms.Designers.Rule._addRuleDefinitionItem(actionID, "ruleDefinitionActionsArea", actionXml, actionIsCurrentHandler, enabled, context, defaultValues, "action", null, handlerToAddTo, appendAfter, appendBefore);
			if (!SourceCode.Forms.Designers.Rule.busyLoading)
			{
				SourceCode.Forms.Designers.Rule._dirtyHandlerCleanup();
			}
			var jq_listItem = jQuery('#' + listItemID);

			return jq_listItem.attr("id");
		}
	}
})(jQuery);
