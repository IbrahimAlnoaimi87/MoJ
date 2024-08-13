//this is the basic mapping widget
//it gets its targetXml data from the specified plugin in the utils item xml format.
//it then displays the xml and saves a result.
function OpenWorkItemMappingWidget()
{
}

var OpenWorkItemMappingWidgetProtoType =
{
	_buildUI: function (parentElement)
	{
		var element = jQuery("<div class='tree'></div>");
		parentElement.append(element);

		var targetHeadingText = Resources.RuleDesigner.MappingTargetHeading;
		if (this.TargetHeading) targetHeadingText = this.TargetHeading;

		element.panel({ header: targetHeadingText, fullsize: true, toolbars: 0, scrolling: true });

		var mainList = jQuery("<ul class='target-rule'></ul>");
		element.append(mainList);
		var root = this.targetXml.documentElement;
		var topItems, bottomItems;

		if (checkExistsNotEmpty(this.Settings.topPath))
			topItems = root.selectNodes(this.Settings.topPath);
		this.currentParentList = mainList;
		if (checkExistsNotEmpty(this.Settings.namePath))
		{
			var nameItem = root.selectSingleNode(this.Settings.namePath);
			if (checkExists(nameItem))
			{
				this.addReadOnlyNode(nameItem, this.Settings.nameDisplay);
			}
		}
		var topTypes = [];
		if (topItems)
		{
			for (var z = 0; z < topItems.length; z++)
			{
				var itemType = topItems[z].getAttribute("ItemType");
				if (!topTypes.contains(itemType))
				{
					topTypes[topTypes.length] = itemType;
				}
				this.addDropRow(topItems[z], true);
			}
		}

		var actionsListItem;
		if (this.dropElements.length > 0)
		{
			for (var j = 0; j < this.dropElements.length; j++)
			{
				var dropElementParent = this.dropElements[j].parent();
				if (dropElementParent.hasClass("workflow-actions"))
				{
					actionsListItem = dropElementParent;
					var tokenbox = this.dropElements[j].find("input");

					if (!tokenbox.isWidget("tokenbox")) tokenbox.tokenbox();
					tokenbox.tokenbox("setOption", "allowTextInput", false);
					tokenbox.tokenbox("setOption", "multiValue", false);
					tokenbox.tokenbox("setWatermark", ContextTree_Tree_DropItemMessageDragOnly);
					tokenbox.tokenbox("clear");
					this.actionsListIndex = j;
				}
			}

			this.addWorkflowStripLocationNode(actionsListItem);
			var list = this.addWFAfterSubmit(actionsListItem);
			this.addWFAfterSubmitShowMessage(list);
			this.addWFAfterSubmitCallRule(list);
			this.addWFAfterSubmitNavigateTo(list);
			this.addWFAllocateOption(mainList, true);

			mainList.find("li").last().addClass("dropLabelLast");
		}
		else
		{
			element.text(Resources.RuleDesigner.NoItemsToDisplayActivityNotFound);
			if (checkExists(this.wizard))
			{
				this.wizard.wizard("disable", "step", this.wizard.wizard("find", "step", "last").index());
			}
			else if (checkExists(this.basicTargetContextCanvas))
			{
				var dialog = this.basicTargetContextCanvas.closest(".popup");

				if (dialog.length > 0)
				{
					dialog.find(".popup-footer .button.help + .button").addClass("disabled").off("click");
				}
			}
		}

	},

	addReadOnlyNode: function (nameItem, nameDisplay)
	{
		var display = (nameDisplay) ? nameDisplay : "Name";
		var value = nameItem.selectSingleNode("Value").text;
		var icon = (nameItem.getAttribute("Icon")) ? nameItem.getAttribute("Icon") : "";

		//HACK icon for activity
		if (icon === "process-activities")
		{
			icon = "process-activity";
		}
		//End HACK icon for activity

		var line = jQuery("<li style='position:relative;' class=\"dropLabel " + icon + "\"><span style='display:inline-block;' title='" + display + "'>" + display + ":</span></li>");
		var tb = jQuery(SCTextbox.html({ value: value, readonly: true }));
		line.append(tb);
		tb.addClass("mappings-input");
		this.currentParentList.append(line);
		tb.textbox();
	},

	addWorkflowStripLocationNode: function (actionsListItem)
	{
		var display = (this.Settings.workflowStripLocationLabel) ? this.Settings.workflowStripLocationLabel : "Name";
		var value = "WorkflowStripLocation";
		var icon = "workflow-view";
		var line = jQuery("<li style='position:relative; ' class=\"dropLabel " + icon + "\"><span style=' display:inline-block; ' title='" + display.htmlEncode() + "'>" + display + ":</span></li>");
		var dropdownText = "";
		dropdownText += "<select class='WorkflowStripLocation'>";
		dropdownText += "	<option value='none' selected>" + this.Settings.noneResourceName + "</option>";
		dropdownText += "	<option value='top'>" + this.Settings.topResourceName + "</option>";
		dropdownText += "	<option value='bottom'>" + this.Settings.bottomResourceName + "</option>";
		dropdownText += "</select>";
		var dropdown = jQuery(dropdownText);
		line.append(dropdown);

		actionsListItem.before(line);

		dropdown.dropdown();
		dropdown.dropdown("fetch", "control").addClass("mappings-input");
		dropdown.on("change", this._onWorkflowStripLocationNodeChange.bind(this));
	},

	addWFAllocateOption: function (list, doAllocate)
	{
		var icon = "workflow-view";
		var line = jQuery("<li style='position:relative; ' class=\"dropLabel " + icon + "\"><span style=' display:inline-block; ' title='" + Resources.RuleDesigner.Allocate.htmlEncode() + "'>" + Resources.RuleDesigner.Allocate + ":</span><div class='mappings-input'></div></li>");
		var mappingInputDiv = line.find(">.mappings-input");
		var allocateRadioButtonTrue = $(SourceCode.Forms.Controls.Radiobutton.html({ id: "wfAllocateRb", value: "true", name: "wfAllocate", label: Resources.CommonLabels.YesLabelText, checked: doAllocate, readonly: "false" }));
		var allocateRadioButtonFalse = $(SourceCode.Forms.Controls.Radiobutton.html({ id: "wfDontAllocateRb", value: "false", name: "wfAllocate", label: Resources.CommonLabels.NoLabelText, checked: !doAllocate, readonly: "false" }));

		mappingInputDiv.append(allocateRadioButtonTrue);
		mappingInputDiv.append(allocateRadioButtonFalse);
		list.append(line);

		allocateRadioButtonTrue.find("input.input-control[type=radio]").radiobutton();
		allocateRadioButtonFalse.find("input.input-control[type=radio]").radiobutton();
	},

	addWFAfterSubmitCallRule: function (addWFAfterSubmitItem)
	{
		var display = (this.Settings.WFAfterSubmitEventIDCallRuleLabel) ? this.Settings.WFAfterSubmitEventIDCallRuleLabel : "Name";
		var value = "";
		var icon = ""; //"workflow-view-event";
		var line = jQuery("<li style='position:relative;' class=\"dropLabel " + icon + "\">" + SCRadiobutton.html({ name: "WFAfterSubmit", id: "CallRule", label: display, disabled: false, checked: true, description: display }) + "</li>");
		var dropdownText = "";

		var rulePlugIn = new RulePlugIn();
		var returnedXml = parseXML(rulePlugIn.getData());
		var items = returnedXml.selectNodes("/Items/Item");

		dropdownText += "<select class='WFAfterSubmitEventID'>";
		dropdownText += "	<option value='none' selected>" + this.Settings.noneResourceName + "</option>";
		for (var i = 0; i < items.length; i++)
		{
			var currentRuleItem = items[i];
			var id = currentRuleItem.selectSingleNode("Value").text;
			var displayName = currentRuleItem.selectSingleNode("Name").text;
			var dataItem = currentRuleItem.selectSingleNode("Data/Item/@InstanceID");
			var instanceID = dataItem !== null ? dataItem.text : "";

			dropdownText += "	<option value='" + id;

			if (checkExistsNotEmpty(instanceID))
			{
				dropdownText += "," + instanceID;
			}

			dropdownText += "'>" + displayName + "</option>";
		}
		dropdownText += "</select>";
		var dropdown = jQuery(dropdownText);
		line.append(dropdown);

		addWFAfterSubmitItem.append(line);
		dropdown.on("click", this._controlClickedOrChanged.bind(this));
		dropdown.on("change", this._controlClickedOrChanged.bind(this));

		dropdown.dropdown();
		dropdown.dropdown("fetch", "control").addClass("mappings-input");
		line.find("input.input-control[type=radio]").radiobutton().addClass("WFAfterSubmitCallRule");
	},

	addWFAfterSubmitNavigateTo: function (addWFAfterSubmitItem)
	{
		var display = (this.Settings.WFAfterSubmitEventIDNavigateToLabel) ? this.Settings.WFAfterSubmitEventIDNavigateToLabel : "Name";
		var value = "";
		var icon = ""; //"workflow-view-event";
		var line = jQuery("<li style='position:relative;' class=\"dropLabel " + icon + "\">" + SCRadiobutton.html({ name: "WFAfterSubmit", id: "NavigateTo", label: display, disabled: false, description: display }) + "</li>");

		var tb = jQuery(SCTextbox.html({ value: value }));
		line.append(tb);
		tb.addClass("mappings-input");
		tb.addClass("WFNavigateURL");
		tb.on("click", this._controlClickedOrChanged.bind(this));

		addWFAfterSubmitItem.append(line);
		tb.textbox();
		line.find("input.input-control[type=radio]").radiobutton().addClass("WFAfterSubmitNavigateTo");
	},

	addWFAfterSubmitShowMessage: function (addWFAfterSubmitItem)
	{
		var display = (this.Settings.WFAfterSubmitEventIDShowMessageLabel) ? this.Settings.WFAfterSubmitEventIDShowMessageLabel : "Name";
		var value = "";
		var icon = ""; //"workflow-view-event";
		var line = jQuery("<li style='position:relative;' class=\"dropLabel multi-line " + icon + "\">" + SCRadiobutton.html({ name: "WFAfterSubmit", id: "ShowMessage", label: display, disabled: false, description: display }) + "</li>");

		var tb = jQuery(SCTextbox.html({ value: value, rows: 3 }));
		line.append(tb);
		tb.addClass("mappings-input");
		tb.addClass("WFMessage");
		tb.on("click", this._controlClickedOrChanged.bind(this));

		addWFAfterSubmitItem.append(line);
		tb.textbox();
		line.find("input.input-control[type=radio]").radiobutton().addClass("WFAfterSubmitShowMessage");
	},

	addWFAfterSubmit: function (actionsListItem)
	{
		var display = (this.Settings.WFAfterSubmitEventIDLabel) ? this.Settings.WFAfterSubmitEventIDLabel : "Name";
		var value = "WFAfterSubmitEventID";
		var icon = "workflow-view-event";
		var heading = jQuery("<li class='addWFAfterSubmit open " + icon + "'><span title='" + display.htmlEncode() + "'>" + display + "</span></li>");
		actionsListItem.before(heading);
		var childList = jQuery("<ul class='target-rule target-rule-level-1'></ul>");
		heading.append(childList);
		return childList;
	},

	initCallBack: null,

	//reads and reverses the actions mapping
	_reverseMapping: function (configurationXml)
	{
		if (checkExists(configurationXml))
		{
			var mappings = configurationXml.selectNodes("/Mappings/Mapping[@ActionPropertyCollection='Results'][Item]");
			for (var m = 0; m < mappings.length; m++)
			{
				var contextItem = mappings[m].selectSingleNode("Item[@ContextType='context']");
				var targetItem = mappings[m].selectSingleNode("Item[@ContextType='target']");

				// Only reverse if both nodes can be found
				if (contextItem !== null && targetItem !== null)
				{
					contextItem.setAttribute("ContextType", "target");
					targetItem.setAttribute("ContextType", "context");
				}
			}
		}

	},

	setConfigurationXml: function (configurationXml, targetContextContainer)
	{
		//if this is loading a saved mapping screen    
		if (checkExists(configurationXml))
		{
			var savedXmlDoc = parseXML(configurationXml);

			//reads and removes the reversedmapping node
			this._reverseMapping(savedXmlDoc);

			//call base method
			BasicMappingWidget.prototype.setConfigurationXml.apply(this, [savedXmlDoc.xml, targetContextContainer, { adjustQueryObject: this.adjustQueryObject }]);

			var savedMappings = savedXmlDoc.selectNodes("/Mappings/Mapping[Item]");
			var hasValues = false;
			var radioItemFound = false;

			var tempWFAfterSubmitEventID = "";
			var tempWFAfterSubmitInstanceID = "";

			for (var m = 0; m < savedMappings.length; m++)
			{
				var valueItem = savedMappings[m].selectSingleNode("Item[@ContextType='value']");
				var targetItem = savedMappings[m].selectSingleNode("Item[@ContextType='target']");
				var value = null;
				var instanceID;

				if (checkExists(valueItem) && checkExists(targetItem))
				{
					value = valueItem.text;
					if (value !== null)
					{
						var targetName = targetItem.getAttribute("Name");
						if (targetName)
						{
							switch (targetName)
							{
								case "WorkflowStripLocation":
									this._parentElement.find(".WorkflowStripLocation").dropdown("select", value);
									break;
								case "WFAfterSubmitInstanceID":
									tempWFAfterSubmitInstanceID = value;
									break;
								case "WFAfterSubmitEventID":
									tempWFAfterSubmitEventID = value;
									break;
								case "WFNavigateURL":
									this._parentElement.find(".WFNavigateURL").textbox("setValue", value);
									this._parentElement.find(".WFAfterSubmitNavigateTo").radiobutton("check");
									break;
								case "WFMessage":
									this._parentElement.find(".WFMessage").textbox("setValue", value);
									this._parentElement.find(".WFAfterSubmitShowMessage").radiobutton("check");
									break;
								case "WorkflowAllocate":
									if (value.toUpperCase() === "FALSE")
									{
										$("#wfDontAllocateRb").radiobutton("check");
									}
									break;
							}
						}
					}
				}
			}

			if (tempWFAfterSubmitEventID !== "")
			{
				var tempCombinedValue = tempWFAfterSubmitEventID;

				if (tempWFAfterSubmitInstanceID !== "")
					tempCombinedValue += "," + tempWFAfterSubmitInstanceID;

				this._parentElement.find(".WFAfterSubmitEventID").dropdown("select", tempCombinedValue);
				this._parentElement.find(".WFAfterSubmitCallRule").radiobutton("check");
			}
		}
	},

	_addPropertyValue: function (configurationXML, itemName, value)
	{
		if (checkExistsNotEmpty(value))
		{
			value = value.toString();
		}
		else
		{
			value = "";
		}

		var mappingElement = configurationXML.createElement("Mapping");
		mappingElement.setAttribute("Type", this.ResultName);
		mappingElement.setAttribute("ActionPropertyCollection", "Properties");
		var valueElement = configurationXML.createElement("Item");
		valueElement.setAttribute("ContextType", "value");
		valueElement.appendChild(configurationXML.createTextNode(value));
		mappingElement.appendChild(valueElement);

		var targetElement = configurationXML.createElement("Item");
		targetElement.setAttribute("ContextType", "target");
		targetElement.setAttribute("Name", itemName);
		mappingElement.appendChild(targetElement);

		configurationXML.documentElement.appendChild(mappingElement);
	},

	_addDropDownValue: function (configurationXML, itemName, otherProperties)
	{
		var select = this._parentElement.find("." + itemName)[0];
		var value;
		var instanceID;

		var values = select.value.split(",");

		if (values[0] !== "none")
		{
			this._addPropertyValue(configurationXML, itemName, values[0]);
		}
		if (checkExists(otherProperties))
		{
			for (var i = 0; i < otherProperties.length && i < values.length - 1; i++)
			{
				this._addPropertyValue(configurationXML, otherProperties[i], values[i + 1]);
			}
		}
	},

	_addTexBoxValue: function (configurationXML, itemName)
	{
		var value = this._parentElement.find("." + itemName).textbox("getValue");
		this._addPropertyValue(configurationXML, itemName, value);
	},

	getConfigurationXML: function ()
	{
		//call base method
		var basicMappingWidgetXml = BasicMappingWidget.prototype.getConfigurationXML.apply(this, arguments);
		if (basicMappingWidgetXml === false)
		{
			return false;
		}
		else
		{
			var configurationXML = parseXML(basicMappingWidgetXml);
			this._reverseMapping(configurationXML);
			this._addDropDownValue(configurationXML, "WorkflowStripLocation");
			this._addPropertyValue(configurationXML, "WorkflowAllocate", $("#wfAllocateRb").is(":checked"));

			if (this._parentElement.find(".WFAfterSubmitNavigateTo").parent().find("input.input-control[type=radio]").is(':checked'))
				this._addTexBoxValue(configurationXML, "WFNavigateURL");

			if (this._parentElement.find(".WFAfterSubmitShowMessage").parent().find("input.input-control[type=radio]").is(':checked'))
				this._addTexBoxValue(configurationXML, "WFMessage");

			if (this._parentElement.find(".WFAfterSubmitCallRule").parent().find("input.input-control[type=radio]").is(':checked'))
			{
				this._addDropDownValue(configurationXML, "WFAfterSubmitEventID", ["WFAfterSubmitInstanceID"]);
			}

			return configurationXML.xml;
		}
	},

	_onWorkflowStripLocationNodeChange: function ()
	{
		var value = this._parentElement.find(".WorkflowStripLocation")[0].value;
		var tokenbox = this.dropElements[this.actionsListIndex].find("input").tokenbox();
		switch (value)
		{
			case "none":
				//enable
				tokenbox.tokenbox("enable");
				this.dropElements[this.actionsListIndex].parent().removeClass("disabled");
				//disable
				this._parentElement.find(".WFAfterSubmitEventID").dropdown("disable");
				this._parentElement.find(".WFNavigateURL").textbox("disable");
				this._parentElement.find(".WFMessage").textbox("disable");
				this._parentElement.find(".WFAfterSubmitCallRule").radiobutton("disable");
				this._parentElement.find(".WFAfterSubmitNavigateTo").radiobutton("disable");
				this._parentElement.find(".WFAfterSubmitShowMessage").radiobutton("disable");
				this._parentElement.find(".addWFAfterSubmit").addClass("disabled");

				//clear values
				this._parentElement.find(".WFAfterSubmitEventID").dropdown("select", "none");
				this._parentElement.find(".WFNavigateURL").textbox("setValue", "");
				this._parentElement.find(".WFMessage").textbox("setValue", "");


				break;
			case "top":
			case "bottom":
				//enable
				this._parentElement.find(".WFAfterSubmitEventID").dropdown("enable");
				this._parentElement.find(".WFNavigateURL").textbox("enable");
				this._parentElement.find(".WFMessage").textbox("enable");

				this._parentElement.find(".WFAfterSubmitNavigateTo").radiobutton("enable");
				this._parentElement.find(".WFAfterSubmitShowMessage").radiobutton("enable");
				//the last one enabled is checked by default
				this._parentElement.find(".WFAfterSubmitCallRule").radiobutton("enable");
				this._parentElement.find(".addWFAfterSubmit").removeClass("disabled");
				//disable

				tokenbox.tokenbox("clear");
				tokenbox.tokenbox("disable");
				this.dropElements[this.actionsListIndex].parent().addClass("disabled");
				//clear values
				break;
		}
	},

	_controlClickedOrChanged: function (e)
	{
		var changedControl = jQuery(e.target);
		changedControl.parent().find("input.input-control[type=radio]").radiobutton("check");
	}
};

jQuery.extend(OpenWorkItemMappingWidget.prototype, BasicMappingWidget.prototype, OpenWorkItemMappingWidgetProtoType);
