(function ($)
{
	// Namespacing the Designer.
	if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
	if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
	if (typeof SourceCode.Forms.Designers === "undefined" || SourceCode.Forms.Designers === null) SourceCode.Forms.Designers = {};
	if (typeof SourceCode.Forms.Designers.Rule === "undefined" || SourceCode.Forms.Designers.Rule === null) SourceCode.Forms.Designers.Rule = {};

	var Types = SourceCode.Forms.Types;

	SourceCode.Forms.Designers.Rule.TargetMappingWidget = function (options)
	{
		this._options = {};
		jQuery.extend(this._options, this._defaultOptions);
		this.setOptions(options);
	};

	var _targetMappingWidgetPrototype =
	{
		// Options.
		_defaultOptions:
		{
			targetHeadingText: "* Mappings",
			fullsize: true,
			scrolling: true,
			renderPanel: true,
			classNames: null,
			prependControl: false,
			targetContextContainer: null,
			targetXml: null
		},
		_options: null,
		_element: null,
		_parentElement: null,
		_model: null,
		containerData: null,

		//#region Public Functions
		initialize: function (parentElement)
		{
			//Ensure Parameters
			if (!checkExists(parentElement))
			{
				throw "Attempted TargetMappingWidget Initialize without parentElement parameter!";
			}

			this._parentElement = checkExists(parentElement.selector) ? parentElement : jQuery(parentElement);
			this._element = this._createLayoutElement();

			if (checkExistsNotEmpty(this._options.classNames))
			{
				this._element.addClass(this._options.classNames);
			}
		},

		setOption: function (option, val)
		{
			// Only set options that exist on the control
			if (this._options[option] !== undefined)
			{
				this._options[option] = val;
			}
		},

		setOptions: function (options)
		{
			if (checkExists(options))
			{
				var properties = Object.getOwnPropertyNames(options);
				for (var i = 0; i < properties.length; i++)
				{
					var property = properties[i];
					this.setOption(property, options[property]);
				}
			}
		},

		getOption: function(option)
		{
			return this._options[option];
		},

		populateInvalidMappings: function (invalidDraggingNodes, configurationXml)
		{
			this._model = new Types.RuleMappingTargetItem({ displayName: "Invalid Mappings", icon: "error" });

			var invalidMappings = this._getInvalidMappingNodes(configurationXml);
			for (var i = 0; i < invalidMappings.length; i++)
			{
				var mapping = invalidMappings[i];
				var target = mapping.selectSingleNode("Item[@ContextType = 'target']");
				var validationMessages = SourceCode.Forms.Services.AnalyzerResourcesService().parseValidationMessage(target.getAttribute("ValidationMessages"));

				for (var y = 0; y < validationMessages.length; y++)
				{
					if (validationMessages[y].status === "Missing")
					{
						var validationMessage = validationMessages[y];
						var targetMappingItem = this._createInvalidItem(validationMessage, invalidDraggingNodes, mapping, target);
						var groupItem = this._getContainerGroupItem(target, targetMappingItem);
						groupItem.childItems.addItem(targetMappingItem);
					}
				}
			}

			this._buildUI();
		},

		getInvalidMappingsXml: function()
		{
			var xmlString = "";
			var mappings = jQuery("input.input-control[type=checkbox]", this._element);

			for (var i = 0; i < mappings.length; i++)
			{
				var mappingItem = jQuery(mappings[i]).closest("li").data("Model");

				if(mappingItem.isChecked && checkExists(mappingItem.xmlNode))
				{
					xmlString += mappingItem.xmlNode.xml;
				}
			}

			return xmlString;
		},
		//#endregion Public Functions

		//#region Private Functions
		_getInvalidMappingNodes: function (configurationXml)
		{
			var savedXmlDoc = parseXML(configurationXml);
			var savedMappings = savedXmlDoc.selectNodes("//Mappings/Mapping[Item[@ContextType = 'target' and @Invalid = 'true']]");
			return savedMappings;
			//return this.containerData.handlerXml.selectNodes("//Mappings/Mapping[@Invalid = 'true']");
		},

		_createInvalidItem: function (validationMessage, invalidDraggingNodes, mappingXmlNode, targetItemXmlNode)
		{
			var analyzerService = SourceCode.Forms.Services.AnalyzerResourcesService();
			var modelItem;
			var key = getNodeAttribute("Guid", targetItemXmlNode, targetItemXmlNode.getAttribute("Name"), checkExistsNotEmptyGuid);
			var itemType = analyzerService.getReferenceType(validationMessage.type);
			
			var displayName;
			if(checkExistsNotEmpty(validationMessage.displayName))
			{ 
				displayName = validationMessage.displayName;
			}
			else if (checkExistsNotEmpty(validationMessage.name))
			{
				displayName = validationMessage.name;
			}
			else
			{
				displayName = itemType;
			}

			modelItem = new Types.RuleMappingTargetItem({
				displayName: displayName,
				guid: validationMessage.guid,
				name: validationMessage.name,
				itemType: validationMessage.type,
				subType: validationMessage.subType,
				isMapping: true,
				isReadOnly: true,
				isChecked: true,
				icon: SourceCode.Forms.Designers.Common.getItemTypeIcon(validationMessage.type, validationMessage.subType),
				tooltip: analyzerService.getReferenceStatusTitle(validationMessage.status).format(displayName, itemType),
				xmlNode: mappingXmlNode
			});

			if (!checkExistsNotEmpty(modelItem.displayName))
			{
				modelItem.displayName = SourceCode.Forms.Services.AnalyzerResourcesService().getReferenceType(modelItem.itemType);
			}

			// DraggingNode
			var draggingNodes = invalidDraggingNodes[key];

			if (checkExists(draggingNodes))
			{
				modelItem.mappings = draggingNodes;
			}

			return modelItem;
		},

		_findSubView: function(id)
		{
			var viewObj = null;

			if (checkExists(this._options.targetXml))
			{
				var viewNode = this._options.targetXml.selectSingleNode("//Item[@ItemType='View']");

				if (viewNode !== null)
				{
					var displayNameNode = viewNode.selectSingleNode("DisplayName");
					var displayName = displayNameNode ? displayNameNode.text : ""

					viewObj = {
						guid: viewNode.getAttribute("Guid"),
						itemType: viewNode.getAttribute("ItemType"),
						displayName: displayName,
						tooltip: displayName
					};
				}
			}

			return viewObj;
		},

		_getFormViewPart: function (targetItemNode)
		{
			if (checkExists(this.containerData) && checkExists(targetItemNode) && checkExists(this._options.targetContextContainer))
			{
				var subFormID = getNodeAttribute("SubFormID", targetItemNode, null, checkExistsNotEmptyGuid);
				var instanceID = getNodeAttribute("InstanceID", targetItemNode, null, checkExistsNotEmptyGuid);
				var sourcePath = getNodeAttribute("SourcePath", targetItemNode, null, checkExistsNotEmptyGuid);

				if (checkExistsNotEmpty(subFormID) || checkExistsNotEmpty(instanceID) || checkExistsNotEmpty(sourcePath))
				{
					var modelObject = this._findSubView(subFormID);

					return modelObject;
				}
				else
				{
					if (this.containerData.Context === "Form")
					{
						if(checkExists(SourceCode.Forms.Designers.Form.definitionXml))
						{
							var formNode = SourceCode.Forms.Designers.Form.definitionXml.selectSingleNode("/SourceCode.Forms/Forms/Form");
							if(checkExists(formNode))
							{
								var retObj = {};

								retObj.displayName = getNodeValue("DisplayName", formNode, null);
								retObj.guid = formNode.getAttribute("ID");
								retObj.tooltip = getNodeValue("Description", formNode, "");
								retObj.itemType = this.containerData.Context;

								if (checkExistsNotEmpty(retObj.displayName))
								{
									return retObj;
								}
							}
						}
					}

					if (this.containerData.Context === "View")
					{
						if(checkExists(SourceCode.Forms.Designers.View.viewDefinitionXML))
						{
							var viewNode = SourceCode.Forms.Designers.View.viewDefinitionXML.selectSingleNode("/SourceCode.Forms/Views/View");
							if(checkExists(viewNode))
							{
								var retObj = {};

								retObj.displayName = getNodeValue("DisplayName", viewNode, null);
								retObj.guid = viewNode.getAttribute("ID");
								retObj.itemType = this.containerData.Context;

								if (checkExistsNotEmpty(retObj.displayName))
								{
									return retObj;
								}
							}
						}
					}
				}
			}
			return null;
		},

		_getContainerGroupItem: function (targetItemNode, targetMappingItem)
		{
			var viewFormPartObj = this._getFormViewPart(targetItemNode);
			var containerItem;

			if (checkExists(viewFormPartObj))
			{
				containerItem = this._getOrCreateContainer(this._model, viewFormPartObj);
			}
			else
			{
				// Fallback - put under root node.
				containerItem = this._model;
			}

			var groupItem = this._getOrCreateContainer(containerItem,
			{
				name: targetMappingItem.itemType,
				itemType: targetMappingItem.itemType,
				displayName:  SourceCode.Forms.Services.AnalyzerResourcesService().getReferenceType(targetMappingItem.itemType)
			});

			return groupItem;
		},

		_getOrCreateContainer: function (containerItem, targetMappingOptions)
		{
			var childItem = containerItem.childItems.findItem(targetMappingOptions);

			if (!checkExists(childItem))
			{
				targetMappingOptions.icon = SourceCode.Forms.Designers.Common.getItemTypeIcon(targetMappingOptions.itemType, targetMappingOptions.itemSubType);
				childItem = containerItem.childItems.addItem(targetMappingOptions);
			}

			return childItem;
		},

		_createLayoutElement: function ()
		{
			// Returns the template.
			var element = jQuery("<div class='tree'></div>");
			var mainElement = element;

			this._parentElement.append(mainElement);

			if (this._options.renderPanel)
			{
				element.panel({ header: this._options.targetHeadingText, fullsize: this._options.fullsize, toolbars: 0, scrolling: this._options.scrolling });
				mainElement = element.closest("div.panel");
			}

			// The panel automatically appends itself so we have to prepend it like this
			var parentChildren = this._parentElement.children();
			if (this._options.prependControl && parentChildren.length > 1)
			{
				mainElement.insertBefore(this._parentElement.children()[0]);
			}

			var mainList = jQuery('<ul class="target-rule"></ul>');
			element.append(mainList);

			return element;
		},

		_buildUI: function ()
		{
			// TODO:  Clear tree
			this._populateControl(this._element.children("ul"), this._model);

			//mainList.find("li").last().addClass("dropLabelLast");
		},

		_populateControl: function(parentElement, modelItem)
		{
			var listItem = jQuery('<li class="children" style="position:relative;"></li>');
			parentElement.append(listItem);

			// Add Model.
			listItem.data("Model", modelItem);

			// Generate Markup.
			if (modelItem.isMapping)
			{
				this._generateMappingLine(listItem, modelItem);
			}
			else
			{
				this._generateItemLine(listItem, modelItem);
			}
			
			if (modelItem.childItems.length() > 0)
			{
				var newList = jQuery('<ul class="target-rule"></ul>');
				listItem.append(newList);

				modelItem.childItems.foreach(function (childItem)
				{
					this._populateControl(newList, childItem);
				}, this);
			}
		},

		_generateItemLine: function(listItem, modelItem)
		{
			// Display Value.
			if (checkExistsNotEmpty(modelItem.displayName))
			{
				var dispSpan = jQuery('<span title="{0}">{1}</span>'.format(modelItem.tooltip, modelItem.displayName));
				listItem.append(dispSpan);
				var _this = this;

				listItem.on("click", function (ev)
				{
					if (ev.delegateTarget === ev.target && !(ev.target.tagName === 'span' || $(ev.target).is('a.styling-font')))
					{
						var $target = $(ev.target).closest("li"); //will return ev.target if ev.target is an li, no need to do conditional searches, etc.
						_this._expandCollapseMappings($target);
						ev.stopPropagation();
					}
				});
			}

			if (checkExistsNotEmpty(modelItem.icon))
			{
				listItem.addClass(modelItem.icon);
			}

			listItem.addClass("open");
		},

		_generateMappingLine: function (listItem, modelItem)
		{
			// Checkbox.
			var checkbox = SCCheckbox.html({ label: modelItem.displayName, icon: modelItem.icon, disabled: false, description: modelItem.tooltip });
			listItem.append(checkbox);
			checkbox = listItem.find("input.input-control[type=checkbox]").checkbox();
			if (modelItem.isChecked === true)
			{
				checkbox.checkbox("check");
			}
			checkbox.on("change", this._mappingCheckChanged);

			// Tokenbox.
			var tokenboxContainer = jQuery("<div class=\"mappings-input\"><input type=\"text\"/></div>");

			var tokenbox = tokenboxContainer.find("input").tokenbox({
				multiValue: true
			});

			tokenbox.tokenbox("value", modelItem.mappings);

			if (modelItem.isReadOnly === true)
			{
				tokenbox.tokenbox("disable");
			}

			listItem.append(tokenboxContainer);
		},

		_mappingCheckChanged: function (evt)
		{
			var checkbox = jQuery(evt.target || evt.srcElement).closest("input.input-control[type=checkbox]").checkbox();
			var modelItem = checkbox.closest("li").data("Model");
			modelItem.isChecked = checkbox.is(":checked");
		},

		_expandCollapseMappings: function ($target)
		{
			if ($target.hasClass("open"))
			{
				$target.removeClass("open");
				$target.addClass("closed");
				$target.next("ul").hide();
			}
			else
			{
				var $targetUl = $target.find(">ul");

				$target.addClass("open");
				$target.removeClass("closed");
				$target.next("ul").show();
			}
		}
		//#endregion Private Functions
	};

	jQuery.extend(SourceCode.Forms.Designers.Rule.TargetMappingWidget.prototype, _targetMappingWidgetPrototype);
})(jQuery);
