/* global checkExists: false */
/* global Resources: false */
/* global popupManager: false */
/* global applicationRoot: false */
/* global HelpHelper: false */

function BrowserNavigateMappingWidget()
{

}

BrowserNavigateMappingWidget.prototype =
{
    initialize: function (contentElement)
    {
        this._analyzerService = SourceCode.Forms.Services.AnalyzerResourcesService();
        this.container = contentElement;
        this.instanceid = String.generateGuid();
        this.parentWidget = this;
        this._previewURL = null;
        this._previewText = null;
        this._openInTwisty = null;
        this._parameterList = [];
        this._buildUI(contentElement);
    },

    dispose: function ()
    {
        this.container.empty();
    },

    setConfigurationXml: function (configurationXml, targetContextContainer)
    {
        this.targetContextContainer = targetContextContainer;

        if (checkExists(configurationXml))
        {
            var mappingsDoc = parseXML(configurationXml);
            var mappingNodes = mappingsDoc.selectNodes("/Mappings/Mapping[Item]");

            var mappings = null;
            var sourceItemNodes = null;
            var targetNode = null;
            var targetName = null;

            var sourceItem = null;
            var sourceItemValue = null;

            for (var i = 0; i < mappingNodes.length; i++)
            {
                mappings = [];
                sourceItemNodes = mappingNodes[i].selectNodes(".//Item[(@ContextType='context' or @ContextType='value') and not(SourceValue/Item)]");

                if (sourceItemNodes.length > 0)
                {
                    for (var y = 0; y < sourceItemNodes.length; y++)
                    {
                        sourceItem = sourceItemNodes[y];
                        sourceItemValue = sourceItem.firstChild !== null ? sourceItem.firstChild.nodeValue : "";

                        if (sourceItem.getAttribute("ContextType") === "value")
                        {
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

                // Set Target
                targetNode = mappingNodes[i].selectSingleNode("Item[@ContextType='target']");
                targetName = targetNode.getAttribute("Name");

                switch (targetName)
                {
                    case "BaseURL":
                        $("#baseURLText").tokenbox("value", mappings);
                        break;

                    case "Target":
                        this._loadTarget(mappings);
                        break;

                    case "Location":
                        break;

                    case "Url":
                        $("#baseURLText").tokenbox("value", mappings);
                        break;

                    default:
                        if (checkExistsNotEmpty(targetName) && !targetName.contains("BrowserNavigateDialog"))
                        {
                            var row = [];

                            //Parameter Name  
                            row.push({
                                value: decodeURIComponent(targetName),
                                display: decodeURIComponent(targetName)
                            });

                            //parameter Value  
                            row.push({
                                html: this._tokenBoxHtml(mappings, true),
                                value: this._toSourceValueXML(mappings)
                            });

                            this._parameterList.push(row[0].value);
                            this.container.find(".grid").grid("add", "row", row, false);
                        }
                        else if (checkExistsNotEmpty(targetName) && targetName.contains("BrowserNavigateDialog"))
                        {
                            var ctrl = $("#" + targetName);

                            if (ctrl.is("input[type=text]"))
                            {
                                ctrl.val(mappings[0].data);
                                ctrl.triggerHandler("focus");
                                ctrl.triggerHandler("blur");
                            }
                            else
                            {
                                $("#" + targetName).checkbox(mappings[0].data === "yes" ? "check" : "uncheck");
                                ctrl.triggerHandler("click");
                            }
                        }
                        break;
                }
            }
        }

        window.setTimeout(function () { $("#PanePreview").css("top", ""); this._buildParameterURL(); this.container.find(".grid").grid("synccolumns"); }.bind(this), 250);
    },

    getConfigurationXML: function ()
    {
        //Validation
        var _baseURL = $("#baseURLText").tokenbox("value");
        if (_baseURL.length === 0)
        {
            popupManager.showWarning({
                message: Resources.RuleDesigner.BrowserNavigateMappingWidgetURLValidationMessage,
                onClose: function () { $("*[contenteditable=true]")[0].focus(); }
            });
            return false;
        }
        else
        {
            if (_baseURL.length === 1 && _baseURL[0].type === "value" && !_baseURL[0].data.test(stringRegularExpressions.isValidURL))
            {
                popupManager.showWarning({
                    message: Resources.ControlProperties.InvalidURL,
                    onClose: function () { $("*[contenteditable=true]")[0].focus(); }
                });
                return false;
            }
        }

        if ($("#ParamValue").tokenbox("value").length !== 0)
        {
            if (!this._validatePropertiesDialogInputRow())
                return false;
        }
        if ($("#URLParameters").find("tr.edit-row").length > 0 && !this._validatePropertiesDialogInputRow()) 
            return false;

        if (!this._validateDuplicateParameters())
            return false;

        if ($("#ParamName").val() !== "")
            this._insertNewDialogRow();
        // End of validation

        //Build Configuration XML
        var MessageXML = "";

        MessageXML += this._getMapping("Properties", "Url", "baseURL"); //Set Url property to 'baseURL' when parameters are set
        MessageXML += this._getMapping("Parameters", "BaseURL", this._toSourceValueXML($("#baseURLText").tokenbox("value")));
        
        MessageXML += this._getParametersXML();

        var dialogoptions = $("#ModalDialogOptions input");
        
        for (var i = 0, l = dialogoptions.length; i < l; i++)
        {
            var input = $(dialogoptions[i]);

            if (input.is("input[type=text]") && input.val() !== "")
            {
                MessageXML += this._getMapping("Parameters", input.attr("id"), this._toSourceValueXML([{ type: "value", data: input.val(), text: input.val() }]));
            }
            else if (input.is("input[type=checkbox]"))
            {
                var checked = input.is(":checked") ? "yes" : "no";
                MessageXML += this._getMapping("Parameters", input.attr("id"), this._toSourceValueXML([{ type: "value", data: checked, text: checked }]));
            }
        }

        var twisties = this.container.find(".twisty");

        for (var  i = 0, l = twisties.length; i < l; i++)
        {
            var twisty = $(twisties[i]);
            var twistyValue = twisty.twisty("value");

            if (twisty.attr("id") === "BrowserNavigateOpenInTwisty")
            {
                if ((twistyValue.length === 1) && (twistyValue[0].type === "value") && (checkExists(twistyValue[0].value)))
                {
                    MessageXML += this._getMapping("Properties", "Target", twistyValue[0].value);
                }
                else
                {
                    MessageXML += this._getMapping("Properties", "Target", this._toSourceValueXML(twistyValue));
                }
            }
            else
            {
                var parameterName = twisty.attr("id").replace("Twisty", "");

                if ((twistyValue.length === 1) && (twistyValue[0].type === "value") && (checkExists(twistyValue[0].value)))
                {
                    MessageXML += this._getMapping("Parameters", parameterName, (twistyValue[0].value.toLowerCase() === "true") ? "yes" : "no");
                }
                else
                {
                    MessageXML += this._getMapping("Parameters", parameterName, this._toSourceValueXML(twistyValue));
                }
            }
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

    _buildUI: function (parentElement)
    {
        var _this = this;
        var data = { actionName: this.Settings.actionName };
        var options =
        {
            url: applicationRoot + "Rules/BrowserNavigate.aspx",
            type: 'GET',
            cache: false,
            data: data,
            async: false,
            success: function (responseText, textStatus, XMLHttpRequest)
            {
                // Use the response to populate initial HTML for UI
                var response = responseText;
                parentElement.empty().html(responseText);

                // Initialize all tokenbox inputs
                _this.container.find("input[type=text].token-input").tokenbox({
                    accept: ".ui-draggable",
                    watermark: Resources.ContextTree.Tree_DropItemMessage,
                    keypress: _this._buildParameterURL.bind(_this),
                    focus: _this._buildParameterURL.bind(_this)
                });

                // Initialize all non-tokenbox inputs
                _this.container.find("input[type=text]:not(.token-input)").textbox();

                // Initialize all non-twisty radiobuttons
                _this.container.find("input[type=checkbox]").checkbox();

                // Binding of toolbar buttons
                $("#URLParametersAddPropertyButton").on("click", _this._newPropertiesDialogRow.bind(_this));
                $("#URLParametersEditPropertyButton").on("click", _this._editPropertiesDialogRow.bind(_this));
                $("#URLParametersRemovePropertyButton").on("click", _this._removeParameter.bind(_this));
                $("#URLParametersRemoveAllPropertiesButton").on("click", _this._removeAllParameters.bind(_this));

                // Binding focus & keystroke handlers for grid text inputs
                $("#URLParameters").on("keyup", "input[type=text]", _this._buildParameterURL.bind(_this));

                // Generate & instantiate the target dropdown list
                _this._openInTwisty = $("<div id=\"BrowserNavigateOpenInTwisty\" class=\"mappings-input\"></div>").appendTo($("#BrowserNavigateOpenInFF").find(".form-field-element-wrapper > * > *").first()).twisty(
                {
                    subType:"drop",
                    items: Resources.CommonPhrases.CurrentWindow + "|" + Resources.CommonPhrases.NewWindowOrTab + "|" + Resources.CommonPhrases.ParentWindow + "|"
                        + Resources.CommonPhrases.ModalDialog + "+_self|_blank|_parent|modal",
                    toggle: function (ev, ui)
                    {
                        if ($(this).hasClass("map"))
                        {
                            _this._openInTwisty.find("select").trigger("change");
                        }
                        else
                        {
                            $("#BrowserNavigateDialogOptionsButton").removeClass("disabled");
                        }
                    }
                });

                // Binding events to dropdownlist control
                _this._openInTwisty.find("select").on("change", function ()
                {
                    if (this.options[this.selectedIndex].value === "modal")
                    {
                        $("#BrowserNavigateDialogOptionsButton").removeClass("disabled");
                    }
                    else
                    {
                        $("#BrowserNavigateDialogOptionsButton").addClass("disabled");
                    }
                });

                // Validation of dialog options
                // ^(\d*)(px|%)?$
                $("#ModalDialogOptions").find("input[type=text]").on("blur", function ()
                {
                    var input = $(this);
                    if (input.val() !== "")
                    {
                        var matches = null;

                        if (input.is("*[id$=Left], *[id$=Top]"))
                        {
                            matches = input.val().match(/^(\d*)(px)?$/);

                            if (!matches || matches.length === 0)
                            {
                                popupManager.showError({
                                    message: Resources.CommonPhrases.PixelValuesOnlyText.replace("{0}", input.is("*[id$=Left]") ? Resources.CommonLabels.LeftLabelText.toLowerCase() : Resources.CommonLabels.TopLabelText.toLowerCase()),
                                    onClose: function () { input.val(""); input[0].focus(); }
                                });
                            }
                        }
                        else
                        {
                            matches = input.val().match(/^(\d*)(px|%)?$/);

                            // If a percentage value greater than 100% has been provided, fail
                            if (matches && matches.length > 0 && matches[2] === "%" && parseInt(matches[1]) > 100)
                            {
                                matches = false;
                            }
                            else if (matches && matches.length > 0 && (matches[2] === undefined || matches[2] === "px") && parseInt(matches[1]) > 32767)
                            {
                                // Pixel values larger than 32767 not permitted
                                matches = false;
                            }

                            if (!matches || matches.length === 0)
                            {
                                popupManager.showError({
                                    message: Resources.CommonPhrases.PixelPercentageValuesOnlyText.replace("{0}", input.is("*[id$=Width]") ? Resources.CommonLabels.WidthLabelText.toLowerCase() : Resources.CommonLabels.HeightLabelText.toLowerCase()),
                                    onClose: function () { input.val(""); input[0].focus(); }
                                });
                            }
                        }
                    }
                });

                // Binding events to center dialog checkbox
                $("#BrowserNavigateDialogCenter").on("click", function ()
                {
                    if ($(this).is(":checked"))
                    {
                        $("#BrowserNavigateDialogTop, #BrowserNavigateDialogLeft").val("").textbox("disable");
                    }
                    else
                    {
                        $("#BrowserNavigateDialogTop, #BrowserNavigateDialogLeft").textbox("enable");
                    }
                });

                // Binding the events handlers responsible for showing dialog settings popup
                $("#BrowserNavigateOpenInFF .button").on("click", function ()
                {
                    if (!$(this).hasClass("disabled"))
                    {
                        var popupWindow = popupManager.showPopup({
                            id: "ModalDialogWindowOptionsPopup",
                            buttons: [
                                { type: "help", click: function () { HelpHelper.runHelp(7057); } },
                                {
                                    text: Resources.WizardButtons.OKButtonText, click: function ()
                                    {
                                        $("#ModalDialogOptions").removeData("restore");
                                        $("#ModalDialogOptions").appendTo("#BrowserNavigateOpenInFF").hide();
                                        popupManager.closeLast();
                                    }
                                },
                                {
                                    text: Resources.WizardButtons.CancelButtonText, click: function ()
                                    {
                                        var restore = $("#ModalDialogOptions").data("restore");
                                        for (var i = 0, l = restore.length; i < l; i++)
                                        {
                                            var ctrl = $("#" + restore[i].id);
                                            if (!ctrl.is(":checkbox"))
                                            {
                                                ctrl.val(restore[i].value);
                                            }
                                            else if (ctrl.is(":checkbox"))
                                            {
                                                ctrl.checkbox(restore[i].value ? "check" : "uncheck");
                                            }
                                        }
                                        $("#ModalDialogOptions").removeData("restore");
                                        $("#ModalDialogOptions").appendTo("#BrowserNavigateOpenInFF").hide();
                                        popupManager.closeLast();
                                    }
                                }
                            ],
                            headerText: Resources.CommonLabels.CommonOptionsLabelText.replace("{0}", Resources.CommonPhrases.ModalDialog),
                            content: $("#ModalDialogOptions"),
                            modalize: true,
                            width: 500,
                            height: 388
                        });

                        var restore = [];
                        $("#ModalDialogOptions").find("input").each(function ()
                        {
                            if ($(this).is(":checkbox"))
                            {
                                restore.push({ id: $(this).attr("id"), value: $(this).is(":checked") });
                            }
                            else
                            {
                                restore.push({ id: $(this).attr("id"), value: $(this).val() });
                            }
                        });

                        $("#ModalDialogOptions").data("restore", restore);
                    }
                });

                // Setting the preview text click handler
                _this._previewURL = $(_this.container).find(".preview-url");
                _this._previewURL.on("click", function () { if ($(this).is(".dynamic")) return false; });

                // Initializing the paramters grid
                var grid = $("#URLParameters").grid({
                    rowselect: _this._rowselectParameterGrid.bind(_this),
                    rowdblclick: _this._editPropertiesDialogRow.bind(_this),
                    actionrowclick: _this._newPropertiesDialogRow.bind(_this)
                });

                _this.initCallBack();
            }
        };
        jQuery.ajax(options);
    },

    initCallBack: function ()
    {
        //This method should be overrided by the configuration wizard (at runtime)
    },

    _newPropertiesDialogRow: function ()
    {
        var grid = $("#URLParameters");

        var inputrow = grid.find(".grid-content-table tr.template-row");
        var selrow = grid.grid("fetch", "selected-rows");

        if (!this._validatePropertiesDialogInputRow()) return;
        if (!this._validateDuplicateParameters()) return;

        if ($("#URLParameters").find("tr.edit-row").length > 0)
        {
            // A row is being edited
            var editrow = grid.find(".edit-row");

            // Updating the name
            editrow.children().eq(0).metadata().value = $("#ParamName").val().htmlEncode();
            editrow.children().eq(0).find(".grid-content-cell-wrapper").text($("#ParamName").val());

            // Updating the value
            editrow.children().eq(1).find(".grid-content-cell-wrapper").html(this._tokenBoxHtml($("#ParamValue").tokenbox("value"), true));
            editrow.children().eq(1).metadata().value = this._toSourceValueXML($("#ParamValue").tokenbox("value"));
        }
        else
        {
            // It is a new row that should be added
            var row = [
                {
                value: $("#ParamName").val().htmlEncode()
                },
                {
                    display: this._tokenBoxHtml($("#ParamValue").tokenbox("value")),
                    value: this._toSourceValueXML($("#ParamValue").tokenbox("value"))
                }
            ];

            if ($('.grid-body-content  .edit-template-row').length > 0) $("#URLParameters").grid("add", "row", row);
        }

        this._rowselectParameterGrid($("#URLParameters"));
        this._parameterList.push($("#ParamName").val());

        $("#ParamName").val("");
        $("#ParamValue").val("");
        $("#ParamValue").tokenbox("value", []);
        $("#URLParameters").grid("commit").grid("edit");
        $("#ParamValue")[0].blur();
        $("#ParamName")[0].select();
        $("#ParamName")[0].focus();
    },

    _insertNewDialogRow: function ()
    {
        var grid = $("#URLParameters");

        var inputrow = grid.find(".grid-content-table tr.template-row");
        var selrow = grid.grid("fetch", "selected-rows");

        if ($("#URLParameters").find("tr.edit-row").length > 0)
        {
            // A row is being edited
            var editrow = grid.find(".edit-row");

            // Updating the name
            editrow.children().eq(0).metadata().value = $("#ParamName").val().htmlEncode();
            editrow.children().eq(0).find(".grid-content-cell-wrapper").text($("#ParamName").val());

            // Updating the value
            editrow.children().eq(1).find(".grid-content-cell-wrapper").html(this._tokenBoxHtml($("#ParamValue").tokenbox("value"), true));
            editrow.children().eq(1).metadata().value = this._toSourceValueXML($("#ParamValue").tokenbox("value"));
        }
        else
        {
            // It is a new row that should be added
            var row = [
                {
                    value: $("#ParamName").val().htmlEncode()
                },
                {
                    display: this._tokenBoxHtml($("#ParamValue").tokenbox("value")),
                    value: this._toSourceValueXML($("#ParamValue").tokenbox("value"))
                }
            ];

            if ($('.grid-body-content  .edit-template-row').length > 0) $("#URLParameters").grid("add", "row", row);
        }

        this._rowselectParameterGrid($("#URLParameters"));

        $("#ParamName").val("");
        $("#ParamValue").val("");
        $("#ParamValue").tokenbox("value", []);
        $("#URLParameters").grid("commit").grid("edit");
        $("#ParamValue")[0].blur();
        $("#ParamName")[0].select();
        $("#ParamName")[0].focus();
    },

    _editPropertiesDialogRow: function ()
    {
        var grid = $("#URLParameters");
        if (grid.grid("fetch", "selected-rows").length === 0) return;

        if (!this._validateDuplicateParameters()) return;

        if (grid.find("tr.edit-row").length > 0)
        {
            if (!this._validatePropertiesDialogInputRow()) return;

            // An existing row is being edited, save the changes first
            var editrow = grid.find(".edit-row");

            // Updating the name
            editrow.children().eq(0).metadata().value = $("#ParamName").val().htmlEncode();
            editrow.children().eq(0).find(".grid-content-cell-wrapper").text($("#ParamName").val());

            // Updating the value
            editrow.children().eq(1).find(".grid-content-cell-wrapper").html(this._tokenBoxHtml($("#ParamValue").tokenbox("value"), true));
            editrow.children().eq(1).metadata().value = this._toSourceValueXML($("#ParamValue").tokenbox("value"));
        }
        else if ($("#ParamName").val() !== "")
        {
            // A new row is being added, save the new property
            var row = [
                    {
                    value: $("#ParamName").val().htmlEncode()
                    },
                    {
                        display: this._tokenBoxHtml($("#ParamValue").tokenbox("value")),
                        value: this._toSourceValueXML($("#ParamValue").tokenbox("value"))
                    }
                ];

            $("#URLParameters").grid("add", "row", row);
        }

        this._parameterList.push($("#ParamName").val());

        //Edit current row
        grid.grid("commit");
        var selrow = grid.grid("fetch", "selected-rows").eq(0);
        if (arguments.length === 2)
        {
            grid.grid("edit", grid.grid("fetch", "rows").index(arguments[0]));
        }
        else
        {
            grid.grid("edit", grid.grid("fetch", "rows").index(selrow));
        }

        var tokenboxvalue = this._buildTokenBoxFromSourceValue(selrow.children().eq(1).metadata().value);
        $("#ParamName").val(selrow.children().eq(0).text());
        $("#ParamValue").tokenbox("value", tokenboxvalue);
        $("#URLParameters").find(".toolbars").find(".toolbar-button.remove").addClass("disabled");
        this._removeByValue(this._parameterList, $("#ParamName").val());
        this._buildParameterURL();
    },

    _removeParameter: function (ev)
    {
        var btn = $(ev.currentTarget);

        if (btn.is(":not(.disabled)"))
        {
            var selrow = $("#URLParameters").grid("fetch", btn.is(".remove-all") ? "rows" : "selected-rows");
            this._removeByValue(this._parameterList, selrow.children().eq(0).text());
            selrow.remove();
            $("#URLParameters").grid("synccolumns");
            $("#URLParametersEditPropertyButton, #URLParametersRemovePropertyButton").addClass("disabled");
            if ($("#URLParameters").grid("fetch", "rows").length === 0) $("#URLParametersRemoveAllPropertiesButton").addClass("disabled")[0].blur();
        }

        this._buildParameterURL();
        return false;
    },

    _removeAllParameters: function ()
    {
        if ($("#URLParametersRemoveAllPropertiesButton").is(":not(.disabled)"))
        {
            var _this = this;
            this._parameterList = [];
            popupManager.showConfirmation({
                headerText: Resources.MessageBox.Confirmation,
                message: Resources.RuleDesigner.BrowserNavigateMappingWidgetRemoveAllParametersValidation,
                type: "confirmation",
                onAccept: function ()
                {
                    popupManager.closeLast();
                    $("#URLParameters").grid("clear");
                    $("#URLParametersEditPropertyButton, #URLParametersRemovePropertyButton, #URLParametersRemoveAllPropertiesButton").addClass("disabled");
                    $("#ParamName").val("");
                    $("#ParamValue").tokenbox("value", "");
                    _this._buildParameterURL();
                }
            });
        }
    },

    _rowselectParameterGrid: function ()
    {
        var grid = (arguments[0] !== undefined) ? arguments[0].closest(".grid") : null;

        if (grid === undefined || grid === null) grid = $("#URLParameters");

        var toolbars = grid.find(".toolbars");

        if (toolbars.length === 0) toolbars = $("#URLParametersToolbarGroup");

        var rows = grid.grid("fetch", "rows"), selrow = rows.filter(".selected");

        if (selrow.length > 0)
        {

            if (selrow.length === 1)
            {
                toolbars.find(".toolbar-button.edit").removeClass("disabled");
            }
            else
            {
                toolbars.find(".toolbar-button.edit").addClass("disabled");
            }
            toolbars.find(".toolbar-button.remove").removeClass("disabled");

        }
        else
        {
            toolbars.find(".toolbar-button.edit").addClass("disabled");
            toolbars.find(".toolbar-button.remove").addClass("disabled");
        }

        if (rows.length > 0)
        {
            toolbars.find(".toolbar-button.remove-all").removeClass("disabled");
        }
        else
        {
            toolbars.find(".toolbar-button.remove-all").addClass("disabled");
        }
    },

    //Check for blank parameter name
    _validatePropertiesDialogInputRow: function ()
    {
        if ($("#ParamName").val() === "" && $("#URLParameters .grid-content-table tr.edit-template-row").length > 0)
        {
            if (!arguments[0])
            {
                popupManager.showWarning({
                    message: Resources.RuleDesigner.BrowserNavigateMappingWidgetParameterValidationMessage,
                    onClose: function () { $("#ParamName")[0].focus(); }
                });
            }
            return false;
        }

        return true;
    },

    //Check for existing parameter
    _validateDuplicateParameters: function ()
    {

        if ($("#ParamName").val() !== "" && $.inArray($("#ParamName").val(), this._parameterList) !== -1)
        {

            popupManager.showWarning({
                message: Resources.RuleDesigner.BrowserNavigateMappingWidgetValidationDuplicateParameterMessage,
                onClose: function () { $("#ParamName")[0].focus(); }
            });

            return false;
        }

        return true;
    },

    _buildParameterURL: function ()
    {

        var result = this._previewText;
        var staticURL = true;
        var paramName = "";
        var paramValue = "";
        var url = "";

        //Add baseURL
        url += this._tokenBoxHtmlPreview(this._getTokenboxValue($("#baseURLText")), false);

        //Add parameters from grid
        var grid = $("#URLParameters");
        var rows = grid.grid("fetch", "rows");
        var firstrow = true;
        if (rows.length > 0)
        {
            for (var i = 0, l = rows.length; i < l; i++)
            {
                if (!rows.eq(i).is(".edit-row"))
                {
                    var currentrow = rows.eq(i).children();

                    paramName = currentrow.eq(0).metadata().value;

                    //Check for blank values
                    if (currentrow.eq(1).metadata().value === "<SourceValue></SourceValue>" ||
                        currentrow.eq(1).metadata().value === "<SourceValue><Item ContextType=\"value\"></Item></SourceValue>")
                    {
                        paramValue = "[{0}]".format(Resources.CommonLabels.BlankLabelText.toLowerCase());
                    }
                    else
                    {
                        paramValue = this._tokenBoxHtmlPreview(this._buildTokenBoxFromSourceValue(currentrow.eq(1).metadata().value));
                    }
                }
                else
                {
                    //Check for blank values
                    var paramValueTB = this._getTokenboxValue($("#ParamValue"));

                    paramName = $("#ParamName").val();
                    paramValue = this._tokenBoxHtmlPreview(paramValueTB, false);

                    if (paramValueTB.length === 0)
                    {
                        paramValue = "[{0}]".format(Resources.CommonLabels.BlankLabelText.toLowerCase());
                    }
                }

                if (firstrow && paramName.length > 0)
                {
                    url += "?{0}={1}".format(paramName, paramValue);
                    firstrow = false;
                }
                else if (!firstrow)
                {
                    url += "&{0}={1}".format(paramName, paramValue);
                }
            }

        }

        //Add new row, if any
        //totalRowCount = all visible rows in grid minus action-row
        //if totalRowCount is greater than the existing number of rows saved in the grid, (rows.length), then we have a new row to add preview

        var totalRowCount = grid.find(".grid-content-table tr:visible").length - 1;
        var inputrow = grid.find(".grid-content-table tr.edit-template-row");

        if (totalRowCount > rows.length && inputrow.length > 0)
        {
            //Add parameter name
            var paramNameValue = $("#ParamName").val();
            if (paramNameValue.length > 0)
                paramName = $("#ParamName").val();
            else
                paramName = paramValue = "[{0}]".format(Resources.CommonLabels.NameLabelText.toLowerCase());

            //Add paramter value
            var paramTokenBoxValue = this._getTokenboxValue($("#ParamValue"));
            if (paramTokenBoxValue.length > 0)
                paramValue = this._tokenBoxHtmlPreview(paramTokenBoxValue, false);
            else
                paramValue = paramValue = "[{0}]".format(Resources.CommonLabels.BlankLabelText.toLowerCase());

            if (firstrow && paramName.length > 0)
            {
                url += "?{0}={1}".format(paramName, paramValue);
                firstrow = false;
            }
            else if (!firstrow)
            {
                url += "&{0}={1}".format(paramName, paramValue);
            }
        }

        if (url === "")
        {
            url = Resources.RuleDesigner.BrowserNavigateMappingWidgetNoURLSpecified;
            this._previewURL.addClass("plaintext");
            staticURL = false; //disable clicking link
            this._previewURL.html("<span>" + url + "</span>");
        }
        else
        {
            this._previewURL.removeClass("plaintext");

            if (url.contains("span class=\"token")) staticURL = false;
            this._previewURL.html("<span>" + url + "</span>"); //must show same as "run with parameters", which shows everything encoded so someone can copy and paste the preview url
            this._previewURL.attr("href", this._previewURL.text()); // So the tooltip preview of the URL does not show with HTML markup
        }

        if (!staticURL)
        {
            this._previewURL.addClass("dynamic");
        }
        else
        {
            this._previewURL.removeClass("dynamic");
        }
    },

    _getParametersXML: function ()
    {
        var xstr = "";
        var rows = $("#URLParameters").grid("fetch", "rows", "objects");

        if (rows.length > 0)
        {

            for (var i = 0, l = rows.length; i < l; i++)
            {
                // Only add if value is not empty or null, to avoid null reference exceptions at runtime
                if (checkExists(rows[i][0].value) && rows[i][0].value !== "")
                {
                    xstr += this._getMapping("Parameters", encodeURIComponent(rows[i][0].value), rows[i][1].value);
                }
            }

        }

        return xstr;
    },

    _loadTarget: function (value)
    {
        this._openInTwisty.twisty("value", value).triggerHandler("toggle");
    },

    _toSourceValueXML: function (valobj)
    {
        var result = "<SourceValue>";

        $.each(valobj, function (k, v)
        {
            if (v.type === "value")
            {
                result += "<Item ContextType=\"value\">" + v.data.htmlEncode() + "</Item>";
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

    _getMapping: function (type, targetName, value)
    {
        if (checkExists(value) && value !== "")
            return this.createMapping(type, targetName, value);
        else
            return "";
    },

    createMapping: function(type, targetName, value)
    {
        var mapping =
            '<Mapping ActionPropertyCollection="' + type + '">' +
                '<Item ' +
                    'ContextType="target" ' +
                    'ItemType="Value" ' +
                    'Name="' + targetName + '" ' +
                '/>' +
                '<Item ContextType="value">' +
                    value +
                '</Item>' +
            '</Mapping>';

        return mapping;
    },

    _tokenBoxHtml: function (tokenboxvalue, preview)
    {
        preview = preview || false;

        var self = this;
        var result = "";

        if (preview)
        {
            result += this._tokenBoxHtmlPreview(tokenboxvalue);
        }
        else
        {
            result += "<div class=\"input-control token-input single-line multi-value mixed-values\"><div class=\"input-control-content\"><div class=\"input-control-wrapper\"><div class=\"token-input-editor-area ui-droppable\" contenteditable=\"false\">";
            $.each(tokenboxvalue, function ()
            {
                if (this.type === "value")
                {
                    var s = this.data;
                    s = s.htmlEncode().replace("\n", "<br/>");
                    s = s.replace(self.regexp.rls, function (x) { return new Array(x.length + 1).join('&nbsp;'); });
                    s = s.replace(self.regexp.rts, function (x) { return new Array(x.length + 1).join('&nbsp;'); });

                    result += s;
                }
                else
                {
                    var m = {}, icon = "";
                    var mLength = 0;

                    $.each(this.data, function (k, v)
                    {
                        if (k === "icon") icon = v;
                        switch (typeof v)
                        {
                            case "boolean":
                            case "number":
                                m[k] = v;
                                mLength++;
                                break;
                            case "string":
                                m[k] = v;
                                mLength++;
                        }
                    });
                    //TODO: TD 0001

                    result += "<span class=\"entity resolved" + (icon !== "" ? " icon " + icon : "") + "\"";

                    if (mLength > 0)
                    {
                        result += " data-options=\"" + jQuery.toJSON(m).htmlEncode() + "\"";
                    }

                    result += ($chk(this.tooltip) && this.tooltip !== "" ? (" title=\"" + this.tooltip.replace(/"/g, "") + "\"") : "")
                        + " contenteditable=\"false\"><span class=\"entity-text\">" + this.text.htmlEncode() + "</span></span>";
                }
            });
            result += "</div></div></div></div>";
        }

        return result;
    },

    _tokenBoxHtmlPreview: function (tokenboxvalue)
    {
        var result = "";
        if (tokenboxvalue.length > 0)
        {
            var textarr = [];
            $.each(tokenboxvalue, function ()
            {
                if (this.type === "context")
                {
                    textarr.push("<span class=\"token " + this.data.icon + "\">" + this.text.htmlEncode() + "</span>");
                }
                else
                {
                    textarr.push(this.text);
                }
            });
            result += textarr.join("");
        }
        else
        {
            result += "";
        }
        
        return result;
    },

    _buildTokenBoxFromSourceValue: function (input)
    {
        var tbval = [];
        var self = this;
        var mappingsDoc = $.parseXML(input);

        $("SourceValue", mappingsDoc).each(function ()
        {
            $(this).children().each(function ()
            {
                if ($(this).attr("ContextType") === "value")
                {
                    tbval.push({ type: "value", data: this.text, text: this.text });
                }
                else
                {
                    var dataobj = { type: "context", data: {} };
                    $.each(this.attributes, function ()
                    {
                        if (this.name !== "ContextType")
                        {
                            dataobj.data[this.name] = this.value;
                        }
                        if (this.name === "DisplayName")
                        {
                            dataobj.text = this.value;
                        }
                        if (this.name === "Name" && !dataobj.text)
                        {
                            dataobj.text = this.value;
                        }
                    });

                    var contextNode = self.container.closest(".popup").find(".mapping-tab-context-tree-section ul.tree").find("li").filter(function ()
                    {
                        var m = $(this).metadata(), match = true;

                        $.each(dataobj.data, function (k, v)
                        {
                            if (m[k] === undefined) match = false;
                            if (m[k] !== undefined && m[k] !== v) match = false;
                        });

                        return match;
                    });

                    if (contextNode.length === 1)
                    {
                        dataobj.text = contextNode.children("a").text();
                        dataobj.data = contextNode.metadata();
                    }
                    else if (contextNode.length === 0 && (dataobj.data.ItemType === "ControlProperty" || dataobj.data.ItemType === "ControlField"))
                    {
                        if (checkExists(dataobj.data.InstanceID) && dataobj.data.InstanceID === "00000000-0000-0000-0000-000000000000")
                        {
                            dataobj.data.InstanceID = null;
                        }

                        if (checkExists(dataobj.data.SubFormID) && dataobj.data.SubFormID === "00000000-0000-0000-0000-000000000000")
                        {
                            dataobj.data.SubFormID = null;
                        }

                        // This section was added for the items that need to be partially loaded
                        var parentMetadata = { id: dataobj.data.SourcePath, SubFormID: dataobj.data.SubFormID, InstanceID: dataobj.data.InstanceID };
                        var childMetadata = { id: dataobj.data.id, SourceID: dataobj.data.SourceID, SourcePath: dataobj.data.SourcePath, SubFormID: dataobj.data.SubFormID, InstanceID: dataobj.data.InstanceID };
                        draggingNode = self.basicTargetContextCanvas.targetContextCanvas("getPartialDraggingNode", parentMetadata, childMetadata);

                        if (draggingNode !== null)
                        {
                            dataobj.text = draggingNode.text;
                            dataobj.data = draggingNode.data;
                        }
                        // This section was added for the items that need to be partially loaded
                    }

                    tbval.push(dataobj);
                }
            });
        });

        return tbval;
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
                if ($(node).hasClass("entity"))
                {
                    result.push({ type: "context", data: $(node).metadata(), text: $(node).text() });
                }
                else if ($(node).hasClass("text-node"))
                {
                    // Only save non-empty text-nodes
                    if (!$(node).hasClass("empty") && !$(node).is(":empty"))
                    {
                        result.push({ type: "value", data: $(node).text(), text: $(node).text() });
                    }
                }
                else if ($(node).is("br"))
                {
                    result.push({ type: "value", data: "\n", text: "\n" });
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
                var text = node.nodeValue.replace(this.regexp.rlsc, " ").replace(this.regexp.rtsc, " ");
                if (text !== "")
                    result.push({ type: "value", data: text, text: text });
                break;
        }
    },

    regexp: {
        rp: /<p>/gim,				// paragraph start tags
        rpe: /<\/p>/gim,			// paragraph end tags
        rd: /<div>/gim, 			// div start tags
        rde: /<\/div>/gim,			// div end tags
        rb: /<br.*?>/gim,			// br tags
        rls: /^[ \t]+/gm,			// leading space & tabs
        rts: /[ \t]+$/gm,			// trailing space & tabs
        rlsc: /^\s/,				// leading space chars
        rtsc: /\s$/,				// trailing space chars
        formatBR: /<br>/gim,			//match for replace with <br />
        formatOpeningSpan: /<SPAN/gim,		//match for replace with <span
        formatClosingSpan: /<\/SPAN>/gim,	//match for replace with </span>
        zeroWidthSpace: /\u200B/g,		// match zero-width-space characters
        lineBreak: /<\/div><div>/gim		// div end tags with immediate div start tag
    },

    _removeByValue: function (arr, val)
    {
        for (var i = 0; i < arr.length; i++)
        {
            if (arr[i] === val)
            {
                arr.splice(i, 1);
                break;
            }
        }
    }

};
