(function ($)
{

    // Namespacing the Designer
    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Designers === "undefined" || SourceCode.Forms.Designers === null) SourceCode.Forms.Designers = {};
    if (typeof SourceCode.Forms.Designers.View === "undefined" || SourceCode.Forms.Designers.View === null) SourceCode.Forms.Designers.View = {};

    var _propertyGrid = SourceCode.Forms.Designers.View.PropertyGrid = {
        _create: function (options)
        {
            if (_propertyGrid.element)
            {
                _propertyGrid.element.remove();
            }

            _propertyGrid.id = options.id;
            _propertyGrid.controlid = options.controlid;
            _propertyGrid.readonly = options.readonly;
            _propertyGrid.definitionxml = options.definitionxml;
            _propertyGrid.valuexml = options.valuexml;
            _propertyGrid.categories = [];
            _propertyGrid.properties = [];
            _propertyGrid.container = options.container;
            _propertyGrid.element = _propertyGrid.render(options);
            _propertyGrid.isDirty = false;

            _propertyGrid.container.empty();
            _propertyGrid.container.append(_propertyGrid.element);

            jQuery('.propertyGrid').on('write', { grid: _propertyGrid }, _propertyGrid.WritePropertiesXml);
            jQuery('.propertyGridCategoryToggle').on('click', { grid: _propertyGrid }, _propertyGrid.togglePropertyCategoryState.bind(this));
            jQuery('.propertyGridEditComplexButton').on('click', { grid: _propertyGrid }, _propertyGrid.AJAXCall._showComplexPropertyPopup);
            jQuery('.propertyGridPropertyEditCheckBox').on('click', { grid: _propertyGrid }, _propertyGrid._checkBoxChanged);
            jQuery('.propertyGridPropertyEdit').on('change', { grid: _propertyGrid }, _propertyGrid.WritePropertiesXml);

            jQuery('input.propertyGridPropertyEdit').on("focus", function ()
            {
                _propertyGrid.lastFocus = jQuery(this);
                _propertyGrid.lastValue = jQuery(this).val();
            });

            jQuery('.propertyGrid').parent().on("scroll", function ()
            {
                jQuery(this).find("select").filter(function ()
                {
                    return jQuery(this).next(".dropdown-box.active").length > 0;
                }).dropdown("hidedropdown");
            });

            //TODO: TD 0015
            //BEGIN HACK to disable the Field and DisplayName Properties
            //When the view has no smartobject or the control is in the wrong place for binding

            var fieldAndDisplayNamePropLookup = jQuery(".field-property .lookup-box, .displayfield-property .lookup-box");

            var viewHasSmartObject = checkExistsNotEmpty(_propertyGrid.View.SelectedSmartObjectGuid);
            var viewIsEditableListAndControlInToolbarOrFooter = _propertyGrid.View.SelectedViewType === "CaptureList" && (_propertyGrid.View.selectedObject.closest(".toolbar").length > 0 || _propertyGrid.View.selectedObject.closest(".footer").length > 0);

            if (fieldAndDisplayNamePropLookup.length > 0 && (!viewHasSmartObject || viewIsEditableListAndControlInToolbarOrFooter))
            {
                fieldAndDisplayNamePropLookup.lookupbox("disable");
                fieldAndDisplayNamePropLookup.off();
                fieldAndDisplayNamePropLookup.find(".propertyGridEditComplexButton").off();
                fieldAndDisplayNamePropLookup.find(".propertyGridPropertyEdit").off();

            }
            //END HACK

            //Disable view ControlName property if the view's name is disabled
            var viewNameUnauthProp = $(".unAuthorized");

            if (checkExistsNotEmpty(viewNameUnauthProp))
            {
                var viewNameUnauthPropTextbox = viewNameUnauthProp.parents(".input-control.text-input");

                if (!viewNameUnauthPropTextbox.hasClass("disabled"))
                {
                    viewNameUnauthPropTextbox.textbox("disable");
                    viewNameUnauthPropTextbox.addClass("disabled");
                }
            }

            _propertyGrid._applyBadgingToCategories(_propertyGrid.element);

            _propertyGrid._enableDisablePreventXSS();

            return _propertyGrid;
        },

        render: function ()
        {
            var definitionDoc = _propertyGrid.definitionxml;

            var mainGrid = jQuery('<div id="' + _propertyGrid.id + '"></div>');
            mainGrid.addClass('propertyGrid');

            var defProps = definitionDoc.selectNodes('Properties/Prop[not(@Visibility="None")]');
            var controlNameProp = definitionDoc.selectSingleNode('Properties/Prop[@ID="ControlName"]');
            var valuesDoc = parseXML(_propertyGrid.valuexml);

            for (var i = 0; i < defProps.length; i++)
            {
                var propElem = defProps[i];

                var propId = propElem.getAttribute('ID');
                var controlType = propElem.parentNode.parentNode.parentNode.selectSingleNode("Name").text;

                var options =
                    {
                        controlType: controlType,
                        propertyId: propId,
                        controlId: _propertyGrid.controlid,
                        subDesignerType: "propertygrid"
                    };
                var isVisible = SourceCode.Forms.Designers.Common.getPropertyDisplayFunctionResult(options);

                if (!isVisible)
                {
                    //skip rendering
                    continue;
                }

                var propDisplayName = propElem.getAttribute('friendlyname');
                var propTooltip = propElem.getAttribute('tooltip');
                var propType = propElem.getAttribute('type');
                var propInputLength = propElem.getAttribute('inputlength');
                var propSetFunction = propElem.getAttribute('setFunction');
                var propGetFunction = propElem.getAttribute('getFunction');
                var propInitializeServerControl = propElem.getAttribute('InitializeServerControl');
                var propServerControl = propElem.getAttribute('ServerControl');
                var propServerControlType = propElem.getAttribute('serverControlType');
                var propReadOnly = propElem.getAttribute('ReadOnly');
                var propSelectionValues = propElem.getAttribute('SelectionValue');
                var propSelectionText = propElem.getAttribute('SelectionText');
                var propSelectionIcons = propElem.getAttribute('SelectionIcons');
                var propShowConditionProperty = propElem.getAttribute('showconditionproperty');
                var propShowConditionValue = propElem.getAttribute('showconditionvalue');
                var propDropItemsFunction = propElem.getAttribute('getDropItemsFunction');
                var propClearFunction = propElem.getAttribute('ClearServerControl');
                var serverValidateFunction = propElem.getAttribute('ServerValidate');
                var propDesignerSet = propElem.getAttribute('DesignerSet');
                var propDesignerGet = propElem.getAttribute('DesignerGet');
                var propDesignerValidate = propElem.getAttribute('DesignerValidate');
                var propDesignerClear = propElem.getAttribute('DesignerClear');
                var propText = propElem.getAttribute('Text');
                var validationPattern = propElem.getAttribute('ValidationPattern');
                var validationMessage = propElem.getAttribute('ValidationMessage');
                var getSpinOptionsFunction = propElem.getAttribute('GetSpinOptionsFunction');
                var showIcon = propElem.getAttribute('showIcon');
                showIcon = (checkExists(showIcon) && showIcon.toLowerCase() === "true");

                var defaultValue = '';
                var defaultValueElem = propElem.selectSingleNode('Value');
                if (defaultValueElem)
                    defaultValue = defaultValueElem.text;

                var catName = propElem.getAttribute('category');
                var collapseCategory = propElem.getAttribute('collapseCategory');

                var catId = (_propertyGrid.id + '_category_' + catName).replaceAll(' ', '_');
                var catItem = _propertyGrid.getCategory(catId);

                if (checkExists(catItem) && checkExists(collapseCategory) && collapseCategory == 'true')
                {
                    var categoryBody = catItem.find(".propertyGridCategoryBody");

                    if (categoryBody.hasClass("open"))
                    {
                        var categoryToggle = catItem.find(".propertyGridCategoryToggle");
                        this._collapsePropertyCategory(categoryToggle, categoryBody);
                    }
                }

                var propItemId = (_propertyGrid.id + '_property_' + propId).replaceAll(' ', '_');
                var propItem = _propertyGrid.getProperty(propItemId);

                if (!catItem)
                {
                    //create the category
                    var catOptions = { id: catId, name: catName };
                    catItem = new _propertyGrid._PropertyGridCategory2(catOptions);
                    mainGrid.append(catItem);
                    _propertyGrid.categories.push(catItem);
                }

                if (!propItem)
                {
                    var PropValues = _propertyGrid.getPropertySetValue({ property: propId, defaultPropertyNode: propElem, valuesDoc: valuesDoc });

                    var dependency = {};

                    switch (propId)
                    {
                        case "ConditionalStyles":
                            dependency = SourceCode.Forms.Designers.Common
                                .checkControlConditionalStylesHasDependencyIssue(_propertyGrid.controlid);
                            break;
                        default:
                            dependency = SourceCode.Forms.Designers.Common
                                .checkControlPropertyHasDependencyIssue(_propertyGrid.controlid, propId);
                            break;

                    }

                    var dependencyHasError = null;
                    var dependencyErrorMessage = null;

                    if (checkExistsNotEmpty(dependency))
                    {
                        dependencyHasError = dependency.hasError;
                        dependencyErrorMessage = dependency.errorMessage;
                    }

                    //create prop item
                    var propOptions = {
                        id: propId,
                        name: propDisplayName,
                        tooltip: propTooltip,
                        type: propType,
                        inputLength: propInputLength,
                        setFunction: propSetFunction,
                        getFunction: propGetFunction,
                        initializeServerControl: propInitializeServerControl,
                        serverControl: propServerControl,
                        serverControlType: propServerControlType,
                        readonly: propReadOnly,
                        categoryItem: catItem,
                        categoryName: catName,
                        setValue: PropValues.value,
                        setDisplay: PropValues.display,
                        selectionValues: propSelectionValues,
                        selectionText: propSelectionText,
                        selectionIcons: propSelectionIcons,
                        defaultValue: defaultValue,
                        propertySetPath: PropValues.path,
                        showconditionproperty: propShowConditionProperty,
                        showconditionvalue: propShowConditionValue,
                        grid: _propertyGrid,
                        dropItemsFunction: propDropItemsFunction,
                        clearFunction: propClearFunction,
                        designerSet: propDesignerSet,
                        designerGet: propDesignerGet,
                        text: propText,
                        designerValidate: propDesignerValidate,
                        designerClear: propDesignerClear,
                        validationPattern: validationPattern,
                        validationMessage: validationMessage,
                        serverValidate: serverValidateFunction,
                        icon: PropValues.icon,
                        getSpinOptionsFunction: getSpinOptionsFunction,
                        hasDependencyError: dependencyHasError,
                        dependencyErrorMessage: dependencyErrorMessage,
                        controlType: controlType,
                        showIcon: showIcon
                    };

                    propItem = new _propertyGrid._PropertyGridItem2(propOptions);
                }
            }

            _propertyGrid._applyBadgingToCategories(mainGrid);

            _propertyGrid._enableDisablePreventXSS();

            return mainGrid;
        },

        refresh: function ()
        {
            var xmlDoc = parseXML(_propertyGrid.valuexml);
            var definitionDoc = _propertyGrid.definitionxml;
            var defProps = definitionDoc.selectNodes('Properties/Prop');
            var defaultValue = '';
            var defaultValueElem = null;
            var defProp = null;
            //TODO FIX Selector and investigate need
            var properties = jQuery('.propertyGridPropertyEdit,.propertyGridPropertyEditCheckBox').not("[title='Styles'],[title='Conditional Styles']");

            for (var i = 0; i < properties.length; i++)
            {
                var propItem = jQuery(properties[i]);

                var id = propItem.data('id');
                var type = propItem.data('type');
                var xPath = propItem.data('propertySetPath');
                var designerGet = propItem.data('designerGet');

                if ($chk(xPath) === true && !$chk(designerGet))
                {
                    var propElem = xmlDoc.selectSingleNode(xPath);
                    var defaultPropertyNode = definitionDoc.selectSingleNode('Properties/Prop[@ID="{0}"]'.format(id));
                    var result = this.getPropertySetValue({ property: id, defaultPropertyNode: defaultPropertyNode, valuesDoc: xmlDoc });
                    var value = result.value;
                    var display = result.display;

                    propItem.data('value', value);
                    propItem.data('display', display);

                    if (propItem.data('isReadOnly') === true)
                    {
                        propItem.text(display);
                        propItem.attr('title', display);
                    }
                    else
                    {
                        switch (type)
                        {
                            case 'string':
                                propItem.val(value);
                                break;
                            case 'int':
                                propItem.val(value);
                                break;
                            case 'drop':
                                var index = 0;
                                for (var j = 0; j < propItem[0].length; j++)
                                {
                                    var option = jQuery(propItem[0][j]);
                                    if (option.val() === value)
                                    {
                                        index = j;
                                        break;
                                    }
                                }
                                propItem.dropdown('SelectedIndex', index);
                                propItem.dropdown('refresh');
                                break;
                            case 'bool':
                                propItem[0].checked = (value === true || value === 'true');
                                break;
                            case 'complex':
                                var $lookupBox = propItem.closest('.lookup-box').addClass('icon-control').removeClass('smartobject').removeClass('staticdata').removeClass('pattern').removeClass('unknown');
                                display = checkExistsNotEmpty(display) ? display : this._lookupDefaultValues({ id: id, setValue: value });
                                if (!!value && display !== Resources.CommonLabels.NoneLabelText)
                                {
                                    var _iconClass;
                                    if (checkExists(result.icon))
                                    {
                                        _iconClass = result.icon;
                                    }
                                    else
                                    {
                                        //TODO: TD 0017
                                        switch (propItem.data().serverControlType)
                                        {
                                            case 'property':
                                                switch (value)
                                                {
                                                    case 'SmartObject':
                                                        _iconClass = 'smartobject';
                                                        break;

                                                    case 'Static':
                                                        _iconClass = 'staticdata';
                                                        break;
                                                }

                                                break;

                                            case 'smartobject':
                                                _iconClass = 'smartobject';

                                                break;
                                            case 'workflow':
                                                _iconClass = 'workflow';
                                                break;

                                            default:
                                                switch (id)
                                                {
                                                    case 'Source':
                                                        _iconClass = 'picture';
                                                        break;
                                                    case 'ValidationPattern':
                                                        _iconClass = 'pattern';
                                                        break;
                                                    case 'ControlExpression':
                                                        _iconClass = 'expression';
                                                        break;
                                                    case "CalendarPicker":
                                                        $lookupBox.removeClass("datetime date time");
                                                        switch (value)
                                                        {
                                                            case "dateTimePicker":
                                                                _iconClass = 'datetime';
                                                                break;
                                                            case "datePicker":
                                                                _iconClass = 'date';
                                                                break;
                                                            case "timePicker":
                                                                _iconClass = 'time';
                                                                break;
                                                            default:
                                                                _iconClass = 'date';
                                                                break;
                                                        }
                                                        break;
                                                    case 'FullProcName':
                                                        _iconClass = 'workflow';
                                                        break;
                                                    case 'Field':
                                                        _iconClass = '';
                                                        break;
                                                    default:
                                                        _iconClass = 'unknown';
                                                        break;
                                                }

                                                break;
                                        }
                                    }
                                    $lookupBox.addClass(_iconClass);
                                }
                                else
                                {
                                    propItem.closest('.lookup-box').removeClass('icon-control');
                                }

                                propItem.val(display);
                                propItem.attr('title', display);
                                break;
                        }
                    }

                }
                else if ($chk(designerGet))
                {
                    var fn = eval(designerGet);

                    if (propItem.is('input'))
                    {
                        propItem.val(fn());
                    }
                    else
                    {
                        propItem.text(fn());
                    }
                }
            }
        },

        /// <summary>
        /// Update to a field in the property grid with the updateOptions
        /// </summary>
        /// <param name="event"></param>
        /// <param name="updateOptions">
        ///    controlId: Id of the control to update
        ///    propertyName: Property name of the control to update
        ///    propertyValue: Property value to update
        /// </param >
        /// <returns>property value updated</returns>
        updateControlPropertyField: function (updateOptions)
        {
            if (!checkExists(updateOptions) || _propertyGrid.controlid !== updateOptions.controlId)
            {
                return null;
            }

            var controlId = updateOptions.controlId;
            var propertyName = updateOptions.propertyName;
            var propertyValue = updateOptions.propertyValue;

            var textBox = _propertyGrid.container.find(".propertyGridPropertyItem.{0}-property .input-control.propertyGridPropertyEdit".format(propertyName));

            textBox.val(propertyValue);

            return propertyValue;
        },

        getCategory: function (id)
        {
            var category = null;
            for (var x = 0; x < _propertyGrid.categories.length; x++)
            {
                var catItem = _propertyGrid.categories[x];
                if (catItem)
                {
                    if (catItem.attr('id') === id)
                    {
                        category = catItem;
                        x = _propertyGrid.categories.length;
                    }
                }
            }
            return category;
        },

        getProperty: function (id)
        {
            var category = null;
            for (var x = 0; x < _propertyGrid.categories.length; x++)
            {
                var catItem = _propertyGrid.categories[x];
                if (catItem)
                {
                    if (catItem.attr('id') === id)
                    {
                        category = catItem;
                        x = _propertyGrid.categories.length;
                    }
                }
            }
            return category;
        },

		/**
		 * Retreives the value, display value and icon for a property of in the property grid.
		 *	takes into account default value if there was no value set
		 *	fires GetDisplay if it exists for the property
		 * @param options {object}
		 *	property - the id of the property
		 *	defaultPropertyNode - the default node for the property
		 *	valuesDoc- (optional) the xml docuement containing the current set values for all properties
		 * @return {object}
		 *	value
		 *	display
		 *	icon
		 */
        getPropertySetValue: function (options)
        {
            if (!checkExists(options.valuesDoc))
            {
                options.valuesDoc = parseXML(_propertyGrid.valuexml);
            }
            var propXPath = 'Controls/Control[@ID="' + _propertyGrid.controlid + '"]/Properties/Property[Name="' + options.property + '"]';
            var propertyElem = options.valuesDoc.selectSingleNode(propXPath);

            var retVal = { value: null, display: null, path: propXPath };

            if (propertyElem)
            {
                retVal.value = propertyElem.selectSingleNode('Value').text;
                if (checkExists(propertyElem.selectSingleNode('DisplayValue')))
                {
                    retVal.display = propertyElem.selectSingleNode('DisplayValue').text;
                }
                if (!checkExists(retVal.display))
                {
                    retVal.display = retVal.value;
                }
            }
            else
            {
                var defaultValue = options.defaultPropertyNode.selectSingleNode("Value");
                if (checkExists(defaultValue))
                {
                    retVal.value = defaultValue.text;
                    retVal.display = retVal.value;
                }
                if (!checkExists(retVal.value))
                {
                    retVal.value = "";
                    retVal.display = retVal.value;
                }
            }

            //always run GetDisplay
            //GetDisplay will be depreciated
            var displayFunction = options.defaultPropertyNode.getAttribute('GetDisplay');

            //TODO: DEPRECATED 106 Field should implement GetDisplay
            if (!checkExists(displayFunction) && options.property === "Field")
            {
                displayFunction = "ControlUtil.getFieldDisplay";
            }

            if (checkExists(displayFunction))
            {
                var controlTypeName = "";
                if (checkExistsNotEmpty(options.defaultPropertyNode.parentNode) && checkExistsNotEmpty(options.defaultPropertyNode.parentNode.parentNode) && checkExistsNotEmpty(options.defaultPropertyNode.parentNode.parentNode.parentNode))
                {
                    controlTypeName = options.defaultPropertyNode.parentNode.parentNode.parentNode.selectSingleNode("Name").text;
                }
                var fn = SourceCode.Forms.Designers.Common.getControlTypeFunction(controlTypeName, options.property, "GetDisplay", displayFunction);
                if (checkExists(fn))
                {
                    var result = fn(options.property, retVal.value);
                    if (checkExists(result.display))
                    {
                        retVal.display = result.display;
                    }
                    retVal.icon = result.icon;
                }
            }

            var propertyResolver = options.defaultPropertyNode.getAttribute('DesignerPropertyResolver');
            if (checkExists(propertyResolver))
            {
                var controlTypeName = options.defaultPropertyNode.parentNode.parentNode.parentNode.selectSingleNode("Name").text;
                var fn = SourceCode.Forms.Designers.Common.getControlTypeFunction(controlTypeName, options.property, "DesignerPropertyResolver", propertyResolver);
                if (checkExists(fn))
                {
                    var context =
                        {
                            property: options.property, // the property's name
                            value: retVal.value, // the current property value
                            display: retVal.display, // the current property display
                            icon: retVal.icon, // the current property icon
                            resolveDirection: "TO-PROPERTY-UI" //TO-PROPERTY-UI reflects that we are updating the UI. TO-PROPERTY-XML that we are updating the property xml that gets saved
                        };
                    fn(context);
                    retVal.display = context.display;
                    retVal.icon = context.icon;
                    retVal.value = context.value;
                }
            }

            //Fallbacks where items are annotated
            if ((!checkExistsNotGuid(retVal.display)) && checkExists(propertyElem))
            {
                var validationMessages = propertyElem.getAttribute("ValidationMessages");

                if (checkExistsNotEmpty(validationMessages))
                {
                    var resourceSvc = SourceCode.Forms.Services.AnalyzerResourcesService();
                    var messages = resourceSvc.parseValidationMessage(validationMessages);
                    var firstValidationMessage = messages[0];

                    if (checkExistsNotEmpty(firstValidationMessage.displayName))
                    {
                        retVal.display = firstValidationMessage.displayName
                    }
                    else if (checkExistsNotEmpty(firstValidationMessage.name))
                    {
                        retVal.display = firstValidationMessage.name
                    }
                    else if (firstValidationMessage.type === "Object")
                    {
                        retVal.display = resourceSvc.getEmptyDisplayToken(firstValidationMessage.type);
                    }
                }
            }

            return retVal;
        },

        addPropertyItem: function (categoryItem, propertyItem)
        {
            var categoryBody = jQuery(categoryItem.find('.propertyGridCategoryBody'));
            if (categoryBody.length > 0)
            {
                categoryBody.append(propertyItem);
                _propertyGrid.properties.push(propertyItem);
            }
        },

        _expandPropertyCategory: function (categoryToggle, categoryBody)
        {
            categoryBody.addClass('open');
            categoryBody.removeClass('closed');
            categoryToggle.addClass('open');
            categoryToggle.removeClass('closed');
        },

        _collapsePropertyCategory: function (categoryToggle, categoryBody)
        {
            categoryBody.removeClass('open');
            categoryBody.addClass('closed');
            categoryToggle.removeClass('open');
            categoryToggle.addClass('closed');
        },

        togglePropertyCategoryState: function (e)
        {
            var src;

            if (e.srcElement)
            {
                src = jQuery(e.srcElement);
            }
            else
            {
                src = jQuery(e.target);
            }

            var categoryId = src.attr('category');
            var categoryItem = jQuery('#' + categoryId);

            if (categoryItem.length > 0)
            {
                var categoryBody = categoryItem.find('.propertyGridCategoryBody');
                if (categoryBody.length > 0)
                {
                    if (categoryBody.hasClass('open'))
                    {
                        this._collapsePropertyCategory(src, categoryBody);
                    }
                    else if (categoryBody.hasClass('closed'))
                    {
                        this._expandPropertyCategory(src, categoryBody);
                    }

                    this._applyBadgingToCategory(categoryId);
                }
            }
        },

        _checkBoxChanged: function (e)
        {
            if (_propertyGrid.View.CheckOut._checkViewStatus())
            {
                //First write the status to xml 
                _propertyGrid.WritePropertiesXml(e);

                if ($(e.target).closest(".literalval-property").length > 0)
                {
                    //Only need to enable or disable prevent xss flag if literal checkbox was clicked.
                    //_checkBoxChanged get called if any property checkbox is actioned.
                    _propertyGrid._enableDisablePreventXSS();
                }
            }
            else
            {
                var checkBox = $(e.currentTarget).parent();
                var isChecked = checkBox.hasClass("checked");

                if (!isChecked)
                {
                    checkBox.checkbox("check");
                }
                else
                {
                    checkBox.checkbox("uncheck");
                }
            }
        },

        WritePropertiesXml: function (e)
        {
            var items = jQuery('.propertyGridPropertyEdit,.propertyGridPropertyEditCheckBox');
            var xmlDoc = parseXML(e.data.grid.valuexml);
            var target = jQuery(e.target);
            var updatedProperties = xmlDoc.createElement("Properties");
            var validationFailedMsg = "";

            // Designer validate
            var validateFunction = target.data("designerValidate");
            if (validateFunction)
            {
                var fn = eval(validateFunction);
                validationFailedMsg = fn(target, _propertyGrid.View.viewDefinitionXML);
            }

            // Pattern validate
            var validationPattern = target.data("validationPattern");
            var validationMessage = $chk(target.data("validationMessage")) ? target.data("validationMessage") : Resources.ControlProperties.InvalidValue;
            if (validationPattern && !$chk(validationFailedMsg))
            {
                var valueToValidate = null;
                //If it is a spinner use the underlying value and not the text - Fixes Localization bug
                if (target.data('type') === 'spin')
                {
                    var spinnerArrayValue = target.closest(".spinner").spinner("value");
                    //only set/update the value if there is one
                    if (checkExists(spinnerArrayValue) && spinnerArrayValue.length > 0)
                    {
                        valueToValidate = spinnerArrayValue[0];
                    }
                }
                else
                {
                    valueToValidate = target.val();
                }

                validationFailedMsg = valueToValidate.test(validationPattern);

                if (!validationFailedMsg)
                {
                    validationFailedMsg = Resources.ControlProperties[validationMessage];
                } else
                {
                    validationFailedMsg = '';
                }
            }

            // Server validate
            var serverValidateFunction = target.data('serverValidate');
            if (serverValidateFunction && !$chk(validationFailedMsg))
            {
                var fn = eval(serverValidateFunction);
                validationFailedMsg = fn(e, xmlDoc, target);
            }

            if (!$chk(validationFailedMsg))
            {
                var rootElem = xmlDoc.documentElement; // <Controls>
                _propertyGrid.lastValue = target.val();

                for (var i = 0; i < items.length; i++)
                {
                    var src = jQuery(items[i]);
                    if (src[0] === target[0])
                    {
                        var xPath = src.data('propertySetPath');
                        var propertyName = src.data('id');

                        if (checkExistsNotEmpty(xPath))
                        {
                            var controlElem = rootElem.selectSingleNode('Control[@ID="' + src.data('controlid') + '"]');
                            var propertiesElem = rootElem.selectSingleNode('Control[@ID="' + src.data('controlid') + '"]/Properties');

                            if (!controlElem)
                            {
                                controlElem = xmlDoc.createElement('Control');
                                controlElem.setAttribute('ID', src.data('controlid'));
                            }

                            if ($chk(propertiesElem) === false)
                            {
                                propertiesElem = xmlDoc.createElement("Properties");
                                controlElem.appendChild(propertiesElem);
                            }

                            var propertyElem = xmlDoc.selectSingleNode(xPath);

                            if (!propertyElem)
                            {
                                propertyElem = xmlDoc.createElement('Property');
                                var nameElem = xmlDoc.createElement('Name');
                                nameElem.appendChild(xmlDoc.createTextNode(src.data('id')));
                                propertyElem.appendChild(nameElem);
                                propertiesElem.appendChild(propertyElem);
                            }

                            //clear all child node
                            var displayElem = propertyElem.selectSingleNode('DisplayValue');
                            if (displayElem)
                                propertyElem.removeChild(displayElem);

                            var valueElem = propertyElem.selectSingleNode('Value');
                            if (valueElem)
                                propertyElem.removeChild(valueElem);

                            displayElem = xmlDoc.createElement('DisplayValue');
                            valueElem = xmlDoc.createElement('Value');

                            var display = '';
                            var value = '';
                            switch (src.data('type'))
                            {
                                case 'int':
                                    if (src.is('div'))
                                    {
                                        display = src.text().trim();
                                        value = src.data('value');
                                    }
                                    else
                                    {
                                        display = src.val().trim();
                                        value = display;
                                    }

                                    if (display === '0')
                                        display = '';

                                    if (value === '')
                                        value = '0';
                                    break;
                                case 'string':
                                    if (src.is('div'))
                                    {
                                        display = src.text();
                                        value = src.data('value');
                                    }
                                    else
                                    {
                                        display = src.val();
                                        value = src.val();
                                    }
                                    break;
                                case 'drop':
                                    if (src.is('div'))
                                    {
                                        display = src.text().trim();
                                        value = src.data('value');
                                    }
                                    else
                                    {
                                        display = src.val().trim();
                                        value = src.val().trim();
                                    }

                                    break;
                                case 'bool':
                                    if (src.is('div'))
                                    {
                                        display = src.text().trim();
                                        value = src.data('value');
                                    }
                                    else
                                    {
                                        display = src[0].checked + "";
                                        value = src[0].checked + "";
                                    }
                                    break;
                                case 'complex':
                                    display = src.text().trim();
                                    value = src.data('value');
                                    break;
                                case 'spin':
                                    display = src.val();
                                    var valuesArray = src.closest(".spinner").spinner("value");
                                    if (checkExists(valuesArray) && valuesArray.length > 0)
                                    {
                                        value = valuesArray[0];
                                    }
                                    break;
                            }

                            var defaultPropertyNode = _propertyGrid._getCurrentControlDefinitionXml().selectSingleNode('Properties/Prop[@ID="{0}"]'.format(propertyName));
                            var propertyResolver = defaultPropertyNode.getAttribute('DesignerPropertyResolver');
                            if (checkExists(propertyResolver))
                            {
                                var controlTypeName = defaultPropertyNode.parentNode.parentNode.parentNode.selectSingleNode("Name").text;
                                var fn = SourceCode.Forms.Designers.Common.getControlTypeFunction(controlTypeName, propertyName, "DesignerPropertyResolver", propertyResolver);
                                if (checkExists(fn))
                                {
                                    var context =
                                        {
                                            property: propertyName, // the property's name
                                            value: value, // the current property value
                                            display: display,
                                            resolveDirection: "TO-PROPERTY-XML" //TO-PROPERTY-UI reflects that we are updating the UI. TO-PROPERTY-XML that we are updating the property xml that gets saved
                                        };
                                    fn(context);
                                    value = context.value;
                                    display = context.display;
                                }
                            }

                            valueElem.appendChild(xmlDoc.createTextNode(value.toString()));
                            displayElem.appendChild(xmlDoc.createTextNode(display.toString()));

                            propertyElem.appendChild(displayElem);
                            propertyElem.appendChild(valueElem);

                            var udPropertyEl = xmlDoc.createElement("Property");
                            var udKeyEl = xmlDoc.createElement("Name");
                            var udValueEl = xmlDoc.createElement("Value");
                            var newValue = "";
                            if (value) newValue = value;
                            udKeyEl.appendChild(xmlDoc.createTextNode(src.data('id')));
                            udPropertyEl.appendChild(udKeyEl);
                            udValueEl.appendChild(xmlDoc.createTextNode(newValue.toString()));
                            udPropertyEl.appendChild(udValueEl);
                            updatedProperties.appendChild(udPropertyEl);

                            //Temporary code to conform with new controls
                            if (propertyName === "ControlName")
                            {
                                var previousControlNameValueValue;

                                if (controlElem.selectSingleNode("Name"))
                                {
                                    previousControlNameValueValue = controlElem.selectSingleNode("Name").text;
                                }

                                var controlId = src.data('controlid');

                                _propertyGrid._updateControlName(value, controlElem, xmlDoc);
                                //_propertyGrid.ViewDesigner._updateControlNameForEvents(previousControlNameValueValue, value, src.data('controlid'));

                                _propertyGrid.View.isViewEventsLoaded = false;

                                var ctrl = $("#" + controlId);
                                if (ctrl.length > 0 && ctrl.hasClass("controlwrapper"))
                                {
                                    SourceCode.Forms.RuleGrid.refresh(_propertyGrid.View.viewEventsGrid, _propertyGrid.View.viewDefinitionXML, { controlID: controlId });
                                }
                                else
                                {
                                    SourceCode.Forms.RuleGrid.refresh(_propertyGrid.View.viewEventsGrid, _propertyGrid.View.viewDefinitionXML);
                                }

                                SourceCode.Forms.Designers.Common.updateControlNameEverywhereInDefinition({
                                    controlId: controlId,
                                    newName: value,
                                    newDisplayValue: display,
                                    oldControlName: previousControlNameValueValue
                                });
                            }

                            break;
                        }
                        break; //exit the while loop there is only one src[0] === target[0]
                    }

                }

                e.data.grid.valuexml = xmlDoc.xml;
                _propertyGrid.ViewDesigner._redrawControl(e.data.grid.controlid, e.data.grid, updatedProperties);

                var controlType = xmlDoc.selectSingleNode('Controls/Control/@Type');

                if ($chk(controlType))
                {
                    controlType = controlType.text;

                    if (controlType === "View")
                    {
                        var viewXML = _propertyGrid.View.viewDefinitionXML;
                        var viewControl = viewXML.selectSingleNode("SourceCode.Forms/Views/View/Controls/Control[@Type='View']");
                        var newViewName = viewControl.selectSingleNode("Properties/Property[Name='ControlName']/Value").text;
                        _propertyGrid.ViewDesigner._updateViewName(newViewName);
                    }
                }
            }
            else
            {
                popupManager.showError(validationFailedMsg);
                //Prevent focus errors
                if (checkExists(_propertyGrid.lastFocus))
                {
                    _propertyGrid.lastFocus.val(_propertyGrid.lastValue);
                }
                return false;
            }
        },

        _updateControlName: function (value, controlElem, xmlDoc)
        {
            var controlNameElem = controlElem.selectSingleNode("Name");
            if (controlNameElem)
            {
                controlNameElem.parentNode.removeChild(controlNameElem);
            }

            controlNameElem = xmlDoc.createElement("Name");
            controlElem.appendChild(controlNameElem);

            controlNameElem.appendChild(xmlDoc.createTextNode(value));

            var controlDisplayNameElem = controlElem.selectSingleNode("DisplayName");
            if (controlDisplayNameElem)
            {
                controlDisplayNameElem.parentNode.removeChild(controlDisplayNameElem);
            }

            controlDisplayNameElem = xmlDoc.createElement("DisplayName");
            controlElem.appendChild(controlDisplayNameElem);

            controlDisplayNameElem.appendChild(xmlDoc.createTextNode(value));
        },

        _getCurrentControlDefinitionXml: function ()
        {
            return _propertyGrid.definitionxml;
        },

        _PropertyGridCategory2: function (options)
        {
            var category = jQuery('<div></div>');
            var catHeader = jQuery('<div></div>');
            var catToggle = jQuery('<span></span>');
            var catLabel = jQuery('<div></div>');
            var catBody = jQuery('<div></div>');

            category.attr('id', options.id);
            category.addClass('propertyGridCategory');

            catHeader.attr('category', options.id);
            catHeader.addClass('propertyGridCategoryHeader');

            catToggle.addClass('propertyGridCategoryToggle open');
            catToggle.attr('category', options.id);

            catLabel.addClass('propertyGridCategoryLabel');
            catLabel.text(options.name);

            catBody.attr('category', options.id);
            catBody.addClass('propertyGridCategoryBody open');

            catHeader.append(catToggle);
            catHeader.append(catLabel);
            category.append(catHeader);
            category.append(catBody);

            return category;
        },

        _lookupDefaultValues: function (options)
        {
            var lookupText = Resources.Filtering.DefaultStyleName;
            switch (options.id)
            {
                case "Styles":
                    if (!_propertyGrid.Styles.isDefaultStyle())
                        lookupText = Resources.CommonLabels.CustomStyleLabel;
                    break;
                case "ConditionalStyles":
                    if (!_propertyGrid.Styles.isDefaultCondition())
                        lookupText = Resources.CommonLabels.CustomStyleLabel;
                    break;
                case "CalendarPicker":
                    switch (options.setValue)
                    {
                        case "dateTimePicker":
                            lookupText = Resources.ControlProperties.DateTimePickerText;
                            options.setDisplay = Resources.ControlProperties.DateTimePickerText;
                            break;
                        case "datePicker":
                            lookupText = Resources.ControlProperties.DatePickerText;
                            options.setDisplay = Resources.ControlProperties.DatePickerText;
                            break;
                        case "timePicker":
                            lookupText = Resources.ControlProperties.TimePickerText;
                            options.setDisplay = Resources.ControlProperties.TimePickerText;
                            break;
                        default:
                            lookupText = Resources.ControlProperties.DatePickerText;
                            options.setDisplay = Resources.ControlProperties.DatePickerText;
                            break;
                    }
                    break;
                default:
                    if (!checkExistsNotEmpty(options.setDisplay))
                        lookupText = Resources.CommonLabels.NoneLabelText;
                    else
                        lookupText = options.setDisplay;
                    break;
            }
            return lookupText;
        },

        //clearExpressionLookup
        clearExpressionLookup: function (lookup, controlid, ev)
        {
            if (lookup.find("input[type=text]").val() !== Resources.CommonLabels.NoneLabelText)
            {
                var _which = ev.which;
                var _keyCode = $.ui.keyCode;

                switch (_which)
                {
                    case _keyCode.BACKSPACE:
                    case _keyCode.DELETE:
                        popupManager.showConfirmation({
                            message: Resources.Designers.ControlExpressionResetText,
                            onAccept: function () 
                            {
                                _propertyGrid._onExpressionDeleteHandler(lookup, controlid);

                                popupManager.closeLast();
                            }
                        });

                        if (_which === _keyCode.BACKSPACE)
                            ev.preventDefault();
                        else ev.stopPropagation();
                        break;

                }
            }
            else
            {
                ev.preventDefault();
                ev.stopPropagation();
            }
        },

        _onExpressionDeleteHandler: function (lookup, controlid)
        {
            var parentNode = _propertyGrid.View.viewDefinitionXML;
            var gridNode = parseXML(_propertyGrid.valuexml);
            var controlNode = parentNode.selectSingleNode("//Controls/Control[@ID='{0}']".format(controlid));
            var gridControl = gridNode.selectSingleNode("//Controls/Control[@ID='{0}']".format(controlid));

            lookup.find("input[type=text]").val(Resources.CommonLabels.NoneLabelText);
            lookup.removeClass("icon-control expression");

            var gridProp = gridControl.selectSingleNode("Properties/Property[Name='ControlExpression']");
            var propNode = controlNode.selectSingleNode("Properties/Property[Name='ControlExpression']");

            SourceCode.Forms.DependencyHelper.removeExpressionAnnotationForControl(controlNode);

            if (checkExists(gridProp))
            {
                gridProp.parentNode.removeChild(gridProp);
            }

            if (checkExists(propNode))
            {
                propNode.parentNode.removeChild(propNode);
            }

            if (checkExists(gridControl.getAttribute("ExpressionID")))
            {
                gridControl.removeAttribute("ExpressionID");
            }

            if (checkExists(controlNode.getAttribute("ExpressionID")))
            {
                controlNode.removeAttribute("ExpressionID");
            }

            SourceCode.Forms.Designers.Common.refreshBadgeForControls([controlNode.getAttribute("ID")]);

            SourceCode.Forms.Designers.View.ViewDesigner._showControlProperties(true);
        },

        //clearStyleLookup
        clearStyleLookup: function (lookup, controlid, propType, ev)
        {
            if (lookup.find("input[type=text]").val() === Resources.CommonLabels.CustomStyleLabel)
            {
                var _which = ev.which;
                var _keyCode = $.ui.keyCode;

                switch (_which)
                {
                    case _keyCode.BACKSPACE:
                    case _keyCode.DELETE:
                        popupManager.showConfirmation({
                            message: propType === "Styles" ? Resources.Designers.CustomStyleResetText : Resources.Designers.ConditionalStylingResetText,
                            onAccept: function ()
                            {
                                _propertyGrid._onConditionalStylesDeleteHandler(lookup, controlid, propType);

                                popupManager.closeLast();
                            }
                        });

                        if (_which === _keyCode.BACKSPACE)
                            ev.preventDefault();
                        else ev.stopPropagation();
                        break;

                }
            } else
            {
                ev.preventDefault();
                ev.stopPropagation();
            }

        },

        _onConditionalStylesDeleteHandler: function (lookup, controlid, propType)
        {
            lookup.find("input[type=text]").val(Resources.Filtering.DefaultStyleName);

            var parentNode = _propertyGrid.View.viewDefinitionXML;
            var controlNode = parentNode.selectSingleNode("//Controls/Control[@ID='".concat(controlid, "']"));
            var id = controlNode.getAttribute("ID");
            var type = controlNode.getAttribute("Type");

            switch (propType)
            {
                case "Styles":

                    var stylesNode = SourceCode.Forms.Designers.View.Styles._getStylesNode(id, type);

                    if (checkExists(stylesNode))
                    {
                        controlNode.removeChild(stylesNode);
                        stylesNode = SourceCode.Forms.Designers.View.Styles._getStylesNode(id, type);
                        SourceCode.Forms.Designers.View.Styles._styleBuilderReturned(true, SCStyleHelper.getPrimaryStyleNode(stylesNode));
                    }
                    break;
                case "ConditionalStyles":

                    var conditionNode = controlNode.selectSingleNode(propType);

                    if (checkExists(conditionNode))
                    {
                        conditionNode.parentNode.removeChild(conditionNode);
                    }

                    SourceCode.Forms.DependencyHelper.removeAllConditionalStylesAnnotationForControl(controlNode);

                    break;
            }

            SourceCode.Forms.Designers.Common.refreshBadgeForControls([controlNode.getAttribute("ID")]);

            SourceCode.Forms.Designers.View.ViewDesigner._showControlProperties(true);
        },

        _PropertyGridItem2: function (options)
        {
            //    id: propId,
            //    name: propDisplayName,
            //    tooltip: propTooltip,
            //    type: propType,
            //    inputLength: propInputLength,
            //    initializeServerControl: propInitializeServerControl,
            //    serverControl: propServerControl,
            //    readonly: propReadOnly,
            //    categoryItem: catItem
            //    setValue: PropValues.value,
            //    setDisplay: PropValues.display,
            //    selectionValues: propSelectionValues,
            //    selectionText: propSelectionText,
            //    selectionIcons: propSelectionIcons,
            //    defaultValue: defaultValue,
            //    showconditionproperty:propShowConditionProperty,
            //    showconditionvalue:propShowConditionValue,
            //    showIcon,
            //    grid: _propertyGrid
            //    propertySetPath
            //    hasDependencyError
            //    dependencyErrorMessage

            if ($chk(options.showconditionproperty) && $chk(options.showconditionvalue))
            {
                var cellControl = jQuery("#" + options.grid.controlid);
                var controlSupportedID = cellControl.find(".controlwrapper:first-child").attr("id");
                var controlDataValueNode = _propertyGrid.View.viewDefinitionXML.selectSingleNode("//Controls/Control[@ID='" + controlSupportedID + "']/Properties/Property[Name='" + options.showconditionproperty + "']/Value");

                if ($chk(controlDataValueNode))
                {
                    var controlDataValue = controlDataValueNode.text;
                    var foundDataValue = false;
                    var supportedDataValuesArray = options.showconditionvalue.split("|");

                    for (var s = 0; s < supportedDataValuesArray.length; s++)
                    {
                        if (controlDataValue.toLowerCase() === supportedDataValuesArray[s].toLowerCase())
                        {
                            foundDataValue = true;
                            break;
                        }
                    }

                    if (!foundDataValue)
                    {
                        return;
                    }
                }
            }

            if (!checkExists(options.tooltip))
            {
                options.tooltip = options.name;
            }

            var itemAppend = false;
            var property = jQuery('<div></div>');
            var propertyLabel = jQuery('<div></div>');

            var propertyValue = jQuery('<div></div>');

            property.addClass('propertyGridPropertyItem');

            property.addClass(options.id.toLowerCase() + "-property");

            if (checkExists(options.hasDependencyError) && options.hasDependencyError === true)
            {
                property.addClass('error');

                if (checkExistsNotEmpty(options.dependencyErrorMessage))
                {
                    property.attr("title", options.dependencyErrorMessage);
                }
            }

            options.propertySelector = "#ControlTabsContent .{0}-property{1}";

            propertyLabel.addClass('propertyGridPropertyItemLabel');

            propertyLabel.text(options.name);
            propertyLabel[0].setAttribute('title', options.tooltip);

            propertyValue.addClass('propertyGridPropertyItemValue');

            property.append(propertyLabel);
            property.append(propertyValue);

            if (!checkExists(options.setValue))
            {
                options.setValue = options.defaultValue;
                options.setDisplay = options.defaultValue;
            }

            var editItem = null;
            var editWrapper = jQuery('<div class="propertyGridEditWrapper"></div>');

            propertyValue.append(editWrapper);

            if (options.grid.readonly === true || options.grid.readonly === "true" || options.readonly === true || options.readonly === "true")
            {
                editItem = jQuery('<div></div>');
                editItem.text(options.setDisplay);
                editItem.attr('title', options.setDisplay);
                editItem.addClass('propertyGridPropertyEdit');
                editItem.data('isReadOnly', true);
                editWrapper.addClass('readOnly');
            }
            else
            {
                switch (options.type)
                {
                    case 'string':
                    case 'int':
                        var txtHTML = SCTextbox.html();
                        var editItemWrapper = jQuery(txtHTML);

                        editItem = editItemWrapper.find("input");
                        editItem.val(options.setValue);
                        editItem[0].setAttribute("title", options.tooltip);

                        if ($chk(options.inputLength))
                            editItem.attr('maxLength', options.inputLength);

                        editItem.addClass('propertyGridPropertyEdit');
                        editItem.addClass('input');

                        //Check if the View Name is disabled due to authorization
                        if (options.controlType === "View" && options.id === "ControlName")
                        {
                            var viewName = $("#FormField1 .input-control.text-input");

                            if (checkExists(viewName) && viewName.hasClass("unAuthorized"))
                            {
                                editItem.addClass("unAuthorized");
                            }
                        }

                        editItemWrapper.appendTo(editWrapper).textbox();
                        itemAppend = true;
                        break;
                    case 'spin':
                        var spinnerWrapper = jQuery("<div class='spinner-wrapper'></div>");

                        var spinnerHtmlOptions =
                            {
                                inputsLength: 1
                            };

                        var editItemSpinner = jQuery(SCSpinner.html(spinnerHtmlOptions));

                        editItem = editItemSpinner.find(".spinner-text-input");

                        var spinnerExtendedOptions = options.getSpinOptionsFunction;
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

                        editItemSpinner.spinner("value", [options.setValue]);

                        if (checkExistsNotEmpty(functionReturn))
                        {
                            evalFunction(functionReturn)(options.setValue, editItem, options.grid.controlid);
                        }
                        editItem.trigger("blur");

                        spinnerWrapper.append(editItemSpinner);

                        spinnerWrapper.appendTo(editWrapper);
                        editItem.addClass('propertyGridPropertyEdit');
                        itemAppend = true;
                        break;
                    case 'bool':
                        var isChecked;

                        if (options.setValue.toString() === 'true' || options.setValue.toString() === '')
                            isChecked = true;
                        else
                            isChecked = false;

                        var chkHTML = SCCheckbox.html({ checked: isChecked, collapsed: false });
                        var editItemWrapper = jQuery(chkHTML);
                        editItem = editItemWrapper.find("input");
                        editItem[0].setAttribute("title", options.tooltip);

                        editItem.addClass('propertyGridPropertyEditCheckBox');
                        editItemWrapper.appendTo(editWrapper).checkbox();
                        itemAppend = true;
                        break;
                    case 'drop':
                        editItem = jQuery('<select class="icon-control input-control propertyGridPropertyEdit"></select>');
                        var itemsFunction = options.dropItemsFunction;
                        var values;
                        var displayText;
                        var iconClasses;
                        var noIcons = false;

                        if (options.showIcon === false)
                        {
                            editItem.removeClass("icon-control");
                            noIcons = true;
                        }

                        if (["ThumbnailSize", "DefaultValue", "Target", "Group"].indexOf(options.id) !== -1)
                        {
                            noIcons = true;
                            editItem.removeClass("icon-control");
                        }

                        if (options.name === "Theme")
                        {
                            noIcons = true;
                            editItem.removeClass("icon-control");
                        }

                        if ($chk(itemsFunction))
                        {
                            var fn;
                            if (itemsFunction.indexOf('.') !== -1)
                            {
                                fn = eval(itemsFunction);
                            }
                            else
                            {
                                fn = _propertyGrid.ViewDesigner[itemsFunction];
                            }
                            var valuesObject = fn(options);
                            values = valuesObject.values;
                            displayText = valuesObject.displays;
                            iconClasses = valuesObject.iconClasses;
                            if (checkExists(valuesObject.noIcons))
                            {
                                noIcons = valuesObject.noIcons;
                            }
                        } else
                        {
                            values = options.selectionValues.split('|');
                            displayText = options.selectionText.split('|');
                            if (checkExists(options.selectionIcons))
                            {
                                iconClasses = options.selectionIcons.split('|');
                            }
                        }
                        var valueCount = values.length;
                        if (!checkExists(noIcons))
                        {
                            editItem.removeClass("icon-control");
                        }

                        for (var oI = 0; oI < valueCount; oI++)
                        {
                            if (!checkExists(displayText)) displayText = values;
                            if (!checkExists(iconClasses)) iconClasses = values;

                            var option = null;
                            if (noIcons)
                            {
                                option = jQuery(('<option value="{0}">{1}</option>').format(values[oI].htmlEncode(), displayText[oI].htmlEncode()));
                            }
                            else
                            {
                                option = jQuery(('<option class="{0}" value="{1}">{2}</option>').format(iconClasses[oI].toLowerCase().htmlEncode(), values[oI].htmlEncode(), displayText[oI].htmlEncode()));
                            }
                            //<option value="[Value]" selected="[isselected]">[Display]</option>

                            if ($chk(options.setValue) === true)
                            {
                                if (values[oI] === options.setValue)
                                {
                                    option.prop('selected', true);
                                }
                            }
                            else
                            {
                                if (values[oI] === options.defaultValue)
                                {
                                    option.prop('selected', true);
                                }
                            }
                            editItem.append(option);
                        }

                        //editItem.addClass('propertyGridPropertyEdit');
                        editItem.appendTo(editWrapper);
                        editItem[0].setAttribute("title", options.tooltip);
                        editItem.dropdown({ allowEmptyFirstItem: true });

                        displayTextCount = displayText.length;

                        if (valueCount === 0 || (valueCount === 1 && values[0] === "") ||
                            displayTextCount === 0 || (displayTextCount === 1 && displayText[0] === ""))
                        {
                            editItem.dropdown('disable');
                        }

                        itemAppend = true;

                        break;
                    case 'complex':
                        var _value = options.setValue;
                        var _iconClass = "";
                        if (checkExistsNotEmpty(options.icon))
                        {
                            _iconClass = options.icon;
                        }
                        else
                        {
                            if (!!_value)
                            {
                                switch (options.serverControlType)
                                {
                                    case 'property':
                                        switch (_value)
                                        {
                                            case 'SmartObject':
                                                _iconClass = 'smartobject';
                                                break;

                                            case 'Static':
                                                _iconClass = 'staticdata';
                                                break;
                                        }

                                        break;

                                    case 'custom':
                                        _iconClass = options.id;
                                        break;

                                    case 'smartobject':
                                        _iconClass = 'smartobject';
                                        break;

                                    default:
                                        switch (options.id)
                                        {
                                            case 'Source':
                                                _iconClass = 'picture';
                                                break;
                                            case 'ValidationPattern':
                                                _iconClass = 'pattern';
                                                break;
                                            case 'ControlExpression':
                                                _iconClass = 'expression';
                                                break;
                                            case 'Field':
                                                _iconClass = 'unknown';
                                                break;
                                            case "CalendarPicker":
                                                switch (options.setValue)
                                                {
                                                    case "dateTimePicker":
                                                        _iconClass = 'datetime';
                                                        break;
                                                    case "datePicker":
                                                        _iconClass = 'date';
                                                        break;
                                                    case "timePicker":
                                                        _iconClass = 'time';
                                                        break;
                                                    default:
                                                        _iconClass = 'date';
                                                        break;
                                                }
                                                break;
                                            case 'ToolbarItems':
                                                _iconClass = '';
                                                break;
                                            case 'FilterGrouping':
                                                _iconClass = '';
                                                break;
                                            case 'ActionMenuItemData':
                                                _iconClass = '';
                                                break;
                                            default:
                                                _iconClass = 'unknown';
                                                break;
                                        }

                                        break;
                                }
                            }
                        }
                        if (options.setDisplay === options.setValue)
                        {
                            options.setDisplay = _propertyGrid._lookupDefaultValues(options);
                        }
                        var _lookupOptions =
                            {
                                value: options.setDisplay.htmlEncode(),
                                icon: _iconClass,
                                readonly: true
                            };

                        var lookupHTML = SCLookupBox.html(_lookupOptions);
                        var editItemWrapper = jQuery(lookupHTML);
                        editItem = editItemWrapper.find("input");
                        var $this = this;

                        editItemWrapper.appendTo(editWrapper).lookupbox().on('keydown', function (e)
                        {
                            var lookup = $(this);
                            var id = options.grid.id.replace("ReadOnlyProperties_", "");
                            switch (options.id)
                            {
                                case 'ValidationPattern':
                                    break;
                                case 'Styles':
                                case 'ConditionalStyles':
                                    _propertyGrid.clearStyleLookup(lookup, id, options.id, e);
                                    break;
                                case 'ControlExpression':
                                    _propertyGrid.clearExpressionLookup(lookup, id, e);
                                    break;
                                default:
                                    break;
                            }
                        });
                        options.lookupControl = editItemWrapper;

                        if (options.initializeServerControl && options.serverControl)
                        {
                            editItem.addClass('propertyGridPropertyEdit');
                            //editItem.addClass('propertyGridEditComplexDisplay');
                            if (options.setDisplay !== "")
                                editItem.val(options.setDisplay);
                            else editItem.val(Resources.CommonLabels.NoneLabelText);
                            editItemWrapper.find("a").addClass('propertyGridEditComplexButton');
                            editItemWrapper.find("a").attr('initializeServerControl', options.initializeServerControl);
                            editItemWrapper.find("a").attr('serverControl', options.serverControl);
                            editItem[0].setAttribute("title", options.tooltip);

                            var event = SourceCode.Forms.Browser.mozilla ? "keypress" : "keydown";
                            editItem.on(event, function (ev)
                            {
                                _propertyGrid._removeDataSourceEvent(ev, options, $(this).val());
                            });
                        }
                        else
                        {
                            editItem.addClass('propertyGridPropertyEdit');
                            editItem[0].setAttribute("title", options.tooltip);

                            editItemWrapper.find("a").on("click", function ()
                            {
                                if (_propertyGrid.View.CheckOut._checkViewStatus())
                                {
                                    var fn = eval(options.designerSet);
                                    fn(options);
                                }

                            });
                        }

                        itemAppend = true;
                        break;
                    case 'link':
                        editItem = jQuery("<a href='javascript:;'>" + options.text + "</a>");
                        editItem.addClass('propertyGridPropertyEdit');

                        editItem.on("click", function ()
                        {
                            if (_propertyGrid.View.CheckOut._checkViewStatus())
                            {
                                var fn = eval(options.designerSet);
                                fn(options.name, options);
                            }
                        });

                        itemAppend = false;
                        break;
                    default:
                        editItem = jQuery('<div></div>');
                        editItem.text(options.setDisplay);
                        editItem.attr('title', options.setDisplay);
                        editItem.addClass('propertyGridPropertyEdit');
                        break;
                }
                editItem.data('isReadOnly', false);
            }

            if (options.designerGet)
            {
                var fn = eval(options.designerGet);
                if (editItem.is('input'))
                {
                    editItem.val(fn(options));
                }
                else
                {
                    editItem.text(fn(options));
                }
            }

            if (itemAppend === false)
            {
                editWrapper.append(editItem);
            }

            editItem.data('value', options.setValue);
            editItem.data('display', options.setDisplay);

            editItem.data('id', options.id);
            editItem.data('name', options.name);
            editItem.data('type', options.type);
            editItem.data('readonly', options.readonly);
            editItem.data('controlid', options.grid.controlid);
            editItem.data('inputLength', options.inputLength);
            editItem.data('initializeServerControl', options.initializeServerControl);
            editItem.data('serverControl', options.serverControl);
            editItem.data('propertySetPath', options.propertySetPath);
            editItem.data('serverControlType', options.serverControlType);
            editItem.data('designerSet', options.designerSet);
            editItem.data('designerGet', options.designerGet);
            editItem.data('designerClear', options.designerClear);
            editItem.data('designerValidate', options.designerValidate);
            editItem.data('validationPattern', options.validationPattern);
            editItem.data('validationMessage', options.validationMessage);
            editItem.data('serverValidate', options.serverValidate);

            options.grid.addPropertyItem(options.categoryItem, property);
        },

        _removeDataSourceEvent: function (ev, options, propertyVal)
        {
            var keyCode = ev.keyCode;
            ev.stopPropagation();
            ev.preventDefault();
            var clearFunction = options.clearFunction;
            var categoryName = options.id;

            if ((keyCode === jQuery.ui.keyCode.BACKSPACE || keyCode === jQuery.ui.keyCode.DELETE) && (propertyVal !== Resources.CommonLabels.NoneLabelText) && ($chk(clearFunction)))
            {
                _propertyGrid._onRemoveComplexPropertyHandler(clearFunction, categoryName);
            }
        },

        _clearComplexProperty: function (clearFunction, categoryName, notifierContext)
        {
            $(this).val(Resources.CommonLabels.NoneLabelText);
            var controlType = _propertyGrid.View.selectedObject.attr('controlType');
            var controlXML = _propertyGrid.ViewDesigner._getControlTypePropertyDefinition(controlType);
            var xml = _propertyGrid.valuexml;

            var clearFunctionFn = null;

            if (clearFunction.contains("."))
            {
                clearFunctionFn = evalFunction(clearFunction);
            }

            if (checkExists(clearFunctionFn))
            {
                clearFunctionFn(xml, controlXML.xml, categoryName, SourceCode.Forms.Designers.View.ViewDesigner._closeComplexPropertyPopup);
            }
            else
            {
                if (categoryName === "Field")
                {
                    ControlUtil[clearFunction](SourceCode.Forms.Designers.View.ViewDesigner._closeFieldPropertyConfigPopup);
                }
                else
                {
                    ControlUtil[clearFunction](xml, controlXML.xml, categoryName, SourceCode.Forms.Designers.View.ViewDesigner._closeComplexPropertyPopup, notifierContext);
                }
            }
        },

        _onClearDataSource: function (clearFunction, categoryName, notifierContext)
        {
            //Since user selected to remove an assocated smo, we don't need to worry about updating the current state of 
            //the property grid to the definition xml.
            //We need to refresh the property grid data with annotated data from the definition xml, 
            SourceCode.Forms.Designers.View.ViewDesigner._showControlProperties(true);

            //When clearing the complex property, it also updates the current state of the property grid to 
            //the matching control node in the definition xml.
            _propertyGrid._clearComplexProperty(clearFunction, categoryName, notifierContext);
        },

        _onRemoveComplexPropertyHandler: function (clearFunction, categoryName)
        {
            var hasDependencies = false;

            if (categoryName === "DataSourceType" ||
                categoryName === "AssociationSO")
            {
                var objectId = _propertyGrid.controlid;
                var sourceId = SourceCode.Forms.DependencyHelper.getAssociationSmoId(_propertyGrid.valuexml);

                var itemsToDelete = null;

                if (SourceCode.Forms.Designers.hasStaticSource(objectId))
                {
                    itemsToDelete =
                        [
                            {
                                itemType: "ControlField",
                                itemId: objectId,
                                contextId: objectId
                            }
                        ];
                }
                else
                {
                    itemsToDelete = SourceCode.Forms.Designers.getDependencyDataCollectionForExternalSource(objectId, sourceId);
                }

                var dataSourceDependencies = SourceCode.Forms.Designers.getDependencies(itemsToDelete);

                if (dataSourceDependencies.length > 0)
                {
                    hasDependencies = true;

                    //The dependendent items may be the same Control, e.g. Conditional Style that is using the associated smo property.
                    //Thus in the call back function we need to ensure we first update the annotation to the property grid. 
                    var clearDataSourceFn = function (notifierContext)
                    {
                        _propertyGrid._onClearDataSource(clearFunction, categoryName, notifierContext);
                    }

                    var smoDispName = "";
                    var sourceDetails = SourceCode.Forms.Designers.getDataSourceDetails(sourceId);
                    if (checkExists(sourceDetails))
                    {
                        var smoNameNode = sourceDetails.selectSingleNode(".//metadata/display/displayname");
                        if (checkExists(smoNameNode))
                        {
                            smoDispName = smoNameNode.text;
                        }
                    }

                    var notifierOptions =
                        {
                            references: dataSourceDependencies,
                            deleteItemType: SourceCode.Forms.DependencyHelper.ReferenceType.Source,
                            deletedItemDisplayName: smoDispName,
                            removeObjFn: clearDataSourceFn,
                            showSimpleNotifier: true,
                            removeConfirmationMessage: Resources.DependencyHelper.SimpleNotifierDefaultMessage
                        };
                    SourceCode.Forms.Designers.showDependencyNotifierPopup(notifierOptions);
                }
            }
            //Normal behaviour show a message to confirm the delete action
            if (hasDependencies === false)
            {
                var popupOptions = ({
                    message: Resources.Designers.ClearPropertyValueConfirmation,
                    onAccept: function ()
                    {
                        _propertyGrid._clearComplexProperty(clearFunction, categoryName);

                        popupManager.closeLast();
                    },
                    draggable: false
                });


                popupManager.showConfirmation(popupOptions);
            }

            return hasDependencies;
        },

        _applyBadgingToCategories: function (mainGrid)
        {
            if (!checkExists(mainGrid))
            {
                return;
            }

            var categories = mainGrid.find("div.propertyGridCategory");

            for (var i = 0; i < categories.length; i++) 
            {
                this._applyBadgingToCategory(categories[i]);
            }
        },

        _applyBadgingToCategory: function (propertyGridCategoryElement)
        {
            if (!checkExistsNotEmpty(propertyGridCategoryElement))
            {
                return;
            }

            var cat = $(propertyGridCategoryElement);

            cat.removeClass("error");
            cat.attr("title", "");

            var errorProperties = cat.find(".propertyGridPropertyItem.error");

            if (checkExists(errorProperties) && errorProperties.length > 0)
            {
                cat.addClass("error");
                cat.attr("title", Resources.CommonLabels.PropertyHeaderHasErrorTooltip);
            }
        },

        _enableDisablePreventXSS: function ()
        {
            var $literal = $(".propertyGridPropertyItem.literalval-property");

            if ($literal.length === 0)
            {
                //literal property doesn't exits
                return;
            }

            var $literalCheckbox = $literal.find("label.checkbox").checkbox();

            var isLiteral = $literalCheckbox.hasClass("checked");

            SourceCode.Forms.Designers.Common.enableDisablePreventXssProperty(isLiteral);


        }
    };
})(jQuery);
