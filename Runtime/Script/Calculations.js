/* Control has ExpressionID attribute
Expression contains relevant information about the actual calculation
*/
/*
Updates the calculated controls when a field changes which is used in any calculation 
Used mostly in capture view & capture list when control's value + relevant field changes (Events.js)
*/
var editableListCache = [];
var simpleListCache = [];
var evaluatingExpressions = [];
var expressionBusy = false;
var expressionHash = new SFRuntimeHash();

var _runtimeUpdateCalculatedControlsHash = new SFRuntimeHash();

//general calculation function that evaluates expressions based on the inputs received
function updateCalculatedControls(control, instanceID, sourceType, sourceValue, isInit, expressionID, editRowOnly, loopContextID)
{
	/*explanation of inputs:
	control - control from definition, normally sent in when value has changed
	instanceID - for a specific view instance on a form
	soureType/sourceValue - for all the non-control related updates that can be fired off
	isInit - specified in certain cases to indicate that it is the first initialize, which determines certain refreshing further on
	expressionID - when a specific expression will be evaluated
	editRowOnly - when an expression needs to be evaluated, but only controls in the editable row should be refreshed (add new row on editable list, resetting default control values - Helper.js)
	*/

	//#region
	var mainKey = null
	var lookupType = "";

	var controlID = null;
	var instanceKey = "";

	if (checkExists(instanceID))
	{
		instanceKey = instanceID;
	}

	if (checkExists(control))
	{
		lookupType = "control";
		controlID = control.getAttribute("ID");
		mainKey = controlID;
	}
	else if (checkExists(sourceType) && checkExists(sourceValue))
	{
		lookupType = "source";
		mainKey = sourceType + "_" + sourceValue;
	}
	else if (checkExists(expressionID))
	{
		lookupType = "expression";
		mainKey = expressionID;
	}
	var keys = [lookupType, instanceKey, mainKey];
	if (lookupType != "")
	{
		var expressions = _runtimeUpdateCalculatedControlsHash.get(keys);
		if (!checkExists(expressions))
		{
			expressions = [];
			var expressionXP = "Controllers/Expressions/Expression";
			var firstXP = "";//xp string that will contain values where instanceID must be supplied (if applicable - no not's allowed)
			var secondXP = ""; //xp string that will contain values where instanceID can be supplied or not set (not's allowed) - only used when instances were set, this is to cater for more exclusions

			switch (lookupType)
			{
				case "control":
					firstXP += ".//Item[(@SourceType='Control' and @SourceID ='" + controlID + "')";
					secondXP += ".//Item[(@SourceType='Control' and @SourceID ='" + controlID + "')";
					var fieldID = control.getAttribute("FieldID");
					if (checkExists(fieldID))
					{
						firstXP += " or (@SourceType='ViewField' and @SourceID ='" + fieldID + "'" + returnInstanceXP(instanceID, true, true, false, true) + ")";
						secondXP += " or (@SourceType='ViewField' and @SourceID ='" + fieldID + "'" + returnInstanceXP(instanceID, true, true, false, false) + ")";
					}
					firstXP += "]";
					secondXP += "]";
					break;
				case "source":
					firstXP += ".//Item[@SourceType='" + sourceType + "' and translate(@SourceID, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') = '" + sourceValue.toLowerCase() + "'" + returnInstanceXP(instanceID, true, true, false, true) + "]";
					secondXP += ".//Item[@SourceType='" + sourceType + "' and translate(@SourceID, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') = '" + sourceValue.toLowerCase() + "'" + returnInstanceXP(instanceID, true, true, false, false) + "]";
					break;
				case "expression":
					firstXP += "@ID='" + expressionID + "'";
					secondXP += "@ID='" + expressionID + "'";
					break;
			}

			if (checkExists(instanceID))
			{
				expressionXP += "[(@InstanceID='" + instanceID + "' and (" + secondXP + ")) or (" + firstXP + ")]";
			}
			else
			{
				expressionXP += "[" + firstXP + "]";
			}

			expressions = $mn(viewControllerDefinition, expressionXP);
			_runtimeUpdateCalculatedControlsHash.add(keys, expressions);
		}

		var noExpressions = expressions.length;
		//expresssions influenced by the source control or field
		while (noExpressions--)
		{
			refreshAllRelatedExpressions(expressions[noExpressions].getAttribute("ID"), expressions[noExpressions], instanceID, isInit, editRowOnly, loopContextID);
		}
		fireExpressions();
	}
	//#endregion
}

