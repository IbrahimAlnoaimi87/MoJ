(function ($)
{
	// Namespacing the Designer
	if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
	if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
	if (typeof SourceCode.Forms.Designers === "undefined" || SourceCode.Forms.Designers === null) SourceCode.Forms.Designers = {};
	if (typeof SourceCode.Forms.Designers.Rule === "undefined" || SourceCode.Forms.Designers.Rule === null) SourceCode.Forms.Designers.Rule = {};

	var ajaxCall = SourceCode.Forms.Designers.Rule.AJAXCall = {
		saveRule: function (ruleID)
		{
			var qs = { method: 'SaveRule',
				ruleDef: encodeURIComponent(SourceCode.Forms.Designers.Rule.tmpConfiguredRulesDefinitionXML.xml),
				context: SourceCode.Forms.WizardContainer.currentRuleWizardContext,
				contextDefinition: encodeURIComponent(SourceCode.Forms.Designers.Rule.tmpContextDefinition.xml),
				ruleID: ruleID
			};

			var options = { url: applicationRoot + 'Rules/AJAXCall.ashx',
				type: 'POST',
				data: qs,
				cache: false,
				dataType: "xml",
				success: function (data, textStatus) { ajaxCall._saveRuleSuccess(data, textStatus); },
				error: function (data, textStatus, errorThrown)
				{
					jQuery("body").removeOverlay();

					popupManager.showError("An error occured. Changes did not take effect.")

					var _definitionXmlVarName = SourceCode.Forms.WizardContainer.contextVariableName.split('.');
					var _designerNamespace = window;

					while (_definitionXmlVarName.length !== 1)
						_designerNamespace = _designerNamespace[_definitionXmlVarName.shift()];

					_designerNamespace._closeRuleWizard(true);
				}
			};

			jQuery.ajax(options);
		},
		//#endregion

		//getItemsSuccess
		_saveRuleSuccess: function (data, textStatus)
		{
			jQuery("body").removeOverlay();

			if (SourceCode.Forms.ExceptionHandler.isException(data))
			{
				SourceCode.Forms.ExceptionHandler.handleException(data);

				return;
			}

			var _definitionXmlVarName = SourceCode.Forms.WizardContainer.contextVariableName.split('.');
			var _designerNamespace = window;

			while (_definitionXmlVarName.length !== 1)
				_designerNamespace = _designerNamespace[_definitionXmlVarName.shift()];

			_designerNamespace[_definitionXmlVarName.shift()] = data;

			_designerNamespace._closeRuleWizard(true);
		},

		_getRuleDefinition: function (eventsIdArray)
		{
			//jQuery("body").showOverlay();

			var qs = { method: 'GetRuleDefinition',
				context: SourceCode.Forms.WizardContainer.currentRuleWizardContext,
				contextDefinition: encodeURIComponent(SourceCode.Forms.Designers.Rule.tmpContextDefinition.xml),
				ruleGuidArray: eventsIdArray.toString()
			};

			var options = { url: applicationRoot + 'Rules/AJAXCall.ashx',
				type: 'POST',
				async: false,
				data: qs,
				cache: false,
				dataType: "xml",
				success: function (data, textStatus) { ajaxCall._getRuleDefinitionSuccess(data, textStatus); },
				error: function (data, textStatus, errorThrown)
				{
					jQuery("body").removeOverlay();
					popupManager.showError("An error occured. Changes did not take effect.");

					return false;
				}
			};

			return jQuery.ajax(options).responseXML;
		},

		_getRuleDefinitionSuccess: function (data, textStatus)
		{
			jQuery("body").removeOverlay();

			if (SourceCode.Forms.ExceptionHandler.isException(data))
			{
				SourceCode.Forms.ExceptionHandler.handleException(data);

				return;
			}
		}
		//#endregion
	};
})(jQuery);
