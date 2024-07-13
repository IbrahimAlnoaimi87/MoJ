//this is the basic mapping widget
//it gets its targetXml data from the specified plugin in the utils item xml format.
//it then displays the xml and saves a result.
function BasicMappingWidget()
{
	///<summary>
	///this is the basic mapping widget
	///it gets its targetXml data from the specified plugin in the utils item xml format.
	///it then displays the xml and saves a result.
	///</summary>

}

BasicMappingWidget.logInvalidMappings = function (invalidMappings)
{
	if (checkExists(BasicMappingWidget.invalidMappingsTimeout))
	{
		clearTimeout(BasicMappingWidget.invalidMappingsTimeout);
	}
	if (!checkExists(BasicMappingWidget.invalidMappings))
	{
		BasicMappingWidget.invalidMappings = invalidMappings;
	}
	else
	{
		BasicMappingWidget.invalidMappings = BasicMappingWidget.invalidMappings.concat(invalidMappings);
	}
	BasicMappingWidget.invalidMappingsTimeout = setTimeout(BasicMappingWidget.showInvalidMappings, 0);
};

BasicMappingWidget.showInvalidMappings = function ()
{
	var invalidMappings = BasicMappingWidget.invalidMappings;

	if (invalidMappings.length > 0)
	{
		var warningMessageTemplate = "{0}<BR><BR>{1}";
		var warningItemTemplate = "{0}<BR>";
		var targetMappingNoLongerValidTemplate = "{0}: {1}";
		var warningItems = Resources.CommonPhrases.TargetMappingNoLongerValidDetail + "<BR><BR>";
		for (var i = 0; i < invalidMappings.length; i++)
		{
			var invalidMapping = invalidMappings[i];
			var queryObject = {};
			queryObject.ItemType = invalidMapping.targetType;
			BasicMappingWidget.prototype.revertQueryObject(queryObject);
			invalidMapping.targetType = queryObject.ItemType;

			var resourceTargetType = Resources.ObjectNames[invalidMapping.targetType];
			if (!checkExists(resourceTargetType))
			{
				resourceTargetType = invalidMapping.targetType;
			}
			var warningItem = targetMappingNoLongerValidTemplate.format(resourceTargetType, invalidMapping.target);
			warningItems += warningItemTemplate.format(warningItem);
		}
		BasicMappingWidget.invalidMappings = [];

		var warningMessage = warningMessageTemplate.format(Resources.CommonPhrases.TargetMappingNoLongerValidMessage, Resources.CommonPhrases.TargetMappingNoLongerValidCommit);

		var messageOptions =
		{
			headerText: Resources.MessageBox.Warning,
			message: warningMessage,
			messageDetail: warningItems,
			showHeaderButtons: false,
			width: 640,
			type: "warning",
			height: 158
		};

		popupManager.showExtendedMessage(messageOptions);
	}
};

