(function ($)
{
	// Namespacing the Designer
	if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
	if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
	if (typeof SourceCode.Forms.Designers === "undefined" || SourceCode.Forms.Designers === null) SourceCode.Forms.Designers = {};
	if (typeof SourceCode.Forms.Designers.Rule === "undefined" || SourceCode.Forms.Designers.Rule === null) SourceCode.Forms.Designers.Rule = {};

	var _handlers = SourceCode.Forms.Designers.Rule.Handlers = {
		_attachHandlerEvents: function (handlerName)
		{
			var handlerItem = jQuery("#" + handlerName);
			var context = SourceCode.Forms.WizardContainer.currentRuleWizardContext.toLowerCase();

			if (context === "form")
			{
				if (SourceCode.Forms.WizardContainer.stateID)
				{
					context = "state";
				}
			}

            handlerItem.on("click", function ()
			{
				_handlers.handlerClicked(handlerName, null, "true", true, "false", null, context, null, null, null, null);
			});			
		},

		handlerClicked: function (handlerName, handlerID, isCurrentHandler, isEnabled, isInherited, handlerDefinitionID, context, defaultValues, insertBeforeObj, insertAfterObj, appendToObj)
		{
			SourceCode.Forms.Designers.Rule.disableHandlerDisabling = true;
			var $handlerUl = SourceCode.Forms.Designers.Rule._addHandler(handlerName, handlerID, isCurrentHandler, isEnabled, isInherited, handlerDefinitionID, context, defaultValues, insertBeforeObj, insertAfterObj, appendToObj);
			if (!SourceCode.Forms.Designers.Rule.busyLoading)
			{
				SourceCode.Forms.Designers.Rule._refreshSelectedItemToolbarState();
				SourceCode.Forms.Designers.Rule._dirtyHandlerCleanup();
			}
			SourceCode.Forms.Designers.Rule._toggleEmptyRuleDesignPlaceHolder();
			SourceCode.Forms.Designers.Rule.disableHandlerDisabling = false;
			return $handlerUl[0].getAttribute("id");
		}
	}
})(jQuery);
