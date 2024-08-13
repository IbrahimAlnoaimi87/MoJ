function FormNavigateMappingWidget()
{

}

FormNavigateMappingWidget.prototype =
{
	mappingWidgetBase: null,

	initialize: function (contentElement)
	{
		this.container = contentElement;
		this.instanceid = String.generateGuid();
		this._stateTwisty = null;
		this._openInTwisty = null;
		this._baseURL = "";
		this._previewURL = null;
		this._wizard = null;
		this._transformXml();
		this._buildUI(contentElement);
		this.analyzerService = SourceCode.Forms.Services.AnalyzerResourcesService();
	},

	dispose: function ()
	{
		this.container.empty();
	},

	getConfigurationXML: function ()
	{
		//Build Configuration XML
		var MappingsXML = "<Mappings>";

		var stateTwistyValue = this._stateTwisty.twisty("value");
		var openInTwistyValue = this._openInTwisty.twisty("value");

		if ((stateTwistyValue.length === 1) && (stateTwistyValue[0].type === "value") && (checkExists(stateTwistyValue[0].value)))
		{
			var stateDropdownValues = $("#FormNavigateStateValues").val().split("|");
			var stateDropdownDisplays = $("#FormNavigateStateDisplays").val().split("|");

			if (stateDropdownValues.length > 1)
			{
				for (var j = 1; j < stateDropdownValues.length; j++)
				{
					if (stateTwistyValue[0].value === stateDropdownValues[j])
					{
						MappingsXML += this._getMapping("Parameters", "FormParameter", "_state", stateDropdownDisplays[j]);
					}
				}
			}
		}
		else
		{
			MappingsXML += this._getMapping("Parameters", "FormParameter", "_state", this._toSourceValueXML(stateTwistyValue));
		}

		var mappingWidgetXML = this.mappingWidgetBase.getConfigurationXML();
		if (mappingWidgetXML === false)
		{
			return false;
		}

		var mappingNodes = parseXML(mappingWidgetXML).selectNodes("Mappings/Mapping");
		for (var i = 0; i < mappingNodes.length; i++)
		{
			var mappingNode = mappingNodes[i];
			mappingNode.setAttribute("ActionPropertyCollection", "Parameters");
			MappingsXML += mappingNode.xml;
		}

		if ((openInTwistyValue.length === 1) && (openInTwistyValue[0].type === "value") && (checkExists(openInTwistyValue[0].value)))
		{
			MappingsXML += this._getMapping("Properties", "Value", "Target", openInTwistyValue[0].value);
		}
		else
		{
			MappingsXML += this._getMapping("Properties", "Value", "Target", this._toSourceValueXML(openInTwistyValue));
		}

		MappingsXML += "</Mappings>";
		
		return MappingsXML;
	},

	getDropListItem: function (item, isProperty)
	{
		var lineMetaData = {};
		var lineMetaDataLength = 0;
		for (var t = 0; t < item.attributes.length; t++)
		{
			lineMetaData[item.attributes[t].name] = item.attributes[t].value;
			lineMetaDataLength++;
		}

		for (var t = 0; t < item.childNodes.length; t++)
		{
			if (item.childNodes[t].nodeName !== "DisplayName")
			{
				lineMetaData[item.childNodes[t].nodeName] = item.childNodes[t].text;
				lineMetaDataLength++;
			}
		}
		//if there is no guid use the smartobject's parent's Guid
		if (!item.getAttribute("Guid"))
		{
			var parentSOItem = item.selectSingleNode("../../.");
			try
			{
				while (parentSOItem && typeof parentSOItem.getAttribute !== "undefined" && !(parentSOItem.getAttribute("ItemType") === "Object" || parentSOItem.getAttribute("ItemType") === "FieldContext"))
				{
					parentSOItem = parentSOItem.selectSingleNode("../../.");
				}
				if (parentSOItem && typeof parentSOItem.getAttribute !== "undefined" && parentSOItem.getAttribute("Guid"))
				{
					lineMetaData["soGuid"] = parentSOItem.getAttribute("Guid");
					lineMetaDataLength++;
				}
			}
			catch (exception) { }
		}
		var display = item.selectSingleNode("DisplayName").text;
		var icon = (item.getAttribute("Icon")) ? item.getAttribute("Icon") : "";
		//TODO: TD 0001
		var lineHtml = "<li style=\"position:relative;\" class=\"dropLabel " + ((isProperty) ? icon : "");

		if (lineMetaDataLength > 0)
		{
			lineHtml += "\" data-options=\"" + jQuery.toJSON(lineMetaData).htmlEncode();
		}

		lineHtml += "\">" + ((!isProperty) ? SCCheckbox.html({ label: display, icon: icon, disabled: false, description: display }) : "<span style=\"display:inline-block;\" title=\"" + display.htmlEncode() + "\">" + display.htmlEncode() + ((isProperty) ? ":" : "") + "</span>") + "</li>";

		var line = jQuery(lineHtml);

		line.find("input.input-control[type=checkbox]").checkbox();
		if (item.getAttribute("ItemType") === "MethodRequiredProperty" || (item.getAttribute("Required") && item.getAttribute("Required") === "true"))
			line.addClass("required");
		return line;
	},

	regexp: {
		rp: /<p>/gim, 	// paragraph start tags
		rpe: /<\/p>/gim, // paragraph end tags
		rd: /<div>/gim, 	// div start tags
		rde: /<\/div>/gim, // div end tags
		rb: /<br.*?>/gim, // br tags
		rls: /^[ \t]+/gm, // leading space & tabs
		rts: /[ \t]+$/gm, // trailing space & tabs
		rlsc: /^\s/, 	// leading space chars
		rtsc: /\s$/,		// trailing space chars
		zeroWidthSpace: /\u200B/g // match zero-width-space characters
	},

	setConfigurationXml: function (mappings, targetContextContainer)
	{
		if (checkExistsNotEmpty(mappings))
		{
			var mappingsDoc = parseXML(mappings);
			var mappingNodes = mappingsDoc.selectNodes("Mappings/Mapping[Item]");

			var mappingWidgetDoc = parseXML("<Mappings/>");
			var mappingsWidgetNode = mappingWidgetDoc.selectSingleNode("Mappings");

			var stateData = null;
			var targetData = null;

			for (var i = 0; i < mappingNodes.length; i++)
			{
				var mapping = mappingNodes[i];
				var target = mapping.selectSingleNode('Item[@ContextType="target"]');
				var targetName = target.getAttribute("Name");
				var actionPropertyCollection = mapping.getAttribute("ActionPropertyCollection");
				
				if ((targetName === "_state" && actionPropertyCollection === "Parameters") || (targetName === "Target" && actionPropertyCollection === "Properties"))
				{
					var value = mapping.selectSingleNode('Item[@ContextType="value"]');
					var contextItem = mapping.selectSingleNode('Item[@ContextType="context"]');
					var tbval = [];

					if (checkExists(contextItem))
					{
						tbval.push(this._contextItemTokenboxValue(contextItem, targetContextContainer));
					}
					else
					{
						var valueItems = value.selectNodes(".//Item");
						if (valueItems.length > 0)
						{
							for (var y = 0; y < valueItems.length; y++)
							{
								var valueItem = valueItems[y];
								if (valueItem.getAttribute("ContextType") === "value")
								{
									tbval.push(this._valueItemTokenboxValue(valueItem));
								}
								else
								{
									tbval.push(this._contextItemTokenboxValue(valueItem, targetContextContainer));
								}
							}
						}
						else
						{
							tbval.push(this._valueItemTokenboxValue(value));
						}
					}
				}
				else
				{
					if (actionPropertyCollection === "Parameters")
					{
						mappingsWidgetNode.appendChild(mapping.cloneNode(true));
					}
				}

				// Load built tokenbox value into applicable input control
				if (targetName === "_state" && mapping.getAttribute("ActionPropertyCollection") === "Parameters")
				{
					stateData = tbval;
				}
				else if (targetName === "Target" && mapping.getAttribute("ActionPropertyCollection") === "Properties")
				{
					targetData = tbval;
				}
			}

			// If the widget has been loaded, set the XML otherwise store it to be loaded later.
			if (checkExists(this.mappingWidgetBase))
			{
				this._loadState(stateData);
				this._loadTarget(targetData);
				this.mappingWidgetBase.setConfigurationXml(mappingWidgetDoc.xml, targetContextContainer);

				this._updatePreview();
			}
			else
			{
				this.configurationData =
				{
					targetContextContainer: targetContextContainer,
					mappingWidgetBaseTargetXML: mappingWidgetDoc.xml,
					stateData: stateData,
					targetData: targetData
				}
			}
		}
	},

	_buildUI: function (parentElement)
	{
		var self = this;

		$(self.container).load(applicationRoot + "Rules/FormNavigate.aspx?id=" + this.Settings.formID + " .partial-page-container", function ()
		{
			$(self.container).find(".pane-container").panecontainer();

			// Initialise radio buttons

			var options = {};
			options.subType = "drop";

			options.items = $("#FormNavigateStateDisplays").val() + "+" + $("#FormNavigateStateValues").val();
			options.dropOptions = {
				focus: self._onStateTargetTokenboxFocus.bind(self),
				keypress: self._onTokenboxKeypress.bind(self)
			};

			// Generate & instantiate the state dropdown list
			$("#FormNavigateStateFF").find(".form-field-element-wrapper").html("<div id='FormNavigateStateTwisty' class='mappings-input'></div>");
			self._stateTwisty = $("#FormNavigateStateTwisty").twisty(options);
			self._stateTwisty.on("blur", self.onStateTwistyBlur.bind(self));
			self._stateTwisty.on("change", self.onStateTwistyChange.bind(self));
			self._stateTwisty.find(".twisty-button").on("click", self.onStateTwistyButtonClick.bind(self));

			options = {};
			options.subType = "drop";

			options.items = Resources.CommonPhrases.CurrentWindow + "|" + Resources.CommonPhrases.NewWindowOrTab + "|" + Resources.CommonPhrases.ParentWindow + "+_self|_blank|_parent";

			// Generate & instantiate the state dropdown list
			$("#FormNavigateOpenInFF").find(".form-field-element-wrapper").html("<div id='FormNavigateOpenInTwisty' class='mappings-input'></div>");
			self._openInTwisty = $("#FormNavigateOpenInTwisty").twisty(options);

			// Generate mappings tree
			self.mappingWidgetBase = new SourceCode.Forms.Designers.Rule.MappingWidgetBase({ renderPanel: false });

			self.mappingWidgetBase.ResultName = self.ResultName;
			self.mappingWidgetBase.Settings = self.Settings;
			self.mappingWidgetBase.filterTypes = self.filterTypes;
			self.mappingWidgetBase.excludeTypes = self.excludeTypes;
			self.mappingWidgetBase.contextsXml = self.contextsXml;

			// We have already transformed the XML, prevent the widget from doing it again.
			self.mappingWidgetBase.initialize(jQuery(document.getElementById("FormNavigateMappingsTree")));
			self.mappingWidgetBase.targetXml = self.targetXml;
			self.mappingWidgetBase._buildUI();

			self.mappingWidgetBase.element.on("change.mappingwidgetbase", self._updatePreview.bind(self));

			// Getting the base URL
			self._previewURL = $(self.container).find(".preview-url");
			self._baseURL = self._previewURL.text();
			self._previewURL.on("click", function () { if ($(this).is(".dynamic")) return false; });

			// Altering display for wizard if applicable
			if ($(self.container).closest(".wizard").length > 0)
			{
				$(self.container).closest(".wizard-step-content").removeClass("docked").data("FormNavStep", true);
				self._wizard = $(self.container).closest(".wizard");
				self._wizard.on("wizardshow", self._onWizardShow.bind(self));
			}

			// Only set the configuration XML if it has already been set locally.
			if (checkExists(self.configurationData))
			{
				var configurationData = self.configurationData;

				self._loadState(configurationData.stateData);
				self._loadTarget(configurationData.targetData);
				self.mappingWidgetBase.setConfigurationXml(configurationData.mappingWidgetBaseTargetXML, configurationData.targetContextContainer);

				self._updatePreview();
			}
		});
	},

	_getMapping: function (coll, type, targetName, value)
	{
		if (checkExists(value) && value !== "")
			return this._createMapping(coll, type, targetName, value);
		else
			return "";
	},

	_getTokenboxValue: function (tokenbox)
	{
		var result = [], editor = tokenbox.tokenbox("geteditor");

		editor.contents().each(function (index, node)
		{
			this._handleTokenboxContents(node, result);
		}.bind(this));

		if (result.length > 0 && result[result.length - 1].type === "value" && result[result.length - 1].data === "<br />") result.pop();

		return result;
	},

	_handleTokenboxContents: function (node, result)
	{
		switch (node.nodeType)
		{
			case 1:
				// Element
				if ($(node).is(".entity"))
				{
					result.push({ type: "context", data: $(node).metadata(), text: $(node).text() });
				}
				else if ($(node).is("br"))
				{
					result.push({ type: "value", data: "<br/>", text: "<br/>" });
					$(node).contents().each(function (index, node)
					{
						this._handleTokenboxContents(node, result);
					}.bind(this));
				}
				else
				{
					$(node).contents().each(function (index, node)
					{
						this._handleTokenboxContents(node, result);
					}.bind(this));
				}
				break;
			case 3:
				// Text
				var text = node.nodeValue.replace(this.regexp.rlsc, " ").replace(this.regexp.rtsc, " ").replace(this.regexp.zeroWidthSpace, "");
				if (text !== "")
					result.push({ type: "value", data: text, text: text });
				break;
		}
	},

	_contextItemTokenboxValue: function (item, targetContextContainer)
	{
		var tokenboxValue = { type: "context", data: {} };

		// Initial tokenbox value
		$.each(item.attributes, function ()
		{
			// Populate the tokenbox value's data component with initial data (Filtering out selected data parts)
			if (["ContextType", "Invalid", "ValidationMessages"].indexOf(this.name) < 0 && this.value !== "00000000-0000-0000-0000-000000000000")
			{
				tokenboxValue.data[this.name] = this.value;
			}

			// Calculate the display text for the token
			if (this.name === "DisplayName")
			{
				tokenboxValue.text = this.value;
			}
			else if (this.name === "Name" && !checkExists(tokenboxValue.text))
			{
				tokenboxValue.text = this.value;
			}
				
		});

		// Mapping validation
		if (item.getAttribute("Invalid"))
		{
			tokenboxValue.data["icon"] = "error";

			var validationMessages = this.analyzerService.getValidationMessages(item.getAttribute("ValidationMessages"));
			tokenboxValue.tooltip = validationMessages.join("\n");

			if (!checkExists(tokenboxValue.text))
			{
				tokenboxValue.text = Resources.ExpressionBuilder.UnresolvedObjectText.format(this.analyzerService.getReferenceType(tokenboxValue.data.ItemType));
			}
		}
		else
		{
			// Populate with context data
			var draggingNode = null;

			// By getDraggingNode
			draggingNode = targetContextContainer.targetContextCanvas("getDraggingNode",
				{
					id: !!tokenboxValue.data["Guid"] ? tokenboxValue.data["Guid"] : tokenboxValue.data["Name"],
					SourceID: !!tokenboxValue.data["SourceID"] ? tokenboxValue.data["SourceID"] : null,
					SourcePath: !!tokenboxValue.data["SourcePath"] ? tokenboxValue.data["SourcePath"] : null,
					SubFormID: !!tokenboxValue.data["SubFormID"] ? tokenboxValue.data["SubFormID"] : null,
					InstanceID: !!tokenboxValue.data["InstanceID"] ? tokenboxValue.data["InstanceID"] : null
				});

			// By getContextNode
			if (!checkExists(draggingNode))
			{
				draggingNode = targetContextContainer.targetContextCanvas("getContextNode", { document: this.contextsXml, item: item });
			}

			// By getPartialDraggingNode (This section was added for the items that need to be partially loaded)
			if (!checkExists(draggingNode))
			{
				draggingNode = targetContextContainer.targetContextCanvas("getPartialDraggingNode",
					{
						id: !!tokenboxValue.data["SourcePath"] ? tokenboxValue.data["SourcePath"] : null,
						SubFormID: !!tokenboxValue.data["SubFormID"] ? tokenboxValue.data["SubFormID"] : null,
						InstanceID: !!tokenboxValue.data["InstanceID"] ? tokenboxValue.data["InstanceID"] : null
					},
					{
						id: !!tokenboxValue.data["Guid"] ? tokenboxValue.data["Guid"] : tokenboxValue.data["Name"],
						SourceID: !!tokenboxValue.data["SourceID"] ? tokenboxValue.data["SourceID"] : null,
						SourcePath: !!tokenboxValue.data["SourcePath"] ? tokenboxValue.data["SourcePath"] : null,
						SubFormID: !!tokenboxValue.data["SubFormID"] ? tokenboxValue.data["SubFormID"] : null,
						InstanceID: !!tokenboxValue.data["InstanceID"] ? tokenboxValue.data["InstanceID"] : null
					});
			}

			// Merge the data from the context object with that of the initial object
			if (checkExists(draggingNode))
			{
				tokenboxValue.data["icon"] = draggingNode.data["icon"];
				tokenboxValue.tooltip = draggingNode.tooltip;
			}
			else
			{
				tokenboxValue.data["icon"] = "error";
				if (!checkExists(tokenboxValue.text))
				{
					tokenboxValue.text = this.analyzerService.getReferenceType(tokenboxValue.data.ItemType);
				}
			}
		}

		return tokenboxValue;
	},

	_loadState: function (testValue)
	{
		if (checkExists(testValue))
		{
			if ((testValue.length === 1) && (testValue[0].type === "value"))
			{
				var stateDropdownValues = $("#FormNavigateStateValues").val().split("|");
				var stateDropdownDisplays = $("#FormNavigateStateDisplays").val().split("|");

				if (stateDropdownDisplays.length > 1)
				{
					for (var j = 1; j < stateDropdownDisplays.length; j++)
					{
						var testDisplay = "";

						if (checkExists(testValue[0].value))
						{
							testDisplay = testValue[0].value;
						}
						else if (checkExists(testValue[0].text))
						{
							testDisplay = testValue[0].text;
						}

						if (testDisplay === stateDropdownDisplays[j])
						{
							if (checkExists(testValue[0].value))
							{
								testValue[0].value = stateDropdownValues[j];
							}
							else if (checkExists(testValue[0].text))
							{
								testValue[0].text = stateDropdownValues[j];
							}

							testValue[0].data = stateDropdownValues[j];

							$("#FormNavigateStateFF").find("#FormNavigateStateTwisty").twisty("value", testValue);
						}
					}
				}
			}
			else
			{
				$("#FormNavigateStateFF").find("#FormNavigateStateTwisty").twisty("value", testValue);
			}
		}
	},

	_loadTarget: function (value)
	{
		if (checkExists(value))
		{
			$("#FormNavigateOpenInFF").find("#FormNavigateOpenInTwisty").twisty("value", value);
		}
	},

	_createMapping: function (coll, type, targetName, value)
	{
		var mapping =
			'<Mapping ActionPropertyCollection="' + coll + '">' +
				'<Item ' +
					'ContextType="target" ' +
					'ItemType="' + type + '" ' +
					'Name="' + targetName + '" ' +
				'/>' +
				'<Item ContextType="value">' +
					value +
				'</Item>' +
			'</Mapping>';

		return mapping;
	},

	onStateTwistyButtonClick: function (ev)
	{
		this._updatePreview();
	},

	onStateTwistyChange: function (ev)
	{
		this._updatePreview();
	},

	_onStateTargetTokenboxFocus: function (ev)
	{
		this._updatePreview();
	},

	onStateTwistyBlur: function (ev)
	{
		this._updatePreview();
	},

	_onTokenboxDropFocus: function (ev)
	{
		var tokenbox = $(ev.target);

		var checkbox = tokenbox.parent().prev().find("input[type=checkbox]");

		if (!checkbox.is(":checked"))
		{
			checkbox.checkbox("check");
		}

		this._updatePreview();
	},

	_onTokenboxKeypress: function (ev)
	{
		if (ev.keyCode === 13)
		{
			var tokenbox = $(ev.target);
			var li = tokenbox.closest("li");
			if (li.length > 0 && li.next().length > 0)
			{
				li.next().find("input[type=text]").tokenbox("focus");
			}
		}
		else
		{
			this._updatePreview();
		}
	},

	_onWizardShow: function ()
	{
		var step = this._wizard.wizard("find", "step", "active");
		window.setTimeout(function ()
		{
			if (step.data("FormNavStep"))
			{
				var paneContainer = step.find(".pane-container").first();
				var pane = paneContainer.children(".pane").last().css("top", "0px");
			}
		}, 50);
	},

	_toSourceValueXML: function (valobj)
	{
		var result = "<SourceValue>";

		$.each(valobj, function (k, v)
		{
			if (v.type === "value")
			{
				result += "<Item ContextType=\"value\"><![CDATA[" + v.data + "]]></Item>";
			}
			else
			{
				result += "<Item ContextType=\"context\"";

				$.each(v.data, function (l, w)
				{
					result += " " + l + "=\"" + w.toString().xmlEncode() + "\"";
				});

				result += " />";
			}
		});

		result += "</SourceValue>";

		return result;
	},

	_transformXml: function ()
	{
		//transform xml
		var transformer = new XslTransform();
		transformer.importStylesheet(applicationRoot + "Rules/XSLT/BasicMapping.xslt");
		transformer.addParameter("Fields", ContextTree_TreeExtraHeading_Fields);
		transformer.addParameter("Controls", ContextTree_TreeExtraHeading_Controls);
		transformer.addParameter("Methods", ContextTree_TreeExtraHeading_Methods);
		transformer.addParameter("Parameters", ContextTree_TreeExtraHeading_Parameters);
		transformer.addParameter("InputProperties", ContextTree_TreeExtraHeading_InputProperties);
		transformer.addParameter("ReturnProperties", ContextTree_TreeExtraHeading_ReturnProperties);

		if ($chk(this.Settings.subformID))
		{
			transformer.addParameter("SubFormID", this.Settings.subformID);
		}

		if ($chk(this.ResultName))
		{
			transformer.addParameter("ResultName", this.ResultName);
		}

		if (checkExists(this.Collections))
		{
			var clonedNode = this.Collections.cloneNode(true);
			if (checkExists(this.ResultName))
			{
				clonedNode.setAttribute("ResultName", this.ResultName);
			}
			this.targetXml.documentElement.appendChild(clonedNode);
		}

		this.targetXml = parseXML(transformer.transformToText(this.targetXml));
		//end transform xml
	},

	_updatePreview: function ()
	{
		var stateTwistyValue = null;
		if (this._stateTwisty.hasClass("drop"))
		{
			stateTwistyValue = this._getTokenboxValue(this._stateTwisty.find(".mapping-control"));
		}
		else
		{
			stateTwistyValue = this._stateTwisty.twisty("value");
		}
		var stateString = "_state=";
		var staticURL = true;
		var params = [];
		var result = this._baseURL;

		for (var i = 0; i < stateTwistyValue.length; i++)
		{
			if (stateTwistyValue[i].type === "value")
			{
				if (checkExists(stateTwistyValue[i].value))
				{
					var stateDropdownValues = $("#FormNavigateStateValues").val().split("|");
					var stateDropdownDisplays = $("#FormNavigateStateDisplays").val().split("|");

					if (stateDropdownValues.length > 1)
					{
						for (var j = 1; j < stateDropdownValues.length; j++)
						{
							if (stateTwistyValue[i].value === stateDropdownValues[j])
							{
								stateString += stateDropdownDisplays[j];
							}
						}
					}
				}
				else if (checkExists(stateTwistyValue[i].text))
				{
					stateString += stateTwistyValue[i].text;
				}
			}
			else if (stateTwistyValue[i].type === "context")
			{
				staticURL = false;
				stateString += "<span class=\"token " + stateTwistyValue[i].data.icon + "\">" + stateTwistyValue[i].text + "</span>";
			}
		}

		if (stateString !== "_state=")
		{
			params.push(stateString);
		}

		var queryObject = { isMapping: true, isChecked: true, isReadOnly: false, itemType: "FormParameter" };
		var modelItems = this.mappingWidgetBase.findObjectInModel(queryObject, true);

		for (var i = 0; i < modelItems.length; i++)
		{
			var modelItem = modelItems[i];
			var param = modelItem.name + "=";

			for (var j = 0; j < modelItem.mappings.length; j++)
			{
				var mapping = modelItem.mappings[j];
				if (mapping.type === "value")
				{
					param += encodeURIComponent(mapping.text);
				}
				else
				{
					staticURL = false;
					param += "<span class=\"token " + mapping.data.icon + "\">" + mapping.text + "</span>";
				}
			}

			params.push(param);
		}

		if (!checkExists(this._previewURL) || this._previewURL.length === 0)
			this._previewURL = $(this.container).find(".preview-url");

		this._previewURL.html(result + (params.length > 0 ? "?" : "") + params.join("&"));
		this._previewURL.attr("href", this._previewURL.text());
		this._previewURL.parent()[0].id = "BrowserNavigatePC"; //apply token classes
		if (!staticURL)
		{
			this._previewURL.addClass("dynamic");
		}
		else
		{
			this._previewURL.removeClass("dynamic");
		}
	},

	_valueItemTokenboxValue: function (item)
	{
		return {
			type: "value",
			data: (item.firstChild !== null) ? item.firstChild.nodeValue : "",
			text: (item.firstChild !== null) ? item.firstChild.nodeValue : ""
		};
	}
};
