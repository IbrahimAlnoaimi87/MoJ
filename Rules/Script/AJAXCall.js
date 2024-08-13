//getItems
//#region
function saveRule() {
	var qs = { method: 'SaveRule',
		ruleDef: encodeURIComponent(configuredRulesDefinitionXML.xml),
		context: currentRuleWizardContext,
		contextDefinition: encodeURIComponent(contextDefinition)
	};

	var options = { url: 'AJAXCall.ashx',
		type: 'POST',
		data: qs,
		cache: false,
		dataType: "text",
		success: function (data, textStatus) { saveRuleSuccess(data, textStatus) },
		error: function (data, textStatus, errorThrown) {
			popupManager.showError("An error occured. Changes did not take effect.")
			window.parent.closeRuleWizard(true);
		}
	};

	jQuery.ajax(options);
}
//#endregion

//getItemsSuccess
function saveRuleSuccess(data, textStatus) {
	if (SourceCode.Forms.ExceptionHandler.isException(data)) {
		SourceCode.Forms.ExceptionHandler.handleException(data);

		return;
	}

	var _definitionXmlVarName = contextVariableName.split('.');
	var _designerNamespace = window.parent;

	while (_definitionXmlVarName.length !== 1)
		_designerNamespace = _designerNamespace[_definitionXmlVarName.shift()];

	_designerNamespace[_definitionXmlVarName.shift()] = parseXML(data);

	_designerNamespace._closeRuleWizard(true);
}