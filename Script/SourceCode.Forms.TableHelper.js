(function ($)
{
    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};

    SourceCode.Forms.TableHelper = {

        //#region Constants

        MIN_COLUMN_WIDTH: 40,
        MIN_ROW_HEIGHT: 29, //ideally this would be a measurement of a editor-cell, using a fake measure element.

        //note that these tags are also generated in C# in Table.cs Grid.cs in shared.
        //no "editor-table" on this one, as the table-behavior didn't do this.
        TABLETAG: "<table style='table-layout: fixed;'></table>",

        GRIDTAG: "<div class='editor-table editor-grid'></div>",

        TRTAG: "<tr class='editor-row'></tr>",

        TRBASICTAG: "<tr layouttype='row'></tr>",

        TDTAG: "<td itemtype='Cell' controltype='Cell' friendlyname='' layout='Cell' class='editor-cell can-hover'></td>",

        GRIDCELLTAG: "<span itemtype='Cell' controltype='Cell' friendlyname='' layout='Cell' class='editor-cell can-hover'></span>",

        COLGROUPTAG: "<colgroup class='editor-body-colgroup'></colgroup><tbody></tbody>",

        COLTAG: "<col itemtype='Column' controltype='Column' friendlyname='' layout='Column'>",

        //#endregion Constants

        //#region Public Creation Methods

        //Called from view.designertable.js when generating the main table (details view).
        //the server-side version of this code is in Grid.cs (c#).
        generateGrid: function (rows, cols, cellCreateCallback)
        {
            var jqGrid = this.createGrid();
            var tableId = String.generateGuid();
            jqGrid.attr("id", tableId);

            return this.generateRowsAndCellsForGrid(jqGrid, this.GRIDCELLTAG, rows, cols, cellCreateCallback);
        },

        generateRowsAndCellsForGrid: function (jqGrid, gridCellTag, rows, cols, cellCreateCallback)
        {
            var rowIndex = 0;
            var colIndex = 0;
            var rowId = null;

            for (rowIndex = 0; rowIndex < rows; rowIndex++)
            {
                rowId = String.generateGuid();

                for (colIndex = 0; colIndex < cols; colIndex++)
                {
                    var copiedCellInfo =
                    {
                        rowIndex: rowIndex,
                        colIndex: colIndex
                    };

                    var jqCell = $(gridCellTag);

                    //adds all of the rowspan, grid-row-span, columnspan, -ms-rowspan to the cell.
                    this._copyCellInfoToNewCell(jqGrid, jqCell, copiedCellInfo);

                    var cellId = String.generateGuid();
                    jqCell.attr("id", cellId);

                    if (rowIndex === rows - 1) jqCell.addClass("lastrow");
                    if (colIndex === cols - 1) jqCell.addClass("lastcellinrow");

                    jqGrid.append(jqCell);

                    if (typeof cellCreateCallback === "function") cellCreateCallback(jqCell);
                }
            }

            var options = this._createEmptyOptions();

            var rowHeight = 'auto';
            var strRowHeights = "";
            for (rowIndex = 0; rowIndex < rows; rowIndex++)
            {
                rowId = String.generateGuid();

                strRowHeights += rowHeight + ' ';

                options.rowIds.push(rowId);
                options.rowHeights.push(rowHeight);
            }

            var strColumnWidths = "";
            var colWidth = "1fr"; //896005: Set default column width to AUTO width for new table control
            for (colIndex = 0; colIndex < cols; colIndex++)
            {
                var colId = String.generateGuid();

                strColumnWidths += colWidth + ' ';

                options.columnIds.push(colId);
                options.columnWidths.push(colWidth);
            }

            jqGrid.css("grid-template-rows", strRowHeights);
            jqGrid.css("grid-template-columns", strColumnWidths);

            jqGrid.data("options", options);

            if (this._isIE11())
            {
                jqGrid[0].style["grid-template-rows"] = strRowHeights;
                jqGrid[0].style["grid-template-columns"] = strColumnWidths;
                jqGrid[0].style["-ms-grid-rows"] = strRowHeights;
                jqGrid[0].style["-ms-grid-columns"] = strColumnWidths;
            }

            return jqGrid;
        },


        updateGridCellWithCellInfo: function (jqCell, jqGrid, cellInfo)
        {
            this._copyCellInfoToNewCell(jqGrid, jqCell, cellInfo);
        },

        //moved from TableBehavior
        createTableWithId: function (tableId)
        {
            var _table = $(this.TABLETAG);
            var _colgroup = $(this.COLGROUPTAG);
            _colgroup.appendTo(_table);
            _table.attr("id", tableId);
            return _table;
        },

        //moved from TableBehavior
        createGridWithId: function (tableId)
        {
            var _table = this.createGrid();
            _table.attr("id", tableId);
            return _table;
        },

        //just the element
        createGrid: function ()
        {
            var _table = $(this.GRIDTAG);

            var options = this._createEmptyOptions(_table);

            _table.data("options", options);

            return _table;
        },

        //moved from TableBehavior
        createTableRowTagBasic: function (jqTable)
        {
            return this.isRenderedAsTable(jqTable) ? $(this.TRBASICTAG) : $();
        },

        //moved from TableBehavior
        createTableRowTag: function (jqTable)
        {
            return this.isRenderedAsTable(jqTable) ? $(this.TRTAG) : $();
        },

        //moved from TableBehavior
        addTableRowWithId: function (jqTable, id, rowIndex)
        {
            if (this.isRenderedAsTable(jqTable))
            {
                this.addTableRowWithIdAndTemplate(jqTable, id, rowIndex, "", this.TRTAG);
            }
            else
            {
                this.addTableRowWithIdAndTemplate(jqTable, id, rowIndex, "auto", "");
            }
        },

        //moved from TableBehavior
        addTableRowWithIdAndTemplate: function (jqTable, id, rowIndex, strHeight, template)
        {
            if (this.isRenderedAsTable(jqTable))
            {
                //var _tr = $(template);
                //_tr.attr("id", id);
                //_tr.appendTo(jqTable.children("tbody"));
                this._addNewRowDefinitionAfterForTable(rowIndex, strHeight, jqTable, id, template);
            }
            else
            {
                this._addNewRowDefinitionAfterOnGrid(rowIndex, strHeight, jqTable, id);
            }
        },

        addNewTableColumnAtPosition: function (jqTable, insertIndex, width, colId)
        {
            colId = checkExists(colId) ? colId : new String().generateGuid();

            this._setColumnId(colId, insertIndex, jqTable);
            this._setColumnRenderWidth(width, insertIndex, jqTable);
            this._setColumnConfiguredWidth(width, insertIndex, jqTable);
        },

        //moved out of TableBehavior
        //source is the row to copy cells/rowspans from
        //used by tablebehavior._addRowNormal();
        addNewTableRowAtPosition: function (jqTable, sourceRowCells, insertIndex, rowId, useSourceRowCells, cellCallback)
        {
            var _this = this;
            var jqNewRow;

            rowId = checkExists(rowId) ? rowId : new String().generateGuid();

            if (this.isRenderedAsTable(jqTable))
            {
                var jqRows = jqTable.find('>tbody>tr');
                jqNewRow = this.createTableRowTagBasic(jqTable);
                jqNewRow.attr("id", rowId);

                //insert the row in at the right position
                if (insertIndex < 0)
                {
                    var jqBody = jqTable.find(">tbody");
                    jqNewRow.prependTo(jqBody);
                }
                else
                {
                    var jqPrevRow = jqRows.eq(insertIndex);
                    jqNewRow.insertAfter(jqPrevRow);
                }
            }
            else
            {
                //create the new row from the source row
                jqNewRow = jqTable; //the new row is the grid elemnt as grids don't have row elements.

                this._setRowRenderedHeightOnGrid("auto", insertIndex, jqTable);
                this._setRowConfiguredHeightOnGrid("auto", insertIndex, jqTable);
                this._setRowIdOnGrid(rowId, insertIndex, jqTable);
            }

            //create the new row from the source row
            sourceRowCells.forEach(function (ele)
            {
                var jqSourceCell = $(ele);

                var cellToAdd = null;

                if (useSourceRowCells)
                {
                    cellToAdd = jqSourceCell;
                }
                else
                {
                    cellToAdd = _this.createCell(jqTable);
                    var cellId = new String().generateGuid();
                    cellToAdd.attr("id", cellId);

                    _this._copyAttributesToNewRowCell(jqSourceCell, cellToAdd);
                }

                jqNewRow.append(cellToAdd);

                cellCallback(cellToAdd, jqNewRow);
            });

            return jqNewRow;
        },

        //logic moved from TableBehavior
        createCell: function (jqTable)
        {
            return (this.isRenderedAsTable(jqTable) ? $(this.TDTAG) : $(this.GRIDCELLTAG));
        },

        //logic moved from TableBehavior
        createEmptyCell: function (jqTable, id)
        {
            var jqCell = this.createCell(jqTable);
            jqCell.attr("id", id);
            jqCell.html("&nbsp;");
            return jqCell;
        },

        updateGridCellClasses: function (jqGrid)
        {
            if (this.isRenderedAsTable(jqGrid)) return;

            var _this = this;
            var tableArray = this.getTableArray(jqGrid);
            var maxRowIndex = this.getRowCountInTableArray(jqGrid) - 1;
            var maxColIndex = this.getColumnCountInTableArray(jqGrid) - 1;

            jqGrid.find(">.editor-cell.lastrow").removeClass("lastrow");
            jqGrid.find(">.editor-cell.lastcellinrow").removeClass("lastcellinrow");

            this._eachTableArrayCell(tableArray, function (cellInfo)
            {
                var jqCell = jqGrid.find("#" + cellInfo.id);

                if (cellInfo.rowIndex + (cellInfo.rowSpan - 1) >= maxRowIndex)
                {
                    jqCell.addClass("lastrow");
                }

                if (cellInfo.colIndex + (cellInfo.colSpan - 1) >= maxColIndex)
                {
                    jqCell.addClass("lastcellinrow");
                }
            });

        },

        //moved logic from TableBehavior - when creating a new column. 
        //rowInsertPosition tells us whether to insert a cell into this row or not.
        addCellAtPositionWithRowInsertionData: function (jqTable, cellInfoToCopy, position, rowInsertPosition)
        {
            if (this.isRenderedAsTable(jqTable))
            {
                return this._addCellAtPositionWithRowInsertionDataForTable(jqTable, cellInfoToCopy, null, position, rowInsertPosition);
            }
            else
            {
                return this._addCellAtPositionWithRowInsertionDataOnGrid(jqTable, cellInfoToCopy, null, position, rowInsertPosition);
            }
        },

        //moved logic from TableBehavior - when creating a new column. 
        //colInsertPosition tells us whether to insert a cell into this row or not.
        addCellAtPositionWithColumnInsertionData: function (jqTable, cellInfoToCopy, position, colInsertPosition)
        {
            if (this.isRenderedAsTable(jqTable))
            {
                return this._addCellAtPositionWithColumnInsertionDataForTable(jqTable, cellInfoToCopy, null, position, colInsertPosition);
            }
            else
            {
                return this._addCellAtPositionWithColumnInsertionDataOnGrid(jqTable, cellInfoToCopy, null, position, colInsertPosition);
            }
        },

        // cellInfo: { id: xxx, rowIndex: xxx, colIndex: xxx, colSpan: xxx, rowSpan:xxx };
        createCellWithCellInfoAndTemplate: function (jqTable, cellInfo, template)
        {
            var _td = $(template);


            _td.attr("id", cellInfo.id);

            this._setCellColSpan(jqTable, _td, cellInfo.colIndex + 1, cellInfo.colSpan);
            this._setCellRowSpan(jqTable, _td, cellInfo.rowIndex + 1, cellInfo.rowSpan);

            return _td;
        },

        //moved from TableBehavior
        addCellAtPositionWithIdAndTemplate: function (jqTable, rowIndex, colIndex, id, template)
        {
            var cellInfo =
            {
                id: id,
                rowIndex: rowIndex,
                colIndex: colIndex,
                rowSpan: 1,
                colSpan: 1
            };

            var _td = this.createCellWithCellInfoAndTemplate(jqTable, cellInfo, template);

            if (this.isRenderedAsTable(jqTable))
            {
                var jqRow = jqTable.find(">tbody>tr").eq(rowIndex);
                jqRow.append(_td);
            }
            else
            {
                //Add to directly as child to table(grid)
                jqTable.append(_td);
            }
            return _td;
        },

        //moved from TableBehavior - the server side version of this code is in Table.cs
        setCellTextAlign: function (jqCell, strTextAlign, jqTable)
        {
            var strClass = "";
            var leftClass = "align-left";
            var rightClass = "align-right";
            var centerClass = "align-center";
            switch (strTextAlign.toLowerCase())
            {
                case "left": strClass = leftClass; break;
                case "right": strClass = rightClass; break;
                case "center": strClass = centerClass; break;
            }
            jqCell.removeClass(leftClass + " " + rightClass + " " + centerClass);
            jqCell.addClass(strClass);
        },

        //moved from TableBehavior - the server side version of this code is in Table.cs
        setCellVerticalAlign: function (jqCell, strVerticalAlign, jqTable)
        {
            var strClass = "";
            var topClass = "align-top";
            var bottomClass = "align-bottom";
            var middleClass = "align-middle";
            switch (strVerticalAlign.toLowerCase())
            {
                case "top": strClass = topClass; break;
                case "bottom": strClass = bottomClass; break;
                case "middle": strClass = middleClass; break;
            }
            jqCell.removeClass(topClass + " " + bottomClass + " " + middleClass);
            jqCell.addClass(strClass);
        },

        //#endregion

        //#region Public ObjectModel Methods
        // for saving and beginning on a route to angular view models.

        //returns an array of rowinfo { id: xxxx, height: strxxxx, index: 0 }
        buildRowsObjectModel: function (jqTable)
        {
            return this._buildRowsObjectModel(jqTable);
        },

        //returns an array of column info in the form {id:xxxx, width:xxxxx renderWidth:xxxxxx, index:0}
        buildColumnsObjectModel: function (jqTable)
        {
            return this._buildColumnsObjectModel(jqTable);
        },

        getRowObjectModelByRowIndex: function(rowIndex, jqTable)
        {
            var allRows = this._buildRowsObjectModel(jqTable);

            var rowObjectModel = null;

            for (var i = 0; i < allRows.length; i++)
            {
                if (allRows[i].index === rowIndex)
                {
                    rowObjectModel = allRows[i];
                    break;
                }
            }

            return rowObjectModel;
        },

        //merge the pivot cell (jqCell) with the sibling cell to the right
        mergeRight: function (jqTable, pivotCell, moveCellContentsCallback)
        {
            var cellInfo = this.getCellInfo(pivotCell);
            var tableArray = this.getTableArray(jqTable);
            var siblingInfo = this.getActualCellInfoFromPosition(tableArray, cellInfo.rowIndex, cellInfo.colIndex + cellInfo.colSpan);
            var cellToMergeWith = this.getCellFromCellInfo(siblingInfo);

            if (cellToMergeWith.length === 0)
            {
                return false;
            }

            if (typeof moveCellContentsCallback === "function")
            {
                moveCellContentsCallback(cellToMergeWith, pivotCell, "after");
            }

            var newspan = cellInfo.colSpan + siblingInfo.colSpan;

            this.setCellColSpan(cellInfo, newspan);
            cellToMergeWith.remove();

            this.updateTableArray(jqTable);

            return siblingInfo;
        },

        //merge the pivot cell (jqCell) with the bottom of cell
        mergeBottom: function (jqTable, pivotCell, moveCellContentsCallback)
        {
            var cellInfo = this.getCellInfo(pivotCell);
            var tableArray = this.getTableArray(jqTable);
            var siblingInfo = this.getActualCellInfoFromPosition(tableArray, cellInfo.rowIndex + cellInfo.rowSpan, cellInfo.colIndex);
            var cellToMergeWith = this.getCellFromCellInfo(siblingInfo);

            if (cellToMergeWith.length === 0)
            {
                return false;
            }

            if (typeof moveCellContentsCallback === "function")
            {
                moveCellContentsCallback(cellToMergeWith, pivotCell, "after");
            }

            var newspan = cellInfo.rowSpan + siblingInfo.rowSpan;
            this.setCellRowSpan(cellInfo, newspan);
            cellToMergeWith.remove();

            this.updateTableArray(jqTable);

            return siblingInfo;
        },

        //merge the pivot cell (jqCell) with the sibling cell to the left
        mergeLeft: function (jqTable, pivotCell, moveCellContentsCallback)
        {
            var cellInfo = this.getCellInfo(pivotCell);
            var tableArray = this.getTableArray(jqTable);
            var siblingInfo = this.getActualCellInfoFromPosition(tableArray, cellInfo.rowIndex, cellInfo.colIndex - 1);
            var cellToMergeWith = this.getCellFromCellInfo(siblingInfo);

            if (cellToMergeWith.length === 0)
            {
                return false;
            }

            if (typeof moveCellContentsCallback === "function")
            {
                moveCellContentsCallback(cellToMergeWith, pivotCell, "before");
            }

            cellInfo.colSpan = cellInfo.colSpan + siblingInfo.colSpan;
            cellInfo.colIndex = cellInfo.colIndex - siblingInfo.colSpan;
            cellInfo.col = cellInfo.colIndex + 1;
            this.setCellInfo(cellInfo);

            cellToMergeWith.remove();

            this.updateTableArray(jqTable);

            return siblingInfo;
        },

        //merge the pivot cell (jqCell) with the top cell
        mergeTop: function (jqTable, pivotCell, moveCellContentsCallback)
        {
            var cellInfo = this.getCellInfo(pivotCell);
            var tableArray = this.getTableArray(jqTable);
            var siblingInfo = this.getActualCellInfoFromPosition(tableArray, cellInfo.rowIndex - 1, cellInfo.colIndex);
            var cellToMergeWith = this.getCellFromCellInfo(siblingInfo);

            if (cellToMergeWith.length === 0)
            {
                return false;
            }

            if (typeof moveCellContentsCallback === "function")
            {
                moveCellContentsCallback(cellToMergeWith, pivotCell, "before");
            }

            cellInfo.rowSpan = cellInfo.rowSpan + siblingInfo.rowSpan;
            cellInfo.rowIndex = cellInfo.rowIndex - siblingInfo.rowSpan;
            cellInfo.row = cellInfo.rowIndex + 1;
            this.setCellInfo(cellInfo);

            cellToMergeWith.remove();

            this.updateTableArray(jqTable);

            return siblingInfo;
        },

        //#endregion

        //#region Public Column Helper Methods

        //returns arrays of which columns/rows were removed.
        removeUnNeededColsAndRows: function (jqTable)
        {
            var colsRemoved = this.removeUnNeededCols(jqTable);
            var rowsRemoved = this.removeUnNeededRows(jqTable);

            return {
                columns: colsRemoved,
                rows: rowsRemoved,
                cells : []
            };
        },

        //this method needs to work on a table array of the table prior to the merge/colremovals
        removeUnNeededCols: function (jqTable)
        {
            var tableArray = SourceCode.Forms.TableHelper.getTableArray(jqTable);
            var mergeDistances = this._getColumnMergeDistances(tableArray, jqTable);

            this._mergeColumnWidthsUsingMergeDistances(jqTable, mergeDistances);
            this._fixColSpansBeforeRemovingCols(tableArray, mergeDistances, jqTable);
            var removedCols = this._removeCols(jqTable, mergeDistances);

            if (removedCols.length > 0)
            {
                tableArray = this.updateTableArray(jqTable);
            }

            this._preserveColumnWidthForColumnsWithOnlyColSpanCells(tableArray, jqTable);

            return removedCols;
        },

        //this method needs to work on a table array of the table prior to the merge/rowremovals
        removeUnNeededRows: function (jqTable, preOperationTableArray)
        {
            var tableArray = SourceCode.Forms.TableHelper.getTableArray(jqTable);
            if (!checkExists(preOperationTableArray)) preOperationTableArray = tableArray;
            var mergeDistances = this._getRowMergeDistances(tableArray, jqTable);

            this._mergeRowHeightsUsingMergeDistances(jqTable, mergeDistances);
            this._fixRowSpansBeforeRemovingRows(preOperationTableArray, mergeDistances, jqTable);
            var removedRows = this._removeRows(jqTable, mergeDistances);

            if (removedRows.length > 0)
            {
                tableArray = this.updateTableArray(jqTable);
            }

            this._preserveRowHeightForRowsWithOnlyRowSpanCells(tableArray, jqTable);

            //console.log(colMergeDistances);
            return removedRows;
        },

        getRowCount: function (jqTable)
        {
            if (this.isRenderedAsTable(jqTable))
            {
                return this._getRowCountForTable(jqTable);
            }

            return this._getRowCountForGrid(jqTable);
        },

        //used by TableHelper generateTableArray
        getRowCountInTableArray: function (jqTable)
        {
            var tableArray = SourceCode.Forms.TableHelper.getTableArray(jqTable);
            return this._getRowCountInTableArray(tableArray);
        },

        getColumnCount: function (jqTable)
        {
            if (this.isRenderedAsTable(jqTable))
            {
                return this._getColumnCountForTable(jqTable);
            }

            return this._getColumnCountForGrid(jqTable);
        },

        //used by TableHelper generateTableArray
        getColumnCountInTableArray: function (jqTable)
        {
            var tableArray = SourceCode.Forms.TableHelper._getTableArray(jqTable);
            return this._getColCountInTableArray(tableArray);
        },

        //used by TableHelper generateTableArray
        getCellsInRowIndex: function (jqTable, rowIndex, gridCellPositionInfo)
        {
            return this._getCellsInRowIndex(jqTable, rowIndex, gridCellPositionInfo);
        },

        //used by TableHelper generateTableArray
        getCellsInColIndex: function (jqTable, colIndex)
        {
            return this._getCellsInColIndex(jqTable, colIndex);
        },

        getSplitRowHeight: function (strRowHeight)
        {
            return this._getSplitRowHeight(strRowHeight);
        },

        getSplitColumnWidth: function (strColumnWidth)
        {
            return this._getSplitColumnWidth(strColumnWidth);
        },

        mergeColumnWidths: function (masterColIndex, slaveColIndex, jqTable)
        {
            return this._mergeColumnWidths(masterColIndex, slaveColIndex, jqTable);
        },

        //returns an array of cellInfo for the cells that will be completely removed as
        //they land within the col- range being deleted
        previewRemoveRowRange: function (rowLineStart, rowLineEnd, jqTable)
        {
            var tableArray = this.getTableArray(jqTable);
            var cellsToDelete = [];

            this._eachTableArrayCell(tableArray, function (cellInfo)
            {
                var thisRowLineStart = cellInfo.rowIndex;
                var thisRowLineEnd = cellInfo.rowIndex + cellInfo.rowSpan;

                //is cell within the bounds of the rows being deleted?
                if (thisRowLineStart >= rowLineStart && thisRowLineEnd <= rowLineEnd)
                {
                    cellsToDelete.push(cellInfo);
                }
            });

            return cellsToDelete;
        },

        //returns an array of cellInfo for the cells that will be completely removed as
        //they land within the col- range being deleted
        previewRemoveColumnRange: function (colLineStart, colLineEnd, jqTable)
        {
            var tableArray = this.getTableArray(jqTable);
            var cellsToDelete = [];

            this._eachTableArrayCell(tableArray, function (cellInfo)
            {
                var thisColLineStart = cellInfo.colIndex;
                var thisColLineEnd = cellInfo.colIndex + cellInfo.colSpan;

                //is cell within the bounds of the columns being deleted?
                if (thisColLineStart >= colLineStart && thisColLineEnd <= colLineEnd)
                {
                    cellsToDelete.push(cellInfo);
                }
            });

            return cellsToDelete;
        },

        //returns {cells: array[cellInfo], columns: array[colObjectModel]}
        //where cells is an array of cellinfo of the cells removed.
        //where rows is an array of rowObjectModel of the rows removed.
        //removes the cells AND sorts out the rowspans for any cell that was entering or after the rows being removed.
        removeRowRange: function (rowLineStart, rowLineEnd, jqTable, cellRemoveCallback, rowRemoveCallback)
        {
            var i = 0;
            var tableArray = this.getTableArray(jqTable);
            var rowsToDelete = (rowLineEnd - rowLineStart);
            var cellCallback = typeof cellRemoveCallback === "function" ? cellRemoveCallback : function () { };
            var rowCallback = typeof rowRemoveCallback === "function" ? rowRemoveCallback : function () { };
            var cellsToDelete = this.previewRemoveRowRange(rowLineStart, rowLineEnd, jqTable);

            //update position information on cells (grid start/end/colspans)
            this._updateCellsAfterRowIndex(rowLineStart, rowsToDelete * -1, jqTable);

            //delete cells
            for (i = 0; i < cellsToDelete.length; i++)
            {
                var cellInfo = cellsToDelete[i];
                var jqCell = this._getCellFromCellInfo(cellInfo);
                cellCallback(jqCell);
                jqCell.remove();
            }

            //delete row definitions, and add the removed height to the row after the deleted row range
            //(or row before if there isn't one after)
            var rowObjects = this._buildRowsObjectModel(jqTable);
            var removedRowObjects = [];
            var totalRemovedHeight = null;
            var tableHeight = jqTable.height();
            for (i = rowLineStart; i < rowLineEnd; i++)
            {
                removedRowObjects.push(rowObjects[i]);
                var heightBeingRemoved = rowObjects[i].height;
                totalRemovedHeight = totalRemovedHeight ? this._mergeTwoDimensions(totalRemovedHeight, heightBeingRemoved, jqTable, tableHeight) : heightBeingRemoved;
                rowCallback(rowObjects[i]);
                this._removeRowDefinition(jqTable, rowLineStart); //perhaps additional callbacks can be passed into removeRowDefinition if its a <TABLE>.
            }
            var remainingRows = rowObjects.length - rowsToDelete;

            //Deleting the last row should use the previous row's rowIndex.
            var rowIndexToUpdate = (remainingRows - 1 >= rowLineStart) ? rowLineStart : rowLineStart - 1;

            var existingHeight = this._getConfiguredRowHeight(jqTable, rowIndexToUpdate);
            var strHeight = this._mergeTwoDimensions(existingHeight, totalRemovedHeight, jqTable, tableHeight);
            this._setRowConfiguredHeight(strHeight, rowIndexToUpdate, jqTable);
            this._setRowRenderedHeight(strHeight, rowIndexToUpdate, jqTable);

            return {
                id: jqTable.attr("id"),
                cells: cellsToDelete,
                columns: [],
                rows: removedRowObjects
            };
        },

        //returns {cells: array[cellInfo], columns: array[colObjectModel]}
        //where cells is an array of cellinfo of the cells removed.
        //where columns is an array of columnObjectModel of the columns removed.
        //removes the cells AND sorts out the colspans for any cell that was entering or after the cols being removed.
        removeColumnRange: function (colLineStart, colLineEnd, jqTable, cellRemoveCallback)
        {
            var i = 0;
            var tableArray = this.getTableArray(jqTable);
            
            var columnsToDelete = (colLineEnd - colLineStart);
            var cellCallback = typeof cellRemoveCallback === "function" ? cellRemoveCallback : function () { };
            var cellsToDelete = this.previewRemoveColumnRange(colLineStart, colLineEnd, jqTable);

            //update position information on cells (grid start/end/colspans)
            this._updateCellsAfterColumnIndex(colLineStart, columnsToDelete  * -1, jqTable);

            //delete cells
            for (i = 0; i < cellsToDelete.length; i++)
            {
                var cellInfo = cellsToDelete[i];
                var jqCell = this._getCellFromCellInfo(cellInfo);
                cellCallback(jqCell);
                jqCell.remove();
            }

            //delete column definitions and add the removed width to the row after the deleted column range
            //(or column before if there isn't one after)
            var columnObjects = this._buildColumnsObjectModel(jqTable);
            var removedColumnObjects = [];
            var totalRemovedWidth = null;
            var tableWidth = jqTable.width();
            for (i = colLineStart; i < colLineEnd; i++)
            {
                removedColumnObjects.push(columnObjects[i]);
                var widthBeingRemoved = columnObjects[i].width;
                totalRemovedWidth = totalRemovedWidth ? this._mergeTwoDimensions(totalRemovedWidth, widthBeingRemoved, jqTable, tableWidth) : widthBeingRemoved;
                this._removeColumnDefinition(jqTable, colLineStart);
            }
            var remainingColumns = columnObjects.length - columnsToDelete;

            //Deleting the last column should use the previous column's colIndex.
            var columnIndexToUpdate = (remainingColumns - 1 >= colLineStart) ? colLineStart : colLineStart - 1;
            var existingWidth = this._getConfiguredColumnWidth(jqTable, columnIndexToUpdate);
            var strWidth = this._mergeTwoDimensions(existingWidth, totalRemovedWidth, jqTable, tableWidth);
            this._setColumnConfiguredWidth(strWidth, columnIndexToUpdate, jqTable);
            this._setColumnRenderWidth(strWidth, columnIndexToUpdate, jqTable);

            return {
                id: jqTable.attr("id"),
                cells: cellsToDelete,
                columns: removedColumnObjects,
                rows: []
            };
        },

        //#endregion

        //#region Public methods

        //---------------------------------------------------------------------------------------
        // Table Array Implementation
        // NOTE: Merge,Add/Remove of a column,row, and unmerging of cells is done according to
        //       how Microsoft Word 2010 does it for its table

        // Initializes a new 2d array with either a custom struct or the value "empty".
        // "empty" is placed within the array to assist with visualizing the table
        /*
        custom struct
        {
        rowSpan:number,
        colSpan:number,
        id:string,
        ref:string
        }
        */
        generateTableArray: function (table)
        {
            return this._generateTableArray(table);
        },

        // The logic in this function is the same as the logic on the server-side function GenerateTableArrayForGridLayout() 
        // that read a table layout xml node and generate the table array from it.
        generateTableArrayFromXmlDefinition: function (tableLayoutNode)
        {
            var tableArray = [];
            var rowIndex = 0;
            var colIndex = 0;
            var totalColSpans = 1;
            var cellInfo = null;

            var tableId = tableLayoutNode.getAttribute("ID");

            $.each(tableLayoutNode.selectNodes('Rows/Row'), function ()
            {
                var rowId = $(this).attr("ID");

                var colIndex = 0;

                $.each(this.selectNodes('Cells/Cell'), function ()
                {
                    var cellId = $(this).attr("ID");

                    var rowSpan = +this.getAttribute('RowSpan');    //rowSpan is 0 if no row span for the row.
                    var colSpan = +this.getAttribute('ColumnSpan'); //colSpan is 0 if no cell span for the cell.

                    rowSpan = Math.max(1, rowSpan);
                    colSpan = Math.max(1, colSpan);

                    totalColSpans = Math.max(totalColSpans, colIndex + colSpan);

                    //find the next empty spot in this row for this cell.
                    colIndex = SourceCode.Forms.TableHelper.findNextEmptyCellIndexInRow(tableArray[rowIndex], colIndex, totalColSpans);

                    while (colIndex === -1)
                    {
                        //If an empty cell is not found for the row, look for the next row that contain an empty cell.
                        rowIndex++;

                        colIndex = SourceCode.Forms.TableHelper.findNextEmptyCellIndexInRow(tableArray[rowIndex], 0, totalColSpans);
                    }

                    //fill out the refs for this cell
                    if (colSpan > 1 || rowSpan > 1)
                    {
                        for (var y = 0; y < rowSpan; y++)
                        {
                            for (var x = 0; x < colSpan; x++)
                            {
                                if (!checkExists(tableArray[rowIndex + y]))
                                {
                                    tableArray[rowIndex + y] = [];
                                }

                                tableArray[rowIndex + y][colIndex + x] =
                                {
                                    ref: cellId,
                                    isRef: true,
                                    rowIndex: rowIndex + y,
                                    colIndex: colIndex + x,
                                    row: rowIndex + y + 1,
                                    col: colIndex + x + 1,
                                    rowSpan: rowSpan - y,
                                    colSpan: colSpan - x
                                };
                            }
                        }
                    }

                    if (!checkExists(tableArray[rowIndex]))
                    {
                        tableArray[rowIndex] = [];
                    }

                    //this must come after the colspan/rowspan refs have been set.
                    tableArray[rowIndex][colIndex] =
                    {
                        id: cellId,
                        rowIndex: rowIndex,
                        colIndex: colIndex,
                        row: rowIndex + 1,
                        col: colIndex + 1,
                        rowSpan: rowSpan,
                        colSpan: colSpan
                    };

                    colIndex += colSpan;
                });
                rowIndex++;
            });

            return tableArray;
        },

        getTableArray: function (jqTable)
        {
            return this._getTableArray(jqTable);
        },

        updateTableArray: function (jqTable, tableArray)
        {
            var id = jqTable.attr("id");
            if (!checkExists(this._designTableArrays)) this._designTableArrays = [];

            if (checkExists(tableArray))
            {
                this._designTableArrays[id] = this._updateTableArray(jqTable, tableArray);
            }
            else
            {
                this._designTableArrays[id] = this._generateTableArray(jqTable);
            }

            return this._designTableArrays[id];
        },

        clearAllTableArrays: function ()
        {
            this._designTableArrays = [];
        },

        // Returns the index in the array that corresponds to the one in the HTML table
        // ----------------------------------------------------------------------------
        // tableArray: the array representation of the html table
        // cell: the html cell
        getTableArrayColumnIndex: function (tableArray, cell)
        {
            if (cell.length === 0 || cell.parent().length === 0)
            {
                return -1;
            }

            var cellId = cell.attr("id");

            var rowIndex = this._getRowIndexFromCell(tableArray, cell);
            for (var i = 0; i < tableArray[rowIndex].length; i++)
            {
                var arrayCell = tableArray[rowIndex][i];
                if (arrayCell.id !== undefined && arrayCell.id === cellId)
                {
                    return i;
                }
            }
            return -1;
        },

        isTableArrayAtPositionOccupied: function (tableArray, rowIndex, colIndex)
        {
            return (checkExists(tableArray[rowIndex]) && checkExists(tableArray[rowIndex][colIndex]));
        },

        findNextEmptyCellIndexInRow: function (rowArray, fromIndex, totalColSpans)
        {
            var foundIndex = -1;
            if (!checkExists(rowArray) || rowArray.length === 0)
            {
                return fromIndex;
            }

            for (var findColIndex = fromIndex; findColIndex < totalColSpans; findColIndex++)
            {
                var cellInfo = rowArray[findColIndex];
                if (!checkExists(cellInfo))
                {
                    foundIndex = findColIndex;
                    break;
                }
            }
            return foundIndex;
        },

        /// <summary>
        /// Check if a tableArray has missing cells.
        /// A table is consider to be dirty when a table was savied with missing/extra columns definition, missing cells etc. 
        /// </summary>
        /// <param name="tableArray">tableArray</param>
        /// <param name="tableLayoutNode">table layout xml definition</param>
        /// <returns>true/false</returns>        
        tableArrayIsDirty: function (tableArray, tableLayoutNode)
        {
            var result = false;

            var totalDefinitionColumns = tableLayoutNode.selectNodes('Columns/Column').length;
            var totalDefinitionRows = tableLayoutNode.selectNodes('Rows/Row').length;

            for (var rowIndex = 0; rowIndex < totalDefinitionRows; rowIndex++)
            {
                for (var colIndex = 0; colIndex < totalDefinitionColumns; colIndex++)
                {
                    var notOccupied = !this.isTableArrayAtPositionOccupied(tableArray, rowIndex, colIndex);

                    //if the cell is not occupied (i.e. it is null) then there is dirty data.
                    if (notOccupied)
                    {
                        return true;
                    }
                }
            }

            var columnCount = this._getColCountInTableArray(tableArray);

            result = totalDefinitionColumns === columnCount ? false : true;

            return result;
        },

        /// <summary>
        /// A table is consider to be dirty when a table was savied with missing/extra columns definition, missing cells etc. 
        /// This function will attmpt to fix dirty data issues by making the tableArray and tableLayoutNode well formed.
        /// </summary>
        /// <param name="tableArray">tableArray</param>
        /// <param name="tableLayoutNode">table layout xml definition</param>
        cleanDirtyDataInGridLayout: function (tableArray, tableLayoutNode)
        {
            //Check for missing cells
            //Check for additional columns

            var maxNoOfColumnsByCells = this._getColCountInTableArray(tableArray);
            var rowNodes = tableLayoutNode.selectNodes('Rows/Row');
            var columnNodes = tableLayoutNode.selectNodes('Columns/Column');
            var totalDefinitionRows = rowNodes.length;
            var totalDefinitionColumns = columnNodes.length;
            var canbeRemovedRows = new Array(totalDefinitionRows);
            var canbeRemovedColumns = new Array(totalDefinitionColumns);
            var newCellsToAdd = [];
            var maxColumns = totalDefinitionColumns > maxNoOfColumnsByCells ? totalDefinitionColumns : maxNoOfColumnsByCells;
            var i = 0;

            // build newCellsToAdd[], canbeRemovedRows[] and canbeRemovedColumns[] metadata
            for (var rowIndex = 0; rowIndex < totalDefinitionRows; rowIndex++)
            {
                for (var colIndex = 0; colIndex < maxColumns; colIndex++)
                {
                    //Initialize the array if it hasn't initialized yet
                    if (!checkExists(canbeRemovedRows[rowIndex]))
                    {
                        canbeRemovedRows[rowIndex] = true;
                    }

                    //Initialize the array if it hasn't initialized yet
                    if (!checkExists(canbeRemovedColumns[colIndex]))
                    {
                        canbeRemovedColumns[colIndex] = true;
                    }

                    var notOccupied = !this.isTableArrayAtPositionOccupied(tableArray, rowIndex, colIndex);

                    //if the cell is not occupied (i.e. it is null) then there is dirty data.
                    if (notOccupied)
                    {
                        var cellInfo = {
                            id: String.generateGuid(),
                            rowIndex: rowIndex,
                            colIndex: colIndex,
                            row: rowIndex + 1,
                            col: colIndex + 1,
                            rowSpan: 1,
                            colSpan: 1
                        };
                        newCellsToAdd.push(cellInfo);
                    }

                    //If all the cells in a row are not occupied then this row can be removed
                    canbeRemovedRows[rowIndex] = canbeRemovedRows[rowIndex] && notOccupied;

                    //If all the cells in a column are not occupied then this column can be removed
                    canbeRemovedColumns[colIndex] = canbeRemovedColumns[colIndex] && notOccupied;
                }
            }

            //remove superlfuous rows
            for (rowIndex = 0; rowIndex < canbeRemovedRows.length; rowIndex++)
            {
                if (canbeRemovedRows[rowIndex])
                {
                    //remove the node from definition
                    rowNodes[rowIndex].parentNode.removeChild(rowNodes[rowIndex]);

                    delete tableArray[rowIndex];
                }
            }

            //remove superflous columns
            for (colIndex = 0; colIndex < canbeRemovedColumns.length; colIndex++)
            {
                if (canbeRemovedRows[colIndex])
                {
                    //remove the node from definition
                    columnNodes[colIndex].parentNode.removeChild(columnNodes[colIndex]);

                    for (rowIndex = 0; rowIndex < tableArray.length; rowIndex++)
                    {
                        delete tableArray[rowIndex][colIndex];
                    }
                }
            }

            tableArray = this.addMissingCellsToGridLayout(tableArray, tableLayoutNode, newCellsToAdd, canbeRemovedColumns, canbeRemovedRows);

            tableArray = this.addMissingColumnsToGridLayout(tableArray, tableLayoutNode);

            return tableArray;
        },

        addMissingCellsToGridLayout: function (tableArray, tableLayoutNode, newCellsToAdd, canbeRemovedColumns, canbeRemovedRows)
        {
            var i = 0;
            var newCellInfo = null;
            var inAColumnThatWasRemoved = null;
            var inARowThatWasRemoved = null;
            var rowNode = null;
            var cellsNode = null;
            var cellNodes = null;
            var newCellNode = null;
            var insertPosition = 0;
            var xmlDoc = tableLayoutNode.ownerDocument;
            var rowNodes = tableLayoutNode.selectNodes('Rows/Row');

            //Add cells into cell gaps
            for (i = 0; i < newCellsToAdd.length; i++)
            {
                newCellInfo = newCellsToAdd[i];
                inAColumnThatWasRemoved = canbeRemovedColumns[newCellInfo.colIndex] === true;
                inARowThatWasRemoved = canbeRemovedRows[newCellInfo.rowIndex] === true;

                if (!inAColumnThatWasRemoved && !inARowThatWasRemoved)
                {
                    //#region Insert empty Cell node to definition
                    rowNode = rowNodes[newCellInfo.rowIndex];
                    newCellNode = xmlDoc.createElement("Cell");
                    newCellNode.setAttribute("ID", newCellInfo.id);

                    insertPosition = this.getCellInsertLocationInRow(tableArray, newCellInfo.rowIndex, newCellInfo.colIndex);

                    cellsNode = rowNode.selectSingleNode("Cells");
                    if (!checkExists(cellsNode))
                    {
                        cellsNode = xmlDoc.createElement("Cells");
                        rowNode.append(cellsNode);
                    }

                    cellNodes = rowNode.selectNodes("Cells/Cell");
                    if (checkExists(cellNodes) && cellNodes.length > insertPosition)
                    {
                        var siblingNode = cellNodes[insertPosition].nextSibling;
                        if (checkExists(siblingNode))
                        {
                            cellsNode.insertBefore(newCellNode, siblingNode);
                        }
                        else
                        {
                            cellsNode.appendChild(newCellNode);
                        }
                    }
                    else
                    {
                        cellsNode.appendChild(newCellNode);
                    }
                    //#endregion Insert empty Cell node to definition

                    tableArray[newCellInfo.rowIndex][newCellInfo.colIndex] = newCellInfo;
                }
            }

            return tableArray;
        },

        addMissingColumnsToGridLayout: function (tableArray, tableLayoutNode)
        {
            var i = 0;
            var xmlDoc = tableLayoutNode.ownerDocument;
            var columnsNode = tableLayoutNode.selectSingleNode('Columns');
            var columnNodes = tableLayoutNode.selectNodes('Columns/Column');
            var newColumnNode = null;
            var numberOfColumnsToAdd = 0;
            var columnCount = this._getColCountInTableArray(tableArray);

            if (columnNodes.length < columnCount)
            {
                if (!checkExists(columnsNode))
                {
                    columnsNode = xmlDoc.createElement("Columns");
                    tableLayoutNode.appendChild(columnsNode);
                }

                numberOfColumnsToAdd = columnCount - columnNodes.length;
                for (i = 0; i < numberOfColumnsToAdd; i++)
                {
                    newColumnNode = xmlDoc.createElement("Column");
                    newColumnNode.setAttribute("ID", String.generateGuid());
                    newColumnNode.setAttribute("Size", "");

                    columnsNode.appendChild(newColumnNode);
                }
            }

            return tableArray;
        },

        getCellInsertLocationInRow: function (tableArray, rowIndex, colIndex)
        {
            var position = 0;
            if (checkExists(tableArray[rowIndex]))
            {
                for (var i = 0; i <= colIndex; i++)
                {
                    var cellInfo = tableArray[rowIndex][i];
                    if (checkExists(cellInfo))
                    {
                        position++;
                    }
                }
            }

            return position;
        },

        canMergeUp: function (tableArray, jqCell)
        {
            //for now disable merging in this direction for table rendered tables
            if (this.isRenderedAsTable(this.getTableFromCell(jqCell)))
            {
                return false;
            }

            if (jqCell.length === 0 || jqCell.parent().length === 0)
            {
                return false;
            }
            
            var result = false;
            var cellInfo = this.getCellInfo(jqCell);

            var cellToMergeWithInfo = this.getActualCellInfoFromPosition(tableArray, cellInfo.rowIndex - 1, cellInfo.colIndex);
            if (cellToMergeWithInfo)
            {
                result = (cellToMergeWithInfo.colIndex === cellInfo.colIndex && cellToMergeWithInfo.colSpan === cellInfo.colSpan);
            }

            return result;
        },

        canMergeDown: function (tableArray, jqCell)
        {
            if (jqCell.length === 0 || jqCell.parent().length === 0) return false;

            var result = false;
            var cellInfo = this.getCellInfo(jqCell);

            var cellToMergeWithInfo = this.getActualCellInfoFromPosition(tableArray, cellInfo.rowIndex + cellInfo.rowSpan, cellInfo.colIndex);
            if (cellToMergeWithInfo)
            {
                result = (cellToMergeWithInfo.colIndex === cellInfo.colIndex && cellToMergeWithInfo.colSpan === cellInfo.colSpan);
            }

            return result;
        },

        canMergeLeft: function (tableArray, jqCell)
        {
            //for now disable merging in this direction for table rendered tables
            if (this.isRenderedAsTable(this.getTableFromCell(jqCell)))
            {
                return false;
            }

            if (jqCell.length === 0 || jqCell.parent().length === 0)
            {
                return false;
            }
            
            var result = false;
            var cellInfo = this.getCellInfo(jqCell);

            var cellToMergeWithInfo = this.getActualCellInfoFromPosition(tableArray, cellInfo.rowIndex, cellInfo.colIndex - 1);
            if (cellToMergeWithInfo)
            {
                result = (cellToMergeWithInfo.rowIndex === cellInfo.rowIndex && cellToMergeWithInfo.rowSpan === cellInfo.rowSpan);
            }

            return result;
        },

        canMergeRight: function (tableArray, jqCell)
        {
            if (jqCell.length === 0 || jqCell.parent().length === 0) return false;

            var result = false;
            var cellInfo = this.getCellInfo(jqCell);

            var cellToMergeWithInfo = this.getActualCellInfoFromPosition(tableArray, cellInfo.rowIndex, cellInfo.colIndex + cellInfo.colSpan);
            if (cellToMergeWithInfo)
            {
                result = (cellToMergeWithInfo.rowIndex === cellInfo.rowIndex && cellToMergeWithInfo.rowSpan === cellInfo.rowSpan);
            }

            return result;
        },


        // Returns true if a merge opertion in the specified direction can occur
        // ---------------------------------------------------------------------
        // tableArray: the array representation of the html table
        // cellToMergeFrom: the html cell from which the operation must occur
        // direction: the direction of the merge, either "right" or "down"
        canMerge: function (tableArray, jqCell, direction)
        {
            switch (direction)
            {
                case 'right':
                    return this.canMergeRight(tableArray, jqCell);
                case 'left':
                    return this.canMergeLeft(tableArray, jqCell);
                case 'down':
                    return this.canMergeDown(tableArray, jqCell);
                case 'up':
                    return this.canMergeUp(tableArray, jqCell);
            }
        },

        // Calculates where new cells must be added to form a new column.
        // --------------------------------------------------------------
        // table: html table
        // tableArray: the array representation of the html table
        // pivotCell: the pivot cell from which to calculate the new column
        // position: either before or after
        insertColumn: function (jqTable, pivotCell, position, cellCreateCallback, addColumnResizerCallback)
        {
            var tableArray = this.getTableArray(jqTable);
            var cellInfo = this.getCellInfo(pivotCell);
            var colIndex = cellInfo.colIndex;

            //get which rows to insert new cells into to make the new column
            var insertIndexes = this._insertColumn(tableArray, pivotCell, position);

            //column insert position
            var colIndexToInsert = position === 'before' ? colIndex : colIndex + cellInfo.colSpan;
            var colIndexToSplit = colIndex;

            if (typeof addColumnResizerCallback === "function") addColumnResizerCallback(jqTable, colIndexToInsert, colIndexToSplit);

            //insert a new colummn definition into DOM
            var columnInfo = this.insertColumnAtPosition(jqTable, colIndexToInsert, colIndexToSplit);

            //get number of rows (agnostic of table/grid rendering)
            var rowCount = this.getRowCountInTableArray(jqTable);

            var rowIndex = 0;
            while (rowIndex < rowCount)
            {
                var rowInsertPosition = insertIndexes[rowIndex];

                //Get info from the selected row's cell to copy into the new row
                var cellInfoFrom = this.getActualCellInfoFromPosition(tableArray, rowIndex, colIndex);

                if (rowInsertPosition > -1)
                {
                    var cellFrom = this.getCellFromCellInfo(cellInfoFrom);
                    var newCellInfo = {
                        rowIndex: rowIndex,
                        colIndex: colIndexToInsert,
                        row: rowIndex + 1,
                        col: colIndexToInsert + 1,
                        rowSpan: cellInfoFrom.rowSpan,
                        colSpan: 1 //we're inserting a col, so we can't copy this.
                    };

                    var newCell = this.addCellAtPositionWithRowInsertionData(jqTable, newCellInfo, position, rowInsertPosition);

                    if (typeof cellCreateCallback === "function") cellCreateCallback(cellInfoFrom, cellFrom, newCell);
                }
                rowIndex += cellInfoFrom.rowSpan;
            }

            tableArray = this.updateTableArray(jqTable);

            this._preserveColumnWidthForColumnsWithOnlyColSpanCells(tableArray, jqTable);

            this.updateGridCellClasses(jqTable);

            return columnInfo;
        },

        //Inserts a new column definition after/before the colIndex. Only the definition, no new cells etc.
        insertColumnAtPosition: function (jqTable, colIndexToInsert, colIndexToSplit)
        {
            //Split the widths
            var maxCols = this.getColumnCountInTableArray(jqTable);
            var columnIndexToSplit = Math.min(colIndexToSplit, maxCols - 1);
            var columnWidth = this.getConfiguredColumnWidth(jqTable, columnIndexToSplit);
            var newWidth = this.getSplitColumnWidth(columnWidth);

            this.setColumnWidth(newWidth, columnIndexToSplit, jqTable);

            var colInfo = null;
            //add the new column definition
            colInfo = this.addNewColumnDefinitionAt(colIndexToInsert, newWidth, jqTable);
            return colInfo;
        },

        removeColumn: function (tableArray, selectedCell)
        {
            return this._removeColumn(tableArray, selectedCell);
        },

        //needed by tablebehavior
        getRowAtIndex: function (jqTable, rowIndex)
        {
            if (this.isRenderedAsTable(jqTable))
            {
                return jqTable.find(">tbody>tr").eq(rowIndex);
            }
            else
            {
                return $(); //return empty element, as grids don't have row elements.
            }
        },

        getAllCells: function (jqTable)
        {
            return (this.isRenderedAsTable(jqTable)) ? jqTable.find(">tbody>tr>td.editor-cell") : jqTable.find(">.editor-cell");
        },

        getCellsForColumn: function (tableArray, columnIndex, returnCell)
        {
            var cells = [];
            for (var i = 0; i < tableArray.length; i++)
            {
                var cell = tableArray[i][columnIndex];
                if (returnCell !== undefined && returnCell)
                {
                    cells.push(cell);
                }
                else
                {
                    if (cell.id !== undefined)
                    {
                        cells.push(cell.id);
                    }
                    else if (cell.ref !== undefined)
                    {
                        cells.push(cell.ref);
                    }
                }
            }
            return cells;
        },


        //used by tablebehavior (moved from there)
        reduceRowWithoutReferences: function (tableArray, rowIndex)
        {
            return this._reduceRowWithoutReferences(tableArray, rowIndex);
        },

        // helper function to reduce a row to represent the html table
        reduceRowWithReferences: function (tableArray, rowIndex, returnCell)
        {
            return this._reduceRowWithReferences(tableArray, rowIndex, returnCell);
        },

        //returns a dto containing the id, row, col, colspan, rowspan of the cell
        //rowindex/colindex is zero based. Row/Col (without the word index) is the raw value.
        getCellInfo: function (jqCell)
        {
            var jqTable = this.getTableFromCell(jqCell);
            var tableArray = this.getTableArray(jqTable);

            var id = jqCell.attr("id");
            var foundCellInfo = null;
            this._eachTableArrayCell(tableArray, function (cellInfo)
            {
                if (cellInfo.id === id)
                {
                    foundCellInfo = cellInfo;
                    return true;
                }
            });
            return foundCellInfo;
        },

        getCellFromCellInfo: function (cellInfo)
        {
            return this._getCellFromCellInfo(cellInfo);
        },

        //get the cell at this position, but only if the cell *starts* at this position
        getCellAtPosition: function (jqTable, rowIndex, colIndex)
        {
            var tableArray = this.getTableArray(jqTable);
            var result = $();
            this._eachTableArrayCell(tableArray, function (cellInfo)
            {
                if (cellInfo.rowIndex === rowIndex && cellInfo.colIndex === colIndex)
                {
                    result = jqTable.find("#" + cellInfo.id);
                    return true;
                }
            });
            return result;
        },

        //get the cell at this position, even if the cell simply extends into this position
        getActualCellFromPosition: function (jqTable, rowIndex, colIndex)
        {
            var tableArray = this.getTableArray(jqTable);
            var cellInfo = this.getReferencedCellInfoAtPosition(tableArray, rowIndex, colIndex);
            var id = cellInfo.isRef === true ? cellInfo.ref : cellInfo.id;
            var result = !checkExists(cellInfo) ? $() : jqTable.find("#" + id);
            return result;
        },

        //get the cell info for the actual cell, from this ref cell.
        getActualCellInfoFromTablePosition: function (jqTable, rowIndex, colIndex)
        {
            var tableArray = this.getTableArray(jqTable);
            return this.getActualCellInfoFromPosition(tableArray, rowIndex, colIndex);
        },

        //get the cell info for the actual cell, from this ref cell.
        getActualCellInfoFromPosition: function (tableArray, rowIndex, colIndex)
        {
            var cellInfo = null;

            if (rowIndex >= 0 && rowIndex < tableArray.length &&
                colIndex >= 0 && colIndex < tableArray[0].length)
            {
                cellInfo = tableArray[rowIndex][colIndex];
                if (cellInfo.isRef === true)
                {
                    cellInfo = this._getCellInfoFromId(tableArray, cellInfo.ref);
                }

            }
            return cellInfo;
        },

        //get the cell at this position, even if the cell simply extends into this position
        getReferencedCellInfoAtPosition: function (tableArray, rowIndex, colIndex)
        {
            var result = null;
            this._everyTableArrayCell(tableArray, function (cellInfo)
            {

                if (cellInfo.rowIndex === rowIndex && cellInfo.colIndex === colIndex)
                {
                    result = cellInfo;
                    return true;
                }
            });
            return result;
        },

        //returns jqCell
        getCellWithId: function (jqTable, id)
        {
            var tableArray = this.getTableArray(jqTable);
            return this._getCellFromId(tableArray, id);
        },

        //returns jqCell
        getCellFromId: function (tableArray, id)
        {
            return this._getCellFromId(tableArray, id);
        },

        //returns cellinfo
        getCellInfoFromId: function (tableArray, id)
        {
            return this._getCellInfoFromId(tableArray, id);
        },

        //returns new column id. Being used by TableBehavior when constructing a table
        addNewColumnDefinitionAtEnd: function (jqTable, strWidth)
        {
            if (this.isRenderedAsTable(jqTable))
            {
                return this._addNewColumnDefinitionAtEndForTable(strWidth, jqTable, null);
            }
            else
            {
                return this._addNewColumnDefinitionAtEndOnGrid(strWidth, jqTable, null);
            }
        },

        //returns new column id.
        addNewColumnDefinitionAt: function (colIndex, strWidth, jqTable)
        {
            if (this.isRenderedAsTable(jqTable))
            {
                return this._addNewColumnDefinitionAtForTable(colIndex, strWidth, jqTable, null);
            }
            else
            {
                return this._addNewColumnDefinitionAtOnGrid(colIndex, strWidth, jqTable, null);
            }
        },

        //returns new row id.
        addNewRowDefinitionAt: function (rowIndex, strHeight, jqTable)
        {
            if (this.isRenderedAsTable(jqTable))
            {
                return this._addNewRowDefinitionAtForTable(rowIndex, strHeight, jqTable, null);
            }
            else
            {
                return this._addNewRowDefinitionAtOnGrid(rowIndex, strHeight, jqTable, null);
            }
        },

        //exposed as public for the tableresize widget
        setColumnConfiguredWidths: function (widthsArray, jqTable)
        {
            return this._setColumnConfiguredWidths(widthsArray, jqTable);
        },

        //exposed as public for the tableresize widget
        setColumnRenderWidths: function (widthsArray, jqTable)
        {
            return this._setColumnRenderWidths(widthsArray, jqTable);
        },

        cellIsInGrid: function (jqCell)
        {
            var jqTable = jqCell.closest(".editor-table");
            return (this.isRenderedAsGrid(jqTable) && jqCell.is(".editor-cell"));
        },

        isRenderedAsTable: function (jqTable)
        {
            return !this.isRenderedAsGrid(jqTable);
        },

        //also in sourcecode.forms.designers.view.designertable.js
        isRenderedAsGrid: function (jqTable)
        {
            return jqTable.hasClass("editor-grid") || jqTable.hasClass("widget-grid");
        },

        validateArray: function (tableArray, errorLocation)
        {
            return this._validateArray(tableArray, errorLocation);
        },

        getTotalRenderedColumnPixelWidths: function (jqTable)
        {
            var widthArray = this.getRenderedColumnPixelWidths(jqTable);

            var i = 0;

            var total = 0;

            for (i = 0; i < widthArray.length; i++)
            {
                total += parseFloat(widthArray[i]);
            }

            return total;
        },

        //Get the width of the Columns in the table.
        //if its a <table>, we get the column widths from <colgroup>
        //if its a grid, we get the column widths from <div class="editor-grid"> grid-template-columns attribute.
        //Returns: An Array of pixel widths.
        getColumnWidths: function (jqTable)
        {
            return this._getColumnWidths(jqTable);
        },

        //get a column width of a column
        getColumnWidth: function (jqTable, colIndex)
        {
            var widths = this._getColumnWidths(jqTable);
            return widths[colIndex];
        },

        //Get the rendered widths of the Columns in the table using a temproary measure table.
        //Returns: An Array of pixel widths.
        getRenderedColumnPixelWidths: function (jqTable)
        {
            return this._getRenderedColumnPixelWidths(jqTable);
        },

        //get a single rendered width of a column
        getRenderedColumnPixelWidth: function (jqTable, colIndex)
        {
            var widths = this._getRenderedColumnPixelWidths(jqTable);
            return widths[colIndex];
        },

        //Get all of the configured widths of the columns
        getConfiguredColumnWidths: function (jqTable)
        {
            return this._getConfiguredColumnWidths(jqTable);
        },

        //get a single configured width of a column
        getConfiguredColumnWidth: function (jqTable, colIndex)
        {
            var widths = this._getConfiguredColumnWidths(jqTable);
            return widths[colIndex];
        },

        //get a single configured width of a column
        getConfiguredRowHeight: function (jqTable, rowIndex)
        {
            var heights = this._getRowConfiguredHeights(jqTable);
            return heights[rowIndex];
        },

        //sets both the rendered and configured width of a column
        setColumnWidth: function (strWidth, columnIndex, jqTable)
        {
            var result = 0;
            result = this._setColumnRenderWidth(strWidth, columnIndex, jqTable);
            result = this._setColumnConfiguredWidth(strWidth, columnIndex, jqTable);
            return result;
        },

        //sets both the rendered and configured height of a row
        setRowHeight: function (strHeight, rowIndex, jqTable)
        {
            var result = 0;
            result = this._setRowRenderedHeight(strHeight, rowIndex, jqTable);
            result = this._setRowConfiguredHeight(strHeight, rowIndex, jqTable);
            return result;
        },

        setColumnRenderWidth: function (strWidth, columnIndex, jqTable)
        {
            return this._setColumnRenderWidth(strWidth, columnIndex, jqTable);
        },

        getDimensionUnitData: function (strDimension)
        {
            return this._getDimensionUnitData(strDimension);
        },

        isEditableCell: function (jqElement)
        {
            return jqElement.is(".editor-cell");
        },

        getTableFromCell: function (jqElement)
        {
            if (jqElement.is(".editor-table")) return jqElement;

            return jqElement.closest(".editor-table");
        },


        //Get the next cell that starts in this row.
        //Returns JqCell or Null.
        //Param: cellInfo - a dto of information about a cell.
        getNextCellInRow: function (cellInfo)
        {
            var jqCell = this._getCellFromCellInfo(cellInfo);
            var jqTable = this._getTableFromCell(jqCell);
            var tableArray = this.getTableArray(jqTable);
            return this._getNextCellInRowFromTableArray(cellInfo, tableArray);
        },

        //renders the needed rowspans, grid positions etc to the DOM for this cellInfo.
        setCellInfo: function (cellInfo)
        {
            var jqCell = this._getCellFromCellInfo(cellInfo);
            var jqTable = this._getTableFromCell(jqCell);

            this._setCellColSpan(jqTable, jqCell, cellInfo.col, cellInfo.colSpan);
            this._setCellRowSpan(jqTable, jqCell, cellInfo.row, cellInfo.rowSpan);
        },

        //Set the value and update the DOM
        //newColSpan (number)
        setCellColSpan: function (cellInfo, newColSpan)
        {
            var jqCell = this._getCellFromCellInfo(cellInfo);
            var jqTable = this._getTableFromCell(jqCell);

            this._setCellColSpan(jqTable, jqCell, cellInfo.col, newColSpan);

            return jqCell;
        },

        //Set the value and update the DOM
        //newColSpan (number)
        setCellRowSpan: function (cellInfo, newRowSpan)
        {
            var jqCell = this._getCellFromCellInfo(cellInfo);
            var jqTable = this._getTableFromCell(jqCell);

            this._setCellRowSpan(jqTable, jqCell, cellInfo.row, newRowSpan);
        },


        //scan whole table and remove un-needed column definitions, merging widths where needed.
        //returns the column indexes that were removed, in an Array.
        removeEmptyColumns: function (jqTable)
        {
            return this.removeUnNeededCols(jqTable);
        },

        //scan whole table and remove un-needed column definitions, merging widths where needed.
        //returns the column indexes that were removed, in an Array.
        removeEmptyRows: function (jqTable)
        {
            return this.removeUnNeededRows(jqTable);
        },

        getTableHTMLColumnIndex: function (tableArray, rowIndex, id)
        {
            return this._getTableHTMLColumnIndex(tableArray, rowIndex, id);
        },

        removeRow: function (tableArray, pivotCell, position)
        {
            return this._removeRow(tableArray, pivotCell, position);
        },

        insertRow: function (jqTable, pivotCell, position, cellCreateCallback)
        {
            var tableArray = this.getTableArray(jqTable);
            var cellInfo = this.getCellInfo(pivotCell);
            var rowIndex = cellInfo.rowIndex;

            //Get which columns to insert new cells into to make the new row - takes into account rowspans coming in from above.
            var insertIndexes = this._insertRow(tableArray, pivotCell, position);

            //row insert position
            var insertRowIndex = position === 'before' ? rowIndex : rowIndex + cellInfo.rowSpan;

            //insert a new row definition into DOM
            var rowInfo = this.insertRowAtPosition(jqTable, insertRowIndex);

            //get number of cols (agnostic of table/grid rendering)
            var colCount = this.getColumnCountInTableArray(jqTable);

            //GO through each column, decide whether to add a cell 
            var colIndex = 0;
            while (colIndex < colCount)
            {
                var colInsertPosition = insertIndexes[colIndex]; //-1 if not add a cell.

                //Get info from the selected row's cell to copy into the new row
                var cellInfoFrom = this.getActualCellInfoFromPosition(tableArray, rowIndex, colIndex);

                if (colInsertPosition > -1)
                {
                    var cellFrom = this.getCellFromCellInfo(cellInfoFrom);
                    var newCellInfo = {
                        rowIndex: insertRowIndex,
                        colIndex: colIndex,
                        row: insertRowIndex + 1,
                        col: colIndex + 1,
                        rowSpan: 1, //we're inserting a row, so we can't copy this.
                        colSpan: cellInfoFrom.colSpan
                    };


                    //Insert the cell into the DOM at the right position
                    var newCell = this.addCellAtPositionWithColumnInsertionData(jqTable, newCellInfo, position, colInsertPosition);

                    if (typeof cellCreateCallback === "function") cellCreateCallback(cellInfoFrom, cellFrom, newCell);
                }
                colIndex += cellInfoFrom.colSpan;
            }

            tableArray = this.updateTableArray(jqTable);

            this._preserveRowHeightForRowsWithOnlyRowSpanCells(tableArray, jqTable);

            this.updateGridCellClasses(jqTable);

            return rowInfo;
        },

        //Inserts a new row definition after/before the rowIndex. Only the definition, no new cells etc.
        insertRowAtPosition: function (jqTable, rowIndex)
        {
            //Split the heights
            var maxRows = SourceCode.Forms.TableHelper.getRowCountInTableArray(jqTable);
            var rowIndexToSplit = Math.min(rowIndex, maxRows - 1);
            var rowHeight = SourceCode.Forms.TableHelper.getConfiguredRowHeight(jqTable, rowIndexToSplit);
            var newHeight = SourceCode.Forms.TableHelper.getSplitRowHeight(rowHeight);
            SourceCode.Forms.TableHelper.setRowHeight(newHeight, rowIndexToSplit, jqTable);
            var rowInfo = null;
            //add the new column definition

            rowInfo = SourceCode.Forms.TableHelper.addNewRowDefinitionAt(rowIndex, newHeight, jqTable);
            return rowInfo;
        },

        getCellFromElement: function (jqElement, selector)
        {
            var s = checkExists(selector) ? selector : ".editor-cell";

            return this._getParentOrCurrentElementThatIs(jqElement, s);
        },

        //Exclusively made public for ColumnHelper to use.
        //Grid Specific method
        getGridCellPositionInfoForTable: function (jqTable)
        {
            var arrayResult = null;
            if (!this._isRenderedAsTable(jqTable))
            {
                arrayResult = [];
                var children = jqTable[0].children;
                for (var i = 0; i < children.length; i++)
                {
                    var jqCell = $(children[i]);
                    var positions = SourceCode.Forms.TableHelper.getGridCellPositionInfo(jqTable, jqCell);
                    arrayResult.push(positions);
                }
            }
           
            return arrayResult;
        },

        //Exclusively made public for ColumnHelper to use.
        //Grid Specific method
        getGridCellPositionInfo: function (jqTable, jqCell)
        {
            return this._getGridCellPositionInfo(jqTable, jqCell);
        },

        //#endregion Public methods

        //#region Private -  Table Array Methods

        //grid/table agnostic method
        _generateTableArray: function (table)
        {
            return this.isRenderedAsTable(table) ? this._generateTableArrayFromTable(table) : this._generateTableArrayFromGrid(table);
        },

        _generateTableArrayFromTable: function (table)
        {
            var tableArray = [];
            var columnLength = table.find(">colgroup>col").length;

            var rows = table.find(">tbody>tr");

            if (columnLength === 0 && rows.length > 0)
            {
                //Editor table should normally be defined with <col>s
                //For tables (e.g. toolbar table) that doesn't have <col>s defined then fail back to use the <td>s from the first row
                columnLength = rows.eq(0).find(">td").length;
            }

            // initialize table
            for (var i = 0; i < rows.length; i++)
            {
                tableArray[i] = [];
                for (var j = 0; j < columnLength; j++)
                {
                    tableArray[i][j] = null;
                }
            }

            this._updateTableArray(table, tableArray);

            return tableArray;
        },

        //get a 2 dimensional array of rows and columns, ready to be filled.
        _generateTableArrayFromGrid: function (jqTable)
        {
            var tableArray = [];
            var columnLength = 0;

            var cells = jqTable.find(">.editor-cell");

            var maxCols = 0;
            var maxRows = 0;

            // initialize table
            for (var i = 0; i < cells.length; i++)
            {
                var jqCell = cells.eq(i);

                var info = this._getGridCellPositionInfo(jqTable, jqCell);

                maxRows = Math.max(maxRows, info.rowIndex + info.rowSpan);
                maxCols = Math.max(maxCols, info.colIndex + info.colSpan);
            }

            for (var rowIndex = 0; rowIndex < maxRows; rowIndex++)
            {
                for (var colIndex = 0; colIndex < maxCols; colIndex++)
                {
                    if (typeof (tableArray[rowIndex]) === "undefined")
                    {
                        tableArray[rowIndex] = [];
                    }
                    tableArray[rowIndex][colIndex] = null;
                }
            }

            this._updateTableArray(jqTable, tableArray);

            return tableArray;
        },

        _getTableArray: function (jqTable)
        {
            var id = jqTable.attr("id");
            if (!checkExists(this._designTableArrays)) this._designTableArrays = [];
            var tableArray = this._designTableArrays[id];
            if (!checkExists(tableArray))
            {
                this._designTableArrays[id] = this._generateTableArray(jqTable);
                tableArray = this._designTableArrays[id];
            }
            return tableArray;
        },

        //TODO: this throws a popup, which it probably shouldn't
        //Instead it should just throw an Exception, with a rich exception object, that consumers 
        //of this method can catch anf  use to throw UI themselves.
        _updateTableArray: function (jqTable, tableArray)
        {
            // invalid table array
            if (!checkExists(tableArray) || tableArray.length === 0 || tableArray[0].length === 0) return;

            var gridCellPositionInfo = SourceCode.Forms.TableHelper.getGridCellPositionInfoForTable(jqTable);

            var rowsLen = tableArray.length; //we can't use this.GetRowCount as it'll cause an infinite stack
            //var rowsLen = jqRows.length;
            var colIndex = 0;
            for (var rowIndex = 0; rowIndex < rowsLen; rowIndex++)
            {
                var cells = this.getCellsInRowIndex(jqTable, rowIndex, gridCellPositionInfo);
                var cellsLen = cells.length;
                colIndex = 0;
                for (var cellIndex = 0; cellIndex < cellsLen; cellIndex++)
                {
                    var jqCell = $(cells[cellIndex]);
                    var rowSpan = 1;
                    var colSpan = 1;
                    var cellId = jqCell.attr("id");

                    if (checkExists(tableArray[rowIndex]))
                    {
                        arrayCell = tableArray[rowIndex][colIndex];
                        while (checkExists(arrayCell) && checkExists(arrayCell.ref))
                        {
                            // advance until there aren't any references left
                            colIndex++;
                            arrayCell = tableArray[rowIndex][colIndex];
                        }

                        if (colIndex > tableArray[rowIndex].length - 1)
                        {
                            continue;
                        }

                        // if current cell has any spans, pre-empt and map out the references
                        var spanInfo = this._getCellSpanInfo(jqTable, jqCell);
                        colSpan = spanInfo.colSpan;
                        rowSpan = spanInfo.rowSpan;

                        if (rowSpan > 1 || colSpan > 1)
                        {
                            for (var y = rowIndex; y < rowIndex + rowSpan; y++)
                            {
                                for (var x = colIndex; x < colIndex + colSpan; x++)
                                {
                                    var colSpanRemaining = (colSpan - (x - colIndex));
                                    var rowSpanRemaining = (rowSpan - (y - rowIndex));
                                    if (y === rowIndex && x === colIndex)
                                    {
                                        continue;
                                    }

                                    if (checkExists(tableArray[y]))
                                    {
                                        tableArray[y][x] = {
                                            ref: cellId,
                                            isRef: true,
                                            rowIndex: y,
                                            colIndex: x,
                                            row: y + 1,
                                            col: x + 1,
                                            //the remaining rowspan, not the rowspan of the id cell.
                                            rowSpan: rowSpanRemaining,
                                            //the remaining colspan, not the colspan of the id cell.
                                            colSpan: colSpanRemaining
                                        };
                                    }

                                }
                            }
                        }

                        tableArray[rowIndex][colIndex] = {
                            rowIndex: rowIndex,
                            colIndex: colIndex,
                            row: rowIndex + 1,
                            col: colIndex + 1,
                            rowSpan: rowSpan,
                            colSpan: colSpan,
                            id: cellId
                        };
                    }

                    // we need to keep the table array's indexer in sync, so we adjust if it has a column span
                    colIndex += colSpan;

                }
            }
            var errorLocation = {};
            if (!this._validateArray(tableArray, errorLocation))
            {
                //People understand 1 based indexes better than zero based indexes when rowing with row and column numbers.
                //Hence the row and column values are incremented
                //Resourcifying these messages is out of scope for the cold fix but will be done in main
                //Adding the extra detail should prevent customers from continuing with their design
                //Adding the row / column detail will help support where they can use jquery and the browser console to manually correct the layout
                var messageLine1 = Resources.ExceptionHandler.TableLayoutCorruptedLine1.format(errorLocation.row + 1, errorLocation.col + 1);
                var messageLine2 = Resources.ExceptionHandler.TableLayoutCorruptedLine2;

                //console.log("{0}:{1}".format(messageLine1, messageLine2));
                popupManager.showError("{0}<BR>{1}".format(messageLine1, messageLine2));
            }
            return tableArray;
        },

        //grid/table agnostic
        _getCellSpanInfo: function (jqTable, jqCell)
        {
            if (this.isRenderedAsTable(jqTable))
            {
                return this._getCellSpanInfoFromTable(jqTable, jqCell);
            }
            else
            {
                return this._getCellSpanInfoFromGrid(jqTable, jqCell);

            }
        },

        _getCellSpanInfoFromTable: function (jqTable, jqCell)
        {
            var result = { rowSpan: 1, colSpan: 1 };
            var strRowSpan = jqCell.attr("rowspan");
            var strColSpan = jqCell.attr("colspan");
            var rowSpan = typeof (strRowSpan) !== "undefined" ? Number(strRowSpan) : 1;
            result.rowSpan = Math.max(rowSpan, 1);
            var colSpan = typeof (strColSpan) !== "undefined" ? Number(strColSpan) : 1;
            result.colSpan = Math.max(colSpan, 1);
            return result;
        },

        _getCellSpanInfoFromGrid: function (jqTable, jqCell)
        {
            var positions = this._getGridCellPositionInfo(jqTable, jqCell);
            var result = {
                rowSpan: positions.rowSpan,
                colSpan: positions.colSpan
            };

            return result;
        },

        //grid only function - doesn't need a table equivilent
        _getGridCellPositionInfo: function (jqTable, jqCell)
        {
            var style = jqCell[0].style;
            var strRowEnd = style.gridRowEnd;
            var strRowStart = style.gridRowStart;

            if (this._isIE11())
            {
                strRowStart = jqCell[0].style["-ms-grid-row"];

                var rowSpan = jqCell[0].style["-ms-grid-row-span"]; //grid-row-end return the rowspan in IE11
                rowSpan = rowSpan === 'auto' ? 1 : parseInt(rowSpan);

                strRowEnd = parseInt(strRowStart) + rowSpan;
            }

            var rowStart = parseInt(strRowStart);
            var rowEnd = (strRowEnd === 'auto' ? rowStart + 1 : parseInt(strRowEnd));
            if (rowStart === rowEnd) rowEnd = rowStart + 1;

            var strColumnEnd = style.gridColumnEnd;
            var strColumnStart = style.gridColumnStart;

            if (this._isIE11())
            {
                strColumnStart = jqCell[0].style["-ms-grid-column"];

                var columnSpan = jqCell[0].style["-ms-grid-column-span"]; //grid-column-end return the colspan in IE11
                columnSpan = columnSpan === 'auto' ? 1 : parseInt(columnSpan);

                strColumnEnd = parseInt(strColumnStart) + columnSpan;
            }

            var columnStart = parseInt(strColumnStart);
            var columnEnd = (strColumnEnd === 'auto' ? columnStart + 1 : parseInt(strColumnEnd));
            if (columnStart === columnEnd) columnEnd = columnStart + 1;

            return {
                rowIndex: rowStart - 1,
                colIndex: columnStart - 1,
                row: rowStart,
                col: columnStart,
                colSpan: Math.max(columnEnd - columnStart, 1),
                rowSpan: Math.max(rowEnd - rowStart, 1)
            };

        },

        // debug function
        _validateArray: function (tableArray, errorLocation)
        {
            for (var row = 0; row < tableArray.length; row++)
            {
                for (var col = 0; col < tableArray[row].length; col++)
                {
                    if (!checkExists(tableArray[row][col]))
                    {
                        if (checkExists(errorLocation))
                        {
                            errorLocation.row = row;
                            errorLocation.col = col;
                        }
                        return false;
                    }
                }
            }
            return true;
        },

        //query the table array to get the next cell info that starts in the same row.
        //return the cellInfo for the cell. if there are no more cells in the same row, return null.
        _getNextCellInfoInRowFromTableArray: function (cellInfo, tableArray)
        {
            var found = false;
            var rowArray = tableArray[cellInfo.rowIndex];
            var colPosition = cellInfo.colIndex;
            var id = cellInfo.id;

            var obj = null;

            while (!found && colPosition < rowArray.length)
            {
                colPosition++;

                obj = rowArray[colPosition];

                if (obj.isRef)
                {
                    //A reference cell doesn't have an id thus skip it for comparision
                    continue;
                }

                found = obj.id !== id;

                found = rowArray[colPosition].id !== id;
            }
            if (found) return rowArray[colPosition];
            return null;
        },

        //query the table array to get the next cell info that starts in the same row.
        //return the cellInfo for the cell. if there are no more cells in the same row, return null.
        _getNextCellInfoInRowFromPosition: function (rowIndex, colIndex, tableArray)
        {
            var found = false;
            var rowArray = tableArray[rowIndex];
            var colPosition = colIndex;
            var id = cellInfo.id;

            while (!found && colPosition < rowArray.length)
            {
                colPosition++;
                found = rowArray[colPosition].isRef === false;
            }

            if (found) return rowArray[colPosition];
            return null;
        },

        //query the table array to get the next cell that starts in the same row.
        //return the jquery Element for the cell.
        //if there are no more cells in the same row, return empty jquery object.
        _getNextCellInRowFromTableArray: function (cellInfo, tableArray)
        {
            var foundInfo = this._getNextCellInfoInRowFromTableArray(cellInfo, tableArray);
            if (checkExists(foundInfo)) return jQuery("#" + foundInfo.id);
            return $();
        },


        //get the previous cell info in this row that starts in this row.
        //return null if there isn't one.
        _getPreviousCellInfoInRowFromPosition: function (rowIndex, colIndex, tableArray)
        {
            var found = false;
            var rowArray = tableArray[rowIndex];
            var colPosition = colIndex;
            var id = cellInfo.id;

            while (!found && colPosition > 0)
            {
                colPosition--;
                found = rowArray[colPosition].ref !== id;
            }

            if (found) return rowArray[colPosition];
            return null;
        },


        //every cell, including ref cells will get a callback
        _everyTableArrayCell: function (tableArray, callback)
        {
            for (var row = 0; row < tableArray.length; row++)
            {
                for (var col = 0; col < tableArray[row].length; col++)
                {
                    var cellInfo = tableArray[row][col];
                    var stop = callback.call(this, cellInfo);
                    if (stop) return;
                }
            }
        },

        //only actual cells, not refs get a callback
        _eachTableArrayCell: function (tableArray, callback)
        {
            var _this = this;
            this._everyTableArrayCell(tableArray, function (cellInfo)
            {
                if (!cellInfo.isRef) return callback.call(_this, cellInfo);
                return false;
            });
        },

        //#endregion Table Array Methods

        //#region Private -  Get Measured Render Widths For Columns

        //returns an Array of pixel widths (int)
        _getRenderedColumnPixelWidths: function (jqTable)
        {
            //We create a quick table or grid, add it to the DOM to measure, then remove it.
            //measuring Table/Grid only has 1 row, with one cell per column.
            //We do this so that each browser can report accurately what it rendered, and avoid problems with merged cells.

            if (this.isRenderedAsTable(jqTable))
            {
                return this._getRenderedColumnPixelWidthsForTable(jqTable);
            }
            else
            {
                return this._getRenderedColumnPixelWidthsOnGrid(jqTable);
            }

        },

        _getRenderedColumnPixelWidthsForTable: function (jqTable)
        {
            //We create a quick table or grid, add it to the DOM to measure, then remove it.
            //measuring Table/Grid only has 1 row, with one cell per column.
            //We do this so that each browser can report accurately what it rendered, and avoid problems with merged cells.

            var result = new Array();
            var columnWidths = this._getConfiguredColumnWidths(jqTable);

            //Get Rendered column widths from a disposable Measuring Table
            var jqMeasuringTable = this._getMeasuringTable(jqTable, columnWidths);
            var cells = jqMeasuringTable.find(".cell");
            cells.each(function ()
            {
                var cell = $(this);
                result.push(cell.outerWidth());
            });
            this._removeMeasuringTable(jqMeasuringTable);
            return result;
        },

        _getRenderedColumnPixelWidthsOnGrid: function (jqTable)
        {
            //We create a quick table or grid, add it to the DOM to measure, then remove it.
            //measuring Table/Grid only has 1 row, with one cell per column.
            //We do this so that each browser can report accurately what it rendered, and avoid problems with merged cells.
            var result = new Array();
            var columnWidths = this._getConfiguredColumnWidths(jqTable);

            //Get Rendered column widths from a disposable Measuring Grid
            var jqMeasuringGrid = this._getMeasuringGrid(jqTable, columnWidths);
            var cells = jqMeasuringGrid.find(".cell");
            cells.each(function ()
            {
                var cell = $(this);
                result.push(cell.outerWidth());
            });
            this._removeMeasuringGrid(jqMeasuringGrid);
            return result;
        },


        //creates a fake table for the purposes of measuring the rendered widths of the columns only.
        //returns jqElement - with a cell per column, that can be measured to see how the browser calculated the widths based on declared values.
        //the caller of this method is reponsible for removing the fake element - result.remove();
        _getMeasuringTable: function (jqTable, declaredColumnWidths)
        {
            var attachTo = $("body");
            var renderedWidth = jqTable.outerWidth();

            var measureTable = $("<table></table>");
            //we don't want anyone to see or interact with this element, we're just creating it, measuring, then destroying it.
            measureTable.css({
                "display": "table",
                "table-layout": "fixed",
                "box-sizing": "border-box",
                "pointer-events": "none",
                "opacity": "0",
                "position": "absolute",
                "top": "0",
                "left": "0",
                "width": renderedWidth
            });

            //Add the cells.
            var row = $("<tr></tr>");
            var colgroup = $("<colgroup></colgroup>")
            for (var i = 0; i < declaredColumnWidths.length; i++)
            {
                var width = declaredColumnWidths[i];
                var col = $("<col/>");
                col.css({
                    "width": width
                });
                colgroup.append(col);

                var cell = $("<td class='cell'></td>");
                cell.css({
                    "box-sizing": "border-box"
                });
                row.append(cell);
            }
            measureTable.append(colgroup);
            measureTable.append(row);
            attachTo.append(measureTable);
            return measureTable;

        },

        //creates a fake table for the purposes of measuring the rendered widths of the columns only.
        //returns jqElement - with a cell per column, that can be measured to see how the browser calculated the widths based on declared values.
        //the caller of this method is reponsible for removing the fake element - result.remove();
        _getMeasuringGrid: function (jqTable, declaredColumnWidths)
        {
            var attachTo = $("body");
            var renderedWidth = jqTable.outerWidth();

            var measureGrid = $("<div></div>");

            //we don't want anyone to see or interact with this element, we're just creating it, measuring, then destroying it.
            measureGrid.css({
                "display": "grid",
                "box-sizing": "border-box",
                "pointer-events": "none",
                "opacity": "0",
                "position": "absolute",
                "top": "0",
                "left": "0",
                "width": renderedWidth
            });

            if (this._isIE11())
            {
                measureGrid[0].style["display"] = "-ms-grid";
            }

            //Add the cells.
            var columnIndex = 1;
            var strColumns = "";
            for (var i = 0; i < declaredColumnWidths.length; i++)
            {
                var width = declaredColumnWidths[i];
                //make string of column widths
                strColumns += width + " ";

                //add cells
                var cell = $("<div class='cell'></div>");
                cell.css({
                    "grid-column": columnIndex,
                    "box-sizing": "border-box"
                });

                if (this._isIE11())
                {
                    cell[0].style["-ms-grid-column"] = columnIndex;
                }

                measureGrid.append(cell);

                columnIndex++;
            }
            measureGrid.css("grid-template-columns", strColumns);

            if (this._isIE11())
            {
                measureGrid[0].style["grid-template-columns"] = strColumns;
                measureGrid[0].style["-ms-grid-columns"] = strColumns;
            }

            attachTo.append(measureGrid);
            return measureGrid;
        },


        _removeMeasuringGrid: function (jqMeasuringGrid)
        {
            jqMeasuringGrid.remove();
        },

        _removeMeasuringTable: function (jqMeasuringTable)
        {
            jqMeasuringTable.remove();
        },

        //#endregion Get Measured Render Widths For Columns

        //#region Private -  Row height Accessors

        _getRowConfiguredHeights: function (jqTable)
        {
            var result = [];
            if (SourceCode.Forms.TableHelper.isRenderedAsTable(jqTable))
            {
                result = this._getRowConfiguredHeightsForTable(jqTable);
            }
            else
            {
                result = this._getRowConfiguredHeightsOnGrid(jqTable);
            }
            return result;
        },

        //Get all row heights at once
        _getRowRenderedHeightsOnGrid: function (jqGrid)
        {
            //jquery will return pixel amounts so we have to go to the raw style
            var strColumnWidths = jqGrid[0].style["grid-template-rows"];

            return checkExists(strColumnWidths) ? strColumnWidths.trim().split(' ') : [];
        },

        //Set All Row Render heights at once
        _setRowRenderedHeightsOnGrid: function (heightArray, jqGrid)
        {
            var strRows = heightArray.join(' ').trim();
            jqGrid.css("grid-template-rows", strRows);

            if (this._isIE11())
            {
                jqGrid[0].style["grid-template-rows"] = strRows;
                jqGrid[0].style["-ms-grid-rows"] = strRows;
            }
        },

        //gets all heights
        //returns an array of str heights
        _getRowConfiguredHeightsOnGrid: function (jqGrid)
        {
            var options = jqGrid.data("options");

            if (!checkExists(options))
            {
                options = this._createEmptyOptions();
            }

            if (options.rowHeights.length === 0)
            {
                var tableArray = this.getTableArray(jqGrid);
                var rowCount = this.getRowCountInTableArray(jqGrid);
                for (var i = 0; i < rowCount; i++)
                {
                    options.rowHeights.push("auto");
                }

                jqGrid.data("options", options);
            }
            return options.rowHeights;
        },

        //gets all heights
        //returns an array of str heights
        _getRowConfiguredHeightsForTable: function (jqTable)
        {
            var result = [];
            var jqRows = jqTable.find(">tbody>tr");
            jqRows.each(function ()
            {
                var jqRow = $(this);
                var height = jqRow.data("height");
                if (height === '' || typeof (height) === "undefined") height = 'auto';
                result.push(height);
            });
            return result;
        },

        //sets all heights at once.
        _setRowConfiguredHeightsOnGrid: function (heightArray, jqGrid)
        {
            var options = this._getGridOptions(jqGrid);
            options.rowHeights = heightArray;
        },


        //Table/Grid Agnostic Method
        //Simple Accessor to row Height: Set the height of a row without changing other rows
        _setRowRenderedHeight: function (strHeight, rowIndex, jqTable)
        {
            if (SourceCode.Forms.TableHelper.isRenderedAsTable(jqTable))
            {
                this._setRowRenderedHeightForTable(strHeight, rowIndex, jqTable);
            }
            else
            {
                this._setRowRenderedHeightOnGrid(strHeight, rowIndex, jqTable);
            }
        },

        //Simple Accessor to row Height: Set the height of a row without changing other rows
        //these are the Render heights, NOT the configured heights.
        _setRowRenderedHeightForTable: function (strHeight, rowIndex, jqTable)
        {
            var jqRows = jqTable.find(">tbody>tr");
            var jqRow = jqRows.eq(rowIndex);
            jqRow.height(strHeight);
            jqRow.attr("height", strHeight);
        },

        //Simple Accessor to row Height: Set the height of a row without changing other rows
        //these are the Render heights, NOT the configured heights.
        _setRowRenderedHeightOnGrid: function (strHeight, rowIndex, jqGrid)
        {
            var rowHeightArray = this._getRowRenderedHeightsOnGrid(jqGrid);

            rowHeightArray[rowIndex] = strHeight;
            var strRows = rowHeightArray.join(" ");
            jqGrid.css("grid-template-rows", strRows);

            if (this._isIE11())
            {
                jqGrid[0].style["grid-template-rows"] = strRows;
                jqGrid[0].style["-ms-grid-rows"] = strRows;
            }
        },

        //simple agnostic-to-rendering setter
        _setRowConfiguredHeight: function (strHeight, rowIndex, jqTable)
        {
            if (SourceCode.Forms.TableHelper.isRenderedAsTable(jqTable))
            {
                this._setRowConfiguredHeightForTable(strHeight, rowIndex, jqTable);
            }
            else
            {
                this._setRowConfiguredHeightOnGrid(strHeight, rowIndex, jqTable);
            }
        },

        //Simple Accessor to row Height: Set the height of a row without changing other rows
        //these are the Configured heights, NOT the render heights. as these differ at design time.
        _setRowConfiguredHeightForTable: function (strHeight, rowIndex, jqTable)
        {
            var jqRows = jqTable.find(">tbody>tr");
            jqRows.eq(rowIndex).data("height", strHeight);
        },

        //Simple Accessor to row Height: Set the height of a row without changing other rows
        //these are the Configured heights, NOT the render heights. as these differ at design time.
        _setRowConfiguredHeightOnGrid: function (strHeight, rowIndex, jqGrid)
        {
            var options = this._getGridOptions(jqGrid);
            options.rowHeights[rowIndex] = strHeight;
        },


        //#endregion Row height Accessors

        //#region Private - Column Width Accessors

        //Table/Grid Agnostic accessor
        //Get All the widths of the columns as they are declared in the HTML (i.e. auto, %, pixels etc)
        _getColumnWidths: function (jqTable)
        {
            if (SourceCode.Forms.TableHelper.isRenderedAsTable(jqTable))
            {
                result = this._getColumnWidthsForTable(jqTable);
            }
            else
            {
                result = this._getColumnWidthsOnGrid(jqTable);
            }

            return result;
        },

        //Get All the configured widths of the columns as they are declared in the HTML (i.e. auto, %, pixels etc)
        _getConfiguredColumnWidths: function (jqTable)
        {
            if (SourceCode.Forms.TableHelper.isRenderedAsTable(jqTable))
            {
                result = this._getColumnConfiguredWidthsForTable(jqTable);
            }
            else
            {
                result = this._getColumnConfiguredWidthsOnGrid(jqTable);
            }

            return result;
        },

        _getGridTemplateColumnsWidthsStyle: function (jqGrid)
        {
            var strWidths = "";

            //Ensure get grid-template-columns from style object so it keeps the original unit. 
            //Calling jqGrid.css("grid-template-columns") will always convert to pixel unit.
            strWidths = jqGrid[0].style["grid-template-columns"];

            if (this._isIE11())
            {
                strWidths = jqGrid[0].style["-ms-grid-columns"];
            }

            return strWidths;
        },

        //Get all column widths at once
        _getColumnRenderWidthsOnGrid: function (jqGrid, convertToPixelUnit)
        {
            var strColumns = this._getGridTemplateColumnsWidthsStyle(jqGrid, convertToPixelUnit);
            var columnWidthArray = checkExists(strColumns) ? strColumns.trim().split(" ") : [];
            return columnWidthArray;
        },

        _setColumnRenderWidths: function (widthArray, jqTable)
        {
            if (this.isRenderedAsTable(jqTable))
            {
                this._setColumnRenderWidthsOnTable(widthArray, jqTable);
            }
            else
            {
                this._setColumnRenderWidthsOnGrid(widthArray, jqTable);
            }
        },

        //Set All column Render widths at once
        _setColumnRenderWidthsOnGrid: function (widthArray, jqGrid)
        {
            var strColumns = widthArray.join(' ').trim();
            jqGrid.css("grid-template-columns", strColumns);

            if (this._isIE11())
            {
                jqGrid[0].style["-ms-grid-columns"] = strColumns;
            }
        },

        //gets all Column widths, returns an array of str widths
        _getColumnWidthsForTable: function (jqTable)
        {
            var result = [];
            //get widths from colgroup/col
            var jqColumns = jqTable.find(">colgroup>col");
            jqColumns.each(function ()
            {
                var jqCol = $(this);

                //Ensure to use the style object to get the width so it keeps the original unit. 
                //Calling jqCol.css("width") will convert empty width to 0px.
                result.push(jqCol[0].style["width"]);
            });
            return result;
        },

        //gets all Column widths, returns an array of str widths
        _getColumnWidthsOnGrid: function (jqGrid)
        {
            //For grid the render width and width are the same
            return this._getColumnRenderWidthsOnGrid(jqGrid);
        },

        //gets all Column configured widths, returns an array of str widths
        _getColumnConfiguredWidthsOnGrid: function (jqGrid)
        {
            //get widths from grid, options.columnWidths stores the configured widths as example ["40%", "auto", "30px", "30px"]
            var options = this._getGridOptions(jqGrid);
            return options.columnWidths;
        },

        //get All column configured widths, returns an array of str widths
        _getColumnConfiguredWidthsForTable: function (jqTable)
        {
            var result = [];
            //get widths from colgroup/col
            var jqColumns = jqTable.find(">colgroup>col");
            jqColumns.each(function ()
            {
                var jqCol = $(this);

                var configuredWidth = jqCol.data("width");
                if (!checkExists(configuredWidth)) configuredWidth = "auto";
                result.push(configuredWidth);
            });
            return result;
        },

        _setColumnConfiguredWidths: function (widthArray, jqTable)
        {
            if (this.isRenderedAsTable(jqTable))
            {
                this._setColumnConfiguredWidthsOnTable(widthArray, jqTable);
            }
            else
            {
                this._setColumnConfiguredWidthsOnGrid(widthArray, jqTable);
            }
        },

        //set all column widths at once.
        _setColumnConfiguredWidthsOnGrid: function (widthArray, jqGrid)
        {
            var options = this._getGridOptions(jqGrid);
            options.columnWidths = widthArray;
        },

        //set all column widths at once.
        _setColumnConfiguredWidthsOnTable: function (widthArray, jqTable)
        {
            var jqColumns = jqTable.find(">colgroup>col");

            for (var i = 0; i < widthArray.length; i++)
            {
                var jqCol = jqColumns.eq(i);

                jqCol.data("width", widthArray[i]);
            }
        },

        //Set All column Render widths at once
        _setColumnRenderWidthsOnTable: function (widthArray, jqTable)
        {
            var jqColumns = jqTable.find(">colgroup>col");

            for (var i = 0; i < widthArray.length; i++)
            {
                var jqCol = jqColumns.eq(i);

                jqCol[0].style["width"] = widthArray[i];
                jqCol.attr("width", widthArray[i]);
            }
        },


        //Table/Grid Agnostic Method
        //Simple Accessor to column Width: Set the width of a column without changing other columns
        _setColumnRenderWidth: function (strWidth, columnIndex, jqTable)
        {
            if (this.isRenderedAsTable(jqTable))
            {
                this._setColumnRenderWidthForTable(strWidth, columnIndex, jqTable);
            }
            else
            {
                this._setColumnRenderWidthOnGrid(strWidth, columnIndex, jqTable);
            }
        },

        //Simple Accessor to column Width: Set the width of a column without changing other columns
        //these are the Render Widths, NOT the configured widths.
        _setColumnRenderWidthForTable: function (strWidth, columnIndex, jqTable)
        {
            var jqColumns = jqTable.find(">colgroup>col");
            var jqCol = jqColumns.eq(columnIndex);

            jqCol.width(strWidth);
            jqCol.attr("width", strWidth);
        },

        //Simple Accessor to column Width: Set the width of a column without changing other columns
        //these are the Render Widths, NOT the configured widths.
        _setColumnRenderWidthOnGrid: function (strWidth, columnIndex, jqGrid)
        {
            strWidth = this._convertColumnWidthUnitForGrid(strWidth);

            var strColumns = this._getGridTemplateColumnsWidthsStyle(jqGrid);
            var columnWidthArray = strColumns.split(" ");

            columnWidthArray[columnIndex] = strWidth;
            strColumns = columnWidthArray.join(" ");
            jqGrid.css("grid-template-columns", strColumns);

            if (this._isIE11())
            {
                jqGrid[0].style["-ms-grid-columns"] = strColumns;
            }
        },

        //simple agnostic-to-rendering setter
        _setColumnConfiguredWidth: function (strWidth, columnIndex, jqTable)
        {
            if (SourceCode.Forms.TableHelper.isRenderedAsTable(jqTable))
            {
                this._setColumnConfiguredWidthForTable(strWidth, columnIndex, jqTable);
            }
            else
            {
                this._setColumnConfiguredWidthOnGrid(strWidth, columnIndex, jqTable);
            }
        },

        //Simple Accessor to column Width: Set the width of a column without changing other columns
        //these are the Configured Widths, NOT the render widths. as these differ at design time.
        _setColumnConfiguredWidthForTable: function (strWidth, columnIndex, jqTable)
        {
            var jqColumns = jqTable.find(">colgroup>col");
            var jqCol = jqColumns.eq(columnIndex);

            jqCol.data("width", strWidth);
            jqCol.attr("data-width", strWidth);
        },

        //Simple Accessor to column Width: Set the width of a column without changing other columns
        //these are the Configured Widths, NOT the render widths. as these differ at design time.
        _setColumnConfiguredWidthOnGrid: function (strWidth, columnIndex, jqGrid)
        {
            strWidth = this._convertColumnWidthUnitForGrid(strWidth);

            var options = this._getGridOptions(jqGrid);
            options.columnWidths[columnIndex] = strWidth;
        },

        _convertColumnWidthUnitForGrid: function (strWidth)
        {
            if (SourceCode.Forms.Designers.isDimensionAuto(strWidth))
            {
                //Auto column should be set as 1fr
                strWidth = "1fr";
            }

            return strWidth;
        },

        //#endregion Private - Column Width Accessors

        //#region Private - Dimension Helpers

        _isDimensionAuto: function (strDimension)
        {
            return SourceCode.Forms.Designers.isDimensionAuto(strDimension);
        },

        _getDimensionUnitData: function (strDimension)
        {
            return SourceCode.Forms.Designers.getWidthUnitData(strDimension);
        },

        //#endregion Dimension Helpers

        //#region Private - Finding Table, Cells, Indexes

        //get the table/grid from a cell within one.
        _getTableFromCell: function (jqCell)
        {
            var table = jqCell.closest(".editor-table");
            return table;
        },


        //returns the row "index" (i.e. Zero based numbers, first row is 0)
        _getRowIndexFromCell: function (tableArray, jqCell)
        {
            var jqTable = this._getTableFromCell(jqCell);

            var id = jqCell.attr("id");
            var foundCellInfo = this._getCellInfoFromId(tableArray, id);
            return foundCellInfo.rowIndex;
        },

        //#endregion Finding Table, Cells, Indexes

        //#region Private - ObjectModel methods
        _buildRowsObjectModel: function (jqTable)
        {
            if (this.isRenderedAsTable(jqTable))
            {
                return this._buildRowsObjectModelFromTable(jqTable);
            }
            else
            {
                return this._buildRowsObjectModelFromGrid(jqTable);
            }
        },
        //returns an array of column info in the form {id:xxxx, width:xxxxx renderWidth:xxxxxx, index:0}
        //agnostic to grid/table
        _buildColumnsObjectModel: function (jqTable)
        {
            if (this.isRenderedAsTable(jqTable))
            {
                return this._buildColumnsObjectModelFromTable(jqTable);
            }
            else
            {
                return this._buildColumnsObjectModelFromGrid(jqTable);
            }
        },
        //return an array of row info in object model form - {id:xxxx, height: strxxxx, index:0}
        _buildRowsObjectModelFromTable: function (jqTable)
        {
            var rowsInfo = [];
            var rowIds = this._getRowIdsForTable(jqTable);
            var configuredHeights = this._getRowConfiguredHeightsForTable(jqTable);
            for (var r = 0; r < configuredHeights.length; r++)
            {
                var id = rowIds[r];
                var height = configuredHeights[r]; //configured with is what we care about
                rowsInfo.push({
                    id: id,
                    height: height,
                    index: r,
                    isHeader: false,
                    isFooter: false
                });
            }
            return rowsInfo;
        },
        //return an array of row info in object model form - {id:xxxx, height: strxxxx, index:0}
        _buildRowsObjectModelFromGrid: function (jqTable)
        {
            var rowsInfo = [];
            var rowIds = this._getRowIdsOnGrid(jqTable);
            var configuredHeights = this._getRowConfiguredHeightsOnGrid(jqTable);
            for (var r = 0; r < configuredHeights.length; r++)
            {
                var id = rowIds[r];
                var height = configuredHeights[r]; //configured height is what we care about
                rowsInfo.push({
                    id: id,
                    height: height,
                    index: r,
                    isHeader: false,
                    isFooter: false
                });
            }
            return rowsInfo;
        },
        //return array of column info in object model form  - {id:xxxx, width: strxxxx, renderWidth: xxx, index:0}
        _buildColumnsObjectModelFromTable: function (jqTable)
        {
            var columnsInfo = [];
            var colGroupCols = jqTable.find("colgroup").first().find("col");
            for (var c = 0; c < colGroupCols.length; c++)
            {
                var jqCol = colGroupCols.eq(c);
                var id = jqCol.attr("id"); //it would be better to use a standard method for this
                var width = jqCol.data("width"); //configured width is what we care about
                var renderWidth = jqCol[0].style["width"]; //jquery.css("width") will return pixel amounts so we have to go to the raw style

                columnsInfo.push({
                    id: id,
                    width: width,
                    renderWidth: renderWidth,
                    index: c
                });
            }
            return columnsInfo;
        },
        //return array of column info in object model form  - {id:xxxx, width: strxxxx, renderWidth: xxx, index:0}
        _buildColumnsObjectModelFromGrid: function (jqTable)
        {
            var columnsInfo = [];
            var columnIds = this._getColumnIdsOnGrid(jqTable);
            var configuredWidths = this._getColumnConfiguredWidthsOnGrid(jqTable);
            var renderWidths = this._getColumnRenderWidthsOnGrid(jqTable);
            for (var c = 0; c < configuredWidths.length; c++)
            {
                var id = columnIds[c];
                var width = configuredWidths[c]; //configured width is what we care about
                var renderWidth = renderWidths[c];
                columnsInfo.push({
                    id: id,
                    width: width,
                    renderWidth: renderWidth,
                    index: c
                });
            }
            return columnsInfo;
        },
        //#endregion Private - ObjectModel methods
        //#region Private - unsorted methods

        _createEmptyOptions: function ()
        {
            var options = {
                rowIds: [],
                rowHeights: [],
                columnIds: [],
                columnWidths: []
            };

            return options;
        },

        _getGridOptions: function (jqGrid)
        {
            var options = jqGrid.data("options");

            if (!checkExists(options))
            {
                options = this._createEmptyOptions();

                jqGrid.data("options", options);
            }

            return options;
        },

        _setCellColSpanFromCellInfo: function (cellInfo, jqTable)
        {
            var jqCell = this._getCellFromCellInfo(cellInfo);
            return this._setCellColSpan(jqTable, jqCell, cellInfo.col, cellInfo.colSpan);
        },

        _setCellRowSpanFromCellInfo: function (cellInfo, jqTable)
        {
            var jqCell = this._getCellFromCellInfo(cellInfo);
            return this._setCellRowSpan(jqTable, jqCell, cellInfo.row, cellInfo.rowSpan);
        },


        _setCellColSpan: function (jqTable, jqCell, col, colSpan)
        {
            if (this.isRenderedAsGrid(jqTable))
            {
                jqCell.css("grid-column-start", col + "");
                jqCell.css("grid-column-end", (col + colSpan) + "");

                if (this._isIE11())
                {
                    jqCell[0].style["grid-column-start"] = col;
                    jqCell[0].style["grid-column-end"] = colSpan;

                    jqCell[0].style["-ms-grid-column"] = col;
                    jqCell[0].style["-ms-grid-column-span"] = colSpan;
                }
            }

            jqCell.attr("colspan", colSpan);
            jqCell.attr("col", col);
        },

        _setCellRowSpan: function (jqTable, jqCell, row, rowSpan)
        {
            if (this.isRenderedAsGrid(jqTable))
            {
                jqCell.css("grid-row-start", row + "");
                jqCell.css("grid-row-end", (row + rowSpan) + "");

                if (this._isIE11())
                {
                    jqCell[0].style["grid-row-start"] = row;
                    jqCell[0].style["grid-row-end"] = rowSpan;

                    jqCell[0].style["-ms-grid-row"] = row;
                    jqCell[0].style["-ms-grid-row-span"] = rowSpan;
                }
            }

            jqCell.attr("rowspan", rowSpan);
            jqCell.attr("row", row);
        },

        _getCellFromId: function (tableArray, id)
        {
            var result = $();
            var foundCellInfo = this._getCellInfoFromId(tableArray, id);
            if (checkExists(foundCellInfo)) result = $("#" + id);

            return result;
        },

        _getCellFromCellInfo: function (cellInfo)
        {
            var id = (cellInfo.isRef === true) ? cellInfo.ref : cellInfo.id;
            return $("#" + id);
        },

        _getCellInfoFromId: function (tableArray, id)
        {
            var result = null;
            this._eachTableArrayCell(tableArray, function (cellInfo)
            {
                if (cellInfo.id === id)
                {
                    result = cellInfo;
                    return true;
                }
            });
            return result;
        },

        _getTableHTMLColumnIndex: function (tableArray, rowIndex, id)
        {
            var row = this._reduceRowWithoutReferences(tableArray, rowIndex);
            for (var i = 0; i < row.length; i++)
            {
                if (row[i] === id)
                {
                    return i;
                }
            }
            return -1;
        },


        //returns an array of the actual cells (ids) within a row.
        _reduceRowWithoutReferences: function (tableArray, rowIndex)
        {
            var currentRef = null;
            var reducedRow = [];
            for (var i = 0; i < tableArray[rowIndex].length; i++)
            {
                var cell = tableArray[rowIndex][i];

                if (cell.id !== undefined)
                {
                    reducedRow.push(cell.id);
                    if (cell.colSpan > 0)
                    {
                        i += (cell.colSpan - 1);
                    }
                }
            }
            return reducedRow;
        },

        _reduceRowWithReferences: function (tableArray, rowIndex, returnCell)
        {
            var currentRef = null;
            var reducedRow = [];
            for (var i = 0; i < tableArray[rowIndex].length; i++)
            {
                var cell = tableArray[rowIndex][i];

                if (cell.id !== undefined)
                {
                    if (returnCell !== undefined && returnCell)
                    {
                        reducedRow.push(cell);
                    }
                    else
                    {
                        reducedRow.push(cell.id);
                    }
                    if (cell.colSpan > 0)
                    {
                        i += (cell.colSpan - 1);
                    }
                }
                else if (cell.ref !== undefined)
                {
                    if (reducedRow !== undefined && returnCell)
                    {
                        reducedRow.push(cell);
                    }
                    else
                    {
                        reducedRow.push(cell.ref);
                    }

                    // TODO: refactor to use referenced element's colspan to increase index
                    // searches for first column that is NOT part of the current cell references
                    var ref = cell.ref;
                    while (i !== tableArray[rowIndex].length - 1 && cell.ref !== undefined)
                    {
                        i++;
                        cell = tableArray[rowIndex][i];

                        // add check that cell.ref is not undefined
                        if (cell.ref !== ref)
                        {
                            i--;
                            break;
                        }
                    }
                }
            }
            return reducedRow;
        },

        _removeRow: function (tableArray, pivotCell, position)
        {
            var rowIndex = pivotCell.parent()[0].rowIndex;
            var reducedRow = this._reduceRowWithReferences(tableArray, rowIndex, true);

            var cellOperations = [];
            var actualColumnIndex = null;
            for (var i = 0; i < reducedRow.length; i++)
            {
                var cell = reducedRow[i];
                if (cell.id !== undefined)
                {
                    if (cell.rowSpan > 1)
                    {
                        actualColumnIndex = this._getTableHTMLColumnIndex(tableArray, rowIndex, cell.id);

                        var reducedBottomRow = this._reduceRowWithReferences(tableArray, rowIndex + 1);
                        var moveToIndex = 0;
                        for (var k = 0; k < reducedBottomRow.length; k++)
                        {
                            if (reducedBottomRow[k] === cell.id)
                            {
                                moveToIndex = k;
                                break;
                            }
                        }

                        cellOperations.push({ action: "reduceRow", moveCell: true, row: rowIndex, col: actualColumnIndex, moveToCol: moveToIndex });
                    }
                    else
                    {
                        cellOperations.push({ action: "removeCell", id: cell.id });
                    }
                }
                else if (cell.ref !== undefined)
                {
                    var actualCell = this._getCellFromId(tableArray, cell.ref);
                    actualColumnIndex = this._getTableHTMLColumnIndex(tableArray, actualCell.row, actualCell.cell.id);
                    cellOperations.push({ action: "reduceRow", moveCell: false, row: actualCell.row, col: actualColumnIndex });
                }
            }

            return cellOperations;
        },

        //Get which rows to insert new cells into to make the new column
        //returns an array of indexes for each column 
        //e.g. [-1][1][1][4] - the first index says that a cell doesn't need to be made in that column
        _insertRow: function (tableArray, pivotCell, position)
        {
            var i = 0;
            var insertIndexes = [];
            var totalRows = tableArray.length;
            var totalColumns = (tableArray.length > 0) ? tableArray[0].length : 0;

            //pivotcell is typically the selectedCell
            var pivotCellInfo = this.getCellInfo(pivotCell);

            //insertAtRowIndex is the row that will be pushed down, when we add a row in.
            var insertAtRowIndex = position === 'before' ? pivotCellInfo.rowIndex : pivotCellInfo.rowIndex + pivotCellInfo.rowSpan;

            //-1 means do not add a cell in that row.
            for (i = 0; i < totalColumns; i++) insertIndexes.push(-1);

            // if it is the before the first row, no calculation required
            if (position === "before" && insertAtRowIndex === 0)
            {
                for (i = 0; i < totalColumns; i++) insertIndexes[i] = 0;
                return insertIndexes;
            }

            //inserting at the end
            var isInsertingAtEnd = insertAtRowIndex >= totalRows;
            if (isInsertingAtEnd)
            {
                for (i = 0; i < totalColumns; i++) insertIndexes[i] = insertAtRowIndex;
                return insertIndexes;
            }

            //attempt to work out which rows need a cell adding, and at which column position
            for (var colIndex = 0; colIndex < totalColumns; colIndex++)
            {

                //the cell at the next position be a ref from a cell that starts above.
                var actualCell = this.getActualCellInfoFromPosition(tableArray, insertAtRowIndex, colIndex);

                //if the cell in the next spot is a ref, then there is a colspan...
                //and we don't need to add a column cell to this row.
                var spansTheInsertRow = (actualCell.rowIndex < insertAtRowIndex) &&
                    (actualCell.rowIndex + actualCell.rowSpan - 1 >= insertAtRowIndex);

                //negative numbers mean that there is a colspan
                var number = spansTheInsertRow ? -1 : insertAtRowIndex;
                insertIndexes[colIndex] = number;
            }
            return insertIndexes;
        },


        //returns an array of indexes
        //doesn't actually remove a column!
        _removeColumn: function (tableArray, selectedCell)
        {
            var cellInfo = this.getCellInfo(selectedCell);
            var colIndex = cellInfo.colIndex;
            var cellReferences = [];
            // TODO: refactor logic into _getCellReferences function

            //for each row in the table (for each cell in a column)
            for (var i = 0; i < tableArray.length; i++)
            {
                var cellRef = tableArray[i][colIndex];
                if (cellRef.id !== undefined)
                {
                    cellReferences.push(cellRef.id);
                }
                else if (cellRef.ref !== undefined)
                {
                    cellReferences.push(cellRef.ref);
                }
            }

            var found = false;
            var removeIndexes = [];

            //for each cell/ref in the column
            for (i = 0; i < cellReferences.length; i++)
            {
                found = false;

                //just the ids in the row (i.e, cells that start in this row)
                var reducedRow = this._reduceRowWithoutReferences(tableArray, i);
                for (var j = 0; j < reducedRow.length; j++)
                {
                    var cell = reducedRow[j];
                    if (cell === cellReferences[i])
                    {
                        removeIndexes.push(j);
                        found = true;
                        break;
                    }
                }

                if (!found)
                {
                    // a -1 index means we skip the row
                    removeIndexes.push(-1);
                }
            }
            return removeIndexes;
        },

        // Calculates where new cells must be added to form a new column.
        // --------------------------------------------------------------
        // table: html table
        // tableArray: the array representation of the html table
        // pivotCell: the pivot cell from which to calculate the new column
        // position: either before or after
        // Returns: A position in each column of where to insert a cell (-1 if not to insert in that row)
        _insertColumn: function (tableArray, pivotCell, position)
        {
            var i = 0;
            var insertIndexes = [];
            var totalRows = tableArray.length;
            var totalColumns = (tableArray.length > 0) ? tableArray[0].length : 0;

            //pivotcell is typically the selectedCell
            var pivotCellInfo = this.getCellInfo(pivotCell);

            //insertAtColIndex is the column that will be pushed right, when we add a column in.
            var insertAtColIndex = position === 'before' ? pivotCellInfo.colIndex : pivotCellInfo.colIndex + pivotCellInfo.colSpan;

            //-1 means do not add a cell in that row.
            for (i = 0; i < totalRows; i++) insertIndexes.push(-1);

            // if it is the before the first column, no calculation required
            if (position === "before" && insertAtColIndex === 0)
            {
                for (i = 0; i < totalRows; i++) insertIndexes[i] = 0;
                return insertIndexes;
            }

            //inserting at the end
            var isInsertingAtEnd = insertAtColIndex >= totalColumns;
            if (isInsertingAtEnd)
            {
                for (i = 0; i < totalRows; i++) insertIndexes[i] = insertAtColIndex;
                return insertIndexes;
            }

            //attempt to work out which rows need a cell adding, and at which column position
            for (var rowIndex = 0; rowIndex < totalRows; rowIndex++)
            {

                //the cell at the next position be a ref from a cell that starts above.
                var actualCell = this.getActualCellInfoFromPosition(tableArray, rowIndex, insertAtColIndex);

                //if the cell in the next spot is a ref, then there is a colspan...
                //and we don't need to add a column cell to this row.
                var spansTheInsertColumn = (actualCell.colIndex < insertAtColIndex) &&
                    (actualCell.colIndex + actualCell.colSpan - 1 >= insertAtColIndex);


                //negative numbers mean that there is a colspan
                var number = spansTheInsertColumn ? -1 : insertAtColIndex;
                insertIndexes[rowIndex] = number;
            }
            return insertIndexes;
        },

        //used when inserting Rows or Columns into a table
        //TODO: Maybe rather use  this._copyCellInfoToNewCell instead
        _copyAttributesToNewColumnCell: function (jqSourceCell, jqNewCell)
        {
            jqNewCell.attr("rowspan", jqSourceCell.attr("rowspan"));

            //Style also copies the grid-row-start and grid-row-end for grids
            jqNewCell.attr("style", jqSourceCell.attr("style"));

        },

        //used when inserting Rows or Columns into a table
        _copyAttributesToNewRowCell: function (jqSourceCell, jqNewCell)
        {
            jqNewCell.attr("colspan", jqSourceCell.attr("colspan"));

            //Style also copies the grid-column-start and grid-column-end for grids
            jqNewCell.attr("style", jqSourceCell.attr("style"));
        },

        //ultility method
        _getParentOrCurrentElementThatIs: function (jqElement, selector)
        {
            if (jqElement.is(selector)) return jqElement;

            var matchingParents = jqElement.parents(selector);
            if (matchingParents.length > 0)
            {
                return matchingParents.eq(0);
            }
            else
            {
                return $();
            }
        },

        //#endregion Private - unsorted methods

        //#region Private - Adding Rows/Columns

        //template - optional string of html for a row - this is used by tablebehavior when creating a
        //           new table from the database's default table html template
        _addNewRowDefinitionAfterForTable: function (rowIndex, strHeight, jqTable, id, template)
        {
            var jqNewRow = checkExists(template) ? $(template) : this._createTableRowDefinition(strHeight, id);
            var id = jqNewRow.attr("id");
            var jqRows = jqTable.find(">tbody>tr");
            var pivotRow = jqRows.eq(rowIndex);

            pivotRow.after(jqNewRow);
            return id;
        },

        //update the cell DOM to reflect what in each Cell, with ROW information.
        _updateCellsRowInfoFromCellInfo: function (cellInfoArray, jqTable)
        {
            for (var i = 0; i < cellInfoArray.length; i++)
            {
                var cellInfo = cellInfoArray[i];
                var jqCell = this._getCellFromTableArrayCell(cellInfo, jqTable);
                //set the row/col/colspan related properties on the cell
                this._setCellRowSpan(jqTable, jqCell, cellInfo.row, cellInfo.rowSpan);
            }
        },
        //update the cell DOM to reflect what in each Cell, with COLUMN information.
        _updateCellsColumnInfoFromCellInfo: function (cellInfoArray, jqTable)
        {
            for (var i = 0; i < cellInfoArray.length; i++)
            {
                var cellInfo = cellInfoArray[i];
                var jqCell = this._getCellFromTableArrayCell(cellInfo, jqTable);
                //set the row/col/colspan related properties on the cell
                this._setCellColSpan(jqTable, jqCell, cellInfo.col, cellInfo.colSpan);
            }
        },
        //update all cells that need to be when a new row is about to be inserted.
        _updateCellsAfterRowIndex: function (rowIndex, rowAmount, jqTable)
        {
            var tableArray = this.getTableArray(jqTable);
            var cellInfoToBeUpdated = [];
            var isAdding = rowAmount > 0;
            var rangeRowLineStart = rowIndex;
            var rangeRowLineEnd = rowIndex + Math.abs(rowAmount);

            this._eachTableArrayCell(tableArray, function (cellInfo)
            {
                var shouldUpdate = false;
                //uses orginal rowspans before merging.
                var cellRowLineStart = cellInfo.rowIndex;
                var cellRowLineEnd = cellInfo.rowIndex + cellInfo.rowSpan;

                //Update rowspans for cells straddingle the insert location or delete range
                if (isAdding)
                {
                    if (cellRowLineStart < rowIndex && cellRowLineEnd > rowIndex)
                    {
                        cellInfo.rowSpan = Math.max(1, cellInfo.rowSpan + rowAmount);
                        shouldUpdate = true;
                    }
                }
                else
                {
                    // Deleting Columns - work out if there is  overlap of this cell into the deleting rows
                    var overlap = this._getOverlap(rangeRowLineStart, rangeRowLineEnd, cellRowLineStart, cellRowLineEnd);
                    if (overlap > 0)
                    {
                        cellInfo.rowSpan = Math.max(1, cellInfo.rowSpan + (-1 * overlap));
                        shouldUpdate = true;
                    }
                }

                //if the cell is after the row(s) being removed, then its "grid-row-start" will need updating
                if (cellRowLineStart > rangeRowLineStart || (isAdding && cellRowLineStart === rangeRowLineStart))
                {
                    cellInfo.rowIndex += rowAmount;

                    //For cells that have row indexs that will go smaller than the index of the row been removed, it should clap to the index of row been removed.
                    cellInfo.rowIndex = Math.max(rangeRowLineStart, cellInfo.rowIndex);

                    cellInfo.row = cellInfo.rowIndex + 1;
                    shouldUpdate = true;
                }

                if (shouldUpdate) cellInfoToBeUpdated.push(cellInfo);
            });

            this._updateCellsRowInfoFromCellInfo(cellInfoToBeUpdated, jqTable);
        },

        //update all cells that need to be when a new column is about to be inserted/removed.
        _updateCellsAfterColumnIndex: function (colIndex, colAmount, jqTable)
        {
            var tableArray = this.getTableArray(jqTable);
            var cellInfoToBeUpdated = [];
            var isAdding = colAmount > 0;
            var rangeColLineStart = colIndex;
            var rangeColLineEnd = colIndex + Math.abs(colAmount);


            this._eachTableArrayCell(tableArray, function (cellInfo)
            {
                var shouldUpdate = false;
                var cellColLineStart = cellInfo.colIndex;
                var cellCollLineEnd = cellInfo.colIndex + cellInfo.colSpan;

                //uses orginal rowspans before merging.

                //if the cell is straddling the column being removed/added.
                //Example - if we remove the 2nd column AND 4th column, there will be more than one merge
                //          distance that will affect the top cell (which spans 6 columns)
                //[         6            ]
                //[   2  ][   2  ][   2  ]
                //[1 ][ 1][1 ][ 1][1 ][ 1]
                //reduce the colspan by 1 for each column within its span that is getting removed.
                
                //Update Colspans for cells straddingle the insert location or delete range
                if (isAdding)
                {
                    if (cellColLineStart < colIndex && cellCollLineEnd > colIndex)
                    {
                        cellInfo.colSpan = Math.max(1, cellInfo.colSpan + colAmount);
                        shouldUpdate = true;
                    }
                }
                else
                {
                    // Deleting Columns - work out if there is  overlap of this cell into the deleting columns
                    
                    var overlap = this._getOverlap(rangeColLineStart, rangeColLineEnd, cellColLineStart, cellCollLineEnd);
                    if (overlap > 0)
                    {
                        cellInfo.colSpan = Math.max(1, cellInfo.colSpan + (-1 * overlap));
                        shouldUpdate = true;
                    }
                }
                
               
                //if columns are being added, then cells in this column (colIndex) must also be updated
                //if the cell is after thecolumn being removed, then its "grid-column-start" will need updating
                if (cellColLineStart > rangeColLineStart || (isAdding && cellColLineStart === rangeColLineStart))
                {
                    cellInfo.colIndex += colAmount;

                    //For cells that have column indexs that will go smaller than the index of the column been removed, it should clap to the index of column been removed.
                    cellInfo.colIndex = Math.max(rangeColLineStart, cellInfo.colIndex);

                    cellInfo.col = cellInfo.colIndex + 1;
                    shouldUpdate = true;
                }

                if (shouldUpdate) cellInfoToBeUpdated.push(cellInfo);
            });

            this._updateCellsColumnInfoFromCellInfo(cellInfoToBeUpdated, jqTable);
        },

        _getOverlap: function (start1, end1, start2, end2) 
        {
            var overlap = 0;

            if (start2 >= start1 && start2 <= end1)
            {
                overlap = Math.min(end1, end2) - start2;
            }
            else if (end2 >= start1 && end2 <= end1)
            {
                overlap = end2 - Math.max(start1, start2);
            }
            else if (end2 >= end1 && start2 <= start1)
            {
                overlap = end1 - start1; //completed straddles obj1
            }


            return overlap;
        },

        //Adding rowDefinitions
        _addNewRowDefinitionAfterOnGrid: function (rowIndex, strHeight, jqTable, id)
        {
            var insertPosition = rowIndex+1;
            return this._addNewRowDefinitionAtRowIndexOnGrid(insertPosition, strHeight, jqTable, id);
        },

        //Adding rowDefinitions
        _addNewRowDefinitionAtForTable: function (rowIndex, strHeight, jqTable, id)
        {
            var jqNewRow = this._createTableRowDefinition(strHeight, id);
            var id = jqNewRow.attr("id");
            var jqRows = jqTable.find(">tbody>tr");
            var pivotRow = jqRows.eq(rowIndex);
            if (pivotRow.length>0)
                pivotRow.before(jqNewRow);
            else
                jqRows.parent().append(jqNewRow);

            this._updateCellsAfterRowIndex(rowIndex, 1, jqTable);

            return { id: id, height: strHeight };
        },

        //Adding rowDefinitions
        _addNewRowDefinitionAtOnGrid: function (rowIndex, strHeight, jqTable, id)
        {
            var insertPosition = Math.max(rowIndex, 0);
            return this._addNewRowDefinitionAtRowIndexOnGrid(insertPosition, strHeight, jqTable, id);
        },

        _addNewColumnDefinitionAtForTable: function (colIndex, strWidth, jqTable, id)
        {
            var jqNewCol = this._createTableColumnDefinition(strWidth, id);
            var id = jqNewCol.attr("id");
            var jqCols = jqTable.find(">colgroup>col");
            var pivotColumn = jqCols.eq(colIndex);
            if (pivotColumn.length > 0)
                pivotColumn.before(jqNewCol);
            else
                jqCols.parent().append(jqNewCol);

            this._updateCellsAfterColumnIndex(colIndex, 1, jqTable);

            return { id: id, width: strWidth };
        },

        _addNewColumnDefinitionAtOnGrid: function (colIndex, strWidth, jqTable, id)
        {
            var insertPosition = Math.max(colIndex, 0);
            return this._addNewColumnDefinitionAtColIndexOnGrid(insertPosition, strWidth, jqTable, id);
        },
      
        _addNewColumnDefinitionAtEndForTable: function (strWidth, jqTable, id)
        {
            var jqNewCol = this._createTableColumnDefinition(strWidth, id);
            var id = jqNewCol.attr("id");
            var jqColGroup = jqTable.find(">colgroup");

            jqColGroup.append(jqNewCol);
            return { id: id, width: strWidth };
        },

        _addNewColumnDefinitionAtEndOnGrid: function (strWidth, jqTable, id)
        {
            var ids = this._getColumnIdsOnGrid(jqTable);
            var insertPosition = ids.length - 1;
            return this._addNewColumnDefinitionAtColIndexOnGrid(insertPosition, strWidth, jqTable, id);
        },

        //Generic grid method used by insert before/after/at-end
        _addNewColumnDefinitionAtColIndexOnGrid: function (colIndex, strWidth, jqTable, id)
        {
            var tableArray = SourceCode.Forms.TableHelper._getTableArray(jqTable);
            var maxCols = this._getColCountInTableArray(tableArray);
            var insertPosition = Math.min(colIndex, maxCols);

            //update the cells after this new col to have +1 on their grid-row-start, grid-row-end
            var startColIndex = colIndex;
            this._updateCellsAfterColumnIndex(startColIndex, 1, jqTable);

            //update ids
            if (!checkExists(id)) id = String.generateGuid();
            var ids = this._getColumnIdsOnGrid(jqTable);
            ids.splice(insertPosition, 0, id);
            this._setColumnIdsOnGrid(ids, jqTable);

            //update configured widths
            var configuredWidths = this._getColumnConfiguredWidthsOnGrid(jqTable);
            configuredWidths.splice(insertPosition, 0, strWidth);
            this._setColumnConfiguredWidthsOnGrid(configuredWidths, jqTable);

            //update rendered widths
            var renderedWidths = this._getColumnRenderWidthsOnGrid(jqTable);
            renderedWidths.splice(insertPosition, 0, strWidth);
            this._setColumnRenderWidthsOnGrid(renderedWidths, jqTable);

            return { id: id, width: strWidth, index: colIndex };
        },

        //Generic grid method used by insert before/after/at-end
        _addNewRowDefinitionAtRowIndexOnGrid: function (rowIndex, strHeight, jqTable, id)
        {
            var maxRows = this.getRowCountInTableArray(jqTable);
            var insertPosition = Math.min(rowIndex, maxRows);

            //update the cells after this new row to have +1 on their grid-row-start, grid-row-end
            var startRowIndex = rowIndex;
            this._updateCellsAfterRowIndex(insertPosition, 1, jqTable);

            //update ids
            id = checkExists(id) ? id : String.generateGuid();
            var ids = this._getRowIdsOnGrid(jqTable);
            ids.splice(insertPosition, 0, id);
            this._setRowIdsOnGrid(ids, jqTable);

            //update configured heights
            var configuredHeights = this._getRowConfiguredHeightsOnGrid(jqTable);
            configuredHeights.splice(insertPosition, 0, strHeight);
            this._setRowConfiguredHeightsOnGrid(configuredHeights, jqTable);

            //update rendered heights
            var renderedHeights = this._getRowRenderedHeightsOnGrid(jqTable);
            renderedHeights.splice(insertPosition, 0, strHeight);
            this._setRowRenderedHeightsOnGrid(renderedHeights, jqTable);

            return { id: id, height: strHeight, index: rowIndex };
        },

        _getColumnIds: function (jqTable)
        {
            if (this.isRenderedAsTable(jqTable))
            {
                return this._getColumnIdsForTable(jqTable);
            }

            return this._getColumnIdsOnGrid(jqTable);
        },

        _setColumnId: function (id, colIndex, jqTable)
        {
            if (this.isRenderedAsTable(jqTable))
            {
                return this._setColumnIdForTable(id, colIndex, jqTable);
            }

            return this._setColumnIdOnGrid(id, colIndex, jqTable);
        },

        //just a helper function for table, assumes jqTable is a table element with <colgroup>, <tr>s and <td>s
        _getColumnIdsForTable: function (jqTable)
        {
            var cols = jqTable.find("> colgroup > col");

            var idArray = [];
            for (var i = 0; i < cols.length; i++)
            {
                idArray.push(cols.attr("id"));
            }

            return idArray;
        },

        //just a helper function for table, assumes jqTable is a table element with <colgroup>, <tr>s and <td>s
        _setColumnIdsForTable: function (idArray, jqTable)
        {
            var cols = jqTable.find("> colgroup > col");

            for (var i = 0; i < idArray.length; i++)
            {
                cols.eq(i).attr("id", idArray[i].trim());
            }
        },

        _setColumnIdForTable: function (id, colIndex, jqTable)
        {
            var cols = jqTable.find("> colgroup > col");

            cols.eq(colIndex).attr("id", id);
        },

        //just a helper function for table, assumes jqTable is a table element with <colgroup>, <tr>s and <td>s
        _getRowIdsForTable: function (jqTable)
        {
            var rows = jqTable.find("> tbody > tr");

            var idArray = [];
            for (var i = 0; i < rows.length; i++)
            {
                idArray.push(rows.attr("id"));
            }

            return idArray;
        },

        //just a helper function for table, assumes jqTable is a table element with <colgroup>, <tr>s and <td>s
        _setRowIdsForTable: function (idArray, jqTable)
        {
            var rows = jqTable.find("> tbody > tr");

            for (var i = 0; i < idArray.length; i++)
            {
                rows.eq(i).attr("id", idArray[i].trim());
            }
        },

        _getColumnIdsOnGrid: function (jqGrid)
        {
            var options = this._getGridOptions(jqGrid);

            var idArray = checkExists(options.columnIds) ? options.columnIds : [];

            return idArray;
        },

        _setColumnIdsOnGrid: function (idArray, jqGrid)
        {
            var options = this._getGridOptions(jqGrid);
            options.columnIds = idArray;
        },

        _setColumnIdOnGrid: function (id, colIndex, jqGrid)
        {
            var idArray = this._getColumnIdsOnGrid(jqGrid);
            idArray[colIndex] = id;
            this._setColumnIdsOnGrid(idArray, jqGrid);
        },

        _getRowIdsOnGrid: function (jqGrid)
        {
            var options = jqGrid.data("options");
            var idArray = checkExists(options.rowIds) ? options.rowIds : [];
            return idArray;
        },

        _setRowIdsOnGrid: function (idArray, jqGrid)
        {
            var options = this._getGridOptions(jqGrid);
            options.rowIds = idArray;
        },

        _setRowIdOnGrid: function (id, rowIndex, jqGrid)
        {
            var idArray = this._getRowIdsOnGrid(jqGrid);
            idArray[rowIndex] = id;
            this._setRowIdsOnGrid(idArray, jqGrid);
        },

        //just creates the <TR> does not append it anywhere
        _createTableRowDefinition: function (height, id)
        {
            if (!checkExists(id)) id = String.generateGuid();
            var _row = $(this.TRTAG);

            _row.attr("id", id);
            _row.height(height);
            _row.data("height", height);
            return _row;
        },

        //just creates the table <COL> doesn't append it anywhere.
        _createTableColumnDefinition: function (width, id)
        {
            if (!checkExists(id)) id = String.generateGuid();
            var _col = $(this.COLTAG);

            _col.attr("id", id);
            _col.width(width);
            _col.data("width", width);
            return _col;
        },

        //used by column insert code in tablebehavior.js - inserting cells into a Column!
        //position: 'after', 'before' etc
        //rowInsertPosition is setup by this._insertColumn(), it is a column index for this row
        //returns: jqCell
        _addCellAtPositionWithRowInsertionDataForTable: function (jqTable, cellInfoToCopy, id, position, rowInsertPosition)
        {

            var tableArray = this.getTableArray(jqTable);
            var columnCount = tableArray[0].length;
            var isInsertingAtEnd = rowInsertPosition >= columnCount;
            var colSpan = 1;
            var rowSpan = 1;
            var rowIndex = cellInfoToCopy.rowIndex;
            var colIndex = cellInfoToCopy.colIndex;

            if (rowInsertPosition > -1)
            {

                if (!checkExists(id)) id = new String().generateGuid();
                var jqRows = jqTable.find(">tbody>tr");
                var jqRow = jQuery(jqRows[rowIndex]);

                //Create a cell ready to be added to the DOM
                var newCell = this.createEmptyCell(jqTable, id);
                this._copyCellInfoToNewCell(jqTable, newCell, cellInfoToCopy);

                if (!isInsertingAtEnd) 
                {
                    //attempt finding a cell to insert after in the same row.
                    var refCellInfo = this.getActualCellInfoFromPosition(tableArray, rowIndex, Math.max(rowInsertPosition, 0));

                    //insert cell into DOM
                    //the refCell might be a cell with a rowSpan from above, in which case our insertposition is false.
                    //we only have to do this for Table rendering
                    if (checkExists(refCellInfo) && refCellInfo.rowIndex === rowIndex)
                    {
                        var refCell = this._getCellFromCellInfo(refCellInfo);
                        refCell.before(newCell);
                    }
                    else
                    {
                        //get Previous cell in row to insert after.
                        var previousCellInfoInRow = this._getPreviousCellInfoInRowFromPosition(rowIndex, colIndex, tableArray);
                        if (checkExists(previousCellInfoInRow))
                        {
                            var refCell = this._getCellFromCellInfo(previousCellInfoInRow);
                            refCell.after(newCell);
                        }
                        else
                        {
                            //add as first cell in row 
                            //(if every other colposition is taken by cells merged down into this row from above)
                            jqRow.prepend(newCell);
                        }
                    }
                }
                else
                {
                    jqRow.append(newCell);
                }

                return newCell;
            }
            else
            {
                //need to get the cell at this position and increase it's colspan
                var cellInfo = this.getActualCellInfoFromPosition(tableArray, rowIndex, colIndex);
                var newColSpan = cellInfo.colSpan + 1;
                var jqCell = this.setCellColSpan(cellInfo, newColSpan);
                return jqCell;
            }
        },

        //used by column insert code in tablebehavior.js - inserting a cells into a Column!
        //position: 'after', 'before' etc
        //rowInsertPosition is setup by this._insertColumn()
        _addCellAtPositionWithRowInsertionDataOnGrid: function (jqTable, cellInfoToCopy, id, position, rowInsertPosition)
        {
            var tableArray = this.getTableArray(jqTable);
            var columnCount = tableArray[0].length;
            var isInsertingAtEnd = rowInsertPosition >= columnCount;
            var colSpan = 1;
            var rowSpan = 1;
            var rowIndex = cellInfoToCopy.rowIndex;
            var colIndex = cellInfoToCopy.colIndex;

            if (rowInsertPosition > -1)
            {
                if (!checkExists(id)) id = new String().generateGuid();

                //Create a cell
                var newCell = this.createEmptyCell(jqTable, id);
                this._copyCellInfoToNewCell(jqTable, newCell, cellInfoToCopy);
                jqTable.append(newCell);

                return newCell;
            }
            //else
            //{
            //    //need to get the cell at this position and increase it's colspan
            //    var cellInfo = this.getActualCellInfoFromPosition(tableArray, rowIndex, colIndex);
            //    var newColSpan = cellInfo.colSpan + 1;
            //    this.setCellColSpan(cellInfo, newColSpan);
            //}
        },


        //used by row insert code in tablebehavior.js - inserting a cells into a new Row!
        //position: 'after', 'before' etc
        //colInsertPosition is setup by this._insertRow(), it is a row index for this column
        _addCellAtPositionWithColumnInsertionDataForTable: function (jqTable, cellInfoToCopy, id, position, columnInsertPosition)
        {

            var tableArray = this.getTableArray(jqTable);
            var rowCount = this.getRowCountInTableArray(jqTable);
            var isInsertingAtEnd = columnInsertPosition >= rowCount;
            var colSpan = 1;
            var rowSpan = 1;
            var rowIndex = cellInfoToCopy.rowIndex;
            var colIndex = cellInfoToCopy.colIndex;

            if (columnInsertPosition > -1)
            {

                if (!checkExists(id)) id = new String().generateGuid();

                //get the row to insert into
                var jqRows = jqTable.find(">tbody>tr");
                var jqRow = jQuery(jqRows[columnInsertPosition]);

                //Create a cell ready to be added to the DOM
                var newCell = this.createEmptyCell(jqTable, id);
                this._copyCellInfoToNewCell(jqTable, newCell, cellInfoToCopy);

                //insert the cell into the DOM in the right place
                if (!isInsertingAtEnd)
                {
                    //get the cell in the row we are inserting before.
                    var actualCellInfo = this.getActualCellInfoFromPosition(tableArray, Math.max(columnInsertPosition, 0), colIndex);

                    colSpan = actualCellInfo.colSpan;
                    jqRow.append(newCell);
                }
                else
                {
                    jqRow.append(newCell);
                }

                return newCell;
            }
            else
            {
                //need to get the cell at this position and increase it's colspan
                var cellInfo = this.getActualCellInfoFromPosition(tableArray, rowIndex, colIndex);
                var newRowSpan = cellInfo.rowSpan + 1;
                this.setCellRowSpan(cellInfo, newRowSpan);

            }
        },

        //used by row insert code in tablebehavior.js  - inserting a cells into a Row!
        //position: 'after', 'before' etc
        //colInsertPosition is setup by this._insertRow(), it is a row index for this column
        _addCellAtPositionWithColumnInsertionDataOnGrid: function (jqTable, cellInfoToCopy, id, position, columnInsertPosition)
        {
            var tableArray = this.getTableArray(jqTable);
            var rowCount = this.getRowCountInTableArray(jqTable);
            var isInsertingAtEnd = columnInsertPosition >= rowCount;
            var colSpan = 1;
            var rowSpan = 1;
            var rowIndex = cellInfoToCopy.rowIndex;
            var colIndex = cellInfoToCopy.colIndex;

            if (columnInsertPosition > -1)
            {
                if (!checkExists(id)) id = new String().generateGuid();

                //Create a cell
                var newCell = this.createEmptyCell(jqTable, id);
                this._copyCellInfoToNewCell(jqTable, newCell, cellInfoToCopy);
                jqTable.append(newCell);

                return newCell;
            }
            //else
            //{
            //    //need to get the cell at this position and increase it's colspan
            //    var cellInfo = this.getActualCellInfoFromPosition(tableArray, rowIndex, colIndex);
            //    var newRowSpan = cellInfo.rowSpan + 1;
            //    this.setCellRowSpan(cellInfo, newRowSpan);
            //}
        },


        //add all the positional attributes to a cell, that are needed for 
        // * GetTableArray to function correctly (row, col)
        // * Rendering correctly (rowspan, colspan, grid-col-start etc etc)
        _copyCellInfoToNewCell: function (jqTable, jqCell, cellInfo)
        {
            if (!(jqCell.length > 0 && checkExists(cellInfo))) return;

            //validate input to method, make sure the cellObjectModel is fileed
            if (!cellInfo.row) cellInfo.row = cellInfo.rowIndex + 1;
            if (!cellInfo.col) cellInfo.col = cellInfo.colIndex + 1;
            if (!cellInfo.rowSpan) cellInfo.rowSpan = 1;
            if (!cellInfo.colSpan) cellInfo.colSpan = 1;

            this._setCellColSpan(jqTable, jqCell, cellInfo.col, cellInfo.colSpan);
            this._setCellRowSpan(jqTable, jqCell, cellInfo.row, cellInfo.rowSpan);
        },

        _isIE11: function ()
        {
            return (SourceCode.Forms.Browser.msie && SourceCode.Forms.Browser.version.indexOf("11.0") >= 0);
        },

        //#endregion Private - unsorted methods

        //#region Private - removing Unneeded Cols/Rows


        // for each column width definition (<Col>), work out whether it should merge with a column next to it, 
        // and by how many columns - i.e. should it merge with just the column next to it, or with 2 columns next to it.
        // this is based on the "colspans" found in the table cells. 
        _getColumnMergeDistances: function (tableArray, jqTable)
        {
            var totalRows = this._getColCountInTableArray(tableArray); //jqRowsInTable.length;
            var colMergeDistances = this._initializeColumnMergeDistances(jqTable);
            var verticallyMergedCellsInColumn = {};

            //the column must all be refs to be able to delete it.
            var colsCanBeDeleted = [];
            this._everyTableArrayCell(tableArray, function (cell)
            {
                var colIndex = cell.colIndex;
                if (!checkExists(colsCanBeDeleted[colIndex]))
                {
                    colsCanBeDeleted[colIndex] = true;
                }
                if (!cell.isRef)
                {
                    colsCanBeDeleted[colIndex] = false;
                }
            });

            var indextoadd = 0;
            for (var i = 0; i < colsCanBeDeleted.length; i++)
            {
                if (colsCanBeDeleted[i] === true)
                {
                    colMergeDistances[indextoadd]++;
                }
                else
                {
                    indextoadd = i;
                }
            }

            //return TableInfo
            return colMergeDistances;
        },


        //new way
        _getRowMergeDistances: function (tableArray, jqTable)
        {
            var totalRows = this._getRowCountInTableArray(tableArray); //jqRowsInTable.length;
            var rowMergeDistances = this._initializeRowMergeDistances(jqTable);

            //the column must all be refs to be able to delete it.
            var rowsCanBeDeleted = [];
            this._everyTableArrayCell(tableArray, function (cell)
            {
                var rowIndex = cell.rowIndex;
                if (!checkExists(rowsCanBeDeleted[rowIndex]))
                {
                    rowsCanBeDeleted[rowIndex] = true;
                }
                if (!cell.isRef)
                {
                    rowsCanBeDeleted[rowIndex] = false;
                }
            });

            var indextoadd = 0;
            for (var i = 0; i < rowsCanBeDeleted.length; i++)
            {
                if (rowsCanBeDeleted[i] === true)
                {
                    rowMergeDistances[indextoadd]++;
                }
                else
                {
                    indextoadd = i;
                }
            }

            //return TableInfo
            return rowMergeDistances;
        },


        //makes an entry in the tracker for each <col> in the <colgroup>.
        _initializeColumnMergeDistances: function (jqTable)
        {
            var colWidths = this._getConfiguredColumnWidths(jqTable);
            var colMergeDistances = {};
            for (var i = 0; i < colWidths.length; i++)
            {
                colMergeDistances[i] = 0;
            }
            return colMergeDistances;
        },

        //makes an entry in the tracker for each <col> in the <colgroup>.
        _initializeRowMergeDistances: function (jqTable)
        {
            var rowHeights = this._getRowConfiguredHeights(jqTable);
            var rowMergeDistances = {};
            for (var i = 0; i < rowHeights.length; i++)
            {
                rowMergeDistances[i] = 0;
            }
            return rowMergeDistances;
        },

        //merge the column widths of the <COLS> that can be merged.
        _mergeColumnWidthsUsingMergeDistances: function (jqTable, colMergeDistances)
        {
            var colWidths = this._getConfiguredColumnWidths(jqTable);
            var INITIAL_MERGEDISTANCE = colWidths.length;

            for (var colitemkey in colMergeDistances)
            {
                var colindex = parseInt(colitemkey);
                var colMergeDistance = colMergeDistances[colitemkey];

                //if the col can be merged right jqCols.length times, then it shouldn't be touched
                // as that is the initial value when we initialized colMergeDistances.
                var isMergeableColumn = (colMergeDistance !== INITIAL_MERGEDISTANCE && colMergeDistance > 0);
                if (isMergeableColumn && colindex < colWidths.length - 1)//we can't merge the last column to the right!
                {
                    // After this, the master will have the merged width.
                    // e.g. if we are merging 3 columns, the 1st column will have the merged width. 
                    //      then the other columns can be removed (the 2 slave columns)
                    for (var i = 1; i <= colMergeDistance; i++)
                    {
                        this._mergeColumnRenderWidths(colindex, colindex + i, jqTable);
                        this._mergeColumnConfiguredWidths(colindex, colindex + i, jqTable);
                    }
                }
            }
        },


        //merge the row widths of the rows that can be merged.
        _mergeRowHeightsUsingMergeDistances: function (jqTable, rowMergeDistances)
        {
            var rowHeights = this._getRowConfiguredHeights(jqTable);
            var INITIAL_MERGEDISTANCE = rowHeights.length;

            for (var rowitemkey in rowMergeDistances)
            {
                var rowindex = parseInt(rowitemkey);
                var rowMergeDistance = rowMergeDistances[rowitemkey];

                //if the col can be merged right jqCols.length times, then it shouldn't be touched
                // as that is the initial value when we initialized colMergeDistances.
                var isMergeableRow = (rowMergeDistance !== INITIAL_MERGEDISTANCE && rowMergeDistance > 0);
                if (isMergeableRow && rowindex < rowHeights.length - 1)//we can't merge the last row down!
                {
                    // After this, the master will have the merged height.
                    // e.g. if we are merging 3 rows, the 1st column will have the merged width. 
                    //      then the other rows can be removed (the 2 slave rows)
                    for (var i = 1; i <= rowMergeDistance; i++)
                    {
                        this._mergeRowHeights(rowindex, rowindex + i, jqTable);
                    }
                }
            }
        },

        //if any of the rows are a filled with cells rowSpanning into (from above) or out of this row (to below from this row)
        //preserve the height of the row with render height. This stops cells from collapsing when merged, but the row cannot be logically removed.
        _preserveRowHeightForRowsWithOnlyRowSpanCells: function (tableArray, jqTable)
        {
            var i = 0;
            var rowsToPreserveHeight = [];
            for (i = 0; i < tableArray.length; i++) rowsToPreserveHeight.push(true);
            this._everyTableArrayCell(tableArray, function (cellInfo)
            {
                if (!cellInfo.isRef && cellInfo.rowSpan === 1) rowsToPreserveHeight[cellInfo.rowIndex] = false;
            });

            for (i = 0; i < rowsToPreserveHeight.length; i++)
            {
                //if the row doesn't have a configured height
                //set the height on the row
                if (rowsToPreserveHeight[i] === true)
                {
                    var configuredHeight = this._getConfiguredRowHeight(jqTable, i);
                    if (this._isDimensionAuto(configuredHeight))
                    {
                        this._setRowRenderedHeight(this.MIN_ROW_HEIGHT + "px", i, jqTable);
                    }
                }
            }
        },


        //if any of the columns are a filled with cells colSpanning into (from left) or out of this col (to right from this col)
        //preserve the width of the col  with render width. This stops cells from collapsing when merged, but the col cannot be logically removed.
        _preserveColumnWidthForColumnsWithOnlyColSpanCells: function (tableArray, jqTable)
        {
            var i = 0;
            var columnsToPreserveWidth = [];
            var totalColumns = (tableArray.length > 0) ? tableArray[0].length : 0;
            for (i = 0; i < totalColumns; i++) columnsToPreserveWidth.push(true);
            this._everyTableArrayCell(tableArray, function (cellInfo)
            {
                if (!cellInfo.isRef && cellInfo.colSpan === 1) columnsToPreserveWidth[cellInfo.colIndex] = false;
            });

            for (i = 0; i < columnsToPreserveWidth.length; i++)
            {
                //if the col doesn't have a configured width
                //set the width on the col
                if (columnsToPreserveWidth[i] === true)
                {
                    var configuredWidth = this._getConfiguredColumnWidth(jqTable, i);
                    if (this._isDimensionAuto(configuredWidth))
                    {
                        this._setColumnRenderWidth(this.MIN_COLUMN_WIDTH + "px", i, jqTable);
                    }
                }
            }
        },

        //will set the width of the slave to be master+slave
        //slave will retain the units of the master.
        _mergeRowHeights: function (masterRowIndex, slaveRowIndex, jqTable)
        {
            var masterRawHeight = this._getConfiguredRowHeight(jqTable, masterRowIndex);
            var slaveRawHeight = this._getConfiguredRowHeight(jqTable, slaveRowIndex);
            var tableDimension = jqTable.outerHeight();
            var strMergedValue = this._mergeTwoDimensions(masterRawHeight, slaveRawHeight, jqTable, tableDimension);
            this._setRowRenderedHeight(strMergedValue, masterRowIndex, jqTable);
        },

        //get the width of the master if the 2 were to be merged
        _getMergedColumnWidth: function (masterColIndex, slaveColIndex, jqTable)
        {
            var masterRawWidth = this.getColumnWidth(jqTable, masterColIndex);
            var slaveRawWidth = this.getColumnWidth(jqTable, slaveColIndex);
            var tableDimension = jqTable.outerWidth();
            var strMergedValue = this._mergeTwoDimensions(masterRawWidth, slaveRawWidth, jqTable, tableDimension);
            return strMergedValue;
        },

        _getMergedColumnConfiguredWidth: function (masterColIndex, slaveColIndex, jqTable)
        {
            var masterRawWidth = this._getConfiguredColumnWidth(jqTable, masterColIndex);
            var slaveRawWidth = this._getConfiguredColumnWidth(jqTable, slaveColIndex);
            var tableDimension = jqTable.outerWidth();
            var strMergedValue = this._mergeTwoDimensions(masterRawWidth, slaveRawWidth, jqTable, tableDimension);
            return strMergedValue;
        },

        //will set the width of the slave to be master+slave
        //slave will retain the units of the master.
        //merges both the render and configured widths.
        _mergeColumnWidths: function (masterColIndex, slaveColIndex, jqTable)
        {
            var result = 0;
            result = this._mergeColumnRenderWidths(masterColIndex, slaveColIndex, jqTable);
            result = this._mergeColumnConfiguredWidths(masterColIndex, slaveColIndex, jqTable);
            return result;
        },

        //will set the width of the slave to be master+slave
        //slave will retain the units of the master.
        _mergeColumnRenderWidths: function (masterColIndex, slaveColIndex, jqTable)
        {
            var strMergedValue = this._getMergedColumnWidth(masterColIndex, slaveColIndex, jqTable);
            this._setColumnRenderWidth(strMergedValue, masterColIndex, jqTable);
            return strMergedValue;
        },

        //will set the width of the slave to be master+slave
        //slave will retain the units of the master.
        _mergeColumnConfiguredWidths: function (masterColIndex, slaveColIndex, jqTable)
        {
            var strMergedValue = this._getMergedColumnConfiguredWidth(masterColIndex, slaveColIndex, jqTable);
            this._setColumnConfiguredWidth(strMergedValue, masterColIndex, jqTable);
            return strMergedValue;
        },


        //will set the width of the slave to be master+slave
        //slave will retain the units of the master.
        _mergeTwoDimensions: function (masterRawDimension, slaveRawDimension, jqTable, tableDimension)
        {

            var masterUnits = this._getUnits(masterRawDimension);
            var slaveUnits = this._getUnits(slaveRawDimension);

            var masterValue = this._getRawNumberValue(masterRawDimension);
            var slaveValue = this._getRawNumberValue(slaveRawDimension);

            var defaultAutoDimension = (this.isRenderedAsTable(jqTable)) ? 'auto' : '1fr';
            var masterIsAuto = this._isDimensionAuto(masterRawDimension);
            var slaveIsAuto = this._isDimensionAuto(slaveRawDimension)

            var strMergedValue = "";
            if (masterUnits === slaveUnits)
            {
                strMergedValue = masterIsAuto ? defaultAutoDimension : (masterValue + slaveValue) + masterUnits;
            }
            else
            {
                //TODO: do the logic of combining a px with a % 
                if (!masterIsAuto && !slaveIsAuto)
                {
                    switch (slaveUnits)
                    {
                        case "%":
                            strMergedValue = (masterValue + (tableDimension * (slaveValue / 100))) + masterUnits;
                            break;
                        case "px":
                            strMergedValue = (masterValue + ((slaveValue / tableDimension) * 100)) + masterUnits;
                            break;
                    }
                }
                else
                {
                    //Deal with scenarios where one of the master/slave is auto.
                    if (masterIsAuto)
                    {
                        strMergedValue = defaultAutoDimension;
                    }
                    else
                    {
                        //TODO: do a w3C calculation based on the other cols to work out how wide the auto column is?
                        strMergedValue = masterValue + masterUnits;
                    }
                }
            }
            return strMergedValue;
        },

        _getSplitRowHeight: function (strstrRowHeight)
        {
            return this._getSplitDimension(strstrRowHeight);
        },

        _getSplitColumnWidth: function (strColumnWidth)
        {
            return this._getSplitDimension(strColumnWidth);
        },


        _getSplitDimension: function (strDimension)
        {
            var result = strDimension;

            var unit = this._getUnits(strDimension);
            var value = this._getRawNumberValue(strDimension);
            if (unit === "px" || unit === "%")
            {
                var newDimension = value / 2;
                result = newDimension + unit;
            }
            else
            {
                result = strDimension;
            }

            return result;
        },


        //NEW AND IMPROVED!
        //Cells must have unique IDs
        //reduce the colspans of the cells to match the number of <col>s there will be after deleting the un-needed cols.
        _fixColSpansBeforeRemovingCols: function (tableArray, colMergeDistances, jqTable)
        {
            //reduce the colspans on the <TD> that are about to have merged <col>s
            var totalRows = this._getRowCountInTableArray(tableArray);
            var totalCols = this._getColCountInTableArray(tableArray);
            var INITIAL_MERGEDISTANCE = totalCols;

            //Reduce the Colspan of this <TD> by 1 for every column ahead of it's colspan that is going to get deleted.
            var columnRemoved = 0;
            for (var colitemkey in colMergeDistances)
            {
                var colIndex = parseInt(colitemkey) - columnRemoved;
                var colMergeDistance = colMergeDistances[colitemkey];

                var isMergeableColumn = (colMergeDistance !== INITIAL_MERGEDISTANCE && colMergeDistance > 0);
                if (isMergeableColumn)
                {
                    var cellsUpdated = this._updateCellsAfterColumnIndex(colIndex, -1 * colMergeDistance, jqTable);
                    columnRemoved += colMergeDistance;
                }
            }
        },

        //Cells must have unique IDs
        //reduce the colspans of the cells to match the number of <col>s there will be after deleting the un-needed cols.
        _fixRowSpansBeforeRemovingRows: function (tableArray, rowMergeDistances, jqTable)
        {
            //reduce the colspans on the <TD> that are about to have merged <col>s
            var totalRows = this._getRowCountInTableArray(tableArray);
            var totalCols = this._getColCountInTableArray(tableArray);
            var INITIAL_MERGEDISTANCE = totalRows;

            //Reduce the Colspan of this <TD> by 1 for every column ahead of it's colspan that is going to get deleted.
            for (var rowitemkey in rowMergeDistances)
            {
                var rowIndex = parseInt(rowitemkey);
                var rowMergeDistance = rowMergeDistances[rowitemkey];

                var isMergeableRow = (rowMergeDistance !== INITIAL_MERGEDISTANCE && rowMergeDistance > 0);
                if (isMergeableRow)
                {
                    var cellsUpdated = this._updateCellsAfterRowIndex(rowIndex, -1* rowMergeDistance, jqTable);
                }
            }
        },

        //we don't use the id, as the tests won't have Ids/
        _getCellFromTableArrayCell: function (tableArrayCell, jqTable)
        {
            return jqTable.find("#" + tableArrayCell.id);
        },

        //gets a column at a certain index from an array of columnsInfo
        _getColumnFromColumnsObjectModel: function(allColumns, colIndex)
        {
            return this._getObjectFromAnObjectArray(allColumns, colIndex);
        },

        //gets a row at a certain index from an array of row
        _getRowFromRowsObjectModel: function(allRows,rowIndex)
        {
            return this._getObjectFromAnObjectArray(allRows, rowIndex);
        },

        //gets an object from an array of object that match to the index
        _getObjectFromAnObjectArray: function (objectArray, index)
        {
            var obj = null;
            for (var i = 0; i < objectArray.length; i++)
            {
                obj = objectArray[i];

                if (obj.index === index)
                {
                    break;
                }
            }

            return obj;
        },

        //remove the <col>s that can be removed
        //returns array of columnObjectModels for the columns that have been removed.
        _removeCols: function (jqTable, colMergeDistances)
        {
            var result = [];

            //remove the <COL> elements that are no longer needed.
            var colWidths = this._getConfiguredColumnWidths(jqTable);
            var INITIAL_MERGEDISTANCE = colWidths.length;
            var colsRemoved = 0;


            //get all of the columns existing before removing any.
            var columnObjectModels = this._buildColumnsObjectModel(jqTable);

            for (var colitemkey in colMergeDistances)
            {
                var colindex = parseInt(colitemkey);
                var colMergeDistance = colMergeDistances[colitemkey];

                var isMergeableColumn = (colMergeDistance !== INITIAL_MERGEDISTANCE && colMergeDistance > 0);
                if (isMergeableColumn)
                {
                    //remove <col>s to the right of this col, up to mergeDistance times.
                    for (var i = 0; i < colMergeDistance; i++)
                    {
                        var colIndexToRemove = colindex - colsRemoved + 1;
                        var originalColIndex = colIndexToRemove + colsRemoved + i;
                        var columnObjectModel = this._getColumnFromColumnsObjectModel(columnObjectModels, originalColIndex);
                        this._removeColumnDefinition(jqTable, colIndexToRemove);
                        
                        //result.push(colIndexToRemove + colsRemoved + i);
                        result.push(columnObjectModel);

                    }
                    colsRemoved += colMergeDistance;

                }
            }

            return result;
        },


        //remove the <col>s that can be removed
        _removeRows: function (jqTable, rowMergeDistances)
        {
            var result = [];

            //remove the <COL> elements that are no longer needed.
            var rowHeights = this._getRowConfiguredHeights(jqTable);
            var INITIAL_MERGEDISTANCE = rowHeights.length;
            var rowsRemoved = 0;

            //get all of the columns existing before removing any.
            var rowObjectModels = this._buildRowsObjectModel(jqTable);

            for (var rowitemkey in rowMergeDistances)
            {
                var rowindex = parseInt(rowitemkey);
                var rowMergeDistance = rowMergeDistances[rowitemkey];

                var isMergeableRow = (rowMergeDistance !== INITIAL_MERGEDISTANCE && rowMergeDistance > 0);
                if (isMergeableRow)
                {
                    //remove rows below this row, up to mergeDistance times.
                    for (var i = 0; i < rowMergeDistance; i++)
                    {
                        var rowIndexToRemove = rowindex - rowsRemoved + 1;
                        var originalRowIndex = rowIndexToRemove + rowsRemoved + i;
                        var rowObjectModel = this._getRowFromRowsObjectModel(rowObjectModels, originalRowIndex);
                        this._removeRowDefinition(jqTable, rowIndexToRemove);

                        result.push(rowObjectModel);

                    }
                    rowsRemoved += rowMergeDistance;
                }
            }

            //Grid's often won't have their rows set at all, and they must be set for
            //merging to work in all scenarios. style="grid-rows-template: auto auto auto"
            if (result.length === 0 && !this._isRenderedAsTable(jqTable))
            {
                this._renderGridRowConfiguredHeights(rowHeights, jqTable);
            }

            return result;
        },

        //get the configured column width for a single column (string)
        _getConfiguredColumnWidth: function (jqTable, colIndex)
        {
            var widths = this._getConfiguredColumnWidths(jqTable);
            var result = widths[colIndex];
            if (!checkExists(result)) result = 'auto';
            return result;
        },

        _getConfiguredRowHeight: function (jqTable, rowIndex)
        {
            var heights = this._getRowConfiguredHeights(jqTable);
            var result = heights[rowIndex];
            if (!checkExists(result)) result = 'auto';
            return result;
        },

        //NEW
        _getColCountInTableArray: function (tableArray)
        {
            var colCount = 0;
            for (var rowIndex = 0; rowIndex < tableArray.length; rowIndex++)
            {
                colCount = Math.max(colCount, tableArray[rowIndex].length);
            }
            return colCount;
        },

        //NEW
        _getRowCountInTableArray: function (tableArray)
        {
            return tableArray.length;
        },

        _getColumnCountForTable: function (jqTable)
        {
            return this._getColumnIdsForTable(jqTable).length;
        },

        _getColumnCountForGrid: function (jqGrid)
        {
            return this._getColumnIdsOnGrid(jqGrid).length;
        },

        _getRowCountForTable: function (jqTable)
        {
            return this._getRowIdsForTable(jqTable).length;
        },

        _getRowCountForGrid: function (jqGrid)
        {
            return this._getRowIdsOnGrid(jqGrid).length;
        },

        //returns an Array or jqElements, not a jqCollection
        //this is to maintain the order - jq.Add(jqELement) does not keep order so we have to use an array.
        //must return cells in order of columns in the row.
        _getCellsInRowIndex: function (jqTable, rowIndex, gridCellPositionInfo)
        {
            if (this._isRenderedAsTable(jqTable))
            {
                var jqRows = jqTable.find(">tbody>tr");
                //TODO: Needs to filter out/in cells based on previous rowspans?
                //Maybe using the tableArray will help here?
                return jqRows.eq(rowIndex).find(">td").toArray();
            }
            else
            {
                //note: grid cells will not be in order in the DOM!
                var arrayResult = [];
                var result = [];
                var children = jqTable[0].children;
                for (var i = 0; i < children.length; i++)
                {
                    var jqCell = $(children[i]);
                    var positions = (checkExists(gridCellPositionInfo)) ? gridCellPositionInfo[i] : SourceCode.Forms.TableHelper.getGridCellPositionInfo(jqTable, jqCell);
                    if (positions.rowIndex === rowIndex) arrayResult.push({ index: positions.colIndex, element: jqCell }); 
                }
                arrayResult = arrayResult.sort(function (a, b) { return a.index - b.index });
                for (var i = 0; i < arrayResult.length; i++)
                {
                    result.push(arrayResult[i].element);
                };
                return result;
            }
        },

        _getCellsInColIndex: function (jqTable, colIndex)
        {
            if (this._isRenderedAsTable(jqTable))
            {
                var jqRows = jqTable.find(">tbody>tr");
                //TODO: Needs to filter out/in cells based on previous colspans
                //Maybe using the tableArray will help here?
                return jqRows.find(">td:nth-child(" + colIndex + 1 + ")");
            }
            else
            {
                var jqCells = jqTable.find(">[col=" + colIndex + 1 + "]");
                return jqCells;
            }
        },

        //just removes a column definitionfrom a table, without side-effects on any cell's attributes.
        _removeColumnDefinition: function (jqTable, columnIndexToRemove)
        {
            if (this._isRenderedAsTable(jqTable))
            {
                //css table
                var jqCols = jqTable.find("> colgroup > col");
                jqCols.eq(columnIndexToRemove).remove();
            }
            else
            {
                //css grid
                var renderedWidths = this._getColumnRenderWidthsOnGrid(jqTable);
                var configuredWidths = this._getColumnConfiguredWidthsOnGrid(jqTable);
                var IdArray = this._getColumnIdsOnGrid(jqTable);

                renderedWidths.splice(columnIndexToRemove, 1);
                configuredWidths.splice(columnIndexToRemove, 1);
                IdArray.splice(columnIndexToRemove, 1);

                //keep the ids, widths, render withs in sync.
                this._setColumnRenderWidthsOnGrid(renderedWidths, jqTable);
                this._setColumnConfiguredWidthsOnGrid(configuredWidths, jqTable);
                this._setColumnIdsOnGrid(IdArray, jqTable);
            }
        },

        _removeRowDefinition: function (jqTable, rowIndexToRemove)
        {
            if (this._isRenderedAsTable(jqTable))
            {
                //css table
                var jqRows = jqTable.find("> tbody > tr");
                jqRows.eq(rowIndexToRemove).remove();
            }
            else
            {
                //css grid
                var renderedHeights = this._getRowRenderedHeightsOnGrid(jqTable);
                var configuredHeights = this._getRowConfiguredHeightsOnGrid(jqTable);
                var IdArray = this._getRowIdsOnGrid(jqTable);

                renderedHeights.splice(rowIndexToRemove, 1);
                configuredHeights.splice(rowIndexToRemove, 1);
                IdArray.splice(rowIndexToRemove, 1);

                //keep the ids, widths, render withs in sync.
                this._setRowRenderedHeightsOnGrid(renderedHeights, jqTable);
                this._setRowConfiguredHeightsOnGrid(configuredHeights, jqTable);
                this._setRowIdsOnGrid(IdArray, jqTable);
            }
        },

        _renderGridRowConfiguredHeights: function (strHeightArray, jqGrid)
        {
            var strRows = strHeightArray.join(" ").trim();
            jqGrid.css("grid-template-rows", strRows);

            this._setRowConfiguredHeightsOnGrid(strHeightArray, jqGrid);
        },

        _isRenderedAsTable: function (jqTable)
        {
            return !jqTable.hasClass("editor-grid");
        },

        //get "px" from "10.5px"
        _getUnits: function (strValue)
        {
            var strlower = strValue.toLowerCase();
            if (strlower.indexOf("px") > -1) return "px";
            if (strlower.indexOf("%") > -1) return "%";
            if (strlower.indexOf("auto") > -1 || strlower === "" || strlower === "1fr") return "auto";

            return "px";
        },

        //get 10.5 from "10.5px" or "10.5%"
        _getRawNumberValue: function (strValue)
        {
            var num = parseFloat(strValue);
            return typeof (num) === "number" ? num : null;
        }

        //#endregion
    };
})(jQuery);
