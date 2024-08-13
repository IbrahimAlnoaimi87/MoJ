
//it gets its targetXml data from the specified plugin in the utils item xml format.
//it then displays the xml and saves a result.
function ReadOnlyWidget()
{
}
var ReadOnlyWidgetProtoType =
{
    initialize: function (parentElement)
    {
        this.getItemsFromPlugIn();
    },

    getItemsFromPlugIn: function ()
    {
        this.pluginReturnedId = "".generateGuid() + ".pluginReturned";

        this.boundPluginReturn = this.pluginReturn.bind(this);
        jQuery(document.body).on(this.pluginReturnedId, null, this, this.boundPluginReturn);

        var pluginType = evalFunction(this.pluginName);
        var plugin = new pluginType();
        plugin.dataType = 'target';
        plugin.Settings = this; //TODO it would be better if this could be settings or parameters.
        plugin.pluginReturnedId = this.pluginReturnedId;

        plugin[this.pluginMethod]();
    },

    pluginReturn: function (e)
    {
        var _this = e.data;

        //each time a plugin returns it calls this function.
        if ((typeof _this.pluginReturnedId !== "undefined") && (_this.pluginReturnedId !== null) && (_this.pluginReturnedId !== ""))
        {
            jQuery(document.body).off(_this.pluginReturnedId, null, _this.boundPluginReturn);
        }

        _this.returnedXml = e.detail.xml;
        var popupXML = _this.returnedXml.selectNodes("//Item[@ItemType='Control']");

        if (popupXML.length > 0)
        {
            _this._scalePercentage = 0.8;

            var options =
            {
                url: applicationRoot + "Rules/ReadOnly.aspx",
                type: 'GET',
                cache: false,
                //data: data,
                dataType: "text",
                async: false,
                success:
                    function (responseText, textStatus, XMLHttpRequest)
                    {
                        if (SourceCode.Forms.ExceptionHandler.isException(responseText))
                        {
                            SourceCode.Forms.ExceptionHandler.handleException(responseText);

                            return;
                        }

                        var headerText = jQuery("#" + _this.controlID).closest("li").data("xml").selectSingleNode("Message").text;
                        var response = responseText;

                        var popupOption = {
                            buttons: [
                                { type: "help", click: function () { HelpHelper.runHelp(7051); } },
                                { text: Resources.WizardButtons.OKButtonText, click: function () { with (_this) { _this.getConfigurationXML() } } },
                                { text: Resources.WizardButtons.CancelButtonText, click: function () { with (_this) { popupManager.closeLast(); } } }
                            ],
                            headerText: headerText,
                            content: response,
                            modalize: true,
                            maximizable: true,
                            width: Math.floor(jQuery(window).width() * _this._scalePercentage),
                            height: Math.floor(jQuery(window).height() * _this._scalePercentage)
                        }

                        _this.popup = popupManager.showPopup(popupOption);

                        //hide the popup by moving it off screen until the layout is correct
                        _this.left = _this.popup[0].style.left;
                        _this.popup[0].style.left = "-9999px";

                        _this._buildUI();

                        setTimeout(function ()
                        {
                            //show the popup by moving it on screen again
                            _this.popup[0].style.left = _this.left;

                            //hide the rules modalizer
                            jQuery("#ruleWizardPopup").modalize(false).showBusy(false);
                        }, 0);
                    },
                error:
                    function (responseText, textStatus, XMLHttpRequest)
                    {
                        if (SourceCode.Forms.ExceptionHandler.isException(responseText.responseText))
                        {
                            SourceCode.Forms.ExceptionHandler.handleException(responseText.responseText);

                            return;
                        }
                    }
            }

            jQuery.ajax(options);
        }
        else
        {
            jQuery("#ruleWizardPopup").modalize(false).showBusy(false);
        }
    },

    _getFormItems: function ()
    {
        return this.returnedXml.selectNodes("//Item[@ItemType='Form']");
    },

    _getViewItems: function ()
    {
        return this.returnedXml.selectNodes("//Item[@ItemType='View']");
    },

    getValueXml: function ()
    {
        if (typeof this._valueXml === "undefined")
        {
            if (checkExistsNotEmpty(this.value))
            {
                this._valueXml = parseXML(this.value);
            }
            else
            {
                this._valueXml = null;
            }
        }
        return this._valueXml;
    },

    //model structure

    //items:
    //key=stringid
    //{
    //	children:[stringid]
    //	parent:stringid
    //}
    //model
    //	{
    //		"root": 
    //		{
    //			children:["child1","child2"],
    //			parent:null
    //		}
    //		"child1":
    //		{
    //			children:null,
    //			parent:"root"
    //		}
    //		"child2":
    //		{
    //			children:null,
    //			parent:"root"
    //		}
    _getControlNodes: function (nodeContext)
    {
        if (!checkExists(ReadOnlyWidgetProtoType.readonlySupportingControls))
        {
            ReadOnlyWidgetProtoType.readonlySupportingControls = "[";
            var readOnlyControlXPath = "Controls/Control[DefaultProperties/Properties/Prop[@ID='IsReadOnly']]/Name";
            var readOnlyControlNodes = SourceCode.Forms.Designers.Common.controlDefinitionsXml.selectNodes(readOnlyControlXPath);
            var rol = readOnlyControlNodes.length;
            for (var j = 0; j < rol; j++)
            {
                ReadOnlyWidgetProtoType.readonlySupportingControls += "@SubType={0}".format(readOnlyControlNodes[j].text.xpathValueEncode());
                if (j !== rol - 1)
                {
                    ReadOnlyWidgetProtoType.readonlySupportingControls += " or ";
                }
            }
            ReadOnlyWidgetProtoType.readonlySupportingControls += "]";
        }
        var xpath = "Items/Item[@ItemType='Control']" + ReadOnlyWidgetProtoType.readonlySupportingControls;
        return nodeContext.selectNodes(xpath);
    },

    _buildUI: function ()
    {
        var _this = this;
        this._model = {};

        var rows = [];
        var parentsToCheck = [];

        _this.readOnlyGrid = jQuery("#rwReadOnlyGrid").grid();

        var data;

        var formItems = _this._getFormItems();
        var formItemsLength = formItems.length;
        var subformID;
        var state = "";
        if (formItemsLength > 0)
        {
            subformID = this.subformID;

            for (var f = 0; f < formItemsLength; f++)
            {
                data = null;
                var currentFormItem = formItems[f];
                var formDisplayName = currentFormItem.selectSingleNode("DisplayName").text;
                var formGuid = currentFormItem.getAttribute("Guid");

                var formControls = this._getControlNodes(formItems[f]);
                var formControlsLength = formControls.length;
                var instanceID = currentFormItem.selectSingleNode("InstanceID") !== null ? currentFormItem.selectSingleNode("InstanceID").text : null;

                if (formControlsLength > 0)
                {
                    data =
                    {
                        parentName: formDisplayName,
                        parentGuid: formGuid,
                        parentType: "form",
                        instanceID: null,
                        subformID: null,
                        subformInstanceID: null
                    }

                    if (checkExistsNotEmpty(subformID))
                    {
                        data.subformID = subformID;
                        data.subformInstanceID = instanceID;
                    }
                    else
                    {
                        data.instanceID = instanceID;
                    }

                    var parentReturnData = _this._addAllControlsItem(data, rows);
                    state = "";
                    for (var c = 0; c < formControlsLength; c++)
                    {
                        var currentControlItem = formControls[c];
                        var controlDisplayName = currentControlItem.selectSingleNode("DisplayName").text;
                        var controlName = currentControlItem.selectSingleNode("Name").text;
                        var controlGuid = currentControlItem.getAttribute("Guid");
                        var controlType = currentControlItem.getAttribute("SubType");

                        data = {
                            parentName: formDisplayName,
                            parentGuid: formGuid,
                            controlName: controlName,
                            controlDisplayName: controlDisplayName,
                            controlGuid: controlGuid,
                            controlType: controlType,
                            instanceID: null,
                            subformID: null,
                            subformInstanceID: null,
                            parentReturnData: parentReturnData
                        }

                        if (checkExistsNotEmpty(subformID))
                        {
                            data.subformID = subformID;
                            data.subformInstanceID = instanceID;
                        }
                        else
                        {
                            data.instanceID = instanceID;
                        }

                        _this._addControlItem(data, rows);
                        if (state === "")
                        {
                            state = data.state;
                        }
                        if (state !== data.state)
                        {
                            state = "mixed";
                        }
                    }
                    if (state !== "mixed")
                    {
                        parentsToCheck.push(state);
                    }
                }
            }
        }

        var viewItems = _this._getViewItems();
        var viewItemsLength = viewItems.length;
        if (viewItems.length > 0)
        {
            subformID = this.subformID;

            for (var v = 0; v < viewItemsLength; v++)
            {
                data = null;
                var currentViewItem = viewItems[v];
                var viewDisplayName = currentViewItem.selectSingleNode("DisplayName").text;
                var viewGuid = currentViewItem.getAttribute("Guid");
                var viewControls = this._getControlNodes(currentViewItem);
                var viewControlsLength = viewControls.length;
                var instanceID = currentViewItem.selectSingleNode("InstanceID") !== null ? currentViewItem.selectSingleNode("InstanceID").text : null;

                data = {
                    parentName: viewDisplayName,
                    parentGuid: viewGuid,
                    parentType: "view",
                    instanceID: null,
                    subformID: null,
                    subformInstanceID: null
                };

                if (checkExistsNotEmpty(subformID))
                {
                    data.subformID = subformID;
                    data.subformInstanceID = instanceID;
                }
                else
                {
                    data.instanceID = instanceID;
                }

                if (viewControlsLength > 0)
                {
                    var parentReturnData = _this._addAllControlsItem(data, rows);
                    state = "";
                    for (var c = 0; c < viewControlsLength; c++)
                    {
                        var currentControlItem = viewControls[c];
                        var controlDisplayName = currentControlItem.selectSingleNode("DisplayName").text;
                        var controlName = currentControlItem.selectSingleNode("Name").text;
                        var controlGuid = currentControlItem.getAttribute("Guid");
                        var controlType = currentControlItem.getAttribute("SubType");

                        data = {
                            parentName: viewDisplayName,
                            parentGuid: viewGuid,
                            controlName: controlName,
                            controlDisplayName: controlDisplayName,
                            controlGuid: controlGuid,
                            controlType: controlType,
                            instanceID: null,
                            subformID: null,
                            subformInstanceID: null,
                            parentReturnData: parentReturnData
                        }

                        if (checkExistsNotEmpty(subformID))
                        {
                            data.subformID = subformID;
                            data.subformInstanceID = instanceID;
                        }
                        else
                        {
                            data.instanceID = instanceID;
                        }

                        _this._addControlItem(data, rows);
                        if (state === "")
                        {
                            state = data.state;
                        }
                        if (state !== data.state)
                        {
                            state = "mixed";
                        }
                    }
                    if (state !== "mixed")
                    {
                        parentsToCheck.push(state);
                    }
                }
            }
        }
        _this.readOnlyGrid.grid('add', 'rows', rows);

        _this.readOnlyGrid.find("input").radiobutton();
        _this.readOnlyGrid.on("click", ".all-edit input",
            function ()
            {
                _this._allRadiobuttonSelected(this);
            });

        _this.readOnlyGrid.on("click", ".single-edit input",
            function ()
            {
                _this._radioButtonSelected(this);
            });

        if (checkExistsNotEmpty(_this.getValueXml()))
        {
            for (var i = 0; i < parentsToCheck.length; i++)
            {
                $(document.getElementById(parentsToCheck[i])).radiobutton("check");
            }
        }

        _this.readOnlyGrid.grid('syncWidths');
    },

    _addAllControlsItem: function (data, rows)
    {
        var _this = this;
        var unChangedParentID = String.generateGuid();
        var readOnlyParentID = String.generateGuid();
        var editableParentID = String.generateGuid();
        var controlGroupName = data.parentGuid;
        var mixedID = String.generateGuid();

        if (checkExistsNotEmpty(data.subformID) && checkExistsNotEmpty(data.subformInstanceID))
        {
            unChangedParentID += "_{0}".format(data.subformInstanceID);
            readOnlyParentID += "_{0}".format(data.subformInstanceID);
            editableParentID += "_{0}".format(data.subformInstanceID);
            controlGroupName += "_{0}".format(data.subformInstanceID);
        }
        else if (checkExistsNotEmpty(data.instanceID))
        {
            unChangedParentID += "_{0}".format(data.instanceID);
            readOnlyParentID += "_{0}".format(data.instanceID);
            editableParentID += "_{0}".format(data.instanceID);
            controlGroupName += "_{0}".format(data.instanceID);
        }

        // Add View/Form item to grid
        rows.push(
            [
                {
                    value: data.parentGuid,
                    display: data.parentName,
                    icon: data.parentType
                },
                {
                    value: data.parentGuid,
                    display: Resources.RuleDesigner.ReadOnlyWidgetAllControls,
                    cellclass: "all-items"
                },
                {
                    html: SCRadiobutton.html({ name: controlGroupName, value: "unchanged", checked: "checked", id: unChangedParentID }),
                    value: "unchanged",
                    cellclass: "edit-mode all-edit"
                },
                {
                    html: SCRadiobutton.html({ name: controlGroupName, value: "readOnly", id: readOnlyParentID }),
                    value: "readOnly",
                    cellclass: "edit-mode all-edit"
                },
                {
                    html: SCRadiobutton.html({ name: controlGroupName, value: "editable", id: editableParentID }),
                    value: "editable",
                    cellclass: "edit-mode all-edit"
                },
                {
                    html: SCRadiobutton.html({ name: controlGroupName, value: "mixed", id: mixedID }),
                    value: "mixed",
                    cellclass: "edit-mode all-edit"
                }
            ]);

        var returnData =
        {
            allUnchangedRadiobuttonID: unChangedParentID,
            allReadOnlyRadiobuttonID: readOnlyParentID,
            allEditableRadiobuttonID: editableParentID,
            mixedID: mixedID
        }
        data.mixedID = mixedID;

        this._model[unChangedParentID] = {
            data: data,
            children: []
        };
        this._model[readOnlyParentID] =
        {
            data: data,
            children: []
        }
        this._model[editableParentID] =
        {
            data: data,
            children: []
        }
        return returnData;
    },

    _addControlItem: function (data, rows)
    {
        var _this = this;
        var readOnlyChecked = false;
        var unchangedChecked = true;
        var editableChecked = false;
        var valueXmlDoc;

        if (checkExists(_this.getValueXml()))
        {
            valueXmlDoc = _this.getValueXml();
            var mappingNodeXPath = "Mappings/Mapping[@ActionPropertyCollection='Parameters']/Item[(@ContextType='target') and (@ItemType='ControlProperty') and (@TargetPath='" + data.controlGuid + "')";

            // Check for instanceID
            if (checkExistsNotEmpty(data.instanceID))
            {
                mappingNodeXPath += "and (@InstanceID='" + data.instanceID + "')";
            }

            if (checkExistsNotEmpty(data.subformInstanceID))
            {
                mappingNodeXPath += "and (@SubFormInstanceID='" + data.subformInstanceID + "')";
            }

            // Check for subformID
            if (checkExistsNotEmpty(data.subformID))
            {
                mappingNodeXPath += "and (@SubFormID='" + data.subformID + "')";
            }
            mappingNodeXPath += "]";

            // Get node by XPath
            var mappingNode = valueXmlDoc.selectSingleNode(mappingNodeXPath);

            // if the node is not null, its value has been changes and the relevant radiobutton must be checked
            if (mappingNode !== null)
            {
                var mappingContextNode = mappingNode.parentNode.selectSingleNode("Item[@ContextType='value']");
                if (mappingContextNode !== null)
                {
                    if (mappingContextNode.text === "true")
                    {
                        readOnlyChecked = true;
                    }
                    else
                    {
                        editableChecked = true;
                    }

                    unchangedChecked = false;
                }
            }
        }
        data.state = (readOnlyChecked) ? data.parentReturnData.allReadOnlyRadiobuttonID : data.state;
        data.state = (editableChecked) ? data.parentReturnData.allEditableRadiobuttonID : data.state;
        data.state = (unchangedChecked) ? data.parentReturnData.allUnchangedRadiobuttonID : data.state;

        var unchangedID = String.generateGuid();
        var readOnlyID = String.generateGuid();
        var editableID = String.generateGuid();
        var controlGroupName = data.controlGuid;

        if (checkExistsNotEmpty(data.subformID) && checkExistsNotEmpty(data.subformInstanceID))
        {
            unchangedID += "_{0}".format(data.subformInstanceID);
            readOnlyID += "_{0}".format(data.subformInstanceID);
            editableID += "_{0}".format(data.subformInstanceID);
            controlGroupName += "_{0}".format(data.subformInstanceID);
        }
        else if (checkExistsNotEmpty(data.instanceID))
        {
            unchangedID += "_{0}".format(data.instanceID);
            readOnlyID += "_{0}".format(data.instanceID);
            editableID += "_{0}".format(data.instanceID);
            controlGroupName += "_{0}".format(data.instanceID);
        }

        this._model[unchangedID] =
        {
            data: data,
            parent: data.parentReturnData.allUnchangedRadiobuttonID
        };
        this._model[data.parentReturnData.allUnchangedRadiobuttonID].children.push(unchangedID);

        this._model[readOnlyID] =
        {
            data: data,
            parent: data.parentReturnData.allReadOnlyRadiobuttonID
        };
        this._model[data.parentReturnData.allReadOnlyRadiobuttonID].children.push(readOnlyID);

        this._model[editableID] =
        {
            data: data,
            parent: data.parentReturnData.allEditableRadiobuttonID
        };
        this._model[data.parentReturnData.allEditableRadiobuttonID].children.push(editableID);

        // Add control item to grid
        rows.push(
            [
                {
                    value: data.parentGuid,
                    display: " "
                },
                {
                    value: data.controlGuid,
                    display: data.controlName,
                    icon: data.controlType.toLowerCase() + "-control"
                },
                {
                    html: SCRadiobutton.html(
                        {
                            name: controlGroupName,
                            value: "unchanged",
                            checked: unchangedChecked,
                            id: unchangedID
                        }),
                    value: "unchanged",
                    cellclass: "edit-mode single-edit"
                },
                {
                    html: SCRadiobutton.html(
                        {
                            name: controlGroupName,
                            value: "readOnly",
                            id: readOnlyID,
                            checked: readOnlyChecked
                        }),
                    value: "readOnly",
                    cellclass: "edit-mode single-edit"
                },
                {
                    html: SCRadiobutton.html(
                        {
                            name: controlGroupName,
                            value: "editable",
                            id: editableID,
                            checked: editableChecked
                        }),
                    value: "editable",
                    cellclass: "edit-mode single-edit"
                }
            ]);
    },

    _allRadiobuttonSelected: function (_this)
    {
        var childControlGuids = this._model[_this.id].children;
        var childControlsLength = childControlGuids.length;

        for (var c = 0; c < childControlsLength; c++)
        {
            var childControl = jQuery("#" + childControlGuids[c]);
            childControl.radiobutton("check");
        }
    },

    _radioButtonSelected: function (_this)
    {
        var parentID = this._model[_this.id].parent;

        var parent = jQuery(document.getElementById(parentID));
        if (!parent.is(":checked"))
        {
            var parentModel = this._model[parentID];
            var parentMixedControl = jQuery("#" + parentModel.data.mixedID);
            var children = parentModel.children;
            var childControlsLength = children.length;
            var allChecked = true;
            for (var p = 0; p < childControlsLength && allChecked; p++)
            {
                var parentChildControl = jQuery("#" + children[p]);
                allChecked = parentChildControl.is(":checked");
            }
            if (allChecked)
            {
                parent.radiobutton("check");
                return true;
            }
            else
            {
                parentMixedControl.radiobutton("check");
                return false;
            }
        }
    },

    dispose: function ()
    {
    },

    setConfigurationXml: function (configurationXml)
    {
        if (configurationXml)
        {
            var savedXmlDoc = parseXML(configurationXml);
            var savedMapping = savedXmlDoc.selectSingleNode("/Mappings/Mapping");
            if (savedMapping)
            {

            }
        }
    },

    getConfigurationXML: function ()
    {
        var rows = this.readOnlyGrid.grid("fetch", "rows");
        var rowsLength = rows.length;
        var configurationXML = parseXML("<Mappings/>");
        var itemsCreatedCount = 0;

        for (var r = 0; r < rowsLength; r++)
        {
            var currentRow = jQuery(rows[r]);
            var parentColumn = currentRow.find(">td:nth-child(1)");
            var controlColumn = currentRow.find(">td:nth-child(2)");
            var parentColumnValue = parentColumn.metadata().value;
            var controlColumnValue = controlColumn.metadata().value;

            if (parentColumnValue !== controlColumnValue)
            {
                var unchangedRadiobutton = currentRow.find(">td:nth-child(3) input");

                if (!unchangedRadiobutton.is(":checked"))
                {
                    var dataID = unchangedRadiobutton[0].id;
                    var modelObject = this._model[dataID];
                    var readOnlyRadiobutton = currentRow.find(">td:nth-child(4) input");
                    var editableRadiobutton = currentRow.find(">td:nth-child(5) input");
                    var targetIDValue = "isreadonly";
                    var sourceValue = "";
                    var targetInstanceID = modelObject.data.instanceID;
                    var targetSubFormID = modelObject.data.subformID;
                    var targetSubFormInstanceID = modelObject.data.subformInstanceID;
                    var controlData;

                    if (readOnlyRadiobutton.is(":checked"))
                    {
                        sourceValue = "true";
                        controlData = readOnlyRadiobutton.data();
                    }
                    else
                    {
                        sourceValue = "false";
                        controlData = editableRadiobutton.data();
                    }

                    if (checkExists(controlData.instanceID))
                    {
                        targetInstanceID = controlData.instanceID;
                    }

                    if (checkExists(controlData.subformID))
                    {
                        targetSubFormID = controlData.subformID;
                    }

                    if (checkExists(controlData.subformInstanceID))
                    {
                        targetSubFormInstanceID = controlData.subformInstanceID;
                    }

                    // Create Mappings Element
                    var mappingElement = configurationXML.createElement("Mapping");
                    mappingElement.setAttribute("ActionPropertyCollection", "Parameters");

                    // Create Context Item
                    var contextElement = configurationXML.createElement("Item");
                    contextElement.setAttribute("ContextType", "value");
                    contextElement.appendChild(configurationXML.createTextNode(sourceValue));
                    mappingElement.appendChild(contextElement);

                    // Create Target Item
                    var targetElement = configurationXML.createElement("Item");
                    targetElement.setAttribute("TargetType", "ControlProperty");
                    targetElement.setAttribute("ContextType", "target");
                    targetElement.setAttribute("TargetID", targetIDValue);
                    targetElement.setAttribute("TargetPath", controlColumnValue);
                    targetElement.setAttribute("ItemType", "ControlProperty");
                    targetElement.setAttribute("TargetName", controlData.controlName);
                    targetElement.setAttribute("TargetDisplayName", controlData.controlDisplayName);

                    // Set instanceID if exists
                    if (checkExists(targetInstanceID))
                    {
                        targetElement.setAttribute("InstanceID", targetInstanceID);
                    }

                    // Set subformID if exists
                    if (checkExists(targetSubFormID))
                    {
                        targetElement.setAttribute("SubFormID", targetSubFormID);
                    }

                    if (checkExists(targetSubFormInstanceID))
                    {
                        targetElement.setAttribute("SubFormInstanceID", targetSubFormInstanceID);
                    }

                    // Add targetElement to mappingElement
                    mappingElement.appendChild(targetElement);

                    // Append MappingElement to document
                    configurationXML.documentElement.appendChild(mappingElement);

                    itemsCreatedCount++;
                }
            }
        }

        if (itemsCreatedCount > 0)
        {
            var _this = new Object;
            _this.display = "Configured";
            _this.data = configurationXML.firstChild;
            _this.value = configurationXML.xml;
            _this.controlID = this.controlID;

            SourceCode.Forms.Designers.Rule.onWidgetCompleted(_this);

            popupManager.closeLast();
        } else
        {
            popupManager.showWarning(Resources.RuleDesigner.ReadOnlyWidgetNoItemsConfigured);
            return false;
        }
    }
}

jQuery.extend(ReadOnlyWidget.prototype, ReadOnlyWidgetProtoType);
