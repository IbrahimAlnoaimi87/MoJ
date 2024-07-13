function ValidationWidget()
{
    this._analyzerService = SourceCode.Forms.Services.AnalyzerResourcesService();
    this.validationWidgetGrid = null;
}

ValidationWidget.prototype = {

    getItemsFromPlugIn: function ()
    {
        var _this = this;
        if (this.forcedClick === false)
        {
            jQuery("#ruleWizardPopup").modalize(true).showBusy(true);
            setTimeout(function ()
            {
                if (_this.isHidden || _this.forcedClick) _this.showPopup = false;
                _this.pluginReturnedId = "".generateGuid() + ".pluginReturned";
                _this.boundPluginReturn = _this.pluginReturn.bind(_this);
                jQuery(document.body).on(_this.pluginReturnedId, null, _this, _this.boundPluginReturn);

                var pluginType = eval(_this.pluginName);
                var plugin = new pluginType();
                plugin.dataType = 'target';
                plugin.Settings = _this;
                plugin.pluginReturnedId = _this.pluginReturnedId
                with (plugin)
                {
                    var pluginMethod = eval(_this.pluginMethod).bind(plugin);
                    pluginMethod();
                }
            }, 50);
        }
    },

    pluginReturn: function (e)
    {
        var _this = e.data;

        //each time a plugin returns it calls this function.
        if ((typeof _this.pluginReturnedId !== "undefined") && (_this.pluginReturnedId !== null) && (_this.pluginReturnedId !== ""))
        {
            jQuery(document.body).off(_this.pluginReturnedId, null, _this.boundPluginReturn);
        }

        _this.data = e.detail.xml;

        var jq_div = jQuery("<div></div>");
        jq_div.addClass("validation-main-wrapper");

        var buttonArray = [];
        buttonArray[0] = { type: "help", click: function () { HelpHelper.runHelp(7020); } };
        buttonArray[1] = { text: Resources.WizardButtons.OKButtonText, click: function () { _this.saveValidations(_this); }.bind(_this) };
        buttonArray[2] = { text: Resources.WizardButtons.CancelButtonText, click: function () { popupManager.closeLast(); } };

        var _documentBody = document.body;
        var _scalePercentage = 0.8;
        var _controlHeight = Math.floor(_documentBody.offsetHeight * _scalePercentage);
        var _controlWidth = Math.floor(_documentBody.offsetWidth * _scalePercentage);

        var validateDialog = popupManager.showPopup({
            id: "ValidationWidgetPopup",
            buttons: buttonArray,
            draggable: true,
            headerText: Resources.RuleDesigner.lrValidationHeading,
            modalize: true,
            content: jq_div[0],
            width: _controlWidth,
            resizable: true,
            maximizable: true,
            removeContent: true,
            height: _controlHeight,
            onMaximize: function ()
            {
                _this.syncColumns();
            },
            onRestore: function ()
            {
                _this.syncColumns();
            }
        });

        _this.buildCanvas(_this, jq_div);
        jQuery("#ruleWizardPopup").modalize(false).showBusy(false);
    },

    buildCanvas: function (_this, jq_div)
    {
        this.existingMappings = {};

        var jq_divGrid = jQuery("<div></div>");
        jq_divGrid.addClass("validation-grid-wrapper");

        var jq_divOptions = jQuery("<div></div>");
        jq_divOptions.addClass("validation-options-wrapper");

        var jq_divChk = jQuery("<div></div>");
        jq_divChk.addClass("validation-bottom-wrapper");

        jq_div.append(jq_divGrid).append(jq_divOptions);

        var hideViewColumn = _this.context === "View" ? true : false;
        var validationWidgetGridOptions = {
            id: "validationWidgetGrid",
            toolbars: 0,
            fullsize: true,
            columns: [
                { display: Resources.RuleDesigner.lrValidationGridID, hidden: true, width: "0%" },
                { display: Resources.RuleDesigner.lrValidationGridViewName, hidden: hideViewColumn, width: "300px" },
                { display: Resources.RuleDesigner.lrValidationGridControlName, width: "300px", modulus: true },
                { display: Resources.RuleDesigner.lrValidationGridRequired, width: "60px", align: "center" },
                { display: Resources.RuleDesigner.lrValidationGridValidate, width: "60px", align: "center" }
            ]
        };

        var validationWidgetGridevents = {
            multiselect: false,
            autopopulate: false
        };

        this.validationWidgetGrid = jQuery(SCGrid.html(validationWidgetGridOptions)).appendTo(jq_divGrid).grid(validationWidgetGridevents);

        // there is 1, sometimes 2 hidden columns, take the first visible and pad it. this is not possible in pure css
        this.validationWidgetGrid.find(".grid-column-headers tr td:not(.hidden)").eq(0).find(".grid-column-header-cell .grid-column-header-text").css(
            {
                'padding-left': '8px'
            });

        var panel = jQuery(SCPanel.html({ header: Resources.RuleDesigner.lrValidationGridOptions, fullsize: true, toolbars: 0, scrolling: false })).panel({});
        var panelBody = panel.panel("fetch", "body");
        panel.appendTo(jq_divOptions);
        var validationMessageChkBox = SCCheckbox.html({ id: 'showValidationSummaryChkbox', label: Resources.RuleDesigner.lrValidationCheckboxPopupMessage });
        var hiddenControlsChkBox = SCCheckbox.html({ id: 'validateHiddenChkbox', label: Resources.RuleDesigner.lrValidationCheckboxValidateControls });

        jq_divChk.append("<div>{0}</div>".format(validationMessageChkBox));
        jq_divChk.append("<div>{0}</div>".format(hiddenControlsChkBox));

        panelBody.append(jq_divChk);

        var existingValuesDoc;
        if ($chk(_this.value))
        {
            existingValuesDoc = parseXML(_this.value);
        }

        var formItems = _this.data.selectNodes("//Item[@ItemType='Form']");
        this._processItems(formItems, existingValuesDoc);

        var viewItems = _this.data.selectNodes("//Item[@ItemType='View']");
        this._processItems(viewItems, existingValuesDoc);

        if (viewItems.length === 0 && formItems.length === 0)
        {
            var noItemsToDisplayText = Resources.RuleDesigner.MsgNoItemsFound;
            if (hideViewColumn === true)
            {
                this.validationWidgetGrid.grid('add', 'row', [{ value: "" }, { value: "", display: "" }, { value: "", display: noItemsToDisplayText }, { value: "", display: "" }, { value: "", display: "" }], false);
            }
            else
            {
                this.validationWidgetGrid.grid('add', 'row', [{ value: "" }, { value: "", display: noItemsToDisplayText }, { value: "", display: "" }, { value: "", display: "" }, { value: "", display: "" }], false);
            }
        }

        _this.addDefaultEvents(_this);
        _this.syncColumns();

        jQuery('#showValidationSummaryChkbox').checkbox();
        jQuery('#validateHiddenChkbox').checkbox().checkbox("check");

        if ($chk(existingValuesDoc))
        {
            var validationGroup = existingValuesDoc.selectSingleNode("ValidationGroups/ValidationGroup");
            if (validationGroup.getAttribute("Type").toLowerCase() === "popup")
            {
                jQuery('#showValidationSummaryChkbox').checkbox("check");
            }

            if (validationGroup.getAttribute("IgnoreInvisibleControls").toLowerCase() === "" || validationGroup.getAttribute("IgnoreInvisibleControls").toLowerCase() === "false")
            {
                jQuery('#validateHiddenChkbox').checkbox("uncheck");
            }
        }
    },

    _processItems: function (itemsCollection, existingValuesDoc)
    {
        for (var v = 0; v < itemsCollection.length; v++)
        {
            var itemNode = itemsCollection[v];

            var instanceID = itemNode.selectSingleNode("InstanceID");
            var combinedID = instanceID !== null ? itemNode.getAttribute("Guid") + "," + instanceID.text : itemNode.getAttribute("Guid");

            var allControlsRowID = String.generateGuid();
            var allControlsRowIDRequired = allControlsRowID + "required";
            var allControlsRowIDValidate = allControlsRowID + "validate";
            var validateItemsLength = 0;
            var requiredItemsLength = 0;
            var missingControlLength = 0;

            var existingSourceNodes = [];
            if ($chk(existingValuesDoc))
            {
                var existingSourceXPath = "ValidationGroups/ValidationGroup/Source[";
                if (instanceID !== null)
                {
                    existingSourceXPath += "@InstanceID='" + instanceID.text + "']";
                }
                else
                {
                    existingSourceXPath += "@InstanceID='00000000-0000-0000-0000-000000000000']";
                }

                existingSourceNodes = existingValuesDoc.selectNodes(existingSourceXPath);
            }

            var controlNodes = itemNode.selectNodes('Items/Item[@ItemType="Control"]');
            // Grouping
            if (existingSourceNodes.length > 0 || controlNodes.length > 0)
            {
                //Row for 'All Controls Required/Validate' per View/Form
                var displayName = itemNode.selectSingleNode("DisplayName").text;
                this.validationWidgetGrid.grid('add', 'row', [
                    { value: "" },
                    { value: combinedID, display: displayName },
                    { value: Resources.RuleDesigner.lrValidationGridAllControls },
                    { html: SCCheckbox.html({ id: allControlsRowIDRequired }), cellclass: "required-all-chkbox edit-mode" },
                    { html: SCCheckbox.html({ id: allControlsRowIDValidate }), cellclass: "validate-all-chkbox edit-mode" }
                ], false);
            }
            // Missing Nodes
            for (var i = 0; i < existingSourceNodes.length; i++)
            {
                var sourceNode = existingSourceNodes[i];
                var controlID = sourceNode.getAttribute("ID");

                var mappingInfoObj = {};
                mappingInfoObj.isInvalid = sourceNode.getAttribute("Invalid") === "true";
                mappingInfoObj.isRequired = sourceNode.getAttribute("IsRequired").toLowerCase() === "true";
                mappingInfoObj.tooltip = "";

                if (mappingInfoObj.isInvalid)
                {
                    mappingInfoObj.validationMessages = sourceNode.getAttribute("ValidationMessage");
                    if (checkExistsNotEmpty(mappingInfoObj.validationMessages))
                    {
                        var validationMessages = this._analyzerService.parseValidationMessage(mappingInfoObj.validationMessages);
                        for (var z = 0; z < validationMessages.length; z++)
                        {
                            var validationMsg = validationMessages[z];
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
                                displayName = validationMessageItemType;
                            }

                            mappingInfoObj.tooltip += this._analyzerService.getReferenceStatusTitle(validationMsg.status).format(displayName, validationMessageItemType) + " ";

                            if (validationMsg.type === "Control" && validationMsg.status === "Missing")
                            {
                                missingControlLength++;
                                validateItemsLength++;

                                if (mappingInfoObj.isRequired)
                                {
                                    requiredItemsLength++;
                                }

                                this.validationWidgetGrid.grid('add', 'row', [
                                    { value: controlID },
                                    { value: combinedID, display: " " },
                                    { value: displayName, title: mappingInfoObj.tooltip, icon: "control-error" },
                                    { html: SCCheckbox.html({ checked: mappingInfoObj.isRequired }), cellclass: "required-chkbox edit-mode", value: combinedID },
                                    { html: SCCheckbox.html({ checked: true, disabled: mappingInfoObj.isRequired }), cellclass: "validate-chkbox edit-mode", value: combinedID }
                                ], false);
                            }
                        }
                    }
                }
                this.existingMappings[combinedID + controlID] = mappingInfoObj;
            }
            // Control Nodes
            for (var i = 0; i < controlNodes.length; i++)
            {
                var currentItem = controlNodes[i];
                var controlName = currentItem.selectSingleNode("DisplayName").text;
                var controlID = currentItem.getAttribute("Guid");

                var tooltip = "";
                var isRequired = false;
                var validate = checkExists(this.existingMappings[combinedID + controlID]);
                var isInvalid = false;

                if (validate)
                {
                    isRequired = this.existingMappings[combinedID + controlID].isRequired;
                    tooltip = this.existingMappings[combinedID + controlID].tooltip;
                    isInvalid = this.existingMappings[combinedID + controlID].isInvalid;

                    validateItemsLength++;
                    if (isRequired)
                    {
                        requiredItemsLength++;
                    }
                }

                this.validationWidgetGrid.grid('add', 'row', [
                    { value: controlID },
                    { value: combinedID, display: " " },
                    {
                        value: controlName,
                        title: tooltip,
                        icon: isInvalid ? "control-error" : "control " +
                            getNodeAttribute("ItemType", currentItem, "control", checkExistsNotEmpty).toLowerCase() + "-" +
                            getNodeAttribute("SubType", currentItem, "generic", checkExistsNotEmpty).toLowerCase()
                    },
                    { html: SCCheckbox.html({ checked: isRequired }), cellclass: "required-chkbox edit-mode", value: combinedID },
                    { html: SCCheckbox.html({ checked: validate, disabled: isRequired }), cellclass: "validate-chkbox edit-mode", value: combinedID }
                ], false);
            }

            if (validateItemsLength === controlNodes.length + missingControlLength)
            {
                if (requiredItemsLength === controlNodes.length + missingControlLength)
                {
                    jQuery('#' + allControlsRowIDRequired).checkbox("check");
                }

                jQuery('#' + allControlsRowIDValidate).checkbox("check");
            }
        }
    },

    syncColumns: function ()
    {
        this.validationWidgetGrid.grid('synccolumns');
    },

    saveValidations: function (_this)
    {
        var rows = this.validationWidgetGrid.grid('fetch', 'rows', 'objects');
        var validationsXMLDoc = parseXML('<ValidationGroups/>');
        var validationGroupEl = validationsXMLDoc.createElement("ValidationGroup");
        var validationType = jQuery('#showValidationSummaryChkbox')[0].checked ? "Popup" : "Control";
        var ignoreHiddenControls = jQuery('#validateHiddenChkbox')[0].checked ? "true" : "false";
        var ignoreDisabledControls = jQuery('#validateHiddenChkbox')[0].checked ? "true" : "false";
        var ignoreReadOnlyControls = jQuery('#validateHiddenChkbox')[0].checked ? "true" : "false";
        var validationGroupID;

        if (_this.value)
        {
            validationGroupID = parseXML(_this.value).selectSingleNode("ValidationGroups/ValidationGroup").getAttribute("ID");
        } else
        {
            validationGroupID = String.generateGuid();
        }

        validationGroupEl.setAttribute('Type', validationType);
        validationGroupEl.setAttribute('ID', validationGroupID);
        validationGroupEl.setAttribute('IgnoreInvisibleControls', ignoreHiddenControls);
        validationGroupEl.setAttribute('IgnoreDisabledControls', ignoreDisabledControls);
        validationGroupEl.setAttribute('IgnoreReadOnlyControls', ignoreReadOnlyControls);

        for (var r = 0; r < rows.length; r++)
        {
            var row = rows[r];
            var rowElement = this.validationWidgetGrid.grid('fetch', 'rows').eq(r);
            var controlID = row[0].value;
            var combinedID = row[1].value;
            var combinedViewInstanceIDArray = combinedID.split(",");
            var viewID = combinedViewInstanceIDArray[0];
            var instanceID = combinedViewInstanceIDArray.length > 1 ? combinedViewInstanceIDArray[1] : null;

            if ($chk(controlID))
            {
                var validate = rowElement.find('td').eq(4).find('input')[0].checked;

                if (validate)
                {
                    var required = rowElement.find('td').eq(3).find('input')[0].checked;
                    var sourceEl = validationsXMLDoc.createElement('Source');

                    sourceEl.setAttribute('SourceType', 'Control');
                    sourceEl.setAttribute('ID', controlID);
                    sourceEl.setAttribute('IsRequired', required.toString());
                    sourceEl.setAttribute('ViewID', viewID);

                    if (instanceID !== null)
                    {
                        sourceEl.setAttribute('InstanceID', instanceID);
                    }
                    else
                    {
                        sourceEl.setAttribute('InstanceID', "00000000-0000-0000-0000-000000000000");
                    }

                    // Preserve Invalid Annotations
                    if (checkExists(this.existingMappings[combinedID + controlID]))
                    {
                        var mappingInfoObj = this.existingMappings[combinedID + controlID];

                        if (mappingInfoObj.isInvalid === true)
                        {
                            sourceEl.setAttribute("Invalid", "true");
                        }

                        if (checkExistsNotEmpty(mappingInfoObj.validationMessages))
                        {
                            sourceEl.setAttribute("ValidationMessage", mappingInfoObj.validationMessages);
                        }
                    }

                    validationGroupEl.appendChild(sourceEl);
                }
            }
        }

        validationsXMLDoc.firstChild.appendChild(validationGroupEl);

        _this.display = Resources.RuleDesigner.lrConfigureBrackets;
        _this.data = validationsXMLDoc.firstChild;
        _this.value = validationsXMLDoc.xml;

        SourceCode.Forms.Designers.Rule.onWidgetCompleted(_this);

        popupManager.closeLast();
    },

    addDefaultEvents: function (_this)
    {
        var requiredAllCells = jQuery('.required-all-chkbox');
        var validateAllCells = jQuery('.validate-all-chkbox');

        var requiredAllCellsLength = requiredAllCells.length;

        for (var r = 0; r < requiredAllCellsLength; r++)
        {
            var jq_requiredAllChkbox = jQuery(requiredAllCells[r]).find('input');

            jq_requiredAllChkbox.on("click", function ()
            {
                _this._allRequiredClicked(_this, jQuery(this));
            });
        }

        var validateAllCellsLength = validateAllCells.length
        for (var r = 0; r < validateAllCellsLength; r++)
        {
            var jq_validateAllChkbox = jQuery(validateAllCells[r]).find('input');

            jq_validateAllChkbox.on("click", function ()
            {
                _this._allValidateClicked(_this, jQuery(this));
            });
        }

        var requiredCells = jQuery('.required-chkbox');
        var requiredCellsLength = requiredCells.length;
        for (var r = 0; r < requiredCellsLength; r++)
        {
            var jq_chkbox = jQuery(requiredCells[r]).find('input');

            jq_chkbox.on("click", function ()
            {
                var checked = this.checked;
                var jq_this = jQuery(this);
                var input = jq_this.closest('td').next('td').find('input');
                var viewID = _this.validationWidgetGrid.grid('fetch', 'selected-rows', 'objects')[0][1].value;

                if (checked)
                {
                    input.checkbox('check');
                    input.checkbox('disable');
                } else
                {
                    input.checkbox('enable');
                }

                _this._validateRequiredCheckboxStates(_this, checked);
                _this._validateValidateCheckboxStates(_this, checked);
            });
        }

        var validateCells = jQuery('.validate-chkbox');
        var validateCellsLength = validateCells.length;
        for (var r = 0; r < validateCellsLength; r++)
        {
            var jq_chkbox = jQuery(validateCells[r]).find('input');

            jq_chkbox.on("click", function ()
            {
                var checked = this.checked;
                input = jQuery(this).closest('td').prev('td').find('input');
                input.checkbox("uncheck");

                _this._validateValidateCheckboxStates(_this, checked);
            });
        }
    },

    _allRequiredClicked: function (_this, jq_this)
    {
        var val = jq_this[0].checked ? 'check' : 'uncheck';
        var input = jq_this.closest('td').next('td').find('input');
        var requiredCells = this.validationWidgetGrid.grid('fetch', 'rows');
        var viewID = this.validationWidgetGrid.grid('fetch', 'selected-rows', 'objects')[0][1].value;
        var validationWidgetGridCells = this.validationWidgetGrid.grid('fetch', 'rows', "objects");

        if (val === 'check')
        {
            input.checkbox('check');
            input.checkbox('disable');
        } else
        {
            input.checkbox('enable');
        }

        var requiredCellsLength = requiredCells.length;
        for (var r = 0; r < requiredCellsLength; r++)
        {
            var thisViewID = validationWidgetGridCells[r][1].value;

            if (viewID === thisViewID)
            {
                var chkBox = jQuery(requiredCells[r]).find('td:nth-child(4) input').checkbox(val);
                input = chkBox.closest('td').next('td').find('input');

                if (val === 'check')
                {
                    jQuery(requiredCells[r]).find('td:nth-child(5) input').checkbox(val);
                    input.checkbox("disable");
                } else
                {
                    input.checkbox("enable");
                }
            }
        }
    },

    _allValidateClicked: function (_this, jq_this)
    {
        var val = jq_this[0].checked ? 'check' : 'uncheck';
        var validateCells = this.validationWidgetGrid.grid('fetch', 'rows');
        var viewID = this.validationWidgetGrid.grid('fetch', 'selected-rows', 'objects')[0][1].value;
        var validationWidgetGridCells = this.validationWidgetGrid.grid('fetch', 'rows', 'objects');
        var input = jq_this.closest('td').prev('td').find('input');

        if (val === "uncheck")
        {
            input.checkbox(val);
        }

        var validateCellsLength = validateCells.length
        for (var v = 0; v < validateCellsLength; v++)
        {
            var thisViewID = validationWidgetGridCells[v][1].value;

            if (viewID === thisViewID)
            {
                var chkBox = jQuery(validateCells[v]).find('td:nth-child(5) input').checkbox(val);
                input = chkBox.closest('td').prev('td').find('input');

                if (val === "uncheck")
                {

                    input.checkbox("uncheck");
                }

                if (input[0].checked === false)
                {
                    chkBox.checkbox("enable");
                }
            }
        }
    },

    _validateRequiredCheckboxStates: function (_this, val)
    {
        var requiredCells = jQuery('.required-chkbox');
        var requiredCellsLength = requiredCells.length;
        var validateCells = jQuery('.validate-chkbox');
        var validateCellsLength = validateCells.length;
        var validationWidgetGridCells = this.validationWidgetGrid.grid('fetch', 'rows', 'objects');
        var requiredItemsForThisViewLength = 0;
        var requiredItemsForThisViewCheckedLength = 0;
        var viewID = this.validationWidgetGrid.grid('fetch', 'selected-rows', 'objects')[0][1].value;

        // Check if all the requireds for that view has been checked
        for (var r = 0; r < requiredCellsLength; r++)
        {
            var thisViewID = jQuery(requiredCells[r]).closest("td").metadata().value;
            if (viewID === thisViewID)
            {
                requiredItemsForThisViewLength++;
                jQuery(requiredCells[r]).find('input').is(":checked") ? requiredItemsForThisViewCheckedLength++ : "";
            }
        }

        var requiredAllCells = jQuery('.required-all-chkbox');
        var validateAllCells = jQuery('.validate-all-chkbox');
        var requiredAllCellsLength = requiredAllCells.length;

        if (requiredItemsForThisViewLength === requiredItemsForThisViewCheckedLength)
        {
            for (var r = 0; r < requiredAllCellsLength; r++)
            {
                var jq_requiredAllChkbox = jQuery(requiredAllCells[r]).find('input');
                var rowIndex = jq_requiredAllChkbox.closest("tr")[0].rowIndex;
                var thisViewID = validationWidgetGridCells[rowIndex][1].value;

                if (thisViewID === viewID)
                {
                    jq_requiredAllChkbox.checkbox("check");
                    _this._allRequiredClicked(_this, jq_requiredAllChkbox);
                }
            }
        } else
        {
            for (var r = 0; r < requiredAllCellsLength; r++)
            {
                var jq_requiredAllChkbox = jQuery(requiredAllCells[r]).find('input');
                var rowIndex = jq_requiredAllChkbox.closest("tr")[0].rowIndex;
                var thisViewID = validationWidgetGridCells[rowIndex][1].value;

                if (thisViewID === viewID)
                {
                    jq_requiredAllChkbox.checkbox("uncheck");

                    if (val === false)
                    {
                        input = jq_requiredAllChkbox.closest('td').next('td').find('input');
                        input.checkbox("enable");
                    }
                }
            }
        }

        _this._validateValidateCheckboxStates(_this, val);
    },

    _validateValidateCheckboxStates: function (_this, val)
    {
        var validateCells = jQuery('.validate-chkbox');
        var validateCellsLength = validateCells.length;
        var validateAllCells = jQuery('.validate-all-chkbox');
        var validationWidgetGridCells = this.validationWidgetGrid.grid('fetch', 'rows', 'objects');
        var validationItemsForThisViewLength = 0;
        var validationItemsForThisViewCheckedLength = 0;
        var viewID = this.validationWidgetGrid.grid('fetch', 'selected-rows', 'objects')[0][1].value;

        // Check if all the validates for that view has been checked
        for (var r = 0; r < validateCellsLength; r++)
        {
            var thisViewID = jQuery(validateCells[r]).closest("td").metadata().value;

            if (viewID === thisViewID)
            {
                validationItemsForThisViewLength++;
                jQuery(validateCells[r]).find('input').is(":checked") ? validationItemsForThisViewCheckedLength++ : "";
            }
        }

        var validateAllCells = jQuery('.validate-all-chkbox');
        var validateAllCellsLength = validateAllCells.length;

        if (validationItemsForThisViewLength === validationItemsForThisViewCheckedLength)
        {
            for (var v = 0; v < validateAllCellsLength; v++)
            {
                var jq_validateAllChkbox = jQuery(validateAllCells[v]).find('input');
                var rowIndex = jq_validateAllChkbox.closest("tr")[0].rowIndex;
                var thisViewID = validationWidgetGridCells[rowIndex][1].value;

                if (thisViewID === viewID)
                {
                    jq_validateAllChkbox.checkbox("check");
                    //_this._allValidateClicked(_this, jq_validateAllChkbox);
                }
            }
        } else
        {
            for (var r = 0; r < validateAllCellsLength; r++)
            {
                var jq_validateAllChkbox = jQuery(validateAllCells[r]).find('input');
                var rowIndex = jq_validateAllChkbox.closest("tr")[0].rowIndex;
                var thisViewID = validationWidgetGridCells[rowIndex][1].value;

                if (thisViewID === viewID)
                {
                    jq_validateAllChkbox.checkbox("uncheck");
                }
            }
        }
    }
}
