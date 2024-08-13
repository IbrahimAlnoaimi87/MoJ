(function ($)
{

    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Controls === "undefined" || SourceCode.Forms.Controls === null) SourceCode.Forms.Controls = {};

    SourceCode.Forms.Controls.Twisty = {

        //these options will extend as the control matures
        options: {
            subType: 'STRING',
            items: '',
            setFunction: null,
            getDropItemsFunction: null,
            getSpinOptionsFunction: null,
            mappable: true,
            radioGroup: [{ disabled: false, id: 'twistyPropertyTrue', checked: true, label: Resources.CommonLabels.YesLabelText }, { disabled: false, id: 'twistyPropertyFalse', label: Resources.CommonLabels.NoLabelText }],
            radioLabel: '',
            defaultValues: ['true', 'false', '0', '1', 'yes', 'no'],
            controlID: '',
            validationPattern: '',
            validationMessage: '',
            accept: '.ui-draggable',
            readOnly: false,
            readOnlyValue: '',
            readOnlyType: 'no-icon',
            initializeServerControl: '',
            serverControl: '',
            isCurrent: true,
            subformID: '',
            instanceID: '',
            hasIcon: false,
            subformType: '',
            dropOptions: {
                drop: jQuery.noop(),
                focus: jQuery.noop(),
                keypress: jQuery.noop()
            }
        },

        _create: function ()
        {
            //instantiate global variables
            this.mappingControl = null;
            this.control = null;

            //identify div as twisty-control and default to the mappable control
            this.element.addClass('twisty map');

            var _this = this;

            this.options.subType = this.options.subType.toUpperCase();

            if (this.options.mappable && this._isToggleType())
            {
                //add twisty button
                var buttonDiv = "<div class='input-control-buttons twisty-button'><span class='button-image'></span></div>";
                this.element.append(buttonDiv);
                this.element.find('.twisty-button').on('click', function (ev) { _this._toggleControl(ev); });
            }
            else
            {
                this.element.removeClass('twisty').addClass('without-twisty');
            }

            //create base div for internal toggleable controls 
            var controlDiv = "<div class='mapping-control'></div>";

            //add mapping control
            if (this.options.readOnly)
            {
                this.options.subType = 'READONLY';
            }

            this._createMappableControl($(controlDiv), this.options.subType, this.options.mappable);
            this.mappingControl = this.element.find('.mapping-control');

            //add tokenbox element to control
            this.mappingControl.tokenbox({
                droppableEnabled: this.options.mappable,
                accept: this.options.accept,
                drop: this.options.dropOptions.drop,
                watermark: Resources.CommonPhrases.TokenboxWatermarkText,
                focus: this._controlFocus.bind(this),
                keypress: this.options.dropOptions.keypress,
                change: this._controlChange.bind(this),
            });

            //add validation to tokenbox
            this.mappingControl.siblings('.token-input').on('focusout', function () { _this._dropBlur(); });

            if (!this._isToggleType())
            {
                this.element.removeClass('map').addClass('drop');
                if (!this.options.mappable)
                {
                    this.mappingControl.tokenbox('disable');
                }
            }

            if (this.options.mappable)
            {
                //make element droppable
                this.element.find(".mapping-control").droppable(
                {
                    tolerance: 'pointer',
                    drop: _this._toggleDropControl.bind(_this)
                });
            }

        },

        _controlChange: function (ev)
        {
            this._trigger("change");
        },

        _controlFocus: function (ev)
        {
            this._trigger("focus");

            if (typeof this.options.dropOptions.focus === "function")
            {
                if (!checkExists(ev.originalEvent))
                    ev.originalEvent = ev;
                this.options.dropOptions.focus.apply(this, arguments);
            }
        },

        _isToggleType: function ()
        {
            // Disable ControlExpression for now as opening the Expression Builder from Rules is not being supported at the moment. TFS693960
            return (this.options.subType === 'YESNO' || this.options.subType === 'BOOLEAN' || this.options.subType === 'BOOL' || (this.options.subType === 'COMPLEX' && this.options.radioLabel !== "ControlExpression") || this.options.subType === 'DROP' || this.options.subType === 'READONLY' || this.options.subType === 'SPIN');
        },

        //set the icon and display of a lookup (callback from setFunction)
        setComplexPropertyValue: function (value, control)
        {
            if (!checkExists(value) || value[1] === null || value[1][1].display === '')
            {
                this._setIcons(null);
                control.find("input").val(Resources.CommonLabels.NoneLabelText);
                this.options.complexValue = '';
            }
            else
            {
                this._setIcons(value[1][1].icon);
                control.find("input").val(value[1][1].display);
                control.find('a').trigger("change");
                this.options.complexValue = value[1][0].value;
            }
        },

        _setIcons: function (value) 
        {
            if (checkExists(this.control))
            {
                // Remove Icons
                this.control.removeClass('icon-control');
                if (checkExistsNotEmpty(this._iconsToReset))
                {
                    this.control.removeClass(this._iconsToReset);
                }

                // Set Icons
                if (checkExistsNotEmpty(value))
                {
                    this.control.addClass('icon-control').addClass(value);
                }
                this._iconsToReset = value;
            }
        },

        _getDropOptions: function ()
        {
            var options = {};

            var _optionsFunction = null;

            if (checkExistsNotEmpty(this.options.getDropItemsFunction))
            {
                try
                {
                    _optionsFunction = evalFunction(this.options.getDropItemsFunction);
                }
                catch (x)
                {
                    _optionsFunction = null;
                }

                if (typeof _optionsFunction === "function")
                {
                    options = _optionsFunction();
                }

            }
            else if (checkExists(this.options.items))
            {
                var displayAndValue = this.options.items.split('+');
                options.displays = displayAndValue[0].split('|');
                options.values = options.displays.length > 0 ? displayAndValue[1].split('|') : options.displays;
            }
            return options;
        },

        //initialize the relevant control according to subType: string and int: tokenbox, bool: radioButtonGroup, drop: dropDown, complex: lookup
        _createMappableControl: function (control, subType, mappable)
        {
            switch (subType)
            {
                case 'BOOL':
                case 'BOOLEAN':
                case 'YESNO':
                    var radioGroup = SCRadiobuttonGroup.html({ collapsed: false, id: 'twistyPropertyRadioGroup_' + this.options.radioLabel });
                    control.append(radioGroup);

                    var radio = control.find('.input-control-group.radio').addClass("twisty-radio-group");
                    radio.radiobuttongroup(
                        {
                            change: this._controlChange.bind(this),
                            focus: this._controlFocus.bind(this)
                        });

                    var radioGroup;
                    for (var i = 0, l = this.options.radioGroup.length; i < l; i++)
                    {
                        radioGroup = this.options.radioGroup[i];
                        radioGroup.disabled = !mappable;
                        radioGroup.id = radioGroup.id + "_" + this.options.radioLabel;
                        radioGroup.name = this.options.radioLabel;
                        radio.radiobuttongroup('add', radioGroup);
                    }

                    this.element.append(control);

                    this.control = radio;
                    break;

                case 'DROP':

                    var options = this._getDropOptions();
                    var select = this._buildDropOptions(options, control);
                    control.append($(select));
                    this.element.append(control);
                    select = this.element.find('select');

                    select.toggleClass('icon-control', this.options.hasIcon);
                    select.dropdown({ allowEmptyFirstItem: true });

                    if (!mappable)
                    {
                        select.dropdown('disable');
                    }

                    this.control = select;
                    break;

                case 'SPIN':
                    var spinnerHtmlOptions = {};

                    if (mappable)
                    {
                        spinnerHtmlOptions.inputsLength = 1;
                    }

                    var editItemSpinner = jQuery(SCSpinner.html(spinnerHtmlOptions));

                    control.append(editItemSpinner);

                    this.element.append(control);

                    this.control = editItemSpinner;

                    var editItem = editItemSpinner.find(".spinner-text-input");
                    var spinnerExtendedOptions = this.options.getSpinOptionsFunction;
                    var functionReturn;

                    if (checkExistsNotEmpty(spinnerExtendedOptions))
                    {
                        var spinnerOptionsFunction = (spinnerExtendedOptions.contains(".")) ? evalFunction(spinnerExtendedOptions) : this[spinnerExtendedOptions];
                        if (checkExistsNotEmpty(spinnerOptionsFunction))
                        {
                            var spinnerOptions = spinnerOptionsFunction();

                            if (checkExistsNotEmpty(spinnerOptions.eventsHandler))
                            {
                                functionReturn = spinnerOptions.eventsHandler;
                            }

                            editItemSpinner.spinner(spinnerOptions);
                        }
                        else
                        {
                            console.error("function not found: " + spinnerExtendedOptions);
                            return;
                        }
                    }
                    else
                    {
                        console.error("attribute GetSpinOptionsFunction not set");
                        return;
                    }

                    if (checkExistsNotEmpty(functionReturn))
                    {
                        evalFunction(functionReturn)("scp", editItem, this.options.controlID);
                    }

                    if (!mappable)
                    {
                        editItemSpinner.spinner("disable");
                    }

                    editItem.trigger("blur");

                    break;

                case 'COMPLEX':
                    var lookup = SCLookupBox.html({ disabled: !mappable });
                    control.append(lookup);
                    control.find('.lookup-box').lookupbox({});
                    control.find("input.input-control[type='text']").val(Resources.CommonLabels.NoneLabelText);
                    control.find("input.input-control[type='text']").prop('readonly', true);
                    this.element.append(control);
                    this.control = this.element.find('.lookup-box');

                    var setFunction = this.options.setFunction;
                    var initServerControl = this.options.initializeServerControl;
                    var serverControl = this.options.serverControl;
                    var controlID = this.options.controlID;
                    var isCurrent = this.options.isCurrent ? 'True' : 'False';
                    var subformID = this.options.subformID;
                    var subformType = this.options.subformType;
                    var contextType = this.options.contextType;
                    var contextID = this.options.contextID;
                    var targetXml = this.options.targetXml;
                    var _this = this;

                    if (checkExists(setFunction) && setFunction !== '')
                    {
                        var lastIndex = setFunction.lastIndexOf('.');
                        setFunction = setFunction.substr(lastIndex + 1, setFunction.length - lastIndex);
                    }

                    if (mappable)
                    {
                        this.control.find('a').off('click');

                        if (checkExists(setFunction) && setFunction !== '')
                        {
                            this.control.find('a').on('click', function (e)
                            {
                                var fn = SourceCode.Forms.Designers.Common.Context[setFunction];
                                fn(e, _this, controlID, isCurrent, subformID, subformType, contextType, contextID, targetXml);
                            });
                        }
                        else if (checkExists(initServerControl) && initServerControl !== '')
                        {
                            this.control.find('a').attr('initializeServerControl', initServerControl);
                            this.control.find('a').attr('serverControl', serverControl);
                            this.control.find('a').on('click', { context: _this }, SourceCode.Forms.Designers.Common.Context._showInternalComplexPropertyPopup);
                        }
                    }
                    break;

                case 'READONLY':
                    var label = $("<div class='readonly-property " + this.options.readOnlyType + "'>" + this.options.readOnlyValue + "</div>");
                    control.append(label);

                    this.element.append(control);

                    this.control = this.element.find('div.readonly-property');
                    break;

                default:
                    var watermarkText = mappable ? Resources.CommonPhrases.TextboxWatermarkText : "";
                    var textBox = SCTextbox.html({ disabled: !mappable, watermark: watermarkText });
                    control.append(textBox);
                    control.find('.text-input').textbox({});

                    this.element.append(control);

                    this.control = this.element.find('.text-input');
                    break;
            }
        },

        //is fired when the twisty button is clicked
        _toggleControl: function (ev)
        {
            this._clearControls();
            if (this.element.is('.drop'))
            {
                this.element.removeClass('drop').addClass('map');
                this.element.find('.button-image').removeClass('drop').addClass('map');
            }
            else
            {
                this.element.removeClass('map').addClass('drop');
                this.element.find('.button-image').removeClass('map').addClass('drop');
            }
            this._trigger("toggle", ev, { control: this.control, twisty: this.element });
        },

        //is fired when a token is dropped on a mappable control
        _toggleDropControl: function (ev, ui)
        {
            var tokenboxElement = this.element.find('.mapping-control');
            var isInDropState = this.element.hasClass("drop");

            if (!isInDropState) //if the twisty is already in the drop state, it will already have added the token through the tokenbox drop event.
                // if it's in mapping state, we need to switch it to drop state, and then build the token to drop
            {
                this.element.removeClass('map').addClass('drop');
                this.element.find('.button-image').removeClass('map').addClass('drop');

                tokenboxElement.tokenbox('value', this._buildTokenboxValue(ui.draggable.parent().metadata()));

                this._trigger("toggle", ev, { control: this.control, twisty: this.element });
            }

            this.mappingControl.tokenbox("focus");
        },

        //add the options to the dropDown
        _buildDropOptions: function (options, control)
        {
            //add select to control
            control.append("<select class='input-control select-box'></select>");
            //if options are available it will be formatted as [Pipe delimited list of Display Values]&[Pipe delimited list of Values]
            //extract display values and values from options string

            var select = control.find('select');

            if (checkExists(options) && checkExists(options.displays) && options.displays.length > 0)
            {
                //construct and add option element to select
                var option = "<option class='{2}' value='{0}'>{1}</option>";
                var iconClassesExist = checkExists(options.iconClasses) && options.iconClasses.length>=options.displays.length;

                for (var i = 0, l = options.displays.length; i < l; i++)
                {
                    if (iconClassesExist)
                    {
                        select.append($(option.format(options.values[i], options.displays[i], options.iconClasses[i])));
                    }
                    else
                    {
                        select.append($(option.format(options.values[i], options.displays[i], options.values[i])));
                    }
                }
            }

            return select;
        },

        //validate a tokenbox upon focus out according to the specified validation pattern and display the specified message
        _dropBlur: function ()
        {
            var value = this.mappingControl.tokenbox('value');

            if (value.length === 1 && (value[0].type !== 'context') && (checkExists(this.options.validationPattern) && (this.options.validationPattern !== "")))
            {
                validationFailedMsg = value[0].data.test(this.options.validationPattern);

                if (!validationFailedMsg)
                {
                    validationFailedMsg = Resources.ControlProperties[this.options.validationMessage];
                }
                else
                {
                    validationFailedMsg = '';
                }

                if (validationFailedMsg !== '')
                {
                    popupManager.showError(validationFailedMsg);
                    this.mappingControl.tokenbox('clear').tokenbox('focus');
                }
            }
            else if (value.length === 1 && (value[0].type !== 'context') &&
                (this.options.subType === 'BOOL' || this.options.subType === 'BOOLEAN' || this.options.subType === 'YESNO')
                && (checkExists(this.options.defaultValues)))
            {
                //validation for Bool type properties, because these values do not have explicit VP in the control properties definition
                if (!(this.options.defaultValues.contains(value[0].data.toLowerCase())))
                {
                    //build a sentence friendly version of the defaultValues to be added to the error message
                    var lastValue = this.options.defaultValues.pop();
                    var friendlyList = this.options.defaultValues.join(', ') + ' or ' + lastValue;

                    validationFailedMsg = Resources.ControlProperties.InvalidBoolValue.format(friendlyList);
                    popupManager.showError(validationFailedMsg);
                    this.mappingControl.tokenbox('clear').tokenbox('focus');

                    //put back the last value
                    this.options.defaultValues.push(lastValue);
                }
            }

        },

        //add dropped context to the tokenbox
        _buildTokenboxValue: function (metadata)
        {
            var result = {};
            var results = [];

            //build result object
            result.type = 'context';
            result.text = metadata.DisplayName;
            result.data = metadata;

            //add result object to array
            results.push(result);

            return results;
        },

        clear: function ()
        {
            this._clearControls();
        },

        //reset the control to its default state unless it is of type string or int (must remain droppable)
        reset: function ()
        {
            if (this._isToggleType())
            {
                this.element.removeClass('drop').addClass('map');
            }
            this._clearControls();
        },

        //remove values from mappable and droppable control
        _clearControls: function ()
        {
            this.mappingControl.tokenbox('clear').tokenbox('blur');

            switch (this.options.subType)
            {
                case 'BOOL':
                case 'BOOLEAN':
                case 'YESNO':
                    this.element.find('.input-control-group.radio').radiobuttongroup('clear');
                    break;

                case 'DROP':
                    this.element.find('select').dropdown('SelectedIndex', 0);
                    this.element.find('select').dropdown("refreshDisplay");
                    break;

                case 'SPIN':
                    this.control.spinner("reset");
                    break;

                case 'COMPLEX':
                    this.setComplexPropertyValue(null, this.control);
                    break;
            }

        },

        //returns the value of the mappable control
        _getValue: function ()
        {
            switch (this.options.subType)
            {
                case 'BOOL':
                case 'BOOLEAN':
                case 'YESNO':
                    var value = this.control.radiobuttongroup('value');
                    var value = value === Resources.CommonLabels.YesLabelText ? 'true' : (value === Resources.CommonLabels.NoLabelText ? 'false' : value);
                    return value;
                    break;

                case 'DROP':
                    return this.control.dropdown('SelectedValue');
                    break;

                case 'SPIN':
                    return this.control.spinner('value')[0];
                    break;

                case 'COMPLEX':
                    return checkExists(this.options.complexValue) ? this.options.complexValue : "";
                    break;

                default:
                    return this.mappingControl.tokenbox('value');
                    break;
            }

        },

        //Sets the value of the necessary control
        _setValue: function (value)
        {
            //If there is no context element present determine if the value can be displayed using the mappable control
            if (value.length === 1 && (value[0].type === 'value' || value[0].selectionType === "complex"))
            {
                var result = this._determineControlForValue(value[0].data);

                switch (result.type)
                {
                    case 'bool':
                    case 'boolean':
                        var val = value[0].data.toLowerCase();

                        if (result.defaultValue)
                        {
                            //for now assume values will be Boolean TODO: Extend to accept any default values
                            var defaultValue = (val === 'true' || val === '1' || val === 'yes');
                            this.control.radiobuttongroup('value', defaultValue ? Resources.CommonLabels.YesLabelText : Resources.CommonLabels.NoLabelText);
                        }
                        else if (checkExists(result.value))
                        {
                            this.control.radiobuttongroup('value', result.value);
                        }
                        else
                        {
                            if (this.element.is('.map'))
                            {
                                this.element.removeClass('map').addClass('drop');
                            }

                            this.mappingControl.tokenbox('value', value);
                        }
                        break;

                    case 'drop':
                        this.control.dropdown('SelectedValue', result.value);
                        this.control.dropdown("refresh");
                        break;

                    case 'spin':
                        this.control.spinner('value', [result.value]);
                        break;

                    case 'complex':
                        this.setComplexPropertyValue(result.data, this.control);
                        break;

                    default:
                        if (this.element.is('.map'))
                        {
                            this.element.removeClass('map').addClass('drop');
                        }
                        this.mappingControl.tokenbox('value', value);
                        break;
                }
            }
            else
            {
                if (this.element.is('.map'))
                {
                    this.element.removeClass('map').addClass('drop');
                }

                this.mappingControl.tokenbox('value', value);
            }
        },

        //Check to see if a value can be represented with the mappable control or a tokenbox
        _determineControlForValue: function (value)
        {
            //Create result object
            //Return type of control to use as well as whether a bool value falls within a specified range of default values (this will be True/False and all accepted alternatives
            var result = {};
            result.type = this.options.subType;
            result.defaultValue = false;
            result.value = '';

            switch (this.options.subType)
            {
                case 'BOOL':
                case 'BOOLEAN':
                case 'YESNO':
                    //disregard case
                    value = value.toLowerCase();

                    //Determine if the value is within the acceptable range of default values
                    for (var i = 0, l = this.options.defaultValues.length; i < l; i++)
                    {
                        if (value === this.options.defaultValues[i])
                        {
                            result.defaultValue = true;
                            result.type = 'bool';
                            break;
                        }
                    }

                    if (!result.defaultValue)
                    {
                        //If value is not contained within the default values check to see if the value is equal to any of the radio buttons' labels
                        for (var i = 0, l = this.options.radioGroup.length; i < l; i++)
                        {
                            if (value === this.options.radioGroup[i].label.toLowerCase())
                            {
                                result.type = 'bool';
                                result.value = this.options.radioGroup[i].label;
                                break;
                            }
                        }
                    }
                    break;

                case 'COMPLEX':
                    if (typeof value === "string" && this.options.mappable && this._isToggleType())
                    {
                        result.type = "string";
                    }
                    else
                    {
                        var valueSet = ['', [{ display: '', value: '' }, { display: '', icon: '' }]];
                        valueSet[1][1].icon = value.icon;

                        if (value.ItemType === "Expression")
                        {
                            valueSet[1][1].display = checkExistsNotEmpty(value.DisplayName) ? value.DisplayName : value.text;
                            valueSet[1][0].display = checkExistsNotEmpty(value.DisplayName) ? value.DisplayName : value.text;
                            valueSet[1][0].value = value;
                        }
                        else
                        {
                            valueSet[1][1].display = value.display;
                            valueSet[1][0].display = value.value;
                            valueSet[1][0].value = value.value;
                        }

                        result = { type: 'complex', data: valueSet };
                    }
                    break;

                case 'DROP':
                    //Determine the values of the dropdown
                    var options = this._getDropOptions();
                    var upperCaseValue = value.toUpperCase();
                    if (checkExists(options) && checkExists(options.displays) && options.displays.length > 0)
                    {
                        for (var i = 0, l = options.values.length; i < l; i++)
                        {
                            var optionValue = options.values[i];
                            if (upperCaseValue === optionValue.toUpperCase())
                            {
                                result.type = 'drop';
                                result.value = optionValue;
                                break;
                            }
                        }
                    }
                    break;

                case 'SPIN':
                    if ((checkExists(value.toString())) && (!this.control.spinner("validateValue", [value.toString()]).failedValidation))
                    {
                        result.type = "spin";
                        result.value = [value.toString()];
                    }
                    else
                    {
                        result.type = "string";
                    }
                    break;
            }
            return result;
        },

        //return the current visible control
        control: function ()
        {
            return this.element.is('.map') ? this.control : this.mappingControl;
        },

        _getBoolValue: function (value)
        {
            if (value.length === 1 && value[0].type === 'value')
            {
                var defaultValue = ['true', '1', 'yes'].contains(value[0].data.toLowerCase()).toString();

                value[0].data = defaultValue;
                value[0].text = defaultValue;
            }
            return value;
        },

        //getter and setter
        value: function (value)
        {
            if (checkExists(value))
            {
                this._setValue(value);
            }
            else
            {
                var result = {};
                var results = [];

                if (this.element.is('.map'))
                {
                    result.value = this._getValue();
                    if (result.value.ItemType === "Expression")
                    {
                        result.type = 'context';
                    }
                    else
                    {
                        result.type = 'value';
                    }
                    result.data = result.value;
                    results.push(result);
                }
                else
                {
                    if (this.options.subType !== 'BOOL' && this.options.subType !== 'BOOLEAN' && this.options.subType !== 'YESNO')
                    {
                        results = this.mappingControl.tokenbox('value');
                    }
                    else
                    {
                        results = this._getBoolValue(this.mappingControl.tokenbox('value'));
                    }
                }

                return results;
            }
        }
    };

    if (typeof SCTwisty === "undefined") SCTwisty = SourceCode.Forms.Controls.Twisty;

    $.widget("ui.twisty", SourceCode.Forms.Controls.Twisty);

    $.extend($.ui.twisty, {
        getter: "value",
        setter: "value"
    });
})(jQuery);
