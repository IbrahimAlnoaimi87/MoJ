(function ($)
{
    if (typeof SourceCode === 'undefined' || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === 'undefined' || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Controls === 'undefined' || SourceCode.Forms.Controls === null) SourceCode.Forms.Controls = {};
    if (typeof SourceCode.Forms.Controls.Form === 'undefined' || SourceCode.Forms.Controls.Form === null) SourceCode.Forms.Controls.Form = {};
    function addReady(fn)
    {
        if (typeof addRuntimePendingCalls === "function")
        {
            addRuntimePendingCalls(fn);
        }
        else
        {
            $(document).ready(fn);
        }
    }

    addReady(function ()
    {
        if (!checkExists(SourceCode.Forms.Controls.Base) || !checkExists(SourceCode.Forms.Controls.Base.ControlType))
        {
            return;
        }

        var SFCForm;
        SourceCode.Forms.Controls.Form = SFCForm = $.extend({}, SourceCode.Forms.Controls.Base.ControlType,
            {
                _styleXPaths:
                {
                    width: "Styles/Style/Width",
                    backgroundColor: "Styles/Style/BackgroundColor",
                    borderColor: "Styles/Style/Border/Default/Color",
                    borderWidth: "Styles/Style/Border/Default/Width",
                    borderStyle: "Styles/Style/Border/Default/Style",
                    padding: "Styles/Style/Padding/Default"
                },

                _getInstance: function (id)
                {
                    var adjustedId = id.substr(37);

                    var form = $("#{0}, #{0}_tabbox".format(adjustedId))[0];

                    if (checkExists(form))
                    {
                        return $(form);
                    }
                    else
                    {
                        return null;
                    }
                },

                getProperty: function (objInfo)
                {
                    var instance = SFCForm._getInstance(objInfo.CurrentControlId);
                    var retVal = instance.SFCForm('option', objInfo.property);
                    // If retVal is the same as instance, then the option was not found.  Return undefined instead.
                    if (retVal === instance)
                    {
                        return;
                    }
                    return retVal;
                },

                setProperty: function (objInfo)
                {
                    var instance = SFCForm._getInstance(objInfo.CurrentControlId);
                    instance.SFCForm('option', objInfo.property, objInfo.Value);
                },

                /**
                *	A User Interface to property XML resolver
                *	@param {object} context an reference object containing context of what the current values are and the direction of resolution. The same object is adjusted for the result
                *		-	property: The property's name
                *		-	value: The current property value
                *		-	display: The current property display
                *		-	icon: The current property icon
                *		-	resolveDirection: TO-PROPERTY-UI reflects that we are updating the UI. TO-PROPERTY-XML that we are updating the property xml that gets saved
                 */
                designerPropertyResolver: function (context)
                {
                    if (context.resolveDirection === "TO-PROPERTY-UI")
                    {
                        if (context.value === "OVERLAYBUSY")
                        {
                            context.value = "true";
                        }
                        else
                        {
                            context.value = "false";
                        }
                    }
                    else
                    {
                        if (context.value === "true")
                        {
                            context.value = "OVERLAYBUSY";
                        }
                        else
                        {
                            context.value = "NONE";
                        }
                    }
                },

                saveState: function (objInfo)
                {
                    var instance = SFCForm._getInstance(objInfo.CurrentControlId);
                    var value = instance.SFCForm('saveState');
                    //if the property was not found jQuery UI will return the instance for chaining
                    //override this and instead return undefined
                    if (value === instance)
                    {
                        return;
                    }
                    else
                    {
                        return value;
                    }
                },

                loadState: function (objInfo)
                {
                    var instance = SFCForm._getInstance(objInfo.CurrentControlId);
                    instance.SFCForm('loadState', objInfo.Value);
                },

                manageControlEvent: function (context)
                {
                    EventUtil.manageControlEvent(context);
                }
            });

        $.widget("sfc.SFCForm", $.sfc.baseWidget,
            {
                options:
                {
                    width: "",
                    minWidth: "",
                    maxWidth: "",
                    id: "",
                    baseId: "",
                    previous: {},
                    backgroundColor: "",
                    canMapStyles: true,
                    isVisible: true,
                    hasDisableOverlay: false,
                    padding: "",
                    style: parseXML(SourceCode.Forms.Controls.Base.emptyStylesNode),
                    title: document.title
                },

                _create: function ()
                {
                    this.options.canMapStyles = true;
                    this.options.id = this.element[0].getAttribute("id");
                    this.options.baseId = this.options.id.substring(0, this.options.id.indexOf("_"));
                    this.options.controllerControlId = "00000000-0000-0000-0000-000000000000_" + this.options.id;
                    this.workflowStrip = $("#WorkflowStrip");
                    this.workflowStripExists = this.workflowStrip.length > 0;
                    this.viewDefinitionControlPropertiesXPath = "Controllers/Controller/Controls/Control[@ID='" + this.options.controllerControlId + "']/Properties";

                    this.base._create.apply(this, arguments);

                    if (this.element[0].style.display === 'none')
                    {
                        this.options.isVisible = false;
                        SFLog({ type: 1, source: "SFCForm", category: "Init", message: 'Form is hidden' });
                    }
                },

                /*
                 * Function added to sync with Base Control
                */
                _setOption: function (name, value)
                {
                    //Begin conversion logic
                    //Both the name and value can be adjusted if a converter is specified in the widget
                    if (typeof this._optionValueConverter === "function")
                    {
                        value = this._optionValueConverter(name, value);
                    }

                    if (typeof this._optionNameTransformer === "function")
                    {
                        name = this._optionNameTransformer(name);
                    }
                    //End conversion logic

                    //set the previous value of this option equal to the current value of the option if the previous object exists
                    if (typeof this.options.previous !== "undefined")
                        this.options.previous[name] = this.options[name];

                    //call the jQuery UI base method
                    $.Widget.prototype._setOption.apply(this, arguments);

                    /*#region changes to base control */

                    if (name.toLowerCase() === "style")
                    {
                        if (this.options.canMapStyles === true)
                        {
                            this.options.canMapStyles = false;
                        }
                        else
                        {
                            if (this.options.style !== this.options.previous.style)
                            {
                                //map from styles to properties
                                if (this._checkStyleChanged())
                                {
                                    var widthNode = this.options.style.selectSingleNode(SFCForm._styleXPaths.width);

                                    if (checkExists(widthNode))
                                    {
                                        this.options.width = widthNode.text;
                                    }

                                    var backgroundColorNode = this.options.style.selectSingleNode(SFCForm._styleXPaths.backgroundColor);

                                    if (checkExists(backgroundColorNode))
                                    {
                                        this.options.backgroundColor = backgroundColorNode.text;
                                    }

                                    var borderColorNode = this.options.style.selectSingleNode(SFCForm._styleXPaths.borderColor);

                                    if (checkExists(borderColorNode))
                                    {
                                        this.options.borderColor = borderColorNode.text;
                                    }

                                    var borderWidthNode = this.options.style.selectSingleNode(SFCForm._styleXPaths.borderWidth);

                                    if (checkExists(borderWidthNode))
                                    {
                                        this.options.borderWidth = borderWidthNode.text;
                                    }

                                    var borderStyleNode = this.options.style.selectSingleNode(SFCForm._styleXPaths.borderStyle);

                                    if (checkExists(borderStyleNode))
                                    {
                                        this.options.borderStyle = borderStyleNode.text;
                                    }

                                    var paddingNode = this.options.style.selectSingleNode(SFCForm._styleXPaths.padding);

                                    if (checkExists(paddingNode))
                                    {
                                        this.options.padding = paddingNode.text;
                                    }
                                }
                            }
                        }
                    }
                    else
                    {
                        //map from properties to styles
                        if (this.options.padding !== this.options.previous.padding)
                        {
                            this._setStyleNodeValue(this.options.style, SFCForm._styleXPaths.padding, this.options.padding);
                            this._setStyleNodeValue(viewControllerDefinition, this.viewDefinitionControlPropertiesXPath + SFCForm._styleXPaths.padding, this.options.padding);
                        }

                        if (this.options.width !== this.options.previous.width)
                        {
                            this._setStyleNodeValue(this.options.style, SFCForm._styleXPaths.width, this.options.width);
                            this._setStyleNodeValue(viewControllerDefinition, this.viewDefinitionControlPropertiesXPath + SFCForm._styleXPaths.width, this.options.width);
                        }

                        if (this.options.backgroundColor !== this.options.previous.backgroundColor)
                        {
                            this._setStyleNodeValue(this.options.style, SFCForm._styleXPaths.backgroundColor, this.options.backgroundColor);
                            this._setStyleNodeValue(viewControllerDefinition, this.viewDefinitionControlPropertiesXPath + SFCForm._styleXPaths.backgroundColor, this.options.backgroundColor);
                        }

                        if (this.options.borderColor !== this.options.previous.borderColor)
                        {
                            this._setStyleNodeValue(this.options.style, SFCForm._styleXPaths.borderColor, this.options.borderColor);
                            this._setStyleNodeValue(viewControllerDefinition, this.viewDefinitionControlPropertiesXPath + SFCForm._styleXPaths.borderColor, this.options.borderColor);
                        }

                        if (this.options.borderWidth !== this.options.previous.borderWidth)
                        {
                            this._setStyleNodeValue(this.options.style, SFCForm._styleXPaths.borderWidth, this.options.borderWidth);
                            this._setStyleNodeValue(viewControllerDefinition, this.viewDefinitionControlPropertiesXPath + SFCForm._styleXPaths.borderWidth, this.options.borderWidth);
                        }
                    }
                    /*#endregion changes to base control */

                    // if the previous object doesn't exist then we cannot track changed and must assume changes should always be applied
                    // if the previous object does exist test if the new value was changed
                    if (typeof this.options.previous === "undefined" ||
                        this.options.previous[name] !== this.options[name])
                    {
                        var disabledWasSet = false;
                        //Begin Code to align the jQuery disabled state with our disable states
                        if ((this.options.isEnabled === false || this.options.isParentEnabled === false) && (this.options.disabled === false || !checkExists(this.options.disabled)))
                        {
                            this.option("disabled", true);
                            disabledWasSet = true;
                        }
                        else if ((this.options.isEnabled === true && this.options.isParentEnabled === true) && (this.options.disabled === true || !checkExists(this.options.disabled)))
                        {
                            this.option("disabled", false);
                            disabledWasSet = true;
                        }
                        //End Code to align the jQuery disabled state with our disable states

                        if (!this.options.setOptions)
                        {
                            //if this is not called via setOptions fire the applyChanged method to adjust the UI
                            if (!disabledWasSet)
                            {
                                this.options.previous.style = this.options.style;
                                this.applyChanges();
                            }
                            //reset the previous option to be equal to the current option if the previous object exists
                            if (typeof this.options.previous !== "undefined")
                                this.options.previous[name] = this.options[name];
                        }
                        else
                        {
                            //flag that a change was made this is used by the setOptions method so that all changes can be applied only once
                            this.options.setOptionsOptionChanged = true;
                        }
                    }
                    return this;
                },

                applyChanges: function ()
                {
                    if (this.options.title !== this.options.previous.title)
                    {
                        if (checkExistsNotEmpty(this.options.title))
                        {
                            document.title = this.options.title;
                        }
                        else
                        {
                            document.title = this._getControlName();
                        }
                    }

                    if (this.options.isVisible !== this.options.previous.isVisible)
                    {
                        this._setAllChildControlsProperties("isParentVisible", this.options.isVisible, true);
                        if (this.options.isVisible === false)
                        {
                            this.element.hide();
                        }
                        else
                        {
                            this.element.show();
                        }
                    }

                    if (this.options.isEnabled !== this.options.previous.isEnabled)
                    {
                        this._setAllChildControlsProperties("isParentEnabled", this.options.isEnabled, true);
                    }

                    if (this.options.hasDisableOverlay !== this.options.previous.hasDisableOverlay)
                    {
                        if (this.options.hasDisableOverlay === true)
                        {
                            runtimeModalizer.show(false, null, "formmodal", true);
                        }
                        else
                        {
                            runtimeModalizer.hide("formmodal");
                        }
                    }

                    if (this.options.isReadOnly !== this.options.previous.isReadOnly)
                    {
                        this._setAllChildControlsProperties("isParentReadOnly", this.options.isReadOnly); //area item (view) does not support readonly so get all controls here
                    }

                    if (this.options.padding !== this.options.previous.padding)
                    {
                        if (this.element.hasClass("tab-box"))
                        {
                            var formElements = this.element.find(".form");

                            for (var z = 0; z < formElements.length; z++)
                            {
                                formElements[z].style["padding"] = this._convertWidthValue(this.options.padding);
                            }
                        }
                        else
                        {
                            this.element[0].style.padding = this._convertWidthValue(this.options.padding);
                        }

                        refreshFormPadding({ newPadding: this.options.padding });
                    }

                    if (this.options.width !== this.options.previous.width)
                    {
                        this.element.parent()[0].style["width"] = this._convertWidthValue(this.options.width);
                        if (this.workflowStripExists)
                        {
                            this.workflowStrip[0].style["width"] = this._convertWidthValue(this.options.width);
                        }
                    }

                    if (this.options.minWidth !== this.options.previous.minWidth)
                    {
                        this.element.parent()[0].style["minWidth"] = this._convertWidthValue(this.options.minWidth);
                        if (this.workflowStripExists)
                        {
                            this.workflowStrip[0].style["minWidth"] = this.options.minWidth;
                        }
                    }

                    if (this.options.maxWidth !== this.options.previous.maxWidth)
                    {
                        this.element.parent()[0].style["maxWidth"] = this._convertWidthValue(this.options.maxWidth);
                        if (this.workflowStripExists)
                        {
                            this.workflowStrip[0].style["maxWidth"] = this.options.maxWidth;
                        }
                    }

                    if (this.options.backgroundColor !== this.options.previous.backgroundColor)
                    {
                        if (this.element.hasClass("tab-box"))
                        {
                            var elements = this.element.find("#{0}_tabbody, #{0}_tabPanel .tab-wrapper".format(this.options.baseId));

                            for (var k = 0; k < elements.length; k++)
                            {
                                elements[k].style["backgroundColor"] = this.options.backgroundColor;
                            }
                        }
                        else
                        {
                            this.element[0].style["backgroundColor"] = this.options.backgroundColor;
                        }
                    }

                    if (this.options.borderColor !== this.options.previous.borderColor)
                    {
                        document.body.style["backgroundColor"] = this.options.borderColor;
                    }

                    if (this.options.borderWidth !== this.options.previous.borderWidth)
                    {
                        this.element.parent().parent()[0].style["margin"] = this._convertWidthValue(this.options.borderWidth);
                    }

                    this.base.applyChanges.apply(this, arguments);
                },

                _getControlName: function ()
                {
                    var nameProperty = $sn(viewControllerDefinition, this.viewDefinitionControlPropertiesXPath + "/Property[Name = 'ControlName']/Value");
                    if (checkExists(nameProperty))
                    {
                        return nameProperty.text;
                    }
                    return null;
                },

                _convertWidthValue: function (value)
                {
                    value = value.indexOf("px") >= 0 || value.indexOf("%") >= 0 ? value : value + "px";
                    return value;
                },

                _setAllChildControlsProperties: function (property, value, onlyFormControls)
                {
                    var formControls = this._getFormControls(onlyFormControls);
                    var i = formControls.length;
                    while (i--)
                    {
                        var currentControl = formControls[i];
                        var id = currentControl.getAttribute("ID");
                        //don't try recursively set this form and its child controls
                        if (id !== this.options.controllerControlId)
                        {
                            var objInfo = new PopulateObject(null, value, id, property);
                            executeControlFunction(currentControl, "SetProperty", objInfo);
                        }

                    }
                },

                _getFormControls: function (onlyFormControls)
                {
                    var xpath = "Controllers/Controller/Controls/Control";
                    if (onlyFormControls === true)
                    {
                        xpath = "Controllers/Controller[@TypeView='']/Controls/Control";
                    }
                    return viewControllerDefinition.selectNodes(xpath);
                },

                _setStyleNodeValue: function (styleDoc, xPath, newValue)
                {
                    var node = styleDoc.selectSingleNode(xPath);

                    if (checkExists(node))
                    {
                        if (node.childNodes.length > 0)
                        {
                            node.removeChild(node.childNodes[0]);
                        }
                        var newValueNode = styleDoc.createTextNode(newValue);
                        node.appendChild(newValueNode);
                    }
                },

                _optionValueConverter: function (key, value)
                {
                    key = key.toLowerCase();
                    switch (key)
                    {
                        case 'isvisible':
                        case 'isparentvisible':
                        case 'isenabled':
                        case 'isparentenabled':
                        case 'hasdisableoverlay':
                        case 'canmapstyles':
                            value = this._booleanConverter(value);
                            break;
                        case 'styles':
                        case 'style':
                            value = this._stylesConverter(value);
                            break;
                        default:
                            value = this.base._optionValueConverter(key, value);
                            break;
                    }
                    return value;
                },

                _optionNameTransformer: function (key)
                {
                    var lowercaseKey = key.toLowerCase();
                    var returnValue = null;
                    switch (lowercaseKey)
                    {
                        case "padding":
                            returnValue = "padding";
                            break;
                        case "width":
                            returnValue = "width";
                            break;
                        case "style":
                            returnValue = "style";
                            break;
                        case "minwidth":
                            returnValue = "minWidth";
                            break;
                        case "maxwidth":
                            returnValue = "maxWidth";
                            break;
                        case "backgroundcolor":
                            returnValue = "backgroundColor";
                            break;
                        case "bordercolor":
                            returnValue = "borderColor";
                            break;
                        case "borderwidth":
                            returnValue = "borderWidth";
                            break;
                        case "hasdisableoverlay":
                            returnValue = "hasDisableOverlay";
                            break;
                        case "canmapstyles":
                            returnValue = "canMapStyles";
                            break;
                        default:
                            returnValue = this.base._optionNameTransformer(lowercaseKey);
                            break;
                    }
                    return returnValue;
                },

                _isSerializableProperty: function (key, stateObject)
                {
                    var serializableOptions =
                    {
                        canMapStyles: true,
                        isVisible: true,
                        hasDisableOverlay: true,
                        isEnabled: true,
                        isReadOnly: true,
                        title: true,
                        width: true,
                        minWidth: true,
                        maxWidth: true,
                        padding: true,
                        borderWidth: true,
                        borderColor: true,
                        backgroundColor: true,
                        style: true
                    };
                    return serializableOptions[key] === true || this.base._isSerializableProperty(key, stateObject);
                },

                saveState: function ()
                {
                    var stateObject = this.base.saveState.apply(this, arguments);

                    if (checkExists(stateObject.style))
                    {
                        delete stateObject.style;
                    }

                    if (checkExists(this.options.style))
                    {
                        stateObject.style = this.options.style.xml;
                    }

                    return stateObject;
                }
            });

        $.sfc.SFCForm.prototype.base = $.sfc.baseWidget.prototype;

        $('.form, .tab-box.tabs-top').each(function (i, element)
        {
            $(element).SFCForm();
        });
    });
})($);
