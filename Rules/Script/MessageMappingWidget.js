function MessageMappingWidget()
{
	this.headingIsLiteralFF;
	this.headingIsLiteral = false;
	this.bodyIsLiteralFF;
	this.bodyIsLiteral = false;

	this.createMapping = function (targetName, value, isLiteralText)
	{
		var mapping =
			'<Mapping ActionPropertyCollection="Parameters">' +
				'<Item ' +
					'ContextType="target" ' +
					'ItemType="MessageProperty" ' +
					'Name="' + targetName + '" ' +
				'/>' +
				'<Item ContextType="value" '+ isLiteralText +'>' +
					value +
				'</Item>' +
			'</Mapping>';

		return mapping;
	};
}

MessageMappingWidget.prototype =
{
	initialize: function (contentElement)
	{
		this.container = contentElement;
		this.instanceid = String.generateGuid();
		this._buildUI();
		this._bindUiEvents();
		this._analyzerService = SourceCode.Forms.Services.AnalyzerResourcesService();
	},

	dispose: function ()
	{
		this._unbindUiEvents();
		this.container.empty();
	},

	_bindUiEvents: function()
	{
		$("#messageActionHeadingIsLiteral").on("change", function (evt)
		{
			this.headingIsLiteral = $(evt.target).is(":checked");
		}.bind(this));

		$("#messageActionBodyIsLiteral").on("change", function (evt)
		{
			this.bodyIsLiteral = $(evt.target).is(":checked");
		}.bind(this));
	},

	_unbindUiEvents: function ()
	{
		$("#messageActionHeadingIsLiteral").off("change");
		$("#messageActionBodyIsLiteral").off("change");
	},
	
	_getMapping: function (targetName, value, literal)
	{
		if (checkExists(value) && value !== "")
		{
			var isLiteralText = "";
			if (typeof literal !== "undefined")
			{
				isLiteralText = literal ? "Literal=\"True\"" : "Literal=\"False\"";
			}

			return this.createMapping(targetName, value, isLiteralText);
		}
		else
			return "";
	},

	getConfigurationXML: function ()
	{
		var MessageXML = "";

		if (typeof this.Settings.Sizable !== "undefined" && this.Settings.Sizable.toLowerCase() === "true")
		{
			var sizeTwistyValue = $("#" + this.instanceid + "_sizeTwisty").twisty("value");
			MessageXML += this._getMapping("Size", this._toSourceValueXML(sizeTwistyValue));
		}

		if (typeof this.Settings.MessageTypes !== "undefined" && this.Settings.MessageTypes.toLowerCase() === "true")
		{
			var typeTwistyValue = $("#" + this.instanceid + "_typeTwisty").twisty("value");
			MessageXML += this._getMapping("Type", this._toSourceValueXML(typeTwistyValue));
		}

		var titleValue = $("#" + this.instanceid + "_title").tokenbox("value");
		if (titleValue.length !== 0)
		{
			MessageXML += this._getMapping("Title", this._toSourceValueXML(titleValue));
		}

		var headingValue = $("#" + this.instanceid + "_heading").tokenbox("value");
		if (headingValue.length !== 0)
		{
			MessageXML += this._getMapping("Heading", this._toSourceValueXML(headingValue), this.headingIsLiteral);
		}

		var bodyValue = $("#" + this.instanceid + "_body").tokenbox("value");
		if (bodyValue.length !== 0)
		{
			MessageXML += this._getMapping("Body", this._toSourceValueXML(bodyValue), this.bodyIsLiteral);
		} 

		if (MessageXML.contains('Invalid="true"'))
		{
			MessageXML = '<Mappings Invalid="true">' + MessageXML + '</Mappings>';
		}
		else
		{
			MessageXML = '<Mappings>' + MessageXML + '</Mappings>';
		}

		return MessageXML;
	},

	setConfigurationXml: function (configurationXml, targetContextContainer)
	{
		this.targetContextContainer = targetContextContainer;

		//if this is loading a saved mapping screen
		if (checkExists(configurationXml))
		{
			var mappingsDoc = parseXML(configurationXml);

			var mappings = null;
			var sourceItemNodes = null;
			var targetItemNode = null;

			var sourceItem = null;
			var sourceItemValue = null;

			var mappingNodes = mappingsDoc.selectNodes("/Mappings/Mapping[Item]");
			for (var i = 0; i < mappingNodes.length; i++)
			{
				mappings = [];
				targetItemNode = mappingNodes[i].selectSingleNode("Item[@ContextType='target']");
				sourceItemNodes = mappingNodes[i].selectNodes(".//Item[(@ContextType='context' or @ContextType='value') and not(SourceValue/Item)]");

				literal = mappingNodes[i].selectSingleNode("Item[@ContextType='context' or @ContextType='value']").getAttribute("Literal") !== "False";

				if (sourceItemNodes.length > 0)
				{
					for (var y = 0; y < sourceItemNodes.length; y++)
					{
						sourceItem = sourceItemNodes[y];
						sourceItemValue = sourceItem.firstChild !== null ? sourceItem.firstChild.nodeValue : "";

						switch (targetItemNode.getAttribute("Name"))
						{
							case "Heading":
								this.headingIsLiteral = literal;
								break;
							case "Body":
								this.bodyIsLiteral = literal;
								break;
						}

						if (sourceItem.getAttribute("ContextType") === "value")
						{
							// Value
							mappings.push({ type: "value", data: sourceItemValue, text: sourceItemValue });
						}
						else
						{
							// Context Item
							// TODO:  ALM V2 Change inheritence of this widget to the MappingWidgetBase.
							var searchObj = SourceCode.Forms.Designers.Rule.MappingWidgetBase.prototype._getConfigurationDraggingNodeSearchObject.bind(this)(sourceItem);
							var draggingNode = SourceCode.Forms.Designers.Rule.MappingWidgetBase.prototype._getConfigurationDraggingNode.bind(this)(sourceItem, searchObj);

							mappings.push({ type: "context", data: draggingNode.data, text: draggingNode.display, tooltip: draggingNode.tooltip });
						}
					}
				}
				else
				{
					mappings.push({ type: "value", data: "", text: "" });
				}

				if (checkExists(targetItemNode) && mappings.length > 0)
				{
					switch (targetItemNode.getAttribute("Name"))
					{
						case "Size":
							$("#" + this.instanceid + "_sizeTwisty").twisty("value", mappings);
							break;
						case "Type":
							$("#" + this.instanceid + "_typeTwisty").twisty("value", mappings);
							break;
						case "Title":
							$("#" + this.instanceid + "_title").tokenbox("value", mappings);
							break;
						case "Heading":
							$("#" + this.instanceid + "_heading").tokenbox("value", mappings);
							this.headingIsLiteralFF.checkbox(this.headingIsLiteral ? "check" : "uncheck");
							break;
						case "Body":
							$("#" + this.instanceid + "_body").tokenbox("value", mappings);
							this.bodyIsLiteralFF.checkbox(this.bodyIsLiteral ? "check" : "uncheck");
							break;
					}
				}
			}
		}
	},

	_buildUI: function ()
	{
		// Mail Header Section
		var mhpanelopts = {
			fullsize: true,
			header: Resources.RuleDesigner.MessageMappingWidgetMessageHeaderPanelTitle
		};

		var p = $(SourceCode.Forms.Controls.Panel.html(mhpanelopts)).appendTo(this.container);
		var pbw = p.find(".panel-body-wrapper > .wrapper");

		if (typeof this.Settings.Sizable !== "undefined" && this.Settings.Sizable.toLowerCase() === "true")
		{
			var options = {};
			options.subType = "drop";

			options.items = Resources.RuleDesigner.MessageMappingWidgteSizeSmallOption + "|" + Resources.RuleDesigner.MessageMappingWidgteSizeMediumOption + "|" + Resources.RuleDesigner.MessageMappingWidgteSizeLargeOption + "+small|medium|large";

			var sizeFF = $(SourceCode.Forms.Controls.FormField.html({ id: "MessageSizeFF", label: Resources.RuleDesigner.MessageMappingWidgetSizeLabel, required: false })).appendTo(pbw);
			$("<div id=\"" + this.instanceid + "_sizeTwisty\" class=\"mappings-input\"></div>").appendTo(sizeFF.children(".form-field-element-wrapper")).twisty(options);
		}

		if (typeof this.Settings.MessageTypes !== "undefined" && this.Settings.MessageTypes.toLowerCase() === "true")
		{
			var options = {};
			options.subType = "drop";
			options.hasIcon = true;

			options.items = Resources.RuleDesigner.MessageMappingWidgetTypeDefaultOption + "|" + Resources.RuleDesigner.MessageMappingWidgetTypeConfirmationOption + "|" + Resources.RuleDesigner.MessageMappingWidgetTypeErrorOption + "|" + Resources.RuleDesigner.MessageMappingWidgetTypeInfoOption + "|" + Resources.RuleDesigner.MessageMappingWidgetTypeWarningOption + "|" + Resources.RuleDesigner.MessageMappingWidgetTypeNoneOption + "+message|confirmation|error|info|warning|none";

			var typeFF = $(SourceCode.Forms.Controls.FormField.html({ id: "MessageTypeFF", label: Resources.RuleDesigner.MessageMappingWidgetTypeLabel, required: false })).appendTo(pbw);
            $("<div id=\"" + this.instanceid + "_typeTwisty\" class=\"mappings-input\"></div>").appendTo(typeFF.children(".form-field-element-wrapper")).twisty(options);
		}

		var titleFF = $(SourceCode.Forms.Controls.FormField.html({ id: "MessageTitleFF", label: Resources.RuleDesigner.MessageMappingWidgetTitleLabel, required: false })).appendTo(pbw);
		var headingFF = $(SourceCode.Forms.Controls.FormField.html({ label: Resources.RuleDesigner.MessageMappingWidgetHeadingLabel, required: false })).appendTo(pbw);
		this.headingIsLiteralFF = $(SourceCode.Forms.Controls.Checkbox.html({ id: "messageActionHeadingIsLiteral", description: Resources.RuleDesigner.TitleLiteral, label: Resources.RuleDesigner.Literal, checked: this.headingIsLiteral })).checkbox();
		var bodyFF = $(SourceCode.Forms.Controls.FormField.html({ label: Resources.RuleDesigner.MessageMappingWidgetBodyLabel, required: false })).appendTo(pbw);
		this.bodyIsLiteralFF = $(SourceCode.Forms.Controls.Checkbox.html({ id: "messageActionBodyIsLiteral", description: Resources.RuleDesigner.TitleLiteral, label: Resources.RuleDesigner.Literal, checked: this.bodyIsLiteral })).checkbox();

		$("<input type=\"text\" id=\"" + this.instanceid + "_title\" class=\"token-input\" />").appendTo(titleFF.children(".form-field-element-wrapper")).tokenbox({ accept: ".ui-draggable", watermark: Resources.RuleDesigner.WatermarkMessage });
		$("<input type=\"text\" id=\"" + this.instanceid + "_heading\" class=\"token-input\" />").appendTo(headingFF.children(".form-field-element-wrapper")).tokenbox({ accept: ".ui-draggable", watermark: Resources.RuleDesigner.WatermarkMessage });
		this.headingIsLiteralFF.appendTo(headingFF.children(".form-field-element-wrapper"));
		$("<textarea id=\"" + this.instanceid + "_body\" cols=\"\" rows=\"\"></textarea>").appendTo(bodyFF.children(".form-field-element-wrapper")).tokenbox({ accept: ".ui-draggable", multiline: true, watermark: Resources.RuleDesigner.WatermarkMessage });
		this.bodyIsLiteralFF.appendTo(bodyFF.children(".form-field-element-wrapper"));

		var formfield = $("#" + this.instanceid + "_body").closest(".form-field"), attempts = 0;

		adjustmentInterval = window.setInterval(function ()
		{
			if (formfield.is(":visible"))
			{
				var ffStyle = formfield[0].style;
				ffStyle.top = formfield.position().top + "px";
				ffStyle.left = '0';
				ffStyle.right = '0';
				ffStyle.bottom = '20px';
				ffStyle.position = 'absolute';

				formfield.children(".form-field-element-wrapper")[0].style.height = "100%";
				formfield.find(".token-input").addClass("full-size");
				window.clearInterval(adjustmentInterval);
			}
			else if (attempts < 10)
			{
				attempts++;
			}
			else
			{
				window.clearInterval(adjustmentInterval);
			}
		}, 100);
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
	}
};