BasicMappingWidget.prototype =
{
	initialize: function (parentElement)
	{
		this._parentElement = parentElement;
		this._element = null;
		this._populateToolbar(parentElement);
		this.dropElements = [];
		this._model = [];
		this.lazyLoadItemTypes = ["ViewField"]; // This is an array for incase we want to lazyload more than one item type
		this.analyzerService = SourceCode.Forms.Services.AnalyzerResourcesService();

		//end build xpath
		if (this.targetXml)
		{
			this._transformXml();
			this._buildUI(parentElement);
		}
	},

	_populateToolbar: function (parentElement)
	{
		var tb = parentElement.closest(".wizard-step-content").find(".toolbar");

		if (tb.length === 0)
		{
			var toolbarWrapper = jQuery("<div class=\"toolbars single\"></div>");
			tb = jQuery(SourceCode.Forms.Controls.Toolbar.html());
			toolbarWrapper.append(tb);
			parentElement.closest(".pane-container").children(".pane:first-child").append(toolbarWrapper);
		}

		tb.toolbar();
		tb.toolbar("add", "button", { id: "autoMapButton_BasicMappingWidget", icon: "auto-map", text: ContextTree_AutoMap_Values, description: ContextTree_AutoMap_Values, disabled: false });
		tb.toolbar("add", "button", { id: "clearAllButton_BasicMappingWidget", icon: "delete-all", text: ContextTree_Clear_AllValues, description: ContextTree_Clear_AllValuesDesc, disabled: false });
		tb.toolbar("add", "button", { id: "clearSelectedButton_BasicMappingWidget", icon: "delete", text: ContextTree_Clear_SelectedValue, description: ContextTree_Clear_SelectedValueDesc, disabled: true });

		var toolbarItems = tb.toolbar("fetch", "buttons");
		jQuery(toolbarItems[0]).on("click", this.automapValues.bind(this));
		jQuery(toolbarItems[1]).on("click", this.clearAllValues.bind(this));
		jQuery(toolbarItems[2]).on("click", this.clearSelectedValue.bind(this));
	},

	_buildUI: function (parentElement)
	{
		var element = jQuery("<div class='tree'></div>");
		parentElement.append(element);
		this._element = element;

		var targetHeadingText = "* Mappings";
		if (this.TargetHeading) targetHeadingText = this.TargetHeading;

		element.panel({ header: targetHeadingText, fullsize: true, toolbars: 0, scrolling: true });

		var mainList = jQuery("<ul class='target-rule'></ul>");
		element.append(mainList);

		var root = this.targetXml.documentElement;

		this._buildFilters([]);
		var items = this.targetXml.selectNodes("Items/Item");
		this._buildTreeStructure(items, mainList, []);

		mainList.find("li").last().addClass("dropLabelLast");
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
		transformer.addParameter("ControlMethodParameters", ContextTree_TreeExtraHeading_ControlMethodParameters);
		transformer.addParameter("ControlMethodProperties", ContextTree_TreeExtraHeading_ControlMethodProperties);
		transformer.addParameter("Display", ContextTree_ListDisplay);
		transformer.addParameter("Edit", ContextTree_ListEdit);
		transformer.addParameter("Header", ContextTree_ListHeader);
		transformer.addParameter("Footer", ContextTree_ListFooter);

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

		this.targetXml = transformer.transformToText(this.targetXml);

		if (checkExistsNotEmpty(this.targetXml))
		{
			this.targetXml = parseXML(this.targetXml);
		}
		//end transform xml
	},

	_buildFilters: function (excludeTypes)
	{
		//build xpath
		this.filterTypeXpath = "";
		if (this.filterTypes)
		{
			var filterTypesSplit = this.filterTypes.split("|");
			for (var f = 0; f < filterTypesSplit.length; f++)
			{
				if (!excludeTypes.contains(filterTypesSplit[f]))
				{
					if (this.filterTypeXpath)
					{
						this.filterTypeXpath += " or ";
					}
					this.filterTypeXpath += "@ItemType='" + filterTypesSplit[f] + "'";
				}
			}
		}
		this.filterChildItemXpath = "./Items/.//Item";
		if (this.filterTypeXpath)
		{
			this.filterChildItemXpath += "[" + this.filterTypeXpath + "]";
		}

		this.filterCurrentItemXpath = "self::*";

		if (this.filterTypeXpath)
		{
			this.filterCurrentItemXpath += "[" + this.filterTypeXpath + "]";
		}
	},

	_buildTreeStructure: function (bottomItems, mainList, excludeTypes)
	{
		for (var z = 0; z < bottomItems.length; z++)
		{
			this.currentParentList = mainList;
			this.level = 0;
			var parentControl;
			var item = bottomItems[z];
			var itemNameNode = item.selectSingleNode("Name");
			var itemName = itemNameNode !== null ? itemNameNode.text : ""; // For Item References

			if (!excludeTypes.contains(item.getAttribute("ItemType")))
			{
				while (item !== null)
				{
					//if the current item has children of the filter type
					var itemHasChildrenOfFilterType = item.selectSingleNode(this.filterChildItemXpath);
					var itemIsFilterTypeNode = item.selectSingleNode(this.filterCurrentItemXpath);
					if (item.getAttribute("ItemType") === "Control")
					{
						parentControl = item;
					}
					if (itemHasChildrenOfFilterType)
					{
						this.addTreeNode(item);
						item = item.selectSingleNode('Items/Item');
					}
					else if (itemIsFilterTypeNode)
					{
						var itemVisibility = item.getAttribute("Visibility");
						//add it if it wasn't added in the top section
						var itemType = item.getAttribute("ItemType");
						if ((!excludeTypes.contains(itemType)) && (!((checkExists(itemVisibility)) && (itemVisibility === "None"))))
						{
							var isVisible = true;
							if (checkExists(parentControl) && itemType === "ControlProperty")
							{
								var controlType = parentControl.getAttribute("SubType");
								var controlId = parentControl.getAttribute("Guid");
								var propertyId = item.selectSingleNode("TargetID");
								if (checkExists(propertyId))
								{
									propertyId = propertyId.text;
								}

								var options =
								{
									controlType: controlType,
									propertyId: propertyId,
									controlId: controlId,
									subDesignerType: "rules"
								};
								isVisible = SourceCode.Forms.Designers.Common.getPropertyDisplayFunctionResult(options);

							}
							if (isVisible)
							{
								this.addDropRow(item);
							}
						}

						var ancestor = item;
						do
						{
							// Check for more siblings
							if (item !== null && item.nextSibling !== null)
							{
								// Set next sibling as current item
								item = item.nextSibling;
							}
							else
							{
								// Find next ancestor with siblings
								if (ancestor.parentNode !== null && ancestor.parentNode.parentNode !== null && bottomItems[z] !== ancestor.parentNode.parentNode)
								{
									ancestor = ancestor.parentNode.parentNode;
									item = ancestor.nextSibling;
									this.currentParentList = this.currentParentList.parent().parent();
									this.level -= 1;
								}
								else
								{
									ancestor = null;
									item = null;
								}
							}

						} while (ancestor !== null && (item === null || item.nodeType === 3));
					}
					else
					{
						//if we are not still in the bottomItems list then loop through the items siblings
						if (item.nextSibling === null && item.selectSingleNode("../.."))
						{
							item = item.selectSingleNode("../..").nextSibling;
							this.currentParentList = this.currentParentList.parent().parent();
							this.level -= 1;
						}
						else if (item !== bottomItems[z])
						{
							item = item.nextSibling;
						}
						else if (item === bottomItems[z])
						{
							item = null;
						}
					}
				}
			}
		}
	},

	_findObjectInModel: function (queryObject)
	{
		return findObjectInArrayMatchingAll({
			queryObject: queryObject,
			targetObject: this._model,
			matchMultiple: true,
			splitQueryObjectDelimiter: ",",
			searchDepth: 1,
			sourcePropertiesContainMultipleValues: true
		});
	},

	_findListItem: function (object)
	{
		var dropElement = $();
		if (checkExists(object))
		{
			if (!checkExists(object.HTMLObjectId))
			{
				this.loadChildItem(object);

			}
			dropElement = $("#" + object.HTMLObjectId);
		}

		return dropElement;
	},

	addDroppableEvents: function (line, tokenbox)
	{
		var timeout = null;
		var tokenboxRef = tokenbox;
		var lineTokenState = false;
		line.on("mouseenter.basicmapping", function (event)
		{
			if (checkExists($.ui.ddmanager.current) && checkExists($.ui.ddmanager.current.helper))
			{
				if (checkExists(timeout))
				{
					clearTimeout(timeout);
				}
				else
				{
					lineTokenState = true;
					tokenboxRef.tokenbox("enableDroppable");
					$.ui.ddmanager.prepareOffsets($.ui.ddmanager.current, event);
				}
			}

		});

		line.on("mouseleave.basicmapping", function ()
		{
			if (lineTokenState === true)
			{
				timeout = setTimeout(function ()
				{
					tokenboxRef.tokenbox("disableDroppable");
					lineTokenState = false;
					timeout = null;
				}, 0);
			}
		});
	},

	addTreeNode: function (item, isProperty)
	{
		if (item.nodeName === "Item" && item.selectSingleNode("DisplayName"))
		{
			var _this = this;
			this.level += 1;
			var icon = (item.getAttribute("Icon")) ? item.getAttribute("Icon") : "";

			if (checkExists(_this.Settings.allowParentDroppables) && _this.Settings.allowParentDroppables.contains(item.getAttribute("ItemType"))) // This will add a prent node with a drop textbox next to it
			{
				var line = jQuery("");
				line = _this.getDropListItem(item, isProperty);

				var tokenboxContainer = jQuery("<div class=\"mappings-input\"><input type=\"text\"/></div>");
				var multipleItems = (this.ResultName !== "Output" && this.ResultName !== "ProcessLoadOutput" && this.ResultName !== "ProcessStartOutput");
				var tokenbox = tokenboxContainer.find("input").tokenbox({
					accept: ".ui-draggable",
					focus: this._onTokenboxDropFocus.bind(this),
					keypress: this._onTokenboxKeypress.bind(this),
					multiValue: multipleItems,
					allowTextInput: false,
					watermark: Resources.ContextTree.Tree_DropItemMessage.htmlEncode(),
					required: (item.getAttribute("Required") && item.getAttribute("Required") === "true"),
					droppableEnabled: false
				});

				_this.addDroppableEvents(line, tokenbox);

				line.append(tokenboxContainer);
				line.addClass("children open");
				line.css("height", "100%");

				line.find("input.input-control[type=checkbox]").on("change", function (ev)
				{
					ev.stopPropagation(); // Stop propagation so that the tree structure does not collapse
				});

				line.find("input.input-control[type=checkbox], input.drop-text").on("click", function (ev)
				{
					ev.stopPropagation(); // Stop propagation so that the tree structure does not collapse
				});

				this.currentParentList.append(line);
				var childList = jQuery("<ul id='{0}' class='target-rule target-rule-level-{1}' style='padding-top:3px;'></ul>".format(String.generateGuid()));
				line.append(childList);
				this.currentParentList = childList;

				this.dropElements.push(tokenboxContainer);
			}
			else
			{
				var newLi = "<li class='children open {2}'><span title='{0}'>{1}</span></li>";
				var title = "";
				var itemType = item.getAttribute("ItemType");
				var lineMetaData = {};

				if (itemType === "View" || itemType === "Form" || itemType === "FieldContext" || itemType === "Object")
				{
					title = SourceCode.Forms.Interfaces.AppStudio.formatTitleForSystemName(item.selectSingleNode("Name"), item.selectSingleNode("Description"));
				}
				else
				{
					title = item.selectSingleNode("DisplayName").text;
				}
				newLi = newLi.format(title.htmlEncode(), item.selectSingleNode("DisplayName").text.htmlEncode(), icon);
				var heading = $(newLi);

				heading.on("click", function (ev)
				{
					if (!($(ev.target).is('span') || $(ev.target).is('a.styling-font') || $(ev.target).hasClass('input-control')))
					{
						var $target = $(ev.target).closest("li"); //will return ev.target if ev.target is an li, no need to do conditional searches, etc.
						_this.expandCollapseMappings($target);
					}

					ev.stopPropagation();
				});

				this.currentParentList.append(heading);
				var childList = jQuery("<ul id='{0}' class='target-rule target-rule-level-{1}'></ul>".format(String.generateGuid(), this.level));
				heading.append(childList);
				this.currentParentList = childList;
			}
		}
	},

	revertQueryObject: function (queryObject)
	{
		if (checkExists(queryObject) && checkExists(queryObject.ItemType) && queryObject.ItemType === "ObjectProperty,MethodRequiredProperty,MethodOptionalProperty,MethodReturnProperty")
		{
			queryObject.ItemType = "ObjectProperty";
		}

		if (checkExists(queryObject) && checkExists(queryObject.ItemType) && queryObject.ItemType === "FieldContext")
		{
			queryObject.ItemType = "ViewSource";
		}
	},

	adjustQueryObject: function (queryObject)
	{
		if (checkExists(queryObject) && checkExists(queryObject.ItemType) && queryObject.ItemType === "ObjectProperty")
		{
			queryObject.ItemType = "ObjectProperty,MethodRequiredProperty,MethodOptionalProperty,MethodReturnProperty";
		}

		if (checkExists(queryObject) && checkExists(queryObject.ItemType) && queryObject.ItemType === "ViewSource")
		{
			queryObject.ItemType = "FieldContext";
		}
	},

	buildQueryObject: function (targetItem)
	{
		var queryObject = {};
		var targetGuid = targetItem.getAttribute("Guid");
		var targetID = targetItem.getAttribute("TargetID");
		var targetItemType = targetItem.getAttribute("ItemType");
		var targetName = targetItem.getAttribute("Name");
		var targetPath = targetItem.getAttribute("TargetPath");
		var targetSubformId = targetItem.getAttribute("SubFormID");
		var targetSubformInstanceId = targetItem.getAttribute("SubFormInstanceID");
		var targetInstanceId = targetItem.getAttribute("InstanceID");

		if (checkExistsNotEmpty(targetGuid)) { queryObject.Guid = targetGuid; }
		if (checkExistsNotEmpty(targetID)) { queryObject.TargetID = targetID; }
		if (checkExistsNotEmpty(targetItemType)) { queryObject.ItemType = targetItemType; }
		if (checkExistsNotEmpty(targetName)) { queryObject.Name = targetName; }
		if (checkExistsNotEmpty(targetPath)) { queryObject.TargetPath = targetPath; }
		if (checkExistsNotEmptyGuid(targetSubformId)) { queryObject.SubFormID = targetSubformId; }
		if (checkExistsNotEmptyGuid(targetSubformInstanceId)) { queryObject.SubFormInstanceID = targetSubformInstanceId; }
		if (checkExistsNotEmptyGuid(targetInstanceId)) { queryObject.InstanceID = targetInstanceId; }

		return queryObject;
	},

	getDropListItem: function (item, isProperty, modelObj)
	{
		var lineMetaData = {};
		var lineMetaDataLength = 0;
		var buildHtml = false;
		var itemType = item.getAttribute("ItemType");

		if (!checkExists(this._model))
		{
			this._model = [];
		}

		if (!checkExists(modelObj))
		{
			var modelLength = this._model.length;
			this._model[modelLength] = {};
			var modelObj = this._model[modelLength];
			modelObj["Xml"] = item;

			if (!checkExists(this.lazyLoadItemTypes) || (checkExists(this.lazyLoadItemTypes) && this.lazyLoadItemTypes.indexOf(itemType) === -1))
			{
				buildHtml = true;
			}
		}
		else
		{
			buildHtml = true;
		}

		for (var t = 0; t < item.attributes.length; t++)
		{
			lineMetaData[item.attributes[t].name] = item.attributes[t].value;
			lineMetaDataLength++;
		}

		for (var t = 0; t < item.childNodes.length; t++)
		{
			if (item.childNodes[t].nodeName !== "Items")
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
			} catch (exception) { }
		}

		var display = item.selectSingleNode("DisplayName").text;
		var icon = (item.getAttribute("Icon")) ? item.getAttribute("Icon") : "";
		//TODO: TD 0001

		if (buildHtml)
		{
			var lineHtml = "<li style='position:relative;' class=\"dropLabel " + ((isProperty) ? icon : "");

			if (lineMetaDataLength > 0)
			{
				lineHtml += "\" data-options=\"" + JSON.stringify(lineMetaData).htmlEncode();
			}

			lineHtml += "\">" + ((!isProperty) ? SCCheckbox.html({ label: display, icon: icon, disabled: false, description: display }) : "<span style=' display:inline-block;' title='" + display.htmlEncode() + "'>" + display.htmlEncode() + ((isProperty) ? ":" : "") + "</span>") + "</li>";

			var line = jQuery(lineHtml);
			var lineGuid = String.generateGuid();
			line.attr("id", lineGuid);

			line.find("input.input-control[type=checkbox]").checkbox();
			//line.find("span.input-control-img").css("background-position", "0 0");
			if (item.getAttribute('ItemType') === 'MethodRequiredProperty' || (item.getAttribute("Required") && item.getAttribute("Required") === "true"))
			{
				line.addClass('required');
			}

			modelObj["HTMLObjectId"] = lineGuid;
		}

		modelObj["ParentHTMLObjectId"] = this.currentParentList.attr("id");

		$.extend(modelObj, lineMetaData);

		return line;
	},

	addDropRow: function (item, isProperty, modelObj)
	{
		var line = jQuery("");
		line = this.getDropListItem(item, isProperty, modelObj);

		if (checkExists(line) && line.length > 0)//line.metadata().FieldControl
		{
			var tokenboxContainer = jQuery("<div class=\"mappings-input\"><input type=\"text\"/></div>");
			var _this = this;
			var multipleItems = (this.ResultName !== "Output" && this.ResultName !== "ProcessLoadOutput" && this.ResultName !== "ProcessStartOutput");

			var tokenbox = tokenboxContainer.find("input").tokenbox({
				accept: ".ui-draggable",
				focus: this._onTokenboxDropFocus.bind(this),
				keypress: this._onTokenboxKeypress.bind(this),
				multiValue: multipleItems,
				watermark: Resources.ContextTree.Tree_DropItemMessage.htmlEncode(),
				required: line.hasClass("required"),
				droppableEnabled: false
			});

			_this.addDroppableEvents(line, tokenbox);

			line.append(tokenboxContainer);

			this.currentParentList.append(line);
			this.dropElements.push(tokenboxContainer);
			//Begin collapse fields
			//This code is a kind of hack for PM to collapse fields as per their requirement
			//It works as the FieldControl property will only be present if the collection contained controls
		}
		else
		{
			var parentLi = this.currentParentList.closest("li");
			if (parentLi.hasClass("open"))
			{
				this.currentParentList.parent().removeClass("open");
				this.currentParentList.parent().addClass("closed");
			}
		}
		//End collapse fields
	},

	loadChildItems: function (objects)
	{
		for (var o = 0; o < objects.length; o++)
		{
			var currentObject = objects[o];
			var parentDomElement = $("#" + currentObject.ParentHTMLObjectId);
			this.currentParentList = parentDomElement;

			if (!checkExists(currentObject.HTMLObjectId))
			{
				var itemXml = currentObject["Xml"];
				this.currentParentList.addClass("childrenLoaded");
				this.addDropRow(itemXml, null, currentObject);
			}
			else // This is to correctly order already saved/rendered dropitems
			{
				this.currentParentList.append($("#" + currentObject.HTMLObjectId));
			}
		}
	},

	loadChildItem: function (object)
	{
		if (!checkExists(object.HTMLObjectId))
		{
			var parentDomElement = $("#" + object.ParentHTMLObjectId);
			var itemXml = object["Xml"];
			this.currentParentList = parentDomElement;
			this.currentParentList.addClass("childrenLoaded");

			this.addDropRow(itemXml, null, object);
		}
	},

	expandCollapseMappings: function ($target)
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
			var targetID = $targetUl.attr("id");

			$target.addClass("open");
			$target.removeClass("closed");
			$target.next("ul").show();

			if (!$target.hasClass("childrenLoaded"))
			{
				var childObjects = findObjectInArrayMatchingAny({
					queryObject: { ParentHTMLObjectId: targetID },
					targetObject: this._model,
					matchMultiple: true,
					searchDepth: 1
				});

				this.loadChildItems(childObjects);
			}
		}
	},

	dispose: function ()
	{
		// not implemented
	},

	_getConfigurationMappingNodes: function (configurationXml)
	{
		if (checkExistsNotEmpty(configurationXml))
		{
			var savedXmlDoc = parseXML(configurationXml);
			return savedXmlDoc.selectNodes("/Mappings/Mapping[Item]");
		}
		return [];
	},

	_getConfigurationDraggingNodeSearchObject: function (itemNode, delegatedMethods)
	{
		var draggingNodeSearchObject = { };

		var itemType = itemNode.getAttribute("ItemType");
		if (itemType === "ViewParameter" || itemType === "FormParameter")
		{
			draggingNodeSearchObject.id = itemNode.getAttribute("Name");
		}
		else if (itemType === "ControlProperty")
		{
			draggingNodeSearchObject.id = "{0}_{1}".format(itemNode.getAttribute("SourcePath"), itemNode.getAttribute("SourceID"));
		}
		else
		{
			draggingNodeSearchObject.id = checkExistsNotEmpty(itemNode.getAttribute("Guid")) ? itemNode.getAttribute("Guid") : itemNode.getAttribute("Name");

			if (SourceCode.Forms.Designers.Common.isWorkflowItemType(itemType))
			{
				draggingNodeSearchObject.ItemType = itemType;
			}
		}

		draggingNodeSearchObject.SourceID = getNodeAttribute("SourceID", itemNode, null, checkExistsNotEmpty);
		draggingNodeSearchObject.SourcePath = getNodeAttribute("SourcePath", itemNode, null, checkExistsNotEmpty);
		draggingNodeSearchObject.SubFormID = getNodeAttribute("SubFormID", itemNode, "00000000-0000-0000-0000-000000000000", checkExistsNotEmpty);
		draggingNodeSearchObject.InstanceID = getNodeAttribute("InstanceID", itemNode, null, checkExistsNotEmptyGuid);
		draggingNodeSearchObject.SubFormInstanceID = getNodeAttribute("SubFormInstanceID", itemNode, null, checkExistsNotEmptyGuid);

		if (checkExists(delegatedMethods) && typeof delegatedMethods.getContextTreeSearchObject === "function")
		{
			draggingNodeSearchObject = delegatedMethods.getContextTreeSearchObject(itemNode, draggingNodeSearchObject);
		}
		
		return draggingNodeSearchObject;
	},

	_getConfigurationDraggingNode: function (itemNode, targetContextContainer, draggingNodeSearchObject, validationMessages)
	{
		var draggingNode;
		if (checkExists(targetContextContainer.targetContextCanvas))
		{
			draggingNode = targetContextContainer.targetContextCanvas("getDraggingNode", draggingNodeSearchObject);
			if (!checkExists(draggingNode))
			{
				draggingNode = targetContextContainer.targetContextCanvas("getContextNode", { document: this.contextsXml, item: itemNode });
			}

			// This section was added for the items that need to be partially loaded
			if (!checkExists(draggingNode))
			{
				var parentMetadata = {
					id: draggingNodeSearchObject.SourcePath,
					SubFormID: draggingNodeSearchObject.SubFormID,
					SubFormInstanceID: draggingNodeSearchObject.SubFormInstanceID,
					InstanceID: draggingNodeSearchObject.InstanceID
				};

				var childMetadata = draggingNodeSearchObject;
				draggingNode = targetContextContainer.targetContextCanvas("getPartialDraggingNode", parentMetadata, childMetadata);
			}
		}
		if(!checkExists(draggingNode))
		{
			// If the analyzer service instance was not created, BasicMappingWidget used like a static class (no init invoked)
			if (!checkExists(this.analyzerService))
			{
				this.analyzerService = SourceCode.Forms.Services.AnalyzerResourcesService();
			}

			// Attempt to get the display name of item, falling back on the system name, or ultimately its type to use for display
			var itemType = itemNode.getAttribute("ItemType");
			var itemName = itemNode.getAttribute("DisplayName");
			if (!checkExistsNotEmpty(itemName))
			{
				itemName = itemNode.getAttribute("Name");

				if (!checkExistsNotEmpty(itemName))
				{
					itemName = Resources.ExpressionBuilder.UnresolvedObjectText.format(
						this.analyzerService.getReferenceType(itemType)
					);
				}
			}

			draggingNode = {
				type: "context",
				data: { icon: itemType.toLowerCase() + " error", text: itemName, Invalid: "true" },
				display: itemName,
				text: itemName,
				tooltip: itemName
			};

			// Copy over the XML attributes to be preserved.
			for (var t = 0; t < itemNode.attributes.length; t++)
			{
				var xmlAttr = itemNode.attributes[t].name;
				if (xmlAttr !== "ContextType")
				{
					draggingNode.data[xmlAttr] = itemNode.attributes[t].value;
				}
			}
			
			var validationMessages = itemNode.getAttribute("ValidationMessages");
			if (checkExistsNotEmpty(validationMessages))
			{
				validationMessages = this.analyzerService.parseValidationMessage(validationMessages);

				for (var i = 0; i < validationMessages.length; i++)
				{
					var validationMsg = validationMessages[i];
					var friendlyItemType = this.analyzerService.getReferenceType(validationMsg.type);
					var displayName;
					if (checkExistsNotEmpty(validationMsg.displayName))
					{
						displayName = validationMsg.displayName;
					}
					else if (checkExistsNotEmpty(validationMsg.name))
					{
						displayName = validationMsg.name;
					}
					else
					{
						displayName = itemName;
					}

					draggingNode.tooltip = this.analyzerService.getReferenceStatusTitle(validationMsg.status).format(displayName, friendlyItemType);
					draggingNode.text = displayName;
					draggingNode.display = displayName;
					draggingNode.data.text = displayName;
					draggingNode.data.icon = SourceCode.Forms.Designers.Common.getItemTypeIcon(itemType, validationMsg.subType) + " error";
				}
			}
		}
		
		return draggingNode;
	},

	_getConfigurationTargetListItem: function(targetItem, delegatedMethods)
	{
		var queryObject = this.buildQueryObject(targetItem);
		
		if (checkExists(delegatedMethods) && typeof delegatedMethods.adjustQueryObject === "function")
		{
			delegatedMethods.adjustQueryObject(queryObject);
		}
		else
		{
			this.adjustQueryObject(queryObject);
		}

		var modelObj = this._findObjectInModel(queryObject);
		if (checkExists(modelObj) && modelObj.length > 0)
		{
			var listItem = this._findListItem(modelObj[0]);
			if (listItem.length > 0)
			{
				return listItem;
			}
		}
	},

	setConfigurationXml: function (configurationXml, targetContextContainer, delegatedMethods)
	{
		this.targetContextContainer = targetContextContainer;

		var savedMappings = this._getConfigurationMappingNodes(configurationXml);
		var invalidDraggingNodes = {};

		for (var m = 0; m < savedMappings.length; m++)
		{
			var savedMapping = savedMappings[m];
			var collectionObjects = [];

			var contextItem = savedMapping.selectSingleNode("Item[@ContextType='context']");
			var valueItem = savedMapping.selectSingleNode("Item[@ContextType='value']");

			if (checkExists(contextItem))
			{
				var searchObj = this._getConfigurationDraggingNodeSearchObject(contextItem, delegatedMethods);
				var draggingNode = this._getConfigurationDraggingNode(contextItem, targetContextContainer, searchObj);
				collectionObjects.push({ type: "context", data: draggingNode.data, text: draggingNode.display, tooltip: draggingNode.tooltip });
			}
			else if (checkExists(valueItem))
			{
				var sources = valueItem.selectNodes("SourceValue/Item");
				if (sources.length > 0)
				{
					for (var i = 0; i < sources.length; i++)
					{
						var sourceItem = sources[i];
						if (sourceItem.getAttribute("ContextType") === "context")
						{
							var searchObj = this._getConfigurationDraggingNodeSearchObject(sourceItem, delegatedMethods);
							var draggingNode = this._getConfigurationDraggingNode(sourceItem, targetContextContainer, searchObj);
							collectionObjects.push({ type: "context", data: draggingNode.data, text: draggingNode.text, tooltip: draggingNode.tooltip });
						}
						else
						{
							collectionObjects.push({ type: "value", text: sourceItem.text, data: sourceItem.text });
						}
					}
				}
				else
				{
					var textValue = valueItem.text;
					collectionObjects.push({ type: "value", text: textValue, data: textValue });
				}
			}

			var targetItem = savedMapping.selectSingleNode("Item[@ContextType='target']");
			var listItem = this._getConfigurationTargetListItem(targetItem, delegatedMethods);
			if (checkExists(listItem))
			{
				var checkbox = listItem.find(">label input.input-control[type=checkbox]");
				var tokenboxInput = listItem.find(">.mappings-input input");
				tokenboxInput.tokenbox("value", collectionObjects);
				checkbox.checkbox("check");
			}
			else if(checkExists(targetItem))
			{
				var key = getNodeAttribute("Guid", targetItem, targetItem.getAttribute("Name"), checkExistsNotEmptyGuid);
				invalidDraggingNodes[key] = collectionObjects;
			}
		}

		//if (Object.getOwnPropertyNames(invalidDraggingNodes).length > 0 && checkExists(this._element))
		//{
		//	var targetMappingWidget = new SourceCode.Forms.Designers.Rule.TargetMappingWidget({
		//		targetContextContainer: targetContextContainer,
		//		renderPanel: false,
		//		classNames: "invalid",
		//		prependControl: true,
		//		targetXml: this.targetXml
		//	});

		//	targetMappingWidget.initialize(this._element.parent());

		//	targetMappingWidget.containerData = this.containerData;
		//	targetMappingWidget.populateInvalidMappings(invalidDraggingNodes, configurationXml);

		//	this._invalidMappingWidget = targetMappingWidget;
		//}
	},

	automapValues: function (e)
	{
		for (var h = 0; h < this.dropElements.length; h++)
		{
			var draggingNode = null;
			var dropElementParent = this.dropElements[h].closest("li");
			var metaData = dropElementParent.metadata();
			var guid = metaData.Guid;
			var name = metaData.Name;
			var soGuid = metaData.soGuid;
			var itemType = metaData.ItemType;
			var data = metaData.Data;

			//Naming works as follows 
			//FieldObject
			//	Get a field from an objects details
			//ControlField
			//	Get a control from an fields details
			switch (itemType)
			{
				case "ViewField":
					var smartName = (typeof metaData.FieldObject !== "undefined") ? metaData.FieldObject.replace(metaData.FieldObject.split("_")[0] + "_", "") : "";
					draggingNode = this.targetContextContainer.targetContextCanvas("getDraggingNode", [{ FieldObject: metaData.FieldObject }, { id: smartName }]);
					break;
				case "ObjectProperty":
				case "MethodOptionalProperty":
				case "MethodReturnProperty":
				case "MethodRequiredProperty":
					var objectProperty = soGuid + "_" + name;
					//find control if not found find field
					draggingNode = this.targetContextContainer.targetContextCanvas("getDraggingNode", [{ ControlField: objectProperty }, { FieldObject: objectProperty }, { Name: objectProperty }], false);
					break;
				case "Control":
					//find object if not found find field
					var smartName = (typeof metaData.ControlField !== "undefined") ? metaData.ControlField.replace(metaData.ControlField.split("_")[0] + "_", "") : "";
					draggingNode = this.targetContextContainer.targetContextCanvas("getDraggingNode", [{ id: smartName }, { FieldControl: guid }], true);
					break;
				case "ViewParameter":
					// NOTE: this code should be refactored. This is a hack using the given html to try and figure out the correct context

					// first check if context is a form
					var firstElement = this._parentElement.find("li.children.form");

					if (checkExists(firstElement))
					{
						var parentText = firstElement.attr("title");

						var elements = this.targetContextContainer.find("li.form");
						if (elements.length > 0)
						{
							var root = jQuery(elements[0]);
							var formMetaData = root.metadata();
							if (formMetaData.DisplayName !== undefined && formMetaData.DisplayName === parentText)
							{
								var parametersContainer = root.find("li.parameters");
								if (parametersContainer.length > 0)
								{
									var parameters = jQuery(parametersContainer[0]).find("li");
									if (parameters.length > 0)
									{
										var len = parameters.length;
										for (var i = 0; i < len; i++)
										{
											var paramData = jQuery(parameters[i]).metadata();
											if (paramData.id === name)
											{
												draggingNode = this.targetContextContainer.targetContextCanvas("getDraggingNode",
													[{ id: paramData.id }]);
												break;
											}
										}
									}
								} // parametersContainer.length > 0
							} // formMetaData.DisplayName !== undefined && formMetaData.DisplayName === parentText
						} // elements.length > 0
					} // checkExists(firstElement)
					break;
			}

			if (draggingNode)
			{
				var tokenbox = this.dropElements[h].find("input");
				tokenbox.tokenbox("clear");
				tokenbox.tokenbox("setOption", "value", [draggingNode]);
				dropElementParent.find("input.input-control[type=checkbox]").checkbox("check");
			}
			else
			{
				dropElementParent.find("input.input-control[type=checkbox]").checkbox("uncheck");
			}
		}
	},

	clearAllValues: function (e)
	{
		///<summary>
		///Loop through all the mappings or token boxes and clear all mappings
		///</summary>
		for (var h = 0; h < this.dropElements.length; h++)
		{
			this.dropElements[h].find("input").tokenbox('clear');
			this.dropElements[h].find("input").tokenbox('blur');
			this.dropElements[h].parent().find("input.input-control[type=checkbox]").checkbox("uncheck");
		}

		///Disable the clear button since clear all, clears all the values
		var clearButton = this._parentElement.closest(".wizard-step-content").find(".toolbar .toolbar-button.delete");
		if (clearButton.length === 0)
		{
			clearButton = this._parentElement.closest(".pane-container").find(".toolbar .toolbar-button.delete");
		}
		clearButton.addClass("disabled");
	},

	clearSelectedValue: function (e)
	{
		///<summary>
		///Clear the selected mapping or token boxe
		///</summary>
		var clearButton = this._parentElement.closest(".wizard-step-content").find(".toolbar .toolbar-button.delete");
		if (clearButton.length === 0)
			clearButton = this._parentElement.closest(".pane-container").find(".toolbar .toolbar-button.delete");
		if (!clearButton.hasClass('disabled'))
		{
			this.focussedTokenbox.parent().parent().find("input.input-control[type=checkbox]").checkbox("uncheck");
			var focussedTokenboxInput = this.focussedTokenbox.parent().find("input");
			focussedTokenboxInput.tokenbox('clear');

			clearButton.addClass("disabled");
		}
	},

	validate: function (propertyName, propertyDisplayName, isRequired, hasSource, hasSingleTextValue, textValue)
	{
		//required validation
		if (isRequired && (!hasSource || hasSingleTextValue && textValue === ""))
		{
			var results = Resources.RuleDesigner.ValidationRequiredFailed.format(propertyDisplayName);
			return results.format(propertyDisplayName);
		}
		return true;
	},

	validationFailureAction: function (title, message)
	{
		popupManager.showError(title, message);
	},

	createSettingsMapping: function (options, value)
	{
		var itemType = options.Target.ItemType;
		var name = checkExists(options.Target.Name) ? options.Target.Name.xmlEncode() : "";
		var displayName = checkExists(options.Target.DisplayName) ? options.Target.DisplayName.xmlEncode() : "";

		var mapping =
			'<Mapping ActionPropertyCollection="' + options.ActionPropertyCollection + '" ' + 'Type="' + options.Type + '">' +
				'<Item ' +
					'ActionPropertyCollection="' + options.ActionPropertyCollection + '" ' +
					'ContextType="target" ' +
					'Name="' + name + '" ' +
					'Icon="text" ' +
					'ItemType="' + itemType + '" ' +
					'DisplayName="' + displayName + '" ' +
				'/>' +
					value +
			'</Mapping>';

		return mapping;
	},

	createInputMapping: function (options, value)
	{
		var itemType = options.Target.ItemType;
		var name = checkExists(options.Target.Name) ? options.Target.Name.xmlEncode() : "";
		var displayName = checkExists(options.Target.DisplayName) ? options.Target.DisplayName.xmlEncode() : "";

		var mapping =
			'<Mapping ActionPropertyCollection="' + options.ActionPropertyCollection + '" ' + 'Type="' + options.Type + '">' +
				'<Item ' +
					'ContextType="target" ' +
					'Guid="' + options.Target.Guid + '" ' +
					'InstanceID="' + options.Target.InstanceID + '" ' +
					'ItemType="' + itemType + '" ' +
					'Name="' + name + '" ' +
					'SubFormInstanceID="' + options.Target.SubFormInstanceID + '" ' +
					'SubFormID="' + options.Target.SubFormID + '" ' +
					'DisplayName="' + displayName + '"' +
				'/>' +
					value +
			'</Mapping>';

		return mapping;
	},

	createActionPropertyCollectionMapping: function (options, value)
	{
		var itemType = options.Target.ItemType;
		var name = checkExists(options.Target.Name) ? options.Target.Name.xmlEncode() : "";
		var displayName = checkExists(options.Target.DisplayName) ? options.Target.DisplayName.xmlEncode() : "";
		var controlField = checkExists(options.ControlField) ? options.ControlField : "";

		var mapping =
			'<Mapping ActionPropertyCollection="' + options.ActionPropertyCollection + '" ' + 'Type="' + options.Type + '">' +
				'<Item ' +
					'ActionPropertyCollection="' + options.ActionPropertyCollection + '" ' +
					'Category="0" ' +
					'ContextType="target" ' +
					'ControlField="' + controlField + '" ' +
					'Guid="' + options.Target.Guid + '" ' +
					'InstanceID="' + options.Target.InstanceID + '" ' +
					'ItemType="' + itemType + '" ' +
					'Name="' + name + '" ' +
					'DisplayName="' + displayName + '" ' +
					'SubFormInstanceID="' + options.Target.SubFormInstanceID + '" ' +
					'SubFormID="' + options.Target.SubFormID + '" ' +
				'/>' +
					value +
			'</Mapping>';

		return mapping;
	},

	precalculatedValuesTemplate: '<Item ContextType="value">{0}</Item>',

	valueWithNameTemplate: '<Item ContextType="{1}" ItemType="{0}" Name="{2}" TargetID="{3}" TargetPath="{4}" SourceID="{5}" SourcePath="{6}" InstanceID="{7}" SubFormID="{8}" id="{2}" DisplayName="{9}" SubFormInstanceID="{10}"/>',

	valueWithGuidTemplate: '<Item ContextType="{4}" Guid="{0}" InstanceID="{1}" ItemType="{2}" SubFormInstanceID="{7}" SubFormID="{3}" Name="{5}" DisplayName="{6}"/>',

	// sample options properties:
	// options = {
	//	Type: this.ResultName, // text value
	//	TokenboxValue: tokenboxValueObjects, // an Array
	//	ActionPropertyCollection: metadata.ActionPropertyCollection, // text value
	//  ControlField: checkExists(metadata.ControlField) ? metadata.ControlField : "", //guid
	//	Target: {
	//		ItemType: metadata.ItemType, //text value
	//		Name: metadata.Name, //text value
	//		DisplayName: checkExists(metadata.DisplayName) ? metadata.DisplayName : "", 
	//		Guid: metadata.Guid, // do not assign an empty guid if it doesn't exist
	//		InstanceID: checkExists(metadata.InstanceID) ? metadata.InstanceID : "00000000-0000-0000-0000-000000000000",
	//		SubFormID: checkExists(metadata.SubFormID) ? metadata.SubFormID : "00000000-0000-0000-0000-000000000000"
	//	},
	//}
	_getMapping: function (options)
	{
		if (checkExists(options.TokenboxValue) && options.TokenboxValue.length > 0)
		{
			var value = this._getSourcePartialMapping(options);

			if (checkExists(options.Type) && (options.Type.toUpperCase() === "SETTINGS" || options.Type.toUpperCase() === "PROCESSLOADINPUT"))
			{
				return this.createSettingsMapping(options, value);
			}
			else if (checkExistsNotEmpty(options.Target.Guid))
			{
				return this.createActionPropertyCollectionMapping(options, value);
			}
			else
			{
				return this.createInputMapping(options, value);
			}
		}
		else
		{
			return "";
		}
	},

	_getSourcePartialMapping: function(options)
	{
		var value;
		if (options.TokenboxValue.length === 1) // so don't put a single value under SourceValue like we do for mulitple values
		{
			var valueData = options.TokenboxValue[0].data;

			if (typeof valueData === "string") // Target is a value only. If it isn't an objecct returned from the tokenbox, we know it's a simple text value.
			{
				value = this.precalculatedValuesTemplate.format(valueData.xmlEncode());
			}
			else
			{
				var displayName = checkExistsNotEmpty(valueData.DisplayName) ? valueData.DisplayName : "";
				if (displayName === "" && checkExists(valueData.text))
				{
					displayName = valueData.text;
				}

				if (checkExistsNotEmpty(valueData.Name) && valueData.ItemType !== "ViewField" && valueData.ItemType !== "Control" && valueData.ItemType !== "Expression" && valueData.ItemType !== "ViewSource") // ViewParameter will go in here. 
				{
					value = this.valueWithNameTemplate.format(
						/*0*/valueData.ItemType,
						/*1*/options.TokenboxValue[0].type,
						/*2*/valueData.Name,
						/*3*/checkExists(valueData.TargetID) ? valueData.TargetID : "",
						/*4*/checkExists(valueData.TargetPath) ? valueData.TargetPath : "",
						/*5*/checkExists(valueData.SourceID) ? valueData.SourceID : "",
						/*6*/checkExists(valueData.SourcePath) ? valueData.SourcePath : "",
						/*7*/checkExists(valueData.InstanceID) ? valueData.InstanceID : "",
						/*8*/checkExists(valueData.SubFormID) ? valueData.SubFormID : "",
						/*9*/displayName.xmlEncode(),
						/*10*/checkExistsNotEmpty(valueData.SubFormInstanceID) ? valueData.SubFormInstanceID : ""
						);
				}
				else //if (checkExistsNotEmpty(valueData.Guid)) //  ViewField, Control, Expression will go in here
				{
					value = this.valueWithGuidTemplate.format(
						/*0*/valueData.Guid,
						/*1*/checkExists(valueData.InstanceID) ? valueData.InstanceID : "",
						/*2*/valueData.ItemType,
						/*3*/checkExists(valueData.SubFormID) ? valueData.SubFormID : "",
						/*4*/options.TokenboxValue[0].type,
						/*5*/checkExists(options.TokenboxValue[0].data.Name) ? options.TokenboxValue[0].data.Name.xmlEncode() : "",
						/*6*/checkExists(options.TokenboxValue[0].data.DisplayName) ? options.TokenboxValue[0].data.DisplayName.xmlEncode() : "",
						/*7*/checkExistsNotEmpty(valueData.SubFormInstanceID) ? valueData.SubFormInstanceID : ""
						);
				}
			}
		}
		else
		{
			value = this.precalculatedValuesTemplate.format(this._toSourceValueXML(options.TokenboxValue));
		}

		return value;
	},

	_toSourceValueXML: function (valobj)
	{
		var result = "";

		if (valobj.length > 0)
		{
			result = "<SourceValue>";

			$.each(valobj, function (k, v)
			{
				if (v.type === "value")
				{
					result += "<Item ContextType=\"value\">{0}</Item>".format(v.data.xmlEncode());
				}
				else
				{
					result += "<Item ContextType=\"context\"";

					$.each(v.data, function (l, w)
					{
						result += " {0}=\"{1}\"".format(l, w.toString().xmlEncode());
					});

					result += " />";
				}
			});
			result += "</SourceValue>";
		}

		return result;
	},

	getConfigurationXML: function ()
	{
		var _this = this;
		var mappingXml = "<Mappings>";
		var validationFailures = "";
		for (var j = 0; j < this.dropElements.length; j++)
		{
			var targetDocEl = this.dropElements[j].parent();
			var checkbox = targetDocEl.find(">label input.input-control[type=checkbox]");
			var check = (checkbox.length > 0) ? checkbox.is(':checked') : true;

			var metadata = targetDocEl.metadata();
			var tokenboxInstance = this.dropElements[j].find("input");
			var isRequired = tokenboxInstance.tokenbox("option", "required");
			var hasValue = false;
			var textValue = "";
			var hasSingleTextValue = false;
			var nameOrGuid = "";
			var validationResult;
			var titleElement = targetDocEl.find("label");

			if (titleElement.length === 0)
			{
				titleElement = targetDocEl.find("span");
			}
			var propertyDisplayName = titleElement[0].getAttribute("title");

			if (check === true)
			{
				var tokenboxValueObjects = tokenboxInstance.tokenbox("value");
				if (tokenboxValueObjects.length === 0 && !tokenboxInstance.tokenbox("disabled") && checkbox.length > 0)
				{
					tokenboxValueObjects = [{ data: "", text: "", type: "value" }];
				}

				if (tokenboxValueObjects.length === 0)
				{
					if (isRequired)
					{
						validationResult = this.validate(metadata.Name, propertyDisplayName, isRequired, hasValue, hasSingleTextValue, textValue);
						if (validationResult !== true && validationFailures === "")
						{
							validationFailures = validationResult;
							break;
						}
					}
					continue;
				}

				var displayName = checkExists(metadata.DisplayName) ? metadata.DisplayName : "";
				if (displayName === "")
				{
					if (checkExists(metadata.text))
					{
						displayName = metadata.text;
					}
					else if (checkExists(metadata.Value))
					{
						displayName = metadata.Value;
					}
				}

				var options =
				{
					Type: this.ResultName,
					TokenboxValue: tokenboxValueObjects,
					ActionPropertyCollection: metadata.ActionPropertyCollection,
					ControlField: checkExists(metadata.ControlField) ? metadata.ControlField : "",
					Target:
					{
						ItemType: metadata.ItemType,
						Name: metadata.Name,
						DisplayName: displayName,
						Guid: checkExists(metadata.Guid) ? metadata.Guid : "",
						InstanceID: checkExists(metadata.InstanceID) ? metadata.InstanceID : "00000000-0000-0000-0000-000000000000",
						SubFormID: checkExists(metadata.SubFormID) ? metadata.SubFormID : "00000000-0000-0000-0000-000000000000",
						SubFormInstanceID: checkExists(metadata.SubFormInstanceID) ? metadata.SubFormInstanceID : "00000000-0000-0000-0000-000000000000"
				}
				};

				mappingXml += this._getMapping(options);

				// validation values
				hasValue = true;
				var hasSingleValue = tokenboxValueObjects.length === 1;
				nameOrGuid = checkExistsNotEmpty(options.Target.Guid) ? options.Target.Guid : options.Target.Name;

				if (hasSingleValue && tokenboxValueObjects[0].type === "value")
				{
					hasSingleTextValue = true;
					textValue = tokenboxValueObjects[0].data;
				}
			}

			validationResult = this.validate(nameOrGuid, propertyDisplayName, isRequired, hasValue, hasSingleTextValue, textValue);
			if (validationResult !== true && validationFailures === "")
			{
				validationFailures = validationResult;
			}
		}
		//if (checkExists(this._invalidMappingWidget))
		//{
		//	mappingXml += this._invalidMappingWidget.getInvalidMappingsXml();
		//}
		mappingXml += "</Mappings>";

		if (validationFailures !== "")
		{
			this.validationFailureAction(validationFailures);
			return false;
		}

		return mappingXml;
	},

	_onTokenboxKeypress: function (ev)
	{
		if (ev.keyCode === 13)
		{
			var tokenbox = $(ev.target);
			var li = tokenbox.closest("li"), liNext = li.next();
			if (li.length > 0 && liNext.length > 0)
			{
				// Find the next available tokenbox within the same grouping to set focus on
				liNext.find(".mappings-input > input[type=text]").eq(0).tokenbox("focus");
			}
			else
			{
				// Find the next available tokenbox in the next grouping to set focus on
				while (li.parent("ul").parent("li").length > 0)
				{
					li = li.parent("ul").parent("li");

					liNext = li.next(".open");

					if (li.length > 0 && liNext.length > 0)
					{
						liNext.find(".mappings-input > input[type=text]").eq(0).tokenbox("focus");
						break;
					}
				}
			}
		}
	},

	_onTokenboxDropFocus: function (ev)
	{
		///<summary>
		///Enable the Clear Mapping button, check the checkbox next to the mapping input and set the selected token box
		///</summary>
		var tokenbox = $(ev.target);

		var checkbox = tokenbox.parent().prev().find("input[type=checkbox]");

		if (!checkbox.is(":checked"))
		{
			checkbox.checkbox("check");
		}
		this.focussedTokenbox = tokenbox;
		tokenbox.closest(".pane-container").find('.toolbar a.toolbar-button.delete.disabled').removeClass('disabled');
	}
};
