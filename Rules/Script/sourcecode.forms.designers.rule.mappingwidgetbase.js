// Namespacing the Designer.
if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
if (typeof SourceCode.Forms.Designers === "undefined" || SourceCode.Forms.Designers === null) SourceCode.Forms.Designers = {};
if (typeof SourceCode.Forms.Designers.Rule === "undefined" || SourceCode.Forms.Designers.Rule === null) SourceCode.Forms.Designers.Rule = {};

(function ($)
{
    var Types = SourceCode.Forms.Types;

    //this is the mapping widget base
    //it gets its targetXml data from the specified plugin in the utils item xml format.
    //it then displays the xml and saves a result.
    SourceCode.Forms.Designers.Rule.MappingWidgetBase = function (options)
    {
        ///<summary>
        ///this is the mapping widget base
        ///it gets its targetXml data from the specified plugin in the utils item xml format.
        ///it then displays the xml and saves a result.
        ///</summary>
        this._options = {};
        jQuery.extend(this._options, this._defaultOptions);
        this.setOptions(options);
        this._analyzerService = SourceCode.Forms.Services.AnalyzerResourcesService();
    }

    var _mappingWidgetBasePrototype =
    {
        element: null,
        _defaultOptions:
        {
            renderToolbar: true,
            renderPanel: true,
            parentElement: null,
            targetHeadingText: "* Mappings"
        },
        _options: null,
        _model: null,
        _treeModel: null,
        _analyzerService: null,
        _renderEnhancedSubTypeNodes: null,

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

        getOption: function (option)
        {
            return this._options[option];
        },

        initialize: function (parentElement)
        {
            this.setOption("parentElement", parentElement);

            if (this.getOption("renderToolbar") === true)
            {
                this._populateToolbar();
            }

            this._model = [];
            this.lazyLoadItemTypes = ["ViewField"]; // This is an array for incase we want to lazyload more than one item type

            if (checkExists(this.TargetHeading))
            {
                this.setOption("targetHeadingText", this.TargetHeading);
            }

            //end build xpath
            if (checkExists(this.targetXml))
            {
                this._transformXml();
                this._buildUI();
            }
        },

        _populateToolbar: function ()
        {
            var parentElement = this.getOption("parentElement");
            var tb = parentElement.closest(".wizard-step-content").find(".toolbar");

            if (tb.length === 0)
            {
                tb = parentElement.closest(".pane-container").find(".pane .toolbar").first();

                if (tb.length === 0)
                {
                    var toolbarWrapper = jQuery("<div class=\"toolbars single\"></div>");
                    tb = jQuery(SourceCode.Forms.Controls.Toolbar.html());
                    toolbarWrapper.append(tb);
                    parentElement.closest(".pane-container").children(".pane:first-child").append(toolbarWrapper);
                }
            }

            tb.toolbar();
            tb.toolbar("add", "button", { id: "autoMapButton_BasicMappingWidget", icon: "auto-map", text: ContextTree_AutoMap_Values, description: ContextTree_AutoMap_Values, disabled: false });
            tb.toolbar("add", "button", { id: "clearAllButton_BasicMappingWidget", icon: "delete-all", text: ContextTree_Clear_AllValues, description: ContextTree_Clear_AllValuesDesc, disabled: false });
            tb.toolbar("add", "button", { id: "clearSelectedButton_BasicMappingWidget", icon: "delete", text: ContextTree_Clear_SelectedValue, description: ContextTree_Clear_SelectedValueDesc, disabled: true });

            var toolbarItems = tb.toolbar("fetch", "buttons");
            jQuery(toolbarItems[0]).on("click", this.automapValues.bind(this));
            jQuery(toolbarItems[1]).on("click", this.clearAllValues.bind(this));
            jQuery(toolbarItems[2]).on("click", this.clearSelectedValue.bind(this));

            // TODO:  Render the inline/targetMappingWidget toggle
            // Might not be here though, depends on behaviour when setConfigurationXML is fired
        },

        _buildUI: function ()
        {
            if (checkExistsNotEmpty(this.Settings.renderEnhancedSubTypePath))
            {
                this._renderEnhancedSubTypeNodes = [];
                // Convert to a real array for IE11.
                var xmlNodes = this.targetXml.selectNodes(this.Settings.renderEnhancedSubTypePath);
                for (var i = 0; i < xmlNodes.length; i++)
                {
                    this._renderEnhancedSubTypeNodes.push(xmlNodes[i]);
                }
            }

            this._treeModel = new Types.RuleMappingTargetItem({ listItemElem: jQuery("<div class='tree'><ul class='target-rule'></ul></div>"), toBeProcessed: true });

            this.getOption("parentElement").append(this._treeModel.listItemElem);
            if (this.getOption("renderPanel") === true)
            {
                this._treeModel.listItemElem.panel({ header: this.getOption("targetHeadingText"), fullsize: true, toolbars: 0, scrolling: true });
            }
            this.element = this._treeModel.listItemElem;
            this._treeModel.listItemElem.data("ruleMappingTargetItem", this._treeModel);

            this.filterTypes = checkExistsNotEmpty(this.filterTypes) ? this.filterTypes.split("|") : [];
            this.allowParentDroppables = checkExistsNotEmpty(this.Settings.allowParentDroppables) ? this.Settings.allowParentDroppables.split("|") : [];

            var mainList = this._treeModel.listItemElem.find("ul.target-rule");
            var excludeTypes = checkExists(this.excludeTypes) ? this.excludeTypes : [];
            var items = this.targetXml.selectNodes("Items/Item");

            for (var i = 0; i < items.length; i++)
            {
                var itemModel = this._populateWidget(items[i], excludeTypes, null);
                itemModel.parentListItemElem = this._treeModel.listItemElem;
                itemModel.parentRuleMappingTargetItem = this._treeModel;

                this._treeModel.childItems.addItem(itemModel);

                if (checkExists(itemModel.listItemElem))
                {
                    mainList.append(itemModel.listItemElem);
                }
            }

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

        /**
         * Recursively populates RuleMappingTargetItems hierarchical model structures.
         * @param {xmlNode} parentXmlNode - The recusrive parent Item xmlNode.
         * @param {array} excludeTypes - An array of excluded
         * @param {object} parentInfo - An Object populated by this._populateParentInfo function.
         * @returns {RuleMappingTargetItem} - The model for the parentXmlNode parameter.
         */
        _populateWidget: function (parentXmlNode, excludeTypes, parentInfo)
        {
            "use strict";

            var currentModel = new Types.RuleMappingTargetItem();
            currentModel.populateFromItemXml(parentXmlNode);

            var parentInfoForChild = this._populateParentInfo(parentInfo, currentModel);
            currentModel.level = parentInfoForChild.level;
            parentInfoForChild.level += 1;

            var itemXmlNodes = parentXmlNode.selectNodes("Items/Item");
            for (var i = 0; i < itemXmlNodes.length; i++)
            {
                var itemXmlNode = itemXmlNodes[i];

                var childModel = this._populateWidget(itemXmlNode, excludeTypes, parentInfoForChild);
                if (childModel.toBeProcessed)
                {
                    currentModel.toBeProcessed = true;
                }
                childModel.parentRuleMappingTargetItem = currentModel;

                currentModel.childItems.addItem(childModel);
            }

            var itemTypeExists = checkExistsNotEmpty(currentModel.itemType);
            var isParentDroppableType = itemTypeExists && this.allowParentDroppables.contains(currentModel.itemType);
            var isExcludedType = itemTypeExists && excludeTypes.contains(currentModel.itemType);
            var isFilterType = itemTypeExists && this.filterTypes.contains(currentModel.itemType) && !currentModel.toBeProcessed;

            currentModel.isMapping = !isExcludedType && (isFilterType || isParentDroppableType);
            currentModel.allowTextInput = isFilterType;
            currentModel.toBeProcessed = currentModel.isMapping || currentModel.toBeProcessed;
            currentModel.isReadOnly = Boolean(currentModel.readonly);
            currentModel.isRequired = Boolean(currentModel.required);
            currentModel.renderEnhancedSubType = this._renderEnhancedSubTypeNodes ? this._renderEnhancedSubTypeNodes.indexOf(parentXmlNode) > -1 : false;

            this._processItemModel(currentModel, parentInfo);

            return currentModel;
        },

        _populateParentInfo: function (parentInfo, parentModel)
        {
            if (!checkExists(parentInfo))
            {
                parentInfo =
                {
                    level: checkExists(parentModel.level) ? parentModel.level : 0,
                    parentControl: null,
                    parentSMO: null
                };
            }
            else
            {
                // Fast shallow copy to allow only top down transfer of data recursively and not back up by reference.
                parentInfo =
                {
                    level: parentInfo.level,
                    parentControl: parentInfo.parentControl,
                    parentSMO: parentInfo.parentSMO
                };
            }

            if (parentModel.itemType === "Control")
            {
                parentInfo.parentControl = parentModel;
            }

            if ((parentModel.itemType === "Object" || parentModel.itemType === "FieldContext") && checkExistsNotEmptyGuid(parentModel.guid))
            {
                parentInfo.parentSMO = parentModel;
            }

            return parentInfo;
        },

        _processItemModel: function (itemModel, parentInfo, forceRendering)
        {
            // Don't process an itemModel again if it's already been processed.
            if (checkExists(itemModel.listItemElem))
            {
                return true;
            }
            parentInfo = checkExists(parentInfo) ? parentInfo : {};

            var htmlCreated = false;

            if (itemModel.toBeProcessed)
            {
                if (itemModel.isMapping)
                {
                    if (itemModel.visibility !== "None")
                    {
                        var isVisible = true;

                        if (checkExists(parentInfo.parentControl) && itemModel.itemType === "ControlProperty")
                        {
                            var options =
                            {
                                controlType: parentInfo.parentControl.subType,
                                propertyId: itemModel.targetId,
                                controlId: parentInfo.parentControl.guid,
                                subDesignerType: "rules"
                            };

                            isVisible = SourceCode.Forms.Designers.Common.getPropertyDisplayFunctionResult(options);
                        }
                        // Always render invalid items mappings. They must be rendered in order to be cleared.
                        if (isVisible || itemModel.isInvalid)
                        {
                            htmlCreated = this._createMappingTarget(itemModel, forceRendering);
                        }
                    }
                }
                else
                {
                    this._createTreeNode(itemModel);
                    htmlCreated = true;
                }
            }

            // Miscellaneous if rendered.
            if (htmlCreated)
            {
                // Combine document fragments.
                var itemUL = jQuery(itemModel.listItemElem.find(">ul")[0]);
                var hasLazyLoadedChild = false;
                var hasRenderedChild = false;

                itemModel.childItems.foreach(function (childModel)
                {
                    if (checkExists(childModel.listItemElem))
                    {
                        itemUL.append(childModel.listItemElem);
                        hasRenderedChild = true;
                    }
                    else
                    {
                        hasLazyLoadedChild = childModel.toBeProcessed ? true : hasLazyLoadedChild;
                    }

                    // Complete parent references.
                    childModel.parentListItemElem = itemModel.listItemElem;
                });

                // Lazy load collapse.
                if (hasLazyLoadedChild && !hasRenderedChild && itemModel.listItemElem.hasClass("open"))
                {
                    itemModel.listItemElem.removeClass("open");
                    itemModel.listItemElem.addClass("closed");
                }

                // Bind the model to the DOM Elem.
                itemModel.listItemElem.data("ruleMappingTargetItem", itemModel);
            }

            // Carry over the parent SMO's Guid property to it's children.
            if (checkExists(parentInfo.parentSMO) && parentInfo.parentSMO !== itemModel)
            {
                if (parentInfo.parentSMO.itemType === "FieldContext")
                {
                    itemModel.soGuid = parentInfo.parentSMO.value;
                }
                else
                {
                    itemModel.soGuid = parentInfo.parentSMO.guid;
                }
            }

            return htmlCreated;
        },

        _createMappingTarget: function (itemModel, forceRendering)
        {
            if (!checkExistsNotEmpty(itemModel.displayName))
            {
                itemModel.displayName = Resources.ExpressionBuilder.UnresolvedObjectText.format(this._analyzerService.getReferenceType(itemModel.itemType));
            }

            var itemRendered = false;
            var accept = checkExistsNotEmpty(itemModel.accept) ? itemModel.accept : "";

            if (!(checkExists(this.lazyLoadItemTypes) && this.lazyLoadItemTypes.indexOf(itemModel.itemType) !== -1) || forceRendering)
            {
                var lineHtml = '<li style="position:relative;" class="dropLabel"></li>';
                itemModel.listItemElem = jQuery(lineHtml);

                switch (itemModel.renderLabelAs)
                {
                    case "text":
                        itemModel.listItemElem.addClass(itemModel.icon);
                        itemModel.listItemElem.append("<span style='display:inline-block;' title='" + itemModel.displayName.htmlEncode() + "'>" + itemModel.displayName.htmlEncode() + ":</span>");
                        break;
                    case "checkbox":
                    default:
                        itemModel.listItemElem.append(SCCheckbox.html(
                        {
                            label: itemModel.displayName,
                            icon: itemModel.icon,
                            disabled: false,
                            description: checkExistsNotEmpty(itemModel.tooltip) ? itemModel.tooltip : itemModel.displayName
                        }));

                        itemModel.checkboxElem = itemModel.listItemElem.find("input.input-control[type=checkbox]").checkbox();
                        if (itemModel.isChecked === true)
                        {
                            itemModel.checkboxElem.checkbox("check");
                        }
                        itemModel.checkboxElem.on("change", this._checkBoxChange.bind(this));

                        if (itemModel.itemType === 'MethodRequiredProperty' || itemModel.required === "true")
                        {
                            itemModel.listItemElem.addClass('required');
                            itemModel.isRequired = true;
                        }

                        itemModel.checkboxElem.on("change", function (ev)
                        {
                            ev.stopPropagation(); // Stop propagation so that the tree structure does not collapse
                        });
                        break;
                }

                if (itemModel.renderEnhancedSubType && checkExistsNotEmpty(itemModel.subType))
                {
                    itemModel.tokenboxElem = jQuery("<div class='mappings-input'></div>");

                    var options = {};

                    options.change = this._twistyChange.bind(this);
                    options.toggle = this._twistyChange.bind(this);
                    options.focus = this._onTokenboxDropFocus.bind(this);

                    options.subType = itemModel.subType;
                    options.mappable = itemModel.isMapping;
                    options.readOnly = itemModel.isReadOnly;

                    itemModel.tokenboxElem.twisty(options);
                    itemModel.listItemElem.append(itemModel.tokenboxElem);
                }

                if (!itemModel.tokenboxElem)
                {
                    switch (itemModel.renderInputAs)
                    {
                        case "textbox":
                            // Render a textbox for items with Values.
                            itemModel.tokenboxElem = jQuery(SCTextbox.html({ value: itemModel.value, readonly: itemModel.isReadOnly }));
                            itemModel.tokenboxElem.addClass("mappings-input");
                            itemModel.tokenboxElem.textbox();

                            itemModel.listItemElem.append(itemModel.tokenboxElem);
                            break;
                        case "tokenbox":
                        default:
                            var tokenboxContainer = jQuery("<div class=\"mappings-input\"><input type=\"text\"/></div>");
                            itemModel.tokenboxElem = tokenboxContainer.find("input").tokenbox({
                                accept: ".ui-draggable " + accept,
                                focus: this._onTokenboxDropFocus.bind(this),
                                change: this._tokenBoxChange.bind(this),
                                keypress: this._onTokenboxKeypress.bind(this),
                                multiValue: this.ResultName !== "Output" && this.ResultName !== "ProcessLoadOutput" && this.ResultName !== "ProcessStartOutput",
                                allowTextInput: itemModel.allowTextInput,
                                watermark: Resources.ContextTree.Tree_DropItemMessage.htmlEncode(),
                                required: itemModel.isRequired,
                                droppableEnabled: false
                            });

                            if (checkExists(itemModel.mappings))
                            {
                                itemModel.tokenboxElem.tokenbox("value", itemModel.mappings);
                            }

                            if (itemModel.isReadOnly === true)
                            {
                                itemModel.tokenboxElem.tokenbox("disable");
                            }

                            this.addDroppableEvents(itemModel.listItemElem, itemModel.tokenboxElem);
                            itemModel.listItemElem.append(tokenboxContainer);
                            break;
                    }
                }

                itemModel.listItemElem.find("input.drop-text").on("click", function (ev)
                {
                    ev.stopPropagation(); // Stop propagation so that the tree structure does not collapse
                });

                if (itemModel.childItems.length() > 0)
                {
                    itemModel.listItemElem.append("<ul class='target-rule target-rule-level-{0}' style='padding-top:3px;'></ul>".format(itemModel.level));

                    itemModel.listItemElem.addClass("children open");
                    itemModel.listItemElem.css("height", "100%");
                }

                if (itemModel.required === "true" || itemModel.required === true)
                {
                    itemModel.listItemElem.addClass("required");
                }

                itemRendered = true;
            }

            return itemRendered;
        },

        _createTreeNode: function (itemModel)
        {
            var _this = this;

            var itemType = itemModel.itemType;
            if (itemType === "View" || itemType === "Form" || itemType === "FieldContext" || itemType === "Object")
            {
                itemModel.tooltip = SourceCode.Forms.Interfaces.AppStudio.formatTitleForSystemName(itemModel.name, itemModel.description);
            }
            else
            {
                itemModel.tooltip = itemModel.displayName;
            }

            var newLi = "<li class='children open {0}'><span title='{1}'>{2}</span><ul class='target-rule target-rule-level-{3}'></ul></li>";
            newLi = newLi.format(itemModel.icon, itemModel.tooltip.htmlEncode(), itemModel.displayName.htmlEncode(), itemModel.level);

            itemModel.listItemElem = jQuery(newLi);
            itemModel.listItemElem.on("click", function (ev)
            {
                if (!(jQuery(ev.target).is('span') || jQuery(ev.target).is('a.styling-font') || jQuery(ev.target).hasClass('input-control')))
                {
                    var $target = jQuery(ev.target).closest("li"); //will return ev.target if ev.target is an li, no need to do conditional searches, etc.
                    _this.expandCollapseMappings($target);
                }

                ev.stopPropagation();
            });
        },

        addDroppableEvents: function (line, tokenbox)
        {
            var timeout = null;
            var tokenboxRef = tokenbox;
            var lineTokenState = false;
            line.on("mouseenter.basicmapping", function (event)
            {
                if (checkExists(jQuery.ui.ddmanager.current) && checkExists(jQuery.ui.ddmanager.current.helper))
                {
                    if (checkExists(timeout))
                    {
                        clearTimeout(timeout);
                    }
                    else
                    {
                        lineTokenState = true;
                        tokenboxRef.tokenbox("enableDroppable");
                        jQuery.ui.ddmanager.prepareOffsets($.ui.ddmanager.current, event);
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

        loadChildItems: function (parentRuleMappingTargetItem)
        {
            var parentInfo = this._populateParentInfo(null, parentRuleMappingTargetItem);
            parentInfo.level += 1;

            parentRuleMappingTargetItem.childItems.foreach(function (childRuleMappingTargetItem)
            {
                this.loadChildItem(childRuleMappingTargetItem, parentInfo);
            }, this);
        },

        loadChildItem: function (childRuleMappingTargetItem, parentInfo)
        {
            if (checkExists(childRuleMappingTargetItem.parentListItemElem) && !checkExists(childRuleMappingTargetItem.listItemElem))
            {
                if (!checkExists(parentInfo) && checkExists(childRuleMappingTargetItem.parentListItemElem))
                {
                    var parentModel = childRuleMappingTargetItem.parentListItemElem.data("ruleMappingTargetItem");
                    parentInfo = this._populateParentInfo(null, parentModel);
                    parentInfo.level += 1;
                }

                if (this._processItemModel(childRuleMappingTargetItem, parentInfo, true))
                {
                    childRuleMappingTargetItem.parentListItemElem.find(">ul").append(childRuleMappingTargetItem.listItemElem);
                }
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
                $target.addClass("open");
                $target.removeClass("closed");
                $target.next("ul").show();

                if (!$target.hasClass("childrenLoaded"))
                {
                    var parentRuleMappingTargetItem = $target.data("ruleMappingTargetItem");
                    if (checkExists(parentRuleMappingTargetItem))
                    {
                        this.loadChildItems(parentRuleMappingTargetItem);
                    }
                }
            }
        },

        revertQueryObject: function (queryObject)
        {
            if (checkExists(queryObject) && checkExists(queryObject.itemType) && queryObject.itemType === "ObjectProperty,MethodRequiredProperty,MethodOptionalProperty,MethodReturnProperty")
            {
                queryObject.itemType = "ObjectProperty";
            }

            if (checkExists(queryObject) && checkExists(queryObject.itemType) && queryObject.itemType === "FieldContext")
            {
                queryObject.itemType = "ViewSource";
            }
        },

        adjustQueryObject: function (queryObject)
        {
            if (checkExists(queryObject) && checkExists(queryObject.itemType) && queryObject.itemType === "ObjectProperty")
            {
                queryObject.itemType = "ObjectProperty,MethodRequiredProperty,MethodOptionalProperty,MethodReturnProperty";
            }

            if (checkExists(queryObject) && checkExists(queryObject.itemType) && queryObject.itemType === "ViewSource")
            {
                queryObject.itemType = "FieldContext";
            }
        },

        buildQueryObject: function (targetItem)
        {
            var queryObject = {};

            queryObject.guid = getNodeAttribute("Guid", targetItem, null, checkExistsNotEmpty);
            queryObject.targetID = getNodeAttribute("TargetID", targetItem, null, checkExistsNotEmpty);
            queryObject.itemType = getNodeAttribute("ItemType", targetItem, null, checkExistsNotEmpty);
            queryObject.name = getNodeAttribute("Name", targetItem, null, checkExistsNotEmpty);
            queryObject.targetPath = getNodeAttribute("TargetPath", targetItem, null, checkExistsNotEmpty);
            queryObject.subformId = getNodeAttribute("SubFormID", targetItem, null, checkExistsNotEmptyGuid);
            queryObject.subformInstanceId = getNodeAttribute("SubFormInstanceID", targetItem, null, checkExistsNotEmptyGuid);
            queryObject.instanceId = getNodeAttribute("InstanceID", targetItem, null, checkExistsNotEmptyGuid);

            if (queryObject.name)
            {
                queryObject.name = queryObject.name.encodeSeparator(",");
            }

            // Extra adjustments.
            switch (queryObject.itemType)
            {
                case "ViewSource":
                    // Issue with ViewSource getting it's Name and DisplayName mixed up.
                    queryObject.name = null;
                    break;
                default:
                    break;
            }

            return queryObject;
        },

        // For external access to the model
        findObjectInModel: function (queryObject, matchMultiple)
        {
            if (matchMultiple !== true)
            {
                matchMultiple = false;
            }

            var result = findObjectInArrayMatchingAll({
                queryObject: queryObject,
                targetObject: this._treeModel,
                matchMultiple: matchMultiple,
                splitQueryObjectDelimiter: ",",
                sourcePropertiesContainMultipleValues: true,
                blacklist: ["parentRuleMappingTargetItem"]
            });

            return result;
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
            var draggingNodeSearchObject = {};

            var itemType = itemNode.getAttribute("ItemType");
            if (itemType === "ViewParameter" || itemType === "FormParameter")
            {
                draggingNodeSearchObject.id = itemNode.getAttribute("Name");
                draggingNodeSearchObject.ItemType = itemType;
            }
            else if (itemType === "ControlProperty" || itemType === "ControlField")
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

            switch (itemType)
            {
                case "SystemVariable":
                case "EnvironmentField":
                    draggingNodeSearchObject.SubFormID = getNodeAttribute("SubFormID", itemNode, null, checkExistsNotEmptyGuid);
                    break;
                default:
                    draggingNodeSearchObject.SubFormID = getNodeAttribute("SubFormID", itemNode, "00000000-0000-0000-0000-000000000000", checkExistsNotEmpty);
                    break;
            }
            draggingNodeSearchObject.InstanceID = getNodeAttribute("InstanceID", itemNode, null, checkExistsNotEmptyGuid);
            draggingNodeSearchObject.SubFormInstanceID = getNodeAttribute("SubFormInstanceID", itemNode, null, checkExistsNotEmptyGuid);

            if (checkExists(delegatedMethods) && typeof delegatedMethods.getContextTreeSearchObject === "function")
            {
                draggingNodeSearchObject = delegatedMethods.getContextTreeSearchObject(itemNode, draggingNodeSearchObject);
            }

            return draggingNodeSearchObject;
        },

        _getConfigurationDraggingNode: function (itemNode, draggingNodeSearchObject)
        {
            var draggingNode = null;
            var itemType = itemNode.getAttribute("ItemType");
            var itemResolved = true;

            if (checkExists(this.targetContextContainer) && checkExists(this.targetContextContainer.targetContextCanvas))
            {
                draggingNode = this.targetContextContainer.targetContextCanvas("getDraggingNode", draggingNodeSearchObject);
                if (!checkExists(draggingNode))
                {
                    draggingNode = this.targetContextContainer.targetContextCanvas("getContextNode", { document: this.contextsXml, item: itemNode });
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
                    draggingNode = this.targetContextContainer.targetContextCanvas("getPartialDraggingNode", parentMetadata, childMetadata);
                }
            }

            if (!checkExists(draggingNode))
            {
                itemResolved = false;
                // Attempt to get the display name of item, falling back on the system name, or ultimately its type to use for display
                var itemName = itemNode.getAttribute("DisplayName");
                if (!checkExistsNotEmpty(itemName))
                {
                    itemName = itemNode.getAttribute("Name");

                    if (!checkExistsNotEmpty(itemName))
                    {
                        itemName = Resources.ExpressionBuilder.UnresolvedObjectText.format(
                            this._analyzerService.getReferenceType(itemType)
                        );
                    }
                }

                draggingNode = {
                    type: "context",
                    data:
                    {
                        icon: SourceCode.Forms.Designers.Common.getItemTypeIcon(itemType) + " error",
                        text: itemName, Invalid: "true"
                    },
                    display: itemName,
                    text: itemName,
                    tooltip: this._analyzerService.getReferenceStatusTitle("Missing").format(itemName, this._analyzerService.getReferenceType(itemType))
                };

                // Copy over the XML attributes to be preserved.
                for (var t = 0; t < itemNode.attributes.length; t++)
                {
                    var xmlAttr = itemNode.attributes[t].name;
                    switch (xmlAttr)
                    {
                        case "ContextType":
                        case "Invalid":
                        case "ValidationMessages":
                            break;
                        default:
                            draggingNode.data[xmlAttr] = itemNode.attributes[t].value;
                            break;
                    }
                }
            }

            var validationMessages = itemNode.getAttribute("ValidationMessages");
            if (checkExistsNotEmpty(validationMessages))
            {
                var validationMessagesArray = this._analyzerService.parseValidationMessage(validationMessages);
                for (var i = 0; i < validationMessagesArray.length; i++)
                {
                    var validationMsg = validationMessagesArray[i];

                    if (!(validationMsg.status === "Missing" && itemResolved === true))
                    {
                        var validationMessageItemType = this._analyzerService.getReferenceType(validationMsg.type);
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

                        draggingNode.tooltip = this._analyzerService.getReferenceStatusTitle(validationMsg.status).format(displayName, validationMessageItemType);
                        draggingNode.text = displayName;
                        draggingNode.display = displayName;
                        draggingNode.data.text = displayName;
                        draggingNode.data.icon = SourceCode.Forms.Designers.Common.getItemTypeIcon(itemType, validationMsg.subType) + " error";
                        draggingNode.data.Invalid = "true";
                        draggingNode.data.ValidationMessages = validationMessages;
                    }
                }
            }

            return draggingNode;
        },

        _getConfigurationTargetModelObj: function (targetItem, delegatedMethods)
        {
            // Do not attempt to find objects that's annotated as missing.
            if (targetItem.getAttribute("Invalid") === "true")
            {
                var validationMessage = targetItem.getAttribute("ValidationMessages");
                if (checkExistsNotEmpty(validationMessage))
                {
                    var validationMessages = this._analyzerService.parseValidationMessage(validationMessage);
                    for (var i = 0; i < validationMessages.length; i++)
                    {
                        if (validationMessages[i].status === "Missing")
                        {
                            return null;
                        }
                    }
                }
            }

            var queryObject = this.buildQueryObject(targetItem);

            if (checkExists(delegatedMethods) && typeof delegatedMethods.adjustQueryObject === "function")
            {
                delegatedMethods.adjustQueryObject(queryObject);
            }
            else
            {
                this.adjustQueryObject(queryObject);
            }

            return this.findObjectInModel(queryObject, false);
        },

        setConfigurationXml: function (configurationXml, targetContextContainer, delegatedMethods)
        {
            var configurationIsValid = true;
            this.targetContextContainer = targetContextContainer;
            var savedMappings = this._getConfigurationMappingNodes(configurationXml);
            var changedModelItems = [];

            for (var m = 0; m < savedMappings.length; m++)
            {
                var savedMapping = savedMappings[m];
                var collectionObjects = [];
                var containsInvalidContext = false;

                var contextItem = savedMapping.selectSingleNode("Item[@ContextType='context']");
                var valueItem = savedMapping.selectSingleNode("Item[@ContextType='value']");

                if (checkExists(contextItem))
                {
                    var searchObj = this._getConfigurationDraggingNodeSearchObject(contextItem, delegatedMethods);
                    var draggingNode = this._getConfigurationDraggingNode(contextItem, searchObj);
                    collectionObjects.push({ type: "context", data: draggingNode.data, text: draggingNode.display, tooltip: draggingNode.tooltip });
                    containsInvalidContext = containsInvalidContext ? true : draggingNode.data.Invalid === "true";
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
                                var draggingNode = this._getConfigurationDraggingNode(sourceItem, searchObj);
                                collectionObjects.push({ type: "context", data: draggingNode.data, text: draggingNode.text, tooltip: draggingNode.tooltip });
                                containsInvalidContext = containsInvalidContext ? true : draggingNode.data.Invalid === "true";
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

                var targetModelObj = this._setConfigurationTargetListItem(savedMapping, collectionObjects, delegatedMethods);
                // Badge invalid token's parents.
                if (checkExists(targetModelObj))
                {
                    changedModelItems.push(targetModelObj);

                    if (targetModelObj.isInvalid === true)
                    {
                        this._badgeItemAndParentTree(targetModelObj);
                        configurationIsValid = false;
                    }

                    if (containsInvalidContext === true)
                    {
                        this._badgeItemAndParentTree(targetModelObj.parentRuleMappingTargetItem);
                        configurationIsValid = false;
                    }

                    // Force the rendering of collapsed lazy loaded targets because we have mappings to display.
                    // This will render the lazy loaded targets checked and populated.
                    this._expandTreeNode(targetModelObj);
                }

            }

            if (changedModelItems.length > 0)
            {
                this.element.trigger("change.mappingwidgetbase", changedModelItems);
            }

            return configurationIsValid;
        },

        _setConfigurationTargetListItem: function (savedMapping, collectionObjects, delegatedMethods)
        {
            var targetItem = savedMapping.selectSingleNode("Item[@ContextType='target']");
            var targetModelObj = this._getConfigurationTargetModelObj(targetItem, delegatedMethods);
            if (checkExists(targetModelObj))
            {
                targetModelObj.isChecked = true;
                targetModelObj.mappings = collectionObjects;
                targetModelObj.mappingXmlNode = savedMapping;

                if (checkExists(targetModelObj.checkboxElem) && targetModelObj.checkboxElem.isWidget("checkbox"))
                {
                    targetModelObj.checkboxElem.checkbox("check");
                }

                if (checkExists(targetModelObj.tokenboxElem))
                {
                    if (targetModelObj.tokenboxElem.isWidget("tokenbox"))
                    {
                        targetModelObj.tokenboxElem.tokenbox("value", collectionObjects);
                    }
                    else if (targetModelObj.tokenboxElem.isWidget("twisty"))
                    {
                        targetModelObj.tokenboxElem.twisty("value", collectionObjects);
                    }
                }
            }
            else if (checkExists(targetItem))
            {
                targetModelObj = this._renderInvalidInlineMapping(targetItem, collectionObjects, savedMapping);
            }

            return targetModelObj;
        },

        _renderInvalidInlineMapping: function (targetItem, collectionObjects, savedMapping)
        {
            targetItem.setAttribute("Invalid", "true");

            var targetModel = new Types.RuleMappingTargetItem({ toBeProcessed: true, isMapping: true, isInvalid: true, isReadOnly: true, isChecked: true });
            targetModel.populateFromItemXml(targetItem);
            targetModel.mappings = collectionObjects;
            targetModel.mappingXmlNode = savedMapping;

            var friendlyType = this._analyzerService.getReferenceType(targetModel.itemType);
            targetModel.tooltip = this._analyzerService.getReferenceStatusTitle("Missing").format(targetModel.displayName, friendlyType);
            targetModel.icon = SourceCode.Forms.Designers.Common.getItemTypeIcon(targetModel.itemType, targetModel.subType);

            var queryObject = { itemType: "Form,View", subformId: targetModel.subformId, instanceId: targetModel.instanceId };
            var parentModel = this.findObjectInModel(queryObject, false);

            if (!checkExists(parentModel))
            {
                parentModel = this._treeModel;
            }

            var groupingModel = this._findGroupingModel(targetModel.itemType, parentModel);
            groupingModel.childItems.addItem(targetModel);
            targetModel.parentListItemElem = groupingModel.listItemElem;

            // Render Invalid Target.
            var parentInfo = this._populateParentInfo(null, groupingModel);
            parentInfo.level += 1;

            if (this._processItemModel(targetModel, parentInfo, true))
            {
                groupingModel.listItemElem.find(">ul").prepend(targetModel.listItemElem);

                return targetModel;
            }

            return null;
        },

        _expandTreeNode: function (itemModel)
        {
            var currentModel = itemModel;

            while (!currentModel.toBeProcessed)
            {
                currentModel.toBeProcessed = true;

                if (this._processItemModel(currentModel, null, true))
                {
                    if (checkExists(currentModel.parentListItemElem))
                    {
                        currentModel.parentListItemElem.find(">ul").append(currentModel.listItemElem);
                    }

                    if (currentModel.listItemElem.hasClass("closed"))
                    {
                        this.expandCollapseMappings(currentModel.listItemElem);
                    }
                }
                else
                {
                    break;
                }

                if (checkExists(currentModel.parentRuleMappingTargetItem))
                {
                    currentModel = currentModel.parentRuleMappingTargetItem;
                }
                else
                {
                    break;
                }
            }

            // Expand lazy loaded tree item.
            if (checkExists(itemModel.parentListItemElem))
            {
                if (itemModel.parentListItemElem.hasClass("closed"))
                {
                    this.expandCollapseMappings(itemModel.parentListItemElem);
                }
            }
        },

        _findGroupingOrGenerate: function (itemTypeGrouping, groupingModel)
        {
            var obj = findObjectInArrayMatchingAll({
                queryObject: { itemType: itemTypeGrouping, instanceId: groupingModel.instanceId }, targetObject: groupingModel,
                blacklist: ["parentRuleMappingTargetItem"]
            });
            if (checkExists(obj))
            {
                groupingModel = obj;
                this._expandTreeNode(groupingModel);
                return groupingModel;
            }
            obj = findObjectInArrayMatchingAll({
                queryObject: { grouping: itemTypeGrouping, instanceId: groupingModel.instanceId }, targetObject: groupingModel,
                blacklist: ["parentRuleMappingTargetItem"]
            });
            if (checkExists(obj))
            {
                groupingModel = obj;
                this._expandTreeNode(groupingModel);
                return groupingModel;
            }
            // The grouping cannot be found, it's missing, render it.
            var generatedModel = this._insertAndRenderGrouping(itemTypeGrouping, groupingModel);
            if (checkExists(generatedModel))
            {
                return generatedModel;
            }

            return groupingModel;
        },

        _findGroupingModel: function (targetItemType, parentModel)
        {
            var groupingModel = parentModel;
            this._expandTreeNode(groupingModel);

            switch (targetItemType)
            {
                case "ViewField":
                    groupingModel = this._findGroupingOrGenerate("FieldContext", groupingModel);
                    break;
                case "ObjectProperty":
                    groupingModel = this._findGroupingOrGenerate("Object", groupingModel);
                    groupingModel = this._findGroupingOrGenerate("Method", groupingModel);
                    groupingModel = this._findGroupingOrGenerate("InputProperties", groupingModel);
                    break;
                case "Control":
                    groupingModel = this._findGroupingOrGenerate("Controls", groupingModel);
                    break;
                case "ViewParameter":
                    groupingModel = this._findGroupingOrGenerate("ViewParameters", groupingModel);
                    break;
                case "FormParameter":
                    groupingModel = this._findGroupingOrGenerate("FormParameters", groupingModel);
                    break;
                case "ProcessDataField":
                    groupingModel = this._findGroupingOrGenerate("ProcessDataFields", groupingModel);
                    break;
                case "ActivityDataField":
                    groupingModel = this._findGroupingOrGenerate("ActivityDataFields", groupingModel);
                    break;
                case "ProcessItemReference":
                    groupingModel = this._findGroupingOrGenerate("ProcessItemReferences", groupingModel);
                    break;
            }

            return groupingModel;
        },

        _insertAndRenderGrouping: function (itemTypeGrouping, parentModel)
        {
            var groupingModel = new Types.RuleMappingTargetItem();

            groupingModel.toBeProcessed = true;
            groupingModel.name = itemTypeGrouping;
            groupingModel.displayName = itemTypeGrouping;
            groupingModel.grouping = itemTypeGrouping;
            groupingModel.parentListItemElem = parentModel.listItemElem;
            groupingModel.instanceId = parentModel.instanceId;


            switch (itemTypeGrouping)
            {
                case "Controls":
                    groupingModel.displayName = ContextTree_TreeExtraHeading_Controls;
                    groupingModel.icon = "controls";
                    break;
                case "ViewParameters":
                case "FormParameters":
                    groupingModel.displayName = ContextTree_TreeExtraHeading_Parameters;
                    groupingModel.icon = "parameters";
                    break;
                case "Method":
                    groupingModel.displayName = ContextTree_TreeExtraHeading_Methods;
                    groupingModel.icon = "smartobject-method";
                    break;
                case "InputProperties":
                    groupingModel.displayName = ContextTree_TreeExtraHeading_InputProperties;
                    break;
                case "ProcessDataFields":
                case "ActivityDataFields":
                    groupingModel.displayName = ContextTree_TreeExtraHeading_DataFields;
                    groupingModel.icon = "data-fields";
                    break;
                case "ProcessItemReferences":
                    groupingModel.displayName = TreeExtraHeading_ItemReferences;
                    groupingModel.icon = "xml-reference";
                    break;
            }

            this._createTreeNode(groupingModel);
            groupingModel.listItemElem.data("ruleMappingTargetItem", groupingModel);

            if (parentModel === this._treeModel)
            {
                parentModel.listItemElem.prepend(groupingModel.listItemElem);
            }
            else
            {
                parentModel.listItemElem.find(">ul").prepend(groupingModel.listItemElem);
            }

            parentModel.childItems.addItem(groupingModel);

            return groupingModel;
        },

        _badgeItemAndParentTree: function (targetModel)
        {
            while (checkExists(targetModel) && checkExists(targetModel.listItemElem))
            {
                if (targetModel.isMapping)
                {
                    // li
                    targetModel.listItemElem.find(".checkbox .input-control-icon").addClass("error-badge");
                }
                else
                {
                    // ul
                    targetModel.listItemElem.closest("li").find("> span").addClass("error-badge");
                }

                if (checkExists(targetModel.parentListItemElem))
                {
                    targetModel = targetModel.parentListItemElem.data("ruleMappingTargetItem");
                }
                else
                {
                    targetModel = null;
                }
            }
        },

        automapValues: function (e)
        {
            var changedModelItems = [];
            var targetMappings = this.findObjectInModel({ isMapping: true, isReadOnly: false, isInvalid: false }, true);
            var resolvedMappings = [];
            for (var j = 0; j < targetMappings.length; j++)
            {
                var targetModelObj = targetMappings[j];
                var draggingNode = null;

                if (!targetModelObj.isReadOnly)
                {
                    //Naming works as follows 
                    //FieldObject
                    //  Get a field from an objects details
                    //ControlField
                    //  Get a control from an fields details
                    switch (targetModelObj.itemType)
                    {
                        case "ViewField":
                            if (resolvedMappings.indexOf(targetModelObj.fieldObject) === -1)
                            {
                                var smartName = checkExistsNotEmpty(targetModelObj.fieldObject) ?
                                    targetModelObj.fieldObject.replace(targetModelObj.fieldObject.split("_")[0] + "_", "") : "";
                                draggingNode = this.targetContextContainer.targetContextCanvas("getDraggingNode",
                                    [{ FieldObject: targetModelObj.soGuid + "_" + targetModelObj.name }, { id: smartName }]);
                            }
                            break;
                        case "ObjectProperty":
                        case "MethodOptionalProperty":
                        case "MethodReturnProperty":
                        case "MethodRequiredProperty":
                            var objectProperty = targetModelObj.soGuid + "_" + targetModelObj.name;
                            //find control if not found find field
                            draggingNode = this.targetContextContainer.targetContextCanvas("getDraggingNode",
                                [{ ControlField: objectProperty }, { FieldObject: objectProperty }, { Name: objectProperty }], false);
                            break;
                        case "Control":
                            //find object if not found find field
                            if (checkExistsNotEmpty(targetModelObj.controlField) && targetModelObj.controlField.contains("_"))
                            {
                                var soProp = "";
                                var controlFieldValue = targetModelObj.controlField;
                                var underscoreIndex = controlFieldValue.indexOf("_");
                                if (underscoreIndex > 0)
                                {
                                    soProp = controlFieldValue.substr(underscoreIndex + 1);
                                }

                                if (checkExistsNotEmpty(soProp))
                                {
                                    draggingNode = this.targetContextContainer.targetContextCanvas("getDraggingNode",
                                        [{ id: soProp }, { FieldControl: targetModelObj.guid }], true);
                                }

                                if (checkExists(draggingNode))
                                {
                                    resolvedMappings.push(targetModelObj.controlField);
                                }
                            }
                            break;
                        case "ViewParameter":
                            var targetFormMetaData = findObjectInArrayMatchingAll({
                                queryObject: { itemType: "Form" },
                                targetObject: this._treeModel,
                                blacklist: ["parentRuleMappingTargetItem"]
                            });
                            if (checkExists(targetFormMetaData))
                            {
                                var queryObject = { ItemType: "Form", Guid: targetFormMetaData.guid };
                                var contextFormDraggingNode = this.targetContextContainer.targetContextCanvas("getDraggingNode", [queryObject]);
                                if (checkExists(contextFormDraggingNode))
                                {
                                    queryObject = findObjectInArrayMatchingAll({
                                        queryObject: { ItemType: "FormParameter", Name: targetModelObj.name },
                                        targetObject: contextFormDraggingNode
                                    });
                                    if (checkExists(queryObject))
                                    {
                                        draggingNode = this.targetContextContainer.targetContextCanvas("getDraggingNode", [queryObject]);
                                    }
                                }
                            }
                            break;
                    }
                }

                if (checkExists(draggingNode))
                {
                    draggingNode.type = "context";
                    var mappings = [{ type: "context", data: draggingNode.data, text: draggingNode.display, tooltip: draggingNode.tooltip }];

                    if (targetModelObj.isMapping === true)
                    {
                        if (!checkExists(targetModelObj.listItemElem))
                        {
                            // Force the rendering of collapsed lazy loaded targets because we have mappings to display.
                            // This will render the lazy loaded targets.
                            this._expandTreeNode(targetModelObj);
                        }

                        if (checkExists(targetModelObj.tokenboxElem))
                        {
                            if (targetModelObj.tokenboxElem.isWidget("tokenbox"))
                            {
                                targetModelObj.tokenboxElem.tokenbox("clear");
                                targetModelObj.mappings = mappings;
                                targetModelObj.tokenboxElem.tokenbox("value", targetModelObj.mappings);

                            }
                            else if (targetModelObj.tokenboxElem.isWidget("twisty"))
                            {
                                targetModelObj.tokenboxElem.twisty("reset");
                                targetModelObj.mappings = mappings;
                                targetModelObj.tokenboxElem.twisty("value", targetModelObj.mappings);
                            }

                            if (checkExists(targetModelObj.checkboxElem))
                            {
                                targetModelObj.isChecked = true;
                                targetModelObj.checkboxElem.checkbox("check");
                            }

                            changedModelItems.push(targetModelObj);
                        }
                    }
                }
                else
                {
                    if (targetModelObj.isMapping === true && targetModelObj.isChecked === true)
                    {
                        if (!checkExists(targetModelObj.listItemElem))
                        {
                            // Force the rendering of collapsed lazy loaded targets because we have mappings to display.
                            // This will render the lazy loaded targets.
                            this._expandTreeNode(targetModelObj);
                        }

                        if (checkExists(targetModelObj.tokenboxElem))
                        {
                            if (checkExists(targetModelObj.checkboxElem))
                            {
                                targetModelObj.isChecked = false;
                                targetModelObj.checkboxElem.checkbox("uncheck");
                            }

                            changedModelItems.push(targetModelObj);
                        }
                    }
                }
            }

            if (changedModelItems.length > 0)
            {
                this.element.trigger("change.mappingwidgetbase", changedModelItems);
            }
        },

        clearAllValues: function (e)
        {
            var changedModelItems = [];

            var targetMappings = this.findObjectInModel({ isMapping: true, toBeProcessed: true }, true);
            for (var j = 0; j < targetMappings.length; j++)
            {
                var targetModelObj = targetMappings[j];
                var modelChanged = false;

                if (targetModelObj.isChecked === true && checkExists(targetModelObj.checkboxElem))
                {
                    targetModelObj.isChecked = false;

                    targetModelObj.checkboxElem.checkbox("uncheck");

                    modelChanged = true;
                }

                if (targetModelObj.isReadOnly !== true)
                {
                    if (targetModelObj.mappings.length > 0 && checkExists(targetModelObj.tokenboxElem))
                    {
                        if (targetModelObj.tokenboxElem.isWidget("tokenbox"))
                        {
                            targetModelObj.tokenboxElem.tokenbox('clear');
                            targetModelObj.tokenboxElem.tokenbox('blur');
                        }
                        else if (targetModelObj.tokenboxElem.isWidget("twisty"))
                        {
                            targetModelObj.tokenboxElem.twisty('reset');
                        }

                        // Clear the empty text node inserted by the tokenbox change.
                        targetModelObj.mappings = [];

                        modelChanged = true;
                    }
                }

                changedModelItems.push(targetModelObj);
            }

            ///Disable the clear button since clear all, clears all the values
            var clearButton = this.getOption("parentElement").closest(".wizard-step-content").find(".toolbar .toolbar-button.delete");
            if (clearButton.length === 0)
            {
                clearButton = this.getOption("parentElement").closest(".pane-container").find(".toolbar .toolbar-button.delete");
            }
            clearButton.addClass("disabled");

            if (changedModelItems.length > 0)
            {
                this.element.trigger("change.mappingwidgetbase", changedModelItems);
            }
        },

        clearSelectedValue: function (e)
        {
            var raiseChangedEvent = false;

            var clearButton = this.getOption("parentElement").closest(".wizard-step-content").find(".toolbar .toolbar-button.delete");
            if (clearButton.length === 0)
            {
                clearButton = this.getOption("parentElement").closest(".pane-container").find(".toolbar .toolbar-button.delete");
            }

            if (!clearButton.hasClass('disabled') && checkExists(this.focussedListItemModel))
            {
                if (this.focussedListItemModel.isChecked === true && checkExists(this.focussedListItemModel.checkboxElem))
                {
                    this.focussedListItemModel.isChecked = false;
                    this.focussedListItemModel.checkboxElem.checkbox("uncheck");

                    raiseChangedEvent = true;
                }

                if (!this.focussedListItemModel.isReadOnly && this.focussedListItemModel.mappings.length > 0)
                {
                    if (this.focussedListItemModel.tokenboxElem.isWidget("tokenbox"))
                    {
                        this.focussedListItemModel.tokenboxElem.tokenbox('clear');
                    }
                    else if (this.focussedListItemModel.tokenboxElem.isWidget("twisty"))
                    {
                        this.focussedListItemModel.tokenboxElem.twisty('reset');
                    }

                    this.focussedListItemModel.mappings = [];

                    raiseChangedEvent = true;
                }

                clearButton.addClass("disabled");
            }

            if (raiseChangedEvent === true)
            {
                this.element.trigger("change.mappingwidgetbase", [this.focussedListItemModel]);
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

        valueWithNameTemplate: '<Item ContextType="{1}" ItemType="{0}" Name="{2}" TargetID="{3}" TargetPath="{4}" SourceID="{5}" SourcePath="{6}" InstanceID="{7}" SubFormInstanceID="{12}" SubFormID="{8}" id="{2}" DisplayName="{9}" Invalid="{10}" ValidationMessages="{11}"/>',

        valueWithGuidTemplate: '<Item ContextType="{4}" Guid="{0}" InstanceID="{1}" ItemType="{2}" SubFormInstanceID="{9}" SubFormID="{3}" Name="{5}" DisplayName="{6}" Invalid="{7}" ValidationMessages="{8}"/>',

        // sample options properties:
        // options = {
        //    Type: this.ResultName, // text value
        //    TokenboxValue: tokenboxValueObjects, // an Array
        //    ActionPropertyCollection: metadata.ActionPropertyCollection, // text value
        //  ControlField: checkExists(metadata.ControlField) ? metadata.ControlField : "", //guid
        //    Target: {
        //        ItemType: metadata.ItemType, //text value
        //        Name: metadata.Name, //text value
        //        DisplayName: checkExists(metadata.DisplayName) ? metadata.DisplayName : "", 
        //        Guid: metadata.Guid, // do not assign an empty guid if it doesn't exist
        //        InstanceID: checkExists(metadata.InstanceID) ? metadata.InstanceID : "00000000-0000-0000-0000-000000000000",
        //        SubFormID: checkExists(metadata.SubFormID) ? metadata.SubFormID : "00000000-0000-0000-0000-000000000000"
        //    },
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

        _getSourcePartialMapping: function (options)
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

                    if (checkExistsNotEmpty(valueData.Name) && valueData.ItemType !== "ViewField" && valueData.ItemType !== "Control" && valueData.ItemType !== "Expression" && valueData.itemType !== "ViewSource") // ViewParameter will go in here. 
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
                            /*10*/checkExistsNotEmpty(valueData.Invalid) ? valueData.Invalid : "",
                            /*11*/checkExistsNotEmpty(valueData.ValidationMessages) ? valueData.ValidationMessages : "",
                            /*12*/checkExistsNotEmpty(valueData.SubFormInstanceID) ? valueData.SubFormInstanceID : ""
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
                            /*6*/displayName.xmlEncode(),
                            /*7*/checkExistsNotEmpty(valueData.Invalid) ? valueData.Invalid : "",
                            /*8*/checkExistsNotEmpty(valueData.ValidationMessages) ? valueData.ValidationMessages : "",
                            /*9*/checkExistsNotEmpty(valueData.SubFormInstanceID) ? valueData.SubFormInstanceID : ""
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

                jQuery.each(valobj, function (k, v)
                {
                    if (v.type === "value")
                    {
                        result += "<Item ContextType=\"value\">{0}</Item>".format(v.data.xmlEncode());
                    }
                    else
                    {
                        result += "<Item ContextType=\"context\"";

                        jQuery.each(v.data, function (l, w)
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
            var mappingXml = "<Mappings>";
            var validationFailures = "";

            var requiredMappings = this.findObjectInModel({ isMapping: true, isRequired: true }, true);
            var targetMappings = this.findObjectInModel({ isMapping: true, isChecked: true }, true);

            //add the required mappings to the target mappings if they don't exist, so that they can get validated.
            for (var i = 0; i < requiredMappings.length; i++)
            {
                if (!targetMappings.contains(requiredMappings[i]))
                {
                    targetMappings.push(requiredMappings[i]);
                }
            }

            for (var j = 0; j < targetMappings.length; j++)
            {
                var targetModelObj = targetMappings[j];

                if (!targetModelObj.isReadOnly)
                {
                    var tokenboxValueObjects = targetModelObj.mappings;
                    if (tokenboxValueObjects.length === 0)
                    {
                        tokenboxValueObjects = [{ data: "", text: "", type: "value" }];
                    }

                    var options =
                    {
                        Type: this.ResultName,
                        TokenboxValue: tokenboxValueObjects,
                        ActionPropertyCollection: targetModelObj.actionPropertyCollection,
                        ControlField: checkExists(targetModelObj.controlField) ? targetModelObj.controlField : "",
                        Target:
                        {
                            ItemType: targetModelObj.itemType,
                            Name: targetModelObj.name,
                            DisplayName: targetModelObj.displayName,
                            Guid: targetModelObj.guid,
                            InstanceID: targetModelObj.instanceId,
                            SubFormID: targetModelObj.subformId,
                            SubFormInstanceID: targetModelObj.subformInstanceId
                        }
                    };

                    mappingXml += this._getMapping(options);

                    // validation values
                    var hasSingleTextValue = false;
                    var textValue = "";

                    var hasValue = targetModelObj.mappings.length > 0 && targetModelObj.isChecked;

                    if (targetModelObj.mappings.length === 1 && targetModelObj.mappings[0].type === "value")
                    {
                        hasSingleTextValue = true;
                        textValue = targetModelObj.mappings[0].data;
                    }

                    var nameOrGuid = checkExistsNotEmpty(targetModelObj.guid) ? targetModelObj.guid : targetModelObj.name;
                    var propertyDisplayName = checkExistsNotEmpty(targetModelObj.tooltip) ? targetModelObj.tooltip : targetModelObj.displayName;

                    var validationResult = this.validate(nameOrGuid, propertyDisplayName, targetModelObj.isRequired, hasValue, hasSingleTextValue, textValue);
                    if (validationResult !== true && validationFailures === "")
                    {
                        validationFailures = validationResult;
                    }
                }
                    // Preserve checked invalid mappings
                else if (targetModelObj.isReadOnly && checkExists(targetModelObj.mappingXmlNode))
                {
                    mappingXml += targetModelObj.mappingXmlNode.xml;
                }
            }
            mappingXml += "</Mappings>";

            if (validationFailures !== "")
            {
                this.validationFailureAction(validationFailures);
                return false;
            }

            if (mappingXml.indexOf("Invalid=\"true\"") >= 0)
            {
                mappingXml = mappingXml.replace("<Mappings>", "<Mappings Invalid=\"true\">");
            }

            return mappingXml;
        },

        _checkBoxChange: function (ev)
        {
            var listItemModel = jQuery(ev.target || ev.srcElement).closest("li").data("ruleMappingTargetItem");
            listItemModel.isChecked = listItemModel.checkboxElem[0].checked;

            this.element.trigger("change.mappingwidgetbase", [listItemModel]);
        },

        _tokenBoxChange: function (ev)
        {
            var listItemModel = jQuery(ev.target).closest("li").data("ruleMappingTargetItem");
            if (checkExists(listItemModel) && checkExists(listItemModel.tokenboxElem))
            {
                var tokenboxValueObjects = listItemModel.tokenboxElem.tokenbox("value");
                switch (listItemModel.renderLabelAs)
                {
                    case "checkbox":
                        if (tokenboxValueObjects.length === 0)
                        {
                            tokenboxValueObjects = [{ data: "", text: "", type: "value" }];
                        }
                        break;
                    case "text":
                        if (tokenboxValueObjects.length > 0)
                        {
                            listItemModel.isChecked = true;
                        }
                        else
                        {
                            listItemModel.isChecked = false;
                        }
                        break;
                }

                listItemModel.mappings = tokenboxValueObjects;

                this.element.trigger("change.mappingwidgetbase", [listItemModel]);
            }
        },

        _twistyChange: function (ev)
        {
            var listItemModel = jQuery(ev.target).closest("li").data("ruleMappingTargetItem");
            if (checkExists(listItemModel) && checkExists(listItemModel.tokenboxElem))
            {
                var valueObjects = listItemModel.tokenboxElem.twisty('value');

                if (valueObjects.length === 0)
                {
                    valueObjects = [{ data: "", text: "", type: "value" }];
                }

                listItemModel.isChecked = true;
                listItemModel.mappings = valueObjects;

                this.element.trigger("change.mappingwidgetbase", [listItemModel]);
            }
        },

        _onTokenboxKeypress: function (ev)
        {
            if (ev.keyCode === 13)
            {
                var tokenbox = jQuery(ev.target);
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
            var listItemModel = jQuery(ev.target).closest("li").data("ruleMappingTargetItem");

            if (checkExists(listItemModel.checkboxElem) && !listItemModel.checkboxElem[0].checked)
            {
                listItemModel.checkboxElem.checkbox("check");
                listItemModel.checkboxElem.trigger("change");
            }

            this.focussedListItemModel = listItemModel;
            listItemModel.listItemElem.closest(".pane-container").find('.toolbar a.toolbar-button.delete.disabled').removeClass('disabled');
        }
    };

    jQuery.extend(SourceCode.Forms.Designers.Rule.MappingWidgetBase.prototype, _mappingWidgetBasePrototype);
})(jQuery);
