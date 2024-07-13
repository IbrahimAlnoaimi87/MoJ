(function ($)
{
	// Namespacing the Designer
	if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
	if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
	if (typeof SourceCode.Forms.Designers === "undefined" || SourceCode.Forms.Designers === null) SourceCode.Forms.Designers = {};
	if (typeof SourceCode.Forms.Designers.Rule === "undefined" || SourceCode.Forms.Designers.Rule === null) SourceCode.Forms.Designers.Rule = {};

	var _conditions = SourceCode.Forms.Designers.Rule.Conditions = {
		_attachConditionEvents: function (conditionID)
		{
			var conditionItem = jQuery("#" + conditionID);
			var context = SourceCode.Forms.WizardContainer.currentRuleWizardContext.toLowerCase();

			if (context === "form")
			{
				if (SourceCode.Forms.WizardContainer.stateID)
				{
					context = "state";
				}
			}

			conditionItem.on("click", function ()
			{
				var listItem = jQuery("#" + _conditions._conditionClicked(conditionID, "true", true, context));
			});
		},

		_conditionClicked: function (conditionID, conditionIsCurrentHandler, enabled, context, defaultValues, handlerToAddTo, appendAfter, appendBefore)
		{
			var conditionXml = SourceCode.Forms.Designers.Rule.Wizard.rulesXml.selectSingleNode("//RuleDefinitions/Conditions/Condition[@Name='" + conditionID + "']");  // Getting Rule Definition XML
			
			var listItemID = SourceCode.Forms.Designers.Rule._addRuleDefinitionItem(conditionID, "ruleDefinitionActionsArea", conditionXml, conditionIsCurrentHandler, enabled, context, defaultValues, "condition", null, handlerToAddTo, appendAfter, appendBefore);
			if (!SourceCode.Forms.Designers.Rule.busyLoading)
			{
				SourceCode.Forms.Designers.Rule._dirtyHandlerCleanup();
			}
			return listItemID;
		}
	}
})(jQuery);
