/* global SourceCode: true */
/* global Resources: true */
/* global checkExists: false */
/* global checkExistsNotEmpty: false */
/* global popupManager: false */
/* global parseXML: false */
/* global $chk: false */


/* Purpose: Control Developer use the methods on SourceCode.Forms.Designers.Common.xxxx so they do 
            not have direct access to the actual appstudio viewmodel. 
            Common knows which designer is currently is use - its Common.Context property holds abstracted 
            methods on the current showing designer.
*/

(function ($)
{
    !SourceCode && (SourceCode = {});

    var _Forms = SourceCode.Forms || (_Forms = SourceCode.Forms = {});
    var _designers = _Forms.Designers || (_designers = _Forms.Designers = {});

    SourceCode.Forms.Designers.propertyFunctionCache = {};
    SourceCode.Forms.Designers.controlTypePropertyFunctionCache = {};

    var common = SourceCode.Forms.Designers.Common =
    {
        DYNAMIC_VARIABLES_STYLESHEET_ID: "_Dynamic/Variables",
        _selectionLoop: null,
        _tableColumnResizer: null,
        _moveWidget: null,
        _controlALMBadgeManager: null,

        currentDynamicVariablesStylesheetId: "_Dynamic/Variables0",
        currentDynamicVariablesStylesheetIndex: 0,

        controlTypePropertiesXml: parseXML("<root></root>"),
        Context: null,
        // Current context of the notifier, set when XML for notifier is updated
        notifierContext: {},

        SetContext: function (ctxt)
        {
            if (!checkExists(ctxt))
            {
                throw "Designer context is not valid";
            }

            common.Context = ctxt;
            common.Context.resetState();
            common.triggerEvent("DesignerChanged");

            SourceCode.Forms.TableHelper.clearAllTableArrays();
        },

        controlSupportsProperty: function (controlID, definitionXML, property)
        {
            var result =
            {
                controlSupportsProperty: false,
                controlNode: null,
                controlPropertyNode: null
            };

            if (checkExists(definitionXML) && checkExistsNotEmpty(controlID))
            {
                result.controlNode = definitionXML.selectSingleNode('//Controls/Control[@ID="{0}"]'.format(controlID));
                if (result.controlNode !== null && checkExists(SourceCode.Forms.Designers.Common.controlDefinitionsXml))
                {
                    var controlsDoc = SourceCode.Forms.Designers.Common.controlDefinitionsXml;
                    var controlType = result.controlNode.getAttribute("Type");
                    result.controlPropertyNode = controlsDoc.selectSingleNode('Controls/Control[Name="{0}"]/DefaultProperties/Properties/Prop[@ID="{1}"]'.format(controlType, property));

                    if (result.controlPropertyNode !== null)
                    {
                        result.controlSupportsProperty = true;
                    }
                }
            }
            return result;
        },

        //this ensures that any widgets or editor UI on top of this element is visible whether
        //this element has a light background or dark background
        //Note: Moved from form.layout.js
        setEditorElementColorsForContainer: function (bgColor, jqElement)
        {
            if (!checkExists(bgColor)) bgColor = "transparent";
            var colorObj = jQuery.Color(bgColor);
            var isLight = colorObj.lightness() >= 0.5;
            var isTransparent = colorObj.alpha() <= 0.5;

            var editorDark = !isLight && !isTransparent;

            if (colorObj.toString() === "transparent")
            {
                //clear the class so it will depend parent's editor dark/light mode
                jqElement.removeClass("editor-dark");
                jqElement.removeClass("editor-light");
            }
            else
            {
                jqElement.toggleClass("editor-dark", editorDark); //editor-dark is when background color is a dark and border lines should render in a light color
                jqElement.toggleClass("editor-light", !editorDark); //editor-light is the default
            }
        },

        getControlType: function (controlId) 
        {
            var control = $('#' + controlId);
            return common.getControlTypeFromControlElement(control);
        },

        getControlTypeFromControlElement: function (control)
        {
            if (control.length > 0)
            {
                if (checkExists(control.data('controltype')))
                {
                    return control.data('controltype');
                }

                if (checkExists(control.attr('controltype')))
                {
                    return control.attr('controltype');
                }

                if (checkExists(control.data('type')))
                {
                    return control.data('type');
                }

                return control.attr('type');
            }
            else
            {
                return '';
            }
        },

        getControlTypeProperties: function (options)
        {
            var node = options.node;
            var controlID = options.controlID;
            var controlType = options.controlType;
            var el = options.element;
            var metadata = options.metadata;
            var viewContextSettings = options.viewContextSettings || {};

            var xmlDocument = null;
            if (!checkExists(node))
            {
                node = SourceCode.Forms.Designers.Common.controlTypePropertiesXml.documentElement.cloneNode(true);
                xmlDocument = SourceCode.Forms.Designers.Common.controlTypePropertiesXml;
            }
            else
            {
                xmlDocument = node.ownerDocument;
            }
            var controlsDoc = SourceCode.Forms.Designers.Common.getControlDefinitionXml();
            var controlTypeProperties = controlsDoc.selectNodes('Controls/Control[Name="{0}"]/DefaultProperties/Properties/Prop'.format(controlType));

            for (var z = 0, l = controlTypeProperties.length; z < l; z++)
            {
                var propertyNode = controlTypeProperties[z];
                common.getControlProperty(xmlDocument, node, propertyNode, controlID);
            }

            // Static list hack to remove data source and replace with static items
            var isStaticList = false;
            if (checkExists(metadata))
            {
                isStaticList = metadata.DataSourceType === "Static";
            }
            else if (checkExists(el))
            {
                isStaticList = el.metadata().DataSourceType === "Static";
            }
            else
            {
                var dataSourceTypeNode = node.selectSingleNode("//Items/Item/Items/Item[@Guid='{0}']/DataSourceType".format(controlID));
                isStaticList = dataSourceTypeNode !== null ? dataSourceTypeNode.text === "Static" : false;
            }
            if (isStaticList)
            {
                //remove SmO data source
                var itemsParentNode = node.selectSingleNode("//Items/Item/Items/Item[@Guid='{0}']/Items".format(controlID)); //for Target Mapping
                if (itemsParentNode === null)
                {
                    itemsParentNode = node.selectSingleNode("//Items"); //for Context Tree
                }
                var dataSourceNode = itemsParentNode.selectSingleNode("Item[Name='Data Source']");
                //can still be null if includeControlProperties is false
                if (dataSourceNode !== null)
                {
                    itemsParentNode.removeChild(dataSourceNode);
                }

                if (viewContextSettings.includeControlFields !== "False")
                {
                    //create static control field data source
                    var staticDataSourceNode = xmlDocument.createElement("Item");
                    staticDataSourceNode.setAttribute("ItemType", "ControlField");
                    staticDataSourceNode.setAttribute("Icon", "staticdata");
                    var staticDataSourceDisplayNameNode = xmlDocument.createElement("DisplayName");
                    staticDataSourceDisplayNameNode.appendChild(xmlDocument.createTextNode(Resources.RuleDesigner.StaticListCategoryName));
                    staticDataSourceNode.appendChild(staticDataSourceDisplayNameNode);
                    var staticDataSourceNameNode = xmlDocument.createElement("Name");
                    staticDataSourceNameNode.appendChild(xmlDocument.createTextNode("Control Field"));
                    staticDataSourceNode.appendChild(staticDataSourceNameNode);
                    itemsParentNode.appendChild(staticDataSourceNode);
                    //create Items list
                    var itemsNode = xmlDocument.createElement("Items");
                    staticDataSourceNode.appendChild(itemsNode);
                    //Display
                    var displayItemNode = xmlDocument.createElement("Item");
                    displayItemNode.setAttribute("ItemType", "ControlField");
                    displayItemNode.setAttribute("Mappable", "false");
                    displayItemNode.setAttribute("Visibility", "All");
                    displayItemNode.setAttribute("ShowIcon", "false");
                    displayItemNode.setAttribute("SubType", "complex");
                    var displayNameNode = xmlDocument.createElement("DisplayName");
                    displayNameNode.appendChild(xmlDocument.createTextNode(Resources.RuleDesigner.StaticListDisplayControlField));
                    displayItemNode.appendChild(displayNameNode);
                    var displayNodeNameNode = xmlDocument.createElement("Name");
                    displayNodeNameNode.appendChild(xmlDocument.createTextNode("{0}_DisplayStaticField".format(controlID)));
                    displayItemNode.appendChild(displayNodeNameNode);
                    var displaytNodeIDNode = xmlDocument.createElement("id");
                    displaytNodeIDNode.appendChild(xmlDocument.createTextNode("{0}_DisplayStaticField".format(controlID)));
                    displayItemNode.appendChild(displaytNodeIDNode);
                    var displayNodeSourceIDNode = xmlDocument.createElement("SourceID");
                    displayNodeSourceIDNode.appendChild(xmlDocument.createTextNode("DisplayStaticField"));
                    displayItemNode.appendChild(displayNodeSourceIDNode);
                    var displayNodeSourcePathNode = xmlDocument.createElement("SourcePath");
                    displayNodeSourcePathNode.appendChild(xmlDocument.createTextNode(controlID));
                    displayItemNode.appendChild(displayNodeSourcePathNode);
                    var displayNodeSourcePathNode = xmlDocument.createElement("TargetId");
                    displayNodeSourcePathNode.appendChild(xmlDocument.createTextNode("DisplayStaticField"));
                    displayItemNode.appendChild(displayNodeSourcePathNode);
                    var displayNodeSourcePathNode = xmlDocument.createElement("TargetPath");
                    displayNodeSourcePathNode.appendChild(xmlDocument.createTextNode(controlID));
                    displayItemNode.appendChild(displayNodeSourcePathNode);
                    itemsNode.appendChild(displayItemNode);
                    //Value
                    var valueItemNode = xmlDocument.createElement("Item");
                    valueItemNode.setAttribute("ItemType", "ControlField");
                    valueItemNode.setAttribute("Mappable", "false");
                    valueItemNode.setAttribute("Visibility", "All");
                    valueItemNode.setAttribute("ShowIcon", "false");
                    valueItemNode.setAttribute("SubType", "complex");
                    var valueNode = xmlDocument.createElement("DisplayName");
                    valueNode.appendChild(xmlDocument.createTextNode(Resources.RuleDesigner.StaticListValueControlField));
                    valueItemNode.appendChild(valueNode);
                    var valueNodeNameNode = xmlDocument.createElement("Name");
                    valueNodeNameNode.appendChild(xmlDocument.createTextNode("{0}_ValueStaticField".format(controlID)));
                    valueItemNode.appendChild(valueNodeNameNode);
                    var valueNodeIDNode = xmlDocument.createElement("id");
                    valueNodeIDNode.appendChild(xmlDocument.createTextNode("{0}_ValueStaticField".format(controlID)));
                    valueItemNode.appendChild(valueNodeIDNode);
                    var valueNodeSourceIDNode = xmlDocument.createElement("SourceID");
                    valueNodeSourceIDNode.appendChild(xmlDocument.createTextNode("ValueStaticField"));
                    valueItemNode.appendChild(valueNodeSourceIDNode);
                    var valueNodeSourcePathNode = xmlDocument.createElement("SourcePath");
                    valueNodeSourcePathNode.appendChild(xmlDocument.createTextNode(controlID));
                    valueItemNode.appendChild(valueNodeSourcePathNode);
                    var valueNodeSourcePathNode = xmlDocument.createElement("TargetId");
                    valueNodeSourcePathNode.appendChild(xmlDocument.createTextNode("ValueStaticField"));
                    valueItemNode.appendChild(valueNodeSourcePathNode);
                    var valueNodeSourcePathNode = xmlDocument.createElement("TargetPath");
                    valueNodeSourcePathNode.appendChild(xmlDocument.createTextNode(controlID));
                    valueItemNode.appendChild(valueNodeSourcePathNode);
                    itemsNode.appendChild(valueItemNode);
                    //IsDefault
                    var isdefaultItemNode = xmlDocument.createElement("Item");
                    isdefaultItemNode.setAttribute("ItemType", "ControlField");
                    isdefaultItemNode.setAttribute("Mappable", "false");
                    isdefaultItemNode.setAttribute("Visibility", "All");
                    isdefaultItemNode.setAttribute("Icon", "yesno");
                    isdefaultItemNode.setAttribute("ShowIcon", "false");
                    isdefaultItemNode.setAttribute("SubType", "bool");
                    var isdefaultNode = xmlDocument.createElement("DisplayName");
                    isdefaultNode.appendChild(xmlDocument.createTextNode(Resources.RuleDesigner.StaticListIsDefaultControlField));
                    isdefaultItemNode.appendChild(isdefaultNode);
                    var isdefaultNodeNameNode = xmlDocument.createElement("Name");
                    isdefaultNodeNameNode.appendChild(xmlDocument.createTextNode("{0}_IsDefaultStaticField".format(controlID)));
                    isdefaultItemNode.appendChild(isdefaultNodeNameNode);
                    var isdefaultNodeIDNode = xmlDocument.createElement("id");
                    isdefaultNodeIDNode.appendChild(xmlDocument.createTextNode("{0}_IsDefaultStaticField".format(controlID)));
                    isdefaultItemNode.appendChild(isdefaultNodeIDNode);
                    var isdefaultNodeSourceIDNode = xmlDocument.createElement("SourceID");
                    isdefaultNodeSourceIDNode.appendChild(xmlDocument.createTextNode("IsDefaultStaticField"));
                    isdefaultItemNode.appendChild(isdefaultNodeSourceIDNode);
                    var isdefaultNodeSourcePathNode = xmlDocument.createElement("SourcePath");
                    isdefaultNodeSourcePathNode.appendChild(xmlDocument.createTextNode(controlID));
                    isdefaultItemNode.appendChild(isdefaultNodeSourcePathNode);
                    var isdefaultNodeSourcePathNode = xmlDocument.createElement("TargetId");
                    isdefaultNodeSourcePathNode.appendChild(xmlDocument.createTextNode("DisplayStaticField"));
                    isdefaultItemNode.appendChild(isdefaultNodeSourcePathNode);
                    var isdefaultNodeSourcePathNode = xmlDocument.createElement("TargetPath");
                    isdefaultNodeSourcePathNode.appendChild(xmlDocument.createTextNode(controlID));
                    isdefaultItemNode.appendChild(isdefaultNodeSourcePathNode);
                    itemsNode.appendChild(isdefaultItemNode);
                }
            }
            // end static list hack
            return node;
        },

        getControlProperty: function (xmlDocument, controlNode, definitionNode, controlID)
        {
            var id = definitionNode.getAttribute("ID");
            var type = definitionNode.getAttribute("type");
            var friendlyName = definitionNode.getAttribute("friendlyname");
            var category = definitionNode.getAttribute("category");
            var mappable = checkExists(definitionNode.getAttribute("mappable")) ? definitionNode.getAttribute("mappable") : "true";
            var visibility = checkExists(definitionNode.getAttribute("Visibility")) ? definitionNode.getAttribute("Visibility") : "All";
            var itemsCollection = null;

            if (type === 'drop' && checkExists(definitionNode.getAttribute('SelectionText')) && definitionNode.getAttribute('SelectionText') !== '' && checkExists(definitionNode.getAttribute('SelectionValue')))
            {
                itemsCollection = definitionNode.getAttribute('SelectionText') + '+' + definitionNode.getAttribute('SelectionValue');
            }

            var setFunction = type === 'complex' ? (checkExists(definitionNode.getAttribute('DesignerSet')) ? definitionNode.getAttribute('DesignerSet') : null) : null;
            var getDropItemsFunction = type === 'drop' ? (checkExists(definitionNode.getAttribute('getDropItemsFunction')) ? definitionNode.getAttribute('getDropItemsFunction') : null) : null;
            var getSpinOptionsFunction = type === 'spin' ? (checkExists(definitionNode.getAttribute('GetSpinOptionsFunction')) ? definitionNode.getAttribute('GetSpinOptionsFunction') : null) : null;
            var initializeServerControl = checkExists(definitionNode.getAttribute('InitializeServerControl')) ? definitionNode.getAttribute('InitializeServerControl') : null;
            var serverControl = checkExists(definitionNode.getAttribute('ServerControl')) ? definitionNode.getAttribute('ServerControl') : null;
            var parentCategory = controlNode.selectSingleNode("Items/Item[Name='{0}']/Items".format(category));
            var validationPattern = definitionNode.getAttribute('ValidationPattern');
            var validationMessage = definitionNode.getAttribute('ValidationMessage');
            var readOnly = definitionNode.getAttribute('ReadOnly');
            var hasIcon = checkExists(definitionNode.getAttribute('showIcon')) ? definitionNode.getAttribute('showIcon') : 'false';

            if (!checkExists(parentCategory))
            {
                var itemsForParent = controlNode.selectSingleNode("Items");
                if (!checkExists(itemsForParent))
                {
                    itemsForParent = xmlDocument.createElement('Items');
                    controlNode.appendChild(itemsForParent);
                }

                var parentCategoryItem = xmlDocument.createElement('Item');
                var parentCategory = xmlDocument.createElement('Items');
                parentCategoryItem.appendChild(parentCategory);
                itemsForParent.appendChild(parentCategoryItem);

                parentCategoryItem.setAttribute('ItemType', 'ControlProperty');

                var nameItem = xmlDocument.createElement('Name');
                var nameItemTextNode = xmlDocument.createTextNode(category);
                nameItem.appendChild(nameItemTextNode);
                parentCategoryItem.appendChild(nameItem);

                var displaynameItem = xmlDocument.createElement('DisplayName');
                var displaynameItemTextNode = xmlDocument.createTextNode(category);
                displaynameItem.appendChild(displaynameItemTextNode);
                parentCategoryItem.appendChild(displaynameItem);

            }

            //this comment can be used to find all places to change control property mappings xml SFCP
            var property = xmlDocument.createElement('Item');

            var nameItem = xmlDocument.createElement('Name');
            var nameItemTextNode = xmlDocument.createTextNode("{0}_{1}".format(controlID, id));
            nameItem.appendChild(nameItemTextNode);
            property.appendChild(nameItem);

            var displaynameItem = xmlDocument.createElement('DisplayName');
            var displaynameItemTextNode = xmlDocument.createTextNode(friendlyName);
            displaynameItem.appendChild(displaynameItemTextNode);
            property.appendChild(displaynameItem);

            if (checkExists(type))
            {
                var subTypeItem = xmlDocument.createElement('SubType');
                var subTypeItemTextNode = xmlDocument.createTextNode(type);
                subTypeItem.appendChild(subTypeItemTextNode);
                property.appendChild(subTypeItem);
            }

            var targetIDItem = xmlDocument.createElement('TargetID');
            var targetIDItemTextNode = xmlDocument.createTextNode(id);
            targetIDItem.appendChild(targetIDItemTextNode);
            property.appendChild(targetIDItem);

            var targetPathItem = xmlDocument.createElement('TargetPath');
            var targetPathItemTextNode = xmlDocument.createTextNode(controlID);
            targetPathItem.appendChild(targetPathItemTextNode);
            property.appendChild(targetPathItem);

            property.setAttribute('ItemType', 'ControlProperty');
            property.setAttribute('Mappable', mappable);
            property.setAttribute('Visibility', visibility);

            if (itemsCollection !== null)
            {
                property.setAttribute('Options', itemsCollection);
            }

            if (setFunction !== null)
            {
                property.setAttribute('SetFunction', setFunction);
            }

            if (getDropItemsFunction !== null)
            {
                property.setAttribute('getDropItemsFunction', getDropItemsFunction);
            }

            if (getSpinOptionsFunction !== null)
            {
                property.setAttribute('getSpinOptionsFunction', getSpinOptionsFunction);
            }

            if (initializeServerControl !== null)
            {
                property.setAttribute('InitializeServerControl', initializeServerControl);
                property.setAttribute('ServerControl', serverControl);
            }

            if (checkExists(validationPattern) && validationPattern !== '')
            {
                property.setAttribute('ValidationPattern', validationPattern);
                property.setAttribute('ValidationMessage', validationMessage);
            }

            if (checkExists(readOnly) && readOnly !== '')
            {
                property.setAttribute('ReadOnly', readOnly);
            }

            property.setAttribute('ShowIcon', hasIcon);

            parentCategory.appendChild(property);
        },

        getControlTypeFunction: function (controlTypeName, controlPropertyName, functionName, functionText)
        {
            var controlTypeIndex = controlTypeName + "_" + controlPropertyName + "_" + functionName;
            var fn = SourceCode.Forms.Designers.controlTypePropertyFunctionCache[controlTypeIndex];
            if (typeof fn === "undefined")
            {
                if (!checkExists(functionText))
                {
                    var setPropertyFunction = SourceCode.Forms.Designers.Common.controlDefinitionsXml.selectSingleNode('Controls/Control[Name= "{0}"]/DefaultProperties/Properties/Prop[@ID="{1}"]/@{2}'.format(controlTypeName, controlPropertyName, functionName));
                    if (checkExists(setPropertyFunction))
                    {
                        functionText = setPropertyFunction.text;
                    }
                }

                if (checkExists(functionText))
                {
                    fn = SourceCode.Forms.Designers.propertyFunctionCache[functionText];
                    if (typeof fn === "undefined")
                    {
                        try
                        {
                            fn = eval(functionText);
                        }
                        catch (ex)
                        {
                            fn = null;
                        }
                        SourceCode.Forms.Designers.propertyFunctionCache[functionText] = fn;
                    }
                    SourceCode.Forms.Designers.controlTypePropertyFunctionCache[controlTypeIndex] = fn;
                }
                else
                {
                    SourceCode.Forms.Designers.controlTypePropertyFunctionCache[controlTypeIndex] = null;
                    return null;
                }
            }
            return fn;
        },

        _getTabIndexSpinnerOptions: function ()
        {
            return {
                inputs: [{
                    range: {
                        min: -1,
                        max: 126,
                        step: 1
                    },
                    displays: {
                        "-1": Resources.ControlProperties.TabIndexNone,
                        0: Resources.ControlProperties.TabIndexDefault
                    },
                    defaultValue: 0
                }],
                eventsHandler: "SourceCode.Forms.Designers.Common.setTabIndex"
            };
        },

        getItemTypeIcon: function (type, subType, name)
        {
            if (checkExistsNotEmpty(type))
            {
                type = type.toLowerCase();
            }

            if (checkExistsNotEmpty(subType))
            {
                subType = subType.toLowerCase();
            }

            if (checkExistsNotEmpty(name))
            {
                name = name.toLowerCase();
            }

            if (type === 'objectproperty' || type === 'methodrequiredproperty' || type === 'methodoptionalproperty' || type === 'methodreturnedproperty' || type === 'methodparameter')
            {
                switch (subType)
                {
                    case "autoguid":
                        return "auto-guidFF";
                    case "autonumber":
                        return "auto-numberFF";
                    case "datetime":
                        return "date-timeFF";
                    case "date":
                        return "dateFF";
                    case "time":
                        return "timeFF";
                    case "decimal":
                        return "decimalFF";
                    case "file":
                        return "fileFF";
                    case "guid":
                        return "guidFF";
                    case "hyperlink":
                        return "hyperlinkFF";
                    case "image":
                        return "imageFF";
                    case "memo":
                        return "memoFF";
                    case "number":
                        return "numberFF";
                    case "yesno":
                        return "yesnoFF";
                    case "multivalue":
                        return "multi-valueFF";
                    case "text":
                    default:
                        return "textFF";
                }
            }

            switch (subType)
            {
                case "autoguid":
                    return "auto-guid";
                case "autonumber":
                    return "auto-number";
                case "datetime":
                    return "date-time";
                case "date":
                    return "date";
                case "time":
                    return "time";
                case "decimal":
                    return "decimal";
                case "file":
                    return "file";
                case "guid":
                    return "guid";
                case "hyperlink":
                    return "hyperlink";
                case "image":
                    return "image";
                case "memo":
                    return "memo";
                case "number":
                    return "number";
                case "yesno":
                    return "yesno";
                case "multivalue":
                    return "multi-value";
                case "text":
                    return "text";
                case "boolean":
                    return "boolean";
                default:
                    break;
            }

            if (checkExistsNotEmpty(type))
            {
                switch (type)
                {
                    case "form":
                        return "form";
                    case "formparameter":
                        return "formparameter";
                    case "viewparameter":
                        return "viewparameter";
                    case "viewfield":
                        switch (subType)
                        {
                            case "areaitem":
                                return "areaitem";
                            case "fieldcontext":
                                return "smartobject";
                        }
                        return "text";
                    case "control":
                        {
                            switch (subType)
                            {
                                case "areaitem":
                                    return "areaitem";
                                case "fieldcontext":
                                    return "smartobject";
                            }

                            if (checkExistsNotEmpty(subType))
                            {
                                return subType + "-control";
                            }
                        }
                        return type;
                    case "controlmethod":
                        return "control-method";
                    case "controlmethodparameter":
                        return "control-method-parameters";
                    case "controlfield":
                    case "controlproperty":
                        return "controlproperty";
                    case "object":
                        return "smartobjectFF";
                    case "objectmethod":
                    case "method":
                    case "viewmethod":
                        return "smartobject-method";
                    case "fieldcontext":
                        return "smartobject";
                    case "formevent":
                        return "form-event";
                    case "processfolder":
                        return "workflows";
                    case "process":
                        return "workflow";
                    case "processproperty":
                    case "activityproperty":
                        {
                            switch (name)
                            {
                                case "folio":
                                case "serialnumber":
                                case "name":
                                case "displayname":
                                case "description":
                                case "instructions":
                                case "viewflow":
                                case "originatorname":
                                case "originatordisplayname":
                                case "originatordescription":
                                case "originatorlabel":
                                case "originatorfqn":
                                case "data":
                                    return "text";
                                case "priority":
                                case "expectedduration":
                                case "id":
                                    return "number";
                                case "actionname":
                                    return "workflow-action-name";
                                case "guid":
                                    return "guid";
                                case "startdate":
                                    return "datetime";
                                case "originator":
                                case "originatormanager":
                                    return "user";
                                case "originatoremail":
                                    return "mail";
                                case "originatormanagedusers":
                                    return "group";
                                default:
                                    break;
                            }
                        }
                        break;
                    case "result":
                        {
                            switch (name)
                            {
                                case "getworkflowactions":
                                    return "workflow-actions";
                            }
                        }
                        break;
                    case "processdatafield":
                    case "activitydatafield":
                        return "data-field";
                    case "processxmlfield":
                    case "activityxmlfield":
                    case "processitemreference":
                        return "xml-field";
                    case "activity":
                        return "process-activities";
                    case "view":
                        return "view";
                    case "viewsource":
                        return "smartobject";
                    default:
                        break;
                }
                return type;
            }

            return "";
        },

        isWorkflowItemType: function (itemType)
        {
            var isWorkflow = false;

            switch (itemType)
            {
                case "ProcessDataField":
                case "ProcessXmlField":
                case "ActivityDataField":
                case "ActivityXmlField":
                case "ActivityProperty":
                case "ProcessProperty":
                case "ProcessItemReference":
                    isWorkflow = true;
                    break;
            }
            return isWorkflow;
        },

        setTabIndex: function (_valueText, editItem, controlId)
        {
            var prevVal = _valueText;
            var editItemSpinner = editItem.closest(".spinner");
            editItem.on('change blur keyup keydown', function (event)
            {
                prevVal = prevVal === Resources.ControlProperties.TabIndexNone ? "-1" : prevVal === Resources.ControlProperties.TabIndexDefault ? "0" : prevVal;
                var spinnerVal = (event.target.value).toString();
                spinnerVal = spinnerVal === Resources.ControlProperties.TabIndexNone ? "-1" : spinnerVal === Resources.ControlProperties.TabIndexDefault ? "0" : spinnerVal;

                var key = event.keyCode || event.charCode;

                if (key === 110 || key === 190)
                    return false;

                if (key === 8 || key === 46)
                {
                    if (spinnerVal === "")
                    {
                        if (_valueText !== "scp") SetControlTabIndex(["0"], controlId);
                        editItemSpinner.spinner("value", [0]);
                        event.stopPropagation();
                        $(editItem).val("");
                        return false;
                    }
                    else if (spinnerVal === "-1" || spinnerVal === "0")
                    {
                        if (_valueText !== prevVal)
                        {
                            if (_valueText !== "scp") SetControlTabIndex(["0"], controlId);
                            editItemSpinner.spinner("value", [0]);
                        }
                        event.stopPropagation();
                        $(editItem).val("");
                        return false;
                    }
                    else if (spinnerVal > "0")
                    {
                        return true;
                    }
                }
                if ((spinnerVal === "-1" || spinnerVal === "0") && ((key > 48 && key <= 57) || (key >= 96 && key <= 105)))
                {
                    $(editItem).val("");
                    return true;
                }
                if (prevVal !== spinnerVal)
                {
                    if (_valueText !== "scp") SetControlTabIndex([spinnerVal], controlId);
                    prevVal = spinnerVal;
                    editItemSpinner.spinner("value", [spinnerVal]);
                }
            });
        },

        getControlDefinitionXml: function ()
        {
            return SourceCode.Forms.Designers.Common.controlDefinitionsXml;
        },

        getDefinitionNode: function ()
        {
            return SourceCode.Forms.Designers.Common.Context._getDefinitionNode();
        },

        getDefinitionXML: function ()
        {
            return SourceCode.Forms.Designers.Common.Context._getDefinitionXml();
        },

        getContextXPath: function ()
        {
            return SourceCode.Forms.Designers.Common.Context._getContextXPath();
        },

        getContextXPathForEvents: function ()
        {
            return SourceCode.Forms.Designers.Common.Context._getContextXPathForEvents();
        },

        removeRowFromXml: function (rowId) 
        {
            var definitionXml = SourceCode.Forms.Designers.Common.getDefinitionXML();

            var rowNode = definitionXml.selectSingleNode("//Control[(@LayoutType='Grid')]/Rows/Row[@ID='{0}']".format(rowId));
            if (checkExists(rowNode))
            {
                rowNode.parentNode.removeChild(rowNode);
                //now remove row control
                var controlNode = definitionXml.selectSingleNode("//Controls/Control[@ID='{0}']".format(rowId));
                if (checkExists(controlNode))
                {
                    controlNode.parentNode.removeChild(controlNode);
                }
            }
        },

        removeCellFromXml: function (cellId)
        {
            var definitionXml = SourceCode.Forms.Designers.Common.getDefinitionXML();

            var cellNode = definitionXml.selectSingleNode("//Control[(@LayoutType='Grid')]//Cells/Cell[@ID='{0}']".format(cellId));
            if (checkExists(cellNode))
            {
                cellNode.parentNode.removeChild(cellNode);
                //now remove cell control
                var controlNode = definitionXml.selectSingleNode("//Controls/Control[@ID='{0}']".format(cellId));
                if (checkExists(controlNode))
                {
                    controlNode.parentNode.removeChild(controlNode);
                }
            }
        },

        _getTransformedControlTypePropertyXml: function (options)
        {
            var xmlResponse = null;
            var propertyXML = this.getControlTypeProperties({
                node: null,
                controlID: options.id,
                controlType: options.subType,
                element: options.node,
                metadata: options.metadata,
                viewContextSettings: options.viewContextSettings
            });

            if (checkExists(propertyXML) && checkExists(propertyXML.xml) && propertyXML.xml !== "")
            {
                propertyXML = propertyXML.selectSingleNode("Items");
                if (checkExists(propertyXML))
                {
                    var transformer = new XslTransform();
                    transformer.importStylesheet(applicationRoot + "Rules/XSLT/ContextTree.xslt");
                    transformer.addParameter("Fields", ContextTree_TreeExtraHeading_Fields);
                    transformer.addParameter("Controls", ContextTree_TreeExtraHeading_Controls);
                    transformer.addParameter("Expressions", ContextTree_TreeExtraHeading_Expressions);
                    transformer.addParameter("Methods", ContextTree_TreeExtraHeading_Methods);
                    transformer.addParameter("Parameters", ContextTree_TreeExtraHeading_Parameters);
                    transformer.addParameter("InputProperties", ContextTree_TreeExtraHeading_InputProperties);
                    transformer.addParameter("ReturnProperties", ContextTree_TreeExtraHeading_ReturnProperties);
                    transformer.addParameter("NoItemsToDisplay", ContextTree_NoItemsToDisplay);
                    transformer.addParameter("Display", ContextTree_ListDisplay);
                    transformer.addParameter("Edit", ContextTree_ListEdit);
                    transformer.addParameter("Header", ContextTree_ListHeader);
                    transformer.addParameter("Footer", ContextTree_ListFooter);
                    transformer.addParameter("ControlMethodProperties", ContextTree_TreeExtraHeading_ControlMethodProperties);
                    transformer.addParameter("ControlMethodResult", ContextTree_TreeExtraHeading_ControlMethodResult);
                    transformer.addParameter("SubFormInstanceID", options.subformInstanceID);
                    transformer.addParameter("SubFormID", options.subformId);
                    transformer.addParameter("InstanceID", options.instanceId);
                    transformer.addParameter("TitleSystemName", ContextTree_TitleSystemNameLabel);
                    transformer.addParameter("TitleDescription", ContextTree_TitleDescriptionLabel);

                    xmlResponse = parseXML(transformer.transformToText(propertyXML.xml));
                }
            }

            return xmlResponse;
        },

        //#region Expressions

        showExpressions: function (context, isCurrent, controlID, subFormID, subformType, contextType, contextID, targetXml)
        {
            var controlInstanceID = targetXml.selectSingleNode("//Item[@Guid='" + controlID + "']").getAttribute("InstanceID");
            var expressionContextPlugins = SourceCode.Forms.Designers.Common.Context.getExpressionContextPlugins(isCurrent, controlID, subFormID, subformType, contextType, contextID, controlInstanceID);
            SourceCode.Forms.ExpressionContextHelper._BuildExpressionContextTreeXml(expressionContextPlugins, context, this.showExpressionsInternal, [isCurrent, controlID, subFormID, contextType, contextID, targetXml]);
        },

        showExpressionsInternal: function (contextXML, isCurrent, controlID, subFormID, contextType, contextID, targetXml)
        {
            if (isCurrent === "True")
            {
                var xPath = SourceCode.Forms.Designers.Common.getContextXPath();
                var definitionNode = SourceCode.Forms.Designers.Rule.tmpContextDefinition;
                var definitionXML = SourceCode.Forms.Designers.Common.getDefinitionXML();
                var ExpressionsNode = definitionNode.selectSingleNode("//Expressions");

                if (ExpressionsNode === null)
                {
                    ExpressionsNode = definitionNode.selectSingleNode(xPath).appendChild(definitionNode.createElement("Expressions"));
                }

                var controlNode = definitionNode.selectSingleNode("//Controls/Control[@ID='" + controlID + "']");

                if (!checkExists(controlNode))
                {
                    var expResult = SourceCode.Forms.Designers.Common.getChildItemExpressionNode(contextID, contextType, controlID);

                    if (expResult === false)
                    {
                        return false;
                    }

                    var ExpressionsNode = expResult.expressionsNode;
                    var controlNode = expResult.controlNode;

                    isCurrent = "False";
                }
            }
            else
            {
                var expResult = SourceCode.Forms.Designers.Common.getSubformExpressionsNode(subFormID, controlID);
                var ExpressionsNode = expResult.expressionsNode;
                var controlNode = expResult.controlNode;
            }

            if (checkExists(ExpressionsNode) && checkExists(controlNode))
            {
                var setControlPropery = false;
                SourceCode.Forms.Widget.ExpressionGrid.SelectExpression(ExpressionsNode, contextXML, controlNode, isCurrent === "True", function (result, context)
                {
                    if (result[1] === null) // Set 'None' value
                    {
                        context.setComplexPropertyValue(result, context.control);
                    }
                    else
                    {
                        context.value(result[1][0].value);
                    }

                    if (isCurrent === "True")
                    {
                        SourceCode.Forms.Designers.Common.mergeDefinitionXml(result[2]);
                    }
                }, this, setControlPropery, null, true);
            }
        },

        getChildItemExpressionNode: function (targetID, targetType, controlID)
        {
            var qs = {
                method: 'GetItemDefinition',
                targetID: targetID,
                targetType: targetType
            };

            var options = {
                url: 'Utilities/AJAXCall.ashx',
                type: 'POST',
                cache: false,
                data: qs,
                async: false,
                timeout: 3000
            };

            var response = $.ajax(options).responseText;

            if (SourceCode.Forms.ExceptionHandler.isException(response))
            {
                SourceCode.Forms.ExceptionHandler.handleException(response);
                return false;
            }

            if (response !== '')
            {
                var definitionNode = parseXML(response);

                var ExpressionsNode = definitionNode.selectSingleNode("//Expressions");

                if (ExpressionsNode === null)
                {
                    ExpressionsNode = parseXML("<Expressions/>");
                }

                var controlNode = definitionNode.selectSingleNode("//Controls/Control[@ID='" + controlID + "']");
            }

            return ({ expressionsNode: ExpressionsNode, controlNode: controlNode });
        },

        getSubformExpressionsNode: function (subformID, controlID)
        {
            var qs = {
                method: 'getSubFormDefinition',
                subformID: subformID
            };

            var options = {
                url: 'Utilities/AJAXCall.ashx',
                type: 'POST',
                cache: false,
                data: qs,
                async: false,
                timeout: 3000
            };

            var response = $.ajax(options).responseText;

            if (SourceCode.Forms.ExceptionHandler.isException(response))
            {
                SourceCode.Forms.ExceptionHandler.handleException(response);
            }

            if (response !== '')
            {
                var definitionNode = parseXML(response);

                var ExpressionsNode = definitionNode.selectSingleNode("//Expressions");

                if (ExpressionsNode === null)
                {
                    ExpressionsNode = parseXML("<Expressions/>");
                }

                var controlNode = definitionNode.selectSingleNode("//Controls/Control[@ID='" + controlID + "']");
            }

            return ({ expressionsNode: ExpressionsNode, controlNode: controlNode });
        },

        getExpressionName: function (id, isCurrent, subformID, targetType, targetID, definitionNode)
        {
            if (!checkExistsNotEmpty(definitionNode))
            {
                var definitionNode = this.getDefinitionNode();
            }
            var result = "";

            if (isCurrent)
            {
                var ExpressionsNode = definitionNode.selectSingleNode("Expressions");

                if (checkExists(ExpressionsNode) && checkExists(ExpressionsNode.selectSingleNode("Expression[@ID='" + id + "']/Name")))
                {
                    result = ExpressionsNode.selectSingleNode("Expression[@ID='" + id + "']/Name").text;
                }

                if (!checkExists(result) || result === "" && checkExists(targetType) && targetType !== "" && checkExists(targetID) && targetID !== "")
                {
                    var expResult = SourceCode.Forms.Designers.Common.getChildItemExpressionNode(targetID, targetType);
                    var ExpressionsNode = expResult.expressionsNode;

                    if (checkExists(ExpressionsNode))
                    {
                        result = checkExists(ExpressionsNode.selectSingleNode("Expression[@ID='" + id + "']/Name")) ? ExpressionsNode.selectSingleNode("Expression[@ID='" + id + "']/Name").text : "";
                    }
                }
            }
            else
            {
                var expResult = this.getSubformExpressionsNode(subformID);
                var ExpressionsNode = expResult.expressionsNode;
                result = checkExists(ExpressionsNode.selectSingleNode("Expression[@ID='" + id + "']/Name")) ? ExpressionsNode.selectSingleNode("Expression[@ID='" + id + "']/Name").text : "";
            }

            return result;
        },

        //#endregion Expressions

        mergeDefinitionXml: function (expressionsNode)
        {
            var definitionNode = this.getDefinitionNode();
            var contextDefinition = SourceCode.Forms.Designers.Rule.tmpContextDefinition;

            var xPath = SourceCode.Forms.Designers.Common.getContextXPath();

            var previousExpressionsNode = contextDefinition.selectSingleNode("//Expressions");

            if (checkExists(previousExpressionsNode))
            {
                var parentNode = previousExpressionsNode.parentNode;
                parentNode.removeChild(previousExpressionsNode);
            }

            if (expressionsNode.selectNodes("Expression").length > 0)
            {
                contextDefinition.selectSingleNode(xPath).appendChild(expressionsNode);
            }

            SourceCode.Forms.Designers.Rule.tmpContextDefinition = contextDefinition;
        },

        //#region Complex properties

        showComplexPropertyPopupFailure: function (XMLHttpRequest, textStatus, errorThrown)
        {
            modalizer.hide();
            SourceCode.Forms.ExceptionHandler.handleException(errorThrown);
        },

        closeInternalComplexPropertyPopup: function (value, context)
        {
            context.setComplexPropertyValue(value, context.control);

            var divComplexProperty = $('.complex-property-config-wrapper, #divComplexProperty');
            divComplexProperty.css('display', 'none');
        },

        showInternalComplexPropertyPopupResult: function (data, textStatus, context, hasDiv)
        {
            if (SourceCode.Forms.ExceptionHandler.isException(data))
            {
                //hide busy
                modalizer.hide();
                SourceCode.Forms.ExceptionHandler.handleException(data);
            }
            else
            {
                var xmlDoc = data;
                var htmlElem = xmlDoc.selectSingleNode('complexpropertypopup/html');

                if (hasDiv)
                {
                    $('#divComplexProperty').append($(htmlElem.text));
                }
                else
                {
                    $("<div class=\"complex-property-config-wrapper\"></div>").html(htmlElem.text).appendTo("body");
                }

                if ($chk(htmlElem.getAttribute('init')) === true)
                {
                    eval(htmlElem.getAttribute('init') + '(null, null, null, null, SourceCode.Forms.Designers.Common.closeInternalComplexPropertyPopup, true, context)');
                }
            }
        },

        //#endregion


        //#region Canvas Event Registering


        registerForEvent: function (eventName, callback)
        {
            //doesn't matter which element it is, as long as it is within current designer (i.e. Context)
            //also must be the same element as in deregister/register
            var elementToAttachEventsTo = $("body"); //SourceCode.Forms.Designers.Common.getDesignerCanvasScrollWrapper();
            elementToAttachEventsTo.on(eventName, callback);
        },

        deregisterForEvent: function (eventName, callback)
        {
            //doesn't matter which element it is, as long as it is within current designer (i.e. Context)
            //also must be the same element as in deregister/register
            var elementToAttachEventsTo = $("body");
            elementToAttachEventsTo.off(eventName, callback);
        },

        triggerEvent: function (eventName, data)
        {
            //doesn't matter which element it is, as long as it is within current designer (i.e. Context)
            //also must be the same element as in deregister/register
            var elementToAttachEventsTo = $("body");
            elementToAttachEventsTo.trigger(eventName, data);
        },

        triggerEventFromControlElement: function (eventName, jqElement)
        {
            var controlObjectModel = common._getControlObjectModelFromElement(jqElement);
            common.triggerEvent(eventName, controlObjectModel);
        },

        triggerEventFromControlId: function (eventName, id)
        {
            var wrapper = $(common.getDesignerCanvasScrollWrapper());
            var jqControlElement = wrapper.find("#" + id);
            common.triggerEventFromControlElement(eventName, jqControlElement);
        },

        //helper for _getControlObjectModelFromElement
        _getControlTypeFromElement: function (jqElement)
        {
            var controlType = "";
            var controlTypeData = jqElement.data("type");
            if (checkExists(controlTypeData))
            {
                controlType = controlTypeData.toLowerCase();
            }
            else
            {
                var controlTypeAttr = jqElement.attr("controlType");
                if (checkExists(controlTypeAttr)) controlType = controlTypeAttr.toLowerCase();
            }
            if (jqElement.is(".view-canvas")) controlType = 'viewinstance';

            return controlType;
        },

        //helper for _getControlObjectModelFromElement
        _getVisualElementFromControlElement: function (jqElement)
        {
            //some control elements are not the item a selection loop sould go around.
            //example: when a view is selected ona form, the view-canvas is clicked on, but its the panel
            //         directly inside that that needs the loop and other widgets.
            var result = jqElement;

            if (jqElement.is(".view-canvas"))
            {
                var innerviewpanel = jqElement.find(">.panel");
                if (innerviewpanel.length === 1) result = innerviewpanel;
            }

            if (jqElement.attr("controltype") === "Table") 
            {
                var resizeWrapper = jqElement.find(">.resizewrapper");
                if (resizeWrapper.length === 1)
                {
                    var tableElement = resizeWrapper.find(">.editor-table");
                    if (tableElement.length === 1) result = tableElement;
                }
            }

            return result;
        },

        //This is a way to start passing around Object models before moving to Angular fully.
        _getControlObjectModelFromElement: function (jqElement)
        {
            var controlObjectModel = {};
            if (!checkExists(jqElement) || jqElement.length === 0)
            {
                controlObjectModel = {
                    id: "",
                    controlType: ""
                };
            }
            else
            {
                var visualElement = common._getVisualElementFromControlElement(jqElement);
                var controlType = common._getControlTypeFromElement(jqElement);
                var resizeWrapper = (controlType === 'cell' || controlType === 'view') ? null : jqElement.find('.resizewrapper').first();

                controlObjectModel = {
                    id: jqElement.attr('id'),
                    controlType: controlType,
                    layoutType: jqElement.attr('layouttype'),
                    element: jqElement,
                    visualElement: visualElement,
                    resizeWrapper: resizeWrapper
                };
            }
            return controlObjectModel;
        },

        //#endregion

        getFormsImageName: function (imageId)
        {
            var qs = {
                tofire: 'getFormImageName',
                imageid: imageId
            };

            var options = {
                url: 'Views/AJAXCall.ashx',
                type: 'POST',
                cache: false,
                data: qs,
                async: false,
                timeout: 3000
            };

            var response = $.ajax(options).responseText;

            if (SourceCode.Forms.ExceptionHandler.isException(response))
            {
                SourceCode.Forms.ExceptionHandler.handleException(response);
            }
            else
            {
                return response;
            }
        },

        getSmartObjectName: function (guid)
        {
            if (checkExists(guid))
            {
                var qs = {
                    tofire: 'getSmartObjectDetail',
                    soid: guid
                };

                var options = {
                    url: 'Views/AJAXCall.ashx',
                    type: 'POST',
                    cache: false,
                    data: qs,
                    async: false,
                    timeout: 3000
                };

                var response = $.ajax(options).responseText;

                if (SourceCode.Forms.ExceptionHandler.isException(response))
                {
                    SourceCode.Forms.ExceptionHandler.handleException(response);
                }
                else
                {
                    var responseDoc = parseXML(response);
                    var displayNameNode = checkExists(responseDoc) ? responseDoc.selectSingleNode("//displayname") : null;
                    return displayNameNode !== null ? displayNameNode.text : null;
                }
            }
            else
            {
                return null;
            }
        },


        getDesigner: function ()
        {
            var isViewDesigner = (SourceCode.Forms.Designers.Common.Context === SourceCode.Forms.Designers.Common.View);
            return (isViewDesigner) ? SourceCode.Forms.Designers.View : SourceCode.Forms.Designers.Form;
        },

        isViewDesigner: function ()
        {
            return (SourceCode.Forms.Designers.Common.Context === SourceCode.Forms.Designers.Common.View);
        },

        isFormDesigner: function ()
        {
            return (SourceCode.Forms.Designers.Common.Context === SourceCode.Forms.Designers.Common.Form);
        },


        //options
        //{
        //	subDesignerType
        //	propertyId
        //	controlId
        //	controlType
        //}
        getPropertyDisplayFunctionResult: function (options)
        {
            var isVisible = true;
            var fn = SourceCode.Forms.Designers.Common.getControlTypeFunction(options.controlType, options.propertyId, "DisplayPropertyMethod");
            if (typeof fn === "function")
            {
                var isViewDesigner = (SourceCode.Forms.Designers.Common.Context === SourceCode.Forms.Designers.Common.View);
                var context =
                {
                    designerType: (isViewDesigner) ? "view" : "form",
                    subDesignerType: options.subDesignerType,
                    propertyId: options.propertyId,
                    controlId: options.controlId,
                    controlType: options.controlType,
                    designer: (isViewDesigner) ? SourceCode.Forms.Designers.View.ViewDesigner : SourceCode.Forms.Designers.Form,
                    designerDefinition: SourceCode.Forms.Designers.Common.Context.getDefinitionXML()
                };

                SourceCode.Forms.Utilities.defineLazyLoadProperty(
                    {
                        object: context,
                        propertyName: "controlDefaultProperties",
                        get: function ()
                        {
                            var result = this["_controlDefaultProperties"];
                            if (!checkExists(result))
                            {
                                this["_controlDefaultProperties"] = result = SourceCode.Forms.Designers.Common.controlDefinitionsXml.selectSingleNode("Controls/Control[Name='{0}']".format(options.controlType));
                            }
                            return result;
                        }
                    });

                isVisible = fn(context);
            }
            return isVisible;
        },

        //temporary solution to be replaced with a full complex property solution looking up extensible lists from a db
        getIconDropdownItems: function (category)
        {
            category = category.toUpperCase();
            var valuesObject =
            {
                values: [],
                displays: [],
                iconClasses: []
            };
            var list = SourceCode.Forms.Designers.Icons.List;
            var listLength = list.length;
            var showSystemIcons = SourceCode.Forms.Settings.Controls.ShowSystemIcons;
            for (var i = 0; i < listLength; i++)
            {
                var icon = list[i];
                var iconClass = "";
                if ((showSystemIcons || !icon.isSystem) && icon.categories.contains(category))
                {
                    valuesObject.values.push(icon.name);
                    valuesObject.displays.push(icon.display);

                    iconClass = icon.categories.contains("TOOLBARBUTTON") ? icon.name + " toolbarbutton" : icon.name;

                    valuesObject.iconClasses.push(iconClass);
                }
            }
            return valuesObject;
        },

        /**
        * @function getControlNode - gets the control node for the specified ID
        * @param {Guid} controlId - The ID of the control to get the node for.
        * @param {XmlDocument} [definition= view/form definition xml document] - The view/form definition xml document. If not passed in, the current one will be used
        */
        getControlNode: function (controlId, definition)
        {
            if (!checkExists(definition))
            {
                definition = SourceCode.Forms.Designers.Common.getDefinitionXML();
            }

            var controlNodeXPath = SourceCode.Forms.Designers.Common.getContextXPath()
                + "/Controls/Control[@ID='{0}']"
                    .format(controlId);

            var controlNode = definition.selectSingleNode(controlNodeXPath);

            return controlNode;
        },

        /**
        * @function getControlName - at least one of the parameters need to be specified
        * @param {Guid=} controlId - The ID of the control to get the name from. (optional)
        * @param {XmlNode=} namePropertyNode - the <Control> xml node (optional)
        * @param {XmlNode=} controlNode - the <Control> xml node (optional)
        * @returns {name, displayValue, displayName}
        */
        getControlNames: function (controlId, namePropertyNode, controlNode)
        {
            if (!checkExists(controlNode) && !checkExistsNotEmpty(controlId) && !checkExistsNotEmpty(namePropertyNode))
            {
                throw "At least one of the parameters need to be specified";
            }

            if (!checkExists(namePropertyNode))
            {
                if (!checkExists(controlNode))
                {
                    controlNode = common.getControlNode(controlId);
                }

                namePropertyNode = controlNode.selectSingleNode("Properties/Property[Name='ControlName']");
            }

            var nameNode = namePropertyNode.selectSingleNode("Value");
            var displayValueNode = namePropertyNode.selectSingleNode("DisplayValue");
            var nameValueNode = namePropertyNode.selectSingleNode("NameValue");

            var names = {};

            if (checkExists(nameNode))
            {
                names.name = nameNode.text;
            }

            if (checkExists(displayValueNode))
            {
                names.displayValue = displayValueNode.text;
            }

            if (checkExists(nameValueNode))
            {
                names.nameValue = nameValueNode.text;
            }

            return names;
        },

        /**
        * @function setNodeProperty - Sets the value of the specified property
        * @param {XmlNode} node - the node to which you want to add the property
        * @param {String} propertyName - name of the property you want to set
        * @param {String} propertyValue - value you want to set the property to
        * @param {XmlDocument} [xmlDoc=view/form definition xml] - Xml Document to which the ControlName belongs. Defaults to view/form definition xml
        */
        setNodeProperty: function (node, propertyName, propertyValue, xmlDoc)
        {
            xmlDoc = xmlDoc || SourceCode.Forms.Designers.Common.getDefinitionXML();

            var propertyElem = node.selectSingleNode(propertyName);
            if (propertyElem !== null)
            {
                propertyElem.parentNode.removeChild(propertyElem);
            }

            propertyElem = xmlDoc.createElement(propertyName);
            node.appendChild(propertyElem);

            propertyElem.appendChild(xmlDoc.createTextNode(propertyValue));
        },

        /**
        * @function setDisplayValue - Sets the <DisplayValue> propety of the <Property> node
        * @param {XmlNode} propertyNode - the property node of which to set the display value
        * @param {String} displayValue - display value to set
        * @param {XmlDocument} [xmlDoc=view/form definition xml] - Xml Document to which the ControlName belongs. Defaults to view/form definition xml
        */
        setDisplayValueNode: function (propertyNode, displayValue, xmlDoc)
        {
            common.setNodeProperty(propertyNode, "DisplayValue", displayValue, xmlDoc);
        },

        /**
        * @function setNameValueNode - Sets the <NameValue> propety of the <Property> node
        * @param {XmlNode} propertyNode - the property node of which to set the name value
        * @param {String} nameValue - name value to set
        * @param {XmlDocument} [xmlDoc=view/form definition xml] - Xml Document to which the ControlName belongs. Defaults to view/form definition xml
        */
        setNameValueNode: function (propertyNode, nameValue, xmlDoc)
        {
            common.setNodeProperty(propertyNode, "NameValue", nameValue, xmlDoc);
        },

        /**
        * @function setValueNode - Sets the <Value> propety of the <Property> node
        * @param {XmlNode} propertyNode - the property node of which to set the alue
        * @param {String} value - value to set
        * @param {XmlDocument} [xmlDoc=view/form definition xml] - Xml Document to which the ControlName belongs. Defaults to view/form definition xml
        */
        setValueNode: function (propertyNode, value, xmlDoc)
        {
            common.setNodeProperty(propertyNode, "Value", value, xmlDoc);
        },

        /**
        * @function checkAndSetControlNameOptionsParam - Checks the control names options, and set the optional values to their defaults
        * @param {updateControlName_options}
        */
        checkAndSetControlNameOptionsParam: function (options)
        {
            options.newDisplayValue = options.newDisplayValue || options.newName;
            options.newNameValue = options.newNameValue || options.newName;

            var oldNamesObj;

            // so local that we should rather keep it in the function
            var checkAndSetNamesObj = function (names)
            {
                if (!checkExists(names))
                {
                    names = common.getControlNames(options.controlId);
                }

                return names;
            }

            if (!checkExists(options.oldName))
            {
                oldNamesObj = checkAndSetNamesObj(oldNamesObj);
                options.oldName = oldNamesObj.name;
            }

            if (!checkExists(options.oldDisplayValue))
            {
                oldNamesObj = checkAndSetNamesObj(oldNamesObj);
                options.oldDisplayValue = oldNamesObj.displayValue;
            }

            if (!checkExists(options.oldNameValue))
            {
                oldNamesObj = checkAndSetNamesObj(oldNamesObj);
                options.oldNameValue = oldNamesObj.nameValue;
            }
        },

        /**
        * @function updateControlNameEverywhereInDefinition - Updates the display name and name etc of the control everywhere it is used in the view/form definition
        * @param {updateControlName_options} options - Options for the control which name you want to update.
        */
        updateControlNameEverywhereInDefinition: function (options)
        {
            common.checkAndSetControlNameOptionsParam(options);

            common.updateControlNameForEvents(options);
            common.updateControlNameForActions(options);
            common.updateControlNameForActionParameters(options);
            common.updateControlNameForActionResults(options);
            common.updateControlNameForActionFilters(options);
            common.updateControlNameForExpressions(options);
            common.updateControlNameForConditionParameters(options);
            common.updateControlNameForConditionalStyles(options);
            common.updateControlNameInValidationGroups(options);

            if (this.Context instanceof SourceCode.Forms.Designers.Common.ViewObject)
            {
                // Forms don't have datasources
                common.updateControlNameForParentControls(options);
            }
        },

        /**
        * @function updateControlNameForEvents
        * @param {updateControlName_options} options - Only use controlId and new names
        */
        updateControlNameForEvents: function (options)
        {
            var xmlDoc = SourceCode.Forms.Designers.Common.getDefinitionXML();

            var eventsXPath = SourceCode.Forms.Designers.Common.getContextXPathForEvents()
                + "/Event[@SourceID='{0}' and @SourceType='Control' and @Type='User'][not(Properties/Property[Name/text()='IsCustomName'])]"
                    .format(options.controlId);

            var controlEvents = xmlDoc.selectNodes(eventsXPath);
            var controlEventsLength = controlEvents.length;

            for (var c = 0; c < controlEventsLength; c++)
            {
                var currentEvent = controlEvents[c];
                var ruleNameValueProperty = currentEvent.selectSingleNode("Properties/Property[Name/text()='RuleFriendlyName']/Value");

                currentEvent.setAttribute("SourceDisplayName", options.newDisplayValue);
                currentEvent.setAttribute("SourceName", options.newName);

                if (checkExists(ruleNameValueProperty))
                {
                    var currentRuleName = ruleNameValueProperty.text;
                    var newRuleName = currentRuleName.replace(options.oldDisplayValue, options.newDisplayValue);

                    ruleNameValueProperty.removeChild(ruleNameValueProperty.firstChild);
                    ruleNameValueProperty.appendChild(xmlDoc.createTextNode(newRuleName));
                }
            }
        },

        /**
        * @function updateControlNameForActions
        * @param {updateControlName_options} options - Only use controlId and new names
        */
        updateControlNameForActions: function (options)
        {
            var xmlDoc = SourceCode.Forms.Designers.Common.getDefinitionXML();

            var actionsPropertyNodeXPath = SourceCode.Forms.Designers.Common.getContextXPathForEvents()
                + "/Event[@Type='User']/Handlers/Handler/Actions/Action/Properties/Property[Name='ControlID' and Value='{0}']"
                    .format(options.controlId);

            var actionPropertyNodes = xmlDoc.selectNodes(actionsPropertyNodeXPath);

            for (var c = 0; c < actionPropertyNodes.length; c++)
            {
                // value is the controlId, so dont update that
                common.setNameValueNode(actionPropertyNodes[c], options.newNameValue, xmlDoc);
                common.setDisplayValueNode(actionPropertyNodes[c], options.newName, xmlDoc);
            }
        },

        /**
        * @function updateControlNameForActionParameters
        * @param {updateControlName_options} options - Only use controlId and new names
        */
        updateControlNameForActionParameters: function (options)
        {
            var controlId = options.controlId;
            var newName = options.newName;
            var newDisplayValue = options.newDisplayValue;

            var xmlDoc = SourceCode.Forms.Designers.Common.getDefinitionXML();

            var targetPathXPath = SourceCode.Forms.Designers.Common.getContextXPathForEvents()
                + "/Event[@Type='User']/Handlers/Handler/Actions/Action/Parameters/Parameter[@TargetPath='{0}']"
                    .format(controlId);

            var targetIdXPath = SourceCode.Forms.Designers.Common.getContextXPathForEvents()
                + "/Event[@Type='User']/Handlers/Handler/Actions/Action/Parameters/Parameter[@TargetID='{0}']"
                    .format(controlId);

            var sourcePathXPath = SourceCode.Forms.Designers.Common.getContextXPathForEvents()
                + "/Event[@Type='User']/Handlers/Handler/Actions/Action/Parameters/Parameter[@SourcePath='{0}']"
                    .format(controlId);

            var sourceIdXPath = SourceCode.Forms.Designers.Common.getContextXPathForEvents()
                + "/Event[@Type='User']/Handlers/Handler/Actions/Action/Parameters/Parameter[@SourceID='{0}']"
                    .format(controlId);

            var sourceValuesXPath = SourceCode.Forms.Designers.Common.getContextXPathForEvents()
                + "/Event[@Type='User']/Handlers/Handler/Actions/Action/Parameters/Parameter/SourceValue/Source[@SourceID='{0}']"
                    .format(controlId);

            var controlActionParameterTargetPaths = xmlDoc.selectNodes(targetPathXPath);
            var controlActionParameterSourcePaths = xmlDoc.selectNodes(sourcePathXPath);
            var controlActionParameterTargetIds = xmlDoc.selectNodes(targetIdXPath);
            var controlActionParameterSourceIds = xmlDoc.selectNodes(sourceIdXPath);
            var controlActonParametersSourceValueIds = xmlDoc.selectNodes(sourceValuesXPath);

            for (var c = 0; c < controlActionParameterTargetPaths.length; c++)
            {
                controlActionParameterTargetPaths[c].setAttribute("TargetPathDisplayName", newDisplayValue);
                controlActionParameterTargetPaths[c].setAttribute("TargetPathName", newName);
            }

            for (var c = 0; c < controlActionParameterSourcePaths.length; c++)
            {
                controlActionParameterSourcePaths[c].setAttribute("SourcePathDisplayName", newDisplayValue);
                controlActionParameterSourcePaths[c].setAttribute("SourcePathName", newName);
            }

            for (var c = 0; c < controlActionParameterTargetIds.length; c++)
            {
                controlActionParameterTargetIds[c].setAttribute("TargetDisplayName", newDisplayValue);
                controlActionParameterTargetIds[c].setAttribute("TargetName", newName);
            }

            for (var c = 0; c < controlActionParameterSourceIds.length; c++)
            {
                controlActionParameterSourceIds[c].setAttribute("SourceDisplayName", newDisplayValue);
                controlActionParameterSourceIds[c].setAttribute("SourceName", newName);
            }

            for (var c = 0; c < controlActonParametersSourceValueIds.length; c++)
            {
                controlActonParametersSourceValueIds[c].setAttribute("SourceDisplayName", newDisplayValue);
                controlActonParametersSourceValueIds[c].setAttribute("SourceName", newName);
            }
        },

        /**
        * @function updateControlNameForActionResults
        * @param {updateControlName_options} options - Only use controlId and new names
        */
        updateControlNameForActionResults: function (options)
        {
            var controlId = options.controlId;
            var newName = options.newName;
            var newDisplayValue = options.newDisplayValue;

            var xmlDoc = SourceCode.Forms.Designers.Common.getDefinitionXML();
            var actionResultXPath = SourceCode.Forms.Designers.Common.getContextXPathForEvents()
                + "/Event[@Type='User']/Handlers/Handler/Actions/Action/Results/Result[@TargetID='{0}']"
                    .format(controlId);

            // there are only ever target controls in the results section, right?
            var controlActionResultTargetPaths = xmlDoc.selectNodes(actionResultXPath);

            for (var c = 0; c < controlActionResultTargetPaths.length; c++)
            {
                controlActionResultTargetPaths[c].setAttribute("TargetDisplayName", newDisplayValue);
                controlActionResultTargetPaths[c].setAttribute("TargetName", newName);
            }
        },

        /** 
        * @function updateControlNameForActionFilters
        * @param {updateControlName_options} options - Only use old names and new names
        */
        updateControlNameForActionFilters: function (options)
        {
            var oldName = options.oldName;
            var oldDisplayValue = options.oldDisplayValue;

            var newName = options.newName;
            var newDisplayValue = options.newDisplayValue;

            var xmlDoc = SourceCode.Forms.Designers.Common.getDefinitionXML();
            var filterXPath = SourceCode.Forms.Designers.Common.getContextXPathForEvents()
                + "/Event[@Type='User']/Handlers/Handler/Actions/Action/Properties/Property[Name='Filter']";

            var filterNodes = xmlDoc.selectNodes(filterXPath);

            var searchRegexSourceDisplayName = new RegExp("SourceDisplayName=\"{0}\"".format(oldDisplayValue), "g");
            var replaceStringSourceDisplayName = "SourceDisplayName=\"{0}\"".format(newDisplayValue);

            var searchRegexSourceName = new RegExp("SourceName=\"{0}\"".format(oldName), "g");
            var replaceStringSourceName = "SourceName=\"{0}\"".format(newName);

            for (var c = 0; c < filterNodes.length; c++)
            {
                var valueNode = filterNodes[c].selectSingleNode("Value");
                if (checkExists(valueNode))
                {
                    var newFilterValue = valueNode.text.replace(searchRegexSourceDisplayName, replaceStringSourceDisplayName);
                    newFilterValue = newFilterValue.replace(searchRegexSourceName, replaceStringSourceName);
                    common.setValueNode(filterNodes[c], newFilterValue, xmlDoc);
                }
            }
        },

        /**
        * @function updateControlNameForExpressions
        * @param {updateControlName_options} options - Use controlId, old names and new names
        */
        updateControlNameForExpressions: function (options)
        {
            var controlId = options.controlId;
            var newName = options.newName;
            var newDisplayValue = options.newDisplayValue;

            var oldName = options.oldName;

            // sometimes there are nbsp in the display name, and they won't get updated correctly.
            var oldDisplayValue = options.oldDisplayValue;

            var xmlDoc = SourceCode.Forms.Designers.Common.getDefinitionXML();
            var expressionsXPath = SourceCode.Forms.Designers.Common.getContextXPath()
                + "/Expressions/Expression[.//Item/@SourceID='{0}']"
                    .format(controlId);

            var expressionNodes = xmlDoc.selectNodes(expressionsXPath);

            for (var c = 0; c < expressionNodes.length; c++)
            {
                var displayNode = expressionNodes[c].selectSingleNode("Display");
                if (checkExists(displayNode))
                {
                    var newDisplayValueText = displayNode.text
                        .replace(new RegExp("\u00a0", "g"), " ") // get rid of &nbsp;
                        .replace(new RegExp(oldDisplayValue, 'g'), newDisplayValue);

                    common.setNodeProperty(expressionNodes[c], "Display", newDisplayValueText, xmlDoc);
                }

                var itemNodes = expressionNodes[c].selectNodes("//Item[@SourceID='" + controlId + "']");
                if (checkExists(itemNodes))
                {
                    var itemNodesLength = itemNodes.length;

                    for (var i = 0; i < itemNodes.length; i++)
                    {
                        var itemNode = itemNodes[i];

                        if (itemNode.getAttribute("SourceDisplayName") === oldDisplayValue)
                        {
                            itemNode.setAttribute("SourceDisplayName", newDisplayValue);
                            itemNode.setAttribute("SourceName", newName);
                        }

                        var itemDisplayNode = itemNode.selectSingleNode("Display");

                        // this will not always exist, so check before adding
                        if (checkExists(itemDisplayNode))
                        {
                            common.setNodeProperty(itemNode, "Display", newDisplayValue, xmlDoc);
                        }
                    }
                }
            }
        },

        /**
        * @function updateControlNameForConditionParameters
        * @param {updateControlName_options} options - Only use controlId and new names
        */
        updateControlNameForConditionParameters: function (options)
        {
            var controlId = options.controlId;
            var newName = options.newName;
            var newDisplayValue = options.newDisplayValue;

            var xmlDoc = SourceCode.Forms.Designers.Common.getDefinitionXML();
            var conditionsXPath = SourceCode.Forms.Designers.Common.getContextXPathForEvents()
                + "/Event[@Type='User']/Handlers/Handler/Conditions/Condition/Expressions//Item[@SourceID='{0}']"
                    .format(controlId);

            var conditionNodes = xmlDoc.selectNodes(conditionsXPath);

            for (var c = 0; c < conditionNodes.length; c++)
            {
                conditionNodes[c].setAttribute("SourceDisplayName", newDisplayValue);
                conditionNodes[c].setAttribute("SourceName", newName);
            }
        },

        /**
        * @function updateControlNameInValidationGroups
        * @param {updateControlName_options} options - Only use controlId and new names
        */
        updateControlNameInValidationGroups: function (options)
        {
            var controlId = options.controlId;
            var newName = options.newName;
            var newDisplayValue = options.newDisplayValue;

            var xmlDoc = SourceCode.Forms.Designers.Common.getDefinitionXML();

            var validationGroupsXPath = SourceCode.Forms.Designers.Common.getContextXPath()
                + "/ValidationGroups/ValidationGroup/ValidationGroupControls/ValidationGroupControl[@ControlID='{0}']"
                    .format(controlId);

            var validationNodes = xmlDoc.selectNodes(validationGroupsXPath);

            for (var c = 0; c < validationNodes.length; c++)
            {
                validationNodes[c].setAttribute("ControlDisplayName", newDisplayValue);
                validationNodes[c].setAttribute("ControlName", newName);
            }
        },

        /**
        * @function updateControlNameForConditionalStyles
        * @param {updateControlName_options} options - Only use controlId and new names
        */
        updateControlNameForConditionalStyles: function (options)
        {
            var controlId = options.controlId;
            var newName = options.newName;
            var newDisplayValue = options.newDisplayValue;

            var xmlDoc = SourceCode.Forms.Designers.Common.getDefinitionXML();
            var sourceItemXPath = SourceCode.Forms.Designers.Common.getContextXPath()
                + "/Controls/Control/ConditionalStyles/ConditionalStyle/Condition//Item[@SourceID='{0}']"
                    .format(controlId);

            var sourceItemNodes = xmlDoc.selectNodes(sourceItemXPath);

            for (var c = 0; c < sourceItemNodes.length; c++)
            {
                sourceItemNodes[c].setAttribute("SourceDisplayName", newDisplayValue);
                sourceItemNodes[c].setAttribute("SourceName", newName);
            }
        },

        /**
        * @function updateControlNameForParentControls
        * @param {updateControlName_options} options - Only use controlId and new names
        */
        updateControlNameForParentControls: function (options)
        {
            var controlId = options.controlId;
            var newNameValue = options.newNameValue;
            var newDisplayValue = options.newDisplayValue;

            var xmlDoc = SourceCode.Forms.Designers.Common.getDefinitionXML();
            var parentControlDisplayValueXPath = SourceCode.Forms.Designers.Common.getContextXPath()
                + "/Controls/Control/Properties/Property[Name='ParentControl' and Value='{0}']"
                    .format(controlId);

            var parentControlDisplayValueNodes = xmlDoc.selectNodes(parentControlDisplayValueXPath);

            for (var c = 0; c < parentControlDisplayValueNodes.length; c++)
            {
                common.setDisplayValueNode(parentControlDisplayValueNodes[c], newDisplayValue, xmlDoc);
                common.setNameValueNode(parentControlDisplayValueNodes[c], newNameValue, xmlDoc);
            }
        },

        //LG: I think this rebuilds the Form definition XML, called by the TableBehavior.js.
        //the purpose of the function isn't obvious.
        checkLayoutXML: function ()
        {
            if (SourceCode.Forms.Designers.Common.Context === SourceCode.Forms.Designers.FormObject)
            {
                SourceCode.Forms.Designers.Common.Context.checkLayoutXML();
            }
        },


        refreshBadges: function ()
        {
            //First remove all the badging for the Controls
            SourceCode.Forms.Designers.Common.removeBadgeForControls();
            SourceCode.Forms.Designers.Common.triggerEvent("RemoveAllBadges");

            //Then apply error badging for the Controls
            SourceCode.Forms.Designers.Common.applyErrorBadgesToControlsWithValidationIssue();
            SourceCode.Forms.Designers.Common.applyErrorBadgesToControlsWithPropertyIssue();
            SourceCode.Forms.Designers.Common.applyErrorBadgesToControlsWithStyleIssue();

            SourceCode.Forms.Designers.Common.applyErrorBadgesToViewsWithValidationIssue();
            SourceCode.Forms.Designers.Common.applyErrorBadgesToEvents();
            SourceCode.Forms.Designers.Common.applyErrorBadgesToStates();
            SourceCode.Forms.Designers.Common.applyErrorBadgesToExpressionsWithValidationIssue();

            // Wizard Step Badging
            SourceCode.Forms.Designers.Common.applyDesignerWizardStepBadging();

            if (SourceCode.Forms.Designers.Common.Context === SourceCode.Forms.Designers.Common.View)
            {
                SourceCode.Forms.Designers.Common.Context.refreshBadgesForViewDataSource();
            }
        },

        /**
        * This function will return the attribute check part of the xpath for checking validation status
        * If no statuses passed in, it will check specifically for validation status types of Error, Missing and Warning
        * If a list of statuses passed in, it will create a condition that only checks for statuses of those values.
        * @param {array} statuses The validation statuses to check for (not required)
        * @returns XPath condition
        */
        getXPathValidationStatusCondition: function (statuses)
        {
            if (!checkExists(statuses))
            {
                statuses = ["Error", "Warning", "Missing"];
            }

            var statusCondition = "contains(@ValidationStatus,'{0}')";
            var statusConditions = [];

            for (var i = 0; i < statuses.length; i++)
            {
                statusConditions.push(statusCondition.format(statuses[i]));
            }

            var statusConditionPath = statusConditions.join(" or ");

            var xpathCondition = "[{0}]".format(statusConditionPath);
            return xpathCondition;
        },

        /**
         * containsRuleAnnotations Method is used to assess the ViewDefintion Xml for Event's or its children that are annotated.
         * @function
         * @param {XmlDocument} viewDefinitionXml is the XmlDocument node of the viewDefinitionXml
         * @returns		{Boolean} if there are annotations with the Event then it will return true. Any children that are annotated, but the
         *				event is not annotated should not be returned as the rule should then not be badged.
         * 
         */
        containsRuleAnnotations: function (viewDefinitionXml)
        {
            var hasAnnotations = false;
            var annotatedNodes = [];
            var xpath = ".//Events/Event[@Type='User'][(contains(@ValidationStatus,'Error') or contains(@ValidationStatus,'Missing'))]";

            annotatedNodes = viewDefinitionXml.selectNodes(xpath);
            if (annotatedNodes.length > 0)
            {
                hasAnnotations = true;
            }

            return hasAnnotations;
        },

        // Remove the badge status for an array of Controls, if input is not defined, badging for all Controls will be removed.
        // Inputs:
        //		controlIds : array [] of control ID
        //
        removeBadgeForControls: function (controlIds)
        {
            var i = 0;
            var id = "";
            var idArray = [];

            if (!checkExists(controlIds) || controlIds.length === 0)
            {
                var defXml = SourceCode.Forms.Designers.Common.getDefinitionXML();
                var nodes = defXml.selectNodes(".//Controls/Control");

                for (i = 0; i < nodes.length; i++)
                {
                    id = nodes[i].getAttribute("ID");

                    if (checkExistsNotEmpty(id))
                    {
                        idArray.push(id);
                    }
                }
            }
            else
            {
                idArray = controlIds;
            }

            for (i = 0; i < idArray.length; i++)
            {
                var badgeOptions =
                {
                    id: idArray[i],
                    badgeType: SourceCode.Forms.DependencyHelper.badgeClasses.error,
                    message: ""
                };

                SourceCode.Forms.DependencyHelper.removeControlBadge(badgeOptions);
            }
        },

        // Refresh the badge status for an array of Controls, if input is not defined, all controls will be refreshed.
        // Inputs:
        //		controlIds : array [] of control ID
        //
        refreshBadgeForControls: function (controlIds)
        {
            var i = 0;
            var id = "";
            var idArray = [];

            if (!checkExists(controlIds) || controlIds.length === 0)
            {
                var defXml = SourceCode.Forms.Designers.Common.getDefinitionXML();
                var nodes = defXml.selectNodes(".//Controls/Control");

                for (i = 0; i < nodes.length; i++)
                {
                    id = nodes[i].getAttribute("ID");
                    var type = nodes[i].getAttribute("Type");

                    if (checkExistsNotEmpty(id) && type !== "AreaItem")
                    {
                        idArray.push(id);
                    }
                }
            }
            else
            {
                idArray = controlIds;
            }

            for (i = 0; i < idArray.length; i++)
            {
                this.refreshBadgeForControl(idArray[i]);
            }

            // Wizard Step Badging
            SourceCode.Forms.Designers.Common.applyDesignerWizardStepBadging();
        },

        // Maps dependency message to badgeOptions and applies the badging
        refreshBadgeForControlProperty: function (badgeOptions, dependency)
        {
            if (dependency.hasError)
            {
                badgeOptions.message = dependency.errorMessage;
                if (checkExistsNotEmpty(dependency.controlId))
                {
                    badgeOptions.id = dependency.controlId;
                }
                SourceCode.Forms.DependencyHelper.applyControlBadge(badgeOptions);
            }
        },

        // Refresh the badge of a Control base on its annotated state in the definition xml
        //
        refreshBadgeForControl: function (controlId)
        {
            var badgeOptions = {
                id: controlId,
                badgeType: SourceCode.Forms.DependencyHelper.badgeClasses.error,
                message: ""
            };

            SourceCode.Forms.DependencyHelper.removeControlBadge(badgeOptions);

            this.refreshBadgeForControlProperty(badgeOptions, this.checkControlConditionalStylesHasDependencyIssue(controlId));

            var dependancies = this.getControlPropertyDependencyIssues(controlId);
            for (var i = 0; i < dependancies.length; i++)
            {
                this.refreshBadgeForControlProperty(badgeOptions, dependancies[i]);
            }
        },

        /**
        * Applies badging to the different steps in the designer wizard when necessary.
        * Layout breadcrumb will be badged if any controls or views are in error or warning states.
        * Rules breadcrumb will be badged if any events, actions, handlers are in error state.
        * Also unbadges steps that were previously badged, but no longer contains any errors.
        */
        applyDesignerWizardStepBadging: function ()
        {
            var defXml = SourceCode.Forms.Designers.Common.getDefinitionXML();

            var wizard = $("#pgWizard, #ViewWizard");

            var controlsInError = defXml.selectNodes(".//Controls//*" + common.getXPathValidationStatusCondition());

            var panelsInError = defXml.selectNodes(".//Panels/Panel//Item[@ViewID]" + common.getXPathValidationStatusCondition()); // Targeting views only as tabs badging is not supported in 4.7 (ALM V1)

            var expressionsInError = defXml.selectNodes(".//Expressions/Expression" + common.getXPathValidationStatusCondition());

            var fieldsInError = defXml.selectNodes(".//Sources/Source[@ContextType='Primary']//Field{0}".format(common.getXPathValidationStatusCondition()));

            //Also check for missing fields when badging layout 
            if (controlsInError.length > 0 || panelsInError.length > 0 || expressionsInError.length > 0 || fieldsInError.length > 0)
            {
                SourceCode.Forms.Designers.Common.Context.setDesignerLayoutError();
            }
            else
            {
                SourceCode.Forms.Designers.Common.Context.setDesignerLayoutNormal();
            }




            //Rules in warning state should not get badged, only in error state
            var rulesInError = common.containsRuleAnnotations(defXml);

            if (rulesInError)
            {
                SourceCode.Forms.Designers.Common.Context.setDesignerRulesError();
            }
            else
            {
                SourceCode.Forms.Designers.Common.Context.setDesignerRulesNormal();
            }

            if (SourceCode.Forms.Designers.Common.Context === SourceCode.Forms.Designers.Common.View)
            {
                //At the moment only the view's general step will ever be badged (view datasource in error)
                if (this.hasInvalidPrimarySource())
                {
                    SourceCode.Forms.Designers.Common.Context.setDesignerDatasourceError();
                }
                else
                {
                    SourceCode.Forms.Designers.Common.Context.setDesignerDatasourceNormal();
                }

                //Refresh badging on the rule grid tab
                SourceCode.Forms.Designers.View._refreshRuleGridTabBadging();
            }
            else if (SourceCode.Forms.Designers.Common.Context === SourceCode.Forms.Designers.Common.Form)
            {
                //Refresh badging on the rule grid tab
                var formLayout = SourceCode.Forms.Designers.Form.steps[SourceCode.Forms.Designers.Form.LAYOUT_STEP_INDEX];
                if (checkExists(formLayout))
                {
                    formLayout._refreshRuleGridTabBadging();
                }

                formLayout._refreshTabsBadging();
            }
        },

        hasInvalidPrimarySource: function ()
        {
            var defXml = SourceCode.Forms.Designers.Common.getDefinitionXML();
            var xPathValStatus = "(contains(@ValidationStatus,'Error') or contains(@ValidationStatus,'Missing') or contains(@ValidationStatus,'Missing, Error'))";
            var sourceXpath = ".//Sources/Source[@ContextType='Primary'][{0}]".format(xPathValStatus);
            var source = defXml.selectSingleNode(sourceXpath);
            var isInvalid = false;

            if (checkExists(source) && checkExists(source.getAttribute("ValidationMessages")))
            {
                var validationMessages = source.getAttribute("ValidationMessages");

                var analyzerService = SourceCode.Forms.Services.AnalyzerResourcesService();
                var messageArray = analyzerService.parseValidationMessage(validationMessages);

                //Source node's validation messages also contain annotation information for each fields
                //Thus we need to examine each validation messages and determine if it is the SmartObject that is missing
                //If only the fields are missing, the primary source is still valid
                for (var i = 0; i < messageArray.length; i++)
                {
                    var msg = messageArray[i];

                    if (msg.referenceAs === "SourceObject" && msg.type === "Object" && (msg.status === "Missing" || msg.status === "Error"))
                    {
                        isInvalid = true;
                        break;
                    }
                }
            }

            return isInvalid;
        },

        applyErrorBadgesToExpressionsWithValidationIssue: function ()
        {
            var defXml = SourceCode.Forms.Designers.Common.getDefinitionXML();
            var nodes = defXml.selectNodes(".//Expressions/Expression" + common.getXPathValidationStatusCondition());

            var badgeOptions = {
                badgeType: SourceCode.Forms.DependencyHelper.badgeClasses.error
            };

            if (nodes.length > 0)
            {
                SourceCode.Forms.DependencyHelper.applyExpressionToolbarButtonBadges(badgeOptions);
            }
            else
            {
                SourceCode.Forms.DependencyHelper.removeExpressionToolbarButtonBadges(badgeOptions);
            }
        },

        isControlBadgeExclusion: function (controlNode)
        {
            var isExclude = false;

            if (!checkExists(controlNode))
            {
                return false;
            }

            var type = controlNode.getAttribute("Type");
            var messages = controlNode.getAttribute("ValidationMessages");
            var analyzerService = SourceCode.Forms.Services.AnalyzerResourcesService();

            if (checkExistsNotEmpty(messages))
            {
                messages = analyzerService.parseValidationMessage(messages);
            }

            if (type === "Label" && checkExists(messages) && messages.length === 1)
            {
                if (messages[0].type === SourceCode.Forms.DependencyHelper.ReferenceType.SourceField &&
                    messages[0].referenceAs === SourceCode.Forms.DependencyHelper.ReferenceAs.ControlField)
                {
                    isExclude = true;
                }
            }

            return isExclude;
        },

        applyErrorBadgesToControlsWithValidationIssue: function ()
        {
            var defXml = SourceCode.Forms.Designers.Common.getDefinitionXML();
            var nodes = defXml.selectNodes(".//Controls/Control" + common.getXPathValidationStatusCondition()
                + "|.//Controls/Control[Properties/Property" + common.getXPathValidationStatusCondition() + "]");

            if (!checkExists(nodes) || nodes.length === 0)
            {
                return;
            }

            var analyzerService = SourceCode.Forms.Services.AnalyzerResourcesService();

            for (var i = 0; i < nodes.length; i++)
            {
                if (!checkExistsNotEmpty(nodes[i].getAttribute("ID")))
                {
                    continue;
                }

                if (this.isControlBadgeExclusion(nodes[i]) === true)
                {
                    continue;
                }

                var messages = nodes[i].getAttribute("ValidationMessages");

                if (checkExistsNotEmpty(messages))
                {
                    messages = analyzerService.getValidationMessages(messages);
                }

                var badgeOptions = {
                    id: nodes[i].getAttribute("ID"),
                    badgeType: SourceCode.Forms.DependencyHelper.badgeClasses.error,
                    message: messages
                };
                SourceCode.Forms.DependencyHelper.applyControlBadge(badgeOptions);
            }
        },

        applyErrorBadgesToViewsWithValidationIssue: function ()
        {
            var defXml = SourceCode.Forms.Designers.Common.getDefinitionXML();
            var nodes = defXml.selectNodes(".//Panels/Panel/Areas/Area/Items/Item" +
                "[@ValidationStatus='Warning' or @ValidationStatus='Error' or @ValidationStatus='Missing']");

            if (!checkExists(nodes) || nodes.length === 0)
            {
                return;
            }

            var analyzerService = SourceCode.Forms.Services.AnalyzerResourcesService();

            for (var i = 0; i < nodes.length; i++)
            {
                if (!checkExistsNotEmpty(nodes[i].getAttribute("ID")))
                {
                    continue;
                }

                var messages = nodes[i].getAttribute("ValidationMessages");

                if (checkExistsNotEmpty(messages))
                {
                    messages = analyzerService.getValidationMessages(messages);
                }

                var badgeOptions = {
                    id: nodes[i].getAttribute("ID"),
                    badgeType: SourceCode.Forms.DependencyHelper.badgeClasses.error,
                    message: messages
                };

                SourceCode.Forms.DependencyHelper.applyControlBadge(badgeOptions);
            }
        },

        checkTabHasControlIssue: function (id)
        {
            var defXml = SourceCode.Forms.Designers.Common.getDefinitionXML();
            var node = defXml.selectSingleNode(".//Panels/Panel[@ID='" + id + "'][@ValidationStatus='Warning' or @ValidationStatus='Error' or @ValidationStatus='Missing']");
            var dependencyObj = {};

            if (checkExists(node))
            {
                dependencyObj.hasError = true;

                var analyzerService = SourceCode.Forms.Services.AnalyzerResourcesService();
                var messages = node.getAttribute("ValidationMessages");

                if (checkExistsNotEmpty(messages))
                {
                    messages = analyzerService.getValidationMessages(messages);
                    dependencyObj.messages = messages;
                }
            }
            else
            {
                dependencyObj.hasError = false;
            }

            return dependencyObj;
        },

        applyErrorBadgesToControlsWithStyleIssue: function ()
        {
            var i, j;
            var badgeOptions = {};
            var defXml = SourceCode.Forms.Designers.Common.getDefinitionXML();

            var controlNodes = defXml.selectNodes(".//Controls/Control[ConditionalStyles/ConditionalStyle" +
                common.getXPathValidationStatusCondition() +
                "]");

            if (!checkExists(controlNodes) || controlNodes.length === 0)
            {
                return;
            }

            var analyzerService = SourceCode.Forms.Services.AnalyzerResourcesService();

            var itemNodes = null;
            var validationMessages = "";
            for (j = 0; j < controlNodes.length; j++)
            {
                itemNodes = controlNodes[j].selectNodes("ConditionalStyles/ConditionalStyle/Condition//Item" +
                    common.getXPathValidationStatusCondition());

                if (checkExists(itemNodes) && itemNodes.length > 0)
                {
                    for (i = 0; i < itemNodes.length; i++)
                    {
                        var message = itemNodes[i].getAttribute("ValidationMessages");
                        if (checkExistsNotEmpty(message))
                        {
                            if (checkExistsNotEmpty(validationMessages))
                            {
                                validationMessages += '\n';
                            }

                            validationMessages += analyzerService.getValidationMessages(message);
                        }
                    }
                }

                badgeOptions = {
                    id: controlNodes[j].getAttribute("ID"),
                    badgeType: SourceCode.Forms.DependencyHelper.badgeClasses.error,
                    message: validationMessages
                };

                SourceCode.Forms.DependencyHelper.applyControlBadge(badgeOptions);
            }
        },

        applyErrorBadgesToControlsWithPropertyIssue: function ()
        {
            var badgeOptions =
            {
                id: "",
                badgeType: SourceCode.Forms.DependencyHelper.badgeClasses.error,
                message: ""
            };
            var dependencies = this.getControlPropertyDependencyIssues();

            for (var i = 0; i < dependencies.length; i++)
            {
                var dependency = dependencies[i];
                this.refreshBadgeForControlProperty(badgeOptions, dependency);
            }
        },

        /**
        * Builds up an object that contains depedency information about the xml node that was passed in.
        * @param {xmlNode} XML Node The xml node that needs to be evaluated.
        * @returns dependencyObj - with following properties:
        *  - hasError - true if node has ValidationStatus attribute that contains value "Error" or "Missing"
        *  - hasWarning - true if node has ValidationStatus attribute that contains value "Warning"
        *  - messages - List of error messages parsed from the ValidationMessages attribute of the xml node.
        */
        getDependencyObjectForNode: function (xmlNode)
        {
            var dependencyObj = {
                hasError: false,
                hasWarning: false
            };

            if (checkExists(xmlNode))
            {
                var validationStatus = xmlNode.getAttribute("ValidationStatus");
                if (checkExistsNotEmpty(validationStatus))
                {
                    //Missing and Error state should badge as error
                    dependencyObj.hasError = validationStatus.indexOf("Missing") > -1 || validationStatus.indexOf("Error") > -1;
                    dependencyObj.hasWarning = validationStatus.indexOf("Warning") > -1;

                    var messages = xmlNode.getAttribute("ValidationMessages");
                    if (checkExistsNotEmpty(messages))
                    {
                        var analyzerService = SourceCode.Forms.Services.AnalyzerResourcesService();
                        messages = analyzerService.getValidationMessages(messages);
                        dependencyObj.messages = messages;
                    }
                }

            }

            return dependencyObj;
        },

        checkControlRuleDependencies: function (id, context)
        {
            var xpath;
            var badgeRulesTab = false;
            var defXml = SourceCode.Forms.Designers.Common.getDefinitionXML();

            if (context === "View")
            {
                xpath = ".//Event[@Type='User'][contains(@ValidationStatus, 'Error') or contains(@ValidationStatus, 'Missing')]";
            }
            else if (context === "ViewControl")
            {
                xpath = ".//Event[@Type='User'][contains(@ValidationStatus, 'Error') or contains(@ValidationStatus, 'Missing')][@SourceID='" + id + "' or @InstanceID='" + id + "']";
            }
            else if (context === "FormControl")
            {
                xpath = ".//State[@IsBase='True']/.//Event[@Type='User'][contains(@ValidationStatus, 'Error') or contains(@ValidationStatus, 'Missing')][@SourceID='" + id + "' or @InstanceID='" + id + "']";
            }
            else if (context === "Form")
            {
                xpath = ".//State[@IsBase='True']/.//Event[@Type='User'][contains(@ValidationStatus, 'Error') or contains(@ValidationStatus, 'Missing')]";
            }

            var controlEvents = defXml.selectNodes(xpath);

            if (controlEvents.length > 0)
            {
                badgeRulesTab = true;
            }

            if (context === "View" || context === "ViewControl")
            {
                SourceCode.Forms.Designers.View.ViewDesigner._toggleRulesTabBadge(badgeRulesTab);
            }
            else
            {
                SourceCode.Forms.Designers.Form.steps[SourceCode.Forms.Designers.Form.LAYOUT_STEP_INDEX]._toggleRulesTabBadge(badgeRulesTab);
            }
        },

        applyCustomNameToEvent: function (event)
        {
            var defXml = SourceCode.Forms.Designers.Common.getDefinitionXML();
            var hasCustomName = event.selectSingleNode("Properties/Property[Name='IsCustomName']");

            if (!checkExists(hasCustomName) || hasCustomName.selectSingleNode("Value").text === 'false')
            {
                //Add rule IsCustomName property
                SourceCode.Forms.Designers.Rule.ruleNameIsCustom = true;

                var eventProperties = event.selectSingleNode("Properties");
                var prop = defXml.createElement("Property");

                var customNameProp = defXml.createElement("Name");
                var customNamePropText = defXml.createTextNode("IsCustomName");

                customNameProp.appendChild(customNamePropText);

                var customNameVal = defXml.createElement("Value");
                var customNameValText = defXml.createTextNode(SourceCode.Forms.Designers.Rule.ruleNameIsCustom.toString());

                customNameVal.appendChild(customNameValText);

                prop.appendChild(customNameProp);
                prop.appendChild(customNameVal);
                eventProperties.appendChild(prop);

                //Add RuleName property
                var hasRuleName = event.selectSingleNode("Properties/Property[Name='RuleName']");

                if (!checkExists(hasRuleName))
                {
                    var ruleFriendlyName = event.selectSingleNode("Properties/Property[Name='RuleFriendlyName']/Value").text;

                    var nameProp = defXml.createElement("Property");

                    var ruleNameProp = defXml.createElement("Name");
                    var ruleNamePropText = defXml.createTextNode("RuleName");

                    ruleNameProp.appendChild(ruleNamePropText);

                    var ruleNameVal = defXml.createElement("Value");
                    var ruleNameValText = defXml.createTextNode(ruleFriendlyName);

                    ruleNameVal.appendChild(ruleNameValText);

                    nameProp.appendChild(ruleNameProp);
                    nameProp.appendChild(ruleNameVal);
                    eventProperties.appendChild(nameProp);
                }
            }
        },

        applyCustomNamesToErrorEvent: function (controlId)
        {
            var defXml = SourceCode.Forms.Designers.Common.getDefinitionXML();
            var notifierSelectedOptions = SourceCode.Forms.Designers.Common.notifierContext;

            //If rules dependant on the control are in error change error rule to have custom name
            var dependendControlRules = defXml.selectNodes(".//Event[@SourceType= 'Control'][@SourceID='" + controlId + "'][@Type='User']");

            for (var x = 0; x < dependendControlRules.length; x++)
            {
                var dependentControlRule = dependendControlRules[x];

                if (checkExists(notifierSelectedOptions.keepReferences))
                {
                    if (notifierSelectedOptions.keepReferences === false)
                    {
                        SourceCode.Forms.Designers.Common.applyCustomNameToEvent(dependentControlRule);
                    }
                }
            }
        },

        _applyErrorBadgesToRuleItemNode: function (node, badgeFunctionThisContext, badgeFunction)
        {
            var id = node.getAttribute("ID");

            var dependencyObj = common.getDependencyObjectForNode(node);

            if (dependencyObj.hasError || dependencyObj.hasWarning)
            {
                var badgeType = dependencyObj.hasError ?
                    SourceCode.Forms.DependencyHelper.badgeClasses.error :
                    SourceCode.Forms.DependencyHelper.badgeClasses.warning;

                var dependencyMsg = dependencyObj.hasError ? dependencyObj.messages : null;

                badgeOptions = {
                    id: id,
                    badgeType: badgeType,
                    message: dependencyMsg
                };

                badgeFunction.call(badgeFunctionThisContext, badgeOptions);
            }
        },

        applyErrorBadgesToEvent: function (eventNode)
        {
            common._applyErrorBadgesToRuleItemNode(eventNode, SourceCode.Forms.DependencyHelper, SourceCode.Forms.DependencyHelper.applyRuleBadge);
        },

        /**
        * Iterates through all events in definition xml and calls the
        * SourceCode.Forms.DependencyHelper.applyRuleBadge for all events that needs to be badged.
        */
        applyErrorBadgesToEvents: function ()
        {
            var defXml = SourceCode.Forms.Designers.Common.getDefinitionXML();
            var xpath = ".//Events/Event[@ValidationStatus and @Type='User']";
            var eventNodes = defXml.selectNodes(xpath);

            if (checkExists(eventNodes))
            {
                for (var x = 0; x < eventNodes.length; x++)
                {
                    common.applyErrorBadgesToEvent(eventNodes[x]);
                }
            }
        },

        applyErrorBadgesToState: function (stateNode)
        {
            common._applyErrorBadgesToRuleItemNode(stateNode, SourceCode.Forms.DependencyHelper, SourceCode.Forms.DependencyHelper.applyStateBadge);
        },

        /**
        * Iterates through all states in definition xml and calls the
        * SourceCode.Forms.DependencyHelper.applyStateBadge for all events that needs to be badged.
        */
        applyErrorBadgesToStates: function ()
        {
            var defXml = SourceCode.Forms.Designers.Common.getDefinitionXML();
            var xpath = ".//States/State[@ValidationStatus]";
            var stateNodes = defXml.selectNodes(xpath);

            if (checkExists(stateNodes))
            {
                for (var x = 0; x < stateNodes.length; x++)
                {
                    common.applyErrorBadgesToState(stateNodes[x]);
                }
            }
        },

        // Return all control property dependency issues
        // ------------------------------------------------------------
        // controlId (string): Control's unique ID.  Optional and if not supplied the function will run for all controls
        getControlPropertyDependencyIssues: function (controlId)
        {
            var dependancies = [];
            var dependancy;

            var defXml = SourceCode.Forms.Designers.Common.getDefinitionXML();

            var controlCriteria = "";
            if (checkExistsNotEmpty(controlId))
            {
                controlCriteria = "[@ID='{0}']".format(controlId);
            }

            var xpath = ".//Controls/Control{0}/Properties/Property".format(controlCriteria) + common.getXPathValidationStatusCondition();

            var nodes = defXml.selectNodes(xpath);

            var analyzerService = SourceCode.Forms.Services.AnalyzerResourcesService();

            for (var i = 0; i < nodes.length; i++)
            {
                var node = nodes[i];
                var messages = node.getAttribute("ValidationMessages");

                if (checkExistsNotEmpty(messages))
                {
                    if (!checkExistsNotEmpty(controlId))
                    {
                        var propertiesNode = node.parentNode;
                        var controlNode = propertiesNode.parentNode;
                        controlId = controlNode.getAttribute("ID");
                    }
                    dependancy =
                    {
                        controlId: controlId,
                        hasError: true,
                        errorMessage: analyzerService.getValidationMessages(messages)
                    };
                    dependancies.push(dependancy);
                }
            }
            return dependancies;
        },

        // Check if a control property has dependency issues
        // ------------------------------------------------------------
        // controlId (string): Control's unique ID
        // propertyName: 'Field' or 'ControlExpression' ...
        // return dependency object that contains dependency information
        checkControlPropertyHasDependencyIssue: function (controlId, propertyName)
        {
            var dependency =
            {
                controlId: controlId,
                hasError: false,
                errorMessage: ""
            };

            var defXml = SourceCode.Forms.Designers.Common.getDefinitionXML();

            var xpath = ".//Controls/Control[@ID='{0}']".format(controlId);
            var controlNode = defXml.selectSingleNode(xpath);

            if (!checkExists(controlNode))
            {
                // if the control node does not exist, there won't be an error.
                return dependency;
            }

            xpath = "Properties/Property[Name='{0}']".format(propertyName) + common.getXPathValidationStatusCondition();
            var node = controlNode.selectSingleNode(xpath);

            if (!checkExists(node))
            {
                dependency = this.checkControlComplexPropertyHasDependencyIssue(controlId, controlNode, propertyName);
            }
            else
            {
                dependency.hasError = true;

                var analyzerService = SourceCode.Forms.Services.AnalyzerResourcesService();

                var messages = node.getAttribute("ValidationMessages");

                if (checkExistsNotEmpty(messages))
                {
                    dependency.errorMessage = analyzerService.getValidationMessages(messages);
                }
            }

            return dependency;
        },

        _cacheControlTypeComplexPropertyPropertiesXpath: {},

        // Gets the category of complex control properties
        // ------------------------------------------------------------
        // controlType (string): Control's type 'TextBox' or 'Label' ... 
        // propertyName: 'Field' or 'ControlExpression' ...
        // return the category or null if the property type was not complex
        getComplexPropertyPropertiesXpath: function (controlType, propertyName)
        {
            var key = controlType + "-" + propertyName;
            var propertiesXpath = this._cacheControlTypeComplexPropertyPropertiesXpath[key];
            if (!checkExists(propertiesXpath))
            {
                propertiesXpath = "";
                var xpath = "Controls/Control[Name='{0}']/DefaultProperties/Properties/Prop[@ID='{1}']".format(controlType, propertyName);
                var specificPropertyNode = SourceCode.Forms.Designers.Common.controlDefinitionsXml.selectSingleNode(xpath);
                if (checkExistsNotEmpty(specificPropertyNode))
                {
                    var propertiesNode = specificPropertyNode.parentNode;

                    var propertyType = specificPropertyNode.getAttribute("type");
                    if (checkExistsNotEmpty(propertyType) && propertyType === "complex")
                    {
                        var category = specificPropertyNode.getAttribute("category");

                        xpath = "Prop[@category='{0}'][@type!='complex'][@serverControlType][@ID!='{1}']/@ID".format(category, propertyName);

                        var propertyNames = propertiesNode.selectNodes(xpath);

                        for (var i = 0; i < propertyNames.length; i++)
                        {
                            if (i === 0)
                            {
                                propertiesXpath = "[";
                            }

                            propertiesXpath += "Name='{0}'".format(propertyNames[i].text);

                            if (i < propertyNames.length - 1)
                            {
                                propertiesXpath += " or ";
                            }
                            else
                            {
                                propertiesXpath += "]";
                            }
                        }
                    }
                    this._cacheControlTypeComplexPropertyPropertiesXpath[key] = propertiesXpath;
                }
            }
            return propertiesXpath;
        },

        // Check if a control property has grouped properties that have dependency issues
        // ------------------------------------------------------------
        // controlId (string): Control's unique ID
        // controlNode (xmlNode): the control node for this control from the view / form
        // propertyName: 'Field' or 'ControlExpression' ...
        // return dependency object that contains dependency information
        checkControlComplexPropertyHasDependencyIssue: function (controlId, controlNode, propertyName)
        {
            var dependency =
            {
                controlId: controlId,
                hasError: false,
                errorMessage: ""
            };

            var controlType = controlNode.getAttribute("Type");

            var propertiesXpath = this.getComplexPropertyPropertiesXpath(controlType, propertyName);

            if (checkExistsNotEmpty(propertiesXpath))
            {
                var xpath = "Properties/Property" + propertiesXpath + common.getXPathValidationStatusCondition();
                var firstInvalidProperty = controlNode.selectSingleNode(xpath);
                if (checkExists(firstInvalidProperty))
                {
                    dependency.hasError = true;
                    var analyzerService = SourceCode.Forms.Services.AnalyzerResourcesService();

                    var messages = firstInvalidProperty.getAttribute("ValidationMessages");

                    if (checkExistsNotEmpty(messages))
                    {
                        dependency.errorMessage = analyzerService.getValidationMessages(messages);
                    }
                }
            }
            return dependency;
        },

        // Check if a control conditional style has dependency issues
        // ------------------------------------------------------------
        // controlId (string): Control's unique ID
        // return dependency object that contains dependency information
        checkControlConditionalStylesHasDependencyIssue: function (controlId)
        {
            var i;
            var dependency = {
                hasError: false,
                errorMessage: ""
            };

            var defXml = SourceCode.Forms.Designers.Common.getDefinitionXML();

            var node = defXml.selectSingleNode(".//Controls/Control[@ID='{0}']".format(controlId) +
                "[ConditionalStyles/ConditionalStyle" + common.getXPathValidationStatusCondition() + "]");

            if (!checkExists(node))
            {
                dependency.hasError = false;
                return dependency;
            }

            dependency.hasError = true;

            var analyzerService = SourceCode.Forms.Services.AnalyzerResourcesService();

            var validationMessages = "";

            var itemNodes = node.selectNodes("ConditionalStyles/ConditionalStyle/Condition//Item" +
                common.getXPathValidationStatusCondition());

            if (checkExists(itemNodes) && itemNodes.length > 0)
            {
                for (i = 0; i < itemNodes.length; i++)
                {
                    var message = itemNodes[i].getAttribute("ValidationMessages");
                    if (checkExistsNotEmpty(message))
                    {
                        if (checkExistsNotEmpty(validationMessages))
                        {
                            validationMessages += '\n';
                        }

                        validationMessages += analyzerService.getValidationMessages(message);
                    }
                }
            }


            if (checkExistsNotEmpty(validationMessages))
            {
                dependency.errorMessage = validationMessages;
            }

            return dependency;
        },

        // Attempts to remove an error item from the report model
        // ------------------------------------------------------------
        // item (object): Object containing the details of an error item usually parsed from the annotation (Validation Message)
        // returns nothing
        removeItemFromDependencyReporterModel: function (item)
        {

        },

        // Analyzes & adds data to the reporter model
        // ------------------------------------------------------------
        // references (array): Array of references each with dependent items
        // returns nothing
        updateDependencyReporterModel: function (references)
        {

        },

        /**
         * Will return the correct display name for an item mapping.
         * Order to use for displayname is SourceDisplayName attribute, DisplayName attribute,
         * if not exist, first check validation message for display name, name,
         * else return unresolved resource text according to item type
         * 
         * @param {xmlNode} itemNode Mapping item node.
         * 
         */
        getItemDisplayName: function (itemNode)
        {
            var result = "";

            if (!checkExists(itemNode))
            {
                return result;
            }

            var sourceType = itemNode.getAttribute("SourceType") || "";
            var sourceName = itemNode.getAttribute("SourceName") || "";
            var sourceDisplayName = itemNode.getAttribute("SourceDisplayName") || sourceName;

            if (sourceDisplayName === "")
            {
                sourceDisplayName = itemNode.getAttribute("DisplayName") || "";

                var validationMessages = itemNode.getAttribute("ValidationMessages");
                if (sourceDisplayName === "" && checkExists(validationMessages))
                {
                    //Get missing object's name from validation message
                    //We expect to only have one validation message for an item node
                    var resourceSvc = SourceCode.Forms.Services.AnalyzerResourcesService();
                    var validationList = resourceSvc.parseValidationMessage(validationMessages);
                    sourceDisplayName = validationList[0].displayName || "";
                    if (sourceDisplayName === "" && checkExists(validationList[0].name))
                    {
                        sourceDisplayName = validationList[0].name || "";
                    }
                    if (sourceType === "" && checkExists(validationList[0].type))
                    {
                        sourceType = validationList[0].type || "";
                    }
                }
            }

            result = sourceDisplayName;

            if (result === "")
            {
                result = SourceCode.Forms.DependencyHelper.getUnresolvedResourceText(sourceType);
            }

            return result;
        },

        refreshPanelsAnnotation: function ()
        {
            var dependencyHelper = SourceCode.Forms.DependencyHelper;
            var defXml = SourceCode.Forms.Designers.Common.getDefinitionXML();



            var panelNodes = defXml.selectNodes(".//Panels/Panel{0}".format(SourceCode.Forms.Designers.Common.getXPathValidationStatusCondition()));
            var controlsInError = defXml.selectNodes(".//Panels/Panel/Areas/Area/Items/Item//Control{0}".format(SourceCode.Forms.Designers.Common.getXPathValidationStatusCondition()));

            var panelNode = null;
            var areaNode = null;
            var itemNode = null;

            var i = 0;
            var annotationOptions = null;

            //The controls in the panel may have been moved to a different Tab,
            //Thus lets first refresh the validation messages for panels that has a control in error
            for (i = 0; i < controlsInError.length; i++)
            {
                //Refresh validation messages for item node
                itemNode = controlsInError[i].selectSingleNode("./ancestor::Item");

                annotationOptions =
                {
                    nodeToAnnotate: itemNode,
                    annotationStatus: dependencyHelper.ReferenceStatus.Error,
                    annotationMessage: "Layout,Layout,Error,,,",
                    annotationAction: dependencyHelper.AnnotationAction.Update
                }

                dependencyHelper.updateValidationMessageToXmlNode(annotationOptions);

                //Refresh validation messages for area node
                areaNode = itemNode.selectSingleNode("./ancestor::Area");

                annotationOptions =
                {
                    nodeToAnnotate: areaNode,
                    annotationStatus: dependencyHelper.ReferenceStatus.Error,
                    annotationMessage: "AreaItem,AreaItem,Error,{0},,".format(itemNode.getAttribute("ID")),
                    annotationAction: dependencyHelper.AnnotationAction.Update
                }
                dependencyHelper.updateValidationMessageToXmlNode(annotationOptions);

                //Refresh validation messages for panel node
                panelNode = itemNode.selectSingleNode("./ancestor::Panel");

                annotationOptions =
                {
                    nodeToAnnotate: panelNode,
                    annotationStatus: dependencyHelper.ReferenceStatus.Error,
                    annotationMessage: "Area,Area,Error,{0},,".format(areaNode.getAttribute("ID")),
                    annotationAction: dependencyHelper.AnnotationAction.Update
                }

                dependencyHelper.updateValidationMessageToXmlNode(annotationOptions);
            }

            var itemNodes = defXml.selectNodes(".//Panels/Panel/Areas/Area/Items/Item[.//Control[not(contains(@ValidationStatus,'Error') or contains(@ValidationStatus,'Warning') or contains(@ValidationStatus,'Missing'))]]");

            for (i = 0; i < itemNodes.length; i++)
            {
                itemNode = itemNodes[i];

                dependencyHelper.removeAnnotation(itemNode);
            }


            //For panels that have no more controls in error, we can remove the validation messages
            for (i = 0; i < panelNodes.length; i++)
            {
                panelNode = panelNodes[i];

                dependencyHelper.removeInvalidAnnotationForPanel(panelNode);
            }
        },

        addViewAnnotation: function (instanceId, viewId, viewName, viewDisplayName)
        {
            var dependencyHelper = SourceCode.Forms.DependencyHelper;
            var defXml = SourceCode.Forms.Designers.Common.getDefinitionXML();

            var errorItemNode = defXml.selectSingleNode(".//Areas/Area/Items/Item[@ID='{0}' and @ViewID='{1}']".format(instanceId, viewId));
            if (checkExists(errorItemNode))
            {
                var annotationOptions =
                {
                    nodeToAnnotate: errorItemNode,
                    annotationStatus: "Warning",
                    annotationMessage: "AreaItemView,View,Warning,{0},{1},{2}".format(viewId, viewName, viewDisplayName)
                };
                dependencyHelper.updateValidationMessageToXmlNode(annotationOptions);

                var errorAreaNode = errorItemNode.selectSingleNode("./ancestor::Area");

                if (checkExists(errorAreaNode))
                {
                    var nameNode = defXml.selectSingleNode(".//Control[@ID='{0}' and @Type='AreaItem']/Name".format(instanceId));

                    var areaItemName = "";

                    if (checkExists(nameNode))
                    {
                        areaItemName = nameNode.text;
                    }

                    annotationOptions =
                    {
                        nodeToAnnotate: errorAreaNode,
                        annotationStatus: "Warning",
                        annotationMessage: "AreaItem,AreaItem,Warning,{0},{1}".format(instanceId, areaItemName)
                    };
                    dependencyHelper.updateValidationMessageToXmlNode(annotationOptions);

                    var errorPanelNode = errorItemNode.selectSingleNode("./ancestor::Panel");

                    if (checkExists(errorPanelNode))
                    {
                        var areaId = errorAreaNode.getAttribute("ID");

                        annotationOptions =
                        {
                            nodeToAnnotate: errorPanelNode,
                            annotationStatus: "Warning",
                            annotationMessage: "Area,Area,Warning,{0},,".format(areaId)
                        };
                        dependencyHelper.updateValidationMessageToXmlNode(annotationOptions);
                    }
                }
            }
        },

        removeInvalidSourceFieldAnnotationForControl: function (controlId)
        {
            var xmlDoc = SourceCode.Forms.Designers.Common.getDefinitionXML();

            var annotationChanged = false;

            if (!checkExists(xmlDoc))
            {
                return annotationChanged;
            }

            var controlNode = xmlDoc.selectSingleNode(".//Controls/Control[@ID='{0}']".format(controlId));

            if (!checkExists(controlNode))
            {
                return annotationChanged;
            }

            var fieldId = controlNode.getAttribute("FieldID");
            var validationMessages = controlNode.getAttribute("ValidationMessages");
            var annotationToRemove = {};

            //FieldID may have been changed thus remove the annotations that are not relevant to the current FieldID
            if (checkExists(validationMessages))
            {
                var resourceSvc = SourceCode.Forms.Services.AnalyzerResourcesService();
                var messages = resourceSvc.parseValidationMessage(validationMessages);

                for (var i = 0; i < messages.length; i++)
                {
                    if (messages[i].type === SourceCode.Forms.DependencyHelper.ReferenceType.SourceField &&
                        messages[i].guid !== fieldId)
                    {
                        annotationToRemove =
                        {
                            type: SourceCode.Forms.DependencyHelper.ReferenceType.SourceField,
                            guid: messages[i].guid
                        };
                        controlNode.removeAttribute("FieldID");
                        SourceCode.Forms.DependencyHelper.removeAnnotation(controlNode, annotationToRemove);

                        annotationChanged = true;
                    }

                }
            }

            return annotationChanged;
        },

        ensureControlOverlay: function (element)
        {
            var overlay = element.find(">.controloverlay");
            if (overlay.length === 0)
            {
                element.append(SourceCode.Forms.Designers.Common._buildControlOverlay());
            }
            else
            {
                element.append(overlay); //makes sure the overlay is the last child.
            }
        },

        _buildControlOverlay: function ()
        {
            var overlay = jQuery('<div class="controloverlay"></div>');
            return overlay;
        },

        toggleCanvasAdornments: function (on)
        {
            $(".canvas-adornments").toggleClass("base-index", !on)
            $("td.editor-cell.header.error, tr.list-view-item > td.editor-cell.header.error.hidden-after").toggleClass("base-index", !on);
        },

        ensureDefinitionIsUpToDate: function ()
        {
            SourceCode.Forms.Designers.Common.Context._rebuildDefinitionXML();
        },

        createNewControlInDefinition: function (controlData)
        {
            var xmlDoc = SourceCode.Forms.Designers.Common.getDefinitionXML();

            var controlId = controlData.controlId;
            var controlType = controlData.controlType;

            var controlsNode = xmlDoc.selectSingleNode("./*/*/*/Controls");
            var controlNode = xmlDoc.selectSingleNode("//Control[(@ID='" + controlId + "')]");


            if (!checkExists(controlNode))
            {
                controlNode = xmlDoc.createElement('Control');
                controlsNode.appendChild(controlNode);
            }

            controlNode.setAttribute('ID', controlId);
            controlNode.setAttribute('Type', controlType);

            controlNode.removeAttribute('FieldID');
            controlNode.removeAttribute('ExpressionID');

            var controlNameNode = controlNode.selectSingleNode('Name');
            if (checkExists(controlNameNode))
            {
                controlNameNode.parentNode.removeChild(controlNameNode);
            }
            controlNameNode = xmlDoc.createElement('Name');
            controlNode.appendChild(controlNameNode);

            var displayNameNode = controlNode.selectSingleNode('DisplayName');
            if (checkExists(displayNameNode))
            {
                displayNameNode.parentNode.removeChild(displayNameNode);
            }
            displayNameNode = xmlDoc.createElement('DisplayName');
            controlNode.appendChild(displayNameNode);

            var nameValueNode = controlNode.selectSingleNode('NameValue');
            if (checkExists(nameValueNode))
            {
                nameValueNode.parentNode.removeChild(nameValueNode);
            }
            nameValueNode = xmlDoc.createElement('NameValue');
            controlNode.appendChild(nameValueNode);

            controlNameNode.appendChild(xmlDoc.createTextNode(controlData.name));
            displayNameNode.appendChild(xmlDoc.createTextNode(controlData.name));
            nameValueNode.appendChild(xmlDoc.createTextNode(controlData.name));

            return controlNode;
        },

        createNewPropertyNode: function (xmlDoc, name, value, displayValue, nameValue)
        {
            var propertyEl = xmlDoc.createElement("Property");
            var nameEl = xmlDoc.createElement("Name");
            var valueEl = xmlDoc.createElement("Value");
            var nameValueEl = xmlDoc.createElement("NameValue");
            var displayValueEl = xmlDoc.createElement("DisplayValue");

            if (!checkExists(displayValue))
            {
                displayValue = value;
            }

            if (!checkExists(nameValue))
            {
                nameValue = value;
            }

            nameEl.appendChild(xmlDoc.createTextNode(name));
            valueEl.appendChild(xmlDoc.createTextNode(value));
            nameValueEl.appendChild(xmlDoc.createTextNode(nameValue));
            displayValueEl.appendChild(xmlDoc.createTextNode(displayValue));

            propertyEl.appendChild(nameEl);
            propertyEl.appendChild(valueEl);
            propertyEl.appendChild(nameValueEl);
            propertyEl.appendChild(displayValueEl);

            return propertyEl;
        },


        //New method - updates the XML directly from a column object model {id:xxx, index:0, width:strwidth}
        updateColumnDefinitionFromObjectModel: function (xmlDoc, containerId, columnObjectModel)
        {
            var controlNode = xmlDoc.selectSingleNode("//Control[(@LayoutType='Grid')and(@ID='" + containerId + "')]");
            return SourceCode.Forms.Designers.Common.updateColumnDefinitionFromObjectModelInParent(xmlDoc, controlNode, columnObjectModel);
        },

        //New method - updates the XML directly from a column object model {id:xxx, index:0, width:strwidth}
        updateColumnDefinitionFromObjectModelInParent: function (xmlDoc, parentElem, columnObjectModel)
        {
            var columnsNode = parentElem.selectSingleNode("Columns");
            if (!checkExists(columnsNode))
            {
                //If Columns node still doesn't exists, create it
                columnsNode = xmlDoc.createElement('Columns');
                parentElem.appendChild(columnsNode);
            }

            var colWidth = columnObjectModel.width;

            if (!checkExists(colWidth))
            {
                colWidth = "";
            }

            var id = columnObjectModel.id;
            var controltype = "Column";

            var columnNode = columnsNode.selectSingleNode("Column[@ID='{0}']".format(id));
            if (!checkExists(columnNode))
            {
                //If Column node doesn't exist, then create it for the definition

                columnNode = xmlDoc.createElement(controltype);
                var insertAt = columnObjectModel.index;


                // Only search from within the current columns element
                var allColElements = columnsNode.selectNodes(".//Column");

                if (insertAt < allColElements.length)
                {
                    var nextColElement = allColElements[insertAt];
                    columnsNode.insertBefore(columnNode, nextColElement);
                }
                else
                {
                    columnsNode.appendChild(columnNode);
                }
            }

            //Set the column width
            columnNode.setAttribute("ID", id);
            columnNode.setAttribute("Size", colWidth);

            SourceCode.Forms.Designers.Common.updateColumnControlWidth(id, colWidth);
        },

        //Old method - updates the XML directly from a <COL> in the html
        updateColumnDefinition: function (containerId, jqCol)
        {
            var xmlDoc = SourceCode.Forms.Designers.Common.getDefinitionXML();

            var controlNode = xmlDoc.selectSingleNode("//Control[(@LayoutType='Grid')and(@ID='" + containerId + "')]");

            var columnsNode = controlNode.selectSingleNode("Columns");
            if (!checkExists(columnsNode))
            {
                //If Columns node still doesn't exists, create it
                columnsNode = xmlDoc.createElement('Columns');
                controlNode.appendChild(columnsNode);
            }

            var colWidth = jqCol.data("width");

            if (!checkExists(colWidth))
            {
                colWidth = "";
            }

            var id = jqCol.attr("id");
            var controltype = "Column";

            var columnNode = columnsNode.selectSingleNode("Column[@ID='{0}']".format(id));
            if (!checkExists(columnNode))
            {
                //If Column node doesn't exist create it for the definition

                columnNode = xmlDoc.createElement(controltype);
                var nextCol = jqCol.next();

                // This is done to keep lookups insync for colgroup-columns and the xml
                if (nextCol.length > 0)
                {
                    var nextColID = nextCol.attr('id');
                    var nextColElement = columnsNode.selectSingleNode(".//Column[@ID='" + nextColID + "']"); // Only search from within the current columns element

                    if (checkExists(nextColElement))
                    {
                        columnsNode.insertBefore(columnNode, nextColElement);
                    }
                    else
                    {
                        columnsNode.appendChild(columnNode);
                    }
                }
                else
                {
                    columnsNode.appendChild(columnNode);
                }
            }

            //Set the column width
            columnNode.setAttribute("ID", id);
            columnNode.setAttribute("Size", colWidth);

            SourceCode.Forms.Designers.Common.updateColumnControlWidth(id, colWidth);
        },

        updateColumnControlWidth: function (columnId, colWidth)
        {
            var xmlDoc = SourceCode.Forms.Designers.Common.getDefinitionXML();
            var controltype = "Column";

            //[898059] if the control has an existing name then use it else generate a unique name for the control
            var controlsNode = xmlDoc.selectSingleNode("./*/*/*/Controls");
            var controlNameValueNode = xmlDoc.selectSingleNode("//Controls/Control[@ID='{0}']/Properties/Property[Name='ControlName']/Value".format(columnId));
            var controlName = checkExists(controlNameValueNode) ? controlNameValueNode.text : SourceCode.Forms.Designers.generateUniqueControlName(columnId, "", controltype, controlsNode);

            var controlData =
            {
                controlId: columnId,
                controlType: controltype,
                name: controlName
            };

            var controlNode = common.createNewControlInDefinition(controlData);

            var properties = controlNode.selectSingleNode("Properties");

            if (!checkExists(properties))
            {
                properties = xmlDoc.createElement("Properties");
                controlNode.appendChild(properties);
            }

            //Update Size property
            var sizeProperty = properties.selectSingleNode("Property[Name='Size']");
            if (checkExists(sizeProperty))
            {
                properties.removeChild(sizeProperty);
            }
            properties.appendChild(common.createNewPropertyNode(xmlDoc, "Size", colWidth));

            //Update ControlName property
            var controlNameProperty = properties.selectSingleNode("Property[Name='ControlName']");
            if (!checkExists(controlNameProperty))
            {
                properties.appendChild(common.createNewPropertyNode(xmlDoc, "ControlName", controlData.name));
            }
        },

        getEditorTableFromSelectedObject: function (selectedObject)
        {
            var object = null;
            if (!checkExists(selectedObject))
            {
                object = SourceCode.Forms.Designers.Common.Context.findControlFromSelectedObject();
            }
            else
            {
                object = selectedObject;
            }

            var controlType = common.getControlType(object.attr('id'));

            if (!checkExists(controlType) && object.hasClass("form-control") && object.hasClass("table-control"))
            {
                //controltype may not always been defined for table control in the Form designer so use the class to determine if the control is a table control.
                //you can have this issue by selecting a table control in the "Selection" tab in the context browser.
                controlType = "Table";
            }

            if (controlType !== "Table" && controlType !== "Cell" && controlType !== "Column")
            {
                return null;
            }

            //Check if the selected object is within a widget?
            var isInWidget = (object.closest(".canvas-widget").length > 0);

            var jqTable = null;

            if (controlType === "Table")
            {
                //If selected object is a table control
                jqTable = object.find(".editor-table").first();
            }
            else if (isInWidget)
            {
                //It is possible have selected object in the column resize widget.  When user clicks on a column selector, it selects a <col> element inside of the widget.
                //The temproary <col> elements are rendered with the widget and this is needed because Table control rendered as Grid doesn't have <col> element to represent a Column control.
                if (common._tableColumnResizer)
                {
                    jqTable = common._tableColumnResizer.getTable();
                }
            }
            else
            {
                //If selected object is cell or column in a table
                jqTable = object.closest(".editor-table");
            }

            if (jqTable.length === 0)
            {
                return null;
            }

            return jqTable;
        },

        getEditorTableWrapper: function (jqTable)
        {
            if (!checkExists(jqTable) || !jqTable.hasClass("editor-table"))
            {
                return $();
            }

            var jqWrapper = jqTable.parent();

            if (jqWrapper.hasClass("resizewrapper"))
            {
                //Normally the control wrapper is the parent() and parent() of the editor table.
                //We need to get the controlwrapper like this because for ListView, the toolbar is structured differently and does not have a resizewrapper
                jqWrapper = jqWrapper.parent();
            }

            return jqWrapper;
        },

        //pass in the <table> or grid, and get the actual wrapper's id (i.e. the control itself)
        getTableControlIdFromTable: function (jqTable)
        {
            if (!common.isTableControl(jqTable)) return;
            var jqWrapper = jqTable.parent();
            var result = null;
            if (jqWrapper.hasClass("resizewrapper"))
            {
                //Normally the control wrapper is the parent() and parent() of the editor table.
                //We need to get the controlwrapper like this because for ListView, the toolbar is structured differently and does not have a resizewrapper
                jqWrapper = jqWrapper.parent();
                result = jqWrapper.attr("id");
            }
            if (jqWrapper.hasClass("form-control"))
            {
                result = jqWrapper.attr("id");
            }
            return result;
        },

        isTableControl: function (jqTable)
        {
            if (!checkExists(jqTable))
            {
                return false;
            }

            if (!jqTable.hasClass("editor-table"))
            {
                return false;
            }

            var jqWrapper = jqTable.parent();

            if (jqWrapper.hasClass("resizewrapper"))
            {
                //Normally the control wrapper is the parent() and parent() of the editor table.
                //We need to get the controlwrapper like this because for ListView, the toolbar is structured differently and does not have a resizewrapper
                jqWrapper = jqWrapper.parent();
            }

            if (jqWrapper.attr("layout") === "ToolbarTable" || jqWrapper.attr("layout") === "ListTable")
            {
                //When a toolbar cell is selected or when a ListTable column is selected then we don't want to show the table column resize widget
                return false;
            }

            return true;
        },

        isTableControlCell: function (object)
        {
            var controlType = common.getControlTypeFromControlElement($(object));

            if (controlType === "Cell")
            {
                return common.isTableControl(common.getEditorTableFromSelectedObject($(object)));
            }

            return false;
        },

        isCanvasTable: function (object) 
        {
            if (object.parent().attr("id") === "bodySection" || //Object is table control wrapper
                object.parent().parent().attr("id") === "bodySection" || //Object is table control resize wrapper
                object.parent().parent().parent().attr("id") === "bodySection") //Objet is table control editor table
            {
                return true;
            }

            return false;
        },

        getColumnResizeInstance: function ()
        {
            return common._tableColumnResizer;
        },

        getControlALMBadgeManagerInstance: function ()
        {
            return common._controlALMBadgeManager;
        },

        getDesignerCanvasContainer: function () 
        {
            return SourceCode.Forms.Designers.Common.Context.getCanvasContainer();
        },

        getDesignerCanvasScrollWrapper: function () 
        {
            return SourceCode.Forms.Designers.Common.Context.getCanvasScrollWrapper();
        },

        //#region ColumnResize Widget

        createColumnResizeWidget: function (jqTable)
        {
            if (!checkExists(jqTable))
            {
                jqTable = SourceCode.Forms.TableHelper.generateGrid(1, 1);
            }

            var canvasContainer = SourceCode.Forms.Designers.Common.getDesignerCanvasContainer();
            var canvasScrollWraper = SourceCode.Forms.Designers.Common.getDesignerCanvasScrollWrapper();

            var options =
            {
                containerObj: canvasContainer,
                scrollWrapperObj: canvasScrollWraper,
                tableObj: jqTable[0],
                designerTable: SourceCode.Forms.Designers.View.DesignerTable
            };

            if (checkExists(common._tableColumnResizer))
            {
                common._tableColumnResizer.clearColumnResizeWidget();
                delete common._tableColumnResizer;
            }

            common._tableColumnResizer = new TableColumnResizer(options);
        },

        isMoveWidget: function (element)
        {
            return ($(element).hasClass("widget-button"));
        },

        applyStyleToControl: function (jqControl, styleXmlToApply, useClasses)
        {
            //See Sourcecode.Forms.Designers.View.Styles.js - for the singleton that deals with Style XML updates for forms and views.
            var controlStyleDataUtility = SourceCode.Forms.Designers.View.Styles;

            controlStyleDataUtility._applyControlStyles(jqControl, styleXmlToApply, useClasses);
        },

        //enable or disable prevent XSS preoperty depend on the literal property selection
        enableDisablePreventXssProperty: function (literal)
        {
            var $preventXss = $(".propertyGridPropertyItem.sanitizehtml-property");
            var $preventXssCheckbox = $preventXss.find("label.checkbox").checkbox();

            if (literal)
            {
                if ($preventXss.hasClass("disabled"))
                {
                    $preventXss.removeClass("disabled");
                    $preventXssCheckbox.checkbox("enable");

                    if (!$preventXssCheckbox.hasClass("checked"))
                    {
                        //check the prevent xss checkbox if it was unchecked
                        $preventXssCheckbox.find('.propertyGridPropertyEditCheckBox').trigger("click");
                    }
                }
            }
            else
            {
                if ($preventXssCheckbox.hasClass("checked"))
                {
                    //uncheck the prevent xss checkbox if it was checked
                    $preventXssCheckbox.find('.propertyGridPropertyEditCheckBox').trigger("click");
                }

                $preventXss.addClass("disabled");
                $preventXssCheckbox.checkbox("disable");
            }
        },

        addDynamicVariablesStylesheet: function (optionsArg)
        {
            var options = checkExists(optionsArg) ? optionsArg : {};

            var addStylesheetUrl = "Utilities/AJAXCall.ashx?method=GetStyleProfileVariablesFromVariables&json=[]";

            if (checkExistsNotEmpty(options.styleProfileId))
            {

                addStylesheetUrl = "Utilities/AJAXCall.ashx?method=GetStyleProfileVariables&id=" + options.styleProfileId;

            } else if (checkExists(options.variablesJson) && (options.variablesJson.length > 0))
            {

                var variablesJsonString = JSON.stringify(options.variablesJson);
                variablesJsonString = encodeURIComponent(variablesJsonString);

                addStylesheetUrl = "Utilities/AJAXCall.ashx?method=GetStyleProfileVariablesFromVariables&json=" + variablesJsonString;
            }

            addStylesheetUrl = addStylesheetUrl + "&forceRefresh=" + Date.now();

            SourceCode.Forms.Designers.Common.currentDynamicVariablesStylesheetIndex++;
            SourceCode.Forms.Designers.Common.currentDynamicVariablesStylesheetId =
                SourceCode.Forms.Designers.Common.DYNAMIC_VARIABLES_STYLESHEET_ID + SourceCode.Forms.Designers.Common.currentDynamicVariablesStylesheetIndex;

            var addStylesheetOptions = { id: SourceCode.Forms.Designers.Common.currentDynamicVariablesStylesheetId };

            $.addStylesheet(addStylesheetUrl, addStylesheetOptions, options.callback);
        },

        // Retrieves a list of external files and then adds them to the dom.
        addExternalFiles: function (styleProfileId)
        {
            const getExternalFilesUrl = "Utilities/AJAXCall.ashx";

            $.get(getExternalFilesUrl, {
                method: "GetStyleProfileExternalFiles",
                id: styleProfileId,
                success: () => { } 
            }).then((response) =>
            {
                $.addExternalFiles(response);
            }).fail(() =>
            {
                console.error("Error while attempting to retrieve list of external files for the current selected style profile with ID: ", styleProfileId);
            });
        },

        removeOldDynamicVariablesStylesheets: function (optionsArg)
        {
            var options = checkExists(optionsArg) ? optionsArg : {};

            $.removeAllStylesForIdWithExclusion(SourceCode.Forms.Designers.Common.DYNAMIC_VARIABLES_STYLESHEET_ID, (options.currentDynamicVariablesStylesheetIncluded === true) ? "" : SourceCode.Forms.Designers.Common.currentDynamicVariablesStylesheetId);
        }
    };

    $.extend(_designers,
        {
            controlDefaultNames: {},
            controlDefaultNameLastCounter: {},
            controlDefaultNameLastCounterTimeoutHandle: null,

            //init
            init: function ()
            {
                if (checkExists(common._selectionLoop))
                {
                    common._selectionLoop.destroy();
                }

                if (checkExists(common._moveWidget))
                {
                    common._moveWidget.destroy();
                }

                if (checkExists(common._controlALMBadgeManager))
                {
                    common._controlALMBadgeManager.destroy();
                }

                common._selectionLoop = new SelectionLoop();
                common._moveWidget = new MoveWidget(); //for tables and other controls.
                common._controlALMBadgeManager = new ControlALMBadgeManager();
            },

            removeDependentItemsAndAnnotateDependencies: function (references)
            {
                var itemsRemoved = [];
                var xmlDef = SourceCode.Forms.Designers.Common.getDefinitionXML();

                itemsRemoved = SourceCode.Forms.DependencyHelper.removeDependentItems(references, xmlDef);

                return this.annotateItemsRemoved(itemsRemoved);
            },

            annotateItemsRemoved: function (itemsRemoved)
            {
                var i = 0;
                var xmlDef = SourceCode.Forms.Designers.Common.getDefinitionXML();
                var referencesToAnnotate = [];

                for (i = 0; i < itemsRemoved.length; i++)
                {
                    var referenceObj =
                    {
                        id: itemsRemoved[i].id,
                        type: itemsRemoved[i].type,
                        name: itemsRemoved[i].name,
                        displayName: itemsRemoved[i].displayName
                    };
                    //For events, definitionId property is needed instead of id
                    if (checkExists(itemsRemoved[i].definitionId))
                    {
                        referenceObj.definitionId = itemsRemoved[i].definitionId;

                        if (checkExistsNotEmpty(itemsRemoved[i].instanceId))
                        {
                            referenceObj.instanceId = itemsRemoved[i].instanceId;
                        }
                        delete referenceObj.id;
                    }

                    referenceObj = SourceCode.Forms.DependencyHelper.findReferences(xmlDef, referenceObj);

                    referencesToAnnotate.push(referenceObj);
                }

                return this.annotateDependentItems(referencesToAnnotate);
            },

            annotateDependentItems: function (references)
            {
                if (!checkExists(references) || references.length === 0)
                {
                    return [];
                }

                var i = 0;
                var xmlDef = SourceCode.Forms.Designers.Common.getDefinitionXML();

                // Update reference statuses
                for (i = 0; i < references.length; i++)
                {
                    references[i].status = "Missing";
                }

                SourceCode.Forms.DependencyHelper.updateAnnotations(xmlDef, references);

                return references;
            },

            //NOTE: This function will be removed as soon as Dependency Notifier check in complete
            checkControlDependencies: function (controlid, doc, callback)
            {
                var dependencies = doc.selectNodes("//Item[@SourceType='Control'][@SourceID='" + controlid + "'] | //Item[@SourceType='ControlProperty'][@SourcePath='" + controlid + "'] | //ControlItemsCollection/Item[.='" + controlid + "']");
                var dependantCount = dependencies.length;
                var msg = Resources.Designers.ControlDependenciesWarningMsg;
                var items = "<ul class=\"tree\">";
                var eventNames = [];
                if (dependantCount > 0)
                {
                    for (var i = 0, l = dependencies.length; i < l; i++)
                    {
                        var item = dependencies[i];

                        var expressions = item.selectNodes("./ancestor::Expression");

                        for (var j = 0, k = expressions.length; j < k; j++)
                        {
                            var expression = expressions[j];
                            var control = doc.selectSingleNode("//Controls/Control[@ExpressionID='" + expression.getAttribute("ID") + "']"), controlname;
                            if (checkExists(control)) controlname = control.selectSingleNode("Name").text;
                            items += "<li class=\"expression\"><a href=\"javascript:;\">" + expression.selectSingleNode("Name").text + (checkExists(controlname) ? " (" + controlname + ")" : "") + "</a></li>";
                        }

                        var styles = item.selectNodes("./ancestor::ConditionalStyle");

                        for (var j = 0, k = styles.length; j < k; j++)
                        {
                            var style = styles[j];
                            var control = style.selectSingleNode("./ancestor::Control"), controlname;
                            if (checkExists(control)) controlname = control.selectSingleNode("Name").text;
                            items += "<li class=\"conditional-style\"><a href=\"javascript:;\">" + style.selectSingleNode("Name").text + (checkExists(controlname) ? " (" + controlname + ")" : "") + "</a></li>";
                        }

                        var conditionsAndHandlers = item.selectNodes("./ancestor::Condition[@ID][not(@IsReference) or (@IsReference=0)] | ./ancestor::Handler[@ID][not(@IsReference) or (@IsReference=0)]");

                        for (var j = 0, k = conditionsAndHandlers.length; j < k; j++)
                        {
                            var conditionHandler = conditionsAndHandlers[j];
                            var event = conditionHandler.selectSingleNode("./ancestor::Event[@Type='User']");
                            if (checkExists(event))
                            {
                                var defid = event.getAttribute("DefinitionID");

                                var eventname, eventlocation;

                                eventname = event.selectSingleNode("Properties/Property[Name='RuleFriendlyName']/Value").text;
                                eventlocation = event.selectSingleNode("Properties/Property[Name='Location']/Value").text;
                                if (eventNames.indexOf("{0}_{1}".format(eventname, eventlocation)) === -1) //because why show a dependant event more than once.
                                {
                                    eventNames.push("{0}_{1}".format(eventname, eventlocation));
                                    items += "<li class=\"condition\"><a href=\"javascript:;\">" + eventname + " (" + eventlocation + ")" + "</a></li>";
                                }
                            }
                            else
                            {
                                dependantCount--;
                            }
                        }
                    }
                }
                if (dependantCount > 0)
                {
                    items += "</ul>";

                    msg = msg.replace("{0}", items);

                    if (checkExists(callback) && typeof callback === "function")
                    {
                        var tempDiv = $("<div style=\"width:460px\"></div>").appendTo("body");
                        tempDiv.html(msg);
                        h = tempDiv.outerHeight(true) + 81;
                        if (h > 400) h = 400;
                        w = 460;
                        tempDiv.remove();

                        popupManager.showConfirmation(
                            {
                                message: msg,
                                height: h,
                                width: w,
                                onAccept: function ()
                                {
                                    callback(controlid);
                                    popupManager.closeLast();
                                }
                            });
                    }
                    return false;
                }
                else
                {
                    return true;
                }
            },

            /**
             * Method to get all dependencies for object being removed.
             * Can be sent a collection of objects to check and could also return a collection of dependency collections.
             * 
             * @param {Object or Array of objects} itemsToDelete Object or array of objects consisting of:
             * itemId: ID of item being removed (controlId, view instance id, parameter id etc)
             * itemType: Type of item being removed
             * (e.g. "Control", "Expression" - see DependencyHelper findReferences method for more examples) - from DependencyHelper.ReferenceType enum
             * itemSystemName: (required for types that reference by system name instead of id, e.g. parameter or viewfield)
             * System name of item being removed (default empty, might not be available for all item types)
             * itemDisplayName: (not required) Display name of item being removed (default empty, might not be available for all item types)
             * @param dependencyData {object}: Contains additional dependency information. 
             * At the moment only xmlDef property in use, for passing on rule designer xml definition. If empty, use form or view designer definition XML.
             * @returns Collection of dependencies.
             */
            getDependencies: function (itemsToDelete, dependencyData)
            {
                //Ensure itemsToDelete is an array (to cater for multiples)
                var itemsToDelete = $.makeArray(itemsToDelete);
                var references = [];
                var objName = "";
                var objType = "";
                var specifiedXmlDef = checkExists(dependencyData) && checkExists(dependencyData.xmlDef);

                var definitionXML = specifiedXmlDef ?
                    dependencyData.xmlDef : SourceCode.Forms.Designers.Common.getDefinitionXML();
                var d = 0;
                var itemToDelete = null;

                var skipDefinitionUpdate = checkExists(dependencyData) && dependencyData.skipDefinitionUpdate === true;
                if (!skipDefinitionUpdate)
                {
                    if (!specifiedXmlDef)
                    {
                        SourceCode.Forms.DependencyHelper._ensureDefinitionIsUpToDate(definitionXML);
                    }
                    else
                    {
                        SourceCode.Forms.Designers.Common.Context.ensureDefinitionIsReadyForDependancyChecks(dependencyData.xmlDef);


                    }
                }


                for (d = 0; d < itemsToDelete.length; d++)
                {
                    itemToDelete = itemsToDelete[d];

                    var referenceObj =
                    {
                        id: itemToDelete.itemId,
                        type: itemToDelete.itemType,
                        name: itemToDelete.itemSystemName || "",
                        displayName: itemToDelete.itemDisplayName || ""
                    };
                    referenceObj.displayName = referenceObj.displayName.htmlEncode();

                    //Add data needed for specific types
                    switch (referenceObj.type)
                    {
                        case SourceCode.Forms.DependencyHelper.ReferenceType.Event:
                            referenceObj.definitionId = itemToDelete.definitionId;
                            referenceObj.instanceId = itemToDelete.instanceId;
                            delete referenceObj.id;
                            break;
                        case SourceCode.Forms.DependencyHelper.ReferenceType.ViewField:
                            referenceObj.sourceId = itemToDelete.sourceId;
                            referenceObj.sourceDetails = itemToDelete.sourceDetails;
                            referenceObj.newSourceDetails = itemToDelete.newSourceDetails;
                            referenceObj.contextId = itemToDelete.contextId;
                            break;
                        case SourceCode.Forms.DependencyHelper.ReferenceType.ControlField:
                        case SourceCode.Forms.DependencyHelper.ReferenceType.Source:
                            referenceObj.contextId = itemToDelete.contextId;
                            break;
                    }

                    referenceObj = SourceCode.Forms.DependencyHelper.findReferences(definitionXML, referenceObj);

                    if (checkExists(referenceObj) && checkExists(referenceObj.items) && referenceObj.items.length > 0)
                    {
                        if (referenceObj.type === SourceCode.Forms.DependencyHelper.ReferenceType.Control)
                        {
                            //Remove dependencies under 'populate list control with data' event for control that is being deleted.
                            //(These dependencies will be removed as part of the callback and user should not be notified - US 655627)
                            referenceObj.items = this._filterOutControlDataSourceDependencies(referenceObj.items, referenceObj.id);
                        }
                        else if (referenceObj.type === SourceCode.Forms.DependencyHelper.ReferenceType.Source)
                        {
                            referenceObj.items = this._filterOutUnnecessarySourceDependencies(referenceObj.items, referenceObj.id);
                        }

                        if (referenceObj.items.length > 0)
                        {
                            references.push(referenceObj);
                        }
                    }
                }

                return references;
            },

            /**
             * This function will build up the dependency object collection for all fields of a data source item and the data source item itself.
             * 
             * @function
             * 
             * @param {text} objectId - Id of list control that used datasource that will be removed. 
             * 
             * @param {text} sourceId Id of the smartobject datasource that was bound to the list control.
             * 
             * @param {text} newSourceId (optional) Id of the new smartobject datasource that will now be bound to control
             *(this is necessary so that fields in new SMO that have the same name of old SMO can autoresolve).
             * 
             * @returns List of dependency objects that can be used by the getDependencies / findReferences functions
             * 
             */
            getDependencyDataCollectionForExternalSource: function (objectId, sourceId, newSourceId)
            {
                var sourceDataCollection = [];

                var definitionXML = SourceCode.Forms.Designers.Common.getDefinitionXML();
                if (!checkExists(definitionXML))
                {
                    return [];
                }

                var xpath = ".//Sources/Source[(@ContextType='Association' or @ContextType='External') and @ContextID='{0}' and @SourceID='{1}']"
                    .format(objectId, sourceId);

                var sourceNode = definitionXML.selectSingleNode(xpath);

                if (!checkExists(sourceNode))
                {
                    return [];
                }

                //Add data item containing information for for each field in source
                sourceDataCollection = this._getFieldsDataCollectionForSource(sourceNode, sourceId, newSourceId, objectId);

                //Add data item for the source itself
                var sourceData =
                {
                    itemId: sourceNode.getAttribute("SourceID"),
                    itemType: SourceCode.Forms.DependencyHelper.ReferenceType.Source,
                    itemSystemName: sourceNode.getAttribute("SourceName"),
                    itemDisplayName: sourceNode.getAttribute("SourceDisplayName"),
                    contextId: objectId
                };
                sourceDataCollection.push(sourceData);

                return sourceDataCollection;
            },

            /**
             * This function will build up the dependency object collection for all fields of a primary data source item and the data source item itself.
             * 
             * @function
             * 
             * @param {text} sourceId Id of the smartobject datasource that was bound to the view.
             * 
             * @param {text} newSourceId (optional) Id of the new smartobject datasource that will now be bound to view
             *(this is necessary so that fields in new SMO that have the same name of old SMO can autoresolve).
             * 
             * @returns List of dependency objects that can be used by the getDependencies / findReferences functions
             * 
             */
            getDependencyDataCollectionForPrimarySource: function (sourceId, newSourceId)
            {
                var sourceDataCollection = [];

                var definitionXML = SourceCode.Forms.Designers.Common.getDefinitionXML();
                if (!checkExists(definitionXML))
                {
                    return [];
                }

                SourceCode.Forms.DependencyHelper._ensureDefinitionIsUpToDate(definitionXML);

                var xpath = ".//Sources/Source[(@ContextType='Primary') and @SourceID='{0}']".format(sourceId);

                var sourceNode = definitionXML.selectSingleNode(xpath);

                if (!checkExists(sourceNode))
                {
                    return [];
                }

                //Add data item containing information for for each field in primary source
                sourceDataCollection = this._getFieldsDataCollectionForSource(sourceNode, sourceId, newSourceId);

                //Add data item for the primary source itself
                var sourceData =
                {
                    itemId: sourceNode.getAttribute("SourceID"),
                    itemType: SourceCode.Forms.DependencyHelper.ReferenceType.Source,
                    itemSystemName: sourceNode.getAttribute("SourceName"),
                    itemDisplayName: sourceNode.getAttribute("SourceDisplayName")
                };
                sourceDataCollection.push(sourceData);

                return sourceDataCollection;
            },

            /**
             * This function will build up the dependency object collection for related View items and the View item itself.
             * 
             * @function
             * 
             * @param {text} viewId Id of view.
             * 
             * @returns List of dependency objects that can be used by the getDependencies
             * 
             */
            getDependencyDataCollectionForView: function (viewInstanceId)
            {
                var dataCollection = [];

                var definitionXML = SourceCode.Forms.Designers.Common.getDefinitionXML();

                if (!checkExists(definitionXML))
                {
                    return [];
                }

                dataCollection = SourceCode.Forms.DependencyHelper.getEventsThatHasOnlyInheritedViewActions(viewInstanceId, definitionXML);

                var viewData =
                {
                    itemId: viewInstanceId,
                    itemType: SourceCode.Forms.DependencyHelper.ReferenceType.View
                };

                dataCollection.push(viewData);

                return dataCollection;
            },

            /**
             * This function will find the details for the old and new sources, and create a collection with items for each
             * source field, containing the field data, source details, new source details (if exists) and control object id if exists.
             * This can be used both for Primary data source (source bound to view) or for External/Association type datasources
             * (sources bound to list controls)
             * 
             * @function
             * 
             * @param {xmlNode} sourceNode The existing source (on which dependencies will be found) xml node from view definition xml
             * 
             * @param {guid} sourceId Id of the smartobject datasource that was bound to the view or control.
             
             * @param {guid} newSourceId (optional) Id of the new smartobject datasource that will now be bound to view
             *(this is necessary so that fields in new SMO that have the same name of old SMO can autoresolve).
             *
             * @param {guid} objectId Id of the list control that smartobject was bound to (only needed if external/associated source type).
             * 
             * @returns List of dependency objects, one item per field of source, that can be used by the getDependencies / findReferences functions
             * 
             */
            _getFieldsDataCollectionForSource: function (sourceNode, sourceId, newSourceId, objectId)
            {
                var fieldsDataCollection = [];

                if (!checkExistsNotEmpty(sourceNode))
                {
                    return [];
                }

                var sourceDetails = this.getDataSourceDetails(sourceId);
                var newSourceDetails = null;
                if (checkExistsNotEmpty(newSourceId))
                {
                    newSourceDetails = this.getDataSourceDetails(newSourceId);
                }

                var hasObjectId = checkExistsNotEmpty(objectId);

                var fieldsList = sourceNode.selectNodes(".//Fields/Field");
                var i = 0;
                var fieldNode = null;
                var fieldData = null;
                for (i = 0; i < fieldsList.length; i++)
                {
                    fieldNode = fieldsList[i];

                    var fieldName = fieldNode.selectSingleNode("FieldName");

                    if (checkExists(fieldName))
                    {
                        fieldName = fieldName.text;
                    }

                    var fieldDisplayName = fieldNode.selectSingleNode("FieldDisplayName");

                    if (checkExists(fieldDisplayName))
                    {
                        fieldDisplayName = fieldDisplayName.text;
                    }

                    fieldData =
                    {
                        itemId: fieldNode.getAttribute("ID"),
                        itemType: SourceCode.Forms.DependencyHelper.ReferenceType.ViewField,
                        itemSystemName: fieldName,
                        itemDisplayName: fieldDisplayName,
                        sourceId: sourceId,
                        sourceDetails: sourceDetails,
                        newSourceDetails: newSourceDetails
                    };

                    if (hasObjectId)
                    {
                        fieldData.contextId = objectId;
                    }

                    fieldsDataCollection.push(fieldData);
                }

                return fieldsDataCollection;
            },


            /**
             * This function will find all dependencies of an Event item and display in a notifier popup.
             * 
             *	Events can have dependencies on other events (execute another event) or on extended subform rule objects.
             *	SubForm/SubView dependencies should be handled in a different way (see User Story 650690)
             *	If event has subform/subview dependencies:
             *	Dependencies on subforms should be listed and user should be warned that they will be removed (no option for keep).
             *	If there were any other dependencies (execute another rule), these dependencies should be kept and badged (but not listed in notifier).
             *	If event has no subform/subview dependencies:
             *	Display normal notifier as usual and let user choose to keep or remove.
             * 
             * @param {dependencyData} dependencyData - Event reference type object 
             * 
             * @returns false if no dependencies are found, true if dependencies are found.
             * 
            */
            hasEventDependencies: function (dependencyData)
            {
                if (!checkExists(dependencyData) ||
                    !checkExistsNotEmpty(dependencyData.definitionId) ||
                    dependencyData.itemType !== SourceCode.Forms.DependencyHelper.ReferenceType.Event)
                {
                    return false;
                }

                var definitionXML = SourceCode.Forms.Designers.Common.getDefinitionXML();
                if (!checkExists(definitionXML))
                {
                    return false;
                }

                var _dependencyHelper = SourceCode.Forms.DependencyHelper;

                _dependencyHelper._ensureDefinitionIsUpToDate(definitionXML);

                var referenceObj =
                {
                    definitionId: dependencyData.definitionId,
                    type: _dependencyHelper.ReferenceType.Event
                };

                var subFormDependencies = $.extend({}, referenceObj);
                var eventDependencies = $.extend({}, referenceObj);
                subFormDependencies.items = [];
                eventDependencies.items = [];

                referenceObj = _dependencyHelper.findReferences(definitionXML, referenceObj);

                if (checkExists(referenceObj) && checkExists(referenceObj.items) && referenceObj.items.length > 0)
                {
                    //Split the dependencies into subform dependencies and other:
                    for (var r = 0; r < referenceObj.items.length; r++)
                    {
                        var refAs = referenceObj.items[r].referenceAs;
                        if (_dependencyHelper.isTypSubFormReference(refAs))
                        {
                            //Get subform dependencies:
                            subFormDependencies.items.push(referenceObj.items[r]);
                        }
                        else
                        {
                            //Get other dependencies:
                            eventDependencies.items.push(referenceObj.items[r]);
                        }
                    }

                    //Notify:
                    var objType = referenceObj.type;
                    var objName = referenceObj.displayName;

                    if (subFormDependencies.items.length === 0)
                    {
                        //Show notifier as usual, with Keep/Remove options
                        var notifierOptions =
                        {
                            references: [eventDependencies],
                            itemName: objName,
                            itemType: objType,
                            removeObjFn: dependencyData.callback
                        };
                        _designers.showDependencyNotifierPopup(notifierOptions);
                    }
                    else
                    {
                        //Only list the subform dependencies, with no option to keep
                        var notifierOptions =
                        {
                            references: [subFormDependencies],
                            itemType: objType,
                            itemName: objName,
                            removeObjFn: dependencyData.callback,
                            showSimpleNotifier: true,
                            //If there are also event dependencies,those dependencies must always be kept
                            referencesToAlwaysKeep: [],
                            removeConfirmationMessage: Resources.MessageBox.SubformRuleDependency
                        };

                        //There are subform dependencies
                        //If there are also event dependencies,those dependencies must always be kept
                        if (eventDependencies.items.length > 0)
                        {
                            notifierOptions.referencesToAlwaysKeep = [eventDependencies];

                        }

                        _designers.showDependencyNotifierPopup(notifierOptions);
                    }

                    return true;
                }

                return false;
            },

            hasStaticSource: function (controlId)
            {
                if (!checkExistsNotEmpty(controlId))
                {
                    return false;
                }

                var definitionXML = SourceCode.Forms.Designers.Common.getDefinitionXML();
                if (!checkExists(definitionXML))
                {
                    return false;
                }

                var staticSourceNode = definitionXML.selectSingleNode(".//Controls/Control[@ID='{0}']/Properties/Property[Name='DataSourceType' and Value='Static']".format(controlId));

                if (checkExists(staticSourceNode))
                {
                    return true;
                }

                return false;
            },

            getDataSourceDetails: function (sourceId)
            {
                var soDetails = null;

                if (!checkExists(this.View))
                {
                    return null;
                }

                if (checkExists(sourceId) && checkExists(this.View.AJAXCall))
                {
                    this.View.AJAXCall._getAssociationSODetails(sourceId);
                }

                if (checkExists(this.View.hiddenAssociationXml))
                {
                    soDetails = this.View.hiddenAssociationXml.selectSingleNode('.//associations/smartobjectroot[@guid="{0}"]'.format(sourceId));
                }

                return soDetails;
            },

            ///<summary>
            ///For a container control (table, column, row, cell, panel) that can contain other controls with dependencies, we have to
            ///add each control with its dependencies seperately to the dependency object collection, in order to keep track of the specific
            ///item removed and its specific dependencies
            ///<param="containerData">Container object that may contain inner controls.
            ///For each control in container control, a new dependencyData object will be created and appended to the collection returned.</param>
            ///<returns>A list of dependency data for the controls contained within the container control</returns>
            ///</summary>
            getControlDataCollectionForContainerControl: function (containerData)
            {
                var controlDataCollection = [];

                if (!checkExists(containerData))
                {
                    return controlDataCollection;
                }

                var containerType = containerData.itemType;

                if (!SourceCode.Forms.DependencyHelper.isTypeContainerControl(containerType))
                {
                    return controlDataCollection;
                }

                var defXml = SourceCode.Forms.Designers.Common.getDefinitionXML();
                var containerId = containerData.itemId;
                var innerControlsCollection = [];
                var xPath = "";
                var refType = SourceCode.Forms.DependencyHelper.ReferenceType;
                //Container controls like cells with their inner controls may be defined more than once on def.xml
                //(e.g. in the case of nested tables), need to keep collection of control IDs to ensure no duplicates
                var controlIds = [];
                var controlNode = null;
                var controlId = "";
                var controlRefObj = null;

                switch (containerType)
                {
                    case refType.Panel:
                        xPath = "//Panels/Panel[@ID='{0}']/Areas/Area/Items/Item/Canvas//Control".format(containerId);
                        break;
                    case refType.Cell:
                        xPath = "//Cells/Cell[@ID='{0}']//Control".format(containerId);
                        break;
                    case refType.Table:
                        xPath = "//Control[@ID='{0}'][@LayoutType='Grid']//Control".format(containerId);
                        break;
                    case refType.Row:
                        xPath = "//Rows/Row[@ID='{0}']//Control".format(containerId);
                        break;
                    case refType.AreaItem:
                        xPath = "//Areas/Area/Items/Item[@ID='{0}']/Canvas//Control".format(containerId);
                        break;
                }

                if (!checkExistsNotEmpty(xPath))
                {
                    return;
                }

                innerControlsCollection = defXml.selectNodes(xPath);

                for (var i = 0; i < innerControlsCollection.length; i++)
                {
                    controlNode = innerControlsCollection[i];
                    controlId = controlNode.getAttribute("ID");
                    //Ensure no duplicate container controls get added
                    if (controlIds.indexOf(controlId) === -1)
                    {
                        controlRefObj =
                        {
                            itemId: controlId,
                            itemType: SourceCode.Forms.DependencyHelper.ReferenceType.Control
                        };

                        controlIds.push(controlId);
                        controlDataCollection.push(controlRefObj);
                    }
                }

                return controlDataCollection;
            },

            //Will return a string like "textbox1 Control" or "param1 View Parameter"
            _getObjectNameString: function (itemType, itemName)
            {
                var type = Resources.DependencyObjects[itemType];
                var name = "<b>{0}</b>".format(type);

                if (checkExistsNotEmpty(itemName))
                {
                    name = "<b>{0}</b> {1}".format(itemName.htmlEncode(), type.htmlEncode());
                }

                return name;
            },

            /**
             * 
             * Method to display popup that notifies user that object being deleted has dependencies.
             * The popup gives the user the choice to remove dependencies or keep dependencies.
             * On accept (OK click), object is deleted and dependencies removed or kept depending on user selection.
             * 
             * @param {object} notifierOptions - information used to define content and display of the popup. Has the following properties:
             * 
             * {list} notifierOptions.references - List of dependency objects (as returned from DependencyHelper.findReferences function)
             * 
             * {DependencyHelper.ReferenceType} notifierOptions.itemType Type of the object being removed e.g. "Control", "ViewParameter"
             * 
             * {text} notifierOptions.itemName Name of the object being removed e.g. "Textbox 1"
             * 
             * {text} notifierOptions.deletedItemDisplayName - Display name of object removed, used for building up popup heading
             * 
             * {text} notifierOptions.deleteItemType - Type of object removed, used for building up poup heading
             * 
             * {function} notifierOptions.removeObjFn Callback function to do removal of item when popup OK is clicked.
             * 
             * {boolean} notifierOptions.showSimpleNotifier - not required, default false. true if confirmation notifier with no keep/remove option should be shown.
             * 
             * {text} notifierOptions.removeConfirmationMessage - not required if not showSimpleNotifier, 
             * message to display for the confirmation notifier, to inform user dependencies will be removed.
             * 
             */
            showDependencyNotifierPopup: function (notifierOptions)
            {
                notifierOptions.deletedItemDisplayName = notifierOptions.deletedItemDisplayName || "";
                notifierOptions.deleteItemType = notifierOptions.deleteItemType || "";
                notifierOptions.itemName = notifierOptions.itemName || notifierOptions.deletedItemDisplayName;
                notifierOptions.itemType = notifierOptions.itemType || notifierOptions.deleteItemType;

                var _this = this;
                var _scalePercentage = 0.5;
                var _documentBody = document.body;
                var elements = null;

                //Create the notifier popup content and set elements visible and selected according to configuration:
                var popupTemplate = $("#DependencyWarningPopup");
                var popupContent = null;
                var templateFound = false;

                if (popupTemplate.length > 0)
                {
                    templateFound = true;
                    popupContent = popupTemplate.clone().prop("hidden", false);
                    var popupId = "DependencyWarningPopup_{0}".format("".generateGuid());
                    popupContent[0].setAttribute("id", popupId);
                    elements = _designers._onShowDependencyNotifierPopup(popupContent, notifierOptions);
                    //Hide the Keep/Remove section
                    if (notifierOptions.showSimpleNotifier && checkExists(elements.footerElement) && checkExists(elements.confirmationElement))
                    {
                        elements.footerElement.addClass("hidden");
                        elements.confirmationElement.removeClass("hidden");
                        elements.confirmationElement.find(".notifier-confirmation-message").text(notifierOptions.removeConfirmationMessage);
                    }

                    var referencedItems = [];
                    for (var i = 0; i < notifierOptions.references.length; i++)
                    {
                        if (notifierOptions.references[i].items.length > 0)
                        {
                            referencedItems = $.merge(referencedItems, notifierOptions.references[i].items);
                        }
                    }
                    _this._populateReferencedItems(referencedItems, popupContent, notifierOptions.initialDisplayDetails);

                    popupContent.find("#rbKeepOrRemoveDependenciesGroup").find("input.input-control").radiobutton();
                    popupContent.find('#rbKeepDependencies').radiobutton("check");
                }
                //Creating a new notification popup so let's clear the notifierContext
                SourceCode.Forms.Designers.Common.notifierContext = {};


                var options =
                {
                    id: "DependencyWarningPopupMessage",
                    headerText: Resources.DependencyHelper.NotifierDependencyHeading,
                    modalize: true,
                    maximizable: true,
                    draggable: true,
                    content: popupContent,
                    width: Math.floor(_documentBody.offsetWidth * _scalePercentage),
                    height: Math.floor(_documentBody.offsetHeight * _scalePercentage),
                    buttons:
                        [
                            {
                                type: "help",
                                click: function () { HelpHelper.runHelp(7080); }
                            },
                            {
                                text: Resources.WizardButtons.OKButtonText,
                                click: function ()
                                {
                                    _this._dependencyNotifierOkClick(options, notifierOptions);
                                }.bind(_this)
                            },
                            {
                                text: Resources.WizardButtons.CancelButtonText,
                                click: function ()
                                {
                                    var popup = jQuery.popupManager.getPopup(options.id);

                                    jQuery.popupManager.closeSpecific(popup);
                                }
                            }
                        ],
                    onShow: function ()
                    {
                        _designers._resizeDependencyNotifierPopupDependenciesList(elements);
                    },
                    onMaximize: function ()
                    {
                        _designers._resizeDependencyNotifierPopupDependenciesList(elements);
                    },
                    onRestore: function ()
                    {
                        _designers._resizeDependencyNotifierPopupDependenciesList(elements);
                    }
                };

                if (!templateFound)
                {
                    //Fallback for message to display in popup if template could not be found
                    //(Because 'keep' is the default choice, the keep message will display)
                    options.content = $("<div id='DependencyWarningPopup' class='no-content'>{0}</div>".format(Resources.DependencyHelper.NotifierChoiceKeepMessage));
                }

                jQuery.popupManager.showPopup(options);
            },

            _onShowDependencyNotifierPopup: function (popup, notifierOptions)
            {
                var nameHtmlEncoded = this._getObjectNameString(notifierOptions.itemType, notifierOptions.itemName);

                //Set the notifier message at the top
                var titleText = Resources.DependencyHelper.NotifierDependencyMessage.format(nameHtmlEncoded);
                var headerElement = popup.find(".notifier-title-message").html(titleText);
                //Set the selection header
                var footerText = popup.find(".notifier-choice-message").text(Resources.DependencyHelper.NotifierChoiceMessage);
                var footerElement = footerText.parent();

                var dependencyNotifierListPanelContainer = popup.find("#DependencyNotifierListPanelContainer");
                if (dependencyNotifierListPanelContainer.length === 0)
                {
                    return null;
                }

                var elements = {
                    dependencyNotifierListPanelContainer: dependencyNotifierListPanelContainer,
                    headerElement: headerElement,
                    footerElement: footerElement,
                    confirmationElement: popup.find(".notifier-confirmation")
                };
                return elements;
            },

            _resizeDependencyNotifierPopupDependenciesList: function (elements)
            {
                if (!checkExists(elements) || !checkExists(elements.dependencyNotifierListPanelContainer) || !checkExists(elements.headerElement))
                {
                    return;
                }

                var footerElementHeight = 0;
                if (checkExists(elements.footerElement))
                {
                    footerElementHeight = elements.footerElement.height();
                }
                var confirmationElementHeight = 0;
                if (checkExists(elements.confirmationElement))
                {
                    confirmationElementHeight = elements.confirmationElement.height();
                }

                var dependencyListPanelContainerStyle = elements.dependencyNotifierListPanelContainer[0].style;

                //Calculate the Height based on the Top and bottom element height and padding
                dependencyListPanelContainerStyle.height = (elements.dependencyNotifierListPanelContainer.parent().height()
                    - (footerElementHeight + confirmationElementHeight + elements.headerElement.height())//Top and bottom elements
                    - (parseInt(elements.headerElement.css('padding-top'), 10) + parseInt(elements.headerElement.css('padding-bottom'), 10) * 2)) + 'px';
            },

            //Note that the unit test for _dependencyNotifierOkClick is covered in describe("SourceCode.Forms.Designers.showDependencyNotifierPopup")
            _dependencyNotifierOkClick: function (popupOptions, notifierOptions)
            {
                var common = SourceCode.Forms.Designers.Common;
                var showSimpleNotifier = notifierOptions.showSimpleNotifier;
                var removeReferences = showSimpleNotifier ? true : false;

                if (checkExists(popupOptions.content) && !showSimpleNotifier)
                {
                    var removeDependenciesRadio = popupOptions.content.find("#rbRemoveDependencies");
                    removeReferences = removeDependenciesRadio.closest("label").hasClass("checked");
                }

                common.notifierContext = this._updateDefinitionXmlForNotifierChanges(notifierOptions, removeReferences);

                //Notifier finished annotation and removal of the items so we can close it
                var popup = popupManager.getPopup(popupOptions.id);

                popupManager.closeSpecific(popup);

                //Call the remove function last as it may need the annotated data when performing removal. 
                //For example a drop down Control that has conditional style that is using the associated smo property,
                //When removing the smo, we need to first annotate the definition xml, then the removal function will 
                //update the property grid xml, remove the associated smo in the property grid xml and then merge the
                //changes into the definition xml.
                notifierOptions.removeObjFn(common.notifierContext);

                common.refreshBadges();
            },

            _updateDefinitionXmlForNotifierChanges: function (notifierOptions, removeReferences)
            {
                var anotatedReferences = [];
                var references = notifierOptions.references;

                if (checkExists(references) && references.length > 0)
                {
                    if (removeReferences)
                    {
                        //User chosen to remove the dependent items, by delete these dependent items, we need to annotate items that are using these delete items
                        anotatedReferences = this.removeDependentItemsAndAnnotateDependencies(references);
                    }
                    else
                    {
                        //User chosen to keep the dependent items, thus we need to annotate on these dependent items
                        anotatedReferences = this.annotateDependentItems(references);
                    }
                }

                if (checkExists(notifierOptions.referencesToAlwaysKeep) && notifierOptions.referencesToAlwaysKeep.length > 0)
                {
                    var additionalItems = this.annotateDependentItems(notifierOptions.referencesToAlwaysKeep);
                    anotatedReferences = anotatedReferences.concat(additionalItems);
                }

                // Update the reporter's model (data)
                SourceCode.Forms.Designers.Common.updateDependencyReporterModel(anotatedReferences);

                var notifierContext =
                {
                    annotatedReferences: anotatedReferences,
                    keepReferences: !removeReferences
                };

                return notifierContext;
            },

            _populateReferencedItems: function (referencedItems, popupElement, initialDisplayDetails)
            {
                var displayDetails = SourceCode.Forms.DependencyHelper.getReferencedItemsDisplayDetails(referencedItems, initialDisplayDetails);
                return this._populateReferencedItemsFromDisplayItems(displayDetails, popupElement);
            },

            _populateReferencedItemsFromDisplayItems: function (displayDetails, popupElement)
            {
                var items = "";
                var heading = "";
                var expanderSections = '<div class="section-expander expanded"></div><div class="section-specifier"></div>';
                var dependencyContentHtml = "";
                var listGroup = null;
                var ruleDescription = "Temp placeholder";
                var duplicateCounter = 1;
                //Ensure popup is cleared:
                popupElement.find("#DependencyNotifierDependencyContainer").empty();

                for (var d = 0; d < displayDetails.length; d++)
                {
                    var dItem = displayDetails[d];
                    var isEventType = dItem.type === "Event";
                    var listContainer = "";
                    //Events will be grouped by event name
                    var headingString = isEventType ? dItem.title : dItem.displayType;

                    //Insert area as collapsible section:
                    if (heading !== headingString)
                    {
                        var listHeading = '<span class="categorySectionsHeading">{0}</span>'.format(headingString);
                        var list = '<ul id="DepNotList_{0}"></ul>'.format(d);
                        listContainer = '<div id="DepNotListContainer_{0}" class="categorySectionsList">{1}{2}{3}</div>'
                            .format(d, listHeading, list, expanderSections);
                        popupElement.find("#DependencyNotifierDependencyContainer").append($(listContainer));
                        heading = headingString;
                        listGroup = popupElement.find("#DepNotList_{0}".format(d));
                    }

                    var listItem = "";
                    //Description name will be the control name that is using the dependency
                    //(e.g. Conditional style used by Text Box)
                    var descName = "";
                    if (checkExistsNotEmpty(dItem.descriptionName) && dItem.descriptionName !== dItem.description)
                    {
                        descName = "<b>{0} </b>".format(dItem.descriptionName);
                    }

                    var referencedAsText = "";
                    if (dItem.description !== dItem.displayType)
                    {
                        referencedAsText = "{0}{1} - ".format(descName, dItem.description);
                    }
                    var subType = "";
                    if (checkExistsNotEmpty(dItem.subTitle))
                    {
                        subType = ' <span class="dep-notifier-subtype">{0}</span>'.format(dItem.subTitle);
                    }

                    var listItem = "<li><i class=\"ico {0}\"></i><span>{1}<b>{2}</b>{3}</span></li>".format(
                        dItem.icon, referencedAsText, dItem.title, subType);

                    // Only add if last of duplicate dependencies
                    var isLastDuplicate = false;
                    if (d < displayDetails.length - 1)
                    {
                        var nextItem = displayDetails[d + 1];
                        if (checkExists(nextItem) && nextItem.type === dItem.type &&
                            nextItem.description === dItem.description && nextItem.title === dItem.title)
                        {
                            ++duplicateCounter;
                        }
                        else
                        {
                            isLastDuplicate = true;
                        }
                    }
                    else
                    {
                        isLastDuplicate = true;
                    }
                    if (isLastDuplicate)
                    {
                        // Dependency that has duplicates, will have count of duplicates at end of item
                        var countStr = "";
                        if (duplicateCounter > 1)
                        {
                            countStr = " ({0})".format(duplicateCounter);
                        }

                        var listItem = "<li><i class=\"ico {0}\"></i><span>{1}<b>{2}</b>{3}{4}</span></li>".format(
                            dItem.icon, referencedAsText, dItem.title, subType, countStr);


                        if (isEventType)
                        {
                            listItem = "<li><i class=\"ico {0}\"></i><span>{1}{2}{3}</span></li>".format(
                                dItem.icon, dItem.description, subType, countStr);
                        }

                        duplicateCounter = 1;
                        listGroup.append(listItem);
                    }
                }

                //Collapse and expand events:
                popupElement.find(".section-expander").on("click.expanders", function ()
                {
                    var expander = $(this);
                    if (expander.hasClass("expanded"))
                    {
                        expander.removeClass("expanded");
                        expander.addClass("collapsed");
                        expander.closest(".categorySectionsList").find("ul").hide();
                    }
                    else
                    {
                        expander.removeClass("collapsed");
                        expander.addClass("expanded");
                        expander.closest(".categorySectionsList").find("ul").show();
                    }
                });
            },

            checkControlNameUnique: function (id, name, haystack)
            {
                var result = true;

                var names = haystack.selectNodes("//Control[@ID!='" + id + "']/Properties/Property[Name='ControlName']/Value");

                if (names.length === 0) return true;

                for (var i = 0, l = names.length; i < l; i++)
                {
                    if (names[i].text.toLowerCase() === name.toLowerCase())
                    {
                        return false;
                    }
                }

                return result;
            },

            generateUniqueControlName: function (id, prefix, controltype, haystack)
            {
                var result = "";
                var friendlyname = this.controlDefaultNames[controltype];

                if (!checkExists(friendlyname))
                {
                    friendlyname = SourceCode.Forms.Designers.Common.getControlDefinitionXml().selectSingleNode("Controls/Control[Name='" + controltype + "']/FriendlyName").text;
                    this.controlDefaultNames[controltype] = friendlyname;
                }

                var controlCurrentName = null;

                result = (prefix === null || prefix === "") ? friendlyname : prefix + " " + friendlyname;

                var basename = result, counter = 0;

                if (typeof this.controlDefaultNameLastCounter[basename] === "number")
                {
                    counter = this.controlDefaultNameLastCounter[basename] + 1;
                    result = basename + counter;
                }

                if (this.controlDefaultNameLastCounterTimeoutHandle)
                {
                    clearTimeout(this.controlDefaultNameLastCounterTimeoutHandle);
                }

                var self = this;

                this.controlDefaultNameLastCounterTimeoutHandle = setTimeout(function clearCounterCache()
                {
                    self.controlDefaultNameLastCounter = {};
                }, 0);

                while (!_designers.checkControlNameUnique(id, result, haystack))
                {
                    counter++;
                    result = basename + counter;
                }

                this.controlDefaultNameLastCounter[basename] = counter;

                return result;
            },

            /**
            * To ensure that control's datasource dependencies are not displayed in notifier,
            * they will be removed before sent to the notifier.
            * This function receives a list of control dependencies, identifies dependencies that are under the 
            * event 'Populate list control with data' and remove them.
            * 
            * @param {Array} referencedItems - Collection of control dependencies
            * 
            * @returns - Filtered collection with datasource dependencies removed
            *
            */
            _filterOutControlDataSourceDependencies: function (referencedItems, deletedListControlId)
            {
                var i = 0;
                var actionNode = null;
                var controlProp = null;
                var methodProp = null;
                var objectProp = null;
                var filteredRefItems = [];
                var isDataSourceDependency = false;

                for (i = 0; i < referencedItems.length; i++)
                {
                    //Identify if event is a "Populate list control with data" event
                    actionNode = null;
                    isDataSourceDependency = false;
                    var itemObj = referencedItems[i];
                    var refAs = itemObj.referenceAs;

                    if (checkExists(itemObj.item) && checkExists(itemObj.item.xmlNode))
                    {
                        switch (refAs)
                        {
                            case SourceCode.Forms.DependencyHelper.ReferenceAs.EventSource:
                                isDataSourceDependency = this._isEventOnlyHasDataSourceActions(itemObj.item.xmlNode, deletedListControlId);
                                break;
                            case SourceCode.Forms.DependencyHelper.ReferenceAs.ActionControl:
                                actionNode = itemObj.item.xmlNode;
                                break;
                            case SourceCode.Forms.DependencyHelper.ReferenceAs.ResultMappingTarget:
                            case SourceCode.Forms.DependencyHelper.ReferenceAs.ParameterMappingSource:
                                actionNode = itemObj.item.xmlNode.selectSingleNode("./ancestor::Action");
                                break;
                            default:
                                actionNode = null;
                                break;
                        }

                        if (checkExists(actionNode))
                        {
                            //The control that has the 'Populate list control control with data' action, should be same control that is being deleted
                            controlProp = actionNode.selectSingleNode("Properties/Property[Name='ControlID'][Value='{0}']".format(deletedListControlId));
                            if (checkExists(controlProp))
                            {
                                methodProp = actionNode.selectSingleNode("Properties/Property[Name='Method']");
                                if (checkExists(methodProp))
                                {
                                    objectProp = actionNode.selectSingleNode("Properties/Property[Name='ObjectID']");
                                    if (checkExists(objectProp))
                                    {
                                        //This is a 'Populate list control with data' event
                                        isDataSourceDependency = true;
                                    }
                                }
                            }
                        }
                    }

                    if (!isDataSourceDependency)
                    {
                        filteredRefItems.push(itemObj);
                    }
                }

                return filteredRefItems;
            },

            /**
            * To filter out some Source dependencies that are not not necessary to be displayed in notifier, they will be removed before sent to the notifier.
            * Typically these dependencies are dependencies that user can not modify or is a dependency that will be removed anyways.
            * Bug 681620 provides an example dependency that should be filtered out
            * 
            * @param {Array} referencedItems - Collection of Source dependencies
            * 
            * @returns - Filtered collection with unnecessary dependencies been removed
            *
            */
            _filterOutUnnecessarySourceDependencies: function (referencedItems, deletedSourceId)
            {
                var i = 0;
                var actionNode = null;
                var filteredRefItems = [];
                var shouldFilterOut = false;
                var itemObj = null;
                var refAs = null;

                for (i = 0; i < referencedItems.length; i++)
                {
                    actionNode = null;
                    shouldFilterOut = false;

                    itemObj = referencedItems[i];
                    refAs = itemObj.referenceAs;

                    if (checkExists(itemObj.item) && checkExists(itemObj.item.xmlNode))
                    {
                        switch (refAs)
                        {
                            case SourceCode.Forms.DependencyHelper.ReferenceAs.ResultMappingSource:
                                var resultNode = itemObj.item.xmlNode;

                                if (resultNode.getAttribute("SourceType") === "Result" && resultNode.getAttribute("SourceID") === deletedSourceId)
                                {
                                    actionNode = resultNode.selectSingleNode("./ancestor::Action");

                                    if (checkExists(actionNode) && actionNode.getAttribute("Type") === "Execute")
                                    {
                                        var xpath = "Properties/Property[Name='ObjectID' and Value='{0}']".format(deletedSourceId);

                                        var propertyNode = actionNode.selectSingleNode(xpath);

                                        if (checkExists(propertyNode))
                                        {
                                            shouldFilterOut = true;
                                        }
                                    }
                                }
                                break;
                            default:
                                shouldFilterOut = false;
                                break;
                        }
                    }

                    if (shouldFilterOut === false)
                    {
                        filteredRefItems.push(itemObj);
                    }
                }

                return filteredRefItems;
            },

            _isEventOnlyHasDataSourceActions: function (eventNode, controlId)
            {
                if (!checkExists(eventNode))
                {
                    return false;
                }

                var actionNodes = eventNode.selectNodes(".//Action");

                var xpath = ".//Action[Properties/Property[Name='ControlID' and Value='{0}'] and Properties/Property[Name='ObjectID'] and Properties/Property[Name='Method']]".format(controlId);

                var dataSourceActionNodes = eventNode.selectNodes(xpath);

                if (actionNodes.length === dataSourceActionNodes.length)
                {
                    return true;
                }

                return false;
            },

            setDesignProperty: function (node, propertyName, propertyValue)
            {
                var doc = node.ownerDocument;
                var propertiesNode = node.selectSingleNode("DesignProperties");

                if (!checkExists(propertiesNode)) propertiesNode = node.appendChild(doc.createElement("DesignProperties"));

                var propertyNode = propertiesNode.selectSingleNode("Property[Name='" + propertyName + "']");

                if (!checkExists(propertyNode))
                {
                    propertyNode = propertiesNode.appendChild(doc.createElement("Property"));
                    propertyNode.appendChild(doc.createElement("Name")).appendChild(doc.createTextNode(propertyName));
                }

                var propertyValueNode = propertyNode.selectSingleNode("Value");

                if (checkExists(propertyValueNode)) propertyNode.removeChild(propertyValueNode);

                propertyNode.appendChild(doc.createElement("Value")).appendChild(doc.createTextNode(propertyValue));
            },

            validateControlName: function (target, xmlDocument)
            {
                var controlID = target.data("controlid");
                var newValue = target.val();
                var controlNode = xmlDocument.selectSingleNode("//Controls/Control[@ID='" + controlID + "']");
                var controlType = controlNode.getAttribute("Type");

                if (typeof newValue === "string")
                {
                    newValue = _designers._escapeMetadataString(newValue);
                }
                var duplicateViewNames;
                var duplicateFormNames;

                var duplicateNameItem = xmlDocument.selectSingleNode("//Controls/Control[@ID!='" + controlID + "' and (@Type !='View' or Type !='Form')]/Properties/Property[Name='ControlName']/Value[.='" + newValue + "']");
                var duplicateViewNameElement = xmlDocument.selectSingleNode("//Views/View/Name");
                var duplicateViewDisplayNameElement = xmlDocument.selectSingleNode("//Views/View/DisplayName");
                var duplicateFormNameElement = xmlDocument.selectSingleNode("//Forms/Form/Name");
                var duplicateFormDisplayNameElement = xmlDocument.selectSingleNode("//Forms/Form/DisplayName");

                if (checkExists(duplicateViewNameElement))
                {
                    duplicateViewNames = duplicateViewNameElement.text === newValue || duplicateViewDisplayNameElement.text === newValue;
                }
                else if (checkExists(duplicateFormNameElement))
                {
                    duplicateFormNames = duplicateFormNameElement.text === newValue || duplicateFormDisplayNameElement.text === newValue;
                }

                if ($chk(duplicateFormNames))
                {
                    return Resources.Designers.DuplicateFormNameExistsMsg;
                }
                else if ($chk(duplicateViewNames) && (controlType !== "View"))
                {
                    return Resources.Designers.DuplicateViewNameExistsMsg;
                }
                else if ($chk(duplicateNameItem))
                {
                    return Resources.Designers.DuplicateControlNameExistsMsg;
                }
                else if (controlType === "View" && newValue !== duplicateViewNameElement.text)
                {
                    return _designers._validateViewName(newValue);
                }
                else
                {
                    return "";
                }
            },

            _validateViewName: function (newName)
            {
                var category = $("#ViewDesignerCategoryLookup").categorylookup("value");
                var categoryId = category.catid;

                var o = {};
                o.dataType = "view";
                o.method = "isDisplayNameUniqueInCategoryForDataType";
                o.categoryId = categoryId;
                o.displayNames = newName;

                var options =
                {
                    cache: false,
                    async: false,
                    data: $.param(o),
                    dataType: "text",
                    url: "Utilities/AJAXCall.ashx",
                    type: "POST"
                };

                var errorMsg = _designers.View._checkViewName(options, true);
                var returnXML = parseXML(errorMsg).selectSingleNode("result");
                var result = returnXML.selectSingleNode("success") !== null;

                if (result)
                {
                    return "";
                }
                else
                {
                    return errorMsg;
                }
            },

            _escapeMetadataString: function (s)
            {

                s = s.replace(new RegExp("\'", "g"), "&apos;");
                s = s.replace(new RegExp("\"", "g"), "&quot;");
                return s;
            },

            validateConditions: function (doc)
            {

                var FaultyConditions = doc.selectNodes("//Condition[name(..)!='ConditionalStyle'][DesignProperties/Property[Name='Invalid'][translate(Value, 'TRUEFALS', 'truefals')='true']");

                if (FaultyConditions.length)
                {
                    var Rule = FaultyConditions[0].selectSingleNode("./ancestor::Event[@Type='User']");
                    var RuleName = Rule.selectSingleNode("Properties/Property[Name='RuleFriendlyName']/Value").text;
                    var RuleLocation = Rule.selectSingleNode("Properties/Property[Name='Location']/Value").text;

                    popupManager.showError(Resources.Designers.InvalidRuleCondition.replace("{0}", RuleName).replace("{1}", RuleLocation));

                    return false;
                }

                return true;

            },

            validateConditionalStyles: function (doc)
            {
                var FaultyStyles = doc.selectNodes("//ConditionalStyle[Condition[@Resolved]]");

                if (FaultyStyles.length)
                {
                    var FaultyStylesName = FaultyStyles[0].selectSingleNode("Name").text;
                    var BoundControl = FaultyStyles[0].selectSingleNode("./ancestor::Control");
                    var BoundControlName = BoundControl.selectSingleNode("Name").text;

                    popupManager.showError(Resources.Designers.InvalidControlConditionalStyle.replace("{0}", FaultyStylesName).replace("{1}", BoundControlName));

                    return false;
                }

                return true;
            },

            validateExpressions: function (doc)
            {
                var FaultyExpressions = doc.selectNodes("//Expressions/Expression[@Resolved]");

                if (FaultyExpressions.length)
                {
                    var FaultyExpressionID = FaultyExpressions[0].getAttribute("ID");
                    var FaultyExpressionName = FaultyExpressions[0].selectSingleNode("Name").text;
                    var BoundControl = doc.selectSingleNode("//Controls/Control[@ExpressionID='" + FaultyExpressionID + "']");
                    var BoundControlName = checkExists(BoundControl) ? BoundControl.selectSingleNode("Name").text : "";

                    var msg = "";

                    if (checkExists(BoundControl))
                    {
                        msg = Resources.ExpressionBuilder.ValidationExpressionUnresolvedEntity.replace("{0}", FaultyExpressionName).replace("{1}", BoundControlName);
                    }
                    else
                    {
                        msg = Resources.ExpressionBuilder.ValidationExpressionUnresolvedEntityNoBoundControl.replace("{0}", FaultyExpressionName);
                    }

                    popupManager.showError(msg);

                    return false;
                }

                // Check for circular references
                var BoundControls = doc.selectNodes("//Controls/Control[@ExpressionID]");

                for (var i = 0, l = BoundControls.length; i < l; i++)
                {
                    var ExpressionItems = doc.selectNodes("//Expressions/Expression[@ID='" + BoundControls[i].getAttribute("ExpressionID") + "']//Item[@SourceType='Control'][@SourceID='" + BoundControls[i].getAttribute("ID") + "']");

                    if (ExpressionItems.length > 0)
                    {
                        var FaultyExpressionName = doc.selectSingleNode("//Expressions/Expression[@ID='" + BoundControls[i].getAttribute("ExpressionID") + "']/Name").text;
                        var BoundControlName = BoundControls[i].selectSingleNode("Name").text;
                        popupManager.showError(Resources.ExpressionBuilder.ValidationCircularReferenceFound.replace("{0}", FaultyExpressionName).replace("{1}", BoundControlName));

                        return false;
                    }
                }

                return true;
            },


            //moved implementation to Table Helper
            generateTableArray: function (table)
            {
                return SourceCode.Forms.TableHelper.generateTableArray(table);
            },

            //moved implementation to Table Helper
            updateTableArray: function (table, tableArray)
            {
                return SourceCode.Forms.TableHelper.updateTableArray(table, tableArray);
            },

            //moved implementation to Table Helper
            _validateArray: function (tableArray, errorLocation)
            {
                return SourceCode.Forms.TableHelper.validateArray(tableArray, errorLocation);
            },

            //moved implementation to Table Helper
            getTableArrayColumnIndex: function (tableArray, cell)
            {
                return SourceCode.Forms.TableHelper.getTableArrayColumnIndex(tableArray, cell);
            },

            //moved implementation to Table Helper
            canMerge: function (tableArray, cellToMergeFrom, direction)
            {
                return SourceCode.Forms.TableHelper.canMerge(tableArray, cellToMergeFrom, direction);
            },

            //moved implementation to Table Helper
            removeColumn: function (tableArray, selectedCell)
            {
                return SourceCode.Forms.TableHelper.removeColumn(tableArray, selectedCell);
            },

            //moved implementation to Table Helper
            _getCellsForColumn: function (tableArray, columnIndex, returnCell)
            {
                return SourceCode.Forms.TableHelper.getCellsForColumn(tableArray, columnIndex, returnCell);
            },

            //moved implementation to Table Helper
            _reduceRowWithoutReferences: function (tableArray, rowIndex)
            {
                return SourceCode.Forms.TableHelper.reduceRowWithoutReferences(tableArray, rowIndex);
            },

            //moved implementation to Table Helper
            _reduceRowWithReferences: function (tableArray, rowIndex, returnCell)
            {
                return SourceCode.Forms.TableHelper.reduceRowWithReferences(tableArray, rowIndex, returnCell);
            },

            //moved implementation to Table Helper
            _getCellFromId: function (tableArray, reference)
            {
                return SourceCode.Forms.TableHelper.getCellFromId(tableArray, reference);
            },


            displayColumnProperty: function (context)
            {
                if (context.propertyId === "Width")
                {
                    return true;
                }

                var flag = false;

                if (context.designerType === "view" && context.designer._getViewType() === "CaptureList")
                {
                    flag = true;


                    var common = SourceCode.Forms.Designers.Common;
                    if (common.isTableControl(common.getEditorTableFromSelectedObject()))
                    {
                        flag = false;
                    }
                }

                return flag;
            },

            //This function is called when user selects a Table column to get the width
            getColumnWidth: function (wrapper)
            {
                //check if a list view cell is selected
                var jq_cell = _designers._getSelectedTableCell();
                if (_designers.isListTableCell(jq_cell))
                {
                    //this must be a list view use the legacy % only code
                    return _designers.getCellWidth(wrapper);
                }

                var jqColSelector = $(".columnSelector.selected");
                var jqCol = $("#{0}".format(jqColSelector.data("columnId")));

                var width = _designers.formatColumnWidth(jqCol.data("width"));

                if (checkExists(wrapper) && wrapper.length === 1)
                {
                    //If user entered an invalid width, we show an error popup.  After clicking OK on the popup we would like to revert to previuos value. 
                    wrapper.data("revert", width);
                }

                return width;
            },

            //This function is called when user set the width of the selected table column in the property grid
            setColumnWidth: function (wrapper, width, controlXmlText)
            {
                //check if a list view cell is selected
                var jq_cell = _designers._getSelectedTableCell();
                if (_designers.isListTableCell(jq_cell))
                {
                    width = _designers.ensureColumnWidthUnit(width, "%");
                    width = _designers.formatColumnWidth(width);

                    //this must be a list view use the legacy % only code
                    return _designers.setCellWidth(wrapper, width, controlXmlText);
                }

                var jqColSelector = $(".columnSelector.selected");
                var jqCol = $("#{0}".format(jqColSelector.data("columnId")));

                width = _designers.ensureColumnWidthUnit(width, "px");
                width = _designers.formatColumnWidth(width);

                //Get the assoicated table of the currently selected table resize widget
                var jqTable = SourceCode.Forms.Designers.Common.getColumnResizeInstance().getTable();

                jqCol.data("width", width);

                SourceCode.Forms.TableHelper.setColumnWidth(width, jqCol.index(), jqTable);

                if (SourceCode.Forms.Designers.View && SourceCode.Forms.Designers.View.DesignerTable)
                {
                    SourceCode.Forms.Designers.View.DesignerTable.normalizeTable(jqTable);

                    SourceCode.Forms.Designers.Common.triggerEvent("TableColumnSizeChanged");
                }
            },

            formatColumnWidth: function (widthText)
            {
                var formattedWidth = "";

                if (this.isDimensionAuto(widthText))
                {
                    return formattedWidth;
                }

                //remove all white spaces
                widthText = widthText.strip();
                //ensure lower case
                widthText = widthText.toLowerCase();

                var unit = widthText.indexOf('%') === -1 ? 'px' : '%';
                var value = widthText.toLowerCase().replaceAll('px', '').replaceAll('%', '');

                value = parseFloat(value);

                if (!isNaN(value))
                {
                    formattedWidth = value.toFixed(2) + unit;
                }

                formattedWidth = formattedWidth.replace(".00", ""); //Remove zeros in the decimals

                return formattedWidth;
            },

            isListTableCell: function (jq_cell)
            {
                if (!checkExists(jq_cell))
                {
                    return false;
                }

                if (jq_cell.length !== 1)
                {
                    return false;
                }

                var jq_table = null;
                var isListTable = false;

                jq_table = jq_cell.closest("div.controlwrapper");
                isListTable = _designers._isListTable(jq_table);

                return true;
            },

            ensureColumnWidthUnit: function (widthText, defaultUnit)
            {
                //remove all white spaces
                widthText = widthText.strip();
                //ensure lower case
                widthText = widthText.toLowerCase();

                if (!checkExists(defaultUnit))
                {
                    //default to px
                    defaultUnit = "px";
                }

                //Check if the width has a unit type
                if (widthText !== "" && widthText.indexOf("px") < 0 && widthText.indexOf("%") < 0)
                {
                    widthText += defaultUnit;
                }

                return widthText;
            },

            //DesignerValidate function that is defined in Form.inject.sql
            validateColumnWidth: function (target, xmlDocument)
            {
                var errorText = "";
                var widthText = target.val();

                //check if a list view cell is selected
                var jq_cell = _designers._getSelectedTableCell();
                if (_designers.isListTableCell(jq_cell))
                {
                    widthText = _designers.ensureColumnWidthUnit(widthText, "%");
                    errorText = _designers.validateColumnWidthForListTable(widthText);
                }
                else 
                {
                    widthText = _designers.ensureColumnWidthUnit(widthText, "px");
                    errorText = _designers.validateColumnWidthForTableControl(widthText);
                }

                if (errorText === "")
                {
                    //Writes back the width text to the target so the spaces are stripped
                    target.val(_designers.formatColumnWidth(widthText));
                }

                return errorText;
            },

            validateColumnWidthForTableControl: function (width)
            {
                //validate for empty, 0% to 100%, 0px to 9999px (up to 2 decimal places)
                var regEx = /^$|^\s*(([0-9]{1}|([1-9][0-9]){1}){1}(\.\d{1,9})?|100(\.0{1,2}){0,1})\s*(%)?$|^\d{1,4}(\.\d{1,9})?\s*(px)$/;
                var message = "";

                if (!regEx.test(width)) 
                {
                    message = Resources.ControlProperties.InvalidWidthForMixedUnits;
                }

                return message;
            },

            validateColumnWidthForListTable: function (width) 
            {
                //validate for 1% to 100%
                var regEx = /^\s*(([1-9]{1}|([1-9][0-9]){1}){1}(\.\d{1,2})?|100(\.0{1,2}){0,1})\s*(%)?$/;
                var message = "";

                if (!regEx.test(width)) 
                {
                    message = Resources.ControlProperties.InvalidWidthPercentage;
                }

                return message;
            },

            getWidthUnitData: function (widthText)
            {
                var unit =
                {
                    value: 0,
                    type: ""
                };

                if (this.isDimensionAuto(widthText))
                {
                    return unit;
                }

                unit.type = widthText.indexOf('%') === -1 ? 'px' : '%';
                unit.value = widthText.toLowerCase().replaceAll('px', '').replaceAll('%', '');
                unit.value = Number(unit.value);

                return unit;
            },

            isDimensionAuto: function (widthText)
            {
                if (!checkExists(widthText) ||
                    widthText === "" ||
                    widthText.toLowerCase() === "auto" ||
                    widthText === "1fr") //1fr acts as auto for grid
                {
                    return true;
                }

                return false;
            },

            //This function is called when user selects a Table cell to get the width
            getCellWidth: function (wrapper)
            {
                var jq_cell = _designers._getSelectedTableCell();

                if (!checkExists(jq_cell) && jq_cell.length !== 1)
                {
                    return;
                }

                var width = _designers._getCellTotalColumnWidth(jq_cell) + "%";

                if (checkExists(wrapper) && wrapper.length === 1)
                {
                    //If user entered an invalid width, we show an error popup.  After clicking OK on the popup we would like to revert to previuos value. 
                    wrapper.data("revert", width);
                }

                return width;
            },

            //This function is called when user set the width of the selected table cell in the property grid
            setCellWidth: function (wrapper, width, controlXmlText)
            {
                var jq_cell = _designers._getSelectedTableCell().first();

                if (!checkExists(jq_cell) || jq_cell.length === 0)
                {
                    return;
                }

                var jq_table = jq_cell.closest("table");
                var tableColumns = jq_table.find(">.editor-body-colgroup>col");
                var tableCells = jq_cell.closest("tr").children();
                var minWidth = 2; //minimum allowed width in percentage
                var maxWidth = 98; //maximum allowed width in percentage

                if (tableColumns.length < 2)
                {
                    //User won't be able to change width of one column
                    _designers._refreshPropertyGrid(jq_cell);
                    return;
                }

                var userEnteredWidth = parseFloat(width.replace(/\% ?/g, ""), 10);

                if (userEnteredWidth < minWidth)
                {
                    userEnteredWidth = minWidth;
                }
                else if (userEnteredWidth > maxWidth)
                {
                    userEnteredWidth = maxWidth;
                }

                var colFirstIndex = _designers._getCellFirstColumnIndex(jq_cell);
                var colLastIndex = colFirstIndex + jq_cell.prop("colSpan") - 1;


                var jq_col1 = null;
                var jq_col2 = null;

                if (jq_cell.index() === tableCells.length - 1)
                {
                    //Last Cell is selected

                    //Column1 is the first column of the currently selected Cell
                    jq_col1 = tableColumns.eq(colFirstIndex);

                    //Column2 is the column to the left of column1
                    jq_col2 = tableColumns.eq(colFirstIndex - 1);
                }
                else
                {
                    //Column1 is the last column of the currently selected Cell
                    jq_col1 = tableColumns.eq(colLastIndex);

                    //Column2 is the column next to Column1 on the right
                    jq_col2 = tableColumns.eq(colLastIndex + 1);
                }

                var jq_col1WidthData = _designers.getWidthUnitData(jq_col1.data("width"));
                var jq_col2WidthData = _designers.getWidthUnitData(jq_col2.data("width"));

                //Maximum width between 2 columns, the new total width of the 2 columns can not exceed this width
                var maxWidth = jq_col1WidthData.value + jq_col2WidthData.value;

                //deltaWidth is the change of width of cell
                var deltaWidth = userEnteredWidth - _designers._getCellTotalColumnWidth(jq_cell);

                //Width1 is the new width for Column1 
                var newWidth1 = jq_col1WidthData.value + deltaWidth;
                //Width2 is the new width for Column2
                var newWidth2 = 0;

                if (deltaWidth < 0 && Math.abs(deltaWidth) >= jq_col1WidthData.value)
                {
                    //We would like to decrease the width of the selected cell and increase the width of the cell next to it
                    //If the width of the selected cell is decreased too much, set the width of the column1 to minWidth
                    newWidth1 = minWidth;
                }
                else if (deltaWidth > 0 && Math.abs(deltaWidth) >= jq_col2WidthData.value)
                {
                    //We would like to increase the width of the selected cell and decrease the width of the cell next to it
                    //If the width of the selected cell is increased too much, set the width of the column1 to maxWidth - minWidth
                    newWidth1 = maxWidth - minWidth;
                }

                //Get the sum of the total width of other columns 
                var otherColumnWidthTotal = 0;
                for (var i = 0; i < tableColumns.length; i++)
                {
                    if (i !== jq_col1.index() && i !== jq_col2.index())
                    {
                        //Get the configured width of the column, the width has unit e.g. 20px or 20%
                        var widthText = tableColumns.eq(i).data("width");
                        var widthData = _designers.getWidthUnitData(widthText);

                        otherColumnWidthTotal += widthData.value;
                    }
                }

                //Column2 takes up the rest of the width for the table
                newWidth2 = 100 - otherColumnWidthTotal - newWidth1;

                if (newWidth2 < minWidth)
                {
                    newWidth2 = minWidth;
                    newWidth1 = 100 - otherColumnWidthTotal - minWidth;
                }

                newWidth1 = _designers.formatColumnWidth(newWidth1 + "%");
                newWidth2 = _designers.formatColumnWidth(newWidth2 + "%");

                //Set column width
                jq_col1.width(newWidth1);
                jq_col2.width(newWidth2);

                //Set configured width
                jq_col1.data("width", newWidth1);
                jq_col2.data("width", newWidth2);

                //Update the dragColumn positions
                if (SourceCode.Forms.Designers.View && SourceCode.Forms.Designers.View.DesignerTable)
                {
                    SourceCode.Forms.Designers.View.DesignerTable._positionHandlers();
                }

                _designers._refreshPropertyGrid(jq_cell);
            },

            _refreshPropertyGrid: function (jq_cell)
            {
                if (!checkExists(jq_cell) && jq_cell.length !== 1)
                {
                    return;
                }

                if (SourceCode.Forms.Designers.Common.Context === SourceCode.Forms.Designers.Common.View && checkExists(SourceCode.Forms.Designers.View.PropertyGrid))
                {
                    SourceCode.Forms.Designers.View.PropertyGrid.refresh();

                    if (SourceCode.Forms.Designers.View.SelectedViewType === 'CaptureList')
                    {
                        if (SourceCode.Forms.Designers.View.selectedOptions.EnableListEditing)
                        {
                            SourceCode.Forms.Designers.View.DesignerTable._synchronizeEditableColumns();
                        }

                        var jq_table = jq_cell.closest("div.controlwrapper");

                        // Applying the column overlay over the current selected column
                        if (jq_cell !== null && jq_cell.is(":not(.editor-canvas)") && _designers._isListTable(jq_table))
                        {
                            $("div.column-selected-overlay").remove();
                            SourceCode.Forms.Designers.View.DesignerTable._setupColumnOverlay(jq_cell);
                        }
                    }
                }
                else if (SourceCode.Forms.Designers.Common.Context === SourceCode.Forms.Designers.Common.Form)
                {
                    SourceCode.Forms.Designers.Common.Context.refreshSelectedControlProperties();
                }
            },

            _isListTable: function (jq_table)
            {
                if (!checkExists(jq_table) && jq_table.length !== 1)
                {
                    return false;
                }

                if (jq_table.attr("controltype") === "ListTable" || jq_table.attr("layout") === "ListTable")
                {
                    return true;
                }

                return false;
            },

            _getSelectedTableCell: function ()
            {
                var jqCell = null;
                if (SourceCode.Forms.Designers.Common.Context === SourceCode.Forms.Designers.Common.View)
                {
                    jqCell = $(".editor-table").find(".editor-cell.selectedobject");
                }
                else
                {
                    jqCell = $(".form-control.table-control").find(".editor-cell.selected");
                }

                return jqCell;
            },

            //A Table Cell may span into multiple columns, this function returns the first column index of the cell
            _getCellFirstColumnIndex: function (jq_cell)
            {
                if (!checkExists(jq_cell) && jq_cell.length > 0)
                {
                    return 0;
                }

                var jq_table = jq_cell.closest("table");
                var dragColumnWrapperId = jq_table[0].id + "_columnResizeWrapperDiv";
                var dragColumns = $("#" + dragColumnWrapperId).find(".drag-column");

                var i = 0;
                var colSpan = parseInt(jq_cell.eq(i).prop("colSpan"), 10);
                var colIndex = 0;  //Index that indicate the first column of the selected cell
                var delta = 0;
                var deltaMin = 100;
                var deltaArray = [];

                //Find the first column index by using the drag column position
                //The cell's left position should be almost the same as the corrosponding drag column's left position
                //The last dragColumn is a temproary column created for dragging thus can ignore it
                for (i = 0; i < dragColumns.length - 1; i++)
                {
                    delta = Math.abs(jq_cell.position().left - dragColumns.eq(i).position().left);

                    deltaArray.push(Math.abs(delta));

                    if (delta < deltaMin)
                    {
                        deltaMin = delta;
                    }
                }

                return deltaArray.indexOf(deltaMin);
            },

            _getCellTotalColumnWidth: function (jq_cell)
            {
                if (!checkExists(jq_cell) && jq_cell.length > 0)
                {
                    return 0;
                }

                var jq_table = jq_cell.closest("table");
                var tableColumns = jq_table.find(">.editor-body-colgroup>col");

                var i = 0;
                var colSpan = parseInt(jq_cell.eq(i).prop("colSpan"), 10);
                var colIndex = _designers._getCellFirstColumnIndex(jq_cell);  //Index that indicate the first column of the selected cell

                var columnWidthTotal = 0;
                for (i = colIndex; i < (colIndex + colSpan); i++)
                {
                    //Get the configured width of the column, the width has unit e.g. 20px or 20%
                    var widthText = tableColumns.eq(i).data("width");
                    var widthData = _designers.getWidthUnitData(widthText);

                    columnWidthTotal += widthData.value;
                }

                //Return cell's 'px' width value if the width unit is pixel
                //Return cell's '%' width value if the width unit is in percentage
                return columnWidthTotal.toFixed(2);
            },

            //moved implementation to Table helper
            removeRow: function (tableArray, pivotCell, position)
            {
                return SourceCode.Forms.TableHelper.removeRow(tableArray, pivotCell, position);
            },

            //moved implementation to Table helper
            _getTableHTMLColumnIndex: function (tableArray, rowIndex, id)
            {
                return SourceCode.Forms.TableHelper.getTableHTMLColumnIndex(tableArray, rowIndex, id);
            },

            //public accessor, as TableBehavior uses this.
            GetMergeDownCellLocation: function (tableArray, selectedCell)
            {
                return this._getMergeDownCellLocation(tableArray, selectedCell);
            },

            _getMergeDownCellLocation: function (tableArray, selectedCell)
            {
                var tableColumnIndex = SourceCode.Forms.TableHelper.getTableArrayColumnIndex(tableArray, selectedCell);
                var cellInfo = SourceCode.Forms.TableHelper.getCellInfo(selectedCell);
                var rowSpan = cellInfo.rowSpan;

                // get index below, then reduce and return index
                var rowIndex = cellInfo.rowIndex;
                if (rowIndex < tableArray.length - 1)
                {
                    var cellBelow = tableArray[rowIndex + rowSpan][tableColumnIndex];
                    if (cellBelow.id !== undefined)
                    {
                        return {
                            row: cellBelow.rowIndex,
                            col: cellBelow.colIndex
                        };
                    }
                }
                return null;
            },

            // Table Array Implementation
            //-----------------------------------------------------------------------------------------
            // Patterns
            getValidationPatterns: function ()
            {
                var thisResponse = $.ajax({
                    data: {
                        method: 'getValidationPatterns'
                    },
                    url: "Utilities/AJAXCall.ashx",
                    type: "POST",
                    async: false,
                    dataType: "text",
                    global: false
                }).responseText;

                if (SourceCode.Forms.ExceptionHandler.isException(thisResponse))
                {
                    SourceCode.Forms.ExceptionHandler.handleException(thisResponse);

                    return;
                }

                return thisResponse;
            },
            //-----------------------------------------------------------------------------------------

            resizeToolboxPaneTabs: function (paneID)
            {
                var tabBoxes = $("#" + paneID + " .tab-box");

                for (var i = 0; i < tabBoxes.length; i++)
                {
                    var tabBox = $(tabBoxes[i]);
                    var tabBoxTabsContainer = tabBox.find(".tab-box-tabs");
                    var tabBoxInnerWidth = tabBoxTabsContainer.width();
                    var tabsLi = tabBoxTabsContainer.find("li");
                    var totalWidthTabsLi = 0;

                    for (var j = 0; j < tabsLi.length; j++)
                    {
                        if (tabsLi[j].style.display !== "none")
                        {
                            var thisTab = $(tabsLi[j]);
                            var thisTabOuterWidth = thisTab.outerWidth(true);

                            totalWidthTabsLi = totalWidthTabsLi + thisTabOuterWidth;
                        }
                    }

                    //TFS 720744 & 731081
                    //It should be greater than equals and not just greater than, to handle sub-pixel widths correctly
                    if (totalWidthTabsLi >= tabBoxInnerWidth)
                    {
                        var reverseIndex = tabsLi.length - 1;

                        while ((totalWidthTabsLi >= tabBoxInnerWidth) && (reverseIndex > -1))
                        {
                            var thisTabA = $(tabsLi[reverseIndex]).find("a");

                            if ((tabsLi[reverseIndex].style.display !== "none") && (thisTabA[0].style.display !== "none"))
                            {
                                var curTabText = $(tabsLi[reverseIndex]).find(".tab-text");

                                if (curTabText[0].style.display !== "none")
                                {
                                    thisTabA.attr("title", curTabText.text());

                                    var curTextOuterWidth = curTabText.outerWidth(true);

                                    totalWidthTabsLi = totalWidthTabsLi - curTextOuterWidth;

                                    curTabText.hide();
                                }
                            }

                            reverseIndex--;
                        }
                    }
                    else if ((totalWidthTabsLi < tabBoxInnerWidth) && (totalWidthTabsLi !== 0))
                    {
                        var index = 0;

                        while ((totalWidthTabsLi < tabBoxInnerWidth) && (index < tabsLi.length))
                        {
                            var thisTabA = $(tabsLi[index]).find("a");

                            if ((tabsLi[index].style.display !== "none") && (thisTabA[0].style.display !== "none"))
                            {
                                var curTabText = $(tabsLi[index]).find(".tab-text");

                                if (curTabText[0].style.display === "none")
                                {
                                    var curTextOuterWidth = curTabText.outerWidth(true);

                                    totalWidthTabsLi = totalWidthTabsLi + curTextOuterWidth;

                                    if (totalWidthTabsLi < tabBoxInnerWidth)
                                    {
                                        thisTabA.attr("title", "");

                                        curTabText.show();
                                    }
                                }
                            }

                            index++;
                        }
                    }
                }
            },

            resizeToolBarButtons: function (tabID)
            {
                var rulesTab = $("#" + tabID);
                var toolbarWrapper = rulesTab.find(".toolbar-wrapper");
                var toolbarWrapperInnerWidth = toolbarWrapper.innerWidth();
                var toolbarButtons = toolbarWrapper.find(".toolbar-button");
                var toolbarDividers = toolbarWrapper.find(".toolbar-divider");
                var totalWidthToolbarButtons = 0;

                for (var j = 0; j < toolbarButtons.length; j++)
                {
                    var thisButton = $(toolbarButtons[j]);

                    if ((toolbarButtons[j].style.display !== "none") && (!(thisButton.hasClass("hidden"))))
                    {
                        var thisButtonOuterWidth = thisButton.outerWidth(true);

                        totalWidthToolbarButtons = totalWidthToolbarButtons + thisButtonOuterWidth;
                    }
                }

                for (var i = 0; i < toolbarDividers.length; i++)
                {
                    var thisDivider = $(toolbarDividers[i]);

                    if ((toolbarDividers[i].style.display !== "none") && (!(thisDivider.hasClass("hidden"))))
                    {
                        var thisDividerOuterWidth = thisDivider.outerWidth(true);

                        totalWidthToolbarButtons = totalWidthToolbarButtons + thisDividerOuterWidth;
                    }
                }

                if (totalWidthToolbarButtons > toolbarWrapperInnerWidth)
                {
                    var reverseIndex = toolbarButtons.length - 1;

                    while ((totalWidthToolbarButtons > toolbarWrapperInnerWidth) && (reverseIndex > -1))
                    {
                        if ((toolbarButtons[reverseIndex].style.display !== "none") && (!($(toolbarButtons[reverseIndex]).hasClass("hidden"))))
                        {
                            var curButtonText = $(toolbarButtons[reverseIndex]).find(".button-text");

                            if ((curButtonText[0].style.display !== "none") && (!(curButtonText.hasClass("hidden"))))
                            {
                                var curTextOuterWidth = curButtonText.outerWidth(true);

                                totalWidthToolbarButtons = totalWidthToolbarButtons - curTextOuterWidth;

                                curButtonText.hide();
                            }
                        }

                        reverseIndex--;
                    }
                }
                else if ((totalWidthToolbarButtons < toolbarWrapperInnerWidth) && (totalWidthToolbarButtons !== 0))
                {
                    var index = 0;

                    while ((totalWidthToolbarButtons < toolbarWrapperInnerWidth) && (index < toolbarButtons.length))
                    {
                        if ((toolbarButtons[index].style.display !== "none") && (!($(toolbarButtons[index]).hasClass("hidden"))))
                        {
                            var curButtonText = $(toolbarButtons[index]).find(".button-text");

                            if ((curButtonText[0].style.display === "none") || (curButtonText.hasClass("hidden")))
                            {
                                var curTextOuterWidth = curButtonText.outerWidth(true);

                                totalWidthToolbarButtons = totalWidthToolbarButtons + curTextOuterWidth;

                                if (totalWidthToolbarButtons < toolbarWrapperInnerWidth)
                                {
                                    curButtonText.show();
                                }
                            }
                        }

                        index++;
                    }
                }
            },

            // Helper function for retrieving the SetRuleMethod function for the current control type.
            // If function was properly evaluated, a function is returned, otherwise null is returned
            getControlSetRulesMethod: function (controlType)
            {
                // sanity checks
                if (controlType === undefined || controlType === null)
                {
                    return null;
                }

                if (!checkExists(SourceCode.Forms.Designers.Common))
                {
                    LogInternalErrorMessage("EventUtil.js", "getControlSetRulesMethod", Resources.ExceptionHandler.InvalidOperation.format("SourceCode.Forms.Designers.Common"));
                    return null;
                }

                if (!checkExists(SourceCode.Forms.Designers.Common.controlDefinitionsXml))
                {
                    LogInternalErrorMessage("EventUtil.js", "getControlSetRulesMethod", Resources.ExceptionHandler.InvalidOperation.format("SourceCode.Forms.Designers.Common.controlDefinitionsXml"));
                    return null;
                }

                var controlDefinitionNode = SourceCode.Forms.Designers.Common.controlDefinitionsXml.documentElement.selectSingleNode("Control[Name='{0}']".format(controlType));
                if (controlDefinitionNode !== null)
                {
                    var setRuleMethod = getNodeAttribute("setRulesMethod", controlDefinitionNode, "");

                    if (setRuleMethod !== "")
                    {
                        var functionInstance = evalCommon(setRuleMethod);
                        if (functionInstance !== null)
                        {
                            return functionInstance;
                        }
                    }

                    //if setRuleMethod === "" or functionInstance === null
                    //the code will fall through to this point (the functionInstance will not be returned)
                    //and an error message must be logged, since the SetRulesMethod could not be found
                    LogInternalErrorMessage("sourcecode.forms.designer.js", "getControlSetRulesMethod", Resources.ExceptionHandler.SetRuleMethodError.format(setRuleMethod));
                }
                return null;
            }
        });

    SourceCode.Forms.Designers.Common.ViewObject = function () { };

    SourceCode.Forms.Designers.Common.ViewObject.prototype =
    {
        _getRulesObject: function ()
        {
            return SourceCode.Forms.Designers.View;
        },

        _getDefinitionNode: function ()
        {
            return SourceCode.Forms.Designers.View.viewDefinitionXML.selectSingleNode("//Views/View");
        },

        _getDefinitionXml: function ()
        {
            return SourceCode.Forms.Designers.View.viewDefinitionXML;
        },

        _rebuildDefinitionXML: function ()
        {
            SourceCode.Forms.Designers.View.ViewDesigner._BuildViewXML();
        },

        _getContextXPath: function ()
        {
            return "//Views/View";
        },

        _getContextXPathForEvents: function ()
        {
            return this._getContextXPath() + "/Events";
        },

        //used by canvas widgets to make parts of them draggable
        makeDraggableElement: function (jqElement)
        {
            SourceCode.Forms.Designers.View.ViewDesigner._makeElementDragable(jqElement);
        },

        removeColumnById: function (columnId)
        {
            var xmlDoc = SourceCode.Forms.Designers.View.viewDefinitionXML;
            var viewElem = SourceCode.Forms.Designers.View.ViewDesigner._getViewElem(xmlDoc);

            var colElement = viewElem.selectSingleNode("//Control[(@LayoutType='Grid')]/Columns/Column[@ID='{0}']".format(columnId));
            if (checkExists(colElement))
            {
                colElement.parentNode.removeChild(colElement);
                //now remove column control
                var controlNode = xmlDoc.selectSingleNode("//Views/View/Controls/Control[@ID='{0}']".format(columnId));
                if (checkExists(controlNode))
                {
                    controlNode.parentNode.removeChild(controlNode);
                }
            }
        },

        //selects the default control on the canvas (typically the view  or the form)
        selectDefaultControl: function ()
        {
            var designer = SourceCode.Forms.Designers.View;
            designer.ViewDesigner._setDefaultSelectedObject();
        },

        getExpressionContextPlugins: function (isCurrent, controlID, subformID, subformType, contextType, contextID)
        {
            var plugins = [];
            var systemPlugin = new SystemVariablesContextPlugIn();
            systemPlugin.Settings =
            {
                includeAll: "True"
            };

            plugins.push(systemPlugin);

            var envPlugin = new EnvironmentFieldsContextPlugIn();
            envPlugin.Settings = {};
            plugins.push(envPlugin);

            if (isCurrent === "False")
            {
                if (subformType === "View")
                {
                    var currentPlugin = new ViewContextPlugIn();
                } else
                {
                    var currentPlugin = new FormContextPlugIn();
                }

                currentPlugin.Settings = {};
                currentPlugin.Settings["{0}ID".format(subformType.toLowerCase())] = subformID;
                currentPlugin.Settings["targetType"] = subformType;
            }
            else
            {
                if (contextType === "View")
                {
                    var currentPlugin = new ViewContextPlugIn();

                    currentPlugin.Settings = {};
                }
                else
                {
                    var currentPlugin = new FormContextPlugIn();

                    currentPlugin.Settings = {};
                    currentPlugin.Settings["formID"] = contextID;
                    isCurrent = "false";
                }
            }

            currentPlugin.Settings["isCurrent"] = isCurrent;
            currentPlugin.Settings["includeControls"] = "True";
            currentPlugin.Settings["includeViews"] = "True";
            currentPlugin.Settings["includeFields"] = "True";
            currentPlugin.Settings["includeParameters"] = "True";
            currentPlugin.Settings["includeFormControls"] = "True";
            currentPlugin.Settings["includeInputControls"] = "True";
            currentPlugin.Settings["includeDisplayControls"] = "True";
            currentPlugin.Settings["includeActionControls"] = "True";
            currentPlugin.Settings["includeControlProperties"] = "True";
            currentPlugin.Settings["includeListingControls"] = "True";
            currentPlugin.Settings["includeExecutionControls"] = "True";
            currentPlugin.Settings["includeExpressions"] = "True";

            plugins.push(currentPlugin);
            return plugins;
        },

        _showControlCalculation: function (e, context, controlID, isCurrent, subFormID, subformType, contextType, contextID, targetXml)
        {
            common.showExpressions(context, isCurrent, controlID, subFormID, subformType, contextType, contextID, targetXml);
        },

        _showInternalComplexPropertyPopup: function (e)
        {
            var ServerControl = this.getAttribute('ServerControl');
            var Init = this.getAttribute('InitializeServerControl');

            var divComplexProperty = $('#divComplexProperty');
            divComplexProperty.html('&nbsp;');
            modalizer.show(true);

            var qs = {
                method: 'getComplexPropertyConfiguration',
                assemblyName: ServerControl,
                initFunction: Init
            };

            var context = e.data.context;

            var options = {
                url: 'Utilities/AJAXCall.ashx',
                type: 'POST',
                data: qs,
                cache: false,
                success: function (data, textStatus) { common.showInternalComplexPropertyPopupResult(data, textStatus, context, true); },
                error: common.showComplexPropertyPopupFailure
            };

            $.ajax(options);
        },

        /**
         * This function is called only from a view context (because only views can have a primary datasource).
         * It identifies any source and source fields errors by looking at the annotations in the view definition xml.
         * It will badge or unbadge the datasource lookup, the default method dropdown and the fields tab.
        */
        refreshBadgesForViewDataSource: function ()
        {
            var hasSourceErrors = SourceCode.Forms.Designers.Common.hasInvalidPrimarySource();

            //Check if any fields underneath the source are annotated as error/missing:
            var defXml = SourceCode.Forms.Designers.Common.getDefinitionXML();
            var xPath = ".//Sources/Source[@ContextType='Primary']//Field{0}".format(common.getXPathValidationStatusCondition());
            var errorNodes = defXml.selectNodes(xPath);
            var hasFieldErrors = (errorNodes.length > 0);

            //Badge or unbadge the default list method dropdown on general tab:
            $("#vdlbl_listViewGetListMethod .input-control.select-box.dropdown-box").toggleClass("error", hasSourceErrors);
            $("#vdlbl_listViewGetListMethod .input-control.select-box.dropdown-box").toggleClass("icon-control", hasSourceErrors);

            //Badge or unbadge the field tab in the designer layout:
            $("#ViewEditorControlFieldsTab .tab-icon.fields").toggleClass("error", hasFieldErrors);

            //Badge or unbadge the view primary source lookup on general tab:
            var sourceLookupVal = $("#ViewDesignerSmartObjectLookup").categorylookup("value");

            if (!$.isEmptyObject(sourceLookupVal))
            {
                var newObjVal =
                {
                    objectid: sourceLookupVal.objectid,
                    objecttype: sourceLookupVal.objecttype,
                    displayname: sourceLookupVal.displayname,
                    isvalid: !hasSourceErrors
                };

                $("#ViewDesignerSmartObjectLookup").categorylookup("value", newObjVal);
            }
        },

        ensureDefinitionIsReadyForDependancyChecks: function ()
        {
            //In future may implement some kind of detubbing on view level
            //DO NOT REMOVE
        },

        resetState: function ()
        {
            //In future may reset the view object instance states when a new view is loaded
            //DO NOT REMOVE
            delete common._tableColumnResizer;
        },

        //controlObjectmodel {id:xxxx, controlType:"Cell", "Table" etc}
        addControlToDefinition: function (controlObjectModel)
        {
            var designer = SourceCode.Forms.Designers.View;
            return designer.DesignerTable.AddControlToDefinition(controlObjectModel);
        },

        insertControl: function (data)
        {
            var designer = SourceCode.Forms.Designers.View;
            designer.steps[designer.LAYOUT_STEP_INDEX].addItem(data);
        },

        removeControl: function (jqControl)
        {
            var designer = SourceCode.Forms.Designers.View;
            designer.removeControl(jqControl);
        },

        findControlFromSelectedObject: function ()
        {
            var object = SourceCode.Forms.Designers.View._findControlFromSelectedObject();

            return object;
        },

        getCanvasContainer: function ()
        {
            return $("#editorCanvasPane_EditorCanvas .canvas-layout-table")[0];
        },

        getCanvasScrollWrapper: function ()
        {
            return $("#editorCanvasPane_EditorCanvas .canvas-layout-table").closest(".scroll-wrapper")[0];
        },

        getControlStylesXml: function (controlId, controlType)
        {
            var defaultStyle = SCStyleHelper.getPrimaryStyleNode(SourceCode.Forms.Designers.View.DesignerTable.Styles._getStylesNode(controlId, controlType));

            return defaultStyle;
        },

        //Sets the alignment of the control in the control definition XML
        //controlid - string used to find the control on the canvas.
        //controlType - string, like "cell" or "table" etc.
        setControlTextAlignment: function (controlId, controlType, alignment, jqControl)
        {
            var defaultStyle = SCStyleHelper.getPrimaryStyleNode(SourceCode.Forms.Designers.View.DesignerTable.Styles._getStylesNode(controlId, controlType));

            var useClasses = SourceCode.Forms.TableHelper.cellIsInGrid(jqControl);

            //See Sourcecode.Forms.Designers.View.Styles.js - for the singleton that deals with Style XML updates for forms and views.
            var controlStyleDataUtility = SourceCode.Forms.Designers.View.DesignerTable.Styles;
            controlStyleDataUtility._setTextAlignment(defaultStyle, alignment);
            controlStyleDataUtility._applyControlStyles(jqControl, defaultStyle, useClasses);

            SourceCode.Forms.Designers.Common.triggerEvent("CellAlignmentChanged");
        },

        //Sets the alignment of the control in the control definition XML
        //controlid - string used to find the control on the canvas.
        //controlType - string, like "cell" or "table" etc.
        setControlVerticalAlignment: function (controlId, controlType, alignment, jqControl)
        {
            var designer = SourceCode.Forms.Designers.View;
            var defaultStyle = SCStyleHelper.getPrimaryStyleNode(designer.steps[designer.LAYOUT_STEP_INDEX]._getStylesNode(controlId, controlType));

            var useClasses = SourceCode.Forms.TableHelper.cellIsInGrid(jqControl);

            //See Sourcecode.Forms.Designers.View.Styles.js - for the singleton that deals with Style XML updates for forms and views.
            var controlStyleDataUtility = SourceCode.Forms.Designers.View.Styles;
            controlStyleDataUtility._setVerticalAlignment(defaultStyle, alignment);
            controlStyleDataUtility._applyControlStyles(jqControl, defaultStyle, useClasses);

            SourceCode.Forms.Designers.Common.triggerEvent("CellAlignmentChanged");
        },

        copyStyleToControl: function (fromControlId, fromControlType, jqFromControl, toControlId, toControlType, jqToControl)
        {
            if (fromControlType !== toControlType) throw "Error - Cannot copy Styles between two different control types yet.";

            var designer = SourceCode.Forms.Designers.View;
            var fromStyleXml = SCStyleHelper.getPrimaryStyleNode(designer.Styles._getStylesNode(fromControlId, fromControlType));
            var toStyleXml = SCStyleHelper.getPrimaryStyleNode(designer.Styles._getStylesNode(toControlId, toControlType));

            //check to see whether this control is a cell within a grid.
            var useClasses = SourceCode.Forms.TableHelper.cellIsInGrid(jqToControl);

            //See Sourcecode.Forms.Designers.View.Styles.js - for the singleton that deals with Style XML updates for forms and views.
            var controlStyleDataUtility = SourceCode.Forms.Designers.View.Styles;
            toStyleXml = controlStyleDataUtility.copyStylesToOtherControl(fromStyleXml, toStyleXml);
            controlStyleDataUtility._applyControlStyles(jqToControl, toStyleXml, useClasses);

            var bgColor = StyleHelper.getBackgroundColor(toStyleXml);
            if (checkExists(bgColor))
            {
                SourceCode.Forms.Designers.Common.setEditorElementColorsForContainer(bgColor, jqToControl);
            }
        },


        selectControl: function (controlId)
        {
            SourceCode.Forms.Designers.View.ViewDesigner._configSelectedControl($("#" + controlId));
        },

        getControlWrapper: function (jqElement)
        {
            return $(jqElement).closest(".controlwrapper");
        },

        //Param: PropertyInfo is an object of key/value pairs (like a hashtable)
        updateControlProperties: function (propertyInfo)
        {
            var designer = SourceCode.Forms.Designers.View;
            //Nothing to do here! this is only implemented on the common.form 
        },

        //refreshes the properties panel for a control, and any other UI related to displaying the properties of the control.
        refreshControlProperties: function (controlId, controlType)
        {
            //not implemented for view.
        },

        //refreshes the properties panel for the selected item in the designer.
        refreshSelectedControlProperties: function ()
        {
            //not implemented for view.
        },

        updateControlPropertyField: function (updateOptions)
        {
            SourceCode.Forms.Designers.View.PropertyGrid.updateControlPropertyField(updateOptions);
        },

        //Returns boolean if the current editor is editing an existing item (rather than a new item)
        isEditing: function ()
        {
            return SourceCode.Forms.Designers.View.IsViewEdit;
        },


        //allows the view/form canvas to re-layout controls after a control has changed its dimensions.
        //should be called if your control has just changed its height or width (or effective height and width)
        refreshLayout: function ()
        {
            //not implemented for view.
        },

        //set the layout step in the designer to have an error badge.
        setDesignerLayoutError: function ()
        {
            var designer = SourceCode.Forms.Designers.View;
            var wizard = designer.element.find("#ViewWizard");
            wizard.wizard("updateStepState", designer.LAYOUT_STEP_INDEX, "error");
        },

        //set the layout step to normal (no error).
        setDesignerLayoutNormal: function ()
        {
            var designer = SourceCode.Forms.Designers.View;
            var wizard = designer.element.find("#ViewWizard");
            wizard.wizard("updateStepState", designer.LAYOUT_STEP_INDEX, "");
        },

        //set the Rules step in the designer to have an error badge.
        setDesignerRulesError: function ()
        {
            var designer = SourceCode.Forms.Designers.View;
            var wizard = designer.element.find("#ViewWizard");
            wizard.wizard("updateStepState", designer.RULES_STEP_INDEX, "error");
        },

        //set the Rules step to normal (no error).
        setDesignerRulesNormal: function ()
        {
            var designer = SourceCode.Forms.Designers.View;
            var wizard = designer.element.find("#ViewWizard");
            wizard.wizard("updateStepState", designer.RULES_STEP_INDEX, "");
        },

        //set the general step in the designer to have an error badge.
        setDesignerDatasourceError: function ()
        {
            var designer = SourceCode.Forms.Designers.View;
            var wizard = designer.element.find("#ViewWizard");
            wizard.wizard("updateStepState", designer.GENERAL_STEP_INDEX, "error");
        },

        //set the general step to normal (no error).
        setDesignerDatasourceNormal: function ()
        {
            var designer = SourceCode.Forms.Designers.View;
            var wizard = designer.element.find("#ViewWizard");
            wizard.wizard("updateStepState", designer.GENERAL_STEP_INDEX, "");
        },

        //called by rulesgrid.js and ruleslist.js
        resetRulesSearch: function ()
        {
            var designer = SourceCode.Forms.Designers.View;
            designer.resetRulesSearch();
        }
    };

    SourceCode.Forms.Designers.Common.FormObject = function () { };

    SourceCode.Forms.Designers.Common.FormObject.prototype =
    {
        _definitionReadyForDependacyChecks: false,

        _getRulesObject: function ()
        {
            return SourceCode.Forms.Designers.Form.Rules;
        },

        _getDefinitionNode: function ()
        {
            return SourceCode.Forms.Designers.Form.formNode;
        },

        _getContextXPath: function ()
        {
            return "//Forms/Form";
        },

        _getContextXPathForEvents: function ()
        {
            return this._getContextXPath() + "/States/State/Events";
        },

        _getDefinitionXml: function ()
        {
            return SourceCode.Forms.Designers.Form.definitionXml;
        },

        _rebuildDefinitionXML: function ()
        {
            SourceCode.Forms.Designers.Common.Context.checkLayoutXML();
        },

        //used by canvas widgets to make parts of them draggable
        makeDraggableElement: function (jqElement)
        {
            var designer = SourceCode.Forms.Designers.Form;
            var _layout = designer.steps[designer.LAYOUT_STEP_INDEX];
            jqElement.draggable(_layout.formDragOptions);
        },

        //removes from xml only, should only be used for non-container controls
        removeColumnById: function (id)
        {
            var designer = SourceCode.Forms.Designers.Form;
            designer.steps[designer.LAYOUT_STEP_INDEX].removeControlById(id);
        },

        //selects the default control on the canvas (typically the view  or the form)
        selectDefaultControl: function ()
        {
            var designer = SourceCode.Forms.Designers.Form;
            designer.steps[designer.LAYOUT_STEP_INDEX].setDefaultSelectedObject();
        },

        getExpressionContextPlugins: function (isCurrent, controlID, subFormID, subformType, contextType, contextID, instanceID)
        {
            var plugins = [];
            var systemPlugin = new SystemVariablesContextPlugIn();
            systemPlugin.Settings =
            {
                includeAll: "True"
            };

            plugins.push(systemPlugin);

            var envPlugin = new EnvironmentFieldsContextPlugIn();
            envPlugin.Settings = {};
            plugins.push(envPlugin);

            if (isCurrent === "False")
            {
                if (subformType === "View")
                {
                    var currentPlugin = new ViewContextPlugIn();
                } else
                {
                    var currentPlugin = new FormContextPlugIn();
                }

                currentPlugin.Settings = {};
                currentPlugin.Settings["{0}ID".format(subformType.toLowerCase())] = subFormID;
                currentPlugin.Settings["targetType"] = subformType;
            }
            else
            {
                if (contextType === "View")
                {
                    var currentPlugin = new ViewContextPlugIn();

                    currentPlugin.Settings = {};
                    currentPlugin.Settings["viewID"] = contextID;
                    currentPlugin.Settings["targetType"] = contextType;
                    currentPlugin.Settings["instanceID"] = instanceID;
                    isCurrent = "False";
                } else
                {
                    var currentPlugin = new FormContextPlugIn();

                    currentPlugin.Settings = {};
                }
            }

            currentPlugin.Settings["isCurrent"] = isCurrent;
            currentPlugin.Settings["includeControls"] = "True";
            currentPlugin.Settings["includeViews"] = "True";
            currentPlugin.Settings["includeFields"] = "True";
            currentPlugin.Settings["includeParameters"] = "True";
            currentPlugin.Settings["includeFormControls"] = "True";
            currentPlugin.Settings["includeInputControls"] = "True";
            currentPlugin.Settings["includeDisplayControls"] = "True";
            currentPlugin.Settings["includeActionControls"] = "True";
            currentPlugin.Settings["includeControlProperties"] = "True";
            currentPlugin.Settings["includeListingControls"] = "True";
            currentPlugin.Settings["includeExecutionControls"] = "True";
            currentPlugin.Settings["includeExpressions"] = "True";

            plugins.push(currentPlugin);
            return plugins;
        },

        _showControlCalculation: function (e, context, controlID, isCurrent, subFormID, subformType, contextType, contextID, targetXml)
        {
            common.showExpressions(context, isCurrent, controlID, subFormID, subformType, contextType, contextID, targetXml);
        },

        _showInternalComplexPropertyPopup: function (e)
        {
            var $this = $(this);

            $.ajax($.extend({}, SourceCode.Forms.Designers.Form.ajax.settings, {
                data: {
                    method: 'getComplexPropertyConfiguration',
                    assemblyName: $this.attr('serverControl'),
                    initFunction: $this.attr('initializeServerControl')
                },
                type: 'POST',
                url: 'Utilities/AJAXCall.ashx',
                cache: false,
                success: function (data, textStatus) { common.showInternalComplexPropertyPopupResult(data, textStatus, e.data.context, false); },
                error: common.showComplexPropertyPopupFailure
            }));
        },

        ensureDefinitionIsReadyForDependancyChecks: function (xmlDefinition)
        {
            var tempDefinition = xmlDefinition;
            if (!this._definitionReadyForDependacyChecks || checkExists(tempDefinition))
            {
                var definitionNode = checkExists(tempDefinition) ? tempDefinition.documentElement.childNodes[0].childNodes[0] : this._getDefinitionNode();
                var xpath = "States/State/Events/Event[@Type='User'][@IsExtended='True' or not(@IsReference) or @IsReference='False'][DesignProperties/Property[Name='IsStub' and Value='True']]";
                var extendedStubbedEvents = definitionNode.selectNodes(xpath);
                if (extendedStubbedEvents.length > 0)
                {
                    var extendedStubbedEventIds = [];
                    for (var i = 0; i < extendedStubbedEvents.length; i++)
                    {
                        extendedStubbedEventIds.push(extendedStubbedEvents[i].getAttribute("ID"))
                    }
                    var _this = this;
                    var result = $.ajax($.extend({}, SourceCode.Forms.Designers.Form.ajax.settings,
                        {
                            async: false,
                            data:
                            {
                                method: 'loadStubbedEvents',
                                formId: SourceCode.Forms.Designers.Form.id,
                                eventIds: JSON.stringify(extendedStubbedEventIds)
                            },
                            type: 'POST',
                            success: function (data)
                            {
                                var unstubbedEvents = data.selectNodes("States/State/Events/Event");
                                var unStubbedEventLookup = {};
                                for (var i = 0; i < unstubbedEvents.length; i++)
                                {
                                    unStubbedEventLookup[unstubbedEvents[i].getAttribute("ID")] = unstubbedEvents[i];
                                }

                                var xpath = "States/State/Events/Event[@Type='User'][DesignProperties/Property[Name='IsStub' and Value='True']]";
                                var stubbedEvents = definitionNode.selectNodes(xpath);
                                for (var i = 0; i < stubbedEvents.length; i++)
                                {
                                    var stubbedEvent = stubbedEvents[i];
                                    var stubbedEventId = stubbedEvent.getAttribute("ID");
                                    var lookupEvent = unStubbedEventLookup[stubbedEventId];
                                    if (checkExists(lookupEvent))
                                    {
                                        var isStubProperty = stubbedEvent.selectSingleNode("DesignProperties/Property[Name='IsStub']");
                                        isStubProperty.parentNode.removeChild(isStubProperty);
                                        var otherDesignProperties = stubbedEvent.selectNodes("DesignProperties/Property");
                                        if (otherDesignProperties.length === 0)
                                        {
                                            //remove the parent if it has no other properties
                                            var designProperties = stubbedEvent.selectSingleNode("DesignProperties");
                                            designProperties.parentNode.removeChild(designProperties);
                                        }
                                        stubbedEvent.appendChild(lookupEvent.selectSingleNode("Handlers").cloneNode(true));
                                    }
                                }

                                if (!checkExists(tempDefinition))
                                {
                                    _this._definitionReadyForDependacyChecks = true;
                                }
                            }
                        }));
                }
                else
                {
                    this._definitionReadyForDependacyChecks = true;
                }

            }
        },
        resetState: function ()
        {
            this._definitionReadyForDependacyChecks = false;

            delete common._tableColumnResizer;
        },


        //controlObjectmodel {id:xxxx, controlType:"Cell", "Table" etc}
        addControlToDefinition: function (controlObjectModel)
        {
            var designer = SourceCode.Forms.Designers.Form;
            return designer.steps[designer.LAYOUT_STEP_INDEX].AddControlToDefinition(controlObjectModel);
        },

        insertControl: function (data)
        {
            var designer = SourceCode.Forms.Designers.Form;
            designer.steps[designer.LAYOUT_STEP_INDEX].addItem(data);
        },

        removeControl: function (jqControl)
        {
            var designer = SourceCode.Forms.Designers.Form;
            designer.steps[designer.LAYOUT_STEP_INDEX].removeControl(jqControl);
        },

        findControlFromSelectedObject: function ()
        {
            var designer = SourceCode.Forms.Designers.Form;

            var layoutStep = designer.steps[designer.LAYOUT_STEP_INDEX];

            var object = $(layoutStep.selectedItem);

            return object;
        },

        getCanvasContainer: function ()
        {
            return $("#pgOuterPanel")[0];
        },

        getCanvasScrollWrapper: function ()
        {
            return $("#CanvasPane.pane").find(".scroll-wrapper")[0];
        },

        getControlStylesXml: function (controlId, controlType)
        {
            var designer = SourceCode.Forms.Designers.Form;
            var defaultStyle = SCStyleHelper.getPrimaryStyleNode(designer.steps[designer.LAYOUT_STEP_INDEX]._getStylesNode(controlId, controlType));

            return defaultStyle;
        },

        //Sets the alignment of the control in the control definition XML
        //controlid - string used to find the control on the canvas.
        //controlType - string, like "cell" or "table" etc.
        setControlTextAlignment: function (controlId, controlType, alignment, jqControl)
        {
            var designer = SourceCode.Forms.Designers.Form;
            var defaultStyle = SCStyleHelper.getPrimaryStyleNode(designer.steps[designer.LAYOUT_STEP_INDEX]._getStylesNode(controlId, controlType));

            var useClasses = SourceCode.Forms.TableHelper.cellIsInGrid(jqControl);

            //See Sourcecode.Forms.Designers.View.Styles.js - for the singleton that deals with Style XML updates for forms and views.
            var controlStyleDataUtility = SourceCode.Forms.Designers.View.Styles;
            controlStyleDataUtility._setTextAlignment(defaultStyle, alignment);
            controlStyleDataUtility._applyControlStyles(jqControl, defaultStyle, useClasses);

            SourceCode.Forms.Designers.Common.triggerEvent("CellAlignmentChanged");
        },

        //Sets the alignment of the control in the control definition XML
        //controlid - string used to find the control on the canvas.
        //controlType - string, like "cell" or "table" etc.
        setControlVerticalAlignment: function (controlId, controlType, alignment, jqControl)
        {
            var designer = SourceCode.Forms.Designers.Form;
            var defaultStyle = SCStyleHelper.getPrimaryStyleNode(designer.steps[designer.LAYOUT_STEP_INDEX]._getStylesNode(controlId, controlType));

            var useClasses = SourceCode.Forms.TableHelper.cellIsInGrid(jqControl);

            //See Sourcecode.Forms.Designers.View.Styles.js - for the singleton that deals with Style XML updates for forms and views.
            var controlStyleDataUtility = SourceCode.Forms.Designers.View.Styles;
            controlStyleDataUtility._setVerticalAlignment(defaultStyle, alignment);
            controlStyleDataUtility._applyControlStyles(jqControl, defaultStyle, useClasses);

            SourceCode.Forms.Designers.Common.triggerEvent("CellAlignmentChanged");
        },


        copyStyleToControl: function (fromControlId, fromControlType, jqFromControl, toControlId, toControlType, jqToControl)
        {
            if (fromControlType !== toControlType) throw "Error - Cannot copy Styles between two different control types yet.";
            var designer = SourceCode.Forms.Designers.Form;
            var fromStyleXml = SCStyleHelper.getPrimaryStyleNode(designer.steps[designer.LAYOUT_STEP_INDEX]._getStylesNode(fromControlId, fromControlType));
            var toStyleXml = SCStyleHelper.getPrimaryStyleNode(designer.steps[designer.LAYOUT_STEP_INDEX]._getStylesNode(toControlId, toControlType));

            //check to see whether this control is a cell within a grid.
            var useClasses = SourceCode.Forms.TableHelper.cellIsInGrid(jqToControl);

            //See Sourcecode.Forms.Designers.View.Styles.js - for the singleton that deals with Style XML updates for forms and views.
            var controlStyleDataUtility = SourceCode.Forms.Designers.View.Styles;
            toStyleXml = controlStyleDataUtility.copyStylesToOtherControl(fromStyleXml, toStyleXml)
            controlStyleDataUtility._applyControlStyles(jqToControl, toStyleXml, useClasses);

            var bgColor = StyleHelper.getBackgroundColor(toStyleXml);
            if (checkExists(bgColor))
            {
                SourceCode.Forms.Designers.Common.setEditorElementColorsForContainer(bgColor, jqToControl);
            }
        },

        selectControl: function (controlId)
        {
            var designer = SourceCode.Forms.Designers.Form;
            var layoutStep = designer.steps[designer.LAYOUT_STEP_INDEX];

            var control = $("#" + controlId);

            layoutStep.selectItem(control);
            layoutStep.initPropertiesTab({ id: controlId, type: SourceCode.Forms.Designers.Common.getControlType(controlId) });
        },

        getControlWrapper: function (jqElement)
        {
            return $(jqElement).closest(".form-control");
        },

        //Param: PropertyInfo is an object of key/value pairs (like a hashtable)
        updateControlProperties: function (controlId, propertyInfo)
        {
            var designer = SourceCode.Forms.Designers.Form;
            var controlNode = SourceCode.Forms.Designers.Form.formNode.selectSingleNode('Controls/Control[@ID="'.concat(controlId, '"]'));
            for (var propertyName in propertyInfo)
            {
                var propertyValue = propertyInfo[propertyName];
                var layoutStep = designer.steps[designer.LAYOUT_STEP_INDEX];
                layoutStep.updateControlNodeProperty(controlNode, propertyName, propertyValue);
                if (checkExists(layoutStep.selectedItem) && (layoutStep.selectedItem.length > 0))
                {
                    designer.element.find("#pgPropertiesTabContent .{0}-property".format(propertyName.toLowerCase())).find("input[type=text]").val(propertyValue);
                }
            }
        },

        //refreshes the properties panel for a control, and any other UI related to displaying the properties of the control.
        refreshControlProperties: function (controlId, controlType)
        {
            var designer = SourceCode.Forms.Designers.Form;
            var layoutStep = designer.steps[designer.LAYOUT_STEP_INDEX];

            layoutStep.initPropertiesTab({ id: controlId, type: controlType });
        },

        //refreshes the properties panel for the selected item in the designer.
        refreshSelectedControlProperties: function ()
        {
            var designer = SourceCode.Forms.Designers.Form;
            var _layout = designer.steps[designer.LAYOUT_STEP_INDEX];
            _layout.clearSelectedObject(); //clear property grid for form
            var ctrlid = _layout.selectedItem.attr("id"); //find the control id
            var ctrl = designer.formNode.selectSingleNode("Controls/Control[@ID='" + ctrlid + "']"); //find the control

            _layout.initPropertiesTab({ "id": ctrlid, "type": ctrl.getAttribute("Type") }) //initialize the propertygrid for form
        },

        updateControlPropertyField: function (updateOptions)
        {
            var designer = SourceCode.Forms.Designers.Form;
            var _layout = designer.steps[designer.LAYOUT_STEP_INDEX];
            _layout.updateControlPropertyField(updateOptions);
        },

        //Returns boolean if the current editor is editing an existing item (rather than a new item)
        isEditing: function ()
        {
            return SourceCode.Forms.Designers.Form.isEditing;
        },

        //allows the view/form canvas to re-layout controls after a control has changed its dimensions.
        //should be called if your control has just changed its height or width (or effective height and width)
        refreshLayout: function ()
        {
            var designer = SourceCode.Forms.Designers.Form;
            if (designer.steps[designer.LAYOUT_STEP_INDEX].tabControl !== null)
            {
                designer.steps[designer.LAYOUT_STEP_INDEX].tabControl.activeTab.panel.equalizeHeights();
            }
        },

        checkLayoutXML: function ()
        {
            var designer = SourceCode.Forms.Designers.Form;
            designer.steps[designer.LAYOUT_STEP_INDEX].checkLayoutXML();
        },

        //set the layout step in the designer to have an error badge.
        setDesignerLayoutError: function ()
        {
            var designer = SourceCode.Forms.Designers.Form;
            var wizard = designer.element.find("#pgWizard");
            wizard.wizard("updateStepState", designer.LAYOUT_STEP_INDEX, "error");
        },

        //set the layout step to normal (no error).
        setDesignerLayoutNormal: function ()
        {
            var designer = SourceCode.Forms.Designers.Form;
            var wizard = designer.element.find("#pgWizard");
            wizard.wizard("updateStepState", designer.LAYOUT_STEP_INDEX, "");
        },

        //set the Rules step in the designer to have an error badge.
        setDesignerRulesError: function ()
        {
            var designer = SourceCode.Forms.Designers.Form;
            var wizard = designer.element.find("#pgWizard");
            wizard.wizard("updateStepState", designer.RULES_STEP_INDEX, "error");
        },

        //set the Rules step to normal (no error).
        setDesignerRulesNormal: function ()
        {
            var designer = SourceCode.Forms.Designers.Form;
            var wizard = designer.element.find("#pgWizard");
            wizard.wizard("updateStepState", designer.RULES_STEP_INDEX, "");
        },

        //set the general step in the designer to have an error badge.
        setDesignerDatasourceError: function ()
        {
            var designer = SourceCode.Forms.Designers.Form;
            var wizard = designer.element.find("#pgWizard");
            wizard.wizard("updateStepState", designer.GENERAL_STEP_INDEX, "error");
        },

        //set the general step to normal (no error).
        setDesignerDatasourceNormal: function ()
        {
            var designer = SourceCode.Forms.Designers.Form;
            var wizard = designer.element.find("#pgWizard");
            wizard.wizard("updateStepState", designer.GENERAL_STEP_INDEX, "");
        },

        //called by ruleslist.js and rulesgrid.js
        resetRulesSearch: function ()
        {
            var designer = SourceCode.Forms.Designers.Form;
            designer.resetRulesSearch();
        }
    };

    SourceCode.Forms.Designers.Common.RulesObject = function () { };

    SourceCode.Forms.Designers.Common.RulesObject.prototype =
    {
        //can be made into a property if needed to be change in future
        Current: SourceCode.Forms.WizardContainer,

        getRulesObject: function ()
        {
            return SourceCode.Forms.Designers.Common.Context._getRulesObject();
        },

        checkRuleValid: function (eventNode)
        {
            var eventNodeInvalid = false;
            eventNodeInvalid = eventNode.selectSingleNode("DesignProperties/Property[Name/text()='Invalid']/Value[.='true']") !== null ? true : false;

            if (eventNodeInvalid)
            {
                return eventNodeInvalid;
            }

            var conditionNodeInvalid = false;
            conditionNodeInvalid = eventNode.selectSingleNode("Handlers/Handler/Conditions/Condition/DesignProperties/Property[Name/text()='Invalid']/Value[.='true']") !== null ? true : false;

            if (conditionNodeInvalid)
            {
                return conditionNodeInvalid;
            }

            var actionNodeInvalid = false;
            actionNodeInvalid = eventNode.selectSingleNode("Handlers/Handler/Actions/Action/DesignProperties/Property[Name/text()='Invalid']/Value[.='true']") !== null ? true : false;

            if (actionNodeInvalid)
            {
                return actionNodeInvalid;
            }

            return false;
        },

        markActionsInvalid: function (actions)
        {
            if (checkExists(actions) && actions.length > 0)
            {
                var actionsLength = actions.length;
                for (var a = 0; a < actionsLength; a++)
                {
                    var actionNode = actions[a];
                    var designPropertiesNode = actionNode.selectSingleNode("DesignProperties");
                    var propertyNode = actionNode.selectSingleNode("DesignProperties/Property[Name/text()='Invalid']");

                    if (designPropertiesNode === null)
                    {
                        if (checkExists(actionNode.ownerDocument))
                        {
                            designPropertiesNode = actionNode.ownerDocument.createElement("DesignProperties");
                            actionNode.appendChild(designPropertiesNode);
                        }
                    }

                    if (propertyNode !== null)
                    {
                        designPropertiesNode.removeChild(propertyNode);
                    }

                    if (checkExists(actionNode.ownerDocument))
                    {
                        propertyNode = this._createEventingProperty(actionNode.ownerDocument, "Invalid", "true");
                        designPropertiesNode.appendChild(propertyNode);
                    }
                }
            }
        },

        _createEventingProperty: function (xmlDoc, name, value, displayValue, nameValue)
        {
            var propertyEl = xmlDoc.createElement("Property");
            var nameEl = xmlDoc.createElement("Name");
            var valueEl = xmlDoc.createElement("Value");
            var nameValueEl = xmlDoc.createElement("NameValue");
            var displayValueEl = xmlDoc.createElement("DisplayValue");

            if (!checkExists(displayValue))
            {
                displayValue = value;
            }

            if (!checkExists(nameValue))
            {
                nameValue = value;
            }

            nameEl.appendChild(xmlDoc.createTextNode(name));
            valueEl.appendChild(xmlDoc.createTextNode(value));
            nameValueEl.appendChild(xmlDoc.createTextNode(nameValue));
            displayValueEl.appendChild(xmlDoc.createTextNode(displayValue));

            propertyEl.appendChild(nameEl);
            propertyEl.appendChild(valueEl);
            propertyEl.appendChild(nameValueEl);
            propertyEl.appendChild(displayValueEl);

            return propertyEl;
        },

        /**
         * This function is called when an event is removed (either when removing system events for view instance or control,
         * or as the callback when removing an event from RuleGrid or RuleList)
         * 
         *	If function was not called through the notifier (e.g. removing an event with dependencies), a check will be done for any
         *  subform/subview dependent events and actions and remove them.
         *	If item was removed through dependency notifier, removal of extended dependent subform/view items will be handled in DependencyHelper
         * 
         *  In both cases the original event to be removed will be removed from the definition XML.
         * 
         * @param {xmlNode} _eventNode - Event to remove from definition xml
         * @param {xmlDocument} pDefinitionXml - Definition xml
         * @param {control} grid - To determine whether from RuleList or RuleGrid
         * @param {object} notifierContext - (optional) Will be passed on by the dependency notifier callback
         * 
        */
        removeItemFromXml: function (_eventNode, pDefinitionXml, grid, notifierContext)
        {
            var gridType = this.getGridType(grid);
            if (_eventNode !== null)
            {
                SourceCode.Forms.Designers.Common.Context.ensureDefinitionIsReadyForDependancyChecks();

                if (!checkExists(_eventNode.parentNode))
                {
                    var eventId = _eventNode.getAttribute("ID");
                    //The event reference may be updated via de stubbing or xml rebuild
                    _eventNode = pDefinitionXml.documentElement.selectSingleNode("//Events/Event[@ID='{0}']".format(eventId));
                }

                var EventDetails = {
                    ID: _eventNode.getAttribute("ID"),
                    Type: _eventNode.getAttribute("Type"),
                    SourceID: _eventNode.getAttribute("SourceID"),
                    SourceType: _eventNode.getAttribute("SourceType"),
                    IsReference: (_eventNode.getAttribute("IsReference") === "True" ? true : false),
                    InstanceID: _eventNode.getAttribute("InstanceID"),
                    SubFormID: _eventNode.getAttribute("SubFormID"),
                    Name: _eventNode.selectSingleNode("Name").text,
                    DefinitionID: _eventNode.getAttribute("DefinitionID")
                };

                //If item was removed through dependency notifier, removal of extended dependent subform/view items will be handled in DependencyHelper
                if (!checkExists(notifierContext))
                {
                    var subformGuidArray = [];
                    if (gridType === "list")
                    {
                        SourceCode.Forms.RuleList.removeDependentEventItems(pDefinitionXml, _eventNode, subformGuidArray);
                        SourceCode.Forms.RuleList.removeDependentActions(pDefinitionXml, subformGuidArray);
                    }
                    else
                    {
                        SourceCode.Forms.RuleGrid.removeDependentEventItems(pDefinitionXml, _eventNode, subformGuidArray);
                        SourceCode.Forms.RuleGrid.removeDependentActions(pDefinitionXml, subformGuidArray);
                    }
                }
                else
                {
                    //Inherited subform/view rules that were not extended, should still be removed with the rule item.
                    //No need to remove the inherited actions, as they will always be contained in an inherited event.
                    this.removeDependentInheritedEventItems(pDefinitionXml, _eventNode, gridType, []);

                }

                if (!EventDetails.IsReference)
                {
                    var xp = ["//Events/Event"];
                    xp.push("[@SourceID='" + EventDetails.SourceID + "']");
                    xp.push("[@Type='" + EventDetails.Type + "']");
                    xp.push("[@SourceType='" + EventDetails.SourceType + "']");
                    if (EventDetails.InstanceID !== null) xp.push("[@InstanceID='" + EventDetails.InstanceID + "']");
                    if (EventDetails.SubFormID !== null) xp.push("[@SubFormID='" + EventDetails.SubFormID + "']");
                    if (EventDetails.DefinitionID !== null) xp.push("[@DefinitionID='" + EventDetails.DefinitionID + "']");
                    xp.push("[Name=" + EventDetails.Name.xpathValueEncode() + "]");

                    var _eventNodes = pDefinitionXml.documentElement.selectNodes(xp.join(""));

                    $.each(_eventNodes, function ()
                    {
                        var _node = this;
                        _node.parentNode.removeChild(_node);
                    });
                }
            }
        },

        //Will only remove subform events that were not extended
        removeDependentInheritedEventItems: function (pDefinitionXml, _eventNode, gridType, subformGuidArray)
        {
            var subformOpenActions = _eventNode.selectNodes("Handlers/Handler/Actions/Action[((@Type='Open') or (@Type='Popup')) and (not(@IsReference) or (@IsReference!='True'))]");
            if (subformOpenActions.length > 0)
            {
                for (var a = 0; a < subformOpenActions.length; a++)
                {
                    var subformAction = subformOpenActions[a];
                    var subformGuid = subformAction.getAttribute("SubFormID");

                    subformGuidArray.push(subformGuid);

                    var newEventsNode = pDefinitionXml.selectNodes("//Event[@SubFormID='" + subformGuid + "' and @IsReference='True']");
                    for (var e = 0; e < newEventsNode.length; e++)
                    {
                        if (_eventNode.parentNode)// Remove Event
                        {
                            _eventNode.parentNode.removeChild(_eventNode);
                        }

                        var newEventNode = newEventsNode[e];

                        var _ruleDesigner = SourceCode.Forms.RuleGrid;
                        if (gridType === "list")
                        {
                            _ruleDesigner = SourceCode.Forms.RuleList;
                        }
                        _ruleDesigner.removeDependentEventItems(pDefinitionXml, newEventNode, subformGuidArray);
                    }
                }
            }
            if (_eventNode.parentNode)// Remove Event
            {
                _eventNode.parentNode.removeChild(_eventNode);
            }
        },

        _setFormStateEvents: function (_eventNode, _contextNode, ruleState)
        {
            var eventGuidArray = [];
            var eventDefinitionGuid = _eventNode.getAttribute("DefinitionID");
            var _xPath = "Events/Event[(@Type='User')and(@DefinitionID='{0}')]".format(eventDefinitionGuid);
            var stateNode = _eventNode.parentNode.parentNode;
            var stateID = _eventNode.parentNode.parentNode.getAttribute("ID");

            if (!checkExists(stateNode.getAttribute("IsBase")))
            {
                _xPath = "States/State[@ID='" + stateID + "']/" + _xPath;
            }
            else
            {
                _xPath = "States/State/" + _xPath;
            }

            var _instanceID = getNodeAttribute("InstanceID", _eventNode, null, checkExistsNotEmptyGuid);
            var _subFormID = getNodeAttribute("SubFormID", _eventNode, null, checkExistsNotEmptyGuid);
            var _subFormInstanceID = getNodeAttribute("SubFormInstanceID", _eventNode, null, checkExistsNotEmptyGuid);

            if (_subFormID)
            {
                _xPath += "[@SubFormID='" + _subFormID + "']";
            }

            if (_instanceID)
            {
                _xPath += "[@InstanceID='" + _instanceID + "']";
            }

            if (_subFormInstanceID)
            {
                _xPath += "[@SubFormInstanceID='" + _subFormInstanceID + "']";
            }

            var _eventNodes = _contextNode.selectNodes(_xPath);
            for (var e = 0; e < _eventNodes.length; e++)
            {
                var thisEvent = _eventNodes[e];
                var setIsInherited = true;
                var setIsEnabled = true;

                if (stateID !== thisEvent.parentNode.parentNode.getAttribute("ID"))
                {
                    setIsInherited = false;

                    //This fixes TFS 699485
                    var thisEventIsInherited = thisEvent.getAttribute("IsInherited");
                    if (!checkExists(thisEventIsInherited) || thisEventIsInherited.toLowerCase() === 'false')
                    {
                        setIsEnabled = false;
                    }
                }

                if (setIsInherited)
                {
                    thisEvent.setAttribute("IsInherited", "False");
                    thisEvent.setAttribute("IsExtended", "True");
                }

                if (setIsEnabled)
                {
                    thisEvent.setAttribute("IsEnabled", ruleState);
                }

                eventGuidArray.push(thisEvent.getAttribute("ID"));
            }

            return eventGuidArray;
        },

        setEventItemStates: function (pDefinitionXml, _eventNode, ruleState)
        {
            var eventGuidArray;
            var _contextNode = pDefinitionXml.documentElement.selectSingleNode("/*/*/*");
            if (_contextNode.nodeName === 'Form')
            {
                // Form.
                eventGuidArray = this._setFormStateEvents(_eventNode, _contextNode, ruleState);
            }
            else
            {
                // View.
                _eventNode.setAttribute("IsInherited", "False");
                _eventNode.setAttribute("IsExtended", "True");
                _eventNode.setAttribute("IsEnabled", ruleState);

                eventGuidArray = [_eventNode.getAttribute("ID")];
            }

            return eventGuidArray;
        },

        getGridType: function (grid)
        {
            var gridtype = "list";
            if ((grid.is("#pgRuleGrid")) || (grid.is("#pgRulesTabContent")) || (grid.is("#vdFormEventsTabGrid")))
            {
                gridtype = "grid";
            }
            return gridtype;
        },

        getUniqueObjectArray: function (array)
        {
            var duplicates = {};
            var uniqueArray = [];

            $.each(array, function (i, el)
            {
                if (!duplicates[el.id])
                {
                    duplicates[el.id] = true;
                    uniqueArray.push(el);
                }
            });
            return uniqueArray;
        },

        orderArray: function (value)
        {
            var typesArray = SourceCode.Forms.RuleList.formTypeArray;
            var firstArray = value.split("|");
            var ordered = [];
            var final;
            for (var j = 0; j < typesArray.length; j++)
            {
                for (var i = 0; i < firstArray.length; i++)
                {
                    if (typesArray[j] === firstArray[i])
                    {
                        ordered.push(firstArray[i]);
                    }
                }
            }

            ordered = ordered.filter(function (item, index, inputArray)
            {
                return inputArray.indexOf(item) === index;
            });

            final = ordered.join("|");
            return final;
        },

        orderObjectArray: function (objectArray)
        {
            var typesArray = SourceCode.Forms.RuleList.formTypeArray;
            var ordered = [];
            for (var j = 0; j < typesArray.length; j++)
            {
                for (var i = 0; i < objectArray.length; i++)
                {
                    if (typesArray[j] === objectArray[i].label)
                    {
                        ordered.push(objectArray[i]);
                    }
                }
            }

            return ordered;
        },

        convertFilterType: function (filter)
        {
            switch (filter)
            {
                case Resources.Wizard.FormText:
                    filter = "Form";
                    break;
                case Resources.Wizard.ViewText:
                    filter = "View";
                    break;
                case Resources.FormDesigner.Control:
                    filter = "Control";
                    break;
                case Resources.CommonLabels.UnboundText:
                    filter = "Unbound";
                    break;
                case Resources.CommonLabels.ExtendedText:
                    filter = "Extended";
                    break;
                case Resources.CommonLabels.SubformText:
                    filter = "Subform";
                    break;
                case Resources.CommonLabels.SubviewText:
                    filter = "Subview";
                    break;
            }

            return filter;
        },

        getFilters: function (pOptions)
        {
            $("input[type=checkbox][name=RulesFilterSearchScope]").checkbox();
            var definitionXml = SourceCode.Forms.Designers.Common.Context.getDefinitionXML();
            var rulesObject = SourceCode.Forms.Designers.Common.Rules.getRulesObject();
            var grid = rulesObject.getTargetGrid();

            var controlID, stateID, instanceID;

            if (checkExists(pOptions))
            {
                if (checkExistsNotEmpty(pOptions.controlID))
                {
                    controlID = pOptions.controlID;
                }
                if (checkExistsNotEmpty(pOptions.stateID))
                {
                    stateID = pOptions.stateID;
                }
                if (checkExistsNotEmpty(pOptions.instanceID))
                {
                    instanceID = pOptions.instanceID;
                }
            }

            var xPath = "Events/Event[@Type='User']";
            var contextNode = definitionXml.documentElement.selectSingleNode("/*/*/*");
            var contextNodeName = contextNode.nodeName;

            if (contextNodeName === 'Form')
            {
                if (checkExistsNotEmpty(stateID))
                {
                    xPath = "States/State[@ID='" + stateID + "']/" + xPath;
                }
                else
                {
                    xPath = "States/State[@IsBase='True']/" + xPath;
                }

                if (checkExistsNotEmpty(instanceID))
                {
                    xPath += "[@InstanceID='" + instanceID + "']";
                }
                else if (checkExistsNotEmpty(controlID))
                {
                    xPath += "[@SourceID='" + controlID + "'][@SourceType='Control'][not(@SubFormID)]";
                }
            }
            else if (checkExistsNotEmpty(controlID))
            {
                xPath += "[@SourceID='" + controlID + "'][@SourceType='Control'][not(@SubFormID)]";
            }

            var eventNodes = contextNode.selectNodes(xPath);
            var i = 0;
            var filters = [];

            if (eventNodes.length === 0)
            {
                rulesObject.disableFilterControls(grid, contextNodeName);
            }
            else
            {
                rulesObject.enableFilterControls(grid, contextNodeName);
            }

            var isControl = false;

            while (i < eventNodes.length)
            {
                var eventNode = eventNodes[i];
                var locationIcon = rulesObject.currentGridObject.getEventContext(eventNode, contextNodeName);
                var sourceType = rulesObject.currentGridObject.getSourceType(eventNode, contextNodeName);
                var sType = eventNode.getAttribute("SourceType");
                var sourceTypeParts = sourceType.split("-");

                if (sourceTypeParts[0] === "Unbound")
                {
                    sourceType = "Unbound";
                }
                else if (sourceTypeParts[0] === "Extended")
                {
                    sourceType = "Extended";
                }

                var propertiesNode = eventNode.selectSingleNode('Properties');

                if (checkExists(propertiesNode))
                {
                    if (sType.toLowerCase() === "control")
                    {
                        isControl = true;
                    }

                    switch (sourceType.toLowerCase())
                    {
                        //Fix for TFS 713171
                        case "extended":
                        case "control":
                        case "formparameter":
                        case "viewparameter":
                            var filter = locationIcon.charAt(0).toUpperCase() + locationIcon.substr(1).toLowerCase();
                            var filterValue = SourceCode.Forms.Designers.Common.Rules.convertFilterType(filter);
                            filters.push(
                                {
                                    id: filterValue,
                                    label: filter,
                                    value: filterValue,
                                    description: filter,
                                    selected: false
                                });
                            break;
                        default:
                            var filterValue = SourceCode.Forms.Designers.Common.Rules.convertFilterType(sourceType);
                            filters.push(
                                {
                                    id: filterValue,
                                    label: sourceType,
                                    value: filterValue,
                                    description: sourceType,
                                    selected: false
                                });
                    }
                }
                i++;
            }

            if (isControl)
            {
                filters.push(
                    {
                        id: "Control",
                        label: Resources.FormDesigner.Control,
                        value: "Control",
                        description: Resources.FormDesigner.Control,
                        selected: false
                    });
            }

            filters.push(
                {
                    id: "Extended",
                    label: Resources.CommonLabels.ExtendedText,
                    value: "Extended",
                    description: Resources.CommonLabels.ExtendedTextTooltip,
                    selected: false
                });

            var orderedFilters = SourceCode.Forms.Designers.Common.Rules.orderObjectArray(filters);

            if (checkExistsNotEmpty(orderedFilters))
            {
                orderedFilters.push(
                    {
                        id: "All",
                        label: Resources.CommonLabels.AllText,
                        value: "All",
                        description: Resources.CommonLabels.AllText,
                        selected: false
                    });
            }

            return orderedFilters;
        },

        _checkExistsFilterCheckMenu: function (thisFilterMenu)
        {
            var exists = false;
            if (checkExists(thisFilterMenu))
            {
                exists = true;
            }
            return exists;
        },

        _addItemToMenu: function (thisFilterMenu, item)
        {
            thisFilterMenu.filtercheckmenu("addItem", {
                icon: item.value,
                text: item.label,
                id: item.id,
                description: item.description,
                type: "filter",
                checked: item.selected,
                children: item.children
            });
        },

        _loadFilterCheckContextMenu: function (_this, items, selectedItems, thisFilterMenu)
        {
            if (thisFilterMenu.filtercheckmenu("countItems") === 0)
            {
                var itemCount = items.length - 1;

                var allItemsItem = items[itemCount];
                allItemsItem.children = [];

                //link child items to all item
                for (var i = 0; i < itemCount; i++)
                {
                    //selected checks
                    var currentItem = items[i];
                    var currentItemIsExtended = (currentItem.value === "Extended");

                    //all item children
                    if (!currentItemIsExtended)
                    {
                        if (allItemsItem)
                        {
                            allItemsItem.children.push(currentItem.value);
                        }
                    }
                }

                //build menu
                this._addItemToMenu(thisFilterMenu, allItemsItem);

                if (items.length > 1)
                {
                    thisFilterMenu.filtercheckmenu("addSeperator");
                }

                var extendedIndex = -1;
                for (var d = 0; d < itemCount; d++)
                {
                    var currentItem = items[d];
                    if (currentItem.value !== "Extended")
                    {
                        this._addItemToMenu(thisFilterMenu, currentItem);
                    }
                    else
                    {
                        extendedIndex = d;
                    }
                }

                if (extendedIndex > -1)
                {
                    thisFilterMenu.filtercheckmenu("addSeperator");
                    this._addItemToMenu(thisFilterMenu, items[extendedIndex]);
                }

                //ensure the correct state
                thisFilterMenu.filtercheckmenu("loadStateFromTags", selectedItems);
            }
        }
    };

    $.extend(SourceCode.Forms.Designers.Common.ViewObject.prototype, SourceCode.Forms.Designers.Common);
    SourceCode.Forms.Designers.Common.View = new SourceCode.Forms.Designers.Common.ViewObject();
    $.extend(SourceCode.Forms.Designers.Common.FormObject.prototype, SourceCode.Forms.Designers.Common);
    SourceCode.Forms.Designers.Common.Form = new SourceCode.Forms.Designers.Common.FormObject();
    $.extend(SourceCode.Forms.Designers.Common.RulesObject.prototype, SourceCode.Forms.Designers.Common);
    SourceCode.Forms.Designers.Common.Rules = new SourceCode.Forms.Designers.Common.RulesObject();

    //Setting a default context this will be overriden by the designers when they load
    SourceCode.Forms.Designers.Common.Context = SourceCode.Forms.Designers.Common.View;

    SourceCode.Forms.Designers.Icons =
    {
        List:
            [
                {
                    categories: ["COLUMN"],
                    display: "Acrobat Document",
                    name: "document-pdf"
                },
                {
                    categories: ["COLUMN"],
                    display: "Audio file (.mp3)",
                    name: "document-mp3"
                },
                {
                    categories: ["COLUMN"],
                    display: "Audio file (.wav)",
                    name: "document-wav"
                },
                {
                    categories: ["COLUMN"],
                    display: "Audio file (.wma)",
                    name: "document-wma"
                },
                {
                    categories: ["COLUMN"],
                    display: "Comma Seperated Values file",
                    name: "document-csv"
                },
                {
                    categories: ["COLUMN"],
                    display: "Compiled HTML Help file",
                    name: "document-chm"
                },
                {
                    categories: ["COLUMN"],
                    display: "Excel Worksheet",
                    name: "document-xls"
                },
                {
                    categories: ["COLUMN"],
                    display: "Generic",
                    name: "document-generic"
                },
                {
                    categories: ["COLUMN"],
                    display: "Group",
                    name: "group"
                },
                {
                    categories: ["COLUMN"],
                    display: "HTML Document",
                    name: "document-html"
                },
                {
                    categories: ["COLUMN"],
                    display: "Image file (.bmp)",
                    name: "document-bmp"
                },
                {
                    categories: ["COLUMN"],
                    display: "Infopath Form Template",
                    name: "document-xsn"
                },
                {
                    categories: ["COLUMN"],
                    display: "OneNote Document",
                    name: "document-one"
                },
                {
                    categories: ["COLUMN"],
                    display: "Power Point Presentation",
                    name: "document-ppt"
                },
                {
                    categories: ["COLUMN"],
                    display: "Role",
                    name: "role"
                },
                {
                    categories: ["COLUMN"],
                    display: "User",
                    name: "user"
                },
                {
                    categories: ["COLUMN"],
                    display: "Video file (.avi)",
                    name: "document-avi"
                },
                {
                    categories: ["COLUMN"],
                    display: "Video file (.mov)",
                    name: "document-mov"
                },
                {
                    categories: ["COLUMN"],
                    display: "Video file (.wmv)",
                    name: "document-wmv"
                },
                {
                    categories: ["COLUMN"],
                    display: "Word Document",
                    name: "document-doc"
                },
                {
                    categories: ["COLUMN"],
                    display: "View Flow",
                    name: "view-flow"
                },
                {
                    categories: ["COLUMN"],
                    display: "SmartObject",
                    name: "smartobject",
                    isSystem: true
                },
                {
                    categories: ["COLUMN"],
                    display: "Workflow",
                    name: "k2workflow",
                    isSystem: true
                },
                {
                    categories: ["COLUMN"],
                    display: "OAuth Resource Type",
                    name: "oauthresourcetype",
                    isSystem: true
                },
                {
                    categories: ["COLUMN"],
                    display: "OAuth Resource Parameter",
                    name: "oauthresourceparameter",
                    isSystem: true
                },
                {
                    categories: ["COLUMN"],
                    display: "OAuth Issuers",
                    name: "oauthissuers",
                    isSystem: true
                },
                {
                    categories: ["COLUMN"],
                    display: "Security Labels ",
                    name: "securitylabels",
                    isSystem: true
                },
                {
                    categories: ["COLUMN"],
                    display: "Realms",
                    name: "realms",
                    isSystem: true
                },
                {
                    categories: ["COLUMN"],
                    display: "Audiences",
                    name: "audiences",
                    isSystem: true
                },
                {
                    categories: ["COLUMN"],
                    display: "Service Instance",
                    name: "serviceinstance",
                    isSystem: true
                },
                {
                    categories: ["COLUMN"],
                    display: "Service Type",
                    name: "servicetype",
                    isSystem: true
                },
                {
                    categories: ["COLUMN"],
                    display: "Process Version",
                    name: "processversion",
                    isSystem: true
                },
                {
                    categories: ["COLUMN"],
                    display: "Process Instance",
                    name: "processinstance",
                    isSystem: true
                },
                {
                    categories: ["COLUMN"],
                    display: "Process XML Field",
                    name: "processxmlfield",
                    isSystem: true
                },
                {
                    categories: ["COLUMN"],
                    display: "Process Data Field",
                    name: "processdatafield",
                    isSystem: true
                },
                {
                    categories: ["COLUMN"],
                    display: "Working Hour Zone",
                    name: "workinghourzone",
                    isSystem: true
                },
                {
                    categories: ["COLUMN"],
                    display: "Day Of The Week",
                    name: "dayoftheweek",
                    isSystem: true
                },
                {
                    categories: ["COLUMN"],
                    display: "Exception Date",
                    name: "exceptiondate",
                    isSystem: true
                },
                {
                    categories: ["COLUMN"],
                    display: "Process Schedule",
                    name: "processschedule",
                    isSystem: true
                },
                {
                    categories: ["COLUMN"],
                    display: "Error Profile",
                    name: "errorprofile",
                    isSystem: true
                },
                {
                    categories: ["COLUMN"],
                    display: "Process Error",
                    name: "processerror",
                    isSystem: true
                },
                {
                    categories: ["COLUMN"],
                    display: "Exception Rule",
                    name: "oofexceptionrule",
                    isSystem: true
                },
                {
                    categories: ["COLUMN"],
                    display: "None",
                    name: "none"
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "Generic",
                    name: "generic"
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "Add",
                    name: "add"
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "Edit",
                    name: "edit"
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "Delete",
                    name: "delete"
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "Delete All",
                    name: "delete-all"
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "Load",
                    name: "load"
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "Save",
                    name: "save"
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "Refresh",
                    name: "refresh"
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "Security",
                    name: "security",
                    isSystem: true
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "Check-In",
                    name: "checkin"
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "Check-Out",
                    name: "checkout"
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "Undo Check-Out",
                    name: "undocheckout"
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "Filter",
                    name: "filter"
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "PDF Document",
                    name: "pdfdocument"
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "Excel Document",
                    name: "exceldocument"
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "Execute SmartObject",
                    name: "executesmartobject",
                    isSystem: true
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "Process Instances",
                    name: "processinstances",
                    isSystem: true
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "Process Rights",
                    name: "processrights",
                    isSystem: true
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "Roles",
                    name: "roles",
                    isSystem: true
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "Start Process",
                    name: "startprocess",
                    isSystem: true
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "Start Process Instance",
                    name: "startprocessinstance",
                    isSystem: true
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "Stop Process Instance",
                    name: "stopprocessinstance",
                    isSystem: true
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "Go To Activity",
                    name: "gotoactivity",
                    isSystem: true
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "View Flow",
                    name: "viewflow",
                    isSystem: true
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "Set as Default",
                    name: "setasdefault",
                    isSystem: true
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "Set as Default Zone",
                    name: "setdefaultworkinghourzone",
                    isSystem: true
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "Retry Instance",
                    name: "retryinstance",
                    isSystem: true
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "Error Full Details",
                    name: "errorfulldetail",
                    isSystem: true
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "Delegate Worklist Item",
                    name: "worklistdelegateitem",
                    isSystem: true
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "Redirect Worklist Item",
                    name: "worklistredirect",
                    isSystem: true
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "Release Worklist Item",
                    name: "worklistrelease",
                    isSystem: true
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "Search",
                    name: "search",
                    isSystem: true
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "Exclusion on",
                    name: "exclude-on",
                    isSystem: true
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "Exclusion off",
                    name: "exclude-off",
                    isSystem: true
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "Exclude data",
                    name: "excludedata-on",
                    isSystem: true
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "Include data",
                    name: "excludedata-off",
                    isSystem: true
                },
                {
                    categories: ["TOOLBARBUTTON"],
                    display: "None",
                    name: "none"
                }
            ]

    };

})(jQuery);