//single function that gets called that does the logic to check whether the expressions can be fired off
function fireExpressions(withoutTimeout)
{
	//#region
	if (evaluatingExpressions.length > 0)
	{
		if (withoutTimeout)
		{
			expressionBusy = true;
			runAllRelatedExpressions();
		}
		else if (!expressionBusy)
		{
			//this causes initial batch changes to controls to complete before running expressions (result of execution or transfer - TFS 447094) 
			//results in better UI experience in most browsers in terms of responsiveness and less calls to the function, which ensures that the non recursive functions executes optimally
			//also added a name to the timeout function caller to better track in profiling
			expressionBusy = true;
			setTimeout(function expressionStackTimeout()
			{
				runAllRelatedExpressions();
			}, 0);
		}
	}
	//#endregion
}

//pushes related expression usages to the evaluatingExpressions stack (non-recursive)
function refreshAllRelatedExpressions(expressionID, expression, instanceID, isInit, editRowOnly, loopContextID)
{
	//#region
	if (!checkExistsNotEmpty(loopContextID))
	{
		loopContextID = _runtimeEmptyGuid;
	}

	var keys = [expressionID, instanceID, loopContextID];
	//the introduction of a hash ensures that no duplicate entries are added while we are not yet calculating results
	//the value is removed from the hash as soon as it is accessed from within runAllRelatedExpressions, so if subsequent calls need to re-evaluate the expression it will be able to do so
	if (!expressionHash.get(keys))
	{
		expressionHash.add(keys, true);
		var expressionObj = { ExpressionID: expressionID, Expression: expression, InstanceID: instanceID, isInit: isInit, editRowOnly: editRowOnly, loopContextID: loopContextID };
		evaluatingExpressions.push(expressionObj);
	}
	//#endregion
}

//refresh all related expression usages for controls and other expressions - changed to non-recursive and using evaluatingExpressions stack
function runAllRelatedExpressions()
{
	//#region
	var isCalculating = false; //using a local variable to track within the loop, since the global expressionBusy is now used for tracking outside this loop
	if (evaluatingExpressions.length > 0)
	{
		while (evaluatingExpressions.length > 0 && !isCalculating)
		{
			isCalculating = true;
			var expressionObj = evaluatingExpressions.shift();
			var expressionID = expressionObj.ExpressionID;
			var expression = expressionObj.Expression;
			var instanceID = expressionObj.InstanceID;
			var isInit = expressionObj.isInit;
			var editRowOnly = expressionObj.editRowOnly;
			var loopContextID = expressionObj.loopContextID;

			//remove the values from the hash
			var keys = [expressionID, instanceID, loopContextID];
			expressionHash.remove(keys);

			if (loopContextID === _runtimeEmptyGuid)
			{
				loopContextID = null;
			}

			//controls using the current expression to evaluate the value
			var controlsUsingXP = "Controllers/Controller" + returnInstanceXP(instanceID, false, false, true) + "/Controls/Control[@ExpressionID='" + expressionID + "'][Properties/Property/Name/text()='SetValue']";
			if (editRowOnly)
			{
				controlsUsingXP += "[(@ControlTemplate='edit')]";
			}

			var controlsUsingExpression = $mn(viewControllerDefinition, controlsUsingXP);
			var controlLength = controlsUsingExpression.length;
			while (controlLength--)
			{
				updateControlWithCalculatedResults(controlsUsingExpression[controlLength], expression, null, isInit, loopContextID);
			}

			updateCalculatedControls(null, instanceID, "Expression", expressionID, null, null, null, loopContextID);

			isCalculating = false;
		}

		if (simpleListCache.length > 0)
		{
			updateAllListDisplays(loopContextID);
		}
	}
	//reset the variable once all the current stack's evaluating expressions are done
	expressionBusy = false;
	//#endregion
}

/*
Updates the calculated controls when a field changes which is used in any calculation 
Used mostly in capture view & capture list when control's value + relevant field changes (Events.js)
*/
function updateCalculatedControlsForSource(instanceID, isInit, loopContextID)
{
	//#region
	var instanceXP = returnInstanceXP(instanceID, false, false, true);
	var findExpressionsXP = "Controllers/Expressions/Expression" + instanceXP;
	var expressions = $mn(viewControllerDefinition, findExpressionsXP);
	var expressionLength = expressions.length;
	if (expressionLength > 0)
	{
		while (expressionLength--)
		{
			var expressionID = expressions[expressionLength].getAttribute("ID");
			updateCalculatedControls(null, instanceID, null, null, isInit, expressionID, null, loopContextID);
		}
	}
	//#endregion
}

//update the specified with the calculated results from the expression - used to populate controls with results that were calculated
function updateControlWithCalculatedResults(currentControl, expression, expressionID, isInit, loopContextID)
{
	//#region
	var control = currentControl.getAttribute("ID"); //currentControl is now passed in as the node, control is derived from that, limits an unnecessary selectSingleNode
	if (verifyRecalculationBasedOnTemplate(currentControl, isInit) === true)
	{
		var sourceValue = returnCalculatedValue(control, expression, null, null, loopContextID);
		if (checkExists(sourceValue))
		{
			sourceValue = sourceValue.toString();
			var objInfo = new PopulateObject(null, sourceValue, control);
			executeControlFunction(currentControl, "SetValue", objInfo);
		}
	}
	//#endregion
}

