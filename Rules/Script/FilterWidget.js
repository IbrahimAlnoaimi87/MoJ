
//it gets its targetXml data from the specified plugin in the utils item xml format.
//it then displays the xml and saves a result.
function FilterWidget()
{
}
var FilterWidgetProtoType =
{
	_isRuntime: false,

	analyzerService: null,

	initialize: function (parentElement)
	{
		this._isRuntime = SourceCode.Forms.Layout.isRuntime();
		this._parentElement = parentElement;

		if (this._isRuntime === false)
		{
			this.analyzerService = SourceCode.Forms.Services.AnalyzerResourcesService();
		}

		if (this.targetXml)
		{
			this._transformXml();
			var returnItems = this.targetXml.selectNodes("Items/Item[@ItemType='MethodReturnedProperty']");

			if (returnItems.length > 0)
			{
				this._populateToolbar();
				this._buildUI();
			}
			else if (this.wizard && this.wizardStep)
			{
				this.wizard.wizard("hide", "step", this.wizardStep);
			}
		}
	},

	_buildUI: function ()
	{
		var _this = this;
		var data = {};

		var options =
		{
			url: applicationRoot + "Rules/Filter.aspx",
			type: 'GET',
			cache: false,
			data: data,
			dataType: "text",
			async: false,
			success: function (responseText, textStatus, XMLHttpRequest)
			{
				_this._buildUIAjaxSuccess.call(_this, responseText, textStatus, XMLHttpRequest);
			}
		};
		jQuery.ajax(options);
	},

	_buildUIAjaxSuccess: function (responseText, textStatus, XMLHttpRequest)
	{
		var _this = this;
		var response = responseText;

		this._parentElement.append(response);

		this._parentElement.find(".pane-container").panecontainer();
		this._parentElement.find(".panel").panel();

		var gridBehaviour = { rowselect: this._rowSelected.bind(this) };
		var grid = this._parentElement.find(".grid").grid(gridBehaviour);

		grid.on("change", ".operator", function ()
		{
			_this._operatorDropDownChange($(this));
		});

		this._populateDropDowns();
		window.setTimeout(function () { grid.grid("synccolumns"); }, 100);

		this.initCallBack();
	},

	updated: function ()
	{
		this._parentElement.find(".grid").grid("syncWidths");
	},

	dispose: function ()
	{
		this._parentElement.remove();
	},

	_transformXml: function ()
	{
		var transformer = new XslTransform();
		transformer.importStylesheet(applicationRoot + "Rules/XSLT/FilterOrder.xslt");
		if ($chk(this.ResultName))
		{
			transformer.addParameter("ResultName", this.ResultName);
		}

		if (this.Settings.subformID)
		{
			transformer.addParameter("SubFormID", this.Settings.subformID);
		}

		this.targetXml = parseXML(transformer.transformToText(this.targetXml));
	},

	_populateDropDowns: function ()
	{
		var returnItems = this.targetXml.selectNodes("Items/Item[@ItemType='MethodReturnedProperty']");
		//if there are no return properties then the method is not a list method and filter and order doesn't apply
		if (returnItems.length === 0)
		{
			if (this.wizard && this.wizardStep)
				this.wizard.wizard("hide", "step", this.wizardStep);

			return;
		}
		var items = this.targetXml.selectNodes("Items/Item[@ItemType='ViewField']");

		this.usesFields = true;
		//if there are no fields use the return properties
		if (items.length === 0)
		{
			this.usesFields = false;
			items = returnItems;
		}

		var dropdown = this._parentElement.find(".filterTemplateFieldDropDown");
		dropdown.empty();

		for (var i = 0; i < items.length; i++)
		{
			var nameNode = items[i].selectSingleNode("Name");
			var displayNameNode = items[i].selectSingleNode("DisplayName");

			var val = (items[i].getAttribute("Guid")) ? items[i].getAttribute("Guid") : nameNode.text;
			var text = displayNameNode.text;
			var toolTip = items[i].selectSingleNode("ToolTip").text;
			var icon = items[i].getAttribute("Icon");
			var option = $('<option></option>').val(val).html(text.htmlEncode()).addClass(icon).attr("title", toolTip);
			dropdown.append(option);

			var sourceType = items[i].getAttribute("ItemType");
			if (sourceType && sourceType.toLowerCase() === "methodreturnedproperty")
			{
				sourceType = "ObjectProperty";
			}
			option.data("SourceType", sourceType);

			option.data("SourceID", val);
			option.data("ObjectGuid", items[i].getAttribute("ContextGuid"));
			option.data("SubFormID", items[i].getAttribute("SubFormID"));
			option.data("InstanceID", items[i].getAttribute("InstanceID"));
			option.data("Name", checkExists(nameNode) ? nameNode.text : "");
			option.data("DisplayName", displayNameNode.text);

			var datatype = "text";
			var subType = items[i].getAttribute("SubType");
			if (subType)
			{
				switch (subType.toLowerCase())
				{
					case "autonumber":
					case "number":
					case "decimal":
						datatype = "number";
						break;
					case "datetime":
						datatype = "datetime";
						break;
					case "yesno":
					case "boolean":
						datatype = "boolean";
						break;
					case "guid":
					case "autoguid":
						datatype = "guid";
						break;
				}
			}

			option.data("DataType", datatype);
		}
	},

	_setSimpleToolbar: function (parentElement)
	{
		var _this = this;
		//find and remove the old toolbar
		var tb = parentElement.closest(".wrapper.target-context-canvas").find(".toolbar");
		if (tb.length > 0)
		{
			tb.parent().remove();
		}
		//create a new one 
		tb = jQuery(SourceCode.Forms.Controls.Toolbar.html());
		tb.toolbar();
		tb.toolbar("add", "button", { id: "addButton_FilterWidget", icon: "add", text: Resources.CommonActions.AddText, description: Resources.Filtering.AddFilterText, disabled: false });
		tb.toolbar("add", "button", { id: "clearButton_FilterWidget", icon: "delete", text: Resources.CommonActions.RemoveText, description: Resources.Filtering.RemoveFilterText, disabled: true });
		tb.toolbar("add", "button", { id: "clearAllButton_FilterWidget", icon: "delete-all", text: Resources.CommonActions.RemoveAllText, description: Resources.Filtering.RemoveAllFilterText, disabled: true });
		tb.toolbar("add", "button", { id: "advancedButton_FilterWidget", icon: "advanced-filter", text: Resources.CommonActions.AdvancedText, description: Resources.Filtering.AdvancedFilterText, disabled: false });

		tb.find('.toolbar-button').each(function (i) {

			switch ($(this).attr('id')) {
				case 'addButton_FilterWidget':
					$(this).find('.button-text').before('<svg width="16" height="16"><use xlink:href="#svg-icon-add" /></svg>');
					break;
				case 'clearButton_FilterWidget':
					$(this).find('.button-text').before('<svg width="16" height="16"><use xlink:href="#svg-icon-delete" /></svg>');
					break;
				case 'clearAllButton_FilterWidget':
					$(this).find('.button-text').before('<svg width="16" height="16"><use xlink:href="#svg-icon-delete-all" /></svg>');
					break;
				case 'advancedButton_FilterWidget':
					$(this).find('.button-text').before('<svg width="16" height="16"><use xlink:href="#svg-icon-advanced-filter" /></svg>');
					break;
			}

			$(this).addClass('style-aware');

		});

		var toolbarWrapper = jQuery("<div class=\"toolbars single\"></div>");

		toolbarWrapper.append(tb);
		parentElement.closest(".pane-container").children(".pane:first-child").append(toolbarWrapper);

		//attach events
		var toolbarItems = tb.toolbar("fetch", "buttons");
		jQuery(toolbarItems[0]).on("click", _this._addFilterRow.bind(_this));
		jQuery(toolbarItems[1]).on("click", _this._removeFilterRow.bind(_this));
		jQuery(toolbarItems[2]).on("click", _this._removeAllFilterRows.bind(_this));
		jQuery(toolbarItems[3]).on("click", _this._advancedNewFilterClick.bind(_this));
	},

	_setAdvancedToolbar: function (parentElement)
	{
		var _this = this;
		//find and remove the old toolbar
		var tb = parentElement.closest(".wrapper.target-context-canvas").find(".toolbar");
		if (tb.length > 0)
		{
			tb.parent().remove();
		}
		//create a new one 
		tb = jQuery(SourceCode.Forms.Controls.Toolbar.html());
		tb.toolbar();
		tb.toolbar("add", "button", { id: "editButton_FilterWidget", icon: "edit", text: Resources.CommonActions.EditText, description: Resources.CommonActions.EditText, disabled: false });
		tb.toolbar("add", "button", { id: "removeButton_FilterWidget", icon: "remove", text: Resources.CommonActions.RemoveText, description: Resources.CommonActions.RemoveText, disabled: false });
		//tb.toolbar("add", "button", { id: "basicButton_FilterWidget", icon: "filter", text: Resources.CommonActions.BasicText, description: Resources.CommonActions.BasicText, disabled: false });

		tb.find('.toolbar-button').each(function (i) {

			switch ($(this).attr('id')) {
				case 'editButton_FilterWidget':
					$(this).find('.button-text').before('<svg width="16" height="16"><use xlink:href="#svg-icon-edit" /></svg>');
					break;
				case 'removeButton_FilterWidget':
					$(this).find('.button-text').before('<svg width="16" height="16"><use xlink:href="#svg-icon-delete" /></svg>');
					break;
			}

			$(this).addClass('style-aware');

		});

		var toolbarWrapper = jQuery("<div class=\"toolbars single\"></div>");

		toolbarWrapper.append(tb);
		parentElement.closest(".pane-container").children(".pane:first-child").append(toolbarWrapper);

		//attach events
		var toolbarItems = tb.toolbar("fetch", "buttons");
		jQuery(toolbarItems[0]).on("click", _this._editFilterRow.bind(_this));
		jQuery(toolbarItems[1]).on("click", _this._changeToBasic.bind(_this));
	},

	_populateToolbar: function ()
	{
		this._setSimpleToolbar(this._parentElement);
	},

	initCallBack: function ()
	{
		//This method should be overrided by the configuration wizard (at runtime)
	},

	setConfigurationXml: function (configurationXml, targetContextContainer)
	{
		if (configurationXml)
		{
			var savedXmlDoc = parseXML(configurationXml);
			var savedMapping = savedXmlDoc.selectSingleNode("/Mappings/Mapping/Filter");
			if (savedMapping)
			{
				var isSimpleAttr = savedMapping.getAttribute("isSimple");

				if (isSimpleAttr && isSimpleAttr === "True")
				{
					var grid = this._parentElement.find(".grid").grid();
					var parentNode = savedMapping;
					if (savedMapping.selectSingleNode("And"))
					{
						parentNode = savedMapping.selectSingleNode("And");
					}
					var nodes = parentNode.selectNodes("./*");
					var findFieldGuid = "Items/Item[(FieldObject='{0}' or @FieldObject='{0}' or (ObjectGuid='{1}' and Name='{2}')) and @ItemType='ViewField']/@Guid";
					var findFieldName = "Items/Item[@ItemType='ViewField' and @Guid='{0}']/Name";
					var findMethodReturnedProperty = "Items/Item[@ItemType='MethodReturnedProperty'][Name='{0}']";

					for (var i = 0; i < nodes.length; i++)
					{
						var operator = nodes[i].nodeName;
						var childNodes = nodes[i].selectNodes("./*");
						var field = "";
						var value = "";
						var sourceType = "";
						var item = null;

						this._populateDropDowns();

						for (var j = 0; j < childNodes.length; j++)
						{
							item = childNodes[j];
							sourceType = item.getAttribute("SourceType");
							if (sourceType === "Value")
							{
								value = [];

								var dObj;

								//Handle multiple values
								var sourceValue = item.selectSingleNode("SourceValue");
								if (checkExists(sourceValue))
								{
									var sources = sourceValue.selectNodes("Item");
									for (var s = 0; s < sources.length; s++)
									{
										dObj = this._fromSourceValue(sources[s], targetContextContainer);
										if (checkExists(dObj))
										{
											value.push(dObj);
										}
									}
								}
								else
								{
									dObj = this._fromSourceValue(item, targetContextContainer);
									if (checkExists(dObj))
									{
										value.push(dObj);
									}
								}
							}
							else
							{
								field = item.getAttribute("SourceID");

								if (this._isRuntime === false && (item.getAttribute("Invalid") === "true" || SourceCode.Forms.DependencyHelper.hasValidationStatusError(item)))
								{
									var validationStatus = item.getAttribute("ValidationStatus");
									var fieldDropdown = this._parentElement.find(".filterTemplateFieldDropDown");

									//Add the missing field to the dropdown:
									var validationMessages = item.getAttribute("ValidationMessages");
									var val = (item.getAttribute("SourceID")) ? item.getAttribute("SourceID") : item.getAttribute("SourceName");
									val += "_Invalid";
									field += "_Invalid";

									var displayName = SourceCode.Forms.Designers.Common.getItemDisplayName(item);

									var tooltip = "";

									if (checkExists(validationMessages))
									{
										var resourceSvc = SourceCode.Forms.Services.AnalyzerResourcesService();
										tooltip = resourceSvc.getValidationMessages(validationMessages).join("\n");
									}

									var option = $('<option></option>').val(val).html(displayName.htmlEncode()).addClass("error").attr("title", tooltip);
									option.data("ValidationStatus", validationStatus);
									option.data("ValidationMessages", validationMessages);
									option.data("tooltip", tooltip);
									fieldDropdown.append(option);

									//Remove invalid field or fields when dropdown is changed from an invalid field to a valid one
									fieldDropdown.on("change", this.updateDropDownFields.bind(this));
								} 
								else
								{
									if (sourceType === "ObjectProperty" && this.usesFields)
									{
										//convert to field
										var fieldObject = item.getAttribute("Name");

										if (!checkExistsNotEmpty(fieldObject))
										{
											// If the analyzer has remove the attribute, lookup the appropriate return property and determine the SMO GUID
											var methodReturnProperty = this.targetXml.selectSingleNode(findMethodReturnedProperty.format(field));

											if (checkExists(methodReturnProperty))
											{
												fieldObject = methodReturnProperty.getAttribute("ContextGuid") + "_" + field;
											}
										}
										
										if (checkExistsNotEmpty(fieldObject))
										{
											var parts = fieldObject.split('_');
											var first = parts[0];
											parts.shift();
											var end = parts.join("_");

											field = this.targetXml.selectSingleNode(findFieldGuid.format(fieldObject, first, end)).text;
										}
									}
									else if (sourceType === "ViewField" && !this.usesFields)
									{
										//convert to return property
										field = this.targetXml.selectSingleNode(findFieldName.format(field)).text;
									}
								}
							}
						}

						var dropdown = this._parentElement.find(".filterTemplateFieldDropDown");

						//Before we add a new row to the grid we need to first remove the filterTemplateFieldDropDown.
						//This is because the grid will make a clone of the template to create a new instance row.
						//We do not want the instance row to have filterTemplateFieldDropDown class
						//so we can differentiate an instance drop down or a template dropdown.
						dropdown.removeClass("filterTemplateFieldDropDown");

						grid.grid("add", "edit-template", [field, operator, value]);

						dropdown.addClass("filterTemplateFieldDropDown");

						this._operatorDropDownChange(grid.find("#operatorDropDown"));
					}

					if (nodes.length > 0)
					{
						$("#clearAllButton_FilterWidget").removeClass("disabled");
					}

					//hack for chrome and ie
					if (SourceCode.Forms.Browser.webkit || SourceCode.Forms.Browser.msie)
					{
						setTimeout(
						function ()
						{
							this._parentElement.find(".grid").grid("synccolumns");
							if (SourceCode.Forms.Browser.msie)
							{
								this._parentElement.find(".grid").hide();
								setTimeout(
									function ()
									{
										this._parentElement.find(".grid").show();
									}.bind(this), 0);
							}
						}.bind(this), 0);
					}
					//end hack for chrome and ie
				}
				else
				{
					this.previewContainer = $("#advancedFilterPreview");
					$("#simpleFilterGrid").hide();
					this.previewContainer.show();
					this._setAdvancedToolbar(this._parentElement);
					this.conditions = "<Conditions>{0}</Conditions>".format(savedMapping.childNodes[0].xml);
					this.previewContainer.html(this._translateConditionsToFriendlyText());
				}
			}
		}
	},

	updateDropDownFields: function (ev)
	{
		var currentDropDown = $(ev.currentTarget);
		var selectedField = currentDropDown.children(".selected");

		if (!selectedField.hasClass("error"))
		{
			var fieldsInError = currentDropDown.children(".error");

			for (var i = 0; i < fieldsInError.length; i++)
			{
				$(fieldsInError[i]).remove();
			}
		}

		//Refresh dropdown after invalid field is removed
		currentDropDown.dropdown("refresh");
	},

	getConfigurationXML: function ()
	{
		var configurationXML = "<Mappings><Mapping Type=\"{0}\" ActionPropertyCollection=\"Properties\">{1}</Mapping></Mappings>";
		var mappingXml = "";
		if ($("#simpleFilterGrid").css("display") !== "none")
		{
			mappingXml = this._getSimpleMappingXml("Filter");
		}
		else
		{
			var firstChild = parseXML(this.conditions).firstChild.firstChild;
			if (firstChild)
				mappingXml = "<Filter>{0}</Filter>".format(firstChild.xml);
		}
		if (checkExists(SourceCode) &&
			checkExists(SourceCode.Forms) &&
			checkExists(SourceCode.Forms.Designers) &&
			checkExists(SourceCode.Forms.Designers.Rule) &&
			checkExists(SourceCode.Forms.Designers.Rule.EventHelper) &&
			checkExists(SourceCode.Forms.Designers.Rule.EventHelper.checkIfControlFilterIsValid) &&
			mappingXml !== "")
		{
			var mappingsXml = parseXML(mappingXml);
			var validationResult = mappingsXml.selectNodes("//Item[not(@SourceType)]").length === 0;
			if (validationResult === true && checkExists(this.Settings.viewControlID))
			{
				validationResult = SourceCode.Forms.Designers.Rule.EventHelper.checkIfControlFilterIsValid(mappingsXml.documentElement, this.Settings.viewControlID);
			}
			if (validationResult)
			{
				validationResult = mappingsXml.selectNodes(".//Item" + SourceCode.Forms.Designers.Common.getXPathValidationStatusCondition()).length === 0;
			}
			if (validationResult === false)
			{
				popupManager.showError(Resources.Filtering.InvalidFilter, Resources.Filtering.InvalidFilter);
				return false;
			}
		}

		configurationXML = configurationXML.format(this.ResultName, mappingXml);

		return configurationXML;
	},

	_getSimpleMappingXml: function (outerNodeName)
	{
		var mappingXml = "";
		var grid = this._parentElement.find(".grid").grid();
		var gridRows = grid.grid('fetch', 'rows');

		var rowLength = gridRows.length;

		if (rowLength === 0)
			mappingXml = "";
		else if (rowLength > 1)
			mappingXml = "<{0} isSimple=\"True\"><And>{1}</And></{0}>";
		else
			mappingXml = "<{0} isSimple=\"True\">{1}</{0}>";
		mappingXml = mappingXml.format(outerNodeName, "{0}");

		var filterRowsXML = "";
		for (var i = 0; i < rowLength; i++)
		{
			var currentRow = $(gridRows[i]);
			var fieldOption = currentRow.find(".input-control.field option:selected");

			var itemXML = "<Item";
			if (checkExistsNotEmpty(fieldOption.data("SourceType")))
			{
				itemXML += " SourceType='{0}'".format(fieldOption.data("SourceType"));
			}
			if (checkExistsNotEmpty(fieldOption.data("SourceID")))
			{
				itemXML += " SourceID='{0}'".format(fieldOption.data("SourceID").xmlEncode());
			}
			if (checkExistsNotEmpty(fieldOption.data("DataType")))
			{
				itemXML += " DataType='{0}'".format(fieldOption.data("DataType"));
			}
			if (checkExistsNotEmpty(fieldOption.data("ObjectGuid")))
			{
				itemXML += " Name='{0}_{1}'".format(fieldOption.data("ObjectGuid"), fieldOption.data("SourceID").xmlEncode());
			}
			if (checkExistsNotEmpty(fieldOption.data("SubFormID")))
			{
				itemXML += " SourceSubFormID='{0}'".format(fieldOption.data("SubFormID"));
			}
			if (checkExistsNotEmpty(fieldOption.data("InstanceID")))
			{
				itemXML += " SourceInstanceID='{0}'".format(fieldOption.data("InstanceID"));
			}
			if (checkExistsNotEmpty(fieldOption.data("Name")))
			{
				itemXML += " SourceName='{0}'".format(fieldOption.data("Name").xmlEncode());
			}
			if (checkExistsNotEmpty(fieldOption.data("DisplayName")))
			{
				itemXML += " SourceDisplayName='{0}'".format(fieldOption.data("DisplayName").xmlEncode());
			}
			if (checkExistsNotEmpty(fieldOption.data("ValidationStatus")))
			{
				itemXML += " ValidationStatus='{0}'".format(fieldOption.data("ValidationStatus"));
				if (checkExistsNotEmpty(fieldOption.data("ValidationMessages")))
				{
					itemXML += " ValidationMessages='{0}'".format(fieldOption.data("ValidationMessages"));
				}
			}
			if (checkExistsNotEmpty(fieldOption.text()))
			{
				itemXML += ">{0}</Item>".format(fieldOption.text().xmlEncode());
			}
			else
			{
				itemXML += "></Item>";
			}

			var operator = currentRow.find(".input-control.operator").val();

			var valueObj = currentRow.find(".input-control.value").tokenbox("value");
			var tokenValue = "<Item SourceType=\"Value\">{0}</Item>".format(this._toSourceValue(valueObj));
			filterRowsXML += "<{0}>{1}{2}</{0}>".format(operator, itemXML, tokenValue);
		}
		return mappingXml.format(filterRowsXML);
	},

	_convertSimpleXml: function (mappingXml)
	{
		if (checkExists(mappingXml) && mappingXml.length > 0)
		{
			var mappingDoc = $xml(mappingXml);
			var entry = mappingDoc.firstChild;

			if (checkExists(entry))
			{
				entry = entry.firstChild;

				while (entry.childNodes.length > 2)
				{
					var newentry = entry.insertBefore(mappingDoc.createElement(entry.tagName), entry.childNodes[1]);
					while (entry.childNodes.length > 2)
					{
						if (checkExists(newentry.firstChild))
						{
							newentry.insertBefore(entry.lastChild, newentry.lastChild);
						}
						else
						{
							newentry.appendChild(entry.lastChild);
						}
					}
					entry = newentry;
				}
			}

			mappingXml = mappingDoc.xml;
		}

		return mappingXml;
	},

	_editFilterRow: function ()
	{
		this._openAdvancedFilterPopup();
	},

	_addFilterRow: function ()
	{
		var _this = this;
		var grid = this._parentElement.find(".grid");
		grid.grid("add", "edit-template");
		$("#clearAllButton_FilterWidget").removeClass("disabled");
	},

	_rowSelected: function (selectedRow)
	{
		$("#clearButton_FilterWidget").removeClass("disabled");
		$("#clearAllButton_FilterWidget").removeClass("disabled");
	},

	_removeFilterRow: function ()
	{
		this._parentElement.find(".grid").grid('remove', 'selected-rows');
		$("#clearButton_FilterWidget").addClass("disabled");
		var gridRows = this._parentElement.find(".grid").grid('fetch', 'rows');
		if (gridRows.length === 0)
		{
			$("#clearAllButton_FilterWidget").addClass("disabled");
		}
	},

	_removeAllFilterRows: function ()
	{
		this._parentElement.find(".grid").grid("clear");
		$("#clearButton_FilterWidget").addClass("disabled");
		$("#clearAllButton_FilterWidget").addClass("disabled");
	},

	_changeToAdvanced: function (display)
	{
		this.previewContainer = $("#advancedFilterPreview");
		this.previewContainer[0].innerHTML = display.htmlEncode();
		$("#simpleFilterGrid").hide();
		this.previewContainer.show();
		this._setAdvancedToolbar(this._parentElement);
	},

	_changeToBasic: function ()
	{
		this.previewContainer = $("#advancedFilterPreview");
		this.previewContainer[0].innerHTML = "";
		this.previewContainer.hide();
		$("#simpleFilterGrid").show().grid("synccolumns");
		this._setSimpleToolbar(this._parentElement);
	},

	_operatorDropDownChange: function (control)
	{
		for (var c = 0, l = control.length; c < l; c++)
		{
			var value = $(control[c]).val();
			var tokenbox = $(control[c]).closest("tr").find(".input-control.value");
			if (value === "IsBlank" || value === "IsNotBlank")
			{
				tokenbox.tokenbox("clear");
				tokenbox.tokenbox("disable");
			}
			else
			{
				tokenbox.tokenbox("enable");
			}
		}
	},

	//Migrated FilterConfig methods
	_generateFilter: function ()
	{
		return this._getSimpleMappingXml("Conditions");
	},

	_advancedNewFilterClick: function ()
	{
		//if this was swapped else use passed through xml
		this.previewContainer = $("#advancedFilterPreview");
		var conditionsXml = this._generateFilter();

		if (conditionsXml && conditionsXml !== "")
		{
			this.conditions = (conditionsXml.xml) ? conditionsXml.xml : conditionsXml;
			this.previewContainer[0].innerHTML = this._translateConditionsToFriendlyText();
		}
		else
		{
			this.previewContainer[0].innerHTML = "";
			this.conditions = null;
		}
		this._openAdvancedFilterPopup();
	},

	_translateConditionsToFriendlyText: function ()
	{
		var result = "";
		var xmldoc = $xml(this.conditions);
		var firstChild = xmldoc.firstChild.firstChild;
		if (firstChild)
		{
			result = this._evaluateConditionNode(firstChild, true);
		}
		return result;
	},

	_evaluateConditionNode: function (currentNode, ignoreGrouping)
	{
		var result = "";
		if (currentNode.tagName === "Item")
		{
			if (currentNode.getAttribute("SourceType") === "Value")
			{
				if (currentNode.selectSingleNode("SourceValue/Item") === null)
				{
					result += $sn(currentNode, 'SourceValue').text.htmlEncode();
				}
				else
				{
					var itemNodes = currentNode.selectNodes("SourceValue/Item");

					for (var i = 0; i < itemNodes.length; i++)
					{
						result += this._constructItemXml(itemNodes[i]);
					}
				}
			}
			else
			{
				result += this._constructItemXml(currentNode);
			}
		}
		else if (currentNode.tagName === "Bracket")
		{
			result += " (";
			result += this._evaluateConditionNode(currentNode.firstChild, true);
			result += ")";
		}
		else if (currentNode.childNodes.length > 0)
		{
			if (!ignoreGrouping)
			{
				result += "(";
			}
			result += this._evaluateConditionNode(currentNode.firstChild, true);
			result += " " + currentNode.tagName;
			if (currentNode.childNodes.length > 1)
			{
				result += " " + this._evaluateConditionNode(currentNode.lastChild, true);
			}
			if (!ignoreGrouping)
			{
				result += ")";
			}
		}
		return result;
	},

	//helper function to construct item xml - reusable between simple and nested situations
	_constructItemXml: function(item)
	{
		var result = "";
		if (!checkExists(item))
		{
			return result;
		}
		var sourceType = item.getAttribute("SourceType");
		if (sourceType === "Value")
		{
			result += item.text.htmlEncode();
		}
		else if (sourceType === "ViewParameter" || sourceType === "FormParameter")
		{
			result += item.getAttribute("SourceID").htmlEncode();
		}
		else
		{
			if (item.getAttribute("SourceDisplayName") !== null)
			{
				result += item.getAttribute("SourceDisplayName").htmlEncode();
			}
			else if (item.getAttribute("DisplayName") !== null)
			{
				result += item.getAttribute("DisplayName").htmlEncode();
			}
			else if (item.getAttribute("SourceName") !== null)
			{
				result += item.getAttribute("SourceName").htmlEncode();
			}
			else if (item.getAttribute("Name") !== null)
			{
				result += item.getAttribute("Name").htmlEncode();
			}
		}
		return result;
	},

	_onAdvancedFilterPopupResize: function ()
	{
		this.configWidget.container.find(".pane-container:visible").panecontainer("refresh");
	},

	_openAdvancedFilterPopup: function ()
	{
		//instantiate widget objects and send through the data
		var configWidget = new FilterConfigurationWidget();
		configWidget.onWidgetCompleted = this._onWidgetCompleted.bind(this);
		configWidget.value = this.conditions;
		configWidget["container"] = "";
		configWidget["openPopup"] = true;
		configWidget["PopupMaximizable"] = true;
		configWidget["PopupOnMaximize"] = this._onAdvancedFilterPopupResize.bind(this);
		configWidget["PopupOnRestore"] = this._onAdvancedFilterPopupResize.bind(this);
		configWidget["PopupHeading"] = Resources.Filtering.FilterWidgetPopupHeading;
		configWidget["ContextHeading"] = Resources.Filtering.FilterWidgetContextHeading;
		configWidget["TargetHeading"] = Resources.Filtering.FilterWidgetTargetHeading;
		configWidget["TargetWidget"] = "ConditionWidget";
		configWidget["TargetWidgetMethod"] = "initialize";
        configWidget["TargetWidgetOptions"] = '{ "allowMultipleItems": true }';
		configWidget["HelpID"] = this.Settings.HelpID ? this.Settings.HelpID : "7054";
		configWidget.contextsXml = this.contextsXml;

		var settingsContextsArray = [];

		var SettingsObj = {};
		SettingsObj["ResultName"] = "Filter";
		SettingsObj["Contexts"] = settingsContextsArray;

		configWidget["Settings"] = SettingsObj;
		configWidget["value"] = this._convertSimpleXml(configWidget["value"]); // converting the flat xml structure to that of an advanced filter
		configWidget.initialize();
		this.configWidget = configWidget;
		this.configWidget.parentWidget = this;
	},

	_onWidgetCompleted: function (widget, error)
	{
		var display = widget.display;
		var value = widget.value;
		var data = widget.data;

		if (!display)
		{
			display = value.display;
			data = value.data;
			value = value.value;
		}

		var valueXml = $xml(value);
		var firstChild = valueXml.firstChild;
		var resultContainsExpression = (firstChild) ? firstChild.firstChild : null;

		if (resultContainsExpression)
		{
			this._changeToAdvanced(display);
			this.conditions = value;
		}
		else
		{
			this._removeAllFilterRows();
			this._changeToBasic();
			this.conditions = null;
		}
	},

	_toSourceValue: function (valobj)
	{
		var result = "<SourceValue>";

		$.each(valobj, function (k, v)
		{
			if (v.type === "value")
			{
				result += "<Item SourceType=\"Value\"><![CDATA[" + v.data + "]]></Item>";
			}
			else
			{
				result += "<Item";
				if (v.data.SourceType) result += " SourceType=\"" + v.data.SourceType + "\"";
				else if (v.data.ItemType)
				{
					var sourceType = v.data.ItemType;
					if (sourceType && sourceType.toLowerCase() === "methodreturnedproperty")
					{
						sourceType = "ObjectProperty";
					}

					result += " SourceType=\"" + sourceType + "\"";
				}

				if (v.data.DataType) result += " DataType=\"" + v.data.DataType + "\"";
				else if (v.data.SubType)
				{
					var datatype = "text";
					switch (v.data.SubType.toLowerCase())
					{
						case "autonumber":
						case "number":
						case "decimal":
							datatype = "number";
							break;
						case "datetime":
							datatype = "datetime";
							break;
						case "yesno":
						case "boolean":
							datatype = "boolean";
							break;
						case "guid":
						case "autoguid":
							datatype = "guid";
							break;
					}

					result += " DataType=\"" + datatype + "\"";
				}

				var sourceID = null;
				if (sourceType === "ViewParameter" || sourceType === "FormParameter")
				{
					sourceID = v.data.Name;
				}
				else if (v.data.SourceID)
				{
					sourceID = v.data.SourceID;
				}
				else if (v.data.Guid)
				{
					sourceID = v.data.Guid;
				}
				else if (v.data.Name)
				{
					sourceID = v.data.Name;
				}

				if (checkExists(sourceID))
				{
					result += " SourceID=\"{0}\"".format(sourceID.xmlEncode());
				}

				if (checkExists(v.data.Name))
				{
					result += " SourceName=\"" + v.data.Name + "\"";
				}

				if (checkExists(v.data.DisplayName))
				{
					result += " SourceDisplayName=\"" + v.data.DisplayName + "\"";
				}

				var instanceID = null;
				var subFormID = null;
				var subFormInstanceID = null;


				if (checkExistsNotEmpty(v.data.SourceInstanceID))
				{
					instanceID = v.data.SourceInstanceID;
				}
				else if (checkExistsNotEmpty(v.data.InstanceID))
				{
					instanceID = v.data.InstanceID;
				}

				if (checkExistsNotEmpty(v.data.SourceSubFormID))
				{
					subFormID = v.data.SourceSubFormID;
				}
				else if (checkExistsNotEmpty(v.data.SubFormID))
				{
					subFormID = v.data.SubFormID;
				}

				if (checkExistsNotEmpty(v.data.SourceSubFormInstanceID))
				{
					subFormInstanceID = v.data.SourceSubFormInstanceID;
				}
				else if (checkExistsNotEmpty(v.data.SubFormInstanceID))
				{
					subFormInstanceID = v.data.SubFormInstanceID;
				}

				if (checkExistsNotEmpty(subFormID) && checkExistsNotEmpty(instanceID))
				{
					result += " SourceInstanceID=\"" + instanceID + "\"";
					result += " SourceSubFormID=\"" + subFormID + "\"";
				}
				else if (checkExistsNotEmpty(subFormID) && checkExistsNotEmpty(subFormInstanceID))
				{
					//The context tree uses SubFormInstanceID and basic filter does not use SubFormInstanceID yet thus we need to convert SubFormInstanceID to InstanceID when saving the data
					result += " SourceInstanceID=\"" + subFormInstanceID + "\"";
					result += " SourceSubFormID=\"" + subFormID + "\"";
				}
				else if (checkExistsNotEmpty(subFormID))
				{
					result += " SourceSubFormID=\"" + subFormID + "\"";
				}
				else if (checkExistsNotEmpty(instanceID))
				{
					result += " SourceInstanceID=\"" + instanceID + "\"";
				}

				if (v.data.ItemType === "ControlProperty" || v.data.ItemType === "ControlField")
				{
					result += " SourcePath=\"" + v.data.SourcePath + "\"";
				}

				if (checkExistsNotEmpty(v.data.ValidationStatus))
				{
					result += " ValidationStatus=\"{0}\"".format(v.data.ValidationStatus);
					if (checkExistsNotEmpty(v.data.ValidationMessages))
					{
						result += " ValidationMessages=\"{0}\"".format(v.data.ValidationMessages);
					}
				}

				result += ">";
				if (v.data.DisplayName) result += v.data.DisplayName.xmlEncode();

				result += "</Item>";
			}
		});

		result += "</SourceValue>";

		return result;
	},

	_fromSourceValue: function (contextItem, targetContextContainer)
	{
		var tbval = null;
		var _this = this;
		if (!$chk(contextItem))
		{
			return;
		}
		if (contextItem.getAttribute("SourceType") === "Value")
		{
			tbval = { type: "value", data: contextItem.firstChild.nodeValue, text: contextItem.firstChild.nodeValue };
		}
		else
		{
			var dataobj = { type: "context", data: {} };

			var draggingNode = null;
			var itemType = contextItem.getAttribute("SourceType");
			var contextId = contextItem.getAttribute("SourceID");

			//check for upgrade path for incorrect configurations and update them
			if ((itemType === "ViewParameter" || itemType === "FormParameter") && (!checkExistsNotEmpty(contextId) || contextId.isValidGuid()))
			{
				contextId = contextItem.getAttribute("Name");
				if (!checkExistsNotEmpty(contextId))
				{
					contextId = contextItem.text;
				}
			}

			draggingNode = targetContextContainer.targetContextCanvas("getDraggingNode", { id: contextId });
			$.each(contextItem.attributes, function (i, attr)
			{
				dataobj.data[attr.name] = attr.value;
			});

			if (!checkExistsNotEmpty(dataobj.data.DisplayName))
			{
				if (checkExistsNotEmpty(contextItem.text))
				{
					dataobj.data.DisplayName = contextItem.text;
				}
				else
				{
					if (!_this._isRuntime)
					{
						dataobj.data.DisplayName = SourceCode.Forms.Designers.Common.getItemDisplayName(contextItem);
					}
					else
					{
						dataobj.data.DisplayName = getNodeAttribute("SourceDisplayName", contextItem, null, checkExistsNotEmpty);
						if (dataobj.data.DisplayName === null)
						{
							dataobj.data.DisplayName = getNodeAttribute("SourceName", contextItem, null, checkExistsNotEmpty);
						}

						if (dataobj.data.DisplayName === null)
						{
							dataobj.data.DisplayName = Resources.ObjectNames.ItemSingular;
						}
					}
				}
			}
			dataobj.text = dataobj.data.DisplayName;

			if (!checkExists(draggingNode) && (itemType === "ControlProperty" || itemType === "ControlField"))
			{
				var instanceID = contextItem.getAttribute("InstanceID");
				var subformID = contextItem.getAttribute("SubFormID");
				var sourceID = contextItem.getAttribute("SourceID");
				var sourcePath = contextItem.getAttribute("SourcePath");
				var contextID = contextItem.getAttribute("Guid");

				if (checkExists(instanceID) && instanceID === "00000000-0000-0000-0000-000000000000")
				{
					instanceID = null;
				}

				if (checkExists(subformID) && subformID === "00000000-0000-0000-0000-000000000000")
				{
					subformID = null;
				}

				var parentMetadata =
				{
					id: sourcePath,
					SubFormID: subformID,
					InstanceID: instanceID
				};

				if (checkExists(parentMetadata.SubFormID) && checkExists(parentMetadata.InstanceID))
				{
					//The context tree uses SubFormInstanceID and basic filter does not use SubFormInstanceID yet 
					//thus we need to convert InstanceID to SubFormInstanceID when searching for a dragging node from the context tree
					parentMetadata.SubFormInstanceID = parentMetadata.InstanceID;
					parentMetadata.InstanceID = null;
				}

				var childMetadata =
				{
					id: contextID,
					SourceID: sourceID,
					SourcePath: sourcePath,
					SubFormID: subformID,
					InstanceID: instanceID
				};

				if (checkExists(childMetadata.SubFormID) && checkExists(childMetadata.InstanceID))
				{
					//The context tree uses SubFormInstanceID and basic filter does not use SubFormInstanceID yet 
					//thus we need to convert InstanceID to SubFormInstanceID when searching for a dragging node from the context tree
					childMetadata.SubFormInstanceID = childMetadata.InstanceID;
					childMetadata.InstanceID = null;
				}


				draggingNode = targetContextContainer.targetContextCanvas("getPartialDraggingNode", parentMetadata, childMetadata);

				if (checkExists(draggingNode))
				{
					dataobj.text = draggingNode.text;
					dataobj.data = draggingNode.data;
				}
			}

			if (checkExists(draggingNode))
			{
				var itemIcon = "", itemText = contextItem.text;

				if (checkExists(draggingNode.icon))
					itemIcon = draggingNode.icon;
				if (checkExists(draggingNode.display))
					itemText = draggingNode.display;

				dataobj.data["icon"] = itemIcon;
				dataobj.text = itemText;
				dataobj.data.DisplayName = itemText;

				dataobj.data.SourceSubFormID = draggingNode.SubFormID;
				dataobj.data.SourceSubFormInstanceID = draggingNode.SubFormInstanceID;
				dataobj.data.SourceInstanceID = draggingNode.InstanceID;
			}
			else
			{
				if (_this._isRuntime === false)
				{
					dataobj.data["icon"] = "error";
					dataobj.tooltip = Resources.ExpressionBuilder.UnresolvedObjectText.format(_this.analyzerService.getReferenceType(itemType));
				}
				else
				{
					// Hide unresolved tokens in Runtime mode.
					dataobj = null;
				}
			}

			if (_this._isRuntime === false && (contextItem.getAttribute("Invalid") === "true" || SourceCode.Forms.DependencyHelper.hasValidationStatusError(contextItem)))
			{
				var status = contextItem.getAttribute("ValidationStatus");
				//Status used for token styling, need to get main validationstatus in case of multiples
				dataobj.status = SourceCode.Forms.DependencyHelper.getMainValidationStatus(status);

				var validationMessages = contextItem.getAttribute("ValidationMessages");
				if (checkExists(validationMessages))
				{
					dataobj.data["ValidationMessages"] = validationMessages;
					dataobj.tooltip = _this.analyzerService.getValidationMessages(validationMessages).join("\n");

					//Expecting only one validation message for an itemNode
					var msgObj = _this.analyzerService.parseValidationMessage(validationMessages)[0];

					dataobj.data["icon"] = SourceCode.Forms.Designers.Common.getItemTypeIcon(itemType, msgObj.subType) + " error";
				}
				else
				{
					dataobj.data["icon"] = SourceCode.Forms.Designers.Common.getItemTypeIcon(itemType, "") + " error";
				}

				dataobj.data["ValidationStatus"] = status;
			}
			
			if (checkExists(dataobj))
			{
				tbval = dataobj;
			}
		}
		
		return tbval;
	}
};

jQuery.extend(FilterWidget.prototype, FilterWidgetProtoType);

function FilterConfigurationWidget()
{
}

var FilterConfigurationWidgetProtoType =
 {
	onWidgetCompleted: function (widget)
	{
		var display = widget.display;
		var value = widget.value;
		var data = widget.data;

		var parentWidget = widget.parentWidget;
		parentWidget.previewContainer[0].innerHTML = display;
		parentWidget.conditions = $xml(value);
	}
 };
jQuery.extend(FilterConfigurationWidget.prototype, ConfigurationWidget.prototype, FilterConfigurationWidgetProtoType);
