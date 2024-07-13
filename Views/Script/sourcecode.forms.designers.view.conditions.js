(function ($)
{
	// Namespacing the Designer
	if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
	if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
	if (typeof SourceCode.Forms.Designers === "undefined" || SourceCode.Forms.Designers === null) SourceCode.Forms.Designers = {};
	if (typeof SourceCode.Forms.Designers.View === "undefined" || SourceCode.Forms.Designers.View === null) SourceCode.Forms.Designers.View = {};

	var _conditions = SourceCode.Forms.Designers.View.Conditions = {

		getExpressionContextPlugins: function ()
		{
			var plugins = [];
			var systemPlugin = new SystemVariablesContextPlugIn();
			systemPlugin.Settings =
			{
				includeAll: "True"
			};
			plugins.push(systemPlugin);

			var envPlugin = new EnvironmentFieldsContextPlugIn();
			envPlugin.Settings = {};
			plugins.push(envPlugin);

			var currentPlugin = new ViewContextPlugIn();
			currentPlugin.Settings =
			{
				isCurrent: "True",
				includeControls: "True",
				includeFields: "True",
				includeViews: "True",
				includeFormControls: "True",
				includeInputControls: "True",
				includeListingControls: "True",
				includeDisplayControls: "True",
				includeActionControls: "True",
				includeExecutionControls: "True",
				includeExpressions: "True",
				includeControlProperties: "True",
				includeParameters: "True"
			}
			plugins.push(currentPlugin);
			return plugins;
		},

		//_showControlCalculation
		_showControlCalculation: function ()
		{
			_conditions.ViewDesigner._BuildViewXML();
			SourceCode.Forms.ExpressionContextHelper._BuildExpressionContextTreeXml(_conditions.getExpressionContextPlugins(), _conditions, _conditions._showControlCalculationInternal);
		},

		_showExpressions: function () 
		{
			_conditions.ViewDesigner._BuildViewXML();
			SourceCode.Forms.ExpressionContextHelper._BuildExpressionContextTreeXml(_conditions.getExpressionContextPlugins(), _conditions, _conditions._showExpressionsInternal);
		},

		_showExpressionsInternal: function (contextXML)
		{
			var expressionsNode = _conditions.View.viewDefinitionXML.selectSingleNode("//Views/View/Expressions");

			if (!checkExists(expressionsNode))
			{
				expressionsNode = _conditions.View.viewDefinitionXML.selectSingleNode("//Views/View").appendChild(_conditions.View.viewDefinitionXML.createElement("Expressions"));
			}

			SourceCode.Forms.Widget.ExpressionGrid.SelectExpression(expressionsNode, contextXML, null, true, function ()
			{
				//After user has finished selecting an expresssion, user may have updated other expressions
				//Thus we need to run through all controls that is using an expression and remove annotation where applicable
				var controlIds = SourceCode.Forms.DependencyHelper.refreshExpressionsAnnotations(_conditions.View.viewDefinitionXML);

				//Refresh all controls that had expression annotation changes
				SourceCode.Forms.Designers.Common.refreshBadgeForControls(controlIds);
				SourceCode.Forms.Designers.Common.applyErrorBadgesToExpressionsWithValidationIssue();
			});
		},

		//_showControlCalculationInternal
		_showControlCalculationInternal: function (contextXML)
		{
			var expressionsNode = _conditions.View.viewDefinitionXML.selectSingleNode("//Views/View/Expressions");

			if (!checkExists(expressionsNode))
			{
				expressionsNode = _conditions.View.viewDefinitionXML.selectSingleNode("//Views/View").appendChild(_conditions.View.viewDefinitionXML.createElement("Expressions"));
			}

			var control = _conditions.View._findControlFromSelectedObject();
			var controlID = control.attr('id');

			var controlNode = _conditions.View.viewDefinitionXML.selectSingleNode("//Controls/Control[@ID='" + controlID + "']");

			SourceCode.Forms.Widget.ExpressionGrid.SelectExpression(expressionsNode, contextXML, controlNode, true, function ()
			{
				if (!checkExists(arguments[0][1]) || !checkExistsNotEmpty(arguments[0][1][0].value))
				{
					control.removeAttr('expressionid');
				}
				else
				{
					control.attr('expressionid', arguments[0][1][0].value);
				}

				var ctrl = arguments[0][0];

				//After user has finished selecting an expresssion, user may have updated other expressions
				//Thus we need to run through all controls that is using an expression and remove annotation where applicable
				var controlIds = SourceCode.Forms.DependencyHelper.refreshExpressionsAnnotations(
					_conditions.View.viewDefinitionXML);

				if (controlIds.indexOf(ctrl.getAttribute("ID")) < 0)
				{
					//Push the currently selected control into the array so it get refreshed
					controlIds.push(ctrl.getAttribute("ID"));
				}

				//Refresh all controls that had expression annotation changes
				SourceCode.Forms.Designers.Common.refreshBadgeForControls(controlIds);
				SourceCode.Forms.Designers.Common.applyErrorBadgesToExpressionsWithValidationIssue();

				_conditions.ViewDesigner._showControlProperties(true);
			});
		},

		_getExpressionName: function (ExpressionId)
		{
			var retVal = "";

			var viewXmlDoc = _conditions.View.viewDefinitionXML;
			var rootElem = viewXmlDoc.documentElement;

			if ($chk(rootElem) === true)
			{
				var expressionName = rootElem.selectSingleNode('//Views/View/Expressions/Expression[@ID="' + ExpressionId + '"]/Name');
				if ($chk(expressionName) === true)
				{
					retVal = expressionName.firstChild.nodeValue;
				}
			}

			return retVal;
		}
	}
})(jQuery);
