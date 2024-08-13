(function ($)
{
    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};

    SourceCode.Forms.CanvasToolbar = {

        _boundToElements: false,
        _currentDesigner: null,
        _controlObjectModelSelected: null,
        _buttonList: [],

        init: function ()
        {
            this.designerChangedDelegate = this._designerChanged.bind(this);
            this.controlSelectedDelegate = this._controlSelected.bind(this);
            this.updateToolbarDelegate = this._updateToolbar.bind(this);

            SourceCode.Forms.Designers.Common.registerForEvent("DesignerChanged", this.designerChangedDelegate);
            SourceCode.Forms.Designers.Common.registerForEvent("ControlSelected", this.controlSelectedDelegate);

            SourceCode.Forms.Designers.Common.registerForEvent("PropertyTabChanged", this.updateToolbarDelegate);
            SourceCode.Forms.Designers.Common.registerForEvent("CanvasDisplayed", this.updateToolbarDelegate);
            SourceCode.Forms.Designers.Common.registerForEvent("CanvasCleared", this.updateToolbarDelegate);
            SourceCode.Forms.Designers.Common.registerForEvent("LayoutChanged", this.updateToolbarDelegate);
            SourceCode.Forms.Designers.Common.registerForEvent("RowsAdded", this.updateToolbarDelegate);
            SourceCode.Forms.Designers.Common.registerForEvent("ColumnsAdded", this.updateToolbarDelegate);
            SourceCode.Forms.Designers.Common.registerForEvent("CellMerged", this.updateToolbarDelegate);
        },

        _designerChanged: function (event)
        {
            this._boundToElements = false;
            this._buttonList = [];
            this._currentDesigner = SourceCode.Forms.Designers.Common.getDesigner();
            this._controlObjectModelSelected = null;
        },

        //update the toolbar based on the currentSelectedCOntrol.
        //this will fire when something has happened to the selectedControl but the selected control hasn't changed.
        _updateToolbar: function ()
        {
            if (checkExists(this._controlObjectModelSelected))
            {
                this._setupToolbar();
            }
        },

        _controlSelected: function (event, controlObjectModel)
        {
            this._ensureBoundToElements();
            this._ensureButtonList();
            this._controlObjectModelSelected = controlObjectModel;
            this._setupToolbar();
        },

        _ensureBoundToElements: function ()
        {
            if (this._boundToElements === false) this._bindToElements();
        },

        _bindToElements: function ()
        {
            if (SourceCode.Forms.Designers.Common.isViewDesigner())
            {
                this._bindToViewDesignerElements();
            }
            else if (SourceCode.Forms.Designers.Common.isFormDesigner())
            {
                this._bindToFormDesignerElements();
            }
        },

        _bindToViewDesignerElements: function ()
        {
            var container = SourceCode.Forms.Designers.View.ViewDesigner.View.element;

            this.toolExpressions = container.find("#toolExpressions");
            this.toolInsertRowAbove = container.find("#toolInsertRowAbove");
            this.toolInsertRowBelow = container.find("#toolInsertRowBelow");
            this.toolInsertColLeft = container.find("#toolInsertColLeft");
            this.toolInsertColRight = container.find("#toolInsertColRight");
            this.toolMergeCellRight = container.find("#toolMergeCellRight");
            this.toolMergeCellBelow = container.find("#toolMergeCellBelow");
            this.toolClearCell = container.find("#toolClearCell");
            this.toolClearRow = container.find("#toolClearRow");
            this.toolClearTable = $(); //not in view designer
            this.toolRemoveCol = container.find("#toolRemoveCol");
            this.toolRemoveRow = container.find("#toolRemoveRow");
            this.toolCellLeftAlign = container.find('#toolCellLeftAlign');
            this.toolCellCenterAlign = container.find('#toolCellCenterAlign');
            this.toolCellRightAlign = container.find('#toolCellRightAlign');
            this.toolCellTopAlign = container.find('#toolCellTopAlign');
            this.toolCellMiddleAlign = container.find('#toolCellMiddleAlign');
            this.toolCellBottomAlign = container.find('#toolCellBottomAlign');
            this.toolEditCellProp = container.find("#toolEditCellProp");
            this.toolEditTableProp = container.find("#toolEditTableProp");

            this.TableToolDivider1 = container.find('#TableToolDivider1');
            this.TableToolDivider2 = container.find('#TableToolDivider2');
            this.TableToolDivider3 = container.find('#TableToolDivider3');
            this.TableToolDivider4 = container.find('#TableToolDivider4');
            this.TableToolDivider5 = container.find('#TableToolDivider5');

            this.ControlToolDivider1 = container.find('#ControlToolDivider1');
            this.ControlToolDivider2 = container.find('#ControlToolDivider2');
            this.ControlToolDivider3 = container.find('#ControlToolDivider3');
            this.ControlToolDivider4 = container.find('#ControlToolDivider4');

            this.toolItalic = container.find('#toolItalic');
            this.toolUnderline = container.find('#toolUnderline');
            this.toolBold = container.find('#toolBold');
            this.toolTextColor = container.find('#toolTextColor');
            this.toolHightlightColor = container.find('#toolHightlightColor');
            this.toolLeftAlign = container.find('#toolLeftAlign');
            this.toolCenterAlign = container.find('#toolCenterAlign');
            this.toolRightAlign = container.find('#toolRightAlign');
            this.toolJustify = container.find('#toolJustify');
            this.toolInsertImage = container.find('#toolInsertImage');

            this.toolControlCalculation = container.find('#toolControlCalculation');
            //this.toolProperties = container.find('#toolProperties');
            this.toolEditStyle = container.find('#toolEditStyle');
            this.toolChangeControl = container.find('#toolChangeControl');
            this.toolFitToCell = container.find('#toolFitToCell');

            //this.toolControlPropertiesEdit = container.find('#toolControlPropertiesEdit');
            this.toolControlStylesEdit = container.find('#toolControlStylesEdit');

            this.toolUnbindControl = container.find('#toolUnbindControl');
            this.toolBindControl = container.find('#toolBindControl');

            this.toolSettings = container.find("#toolViewSettings");

            this.toolDefaultCanvas = container.find("#toolDefaultCanvas");

            this.toolAutoGenerate = container.find('#toolAutoGenerate');

            this.columnPropertiesTab = container.find('#vdColumnTabPropertiesTab');
            this.bodyPropertiesTab = container.find('#vdBodyTabPropertiesTab');

            this.toolAddTab = $(); //not in view designer
            this.toolRenameTab = $(); //not in view designer
            this.toolRemoveTab = $(); //not in view designer
            this.toolMoveTabLeft = $(); //not in view designer
            this.toolMoveTabRight = $(); //not in view designer
            this.toolRowLayout = $(); //not in view designer
            this.toolColLayout = $(); //not in view designer

            this.toolInsertView = $(); //not in view designer
            this.toolEditView = $(); //not in view designer
            this.toolRemoveControl = $(); //not in view designer
        },

        _bindToFormDesignerElements: function ()
        {
            var container = SourceCode.Forms.Designers.Form.element;

            this.toolExpressions = container.find("#pgExpressions");
            this.toolInsertRowAbove = container.find("#pgInsertRowAbove");
            this.toolInsertRowBelow = container.find("#pgInsertRowBelow");
            this.toolInsertColLeft = container.find("#pgInsertColumnLeft");
            this.toolInsertColRight = container.find("#pgInsertColumnRight");
            this.toolMergeCellRight = container.find("#pgMergeCellRight");
            this.toolMergeCellBelow = container.find("#pgMergeCellBelow");
            this.toolClearCell = container.find("#pgClearCell");
            this.toolClearRow = container.find("#pgClearRow");
            this.toolClearTable = container.find("#pgClearTable");
            this.toolRemoveCol = container.find("#pgRemoveColumn");
            this.toolRemoveRow = container.find("#pgRemoveRow");
            this.toolCellLeftAlign = container.find('#pgAlignLeft');
            this.toolCellCenterAlign = container.find('#pgAlignCenter');
            this.toolCellRightAlign = container.find('#pgAlignRight');
            this.toolCellTopAlign = container.find('#pgAlignTop');
            this.toolCellMiddleAlign = container.find('#pgAlignMiddle');
            this.toolCellBottomAlign = container.find('#pgAlignBottom');

            this.toolEditCellProp = $(); //not in form designer
            this.toolEditTableProp = $(); //not in form designer

            this.TableToolDivider1 = $(); //not in form designer
            this.TableToolDivider2 = $(); //not in form designer
            this.TableToolDivider3 = $(); //not in form designer
            this.TableToolDivider4 = $(); //not in form designer
            this.TableToolDivider5 = $(); //not in form designer

            this.ControlToolDivider1 = $(); //not in form designer
            this.ControlToolDivider2 = $(); //not in form designer
            this.ControlToolDivider3 = $(); //not in form designer
            this.ControlToolDivider4 = $(); //not in form designer

            this.toolItalic = $(); //not in form designer
            this.toolUnderline = $(); //not in form designer
            this.toolBold = $(); //not in form designer
            this.toolTextColor = $(); //not in form designer
            this.toolHightlightColor = $(); //not in form designer
            this.toolLeftAlign = $(); //not in form designer
            this.toolCenterAlign = $(); //not in form designer
            this.toolRightAlign = $(); //not in form designer
            this.toolJustify = $(); //not in form designer
            this.toolInsertImage = $(); //not in form designer

            //Choose Excpression for selected control
            this.toolControlCalculation = $(); //not in form designer

            //Open format dialog for selected control
            this.toolEditStyle = $(); //not in form designer
            this.toolChangeControl = $(); //not in form designer

            //Set tp 100% width
            this.toolFitToCell = $(); //not in form designer

            this.toolControlStylesEdit = $(); //not in form designer or view designer!

            //removed the field binding for a databound control in view designer
            this.toolUnbindControl = $(); //not in form designer.
            this.toolBindControl = $(); //not in form designer or view designer!

            //View configuration - only in view designer
            this.toolSettings = $(); //not in form designer.

            //clear the entire view
            this.toolDefaultCanvas = $(); //not in form designer.

            //Launch view generate wizard
            this.toolAutoGenerate = $(); //not in form designer.


            //The "column" tab in the properties panel for a list view.
            this.columnPropertiesTab = $(); //not in form designer.

            //The "body" tab in the properties panel for list view.
            this.bodyPropertiesTab = $(); //not in form designer.

            this.toolAddTab = container.find('#pgAddTab');
            this.toolRenameTab = container.find('#pgRenameTab');
            this.toolRemoveTab = container.find('#pgRemoveTab');
            this.toolMoveTabLeft = container.find('#pgMoveLeft');
            this.toolMoveTabRight = container.find('#pgMoveRight');
            this.toolRowLayout = container.find('#pgRowLayout');
            this.toolColLayout = container.find('#pgColLayout');

            this.toolInsertView = container.find("#pgAddView");
            this.toolEditView = container.find("#pgEditView");
            this.toolRemoveControl = container.find("#pgRemoveControl");

        },

        _ensureButtonList: function ()
        {
            if (this._buttonList.length < 1) this._createButtonList();
        },

        _createButtonList: function ()
        {
            //clear the array
            this._buttonList = [];
            this._buttonList.push(this.toolInsertRowAbove);
            this._buttonList.push(this.toolInsertRowBelow);
            this._buttonList.push(this.toolInsertColLeft);
            this._buttonList.push(this.toolInsertColRight);
            this._buttonList.push(this.toolMergeCellRight);
            this._buttonList.push(this.toolMergeCellBelow);
            this._buttonList.push(this.toolClearCell);
            this._buttonList.push(this.toolClearRow);
            this._buttonList.push(this.toolRemoveCol);
            this._buttonList.push(this.toolRemoveRow);
            this._buttonList.push(this.toolCellLeftAlign);
            this._buttonList.push(this.toolCellCenterAlign);
            this._buttonList.push(this.toolCellRightAlign);
            this._buttonList.push(this.toolCellTopAlign);
            this._buttonList.push(this.toolCellMiddleAlign);
            this._buttonList.push(this.toolCellBottomAlign);
            this._buttonList.push(this.toolEditCellProp);
            this._buttonList.push(this.toolEditTableProp);
            this._buttonList.push(this.toolBindControl);
            this._buttonList.push(this.toolUnbindControl);
            this._buttonList.push(this.toolItalic);
            this._buttonList.push(this.toolUnderline);
            this._buttonList.push(this.toolBold);
            this._buttonList.push(this.toolTextColor);
            this._buttonList.push(this.toolHightlightColor);
            this._buttonList.push(this.toolLeftAlign);
            this._buttonList.push(this.toolCenterAlign);
            this._buttonList.push(this.toolRightAlign);
            this._buttonList.push(this.toolJustify);
            this._buttonList.push(this.toolInsertImage);
            this._buttonList.push(this.toolControlCalculation);
            this._buttonList.push(this.toolEditStyle);
            this._buttonList.push(this.toolChangeControl);
            this._buttonList.push(this.toolFitToCell);
            this._buttonList.push(this.toolControlStylesEdit);

            this._buttonList.push(this.TableToolDivider1);
            this._buttonList.push(this.TableToolDivider2);
            this._buttonList.push(this.TableToolDivider3);
            this._buttonList.push(this.TableToolDivider4);
            this._buttonList.push(this.TableToolDivider5);

            this._buttonList.push(this.ControlToolDivider1);
            this._buttonList.push(this.ControlToolDivider2);
            this._buttonList.push(this.ControlToolDivider3);
            this._buttonList.push(this.ControlToolDivider4);


            this._buttonList.push(this.toolAddTab);
            this._buttonList.push(this.toolRenameTab);
            this._buttonList.push(this.toolRemoveTab);
            this._buttonList.push(this.toolMoveTabLeft);
            this._buttonList.push(this.toolMoveTabRight);
            this._buttonList.push(this.toolRowLayout);
            this._buttonList.push(this.toolColLayout);

            this._buttonList.push(this.toolInsertView);
            this._buttonList.push(this.toolEditView);
            this._buttonList.push(this.toolRemoveControl);
        },

        _hideAll: function ()
        {
            this._buttonList.forEach(function (control)
            {
                control.hide();
            });
        },

        _enableAll: function ()
        {
            this._buttonList.forEach(function (control)
            {
                control.removeClass("disabled");
            });
        },

        _enableDisableCellMergeOrInsertButtons: function (jqCell)
        {
            var jqTable = SourceCode.Forms.Designers.Common.getEditorTableFromSelectedObject(jqCell);
            var tableArray = SourceCode.Forms.TableHelper.getTableArray(jqTable);
            var cellInfo = SourceCode.Forms.TableHelper.getCellInfo(jqCell);
            var numColumns = SourceCode.Forms.TableHelper.getColumnCountInTableArray(jqTable);
            var numRows = SourceCode.Forms.TableHelper.getRowCountInTableArray(jqTable);

            this.toolMergeCellRight.toggleClass("disabled", !SourceCode.Forms.Designers.canMerge(tableArray, jqCell, "right"));
            this.toolMergeCellBelow.toggleClass("disabled", !SourceCode.Forms.Designers.canMerge(tableArray, jqCell, "down"));

            this.toolRemoveCol.toggleClass("disabled", cellInfo.colSpan >= numColumns || numColumns <= 1);
            this.toolRemoveRow.toggleClass("disabled", cellInfo.rowSpan >= numRows || numRows <= 1);
        },

        _showButtonsForToolbarCell: function (jqCell)
        {
            //#region Show toolbar buttons that are available for toolbar cell (in same order as it displays from left to right)
            this.TableToolDivider2.show();

            this.toolClearCell.show();
            this.toolClearRow.show();

            this.TableToolDivider4.show();

            this.toolCellLeftAlign.show();
            this.toolCellCenterAlign.show();
            this.toolCellRightAlign.show();

            this.toolCellTopAlign.show();
            this.toolCellMiddleAlign.show();
            this.toolCellBottomAlign.show();
            //#endregion

            this.toolMergeCellRight.addClass("disabled");
            this.toolMergeCellBelow.addClass("disabled");

            this.toolRemoveCol.addClass("disabled");
            this.toolRemoveRow.addClass("disabled");
        },

        _showButtonsForTableCell: function (jqCell)
        {
            //#region Show toolbar buttons that are available for table cell (in same order as it displays from left to right)
            this.TableToolDivider5.show();

            this.toolInsertRowAbove.show();
            this.toolInsertRowBelow.show();
            this.toolInsertColLeft.show();
            this.toolInsertColRight.show();

            this.TableToolDivider1.show();

            this.toolMergeCellRight.show();
            this.toolMergeCellBelow.show();

            this.TableToolDivider2.show();

            this.toolClearCell.show();
            this.toolClearRow.show();

            this.TableToolDivider3.show();

            this.toolRemoveCol.show();
            this.toolRemoveRow.show();

            this.TableToolDivider4.show();

            this.toolCellLeftAlign.show();
            this.toolCellCenterAlign.show();
            this.toolCellRightAlign.show();

            this.toolCellTopAlign.show();
            this.toolCellMiddleAlign.show();
            this.toolCellBottomAlign.show();
            //#endregion

            //Enable or disable toolbar buttons
            this._enableDisableCellMergeOrInsertButtons(jqCell);
        },

        _showButtonsForListTableColumn: function (jqCell)
        {
            if (this.columnPropertiesTab.hasClass("selected"))
            {
                this.toolInsertColLeft.show();
                this.toolInsertColRight.show();

                this.toolClearCell.show();

                this.toolRemoveCol.show();
                this.toolCellLeftAlign.show();
                this.toolCellCenterAlign.show();
                this.toolCellRightAlign.show();

                if (checkExists(jqCell))
                {
                    var jqTable = SourceCode.Forms.Designers.Common.getEditorTableFromSelectedObject(jqCell);
                    var tableArray = SourceCode.Forms.TableHelper.getTableArray(jqTable);
                    var cellInfo = SourceCode.Forms.TableHelper.getCellInfo(jqCell);
                    var numColumns = SourceCode.Forms.TableHelper.getColumnCountInTableArray(jqTable);
                    var numRows = SourceCode.Forms.TableHelper.getRowCountInTableArray(jqTable);

                    this.toolRemoveCol.toggleClass("disabled", cellInfo.colSpan >= numColumns || numColumns <= 1);
                }

                this.TableToolDivider1.show();
                this.TableToolDivider2.show();
                this.TableToolDivider3.show();
                this.TableToolDivider4.show();
                this.TableToolDivider5.show();

                this.ControlToolDivider4.show();
            }
            else
            {
                var control = jqCell.find(">[layouttype='control']").eq(0);
                this._showButtonsForControl(control);

                //This is when Header property tab is selected
                if (!this.bodyPropertiesTab.hasClass('selected'))
                {
                    this.toolChangeControl.hide();
                }
            }
        },

        _showButtonsForControl: function (object)
        {
            var _viewDesigner = SourceCode.Forms.Designers.View.ViewDesigner;

            this.toolFitToCell.show();
            this.toolChangeControl.show();

            if (_viewDesigner._controlSupportsControlExpressions())
            {
                this.toolExpressions.hide();
                this.toolControlCalculation.show();
            }
            this.toolControlStylesEdit.show();
            this.toolEditStyle.show();

            this.ControlToolDivider3.show();
            this.ControlToolDivider4.show();

            if (checkExists(object.attr('propertyid')) && object.attr('propertyid') !== "")
            {
                this.toolUnbindControl.show();
            }
        },

        _setupToolbar: function ()
        {
            var om = this._controlObjectModelSelected;
            if (SourceCode.Forms.Designers.Common.isViewDesigner())
            {
                this._setupToolbar_ViewDesigner(om);
            }
            else if (SourceCode.Forms.Designers.Common.isFormDesigner())
            {
                this._setupToolbar_FormDesigner(om);
            }
        },

        //Copy of Viewdesigner._setUpToolbar() logic.
        _setupToolbar_ViewDesigner: function (selectedControlObjectModel)
        {
            var _viewDesigner = SourceCode.Forms.Designers.View.ViewDesigner;
            var object = selectedControlObjectModel.element;

            //table cell toolbar items
            var section = _viewDesigner._getSection(object);
            var viewType = _viewDesigner._getViewType();

            if (_viewDesigner.View.SelectedViewType === SourceCode.Forms.Designers.ViewType.ListView)
            {
                this.toolSettings.show();
            }
            else
            {
                this.toolSettings.hide();
            }


            if (_viewDesigner.View.layoutExists())
            {
                this.toolDefaultCanvas.show();
                // Always show unless controls are selected
                this.toolExpressions.show();
            }
            else
            {
                this.toolDefaultCanvas.hide();
                this.toolExpressions.hide();
            }


            if (checkExistsNotEmpty(_viewDesigner.View.SelectedSmartObjectGuid))
            {
                this.toolAutoGenerate.show();
            }
            else
            {
                this.toolAutoGenerate.hide();
            }

            //hide Everything
            //enable everything
            this._hideAll();
            this._enableAll();

            if (checkExists(object) && object.length > 0 && checkExists(section) && section.length > 0)
            {
                switch (section.attr('id'))
                {
                    case 'headerSection':
                    case 'bottomToolbarSection':
                    case 'footerSection':
                        break;
                    case 'editableSection':
                        if (object.is('td') && viewType === "CaptureList")
                        {
                            this.toolCellTopAlign.show();
                            this.toolCellMiddleAlign.show();
                            this.toolCellBottomAlign.show();

                            this.toolCellLeftAlign.show();
                            this.toolCellCenterAlign.show();
                            this.toolCellRightAlign.show();
                        }
                        break;
                }

                if (SourceCode.Forms.TableHelper.isEditableCell(object))
                {
                    var table = SourceCode.Forms.TableHelper.getTableFromCell(object);
                    var wrapper = SourceCode.Forms.Designers.Common.getEditorTableWrapper(table);
                    var layout = wrapper.attr("layout");

                    switch (layout)
                    {
                        case "ToolbarTable":
                            this._showButtonsForToolbarCell(object);
                            break;
                        case "ListTable":
                            this._showButtonsForListTableColumn(object);
                            break;
                        case "Table":
                            this._showButtonsForTableCell(object);
                            break;
                    }
                }
                else if (object.is('div'))  //A control is selected
                {
                    switch (object.attr('itemtype'))
                    {
                        case 'method':
                            this.toolFitToCell.show();
                            this.toolChangeControl.show();
                            //toolProperties.show();
                            this.toolEditStyle.show();

                            //toolControlPropertiesEdit.show();
                            this.toolControlStylesEdit.show();

                            this.ControlToolDivider3.show();
                            this.ControlToolDivider4.show();
                            break;
                        case 'layoutcontainer':
                            this.toolFitToCell.show();
                            break;
                        default:
                            this._showButtonsForControl(object);
                    }
                }
            }
        },

        _setupToolbar_FormDesigner: function (selectedControlObjectModel)
        {
            var designer = SourceCode.Forms.Designers.Form;
            var _layout = designer.steps[designer.LAYOUT_STEP_INDEX];

            //#region from form.layout.setLayoutState()

            this.toolEditView.toggleClass('disabled', !_layout.selectedCanvas);
            this.toolRemoveControl.toggleClass('disabled', !_layout.selectedCanvas);

            var _tabControl = _layout.tabControl;
            var _activeTab = _tabControl.activeTab;
            var _tabCount = _tabControl.tabCount;
            var _isNormalLayout = (_formDesigner.formNode.getAttribute("Layout") === "Normal") ? true : false;

            this.toolAddTab.toggleClass('disabled', _tabCount === _tabControl.tabCountLimit);
            this.toolRenameTab.toggleClass('disabled', !_activeTab || _isNormalLayout);
            this.toolRemoveTab.toggleClass('disabled', !_activeTab || _isNormalLayout);
            this.toolMoveTabLeft.toggleClass('disabled', _isNormalLayout || !_activeTab || !_tabControl.canMoveTabLeft(_activeTab));
            this.toolMoveTabRight.toggleClass('disabled', _isNormalLayout || !_activeTab || !_tabControl.canMoveTabRight(_activeTab));
            this.toolRowLayout.toggleClass('disabled', !_activeTab || _activeTab.panel.isRowLayout);
            this.toolColLayout.toggleClass('disabled', !_activeTab || !_activeTab.panel.isRowLayout);

            //#endregion

            //#region from form.layout.toggleTableActions()

            var _isCell = selectedControlObjectModel.controlType === 'cell';
            var _isTable = selectedControlObjectModel.controlType === 'table';

            this.toolClearTable.toggleClass("disabled", !_isCell);
            this.toolClearRow.toggleClass("disabled", !_isCell);
            this.toolClearCell.toggleClass("disabled", !_isCell);
            this.toolInsertColLeft.toggleClass("disabled", !_isCell);
            this.toolInsertColRight.toggleClass("disabled", !_isCell);
            this.toolInsertRowAbove.toggleClass("disabled", !_isCell);
            this.toolInsertRowBelow.toggleClass("disabled", !_isCell);
            this.toolMergeCellRight.toggleClass("disabled", !_isCell);
            this.toolMergeCellBelow.toggleClass("disabled", !_isCell);
            this.toolRemoveCol.toggleClass("disabled", !_isCell);
            this.toolRemoveRow.toggleClass("disabled", !_isCell);
            this.toolCellBottomAlign.toggleClass("disabled", !_isCell);
            this.toolCellTopAlign.toggleClass("disabled", !_isCell);
            this.toolCellMiddleAlign.toggleClass("disabled", !_isCell);
            this.toolCellLeftAlign.toggleClass("disabled", !_isCell);
            this.toolCellRightAlign.toggleClass("disabled", !_isCell);
            this.toolCellCenterAlign.toggleClass("disabled", !_isCell);

            if (_isCell)
            {
                //This logic can also be found in view.viewdesigner.js
                var jqCell = selectedControlObjectModel.element;

                this._enableDisableCellMergeOrInsertButtons(jqCell);
            }

            //#endregion

            //#region from form.layout.toggleViewActions()

            if (checkExists(selectedControlObjectModel.element))
            {
                var isUnAuthorized = selectedControlObjectModel.element.hasClass("unAuthorized");
                var isAuthorized = !isUnAuthorized;
                var isViewInstance = selectedControlObjectModel.element.is(".view-canvas");
                var isFormControl = selectedControlObjectModel.element.is(".form-control");
                var isCanvasPanel = selectedControlObjectModel.element.is(".panel-canvas");

                this.toolEditView.toggleClass("disabled", isUnAuthorized || !isViewInstance);
                this.toolRemoveControl.toggleClass("disabled", isUnAuthorized || !(isViewInstance || isFormControl || isCanvasPanel));
            }

            //endregion
        }
    };

    //when all scripts have loaded (including common), subscribe to events.
    $(function ()
    {
        SourceCode.Forms.CanvasToolbar.init();
    });
   

})(jQuery);
