(function ($)
{
    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Controls === "undefined" || SourceCode.Forms.Controls === null) SourceCode.Forms.Controls = {};


    SourceCode.Forms.Controls.StyleBuilder =
        {
            //#region 
            Defaults:
                {
                    Border:
                        {
                            Color: "#FFFFFF",
                            Width: "0px",
                            Style: "None"
                        },
                    Margin: "0px",
                    Padding: "0px",
                    Font:
                        {
                            Family: "Verdana, Geneva, sans-serif",
                            Style: "Normal",
                            Weight: "Normal",
                            Color: "#000000",
                            Size: "8pt"
                        },
                    Text:
                        {
                            Align: "Left",
                            Decoration: "None"
                        },
                    BackgroundColor: "#FFFFFF"
                },
            controls: null,
            backgroundTabControls: null,
            renderXhr: null,
            availableStylesNode: null,
            fontStylingControls: null,
            styleBuilderDialog: null,
            localeChangedLock: false,
            currentCulture: null,
            dialogHtml: "",
            DesignRenderHelper: null,
            numberDecimalPlacesVal: null,
            currencyDecimalPlacesVal: null,
            currencySymbolVal: null,
            percentageDecimalPlacesVal: null,
            scientificDecimalPlacesVal: null,
            customTextBoxVal: null,
            negativeNumbersVal: null,
            currencyNegativeNumbersVal: null,
            specialFormattinVal: null,
            durationFormatVal: null,
            durationConvertVal: null,
            dateTypeVal: null,
            _create: function ()
            {

            },
            enableStyleControls: function (context, styleType, availableStylesNodeDataItem)
            {
                //#region 
                var styleNodeXml = availableStylesNodeDataItem.selectNodes("*");
                for (var t = 0; t < styleNodeXml.length; t++)
                {
                    var styleName = styleNodeXml[t].nodeName;
                    var selector = (".style-builder-" + styleType + "-" + styleName).toLowerCase();
                    $(context).each(
                        function (index, element)
                        {
                            var jqElement = $(element);
                            if (jqElement.is(selector))
                                this.disableEnableControl(jqElement, true);
                        }.bind(this)
                    );
                }
                //#endregion
            },
            disableEnableControl: function (control, enabled)
            {
                var jqControl = $(control);
                if (jqControl.length === 1)
                {
                    var useAttribute = jqControl.is("INPUT") || jqControl.is("SELECT") || jqControl.is("TEXTAREA");
                    //#region
                    if (enabled)
                    {
                        if (useAttribute)
                            jqControl.prop("disabled", false);
                        else
                            jqControl.removeClass("disabled");
                    }
                    else
                    {
                        if (useAttribute)
                            jqControl.prop("disabled", true);
                        else
                            jqControl.addClass("disabled");
                    }
                }
                //$endregion
            },
            disableEnableControls: function (tabs)
            {
                //#region
                if (this.availableStylesNode)
                {
                    var $this = this;

                    this.tabs = this.styleBuilderDialog.find(".tab");
                    //disable all tabs
                    this.tabs.each(function (index, tab)
                    {
                        $this.disableEnableControl(tab, false);
                    });

                    //find tabs that should be enabled and enable them
                    var availableStylesNodeData = this.availableStylesNode.selectNodes("*");

                    for (var s = 0; s < availableStylesNodeData.length; s++)
                    {
                        var styleType = availableStylesNodeData[s].tagName;
                        switch (styleType)
                        {
                            case "Font":
                            case "Text":
                                this.disableEnableControl("#FontTab", true);
                                break;
                            case "Border":
                                this.disableEnableControl("#BordersTab", true);
                                break;
                            case "Padding":
                                this.disableEnableControl("#PaddingTab", true);
                                break;
                            case "BackgroundColor":
                            case "BackgroundImage":
                                this.disableEnableControl("#BackgroundTab", true);
                                break;
                            case "Margin":
                                this.disableEnableControl("#MarginTab", true);
                                break;
                            case "Format":
                                this.disableEnableControl("#FormatTab", true);
                                break;
                            case "VerticalAlign":
                                //todo add to stylebuilder
                                break;
                        }

                    }

                    //remove contents of disabled tabs :)
                    //performance optimization allows selectors to fly
                    this.tabs.each(function (index, tab)
                    {
                        var jqTab = jQuery(tab);
                        if (jqTab.is(".disabled"))
                        {
                            $("#{0}_Content".format(tab.id)).remove();
                        }
                    });

                    //Now with optimized dom find various controls
                    this.fontStylingControls = this.styleBuilderDialog.find(".style-builder-font");
                    this.controls = this.styleBuilderDialog.find(".style-builder-controls");

                    //disable all controls
                    this.controls.each(function (index, control)
                    {
                        $this.disableEnableControl(control, false);
                    });
                    this._disabledCheckboxControls(); //Checkbox controls are jQuery custom controls and are disabled separately

                    for (var s = 0; s < availableStylesNodeData.length; s++)
                    {
                        var styleType = availableStylesNodeData[s].tagName;
                        switch (styleType)
                        {
                            case "Font":
                                this.enableStyleControls(this.controls, styleType, availableStylesNodeData[s]);
                                break;
                            case "Text":
                                this.enableStyleControls(this.controls, styleType, availableStylesNodeData[s]);
                                break;
                            case "VerticalAlign":
                                this.disableEnableControl($(this.controls).filter((".style-builder-" + styleType).toLowerCase()), true);
                                break;
                            case "BackgroundColor":
                                this.disableEnableControl($(this.controls).filter(".background-color"), true);
                                break;
                            case "Border":
                                var borderSidesXml = availableStylesNodeData[s].selectNodes("*");
                                for (var i = 0; i < borderSidesXml.length; i++)
                                {
                                    //TODO
                                    //enable all controls on the Borders tab
                                    this.disableEnableControl(this.controls.filter("#Border" + borderSidesXml[i].nodeName), true);

                                }
                                if (borderSidesXml.length > 4)
                                {
                                    //enable all borders control
                                    this.disableEnableControl(this.controls.filter("#BorderDefault"), true);
                                }
                                if (borderSidesXml.length > 0)
                                {
                                    //enable no borders control
                                    this.disableEnableControl(this.controls.filter("#BorderNone"), true);
                                    //disable all select boxes
                                    this.disableEnableControl(this.controls.filter("#BorderWidthSelect").get(), true);
                                    this.disableEnableControl(this.controls.filter("#BorderStyleSelect").get(), true);
                                    //disable color picker
                                    this.disableEnableControl(this.controls.filter("#BorderColor").get(), true);
                                }
                                break;
                            case "Padding":
                                var paddingTab = jQuery("#PaddingTab_Content");
                                var paddingSidesXml = availableStylesNodeData[s].selectNodes("*");
                                for (var i = 0; i < paddingSidesXml.length; i++)
                                {
                                    //enable all controls on the Padding tab
                                    this.disableEnableControl(jQuery("#StyleBuilderPaddingSelect" + paddingSidesXml[i].nodeName).eq(0), true);

                                }
                                break;
                            case "Margin":
                                var marginTab = jQuery("#MarginTab_Content");
                                var marginSidesXml = availableStylesNodeData[s].selectNodes("*");
                                for (var i = 0; i < marginSidesXml.length; i++)
                                {
                                    //enable all controls on the Margin tab
                                    this.disableEnableControl(jQuery("#StyleBuilderMarginSelect" + marginSidesXml[i].nodeName).eq(0), true);

                                }
                                break;
                            case "Format":
                                $("#StyleBuilderFormatContainer").find(".style-builder-controls").each(function (index, control)
                                {
                                    $this.disableEnableControl(control, true);
                                });
                                //enable the "Use 1000 Separator" checkbox
                                $("#styleBuilderUseSeparator").checkbox().checkbox("enable");
                                break;
                            case "BackgroundImage":
                                //enable all controls on the Background tab

                                //lookups
                                this.disableEnableControl($("#StyleBuilderBackgroundgroundImageFormField .lookup-box"), true);

                                //checkboxes
                                $("#BackgroundImageRepeatHorizontallyCheckbox").checkbox().checkbox("enable");
                                $("#BackgroundImageRepeatVerticallyCheckbox").checkbox().checkbox("enable");
                                $("#BackgroundImageShadowCheckbox").checkbox().checkbox("enable");

                                //dropdowns
                                $("#BackgroundImageSizeSelect").dropdown().dropdown("enable");
                                $("#BackgroundImageSizeSelect").prop("disabled", false);
                                $("#BackgroundImageRoundedCornerSelect").dropdown().dropdown("enable");
                                $("#BackgroundImageRoundedCornerSelect").prop("disabled", false);

                                //widgets
                                $("#BackgroundImagePositionWidget").imagePositionWidget().imagePositionWidget("enable");

                                break;
                        }

                    }

                }
                else
                {
                    this.tabs = this.styleBuilderDialog.find(".tab");
                    this.fontStylingControls = this.styleBuilderDialog.find(".style-builder-font");
                    this.controls = this.styleBuilderDialog.find(".style-builder-controls");
                }
                //#endregion
            },

            _disabledCheckboxControls: function ()
            {
                var controls = this.styleBuilderDialog.find(".input-control[type='checkbox']").checkbox();

                controls.checkbox("disable");

                return controls;
            },

            showDialog: function ()
            {
                if (jQuery("#StyleBuilderDialog") === null || jQuery("#StyleBuilderDialog").length === 0)
                {
                    jQuery("body").append("<div id=\"StyleBuilderDialog\" style=\"height:100%\"></div>");
                }
                this.styleBuilderDialog = jQuery("#StyleBuilderDialog");
                if (!this.dialogHtml)
                {
                    var StylesAlreadyLoaded = (SCCultureHelper.current) ? true : false;
                    jQuery.ajax({
                        url: "StyleBuilder/StyleBuilderDialog.aspx",
                        data: {
                            StylesAlreadyLoaded: StylesAlreadyLoaded
                        },
                        type: "POST",
                        async: true,
                        success: this.htmlLoaded.bind(this),
                        dataType: "text",
                        global: false
                    });
                }
                else
                {
                    this.htmlLoaded(this.dialogHtml);
                }
                //this.styleBuilderDialog.empty().load("StyleBuilder/StyleBuilderDialog.aspx", this.htmlLoaded.bind(this));
            },
            generatePixelOptions: function (startOptions, endOptions, selectedSize)
            {
                //#region
                var newHtml = "";
                if (startOptions !== null)
                {
                    for (var i = 0; i < startOptions.length; i++)
                    {
                        newHtml += "<option value='" + startOptions[i].value + "'>" + startOptions[i].display + "</option>";
                    }
                }
                //add pixel options
                for (var i = 1; i < 11; i++)
                {
                    var optionValue = i + "px";
                    var selected = (selectedSize !== null && selectedSize === i) ? "selected='selected'" : "";
                    newHtml += "<option value='" + optionValue + "' " + selected + ">" + optionValue + "</option>";
                }
                for (var i = 1; i < 6; i++)
                {
                    var optionValue = 10 + (i * 2) + "px";
                    var selected = (selectedSize !== null && (selectedSize === (10 + (i * 2)))) ? "selected='selected'" : "";
                    newHtml += "<option value='" + optionValue + "' " + selected + ">" + optionValue + "</option>";
                }
                for (var i = 1; i < 7; i++)
                {
                    var optionValue = 20 + (i * 5) + "px";
                    var selected = (selectedSize !== null && (selectedSize === (20 + (i * 5)))) ? "selected='selected'" : "";
                    newHtml += "<option value='" + optionValue + "' " + selected + ">" + optionValue + "</option>";
                }
                if (endOptions !== null)
                {
                    for (var i = 0; i < endOptions.length; i++)
                    {
                        newHtml += "<option value='" + endOptions[i].value + "'>" + endOptions[i].display + "</option>";
                    }
                }
                return newHtml;
                //#endregion
            },
            htmlLoaded: function (data, textStatus)
            {
                if (this.modalizedControl)
                    this.modalizedControl.showBusyModal(false);

                this.styleBuilderDialog.empty().html(data);
                this.loadTextboxValues();
                this.setupCultureXml();

                var h = 450;

                //Immediately disable all controls as we don't want the controls to appear briefly enabled.
                this.disableEnableControls();

                var currentStyleBuilder = this;

                var StyleBuilderDialogPopup = jQuery.popupManager.showPopup({
                    headerText: Resources.CommonLabels.StyleBuilderHeading,
                    modalize: true,
                    content: this.styleBuilderDialog,
                    width: 723,
                    height: h + 63,
                    buttons: [
                        {
                            type: "help",
                            click: function () { HelpHelper.runHelp(7016); }
                        },
                        {
                            text: Resources.CommonActions.ResetText,
                            click: function ()
                            {
                                if ($.jPicker && $.jPicker.List)
                                {
                                    for (var i = 0; i < $.jPicker.List.length; i++)
                                    {
                                        $.jPicker.List[i].destroy();
                                    }
                                    $.jPicker.List = [];
                                }
                                this.DesignRenderHelper = null;

                                var _this = this;
                                StyleBuilderDialogPopup.showBusyModal(true);
                                setTimeout(
                                    function ()
                                    {
                                        StyleBuilderDialogPopup.showBusyModal(false);
                                        popupManager.closeLast({ cancelOnClose: true });

                                        //replace existing style with default style
                                        _this.customStylesXml.removeChild(_this.customStyleNode);
                                        if (typeof _this.defaultStyleNode !== "undefined" && _this.defaultStyleNode !== null)
                                        {
                                            _this.customStyleNode = _this.defaultStyleNode.cloneNode(true);
                                            _this.customStylesXml.appendChild(_this.customStyleNode);
                                        }
                                        else
                                        {
                                            var name = _this.customStyleNode.getAttribute("Name");
                                            var isDefault = _this.customStyleNode.getAttribute("IsDefault");
                                            this.customStyleNode = _this.customStyleNode.ownerDocument.createElement("Style");
                                            if (name)
                                                _this.customStyleNode.setAttribute("Name", name);
                                            if (isDefault)
                                                _this.customStyleNode.setAttribute("IsDefault", isDefault);
                                        }

                                        _this.customStylesXml.appendChild(_this.customStyleNode);

                                        _this.showDialog();
                                        _this.updateStylesPreview();
                                    }, 40);
                            }.bind(currentStyleBuilder)
                        },
                        {
                            text: Resources.WizardButtons.OKButtonText,
                            click: function ()
                            {
                                if (this.onWidgetReturned)
                                    this.onWidgetReturned(true, this.customStyleNode);
                                this.styleBuilderDialog.remove();
                                if ($.jPicker && $.jPicker.List)
                                {
                                    for (var i = 0; i < $.jPicker.List.length; i++)
                                    {
                                        $.jPicker.List[i].destroy();
                                    }
                                    $.jPicker.List = [];
                                }
                                popupManager.closeLast({ cancelOnClose: true });
                            }.bind(currentStyleBuilder)
                        },
                        {
                            text: Resources.WizardButtons.CancelButtonText,
                            click: function ()
                            {
                                if (this.onWidgetReturned)
                                    this.onWidgetReturned(false, null);
                                this.styleBuilderDialog.remove();
                                if ($.jPicker && $.jPicker.List)
                                {
                                    for (var i = 0; i < $.jPicker.List.length; i++)
                                    {
                                        $.jPicker.List[i].destroy();
                                    }
                                    $.jPicker.List = [];
                                }
                                popupManager.closeLast({ cancelOnClose: true });
                            }.bind(currentStyleBuilder)
                        }
                    ]
                });

                this.addAllEventsToControls();

                var controlStyle;
                if (this.customStyleNode)
                {
                    controlStyle = this.customStyleNode;
                    this.setSelectedFormat(controlStyle);
                    this.setSelectedStyles(controlStyle);
                }

                //select the first non disabled tab
                this.tabs.each(function ()
                {
                    var jqThis = jQuery(this);
                    if (!jqThis.is(".disabled"))
                    {
                        jqThis.eq(0).trigger("click");
                        return false;
                    }
                });

                var designRenderHelper = this.getDesignRenderHelper();
                designRenderHelper.renderControl(controlStyle);
                //#endregion
            },
            load: function (options)
            {
                //#region
                this.viewControl = options.viewControl;
                this.controlType = options.viewControl.controltype;
                this.onWidgetReturned = options.onWidgetReturned;
                this.modalizedControl = options.modalizedControl;
                this.availableStylesNode = options.availableStylesNode;
                this.customStylesDocument = options.customStylesXml.ownerDocument;
                this.customStylesXml = options.customStylesXml;
                this.customStyleNode = options.customStyleNode;
                this.defaultStylesXml = options.defaultStylesXml;
                this.defaultStyleNode = options.defaultStyleNode;
                this.targetType = options.targetType ? options.targetType : null;
                this.resultType = options.resultType ? options.resultType : null;
                this.content = jQuery("<div id='styleBuilderPanelboxWrapper'></div>");
                this.DesignRenderHelper = null;

                //#endregion
            },
            setupCultureXml: function ()
            {
                if (!this.dialogHtml)
                {
                    if (!checkExists(SCCultureHelper.current))
                    {
                        this.currentCulture = jQuery("#currentCulture").val();
                        var stringXmlValueList = "";
                        var cultures = jQuery("#culturesXml").val();
                        jQuery("#culturesXml").val("");

                        var data = parseXML(cultures);
                        var currentCulture = data.selectSingleNode("Results/CurrentCulture").text,
                            culturesXmlString = data.selectSingleNode("Results/Cultures").xml,
                            timeZones = data.selectSingleNode('Results/Timezones').text;

                        SCCultureHelper.current = new SourceCode.Forms.CultureHelper(culturesXmlString, this.currentCulture, timeZones);
                    }
                    else
                    {
                        this.currentCulture = SCCultureHelper.current.currentCultureName;
                    }
                    //cache html with out the culture lists
                    this.dialogHtml = this.styleBuilderDialog.html();

                }

                this.styleBuilderDialog.showBusyModal(true);
                SCCultureHelper.current.getCultureObject(this.currentCulture, this.cultureObjectRetrieved.bind(this));
            },
            setSelectedStyles: function (controlStyles)
            {
                //#region 
                var textDecoration = controlStyles.selectSingleNode("Text/Decoration") ? controlStyles.selectSingleNode("Text/Decoration").text : null;
                var textAlign = controlStyles.selectSingleNode("Text/Align") ? controlStyles.selectSingleNode("Text/Align").text : null;
                //Margins
                //#region
                var margins = controlStyles.selectNodes("Margin/*");
                for (var i = 0; i < margins.length; i++)
                {
                    var control = jQuery("#StyleBuilderMarginSelect" + margins[i].nodeName);
                    control.dropdown("select", margins[i].text);
                }
                //#endregion
                //Padding
                //#region
                var padding = controlStyles.selectNodes("Padding/*");
                for (var i = 0; i < padding.length; i++)
                {
                    var control = jQuery("#StyleBuilderPaddingSelect" + padding[i].nodeName);
                    control.dropdown("select", padding[i].text);
                }
                //#endregion
                //Borders
                //#region
                var borderSides = controlStyles.selectNodes("Border/*");
                var bordersDiv = jQuery("#BordersTab_Content");
                var toolbarbuttons = bordersDiv.find(".toolbar-button:not(.disabled)");
                for (var i = 0; i < borderSides.length; i++)
                {
                    if (borderSides[i].nodeName === "Default")
                    {
                        toolbarbuttons.filter(":not(.no-borders)").addClass("selected");
                        break;
                    }
                    toolbarbuttons.filter("#Border" + borderSides[i].nodeName).addClass("selected");
                }
                //#endregion

                var fontStyles = controlStyles.selectNodes("Font/*");
                var combinationWeightStyle = "unchanged";
                for (var i = 0; i < fontStyles.length; i++)
                {
                    switch (fontStyles[i].nodeName)
                    {
                        case "Weight":
                            if (fontStyles[i].text.toLowerCase() === "bold")
                            {
                                if (combinationWeightStyle === "italic")
                                {
                                    combinationWeightStyle = "bold-italic";
                                }
                                else
                                {
                                    combinationWeightStyle = "bold";
                                }
                            }
                            else if (combinationWeightStyle !== "italic")
                            {
                                combinationWeightStyle = fontStyles[i].text.toLowerCase();
                            }
                            break;
                        case "Style":
                            if (fontStyles[i].text.toLowerCase() === "italic")
                            {
                                if (combinationWeightStyle === "bold")
                                {
                                    combinationWeightStyle = "bold-italic";
                                }
                                else
                                {
                                    combinationWeightStyle = "italic";
                                }
                            }
                            else if (combinationWeightStyle !== "bold")
                            {
                                combinationWeightStyle = fontStyles[i].text.toLowerCase();
                            }
                            break;
                        default:
                            //get the control accociated by name to the particular style
                            var control = jQuery("#styleBuilderFont" + fontStyles[i].nodeName);
                            if (control.length)
                            {
                                //check if is a dropdown list
                                if (control[0].tagName.toUpperCase() === "SELECT")
                                {
                                    if (control.is(".style-builder-dynamicselect"))
                                        control.dynamicstyledropdown("select", fontStyles[i].text);
                                    else
                                        control.dropdown("select", fontStyles[i].text);
                                }
                                //otherwise its a button
                                //Check if the off values are set (more generic than checking the on values)
                                else if ((fontStyles[i].text.toUpperCase() !== "NONE" && fontStyles[i].text.toUpperCase() !== "NORMAL"))
                                {
                                    control.addClass("selected");
                                }
                            }
                            else
                            {
                                var control = jQuery("#styleBuilder" + fontStyles[i].nodeName + "PickerInput");
                                if (control.length)
                                {
                                    var colorPicked = fontStyles[i].text;
                                    if (colorPicked === "transparent" || colorPicked === "#")
                                    {
                                        $(control[0]).val("transparent");
                                        control[0].color.active.val('a', 0);
                                    }
                                    else
                                    {
                                        $(control[0]).val(colorPicked.replace("#", ""));
                                        control[0].color.active.val('hex', colorPicked);
                                    }
                                }
                            }
                            break;
                    }

                }
                if (combinationWeightStyle !== "unchanged")
                {
                    if (combinationWeightStyle === "normal")
                        combinationWeightStyle = "regular";
                    else if (combinationWeightStyle === "clear")
                        combinationWeightStyle = "";
                    var control = jQuery("#styleBuilderFontStyle");
                    control.dropdown("select", combinationWeightStyle);
                }

                this.setSelectedStylesForBackgroundTab(controlStyles);

                if (textDecoration)
                {
                    jQuery("#styleBuilderTextDecoration_{0}".format(textDecoration.toLowerCase())).addClass("selected");
                }

                if (textAlign)
                {
                    jQuery("#styleBuilderTextAlign_{0}".format(textAlign.toLowerCase())).addClass("selected");
                }
                //#endregion

            },
            setSelectedStylesForBackgroundTab: function (controlStyles)
            {
                var o = this.backgroundTabControls;
                if (!checkExists(o))
                {
                    //Background tab disabled
                    return;
                }

                //Set background color
                var backgroundColor = controlStyles.selectSingleNode("BackgroundColor") ? controlStyles.selectSingleNode("BackgroundColor").text : null;
                if (checkExists(backgroundColor) && checkExists(o.backgroundColorPicker) && o.backgroundColorPicker.length > 0)
                {
                    if (backgroundColor === "transparent" || backgroundColor === "#")
                    {
                        o.backgroundColorPicker.val("transparent");
                        o.backgroundColorPicker[0].color.active.val('a', 0);
                    }
                    else
                    {
                        var colorObj = jQuery.Color(backgroundColor);

                        o.backgroundColorPicker.val(backgroundColor.replace("#", ""));
                        o.backgroundColorPicker[0].color.active.val('hex', colorObj.toHexString());
                    }
                }

                //Set background image name lookup textbox
                var backgroundImageName = controlStyles.selectSingleNode("BackgroundImage/ImageName") ? controlStyles.selectSingleNode("BackgroundImage/ImageName").text : null;
                backgroundImageName = checkExistsNotEmpty(backgroundImageName) ? backgroundImageName : Resources.CommonLabels.NoneLabelText;
                $("#StyleBuilderBackgroundImageName").val(backgroundImageName);

                var node = controlStyles.selectSingleNode("BackgroundImage");
                if (checkExists(node))
                {
                    //#region set horizontal and vertical repeat checkboxes
                    var horizontalRepeat = node.selectSingleNode("HorizontalRepeat") ? node.selectSingleNode("HorizontalRepeat").text : "False";
                    if (horizontalRepeat.toLowerCase() === "true")
                    {
                        o.repeatHorizontallyCheckbox.checkbox("check");
                    }
                    else
                    {
                        o.repeatHorizontallyCheckbox.checkbox("uncheck");
                    }

                    var verticalRepeat = node.selectSingleNode("VerticalRepeat") ? node.selectSingleNode("VerticalRepeat").text : "False";
                    if (verticalRepeat.toLowerCase() === "true")
                    {
                        o.repeatVerticallyCheckbox.checkbox("check");
                    }
                    else
                    {
                        o.repeatVerticallyCheckbox.checkbox("uncheck");
                    }
                    //#endregion

                    //#region set image size dropdown, default is "normal"
                    var imageSizeValue = node.selectSingleNode("ImageSize") ? node.selectSingleNode("ImageSize").text : "normal";
                    if ("normal, cover, contain".indexOf(imageSizeValue) < 0)
                    {
                        imageSizeValue = "normal";   //set to default
                    }
                    o.imageSizeDropDown.dropdown("SelectedValue", imageSizeValue);
                    //#endregion

                    //#region set image position dropdown, default is "top center"
                    var verticalPosition = node.selectSingleNode("VerticalPosition") ? node.selectSingleNode("VerticalPosition").text : "top";
                    if ("top, center, bottom".indexOf(verticalPosition) < 0)
                    {
                        verticalPosition = "top";   //set to default
                    }

                    var horizontalPosition = node.selectSingleNode("HorizontalPosition") ? node.selectSingleNode("HorizontalPosition").text : "center";
                    if ("left, center, right".indexOf(horizontalPosition) < 0)
                    {
                        horizontalPosition = "center"; //set to default
                    }

                    var positionValue = verticalPosition + "-" + horizontalPosition;
                    o.positionWidget.imagePositionWidget("selectedValue",positionValue);
                    //#endregion

                    //#region set image shadow checkbox
                    var shadow = node.selectSingleNode("Shadow") ? node.selectSingleNode("Shadow").text : "False";
                    if (shadow.toLowerCase() === "true")
                    {
                        o.imageShadowCheckbox.checkbox("check");
                    }
                    else
                    {
                        o.imageShadowCheckbox.checkbox("uncheck");
                    }
                    //#endregion

                    //#region set image rounded corner dropdown, default is "0px"
                    var radiusNode = node.selectSingleNode("Radius/@All");
                    var imageRoundedCornerValue = radiusNode ? radiusNode.text : "";
                    o.imageRoundedCornerDropDown.dropdown("SelectedValue", imageRoundedCornerValue);
                    //#endregion
                }
                else
                {
                    o.repeatHorizontallyCheckbox.checkbox("uncheck");
                    o.repeatVerticallyCheckbox.checkbox("uncheck");
                    o.imageSizeDropDown.dropdown("SelectedValue", "normal");
                    o.positionWidget.imagePositionWidget("selectedValue","top-center");
                    o.imageShadowCheckbox.checkbox("uncheck");
                    o.imageRoundedCornerDropDown.dropdown("SelectedValue", "");
                }
            },
            setSelectedFormat: function (controlStyles)
            {
                var formatNode = controlStyles.selectSingleNode("Format");
                if (formatNode)
                {
                    this.currentFormatNode = formatNode;
                    this.cultureName = formatNode.getAttribute("Culture");
                    if (this.cultureName && this.cultureName !== "")
                        SCCultureHelper.current.getCultureObject(this.cultureName, this._setSelectedFormatCultureRetrieved.bind(this));
                    else
                        SCCultureHelper.current.getCultureObject(this.currentCulture, this._setSelectedFormatCultureRetrieved.bind(this));
                }
            },
            _setSelectedFormatCultureRetrieved: function (cultureObject)
            {
                if (cultureObject)
                {
                    this.cultureObjectRetrieved(cultureObject);
                }
                var formatNode = this.currentFormatNode;
                if (formatNode)
                {
                    var pattern = formatNode.text;
                    var type = formatNode.getAttribute("Type");
                    var currencySymbol = formatNode.getAttribute("CurrencySymbol");
                    var negativePattern = formatNode.getAttribute("NegativePattern");

                    var formatGrid = jQuery("#StyleBuilderFormatListGrid");
                    var formatRowObjects = formatGrid.grid("fetch", "rows", "objects");

                    switch (type)
                    {
                        case "None":
                            break;
                        case "Number":
                            if (!this.cultureName || this.cultureName === "")
                            {
                                jQuery("#styleBuilderNumberUseUserLocale").radiobutton("check").trigger("change");
                            }
                            else
                            {
                                jQuery("#styleBuilderNumberUseSpecificLocale").radiobutton("check").trigger("change");
                            }
                            var thousandsSeparator = (pattern[0] === "N");
                            var decimalPlaces = (pattern.length > 1) ? pattern.charAt(1) : "";

                            this.numberDecimalPlacesVal.val(decimalPlaces);
                            if (thousandsSeparator)
                            {
                                jQuery("#styleBuilderUseSeparator").checkbox("check");
                            }
                            var negativeGrid = this.negativeNumbersVal;
                            this.findAndSelectItemInGrid(negativeGrid, negativePattern);
                            break;
                        case "Currency":
                            if (!this.cultureName || this.cultureName === "")
                            {
                                jQuery("#styleBuilderCurrencyUseUserLocale").radiobutton("check").trigger("change");
                            }
                            else
                            {
                                jQuery("#styleBuilderCurrencyUseSpecificLocale").radiobutton("check").trigger("change");
                            }
                            var decimalPlaces = (pattern.length > 1) ? pattern.charAt(1) : "";
                            this.currencyDecimalPlacesVal.val(decimalPlaces);
                            this.currencySymbolVal.val(currencySymbol);
                            var negativeGrid = this.currencyNegativeNumbersVal;
                            this.findAndSelectItemInGrid(negativeGrid, negativePattern);
                            break;
                        case "Date":
                            if (this.cultureName && this.cultureName !== "")
                            {
                                jQuery("#styleBuilderDateUseSpecificLocale").radiobutton("check").trigger("change");
                            }
                            else
                            {
                                jQuery("#styleBuilderDateUseUserLocale").radiobutton("check").trigger("change");
                            }
                            this.dateTypeVal.dropdown("select", pattern);
                            break;
                        case "Percentage":
                            if (!this.cultureName || this.cultureName === "")
                            {
                                jQuery("#styleBuilderPercentageUseUserLocale").radiobutton("check").trigger("change");
                            }
                            else
                            {
                                jQuery("#styleBuilderPercentageUseSpecificLocale").radiobutton("check").trigger("change");
                            }
                            var decimalPlaces = (pattern.length > 1) ? pattern.charAt(1) : "";
                            this.percentageDecimalPlacesVal.val(decimalPlaces);
                            break;
                        case "Scientific":
                            if (!this.cultureName || this.cultureName === "")
                            {
                                jQuery("#styleBuilderScientificUseUserLocale").radiobutton("check").trigger("change");
                            }
                            else
                            {
                                jQuery("#styleBuilderScientificUseSpecificLocale").radiobutton("check").trigger("change");
                            }
                            var decimalPlaces = (pattern.length > 1) ? pattern.charAt(1) : "";
                            this.scientificDecimalPlacesVal.val(decimalPlaces);
                            break;
                        case "Special":

                            if (!this.cultureName || this.cultureName === "")
                            {
                                var formatObject = SCCultureHelper.current.getFormatObject(formatNode.xml);
                                var formatOptions =
                                    {
                                        formatObject: formatObject,
                                    };

                                pattern = SCCultureHelper.current.getFormatPatternByName(formatOptions);
                                jQuery("#styleBuilderSpecialUseUserLocale").radiobutton("check").trigger("change");
                                this.findAndSelectItemInGrid(this.specialFormattinVal, pattern);
                            }
                            else
                            {
                                jQuery("#styleBuilderSpecialUseSpecificLocale").radiobutton("check").trigger("change");
                                this.findAndSelectItemInGrid(this.specialFormattinVal, pattern);
                            }

                            break;
                        case "Duration":
                            if (!this.cultureName || this.cultureName === "")
                            {
                                jQuery("#styleBuilderDurationUseUserLocale").radiobutton("check").trigger("change");
                            }
                            else
                            {
                                jQuery("#styleBuilderDurationUseSpecificLocale").radiobutton("check").trigger("change");
                            }
                            this.findAndSelectItemInGrid(this.durationConvertVal, pattern.split(':')[1])
                            this.findAndSelectItemInGrid(this.durationFormatVal, pattern.split(':')[0]);
                            break;
                        case "Custom":
                        default:
                            if (!this.cultureName || this.cultureName === "")
                            {
                                jQuery("#styleBuilderCustomUseUserLocale").radiobutton("check").trigger("change");
                            }
                            else
                            {
                                jQuery("#styleBuilderCustomUseSpecificLocale").radiobutton("check").trigger("change");
                            }
                            this.findAndSelectItemInGrid(formatGrid, "Custom");
                            var customGrid = jQuery("#styleBuilderCustomGrid");
                            this.findAndSelectItemInGrid(customGrid, pattern);
                            this.customTextBoxVal.val(pattern);
                            break;
                    }
                    this.findAndSelectItemInGrid(formatGrid, type);
                    this.refreshFormatPreview();
                }
            },
            findAndSelectItemInGrid: function (grid, itemValue)
            {
                var rowObjects = grid.grid("fetch", "rows", "objects");
                var foundIndex = -1;
                for (var i = 0; i < rowObjects.length && foundIndex < 0; i++)
                {
                    if (rowObjects[i][0].value === itemValue)
                    {
                        foundIndex = i;
                    }
                }
                if (foundIndex >= 0)
                    grid.grid("select", [foundIndex]);
            },
            //		deselectAllItemsInGrid: function (grid)
            //		{
            //			grid.grid("deselect", null);
            //		},
            //		findAndDeselectItemInGrid: function (grid, itemValue)
            //		{
            //			grid.grid("deselect", itemValue);
            //		},


            loadTextboxValues: function ()
            {
                this.numberDecimalPlacesVal = jQuery(document.getElementById("styleBuilderDecimalPlaces"));
                this.currencyDecimalPlacesVal = jQuery(document.getElementById("styleBuilderCurrencyDecimalPlaces"));
                this.currencySymbolVal = jQuery(document.getElementById("styleBuilderCurrencySymbol"));
                this.percentageDecimalPlacesVal = jQuery(document.getElementById("styleBuilderPercentage"));
                this.scientificDecimalPlacesVal = jQuery(document.getElementById("styleBuilderScientific"));
                this.customTextBoxVal = jQuery(document.getElementById("styleBuilderCustomTextBox"));
                this.negativeNumbersVal = jQuery(document.getElementById("styleBuilderNegativeNumbers"));
                this.currencyNegativeNumbersVal = jQuery(document.getElementById("styleBuilderCurrencyNegativeNumbers"));
                this.specialFormattinVal = jQuery(document.getElementById("styleBuilderSpecialGrid"));
                this.durationFormatVal = jQuery(document.getElementById("styleBuilderDurationFormatGrid"));
                this.durationConvertVal = jQuery(document.getElementById("styleBuilderDurationConvertFromGrid"));
                this.dateTypeVal = jQuery(document.getElementById("styleBuilderDateType"));
            },

            addAllEventsToControls: function ()
            {
                //tab box events attachment

                var tabBox = jQuery("#StyleBuilderTabBox").ServerTabBox();
                this.lastTabWasFormat = true;
                tabBox.on("tabselected", function (e)
                {
                    if (e.detail.newTab[0].id === "FormatTab")
                    {
                        jQuery("#OtherTabs_Content").css("display", "none");
                        jQuery("#StyleBuilderFormatContainer").panecontainer("destroy");
                        jQuery("#StyleBuilderFormatContainer").panecontainer();
                        jQuery("#StyleBuilderFormatContentPaneContainer").panecontainer("destroy");
                        jQuery("#StyleBuilderFormatContentPaneContainer").panecontainer();
                        this.lastTabWasFormat = true;
                    }
                    else
                    {
                        jQuery("#OtherTabs_Content").css("display", "");

                        var otherTabsStyleContainerElem = jQuery("#StyleBuildeOtherTabsStyleContainer");

                        if (otherTabsStyleContainerElem.isWidget("panecontainer"))
                        {
                            otherTabsStyleContainerElem.panecontainer("destroy");
                        }

                        otherTabsStyleContainerElem.panecontainer();

                        this.resizePreviewContent();
                        if (this.lastTabWasFormat)
                        {
                            this.updateStylesPreview();
                            this.lastTabWasFormat = false;
                        }
                    }
                }.bind(this));


                this.styleBuilderDialog.find("div.panel").panel();
                this.styleBuilderDialog.find("input[type=text].input-control").textbox();
                this.styleBuilderDialog.find("ul.radio").radiobuttongroup();
                this.styleBuilderDialog.find("input.input-control[type=radio]").radiobutton();

                //Toolbars
                this.styleBuilderDialog.find(".toolbars").each(function ()
                {
                    jQuery(this).toolbargroup();
                });

                var startOptions =
                    [
                        {
                            display: "",
                            value: "unchanged"
                        },
                        {
                            display: jQuery("#dropDownNone").val(),
                            value: "0px"
                        }
                    ];
                var endOptions = null;
                //Get the options html
                var optionsHtml = this.generatePixelOptions(startOptions, endOptions);
                //Populate each pixel dropdown with the correct options and create the dropdowns for them
                this.styleBuilderDialog.find(".style-builder-pixel-select").each(function ()
                {
                    jQuery(this).html(optionsHtml);
                });

                jQuery("#styleBuilderFontFamily").html(jQuery("#styleBuilderFontFamilyOptions").val());
                jQuery("#styleBuilderFontFamily").dynamicstyledropdown();

                //Format tab
                if (!jQuery("#FormatTab").is(".disabled"))
                {
                    jQuery("#StyleBuilderFormatContainer").panecontainer();
                    jQuery("#StyleBuilderFormatContentPaneContainer").panecontainer();

                    jQuery("#styleBuilderUseSeparator").checkbox().on("click", this.refreshFormatPreview.bind(this));

                    this.populateLocaleDropDowns();
                    jQuery("#styleBuilderNumberUseSpecificLocale,#styleBuilderCurrencyUseSpecificLocale,#styleBuilderDateUseSpecificLocale, #styleBuilderPercentageUseSpecificLocale, #styleBuilderScientificUseSpecificLocale,#styleBuilderCustomUseSpecificLocale,#styleBuilderNumberUseUserLocale,#styleBuilderCurrencyUseUserLocale,#styleBuilderDateUseUserLocale, #styleBuilderPercentageUseUserLocale, #styleBuilderScientificUseUserLocale,#styleBuilderCustomUseUserLocale,#styleBuilderSpecialUseUserLocale,#styleBuilderSpecialUseSpecificLocale,#styleBuilderDurationUseUserLocale,#styleBuilderDurationUseSpecificLocale")
                        .on("change", this.useSpecificLocaleChange.bind(this));

                    jQuery("#styleBuilderCurrencyUseSpecificLocale").on("change", this.useSpecificLocaleChange.bind(this));

                    this.populateFormatGrid();
                    this.populateNegativeNumbersGrid();
                    this.populateCurrencyGrid();
                    this.populateCustomGrid();
                    this.populateSpecialGrid();
                    this.populateDateTypes();
                    this.populateDurationGrid();
                    this.customTextBoxVal.on("change", this.refreshFormatPreview.bind(this));
                    this.currencySymbolVal.on("change", this.refreshFormatPreview.bind(this));
                    this.currencyDecimalPlacesVal.on("change", this.refreshFormatPreview.bind(this));
                    this.percentageDecimalPlacesVal.on("change", this.refreshFormatPreview.bind(this));
                    this.scientificDecimalPlacesVal.on("change", this.refreshFormatPreview.bind(this));
                    this.numberDecimalPlacesVal.on("change", this.refreshFormatPreview.bind(this));
                }
                if (!jQuery("#FontTab").is(".disabled"))
                    this.addStyleBuilderFontEvents();
                if (!jQuery("#MarginTab").is(".disabled"))
                    this.addStyleBuilderMarginEvents();
                if (!jQuery("#PaddingTab").is(".disabled"))
                    this.addStyleBuilderPaddingEvents();

                if (!jQuery("#BackgroundTab").is(".disabled"))
                {
                    this.backgroundTabControls = this.addStyleBuilderBackgroundEvents();
                }
                else
                {
                    this.backgroundTabControls = null;
                }

                if (!jQuery("#BorderTab").is(".disabled"))
                {
                    this.addStyleBuilderBorderEvents();
                    var startOptionsBorder =
                        [
                            {
                                display: "0px",
                                value: "0px"
                            }
                        ];
                    jQuery("#BorderWidthSelect").html(this.generatePixelOptions(startOptionsBorder, null, 1));
                    jQuery("#BorderStyleSelect").customdropdown();
                }

                //Drop Down widgets  
                var query = this.styleBuilderDialog.find(".style-builder-select:not(.style-builder-select-format-locale)");

                query.each(function ()
                {
                    jQuery(this).dropdown({ disableHideScrollable: true });
                });

            },
            hideGridHeading: function (grid)
            {
                grid.find(".grid-column-headers").css("display", "none");
                grid.find(".grid-body-content").css("top", "0px");
            },
            populateLocaleDropDowns: function ()
            {
                var nodes = SCCultureHelper.current.cultureXml.selectNodes("Cultures/Culture");

                var options = [];
                for (var i = 0; i < nodes.length; i++)
                {
                    var optionValue = nodes[i].selectSingleNode("Name").text;
                    var optionDisplay = nodes[i].selectSingleNode("DisplayName").text;
                    var selected = (optionValue === this.currentCulture);
                    var option =
                        {
                            index: i,
                            text: optionDisplay,
                            value: optionValue,
                            className: "",
                            selected: selected,
                            disabled: ""
                        };
                    options[i] = option;
                }

                var styleBuilder = this;
                this.styleBuilderDialog.find(".style-builder-select-format-locale").each(function ()
                {

                    var jqThis = jQuery(this);
                    jQuery(this).dropdown({ disableHideScrollable: true, items: options });

                    jQuery(this).on("change", styleBuilder.localeDropDownChanged.bind(styleBuilder));
                });

                //disable hack
                jQuery("#styleBuilderDateLocale").dropdown("disable");

            },
            useSpecificLocaleChange: function (event)
            {
                var thisCheckBox = jQuery(event.target);
                if (thisCheckBox[0].checked)
                {
                    if (thisCheckBox.val() === "Specific")
                    {
                        var name = (checkExistsNotEmpty(this.cultureName)) ? this.cultureName : this.currentCulture;

                        var thisDropDown = thisCheckBox.closest("ul.radio").find(".style-builder-select-format-locale");
                        thisDropDown.dropdown("enable");
                        var selectedValue = thisDropDown.dropdown("SelectedValue");
                        if (selectedValue !== name)
                        {
                            thisDropDown.dropdown("select", name);
                        }
                        else
                        {
                            //ensure the culture is loaded
                            SCCultureHelper.current.getCultureObject(name, this.cultureObjectRetrieved.bind(this));
                        }
                    }
                    else
                    {
                        var name = this.currentCulture;
                        var thisDropDown = thisCheckBox.closest("ul.radio").find(".style-builder-select-format-locale");
                        thisDropDown.dropdown("disable");
                        var selectedValue = thisDropDown.dropdown("SelectedValue");
                        if (selectedValue !== name)
                        {
                            thisDropDown.dropdown("select", name);
                        }
                        else
                        {
                            //ensure the culture is loaded
                            SCCultureHelper.current.getCultureObject(this.currentCulture, this.cultureObjectRetrieved.bind(this));
                        }
                    }
                }
            },

            //localeDropDownChanged 1
            localeDropDownChanged: function (event)
            {
                if (!this.localeChangedLock)
                {
                    this.localeChangedLock = true;
                    var thisDropDown = jQuery(event.target);
                    var id = thisDropDown.attr("id");
                    var cultureName = thisDropDown.dropdown("SelectedValue");
                    this.styleBuilderDialog.find(".style-builder-select-format-locale:not(#{0})".format(id)).dropdown("select", cultureName);
                    this.styleBuilderDialog.showBusyModal(true);
                    SCCultureHelper.current.getCultureObject(cultureName, this.cultureObjectRetrieved.bind(this));
                }
            },

            //localeDropDownChanged 2
            cultureObjectRetrieved: function (cultureObject)
            {
                var cultureChanged = (this.cultureObject !== undefined && this.cultureObject.Name !== cultureObject.Name && this.cultureObject !== cultureObject.Name);
                this.cultureObject = cultureObject;
                var co = this.cultureObject;
                if (cultureChanged)
                {
                    this.populateSpecialGrid();
                }

                //Number
                if (jQuery("#styleBuilderNumberUseSpecificLocale")[0].checked)
                {
                    this.numberDecimalPlacesVal.val(co.NumberDetails.DecimalDigits);
                }
                else
                {
                    this.numberDecimalPlacesVal.val("");
                    this.numberDecimalPlacesVal.textbox("showWatermark");
                }

                //Currency
                if (jQuery("#styleBuilderCurrencyUseSpecificLocale")[0].checked)
                {
                    this.currencyDecimalPlacesVal.val(co.CurrencyDetails.DecimalDigits);
                }
                else
                {
                    this.currencyDecimalPlacesVal.val("");
                    this.currencyDecimalPlacesVal.textbox("showWatermark");
                }

                if (jQuery("#styleBuilderCurrencyUseSpecificLocale")[0].checked)
                {
                    this.currencySymbolVal.val(co.CurrencySymbol);
                }
                else
                {
                    this.currencySymbolVal.val("");
                    this.currencySymbolVal.textbox("showWatermark");
                }

                //Date time

                //Percentage
                if (jQuery("#styleBuilderPercentageUseSpecificLocale")[0].checked)
                {
                    this.percentageDecimalPlacesVal.val(co.PercentDetails.DecimalDigits);
                }
                else
                {
                    this.percentageDecimalPlacesVal.val("");
                    this.percentageDecimalPlacesVal.textbox("showWatermark");
                }

                //Scientific
                if (jQuery("#styleBuilderScientificUseSpecificLocale")[0].checked)
                {
                    this.scientificDecimalPlacesVal.val(co.NumberDetails.DecimalDigits);
                }
                else
                {
                    this.scientificDecimalPlacesVal.val("");
                    this.scientificDecimalPlacesVal.textbox("showWatermark");
                }

                //Custom

                this.localeChangedLock = false;
                this.refreshFormatPreview();
            },

            //localeDropDownChanged 3
            //also rebuilds the format xml
            refreshFormatPreview: function ()
            {
                if (!this.localeChangedLock)
                {
                    var co = this.cultureObject;

                    var selectedRow = null;
                    var styleBuilderFormatListGridElem = jQuery("#StyleBuilderFormatListGrid");

                    if (styleBuilderFormatListGridElem.isWidget("grid"))
                    {
                        selectedRow = styleBuilderFormatListGridElem.grid("fetch", "selected-rows", "objects");
                    }

                    if (checkExists(selectedRow) && (selectedRow.length > 0) && checkExists(selectedRow[0]) && (selectedRow[0].length > 0) && checkExists(selectedRow[0][0]))
                    {
                        var type = selectedRow[0][0].value;
                        var pattern = "";
                        var patternName = "";
                        var result = "";
                        co.OverrideNegativePattern = null;
                        co.OverrideCurrencySymbol = null;
                        switch (type)
                        {
                            case "Number":
                                pattern = (jQuery("#styleBuilderUseSeparator")[0].checked) ? "N" : "F";
                                pattern += this.numberDecimalPlacesVal.val();
                                if (this.numberDecimalPlacesVal.val() !== "")
                                {
                                    this.numberDecimalPlacesVal.textbox("hideWatermark");
                                }
                                else
                                {
                                    if (jQuery("#styleBuilderNumberUseSpecificLocale")[0].checked)
                                    {
                                        this.numberDecimalPlacesVal.textbox("setWatermark", Resources.CommonLabels.UseCultureWatermark);
                                        this.numberDecimalPlacesVal.textbox("showWatermark");
                                    }
                                    else
                                    {
                                        this.numberDecimalPlacesVal.textbox("setWatermark", Resources.CommonLabels.UserSettingsWatermark);
                                        this.numberDecimalPlacesVal.textbox("showWatermark");
                                    }
                                }
                                var numberSelectedRow = this.negativeNumbersVal.grid("fetch", "selected-rows", "objects");
                                if (checkExists(numberSelectedRow) && (numberSelectedRow.length > 0) && checkExists(numberSelectedRow[0]) && (numberSelectedRow[0].length > 0) && checkExists(numberSelectedRow[0][0]))
                                {
                                    co.OverrideNegativePattern = numberSelectedRow[0][0].value;
                                }
                                break;
                            case "Currency":
                                var findDigits = /\d/g;
                                if (findDigits.test(this.currencySymbolVal.val()))
                                {
                                    popupManager.showWarning(Resources.ViewDesigner.CurrencySymbolValidation);
                                    this.currencySymbolVal.val(co.CurrencySymbol);
                                }
                                pattern = "C";
                                co.OverrideCurrencySymbol = this.currencySymbolVal.val();
                                if (this.currencySymbolVal.val() !== "")
                                {
                                    this.currencySymbolVal.textbox("hideWatermark");
                                }
                                else
                                {
                                    if (jQuery("#styleBuilderCurrencyUseSpecificLocale")[0].checked)
                                    {
                                        this.currencySymbolVal.textbox("setWatermark", Resources.CommonLabels.UseCultureWatermark);
                                        this.currencySymbolVal.textbox("showWatermark");
                                    }
                                    else
                                    {
                                        this.currencySymbolVal.textbox("setWatermark", Resources.CommonLabels.UserSettingsWatermark);
                                        this.currencySymbolVal.textbox("showWatermark");
                                    }
                                }
                                pattern += this.currencyDecimalPlacesVal.val();
                                if (this.currencyDecimalPlacesVal.val() !== "")
                                {
                                    this.currencyDecimalPlacesVal.textbox("hideWatermark");
                                }
                                else
                                {
                                    if (jQuery("#styleBuilderCurrencyUseSpecificLocale")[0].checked)
                                    {
                                        this.currencyDecimalPlacesVal.textbox("setWatermark", Resources.CommonLabels.UseCultureWatermark);
                                        this.currencyDecimalPlacesVal.textbox("showWatermark");
                                    }
                                    else
                                    {
                                        this.currencyDecimalPlacesVal.textbox("setWatermark", Resources.CommonLabels.UserSettingsWatermark);
                                        this.currencyDecimalPlacesVal.textbox("showWatermark");
                                    }
                                }
                                var currencySelectedRow = this.currencyNegativeNumbersVal.grid("fetch", "selected-rows", "objects");
                                if (checkExists(currencySelectedRow) && (currencySelectedRow.length > 0) && checkExists(currencySelectedRow[0]) && (currencySelectedRow[0].length > 0) && checkExists(currencySelectedRow[0][0]))
                                {
                                    co.OverrideNegativePattern = currencySelectedRow[0][0].value;
                                }
                                break;
                            case "Percentage":
                                pattern = "P";
                                pattern += this.percentageDecimalPlacesVal.val();
                                if (this.percentageDecimalPlacesVal.val() !== "")
                                {
                                    this.percentageDecimalPlacesVal.textbox("hideWatermark");
                                }
                                else
                                {
                                    if (jQuery("#styleBuilderPercentageUseSpecificLocale")[0].checked)
                                    {
                                        this.percentageDecimalPlacesVal.textbox("setWatermark", Resources.CommonLabels.UseCultureWatermark);
                                        this.percentageDecimalPlacesVal.textbox("showWatermark");
                                    }
                                    else
                                    {
                                        this.percentageDecimalPlacesVal.textbox("setWatermark", Resources.CommonLabels.UserSettingsWatermark);
                                        this.percentageDecimalPlacesVal.textbox("showWatermark");
                                    }
                                }
                                break;
                            case "Scientific":
                                pattern = "E";
                                pattern += this.scientificDecimalPlacesVal.val();
                                if (this.scientificDecimalPlacesVal.val() !== "")
                                {
                                    this.scientificDecimalPlacesVal.textbox("hideWatermark");
                                }
                                else
                                {
                                    if (jQuery("#styleBuilderScientificUseSpecificLocale")[0].checked)
                                    {
                                        this.scientificDecimalPlacesVal.textbox("setWatermark", Resources.CommonLabels.UseCultureWatermark);
                                        this.scientificDecimalPlacesVal.textbox("showWatermark");
                                    }
                                    else
                                    {
                                        this.scientificDecimalPlacesVal.textbox("setWatermark", Resources.CommonLabels.UserSettingsWatermark);
                                        this.scientificDecimalPlacesVal.textbox("showWatermark");
                                    }
                                }
                                break;
                            case "Date":
                                pattern = this.dateTypeVal.val();
                                break;
                            case "Special":
                                var specialSelectedRow = this.specialFormattinVal.grid("fetch", "selected-rows", "objects");

                                if (specialSelectedRow[0] !== undefined && specialSelectedRow[0][0] !== undefined)
                                {
                                    pattern = specialSelectedRow[0][0].value;
                                    patternName = specialSelectedRow[0][0].control;
                                }
                                else if (this.specialFormattinVal.find("tr").length > 0)
                                {
                                    this.specialFormattinVal.find("tr").first().trigger("click");
                                    specialSelectedRow = this.specialFormattinVal.grid("fetch", "selected-rows", "objects");
                                    pattern = specialSelectedRow[0][0].value;
                                    patternName = specialSelectedRow[0][0].control;
                                }

                                if (pattern === "")
                                {
                                    type = "None";
                                }

                                break;
                            case "Custom":
                                pattern = this.customTextBoxVal.val();
                                if (this.customTextBoxVal.val() !== "")
                                {
                                    this.customTextBoxVal.textbox("hideWatermark");
                                }
                                else
                                {
                                    if (jQuery("#styleBuilderCustomUseSpecificLocale")[0].checked)
                                    {
                                        this.customTextBoxVal.textbox("setWatermark", Resources.CommonLabels.UseCultureWatermark);
                                        this.customTextBoxVal.textbox("showWatermark");
                                    }
                                    else
                                    {
                                        this.customTextBoxVal.textbox("setWatermark", Resources.CommonLabels.UserSettingsWatermark);
                                        this.customTextBoxVal.textbox("showWatermark");
                                    }
                                }
                                break;
                            case "Duration":
                                var selectedDurationFormatRow = this.durationFormatVal.grid("fetch", "selected-rows", "objects");
                                var selectedDurationConvertRow = this.durationConvertVal.grid("fetch", "selected-rows", "objects");
                                var format = "";
                                var convert = "";

                                if (!checkExists(selectedDurationFormatRow[0]) || !checkExists(selectedDurationFormatRow[0][0]))
                                {
                                    selectedDurationFormatRow = this.durationFormatVal.grid("fetch", "first-row", "objects");
                                }
                                format = selectedDurationFormatRow[0][0].value;

                                if (!checkExists(selectedDurationConvertRow[0]) || !checkExists(selectedDurationConvertRow[0][0]))
                                {
                                    selectedDurationConvertRow = this.durationConvertVal.grid("fetch", "first-row", "objects");
                                }
                                convert = selectedDurationConvertRow[0][0].value;

                                if (format === "" || convert === "")
                                {
                                    type = "None";
                                }
                                else
                                {
                                    pattern = format + ":" + convert;
                                }
                                break;
                        }

                        var value = this.viewControl.controlText;
                        if (!checkExistsNotEmpty(value))
                            value = SCCultureHelper.current.getSampleValue(type, pattern, patternName);


                        this.buildFormatXml(co, type, pattern, patternName);
                        var formatOptions =
                            {
                                formatObject:
                                    {
                                        cultureObject: co,
                                        pattern: pattern,
                                        type: type
                                    },
                                value: value
                            };
                        result = SCCultureHelper.current.applyFormatToString(formatOptions);
                        if (result.contains("[Red]"))
                        {
                            result = result.replace(/\[Red\]/, "");
                            result = "<div style='color:red;'>{0}</div>".format(result);
                        }
                        jQuery("#styleBuilderFormatPreview").html(result);
                    }
                }
            },
            populateDateTypes: function ()
            {
                var co = this.cultureObject;
                var optionHtml = "";
                for (var i = 0; i < co.DateTimePatterns.length; i++)
                {
                    optionHtml += "<option value=\"{0}\" {2} >{1}</option>".format(co.DateTimePatterns[i].Symbol, co.DateTimePatterns[i].DisplayName, "");
                }
                this.dateTypeVal.append(optionHtml);
                this.dateTypeVal.dropdown({ disableHideScrollable: true });
                this.dateTypeVal.dropdown("refresh");
                this.dateTypeVal.on("change", this.refreshFormatPreview.bind(this));

            },
            populateNegativeNumbersGrid: function ()
            {
                var gridOptions =
                    {
                        zebraStripes: false,
                        rowselect: this.refreshFormatPreview.bind(this)
                    };
                this.negativeNumbersVal = jQuery("#styleBuilderNegativeNumbers");
                var grid = this.negativeNumbersVal.grid(gridOptions);

                grid.grid("add", "row", [{ html: "User settings", value: "" }]);
                grid.grid("add", "row", [{ html: "-1234.10", value: "-n" }]);
                grid.grid("add", "row", [{ html: "(1234.10)", value: "(n)" }]);
                grid.grid("add", "row", [{ html: "<div style='color:red;'>1234.10</div>", value: "[Red]n" }]);
                grid.grid("add", "row", [{ html: "<div style='color:red;'>(1234.10)</div>", value: "[Red](n)" }]);
                this.hideGridHeading(grid);
            },
            populateCurrencyGrid: function ()
            {
                var gridOptions =
                    {
                        zebraStripes: false,
                        rowselect: this.refreshFormatPreview.bind(this)
                    };
                var grid = this.currencyNegativeNumbersVal.grid(gridOptions);
                this.cultureObject.CurrencySymbol;
                grid.grid("add", "row", [{ html: "User settings", value: "" }]);
                grid.grid("add", "row", [{ html: "-1234.10", value: "-$n" }]);
                grid.grid("add", "row", [{ html: "(1234.10)", value: "($n)" }]);
                grid.grid("add", "row", [{ html: "<div style='color:red;'>1234.10</div>", value: "[Red]$n" }]);
                grid.grid("add", "row", [{ html: "<div style='color:red;'>(1234.10)</div>", value: "[Red]($n)" }]);
                this.hideGridHeading(grid);
            },
            populateCustomGrid: function ()
            {
                var gridOptions =
                    {
                        zebraStripes: false,
                        rowselect: this.customGridUpdateRelatedTextBox.bind(this)
                    };
                var grid = jQuery("#styleBuilderCustomGrid").grid(gridOptions);

                grid.grid("add", "row", [{ html: "0", value: "0" }]);
                grid.grid("add", "row", [{ html: "0.00", value: "0.00" }]);
                grid.grid("add", "row", [{ html: "#", value: "#" }]);
                grid.grid("add", "row", [{ html: "#.##", value: "#.##" }]);
                grid.grid("add", "row", [{ html: "###,###.00", value: "###,###.00" }]);
                grid.grid("add", "row", [{ html: "###,###;(###,###)", value: "###,###;(###,###)" }]);
                //grid.grid("add", "row", [{ html: "###,###;[Red](###,###)", value: "###,###;[Red](###,###)"}]);
                grid.grid("add", "row", [{ html: "###,###.00;(###,###.00)", value: "###,###.00;(###,###.00)" }]);
                //grid.grid("add", "row", [{ html: "###,###.00;[Red](###,###.00)", value: "###,###.00;[Red](###,###.00)"}]);
                grid.grid("add", "row", [{ html: "#%", value: "#%" }]);
                grid.grid("add", "row", [{ html: "yyyy/MM/dd", value: "yyyy/MM/dd" }]);
                grid.grid("add", "row", [{ html: "dd, DDDD MMM YYYY", value: "dd, DDDD MMM YYYY" }]);
                grid.grid("add", "row", [{ html: "hh:mm:ss tt", value: "hh:mm:ss tt" }]);
                this.hideGridHeading(grid);
            },
            populateDurationGrid: function ()
            {
                var gridOptions =
                    {
                        zebraStripes: false,
                        rowselect: this.refreshFormatPreview.bind(this)
                    };
                var convertFromGrid = jQuery("#styleBuilderDurationConvertFromGrid").grid(gridOptions);

                convertFromGrid.grid("add", "row", [{ html: Resources.RuntimeMessages.LongResolutionIdentifier_millisecond, value: "Milliseconds" }]);
                convertFromGrid.grid("add", "row", [{ html: Resources.RuntimeMessages.LongResolutionIdentifier_second, value: "Seconds" }]);
                convertFromGrid.grid("add", "row", [{ html: Resources.RuntimeMessages.LongResolutionIdentifier_minute, value: "Minutes" }]);
                convertFromGrid.grid("add", "row", [{ html: Resources.RuntimeMessages.LongResolutionIdentifier_hour, value: "Hours" }]);
                this.hideGridHeading(convertFromGrid);

                var formatGrid = jQuery("#styleBuilderDurationFormatGrid").grid(gridOptions);

                formatGrid.grid("add", "row", [{ html: Resources.CommonLabels.DurationTimeSpan, value: "TimeSpan" }]);
                formatGrid.grid("add", "row", [{ html: Resources.CommonLabels.DurationFriendlyShort, value: "FriendlyShortUnits" }]);
                formatGrid.grid("add", "row", [{ html: Resources.CommonLabels.DurationFriendlyMedium, value: "FriendlyMediumUnits" }]);
                formatGrid.grid("add", "row", [{ html: Resources.CommonLabels.DurationFriendlyLong, value: "FriendlyLongUnits" }]);
                this.hideGridHeading(formatGrid);
            },
            populateSpecialGrid: function ()
            {
                var co = this.cultureObject;

                var gridOptions =
                    {
                        zebraStripes: false,
                        rowselect: this.refreshFormatPreview.bind(this)
                    };
                var gridRows = $("#styleBuilderSpecialGrid tr");
                gridRows.remove();
                var grid = this.specialFormattinVal.grid(gridOptions);
                for (var i = 0; i < co.SpecialDetails.Patterns.length; i++)
                {
                    grid.grid("add", "row", [{ html: co.SpecialDetails.Patterns[i].Display, value: co.SpecialDetails.Patterns[i].Value, control: co.SpecialDetails.Patterns[i].Name }]);
                }
            },
            populateFormatGrid: function ()
            {
                var gridOptions =
                    {
                        zebraStripes: false,
                        rowselect: this.selectItemFromListAsTab.bind(this)
                    };
                var grid = jQuery("#StyleBuilderFormatListGrid").grid(gridOptions);

                grid.grid("add", "row", [{ html: "(None)", value: "None" }]);
                grid.grid("add", "row", [{ html: "Number", value: "Number" }]);
                grid.grid("add", "row", [{ html: "Currency", value: "Currency" }]);
                grid.grid("add", "row", [{ html: "Date and Time", value: "Date" }]);
                grid.grid("add", "row", [{ html: "Duration", value: "Duration" }]);
                grid.grid("add", "row", [{ html: "Percentage", value: "Percentage" }]);
                grid.grid("add", "row", [{ html: "Scientific", value: "Scientific" }]);
                grid.grid("add", "row", [{ html: "Custom", value: "Custom" }]);
                grid.grid("add", "row", [{ html: "Special", value: "Special" }]);
                //grid.grid("syncWidths");
            },
            addStyleBuilderBorderEvents: function ()
            {
                //#region
                var bordersDiv = jQuery("#BordersTab_Content");
                var toolbarbuttons = bordersDiv.find(".toolbar-button:not(.disabled)");
                var selectControls = bordersDiv.find("select");

                toolbarbuttons.on("click", function ()
                {
                    var o = {};
                    o.BaseNode = "Border";
                    o.Style = $(selectControls[0]).val();
                    o.Color = "#" + jQuery("#BorderColor").val();
                    o.Width = $(selectControls[1]).val();
                    o.RemoveSides = false;

                    //find the button pressed
                    var jq_this = jQuery(arguments[0].target).closest("a");

                    if (jq_this.hasClass("outside-borders")) //All borders button
                    {
                        //Set button style
                        toolbarbuttons.filter(":not(.no-borders)").addClass("selected");

                        //Add the default side
                        o.Sides = ["Default"];
                        this.setControlStyleXml(o);

                        //Remove the other sides
                        o.Sides = ["Top", "Bottom", "Right", "Left"];
                        o.RemoveSides = true;
                        this.setControlStyleXml(o);
                    }
                    else if (jq_this.hasClass("no-borders")) //No borders button
                    {
                        //Set button style
                        toolbarbuttons.removeClass("selected");

                        //Remove all sides
                        o.Sides = ["Default", "Top", "Bottom", "Right", "Left"];
                        o.RemoveSides = true;
                        this.setControlStyleXml(o);
                    }
                    else
                    {
                        //find the default border node if it exists split it into sides
                        var defaultStyle = this.customStyleNode.selectSingleNode("Border/Default");
                        if (defaultStyle)
                        {
                            //extract values from the default node
                            var o2 = {};
                            o2.BaseNode = "Border";
                            o2.Style = defaultStyle.selectSingleNode("Style").text;
                            o2.Color = defaultStyle.selectSingleNode("Color").text;
                            o2.Width = defaultStyle.selectSingleNode("Width").text;
                            //check its not the default override values
                            if (o2.Width !== this.Defaults.Border.Width && o2.Color !== this.Defaults.Border.Color && o2.Style !== this.Defaults.Border.Style)
                            {
                                //Remove the default node
                                o2.RemoveSides = true;
                                o2.Sides = ["Default"];
                                this.setControlStyleXml(o2);

                                //Add each side if it doesn't exist or doesn't have the same values as the defualt node
                                o2.RemoveSides = false;
                                var sides = ["Top", "Bottom", "Right", "Left"];
                                for (var i = 0; i < sides.length; i++)
                                {
                                    o2.Sides = [sides[i]];
                                    if (!this._checkStyleXml(o2))
                                    {
                                        this.setControlStyleXml(o2);
                                    }
                                }
                            }
                        }

                        //Now do the specific side logic
                        //find the side name
                        o.Sides = [jq_this.attr("id").replace("Border", "")];

                        if (jq_this.hasClass("selected")) //the button was previously selected
                        {
                            //set the button style

                            if (this._checkStyleXml(o))
                            {
                                o.RemoveSides = true;
                                jq_this.removeClass("selected");
                            }
                        }
                        else
                        {
                            //set the button style
                            jq_this.addClass("selected");
                        }

                        //Remove or add the side
                        this.setControlStyleXml(o);

                        //select or unselect the all sides button
                        var toolbarSidebuttons = toolbarbuttons.filter(".selected:not(.outside-borders)");
                        if (toolbarSidebuttons.length === 4)
                            toolbarbuttons.filter(".outside-borders").addClass("selected");
                        else
                            toolbarbuttons.filter(".outside-borders").removeClass("selected");

                    }

                    jq_this.trigger("blur");
                }.bind(this));
                var borderColorPicker = jQuery("#BorderColor").jPicker(
                    {
                        window:
                            {
                                expandable: true
                            }
                    });

                //#endregion
            },
            addStyleBuilderMarginEvents: function ()
            {
                //#region
                jQuery("#MarginTab_Content").find("select").on("change", function ()
                {
                    var jq_this = jQuery(arguments[0].target);
                    var o = {};
                    o.BaseNode = "Margin";
                    o.Side = jq_this.attr("relativeValue");
                    o.Width = jq_this.val();
                    this.setControlStyleXml(o);
                }.bind(this));
                //#endregion
            },
            addStyleBuilderPaddingEvents: function ()
            {
                //#region
                jQuery("#PaddingTab_Content").find("select").on("change", function ()
                {
                    var jq_this = jQuery(arguments[0].target);
                    var o = {};
                    o.BaseNode = "Padding";
                    o.Side = jq_this.attr("relativeValue");
                    o.Width = jq_this.val();
                    this.setControlStyleXml(o);
                }.bind(this));
                //#endregion
            },
            addStyleBuilderBackgroundEvents: function ()
            {
                var _this = this;

                var o = {};
                o.backgroundColorPicker = jQuery("#styleBuilderBackgroundColorPickerInput").jPicker({ window: { expandable: true } });
                o.backgroundImageNameLookup = $("#StyleBuilderBackgroundgroundImageFormField .lookup-box");
                o.repeatHorizontallyCheckbox = $("#BackgroundImageRepeatHorizontallyCheckbox").checkbox();
                o.repeatVerticallyCheckbox = $("#BackgroundImageRepeatVerticallyCheckbox").checkbox();
                o.imageSizeDropDown = $("#BackgroundImageSizeSelect").dropdown();
                o.positionWidget = $("#BackgroundImagePositionWidget").imagePositionWidget();
                o.imageShadowCheckbox = $("#BackgroundImageShadowCheckbox").checkbox();
                o.imageRoundedCornerDropDown = $("#BackgroundImageRoundedCornerSelect").dropdown();

                //#region background color
                o.backgroundColorPicker.on("change", function ()
                {
                    var jq_This = jQuery(arguments[0].target);
                    var color = jq_This.val();

                    var cssActionArray = [];
                    cssActionArray[0] = "BackgroundColor";
                    cssActionArray[1] = "#" + color;
                    cssActionArray[2] = this.Defaults.BackgroundColor;

                    this.setControlStyleXml(cssActionArray);
                }.bind(this));
                //#endregion

                //#region background image url
                var lookupBox = o.backgroundImageNameLookup;
                lookupBox.removeClass("read-only");
                lookupBox.find("#StyleBuilderBackgroundImageName").on('keydown', function (ev)
                {
                    var _which = ev.which;
                    var _keyCode = $.ui.keyCode;

                    switch (_which)
                    {
                        case _keyCode.BACKSPACE:
                        case _keyCode.DELETE:
                            var imageNameTextInput = $("#StyleBuilderBackgroundImageName");
                            if (imageNameTextInput.val() !== Resources.CommonLabels.NoneLabelText)
                            {
                                //Reset inputs to original selections for image properties
                                //Inputs should be set before the BackgroundImage node is remove (in case change/click event updates the BackgroundImage node)
                                o.repeatHorizontallyCheckbox.checkbox("uncheck");
                                o.repeatVerticallyCheckbox.checkbox("uncheck");
                                o.imageSizeDropDown.dropdown("SelectedValue", "normal");
                                o.positionWidget.imagePositionWidget("selectedValue", "top-center");

                                SCStyleBuilder._removeBackgroundImageProperties();

                                imageNameTextInput.val(Resources.CommonLabels.NoneLabelText);

                                _this.updateStylesPreview();
                            }
                            break;
                    }

                    if (_which === _keyCode.BACKSPACE)
                    {
                        ev.preventDefault();
                    }

                    ev.stopPropagation();
                }.bind(this));

                lookupBox.find("a.ellipsis").on("click", function ()
                {
                    SourceCode.Forms.ImagePicker.initialize(SCStyleBuilder._ImagePickerCallbackHandler);
                }.bind(this));
                //#endregion

                //#region background image repeat
                o.repeatHorizontallyCheckbox.on('change', function (ev)
                {
                    var checked = o.repeatHorizontallyCheckbox.checkbox("isChecked");

                    var propertyValue = (checked) ? "True" : "False";

                    SCStyleBuilder._updateStyleProperty("BackgroundImage", "HorizontalRepeat", propertyValue);

                    SCStyleBuilder.updateStylesPreview();
                }.bind(this));

                o.repeatVerticallyCheckbox.on('change', function (ev)
                {
                    var checked = o.repeatVerticallyCheckbox.checkbox("isChecked");

                    var propertyValue = (checked) ? "True" : "False";

                    SCStyleBuilder._updateStyleProperty("BackgroundImage", "VerticalRepeat", propertyValue);

                    SCStyleBuilder.updateStylesPreview();
                }.bind(this));
                //#endregion

                //#region background image size
                this._InitializeImageSizeDropDownOptions();
                o.imageSizeDropDown.on('change', function (ev)
                {
                    var value = o.imageSizeDropDown.dropdown("SelectedValue");

                    SCStyleBuilder._updateStyleProperty("BackgroundImage", "ImageSize", value);

                    SCStyleBuilder.updateStylesPreview();
                }.bind(this));
                //#endregion

                //#region background image position
                o.positionWidget.on('click',function (ev)
                {
                    var value = o.positionWidget.imagePositionWidget("selectedValue");

                    var p = value.split("-");

                    if (p.length === 2)
                    {
                        SCStyleBuilder._updateStyleProperty("BackgroundImage", "VerticalPosition", p[0]);
                        SCStyleBuilder._updateStyleProperty("BackgroundImage", "HorizontalPosition", p[1]);
                    }

                    SCStyleBuilder.updateStylesPreview();
                }.bind(this));
                //#endregion

                //#region background image shadow
                o.imageShadowCheckbox.on('change', function (ev)
                {
                    var checked = o.imageShadowCheckbox.checkbox("isChecked");

                    var propertyValue = (checked) ? "True" : "False";

                    SCStyleBuilder._updateStyleProperty("BackgroundImage", "Shadow", propertyValue);

                    SCStyleBuilder.updateStylesPreview();
                }.bind(this));
                //#endregion

                //#region background image rounded corner
                this._InitializeImageRoundedCornerDropDownOptions();
                o.imageRoundedCornerDropDown.on('change', function (ev) 
                {
                    var value = o.imageRoundedCornerDropDown.dropdown("SelectedValue");

                    SCStyleBuilder._updateStyleProperty("BackgroundImage", "Radius", null);

                    var node = this.customStyleNode.selectSingleNode("BackgroundImage/Radius");

                    node.setAttribute("All", value);

                    SCStyleBuilder.updateStylesPreview();
                }.bind(this));
                //#endregion

                return o;
            },
            _removeBackgroundImageProperties: function()
            {
                //Remove background image properties
                var backgroundImageNode = this.customStyleNode.selectSingleNode("BackgroundImage");
                if (!checkExists(backgroundImageNode))
                    return;

                var node = null;

                node = backgroundImageNode.selectSingleNode("ImageId");
                if (checkExists(node))
                    backgroundImageNode.removeChild(node);

                node = backgroundImageNode.selectSingleNode("ImageName");
                if (checkExists(node))
                    backgroundImageNode.removeChild(node);

                node = backgroundImageNode.selectSingleNode("HorizontalRepeat");
                if (checkExists(node))
                    backgroundImageNode.removeChild(node);

                node = backgroundImageNode.selectSingleNode("VerticalRepeat");
                if (checkExists(node))
                    backgroundImageNode.removeChild(node);

                node = backgroundImageNode.selectSingleNode("ImageSize");
                if (checkExists(node))
                    backgroundImageNode.removeChild(node);

                node = backgroundImageNode.selectSingleNode("HorizontalPosition");
                if (checkExists(node))
                    backgroundImageNode.removeChild(node);

                node = backgroundImageNode.selectSingleNode("VerticalPosition");
                if (checkExists(node))
                    backgroundImageNode.removeChild(node);
            },
            //This is a callback function that is used by the SourceCode.Forms.ImagePicker thus 'this' is SourceCode.Forms.ImagePicker
            _ImagePickerCallbackHandler: function (imageId, imageName)
            {
                if (checkExistsNotEmpty(imageId))
                {
                    SCStyleBuilder._updateStyleProperty("BackgroundImage", "ImageId", imageId);
                    SCStyleBuilder._updateStyleProperty("BackgroundImage", "ImageName", imageName);

                    SCStyleBuilder._setStylePropertyIfNotExists("BackgroundImage", "VerticalRepeat", "False");
                    SCStyleBuilder._setStylePropertyIfNotExists("BackgroundImage", "HorizontalRepeat", "False");

                    SCStyleBuilder._setStylePropertyIfNotExists("BackgroundImage", "ImageSize", "normal");

                    SCStyleBuilder._setStylePropertyIfNotExists("BackgroundImage", "VerticalPosition", "top");
                    SCStyleBuilder._setStylePropertyIfNotExists("BackgroundImage", "HorizontalPosition", "center");

                    SCStyleBuilder._setStylePropertyIfNotExists("BackgroundImage", "Shadow", "False");

                    imageName = checkExistsNotEmpty(imageName) ? imageName : Resources.CommonLabels.NoneLabelText;
                    $("#StyleBuilderBackgroundImageName").val(imageName);

                    SCStyleBuilder.updateStylesPreview();
                }
            },
            _InitializeImageSizeDropDownOptions: function ()
            {
                var o = $("#BackgroundImageSizeSelect").dropdown();
                o.dropdown("clearOptions");

                var imageSizeDropDownOptions = [];
                imageSizeDropDownOptions.push(
                    {
                        index: 0,
                        text: "Normal",
                        value: "normal",
                        selected: true
                    });

                imageSizeDropDownOptions.push(
                    {
                        index: 0,
                        text: "Cover",
                        value: "cover",
                        selected: false
                    });

                imageSizeDropDownOptions.push(
                    {
                        index: 0,
                        text: "Contain",
                        value: "contain",
                        selected: false
                    });

                var dropDownObj = o.data("ui-dropdown");
                dropDownObj.options.items = imageSizeDropDownOptions;

                o.dropdown("refresh");
            },

            _InitializeImageRoundedCornerDropDownOptions: function ()
            {
                var o = $("#BackgroundImageRoundedCornerSelect").dropdown();
                o.dropdown("clearOptions");

                var options = [];
                options.push(
                    {
                        index: 0,
                        text: "",
                        value: "",
                        selected: true
                    });

                for (var i = 0; i <= 30; i++)
                {
                    options.push(
                        {
                            index: i+1,
                            text: i + "px",
                            value: i + "px",
                            selected: false
                        });
                }

                var dropDownObj = o.data("ui-dropdown");
                dropDownObj.options.items = options;

                o.dropdown("refresh");
            },

            addStyleBuilderFontEvents: function ()
            {
                //#region

                //#region color
                var foregroundPicker = jQuery("#styleBuilderColorPickerInput");
                foregroundPicker.jPicker(
                    {
                        window:
                            {
                                expandable: true
                            }
                    });

                foregroundPicker.on("change", function ()
                {
                    var jq_This = jQuery(arguments[0].target);
                    var color = jq_This.val();

                    var cssActionArray = [];
                    cssActionArray[0] = "Font";
                    cssActionArray[1] = "Color";
                    cssActionArray[2] = "#" + color;
                    cssActionArray[3] = this.Defaults.Font.Color;

                    this.setControlStyleXml(cssActionArray);
                }.bind(this));
                //#endregion

                jQuery("#styleBuilderFontStyle").on("change", function ()
                {
                    var selectedValue = jQuery(arguments[0].target).val();

                    var style = "normal";
                    var weight = "normal";
                    switch (selectedValue)
                    {
                        case "bold":
                            weight = "bold";
                            break;
                        case "italic":
                            style = "italic";
                            break;
                        case "bold-italic":
                            style = "italic";
                            weight = "bold";
                            break;
                        case "regular":
                            style = "normal";
                            weight = "normal";
                            break;
                        case "":
                            style = "unchanged";
                            weight = "unchanged";
                            break;
                    }
                    var cssActionArray = [];
                    cssActionArray[0] = "Font";
                    cssActionArray[1] = "Style";
                    cssActionArray[2] = style;
                    cssActionArray[3] = this.Defaults.Font.Style;
                    //this will not refresh the control only update the control xml
                    this.buildControlStyleXml(cssActionArray);

                    cssActionArray[0] = "Font";
                    cssActionArray[1] = "Weight";
                    cssActionArray[2] = weight;
                    cssActionArray[3] = this.Defaults.Font.Weight;
                    this.setControlStyleXml(cssActionArray);
                }.bind(this));

                jQuery("#styleBuilderFontSize").on("change", function ()
                {
                    var selectedValue = jQuery(arguments[0].target).val();

                    var cssActionArray = [];
                    cssActionArray[0] = "Font";
                    cssActionArray[1] = "Size";
                    cssActionArray[2] = selectedValue;
                    cssActionArray[3] = this.Defaults.Font.Size;

                    this.setControlStyleXml(cssActionArray);
                }.bind(this));

                jQuery("#styleBuilderFontFamily").on("change", function ()
                {
                    var selectedValue = jQuery(arguments[0].target).val();

                    var cssActionArray = [];
                    cssActionArray[0] = "Font";
                    cssActionArray[1] = "Family";
                    cssActionArray[2] = selectedValue;
                    cssActionArray[3] = this.Defaults.Font.Family;

                    this.setControlStyleXml(cssActionArray);
                }.bind(this));

                //Align controls
                this.styleBuilderDialog.find("a.style-builder-text-align").on("click", function (event)
                {
                    var button = $(event.target).closest("a");
                    //if (!button.is(".disabled"))
                    //{
                    var id = button[0].id;
                    var value = id.split("_")[1];
                    this.toolbarAsButtonRadioClick(event, "Text", "Align", value, this.Defaults.Text.Align, "a.style-builder-text-align", "#" + id);
                    //}
                }.bind(this));

                //Decoration controls
                this.styleBuilderDialog.find("a.style-builder-text-decoration").on("click", function (event)
                {
                    var button = $(event.target).closest("a");
                    //if (!button.is(".disabled"))
                    //{
                    var id = button[0].id;
                    var value = id.split("_")[1];
                    this.toolbarAsButtonRadioClick(event, "Text", "Decoration", value, this.Defaults.Text.Decoration, "a.style-builder-text-decoration", "#" + id);
                    //}
                }.bind(this));

                //#endregion
            },
            customGridUpdateRelatedTextBox: function ()
            {
                var selectedRow = jQuery("#styleBuilderCustomGrid").grid("fetch", "selected-rows", "objects");
                var rowValue = selectedRow[0][0].value;
                var textbox = this.customTextBoxVal;
                textbox.val(rowValue);
                this.refreshFormatPreview();
            },
            selectItemFromListAsTab: function ()
            {
                //Make the grid control selection function like a tab control
                var selectedRow = jQuery("#StyleBuilderFormatListGrid").grid("fetch", "selected-rows", "objects");
                var rowValue = selectedRow[0][0].value;
                var formatPanel = jQuery("#StyleBuilderFormatContentPane");
                formatPanel.find(".list-as-tab-content").css("display", "none");
                var contentPanel = jQuery("#{0}_Content".format(rowValue)).css("display", "");
                contentPanel.find("div.panel").panel();
                contentPanel.find("div.grid")
                    .grid("syncWidths")
                    .find(".grid-body-content").css("top", "0px");
                this.refreshFormatPreview();
            },
            toolbarAsButtonRadioClick: function (event, styleType, styleProperty, styleName, defaultValue, cssToFindCollection, cssToFindThisItem)
            {
                var jq_This = jQuery(event.target).closest("a");
                var cssToFindItemsBesidesThisItem = "{0}:not({1})".format(cssToFindCollection, cssToFindThisItem);
                this.styleBuilderDialog.find(cssToFindItemsBesidesThisItem).removeClass("selected");

                if (!jq_This.hasClass("selected"))
                {
                    jq_This.addClass("selected");
                    var cssActionArray = [];
                    cssActionArray[0] = styleType;
                    cssActionArray[1] = styleProperty;
                    cssActionArray[2] = styleName;
                    cssActionArray[3] = defaultValue;
                    this.setControlStyleXml(cssActionArray);
                }
            },
            getDesignRenderHelper: function ()
            {
                if (!this.DesignRenderHelper)
                {
                    var stylePanel = jQuery("#jq_styleBuilderPreviewPanelbox").panel();
                    var styleBody = stylePanel.panel("fetch", "body");
                    var previewContent = jQuery("#StyleBuilderPreviewPanelContent");
                    if (this.viewControl.isFormControl)
                    {
                        previewContent.addClass("form-control");
                    }
                    previewContent.data("controlid", this.viewControl.controlid);
                    previewContent.attr("controltype", this.viewControl.controltype);
                    var designOptions =
                        {
                            modalizeControl: styleBody,
                            controlToPopulate: previewContent,
                            viewControl: this.viewControl,
                            postUpdateFunction: function () { setTimeout(this.resizePreviewContent, 40); }.bind(this),
                            cultureHelper: SCCultureHelper.current,
                            overRideControlText: true
                        };
                    this.DesignRenderHelper = new SCDesignRenderHelper(designOptions);
                }
                return this.DesignRenderHelper;
            },
            updateStylesPreview: function (controlStyle)
            {
                var stylePanel = jQuery("#jq_styleBuilderPreviewPanelbox").panel();
                var styleBody = stylePanel.panel("fetch", "body");
                var designRenderHelper = this.getDesignRenderHelper(styleBody, styleBody);
                designRenderHelper.renderControl(this.customStylesXml);
            },
            setControlStyleXml: function (cssActionArray)
            {
                //#region
                var controlStyle = this.buildControlStyleXml(cssActionArray);
                this.updateStylesPreview(controlStyle);
                //#endregion
            },
            buildFormatXml: function (cultureObject, type, pattern, patternName)
            {
                var controlStyle = this.customStyleNode;

                var formatNode = controlStyle.selectSingleNode("Format");

                if (type === "None")
                {
                    if (formatNode)
                        controlStyle.removeChild(formatNode);
                }
                else
                {
                    var useSpecific = jQuery("#styleBuilder{0}UseSpecificLocale".format(type))[0].checked;

                    if (!formatNode)
                    {
                        formatNode = this.customStylesDocument.createElement("Format");
                        controlStyle.appendChild(formatNode);
                    }
                    else if (formatNode.firstChild)
                    {
                        formatNode.removeChild(formatNode.firstChild);
                    }
                    formatNode.setAttribute("NegativePattern", (cultureObject.OverrideNegativePattern) ? cultureObject.OverrideNegativePattern : "");
                    formatNode.setAttribute("CurrencySymbol", (cultureObject.OverrideCurrencySymbol) ? cultureObject.OverrideCurrencySymbol : "");
                    if (useSpecific)
                        formatNode.setAttribute("Culture", cultureObject.Name);
                    else
                        formatNode.removeAttribute("Culture");

                    formatNode.setAttribute("Type", type);

                    if (!useSpecific && type.toLowerCase() === "special")
                    {
                        formatNode.appendChild(this.customStylesDocument.createTextNode(patternName));
                    }
                    else
                    {
                        formatNode.appendChild(this.customStylesDocument.createTextNode(pattern));
                    }

                }
            },
            _updateBorderXml: function (o)
            {
                //Options
                //	o.BaseNode
                //	o.Sides
                //	o.Style
                //	o.Color
                //	o.Width
                //	o.RemoveSides
                var styleOptions = ["Style", "Color", "Width"];
                var styleOptionsDefaults = [this.Defaults.Border.Style, this.Defaults.Border.Color, this.Defaults.Border.Width];
                // Check if style already exist
                var styleNode = this.customStyleNode.selectSingleNode(o.BaseNode);

                if (!styleNode && o.Sides.length !== 0)
                {
                    styleNode = this.customStylesDocument.createElement(o.BaseNode);
                    this.customStyleNode.appendChild(styleNode);
                }
                for (var i = 0; i < o.Sides.length; i++)
                {
                    var styleSideNode = styleNode.selectSingleNode(o.Sides[i]);
                    if (!styleSideNode)
                    {
                        styleSideNode = this.customStylesDocument.createElement(o.Sides[i]);
                        styleNode.appendChild(styleSideNode);
                    }
                    if (o.RemoveSides === true)
                    {
                        if (this.defaultStyleNode.selectSingleNode(o.BaseNode + "/" + o.Sides[i]))
                        {
                            for (var j = 0; j < styleOptions.length; j++)
                            {
                                if (this.defaultStyleNode.selectSingleNode(o.BaseNode + "/" + o.Sides[i] + "/" + styleOptions[j]))
                                {
                                    var styleSideStyleNode = styleSideNode.selectSingleNode(styleOptions[j]);
                                    if (!styleSideStyleNode)
                                    {
                                        styleSideStyleNode = this.customStylesDocument.createElement(styleOptions[j]);
                                        styleSideNode.appendChild(styleSideStyleNode);
                                    }
                                    else if (styleSideStyleNode.firstChild)
                                    {
                                        styleSideStyleNode.removeChild(styleSideStyleNode.firstChild);
                                    }
                                    styleSideStyleNode.appendChild(this.customStylesDocument.createTextNode(styleOptionsDefaults[j]));
                                }
                                else
                                {
                                    var styleSideStyleNode = styleSideNode.selectSingleNode(styleOptions[j]);
                                    if (styleSideStyleNode)
                                    {
                                        styleSideNode.removeChild(styleSideStyleNode);
                                    }
                                }
                            }
                        }
                        else
                        {
                            styleNode.removeChild(styleSideNode);
                        }
                    }
                    else
                    {

                        for (var j = 0; j < styleOptions.length; j++)
                        {
                            var styleSideStyleNode = styleSideNode.selectSingleNode(styleOptions[j]);
                            if (o[styleOptions[j]] !== "unchanged" && o[styleOptions[j]] !== "")
                            {
                                if (styleSideStyleNode)
                                {
                                    styleSideStyleNode.removeChild(styleSideStyleNode.firstChild);
                                    styleSideStyleNode.appendChild(this.customStylesDocument.createTextNode(o[styleOptions[j]]));
                                }
                                else
                                {
                                    styleSideStyleNode = this.customStylesDocument.createElement(styleOptions[j]);
                                    styleSideStyleNode.appendChild(this.customStylesDocument.createTextNode(o[styleOptions[j]]));
                                    styleSideNode.appendChild(styleSideStyleNode);
                                }
                            }
                            else
                            {
                                //check for default and apply empty 
                                if (this.defaultStyleNode.selectSingleNode(o.BaseNode + "/" + o.Sides[i] + "/" + styleOptions[j]))
                                {
                                    var styleSideStyleNode = styleSideNode.selectSingleNode(styleOptions[j]);
                                    if (!styleSideStyleNode)
                                    {
                                        styleSideStyleNode = this.customStylesDocument.createElement(styleOptions[j]);
                                        styleSideNode.appendChild(styleSideStyleNode);
                                    }
                                    else if (styleSideStyleNode.firstChild)
                                    {
                                        styleSideStyleNode.removeChild(styleSideStyleNode.firstChild);
                                    }
                                    styleSideStyleNode.appendChild(this.customStylesDocument.createTextNode(styleOptionsDefaults[j]));
                                }
                                else
                                {
                                    var styleSideStyleNode = styleSideNode.selectSingleNode(styleOptions[j]);
                                    if (styleSideStyleNode)
                                    {
                                        styleSideNode.removeChild(styleSideStyleNode);
                                    }
                                }
                            }
                        }
                    }
                }
                //if there are no default overides or sides remove the borders node
                if (o.RemoveSides === true && styleNode.childNodes.length === 0)
                {
                    this.customStyleNode.removeChild(styleNode);
                }
            },
            _updatePaddingMarginXml: function (o)
            {
                //Options
                //	o.BaseNode
                //	o.Side
                //	o.Width
                // Check if style already exist
                var styleNode = this.customStyleNode.selectSingleNode(o.BaseNode);

                if (!styleNode)
                {
                    styleNode = this.customStylesDocument.createElement(o.BaseNode);
                    this.customStyleNode.appendChild(styleNode);
                }

                var sideNode = styleNode.selectSingleNode(o.Side);
                if (!sideNode)
                {
                    sideNode = this.customStylesDocument.createElement(o.Side);
                    if (o.Side === "Default")
                    {
                        if (styleNode.childNodes[0])
                        {
                            styleNode.insertBefore(sideNode, styleNode.childNodes[0]);
                        }
                        else
                        {
                            styleNode.appendChild(sideNode);
                        }
                    }
                    else
                    {
                        styleNode.appendChild(sideNode);
                    }
                }
                if (sideNode.childNodes.length > 0)
                    sideNode.removeChild(sideNode.childNodes[0]);


                if (o.Width === "unchanged" || o.Width === "")
                {
                    if (this.defaultStyleNode.selectSingleNode(o.BaseNode + "/" + o.Side))
                    {

                        sideNode.appendChild(this.customStylesDocument.createTextNode(this.Defaults[o.BaseNode]));
                    }
                    else
                    {
                        styleNode.removeChild(sideNode);
                    }
                }
                else
                {
                    sideNode.appendChild(this.customStylesDocument.createTextNode(o.Width));
                }
            },
            _getStylePropertyValue: function (baseNodeName, name) 
            {
                var node = this.customStyleNode.selectSingleNode(baseNodeName + "/" + name);
                return node ? node.text : null;
            },
            _setStylePropertyIfNotExists: function (baseNodeName, name, value)
            {
                var node = this.customStyleNode.selectSingleNode(baseNodeName + "/" + name);
                if (checkExists(node))
                {
                    return;
                }

                this._updateStyleProperty(baseNodeName, name, value);
            },
            _updateStyleProperty: function (baseNodeName, name, value) 
            {
                // Check if node already exist
                var baseNode = this.customStyleNode.selectSingleNode(baseNodeName);
                if (!baseNode)
                {
                    baseNode = this.customStylesDocument.createElement(baseNodeName);
                    this.customStyleNode.appendChild(baseNode);
                }

                var node = baseNode.selectSingleNode(name);
                if (!node)
                {
                    node = this.customStylesDocument.createElement(name);
                    baseNode.appendChild(node);
                }

                if (node.childNodes.length > 0)
                {
                    node.removeChild(node.childNodes[0]);
                }

                if (checkExists(value))
                {
                    node.appendChild(this.customStylesDocument.createTextNode(value));
                }
            },
            buildControlStyleXml: function (o)
            {
                if (checkExists(o.Color) && o.Color === "#")
                {
                    o.Color = "transparent";
                }
                if (typeof o.BaseNode !== "undefined")
                {
                    switch (o.BaseNode)
                    {
                        case "Border":
                            this._updateBorderXml(o);
                            break;
                        case "Padding":
                        case "Margin":
                            this._updatePaddingMarginXml(o);
                            break;
                    }
                }
                else
                {
                    switch (o.length)
                    {
                        case 3:
                            // Check if style already exist
                            var styleNode = this.customStyleNode.selectSingleNode(o[0]);
                            var style = o[0];
                            var value = o[1];
                            var defaultValue = o[2];

                            if (!styleNode)
                            {
                                styleNode = this.customStylesDocument.createElement(o[0]);

                                this.customStyleNode.appendChild(styleNode);
                            }
                            else if (styleNode.firstChild)
                            {
                                styleNode.removeChild(styleNode.firstChild);
                            }

                            if (styleNode.nodeName.toLowerCase().indexOf("color") >= 0 && value === "#")
                            {
                                value = "transparent";
                            }

                            if (value === "unchanged" || value === "")
                            {
                                if (this.defaultStyleNode.selectSingleNode(style))
                                {

                                    styleNode.appendChild(this.customStylesDocument.createTextNode(defaultValue));
                                }
                                else
                                {
                                    this.customStyleNode.removeChild(styleNode);
                                }
                            }
                            else
                            {
                                styleNode.appendChild(this.customStylesDocument.createTextNode(value));
                            }

                            break;
                        case 4:
                            //font //text
                            // Check if style already exist
                            var styleNode = this.customStyleNode.selectSingleNode(o[0]);
                            var style = o[1];
                            var value = o[2];
                            var defaultValue = o[3];

                            if (!styleNode)
                            {
                                styleNode = this.customStylesDocument.createElement(o[0]);

                                this.customStyleNode.appendChild(styleNode);
                            }

                            var styleSideNode = styleNode.selectSingleNode(style);

                            if (!styleSideNode)
                            {
                                styleSideNode = this.customStylesDocument.createElement(style);
                                styleNode.appendChild(styleSideNode);
                            }

                            if (styleSideNode.nodeName.toLowerCase().indexOf("color") >= 0 && value === "#")
                            {
                                value = "transparent";
                            }

                            if (styleSideNode.firstChild)
                                styleSideNode.removeChild(styleSideNode.firstChild);

                            if (value === "unchanged" || value === "")
                            {
                                if (this.defaultStyleNode.selectSingleNode(o[0] + "/" + o[1]))
                                {

                                    styleSideNode.appendChild(this.customStylesDocument.createTextNode(defaultValue));
                                }
                                else
                                {
                                    styleNode.removeChild(styleSideNode);
                                }
                            }
                            else
                            {
                                styleSideNode.appendChild(this.customStylesDocument.createTextNode(value));
                            }

                            break;
                        default:
                            break;
                    }
                }
                return this.customStyleNode;
            },
            _checkStyleXml: function (o)
            {
                //#region
                var styleSideNode = this.customStyleNode.selectSingleNode(o.BaseNode + "/" + o.Sides[0]);
                if (!styleSideNode)
                    return false;
                var styleOptions = ["Style", "Color", "Width"];
                for (var j = 0; j < styleOptions.length; j++)
                {
                    var styleSideStyleNode = styleSideNode.selectSingleNode(styleOptions[j]);
                    if (o[styleOptions[j]] === null || (styleSideStyleNode && styleSideStyleNode.text === o[styleOptions[j]]))
                    {
                    }
                    else
                    {
                        return false;
                    }
                }
                return true;
                //#endregion
            },

            resizePreviewContent: function (testWidth)
            {
                var previewContentWrapper = jQuery("#StyleBuilderPreviewPanelContentWrapper");
                var previewContent = jQuery("#StyleBuilderPreviewPanelContent");
                var control = previewContent.children().eq(0);

                if (previewContentWrapper.length === 0 || previewContent.length === 0 || control.length === 0)
                {
                    return;
                }

                //height
                var height = previewContentWrapper.outerHeight();
                var parentHeight = previewContentWrapper.parent().outerHeight(true);
                previewContentWrapper[0].style.top = Math.round((parentHeight - height - 4) / 2) + "px";
                previewContentWrapper.is(":visible");
            },
            _destroy: function ()
            {
                //#region
                this.styleBuilderDialog.find("*").off();

                this.controls = null;
                this.backgroundTabControls = null;
                this.renderXhr = null;
                this.availableStylesNode = null;
                this.fontStylingControls = null;
                this.styleBuilderDialog = null;
                this.localeChangedLock = false;
                this.currentCulture = null;
                this.dialogHtml = "";
                this.DesignRenderHelper = null;
                this.numberDecimalPlacesVal = null;
                this.currencyDecimalPlacesVal = null;
                this.currencySymbolVal = null;
                this.percentageDecimalPlacesVal = null;
                this.scientificDecimalPlacesVal = null;
                this.customTextBoxVal = null;
                this.negativeNumbersVal = null;
                this.currencyNegativeNumbersVal = null;
                this.specialFormattinVal = null;
                this.durationFormatVal = null;
                this.durationConvertVal = null;
                this.dateTypeVal = null;

                //#endregion
            }
            //#endregion
        };

    if (typeof SCStyleBuilder === "undefined") SCStyleBuilder = SourceCode.Forms.Controls.StyleBuilder;
    $.widget("StyleBuilder", SourceCode.Forms.Controls.StyleBuilder);
})(jQuery);

