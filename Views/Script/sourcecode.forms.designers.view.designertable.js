/* global Resources: false */
/* global SourceCode: true */
/* global $chk: false */
/* global checkExists: false */
/* global popupManager: false */
/* global SCStyleHelper: false */

(function ($)
{

    // Namespacing the Designer
    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Designers === "undefined" || SourceCode.Forms.Designers === null) SourceCode.Forms.Designers = {};

    var _designerTable = SourceCode.Forms.Designers.View.DesignerTable = {
        _generateLayoutTable: function (ViewType, rows, cols)
        {

            jQuery("#bodySection").removeClass("empty");
            jQuery("#EditorCanvas_ViewEditorCanvas").removeClass("empty");
            jQuery("#editorCanvasPane").removeClass("empty");

            if ($chk(rows) === false && $chk(cols) === false)
            {
                switch (ViewType)
                {
                    case 'Capture':
                        rows = jQuery('#vdrowsAmount').val();
                        cols = jQuery('#vdcolumnsAmount').val();
                        footerIndex = null;
                        break;

                    case 'CaptureList':
                        rows = 7;
                        cols = jQuery('#vdcolumnsAmount').val();
                        footerIndex = rows - 1;
                        dummyRowStart = 2;
                        dummyRowEnd = rows - 2;
                        if (jQuery("#vdchkViewAutoGenerate").is(":checked"))
                        {
                            cols = 1;
                        }
                        break;
                    default:
                        rows = jQuery('#vdrowsAmount').val();
                        cols = jQuery('#vdcolumnsAmount').val();
                        footerIndex = null;
                        break;
                }
            }
            else
            {
                switch (ViewType)
                {
                    case 'CaptureList':
                        footerIndex = rows - 1;
                        dummyRowStart = 2;
                        dummyRowEnd = rows - 2;
                        break;
                }
            }

            var rowIndex = 0;
            var colIndex = 0;
            var section = jQuery('#bodySection');
            var tableid = null;
            var canvas = jQuery('#' + _designerTable.View.EditorCanvasId);

            if ($chk(section) === false)
            {
                //create the section
                if (canvas.length > 0)
                {
                    section = jQuery('<div></div>');
                    section.attr('id', 'bodySection');
                    section.addClass('section');
                    section.attr("uniqueID", String.generateGuid());
                    canvas.append(section);
                }
            }
            else if (section.length === 0)
            {
                //create the section
                if (canvas.length > 0)
                {
                    section = jQuery('<div></div>');
                    section.attr('id', 'bodySection');
                    section.addClass('section');
                    section.attr("uniqueID", String.generateGuid());
                    canvas.append(section);
                }
            }
            else
            {
                section.attr("uniqueID", String.generateGuid());
                section[0].style.height = "auto";
            }

            //cleanup
            _designerTable.ViewDesigner._cleanupChildren(section);

            section.empty();

            var id = String.generateGuid();
            var ControlDef = _designerTable.DragDrop._BuildControlWrapper(id);
            var ControlWrapper = ControlDef.wrapper;
            var ControlWrapperResize = ControlDef.resizeWrapper;

            section.append(ControlWrapper);
            var sectionId = section.attr('id');

            ControlWrapper.addClass('controlwrapper');

            if (ViewType === 'CaptureList')
            {
                ControlWrapper.attr('layout', 'ListTable');
            }
            else
            {
                ControlWrapper.attr('layout', 'Table');
            }
            ControlWrapper.attr('layouttype', 'layoutcontainer');


            //new function
            var table = $();
            if (ViewType === 'CaptureList')
            {
                //Generate the Editable Row UI displayed underneath a list view in designer
                _designerTable._generateEditableTable(cols, true);
                table = _designerTable._generateCaptureListTable(ViewType, rows, cols, sectionId, dummyRowStart, dummyRowEnd, footerIndex);
            }
            else
            {
                table = SourceCode.Forms.TableHelper.generateGrid(rows, cols, function (jqCell)
                {
                    //cell create callback
                    _designerTable._configureCell(sectionId, null, jqCell, null);
                });
                table.addClass("editor-table");
                table.addClass("root-table");
            }

            ControlWrapperResize.append(table);
            tableid = table.attr("id");

            var properties = _designerTable.ViewDesigner._getProperties(id);

            if (!checkExists(properties))
            {
                properties = _designerTable.View.viewDefinitionXML.createElement("Properties");
                var controlName = _designerTable._BuildControlName(id, '', ControlWrapper.attr('layout'));
                properties.appendChild(_designerTable.ViewDesigner._BuildPropertyElem(id, 'ControlName', controlName, controlName));
            }

            _designerTable.ViewDesigner._setControlPropertiesXML(id, properties);

            _designerTable.View.isViewEventsLoaded = false;
            _designerTable.View.isViewEventsLoading = false;

            _designerTable._addColumnGroupColumns(tableid);

            if (ViewType === "CaptureList")
            {
                _designerTable._addEditableListTableHoverStates(table);
                _designerTable.ViewDesigner._toggleListViewPaging(_designerTable.View.selectedOptions.EnablePaging);
            }
            else
            {
                _designerTable._addTableControlHoverStates(table);
            }

            _designerTable.ViewDesigner._configSelectedControl($("#EditorCanvas_ViewEditorCanvas").find("[controlType = 'View']"));
            _designerTable.ViewDesigner.controlSelected = true;

            return tableid;
        },

        //Moved logic from generateLayoutTable() into this submethod. 
        //Previously this was being used for capturelist and capture.
        //this logic will now mainly be for CaptureList
        _generateCaptureListTable: function (ViewType, rows, cols, sectionId, dummyRowStart, dummyRowEnd, footerIndex)
        {
            var alternateRows = _designerTable.View.selectedOptions.ShadeAlternatingRows;

            var table = jQuery('<table frame="box" style="table-layout:fixed"></table>');
            tableid = String.generateGuid();
            table.attr('id', tableid);
            table.addClass('editor-table');

            table.attr('cellPadding', 0);
            table.attr('cellSpacing', 0);

            var tbody = jQuery('<tbody></tbody>');
            tbody.addClass('editor-body');

            table.find(".editor-body-colgroup").remove();

            for (var rowIndex = 0; rowIndex < rows; rowIndex++)
            {
                var row = jQuery('<tr></tr>');
                var isHeaderRow = false;

                tbody.append(row);

                var rowId = String.generateGuid();
                row.attr('id', rowId);
                row.addClass('editor-row');

                if (ViewType === 'CaptureList')
                {
                    if (rowIndex === 0)
                    {
                        row.addClass('header');
                        isHeaderRow = true;
                    }
                    else if (rowIndex === footerIndex)
                    {
                        row.addClass('footer');
                    }
                    else
                    {
                        if (rowIndex >= dummyRowStart && rowIndex <= dummyRowEnd)
                        {
                            row.addClass("dummy-row");
                        }
                    }

                    row.addClass("list-view-item");
                }
                row.attr('layouttype', 'row');

                colIndex = 0;
                //cellWidth = (100 / cols) + '%';
                cellWidth = (jQuery("#bodySection .editor-table").width() / cols) + "px";
                for (colIndex = 0; colIndex < cols; colIndex++)
                {
                    var cell = jQuery('<td></td>');

                    var colId = String.generateGuid();
                    cell.attr('id', colId);

                    if (ViewType === 'CaptureList')
                    {

                        if (isHeaderRow)
                        {
                            cell.addClass('header');
                        }

                        if (alternateRows && rowIndex > 1)
                        {
                            var loop = (rowIndex - 1) % 2;

                            if (loop > 0)
                            {
                                cell.addClass('alternate');
                            }
                        }
                    }

                    row.append(cell);

                    _designerTable._configureCell(sectionId, row, cell, cellWidth);
                }
                _designerTable._SetRowCellLayout(row);
            }

            table.append(tbody);
            return table;
        },

        _configurePlaceholderFooterRow: function (row)
        {
            var footer = jQuery("#footerControlDropPlaceHolder");
            if (footer.length === 0)
            {
                var footerPlaceHolderRow = jQuery("<tr class='editor-row list-view-item placeholder-footer' id='footerControlDropPlaceHolder'><td colspan='1000' class='editor-cell watermark-visible'><div class='watermark-text'>" + Resources.ViewDesigner.FooterRowDragHeader + "</div></td></tr>");
                var tbody = row.closest("tbody");
                tbody.append(footerPlaceHolderRow);
                row.hide();
            }
        },

        _PropertyCount: function ()
        {
            return jQuery('.input-control.checkbox input.autogen-field.include:checked').length;
        },

        _MethodCount: function ()
        {
            var retVal = 0;

            if (!checkExists(_designerTable.View.smartObjectSingleMethodCount))
            {

                if ($chk(_designerTable.View.hiddenSmartObjectXml))
                {
                    var methods = _designerTable.View.hiddenSmartObjectXml.selectNodes("smartobject/smartobjectroot/methods/method[not(@type='list')]");
                    _designerTable.View.smartObjectSingleMethodCount = methods.length;
                }
            }
            else
            {
                return _designerTable.View.smartObjectSingleMethodCount;
            }

            return retVal;
        },

        _autoGenerateView: function ()
        {
            jQuery("#editorCanvasPane").modalize(true);
            jQuery("#editorCanvasPane").showBusy(true);

            //_designerTable timeout is neccesary to allow IE to show the modalizer
            setTimeout(function ()
            {
                // reset control index dictionary
                _designerTable.View.controlTypeIndexes = [];

                var cols = _designerTable.View.selectedOptions.ColumnCount;
                var rows = _designerTable.View.selectedOptions.RowCount;

                if (isNaN(rows))
                {
                    rows = 1;
                }
                if (isNaN(cols))
                {
                    cols = 1;
                }

                var PropertyIndex = 0;
                var MethodIndex = 0;
                var newRow = 0;
                var allowedTypes = '';
                var ViewType = _designerTable.ViewDesigner._getViewType();
                var PropertiesCount = _designerTable._PropertyCount();
                var Properties = jQuery('.input-control.checkbox input.autogen-field.include:checked');
                var ReadOnlyProperties = jQuery('.input-control.checkbox input.autogen-field.readonly:checked');
                var Methods = _designerTable._MethodCount();
                var buttonType = '';

                var standardMethods = jQuery(".autogen-method-standard");
                var methodIndexes = [];
                for (var i = 0; i < standardMethods.length; i++)
                {
                    var jqMethod = jQuery(standardMethods[i]);
                    if (jqMethod.is(":checked"))
                    {
                        methodIndexes.push(i);
                    }
                }

                _designerTable.ViewDesigner._setDefaultSelectedObject();
                _designerTable.ViewDesigner._ClearViewControls();
                _designerTable.ViewDesigner._ClearViewControlProperties();

                switch (ViewType)
                {
                    case 'Capture':
                        // read the label placement from the view settings
                        var viewSettings = _designerTable.ViewDesigner.View.viewSettingsXmlDoc;
                        var labelPlacement = _designerTable.View.selectedOptions.LablePlacementLeft === true ? "vdrbLabelLeft" : "vdrbLabelTop";
                        var inLineLabels = labelPlacement === "vdrbLabelLeft" ? true : false;

                        var PropsCount = 0;
                        var MethodsCount = 0;

                        buttonType = "toolbar";
                        if ($("#MethodButtonsTable").find("input.autogen-method-standard[type=checkbox]:checked").length > 0)
                        {
                            buttonType = "standard";
                        }

                        if (inLineLabels)
                        {
                            if (cols === 1)
                                cols++;
                        }

                        if (inLineLabels)
                        {
                            //render labels inline
                            //doulbe the amount of cells needed
                            InputControlCount = PropertiesCount * 2;

                            //calculate number of rows need for the properties
                            if (cols % 2 !== 0)
                            {
                                //if there are an uneven number of columns add extra rows to cater for the empty cells
                                PropsCount = Math.ceil((InputControlCount + (PropertiesCount / 2)) / cols);
                            }
                            else
                            {
                                PropsCount = Math.ceil(InputControlCount / cols);
                            }
                        }
                        else
                        {
                            PropsCount = Math.ceil(PropertiesCount / cols);
                        }
                        //calculate number of rows for the methods
                        MethodsCount = Math.ceil(methodIndexes.length / cols);

                        if (_designerTable.View.isReadOnlyView === 'true' || buttonType === 'toolbar')
                        {
                            MethodsCount = 0;
                            Methods = 0;
                        }

                        //calculate total number of rows
                        var requiredRows = PropsCount + MethodsCount;

                        if (requiredRows > rows)
                        {
                            rows = PropsCount + MethodsCount;
                        }

                        allowedTypes = 'property,method';
                        _designerTable._generateToolbarTable();
                        break;
                    case 'CaptureList':
                        rows = 7;

                        _designerTable.View.applyGetListMethod = true;

                        if (PropertiesCount > 0)
                        {
                            cols = PropertiesCount;
                        }

                        allowedTypes = 'property';
                        _designerTable._AutoCreateCaptureListToolbar();
                        break;
                    default:
                        _designerTable._generateToolbarTable();
                        return;
                }

                var tableid = _designerTable._generateLayoutTable(ViewType, rows, cols);

                // reset flag as _generateLayoutTable sets it to true as it has no contex form where is being called from
                _designerTable.View.isGeneratingView = true;

                var table = jQuery('#' + tableid);

                for (var rowIndex = 0; rowIndex < rows; rowIndex++)
                {
                    for (var colIndex = 0; colIndex < cols; colIndex++)
                    {
                        var cell = SourceCode.Forms.TableHelper.getCellAtPosition(table, rowIndex, colIndex);

                        if (cell.length > 0)
                        {
                            if (PropertiesCount > PropertyIndex)
                            {
                                var Property = jQuery(Properties[PropertyIndex]);
                                if ((inLineLabels) && (ViewType === 'Capture'))
                                {
                                    if ((colIndex % 2) === 0)
                                    {
                                        if ((colIndex + 1) < cols)
                                        {
                                            _designerTable._AddPropertyControlToCell(cell, Property, ReadOnlyProperties, 1); //1 = label only
                                        }
                                    }
                                    else
                                    {
                                        _designerTable._AddPropertyControlToCell(cell, Property, ReadOnlyProperties, 2); //1 = input control only
                                        PropertyIndex++;
                                    }
                                    if ((colIndex + 1) >= cols)
                                        colIndex = cols + 99;   //do a line break to start the next control on a new line
                                }
                                else
                                {
                                    if (_designerTable._AddPropertyControlToCell(cell, Property, ReadOnlyProperties, 3))   //3 = all controls
                                    {
                                        PropertyIndex++;
                                    }
                                }
                                if (PropertiesCount <= PropertyIndex)
                                    colIndex = cols + 99;   //do a line break to put methods controls on a new line
                            }
                            else
                            {
                                if (ViewType === 'Capture'
                                    && buttonType !== "toolbar"
                                    && MethodIndex < methodIndexes.length)
                                {
                                    _designerTable._AddMethodControlToCell(cell, methodIndexes[MethodIndex]);
                                    MethodIndex++;
                                }
                            }
                        }
                    }

                    if (ViewType === 'CaptureList')
                    {
                        rowIndex = rows + 99;
                    }
                }

                if (ViewType === "Capture")
                {
                    _designerTable._AutoGenerateToolbarButtons(_designerTable._MethodCount(), true);
                }

                jQuery("#editorCanvasPane").modalize(false);
                jQuery("#editorCanvasPane").showBusy(false);

                if (ViewType === "CaptureList")
                {
                    var selectedFields = jQuery("#autogenFieldsTable").find(".autogen-field.include.input-control:checked");
                    if (selectedFields.length > 0)
                    {
                        if (_designerTable.View.selectedOptions.EnableFiltering)
                        {
                            _designerTable.ViewDesigner._toggleListViewFilter(true);
                        }

                        if (!_designerTable.View.selectedOptions.EnableListEditing && _designerTable.View.selectedOptions.EnablePaging)
                        {
                            _designerTable.ViewDesigner._toggleListViewPaging(true);
                        }
                    }

                    if (_designerTable.View.selectedOptions.EnableListEditing === false)
                    {
                        jQuery("#editableSection").hide();
                    }
                    else
                    {
                        jQuery("#editableSection").show();

                        var value = null;
                        if (_designerTable.View.selectedOptions.EditAllRows)
                        {
                            value = "all";
                        }
                        else
                        {
                            value = "single";
                        }

                        _designerTable.ViewDesigner._buildEditableListEvent("ListItemAdded", value === "single" ? true : false, Resources.ViewDesigner.ViewEvent_Added);
                        _designerTable.ViewDesigner._buildEditableListEvent("ListItemChanged", value === "single" ? true : false, Resources.ViewDesigner.ViewEvent_Changed);
                        _designerTable.ViewDesigner._buildEditableListEvent("ListItemRemoved", value === "single" ? true : false, Resources.ViewDesigner.ViewEvent_Removed);

                        _designerTable._buildDoubleClickEvent();
                    }
                }
                else
                {
                    _designerTable._removeRowsOnGenerate(table);
                }

                // ensure footer row displays correctly
                var footerRow = jQuery("tr.footer");
                if (footerRow.length > 0)
                {
                    _designerTable._configurePlaceholderFooterRow(footerRow);
                }

                _designerTable.View.isViewChanged = true;

                // we need to make sure that the auto-created controls are available in the view xml
                _designerTable.ViewDesigner._BuildViewXML();

                _designerTable.ViewDesigner._configureOptionsStep(_designerTable.View.wizard.wizard("getStep", _designerTable.View.layoutStep));

                _designerTable.View.isGeneratingView = false;
                _designerTable.ViewDesigner._configSelectedControl($("#EditorCanvas_ViewEditorCanvas").find("[controlType = 'View']"));
                _designerTable.ViewDesigner.controlSelected = true;

                SourceCode.Forms.Designers.Common.triggerEvent("CanvasDisplayed");
            }, 50);
        },

        _buildDoubleClickEvent: function ()
        {
            var viewId = _designerTable.ViewDesigner._GetViewID();
            var viewName = _designerTable.ViewDesigner._GetViewName();
            var viewDisplayName = _designerTable.ViewDesigner._GetViewDisplayName();

            var eventsElem = _designerTable.View.viewDefinitionXML.documentElement.selectSingleNode('Views/View/Events');

            if ($chk(eventsElem) === false)
            {
                eventsElem = _designerTable.View.viewDefinitionXML.createElement('Events');
                var viewElem = _designerTable.View.viewDefinitionXML.documentElement.selectSingleNode('Views/View');
                viewElem.appendChild(eventsElem);
            }

            var checkNode = eventsElem.selectSingleNode('Event[Name/text()="ListDoubleClick" and (@SourceType="View") and(@Type="User") and (@SourceID="' + viewId + '") and Handlers/Handler/Actions/Action[@Type="List"]]');

            if ($chk(checkNode) === false)
            {
                var eventElem = _designerTable.View.viewDefinitionXML.createElement('Event');
                var nameElem = _designerTable.View.viewDefinitionXML.createElement('Name');
                eventElem.setAttribute('ID', String.generateGuid());
                eventElem.setAttribute("DefinitionID", String.generateGuid());
                eventElem.setAttribute('Type', 'User');
                eventElem.setAttribute('SourceID', viewId);
                eventElem.setAttribute('SourceName', viewName);
                eventElem.setAttribute('SourceDisplayName', viewDisplayName);
                eventElem.setAttribute('SourceType', 'View');
                eventsElem.appendChild(eventElem);
                eventElem.appendChild(nameElem);

                nameElem.appendChild(_designerTable.View.viewDefinitionXML.createTextNode('ListDoubleClick'));

                var propertiesElem = _designerTable.View.viewDefinitionXML.createElement('Properties');
                var actionPropertiesElem = _designerTable.View.viewDefinitionXML.createElement('Properties');
                var propertiesNameElem = _designerTable.View.viewDefinitionXML.createElement('Property');
                var namePropertiesNameElem = _designerTable.View.viewDefinitionXML.createElement('Name');
                var valuePropertiesNameElem = _designerTable.View.viewDefinitionXML.createElement('Value');
                var propertiesDescriptionElem = _designerTable.View.viewDefinitionXML.createElement('Property');
                var namePropertiesDescriptionElem = _designerTable.View.viewDefinitionXML.createElement('Name');
                var valuePropertiesDescriptionElem = _designerTable.View.viewDefinitionXML.createElement('Value');
                namePropertiesNameElem.appendChild(_designerTable.View.viewDefinitionXML.createTextNode('RuleFriendlyName'));
                valuePropertiesNameElem.appendChild(_designerTable.View.viewDefinitionXML.createTextNode(Resources.ViewDesigner.RuleNameViewEventNameCurrent.format(Resources.ViewDesigner.ViewEvent_ListDoubleClick)));
                namePropertiesDescriptionElem.appendChild(_designerTable.View.viewDefinitionXML.createTextNode('RuleDescription'));
                valuePropertiesDescriptionElem.appendChild(_designerTable.View.viewDefinitionXML.createTextNode(Resources.ViewDesigner.EditableDoubleClickRowDesc));
                propertiesElem.appendChild(propertiesNameElem);
                propertiesElem.appendChild(propertiesDescriptionElem);
                propertiesNameElem.appendChild(namePropertiesNameElem);
                propertiesNameElem.appendChild(valuePropertiesNameElem);
                propertiesDescriptionElem.appendChild(namePropertiesDescriptionElem);
                propertiesDescriptionElem.appendChild(valuePropertiesDescriptionElem);
                eventElem.appendChild(propertiesElem);

                var handlersEl = _designerTable.View.viewDefinitionXML.createElement('Handlers');
                var handlerEl = _designerTable.View.viewDefinitionXML.createElement('Handler');

                var listenersElem = _designerTable.View.viewDefinitionXML.createElement('Actions');
                var listenerElem = _designerTable.View.viewDefinitionXML.createElement('Action');

                actionPropertiesElem.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(_designerTable.View.viewDefinitionXML, "Method", "EditItem"));
                actionPropertiesElem.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(_designerTable.View.viewDefinitionXML, "ViewID", viewId, viewDisplayName));
                actionPropertiesElem.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(_designerTable.View.viewDefinitionXML, "Location", "View", viewDisplayName));

                propertiesElem.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(_designerTable.View.viewDefinitionXML, "Location", _designerTable.ViewDesigner._GetViewName(), viewDisplayName));
                propertiesElem.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(_designerTable.View.viewDefinitionXML, "ViewID", _designerTable.ViewDesigner._GetViewID(), viewDisplayName));

                listenerElem.setAttribute('Type', 'List');
                listenerElem.appendChild(actionPropertiesElem);
                listenersElem.appendChild(listenerElem);
                handlerEl.appendChild(listenersElem);
                handlersEl.appendChild(handlerEl);
                eventElem.appendChild(handlersEl);
                eventElem.appendChild(handlersEl);
            }
        },

        _AutoGenerateToolbarButtons: function (methodCount)
        {
            var MethodIndex = 0;
            var toolbarSection = jQuery('#toolbarSection');

            //get the first toolbar cell
            var cell = toolbarSection.find('.toolbar').find('.editor-cell:first-child');

            if (jQuery("#vdchkAllMethodsToolbarButtons").is(":checked"))
            {
                for (var methodIndex = 0; methodIndex < methodCount; methodIndex++)
                {
                    _designerTable._AddMethodControlToCell(cell, methodIndex, true);
                }
            }
            else
            {
                var toolbarButtons = jQuery(".autogen-method-toolbar");
                for (var i = 0; i < toolbarButtons.length; i++)
                {
                    if (jQuery(toolbarButtons[i]).is(":checked"))
                    {
                        _designerTable._AddMethodControlToCell(cell, i, true);
                        continue;
                    }
                }
            }
        },

        _AddMethodControlToCell: function (thisCell, MethodIndex)
        {
            var retVal = false;
            if (_designerTable.ViewDesigner._getViewType() === 'Capture')
            {
                var MethodHash = _designerTable._BuildMethodList();
                var MethodArray = MethodHash.values();
                var thisMethod = null;
                thisMethod = MethodArray[MethodIndex];

                retVal = _designerTable._InsertCaptureControl(thisCell, thisMethod);
            }

            return retVal;
        },

        _BuildMethodList: function ()
        {
            var Methods = new Hash();
            var MethodTable = jQuery('#MethodParent');
            var methods = MethodTable.children('.toolboxitem');

            for (var i = 0; i < methods.length; i++)
            {
                var thisMethod = jQuery(methods[i]);
                if (thisMethod.length > 0)
                {
                    if (thisMethod.is('div'))
                    {
                        if (thisMethod.attr('available') === 'true')
                        {
                            Methods.set(thisMethod.attr('id'), thisMethod);
                        }
                    }
                }
            }
            return Methods;
        },

        _AddPropertyControlToCell: function (thisCell, Property, ReadOnlyProperties, controlToRender)
        {
            if ($chk(controlToRender) === false)
                controlToRender = 3;

            var retVal = false;

            if (thisCell.length > 0)
            {
                var PropParent = jQuery('#PropParent');
                if (PropParent.length > 0)
                {
                    var properties = PropParent.children('.toolboxitem');
                    var propertyName = Property.val();
                    if (properties.length > 0)
                    {

                        var thisProperty = properties.filter("*[propertyid=" + propertyName + "]");
                        var isReadOnly = ReadOnlyProperties.filter("[value=" + propertyName + "]").length > 0 ? true : false;
                        if (thisProperty.length > 0)
                        {
                            switch (_designerTable.ViewDesigner._getViewType())
                            {
                                case 'Capture':
                                    retVal = _designerTable._InsertCaptureControl(thisCell, thisProperty, controlToRender, isReadOnly);
                                    break;
                                case 'CaptureList':
                                    retVal = _designerTable._InsertCaptureListControl(thisCell, thisProperty, isReadOnly);
                                    break;
                            }
                        }
                    }
                }
            }
            return retVal;
        },

        _InsertCaptureListControl: function (thisCell, thisProperty, isReadOnly)
        {
            var data;
            var retVal = false;
            try
            {
                var section = _designerTable.ViewDesigner._getSection(thisCell);

                if (thisProperty.attr('itemtype') === 'property')
                {
                    data = {
                        itemtype: thisProperty.attr('itemtype'),
                        custom: thisProperty.attr('custom'),
                        references: thisProperty.attr('references'),
                        propertytype: thisProperty.attr('propertytype'),
                        propertyid: thisProperty.attr('propertyid'),
                        friendlyname: thisProperty.attr('friendlyname'),
                        soid: thisProperty.attr('soid').toLowerCase(),
                        section: section.attr('id'),
                        dragtype: 'external'
                    };

                    _designerTable.DragDrop._CaptureListViewDrop(thisCell, data, isReadOnly);
                    retVal = true;
                }
                else
                {
                    retVal = true;
                }
            }
            catch (e)
            {
                retVal = false;
            }
            return retVal;
        },

        _InsertCaptureControl: function (thisCell, thisItem, controlToRender, isReadOnly)
        {
            var data;
            var retVal = false;
            var friendlyName;
            var addColonSuffix = jQuery("#vdaddColonSuffixChk").checkbox().is(":checked") ? true : false;

            if (thisCell.length > 0 && thisItem)
            {
                var section = _designerTable.ViewDesigner._getSection(thisCell);
                if (thisItem.attr('itemtype') === 'method')
                {
                    data = {
                        itemtype: thisItem.attr('itemtype'),
                        custom: thisItem.attr('custom'),
                        methodid: thisItem.attr('methodid'),
                        friendlyname: thisItem.attr('friendlyname'),
                        soid: thisItem.attr('soid').toLowerCase(),
                        section: section.attr('id'),
                        dragtype: 'external',
                        methodtype: thisItem.attr('methodType')
                    };
                    retVal = true;
                }
                else if (thisItem.attr('itemtype') === 'property')
                {
                    data = {
                        itemtype: thisItem.attr('itemtype'),
                        custom: thisItem.attr('custom'),
                        references: thisItem.attr('references'),
                        propertytype: thisItem.attr('propertytype'),
                        propertyid: thisItem.attr('propertyid'),
                        friendlyname: thisItem.attr('friendlyname'),
                        soid: thisItem.attr('soid').toLowerCase(),
                        section: section.attr('id'),
                        dragtype: 'external',
                        controltype: thisItem.attr('controltype'),
                        controltorender: controlToRender,
                        addColonSuffix: addColonSuffix
                    };
                    retVal = true;
                }
                else
                {
                    retVal = false;
                }

                if (retVal === true)
                    _designerTable._CaptureViewDrop(thisCell, data, isReadOnly);
            }
            return retVal;
        },

        _CaptureViewDrop: function (contextobject, data, isReadOnly, setAsSelectedControl)
        {
            if (data.itemtype === 'property')
            {
                _designerTable.DragDrop._CaptureViewDropProperty(contextobject, data, isReadOnly, setAsSelectedControl);
            }
            else if (data.itemtype === 'method')
            {
                _designerTable.DragDrop._CaptureViewDropMethod(contextobject, data, setAsSelectedControl);
            }
            else if (data.itemtype === 'control' || data.itemtype === 'layoutcontainer')
            {
                _designerTable.DragDrop._CaptureViewDropControl(contextobject, data, setAsSelectedControl);
            }
        },

        _insertMethodToolbarButton: function (Control, cell, name, resourceName, imageName)
        {
            data = {
                itemtype: 'control',
                friendlyname: resourceName,
                name: Control,
                dragtype: 'external'
            };

            var id = _designerTable._ToolbarDropControl(cell, data);
            if (!id)
                return;

            var thisControl = jQuery('#' + id);

            if (thisControl.length > 0)
            {
                thisControl.attr('flag', 'auto-capturelist-{0}'.format(name.toLowerCase()));
                var ControlType = thisControl.attr('controltype');
                var styles = _designerTable.Styles._getStyles(id, ControlType);

                var properties = _designerTable.ViewDesigner._getProperties(id);
                if (!checkExists(properties))
                {
                    properties = _designerTable.View.viewDefinitionXML.createElement("Properties");
                }

                var imageSrc = checkExists(imageName) ? imageName : name.toLowerCase();
                properties.appendChild(_designerTable.ViewDesigner._BuildPropertyElem(id, 'ImageClass', imageSrc, name));

                _designerTable.ViewDesigner._setControlPropertiesXML(id, properties, styles);
                _designerTable.AJAXCall._initControlProperties(id, ControlType, properties, styles);
            }

            return id;
        },

        _createRefreshListToolbarButtonHandler: function (id)
        {
            var controlWrapper = jQuery("#" + id);

            var xmlDoc = _designerTable.View.viewDefinitionXML;
            var eventsNode = xmlDoc.selectSingleNode("SourceCode.Forms/Views/View/Events");
            var refreshListEvent = xmlDoc.selectSingleNode("SourceCode.Forms/Views/View/Events/Event[@SourceID='{0}']".format(id));
            var styles = _designerTable.Styles._getStyles(id, controlWrapper.attr("ControlType"));
            var controlName = _designerTable.ViewDesigner._getControlPropertyValue(id, "ControlName");
            var viewDisplayName = _designerTable.ViewDesigner._GetViewDisplayName();

            if (!checkExists(refreshListEvent) && checkExists(eventsNode))
            {
                var eventNode = xmlDoc.createElement("Event");
                eventNode.setAttribute("ID", String.generateGuid());
                eventNode.setAttribute("DefinitionID", String.generateGuid());
                eventNode.setAttribute("Type", "User");
                eventNode.setAttribute("SourceID", id);
                eventNode.setAttribute("SourceName", controlName);
                eventNode.setAttribute("SourceDisplayName", controlName);
                eventNode.setAttribute("SourceType", "Control");
                eventsNode.appendChild(eventNode);

                var nameNode = xmlDoc.createElement("Name");
                nameNode.appendChild(xmlDoc.createTextNode("OnClick"));
                eventNode.appendChild(nameNode);

                var propertiesNode = xmlDoc.createElement("Properties");
                eventNode.appendChild(propertiesNode);

                var property = _designerTable.ViewDesigner._createEventingPropertyWithEncoding(xmlDoc, "RuleFriendlyName", "Refresh List Toolbar Button is Clicked");
                propertiesNode.appendChild(property);

                property = _designerTable.ViewDesigner._createEventingPropertyWithEncoding(xmlDoc, "RuleDescription", "Refreshes the list view when clicked.");
                propertiesNode.appendChild(property);

                property = _designerTable.ViewDesigner._createEventingPropertyWithEncoding(xmlDoc, "Location", "click event");
                propertiesNode.appendChild(property);

                property = _designerTable.ViewDesigner._createEventingPropertyWithEncoding(xmlDoc, "ViewID", _designerTable.ViewDesigner._GetViewID(), viewDisplayName);
                propertiesNode.appendChild(property);

                var handlersNode = xmlDoc.createElement("Handlers");
                eventNode.appendChild(handlersNode);

                var handlerNode = xmlDoc.createElement("Handler");
                handlerNode.setAttribute("ID", String.generateGuid());
                handlerNode.setAttribute("DefinitionID", String.generateGuid());
                handlerNode.setAttribute("Type", "If");
                handlersNode.appendChild(handlerNode);

                var actionsNode = xmlDoc.createElement("Actions");
                handlerNode.appendChild(actionsNode);

                var actionNode = xmlDoc.createElement("Action");
                actionNode.setAttribute("ID", String.generateGuid());
                actionNode.setAttribute("DefinitionID", String.generateGuid());
                actionNode.setAttribute("Type", "Execute");
                actionNode.setAttribute("ExecutionType", "Synchronous");
                actionsNode.appendChild(actionNode);

                propertiesNode = xmlDoc.createElement("Properties");
                actionNode.appendChild(propertiesNode);

                property = _designerTable.ViewDesigner._createEventingPropertyWithEncoding(xmlDoc, "Location", "View", viewDisplayName);
                propertiesNode.appendChild(property);

                property = _designerTable.ViewDesigner._createEventingPropertyWithEncoding(xmlDoc, "Method", "ListRefresh");
                propertiesNode.appendChild(property);

                property = _designerTable.ViewDesigner._createEventingPropertyWithEncoding(xmlDoc, "ViewID", _designerTable.ViewDesigner._GetViewID(), viewDisplayName);
                propertiesNode.appendChild(property);
            }
        },

        _AutoCreateCaptureListToolbar: function ()
        {
            var Control = _designerTable.DragDrop._GetDataTypeDefaultControl('toolbarmethod');
            var propertiesXML;
            var data;
            var rows = 1;
            var cols = 1;

            var section = jQuery('#toolbarSection');

            //cleanup
            _designerTable.ViewDesigner._cleanupChildren(section);

            section.empty();

            var properties = '';
            var styles = '';

            var id = String.generateGuid();
            var ControlDef = _designerTable.DragDrop._BuildControlWrapper(id);
            var ControlWrapper = ControlDef.wrapper;
            var ControlWrapperResize = ControlDef.resizeWrapper;

            if (!checkExists(section[0].getAttribute("uniqueID")))
            {
                section[0].setAttribute("uniqueID", String.generateGuid());
            }

            ControlWrapper.attr('layout', 'ToolbarTable');
            ControlWrapper.attr('layouttype', 'layoutcontainer');

            var table = jQuery('<table style="table-layout:fixed"></table>');
            table.attr('id', String.generateGuid());
            table.addClass('editor-table');
            table.addClass('toolbar');
            table.css('width', '100%');
            table.attr('cellPadding', 0);
            table.attr('cellSpacing', 0);

            tbody = jQuery('<tbody></tbody>');
            table.append(tbody);

            ControlWrapperResize.append(table);
            section.append(ControlWrapper);

            // get the view settings
            var viewSettings = _designerTable.ViewDesigner.View.viewSettingsXmlDoc;

            for (var rowIndex = 0; rowIndex < rows; rowIndex++)
            {
                var row = jQuery('<tr></tr>');
                if (row.length > 0)
                {
                    var rowId = String.generateGuid();
                    row.attr('id', rowId);
                    row.addClass('editor-row');
                    row.attr('layouttype', 'row');
                    tbody.append(row);

                    colIndex = 0;
                    for (colIndex = 0; colIndex < cols; colIndex++)
                    {
                        var cell = jQuery('<td></td>');
                        if (cell.length > 0)
                        {
                            var colId = String.generateGuid();
                            cell.attr('id', colId);
                            row.append(cell);

                            //configure the cell
                            _designerTable._configureCell(section.attr('id'), row, cell);
                            cell.addClass('droptarget');
                            if (cell.html() === '')
                            {
                                cell.html('&nbsp;');
                            }
                            if (colIndex === (cols - 1))
                            {
                                if (window.ie)
                                    cell.css('width', '100%');
                                else
                                    cell.css('width', 'auto');
                            }
                            else
                            {
                                cell.css('width', '72px');
                            }

                            var ControlType = '';
                            var thisControl;
                            var id = null;
                            var view = _designerTable.View;
                            if (view.selectedOptions.EnableListEditing)
                            {
                                //Add
                                // read the settings from the view setting's xml
                                if (view.selectedOptions.UserAddRows)
                                {
                                    cell.find("div.watermark-text").remove();
                                    id = _designerTable._insertMethodToolbarButton(Control, cell, "Add", Resources.CommonActions.AddText);
                                    _designerTable.ViewDesigner._buildEditableList_DefaultToolbarButtonEvent(view.viewDefinitionXML, jQuery("#{0}".format(id)));
                                }

                                //Edit
                                if (view.selectedOptions.UserEditRows)
                                {
                                    cell.find("div.watermark-text").remove();
                                    id = _designerTable._insertMethodToolbarButton(Control, cell, "Edit", Resources.CommonActions.EditText);
                                    _designerTable.ViewDesigner._buildEditableList_DefaultToolbarButtonEvent(view.viewDefinitionXML, jQuery("#{0}".format(id)));
                                }

                                //Delete
                                if (view.selectedOptions.UserRemoveRows)
                                {
                                    cell.find("div.watermark-text").remove();
                                    id = _designerTable._insertMethodToolbarButton(Control, cell, "Delete", Resources.CommonActions.DeleteText);
                                    _designerTable.ViewDesigner._buildEditableList_DefaultToolbarButtonEvent(view.viewDefinitionXML, jQuery("#{0}".format(id)));
                                }

                                //Save
                                if (view.selectedOptions.EditAllRows
                                    && (view.selectedOptions.UserAddRows || view.selectedOptions.UserEditRows || view.selectedOptions.UserRemoveRows))
                                {
                                    cell.find("div.watermark-text").remove();
                                    var id = _designerTable._insertMethodToolbarButton(Control, cell, "Save", Resources.CommonActions.SaveText);
                                    var control = jQuery("#" + id);
                                    if (control.length > 0)
                                    {
                                        var data = {
                                            viewid: _designerTable.ViewDesigner._GetViewID(),
                                            soid: _designerTable.ViewDesigner._GetViewSOID(),
                                            controlid: id,
                                            controlname: _designerTable.ViewDesigner._getControlProperty(id, 'ControlName')
                                        };
                                        _designerTable.ViewDesigner._BuildSingleSaveBehaviour(data);
                                    }
                                }
                            } // if editable list

                            // Refresh List
                            if (view.selectedOptions.AllowUserRefresh)
                            {
                                cell.find("div.watermark-text").remove();

                                var buttonId = _designerTable._insertMethodToolbarButton(Control, cell, "RefreshList", Resources.CommonActions.RefreshText, "refresh");
                                if (_designerTable.ViewDesigner._getViewType() === "CaptureList")
                                {
                                    _designerTable._createRefreshListToolbarButtonHandler(buttonId);
                                }
                            }
                        }
                    }
                }
            }

            if (table.find(".watermark-text").length === 0)
            {
                var cell = table.find(">tbody>tr>td:first-child");
                var cellWatermarkText = jQuery('<div class="watermark-text">' + Resources.ViewDesigner.DragControlHereWatermark + '</div>');
                cell.append(cellWatermarkText);
                _designerTable.DragDrop._ToggleContextWaterMark(cell);
            }
        },

        _ToolbarDropControl: function (contextobject, data)
        {
            var ControlType = '';

            ControlType = data.name;

            if (ControlType === '')
            {
                //could not find the default control definition for the selected property type
                popupManager.showWarning(Resources.ViewDesigner.ErrorDefaultControlNotFound);
                return;
            }
            var id = String.generateGuid();
            var ControlDef = _designerTable.DragDrop._BuildControlWrapper(id);
            var ControlWrapper = ControlDef.wrapper;
            var ControlWrapperResize = ControlDef.resizeWrapper;

            switch (data.itemtype)
            {
                case '0':
                case '1':
                case '2':
                case '3':
                case 'method':
                case 'property':
                case 'control':
                case 'toolbarcontrol':
                    ControlWrapper.attr('layouttype', 'control');
                    break;
                default:
                    ControlWrapper.attr('layout', ControlType);
                    ControlWrapper.attr('layouttype', 'layoutcontainer');
                    break;
            }
            ControlWrapper.attr('friendlyname', data.friendlyname);
            ControlWrapper.attr('name', data.name);
            ControlWrapper.attr('itemtype', data.itemtype);
            ControlWrapper.attr('controltype', ControlType);
            ControlWrapper.addClass('controlwrapper inline');
            ControlWrapper.addClass('draggable');

            var styles = _designerTable.Styles._getStyles(id, ControlType);

            var properties = _designerTable.ViewDesigner._getProperties(id);
            if (!checkExists(properties))
            {
                properties = _designerTable.View.viewDefinitionXML.createElement("Properties");
                var controlName = _designerTable._BuildControlName(id, data.friendlyname, ControlType);
                properties.appendChild(_designerTable.ViewDesigner._BuildPropertyElem(id, 'ControlName', controlName, controlName));
                properties.appendChild(_designerTable.ViewDesigner._BuildPropertyElem(id, 'Text', data.friendlyname, data.friendlyname));
            }

            var controlRequiresAjaxCall = _designerTable.AJAXCall._controlRequiresRerender(ControlType, properties, styles);
            if (controlRequiresAjaxCall)
            {
                var ControlHTML = _designerTable.DragDrop._GetDesignTimeHTML(ControlType);
                if (ControlHTML === "")
                {
                    //could not find the control html definition for 'Label'
                    popupManager.showWarning(Resources.ViewDesigner.ErrorControlDefinitionNotFound + " '" + ControlType + "'");
                    return;
                }

                ControlWrapperResize.append(jQuery(ControlHTML));
            }

            if (contextobject.html() === '&nbsp;')
            {
                contextobject.empty();
            }

            contextobject.append(ControlWrapper);

            _designerTable.DragDrop._addToolbarDroppables(ControlWrapper);

            _designerTable.ViewDesigner._setControlPropertiesXML(id, properties, styles);

            _designerTable.View.isViewChanged = true;
            //if (window.ie) document.recalc(true);
            return id;
        },

        _generateToolbarTable: function (ViewType)
        {
            var rows = 1;
            var cols = 1;
            var rowIndex = 0;
            var colIndex = 0;

            var section = jQuery('#toolbarSection');

            if (section.length === 0)
            {
                //create the toolbar section
                var canvas = jQuery('#' + _designerTable.View.EditorCanvasId);
                if (canvas.length > 0)
                {
                    var body = jQuery('#bodySection');
                    if (body.length > 0)
                    {
                        section = jQuery('<div></div>');
                        section.attr('id', 'toolbarSection');
                        section.addClass('section');
                        section.attr("uniqueID", String.generateGuid());
                        body.before(section);
                    }
                }
                else
                {
                    return;
                }
            }
            else
            {
                section.attr("uniqueID", String.generateGuid());
            }

            //cleanup
            _designerTable.ViewDesigner._cleanupChildren(section);
            section.empty();

            var id = String.generateGuid();
            var ControlDef = _designerTable.DragDrop._BuildControlWrapper(id);
            var ControlWrapper = ControlDef.wrapper;
            var ControlWrapperResize = ControlDef.resizeWrapper;

            ControlWrapper.attr('layout', 'ToolbarTable');
            ControlWrapper.attr('layouttype', 'layoutcontainer');

            var table = jQuery('<table></table>');
            table.attr('id', String.generateGuid());
            table.addClass('editor-table');
            table.addClass('toolbar');
            table.attr('cellPadding', 0);
            table.attr('cellSpacing', 0);

            //Add colgroup - every editor-table should have colgroup so it can be used to generate tablearray.  tablearry is needed for clear row operation for the toolbar table.
            var colgroup = $("<colgroup></colgroup>");
            for (colIndex = 0; colIndex < cols; colIndex++)
            {
                var col = $("<col>");
                col[0].style["width"] = "100%";
                colgroup.append(col);
            }
            table.append(colgroup);

            //Add rows and cells
            var tbody = jQuery('<tbody></tbody>');
            table.append(tbody);
            for (rowIndex = 0; rowIndex < rows; rowIndex++)
            {
                var row = jQuery('<tr></tr>');
                var rowId = String.generateGuid();
                row.attr('id', rowId);
                row.addClass('editor-row');
                row.attr('layouttype', 'row');
                tbody.append(row);

                colIndex = 0;
                cellWidth = (100 / cols) + '%';
                for (colIndex = 0; colIndex < cols; colIndex++)
                {
                    var cell = jQuery('<td></td>');
                    var cellWatermarkText = jQuery('<div class="watermark-text">' + Resources.ViewDesigner.DragControlHereWatermark + '</div>');
                    cell.append(cellWatermarkText);
                    _designerTable.DragDrop._ToggleContextWaterMark(cell);
                    var colId = String.generateGuid();
                    cell.attr('id', colId);
                    row.append(cell);
                    _designerTable._configureCell(section.attr('id'), row, cell, cellWidth);

                }
            }

            ControlWrapperResize.append(table);
            section.append(ControlWrapper);

            var properties = _designerTable.ViewDesigner._getProperties(id);
            if (!checkExists(properties))
            {
                properties = _designerTable.View.viewDefinitionXML.createElement("Properties");
                var controlName = _designerTable._BuildControlName(id, '', ControlWrapper.attr('layout'));
                properties.appendChild(_designerTable.ViewDesigner._BuildPropertyElem(id, 'ControlName', controlName, controlName));
            }

            _designerTable._addTableControlHoverStates(table);

            _designerTable.ViewDesigner._setControlPropertiesXML(id, properties);

            if (_designerTable.View.SelectedViewType === SourceCode.Forms.Designers.ViewType.ListView)
            {
                _designerTable.ViewDesigner._toggleListViewFilter(_designerTable.View.selectedOptions.EnableFiltering);
            }

            _designerTable.View._setCanvasFilled();
        },

        //Remove rows that contain no controls
        _removeRowsOnGenerate: function (table)
        {
            var rows = SourceCode.Forms.TableHelper.getRowCount(table);
            var cols = SourceCode.Forms.TableHelper.getColumnCount(table);

            var rowIndexesToRemove = [];

            for (var rowIndex = 0; rowIndex < rows; rowIndex++)
            {
                var allCellsAreEmpty = true;

                for (var colIndex = 0; colIndex < cols; colIndex++)
                {
                    var cell = SourceCode.Forms.TableHelper.getCellAtPosition(table, rowIndex, colIndex);

                    if (cell[0].childElementCount > 0)
                    {
                        allCellsAreEmpty = false;
                        break;
                    }
                }

                if (allCellsAreEmpty) rowIndexesToRemove.push(rowIndex);
            }

            var designer = SourceCode.Forms.Designers.Common.getDesigner();

            //Pop the index array so it removes from the last row first
            while (rowIndexesToRemove.length > 0)
            {
                var rowStart = rowIndexesToRemove.pop();
                SourceCode.Forms.Controls.Web.TableBehavior.prototype.RemoveItemViewRow(rowStart, rowStart + 1, table, designer);
            }
        },

        _generateEditableTable: function (cols, configureCells)
        {
            var rows = 1;
            var rowIndex = 0;
            var colIndex = 0;

            var section = jQuery('#editableSection');

            if (section.length === 0)
            {
                //create the toolbar section
                var canvas = jQuery('#' + _designerTable.View.EditorCanvasId);
                if (canvas.length > 0)
                {
                    var body = jQuery('#bodySection');
                    if (body.length > 0)
                    {
                        section = jQuery('<div></div>');
                        section.attr('id', 'editableSection');
                        section.addClass('section');
                        body.after(section);
                    }
                }
                else
                {
                    return;
                }
            }

            //cleanup
            _designerTable.ViewDesigner._cleanupChildren(section);
            section.empty();

            if (_designerTable.View.selectedOptions.EnableListEditing && _designerTable.View.skipInitEditableListViewEditEventBuilding !== true)
            {
                _designerTable.ViewDesigner._buildEditableListEvent("ListItemAdded", !_designerTable.View.selectedOptions.EditAllRows, Resources.ViewDesigner.ViewEvent_Added);
                _designerTable.ViewDesigner._buildEditableListEvent("ListItemChanged", !_designerTable.View.selectedOptions.EditAllRows, Resources.ViewDesigner.ViewEvent_Changed);
                _designerTable.ViewDesigner._buildEditableListEvent("ListItemRemoved", !_designerTable.View.selectedOptions.EditAllRows, Resources.ViewDesigner.ViewEvent_Removed);

                _designerTable._buildDoubleClickEvent();
            }

            var id = String.generateGuid();
            var ControlDef = _designerTable.DragDrop._BuildControlWrapper(id);
            var ControlWrapper = ControlDef.wrapper;
            var ControlWrapperResize = ControlDef.resizeWrapper;

            ControlWrapper.attr('layout', 'EditableTable');
            ControlWrapper.attr('layouttype', 'layoutcontainer');

            var header = jQuery("<span>" + Resources.ViewDesigner.AddEditEditableTableHeader + "</span>");
            section.append(header);

            var table = jQuery('<table style="table-layout:fixed"></table>');
            table.attr('id', String.generateGuid());
            table.addClass('capturelist-editor-table');
            table.attr('cellPadding', 0);
            table.attr('cellSpacing', 0);

            var colGroup = jQuery("<colgroup></colgroup>");
            var cellWidth = (100 / parseInt(cols)) + "%";
            for (var i = 0; i < parseInt(cols); i++)
            {
                var col = jQuery("<col style='width:{0}'>".format(cellWidth));
                colGroup.append(col);
            }
            table.append(colGroup);

            var tbody = jQuery('<tbody></tbody>');
            table.append(tbody);
            for (rowIndex = 0; rowIndex < rows; rowIndex++)
            {
                var row = jQuery('<tr></tr>');
                var rowId = String.generateGuid();
                row.attr('id', rowId);
                row.attr('layouttype', 'row');

                row.addClass('editor-row');

                tbody.append(row);

                colIndex = 0;
                for (colIndex = 0; colIndex < cols; colIndex++)
                {
                    var cell = jQuery('<td></td>');
                    var colId = String.generateGuid();
                    cell.attr('id', colId);

                    row.append(cell);
                    if (configureCells)
                    {
                        _designerTable._configureCell(section.attr('id'), row, cell, cellWidth);
                    }

                }
            }
            ControlWrapperResize.append(table);
            section.append(ControlWrapper);

            _designerTable._addTableControlHoverStates(table);

            _designerTable.View._setCanvasFilled();
        },

        _addTableControlHoverStates: function (jqEditorTables)
        {
            for (var i = 0; i < jqEditorTables.length; i++)
            {
                var table = jqEditorTables.eq(i);

                var parentElement = table.parent();
                if (parentElement.attr("controltype") === "ListTable" || parentElement.attr("layout") === "ListTable")
                {
                    _designerTable._addEditableListTableHoverStates(jq_tables);
                }
                else
                {
                    var jqEditorCells = SourceCode.Forms.TableHelper.getAllCells(table);

                    SFCTable.addTableCellHoverStates(jqEditorCells);
                }
            }
        },

        _getFooterTopPosition: function ()
        {
            var table = jQuery("#bodySection table.editor-table:first-child");
            var firstFooterRow = table.find(">tbody>tr.editor-row.footer:first-child");

            if (!firstFooterRow.is(":visible"))
            {
                var controlDropPlaceHolder = jQuery("#footerControlDropPlaceHolder");
                if (controlDropPlaceHolder.length > 0)
                {
                    return controlDropPlaceHolder.position().top + 1;
                }
            }

            if (firstFooterRow.length > 0)
            {
                return firstFooterRow.position().top;
            }

            return 0;
        },

        _addEditableListTableHoverStates: function (table)
        {
            $("#EditorCanvas .editor-table .editor-cell").on("mouseenter", function (e)
            {
                if (!(_designerTable.ViewDesigner._getViewType() === 'CaptureList'))
                {
                    $(this).addClass("editor-cell-item-hover");
                }
            }).on("mouseleave", function ()
                {
                    $("#EditorCanvas td").removeClass("editor-cell-item-hover");
                });

            table.on('mouseenter mouseleave', function (e)
            {
                jQuery("div.controlwrapper.hover").removeClass("hover");
                var jq_targetTable = jQuery(e.target).closest(".editor-table");
                if (jq_targetTable.length > 0 && jq_targetTable[0].id !== this.id)
                {
                    jQuery(".column-hover-overlay").hide();
                }
            });

            table.on("mousemove", function (e)
            {
                var _this = jQuery(this);
                var jq_target = jQuery(e.target);

                if (jq_target.length > 0)
                {
                    // make sure we are not hovering over the aggregation placeholder element
                    var row = jq_target.closest("tr");
                    if (row.length > 0 && row.hasClass("placeholder-footer"))
                    {
                        return;
                    }

                    // Checking if Overlay exists, otherwise creating it
                    var divOverlay = jQuery(".column-hover-overlay");
                    var closestTable = jq_target.closest('.editor-table');
                    _this.find('.editor-cell-item-hover').removeClass("editor-cell-item-hover");

                    if (divOverlay.length === 0)
                    {
                        divOverlay = jQuery("<div class='column-hover-overlay'></div>");
                        closestTable.after(divOverlay);
                        divOverlay.hide();
                    }

                    divOverlay.attr('title', '');

                    if ($chk(_designerTable.View.isDraggingHeaderColumn) && _designerTable.View.isDraggingHeaderColumn)
                    {
                        divOverlay.hide();
                    }

                    jQuery("div.controlwrapper.hover").removeClass("hover");

                    if (e.target.tagName.toLowerCase() !== "td")
                    {
                        if (jq_target.hasClass('controloverlay') && jq_target.closest("tr").hasClass("footer"))
                        {
                            jQuery(".column-hover-overlay").hide();
                            jq_target.closest('div.controlwrapper').addClass("hover");
                            return;
                        }
                        else
                        {
                            jq_target = jq_target.closest(".editor-cell");
                        }
                    }
                    else
                    {
                        if (!jq_target.hasClass("editor-cell"))
                        {
                            jq_target = jq_target.closest(".editor-cell");
                        }

                        if ($chk(_designerTable.View.selectedObject) && _designerTable.View.selectedObject.is("td.header"))
                        {
                            if (jq_target[0].cellIndex === _designerTable.View.selectedObject[0].cellIndex)
                            {
                                divOverlay.hide();
                                return;
                            }
                        }
                    }

                    if (jq_target.length > 0 && !jq_target.closest("tr").hasClass("footer"))
                    {
                        var objectLeft = jq_target.position().left;

                        divOverlay.css("left", objectLeft);
                        divOverlay.css("width", jq_target.outerWidth());

                        divOverlay.css("height", _designerTable._getFooterTopPosition());

                        divOverlay.on("mouseenter", null).on("mouseleave", function ()
                        {
                            var jq_this = jQuery(this);
                            var closestTable = jq_this.parents("table.editor-table");

                            if (closestTable.length === 0)
                            {
                                jq_this.hide();
                            }
                        });

                        divOverlay.data("cellIndex", jq_target[0].cellIndex);

                        // Set the title of the overlay to be the column header cell's title
                        divOverlay.attr('title', table.find('tr.header td:nth-child({0})'.format(jq_target[0].cellIndex + 1)).attr('title'));

                        divOverlay.show();
                    }
                    else if (jq_target.closest("tr").hasClass("footer") && !(_designerTable.ViewDesigner._getViewType() === 'CaptureList'))
                    {
                        divOverlay.hide();
                        jq_target.addClass("editor-cell-item-hover");
                    }
                    else
                    {
                        divOverlay.hide();
                    }
                    _designerTable.ViewDesigner.DragDrop._makeDraggableWithoutSelect(divOverlay);
                }
            });
        },

        createDragColumn: function (tableID)
        {
            var draggerHtml = "<div id='{0}' class='drag-column'><div class='drag-block'></div></div>";
            var dragger = jQuery(String.format(draggerHtml, String.generateGuid()));
            dragger.data("tableID", tableID);

            return dragger;
        },

        //Add column group for a newly generated table (e.g. a 5x5 table without any cells been merged)
        _addColumnGroupColumns: function (tableID)
        {
            var viewType = _designerTable.View.ViewDesigner._getViewType();
            var jq_table = jQuery("#" + tableID);

            var isRenderedAsGrid = SourceCode.Forms.TableHelper.isRenderedAsGrid(jq_table);

            //If Table is render as grid, get the no of columns from the TableHelper api. 
            //Note for normal table, the <col>s may not have been added yet and is determined from the number of cells in the first row.
            var noOfColumns = isRenderedAsGrid ? SourceCode.Forms.TableHelper.getColumnCount(jq_table) : jq_table.find(">tbody>tr:first-child>td").length;

            //ensure that the column resizer dom elements exist.
            var jq_columnResizeWrapperDiv = jQuery("#" + tableID + "_columnResizeWrapperDiv");
            if (jq_columnResizeWrapperDiv.length === 0)
            {
                jq_columnResizeWrapperDiv = jQuery("<div></div>");

                jq_columnResizeWrapperDiv.attr("id", tableID + "_columnResizeWrapperDiv");
                jq_columnResizeWrapperDiv.addClass("columnWrapperDiv");

                jq_table.closest('.controlwrapper').append(jq_columnResizeWrapperDiv);
            }
        
            //configured width of the table.
            var tableWidth = jq_table.width();
            jq_table.data("width", tableWidth);

            jq_columnResizeWrapperDiv.children().remove();

            var colsWidthPixels = Number((tableWidth / noOfColumns));
            var colWidth = "{0}%".format((colsWidthPixels / tableWidth * 100).toFixed(2));

            // Add the column to the definition so that we can apply styles to it
            var containerId = jq_table.closest("div.controlwrapper").attr("ID");

            if (!isRenderedAsGrid)
            {
                //clear the <COLS> out if they exist
                var jq_ColGroup = jQuery("#" + tableID + " .editor-body-colgroup");
                jq_ColGroup.children().remove();

                if (jq_ColGroup.length === 0)
                {
                    jq_ColGroup = jQuery("<colgroup></colgroup>");
                    jq_ColGroup.addClass("editor-body-colgroup");

                    jq_ColGroup.insertBefore(jq_table.find("tbody"));
                }

                var _colTag = $(SFCTable.colTag);
                for (var c = 0; c < noOfColumns; c++)
                {
                    var jq_Col = _colTag.clone();

                    jq_Col.attr("id", String.generateGuid());
                    jq_Col.attr("Type", "Column");

                    jq_Col[0].style.width = colWidth;
                    jq_Col.data("width", colWidth);

                    jq_ColGroup.append(jq_Col);
                }
            }

            //This will create the Column definition for the columns added
            SourceCode.Forms.Designers.Common.ensureDefinitionIsUpToDate();

            //Clear the width for the cell for List View Table            
            jq_table.find(">tbody>tr>td").width("");

            _designerTable._positionHandlers();
        },

        _reduceAllColumnSizesByRatio: function (columns, columnSizes, excessWidth)
        {
            var totalWithExcess = excessWidth + 100;
            for (var i = 0; i < columns.length; i++)
            {
                var size = (columnSizes[i] / totalWithExcess * 100) + "%";
                columns[i].style.width = size;
            }
        },

        _reduceSpecificColumnSizesByRatio: function (sizableColumns, excessWidth, excludedTotal)
        {
            var subsetTotal = 100 - excludedTotal;
            var subsetExcessTotal = subsetTotal + excessWidth;

            for (var i = 0; i < sizableColumns.length; i++)
            {
                var size = (sizableColumns[i].size / subsetExcessTotal * subsetTotal) + "%";
                sizableColumns[i].column.style.width = size;
            }
        },

        _reduceSpecificColumnSizesByBucket: function (sizableColumns, minWidth, excessWidth, excludedTotal)
        {
            var widthToDistribute = excessWidth;
            var maxSize = 0;
            var maxColIndex = 0;
            var isFraction = false;
            var distributedCount = 0;

            while (widthToDistribute > 0)
            {
                var somethingWasChanged = false;
                for (var i = 0; i < sizableColumns.length; i++)
                {
                    // remember largest column
                    if (sizableColumns[i].size > maxSize)
                    {
                        maxColIndex = i;
                    }
                    if (sizableColumns[i].size - 1 >= minWidth)
                    {
                        sizableColumns[i].size--;
                        widthToDistribute--;
                        distributedCount++;
                        somethingWasChanged = true;

                        if (widthToDistribute < 1 && widthToDistribute > 0)
                        {
                            isFraction = true;
                            break;
                        }
                    }
                }

                // makes sure we exit if we looped through columns and nothing was changed the algorithm failed.
                if (!somethingWasChanged)
                {
                    return false;
                }

                if (isFraction)
                {
                    sizableColumns[maxColIndex].size -= widthToDistribute;
                    distributedCount += widthToDistribute;
                    widthToDistribute = 0;
                }
            }
            return true;
        },

        _reduceColumnSizes: function (columns, columnSizes, excessWidth, minWidth)
        {
            var columnCount = columnSizes.length;
            var sizableColumns = [];
            var reductionPossible = 0;
            var excludedTotal = 0;
            for (var i = 0; i < columnCount; i++)
            {
                if (columnSizes[i] > minWidth)
                {
                    sizableColumns.push(
                        {
                            size: columnSizes[i],
                            column: columns[i]
                        });
                    reductionPossible += columnSizes[i] - minWidth;
                }
                else
                {
                    excludedTotal += columnSizes[i];
                }
            }

            if (reductionPossible >= excessWidth)
            {

                var result = this._reduceSpecificColumnSizesByBucket(sizableColumns, minWidth, excessWidth, excludedTotal);
                if (result === true)
                {
                    for (var i = 0; i < sizableColumns.length; i++)
                    {
                        sizableColumns[i].column.style.width = sizableColumns[i].size + "%";
                    }
                }
                else
                {
                    //if the Bucket algorithm fails revert to a ratio method which calculates a ratio based on the sizable columns
                    //the Bucket algortim will fail if there is a small factional different between the min column size and the amount that need to be removed
                    //eg at 1024 if there are 17 columns of 6 % the total will be 102 leaving 2 remaining ... the bukket will not be able to remove from any column however
                    this._reduceSpecificColumnSizesByRatio(sizableColumns, excessWidth, excludedTotal);
                }
            }
            else
            {
                //if the number of columns is sufficent such that 100/no > min width the possible reduction will be less than the excess width
                //Eg 30 columns 1024x768 with one column 30%
                this._reduceAllColumnSizesByRatio(columns, columnSizes, excessWidth);
            }
        },

        _coerceListViewColumnSizes: function (table, focusedColumnIndex)
        {
            var floatingPointZero = 0.001;
            var minPixelWidth = 25;
            var columnSizes = [];
            var columns = table.find(">.editor-body-colgroup>col");
            var totalWidth = 0;

            for (var i = 0; i < columns.length; i++)
            {
                var size = parseFloat(columns[i].style.width);
                columnSizes.push(size);
                totalWidth += size;
            }

            var widthToDistribute = 100 - totalWidth;
            if (widthToDistribute === 0)
                return;  //exit quick do nothing

            var tableWidth = table.width();
            var minWidth = (minPixelWidth * 100 / (tableWidth)); //10px 100/(tableWidth/10)

            // column sizes are MORE than 100, we need to reduce them
            if (widthToDistribute < -floatingPointZero)
            {
                _designerTable._reduceColumnSizes(columns, columnSizes, -widthToDistribute, minWidth);
            }

            // TODO: this is bad, reduce columns reduces to less than 100 sometimes, no time to fix this now,
            // will do later, or Morne or Sean can have a stab at it :)

            // recalculating because of bad reduce logic

            //TODO check if the above ever causes the below again

            columnSizes = [];
            totalWidth = 0;
            var oldWidthToDistribute = widthToDistribute;
            for (var i = 0; i < columns.length; i++)
            {
                var size = parseFloat(columns[i].style.width);
                columnSizes.push(size);
                totalWidth += size;
            }
            widthToDistribute = 100 - totalWidth;

            if (widthToDistribute > floatingPointZero)
            {
                // check if we have a priority column to apply the first distribution to
                if (checkExists(focusedColumnIndex))
                {
                    if (widthToDistribute >= 1)
                    {
                        columnSizes[focusedColumnIndex] += 1;
                        widthToDistribute -= 1;
                    }
                    else
                    {
                        columnSizes[focusedColumnIndex] += widthToDistribute;
                        widthToDistribute = 0;
                    }
                }

                if (widthToDistribute > 0)
                {
                    for (var i = 0; i < columns.length; i++)
                    {
                        if (checkExists(focusedColumnIndex) && focusedColumnIndex === i)
                        {
                            continue;
                        }

                        if (widthToDistribute >= 1)
                        {
                            columnSizes[i] += 1;
                            widthToDistribute -= 1;
                        }
                        else
                        {
                            columnSizes[i] += widthToDistribute;
                            widthToDistribute = 0;
                        }

                        if (widthToDistribute === 0)
                        {
                            break;
                        }
                    }
                }
                for (var i = 0; i < columns.length; i++)
                {
                    columns[i].style.width = "{0}%".format(columnSizes[i]);
                }
            }

        },

        //------------------------------------------------------------------------------------------

        //Remove empty columns and append drag handlers
        _attachColumnGroupColumns: function (tableID)
        {
            var jq_table = jQuery("#" + tableID);

            SourceCode.Forms.TableHelper.removeEmptyColumns(jq_table);

            //Create drag handler if it doesn't exist
            var jq_columnResizeWrapperDiv = jQuery("#" + tableID + "_columnResizeWrapperDiv");
            if (jq_columnResizeWrapperDiv.length === 0)
            {
                jq_columnResizeWrapperDiv = jQuery("<div></div>");

                jq_columnResizeWrapperDiv.attr("id", tableID + "_columnResizeWrapperDiv");
                jq_columnResizeWrapperDiv.addClass("columnWrapperDiv");

                jq_table.closest('.controlwrapper').append(jq_columnResizeWrapperDiv);
            }

            //Clear the width for the cell for List View Table
            jq_table.find(">tbody>tr>td").width("");

            _designerTable._positionHandlers();
        },

        _getControlNameParts: function (controlName)
        {
            var pattern = new RegExp("[0-9]*$");
            var match = pattern.exec(controlName);

            if (match[0] !== "")
            {
                // remove any leading zeroes
                var numberPart = match[0].replace(/^[0]+/g, "");
                var newName = controlName.replace(numberPart, "");

                return { name: newName, index: parseInt(numberPart) };
            }
            return { name: controlName, index: 0 };
        },

        _createControlTypeIndexes: function ()
        {
            // update control indexes
            var controlsXml = _designerTable.View.viewDefinitionXML.selectNodes("//Views/View/Controls/Control");
            for (var i = 0; i < controlsXml.length; i++)
            {
                var controlNode = controlsXml[i];
                var controlName = controlNode.selectSingleNode("Name").text;

                // check if any numbers exist at the end of the controlname
                var parts = _designerTable._getControlNameParts(controlName);
                if (parts.index > 0)
                {
                    if (!checkExists(_designerTable.View.controlTypeIndexes[parts.name]))
                    {
                        _designerTable.View.controlTypeIndexes[parts.name] = parts.index;
                    }
                    else if (_designerTable.View.controlTypeIndexes[parts.name] < parts.index)
                    {
                        _designerTable.View.controlTypeIndexes[parts.name] = parts.index;
                    }
                }
                else
                {
                    if (!checkExists(_designerTable.View.controlTypeIndexes[parts.name]))
                    {
                        _designerTable.View.controlTypeIndexes[parts.name] = parts.index;
                    }
                }
            }
        },

        _BuildControlName: function (id, prefix, controlType)
        {
            var controlDisplayName = _designerTable._getControlDisplayName(controlType);
            var baseName = '';
            if (prefix === '')
            {
                baseName = controlDisplayName;
            }
            else
            {
                baseName = prefix + ' ' + controlDisplayName;
            }

            if (!checkExists(_designerTable.View.controlTypeIndexes[baseName]))
            {
                _designerTable.View.controlTypeIndexes[baseName] = 0;
                return baseName;
            }
            else
            {
                var index = ++_designerTable.View.controlTypeIndexes[baseName];
                return baseName + index;
            }
        },

        _getControlDisplayName: function (controlType)
        {
            var ControlsDoc = SourceCode.Forms.Designers.Common.controlDefinitionsXml;
            var ControlElem = ControlsDoc.selectSingleNode('Controls/Control[Name="' + controlType + '"]');
            var retVal;

            if ($chk(ControlElem))
            {
                retVal = ControlElem.selectSingleNode('FriendlyName').text;
            } else
            {
                retVal = controlType;
            }

            return retVal;
        },

        _setupColumnOverlay: function (td)
        {
            if (!checkExists(td) || td.length === 0)
                return;

            var cellBounds = _designerTable._getElementBounds(td);
            var divOverlayHeight = _designerTable._getFooterTopPosition() - 1;
            var divOverlay = $(".column-selected-overlay");
            var closestTable = td.closest('table');

            if (divOverlay.length === 0)
            {
                divOverlay = $("<div class='column-selected-overlay'></div>");
                closestTable.after(divOverlay);
            }
            else
            {
                divOverlay.show();
            }

            if (td.hasClass("error"))
            {
                divOverlay.addClass("error");
                // Set the title of the overlay to be the column header cell's title
                divOverlay.attr('title', closestTable.find('tr.header td:nth-child({0})'.format(td[0].cellIndex + 1)).attr('title'));
            }
            else
            {
                divOverlay.removeClass("error");
                divOverlay.attr('title', '');
            }

            divOverlay.css("top", cellBounds.top);
            divOverlay.css("left", cellBounds.left);
            divOverlay.css("width", cellBounds.width);
            divOverlay.css("height", divOverlayHeight);
            _designerTable.ViewDesigner.View.canvas.css("overflow", "hidden");

            // Linking overlay to column
            divOverlay.data("column", td);

            _designerTable._positionHandlers(td[0].cellIndex, td.closest("table").attr("id"));
            _designerTable.ViewDesigner.DragDrop._makeColumnHeaderDraggable(td);
        },

        _getElementBounds: function (elem)
        {

            var position = elem.position();
            var width = elem.outerWidth();
            var height = elem.outerHeight();
            var offset = elem.offset();

            return {
                left: position.left,
                leftOffset: offset.left,
                right: position.left + width,
                rightOffset: offset.left + width,
                top: position.top,
                topOffset: offset.top,
                bottom: position.top + height,
                bottomOffset: offset.top + height,
                width: width,
                height: height
            }
        },

        //happens on drop of a handle when resizing columns horizontally.
        // TFS 777686 - This algorithm must use the ColGroups and not the First TR as truth as you can merge table cells in the designer (item view).
        _positionHandlers: function (dragBlockColIndex, dragBlockTableID)
        {
            SourceCode.Forms.Designers.View.DesignerTable.normalizeTables();
            var rtl = document.documentElement.getAttribute("dir") === "rtl" || false; // Calculating the direction
            var jq_tables = checkExists(dragBlockColIndex) && dragBlockTableID ? jQuery("table#" + dragBlockTableID + ".editor-table") : jQuery('table.editor-table');
            var tablesLength = jq_tables.length;
            var minColWidth = 25;

            for (var t = 0; t < tablesLength; t++)
            {
                var tableElem = jQuery(jq_tables[t]);
                var tableID = tableElem.attr("id");
                var tableBounds = _designerTable._getElementBounds(tableElem);
                var divOverlayHeight = _designerTable._getFooterTopPosition() - 1;
                var groupCols = tableElem.find("> colgroup.editor-body-colgroup > col");
                var columnResizeWrapper = jQuery("#" + tableID + "_columnResizeWrapperDiv");
                var dragHandlers = columnResizeWrapper.find("div.drag-column").removeClass("start end");

                // Sanity checks.
                if (columnResizeWrapper.length === 0 || groupCols.length === 0)
                {
                    continue;
                }

                var tableWidth = tableElem.width();
                var totalLeft = 0;
                var totalLeftPixels = 0;

                if (rtl)
                {
                    // Setting the positions of the draghandlers - Only draghandles in the middle columns.
                    for (var g = groupCols.length; g >= 0; g--)
                    {
                        var dragColumn = dragHandlers.eq(g);

                        // Add extra draghandlers.
                        if (dragColumn.length === 0)
                        {
                            dragColumn = _designerTable.createDragColumn(tableID);
                            columnResizeWrapper.append(dragColumn);
                            _designerTable._makeColumnDraggable(dragColumn);
                        }

                        // Position and size
                        dragColumn.css("left", totalLeftPixels + "px");

                        if (divOverlayHeight > 0)
                        {
                            dragColumn.css("height", divOverlayHeight);
                        }

                        var leftContainment;
                        var rightContainment;

                        if (g === 0) // first
                        {
                            dragColumn.addClass("start");

                            leftContainment = 0;
                            rightContainment = 0;
                        }
                        else if (g === groupCols.length) // last
                        {
                            dragColumn.addClass("end");

                            leftContainment = tableBounds.rightOffset;
                            rightContainment = leftContainment;
                        }
                        else
                        {
                            // left containment
                            var leftColGroup = groupCols.eq(g);
                            var leftColWidth = _designerTable._getColumnPixelWidth(leftColGroup);
                            leftContainment = tableBounds.leftOffset + (totalLeftPixels - leftColWidth) + minColWidth;

                            // right containment
                            var rightColGroup = groupCols.eq(g - 1);
                            var rightColWidth = _designerTable._getColumnPixelWidth(rightColGroup);
                            rightContainment = tableBounds.leftOffset + (totalLeftPixels + rightColWidth) - minColWidth;

                        }

                        // Show drag-block.
                        if (g > 0 && g < groupCols.length)
                        {
                            if (dragBlockColIndex === g - 1 || dragBlockColIndex === g)
                            {
                                dragColumn.find(".drag-block").show();
                            }
                        }

                        // Set containment.
                        if (dragColumn.isWidget("draggable"))
                        {
                            dragColumn.draggable('option', 'containment', [leftContainment, 0, rightContainment, 0]);
                        }

                        // Calculate position for next drag element
                        var jq_col = groupCols.eq(g - 1);
                        var colWidth = jq_col.width();

                        totalLeftPixels += colWidth;
                    }
                }
                else
                {
                    // Setting the positions of the draghandlers - Only draghandles in the middle columns.
                    for (var g = 0; g <= groupCols.length; g++)
                    {
                        var dragColumn = dragHandlers.eq(g);

                        // Add extra draghandlers.
                        if (dragColumn.length === 0)
                        {
                            dragColumn = _designerTable.createDragColumn(tableID);
                            columnResizeWrapper.append(dragColumn);
                            _designerTable._makeColumnDraggable(dragColumn);
                        }

                        // Position and size
                        dragColumn.css("left", totalLeftPixels + "px");

                        if (divOverlayHeight > 0)
                        {
                            dragColumn.css("height", divOverlayHeight);
                        }

                        var leftContainment;
                        var rightContainment;

                        if (g === 0) // first
                        {
                            dragColumn.addClass("start");

                            leftContainment = 0;
                            rightContainment = 0;
                        }
                        else if (g === groupCols.length) // last
                        {
                            dragColumn.addClass("end");

                            leftContainment = tableBounds.rightOffset;
                            rightContainment = leftContainment;
                        }
                        else
                        {
                            // left containment
                            var leftColGroup = groupCols.eq(g - 1);
                            var leftColWidth = _designerTable._getColumnPixelWidth(leftColGroup);
                            leftContainment = tableBounds.leftOffset + (totalLeftPixels - leftColWidth) + minColWidth;

                            // right containment
                            var rightColGroup = groupCols.eq(g);
                            var rightColWidth = _designerTable._getColumnPixelWidth(rightColGroup);
                            rightContainment = tableBounds.leftOffset + (totalLeftPixels + rightColWidth) - minColWidth;
                        }

                        // Show drag-block.
                        if (g > 0 && g < groupCols.length)
                        {
                            if (dragBlockColIndex === g - 1 || dragBlockColIndex === g)
                            {
                                dragColumn.find(".drag-block").show();
                            }
                        }

                        // Set containment.
                        if (dragColumn.isWidget("draggable"))
                        {
                            dragColumn.draggable('option', 'containment', [leftContainment, 0, rightContainment, 0]);
                        }

                        // Calculate position for next drag element
                        var jq_col = groupCols.eq(g);
                        var colWidth = _designerTable._getColumnPixelWidth(jq_col);

                        totalLeftPixels += colWidth;
                    }
                }

                if (SourceCode.Forms.Designers.Common.isTableControl(tableElem))
                {
                    //dragHandler should only be applied to the List View Table and Editable list view Table.
                    //Table Controls should use the column resize widget to perform resizing of the columns.
                    columnResizeWrapper.addClass("disabled");
                    columnResizeWrapper.find("div.drag-column").addClass("disabled");
                }
            }
        },

        _TableColumnCount: function (table)
        {
            var maxCols = 0;

            if (checkExists(table))
            {
                //Loop through rows
                var rows = table.find('>tbody>tr');
                for (var r = 0; r < rows.length; r++)
                {
                    //Get instance of the current row
                    var oCRow = jQuery(rows[r]);
                    if (oCRow.length > 0)
                    {
                        //Loop through cols for each row
                        var cells = oCRow.find('>td');
                        for (var c = 0; c < cells.length; c++)
                        {
                            //Make sure we have the widest cols
                            maxCols = cells.length > parseInt(maxCols) ? cells.length : parseInt(maxCols);
                        }
                    }
                }
            }
            return maxCols;
        },


        //Note: there is another version of this in TableBehavior.js, should we be using that?
        _removeEmptyRows: function (table)
        {
            var rowsToRemove = [];
            var rows = table.find(">tbody>tr");
            var len = rows.length;
            for (var i = 0; i < len; i++)
            {
                var row = rows.eq(i);
                if (row.children("td").length === 0)
                {
                    // get cell from the previous row
                    var cell = row.prev("tr").find("td:first-child");
                    cell[0].rowSpan = cell[0].rowSpan - 1;
                    rowsToRemove.push(row);
                }
            }

            len = rowsToRemove.length;
            for (i = 0; i < len; i++)
            {
                jQuery(rowsToRemove[i]).remove();
            }
        },

        _delegateClearCell: function (contextobject)
        {
            if (contextobject && contextobject.length > 0)
            {
                var _tableBehavior = SourceCode.Forms.Controls.Web.TableBehavior.prototype;

                if (!contextobject.is('.editor-cell'))
                {
                    contextobject = SourceCode.Forms.TableHelper.getCellFromElement(contextobject);
                    if (contextobject.length === 0)
                    {
                        return;
                    }
                }

                if (_designerTable.ViewDesigner._getViewType() === "CaptureList"
                    && contextobject.is(".header.editor-cell"))
                {
                    _tableBehavior._removeColumn(contextobject, SourceCode.Forms.Designers.View);
                }
                else
                {
                    _tableBehavior._clearCell(contextobject, SourceCode.Forms.Designers.View);
                }

                _designerTable._positionHandlers();
            }
        },

        _removeHeaderAlignmentStyle: function (styleXpath, cellIndex)
        {
            var headerControl = jQuery("#bodySection table.editor-table>tbody>tr.editor-row:nth-child(1)>td:nth-child({0}) div.controlwrapper".format(cellIndex + 1));
            var headerControlId = headerControl[0].id;
            var headerStylesNode = _designerTable.Styles._getStylesNode(headerControlId);

            if (checkExists(headerStylesNode))
            {
                var headerStyle = SCStyleHelper.getPrimaryStyleNode(headerStylesNode);
                if (checkExists(headerStyle))
                {
                    var styleNode = headerStyle.selectSingleNode(styleXpath);
                    if (checkExists(styleNode))
                    {
                        styleNode.parentNode.removeChild(styleNode);
                        _designerTable.Styles.populateListHeadingControlStyle(headerControl, headerStyle);
                    }
                }
            }
        },

        _setAlignment: function (alignment, passedContextObject)
        {
            var contextobject = passedContextObject;
            if (!checkExists(contextobject))
            {
                //don't use _findControlFromSelectedObject (forces the use of column for alignment in a list view)
                contextobject = _designerTable.View.selectedObject;
            }
            if (!checkExists(contextobject) || contextobject.length === 0)
                return;
            var isInEditTemplate = contextobject.closest("table.capturelist-editor-table").length > 0;
            var isInToolbarTable = contextobject.closest("table.editor-table.toolbar").length > 0;
            var contextIsInFooter = contextobject.closest("tr").is(".footer");
            var isCaptureList = _designerTable.ViewDesigner._getViewType() === "CaptureList";
            var contextObjectPassedThrough = checkExists(passedContextObject);
            var type, defaultStyle;
            if (isCaptureList && !contextIsInFooter && !contextObjectPassedThrough && !isInEditTemplate && !isInToolbarTable)
            {
                var cellIndex = contextobject[0].cellIndex;
                _designerTable._removeHeaderAlignmentStyle("Text/Align", cellIndex);

                var colGroupItem = contextobject.closest("table").find(">colgroup>col:nth-child({0})".format(cellIndex + 1));
                type = "Column";
                defaultStyle = SCStyleHelper.getPrimaryStyleNode(_designerTable.Styles._getStylesNode(colGroupItem.attr("id"), type));
                _designerTable.Styles._setTextAlignment(defaultStyle, alignment);
                _designerTable.Styles.populateColumnControlStyle(cellIndex, defaultStyle);
            }
            else
            {
                var id = contextobject.attr("id");
                type = contextobject.attr("controltype");
                if (checkExists(id))
                {
                    defaultStyle = SCStyleHelper.getPrimaryStyleNode(_designerTable.Styles._getStylesNode(id, type));
                    _designerTable.Styles._setTextAlignment(defaultStyle, alignment);
                    _designerTable.Styles._applyControlStyles(contextobject, defaultStyle);
                }
            }
        },

        _setVerticalAlignment: function (alignment, passedContextObject)
        {
            var contextobject = passedContextObject;
            if (!checkExists(contextobject))
            {
                //don't use _findControlFromSelectedObject (forces the use of column for alignment in a list view)
                contextobject = _designerTable.View.selectedObject;
            }

            if (!checkExists(contextobject) || contextobject.length === 0)
                return;

            var isInEditTemplate = contextobject.closest("table.capturelist-editor-table").length > 0;
            var isInToolbarTable = contextobject.closest("table.editor-table.toolbar").length > 0;
            var contextIsInFooter = contextobject.closest("tr").is(".footer");
            var isCaptureList = _designerTable.ViewDesigner._getViewType() === "CaptureList";
            var contextObjectPassedThrough = checkExists(passedContextObject);
            var defaultStyle, type;
            if (isCaptureList && !contextIsInFooter && !contextObjectPassedThrough && !isInEditTemplate && !isInToolbarTable)
            {
                var cellIndex = contextobject[0].cellIndex;
                _designerTable._removeHeaderAlignmentStyle("VerticalAlign", cellIndex);

                // get corrosponding column
                var colGroupItem = contextobject.closest("table").find(">colgroup>col:nth-child({0})".format(cellIndex + 1));

                type = colGroupItem.attr("controltype");
                defaultStyle = SCStyleHelper.getPrimaryStyleNode(_designerTable.Styles._getStylesNode(colGroupItem.attr("id"), type));
                _designerTable.Styles._setVerticalAlignment(defaultStyle, alignment);
                _designerTable.Styles.populateColumnControlStyle(cellIndex, style);
            }
            else
            {
                var id = contextobject.attr("id");
                if (checkExists(id))
                {
                    type = contextobject.attr("controltype");
                    defaultStyle = SCStyleHelper.getPrimaryStyleNode(_designerTable.Styles._getStylesNode(id, type));
                    _designerTable.Styles._setVerticalAlignment(defaultStyle, alignment);

                    var style = _designerTable.Styles._setVerticalAlignment(defaultStyle, alignment);
                    _designerTable.Styles._applyControlStyles(contextobject, defaultStyle);
                }
            }
        },

        _removeEditableColumn: function (index)
        {
            var editorTable = jQuery("#editableSection table.capturelist-editor-table");

            var thisCol = editorTable.find(">colgroup>col").eq(index);
            var thisCell = editorTable.find(">tbody>tr>td:nth-child({0})".format(index + 1));
            if (thisCell.length > 0)
            {
                _designerTable.ViewDesigner._cleanupChildren(thisCell, true);
                thisCell.remove();
                thisCol.remove();
            }

            _designerTable._synchronizeEditableColumns();

        },

        _synchronizeEditableColumns: function ()
        {
            var bodyTable = jQuery("#bodySection table.editor-table");
            var editorTable = jQuery("#editableSection table.capturelist-editor-table");

            var bodyTableCols = bodyTable.find(">colgroup>col");
            var editorTableCols = editorTable.find(">colgroup>col");
            if (bodyTableCols.length !== editorTableCols.length)
            {
                // TODO: Consider throwing an error
                return;
            }

            //Sync column width
            for (var i = 0; i < bodyTableCols.length; i++)
            {
                //Configured width stores the value with the unit e.g. 20% or 20px.
                var widthText = bodyTableCols.eq(i).data("width");

                editorTableCols[i].style.width = widthText;
                editorTableCols.eq(i).data("width", widthText);
            }
        },

        _SetRowCellLayout: function (row)
        {
            if (row.length > 0)
            {
                var rowChildren = row.children();
                var cellCount = rowChildren.length;
                var dynamicCellCount = 0;

                //get the number of dynamic columns
                for (var i = 0; i < cellCount; i++)
                {
                    var cell = jQuery(rowChildren[i]);
                    var width = cell[0].style.width;
                    if (width === '' || width.indexOf('%') >= 0 || width === '0px' || width === 'auto')
                    {
                        dynamicCellCount++;
                    }
                }

                //set the widths of the dynamic columns	
                for (var j = 0; j < cellCount; j++)
                {
                    var cell = jQuery(rowChildren[j]);
                    var width = cell[0].style.width;
                    if (width === '' || width.indexOf('%') >= 0 || width === '0px' || width === 'auto')
                    {
                        if (dynamicCellCount > 1)
                        {
                            cell.css("width", (100 / dynamicCellCount) + '%');
                        }
                        else
                        {
                            cell.css("width", "");
                        }
                    }
                }
            }
        },

        //TODO - Remove: This function is not been called anymore and logic has been moved to tablehelper.js
        //_mergeRight: function (contextobject)
        //{
        //    if (contextobject.length > 0)
        //    {
        //        if (!contextobject.is('td'))
        //        {
        //            contextobject = SourceCode.Forms.TableHelper.getCellFromElement(contextobject);
        //        }

        //        var span = contextobject.attr('colspan');
        //        var index = contextobject[0].cellIndex;
        //        var siblingIndex;
        //        var row = contextobject.parent();
        //        if (row.length > 0)
        //        {
        //            var rowIndex = row[0].rowIndex;

        //            if (!checkExists(span))
        //            {
        //                span = 1;
        //            }

        //            var cells = row.find('>td');
        //            var sibling = contextobject.next();
        //            var nextTdhildControls;

        //            if (sibling.length > 0)
        //            {
        //                nextTdhildControls = sibling.find('.controlwrapper, .non-breaking-space, .line-break');
        //                var tdControls = contextobject.find('.controlwrapper');

        //                if (tdControls.length > 0 && nextTdhildControls.length > 0)
        //                {
        //                    var br = jQuery("<div layouttype='line-break' class='line-break' >&nbsp;</div>");
        //                    contextobject.append(br);
        //                }

        //                if (nextTdhildControls.length > 0)
        //                {
        //                    nextTdhildControls.appendTo(contextobject);
        //                }

        //                var siblingSpan = sibling.attr('colspan');
        //                if (!checkExists(siblingSpan))
        //                {
        //                    span++;
        //                }
        //                else
        //                {
        //                    // make sure the result is a number otherwise the strings gets concatenated
        //                    span = Number(span) + Number(siblingSpan);

        //                }
        //                contextobject.attr('colspan', span);

        //                ////cleanup sibling
        //                //_designerTable.ViewDesigner._cleanupChildren(sibling);

        //                sibling.remove();

        //                var table = row.closest("table");
        //                SourceCode.Forms.Designers.updateTableArray(table, _designerTable.View.tableArrays[table.attr("id")]);

        //                _designerTable.View.isViewChanged = true;
        //            }
        //        }
        //    }
        //},

        _addEditableColumn: function (index, newCellWidth, position, colgroup)
        {
            var table = jQuery("#editableSection table.capturelist-editor-table");
            var nonEditorRow = table.find(">tbody>tr.non-editor-row");
            var editorRow = table.find(">tbody>tr.editor-row");
            var nonEditorRowCell = nonEditorRow.find(">td").eq(0);
            var nonEditorCellColSpan = parseInt(nonEditorRowCell.attr('colSpan'));
            var thisCell = jQuery(editorRow.find('>td').eq(index));

            nonEditorRowCell.attr('colSpan', (nonEditorCellColSpan + 1));

            // New Cell
            var cell = jQuery('<td></td>');
            var colId = String.generateGuid();
            cell.attr('id', colId);

            var newCol = jQuery("<col style='width:{0}'>".format(newCellWidth));
            var thisCol = table.find(">colgroup>col").eq(index);
            switch (position)
            {
                case 'before':
                    if (thisCell.length > 0)
                    {
                        cell.insertBefore(thisCell);
                        newCol.insertBefore(thisCol);
                    }
                    else
                    {
                        editorRow.append(cell);
                        table.find(">colgroup").append(newCol);
                    }

                    break;
                case 'after':
                    if (thisCell.length > 0)
                    {
                        cell.insertAfter(thisCell);
                        newCol.insertAfter(thisCol);
                    } else
                    {
                        editorRow.append(cell);
                    }

                    break;
                case 'append':
                    editorRow.append(cell);
                    table.find(">colgroup").append(newCol);
                    break;
            }

            _designerTable._configureCell('#editableSection', editorRow, cell, '');
            _designerTable._synchronizeEditableColumns();
        },

        _makeColumnDraggable: function (dragHandler)
        {
            dragHandler.draggable({
                cursorAt: { "left": (dragHandler.width() / 2) },
                axis: 'x',
                helper: "clone",
                start: function (e, ui)
                {
                    if ((SourceCode.Forms.Designers.Form && SourceCode.Forms.Designers.Form._checkOut()) || (_designerTable.View && _designerTable.View.CheckOut._checkViewStatus()))
                    {
                        e.stopPropagation();

                        var jq_helper = ui.helper;
                        var jq_handler = jQuery(this);
                        var tableID = jq_handler.data("tableID");
                        var table = document.getElementById(tableID);

                        jq_helper.addClass("hover");

                        table.style.cursor = "col-resize";
                        document.body.style.cursor = "col-resize";
                        jq_helper[0].style.cursor = "col-resize";
                    }
                    else
                    {
                        ui.helper.remove();
                        return false;
                    }
                },
                drag: function (e, ui)
                {
                    e.stopPropagation();

                    var jq_helper = ui.helper;
                    var jq_handler = jQuery(this);
                    var containment = jq_handler.draggable("option", "containment");
                    var leftContainment = containment[0];
                    var rightContainment = containment[2];
                    var leftPosition = ui.offset.left;

                    var tableID = jq_handler.data("tableID");
                    var table = document.getElementById(tableID);

                    if (leftPosition <= leftContainment)
                    {
                        table.style.cursor = "not-allowed";
                        document.body.style.cursor = "not-allowed";
                        jq_helper[0].style.cursor = "not-allowed";
                        ui.offset.left = leftContainment;
                    }
                    else if (leftPosition >= rightContainment)
                    {
                        table.style.cursor = "not-allowed";
                        document.body.style.cursor = "not-allowed";
                        jq_helper[0].style.cursor = "not-allowed";
                        ui.offset.left = rightContainment;
                    }
                    else
                    {
                        table.style.cursor = "col-resize";
                        document.body.style.cursor = "col-resize";
                        jq_helper[0].style.cursor = "col-resize";
                    }

                    //return false;
                },
                stop: function (e, ui)
                {
                    e.stopPropagation();

                    var rtl = document.documentElement.getAttribute("dir") === "rtl" || false; // Calculating the direction

                    var jq_handler = jQuery(this);
                    var jq_helper = ui.helper;
                    jq_helper.removeClass("hover");
                    var tableID = jq_handler.data("tableID");
                    var columnIndex = jq_handler.parent().children(":not(.start, .end)").index(jq_handler);
                    var jq_table = jQuery("#" + tableID);
                    var tableWidth = jq_table.width();
                    var tableColumns = jq_table.find(">.editor-body-colgroup>col");
                    var jq_col = tableColumns.eq(columnIndex);

                    var handlerLeft = ui.position.left;
                    var tableRows = jq_table.find(">tbody>tr");

                    jq_table[0].style.cursor = "";
                    document.body.style.cursor = "";
                    jq_helper[0].style.cursor = "";

                    var newColWidthPixels = null;
                    var newNextColWidthPixels = null;

                    if (columnIndex < tableColumns.length - 1)
                    {
                        // Calculate the drag difference
                        var dragDifference = 0;
                        if (rtl)
                        {
                            dragDifference = parseFloat(jQuery(e.target).offset().left) - parseFloat(jQuery(ui.helper).offset().left);
                        }
                        else
                        {
                            dragDifference = parseFloat(jQuery(ui.helper).offset().left) - parseFloat(jQuery(e.target).offset().left);
                        }

                        _designerTable._updateColumnWidth(tableID, columnIndex, dragDifference);

                        newColWidthPixels = _designerTable._getColumnPixelWidth(tableColumns.eq(columnIndex));
                        newNextColWidthPixels = _designerTable._getColumnPixelWidth(tableColumns.eq(columnIndex + 1));

                        _designerTable._checkIfControlRequiresResize(tableRows, columnIndex, newColWidthPixels, newNextColWidthPixels);
                    }

                    //resize editable section columns
                    if (_designerTable.View && _designerTable.View.SelectedViewType === 'CaptureList')
                    {
                        if (_designerTable.View.selectedOptions.EnableListEditing)
                        {
                            _designerTable._synchronizeEditableColumns();
                            var editableTableRows = jQuery(".capturelist-editor-table").find(">tbody>tr.editor-row");

                            _designerTable._checkIfControlRequiresResize(editableTableRows, columnIndex, newColWidthPixels, newNextColWidthPixels);

                            _designerTable._synchronizeEditableColumns();
                        }

                        if (checkExists(_designerTable.View.selectedObject) && _designerTable.View.selectedObject.is(":not(.editor-canvas)") && _designerTable.View.selectedObject.closest("#bodySection").length > 0)
                        {
                            _designerTable._setupColumnOverlay(_designerTable.View.selectedObject);
                        }
                        else if (checkExists($(".column-selected-overlay").data("column")))
                        {
                            _designerTable._setupColumnOverlay($(".column-selected-overlay").data("column"));
                        }
                    }

                    // position resizehandlers
                    _designerTable._positionHandlers();

                    if (_designerTable.View && checkExists(_designerTable.View.propertyGrid))
                    {
                        _designerTable.View.propertyGrid.refresh();
                    }

                    SourceCode.Forms.Designers.Common.triggerEvent("ColumnWidthChanged");
                }
            });
        },

        normalizeTables: function ()
        {
            var i = 0;
            var jqTables = $(".editor-table");

            for (i = 0; i < jqTables.length; i++)
            {
                var t = jqTables.eq(i);

                if (t.is(":hidden"))
                {
                    //Only do normalization to the visible tables [TFS 884350]
                    continue;
                }

                if (!SourceCode.Forms.Designers._isListTable(t.closest(".controlwrapper")))
                {
                    _designerTable.normalizeTable(t);
                }
            }
        },

        //A constant to keep the minimum visual width of a column in design time,
        //so that the columns can still be selected.
        DESIGN_TIME_COLUMN_MIN_WIDTH: 40,


        //Make sure each column in the table repects the min-column-width in designer (so users can still click on the column to select it)
        normalizeTable: function (jqTable)
        {
            if (!checkExists(jqTable) || jqTable.length === 0)
            {
                return;
            }

            var i = 0;

            var cellWidths = SourceCode.Forms.TableHelper.getRenderedColumnPixelWidths(jqTable);
            var cellConfiguredWidths = SourceCode.Forms.TableHelper.getConfiguredColumnWidths(jqTable);

            var tableConfiguredWidth = jqTable.parent().width();
            var minTableWidth = this.DESIGN_TIME_COLUMN_MIN_WIDTH * cellWidths.length;

            for (i = 0; i < cellWidths.length; i++)
            {
                var w = cellWidths[i];

                if (w < this.DESIGN_TIME_COLUMN_MIN_WIDTH)
                {
                    SourceCode.Forms.TableHelper.setColumnRenderWidth(this.DESIGN_TIME_COLUMN_MIN_WIDTH + "px", i, jqTable);

                    if (SourceCode.Forms.TableHelper.isRenderedAsTable(jqTable) && tableConfiguredWidth >= minTableWidth)
                    {
                        //Only if the table's configured width is greater than the min-width of the table should we change the width to % unit type for IE and Edge [TFS 884319]
                        //This is because IE and Edge don't follow the W3C standard where if you have a column widths with mixed unit like [33%, 100px, 33%], change the middle column to smaller px width won't take effect. [TFS 883884]
                        if (SourceCode.Forms.Browser.edge ||
                            (SourceCode.Forms.Browser.msie && SourceCode.Forms.Browser.version.indexOf("11.0") >= 0)) //IE11
                        {
                            var newWidth = this.DESIGN_TIME_COLUMN_MIN_WIDTH;
                            var widthData = SourceCode.Forms.TableHelper.getDimensionUnitData(cellConfiguredWidths[i]);
                            if (widthData.type === "%")
                            {
                                newWidth = newWidth / jqTable.outerWidth() * 100;
                            }

                            //Set the render width on the column to the minimum
                            var strNewWidth = newWidth.toFixed(2) + widthData.type;
                            SourceCode.Forms.TableHelper.setColumnRenderWidth(strNewWidth, i, jqTable);
                        }
                    }
                }
                else
                {
                    SourceCode.Forms.TableHelper.setColumnRenderWidth(cellConfiguredWidths[i], i, jqTable);
                }
            }
        },

        _updateColumnWidth: function (tableId, columnIndex, dragDifference)
        {
            //In Form designer the table element's wrapper element has the same Id defined. 
            //Thus select the table like this in case there are duplicate Id defined in the canvas.
            var jqTable = $(".editor-table").filter("#" + tableId);

            if (jqTable.length === 0)
            {
                return;
            }

            var i = 0;
            var jqCol = null;
            var unit = null;
            var width = 0;
            var columnsWidth = [];
            var jqRow = _designerTable.getRowThatHasCellsThatMatchesToColumns(jqTable);
            var jqColumns = jqTable.find(">colgroup>col");
            var masterColumn = jqColumns.eq(columnIndex);
            var slaveColumn = jqColumns.eq(columnIndex + 1);
            var hasAutoWidth = false;

            for (i = 0; i < jqColumns.length; i++)
            {
                if (_designerTable._isColumnAutoWidth(jqColumns.eq(i)))
                {
                    hasAutoWidth = true;
                    break;
                }
            }

            var fullWidth = 0;
            //Loop through each columns and calulated the new width using the rendered width
            for (i = 0; i < jqRow[0].cells.length; i++)
            {
                var leftIndex = columnIndex;
                var rightIndex = columnIndex + 1;

                var jqCell = $(jqRow[0].cells[i]);
                var cellWidth = jqCell.outerWidth();

                var adjustedCellWidth = cellWidth;
                if (i === leftIndex)
                {
                    adjustedCellWidth += dragDifference;
                }
                else if (i === rightIndex)
                {
                    adjustedCellWidth -= dragDifference;
                }

                fullWidth += cellWidth;

                columnsWidth.push(adjustedCellWidth);
            }

            var isBothAuto = false;
            if (_designerTable._isColumnAutoWidth(masterColumn) && _designerTable._isColumnAutoWidth(slaveColumn))
            {
                isBothAuto = true;
            }

            for (i = 0; i < columnsWidth.length; i++)
            {
                jqCol = jqColumns.eq(i);

                unit = _designerTable.getColumnWidthUnitData(jqCol);

                width = columnsWidth[i];

                if (unit.type === "%")
                {
                    width = columnsWidth[i] / fullWidth * 100;
                }

                if (hasAutoWidth && !_designerTable._isColumnAutoWidth(masterColumn))
                {
                    if (i === columnIndex)
                    {
                        if (unit.type === "%")
                        {
                            jqCol.width(width + "%");
                            jqCol.data("width", width.toFixed(2) + "%");
                        }
                        else
                        {
                            jqCol.width(width + "px");
                            jqCol.data("width", width + "px");
                        }
                    }
                }
                else
                {
                    if (isBothAuto && i === columnIndex)
                    {
                        //Default to pixels: If both columns have [empty] widths (i.e. "take up remaining space" widths), 
                        //then the master column will be given a pixel width, and the slave remains[empty].
                        jqCol.width(width + "px");
                        jqCol.data("width", width + "px");
                    }
                    else if (unit.type === "px" || unit.type === "%")
                    {
                        jqCol.width(width + unit.type);

                        if (unit.type === "%")
                        {
                            jqCol.data("width", width.toFixed(2) + unit.type);
                        }
                        else
                        {
                            jqCol.data("width", width + unit.type);
                        }
                    }
                }
            }
        },

        //DEPRECATED: Please use TableHelper.getRenderedColumnPixelWidths() instead (returns array of pixel widths)
        //we should always be getting the column widths from <colgroup> if its a <table>
        //we should always be getting the column widths from <div class="editor-grid"> data-columns attribute, if its a css grid.
        //This particular implementation is dangerous, as there may not be a single row that has 1 cell per column due to merging.
        getRowThatHasCellsThatMatchesToColumns: function (jqTable)
        {
            var i = 0;
            var rowIndexToUse = 0;
            var table = jqTable[0];
            var jqColumns = jqTable.find(">colgroup>col");

            var rowIndexWithMaxCells = 0;
            var maxCells = 0;

            for (i = 0; i < table.rows.length; i++)
            {
                var cells = table.rows[i].cells;

                if (cells.length === jqColumns.length)
                {
                    return $(table.rows[i]);
                }

                if (cells.length > maxCells)
                {
                    rowIndexWithMaxCells = i;

                    maxCells = cells.length;
                }
            }

            //If not found, there is a mismatch with columns and cells so try to use the row that contain the max number of cells.
            return $(table.rows[rowIndexWithMaxCells]);
        },

        _isColumnAutoWidth: function (jqCol)
        {
            var width = jqCol.data("width");

            if (!checkExists(width) || width === "" || width === "auto")
            {
                return true;
            }

            return false;
        },

        getColumnWidthUnitData: function (jqCol)
        {
            var widthText = jqCol.data("width");

            return SourceCode.Forms.Designers.getWidthUnitData(widthText);
        },

        _getNumberOfColumnAutoWidth: function (jq_table)
        {
            var tableColumns = jq_table.find(">.editor-body-colgroup>col");

            var num = 0;

            for (var i = 0; i < tableColumns.length; i++)
            {
                if (tableColumns[i].style.width === "auto")
                {
                    num++;
                }
            }

            return num;
        },

        _getColumnPixelWidth: function (jqCol)
        {
            if (!checkExistsNotEmpty(jqCol) || jqCol.length === 0)
            {
                return 0;
            }

            var jqTable = jqCol.closest("table");
            var jqCols = jqTable.find("colgroup > col");
            var jqRow = _designerTable.getRowThatHasCellsThatMatchesToColumns(jqTable);
            var jqCell = jqRow.find("> td").eq(jqCols.index(jqCol));

            return jqCell.outerWidth();
        },

        _checkIfControlRequiresResize: function (tableRows, columnIndex, newColWidthPixels, newNextColWidthPixels)
        {
            // Loop thru rows to check that column sizes are not smaller than control sizes
            for (var t = 0; t < tableRows.length; t++)
            {
                var jq_row = tableRows.eq(t);
                var rowCols = jq_row.find(">td");
                var jq_column = null;
                var totalRowColumnSpan = 0;

                for (var r = 0; r < rowCols.length; r++)
                {
                    var currentRowColumn = rowCols.eq(r);
                    var currentRowColumnSpan = currentRowColumn.attr("colspan");
                    var currentRowColumnIndex = currentRowColumn.index();

                    if (currentRowColumnSpan > 1)
                    {
                        totalRowColumnSpan += currentRowColumnSpan;
                        if (totalRowColumnSpan === (columnIndex + 1))
                        {
                            jq_column = currentRowColumn;

                            break;
                        }
                    }
                    else
                    {
                        totalRowColumnSpan++;
                    }
                }

                if (!checkExists(jq_column))
                {
                    jq_column = jq_row.find(">td").eq(columnIndex);
                }

                var tdChildControls = jq_column.find('.controlwrapper');

                for (var c = 0; c < tdChildControls.length; c++)
                {
                    var jq_childControl = jQuery(tdChildControls[c]);

                    _designerTable._doControlResizing(jq_childControl, newColWidthPixels);
                }

                var jq_nextColumn = jq_column.next();
                var nextColumnControls = jq_nextColumn.find(".controlwrapper");

                for (var c = 0; c < nextColumnControls.length; c++)
                {
                    var jq_nextColumnControl = nextColumnControls.eq(c);

                    _designerTable._doControlResizing(jq_nextColumnControl, newNextColWidthPixels);
                }
            }
        },

        _doControlResizing: function (jq_ChildControl, columnNewWidth)
        {
            var controlMinWidth = parseInt(jq_ChildControl.css('min-width'));
            var controlType = jq_ChildControl.attr("controltype");
            var controlDefaultWidth = _designerTable.ViewDesigner._getControlDefaultProperty(controlType, 'Width');
            var controlCurrentWidth = _designerTable.ViewDesigner._getControlPropertyValue(jq_ChildControl.attr('id'), 'Width');
            var controlXML = _designerTable.ViewDesigner._getControlPropertiesXML(jq_ChildControl.attr('id'));

            if ($chk(controlCurrentWidth))
            {
                var setFunction = _designerTable.ViewDesigner._getPropertySetFunction(jq_ChildControl.attr('controltype'), 'Width');

                if (controlCurrentWidth.indexOf("%") >= 0)
                {
                    if (checkExists(setFunction))
                    {
                        var value = evalFunction(setFunction)(jq_ChildControl, controlCurrentWidth, controlXML);
                    }
                } else
                {
                    if (parseInt(controlCurrentWidth) > columnNewWidth)
                    {
                        if (checkExists(setFunction))
                        {
                            var value = evalFunction(setFunction)(jq_ChildControl, "100%", controlXML);
                            _designerTable.ViewDesigner._setControlPropertyValue(jq_ChildControl.attr("id"), "Width", "100%");
                        } else
                        {

                            _designerTable.ViewDesigner._resetDesignWidthControl(jq_ChildControl, jq_ChildControl.find(".resizewrapper"));
                        }
                    }
                }
            }
        },

        _removeEditorTableCellWidth: function ()
        {
            //Remove the width property of the cells, the cell width should be determined by the <col> elements of the table.
            //When the width property is defined, different browser has different behaviour when rendering the table. 
            //Related incident: TFS 940467
            jQuery("table.editor-table>tbody>tr.editor-row>td.editor-cell").removeAttr("width");
            jQuery("table.capturelist-editor-table>tbody>tr.editor-row>td.editor-cell").removeAttr("width");
        },

        _rebuildEditableListLayout: function ()
        {
            var table = jQuery("#bodySection table.editor-table");
            var contextRow = table.find(">tbody>tr.editor-row.list-view-item").eq(1);
            var columns = contextRow.find(">td.editor-cell");
            var columnsLength = columns.length;

            if (contextRow.length > 0)
            {
                for (var r = 0; r < 4; r++)
                {
                    var row = jQuery('<tr></tr>');
                    var rowId = String.generateGuid();
                    row.attr('id', rowId);
                    row.attr('layouttype', 'row');
                    row.addClass("editor-row");
                    row.addClass("dummy-row");
                    row.addClass("list-view-item");

                    contextRow.after(row);

                    for (var c = 0; c < columnsLength; c++)
                    {
                        var cell = jQuery('<td></td>');
                        var colId = String.generateGuid();
                        cell.attr('id', colId);

                        //						if (jQuery("#vdchkShadeAlternatingRows").is(":checked"))
                        //						{
                        //							if (r === 2 || r === 4)
                        //							{
                        //								row.children("td").addClass("alternate");
                        //							}
                        //						}

                        row.append(cell);

                        _designerTable._configureCell("bodySection", row, cell, '');
                    }

                    contextRow = row;
                }
            }

            if (_designerTable.View.selectedOptions.EnableListEditing)
            {
                _designerTable._generateEditableTable(columnsLength, false);

                var colGroupClone = table.children("colgroup").clone();
                var colGroupToReplace = $(".capturelist-editor-table").children("colgroup");
                colGroupToReplace.replaceWith(colGroupClone);

                //replace editableRow with saved row
                var savedRow = table.find(">tbody>tr:last-child");
                var editorRow = jQuery("#editableSection table.capturelist-editor-table>tbody>tr.editor-row");

                editorRow.replaceWith(savedRow);
            }
        },

        _addFooterRow: function ()
        {
            var table = jQuery("#bodySection table.editor-table");

            var tbody = table.find(">tbody");

            var row = jQuery('<tr></tr>');
            var rowId = String.generateGuid();
            row.attr('id', rowId);
            row.attr('layouttype', 'row');
            row.addClass('list-view-item');
            row.addClass('editor-row');
            row.addClass('footer');

            var cols = _designerTable._TableColumnCount(table);
            for (var i = 0; i < cols; i++)
            {
                var cell = jQuery('<td></td>');
                var colId = String.generateGuid();

                cell.attr('id', colId);
                row.append(cell);
                _designerTable._configureCell('footer', row, cell);
            }

            tbody.append(row);

            var placeholderFooterRow = jQuery("#footerControlDropPlaceHolder");
            placeholderFooterRow.remove();
            tbody.append(placeholderFooterRow);

            var footers = jQuery("tr.footer");
            jQuery(footers[footers.length - 1]).hide();

            _designerTable.View.isViewChanged = true;
        },

        _configureCell: function (section, tr, td, width, height)
        {
            if ($chk(td) === true)
            {
                tr = jQuery(tr);
                td = jQuery(td);
                td.off();

                var notDummyData = !tr.hasClass("dummy-row");

                if (notDummyData)
                {
                    var designer = SourceCode.Forms.Designers.View;
                    SourceCode.Forms.Controls.Web.TableBehavior.prototype.ConfigureCell(section, tr, td, width, height, designer);
                }
                else
                {
                    td.addClass('editor-cell');
                    td.addClass('droptarget');
                    if (td.html() === '') td.html('&nbsp;');
                }

                return td;
            }
        },

        _addCellProperties: function (cell)
        {
            var id = cell[0].id;

            var cellControlObjectModel = {
                id: id,
                controlType: "Cell"
            };

            cellControlObjectModel = this._addControlToDefinition(cellControlObjectModel);

            cell.attr('friendlyname', cellControlObjectModel.friendlyName);
        },


        _addControlToDefinition: function (controlObjectModel)
        {
            var id = controlObjectModel.id;
            var controlType = controlObjectModel.controlType;

            var propertiesXML = _designerTable.View.viewDefinitionXML.createElement("Properties");

            var initialControlElem = SourceCode.Forms.Designers.Common.controlDefinitionsXml.selectSingleNode('Controls/Control[Name = "' + controlType + '"]');

            if ($chk(initialControlElem)) {
                var defaultProperties = initialControlElem.selectSingleNode("DefaultProperties");
            }

            var controlName = _designerTable._BuildControlName(id, controlType, controlType);
            var namePropertyElem = _designerTable.ViewDesigner._BuildPropertyElem(id, "ControlName", controlName, controlName);

            controlObjectModel.friendlyName = controlName;

            propertiesXML.appendChild(namePropertyElem);

            _designerTable.ViewDesigner._setControlPropertiesXML(id, propertiesXML, null, controlType);

            return controlObjectModel;
        },

        //public accessible method - used by designers common
        AddControlToDefinition: function (controlObjectModel) {
            return _designerTable._addControlToDefinition(controlObjectModel);
        },


        _getDummyData: function (dataTypeCaps, friendlyName)
        {
            var dataType = "";

            if (checkExists(dataTypeCaps))
            {
                dataType = dataTypeCaps.toLowerCase();
            }

            var dummyData = friendlyName;
            switch (dataType)
            {
                case "autoguid":
                    dummyData = "{00000000-0000-0000-0000-000000000000}";
                    break;

                case "autonumber":
                    dummyData = "1";
                    break;

                case "datetime":
                case "date":
                    var currentTime = new Date();
                    var month = currentTime.getMonth() + 1;
                    var day = currentTime.getDate();
                    var year = currentTime.getFullYear();
                    var value = month + "/" + day + "/" + year;

                    dummyData = value;
                    break;

                case "decimal":
                    dummyData = "0.0";
                    break;

                case "file":
                    dummyData = "File";
                    break;

                case "guid":
                    dummyData = "{00000000-0000-0000-0000-000000000000}";
                    break;

                case "hyperlink":
                    dummyData = "http://www.k2.com";
                    break;

                case "image":
                    dummyData = "Image";
                    break;

                case "memo":
                    dummyData = "Lorem ipsum dolor sit ...";
                    break;

                case "multivalue":
                    dummyData = "{0} 1, {1} 2, {2} 3".format(friendlyName, friendlyName, friendlyName);
                    break;

                case "number":
                    dummyData = 0;
                    break;

                case "time":
                    //HH:mm:ss format
                    var currentTime = new SourceCode.Forms.Time();
                    currentTime.milliseconds(0);
                    dummyData = currentTime.toString();
                    break;

                case "yesno":
                    dummyData = "Yes";
                    break;

                case "text":
                default:
                    dummyData = friendlyName;
                    break;
            }
            return dummyData;
        },

        // this function ensures that the editable row section is properly populated with controls
        // column sizes are correct
        _ensureEditRow: function ()
        {
            //Force a re-populate/re-render as the table may exist, but not be populated 
            //when swapping between editable and non-editable list view settings
            //TFS 505390 (fix impacted by 503825)
            $("table.capturelist-editor-table").remove();

            var table = jQuery("#bodySection").find(".editor-table");

            // get header columns
            var headerColumns = table.first("tr").find(".header.editor-cell");

            _designerTable._generateEditableTable(headerColumns.length, true);

            var properties = jQuery('#PropParent').children('.toolboxitem');

            var skipColumns = [];
            for (var i = 0; i < headerColumns.length; i++)
            {
                var innerControl = jQuery(headerColumns[i]).children(".propertyControl");

                if ($chk(innerControl) && innerControl.length > 0)
                {
                    var thisProperty = properties.filter("*[propertyid=" + innerControl.attr("propertyid") + "]");

                    if (thisProperty.length > 0)
                    {
                        var section = _designerTable.ViewDesigner._getSection(jQuery(headerColumns[i]));

                        var data = {
                            itemtype: thisProperty.attr('itemtype'),
                            custom: thisProperty.attr('custom'),
                            references: thisProperty.attr('references'),
                            propertytype: thisProperty.attr('propertytype'),
                            propertyid: thisProperty.attr('propertyid'),
                            friendlyname: thisProperty.attr('friendlyname'),
                            soid: thisProperty.attr('soid').toLowerCase(),
                            section: section.attr('id'),
                            dragtype: 'external'
                        };

                        var controlType;
                        var hasReferences = false;
                        if (data.references === '')
                        {
                            controlType = _designerTable.DragDrop._GetDataTypeDefaultControl(data.propertytype, false);
                        } else
                        {
                            controlType = _designerTable.DragDrop._GetDataTypeDefaultControl('association', false);
                            hasReferences = true;
                        }

                        _designerTable.DragDrop._CaptureListDropEditProperty(controlType, i, data, innerControl.attr("id"), hasReferences);

                        skipColumns.push(i);
                    }
                }
            }

            var skipColumnsLength = skipColumns.length;
            if (skipColumnsLength !== headerColumns.length)
            {
                // grab first row in list view
                var rows = table.find(">tbody>tr");
                if (rows.length > 1)
                {
                    cells = jQuery(rows[1]).children();
                    var len = cells.length;
                    var i = 0;
                    for (i < 0; i < len; i++)
                    {
                        if (skipColumns.indexOf(i) > -1)
                        {
                            continue;
                        }

                        var control = jQuery(cells[i]).find("div.controlwrapper:first-child");
                        if (control.length > 0)
                        {
                            var data = {
                                name: control.attr("controltype"),
                                itemtype: control.attr('itemtype'),
                                custom: control.attr('custom'),
                                references: control.attr('references'),
                                propertytype: control.attr('propertytype'),
                                propertyid: control.attr('propertyid'),
                                friendlyname: control.attr('friendlyname'),
                                soid: "",
                                section: "#bodySection",
                                dragtype: 'external'
                            };

                            _designerTable.DragDrop._CaptureListDropEditProperty(control.attr("controltype"), i, data, control.attr("id"), false);
                        }
                    }
                }
            }
            _designerTable._synchronizeEditableColumns();
        }
    };
})(jQuery);
