/* global SourceCode: true */
/* global Resources: true */
/* global checkExists: false */
/* global checkExistsNotEmpty: false */
/* global popupManager: false */
/* global parseXML: false */
/* global tryParseXML: false */
/* global $chk: false */

(function ($)
{

    // Namespacing the Designer
    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Designers === "undefined" || SourceCode.Forms.Designers === null) SourceCode.Forms.Designers = {};
    if (typeof SourceCode.Forms.Designers.View === "undefined" || SourceCode.Forms.Designers.View === null) SourceCode.Forms.Designers.View = {};

    var _viewDesigner = SourceCode.Forms.Designers.View.ViewDesigner =
        {
            _internalListingControlsRegex: /DropDown|MultiSelectCheckBox|RadioButtonList|ListDisplay|Choice|MultiSelect|BarChart|QueryConfigurator|ListBox/i,

            _dataSourceControlTypesRegex: /DropDown|MultiSelectCheckBox|RadioButtonList|ListDisplay|Choice|MultiSelect|BarChart|QueryConfigurator|ListBox|AutoComplete|Lookup|Picker/i,

            _columnDragDrop: false,

            _isLegacyListingControl: function (controlType)
            {
                var internalListingControlsRegex = _viewDesigner._internalListingControlsRegex;
                internalListingControlsRegex.lastIndex = 0;
                return internalListingControlsRegex.test(controlType);
            },

            _isDataSourceControl: function (controlType)
            {
                var regex = _viewDesigner._dataSourceControlTypesRegex;
                regex.lastIndex = 0;
                return regex.test(controlType);
            },

            _checkPropertiesContainDataSource: function (propertiesXML)
            {
                var hasDataSource = false;

                if (!checkExists(propertiesXML))
                {
                    return false;
                }

                var propertyNode = propertiesXML.selectSingleNode('Property[Name="AssociationSO"]');

                if (checkExists(propertyNode))
                {
                    hasDataSource = true;
                }

                return hasDataSource;
            },

            _selectViewEventTreeNode: function (ev, ui)
            {
                var toolFormEventsTabEdit = _viewDesigner.View.element.find('#vdtoolFormEventsTabEdit');
                var toolFormEventsTabDelete = _viewDesigner.View.element.find('#vdtoolFormEventsTabDelete');

                switch (ui.node.metadata().icon)
                {
                    case 'view-event':
                    case 'event':
                        toolFormEventsTabEdit.removeClass('disabled');
                        toolFormEventsTabDelete.removeClass('disabled');
                        break;
                    default:
                        toolFormEventsTabEdit.addClass('disabled');
                        toolFormEventsTabDelete.addClass('disabled');
                        break;
                }
            },

            _getViewType: function ()
            {
                var ViewType = 'Capture'; //Default to capture view

                var xmlDoc = _viewDesigner.View.viewDefinitionXML;
                if (checkExists(xmlDoc))
                {
                    var ViewElem = xmlDoc.selectSingleNode('//Views/View');
                    if (checkExists(ViewElem))
                    {
                        var viewTypeAttr = ViewElem.getAttribute('Type');
                        if (checkExists(viewTypeAttr))
                        {
                            ViewType = viewTypeAttr;
                            // HACK: Need to convert value as we use CaptureList in the context of the UI
                            if (ViewType === "List")
                            {
                                ViewType = "CaptureList";
                            }
                        }

                        _viewDesigner.View.SelectedViewType = ViewType;
                    }
                }

                return ViewType;
            },


            //Happens when the view type is changed in the General Step
            _selectViewTypePrompt: function (ViewType)
            {

                //local function
                function changeViewType(type)
                {
                    _viewDesigner._selectViewType(type);
                    _viewDesigner.View.hasViewTypeChanged = true;
                }

                if (!_viewDesigner.View.layoutExists())
                {
                    changeViewType(ViewType);
                }
                else
                {
                    if (ViewType !== _viewDesigner.View.PreviousSelectedViewType)
                    {
                        //confirmation popup
                        var options = ({
                            message: Resources.ViewDesigner.ChangeViewTypePrompt, //Resources.ViewDesigner.RemoveActionPrompt
                            iconClass: "warning",
                            onAccept: function ()
                            {
                                changeViewType(ViewType);
                                popupManager.closeLast();
                            }
                        });
                        popupManager.showConfirmation(options);
                    }
                    else
                    {
                        _viewDesigner._selectViewType(ViewType);
                        _viewDesigner.View.hasViewTypeChanged = false;
                    }
                }
            },

            _selectViewType: function (ViewType)
            {
                _viewDesigner._setViewType(ViewType);
                _viewDesigner._setDesignerType(ViewType);

                var vdlbl_listViewGetListMethod = _viewDesigner.View.element.find("#vdlbl_listViewGetListMethod");
                if (!checkExistsNotEmpty(vdlbl_listViewGetListMethod.val()))
                {
                    _viewDesigner._loadSOMethods(true);
                    _viewDesigner.View.ddlistmethod.dropdown("refresh");
                }
                _viewDesigner._applyViewOptionsUserSettings();
                _viewDesigner._defaultOptionsStep(false);
            },

            _ClearViewFields: function ()
            {
                var viewElem = _viewDesigner._getViewElem(_viewDesigner.View.viewDefinitionXML);
                if ($chk(viewElem) === true)
                {
                    var SourcesElem = viewElem.selectSingleNode('Sources');
                    if ($chk(SourcesElem) === true)
                    {
                        _viewDesigner._removeXMLChildNodes(SourcesElem);
                    }
                }
            },

            _clearViewEvents: function ()
            {
                var writeBack = false;
                var viewElem = _viewDesigner._getViewElem(_viewDesigner.View.viewDefinitionXML);

                if ($chk(viewElem) === true)
                {
                    var eventsElem = viewElem.selectSingleNode('Events');
                    if ($chk(eventsElem) === true)
                    {
                        _viewDesigner._removeXMLChildNodes(eventsElem);
                    }
                }
            },

            _getViewMethods: function ()
            {
                var viewType = _viewDesigner._getViewType();
                var listxmlDoc = parseXML('<Items/>');
                var MethodParentDiv = _viewDesigner.View.element.find('#MethodParent');
                var ParentItem = listxmlDoc.createElement('Item');
                var ChildItems = listxmlDoc.createElement('Items');
                var parentName = listxmlDoc.createElement('Name');
                var parentDisplayName = listxmlDoc.createElement('DisplayName');

                ParentItem.setAttribute('ItemType', 'Object');
                ParentItem.setAttribute('Guid', '');
                ParentItem.appendChild(ChildItems);
                ParentItem.appendChild(parentName);
                ParentItem.appendChild(parentDisplayName);
                listxmlDoc.documentElement.appendChild(ParentItem);

                if (MethodParentDiv.length > 0)
                {
                    var MethodList = MethodParentDiv.children('div');
                    if ($chk(MethodList) === true)
                    {
                        if (MethodList.length > 0)
                        {
                            ParentItem.setAttribute('Guid', MethodParentDiv.attr('soguid'));
                            parentName.appendChild(listxmlDoc.createTextNode(MethodParentDiv.attr('soname')));
                            parentDisplayName.appendChild(listxmlDoc.createTextNode(MethodParentDiv.attr('sofriendlyname')));
                        }
                        for (var i = 0; i < MethodList.length; i++)
                        {
                            var MethodDiv = $(MethodList[i]);
                            if (MethodDiv.length > 0)
                            {
                                var MethodName = MethodDiv.attr('methodid');
                                var MethodDisplayName = MethodDiv.attr('friendlyname');
                                var subType = MethodDiv.attr("methodType");

                                if ((viewType === "Capture" && subType !== "list") || viewType === "CaptureList")
                                {
                                    var ItemElem = listxmlDoc.createElement('Item');
                                    var ItemName = listxmlDoc.createElement('Name');
                                    var ItemValue = listxmlDoc.createElement('Value');
                                    var ItemDisplayName = listxmlDoc.createElement('DisplayName');

                                    ItemElem.setAttribute('ItemType', 'Method');
                                    ItemElem.setAttribute('SubType', subType);
                                    ItemName.appendChild(listxmlDoc.createTextNode(MethodName));
                                    ItemValue.appendChild(listxmlDoc.createTextNode(MethodName));
                                    ItemDisplayName.appendChild(listxmlDoc.createTextNode(MethodDisplayName));
                                    ItemElem.appendChild(ItemName);
                                    ItemElem.appendChild(ItemDisplayName);
                                    ItemElem.appendChild(ItemValue);
                                    ChildItems.appendChild(ItemElem);
                                }
                            }
                        }
                    }
                }

                //Clear Method
                var ItemElem = listxmlDoc.createElement('Item');
                var ItemName = listxmlDoc.createElement('Name');
                var ItemValue = listxmlDoc.createElement('Value');
                var ItemDisplayName = listxmlDoc.createElement('DisplayName');

                ItemElem.setAttribute('ItemType', 'ViewMethod');
                ItemName.appendChild(listxmlDoc.createTextNode('Clear'));
                ItemDisplayName.appendChild(listxmlDoc.createTextNode('Clear'));
                ItemValue.appendChild(listxmlDoc.createTextNode('Clear'));
                ItemElem.appendChild(ItemName);
                ItemElem.appendChild(ItemDisplayName);
                ItemElem.appendChild(ItemValue);
                listxmlDoc.documentElement.appendChild(ItemElem);

                // Initialize Method
                ItemElem = listxmlDoc.createElement('Item');
                ItemName = listxmlDoc.createElement('Name');
                ItemValue = listxmlDoc.createElement('Value');
                ItemDisplayName = listxmlDoc.createElement('DisplayName');

                ItemElem.setAttribute('ItemType', 'ViewMethod');
                ItemName.appendChild(listxmlDoc.createTextNode('Init'));
                ItemDisplayName.appendChild(listxmlDoc.createTextNode('Initialize'));
                ItemValue.appendChild(listxmlDoc.createTextNode('Init'));
                ItemElem.appendChild(ItemName);
                ItemElem.appendChild(ItemDisplayName);
                ItemElem.appendChild(ItemValue);
                listxmlDoc.documentElement.appendChild(ItemElem);

                // Post Initialize Method
                ItemElem = listxmlDoc.createElement('Item');
                ItemName = listxmlDoc.createElement('Name');
                ItemValue = listxmlDoc.createElement('Value');
                ItemDisplayName = listxmlDoc.createElement('DisplayName');

                ItemElem.setAttribute('ItemType', 'ViewMethod');
                ItemName.appendChild(listxmlDoc.createTextNode('PostInit'));
                ItemDisplayName.appendChild(listxmlDoc.createTextNode(Resources.ViewDesigner.ViewEvent_PostInit));
                ItemValue.appendChild(listxmlDoc.createTextNode('PostInit'));
                ItemElem.appendChild(ItemName);
                ItemElem.appendChild(ItemDisplayName);
                ItemElem.appendChild(ItemValue);
                listxmlDoc.documentElement.appendChild(ItemElem);

                // Error Method
                ItemElem = listxmlDoc.createElement('Item');
                ItemName = listxmlDoc.createElement('Name');
                ItemValue = listxmlDoc.createElement('Value');
                ItemDisplayName = listxmlDoc.createElement('DisplayName');

                ItemElem.setAttribute('ItemType', 'ViewMethod');
                ItemName.appendChild(listxmlDoc.createTextNode('OnError'));
                ItemDisplayName.appendChild(listxmlDoc.createTextNode(Resources.ViewDesigner.ViewEvent_Error));
                ItemValue.appendChild(listxmlDoc.createTextNode('OnError'));
                ItemElem.appendChild(ItemName);
                ItemElem.appendChild(ItemDisplayName);
                ItemElem.appendChild(ItemValue);
                listxmlDoc.documentElement.appendChild(ItemElem);

                // Add Error Method Parameters
                var viewMethodItemsNode = listxmlDoc.createElement('Items');
                ItemElem.appendChild(viewMethodItemsNode);

                ItemElem = listxmlDoc.createElement('Item');
                ItemName = listxmlDoc.createElement('Name');
                ItemValue = listxmlDoc.createElement('Value');
                ItemDisplayName = listxmlDoc.createElement('DisplayName');

                ItemElem.setAttribute('ItemType', 'MethodParameter');
                ItemName.appendChild(listxmlDoc.createTextNode('ErrorMessage'));
                ItemDisplayName.appendChild(listxmlDoc.createTextNode(Resources.ViewDesigner.SystemEventErrorMessageParameter));
                ItemValue.appendChild(listxmlDoc.createTextNode('ErrorMessage'));
                ItemElem.appendChild(ItemName);
                ItemElem.appendChild(ItemDisplayName);
                ItemElem.appendChild(ItemValue);
                viewMethodItemsNode.appendChild(ItemElem);

                ItemElem = listxmlDoc.createElement('Item');
                ItemName = listxmlDoc.createElement('Name');
                ItemValue = listxmlDoc.createElement('Value');
                ItemDisplayName = listxmlDoc.createElement('DisplayName');

                ItemElem.setAttribute('ItemType', 'MethodParameter');
                ItemName.appendChild(listxmlDoc.createTextNode('ErrorDetail'));
                ItemDisplayName.appendChild(listxmlDoc.createTextNode(Resources.ViewDesigner.SystemEventErrorDetailParameter));
                ItemValue.appendChild(listxmlDoc.createTextNode('ErrorDetail'));
                ItemElem.appendChild(ItemName);
                ItemElem.appendChild(ItemDisplayName);
                ItemElem.appendChild(ItemValue);
                viewMethodItemsNode.appendChild(ItemElem);

                ItemElem = listxmlDoc.createElement('Item');
                ItemName = listxmlDoc.createElement('Name');
                ItemValue = listxmlDoc.createElement('Value');
                ItemDisplayName = listxmlDoc.createElement('DisplayName');

                ItemElem.setAttribute('ItemType', 'MethodParameter');
                ItemName.appendChild(listxmlDoc.createTextNode('ErrorType'));
                ItemDisplayName.appendChild(listxmlDoc.createTextNode(Resources.ViewDesigner.SystemEventErrorTypeParameter));
                ItemValue.appendChild(listxmlDoc.createTextNode('ErrorType'));
                ItemElem.appendChild(ItemName);
                ItemElem.appendChild(ItemDisplayName);
                ItemElem.appendChild(ItemValue);
                viewMethodItemsNode.appendChild(ItemElem);

                //Expand Method
                ItemElem = listxmlDoc.createElement('Item');
                ItemName = listxmlDoc.createElement('Name');
                ItemValue = listxmlDoc.createElement('Value');
                ItemDisplayName = listxmlDoc.createElement('DisplayName');

                ItemElem.setAttribute('ItemType', 'ViewMethod');
                ItemName.appendChild(listxmlDoc.createTextNode('Expand'));
                ItemDisplayName.appendChild(listxmlDoc.createTextNode(Resources.ViewDesigner.ViewEvent_Expand));
                ItemValue.appendChild(listxmlDoc.createTextNode('Expand'));
                ItemElem.appendChild(ItemName);
                ItemElem.appendChild(ItemDisplayName);
                ItemElem.appendChild(ItemValue);
                listxmlDoc.documentElement.appendChild(ItemElem);

                //Collapse Method
                ItemElem = listxmlDoc.createElement('Item');
                ItemName = listxmlDoc.createElement('Name');
                ItemValue = listxmlDoc.createElement('Value');
                ItemDisplayName = listxmlDoc.createElement('DisplayName');

                ItemElem.setAttribute('ItemType', 'ViewMethod');
                ItemName.appendChild(listxmlDoc.createTextNode('Collapse'));
                ItemDisplayName.appendChild(listxmlDoc.createTextNode(Resources.ViewDesigner.ViewEvent_Collapse));
                ItemValue.appendChild(listxmlDoc.createTextNode('Collapse'));
                ItemElem.appendChild(ItemName);
                ItemElem.appendChild(ItemDisplayName);
                ItemElem.appendChild(ItemValue);
                listxmlDoc.documentElement.appendChild(ItemElem);

                if (viewType !== 'Capture')
                {
                    // List refresh Method
                    var ItemElem1 = listxmlDoc.createElement('Item');
                    var ItemName1 = listxmlDoc.createElement('Name');
                    var ItemValue1 = listxmlDoc.createElement('Value');
                    var ItemDisplayName1 = listxmlDoc.createElement('DisplayName');

                    ItemElem1.setAttribute('ItemType', 'ViewMethod');
                    ItemName1.appendChild(listxmlDoc.createTextNode('ListRefresh'));
                    ItemDisplayName1.appendChild(listxmlDoc.createTextNode(Resources.ViewDesigner.ViewEvent_ListRefresh));
                    ItemValue1.appendChild(listxmlDoc.createTextNode('ListRefresh'));
                    ItemElem1.appendChild(ItemName1);
                    ItemElem1.appendChild(ItemDisplayName1);
                    ItemElem1.appendChild(ItemValue1);
                    listxmlDoc.documentElement.appendChild(ItemElem1);

                    ItemElem = listxmlDoc.createElement('Item');
                    ItemName = listxmlDoc.createElement('Name');
                    ItemValue = listxmlDoc.createElement('Value');
                    ItemDisplayName = listxmlDoc.createElement('DisplayName');

                    ItemElem.setAttribute('ItemType', 'ViewEvent');
                    ItemName.appendChild(listxmlDoc.createTextNode('ListClick'));
                    ItemDisplayName.appendChild(listxmlDoc.createTextNode(Resources.ViewDesigner.ViewEvent_ListClick));
                    ItemValue.appendChild(listxmlDoc.createTextNode('ListClick'));
                    ItemElem.appendChild(ItemName);
                    ItemElem.appendChild(ItemDisplayName);
                    ItemElem.appendChild(ItemValue);
                    listxmlDoc.documentElement.appendChild(ItemElem);

                    var ItemElem2 = listxmlDoc.createElement('Item');
                    var ItemName2 = listxmlDoc.createElement('Name');
                    var ItemValue2 = listxmlDoc.createElement('Value');
                    var ItemDisplayName2 = listxmlDoc.createElement('DisplayName');

                    ItemElem2.setAttribute('ItemType', 'ViewEvent');
                    ItemName2.appendChild(listxmlDoc.createTextNode('ListDoubleClick'));
                    ItemDisplayName2.appendChild(listxmlDoc.createTextNode(Resources.ViewDesigner.ViewEvent_ListDoubleClick));
                    ItemValue2.appendChild(listxmlDoc.createTextNode('ListDoubleClick'));
                    ItemElem2.appendChild(ItemName2);
                    ItemElem2.appendChild(ItemDisplayName2);
                    ItemElem2.appendChild(ItemValue2);
                    listxmlDoc.documentElement.appendChild(ItemElem2);
                    //ListEditable

                    // Export to Excel.
                    ItemElem = listxmlDoc.createElement('Item');
                    ItemName = listxmlDoc.createElement('Name');
                    ItemValue = listxmlDoc.createElement('Value');
                    ItemDisplayName = listxmlDoc.createElement('DisplayName');

                    ItemElem.setAttribute('ItemType', 'ViewMethod');
                    ItemName.appendChild(listxmlDoc.createTextNode('ListExportExcel'));
                    ItemDisplayName.appendChild(listxmlDoc.createTextNode(Resources.ViewDesigner.ViewEvent_ListExportExcel));
                    ItemValue.appendChild(listxmlDoc.createTextNode('ListExportExcel'));
                    ItemElem.appendChild(ItemName);
                    ItemElem.appendChild(ItemDisplayName);
                    ItemElem.appendChild(ItemValue);
                    listxmlDoc.documentElement.appendChild(ItemElem);

                    //exportExcelProps.Add(Guid.Empty, 0, "RowLimit", SR.GetString(SR.ViewMethodListExportExcel_RowLimitProperty), null, DataType.Number, ItemType.MethodOptionalProperty, "RowLimit");
                    //exportExcelProps.Add(Guid.Empty, 0, "AllPages", SR.GetString(SR.ViewMethodListExportExcel_AllPagesProperty), null, DataType.YesNo, ItemType.MethodOptionalProperty, "AllPages");

                    viewMethodItemsNode = listxmlDoc.createElement('Items');
                    ItemElem.appendChild(viewMethodItemsNode);

                    ItemElem = listxmlDoc.createElement('Item');
                    ItemName = listxmlDoc.createElement('Name');
                    ItemValue = listxmlDoc.createElement('Value');
                    ItemDisplayName = listxmlDoc.createElement('DisplayName');

                    ItemElem.setAttribute('ItemType', 'MethodOptionalProperty');
                    ItemElem.setAttribute('SubType', 'Number');
                    ItemName.appendChild(listxmlDoc.createTextNode('RowLimit'));
                    ItemDisplayName.appendChild(listxmlDoc.createTextNode(Resources.ViewDesigner.ViewMethodListExportExcel_RowLimitProperty));
                    ItemValue.appendChild(listxmlDoc.createTextNode('RowLimit'));
                    ItemElem.appendChild(ItemName);
                    ItemElem.appendChild(ItemDisplayName);
                    ItemElem.appendChild(ItemValue);
                    viewMethodItemsNode.appendChild(ItemElem);

                    ItemElem = listxmlDoc.createElement('Item');
                    ItemName = listxmlDoc.createElement('Name');
                    ItemValue = listxmlDoc.createElement('Value');
                    ItemDisplayName = listxmlDoc.createElement('DisplayName');

                    ItemElem.setAttribute('ItemType', 'MethodOptionalProperty');
                    ItemElem.setAttribute('SubType', 'YesNo');
                    ItemName.appendChild(listxmlDoc.createTextNode('AllPages'));
                    ItemDisplayName.appendChild(listxmlDoc.createTextNode(Resources.ViewDesigner.ViewMethodListExportExcel_AllPagesProperty));
                    ItemValue.appendChild(listxmlDoc.createTextNode('AllPages'));
                    ItemElem.appendChild(ItemName);
                    ItemElem.appendChild(ItemDisplayName);
                    ItemElem.appendChild(ItemValue);
                    viewMethodItemsNode.appendChild(ItemElem);

                    var isEditableList = _viewDesigner.View.viewDefinitionXML.selectNodes("//Views/View/Controls/Control[@Type='View']/Properties/Property[Name/text()='ListEditable']");
                    if (viewType === 'CaptureList' && isEditableList.length > 0)
                    {
                        var ItemElem3 = listxmlDoc.createElement('Item');
                        var ItemName3 = listxmlDoc.createElement('Name');
                        var ItemValue3 = listxmlDoc.createElement('Value');
                        var ItemDisplayName3 = listxmlDoc.createElement('DisplayName');

                        //
                        ItemElem3.setAttribute('ItemType', 'ViewEvent');
                        ItemName3.appendChild(listxmlDoc.createTextNode('ListItemAdded'));
                        ItemDisplayName3.appendChild(listxmlDoc.createTextNode(Resources.ViewDesigner.ViewEvent_Added));
                        ItemValue3.appendChild(listxmlDoc.createTextNode('ListItemAdded'));
                        ItemElem3.appendChild(ItemName3);
                        ItemElem3.appendChild(ItemDisplayName3);
                        ItemElem3.appendChild(ItemValue3);
                        listxmlDoc.documentElement.appendChild(ItemElem3);

                        var ItemElem4 = listxmlDoc.createElement('Item');
                        var ItemName4 = listxmlDoc.createElement('Name');
                        var ItemValue4 = listxmlDoc.createElement('Value');
                        var ItemDisplayName4 = listxmlDoc.createElement('DisplayName');

                        ItemElem4.setAttribute('ItemType', 'ViewEvent');
                        ItemName4.appendChild(listxmlDoc.createTextNode('ListItemRemoved'));
                        ItemDisplayName4.appendChild(listxmlDoc.createTextNode(Resources.ViewDesigner.ViewEvent_Removed));
                        ItemValue4.appendChild(listxmlDoc.createTextNode('ListItemRemoved'));
                        ItemElem4.appendChild(ItemName4);
                        ItemElem4.appendChild(ItemDisplayName4);
                        ItemElem4.appendChild(ItemValue4);
                        listxmlDoc.documentElement.appendChild(ItemElem4);

                        var ItemElem5 = listxmlDoc.createElement('Item');
                        var ItemName5 = listxmlDoc.createElement('Name');
                        var ItemValue5 = listxmlDoc.createElement('Value');
                        var ItemDisplayName5 = listxmlDoc.createElement('DisplayName');

                        ItemElem5.setAttribute('ItemType', 'ViewEvent');
                        ItemName5.appendChild(listxmlDoc.createTextNode('ListItemChanged'));
                        ItemDisplayName5.appendChild(listxmlDoc.createTextNode(Resources.ViewDesigner.ViewEvent_Changed));
                        ItemValue5.appendChild(listxmlDoc.createTextNode('ListItemChanged'));
                        ItemElem5.appendChild(ItemName5);
                        ItemElem5.appendChild(ItemDisplayName5);
                        ItemElem5.appendChild(ItemValue5);
                        listxmlDoc.documentElement.appendChild(ItemElem5);

                        var ItemElem6 = listxmlDoc.createElement('Item');
                        var ItemName6 = listxmlDoc.createElement('Name');
                        var ItemValue6 = listxmlDoc.createElement('Value');
                        var ItemDisplayName6 = listxmlDoc.createElement('DisplayName');

                        ItemElem6.setAttribute('ItemType', 'ViewEvent');
                        ItemName6.appendChild(listxmlDoc.createTextNode('ListRowAdded'));
                        ItemDisplayName6.appendChild(listxmlDoc.createTextNode(Resources.ViewDesigner.ViewEvent_RowAdded));
                        ItemValue6.appendChild(listxmlDoc.createTextNode('ListRowAdded'));
                        ItemElem6.appendChild(ItemName6);
                        ItemElem6.appendChild(ItemDisplayName6);
                        ItemElem6.appendChild(ItemValue6);
                        listxmlDoc.documentElement.appendChild(ItemElem6);
                    }
                    //
                }

                return listxmlDoc.xml;
            },

            _getViewObjects: function (includeControlProperties, tmpViewDefinition)
            {
                var viewType = _viewDesigner._getViewType();
                var viewId = _viewDesigner._GetViewID();
                var listxmlDoc = parseXML('<Items/>');

                //View
                var ViewItemElem = listxmlDoc.createElement('Item');
                ViewItemElem.setAttribute('Guid', _viewDesigner._GetViewID());
                ViewItemElem.setAttribute('ItemType', 'View');
                var ViewItemName = listxmlDoc.createElement('Name');
                var ViewItemDisplayName = listxmlDoc.createElement('DisplayName');
                var ViewItemDescription = listxmlDoc.createElement('Description');
                var ViewItemFieldItems = listxmlDoc.createElement('Items');

                ViewItemName.appendChild(listxmlDoc.createTextNode(_viewDesigner._GetViewName()));
                ViewItemDisplayName.appendChild(listxmlDoc.createTextNode(_viewDesigner._GetViewDisplayName()));
                ViewItemDescription.appendChild(listxmlDoc.createTextNode(_viewDesigner._GetViewDescription()));
                ViewItemElem.appendChild(ViewItemName);
                ViewItemElem.appendChild(ViewItemDisplayName);
                ViewItemElem.appendChild(ViewItemDescription);
                ViewItemElem.appendChild(ViewItemFieldItems);
                listxmlDoc.documentElement.appendChild(ViewItemElem);

                //View Controls
                var viewXmlDoc = checkExists(tmpViewDefinition) ? tmpViewDefinition : _viewDesigner.View.viewDefinitionXML;
                var ControlList = viewXmlDoc.documentElement.selectNodes('Views/View/Controls/Control');

                for (var i = 0; i < ControlList.length; i++)
                {
                    var ControlElem = ControlList[i];
                    var ControlId = ControlElem.getAttribute('ID');
                    var ControlName = _viewDesigner._getControlProperty(ControlId, 'ControlName');
                    var ControlType = ControlElem.getAttribute('Type');
                    var ControlCategory = _viewDesigner._getControlCategory(ControlType);
                    var AssociationSO = _viewDesigner._getControlProperty(ControlId, 'AssociationSO');
                    var AssociationMethod = _viewDesigner._getControlProperty(ControlId, 'AssociationMethod');
                    var ControlText = _viewDesigner._getControlProperty(ControlId, 'Text');
                    var ControlTooltip = _viewDesigner._getControlProperty(ControlId, 'Tooltip');
                    var ControlWatermarkText = _viewDesigner._getControlProperty(ControlId, 'WaterMarkText');
                    var DataSourceType = _viewDesigner._getControlProperty(ControlId, 'DataSourceType');

                    if (ControlName === '')
                    {
                        ControlName = ControlElem.selectSingleNode('Name').text;
                    }

                    var ItemElem = listxmlDoc.createElement('Item');
                    var ItemName = listxmlDoc.createElement('Name');
                    var ItemDisplayName = listxmlDoc.createElement('DisplayName');
                    var ItemCategory = listxmlDoc.createElement('Category');
                    var ItemAssociationSO = listxmlDoc.createElement('AssociationSO');
                    var ItemAssociationMethod = listxmlDoc.createElement('AssociationMethod');
                    var ItemDataSourceType = listxmlDoc.createElement('DataSourceType');


                    var controlID = ControlElem.getAttribute('ID');
                    ItemElem.setAttribute('ItemType', 'Control');
                    ItemElem.setAttribute('Guid', controlID);
                    var dataType = ControlElem.selectSingleNode('Properties/Property[Name/text()="DataType"]/Value');
                    if (dataType)
                        ItemElem.setAttribute('DataType', dataType.text);
                    if (ControlElem.getAttribute('Type'))
                        ItemElem.setAttribute('SubType', ControlElem.getAttribute('Type'));
                    ItemName.appendChild(listxmlDoc.createTextNode(ControlName));
                    ItemDisplayName.appendChild(listxmlDoc.createTextNode(ControlName));
                    ItemCategory.appendChild(listxmlDoc.createTextNode(ControlCategory));
                    viewType = _viewDesigner._getViewType();
                    var isListView = viewType === 'CaptureList';

                    if (isListView)
                    {
                        //find the template row if
                        var idattrib = viewXmlDoc.documentElement.selectSingleNode("Views/View/Canvas/Sections/Section[@Type='Body']/Control/Rows/Row[Cells/Cell/Control[@ID='{0}']]/@ID".format(controlID));
                        if (checkExists(idattrib))
                        {
                            idattrib = idattrib.text;
                            var rowTemplate = viewXmlDoc.documentElement.selectSingleNode("Views/View/Controls/Control[@ID='{0}']/Properties/Property[Name='Template']/Value".format(idattrib));
                            if (checkExists(rowTemplate))
                            {
                                rowTemplate = rowTemplate.text;
                                var templateNode = listxmlDoc.createElement('Template');
                                templateNode.appendChild(listxmlDoc.createTextNode(rowTemplate));
                                ItemElem.appendChild(templateNode);
                            }
                        }
                    }

                    if (ControlTooltip !== "")
                    {
                        var ItemTooltip = listxmlDoc.createElement('Tooltip');
                        ItemTooltip.appendChild(listxmlDoc.createTextNode(ControlTooltip));
                        ItemElem.appendChild(ItemTooltip);
                    }

                    if (ControlWatermarkText !== "")
                    {
                        var ItemWatermarkText = listxmlDoc.createElement('WatermarkText');
                        ItemWatermarkText.appendChild(listxmlDoc.createTextNode(ControlWatermarkText));
                        ItemElem.appendChild(ItemWatermarkText);
                    }

                    if (ControlText !== "")
                    {
                        var ItemText = listxmlDoc.createElement('Text');
                        ItemText.appendChild(listxmlDoc.createTextNode(ControlText));
                        ItemElem.appendChild(ItemText);
                    }

                    ItemElem.appendChild(ItemName);
                    ItemElem.appendChild(ItemDisplayName);
                    ItemElem.appendChild(ItemCategory);
                    if ($chk(AssociationSO) === true)
                    {
                        _viewDesigner._setItemNodeValidation(ItemAssociationSO, controlID, 'AssociationSO');

                        ItemAssociationSO.appendChild(listxmlDoc.createTextNode(AssociationSO));
                        ItemElem.appendChild(ItemAssociationSO);

                        if ($chk(AssociationMethod) === true)
                        {
                            _viewDesigner._setItemNodeValidation(ItemAssociationMethod, controlID, 'AssociationMethod');

                            ItemAssociationMethod.appendChild(listxmlDoc.createTextNode(AssociationMethod));
                            ItemElem.appendChild(ItemAssociationMethod);
                        }
                    }

                    if (checkExistsNotEmpty(DataSourceType))
                    {
                        ItemDataSourceType.appendChild(listxmlDoc.createTextNode(DataSourceType));
                        ItemElem.appendChild(ItemDataSourceType);
                    }

                    ViewItemFieldItems.appendChild(ItemElem);

                    if (includeControlProperties)
                    {
                        //SourceCode.Forms.Designers.Common.getControlTypeProperties(ItemElem, controlID, ControlType);
                        ItemElem.setAttribute("HasProperties", "True");
                    }
                }
                //End View Controls

                //primary fields
                var PropParentDiv = _viewDesigner.View.element.find('#PropParent');
                var soguid, sofriendlyname, soname;
                //get primary fields			
                var PrimarySourceElem = viewXmlDoc.selectSingleNode('//Sources/Source[@ContextType="Primary"]');
                if (PropParentDiv.length > 0)
                {
                    var primary = listxmlDoc.createElement('Item');
                    var primaryName = listxmlDoc.createElement('Name');
                    var primaryDisplayName = listxmlDoc.createElement('DisplayName');
                    var primaryDescription = listxmlDoc.createElement('Description');
                    var primaryItems = listxmlDoc.createElement('Items');
                    var primaryValue = listxmlDoc.createElement('Value');

                    soguid = PropParentDiv.attr('soguid');
                    sofriendlyname = PropParentDiv.attr('sofriendlyname');
                    sodescription = PropParentDiv.attr('sodescription');
                    soname = PropParentDiv.attr('soname');

                    primary.setAttribute('Guid', soguid);
                    primary.setAttribute('ItemType', 'FieldContext');
                    primary.setAttribute('SubType', 'User');

                    primaryName.appendChild(listxmlDoc.createTextNode(soname));
                    primary.appendChild(primaryName);

                    primaryDisplayName.appendChild(listxmlDoc.createTextNode(sofriendlyname));
                    primary.appendChild(primaryDisplayName);

                    primaryDescription.appendChild(listxmlDoc.createTextNode(sodescription));
                    primary.appendChild(primaryDescription);

                    primaryValue.appendChild(listxmlDoc.createTextNode(soguid));
                    primary.appendChild(primaryValue);

                    primary.appendChild(primaryItems);
                    if ($chk(PrimarySourceElem) === true)
                    {
                        var primarySourceID = PrimarySourceElem.getAttribute("ID");
                        primary.setAttribute('Guid', primarySourceID);

                        var FieldList = SourceCode.Forms.DependencyHelper.getSourceFieldNodes(PrimarySourceElem);
                        if ($chk(FieldList) === true)
                        {
                            var primarySourceId = PrimarySourceElem.getAttribute('SourceID');

                            for (var i = 0; i < FieldList.length; i++)
                            {
                                var createViewFieldItemOptions = {
                                    fieldElem: FieldList[i],
                                    itemsXmlDoc: listxmlDoc,
                                    fieldSmoGuid: primarySourceId
                                };

                                var itemElem = _viewDesigner._createViewFieldItem(createViewFieldItemOptions);

                                primaryItems.appendChild(itemElem);
                            }
                        }
                    }
                    ViewItemFieldItems.appendChild(primary);
                }

                //association / external fields
                var OtherSourceElems = viewXmlDoc.selectNodes('//Sources/Source[@ContextType!="Primary"]');
                if ($chk(OtherSourceElems) === true)
                {
                    for (var j = 0; j < OtherSourceElems.length; j++)
                    {
                        var OtherSourceElem = OtherSourceElems[j];
                        var FieldSOGuid = OtherSourceElem.getAttribute('SourceID');
                        var FieldContextID = OtherSourceElem.getAttribute('ContextID');
                        var associationControlType = _viewDesigner._getControlType(FieldContextID);
                        var controlContextID = OtherSourceElem.getAttribute("ContextID");
                        var FieldContextType = OtherSourceElem.getAttribute('ContextType');
                        var associatedSOName = OtherSourceElem.selectSingleNode('Name').text;
                        var assocSODispNameElem = OtherSourceElem.selectSingleNode('DisplayName');
                        var associatedSODisplayName = checkExists(assocSODispNameElem) ? assocSODispNameElem.text : associatedSOName;

                        var fieldContextItem = listxmlDoc.selectSingleNode('Items/Item/Items/Item[@ItemType="FieldContext" and @Guid="' + controlContextID + '"]');
                        if ($chk(fieldContextItem) === false)
                        {
                            fieldContextItem = viewXmlDoc.createElement("Item");
                            fieldContextItem.setAttribute('Guid', controlContextID);
                            fieldContextItem.setAttribute('ItemType', 'FieldContext');

                            var name = _viewDesigner._getControlProperty(FieldContextID, 'ControlName');
                            var fieldContextassociationName = listxmlDoc.createElement('Name');
                            fieldContextassociationName.appendChild(listxmlDoc.createTextNode(name));
                            var fieldContextassociationDisplayName = listxmlDoc.createElement('DisplayName');
                            fieldContextassociationDisplayName.appendChild(listxmlDoc.createTextNode(name));
                            var fieldContextassociationItems = listxmlDoc.createElement('Items');

                            fieldContextItem.appendChild(fieldContextassociationName);
                            fieldContextItem.appendChild(fieldContextassociationDisplayName);
                            fieldContextItem.appendChild(fieldContextassociationItems);
                            if (FieldContextID !== "")
                            {
                                var fieldContextContextID = listxmlDoc.createElement('ContextID');
                                fieldContextContextID.appendChild(listxmlDoc.createTextNode(FieldContextID));
                                fieldContextItem.appendChild(fieldContextContextID);
                            }
                            ViewItemFieldItems.appendChild(fieldContextItem);
                        }

                        var association = null;
                        var associationName, associationDisplayName, associationItems;

                        association = listxmlDoc.createElement('Item');
                        association.setAttribute('Guid', FieldSOGuid);
                        association.setAttribute('ItemType', 'Object');
                        association.setAttribute('SubType', associationControlType);
                        association.setAttribute('ContextID', controlContextID);

                        associationName = listxmlDoc.createElement('Name');
                        associationName.appendChild(listxmlDoc.createTextNode(name));
                        associationDisplayName = listxmlDoc.createElement('DisplayName');
                        associationDisplayName.appendChild(listxmlDoc.createTextNode(associatedSODisplayName));
                        associationItems = listxmlDoc.createElement('Items');

                        association.appendChild(associationName);
                        association.appendChild(associationDisplayName);
                        association.appendChild(associationItems);
                        fieldContextassociationItems.appendChild(association);

                        var FieldList = SourceCode.Forms.DependencyHelper.getSourceFieldNodes(OtherSourceElem);
                        if (FieldList.length > 0)
                        {
                            for (var i = 0; i < FieldList.length; i++)
                            {
                                var createViewFieldItemOptions = {
                                    fieldElem: FieldList[i],
                                    itemsXmlDoc: listxmlDoc,
                                    fieldSmoGuid: FieldSOGuid
                                };

                                var itemElem = _viewDesigner._createViewFieldItem(createViewFieldItemOptions);

                                associationItems.appendChild(itemElem);
                            }
                        }
                    }
                }
                //End View Fields

                //View parameters
                var ViewParameters = viewXmlDoc.documentElement.selectNodes('Views/View/Parameters/Parameter');
                if ($chk(ViewParameters) === true)
                {
                    for (var k = 0; k < ViewParameters.length; k++)
                    {
                        var ViewParameter = ViewParameters[k];
                        var parameterName = ViewParameter.selectSingleNode('Name').text;
                        var dataType = ViewParameter.getAttribute('DataType');
                        var ItemElem = listxmlDoc.createElement('Item');
                        ItemElem.setAttribute('ItemType', 'ViewParameter');
                        ItemElem.setAttribute('SubType', dataType);
                        ItemElem.setAttribute('DataType', dataType);
                        ItemElem.setAttribute('Guid', ViewParameter.getAttribute('ID'));

                        var ItemName = listxmlDoc.createElement('Name');
                        var ItemDisplayName = listxmlDoc.createElement('DisplayName');
                        var ItemValue = listxmlDoc.createElement('Value');

                        ItemElem.setAttribute('Name', parameterName);

                        ItemName.appendChild(listxmlDoc.createTextNode(parameterName));
                        ItemDisplayName.appendChild(listxmlDoc.createTextNode(parameterName));
                        ItemValue.appendChild(listxmlDoc.createTextNode(parameterName));

                        ItemElem.appendChild(ItemName);
                        ItemElem.appendChild(ItemDisplayName);
                        ItemElem.appendChild(ItemValue);

                        ViewItemFieldItems.appendChild(ItemElem);
                    }
                }
                //View expressions
                var ViewExpressions = viewXmlDoc.documentElement.selectNodes('Views/View/Expressions/Expression');
                if ($chk(ViewExpressions) === true)
                {
                    for (var k = 0; k < ViewExpressions.length; k++)
                    {
                        var ViewExpression = ViewExpressions[k];
                        var expressionName = ViewExpression.selectSingleNode('Name').text;
                        var expressionID = ViewExpression.getAttribute('ID');
                        var ItemElem = listxmlDoc.createElement('Item');
                        ItemElem.setAttribute('ItemType', 'Expression');
                        ItemElem.setAttribute('SubType', 'Expression');

                        var ItemName = listxmlDoc.createElement('Name');
                        var ItemDisplayName = listxmlDoc.createElement('DisplayName');
                        var ItemData = listxmlDoc.createElement('Data');

                        ItemElem.setAttribute('Guid', expressionID);

                        ItemName.appendChild(listxmlDoc.createTextNode(expressionName));
                        ItemDisplayName.appendChild(listxmlDoc.createTextNode(expressionName));
                        ItemData.appendChild(listxmlDoc.createTextNode(expressionName));

                        ItemElem.appendChild(ItemName);
                        ItemElem.appendChild(ItemDisplayName);
                        ItemElem.appendChild(ItemData);

                        ViewItemFieldItems.appendChild(ItemElem);
                    }
                }

                return listxmlDoc.xml;
            },

            _setItemNodeValidation: function (node, controlID, property)
            {
                var validation = _viewDesigner._getControlPropertyValidation(controlID, property);
                var validationStatus = validation.ValidationStatus;
                var validationMessages = validation.ValidationMessages;

                if (checkExistsNotEmpty(validationStatus))
                {
                    node.setAttribute("ValidationStatus", validationStatus);
                    node.setAttribute("ValidationMessages", validationMessages);
                }
            },

            _createViewFieldItem: function (options)
            {
                var fieldElem = options.fieldElem;
                var itemsXmlDoc = options.itemsXmlDoc;

                //Get field attributes and properties
                var fieldId = fieldElem.getAttribute('ID');
                var fieldDataType = fieldElem.getAttribute('DataType');

                var fieldName = "";
                var fieldDisplayName = "";
                var fieldFieldName = "";

                var fieldNameNode = fieldElem.selectSingleNode('Name');
                var fieldDisplayNameNode = fieldElem.selectSingleNode('FieldDisplayName');
                var fieldFieldNameNode = fieldElem.selectSingleNode('FieldName');

                var fieldNameNodeExists = checkExists(fieldNameNode);
                var fieldDisplayNameNodeExists = checkExists(fieldDisplayNameNode);
                var fieldFieldNameNodeExists = checkExists(fieldFieldNameNode);

                if (fieldNameNodeExists)
                {
                    fieldName = fieldNameNode.text;
                }

                if (fieldDisplayNameNodeExists)
                {
                    fieldDisplayName = fieldDisplayNameNode.text;
                }
                else if (fieldNameNodeExists)
                {
                    fieldDisplayName = fieldNameNode.text;
                }

                if (fieldFieldNameNodeExists)
                {
                    fieldFieldName = fieldFieldNameNode.text;
                }

                //Create item element and set attributes and properties
                var itemElem = itemsXmlDoc.createElement('Item');

                itemElem.setAttribute('ItemType', 'ViewField');
                itemElem.setAttribute('SubType', fieldDataType);
                itemElem.setAttribute('Guid', fieldId);
                itemElem.setAttribute('FieldObject', options.fieldSmoGuid + "_" + fieldFieldName);

                var itemNameElem = itemsXmlDoc.createElement('Name');
                var itemDisplayNameElem = itemsXmlDoc.createElement('DisplayName');
                var itemDataElem = itemsXmlDoc.createElement('Data');
                var itemObjectGuidElem = itemsXmlDoc.createElement('ObjectGuid');
                var itemPropertyNameElem = itemsXmlDoc.createElement('PropertyName');

                itemNameElem.appendChild(itemsXmlDoc.createTextNode(fieldName));
                itemDisplayNameElem.appendChild(itemsXmlDoc.createTextNode(fieldDisplayName));
                itemObjectGuidElem.appendChild(itemsXmlDoc.createTextNode(options.fieldSmoGuid));
                itemPropertyNameElem.appendChild(itemsXmlDoc.createTextNode(fieldFieldName));
                itemDataElem.appendChild(itemsXmlDoc.createTextNode(fieldFieldName));

                itemElem.appendChild(itemNameElem);
                itemElem.appendChild(itemDisplayNameElem);
                itemElem.appendChild(itemDataElem);
                itemElem.appendChild(itemObjectGuidElem);
                itemElem.appendChild(itemPropertyNameElem);

                return itemElem;
            },

            _getControlCategory: function (ControlName)
            {
                var ControlsDoc = SourceCode.Forms.Designers.Common.controlDefinitionsXml;
                var Controls = ControlsDoc.documentElement.selectNodes('Control');
                var retVal = '0';
                for (var i = 0; i < Controls.length; i++)
                {
                    var ControlElem = Controls[i];
                    var name = ControlElem.selectSingleNode('Name').text;
                    var controltype = ControlElem.getAttribute("category");
                    if (ControlName === name)
                    {
                        retVal = controltype;
                        break;
                    }
                }
                return retVal;
            },

            _getViewListControls: function ()
            {
                var listxmlDoc = parseXML('<Items/>');
                var viewXmlDoc = _viewDesigner.View.viewDefinitionXML;
                var ControlList = viewXmlDoc.documentElement.selectNodes('Views/View/Controls/Control');
                var viewId = _viewDesigner._GetViewID();
                for (var i = 0; i < ControlList.length; i++)
                {
                    var ControlElem = ControlList[i];
                    var ControlId = ControlElem.getAttribute('ID');
                    var ControlType = ControlElem.getAttribute('Type');
                    var ControlCategory = _viewDesigner._getControlCategory(ControlType);

                    if (ControlCategory === '1') //Listing
                    {
                        var ControlName = _viewDesigner._getControlProperty(ControlId, 'ControlName');
                        if (ControlName === '')
                        {
                            ControlName = ControlElem.selectSingleNode('Name').text;
                        }
                        var AssociationSO = _viewDesigner._getControlProperty(ControlId, 'AssociationSO');
                        var AssociationMethod = _viewDesigner._getControlProperty(ControlId, 'AssociationMethod');
                        // Used for Composite Checkbox List controls.
                        var displaySO = _viewDesigner._getControlProperty(ControlId, 'DisplaySO');
                        var displayMethod = _viewDesigner._getControlProperty(ControlId, 'DisplayMethod');
                        var isComposite = _viewDesigner._getControlProperty(ControlId, 'IsComposite');

                        var ItemElem = listxmlDoc.createElement('Item');
                        var ItemName = listxmlDoc.createElement('Name');
                        var ItemValue = listxmlDoc.createElement('Value');
                        var ItemDisplayName = listxmlDoc.createElement('DisplayName');
                        var ItemCategory = listxmlDoc.createElement('Category');
                        var ItemAssociationSO = listxmlDoc.createElement('AssociationSO');
                        var ItemAssociationMethod = listxmlDoc.createElement('AssociationMethod');
                        var itemDisplaySO = listxmlDoc.createElement('DisplaySO');
                        var itemDisplayMethod = listxmlDoc.createElement('DisplayMethod');
                        var itemIsComposite = listxmlDoc.createElement('IsComposite');

                        ItemElem.setAttribute('ItemType', 'Control');
                        ItemElem.setAttribute('Guid', ControlId);
                        ItemElem.setAttribute('SubType', ControlType);
                        ItemName.appendChild(listxmlDoc.createTextNode(ControlName));
                        ItemDisplayName.appendChild(listxmlDoc.createTextNode(ControlName));
                        ItemCategory.appendChild(listxmlDoc.createTextNode(ControlCategory));
                        ItemValue.appendChild(listxmlDoc.createTextNode(ControlId));

                        ItemElem.appendChild(ItemName);
                        ItemElem.appendChild(ItemDisplayName);
                        ItemElem.appendChild(ItemCategory);
                        ItemElem.appendChild(ItemValue);
                        if ($chk(AssociationSO) === true)
                        {
                            ItemAssociationSO.appendChild(listxmlDoc.createTextNode(AssociationSO));
                            ItemElem.appendChild(ItemAssociationSO);

                            if ($chk(AssociationMethod) === true)
                            {
                                ItemAssociationMethod.appendChild(listxmlDoc.createTextNode(AssociationMethod));
                                ItemElem.appendChild(ItemAssociationMethod);
                            }
                        }
                        if (checkExistsNotEmpty(displaySO))
                        {
                            itemDisplaySO.appendChild(listxmlDoc.createTextNode(displaySO));
                            ItemElem.appendChild(itemDisplaySO);

                            if (checkExistsNotEmpty(displayMethod))
                            {
                                itemDisplayMethod.appendChild(listxmlDoc.createTextNode(displayMethod));
                                ItemElem.appendChild(itemDisplayMethod);
                            }
                            if (checkExistsNotEmpty(isComposite))
                            {
                                itemIsComposite.appendChild(listxmlDoc.createTextNode(isComposite));
                                ItemElem.appendChild(itemIsComposite);
                            }
                        }
                        listxmlDoc.documentElement.appendChild(ItemElem);
                    }
                }
                return listxmlDoc.xml;
            },

            _setViewType: function (ViewType)
            {
                var jqScope = _viewDesigner.View.element;
                var aSelectType_Capture = jqScope.find('#label_aSelectType_Capture');
                var aSelectType_CaptureList = jqScope.find('#label_aSelectType_CaptureList');
                var tabHeadingText;

                aSelectType_Capture.removeClass('selected');
                aSelectType_CaptureList.removeClass('selected');

                jqScope.find('#vdBodyTabPropertiesTab, #vdColumnTabPropertiesTab, #vdControlTabPropertiesTab, #vdViewEditorFormsTab').hide();

                switch (ViewType)
                {
                    case 'Capture':
                        aSelectType_Capture.addClass('selected');

                        jqScope.find("#vdsmartObjectID").closest(".form-field").removeClass("required");
                        jqScope.find("#rowsFormField").show();
                        jqScope.find("#autogenFieldsTable").find(">tbody>tr>td:nth-child(3)").show();
                        tabHeadingText = Resources.ViewDesigner.TabPropertiesHeader;

                        jqScope.find('#vdControlTabPropertiesTab, #vdViewEditorFormsTab').show();

                        jqScope.find("#vdlbl_listViewGetListMethod").hide();
                        jqScope.find("#chkRefreshList").hide();
                        break;

                    case 'CaptureList':
                        aSelectType_CaptureList.addClass('selected');

                        jqScope.find("#vdsmartObjectID").closest(".form-field").addClass("required");
                        jqScope.find("#autogenFieldsTable").find(">tr>td:nth-child(3)").show();
                        jqScope.find('#editableSection').show();

                        tabHeadingText = Resources.ViewDesigner.TabControlProperties;
                        jqScope.find('#vdBodyTabPropertiesTab, #vdColumnTabPropertiesTab, #vdControlTabPropertiesTab').show();

                        jqScope.find("#vdlbl_listViewGetListMethod").show();
                        jqScope.find("#chkRefreshList").show();
                        break;
                }

                jqScope.find('#vdControlTabPropertiesTab').find("span.tab-text").text(tabHeadingText);
            },

            _showViewActions: function (step)
            {
                _viewDesigner._updateRulesLocation();
                var grid = _viewDesigner.View._getTargetGrid();
                var gridType = SourceCode.Forms.Designers.Common.Rules.getGridType(grid);

                var searchText = _viewDesigner.View.searchControl.val();
                searchText = searchText.trim();

                if (!checkExists(_viewDesigner.View.currentFilter))
                {
                    _viewDesigner.View.currentFilter = "";
                }

                if (gridType === "list")
                {
                    _viewDesigner.View.currentGridObject.refresh(grid, _viewDesigner.View.viewDefinitionXML, null, searchText, _viewDesigner.View.currentFilter);
                    _viewDesigner.View.element.find('#toolEditAction, #toolRemoveAction').removeClass('hidden');
                    _viewDesigner.View.element.find('#toolEditAction, #toolRemoveAction').addClass('disabled');
                    _viewDesigner.View.element.find('#vdToolEnableRule, #vdToolLayoutEnableRule, #vdToolDisableRule, #vdToolLayoutDisableRule, #vdRuleEnabledDivider, #vdRuleLayoutEnabledDivider').addClass("hidden");
                }
                else if (gridType === "grid")
                {
                    _viewDesigner.View.currentGridObject.refresh(grid, _viewDesigner.View.viewDefinitionXML, null, searchText, _viewDesigner.View.currentFilter);
                    if (grid.find("tr.selected").length > 0)
                    {
                        _viewDesigner.View.element.find('#toolEditAction, #toolRemoveAction').addClass('disabled');
                        grid.find("a.toolbar-button.edit, a.toolbar-button.delete").addClass("disabled");
                    }
                }

                // Hide Enable/Disable Rule toolbar buttons
                _viewDesigner.View.element.find('#vdToolEnableRule, #vdToolLayoutEnableRule').addClass("hidden");
                _viewDesigner.View.element.find('#vdToolDisableRule, #vdToolLayoutDisableRule').addClass("hidden");
                _viewDesigner.View.element.find("#vdRuleEnabledDivider, #vdRuleLayoutEnabledDivider").addClass("hidden");

                SourceCode.Forms.Designers.resizeToolBarButtons("vdFormEventsTabGrid");
            },

            _hideDetails: function ()
            {
                // execute necessary steps based on the user's view type selection
                // _
                // make sure the selection has changed
                if (_viewDesigner.View.PreviousSelectedViewType !== _viewDesigner.View.SelectedViewType)
                {
                    var selectedSmartObject = _viewDesigner.View.SelectedSmartObjectGuid;
                    var isListing = false;

                    _viewDesigner.View.isViewChanged = true;
                    _viewDesigner.View.isViewEventsLoaded = false;
                    _viewDesigner.View.isViewEventsLoading = false;
                    _viewDesigner.View.isSmartObjectLoaded = false;

                    //if ($chk(selectedSmartObject))
                    //{
                    //	if (_viewDesigner.View.SelectedViewType.toLowerCase() !== 'capture')
                    //	{
                    //		isListing = true;
                    //	}

                    //	_viewDesigner.AJAXCall._getSmartObjectPropertiesAndMethods(selectedSmartObject, isListing);
                    //}
                }
                // _
                //

                var thisViewName = _viewDesigner.View.element.find('#vdtxtViewName').val();
                var thisViewSystemName = _viewDesigner.View.element.find('#vdViewSystemName').val();
                var thisViewDescription = _viewDesigner.View.element.find('#vdtxtViewDescription').val();

                var xmlDoc = _viewDesigner.View.viewDefinitionXML;
                var ViewElem = xmlDoc.selectSingleNode('//Views/View');

                var viewSelectedType = _viewDesigner.View.SelectedViewType;

                // HACK: All the code has been written to work with the CaptureList flag, so we need to convert it here
                if (viewSelectedType === "CaptureList")
                {
                    viewSelectedType = "List";
                }

                ViewElem.setAttribute('Type', viewSelectedType);

                //write system name values to xml
                var ViewNameElem = xmlDoc.selectSingleNode('//Views/View/Name');
                if ($chk(ViewNameElem) === false)
                {
                    var viewElem = _viewDesigner._getViewElem(xmlDoc);
                    if ($chk(viewElem) === true)
                    {
                        ViewNameElem = xmlDoc.createElement('Name');
                        viewElem.appendChild(ViewNameElem);
                    }
                    else
                    {
                        return;
                    }
                }

                if (ViewNameElem.childNodes.length > 0)
                {
                    ViewNameElem.firstChild.data = thisViewSystemName;
                }
                else
                {
                    var ViewNameCData = xmlDoc.createTextNode(thisViewSystemName);
                    ViewNameElem.appendChild(ViewNameCData);
                }

                //write display name values to xml
                var ViewDisplayNameElem = xmlDoc.selectSingleNode('//Views/View/DisplayName');
                if ($chk(ViewDisplayNameElem) === false)
                {
                    var viewElem = _viewDesigner._getViewElem(xmlDoc);
                    if ($chk(viewElem) === true)
                    {
                        ViewDisplayNameElem = xmlDoc.createElement('DisplayName');
                        viewElem.appendChild(ViewDisplayNameElem);
                    }
                    else
                    {
                        return;
                    }
                }

                if (ViewDisplayNameElem.childNodes.length > 0)
                {
                    ViewDisplayNameElem.firstChild.data = thisViewName;
                }
                else
                {
                    var ViewDisplayNameCData = xmlDoc.createTextNode(thisViewName);
                    ViewDisplayNameElem.appendChild(ViewDisplayNameCData);
                }

                //write other values to xml
                var ViewDescElem = xmlDoc.selectSingleNode('//Views/View/Description');
                if ($chk(ViewDescElem) === false)
                {
                    var viewElem = _viewDesigner._getViewElem(xmlDoc);
                    if ($chk(viewElem) === true)
                    {
                        ViewDescElem = xmlDoc.createElement('Description');
                        viewElem.appendChild(ViewDescElem);
                    }
                    else
                    {
                        return;
                    }
                }
                if (ViewDescElem.childNodes.length > 0)
                {
                    ViewDescElem.firstChild.data = thisViewDescription;
                }
                else
                {
                    var ViewDescCData = xmlDoc.createTextNode(thisViewDescription);
                    ViewDescElem.appendChild(ViewDescCData);
                }
            },

            _hideViewCanvas: function ()
            {
                _viewDesigner._BuildViewXML();

                _viewDesigner._setDefaultSelectedObject();

                if (_viewDesigner._getViewType() === "CaptureList")
                {
                    $(".column-selected-overlay").hide().removeData("column");
                    $("div.drag-block").hide();
                }

                return true;
            },

            _hideStepFinish: function (step)
            {
                _viewDesigner.View.isOnFinishStep = false;

                return true;
            },

            _setDesignerType: function (ViewType)
            {
                //set view xml
                var ViewElem = _viewDesigner.View.viewDefinitionXML.selectSingleNode('SourceCode.Forms/Views/View');
                ViewElem.setAttribute('Type', ViewType);

                _viewDesigner.View.SelectedViewType = ViewType;
            },

            _showCaptureListViewCanvas: function (step)
            {
                var isListing = 0;
                var ViewType = _viewDesigner._getViewType();

                if (ViewType === 'CaptureList')
                {
                    isListing = 1;
                }

                _viewDesigner.View.isViewEventsLoaded = false;
                _viewDesigner.View.isViewEventsLoading = false;

                _viewDesigner.View.element.find("#controlToolboxGroupLists").show();

                //load selected smart object details
                if (!_viewDesigner.View.isSmartObjectLoaded)
                {
                    setTimeout(function ()
                    {
                        _viewDesigner._initViewCanvasStep();
                    }.bind(_viewDesigner), 10); //TODO:Partial Pages Check if _viewDesigner is correct and not extra load
                }

                // update alternate rows visually
                if (_viewDesigner.View.isLayoutTableGenerated)
                {
                    _viewDesigner.View._applyAlternateRows();
                }

                if (_viewDesigner.View.IsViewEdit && _viewDesigner.View.layoutExists())
                {
                    _viewDesigner.View._repopulateDummyRenderData();
                }

                setTimeout(function ()
                {
                    // ensure footer row displays correctly
                    var footerRows = _viewDesigner.View.element.find("#bodySection table.editor-table>tbody>tr.footer");
                    if (footerRows.length > 0)
                    {
                        _viewDesigner.DesignerTable._configurePlaceholderFooterRow($(footerRows[footerRows.length - 1]));
                    }

                    _viewDesigner.Styles.populateCanvasControlStyles();

                    if (_viewDesigner.View.selectedOptions.EnableListEditing === false)
                    {
                        _viewDesigner.View.element.find("#editableSection").hide();
                    }
                }, 500);

                if (_viewDesigner.View.IsViewEdit)
                {
                    var table = _viewDesigner.View.element.find("#bodySection").find("table:first-child");
                    _viewDesigner.DesignerTable._coerceListViewColumnSizes(table);
                }
            },

            _toggleListViewFilter: function (show)
            {
                var filterControl = _viewDesigner.View.element.find("#FilterControl");
                if (show)
                {
                    if (filterControl.length === 0)
                    {
                        //renderer does not add the extra resize wrapper (on Edit)
                        var editedViewSelector = "#toolbarSection>div>.editor-table:first-child";
                        var newViewSelector = "#toolbarSection>div>div>.editor-table:first-child";
                        var table = $(editedViewSelector);
                        if (table.length === 0)
                            table = $(newViewSelector);

                        if (table.length !== 0)
                            table.after("<div class='not-selectable toolbars single' id='FilterControl' style='margin-right: 1px; margin-left: 1px; margin-bottom: 3px;'><div class='toolbar'><div class='toolbar-l'></div><div class='toolbar-r'></div><div class='toolbar-c'><div class='toolbar-wrapper'><div class='filterContainer'><span style='min-width: 443px;' class='filterChosen filter large'><span class='filterLabel disabled' disabled='disabled'>Selected Filter:</span><span class='searchDdl'><select aria-disabled='false' style='display:none;' disabled='disabled' class='input-control disabled'><option value=''> Default </option></select><div class='input-control select-box dropdown-box disabled'><div class='input-control-body'><div class='input-control-t'><div class='input-control-t-l'></div><div class='input-control-t-c'></div><div class='input-control-t-r'></div></div><div class='input-control-m'><div class='input-control-m-l'></div><div class='input-control-m-c'><div class='input-control-wrapper'><a class='input-control disabled' disabled='disabled'><span>Default</span></a></div></div><div class='input-control-m-r'></div></div><div class='input-control-b'><div class='input-control-b-l'></div><div class='input-control-b-c'></div><div class='input-control-b-r'></div></div></div><div class='input-control-buttons'><a class='dropdown disabled'  disabled='disabled'><span><span>...</span></span></a></div></div></span>&nbsp;<a class='configFilterImg disabled' title='Configure a new filter' disabled='disabled'> </a></span><span style='min-width: 443px;' class='quickSearch filter large'><span class='filterLabel disabled' disabled='disabled'>Quick Search:</span> <span class='searchDdl'><select aria-disabled='false' style='display: none;' disabled='disabled' class='input-control disabled'><option value='[AllDisplay]'>Visible fields</option></select><div class='input-control select-box dropdown-box disabled'><div class='input-control-body'><div class='input-control-t'><div class='input-control-t-l'></div><div class='input-control-t-c'></div><div class='input-control-t-r'></div></div><div class='input-control-m'><div class='input-control-m-l'></div><div class='input-control-m-c'><div class='input-control-wrapper'><a class='input-control disabled' disabled='disabled'><span>Visible fields</span></a></div></div><div class='input-control-m-r'></div></div><div class='input-control-b'><div class='input-control-b-l'></div><div class='input-control-b-c'></div><div class='input-control-b-r'></div></div></div><div class='input-control-buttons'><a class='dropdown disabled' disabled='disabled'><span><span>...</span></span></a></div></div></span>&nbsp;<span class='filterTxt'><div class='input-control text-input' defaultValue=''><div class='input-control-t'><div class='input-control-t-l'></div><div class='input-control-t-c'></div><div class='input-control-t-r'></div></div><div class='input-control-m'><div class='input-control-m-l'></div><div class='input-control-m-c'><div class='input-control-wrapper msie'><input class='input-control disabled' type='text' disabled='disabled'/></div></div><div class='input-control-m-r'></div></div><div class='input-control-b'><div class='input-control-b-l'></div><div class='input-control-b-c'></div><div class='input-control-b-r'></div></div></div></span>&nbsp;<a title='Apply quick search' class='toolbar-button toolbar-button-inline style-aware refresh disabled' href='javascript:;' disabled='disabled'><span class='button-l'></span><span class='button-c'><span class='button-icon'></span></span><span class='button-r'></span></a></span></div></div></div></div></div>");
                    }
                    else
                    {
                        filterControl.show();
                    }
                }
                else
                {
                    if (filterControl.length > 0)
                    {
                        filterControl.hide();
                    }
                }
            },

            _toggleListViewPaging: function (show)
            {
                var pagingControl = _viewDesigner.View.element.find("#PagingControl");
                if (show)
                {
                    if (pagingControl.length === 0)
                    {
                        var table = _viewDesigner.View.element.find("#bodySection table.editor-table:first-child");
                        if (table.length > 0)
                        {
                            table.after("<div class='grid-footer dt-listview'><div id='PagingControl' class='toolbars single'><div class='toolbar'><div class='toolbar-wrapper'><a href='javascript:;' class='toolbar-button paging-first disabled hide-browser-highlight' tabindex='-1' title='Go to first page'><span class='button-l'></span><span class='button-c'><span class='button-icon'></span></span><span class='button-r'></span></a><a href='javascript:;' class='toolbar-button paging-left disabled' tabindex='-1' title='Go to previous page'><span class='button-l'></span><span class='button-c'><span class='button-icon'></span></span><span class='button-r'></span></a><div class='grid-paging-control'><div class='grid-paging-control-text current disabled'>Page</div><div class='input-control text-input small disabled'><div class='input-control-t disabled'><div class='input-control-t-l'></div><div class='input-control-t-c'></div><div class='input-control-t-r'></div></div><div class='input-control-m'><div class='input-control-m-l'></div><div class='input-control-m-c'><div class='input-control-wrapper'><input type='text' class='input-control disabled' value='1' disabled='disabled'></div></div><div class='input-control-m-r'></div></div><div class='input-control-b'><div class='input-control-b-l'></div><div class='input-control-b-c'></div><div class='input-control-b-r'></div></div></div><div class='grid-paging-control-text total' style='display: none;'>of 1</div></div><a href='javascript:;' class='toolbar-button paging-right disabled' tabindex='-1' title='Go to next page'><span class='button-l'></span><span class='button-c'><span class='button-icon'></span></span><span class='button-r'></span></a><a href='javascript:;' class='toolbar-button paging-last disabled' tabindex='-1' title='Go to last page' style='display: none;'><span class='button-l'></span><span class='button-c'><span class='button-icon'></span></span><span class='button-r'></span></a></div></div></div></div>");
                        }
                    }
                    else
                    {
                        pagingControl.show();
                    }
                }
                else
                {
                    if (pagingControl.length > 0)
                    {
                        pagingControl.hide();
                    }
                }
            },

            _clickSoTree: function (dataSourceChanged)
            {
                _viewDesigner.View.element.find("#vdsmartObjectName").closest('.lookup-box').find(".input-control-watermark").hide();

                _viewDesigner.View._clearControlBindings({ deleteUserResultMappings: dataSourceChanged });
                var xmlDoc = _viewDesigner.View.viewDefinitionXML;
                var viewElem = _viewDesigner._getViewElem(xmlDoc);
                if ($chk(viewElem) === true)
                {
                    //Sources
                    var SourcesElem = viewElem.selectSingleNode('Sources');
                    if ($chk(SourcesElem) === true && SourcesElem.childNodes.length > 0)
                    {
                        var primaryData = SourcesElem.selectNodes("Source[@ContextType='Primary' or @ContextType='Association']");

                        for (var i = 0; i < primaryData.length; i++)
                        {
                            var source = primaryData[i];
                            source.parentNode.removeChild(source);
                        }
                    }
                }

                _viewDesigner.View.isSmartObjectLoaded = false;
                _viewDesigner._loadSOMethods(true);
                _viewDesigner.View.ddlistmethod.dropdown('refresh');

                _viewDesigner._configureOptionsStep(_viewDesigner.View.GENERAL_STEP_INDEX);

            },

            _selectViewEditorTab: function (Tab, src)
            {
                var ControlTabPropertiesTab = _viewDesigner.View.element.find('#vdControlTabPropertiesTab');

                ControlTabPropertiesTab.removeClass('selected');
                src.addClass('selected');

                _viewDesigner._setViewEditorTab(Tab);
            },

            //the rules tab is clicked  - layout step
            _setViewEditorTab: function (Tab)
            {
                var divFormsTabContent = _viewDesigner.View.element.find('#divFormsTabContent');
                var divControlTabsContentProperties = _viewDesigner.View.element.find('#divControlTabsContentProperties');

                divFormsTabContent.hide();
                divControlTabsContentProperties.hide();

                switch (Tab)
                {
                    case 2:
                        if (_viewDesigner.View.isViewEventsLoaded === false && _viewDesigner.View.isViewEventsLoading === false)
                        {
                            _viewDesigner.View.isViewEventsLoading = true;
                            _viewDesigner._BuildViewXML();
                            setTimeout(function ()
                            {
                                _viewDesigner.View.element.find('#ControlTabsContent').overlay();
                                _viewDesigner._LoadViewEvents();
                                _viewDesigner.View.element.find('#ControlTabsContent').removeOverlay();
                            }, 0);
                        }
                        divFormsTabContent.show();
                        SourceCode.Forms.Designers.resizeToolBarButtons("vdFormEventsTabGrid");
                        divFormsTabContent.find(".grid").grid("synccolumns");
                        break;
                }

                _viewDesigner.View.SelectedEditorTab = Tab;
            },

            _selectViewEditorControlTab: function (Tab, src)
            {
                var ViewEditorControlFieldsTab = _viewDesigner.View.element.find('#ViewEditorControlFieldsTab');
                var ViewEditorControlMethodsTab = _viewDesigner.View.element.find('#ViewEditorControlMethodsTab');
                var ViewEditorControlToolboxTab = _viewDesigner.View.element.find('#ViewEditorControlToolboxTab');
                var ViewEditorControlLayoutTab = _viewDesigner.View.element.find('#ViewEditorControlLayoutTab');

                ViewEditorControlFieldsTab.removeClass('selected');
                ViewEditorControlMethodsTab.removeClass('selected');
                ViewEditorControlToolboxTab.removeClass('selected');
                ViewEditorControlLayoutTab.removeClass('selected');
                src.addClass('selected');

                _viewDesigner._setViewEditorControlTab(Tab);
            },

            _setViewEditorControlTab: function (Tab)
            {
                var divFieldsList = _viewDesigner.View.element.find('#vdFieldsList');
                var divMethodsList = _viewDesigner.View.element.find('#vdMethodsList');
                var divToolboxList = _viewDesigner.View.element.find('#vdToolboxList');
                var divLayoutList = _viewDesigner.View.element.find('#vdLayoutList');
                var InfoText = '';

                divFieldsList.hide();
                divMethodsList.hide();
                divToolboxList.hide();
                divLayoutList.hide();

                switch (Tab)
                {
                    case 0: 	//Fields
                        InfoText = Resources.ViewDesigner.TabControlsFields + ' ' + _viewDesigner.View.SelectedSmartObjectName;
                        divFieldsList.show();
                        break;
                    case 1: 	//Methods
                        InfoText = Resources.ViewDesigner.TabControlsMethods + ' ' + _viewDesigner.View.SelectedSmartObjectName;
                        divMethodsList.show();
                        break;
                    case 2: 	//Toolbox
                        InfoText = Resources.ViewDesigner.TabToolboxHeader;
                        divToolboxList.show();
                        break;
                    case 3:
                        InfoText = Resources.ViewDesigner.TabLayoutHeader;
                        divLayoutList.show();
                        break;
                }

                _viewDesigner.View.SelectedEditorTab = Tab;
            },

            _propertiesPanel: {

                switchToControlPropertiesTab: function ()
                {
                    _viewDesigner._selectControlTab(0, _viewDesigner.View.element.find('#vdControlTabPropertiesTab'));
                },

                switchToColumnPropertiesTab: function ()
                {

                },

                switchToRulesTab: function ()
                {
                    //_viewDesigner._selectViewEditorTab(2, _viewDesigner.View.element.find('#vdViewEditorFormsTab'));
                },

                switchToBodyPropertiesTab: function ()
                {
                    _viewDesigner._selectControlTab(0, _viewDesigner.View.element.find('#vdBodyTabPropertiesTab'));
                },

                switchToPreviouslySelectedTab: function ()
                {
                    _viewDesigner._selectControlTab(0, _viewDesigner.View.lastSelectedPropertyTab);
                }
            },

            //src = the tab selector
            _selectControlTab: function (Tab, src)
            {
                if (!checkExists(_viewDesigner.View.selectedObject))
                {
                    return;
                }

                _viewDesigner.View.element.find('#vdColumnTabPropertiesTab, #vdControlTabPropertiesTab, #vdBodyTabPropertiesTab, #vdViewEditorFormsTab').removeClass('selected');

                _viewDesigner.View.element.find("#vdViewEditorFormsTab")[0].blur();
                src.addClass('selected');
                _viewDesigner._setControlTab(Tab);
            },


            //properties tab is clicked (layout view)
            //Tab = this is the tab selector
            _setControlTab: function (Tab)
            {
                var divFormsTabContent = _viewDesigner.View.element.find('#divFormsTabContent');
                var divControlTabsContentProperties = _viewDesigner.View.element.find('#divControlTabsContentProperties');
                var InfoText = '';
                var ControlName = '';

                //ensure the property header controls are initialized.
                _viewDesigner._initPropertiesHeader();

                if ($chk(_viewDesigner.View.selectedObject) === true)
                    ControlName = _viewDesigner._getControlProperty(_viewDesigner.View._findControlFromSelectedObject().attr('id'), 'ControlName');

                divFormsTabContent.hide();
                divControlTabsContentProperties.hide();

                switch (Tab)
                {
                    case 0: 	//Properties
                        InfoText = Resources.ViewDesigner.TabControlPropertiesHeader + ' ' + ControlName;
                        divControlTabsContentProperties.show();

                        var ControlType = _viewDesigner._getControlType(_viewDesigner.View._findControlFromSelectedObject().attr('id'));

                        //Hide Rules Tab if Table Selected
                        if (ControlType === "Table")
                        {
                            _viewDesigner.View.element.find("#vdViewEditorFormsTab").hide();
                        }
                        setTimeout(function ()
                        {
                            _viewDesigner._showControlProperties();
                        }, 0);
                        break;
                    case 1: 	//Events
                        InfoText = Resources.ViewDesigner.TabControlEventsHeader + ' ' + ControlName;
                        divFormsTabContent.show();
                        divFormsTabContent.find(".grid").grid("synccolumns");
                        break;
                }

                _viewDesigner.View.SelectedEditorTab = Tab;
            },


            //Enables or disables each step of the wizard.
            _configureOptionsStep: function ()
            {
                var view = _viewDesigner.View;
                var introStep = view.wizard.wizard("getStep", view.introStep);
                var generalStep = view.wizard.wizard("getStep", view.generalStep);
                var layoutStep = view.wizard.wizard("getStep", view.layoutStep);
                var parameterStep = view.wizard.wizard("getStep", view.parametersStep);
                var rulesStep = view.wizard.wizard("getStep", view.rulesStep);
                var summaryStep = view.wizard.wizard("getStep", view.summaryStep);
                var finishStep = view.wizard.wizard("getStep", view.finishStep);

                view.btnCreate.removeClass("disabled");

                // Requirements to enable steps
                //
                // If layout is generated, and view type has changed, disable and return
                // No layout
                // - Item View
                //   * Name & Category -> Enable Layout Page
                // - List View
                //	 * Name & Category & Data Source -> Enable Layout Page
                // Existing layout
                // - Item View
                //	 * Name & Category -> Enable Layout,Parameters,Rules
                // - List View
                //	 * Name & Category & Data Source -> Enable Layout,Parameters,Rules

                if (_viewDesigner.View.hasViewTypeChanged === true && layoutExists)
                {
                    view.wizard.wizard("enable", "step", layoutStep);
                    return;
                }

                //Get all of the evidence needed to decide which steps can be enabled:
                //will it ever be necessary to check for smo category here?
                var name = view.txtName.val();
                var viewtype = _viewDesigner._getViewType();

                var category = view.element.find("#viewcategoryId").val();
                var smartobject = view.SelectedSmartObjectGuid;
                var listmethod = view.ddlistmethod.dropdown("SelectedValue");
                var layoutExists = view.layoutExists();
                var isExistingView = (view.IsViewEdit === 'True' || view.IsViewEdit === 'true' || view.IsViewEdit === true);
                var viewTypeChanged = view.hasViewTypeChanged === true;
                var ITEM_VIEW = SourceCode.Forms.Designers.ViewType.ItemView;
                var LIST_VIEW = SourceCode.Forms.Designers.ViewType.ListView;

                var viewDesignerCategoryLookupDisabled = $("#ViewDesignerCategoryLookup").hasClass("disabled");
                var viewPathIsUnAuthorized = $("#FormField1 .input-control.text-input").hasClass("unAuthorized");
                //an attempt at simplifying the if/then/else mess.
                var introStepEnabled = true;
                var layoutStepEnabled = (checkExists(name) && (viewDesignerCategoryLookupDisabled || checkExists(category))) &&
                    (
                        (viewtype === LIST_VIEW && checkExists(smartobject))
                        ||
                        (viewtype === ITEM_VIEW)
                    ) && checkExistsNotEmpty(name) && (checkExistsNotEmpty(category) || viewPathIsUnAuthorized);

                var paramsStepEnabled = layoutStepEnabled && layoutExists;
                var rulesStepEnabled = layoutStepEnabled && layoutExists;
                var summaryStepEnabled = layoutStepEnabled && layoutExists;
                var finishStepEnabled = layoutStepEnabled && layoutExists;

                view.wizard.wizard(layoutStepEnabled ? "enable" : "disable", "step", layoutStep);
                view.wizard.wizard(paramsStepEnabled ? "enable" : "disable", "step", parameterStep); // parameters
                view.wizard.wizard(rulesStepEnabled ? "enable" : "disable", "step", rulesStep); // rules
                view.wizard.wizard(summaryStepEnabled ? "enable" : "disable", "step", summaryStep); // summary
                view.wizard.wizard(finishStepEnabled ? "enable" : "disable", "step", finishStep); // finish
                view.wizard.wizard(finishStepEnabled ? "enable" : "disable", "button", "save"); //save button

                if (!layoutStepEnabled)
                {
                    view.btnCreate.addClass("disabled");
                }
            },

            _defaultOptionsStep: function (isAutoGen)
            {
                _viewDesigner._configureOptionsStep(_viewDesigner.View.GENERAL_STEP_INDEX);
            },

            _generateCaptureViewOptions: function ()
            {
                $("#vdchkGenerateAllFieldsInclude").checkbox().checkbox("uncheck");
                $("#vdchkGenerateAllFieldsReadOnly").checkbox().checkbox("uncheck");
                var fieldsCheckboxGroup = $("#fieldsSelectGroup").checkboxgroup();
                fieldsCheckboxGroup.checkboxgroup("clear");

                var fields = _viewDesigner.View.hiddenSmartObjectXml.selectNodes("smartobject/smartobjectroot/properties/property"); //ToDo: Consider @guid filtering
                var jq_autogenFieldsTable = $('#autogenFieldsTable');
                $('.input-control.checkbox input.autogen-method').checkbox("disabled");

                jq_autogenFieldsTable.find("tbody > tr").slice(1).remove();

                for (var f = 0; f < fields.length; f++)
                {
                    var fieldEl = fields[f];
                    var fieldName = fieldEl.selectSingleNode("metadata/display/displayname").text;
                    var fieldDesc = fieldEl.selectSingleNode("metadata/display/description");
                    fieldDesc = checkExists(fieldDesc) ? fieldDesc.text : "";
                    var fieldValue = fieldEl.getAttribute("name");

                    var jq_tr = $("<tr><td></td><td></td><td></td></tr>");
                    jq_autogenFieldsTable.append(jq_tr);

                    var jq_tds = jq_tr.find('td');

                    var includechkboxHTML = "<label><input type='checkbox' value='{0}' class='autogen-field include'/></label>".format(fieldValue);

                    var jq_includechkbox = $(includechkboxHTML).appendTo(jq_tds[1]);

                    jq_includechkbox.find(".autogen-field").checkbox();

                    var html = "<label class='generic-ellipsis' title='{1}'><span class='field {0}'></span><span>{1}</span></label>".format("text", fieldName.htmlEncode());
                    var displayName = $(html);
                    displayName.appendTo(jq_tds[0]);
                    displayName.addClass("IncludePropertiesText");

                    jq_includechkbox.find('input').on("click", function ()
                    {
                        var selectedFields = $("#autogenFieldsTable").find(".autogen-field.include:checked");
                        var generatedMethodsCheckboxes = $("#autogenFieldsTable").find(".autogen-field.include");

                        if (selectedFields.length !== generatedMethodsCheckboxes.length)
                        {
                            $("#vdchkGenerateAllFieldsInclude").checkbox().checkbox("uncheck");
                        }
                        else
                        {
                            $("#vdchkGenerateAllFieldsInclude").checkbox().checkbox("check");
                        }

                        var allReadOnlyFields = $("#autogenFieldsTable").find(".autogen-field.readonly");
                        var allIncludeFields = $("#autogenFieldsTable").find(".autogen-field.include");

                        var index = allIncludeFields.index(this);
                        var include = $(this);
                        var readOnly = allReadOnlyFields.eq(index);

                        if (!include.is(":checked") && readOnly.is(":checked"))
                        {
                            readOnly.checkbox().checkbox("uncheck");
                            $("#vdchkGenerateAllFieldsReadOnly").checkbox().checkbox("uncheck");
                        }
                    });

                    includechkboxHTML = "<label><input type='checkbox' value='{0}' class='autogen-field readonly'/></label>".format(fieldValue);

                    var readOnlyCheckBox = $(includechkboxHTML).appendTo(jq_tds[2]);

                    readOnlyCheckBox.find(".autogen-field").checkbox();

                    if (_viewDesigner._getViewType() === "CaptureList")
                    {
                        readOnlyCheckBox.hide();
                    }

                    readOnlyCheckBox.find('input').on("click", function ()
                    {
                        var selectedFields = $("#autogenFieldsTable").find(".autogen-field.readonly:checked");
                        var generatedMethodsCheckboxes = $("#autogenFieldsTable").find(".autogen-field.readonly");

                        if (selectedFields.length !== generatedMethodsCheckboxes.length)
                        {
                            $("#vdchkGenerateAllFieldsReadOnly").checkbox().checkbox("uncheck");
                        }
                        else
                        {
                            $("#vdchkGenerateAllFieldsReadOnly").checkbox().checkbox("check");
                        }

                        var allReadOnlyFields = $("#autogenFieldsTable").find(".autogen-field.readonly");
                        var allIncludeFields = $("#autogenFieldsTable").find(".autogen-field.include");

                        var index = allReadOnlyFields.index(this);
                        var readOnly = $(this);
                        var include = allIncludeFields.eq(index);

                        if (readOnly.is(":checked") && !include.is(":checked"))
                        {
                            include.checkbox().checkbox("check");

                            var selectedIncludeFields = allIncludeFields.filter(":checked");
                            if (selectedIncludeFields.length > 0 && selectedIncludeFields.length === allIncludeFields.length)
                            {
                                $("#vdchkGenerateAllFieldsInclude").checkbox().checkbox("check");
                            }
                        }
                    });
                }
            },

            _toggleViewPaging: function (e)
            {
                var checkbox = $("#vdallowListViewPaging");
                var textbox = $("#vdtxtListViewLinesPerPage");

                if (checkbox[0].checked)
                {
                    textbox.textbox().textbox("enable");
                    textbox.trigger("focus");
                }
                else
                {
                    textbox.textbox().textbox("disable");
                }
            },

            _handleKeyDown: function (e)
            {
                if (!_viewDesigner.View.selectedObject) return true;

                if (popupManager.isAnyPopupShown())
                    return;

                if (_viewDesigner.CheckOut._checkViewStatus() === true)
                {
                    //if focus is on a input dont delete selected object
                    if (e.srcElement)
                    {
                        if ($(e.srcElement).is('input')) return true;
                    }
                    else
                        if ($(e.target).is('input')) return true;

                    var object = _viewDesigner.View.selectedObject;
                    var section = _viewDesigner._getSection(object);
                    var configureCell = true;

                    if (object.hasClass("editor-cell") && object.hasClass('droptarget')) 
                    {
                        var keyCode = e.keyCode;
                        //e = new Event(e).stop();
                        e.stopPropagation();
                        switch (keyCode)
                        {
                            case 46: // Delete pressed
                                try
                                {
                                    if (_viewDesigner.View.SelectedViewType === "CaptureList" && object.closest("table").hasClass("capturelist-editor-table"))
                                    {
                                        return;
                                    }

                                    _viewDesigner.DesignerTable._delegateClearCell(object);
                                    _viewDesigner.View.isViewChanged = true;

                                    _viewDesigner.View.element.find('#vdColumnTabPropertiesTab, #vdControlTabPropertiesTab, #vdBodyTabPropertiesTab, #vdViewEditorFormsTab, #divFormsTabContent').hide();
                                }
                                catch (err)
                                {
                                }

                                        break;
                                    case 13: // Enter pressed
                                        var br = $("<div layouttype='line-break' class='line-break'>&nbsp;</div>");
                                        object.append(br);

                                break;
                            case 32: // Spacebar pressed
                                var space = $("<span layouttype='non-breaking-space' class='non-breaking-space'>&nbsp;</span>");
                                object.append(space);

                                        break;
                                    case 8: //backspace pressed
                                        var lastEl = object.children(":last-child");
                                        if (lastEl.hasClass("line-break") || lastEl.hasClass("non-breaking-space"))
                                        {
                                            lastEl.remove();
                                        }

                                break;
                        }
                    }
                    else if (object.is("DIV") && object.hasClass('selectedobject'))
                    {
                        var keyCode = e.keyCode;
                        //e = new Event(e).stop();
                        e.stopPropagation();

                        var objectParent = SourceCode.Forms.TableHelper.getCellFromElement(object);
                        switch (keyCode)
                        {
                            case 8: // Backspace pressed [TFS 879614] Backspace should behave like Delete
                            case 46: // Delete pressed
                                try
                                {

                                    // if contained within a cell, clears break points and spacers
                                    var parentColumn = object.closest(".editor-cell");
                                    if (parentColumn.length > 0)
                                    {
                                        if (parentColumn.length > 0)
                                        {
                                            parentColumn.find(".line-break,span.non-breaking-space").remove();
                                        }
                                    }

                                    if (_viewDesigner.View.SelectedViewType === "CaptureList" && object.closest("table").hasClass("capturelist-editor-table"))
                                    {
                                        return;
                                    }

                                    var controlid = object[0].getAttribute("id");
                                    var controlType = object[0].getAttribute("controltype");

                                    //Ensure that the xml definition is correct so that dependency warnings don't show unecessarily
                                    //TFS 785637
                                    SourceCode.Forms.DependencyHelper._ensureDefinitionIsUpToDate(_viewDesigner.View.viewDefinitionXML);

                                    var removeControlCallbackFn = function ()
                                    {
                                        _viewDesigner._removeControl(object);
                                        SourceCode.Forms.Designers.Common.applyDesignerWizardStepBadging();
                                    };

                                    var itemName = _viewDesigner._getControlProperty(controlid, 'ControlName');
                                    var itemType = SourceCode.Forms.DependencyHelper.ReferenceType.Control;
                                    if (checkExists(controlType) && controlType.toLowerCase() === "table")
                                    {
                                        itemType = SourceCode.Forms.DependencyHelper.ReferenceType.Table;
                                    }

                                    var controlData =
                                        {
                                            itemId: controlid,
                                            itemType: itemType
                                        };

                                    var itemsToDelete = [];

                                    itemsToDelete.push(controlData);

                                    if (SourceCode.Forms.DependencyHelper.isTypeContainerControl(controlData.itemType))
                                    {
                                        var dataArray = SourceCode.Forms.Designers.getControlDataCollectionForContainerControl(controlData);
                                        if (checkExists(dataArray) && dataArray.length > 0)
                                        {
                                            itemsToDelete = $.merge(itemsToDelete, dataArray);
                                        }
                                    }

                                    var controlDependencies = SourceCode.Forms.Designers.getDependencies(itemsToDelete, { skipDefinitionUpdate: true });

                                    if (controlDependencies.length > 0)
                                    {
                                        var notifierOptions =
                                            {
                                                references: controlDependencies,
                                                deletedItemDisplayName: itemName,
                                                deleteItemType: itemType,
                                                removeObjFn: removeControlCallbackFn
                                            };
                                        SourceCode.Forms.Designers.showDependencyNotifierPopup(notifierOptions);
                                    }
                                    else
                                    {
                                        removeControlCallbackFn();
                                    }

                                        }
                                        catch (e)
                                        {
                                            //TODO: Error handling???
                                            if (checkExists(console) && checkExists(console.log))
                                            {
                                                console.log(e);
                                            }
                                        }
                                        break;
                                    case 13: // Enter pressed
                                        var br = $("<div layouttype='line-break' class='line-break' >&nbsp;</div>");
                                        br.insertBefore(object);

                                        //Adding the extra space could cause the cell to get bigger;
                                        SourceCode.Forms.Designers.Common.triggerEventFromControlElement("ControlMoved", object);

                                        break;
                                    case 32: // Spacebar pressed
                                        var space = $("<span layouttype='non-breaking-space' class='non-breaking-space'>&nbsp;</span>");
                                        space.insertBefore(object);

                                        //Adding the extra space could cause the cell to get bigger;
                                        SourceCode.Forms.Designers.Common.triggerEventFromControlElement("ControlMoved", object);

                                break;
                        }
                        if (objectParent && configureCell === true)
                        {
                            var objectParentParent = objectParent.parent();
                            if (objectParentParent.length > 0)
                            {
                                if (section)
                                {
                                    if (section.length > 0)
                                    {
                                        _viewDesigner.DesignerTable._configureCell(section.attr('id'), objectParentParent, objectParent);
                                    }
                                }
                                else
                                {
                                    _viewDesigner.DesignerTable._configureCell('', objectParentParent, objectParent);
                                }
                            }
                        }
                    }
                    else
                    {
                        return true;
                    }
                    //if (window.ie) document.recalc(true);

                    //After delete of an object or after put enter or delete line break, the layout may have been changed
                    SourceCode.Forms.Designers.Common.triggerEvent("LayoutChanged");
                }
            },

            //Remove a control from the UI and the view Data (xml).
            //used by designers.view.js.
            _removeControl: function (jqControl)
            {
                var controlId = jqControl.attr('id');

                var controlType = jqControl.attr('controltype');

                if (controlType === "Table")
                {
                    //First remove all the controls inside the Table before remove the Table control
                    this._cleanupChildren(jqControl, false);
                }

                _viewDesigner._removeControlSOSources(controlId);

                //If rules dependant on the control are in error change error rule to have custom name
                SourceCode.Forms.Designers.Common.applyCustomNamesToErrorEvent(controlId);

                //Remove control from Controls node collection in viewDefinition XML
                var controlToRemove = _viewDesigner.View.viewDefinitionXML.selectSingleNode('//Controls/Control[@ID="{0}"]'.format(controlId));
                if (checkExists(controlToRemove))
                {
                    controlToRemove.parentNode.removeChild(controlToRemove);
                }
                //Remove control from Canvas node in viewDefinition XML
                var controlToRemoveFromCanvas =
                    SourceCode.Forms.Designers.View.viewDefinitionXML.selectSingleNode("//Canvas//*[@ID='{0}']".format(controlId));
                if (checkExists(controlToRemoveFromCanvas))
                {
                    controlToRemoveFromCanvas.parentNode.removeChild(controlToRemoveFromCanvas);
                }
                //Remove system events:
                this._clearSystemEventsForControl(controlId);

                //Remove control and additional toolbar elements for the html dom

                //Remove the next droppable after the control 
                //The previous one can be left alone as it is for the previous control and/or the next control
                var nextDroppable = jqControl.next();
                if (nextDroppable.is('.toolbar-droppable'))
                {
                    nextDroppable.remove();
                }
                //unless there are no more controls which results in one droppable left over
                var droppables = jqControl.parent().find('.toolbar-droppable');
                if (droppables.length === 1)
                {
                    droppables.remove();
                }

                var parent = jqControl.parent();
                var parentRow = jqControl.closest("tr");

                jqControl.remove();
                _viewDesigner.DragDrop._ToggleContextWaterMark(parent);

                _viewDesigner._setDefaultSelectedObject();
                _viewDesigner.View.isViewChanged = true;

                if (_viewDesigner.View.SelectedViewType === "CaptureList" && parentRow.hasClass("footer"))
                {
                    var rowControls = parentRow.find(">td div.controlwrapper");
                    if (rowControls.length === 0 && jqControl[0].tagName.toUpperCase() === "DIV")
                    {
                        //Control removed from footer row. If no controls remain in footer row, remove entire row.
                        //This _removeControl function will only execute after dependencies for control has been checked
                        //Therefore, _removeRow here should not check for dependencies again
                        SourceCode.Forms.Controls.Web.TableBehavior.prototype._removeRow(parentRow.find(">td:first-child"), _viewDesigner.View, true);
                        configureCell = false;
                    }
                }

                _viewDesigner.View.element.find('#vdColumnTabPropertiesTab, #vdControlTabPropertiesTab, #vdBodyTabPropertiesTab, #vdViewEditorFormsTab, #divFormsTabContent').hide();
            },

            _configurePropertiesTab: function (object)
            {
                var jqScope = _viewDesigner.View.element;
                jqScope.find('#vdBodyTabPropertiesTab, #vdColumnTabPropertiesTab, #vdControlTabPropertiesTab, #vdViewEditorFormsTab').hide();

                switch (object[0].tagName)
                {
                    case "DIV":
                        if ((!object.closest('tr').hasClass('list-view-item') || object.closest('tr').hasClass('footer')) && !object.hasClass('column-hover-overlay'))
                        {
                            jqScope.find('#vdControlTabPropertiesTab').find("span.tab-text").text(Resources.ViewDesigner.TabControlProperties);
                            //Hide Rules Tab if Table Selected
                            if (_viewDesigner._getControlType(object.attr("id")) === "Table")
                                jqScope.find('#vdControlTabPropertiesTab').show();
                            else
                                jqScope.find('#vdControlTabPropertiesTab, #vdViewEditorFormsTab').show();
                            SourceCode.Forms.Designers.resizeToolboxPaneTabs("vdeditorToolboxPane");
                        }
                        else
                        {
                            jqScope.find('#vdControlTabPropertiesTab').find("span.tab-text").text(Resources.ViewDesigner.TabLayoutHeader);
                            jqScope.find('#vdBodyTabPropertiesTab, #vdColumnTabPropertiesTab, #vdControlTabPropertiesTab').show();
                            SourceCode.Forms.Designers.resizeToolboxPaneTabs("vdeditorToolboxPane");
                        }
                        break;

                    case "SPAN":
                        if ((!object.closest('tr').hasClass('list-view-item') || object.closest('tr').hasClass('footer')) && !object.hasClass('column-hover-overlay'))
                        {
                            jqScope.find('#vdControlTabPropertiesTab').find("span.tab-text").text(Resources.ViewDesigner.TabControlProperties);
                            jqScope.find('#vdControlTabPropertiesTab, #vdViewEditorFormsTab').show();
                            SourceCode.Forms.Designers.resizeToolboxPaneTabs("vdeditorToolboxPane");
                        }
                        else
                        {
                            jqScope.find('#vdControlTabPropertiesTab').find("span.tab-text").text(Resources.ViewDesigner.TabLayoutHeader);
                            jqScope.find('#vdBodyTabPropertiesTab, #vdColumnTabPropertiesTab, #vdControlTabPropertiesTab').show();
                            SourceCode.Forms.Designers.resizeToolboxPaneTabs("vdeditorToolboxPane");
                        }
                        break;
                    case "TR":
                        break;

                    case "TD":
                        if (object.hasClass('droptarget') && (!object.closest("tr").hasClass("list-view-item") || object.closest("tr").hasClass("footer")))
                        {
                            jqScope.find('#vdControlTabPropertiesTab').find("span.tab-text").text(Resources.ViewDesigner.TabControlProperties);
                            jqScope.find('#vdControlTabPropertiesTab, #vdViewEditorFormsTab').show();
                            SourceCode.Forms.Designers.resizeToolboxPaneTabs("vdeditorToolboxPane");
                        }
                        else if (object.closest("tr").hasClass("list-view-item"))
                        {
                            jqScope.find('#vdControlTabPropertiesTab').find("span.tab-text").text(Resources.ViewDesigner.TabLayoutHeader);
                            jqScope.find('#vdBodyTabPropertiesTab, #vdColumnTabPropertiesTab, #vdControlTabPropertiesTab').show();
                            SourceCode.Forms.Designers.resizeToolboxPaneTabs("vdeditorToolboxPane");
                        }
                        break;
                }
            },

            //when a cell within a table is selected.
            _handleEditorCellClick: function (e)
            {
                var object = $(e.target);
                _viewDesigner._configSelectedControl(object);

                if (object.hasClass("editor-cell")
                    && object.hasClass("header")
                    && object.hasClass("droptarget"))
                {
                    _viewDesigner.DragDrop._makeColumnHeaderDraggable(object);
                }
            },

            _handleMouseClick: function (e)
            {
                if (_viewDesigner.View.element.find("#tableLayoutOptions").length > 0 || e.target === _viewDesigner.View.canvas[0])
                {
                    return;
                }

                if (_viewDesigner._columnDragDrop === false)
                {
                    if (SourceCode.Forms.Browser.mozilla || SourceCode.Forms.Browser.webkit)
                    {
                        if (_viewDesigner.View.propertyGrid &&
                            _viewDesigner.View.propertyGrid.lastFocus &&
                            _viewDesigner.View.propertyGrid.lastFocus.closest(".lookup-box").length === 0
                        )
                        {
                            var newVal = _viewDesigner.View.propertyGrid.lastFocus.val();
                            var oldVal = _viewDesigner.View.propertyGrid.lastVal;

                            if (newVal !== oldVal)
                            {
                                _viewDesigner.View.propertyGrid.lastFocus.trigger("change");
                            }

                            if (checkExists(_viewDesigner.View.propertyGrid))
                            {
                                _viewDesigner.View.propertyGrid.lastFocus = null;
                            }
                        }
                    }

                    if (e.srcElement)
                        object = $(e.srcElement);
                    else
                        object = $(e.target);

                    // check if use has clicked on the aggregation placeholder, if so, then don't do anything
                    if (object.closest("#footerControlDropPlaceHolder").length > 0 || object.closest("#PagingControl").length > 0 || object.closest(".not-selectable").length > 0 || object[0].tagName === "TABLE" || object.is(".drag-column"))
                    {
                        e.stopPropagation();
                        return;
                    }

                    var isHoverOverlay = object && object.hasClass("column-hover-overlay");
                    var isControlObject = object && !SourceCode.Forms.Designers.Common.isCanvasTable(object) && !object.hasClass("column-selected-overlay");

                    if (isControlObject || isHoverOverlay)
                    {
                        if (object.length > 0)
                        {
                            if (_viewDesigner._getViewType() === "CaptureList")
                            {
                                $(".column-selected-overlay").hide().removeData("column");
                                $("div.drag-block").hide();
                            }

                            var controlSelected = false;

                            _viewDesigner._configurePropertiesTab(object);
                            switch (object[0].tagName)
                            {
                                case 'SPAN':
                                    if (object.hasClass('droptarget') && (!object.closest("tr").hasClass("list-view-item") || object.closest("tr").hasClass("footer")))
                                    {
                                        controlSelected = true;
                                        _viewDesigner._handleEditorCellClick(e);
                                    }
                                    break;
                                case 'DIV':
                                    if ((!object.closest('tr').hasClass('list-view-item') || object.closest('tr').hasClass('footer')) && !object.hasClass('column-hover-overlay'))
                                    {
                                        if (object.hasClass('controlwrapper'))
                                        {
                                            _viewDesigner._configSelectedControl(object);
                                            controlSelected = true;
                                            //e = new Event(e).stop();
                                            e.stopPropagation();
                                        }
                                        else if (object.hasClass('scroll-wrapper')) // view properties
                                        {
                                            // get view element
                                            var viewElement = object.find("[controltype='View']");

                                            _viewDesigner._configSelectedControl(viewElement);
                                            controlSelected = true;
                                            e.stopPropagation();

                                        }
                                        else if (object.hasClass('droptarget') && (!object.closest("tr").hasClass("list-view-item") || object.closest("tr").hasClass("footer")))
                                        {
                                            controlSelected = true;
                                            _viewDesigner._handleEditorCellClick(e);
                                        }
                                        else
                                        {
                                            var parent = _viewDesigner._getParentControlWrapper(object);
                                            if (parent)
                                            {
                                                if (parent.length > 0)
                                                {
                                                    _viewDesigner._configSelectedControl(parent);
                                                    controlSelected = true;
                                                    //e = new Event(e).stop();
                                                    e.stopPropagation();
                                                }
                                            }
                                            else
                                            {
                                                _viewDesigner._clearControlPropertyGrid();
                                            }
                                        }
                                    }
                                    else
                                    {
                                        var calculatedCellIndex;
                                        var closestTable = _viewDesigner.View.element.find("#bodySection table.editor-table");
                                        if (object.hasClass('column-hover-overlay'))
                                        {
                                            calculatedCellIndex = object.data("cellIndex") + 1;
                                        } else
                                        {
                                            calculatedCellIndex = object.closest("td")[0].cellIndex + 1;
                                        }

                                        object = closestTable.find('>tbody>tr:nth-child(1)>td:nth-child(' + calculatedCellIndex + ')');

                                        if (object.length > 0)
                                        {
                                            object.addClass("selectedobject");

                                            _viewDesigner.DesignerTable._setupColumnOverlay(object);

                                            _viewDesigner._configSelectedControl(object);
                                            controlSelected = true;

                                            if ($chk(_viewDesigner.View.propertyGrid))
                                            {
                                                _viewDesigner.View.propertyGrid.controlid = null;
                                            }

                                            if (object.hasClass("editor-cell")
                                                && object.hasClass("header")
                                                && object.hasClass("droptarget"))
                                            {
                                                _viewDesigner.DragDrop._makeColumnHeaderDraggable(object);
                                            }
                                        }
                                    }
                                    break;
                                case 'TR':

                                    break;
                                case 'TD':
                                    if (object.hasClass('droptarget') && (!object.closest("tr").hasClass("list-view-item") || object.closest("tr").hasClass("footer")))
                                    {
                                        controlSelected = true;
                                        _viewDesigner._handleEditorCellClick(e);
                                    }
                                    else if (object.closest("tr").hasClass("list-view-item"))
                                    {
                                        var calculatedCellIndex = object[0].cellIndex + 1;
                                        var closestTable = object.closest('table');
                                        var objectTR = closestTable.find('>tbody>tr:nth-child(1)');
                                        object = objectTR.find('>td:nth-child(' + calculatedCellIndex + ')');

                                        if (object.length > 0)
                                        {
                                            _viewDesigner.DesignerTable._setupColumnOverlay(object);

                                            _viewDesigner._configSelectedControl(object);
                                            controlSelected = true;

                                            if ($chk(_viewDesigner.View.propertyGrid))
                                            {
                                                _viewDesigner.View.propertyGrid.controlid = null;
                                            }

                                            if (object.hasClass("editor-cell")
                                                && object.hasClass("header")
                                                && object.hasClass("droptarget"))
                                            {
                                                _viewDesigner.DragDrop._makeColumnHeaderDraggable(object);
                                            }
                                        }
                                    }
                                    break;
                                default:
                                    var parent = _viewDesigner._getParentControlWrapper(object);
                                    if (parent)
                                    {
                                        if (parent.length > 0)
                                        {
                                            _viewDesigner._configSelectedControl(parent);
                                            controlSelected = true;
                                            //e = new Event(e).stop();
                                            e.stopPropagation();
                                        }
                                    }
                                    break;
                            }

                            if (!controlSelected)
                            {
                                _viewDesigner._configSelectedControl(_viewDesigner.View.canvas.find("[controlType = 'View']"));

                                if (_viewDesigner.View.viewEventsGrid.is(":visible")) _viewDesigner.View.viewEventsGrid.grid("synccolumns");
                                _viewDesigner.View.currentGridObject.refresh(_viewDesigner.View.viewEventsGrid, _viewDesigner.View.viewDefinitionXML);
                                if (_viewDesigner.View.viewEventsGrid.grid("fetch", "selected-rows").length === 0)
                                    _viewDesigner.View.viewEventsGrid.children(".grid-toolbars").find(".toolbar-button.edit, .toolbar-button.delete").addClass("disabled");
                            }
                        }
                    }
                    else
                    {
                        if (_viewDesigner.View.viewEventsGrid.is(":visible")) _viewDesigner.View.viewEventsGrid.grid("synccolumns");
                        _viewDesigner.View.currentGridObject.refresh(_viewDesigner.View.viewEventsGrid, _viewDesigner.View.viewDefinitionXML);
                        if (_viewDesigner.View.viewEventsGrid.grid("fetch", "selected-rows").length === 0)
                            _viewDesigner.View.viewEventsGrid.children(".grid-toolbars").find(".toolbar-button.edit, .toolbar-button.delete").addClass("disabled");
                    }

                }
                else
                {
                    _viewDesigner._columnDragDrop = false;
                }
            },

            _setViewSelected: function ()
            {
                _viewDesigner._configSelectedControl(_viewDesigner.View.canvas.find("[controlType = 'View']")); // if no selected object, select view
            },

            _getSection: function (currentItem)
            {
                return $(currentItem).parents('.section');
            },

            _getControlPropertyValue: function (id, propertyName)
            {
                var Control = _viewDesigner.View.element.find('#' + id);
                var val = null;
                if (Control.length > 0)
                {
                    var ControlType = Control.attr('controltype');
                    var properties = _viewDesigner._getProperties(id);

                    if (checkExists(properties))
                    {
                        var propertyValue = properties.selectSingleNode("Property[Name/text() = '" + propertyName + "']");
                        if (propertyValue)
                        {
                            val = propertyValue.selectSingleNode('Value').text;
                        }
                    }
                }

                return val;
            },

            _getPropertySetFunction: function (controlType, propertyName)
            {
                var retVal = null;
                var xmlControlDefDoc = SourceCode.Forms.Designers.Common.controlDefinitionsXml;
                if ($chk(xmlControlDefDoc) === true)
                {
                    var ControlElem = xmlControlDefDoc.selectSingleNode('Controls/Control[Name="' + controlType + '"]');
                    if ($chk(ControlElem) === true)
                    {
                        var ControlPropElem = ControlElem.selectSingleNode('DefaultProperties/Properties/Prop[@ID="' + propertyName + '"]');
                        if (checkExists(ControlPropElem))
                        {
                            retVal = ControlPropElem.getAttribute('setFunction');
                        }
                    }
                }
                return retVal;
            },

            _setControlPropertyValue: function (id, propertyName, propertyValue, propertyDisplayValue)
            {
                var Control = _viewDesigner.View.element.find('#' + id);
                if (Control.length > 0)
                {
                    var ControlType = Control.attr('controltype');
                    var properties = _viewDesigner._getProperties(id);

                    var propertyElem = _viewDesigner._getControlPropertyElement(id, propertyName, properties);

                    if ($chk(propertyElem) === true)
                    {
                        properties.removeChild(propertyElem);
                    }

                    if (!checkExists(propertyDisplayValue))
                    {
                        propertyDisplayValue = propertyValue;
                    }

                    propertyElem = _viewDesigner._BuildPropertyElem(id, propertyName, propertyValue, propertyDisplayValue);
                    properties.appendChild(propertyElem);

                    if (checkExists(properties))
                    {
                        _viewDesigner._setControlPropertiesXML(id, properties);
                    }
                }
            },

            _removeXMLChildNodes: function (parentNode)
            {
                if (checkExists(parentNode))
                {
                    for (var i = 0; i < parentNode.childNodes.length; i++)
                    {
                        if (parentNode.childNodes[i].nodeType === 1 && parentNode.childNodes[i].getAttribute("Type") !== "View")
                        {
                            parentNode.removeChild(parentNode.childNodes[i]);
                        }
                    }
                }
            },

            _setControlPropertiesXML: function (id, properties, styles, controlType)
            {
                var xmlPropertiesDoc = _viewDesigner.View.controlPropertiesXML;

                if ($chk(xmlPropertiesDoc) === true)
                {
                    var xPath = 'Control[@ID="' + id + '"]';
                    var PropertiesRootElem = xmlPropertiesDoc;

                    var ControlElem = xmlPropertiesDoc.selectSingleNode(xPath);

                    if ($chk(ControlElem) === false)
                    {
                        ControlElem = _viewDesigner.View.viewDefinitionXML.createElement('Control');
                        ControlElem.setAttribute('ID', id);

                        if (checkExists(controlType))
                        {
                            ControlElem.setAttribute("Type", controlType);
                        }
                        PropertiesRootElem.appendChild(ControlElem);
                    }
                    else
                    {
                        var oldProperties = ControlElem.selectSingleNode('Properties');
                        if ($chk(oldProperties))
                            ControlElem.removeChild(oldProperties);
                    }

                    // set control properties from properties xml input param //
                    if (!$chk(properties) || typeof properties === typeof "")
                    {
                        var callStack = printStackTrace(null);

                        popupManager.showError({
                            message: Resources.ViewDesigner.MethodArgumentException.format("propertylist", "_setDisplayControlProperties", callStack.join("<br/>")),
                            width: 400,
                            height: 240
                        });

                        return;
                    }

                    var propertiesList = properties.selectNodes('Property');

                    for (var i = 0; i < propertiesList.length; i++)
                    {
                        propertyElem = propertiesList[i];
                        var key = propertyElem.selectSingleNode('Name').text;
                        var value = propertyElem.selectSingleNode('Value').text;
                        var nameValueElem = propertyElem.selectSingleNode('NameValue');
                        var displayElem = propertyElem.selectSingleNode('DisplayValue');
                        var displayValue = value;
                        var nameValue = value;

                        if ($chk(displayElem) === true)
                        {
                            displayValue = displayElem.text;
                        }
                        else
                        {
                            // *** workaround to show SO name instead of guid in property grid //
                            if (key.toLowerCase() === 'associationso')
                            {
                                var sodata = _viewDesigner._GetAssociationSmartObjectDetails(value);
                                if (sodata)
                                {
                                    displayValue = sodata.friendlyname;
                                }
                            }
                            //////////////////////////////////////////////////////////////////////
                        }

                        if ($chk(nameValueElem) === true)
                        {
                            nameValue = nameValueElem.text;
                        }

                        if (key === 'ControlName')
                        {
                            var controlNameElem = ControlElem.selectSingleNode('Name');
                            if ($chk(controlNameElem) === false)
                            {
                                controlNameElem = _viewDesigner.View.viewDefinitionXML.createElement('Name');
                                controlNameElem.appendChild(_viewDesigner.View.viewDefinitionXML.createTextNode(value));
                                ControlElem.appendChild(controlNameElem);
                            }

                            var controlDisplayNameElem = ControlElem.selectSingleNode('DisplayName');
                            if ($chk(controlDisplayNameElem) === false)
                            {
                                controlDisplayNameElem = _viewDesigner.View.viewDefinitionXML.createElement('DisplayName');
                                controlDisplayNameElem.appendChild(_viewDesigner.View.viewDefinitionXML.createTextNode(value));
                                ControlElem.appendChild(controlDisplayNameElem);
                            }

                            var controlNameValueElem = ControlElem.selectSingleNode('NameValue');
                            if ($chk(controlNameValueElem) === false)
                            {
                                controlNameValueElem = _viewDesigner.View.viewDefinitionXML.createElement('NameValue');
                                controlNameValueElem.appendChild(_viewDesigner.View.viewDefinitionXML.createTextNode(value));
                                ControlElem.appendChild(controlNameValueElem);
                            }

                            SourceCode.Forms.Designers.Common.updateControlNameInValidationGroups({ controlId: id, newName: controlNameElem.text, newDisplayValue: controlDisplayNameElem.text });
                        }

                        if (key === 'Field')
                        {
                            ControlElem.setAttribute('FieldID', value);

                            if (!checkExistsNotGuid(displayValue))
                            {
                                displayValue = SourceCode.Forms.DependencyHelper.getFieldNameForControl(_viewDesigner.View.viewDefinitionXML, id, value, true);
                            }

                            if (!checkExistsNotGuid(nameValue))
                            {
                                nameValue = SourceCode.Forms.DependencyHelper.getFieldNameForControl(_viewDesigner.View.viewDefinitionXML, id, value, false);
                            }
                        }

                        var propertiesElem = ControlElem.selectSingleNode('Properties');
                        if ($chk(propertiesElem) === false)
                        {
                            propertiesElem = _viewDesigner.View.viewDefinitionXML.createElement('Properties');
                            ControlElem.appendChild(propertiesElem);
                        }

                        var PropElem = ControlElem.selectSingleNode('Properties/Property[Name="' + key + '"]');
                        if ($chk(PropElem) === false)
                        {
                            PropElem = _viewDesigner.View.viewDefinitionXML.createElement('Property');
                            var nameElem = _viewDesigner.View.viewDefinitionXML.createElement('Name');
                            nameElem.appendChild(_viewDesigner.View.viewDefinitionXML.createTextNode(key));
                            PropElem.appendChild(nameElem);

                            SourceCode.Forms.DependencyHelper.cloneAnnotation(propertyElem, PropElem);

                            propertiesElem.appendChild(PropElem);
                        }

                        var DesigntimeElem = PropElem.selectSingleNode('Value');
                        if ($chk(DesigntimeElem) === false)
                        {
                            DesigntimeElem = _viewDesigner.View.viewDefinitionXML.createElement('Value');
                            PropElem.appendChild(DesigntimeElem);
                        }
                        var DesigntimeCData = _viewDesigner.View.viewDefinitionXML.createTextNode(value);
                        if ($chk(DesigntimeElem.childNodes) === true)
                        {
                            if (DesigntimeElem.childNodes.length > 0)
                            {
                                DesigntimeElem.firstChild.data = value;
                            }
                            else
                            {
                                DesigntimeElem.appendChild(DesigntimeCData);
                            }
                        }
                        else
                        {
                            DesigntimeElem.appendChild(DesigntimeCData);
                        }

                        //Final fallback logic for NameValue and DisplayValue
                        nameValue = _viewDesigner._determineCorrectedNameValue(nameValue, value);
                        displayValue = _viewDesigner._determineCorrectedDisplayValue(displayValue, nameValue, value);

                        var addDisplayValue = checkExistsNotEmpty(displayValue);

                        var RuntimeElem = PropElem.selectSingleNode('DisplayValue');
                        if (($chk(RuntimeElem) === false) && addDisplayValue)
                        {
                            RuntimeElem = _viewDesigner.View.viewDefinitionXML.createElement('DisplayValue');
                            PropElem.appendChild(RuntimeElem);
                        }
                        else if (($chk(RuntimeElem) === true) && !addDisplayValue)
                        {
                            PropElem.removeChild(RuntimeElem);
                            RuntimeElem = null;
                        }

                        if (addDisplayValue)
                        {
                            var RuntimeCData = _viewDesigner.View.viewDefinitionXML.createTextNode(displayValue);
                            if ($chk(RuntimeElem.childNodes) === true)
                            {
                                if (RuntimeElem.childNodes.length > 0)
                                {
                                    RuntimeElem.firstChild.data = displayValue;
                                }
                                else
                                {
                                    RuntimeElem.appendChild(RuntimeCData);
                                }
                            }
                            else
                            {
                                RuntimeElem.appendChild(RuntimeCData);
                            }
                        }

                        //Changed the NameValue implementation to be a bit more in sync with the DisplayValue implementation, essentially you want to achieve basically the same
                        var addNameValue = checkExistsNotEmpty(nameValue);

                        var PropNameValueElem = PropElem.selectSingleNode('NameValue');
                        if (($chk(PropNameValueElem) === false) && addNameValue && (_viewDesigner.View.NameValuePropertiesCollection.indexOf(key) > -1))
                        {
                            PropNameValueElem = _viewDesigner.View.viewDefinitionXML.createElement('NameValue');
                            PropElem.appendChild(PropNameValueElem);
                        }
                        else if (($chk(PropNameValueElem) === true) && !addNameValue)
                        {
                            PropElem.removeChild(PropNameValueElem);
                            PropNameValueElem = null;
                        }

                        if (addNameValue && (_viewDesigner.View.NameValuePropertiesCollection.indexOf(key) > -1))
                        {
                            var NameValueCData = _viewDesigner.View.viewDefinitionXML.createTextNode(nameValue);
                            if ($chk(PropNameValueElem.childNodes) === true)
                            {
                                if (PropNameValueElem.childNodes.length > 0)
                                {
                                    PropNameValueElem.firstChild.data = nameValue;
                                }
                                else
                                {
                                    PropNameValueElem.appendChild(NameValueCData);
                                }
                            }
                            else
                            {
                                PropNameValueElem.appendChild(NameValueCData);
                            }
                        }
                    }
                    //////////////////////////////////////////////////////////

                    if (checkExists(styles))
                    {
                        var existingStyles = ControlElem.selectSingleNode('Styles');
                        //if the reference is to the same object or the existingStyles do not exist
                        if (styles !== existingStyles)
                        {
                            if (checkExists(existingStyles))
                            {
                                existingStyles.parentNode.removeChild(existingStyles);
                            }

                            if (styles.ownerDocument !== ControlElem.ownerDocument)
                                ControlElem.appendChild(styles.cloneNode(true));
                            else
                                ControlElem.appendChild(styles);

                        }
                    }
                }

                //Get association smartobject definition//
                if (_viewDesigner.View.selectedObject)
                {
                    if (_viewDesigner.View.selectedObject.length > 0)
                    {
                        var smartobjectid = _viewDesigner._getControlProperty(_viewDesigner.View._findControlFromSelectedObject().attr("id"), 'AssociationSO');
                        if (smartobjectid)
                        {
                            _viewDesigner.AJAXCall._getAssociationSODetails(smartobjectid);
                        }
                    }
                }
                ////////////////////////////////////////////

            },

            _determineCorrectedNameValue: function (nameValue, value)
            {
                var returnValue = nameValue;

                if (!checkExistsNotGuid(returnValue))
                {
                    if (checkExistsNotGuid(value))
                    {
                        returnValue = value;
                    }
                    else
                    {
                        returnValue = "";
                    }
                }

                return returnValue;
            },

            _determineCorrectedDisplayValue: function (displayValue, nameValue, value)
            {
                var returnValue = displayValue;

                if (!checkExistsNotGuid(returnValue))
                {
                    if (checkExistsNotGuid(nameValue))
                    {
                        returnValue = nameValue;
                    }
                    else if (checkExistsNotGuid(value))
                    {
                        returnValue = value;
                    }
                    else
                    {
                        returnValue = "";
                    }
                }

                return returnValue;
            },

            _getControlDefaultProperty: function (controlName, property)
            {
                var defaultPropertiesDoc = SourceCode.Forms.Designers.Common.controlDefinitionsXml.selectSingleNode("Controls/Control[Name='" + controlName + "']/DefaultProperties");

                return $chk(defaultPropertiesDoc.selectSingleNode("Properties/Prop[@ID='" + property + "']")) ? defaultPropertiesDoc.selectSingleNode("Properties/Prop[@ID='" + property + "']").text : "";
            },

            _resetDesignWidthControl: function (controlWrapper, uiControlResizer)
            {
                if (controlWrapper.length > 0)
                {
                    var width;
                    var controlType = controlWrapper.attr('controltype');

                    if ($chk(parseInt(controlWrapper[0].style.width)) === false)
                    {
                        var getFunction = _viewDesigner._getPropertyGetFunction(controlType, 'Width');
                        if (checkExists(getFunction))
                        {
                            width = evalFunction(getFunction)(controlWrapper);

                            controlWrapper[0].style.width = width;
                            controlWrapper.find(".resizewrapper")[0].style.width = width;
                        }
                    }
                }
            },

            _getControlFieldID: function (ControlId)
            {
                var viewxmlDoc = _viewDesigner.View.viewDefinitionXML;
                var retVal = '';
                if ($chk(viewxmlDoc) === true)
                {
                    var ControlElem = viewxmlDoc.selectSingleNode('//Controls/Control[@ID="' + ControlId + '"]');
                    if ($chk(ControlElem) === true)
                    {
                        var FieldID = ControlElem.getAttribute('FieldID');
                        if ($chk(FieldID) === true)
                        {
                            retVal = FieldID;
                        }
                    }
                }
                return retVal;
            },

            getFieldsForControl: function (options)
            {
                var values = [];
                var names = [];
                var displays = [];
                var iconClasses = [];

                var valuesObject = [];

                var fieldNodes = SourceCode.Forms.DependencyHelper.getPrimarySourceFieldNodes(_viewDesigner.View.viewDefinitionXML, options.filter);

                function runFilters(options, fieldValue, fieldName, fieldDisplay, fieldType)
                {
                    var canAddField = true;
                    if (checkExists(options) && checkExists(options.filter))
                    {
                        function runFilter(comparisonArray, value)
                        {
                            var returnValue = true;
                            if (checkExists(comparisonArray) && comparisonArray.length > 0)
                            {
                                returnValue = false;
                                for (var i = 0, il = comparisonArray.length; i < il && !returnValue; i++)
                                {
                                    if (!options.filtersAreUpperCase)
                                    {
                                        comparisonArray[i] = comparisonArray[i].toUpperCase();
                                    }
                                    returnValue = (comparisonArray[i] === value.toUpperCase());
                                }
                            }
                            return returnValue;
                        }
                        canAddField = runFilter(options.filter.values, fieldValue);
                        if (canAddField)
                        {
                            canAddField = runFilter(options.filter.names, fieldName);
                        }
                        if (canAddField)
                        {
                            canAddField = runFilter(options.filter.displays, fieldDisplay);
                        }
                        if (canAddField)
                        {
                            canAddField = runFilter(options.filter.types, fieldType);
                        }
                        options.filtersAreUpperCase = true;
                    }
                    return canAddField;
                }

                if (!checkExists(options) || !checkExists(options.addBlank) || options.addBlank === true || runFilters(options, "", "", "", ""))
                {
                    values.push("");
                    names.push("");
                    displays.push(Resources.CommonLabels.NoneLabelText);
                    iconClasses.push("");
                }

                for (var fieldIndex = 0; fieldIndex < fieldNodes.length; fieldIndex++)
                {

                    var fieldNode = fieldNodes[fieldIndex];

                    var fieldValue = fieldNode.getAttribute("ID");
                    var fieldDisplay = fieldNode.selectSingleNode("Name/text()").text;
                    var fieldName = fieldNode.selectSingleNode("FieldName/text()").text;
                    var fieldType = fieldNode.getAttribute("DataType");

                    if (runFilters(options, fieldValue, fieldName, fieldDisplay, fieldType))
                    {
                        values.push(fieldValue);
                        names.push(fieldName);
                        displays.push(fieldDisplay);
                        iconClasses.push(fieldType);
                    }
                    if (checkExists(options) && checkExists(options.filter) && checkExists(options.filter.limit) && options.filter.limit === values.length)
                    {
                        break;
                    }
                }

                valuesObject.values = values;
                valuesObject.names = names;
                valuesObject.displays = displays;
                valuesObject.iconClasses = iconClasses;

                valuesObject.noIcons = true;

                return valuesObject;
            },

            getDataTypesForControl: function (options)
            {//TODO:Fix method naming,ask dave to fix method
                return _viewDesigner._getControlSupportedDataTypes(_viewDesigner._getControlType(options.grid.controlid), options.grid.controlid);
            },

            _getControlSupportedDataTypes: function (controlType, controlid)
            {
                var values = [];
                var displays = [];
                var valuesObject = {};
                var controlElem = SourceCode.Forms.Designers.Common.controlDefinitionsXml.selectSingleNode("Controls/Control[Name='" + controlType + "']");
                var fieldID = _viewDesigner._getControlFieldID(controlid);

                if (checkExists(fieldID))
                {
                    var fieldEl = _viewDesigner.View.viewDefinitionXML.selectSingleNode("SourceCode.Forms/Views/View/Sources/Source/Fields/Field[@ID='" + fieldID + "']");
                    if (fieldEl)
                    {
                        if (fieldEl.parentNode.parentNode.getAttribute("ContextType") === "Primary")
                        {
                            var fieldDatatype = fieldEl.getAttribute("DataType");
                            values.push(this._dataTypeToXmlCase(fieldDatatype));
                            displays.push(this._dataTypeToXmlCase(fieldDatatype));
                        }
                    }
                }

                if (values.length === 0)
                {
                    if ($chk(controlElem))
                    {
                        var supportedTypes = controlElem.selectNodes("DataTypes/DataType");

                        for (var s = 0; s < supportedTypes.length; s++)
                        {
                            var supportedType = supportedTypes[s].text;
                            values.push(supportedType);
                            displays.push(supportedType);
                        }
                    }
                }

                valuesObject.values = values;
                valuesObject.displays = displays;

                return valuesObject;
            },

            _cleanupChildren: function (object, removeParent)
            {
                //before clearing cell remove control behaviours and fields
                var objectlist = object.find(".controlwrapper");
                objectlist = objectlist.add(object.children("tr, td"));
                for (var i = 0; i < objectlist.length; i++)
                {
                    var item = objectlist[i];
                    _viewDesigner._removeControl(objectlist.eq(i));
                }

                if (removeParent)
                {
                    var objectid = object.attr("ID");
                    var controlToRemove = _viewDesigner.View.controlPropertiesXML.selectSingleNode('Control[@ID="' + objectid + '"]');

                    if ($chk(controlToRemove))
                    {
                        _viewDesigner.View.controlPropertiesXML.removeChild(controlToRemove);
                    }
                }

                if (_viewDesigner.View.element.find('#vdViewEditorFormsTab').hasClass('selected'))
                {
                    _viewDesigner.View.isViewEventsLoading = true;
                    setTimeout(function () { _viewDesigner._LoadViewEvents(); }.bind(_viewDesigner), 0);
                }
            },

            _clearSelectedObject: function (triggerSelected)
            {
                if (_viewDesigner.View.selectedObject)
                {
                    if (_viewDesigner.View.selectedObject.is('div'))
                    {
                        if ((_viewDesigner._getViewType() === "Capture"))
                        {
                            _viewDesigner.View.element.find("#toolDefaultCanvas").nextAll().hide();
                        }
                        else
                        {
                            _viewDesigner.View.element.find("#toolViewSettings").nextAll().hide();
                        }
                        _viewDesigner.View.element.find("#toolExpressions").show();
                    }
                    _viewDesigner.DragDrop._removeResizing(_viewDesigner.View.selectedObject);
                    _viewDesigner.View.selectedObject.removeClass('selectedobject');
                }
                _viewDesigner.View.selectedObject = null;

                if (_viewDesigner.View.element.find('#vdViewEditorFormsTab').hasClass('selected') && _viewDesigner.View.isViewEventsLoaded === false && _viewDesigner.View.isViewEventsLoading === false)
                {
                    _viewDesigner.View.isViewEventsLoading = true;
                    setTimeout(function () { _viewDesigner._LoadViewEvents(); }.bind(_viewDesigner), 0);
                }
                _viewDesigner._clearControlPropertyGrid();

                if (_viewDesigner._getViewType() === "CaptureList")
                {
                    $('div.column-hover-overlay').hide();
                    $("div.column-selected-overlay").remove();
                    $("div.drag-block").hide();
                }

                //the canvas widgets, toolbars and properties panel respond to this
                if (triggerSelected !== false)
                {
                    _viewDesigner._triggerControlSelected();
                }
            },


            //the canvas widgets, toolbars, and properties panel respond to this event
            //the load data, and change their appearance based on the selected control (controlObjectModel) 
            _triggerControlSelected: function ()
            {
                //the canvas widgets, toolbars and properties panel respond to this
                SourceCode.Forms.Designers.Common.triggerEventFromControlElement("ControlSelected", _viewDesigner.View.selectedObject);
            },

            _setDefaultSelectedObject: function ()
            {
                if (checkExists(_viewDesigner.View.selectedObject) &&
                    _viewDesigner.View.selectedObject.attr("controlType") === "View")
                {
                    //If the View object has already been selected, just return.  
                    //This could happen when deleting a cell or a row that contains multiple controls and this function is called multiple times.
                    return;
                }

                _viewDesigner._clearSelectedObject(false);

                //TFS748862 - After a control, column or row is deleted, select the View by default
                _viewDesigner._setViewSelected();
            },

            _ClearViewControlProperties: function ()
            {
                var SourcesElem = _viewDesigner.View.controlPropertiesXML;

                if ($chk(SourcesElem) === true)
                {
                    _viewDesigner._removeXMLChildNodes(SourcesElem);
                }
            },

            _showUnbindConfirmation: function ()
            {
                var options = ({
                    message: Resources.ViewDesigner.UnbindControlMsg,
                    onAccept: function ()
                    {
                        _viewDesigner._executeControlBinding(_viewDesigner.View._findControlFromSelectedObject(), null);
                        popupManager.closeLast();
                    }
                });

                popupManager.showConfirmation(options);
            },

            _unbindControl: function (options)
            {
                var control;
                if (checkExists(options.control))
                {
                    control = options.control;
                }
                else
                {
                    return false;
                }

                var unboundDataType = checkExists(options.unboundDataType) ? options.unboundDataType : null;
                var deleteUserResultMappings = checkExists(options.deleteUserResultMappings) ? options.deleteUserResultMappings : false;

                var controlID = control.attr("id");
                var propID = control.attr("propertyid");
                var fieldID = null;
                var fieldDisplayName = "";
                var objectPropertyName = "";
                var viewFieldName = "";

                control.removeAttr('friendlyname');
                control.attr('itemtype', 'control');
                control.removeAttr('references');
                control.removeAttr('soid');
                control.removeAttr('propertytype');
                control.removeAttr('propertyid');

                var viewControlNode = _viewDesigner.View.viewDefinitionXML.selectSingleNode('SourceCode.Forms/Views/View/Controls/Control[@ID="' + controlID + '"]');

                if (checkExists(viewControlNode))
                {
                    fieldID = viewControlNode.getAttribute("FieldID");

                    if (checkExists(fieldID))
                    {
                        var fieldNode = _viewDesigner.View.viewDefinitionXML.selectSingleNode(".//Source/Fields/Field[@ID='{0}']".format(fieldID));

                        if (checkExists(fieldNode))
                        {
                            objectPropertyName = getNodeValue("FieldName", fieldNode, "");
                            viewFieldName = getNodeValue("Name", fieldNode, "");
                            fieldDisplayName = getNodeValue("FieldDisplayName", fieldNode, "");
                        }

                        viewControlNode.removeAttribute("FieldID");
                    }

                    SourceCode.Forms.DependencyHelper.removeAnnotationForControlBoundsToAField(_viewDesigner.View.viewDefinitionXML, controlID);
                }

                if ((checkExists(fieldID)) && (objectPropertyName !== ""))
                {
                    var fieldControls = $("div [layouttype][propertyid='" + propID + "'][id!='" + controlID + "']");

                    var eventParametersToRemove = _viewDesigner.View.viewDefinitionXML.selectNodes('SourceCode.Forms/Views/View/Events/Event[@Type="System"]/Handlers/Handler/Actions/Action/Parameters/Parameter[(@SourceID="' + controlID + '" and (@TargetID="' + fieldID + '" or @TargetID="' + objectPropertyName + '"))]');

                    if (checkExists(eventParametersToRemove))
                    {
                        for (var i = 0; i < eventParametersToRemove.length; i++)
                        {
                            eventParametersToRemove[i].parentNode.removeChild(eventParametersToRemove[i]);
                        }
                    }

                    var eventParametersToChange = _viewDesigner.View.viewDefinitionXML.selectNodes('SourceCode.Forms/Views/View/Events/Event[@Type="User"]/Handlers/Handler/Actions/Action/Parameters/Parameter[(@SourceID="' + controlID + '" and (@TargetID="' + fieldID + '" or @TargetID="' + objectPropertyName + '"))]');

                    if (checkExists(eventParametersToChange))
                    {
                        for (var i = 0; i < eventParametersToChange.length; i++)
                        {
                            if (fieldControls.length > 0)
                            {
                                eventParametersToChange[i].setAttribute("SourceID", fieldControls[0].getAttribute("ID"));
                            }
                            else
                            {
                                eventParametersToChange[i].setAttribute("SourceID", fieldID);
                                eventParametersToChange[i].setAttribute("SourceType", "ViewField");
                                //Set TargetDisplayName and TargetName attributes for input mapping from the field
                                eventParametersToChange[i].setAttribute("SourceName", viewFieldName);
                                eventParametersToChange[i].setAttribute("SourceDisplayName", fieldDisplayName);
                            }
                        }
                    }

                    var eventResultsToRemove = _viewDesigner.View.viewDefinitionXML.selectNodes('SourceCode.Forms/Views/View/Events/Event[@Type="System"]/Handlers/Handler/Actions/Action/Results/Result[(@TargetID="' + controlID + '" and (@SourceID="' + fieldID + '" or @SourceID="' + objectPropertyName + '"))]');
                    for (var i = 0; i < eventResultsToRemove.length; i++)
                    {
                        eventResultsToRemove[i].parentNode.removeChild(eventResultsToRemove[i]);
                    }
                    var eventResultsToChange = _viewDesigner.View.viewDefinitionXML.selectNodes('SourceCode.Forms/Views/View/Events/Event[@Type="User"]/Handlers/Handler/Actions/Action/Results/Result[(@TargetID="' + controlID + '" and (@SourceID="' + fieldID + '" or @SourceID="' + objectPropertyName + '"))]');

                    for (var i = 0; i < eventResultsToChange.length; i++)
                    {
                        if (deleteUserResultMappings === true)
                        {
                            if (eventResultsToChange[i].getAttribute("SourceType") !== "Value")
                            {
                                eventResultsToChange[i].parentNode.removeChild(eventResultsToChange[i]);
                            }
                        }
                        else
                        {
                            if (fieldControls.length > 0)
                            {
                                eventResultsToChange[i].setAttribute("TargetID", fieldControls[0].getAttribute("ID"));
                            }
                            else
                            {
                                eventResultsToChange[i].setAttribute("TargetID", fieldID);
                                eventResultsToChange[i].setAttribute("TargetType", "ViewField");
                                //Set TargetDisplayName and TargetName attributes for resultmapping from the field
                                eventResultsToChange[i].setAttribute("TargetName", viewFieldName);
                                eventResultsToChange[i].setAttribute("TargetDisplayName", fieldDisplayName);
                            }
                        }
                    }
                }

                var propsControlNode = _viewDesigner.View.controlPropertiesXML.selectSingleNode('Control[@ID="' + controlID + '"]');
                if (checkExists(propsControlNode))
                {
                    var properties = propsControlNode.selectSingleNode("Properties");
                    if (checkExists(properties))
                    {
                        var fieldElem = properties.selectSingleNode("Property[Name='Field']");
                        if (checkExists(fieldElem))
                        {
                            properties.removeChild(fieldElem);
                        }

                        var displayFieldElem = properties.selectSingleNode("Property[Name='DisplayField']");
                        if (checkExists(displayFieldElem))
                        {
                            properties.removeChild(displayFieldElem);
                        }

                        var dataTypeElem = properties.selectSingleNode("Property[Name='DataType']");
                        if (checkExists(dataTypeElem))
                        {
                            properties.removeChild(dataTypeElem);
                        }

                        var controlType = control.attr("controltype");

                        if (checkExistsNotEmpty(controlType))
                        {
                            var controlDefXml = SourceCode.Forms.Designers.Common.controlDefinitionsXml.selectSingleNode("Controls/Control[Name='" + controlType + "']");

                            if (checkExists(controlDefXml))
                            {
                                var dataTypeAppended = false;

                                if (checkExistsNotEmpty(unboundDataType))
                                {
                                    var dataTypesXml = controlDefXml.selectNodes("DataTypes[DataType='" + unboundDataType + "']");

                                    if (dataTypesXml.length > 0)
                                    {
                                        properties.appendChild(_viewDesigner._BuildPropertyElem(null, 'DataType', unboundDataType, unboundDataType));
                                        dataTypeAppended = true;
                                    }
                                }

                                if (!dataTypeAppended)
                                {
                                    var initialDataType = controlDefXml.selectSingleNode("DefaultProperties/Properties/Prop[@ID='DataType']/InitialValue");

                                    if ((checkExists(initialDataType)) && (checkExistsNotEmpty(initialDataType.text)))
                                    {
                                        properties.appendChild(_viewDesigner._BuildPropertyElem(null, 'DataType', initialDataType.text, initialDataType.text));
                                    }
                                }
                            }
                        }

                        var assocControlElem = properties.selectSingleNode("Property[Name='AssociatedControl']");
                        if (checkExists(assocControlElem))
                        {
                            var assocControlID = assocControlElem.selectSingleNode("Value").text;
                            var assocControl = _viewDesigner.View.controlPropertiesXML.selectSingleNode('Control[@ID="' + assocControlID + '"]');
                            if (checkExists(assocControl))
                            {
                                var assocControlElem2 = assocControl.selectSingleNode("Properties/Property[Name='AssociatedControl']");
                                if (checkExists(assocControlElem2))
                                {
                                    assocControl.selectSingleNode("Properties").removeChild(assocControlElem2);
                                }
                            }
                            properties.removeChild(assocControlElem);
                        }
                    }
                }

                _viewDesigner.View.element.find('#toolUnbindControl').hide();
            },

            _bindControl: function (field, control)
            {
                var viewType = _viewDesigner._getViewType();

                if (viewType === "Capture")
                {
                    var controlID = control.attr("id");
                    var controlsElem = _viewDesigner.View.controlPropertiesXML;
                    var controlXPath = 'Control[@ID="' + controlID + '"]';
                    var controlElem = controlsElem.selectSingleNode(controlXPath);
                    var propertiesXML = controlElem.selectSingleNode("Properties");
                    var controlType = control.attr('controltype');

                    control.attr('itemtype', field.itemtype);
                    control.attr('friendlyname', field.friendlyname);
                    control.attr('references', field.references);
                    control.attr('propertytype', field.propertytype);
                    control.attr('propertyid', field.propertyid);
                    control.attr('soid', field.soid);

                    if ((checkExists(field.propertyid)) && (field.propertyid !== ""))
                    {
                        var fieldEl = _viewDesigner.View.viewDefinitionXML.selectSingleNode("SourceCode.Forms/Views/View/Sources/Source[@SourceID='" + field.soid + "' and @ContextType='Primary']/Fields/Field[FieldName/text()='" + field.propertyid + "']");
                        if (checkExists(fieldEl))
                        {
                            var fieldID = fieldEl.getAttribute("ID");
                            propertiesXML.appendChild(_viewDesigner._BuildPropertyElem(controlID, 'Field', fieldID, field.friendlyname));
                        }
                        var fieldDataType = fieldEl.getAttribute("DataType");
                        var dataTypePropertyElement = propertiesXML.selectSingleNode("Property[Name='DataType']");
                        if (checkExists(dataTypePropertyElement))
                        {
                            dataTypePropertyElement.parentNode.removeChild(dataTypePropertyElement);
                        }
                        propertiesXML.appendChild(_viewDesigner._BuildPropertyElem(null, 'DataType', _viewDesigner._dataTypeToXmlCase(fieldDataType), _viewDesigner._dataTypeToXmlCase(fieldDataType)));
                    }
                    else if ((checkExists(field.propertytype)) && (field.propertytype === "none"))
                    {
                        controlElem.removeAttribute("FieldID");
                    }

                    if ((checkExists(field.references)) && (field.references !== ""))
                    {
                        var refData = field.references.split('|');
                        var refSOName = refData[1];
                        var refSOGuid = refData[2];
                        var refProp = refData[3];
                        var refMapTo = refData[4];
                        var refMethodDetail = refData[5].split('[');
                        var refMethod = refMethodDetail[0];
                        var refDisplayProperty = _viewDesigner.DragDrop._getAssociationDisplayProperty(refSOGuid, refProp);
                        var DisplayPropData = _viewDesigner.DragDrop._getAssociationPropertyData(refSOGuid, refDisplayProperty);
                        var refFriendlyName = DisplayPropData.friendlyname;
                        var refSOFriendlyName = DisplayPropData.sofriendlyname;

                        var assocSmOPropElem = propertiesXML.selectSingleNode("Property[Name='AssociationSO']");
                        if (checkExists(assocSmOPropElem))
                        {
                            assocSmOPropElem.parentNode.removeChild(assocSmOPropElem);
                        }

                        var assocMethodPropElem = propertiesXML.selectSingleNode("Property[Name='AssociationMethod']");
                        if (checkExists(assocMethodPropElem))
                        {
                            assocMethodPropElem.parentNode.removeChild(assocMethodPropElem);
                        }

                        var valuePropElem = propertiesXML.selectSingleNode("Property[Name='ValueProperty']");
                        if (checkExists(valuePropElem))
                        {
                            valuePropElem.parentNode.removeChild(valuePropElem);
                        }

                        var dispTempPropElem = propertiesXML.selectSingleNode("Property[Name='DisplayTemplate']");
                        if (checkExists(dispTempPropElem))
                        {
                            dispTempPropElem.parentNode.removeChild(dispTempPropElem);
                        }

                        var origPropElem = propertiesXML.selectSingleNode("Property[Name='OriginalProperty']");
                        if (checkExists(origPropElem))
                        {
                            origPropElem.parentNode.removeChild(origPropElem);
                        }

                        var dataSourceTypePropElem = propertiesXML.selectSingleNode("Property[Name='DataSourceType']");
                        if (checkExists(dataSourceTypePropElem))
                        {
                            dataSourceTypePropElem.parentNode.removeChild(dataSourceTypePropElem);
                        }

                        propertiesXML.appendChild(_viewDesigner._BuildPropertyElem(controlID, 'AssociationSO', refSOGuid, refSOFriendlyName));
                        propertiesXML.appendChild(_viewDesigner._BuildPropertyElem(controlID, 'AssociationMethod', refMethod, refMethod));
                        propertiesXML.appendChild(_viewDesigner._BuildPropertyElem(controlID, 'ValueProperty', refProp, refProp));
                        propertiesXML.appendChild(_viewDesigner._BuildPropertyElem(controlID, 'DisplayTemplate', refDisplayProperty, refFriendlyName));
                        propertiesXML.appendChild(_viewDesigner._BuildPropertyElem(controlID, 'OriginalProperty', refMapTo, refMapTo));
                        propertiesXML.appendChild(_viewDesigner._BuildPropertyElem(controlID, 'DataSourceType', "SmartObject", "SmartObject"));

                        field.refSOGuid = refSOGuid;
                        field.refMethod = refMethod;
                        field.controlid = controlID;
                        field.controltype = controlType;

                    }

                    if (checkExists(propertiesXML))
                    {
                        _viewDesigner._setControlPropertiesXML(controlID, propertiesXML);
                    }

                    _viewDesigner.DragDrop._ensureMethodsPropertyActions(control, field, false);
                }
                else if (viewType === "CaptureList")
                {
                    var fieldData = {
                        itemtype: "property",
                        references: field.references,
                        propertytype: field.propertytype,
                        propertyid: field.propertyid,
                        friendlyname: field.friendlyname,
                        soid: field.soid.toLowerCase(),
                        dragtype: "external",
                        section: "bodySection",
                        addColonSuffix: _viewDesigner.View.element.find("#vdaddColonSuffixChk").is(":checked")
                    };

                    _viewDesigner.DragDrop._CaptureListDropProperty(control, fieldData, null, true);
                }

                _viewDesigner.View.element.find('#toolUnbindControl').removeClass("disabled");
                _viewDesigner.View.element.find('#toolUnbindControl').show();
            },

            _dataTypeToXmlCase: function (dataTypeLowerCase)
            {
                var dataTypeXmlCase = dataTypeLowerCase;
                dataTypeLowerCase = dataTypeLowerCase.toLowerCase();

                switch (dataTypeLowerCase)
                {
                    case "autonumber":
                        dataTypeXmlCase = "AutoNumber";
                        break;
                    case "datetime":
                        dataTypeXmlCase = "DateTime";
                        break;
                    case "decimal":
                        dataTypeXmlCase = "Decimal";
                        break;
                    case "file":
                        dataTypeXmlCase = "File";
                        break;
                    case "guid":
                        dataTypeXmlCase = "Guid";
                        break;
                    case "hyperlink":
                        dataTypeXmlCase = "Hyperlink";
                        break;
                    case "image":
                        dataTypeXmlCase = "Image";
                        break;
                    case "memo":
                        dataTypeXmlCase = "Memo";
                        break;
                    case "multivalue":
                        dataTypeXmlCase = "MultiValue";
                        break;
                    case "number":
                        dataTypeXmlCase = "Number";
                        break;
                    case "text":
                        dataTypeXmlCase = "Text";
                        break;
                    case "yesno":
                        dataTypeXmlCase = "YesNo";
                        break;
                    case "time":
                        dataTypeXmlCase = "Time";
                        break;
                    case "date":
                        dataTypeXmlCase = "Date";
                        break;
                    default:
                        break;
                }

                return dataTypeXmlCase;
            },

            _showChangeControl: function ()
            {
                var selectedObject = _viewDesigner.View._findControlFromSelectedObject();

                var options = {
                    id: 'divChangeControlPopup',
                    buttons:
                        [
                            {
                                type: "help",
                                click: function () { HelpHelper.runHelp(7042); }
                            },
                            {
                                text: Resources.WizardButtons.OKButtonText,
                                click: function ()
                                {
                                    _viewDesigner._onChangeControlHandler();
                                }
                            },
                            {
                                id: 'cmdChangeControlPopupCancel',
                                text: Resources.WizardButtons.CancelButtonText
                            }
                        ],
                    headerText: Resources.ViewDesigner.ChangeControl + ': ' + _viewDesigner._getControlProperty(selectedObject.attr('id'), "ControlName"),
                    content: $('#divChangeControl'),
                    closeWith: 'cmdChangeControlPopupCancel',
                    width: 310,
                    height: 360
                };

                popupManager.showPopup(options);
                _viewDesigner._LoadChangeControlList(selectedObject);
            },

            _selectControlChange: function (e, object)
            {
                var selectedItems = $('#divChangeControl .changeControlItem.selected');
                selectedItems.removeClass('selected');
                $(object).addClass('selected');
            },

            _collectControlDataSourceProperties: function (controlDefaultPropertiesXml, controlId)
            {
                var properties = [];

                var controlProperties = parseXML(_viewDesigner._getControlPropertiesXML(controlId)).selectNodes("Controls/Control/Properties/Property");
                var dataSourcesXml = controlDefaultPropertiesXml.selectNodes("Properties/Prop[@category='Data Source']");

                for (var i = 0; i < dataSourcesXml.length; i++)
                {
                    for (var j = 0; j < controlProperties.length; j++)
                    {
                        if (dataSourcesXml[i].getAttribute("ID") === controlProperties[j].selectSingleNode("Name").text)
                        {
                            properties.push(controlProperties[j]);
                            break;
                        }
                    }
                }

                return properties;
            },

            _getMatchingProperties: function (fromControlDefaultProperties, fromControlProperties, toControlDefaultProperties)
            {
                var matches = [];

                //skipNames skip properties that are copied manually in other parts of the functionality
                var skipNames = ["CONTROLNAME", "FIELD", "CONDITIONALSTYLES", "SOURCE",
                    "CONTROLEXPRESSION", "DATASOURCETYPE", "FIXEDLISTITEMS",
                    "ASSOCIATIONSO", "ASSOCIATIONMETHOD", "DISPLAYSO", "DISPLAYMETHOD",
                    "ASSOCIATEDJOINPROPERTY", "DISPLAYJOINPROPERTY", "ORIGINALPROPERTY",
                    "ISCOMPOSITE", "DISPLAYTEMPLATE", "PARENTJOINPROPERTY", "CHILDJOINPROPERTY", "VALUEPROPERTY"];

                //properties in this collection will be transfered regardless if they are the initial value for the previous controltype
                var skipInitialValueCheck = ["DATATYPE"];

                // find matches
                var i = toControlDefaultProperties.length;
                while (i--)
                {
                    var resolvedPropertyValue = null;
                    var resolvedPropertyDisplayValue = null;
                    var resolvedPropertyNameValue = null;
                    var toDefaultProperty = toControlDefaultProperties[i];
                    var propertyName = toDefaultProperty.getAttribute("ID");
                    var upperPropertyName = propertyName.toUpperCase();
                    if (skipNames.contains(upperPropertyName))
                    {
                        continue;
                    }
                    var toDefaultPropertyValue = toDefaultProperty.selectSingleNode("Value");

                    if (checkExists(toDefaultPropertyValue))
                    {
                        toDefaultPropertyValue = toDefaultPropertyValue.text;
                    }

                    var toDefaultPropertyInitialValue = toDefaultProperty.selectSingleNode("InitialValue");
                    if (checkExists(toDefaultPropertyInitialValue))
                    {
                        toDefaultPropertyInitialValue = toDefaultPropertyInitialValue.text;
                        resolvedPropertyValue = toDefaultPropertyInitialValue;
                    }
                    var j = fromControlProperties.length;
                    while (j--)
                    {
                        var fromProperty = fromControlProperties[j];
                        var fromPropertyName = fromProperty.selectSingleNode("Name").text;

                        if (fromPropertyName.toUpperCase() === upperPropertyName)
                        {
                            //match found on previous control
                            var fromPropertyValue = fromProperty.selectSingleNode("Value").text;

                            var fromPropertyDisplayValueNode = fromProperty.selectSingleNode("DisplayValue");
                            var fromPropertyNameValueNode = fromProperty.selectSingleNode("NameValue");

                            if (checkExists(fromPropertyDisplayValueNode))
                            {
                                resolvedPropertyDisplayValue = fromPropertyDisplayValueNode.text;
                            }
                            if (checkExists(fromPropertyNameValueNode))
                            {
                                resolvedPropertyNameValue = fromPropertyNameValueNode.text;
                            }

                            //if the control doesn't have a default value or the previous value is not the default values
                            if (!checkExists(toDefaultPropertyValue) || fromPropertyValue.toUpperCase() !== toDefaultPropertyValue.toUpperCase())
                            {
                                //if the new control does not have an initial value use the old controls value
                                if (!checkExists(toDefaultPropertyInitialValue))
                                {
                                    resolvedPropertyValue = fromPropertyValue;
                                }
                                else
                                {
                                    //if it does have an intial value first check if the previous control was using its initial value
                                    var z = fromControlDefaultProperties.length;
                                    while (z--)
                                    {
                                        var fromDefaultProperty = fromControlDefaultProperties[z];
                                        var fromDefaultPropertyName = fromDefaultProperty.getAttribute("ID");
                                        if (fromDefaultPropertyName.toUpperCase() === upperPropertyName)
                                        {
                                            var fromDefaultPropertyInitialValue = fromDefaultProperty.selectSingleNode("InitialValue");
                                            if (checkExists(fromDefaultPropertyInitialValue))
                                            {
                                                fromDefaultPropertyInitialValue = fromDefaultPropertyInitialValue.text;
                                            }
                                            if (!checkExists(fromDefaultPropertyInitialValue) ||
                                                fromPropertyValue.toUpperCase() !== fromDefaultPropertyInitialValue.toUpperCase() ||
                                                skipInitialValueCheck.contains(upperPropertyName))
                                            {
                                                //if the previous control did not have an initial value or
                                                //if the previous control had an initial value but it was not equal to the set value
                                                //or the property is the in the skipInitialValueCheck list
                                                //us the previous controls value
                                                resolvedPropertyValue = fromPropertyValue;
                                            }
                                            //exit loop when the property loop is found (z)
                                            break;
                                        }
                                    }
                                }
                            }
                            else if (checkExists(toDefaultPropertyValue) && fromPropertyValue.toUpperCase() === toDefaultPropertyValue.toUpperCase())
                            {
                                resolvedPropertyValue = null;
                            }

                            //exit loop when the property loop is found (j)
                            break;
                        }

                    }
                    if (checkExistsNotEmpty(resolvedPropertyValue))
                    {
                        matches.push({
                            name: propertyName,
                            value: resolvedPropertyValue,
                            displayName: resolvedPropertyDisplayValue,
                            nameValue: resolvedPropertyNameValue
                        });
                    }
                }

                return matches;
            },

            _changeControlUpdateControlSources: function (context)
            {
                var viewElem = SourceCode.Forms.Designers.Common.getDefinitionNode();
                var sources = viewElem.selectNodes('Sources/Source');

                if (sources !== null)
                {
                    var oldControlProperties = SourceCode.Forms.Designers.View.viewDefinitionXML.selectSingleNode('//Control[@ID="{0}"]/Properties'.format(context.controlId));
                    var newControlProperties = SourceCode.Forms.Designers.Common.controlDefinitionsXml.selectSingleNode('//Control[Name="{0}"]/DefaultProperties/Properties'.format(context.changeToControlType.controltype));

                    var oldAssociationSO = oldControlProperties.selectSingleNode('Property[Name = "AssociationSO"]/Value/text()');
                    var newAssociationSO = newControlProperties.selectSingleNode('Prop[@ID = "AssociationSO"]');
                    var oldDisplaySO = oldControlProperties.selectSingleNode('Property[Name = "DisplaySO"]/Value/text()');
                    var newDisplaySO = newControlProperties.selectSingleNode('Prop[@ID = "DisplaySO"]');
                    var oldCompositeSO = oldControlProperties.selectSingleNode('Property[Name = "CompositeSO"]/Value/text()');
                    var newCompositeSO = newControlProperties.selectSingleNode('Prop[@ID = "CompositeSO"]');

                    var i = sources.length;

                    while (i--)
                    {
                        var currentSource = sources[i];
                        var sourceContextID = currentSource.getAttribute("ContextID");
                        var sourceSourceID = currentSource.getAttribute("SourceID");
                        if (sourceContextID === context.controlId)
                        {
                            if (((oldAssociationSO !== null) && (newAssociationSO !== null) && sourceSourceID === oldAssociationSO.text) ||
                                ((oldDisplaySO !== null) && (newDisplaySO !== null) && sourceSourceID === oldDisplaySO.text) ||
                                ((oldCompositeSO !== null) && (newCompositeSO !== null) && sourceSourceID === oldCompositeSO.text))
                            {
                                //keep the source
                            }
                            else
                            {
                                currentSource.parentNode.removeChild(currentSource);
                            }
                        }
                    }
                }
            },

            _changeControl: function (changeToControl, selectedObject)
            {
                if (checkExists(selectedObject))
                {
                    var id = selectedObject[0].getAttribute("id");

                    var controlNode = _viewDesigner.View.viewDefinitionXML.selectSingleNode(
                        ".//Views/View/Controls/Control[@ID='{0}']".format(id));

                    var associatedControlProperty = _viewDesigner.View.viewDefinitionXML.selectSingleNode(
                        ".//Views/View/Controls/Control[@ID='{0}']/Properties/Property[Name='AssociatedControl']".format(id));

                    var references = selectedObject[0].getAttribute("references");

                    var isComposite;
                    var refSO;
                    var refMethod;
                    var parentControl;
                    var childJoinProperty;
                    var data;
                    var previousControlWidth = _viewDesigner._getControlProperty(id, "Width");

                    if (!($chk(references) === true))
                    {
                        isComposite = _viewDesigner._getControlProperty(id, 'IsComposite');
                        refSO = _viewDesigner._getControlPropertyValueAndDisplayValue(id, 'AssociationSO');

                        if ($chk(refSO) === true && checkExistsNotEmpty(refSO.value))
                        {
                            if (isComposite.length > 0 && isComposite.toLowerCase() === "true")
                            {
                                var refSOTempValue = _viewDesigner._getControlPropertyValueAndDisplayValue(id, 'DisplaySO');
                                refMethod = _viewDesigner._getControlPropertyValueAndDisplayValue(id, 'DisplayMethod');

                                if (refSOTempValue)
                                {
                                    refSO = refSOTempValue;
                                }
                            }

                            if (!refMethod)
                            {
                                refMethod = _viewDesigner._getControlPropertyValueAndDisplayValue(id, 'AssociationMethod');
                            }

                            parentControl = _viewDesigner._getControlProperty(id, 'ParentControl');
                            childJoinProperty = _viewDesigner._getControlProperty(id, 'ChildJoinProperty');
                            data = {
                                refSOGuid: refSO.value,
                                refSOSystemName: _viewDesigner._getAssociatedSmartObjectSystemName(refSO.value),
                                refSODisplayValue: refSO.displayValue,
                                refMethod: refMethod.value,
                                refMethodDisplayValue: refMethod.displayValue,
                                controlid: id,
                                controlname: _viewDesigner._getControlProperty(id, 'ControlName'),
                                controltype: changeToControl.controltype,
                                parentcontrol: parentControl,
                                childjoinproperty: childJoinProperty,
                                valueProperty: _viewDesigner._getControlProperty(id, 'ValueProperty')
                            };
                        }
                    }

                    //change control needs to update the control list to fire the new control types create event creation method
                    _viewDesigner.DragDrop._newControlIds.push(id);

                    var context =
                    {
                        designer: _viewDesigner,
                        designerDefinition: _viewDesigner.View.viewDefinitionXML,
                        controlType: selectedObject.attr('controltype'),
                        controlId: id,
                        fieldId: null,
                        controlDefaultProperties: SourceCode.Forms.Designers.Common.controlDefinitionsXml.selectSingleNode("Controls/Control[Name='{0}']".format(selectedObject.attr('controltype'))),
                        eventsNode: _viewDesigner.View.viewDefinitionXML.selectSingleNode("//Views/View/Events"),
                        designerType: "view",
                        eventType: "changecontrol",
                        changeToControlType: changeToControl
                    };

                    var setRuleMethod = SourceCode.Forms.Designers.getControlSetRulesMethod(context.controlType);
                    if (checkExists(setRuleMethod))
                    {
                        setRuleMethod(context);
                    }

                    if (!checkExists(setRuleMethod) || _viewDesigner._isDataSourceControl(context.controlType))
                    {
                        _viewDesigner._cleanupControlBehaviours(selectedObject, null, false);
                    }

                    _viewDesigner._changeControlUpdateControlSources(context);

                    selectedObject.attr('layouttype', 'control');
                    selectedObject.attr('controltype', changeToControl.controltype);

                    var selectedObjectResizer = $(selectedObject.children('.resizewrapper'));
                    if (selectedObjectResizer.length > 0)
                    {
                        selectedObjectResizer.empty();
                    }

                    //Set Name property
                    var boundid = "";
                    var boundFieldID = null;
                    var contextDisplayName = "";
                    switch (selectedObject.attr('itemtype'))
                    {
                        case 'method':
                            boundid = selectedObject.attr('methodid');
                            //TODO: TD 0019
                            contextDisplayName = boundid;
                            break;
                        case 'property':
                            boundid = selectedObject.attr('propertyid');
                            contextDisplayName = selectedObject.attr("friendlyname");
                            boundFieldID = _viewDesigner._getControlFieldID(id);
                            break;
                    }

                    var controlDefaultPropertiesEl = SourceCode.Forms.Designers.Common.controlDefinitionsXml.selectSingleNode("Controls/Control[Name='" + changeToControl.controltype + "']/DefaultProperties");

                    var fromControlDefaultProperties = SourceCode.Forms.Designers.Common.controlDefinitionsXml.selectNodes("Controls/Control[Name='" + context.controlType + "']/DefaultProperties/Properties/Prop");

                    var dataSourceProperties = _viewDesigner._collectControlDataSourceProperties(controlDefaultPropertiesEl, id);

                    var defaultProperties = controlDefaultPropertiesEl.selectNodes("Properties/Prop");
                    var controlProperties = _viewDesigner.View.viewDefinitionXML.selectNodes(".//Views/View/Controls/Control[@ID='{0}']/Properties/Property".format(selectedObject.attr("id")));

                    var matches = _viewDesigner._getMatchingProperties(fromControlDefaultProperties, controlProperties, defaultProperties);

                    // clear control properties
                    _viewDesigner._ClearControlProperties(selectedObject.attr('id'));

                    var propertiesXML = _viewDesigner.View.viewDefinitionXML.createElement("Properties");
                    var controlName = _viewDesigner.DesignerTable._BuildControlName(id, contextDisplayName, changeToControl.controltype);
                    propertiesXML.appendChild(_viewDesigner._BuildPropertyElem(id, 'ControlName', controlName, controlName));

                    if ($chk(boundFieldID))
                    {
                        if ($chk(controlDefaultPropertiesEl))
                        {
                            var hasFieldProp = controlDefaultPropertiesEl.selectSingleNode("Properties/Prop[@ID='Field']");

                            if ($chk(hasFieldProp))
                            {
                                propertiesXML.appendChild(_viewDesigner._BuildPropertyElem(id, 'Field', boundFieldID, boundid));
                            }
                        }
                    }

                    //setup reference properties//
                    if ($chk(references) === true)
                    {
                        var refData = references.split('|');
                        var refSOGuid = refData[2];
                        var refProp = refData[3];
                        var refMapTo = refData[4];
                        var refMethodDetail = refData[5].split('[');
                        var refMethod = refMethodDetail[0];

                        var loadData = {};
                        loadData.controlid = id;
                        loadData.controlname = controlName;
                        loadData.refMethod = refMethod;
                        loadData.refSOGuid = refSOGuid;
                        loadData.valueProperty = refProp;
                        loadData.definitionXml = _viewDesigner.View.viewDefinitionXML;
                        loadData.designer = _viewDesigner;

                        if (changeToControl.category === '1' && _viewDesigner._isLegacyListingControl(changeToControl.controltype))
                        {
                            _viewDesigner._BuildDefaultLoadBehaviour(loadData);
                        }
                        else if (changeToControl.category === "1" && changeToControl.controltype.toLowerCase() === "lookup")
                        {
                            _viewDesigner._buildLookupControlLoadBehaviour(loadData);
                        }
                    }
                    else
                    {
                        if (changeToControl.category === "1")
                        {
                            if (checkExists(refSO) && checkExistsNotEmpty(refSO.value) && _viewDesigner._isLegacyListingControl(changeToControl.controltype))
                            {
                                _viewDesigner._BuildDefaultLoadBehaviour(data);
                            }
                            else if (checkExists(data) && changeToControl.controltype.toLowerCase() === "lookup")
                            {
                                data.controlname = controlName;
                                _viewDesigner._buildLookupControlLoadBehaviour(data);
                            }
                        }
                    }

                    // restore any control associations
                    if (associatedControlProperty !== null)
                    {
                        propertiesXML.appendChild(associatedControlProperty.cloneNode(true));
                    }

                    //fix control type styles

                    var styles = _viewDesigner.Styles._getStyles(id, changeToControl.controltype);

                    var availableStylesCollection = _viewDesigner.Styles._getControlDefinitionAvailableStyles(changeToControl.controltype);

                    if ((checkExists(availableStylesCollection)) && (checkExists(styles)))
                    {
                        var styleNodes = styles.selectNodes("Style");

                        if (styleNodes.length > 0)
                        {
                            for (var i = 0; i < styleNodes.length; i++)
                            {
                                var thisStyleNode = styleNodes[i];

                                var thisStyleName = thisStyleNode.getAttribute("Name");
                                var thisStyleIsDefault = thisStyleNode.getAttribute("IsDefault");

                                var availableStyleSelector = "Style";

                                if ((checkExists(thisStyleName)) && (checkExists(thisStyleIsDefault)))
                                {
                                    availableStyleSelector = availableStyleSelector + "[@Name='" + thisStyleName + "' and @IsDefault='" + thisStyleIsDefault + "']";
                                }
                                else if (checkExists(thisStyleName))
                                {
                                    availableStyleSelector = availableStyleSelector + "[@Name='" + thisStyleName + "']";
                                }
                                else if (checkExists(thisStyleIsDefault))
                                {
                                    availableStyleSelector = availableStyleSelector + "[@IsDefault='" + thisStyleIsDefault + "']";
                                }

                                var availableStyleNode = availableStylesCollection.selectSingleNode(availableStyleSelector);

                                if (checkExists(availableStyleNode))
                                {
                                    thisStyleNode = _viewDesigner._removeUnavailableStyleOptions(thisStyleNode, availableStyleNode);
                                }
                                else
                                {
                                    thisStyleNode.parentNode.removeChild(thisStyleNode);
                                }
                            }
                        }
                    }

                    var controlRequiresAjaxCall = _viewDesigner.AJAXCall._controlRequiresRerender(changeToControl.controltype, propertiesXML, styles);
                    if (controlRequiresAjaxCall)
                    {
                        var ControlHTML = _viewDesigner.DragDrop._GetDesignTimeHTML(changeToControl.controltype);
                        if (ControlHTML === '')
                        {
                            popupManager.showWarning(Resources.ViewDesigner.ErrorControlDefinitionNotFound + ' "' + changeToControl.controltype + '"');
                            return;
                        }
                        selectedObjectResizer.append($(ControlHTML));
                    }

                    //TODO TD:
                    //BEGIN HACK FOR WIDTH
                    if ($chk(controlDefaultPropertiesEl))
                    {
                        // check if selected control width have changed
                        // This check is for the initial width value of the control in the properties panel
                        // Basically sets the default width value of the control if the width has not been customized in the properties panel
                        if (previousControlWidth === "")
                        {
                            var defaultWidth = controlDefaultPropertiesEl.selectSingleNode("Properties/Prop[@ID='Width']/Value");
                            if ($chk(defaultWidth))
                            {
                                selectedObject.css('width', defaultWidth.text);
                            }
                            else
                            {
                                selectedObject.css('width', 'auto');
                            }
                        }

                        //Remove inline width or height if the new control does not have a width or height property
                        var newControlDefaultWidth = controlDefaultPropertiesEl.selectSingleNode("Properties/Prop[@ID='Width']/Value");
                        var newControlDefaultHeight = controlDefaultPropertiesEl.selectSingleNode("Properties/Prop[@ID='Height']/Value");

                        if (!checkExists(newControlDefaultWidth))
                        {
                            selectedObject.css('width', "");
                        }

                        if (!checkExists(newControlDefaultHeight))
                        {
                            selectedObject.css('height', "");
                        }

                    }
                    //END HACK FOR WIDTH

                    if (checkExists(propertiesXML))
                    {
                        for (var index = 0; index < matches.length; index++)
                        {
                            //Fire-up the property creation using the match
                            propertiesXML.appendChild(
                                SourceCode.Forms.Designers.Common.Rules._createEventingProperty(
                                    _viewDesigner.View.viewDefinitionXML,
                                    matches[index].name,
                                    matches[index].value,
                                    matches[index].displayName,
                                    matches[index].nameValue)
                            );
                        }

                        _viewDesigner._setControlPropertiesXML(id, propertiesXML, styles);

                        if ($chk(dataSourceProperties) && dataSourceProperties.length > 0)
                        {
                            var innerPropertiesXml = _viewDesigner.View.controlPropertiesXML.selectSingleNode("Control[@ID='" + id + "']/Properties");
                            for (var i = 0; i < dataSourceProperties.length; i++)
                            {
                                // Chrome does not support directly inserting xml element references so
                                // we need to clone them first
                                innerPropertiesXml.appendChild(dataSourceProperties[i].cloneNode(true));
                            }

                            if (innerPropertiesXml.selectSingleNode("Property/Name[text() = 'AssociationSO']") !== null
                                && innerPropertiesXml.selectSingleNode("Property/Name[text() = 'DataSourceType']") === null
                                && controlDefaultPropertiesEl.selectSingleNode("Properties/Prop[@ID='DataSourceType']") !== null)
                            {
                                innerPropertiesXml.appendChild(_viewDesigner._BuildPropertyElem(null, 'DataSourceType', 'SmartObject', 'SmartObject'));
                            }
                        }

                        if (_viewDesigner._getViewType() === "CaptureList")
                        {
                            _viewDesigner.View._doControlPropertiesForDummyData(selectedObject);
                        }
                        else
                        {
                            _viewDesigner.AJAXCall._initControlProperties(id, changeToControl.controltype, propertiesXML, styles); //edit with new style
                        }
                    }

                    _viewDesigner.View.isViewChanged = true;

                    // TODO: is this even necessary ? re-visit post 1.0.1
                    if ($chk(_viewDesigner.View.propertyGrid))
                    {
                        delete _viewDesigner.View.propertyGrid.controlid;
                    }

                    // re-select changed object
                    _viewDesigner.View.selectedObject = null;

                    if (_viewDesigner._getViewType() === "Capture" || selectedObject.parents("#toolbarSection").length > 0 ||
                        selectedObject.parents("#editableSection").length > 0)
                    {
                        _viewDesigner._configSelectedControl(selectedObject);
                    }
                    else
                    {
                        var calculatedCellIndex;
                        var closestTable = _viewDesigner.View.element.find("#bodySection table.editor-table");

                        if (selectedObject.hasClass('column-hover-overlay'))
                        {
                            calculatedCellIndex = selectedObject.data("cellIndex") + 1;
                        }
                        else
                        {
                            calculatedCellIndex = selectedObject.closest("td")[0].cellIndex + 1;
                        }

                        selectedObject = closestTable.find('>tbody>tr:nth-child(1)>td:nth-child(' + calculatedCellIndex + ')');
                        _viewDesigner._configSelectedControl(selectedObject);
                    }
                    _viewDesigner.View.element.find('#vdControlTabPropertiesTab, #vdViewEditorFormsTab').show();

                    //LG: Removed ie specific.
                    //if (window.ie) document.recalc(true);

                    switch (changeToControl.controltype.toLowerCase())
                    {
                        case "saveaspdf":
                            SourceCode.Forms.DependencyHelper.removeInvalidStylesForControl(controlNode);
                            break;
                    }

                    _viewDesigner._updatePropertyAnnotationForControl(controlProperties, controlNode);

                    SourceCode.Forms.Designers.Common.refreshBadgeForControls([id]);

                    _viewDesigner._showControlProperties(true);
                }
            },

            _onChangeControlHandler: function (event, parentEventObj)
            {
                if (checkExists(event))
                {
                    _viewDesigner._selectControlChange(event, parentEventObj);
                }

                var selectedItem = $('#divChangeControl .changeControlItem.selected');

                if (selectedItem.length === 0)
                {
                    return;
                }

                popupManager.closeLast();

                var changeToControl =
                {
                    controltype: selectedItem.data("controltype"),
                    category: selectedItem.data("category")
                };

                var selectedObject = _viewDesigner.View._findControlFromSelectedObject();

                if (!checkExists(changeToControl) || changeToControl.controltype === "none" || !checkExists(selectedObject))
                {
                    return;
                }

                var controlId = selectedObject[0].getAttribute("id");
                var sourceId = _viewDesigner._getControlProperty(controlId, 'AssociationSO');
                var controlName = _viewDesigner._getControlProperty(controlId, 'ControlName');
                var dependencies = [];
                var isChangeToNonDataSourceControl = false;

                if (checkExistsNotEmpty(sourceId) && !_viewDesigner._isDataSourceControl(changeToControl.controltype))
                {
                    //When change from control that has data source to a control that does not use data source, the old data source should be remove and dependencies should be checked.
                    //For example, change DropDown control to a Textbox control

                    var sourceDataCollection = SourceCode.Forms.Designers.getDependencyDataCollectionForExternalSource(controlId, sourceId, "");

                    dependencies = SourceCode.Forms.Designers.getDependencies(sourceDataCollection);

                    isChangeToNonDataSourceControl = true;
                }

                if (dependencies.length > 0)
                {
                    var notifierOptions =
                    {
                        references: dependencies,
                        deleteItemType: SourceCode.Forms.DependencyHelper.ReferenceType.Control,
                        deletedItemDisplayName: controlName,
                        removeObjFn: function ()
                        {
                            _viewDesigner._performChangeControl(changeToControl, selectedObject, controlId, sourceId, isChangeToNonDataSourceControl);
                        },
                        showSimpleNotifier: true,
                        removeConfirmationMessage: Resources.DependencyHelper.SimpleNotifierDefaultMessage
                    };

                    SourceCode.Forms.Designers.showDependencyNotifierPopup(notifierOptions);
                }
                else
                {
                    _viewDesigner._performChangeControl(changeToControl, selectedObject, controlId, sourceId, isChangeToNonDataSourceControl);
                }
            },

            _performChangeControl: function (changeToControl, selectedObject, controlId, sourceId, isChangeToNonDataSourceControl)
            {
                _viewDesigner._changeControl(changeToControl, selectedObject);

                if (isChangeToNonDataSourceControl === true)
                {
                    _viewDesigner._removeControlSOSource(controlId, 'AssociationSO', sourceId);
                }
            },

            // A control node may have copied the old properties without the annotation
            // This function updates the controlNode base on the annotation of the old properties
            _updatePropertyAnnotationForControl: function (oldProperties, controlNode)
            {
                var i = 0;
                var status = '';
                var nameNode = null;
                var valueNode = null;
                var propertyNode = null;

                if (!checkExists(controlNode))
                {
                    return;
                }

                for (i = 0; i < oldProperties.length; i++)
                {
                    nameNode = oldProperties[i].selectSingleNode("Name");
                    valueNode = oldProperties[i].selectSingleNode("Value");

                    if (!checkExists(nameNode) || !checkExists(valueNode))
                    {
                        continue;
                    }

                    propertyNode = controlNode.selectSingleNode("Properties/Property[Name='{0}' and Value='{1}']"
                        .format(nameNode.text, valueNode.text));

                    if (checkExists(propertyNode))
                    {
                        //This means the Control is still using the old property thus we need to copy over the annotation
                        status = oldProperties[i].getAttribute("ValidationStatus");

                        if ("Error,Missing,Warning".indexOf(status) >= 0)
                        {
                            SourceCode.Forms.DependencyHelper.cloneAnnotation(oldProperties[i], propertyNode);
                        }
                    }
                    else
                    {
                        //The Control no longer has this property thus we can remove annotation related to this property

                        var annotationToRemove = {
                            type: "",
                            guid: valueNode.text
                        };

                        switch (nameNode.text)
                        {
                            case "ControlExpression":
                                annotationToRemove.type = SourceCode.Forms.DependencyHelper.ReferenceType.ControlExpression;
                                break;
                            case "Field":
                                annotationToRemove.type = SourceCode.Forms.DependencyHelper.ReferenceType.SourceField;

                                controlNode.removeAttribute("FieldID");
                                break;
                        }

                        if (checkExistsNotEmpty(annotationToRemove.type))
                        {
                            SourceCode.Forms.DependencyHelper.removeAnnotation(controlNode, annotationToRemove);
                        }
                    }
                }
            },

            _removeUnavailableStyleOptions: function (currentStyles, availableStyles)
            {
                var curStyleChildNodes = currentStyles.selectNodes("*");

                if (curStyleChildNodes.length > 0)
                {
                    for (var i = 0; i < curStyleChildNodes.length; i++)
                    {
                        var thisStyleChildNode = curStyleChildNodes[i];
                        var availableStyleChildNode = availableStyles.selectSingleNode(thisStyleChildNode.nodeName);

                        if (checkExists(availableStyleChildNode))
                        {
                            thisStyleChildNode = _viewDesigner._removeUnavailableStyleOptions(thisStyleChildNode, availableStyleChildNode);
                        }
                        else
                        {
                            thisStyleChildNode.parentNode.removeChild(thisStyleChildNode);
                        }
                    }
                }

                return currentStyles;
            },

            _LoadChangeControlList: function (contextobject)
            {
                var controlsDoc = SourceCode.Forms.Designers.Common.controlDefinitionsXml;

                if (checkExists(controlsDoc.documentElement))
                {
                    var propertytype = _viewDesigner._getControlProperty(contextobject.attr("id"), 'DataType');

                    if (!$chk(propertytype))
                    {
                        propertytype = contextobject.attr('propertytype');
                    }
                    var RetVal = "";

                    if ($chk(propertytype) === true)
                    {
                        _viewDesigner.AJAXCall._getDataTypeControls(propertytype);
                    }
                    else
                    {
                        var itemtype = contextobject.attr('itemtype');
                        if (itemtype === 'method')
                        {
                            _viewDesigner.AJAXCall._getDataTypeControls(itemtype);
                        }
                        else
                        {
                            var findControlsXpath = "Control[@category=0 or @category=1 or (@category=2 and @group!='Lists')]";

                            if (SourceCode.Forms.Settings.Controls.ShowInternalControls !== true)
                            {
                                findControlsXpath += "[not(@flags) or not(contains(@flags,'IsInternal'))]";
                            }
                            var controls = controlsDoc.documentElement.selectNodes(findControlsXpath);
                            _viewDesigner.populateChangeControlList(controls, contextobject);
                        }
                    }
                }
            },

            populateChangeControlList: function (controls, contextobject)
            {
                if (!contextobject)
                    contextobject = _viewDesigner.View._findControlFromSelectedObject();
                var divChangeControl = $('#divChangeControl');

                divChangeControl.empty().html(SourceCode.Forms.Controls.Panel.html({ scrolling: true, fullsize: true }));

                divChangeControl.on("click", "div.changeControlItem",
                    function (event)
                    {
                        _viewDesigner._selectControlChange(event, this);
                    });

                divChangeControl.off("dblclick").on("dblclick", "div.changeControlItem",
                    function (event)
                    {
                        _viewDesigner._onChangeControlHandler(event, this);
                    });

                var controlCount = 0;
                var divChangeControlList = divChangeControl.find('.scroll-wrapper');
                for (var i = 0; i < controls.length; i++)
                {
                    var controlElem = controls[i];
                    var friendlyname = controlElem.selectSingleNode('FriendlyName').text;
                    var controlname = controlElem.selectSingleNode('Name').text;
                    var category = controlElem.getAttribute("category");
                    if (contextobject.attr('controltype') !== controlname && controlname !== "Tree")
                    {
                        var controlDiv = $('<div></div>');
                        controlDiv.addClass('changeControlItem');
                        controlDiv.data('controltype', controlname);
                        controlDiv.data('category', category);
                        controlDiv.append(document.createTextNode(friendlyname));
                        controlDiv.addClass('toolboxitem');
                        controlDiv.addClass(controlname.toLowerCase() + "-control");
                        divChangeControlList.append(controlDiv);
                        controlCount++;
                    }
                }
                if (controlCount === 0)
                {
                    var controlDiv = $('<div></div>');
                    controlDiv.addClass('changecontrolItem');
                    controlDiv.data('controltype', 'none');
                    controlDiv.data('category', 'none');
                    controlDiv.append(document.createTextNode(Resources.ViewDesigner.NoChangeControlsAvailable));
                    divChangeControlList.append(controlDiv);
                }
            },

            _controlFitToCell: function ()
            {
                if ($chk(_viewDesigner.View.selectedObject) === true)
                {
                    var currentControl = _viewDesigner.View.selectedObject;
                    var ItemType = currentControl.attr('layouttype');
                    var ControlType = currentControl.attr('controltype');

                    if ($chk(ItemType) === true)
                    {
                        if (ItemType === 'control' || (ItemType === "layoutcontainer" && ControlType === "Table"))
                        {
                            var setFunction = _viewDesigner._getPropertySetFunction(currentControl.attr('controltype'), 'Width');
                            var controlXML = _viewDesigner._getControlPropertiesXML(currentControl.attr('id')); //TFS 198707 
                            if (checkExists(setFunction))
                            {
                                //TFS 198707 
                                var value = evalFunction(setFunction)(currentControl, "100%", controlXML);
                                _viewDesigner._setControlPropertyValue(currentControl.attr("id"), "Width", "100%");
                            }
                            else
                            {

                                _viewDesigner._resetDesignWidthControl(_viewDesigner.View.selectedObject, _viewDesigner.View.selectedObject.find('.resizewrapper:first-child'));
                            }
                            controlXML = _viewDesigner._getControlPropertiesXML(currentControl.attr('id')); //re-query for the changed value
                            _viewDesigner.View.propertyGrid.valuexml = controlXML;
                            _viewDesigner.View.propertyGrid.refresh();
                            SourceCode.Forms.Designers.Common.triggerEventFromControlElement("ControlSizeChanged", currentControl);
                        }
                    }
                }
            },

            _removeControlPropertyValue: function (id, propertyName)
            {
                var Control = _viewDesigner.View.element.find('#' + id);
                if (Control.length > 0)
                {
                    var ControlType = Control.attr('controltype');
                    var properties = _viewDesigner._getProperties(id);
                    var styles = _viewDesigner.Styles._getStyles(id, ControlType);

                    var propertyElem = _viewDesigner._getControlPropertyElement(id, propertyName, properties);

                    if ($chk(propertyElem) === true)
                    {
                        properties.removeChild(propertyElem);
                    }

                    if (checkExists(properties))
                    {
                        _viewDesigner._setControlPropertiesXML(id, properties, styles);
                    }
                }
            },

            _getViewFields: function ()
            {
                var viewxmlDoc = _viewDesigner.View.viewDefinitionXML;
                var listxmlDoc = parseXML('<Items/>');
                if ($chk(viewxmlDoc) === true)
                {
                    var ViewItemElem = listxmlDoc.createElement('Item');
                    ViewItemElem.setAttribute('Guid', _viewDesigner._GetViewID());
                    ViewItemElem.setAttribute('ItemType', 'View');
                    var ViewItemName = listxmlDoc.createElement('Name');
                    var ViewItemDisplayName = listxmlDoc.createElement('DisplayName');
                    var ViewItemFieldItems = listxmlDoc.createElement('Items');

                    ViewItemName.appendChild(listxmlDoc.createTextNode(_viewDesigner._GetViewName()));
                    ViewItemDisplayName.appendChild(listxmlDoc.createTextNode(_viewDesigner._GetViewDisplayName()));
                    ViewItemElem.appendChild(ViewItemName);
                    ViewItemElem.appendChild(ViewItemDisplayName);
                    ViewItemElem.appendChild(ViewItemFieldItems);
                    listxmlDoc.documentElement.appendChild(ViewItemElem);

                    //primary fields

                    var PropParentDiv = _viewDesigner.View.element.find('#PropParent');
                    var soguid, sofriendlyname, soname;
                    if (PropParentDiv.length > 0)
                    {
                        var primary = listxmlDoc.createElement('Item');
                        var primaryName = listxmlDoc.createElement('Name');
                        var primaryDisplayName = listxmlDoc.createElement('DisplayName');
                        var primaryItems = listxmlDoc.createElement('Items');

                        soguid = PropParentDiv.attr('soguid');
                        sofriendlyname = PropParentDiv.attr('sofriendlyname');
                        soname = PropParentDiv.attr('soname');

                        primary.setAttribute('Guid', soguid);
                        primary.setAttribute('ItemType', 'FieldContext');
                        primary.setAttribute('SubType', 'User');

                        primaryName.appendChild(listxmlDoc.createTextNode(soname));
                        primary.appendChild(primaryName);

                        primaryDisplayName.appendChild(listxmlDoc.createTextNode(sofriendlyname));
                        primary.appendChild(primaryDisplayName);

                        primary.appendChild(primaryItems);

                        //get primary fields
                        var PrimarySourceElem = viewxmlDoc.selectSingleNode('//Sources/Source[@ContextType="Primary"]');
                        if ($chk(PrimarySourceElem) === true)
                        {
                            var FieldList = PrimarySourceElem.selectNodes('Fields/Field');
                            if ($chk(FieldList) === true)
                            {
                                var primarySourceId = PrimarySourceElem.getAttribute('SourceID');

                                for (var i = 0; i < FieldList.length; i++)
                                {
                                    var createViewFieldItemOptions = {
                                        fieldElem: FieldList[i],
                                        itemsXmlDoc: listxmlDoc,
                                        fieldSmoGuid: primarySourceId
                                    };

                                    var itemElem = _viewDesigner._createViewFieldItem(createViewFieldItemOptions);

                                    primaryItems.appendChild(itemElem);
                                }
                            }
                            ViewItemFieldItems.appendChild(primary);
                        }
                    }

                    //association fields
                    var OtherSourceElems = viewxmlDoc.selectNodes('//Sources/Source[@ContextType="Association" or @ContextType="External"]');
                    if ($chk(OtherSourceElems) === true)
                    {
                        for (j = 0; j < OtherSourceElems.length; j++)
                        {
                            var OtherSourceElem = OtherSourceElems[j];
                            var FieldList = OtherSourceElem.selectNodes('Fields/Field');
                            if (FieldList.length > 0)
                            {
                                //Moved this part of the code out of the for loop, FieldContextID does not change inside the loop and it is only necessary to do this code section once
                                var FieldContextID = OtherSourceElem.getAttribute('ContextID');

                                var association = ViewItemFieldItems.selectSingleNode('Item[@Guid="' + FieldContextID + '"]');
                                var associationName, associationDisplayName, associationItems;
                                if ($chk(association) === false)
                                {
                                    association = listxmlDoc.createElement('Item');
                                    association.setAttribute('Guid', FieldContextID);
                                    association.setAttribute('ItemType', 'FieldContext');
                                    association.setAttribute('SubType', _viewDesigner._getControlType(FieldContextID));

                                    var name = _viewDesigner._getControlProperty(FieldContextID, 'ControlName');
                                    associationName = listxmlDoc.createElement('Name');
                                    associationName.appendChild(listxmlDoc.createTextNode(name));
                                    associationDisplayName = listxmlDoc.createElement('DisplayName');
                                    associationDisplayName.appendChild(listxmlDoc.createTextNode(name));
                                    associationItems = listxmlDoc.createElement('Items');

                                    association.appendChild(associationName);
                                    association.appendChild(associationDisplayName);
                                    association.appendChild(associationItems);
                                    ViewItemFieldItems.appendChild(association);
                                }

                                associationItems = association.selectSingleNode('Items');

                                var otherSourceId = OtherSourceElem.getAttribute('SourceID');

                                for (var i = 0; i < FieldList.length; i++)
                                {
                                    var createViewFieldItemOptions = {
                                        fieldElem: FieldList[i],
                                        itemsXmlDoc: listxmlDoc,
                                        fieldSmoGuid: otherSourceId
                                    };

                                    var itemElem = _viewDesigner._createViewFieldItem(createViewFieldItemOptions);

                                    associationItems.appendChild(itemElem);
                                }
                            }
                        }
                    }
                }
                return listxmlDoc.xml;
            },

            /**
        *	Gets the value to use in a control display name field.
        *	@param {xmlDoc} options.viewDefinition The view definition xml which contains the control which display name to return
        *	@param {guid} options.controlId The ID of the control for which to return the display name
        */
            getControlDisplayName: function (options)
            {
                var viewDefinition = options.viewDefinition;
                var controlId = options.controlId;

                var controlDisplayName;
                var controlDisplayNameNode = viewDefinition.selectSingleNode("//Controls/Control[@ID='" + controlId + "']/Properties/Property[Name = 'ControlName']/DisplayValue");

                if (controlDisplayNameNode)
                {
                    controlDisplayName = controlDisplayNameNode.text;
                }

                if (!checkExists(controlDisplayName))
                {
                    controlDisplayNameNode = viewDefinition.selectSingleNode("//Controls/Control[@ID='" + controlId + "']/Properties/Property[Name = 'ControlName']/Value");

                    // fall back to Name
                    if (controlDisplayNameNode)
                    {
                        controlDisplayName = controlDisplayNameNode.text;
                    }

                    // fall back to Id
                    if (!checkExists(controlDisplayName))
                    {
                        controlDisplayName = controlId;
                    }
                }

                return controlDisplayName;
            },

            /**
            *	Gets the value to use in a object display name field
            *	@param {xmlDoc} options.viewDefinition The view definition xml which contains the object which display name to return
            *	@param {guid} options.objectId The ID of the object for which to return the display name
            *	@param {guid} options.controlId The ID of the control which association smo we are returning
            */
            getSmoDisplayName: function (options)
            {
                var viewDefinition = options.viewDefinition;
                var objectId = options.objectId;
                var controlId = options.controlId;

                var objectDisplayName;
                var objectDisplayNameNode;
                var smoProperty = viewDefinition.selectSingleNode("//Controls/Control[@ID='{0}']/Properties/Property[Value='{1}']".format(controlId, objectId));

                if (smoProperty)
                {
                    objectDisplayNameNode = smoProperty.selectSingleNode("DisplayValue");

                    if (objectDisplayNameNode)
                    {
                        objectDisplayName = objectDisplayNameNode.text;
                    }
                }

                if (!checkExists(objectDisplayName))
                {
                    objectDisplayName = objectId;
                }

                return objectDisplayName;
            },

            _GetViewID: function ()
            {
                var value = '';
                var xmlDoc = _viewDesigner.View.viewDefinitionXML;
                var ViewElem = xmlDoc.selectSingleNode('//Views/View');
                if (ViewElem)
                {
                    if (this.returnType && this.returnType === "xml")
                    {
                        var valueXML = parseXML("<Item Guid='" + ViewElem.getAttribute('ID').toLowerCase() + "'><Name>" + _viewDesigner._GetViewName().htmlEncode() + "</Name><DisplayName>" + _viewDesigner._GetViewDisplayName().htmlEncode() + "</DisplayName></Item>");
                        value = valueXML.selectSingleNode(".//Item");
                    }
                    else
                    {
                        value = ViewElem.getAttribute('ID').toLowerCase();
                    }
                }

                return value;
            },

            _makeChildElementsDragable: function (parent)
            {
                if ($chk(parent) === true)
                {
                    parent = $(parent);
                    var dragitems = parent.find('.draggable');
                    var dragItemsLength = dragitems.length;
                    for (var p = 0; p < dragItemsLength; p++)
                    {
                        var thisItem = $(dragitems[p]);
                        _viewDesigner._makeElementDragable(thisItem);
                    }
                }
            },

            _makeElementDragable: function (element)
            {
                var _this = this;
                element = $(element);
                if (element.hasClass('draggable'))
                {
                    var dragOptions = null;

                    if (element.hasClass("toolboxitem"))
                    {
                        dragOptions = {
                            appendTo: "body",
                            addClasses: false,
                            refreshPositions: false,
                            distance: 1,
                            delay: 20,
                            helper: 'clone',
                            drag: function (e, ui)
                            {
                                e.stopPropagation();
                            },
                            stop: function (e, ui)
                            {
                                if (!_viewDesigner.View.layoutExists())
                                {
                                    return;
                                }
                                $(".controlwrapper").removeClass("not-bindable");
                                if (_viewDesigner._getViewType() === "CaptureList")
                                {
                                    var notAllowedControls = _viewDesigner.View.element.find("#MainNavigationPane, .home-header, .wizard-header, .wizard-steptree, .wizard-buttons, #edtiorBottomPanel, #LayoutPaneContainer > .divider, #EditorCanvas > .panel-header, #EditorCanvas_panel_toolbars, #bodySection table, #bodySection div, .not-selectable.toolbars, .grid-footer.not-selectable, #editableSection, .EditableTable, .editor-table.toolbar, .editor-row.footer");
                                    notAllowedControls.removeClass("not-droppable");
                                    $(".toolbar .editor-cell.droptarget")[0].style.cursor = "";

                                    _viewDesigner.View.element.find("#footerControlDropPlaceHolder").show();

                                    var footers = _viewDesigner.View.element.find("#bodySection table.editor-table>tbody>tr.footer");
                                    $(footers[footers.length - 1]).hide();
                                }
                                SourceCode.Forms.Designers.Common.triggerEvent("ControlDragStopped");
                            },
                            start: function (e, ui)
                            {
                                e.stopPropagation();

                                SourceCode.Forms.Designers.Common.triggerEvent("ControlDragStarted", { element: e.target });

                                if (_viewDesigner._getViewType() === "CaptureList")
                                {
                                    _viewDesigner.View.element.find("#footerControlDropPlaceHolder").hide();

                                    var footers = _viewDesigner.View.element.find("#bodySection table.editor-table>tbody>tr.footer");
                                    $(footers[footers.length - 1]).show();

                                    _viewDesigner._clearSelectedObject(false);
                                }

                                _viewDesigner._startElementDrag(e, ui, this);
                            },
                            cursorAt: { left: -5, top: -5 },
                            revert: function (isDropped)
                            {
                                if (!isDropped)
                                {
                                    _viewDesigner.View.editorpanelcontainer.find('div.toolbar-droppable').css('display', 'none');
                                    if (checkExists(element))
                                    {
                                        _viewDesigner._setViewSelected();
                                    }
                                }
                            }
                        };
                    }
                    else
                    {
                        var orgItem;
                        dragOptions = {
                            appendTo: "#dragContentHolder",
                            refreshPositions: false,
                            addClasses: false,
                            distance: 1,
                            delay: 20,
                            drag: function (e, ui)
                            {
                                e.stopPropagation();
                            },
                            helper: function (e)
                            {
                                var tempElement = element;
                                if (SourceCode.Forms.Designers.Common.isMoveWidget(element))
                                {
                                    tempElement = $(SourceCode.Forms.Designers.Common._moveWidget.getAssociatedControl());
                                }
                                var container = $("<div style='width:{0}px;margin:5px;'></div>".format(tempElement.width()));
                                container.append(tempElement.clone());
                                return container;
                            },
                            start: function (e, ui)
                            {
                                e.stopPropagation();

                                SourceCode.Forms.Designers.Common.triggerEvent("ControlDragStarted", { element: e.target });

                                if (_viewDesigner._getViewType() === "CaptureList")
                                {
                                    _viewDesigner._clearSelectedObject(false);

                                    _viewDesigner.View.element.find("#footerControlDropPlaceHolder").hide();

                                    var footers = _viewDesigner.View.element.find("#bodySection table.editor-table>tbody>tr.footer");
                                    $(footers[footers.length - 1]).show();
                                }

                                if (checkExists(e.target))
                                {
                                    var controltype = $(e.target).attr("controltype");
                                }

                                if (!$(e.originalEvent.target).hasClass('drag-column'))
                                {
                                    if (SourceCode.Forms.Designers.Common.isMoveWidget(e.target))
                                    {
                                        SourceCode.Forms.Designers.Common._moveWidget.setDragging(true);
                                        e.target = $(SourceCode.Forms.Designers.Common._moveWidget.getAssociatedControl());                                        
                                    }
                                    orgItem = e.target;

                                    _viewDesigner._startElementDrag(e, ui, this);
                                }
                                else
                                {
                                    ui.helper.remove();
                                }
                            },
                            cursorAt: { left: -5, top: -5 },
                            revert: function (isDropped)
                            {
                                if (!isDropped)
                                {
                                    _viewDesigner.View.editorpanelcontainer.find('div.toolbar-droppable').css('display', 'none');
                                    var jq_target = $(orgItem);

                                    jq_target.show();
                                    if (checkExists(element))
                                    {
                                        _viewDesigner._setViewSelected();
                                    }
                                }
                            },

                            stop: function (ev, ui)
                            {
                                if (_viewDesigner._getViewType() === "CaptureList")
                                {
                                    var notAllowedControls = _viewDesigner.View.element.find("#MainNavigationPane, .home-header, .wizard-header, .wizard-steptree, .wizard-buttons, #edtiorBottomPanel, #LayoutPaneContainer > .divider, #EditorCanvas > .panel-header, #EditorCanvas_panel_toolbars, #bodySection table, #bodySection div, .not-selectable.toolbars, .grid-footer.not-selectable, #editableSection, .EditableTable");
                                    notAllowedControls.removeClass("not-droppable");
                                    $(".toolbar .editor-cell.droptarget")[0].style.cursor = "";

                                    _viewDesigner.View.element.find("#footerControlDropPlaceHolder").show();

                                    var footers = _viewDesigner.View.element.find("#bodySection table.editor-table>tbody>tr.footer");
                                    $(footers[footers.length - 1]).hide();
                                }

                                SourceCode.Forms.Designers.Common.triggerEvent("ControlDragStopped");
                            }
                        };
                    }

                    if (element.isWidget("draggable"))
                    {
                        element.draggable('destroy');	//remove previous drag
                    }

                    element.draggable(dragOptions);	//add new drag
                }
            },

            _startElementDrag: function (e, ui, _this)
            {
                if (_viewDesigner.View.CheckOut._checkViewStatus())
                {
                    ui.helper[0].style.width = ($(e.target).parent().hasClass("editor-cell") ? $(e.target).parent().outerWidth() : $(e.target).outerWidth()) + 'px';

                    if ($(ui.helper).hasClass("toolboxitem"))
                    {
                        ui.helper[0].style.width = "";
                    }
                    else if (jQuery(e.target).hasClass("controlwrapper"))
                    {
                        ui.helper[0].style.width = jQuery(e.target).outerWidth() + 'px';
                    }

                    var invalidOverlay = $("<span class=\"invalid-overlay\"></span>");

                    ui.helper.append(invalidOverlay);

                    invalidOverlay.hide();

                    SourceCode.Forms.Designers.Common._moveWidget._hide();

                    _viewDesigner.DragDrop._setupElementDropTargets(e, ui);
                }
                else
                {
                    ui.helper.remove();
                    return false;
                }
            },

            _showDetails: function (step)
            {
                if (!checkExists(_viewDesigner.View.wizardStep))
                {
                    _viewDesigner.View.wizardStep = _viewDesigner.View.GENERAL_STEP_INDEX;
                }

                if (_viewDesigner._getViewType() === "CaptureList")
                {
                    _viewDesigner.View._loadConfiguredListMethodForDetailsStep("CaptureList");
                }

                _viewDesigner._doViewNameValidation();
                _viewDesigner.View.txtName.trigger("focus");

                _viewDesigner.View.PreviousSelectedViewType = _viewDesigner.View.SelectedViewType;
            },

            //do the validation of the General step?
            _doViewNameValidation: function ()
            {
                //update which wizard steps and buttons are enabled.
                _viewDesigner._configureOptionsStep(_viewDesigner.View.GENERAL_STEP_INDEX);
            },

            _clearSelectedFields: function ()
            {
                var jqScope = _viewDesigner.View.element;
                jqScope.find("#vdchkGenerateAllFieldsInclude").checkbox().checkbox("uncheck");
                jqScope.find("#vdchkGenerateAllFieldsReadOnly").checkbox().checkbox("uncheck");
                jqScope.find(".autogen-field.include").closest("input").checkbox("uncheck");
                jqScope.find(".autogen-field.readonly").closest("input").checkbox("uncheck");
                jqScope.find("#vdchkAllMethodsToolbarButtons").checkbox("uncheck");
                jqScope.find("#vdchkAllMethodsStandardButtons").checkbox("uncheck");
                jqScope.find("#vdchkAllMethodsToolbarButtons").checkboxgroup().checkboxgroup("uncheck");
                jqScope.find("#vdchkAllMethodsStandardButtons").checkboxgroup().checkboxgroup("uncheck");
                jqScope.find("#vdrbBlankForm").radiobutton("check");
            },

            _applyViewOptionsUserSettings: function ()
            {
                var viewType = _viewDesigner._getViewType();
                var viewSettingsXmlDoc = _viewDesigner.View.viewSettingsXmlDoc;
                var viewOptionsNode = viewSettingsXmlDoc.selectSingleNode("/ViewSettings/ViewOptions");

                if (viewOptionsNode)
                {
                    switch (viewType)
                    {
                        case "Capture":
                            var captureViewSettings = viewOptionsNode.selectSingleNode("CaptureView");

                            if (checkExists(captureViewSettings))
                            {
                                var view = _viewDesigner.View;
                                view.selectedOptions.ColumnCount = $chk(captureViewSettings.selectSingleNode("ColumnsAmount")) ? parseInt(captureViewSettings.selectSingleNode("ColumnsAmount").text) : 1;
                                view.selectedOptions.RowCount = $chk(captureViewSettings.selectSingleNode("RowsAmount")) ? parseInt(captureViewSettings.selectSingleNode("RowsAmount").text) : 1;

                                if (checkExistsNotEmpty(captureViewSettings.selectSingleNode("LabelPlacement")))
                                {
                                    var value = captureViewSettings.selectSingleNode("LabelPlacement").text;
                                    if (value === "vdrbLabelLeft")
                                    {
                                        view.selectedOptions.LablePlacementLeft = true;
                                    }
                                    else
                                    {
                                        view.selectedOptions.LablePlacementLeft = false;
                                    }
                                }

                                if (checkExistsNotEmpty(captureViewSettings.selectSingleNode("AddColons")))
                                {
                                    var value = captureViewSettings.selectSingleNode("AddColons");
                                    view.selectedOptions.AddSuffix = !!value;
                                }
                            }
                            break;

                        case "CaptureList":
                            var captureListViewSettings = viewOptionsNode.selectSingleNode("CaptureListView");
                            if (checkExists(captureListViewSettings))
                            {
                                var view = _viewDesigner.View;
                                view.selectedOptions.UserAddRows = $chk(captureListViewSettings.selectSingleNode("AllowAddRows")) ? !!captureListViewSettings.selectSingleNode("AllowAddRows").text : false;
                                view.selectedOptions.UserEditRows = $chk(captureListViewSettings.selectSingleNode("AllowEditRows")) ? !!captureListViewSettings.selectSingleNode("AllowEditRows").text : false;
                                view.selectedOptions.UserRemoveRows = $chk(captureListViewSettings.selectSingleNode("AllowRemoveRows")) ? !!captureListViewSettings.selectSingleNode("AllowRemoveRows").text : false;
                                view.selectedOptions.AllowUserRefresh = $chk(captureListViewSettings.selectSingleNode("AllowListReload")) ? !!captureListViewSettings.selectSingleNode("AllowListReload").text : false;

                                view.selectedOptions.ColumnCount = $chk(captureListViewSettings.selectSingleNode("ColumnsAmount")) ? parseInt(captureListViewSettings.selectSingleNode("ColumnsAmount").text) : 0;

                                if (checkExists(captureListViewSettings.selectSingleNode("AlternateRows")))
                                {
                                    view.selectedOptions.ShadeAlternatingRows = true;
                                }
                                else
                                {
                                    view.selectedOptions.ShadeAlternatingRows = true;
                                }

                                if (checkExists(captureListViewSettings.selectSingleNode("BoldHeadings")))
                                {
                                    view.selectedOptions.BoldHeadings = true;
                                }
                                else
                                {
                                    view.selectedOptions.BoldHeadings = false;
                                }

                                if (checkExists(captureListViewSettings.selectSingleNode("Paging")))
                                {
                                    view.selectedOptions.EnablePaging = true;
                                    view.selectedOptions.PagingCount = parseInt(captureListViewSettings.selectSingleNode("Paging").text);
                                }
                                else
                                {
                                    view.selectedOptions.EnablePaging = false;
                                }

                                if (checkExists(captureListViewSettings.selectSingleNode("ShowFilter")))
                                {
                                    view.selectedOptions.EnableFiltering = true;
                                }
                                else
                                {
                                    view.selectedOptions.EnableFiltering = false;
                                }

                                if (checkExists(captureListViewSettings.selectSingleNode("HideAddRow")))
                                {
                                    view.selectedOptions.EnableAddRowLink = false;
                                }
                                else
                                {
                                    view.selectedOptions.EnableAddRowLink = true;
                                }
                            }
                            break;
                        default:
                            // TODO: LOG
                            break;
                    }
                }
            },

            _showStepFinish: function (step)
            {
                _viewDesigner.View.isOnFinishStep = true;

                _viewDesigner.View.wizard.wizard("disable", "button", "forward");
            },

            _loadPropertyTypeProperties: function (propertiesXML, id, controlType, propertyType)
            {
                if (checkExists(propertyType))
                {
                    var propertyTypeStyles = SCStyleHelper.PropertyTypeStyles();
                    if (checkExists(propertyTypeStyles))
                    {
                        var propertyTypeXpath = "PropertyTypes/PropertyType[Name='{0}']/Properties/Property[Name!='Styles']".format(propertyType);
                        var nodes = propertyTypeStyles.selectNodes(propertyTypeXpath);
                        var nl = nodes.length;
                        while (nl--)
                        {
                            var currentNode = nodes[nl];
                            var propertyName = currentNode.selectSingleNode("Name").text;
                            var query = "Controls/Control[Name='{0}']/DefaultProperties/Properties/Prop[@ID='{1}']".format(controlType, propertyName);
                            var controlTypeSupportsProperty = checkExists(SourceCode.Forms.Designers.Common.controlDefinitionsXml.selectSingleNode(query));
                            if (controlTypeSupportsProperty)
                            {
                                var propertyValue = currentNode.selectSingleNode("Value").text;
                                var propertyDisplay = currentNode.selectSingleNode("Display");
                                propertyDisplay = (propertyDisplay) ? propertyDisplay.text : propertyValue;
                                propertiesXML.appendChild(_viewDesigner._BuildPropertyElem(id, propertyName, propertyValue, propertyDisplay));
                            }
                        }
                    }
                }
            },

            _getProperties: function (id)
            {
                var xmlDoc = _viewDesigner.View.viewDefinitionXML;
                if ($chk(xmlDoc))
                {
                    var propertiesXml = xmlDoc.selectSingleNode("//Views/View/Controls/Control[@ID='{0}']/Properties[Property]".format(id));
                    return propertiesXml;
                }
                return null;
            },

            _BuildMethodBehaviour: function (methodData)
            {
                var viewName = _viewDesigner._GetViewName();
                var ruleName = Resources.ViewDesigner.MethodBehaviourName.format(methodData.controlname, Resources.ViewDesigner.ControlEvent_OnClick);
                var viewDisplayName = _viewDesigner._GetViewDisplayName();
                var eventsElem = _viewDesigner.View.viewDefinitionXML.selectSingleNode('//Views/View/Events');

                if ($chk(eventsElem) === false)
                {
                    eventsElem = _viewDesigner.View.viewDefinitionXML.createElement('Events');

                    _viewDesigner.View.viewDefinitionXML.selectSingleNode('//Views/View').appendChild(eventsElem);
                }

                var eventElem = _viewDesigner.View.viewDefinitionXML.createElement('Event');
                var eventNameElem = _viewDesigner.View.viewDefinitionXML.createElement('Name');
                var handlersElem = _viewDesigner.View.viewDefinitionXML.createElement('Handlers');
                var handlerElem = _viewDesigner.View.viewDefinitionXML.createElement('Handler');
                var eventListenersElem = _viewDesigner.View.viewDefinitionXML.createElement('Actions');
                var listenerElem = _viewDesigner.View.viewDefinitionXML.createElement('Action');
                var propertiesElem = _viewDesigner.View.viewDefinitionXML.createElement('Properties');
                var actionPropertiesElem = _viewDesigner.View.viewDefinitionXML.createElement('Properties');
                var namePropertyElem = _viewDesigner.View.viewDefinitionXML.createElement('Property');
                var namePropertyNameElem = _viewDesigner.View.viewDefinitionXML.createElement('Name');
                var namePropertyValueElem = _viewDesigner.View.viewDefinitionXML.createElement('Value');
                var descriptionPropertyElem = _viewDesigner.View.viewDefinitionXML.createElement('Property');
                var descriptionPropertyNameElem = _viewDesigner.View.viewDefinitionXML.createElement('Name');
                var descriptionPropertyValueElem = _viewDesigner.View.viewDefinitionXML.createElement('Value');

                eventElem.setAttribute('ID', String.generateGuid());
                eventElem.setAttribute("DefinitionID", String.generateGuid());
                eventElem.setAttribute('Type', "User");
                eventElem.setAttribute('ViewID', methodData.viewid);
                eventElem.setAttribute('SourceType', "Control");
                eventElem.setAttribute('SourceID', methodData.controlid);
                eventElem.setAttribute('SourceName', methodData.controlname);
                eventElem.setAttribute('SourceDisplayName', methodData.controlname);

                listenerElem.setAttribute('Type', "Execute");
                listenerElem.setAttribute('ExecutionType', 'Synchronous');
                listenerElem.setAttribute('ItemState', 'All');

                eventNameElem.appendChild(_viewDesigner.View.viewDefinitionXML.createTextNode('OnClick'));
                namePropertyNameElem.appendChild(_viewDesigner.View.viewDefinitionXML.createTextNode('RuleFriendlyName'));
                namePropertyValueElem.appendChild(_viewDesigner.View.viewDefinitionXML.createTextNode(ruleName));

                actionPropertiesElem.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(_viewDesigner.View.viewDefinitionXML, "ViewID", methodData.viewid, viewDisplayName, viewName));
                actionPropertiesElem.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(_viewDesigner.View.viewDefinitionXML, "Method", methodData.methodid, methodData.methodid));
                actionPropertiesElem.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(_viewDesigner.View.viewDefinitionXML, "Location", "View", viewDisplayName, viewName));

                propertiesElem.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(_viewDesigner.View.viewDefinitionXML, "Location", viewName, viewDisplayName));
                propertiesElem.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(_viewDesigner.View.viewDefinitionXML, "ViewID", _viewDesigner._GetViewID(), viewDisplayName, viewName));

                namePropertyElem.appendChild(namePropertyNameElem);
                namePropertyElem.appendChild(namePropertyValueElem);
                propertiesElem.appendChild(namePropertyElem);
                eventElem.appendChild(eventNameElem);
                eventElem.appendChild(propertiesElem);
                listenerElem.appendChild(actionPropertiesElem);
                eventListenersElem.appendChild(listenerElem);
                handlerElem.appendChild(eventListenersElem);
                handlersElem.appendChild(handlerElem);
                eventElem.appendChild(handlersElem);
                eventsElem.appendChild(eventElem);

                _viewDesigner._BuildMethodActionParamenters(_viewDesigner.View.viewDefinitionXML, listenerElem, methodData);

                if (_viewDesigner.View.element.find('#vdViewEditorFormsTab').hasClass('selected') && _viewDesigner.View.isViewEventsLoaded === false && _viewDesigner.View.isViewEventsLoading === false)
                {
                    _viewDesigner.View.isViewEventsLoading = true;
                    setTimeout(function () { _viewDesigner._LoadViewEvents(); }.bind(_viewDesigner), 0);
                }
            },

            _updateRulesLocation: function ()
            {
                var currentUserEvents = _viewDesigner.View.viewDefinitionXML.selectNodes("SourceCode.Forms/Views/View/Events/Event[(@Type='User') and (not(@IsReference) or @IsReference='False') and (not(@SubFormID))]");

                for (var c = 0; c < currentUserEvents.length; c++)
                {
                    var locationEl = currentUserEvents[c].selectSingleNode("Properties/Property[Name='Location']/Value");

                    if ($chk(locationEl))
                    {
                        if (checkExists(locationEl.firstChild))
                        {
                            locationEl.removeChild(locationEl.firstChild);
                        }

                        locationEl.appendChild(_viewDesigner.View.viewDefinitionXML.createTextNode(_viewDesigner._GetViewDisplayName()));
                    }
                }
            },

            _showCaptureViewCanvas: function (step)
            {
                var isListing = 0;
                var ViewType = _viewDesigner._getViewType();

                if (ViewType === 'CaptureList')
                {
                    isListing = 1;
                }

                _viewDesigner.View.isViewEventsLoaded = false;
                _viewDesigner.View.isViewEventsLoading = false;

                _viewDesigner.View.element.find("#controlToolboxGroupLists").hide();

                if (_viewDesigner.View.isSmartObjectLoaded === false)
                {
                    if ($chk(_viewDesigner.View.SelectedSmartObjectGuid) === true)
                    {
                        setTimeout(function ()
                        {
                            _viewDesigner._initViewCanvasStep(); //TODO:Partial Pages Check if _viewDesigner is correct and not extra load
                        }.bind(_viewDesigner), 10);
                    }
                    else
                    {
                        _viewDesigner.View.isSmartObjectLoaded = true; // TODO: What is the meaning of this?
                    }
                }

                if ($chk(_viewDesigner.View.SelectedSmartObjectGuid))
                {
                    _viewDesigner._selectViewEditorControlTab(0, _viewDesigner.View.element.find('#ViewEditorControlFieldsTab'));
                }
                else
                {
                    _viewDesigner._selectViewEditorControlTab(2, _viewDesigner.View.element.find('#ViewEditorControlToolboxTab'));
                }
            },


            //initialize the Layout (canvas step)
            _initViewCanvasStep: function ()
            {
                _viewDesigner._doViewCanvasInit();
                _viewDesigner.View.isSmartObjectLoaded = true;
                _viewDesigner.View.element.find('#ControlTabsContent').removeOverlay();
            },

            _getControlTypePropertyDefinition: function (controltype)
            {
                var controlTypePropDefinition = _viewDesigner.View.viewDefinitionXML.createElement("Properties");
                var controlsXml = SourceCode.Forms.Designers.Common.controlDefinitionsXml;
                var xPath = 'Controls/Control[Name="' + controltype + '"]/DefaultProperties';

                var controlPropDefElem = controlsXml.selectSingleNode(xPath);
                if (controlPropDefElem)
                    controlTypePropDefinition = controlPropDefElem;

                return controlTypePropDefinition;
            },

            _getControlPropertiesXML: function (controlID)
            {
                var retVal = '<Controls>';

                var controlXPath = 'Control[@ID="' + controlID + '"]';
                var controlElem = _viewDesigner.View.controlPropertiesXML.selectSingleNode(controlXPath);
                if ($chk(controlElem) === true)
                {
                    retVal += controlElem.xml;
                }
                else
                {
                    retVal += '<Control id="' + controlID + '"/>';
                }

                retVal += '</Controls>';
                return retVal;
            },

            _showControlProperties: function (forceRefresh)
            {
                if (_viewDesigner.View.selectedObject)
                {
                    var controlType = _viewDesigner.View.selectedObject[0].getAttribute('controltype');

                    ///Load the selected control properties header (icon and title)
                    _viewDesigner._updatePropertiesHeader(controlType);

                    _viewDesigner.View.element.find('#ControlTabsContent').overlay();

                    var isView = controlType === "View";
                    if (isView === true ||
                        _viewDesigner.View.selectedObject.hasClass('controlwrapper') ||
                        _viewDesigner._isTableCellControl(_viewDesigner.View.selectedObject) ||
                        _viewDesigner._isTableColumnControl(_viewDesigner.View.selectedObject))
                    {
                        _viewDesigner._applyBadgingToPropertyGridTabs('Capture');

                        if (_viewDesigner.View.element.find('#vdControlTabPropertiesTab').hasClass('selected'))
                        {
                            var control = _viewDesigner.View.selectedObject;
                            var controlID = control.attr('id');
                            var id = 'ReadOnlyProperties_' + controlID;
                            var readonly = false;
                            var definitionxml = _viewDesigner._getControlTypePropertyDefinition(_viewDesigner.View.selectedObject.attr("controltype"));
                            var valuexml = _viewDesigner._getControlPropertiesXML(_viewDesigner.View.selectedObject.attr('id'));

                            var doPropertyGrid = true;
                            if ($chk(_viewDesigner.View.propertyGrid))
                            {
                                doPropertyGrid = _viewDesigner._doPropertyGrid(_viewDesigner.View.propertyGrid.controlid, controlID, forceRefresh);
                            }

                            if (doPropertyGrid)
                            {
                                if (_viewDesigner.View.propertyGrid)
                                {
                                    _viewDesigner.View.propertyGrid.element.remove();
                                    delete _viewDesigner.View.propertyGrid;
                                }

                                _viewDesigner.View.propertyGrid = SourceCode.Forms.Designers.View.PropertyGrid._create({ id: id, controlid: _viewDesigner.View.selectedObject.attr('id'), readonly: readonly, definitionxml: definitionxml, valuexml: valuexml, container: _viewDesigner.View.element.find('#controlPropertiesListTable') });

                                _viewDesigner.View.element.find('#ControlTabsContent').removeOverlay();
                            }
                            else
                            {
                                _viewDesigner.View.element.find('#ControlTabsContent').removeOverlay();
                            }
                        }
                    }
                    else if (_viewDesigner._isListViewColumn(_viewDesigner.View.selectedObject))
                    {
                        var control = _viewDesigner.View.getSelectedBodyControl();

                        if (checkExists(control))
                        {
                            controlID = control.attr('id');

                            //Check if selected control might be an empty ListView Column
                            if (checkExists(controlID))
                            {
                                _viewDesigner._applyBadgingToPropertyGridTabs('CaptureList');
                            }
                        }

                        if (_viewDesigner.View.element.find('#vdColumnTabPropertiesTab').hasClass('selected'))
                        {
                            control = _viewDesigner.View.selectedObject;
                            var controlID = control.attr('id');
                            var controlType = control.attr("controltype");

                            if (_viewDesigner._getViewType() === "CaptureList")
                            {
                                //hack to get column control id
                                var cellIndex = _viewDesigner.View.selectedObject[0].cellIndex;
                                var columns = _viewDesigner.View.viewDefinitionXML.selectNodes("SourceCode.Forms/Views/View/Canvas/Sections/Section/Control/Columns/Column");
                                if (columns.length > cellIndex)
                                {
                                    controlType = "Column";
                                    controlID = columns[cellIndex].getAttribute("ID");
                                }
                                //end hack
                            }

                            var id = 'ReadOnlyProperties_' + controlID;
                            var readonly = false;
                            var definitionxml = _viewDesigner._getControlTypePropertyDefinition(controlType);
                            var valuexml = _viewDesigner._getControlPropertiesXML(controlID);
                            var doPropertyGrid = true;

                            if ($chk(_viewDesigner.View.propertyGrid))
                            {
                                doPropertyGrid = _viewDesigner._doPropertyGrid(_viewDesigner.View.propertyGrid.controlid, controlID, forceRefresh);
                            }

                            if (doPropertyGrid)
                            {
                                if (_viewDesigner.View.propertyGrid)
                                {
                                    delete _viewDesigner.View.propertyGrid;
                                }

                                _viewDesigner.View.propertyGrid = SourceCode.Forms.Designers.View.PropertyGrid._create({ id: id, controlid: controlID, readonly: readonly, definitionxml: definitionxml, valuexml: valuexml, container: _viewDesigner.View.element.find('#controlPropertiesListTable') });

                                _viewDesigner.View.element.find('#ControlTabsContent').removeOverlay();
                            } else
                            {
                                _viewDesigner.View.element.find('#ControlTabsContent').removeOverlay();
                            }

                            _viewDesigner.View.element.find('#ControlTabsContent').removeOverlay();
                        }
                        else if (_viewDesigner.View.element.find('#vdControlTabPropertiesTab').hasClass('selected'))
                        {
                            var control = _viewDesigner.View.selectedObject.find("div.controlwrapper");
                            var controlID = control.attr('id');
                            var id = 'ReadOnlyProperties_' + controlID;
                            var readonly = false;
                            var definitionxml = _viewDesigner._getControlTypePropertyDefinition(control.attr("controltype"));
                            var valuexml = _viewDesigner._getControlPropertiesXML(controlID);
                            var doPropertyGrid = true;

                            if ($chk(_viewDesigner.View.propertyGrid))
                            {
                                doPropertyGrid = _viewDesigner._doPropertyGrid(_viewDesigner.View.propertyGrid.controlid, controlID, forceRefresh);
                            }

                            if (doPropertyGrid)
                            {
                                if (_viewDesigner.View.propertyGrid)
                                {
                                    delete _viewDesigner.View.propertyGrid;
                                }

                                _viewDesigner.View.propertyGrid = SourceCode.Forms.Designers.View.PropertyGrid._create({ id: id, controlid: controlID, readonly: readonly, definitionxml: definitionxml, valuexml: valuexml, container: _viewDesigner.View.element.find('#controlPropertiesListTable') });

                                _viewDesigner.View.element.find('#ControlTabsContent').removeOverlay();
                            } else
                            {
                                _viewDesigner.View.element.find('#ControlTabsContent').removeOverlay();
                            }
                        }
                        else if (_viewDesigner.View.element.find('#vdBodyTabPropertiesTab').hasClass('selected'))
                        {
                            var cellIndex = _viewDesigner.View.selectedObject[0].cellIndex;
                            var editableColumn = _viewDesigner.View.element.find("#bodySection table.editor-table>tbody>tr.editor-row:nth-child(2)>td:nth-child(" + (cellIndex + 1) + ")");
                            var control = _viewDesigner.View._findControlFromSelectedObject();
                            var controlID = control.attr('id');
                            var id = 'ReadOnlyProperties_' + controlID;
                            var readonly = false;
                            var definitionxml = _viewDesigner._getControlTypePropertyDefinition(control.attr("controltype"));
                            var valuexml = _viewDesigner._getControlPropertiesXML(controlID);
                            var doPropertyGrid = true;

                            if ($chk(_viewDesigner.View.propertyGrid))
                            {
                                doPropertyGrid = _viewDesigner._doPropertyGrid(_viewDesigner.View.propertyGrid.controlid, controlID, forceRefresh);
                            }

                            if (doPropertyGrid)
                            {
                                if (_viewDesigner.View.propertyGrid)
                                {
                                    delete _viewDesigner.View.propertyGrid;
                                }

                                _viewDesigner.View.propertyGrid = SourceCode.Forms.Designers.View.PropertyGrid._create({ id: id, controlid: controlID, readonly: readonly, definitionxml: definitionxml, valuexml: valuexml, container: _viewDesigner.View.element.find('#controlPropertiesListTable') });

                                _viewDesigner.View.element.find('#ControlTabsContent').removeOverlay();
                            } else
                            {
                                _viewDesigner.View.element.find('#ControlTabsContent').removeOverlay();
                            }
                        }
                    } else
                    {
                        _viewDesigner.View.element.find('#ControlTabsContent').removeOverlay();
                    }
                }
            },

            _isListViewColumn: function (selectedObj)
            {
                if (!checkExists(selectedObj))
                {
                    return false;
                }

                if (selectedObj.hasClass("header") && _viewDesigner.View.SelectedViewType === 'CaptureList')
                {
                    return true;
                }

                return false;
            },

            _isTableCellControl: function (selectedObj)
            {
                if (_viewDesigner.View.SelectedViewType !== "Capture" &&
                    _viewDesigner.View.SelectedViewType !== "CaptureList")
                {
                    return false;
                }


                if (!checkExists(selectedObj) ||
                    !checkExists(selectedObj[0]) ||
                    selectedObj[0].tagName.toLowerCase() !== "td" &&
                    selectedObj[0].getAttribute("controltype") !== "Cell")
                {
                    //The selected object is not a cell
                    return false;
                }

                var tableControl = selectedObj.closest("div.controlwrapper");

                if (tableControl.attr("controltype") === "Table" || tableControl.attr("layout") === "Table")
                {
                    return true;
                }

                return false;
            },

            _isTableColumnControl: function (selectedObj)
            {
                if (_viewDesigner.View.SelectedViewType !== "Capture" &&
                    _viewDesigner.View.SelectedViewType !== "CaptureList")
                {
                    return false;
                }


                if (!checkExists(selectedObj) ||
                    !checkExists(selectedObj[0]) ||
                    selectedObj[0].tagName.toLowerCase() !== "col")
                {
                    //The selected object is not a table column
                    return false;
                }

                var tableControl = selectedObj.closest("div.controlwrapper");

                if (tableControl.attr("controltype") === "Table" || tableControl.attr("layout") === "Table")
                {
                    return true;
                }

                var widgetTableControl = selectedObj.closest(".columnResizeWidgetWrapper");

                if (widgetTableControl.length > 0)
                {
                    //the selected object is a column of the table resize widget which temproary represent a Column for a Table control.
                    return true;
                }

                return false;
            },

            _doPropertyGrid: function (gridControlId, controlID, forceRefresh)
            {
                var doPropertyGrid = true;
                if (gridControlId === controlID)
                {
                    doPropertyGrid = false;

                    if (forceRefresh === true)
                    {
                        doPropertyGrid = true;
                    }
                }
                else
                {
                    doPropertyGrid = true;
                }

                return doPropertyGrid;
            },

            _applyBadgingToPropertyGridTab: function (controlID, tabID)
            {
                var xmlNode = null;
                var validationStatus = '';
                var applyBadging = false;

                if (checkExistsNotEmpty(controlID))
                {
                    xmlNode = _viewDesigner.View.controlPropertiesXML.selectSingleNode('Control[@ID="' + controlID + '"]');
                }

                if (checkExists(xmlNode))
                {
                    validationStatus = xmlNode.getAttribute("ValidationStatus");
                }

                if (checkExistsNotEmpty(validationStatus))
                {
                    if (validationStatus.indexOf("Error") >= 0 ||
                        validationStatus.indexOf("Warning") >= 0 ||
                        validationStatus.indexOf("Missing") >= 0)
                    {
                        applyBadging = true;
                    }
                }

                if (applyBadging === false)
                {
                    // Not all validation errors bubble up to the control level so check the properties for errors

                    var dependancies =
                        SourceCode.Forms.Designers.Common.getControlPropertyDependencyIssues(controlID);

                    for (var i = 0; i < dependancies.length; i++)
                    {
                        var dependency = dependancies[0];
                        if (dependency.hasError)
                        {
                            applyBadging = true;
                            break;
                        }
                    }
                }

                if (applyBadging)
                {
                    _viewDesigner.View.element.find('#{0}'.format(tabID)).find('.tab-icon').addClass('error');
                    _viewDesigner.View.element.find('#{0}'.format(tabID)).attr('title', Resources.CommonLabels.PropertyTabHasErrorTooltip);
                }
            },

            _applyBadgingToPropertyGridTabs: function (viewType)
            {
                var designerCommon = SourceCode.Forms.Designers.Common;
                var control = null;
                var controlID = '';

                _viewDesigner.View.element.find("#vdControlTabPropertiesTab").find('.tab-icon').removeClass("error");
                _viewDesigner.View.element.find("#vdControlTabPropertiesTab").attr("title", '');

                _viewDesigner.View.element.find("#vdBodyTabPropertiesTab").find('.tab-icon').removeClass("error");
                _viewDesigner.View.element.find("#vdBodyTabPropertiesTab").attr("title", '');

                switch (viewType)
                {
                    case "Capture":
                        control = _viewDesigner.View._findControlFromSelectedObject();
                        if (checkExists(control))
                        {
                            controlID = control.attr('id');

                            _viewDesigner._applyBadgingToPropertyGridTab(controlID, "vdControlTabPropertiesTab");
                        }

                        break;
                    case "CaptureList":
                        //Body tab looks for the Control with Type="DataLabel"
                        control = _viewDesigner.View.getSelectedBodyControl();
                        if (checkExists(control))
                        {
                            controlID = control.attr('id');

                            if (designerCommon.checkControlPropertyHasDependencyIssue(controlID, "Field").hasError ||
                                designerCommon.checkControlPropertyHasDependencyIssue(controlID, "ControlExpression").hasError ||
                                designerCommon.checkControlConditionalStylesHasDependencyIssue(controlID).hasError)
                            {
                                _viewDesigner.View.element.find('#vdBodyTabPropertiesTab').find('.tab-icon').addClass('error');
                                _viewDesigner.View.element.find('#vdBodyTabPropertiesTab').attr('title', Resources.CommonLabels.PropertyTabHasErrorTooltip);
                            }
                        }

                        //Header tab looks for the Control with Type="Label"
                        if (checkExists(_viewDesigner.View.selectedObject))
                        {
                            control = _viewDesigner.View.selectedObject.find("div.controlwrapper");

                            if (checkExists(control))
                            {
                                controlID = control.attr('id');

                                if (designerCommon.checkControlConditionalStylesHasDependencyIssue(controlID).hasError)
                                {
                                    _viewDesigner.View.element.find('#vdControlTabPropertiesTab').find('.tab-icon').addClass('error');
                                    _viewDesigner.View.element.find('#vdControlTabPropertiesTab').attr('title', Resources.CommonLabels.PropertyTabHasErrorTooltip);
                                }
                            }
                        }

                        break;
                }
            },

            _redrawControl: function (id, grid, updatedProperties, prevParentControl, prevAssociatedSO, notifierContext)
            {
                var control = _viewDesigner.View.element.find('#' + id);
                if (control.length > 0)
                {
                    var controltype = control.attr('controltype');
                    var capturelistEditorTable = control.closest(".capturelist-editor-table");
                    var editorRowFooter = control.closest(".list-view-item.editor-row.footer");
                    var controlIsInToolbar = control.closest(".editor-table.toolbar").length > 0 ? true : false;

                    if (!checkExists(controltype))
                    {
                        var controlNode = parseXML(grid.valuexml).selectSingleNode("Controls/Control");
                        if (controlNode)
                        {
                            controltype = controlNode.getAttribute("Type");
                        }
                        else
                        {
                            return;
                        }
                    }
                    _viewDesigner._mergeControlProperties(id, grid.valuexml);

                    var styles = _viewDesigner.Styles._getStyles(id, controltype);
                    var properties = _viewDesigner._getProperties(id);

                    if (checkExists(properties))
                    {
                        _viewDesigner._setControlPropertiesXML(id, properties, styles);
                        if (updatedProperties)
                        {
                            _viewDesigner.AJAXCall._updateControlProperties(id, controltype, updatedProperties, properties, styles);
                        }
                        else
                        {
                            _viewDesigner.AJAXCall._initControlProperties(id, controltype, properties, styles); //do not have the updated properties so rerende;
                        }

                        var defaulteventdata = _viewDesigner._getControlEventProperties(controltype);
                        var isComposite = _viewDesigner._getControlProperty(id, 'IsComposite');

                        var refSO = _viewDesigner._getControlPropertyValueAndDisplayValue(id, 'AssociationSO');

                        if (checkExists(refSO) === true && (_viewDesigner.View.SelectedViewType === "Capture" || (_viewDesigner.View.selectedOptions.EnableListEditing && (capturelistEditorTable.length > 0 || editorRowFooter.length > 0)) || (_viewDesigner.View.SelectedViewType === "CaptureList" && controlIsInToolbar)))
                        {
                            var refMethod = _viewDesigner._getControlPropertyValueAndDisplayValue(id, 'AssociationMethod');

                            if (isComposite.length > 0 && isComposite.toLowerCase() === "true")
                            {
                                refSO = _viewDesigner._getControlPropertyValueAndDisplayValue(id, 'DisplaySO')
                                    ? _viewDesigner._getControlPropertyValueAndDisplayValue(id, 'DisplaySO')
                                    : _viewDesigner._getControlPropertyValueAndDisplayValue(id, 'AssociationSO');

                                refMethod = _viewDesigner._getControlPropertyValueAndDisplayValue(id, 'DisplayMethod')
                                    ? _viewDesigner._getControlPropertyValueAndDisplayValue(id, 'DisplayMethod')
                                    : _viewDesigner._getControlPropertyValueAndDisplayValue(id, 'AssociationMethod');
                            }
                            var parentControl = _viewDesigner._getControlProperty(id, 'ParentControl');
                            var parentJoinProperty = _viewDesigner._getControlProperty(id, 'ParentJoinProperty');
                            var childJoinProperty = _viewDesigner._getControlProperty(id, 'ChildJoinProperty');

                            //only add init rules for our listing controls

                            if (defaulteventdata.controlclass === '1' &&
                                _viewDesigner._isLegacyListingControl(defaulteventdata.name) &&
                                _viewDesigner._checkPropertiesContainDataSource(updatedProperties))
                            {
                                var parentControlFieldID = _viewDesigner._getControlFieldID(parentControl);
                                var parentControlJoinPropertyFieldID = _viewDesigner._getParentControlJoinPropertyFieldID(parentControl, parentJoinProperty);

                                var parentControlSupportedFieldTypes = _viewDesigner._getControlSupportedDataTypes(null, parentControl).values;
                                var parentControlFieldType = parentControlSupportedFieldTypes.length > 0 ? parentControlSupportedFieldTypes[0].toLowerCase() : "";

                                var thisSupportedFieldTypes = _viewDesigner._getControlSupportedDataTypes(null, id).values;
                                var thisFieldType = thisSupportedFieldTypes.length > 0 ? thisSupportedFieldTypes[0].toLowerCase() : "";

                                var preloadedData = false;
                                var hasFilter = false;
                                var _control = jQuery("#" + id + "");

                                if (checkExists(_control) && _control.data("Preload"))
                                {
                                    preloadedData = true;

                                    _viewDesigner._BuildViewXML();

                                    parentControlFieldID = _viewDesigner._getControlFieldID(parentControl);
                                    parentControlJoinPropertyFieldID = _viewDesigner._getParentControlJoinPropertyFieldID(parentControl, parentJoinProperty);

                                    parentControlSupportedFieldTypes = _viewDesigner._getControlSupportedDataTypes(null, parentControl).values;
                                    parentControlFieldType = parentControlSupportedFieldTypes.length > 0 ? parentControlSupportedFieldTypes[0].toLowerCase() : "";

                                    thisSupportedFieldTypes = _viewDesigner._getControlSupportedDataTypes(null, id).values;
                                    thisFieldType = thisSupportedFieldTypes.length > 0 ? thisSupportedFieldTypes[0].toLowerCase() : "";
                                }

                                if (checkExists(_control) && _control.data("ParentFilter"))
                                {
                                    hasFilter = true;
                                }

                                var data =
                                {
                                    refSOGuid: refSO.value,
                                    refSOSystemName: _viewDesigner._getAssociatedSmartObjectSystemName(refSO.value),
                                    refSODisplayValue: refSO.displayValue,
                                    refMethod: refMethod.value,
                                    refMethodDisplayValue: refMethod.displayValue,
                                    controlid: id,
                                    controltype: controltype,
                                    controlname: _viewDesigner._getControlProperty(id, 'ControlName'),
                                    parentcontrol: parentControl,
                                    childjoinproperty: childJoinProperty,
                                    prevparentcontrol: prevParentControl,
                                    preloadData: preloadedData,
                                    parentFilter: hasFilter,
                                    parentcontrolfieldid: parentControlFieldID,
                                    parentjoinproperty: parentJoinProperty,
                                    parentcontrolfieldtype: parentControlFieldType,
                                    thisfieldtype: thisFieldType,
                                    parentcontroljoinpropertyfieldid: parentControlJoinPropertyFieldID

                                };

                                _viewDesigner._BuildDefaultLoadBehaviour(data);
                            }
                            else if (defaulteventdata.controlclass === '1' &&
                                defaulteventdata.name.toLowerCase() === "lookup" &&
                                _viewDesigner._checkPropertiesContainDataSource(updatedProperties))
                            {
                                var data = {
                                    refSOGuid: refSO.value,
                                    refSOSystemName: _viewDesigner._getAssociatedSmartObjectSystemName(refSO.value),
                                    refSODisplayValue: refSO.displayValue,
                                    refMethod: refMethod.value,
                                    refMethodDisplayValue: refMethod.displayValue,
                                    controlid: id,
                                    controltype: controltype,
                                    controlname: _viewDesigner._getControlProperty(id, 'ControlName'),
                                    parentcontrol: parentControl,
                                    childjoinproperty: childJoinProperty,
                                    valueProperty: _viewDesigner._getControlProperty(id, 'ValueProperty')
                                };

                                _viewDesigner._buildLookupControlLoadBehaviour(data);
                            }
                        }
                        else if ((checkExistsNotEmpty(prevAssociatedSO)) && (defaulteventdata.controlclass === "1"))
                        {
                            if (!checkExists(notifierContext))
                            {
                                _viewDesigner._cleanupControlAssociatedSOActions(id, prevAssociatedSO);
                            }
                        }
                    }

                    SourceCode.Forms.Designers.Common.View.refreshBadgeForControls([id]);

                    if (_viewDesigner.View.SelectedViewType === "CaptureList")
                    {
                        var jqTable = SourceCode.Forms.Designers.Common.getEditorTableFromSelectedObject();

                        if (!SourceCode.Forms.Designers.Common.isTableControl(jqTable)) 
                        {
                            //Only setup column overlay if the selected object is part of a List Table
                            _viewDesigner.DesignerTable._setupColumnOverlay($("td.editor-cell.selectedobject"));
                        }
                    }

                    if (controltype === "Table")
                    {
                        //table width may have been set thus there may be columns that are smaller than 40px thus we need to normalize the table.
                        _viewDesigner.DesignerTable.normalizeTable($("#" + id).find(".editor-table:first-child"));
                    }

                    setTimeout(function ()
                    {
                        _viewDesigner._showControlProperties();

                        SourceCode.Forms.Designers.Common.triggerEventFromControlElement("ControlSizeChanged", control);
                    }, 0);
                }
            },

            _getParentControlJoinPropertyFieldID: function (parentControl, parentJoinProperty)
            {
                var _source = _viewDesigner.View.viewDefinitionXML.selectSingleNode("SourceCode.Forms/Views/View/Sources/Source[@ContextID='" + parentControl + "']");
                var _fieldID;

                if (_source !== null)
                {
                    var _field = _source.selectSingleNode("Fields/Field[FieldName/text()= '" + parentJoinProperty + "']");

                    if (_field !== null)
                    {
                        _fieldID = _field.getAttribute("ID");
                        return _fieldID;
                    }
                }
            },

            // This function builds the default event for the lookup control onchange, to populate the lookup control with data.
            // Its called from when the datasource is configured and the control is changed to n lookup
            _buildLookupControlLoadBehaviour: function (data)
            {
                var viewName = _viewDesigner._GetViewName();
                var xmlDoc = _viewDesigner.View.viewDefinitionXML;
                var viewElem = xmlDoc.selectSingleNode('//View');
                var eventsElem = viewElem.selectSingleNode('Events');
                var viewID = _viewDesigner._GetViewID();
                var viewDisplayName = _viewDesigner._GetViewDisplayName();
                var ruleName = Resources.ViewDesigner.MethodBehaviourName.format(data.controlname, Resources.ViewDesigner.ControlEvent_OnChange);
                var doLookUp = true;

                if ($chk(eventsElem) === false)
                {
                    eventsElem = xmlDoc.createElement('Events');
                    viewElem.appendChild(eventsElem);
                    doLookUp = false;
                }

                var onChangeEventNode = doLookUp ? eventsElem.selectSingleNode("Event[(@SourceType='Control') and (@SourceID='" + data.controlid + "') and (@Type='User') and (Name/text()='OnChange') and not(@SubFormID)]") : null;
                if (!checkExists(onChangeEventNode))
                {
                    onChangeEventNode = xmlDoc.createElement("Event");
                    onChangeEventNode.setAttribute('Type', 'User');
                    onChangeEventNode.setAttribute('SourceType', 'Control');
                    onChangeEventNode.setAttribute('SourceID', data.controlid);
                    onChangeEventNode.setAttribute('SourceName', data.controlname);
                    onChangeEventNode.setAttribute('SourceDisplayName', data.controlname);
                    onChangeEventNode.setAttribute('ID', String.generateGuid());
                    onChangeEventNode.setAttribute("DefinitionID", String.generateGuid());

                    eventsElem.appendChild(onChangeEventNode);
                    doLookUp = false;
                }

                //Build Properties //
                var onChangeEventNameNode = doLookUp ? onChangeEventNode.selectSingleNode("Name") : null;
                if (!checkExists(onChangeEventNameNode))
                {
                    onChangeEventNameNode = xmlDoc.createElement("Name");
                    onChangeEventNameNode.appendChild(xmlDoc.createTextNode("OnChange"));
                    onChangeEventNode.appendChild(onChangeEventNameNode);
                    doLookUp = false;
                }

                var onChangeEventPropertiesNode = doLookUp ? onChangeEventNode.selectSingleNode("Properties") : null;
                if (!checkExists(onChangeEventPropertiesNode))
                {
                    onChangeEventPropertiesNode = xmlDoc.createElement("Properties");
                    onChangeEventNode.appendChild(onChangeEventPropertiesNode);
                    doLookUp = false;
                }

                //	Certain properties need to be removed completely there for the dolookup does not need to be used
                var eventLocationProperty = onChangeEventPropertiesNode.selectSingleNode("Property[Name='Location']");
                if (checkExists(eventLocationProperty))
                {
                    onChangeEventPropertiesNode.removeChild(eventLocationProperty);
                }
                onChangeEventPropertiesNode.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "Location", viewName, viewDisplayName));

                var eventViewIDProperty = onChangeEventPropertiesNode.selectSingleNode("Property[Name='ViewID']");
                if (checkExists(eventViewIDProperty))
                {
                    onChangeEventPropertiesNode.removeChild(eventViewIDProperty);
                }
                onChangeEventPropertiesNode.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "ViewID", viewID, viewDisplayName, viewName));

                var eventRuleNameProperty = onChangeEventPropertiesNode.selectSingleNode("Property[Name='RuleFriendlyName']");
                if (checkExists(eventRuleNameProperty))
                {
                    onChangeEventPropertiesNode.removeChild(eventRuleNameProperty);
                }
                onChangeEventPropertiesNode.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "RuleFriendlyName", ruleName));

                var eventHandlersNode = doLookUp ? onChangeEventNode.selectSingleNode("Handlers") : null;
                if (!checkExists(eventHandlersNode))
                {
                    eventHandlersNode = xmlDoc.createElement("Handlers");
                    onChangeEventNode.appendChild(eventHandlersNode);
                    doLookUp = false;
                }

                var eventHandlerNode = doLookUp ? eventHandlersNode.selectSingleNode("Handler[(last())][not(Conditions/Condition)][not(Actions/Action[@Type='Validate'])]") : null;
                if (!checkExists(eventHandlerNode))
                {
                    eventHandlerNode = xmlDoc.createElement("Handler");
                    eventHandlersNode.appendChild(eventHandlerNode);
                    doLookUp = false;
                }

                var actionsNode = doLookUp ? eventHandlerNode.selectSingleNode("Actions") : null;
                if (!checkExists(actionsNode))
                {
                    actionsNode = xmlDoc.createElement("Actions");
                    eventHandlerNode.appendChild(actionsNode);
                    doLookUp = false;
                }

                var actionNode = doLookUp ? onChangeEventNode.selectSingleNode("Handlers/Handler/Actions/Action[(@Type='Execute')and (Parameters/Parameter[(@SourceID='" + data.controlid + "') and (@SourceType='Control') and (@TargetType='ObjectProperty')])]") : null;
                if (!checkExists(actionNode))
                {
                    actionNode = xmlDoc.createElement("Action");
                    actionsNode.appendChild(actionNode);
                    doLookUp = false;
                }

                actionNode.setAttribute('ID', String.generateGuid());
                actionNode.setAttribute('Type', 'Execute');
                actionNode.setAttribute('ExecutionType', 'Asynchronous');
                actionNode.setAttribute('ItemState', 'All');

                //Build action properties
                var actionPropertiesNode = doLookUp ? actionNode.selectSingleNode("Properties") : null;
                if (checkExists(actionPropertiesNode))
                {
                    actionNode.removeChild(actionPropertiesNode);
                    doLookUp = false;
                }

                actionPropertiesNode = xmlDoc.createElement("Properties");
                actionNode.appendChild(actionPropertiesNode);

                actionPropertiesNode.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "ViewID", _viewDesigner._GetViewID(), viewDisplayName, viewName));
                actionPropertiesNode.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "Method", data.refMethod, data.refMethodDisplayValue, data.refMethod));
                actionPropertiesNode.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "ObjectID", data.refSOGuid, data.refSODisplayValue, data.refSOSystemName));
                actionPropertiesNode.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "ControlID", data.controlid, data.controlname, data.controlname));
                //Build action properties

                // Build Action Parameters
                var ParametersElem = doLookUp ? actionNode.selectSingleNode("Parameters") : null;
                if (checkExists(ParametersElem))
                {
                    actionNode.removeChild(ParametersElem);
                }

                ParametersElem = xmlDoc.createElement('Parameters');
                actionNode.appendChild(ParametersElem);

                var ParameterElem = xmlDoc.createElement('Parameter');
                ParameterElem.setAttribute('SourceID', data.controlid);
                ParameterElem.setAttribute('SourceType', 'Control');
                ParameterElem.setAttribute('SourceName', data.controlname);
                ParameterElem.setAttribute('SourceDisplayName', data.controlname);
                ParameterElem.setAttribute('TargetID', data.valueProperty);
                ParameterElem.setAttribute('TargetType', 'ObjectProperty');
                ParametersElem.appendChild(ParameterElem);
                // Build Action Parameters //

                //Build Action Result
                var ResultsElem = doLookUp ? actionNode.selectSingleNode("Results") : null;
                if (checkExists(ResultsElem))
                {
                    action.removeChild(ResultsElem);
                }

                ResultsElem = xmlDoc.createElement('Results');
                actionNode.appendChild(ResultsElem);

                var ResultElem = xmlDoc.createElement('Result');
                ResultElem.setAttribute('SourceID', data.refSOGuid);
                ResultElem.setAttribute('SourceType', 'Result');
                ResultElem.setAttribute('SourceName', data.refSOSystemName);
                ResultElem.setAttribute('SourceDisplayName', data.refSODisplayValue);
                ResultElem.setAttribute('TargetID', data.controlid);
                ResultElem.setAttribute('TargetType', 'Control');

                ResultsElem.appendChild(ResultElem);
                //Build Action Result //
            },

            _getAssociatedSmartObjectSystemName: function (soGuid)
            {
                SourceCode.Forms.Designers.getDataSourceDetails(soGuid);

                var smoSystemName = '';
                var hiddenAssociatedSOsXML = _viewDesigner.View.hiddenAssociationXml;
                var smoXml = hiddenAssociatedSOsXML.selectSingleNode("associations/smartobjectroot[@guid='" + soGuid + "']");

                if (checkExists(smoXml))
                {
                    smoSystemName = smoXml.getAttribute("name");

                    if (checkExists(smoSystemName))
                    {
                        return smoSystemName;
                    }
                }

            },

            _BuildDefaultLoadBehaviour: function (data)
            {
                var viewName = _viewDesigner._GetViewName();
                var xmlDoc = _viewDesigner.View.viewDefinitionXML;
                var viewElem = xmlDoc.selectSingleNode('//View');
                var eventsElem = viewElem.selectSingleNode('Events');
                var viewID = _viewDesigner._GetViewID();
                var doLookUp = true;
                var listenersElem;
                var nameElem;
                var viewEvent;
                var ruleName = Resources.ViewDesigner.RuleNameViewEventNameCurrent.format(Resources.ViewDesigner.ViewEvent_Init);
                var viewName = _viewDesigner._GetViewName();
                var viewDisplayName = _viewDesigner._GetViewDisplayName();

                if ($chk(eventsElem) === false)
                {
                    eventsElem = xmlDoc.createElement('Events');
                    viewElem.appendChild(eventsElem);
                    doLookUp = false;
                }

                var initEventNode = doLookUp ? eventsElem.selectSingleNode("Event[(@SourceType='View') and (@SourceID='" + viewID + "') and (@Type='User') and (Name/text()='Init')]") : null;
                if (!checkExists(initEventNode))
                {
                    initEventNode = xmlDoc.createElement("Event");
                    initEventNode.setAttribute('Type', 'User');
                    initEventNode.setAttribute('SourceType', 'View');
                    initEventNode.setAttribute('SourceID', viewID);
                    initEventNode.setAttribute('SourceName', viewName);
                    initEventNode.setAttribute('SourceDisplayName', viewDisplayName);
                    initEventNode.setAttribute('ID', String.generateGuid());
                    initEventNode.setAttribute("DefinitionID", String.generateGuid());

                    eventsElem.appendChild(initEventNode);
                    doLookUp = false;
                }

                //Build Properties //
                var initEventNameNode = doLookUp ? initEventNode.selectSingleNode("Name") : null;
                if (!checkExists(initEventNameNode))
                {
                    initEventNameNode = xmlDoc.createElement("Name");
                    initEventNameNode.appendChild(xmlDoc.createTextNode("Init"));
                    initEventNode.appendChild(initEventNameNode);
                }

                var initEventPropertiesNode = doLookUp ? initEventNode.selectSingleNode("Properties") : null;
                if (!checkExists(initEventPropertiesNode))
                {
                    initEventPropertiesNode = xmlDoc.createElement("Properties");
                    initEventNode.appendChild(initEventPropertiesNode);
                    doLookUp = false;
                }

                var eventLocationProperty = initEventPropertiesNode.selectSingleNode("Property[Name='Location']");
                if (checkExists(eventLocationProperty))
                {
                    initEventPropertiesNode.removeChild(eventLocationProperty);
                }
                initEventPropertiesNode.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "Location", _viewDesigner._GetViewName(), viewDisplayName));

                var eventViewIDProperty = initEventPropertiesNode.selectSingleNode("Property[Name='ViewID']");
                if (checkExists(eventViewIDProperty))
                {
                    initEventPropertiesNode.removeChild(eventViewIDProperty);
                }
                initEventPropertiesNode.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "ViewID", viewID, viewDisplayName, viewName));

                var eventRuleNameProperty = initEventPropertiesNode.selectSingleNode("Property[Name='RuleFriendlyName']");
                if (checkExists(eventRuleNameProperty))
                {
                    initEventPropertiesNode.removeChild(eventRuleNameProperty);
                }
                initEventPropertiesNode.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "RuleFriendlyName", ruleName));
                //Build Properties //

                var eventHandlersNode = doLookUp ? initEventNode.selectSingleNode("Handlers") : null;
                if (!checkExists(eventHandlersNode))
                {
                    eventHandlersNode = xmlDoc.createElement("Handlers");
                    initEventNode.appendChild(eventHandlersNode);
                    doLookUp = false;
                }
                var handlerXpath = null;
                var eventHandlerNode = null;
                if (doLookUp)
                {
                    handlerXpath = "Handler[Actions/Action[@Type='Execute' or @Type='PopulateControl'][Properties/Property[Name='ControlID' and Value={0}]]]".format(data.controlid.xpathValueEncode());
                    var handlers = eventHandlersNode.selectNodes(handlerXpath);
                    if (handlers.length === 1)
                    {
                        // only one match
                        eventHandlerNode = handlers[0];
                    }
                    else if (handlers.length > 1)
                    {
                        //more than one match find if there are any without conditions
                        handlerXpath = "Handler[not(Conditions/Condition)][Actions/Action[@Type='Execute' or @Type='PopulateControl'][Properties/Property[Name='ControlID' and Value={0}]]]".format(data.controlid.xpathValueEncode());
                        var handlersWithNoCondition = eventHandlersNode.selectNodes(handlerXpath);
                        if (handlersWithNoCondition.length > 0)
                        {
                            //use the last one
                            eventHandlerNode = handlersWithNoCondition[handlersWithNoCondition.length - 1];
                        }
                        else
                        {
                            // use the last conditonal one
                            eventHandlerNode = handlers[handlers.length - 1];
                        }
                    }
                    else
                    {
                        //no matches search for a handler with no conditions or validate actions
                        handlers = eventHandlersNode.selectNodes("Handler[not(Conditions/Condition)][not(Actions/Action[@Type='Validate'])]");
                        if (handlers.length > 0)
                        {
                            // use last one
                            eventHandlerNode = handlers[handlers.length - 1];
                        }
                    }
                }

                if (!checkExists(eventHandlerNode))
                {
                    eventHandlerNode = xmlDoc.createElement("Handler");
                    eventHandlersNode.appendChild(eventHandlerNode);
                    doLookUp = false;
                }

                var actionsNode = doLookUp ? eventHandlerNode.selectSingleNode("Actions") : null;
                if (!checkExists(actionsNode))
                {
                    actionsNode = xmlDoc.createElement("Actions");
                    eventHandlerNode.appendChild(actionsNode);
                    doLookUp = false;
                }

                var actionNode = doLookUp ? initEventNode.selectSingleNode("Handlers/Handler/Actions/Action[(Properties/Property[(Name/text()='ControlID') and (Value/text()='" + data.controlid + "')] and (Properties/Property[Name/text()='ObjectID'])) and (@Type='Execute')]") : null;
                if (!checkExists(actionNode))
                {
                    actionNode = xmlDoc.createElement("Action");
                    actionNode.setAttribute('Type', 'Execute');
                    actionNode.setAttribute('ItemState', 'All');
                    actionNode.setAttribute('ExecutionType', 'Synchronous');
                    actionsNode.appendChild(actionNode);
                    doLookUp = false;
                }

                // Build Properties //
                var actionPropertiesNode = doLookUp ? actionNode.selectSingleNode("Properties") : null;
                if (!checkExists(actionPropertiesNode))
                {
                    actionPropertiesNode = xmlDoc.createElement("Properties");
                    actionNode.appendChild(actionPropertiesNode);
                    doLookUp = false;
                }

                var methodProperty = doLookUp ? actionPropertiesNode.selectSingleNode("Property[Name/text()='Method']") : null;
                if (checkExists(methodProperty))
                {
                    actionPropertiesNode.removeChild(methodProperty);
                }
                actionPropertiesNode.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "Method", data.refMethod, data.refMethodDisplayValue, data.refMethod));

                var viewIDProperty = doLookUp ? actionPropertiesNode.selectSingleNode("Property[Name/text()='ViewID']") : null;
                if (checkExists(viewIDProperty))
                {
                    actionPropertiesNode.removeChild(viewIDProperty);
                }
                actionPropertiesNode.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "ViewID", _viewDesigner._GetViewID(), viewDisplayName, viewName));

                var controlIDProperty = doLookUp ? actionPropertiesNode.selectSingleNode("Property[Name/text()='ControlID']") : null;
                if (checkExists(controlIDProperty))
                {
                    actionPropertiesNode.removeChild(controlIDProperty);
                }
                actionPropertiesNode.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "ControlID", data.controlid, data.controlname, data.controlname));

                var objectIDProperty = doLookUp ? actionPropertiesNode.selectSingleNode("Property[Name/text()='ObjectID']") : null;
                if (checkExists(objectIDProperty))
                {
                    actionPropertiesNode.removeChild(objectIDProperty);
                }
                actionPropertiesNode.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "ObjectID", data.refSOGuid, data.refSODisplayValue, data.refSOSystemName));

                var locationProperty = doLookUp ? actionPropertiesNode.selectSingleNode("Property[Name/text()='Location']") : null;
                if (checkExists(locationProperty))
                {
                    actionPropertiesNode.removeChild(locationProperty);
                }
                actionPropertiesNode.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "Location", "View", viewDisplayName));
                // Build Properties //

                //Build results

                if (!data.preloadData)
                {
                    var resultsNode = doLookUp ? actionNode.selectSingleNode("Results") : null;
                    if (!checkExists(resultsNode))
                    {
                        resultsNode = xmlDoc.createElement("Results");
                        actionNode.appendChild(resultsNode);
                    }

                    var resultNode = doLookUp ? resultsNode.selectSingleNode("Result") : null;
                    if (!checkExists(resultNode))
                    {
                        resultNode = xmlDoc.createElement("Result");
                        resultsNode.appendChild(resultNode);
                    }
                    resultNode.setAttribute('SourceType', 'Result');
                    resultNode.setAttribute('SourceID', data.refSOGuid);
                    resultNode.setAttribute('SourceName', data.refSOSystemName);
                    resultNode.setAttribute('SourceDisplayName', data.refSODisplayValue);
                    resultNode.setAttribute('TargetType', 'Control');
                    resultNode.setAttribute('TargetID', data.controlid);
                }
                else
                {
                    if ($chk(actionNode.selectSingleNode("Results")))
                    {
                        actionNode.removeChild(actionNode.selectSingleNode("Results"));
                    }
                }

                if (data.preloadData && !data.parentFilter)
                {
                    if ($chk(actionNode.selectSingleNode("Results")))
                    {
                        actionNode.removeChild(actionNode.selectSingleNode("Results"));
                    }

                    var preloadAction = actionsNode.selectSingleNode("Action[@Type='PopulateControl'][Properties/Property[Name='ControlID' and Value={0}]]".format(data.controlid.xpathValueEncode()));

                    if (!$chk(preloadAction))
                    {
                        preloadAction = xmlDoc.createElement("Action");
                        preloadAction.setAttribute('Type', 'PopulateControl');
                        preloadAction.setAttribute('ItemState', 'All');
                        preloadAction.setAttribute('ExecutionType', 'Synchronous');
                        actionsNode.appendChild(preloadAction);
                        doLookUp = false;
                    }

                    var actionPropertiesNode = doLookUp ? preloadAction.selectSingleNode("Properties") : null;
                    if (!checkExists(actionPropertiesNode))
                    {
                        actionPropertiesNode = xmlDoc.createElement("Properties");
                        preloadAction.appendChild(actionPropertiesNode);
                        doLookUp = false;
                    }

                    var methodProperty = doLookUp ? actionPropertiesNode.selectSingleNode("Property[Name/text()='Method']") : null;
                    if (checkExists(methodProperty))
                    {
                        actionPropertiesNode.removeChild(methodProperty);
                    }
                    actionPropertiesNode.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "Method", data.refMethod, data.refMethodDisplayValue, data.refMethod));

                    var viewIDProperty = doLookUp ? actionPropertiesNode.selectSingleNode("Property[Name/text()='ViewID']") : null;
                    if (checkExists(viewIDProperty))
                    {
                        actionPropertiesNode.removeChild(viewIDProperty);
                    }
                    actionPropertiesNode.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "ViewID", _viewDesigner._GetViewID(), viewDisplayName, viewName));

                    var controlIDProperty = doLookUp ? actionPropertiesNode.selectSingleNode("Property[Name/text()='ControlID']") : null;
                    if (checkExists(controlIDProperty))
                    {
                        actionPropertiesNode.removeChild(controlIDProperty);
                    }
                    actionPropertiesNode.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "ControlID", data.controlid, data.controlname, data.controlSysName));

                    var objectIDProperty = doLookUp ? actionPropertiesNode.selectSingleNode("Property[Name/text()='ObjectID']") : null;
                    if (checkExists(objectIDProperty))
                    {
                        actionPropertiesNode.removeChild(objectIDProperty);
                    }
                    actionPropertiesNode.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "ObjectID", data.refSOGuid, data.refSODisplayValue, data.refSOSystemName));

                    var locationProperty = doLookUp ? actionPropertiesNode.selectSingleNode("Property[Name/text()='Location']") : null;
                    if (checkExists(locationProperty))
                    {
                        actionPropertiesNode.removeChild(locationProperty);
                    }
                    actionPropertiesNode.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "Location", "View", viewDisplayName));

                }
                else
                {
                    var populateAction = actionsNode.selectSingleNode("Action[@Type='PopulateControl'][Properties/Property[Name='ControlID' and Value='" + data.controlid + "' ]]");

                    if (($chk(populateAction)))
                    {
                        actionsNode.removeChild(populateAction);
                    }
                }

                //  remove if parent removed OR changed.
                if (data.prevparentcontrol && data.parentcontrol !== data.prevparentcontrol)
                {
                    var dependentAction;

                    if (data.preloadData)
                    {
                        dependentAction = eventsElem.selectSingleNode("Event[(Name='OnChange') and (@SourceType='Control') and (@Type='User')]/Handlers/Handler/Actions/Action[(Properties/Property[(Name/text()='ControlID') and (Value/text()='" + data.controlid + "')] and (Properties/Property[Name/text()='ObjectID'])) and (Properties/Property[Name='Filter']) and (@Type='PopulateControl')]");
                    }
                    else
                    {
                        dependentAction = eventsElem.selectSingleNode("Event[(Name='OnChange') and (@SourceType='Control')]/Handlers/Handler/Actions/Action[(Properties/Property[(Name/text()='ControlID') and (Value/text()='" + data.controlid + "')] and (Properties/Property[Name/text()='ObjectID'])) and (@Type='Execute') and (Parameters/Parameter[(@TargetType='ObjectProperty') and (@SourceType='Control')]) and (Results/Result[(@SourceType='Result') and (@TargetType='Control') and (@TargetID='" + data.controlid + "')])]");
                    }

                    if (checkExists(dependentAction))
                    {
                        var dependentActionActionsNode = dependentAction.parentNode;
                        var dependentActionHandlerNode = dependentActionActionsNode.parentNode;
                        var dependentActionHandlersNode = dependentActionHandlerNode.parentNode;
                        var dependentActionEventNode = dependentActionHandlersNode.parentNode;

                        dependentActionActionsNode.removeChild(dependentAction);

                        if (dependentActionActionsNode.childNodes.length === 0)
                        {
                            dependentActionHandlersNode.removeChild(dependentActionHandlerNode);
                        }

                        if (dependentActionHandlersNode.childNodes.length === 0)
                        {
                            eventsElem.removeChild(dependentActionEventNode);
                        }
                    }
                }

                if (data.parentcontrol)
                {
                    if (!data.preloadData)
                    {
                        var actionID = actionNode.getAttribute("ID");

                        if (checkExists(actionID))
                        {
                            var newActionsNode = eventHandlersNode.selectSingleNode("Handler/Actions[Action[@ID='{0}']]".format(actionID));

                            if (checkExists(newActionsNode))
                            {
                                newActionsNode.removeChild(actionNode);
                            }
                        }
                        else
                        {
                            actionsNode.removeChild(actionNode);
                        }
                    }

                    _viewDesigner._buildDependantControlEvent(data, xmlDoc, viewElem);
                }

                //load event lists
                _viewDesigner.View.isViewEventsLoading = true;
                setTimeout(function () { _viewDesigner._LoadViewEvents(); }.bind(_viewDesigner), 0);
            },

            _buildDependantControlEvent: function (data, xmlDoc, viewNode)
            {
                var viewName = _viewDesigner._GetViewName();
                var doLookUp = true;
                var viewID = _viewDesigner._GetViewID();
                var ruleName = Resources.ViewDesigner.MethodBehaviourName.format(_viewDesigner._getControlProperty(data.parentcontrol, 'ControlName'), Resources.ViewDesigner.ControlEvent_OnChange);
                var parentControlName = _viewDesigner._getControlProperty(data.parentcontrol, "ControlName");
                var viewDisplayName = _viewDesigner._GetViewDisplayName();

                var eventsNode = doLookUp ? xmlDoc.selectSingleNode("//Events") : null;
                if (!checkExists(eventsNode))
                {
                    eventsNode = xmlDoc.createElement("Events");
                    viewNode.appendChild(eventsNode);
                    doLookUp = false;
                }

                var controlOnChangeEventNode = doLookUp ? eventsNode.selectSingleNode("Event[(@Type='User') and (@SourceID='" + data.parentcontrol + "') and (@SourceType='Control') and (Name='OnChange')]") : null;
                if (!checkExists(controlOnChangeEventNode))
                {
                    controlOnChangeEventNode = xmlDoc.createElement("Event");
                    controlOnChangeEventNode.setAttribute('ID', String.generateGuid());
                    controlOnChangeEventNode.setAttribute("DefinitionID", String.generateGuid());
                    eventsNode.appendChild(controlOnChangeEventNode);
                    doLookUp = false;
                }

                controlOnChangeEventNode.setAttribute('SourceID', data.parentcontrol);
                controlOnChangeEventNode.setAttribute('SourceType', 'Control');
                controlOnChangeEventNode.setAttribute('SourceName', parentControlName);
                controlOnChangeEventNode.setAttribute('SourceDisplayName', parentControlName);
                controlOnChangeEventNode.setAttribute('Type', 'User');

                var controlOnChangeEventNameNode = doLookUp ? controlOnChangeEventNode.selectSingleNode("Name") : null;
                if (!checkExists(controlOnChangeEventNameNode))
                {
                    controlOnChangeEventNameNode = xmlDoc.createElement("Name");
                    controlOnChangeEventNameNode.appendChild(xmlDoc.createTextNode("OnChange"));
                    controlOnChangeEventNode.appendChild(controlOnChangeEventNameNode);

                    doLookUp = false;
                }

                // Event Properties //
                var eventPropertiesNode = doLookUp ? controlOnChangeEventNode.selectSingleNode("Properties") : null;
                if (!checkExists(eventPropertiesNode))
                {
                    eventPropertiesNode = xmlDoc.createElement("Properties");
                    controlOnChangeEventNode.appendChild(eventPropertiesNode);
                    doLookUp = false;
                }

                var eventViewIDProperty = controlOnChangeEventNode.selectSingleNode("Property[Name='ViewID']");
                if (checkExists(eventViewIDProperty))
                {
                    controlOnChangeEventNode.removeChild(eventViewIDProperty);
                }
                eventPropertiesNode.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "ViewID", viewID, viewDisplayName, viewName));

                var eventRuleNameProperty = controlOnChangeEventNode.selectSingleNode("Property[Name='RuleFriendlyName']");
                if (checkExists(eventRuleNameProperty))
                {
                    controlOnChangeEventNode.removeChild(eventRuleNameProperty);
                }
                eventPropertiesNode.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "RuleFriendlyName", ruleName));

                var eventLocationProperty = controlOnChangeEventNode.selectSingleNode("Property[Name='Location']");
                if (checkExists(eventLocationProperty))
                {
                    controlOnChangeEventNode.removeChild(eventLocationProperty);
                }
                eventPropertiesNode.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "Location", viewName, viewDisplayName));
                // Event Properties //

                var handlersNode = doLookUp ? controlOnChangeEventNode.selectSingleNode("Handlers") : null;
                if (!checkExists(handlersNode))
                {
                    handlersNode = xmlDoc.createElement("Handlers");
                    controlOnChangeEventNode.appendChild(handlersNode);
                    doLookUp = false;
                }

                var handlerNode = doLookUp ? handlersNode.selectSingleNode("Handler") : null;
                if (!checkExists(handlerNode))
                {
                    handlerNode = xmlDoc.createElement("Handler");
                    handlersNode.appendChild(handlerNode);
                    doLookUp = false;
                }

                var actionsNode = doLookUp ? handlerNode.selectSingleNode("Actions") : null;
                if (!checkExists(actionsNode))
                {
                    actionsNode = xmlDoc.createElement("Actions");
                    handlerNode.appendChild(actionsNode);
                    doLookUp = false;
                }

                var actionNode = doLookUp ? controlOnChangeEventNode.selectSingleNode("Handlers/Handler/Actions/Action[(Properties/Property[(Name/text()='ControlID') and (Value/text()='" + data.controlid + "')] and (Properties/Property[Name/text()='ObjectID'])) and (@Type='Execute' or @Type='PopulateControl')]") : null;
                if (!checkExists(actionNode))
                {
                    actionNode = xmlDoc.createElement("Action");
                    actionsNode.appendChild(actionNode);
                    doLookUp = false;
                }

                var actionType = 'Execute';

                if (data.preloadData && data.parentFilter)
                {
                    actionType = 'PopulateControl';

                    var filterString = '<Filter isSimple="True"><Equals><Item SourceType="ObjectProperty" SourceID="{0}" Name="{1}_{2}">{2}</Item>' +
                        '<Item SourceType="Value"><SourceValue><Item SourceType="ViewField" SourceID="{4}">{5}</Item></SourceValue>' +
                        '</Item></Equals></Filter>';

                    var filterPropertyNode = _viewDesigner._createEventingPropertyWithEncoding(actionNode.ownerDocument, "Filter", filterString.format(data.childjoinproperty, data.refSOGuid, data.childjoinproperty, data.childjoinproperty, data.parentcontroljoinpropertyfieldid, data.parentjoinproperty));
                }

                actionNode.setAttribute('Type', actionType);
                actionNode.setAttribute('ItemState', 'All');
                actionNode.setAttribute('ExecutionType', 'Synchronous');

                // Build Properties //
                var actionPropertiesNode = doLookUp ? actionNode.selectSingleNode("Properties") : null;
                if (!checkExists(actionPropertiesNode))
                {
                    actionPropertiesNode = xmlDoc.createElement("Properties");
                    actionNode.appendChild(actionPropertiesNode);
                    doLookUp = false;
                }

                var actionFilterNode = doLookUp ? actionPropertiesNode.selectSingleNode("Property[Name/text()='Filter']") : null;
                if (actionFilterNode !== null)
                {
                    actionFilterNode.parentNode.removeChild(actionFilterNode);
                }

                if (checkExists(filterPropertyNode))
                {
                    actionPropertiesNode.appendChild(filterPropertyNode);
                }

                var methodProperty = doLookUp ? actionPropertiesNode.selectSingleNode("Property[Name/text()='Method']") : null;
                if (checkExists(methodProperty))
                {
                    actionPropertiesNode.removeChild(methodProperty);
                }
                actionPropertiesNode.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "Method", data.refMethod, data.refMethodDisplayValue, data.refMethod));

                var viewIDProperty = doLookUp ? actionPropertiesNode.selectSingleNode("Property[Name/text()='ViewID']") : null;
                if (checkExists(viewIDProperty))
                {
                    actionPropertiesNode.removeChild(viewIDProperty);
                }
                actionPropertiesNode.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "ViewID", _viewDesigner._GetViewID(), viewDisplayName, viewName));

                var controlIDProperty = doLookUp ? actionPropertiesNode.selectSingleNode("Property[Name/text()='ControlID']") : null;
                if (checkExists(controlIDProperty))
                {
                    actionPropertiesNode.removeChild(controlIDProperty);
                }
                actionPropertiesNode.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "ControlID", data.controlid, data.controlname, data.controlname));

                var objectIDProperty = doLookUp ? actionPropertiesNode.selectSingleNode("Property[Name/text()='ObjectID']") : null;
                if (checkExists(objectIDProperty))
                {
                    actionPropertiesNode.removeChild(objectIDProperty);
                }
                actionPropertiesNode.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "ObjectID", data.refSOGuid, data.refSODisplayValue, data.refSOSystemName));

                var locationProperty = doLookUp ? actionPropertiesNode.selectSingleNode("Property[Name/text()='Location']") : null;
                if (checkExists(locationProperty))
                {
                    actionPropertiesNode.removeChild(locationProperty);
                }
                actionPropertiesNode.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "Location", "View", viewDisplayName));
                // Build Properties //

                // Clearing Parameters as this is the only way we can insure that the data is updated correctly
                var parametersElem = actionNode.selectSingleNode("Parameters");
                if (checkExists(parametersElem))
                {
                    parametersElem.parentNode.removeChild(parametersElem);
                }
                // Clearing Parameters as this is the only way we can insure that the data is updated correctly

                //Build Parameters//
                parametersElem = doLookUp ? actionNode.selectSingleNode("Parameters") : null;
                if (!checkExists(parametersElem))
                {
                    parametersElem = xmlDoc.createElement("Parameters");
                    actionNode.appendChild(parametersElem);
                    doLookUp = false;
                }

                var parameterNode = doLookUp ? parametersElem.selectSingleNode("Parameter[(@SourceID='" + data.parentcontrol + "') and (SourceType='Control') and (TargetType='ObjectProperty')]") : null;
                if (!checkExists(parameterNode))
                {
                    parameterNode = xmlDoc.createElement("Parameter");
                    parametersElem.appendChild(parameterNode);
                }

                parameterNode.setAttribute("SourceID", data.parentcontrol);
                parameterNode.setAttribute("SourceType", "Control");
                parameterNode.setAttribute("SourceName", parentControlName);
                parameterNode.setAttribute("SourceDisplayName", parentControlName);
                parameterNode.setAttribute("TargetID", data.childjoinproperty);
                parameterNode.setAttribute("TargetType", "ObjectProperty");
                //Build Parameters//

                if (!data.preloadData)
                {
                    var resultsNode = doLookUp ? actionNode.selectSingleNode("Results") : null;
                    if (!checkExists(resultsNode))
                    {
                        resultsNode = xmlDoc.createElement("Results");
                        actionNode.appendChild(resultsNode);
                    }

                    var resultNode = doLookUp ? resultsNode.selectSingleNode("Result") : null;
                    if (!checkExists(resultNode))
                    {
                        resultNode = xmlDoc.createElement("Result");
                        resultsNode.appendChild(resultNode);
                    }

                    resultNode.setAttribute('SourceType', 'Result');
                    resultNode.setAttribute('SourceID', data.refSOGuid);
                    resultNode.setAttribute('TargetType', 'Control');
                    resultNode.setAttribute('SourceName', data.refSOSystemName);
                    resultNode.setAttribute('SourceDisplayName', data.refSODisplayValue);
                    resultNode.setAttribute('TargetID', data.controlid);
                }
                else
                {
                    if ($chk(actionNode.selectSingleNode("Results")))
                    {
                        actionNode.removeChild(actionNode.selectSingleNode("Results"));
                    }
                }
            },

            _getControlEventProperties: function (controltype)
            {
                var ControlsDoc = SourceCode.Forms.Designers.Common.controlDefinitionsXml;
                var Controls = ControlsDoc.documentElement.selectNodes('Control');
                var data = null;

                for (var i = 0; i < Controls.length; i++)
                {
                    var Control = Controls[i];
                    var thisControlName = "";
                    var thisControlFriendlyName = "";
                    var thisControlCategory = "";
                    var thisControlDefaultEvent = "";

                    if (checkExistsNotEmpty(Control.selectSingleNode('Name')))
                    {
                        thisControlName = Control.selectSingleNode('Name').text;
                    }

                    if (checkExistsNotEmpty(Control.selectSingleNode('FriendlyName')))
                    {
                        thisControlFriendlyName = Control.selectSingleNode('FriendlyName').text;
                    }

                    if (checkExistsNotEmpty(Control.getAttribute('category')))
                    {
                        thisControlCategory = Control.getAttribute('category');
                    }

                    if (checkExistsNotEmpty(Control.selectSingleNode('DefaultEvent')))
                    {
                        thisControlDefaultEvent = Control.selectSingleNode('DefaultEvent').text;
                    }

                    if (thisControlName === controltype)
                    {
                        data = {
                            name: thisControlName,
                            friendlyname: thisControlFriendlyName,
                            controlclass: thisControlCategory,
                            defaultevent: thisControlDefaultEvent
                        };
                        break;
                    }
                }
                return data;
            },

            _mergeControlProperties: function (controlId, propertyXml)
            {
                var xmlGridDoc = parseXML(propertyXml);
                var xmlPropertiesDoc = _viewDesigner.View.controlPropertiesXML;

                if ($chk(xmlGridDoc) && $chk(xmlPropertiesDoc))
                {
                    var xPath = '/Controls/Control[@ID="' + controlId + '"]';
                    var xPath2 = 'Control[@ID="' + controlId + '"]';
                    var GridControlElem = xmlGridDoc.selectSingleNode(xPath);

                    if ($chk(GridControlElem))
                    {
                        var PropertiesRootElem = xmlPropertiesDoc;
                        var PropertyElem = xmlPropertiesDoc.selectSingleNode(xPath2);

                        if ($chk(PropertyElem))
                        {
                            var clonedNode = GridControlElem.cloneNode(true);
                            PropertiesRootElem.replaceChild(clonedNode, PropertyElem);
                        }
                        else
                        {
                            var clonedNode = GridControlElem.cloneNode(true);
                            PropertiesRootElem.appendChild(clonedNode);
                        }
                    }
                }
            },

            _getFieldIDs: function (viewXml)
            {
                if ($chk(viewXml) === false) return;
                var sourcesXml = viewXml.selectNodes("Sources/Source");
                var fieldIDs = [];

                for (i = 0; i < sourcesXml.length > 0; i++)
                {
                    var fieldsXml = sourcesXml[0].selectNodes("Fields/Field");
                    for (j = 0; j < fieldsXml.length; j++)
                    {
                        fieldIDs.push(fieldsXml[j].getAttribute("ID"));
                    }
                }
                return fieldIDs;
            },

            _getToolbarControls: function (viewXml)
            {
                if ($chk(viewXml) === false)
                    return;

                var toolBarSectionXml = viewXml.selectSingleNode("Canvas/Sections/Section[@Type='ToolBar']/Control[@LayoutType='Grid']");

                var xmlStack = [];

                var canvasControls = [];

                xmlStack.push(toolBarSectionXml);
                while (xmlStack.length > 0)
                {
                    var xmlElement = xmlStack.pop();

                    if ($chk(xmlElement))
                    {
                        var xmlElementNodes = xmlElement.childNodes;
                        if (xmlElementNodes.length > 0)
                        {
                            for (var i = 0; i < xmlElementNodes.length; i++)
                            {
                                var xmlElement = xmlElementNodes[i];
                                if (xmlElement.nodeName === "Control"
                                    && xmlElement.attributes.length === 1
                                    && $chk(xmlElement.getAttribute("ID")))
                                {
                                    canvasControls.push(xmlElement);
                                }

                                if (xmlElement.childNodes.length > 0)
                                {
                                    xmlStack.push(xmlElement);
                                }
                            }
                        }
                    }
                }

                var controlsXml = viewXml.selectNodes("Controls/Control");
                var controlsResult = [];
                if ($chk(controlsXml) && $chk(canvasControls))
                {
                    for (var i = 0; i < canvasControls.length; i++)
                    {
                        for (var j = 0; j < controlsXml.length; j++)
                        {
                            if (canvasControls[i].getAttribute("ID") === controlsXml[j].getAttribute("ID"))
                            {
                                controlsResult.push(controlsXml[j]);
                                break;
                            }
                        }
                    }
                }

                return controlsResult;
            },

            _ClearViewControls: function ()
            {
                var viewElem = _viewDesigner._getViewElem(_viewDesigner.View.viewDefinitionXML);

                if ($chk(viewElem) === true)
                {
                    // Remove controls
                    var ControlsElem = viewElem.selectSingleNode('Controls');
                    if ($chk(ControlsElem) === true)
                    {
                        _viewDesigner._removeXMLChildNodes(ControlsElem);
                    }

                    // Remove associated sources
                    var AssociatedSources = viewElem.selectNodes("Sources/Source[@ContextType='Association'][@ContextID!=@SourceID]");
                    for (var i = 0, l = AssociatedSources.length; i < l; i++)
                    {
                        AssociatedSources[i].parentNode.removeChild(AssociatedSources[i]);
                    }
                }
            },

            _showCellProperties: function ()
            {
                var options =
                {
                    id: "divCellPropertiesPopup",
                    buttons:
                        [
                            {
                                type: "help",
                                click: function () { HelpHelper.runHelp(7000); }
                            },
                            {
                                text: Resources.WizardButtons.OKButtonText,
                                click: _viewDesigner._setCellProperties
                            },
                            {
                                id: 'cmdCellPropertiesPopupCancel',
                                text: Resources.WizardButtons.CancelButtonText
                            }
                        ],
                    headerText: Resources.ViewDesigner.ControlProperties + ': ' + _viewDesigner.View.selectedObject.attr('friendlyname'),
                    closeWith: 'cmdCellPropertiesPopupCancel',
                    content: _viewDesigner.View.element.find('#divCellProperties'),
                    width: 300,
                    height: 300
                };

                popupManager.showPopup(options);

                //Setup the display of the popup
            },

            _setCellProperties: function ()
            {
                popupManager.closeLast();
            },

            _showCanvasProperties: function ()
            {
                var options;
                options = {
                    id: 'divCanvasPropertiesPopup',
                    buttonArray: [
                        {
                            type: "help",
                            click: function () { HelpHelper.runHelp(7000); }
                        },
                        {
                            text: Resources.WizardButtons.OKButtonText,
                            click: _viewDesigner._setCanvasProperties
                        }, {
                            text: Resources.WizardButtons.CancelButtonText,
                            click: function () { popupManager.closeLast(); }
                        }],
                    headerText: Resources.ViewDesigner.ChangeControl,
                    content: _viewDesigner.View.element.find('#divCanvasProperties')
                };

                popupManager.showPopup(options);
                //Setup the display of the popup
            },

            _setCanvasProperties: function ()
            {
                popupManager.closeLast();
            },

            _controlSupportsControlExpressions: function ()
            {
                var control = _viewDesigner.View._findControlFromSelectedObject();
                if (checkExists(control))
                {
                    var controlID = control.attr('id');
                    var result = SourceCode.Forms.Designers.Common.controlSupportsProperty(controlID, _viewDesigner.View.viewDefinitionXML, "ControlExpression");

                    return result.controlSupportsProperty;
                }

                // Safety fallback for old behaviour
                return true;
            },

            _clearControlPropertyGrid: function ()
            {
                var controlPropertiesListTable = _viewDesigner.View.element.find('#controlPropertiesListTable');
                if (controlPropertiesListTable.length > 0)
                {

                    _viewDesigner.View.propertyGrid = null;
                    controlPropertiesListTable.empty();
                }
            },

            _LoadViewEvents: function (hideEnableDisable)
            {
                var ruleDoc;
                var partNodes;
                var nodesXMLDoc = parseXML('<nodes/>');
                var viewList = [];
                var controlList = [];
                var eventList = [];
                var subformIDsArray = [];
                var subformPageIDsArray = [];
                var subformDetails;
                var controlID;
                var controlRules;

                // Hide Enable/Disable Rule Toolbar buttons as none of them will be seleceted.
                if (!((checkExists(hideEnableDisable)) && (!(hideEnableDisable))))
                {
                    _viewDesigner.View.element.find('#vdToolEnableRule, #vdToolLayoutEnableRule, #vdToolDisableRule, #vdToolLayoutDisableRule, #vdRuleEnabledDivider, #vdRuleLayoutEnabledDivider').addClass("hidden");
                }

                _viewDesigner.View.isViewEventsLoaded = true;

                if (checkExists(_viewDesigner.View.viewDefinitionXML))
                {
                    ruleDocViews = _viewDesigner.View.viewDefinitionXML.selectNodes("SourceCode.Forms/Views/View/Events/Event[(@Type='User')]");
                }
                else
                {
                    ruleDocViews = null;
                }

                if ($chk(_viewDesigner.View.selectedObject))
                {
                    controlID = _viewDesigner.View.selectedObject.hasClass('controlwrapper') ? _viewDesigner.View.selectedObject.attr('id') : null;

                    if ($chk(controlID))
                    {
                        controlRules = _viewDesigner.View.viewDefinitionXML.selectNodes("SourceCode.Forms/Views/View/Events/Event[(@Type='User') and (@SourceType='Control') and (@SourceID='" + controlID + "')]");
                    }
                }

                var subformElems = _viewDesigner.View.viewDefinitionXML.selectNodes("SourceCode.Forms/Views/View/Events/Event[(@Type='User')]/Handlers/Handler/Actions/Action[(@Type='Popup') or (@Type='Open')]");

                if ($chk(subformElems))
                {
                    var subformElemsLength = subformElems.length;
                    for (var s = 0; s < subformElemsLength; s++)
                    {
                        if (checkExists(subformElems[s].selectSingleNode("Properties/Property[Name='ViewID']/Value")))
                        {
                            subformIDsArray.push(subformElems[s].selectSingleNode("Properties/Property[Name='ViewID']/Value").text);
                        } else
                        {
                            subformPageIDsArray.push(subformElems[s].selectSingleNode("Properties/Property[Name='FormID']/Value").text);
                        }
                    }

                    if (subformIDsArray.length > 0 || subformPageIDsArray.length > 0)
                    {
                        subformDetails = _viewDesigner.AJAXCall._getSubformsDetails(subformIDsArray, subformPageIDsArray);
                    }
                }

                if ($chk(controlRules))
                {
                    if (controlRules.length > 0)
                    {
                        var nodeElem = nodesXMLDoc.createElement('node');
                        var text;
                        var type;

                        text = _viewDesigner._getControlProperty(controlID, 'ControlName');
                        type = _viewDesigner._getControlType(controlID).toLowerCase();

                        nodeElem.setAttribute('ID', controlID);
                        nodeElem.setAttribute('text', text);
                        nodeElem.setAttribute('icon', type + '-control');
                        nodesXMLDoc.documentElement.appendChild(nodeElem);

                        for (var c = 0; c < controlRules.length; c++)
                        {
                            var event = controlRules[c];
                            var ruleFriendlyNameNode = event.selectSingleNode('Properties/Property[Name="RuleFriendlyName"]/Value');
                            var ruleFriendlyName;
                            if (ruleFriendlyNameNode !== null)
                            {
                                ruleFriendlyName = ruleFriendlyNameNode.text;
                            }
                            var eventID = event.getAttribute('ID');
                            var subNodeElem = nodesXMLDoc.createElement('node');
                            subNodeElem.setAttribute('ID', eventID);
                            subNodeElem.setAttribute('text', ruleFriendlyName);
                            subNodeElem.setAttribute('icon', 'view-event');

                            nodeElem.appendChild(subNodeElem);
                        }
                    }
                }

                if (checkExistsNotEmpty(ruleDocViews))
                {
                    for (var i = 0; i < ruleDocViews.length; i++)
                    {
                        var event = ruleDocViews[i];

                        _viewDesigner._LoadViewEventsProcessPartNode(event, nodesXMLDoc, viewList, subformDetails);
                    }
                }

                //BUG 720782: ViewEventsTree is NULL.
                //Events tree was deprecated before SF release!
                // if (checkExistsNotEmpty(_viewDesigner.View.viewEventsTree))
                // {
                // 	_viewDesigner.View.viewEventsTree.find("li.root").children("ul").empty();
                // }
                //_viewDesigner._AddViewsToEventTree(nodesXMLDoc.xml);
            },

            _AddViewsToEventTree: function (xml)
            {
                //BUG 720782: ViewEventsTree is NULL.
                //Events tree was deprecated before SF release!
                // if ($chk(xml) === true)
                // {
                // 	var nodesXMLDoc = parseXML(xml);
                // 	if ($chk(nodesXMLDoc) === true)
                // 	{
                // 		var nodes = nodesXMLDoc.selectNodes('nodes/node');

                // 		for (var i = 0; i < nodes.length; i++)
                // 		{
                // 			var thisNode = nodes[i];

                // 			_viewDesigner._AddViewsToEventTreeProcessNode(thisNode);
                // 		}

                // 		if (checkExistsNotEmpty(_viewDesigner.View.viewEventsTree))
                // 		{
                // 			_viewDesigner.View.viewEventsTree.tree("expand", _viewDesigner.View.viewEventsTree.find("li.root"));
                // 		}
                // 	}
                // }
                _viewDesigner.View.isViewEventsLoading = false;
            },

            _AddViewsToEventTreeProcessNode: function (thisNode)
            {
                //TODO: Understand this! LG
                //BUG 720782: ViewEventsTree is NULL.

                // var id = thisNode.getAttribute('ID');
                // var text = thisNode.getAttribute('text');
                // var icon = thisNode.getAttribute('icon');

                // var o = {
                // 	id: thisNode.getAttribute('ID'),
                // 	text: thisNode.getAttribute('text'),
                // 	icon: thisNode.getAttribute('icon'),
                // 	data: { icon: thisNode.getAttribute('icon') },
                // 	open: true
                // };


                // var parententry = _viewDesigner.View.viewEventsTree.children("li:first-child");
                // var entry = _viewDesigner.View.viewEventsTree.tree("add", parententry, o);

                // var subNodes = thisNode.selectNodes('node');
                // for (var j = 0; j < subNodes.length; j++)
                // {
                // 	var subNode = subNodes[j];
                // 	var subid = subNode.getAttribute('ID');
                // 	var subtext = subNode.getAttribute('text');
                // 	var icon = subNode.getAttribute('icon');

                // 	var oo = {
                // 		id: subid,
                // 		text: subtext,
                // 		icon: icon,
                // 		data: { icon: icon }
                // 	};

                // 	_viewDesigner.View.viewEventsTree.tree("add", entry, oo);
                // }
            },

            _GetViewName: function ()
            {

                var ViewName = '';
                var xmlDoc = _viewDesigner.View.viewDefinitionXML;
                var ViewXPath = '//Views/View';
                var ViewElem = xmlDoc.selectSingleNode(ViewXPath);

                if (ViewElem)
                {
                    var ViewNameElem = ViewElem.selectSingleNode('Name');
                    ViewName = ViewNameElem.text;
                }

                return ViewName;
            },

            _GetViewDisplayName: function ()
            {
                var ViewDisplayName = '';
                var xmlDoc = _viewDesigner.View.viewDefinitionXML;
                var ViewXPath = '//Views/View';
                var ViewElem = xmlDoc.selectSingleNode(ViewXPath);

                if (ViewElem)
                {
                    var ViewDisplayNameElem = ViewElem.selectSingleNode('DisplayName');
                    ViewDisplayName = ViewDisplayNameElem.text;
                }

                return ViewDisplayName;
            },

            _GetViewDescription: function ()
            {
                var ViewDescription = '';
                var xmlDoc = _viewDesigner.View.viewDefinitionXML;
                var ViewXPath = '//Views/View';
                var ViewElem = xmlDoc.selectSingleNode(ViewXPath);

                if (ViewElem)
                {
                    var ViewDescriptionElem = ViewElem.selectSingleNode('Description');
                    ViewDescription = checkExists(ViewDescriptionElem) ? ViewDescriptionElem.text : "";
                }

                return ViewDescription;
            },

            _LoadViewEventsProcessPartNode: function (event, nodesXMLDoc, viewList, subformDetails)
            {
                var eventViewID = _viewDesigner._GetViewID();
                var text;
                var eventID = event.getAttribute('ID');

                if (viewList.length > 0)
                {
                    if (($chk(eventViewID) === true) && (viewList.contains(eventViewID, 0) === false))
                    {
                        var nodeElem = nodesXMLDoc.createElement('node');
                        text = _viewDesigner._GetViewDisplayName();

                        nodeElem.setAttribute('ID', eventViewID);
                        nodeElem.setAttribute('text', text);
                        nodeElem.setAttribute('icon', 'view');
                        nodesXMLDoc.documentElement.appendChild(nodeElem);

                        viewList.push(eventViewID);
                    }
                }

                var thisNodeElem = nodesXMLDoc.selectSingleNode('nodes/node[@ID="' + _viewDesigner._GetViewID() + '"]');

                if (thisNodeElem)
                {
                    var eventNameElem = event.selectSingleNode('Properties/Property[Name="RuleFriendlyName"]/Value');
                    var eventName;
                    if ($chk(eventNameElem))
                    {
                        eventName = eventNameElem.text;
                    }
                    else
                    {
                        eventName = 'Event';
                    }

                    subNodeElem = nodesXMLDoc.createElement('node');
                    subNodeElem.setAttribute('ID', eventID);
                    subNodeElem.setAttribute('text', eventName);
                    subNodeElem.setAttribute('icon', 'view-event');

                    thisNodeElem.appendChild(subNodeElem);
                }
            },

            _getControlType: function (id)
            {
                var control = _viewDesigner.View.element.find('#' + id);
                if (control.length > 0)
                {
                    return control.attr('controltype');
                }
                else
                {
                    return '';
                }
            },

            _getControlProperty: function (controlID, propertyName)
            {
                var retVal = '';

                var xmlPropertiesDoc = _viewDesigner.View.controlPropertiesXML;
                if ($chk(xmlPropertiesDoc) === true)
                {
                    var ControlElem = xmlPropertiesDoc.selectSingleNode('Control[@ID="' + controlID + '"]');
                    if ($chk(ControlElem) === true)
                    {
                        var PropRuntimeElem = ControlElem.selectSingleNode('Properties/Property[Name="' + propertyName + '"]/Value');
                        if ($chk(PropRuntimeElem) === true)
                        {
                            retVal = PropRuntimeElem.text;
                        }
                    }
                }

                return retVal;
            },

            _getControlPropertyValidation: function (controlID, propertyName)
            {
                var retVal = {
                    ValidationStatus: "",
                    ValidationMessages: ""
                };

                var xmlPropertiesDoc = _viewDesigner.View.controlPropertiesXML;
                if (xmlPropertiesDoc !== null)
                {
                    var ControlElem = xmlPropertiesDoc.selectSingleNode('Control[@ID="' + controlID + '"]');
                    if (ControlElem !== null)
                    {
                        var PropRuntimeElem = ControlElem.selectSingleNode('Properties/Property[Name="' + propertyName + '"]');
                        if (PropRuntimeElem !== null)
                        {
                            retVal["ValidationStatus"] = PropRuntimeElem.getAttribute("ValidationStatus");
                            retVal["ValidationMessages"] = PropRuntimeElem.getAttribute("ValidationMessages");
                        }
                    }
                }

                return retVal;
            },

            _getControlPropertyValueAndDisplayValue: function (controlId, propertyName)
            {
                var retVal = { value: "", displayValue: "" };

                var xmlPropertiesDoc = _viewDesigner.View.controlPropertiesXML;

                if (xmlPropertiesDoc)
                {
                    var propertyNode = xmlPropertiesDoc.selectSingleNode('Control[@ID="' + controlId + '"]/Properties/Property[Name="' + propertyName + '"]');

                    if (propertyNode)
                    {
                        var valueNode = propertyNode.selectSingleNode("Value");
                        var displayValueNode = propertyNode.selectSingleNode("DisplayValue");

                        if (valueNode)
                        {
                            retVal.value = valueNode.text;
                        }

                        if (displayValueNode)
                        {
                            retVal.displayValue = displayValueNode.text;
                        }
                        else
                        {
                            retVal.displayValue = retVal.value;
                        }

                        if (retVal.value !== "" || retVal.displayValue !== "")
                        {
                            return retVal;
                        }
                    }
                }

                return null;
            },

            _getViewElem: function (xmlDoc)
            {
                var viewElem = xmlDoc.selectSingleNode('SourceCode.Forms/Views/View');
                return viewElem;
            },

            _cleanupField: function (id)
            {
                var eventsElem = _viewDesigner.View.viewDefinitionXML.selectSingleNode('//Events');
                if ($chk(eventsElem) === true)
                {
                    //var xpath = 'Rule/Actions/Action/Mappings/Mapping/Item[@Guid="' + id + '"]';
                    var xpath = '//Parameters/Parameter[(@TargetID="' + id + '") or (@SourceID="' + id + '")]';
                    var itemsElems = eventsElem.selectNodes(xpath);
                    for (var j = 0; j < itemsElems.length; j++)
                    {
                        var itemElem = itemsElems[j];
                        var actionElem = itemElem.parentNode.parentNode;
                        var actionParameters = actionElem.selectSingleNode("Parameters");
                        var actionsElem = actionElem.parentNode;
                        var eventElem = actionsElem.parentNode.parentNode.parentNode;

                        actionParameters.removeChild(itemElem);
                        //if the action had a parameter then most likely it required at least one
                        //we therefore remove it
                        if (actionParameters.childNodes.length === 0)
                        {
                            actionsElem.removeChild(actionElem);
                        }

                        if (actionsElem.childNodes.length === 0)
                        {
                            var handlersElem = eventElem.selectNodes("Handlers/Handler[Actions/Action]");
                            if (handlersElem.length === 0)
                            {
                                eventsElem.removeChild(eventElem);
                            }
                            break;
                        }
                    }
                }
            },

            _removeControlSOSources: function (controlId)
            {
                var viewxmldoc = _viewDesigner.View.viewDefinitionXML;
                var viewelem = _viewDesigner._getViewElem(viewxmldoc);

                if (!checkExists(viewxmldoc) || !checkExists(viewelem))
                {
                    return;
                }

                //remove static source dependencies
                _viewDesigner._removeControlDataSourceDependencies(controlId, null);

                //remove smo sources dependencies
                var sourceList = viewelem.selectNodes('Sources/Source[(@ContextType="Association" or @ContextType="External") and @ContextID="' + controlId + '"]');
                for (var i = 0; i < sourceList.length; i++)
                {
                    var sourceElem = sourceList[i];
                    var smartObjectId = sourceElem.getAttribute("SourceID");

                    var sourcesElem = sourceElem.parentNode;

                    //first remove all dependencies to associated data source of control
                    _viewDesigner._removeControlDataSourceDependencies(controlId, smartObjectId);

                    sourcesElem.removeChild(sourceElem);
                }
            },

            _removeControlSOSource: function (controlId, propertyName, sourceId)
            {
                if (!checkExistsNotEmpty(controlId))
                {
                    return;
                }

                var viewxmldoc = _viewDesigner.View.viewDefinitionXML;
                var viewelem = _viewDesigner._getViewElem(viewxmldoc);

                if (!checkExists(viewxmldoc) || !checkExists(viewelem))
                {
                    return;
                }

                var smartObjectId = "";

                if (checkExistsNotEmpty(sourceId))
                {
                    smartObjectId = sourceId;
                }
                else
                {
                    var xPath = "//Controls/Control[@ID='{0}']/Properties/Property[Name='{1}']/Value".format(controlId, propertyName);
                    var associationSmoNode = viewelem.selectSingleNode(xPath);
                    if (checkExists(associationSmoNode))
                    {
                        smartObjectId = associationSmoNode.text;
                    }
                }

                var sourceList = viewelem.selectNodes('Sources/Source[(@SourceID="{0}") and @ContextID="{1}"]'.format(smartObjectId, controlId));
                for (var i = 0; i < sourceList.length; i++)
                {
                    var sourceElem = sourceList[i];
                    var sourcesElem = sourceElem.parentNode;

                    //first remove all dependencies to associated data source of control
                    _viewDesigner._removeControlDataSourceDependencies(controlId, smartObjectId);

                    sourcesElem.removeChild(sourceElem);
                }
            },

            _removeControlDataSourceDependencies: function (controlId, sourceId)
            {
                if (!checkExistsNotEmpty(controlId))
                {
                    return;
                }

                var xmlDefinition = _viewDesigner.View.viewDefinitionXML;

                var dataSourceDependencies = [];

                var itemsToDelete = null;

                if (SourceCode.Forms.Designers.hasStaticSource(controlId))
                {
                    itemsToDelete =
                        [
                            {
                                itemType: "ControlField",
                                itemId: controlId,
                                contextId: controlId
                            }
                        ];
                }
                else if (checkExistsNotEmpty(sourceId))
                {
                    itemsToDelete = SourceCode.Forms.Designers.getDependencyDataCollectionForExternalSource(controlId, sourceId);
                }

                dataSourceDependencies = SourceCode.Forms.Designers.getDependencies(itemsToDelete, { xmlDef: xmlDefinition });

                if (dataSourceDependencies.length === 0)
                {
                    return;
                }

                //Remove and annotate if necessary
                var referencesToAnnotate = [];
                var itemsRemoved = SourceCode.Forms.DependencyHelper.removeDependentItems(dataSourceDependencies, xmlDefinition);

                for (i = 0; i < itemsRemoved.length; i++)
                {
                    var referenceObj =
                    {
                        id: itemsRemoved[i].id,
                        type: itemsRemoved[i].type,
                        name: itemsRemoved[i].name,
                        displayName: itemsRemoved[i].displayName
                    };

                    referenceObj = SourceCode.Forms.DependencyHelper.findReferences(xmlDefinition, referenceObj);

                    referencesToAnnotate.push(referenceObj);

                    // Update reference statuses
                    for (i = 0; i < referencesToAnnotate.length; i++)
                    {
                        referencesToAnnotate[i].status = "Missing";
                    }

                    // Update the reporter's model (data)
                    SourceCode.Forms.Designers.Common.updateDependencyReporterModel(referencesToAnnotate);

                    //Dependencies were removed: their removal might have broken other items
                    SourceCode.Forms.DependencyHelper.updateAnnotations(xmlDefinition, referencesToAnnotate);
                }
            },

            _cleanupControl: function (object, removeControl, keepControlEvents, keepControlMappings, clearFields, clearSO, objectIsXml)
            {
                var objectid = null;

                if (checkExists(objectIsXml) && objectIsXml)
                {
                    objectid = object.getAttribute("ID");
                }
                else
                {
                    object = $(object);
                    objectid = object.attr('id');
                    //cleanup events
                    object.off();
                }

                if (keepControlMappings !== true)
                {
                    if (checkExists(objectIsXml) && objectIsXml)
                    {
                        if (checkExists(object.getAttribute("FieldID")))
                        {
                            var smartObjectNode = _viewDesigner.View.viewDefinitionXML.selectSingleNode("//Views/View/Sources/Source[Fields/Field='{0}']".format(object.getAttribute("FieldID")));
                            if (checkExists(smartObjectNode))
                            {
                                var dummyObject = $("<div id='{0}' soid='{1}' propertyid='{2}' layouttype='control' itemtype='property'></div>".format(object.getAttribute("ID"), smartObjectNode.getAttribute("SourceID"), object.getAttribute("FieldID")));
                                _viewDesigner._cleanControlMappings(dummyObject);
                            }
                        }
                    }
                    else
                    {
                        _viewDesigner._cleanControlMappings(object);
                    }
                }

                //cleanup data
                var viewxmldoc = _viewDesigner.View.viewDefinitionXML;
                var viewelem = _viewDesigner._getViewElem(viewxmldoc);

                if (clearFields !== false)
                {
                    var fieldsList = viewelem.selectNodes('Sources/Source[(@ContextType="Association" or @ContextType="External") and @ContextID="' + objectid + '"]/Fields/Field');
                    for (var i = 0; i < fieldsList.length; i++)
                    {
                        fieldElem = fieldsList[i];
                        var fieldsElem = fieldElem.parentNode;
                        //cleanup behaviours that use _viewDesigner field
                        _viewDesigner._cleanupField(fieldElem.getAttribute('ID'));

                        fieldsElem.removeChild(fieldElem);
                    }
                }

                if (clearSO !== false)
                {
                    var sourceList = viewelem.selectNodes('Sources/Source[(@ContextType="Association" or @ContextType="External") and @ContextID="' + objectid + '"]');
                    for (var i = 0; i < sourceList.length; i++)
                    {
                        sourceElem = sourceList[i];
                        var sourcesElem = sourceElem.parentNode;

                        sourcesElem.removeChild(sourceElem);
                    }
                }

                //cleanup behaviours
                if (!keepControlEvents)
                {
                    _viewDesigner._cleanupControlBehaviours(objectid, true, true);
                }

                if (removeControl)
                {
                    // Cleanup Expression
                    var expressions = viewelem.selectNodes("Expressions/Expression[.//Item[@SourceID='" + objectid + "'][@SourceType='Control']] | Expressions/Expression[.//Item[@SourcePath='" + objectid + "'][@SourceType='ControlProperty']]");
                    for (var i = 0, l = expressions.length; i < l; i++) expressions[i].setAttribute("Resolved", "False");

                    //Cleanup conditional styles
                    _viewDesigner._cleanUpConditionalStyles(objectid);
                }

                _viewDesigner._ClearControlProperties(objectid, true);

                if (removeControl)
                {
                    // Cleanup Validation Groups linked to control
                    _viewDesigner._removeValidationGroupsForControl(objectid, viewelem);

                    var controlToRemove = _viewDesigner.View.viewDefinitionXML.selectSingleNode('//Controls/Control[@ID="' + objectid + '"]');

                    if ($chk(controlToRemove))
                    {
                        controlToRemove.parentNode.removeChild(controlToRemove);
                    }
                }
            },
            //TODO: This method should no longer be used when Dependency Notifier Feature complete
            _cleanUpConditionalStyles: function (controlID)
            {
                var controlsUsingControl = _viewDesigner.View.viewDefinitionXML.selectNodes("//Controls/Control/ConditionalStyles/ConditionalStyle/Condition[.//Item[(@SourceType='Control')and(@SourceID='" + controlID + "')]] | //Controls/Control/ConditionalStyles/ConditionalStyle/Condition[.//Item[(@SourceType='ControlProperty')and(@SourcePath='" + controlID + "')]]");
                var controlsUsingControlLength = controlsUsingControl.length;

                for (var c = 0; c < controlsUsingControlLength; c++)
                {
                    var currentConditionItem = controlsUsingControl[c];
                    currentConditionItem.setAttribute("Resolved", "false");
                }
            },

            _removeValidationGroupsForControl: function (controlID, viewElement)
            {
                var validationGroupControlElements = viewElement.selectNodes("ValidationGroups/ValidationGroup/ValidationGroupControls/ValidationGroupControl[@ControlID='" + controlID + "']");
                var validationGroupControlElementsLength = validationGroupControlElements.length;

                for (var v = 0; v < validationGroupControlElementsLength; v++)
                {
                    var currentNode = validationGroupControlElements[v];
                    var validationGroupControlsNode = currentNode.parentNode;
                    var validationGroupID;
                    var validationGroupNode = currentNode.parentNode;

                    while (validationGroupNode.tagName !== "ValidationGroup")
                    {
                        validationGroupNode = validationGroupNode.parentNode;
                    }

                    validationGroupID = validationGroupNode.getAttribute("ID");
                    validationGroupControlsNode.removeChild(currentNode);

                    if (validationGroupControlsNode.childNodes.length === 0)
                    {
                        var validationGroupNode = validationGroupControlsNode.parentNode;
                        validationGroupNode.removeChild(validationGroupControlsNode);

                        validationGroupControlsNode = validationGroupNode.selectNodes("ValidationGroupControls");

                        if (validationGroupControlsNode.length === 0)
                        {
                            var ValidationGroupsNode = validationGroupNode.parentNode;
                            ValidationGroupsNode.removeChild(validationGroupNode);
                        }
                    }

                    // Mark events and action as invalid if it was using this group
                    var actions = viewElement.selectNodes("//Action[Properties/Property[(Name='GroupID') and (Value/text()='" + validationGroupID + "')]]");
                    var actionsLength = actions.length;

                    for (var a = 0; a < actionsLength; a++)
                    {
                        var currentAction = actions[a];
                        var eventNode = currentAction.parentNode;

                        while (eventNode.tagName !== "Event")
                        {
                            eventNode = eventNode.parentNode;
                        }

                        SourceCode.Forms.Designers.setDesignProperty(eventNode, "Invalid", "true");
                        SourceCode.Forms.Designers.setDesignProperty(currentAction, "Invalid", "true");
                    }
                }
            },

            //TODO: This method should no longer be used when Dependency Notifier Feature complete
            _cleanControlMappings: function (object)
            {
                if (checkExists(object.attr("soid")) && object.attr("layouttype") === "control" && object.attr("itemtype") === "property")
                {
                    var id = object.attr("id");
                    var actionsXML = _viewDesigner.View.viewDefinitionXML.selectNodes("//Views/View/Events/Event[@Type='User']/Handlers/Handler/Actions/Action");
                    var actionXmlLength = actionsXML.length;
                    var fieldControls = $("div [layouttype][propertyid='{0}'][id!='{1}']".format(object.attr("propertyid"), object.attr("id")));

                    for (var i = 0; i < actionXmlLength; i++)
                    {
                        var parameter = actionsXML[i].selectSingleNode("Parameters/Parameter[@SourceID='{0}']".format(id));
                        var result = actionsXML[i].selectSingleNode("Results/Result[@TargetID='{0}']".format(id));

                        // more than one bounded control exists for this mapping, re-map to a different one
                        if (fieldControls.length > 0)
                        {
                            if (checkExists(parameter))
                            {
                                parameter.setAttribute("SourceID", fieldControls[0].getAttribute("ID"));
                            }

                            if (checkExists(result))
                            {
                                result.setAttribute("TargetID", fieldControls[0].getAttribute("ID"));
                            }
                        }
                        else
                        {
                            // if no other field controls are found, revert to a field mapping
                            var source = _viewDesigner.View.viewDefinitionXML.selectSingleNode("//Views/View/Sources/Source[@SourceID='{0}']".format(object.attr("soid")));
                            var field = ($chk(source)) ? source.selectSingleNode("Fields/Field[FieldName='{0}']".format(object.attr("propertyid"))) : null;
                            if ($chk(field))
                            {
                                if (checkExists(parameter))
                                {
                                    parameter.setAttribute("SourceID", field.getAttribute("ID"));
                                    parameter.setAttribute("SourceType", "ViewField");
                                }

                                if (checkExists(result))
                                {
                                    result.setAttribute("TargetID", field.getAttribute("ID"));
                                    result.setAttribute("TargetType", "ViewField");
                                }
                            }
                        }
                    }

                    this._clearSystemEventsForControl(id);
                }
            },

            //Clear system events for specified control
            _clearSystemEventsForControl: function (controlId)
            {
                var viewDefXml = _viewDesigner.View.viewDefinitionXML;
                var eventsElem = viewDefXml.selectSingleNode('//Views/View/Events');

                if (checkExists(eventsElem))
                {
                    var grid = _viewDesigner.View._getTargetGrid();
                    var xpath = 'Event[@Type="System" and @SourceID="' + controlId + '"]';
                    var eventElems = eventsElem.selectNodes(xpath);
                    for (var j = 0; j < eventElems.length; j++)
                    {
                        var eventElem = eventElems[j];
                        //Remove entire event where control used as source of system event:
                        SourceCode.Forms.Designers.Common.Rules.removeItemFromXml(eventElem, viewDefXml, grid);
                    }

                    //If control is the target of an event, remove the action for that control
                    xpath = "Event[@Type='System']//Action[Properties/Property[(Name='ControlID') and (Value='" + controlId + "')]]";
                    var listenerElems = eventsElem.selectNodes(xpath);
                    for (var j = 0; j < listenerElems.length; j++)
                    {
                        var listenerElem = listenerElems[j];
                        var listenerActionsElem = listenerElem.parentNode;
                        listenerActionsElem.removeChild(listenerElem);

                        //if event has 0 actions after the action has been removed, remove the event
                        if (listenerActionsElem.selectNodes("./*").length === 0)
                        {
                            var handlersEl = listenerActionsElem.parentNode.parentNode;
                            handlersEl.removeChild(listenerActionsElem.parentNode);

                            if (handlersEl.selectNodes("./*").length === 0)
                            {
                                SourceCode.Forms.Designers.Common.Rules.removeItemFromXml(handlersEl.parentNode, viewDefXml, grid);
                            }
                        }
                    }
                }

                //Clear system events parameters and result for specified control
                actionsXML = viewDefXml.selectNodes("//Views/View/Events/Event[@Type='System']//Actions/Action");
                actionXmlLength = actionsXML.length;

                for (var i = 0; i < actionXmlLength; i++)
                {
                    var parameter = actionsXML[i].selectSingleNode("Parameters/Parameter[(@SourceID='{0}') or (@TargetID='{0}')]".format(controlId));
                    var result = actionsXML[i].selectSingleNode("Results/Result[(@SourceID='{0}') or (@TargetID='{0}')]".format(controlId));

                    if (checkExists(parameter))
                    {
                        parameter.parentNode.removeChild(parameter);
                    }

                    if (checkExists(result))
                    {
                        result.parentNode.removeChild(result);
                    }
                }
            },

            _ClearControlProperties: function (controlID, keepName)
            {
                var ControlPropertiesXml = _viewDesigner.View.controlPropertiesXML;
                var xmlDoc = _viewDesigner.View.controlPropertiesXML;

                var controlXPath = 'Control[@ID="' + controlID + '"]';
                var controlsElem = xmlDoc;
                var controlElem = controlsElem.selectSingleNode(controlXPath);

                if (controlElem)
                {
                    var controlName = controlElem.selectSingleNode("Name").text;
                    var controlFieldID = controlElem.getAttribute("FieldID");

                    if (controlElem)
                    {
                        var properties = controlElem.selectSingleNode("Properties");
                        if (checkExists(properties))
                        {
                            controlElem.removeChild(properties);
                        }
                        var name = controlElem.selectSingleNode("Name");
                        if (checkExists(name))
                        {
                            controlElem.removeChild(name);
                        }
                    }

                    if (keepName)
                    {
                        var controlNameElement = _viewDesigner.View.viewDefinitionXML.createElement('Name');
                        controlNameElement.appendChild(_viewDesigner.View.viewDefinitionXML.createTextNode(controlName));
                        controlElem.appendChild(controlNameElement);

                        var propertiesEl = _viewDesigner.View.viewDefinitionXML.createElement('Properties');
                        var propertyEl = _viewDesigner.View.viewDefinitionXML.createElement('Property');
                        var nameEl = _viewDesigner.View.viewDefinitionXML.createElement('Name');
                        var valueEl = _viewDesigner.View.viewDefinitionXML.createElement('Value');
                        var displayEl = _viewDesigner.View.viewDefinitionXML.createElement('DisplayValue');

                        nameEl.appendChild(_viewDesigner.View.viewDefinitionXML.createTextNode('ControlName'));
                        valueEl.appendChild(_viewDesigner.View.viewDefinitionXML.createTextNode(controlName));
                        displayEl.appendChild(_viewDesigner.View.viewDefinitionXML.createTextNode(controlName));
                        propertyEl.appendChild(nameEl);
                        propertyEl.appendChild(valueEl);
                        propertyEl.appendChild(displayEl);
                        propertiesEl.appendChild(propertyEl);
                        controlElem.appendChild(propertiesEl);
                    }
                }
            },

            _cleanupControlBehaviours: function (object, objectIsId, keepEventAction)
            {
                var grid = _viewDesigner.View._getTargetGrid();
                var objectid = null;
                if (checkExists(objectIsId) && objectIsId)
                {
                    objectid = object;
                }
                else
                {
                    object = $(object);
                    objectid = object.attr('id');
                }

                var eventsElem = _viewDesigner.View.viewDefinitionXML.selectSingleNode('//Views/View/Events');

                if ($chk(eventsElem) === true)
                {
                    //if control is source of rule
                    var xpath = 'Event[@SourceID="' + objectid + '"]';
                    var eventElems = eventsElem.selectNodes(xpath);
                    for (var j = 0; j < eventElems.length; j++)
                    {
                        var eventElem = eventElems[j];
                        SourceCode.Forms.Designers.Common.Rules.removeItemFromXml(eventElem, _viewDesigner.View.viewDefinitionXML, grid);
                    }

                    if (keepEventAction !== true)
                    {
                        //if control is the target of an event...remove the action for that control
                        xpath = "Event/Handlers/Handler/Actions/Action[Properties/Property[(Name='ControlID') and (Value='" + objectid + "')]]";
                        var listenerElems = eventsElem.selectNodes(xpath);
                        for (var j = 0; j < listenerElems.length; j++)
                        {
                            var listenerElem = listenerElems[j];
                            var listenerActionsElem = listenerElem.parentNode;
                            listenerActionsElem.removeChild(listenerElem);

                            //if event has 0 actions after the action has been removed...remove the event
                            if (listenerActionsElem.selectNodes("./*").length === 0)
                            {
                                var handlersEl = listenerActionsElem.parentNode.parentNode;
                                handlersEl.removeChild(listenerActionsElem.parentNode);

                                if (handlersEl.selectNodes("./*").length === 0)
                                {
                                    _viewDesigner.View.currentGridObject.removeItem(grid, _viewDesigner.View.viewDefinitionXML, handlersEl.parentNode, null, true);
                                }
                            }
                        }
                    }

                    // if control is used in handler
                    xpath = "Event/Handlers/Handler/Function/ControlItemsCollection/Item[.='" + objectid + "']";
                    var handlerElements = eventsElem.selectNodes(xpath);

                    for (var h = 0; h < handlerElements.length; h++)
                    {
                        var handlerElem = handlerElements[h];
                        var eventElement = handlerElem.parentNode;

                        while (eventElement.nodeName !== "Event")
                        {
                            eventElement = eventElement.parentNode;
                        }

                        handlerElem.removeChild(handlerElem.firstChild);
                        handlerElem.appendChild(handlerElem.ownerDocument.createTextNode("00000000-0000-0000-0000-000000000000"));
                    }
                }
            },

            _cleanupControlAssociatedSOActions: function (controlId, associatedSOId)
            {
                var eventsElem = _viewDesigner.View.viewDefinitionXML.selectSingleNode('//Views/View/Events');
                var grid = _viewDesigner.View._getTargetGrid();
                var hasPopulate = eventsElem.selectSingleNode("Event/Handlers/Handler/Actions/Action[(@Type='PopulateControl')]");
                var xpath;
                if (checkExists(eventsElem))
                {
                    if (hasPopulate)
                    {
                        xpath = "Event/Handlers/Handler/Actions/Action[(@Type='Execute' or @Type='PopulateControl') and (Properties/Property[(Name='ControlID') and (Value='" + controlId + "')]) and (Properties/Property[(Name='ObjectID') and (Value='" + associatedSOId + "')])]";
                    }
                    else
                    {
                        xpath = "Event/Handlers/Handler/Actions/Action[(@Type='Execute') and (Properties/Property[(Name='ControlID') and (Value='" + controlId + "')]) and (Properties/Property[(Name='ObjectID') and (Value='" + associatedSOId + "')])]";
                    }

                    var associatedSOActions = eventsElem.selectNodes(xpath);

                    for (var i = 0; i < associatedSOActions.length; i++)
                    {
                        var currentAction = associatedSOActions[i];
                        var currentActionParent = currentAction.parentNode;

                        currentActionParent.removeChild(currentAction);

                        if (currentActionParent.childNodes.length === 0)
                        {
                            var currentHandlersElem = currentActionParent.parentNode.parentNode;

                            currentHandlersElem.removeChild(currentActionParent.parentNode);

                            if (currentHandlersElem.childNodes.length === 0)
                            {
                                _viewDesigner.View.currentGridObject.removeItem(grid, _viewDesigner.View.viewDefinitionXML, currentHandlersElem.parentNode, null, true);
                            }
                        }
                    }
                }
            },

            _getPropertyGetFunction: function (controlType, propertyName)
            {
                var retVal = null;
                var xmlControlDefDoc = SourceCode.Forms.Designers.Common.controlDefinitionsXml;
                var ControlElem = xmlControlDefDoc.selectSingleNode('Controls/Control[Name="' + controlType + '"]');
                if ($chk(ControlElem) === true)
                {
                    var ControlPropElem = ControlElem.selectSingleNode('DefaultProperties');
                    var xmlControlPropDoc = ControlPropElem.selectSingleNode("Properties");
                    if ($chk(xmlControlPropDoc) === true)
                    {
                        var PropElem = xmlControlPropDoc.selectSingleNode('Prop[@ID="' + propertyName + '"]');
                        if ($chk(PropElem) === true)
                        {
                            retVal = PropElem.getAttribute('getFunction');
                        }
                    }

                }

                return retVal;
            },

            _GetAssociationSmartObjectDetails: function (soid)
            {
                var id = '';
                var name = '';
                var friendlyname = '';
                var AssociationDoc = _viewDesigner.View.hiddenAssociationXml;
                var AssociationRoot = AssociationDoc.selectSingleNode('associations');
                if ($chk(AssociationRoot) === true)
                {
                    var soElem = AssociationRoot.selectSingleNode('smartobjectroot[@guid="' + soid + '"]');
                    if (soElem)
                    {
                        id = soElem.getAttribute('guid');
                        name = soElem.getAttribute('name');
                        friendlyname = soElem.selectSingleNode('metadata/display/displayname').text;

                        return { id: id, name: name, friendlyname: friendlyname };
                    }
                    else
                    {
                        return null;
                    }
                }
                else
                {
                    return null;
                }
            },

            _BuildPropertyElem: function (id, key, value, display)
            {
                var xmlDoc = _viewDesigner.View.viewDefinitionXML;

                var PropertyElem = xmlDoc.createElement('Property');
                var PropertyKeyElem = xmlDoc.createElement('Name');
                var PropertyValueElem = xmlDoc.createElement('Value');
                var PropertyDisplayElem = xmlDoc.createElement('DisplayValue');
                var propertyValue = "";
                var propertyDisplay = "";

                if (checkExists(id))
                {
                    PropertyElem.setAttribute('ID', id);
                }

                if (checkExists(value))
                {
                    propertyValue = value.toString();
                }

                if (checkExists(display))
                {
                    propertyDisplay = display.toString();
                }

                PropertyKeyElem.appendChild(xmlDoc.createTextNode(key));
                PropertyValueElem.appendChild(xmlDoc.createTextNode(propertyValue));
                PropertyDisplayElem.appendChild(xmlDoc.createTextNode(propertyDisplay));
                PropertyElem.appendChild(PropertyKeyElem);
                PropertyElem.appendChild(PropertyValueElem);
                PropertyElem.appendChild(PropertyDisplayElem);

                var PropertyNameValueElem = null;

                if (_viewDesigner.View.NameValuePropertiesCollection.indexOf(key) > -1)
                {
                    if (key === "Field" && checkExists(display))
                    {
                        PropertyNameValueElem = xmlDoc.createElement('NameValue');

                        PropertyNameValueElem.appendChild(xmlDoc.createTextNode(display.toString()));
                        PropertyElem.appendChild(PropertyNameValueElem);
                    }
                    else if (checkExists(value))
                    {
                        PropertyNameValueElem = xmlDoc.createElement('NameValue');

                        PropertyNameValueElem.appendChild(xmlDoc.createTextNode(value.toString()));
                        PropertyElem.appendChild(PropertyNameValueElem);
                    }
                }

                return PropertyElem;
            },

            _getControlPropertyElement: function (id, property, xmlDoc)
            {
                var propertyElem = xmlDoc.selectSingleNode('Property[Name="' + property + '"]');
                return propertyElem;
            },

            //LG: Added to get the selected control's details. method also appears in form designer (layout)
            _getControlInfo: function (strControlType)
            {
                var _controlNode = SourceCode.Forms.Designers.Common.controlDefinitionsXml.documentElement.selectSingleNode("Control[Name='" + strControlType + "']");

                var _displayName = _controlNode.selectSingleNode('FriendlyName').text;
                var _type = _controlNode.selectSingleNode('Name').text;
                var _iconClass = _type.toLowerCase().replace(/\s/g, "-") + "-control";

                switch (strControlType.toLowerCase())
                {
                    case "form":
                        _iconClass = "ic-form";
                        _displayName = Resources.ObjectNames.SmartFormSingular;
                        break;
                    case "view":
                    case "areaitem":
                        _iconClass = "ic-view";
                        _displayName = Resources.ObjectNames.SmartViewSingular;
                        break;
                }

                var info = {
                    name: _displayName,
                    type: _type,
                    iconClass: _iconClass,
                };

                return info;

            },

            //updates the icon and text at the top of the properties panel. method also appears in form designer (layout)
            _updatePropertiesHeader: function (strControlType)
            {
                if (!checkExists(strControlType) || strControlType === "")
                {
                    this.$propertiesIcon.attr("class", "icon icon-size32 unknown-control");
                    this.$propertiesTitle.text(Resources.Designers.NoControlSelected);
                    this.$propertiesTitle.addClass("empty");
                }
                else
                {
                    var controlInfo = this._getControlInfo(strControlType);
                    this.$propertiesIcon.attr("class", "icon icon-size32 " + controlInfo.iconClass);
                    this.$propertiesTitle.text(controlInfo.name);
                    this.$propertiesTitle.removeClass("empty");
                }
            },


            //sets the selected object  - like itemSelect() in the form designer.
            _setSelectedObject: function (object)
            {
                var grid = _viewDesigner.View._getTargetGrid();
                var currentSelected = _viewDesigner.View.selectedObject;
                var currentSelectedExists = checkExists(currentSelected) && (currentSelected.length > 0);
                var newSelectedExists = checkExists(object) && (object.length > 0);
                var isFirstSelection = (!currentSelectedExists && newSelectedExists);
                var isSameAsPreviousSelection = (currentSelectedExists && newSelectedExists && (object[0] === currentSelected[0]));
                var selectedObjectHasNotChanged = isSameAsPreviousSelection && !isFirstSelection;

                if (!selectedObjectHasNotChanged)
                {
                    if (_viewDesigner.View.selectedObject)
                    {
                        _viewDesigner.DragDrop._removeResizing(_viewDesigner.View.selectedObject);
                        _viewDesigner.View.selectedObject.removeClass('selectedobject');
                    }

                    _viewDesigner.View.selectedObject = object;

                    if (object.attr('controlType') !== 'View')
                    {
                        _viewDesigner.View.selectedObject.addClass('selectedobject');
                    }

                    var InfoText = '';
                    if (_viewDesigner.View.selectedObject.is('div'))
                    {
                        if (_viewDesigner.View.selectedObject.hasClass('controlwrapper'))
                        {
                            var ControlName = _viewDesigner._getControlProperty(_viewDesigner.View.selectedObject.attr('id'), 'ControlName');
                            _viewDesigner.View.currentGridObject.refresh(_viewDesigner.View.viewEventsGrid, _viewDesigner.View.viewDefinitionXML, { controlID: _viewDesigner.View.selectedObject.attr('id') });

                            if (_viewDesigner.View.viewEventsGrid.is(":visible")) _viewDesigner.View.viewEventsGrid.grid("synccolumns");
                            if (_viewDesigner.View.viewEventsGrid.grid("fetch", "selected-rows").length === 0)
                                _viewDesigner.View.viewEventsGrid.children(".grid-toolbars").find(".toolbar-button.edit, .toolbar-button.delete").addClass("disabled");

                            if (_viewDesigner.View.element.find('#vdControlTabPropertiesTab').hasClass('selected'))
                            {
                                InfoText = Resources.ViewDesigner.PropertyWindowHeading + ' ' + ControlName;
                            }
                            else
                            {
                                InfoText = Resources.ViewDesigner.TabControlEventsHeader + ' ' + ControlName;
                            }
                            _viewDesigner.DragDrop._makeControlSizable(_viewDesigner.View.selectedObject);
                        }
                        else if (checkExists(_viewDesigner.View.currentGridObject) && checkExists(_viewDesigner.View.viewEventsGrid))
                        {
                            //No specific Control was selected, thus refresh the rule grid for the View
                            _viewDesigner.View.currentGridObject.refresh(_viewDesigner.View.viewEventsGrid, _viewDesigner.View.viewDefinitionXML);
                        }
                        _viewDesigner._makeElementDragable(_viewDesigner.View.selectedObject);
                    }
                    else
                    {
                        _viewDesigner._clearControlPropertyGrid();
                        if (_viewDesigner.View.element.find('#vdControlTabPropertiesTab').hasClass('selected'))
                        {
                            InfoText = Resources.ViewDesigner.TabControlPropertiesHeader;
                        }
                        else
                        {
                            InfoText = Resources.ViewDesigner.TabControlEventsHeader;
                        }

                        _viewDesigner.View.currentGridObject.refresh(_viewDesigner.View.viewEventsGrid, _viewDesigner.View.viewDefinitionXML);
                        if (_viewDesigner.View.viewEventsGrid.is(":visible")) _viewDesigner.View.viewEventsGrid.grid("synccolumns");
                        if (_viewDesigner.View.viewEventsGrid.grid("fetch", "selected-rows").length === 0)
                            _viewDesigner.View.viewEventsGrid.children(".grid-toolbars").find(".toolbar-button.edit, .toolbar-button.delete").addClass("disabled");
                    }

                    if (object.attr('controlType') === 'View' || object.attr('controlType') === 'Cell')
                    {
                        SourceCode.Forms.Designers.Common.checkControlRuleDependencies(_viewDesigner.View.selectedObject.attr('id'), "View");
                    }
                    else
                    {
                        SourceCode.Forms.Designers.Common.checkControlRuleDependencies(_viewDesigner.View.selectedObject.attr('id'), "ViewControl");
                    }

                    //        _viewDesigner.View.element.find('#ControlTabsInfo').text(InfoText);

                    this._triggerControlSelected();
                }
                else
                {
                    return;
                }
            },

            //when a control is selected (onmouse click) - like itemSelected() in the form designer.
            _configSelectedControl: function (object)
            {
                object = $(object);

                if (object.length === 0)
                {
                    return;
                }

                _viewDesigner._setSelectedObject(object);
                var selectedViewObject = _viewDesigner.View.selectedObject[0];


                var common = SourceCode.Forms.Designers.Common;
                var controlType = common.getControlTypeFromControlElement(_viewDesigner.View.selectedObject).toLowerCase();

                //Update the properties Panel Header
                _viewDesigner._initPropertiesHeader();
                _viewDesigner._showControlProperties();

                var nodeLower = object[0].nodeName.toLowerCase();

                if (object.hasClass('controlwrapper') ||
                    (checkExists(selectedViewObject) && controlType === 'view') ||
                    nodeLower === "col")
                {
                    _viewDesigner._propertiesPanel.switchToControlPropertiesTab();
                    _viewDesigner.View.isViewEventsLoaded = false;
                }
                else if (nodeLower === "td" || object.hasClass("editor-cell"))
                {
                    if (_viewDesigner.View.SelectedViewType === "CaptureList")
                    {
                        if (_viewDesigner._isTableCellControl(_viewDesigner.View.selectedObject))
                        {
                            _viewDesigner._propertiesPanel.switchToControlPropertiesTab();
                        }
                        else if (checkExists(_viewDesigner.View.lastSelectedPropertyTab))
                        {
                            _viewDesigner._propertiesPanel.switchToPreviouslySelectedTab();
                        }
                        else
                        {
                            _viewDesigner._propertiesPanel.switchToBodyPropertiesTab();
                        }
                    }
                    else
                    {
                        _viewDesigner._propertiesPanel.switchToControlPropertiesTab();
                    }

                    SourceCode.Forms.Designers.Common.triggerEvent("PropertyTabChanged");
                }
                else
                {
                    _viewDesigner._propertiesPanel.switchToRulesTab();
                }

                if (_viewDesigner.View.element.find('#vdViewEditorFormsTab').hasClass('selected') && _viewDesigner.View.isViewEventsLoading === false)
                {
                    _viewDesigner.View.isViewEventsLoading = true;
                    _viewDesigner._BuildViewXML();
                    setTimeout(function () { _viewDesigner._LoadViewEvents(); }.bind(_viewDesigner), 0);
                }
            },

            _getParentControlWrapper: function (object)
            {
                var wrapper = null;
                if (object.length > 0)
                {
                    if (object.is('div') && object.hasClass('controlwrapper') && object.attr('layout') !== 'ListTable')
                    {
                        wrapper = object;
                    }
                    else
                    {
                        var parentObj = object.parent();
                        if (parentObj.length > 0)
                        {
                            wrapper = _viewDesigner._getParentControlWrapper(parentObj);
                        }
                    }
                }
                return wrapper;
            },

            _doAddViewAction: function (btn)
            {
                if (_viewDesigner.CheckOut._checkViewStatus())
                {
                    var src = $(btn); //_viewDesigner.View.element.find('#toolAddAction');
                    if (src.length > 0)
                    {
                        if (src.hasClass('disabled') === true)
                        {
                            return;
                        }
                        else
                        {
                            if (_viewDesigner.View.wizard.wizard("stepindex") === 3)
                            {
                                _viewDesigner._BuildViewXML();
                            }
                            _viewDesigner.View.isControlEvent = false;

                            SourceCode.Forms.WizardContainer.show('View', 'SourceCode.Forms.Designers.View.viewDefinitionXML');
                        }
                    }
                }
            },

            _doEditViewAction: function (btn)
            {
                if (_viewDesigner.CheckOut._checkViewStatus())
                {
                    var src = $(btn);
                    if (src.length > 0)
                    {
                        if (src.hasClass('disabled') === true)
                        {
                            return;
                        }
                        else
                        {
                            var grid = _viewDesigner.View._getTargetGrid();
                            var ruleIsEnabled = _viewDesigner._isRuleEnabled(grid);

                            if (ruleIsEnabled)
                            {
                                _viewDesigner.View.isControlEvent = false;

                                if (_viewDesigner.View.wizard.wizard("stepindex") === 3)
                                {
                                    _viewDesigner._BuildViewXML();
                                }

                                SourceCode.Forms.WizardContainer.show('View', 'SourceCode.Forms.Designers.View.viewDefinitionXML', {
                                    'ruleGrid': grid
                                });

                                grid.children(".grid-toolbars").find(".toolbar-button.edit, .toolbar-button.delete").addClass("disabled");
                            }
                        }
                    }
                }
            },

            _doRemoveViewAction: function (btn)
            {
                if (_viewDesigner.CheckOut._checkViewStatus())
                {
                    _viewDesigner.View.isControlEvent = false;
                    _viewDesigner._removeViewAction(btn);
                }
            },

            _removeViewAction: function (src)
            {
                src = $(src);

                if (src.length > 0)
                {
                    if (src.hasClass('disabled') === true)
                    {
                        return;
                    }
                    else
                    {
                        _viewDesigner._RemoveSelectedViewAction(src);
                    }
                }
            },

            _RemoveSelectedViewAction: function (src)
            {
                popupManager.closeLast();

                var grid = _viewDesigner.View._getTargetGrid();
                var gridType = SourceCode.Forms.Designers.Common.Rules.getGridType(grid);

                _viewDesigner.View.currentGridObject.removeItem(grid, _viewDesigner.View.viewDefinitionXML, null, function (src)
                {
                    var gridOptions = [];

                    // Hide Enable/Disable Rule Toolbar buttons as none of them will be seleceted.
                    _viewDesigner.View.element.find('#vdToolEnableRule, #vdToolLayoutEnableRule, #vdToolDisableRule, #vdToolLayoutDisableRule, #vdRuleEnabledDivider, #vdRuleLayoutEnabledDivider').addClass("hidden");

                    _viewDesigner.View.currentGridObject.refresh(grid, _viewDesigner.View.viewDefinitionXML, gridOptions);

                    if (gridType === "list")
                    {
                        var _filters = SourceCode.Forms.Designers.Common.Rules.getFilters();

                        _viewDesigner.View._updateFilterMenu(true, _filters);

                        _viewDesigner.View.element.find('#toolEditAction, #toolRemoveAction').removeClass('hidden');
                        _viewDesigner.View.element.find('#toolEditAction, #toolRemoveAction').addClass('disabled');
                        _viewDesigner.View.element.find('#vdToolEnableRule, #vdToolLayoutEnableRule, #vdToolDisableRule, #vdToolLayoutDisableRule, #vdRuleEnabledDivider, #vdRuleLayoutEnabledDivider').addClass("hidden");
                    }
                    else
                    {
                        if (grid.hasClass('selected') && _viewDesigner.View.isViewEventsLoading === false && _viewDesigner.View.wizard.wizard("stepindex") === 3)
                        {
                            _viewDesigner.View.isViewEventsLoading = true;
                            setTimeout(function () { _viewDesigner._LoadViewEvents(); }, 0);

                            if (_viewDesigner.View._findControlFromSelectedObject().hasClass("controlwrapper"))
                            {
                                gridOptions.controlID = _viewDesigner.View._findControlFromSelectedObject().attr("ID");
                            }
                        }

                        if (grid.find("tr.selected").length > 0)
                        {
                            _viewDesigner.View.element.find('#toolEditAction, #toolRemoveAction').removeClass('disabled');
                            grid.find("a.toolbar-button.edit, a.toolbar-button.delete").removeClass("disabled");
                        }
                        else
                        {
                            _viewDesigner.View.element.find('#toolEditAction, #toolRemoveAction').addClass('disabled');
                            grid.find("a.toolbar-button.edit, a.toolbar-button.delete").addClass("disabled");
                        }
                    }

                    _viewDesigner.View._loadConfiguredListMethodForDetailsStep(_viewDesigner._getViewType());
                });
            },

            _doAddControlAction: function (btn)
            {
                if (_viewDesigner.CheckOut._checkViewStatus())
                {
                    var src = $(btn); //_viewDesigner.View.element.find('#vdtoolFormEventsTabAdd');
                    if (src.length > 0)
                    {
                        if (src.hasClass('disabled') === true)
                        {
                            return;
                        }
                        else
                        {
                            _viewDesigner._BuildViewXML();
                            _viewDesigner.View.isControlEvent = true;
                            SourceCode.Forms.WizardContainer.show('Control', 'SourceCode.Forms.Designers.View.viewDefinitionXML');
                        }
                    }
                }
            },

            _doEditControlAction: function (btn)
            {
                if (_viewDesigner.CheckOut._checkViewStatus())
                {
                    var src = $(btn);
                    if (src.length > 0)
                    {
                        var gridOptions = [];
                        var grid = src.closest(".grid");
                        var ruleIsEnabled = _viewDesigner._isRuleEnabled(grid);

                        if (ruleIsEnabled)
                        {
                            _viewDesigner._BuildViewXML();
                            _viewDesigner.View.isControlEvent = true;

                            SourceCode.Forms.WizardContainer.show('Control', 'SourceCode.Forms.Designers.View.viewDefinitionXML', {
                                'ruleGrid': grid
                            });

                        }
                    }
                }
            },

            _doRemoveControlAction: function (btn)
            {
                if (_viewDesigner.CheckOut._checkViewStatus())
                {
                    var src = $(btn);
                    if (src.length > 0)
                    {
                        var grid = src.closest(".grid");

                        _viewDesigner.View.isControlEvent = true;
                        _viewDesigner._removeViewAction(src);
                    }
                }
            },

            _isRuleEnabled: function (grid)
            {
                var grid = _viewDesigner.View._getTargetGrid();
                var ruleID = _viewDesigner.View.currentGridObject.getSelectedID(grid);

                if (checkExists(ruleID) && ruleID !== "")
                {
                    var rule = _viewDesigner.View.viewDefinitionXML.selectSingleNode("//Event[@ID='{0}']".format(ruleID));

                    if (checkExists(rule))
                    {
                        var enabled = rule.getAttribute("IsEnabled");

                        if (!checkExists(enabled) || (checkExists(enabled) && enabled.toLowerCase() === "true"))
                        {
                            return true;
                        }
                        else
                        {
                            return false;
                        }
                    }
                }
            },

            _getViewSelectedControl: function ()
            {
                var retVal = '';
                if (_viewDesigner.View.selectedObject)
                {
                    retVal = _viewDesigner.View.selectedObject.attr('id');
                }
                return retVal;
            },

            _GetViewSOID: function ()
            {
                var ViewPrimarySourceID = '';
                var xmlDoc = _viewDesigner.View.viewDefinitionXML;
                var SourceXPath = '//Views/View/Sources/Source[@ContextType="Primary"]';
                var SourceElem = xmlDoc.selectSingleNode(SourceXPath);

                if (SourceElem)
                {
                    ViewPrimarySourceID = SourceElem.getAttribute('SourceID').toLowerCase();
                }
                else
                {
                    ViewPrimarySourceID = _viewDesigner.View.SelectedSmartObjectGuid;
                }

                return ViewPrimarySourceID;
            },

            _loadSOMethods: function (isLoadNewSo)
            {
                var viewType = _viewDesigner._getViewType();
                var SmartObjectGuid = '';
                var SmartObjectGuid = _viewDesigner.View.element.find("#vdsmartObjectID").val();
                var checkSmo = _viewDesigner.View.viewDefinitionXML.selectSingleNode('SourceCode.Forms/Views/View/Sources/Source[@SourceID="' + SmartObjectGuid + '"][@ContextType="Primary"][contains(@ValidationStatus,"Missing") or contains(@ValidationStatus,"Error")]');

                if (($chk(SmartObjectGuid) === true) && (!checkExists(checkSmo)))
                {
                    if (isLoadNewSo)
                    {
                        if (viewType === 'CaptureList')
                        {
                            _viewDesigner._clearSmartObjectListMethods();
                            _viewDesigner.AJAXCall._getSmartObjectPropertiesAndMethods(SmartObjectGuid, true);
                        }
                        else if (viewType === 'Capture')
                        {
                            _viewDesigner.AJAXCall._getSmartObjectPropertiesAndMethods(SmartObjectGuid, false);
                        }
                    }
                }
            },

            _clearSmartObjectListMethods: function ()
            {
                _viewDesigner.View.ddlistmethod.empty();
                _viewDesigner.View.ddlistmethod.dropdown('refresh');
            },

            //loads the canvas.
            _populateView: function ()
            {
                var xmlDoc = _viewDesigner.View.viewDefinitionXML;
                var ViewXPath = '//Views/View';
                var ViewElem = xmlDoc.selectSingleNode(ViewXPath);
                var ViewType = ViewElem.getAttribute('Type');

                _viewDesigner.View.SelectedSmartObjectGuid = _viewDesigner._GetViewSOID();

                if ($chk(_viewDesigner.View.SelectedSmartObjectGuid) === true)
                {
                    switch (ViewType)
                    {
                        case 'List':
                        case 'CaptureList':
                            _viewDesigner._initEditViewCanvasStep(_viewDesigner.View.SelectedSmartObjectGuid, "List");
                            break;
                        case 'Capture':
                            _viewDesigner._initEditViewCanvasStep(_viewDesigner.View.SelectedSmartObjectGuid, "");
                            break;
                    }

                }
                else
                {
                    _viewDesigner._BuildView();
                }
            },

            _initEditViewCanvasStep: function (soGuid, isListing)
            {
                /*Only call functions that use the smartobject if the smartobject exists*/
                var checkSmo = _viewDesigner.View.viewDefinitionXML.selectSingleNode('SourceCode.Forms/Views/View/Sources/Source[@SourceID="' + soGuid + '"][@ContextType="Primary"][contains(@ValidationStatus,"Missing")]');
                if (!checkExists(checkSmo))
                {
                    _viewDesigner.AJAXCall._getSmartObjectPropertiesAndMethods(soGuid, isListing);
                }
                else
                {
                    _viewDesigner.View.element.find("#vdFieldsList").append('<div id="PropParent" class="dataitemcontainer" allows="property" soguid="' + soGuid + '"></div>');
                    _viewDesigner.View.element.find("#vdMethodsList").append('<div id="MethodParent" style="display:none;"></div>');
                    _viewDesigner.View.element.find("#vdToolboxList").append('<div id="ToolboxParent" style="display:none;"></div>');
                    _viewDesigner.View.element.find("#vdLayoutList").append('<div id="LayoutParent" style="display:none;"></div>');

                    var viewID = _viewDesigner._GetViewID();
                    var methodValue = _viewDesigner._getControlProperty(viewID, 'DefaultMethod');
                    var item = {
                        index: 0,
                        text: methodValue,
                        value: methodValue,
                        className: "",
                        selected: true,
                        disabled: ""
                    };

                    var items = [item];

                    _viewDesigner.View.ddlistmethod.dropdown({ items: items });
                }


                if (_viewDesigner.View.SelectedViewType === "CaptureList")
                {
                    if (!$.isPlainObject(_viewDesigner.listMethods))
                    {
                        _viewDesigner.listMethods = {};
                    }
                }

                _viewDesigner._doViewCanvasInit();

                /* Below check might cause problems, especially because it stops the call of the _doViewCanvasInit function*/
                if (!checkExists(checkSmo))
                {
                    _viewDesigner.View.isSmartObjectLoaded = true;
                }
                else
                {
                    _viewDesigner.View.isSmartObjectLoaded = false;
                }

                //Build the view canvas
                _viewDesigner._BuildView();
                _viewDesigner.View.element.find('#ControlTabsContent').removeOverlay();
            },

            _BuildView: function ()
            {
                var xmlDoc = _viewDesigner.View.viewDefinitionXML;
                var ViewXPath = 'SourceCode.Forms/Views/View';
                var ViewElem = xmlDoc.selectSingleNode(ViewXPath);

                if (ViewElem.childNodes.length > 0)
                {
                    var viewDisplayName = ViewElem.selectSingleNode('DisplayName').text;
                    var viewSystemName = ViewElem.selectSingleNode('Name').text;
                    _viewDesigner.View.element.find('#vdtxtViewName').val(viewDisplayName);
                    _viewDesigner.View.OriginalViewDisplayName = viewDisplayName;
                    _viewDesigner.View.element.find('#vdViewSystemName').val(viewSystemName);
                    _viewDesigner.View.OriginalViewName = viewSystemName;

                    if (checkExists(ViewElem.selectSingleNode('Description')))
                    {
                        _viewDesigner.View.element.find('#vdtxtViewDescription').val(ViewElem.selectSingleNode('Description').text);
                    }

                    _viewDesigner.View.wizard.wizard("option", "contextobjectname", _viewDesigner.View.element.find("#vdtxtViewName").val());

                    var CanvasElem = ViewElem.selectSingleNode('Canvas');
                    var ControlsElem = ViewElem.selectSingleNode('Controls');

                    //configure canvas
                    if ($chk(CanvasElem) === true)
                    {
                        //wizard.showStep(2);
                        //make sure the main table in a section is not draggable
                        var toolbartable = $(_viewDesigner.View.element.find('#toolbarSection').attr('firstchild'));
                        var bodytable = $(_viewDesigner.View.element.find('#bodySection').attr('firstchild'));

                        toolbartable.removeClass('draggable');
                        bodytable.removeClass('draggable');
                    }
                    else
                    {
                        wizard.showStep(0);
                    }

                }

                modalizer.hide();
            },

            _BuildCanvasControls: function (ControlsElem)
            {
                var tempDoc = parseXML('<root/>');
                var ControlElems = ControlsElem.selectNodes('Control');
                var ViewElem = ControlsElem.parentNode;
                var EventsElem = ViewElem.selectSingleNode('Events');
                if ($chk(EventsElem) === false)
                {
                    EventsElem = tempDoc.createElement('Events');
                    ViewElem.appendChild(EventsElem);
                }

                if ($chk(ControlElems) === true)
                {
                    var ControlCount = ControlElems.length;
                    for (var cei = 0; cei < ControlCount; cei++)
                    {
                        var ControlElem = ControlElems[cei];

                        var PropertiesElem = ControlElem.selectSingleNode('Properties');
                        var StyleElem = ControlElem.selectSingleNode('Style');
                        var isReadOnly = $chk(PropertiesElem) !== false ? PropertiesElem.selectSingleNode('Property[Name="ReadOnly"]') : null;
                        var data;
                        var SOID = '';
                        var FieldSOPropId = '';
                        var MethodId = '';
                        var ItemType = '';
                        var custom = '';
                        var friendlyname = '';
                        var references = '';
                        var propertytype = '';
                        var flag = '';
                        var ControlType = ControlElem.getAttribute('Type');
                        var ControlId = ControlElem.getAttribute('ID');
                        var FieldId = ControlElem.getAttribute('FieldID');
                        var ExpressionId = ControlElem.getAttribute('ExpressionID');

                        if (ControlType === "View" || ControlType === "Row" || ControlType === "Column" || ControlType === "Section")
                        {
                            continue;
                        }

                        //Build control property xml
                        _viewDesigner._BuildControlPropertiesXML(ControlId, PropertiesElem);

                        if ($chk(FieldId) === true)
                        {
                            var FieldElem = ViewElem.selectSingleNode('Sources/Source/Fields/Field[@ID="' + FieldId + '"]');
                            if ($chk(FieldElem) === true)
                            {
                                var SourceElem = FieldElem.parentNode.parentNode;
                                if (SourceElem.getAttribute('ContextType') === 'Primary')
                                {
                                    SOID = SourceElem.getAttribute('SourceID').toLowerCase();
                                    FieldSOPropId = FieldElem.selectSingleNode('FieldName').text;
                                    var PropertyItem = _viewDesigner.View.element.find('#property_' + FieldSOPropId);
                                    if ($chk(PropertyItem) === true)
                                    {
                                        custom = PropertyItem.attr('custom');
                                        friendlyname = PropertyItem.attr('friendlyname');
                                        references = PropertyItem.attr('references');
                                        propertytype = PropertyItem.attr('propertytype');
                                    }
                                }
                            }
                        }
                        else
                        {
                            //check if it had an execute action
                            if ($chk(EventsElem) === true)
                            {
                                var EventElems = EventsElem.selectNodes('//Event[@SourceID="' + ControlId + '"]');

                                for (var evi = EventElems.length - 1; evi >= 0; evi--)
                                {
                                    var EventElem = EventElems[evi];
                                    var ListenersElem = EventElem.selectSingleNode('Handlers/Handler/Actions');
                                    if ($chk(ListenersElem) === true)
                                    {
                                        var ListenerElems = ListenersElem.selectNodes('Action');
                                        var listenerCount = ListenerElems.length - 1;
                                        for (var li = listenerCount; li >= 0; li--)
                                        {
                                            var ListenerElem = ListenerElems[li];
                                            if (ListenerElem.getAttribute('Type') === 'Execute')
                                            {
                                                SOID = _viewDesigner._GetViewSOID();
                                                var listenerSOID = ListenerElem.selectSingleNode("Properties/Property[Name='ObjectID']/Value");

                                                if (!$chk(listenerSOID))
                                                {
                                                    var methodElement = ListenerElem.selectSingleNode("Properties/Property[Name='Method']/Value");

                                                    if (checkExists(methodElement))
                                                    {
                                                        MethodId = methodElement.text;
                                                        var MethodItem = _viewDesigner.View.element.find('#method_' + MethodId);
                                                        if ($chk(MethodItem) === true)
                                                        {
                                                            custom = MethodItem.attr('custom');
                                                            friendlyname = MethodItem.attr('friendlyname');
                                                        }

                                                        // Configure options step
                                                        var standardMethodChkBox = _viewDesigner.View.element.find('#MethodButtonsTable').find('input.autogen-method-standard').filter('[value="' + MethodId + '"]');
                                                        if (standardMethodChkBox.length > 0)
                                                        {
                                                            _viewDesigner.View.AutoGenerateMethodsList.push(standardMethodChkBox.val());
                                                        }
                                                    }
                                                }
                                            }
                                            if (_viewDesigner._getViewType() === 'CaptureList')
                                            {
                                                if (ListenerElem.getAttribute('Type') === 'List')
                                                {
                                                    switch (ListenerElem.getAttribute('Method'))
                                                    {
                                                        case 'AddItem':
                                                            flag = 'auto-capturelist-add';
                                                            break;
                                                        case 'EditItem':
                                                            flag = 'auto-capturelist-edit';
                                                            break;
                                                        case 'RemoveItem':
                                                            flag = 'auto-capturelist-delete';
                                                            break;
                                                    }
                                                }
                                            }
                                            //break;
                                        }
                                    }
                                }
                            }
                        }

                        var propertyElem = "";
                        var hasValidationError = false;
                        if ((checkExistsNotEmpty(FieldId)) && (FieldSOPropId === ''))
                        {
                            propertyElem = PropertiesElem.selectSingleNode("Property[Name='Field']");
                            hasValidationError = SourceCode.Forms.DependencyHelper.hasValidationStatusError(propertyElem);
                        }

                        if (FieldSOPropId !== '')
                        {
                            data = {
                                itemtype: 'property',
                                id: ControlId,
                                custom: custom,
                                references: references,
                                propertytype: propertytype,
                                propertyid: FieldSOPropId,
                                friendlyname: friendlyname,
                                soid: SOID,
                                controltype: ControlType,
                                expression: ExpressionId,
                                flag: flag
                            };
                        }
                        else if ((checkExistsNotEmpty(FieldId)) && (hasValidationError))
                        {
                            var propertyID = _viewDesigner._getControlPropertyDisplayValue(ControlId, 'Field');
                            var propertyType = _viewDesigner._getControlProperty(ControlId, 'DataType');
                            data = {
                                itemtype: 'property',
                                id: ControlId,
                                propertytype: propertyType.toLowerCase(),
                                propertyid: propertyID,
                                friendlyname: propertyID,
                                controltype: ControlType,
                                expression: ExpressionId,
                                flag: flag
                            };
                        }
                        else if (MethodId !== '')
                        {
                            data = {
                                itemtype: 'method',
                                id: ControlId,
                                custom: custom,
                                methodid: MethodId,
                                friendlyname: friendlyname,
                                soid: SOID,
                                controltype: ControlType,
                                expression: ExpressionId,
                                flag: flag
                            };
                        }
                        else if (ControlType === "Cell")
                        {
                            data = {
                                itemtype: 'Cell',
                                id: ControlId,
                                friendlyname: friendlyname,
                                controltype: ControlType,
                                expression: ExpressionId,
                                flag: flag
                            };
                        }
                        else if (ControlType === "Column")
                        {
                            data = {
                                itemtype: 'Column',
                                id: ControlId,
                                friendlyname: friendlyname,
                                controltype: ControlType,
                                expression: ExpressionId,
                                flag: flag
                            };
                        }
                        else if (ControlType === "Table")
                        {
                            data = {
                                itemtype: 'layoutcontainer',
                                id: ControlId,
                                friendlyname: friendlyname,
                                controltype: ControlType,
                                expression: ExpressionId,
                                flag: flag
                            };
                        }
                        else
                        {
                            data = {
                                itemtype: 'control',
                                id: ControlId,
                                friendlyname: friendlyname,
                                controltype: ControlType,
                                expression: ExpressionId,
                                flag: flag
                            };
                        }

                        if (flag !== '')
                        {
                            data.itemtype = 'toolbarcontrol';
                        }

                        //set control attributes
                        _viewDesigner._setControlAttributes(data);

                        if (data.controltype === "DropDown")
                        {
                            _viewDesigner._isPreload(data.id);
                        }

                        var controlWrapper = _viewDesigner.View.element.find("#" + ControlId);

                        //Apply control height. To be revisited post-RTM
                        var height = _viewDesigner.View.viewDefinitionXML.selectSingleNode("//Views/View/Controls/Control[@ID='{0}']/Properties/Property[Name='Height']/Value".format(ControlId));
                        if ($chk(height))
                        {
                            height = height.text;

                            var setFunction = _viewDesigner._getPropertySetFunction(controlWrapper.attr("controltype"), "Height");
                            if (checkExists(setFunction))
                            {
                                var fSetFunction = eval(setFunction);
                                if ($chk(fSetFunction) && typeof (fSetFunction) === typeof (Function))
                                {
                                    fSetFunction.apply(null, [controlWrapper, height]);
                                }
                            }
                        }

                        //Apply control styles
                        var styles = _viewDesigner.View.viewDefinitionXML.selectSingleNode("//Views/View/Controls/Control[@ID='{0}']/Styles".format(ControlId));
                        if ($chk(styles))
                        {
                            var setFunction = _viewDesigner._getPropertySetFunction(controlWrapper.attr("controltype"), "Styles");
                            if (setFunction !== null)
                            {
                                var fSetFunction = eval(setFunction);
                                if ($chk(fSetFunction) && typeof (fSetFunction) === typeof (Function))
                                {
                                    fSetFunction.apply(null, [controlWrapper, styles]);
                                }
                            }
                        }

                        //Apply flex-basis for IE11
                        ControlUtil.setElementFlexBasisAsWidthForIE11(controlWrapper);
                    }
                }

                if (_viewDesigner.View.SelectedViewType === 'CaptureList')
                {
                    _viewDesigner.DesignerTable._rebuildEditableListLayout();
                }

                //Remove the cell width of the editor tables if any, the width of cell should be determined by the table's <col> elements
                _viewDesigner.DesignerTable._removeEditorTableCellWidth();
            },

            _setControlAttributes: function (data)
            {
                var ControlWrapper = _viewDesigner.View.element.find('#' + data.id);
                if ($chk(ControlWrapper) === true)
                {
                    var ControlWrapperResizer = ControlWrapper.children('.resizewrapper');
                    var section = _viewDesigner._getSection(ControlWrapper);

                    data.section = section.attr('id');

                    ControlWrapper.attr('itemtype', data.itemtype);
                    ControlWrapper.attr('controltype', data.controltype);
                    ControlWrapper.attr('friendlyname', data.friendlyname);

                    if (ControlWrapper.parent().is("td.header.editor-cell")
                        && ($chk(ControlWrapper.attr("itemType")) && ControlWrapper.attr("itemType") === "property"))
                    {
                        ControlWrapper.addClass("propertyControl");
                    }

                    if (_viewDesigner._getViewType() === "CaptureList" && _viewDesigner._isEditableCaptureList())
                    {
                        if (ControlWrapper.attr("controltype") === "ToolBarButton")
                        {
                            var saveButtonEventHandler = _viewDesigner.View.viewDefinitionXML.selectSingleNode("//Views/View/Events/Event[@SourceID='{0}'][Name='OnClick']/Handlers/Handler/Actions/Action[@ItemState='Added' or @ItemState='Changed' or @ItemState='Removed']".format(data.id));
                            if (checkExists(saveButtonEventHandler))
                            {
                                ControlWrapper.attr("flag", "auto-capturelist-save");
                            }
                            else
                            {
                                var eventXPath = "//Views/View/Events/Event[@SourceID='{0}']/Handlers/Handler/Actions/Action/Properties/Property[Name='Method']".format(data.id);

                                // is it an add event
                                var event = _viewDesigner.View.viewDefinitionXML.selectSingleNode(eventXPath);

                                // check is for safari, as it throws an exception if trying to access an undefined value
                                if (checkExists(event))
                                {
                                    var value = event.selectSingleNode("Value");

                                    if (checkExists(value) && $chk(value.text))
                                    {
                                        if (value.text === "AddItem")
                                        {
                                            ControlWrapper.attr("flag", "auto-capturelist-add");
                                        }
                                        else if (value.text === "EditItem")
                                        {
                                            ControlWrapper.attr("flag", "auto-capturelist-edit");
                                        }
                                        else if (value.text === "RemoveItem")
                                        {
                                            ControlWrapper.attr("flag", "auto-capturelist-delete");
                                        }
                                        else if (value.text === "ListRefresh")
                                        {
                                            ControlWrapper.attr("flag", "auto-capturelist-refreshlist");
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (data.controltype !== 'Cell' && data.controltype !== 'Row' && data.controltype !== 'Column')
                    {

                        ControlWrapper.addClass('controlwrapper');
                        ControlWrapper.addClass('draggable');
                    }

                    if ($chk(ControlWrapper.attr('layouttype')) === false)
                    {
                        ControlWrapper.attr('layouttype', 'control');
                    }

                    if ($chk(data.expression) === true)
                    {
                        ControlWrapper.attr('ExpressionID', data.expression);
                    }

                    if (ControlWrapper.attr('layouttype') === 'control')
                    {
                        switch (data.itemtype)
                        {
                            case 'control':
                                ControlWrapper.attr('name', data.controltype);
                                ControlWrapper.attr('itemtype', data.itemtype);
                                break;
                            case 'method':
                                ControlWrapper.attr('custom', data.custom);
                                ControlWrapper.attr('soid', data.soid);
                                ControlWrapper.attr('methodid', data.methodid);
                                break;
                            case 'property':
                                ControlWrapper.attr('custom', data.custom);
                                ControlWrapper.attr('references', data.references);
                                ControlWrapper.attr('propertytype', data.propertytype);
                                ControlWrapper.attr('propertyid', data.propertyid);
                                ControlWrapper.attr('soid', data.soid);
                                break;
                            case 'toolbarcontrol':
                                ControlWrapper.attr('name', data.controltype);
                                ControlWrapper.attr('itemtype', data.itemtype);
                                if (data.flag !== '')
                                {
                                    ControlWrapper.attr('flag', data.flag);
                                }
                                break;
                            default:
                                ControlWrapper.attr('layout', data.controltype);
                                ControlWrapper.attr('layouttype', 'layoutcontainer');
                        }
                    }
                    else if (data.controltype === 'Cell')
                    {
                        ControlWrapper.attr('layout', data.controltype);
                        ControlWrapper.attr('layouttype', 'cell');
                        ControlWrapper.addClass("droptarget");
                    }
                    else if (data.controltype === 'Column')
                    {
                        ControlWrapper.attr('layout', data.controltype);
                        ControlWrapper.attr('layouttype', data.controltype.toLowerCase());
                        ControlWrapper.addClass("droptarget");
                    }
                    else
                    {
                        ControlWrapper.attr('layout', data.controltype);
                        ControlWrapper.attr('layouttype', 'layoutcontainer');
                        //ControlWrapper.removeClass('controlwrapper');

                        if (ControlWrapper.parent().attr("id") === "bodySection" || ControlWrapper.parent().attr("id") === "toolbarSection")
                        {
                            ControlWrapper.removeClass("draggable");
                        }
                        else if (!ControlWrapper.hasClass("draggable"))
                        {
                            ControlWrapper.addClass("draggable");
                        }

                        if (data.section === 'toolbarSection')
                        {
                            var tables = ControlWrapper.find('table');
                            for (var j = 0; j < tables.length; j++)
                            {
                                var table = $(tables[j]);
                                table.addClass('editor-table');
                                table.addClass('toolbar');
                            }
                        }
                        else if (data.section === "bodySection")
                        {
                            var tables = ControlWrapper.find('table');
                            for (var j = 0; j < tables.length; j++)
                            {
                                var table = $(tables[j]);
                                table.css("table-layout", "fixed");
                            }
                        }
                    }

                    if (ControlWrapper.attr('layouttype') === 'control')
                    {
                        var resizeWrapper = ControlWrapper.children('.resizewrapper');
                        _viewDesigner.DragDrop._EnsureControlOverlay(resizeWrapper);
                        if (resizeWrapper.height() === 0)
                        {
                            var internals = resizeWrapper.children(":not(.controloverlay)");
                            resizeWrapper.height(internals.height());
                        }

                        _viewDesigner._makeElementDragable(ControlWrapper);

                        if (data.section === 'toolbarSection')
                        {
                            ControlWrapper.addClass('inline');
                            _viewDesigner.DragDrop._addToolbarDroppables(ControlWrapper);
                        }
                    }

                    if (ControlWrapper.parent().attr("id") === "bodySection")
                    {
                        ControlWrapper.css("width", "");
                    }
                }
            },

            _BuildControlPropertiesXML: function (ControlId, PropertiesElem)
            {
                if ($chk(PropertiesElem) === false) return;

                var xmlPropertiesDoc = _viewDesigner.View.controlPropertiesXML;
                if ($chk(xmlPropertiesDoc) === true)
                {
                    var xPath = 'Control[@ID="' + ControlId + '"]';
                    var PropertiesRootElem = xmlPropertiesDoc;

                    var ControlElem = xmlPropertiesDoc.selectSingleNode(xPath);
                    if ($chk(ControlElem) === false)
                    {
                        ControlElem = _viewDesigner.View.viewDefinitionXML.createElement('Control');
                        ControlElem.setAttribute('ID', ControlId);
                        PropertiesRootElem.appendChild(ControlElem);
                    }

                    var _smartObjectPropertyNode = PropertiesElem.selectSingleNode('Property[Name="AssociationSO"]');

                    if (!_smartObjectPropertyNode)
                        _smartObjectPropertyNode = PropertiesElem.selectSingleNode('Property[Name="DisplaySO"]');

                    var _smartObjectId;

                    if (!!_smartObjectPropertyNode)
                    {
                        _smartObjectId = _smartObjectPropertyNode.selectSingleNode('Value').text;

                        if (!SourceCode.Forms.DependencyHelper.IsDependencyAnalyzerEnabled())
                        {
                            _viewDesigner._removeBindingToNonExistDataSource(_smartObjectId, PropertiesElem);
                        }
                    }

                    var soAjaxData = null;
                    var soAjaxCalled = false;
                    var propCount = PropertiesElem.childNodes.length - 1;
                    for (var i = propCount; i >= 0; i--)
                    {
                        var key = '';
                        var value = '';
                        var display = "";
                        var nameValue = "";

                        property = PropertiesElem.childNodes[i];
                        var keyElem = property.selectSingleNode('Name');
                        if ($chk(keyElem) === true)
                        {
                            key = keyElem.text;
                        }

                        var lowerCaseKey = key.toLocaleLowerCase();

                        var valueElem = property.selectSingleNode('Value');
                        if ($chk(valueElem) === true)
                        {
                            value = valueElem.text;
                        }

                        var nameValueElem = property.selectSingleNode('NameValue');
                        nameValue = value;
                        if ($chk(nameValueElem) === true)
                        {
                            nameValue = nameValueElem.firstChild.data;
                        }
                        //TODO: Investigate if it is necessary to add NameValue node if it does not exist (to match pattern in _setControlPropertiesXML)

                        var displayElem = property.selectSingleNode('DisplayValue');
                        display = value;
                        if ($chk(displayElem) === true)
                        {
                            display = displayElem.firstChild.data;
                        }
                        else
                        {
                            // *** workaround to show SO name instead of guid in property grid //
                            if (lowerCaseKey === 'associationso' || lowerCaseKey === 'displayso')
                            {
                                var sodata = _viewDesigner._GetAssociationSmartObjectDetails(value);
                                if (sodata)
                                {
                                    display = sodata.friendlyname;
                                }
                                else
                                {
                                    if (!(soAjaxCalled))
                                    {
                                        soAjaxData = _viewDesigner.AJAXCall._getSOPropertiesBasic(value, false);
                                        soAjaxCalled = true;
                                    }

                                    var sodata = soAjaxData;
                                    if (sodata && !SourceCode.Forms.ExceptionHandler.isException(sodata))
                                    {
                                        var soXml = parseXML(parseXML(sodata).selectSingleNode("root/soxml").text);

                                        if (soXml)
                                        {
                                            var soNameNode = soXml.selectSingleNode("smartobject/smartobjectroot/metadata/display/displayname");

                                            if (soNameNode)
                                            {
                                                display = soNameNode.text;
                                            }
                                        }
                                    }
                                }
                            }

                            if (lowerCaseKey === 'associationmethod')
                            {
                                var methodFriendlyName = _viewDesigner._getSmartObjectMethodDisplayName(_smartObjectId, "list", value);
                                if (checkExists(methodFriendlyName))
                                {
                                    display = methodFriendlyName;
                                }
                                else
                                {
                                    if (!(soAjaxCalled))
                                    {
                                        soAjaxData = _viewDesigner.AJAXCall._getSOPropertiesBasic(_smartObjectId, false);
                                        soAjaxCalled = true;
                                    }

                                    var sodata = soAjaxData;

                                    if (sodata && !SourceCode.Forms.ExceptionHandler.isException(sodata))
                                    {
                                        var soXml = parseXML(parseXML(sodata).selectSingleNode("root/soxml").text);

                                        if (soXml)
                                        {
                                            var methodNameNode = soXml.selectSingleNode("smartobject/smartobjectroot/methods/method[@name='" + value + "']/metadata/display/displayname");

                                            if (methodNameNode)
                                            {
                                                display = methodNameNode.text;
                                            }
                                        }
                                    }
                                }
                            }

                            if (lowerCaseKey === 'source')
                            {
                                var sodata = SourceCode.Forms.Designers.Common.getFormsImageName(value);
                                if (sodata)
                                {
                                    display = sodata;
                                }
                            }

                            if (lowerCaseKey === 'rootso')
                            {
                                var rootSOGuid = parseXML(value).selectSingleNode('Root/SmartObject').getAttribute('Guid');
                                var sodata = _viewDesigner.AJAXCall._getSOPropertiesBasic(rootSOGuid, false);
                                var soXML = parseXML(sodata).selectSingleNode('root/soxml');

                                if ($chk(soXML))
                                {
                                    var soName = parseXML(soXML.text).selectSingleNode('smartobject/smartobjectroot').getAttribute('name');
                                    if (sodata)
                                    {
                                        display = soName;
                                    }
                                }
                            }

                            if (lowerCaseKey === 'displaytemplate')
                            {
                                var _propertiesNode, _propertyNode;

                                if (!!_smartObjectId)
                                {
                                    _propertiesNode = SourceCode.Forms.Designers.View.hiddenAssociationXml.documentElement.selectSingleNode('smartobjectroot[@guid="' + _smartObjectId + '"]/properties');
                                }
                                else
                                {
                                    _propertiesNode = null;
                                }

                                var _itemNodes = tryParseXML(value).selectNodes('Template/Item');
                                var _itemNodesCount = _itemNodes.length;

                                if (!_itemNodesCount)
                                {
                                    if (!_propertiesNode)
                                        display = ''; //Static data
                                    else
                                    {
                                        var _displayNameNode = _propertiesNode.selectSingleNode('property[@name="' + display + '"]/metadata/display/displayname');

                                        if (!!_displayNameNode)
                                            display = '[' + _displayNameNode.text + ']';
                                    }
                                }
                                else
                                {
                                    display = '';

                                    for (var j = 0; j < _itemNodesCount; j++)
                                    {
                                        var _itemNode = _itemNodes[j];
                                        var _data, _datatype;

                                        if (_itemNode.getAttribute('SourceType') === 'Value')
                                        {
                                            _data = _itemNode.text;

                                            display = display.concat(_data === '&nbsp;' ? ' ' : _data);
                                        }
                                        else
                                        {
                                            _data = _itemNode.getAttribute('SourceID');
                                            _datatype = _itemNode.getAttribute('DataType');

                                            if (!!_propertiesNode)
                                            {
                                                _propertyNode = _propertiesNode.selectSingleNode('property[@name="' + _data + '"]');
                                            }
                                            else
                                            {
                                                _propertyNode = null;
                                            }

                                            if (checkExists(_propertyNode))
                                            {
                                                var _displayName = _propertyNode.selectSingleNode('metadata/display/displayname');
                                                var _smoDatatype = _propertyNode.getAttribute('type');
                                                var _smoDataName = _propertyNode.getAttribute('name');

                                                if ((!!_smoDatatype) && (_data === _smoDataName) && (_datatype.toUpperCase() !== _smoDatatype.toUpperCase()))
                                                {
                                                    var valueXml = tryParseXML(value);
                                                    if (checkExists(valueXml))
                                                    {
                                                        var valueItemElement = valueXml.selectSingleNode('Template/Item[@SourceID="' + _data + '"]');
                                                        if (checkExists(valueItemElement))
                                                        {
                                                            valueItemElement.setAttribute("DataType", _smoDatatype);
                                                            value = valueXml.xml;
                                                        }
                                                    }
                                                }

                                            }

                                            if (!!_displayName)
                                            {
                                                _data = _displayName.text;
                                            }
                                            display = display + '[' + _data + ']';
                                        }
                                    }
                                }
                            }

                            if (lowerCaseKey === 'filterproperty')
                            {
                                var filterPropXml = tryParseXML(value);
                                if (checkExists(filterPropXml))
                                {
                                    var allSelected = filterPropXml.documentElement.getAttribute("AllSelected");
                                    allSelected = checkExistsNotEmpty(allSelected) && allSelected.toLowerCase() === "true";

                                    display = '';
                                    if (allSelected)
                                    {
                                        display = Resources.CommonLabels.PropertyDisplayTextAll;
                                    }
                                    else
                                    {
                                        var _itemNodes = filterPropXml.selectNodes('FilterProps/Item');
                                        var _propertiesNode;
                                        if (!!_smartObjectId)
                                        {
                                            _propertiesNode = SourceCode.Forms.Designers.View.hiddenAssociationXml.documentElement.selectSingleNode('smartobjectroot[@guid="' + _smartObjectId + '"]/properties');
                                        }

                                        if (checkExists(_propertiesNode) && checkExists(_itemNodes))
                                        {
                                            var _itemNodesCount = _itemNodes.length;
                                            if (_propertiesNode.childNodes.length === _itemNodesCount)
                                            {
                                                display = Resources.CommonLabels.PropertyDisplayTextAll;
                                            }
                                            else
                                            {
                                                for (var j = 0; j < _itemNodesCount; j++)
                                                {
                                                    var _itemNode = _itemNodes[j];
                                                    var _data;

                                                    _data = _itemNode.getAttribute('Id');

                                                    var _propertyNode = _propertiesNode.selectSingleNode('property[@name="' + _data + '"]');

                                                    if (checkExists(_propertyNode))
                                                    {
                                                        var _displayName = _propertyNode.selectSingleNode('metadata/display/displayname');

                                                        if (!!_displayName)
                                                            _data = _displayName.text;
                                                    }

                                                    display = display.concat(_data, '; ');
                                                }
                                            }
                                        }
                                    }
                                }
                            }

                            if (lowerCaseKey === 'parentcontrol')
                            {
                                var controlElement = SourceCode.Forms.Designers.Common.Context._getDefinitionNode().selectSingleNode('Controls/Control[@ID="{0}"]/Properties/Property[Name/text()="ControlName"]/DisplayValue'.format(value));
                                if ($chk(controlElement))
                                {
                                    display = controlElement.text;
                                }
                            }

                            if (lowerCaseKey === 'fixedlistitems')
                            {
                                if (!!value)
                                {
                                    var _items = [];

                                    try
                                    {
                                        var options = JSON.parse(value);

                                        for (var z = 0; z < options.length; z++)
                                        {
                                            _items.push(options[z].display);
                                        }
                                    }
                                    catch (e) // legacy support for SF 1.0.0 - 1.0.7
                                    {
                                        var _itemsXml = parseXML(value);
                                        var _itemNodes = _itemsXml.documentElement.selectNodes('Item');

                                        $.each(_itemNodes, function ()
                                        {
                                            _items.push(this.firstChild.data);
                                        });
                                    }

                                    display = _items.join('; ');
                                }
                            }

                            if (lowerCaseKey === 'controlexpression')
                            {
                                display = _viewDesigner.Conditions._getExpressionName(value);
                            }
                            if (lowerCaseKey === 'validationpattern')
                            {
                                if (checkExists(_viewDesigner.View.validationPatternsCache))
                                {
                                    var patternDisplay = _viewDesigner.View.validationPatternsCache.selectSingleNode("ValidationPatterns/ValidationPattern[@ID='" + value + "']/Name");
                                }

                                if (!checkExists(patternDisplay))
                                {
                                    var response = SourceCode.Forms.Designers.getValidationPatterns();
                                    if (checkExists(response) && response !== '')
                                    {
                                        var xmlResponse = parseXML(response);
                                        _viewDesigner.View.validationPatternsCache = xmlResponse;
                                        var patternDisplay = _viewDesigner.View.validationPatternsCache.selectSingleNode("ValidationPatterns/ValidationPattern[@ID='" + value + "']/Name");
                                    }
                                }

                                if (checkExists(patternDisplay))
                                {
                                    display = patternDisplay.text;
                                }
                            }
                            if (lowerCaseKey === 'valueproperty' || lowerCaseKey === 'defaultsoproperty')
                            {
                                if (checkExists(SourceCode.Forms.Designers.View.hiddenAssociationXml))
                                {
                                    var assocXMLDoc = SourceCode.Forms.Designers.View.hiddenAssociationXml;
                                    if ((checkExists(_smartObjectId)) && (checkExists(value)))
                                    {
                                        var xPropertyPath = 'associations/smartobjectroot[@guid="' + _smartObjectId + '"]/properties/property[@name="' + value + '"]';
                                        var propertyElem = assocXMLDoc.selectSingleNode(xPropertyPath);
                                        if (checkExists(propertyElem))
                                        {
                                            var displayNameElem = propertyElem.selectSingleNode("metadata/display/displayname");
                                            if (checkExists(displayNameElem))
                                            {
                                                display = displayNameElem.text;
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        if (lowerCaseKey === 'field')
                        {
                            if (!checkExistsNotGuid(display))
                            {
                                display = SourceCode.Forms.DependencyHelper.getFieldNameForControl(_viewDesigner.View.viewDefinitionXML, ControlId, value, true);
                            }

                            if (!checkExistsNotGuid(nameValue))
                            {
                                nameValue = SourceCode.Forms.DependencyHelper.getFieldNameForControl(_viewDesigner.View.viewDefinitionXML, ControlId, value, false);
                            }
                        }

                        var propertiesElem = ControlElem.selectSingleNode('Properties');
                        if ($chk(propertiesElem) === false)
                        {
                            propertiesElem = _viewDesigner.View.viewDefinitionXML.createElement('Properties');
                            ControlElem.appendChild(propertiesElem);
                        }

                        var PropElem = ControlElem.selectSingleNode('Properties/Property[Name="' + key + '"]');
                        if ($chk(PropElem) === false)
                        {
                            PropElem = _viewDesigner.View.viewDefinitionXML.createElement('Property');
                            var NameElem = _viewDesigner.View.viewDefinitionXML.createElement('Name');
                            NameElem.appendChild(_viewDesigner.View.viewDefinitionXML.createTextNode(key));
                            PropElem.appendChild(NameElem);
                            propertiesElem.appendChild(PropElem);
                        }

                        var DesigntimeElem = PropElem.selectSingleNode('Value');
                        if ($chk(DesigntimeElem) === false)
                        {
                            DesigntimeElem = _viewDesigner.View.viewDefinitionXML.createElement('Value');
                            PropElem.appendChild(DesigntimeElem);
                        }
                        var DesigntimeCData = _viewDesigner.View.viewDefinitionXML.createTextNode(value);
                        if ($chk(DesigntimeElem.childNodes) === true)
                        {
                            if (DesigntimeElem.childNodes.length > 0)
                            {
                                DesigntimeElem.firstChild.data = value;
                            }
                            else
                            {
                                DesigntimeElem.appendChild(DesigntimeCData);
                            }
                        }
                        else
                        {
                            DesigntimeElem.appendChild(DesigntimeCData);
                        }

                        display = _viewDesigner._determineCorrectedDisplayValue(display, nameValue, value);

                        var addDisplay = checkExistsNotEmpty(display);

                        var RuntimeElem = PropElem.selectSingleNode('DisplayValue');
                        if (($chk(RuntimeElem) === false) && addDisplay)
                        {
                            RuntimeElem = _viewDesigner.View.viewDefinitionXML.createElement('DisplayValue');
                            PropElem.appendChild(RuntimeElem);
                        }
                        else if (($chk(RuntimeElem) === true) && !addDisplay)
                        {
                            PropElem.removeChild(RuntimeElem);
                            RuntimeElem = null;
                        }

                        if (addDisplay)
                        {
                            var RuntimeCData = _viewDesigner.View.viewDefinitionXML.createTextNode(display);
                            if ($chk(RuntimeElem.childNodes) === true)
                            {
                                if (RuntimeElem.childNodes.length > 0)
                                {
                                    RuntimeElem.firstChild.data = display;
                                }
                                else
                                {
                                    RuntimeElem.appendChild(RuntimeCData);
                                }
                            }
                            else
                            {
                                RuntimeElem.appendChild(RuntimeCData);
                            }
                        }
                    }
                }
            },

            _removeBindingToNonExistDataSource: function (_smartObjectId, PropertiesElem)
            {
                var fetchResult = _viewDesigner.AJAXCall._getAssociationSODetails(_smartObjectId);

                if (SourceCode.Forms.ExceptionHandler.isException(fetchResult,
                    "SourceCode.SmartObjects.Client.SmartObjectNotFoundException"))
                {
                    // If the associated SMO does not exist, display error & unbind control
                    var controlName = PropertiesElem.selectSingleNode('Property[Name="ControlName"]/Value').text;

                    popupManager.showError({ message: Resources.ViewDesigner.ListControlSmartObjectNotFoundText.format(controlName) });

                    // Find associated properties
                    var propNodes = PropertiesElem.selectNodes('Property[Name="DataSourceType" or Name="AssociationSO"'
                        + ' or Name="AssociationMethod" or Name="ValueProperty" or Name="DisplayTemplate"'
                        + ' or Name="FilterProperty" or Name="LiteralVal"]');

                    // Remove the properties
                    for (var i = 0, l = propNodes.length; i < l; i++)
                    {
                        PropertiesElem.removeChild(propNodes[i]);
                    }

                    // Find the related event actions
                    var actions = _viewDesigner.View.viewDefinitionXML.selectNodes("//Actions/Action[Properties/Property[Name='ObjectID']/Value='"
                        + _smartObjectId + "' or Results/Result[SourceID='" + _smartObjectId + "']]");

                    // Remove associated actions[handlers[events]] to 'reset' configurations
                    for (var i = 0, l = actions.length; i < l; i++)
                    {
                        var targetNode = actions[i];

                        if (targetNode.nextSibling !== null || targetNode.previousSibling !== null)
                        {
                            targetNode.parentNode.removeChild(targetNode); // Remove the action (has sibling actions)
                        }
                        else
                        {
                            targetNode = targetNode.parentNode.parentNode; // Set to Handler

                            if (targetNode.nextSibling !== null || targetNode.previousSibling !== null)
                            {
                                targetNode.parentNode.removeChild(targetNode); // Remove the handler (has sibling handlers)
                            }
                            else
                            {
                                targetNode = targetNode.parentNode.parentNode; // Set to Event
                                targetNode.parentNode.removeChild(targetNode); // Remove the Event
                            }
                        }
                    }
                }
            },

            _setViewDefaultProperties: function (SmartObjectXML)
            {
                // only applicable to CaptureList view type
                var viewType = _viewDesigner._getViewType();
                if (viewType === 'CaptureList')
                {
                    var viewXmlDoc = _viewDesigner.View.viewDefinitionXML;
                    var ViewElem = _viewDesigner._getViewElem(viewXmlDoc);
                    var viewControl = ViewElem.selectSingleNode("Controls/Control[@ID='{0}']".format(ViewElem.getAttribute("ID")));
                    var viewProperties = viewControl.selectSingleNode('Properties');

                    if (!_viewDesigner.multipleListMethodsDetected)
                    {
                        var defaultMethodValue = _viewDesigner._GetSmartObjectDefaultMethod(viewType, SmartObjectXML);
                        _viewDesigner._setPropertiesValue(viewXmlDoc, viewControl, "DefaultMethod", defaultMethodValue);
                    }
                }
            },

            _updateViewName: function (newName)
            {
                var viewXML = _viewDesigner.View.viewDefinitionXML;

                if (_viewDesigner.View.IsViewEdit !== 'True' && _viewDesigner.View.IsViewEdit !== 'true' && _viewDesigner.View.IsViewEdit !== true)
                {
                    var viewSystemName = _viewDesigner.View.AJAXCall._getUniqueViewSystemName(newName);
                    _viewDesigner.View.element.find("#vdViewSystemName").val(viewSystemName);
                }



                // Create correct names //
                var newNameXML = viewXML.createElement("Name");
                newNameXML.appendChild(viewXML.createTextNode(newName));

                var newDisplayNameXML = viewXML.createElement("DisplayName");
                newDisplayNameXML.appendChild(viewXML.createTextNode(newName));

                var newDisplayValueXML = viewXML.createElement("DisplayValue");
                newDisplayValueXML.appendChild(viewXML.createTextNode(newName));

                var newNameValueXML = viewXML.createElement("Value");
                newNameValueXML.appendChild(viewXML.createTextNode(newName));

                // Get old names //
                var viewNode = viewXML.selectSingleNode("SourceCode.Forms/Views/View");
                var viewControlNode = viewNode.selectSingleNode("Controls/Control[@Type='View']");

                if (!checkExists(viewControlNode))
                {
                    //New view was created, add view as control to xml definition:
                    viewControlNode = _viewDesigner._AddViewControl(viewNode.getAttribute("ID"), newName, viewNode, viewXML);
                }

                var viewName = viewNode.selectSingleNode("Name");
                var viewDisplayName = viewNode.selectSingleNode("DisplayName");
                var viewControlName = viewControlNode.selectSingleNode("Name");
                var viewNameProp = viewControlNode.selectSingleNode("Properties/Property[Name='ControlName']/DisplayValue");
                var viewNamePropValue = viewControlNode.selectSingleNode("Properties/Property[Name='ControlName']/Value");
                var oldName = (viewNameProp !== null && checkExistsNotEmpty(viewNameProp.text)) ? viewNameProp.text : viewNamePropValue.text;

                // Replace old names //
                if (viewDisplayName !== null)
                {
                    viewNode.removeChild(viewDisplayName);
                }
                viewNode.appendChild(newDisplayNameXML);

                if (viewControlName !== null)
                {
                    viewControlNode.removeChild(viewControlName);
                }
                viewControlNode.appendChild(newNameXML);

                if (viewNameProp !== null)
                {
                    viewControlNode.selectSingleNode("Properties/Property[Name='ControlName']").removeChild(viewNameProp);
                }
                viewControlNode.selectSingleNode("Properties/Property[Name='ControlName']").appendChild(newDisplayValueXML);

                if (viewNamePropValue !== null)
                {
                    viewControlNode.selectSingleNode("Properties/Property[Name='ControlName']").removeChild(viewNamePropValue);
                }
                viewControlNode.selectSingleNode("Properties/Property[Name='ControlName']").appendChild(newNameValueXML);

                _viewDesigner.View.txtName.val(newName);
                _viewDesigner.View.wizard.wizard("option", "contextobjectname", newName).wizard("update", "header");
                _viewDesigner._updateViewDisplayNameInRules(newName, oldName);
            },

            _updateViewDisplayNameInRules: function (newName, oldName)
            {
                var viewXML = _viewDesigner.View.viewDefinitionXML;
                var viewID = SourceCode.Forms.Designers.View.ViewDesigner._GetViewID();
                var viewEventNodes = viewXML.selectNodes("SourceCode.Forms/Views/View/Events/Event[@SourceType='View' and @SourceID='" + viewID + "']");

                //Update event attributes
                for (var x = 0; x < viewEventNodes.length; x++)
                {
                    var viewEventNode = viewEventNodes[x];
                    viewEventNode.setAttribute("SourceDisplayName", newName);
                }

                var eventNodes = viewXML.selectNodes("SourceCode.Forms/Views/View/Events/Event[@Type='User']");

                for (var j = 0; j < eventNodes.length; j++)
                {
                    var eventNode = eventNodes[j];
                    var viewIdProp = eventNode.selectSingleNode("Properties/Property[Name='ViewID' and Value='" + viewID + "']");

                    if (checkExists(viewIdProp))
                    {
                        var oldDisplayProp = viewIdProp.selectSingleNode("DisplayValue");
                        if (checkExists(oldDisplayProp))
                        {
                            var newDisplayProp = viewXML.createElement("DisplayValue");
                            newDisplayProp.appendChild(viewXML.createTextNode(newName));

                            viewIdProp.removeChild(oldDisplayProp);
                            viewIdProp.appendChild(newDisplayProp);
                        }
                    }

                    var locationProp = eventNode.selectSingleNode("Properties/Property[Name='Location' and Value=" + oldName.xpathValueEncode() + "]");
                    if (checkExists(locationProp))
                    {
                        var oldDisplayProp = locationProp.selectSingleNode("DisplayValue");
                        if (checkExists(oldDisplayProp))
                        {
                            var newDisplayProp = viewXML.createElement("DisplayValue");
                            newDisplayProp.appendChild(viewXML.createTextNode(newName));

                            locationProp.removeChild(oldDisplayProp);
                            locationProp.appendChild(newDisplayProp);
                        }
                    }

                    //Update action properties
                    var actionNodes = eventNode.selectNodes("Handlers/Handler/Actions/Action");
                    for (var i = 0; i < actionNodes.length; i++)
                    {
                        var actionNode = actionNodes[i];
                        var actionViewIdProp = actionNode.selectSingleNode("Properties/Property[Name='ViewID' and Value='" + viewID + "']");
                        if (checkExists(actionViewIdProp))
                        {
                            var oldDisplayProp = actionViewIdProp.selectSingleNode("DisplayValue");
                            if (checkExists(oldDisplayProp))
                            {
                                var newDisplayProp = viewXML.createElement("DisplayValue");
                                newDisplayProp.appendChild(viewXML.createTextNode(newName));

                                actionViewIdProp.removeChild(oldDisplayProp);
                                actionViewIdProp.appendChild(newDisplayProp);
                            }
                        }

                        var actionLocationProp = actionNode.selectSingleNode("Properties/Property[Name='Location' and Value=" + oldName.xpathValueEncode() + "]");
                        if (checkExists(actionLocationProp))
                        {
                            var oldDisplayProp = actionLocationProp.selectSingleNode("DisplayValue");
                            if (checkExists(oldDisplayProp))
                            {
                                var newDisplayProp = viewXML.createElement("DisplayValue");
                                newDisplayProp.appendChild(viewXML.createTextNode(newName));

                                actionLocationProp.removeChild(oldDisplayProp);
                                actionLocationProp.appendChild(newDisplayProp);
                            }
                        }
                    }
                }
            },

            _viewMultiSelect: function (enabled)
            {
                var viewXML = _viewDesigner.View.viewDefinitionXML;
                var viewID = viewXML.selectSingleNode("SourceCode.Forms/Views/View").getAttribute("ID");
                var viewControl = viewXML.selectSingleNode("SourceCode.Forms/Views/View/Controls/Control[@ID='{0}']".format(viewID));
                var hasProperty = viewControl.selectSingleNode("Properties/Property[Name='MultiSelectAllowed']");

                if ($chk(hasProperty))
                {
                    viewControl.selectSingleNode("Properties").removeChild(hasProperty);
                }

                var propName = viewXML.createElement("Name");
                propName.appendChild(viewXML.createTextNode("MultiSelectAllowed"));

                var propValue = viewXML.createElement("Value");
                propValue.appendChild(viewXML.createTextNode(enabled.toString()));

                var propDisplay = viewXML.createElement("DisplayValue");
                propDisplay.appendChild(viewXML.createTextNode(enabled.toString()));

                var multiSelectProp = viewXML.createElement("Property");

                multiSelectProp.appendChild(propName);
                multiSelectProp.appendChild(propValue);
                multiSelectProp.appendChild(propDisplay);

                viewControl.selectSingleNode("Properties").appendChild(multiSelectProp);
            },

            _viewCellContentSelect: function (valueToSet)
            {
                var viewXML = _viewDesigner.View.viewDefinitionXML;
                var viewID = viewXML.selectSingleNode("SourceCode.Forms/Views/View").getAttribute("ID");
                var viewControl = viewXML.selectSingleNode("SourceCode.Forms/Views/View/Controls/Control[@ID='{0}']".format(viewID));
                var hasCellContentSelectAllowedProperty = viewControl.selectSingleNode("Properties/Property[Name='CellContentSelectAllowed']");

                if (checkExists(hasCellContentSelectAllowedProperty))
                {
                    viewControl.selectSingleNode("Properties").removeChild(hasCellContentSelectAllowedProperty);
                }

                var propName = viewXML.createElement("Name");
                propName.appendChild(viewXML.createTextNode("CellContentSelectAllowed"));

                var propValue = viewXML.createElement("Value");
                propValue.appendChild(viewXML.createTextNode(valueToSet.toString()));

                var propDisplay = viewXML.createElement("DisplayValue");
                propDisplay.appendChild(viewXML.createTextNode(valueToSet.toString()));

                var cellContentSelectProp = viewXML.createElement("Property");

                cellContentSelectProp.appendChild(propName);
                cellContentSelectProp.appendChild(propValue);
                cellContentSelectProp.appendChild(propDisplay);

                viewControl.selectSingleNode("Properties").appendChild(cellContentSelectProp);
            },

            _initPropertiesHeader: function ()
            {
                var jqScope = _viewDesigner.View.element;
                _viewDesigner.$propertiesIcon = jqScope.find("#ControlPropertiesIcon");
                _viewDesigner.$propertiesTitle = jqScope.find("#ControlPropertiesName");
            },

            _doViewCanvasInit: function ()
            {
                var jqScope = _viewDesigner.View.element;

                //get references to properties panel elements
                _viewDesigner._initPropertiesHeader();


                //get primary SO name and set headings
                _viewDesigner._setPrimarySOName();

                //build so fields
                var viewXMLDoc = _viewDesigner.View.viewDefinitionXML;
                _viewDesigner._updatePrimaryFields(viewXMLDoc);
                var SmartObjectXML = _viewDesigner.View.hiddenSmartObjectXml;

                if ($chk(SmartObjectXML) === true)
                {
                    //build behaviour for the save of all element in all states
                    if (_viewDesigner._getViewType() === 'CaptureList')
                    {
                        // make sure the corrected methods are selected for editable lists with default add, save, remove options
                        var editableCaptureListNode = _viewDesigner._isEditableCaptureList();
                        if ($chk(editableCaptureListNode))
                        {
                            // single edit
                            if (editableCaptureListNode === "single")
                            {
                                var methodXPath = "SourceCode.Forms/Views/View/Events/Event[(@Type='User') and (@SourceType='View') and (Name='{0}')]/Handlers/Handler/Actions/Action[(@ItemState='{1}') and (@Type='Execute') and (@ExecutionType='Synchronous')]/Properties/Property[Name='Method']/Value";

                                var methodNameNode = viewXMLDoc.selectSingleNode(methodXPath.format("ListItemAdded", "Added"));
                                if (checkExists(methodNameNode))
                                {
                                    _viewDesigner._selectValueInDropdown("#vdlistEditAddMethod", methodNameNode.text);
                                }

                                methodNameNode = viewXMLDoc.selectSingleNode(methodXPath.format("ListItemChanged", "Changed"));
                                if (checkExists(methodNameNode))
                                {
                                    _viewDesigner._selectValueInDropdown("#vdlistEditEditMethod", methodNameNode.text);
                                }

                                methodNameNode = viewXMLDoc.selectSingleNode(methodXPath.format("ListItemRemoved", "Removed"));
                                if (checkExists(methodNameNode))
                                {
                                    _viewDesigner._selectValueInDropdown("#vdlistEditDeleteMethod", methodNameNode.text);
                                }
                            }
                            else
                            {
                                var methodXPath = "SourceCode.Forms/Views/View/Events/Event[(@Type='User') and (@SourceType='Control') and (Name='OnClick')]/Handlers/Handler/Actions/Action[(@ItemState='{0}') and (@Type='Execute') and (@ExecutionType='Single')]/Properties/Property[Name='Method']/Value";

                                var methodNameNode = viewXMLDoc.selectSingleNode(methodXPath.format("Added"));
                                if (checkExists(methodNameNode))
                                {
                                    _viewDesigner._selectValueInDropdown("#vdlistEditAddMethod", methodNameNode.text);
                                }

                                methodNameNode = viewXMLDoc.selectSingleNode(methodXPath.format("Changed"));
                                if (checkExists(methodNameNode))
                                {
                                    _viewDesigner._selectValueInDropdown("#vdlistEditEditMethod", methodNameNode.text);
                                }

                                methodNameNode = viewXMLDoc.selectSingleNode(methodXPath.format("Removed"));
                                if (checkExists(methodNameNode))
                                {
                                    _viewDesigner._selectValueInDropdown("#vdlistEditDeleteMethod", methodNameNode.text);
                                }
                            }
                        }

                    }
                    ////////////////////////////////////////////////////////////////////////////////////////
                }
            },

            _selectValueInDropdown: function (dropDownSelector, methodSystemName)
            {
                var jqScope = _viewDesigner.View.element;
                var jqDropDown = jqScope.find(dropDownSelector).dropdown();
                if (jqDropDown.length > 0)
                {
                    var options = jqDropDown[0].options;
                    for (var i = 0; i < options.length; i++)
                    {
                        if (options[i].value === methodSystemName)
                        {
                            jqDropDown.dropdown("SelectedIndex", i);
                            jqDropDown.dropdown("refresh");
                            break;
                        }
                    }
                }
            },

            _BuildSingleSaveBehaviour: function (data)
            {
                if (_viewDesigner.View.isSmartObjectLoaded === false) return;

                var viewName = _viewDesigner._GetViewName();
                var viewElem = _viewDesigner.View.viewDefinitionXML.selectSingleNode('//Views/View');
                var eventsElem = viewElem.selectSingleNode('Events');
                var viewDisplayName = _viewDesigner._GetViewDisplayName();

                var methodAdded = false;
                if ($chk(eventsElem) === false)
                {
                    eventsElem = _viewDesigner.View.viewDefinitionXML.createElement('Events');

                    viewElem.appendChild(eventsElem);
                }

                // query to see if event doesn't already exist
                var eventElem = eventsElem.selectSingleNode("Event[(@Type='User') and (@SourceType='Control') and (@SourceID='{0}')][Name='OnClick']".format(data.controlid));
                if (!checkExists(eventElem))
                {
                    eventElem = _viewDesigner.View.viewDefinitionXML.createElement('Event');
                    eventElem.setAttribute('ID', String.generateGuid());
                    eventElem.setAttribute("DefinitionID", String.generateGuid());
                    eventElem.setAttribute('Type', 'User');
                    eventElem.setAttribute('SourceID', data.controlid);
                    eventElem.setAttribute('ViewID', data.viewid);
                    eventElem.setAttribute('SourceType', 'Control');
                    eventElem.setAttribute('SourceName', data.controlname);
                    eventElem.setAttribute('SourceDisplayName', data.controlname);

                    var nameElem = _viewDesigner.View.viewDefinitionXML.createElement('Name');
                    nameElem.appendChild(_viewDesigner.View.viewDefinitionXML.createTextNode('OnClick'));
                    eventElem.appendChild(nameElem);

                    var propertiesElem = _viewDesigner.View.viewDefinitionXML.createElement('Properties');
                    var namePropertiesElem = _viewDesigner.View.viewDefinitionXML.createElement('Property');
                    var namePropertiesNameElem = _viewDesigner.View.viewDefinitionXML.createElement('Name');
                    var namePropertiesValueElem = _viewDesigner.View.viewDefinitionXML.createElement('Value');
                    var DescriptionPropertiesElem = _viewDesigner.View.viewDefinitionXML.createElement('Property');
                    var DescriptionPropertiesNameElem = _viewDesigner.View.viewDefinitionXML.createElement('Name');
                    var DescriptionPropertiesDescriptionElem = _viewDesigner.View.viewDefinitionXML.createElement('Value');
                    propertiesElem.appendChild(namePropertiesElem);
                    propertiesElem.appendChild(DescriptionPropertiesElem);
                    namePropertiesElem.appendChild(namePropertiesNameElem);
                    namePropertiesElem.appendChild(namePropertiesValueElem);
                    DescriptionPropertiesElem.appendChild(DescriptionPropertiesNameElem);
                    DescriptionPropertiesElem.appendChild(DescriptionPropertiesDescriptionElem);
                    namePropertiesNameElem.appendChild(_viewDesigner.View.viewDefinitionXML.createTextNode("RuleFriendlyName"));
                    namePropertiesValueElem.appendChild(_viewDesigner.View.viewDefinitionXML.createTextNode(Resources.ViewDesigner.MethodBehaviourName.format(data.controlname, Resources.ViewDesigner.ControlEvent_OnClick)));
                    DescriptionPropertiesNameElem.appendChild(_viewDesigner.View.viewDefinitionXML.createTextNode("RuleDescription"));
                    DescriptionPropertiesDescriptionElem.appendChild(_viewDesigner.View.viewDefinitionXML.createTextNode(Resources.ViewDesigner.SaveAllDescription));
                    eventElem.appendChild(propertiesElem);

                    propertiesElem.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(_viewDesigner.View.viewDefinitionXML, "Location", viewName, viewDisplayName));
                    propertiesElem.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(_viewDesigner.View.viewDefinitionXML, "ViewID", _viewDesigner._GetViewID(), viewDisplayName, viewName));

                    var handlersElem = _viewDesigner.View.viewDefinitionXML.createElement("Handlers");
                    var handlerElem = _viewDesigner.View.viewDefinitionXML.createElement("Handler");
                    var listenersElem = _viewDesigner.View.viewDefinitionXML.createElement("Actions");

                    handlerElem.appendChild(listenersElem);
                    handlersElem.appendChild(handlerElem);
                    eventElem.appendChild(handlersElem);
                }

                // create action
                // if create method is valid build the action
                if (_viewDesigner.View.selectedOptions.UserAddRows === true)
                {
                    //get create method data
                    var methodData = _viewDesigner._getSmartObjectMethodData(data.soid, "create", _viewDesigner.View.element.find("#vdlistEditAddMethod").val());

                    methodAdded = true;

                    if (_viewDesigner.View.SelectedViewType === "CaptureList")
                    {
                        methodData.type = "list";
                    }
                    methodData.soid = data.soid;
                    methodData.viewid = data.viewid;
                    _viewDesigner._BuildSingleSaveAction(data, methodData, 'Added', _viewDesigner.View.viewDefinitionXML, listenersElem);
                }

                //update action
                //if update method is valid build the action
                if (_viewDesigner.View.selectedOptions.UserEditRows === true)
                {
                    //get update method data
                    var methodData = _viewDesigner._getSmartObjectMethodData(data.soid, "update", _viewDesigner.View.element.find("#vdlistEditEditMethod").val());

                    methodAdded = true;

                    if (_viewDesigner.View.SelectedViewType === "CaptureList")
                    {
                        methodData.type = "list";
                    }
                    methodData.soid = data.soid;
                    methodData.viewid = data.viewid;
                    _viewDesigner._BuildSingleSaveAction(data, methodData, 'Changed', _viewDesigner.View.viewDefinitionXML, listenersElem);
                }

                //delete action
                //if delete method is valid build the action
                if (_viewDesigner.View.selectedOptions.UserRemoveRows === true)
                {
                    methodAdded = true;

                    //get delete method data
                    var methodData = _viewDesigner._getSmartObjectMethodData(data.soid, "delete", _viewDesigner.View.element.find("#vdlistEditDeleteMethod").val());

                    if (_viewDesigner.View.SelectedViewType === "CaptureList")
                    {
                        methodData.type = "list";
                    }

                    methodData.viewid = data.viewid;
                    _viewDesigner._BuildSingleSaveAction(data, methodData, 'Removed', _viewDesigner.View.viewDefinitionXML, listenersElem);
                }

                if (methodAdded)
                {
                    eventsElem.appendChild(eventElem);
                }
            },

            _BuildSingleSaveAction: function (data, methodData, state, xmlDoc, listenersElem)
            {
                // query if action already exists
                var listenerElem = listenersElem.selectSingleNode("Action[(@Type='Execute') and (@ExecutionType='Single') and (@ItemState='{0}')]".format(state));
                var viewDisplayName = _viewDesigner._GetViewDisplayName();
                var viewName = _viewDesigner._GetViewName();
                if (!checkExists(listenerElem))
                {
                    listenerElem = xmlDoc.createElement('Action');
                    var propertiesElem = xmlDoc.createElement('Properties');

                    listenerElem.setAttribute('Type', 'Execute');
                    listenerElem.setAttribute('ExecutionType', 'Single');
                    listenerElem.setAttribute('ItemState', state);
                    listenersElem.appendChild(listenerElem);

                    propertiesElem.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "Method", methodData.methodid, methodData.MethodDisplayName, methodData.MethodDisplayName));
                    propertiesElem.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "ViewID", data.viewid, viewDisplayName, viewName));
                    propertiesElem.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "Location", "View", viewDisplayName));

                    listenerElem.appendChild(propertiesElem);

                    //Build Action Parameters element
                    _viewDesigner._BuildMethodActionParamenters(xmlDoc, listenerElem, methodData);
                }
            },

            _BuildMethodActionParamenters: function (xmlDoc, parentElement, methodData)
            {
                var viewXML = _viewDesigner.View.viewDefinitionXML;

                if ($chk(_viewDesigner.View.hiddenSmartObjectXml) === true)
                {
                    var soXMLDoc = _viewDesigner.View.hiddenSmartObjectXml;
                    if ($chk(soXMLDoc) === true)
                    {
                        var parametersElem = parentElement.selectSingleNode("Parameters");
                        if (!checkExists(parametersElem))
                        {
                            parametersElem = xmlDoc.createElement('Parameters');
                            parentElement.appendChild(parametersElem);
                        }

                        var xMethodPath = 'smartobject/smartobjectroot[@guid="' + methodData.soid + '"]/methods/method[@name="' + methodData.methodid + '"]';
                        var methodElem = soXMLDoc.selectSingleNode(xMethodPath);

                        if (methodElem)
                        {
                            var methodType = methodElem.getAttribute('type');

                            //add input properties
                            if (methodType !== "list")
                            {
                                var methodInputParameters = methodElem.selectNodes('input/property');
                                var requiredPropertiesElems = methodElem.selectNodes('requiredproperties/property');
                                var requiredPropertyNames = [];

                                for (var r = 0; r < requiredPropertiesElems.length; r++)
                                {
                                    requiredPropertyNames.push(requiredPropertiesElems[r].getAttribute('name'));
                                }

                                for (var j = 0; j < methodInputParameters.length; j++)
                                {
                                    var property = methodInputParameters[j];
                                    var propertyName = property.getAttribute('name');
                                    var isRequired = false;

                                    for (var rr = 0; rr < requiredPropertyNames.length; rr++)
                                    {
                                        if (propertyName === requiredPropertyNames[rr])
                                        {
                                            isRequired = true;
                                            break;
                                        }
                                    }

                                    if (_viewDesigner._isPropertyParameter(soXMLDoc, methodData, propertyName))
                                    {
                                        var parameterElem = xmlDoc.createElement('Parameter');

                                        parameterElem.setAttribute('SourceID', propertyName);
                                        parameterElem.setAttribute('SourceType', 'MethodParameter');
                                        parameterElem.setAttribute('SourceName', propertyName);
                                        parameterElem.setAttribute('SourceDisplayName', propertyName);
                                        parameterElem.setAttribute('TargetID', propertyName);
                                        parameterElem.setAttribute('TargetType', 'MethodParameter');
                                        parameterElem.setAttribute('IsRequired', isRequired.toString());

                                        parametersElem.appendChild(parameterElem);
                                    }
                                    else
                                    {
                                        var propertyXML = viewXML.documentElement.selectSingleNode("Views/View/Sources/Source[(@SourceType='Object') and (@SourceID='" + methodData.soid + "')]/Fields/Field[FieldName = '" + propertyName + "']");

                                        //Hack the Sources Collection should be populated already
                                        if (!propertyXML)
                                        {
                                            _viewDesigner._BuildViewXML();
                                            propertyXML = viewXML.documentElement.selectSingleNode("Views/View/Sources/Source[(@SourceType='Object') and (@SourceID='" + methodData.soid + "')]/Fields/Field[FieldName = '" + propertyName + "']");
                                        }

                                        var fieldID = propertyXML.getAttribute("ID");
                                        var controlId = this._getControlBoundToField(viewXML, fieldID);
                                        var fieldName = propertyXML.selectSingleNode("FieldName").text;
                                        var viewFieldID = viewXML.documentElement.selectSingleNode("Views/View");
                                        var itemType = propertyXML.getAttribute("Type");
                                        var skipProperty = false;

                                        if (methodType === 'create')
                                        {
                                            var propertyData = _viewDesigner._getPropertyData(methodData.soid, propertyName);
                                            if (propertyData)
                                                if (propertyData.type === 'autonumber' || propertyData.type === 'autoguid')
                                                    skipProperty = true;
                                        }

                                        if (!skipProperty)
                                        {
                                            var parameterElem = null;

                                            if (checkExistsNotEmpty(controlId))
                                            {
                                                parameterElem = parametersElem.selectSingleNode("Parameter[@SourceID='{0}']".format(controlId));
                                            }

                                            if (!checkExists(parameterElem))
                                            {
                                                parameterElem = parametersElem.selectSingleNode("Parameter[@SourceID='{0}']".format(fieldID));
                                            }

                                            if (!checkExists(parameterElem))
                                            {
                                                parameterElem = xmlDoc.createElement('Parameter');

                                                if (methodData.type !== "list" && checkExistsNotEmpty(controlId))
                                                {
                                                    var controlName = _viewDesigner._getControlProperty(controlId, "ControlName");

                                                    parameterElem.setAttribute('SourceID', controlId);
                                                    parameterElem.setAttribute('SourceType', 'Control');
                                                    parameterElem.setAttribute('SourceName', controlName);
                                                    parameterElem.setAttribute('SourceDisplayName', controlName);
                                                }
                                                else
                                                {
                                                    parameterElem.setAttribute('SourceID', fieldID);
                                                    parameterElem.setAttribute('SourceType', 'ViewField');
                                                    parameterElem.setAttribute('SourceName', propertyName);

                                                    if (checkExists(propertyXML.selectSingleNode("FieldDisplayName")))
                                                    {
                                                        var propertyDisplyName = propertyXML.selectSingleNode("FieldDisplayName").text;
                                                        parameterElem.setAttribute('SourceDisplayName', propertyDisplyName);
                                                    }
                                                }
                                                parameterElem.setAttribute('TargetID', propertyName);
                                                parameterElem.setAttribute('TargetType', 'ObjectProperty');
                                                parameterElem.setAttribute('IsRequired', isRequired.toString());

                                                parametersElem.appendChild(parameterElem);
                                            }
                                        }
                                    }
                                }
                            }

                            var methodReturnProperties = methodElem.selectNodes('returnproperties/property');
                            if (methodReturnProperties.length > 0)
                            {
                                //add output properties
                                var resultsElem = parentElement.selectSingleNode("Results");
                                if (!checkExists(resultsElem))
                                {
                                    resultsElem = xmlDoc.createElement('Results');
                                    parentElement.appendChild(resultsElem);
                                }

                                for (var j = 0; j < methodReturnProperties.length; j++)
                                {
                                    var property = methodReturnProperties[j];
                                    var propertyName = property.getAttribute('name');
                                    var propertyXML = viewXML.documentElement.selectSingleNode("Views/View/Sources/Source[(@SourceType='Object') and (@SourceID='" + methodData.soid + "')]/Fields/Field[FieldName = '" + propertyName + "']");
                                    var fieldID = propertyXML.getAttribute("ID");
                                    var controlId = this._getControlBoundToField(viewXML, fieldID);

                                    var resultElem = null;

                                    if (checkExistsNotEmpty(controlId))
                                    {
                                        resultsElem.selectSingleNode("Parameter[@TargetID='{0}']".format(controlId));
                                    }

                                    if (checkExists(resultElem))
                                    {
                                        resultsElem.selectSingleNode("Parameter[@TargetID='{0}']".format(fieldID));
                                    }

                                    if (!checkExists(resultElem))
                                    {
                                        resultElem = xmlDoc.createElement('Result');
                                        resultsElem.appendChild(resultElem);

                                        resultElem.setAttribute('SourceID', propertyName);
                                        resultElem.setAttribute('SourceType', 'ObjectProperty');

                                        if (methodData.type !== "list" && checkExistsNotEmpty(controlId))
                                        {
                                            resultElem.setAttribute('TargetID', controlId);
                                            resultElem.setAttribute('TargetType', 'Control');
                                        }
                                        else
                                        {
                                            resultElem.setAttribute('TargetID', fieldID);
                                            resultElem.setAttribute('TargetType', 'ViewField');
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },

            _getControlBoundToField: function (viewXML, fieldID)
            {
                var controlNode = viewXML.documentElement.selectSingleNode("Views/View/Controls/Control[@FieldID='{0}']".format(fieldID));
                if (!controlNode)
                    return null;
                return controlNode.getAttribute("ID");
            },

            _getPropertyData: function (soid, propertyName)
            {
                var propData = null;
                if ($chk(_viewDesigner.View.hiddenSmartObjectXml) === true)
                {
                    var soXMLDoc = _viewDesigner.View.hiddenSmartObjectXml;
                    var xPropertyPath = 'smartobject/smartobjectroot[@guid="' + soid + '"]/properties/property[@name="' + propertyName + '"]';
                    var propertyElem = soXMLDoc.selectSingleNode(xPropertyPath);
                    if (propertyElem)
                    {
                        propData = {
                            type: propertyElem.getAttribute('type'),
                            isunique: propertyElem.getAttribute('unique'),
                            issystem: propertyElem.getAttribute('system')
                        };
                    }
                }
                return propData;
            },

            _isPropertyParameter: function (oXMLDoc, methodData, propertyName)
            {
                var retVal = false;

                var xInputParamPath = 'smartobject/smartobjectroot[@guid="' + methodData.soid + '"]/methods/method[@name="' + methodData.methodid + '"]/parameters/parameter[@name="' + propertyName + '"]';
                var methodParameters = oXMLDoc.selectSingleNode(xInputParamPath);

                if (methodParameters)
                {
                    retVal = true;
                }

                return retVal;
            },

            _isPreload: function (controlID)
            {
                var control = _viewDesigner.View.element.find("#" + controlID);
                var viewXML = SourceCode.Forms.Designers.View.viewDefinitionXML;
                var viewEvents = viewXML.selectSingleNode("SourceCode.Forms/Views/View/Events");
                var preloadCacheEvent;
                var viewPreloadEvent;
                var controlPreloadEvent;

                if (checkExists(viewEvents))
                {
                    var hasParent = _viewDesigner._getControlProperty(controlID, 'ParentControl');

                    preloadCacheEvent = viewEvents.selectSingleNode("Event[@Type='User'][Handlers/Handler/Actions/Action[@Type='Execute'][not(Results)]/Properties/Property[Name='ControlID' and Value={0}]]".format(controlID.xpathValueEncode()));
                    viewPreloadEvent = viewEvents.selectSingleNode("Event[@Type='User'][Handlers/Handler/Actions/Action[@Type='PopulateControl']/Properties/Property[Name='ControlID' and Value={0}]]".format(controlID.xpathValueEncode()));

                    if (hasParent !== "")
                    {
                        controlPreloadEvent = viewEvents.selectSingleNode("Event[@Type='User'][Handlers/Handler/Actions/Action[@Type='PopulateControl'][Properties/Property[Name='ControlID' and Value={0}]][Properties/Property[Name='Filter']]]".format(controlID.xpathValueEncode()));
                    }

                    if (checkExists(preloadCacheEvent) && checkExists(controlPreloadEvent))
                    {
                        control.data("Preload", true);
                        control.data("ParentFilter", true);
                    }
                    else if (checkExists(preloadCacheEvent) && checkExists(viewPreloadEvent))
                    {
                        control.data("Preload", true);
                        control.removeData("ParentFilter");
                    }
                    else
                    {
                        control.removeData("Preload");
                        control.removeData("ParentFilter");
                    }
                }
            },

            _getSmartObjectMethodDisplayName: function (soid, methodtype, systemName)
            {
                var hiddenSmartObjectXml = _viewDesigner.View.hiddenSmartObjectXml;
                if ($chk(hiddenSmartObjectXml) === true)
                {
                    var methodPath = "smartobject/smartobjectroot[@guid='{0}']/methods/method[(@type='{1}') and (@name='{2}')]".format(soid, methodtype, systemName);
                    var methodNode = hiddenSmartObjectXml.selectSingleNode(methodPath);
                    if (checkExists(methodNode))
                    {
                        return methodNode.selectSingleNode('metadata/display/displayname').text;
                    }
                }
                return null;
            },

            // Retrieves method data
            _getSmartObjectMethodData: function (soid, methodtype, methodName)
            {
                var methodData = null;
                var hiddenSmartObjectXml = _viewDesigner.View.hiddenSmartObjectXml;
                var encodedMethodName = methodName.smartObjectEncoding();
                if ($chk(hiddenSmartObjectXml) === true)
                {
                    var methodPath = "smartobject/smartobjectroot[@guid='{0}']/methods/method[(@type='{1}') and (@name='{2}')]".format(soid, methodtype, methodName);
                    var methodNode = hiddenSmartObjectXml.selectSingleNode(methodPath);
                    if (checkExists(methodNode))
                    {
                        methodData = {
                            soid: soid,
                            methodid: methodNode.getAttribute('name'),
                            friendlyname: methodNode.selectSingleNode('metadata/display/displayname').text
                        };
                    }
                }
                return methodData;
            },

            _setPrimarySOName: function ()
            {
                var PropParent = _viewDesigner.View.element.find('#PropParent');

                if (PropParent.length > 0)
                {
                    _viewDesigner.View.SelectedSmartObjectName = PropParent.attr('sofriendlyname');
                    _viewDesigner._setViewEditorControlTab(_viewDesigner.View.SelectedControlTab);
                }
            },

            _cleanFieldsForChangedSmoProperties: function (fieldElem, data, viewElem)
            {
                var so = _viewDesigner.View.hiddenAssociationXml.selectSingleNode('//smartobjectroot[@guid = "{0}"]'.format(data.soid));
                var allFields = viewElem.selectNodes('Sources/Source[@SourceID = "{0}"]/Fields/Field'.format(data.soid));

                if (checkExistsNotEmpty(so))
                {
                    for (var i = 0; i < allFields.length; i++)
                    {
                        var field = allFields[i];
                        var fieldNameNode = field.selectSingleNode('FieldName/text()');
                        var fieldName = (fieldNameNode === null) ? "" : fieldNameNode.text;
                        var usedProp = so.selectSingleNode('properties/property[@name = "{0}"]'.format(fieldName));

                        if (usedProp === null)
                        {
                            field.parentNode.removeChild(field);
                        }
                    }
                }
            },

            _createField: function (xmlDoc, data)
            {
                var thisFieldId = null;

                var viewElem = _viewDesigner._getViewElem(xmlDoc);
                if ($chk(viewElem) === true)
                {
                    //Sources Elem
                    var SourcesElem = viewElem.selectSingleNode('Sources');
                    if ($chk(SourcesElem) === false)
                    {
                        SourcesElem = xmlDoc.createElement('Sources');
                        viewElem.appendChild(SourcesElem);
                    }

                    //Source Elem
                    if (checkExistsNotEmpty(data))
                    {
                        var xpath = "Source[@SourceID='{0}' and @SourceType='{1}' and @ContextID='{2}' and @ContextType='{3}']".format(data.soid.toLowerCase(), data.sourcetype, data.contextid.toLowerCase(), data.contexttype);

                        if (data.contexttype === "Primary")
                        {
                            xpath = "Source[@SourceID='{0}' and @SourceType='{1}' and @ContextType='{2}']".format(data.soid.toLowerCase(), data.sourcetype, data.contexttype);
                        }

                        var SourceElem = SourcesElem.selectSingleNode(xpath);

                        //Check if a source for the same SO and same control already exists
                        var xpathForExistingSourceIdAndContextId = "Source[@SourceID='{0}' and @SourceType='{1}' and @ContextID='{2}']".format(data.soid.toLowerCase(), data.sourcetype, data.contextid.toLowerCase());
                        var existingSourceForSOandControl = SourcesElem.selectSingleNode(xpathForExistingSourceIdAndContextId);

                        // Create the Source entry if is does not exist yet
                        if ($chk(SourceElem) === false && existingSourceForSOandControl === null)
                        {
                            SourceElem = xmlDoc.createElement('Source');
                            SourceElem.setAttribute('ID', String.generateGuid());
                            SourceElem.setAttribute('SourceID', data.soid.toLowerCase());
                            SourceElem.setAttribute('SourceType', data.sourcetype);
                            SourceElem.setAttribute('SourceName', data.soname);
                            SourceElem.setAttribute('SourceDisplayName', data.sofriendlyname);
                            SourceElem.setAttribute('ContextID', data.contextid.toLowerCase());
                            SourceElem.setAttribute('ContextType', data.contexttype);
                            SourcesElem.appendChild(SourceElem);
                        }
                        else if ($chk(SourceElem) === false && existingSourceForSOandControl !== null && data.contexttype !== "Primary")
                        {
                            SourceElem = existingSourceForSOandControl;
                            SourceElem.setAttribute('ContextType', data.contexttype);
                        }

                        // Populate the source name info as required
                        var SourceNameElem = SourceElem.selectSingleNode('Name');
                        if ($chk(SourceNameElem) === false)
                        {
                            SourceNameElem = xmlDoc.createElement('Name');
                            SourceNameElem.appendChild(xmlDoc.createTextNode(data.soname));
                            SourceElem.appendChild(SourceNameElem);
                        }

                        var SourceDisplayNameElem = SourceElem.selectSingleNode('DisplayName');
                        if ($chk(SourceDisplayNameElem) === false)
                        {
                            SourceDisplayNameElem = xmlDoc.createElement('DisplayName');
                            SourceDisplayNameElem.appendChild(xmlDoc.createTextNode(data.sofriendlyname));
                            SourceElem.appendChild(SourceDisplayNameElem);
                        }

                        // Create the fields collection if it does noet exist
                        var FieldsElem = SourceElem.selectSingleNode('Fields');
                        if ($chk(FieldsElem) === false)
                        {
                            FieldsElem = xmlDoc.createElement('Fields');
                            SourceElem.appendChild(FieldsElem);
                        }

                        // Lookup the field, existence check
                        var xpath = 'Field[FieldName="' + data.propertyid + '"]';
                        var FieldElem = FieldsElem.selectSingleNode(xpath);
                        if ($chk(FieldElem) === false)
                        {
                            FieldElem = xmlDoc.createElement('Field');
                            thisFieldId = String.generateGuid().toLowerCase();
                            FieldsElem.appendChild(FieldElem);
                        }
                        else
                        {
                            thisFieldId = FieldElem.getAttribute('ID').toLowerCase();
                        }

                        // Get display name of field
                        var displayName = data.friendlyname;

                        if (data.contexttype === "Association")
                        {
                            displayName = data.sofriendlyname + "." + displayName;
                        }

                        FieldElem.setAttribute('ID', thisFieldId);
                        FieldElem.setAttribute('Type', data.fieldtype);
                        FieldElem.setAttribute('DataType', data.propertytype);

                        // Name
                        var FieldNameElem = FieldElem.selectSingleNode('Name');
                        if ($chk(FieldNameElem) === true)
                        {
                            FieldElem.removeChild(FieldNameElem);
                        }

                        FieldNameElem = xmlDoc.createElement('Name');
                        FieldNameElem.appendChild(xmlDoc.createTextNode(displayName));
                        FieldElem.appendChild(FieldNameElem);

                        // FieldName (system name of SMO Property)
                        var FieldSOPropNameElem = FieldElem.selectSingleNode('FieldName');
                        if ($chk(FieldSOPropNameElem) === true)
                        {
                            FieldElem.removeChild(FieldSOPropNameElem);
                        }

                        FieldSOPropNameElem = xmlDoc.createElement('FieldName');
                        FieldSOPropNameElem.appendChild(xmlDoc.createTextNode(data.propertyid));
                        FieldElem.appendChild(FieldSOPropNameElem);

                        // FieldDisplayName (friendly name of SMO property)
                        var FieldSOPropDispNameElem = FieldElem.selectSingleNode('FieldDisplayName');
                        if ($chk(FieldSOPropDispNameElem) === true)
                        {
                            FieldElem.removeChild(FieldSOPropDispNameElem);
                        }

                        FieldSOPropDispNameElem = xmlDoc.createElement('FieldDisplayName');
                        FieldSOPropDispNameElem.appendChild(xmlDoc.createTextNode(data.friendlyname));
                        FieldElem.appendChild(FieldSOPropDispNameElem);
                    }
                }
                return thisFieldId;
            },

            _setPropertiesValue: function (xmlDoc, parentElement, name, value, displayValue)
            {
                var properties = parentElement.selectSingleNode("Properties");
                if (!checkExists(properties))
                {
                    properties = xmlDoc.createElement("Properties");
                    parentElement.appendChild(properties);
                }

                if (!checkExists(displayValue))
                {
                    displayValue = value;
                }

                var propertyElement = properties.selectSingleNode("Property[Name='{0}']".format(name));

                if (checkExists(propertyElement))
                {
                    properties.removeChild(propertyElement);
                }

                properties.appendChild(_viewDesigner._createEventingPropertyWithEncoding(xmlDoc, name, value, displayValue));
            },

            _AddViewControl: function (viewId, viewName, viewElem, xmlDoc)
            {
                _viewDesigner._createControl(xmlDoc, { id: viewId, controltype: "View", name: viewName });

                var viewControl = viewElem.selectSingleNode("Controls/Control[@ID='{0}']".format(viewId));

                var viewProperties = xmlDoc.createElement("Properties");
                var NameProperty = _viewDesigner._AddViewControlNameProp(viewName);
                viewProperties.appendChild(NameProperty);
                viewControl.appendChild(viewProperties);

                return viewControl;
            },

            _AddViewControlNameProp: function (viewName)
            {
                var xmlDoc = _viewDesigner.View.viewDefinitionXML;

                var NameProperty = xmlDoc.createElement("Property");

                var NameElement = xmlDoc.createElement("Name");
                NameElement.appendChild(xmlDoc.createTextNode("ControlName"));

                var DisplayElement = xmlDoc.createElement("DisplayValue");
                DisplayElement.appendChild(xmlDoc.createTextNode(viewName));

                var ValueElement = xmlDoc.createElement("Value");
                ValueElement.appendChild(xmlDoc.createTextNode(viewName));

                NameProperty.appendChild(NameElement);
                NameProperty.appendChild(DisplayElement);
                NameProperty.appendChild(ValueElement);

                return NameProperty;
            },

            _BuildViewXML: function ()
            {
                modalizer.show(true);

                var thisSmartObjectGuid = _viewDesigner.View.SelectedSmartObjectGuid;

                var xmlDoc = _viewDesigner.View.viewDefinitionXML;
                var events = xmlDoc.documentElement.selectSingleNode('Views/View/Events');
                var viewElem = _viewDesigner._getViewElem(xmlDoc);

                // always make sure that if we are working with a caputre list view, we save it as the correct type

                if ($chk(viewElem) === true)
                {
                    // add view as a control
                    var viewId = xmlDoc.selectSingleNode("SourceCode.Forms/Views/View").getAttribute("ID");

                    var viewName = "View";
                    if (checkExists(viewElem.selectSingleNode("Name")))
                    {
                        viewName = viewElem.selectSingleNode("Name").text;
                    }

                    var viewControl = viewElem.selectSingleNode("Controls/Control[@ID='{0}']".format(viewId));
                    var viewProperties = null;
                    if (!checkExists(viewControl))
                    {
                        viewControl = _viewDesigner._AddViewControl(viewId, viewName, viewElem, xmlDoc);
                        viewProperties = viewControl.selectSingleNode("Properties");
                    }
                    else
                    {
                        viewProperties = viewControl.selectSingleNode("Properties");

                        if (!$chk(viewProperties))
                        {
                            viewProperties = xmlDoc.createElement("Properties");

                            var NameProperty = _viewDesigner._AddViewControlNameProp(viewName);

                            viewProperties.appendChild(NameProperty);
                            viewControl.appendChild(viewProperties);
                        }

                        var viewControlNameNode = viewControl.selectSingleNode("Name");
                        if (checkExists(viewControlNameNode))
                        {
                            //  need to do it this way so that safari doesn't moan
                            if (checkExists(viewControlNameNode.firstChild))
                            {
                                viewControlNameNode.removeChild(viewControlNameNode.firstChild);
                            }
                            viewControlNameNode.appendChild(xmlDoc.createTextNode(viewName));
                        }
                    }

                    //Sources
                    var SourcesElem = viewElem.selectSingleNode('Sources');
                    if ($chk(SourcesElem) === false)
                    {
                        SourcesElem = xmlDoc.createElement('Sources');
                        viewElem.appendChild(SourcesElem);
                    }

                    //Removing Main source if no SO was selected
                    if (!checkExists(thisSmartObjectGuid))
                    {
                        if ($chk(SourcesElem))
                        {
                            var primarySources = viewElem.selectSingleNode("Sources/Source[@ContextType='Primary']");
                            if ($chk(primarySources))
                            {
                                SourcesElem.removeChild(primarySources);
                            }
                        }
                    }

                    //Canvas
                    var CanvasElem = viewElem.selectSingleNode('Canvas');
                    if ($chk(CanvasElem) === false)
                    {
                        CanvasElem = xmlDoc.createElement('Canvas');
                        viewElem.insertBefore(CanvasElem, _viewDesigner.View.controlPropertiesXML);
                    }
                    else
                    {
                        //Clear Canvas
                        _viewDesigner._removeXMLChildNodes(CanvasElem);
                    }

                    var SectionsElem = xmlDoc.createElement('Sections');
                    CanvasElem.appendChild(SectionsElem);

                    //Expressions
                    var ExpressionsElem = viewElem.selectSingleNode('Expressions');
                    if ($chk(ExpressionsElem) === false)
                    {
                        ExpressionsElem = xmlDoc.createElement('Expressions');
                        viewElem.appendChild(ExpressionsElem);
                    }

                    //Toolbar Canvas
                    var ToolbarCanvasElem = SectionsElem.selectSingleNode('Section[@Type="ToolBar"]');
                    var toolbarSection = _viewDesigner.View.element.find('#toolbarSection');
                    if ($chk(ToolbarCanvasElem) === false)
                    {
                        ToolbarCanvasElem = xmlDoc.createElement('Section');
                        ToolbarCanvasElem.setAttribute('ID', toolbarSection.attr("uniqueID"));
                        ToolbarCanvasElem.setAttribute('Type', 'ToolBar');
                        SectionsElem.appendChild(ToolbarCanvasElem);
                    }

                    //add all fields for primary SO
                    _viewDesigner._updatePrimaryFields(xmlDoc);
                    _viewDesigner._updateAssociatedFields(xmlDoc);

                    // if Sources element is empty, remove it
                    var sourcesNode = xmlDoc.selectSingleNode("//Views/View/Sources[not(node())]");
                    if (checkExists(sourcesNode))
                    {
                        sourcesNode.parentNode.removeChild(sourcesNode);
                    }

                    if (_viewDesigner._GetSectionControlCount(toolbarSection) > 0)
                    {
                        _viewDesigner._BuildCanvasSectionXML(xmlDoc, ToolbarCanvasElem, toolbarSection);
                    }
                    else
                    {
                        SectionsElem.removeChild(ToolbarCanvasElem);

                        var toolbarControl = xmlDoc.selectSingleNode("SourceCode.Forms/Views/View/Controls/Control[Name='Toolbar Table']");
                        if ($chk(toolbarControl))
                        {
                            toolbarControl.parentNode.removeChild(toolbarControl);
                        }
                    }

                    //Body Canvas
                    var BodyCanvasElem = SectionsElem.selectSingleNode('Section[@Type="Body"]');
                    var bodySection = _viewDesigner.View.element.find('#bodySection');
                    if ($chk(BodyCanvasElem) === false)
                    {
                        var canvasElemId = bodySection.attr("uniqueID")
                        var canvasID = checkExistsNotEmpty(canvasElemId) ? canvasElemId : String.generateGuid();

                        BodyCanvasElem = xmlDoc.createElement('Section');
                        BodyCanvasElem.setAttribute('ID', canvasID);
                        BodyCanvasElem.setAttribute('Type', 'Body');
                        SectionsElem.appendChild(BodyCanvasElem);
                    }

                    _viewDesigner._BuildCanvasSectionXML(xmlDoc, BodyCanvasElem, bodySection);

                    if (_viewDesigner.View.SelectedViewType === "CaptureList"
                        && _viewDesigner.View.selectedOptions.EnableListEditing)
                    {
                        _viewDesigner._buildEditableRowXML(xmlDoc);
                    }

                    //Begin Remove orphaned controls... this is a global check that should be removed when the offending code is found that is leaving orphans is fixed
                    var controls = xmlDoc.selectNodes("SourceCode.Forms/Views/View/Controls/Control[not(@Type='View' and @Type)]");
                    for (var i = 0; i < controls.length; i++)
                    {
                        var currentControl = controls[i];
                        var controlID = currentControl.getAttribute("ID");
                        var canvasReferenceNodes = CanvasElem.selectNodes(".//*[@ID='{0}']".format(controlID));
                        if (canvasReferenceNodes.length === 0)
                        {
                            if (_viewDesigner._isToolbarCell(controlID))
                            {
                                //This is the toolbar area's cell control and we would like too keep it in the definition so that the style information is persisted.
                                continue;
                            }
                            _viewDesigner._cleanupControl(currentControl, false, true, true, true, true, true);
                            currentControl.parentNode.removeChild(currentControl);
                        }
                    }
                    //End Remove orphaned controls

                    //Build default View Init Event
                    _viewDesigner._BuildDefaultViewInitEvent();

                    //build default event actions
                    if ($chk(_viewDesigner.View.hiddenSmartObjectXml))
                    {
                        _viewDesigner._setViewDefaultProperties(_viewDesigner.View.hiddenSmartObjectXml);

                        _viewDesigner._BuildDefaultViewListeners(_viewDesigner.View.hiddenSmartObjectXml);
                    }

                    var view = SourceCode.Forms.Designers.View;
                    if (_viewDesigner._getViewType() === "CaptureList")
                    {
                        // configure view node property
                        var listEditable = viewProperties.selectSingleNode("Property[Name='ListEditable']");
                        if (checkExists(listEditable) && checkExists(listEditable.parentNode))
                        {
                            listEditable.parentNode.removeChild(listEditable);
                        }

                        var showAddRows = viewProperties.selectSingleNode("Property[Name='ShowAddRow']");
                        if (checkExists(showAddRows) && checkExists(showAddRows.parentNode))
                        {
                            showAddRows.parentNode.removeChild(showAddRows);
                        }

                        if (_viewDesigner.View.selectedOptions.EnableListEditing)
                        {
                            var value = null;
                            if (view.selectedOptions.EditAllRows)
                            {
                                value = "all";
                            }
                            else
                            {
                                value = "single";
                            }
                            viewProperties.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "ListEditable", value));

                            var boolValue = value === "single" ? true : false;
                            if (view.selectedOptions.EnableAddRowLink === true)
                            {
                                viewProperties.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "ShowAddRow", "true"));
                            }
                        }
                        else
                        {
                            var eventNode = _viewDesigner.View.viewDefinitionXML.selectSingleNode('//Views/View/Events/Event[Name/text()="ListDoubleClick" and (@SourceType="View") and not(@SubFormID) and (@Type="User") and (@SourceID="' + viewId + '") and Handlers/Handler/Actions/Action[(@Type="List") and not(@SubFormID)]]');
                            if (checkExists(eventNode) && checkExists(eventNode.parentNode))
                            {
                                eventNode.parentNode.removeChild(eventNode);
                            }
                        }

                        var pageSize = viewProperties.selectSingleNode("Property[Name='PageSize']");
                        if (checkExists(pageSize))
                        {
                            pageSize.parentNode.removeChild(pageSize);
                        }

                        if (view.selectedOptions.EnablePaging)
                        {
                            viewProperties.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "PageSize", view.selectedOptions.PagingCount));
                        }

                        var filterDisplay = viewProperties.selectSingleNode("Property[Name='FilterDisplay']");
                        if (checkExists(filterDisplay))
                        {
                            filterDisplay.parentNode.removeChild(filterDisplay);
                        }

                        if (view.selectedOptions.EnableFiltering)
                        {
                            viewProperties.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "FilterDisplay", "true"));
                        }

                        var alternateRows = viewProperties.selectSingleNode("Property[Name='AlternateRows']");
                        if (view.selectedOptions.ShadeAlternatingRows)
                        {
                            if (!checkExists(alternateRows))
                            {
                                viewProperties.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "AlternateRows", "true"));
                            }
                        }
                        else if (checkExists(alternateRows) && $chk(alternateRows.parentNode))
                        {
                            alternateRows.parentNode.removeChild(alternateRows);
                        }

                        var boldHeadings = viewProperties.selectSingleNode("Property[Name='BoldHeadings']");
                        if (view.selectedOptions.BoldHeadings)
                        {
                            if (!checkExists(boldHeadings))
                            {
                                viewProperties.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "BoldHeadings", "true"));
                            }
                        }
                        else if (checkExists(boldHeadings) && $chk(boldHeadings.parentNode))
                        {
                            boldHeadings.parentNode.removeChild(boldHeadings);
                        }
                    }

                    if (_viewDesigner._getViewType() === "CaptureList")
                    {
                        _viewDesigner._viewMultiSelect(view.selectedOptions.Multiselect);
                        _viewDesigner._viewCellContentSelect(view.selectedOptions.CellContentSelect);
                    }

                    _viewDesigner._cleanupEmptyRules();
                }

                modalizer.hide();
                return true;
            },

            _isToolbarCell: function (controlId)
            {
                //Toolbar area should only have one cell
                var toolbarCell = $(".editor-table.toolbar .editor-cell").first();
                var toolbarCellId = toolbarCell.attr("id");

                return controlId === toolbarCellId;
            },

            removeOrphanedToolbarCell: function (xmlDoc)
            {
                //Toolbar area should only have one cell
                var toolbarCell = $(".editor-table.toolbar .editor-cell").first();
                var toolbarCellId = toolbarCell.attr("id");

                var controlNode = xmlDoc.selectSingleNode('.//Views/View/Controls/Control[@ID="{0}"]'.format(toolbarCellId));

                var canvasNode = xmlDoc.selectSingleNode('.//Views/View/Canvas');
                var canvasReferenceNodes = canvasNode.selectNodes(".//*[@ID='{0}']".format(toolbarCellId));

                if (canvasReferenceNodes.length === 0)
                {
                    controlNode.parentNode.removeChild(controlNode);
                }

                return xmlDoc;
            },

            _cleanupEmptyRules: function ()
            {
                // get events xml
                var eventNodes = _viewDesigner.View.viewDefinitionXML.selectNodes("SourceCode.Forms/Views/View/Events/Event");

                var len = eventNodes.length;
                for (var i = 0; i < len; i++)
                {
                    var eventNode = eventNodes[i];

                    var actions = eventNode.selectNodes("Handlers/Handler/Actions/Action");
                    if (actions.length === 0)
                    {
                        eventNode.parentNode.removeChild(eventNode);
                    }
                }
            },

            _toggleListViewHeadersBold: function (addBold)
            {
                var xmlDoc = _viewDesigner.View.viewDefinitionXML;
                var headerColumns = _viewDesigner.View.element.find("#bodySection").find(".editor-table").find("tbody>tr.header>td.header");
                if (headerColumns.length > 0)
                {
                    for (var i = 0; i < headerColumns.length; i++)
                    {
                        var col = $(headerColumns[i]);

                        // get list heading control
                        var listHeading = col.find("div.controlwrapper");
                        if (listHeading.length === 0)
                            return;

                        var styleNode = SCStyleHelper.getPrimaryStyleNode(_viewDesigner.Styles._getStylesNode(listHeading[0].id, listHeading.attr("controltype")));

                        if (checkExists(styleNode))
                        {

                            var font = styleNode.selectSingleNode("Font");
                            if (!checkExists(font))
                            {
                                font = styleNode.ownerDocument.createElement("Font");
                                styleNode.appendChild(font);
                            }

                            var fontWeight = font.selectSingleNode("Weight");
                            if (!checkExists(fontWeight))
                            {
                                if (addBold)
                                {
                                    fontWeight = styleNode.ownerDocument.createElement("Weight");
                                    fontWeight.appendChild(styleNode.ownerDocument.createTextNode("Bold"));
                                    font.appendChild(fontWeight);
                                }
                            }
                            else
                            {
                                if (addBold)
                                {
                                    if (fontWeight.text !== "Bold")
                                    {
                                        fontWeight.removeChild(fontWeight.firstChild);
                                        fontWeight.appendChild(styleNode.ownerDocument.createTextNode("Bold"));
                                    }
                                }
                                else
                                {
                                    font.removeChild(fontWeight);
                                }
                            }

                            _viewDesigner.Styles.populateListHeadingControlStyle(listHeading, styleNode);
                        }
                    } // for each column

                    var table = _viewDesigner.View.element.find("#bodySection").find(".editor-table");
                    table.addClass("refresh-the-control");
                    table.removeClass("refresh-the-control");
                } // headerColumns.length > 0
            },

            _buildEditableRowXML: function (xmlDoc)
            {
                if (_viewDesigner.View.element.find("#editableSection table.capturelist-editor-table>tbody>tr.editor-row").length > 0)
                {
                    var RowsElem = xmlDoc.selectSingleNode("SourceCode.Forms/Views/View/Canvas/Sections/Section[@Type='Body']/Control/Rows");
                    var RowItem = _viewDesigner.View.element.find("#editableSection table.capturelist-editor-table>tbody>tr.editor-row");

                    var rowid = RowItem.attr('id');
                    var RowElem = RowsElem.selectSingleNode('Row[(@ID="' + rowid + '") and (@TemplateName="EditItem")]');
                    if ($chk(RowElem) === false)
                    {
                        RowElem = xmlDoc.createElement('Row');
                        RowElem.setAttribute('ID', rowid);
                        RowsElem.appendChild(RowElem);

                        _viewDesigner._createControl(xmlDoc, { id: rowid, controltype: "Row" });

                        var rowControl = xmlDoc.selectSingleNode("//Views/View/Controls/Control[@ID='{0}']".format(rowid));
                        if (checkExists(rowControl))
                        {
                            _viewDesigner._setPropertiesValue(xmlDoc, rowControl, "Template", "Edit");
                        }
                    }

                    var tds = RowItem.find(">td");

                    for (var t = 0; t < tds.length; t++)
                    {
                        var CellItem = tds.eq(t);
                        var CellsElem = RowElem.selectSingleNode('Cells');
                        if ($chk(CellsElem) === false)
                        {
                            CellsElem = xmlDoc.createElement('Cells');
                            RowElem.appendChild(CellsElem);
                        }

                        var cellid = CellItem.attr('id');
                        var CellElem = CellsElem.selectSingleNode('Cell[@ID="' + cellid + '"]');
                        if ($chk(CellElem) === false)
                        {
                            CellElem = xmlDoc.createElement('Cell');
                            CellElem.setAttribute('ID', cellid);
                            CellsElem.appendChild(CellElem);
                        }

                        //add container to control collection
                        var controlData = {
                            id: cellid,
                            controltype: "Cell",
                            fieldid: null
                        };
                        _viewDesigner._createControl(xmlDoc, controlData);

                        var controls = CellItem.find("div.controlwrapper");

                        for (var c = 0; c < controls.length; c++)
                        {
                            var ControlItem = controls.eq(c);

                            _viewDesigner._BuildControlXML(xmlDoc, CellElem, ControlItem);
                        }
                    }
                }
            },

            _buildEditableListExecuteAction: function (xmlDoc, actionType)
            {
                var viewId = _viewDesigner._GetViewID();
                var viewName = _viewDesigner.View.viewDefinitionXML.documentElement.selectSingleNode("Views/View/Name").text;
                var viewDisplayName = _viewDesigner._GetViewDisplayName();

                action = xmlDoc.createElement("Action");
                action.setAttribute("ID", String.generateGuid());
                action.setAttribute("DefinitionID", String.generateGuid());
                action.setAttribute("Type", "Execute");
                action.setAttribute("ExecutionType", "Synchronous");

                if (actionType === "ListItemAdded")
                {
                    action.setAttribute("ItemState", "Added");
                }
                else if (actionType === "ListItemChanged")
                {
                    action.setAttribute("ItemState", "Changed");
                }
                else if (actionType === "ListItemRemoved")
                {
                    action.setAttribute("ItemState", "Removed");
                }

                properties = xmlDoc.createElement("Properties");
                properties.appendChild(_viewDesigner._createEventingPropertyWithEncoding(xmlDoc, "Location", viewName, viewDisplayName));
                properties.appendChild(_viewDesigner._createEventingPropertyWithEncoding(xmlDoc, "ViewID", viewId, viewDisplayName, viewName));
                properties.appendChild(_viewDesigner._createEventingPropertyWithEncoding(xmlDoc, "Location", "view", viewDisplayName, viewName));

                var methodToExecute = null;
                if (actionType === "ListItemAdded")
                {
                    methodToExecute = _viewDesigner.View.element.find("#vdlistEditAddMethod").val();
                }
                else if (actionType === "ListItemChanged")
                {
                    methodToExecute = _viewDesigner.View.element.find("#vdlistEditEditMethod").val();
                }
                else if (actionType === "ListItemRemoved")
                {
                    methodToExecute = _viewDesigner.View.element.find("#vdlistEditDeleteMethod").val();
                }
                properties.appendChild(_viewDesigner._createEventingPropertyWithEncoding(xmlDoc, "Method", methodToExecute, methodToExecute));
                action.appendChild(properties);

                _viewDesigner._createParametersForEditableListExecuteAction(xmlDoc, action, actionType);

                return action;
            },

            _createParametersForEditableListExecuteAction: function (xmlDoc, action, actionType)
            {
                var soMethod = action.selectSingleNode("Properties/Property[Name='Method']/Value").text;

                var inputProps = _viewDesigner.View.hiddenSmartObjectXml.selectNodes("//smartobject/smartobjectroot/methods/method[@name='" + soMethod + "']/input/property");

                if (inputProps.length > 0)
                {
                    var parameters = xmlDoc.createElement('Parameters');
                    action.appendChild(parameters);

                    for (var i = 0, l = inputProps.length; i < l; i++)
                    {
                        var inputPropName = inputProps[i].getAttribute("name");

                        if (_viewDesigner.View.hiddenSmartObjectXml.selectNodes("//smartobject/smartobjectroot/methods/method[@name='" + soMethod + "']/parameters/parameter[@name='" + inputPropName + "']").length > 0)
                            continue;

                        var field = _viewDesigner.View.viewDefinitionXML.selectSingleNode("SourceCode.Forms/Views/View/Sources/Source[@ContextType='Primary']/Fields/Field[FieldName='" + inputPropName + "']");

                        var fieldDataType = field.getAttribute("DataType");

                        if (actionType === "ListItemAdded" && (fieldDataType === "autonumber" || fieldDataType === "autoguid"))
                            continue;

                        var fieldID = field.getAttribute("ID");
                        var fieldName = field.selectSingleNode("FieldName").text;
                        var fieldSysName = field.selectSingleNode("Name").text;

                        var parameter = xmlDoc.createElement('Parameter');
                        parameter.setAttribute('SourceID', fieldID);
                        parameter.setAttribute('SourceType', 'ViewField');
                        parameter.setAttribute('SourceName', fieldSysName);
                        parameter.setAttribute('SourceDisplayName', fieldName);
                        parameter.setAttribute('TargetID', fieldName);
                        parameter.setAttribute('TargetType', "ObjectProperty");

                        parameters.appendChild(parameter);
                    }
                }
            },

            _buildEditableListEvent: function (actionType, singleRow, actionDisplay)
            {
                // Check single row
                var methodToExecute = null;
                var actionItemState;
                var viewName = _viewDesigner._GetViewName();
                var viewDisplayName = _viewDesigner._GetViewDisplayName();

                if (actionType === "ListItemAdded")
                {
                    methodToExecute = _viewDesigner.View.element.find("#vdlistEditAddMethod").val();
                    actionItemState = "Added";
                }
                else if (actionType === "ListItemChanged")
                {
                    methodToExecute = _viewDesigner.View.element.find("#vdlistEditEditMethod").val();
                    actionItemState = "Changed";
                }
                else if (actionType === "ListItemRemoved")
                {
                    methodToExecute = _viewDesigner.View.element.find("#vdlistEditDeleteMethod").val();
                    actionItemState = "Removed";
                }

                if (!checkExists(methodToExecute))
                {
                    return;
                }
                var ViewType = _viewDesigner._getViewType();
                var viewId = _viewDesigner._GetViewID();
                var viewDef = _viewDesigner.View.viewDefinitionXML;

                var viewName = viewDef.documentElement.selectSingleNode("Views/View/Name").text;

                var eventsXml = viewDef.documentElement.selectSingleNode('Views/View/Events');

                var eventElement = viewDef.selectSingleNode("//Events/Event[(@Type='User') and (@SourceID='" + viewId + "') and (@SourceType='View') and (Name/text()='" + actionType + "')]");
                if (!checkExists(eventElement))
                {
                    eventElement = viewDef.createElement("Event");
                    eventElement.setAttribute('ID', String.generateGuid());
                    eventElement.setAttribute("DefinitionID", String.generateGuid());
                    eventElement.setAttribute('Type', 'User');
                    eventElement.setAttribute('SourceID', viewId);
                    eventElement.setAttribute('SourceType', 'View');
                    eventElement.setAttribute('SourceName', viewName);
                    eventElement.setAttribute('SourceDisplayName', viewDisplayName);
                    eventsXml.appendChild(eventElement);
                }

                var nameElement = eventElement.selectSingleNode("Name");
                if (!checkExists(nameElement))
                {
                    nameElement = viewDef.createElement("Name");
                    nameElement.appendChild(viewDef.createTextNode(actionType));
                    eventElement.appendChild(nameElement);
                }

                var properties = eventElement.selectSingleNode("Properties");
                if (!checkExists(properties))
                {
                    var properties = viewDef.createElement("Properties");
                    properties.appendChild(_viewDesigner._createEventingPropertyWithEncoding(viewDef, "Location", viewName, viewDisplayName));
                    properties.appendChild(_viewDesigner._createEventingPropertyWithEncoding(viewDef, "ViewID", viewId, viewDisplayName, viewName));
                    properties.appendChild(_viewDesigner._createEventingPropertyWithEncoding(viewDef, "RuleFriendlyName", Resources.ViewDesigner.RuleNameViewEventNameCurrent.format(actionDisplay)));
                    eventElement.appendChild(properties);
                }

                var handlers = eventElement.selectSingleNode("Handlers");
                if (!checkExists(handlers))
                {
                    handlers = viewDef.createElement("Handlers");
                    eventElement.appendChild(handlers);
                }

                var handler = eventElement.selectSingleNode("Handlers/Handler");
                if (!checkExists(handler))
                {
                    handler = viewDef.createElement("Handler");
                    handler.setAttribute("ID", String.generateGuid());
                    handler.setAttribute("DefinitionID", String.generateGuid());
                    handlers.appendChild(handler);
                }

                properties = handler.selectSingleNode("Properties");
                if (!checkExists(properties))
                {
                    properties = viewDef.createElement("Properties");
                    properties.appendChild(_viewDesigner._createEventingPropertyWithEncoding(viewDef, "Location", "View", viewDisplayName));
                    handler.appendChild(properties);
                }

                var actions = eventElement.selectSingleNode("Handlers/Handler/Actions");
                if (!checkExists(actions))
                {
                    actions = viewDef.createElement("Actions");
                    handler.appendChild(actions);
                }

                var action = eventElement.selectSingleNode("Handlers/Handler/Actions/Action[(@Type='List') and (Properties/Property[Name='Method']/Value/text()='AcceptItem')]");
                if (!checkExists(action))
                {
                    action = viewDef.createElement("Action");
                    action.setAttribute("ID", String.generateGuid());
                    action.setAttribute("DefinitionID", String.generateGuid());
                    action.setAttribute("Type", "List");
                    action.setAttribute("ExecutionType", "Synchronous");
                    actions.appendChild(action);
                }

                properties = action.selectSingleNode("Properties");
                if (!checkExists(properties))
                {
                    properties = viewDef.createElement("Properties");
                    action.appendChild(properties);
                }

                if (!checkExists(properties.selectSingleNode("Property[(Name/text()='Method') and (Value/text()='AcceptItem')]")))
                {
                    properties.appendChild(_viewDesigner._createEventingPropertyWithEncoding(viewDef, "Method", "AcceptItem", "AcceptItem"));
                }

                if (!checkExists(properties.selectSingleNode("Property[(Name/text()='ViewID') and (Value/text()='" + viewId + "')]")))
                {
                    properties.appendChild(_viewDesigner._createEventingPropertyWithEncoding(viewDef, "ViewID", viewId, viewDisplayName, viewName));
                }

                if (!checkExists(properties.selectSingleNode("Property[(Name/text()='Location') and (Value/text()='view')]")))
                {
                    properties.appendChild(_viewDesigner._createEventingPropertyWithEncoding(viewDef, "Location", "view", viewDisplayName));
                }

                var singleRowActionProperty = eventElement.selectSingleNode("Handlers/Handler/Actions/Action[@ItemState='" + actionItemState + "']/Properties/Property[(Name/text()='Method')]");
                if (singleRow)
                {
                    if (!checkExists(singleRowActionProperty))
                    {
                        actions.appendChild(_viewDesigner._buildEditableListExecuteAction(viewDef, actionType));
                    }
                    else
                    {
                        var singleRowActionMethod = singleRowActionProperty.selectSingleNode("Value").text;
                        if (singleRowActionMethod !== methodToExecute)
                        {
                            properties = singleRowActionProperty.parentNode;
                            properties.removeChild(singleRowActionProperty);
                            properties.parentNode.appendChild(_viewDesigner._createEventingPropertyWithEncoding(viewDef, "Method", methodToExecute, methodToExecute));

                            var singleRowAction = properties.parentNode;

                            // removeParameters
                            var singleRowActionParameters = singleRowAction.selectSingleNode("Parameters");

                            if (checkExists(singleRowActionParameters))
                            {
                                singleRowAction.removeChild(singleRowActionParameters);
                            }

                            _viewDesigner._createParametersForEditableListExecuteAction(viewDef, singleRowAction, actionType);
                        }
                    }
                }
                else
                {
                    var singleRowAction = eventElement.selectSingleNode("Handlers/Handler/Actions/Action[@ItemState='" + actionItemState + "']");
                    if (checkExists(singleRowAction)) // Remove single row action if it exists
                    {
                        singleRowAction.parentNode.removeChild(singleRowAction);
                    }
                }
            },

            _BuildDefaultViewInitEvent: function ()
            {
                var ViewType = _viewDesigner._getViewType();
                var viewId = _viewDesigner._GetViewID();
                var skipChildXpath = false; //This is an optimisation as soon as a parent is null we know all children are null
                var viewName = _viewDesigner._GetViewName();
                var viewDisplayName = _viewDesigner._GetViewDisplayName();

                var eventsElem = _viewDesigner.View.viewDefinitionXML.documentElement.selectSingleNode('Views/View/Events');

                if (!$chk(eventsElem))
                {
                    eventsElem = _viewDesigner.View.viewDefinitionXML.createElement('Events');
                    var viewElem = _viewDesigner.View.viewDefinitionXML.documentElement.selectSingleNode('Views/View');
                    viewElem.appendChild(eventsElem);
                    skipChildXpath = true;
                }

                var event =
                {
                    ID: String.generateGuid(),
                    DefinitionID: String.generateGuid(),
                    Type: "System",
                    SourceID: viewId,
                    SourceType: "View",
                    Name: "Init"
                };
                var eventXpath = "Event[@Type='{0}' and @SourceID='{1}' and @SourceType='{2}' and Name/text()='{3}']".format(event.Type, event.SourceID, event.SourceType, event.Name);
                var eventElem = (skipChildXpath) ? null : eventsElem.selectSingleNode(eventXpath);
                if (!$chk(eventElem))
                {
                    eventElem = _viewDesigner.View.viewDefinitionXML.createElement('Event');

                    eventElem.setAttribute('ID', event.ID);
                    eventElem.setAttribute("DefinitionID", event.DefinitionID);
                    eventElem.setAttribute('Type', event.Type);
                    eventElem.setAttribute('SourceID', event.SourceID);
                    eventElem.setAttribute('SourceType', event.SourceType);
                    eventElem.setAttribute('SourceName', viewName);
                    eventElem.setAttribute('SourceDisplayName', viewDisplayName);

                    var nameElem = _viewDesigner.View.viewDefinitionXML.createElement('Name');
                    nameElem.appendChild(_viewDesigner.View.viewDefinitionXML.createTextNode(event.Name));
                    eventElem.appendChild(nameElem);

                    eventsElem.appendChild(eventElem);
                    skipChildXpath = true;
                }

                var handlersElem = (skipChildXpath) ? null : eventElem.selectSingleNode('Handlers');
                if (!$chk(handlersElem))
                {
                    handlersElem = _viewDesigner.View.viewDefinitionXML.createElement('Handlers');
                    eventElem.appendChild(handlersElem);
                    skipChildXpath = true;
                }

                var handlerElem = (skipChildXpath) ? null : handlersElem.selectSingleNode('Handler');
                if (!$chk(handlerElem))
                {
                    handlerElem = _viewDesigner.View.viewDefinitionXML.createElement('Handler');
                    handlersElem.appendChild(handlerElem);
                    skipChildXpath = true;
                }

                var actionsElem = (skipChildXpath) ? null : handlerElem.selectSingleNode('Actions');
                if (!$chk(actionsElem))
                {
                    actionsElem = _viewDesigner.View.viewDefinitionXML.createElement('Actions');
                    handlerElem.appendChild(actionsElem);
                    skipChildXpath = true;
                }

                //Begin Transfer action
                var controlsEl = _viewDesigner.View.viewDefinitionXML.selectNodes("SourceCode.Forms/Views/View/Controls/Control[@FieldID]");
                var controlsLength = controlsEl.length;

                var transferAction =
                {
                    Type: "Transfer"
                };
                var transferActionElem = (skipChildXpath) ? null : actionsElem.selectSingleNode("Action[@Type='{0}']".format(transferAction.Type));
                if (controlsLength > 0)
                {
                    if (!$chk(transferActionElem))
                    {
                        transferActionElem = _viewDesigner.View.viewDefinitionXML.createElement("Action");
                        transferActionElem.setAttribute('Type', transferAction.Type);
                        actionsElem.appendChild(transferActionElem);
                    }

                    var propertiesElem = transferActionElem.selectSingleNode('Properties');
                    if (!$chk(propertiesElem))
                    {
                        propertiesElem = _viewDesigner.View.viewDefinitionXML.createElement('Properties');
                        propertiesElem.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(_viewDesigner.View.viewDefinitionXML, "ViewID", viewId, viewDisplayName, viewName));
                        transferActionElem.appendChild(propertiesElem);
                    }

                    var paramsEl = transferActionElem.selectSingleNode('Parameters');
                    if (!$chk(paramsEl))
                    {
                        paramsEl = _viewDesigner.View.viewDefinitionXML.createElement('Parameters');
                        transferActionElem.appendChild(paramsEl);
                    }

                    var paramEls = paramsEl.selectNodes("Parameter");

                    if (paramEls.length > 0)
                    {
                        for (var i = 0; i < paramEls.length; i++)
                        {
                            paramEls[i].parentNode.removeChild(paramEls[i]);
                        }
                    }

                    for (var c = 0; c < controlsLength; c++)
                    {
                        var controlEl = controlsEl[c];
                        var controlID = controlEl.getAttribute("ID");
                        var fieldID = controlEl.getAttribute("FieldID");
                        var controlName = _viewDesigner._getControlProperty(controlID, "ControlName");

                        var paramEl = _viewDesigner.View.viewDefinitionXML.createElement('Parameter');
                        paramsEl.appendChild(paramEl);
                        paramEl.setAttribute('SourceID', controlID);
                        paramEl.setAttribute('SourceType', 'Control');
                        paramEl.setAttribute('SourceName', controlName);
                        paramEl.setAttribute('SourceDisplayName', controlName);
                        paramEl.setAttribute('TargetID', fieldID);
                        paramEl.setAttribute('TargetType', "ViewField");
                    }

                }
                else
                {
                    //if there are no controls to transfer to remove the action
                    if ($chk(transferActionElem))
                    {
                        actionsElem.removeChild(transferActionElem);
                    }
                }

                //End Transfer action

                //Action Calculate

                var calculateAction =
                {
                    Type: "Calculate",
                    ExecutionType: "Synchronous",
                    ID: "".generateGuid(),
                    DefinitionID: "".generateGuid()
                };
                var calculateActionElem = (skipChildXpath) ? null : actionsElem.selectSingleNode("Action[@Type='{0}']".format(calculateAction.Type));
                if (!$chk(calculateActionElem))
                {
                    calculateActionElem = _viewDesigner.View.viewDefinitionXML.createElement('Action');
                    calculateActionElem.setAttribute("Type", calculateAction.Type);
                    calculateActionElem.setAttribute("ExecutionType", calculateAction.ExecutionType);
                    calculateActionElem.setAttribute("ID", calculateAction.ID);
                    calculateActionElem.setAttribute("DefinitionID", calculateAction.DefinitionID);

                    actionsElem.appendChild(calculateActionElem);
                }
                //End Action Calculate
                //Action ApplyStyle

                var applyStyleAction =
                {
                    Type: "ApplyStyle",
                    ExecutionType: "Synchronous",
                    ID: "".generateGuid(),
                    DefinitionID: "".generateGuid()
                };
                var applyStyleActionElem = (skipChildXpath) ? null : actionsElem.selectSingleNode("Action[@Type='{0}']".format(applyStyleAction.Type));
                if (!$chk(applyStyleActionElem))
                {
                    applyStyleActionElem = _viewDesigner.View.viewDefinitionXML.createElement('Action');
                    applyStyleActionElem.setAttribute("Type", applyStyleAction.Type);
                    applyStyleActionElem.setAttribute("ExecutionType", applyStyleAction.ExecutionType);
                    applyStyleActionElem.setAttribute("ID", applyStyleAction.ID);
                    applyStyleActionElem.setAttribute("DefinitionID", applyStyleAction.DefinitionID);

                    actionsElem.appendChild(applyStyleActionElem);
                }
                //End Action ApplyStyle
            },

            _updateControlNameForEvents: function (previousValue, newValue, controlID)
            {
                var xmlDoc = SourceCode.Forms.Designers.Common.getDefinitionXML();
                var controlEvents = xmlDoc.selectNodes("//Events/Event[(@SourceID='" + controlID + "') and (@SourceType='Control') and (@Type!='System')][not(Properties/Property[Name/text()='IsCustomName'])]");
                var controlEventsLength = controlEvents.length;

                for (var c = 0; c < controlEventsLength; c++)
                {
                    var currentEvent = controlEvents[c];
                    var ruleNameValueProperty = currentEvent.selectSingleNode("Properties/Property[Name/text()='RuleFriendlyName']/Value");

                    if (checkExists(ruleNameValueProperty))
                    {
                        var currentRuleName = ruleNameValueProperty.text;
                        var newRuleName = currentRuleName.replace(previousValue, newValue);

                        ruleNameValueProperty.removeChild(ruleNameValueProperty.firstChild);
                        ruleNameValueProperty.appendChild(xmlDoc.createTextNode(newRuleName));
                    }
                }
            },

            _GetSmartObjectDefaultMethod: function (ViewType, xml)
            {
                var defaultMethod = '';
                defaultMethod = _viewDesigner.View.ddlistmethod.dropdown("SelectedValue");

                if (!checkExistsNotEmpty(defaultMethod))
                {
                    var xmlDoc;
                    if (typeof xml === "string")
                    {
                        xmlDoc = parseXML(xml);
                    } else
                    {
                        xmlDoc = xml;
                    }

                    var defaultMethodElement = null;

                    switch (ViewType)
                    {
                        case 'CaptureList':
                            defaultMethodElement = xmlDoc.selectSingleNode('smartobject/smartobjectroot/defaults/methods/List');
                            break;
                        case 'Capture':
                            defaultMethodElement = xmlDoc.selectSingleNode('smartobject/smartobjectroot/defaults/methods/Read');
                            break;
                        default:
                            break;
                    }
                    if ($chk(defaultMethodElement) === true)
                    {
                        defaultMethod = defaultMethodElement.getAttribute('name');
                    }
                }

                return defaultMethod;
            },

            _GetSmartObjectDetails: function (xml) // {soid, soname}
            {
                var soid = '';
                var soname = '';
                var soElement = xml.selectSingleNode('smartobject/smartobjectroot');
                if (soElement)
                {
                    soid = soElement.getAttribute('guid');
                    soname = soElement.selectSingleNode('metadata/display/displayname').text;
                }

                return { soid: soid, soname: soname };
            },

            _BuildDefaultViewListeners: function (SmartObjectXml)
            {
                //build the event action for the views default event, only map parameters, not SO properties
                var ViewType = _viewDesigner._getViewType();
                var viewId = _viewDesigner._GetViewID();
                var viewName = _viewDesigner._GetViewName();
                var MethodName = _viewDesigner._GetSmartObjectDefaultMethod(ViewType, SmartObjectXml);

                //if (checkExistsNotEmpty(_viewDesigner.View.ddlistmethod.val()))
                //{
                //	MethodName = _viewDesigner.View.ddlistmethod.val();
                //}

                var soDetails = _viewDesigner._GetSmartObjectDetails(SmartObjectXml); //{soid, soname}

                if (ViewType === "CaptureList" && !_viewDesigner.multipleListMethodsDetected)
                {
                    var eventsElem;
                    var eventElem;
                    var propertiesElem;
                    var nameElem;
                    var handlersElem;
                    var handlerElem;
                    var actionsElem;
                    var actionElem;
                    var createHandler = false;
                    var createEvent = false;
                    var viewName = _viewDesigner._GetViewName();
                    var viewDisplayName = _viewDesigner._GetViewDisplayName();

                    if (_viewDesigner.View.applyGetListMethod)
                    {
                        var methods = _viewDesigner.View._loadConfiguredListMethods();
                        if (_viewDesigner.View.element.find("#vdrefreshListChkbox").is(":checked"))
                        {
                            if (methods.length !== 1)
                            {
                                eventsElem = _viewDesigner.View.viewDefinitionXML.documentElement.selectSingleNode('Views/View/Events');
                                if ($chk(eventsElem) === false)
                                {
                                    eventsElem = _viewDesigner.View.viewDefinitionXML.createElement('Events');
                                    var viewElem = _viewDesigner.View.viewDefinitionXML.documentElement.selectSingleNode('Views/View');
                                    viewElem.appendChild(eventsElem);
                                }

                                eventElem = eventsElem.selectSingleNode('Event[Name/text()="Init" and (@SourceType="View") and (@SourceID="' + viewId + '") and (@Type="User")]');
                                if (!checkExists(eventElem))
                                {
                                    var propertiesElem = _viewDesigner.View.viewDefinitionXML.createElement('Properties');
                                    var nameElem = _viewDesigner.View.viewDefinitionXML.createElement('Name');

                                    eventElem = _viewDesigner.View.viewDefinitionXML.createElement('Event');
                                    eventElem.setAttribute('ID', String.generateGuid());
                                    eventElem.setAttribute("DefinitionID", String.generateGuid());
                                    eventElem.setAttribute('Type', 'User');
                                    eventElem.setAttribute('SourceID', viewId);
                                    eventElem.setAttribute('SourceType', 'View');
                                    eventElem.setAttribute('SourceName', viewName);
                                    eventElem.setAttribute('SourceDisplayName', viewDisplayName);
                                    eventsElem.appendChild(eventElem);
                                    eventElem.appendChild(nameElem);

                                    nameElem.appendChild(_viewDesigner.View.viewDefinitionXML.createTextNode('Init'));

                                    propertiesElem.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(_viewDesigner.View.viewDefinitionXML, "Location", viewName, viewDisplayName));
                                    propertiesElem.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(_viewDesigner.View.viewDefinitionXML, "ViewID", _viewDesigner._GetViewID(), viewDisplayName, viewName));
                                    propertiesElem.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(_viewDesigner.View.viewDefinitionXML, "RuleFriendlyName", Resources.ViewDesigner.RuleNameViewEventNameCurrent.format(Resources.ViewDesigner.ViewEvent_Init)));

                                    eventElem.appendChild(propertiesElem);
                                }

                                handlersElem = eventElem.selectSingleNode("Handlers");
                                if (!checkExists(handlersElem))
                                {
                                    handlersElem = _viewDesigner.View.viewDefinitionXML.createElement('Handlers');
                                    eventElem.appendChild(handlersElem);
                                }

                                handlerElem = handlersElem.selectSingleNode("Handler[not(@Type) and not(Conditions/Condition)]");
                                if (!checkExists(handlerElem))
                                {
                                    handlerElem = _viewDesigner.View.viewDefinitionXML.createElement('Handler');
                                    handlersElem.appendChild(handlerElem);
                                }

                                actionsElem = handlerElem.selectSingleNode("Actions");
                                if (!checkExists(actionsElem))
                                {
                                    actionsElem = _viewDesigner.View.viewDefinitionXML.createElement('Actions');
                                    handlerElem.appendChild(actionsElem);
                                }

                                actionElem = handlersElem.selectSingleNode("Handler[not(@Type) and not(Conditions/Condition)]/Actions/Action[(@Type='Execute') and (Properties/Property[Name='Method']/Value/text()='" + MethodName + "') and not(Properties/Property[Name='ControlID']) and not(Properties/Property[Name='ObjectID'])]");
                                if (!checkExists(actionElem))
                                {
                                    actionElem = _viewDesigner.View.viewDefinitionXML.createElement('Action');
                                    actionElem.setAttribute('Type', 'Execute');

                                    var actionPropertiesElem = _viewDesigner.View.viewDefinitionXML.createElement('Properties');

                                    actionPropertiesElem.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(_viewDesigner.View.viewDefinitionXML, "Method", MethodName));
                                    actionPropertiesElem.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(_viewDesigner.View.viewDefinitionXML, "ViewID", viewId, viewDisplayName, viewName));
                                    actionPropertiesElem.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(_viewDesigner.View.viewDefinitionXML, "Location", "View", viewDisplayName, viewName));

                                    if (!checkExists(actionPropertiesElem.selectSingleNode("Property[Name='Order']")) && $chk(_viewDesigner.View.orderWidgetXml))
                                    {
                                        actionPropertiesElem.appendChild(_viewDesigner._createEventingPropertyWithEncoding(_viewDesigner.View.viewDefinitionXML, "Order", _viewDesigner.View.orderWidgetXml));
                                    }

                                    if (!checkExists(actionPropertiesElem.selectSingleNode("Property[Name='Filter']")) && $chk(_viewDesigner.View.filterWidgetXml))
                                    {
                                        actionPropertiesElem.appendChild(_viewDesigner._createEventingPropertyWithEncoding(_viewDesigner.View.viewDefinitionXML, "Filter", _viewDesigner.View.filterWidgetXml));
                                    }

                                    actionElem.appendChild(actionPropertiesElem);

                                    _viewDesigner._BuildMethodActionParamenters(_viewDesigner.View.viewDefinitionXML, actionElem, { soid: soDetails.soid, methodid: MethodName, type: "list" });
                                    actionsElem.appendChild(actionElem);
                                }
                            }
                            else
                            {
                                var methodProperty = methods[0].parentNode;
                                actionPropertiesElem = methodProperty.parentNode;
                                if (methods[0].text !== MethodName)
                                {
                                    actionPropertiesElem.removeChild(methodProperty);
                                    actionPropertiesElem.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(_viewDesigner.View.viewDefinitionXML, "Method", MethodName, MethodName));
                                }
                            }

                            if (!checkExists(actionPropertiesElem.selectSingleNode("Property[Name='Order']")) && $chk(_viewDesigner.View.orderWidgetXml))
                            {
                                actionPropertiesElem.appendChild(_viewDesigner._createEventingPropertyWithEncoding(_viewDesigner.View.viewDefinitionXML, "Order", _viewDesigner.View.orderWidgetXml));
                            }
                            if (!checkExists(actionPropertiesElem.selectSingleNode("Property[Name='Filter']")) && $chk(_viewDesigner.View.filterWidgetXml))
                            {
                                actionPropertiesElem.appendChild(_viewDesigner._createEventingPropertyWithEncoding(_viewDesigner.View.viewDefinitionXML, "Filter", _viewDesigner.View.filterWidgetXml));
                            }
                        }
                        else
                        {
                            if (methods.length === 1)
                            {
                                if (methods[0].text === MethodName)
                                {
                                    actionElem = methods[0].parentNode.parentNode.parentNode;
                                    actionsElem = actionElem.parentNode;
                                    handlerElem = actionsElem.parentNode;
                                    handlersElem = handlerElem.parentNode;
                                    eventElem = handlersElem.parentNode;
                                    var actions = eventElem.selectNodes("Handlers/Handler/Actions/Action");
                                    if (actions.length > 1)
                                    {
                                        actionsElem.removeChild(actionElem);
                                    }
                                    else
                                    {
                                        eventsElem = eventElem.parentNode;
                                        eventsElem.removeChild(eventElem);
                                    }

                                }
                            }
                        }

                        _viewDesigner.View.applyGetListMethod = false;
                    }
                }
            },

            _GetSectionControlCount: function (section)
            {
                var counter = 0;
                if (section)
                {
                    var children = section.find('.controlwrapper[layouttype="control"][layout!="ToolbarTable"], [layouttype="layoutcontainer"][layout!="ToolbarTable"]');
                    counter = children.length;
                }
                return counter;
            },

            _BuildCanvasSectionXML: function (xmlDoc, SectionElement, Section)
            {
                if (Section)
                {
                    data = { id: SectionElement.getAttribute("ID"), controltype: "Section" };
                    _viewDesigner._createControl(xmlDoc, data);

                    // If attribute is missing, derive type from ID
                    var SectionType = Section.attr("Type");
                    if (!checkExists(SectionType))
                    {
                        switch (Section.attr("id"))
                        {
                            case "toolbarSection":
                                SectionType = "ToolBar";
                                break;
                            case "bodySection":
                                SectionType = "Body";
                                break;
                        }
                    }

                    var controlXml = _viewDesigner.View.viewDefinitionXML.selectSingleNode("//Views/View/Controls/Control[@ID='{0}']".format(data.id));
                    var properties = controlXml.selectSingleNode("Properties");
                    if (!checkExists(properties))
                    {
                        properties = xmlDoc.createElement("Properties");
                        properties.appendChild(_viewDesigner._createEventingPropertyWithEncoding(xmlDoc, "Type", SectionType));
                        controlXml.appendChild(properties);
                    }
                    else
                    {
                        // Finding the Property Node
                        var newProperty = _viewDesigner._createEventingPropertyWithEncoding(xmlDoc, "Type", SectionType);
                        var property = properties.selectSingleNode("Property[Name='Type']");

                        if (checkExists(property))
                        {
                            // Replace with new property, ensure its order in the collection remains the same
                            properties.replaceChild(newProperty, property);
                        }
                        else
                        {
                            // Create it if it did not exist
                            properties.appendChild(newProperty);
                        }
                    }

                    var ChildItems = Section.children();
                    for (var childIndex = 0; childIndex < ChildItems.length; childIndex++)
                    {
                        var ChildItemType = '';
                        var ChildItem = $(ChildItems[childIndex]);

                        if (ChildItem.is("div"))
                        {
                            ChildItemType = ChildItem.attr('layouttype');
                            if ($chk(ChildItemType) === false) ChildItemType = '';

                            switch (ChildItemType)
                            {
                                case 'layoutcontainer':
                                    var exisitingControlsGuids =
                                    {
                                        cells: [],
                                        rows: []
                                    };
                                    _viewDesigner._BuildContainerXML(xmlDoc, SectionElement, ChildItem, exisitingControlsGuids);
                                    break;
                                case 'control':
                                    _viewDesigner._BuildControlXML(xmlDoc, SectionElement, ChildItem);
                                    break;
                            }
                        }
                    }

                }
            },

            _BuildContainerXML: function (xmlDoc, ParentElement, ContainerItem, existingControlsGuids)
            {
                var containerid = ContainerItem.attr('id');
                var ContainerElem = ParentElement.selectSingleNode('Control[@ID="' + containerid + '"]');
                if ($chk(ContainerElem) === false)
                {
                    ContainerElem = xmlDoc.createElement('Control');
                    ContainerElem.setAttribute('ID', containerid);
                    ContainerElem.setAttribute('LayoutType', 'Grid');
                    ParentElement.appendChild(ContainerElem);
                }

                //add container to control collection
                var controlData = {
                    id: containerid,
                    controltype: ContainerItem.attr('layout'),
                    fieldid: null
                };
                _viewDesigner._createControl(xmlDoc, controlData);

                if (controlData.controltype !== "ToolbarTable")
                {
                    //Columns Properties
                    _viewDesigner._BuildColumnsXML(xmlDoc, containerid);
                }

                //styles
                //_viewDesigner._updateStyles(xmlDoc, ContainerElem, containerid);
                var ignoreBreak = false;
                if (ParentElement.getAttribute("Type") === "ToolBar")
                {
                    ignoreBreak = true;
                }


                _viewDesigner._BuildContentXML(xmlDoc, ContainerElem, ContainerItem, ignoreBreak, existingControlsGuids);

                if (existingControlsGuids.rows.length > 0)
                {
                    var options =
                    {
                        itemList: ContainerElem.selectNodes("//Control[(@LayoutType='Grid')and(@ID='{0}')]/Rows/Row".format(containerid)),
                        listOfValidItemGuids: existingControlsGuids.rows
                    };
                    this._RemoveNoLongerExistingItems(options);
                }
                if (existingControlsGuids.cells.length > 0)
                {
                    var options =
                    {
                        itemList: ContainerElem.selectNodes("//Control[(@LayoutType='Grid')and(@ID='{0}')]/Rows/Row/Cells/Cell".format(containerid)),
                        listOfValidItemGuids: existingControlsGuids.cells
                    };
                    this._RemoveNoLongerExistingItems(options);
                }
            },

            _RemoveLayoutItem: function (currentItem, listOfValidItemGuids)
            {
                var controlID = currentItem.getAttribute("ID");
                //if the item doesn't exist in the valid list
                if (!listOfValidItemGuids.contains(controlID))
                {
                    //find all its children and remove them if they don't exist in the valid list
                    for (var i = 0; i < currentItem.childNodes.length; i++)
                    {
                        _viewDesigner._RemoveLayoutItem(currentItem.childNodes[i], listOfValidItemGuids);
                    }

                    // if the item has no children left then we can remove it
                    if (currentItem.childNodes.length === 0)
                    {
                        //remove layout item
                        var parent = currentItem.parentNode;
                        parent.removeChild(currentItem);

                        //remove control node
                        var controlNode = parent.ownerDocument.selectSingleNode("//Control/Control[@ID='']".format(controlID));
                        if (checkExists(controlNode))
                        {
                            controlNode.parentNode.removeChild(controlNode);
                        }
                    }
                }
            },

            _RemoveNoLongerExistingItems: function (o)
            {
                //Remove items that no longer exist
                var itemsLength = o.itemList.length;
                for (var i = 0; i < itemsLength; i++)
                {
                    //recusively Remove All Child Items and there control nodes
                    var currentItem = o.itemList[i];
                    _viewDesigner._RemoveLayoutItem(currentItem, o.listOfValidItemGuids);
                }
            },

            _BuildColumnsXML: function (xmlDoc, containerID)
            {
                //Get Information from DOM
                var jqTable = _viewDesigner.View.element.find("#" + containerID + " .editor-table:first-child");
                var columnsObjectModel = SourceCode.Forms.TableHelper.buildColumnsObjectModel(jqTable);

                var newColumnIds = []; //needed for existing cleanup code below.
                for (var i = 0; i < columnsObjectModel.length; i++)
                {
                    SourceCode.Forms.Designers.Common.updateColumnDefinitionFromObjectModel(xmlDoc, containerID, columnsObjectModel[i]);
                    newColumnIds.push(columnsObjectModel[i].id);
                }

                //Update View definition XML
                var gridControlElement = xmlDoc.selectSingleNode("//Control[(@LayoutType='Grid')and(@ID='" + containerID + "')]");
                var columnsElem = gridControlElement.selectSingleNode("Columns");
                if ($chk(columnsElem))
                {
                    //cleanup removed columns 
                    var options =
                    {
                        itemList: columnsElem.selectNodes('Column'),
                        listOfValidItemGuids: newColumnIds
                    };
                    this._RemoveNoLongerExistingItems(options);
                }
            },

            _BuildTableColumnsXml: function (xmlDoc, ParentElem, ParentItem, existingControlsGuids)
            {
                var columnsObjectModel = SourceCode.Forms.TableHelper.buildColumnsObjectModel(ParentItem);
                for (var i = 0; i < columnsObjectModel.length; i++)
                {
                    var columnObjectModel = columnsObjectModel[i];
                    SourceCode.Forms.Designers.Common.updateColumnDefinitionFromObjectModelInParent(xmlDoc, ParentElem, columnObjectModel);
                }
            },

            //a grid does not have a html structure that follows the structure the Xml Definition wants, 
            //so we have to detect this and add row xml, before returning to the normal Xml creation for each cell.
            _BuildContentXMLForGrid: function (xmlDoc, ParentElem, ParentItem, ignoreBreak, existingControlsGuids)
            {
                var jqGrid = ParentItem;
                var containerid = jqGrid.attr("id");

                //Build column XML for each column xxx
                _viewDesigner._BuildTableColumnsXml(xmlDoc, ParentElem, jqGrid, existingControlsGuids);

                var gridCellPositionInfo = SourceCode.Forms.TableHelper.getGridCellPositionInfoForTable(jqGrid);

                //Build rows XML for each row first
                var rowsObjectModel = SourceCode.Forms.TableHelper.buildRowsObjectModel(jqGrid);
                for (var r = 0; r < rowsObjectModel.length; r++)
                {
                    var rowElement = _viewDesigner._BuildRowXMLFromObjectModel(xmlDoc, ParentElem, rowsObjectModel[r]);
                    existingControlsGuids.rows.push(rowsObjectModel[r].id);

                    var jqCellsInRow = SourceCode.Forms.TableHelper.getCellsInRowIndex(jqGrid, r, gridCellPositionInfo);
                    var Items = jqCellsInRow;
                    for (var childIndex = 0; childIndex < Items.length; childIndex++)
                    {
                        var Item = $(Items[childIndex]);
                        //return to the normal XML procesing for each cell
                        var cellElement = _viewDesigner._BuildCellXML(xmlDoc, rowElement, Item);

                        var itemId = Item.attr('id');
                        //_BuildContainerXML() does a sweep to delete unused row/cell controls.
                        //The cell/row controls that aren't in existingControlsGuids[] will removed from definitionXML.
                        existingControlsGuids.cells.push(itemId);

                        _viewDesigner._BuildContentXML(xmlDoc, cellElement, Item, ignoreBreak, existingControlsGuids);
                    }
                }
            },

            //ParentItem = jQuery element, could be a table/grid
            _BuildContentXML: function (xmlDoc, ParentElem, ParentItem, ignoreBreak, existingControlsGuids)
            {
                //parent item could be the resizzewrapper, the controlwrapper etc etc
                if (ParentItem)
                {
                    ParentItem = $(ParentItem);

                    if (!ParentItem.hasClass("dummy-row"))
                    {
                        if (this._isElementAEditorGrid(ParentItem))
                        {
                            _viewDesigner._BuildContentXMLForGrid(xmlDoc, ParentElem, ParentItem, ignoreBreak, existingControlsGuids);
                        }
                        else
                        {
                            var Items = ParentItem.children();
                            for (var childIndex = 0; childIndex < Items.length; childIndex++)
                            {
                                var thisElement = null;
                                var Item = $(Items[childIndex]);
                                if (Item.length > 0)
                                {
                                    var ItemType = Item.attr('layouttype');

                                    if ($chk(ItemType) === false)
                                    {
                                        ItemType = '';
                                    }
                                    var itemId = Item.attr('id');
                                    switch (ItemType)
                                    {
                                        //i.e. Tables and other layout controls
                                        case 'layoutcontainer':
                                            thisElement = _viewDesigner._BuildContainerXML(xmlDoc, ParentElem, Item, existingControlsGuids);
                                            //once a container XML is built for an Item, it should not need to perform _BuildContentXML for its child elements.
                                            //the child elements should have been built in the _BuildContainerXML.
                                            continue;
                                        case 'control':
                                            thisElement = _viewDesigner._BuildControlXML(xmlDoc, ParentElem, Item);
                                            break;
                                        case 'row':
                                            if (!(Item.hasClass("dummy-row") || Item.hasClass("placeholder-footer")))
                                            {
                                                thisElement = _viewDesigner._BuildRowXML(xmlDoc, ParentElem, Item);
                                                existingControlsGuids.rows.push(itemId);
                                            }
                                            break;
                                        case 'cell':
                                            thisElement = _viewDesigner._BuildCellXML(xmlDoc, ParentElem, Item);
                                            existingControlsGuids.cells.push(itemId);
                                            break;
                                        case 'column':

                                            break;
                                        case 'line-break':
                                            thisElement = _viewDesigner._BuildBreakXML(xmlDoc, ParentElem, Item);
                                            break;
                                        case 'non-breaking-space':
                                            thisElement = _viewDesigner._BuildNonBreakingSpaceXML(xmlDoc, ParentElem, Item);
                                            break;
                                    }
                                    if ($chk(thisElement) === false)
                                    {
                                        thisElement = ParentElem;
                                    }
                                    _viewDesigner._BuildContentXML(xmlDoc, thisElement, Item, ignoreBreak, existingControlsGuids);
                                }
                            }
                        }
                    }
                }
            },

            _BuildNonBreakingSpaceXML: function (xmlDoc, ParentElem, ControlItem)
            {
                var breakElem = xmlDoc.createElement('Space');
                ParentElem.appendChild(breakElem);
            },

            _BuildBreakXML: function (xmlDoc, ParentElem, ControlItem)
            {
                var breakElem = xmlDoc.createElement('Break');
                ParentElem.appendChild(breakElem);
            },

            //xmlDoc = main definition XML document
            //ParentElement = XML parentElement
            //RowObjectModel = a object containing just the attributes of the row {id, height, isHeader, isFooter }
            _BuildRowXMLFromObjectModel: function (xmlDoc, ParentElement, RowObjectModel)
            {
                var rowsElem = ParentElement.selectSingleNode('Rows');
                if ($chk(rowsElem) === false)
                {
                    rowsElem = xmlDoc.createElement('Rows');
                    ParentElement.appendChild(rowsElem);
                }

                var rowid = RowObjectModel.id;
                var rowElem = rowsElem.selectSingleNode('Row[@ID="' + rowid + '"]');
                if ($chk(rowElem) === false)
                {
                    rowElem = xmlDoc.createElement('Row');
                    rowElem.setAttribute('ID', rowid);
                    rowsElem.appendChild(rowElem);

                    _viewDesigner._createControl(xmlDoc, { id: rowid, controltype: "Row" });
                }

                if (_viewDesigner.View.SelectedViewType === "CaptureList")
                {
                    var rowControl = xmlDoc.selectSingleNode("//Views/View/Controls/Control[@ID='{0}']".format(rowid));

                    if (RowObjectModel.isHeader)
                    {
                        _viewDesigner._setPropertiesValue(xmlDoc, rowControl, "Template", "Header");
                    }
                    else if (RowObjectModel.isFooter)
                    {
                        _viewDesigner._setPropertiesValue(xmlDoc, rowControl, "Template", "Footer");
                    }
                    else
                    {
                        _viewDesigner._setPropertiesValue(xmlDoc, rowControl, "Template", "Display");
                    }
                }

                return rowElem;
            },


            //xmlDoc = main definition XML document
            //ParentElement = XML parentElement
            //RowItem = a <TR jquery Element
            _BuildRowXML: function (xmlDoc, ParentElement, RowItem)
            {
                var RowsElem = ParentElement.selectSingleNode('Rows');
                if ($chk(RowsElem) === false)
                {
                    RowsElem = xmlDoc.createElement('Rows');
                    ParentElement.appendChild(RowsElem);
                }

                var rowid = RowItem.attr('id');
                var RowElem = RowsElem.selectSingleNode('Row[@ID="' + rowid + '"]');
                if ($chk(RowElem) === false)
                {
                    RowElem = xmlDoc.createElement('Row');
                    RowElem.setAttribute('ID', rowid);
                    RowsElem.appendChild(RowElem);

                    _viewDesigner._createControl(xmlDoc, { id: rowid, controltype: "Row" });
                }

                if (_viewDesigner.View.SelectedViewType === "CaptureList")
                {
                    var rowControl = xmlDoc.selectSingleNode("//Views/View/Controls/Control[@ID='{0}']".format(rowid));

                    if (RowItem.hasClass("header"))
                    {
                        _viewDesigner._setPropertiesValue(xmlDoc, rowControl, "Template", "Header");
                    }
                    else if (RowItem.hasClass("footer"))
                    {
                        _viewDesigner._setPropertiesValue(xmlDoc, rowControl, "Template", "Footer");
                    }
                    else
                    {
                        _viewDesigner._setPropertiesValue(xmlDoc, rowControl, "Template", "Display");
                    }
                }

                return RowElem;
            },

            _BuildCellXML: function (xmlDoc, ParentElement, CellItem)
            {
                var CellsElem = ParentElement.selectSingleNode('Cells');
                if ($chk(CellsElem) === false)
                {
                    CellsElem = xmlDoc.createElement('Cells');
                    ParentElement.appendChild(CellsElem);
                }

                var cellid = CellItem.attr('id');
                var CellElem = CellsElem.selectSingleNode('Cell[@ID="' + cellid + '"]');
                if ($chk(CellElem) === false)
                {
                    CellElem = xmlDoc.createElement('Cell');
                    CellElem.setAttribute('ID', cellid);
                    CellsElem.appendChild(CellElem);

                    //add container to control collection
                    var controlData = {
                        id: cellid,
                        controltype: "Cell",
                        fieldid: null
                    };
                    _viewDesigner._createControl(xmlDoc, controlData);

                    var cellControl = xmlDoc.selectSingleNode("//Views/View/Controls/Control[@ID='{0}']".format(cellid));

                    _viewDesigner._updateCellProperties(xmlDoc, CellElem, CellItem);
                }

                return CellElem;
            },

            _updateCellProperties: function (xmlDoc, CellElem, thisCell)
            {
                var PropertiesElem = CellElem.selectSingleNode('Properties');

                if ($chk(PropertiesElem) === true)
                {
                    CellElem.removeChild(PropertiesElem);
                }

                if ($chk(thisCell.attr('colSpan')))
                {
                    CellElem.setAttribute("ColumnSpan", thisCell.attr('colSpan'));
                }

                if ($chk(thisCell.attr('rowSpan')))
                {
                    CellElem.setAttribute("RowSpan", thisCell.attr('rowSpan'));
                }
            },

            _BuildControlXML: function (xmlDoc, ParentElem, ControlItem)
            {
                if (ControlItem[0].tagName === "COL")
                {
                    return null;
                }
                var controlid = ControlItem.attr('id');
                var ControlElem = ParentElem.selectSingleNode('Control[@ID="' + controlid + '"]');
                var isListing = 0;
                var ViewType = _viewDesigner._getViewType();

                if (ViewType === 'CaptureList')
                {
                    isListing = 1;
                }

                if ($chk(ControlElem) === false)
                {
                    ControlElem = xmlDoc.createElement('Control');
                    ControlElem.setAttribute('ID', controlid);
                    ParentElem.appendChild(ControlElem);

                    var thisType = ControlItem.attr('propertytype');
                    var references = ControlItem.attr('references');
                    var boundFieldID = ControlItem.attr('propertyid');
                    var isBound = (checkExists(boundFieldID) && boundFieldID !== "");

                    var fieldId = '';
                    var fieldData;

                    var contextId;
                    var contextType;

                    var refSOGuid;
                    var refProp;
                    var refDisplayProperty;
                    var refPropType;
                    var refFriendlyName;
                    var DisplayPropData;
                    var PropData;

                    //build association fields
                    refSOGuid = _viewDesigner._getControlProperty(controlid, 'AssociationSO');
                    if ($chk(refSOGuid) === true)
                    {
                        contextId = controlid.toLowerCase();
                        if (isBound)
                        {
                            contextType = 'Association';
                        }
                        else
                        {
                            contextType = 'External';
                        }

                        //value property
                        refProp = _viewDesigner._getControlProperty(controlid, 'ValueProperty');
                        PropData = _viewDesigner.DragDrop._getAssociationPropertyData(refSOGuid, refProp);
                        refPropType = 'autonumber';
                        refFriendlyName = _viewDesigner._getControlPropertyDisplayValue(controlid, 'ValueProperty');

                        if (checkExists(PropData))
                        {
                            refPropType = PropData.type;
                            refFriendlyName = PropData.friendlyname;
                            fieldData =
                                {
                                    soid: refSOGuid.toLowerCase(),
                                    propertyid: refProp,
                                    propertytype: refPropType,
                                    friendlyname: refFriendlyName,
                                    soname: PropData.soname,
                                    sofriendlyname: PropData.sofriendlyname,
                                    contexttype: contextType,
                                    contextid: contextId,
                                    sourcetype: 'Object',
                                    fieldtype: 'ObjectProperty'
                                };

                            fieldId = _viewDesigner._createField(xmlDoc, fieldData);
                        }

                        //display property
                        refDisplayProperty = _viewDesigner.DragDrop._getAssociationDisplayProperty(refSOGuid, refProp);
                        DisplayPropData = _viewDesigner.DragDrop._getAssociationPropertyData(refSOGuid, refDisplayProperty);
                        if (checkExists(DisplayPropData))
                        {
                            refPropType = DisplayPropData.type;

                            refFriendlyName = DisplayPropData.friendlyname;

                            fieldData =
                                {
                                    soid: refSOGuid.toLowerCase(),
                                    propertyid: refDisplayProperty,
                                    propertytype: refPropType,
                                    friendlyname: refFriendlyName,
                                    soname: DisplayPropData.soname,
                                    sofriendlyname: DisplayPropData.sofriendlyname,
                                    contexttype: contextType,
                                    contextid: contextId,
                                    sourcetype: 'Object',
                                    fieldtype: 'ObjectProperty'
                                };
                            _viewDesigner._createField(xmlDoc, fieldData);
                        }
                    }

                    if (isBound)
                    {
                        var soID = ControlItem.attr('soid');
                        var propertyID = ControlItem.attr('propertyid');
                        PropData = "";

                        if (checkExistsNotEmpty(soID) && checkExistsNotEmpty(propertyID))
                        {
                            soID = soID.toLowerCase();
                            PropData = _viewDesigner.DragDrop._getSmartObjectPropertyData(soID, propertyID);
                        }

                        if (checkExistsNotEmpty(PropData))
                        {
                            fieldData =
                                {
                                    soid: soID,
                                    propertyid: propertyID,
                                    propertytype: PropData.type,
                                    friendlyname: PropData.friendlyname,
                                    soname: PropData.soname,
                                    sofriendlyname: PropData.sofriendlyname,
                                    contexttype: 'Primary',
                                    contextid: soID,
                                    sourcetype: 'Object',
                                    fieldtype: 'ObjectProperty'
                                };
                            fieldId = _viewDesigner._createField(xmlDoc, fieldData);
                        }
                        else
                        {
                            var ControlElement = xmlDoc.selectSingleNode('//Views/View/Controls/Control[@ID="' + controlid + '"]');

                            if (checkExistsNotEmpty(ControlElement))
                            {
                                fieldId = ControlElement.getAttribute("FieldID");
                            }
                            else
                            {
                                fieldId = "";
                            }
                        }
                    }

                    //events
                    var createControlEvents = true;
                    if ($chk(ControlItem.attr("flag")))
                    {
                        createControlEvents = false;
                    }

                    //controls
                    var controlData = {
                        id: ControlItem.attr('id'),
                        controltype: ControlItem.attr('controltype'),
                        fieldid: fieldId,
                        expressionid: _viewDesigner._getControlProperty(controlid, 'ControlExpression')
                    };

                    _viewDesigner._createControl(xmlDoc, controlData);

                    if (createControlEvents)
                    {
                        var controlId = ControlItem.attr('id');
                        var index = _viewDesigner.View.DragDrop._newControlIds.indexOf(controlId);
                        var found = false;
                        while (index > -1)
                        {
                            found = true;
                            _viewDesigner.View.DragDrop._newControlIds.splice(index, 1);
                            index = _viewDesigner.View.DragDrop._newControlIds.indexOf(controlId);
                        }

                        if (found)
                        {
                            // ensure events node
                            var eventsNode = xmlDoc.selectSingleNode("//Views/View/Events");
                            if (!checkExists(eventsNode))
                            {
                                eventsNode = xmlDoc.createElement("Events");
                                xmlDoc.selectSingleNode("//Views/View").appendChild(eventsNode);
                            }

                            var context =
                            {
                                designer: _viewDesigner,
                                designerDefinition: xmlDoc,
                                controlType: ControlItem.attr('controltype'),
                                controlId: ControlItem.attr('id'),
                                fieldId: fieldId,
                                controlDefaultProperties: SourceCode.Forms.Designers.Common.controlDefinitionsXml.selectSingleNode("Controls/Control[Name='{0}']".format(ControlItem.attr('controltype'))),
                                eventsNode: eventsNode,
                                designerType: "view",
                                eventType: "create"
                            };

                            var setRuleMethod = SourceCode.Forms.Designers.getControlSetRulesMethod(context.controlType);
                            if (checkExists(setRuleMethod))
                            {
                                setRuleMethod(context);
                            }
                            else
                            {
                                var eventData = {
                                    controlid: controlid,
                                    controltype: ControlItem.attr('controltype'),
                                    fieldid: fieldId
                                };
                                _viewDesigner._createEvent(xmlDoc, eventData);

                                var validationMethod = SourceCode.Forms.Designers.Common.controlDefinitionsXml.selectSingleNode("Controls/Control[Name='" + ControlItem.attr('controltype') + "']").getAttribute("validationMethod");
                                if ($chk(validationMethod))
                                {
                                    _viewDesigner._buildDefaultControlValidationEvent(xmlDoc, eventData);
                                }
                            }
                            SourceCode.Forms.Designers.Rule.EventHelper.ensureCorrectSmartObjectDetails(context);
                        }

                    }
                }
            },

            _buildEditableList_DefaultToolbarButtonEvent: function (xmlDoc, thisControl)
            {
                var viewElem = _viewDesigner._getViewElem(xmlDoc);
                var viewName = _viewDesigner._GetViewName();
                var EventsElem = viewElem.selectSingleNode('Events');
                var EventElem;
                var ruleName;
                var ruleDesc;
                var viewDiplayName = _viewDesigner._GetViewDisplayName();

                if ($chk(EventsElem) === true)
                {
                    EventElem = xmlDoc.selectSingleNode("SourceCode.Forms/Views/View/Events/Event[(@Type='User') and (@SourceType='Control') and (@SourceID='" + thisControl.attr("id") + "')]");
                    if ($chk(EventElem) === false)
                    {
                        var method;
                        var controlName = _viewDesigner._getControlProperty(thisControl.attr('id'), "ControlName");
                        ruleName = Resources.ViewDesigner.MethodBehaviourName.format(controlName, Resources.ViewDesigner.ControlEvent_OnClick);
                        switch (thisControl.attr('flag'))
                        {
                            case 'auto-capturelist-add':
                                method = 'AddItem';
                                ruleDesc = Resources.ViewDesigner.EditableAddRowDesc;
                                break;
                            case 'auto-capturelist-edit':
                                method = 'EditItem';
                                ruleDesc = Resources.ViewDesigner.EditableEditRowDesc;
                                break;
                            case 'auto-capturelist-delete':
                                method = 'RemoveItem';
                                ruleDesc = Resources.ViewDesigner.EditableRemoveRowDesc;
                                break;
                        }

                        EventElem = xmlDoc.createElement('Event');
                        EventElem.setAttribute('ID', String.generateGuid());
                        EventElem.setAttribute("DefinitionID", String.generateGuid());
                        EventElem.setAttribute('Type', 'User');
                        EventElem.setAttribute('SourceType', 'Control');
                        EventElem.setAttribute('SourceName', controlName);
                        EventElem.setAttribute('SourceDisplayName', controlName);
                        EventElem.setAttribute('SourceID', thisControl.attr('id'));

                        var NameElem = xmlDoc.createElement('Name');
                        NameElem.appendChild(xmlDoc.createTextNode('OnClick'));

                        var propertiesElem = _viewDesigner.View.viewDefinitionXML.createElement('Properties');
                        var actionPropertiesElem = _viewDesigner.View.viewDefinitionXML.createElement('Properties');
                        var namePropertiesElem = _viewDesigner.View.viewDefinitionXML.createElement('Property');
                        var namePropertiesNameElem = _viewDesigner.View.viewDefinitionXML.createElement('Name');
                        var namePropertiesValueElem = _viewDesigner.View.viewDefinitionXML.createElement('Value');
                        var DescriptionPropertiesElem = _viewDesigner.View.viewDefinitionXML.createElement('Property');
                        var DescriptionPropertiesNameElem = _viewDesigner.View.viewDefinitionXML.createElement('Name');
                        var DescriptionPropertiesDescriptionElem = _viewDesigner.View.viewDefinitionXML.createElement('Value');
                        propertiesElem.appendChild(namePropertiesElem);
                        propertiesElem.appendChild(DescriptionPropertiesElem);
                        namePropertiesElem.appendChild(namePropertiesNameElem);
                        namePropertiesElem.appendChild(namePropertiesValueElem);
                        DescriptionPropertiesElem.appendChild(DescriptionPropertiesNameElem);
                        DescriptionPropertiesElem.appendChild(DescriptionPropertiesDescriptionElem);
                        namePropertiesNameElem.appendChild(_viewDesigner.View.viewDefinitionXML.createTextNode("RuleFriendlyName"));
                        namePropertiesValueElem.appendChild(_viewDesigner.View.viewDefinitionXML.createTextNode(ruleName));
                        DescriptionPropertiesNameElem.appendChild(_viewDesigner.View.viewDefinitionXML.createTextNode("RuleDescription"));
                        DescriptionPropertiesDescriptionElem.appendChild(_viewDesigner.View.viewDefinitionXML.createTextNode(ruleDesc));
                        EventElem.appendChild(propertiesElem);

                        var handlersElem = xmlDoc.createElement('Handlers');
                        var handlerElem = xmlDoc.createElement('Handler');
                        var ListenersElem = xmlDoc.createElement('Actions');
                        var ListenerElem = xmlDoc.createElement('Action');

                        actionPropertiesElem.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(_viewDesigner.View.viewDefinitionXML, "ViewID", _viewDesigner._GetViewID(), viewDiplayName, viewName));
                        actionPropertiesElem.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(_viewDesigner.View.viewDefinitionXML, "Method", method, method));
                        actionPropertiesElem.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(_viewDesigner.View.viewDefinitionXML, "Location", "View", viewDiplayName, viewName));

                        propertiesElem.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(_viewDesigner.View.viewDefinitionXML, "Location", viewName, viewDiplayName));
                        propertiesElem.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(_viewDesigner.View.viewDefinitionXML, "ViewID", _viewDesigner._GetViewID(), viewDiplayName, viewName));

                        ListenerElem.setAttribute('Type', 'List');

                        ListenerElem.appendChild(actionPropertiesElem);
                        ListenersElem.appendChild(ListenerElem);
                        handlerElem.appendChild(ListenersElem);
                        handlersElem.appendChild(handlerElem);
                        EventElem.appendChild(handlersElem);
                        EventsElem.appendChild(EventElem);
                        EventElem.appendChild(NameElem);
                    }
                }
            },

            _buildDefaultControlValidationEvent: function (xmlDoc, data)
            {
                var thisEventId = '';
                var viewElem = _viewDesigner._getViewElem(xmlDoc);
                var viewName = _viewDesigner._GetViewName();
                var controlName = _viewDesigner._getControlProperty(data.controlid, "ControlName");
                if ($chk(viewElem) === true)
                {
                    var EventsElem = viewElem.selectSingleNode('Events');
                    if ($chk(EventsElem) === false)
                    {
                        EventsElem = xmlDoc.createElement('Events');
                        viewElem.appendChild(EventsElem);
                    }

                    var checkNode = _viewDesigner.View.viewDefinitionXML.documentElement.selectSingleNode('Views/View/Events/Event[@SourceType="Control" and @SourceID="' + data.controlid + '" and @SourceType = "Control"]/Handlers/Handler/Actions/Action[@Type="Validate"]');

                    if ($chk(checkNode) === false)
                    {
                        thisEventId = String.generateGuid();
                        var EventElem = _viewDesigner.View.viewDefinitionXML.documentElement.selectSingleNode('Views/View/Events/Event[@SourceType="Control" and @SourceID="' + data.controlid + '" and @Type = "System"]');
                        if ($chk(EventElem) === false)
                        {
                            EventElem = xmlDoc.createElement('Event');
                            var EventNameElem = xmlDoc.createElement('Name');
                            var EventNameCData = xmlDoc.createTextNode('OnChange');

                            EventElem.setAttribute('ID', thisEventId);
                            EventElem.setAttribute("DefinitionID", String.generateGuid());
                            EventElem.setAttribute('Type', 'System');
                            EventElem.setAttribute('SourceID', data.controlid);
                            EventElem.setAttribute('SourceType', 'Control');
                            EventElem.setAttribute('SourceName', controlName);
                            EventElem.setAttribute('SourceDisplayName', controlName);

                            EventElem.appendChild(EventNameElem);
                            EventNameElem.appendChild(EventNameCData);
                            EventsElem.appendChild(EventElem);
                        }

                        var handlersElem = EventElem.selectSingleNode("Handlers");
                        if ($chk(handlersElem) === false)
                        {
                            handlersElem = xmlDoc.createElement('Handlers');
                            EventElem.appendChild(handlersElem);
                        }

                        var handlerElem = handlersElem.selectSingleNode("Handler");
                        if ($chk(handlerElem) === false)
                        {
                            handlerElem = xmlDoc.createElement('Handler');
                            handlersElem.appendChild(handlerElem);
                        }

                        var EventListenersElem = handlerElem.selectSingleNode("Actions");
                        if ($chk(EventListenersElem) === false)
                        {
                            EventListenersElem = xmlDoc.createElement('Actions');
                            handlerElem.appendChild(EventListenersElem);
                        }

                        var ListenerElem = xmlDoc.createElement('Action');
                        var propertiesElem = xmlDoc.createElement('Properties');

                        propertiesElem.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "ViewID", _viewDesigner._GetViewID(), _viewDesigner._GetViewDisplayName(), viewName));
                        propertiesElem.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "ControlID", data.controlid, controlName, controlName));

                        ListenerElem.setAttribute('ID', String.generateGuid());
                        ListenerElem.setAttribute('Type', 'Validate');

                        ListenerElem.appendChild(propertiesElem);
                        EventListenersElem.appendChild(ListenerElem);
                        handlerElem.appendChild(EventListenersElem);
                        handlersElem.appendChild(handlerElem);

                    }
                }
            },

            createControlEvents: function (xmlDoc, data)
            {
                _viewDesigner._createEvent(xmlDoc, data);

                var validationMethod = data.controlDefaultProperties.getAttribute("validationMethod");
                if ($chk(validationMethod))
                {
                    _viewDesigner._buildDefaultControlValidationEvent(xmlDoc, data);
                }
            },

            _createEvent: function (xmlDoc, data)
            {
                var thisEventId = '';
                var viewElem = _viewDesigner._getViewElem(xmlDoc);
                if ($chk(viewElem) === true)
                {
                    var EventsElem = viewElem.selectSingleNode('Events');
                    if ($chk(EventsElem) === false)
                    {
                        EventsElem = xmlDoc.createElement('Events');
                        viewElem.appendChild(EventsElem);
                    }

                    //get control default event name
                    var defaulteventdata = _viewDesigner._getControlEventProperties(data.controltype);
                    var controlName = _viewDesigner._getControlProperty(data.controlid, "ControlName");

                    if ($chk(defaulteventdata) === true && $chk(defaulteventdata.defaultevent))
                    {
                        var EventElem = _viewDesigner.View.viewDefinitionXML.documentElement.selectSingleNode('Views/View/Events/Event[(@SourceType="Control") and (@SourceID="' + data.controlid + '") and (@Type="System") and (Name/text()="' + defaulteventdata.defaultevent + '")]');

                        if ($chk(EventElem) === false)
                        {
                            thisEventId = String.generateGuid();
                            EventElem = xmlDoc.createElement('Event');
                            EventElem.setAttribute('ID', thisEventId);
                            EventElem.setAttribute("DefinitionID", String.generateGuid());
                            EventElem.setAttribute('Type', 'System');
                            EventElem.setAttribute('SourceID', data.controlid);
                            EventElem.setAttribute('SourceType', 'Control');
                            EventElem.setAttribute('SourceName', controlName);
                            EventElem.setAttribute('SourceDisplayName', controlName);

                            var EventNameElem = xmlDoc.createElement('Name');
                            EventElem.appendChild(EventNameElem);

                            var EventNameCData = xmlDoc.createTextNode(defaulteventdata.defaultevent);
                            EventNameElem.appendChild(EventNameCData);
                            EventsElem.appendChild(EventElem);
                        }

                        var listenerData = null;
                        switch (parseInt(defaulteventdata.controlclass))
                        {
                            case 0: //input
                            case 1: //listing
                            case 2: //display
                                if ($chk(data.fieldid) === true)
                                {
                                    // we need to check if any additional transfer events have been configure and remove them if they exist
                                    var existingTransferActions = EventElem.selectNodes("Handlers/Handler/Actions/Action[@Type='Transfer'][Parameters/Parameter[@SourceID='{0}']]".format(data.controlid));
                                    var actionsLength = existingTransferActions.length;
                                    if (actionsLength > 0)
                                    {
                                        // found, now remove them
                                        for (var i = 0; i < actionsLength; i++)
                                        {
                                            var actionNode = existingTransferActions[i];
                                            actionNode.parentNode.removeChild(actionNode);
                                        }
                                    }

                                    var transferAction = EventElem.selectSingleNode("Handlers/Handler/Actions/Action[(@Type='Transfer') and (Parameters/Parameter[(@SourceID='" + data.controlid + "') and (@SourceType='Control') and (@TargetID='" + data.fieldid + "') and (@TargetType='ViewField')])]");

                                    if (!checkExists(transferAction))
                                    {
                                        listenerData = {
                                            action: 'transfer',
                                            controlid: data.controlid,
                                            controltype: data.controltype,
                                            fieldid: data.fieldid
                                        };

                                        //create actions
                                        if ($chk(listenerData) === true)
                                        {
                                            _viewDesigner._createEventListener(xmlDoc, EventElem, listenerData);
                                        }
                                    }
                                }

                                var calculateAction = EventElem.selectSingleNode("Handlers/Handler/Actions/Action[(@Type='Calculate')]");
                                if (!checkExists(calculateAction))
                                {
                                    //create calculate actions
                                    listenerData = {
                                        action: 'calculate',
                                        controlid: data.controlid,
                                        controltype: data.controltype,
                                        fieldid: null
                                    };

                                    //create actions
                                    if ($chk(listenerData) === true)
                                    {
                                        _viewDesigner._createEventListener(xmlDoc, EventElem, listenerData);
                                    }
                                }

                                var styleAction = EventElem.selectSingleNode("Handlers/Handler/Actions/Action[(@Type='ApplyStyle')]");
                                if (!checkExists(styleAction))
                                {
                                    //create ApplyStyle actions
                                    listenerData = {
                                        action: 'applystyle',
                                        controlid: data.controlid,
                                        controltype: data.controltype,
                                        fieldid: null
                                    };

                                    //create ApplyStyle actions
                                    if ($chk(listenerData) === true)
                                    {
                                        _viewDesigner._createEventListener(xmlDoc, EventElem, listenerData);
                                    }
                                }

                                break;
                            case 3: //action
                                break;
                        }
                    }
                }
                return thisEventId;
            },

            _createEventListener: function (xmlDoc, EventElem, data)
            {
                //data = { action: 'execute/transfer', controlid, controltype, [fieldid] }
                var thisEventListenerId = '';
                var viewElem = _viewDesigner._getViewElem(xmlDoc);
                var viewName = _viewDesigner._GetViewName();
                if ($chk(viewElem) === true)
                {
                    var EventHandlersElem = EventElem.selectSingleNode('Handlers');
                    if ($chk(EventHandlersElem) === false)
                    {
                        EventHandlersElem = xmlDoc.createElement('Handlers');
                        EventElem.appendChild(EventHandlersElem);
                    }

                    var EventHandlerElem = EventHandlersElem.selectSingleNode('Handler');
                    if ($chk(EventHandlerElem) === false)
                    {
                        EventHandlerElem = xmlDoc.createElement('Handler');
                        EventHandlersElem.appendChild(EventHandlerElem);
                    }

                    var EventListenersElem = EventHandlerElem.selectSingleNode('Actions');
                    if ($chk(EventListenersElem) === false)
                    {
                        EventListenersElem = xmlDoc.createElement('Actions');
                        EventHandlerElem.appendChild(EventListenersElem);
                    }

                    var ListenerElem;
                    var propertiesEl = xmlDoc.createElement('Properties');

                    switch (data.action)
                    {
                        case 'transfer':
                            if ($chk(data.fieldid) === true)
                            {
                                ListenerElem = xmlDoc.createElement('Action');
                                ListenerElem.setAttribute('ID', String.generateGuid());
                                ListenerElem.setAttribute('Type', 'Transfer');

                                propertiesEl.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(xmlDoc, "ViewID", _viewDesigner._GetViewID(), _viewDesigner._GetViewDisplayName(), viewName));
                                var controlName = _viewDesigner._getControlProperty(data.controlid, "ControlName");
                                //Parameters
                                var ParametersElem = xmlDoc.createElement('Parameters');
                                var ParameterElem = xmlDoc.createElement('Parameter');

                                ParameterElem.setAttribute('SourceID', data.controlid);
                                ParameterElem.setAttribute('SourceType', 'Control');
                                ParameterElem.setAttribute('SourceName', controlName);
                                ParameterElem.setAttribute('SourceDisplayName', controlName);
                                ParameterElem.setAttribute('TargetID', data.fieldid);
                                ParameterElem.setAttribute('TargetType', 'ViewField');

                                ParametersElem.appendChild(ParameterElem);
                                ListenerElem.appendChild(ParametersElem);
                                if (EventListenersElem.childNodes.length > 0)
                                {
                                    EventListenersElem.insertBefore(ListenerElem, EventListenersElem.childNodes.item(0));
                                }
                                else
                                {
                                    EventListenersElem.appendChild(ListenerElem);
                                }
                            }
                            break;
                        case 'calculate':
                            ListenerElem = xmlDoc.createElement('Action');
                            ListenerElem.setAttribute('ID', String.generateGuid());
                            ListenerElem.setAttribute('Type', 'Calculate');
                            ListenerElem.setAttribute('ExecutionType', 'Synchronous');

                            EventListenersElem.appendChild(ListenerElem);
                            break;
                        case 'applystyle':
                            ListenerElem = xmlDoc.createElement('Action');
                            ListenerElem.setAttribute('ID', String.generateGuid());
                            ListenerElem.setAttribute('Type', 'ApplyStyle');
                            ListenerElem.setAttribute('ExecutionType', 'Synchronous');

                            EventListenersElem.appendChild(ListenerElem);
                            break;

                    }

                    ListenerElem.appendChild(propertiesEl);
                }
                return thisEventListenerId;
            },

            _selectViewAction: function (ev)
            {
                var grid = _viewDesigner.View._getTargetGrid();
                var gridType = SourceCode.Forms.Designers.Common.Rules.getGridType(grid);
                var toolEditAction = grid.children(".grid-toolbars").find(".toolbar-button.edit");
                var toolRemoveAction = grid.children(".grid-toolbars").find(".toolbar-button.delete");
                var toolruleEnabledDivider = _viewDesigner.View.element.find("#vdRuleEnabledDivider");
                var toolruleLayoutEnabledDivider = _viewDesigner.View.element.find("#vdRuleLayoutEnabledDivider");
                var selectedRuleID = "";
                var selectedEvent = "";
                var selectedEventIsReference = "";
                var selectedEventIsEnabled = "";

                if (gridType === "list")
                {
                    var rule;
                    var radioboxelement;
                    if (checkExistsNotEmpty(ev))
                    {
                        rule = $(ev.currentTarget);
                        radioboxelement = rule.closest("li").find(">label input[type=radio]");
                        radioboxelement.radioboxbutton().radioboxbutton("check");
                    }
                    if (checkExists(rule) && (rule.length > 0))
                    {
                        selectedRuleID = rule.attr("id");
                    }
                    selectedEvent = _viewDesigner.View.viewDefinitionXML.selectSingleNode("SourceCode.Forms/Views/View/Events/Event[@ID='" + selectedRuleID + "']");
                    selectedEventIsReference = selectedEvent.getAttribute("IsReference");
                    selectedEventIsEnabled = selectedEvent.getAttribute("IsEnabled");
                }
                else
                {
                    selectedRuleID = _viewDesigner.View.currentGridObject.getSelectedID(grid);
                    selectedEvent = _viewDesigner.View.viewDefinitionXML.selectSingleNode("SourceCode.Forms/Views/View/Events/Event[@ID='" + selectedRuleID + "']");
                    selectedEventIsReference = selectedEvent.getAttribute("IsReference");
                    selectedEventIsEnabled = selectedEvent.getAttribute("IsEnabled");
                }

                if (checkExistsNotEmpty(selectedRuleID))
                {
                    toolEditAction.removeClass('hidden');
                    toolEditAction.removeClass('disabled');

                    toolruleEnabledDivider.removeClass("hidden");
                    toolruleLayoutEnabledDivider.removeClass("hidden");

                    if (selectedEventIsReference === "False" || !$chk(selectedEventIsReference))
                    {
                        toolRemoveAction.removeClass('hidden');
                        if (toolRemoveAction.hasClass('disabled'))
                        {
                            toolRemoveAction.removeClass('disabled');
                        }
                    }
                    else
                    {
                        toolRemoveAction.removeClass('hidden');
                        if (!toolRemoveAction.hasClass('disabled'))
                        {
                            toolRemoveAction.addClass('disabled');
                        }
                    }

                    if (selectedEventIsEnabled === "True" || !$chk(selectedEventIsEnabled))
                    {
                        _viewDesigner.View.activateDisableButton(grid);
                    }
                    else
                    {
                        _viewDesigner.View.activateEnableButton(grid);
                    }
                }
                else
                {
                    _viewDesigner.View.defaultButtonState();
                }

                SourceCode.Forms.Designers.resizeToolBarButtons("vdFormEventsTabGrid");
            },

            _unselectViewAction: function (ev)
            {
                var grid = _viewDesigner.View._getTargetGrid();
                var gridType = SourceCode.Forms.Designers.Common.Rules.getGridType(grid);

                if (gridType === "list")
                {
                    var rule;
                    var radioboxelement;
                    if (checkExistsNotEmpty(ev))
                    {
                        rule = $(ev.currentTarget);
                        radioboxelement = rule.closest("li").find(">label input[type=radio]");
                        radioboxelement.radioboxbutton().radioboxbutton("uncheck");
                    }
                }

                var toolEditAction = grid.children(".grid-toolbars").find(".toolbar-button.edit");
                var toolRemoveAction = grid.children(".grid-toolbars").find(".toolbar-button.remove");

                toolEditAction.addClass('disabled');
                toolRemoveAction.addClass('disabled');
            },

            _getControlPropertyDisplayValue: function (controlID, propertyName)
            {
                var xmlPropertiesDoc = _viewDesigner.View.controlPropertiesXML;
                if ($chk(xmlPropertiesDoc) === true)
                {
                    var ControlElem = xmlPropertiesDoc.selectSingleNode('Control[@ID="' + controlID + '"]');
                    if ($chk(ControlElem) === true)
                    {
                        var PropDesigntimeElem = ControlElem.selectSingleNode('Properties/Property[Name="' + propertyName + '"]/DisplayValue');
                        if ($chk(PropDesigntimeElem) === true)
                        {
                            return PropDesigntimeElem.text;
                        }

                        PropDesigntimeElem = ControlElem.selectSingleNode('Properties/Property[Name="' + propertyName + '"]/Value');
                        if ($chk(PropDesigntimeElem) === true)
                        {
                            return PropDesigntimeElem.text;
                        }
                    }
                }

                return "";
            },

            _createControl: function (xmlDoc, data)
            {
                var thisControlId = '';
                var viewElem = _viewDesigner._getViewElem(xmlDoc);
                if ($chk(viewElem) === true)
                {
                    var ControlsElem = viewElem.selectSingleNode('Controls');
                    thisControlId = data.id;

                    var ControlElem = ControlsElem.selectSingleNode('Control[@ID="' + thisControlId + '"]');
                    if ($chk(ControlElem) === false)
                    {
                        ControlElem = xmlDoc.createElement('Control');
                        ControlsElem.appendChild(ControlElem);
                    }

                    ControlElem.setAttribute('ID', thisControlId);
                    ControlElem.setAttribute('Type', data.controltype);
                    if ($chk(data.fieldid) === true)
                    {
                        ControlElem.setAttribute('FieldID', data.fieldid);
                    }
                    else
                    {
                        ControlElem.removeAttribute('FieldID');
                    }

                    if ($chk(data.expressionid) === true)
                    {
                        ControlElem.setAttribute('ExpressionID', data.expressionid);
                    }
                    else
                    {
                        ControlElem.removeAttribute('ExpressionID');
                    }

                    ControlNameElem = ControlElem.selectSingleNode('Name');
                    if ($chk(ControlNameElem))
                    {
                        ControlNameElem.parentNode.removeChild(ControlNameElem);
                    }
                    ControlNameElem = xmlDoc.createElement('Name');
                    ControlElem.appendChild(ControlNameElem);

                    controlDisplayNameElem = ControlElem.selectSingleNode('DisplayName');
                    if ($chk(controlDisplayNameElem))
                    {
                        controlDisplayNameElem.parentNode.removeChild(controlDisplayNameElem);
                    }
                    controlDisplayNameElem = xmlDoc.createElement('DisplayName');
                    ControlElem.appendChild(controlDisplayNameElem);

                    controlNameValueElem = ControlElem.selectSingleNode('NameValue');
                    if ($chk(controlNameValueElem))
                    {
                        controlNameValueElem.parentNode.removeChild(controlNameValueElem);
                    }
                    controlNameValueElem = xmlDoc.createElement('NameValue');
                    ControlElem.appendChild(controlNameValueElem);

                    var name = _viewDesigner._getControlProperty(thisControlId, "ControlName");
                    if ($chk(data.name))
                    {
                        name = data.name;
                    }

                    if (name === '')
                    {
                        name = _viewDesigner.DesignerTable._BuildControlName(thisControlId, '', data.controltype);
                    }

                    ControlNameElem.appendChild(xmlDoc.createTextNode(name));
                    controlDisplayNameElem.appendChild(xmlDoc.createTextNode(name));
                    controlNameValueElem.appendChild(xmlDoc.createTextNode(name));

                    // styles
                    var styles = ControlElem.selectSingleNode("Styles");
                }
            },

            //deprecated left for backwards compatibility
            _closeFieldPropertyConfigPopup: function (field)
            {
                _viewDesigner._executeControlBinding(_viewDesigner.View._findControlFromSelectedObject(), field);
            },

            _executeControlBinding: function (control, field)
            {
                var viewType = _viewDesigner._getViewType();

                var bindOption = "";

                if ((checkExists(control.attr("propertyid"))) && (control.attr("propertyid") !== ""))
                {
                    if ((checkExists(field)) && (checkExists(field.propertyid)) && (field.propertyid !== ""))
                    {
                        if (control.attr("propertyid") !== field.propertyid)
                        {
                            bindOption = "both";
                        }
                    }
                    else
                    {
                        if ((checkExists(field)) && (checkExists(field.propertytype)) && (field.propertytype === "none"))
                        {
                            bindOption = "both";
                        }
                        else
                        {
                            bindOption = "unbind";
                        }
                    }
                }
                else if ((checkExists(field)) && (checkExists(field.propertyid)))
                {
                    if (field.propertyid !== "")
                    {
                        bindOption = "bind";
                    }
                    else if ((checkExists(field.propertytype)) && (field.propertytype === "none"))
                    {
                        bindOption = "both";
                    }
                }

                if (bindOption !== "")
                {
                    if (viewType === "Capture")
                    {
                        _viewDesigner.DragDrop._newControlIds.push(control.attr("id"));
                        switch (bindOption)
                        {
                            case "unbind":
                                {
                                    _viewDesigner._unbindControl({ control: control });
                                    break;
                                }
                            case "bind":
                                {
                                    _viewDesigner._bindControl(field, control);
                                    break;
                                }
                            case "both":
                                {
                                    _viewDesigner._unbindControl({ control: control });
                                    _viewDesigner._bindControl(field, control);
                                    break;
                                }
                        }

                        if (_viewDesigner.View.propertyGrid)
                        {
                            _viewDesigner.View.propertyGrid.element.remove();
                            delete _viewDesigner.View.propertyGrid;
                        }

                        _viewDesigner._configSelectedControl(control);

                        _viewDesigner.View.propertyGrid = SourceCode.Forms.Designers.View.PropertyGrid._create({ id: 'ReadOnlyProperties_' + control.attr("id"), controlid: control.attr("id"), readonly: false, definitionxml: _viewDesigner._getControlTypePropertyDefinition(control.attr("controltype")), valuexml: _viewDesigner._getControlPropertiesXML(control.attr("id")), container: _viewDesigner.View.element.find('#controlPropertiesListTable') });

                        _viewDesigner._redrawControl(_viewDesigner.View.propertyGrid.controlid, _viewDesigner.View.propertyGrid, _viewDesigner._getProperties(control.attr("id")));
                    }
                    else if (viewType === "CaptureList")
                    {
                        var closestCell = control.closest("td.editor-cell");
                        var cellIndexPlus = closestCell[0].cellIndex + 1;

                        var bodyEditorTable = $("table.editor-table:not(.toolbar)");
                        var displayRowControl = bodyEditorTable.find('>tbody>tr:nth-child(2)>td:nth-child(' + cellIndexPlus + ')>.controlwrapper');

                        var editRowTable = $("table.capturelist-editor-table");
                        var editRowControl = editRowTable.find('>tbody>tr:nth-child(1)>td:nth-child(' + cellIndexPlus + ')>.controlwrapper');

                        var columnHeader = bodyEditorTable.find('>tbody>tr:nth-child(1)>td:nth-child(' + cellIndexPlus + ')');
                        var columnHeaderControl = columnHeader.find(".controlwrapper");

                        _viewDesigner.DragDrop._newControlIds.push(columnHeader.attr("id"));
                        _viewDesigner.DragDrop._newControlIds.push(columnHeaderControl.attr("id"));
                        _viewDesigner.DragDrop._newControlIds.push(displayRowControl.attr("id"));
                        _viewDesigner.DragDrop._newControlIds.push(editRowControl.attr("id"));

                        if ((bindOption === "unbind") || (bindOption === "both"))
                        {
                            _viewDesigner._unbindControl({ control: columnHeaderControl, unboundDataType: "Text" });

                            if (_viewDesigner.View.selectedOptions.EnableListEditing)
                            {
                                var editDataType = null;
                                var editControlType = editRowControl.attr("controltype");

                                if (checkExistsNotEmpty(editControlType))
                                {
                                    var controlDefXml = SourceCode.Forms.Designers.Common.controlDefinitionsXml.selectSingleNode("Controls/Control[Name='" + editControlType + "']");

                                    if (checkExists(controlDefXml))
                                    {
                                        var initialDataType = controlDefXml.selectSingleNode("DefaultProperties/Properties/Prop[@ID='DataType']/InitialValue");

                                        if ((checkExists(initialDataType)) && (checkExistsNotEmpty(initialDataType.text)))
                                        {
                                            editDataType = initialDataType.text;
                                        }
                                    }
                                }

                                _viewDesigner._unbindControl({ control: displayRowControl, unboundDataType: editDataType });
                                _viewDesigner._unbindControl({ control: editRowControl, unboundDataType: editDataType });
                            }
                            else
                            {
                                _viewDesigner._unbindControl({ control: displayRowControl });
                            }
                        }

                        if ((bindOption === "bind") || (bindOption === "both"))
                        {
                            _viewDesigner._bindControl(field, columnHeader);
                        }

                        if (_viewDesigner.View.propertyGrid)
                        {
                            _viewDesigner.View.propertyGrid.element.remove();
                            delete _viewDesigner.View.propertyGrid;
                        }

                        var newControl = closestCell.find(".controlwrapper");

                        if (closestCell.closest("table").hasClass("capturelist-editor-table"))
                        {
                            _viewDesigner._configSelectedControl(newControl);
                        }

                        _viewDesigner.View.propertyGrid = SourceCode.Forms.Designers.View.PropertyGrid._create(
                            {
                                id: 'ReadOnlyProperties_' + newControl.attr('id'), controlid: newControl.attr('id'),
                                readonly: false,
                                definitionxml: _viewDesigner._getControlTypePropertyDefinition(newControl.attr("controltype")),
                                valuexml: _viewDesigner._getControlPropertiesXML(newControl.attr('id')),
                                container: _viewDesigner.View.element.find('#controlPropertiesListTable')
                            });

                        // Refresh control badging
                        SourceCode.Forms.Designers.Common.View.refreshBadgeForControls(_viewDesigner.DragDrop._newControlIds);

                        _viewDesigner._redrawControl(_viewDesigner.View.propertyGrid.controlid, _viewDesigner.View.propertyGrid, _viewDesigner._getProperties(newControl.attr('id')));

                        // Mimic a click on the control wrapper to trigger the refreshing of the control overlay, updating any badging
                        newControl.trigger("click");
                    }

                }
            },

            _closeComplexPropertyPopup: function (state, xml, setAsCreate, notifierContext, controlManagesOwnField)
            {
                if (state === 1) //OK
                {
                    //update control property xml
                    _viewDesigner._updateControlComplexProperties(xml, setAsCreate, notifierContext, controlManagesOwnField);
                }

                var divComplexProperty = _viewDesigner.View.element.find('#divComplexProperty');
                divComplexProperty.css('display', 'none');
            },

            _getPropertyState: function (previousControlElement, newControlElement, controlId, propertyName)
            {
                var result =
                {
                    previousValue: null,
                    newValue: null,
                    hasChanged: false
                };
                var queryPropertyXpath = "Properties/Property[Name='{0}']/Value";
                var previousValueNode = previousControlElement.selectSingleNode(queryPropertyXpath.format(propertyName));
                if (checkExists(previousValueNode))
                {
                    result.previousValue = previousValueNode.text;
                }

                var newValueNode = newControlElement.selectSingleNode(queryPropertyXpath.format(propertyName));
                if (checkExists(newValueNode))
                {
                    result.newValue = newValueNode.text;
                }
                result.hasChanged = (result.previousValue !== result.newValue) ? true : false;

                return result;
            },

            _updateControlComplexProperties: function (xml, setAsCreate, notifierContext, controlManagesOwnField)
            {
                // store reference to previous selected control
                var selectedControl = _viewDesigner.View.selectedObject;

                var xmlPropertiesDoc = parseXML(_viewDesigner.View.propertyGrid.valuexml);
                if ($chk(xmlPropertiesDoc) === true)
                {
                    var ComplexXMLDoc = parseXML(typeof xml === 'string' ? xml : xml.xml);
                    var thisControlList = ComplexXMLDoc.selectNodes('Controls/Control');
                    var associationSO = null;

                    for (var i = 0; i < thisControlList.length; i++)
                    {
                        var thisContolElem = thisControlList[i];
                        var controlId = thisContolElem.getAttribute('ID');
                        var ControlsElem = xmlPropertiesDoc.selectSingleNode('Controls');
                        var ControlElem = xmlPropertiesDoc.selectSingleNode('Controls/Control[@ID="' + controlId + '"]');

                        if (checkExists(ControlElem))
                        {
                            var prevParentControl = _viewDesigner._getControlProperty(controlId, 'ParentControl');

                            if (setAsCreate)
                            {
                                _viewDesigner.View.DragDrop._newControlIds.push(controlId);
                            }
                            var hiddenAssociatedSOsXML = _viewDesigner.View.hiddenAssociationXml;

                            var propertyStates =
                            {
                                AssociationSO: _viewDesigner._getPropertyState(ControlElem, thisContolElem, controlId, "AssociationSO"),
                                DisplaySO: _viewDesigner._getPropertyState(ControlElem, thisContolElem, controlId, "DisplaySO")
                            };

                            if (!checkExistsNotEmpty(controlManagesOwnField) || !controlManagesOwnField)
                            {
                                for (var propertyName in propertyStates)
                                {
                                    var state = propertyStates[propertyName];
                                    if (state.hasChanged === true)
                                    {
                                        var checkInUseXpath = 'Control[@ID!="{0}"]/Properties/Property[Name="AssociationSO" or Name="DisplaySO"][Value="{1}"]'.format(controlId, state.previousValue);
                                        var inUseByOtherControls = checkExists(_viewDesigner.View.controlPropertiesXML.selectSingleNode(checkInUseXpath));

                                        if (checkExists(hiddenAssociatedSOsXML) && inUseByOtherControls === false)
                                        {
                                            //remove old hidden association node
                                            var removeAssocationXpath = "associations/smartobjectroot[@guid='{0}']".format(state.previousValue);
                                            var assNode = hiddenAssociatedSOsXML.selectSingleNode(removeAssocationXpath);
                                            if (checkExists(assNode))
                                            {
                                                assNode.parentNode.removeChild(assNode);
                                            }
                                        }
                                        _viewDesigner._removeControlSOSource(controlId, propertyName);
                                    }
                                }
                            }

                            associationSO = propertyStates.AssociationSO.newValue;

                            var object = _viewDesigner.View.element.find("#" + controlId)[0];

                            var objectid = null;

                            object = $(object);
                            objectid = object.attr('id');
                            //cleanup events
                            object.off();

                            _viewDesigner._ClearControlProperties(controlId, true);

                            ControlsElem.removeChild(ControlElem);
                        }

                        var clonedThisControlElem = thisContolElem.cloneNode(true);
                        ControlsElem.appendChild(clonedThisControlElem);
                    }

                    _viewDesigner.View.hiddenAssociationXml = hiddenAssociatedSOsXML;
                    _viewDesigner._updateAssociationXml(thisContolElem, "DisplaySO");

                    _viewDesigner.View.propertyGrid.valuexml = xmlPropertiesDoc.xml;

                    // need to retrieve properties xml van propertygrid
                    var updatedPropertiesXML = parseXML(_viewDesigner.View.propertyGrid.valuexml).selectSingleNode("//Properties");

                    var gridControlId = _viewDesigner.View.propertyGrid.controlid;

                    //rebuild grid with new values
                    _viewDesigner._redrawControl(gridControlId, _viewDesigner.View.propertyGrid, updatedPropertiesXML, prevParentControl, associationSO, notifierContext);

                    var sourceId = SourceCode.Forms.DependencyHelper.getAssociationSmoId(xmlPropertiesDoc.xml);
                    if (checkExistsNotEmpty(sourceId))
                    {
                        //After the control is updated, if it is bound to a data source we need to push the controlId to an array 
                        //so it will later create or update the default behaviour for the list control when _BuildViewXML() is called 
                        _viewDesigner.View.DragDrop._newControlIds.push(gridControlId);

                        _viewDesigner._BuildViewXML();
                    }

                    //After finishing configure a data source and when buildViewXML is called, FieldID is injected to the controlNode thus we need to remove the old annotation that is pointing the old fieldId
                    SourceCode.Forms.Designers.Common.removeInvalidSourceFieldAnnotationForControl(gridControlId);

                    if ($chk(selectedControl))
                    {
                        _viewDesigner._setDefaultSelectedObject();
                        _viewDesigner._configSelectedControl(selectedControl);
                    }

                    SourceCode.Forms.Designers.Common.applyDesignerWizardStepBadging();
                }
            },

            _updateAssociationXml: function (controlElement, propertyName)
            {
                var hiddenAssociatedSOsXML = _viewDesigner.View.hiddenAssociationXml;
                var displaySOGuidValueNode = controlElement.selectSingleNode("Properties/Property[Name='{0}']/Value".format(propertyName));
                if (checkExists(displaySOGuidValueNode) && checkExistsNotEmpty(displaySOGuidValueNode.text))
                {
                    var displaySOGuid = displaySOGuidValueNode.text;
                    var associationExists = hiddenAssociatedSOsXML.selectSingleNode("associations/smartobjectroot[@guid = '" + displaySOGuid + "']");
                    if (!checkExists(associationExists))
                    {
                        var smartObjectXmlWrapper = _viewDesigner.AJAXCall._getSOPropertiesBasic(displaySOGuid, false);
                        if (checkExistsNotEmpty(smartObjectXmlWrapper))
                        {
                            var smartObjectXml = parseXML(smartObjectXmlWrapper).selectSingleNode("root/soxml");
                            if (checkExists(smartObjectXml) && checkExistsNotEmpty(smartObjectXml.text))
                            {
                                var displaySODetails = parseXML(smartObjectXml.text);
                                if (checkExists(displaySODetails))
                                {
                                    var associationsNode = hiddenAssociatedSOsXML.selectSingleNode("associations");
                                    if (!checkExists(associationsNode))
                                    {
                                        associationsNode = hiddenAssociatedSOsXML.createElement("associations");
                                    }
                                    var clonedNode = displaySODetails.selectSingleNode("smartobject/smartobjectroot").cloneNode(true);
                                    associationsNode.appendChild(clonedNode);
                                }
                            }
                        }
                    }
                }
            },

            _updatePrimaryFields: function (xmlDoc)
            {
                var PropParentDiv = _viewDesigner.View.element.find('#PropParent');
                if (PropParentDiv.length > 0)
                {
                    var Properties = PropParentDiv.children();
                    for (var i = 0; i < Properties.length; i++)
                    {
                        var PropertyDiv = $(Properties[i]);
                        var propSOId = PropertyDiv.attr('soid');
                        var propId = PropertyDiv.attr('propertyid');
                        var propType = PropertyDiv.attr('propertytype');
                        var propFriendlyName = PropertyDiv.attr('friendlyname');
                        var propSOName = PropParentDiv.attr('soname');
                        var propSOFriendlyName = PropParentDiv.attr('sofriendlyname');
                        if (PropertyDiv)
                        {
                            if (PropertyDiv.is('div'))
                            {
                                //fields
                                var data = {
                                    soid: propSOId.toLowerCase(),
                                    propertyid: propId,
                                    propertytype: propType,
                                    friendlyname: propFriendlyName,
                                    soname: propSOName,
                                    sofriendlyname: propSOFriendlyName,
                                    contexttype: 'Primary',
                                    contextid: propSOId.toLowerCase(),
                                    sourcetype: 'Object',
                                    fieldtype: 'ObjectProperty'
                                };
                                _viewDesigner._createField(xmlDoc, data);
                            }
                        }
                    }
                    _viewDesigner._badgeInvalidFields(xmlDoc);
                }
            },

            _badgeInvalidFields: function (xmlDoc)
            {
                var PropParentDiv = _viewDesigner.View.element.find('#PropParent');
                var data = null;
                var dataInvalid = null;
                if (PropParentDiv.length > 0)
                {
                    var Properties = PropParentDiv.children();
                    var PropertiesSOGuid = PropParentDiv.attr('soguid').toLowerCase();
                    var fields = xmlDoc.selectNodes('SourceCode.Forms/Views/View/Sources/Source[@SourceID="' + PropertiesSOGuid + '"][@ContextType="Primary"]/Fields/Field[contains(@ValidationStatus,"Missing") or contains(@ValidationStatus,"Error") or contains(@ValidationStatus,"Warning")]');
                    var isControlFieldsTabBadged = _viewDesigner.View.element.find("#ViewEditorControlFieldsTab .tab-icon.fields").hasClass("error");
                    var viewEditorControlFieldsTabHasError = false;

                    for (var i = 0; i < fields.length; i++)
                    {
                        var dataType = fields[i].getAttribute('DataType');
                        var validationStatus = fields[i].getAttribute('ValidationStatus');
                        var fieldName = fields[i].selectSingleNode("FieldName").text;
                        var friendlyName = fields[i].selectSingleNode("Name").text;
                        var propParentSOGuid = PropParentDiv.attr('soguid');
                        var propParentSOName = PropParentDiv.attr('soname');
                        var propParentSOFriendlyName = PropParentDiv.attr('sofriendlyname');
                        var validationMessages = fields[i].getAttribute('ValidationMessages');
                        var validationMessage = "";
                        var validationMessageEncoded = "";

                        if (checkExistsNotEmpty(validationMessages))
                        {
                            var resourcesService = SourceCode.Forms.Services.AnalyzerResourcesService();
                            validationMessage = resourcesService.getValidationMessages(validationMessages);
                            validationMessageEncoded = String(validationMessage).htmlEncode();
                        }

                        var propIdName = "property_" + fieldName;
                        if (_viewDesigner.View.element.find('#' + propIdName).length === 0)
                        {
                            PropParentDiv.append('<div id="' + propIdName + '" class="draggable toolboxitem invalid ' + dataType.toLowerCase() + '" title="' + validationMessageEncoded + '" references="" soid="' + propParentSOGuid.toLowerCase() + '" isnew="false" issystem="false" isunique="false" propertytype="' + dataType + '" propertyid="' + fieldName + '" friendlyname="' + friendlyName.htmlEncode() + '" itemtype="property">' + friendlyName.htmlEncode() + '<a href="javascript:void(0);">' + Resources.CommonActions.RemoveText + '</a></div>');
                            viewEditorControlFieldsTabHasError = true;
                        }
                    }
                }

                if (viewEditorControlFieldsTabHasError && !isControlFieldsTabBadged)
                {
                    _viewDesigner.View.element.find("#ViewEditorControlFieldsTab .tab-icon.fields").addClass("error");
                }

                _viewDesigner.View.element.find("#vdFieldsList").off("click", "div.toolboxitem.invalid a", _viewDesigner._checkViewFieldDependencies).on("click", "div.toolboxitem.invalid a", _viewDesigner._checkViewFieldDependencies);
            },

            _toggleRulesTabBadge: function (badgeTab)
            {
                if (badgeTab)
                {
                    _viewDesigner.View.element.find("#vdViewEditorFormsTab .tab-icon.events").addClass("error");
                }
                else
                {
                    _viewDesigner.View.element.find("#vdViewEditorFormsTab .tab-icon.events").removeClass("error");
                }
            },

            _checkViewFieldDependencies: function (event, contextId)
            {
                if (_viewDesigner.View.CheckOut._checkViewStatus())
                {
                    var target = $(event.target).closest(".toolboxitem.invalid");

                    var removeFieldCallbackFn = function ()
                    {
                        _viewDesigner._removeField(target);
                    };

                    var soId = target[0].getAttribute("soid");
                    var fieldSystemName = target[0].getAttribute("propertyid");

                    var xpath = "SourceCode.Forms/Views/View/Sources/Source[@SourceID='{0}' and @ContextType='Primary']/Fields/Field[FieldName='{1}']".format(soId, fieldSystemName);

                    if (checkExistsNotEmptyGuid(contextId))
                    {
                        xpath = "SourceCode.Forms/Views/View/Sources/Source[@SourceID='{0}' and @ContextID='{1}']/Fields/Field[FieldName='{2}']".format(soId, contextId, fieldSystemName);
                    }

                    var fieldNode = _viewDesigner.View.viewDefinitionXML.selectSingleNode(xpath);
                    var fieldId = "";
                    if (checkExists(fieldNode))
                    {
                        fieldId = fieldNode.getAttribute("ID");
                    }

                    var fieldData =
                    {
                        itemId: fieldId,
                        itemSystemName: fieldSystemName,
                        itemType: SourceCode.Forms.DependencyHelper.ReferenceType.ViewField,
                        sourceId: soId
                    };

                    var fieldDependencies = SourceCode.Forms.Designers.getDependencies(fieldData);
                    if (fieldDependencies.length > 0)
                    {
                        var notifierOptions =
                        {
                            references: fieldDependencies,
                            deletedItemDisplayName: target[0].getAttribute("friendlyname"),
                            deleteItemType: "ViewField",
                            removeObjFn: removeFieldCallbackFn
                        };
                        SourceCode.Forms.Designers.showDependencyNotifierPopup(notifierOptions);
                    }
                    else
                    {
                        var _options = {
                            onAccept: function (event)
                            {
                                _viewDesigner._removeField(target);
                                SourceCode.Forms.Designers.Common.refreshBadges();
                                popupManager.closeLast();
                            },
                            message: Resources.DependencyHelper.RemoveViewFieldText
                        };
                        popupManager.showConfirmation(_options);
                    }
                }
            },

            _removeField: function (target, contextId)
            {
                var soId = target.attr("soid");
                var propertyId = target.attr("propertyid");
                var id = target.attr("id");

                var xpath = "SourceCode.Forms/Views/View/Sources/Source[@SourceID='{0}' and @ContextType='Primary']/Fields/Field/FieldName[text()='{1}']".format(soId, propertyId);

                if (checkExistsNotEmptyGuid(contextId))
                {
                    xpath = "SourceCode.Forms/Views/View/Sources/Source[@SourceID='{0}' and @ContextID='{1}']/Fields/Field/FieldName[text()='{2}']".format(soId, contextId, propertyId);
                }

                var nameNode = _viewDesigner.View.viewDefinitionXML.selectSingleNode(xpath);
                if (checkExists(nameNode))
                {
                    var fieldNode = nameNode.parentNode;
                    fieldNode.parentNode.removeChild(fieldNode);
                }

                _viewDesigner.View.element.find("#" + id).remove();

                var fieldNodesExist = _viewDesigner.View.element.find('#PropParent').children();
                if (fieldNodesExist.length === 0)
                {
                    _viewDesigner.View.element.find("#ViewEditorControlFieldsTab .tab-icon.fields").removeClass("error");
                }

                if (checkExists(_viewDesigner.View.canvas) &&
                    checkExists(_viewDesigner.View.canvas.parent()))
                {
                    //This is to simulate a click aways to ensure the error badging overlay is refreshed after the field is removed
                    _viewDesigner.View.canvas.parent().trigger("click");
                }

                _viewDesigner._updatePrimarySource(soId);
                SourceCode.Forms.RuleGrid.refresh(_viewDesigner.View.viewEventsGrid, SourceCode.Forms.Designers.Common.getDefinitionXML());
            },

            _updatePrimarySource: function (soId)
            {
                var sourceNode = _viewDesigner.View.viewDefinitionXML.selectSingleNode("SourceCode.Forms/Views/View/Sources/Source[@ContextType='Primary' and @SourceID='{0}']".format(soId));
                var validationFields = sourceNode.selectNodes("Fields/Field[contains(@ValidationStatus,'Missing') or contains(@ValidationStatus,'Error')]");

                if (validationFields.length === 0 &&
                    (!sourceNode.hasAttribute('ValidationStatus') ||
                    !sourceNode.getAttribute("ValidationStatus").contains("Missing")))
                {
                    SourceCode.Forms.DependencyHelper.removeAnnotation(sourceNode);
                }
            },

            _updateAssociatedFields: function (xmlDoc)
            {
                if ($chk(_viewDesigner.View.hiddenAssociationXml))
                {
                    var associatedSOs = _viewDesigner.View.hiddenAssociationXml.selectNodes('//smartobjectroot');
                    var controlProps = _viewDesigner.View.controlPropertiesXML;

                    for (var a = 0; a < associatedSOs.length; a++)
                    {
                        var so = associatedSOs[a];
                        var soID = so.getAttribute('guid').toLowerCase();
                        var soName = so.getAttribute('name');
                        var soFriendlyName = so.selectSingleNode('metadata/display/displayname').text;
                        var contextType = 'Association';
                        var contextID = so.getAttribute('guid').toLowerCase();
                        var sourceType = 'Object';
                        var fieldType = 'ObjectProperty';

                        var soProps = so.selectNodes('properties/property');

                        var controls = controlProps.selectNodes("Control[(Properties/Property[Name='AssociationSO']/Value = '" + soID + "') or (Properties/Property[Name='DisplaySO']/Value = '" + soID + "')]");

                        if (controls.length > 0)
                        {
                            for (var c = 0; c < controls.length; c++)
                            {
                                if (controls[c].getAttribute('ID'))
                                {
                                    contextID = controls[c].getAttribute('ID');
                                }
                                var jqControl = _viewDesigner.View.element.find("#" + contextID);

                                var boundFieldID = jqControl.attr('propertyid');

                                var isBound = (checkExists(boundFieldID) && boundFieldID !== "");
                                if (isBound)
                                {
                                    contextType = 'Association';
                                }
                                else
                                {
                                    contextType = 'External';
                                }

                                for (var p = 0; p < soProps.length; p++)
                                {
                                    var propertyID = soProps[p].getAttribute('name');
                                    var propertyType = soProps[p].getAttribute('type');
                                    var propertyFriendlyName = soProps[p].selectSingleNode('metadata/display/displayname').text;

                                    var data = {
                                        soid: soID,
                                        propertyid: propertyID,
                                        propertytype: propertyType,
                                        friendlyname: propertyFriendlyName,
                                        soname: soName,
                                        sofriendlyname: soFriendlyName,
                                        contexttype: contextType,
                                        contextid: contextID,
                                        sourcetype: sourceType,
                                        fieldtype: fieldType
                                    };

                                    _viewDesigner._createField(xmlDoc, data);
                                }
                            }
                        }
                    }
                }
            },

            _createEventingPropertyWithEncoding: function (xmlDoc, name, value, displayValue, nameValue)
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

            _getHiddenSmartObjectName: function ()
            {
                var smoElem = _viewDesigner.View.hiddenSmartObjectXml.selectSingleNode("//smartobjectroot");

                if (checkExists(smoElem))
                {
                    var smoName = smoElem.getAttribute("name");
                    return smoName;
                }
            },

            _addAggregationExpression: function (data)
            {
                var viewXmlDoc = _viewDesigner.View.viewDefinitionXML;
                var viewElem = _viewDesigner._getViewElem(viewXmlDoc);
                var expressionID = String.generateGuid();
                var expressionElement = viewXmlDoc.createElement("Expression");
                var expressionNameElement = viewXmlDoc.createElement("Name");
                var expressionTypeElement = viewXmlDoc.createElement(data.expressionType);
                var expressionItemElement = viewXmlDoc.createElement("Item");
                var expressionItemDisplayElement = viewXmlDoc.createElement("Display");
                var expressionDisplayElement = viewXmlDoc.createElement("Display");

                expressionElement.setAttribute("ID", expressionID);
                expressionItemElement.setAttribute("SourceType", data.sourceType);
                expressionItemElement.setAttribute("SourceID", data.sourceID);
                expressionItemElement.setAttribute("DataType", data.dataType);
                expressionItemElement.setAttribute("Type", data.type);

                expressionItemElement.appendChild(expressionItemDisplayElement);
                expressionItemDisplayElement.appendChild(viewXmlDoc.createTextNode(data.itemDisplayName));
                expressionDisplayElement.appendChild(viewXmlDoc.createTextNode(data.displayName));
                expressionTypeElement.appendChild(expressionItemElement);
                expressionNameElement.appendChild(viewXmlDoc.createTextNode(data.expressionName));
                expressionElement.appendChild(expressionNameElement);
                expressionElement.appendChild(expressionDisplayElement);
                expressionElement.appendChild(expressionTypeElement);

                if ($chk(viewElem) === true)
                {
                    var expressionsElem = viewElem.selectSingleNode('Expressions');
                    if ($chk(expressionsElem) === false)
                    {
                        expressionsElem = viewXmlDoc.createElement('Expressions');
                        viewElem.appendChild(expressionsElem);
                    }

                    expressionsElem.appendChild(expressionElement);
                }

                return expressionID;
            },

            _isEditableCaptureList: function ()
            {
                var xpath = "SourceCode.Forms/Views/View/Controls/Control[@Type='View']/Properties/Property[Name='ListEditable']/Value";
                var node = _viewDesigner.View.viewDefinitionXML.selectSingleNode(xpath);
                if ($chk(node))
                {
                    return node.text;
                }
                return "";
            },

            _isElementAEditorGrid: function (jqElement)
            {
                return SourceCode.Forms.TableHelper.isRenderedAsGrid(jqElement) ? true : false;
            },

            _setViewSmoIdAttribute: function ()
            {
                var thisSmartObjectGuid = _viewDesigner.View.SelectedSmartObjectGuid;

                //write values to xml
                var viewElem = _viewDesigner._getViewElem(_viewDesigner.View.viewDefinitionXML);
                if (checkExists(viewElem) && checkExists(thisSmartObjectGuid))
                {
                    viewElem.setAttribute('SOID', thisSmartObjectGuid);
                }
                else
                {
                    SFLog("View is not associated with a primary smartobject");
                }
            }
        };
})(jQuery);
