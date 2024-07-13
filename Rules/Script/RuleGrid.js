if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};

SourceCode.Forms.RuleGrid = new function ()
{
	this.ruleListType = "RuleGrid";
	//getSelectedID
	this.getSelectedID = function (pRuleGrid)
	{
		if (pRuleGrid.length > 0)
		{
			if (checkExists(pRuleGrid.grid('fetch', 'selected-rows', 'values')[0]))
			{
				return pRuleGrid.grid('fetch', 'selected-rows', 'values')[0][0];
			}
		}
	}

	//refresh
	this.refresh = function (pRuleGrid, pDefinitionXml, pOptions, searchText)
	{
		var _controlID, _stateID, _icon, _viewID, _instanceID;
		var _contextNodeName;

		if (checkExists(pOptions))
		{
			if (pOptions.controlID !== undefined) _controlID = pOptions.controlID;
			if (pOptions.stateID !== undefined) _stateID = pOptions.stateID;
			if (pOptions.viewID !== undefined) _viewID = pOptions.viewID;
			if (pOptions.instanceID !== undefined) _instanceID = pOptions.instanceID;
		}

		var _xPath = "Events/Event[@Type='User']";
		var _contextNode = pDefinitionXml.documentElement.selectSingleNode("/*/*/*");

		_contextNodeName = _contextNode.nodeName;

		if (_contextNodeName === 'Form')
		{
			if (_stateID !== undefined)
			{
				_xPath = "States/State[@ID='" + _stateID + "']/" + _xPath;
			}
			else
			{
				_xPath = "States/State[@IsBase='True']/" + _xPath;
			}

			if (!!_instanceID && _instanceID !== null && _instanceID !== "")
			{
				_xPath += "[@InstanceID='" + _instanceID + "']";
			}
			else if (!!_controlID && _controlID !== "")
			{
				_xPath += "[@SourceID='" + _controlID + "'][@SourceType='Control'][not(@SubFormID)]";
			}
		}
		else if (_controlID !== undefined)
		{
			_xPath += "[@SourceID='" + _controlID + "'][@SourceType='Control'][not(@SubFormID)]";
		}

		var _eventNodes = _contextNode.selectNodes(_xPath);
		var i = 0;

		pRuleGrid.grid('clear');

		var rows = [];

		while (i < _eventNodes.length)
		{
			var _eventNode = _eventNodes[i];
			var _locationIcon = this.getEventContext(_eventNode, _contextNodeName);
			var containsText = false;
			var _propertiesNode = _eventNode.selectSingleNode('Properties');
			var _eventId = _eventNode.getAttribute('ID');
			var dependencyObj = SourceCode.Forms.Designers.Common.getDependencyObjectForNode(_eventNode);

			if (!!_propertiesNode)
			{
				var _ruleNameValueNode = _propertiesNode.selectSingleNode('Property[Name="RuleFriendlyName"]/Value');

				if (!checkExistsNotEmpty(_ruleNameValueNode))
				{
					_ruleNameValueNode = _propertiesNode.selectSingleNode('Property[Name="RuleName"]/Value');
				}

				var _locationValueNode = _propertiesNode.selectSingleNode('Property[Name="Location"]/Value');

				if (_ruleNameValueNode === null || _locationValueNode === null)
				{
					i++;
					continue;
				}

				var _isReference = (_eventNode.getAttribute("IsReference") !== null && _eventNode.getAttribute("IsReference").toLowerCase() === "true") ? true : false;
				var _selectedEventIsEnabled = _eventNode.getAttribute("IsEnabled");
				var _isEnabled = 'inactive';

				_icon = _contextNodeName.toLowerCase() + "-event";

				var ruleIsInvalid = SourceCode.Forms.Designers.Common.Rules.checkRuleValid(_eventNode);

				if (ruleIsInvalid === true || dependencyObj.hasError)
				{
					_icon += "-error";
				}
				/* To be added if additional warning state icon is required
				else if (dependencyObj.hasWarning)
				{
					_icon += "-warning";
				}*/

				if (_selectedEventIsEnabled === "True" || !$chk(_selectedEventIsEnabled))
				{
					_isEnabled = '';
				}
				else
				{
					if (ruleIsInvalid === false)
					{
						_icon += ' disabled-rule';
					}
				}

				if (checkExistsNotEmpty(searchText))
				{
					if (_ruleNameValueNode.text.toLowerCase().contains(searchText.toLowerCase()))
					{
						containsText = true;
					}

					if (_locationValueNode.text.toLowerCase().contains(searchText.toLowerCase()) && containsText === false)
					{
						containsText = true;
					}

					if (containsText === false)
					{
						i++;
						continue;
					}
				}

				if (checkExists(dependencyObj.messages) && _icon.contains("error"))
				{
					rows.push([{
						value: _eventId
					}, {
						value: _ruleNameValueNode.text.escapeQuotes(),
						icon: _icon,
						display: _ruleNameValueNode.text,
						title: dependencyObj.messages,
						isLiteral: false
					}, {
						value: !!_locationValueNode && _locationValueNode.text.escapeQuotes() || '',
						icon: _locationIcon,
						display: _locationValueNode === null ? "" : _locationValueNode.text,
						title: SourceCode.Forms.Interfaces.AppStudio.formatTitleForSystemName(_contextNode.selectSingleNode("Name"), _contextNode.selectSingleNode("Description")),
						isLiteral: false
					}, {
						value: _isReference
					}]);
				}
				else
				{
					rows.push([{
						value: _eventId
					}, {
						value: _ruleNameValueNode.text.escapeQuotes(),
						icon: _icon,
						display: _ruleNameValueNode.text,
						isLiteral: false
					}, {
						value: !!_locationValueNode && _locationValueNode.text.escapeQuotes() || '',
						icon: _locationIcon,
						display: _locationValueNode === null ? "" : _locationValueNode.text,
						title: SourceCode.Forms.Interfaces.AppStudio.formatTitleForSystemName(_contextNode.selectSingleNode("Name"), _contextNode.selectSingleNode("Description")),
						isLiteral: false
					}, {
						value: _isReference
					}]);
				}

				if (checkExistsNotEmpty(searchText))
				{
					pRuleGrid.grid('fetch', 'last-row').highlightText(searchText);
				}
			}

			i++;
		}

		var sortedRows = sortArraysByObjectProperty({ data: rows, objectIndex: 1, property: "value", descending: true });

		pRuleGrid.grid('add', 'rows', sortedRows, false, null, _isEnabled);
		pRuleGrid.grid('synccolumns');
		pRuleGrid.grid('deselect');
	}

	this.getEventContext = function()
	{
		return SourceCode.Forms.RuleList.getEventContext.apply(this, arguments);
	};

	//removeItem
	this.removeItem = function (pRuleGrid, pDefinitionXml, eventNode, callback, forceRemove)
	{
		var _this = this;
		var ruleDefinitionID;
		var ruleName;
		
		if (!checkExists(eventNode))
		{
			eventNode = pDefinitionXml.documentElement.selectSingleNode("//Events/Event[@ID='{0}']".format(this.getSelectedID(pRuleGrid)));
		}

		if (checkExists(eventNode))
		{
			ruleDefinitionID = eventNode.getAttribute("DefinitionID");
			ruleName = getNodeValue("Properties/Property[Name='RuleFriendlyName']/Value", eventNode, "");

			//Events can have dependencies on other events (execute another event) or on extended subform rule objects.
			//SubForm/SubView dependencies should be handled in a different way (see User Story 650690)
			//If event has subform/subview dependencies:
			//Dependencies on subforms should be listed and user should be warned that they will be removed (no option for keep).
			//If there were any other dependencies (execute another rule), these dependencies should be kept and badged.
			//If event has no subform/subview dependencies:
			//Display notifier as usual and let user choose to keep or remove.

			var ruleData = 
			{
				definitionId: ruleDefinitionID,
				itemType: SourceCode.Forms.DependencyHelper.ReferenceType.Event,
				itemDisplayName: ruleName,
				callback: function (notifierContext)
				{
					_this.performItemRemoval(pRuleGrid, pDefinitionXml, eventNode, callback, notifierContext);
				}
			};

			if (forceRemove === true)
			{
				_this.performItemRemoval(pRuleGrid, pDefinitionXml, eventNode, callback);
			}
			else if (!SourceCode.Forms.Designers.hasEventDependencies(ruleData))
			{
				//No dependencies
				var options = {
					message: Resources.FormDesigner.RemoveRuleConfirmation,
					onAccept: function ()
					{
						popupManager.closeLast();
						_this.performItemRemoval(pRuleGrid, pDefinitionXml, eventNode, callback);
					},
					onCancel: function ()
					{
						popupManager.closeLast();
					}
				};
				popupManager.showConfirmation(options);
			}
		}
	},

	this.performItemRemoval = function (pRuleGrid, pDefinitionXml, eventNode, callback, notifierContext)
	{
		var _this = this;
		var gridOptions = [];

		SourceCode.Forms.Designers.Common.Rules.removeItemFromXml(eventNode, pDefinitionXml, pRuleGrid, notifierContext);

		//set the search to empty
		SourceCode.Forms.Designers.Common.Context.resetRulesSearch();

		_this.refresh(pRuleGrid, pDefinitionXml, gridOptions);
		if (typeof callback === "function")
		{
			callback();
		}
		SourceCode.Forms.Designers.Common.applyDesignerWizardStepBadging();
	};

	this.removeDependentEventItems = function (pDefinitionXml, _eventNode, subformGuidArray)
	{
		var subformOpenActions = _eventNode.selectNodes("Handlers/Handler/Actions/Action[((@Type='Open') or (@Type='Popup')) and (not(@IsReference) or (@IsReference!='True'))]");
		if (subformOpenActions.length > 0)
		{
			for (var a = 0; a < subformOpenActions.length; a++)
			{
				var subformAction = subformOpenActions[a];
				var subformGuid = subformAction.getAttribute("SubFormID");

				subformGuidArray.push(subformGuid);

				var newEventsNode = pDefinitionXml.selectNodes("//Event[@SubFormID='" + subformGuid + "']");
				for (var e = 0; e < newEventsNode.length; e++)
				{
					if (_eventNode.parentNode)// Remove Event
					{
						_eventNode.parentNode.removeChild(_eventNode);
					}

					var newEventNode = newEventsNode[e];
					this.removeDependentEventItems(pDefinitionXml, newEventNode, subformGuidArray);
				}
			}
		}
		if (_eventNode.parentNode)// Remove Event
		{
			_eventNode.parentNode.removeChild(_eventNode);
		}
	},

	this.removeDependentActions = function (pDefinitionXml, subformGuidArray)
	{
		for (var s = 0; s < subformGuidArray.length; s++)
		{
			var subformGuid = subformGuidArray[s];
			var actions = pDefinitionXml.selectNodes("//Action[@SubFormID='" + subformGuid + "']");

			for (var a = 0; a < actions.length; a++)
			{
				// remove action node
				var action = actions[a];
				var actionsNode = action.parentNode;

				while (actionsNode.tagName !== "Actions")
				{
					actionsNode = actionsNode.parentNode;
				}

				actionsNode.removeChild(action);
				// remove action node

				// remove actions node if there are no actions
				if (actionsNode.childNodes.length === 0)
				{
					var handlerNode = actionsNode.parentNode;

					while (handlerNode.tagName !== "Handler")
					{
						handlerNode = handlerNode.parentNode;
					}

					handlerNode.removeChild(actionsNode);

					// remove handler node if there is no actions
					if (handlerNode.selectNodes("Actions").length === 0)
					{
						var handlersNode = handlerNode.parentNode;

						while (handlersNode.tagName !== "Handlers")
						{
							handlersNode = handlersNode.parentNode;
						}

						handlersNode.removeChild(handlerNode);

						// remove handlers node if no handler was found
						if (handlersNode.selectNodes("Handler").length === 0)
						{
							var eventNode = handlersNode.parentNode;
							while (eventNode.tagName !== "Event")
							{
								eventNode = eventNode.parentNode;
							}

							// remove event node is no handlers exist
							var eventsNode = handlersNode.parentNode;
							while (eventsNode.tagName !== "Events")
							{
								eventsNode = eventsNode.parentNode;
							}

							eventsNode.removeChild(eventNode);
							// remove event node is no handlers exist
						}
					}
					// remove handler node if there is no actions
				}
				// remove actions node if there are no actions
			}
		}
	},

	this.setRuleState = function (pRuleGrid, pDefinitionXml, ruleState)
	{
		_eventNode = pDefinitionXml.documentElement.selectSingleNode(['//Events/Event[@ID="', '"]'].join(this.getSelectedID(pRuleGrid)));

		var eventGuidArray = SourceCode.Forms.Designers.Common.Rules.setEventItemStates(pDefinitionXml, _eventNode, ruleState);

		var rows = this.getRowsByRuleGuid(eventGuidArray, pRuleGrid);

		if (ruleState === "False")
		{
			pRuleGrid.grid('setRowsClass', rows, 'inactive');
		}
		else
		{
			pRuleGrid.grid('removeRowsClass', rows, 'inactive');
		}

		for (var r = 0; r < rows.length; r++)
		{
			var indexRow = rows[r];

			if (ruleState === "False")
			{
				indexRow.find("td:nth-child(2) div.grid-content-cell.icon").addClass("disabled-rule");
			} else
			{
				indexRow.find("td:nth-child(2) div.grid-content-cell.icon").removeClass("disabled-rule");
			}
		}
	},

	this.getRowsByRuleGuid = function (guidArray, pRuleGrid)
	{
		var rows = [];
		var gridRows = pRuleGrid.grid('fetch', 'rows');
		var gridRowsLength = gridRows.length;

		for (var g = 0; g < gridRowsLength; g++)
		{
			var gridRow = $(gridRows[g]);
			var ruleGuid = gridRow.find("td:nth-child(1)").metadata().value;

			if (guidArray.indexOf(ruleGuid) !== -1)
			{
				rows.push(gridRow);
			}
		}

		return rows;
	}
}
