var TableColumnResizer = function (options)
{
    this.initialize(options);
};

var _TableColumnResizerPrototype =
{
    options: 
    {
        containerObj: null,
        tableObj: null,
        signature: null,
        designerTable: null
    },

    initialize: function (options)
    {
        this.options = $.extend({}, this.options, options);

        this.options.signature = String.generateGuid();

        this.jqContainer = $(this.options.containerObj);
        this.jqScrollWrapper = $(this.options.scrollWrapperObj);

        this.jqTableToResize = $(this.options.tableObj);

        this.DesignerTable = this.options.designerTable;

        //The selectedControlModel contain the information of the selected controls and contains the follow fields:
        //
        //    id: id of the selected element,
        //    controlType: controlType,
        //    layoutType: layout type of the selected element,
        //    element: jqElement,
        //    visualElement: visualElement,
        //    resizeWrapper: resizeWrapper
        //
        this.selectedControlModel = null;

        //This is a the container of the column widget, if the column widths add up to less than the width of the table, part of this will be seen.
        // this is the element that has the drop-shadow that is seen around the column widget.
        this.jqWidgetTableContainer = null;

        //this is the grid or table within the widget representing the columns and draggable areas
        this.jqWidgetTable = null;

        //there will always be a hidden <table> inside the widget, with old-style <cols>, becuase the form/view designer need an element (the <col>) when selecting an item.
        //when view/form designer use an object model rather than relying on the DOM, this can be removed.
        this.jqDummyTable = null;

        //this is the 0px*0px element that is positioned at the top left of the target table control. This widget
        // is contained within the anchor using absolute positioning so the widget bleeds outside of the anchor's 0*0 box.
        this.anchor = null;

        this.colSelectorInputWidth = 50;
        this.colSelectorHeight = 24;
        this.colSelectorMinDisplayWidth = 60;
        this.colSelectorMinResizeWidth = 40;

        this.gapBetweenTable = 15;

        this.overlayPaddingTop = 1;
        this.overlayPaddingLeft = 1;
        this.overlayPaddingBottom = 1;
        this.overlayPaddingRight = 1;

        //The column resize widget can be rendered as CSS Grid or normal <Table> element.
        //If the assoicated Control is rendered as Table, the resize widget will be rendered as <Table> element
        //If the associated Control is rendered as Grid, the resize widget will be rendered as <div> as elment with display:grid;
        //NOTE that when the widget is rendered as Grid, a table is also rendered for the widget so it has <col> elements to represent Column control.
        //By clicking on the column selector, the Column control is representated as the <col> element in the widget.  This is needed because CSS Grid doesn't have <col> elements to represent the Column controls.
        this.isRenderedAsTable = false;

        this.jqWidgetWrapper = null;       //Resize widget's wrapper - - Keep local to improve performance
        this.jqWidgetTable = null;         //Resize widget's table / grid - - Keep local to improve performance
        this.jqWidgetTableColumns = null;  //Resize widget's columns (<col>s) - Keep local to improve performance
        this.jqWidgetTableCells = null;    //Resize widget's cells (<td>s) - Keep local to improve performance
        this.jqTableColumns = null;        //Columns of the table control to resize - Keep local to improve performance

        this.tableArray = null; //Keep a map of the table structure, useful when there are merged cells or columns
        this.selectedColumnIndex = 0;

        //Flag to indicate if user is resizing the column using the left edge grip.
        //If resizing using lef edge grip then the master column is to the left of the selected column.
        this.isLeftEdgeResizing = false;

        // Caches the offset positions and outer width of the rendered table columns, this data is used to calculate the new positions of the table from the dragging distance.
        this.renderedPositions = [];

        //Drag info is useful when dragging the column grips to resize the table columns
        this.dragInfo =
        {
            id: "",
            difference: 0,
            startingLeftPosition: 0
        };

        // Contain max left (negitive value) and max right (positive value) the resize grip and move
        this.dragContainmentData = {};

        // Model that stores the info about the table control
        this.model =
        {
            top: 0, //Top position of the resize widget
            left: 0, //Left position of the resize widget
            width: 0, //Width in pixels of the resize widget
            columns:
            [
                {
                    id: "", //Guid of the column
                    width: "0", //Render width for the column, in px, % or "" empty for auto
                    configuredWidth: "0" //Configured width for the column, in px, % or "" empty for auto
                }
            ]
        }; 

        //Flag to keep track if a dragging event has started, this is useful to hide the resize widget until the drag has completed. 
        this.dragging = false; 

        this.controlSelectedDelegate = this.controlSelected.bind(this);
        this.controlMovedDelegate = this.controlMoved.bind(this);
        this.controlSizeChangedDelegate = this.controlSizeChanged.bind(this);
        this.layoutChangedDelegate = this.layoutChanged.bind(this);
        this.scrollStartDelegate = this.scrollStart.bind(this);
        this.scrollEndDelegate = this.scrollEnd.bind(this);

        this.dragStartDelegate = this.dragStart.bind(this);
        this.dragStoppedDelegate = this.dragStopped.bind(this);

        this.tableLayoutChangedDelegate = this.tableLayoutChanged.bind(this);

        SourceCode.Forms.Designers.Common.registerForEvent("ControlSelected", this.controlSelectedDelegate);
        SourceCode.Forms.Designers.Common.registerForEvent("ControlMoved", this.controlMovedDelegate);
        SourceCode.Forms.Designers.Common.registerForEvent("ControlSizeChanged", this.controlSizeChangedDelegate);
        SourceCode.Forms.Designers.Common.registerForEvent("LayoutChanged", this.layoutChangedDelegate);
        SourceCode.Forms.Designers.Common.registerForEvent("ScrollStarted", this.scrollStartDelegate);
        SourceCode.Forms.Designers.Common.registerForEvent("ScrollEnded", this.scrollEndDelegate);

        SourceCode.Forms.Designers.Common.registerForEvent("ControlDragStarted", this.dragStartDelegate);
        SourceCode.Forms.Designers.Common.registerForEvent("ControlDragStopped", this.dragStoppedDelegate);

        SourceCode.Forms.Designers.Common.registerForEvent("TableColumnSizeChanged", this.tableLayoutChangedDelegate);
        SourceCode.Forms.Designers.Common.registerForEvent("TableColumnInserted", this.tableLayoutChangedDelegate);
        SourceCode.Forms.Designers.Common.registerForEvent("TableCellMerged", this.tableLayoutChangedDelegate);
        SourceCode.Forms.Designers.Common.registerForEvent("TableColumnRemoved", this.tableLayoutChangedDelegate);
        SourceCode.Forms.Designers.Common.registerForEvent("TableRowInserted", this.tableLayoutChangedDelegate);
        SourceCode.Forms.Designers.Common.registerForEvent("TableRowRemoved", this.tableLayoutChangedDelegate);
    },

    destroy: function ()
    {
        SourceCode.Forms.Designers.Common.deregisterForEvent("ControlSelected", this.controlSelectedDelegate);
        SourceCode.Forms.Designers.Common.deregisterForEvent("ControlMoved", this.controlMovedDelegate);
        SourceCode.Forms.Designers.Common.deregisterForEvent("ControlSizeChanged", this.controlSizeChangedDelegate);
        SourceCode.Forms.Designers.Common.deregisterForEvent("LayoutChanged", this.layoutChangedDelegate);
        SourceCode.Forms.Designers.Common.deregisterForEvent("ScrollStarted", this.scrollStartDelegate);
        SourceCode.Forms.Designers.Common.deregisterForEvent("ScrollEnded", this.scrollEndDelegate);

        SourceCode.Forms.Designers.Common.deregisterForEvent("ControlDragStarted", this.dragStartDelegate);
        SourceCode.Forms.Designers.Common.deregisterForEvent("ControlDragStopped", this.dragEndDelegate);

        SourceCode.Forms.Designers.Common.deregisterForEvent("TableColumnSizeChanged", this.tableLayoutChangedDelegate);
        SourceCode.Forms.Designers.Common.deregisterForEvent("TableColumnInserted", this.tableLayoutChangedDelegate);
        SourceCode.Forms.Designers.Common.deregisterForEvent("TableCellMerged", this.tableLayoutChangedDelegate);
        SourceCode.Forms.Designers.Common.deregisterForEvent("TableColumnRemoved", this.tableLayoutChangedDelegate);
        SourceCode.Forms.Designers.Common.deregisterForEvent("TableRowInserted", this.tableLayoutChangedDelegate);
        SourceCode.Forms.Designers.Common.deregisterForEvent("TableRowRemoved", this.tableLayoutChangedDelegate);
    },

    //#region Event handlers methods
    controlSelected: function (event, selectedControlModel)
    {
        this.dragging = false;

        this.selectedControlModel = selectedControlModel;

        this.showColumnResizeWidgetForSelectedControl();
    },

    controlMoved: function ()
    {
        this.dragging = false;

        this.showColumnResizeWidgetForSelectedControl();
    },

    controlSizeChanged: function ()
    {
        this.dragging = false;

        this.showColumnResizeWidgetForSelectedControl();
    },
        
    layoutChanged: function ()
    {
        if (!this.dragging)
        {
            //LayoutChanged may be called many times and we only would like to update the resize widget on the last one
            SourceCode.Forms.Utilities.performance.debounce(this.showColumnResizeWidgetForSelectedControl, { thisContext: this, delay: 100 });
        }
    },

    scrollStart: function ()
    {
        this.hideColumnResizeWidget();
    },

    scrollEnd: function ()
    {
        this.showColumnResizeWidgetForSelectedControl();
    },

    dragStart: function ()
    {
        this.dragging = true;
        this.hideColumnResizeWidget();
    },

    dragStopped: function ()
    {
        this.dragging = false;
        this.showColumnResizeWidgetForSelectedControl();
    },

    tableLayoutChanged: function ()
    {
        this.showColumnResizeWidgetForSelectedControl();
    },

    //#endregion Event handlers methods

    getTableHelper: function () 
    {
        return SourceCode.Forms.TableHelper;
    },

    getResizeWidgetSelectors: function (onlySelected)
    {
        var selected = "";
        if (onlySelected === true)
        {
            selected = ".selected";
        }
        return $(".columnSelector.{0}{1}".format(this.options.signature, selected));
    },

    showColumnResizeWidgetForSelectedControl: function ()
    {
        var selectedControlModel = this.selectedControlModel;

        if (!checkExists(selectedControlModel))
        {
            return false;
        }

        var jqTable = SourceCode.Forms.Designers.Common.getEditorTableFromSelectedObject(selectedControlModel.element);

        if (!checkExists(jqTable))
        {
            this.hideColumnResizeWidget();
            return false;
        }

        var controlType = selectedControlModel.controlType.toLowerCase();

        if (!SourceCode.Forms.Designers.Common.isTableControl(jqTable) && controlType !== "column")
        {
            this.hideColumnResizeWidget();

            return false;
        }

        //Check if a different editor table is selected 
        var differentTable = !checkExists(jqTable) || jqTable.length === 0 || jqTable[0] !== this.getTable()[0];

        //if the selected table control has changed to another table, clear the widget so it can be redrawn
        if (differentTable) this.setTable(jqTable);

        //if the table control column is not selected update the widget to remove any column selection
        if (controlType !== "column")
        {
            this.removeSelection();
        }

        this.showColumnResizeWidget();

        //Hide or show the column width content depends on the width of the column
        this.refreshWidgetContents();

        return true;
    },

    showColumnResizeWidget: function ()
    {
        if (this.isColumnOutOfSync())
        {
            //Redraw the column resizer
            //This could happen when columns are inserted or deleted
            this.renderColumnResizeWidget();
        }

        this.refreshColumnResizeWidget();

        if (this._isIE11())
        {
            //For IE11, the table control's outerWidth is changed after column widths are set
            //Thus recalculate the model and set the widget's position
            this.model = this._createModelDataFromTableControl();

            var widgetTable = this.jqWidgetTable;
            widgetTable.width(this._calculateWidgetWidth());

            var container = this.anchor;
            container.css({
                "left": this.model.left,
                "top": this.model.top
            });
        }

        this.anchor.addClass("show");
    },

    showColumnResizeWidgetWithAnimation: function ()
    {
        var wrapper = this.anchor;

        if (checkExists(wrapper))
        {
            wrapper.addClass("show");
            wrapper.addClass("showWithAnimation");
        }
    },

    hideColumnResizeWidget: function ()
    {
        var wrapper = this.anchor;

        if (checkExists(wrapper))
        {
            wrapper.removeClass("show");
            wrapper.removeClass("showWithAnimation");
        }
    },

    renderColumnResizeWidget: function ()
    {
        this.model = this._createModelDataFromTableControl();

        this._ensureResizeWidgetFromModel();
    },

    refreshColumnResizeWidget: function ()
    {
        this.model = this._createModelDataFromTableControl();

        var widgetWidth = this._calculateWidgetWidth();

        var widgetTable = this.jqWidgetTable;
        widgetTable.width(widgetWidth);

        var container = this.anchor;
        container.css({
            "left": this.model.left,
            "top": this.model.top
        });


        this._refreshLocals();

        this.refreshColumnsWidthFromModel();

        this.syncSelectedWidgetColumnContentToPropertyGrid();

        this._highlightSelectors();
    },

    clearColumnResizeWidget: function ()
    {
        $(".{0}".format(this.options.signature)).remove();

        this.model = {};
    },

    //when the widget is being swapped from representing one table's columns to another.
    setTable: function (jqTargetTable)
    {
        this.options.tableObj = jqTargetTable;
        this.jqTableToResize = $(this.options.tableObj);
        this.tableArray = SourceCode.Forms.TableHelper.getTableArray(this.jqTableToResize);
        this.renderColumnResizeWidget();
    },

    getTable: function ()
    {
        return $(this.options.tableObj);
    },

    getTableColums: function () 
    {
        var jqTable = this.isRenderedAsTable ? this.getTable() : this.jqWidgetTable;

        return jqTable.find(">colgroup>col");
    },

    //Get widget's <col>s that temproary represent a Column control.  When a column selector is selected, it will select the relevant <col> element.
    getWidgetTableColumns: function ()
    {
        return this.anchor.find("colgroup>col");
    },

    getWidgetTableCells: function () 
    {
        return this.isRenderedAsTable ? this.jqWidgetTable.find("td") : this.jqWidgetTable.find(">span");
    },

    showCooridinates: function ()
    {
        $("#cooridinate").remove();

        $("body").append('<input type="text" id="cooridinate" />');

        $("#cooridinate").css("position", "absolute");
        $("#cooridinate").offset({ top: 0, left: 0 });

        $("body").on("mousemove", function (event)
        {
            $("#cooridinate").val("left: " + event.pageX + ", top: " + event.pageY);
        });
    },

    //Table columns can be out of sync with the column resizers when a columns is added or removed
    isColumnOutOfSync: function ()
    {
        var jqSelectors = this.getWidgetTableColumns();
        var columnsInfo = this._getColumnWidths(this.jqTableToResize);

        return !(jqSelectors.length === columnsInfo.length);
    },

    refreshColumnsWidthFromModel: function () 
    {
        if (this.isRenderedAsTable) 
        {
            this.refreshTableColumnsWidthFromModel();
        }
        else 
        {
            this.refreshGridColumnsWidthFromModel();
        }
    },

    refreshTableColumnsWidthFromModel: function ()
    {
        var jqColumns = this.jqTableColumns;

        var jqWidgetColumns = this.jqWidgetTableColumns;
        var jqWidgetCells = this.jqWidgetTableCells;

        var i = 0;
        var colData = null;
        for (i = 0; i < this.model.columns.length; i++)
        {
            colData = this.model.columns[i];

            //Update table control column
            jqColumns.eq(i)[0].style.width = colData.width;
            jqColumns.eq(i).data("width", colData.configuredWidth);

            //Update resize widget column
            jqWidgetColumns.eq(i)[0].style.width = colData.width;

            //Update resize widget column selector content
            this._setContentWidthText(jqWidgetCells.eq(i), SourceCode.Forms.Designers.formatColumnWidth(colData.configuredWidth));
        }
    },

    refreshGridColumnsWidthFromModel: function () 
    {
        var jqTable = this.jqTableToResize;
        var jqWidgetColumns = this.jqWidgetTableColumns;
        var jqWidgetCells = this.jqWidgetTableCells;

        var configuredWidths = [];
        var renderWidths = [];
        for (var i = 0; i < this.model.columns.length; i++) 
        {
            var colData = this.model.columns[i];

            var widthData = this._getWidthUnitData(colData.width);

            if (widthData.type === "")
            {
                jqWidgetColumns.eq(i)[0].style["width"] = "";
            }
            else
            {
                //Update resize widget column
                if (widthData.type === "%")
                {
                    jqWidgetColumns.eq(i)[0].style["width"] = parseFloat(colData.width) / 100 * this.model.width + "px";
                }
                else
                {
                    jqWidgetColumns.eq(i)[0].style["width"] = colData.width;
                }
            }

            //Update configured width for the widget column
            jqWidgetColumns.eq(i).data("width", colData.configuredWidth);

            //Update resize widget column selector content
            this._setContentWidthText(jqWidgetCells.eq(i), SourceCode.Forms.Designers.formatColumnWidth(colData.configuredWidth));

            //add to width array for updating the main table.
            configuredWidths.push(colData.configuredWidth);
            renderWidths.push(colData.width);
        }

        this._setWidgetGridColumnWidths(this.jqWidgetTable, renderWidths);

        //Use the table helper to set these.
        SourceCode.Forms.TableHelper.setColumnConfiguredWidths(configuredWidths, jqTable);
        SourceCode.Forms.TableHelper.setColumnRenderWidths(renderWidths, jqTable);
    },
    
    refreshWidgetContents: function ()
    {
        var i = 0;
        var colData = null;
        for (i = 0; i < this.model.columns.length; i++)
        {
            colData = this.model.columns[i];

            //Update resize widget column selector content
            this._setContentWidthText(this.jqWidgetTableCells.eq(i), SourceCode.Forms.Designers.formatColumnWidth(colData.configuredWidth));
        }
    },

    removeSelection: function ()
    {
        this._ensureResizeWidgetFromModel();

        var widgetTable = this.jqWidgetTable;

        //Get widget's <col>s that temproary represent a Column control.  When a column selector is selected, it will select the relevant <col> element ini the widget.
        var jqWidgetTableColumns = widgetTable.find("colgroup>col");
        jqWidgetTableColumns.removeClass("selected");
        jqWidgetTableColumns.removeClass("highlighted");

        var widgetCells = widgetTable.find(".widget-cell");
        widgetCells.removeClass("selected");
        widgetCells.removeClass("highlighted");

        var jqSelectors = this.getResizeWidgetSelectors();
        jqSelectors.removeClass("selected");
        jqSelectors.removeClass("highlighted");

        var jqColumns = this.jqTableToResize.find(">colgroup>col");
        jqColumns.removeClass("selected");
        jqColumns.removeClass("highlighted");
    },

    showDragHandlers: function ()
    {
        var tableID = this.jqTableToResize.attr("id");

        var columnResizeWrapper = jQuery("#" + tableID + "_columnResizeWrapperDiv");
        var dragBlocks = columnResizeWrapper.find("div.drag-column > .drag-block"); //no. of drag blocks = number of columns + 1

        dragBlocks.hide();

        var jqSelectors = this.getResizeWidgetSelectors(true);

        if (jqSelectors.length > 0)
        {
            var dragBlockColIndex = jqSelectors.eq(0).data("columnIndex");

            if (dragBlockColIndex === 0)
            {
                //Show drag block for first column
                dragBlocks.eq(dragBlockColIndex + 1).show();
            }
            else if (dragBlockColIndex === dragBlocks.length - 2)
            {
                //Show drag block for last column
                dragBlocks.eq(dragBlockColIndex).show();
            }
            else if (dragBlockColIndex > 0 && dragBlockColIndex < dragBlocks.length - 2)
            {
                dragBlocks.eq(dragBlockColIndex).show();
                dragBlocks.eq(dragBlockColIndex + 1).show();
            }
        }
    },

    hideDragHandlers: function (tableID)
    {
        var columnResizeWrapper = jQuery("#" + tableID + "_columnResizeWrapperDiv");
        var dragBlocks = columnResizeWrapper.find("div.drag-column > .drag-block"); //no. of drag blocks = number of columns + 1

        dragBlocks.hide();
    },

    showColumnOverlay: function ()
    {
        $(".column-selected-overlay").remove();

        var jqSelected = this.getResizeWidgetSelectors(true);

        if (jqSelected.length === 0)
        {
            return;
        }

        var selectColumnIndex = jqSelected.eq(0).data("columnIndex");

        var divOverlay = $("<div class='column-selected-overlay'></div>");

        jqSelected.before(divOverlay);

        var posData = this.renderedPositions[selectColumnIndex];

        var offset =
        {
            top: this._calculateWidgetTopPosition() - this.overlayPaddingTop,
            left: posData.offsetLeft - this.overlayPaddingLeft
        };
        divOverlay.offset(offset);
        divOverlay.css("width", posData.outerWidth + this.overlayPaddingRight + "px");
        divOverlay.css("height", this._calculateOverlayHeight() + "px");
    },

    updateColumnOverlay: function ()
    {
        var jqSelected = this.getResizeWidgetSelectors(true);
        if (jqSelected.length === 0)
        {
            return;
        }
        var index = jqSelected.eq(0).data("columnIndex");
        var divOverlay = $(".column-selected-overlay");
        var jqCell = jqSelected.closest("td");
        var posData = this.renderedPositions[index];

        var offset =
        {
            top: this._calculateWidgetTopPosition() - this.overlayPaddingTop,
            left: posData.offsetLeft - this.overlayPaddingLeft
        };

        divOverlay.offset(offset);
        divOverlay.css("width", jqCell.outerWidth() + this.overlayPaddingRight + "px");
        divOverlay.css("height", this._calculateOverlayHeight() + "px");
    },

    syncSelectedWidgetColumnContentToPropertyGrid: function ()
    {
        var index = this._getSelectedColumnIndex();

        if (!checkExists(index))
        {
            return;
        }

        var id = this.model.columns[index].id;
        var w = this.model.columns[index].configuredWidth;

        if (SourceCode.Forms.Designers.isDimensionAuto(w))
        {
            w = "";
        }

        w = SourceCode.Forms.Designers.formatColumnWidth(w);

        var updateOptions =
        {
            controlId: id,
            propertyName: "width",
            propertyValue: w
        };

        SourceCode.Forms.Designers.Common.Context.updateControlPropertyField(updateOptions);
    },

    resizeControls: function ()
    {
        //Note we can improve this algorithm by perform resize on the cells that have decreased width compare to a reference
        var jqCells = this.jqTableToResize.find("td");

        var i = 0;
        var j = 0;
        for (i = 0; i < jqCells.length; i++)
        {
            var jqCell = jqCells.eq(i);
            var width = jqCell.outerWidth();
            var jqControls = jqCell.find('> .controlwrapper');

            for (j = 0; j < jqControls.length; j++)
            {
                this.DesignerTable._doControlResizing(jqControls.eq(j), width);
            }
        }
    },

    selectColumnSelector: function(columnIndex)
    {
        var jqWidgetTableCells = this.jqWidgetTable.find(".widget-cell");
        var colSelector = jqWidgetTableCells.eq(columnIndex).find(".columnSelector");

        colSelector.addClass("selected");
        colSelector.parent().addClass("selected");

        var columnId = colSelector.data("columnId");

        var col = $("#{0}".format(columnId));
        col.attr("itemtype", "Column");
        col.attr("controltype", "Column");
        col.attr("layout", "Column");
        col.addClass("selected");

        this.selectedColumnIndex = col.index();
        SourceCode.Forms.Designers.Common.Context.selectControl(columnId);

        return colSelector;
    },

    _elementExistsInDOM: function (jqElement)
    {
        return (checkExists(jqElement) && jqElement.parent().length > 0);
    },

    //#region Column selectors creation methods


    //creates the widget if it doesn't exist, updates it by removing/adding column UI when it needs to be updated.
    _ensureResizeWidgetFromModel: function ()
    {
        if (!this._elementExistsInDOM(this.anchor))
        {
            //note: the canvas-widget class lets the canvas (sourcecode.forms.designers.js) know when we select a column
            //      that its selected item is within a widget, and not actually on the canvas.
            var widget = $("<div class='columnResizeWidgetWrapper canvas-widget'><div class='columnResizeContainer canvas-widget-ui bg-deadarea'></div></div>");
            widget.addClass(this.options.signature);
            widget.attr("id", "columnResizeWidgetWrapper_" + this.options.signature);
            this.anchor = widget;
        }

        //Add css class so it can hide the widget's <table> element if the widget is rendered as css grid.
        //A <Table> element is always rendered for the widget so that it has <col> elements to represent a Column control selection.
        this.anchor.toggleClass("renderAsTable", this.isRenderedAsTable);
        this.anchor.toggleClass("renderAsGrid", !this.isRenderedAsTable);
        
        this.jqWidgetTableContainer = this.anchor.find(".columnResizeContainer");

        if (!this._elementExistsInDOM(this.jqWidgetTable))
        {
            //Add Widget Table
            var jqWidgetTable = this._createEmptyTableFromColumnsModel(this.model.columns);
            this.jqDummyTable = jqWidgetTable;

            //The widget should always have a <table> that has a <colgroup> to represent each Column control (<col>)
            this.jqWidgetTableContainer.append(jqWidgetTable);

            if (!this.isRenderedAsTable)
            {
                //When render the widget as grid, the <table> with the <colgroup> should be hidden and the grid is render under the <table>
                jqWidgetTable = this._createEmptyGridFromColumnsModel(this.model.columns);
                this.jqWidgetTableContainer.append(jqWidgetTable);
            }

            this.jqWidgetTable = jqWidgetTable;
        }

        this._ensureColumnsInWidget();
        

        //This will add the whole widget to the DOM, so we do this last (single DOM mutation)
        //Add the widget wrapper to the canvas container
        if (!this._elementExistsInDOM(this.anchor)) this.jqScrollWrapper.append(this.anchor);
       
    },

    _ensureColumnsInWidget: function ()
    {
        var jqColumns = this.getWidgetTableColumns();
        var columnsInfo = this._getColumnWidths(this.jqTableToResize);
        var jqWidgetTable = this.jqWidgetTable;

        //we need to add/remove columns from our widget (We don't want to rebuild the whole widget, as this causes glitches in the UI)
        if (!(jqColumns.length === columnsInfo.length))
        {
            if (jqColumns.length > columnsInfo.length)
            {
                this._removeWidgetColumns(jqColumns.length - columnsInfo.length, columnsInfo);
            }
            else
            {
                this._addWidgetColumns(columnsInfo.length - jqColumns.length, columnsInfo);
            }
        }

        this._updateColumnsForDifferentTable(columnsInfo, jqWidgetTable);
    },

    _updateColumnsForDifferentTable: function (columnsInfo, jqWidgetTable)
    {
        //Update the widths/IDs etc of the columns for the new table
        var jqWidgetTable = this.jqWidgetTable;
        var dummyTable = this.jqDummyTable;

        for (i = 0; i < columnsInfo.length; i++)
        {
            var columnModel = columnsInfo[i];

            jqCol = dummyTable.find("col").eq(i);
            this._updateColWithColumnInfo(jqCol, columnModel);

            jqCell = jqWidgetTable.find(".widget-cell").eq(i);
            jqColSelector = jqCell.find(".columnSelector");
           
            jqColSelector.data("columnIndex", i);
            jqColSelector.data("columnId", columnModel.id);

            jqColSelector.toggleClass("left-most", (i === 0));
            jqColSelector.toggleClass("right-most", (i === columnsInfo.length - 1));
        }
    },

    //removes columns from the widget to match the number of columns in the new target table Control
    _removeWidgetColumns: function (numberOfColumns, columns)
    {
        //debugger;
        //console.log("remove - " + numberOfColumns);
        var table = this.jqDummyTable;
        for (var i = 0; i < numberOfColumns; i++)
        {
            var jqCols = table.find("col");
            var jqCells = table.find(".widget-cell");
            jqCols.eq(jqCols.length-1).remove();
            jqCells.eq(jqCells.length-1).remove();
        }

        if (!this.isRenderedAsTable)
        {
            var jqGrid = this.jqWidgetTable;
            for (var i = 0; i < numberOfColumns; i++)
            {
                //1 over the last cell
                var index = columns.length + i + 1; 
                jqGrid.find("[col='" + index + "']").remove();
            }
        }
    },

    //adds columns to the widget to match the number of columns in the new target table Control
    _addWidgetColumns: function (numberOfColumns, columns)
    {
        //Update the dummytable with additional columns (this might be the actual table if rendering as table)
        var table = this.jqDummyTable;
        var jqWidgetTableColgroup = table.find("> colgroup");
        var jqWidgetTableRow = table.find("> tbody > tr");
        var jqWidgetTableCol = null;
        var jqWidgetTableCell = null;

        for (var i = columns.length - numberOfColumns; i < columns.length; i++)
        {
            var column = columns[i];

            jqWidgetTableCol = $("<col/>");
            this._updateColWithColumnInfo(jqWidgetTableCol, column);
            jqWidgetTableColgroup.append(jqWidgetTableCol);
            jqWidgetTableCell = $("<td class='widget-cell'></td>");

            if (this.isRenderedAsTable) this._appendColumnSelector(columns[i], jqWidgetTableCell, i);
            jqWidgetTableRow.append(jqWidgetTableCell);
        }


        //Update the widget table grid with additional columns.
        if (!this.isRenderedAsTable)
        {
            var jqGrid = this.jqWidgetTable;

            for (var i = columns.length - numberOfColumns; i < columns.length; i++)
            {
                var jqCell = $("<span class='widget-cell'></span>");
                jqGrid.append(jqCell);
                SourceCode.Forms.TableHelper.updateGridCellWithCellInfo(jqCell, jqGrid, { rowIndex: 0, colIndex: i });

                this._appendColumnSelector(columns[i], jqCell, i);
            }

            var renderWidthArray = [];
            for (var i = 0; i < columns.length; i++)
            {
                renderWidthArray.push(columns[i].width);
            }
            this._setWidgetGridColumnWidths(jqGrid, renderWidthArray);
        }

    },

    _updateColWithColumnInfo: function (jqCol, column)
    {
        jqCol.width(column.width);
        jqCol.data("width", column.width);
        jqCol.attr("id", column.id);
    },

    //Add the html structure inside the column cell for dragging and the width text etc
    _appendColumnSelector: function (columnModel, jqCell, columnIndex)
    {
        var jqColSelector = this._createColumnSelectorFromModel(columnModel, columnIndex);
        jqCell.append(jqColSelector);
    },

    _createEmptyTableFromColumnsModel: function (columns)
    {
        var jqWidgetTable = $('<table class="widget-table"><colgroup></colgroup><tbody><tr></tr></tbody></table>');
        return jqWidgetTable;
    },

    _createEmptyGridFromColumnsModel: function (columns) 
    {
        var jqGrid = $('<div class="widget-grid"></div>');
        return jqGrid;
    },

    _setWidgetGridColumnWidths: function (jqGrid, widthArray) 
    {
        var strColumns = widthArray.join(' ').trim();
        jqGrid.css("grid-template-columns", strColumns);

        if (this._isIE11())
        {
            jqGrid[0].style["-ms-grid-columns"] = strColumns;
        }
    },

    _createColumnSelectorFromModel: function (columnModel, columnIndex)
    {
        var jqColSelector = $("<div class='columnSelector'></div>");

        jqColSelector.addClass(this.options.signature);

        jqColSelector.attr("id", "columnSelector_" + columnIndex);
        jqColSelector.attr("controltype", "Column");

        jqColSelector.data("columnIndex", columnIndex);
        jqColSelector.data("columnId", columnModel.id);


        //Left edge grip
        this._createColumnResizeGrip(jqColSelector, columnIndex, "leftEdge");

        //Content
        var content = $("<div class='content'></div>");
        jqColSelector.append(content);

        //Right edge grip
        this._createColumnResizeGrip(jqColSelector, columnIndex, "rightEdge");

        jqColSelector.on("click", this._handleColumnSelectorClick.bind(this));

        return jqColSelector;
    },

    _handleColumnSelectorClick: function (evt)
    {
        evt.stopPropagation();

        this.removeSelection();

        //Select the column selector
        var colSelector = $(evt.currentTarget);
        var columnIndex = colSelector.data("columnIndex");

        this.selectColumnSelector(columnIndex);


        return false;
    },

    _createColumnResizeGrip: function (jqColSelector, columnIndex, edge)
    {
        var _this = this;
        var _designerTable = this.DesignerTable;

        var grip = $("<div class='{0} columnResizeGrip'></div>".format(edge));
        grip.append("<div class='stripe'></div>");
        grip.append("<div class='spacer'></div>");
        grip.append("<div class='stripe'></div>");

        grip.attr("id", String.generateGuid());

        grip.data("tableID", this.jqTableToResize.attr("id"));
        grip.data("columnIndex", columnIndex); //Store the column index so that when drag start, we have a quick way identify which column is been draggged

        jqColSelector.append(grip);

        grip.draggable({
            axis: 'x',
            helper: function (e) { let helper = $(e.delegateTarget).clone(true); helper.data("context", e.delegateTarget); return helper.get(0); },
            scroll: false,
            containment: _this.jqWidgetTable,
            start: function (e, ui)
            {
                e.stopPropagation();

                //If editor table is within Form Tab, the scrollbar for the Form tab should be disabled so it won't influence the dragging.
                _this._setFormTabScrollbarWidthToBiggerThanContent();

                _this._setResizingInfo(ui.helper);

                _this._disablePointerEvents();

                if (_this._isWidgetBiggerThanTableControlConfiguredWidth())
                {
                    _this._updateDraggingCursorStyle("not-allowed");
                }
                else
                {
                    _this._updateDraggingCursorStyle("col-resize");

                    if (_this._requiredToUseRenderedWidths())
                    {
                        //Update the model with the rendered position in case if the sum of all the columns may not add up to 100%
                        _this._updateModelWithRenderedPositions();

                        _this.refreshColumnsWidthFromModel();
                    }

                    _this._recalculateRenderedPositions();

                    //If the master column is auto width and it has at least one column to the left or right is auto width also, we need to default the master column to pixel width
                    _this._setMasterColumnToPixelWidth();

                    _this._recalculateDragContainmentData();

                    //ensure the cached variables are update to date when drag starts
                    _this._refreshLocals();

                    //Use the original left position of the grip rather than the ui.helper clone. [TFS 884144]
                    //The helper clone's position won't be correct if the table is been drag to different container and the clone's position won't be updated accordingly. 
                    _this.dragInfo.startingLeftPosition = $(ui.helper).data("context").offsetLeft;
                }
            },
            drag: function (e, ui)
            {
                e.stopPropagation();

                //update the dragInfo so it is used in the _dragAnimationLoop function to update the column widths
                _this.dragInfo.difference = ui.position.left - _this.dragInfo.startingLeftPosition;

                //use debounce function to improve performance as browser like IE may not handle high frame rate and cause the resizing to be sluggish
                //delay of 40ms means 25 frames per second
                _this.dragPromise = SourceCode.Forms.Utilities.performance.debounce(_this._dragAnimationLoop, { thisContext: _this, delay: 40});
            },
            stop: function (e, ui)
            {
                e.stopPropagation();

                _this._setFormTabScrollbarWidthToEmpty();

                _this._enablePointerEvents();

                //Change the cursor back
                _this.dragPromise.done(_this._updateDraggingCursorStyle.bind(_this));

                _this.resizeControls();

                //position resizehandlers
                _designerTable._positionHandlers();

                //[898206] After the editor table is normalized (set columns with minimum width e.g. 40px), refresh the widget columns width 
                _this.refreshColumnResizeWidget();
                _this.refreshWidgetContents();
            }
        });

        return grip;
    },

    //[898205] Disable the scrollbar of the Form tab's scrollWrapper by set the width to be bigger than the scrollWidth.
    //We need to do this because when the editor table overflows the container and it has an AUTO column, 
    //resizing the column will cause the editor table to shrink and cause the container(scrollWrapper) to shrink as well.
    //Thus it is causing the browser to not handle this behaviour correctly.  What we want is to have a static container width that won't change while dragging the columns.
    _setFormTabScrollbarWidthToBiggerThanContent: function ()
    {
        var tabContent = this.jqTableToResize.closest("#pgTabContent");

        if (tabContent.length > 0)
        {
            this.tabScrollWrapper = tabContent.parent(".scroll-wrapper");

            if (checkExists(this.tabScrollWrapper) && this.tabScrollWrapper.length > 0)
            {
                var width = this.tabScrollWrapper.width();
                var scrollWidth = this.tabScrollWrapper[0].scrollWidth;

                if (scrollWidth > width)
                {
                    //Set the width of the scrollWrapper to be slightly bigger than the scrollWidth so that scrollbar is removed
                    this.tabScrollWrapper.width(scrollWidth + 20); 
                }
            }
        }
    },

    _setFormTabScrollbarWidthToEmpty: function ()
    {
        if (checkExists(this.tabScrollWrapper) && this.tabScrollWrapper.length > 0)
        {
            this.tabScrollWrapper.width("");
        }
    },

    _dragAnimationLoop: function ()
    {
        var diff = this.dragInfo.difference;

        if (this._isWidgetBiggerThanTableControlConfiguredWidth())
        {
            this._updateDraggingCursorStyle("not-allowed");

            return;
        }

        if (this._ensureDraggingContainment(diff))
        {
            this._updateDraggingCursorStyle("col-resize");
        }
        else
        {
            this._updateDraggingCursorStyle("not-allowed");

            if (diff > this.dragContainmentData.right)
            {
                diff = this.dragContainmentData.right;
            }
            else if (diff < this.dragContainmentData.left)
            {
                diff = this.dragContainmentData.left;
            }
        }

        this._updateModelColumnsWidthWithDragHandlerPosition(diff);

        var masterIndex = this._getMasterColumnIndex();
        var slaveIndex = masterIndex + 1;

        var masterWidth = this.model.columns[masterIndex].width;
        var masterConfiguredWidth = this.model.columns[masterIndex].configuredWidth;

        var slaveWidth = this.model.columns[slaveIndex].width;
        var slaveConfiguredWidth = this.model.columns[slaveIndex].configuredWidth;

        if (this.isRenderedAsTable) 
        {
            this.jqTableColumns.eq(masterIndex).width(masterWidth);
            this.jqTableColumns.eq(masterIndex).data("width", masterConfiguredWidth);

            this.jqTableColumns.eq(slaveIndex).width(slaveWidth);
            this.jqTableColumns.eq(slaveIndex).data("width", slaveConfiguredWidth);

            this.jqWidgetTableColumns.eq(masterIndex).width(masterWidth);
            this.jqWidgetTableColumns.eq(slaveIndex).width(slaveWidth);
        }
        else 
        {
            this.refreshGridColumnsWidthFromModel();
        }

        //Due to the resize we need to show or hide the content.  Need to do it on all columns due to there may be multiple auto columns.
        this.refreshWidgetContents();

        this.syncSelectedWidgetColumnContentToPropertyGrid();

        SourceCode.Forms.Designers.Common.triggerEvent("ColumnWidthChanged");
    },

    //#endregion Column selectors creation methods

    //#region Column dragging methods
    _recalculateDragContainmentData: function ()
    {
        var columnIndex = this._getMasterColumnIndex();

        var masterData = this.renderedPositions[columnIndex]; //Master column position data

        var slaveData = this.renderedPositions[columnIndex + 1]; //Slave column position data

        var slaveColumnLeftPosition = slaveData.offsetLeft;

        var autoColumnIndexes = this._getAutoWidthColumnIndexes();

        var adjustableWidth = 0;
        var hasAutoWidth = false;

        if (autoColumnIndexes.length > 0)
        {
            var i = 0;
            for (i = 0; i < autoColumnIndexes.length; i++)
            {
                if (autoColumnIndexes[i] > columnIndex)
                {
                    var index = autoColumnIndexes[i];
                    adjustableWidth += this.renderedPositions[index].width - this.colSelectorMinResizeWidth;

                    hasAutoWidth = true;
                }
            }
        }

        if (!hasAutoWidth && adjustableWidth === 0)
        {
            adjustableWidth = slaveData.width - this.colSelectorMinResizeWidth;
        }

        var leftContainment = masterData.offsetLeft + this.colSelectorMinResizeWidth;
        var rightContainment = slaveColumnLeftPosition + adjustableWidth;

        //Normalize the positions, drag start position is 0. Dragging towards left is negative value, Dragging toward right is positive value.
        this.dragContainmentData =
        {
            left: leftContainment - slaveColumnLeftPosition,
            right: rightContainment - slaveColumnLeftPosition
        };
    },

    _ensureDraggingContainment: function (dragDifference)
    {
        var leftContainment = this.dragContainmentData.left;
        var rightContainment = this.dragContainmentData.right;

        if (dragDifference > rightContainment)
        {
            return false;
        }

        if (dragDifference < leftContainment)
        {
            return false;
        }

        return true;
    },

    _isWidgetBiggerThanTableControlConfiguredWidth: function ()
    {
        if (this.jqWidgetTable.outerWidth() > this.jqTableToResize.width())
        {
            //If the Table Control is configured to be smaller than the min-width of the widget then don't allow resizing. [TFS 884319]
            //min-width of the widget = [number of the columns] * [min display width of column e.g. 40px]
            return true;
        }

        return false;
    },

    _requiredToUseRenderedWidths: function ()
    {
        var i = 0;
        var sumOfPixels = 0;
        var tableWidth = this.model.width;
        var hasAutoWidth = false;

        for (i = 0; i < this.model.columns.length; i++)
        {
            var columnData = this.model.columns[i];
            var widthData = this._getWidthUnitData(columnData.width);
            var configuredWidthData = this._getWidthUnitData(columnData.configuredWidth);

            if (widthData.type === "" || configuredWidthData.type === "")
            {
                //[898274] If there is an AUTO column, when resizing the column, the AUTO column should give up or receive width.
                hasAutoWidth = true;

                //Exit early
                break;
            }

            if (widthData.type === "%")
            {
                sumOfPixels += widthData.value / 100 * tableWidth; //convert to pixel value
            }
            else
            {
                sumOfPixels += widthData.value;
            }
        }

        var diff = tableWidth - sumOfPixels;

        if (hasAutoWidth || diff < 2)
        {
            return false;
        }

        return true;
    },

    _updateModelWithRenderedPositions: function ()
    {
        var renderedWidths = this._recalculateRenderedPositions();

        var i = 0;
        for (i = 0; i < renderedWidths.length; i++)
        {
            var columnData = this.model.columns[i];

            if (columnData.width !== "") //Auto width should remain auto
            {
                this._updateModelColumnWidth(columnData, renderedWidths[i].width + "px");
            }
        }
    },

    _updateModelColumnsWidthWithDragHandlerPosition: function (dragDifference)
    {
        var masterIndex = this._getMasterColumnIndex();
        var slaveIndex = masterIndex + 1;
        var columns = this.model.columns;

        if (masterIndex < columns.length - 1)
        {
            var masterData = this.renderedPositions[masterIndex]; //Master column position data
            var slaveData = this.renderedPositions[slaveIndex]; //Slave column position data

            if (!SourceCode.Forms.Designers.isDimensionAuto(columns[masterIndex].width)) //Auto width should remain auto
            {
                //Update master column width
                this._updateModelColumnWidth(columns[masterIndex], masterData.width + dragDifference + "px");
            }

            if (!this._hasAutoWidthToTheRightOfColumn(masterIndex))
            {
                //Update slave column width
                this._updateModelColumnWidth(columns[slaveIndex], slaveData.width - dragDifference + "px");
            }
        }
    },

    _setContentWidthText: function (jqWidgetCell, widthText)
    {
        var content = jqWidgetCell.find(".content");

        if (SourceCode.Forms.Designers.isDimensionAuto(widthText))
        {
            widthText = "AUTO";
        }

        //Set the content if the width is greather than the allowed display width
        if (jqWidgetCell.outerWidth() >= this.colSelectorMinDisplayWidth)
        {
            content.text(widthText);
        }
        else
        {
            content.text("");
        }
    },

    _convertWidthToPercentage: function (widthText, fullWidth)
    {
        var widthData = this._getWidthUnitData(widthText);
        var newWidth = 0;

        if (widthData.type === "px")
        {
            newWidth = (widthData.value / fullWidth * 100).toFixed(4);
        }
        else if (widthData.type === "%")
        {
            newWidth = widthData.value;
        }

        return newWidth + "%";
    },

    _getWidthUnitData: function (widthText)
    {
        return SourceCode.Forms.Designers.getWidthUnitData(widthText);
    },

    _disablePointerEvents: function ()
    {
        //The container's is registered with an onClick event handler thus disable the pointer-events will prevent the event handler from firing
        //Note that this must work for both View Designer and Form Designer
        this.jqContainer.parent().css("pointer-events", "none");
        this.jqContainer.parent().parent().css("pointer-events", "none");

        //Disable the widget table's pointer-event so that when dragging the mouse pointer on top of a cell, 
        //it wouldn't fire an onclick event that bubble up to the parents to cause the canvas to be selected.
        this.jqWidgetTable.css("pointer-events", "none");
    },

    _enablePointerEvents: function ()
    {
        //Enable the pointer events again
        this.jqContainer.parent().css("pointer-events", "");
        this.jqContainer.parent().parent().css("pointer-events", "");

        this.jqWidgetTable.css("pointer-events", "");
    },

    _updateDraggingCursorStyle: function (cursorStyle)
    {
        if (!checkExists(cursorStyle))
        {
            cursorStyle = "";
        }
        //Since the pointer-events is disabled, we need to change the cursor on the parent element where the pointer-events is been disabled. 
        this.jqContainer.parent().parent().parent().css("cursor", cursorStyle);
    },

    _setResizingInfo: function (jqDragHandler)
    {
        let grip = $(jqDragHandler.data("context"));

        this.isLeftEdgeResizing = jqDragHandler.hasClass("leftEdge");
        this.selectedColumnIndex = grip.data("columnIndex");

        this.removeSelection();
        this.selectColumnSelector(this.selectedColumnIndex);
    },

    //#endregion Column dragging methods

    //#region Position calculation methods
    _createModelDataFromTableControl: function ()
    {
        var model = {};

        this.isRenderedAsTable = SourceCode.Forms.TableHelper.isRenderedAsTable(this.jqTableToResize)? true: false;

        model.width = this._calculateWidgetWidth();

        var tableLocation = SourceCode.Forms.CanvasWidgetHelper.getAccurateLocation(this.jqTableToResize, this.jqScrollWrapper);


        //set to exact the top left of the table, css on this widget wil move it up and away from the actual control.
        model.left = tableLocation.left;
        model.top = tableLocation.top;

        if (!this.isRenderedAsTable)
        {
            //var jqToMeasure = this.jqTableToResize.find(">.editor-cell").eq(0);
            var jqToMeasure = this.jqTableToResize;
            var tableborderleftwidth = Math.max(0, parseInt(jqToMeasure.css("border-left-width")));
            model.left += tableborderleftwidth;
        }

        model.columns = [];
        model.columns = this._getColumnWidths(this.jqTableToResize);

        return model;
    },

    //return an array of {width: x, configuredWidth: y, id: z}
    _getColumnWidths: function (jqTable)
    {
        if (this.isRenderedAsTable)
        {
            return this._getColumnsFromTable(jqTable);
        }
        else
        {
            return this._getColumnsFromGrid(jqTable);
        }
    },

    _getColumnsFromTable: function (jqTable) 
    {
        var columns = [];

        var col = null;
        var jqColumns = jqTable.find("> colgroup > col");
        for (var i = 0; i < jqColumns.length; i++) 
        {
            col = jqColumns.eq(i);

            var column = {};

            column.id = col.attr("id");

            //Don't use jQuery's width() or .css("width") function as we want to keep the px or % units and auto width as empty
            column.width = col[0].style.width;

            column.configuredWidth = col.data("width");

            columns.push(column);
        }

        return columns;
    },

    _getColumnsFromGrid: function (jqTable) 
    {
        var columns = [];

        //returns array of {id:xxx, width:xxx, renderWidth:xxx}
        var columnsObjectModel = SourceCode.Forms.TableHelper.buildColumnsObjectModel(jqTable);

        for (var i = 0; i < columnsObjectModel.length; i++) 
        {
            var model = columnsObjectModel[i];
            var column = {};

            column.id = model.id;
            column.width = model.renderWidth;
            column.configuredWidth = model.width;

            columns.push(column);
        }

        return columns;
    },

    _recalculateRenderedPositions: function ()
    {
        var i = 0;

        this.renderedPositions = [];

        var data = null;
        var offsetLeft = null;
        var width = null;
        var totalWidth = 0;
        var jqCell = null;

        var jqCells = this.jqWidgetTableCells;
        
        for (i = 0; i < jqCells.length; i++)
        {
            jqCell = jqCells.eq(i);

            offsetLeft = jqCell.offset().left;

            data =
            {
                offsetLeft: offsetLeft,
                width: jqCell.width(),
                outerWidth: jqCell.outerWidth()
            };

            totalWidth += jqCell.width();

            this.renderedPositions.push(data);
        }

        this.renderedPositions.totalWidth = totalWidth;

        return this.renderedPositions;
    },

    _calculateWidgetWidth: function () 
    {
        var tableborderleftwidth = Math.max(0, parseInt(this.jqTableToResize.css("border-left-width")));
        var tableborderrightwidth = Math.max(0, parseInt(this.jqTableToResize.css("border-right-width")));
        var width = this.jqTableToResize.outerWidth() - tableborderleftwidth - tableborderrightwidth;

        return width;
    },

    _calculateWidgetTopPosition: function ()
    {
        return this.jqTableToResize.offset().top - this.colSelectorHeight - this.gapBetweenTable;
    },

    _calculateOverlayHeight: function ()
    {
        return this.jqTableToResize.height() + this.colSelectorHeight + this.gapBetweenTable + this.overlayPaddingTop + this.overlayPaddingBottom;
    },

    //#endregion Position calculation methods

    //#region Helper methods

    _refreshLocals: function ()
    {
        this.jqWidgetWrapper = this.anchor;

        this.jqWidgetTableColumns = this.getWidgetTableColumns();

        this.jqWidgetTableCells = this.getWidgetTableCells();

        this.jqTableColumns = this.getTableColums();

        this.tableArray = SourceCode.Forms.TableHelper.getTableArray(this.jqTableToResize);
    },

    _updateModelColumnWidth: function (columnData, newWidth)
    {
        var widthData = this._getWidthUnitData(columnData.configuredWidth);

        if (widthData.type === "%")
        {
            newWidth = this._convertWidthToPercentage(newWidth, this.model.width);
        }

        columnData.width = newWidth;
        columnData.configuredWidth = newWidth;
    },

    _getSelectedColumnIndex: function ()
    {
        var jqSelectors = this.getResizeWidgetSelectors(true);
        var seletedColumnIndex = null;

        if (jqSelectors.length > 0)
        {
            seletedColumnIndex = jqSelectors.eq(0).data("columnIndex");
        }

        return seletedColumnIndex;
    },

    _setMasterColumnToPixelWidth: function ()
    {
        //If the master column is auto width and it has at least one column to the left or right is auto width also, we need to default the master column to pixel width
        if (this._isMasterAutoAndAnotherColumnIsAuto())
        {
            var index = this._getMasterColumnIndex();

            if (checkExists(index))
            {
                var columnData = this.model.columns[index];

                columnData.width = this.renderedPositions[index].width + "px";
                columnData.configuredWidth = columnData.width;
            }
        }
    },

    _getMasterColumnIndex: function ()
    {
        var masterColumnIndex = this.selectedColumnIndex;

        if (this.isLeftEdgeResizing)
        {
            masterColumnIndex = masterColumnIndex - 1;
        }

        return masterColumnIndex;
    },

    _isMasterAutoAndAnotherColumnIsAuto: function ()
    {
        var index = this._getMasterColumnIndex();

        if (!checkExists(index))
        {
            return false;
        }

        var isMasterAuto = false;
        var isAnyOtherColumnAuto = false;

        var autoColumnIndexes = this._getAutoWidthColumnIndexes();

        if (autoColumnIndexes.length > 0)
        {
            var i = 0;
            for (i = 0; i < autoColumnIndexes.length; i++)
            {
                if (autoColumnIndexes[i] === index)
                {
                    isMasterAuto = true;
                }
                else if (autoColumnIndexes[i] !== index)
                {
                    isAnyOtherColumnAuto = true;
                }
            }
        }

        return isMasterAuto && isAnyOtherColumnAuto;
    },

    _getAutoWidthColumnIndexes: function ()
    {
        var columns = [];

        var i = 0;
        for (i = 0; i < this.model.columns.length; i++)
        {
            var width = this.model.columns[i].configuredWidth;

            if (SourceCode.Forms.Designers.isDimensionAuto(width))
            {
                columns.push(i);
            }
        }

        return columns;
    },

    _hasAutoWidthToTheRightOfColumn: function (columnIndex)
    {
        var autoColumnIndexes = this._getAutoWidthColumnIndexes();

        if (autoColumnIndexes.length > 0)
        {
            var i = 0;
            for (i = 0; i < autoColumnIndexes.length; i++)
            {
                if (autoColumnIndexes[i] > columnIndex)
                {
                    return true;
                }
            }
        }

        return false;
    },

    _highlightSelectors: function ()
    {
        var selectedCellSelectors = this.isRenderedAsTable ? ">tbody>tr>td.selectedobject, >tbody>tr>td.selected" : ">.editor-cell.selectedobject, >.editor-cell.selected";

        var jqCell = this.jqTableToResize.find(selectedCellSelectors); //View Designer- selectedobject, Form Designer - selected

        if (jqCell.length === 0)
        {
            return;
        }

        var cellInfo = this._getCellInfoFromTableArray(jqCell.attr("id"));

        if (!checkExists(cellInfo))
        {
            //Nothing to highlight
            return;
        }

        cellInfo.colSpan = cellInfo.colSpan === 0 ? 1 : cellInfo.colSpan;

        var colFirstIndex = cellInfo.colIndex;
        var colLastIndex = colFirstIndex + cellInfo.colSpan - 1;
        for (i = colFirstIndex; i <= colLastIndex; i++)
        {
            var jqSelector = $("#columnSelector_" + i);
            jqSelector.addClass("highlighted");
            jqSelector.parent().addClass("highlighted");
        }
    },

    _getCellInfoFromTableArray: function(cellId)
    {
        var i = 0;
        var j = 0;
        var cellInfo = {};
        for (i = 0; i < this.tableArray.length; i++)
        {
            var row = this.tableArray[i];

            for (j = 0; j < row.length; j++)
            {
                var cell = row[j];

                if (cell.id === cellId)
                {
                    cellInfo.colIndex = j;
                    cellInfo.colSpan = cell.colSpan;
                    return cellInfo;
                }
            }
        }

        return null;
    },

    _isIE11: function ()
    {
        if (SourceCode.Forms.Browser.msie && SourceCode.Forms.Browser.version.indexOf("11.0") >= 0)
        {
            return true;

        }

        return false;
    }

    //#endregion Helper methods
};

$.extend(TableColumnResizer.prototype, _TableColumnResizerPrototype);
