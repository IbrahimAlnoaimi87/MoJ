//this is the basic mapping widget
//it gets its targetXml data from the specified plugin in the utils item xml format.
//it then displays the xml and saves a result.
function ControlPropertiesMappingWidget()
{
}

var ControlPropertiesMappingWidgetProtoType =
{
    initialize: function (parentElement)
    {
        this._parentElement = parentElement;
        this._populateToolbar(parentElement);
        this.dropElements = [];
        this.contexttree = this._parentElement.closest(".popup").find(".mapping-tree-section .tree");
        this._analyzerService = SourceCode.Forms.Services.AnalyzerResourcesService();

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
        tb.toolbar("add", "button", { id: "clearAllButton_SetPropertiesMappingWidget", icon: "delete-all", text: ContextTree_Clear_AllValues, description: ContextTree_Clear_AllValuesDesc, disabled: !checkExists(this.value) });
        tb.toolbar("add", "button", { id: "clearSelectedButton_SetPropertiesMappingWidget", icon: "delete", text: ContextTree_Clear_SelectedValue, description: ContextTree_Clear_SelectedValueDesc, disabled: true });

        var toolbarItems = tb.toolbar("fetch", "buttons");

        //ensure no other bindings have been made to the buttons
        jQuery(toolbarItems[0]).off();
        jQuery(toolbarItems[1]).off();

        jQuery(toolbarItems[0]).on("click", this.clearAllValues.bind(this));
        jQuery(toolbarItems[1]).on("click", this.clearSelectedValue.bind(this));

        this._clearAllButton = $("#clearAllButton_SetPropertiesMappingWidget");
        this._clearSelectedButton = $("#clearSelectedButton_SetPropertiesMappingWidget");
    },

    clearAllValues: function (e)
    {
        var twisty = null;

        this._parentElement.find(".twisty, .without-twisty").each(
        function ()
        {
            twisty = $(this);
            twisty.twisty("reset");
            twisty.closest("li").find("input.input-control[type=checkbox]").checkbox("uncheck");
        });

        this._clearSelectedButton.addClass("disabled");
        this._clearAllButton.addClass("disabled");
    },

    clearSelectedValue: function (e)
    {
        if (this._clearSelectedButton.length === 0)
        {
            this._clearSelectedButton = this._parentElement.closest(".pane-container").find(".toolbar .toolbar-button.delete");
        }

        var twisty = $.merge([], this.activeControl.closest(".twisty, .without-twisty"));
        twisty = $.merge(twisty, this.activeControl.find(".twisty"));
        twisty = $.merge(twisty, this.activeControl.find(".without-twisty"));
        var twistyLength = twisty.length;

        for (var index = twistyLength - 1; index > -1; index--)
        {
            var currentTwisty = $(twisty[index]);
            if (checkExists(currentTwisty.twisty("value")))
            {
                this.activeControl.closest("li").find("input.input-control[type=checkbox]").checkbox("uncheck");
                currentTwisty.twisty("clear");
                this._clearSelectedButton.addClass("disabled");
            }
        }
    },

    getDropListItem: function (item, isProperty, disableCheckBox)
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
        var lineHtml = "<li style='position:relative; ' class=\"dropLabel " + ((isProperty) ? icon : "");

        if (lineMetaDataLength > 0)
        {
            lineHtml += "\" data-options=\"" + jQuery.toJSON(lineMetaData).htmlEncode();
        }

        lineHtml += "\">" + ((!isProperty) ? SCCheckbox.html({ label: display, icon: icon, disabled: disableCheckBox, description: display }) : "<span style='display:inline-block;' title='" + display.htmlEncode() + "'>" + display.htmlEncode() + ((isProperty) ? ":" : "") + "</span>") + "</li>";

        var line = jQuery(lineHtml);

        line.find("input.input-control[type=checkbox]").checkbox();

        if (item.getAttribute('ItemType') === 'MethodRequiredProperty' || (item.getAttribute("Required") && item.getAttribute("Required") === "true"))
        {
            line.addClass('required');
        }

        return line;
    },

    _getContainerInfo: function (container, input)
    {
        var _value = "";
        if (!input.is('label'))
        {
            _value = input.val() !== "" ? input.val() : input.text();
        }

        var _checkbox = input.closest("li").find('input[type=checkbox]');
        var _isChecked = true;
        var _isConfigured = true;
        if (_checkbox.length > 0)
        {
            _isChecked = _checkbox[0].getAttribute('checked') === 'checked';
            _isConfigured = (_isChecked || _value !== "");
        }

        return { checkbox: _checkbox, isChecked: _isChecked, isConfigured: _isConfigured };
    },

    _addEvents: function (container, disabled)
    {
        var _this = this;

        if (!disabled)
        {

            var inputs = container.find("a.ellipsis, input, select, .token-input-editor-area");

            inputs.on("keyup change drop",
            function ()
            {
                var input = $(this);
                var _containerInfo = _this._getContainerInfo(container, input);

                _this._clearSelectedButton.toggleClass("disabled", !_containerInfo.isConfigured);

                if (_containerInfo.isConfigured)
                {
                    _this._clearAllButton.removeClass("disabled");

                    if (!_containerInfo.isChecked)
                    {
                        _containerInfo.checkbox.checkbox("check");
                    }
                }

                _this.activeControl = input;
            });

            container.on("drop",
            function ()
            {
                var input = $(this).find("input, select, .token-input-editor-area");
                var _containerInfo = _this._getContainerInfo(container, input);

                _this._clearSelectedButton.removeClass("disabled");

                _this._clearAllButton.removeClass("disabled");

                if (_containerInfo.isConfigured)
                {
                    if (!_containerInfo.isChecked)
                    {
                        _containerInfo.checkbox.checkbox("check");
                    }
                }

                _this.activeControl = input;
            });

            container.on("click", 
            function (ev)
            {
                var input = $(this);
                var _containerInfo = _this._getContainerInfo(container, input);

                _this._clearSelectedButton.toggleClass("disabled", !_containerInfo.isConfigured);
                if (_containerInfo.isConfigured)
                {
                    _this._clearAllButton.removeClass("disabled");
                }

                _this.activeControl = input;
            });

            inputs = container.find("input, select, label.checkbox, .token-input-editor-area");

            inputs.on("click", 
            function (ev)
            {
                var input = $(this);
                var checkbox;
                var _containerInfo = _this._getContainerInfo(container, input);

                _this._clearSelectedButton.toggleClass("disabled", !_containerInfo.isConfigured);

                if (input.attr("type") === "radio")
                {
                    checkbox = input.closest("ul").closest("li").find("input[type=checkbox]");

                    if (checkbox.length > 0)
                    {
                        if (!checkbox.parent().hasClass("checked"))
                        {
                            checkbox.checkbox("check");
                        }
                    }
                }
                else if (input.is("label.checkbox"))
                {
                    checkbox = input.find("input[type=checkbox]");

                    if (checkbox.length > 0)
                    {
                        if (checkbox.parent().hasClass("checked"))
                        {
                            checkbox.checkbox("uncheck");
                        }
                        else
                        {
                            checkbox.checkbox("check");
                        }
                    }
                }

                ev.preventDefault();
                //ev.stopPropagation();

                _this.activeControl = input;
            });

            inputs.on("blur", function ()
            {
                _this._clearSelectedButton.addClass("disabled");
            });
        }
    },

    _getPropertyValue: function (item, property)
    {
        if (checkExists(item.getAttribute(property)))
        {
            return item.getAttribute(property);
        }
        else if (checkExists(item.selectSingleNode(property)) && checkExists(item.selectSingleNode(property).firstChild))
        {
            return item.selectSingleNode(property).firstChild.nodeValue;
        }
        else
        {
            return undefined;
        }
    },

    _getPropertyBoolValue: function (item, property, defaultValue)
    {
        if ((checkExists(item.getAttribute(property)) && item.getAttribute(property) === defaultValue))
        {
            return defaultValue === "true";
        }
        else if ((checkExists(item.selectSingleNode(property)) && checkExists(item.selectSingleNode(property).firstChild) && item.selectSingleNode(property).firstChild.nodeValue === defaultValue))
        {
            return defaultValue === "true";
        }
        else
        {
            return undefined;
        }
    },

    addDropRow: function (item, isProperty)
    {

        var line = jQuery("");

        var dropTextboxContainer = jQuery("<div class='mappings-input'></div>");
        var options = {};
        var property = "";

        options.subType = this._getPropertyValue(item, "SubType");
        if (!checkExists(options.subType))
        {
            options.subType = "";
        }
        options.mappable = this._getPropertyBoolValue(item, "Mappable", "false");
        options.items = this._getPropertyValue(item, "Options");
        options.setFunction = this._getPropertyValue(item, "SetFunction");
        options.getDropItemsFunction = this._getPropertyValue(item, "getDropItemsFunction");
        options.validationPattern = this._getPropertyValue(item, "ValidationPattern");
        options.validationMessage = this._getPropertyValue(item, "ValidationMessage");
        property = this._getPropertyValue(item, "TargetID");
        options.radioLabel = property;
        options.readOnly = this._getPropertyBoolValue(item, "ReadOnly", "true");
        options.readOnlyValue = this._getPropertyValue(item, "ReadOnlyText");
        options.readOnlyType = this._getPropertyValue(item, "ReadOnlyType");
        options.hasIcon = this._getPropertyBoolValue(item, "ShowIcon", "true");
        options.controlID = checkExists(this.Settings.viewControlID) && this.Settings.viewControlID !== '' ? this.Settings.viewControlID : this.Settings.formControlID;
        options.isCurrent = !checkExists(this.Settings.subformID);
        options.contextType = checkExists(this.Settings.viewControlID) && this.Settings.viewControlID !== '' ? "View" : "Form";
        options.contextID = checkExists(this.Settings.viewID) && this.Settings.viewID !== '' ? this.Settings.viewID : this.Settings.formID;
        options.targetXml = this.targetXml;
        options.getSpinOptionsFunction = this._getPropertyValue(item, "getSpinOptionsFunction");
        options.instanceID = this.Settings.instanceID;
        //this is the actual view / form that has been opened in a subform / subview's ID and not the unique subformID

        if (checkExists(this.Settings.subformID))
        {
            if ((checkExists(this.Settings.formID)) && (!checkExists(this.Settings.viewID)))
            {
                options.subformID = this.Settings.formID;
                options.subformType = "Form";
            }
            else
            {
                options.subformID = this.Settings.viewID;
                options.subformType = "View";
            }
        }
        else
        {
            options.subformID = "";
        }

        if (!(checkExists(options.setFunction)))
        {
            options.initializeServerControl = this._getPropertyValue(item, "InitializeServerControl");
            options.serverControl = this._getPropertyValue(item, "ServerControl");
        }

        var disableCheckBox = options.subType !== null ? checkExists(options.mappable) : false;

        line = this.getDropListItem(item, isProperty, disableCheckBox);

        line.append(dropTextboxContainer);
        this.currentParentList.append(line);

        if (options.readOnly && (!checkExists(options.readOnlyValue) || (options.readOnlyValue === "")) && (SourceCode.Forms.WizardContainer.currentRuleWizardContext !== "Form"))
        {
            switch (property)
            {
                case "Field":
                    var id = SourceCode.Forms.Designers.View.ViewDesigner._getControlPropertyValue(options.controlID, property);
                    var fieldNode = parseXML(SourceCode.Forms.Designers.View.ViewDesigner._getViewFields()).selectSingleNode("//Item[@Guid='" + id + "']");
                    options.readOnlyValue = checkExists(fieldNode) ? (checkExists(fieldNode.selectSingleNode("DisplayName")) ? fieldNode.selectSingleNode("DisplayName").firstChild.nodeValue : "") : "";
                    options.readOnlyType = options.readOnlyValue !== "" ? fieldNode.getAttribute("SubType") : options.readOnlyType;
                    break;
            }
        }
        else if (options.readOnly && (checkExists(options.readOnlyValue)) && !(options.readOnlyValue.length > 0) && (SourceCode.Forms.WizardContainer.currentRuleWizardContext === "Form"))
        {
            options.readOnlyValue = "";
        }
        // Drop Options
        options.dropOptions = {};
        options.dropOptions.drop = this._tokenDrop.bind(this);
        options.dropOptions.focus = this._twistyDropFocus.bind(this);

        if ((property === "TabIndex") && (options.subType === "spin"))
        {
            options.spinOptions = {
                inputs: [{
                    range: {
                        min: -1,
                        max: 126,
                        step: 1
                    },
                    displays: {
                        "-1": Resources.ControlProperties.TabIndexNone,
                        "0": Resources.ControlProperties.TabIndexDefault
                    },
                    defaultValue: "0"
                }]
            };
        }

        dropTextboxContainer.twisty(options);

        this._addEvents(line, disableCheckBox);
    },

    _checkComplexTypeSourceAnnotations: function (dataobj, complexTypeNode, propertyType)
    {
        if (complexTypeNode.getAttribute("Invalid"))
        {
            propertyType = (propertyType === "ControlExpression") ? "Expression" : propertyType;

            var validationMessages = complexTypeNode.getAttribute("ValidationMessages");
            validationMessages = this._analyzerService.parseValidationMessage(validationMessages);

            for (var i = 0; i < validationMessages.length; i++)
            {
                var validationMsg = validationMessages[i];
                var itemType = checkExistsNotEmpty(propertyType)? propertyType : validationMsg.type;
                var itemTypeFriendlyName = this._analyzerService.getReferenceType(itemType);

                var displayName = dataobj.data.display;
                if (!checkExistsNotEmpty(displayName))
                {
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
                        displayName = Resources.ExpressionBuilder.UnresolvedObjectText.format(itemTypeFriendlyName);
                    }
                }

                dataobj.data.text = displayName;
                dataobj.data.display = displayName;
                dataobj.data.icon += " error-state";
                dataobj.data.tooltip = this._analyzerService.getReferenceStatusTitle(validationMsg.status).format(displayName, itemTypeFriendlyName);
            }
        }
        return dataobj;
    },

    _populateTargetInfoObj: function(mappingNode)
    {
        var retObj =
        {
            controlType: null,
            targetNode: null,
            getDisplayExists: false,
            displayFunction: null,
            targetDropLabel: null,
            metadata: null
        };

        // ControlType
        var controlTypeItemNode = this.targetXml.selectSingleNode("//Item[@ItemType='Control']/@SubType");
        if (checkExists(controlTypeItemNode))
        {
            retObj.controlType = controlTypeItemNode.text;
        }

        // targetNode
        retObj.targetNode = mappingNode.selectSingleNode("Item[@ContextType='target']");

        // property
        retObj.property = retObj.targetNode.getAttribute("TargetID");

        // controlID
        retObj.controlID = retObj.targetNode.getAttribute("TargetPath");

        // displayFunction
        if (checkExists(retObj.controlType))
        {
            var controlsDoc = SourceCode.Forms.Designers.Common.controlDefinitionsXml;
            retObj.displayFunction = controlsDoc.selectSingleNode('Controls/Control[Name="{0}"]/DefaultProperties/Properties/Prop[@ID="{1}"]/@GetDisplay'.format(retObj.controlType, retObj.property));
            if (checkExists(retObj.displayFunction))
            {
                retObj.getDisplayExists = true;
                retObj.displayFunction = SourceCode.Forms.Designers.Common.getControlTypeFunction(retObj.controlType, retObj.property, "GetDisplay", retObj.displayFunction.text)
            }
        }

        // targetDropLabel & metadata
        this._parentElement.find(".dropLabel").each(function ()
        {
            var jThis = $(this);
            var m = jThis.metadata();

            if (m.TargetID === retObj.property && (!checkExistsNotEmpty(retObj.controlID) || m.TargetPath === retObj.controlID))
            {
                retObj.targetDropLabel = jThis;
                retObj.metadata = m;

                // Stop the loop
                return false;
            }
        });

        return retObj;
    },

    setConfigurationXml: function (configurationXml, targetContextContainer)
    {
        this.targetContextContainer = targetContextContainer;

        //if this is loading a saved mapping screen
        if (checkExists(configurationXml))
        {
            this._clearAllButton.removeClass("disabled");
            var mappingsDoc = parseXML(configurationXml);
            var settings = this.Settings;

            var mappings = null;
            var sourceItemNodes = null;
            var targetInfoObj = null;

            var sourceItem = null;
            var sourceItemValue = null;

            var mappingNodes = mappingsDoc.selectNodes("/Mappings/Mapping[Item]");
            for (var i = 0; i < mappingNodes.length; i++)
            {
                mappings = [];
                targetInfoObj = this._populateTargetInfoObj(mappingNodes[i]);

                // TODO:  ALM V2 to display missing targets, for now, ignore and continue.
                if (targetInfoObj.targetDropLabel === null)
                {
                    continue;
                }

                sourceItemNodes = mappingNodes[i].selectNodes(".//Item[(@ContextType='context' or @ContextType='value') and not(SourceValue/Item)]");
                if (sourceItemNodes.length > 0)
                {
                    for (var y = 0; y < sourceItemNodes.length; y++)
                    {
                        sourceItem = sourceItemNodes[y];
                        sourceItemValue = sourceItem.firstChild !== null ? sourceItem.firstChild.nodeValue : "";

                        if (sourceItem.getAttribute("ContextType") === "value")
                        {
                            if (sourceItem.parentNode.nodeName !== "SourceValue")
                            {
                                if (targetInfoObj.getDisplayExists === true)
                                {
                                    if (typeof targetInfoObj.displayFunction === 'function')
                                    {
                                        var result = targetInfoObj.displayFunction(targetInfoObj.property, sourceItemValue);
                                        mappings.push({ type: "value", data: { display: result.display, icon: result.icon, value: sourceItemValue } });
                                        continue;
                                    }
                                }
                                else
                                {
                                    // Picture Source
                                    if (targetInfoObj.property === "Source")
                                    {
                                        var imageId = parseInt(sourceItemValue);
                                        var displayName = "";
                                        var dataobj;
                                        if (!isNaN(imageId))
                                        {
                                            displayName = SourceCode.Forms.Designers.Common.getFormsImageName(imageId);
                                            dataobj = { type: "value", data: { display: displayName, icon: "picture", value: imageId } };
                                        }
                                        else
                                        {
                                            dataobj = { type: "value", data: { display: "", icon: "", value: -1 } };
                                        }
                                        mappings.push(this._checkComplexTypeSourceAnnotations(dataobj, sourceItem, targetInfoObj.property));
                                        continue;
                                    }
                                    // Sets 'None' to Expression
                                    else if (targetInfoObj.property === "ControlExpression")
                                    {
                                        var dataobj = { type: "value", data: { display: "", icon: "expression", value: "" } };
                                        mappings.push(dataobj);
                                        continue;
                                    }
                                }
                            }
                            // Value
                            mappings.push({ type: "value", data: sourceItemValue, text: sourceItemValue });
                        }
                        else
                        {
                            // Context Item
                            // TODO:  ALM V2 Change inheritence of this widget to the MappingWidgetBase.
                            var searchObj = SourceCode.Forms.Designers.Rule.MappingWidgetBase.prototype._getConfigurationDraggingNodeSearchObject.bind(this)(sourceItem);
                            var draggingNode = SourceCode.Forms.Designers.Rule.MappingWidgetBase.prototype._getConfigurationDraggingNode.bind(this)(sourceItem, searchObj);
                            var mappingObj = { type: "context", data: draggingNode.data, text: draggingNode.display, tooltip: draggingNode.tooltip };

                            // test if original source was a mapping twisty (signle value) or a tokenbox (multi value)
                            // Disable for now as opening the Expression Builder from SCP is not being supported at the moment. TFS693960
                            //if (targetInfoObj.property === "ControlExpression" && mappingNodes[i].selectSingleNode("Item[(@ContextType='context') and not(SourceValue/Item)]") !== null)
                            //{
                            //    mappingObj.selectionType = "complex";
                            //}

                            mappings.push(mappingObj);
                        }
                    }
                }
                else
                {
                    mappings.push({ type: "value", data: "", text: "" });
                }

                if (mappings.length > 0)
                {
                    targetInfoObj.targetDropLabel.find("input[type=checkbox]").checkbox("check");
                    targetInfoObj.targetDropLabel.find(".twisty, .without-twisty").twisty("value", mappings);
                }
            }
        }
    },

    _getConfigurationXML: function (configurationXML, value, targetID, targetName, targetDisplayName, targetPath, targetType, targetSubFormID, targetInstanceID, isRequired, twistyDropMode, targetSubformInstanceID)
    {
        var hasSource = value.length > 0;
        var hasSingleTextValue = false;
        var textValue = "";
        var hasInvalidAttribute = false;

        // Create Mappings Element
        var mappingElement = configurationXML.createElement("Mapping");
        if (checkExists(this.ResultName))
        {
            mappingElement.setAttribute("Type", this.ResultName);
        }
        mappingElement.setAttribute("ActionPropertyCollection", "Parameters");

        // Only Expressions selected by twisty in map mode. 
        // only used for expressions to differentiate between source (twisty (single) vs tokenbox (multi))
        // not to be used for ContextType === 'value'
        if (targetID === "ControlExpression" && twistyDropMode === false && value.length === 1 && value[0].type === "context")
        {
            var ItemElement = configurationXML.createElement("Item");
            ItemElement.setAttribute("ContextType", "context");
            hasInvalidAttribute = value[0].data.Invalid === "true";

            $.each(value[0].data, function (key, value)
            {
                switch (key)
                {
                    case "Name":
                        ItemElement.setAttribute("SourceName", value);
                        ItemElement.setAttribute(key, value);
                        break;
                    case "DisplayName":
                        ItemElement.setAttribute("SourceDisplayName", value);
                        break;
                    default:
                        ItemElement.setAttribute(key, value);
                        break;
                }
            });

            mappingElement.appendChild(ItemElement);
        }
        else
        {
            var token = false;
            var contextElement;

            //Create SourceValue Element needed for token
            var outerSourceElement = configurationXML.createElement("Item");
            outerSourceElement.setAttribute("ContextType", "value");
            var sourceElement = configurationXML.createElement("SourceValue");

            if (value.length > 0)
            {
                hasSingleTextValue = (value.length === 1);

                // Create Context Item
                for (var i = 0, l = value.length; i < l; i++)
                {
                    if (!hasInvalidAttribute && value[i].data.Invalid === "true")
                    {
                        hasInvalidAttribute = true;
                    }

                    contextElement = configurationXML.createElement("Item");
                    if (value[i].type === 'value')
                    {
                        contextElement.setAttribute("ContextType", "value");
                        contextElement.appendChild(configurationXML.createTextNode(value[i].data));
                    }
                    else
                    {
                        hasSingleTextValue = false;
                        contextElement.setAttribute("ContextType", "context");
                        $.each(value[i].data, function (key, value)
                        {
                            switch (key)
                            {
                                case "Name":
                                    contextElement.setAttribute("SourceName", value);
                                    contextElement.setAttribute(key, value);
                                    break;
                                case "DisplayName":
                                    contextElement.setAttribute("SourceDisplayName", value);
                                    break;
                                default:
                                    contextElement.setAttribute(key, value);
                                    break;
                            }
                        });
                    }

                    if (value.length > 1 || value[0].type === 'context' || twistyDropMode === true)
                    {
                        sourceElement.appendChild(contextElement);
                        hasSingleTextValue = false;
                        token = true;
                    }

                    if (hasSingleTextValue)
                        textValue = contextElement.text;

                    if (token)
                    {
                        outerSourceElement.appendChild(sourceElement);
                    }
                }
            }
            else
            {
                contextElement = configurationXML.createElement("Item");
                contextElement.setAttribute("ContextType", "value");
                contextElement.appendChild(configurationXML.createTextNode(''));
            }

            mappingElement.appendChild(token ? outerSourceElement : contextElement);
        }

        // Create Target Item
        var targetElement = configurationXML.createElement("Item");
        targetElement.setAttribute("TargetType", targetType);
        targetElement.setAttribute("ContextType", "target");
        targetElement.setAttribute("TargetID", targetID);
        if (checkExistsNotEmpty(targetPath))
        {
            targetElement.setAttribute("TargetPath", targetPath);
        }
        targetElement.setAttribute("Name", targetID);

        targetElement.setAttribute("TargetName", targetName);
        targetElement.setAttribute("TargetDisplayName", targetDisplayName);


        targetElement.setAttribute("ItemType", targetType);

        // TargetPathType
        var subTypeNode = this.targetXml.selectSingleNode('//Item[@ItemType="Control"]');
        if (checkExists(subTypeNode))
        {
            var subType = subTypeNode.getAttribute("SubType");
            if (checkExistsNotEmpty(subType))
            {
                targetElement.setAttribute("TargetPathType", subType);
            }
        }

        if (checkExists(targetSubFormID))
        {
            // Set subformID if exists
            targetElement.setAttribute("SubFormID", targetSubFormID);

            if (checkExists(targetSubformInstanceID))
            {
                targetElement.setAttribute("SubFormInstanceID", targetSubformInstanceID);
            }
        }

        if (checkExists(targetInstanceID))
        {
            // Set instanceID if exists
            targetElement.setAttribute("InstanceID", targetInstanceID);
        }

        // Add targetElement to mappingElement
        mappingElement.appendChild(targetElement);

        // Append MappingElement to document
        configurationXML.documentElement.appendChild(mappingElement);

        if (hasInvalidAttribute === true)
        {
            configurationXML.documentElement.setAttribute("Invalid", "true");
        }

        var validationResult = this.validate(targetID, targetDisplayName, isRequired, hasSource, hasSingleTextValue, textValue);
        return validationResult;
    },

    getConfigurationXML: function ()
    {
        var targetDisplayName, metadata;
        var uncheckedRequiredCheckBoxes = this._parentElement.find("li.required input[type=checkbox]:not(:checked)");
        if (uncheckedRequiredCheckBoxes.length > 0)
        {
            metadata = uncheckedRequiredCheckBoxes.eq(0).closest('li').metadata();
            targetDisplayName = metadata.DisplayName;
            this.validationFailureAction(this.validate(targetDisplayName, targetDisplayName, true, false, false, ""));
            return false;
        }

        var checkboxes = this._parentElement.find("input[type=checkbox]:checked");
        var configurationXML = parseXML("<Mappings/>");

        for (var i = 0, l = checkboxes.length; i < l; i++)
        {
            var twisty = $(checkboxes[i]).closest('li').find('.twisty, .without-twisty');
            var value = twisty.twisty('value');
            var twistyDropMode = twisty.hasClass("drop");
            metadata = twisty.parent().metadata();
            var targetType = metadata.ItemType;
            var targetID = metadata.TargetID;
            var targetPath = metadata.TargetPath;
            targetDisplayName = metadata.DisplayName;
            var targetName = metadata.Name;
            var isRequired = metadata.Required;
            var targetSubFormID = this.Settings.subformID;
            var targetInstanceID = metadata.InstanceID;
            var targetSubformInstanceID = metadata.SubFormInstanceID;

            var validationResult = this._getConfigurationXML(configurationXML, value, targetID, targetName, targetDisplayName, targetPath, targetType, targetSubFormID, targetInstanceID, isRequired, twistyDropMode, targetSubformInstanceID);
            if (validationResult !== true)
            {
                this.validationFailureAction(validationResult);
                return false;
            }
        }

        if ((!checkExists(this.Settings.allowEmpty) || this.Settings.allowEmpty === false) && checkboxes.length === 0)
        {
            popupManager.showWarning(Resources.RuleDesigner.SetPropertiesNoItemsText);
            return false;
        }

        this.display = "Configured";
        this.data = configurationXML.firstChild;
        this.value = configurationXML.xml;

        return configurationXML.xml;
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

    _findTreeObject: function (value)
    {
        var data = {};
        data.id = value.id;
        data.SubFormID = value.SubFormID !== "" ? value.SubFormID : null;
        data.InstanceID = value.InstanceID !== "" ? value.InstanceID : null;

        return this.contexttree.tree("findModelObject", data);
    },

    _generateTokenTooltip: function (editor)
    {
        var tokens = editor.find(".entity:not([title]), .entity[title='']");

        for (var i = 0, l = tokens.length; i < l; i++)
        {
            var token = tokens.eq(i);
            var objectModel = this._findTreeObject(token.metadata());

            if (checkExists(objectModel) && checkExistsNotEmpty(objectModel.tooltip))
            {
                token.attr("title", objectModel.tooltip);
            }
        }
    },

    _tokenDrop: function (ev, ui)
    {
        this._generateTokenTooltip(ui.tokenbox.editor);
    },

    _twistyDropFocus: function (ev)
    {
        this._generateTokenTooltip($(ev.originalEvent.target));
    }
};

jQuery.extend(ControlPropertiesMappingWidget.prototype, BasicMappingWidget.prototype, ControlPropertiesMappingWidgetProtoType);