/*
Returns the calculation result for a specific control
Used in list view population to calculate a column's value based on the fields used in the calculation (List.js & Populate.js)
*/
function returnCalculationResultForControl(control, counter, instanceID, loopContextID)
{
	//#region
	var controlExpressionID = control.getAttribute("ExpressionID");
	var expressionForControl = "Controllers/Expressions/Expression[@ID='" + controlExpressionID + "']" + returnInstanceXP(instanceID, false, false, true);
	var expression = $sn(viewControllerDefinition, expressionForControl);
	var returnValue = returnCalculatedValue(control.getAttribute("ID"), expression, counter, null, loopContextID);
	return returnValue;
	//#endregion
}

/*
Generic function to return the calculated value for list and/or capture views with or without counters
Validation will happen here to return expected value

1.  A value exists in the hashtable
2.  A summary type function is specified in the expression
3.  A result must be calculated

options: 
preserveType - optional. If true, it will keep the type, otherwise it will return the value as a string. Currently only applicable to the Date/Time/DateTime formats.
						 It defaults to false as that was the behaviour before this option was introduced
*/
function returnCalculatedValue(control, expression, counter, summaryType, loopContextID, options)
{
	//#region
	var preserveType = false;
	if (checkExists(options) && options.preserveType === true)
	{
		preserveType = true;
	}

	var result = null;
	if (summaryType)
	{
		var instanceID = expression.getAttribute("InstanceID");
		return evaluateSummaryFields(expression, summaryType, instanceID, loopContextID);
	}
	else  //value should be returned via returnItemValue
	{
		result = returnCalculatedItemValue(expression, counter, control, loopContextID);
	}
	if (runtimeIsDateType(result) && preserveType === false)
	{
		result = getDateInCorrectFormat(result);
	}
	return result;
	//#endregion
}

//do the necessary list aggregation functions on array values provided
function returnSummaryResults(calcArray, summaryFunction)
{
	//#region
	var result = null;
	var length = calcArray.length;
	switch (summaryFunction)
	{
		case "SUM":
			result = getSum(calcArray);
			break;
		case "AVG":
		case "AVERAGE":
			result = getAverage(calcArray);
			break;
		case "COUNT":
			result = length;
			break;
		case "MIN":
		case "MINIMUM":
			result = getMinimum(calcArray);
			break;
		case "MAX":
		case "MAXIMUM":
			result = getMaximum(calcArray);
			break;
	}

	if (checkExists(result))
	{
		if (runtimeIsDateType(result))
		{
			result = getDateInCorrectFormat(result);
		}
		else
		{
			var stringResult = result.toString();
			if (stringResult.length === 0)
			{
				result = 0;
			}
			else if (stringResult.isNumeric() || stringResult.isFloat())
			{
				result = stringResult.toFloat();
			}
		}
	}
	return result;
	//#endregion
}

/* Return calculated item value - for specific expression + counter */
function returnCalculatedItemValue(expression, counter, control, loopContextID)
{
	//#region
	var result = 0;
	var instanceID = expression.getAttribute("InstanceID");
	if (expression.tagName === "Expression")
	{
		var ExpressionNode = expression.firstChild;
		var expressionID = expression.getAttribute("ID");
		result = evaluateExpression(ExpressionNode, counter, control, false, instanceID, expressionID, loopContextID);
	}
	else if (expression.tagName !== "Item")
	{
		if (expression.childNodes.length > 0 && expression.childNodes[0].tagName === "Item")
		{
			expression = expression.childNodes[0];
		}
		else
		{
			if (expression.parentNode.tagName === "Item")
			{
				expression = expression.parentNode;
			}
		}
		result = returnItemValue(expression, counter, control, instanceID, loopContextID);
	}
	return result;
	//#endregion
}

