(function ($)
{

    // Namespacing the Designer
    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Designers === "undefined" || SourceCode.Forms.Designers === null) SourceCode.Forms.Designers = {};
    if (typeof SourceCode.Forms.Designers.View === "undefined" || SourceCode.Forms.Designers.View === null) SourceCode.Forms.Designers.View = {};

    var _parametersPage = SourceCode.Forms.Designers.View.ParametersPage =
        {
            //
            // enum
            //
            ItemStates:
                {
                    New: 0,
                    Edit: 1
                },

            DataTypes:
                {
                    Boolean: 'yesno',
                    DateTime: 'date-time',
                    Number: 'number',
                    Text: 'text'
                },

            KeyCodes:
                {
                    Escape: 27,
                    Delete: 46
                },

            //
            // fields
            //
            _eventBoundItems: null,
            _parameterItems: null,

            _itemState: null,
            _currentName: null,

            _calendar: null,
            _dateFormatPattern: "<Format Type='Date'>d</Format>",

            _htmlChars: null,

            IsValidated: false,

            _skipActivate: false,

            //
            // public methods
            //
            initialize: function ()
            {
                _parametersPage._eventBoundItems = [];
                _parametersPage._parameterItems = [];

                var addbutton = jQuery("#toolAddParameter");
                addbutton.on("click", this._addParameter);
                _parametersPage._eventBoundItems.push(addbutton);

                var editbutton = jQuery("#toolEditParameter");
                editbutton.on("click", this._editParameter);
                _parametersPage._eventBoundItems.push(editbutton);

                var removebutton = jQuery("#toolRemoveParameter");
                removebutton.on("click", this._promptRemoveParameter);
                _parametersPage._eventBoundItems.push(removebutton);

                jQuery("#toolEditParameter").addClass("disabled");
                jQuery("#toolRemoveParameter").addClass("disabled");

                var grid = jQuery("#ParametersGrid");

                // initialize grid element
                grid.grid(
                    {
                        showcustomcontextmenu: false,
                        actionrowclick: this._addParameter,
                        rowdblclick: this._editParameter,
                        rowselect: this._rowSelected,
                        sorting: false
                    });

                _parametersPage._htmlChars = ['&', '\'', '"', '<', '>'];

                // bind keys
                jQuery("#ParametersGrid").on('keyup.View.Parameters', _parametersPage._keyUp);

                _parametersPage._skipActivate = false;
            },

            activate: function ()
            {
                var gridWidget = jQuery("#ParametersGrid");
                gridWidget.grid("synccolumns");

                var controls = _parametersPage._getEditControls();

                if (checkExists(controls.name))
                {
                    controls.name.trigger("focus");
                }

                if (_parametersPage._skipActivate)
                {
                    return;
                }

                _parametersPage.IsValidated = false;

                _parametersPage._itemState = null;
                _parametersPage._parameterItems = [];

                // check if xml exists
                var parameterNodes = _parametersPage.View.viewDefinitionXML.selectNodes("//Views/View/Parameters/Parameter");
                var len = parameterNodes.length;
                if (len > 0)
                {
                    var item = null;
                    for (var i = 0; i < len; i++)
                    {
                        var parameter = parameterNodes[i];

                        var paramName = parameter.selectSingleNode("Name");
                        var paramDefaultValue = parameter.selectSingleNode("DefaultValue");

                        item = {
                            name: paramName.text,
                            type: parameter.getAttribute("DataType"),
                            value: checkExists(paramDefaultValue) ? paramDefaultValue.text : "",
                            id: parameter.getAttribute("ID")
                        };
                        _parametersPage._parameterItems.push(item);
                    }
                }

                _parametersPage._refresh();

                _parametersPage._skipActivate = true;
            },

            deactivate: function ()
            {
                _parametersPage._removeEmptyParameter();
            },

            _removeEmptyParameter: function ()
            {
                var controls = _parametersPage._getEditControls();

                if (!checkExists(controls.name) || !checkExists(controls.defaultValue))
                {
                    //If either name and defaultValue text input doesn't exist we shall assume there is no parameter that is in editable mode.
                    return false;
                }

                if (checkExistsNotEmpty(controls.name.val()) || checkExistsNotEmpty(controls.defaultValue.val()))
                {
                    //If either parameter name or defaultValue has value then don't refresh the list
                    return false;
                }

                //Refreshing the list means the empty editable parameter will be removed
                _parametersPage._itemState = null;
                _parametersPage._refresh();

                return true;
            },
            
            _nameExists: function ()
            {
                // check for duplicate names
                var paramItemCount = _parametersPage._parameterItems.length;

                if (paramItemCount > 0)
                {
                    var editCtl = _parametersPage._getEditControls();
                    var editCtlId = editCtl.name.attr('data-id');
                    var editCtlVal = editCtl.name.val();
                    var nameLwr = editCtlVal ? editCtlVal.toLowerCase() : editCtlVal;

                    for (var i = 0; i < paramItemCount; i++)
                    {
                        var paramItem = _parametersPage._parameterItems[i];

                        if (paramItem.id !== editCtlId)
                        {
                            var paramNameLwr = paramItem.name ? paramItem.name.toLowerCase() : paramItem.name;

                            if (paramNameLwr === nameLwr)
                            {
                                return true;
                            }
                        }
                    }
                }

                return false;
            },

            validate: function (ignorePopups, testEmptyName)
            {
                _parametersPage.IsValidated = false;

                _parametersPage._removeEmptyParameter();

                var controls = _parametersPage._getEditControls();

                if (!checkExists(ignorePopups) && !checkExists(testEmptyName))
                {
                    return false;
                }

                if (checkExists(controls.name))
                {
                    // name cannot be empty
                    if ((checkExists(testEmptyName) && testEmptyName) && controls.name.val() === "")
                    {
                        if (!checkExists(ignorePopups) || (checkExists(ignorePopups) && !ignorePopups))
                        {
                            popupManager.showWarning({
                                message: Resources.FormDesigner.ParameterNameValidation,
                                onClose: function ()
                                {
                                    controls.name.trigger("focus");
                                }
                            });
                        }
                        return false;
                    }

                    // make sure name does not contain any HTML special characters

                    //if (stringRegularExpressions.htmlSpecial.test(controls.name.val()))
                    //{
                    var len = _parametersPage._htmlChars.length;
                    for (var i = 0; i < len; i++)
                    {
                        if (controls.name.val().indexOf(_parametersPage._htmlChars[i]) !== -1)
                        {
                            if (!checkExists(ignorePopups) || (checkExists(ignorePopups) && !ignorePopups))
                            {
                                popupManager.showWarning({
                                    message: Resources.ViewDesigner.ViewParameterHTMLCharsNotAllowed,
                                    onClose: function ()
                                    {
                                        controls.defaultValue.trigger("focus");
                                    }
                                });
                            }
                            return false;
                        }
                    }

                    var members = __systemParameters;
                    if (members.indexOf(controls.name.val().toUpperCase().trim()) !== -1)
                    {
                        if (!checkExists(ignorePopups) || (checkExists(ignorePopups) && !ignorePopups))
                        {
                            popupManager.showWarning({
                                message: Resources.FormDesigner.ValidParameterNameValidation.format(members.join(", ")),
                                onClose: function ()
                                {
                                    controls.name.trigger("focus");
                                }
                            });
                        }
                        return false;
                    }

                    // check for duplicates
                    if (_parametersPage._nameExists())
                    {
                        if (!checkExists(ignorePopups) || (checkExists(ignorePopups) && !ignorePopups))
                        {
                            popupManager.showWarning({
                                message: Resources.FormDesigner.UniqueParameterNameValidation,
                                onClose: function ()
                                {
                                    controls.name.trigger("focus");
                                }
                            });
                        }
                        return false;
                    }

                    // check if default values 
                    if (controls.defaultValue.val() !== "")
                    {
                        switch (controls.dataType.val().toLowerCase())
                        {
                            case "number":

                                var numberValue = controls.defaultValue.val().replace(/\./, "");
                                if (!checkExists(numberValue.match(/^[-]?[0-9]*$/)))
                                {
                                    if (!checkExists(ignorePopups) || (checkExists(ignorePopups) && !ignorePopups))
                                    {
                                        popupManager.showWarning({
                                            message: Resources.FormDesigner.ParameterDefaultValueNumericValidation,
                                            onClose: function ()
                                            {
                                                controls.defaultValue.trigger("focus");
                                            }
                                        });
                                    }
                                    return false;
                                }
                                break;

                            case "boolean":

                                if (["0", "1", "false", "true", "yes", "no"].indexOf(controls.defaultValue.val().toLowerCase()) === -1)
                                {
                                    if (!checkExists(ignorePopups) || (checkExists(ignorePopups) && !ignorePopups))
                                    {
                                        popupManager.showWarning({
                                            message: Resources.FormDesigner.ParameterDefaultValueBooleanValidation,
                                            onClose: function ()
                                            {
                                                controls.defaultValue.trigger("focus");
                                            }
                                        });
                                    }
                                    return false;
                                }
                                break;
                        }
                    }
                }

                _parametersPage._apply();
                _parametersPage._updateXml();

                _parametersPage.IsValidated = true;
                return true;
            },

            _updateXml: function ()
            {
                // write to definition
                var i = 0;
                var len = _parametersPage._parameterItems.length;
                var xmlDoc = _parametersPage.View.viewDefinitionXML;
                if (len > 0)
                {
                    var items = _parametersPage._parameterItems;

                    // check if parameter's node exist
                    var parametersNode = xmlDoc.selectSingleNode("//Views/View/Parameters");
                    if (checkExists(parametersNode))
                    {
                        parametersNode.parentNode.removeChild(parametersNode);
                    }

                    parametersNode = xmlDoc.createElement("Parameters");
                    xmlDoc.selectSingleNode("//Views/View").appendChild(parametersNode);

                    for (i = 0; i < len; i++)
                    {
                        var parameter = items[i];

                        if (checkExists(items[i].name) && items[i].name.trim() === "")
                        {
                            continue;
                        }

                        var paramNode = xmlDoc.createElement("Parameter");
                        var id = items[i].id;
                        if (checkExists(id) && id.trim() === "")
                        {
                            id = new String().generateGuid();
                        }
                        paramNode.setAttribute("ID", items[i].id);
                        paramNode.setAttribute("DataType", items[i].type);

                        var newElement = xmlDoc.createElement("Name");
                        newElement.appendChild(xmlDoc.createTextNode(items[i].name));
                        paramNode.appendChild(newElement);

                        newElement = xmlDoc.createElement("DefaultValue");
                        newElement.appendChild(xmlDoc.createTextNode(items[i].value));
                        paramNode.appendChild(newElement);

                        parametersNode.appendChild(paramNode);
                    }

                    _parametersPage.View.viewDefinitionXML.selectSingleNode("//Views/View").appendChild(parametersNode);
                }
            },

            _cleanUp: function ()
            {
                _parametersPage._parameterItems = [];
                if (_parametersPage._eventBoundItems !== null)
                {
                    var len = _parametersPage._eventBoundItems.length;
                    for (var i = 0; i < len; i++)
                    {
                        _parametersPage._eventBoundItems[i].off();
                    }
                    _parametersPage._eventBoundItems = null;
                }

                jQuery("#ParametersGrid").grid("clear");

                jQuery("#toolEditParameter").addClass("disabled");
                jQuery("#toolRemoveParameter").addClass("disabled");

            },

            //
            // private methods
            //

            _addEditRow: function (grid, index)
            {
                var _this = _parametersPage;
                var itmId = '';

                if (checkExists(index))
                {
                    var itm = _parametersPage._parameterItems[index];
                    itmId = itm ? itm.id : '';

                    grid.grid("add", "row",
                        [{ cellclass: "edit-mode", html: SCTextbox.html({ id: "parameterName" }) },
                        { cellclass: "edit-mode", html: _this._createDataTypeDropDown() },
                        { cellclass: "edit-mode", html: SCTextbox.html({ id: "parameterDefaultValue" }) }], false, index);


                }
                else
                {
                    grid.grid("add", "row",
                        [{ cellclass: "edit-mode", html: SCTextbox.html({ id: "parameterName" }) },
                        { cellclass: "edit-mode", html: _this._createDataTypeDropDown() },
                        { cellclass: "edit-mode", html: SCTextbox.html({ id: "parameterDefaultValue" }) }]);
                }

                $('#parameterName').attr('data-id', itmId);

                return _parametersPage._getEditControls();
            },

            _createDataTypeDropDown: function ()
            {
                var dataTypes = this.DataTypes;

                var html = '<select id="parameterDataType" class="icon-control input-control">';

                for (var dataType in dataTypes)
                {
                    html = html.concat('<option class="{0}" value="{1}" {2}>{3}</option>'.format(dataTypes[dataType], dataType, dataType === 'Text' ? ' selected="selected"' : '', dataType));
                }

                return html.concat('</select>');
            },

            _clearSelection: function ()
            {
                jQuery("#ParametersGrid").find(".selected").removeClass("selected");
            },

            _refresh: function ()
            {
                var grid = jQuery("#ParametersGrid");
                grid.grid("clear");

                var len = _parametersPage._parameterItems.length;
                for (var i = 0; i < len; i++)
                {
                    var item = _parametersPage._parameterItems[i];
                    grid.grid("add", "row",
                        [
                            item.name.htmlEncode(),
                            { icon: _parametersPage.DataTypes[item.type], display: item.type },
                            $chk(item.value) ? item.value : ""
                        ]);
                }

                // ensures that we don't have any blinking cursors still showing
                grid.trigger("focus");
            },

            _coerceDefaultValue: function (value, dataType, control)
            {
                var returnValue = "";
                if ($chk(value) && value.strip() !== "")
                {
                    if (dataType === "DateTime")
                    {
                        returnValue = _parametersPage._getCalendar().getCurrentDate(control);
                    }
                    else
                    {
                        returnValue = value.htmlEncode();
                    }
                }
                return returnValue;
            },

            // checks if the any item is currently being added or edited and applying the changes.
            // argument: action - Possible string values: persist,cancel. An undefined value will
            //			 count as a 'persist action.
            _apply: function (action)
            {
                // get controls to retrieve values
                var txtName = jQuery("#parameterName");
                var dropDataType = jQuery("#parameterDataType");
                var txtDefaultValue = jQuery("#parameterDefaultValue");

                if ($chk(action) && typeof action === "string" && action.toLowerCase() === "cancel")
                {
                    _parametersPage._itemState = null;
                    _parametersPage._refresh();
                    return true;
                }

                var defaultValue = _parametersPage._coerceDefaultValue(txtDefaultValue.val(), dropDataType.val(), txtDefaultValue);

                if (_parametersPage._itemState === _parametersPage.ItemStates.New)
                {
                    var newItem = {
                        name: txtName.val(),
                        type: dropDataType.val(),
                        value: defaultValue.replace("<", "").replace(">", ""),
                        id: new String().generateGuid()
                    };
                    _parametersPage._parameterItems.push(newItem);
                    _parametersPage._itemState = null;
                    _parametersPage._refresh();
                }
                else if (_parametersPage._itemState === _parametersPage.ItemStates.Edit)
                {
                    // search for current parameters
                    for (var i = 0; i < _parametersPage._parameterItems.length; i++)
                    {
                        var item = _parametersPage._parameterItems[i];
                        if (item.name === _parametersPage._currentName)
                        {
                            var referenceObj = {
                                id: item.id,
                                name: item.name,
                                displayName: item.name,
                                dataType: item.type,
                                type: "ViewParameter"
                            };

                            item.name = txtName.val();
                            item.type = dropDataType.val();
                            item.value = defaultValue.replace("<", "").replace(">", "");

                            // Update References
                            var xmlContextDefinition = SourceCode.Forms.Designers.Common.getDefinitionXML();
                            SourceCode.Forms.DependencyHelper.replaceReferences(xmlContextDefinition, referenceObj, {
                                id: item.id,
                                name: item.name,
                                displayName: item.name,
                                dataType: item.type,
                                type: "ViewParameter"
                            });

                            break;
                        }
                    }
                    _parametersPage._itemState = null;
                    _parametersPage._refresh();
                }
                return true;
            },

            _getCalendar: function ()
            {
                if ($chk(_parametersPage._calendar) === false)
                {
                    _parametersPage._calendar = new Calendar(false);
                }
                return _parametersPage._calendar;
            },

            _getEditControls: function ()
            {
                var txtName = jQuery("#parameterName");
                var dropDataType = jQuery("#parameterDataType");
                var txtDefaultValue = jQuery("#parameterDefaultValue");

                var result = {
                    name: txtName.length > 0 ? txtName : null,
                    dataType: dropDataType.length > 0 ? dropDataType : null,
                    defaultValue: txtDefaultValue.length > 0 ? txtDefaultValue : null
                };

                return result;
            },

            //
            // events
            //
            _addParameter: function ()
            {
                var _this = _parametersPage;

                // toggle button states
                jQuery("#toolEditParameter").addClass("disabled");
                jQuery("#toolRemoveParameter").addClass("disabled");

                if (checkExists(_this._itemState))
                {
                    if (_this.validate(false, true))
                    {
                        if (!_this._apply())
                        {
                            _parametersPage.IsValidated = false;
                            return;
                        }
                    }
                    else
                    {
                        return;
                    }
                }

                var paramGrid = jQuery("#ParametersGrid");

                // is form checked out
                if (_this.View.CheckOut._checkViewStatus())
                {
                    var controls = _parametersPage._addEditRow(paramGrid);
                    controls.dataType.on("change", _parametersPage._onDataTypeChanged);

                    controls.name.trigger("focus").parents("tr").first().on("keydown", function (e)
                    {
                        switch (e.keyCode)
                        {
                            case $.ui.keyCode.ENTER:
                                if (_this.validate(false, true))
                                {
                                    _this._apply();
                                }
                                break;

                            case $.ui.keyCode.ESCAPE:
                                _this._refresh();
                                _this._itemState = null;
                                break;

                            case $.ui.keyCode.BACKSPACE:
                            case $.ui.keyCode.DELETE:
                                e.stopPropagation();
                                break;
                        }
                    });

                    _this._itemState = _this.ItemStates.New;

                    paramGrid.grid("synccolumns");
                    _this._clearSelection();
                }
            },

            _editParameter: function ()
            {
                if (!_parametersPage.View.CheckOut._checkViewStatus())
                {
                    return;
                }

                if (!_parametersPage.validate(true, true))
                {
                    var controls = _parametersPage._getEditControls();

                    if (!$chk(controls.name.val()))
                    {
                        _parametersPage._refresh();
                        _parametersPage._itemState = null;
                    }

                    return;
                }

                if (checkExists(_parametersPage._itemState) && !_parametersPage._apply())
                {
                    _parametersPage.IsValidated = false;
                    return;
                }

                // toggle button states
                jQuery("#toolEditParameter").addClass("disabled");
                jQuery("#toolRemoveParameter").addClass("disabled");

                var grid = jQuery("#ParametersGrid");
                var selectedRow = grid.grid("fetch", "selected-rows");
                if (selectedRow.length > 0)
                {
                    selectedRow.hide();
                    var index = selectedRow[0].rowIndex;

                    var cellValues = grid.grid("fetch", "rows", "objects")[index];

                    var controls = _parametersPage._addEditRow(grid, index);
                    controls.dataType.on("change", _parametersPage._onDataTypeChanged);

                    controls.name.val(cellValues[0].display).trigger("focus");
                    controls.dataType.dropdown("select", cellValues[1].display);

                    var defaultValue = $chk(cellValues[2]) && cellValues[2].value !== "" ? cellValues[2].value.htmlDecode() : "";
                    controls.defaultValue.val(defaultValue);

                    controls.name.trigger("focus").parents("tr").first().on("keydown", function (e)
                    {
                        switch (e.keyCode)
                        {
                            case $.ui.keyCode.ENTER:
                                if (_parametersPage.validate(false, true))
                                {
                                    _parametersPage._apply();
                                }
                                break;

                            case $.ui.keyCode.ESCAPE:
                                _parametersPage._refresh();
                                _parametersPage._itemState = null;
                                break;

                            case $.ui.keyCode.BACKSPACE:
                            case $.ui.keyCode.DELETE:
                                e.stopPropagation();
                                break;
                        }
                    });

                    _parametersPage._itemState = _parametersPage.ItemStates.Edit;
                    _parametersPage._currentName = controls.name.val();

                    grid.grid("synccolumns");
                    _parametersPage._clearSelection();
                }
            },

            _promptRemoveParameter: function ()
            {
                if (!_parametersPage.View.CheckOut._checkViewStatus())
                {
                    return;
                }

                var grid = jQuery("#ParametersGrid");
                var selectedRow = grid.grid("fetch", "selected-rows");

                if (!checkExists(_parametersPage._itemState) && selectedRow.length > 0)
                {
                    var paramData = _parametersPage._getParameterForSelectedRow();

                    var paramDependencyData =
                        {
                            itemId: paramData.paramId,
                            itemType: SourceCode.Forms.DependencyHelper.ReferenceType.ViewParameter,
                            itemSystemName: paramData.systemName,
                            itemDisplayName: paramData.displayName
                        };

                    var paramDependencies = SourceCode.Forms.Designers.getDependencies(paramDependencyData);

                    if (paramDependencies.length > 0)
                    {
                        var notifierOptions =
                            {
                                references: paramDependencies,
                                deleteItemType: SourceCode.Forms.DependencyHelper.ReferenceType.ViewParameter,
                                deletedItemDisplayName: paramData.displayName,
                                removeObjFn: _parametersPage._removeParameter
                            };
                        SourceCode.Forms.Designers.showDependencyNotifierPopup(notifierOptions);
                    }
                    else
                    {
                        popupManager.showConfirmation({
                            message: Resources.FormDesigner.RemoveParameterConfirmation.format(paramData.displayName),
                            onAccept: function ()
                            {
                                _parametersPage._removeParameter();
                                popupManager.closeLast();
                            }
                        });
                    }
                }
            },

            _removeParameter: function ()
            {
                if (!checkExists(_parametersPage._itemState) && _parametersPage._apply())
                {
                    // get current selected item parameter id
                    var paramData = _parametersPage._getParameterForSelectedRow();
                    var items = _parametersPage._parameterItems;
                    if (checkExistsNotEmpty(paramData.paramId) && paramData.paramIndex > -1)
                    {
                        // remove from xml
                        var parameterNode = _parametersPage.View.viewDefinitionXML.selectSingleNode(
                            "//Views/View/Parameters/Parameter[@ID='{0}']".format(paramData.paramId));
                        if (checkExists(parameterNode))
                        {
                            parameterNode.parentNode.removeChild(parameterNode);
                        }

                        items.splice(paramData.paramIndex, 1);
                        _parametersPage._refresh();
                        // toggle button states
                        jQuery("#toolEditParameter").addClass("disabled");
                        jQuery("#toolRemoveParameter").addClass("disabled");
                    }
                }
            },

            _getParameterForSelectedRow: function ()
            {
                var paramObj =
                    {
                        paramId: "",
                        paramIndex: -1
                    };

                // get current selected item
                var grid = jQuery("#ParametersGrid");
                var selectedRow = grid.grid("fetch", "selected-rows");
                if (selectedRow.length > 0)
                {
                    var index = selectedRow[0].rowIndex;
                    var cellValues = grid.grid("fetch", "rows", "objects")[index];

                    // search for item
                    var items = _parametersPage._parameterItems;
                    for (var i = 0; i < items.length; i++)
                    {
                        if (items[i].name === cellValues[0].display)
                        {
                            paramObj.paramId = items[i].id;
                            paramObj.paramIndex = i;
                            paramObj.value = cellValues[2].value;
                            paramObj.displayName = cellValues[0].value;
                            paramObj.systemName = cellValues[0].value;
                            break;
                        }
                    }
                }

                return paramObj;
            },

            _rowSelected: function ()
            {
                var grid = jQuery("#ParametersGrid");
                var selectedRow = grid.grid("fetch", "selected-rows");

                if (_parametersPage._itemState === _parametersPage.ItemStates.Edit ||
                    _parametersPage._itemState === _parametersPage.ItemStates.New)
                {
                    if (selectedRow.length > 0 && selectedRow.find("#parameterName").length > 0)
                    {
                        // toggle button states
                        jQuery("#toolEditParameter").addClass("disabled");
                        jQuery("#toolRemoveParameter").addClass("disabled");
                    }
                    else
                    {
                        var controls = _parametersPage._getEditControls();
                        if (checkExists(controls.name) && _parametersPage.validate(false, true))
                        {
                            if (!checkExists(controls.name.val()) || controls.name.val() === "")
                            {
                                _parametersPage._itemState = null;
                                _parametersPage._refresh();
                            }
                            else
                            {
                                if (!_parametersPage._apply())
                                {
                                    return;
                                }
                            }
                        }
                    }
                }
                else if (selectedRow.length > 0)
                {
                    // toggle button states
                    jQuery("#toolEditParameter").removeClass("disabled");
                    jQuery("#toolRemoveParameter").removeClass("disabled");
                }
                else
                {
                    // toggle button states
                    jQuery("#toolEditParameter").addClass("disabled");
                    jQuery("#toolRemoveParameter").addClass("disabled");
                }
            },

            _onDataTypeChanged: function ()
            {
                var grid = jQuery("#ParametersGrid");

                var txtDefaultValue = grid.find("#parameterDefaultValue");
                var dropDataType = grid.find("#parameterDataType");

                var wrapper = txtDefaultValue.parents(".grid-content-cell-wrapper").first();

                if (dropDataType.val() === "DateTime")
                {
                    if (jQuery("#parameterDefaultValue").hasClass("lookup"))
                        return;

                    wrapper.html(SCLookupBox.html({
                        id: 'parameterDefaultValue',
                        buttonIcon: 'date',
                        buttonId: 'btnLookupDefaultValue',
                        readonly: true
                    }));

                    var oldValue = txtDefaultValue.val();
                    var lookup = jQuery("#parameterDefaultValue").lookupbox();
                    lookup.addClass("lookup");

                    _parametersPage._getCalendar().addCalendarUpdateObject(lookup.get(0), jQuery("#btnLookupDefaultValue"));
                    lookup.data("format", _parametersPage._dateFormatPattern);

                    //var validDate = Date.parse(oldValue);

                    _parametersPage._getCalendar().setCurrentDate(lookup, oldValue);
                    if (!_parametersPage._getCalendar().isValidDate(lookup))
                    {
                        lookup.val("");
                    }
                }
                else
                {
                    if (!jQuery("#parameterDefaultValue").hasClass("lookup"))
                        return;

                    wrapper.html(SCTextbox.html({
                        id: 'parameterDefaultValue',
                        value: txtDefaultValue.val()
                    }));
                }
            },

            _keyUp: function (e)
            {
                switch (e.keyCode)
                {
                    case _parametersPage.KeyCodes.Delete:
                        _parametersPage._promptRemoveParameter();
                        break;
                }
            }
        };
})(jQuery);
