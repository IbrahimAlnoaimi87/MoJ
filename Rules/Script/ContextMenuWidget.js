var categoryTree;

//var rulesWizardContextMenu = new RulesWizardContextMenu();

//Constructor
//#region
var rulesWizardContextMenuInstance = null; // Only one instance of the rules wizard context menu Exists
function RulesWizardContextMenu()
{
    //this.targetID = "Morne se targetID";
}
//#endregion

RulesWizardContextMenu.prototype =
{
    getItemsFromPlugIn: function ()
    {
        this["showPopup"] = true;
        if (this.isHidden || this.forcedClick) this.showPopup = false;
        this.pluginReturnedId = "".generateGuid() + ".pluginReturned";
        jQuery(document.body).on(this.pluginReturnedId, this, this.pluginReturn);

        var pluginType = eval(this.pluginName);
        var plugin = new pluginType();
        plugin.dataType = 'target';
        plugin.Settings = this; //TODO it would be better if this could be settings or parameters.
        plugin.pluginReturnedId = this.pluginReturnedId;

        with (plugin)
        {
            var pluginMethod = eval(this.pluginMethod).bind(plugin);
            pluginMethod();
        }
    },

    pluginReturn: function (e)
    {
        var _this = e.data;

        //each time a plugin returns it calls this function.
        if ((typeof _this.pluginReturnedId !== "undefined") && (_this.pluginReturnedId !== null) && (_this.pluginReturnedId !== ""))
        {
            jQuery(document.body).off(_this.pluginReturnedId, _this.pluginReturn);
        }

        var returnedXml = e.detail.xml;
        var returnedType = e.detail.type;
        var popupXML = "";
        if (_this.filterTypes)
        {
            var xpathSelector = "";
            var listTypeSplit = _this.filterTypes.split("|");
            for (var v = 0; v < listTypeSplit.length; v++)
            {
                if (xpathSelector.length > 0)
                {
                    xpathSelector += " or ";
                }
                xpathSelector += "@ItemType = '" + listTypeSplit[v] + "'";
            }
            popupXML = returnedXml.selectNodes("//Item[" + xpathSelector + "]");
        }
        else if (_this.filterElements)
        {
            var newItemDoc = parseXML("<Items/>");
            var listElementsSplit = _this.filterElements.split("|");
            for (var v = 0; v < listElementsSplit.length; v++)
            {
                nodes = returnedXml.selectNodes("//Item/" + listElementsSplit[v]);
                for (var w = 0; w < nodes.length; w++)
                {
                    var newNode = newItemDoc.createElement("Item");
                    newNode.setAttribute("ItemType", listElementsSplit[v]);
                    var newValueNode = newItemDoc.createElement("Value");
                    newValueNode.appendChild(newItemDoc.createTextNode(nodes[w].text));
                    var newDisplayNode = newItemDoc.createElement("DisplayName");
                    newDisplayNode.appendChild(newItemDoc.createTextNode(nodes[w].text));
                    newNode.appendChild(newDisplayNode);
                    newNode.appendChild(newValueNode);
                    newItemDoc.documentElement.appendChild(newNode);

                    // Adding validation to new nodes
                    if (checkExistsNotEmpty(nodes[w].getAttribute('ValidationStatus')))
                    {
                        newNode.setAttribute("ValidationStatus", nodes[w].getAttribute('ValidationStatus'));
                        newNode.setAttribute("ValidationMessages", nodes[w].getAttribute('ValidationMessages'));
                    }
                }
            }
            popupXML = newItemDoc.selectNodes("/Items/Item");
        }
        else if (_this.filterAttributes)
        {
            var newItemDoc = parseXML("<Items/>");
            var listAttributesSplit = _this.filterAttributes.split("|");
            for (var v = 0; v < listAttributesSplit.length; v++)
            {
                nodes = returnedXml.selectNodes("//Item/@" + listAttributesSplit[v]);
                for (var w = 0; w < nodes.length; w++)
                {
                    var newNode = newItemDoc.createElement("Item");
                    newNode.setAttribute("ItemType", listAttributesSplit[v]);
                    var newValueNode = newItemDoc.createElement("Value");
                    newValueNode.appendChild(newItemDoc.createTextNode(nodes[w].text));
                    var newDisplayNode = newItemDoc.createElement("DisplayName");
                    newDisplayNode.appendChild(newItemDoc.createTextNode(nodes[w].text));
                    newNode.appendChild(newDisplayNode);
                    newNode.appendChild(newValueNode);
                    newItemDoc.documentElement.appendChild(newNode);
                }
            }
            popupXML = newItemDoc.selectNodes("/Items/Item");

        } else if (_this.filterSubTypes)
        {
            var xpathSelector = "";
            var filterSubTypes = _this.filterSubTypes.split("|");
            for (var v = 0; v < filterSubTypes.length; v++)
            {
                if (xpathSelector.length > 0)
                {
                    xpathSelector += " or ";
                }
                xpathSelector += "@SubType = '" + filterSubTypes[v] + "'";
            }
            popupXML = returnedXml.selectNodes("//Item[" + xpathSelector + "]");
        }
        else
        {
            popupXML = returnedXml.selectNodes("//Item");
        }

        if (popupXML.length === 0 && _this.showPopup)
        {
            popupManager.showNotification(Resources.CommonPhrases.NoItemsToDisplay);
        }

        _this.contextMenuXML = popupXML;

        if (_this.showPopup)
        {
            _this.showContextMenu();
        } else if (_this.isHidden)
        {
            if (popupXML.length > 0)
            {
                //setTimeout(function() { _this.setValues(popupXML[0]) }, 0); //break the thread so that jquery jumps out of the event
                _this.setValues(popupXML[0]); //sometimes the thread does not complete in time to display the initialized values
            }
            else if (popupXML.length == 0) // This will only happen if a hidden part was suppose to have a value and now it doesnt
            {
                _this.setHiddenNullValues();
            }
        }
        else if (popupXML.length === 1 || (popupXML.length > 1 && _this.selectionType && _this.selectionType === 'First'))
        {
            //setTimeout(function() { _this.setValues(popupXML[0]) }, 0); //break the thread so that jquery jumps out of the event
            _this.setValues(popupXML[0]); //sometimes the thread does not complete in time to display the initialized values
        } else if (popupXML.length > 1 && _this.selectionType && _this.selectionType === 'MultiPopup')
        {
            _this.showContextMenu();
        } else
        {
            //if this value has been set before check that it is a valid value else clear it.
            if (_this.value)
            {
                var foundValue = false;
                for (var k = 0; k < popupXML.length; k++)
                {
                    var node = popupXML[k];
                    var value = _this._getNodeIdentifyingValue(node);
                    if (value === _this.value)
                    {
                        foundValue = true;
                        break;
                    }
                }
                if (!foundValue)
                {
                    _this.display = null;
                    _this.data = null;
                    _this.value = null;

                    SourceCode.Forms.Designers.Rule.onWidgetCompleted(_this);
                }
            }
        }


    },

    _getNodeIdentifyingValue: function (node)
    {
        var returnNode = null;

        //get value from parameters xpath
        if (checkExists(this.valueXPath))
            returnNode = node.selectSingleNode(this.valueXPath)

        //if the value could not be retrieve or the parameter did not exist fall back to the old logic
        if (!checkExists(returnNode))
            returnNode = node.selectSingleNode("Value");
        if (!checkExists(returnNode))
            returnNode = node.selectSingleNode("@Guid");
        if (!checkExists(returnNode))
            returnNode = node.selectSingleNode("Name");

        if (checkExists(returnNode))
            return returnNode.text;
        else
            return null;
    },

    _getNodeDisplayValue: function (node)
    {
        var returnNode = null;

        //get value from parameters xpath
        if (checkExists(this.displayXPath))
            returnNode = node.selectSingleNode(this.displayXPath)

        //if the value could not be retrieve or the parameter did not exist fall back to the old logic
        if (!checkExists(returnNode))
            returnNode = node.selectSingleNode("DisplayName");

        if (checkExists(returnNode))
            return returnNode.text;
        else
            return null;
    },

    _getValidationStatus: function (node)
    {
        return node.getAttribute("ValidationStatus");
    },

    _getValidationMessages: function (node)
    {
        return node.getAttribute("ValidationMessages");
    },

    setValues: function (node)
    {
        this.display = this._getNodeDisplayValue(node);
        this.data = node;
        this.value = this._getNodeIdentifyingValue(node);
        this.validationStatus = this._getValidationStatus(node);
        this.validationMessages = this._getValidationMessages(node);

        SourceCode.Forms.Designers.Rule.onWidgetCompleted(this);
    },

    setHiddenNullValues: function ()
    {
        SourceCode.Forms.Designers.Rule.onWidgetCompleted(this, true);
    },

    showContextMenu: function ()
    {
        if (checkExists(rulesWizardContextMenuInstance))
        {
            rulesWizardContextMenuInstance.closeMenu();
            $("#RuleDesignerContext").remove();
        }
        rulesWizardContextMenuInstance = new ContextMenu({ id: "RuleDesignerContext" });

        var _this = this;
        if (!this.sortResults || this.sortResults === "True")
            _this.sortContextItems();

        for (var q = 0; q < _this.contextMenuXML.length; q++)
        {
            var xmlElement = _this.contextMenuXML[q];
            var displayName = this._getNodeDisplayValue(xmlElement);
            var name = xmlElement.selectSingleNode("Name");
            var description = xmlElement.selectSingleNode("Description");
            var itemType = xmlElement.getAttribute("ItemType").toLowerCase();
            var subType = $chk(xmlElement.getAttribute("SubType")) ? xmlElement.getAttribute("SubType").toLowerCase() : null;
            var icon = itemType;
            var xml = _this.contextMenuXML[q];
            var textElement = xmlElement.selectSingleNode("Text");
            var watermarkElement = xmlElement.selectSingleNode("WatermarkText");
            var tooltipElement = xmlElement.selectSingleNode("Tooltip");
            var titleElement = xmlElement.selectSingleNode("Title");
            var text = "";
            var addNewLine = false;

            if (checkExists(textElement))
            {
                text = Resources.RuleDesigner.TextTooltip.format(textElement.text);
                addNewLine = true;
            }

            if (checkExists(watermarkElement))
            {
                if (addNewLine === true)
                {
                    text += "\n";
                }

                text += Resources.RuleDesigner.WatermarkTextTooltip.format(watermarkElement.text);
                addNewLine = true;
            }

            if (checkExists(tooltipElement))
            {
                if (addNewLine === true)
                {
                    text += "\n";
                }

                text += Resources.RuleDesigner.TooltipTooltip.format(tooltipElement.text);
                addNewLine = true;
            }

            if (checkExists(titleElement))
            {
                if (addNewLine === true)
                {
                    text += "\n";
                }

                if (text === "" && itemType === "form")
                {
                    text += titleElement.text;
                }
                else
                {
                    text += Resources.RuleDesigner.TitleTooltip.format(titleElement.text);
                }
            }

            if (text === "" && (itemType === "form" || itemType === "view" || itemType === "smartobject"))
            {
                text = SourceCode.Forms.Interfaces.AppStudio.formatTitleForSystemName(name, description);
            }

            var fn = (function (xml)
            {
                return function ()
                {
                    _this.contextMenuItemSelected(xml, _this);
                }
            })(xml);

            if (subType !== null)
            {
                //LG: This sets the icon css class 
                // TFS 754234 - re-order to fit the form "formparameter-text" as used in the LESS files
                // But dont break controls, which need to see "content-control"
                var classTemplate = "{0}-{1} icon ic-{1}";
                if (itemType === "control")
                {
                    classTemplate = "{1}-{0} icon ic-{1}"
                }

                icon = classTemplate.format(itemType, subType);
            }

            rulesWizardContextMenuInstance.addItem({
                text: displayName,
                icon: icon,
                description: text,
                onClick: fn
            });
        }

        var controlX = jQuery("#" + this.controlID).offset().left + jQuery("#" + this.controlID).width();
        var controlY = jQuery("#" + this.controlID).offset().top + 10;
        rulesWizardContextMenuInstance.showContextMenuAt({ x: controlX, y: controlY });
    },

    sortContextItems: function ()
    {
        var newXmlDoc = parseXML("<Items/>");
        var displayNameArray = [];
        for (var h = this.contextMenuXML.length - 1; h >= 0; h--)
        {
            var item = this.contextMenuXML[h];
            var displayname = this._getNodeDisplayValue(item);

            if (displayname)
            {
                displayname = displayname.toLowerCase()
                var clonedNode = item.cloneNode(true);
                pos = displayNameArray.length;
                for (var k = 0; k < displayNameArray.length; k++)
                {
                    if (displayNameArray[k] >= displayname)
                    {
                        pos = k;
                        break;
                    }
                }
                if (pos === displayNameArray.length)
                {
                    displayNameArray.push(displayname);
                    newXmlDoc.documentElement.appendChild(clonedNode);
                } else
                {
                    displayNameArray.splice(pos, 0, displayname);

                    newXmlDoc.documentElement.insertBefore(clonedNode, newXmlDoc.documentElement.selectNodes("Item")[pos]);
                }
            }
        }
        this.contextMenuXML = null;
        this.contextMenuXML = newXmlDoc.selectNodes("/Items/Item");
    },

    contextMenuItemSelected: function (xml, _this)
    {
        _this.setValues(xml);
    },

    getItemsFromParentForHiddenPart: function ()
    {
        var dsName;
        var val;

        var fn = eval(this.methodToExecute);
        //var fn = eval("window.parent." + this.methodToExecute);
        //var fn = window.parent[this.methodToExecute];
        var result = fn.call(this);

        if (result.xml)
        {
            dsName = this._getNodeDisplayValue(result);
            val = this._getNodeIdentifyingValue(result);
        } else
        {
            val = result;
        }

        this.display = dsName;
        this.data = result;
        this.value = val;

        SourceCode.Forms.Designers.Rule.onWidgetCompleted(this);
    }

}