/* 
Evaluates the summary values of fields
- used when the summary of a field is required, not the summary of other calculations
*/
function evaluateSummaryFields(expression, summaryType, instanceID, loopContextID)
{
	//#region
	var result = 0;
	var expressionItemType = expression.firstChild.getAttribute("SourceType");
	var controlTableXP;
	switch (expressionItemType)
	{
		case "Control":
			controlTableXP = "Controllers/Controller[Controls/Control[@ID='" + expression.firstChild.getAttribute("SourceID") + "']]";
			break;
		case "ViewField":
			controlTableXP = "Controllers/Controller" + returnInstanceXP(instanceID, false, false, true) + "[Fields/Field[@ID='" + expression.firstChild.getAttribute("SourceID") + "']]";
			break;
		case "Value":
			if (summaryType === "Count")
			{
				result = 1;
			}
			else
			{
				result = $sn(expression.firstChild, "SourceValue").text;
			}
			break;
	}

	//get the maintable of the view with the calculated control in and get the number of rows from it
	if (checkExists(controlTableXP) && controlTableXP.length > 0)
	{
		var viewDef = $sn(viewControllerDefinition, controlTableXP);
		if (checkExists(viewDef))
		{
			var mainTable = viewDef.getAttribute("MainTable");
			var viewType = viewDef.getAttribute("TypeView");
			var tableRows = SFRGrid.execute({ id: mainTable, fn: "fetch", params: ["rows"] });
			var maxCounter = checkExists(tableRows) ? tableRows.length : 0;
			if (expressionItemType === "Control")
			{
				var control = _runtimeControllerFindObject({ controlID: expression.firstChild.getAttribute("SourceID") })
				var fieldID = control.getAttribute("FieldID");
				var expressionID = control.getAttribute("ExpressionID");
				if (checkExists(fieldID))
				{
					expression.firstChild.setAttribute("SourceType", "ViewField");
					expression.firstChild.setAttribute("SourceID", fieldID);
				}
				else if (checkExists(expressionID))
				{
					expression.firstChild.setAttribute("SourceType", "Expression");
					expression.firstChild.setAttribute("SourceID", expressionID);
				}
			}
			//get the maxcounter from the view
			var c = maxCounter;

			if (viewType.toLowerCase() === "list")
			{
				if (c > 0)
				{
					var calcArray = [];
					while (c--)
					{
						var counter = jQuery(jQuery(tableRows[c]).children("td")[0]).metadata().counter; //value is the currentCounter
						if (checkExists(counter))
						{
							var innerResult = returnCalculatedValue(null, expression, counter, null, loopContextID, { preserveType: true });
							if (checkExists(innerResult))
							{
								calcArray.push(innerResult);
							}
						}
					}
					result = returnSummaryResults(calcArray, summaryType.toUpperCase());
				}
			}
		}
	}

	return result;
	//#endregion
}

//update controls on the view using summary functions
function updateControlsUsingSummaries(instanceID, loopContextID)
{
	//#region
	//list expressions can be contained on different levels, not just only on the first level as we assumed previously
	var itemInstanceXP = (checkExists(instanceID)) ? "//Item[@SourceInstanceID='" + instanceID + "']" : "";
	var expressionXP = "Controllers/Expressions/Expression[";
	expressionXP += "((.//ListSum" + itemInstanceXP + ") or (.//ListCount" + itemInstanceXP + ") or (.//ListAverage" + itemInstanceXP + ") or (.//ListMinimum" + itemInstanceXP + ") or (.//ListMaximum" + itemInstanceXP + "))";
	if (checkExists(instanceID))
	{
		expressionXP += " or (" + returnInstanceXP(instanceID, false, false, false, true);
		expressionXP += " and ((.//ListSum) or (.//ListCount) or (.//ListAverage) or (.//ListMinimum) or (.//ListMaximum))";
		expressionXP += ")";
	}
	expressionXP += "]";
	var Expressions = $mn(viewControllerDefinition, expressionXP);
	var noExpressions = Expressions.length;
	//expresssions influenced by the source control or field
	while (noExpressions--)
	{
		refreshAllRelatedExpressions(Expressions[noExpressions].getAttribute("ID"), Expressions[noExpressions], instanceID, null, null, loopContextID);
	}
	fireExpressions();
	//#endregion
}

//verify if recalculation can take place based on list and editable list attributes
function verifyRecalculationBasedOnTemplate(control, isInit)
{
	//#region
	var returnValue = true;
	var controlTemplate = control.getAttribute("ControlTemplate");
	var mainTable = control.parentNode.parentNode.getAttribute("MainTable");
	if (checkExists(controlTemplate) && checkExists(mainTable) && (controlTemplate === "display" || controlTemplate === "edit"))
	{
		var view = document.getElementById(mainTable);
		if (checkExists(view))
		{
			var editable = view.getAttribute("editable");
			switch (controlTemplate)
			{
				case "display":
					returnValue = false;
					var maxCounter = view.getAttribute("maxcounter");
					if (checkExists(maxCounter))
					{
						if (!checkExists(editable) || editable === "false")
						{
							simpleListCache.push(mainTable);
						}
						else
						{
							editableListCache.push(mainTable);
						}
					}
					break;
				case "edit":
					if ((!checkExists(editable) || editable === "false") && !isInit)
					{
						returnValue = false;
					}
					break;
			}
		}
	}
	return returnValue;
	//#endregion
}
